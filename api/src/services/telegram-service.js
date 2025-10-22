const TelegramBot = require('node-telegram-bot-api')
const { broadcast } = require('./websocket-service')

class TelegramService {
  constructor (telegramToken, groupId) {
    this.token = telegramToken
    this.groupId = parseFloat(groupId)
    this.bot = new TelegramBot(this.token, { polling: true })
    this.sessionAnchors = new Map()

    this.bot.on('message', (msg) => this.handleGroupMessage(msg))
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

      broadcast(threadId, {
        threadId,
        message
      })
    } catch (e) {
      console.log(e)
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