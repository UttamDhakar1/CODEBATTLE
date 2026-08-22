const User = require("./User");
const Battle = require("./Battle");
const BattleParticipant = require("./BattleParticipant");
const Problem = require("./Problem.js");
const BattleProblem = require("./BattleProblem");
const BattleSubmission = require("./BattleSubmission.js");

User.hasMany(BattleParticipant, {
    foreignKey: "userId",
    as: "battleParticipations"
});

BattleParticipant.belongsTo(User, {
    foreignKey: "userId",
    as: "user"
});
Battle.hasMany(BattleParticipant, {
    foreignKey: "battleId",
    as: "participants"
});

BattleParticipant.belongsTo(Battle, {
    foreignKey: "battleId",
    as: "battle"
});

Battle.hasMany(BattleProblem, {
    foreignKey: "battleId",
    as: "battleProblems"
});

BattleProblem.belongsTo(Battle, {
    foreignKey: "battleId",
    as: "battle"
});

Problem.hasMany(BattleProblem, {
    foreignKey: "problemId",
    as: "battleProblems"
});

BattleProblem.belongsTo(Problem, {
    foreignKey: "problemId",
    as: "problem"
});

Battle.hasMany(BattleSubmission, {
    foreignKey: "battleId",
    as: "submissions"
});

BattleSubmission.belongsTo(Battle, {
    foreignKey: "battleId",
    as: "battle"
});

User.hasMany(BattleSubmission, {
    foreignKey: "userId",
    as: "submissions"
});

BattleSubmission.belongsTo(User, {
    foreignKey: "userId",
    as: "user"
});

Problem.hasMany(BattleSubmission, {
    foreignKey: "problemId",
    as: "submissions"
});

BattleSubmission.belongsTo(Problem, {
    foreignKey: "problemId",
    as: "problem"
});

module.exports = {
    User,
    Battle,
    BattleParticipant,
    Problem,
    BattleProblem,
    BattleSubmission
};
