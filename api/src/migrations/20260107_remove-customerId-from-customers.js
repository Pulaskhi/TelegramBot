"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Elimina la columna customerId de la tabla customers si existe
    await queryInterface.removeColumn('customers', 'customerId').catch(() => {});
  },

  down: async (queryInterface, Sequelize) => {
    // Si quieres revertir, puedes volver a crear la columna (opcional)
    await queryInterface.addColumn('customers', 'customerId', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  }
};
