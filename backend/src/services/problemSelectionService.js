const { Op } = require("sequelize");
const Problem = require("../models/Problem");

const selectProblemsForBattle = async ( battleRating, problemCount, topicPreference ) => {
    const minRating = Math.max(800, battleRating - 200);
    const maxRating = Math.min(3500, battleRating + 300);

    const where = {
        rating: {
            [Op.between]: [minRating, maxRating]
        }
    };

    const problems = await Problem.findAll({ where });

    if(problems.length < problemCount) {
        throw new Error(
            "Not enough problems available for this rating range"
        );
    }

    let preferredProblems = [];
    let fallbackProblems = [];

    if(topicPreference !== null 
        && topicPreference !== undefined 
        && topicPreference.length > 0
    ){
        for (const problem of problems) {
            const topic = problem.topic || [];

            const hasPreferredTopic = topicPreference.some(topic => topic.includes(topic))
            if(hasPreferredTopic) {
                preferredProblems.push(problem);
            }
            else fallbackProblems.push(problem);

            if(preferredProblems.length === problemCount) break;
        };
        
    }
    else{
        fallbackProblems = [...problems];
    }
    preferredProblems.sort(() => Math.random() - 0.5);
    fallbackProblems.sort(() => Math.random() - 0.5);

    const selectProblems = [];

    for(const problem of preferredProblems){
        selectProblems.push(problem);
    }
    for(const problem of fallbackProblems){
        if(selectProblems.length === problemCount) break;
        selectProblems.push(problem);
    }
    return selectProblems;
}

module.exports = {
    selectProblemsForBattle
};