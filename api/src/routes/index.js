const express = require('express')
const router = express.Router()

// Menos simplificado:

// const adminUsers = require('./admin/users')
// const adminCustomers = require('./admin/customers')
// const adminFaqs = require('./admin/faqs')

// router.use('/admin/users', adminUsers)
// router.use('/admin/customers', adminCustomers)
// router.use('/admin/faqs', adminFaqs)

// Así está más simplificado:

router.use('/admin/users', require('./admin/users'))
router.use('/admin/customers', require('./admin/customers'))
router.use('/admin/bots', require('./admin/bots'))
router.use('/admin/files', require('./admin/files'))
router.use('/admin/faqs', require('./admin/faqs'))
router.use('/admin/event-categories', require('./admin/event-categories'))
router.use('/admin/promoters', require('./admin/promoters'))
router.use('/admin/promoter-spots', require('./admin/promoter-spots'))
router.use('/admin/spots', require('./admin/spots'))
router.use('/admin/emails', require('./admin/emails'))
router.use('/admin/images', require('./admin/images'))
router.use('/admin/languages', require('./admin/languages'))
router.use('/admin/towns', require('./admin/towns'))
router.use('/admin/email-errors', require('./admin/email-errors'))
router.use('/admin/sent-emails', require('./admin/sent-emails'))
router.use('/admin/events', require('./admin/events'))
router.use('/admin/event-prices', require('./admin/event-prices'))
router.use('/admin/event-occurrences', require('./admin/event-occurrences'))
router.use('/admin/customer-events', require('./admin/customer-events'))
router.use('/admin/customer-bots', require('./admin/customer-bots'))
router.use('/admin/customer-bot-chats', require('./admin/customer-bot-chats'))
router.use('/admin/assistants', require('./admin/assistants'))
router.use('/customer/faqs', require('./customer/faqs'))
router.use('/customer/headers', require('./customer/headers'))
router.use('/customer/chats', require('./customer/chats'))
router.use('/customer/newsletter', require('./customer/newsletter'))
router.use('/customer/auth', require('./customer/auth'))
router.use('/eventos', require('./eventos'))

// Debug endpoint to list sqlite tables (development only)
router.get('/debug/tables', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Forbidden' })
    const sequelizeDb = require('../models/sequelize')
    const [results] = await sequelizeDb.sequelize.query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    return res.json(results)
  } catch (err) {
    next(err)
  }
})

// List users (development only)
router.get('/debug/users', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Forbidden' })
    const sequelizeDb = require('../models/sequelize')
    const [results] = await sequelizeDb.sequelize.query("SELECT id, name, email, createdAt, deletedAt FROM users ORDER BY id DESC LIMIT 500;")
    return res.json(results)
  } catch (err) {
    next(err)
  }
})

// List credentials (development only)
router.get('/debug/credentials', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Forbidden' })
    const sequelizeDb = require('../models/sequelize')
    const [results] = await sequelizeDb.sequelize.query("SELECT id, userId, email, password, createdAt, deletedAt FROM user_credentials ORDER BY id DESC LIMIT 500;")
    return res.json(results)
  } catch (err) {
    next(err)
  }
})

// Create credential for a user (development only)
router.post('/debug/create-credential', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Forbidden' })
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'email and password required' })
    const sequelizeDb = require('../models/sequelize')
    const User = sequelizeDb.User
    const UserCredential = sequelizeDb.UserCredential
    const bcrypt = require('bcryptjs')
    const user = await User.findOne({ where: { email } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    const hash = await bcrypt.hash(password, 10)
    const cred = await UserCredential.create({ userId: user.id, email: user.email, password: hash, lastPasswordChange: new Date() })
    return res.json({ ok: true, credentialId: cred.id })
  } catch (err) {
    next(err)
  }
})

module.exports = router
