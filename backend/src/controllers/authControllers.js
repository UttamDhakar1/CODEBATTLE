const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
// Use for randomly generate code
const register = async(req, res) => {
    try {
        const {username, email, password, codeforcesHandle} = req.body;
        if(!username || !email || !password || !codeforcesHandle){
            return res.status(400).json({
                message: "Username, email, password and CodeforcesHandle are required"
            });
        }
        const existingUsername = await User.findOne({
            where: { username }
        });
        if(existingUsername){
            return res.status(409).json({
                message: "Username Already exists"
            });
        }

        const existedEmail = await User.findOne({
            where: {email}
        });
        if(existedEmail){
            return res.status(409).json({
                message: "Email already exists"
            });
        }
        const existedCoder = await User.findOne({
            where : {codeforcesHandle}
        });
        if(existedCoder){
            return res.status(409).json({
                message: "Codeforces account already existed"
            })
        }
        const verificationCode = `CB_VERIFY-${crypto
            .randomBytes(4)
            .toString("hex")
            .toUpperCase()}`;

        const verificationExpiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        );
        // console.log("varification Code: ", verificationCode);
        // Bcrypt password
        const hashPassword = await bcrypt.hash(password, 10);
        
        const user = await User.create({
            // id,
            username,
            email,
            password: hashPassword,
            codeforcesHandle,
            verificationCode,
            verificationExpiresAt
        });

        return res.status(201).json({
            message: "User register successful",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                codeforces: user.codeforcesHandle,
                codebattleRating: user.codebattleRating
            }
        })
    }
    catch (error) {
        console.error("registration Error: ", error);

        return res.status(500)
        .json({
            message: "Internal server Error"
        });
    }
};

const verifyCodeforces = async(req, res) => {
    try{
        const userId = req.user.id;
        // console.log("Authenticated user ID:", req.user.id);
        const {verificationCode} = req.body;
        if(!verificationCode){
            return res.status(400).json({
                message: "verification code is required"
            });
        }
        const user = await User.findByPk(userId);
        if(!user){
            return res.status(404).json({
                message: "user not found"
            });
        }
        if(user.codeforcesVerified) {
            return res.status(400).json({
                message: "Codeforces account is already verified"
            });
        }
        // console.log("Authenticated User ID:", userId);
        // console.log("Database Verification Code:", user.verificationCode);
        // console.log("Received Verification Code:", verificationCode);
        if(user.verificationCode !== verificationCode){
            return res.status(400).json({
                message: "Invalid verification code"
            });
        }
        if(
            !user.verificationExpiresAt || new Date() > user.verificationExpiresAt
        ) {
            return res.status(400).json({
                message: "verification code has expired"
            });
        }
        const response = await fetch(
            `https://codeforces.com/api/user.info?handles=${encodeURIComponent(user.codeforcesHandle)}`
        );
        const data = await response.json();
        if(data.status !== "OK"){
            return res.status(400).json({
                message: "Unable to find Codeforces account"
            });
        }
        const codeforcesUser = data.result[0];
        if(codeforcesUser.firstName !== user.verificationCode){
            return res.status(400).json({
                message: "Verification code not found in Codeforces Profile"
            });
        }
        user.codeforcesVerified = true;
        user.verificationCode = null;
        user.verificationExpiresAt = null;
        await user.save();
        return res.status(200).json({
            message: "Codeforces account verify Successfully"
        });

    }
    catch (error){
        console.log("Codeforces verification failed", error);
        return res.status(500).json({
            message: "Internal server error"
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
                codebattleRating: user.codebattleRating
            }
        });

    } catch (error) {
        console.log("Get user error: ", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};

module.exports ={
    register,
    login,
    verifyCodeforces,
    getMe
}