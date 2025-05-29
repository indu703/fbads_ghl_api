module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("embed_tokens", "userId", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("embed_tokens", "userId", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
