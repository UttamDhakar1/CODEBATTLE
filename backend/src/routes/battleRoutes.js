
const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const requireCodeforcesVerified = require("../middleware/requireCodeforcesVerified");

const {
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
} = require("../controllers/battleController");

// All routes below require authentication and Codeforces verification.
router.use(authenticate);
router.use(requireCodeforcesVerified);

// Create and join battles.
router.post("/", createBattle);
router.post("/join", joinBattle);

// Active battle and history.
router.get("/active", getMyActiveBattle);
router.get("/history", getMyBattleHistory);

// Synchronize problems.
router.post("/sync-problems", syncProblems);

// Battle-specific actions.
router.post("/:battleId/start", startBattle);
router.post("/:battleId/assign-problems", assignBattleProblems);
router.post("/test-codeforces-submissions", testCodeforcesSubmissions);

router.get("/:battleId/result", getBattleResult);
router.get("/:battleId/current-problem", getCurrentProblem);
router.delete("/:battleId", discardBattle);
router.get("/:battleId", getBattle);
module.exports = router;
