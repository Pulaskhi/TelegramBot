module.exports = (mongoose) => {
  const schema = mongoose.Schema(
    {
      assistantName: String,
      assistantEndpoint: String,
      files: [
        {
          name: { type: String },
          languageAlias: { type: String },
          fileType: { type: String },
          filename: { type: String }
        }
      ],
      deletedAt: Date
    },
    { timestamps: true }
  )

  const Assistant = mongoose.model('Assistant', schema, 'assistants')
  return Assistant
}