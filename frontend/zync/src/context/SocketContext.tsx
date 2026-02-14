"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL } from "@/lib/constants";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: []
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, userId }: { children: React.ReactNode; userId?: string }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (userId) {
      console.log("Connecting socket for user:", userId);

      const newSocket = io(API_URL, {
        query: { userId },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
        console.log("User ID sent:", userId);
      });

      newSocket.on("getOnlineUsers", (users: string[]) => {
        console.log("Online users updated:", users);
        setOnlineUsers(users);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      setSocket(newSocket);

      return () => {
        console.log("Cleaning up socket connection");
        newSocket.close();
        setSocket(null);
        setOnlineUsers([]);
      };
    }
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
