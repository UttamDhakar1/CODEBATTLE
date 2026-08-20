const Battle = require("../models/Battle.js");
const { startBattleIfReady } = require("./battleService");
const startCountdownBattles = async () => {
    try {
        const battles = await Battle.findAll({
            where: {
                status: "COUNTDOWN"
            }
        });
        for(const battle of battles){
            await startBattleIfReady(battle.id);
        }
    } catch (error) {
        console.error("Battle scheduler error: ", error);
    }
}

module.exports = {
    startCountdownBattles
};