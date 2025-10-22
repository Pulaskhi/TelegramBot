const services = {
  fileService: new (require('../services/file-service'))(),
  telegramService: new (require('../services/telegram-service'))(process.env.TELEGRAM_ADMIN_TOKEN, process.env.TELEGRAM_ADMIN_CHAT_ID)
}

function createServiceMiddleware (serviceName) {
  return (req, res, next) => {
    req[serviceName] = services[serviceName]
    next()
  }
}

module.exports = Object.keys(services).reduce((middlewares, serviceName) => {
  middlewares[`${serviceName}Middleware`] = createServiceMiddleware(serviceName)
  return middlewares
}, {})