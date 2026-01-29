const express = require('express')
const router = express.Router()

router.use('/newsletter', require('./newsletter'))
router.use('/auth', require('./auth'))

module.exports = router
