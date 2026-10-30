const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const User = require("../models/User");
// Use for randomly generate code
const register = async (req, res) => {
    try {
        const { username, email, password, codeforcesHandle } = req.body;

        if (!username || !email || !password || !codeforcesHandle) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{ username }, { email }, { codeforcesHandle }]
            }
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Username, email, or Codeforces handle already exists."
            });
        }

        // Validate the Codeforces handle.
        const cfResponse = await fetch(
            `https://codeforces.com/api/user.info?handles=${encodeURIComponent(codeforcesHandle)}`
        );

        const cfData = await cfResponse.json();

        if (!cfResponse.ok || cfData.status !== "OK") {
            return res.status(400).json({
                message: "Invalid Codeforces handle."
            });
        }

        const verificationCode =
            "CB_VERIFY-" + require("crypto").randomBytes(4).toString("hex");

        const verificationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const hashedPassword = await require("bcrypt").hash(password, 10);

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            codeforcesHandle,
            codeforcesVerified: false,
            verificationCode,
            verificationExpiresAt
        });

        const token = require("jsonwebtoken").sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(201).json({
            message: "Registration successful. Verify your Codeforces account to continue.",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                codeforcesHandle: user.codeforcesHandle,
                codeforcesVerified: user.codeforcesVerified
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({
            message: "Server error during registration."
        });
    }
};

const verifyCodeforces = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.codeforcesVerified) {
            return res.status(400).json({
                message: "Your Codeforces account is already verified."
            });
        }

        if (
            !user.verificationCode ||
            !user.verificationExpiresAt ||
            new Date(user.verificationExpiresAt) <= new Date()
        ) {
            return res.status(400).json({
                message: "Verification code expired. Please get a new code."
            });
        }

        const cfResponse = await fetch(
            `https://codeforces.com/api/user.info?handles=${encodeURIComponent(user.codeforcesHandle)}`
        );

        const cfData = await cfResponse.json();

        if (!cfResponse.ok || cfData.status !== "OK") {
            return res.status(400).json({
                message: "Could not verify your Codeforces profile."
            });
        }

        const cfUser = cfData.result[0];

        // The verification code must be set as the Codeforces profile's first name.
        if (cfUser.firstName !== user.verificationCode) {
            return res.status(400).json({
                message: "Verification code not found. Update your Codeforces profile and try again."
            });
        }

        const initialRating = Math.max(800, Number(cfUser.rating) || 0);

        user.codeforcesVerified = true;
        user.codebattleRating = initialRating;
        user.verificationCode = null;
        user.verificationExpiresAt = null;

        await user.save();

        return res.status(200).json({
            message: "Codeforces account verified successfully.",
            user: {
                id: user.id,
                username: user.username,
                codeforcesHandle: user.codeforcesHandle,
                codeforcesVerified: true
            }
        });
    } catch (error) {
        console.error("Codeforces verification error:", error);
        return res.status(500).json({
            message: "Server error during Codeforces verification."
        });
    }
};

const login = async(req, res) => {
    try{
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({
                message: "Email and password must require"
            });
        }
        const user = await User.findOne({
            where: { email }
        });
        if(!user){
            return res.status(401).json({
                message: "Invalid Email"
            });
        }
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        )
        if(!isPasswordCorrect){
            return res.status(401).json({
                message: "Incorrect Password"
            });
        }
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );
        return res.status(200).json({
            message: "Login Successfull",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                codeforcesHandle: user.codeforcesHandle,
                codebattleRating: user.codebattleRating
            }
        });

    }
    catch (error) {
        console.log("Login Error: ", error);
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }

}

const getMe = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findByPk(userId);
        if(!user){
            return res.status(404).json({
                message: "User not found"
            });
        }
        return res.status(200).json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                codeforcesHandle: user.codeforcesHandle,
                codeforcesVerified: user.codeforcesVerified,
                codebattleRating: user.codebattleRating,
            }
        });

    } catch (error) {
        console.error("Get user error: ", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};

const getVerificationCode = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.codeforcesVerified) {
            return res.status(400).json({
                message: "Your Codeforces account is already verified."
            });
        }

        if (
            !user.verificationCode ||
            !user.verificationExpiresAt ||
            new Date(user.verificationExpiresAt) <= new Date()
        ) {
            user.verificationCode =
                "CB_VERIFY-" + crypto.randomBytes(4).toString("hex");
            user.verificationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
            await user.save();
        }

        return res.status(200).json({
            verificationCode: user.verificationCode,
            codeforcesHandle: user.codeforcesHandle
        });
    } catch (error) {
        console.error("Get verification code error:", error);
        return res.status(500).json({
            message: "Could not retrieve verification code."
        });
    }
};

module.exports ={
    register,
    login,
    verifyCodeforces,
    getMe,
    getVerificationCode
}