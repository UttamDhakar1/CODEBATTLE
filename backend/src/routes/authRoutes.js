const express = require("express");
const { register, login, verifyCodeforces, getVerificationCode, getMe } = require("../controllers/authControllers.js");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/verification-code", authenticate, getVerificationCode);
router.post("/verify-codeforces", authenticate, verifyCodeforces);

router.get("/me", authenticate, getMe);

module.exports = router;