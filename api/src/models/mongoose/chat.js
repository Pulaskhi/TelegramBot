module.exports = (mongoose) => {
    const schema = mongoose.Schema(
      {
        customerStaffId: String,
        assistantName: String,
        assistantEndpoint: String,
        threadId: String,
        resume: String,
        run: {
          type: mongoose.Schema.Types.Mixed
        },
        messages: [{
          type: mongoose.Schema.Types.Mixed
        }],
        deletedAt: Date
      },
      { timestamps: true }
    )
  
    const Chat = mongoose.model('Chat', schema, 'chats')
    return Chat
  }