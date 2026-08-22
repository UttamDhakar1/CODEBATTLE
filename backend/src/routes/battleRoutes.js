const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const { createBattle, joinBattle, startBattle, getBattle, syncProblems, assignBattleProblems, getCurrentProblem, testCodeforcesSubmissions, getBattleResult, getMyBattleHistory } = require("../controllers/battleController");

router.post("/create", authenticate, createBattle);
router.post("/join", authenticate, joinBattle);
router.post("/:battleId/start", authenticate, startBattle);
router.post("/sync-problems", authenticate, syncProblems);
router.post("/:battleId/assign-problems", authenticate, assignBattleProblems);
router.post("/test-codeforces-submissions", authenticate, testCodeforcesSubmissions);
router.get("/history", authenticate, getMyBattleHistory);
router.get("./:battleId/result", authenticate, getBattleResult);
router.get("/:battleId/current-problem", authenticate, getCurrentProblem);
router.get("/:battleId", authenticate, getBattle);

module.exports = router;