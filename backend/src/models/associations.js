const User = require("./User");
const Battle = require("./Battle");
const BattleParticipant = require("./BattleParticipant");

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

module.exports = {
    User,
    Battle,
    BattleParticipant
};
