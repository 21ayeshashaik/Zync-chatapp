import express from "express";
import { getAllUsers, getUserProfile, updateProfile } from "../routeControlers/userrouteControler.js";
import isLogin from "../middleware/isLogin.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// User routes - FIXED: ensure proper route patterns
router.get("/", isLogin, getAllUsers);
router.get("/:id", isLogin, getUserProfile);
router.put("/profile", isLogin, upload.single('profilepic'), updateProfile);

export default router;
