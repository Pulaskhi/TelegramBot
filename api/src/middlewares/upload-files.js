const multer = require('multer')

const uploadMiddleware = (req, res, next) => {
  const storage = multer.memoryStorage()
  const upload = multer({ storage })
  const uploadFiles = upload.fields([
    { name: 'file', maxCount: 1 }
  ])

  uploadFiles(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      res.status(500).send({ error: err.message })
    } else if (err) {
      res.status(500).send({ error: err.message })
    }

    next()
  })
}

module.exports = uploadMiddleware