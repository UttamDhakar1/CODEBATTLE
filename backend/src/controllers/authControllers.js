const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const register = async(req, res) => {
    try {
        const {username, email, password} = req.body;
        if(!username || !email || !password){
            return res.status(400).json({
                message: "Username, email and password are required"
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
        // const existedCoder = await User.findOne({
        //     where : {codeforcesHandle}
        // });
        // if(existedCoder){
        //     return res.status(409).json({
        //         message: "Codeforces account already existed"
        //     })
        // }
        // Bcrypt password
        const hashPassword = await bcrypt.hash(password, 10);
        
        const user = await User.create({
            // id,
            username,
            email,
            password: hashPassword
        });

        return res.status(201).json({
            message: "User register successful",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                // codeforces: user.codeforcesHandle,
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

module.exports ={
    register,
    login
}