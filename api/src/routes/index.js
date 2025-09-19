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



module.exports = router
