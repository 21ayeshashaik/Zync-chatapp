import express from "express";
import { userRegister, userLogin, userLogOut, getCurrentUser } from "../routeControlers/userrouteControler.js";
import isLogin from "../middleware/isLogin.js";

const router = express.Router();

router.post("/register", userRegister);
router.post("/login", userLogin);
router.post("/logout", userLogOut);
router.get("/me", isLogin, getCurrentUser);

export default router;
