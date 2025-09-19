module.exports = (mongoose) => {
  const schema = mongoose.Schema(
    {
      entity: String,
      fileType: String,
      filename: String,
      filesAttached: {
        type: Array,
        default: () => []
      },
      deletedAt: Date
    },
    { timestamps: true }
  )

  const File = mongoose.model('File', schema, 'files')
  return File
}