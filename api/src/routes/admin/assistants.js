const fs = require("fs");
const path = require("path");
const router = require("express").Router();
const OpenAI = require("openai");

// ✅ Carga segura y universal de pdf-parse (compatible con cualquier versión)
let pdfParse;
try {
  const mod = require("pdf-parse");
  if (typeof mod === "function") pdfParse = mod;
  else if (typeof mod.default === "function") pdfParse = mod.default;
  else if (mod.pdfParse && typeof mod.pdfParse === "function") pdfParse = mod.pdfParse;
  else throw new Error("El módulo pdf-parse no exporta una función válida");
  console.log("✅ pdf-parse cargado correctamente (modo universal)");
} catch (err) {
  console.error("❌ No se pudo cargar pdf-parse:", err);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 📂 Directorios de trabajo
const galleryDir = path.join(__dirname, "../../storage/documents/gallery");
const testsDir = path.join(__dirname, "../../storage/tests");

// Asegura que exista la carpeta de tests
if (!fs.existsSync(testsDir)) {
  fs.mkdirSync(testsDir, { recursive: true });
  console.log("📁 Carpeta creada:", testsDir);
}

/**
 * POST /api/admin/assistants/pdf-questions-stored
 * Genera preguntas desde un PDF ya almacenado.
 * Body: { filename: string, save?: boolean }  // save=true => guarda el test a disco
 */
router.post("/pdf-questions-stored", async (req, res) => {
  const { filename, save } = req.body;

  try {
    if (!filename) {
      return res.status(400).json({ message: "Falta el nombre del archivo PDF" });
    }

    const filePath = path.join(galleryDir, filename);
    console.log("📂 Buscando archivo en:", filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Archivo no encontrado en storage/documents/gallery" });
    }

    if (!pdfParse || typeof pdfParse !== "function") {
      throw new Error("pdf-parse no está cargado correctamente");
    }

    // 📄 Leer PDF y extraer texto
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    console.log(`📄 PDF leído (${pdfData.text.length} caracteres)`);

    // 🧠 Prompt para OpenAI
    const prompt = `
Eres un asistente especializado en generar preguntas tipo test realistas para oposiciones de bomberos en España.
A partir del siguiente texto, genera 30 preguntas tipo test con 3 opciones de respuesta (A, B, C) y marca cuál es la correcta.
Devuelve solo JSON puro con este formato:
[
  {
    "pregunta": "texto de la pregunta",
    "opciones": ["A) ...", "B) ...", "C) ..."],
    "correcta": "A"
  }
]

Texto base:
"""${pdfData.text.slice(0, 10000)}"""
`;

    // 🤖 Llamada a OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "Eres un generador de tests para oposiciones de bomberos." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const rawOutput = completion.choices?.[0]?.message?.content || "";
    console.log("🧠 Respuesta OpenAI (primeros 400 chars):", rawOutput.slice(0, 400), "...");

    // 🧩 Limpieza robusta del JSON devuelto por OpenAI
    let questions = [];
    let cleaned = rawOutput
      .replace(/```json|```/gi, "")
      .replace(/\n+/g, " ")
      .replace(/\r/g, "")
      .replace(/\t/g, " ")
      .replace(/“|”/g, '"')
      .replace(/,\s*]/g, "]")
      .replace(/,\s*}/g, "}")
      .trim();

    try {
      questions = JSON.parse(cleaned);
    } catch (err) {
      console.error("⚠️ Error parseando JSON:", err.message);
      console.log("🧹 Intentando reparación de emergencia...");
      const lastBracket = cleaned.lastIndexOf("]");
      if (lastBracket !== -1) {
        cleaned = cleaned.slice(0, lastBracket + 1);
        try {
          questions = JSON.parse(cleaned);
        } catch (err2) {
          console.error("❌ Reparación fallida:", err2.message);
          return res.json({
            success: false,
            message: "Error al parsear preguntas (JSON incompleto)",
            rawOutput,
          });
        }
      } else {
        return res.json({
          success: false,
          message: "Error al parsear preguntas (sin cierre de array)",
          rawOutput,
        });
      }
    }

    console.log(`✅ Preguntas generadas: ${questions.length}`);

    // 💾 Guardar si se pide
    let savedFile = null;
    if (save === true) {
      const base = path.parse(filename).name;
      const outName = `${base}-${Date.now()}.json`;
      const outPath = path.join(testsDir, outName);

      fs.writeFileSync(outPath, JSON.stringify(questions, null, 2), "utf8");
      savedFile = outName;
      console.log("💾 Test guardado en:", outPath);
    }

    // ✅ Respuesta final
    res.json({ success: true, questions, file: savedFile });
  } catch (err) {
    console.error("❌ Error general en pdf-questions-stored:", err);
    res.status(500).json({
      message: "Error generando preguntas desde PDF",
      error: err.message,
    });
  }
});

/**
 * GET /api/admin/assistants/saved-tests
 * Lista los tests guardados (archivos .json en storage/tests)
 */
router.get("/saved-tests", (req, res) => {
  try {
    if (!fs.existsSync(testsDir)) {
      return res.json({ success: true, tests: [] });
    }
    const files = fs
      .readdirSync(testsDir)
      .filter((f) => f.toLowerCase().endsWith(".json"))
      .map((f) => {
        const full = path.join(testsDir, f);
        const stat = fs.statSync(full);
        return { name: f, size: stat.size, mtime: stat.mtime };
      })
      .sort((a, b) => b.mtime - a.mtime);

    res.json({ success: true, tests: files });
  } catch (err) {
    console.error("❌ Error listando tests:", err);
    res.status(500).json({ success: false, message: "No se pudieron listar los tests" });
  }
});

/**
 * GET /api/admin/assistants/saved-tests/:name
 * Devuelve el contenido (preguntas) de un test guardado
 */
router.get("/saved-tests/:name", (req, res) => {
  try {
    const { name } = req.params;
    const filePath = path.join(testsDir, name);

    if (!/\.json$/i.test(name)) {
      return res.status(400).json({ success: false, message: "Nombre inválido" });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "Archivo no encontrado" });
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    res.json({ success: true, questions: data });
  } catch (err) {
    console.error("❌ Error leyendo test guardado:", err);
    res.status(500).json({ success: false, message: "No se pudo leer el test" });
  }
});

module.exports = router;
