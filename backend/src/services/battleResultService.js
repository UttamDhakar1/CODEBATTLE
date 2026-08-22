const Battle = require("../models/Battle");
const BattleParticipant = require("../models/BattleParticipant");

const calculateBattleResult = async (battleId) => {
    const battle = await Battle.findByPk(battleId);

    if (!battle) {
        throw new Error("Battle not found");
    }

    const participants = await BattleParticipant.findAll({
        where: {
            battleId: battle.id
        }
    });

    if (participants.length === 0) {
        return null;
    }

    // We currently have a 2-player battle
    if (participants.length === 1) {
        const participant = participants[0];

        participant.rank = 1;
        participant.result = "WIN";

        await participant.save();

        battle.winnerId = participant.userId;
        battle.status = "FINISHED";

        await battle.save();

        return {
            battle,
            participants
        };
    }

    const p1 = participants[0];
    const p2 = participants[1];

    let winner = null;
    let loser = null;
    let isDraw = false;

    // 1. Higher accepted count wins
    if (p1.acceptedCount > p2.acceptedCount) {
        winner = p1;
        loser = p2;
    }
    else if (p2.acceptedCount > p1.acceptedCount) {
        winner = p2;
        loser = p1;
    }

    // 2. Same accepted count -> lower penalty wins
    else if (p1.totalPenalty < p2.totalPenalty) {
        winner = p1;
        loser = p2;
    }
    else if (p2.totalPenalty < p1.totalPenalty) {
        winner = p2;
        loser = p1;
    }

    // 3. Same accepted count + same penalty -> draw
    else {
        isDraw = true;
    }

    if (isDraw) {
        p1.rank = 1;
        p2.rank = 1;

        p1.result = "TIE";
        p2.result = "TIE";

        await p1.save();
        await p2.save();

        battle.winnerId = null;
    }
    else {
        winner.rank = 1;
        winner.result = "WIN";

        loser.rank = 2;
        loser.result = "LOSE";

        await winner.save();
        await loser.save();

        battle.winnerId = winner.userId;
    }

    battle.status = "FINISHED";

    await battle.save();

    return {
        battle,
        participants
    };
};

module.exports = {
    calculateBattleResult
};