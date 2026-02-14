import express from "express";
import dns from "dns";

// Fix for DNS resolution issues with MongoDB Atlas
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (error) {
    console.error("Failed to set DNS servers:", error);
}
import dotenv from "dotenv";
import connectDB from "./db/dbconnect.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { app, server } from "./Socket/socket.js";
import path from 'path';
import { fileURLToPath } from 'url';

// Import route handlers
import { userRegister, userLogin, userLogOut, getCurrentUser, getAllUsers, updateProfile } from "./routeControlers/userrouteControler.js";
import { getMessages, sendMessage } from "./routeControlers/messagerouteControler.js";
import { getUserBySearch, getCurrentChatters } from "./routeControlers/userhandlerControler.js";
import isLogin from "./middleware/isLogin.js";
import upload from "./middleware/upload.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = process.env.PORT || 8000;

// Middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
        'https://zync-chatapp-6zz8.vercel.app/'
    ],
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
app.put("/api/users/profile", isLogin, upload.single('profilePic'), updateProfile);

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
