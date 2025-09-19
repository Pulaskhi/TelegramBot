const moment = require('moment')
const mongooseDb = require('../../models/mongoose')
const File = mongooseDb.File

exports.create = async (req, res) => {
  try {
    const result = await req.fileService.uploadFile(req.files, req.body.fileType)
    const fileType = req.body.fileType
    const entity = req.body.entity

    for (const filename of result) {
      await File.create({ entity, filename, fileType })
    }

    res.status(200).send(result)
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Algún error ha surgido al insertar el dato.',
      errors: error.errors
    })
  }
}

exports.findAll = async (req, res) => {
  try {
    const page = req.query.page || 1
    const limit = parseInt(req.query.size) || 10
    const offset = (page - 1) * limit
    const whereStatement = {}
    whereStatement.deletedAt = { $exists: false }
    whereStatement.fileType = req.query.fileType

    const result = await File.find(whereStatement)
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean()
      .exec()

    const count = await File.countDocuments(whereStatement)

    const response = {
      rows: result.map(doc => ({
        ...doc,
        id: doc._id,
        _id: undefined,
        createdAt: moment(doc.createdAt).format('YYYY-MM-DD HH:mm'),
        updatedAt: moment(doc.updatedAt).format('YYYY-MM-DD HH:mm')
      })),
      meta: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: page
      }
    }

    res.status(200).send(response)
  } catch (err) {
    res.status(500).send({
      message: err.message || 'Algún error ha surgido al recuperar los datos.'
    })
  }
}

exports.delete = async (req, res) => {
  const filename = req.params.filename
  const fileType = req.query.fileType

  try {
    await req.fileService.deleteFiles(filename, fileType)
    await File.deleteOne({ filename, fileType })

    res.status(200).send({
      message: 'El elemento ha sido borrado correctamente'
    })
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Algún error ha surgido al borrar el dato.'
    })
  }
}

exports.findOne = async (req, res) => {
  const fileName = req.params.filename
  const fileType = req.query.fileType

  const options = {
    root: __dirname + `../../../storage/${fileType}gallery/`,
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  }

  res.sendFile(fileName, options)
}

exports.getFile = async (req, res) => {
  const fileName = req.params.filename
  const fileType = req.query.fileType

  const options = {
    root: __dirname + `../../../storage/${fileType}/gallery/`,
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  }

  res.sendFile(fileName, options)
}