module.exports = (mongoose) => {
  // define que tipo de datos quieres
  const schema = mongoose.Schema(
    {
      name: String, // No se define el tipo de texto al contrario de MySQL
      alias: String,
      selected: Boolean,
      default: Boolean,
      isActive: {
        type: Boolean,
        default: true
      },
      deletedAt: Date
    },
    { timestamps: true }
  )

  const Faq = mongoose.model('Laguages', schema, 'language')
  return Faq
}
