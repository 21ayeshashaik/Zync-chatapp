"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SocketProvider } from "@/context/SocketContext";
import ChatSidebar from "@/components/ChatSidebar";
import ChatWindow from "@/components/ChatWindow";
import toast, { Toaster } from "react-hot-toast";

interface User {
  _id: string;
  username: string;
  fullname: string;
  profilepic: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("https://zync-chatapp-4.onrender.com/api/auth/me", {
        credentials: "include"
      });
      
      if (res.ok) {
        const user = await res.json();
        console.log("Current user:", user);
        setCurrentUser(user);
      } else {
        console.log("Auth failed, redirecting to login");
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
    const res = await fetch("https://zync-chatapp-4.onrender.com/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Logout failed");
    }

    toast.success("Logged out successfully");
    router.push("/login");
  } catch (error) {
    toast.error("Logout failed");
  }
};

  const handleNewMessage = (senderId: string) => {
    if (selectedUser?._id !== senderId) {
      setUnreadCounts(prev => ({
        ...prev,
        [senderId]: (prev[senderId] || 0) + 1
      }));
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    // Clear unread count for selected user
    setUnreadCounts(prev => ({
      ...prev,
      [user._id]: 0
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <SocketProvider userId={currentUser._id}>
      <div className="flex h-screen bg-gray-100">
        <ChatSidebar 
          currentUser={currentUser}
          selectedUser={selectedUser}
          onSelectUser={handleSelectUser}
          onLogout={handleLogout}
          unreadCounts={unreadCounts}
        />
        <ChatWindow 
          currentUser={currentUser}
          selectedUser={selectedUser}
          onNewMessage={handleNewMessage}
        />
      </div>
      <Toaster position="top-right" />
    </SocketProvider>
  );
}
