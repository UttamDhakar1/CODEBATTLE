const express = require("express");
const cors = require("cors");
// CORS -> CORS is a browswer security mechanism that controls
//  which frontend application is allowed to send backen API
const app = express();

const PORT = 8000;

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
    res.json({
        message: "CODEBATTLE Backend is Running !!",
    });
    // res.end("CodeBattle is running");
});
app.listen(PORT, ()=>{
    console.log(`CODEBATTLE is running on port ${PORT}`);
});