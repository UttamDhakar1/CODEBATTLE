const Battle = require("../models/Battle.js");
const { startBattleIfReady } = require("./battleService");
const BattleParticipant = require("../models/BattleParticipant");
const { processBattleParticipantSubmissions } = require("./battleSubmissionService");
const User = require("../models/User");
const { calculateBattleResult } = require("./battleResultService");


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

const checkRunningBattles = async () => {
    try {
        const battles = await Battle.findAll({
            where: {
                status: "RUNNING"
            }
        });

        for (const battle of battles) {
            const now = new Date();
            if (battle.endTime && now >= battle.endTime) {
                battle.status = "FINISHED";
                await battle.save();

                await calculateBattleResult(battle.id);
                continue;
            }

            const participants = await BattleParticipant.findAll({
                where: {
                    battleId: battle.id,
                    isActive: true
                },
                include: {
                    model: User,
                    as: "user"
                }
            });

            for (const participant of participants) {

                try {
                    // Replace this with however you store
                    // the user's Codeforces handle.
                    const handle = participant.user?.codeforcesHandle;
    
                    if (!handle) {
                        continue;
                    }
    
                    await processBattleParticipantSubmissions(
                        battle,
                        participant,
                        handle
                    );
                } catch (error) {
                    console.error(
                        `Submission check failed for user ${participant.userId}: `,
                        error.message
                    );
                }
            }
        }

    } catch (error) {
        console.error(
            "Running battle submission check error:",
            error
        );
    }
};


module.exports = {
    startCountdownBattles,
    checkRunningBattles,

};