import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/dbconnect.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { app, server } from "./Socket/socket.js";
import path from 'path';
import { fileURLToPath } from 'url';

// Import route handlers
import { userRegister, userLogin, userLogOut, getCurrentUser, getAllUsers } from "./routeControlers/userrouteControler.js";
import { getMessages, sendMessage } from "./routeControlers/messagerouteControler.js";
import { getUserBySearch, getCurrentChatters } from "./routeControlers/userhandlerControler.js";
import isLogin from "./middleware/isLogin.js";
import upload from "./middleware/upload.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ['http://localhost:3002', 'http://localhost:3000'],
    credentials: true
}));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth routes
app.post("/api/auth/register", userRegister);
app.post("/api/auth/login", userLogin);
app.post("/api/auth/logout", userLogOut);
app.get("/api/auth/me", isLogin, getCurrentUser);

// User routes
app.get("/api/users", isLogin, getAllUsers);
app.get("/api/users/search", isLogin, getUserBySearch);
app.get("/api/users/currentchatters", isLogin, getCurrentChatters);

// Message routes
app.post('/api/messages/send/:id', isLogin, upload.single('file'), sendMessage);
app.get('/api/messages/:id', isLogin, getMessages);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

server.listen(PORT, () => {
    connectDB();
    console.log(`Server running on port ${PORT}`);
});
