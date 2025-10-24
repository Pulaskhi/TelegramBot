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
    let text = typeof opt === "string" ? opt : (opt?.label || opt?.text || opt?.value || "");
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
   🧠 Generar preguntas desde PDF
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

    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const fullText = (pdfData.text || "").trim();
    if (!fullText.length)
      return res.status(400).json({ message: "El PDF no tiene texto extraíble" });

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

    async function generateQuestionsFromChunk(chunk, idx, total, perChunk) {
      const prompt = `
Eres un experto en oposiciones de BOMBEROS en España.
Genera ${perChunk} preguntas tipo test basadas en este texto técnico.
Formato JSON exacto:
[
  {"pregunta":"Texto","respuestas":["Opción 1","Opción 2","Opción 3"],"correcta":2}
]
Texto base (${idx}/${total}):
"""${chunk}"""
`;
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        temperature: 0.5,
        max_tokens: 3500,
        messages: [
          { role: "system", content: "Eres un generador de tests técnicos de bomberos." },
          { role: "user", content: prompt },
        ],
      });

      const raw = completion.choices?.[0]?.message?.content || "";
      const cleaned = raw.replace(/```json|```/gi, "").trim();
      try {
        return JSON.parse(cleaned);
      } catch {
        const s = cleaned.indexOf("[");
        const e = cleaned.lastIndexOf("]");
        if (s !== -1 && e !== -1)
          try { return JSON.parse(cleaned.slice(s, e + 1)); } catch {}
      }
      return [];
    }

    const targetTotal = 50;
    const perChunk = Math.max(1, Math.floor(targetTotal / chunks.length));
    let all = [];

    for (let i = 0; i < chunks.length; i++) {
      const qs = await generateQuestionsFromChunk(chunks[i], i + 1, chunks.length, perChunk);
      all.push(...qs);
    }

    const seen = new Set();
    const questions = all.filter(q => {
      const text = (q?.pregunta || "").trim().toLowerCase();
      if (!text || seen.has(text)) return false;
      seen.add(text);
      return true;
    });

    const finalQs = questions.slice(0, targetTotal);
    let savedFile = null;

    if (save === true) {
      const tema = detectarTema(filename);
      const temaDir = path.join(testsRoot, tema);
      if (!fs.existsSync(temaDir)) fs.mkdirSync(temaDir, { recursive: true });
      const base = path.parse(filename).name;
      const outName = `${base}-${Date.now()}.json`;
      const outPath = path.join(temaDir, outName);
      fs.writeFileSync(outPath, JSON.stringify(finalQs, null, 2), "utf8");
      savedFile = path.join(tema, outName);
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
// ⭐ Guardar preguntas útiles
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
        all = Array.isArray(oldData) ? oldData : (oldData.preguntas || []);
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

    const data = {
      tema,
      fecha: new Date().toISOString(),
      feedback: feedback || oldFeedback,
      preguntas: all
    };

    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf8");
    console.log(`💾 Preguntas útiles actualizadas en: ${outPath}`);
    res.json({ success: true, file: path.join(tema, outName), total: all.length });
  } catch (err) {
    console.error("❌ Error guardando trained:", err);
    res.status(500).json({ success: false, message: "Error guardando trained" });
  }
});

// 👎 Guardar preguntas malas con comentario
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
        all = Array.isArray(oldData) ? oldData : (oldData.preguntas || []);
        oldFeedback = oldData.feedback || "";
      } catch {}
    }

    const normalized = selectedQuestions.map(q =>
      normalizeForTraining({ ...q, comentario: q.comentario || "" })
    );
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

    const data = {
      tema,
      fecha: new Date().toISOString(),
      feedback: feedback || oldFeedback,
      preguntas: all
    };

    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf8");
    console.log(`💾 Preguntas malas actualizadas en: ${outPath}`);
    res.json({ success: true, file: path.join(tema, outName), total: all.length });
  } catch (err) {
    console.error("❌ Error guardando bad:", err);
    res.status(500).json({ success: false, message: "Error guardando bad" });
  }
});

/* ===========================================================
   📜 Listar y leer tests generados (storage/tests)
   =========================================================== */
router.get("/saved-tests", (req, res) => {
  try {
    if (!fs.existsSync(testsRoot))
      return res.json({ success: true, temas: [] });

    const temas = fs.readdirSync(testsRoot).filter(f =>
      fs.statSync(path.join(testsRoot, f)).isDirectory()
    );

    const allTemas = temas.map(tema => {
      const dir = path.join(testsRoot, tema);
      const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
      const tests = files.map(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          url: `/api/admin/assistants/saved-tests/${tema}/${file}`,
        };
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
    const questions = Array.isArray(raw) ? raw : (raw.preguntas || []);
    res.json({ success: true, questions });
  } catch (err) {
    console.error("❌ Error leyendo saved-test:", err);
    res.status(500).json({ success: false, message: "Error leyendo test" });
  }
});

/* ===========================================================
   📜 Listar todos los tests entrenados disponibles
   =========================================================== */
router.get("/trained-tests", (req, res) => {
  try {
    if (!fs.existsSync(trainedRoot))
      return res.json({ success: true, tests: [] });

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
    const questions = Array.isArray(raw) ? raw.map(normalizeForTraining) : (raw.preguntas || []).map(normalizeForTraining);
    res.json({ success: true, questions, feedback: raw.feedback || "" });
  } catch (err) {
    console.error("❌ Error leyendo trained-test:", err);
    res.status(500).json({ success: false, message: "Error leyendo trained-test" });
  }
});

module.exports = router;
