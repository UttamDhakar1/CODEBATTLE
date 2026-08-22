const BattleProblem = require("../models/BattleProblem.js");
const { selectProblemsForBattle } = require("./problemSelectionService.js");

const assignProblemsToBattle = async (battle) => {

    const existingProblems = await BattleProblem.count({
        where: {
            battleId: battle.id
        }
    });

    if (existingProblems > 0) {
        return await BattleProblem.findAll({
            where: {
                battleId: battle.id
            },
            order: [["problemOrder", "ASC"]]
        });
    }

    const problems = await selectProblemsForBattle(
        battle.battleRating,
        battle.problemCount,
        battle.topicPreferences
    );

    const battleProblems = problems.map((problem, index) => ({
        battleId: battle.id,
        problemId: problem.id,
        problemOrder: index + 1
    }));

    await BattleProblem.bulkCreate(battleProblems);

    return battleProblems;
};

module.exports = {
    assignProblemsToBattle
};