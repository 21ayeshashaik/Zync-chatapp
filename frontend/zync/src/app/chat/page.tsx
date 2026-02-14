"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SocketProvider, useSocket } from "@/context/SocketContext";
import ChatSidebar from "@/components/ChatSidebar";
import ChatWindow from "@/components/ChatWindow";
import toast, { Toaster } from "react-hot-toast";
import { API_URL } from "@/lib/constants";

interface User {
  _id: string;
  username: string;
  fullname: string;
  profilepic: string;
  bio?: string;
}

interface Message {
  _id: string;
  senderId: string | { _id: string };
  reciverId: string | { _id: string };
  message: string;
  messageType: 'text' | 'image' | 'voice';
  duration?: number;
  fileUrl?: string;
  createdAt: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        credentials: "include"
      });

      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Auth error:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (!confirmLogout) return;

    try {
      const res = await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Logged out successfully");
        router.push("/login");
      }
    } catch {
      toast.error("Logout failed");
    }
  };

  const handleNewMessage = useCallback((senderId: string) => {
    console.log("Handling new message from:", senderId);

    // Always refresh sidebar order when any message arrives
    setRefreshTrigger(prev => prev + 1);

    // Only increment unread count if we are NOT currently chatting with this person
    // Use a ref-safe way to check selectedUser
    setSelectedUser(current => {
      if (current?._id !== senderId) {
        setUnreadCounts(prev => {
          const newCounts = {
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1
          };
          console.log("Updated unread counts:", newCounts);
          return newCounts;
        });
      }
      return current;
    });
  }, []);

  const handleSelectUser = useCallback((user: User) => {
    console.log("Selected user:", user.fullname);
    setSelectedUser(user);
    // Clear unread count for selected user
    setUnreadCounts(prev => ({
      ...prev,
      [user._id]: 0
    }));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <SocketProvider userId={currentUser._id}>
      <ChatContent
        currentUser={currentUser}
        selectedUser={selectedUser}
        unreadCounts={unreadCounts}
        refreshTrigger={refreshTrigger}
        onSelectUser={handleSelectUser}
        onLogout={handleLogout}
        onNewMessage={handleNewMessage}
        onUpdateUser={setCurrentUser}
      />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }}
      />
    </SocketProvider>
  );
}

function ChatContent({
  currentUser,
  selectedUser,
  unreadCounts,
  refreshTrigger,
  onSelectUser,
  onLogout,
  onNewMessage,
  onUpdateUser
}: {
  currentUser: User;
  selectedUser: User | null;
  unreadCounts: Record<string, number>;
  refreshTrigger: number;
  onSelectUser: (user: User) => void;
  onLogout: () => void;
  onNewMessage: (senderId: string) => void;
  onUpdateUser: (user: User) => void;
}) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleSocketMessage = (message: Message) => {
      console.log("Global Socket Event [newMessage]:", message);
      const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId._id;
      const receiverId = typeof message.reciverId === 'string' ? message.reciverId : message.reciverId._id;

      if (receiverId === currentUser._id) {
        console.log("Message is for me! Triggering onNewMessage for sender:", senderId);
        onNewMessage(senderId);
      }
    };

    socket.on("newMessage", handleSocketMessage);
    return () => {
      socket.off("newMessage", handleSocketMessage);
    };
  }, [socket, currentUser._id, onNewMessage]);

  return (
    <div className="flex h-screen bg-[#0f172a] text-white">
      <ChatSidebar
        currentUser={currentUser}
        selectedUser={selectedUser}
        onSelectUser={onSelectUser}
        onLogout={onLogout}
        onUpdateUser={onUpdateUser}
        unreadCounts={unreadCounts}
        refreshTrigger={refreshTrigger}
      />
      <ChatWindow
        currentUser={currentUser}
        selectedUser={selectedUser}
      />
    </div>
  );
}
