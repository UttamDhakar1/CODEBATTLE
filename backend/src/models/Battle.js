const { DataTypes } = require("sequelize");
const sequelize = require("../config/database.js");

const Battle = sequelize.define("Battle", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    roomCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true
    },
    hostId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM(
            "WAITING",
            "RUNNING",
            "FINISHED"
        ),
        allowNull: false,
        defaultValue: "WAITING"
    },
    battleRating:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
    problemCount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    topicPreferences: {
        type: DataTypes.JSON,
        allowNull: true
    },
    maxDuration: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    startTime: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    winnerId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

module.exports = Battle;