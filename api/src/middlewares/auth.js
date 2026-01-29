const jwt = require('jsonwebtoken')
const sequelizeDb = require('../models/sequelize')
const User = sequelizeDb.User
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret'

module.exports = async function (req, res, next) {
  try {
    const header = req.headers.authorization
    if (!header) return res.status(401).json({ error: true, message: 'No autorizado' })
    const parts = header.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: true, message: 'No autorizado' })
    const token = parts[1]
    const payload = jwt.verify(token, JWT_SECRET)
    const user = await User.findByPk(payload.id)
    if (!user) return res.status(401).json({ error: true, message: 'No autorizado' })
    req.user = user
    next()
  } catch (err) {
    res.status(401).json({ error: true, message: 'Token inválido' })
  }
}
