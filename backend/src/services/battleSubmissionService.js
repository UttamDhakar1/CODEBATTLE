
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
    if (battle.status !== "RUNNING") return;

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
        lastCheckedSubmissionId: 0
    });

    submissions.sort((a, b) => a.id - b.id);

    console.log("Processing submissions:", {
        battleId: battle.id,
        userId: participant.userId,
        problem: problem.name,
        count: submissions.length
    });

    for (const submission of submissions) {
        const existing = await BattleSubmission.findOne({
            where: {
                codeforcesSubmissionId: submission.id
            }
        });

        // Already processed this submission.
        if (existing) {
            // If the submission was previously TESTING and is now accepted,
            // update its verdict and process the acceptance.
            if (
                existing.verdict !== "OK" &&
                submission.verdict === "OK" &&
                Number(existing.userId) === Number(participant.userId) &&
                Number(existing.battleId) === Number(battle.id)
            ) {
                existing.verdict = "OK";
                existing.submittedAt = new Date(
                    submission.creationTimeSeconds * 1000
                );
                await existing.save();

                await handleAcceptedSubmission(
                    battle,
                    participant,
                    problem,
                    existing
                );

                return;
            }

            continue;
        }

        const verdict = submission.verdict;

        // Do not permanently record pending submissions as failed.
        if (
            !verdict ||
            verdict === "TESTING" ||
            verdict === "SUBMITTED"
        ) {
            continue;
        }

        const submittedAt = new Date(
            submission.creationTimeSeconds * 1000
        );

        const penalty =
            verdict === "OK" ? 0 : PENALTY_MINUTES;

        const record = await BattleSubmission.create({
            battleId: battle.id,
            userId: participant.userId,
            problemId: problem.id,
            codeforcesSubmissionId: submission.id,
            verdict,
            submittedAt,
            penalty
        });

        if (verdict === "OK") {
            await handleAcceptedSubmission(
                battle,
                participant,
                problem,
                record
            );

            return;
        }

        participant.totalPenalty =
            Number(participant.totalPenalty) + PENALTY_MINUTES;

        await participant.save();
    }
};

const handleAcceptedSubmission = async (
    battle,
    participant,
    problem,
    submission
) => {
    // Prevent duplicate acceptance processing.
    const alreadyAccepted = await BattleSubmission.findOne({
        where: {
            battleId: battle.id,
            userId: participant.userId,
            problemId: problem.id,
            verdict: "OK"
        }
    });

    // The current submission is already saved as OK.
    // Count accepted submissions only once.
    if (Number(participant.acceptedCount) >= battle.currentProblemOrder) {
        return;
    }

    const elapsedMinutes = Math.max(
        0,
        Math.floor(
            (new Date(submission.submittedAt) -
                new Date(battle.startTime)) / 60000
        )
    );

    participant.acceptedCount =
        Number(participant.acceptedCount) + 1;

    participant.totalPenalty =
        Number(participant.totalPenalty) + elapsedMinutes;

    await participant.save();

    const nextOrder = battle.currentProblemOrder + 1;

    console.log("Problem accepted:", {
        userId: participant.userId,
        problem: problem.name,
        nextOrder
    });

    if (nextOrder > battle.problemCount) {
        await calculateBattleResult(battle.id);
        return;
    }

    battle.currentProblemOrder = nextOrder;
    await battle.save();

    console.log("Advanced to problem:", nextOrder);
};

module.exports = {
    processBattleParticipantSubmissions
};
