const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const { createBattle, joinBattle, startBattle, getBattle } = require("../controllers/battleController");

router.post("/create", authenticate, createBattle);
router.post("/join", authenticate, joinBattle);
router.post("/:battleId/start", authenticate, startBattle);
router.post("/:battleId", authenticate, getBattle);
module.exports = router;