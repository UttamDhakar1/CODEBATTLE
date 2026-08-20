const Battle = require("../models/Battle");

const startBattleIfReady = async (battleId) => {
    const battle = await Battle.findByPk(battleId);

    if(!battle){
        return null;
    }
    if(battle.status !== "COUNTDOWN"){
        return battle;
    }
    const now = new Date();

    if(!battle.countdownEndAt || now < battle.countdownEndAt){
        return battle;
    }
    const startTime = battle.countdownEndAt;
    const endTime = new Date(
        startTime.getTime() + battle.maxDuration * 60 * 1000
    );
    battle.status = "RUNNING";
    battle.startTime = startTime;
    battle.endTime = endTime;

    await battle.save();
    return battle;
}
module.exports = {
    startBattleIfReady
}