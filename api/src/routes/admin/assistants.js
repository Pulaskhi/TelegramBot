const fs = require("fs");
const path = require("path");
const router = require("express").Router();
const OpenAI = require("openai");
const OpenAIService = require("../../services/openai-service");
const PDFStruct = require("../../services/pdf-structure-service");

// ✅ Carga universal de pdf-parse
let pdfParse;
try {
  const mod = require("pdf-parse");
  pdfParse = typeof mod === "function" ? mod : mod.default || mod.pdfParse;
  console.log("✅ pdf-parse cargado correctamente");
} catch (err) {
  console.error("❌ No se pudo cargar pdf-parse:", err);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 📂 Directorios
const galleryDir = path.join(__dirname, "../../storage/documents/gallery");
const testsRoot = path.join(__dirname, "../../storage/tests");
const trainedRoot = path.join(__dirname, "../../storage/trained-tests");
const badRoot = path.join(__dirname, "../../storage/bad-tests");
const flashcardsRoot = path.join(__dirname, "../../storage/flashcards");

// 🧱 Asegura estructura base
for (const dir of [testsRoot, trainedRoot, badRoot, flashcardsRoot]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// 🧩 Utilidades
function detectarTema(filename) {
  if (!filename || typeof filename !== 'string') return 'SIN_TEMA'

  const text = filename.toUpperCase()

  // Busca todas las ocurrencias tipo TEMA-<num> o TEMA<num>
  const re = /TEMA[-_\s]?(\d+)/ig
  const matches = []
  let m
  while ((m = re.exec(text)) !== null) {
    if (m[1]) matches.push(m[1])
  }

  if (matches.length) {
    // Escoge la coincidencia con más dígitos (evita emparejar '3' de timestamps, prefiere '13' o '103')
    const best = matches.sort((a, b) => b.length - a.length)[0]
    return `TEMA-${best}`
  }

  // Fallback: buscar la palabra "TEMA" seguida de cualquier número en el filename
  const re2 = /TEMA[^0-9]*(\d+)/i
  const m2 = text.match(re2)
  if (m2 && m2[1]) return `TEMA-${m2[1]}`

  return 'SIN_TEMA'
}

function letterFromIndex1(idx) {
  const i = Number(idx) - 1;
  return String.fromCharCode(65 + (isNaN(i) ? 0 : i));
}

function normalizeForTraining(q) {
  const pregunta = q?.pregunta || q?.question || q?.text || "Pregunta sin texto";
  const rawOptions = Array.isArray(q?.opciones)
    ? q.opciones
    : Array.isArray(q?.respuestas)
    ? q.respuestas
    : Array.isArray(q?.answers)
    ? q.answers
    : [];

  const opciones = {};
  rawOptions.forEach((opt, i) => {
    let text =
      typeof opt === "string"
        ? opt
        : opt?.label || opt?.text || opt?.value || "";
    text = text.trim().replace(/^[A-Za-z]\)\s*/g, "");
    const key = String.fromCharCode(65 + i);
    opciones[key] = text;
  });

  let correcta = q?.correcta ?? q?.correct ?? q?.correct_index ?? q?.answer ?? 1;
  if (typeof correcta === "number") correcta = letterFromIndex1(correcta);
  if (typeof correcta === "string") {
    const m = correcta.trim().match(/[A-Za-z]/);
    correcta = m ? m[0].toUpperCase() : "A";
  }

  const out = { pregunta, opciones, correcta };
  if (q?.comentario) out.comentario = String(q.comentario);
  return out;
}

// Heurística simple para asignar dificultad si el modelo no la devuelve
function estimateDifficulty(preguntaText, opciones) {
  if (!preguntaText) return 'media'
  const txt = preguntaText.toLowerCase()
  // palabras que suelen indicar mayor dificultad
  const hardKeywords = ['calcula', 'determine', 'razona', 'justifica', 'explica', 'según la normativa', 'normativa']
  const mediumKeywords = ['qué', 'cuál', 'indica', 'señala', 'mencione']

  if (hardKeywords.some(k => txt.includes(k))) return 'dificil'
  if (opciones && Object.keys(opciones).length >= 4 && preguntaText.length > 120) return 'dificil'
  if (mediumKeywords.some(k => txt.includes(k))) return 'media'
  return 'facil'
}

// Valida y normaliza preguntas devueltas por el modelo
function validateAndNormalizeGenerated(arr) {
  if (!Array.isArray(arr)) return []
  const out = []
  for (const q of arr) {
    try {
      const pregunta = q.pregunta || q.question || q.text || ''
      if (!pregunta || typeof pregunta !== 'string') continue

      // opciones: puede llegar como array o como objeto
      let opcionesObj = {}
      if (Array.isArray(q.respuestas) && q.respuestas.length) {
        q.respuestas.forEach((opt, i) => { opcionesObj[String.fromCharCode(65 + i)] = String(opt) })
      } else if (Array.isArray(q.respuestasText) && q.respuestasText.length) {
        q.respuestasText.forEach((opt, i) => { opcionesObj[String.fromCharCode(65 + i)] = String(opt) })
      } else if (Array.isArray(q.respuestasRaw) && q.respuestasRaw.length) {
        q.respuestasRaw.forEach((opt, i) => { opcionesObj[String.fromCharCode(65 + i)] = String(opt) })
      } else if (Array.isArray(q.respuestas) === false && Array.isArray(q.opciones)) {
        q.opciones.forEach((opt, i) => { opcionesObj[String.fromCharCode(65 + i)] = String(opt) })
      } else if (Array.isArray(q.opciones)) {
        q.opciones.forEach((opt, i) => { opcionesObj[String.fromCharCode(65 + i)] = String(opt) })
      } else if (q.opciones && typeof q.opciones === 'object') {
        // ya en formato {A:..,B:..}
        opcionesObj = Object.fromEntries(Object.entries(q.opciones).slice(0, 5).map(([k, v]) => [String(k).toUpperCase(), String(v)]))
      } else if (Array.isArray(q.respuestas) || Array.isArray(q.answers) || Array.isArray(q.answersText)) {
        const raw = q.respuestas || q.answers || q.answersText
        raw.forEach((opt, i) => { opcionesObj[String.fromCharCode(65 + i)] = String(opt) })
      }

      // fallback: if no opciones, skip
      if (!Object.keys(opcionesObj).length) continue

      // correcta: convertir a letra
      let correcta = q.correcta ?? q.correct ?? q.correct_index ?? q.answer ?? q.answer_index ?? null
      if (typeof correcta === 'number') correcta = String.fromCharCode(64 + Number(correcta)) // 1->A
      if (typeof correcta === 'string') {
        const m = correcta.trim().match(/[A-Za-z]/)
        correcta = m ? m[0].toUpperCase() : null
      }
      if (!correcta || !opcionesObj[correcta]) {
        // intentar inferir por posición 1-based
        if (typeof q.correcta === 'number' && q.correcta >= 1) correcta = String.fromCharCode(64 + q.correcta)
        else correcta = Object.keys(opcionesObj)[0]
      }

      // dificultad
      const dificultad = (q.dificultad || q.difficulty || q.level) ? String(q.dificultad || q.difficulty || q.level) : estimateDifficulty(pregunta, opcionesObj)

      out.push({ pregunta: String(pregunta), opciones: opcionesObj, correcta, dificultad })
    } catch (err) {
      // skip malformed
      continue
    }
  }
  return out
}

/* ===========================================================
   🧠 Generar preguntas desde PDF (mejorado y con variedad real)
   =========================================================== */
router.post("/pdf-questions-stored", async (req, res) => {
  const { filename, save } = req.body;
  // Allow overriding detected tema from client
  const temaOverride = req.body.tema || req.body.topic || null;

  try {
    if (!filename)
      return res.status(400).json({ message: "Falta el nombre del archivo PDF" });

    const filePath = path.join(galleryDir, filename);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ message: "Archivo no encontrado" });

    if (!pdfParse) throw new Error("pdf-parse no está disponible");

    console.log(`📘 Procesando PDF: ${filename}`);
    const dataBuffer = fs.readFileSync(filePath);
    // Use the PDF structure service which also detects simple lists and tables
    const pdfData = await PDFStruct.parsePDFBuffer(dataBuffer, filename);
    let fullText = (pdfData.text || "").trim();
    // Append detected lists and tables (CSV) to the text used for generation
    try {
      if (Array.isArray(pdfData.lists) && pdfData.lists.length) {
        const listsText = pdfData.lists.map((l, i) => `LISTA_${i + 1}: ${l.items.join(' | ')}`).join('\n');
        fullText += '\n\n' + 'DETALLE_LISTAS:\n' + listsText;
      }
      if (Array.isArray(pdfData.tables) && pdfData.tables.length) {
        const tablesText = pdfData.tables.map((t, i) => `TABLA_${i + 1}:\n${t.csv}`).join('\n\n');
        fullText += '\n\n' + 'DETALLE_TABLAS:\n' + tablesText;
      }
    } catch (e) {
      console.warn('⚠️ Error anexando listas/tablas al texto:', e.message);
    }
    if (!fullText.length)
      return res.status(400).json({ message: "El PDF no tiene texto extraíble" });

    let tema = temaOverride || detectarTema(filename);
    console.log(`📚 Tema detectado/elegido: ${tema} ${temaOverride ? '(override desde body)' : ''}`);

    // 1️⃣ Cargar feedback previo
    const trainedDir = path.join(trainedRoot, tema);
    const badDir = path.join(badRoot, tema);
    let trainedTests = [];
    let badTests = [];
    let savedTests = [];

    try {
      // load trained tests
      if (fs.existsSync(trainedDir)) {
        const files = fs.readdirSync(trainedDir).filter(f => f.endsWith(".json"));
        for (const f of files) {
          const raw = JSON.parse(fs.readFileSync(path.join(trainedDir, f), "utf8"));
          const preguntas = Array.isArray(raw) ? raw : raw.preguntas || [];
          trainedTests.push(...preguntas);
        }
      }
      // load bad tests
      if (fs.existsSync(badDir)) {
        const files = fs.readdirSync(badDir).filter(f => f.endsWith(".json"));
        for (const f of files) {
          const raw = JSON.parse(fs.readFileSync(path.join(badDir, f), "utf8"));
          const preguntas = Array.isArray(raw) ? raw : raw.preguntas || [];
          badTests.push(...preguntas);
        }
      }
      // load saved/generated tests (existing tests in testsRoot) to avoid duplicates
      const savedDir = path.join(testsRoot, tema);
      let savedTests = [];
      if (fs.existsSync(savedDir)) {
        const files = fs.readdirSync(savedDir).filter(f => f.endsWith('.json'));
        for (const f of files) {
          try {
            const raw = JSON.parse(fs.readFileSync(path.join(savedDir, f), 'utf8'));
            const preguntas = Array.isArray(raw) ? raw : raw.preguntas || [];
            savedTests.push(...preguntas);
          } catch (e) {
            // ignore parse errors for individual files
          }
        }
      }
      // Aleatoriza el orden del feedback
      trainedTests = trainedTests.sort(() => Math.random() - 0.5);
      badTests = badTests.sort(() => Math.random() - 0.5);
      savedTests = savedTests.sort(() => Math.random() - 0.5);

      console.log(`🧩 Feedback encontrado — Trained: ${trainedTests.length}, Saved: ${savedTests.length}, Bad: ${badTests.length}`);
    } catch (err) {
      console.warn(`⚠️ Error leyendo feedback previo: ${err.message}`);
    }

    // 2️⃣ Dividir PDF en fragmentos más seguros (por caracteres)
    function chunkByChars(text, maxChars = 6000, overlap = 200) {
      const chunks = [];
      let start = 0;
      while (start < text.length) {
        const end = Math.min(start + maxChars, text.length);
        chunks.push(text.slice(start, end));
        if (end >= text.length) break;
        start = Math.max(0, end - overlap);
      }
      return chunks;
    }

    const chunks = chunkByChars(fullText, 6000, 200);
    console.log(`✂️ PDF dividido en ${chunks.length} fragmentos.`);

    // 3️⃣ Timeout y reintentos automáticos
    async function withTimeout(promise, ms = 180000) {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("⏰ Timeout al generar preguntas")), ms)
      );
      return Promise.race([promise, timeout]);
    }

    // Intento más robusto: extraer conceptos clave del PDF
    async function extractKeyConcepts(text, maxConcepts = 20) {
      try {
        const prompt = `Extrae una lista de los conceptos, términos y subtemas más importantes del texto (sin explicaciones). Devuelve SOLO un JSON en formato: ["concepto1","concepto2",...]. Limítalo a máximo ${maxConcepts} ítems, ordenados por importancia.`;
        const completion = await withTimeout(
          openai.chat.completions.create({
            model: "gpt-4-turbo",
            temperature: 0.0,
            max_tokens: 800,
            messages: [
              { role: "system", content: `Eres un asistente que resume en conceptos clave para generar preguntas de examen.` },
              { role: "user", content: prompt + "\n\nTexto:\n" + text.slice(0, 15000) }
            ]
          }),
          30000
        );

        const raw = completion.choices?.[0]?.message?.content || "";
        const cleaned = raw.replace(/```json|```/gi, "").trim();
        const s = cleaned.indexOf("[");
        const e = cleaned.lastIndexOf("]");
        if (s !== -1 && e !== -1) {
          const arr = JSON.parse(cleaned.slice(s, e + 1));
          if (Array.isArray(arr) && arr.length) return arr.map(c => String(c).trim()).slice(0, maxConcepts);
        }
      } catch (err) {
        console.warn('⚠️ No se pudieron extraer conceptos:', err.message);
      }
      return [];
    }

    function snippetForConcept(text, concept, radius = 2000) {
      try {
        const idx = text.toLowerCase().indexOf(String(concept).toLowerCase());
        if (idx === -1) return text.slice(0, Math.min(text.length, radius));
        const start = Math.max(0, idx - radius);
        const end = Math.min(text.length, idx + radius);
        return text.slice(start, end);
      } catch (e) {
        return text.slice(0, Math.min(text.length, radius));
      }
    }

    async function generateQuestionsFromChunk(chunk, idx, total, perChunk, retries = 2, contextLabel = null) {
      const canary = `CANARY:${tema}:${Date.now() % 100000}`;
      // Build a compact but informative feedback prompt including sample trained/bad questions
      const trainedSample = trainedTests.slice(0, 20).map(q => `- ${q.pregunta}`).join("\n") || '(ninguna)';
      const badSample = badTests.slice(0, 12).map(q => `- ${q.pregunta}`).join("\n") || '(ninguna)';
      const savedSample = savedTests.slice(0, 20).map(q => `- ${q.pregunta}`).join("\n") || '(ninguna)';

      const feedbackPrompt = `
    Contexto del tema: "${tema}".

    HALLAZGOS PREVIOS:
    ✅ Preguntas ya entrenadas (no repitas, ni reformules en esencia):
    ${trainedSample}

    📦 Tests previamente generados y guardados (evítalos o reencuadralos):
    ${savedSample}

    ❌ Preguntas marcadas como malas (evita errores, ambigüedades o formatos incorrectos):
    ${badSample}

    Reglas claras para la generación:
    1) NO repitas preguntas existentes en las listas anteriores. Si la idea está muy cerca, cambia el enfoque o descártala.
    2) Devuelve SOLO JSON válido (sin explicaciones, sin código, sin texto adicional). Cualquier otro texto será ignorado.
    3) Genera preguntas variadas: comprensión, aplicación, normativa, cálculo sencillo, y casos prácticos.
    4) Cada pregunta debe tener exactamente 3-5 opciones y señalar la opción correcta con un índice o letra.
    5) Prioriza claridad y precisión en el enunciado; evita ambigüedades.
    6) Incluye un rango de dificultades (fácil/medio/difícil) repartido entre las preguntas.

    Objetivo: producir preguntas profesionales y no redundantes que amplíen la cobertura temática.
    `;

      const prompt = `
Eres un experto en la preparación de oposiciones de BOMBEROS en España.

Objetivo: generar ${perChunk} preguntas tipo test nuevas y profesionales para el tema "${tema}".
    Enfoque sugerido por área: "${contextLabel || 'general'}".

RESPUESTA OBLIGATORIA: Para facilitar el parseado, primero escribe exactamente: META: OK ${canary}
A continuación devuelve ÚNICAMENTE el JSON en una única respuesta, con el siguiente formato JSON válido:

[
  {"pregunta":"Texto claro y conciso","respuestas":["Opción A","Opción B","Opción C","Opción D"],"correcta":1,"dificultad":"media"}
]

Notas sobre contenido:
- Cada pregunta debe tener entre 3 y 5 opciones.
- El campo "correcta" es la posición (1-based) de la opción correcta.
- Añade el campo "dificultad" con uno de: "facil", "media", "dificil".
- Evita repetir ideas de las preguntas ya entrenadas o listadas como malas.

Texto base (${idx}/${total}):
"""${chunk}"""

${feedbackPrompt}
`.trim();

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`🚀 Enviando chunk ${idx}/${total} (intento ${attempt})...`);
          const completion = await withTimeout(
            openai.chat.completions.create({
              model: "gpt-4-turbo",
              temperature: 0.7,
              max_tokens: 2500,
              messages: [
                {
                  role: "system",
                  content: `Eres un profesor examinador experto en oposiciones de Bombero. Tu objetivo es producir preguntas tipo examen de alta calidad, desafiantes, precisas y no redundantes. ` +
                    `Cada pregunta debe ser adecuada para una prueba de oposición: enunciados técnicos claros, distractores plausibles y una única respuesta correcta. ` +
                    `Devuelve siempre JSON válido y estrictamente en el formato solicitado por la API. Si el prompt incluye ejemplos, utilízalos como guía de formato, no como contenido para repetir.`
                },
                { role: "user", content: prompt },
              ],
            }),
            180000
          );

          console.log(`✅ Respuesta recibida del chunk ${idx}/${total}`);
          const raw = completion.choices?.[0]?.message?.content || "";
          const cleaned = raw.replace(/```json|```/gi, "").trim();
          const s = cleaned.indexOf("[");
          const e = cleaned.lastIndexOf("]");
          if (s !== -1 && e !== -1) {
            const arr = JSON.parse(cleaned.slice(s, e + 1));
            console.log(`✅ Chunk ${idx}: ${arr.length} preguntas generadas.`);
            return arr;
          }
        } catch (err) {
          console.error(`❌ Error en chunk ${idx} intento ${attempt}:`, err.message);
          if (attempt < retries) {
            console.log(`🔁 Reintentando chunk ${idx}...`);
            await new Promise(r => setTimeout(r, 3000));
          } else {
            console.warn(`⚠️ Chunk ${idx} falló tras ${retries} intentos.`);
          }
        }
      }
      return [];
    }

    // 4️⃣ Procesar: extraer conceptos y generar por concepto para cubrir todo el tema
    const targetTotal = 50;
    let all = [];

    try {
      const concepts = await extractKeyConcepts(fullText, 20);
      if (Array.isArray(concepts) && concepts.length) {
        console.log(`🔎 Conceptos extraídos: ${concepts.length}`);
        const perConcept = Math.max(1, Math.floor(targetTotal / concepts.length));
        for (let i = 0; i < concepts.length; i++) {
          const concept = concepts[i];
          const snippet = snippetForConcept(fullText, concept, 2500);
          const qs = await generateQuestionsFromChunk(snippet, i + 1, concepts.length, perConcept, 2, concept);
          all.push(...qs);
        }
      } else {
        // Fallback: generación por chunks si no conseguimos conceptos
        const perChunk = Math.max(1, Math.floor(targetTotal / chunks.length));
        for (let i = 0; i < chunks.length; i++) {
          const qs = await generateQuestionsFromChunk(chunks[i], i + 1, chunks.length, perChunk);
          all.push(...qs);
        }
      }
    } catch (err) {
      console.warn('⚠️ Error generando por conceptos, usando chunks como fallback:', err.message);
      const perChunk = Math.max(1, Math.floor(targetTotal / chunks.length));
      for (let i = 0; i < chunks.length; i++) {
        const qs = await generateQuestionsFromChunk(chunks[i], i + 1, chunks.length, perChunk);
        all.push(...qs);
      }
    }

    console.log(`🧮 Total bruto generado: ${all.length}`);

    // 5️⃣ Limpiar duplicados y validar/enriquecer preguntas
    const seen = new Set();
    // Primero validar y normalizar la salida del modelo
    const validated = validateAndNormalizeGenerated(all);

    const finalQs = validated.filter(q => {
      const text = (q?.pregunta || "").trim().toLowerCase();
      if (!text || seen.has(text)) return false;
      seen.add(text);
      return true;
    }).slice(0, targetTotal);

    console.log(`📊 Total final tras limpieza: ${finalQs.length}`);

    // 6️⃣ Guardar test en el formato solicitado
    let savedFile = null;
    let savedObject = null;
    if (save === true) {
      const temaDir = path.join(testsRoot, tema);
      if (!fs.existsSync(temaDir)) fs.mkdirSync(temaDir, { recursive: true });
      const base = path.parse(filename).name;
      const outName = `${base}-${Date.now()}.json`;
      const outPath = path.join(temaDir, outName);

      // convertir cada pregunta al formato requerido: {pregunta, opciones: {A:..,B:..}, correcta: "D"}
      const toLetter = (i) => String.fromCharCode(65 + (Number(i) - 1));
      const mapQuestion = (q) => {
        const pregunta = q.pregunta || q.question || q.text || '';

        // Build opciones object from multiple possible shapes (object or arrays)
        let opcionesObj = {};

        // Case: q.opciones provided as an object {A: '...', B: '...'}
        if (q.opciones && typeof q.opciones === 'object' && !Array.isArray(q.opciones)) {
          opcionesObj = Object.fromEntries(
            Object.entries(q.opciones)
              .slice(0, 5)
              .map(([k, v]) => [String(k).toUpperCase(), String(v)])
          );
        } else {
          const rawOptions = Array.isArray(q.opciones)
            ? q.opciones
            : Array.isArray(q.respuestas)
            ? q.respuestas
            : Array.isArray(q.answers)
            ? q.answers
            : [];

          rawOptions.forEach((opt, idx) => {
            const key = String.fromCharCode(65 + idx); // A, B, C...
            opcionesObj[key] = typeof opt === 'string' ? opt : (opt?.label || opt?.text || opt?.value || '');
          });
        }

        // determinar correcta como letra
        let correcta = q.correcta ?? q.correct ?? q.correct_index ?? q.answer ?? q.answer_index ?? null;
        if (typeof correcta === 'number') correcta = toLetter(correcta);
        if (typeof correcta === 'string') {
          const m = correcta.trim().match(/[A-Za-z]/);
          correcta = m ? m[0].toUpperCase() : null;
        }

        // fallback to first option if missing
        const finalCorrecta = correcta || Object.keys(opcionesObj)[0] || 'A';

        // Include dificultad if available or estimate it
        const dificultad = (q.dificultad || q.difficulty || q.level) ? String(q.dificultad || q.difficulty || q.level) : estimateDifficulty(pregunta, opcionesObj);

        return {
          pregunta: String(pregunta),
          opciones: opcionesObj,
          correcta: finalCorrecta,
          dificultad
        };
      };

      const preguntas = finalQs.map(mapQuestion);

      savedObject = {
        tema,
        fecha: new Date().toISOString(),
        feedback: '',
        preguntas
      };

      fs.writeFileSync(outPath, JSON.stringify(savedObject, null, 2), 'utf8');
      savedFile = path.join(tema, outName);
      console.log(`💾 Test guardado en: ${outPath}`);
    }

    // Opción: auto-entrenar (guardar como trained) si el cliente lo solicita
    if (req.body.autoTrain === true && finalQs.length) {
      try {
        const trainedDir2 = path.join(trainedRoot, tema);
        if (!fs.existsSync(trainedDir2)) fs.mkdirSync(trainedDir2, { recursive: true });
        const trainedName = `${path.parse(filename).name}-autotrain-${Date.now()}.json`;
        const trainedPath = path.join(trainedDir2, trainedName);
        // Guardar sólo las preguntas normalizadas (sin metadata extra)
        fs.writeFileSync(trainedPath, JSON.stringify({ tema, preguntas: finalQs, feedback: 'auto-train' }, null, 2), 'utf8');
        console.log(`🔁 Auto-train guardado en: ${trainedPath}`);
      } catch (err) {
        console.warn('⚠️ No se pudo guardar auto-train:', err.message);
      }
    }

    const normalized = finalQs.map(normalizeForTraining);
    // devolver la estructura normalizada para uso inmediato y, si guardamos, también el objeto completo
    res.json({ success: true, questions: normalized, file: savedFile, saved: savedObject });
  } catch (err) {
    console.error("❌ Error general:", err);
    res.status(500).json({ message: "Error generando preguntas", error: err.message });
  }
});

/* ===========================================================
   ⚡ Generar FLASHCARDS desde PDF y guardarlas en carpeta
   =========================================================== */
// ⚡ CREAR FLASHCARDS A PARTIR DE UN TEST GUARDADO
router.post('/flashcards-from-test', async (req, res) => {
  try {
    console.log("📩 BODY recibido en /flashcards-from-test:", req.body);

    let { tema, test, testFile } = req.body;

    // Permitir también formato "TEMA-9/archivo.json"
    if (testFile) {
      const parts = testFile.split("/");
      tema = parts[0];
      test = parts[1];
    }

    if (!tema || !test) {
      return res.status(400).json({
        success: false,
        message: "Faltan el tema o el nombre del test"
      });
    }

    const testPath = path.join(testsRoot, tema, test);
    if (!fs.existsSync(testPath)) {
      return res.status(404).json({ success: false, message: "Test no encontrado" });
    }

    const questionsRaw = fs.readFileSync(testPath, 'utf8');
    const parsed = JSON.parse(questionsRaw);
    const questions = Array.isArray(parsed) ? parsed : parsed.preguntas || [];

    if (!questions.length) {
      return res.status(400).json({ success: false, message: "El test no contiene preguntas" });
    }

    // 🧠 AQUÍ EL CAMBIO IMPORTANTE 👉 le pasamos también el tema
    const openai = new OpenAIService();
        // Usamos SOLO el contenido original del PDF para resumir
    const textBase = questions.map(q => q.pregunta).join("\n");

    const flashcards = await openai.generateFlashcardsFromTopicOnly(tema, textBase);


    const folder = path.join(flashcardsRoot, tema);
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

    const fileName = `${Date.now()}-flashcards.json`;
    const outPath = path.join(folder, fileName);
    fs.writeFileSync(outPath, JSON.stringify(flashcards, null, 2), 'utf8');

    return res.json({
      success: true,
      message: "Flashcards generadas correctamente",
      file: `flashcards/${tema}/${fileName}`,
      tema,          // 👈 también lo devolvemos por si lo quieres en el front
      flashcards
    });

  } catch (err) {
    console.error('❌ Error en /flashcards-from-test:', err);
    return res.status(500).json({
      success: false,
      message: "Error generando flashcards",
      error: err.message
    });
  }
});



/* ===========================================================
   💾 Guardar entrenados (útiles) y malos (con comentario)
   =========================================================== */
router.post("/save-trained", (req, res) => {
  try {
    const { selectedQuestions, sourceTest, tema = "SIN_TEMA", feedback = "" } = req.body;
    if (!Array.isArray(selectedQuestions) || !selectedQuestions.length)
      return res.status(400).json({ success: false, message: "No hay preguntas seleccionadas" });

    const temaDir = path.join(trainedRoot, tema);
    if (!fs.existsSync(temaDir)) fs.mkdirSync(temaDir, { recursive: true });

    const files = fs.readdirSync(temaDir).filter(f => f.endsWith(".json"));
    const latest = files.sort((a, b) =>
      fs.statSync(path.join(temaDir, b)).mtime - fs.statSync(path.join(temaDir, a)).mtime
    )[0];

    let all = [];
    if (latest) {
      try {
        const oldData = JSON.parse(fs.readFileSync(path.join(temaDir, latest), "utf8"));
        all = Array.isArray(oldData) ? oldData : oldData.preguntas || [];
      } catch {}
    }

    const normalized = selectedQuestions.map(normalizeForTraining);
    const seen = new Set(all.map(q => (q.pregunta || "").trim().toLowerCase()));
    normalized.forEach(q => {
      const key = (q.pregunta || "").trim().toLowerCase();
      if (!seen.has(key)) {
        all.push(q);
        seen.add(key);
      }
    });

    const outName = latest || `${(sourceTest ? path.parse(sourceTest).name : "custom")}-trained-${Date.now()}.json`;
    const outPath = path.join(temaDir, outName);
    fs.writeFileSync(outPath, JSON.stringify({ tema, preguntas: all, feedback }, null, 2), "utf8");
    console.log(`💾 Preguntas útiles actualizadas en: ${outPath}`);
    res.json({ success: true, file: path.join(tema, outName), total: all.length });
  } catch (err) {
    console.error("❌ Error guardando trained:", err);
    res.status(500).json({ success: false, message: "Error guardando trained" });
  }
});

router.post("/save-bad", (req, res) => {
  try {
    const { selectedQuestions, sourceTest, tema = "SIN_TEMA", feedback = "" } = req.body;
    if (!Array.isArray(selectedQuestions) || !selectedQuestions.length)
      return res.status(400).json({ success: false, message: "No hay preguntas seleccionadas" });

    const temaDir = path.join(badRoot, tema);
    if (!fs.existsSync(temaDir)) fs.mkdirSync(temaDir, { recursive: true });

    const files = fs.readdirSync(temaDir).filter(f => f.endsWith(".json"));
    const latest = files.sort((a, b) =>
      fs.statSync(path.join(temaDir, b)).mtime - fs.statSync(path.join(temaDir, a)).mtime
    )[0];

    let all = [];
    if (latest) {
      try {
        const oldData = JSON.parse(fs.readFileSync(path.join(temaDir, latest), "utf8"));
        all = Array.isArray(oldData) ? oldData : oldData.preguntas || [];
      } catch {}
    }

    const normalized = selectedQuestions.map(q => normalizeForTraining({ ...q, comentario: q.comentario || "" }));
    const seen = new Set(all.map(q => (q.pregunta || "").trim().toLowerCase()));
    normalized.forEach(q => {
      const key = (q.pregunta || "").trim().toLowerCase();
      if (!seen.has(key)) {
        all.push(q);
        seen.add(key);
      }
    });

    const outName = latest || `${(sourceTest ? path.parse(sourceTest).name : "custom")}-bad-${Date.now()}.json`;
    const outPath = path.join(temaDir, outName);
    fs.writeFileSync(outPath, JSON.stringify({ tema, preguntas: all, feedback }, null, 2), "utf8");
    console.log(`💾 Preguntas malas actualizadas en: ${outPath}`);
    res.json({ success: true, file: path.join(tema, outName), total: all.length });
  } catch (err) {
    console.error("❌ Error guardando bad:", err);
    res.status(500).json({ success: false, message: "Error guardando bad" });
  }
});

/* ===========================================================
   📜 Listar tests guardados y entrenados
   =========================================================== */
router.get("/saved-tests", (req, res) => {
  try {
    if (!fs.existsSync(testsRoot)) return res.json({ success: true, temas: [] });

    const temas = fs.readdirSync(testsRoot).filter(f =>
      fs.statSync(path.join(testsRoot, f)).isDirectory()
    );

    const allTemas = temas.map(tema => {
      const dir = path.join(testsRoot, tema);
      const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
      const tests = files.map(file => ({
        name: file,
        url: `/api/admin/assistants/saved-tests/${tema}/${file}`
      }));
      return { tema, tests };
    });

    res.json({ success: true, temas: allTemas });
  } catch (err) {
    console.error("❌ Error listando saved-tests:", err);
    res.status(500).json({ success: false, message: "Error listando saved-tests" });
  }
});

router.get("/saved-tests/:tema/:name", (req, res) => {
  try {
    const { tema, name } = req.params;
    const filePath = path.join(testsRoot, tema, name);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ success: false, message: "Archivo no encontrado" });

    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const questions = Array.isArray(raw) ? raw : raw.preguntas || [];
    res.json({ success: true, questions });
  } catch (err) {
    console.error("❌ Error leyendo saved-test:", err);
    res.status(500).json({ success: false, message: "Error leyendo test" });
  }
});

router.get("/trained-tests", (req, res) => {
  try {
    if (!fs.existsSync(trainedRoot)) return res.json({ success: true, tests: [] });

    const temas = fs.readdirSync(trainedRoot).filter(f =>
      fs.statSync(path.join(trainedRoot, f)).isDirectory()
    );

    const allTests = temas.flatMap(tema => {
      const dir = path.join(trainedRoot, tema);
      const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
      return files.map(file => ({
        tema,
        name: file,
        url: `/api/admin/assistants/trained-tests/${tema}/${file}`,
      }));
    });

    res.json({ success: true, tests: allTests });
  } catch (err) {
    console.error("❌ Error listando trained-tests:", err);
    res.status(500).json({ success: false, message: "Error listando trained-tests" });
  }
});

router.get("/trained-tests/:tema/:name", (req, res) => {
  try {
    const { tema, name } = req.params;
    const filePath = path.join(trainedRoot, tema, name);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ success: false, message: "Archivo no encontrado" });

    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const data = Array.isArray(raw) ? { preguntas: raw } : raw;
    res.json({ success: true, questions: data.preguntas || [], feedback: data.feedback || "" });
  } catch (err) {
    console.error("❌ Error leyendo trained-test:", err);
    res.status(500).json({ success: false, message: "Error leyendo trained-test" });
  }
});

/* ===========================================================
   📜 Listar y leer FLASHCARDS
   =========================================================== */
router.get("/flashcards", (req, res) => {
  try {
    if (!fs.existsSync(flashcardsRoot)) {
      return res.json({ success: true, temas: [] });
    }

    const temas = fs.readdirSync(flashcardsRoot).filter(f =>
      fs.statSync(path.join(flashcardsRoot, f)).isDirectory()
    );

    const allTemas = temas.map(tema => {
      const dir = path.join(flashcardsRoot, tema);
      const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
      const flashcards = files.map(file => ({
        name: file,
        url: `/api/admin/assistants/flashcards/${tema}/${file}`
      }));
      return { tema, flashcards };
    });

    res.json({ success: true, temas: allTemas });
  } catch (err) {
    console.error("❌ Error listando flashcards:", err);
    res.status(500).json({ success: false, message: "Error listando flashcards" });
  }
});

router.get("/flashcards/:tema/:name", (req, res) => {
  try {
    const { tema, name } = req.params;
    const filePath = path.join(flashcardsRoot, tema, name);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "Archivo no encontrado" });
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    res.json({ success: true, flashcards: data });
  } catch (err) {
    console.error("❌ Error leyendo flashcards:", err);
    res.status(500).json({ success: false, message: "Error leyendo flashcards" });
  }
});

/* ===========================================================
   🔎 Generar FLASHCARDS a partir de todo el material disponible
   =========================================================== */
router.post('/flashcards-from-topic', async (req, res) => {
  try {
    const { tema } = req.body || {}
    const autoTrain = !!req.body?.autoTrain

    if (!tema || typeof tema !== 'string') return res.status(400).json({ success: false, message: 'Falta el campo tema' })

    console.log(`📩 Generando flashcards para tema: ${tema} (autoTrain=${autoTrain})`)

    // 1) recolectar texto desde tests guardados
    let textParts = []
    try {
      const temaDir = path.join(testsRoot, tema)
      if (fs.existsSync(temaDir)) {
        const files = fs.readdirSync(temaDir).filter(f => f.endsWith('.json'))
        for (const f of files) {
          try {
            const raw = fs.readFileSync(path.join(temaDir, f), 'utf8')
            const parsed = JSON.parse(raw)
            const preguntas = Array.isArray(parsed) ? parsed : parsed.preguntas || []
            preguntas.forEach(q => {
              if (q.pregunta) textParts.push(String(q.pregunta))
              if (q.opciones && typeof q.opciones === 'object') textParts.push(Object.values(q.opciones).join(' '))
            })
          } catch (e) { /* ignore file parse errors */ }
        }
      }
    } catch (err) { console.warn('⚠️ Error leyendo tests para tema:', err.message) }

    // 2) buscar PDFs en gallery que pertenezcan al tema y extraer texto
    try {
      if (fs.existsSync(galleryDir)) {
        const files = fs.readdirSync(galleryDir).filter(f => f.toLowerCase().endsWith('.pdf'))
        for (const f of files) {
          const detected = detectarTema(f)
          if (detected && detected.toUpperCase() === tema.toUpperCase()) {
            try {
              if (pdfParse) {
                const buf = fs.readFileSync(path.join(galleryDir, f))
                const pdfData = await pdfParse(buf)
                const txt = (pdfData && pdfData.text) ? String(pdfData.text).trim() : ''
                if (txt.length) textParts.push(txt)
              }
            } catch (e) { console.warn('⚠️ Error parseando PDF', f, e.message) }
          }
        }
      }
    } catch (err) { console.warn('⚠️ Error buscando PDFs en gallery:', err.message) }

    // 3) fallback: si no encontramos nada por nombre, intentar agregar todo el contenido de la carpeta tema si existe
    if (!textParts.length) {
      try {
        const temaDir = path.join(testsRoot, tema)
        if (fs.existsSync(temaDir)) {
          const files = fs.readdirSync(temaDir).filter(f => f.endsWith('.json'))
          for (const f of files) {
            try {
              const raw = fs.readFileSync(path.join(temaDir, f), 'utf8')
              textParts.push(raw)
            } catch (e) {}
          }
        }
      } catch (e) {}
    }

    if (!textParts.length) return res.status(400).json({ success: false, message: 'No se encontró material para este tema' })

    const textBase = textParts.join('\n\n').slice(0, 150000)

    const openai = new OpenAIService()
    const flashcards = await openai.generateFlashcardsFromTopicOnly(tema, textBase)

    // guardar en storage/flashcards/<tema>
    const folder = path.join(flashcardsRoot, tema)
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })
    const fileName = `${Date.now()}-flashcards.json`
    const outPath = path.join(folder, fileName)
    try {
      fs.writeFileSync(outPath, JSON.stringify(flashcards, null, 2), 'utf8')
    } catch (e) { console.warn('⚠️ No se pudo guardar flashcards:', e.message) }

    // opcional: si autoTrain, guardar una versión resumida en trained-tests para feedback
    if (autoTrain && Array.isArray(flashcards) && flashcards.length) {
      try {
        const trainedDir2 = path.join(trainedRoot, tema)
        if (!fs.existsSync(trainedDir2)) fs.mkdirSync(trainedDir2, { recursive: true })
        const trainedName = `flashcards-autotrain-${Date.now()}.json`
        const trainedPath = path.join(trainedDir2, trainedName)
        // convertir flashcards a preguntas sencillas (titulo -> pregunta)
        const preguntas = flashcards.map((c, i) => ({ pregunta: c.titulo || c.concepto || `Flashcard ${i + 1}`, opciones: [], correcta: null }))
        fs.writeFileSync(trainedPath, JSON.stringify({ tema, preguntas, source: 'flashcards-autotrain' }, null, 2), 'utf8')
      } catch (e) { console.warn('⚠️ No se pudo guardar autoTrain desde flashcards:', e.message) }
    }

    return res.json({ success: true, message: 'Flashcards generadas', tema, file: `flashcards/${tema}/${fileName}`, flashcards })
  } catch (err) {
    console.error('❌ Error en /flashcards-from-topic:', err)
    return res.status(500).json({ success: false, message: 'Error generando flashcards por tema', error: err.message })
  }
})

module.exports = router;
