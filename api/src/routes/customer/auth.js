const express = require('express')
const router = express.Router()
const controller = require('../../controllers/customer/auth-controller')

router.post('/activate', controller.activate)
router.post('/login', controller.login)

module.exports = router
