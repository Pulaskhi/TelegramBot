const mongooseDb = require('../../models/mongoose');
const Chat = mongooseDb.Chat;
const OpenAIService = require('../../services/openai-service');
const fs = require('fs');
const path = require('path');

/**
 * 📥 Obtener un chat por threadId (desde Mongo)
 */
exports.getChat = async (req, res) => {
  try {
    const { threadId } = req.params;
    const chat = await Chat.findOne({ threadId }).lean().exec();

    if (!chat) {
      return res.status(404).json({ message: 'Chat no encontrado' });
    }

    const response = chat.messages.map(msg => ({
      role: msg.role,
      content: msg.content?.[0]?.text?.value || ''
    }));

    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Error al obtener el chat:', error);
    res.status(500).json({ message: 'Error al obtener el chat' });
  }
};

/**
 * 🤖 Enviar mensaje al asistente y obtener respuesta
 */
exports.assistantResponse = async (req, res) => {
  try {
    const openai = new OpenAIService();
    const { prompt, threadId } = req.body;
    let escalateToHuman = false;

    // Crear o continuar hilo
    if (threadId) await openai.setThread(threadId);
    else await openai.createThread();

    await openai.setAssistant(process.env.OPENAI_ASSISTANT_CHATBOT_ID);
    await openai.createMessage(prompt);
    await openai.runStatus();

    // ⚙️ Si el asistente invoca alguna "tool"
    if (openai.tools) {
      const toolsOutputs = [];

      for (const tool of openai.tools) {
        const data = JSON.parse(tool.function.arguments || '{}');

        if (tool.function.name.includes('escalate_to_human')) {
          if (tool.function.name === 'escalate_to_human_due_to_user_behavior') {
            this.escalateToHumanUserBehavior(req, data.conversationContext, openai.threadId);
          } else {
            this.escalateToHumanNoAnswer(req, data.conversationContext, openai.threadId);
          }

          escalateToHuman = true;
          toolsOutputs.push({
            tool_call_id: tool.id,
            output: 'Un humano se va a incorporar a la conversación para ayudarte.'
          });
        }
      }

      if (toolsOutputs.length) await openai.submitToolOutputs(toolsOutputs);
    }

    // 💾 Guardar conversación en MongoDB
    const existingChat = await Chat.findOne({ threadId: openai.threadId });
    if (existingChat) {
      existingChat.messages = openai.messages;
      existingChat.run = openai.run;
      existingChat.markModified('messages');
      existingChat.markModified('run');
      await existingChat.save();
    } else {
      await Chat.create({
        assistantEndpoint: process.env.OPENAI_ASSISTANT_CHATBOT_ID,
        threadId: openai.threadId,
        run: openai.run,
        messages: openai.messages,
        deletedAt: null
      });
    }

    // 🧩 Intentar parsear JSON si es una respuesta estructurada
    let answer = openai.answer;
    try {
      answer = JSON.parse(answer);
    } catch (_) {}

    res.status(200).json({
      threadId: openai.threadId,
      escalateToHuman,
      answer
    });
  } catch (error) {
    console.error('❌ Error en assistantResponse:', error);
    res.status(500).json({ message: 'Error al obtener la respuesta del asistente' });
  }
};

/**
 * 📘 Generar preguntas tipo test desde un PDF ya almacenado
 * ✅ Esta versión garantiza 30 preguntas finales
 */
exports.generateQuestionsFromStoredPdf = async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ message: 'Debes indicar el nombre del archivo PDF' });
    }

    const openai = new OpenAIService();
    await openai.setAssistant(process.env.OPENAI_ASSISTANT_CHATBOT_ID);

    // Ruta del PDF en tu almacenamiento local
    const filePath = path.resolve(__dirname, '../storage/documents/gallery', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo no encontrado en storage/documents/gallery' });
    }

    // ☁️ Subir PDF a OpenAI
    const fileId = await openai.uploadFile(filePath);
    console.log(`📄 Archivo subido a OpenAI con ID: ${fileId}`);

    // 🧠 Generar 30 preguntas tipo test
    const answer = await openai.generateQuestionsFromFile(fileId);

    let questions;
    try {
      // Limpieza mejorada de JSON
      const cleaned = answer
        .replace(/^[\s\S]*?(\[)/, '$1') // elimina texto antes del primer [
        .replace(/(\])[\s\S]*$/, '$1')  // elimina texto después del último ]
        .replace(/```json|```/gi, '')
        .trim();

      questions = JSON.parse(cleaned);
    } catch (e) {
      console.warn('⚠️ No se pudo parsear JSON, devolviendo texto original');
      questions = answer;
    }

    // 🧮 Asegurar que haya exactamente 30 preguntas
    if (Array.isArray(questions) && questions.length < 30) {
      const remaining = 30 - questions.length;
      console.log(`⚠️ Solo generó ${questions.length} preguntas, pidiendo ${remaining} más...`);

      const extraAnswer = await openai.generateQuestionsFromFile(fileId, remaining, questions);
      try {
        const extraClean = extraAnswer
          .replace(/^[\s\S]*?(\[)/, '$1')
          .replace(/(\])[\s\S]*$/, '$1')
          .replace(/```json|```/gi, '')
          .trim();

        const extraParsed = JSON.parse(extraClean);

        const merged = [
          ...questions,
          ...extraParsed.filter(
            q => !questions.some(p => p.pregunta === q.pregunta)
          )
        ];

        questions = merged.slice(0, 30);
      } catch (err) {
        console.warn('⚠️ No se pudo parsear la segunda tanda de preguntas.');
      }
    }

    res.json({ success: true, questions });
  } catch (error) {
    console.error('❌ Error generando preguntas desde PDF almacenado:', error);
    res.status(500).json({
      message: 'Error generando preguntas desde PDF',
      error: error.message || 'Sin detalle'
    });
  }
};

/**
 * 📲 Reenviar mensaje del usuario al humano vía Telegram
 */
exports.relayUserMessage = async (req, res) => {
  try {
    const { message, threadId } = req.body;
    req.telegramService.relayUserMessage(threadId, message);
    res.status(200).json({ message: 'Mensaje reenviado al humano correctamente' });
  } catch (error) {
    console.error('❌ Error al reenviar mensaje al humano:', error);
    res.status(500).json({ message: 'Error al reenviar mensaje al humano' });
  }
};

/**
 * 🧑‍💼 Escalada manual a humano (invocada por el asistente)
 */
exports.escalateToHumanUserBehavior = (req, conversationContext, threadId) => {
  req.telegramService.escalateToHuman(threadId, conversationContext);
};

exports.escalateToHumanNoAnswer = (req, conversationContext, threadId) => {
  req.telegramService.escalateToHuman(threadId, conversationContext);
};
