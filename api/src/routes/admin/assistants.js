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
   🧠 Generar preguntas desde PDF (con feedback previo y variaciones)
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

      console.log(`🧩 Feedback encontrado — Trained: ${trainedTests.length}, Bad: ${badTests.length}`);
    } catch (err) {
      console.warn(`⚠️ Error leyendo feedback previo de ${tema}:`, err.message);
    }

    // 2️⃣ Trocear el texto del PDF
    function chunkByChars(text, maxChars = 8000, overlap = 300) {
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

    const chunks = chunkByChars(fullText, 8000, 300);
    console.log(`✂️ PDF dividido en ${chunks.length} fragmentos.`);

    // 3️⃣ Generar preguntas con feedback + control de repeticiones
 // dentro de router.post("/pdf-questions-stored", async (req, res) => { ... })

async function generateQuestionsFromChunk(chunk, idx, total, perChunk) {
  // ➊ genera un canary para esta llamada
  const canary = `CANARY:${tema}:${Date.now() % 100000}`;

  console.log(`🧠 Enviando chunk ${idx}/${total} a OpenAI (máx ${perChunk} preguntas)...`);
  const feedbackPrompt = `
Tienes acceso a feedback previo del tema "${tema}":

✅ Ejemplos de preguntas útiles (trained-tests):
${JSON.stringify(trainedTests.slice(0, 20), null, 2)}

❌ Ejemplos de preguntas confusas o incorrectas (bad-tests):
${JSON.stringify(badTests.slice(0, 20), null, 2)}

Usa esta información para mejorar la calidad de las nuevas preguntas:
- Inspírate en las buenas (estructura, claridad, tipo de contenido)
- Evita errores comunes en las malas (ambigüedad, errores conceptuales, redacción confusa)
- Evita repetir literalmente preguntas existentes; reescribe enunciados o enfoque.
- Introduce preguntas nuevas cuando el contenido lo permita.
`;

  // ➋ Le pedimos al modelo que devuelva una línea META de confirmación
  const prompt = `
Eres un experto en oposiciones de BOMBEROS en España.
Genera ${perChunk} preguntas tipo test basadas en el texto y el feedback anterior.
Primero escribe una línea "META: OK ${canary} TRAINED=${trainedTests.length} BAD=${badTests.length}"
y DESPUÉS, en una línea nueva, el JSON EXACTO con SOLO el array de preguntas:

Formato del JSON exacto:
[
  {"pregunta":"Texto","respuestas":["Opción 1","Opción 2","Opción 3"],"correcta":2}
]

Texto base (${idx}/${total}):
"""${chunk}"""

${feedbackPrompt}
`.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    temperature: 0.5,
    max_tokens: 3500,
    messages: [
      { role: "system", content: "Eres un generador de tests técnicos de bomberos." },
      { role: "user", content: prompt },
    ],
  });

  // ➌ Log de uso de tokens si está disponible
  if (completion.usage) {
    console.log(`📏 Tokens — prompt:${completion.usage.prompt_tokens} completion:${completion.usage.completion_tokens} total:${completion.usage.total_tokens}`);
  }

  const raw = completion.choices?.[0]?.message?.content || "";
  // ➍ Log breve (primeras 200 chars) para ver que viene la META
  console.log(`🔎 Respuesta (head): ${raw.slice(0, 200).replace(/\n/g, ' ')}...`);

  // ➎ Extraer la línea META
  const metaMatch = raw.match(/^META:\s*OK\s*(CANARY:[^\s]+)\s*TRAINED=(\d+)\s*BAD=(\d+)/i);
  if (metaMatch) {
    console.log(`✅ META confirmada por el modelo — ${metaMatch[1]} TRAINED=${metaMatch[2]} BAD=${metaMatch[3]}`);
  } else {
    console.warn("⚠️ No se detectó línea META en la respuesta (puede que el modelo la omitiera, pero el feedback igualmente se envió).");
  }

  // ➏ Extraer el JSON (tu parser ya tolera texto antes/después)
  const cleaned = raw.replace(/```json|```/gi, "").trim();
  try {
    // intenta parsear cualquier JSON array que aparezca
    const s = cleaned.indexOf("[");
    const epos = cleaned.lastIndexOf("]");
    if (s !== -1 && epos !== -1) {
      const arr = JSON.parse(cleaned.slice(s, epos + 1));
      console.log(`✅ Chunk ${idx}: ${arr.length} preguntas generadas.`);
      return arr;
    }
  } catch (e) {
    console.error(`⚠️ Error parseando JSON del chunk ${idx}:`, e.message);
  }
  console.warn(`⚠️ Chunk ${idx} sin preguntas válidas.`);
  return [];
}


    const targetTotal = 50;
    const perChunk = Math.max(1, Math.floor(targetTotal / chunks.length));
    let all = [];

    for (let i = 0; i < chunks.length; i++) {
      const qs = await generateQuestionsFromChunk(chunks[i], i + 1, chunks.length, perChunk);
      all.push(...qs);
    }

    console.log(`🧮 Total bruto generado: ${all.length}`);

    // 4️⃣ Filtrar duplicados y limpiar
    const seen = new Set();
    const questions = all.filter(q => {
      const text = (q?.pregunta || "").trim().toLowerCase();
      if (!text || seen.has(text)) return false;
      seen.add(text);
      return true;
    });

    const finalQs = questions.slice(0, targetTotal);
    console.log(`📊 Total final tras limpieza: ${finalQs.length}`);

    // 5️⃣ Guardar
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
    let oldFeedback = "";
    if (latest) {
      try {
        const oldData = JSON.parse(fs.readFileSync(path.join(temaDir, latest), "utf8"));
        all = Array.isArray(oldData) ? oldData : oldData.preguntas || [];
        oldFeedback = oldData.feedback || "";
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

    const data = { tema, fecha: new Date().toISOString(), feedback: feedback || oldFeedback, preguntas: all };

    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf8");
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
    let oldFeedback = "";
    if (latest) {
      try {
        const oldData = JSON.parse(fs.readFileSync(path.join(temaDir, latest), "utf8"));
        all = Array.isArray(oldData) ? oldData : oldData.preguntas || [];
        oldFeedback = oldData.feedback || "";
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

    const data = { tema, fecha: new Date().toISOString(), feedback: feedback || oldFeedback, preguntas: all };

    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf8");
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
      const tests = files.map(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        return { name: file, size: stats.size, url: `/api/admin/assistants/saved-tests/${tema}/${file}` };
      });
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

    const allTests = [];
    temas.forEach(tema => {
      const dir = path.join(trainedRoot, tema);
      const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
      files.forEach(file => {
        allTests.push({
          tema,
          name: file,
          path: path.join(tema, file),
          url: `/api/admin/assistants/trained-tests/${tema}/${file}`,
        });
      });
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
    const questions = Array.isArray(raw)
      ? raw.map(normalizeForTraining)
      : (raw.preguntas || []).map(normalizeForTraining);
    res.json({ success: true, questions, feedback: raw.feedback || "" });
  } catch (err) {
    console.error("❌ Error leyendo trained-test:", err);
    res.status(500).json({ success: false, message: "Error leyendo trained-test" });
  }
});

module.exports = router;
