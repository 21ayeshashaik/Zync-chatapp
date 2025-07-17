import express from "express";
import { getMessages, sendMessage } from "../routeControlers/messagerouteControler.js";
import isLogin from "../middleware/isLogin.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Message routes - FIXED: ensure proper route patterns
router.post('/send/:id', isLogin, upload.single('file'), sendMessage);
router.get('/:id', isLogin, getMessages);

export default router;
