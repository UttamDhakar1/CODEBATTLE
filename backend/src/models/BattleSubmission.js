const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BattleSubmission = sequelize.define("BattleSubmission", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    battleId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    problemId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    codeforcesSubmissionId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true
    },

    verdict: {
        type: DataTypes.STRING,
        allowNull: false
    },

    submittedAt: {
        type: DataTypes.DATE,
        allowNull: false
    },

    penalty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
});

module.exports = BattleSubmission;