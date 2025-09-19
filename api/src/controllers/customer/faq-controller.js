const moment = require('moment')
const mongooseDb = require('../../models/mongoose')
const Faq = mongooseDb.Faq

exports.findAll = async (req, res, next) => {
  try {
    
    const whereStatement = {}
    whereStatement.deletedAt = { $exists: false }

    const result = await Faq.find(whereStatement)
      .sort({ createdAt: -1 })
      .lean()
      .exec()
    
      
    const response = result.map(doc => ({
      ...doc,
      id: doc._id,
      _id: undefined,
      createdAt: moment(doc.createdAt).format('YYYY-MM-DD HH:mm'),
      updatedAt: moment(doc.updatedAt).format('YYYY-MM-DD HH:mm')
    }))

    res.status(200).send(response)
  } catch (err) {
    next(err)
  }
}