'use strict'

const fs = require('fs')
const Sequelize = require('sequelize')
const path = require('path')
const basename = path.basename(__filename)
const sequelizeDb = {}


const env = process.env.NODE_ENV || 'development';
const config = require('../../config/config.json')[env];
const sequelize = new Sequelize(config);

fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js'
    )
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    )
    sequelizeDb[model.name] = model
  })

Object.keys(sequelizeDb).forEach(modelName => {
  if (sequelizeDb[modelName].associate) {
    sequelizeDb[modelName].associate(sequelizeDb)
  }
})

sequelizeDb.sequelize = sequelize
sequelizeDb.Sequelize = Sequelize

module.exports = sequelizeDb
