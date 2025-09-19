const JSZip = require('jszip')
const fs = require('fs/promises')
const path = require('path')
const mongooseDb = require('../models/mongoose')
const File = mongooseDb.File

module.exports = class FileService {
  uploadFile = async (files, fileType) => {
    const result = []

    try {
      await fs.access(path.join(__dirname, `../storage/${fileType}/gallery`))
    } catch {
      await fs.mkdir(path.join(__dirname, `../storage/${fileType}/gallery`), { recursive: true })
      fs.writeFile(path.join(__dirname, `../storage/${fileType}/.gitignore`), '*\n!.gitignore')
    }

    for (const file of files.file) {
      try {
        const filename = file.originalname.replace(/[\s_]/g, '-')

        const newFilename = await fs.access(path.join(__dirname, `../storage/gallery/${fileType}/${path.parse(filename).name}${path.extname(filename)}`)).then(async () => { // TODO Dar al usuario la opción de sobreescribir la imagen
          return `${path.parse(filename).name}-${new Date().getTime()}${path.extname(filename)}`
        }).catch(async () => {
          return `${path.parse(filename).name}${path.extname(filename)}`
        })

        await fs.writeFile(path.join(__dirname, `../storage/${fileType}/gallery/${newFilename}`), file.buffer)

        result.push(newFilename)
      } catch (error) {
        console.log(error)
      }
    }

    return result
  }

  deleteFiles = async (filename, fileType) => {
    // TODO: Comprobar si algún elemento de la base de datos está usando el archivo
    try {
      await fs.unlink(path.join(__dirname, `../storage/${fileType}/gallery/${filename}`))
      return 1
    } catch {
      return 0
    }
  }

  decompressZip = async (filename, fileType, folderPath) => {
    const files = []
    const zip = new JSZip()
    const file = await fs.readFile(path.join(__dirname, `../storage/${fileType}/gallery/${filename}`))
    const zipFile = await zip.loadAsync(file)

    const completePath = path.join(__dirname, `../storage/${fileType}/${folderPath}`)

    try {
      await fs.access(completePath)
    } catch {
      await fs.mkdir(completePath, { recursive: true })
    }

    for (const file in zipFile.files) {
      if (!zipFile.files[file].dir) {
        const name = path.basename(zipFile.files[file].name).replace(/[\s_]/g, '-')
        await fs.writeFile(path.join(completePath, name), await zipFile.files[file].async('nodebuffer'))
        files.push({
          filename: name,
          folderPath: `${fileType}${folderPath}/${name}`
        })
      }
    }

    return files
  }

  attachFiles = async (filename, fileType, files) => {
    const document = await File.findOne({ filename, fileType })
    const existingFiles = document.filesAttached.map(file => file.filename)
    const newFiles = files.filter(file => !existingFiles.includes(file.filename))

    if (newFiles.length > 0) {
      await File.findOneAndUpdate(
        { filename, fileType },
        { $push: { filesAttached: { $each: newFiles } } },
        { new: true }
      )
    }
  }

  getFilesAttached = async (filename) => {
    const file = await File.findOne({
      filename
    })

    const result = file ? file.filesAttached.map(file => file) : []
    return result
  }
}