const User = require("../models/User");

const requireCodeforcesVerified = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(401).json({
                message: "User not found."
            });
        }

        if (user.codeforcesVerified !== true) {
            return res.status(403).json({
                message: "Verify your Codeforces account before accessing battles."
            });
        }

        next();
    } catch (error) {
        console.error("Verification middleware error:", error);

        return res.status(500).json({
            message: "Could not verify account status."
        });
    }
};

module.exports = requireCodeforcesVerified;