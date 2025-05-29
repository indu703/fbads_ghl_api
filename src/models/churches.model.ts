import { DataTypes } from "sequelize";
import db from "../util/dbConn";

const Churches = db.define(
  "Churches",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    church_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    facebook_ad_account_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ghl_location_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: "Churches", 
    timestamps: true       
  }
);

export default Churches;
