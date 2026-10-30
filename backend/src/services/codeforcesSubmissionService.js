const axios = require("axios");

const CODEFORCES_API = "https://codeforces.com/api/user.status";

const getUserSubmissions = async (handle, from = 1, count = 100) => {
    const response = await axios.get(CODEFORCES_API, {
        params: { handle, from, count }
    });

    if (response.data.status !== "OK") {
        throw new Error("Codeforces API returned an error");
    }

    return response.data.result;
};

const getSubmissionsForBattle = async ({
    handle,
    contestId,
    problemIndex,
    battleStartTime,
    battleEndTime,
    lastCheckedSubmissionId = 0
}) => {
    const submissions = await getUserSubmissions(handle);

    const startTimestamp = Math.floor(
        new Date(battleStartTime).getTime() / 1000
    );

    const endTimestamp = Math.floor(
        new Date(battleEndTime).getTime() / 1000
    );

    const filtered = submissions.filter((submission) => {
        if (Number(submission.id) <= Number(lastCheckedSubmissionId)) {
            return false;
        }

        if (!submission.problem) return false;

        if (Number(submission.problem.contestId) !== Number(contestId)) {
            return false;
        }

        if (
            String(submission.problem.index).toUpperCase() !==
            String(problemIndex).toUpperCase()
        ) {
            return false;
        }

        if (submission.creationTimeSeconds < startTimestamp) {
            return false;
        }

        if (submission.creationTimeSeconds > endTimestamp) {
            return false;
        }

        return true;
    });

    console.log("Codeforces submission check:", {
        handle,
        contestId,
        problemIndex,
        totalSubmissions: submissions.length,
        matchedSubmissions: filtered.length,
        lastCheckedSubmissionId
    });

    return filtered;
};

module.exports = {
    getUserSubmissions,
    getSubmissionsForBattle
};