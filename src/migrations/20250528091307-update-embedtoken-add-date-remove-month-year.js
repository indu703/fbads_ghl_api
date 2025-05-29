'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new 'date' column
    await queryInterface.addColumn('embed_tokens', 'date', {
      type: Sequelize.DATEONLY,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_DATE') // or manually set if needed
    });

    // Remove 'month' and 'year' columns
    await queryInterface.removeColumn('embed_tokens', 'month');
    await queryInterface.removeColumn('embed_tokens', 'year');
  },

  down: async (queryInterface, Sequelize) => {
    // Revert: Add back 'month' and 'year'
    await queryInterface.addColumn('embed_tokens', 'month', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    await queryInterface.addColumn('embed_tokens', 'year', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    // Remove the 'date' column
    await queryInterface.removeColumn('embed_tokens', 'date');
  }
};
