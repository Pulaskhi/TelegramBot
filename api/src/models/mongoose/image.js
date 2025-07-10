module.exports = (mongoose) => {
  // define que tipo de datos quieres
  const schema = mongoose.Schema(
    {
      filename: String, // No se define el tipo de texto al contrario de MySQL
      isActive: {
        type: Boolean,
        default: true
      },
      deletedAt: Date
    },
    { timestamps: true }
  )

  const Faq = mongoose.model('Image', schema, 'images')
  return Faq
}
