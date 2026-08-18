const { DataTypes } = require("sequelize");
const sequelize = require("../config/database.js");
const User = sequelize.define(
    "User",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement : true,
            primaryKey : true

        },
        username: {
            type : DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        email: {
            type : DataTypes.STRING(100),
            allowNull: false, 
            unique: true
        },
        password: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        codeforcesHandle: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        codeforcesVerified: {
            type: DataTypes.BOOLEAN,
            allowNULL: false,
            defaultValue: false
        },
        verificationCode: {
            type: DataTypes.STRING(50),
            allowNULL: true
        },
        verificationExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        codebattleRating:{
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 5000
        },
        isActive:{
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    },
    {
        tableName: "users",
        timestamp: true,
    }
);

module.exports = User