const axios = require("axios");
const Problem = require("../models/Problem");

const CODEFORCES_API =
    "https://codeforces.com/api/problemset.problems";

const syncCodeforcesProblems = async () => {
    try {
        const response = await axios.get(CODEFORCES_API);

        if (response.data.status !== "OK") {
            throw new Error("Codeforces API returned an error");
        }

        const problems = response.data.result.problems;

        let added = 0;
        let updated = 0;

        for (const problem of problems) {
            // Some Codeforces problems don't have a rating.
            if (!problem.rating) {
                continue;
            }

            // We only need problems within our supported rating range.
            if (problem.rating < 800 || problem.rating > 3500) {
                continue;
            }

            const contestId = problem.contestId || null;
            const problemIndex = problem.index;

            if (!contestId || !problemIndex) {
                continue;
            }

            const url =
                `https://codeforces.com/contest/${contestId}/problem` +
                `/${problemIndex}`;

            const [dbProblem, created] = await Problem.findOrCreate({
                where: {
                    contestId,
                    problemIndex
                },
                defaults: {
                    name: problem.name,
                    rating: problem.rating,
                    topics: problem.tags || [],
                    url
                }
            });

            if (created) {
                added++;
            } else {
                await dbProblem.update({
                    name: problem.name,
                    rating: problem.rating,
                    topics: problem.tags || [],
                    url
                });

                updated++;
            }
        }

        return {
            totalFromAPI: problems.length,
            added,
            updated
        };

    } catch (error) {
        console.error(
            "Codeforces problem sync error:",
            error.message
        );

        throw error;
    }
};

module.exports = {
    syncCodeforcesProblems
};