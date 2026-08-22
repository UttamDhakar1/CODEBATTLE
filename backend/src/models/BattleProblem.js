const { DataTypes } = require("sequelize");
const sequelize = require("../config/database.js");

const BattleProblem = sequelize.define("BattleProblem", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    battleId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    problemId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    problemOrder: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});
module.exports = BattleProblem;