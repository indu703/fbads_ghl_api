'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop unique index if it exists
    await queryInterface.removeConstraint('Users', 'Users_username_key'); 
    // Now change the column (optional here, but kept for clarity)
    await queryInterface.changeColumn('Users', 'username', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: false // not needed anymore, just for clarity
    });
  },

  async down(queryInterface, Sequelize) {
    // Re-add the unique constraint
    await queryInterface.changeColumn('Users', 'username', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    });
  }
};
