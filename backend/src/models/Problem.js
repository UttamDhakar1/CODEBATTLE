const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Problem = sequelize.define(
    "Problem",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        contestId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        problemIndex: {
            type: DataTypes.STRING,
            allowNull: false
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false
        },

        rating: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        topics: {
            type: DataTypes.JSON,
            allowNull: true
        },

        url: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },
    {
        indexes: [
            {
                unique: true,
                fields: ["contestId", "problemIndex"]
            }
        ]
    }
);

module.exports = Problem;