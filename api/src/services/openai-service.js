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
async generateQuestionsFromFile(fileId) {
  try {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Eres un asistente que genera preguntas tipo test basadas en documentos PDF. Devuelve un JSON con la estructura: [{"pregunta":"...","opciones":["A","B","C","D"],"correcta":"A"}]'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Genera preguntas tipo test sobre el contenido del siguiente archivo PDF.'
            },
            {
              type: 'file',
              file: { file_id: fileId } // ✅ CORREGIDO AQUÍ
            }
          ]
        }
      ]
    })

    return completion.choices[0].message.content
  } catch (error) {
    console.error('Error generando preguntas desde el archivo:', error)
    throw error
  }
}


  /** ======================
   *        UTILS
   * ====================== */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
