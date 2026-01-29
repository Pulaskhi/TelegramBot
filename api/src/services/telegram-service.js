const TelegramBot = require('node-telegram-bot-api')
const { broadcast } = require('./websocket-service')

class TelegramService {
  constructor (telegramToken, groupId) {
    this.token = telegramToken
    this.groupId = parseFloat(groupId)
    this.sessionAnchors = new Map()
    this.userSessions = new Map()

    // Solo activar el bot si está en producción
    if (process.env.NODE_ENV === 'production') {
      this.bot = new TelegramBot(this.token, { polling: true })
      this.bot.on('message', (msg) => this.handleGroupMessage(msg))
      this.bot.onText(/\/start(?:\s+(.*))?/, (msg, match) => this.handleStart(msg, match))
    } else {
      this.bot = { sendMessage: async () => {}, on: () => {}, onText: () => {} }
    }
  }

  async escalateToHuman (threadId, preview) {
    const text =
      `🆘 Nuevo caso [${threadId}]\n` +
      `Último mensaje: ${preview || '—'}\n` +
      'Responde a este mensaje con *reply* para contestar al usuario.'

    const sent = await this.bot.sendMessage(this.groupId, text, { parse_mode: 'Markdown' })
    this.sessionAnchors.set(sent.message_id, threadId)
  }

  async handleGroupMessage (msg) {
    try {
      if (msg.chat.id !== this.groupId) return
      if (!msg.reply_to_message) return

      const anchorId = msg.reply_to_message.message_id
      const threadId = this.sessionAnchors.get(anchorId)

      if (!threadId) return

      const message = msg.text || '(adjunto)'

      // Broadcast to web client (if any)
      broadcast(threadId, {
        threadId,
        message
      })

      // If a Telegram user started a session for this thread, forward the admin reply to them
      const chatId = this.userSessions.get(threadId)
      if (chatId) {
        try {
          await this.bot.sendMessage(chatId, `👨‍💼 Respuesta del humano: ${message}`)
        } catch (e) {
          console.log('Error enviando mensaje al usuario de Telegram', e.message)
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  async handleStart (msg, match) {
    try {
      const chatId = msg.chat.id
      const payload = match && match[1] ? match[1].trim() : null

      if (!payload) {
        // No payload: just send a welcome message
        await this.bot.sendMessage(chatId, 'Bienvenido. Si tienes un enlace de asistencia, ábrelo desde el enlace proporcionado.')
        return
      }

      const threadId = payload

      // Store mapping so later we can forward messages from the admin group to this telegram chat
      this.userSessions.set(threadId, chatId)

      // Notify user and admin group
      await this.bot.sendMessage(chatId, '✅ Conexión establecida. Un humano se pondrá en contacto contigo en breve.')

      // Notify admin group (optional) so they know the user opened the bot
      await this.bot.sendMessage(this.groupId, `🔗 El usuario ${chatId} ha abierto el bot para el hilo [${threadId}].`, { reply_markup: { remove_keyboard: true } })
    } catch (e) {
      console.log('Error en handleStart:', e.message)
    }
  }

  /**
   * Enviar mensaje directo al usuario de Telegram asociado a un thread
   */
  async sendMessageToUser (threadId, text, options = {}) {
    const chatId = this.userSessions.get(threadId)
    if (!chatId) return false
    try {
      await this.bot.sendMessage(chatId, text, options)
      return true
    } catch (e) {
      console.log('Error enviando mensaje a usuario:', e.message)
      return false
    }
  }

  async relayUserMessage (threadId, text) {
    const anchorId = [...this.sessionAnchors.entries()]
      .find(([anchor, tId]) => tId === threadId)?.[0]

    if (!anchorId) return

    await this.bot.sendMessage(this.groupId, `👤 Usuario: ${text}`, {
      reply_to_message_id: anchorId
    })
  }
}

module.exports = TelegramService