const OpenAI = require('openai')
const fs = require('fs')

module.exports = class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    this.assistantEndpoint = null
    this.threadId = null
    this.messages = null
    this.answer = null
  }

  /** ======================
   *      ASISTENTES
   * ====================== */
  async getAssistants() {
    const myAssistants = await this.openai.beta.assistants.list({
      order: 'desc',
      limit: '20'
    })
    return myAssistants.data
  }

  async setAssistant(assistantEndpoint) {
    this.assistantEndpoint = assistantEndpoint
  }

  /** ======================
   *        THREADS
   * ====================== */
  async createThread() {
    try {
      const thread = await this.openai.beta.threads.create()
      this.threadId = thread.id
    } catch (error) {
      console.error('Error creando thread:', error)
    }
  }

  setThread(threadId) {
    this.threadId = threadId
  }

  async createMessage(prompt) {
    try {
      await this.openai.beta.threads.messages.create(this.threadId, {
        role: 'user',
        content: prompt
      })

      this.run = await this.openai.beta.threads.runs.createAndPoll(
        this.threadId,
        { assistant_id: this.assistantEndpoint }
      )
    } catch (error) {
      console.error('Error creando mensaje:', error)
    }
  }

  async runStatus() {
    try {
      if (this.run.status === 'completed') {
        const messages = await this.openai.beta.threads.messages.list(this.run.thread_id)
        this.messages = messages.data
        this.answer = this.messages[0].content[0].text.value
        return
      }

      if (
        this.run.required_action &&
        this.run.required_action.submit_tool_outputs &&
        this.run.required_action.submit_tool_outputs.tool_calls
      ) {
        this.tools = this.run.required_action.submit_tool_outputs.tool_calls
        return
      }

      if (this.run.status === 'queued' || this.run.status === 'in_progress') {
        await this.sleep(2000)
        this.run = await this.openai.beta.threads.runs.retrieve(this.run.id, {
          thread_id: this.threadId
        })
        await this.runStatus()
      }
    } catch (error) {
      console.error('Error comprobando estado del run:', error)
    }
  }

  async submitToolOutputs(toolOutputs) {
    try {
      this.run = await this.openai.beta.threads.runs.submitToolOutputs(
        this.run.id,
        {
          thread_id: this.threadId,
          tool_outputs: toolOutputs
        }
      )
      await this.runStatus()
    } catch (error) {
      console.error('Error enviando tool outputs:', error)
    }
  }

  /** ======================
   *        PDF TOOLS
   * ====================== */

  /**
   * Sube un archivo PDF a OpenAI y devuelve su ID
   */
  async uploadFile(filePath) {
    try {
      const upload = await this.openai.files.create({
        file: fs.createReadStream(filePath),
        purpose: 'assistants'
      })
      return upload.id
    } catch (error) {
      console.error('Error subiendo archivo a OpenAI:', error)
      throw error
    }
  }

  /**
   * Genera preguntas a partir de un archivo subido
   */
// =======================================================
// GENERAR FLASHCARDS DESDE PREGUNTAS + TEMA + MNEMOTECNICAS
// =======================================================
// ============================================
//  ⚡ GENERAR FLASHCARDS DESDE PREGUNTAS
// ============================================
// ============================================
//  ⚡ GENERAR PREGUNTAS TIPO TEST DESDE TEXTO
// ============================================
async generateQuestionsFromText(text, tema = "SIN_TEMA") {
  const prompt = `
Eres un generador profesional de PREGUNTAS TIPO TEST para oposiciones de BOMBEROS.

🔍 TEMA: ${tema}

Tu tarea es generar preguntas variadas y de nivel competente:
- Definiciones
- Causas y consecuencias
- Ejemplos reales de emergencias
- Normativa / clasificaciones
- Datos numéricos importantes

⚠️ FORMATO OBLIGATORIO (SOLO JSON VÁLIDO):
[
  {
    "pregunta": "Texto claro",
    "opciones": ["A) ...", "B) ...", "C) ..."],
    "correcta": "A"
  }
]

Texto base para extraer ideas:
"""
${text}
"""
`.trim();

  const response = await this.openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.8,
    max_tokens: 2000,
    messages: [
      { role: "system", content: "Especialista en pedagogía para bomberos" },
      { role: "user", content: prompt }
    ]
  });

  let raw = response.choices?.[0]?.message?.content || "[]";
  raw = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("❌ JSON inválido devuelto por OpenAI:", raw);
    throw new Error("JSON de test mal formado");
  }
}

async generateFlashcardsFromQuestions(questions, tema = "") {
  try {
    const prompt = `
💡 TU MISIÓN:
Generar flashcards de ESTUDIO COMPLETO del tema **${tema}**.
Las preguntas del test son SOLO una pista de lo que es importante,
pero el objetivo es **explicar TODO EL TEMA** como si fuera un resumen profesional para opositores.

📌 DEBES CREAR 3 CAPAS DE FLASHCARDS:
1️⃣ CONCEPTOS PRINCIPALES del tema  
2️⃣ SUBTEMAS – procesos, clasificaciones, causas, efectos  
3️⃣ ALTO NIVEL – normativa, ejemplos reales, riesgos, aplicaciones en emergencias

🧠 Las claves de memoria deben ser:
- mnemotecnias VISUALES o auditivas
- acrónimos simples
- metáforas fáciles de recordar
- asociaciones mentales

⚠️ FORMATO OBLIGATORIO – SOLO JSON VÁLIDO:
[
  {
    "titulo": "título claro y corto",
    "explicacion": "explicación de 3–6 líneas, muy pedagógica",
    "clave_memoria": "truco REAL para recordarlo",
    "pregunta_rapida": "pregunta directa",
    "respuesta_corta": "respuesta precisa"
  }
]

📌 Preguntas de test para detectar lo importante del tema:
${JSON.stringify(questions, null, 2)}

NO GENERES flashcards de las preguntas directamente.
USA las preguntas como GUÍA para extraer conceptos clave del tema.
`.trim();

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [
        { role: "system", content: "Eres un experto en pedagogía y oposiciones de bomberos." },
        { role: "user", content: prompt }
      ]
    });

    let raw = response.choices?.[0]?.message?.content || "[]";
    raw = raw.replace(/```json|```/g, "").trim();

    // Validar JSON
    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.error("❌ JSON inválido devuelto por OpenAI:", raw);
      throw new Error("OpenAI devolvió un JSON mal formado");
    }

    return data; // 🔥 IMPORTANTE: aquí SI devuelve 👍

  } catch (err) {
    console.error("❌ Error en generateFlashcardsFromQuestions:", err);
    throw err;
  }
}

// ⚡ SOLO FLASHCARDS GENERALES (sin preguntas tipo test)
async generateFlashcardsFromTopicOnly(tema, textBase) {
  const prompt = `
Eres un especialista en pedagogía de oposiciones de BOMBEROS.

Tu misión:
RESUMIR el tema **${tema}** en forma de FLASHCARDS de estudio,
sin depender de preguntas tipo test, SOLO teoría clave bien explicada.

⚠️ FORMATO OBLIGATORIO (SOLO JSON VÁLIDO):
[
  {
    "titulo": "título claro",
    "explicacion": "explicación pedagógica del concepto",
    "clave_memoria": "truco real o mnemotecnia visual",
    "pregunta_rapida": "pregunta directa",
    "respuesta_corta": "respuesta precisa"
  }
]

Texto base del PDF:
"""${textBase}"""

Genera entre 15 y 25 flashcards, bien organizadas y variadas.
`.trim();

  const response = await this.openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.8,
    messages: [
      { role: "system", content: "Experto en pedagogía y memory training para oposiciones." },
      { role: "user", content: prompt }
    ]
  });

  let raw = response.choices?.[0]?.message?.content || "[]";
  raw = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("❌ JSON inválido devuelto por OpenAI:", raw);
    throw new Error("JSON de flashcards mal formado");
  }
}





  /** ======================
   *        UTILS
   * ====================== */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
