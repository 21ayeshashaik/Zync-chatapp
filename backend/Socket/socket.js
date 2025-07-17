import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001"],
        credentials: true
    }
});

const userSocketMap = {}; // userId -> socketId

io.on("connection", (socket) => {
    console.log("New connection", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) {
        userSocketMap[userId] = socket.id;
        console.log(`User ${userId} connected with socket ${socket.id}`);
    }

    // Handle online status
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log(`Socket ${socket.id} disconnected`);
        
        // Find and remove the disconnected user
        for (const [key, value] of Object.entries(userSocketMap)) {
            if (value === socket.id) {
                delete userSocketMap[key];
                console.log(`User ${key} disconnected`);
                break;
            }
        }
        
        // Update online users for all clients
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

// Helper function to get a receiver's socket ID
const getReciverSocketId = (reciverId) => {
    return userSocketMap[reciverId];
};

export { app, server, io, getReciverSocketId };
