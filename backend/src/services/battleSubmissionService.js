const BattleSubmission = require("../models/BattleSubmission");
const BattleProblem = require("../models/BattleProblem");
const Problem = require("../models/Problem");

const { getSubmissionsForBattle } = require("./codeforcesSubmissionService");
const { calculateBattleResult } = require("./battleResultService");

const PENALTY_MINUTES = 10;

const processBattleParticipantSubmissions = async (
    battle,
    participant,
    codeforcesHandle
) => {
    const battleProblem = await BattleProblem.findOne({
        where: {
            battleId: battle.id,
            problemOrder: battle.currentProblemOrder
        },
        include: {
            model: Problem,
            as: "problem"
        }
    });

    if (!battleProblem) return;

    const problem = battleProblem.problem;

    const solved = await BattleSubmission.findOne({
        where: {
            battleId: battle.id,
            userId: participant.userId,
            problemId: problem.id,
            verdict: "OK"
        }
    });

    if (solved) return;

    const submissions = await getSubmissionsForBattle({
        handle: codeforcesHandle,
        contestId: problem.contestId,
        problemIndex: problem.problemIndex,
        battleStartTime: battle.startTime,
        battleEndTime: battle.endTime,
        lastCheckedSubmissionId:
            Number(participant.lastCheckedSubmissionId) || 0
    });

    submissions.sort((a, b) => a.id - b.id);

    for (const submission of submissions) {

        const exists = await BattleSubmission.findOne({
            where: {
                codeforcesSubmissionId: submission.id
            }
        });

        if (exists) continue;

        const submittedAt = new Date(
            submission.creationTimeSeconds * 1000
        );

        const verdict = submission.verdict;

        let penalty = 0;

        if (verdict !== "OK") {
            penalty = PENALTY_MINUTES;
        }

        await BattleSubmission.create({
            battleId: battle.id,
            userId: participant.userId,
            problemId: problem.id,
            codeforcesSubmissionId: submission.id,
            verdict,
            submittedAt,
            penalty
        });

        participant.lastCheckedSubmissionId = submission.id;
        participant.lastCheckedSubmissionTime =
            submission.creationTimeSeconds;

        if (verdict !== "OK") {
            participant.totalPenalty += PENALTY_MINUTES;
            await participant.save();
            continue;
        }

        const elapsedMinutes = Math.floor(
            (submittedAt - new Date(battle.startTime)) / 60000
        );

        participant.acceptedCount++;
        participant.totalPenalty += elapsedMinutes;

        await participant.save();

        const nextOrder = battle.currentProblemOrder + 1;

        if (nextOrder > battle.problemCount) {
            battle.status = "FINISHED";
            await battle.save();

            await calculateBattleResult(battle.id);
            return;
        }

        battle.currentProblemOrder = nextOrder;
        await battle.save();

        return;
    }
};

module.exports = {
    processBattleParticipantSubmissions
};