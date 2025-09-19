const express = require('express')
const router = express.Router()
const uploadFiles = require('../../middlewares/upload-files.js')
const controller = require('../../controllers/admin/file-controller.js')

router.get('/file/:filename', controller.getFile)
router.post('/', uploadFiles, controller.create)
router.get('/', controller.findAll)
router.get('/:filename', controller.findOne)
router.delete('/:filename', controller.delete)


module.exports = router
