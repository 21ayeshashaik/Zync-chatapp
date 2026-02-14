import jwt from "jsonwebtoken";
import User from "../Models/userModels.js";

const isLogin = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            console.log(`Auth failed: No token provided for ${req.method} ${req.url}`);
            return res.status(401).json({ error: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            console.log(`Auth failed: User not found for ID ${decoded.userId}`);
            return res.status(404).json({ error: "User not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth error in isLogin middleware:", error.message);
        res.status(401).json({ error: "Invalid token" });
    }
};

export default isLogin;
