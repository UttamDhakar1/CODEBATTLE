const express = require("express");
const cors = require("cors");
// CORS -> CORS is a browswer security mechanism that controls
//  which frontend application is allowed to send backen API
const User = require("./models/User.js");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes.js");
const authenticate = require("./middleware/authMiddleware.js");
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.get("/api/auth/me", authenticate, (req, res) => {
    res.json({
        message: "You are authenticated",
        user: req.user
    });
});
const sequelize = require("./config/database.js");
const Battle = require("./models/Battle");
const BattleParticipant = require("./models/BattleParticipant.js");

const PORT =  process.env.PORT || 5001;

app.get("/", (req, res) => {
    res.json({
        message: "CODEBATTLE Backend is Running !!",
    });
    // res.end("CodeBattle is running");
});

const startServer = async() => {
    try{
        await sequelize.authenticate();
        console.log("MySQL database connected");
        await sequelize.sync();
        console.log("Database Table Sync!!!")
        app.listen(PORT, () =>{
            console.log(`CODEBATTLE is running on port ${PORT}`);
        });
    }
    catch(error){
        console.log("Unable to connect to MySQL");
        console.error(error.message);
    }
};

startServer();