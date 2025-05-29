module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('embed_tokens', 'month', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
    await queryInterface.addColumn('embed_tokens', 'year', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('embed_tokens', 'month');
    await queryInterface.removeColumn('embed_tokens', 'year');
  },
};
