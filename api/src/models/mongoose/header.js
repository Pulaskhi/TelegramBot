module.exports = (mongoose) => {
  // define que tipo de datos quieres
  const schema = mongoose.Schema(
    {
      title: String, // No se define el tipo de texto al contrario de MySQL
      isActive: {
        type: Boolean,
        default: true
      },
      deletedAt: Date
    },
    { timestamps: true }
  )

  const Header = mongoose.model('Header', schema, 'headers')
  return Header
}
