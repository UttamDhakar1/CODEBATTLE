const { Op } = require("sequelize");
const Battle = require("../models/Battle");
const BattleParticipant = require("../models/BattleParticipant");
const crypto = require("crypto");
const { startBattleIfReady } = require("../services/battleService");
const { syncCodeforcesProblems } = require("../services/codeforcesService")
const { assignProblemsToBattle } = require("../services/battleProblemService.js");
const BattleProblem = require("../models/BattleProblem");
const Problem = require("../models/Problem");
const { getSubmissionsForBattle, getUserSubmissions } = require("../services/codeforcesSubmissionService");
const BattleSubmission = require("../models/BattleSubmission");
const User = require("../models/User");
const generateRoomCode = () => {
    return crypto.randomBytes(4)
        .toString("hex")
        .toUpperCase();
};

const checkActiveBattle = async (userId) => {
    return await BattleParticipant.findOne({
        where: {
            userId
        },
        include: {
            model: Battle,
            as: "battle",
            where: {
                status: {
                    [Op.in]: ["WAITING", "RUNNING"]
                }
            }
        }
    });
};

const createBattle = async (req, res) => {
    try {
        const userId = req.user.id;
        // console.log(userId);
        const activeBattle = await checkActiveBattle(userId);
        // console.log(activeBattle)
        if(activeBattle){
            return res.status(409).json({
                message: "You are already in an active battle"
            });
        }
        
        const { battleRating, problemCount, topicPreferences, maxDuration } = req.body;

        if(battleRating === undefined || problemCount === undefined || maxDuration === undefined){
            return res.status(400).json({
                message: "Battle Rating, problem count and duration are required"
            });
        }

        const allowProblemCounts = [3, 4, 5, 6];
        if(!allowProblemCounts.includes(problemCount)){
            return res.status(400).json({
                message: "Problem count must be 3, 4, 5 or 6"
            });
        }
        if(battleRating < 800 || battleRating > 3500 || battleRating % 100 > 0){
            return res.status(400).json({
                message: "Battle rating is Incorrect"
            });
        }

        const allowedDurations = [30, 60, 90, 120, 150, 180];

        if (!allowedDurations.includes(maxDuration)) {
            return res.status(400).json({
                message: "Invalid battle duration"
            });
        }

        if (topicPreferences !== undefined && topicPreferences !== null && !Array.isArray(topicPreferences)) {
            return res.status(400).json({
                message: "Topic preferences must be an array"
            });
        }

        let roomCode;
        while(true){
            const generatedCode = generateRoomCode();
            const existingBattle = await Battle.findOne({
                where: {
                    roomCode: generatedCode
                }
            });
            if(!existingBattle){
                roomCode = generatedCode;
                break;
            }
        };

        const battle = await Battle.create({
            roomCode,
            hostId: userId,
            minPlayers: 2,
            maxPlayers: 2,
            status: "WAITING",
            battleRating,
            problemCount,
            topicPreferences: topicPreferences || null,
            maxDuration
        });

        await BattleParticipant.create({
            battleId: battle.id,
            userId,
            isActive: true
        })

        return res.status(201).json({
            message: "Battle created successfully",
            battle: {
                id: battle.id,
                roomCode: battle.roomCode,
                status: battle.status,
                battleRating: battle.battleRating,
                problemCount: battle.problemCount,
                topicPreferences: battle.topicPreferences,
                maxDuration: battle.maxDuration,
                minPlayers: battle.minPlayers,
                maxPlayers: battle.maxPlayers
            }
        });

    } catch (error) {
        console.error("Create battle Error: ", error);

        return res.status(500).json({
            message: "Internal server Error"
        });
    }
};

const joinBattle = async (req, res) => {
    try {
        const userId = req.user.id;
        // console.log(userId);
        const { roomCode } = req.body;

        if(!roomCode){
            return res.status(400).json({
                message: "Room code is required"
            });
        }

        const battle = await Battle.findOne({
            where: {
                roomCode
            }
        });

        if(!battle){
            return res.status(404).json({
                message: "Battle not found"
            });
        }

        if(battle.status !== "WAITING"){
            return res.status(400).json({
                message: "Battle is not available for joining"
            });
        }

        const activeBattle = await checkActiveBattle(userId);
        // console.log("check if active: ", activeBattle);
        if(activeBattle){
            return res.status(400).json({
                message: "You are Already in an active battle"
            });
        }

        // await BattleParticipant.count({
        //     where: {
        //         battleId: battle.id
        //     }
        // });

        const participantCount = await BattleParticipant.count({
            where: {
                battleId: battle.id
            }
        });

        if(participantCount >= battle.maxPlayers){
            return res.status(409).json({
                message: "Battle is full"
            });
        }

        const participant = await BattleParticipant.create({
            battleId: battle.id,
            userId,
            isActive: true
        });


        return res.status(200).json({
            message: "Battle joined successfully",
            battle: {
                id: battle.id,
                roomCode: battle.roomCode,
                status: battle.status,
                battleRating: battle.battleRating,
                problemCount: battle.problemCount,
                topicPreferences: battle.topicPreferences,
                maxDuration: battle.maxDuration,
                minPlayers: battle.minPlayers,
                maxPlayers: battle.maxPlayers
            }
        });
    } catch (error) {
        console.error("Join battle error: ", error);
        return res.status(500).json({
            message: "Internal server Error"
        });
    }
};

const startBattle = async (req, res) => {
    try {
        const userId = req.user.id;
        const { battleId } = req.params;

        const battle = await Battle.findByPk(battleId);

        if(!battle){
            return res.status(404).json({
                message: "Battle not found"
            });
        }

        if(battle.hostId !== userId){
            return res.status(403).json({
                message: "Only host can start the battle"
            });
        }

        if(battle.status !== "WAITING"){
            return res.status(400).json({
                message: "Battle cannot be started"
            });
        }

        const participantCount = await BattleParticipant.count({
            where: {
                battleId: battle.id 
            }
        });

        if(participantCount < battle.minPlayers){
            return res.status(400).json({
                message: "Minimum no. of players has not been reached"
            });
        }

        const battleProblems = await assignProblemsToBattle(battle);

        const startCountdownAt = new Date();

        const countdownEndAt = new Date(
            startCountdownAt.getTime() + 30 * 1000
        );

        battle.status = "COUNTDOWN";
        battle.startCountdownAt = startCountdownAt;
        battle.countdownEndAt = countdownEndAt;

        await battle.save();


        return res.status(200).json({
            message: "Battle Countdown Started",
            battle: {
                id: battle.id,
                status: battle.status,
                startCountdownAt: battle.startCountdownAt
            }
        });

    } catch (error) {
    console.error("Start Battle error:", error);

    return res.status(500).json({
        message: "Internal server error",
        error: error.message
    });
    }
}

const getBattle = async (req, res) => {
    try {
        
        const { battleId } = req.params;
        
        const battle = await startBattleIfReady(battleId);
    
        if(!battle){
            return res.status(404).json({
                message: "Battle not found"
            });
        }

        const participant = await BattleParticipant.findOne({
            where: {
                battleId: battle.id,
                userId: req.user.id
            }
        });
        if(!participant){
            return res.status(403).json({
                message: "You are not a participant of this battle"
            });
        };
        
        return res.status(200).json({
            battle: {
                id: battle.id,
                roomCode: battle.roomCode,
                status: battle.status,
                battleRating: battle.battleRating,
                problemCount: battle.problemCount,
                topicPreferences: battle.topicPreferences,
                maxDuration: battle.maxDuration,
                minPlayers: battle.minPlayers,
                maxPlayers: battle.maxPlayers,
                startCountdownAt: battle.startCountdownAt,
                countdownEndAt: battle.countdownEndAt,
                startTime: battle.startTime,
                endTime: battle.endTime,
                isHost: Number(battle.hostId) === Number(req.user.id),
            }
        });
    
    } catch (error) {
        console.error("Get battle error", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}


const syncProblems = async (req, res) => {
    try {
        console.log("Starting Codeforces problem synchronization...");

        const result = await syncCodeforcesProblems();

        console.log("Codeforces synchronization completed:", result);

        return res.status(200).json({
            message: "Codeforces problems synchronized successfully",
            stats: result,
        });
    } catch (error) {
        console.error("Problem synchronization error:", error);

        return res.status(500).json({
            message: "Failed to synchronize Codeforces problems",
            error: error.message,
        });
    }
};


const assignBattleProblems = async (req, res) => {
    try {
        const { battleId } = req.params;

        const battle = await await Battle.findByPk(battleId);

        if(!battle){
            return res.status(404).json({
                message: "Battle not found"
            });
        }
        
        if (battle.hostId !== req.user.id) {
            return res.status(403).json({
                message: "Only the host can assign battle problems"
            });
        }

        const battleProblems = await assignProblemsToBattle(battle);

        return res.status(200).json({
            message: "Problem assigned successfully",
            battleProblems
        });

    } catch (error) {
        console.log("Assign problems error:", error);

        return res.status(500).json({
            message: error.message
        })
    }
}

const getCurrentProblem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { battleId } = req.params;

        const battle = await Battle.findByPk(battleId);

        if (!battle) {
            return res.status(404).json({
                message: "Battle not found"
            });
        }

        const participant = await BattleParticipant.findOne({
            where: {
                battleId: battle.id,
                userId: req.user.id
            }
        });

        if (!participant) {
            return res.status(403).json({
                message: "You are not a participant of this battle"
            });
        }

        if (battle.status !== "RUNNING") {
            return res.status(400).json({
                message: "Battle is not running"
            });
        }

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

        if (!battleProblem) {
            return res.status(404).json({
                message: "Current problem not found"
            });
        }

        return res.status(200).json({
            problem: {
                order: battleProblem.problemOrder,
                id: battleProblem.problem.id,
                contestId: battleProblem.problem.contestId,
                problemIndex: battleProblem.problem.problemIndex,
                name: battleProblem.problem.name,
                rating: battleProblem.problem.rating,
                topics: battleProblem.problem.topics,
                url: battleProblem.problem.url
            }
        });

    } catch (error) {
        console.error("Get current problem error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

const testCodeforcesSubmissions = async (req, res) => {
    try {
        const { battleId, lastCheckedSubmissionId } = req.body;

        if (!battleId) {
            return res.status(400).json({
                message: "Battle ID is required"
            });
        }

        const battle = await Battle.findByPk(battleId);

        if (!battle) {
            return res.status(404).json({
                message: "Battle not found"
            });
        }

        // Only a participant may check submissions for this battle.
        const participant = await BattleParticipant.findOne({
            where: {
                battleId: battle.id,
                userId: req.user.id
            }
        });

        if (!participant) {
            return res.status(403).json({
                message: "You are not a participant of this battle"
            });
        }

        if (!battle.startTime || !battle.endTime) {
            return res.status(400).json({
                message: "Battle start or end time is not available"
            });
        }

        // Use the verified Codeforces handle belonging to the
        // authenticated participant, not a handle supplied by the client.
        const User = require("../models/User");
        const user = await User.findByPk(req.user.id);

        if (!user || !user.codeforcesVerified || !user.codeforcesHandle) {
            return res.status(403).json({
                message: "A verified Codeforces account is required"
            });
        }

        const { contestId, problemIndex } = req.body;

        if (!contestId || !problemIndex) {
            return res.status(400).json({
                message: "Contest ID and problem index are required"
            });
        }

        const submissions = await getSubmissionsForBattle({
            handle: user.codeforcesHandle,
            contestId: Number(contestId),
            problemIndex,
            battleStartTime: battle.startTime,
            battleEndTime: battle.endTime,
            lastCheckedSubmissionId:
                Number(lastCheckedSubmissionId) || 0
        });

        return res.status(200).json({ submissions });
    } catch (error) {
        console.error(
            "Codeforces submission check error:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            message: "Failed to check Codeforces submissions"
        });
    }
};

const getBattleResult = async (req, res) => {
    try {
        const { battleId } = req.params;

        const battle = await Battle.findByPk(battleId);

        if (!battle) {
            return res.status(404).json({
                message: "Battle not found"
            });
        }

        if (battle.status !== "FINISHED") {
            return res.status(400).json({
                message: "Battle is not finished yet"
            });
        }

        // Verify that the requesting user participated.
        const participant = await BattleParticipant.findOne({
            where: {
                battleId: battle.id,
                userId: req.user.id
            }
        });

        if (!participant) {
            return res.status(403).json({
                message: "You are not a participant of this battle"
            });
        }

        // Fetch participants with their user information.
        const participants = await BattleParticipant.findAll({
            where: {
                battleId: battle.id
            },
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "username", "codeforcesHandle"]
                }
            ],
            order: [["rank", "ASC"]]
        });

        // Fetch all assigned problems.
        const battleProblems = await BattleProblem.findAll({
            where: {
                battleId: battle.id
            },
            include: [
                {
                    model: Problem,
                    as: "problem"
                }
            ],
            order: [["problemOrder", "ASC"]]
        });

        // Fetch all submissions made during this battle.
        const submissions = await BattleSubmission.findAll({
            where: {
                battleId: battle.id
            },
            order: [["submittedAt", "ASC"]]
        });

        // Build participant results.
        const playerResults = participants.map((p) => {
            const playerSubmissions = submissions.filter(
                (s) => Number(s.userId) === Number(p.userId)
            );

            const problemResults = battleProblems.map((bp) => {
                const problem = bp.problem;

                const problemSubmissions = playerSubmissions.filter(
                    (s) => Number(s.problemId) === Number(problem.id)
                );

                const acceptedSubmission = problemSubmissions.find(
                    (s) => s.verdict === "OK"
                );

                const latestSubmission =
                    problemSubmissions[problemSubmissions.length - 1];

                return {
                    problemId: problem.id,
                    problemOrder: bp.problemOrder,
                    status: acceptedSubmission
                        ? "Accepted"
                        : latestSubmission
                            ? latestSubmission.verdict
                            : "Not attempted",
                    accepted: Boolean(acceptedSubmission),
                    solveTime: acceptedSubmission
                        ? acceptedSubmission.submittedAt
                        : null,
                    penalty: problemSubmissions.reduce(
                        (total, s) => total + Number(s.penalty || 0),
                        0
                    )
                };
            });

            return {
                userId: p.userId,
                username:
                    p.user?.username ||
                    p.user?.codeforcesHandle ||
                    `Player ${p.userId}`,
                codeforcesHandle: p.user?.codeforcesHandle || null,

                acceptedCount: p.acceptedCount,
                totalPenalty: p.totalPenalty,
                rank: p.rank,
                result: p.result,

                oldRating: p.oldRating,
                ratingChange: p.ratingChange,
                newRating: p.newRating,

                problemResults
            };
        });

        // Return the complete result.
        return res.status(200).json({
            battleId: battle.id,
            status: battle.status,
            battleRating: battle.battleRating,
            problemCount: battle.problemCount,
            winnerId: battle.winnerId,

            outcome: battle.winnerId === null ? "TIE" : "COMPLETED",

            participants: playerResults,

            problems: battleProblems.map((bp) => ({
                id: bp.problem.id,
                problemId: bp.problem.id,
                problemOrder: bp.problemOrder,
                name: bp.problem.name,
                rating: bp.problem.rating,
                url: bp.problem.url
            }))
        });

    } catch (error) {
        console.error("Get battle result error:", error);

        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

const getMyBattleHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        const participations = await BattleParticipant.findAll({
            where: {
                userId
            },
            include: {
                model: Battle,
                as: "battle"
            },
            order: [["createdAt", "DESC"]]
        });

        return res.status(200).json({
            battles: participations.map(p => ({
                battleId: p.battleId,
                status: p.battle.status,
                acceptedCount: p.acceptedCount,
                totalPenalty: p.totalPenalty,
                rank: p.rank,
                result: p.result,
                joinedAt: p.joinedAt
            }))
        });

    } catch (error) {
        console.error("Get battle history error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};

const discardBattle = async (req, res) => {
    try {
        const { battleId } = req.params;

        const battle = await Battle.findByPk(battleId);

        if (!battle) {
            return res.status(404).json({
                message: "Battle not found"
            });
        }

        if (battle.hostId !== req.user.id) {
            return res.status(403).json({
                message: "Only the host can discard this room"
            });
        }

        if (battle.status !== "WAITING") {
            return res.status(400).json({
                message: "Only a waiting room can be discarded"
            });
        }

        // Remove participants first to avoid foreign-key conflicts.
        await BattleParticipant.destroy({
            where: { battleId: battle.id }
        });

        await BattleProblem.destroy({
            where: { battleId: battle.id }
        });

        await battle.destroy();

        return res.status(200).json({
            message: "Battle room discarded successfully"
        });
    } catch (error) {
        console.error("Discard battle error:", error);

        return res.status(500).json({
            message: "Failed to discard battle room"
        });
    }
};


const getMyActiveBattle = async (req, res) => {
    try {
        const participation = await BattleParticipant.findOne({
            where: {
                userId: req.user.id,
            },
            include: {
                model: Battle,
                as: "battle",
                required: true,
                where: {
                    status: {
                        [Op.in]: ["WAITING", "COUNTDOWN", "RUNNING"],
                    },
                },
            },
            order: [["createdAt", "DESC"]],
        });

        if (!participation || !participation.battle) {
            return res.status(200).json({ battle: null });
        }

        const battle = participation.battle;

        return res.status(200).json({
            battle: {
                id: battle.id,
                roomCode: battle.roomCode,
                status: battle.status,
                battleRating: battle.battleRating,
                problemCount: battle.problemCount,
                topicPreferences: battle.topicPreferences,
                maxDuration: battle.maxDuration,
                currentProblemOrder: battle.currentProblemOrder,
                countdownEndAt: battle.countdownEndAt,
                isHost: Number(battle.hostId) === Number(req.user.id),
            },
        });
    } catch (error) {
        console.error("Get active battle error:", error);

        return res.status(500).json({
            message: "Failed to fetch active battle",
        });
    }
};


module.exports = {
    createBattle,
    joinBattle,
    startBattle,
    getBattle,
    syncProblems,
    assignBattleProblems,
    getCurrentProblem,
    testCodeforcesSubmissions,
    getBattleResult,
    getMyBattleHistory,
    discardBattle,
    getMyActiveBattle
};