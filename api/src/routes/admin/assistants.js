const fs = require("fs");
const path = require("path");
const router = require("express").Router();
const OpenAI = require("openai");

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

// 🧱 Asegura estructura base
for (const dir of [testsRoot, trainedRoot, badRoot]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// 🧩 Utilidades
function detectarTema(filename) {
  const match = filename?.match?.(/TEMA[-_\s]?(\d+)/i);
  return match ? `TEMA-${match[1]}` : "SIN_TEMA";
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

/* ===========================================================
   🧠 Generar preguntas desde PDF (mejorado y con variedad real)
   =========================================================== */
router.post("/pdf-questions-stored", async (req, res) => {
  const { filename, save } = req.body;

  try {
    if (!filename)
      return res.status(400).json({ message: "Falta el nombre del archivo PDF" });

    const filePath = path.join(galleryDir, filename);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ message: "Archivo no encontrado" });

    if (!pdfParse) throw new Error("pdf-parse no está disponible");

    console.log(`📘 Procesando PDF: ${filename}`);
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const fullText = (pdfData.text || "").trim();
    if (!fullText.length)
      return res.status(400).json({ message: "El PDF no tiene texto extraíble" });

    const tema = detectarTema(filename);
    console.log(`📚 Tema detectado: ${tema}`);

    // 1️⃣ Cargar feedback previo
    const trainedDir = path.join(trainedRoot, tema);
    const badDir = path.join(badRoot, tema);
    let trainedTests = [];
    let badTests = [];

    try {
      if (fs.existsSync(trainedDir)) {
        const files = fs.readdirSync(trainedDir).filter(f => f.endsWith(".json"));
        for (const f of files) {
          const raw = JSON.parse(fs.readFileSync(path.join(trainedDir, f), "utf8"));
          const preguntas = Array.isArray(raw) ? raw : raw.preguntas || [];
          trainedTests.push(...preguntas);
        }
      }
      if (fs.existsSync(badDir)) {
        const files = fs.readdirSync(badDir).filter(f => f.endsWith(".json"));
        for (const f of files) {
          const raw = JSON.parse(fs.readFileSync(path.join(badDir, f), "utf8"));
          const preguntas = Array.isArray(raw) ? raw : raw.preguntas || [];
          badTests.push(...preguntas);
        }
      }
      // Aleatoriza el orden del feedback
      trainedTests = trainedTests.sort(() => Math.random() - 0.5);
      badTests = badTests.sort(() => Math.random() - 0.5);

      console.log(`🧩 Feedback encontrado — Trained: ${trainedTests.length}, Bad: ${badTests.length}`);
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

    // Áreas temáticas aleatorias para variar el enfoque
    const focusAreas = [
      "normativa y legislación técnica",
      "principios físicos y químicos aplicados",
      "actuaciones operativas y protocolos",
      "análisis de materiales, propagación y calor",
      "medidas preventivas y seguridad"
    ];
    const focus = focusAreas[Math.floor(Math.random() * focusAreas.length)];

    async function generateQuestionsFromChunk(chunk, idx, total, perChunk, retries = 2) {
      const canary = `CANARY:${tema}:${Date.now() % 100000}`;
      const feedbackPrompt = `
Has generado preguntas anteriormente sobre el tema "${tema}".

✅ PREGUNTAS YA ENTRENADAS (no repitas ni reformules estas ideas):
${trainedTests.slice(0, 20).map(q => `- ${q.pregunta}`).join("\n")}

❌ PREGUNTAS MALAS (evita errores similares):
${badTests.slice(0, 10).map(q => `- ${q.pregunta}`).join("\n")}

Tu misión:
- Detectar **nuevos conceptos, relaciones o detalles técnicos** que aún no se hayan preguntado.
- Cubre aspectos complementarios: causas, consecuencias, clasificaciones, ejemplos prácticos, normativa o cálculos simples.
- Evita repetir literal o en esencia las preguntas anteriores.
- Varía el tipo de razonamiento: comprensión, aplicación, normativa, física o análisis operativo.
- Redacción formal y sin ambigüedades.
`;

      const prompt = `
Eres un experto en la preparación de oposiciones de BOMBEROS en España.

Genera ${perChunk} preguntas tipo test nuevas, variadas y de nivel profesional.
Enfoca especialmente en el ámbito: "${focus}".

Primero escribe "META: OK ${canary}" y luego devuelve ÚNICAMENTE el JSON con formato:

[
  {"pregunta":"Texto","respuestas":["Opción 1","Opción 2","Opción 3"],"correcta":2}
]

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
              temperature: 0.85,
              max_tokens: 2500,
              messages: [
                { role: "system", content: "Eres un generador de tests técnicos y pedagógicos de bomberos." },
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

    // 4️⃣ Procesar todos los fragmentos
    const targetTotal = 50;
    const perChunk = Math.max(1, Math.floor(targetTotal / chunks.length));
    let all = [];

    for (let i = 0; i < chunks.length; i++) {
      const qs = await generateQuestionsFromChunk(chunks[i], i + 1, chunks.length, perChunk);
      all.push(...qs);
    }

    console.log(`🧮 Total bruto generado: ${all.length}`);

    // 5️⃣ Limpiar duplicados
    const seen = new Set();
    const finalQs = all.filter(q => {
      const text = (q?.pregunta || "").trim().toLowerCase();
      if (!text || seen.has(text)) return false;
      seen.add(text);
      return true;
    }).slice(0, targetTotal);

    console.log(`📊 Total final tras limpieza: ${finalQs.length}`);

    // 6️⃣ Guardar test
    let savedFile = null;
    if (save === true) {
      const temaDir = path.join(testsRoot, tema);
      if (!fs.existsSync(temaDir)) fs.mkdirSync(temaDir, { recursive: true });
      const base = path.parse(filename).name;
      const outName = `${base}-${Date.now()}.json`;
      const outPath = path.join(temaDir, outName);
      fs.writeFileSync(outPath, JSON.stringify(finalQs, null, 2), "utf8");
      savedFile = path.join(tema, outName);
      console.log(`💾 Test guardado en: ${outPath}`);
    }

    const normalized = finalQs.map(normalizeForTraining);
    res.json({ success: true, questions: normalized, file: savedFile });
  } catch (err) {
    console.error("❌ Error general:", err);
    res.status(500).json({ message: "Error generando preguntas", error: err.message });
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

module.exports = router;
