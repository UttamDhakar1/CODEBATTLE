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
        console.error("Start Battle error");

        return res.status(500).json({
            message: "Internal server error"
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
                endTime: battle.endTime
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
        const result = await syncCodeforcesProblems();

        return res.status(200).json({
            message: "Codeforces problems synchronized successfully"
        });

    } catch (error) {
        console.error("Problem synchronization error: ", error);

        return res.status(500).json({
            message: "failed to Synchronize Codeforces problems"
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
                userId
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
        const {
            handle,
            contestId,
            problemIndex,
            battleStartTime,
            battleEndTime,
            lastCheckedSubmissionId
        } = req.body;

        if (
            !handle ||
            !contestId ||
            !problemIndex ||
            !battleStartTime ||
            !battleEndTime
        ) {
            return res.status(400).json({
                message: "Missing required fields"
            });
        }

        const submissions = await getSubmissionsForBattle({
            handle,
            contestId: Number(contestId),
            problemIndex,
            battleStartTime,
            battleEndTime,
            lastCheckedSubmissionId:
                Number(lastCheckedSubmissionId) || 0
        });

        return res.status(200).json({
            submissions
        });

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

        const participants = await BattleParticipant.findAll({
            where: {
                battleId: battle.id
            },
            order: [["rank", "ASC"]]
        });

        if(!participant) {
            return res.status(403).json({
                message: "You are not a participant of this battle"
            });
        };

        return res.status(200).json({
            battleId: battle.id,
            status: battle.status,
            winnerId: battle.winnerId,
            participants: participants.map(p => ({
                userId: p.userId,
                acceptedCount: p.acceptedCount,
                totalPenalty: p.totalPenalty,
                rank: p.rank,
                result: p.result
            }))
        });

    } catch (error) {
        console.error("Get battle result error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
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
    getMyBattleHistory
};