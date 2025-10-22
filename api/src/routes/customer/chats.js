const express = require('express')
const router = express.Router()
const controller = require('../../controllers/customer/chat-controller.js')

router.post('/', controller.assistantResponse)
router.post('/human', controller.relayUserMessage)
router.get('/:threadId', controller.getChat)
router.post('/pdf-questions-stored', controller.generateQuestionsFromStoredPdf)

module.exports = router