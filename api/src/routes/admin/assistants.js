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
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log("📁 Carpeta creada:", dir);
  }
}

// 🧩 Detecta tema desde el nombre del archivo
function detectarTema(filename) {
  const match = filename.match(/TEMA[-_\s]?(\d+)/i);
  if (match) return `TEMA-${match[1]}`;
  return "SIN_TEMA";
}

/**
 * POST /api/admin/assistants/pdf-questions-stored
 * 🧠 Genera preguntas tipo test a partir de un PDF
 */
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
    console.log(`📄 PDF leído (${fullText.length} caracteres)`);

    if (!fullText.length) {
      return res.status(400).json({ message: "El PDF no tiene texto extraíble" });
    }

    // 🔁 División segura del texto completo
    function chunkByChars(text, maxChars = 8000, overlap = 300) {
      const chunks = [];
      let start = 0;
      const total = text.length;
      while (start < total) {
        const end = Math.min(start + maxChars, total);
        chunks.push(text.slice(start, end));
        if (end >= total) break;
        start = Math.max(0, end - overlap);
      }
      return chunks;
    }

    const chunks = chunkByChars(fullText, 8000, 300);

    // 🧠 Prompt
    function buildPrompt(chunk, idx, total, perChunk) {
      return `
Eres un experto en oposiciones de BOMBEROS en España.
Genera ${perChunk} preguntas tipo test profesionales basadas en el siguiente texto técnico.
Formato JSON exacto:
[
  {
    "pregunta": "Texto de la pregunta",
    "respuestas": ["Opción 1", "Opción 2", "Opción 3"],
    "correcta": 2
  }
]
Texto base (${idx}/${total}):
"""${chunk}"""
`;
    }

    async function generateQuestionsFromChunk(chunk, idx, total, perChunk) {
      const prompt = buildPrompt(chunk, idx, total, perChunk);
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
      let cleaned = raw
        .replace(/```json|```/gi, "")
        .replace(/\r|\t/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();

      try {
        return JSON.parse(cleaned);
      } catch {
        const s = cleaned.indexOf("[");
        const e = cleaned.lastIndexOf("]");
        if (s !== -1 && e !== -1) {
          try {
            return JSON.parse(cleaned.slice(s, e + 1));
          } catch {}
        }
      }
      return [];
    }

    const targetTotal = 50;
    const perChunk = Math.max(1, Math.floor(targetTotal / chunks.length));
    let all = [];

    for (let i = 0; i < chunks.length; i++) {
      const partQs = await generateQuestionsFromChunk(chunks[i], i + 1, chunks.length, perChunk);
      all.push(...partQs);
    }

    // 🧽 Deduplicar
    const seen = new Set();
    const questions = [];
    for (const q of all) {
      const text = (q?.pregunta || "").trim().toLowerCase();
      if (text && !seen.has(text)) {
        seen.add(text);
        questions.push(q);
      }
    }

    const finalQs = questions.slice(0, targetTotal);

    // 💾 Guardar
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
      console.log(`💾 Test guardado en: ${savedFile}`);
    }

    // Normalizar para el frontend
    const normalized = (finalQs || []).map((q) => {
      const opciones = (q.respuestas || []).map(
        (r, i) => `${String.fromCharCode(65 + i)}) ${r}`
      );
      const correcta = ["A", "B", "C"][(q.correcta || 1) - 1] || "A";
      return { pregunta: q.pregunta, opciones, correcta };
    });

    res.json({ success: true, questions: normalized, file: savedFile });
  } catch (err) {
    console.error("❌ Error general:", err);
    res.status(500).json({ message: "Error generando preguntas", error: err.message });
  }
});

/**
 * GET /api/admin/assistants/saved-tests
 */
router.get("/saved-tests", (req, res) => {
  try {
    if (!fs.existsSync(testsRoot))
      return res.json({ success: true, temas: [] });

    const temas = [];

    const rootTests = fs
      .readdirSync(testsRoot)
      .filter((f) => f.toLowerCase().endsWith(".json"))
      .map((f) => {
        const full = path.join(testsRoot, f);
        const stat = fs.statSync(full);
        return { name: f, tema: "SIN_TEMA", size: stat.size, mtime: stat.mtime };
      });
    if (rootTests.length > 0) temas.push({ tema: "SIN_TEMA", tests: rootTests });

    fs.readdirSync(testsRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .forEach((dir) => {
        const folder = path.join(testsRoot, dir.name);
        const tests = fs
          .readdirSync(folder)
          .filter((f) => f.toLowerCase().endsWith(".json"))
          .map((f) => {
            const full = path.join(folder, f);
            const stat = fs.statSync(full);
            return { name: f, tema: dir.name, size: stat.size, mtime: stat.mtime };
          })
          .sort((a, b) => b.mtime - a.mtime);
        temas.push({ tema: dir.name, tests });
      });

    res.json({ success: true, temas });
  } catch (err) {
    console.error("❌ Error listando tests:", err);
    res.status(500).json({ success: false, message: "No se pudieron listar los tests" });
  }
});

/**
 * GET /api/admin/assistants/saved-tests/:tema/:name
 */
router.get("/saved-tests/:tema/:name", (req, res) => {
  try {
    const { tema, name } = req.params;
    const filePath = path.join(testsRoot, tema === "SIN_TEMA" ? "" : tema, name);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ success: false, message: "Archivo no encontrado" });

    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const questions = (raw || []).map((q) => {
      const opciones = (q.respuestas || q.opciones || []).map(
        (r, i) => `${String.fromCharCode(65 + i)}) ${r}`
      );
      const correcta = ["A", "B", "C"][(q.correcta || 1) - 1] || "A";
      return { pregunta: q.pregunta, opciones, correcta };
    });

    res.json({ success: true, questions });
  } catch (err) {
    console.error("❌ Error leyendo test guardado:", err);
    res.status(500).json({ success: false, message: "No se pudo leer el test" });
  }
});

/* ===========================================================
   💾 Sistema de entrenamiento (trained-tests y bad-tests)
   =========================================================== */

/**
 * POST /api/admin/assistants/save-trained
 */
router.post("/save-trained", (req, res) => {
  try {
    const { selectedQuestions, sourceTest, tema = "SIN_TEMA" } = req.body;
    if (!Array.isArray(selectedQuestions) || selectedQuestions.length === 0)
      return res.status(400).json({ success: false, message: "No hay preguntas seleccionadas" });

    const temaDir = path.join(trainedRoot, tema);
    if (!fs.existsSync(temaDir)) fs.mkdirSync(temaDir, { recursive: true });

    const baseName =
      (sourceTest ? path.parse(sourceTest).name : "custom") +
      "-trained-" +
      Date.now() +
      ".json";
    const outPath = path.join(temaDir, baseName);
    fs.writeFileSync(outPath, JSON.stringify(selectedQuestions, null, 2), "utf8");

    console.log(`💾 Preguntas útiles guardadas en: ${outPath}`);
    res.json({ success: true, file: path.join(tema, baseName) });
  } catch (err) {
    console.error("❌ Error guardando trained:", err);
    res.status(500).json({ success: false, message: "Error guardando trained" });
  }
});

/**
 * POST /api/admin/assistants/save-bad
 */
router.post("/save-bad", (req, res) => {
  try {
    const { selectedQuestions, sourceTest, tema = "SIN_TEMA" } = req.body;
    if (!Array.isArray(selectedQuestions) || selectedQuestions.length === 0)
      return res.status(400).json({ success: false, message: "No hay preguntas seleccionadas" });

    const temaDir = path.join(badRoot, tema);
    if (!fs.existsSync(temaDir)) fs.mkdirSync(temaDir, { recursive: true });

    const baseName =
      (sourceTest ? path.parse(sourceTest).name : "custom") +
      "-bad-" +
      Date.now() +
      ".json";
    const outPath = path.join(temaDir, baseName);
    fs.writeFileSync(outPath, JSON.stringify(selectedQuestions, null, 2), "utf8");

    console.log(`💾 Preguntas malas guardadas en: ${outPath}`);
    res.json({ success: true, file: path.join(tema, baseName) });
  } catch (err) {
    console.error("❌ Error guardando bad:", err);
    res.status(500).json({ success: false, message: "Error guardando bad" });
  }
});

/**
 * GET /api/admin/assistants/trained-tests
 */
router.get("/trained-tests", (req, res) => {
  try {
    if (!fs.existsSync(trainedRoot))
      return res.json({ success: true, temas: [] });

    const temas = fs.readdirSync(trainedRoot, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(dir => {
        const folder = path.join(trainedRoot, dir.name);
        const files = fs.readdirSync(folder)
          .filter(f => f.endsWith(".json"))
          .map(f => {
            const full = path.join(folder, f);
            const stat = fs.statSync(full);
            return { name: f, tema: dir.name, size: stat.size, mtime: stat.mtime };
          })
          .sort((a, b) => b.mtime - a.mtime);
        return { tema: dir.name, tests: files };
      });

    res.json({ success: true, temas });
  } catch (err) {
    console.error("❌ Error listando trained-tests:", err);
    res.status(500).json({ success: false, message: "No se pudieron listar los tests entrenados" });
  }
});

module.exports = router;
