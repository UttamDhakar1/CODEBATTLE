const express = require("express");
const { register, login, verifyCodeforces } = require("../controllers/authControllers.js");
const authenticate = require("../middleware/authMiddleware");
const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.post("/verify-codeforces", authenticate, verifyCodeforces);
module.exports = router;