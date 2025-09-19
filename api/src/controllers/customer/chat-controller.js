const mongooseDb = require('../../models/mongoose')
const Chat = mongooseDb.Chat
const OpenAIService = require('../../services/openai-service')

exports.assistantResponse = async (req, res) => {
  try {
    const openai = new OpenAIService()
    const prompt = req.body.prompt

    if (req.body.threadId) {
      await openai.setThread(req.body.threadId)
    } else {
      await openai.createThread()
    }

    await openai.setAssistant(process.env.OPENAI_ASSISTANT_CHATBOT_ID)
    await openai.createMessage(prompt)
    await openai.runStatus()

    if (openai.tools) {
      const toolsOutputs = []

      for (const tool of openai.tools) {
        const data = JSON.parse(tool.function.arguments)

        if (tool.function.name === 'escalate_to_human_due_to_user_behavior') {
          await this.escalateToHumanUserBehavior(data)
          toolsOutputs.push({
            tool_call_id: tool.id,
            output: 'Responder al usuario que espere un momento para ser atendido por un agente humano que tratará su consulta.'
          })
        }

        if (tool.function.name === 'escalate_to_human_no_answer') {
          await this.escalateToHumanNoAnswer(data)

          toolsOutputs.push({
            tool_call_id: tool.id,
            output: 'Responder al usuario que espere un momento para ser atendido por un agente humano que tratará su consulta.'
          })
        }
      }

      await openai.submitToolOutputs(toolsOutputs)
    }

    const chat = await Chat.findOne({ threadId: openai.threadId })

    if (chat) {
      chat.messages = openai.messages
      chat.run = openai.run
      chat.markModified('messages')
      chat.markModified('run')
      await chat.save()
    } else {
      await Chat.create({
        assistantEndpoint: process.env.OPENAI_ASSISTANT_CHATBOT_ID,
        threadId: openai.threadId,
        run: openai.run,
        messages: openai.messages,
        deletedAt: null
      })
    }

    const response = {
      threadId: openai.threadId,
      answer: JSON.parse(openai.answer)
    }

    res.status(200).send(response)
  } catch (error) {
    console.log(error)
  }
}

exports.escalateToHumanUserBehavior = async (data) => {
  console.log('escalateToHumanUserBehavior', data)
}

exports.escalateToHumanNoAnswer = async (data) => {
  console.log('escalateToHumanNoAnswer', data)
}