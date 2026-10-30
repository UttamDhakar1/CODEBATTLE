
const { Op } = require("sequelize");
const Problem = require("../models/Problem");

const selectProblemsForBattle = async (
    battleRating,
    problemCount,
    topicPreference
) => {
    const minRating = Math.max(800, battleRating - 200);
    const maxRating = Math.min(3500, battleRating + 300);

    const problems = await Problem.findAll({
        where: {
            rating: {
                [Op.between]: [minRating, maxRating],
            },
        },
    });

    if (problems.length < problemCount) {
        throw new Error(
            `Not enough problems available: found ${problems.length}, ` +
            `but ${problemCount} are required for rating range ` +
            `${minRating}-${maxRating}.`
        );
    }

    const shuffled = [...problems].sort(() => Math.random() - 0.5);

    if (
        !Array.isArray(topicPreference) ||
        topicPreference.length === 0
    ) {
        return shuffled.slice(0, problemCount);
    }

    const preferredProblems = [];
    const otherProblems = [];

    for (const problem of shuffled) {
        // Supports either field name until the model is confirmed.
        const rawTopics = problem.topics ?? problem.topic ?? [];

        const problemTopics = (
            Array.isArray(rawTopics) ? rawTopics : []
        ).map(topic => String(topic).toLowerCase());

        const matchesTopic = topicPreference.some(preferredTopic =>
            problemTopics.includes(String(preferredTopic).toLowerCase())
        );

        if (matchesTopic) {
            preferredProblems.push(problem);
        } else {
            otherProblems.push(problem);
        }
    }

    // Prefer matching topics, but use other eligible problems if needed.
    return [
        ...preferredProblems,
        ...otherProblems,
    ].slice(0, problemCount);
};

module.exports = {
    selectProblemsForBattle,
};
