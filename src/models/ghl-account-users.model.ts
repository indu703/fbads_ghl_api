import { DataTypes } from 'sequelize';
import db from '../util/dbConn';

const GhlAccountUser = db.define('ghl_account_users', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  location_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: false, // <-- disable createdAt and updatedAt
});


GhlAccountUser.sync({ alter: true });

export default GhlAccountUser;
