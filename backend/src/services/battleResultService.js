
const sequelize = require("../config/database");
const Battle = require("../models/Battle");
const BattleParticipant = require("../models/BattleParticipant");
const User = require("../models/User");

const K_FACTOR = 32;
const ELO_SCALE = 400;

// Expected probability of player 1 winning.
const getExpectedScore = (rating1, rating2) => {
    return 1 / (1 + Math.pow(10, (rating2 - rating1) / ELO_SCALE));
};

// Calculate rating change for player 1.
// Player 2 receives the opposite change.
const calculateRatingChange = (rating1, rating2, score1) => {
    const expectedScore = getExpectedScore(rating1, rating2);

    return Math.round(K_FACTOR * (score1 - expectedScore));
};

const calculateBattleResult = async (battleId) => {
    return await sequelize.transaction(async (transaction) => {

        // Lock the battle to prevent simultaneous result calculations.
        const battle = await Battle.findByPk(battleId, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!battle) {
            throw new Error("Battle not found");
        }

        const participants = await BattleParticipant.findAll({
            where: {
                battleId: battle.id
            },
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (participants.length === 0) {
            return null;
        }

        // Do not calculate or apply ratings more than once.
        if (battle.status === "FINISHED") {
            return { battle, participants };
        }

        if (participants.length > 2) {
            throw new Error("A battle cannot have more than 2 participants");
        }

        // Handle a battle with only one remaining participant.
        if (participants.length === 1) {
            const participant = participants[0];

            const user = await User.findByPk(participant.userId, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!user) {
                throw new Error("Participant user not found");
            }

            const currentRating = user.codebattleRating;

            participant.rank = 1;
            participant.result = "WIN";
            participant.oldRating = currentRating;
            participant.ratingChange = 0;
            participant.newRating = currentRating;

            await participant.save({ transaction });

            battle.winnerId = participant.userId;
            battle.status = "FINISHED";

            await battle.save({ transaction });

            return { battle, participants };
        }

        const p1 = participants[0];
        const p2 = participants[1];

        let winner = null;
        let loser = null;

        // Determine the winner using your existing rules.
        if (p1.acceptedCount > p2.acceptedCount) {
            winner = p1;
            loser = p2;
        }
        else if (p2.acceptedCount > p1.acceptedCount) {
            winner = p2;
            loser = p1;
        }
        else if (p1.totalPenalty < p2.totalPenalty) {
            winner = p1;
            loser = p2;
        }
        else if (p2.totalPenalty < p1.totalPenalty) {
            winner = p2;
            loser = p1;
        }

        // Fetch both users inside the same transaction.
        const user1 = await User.findByPk(p1.userId, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        const user2 = await User.findByPk(p2.userId, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!user1 || !user2) {
            throw new Error("One or more participant users were not found");
        }

        const oldRating1 = user1.codebattleRating;
        const oldRating2 = user2.codebattleRating;

        let ratingChange1 = 0;
        let ratingChange2 = 0;

        // Determine each player's score for Elo.
        let score1;

        if (!winner) {
            // Tie
            p1.rank = 1;
            p2.rank = 1;

            p1.result = "TIE";
            p2.result = "TIE";

            score1 = 0.5;
        }
        else if (winner.userId === p1.userId) {
            p1.rank = 1;
            p2.rank = 2;

            p1.result = "WIN";
            p2.result = "LOSS";

            score1 = 1;
        }
        else {
            p1.rank = 2;
            p2.rank = 1;

            p1.result = "LOSS";
            p2.result = "WIN";

            score1 = 0;
        }

        // Calculate zero-sum Elo changes.
        ratingChange1 = calculateRatingChange(
            oldRating1,
            oldRating2,
            score1
        );

        ratingChange2 = -ratingChange1;

        const newRating1 = oldRating1 + ratingChange1;
        const newRating2 = oldRating2 + ratingChange2;

        // Update users.
        user1.codebattleRating = newRating1;
        user2.codebattleRating = newRating2;

        await user1.save({ transaction });
        await user2.save({ transaction });

        // Save rating history for this battle.
        p1.oldRating = oldRating1;
        p1.ratingChange = ratingChange1;
        p1.newRating = newRating1;

        p2.oldRating = oldRating2;
        p2.ratingChange = ratingChange2;
        p2.newRating = newRating2;

        await p1.save({ transaction });
        await p2.save({ transaction });

        // Finish the battle.
        battle.winnerId = winner ? winner.userId : null;
        battle.status = "FINISHED";

        await battle.save({ transaction });

        return { battle, participants };
    });
};

module.exports = {
    calculateBattleResult
};
