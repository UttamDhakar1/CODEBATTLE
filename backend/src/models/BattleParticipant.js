const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BattleParticipant = sequelize.define("BattleParticipant", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    battleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Battles",
            key: "id"
        }
    },

    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        reference: {
            model: "users",
            kwy: "id"
        }
    },

    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },

    joinedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },

    inactiveSince: {
        type: DataTypes.DATE,
        allowNull: true
    },

    acceptedCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },

    totalPenalty: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0
    },

    rank: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    result: {
        type: DataTypes.ENUM(
            "WIN",
            "LOSS",
            "TIE"
        ),
        allowNull: true
    },

    oldRating: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    ratingChange: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    newRating: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

module.exports = BattleParticipant;