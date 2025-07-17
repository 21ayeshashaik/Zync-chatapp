"use client";
import { useState, useEffect } from "react";
import { Search, LogOut, MessageCircle } from "lucide-react";
import { useSocket } from "@/context/SocketContext";

interface User {
  _id: string;
  username: string;
  fullname: string;
  profilepic: string;
}

interface Props {
  currentUser: User;
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
  onLogout: () => void;
  unreadCounts: Record<string, number>;
}

export default function ChatSidebar({ currentUser, selectedUser, onSelectUser, onLogout, unreadCounts }: Props) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [currentChatters, setCurrentChatters] = useState<User[]>([]);
  const { onlineUsers } = useSocket();

  useEffect(() => {
    fetchCurrentChatters();
  }, []);

  const fetchCurrentChatters = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/users/currentchatters", {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentChatters(data);
      }
    } catch (error) {
      console.error("Failed to fetch chatters:", error);
    }
  };

  const searchUsers = async () => {
    if (!search.trim()) {
      setUsers([]);
      return;
    }
    
    try {
      console.log("Searching for:", search);
      const res = await fetch(`http://localhost:8000/api/users/search?search=${encodeURIComponent(search)}`, {
        credentials: "include"
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log("Search results:", data);
        setUsers(data);
      } else {
        console.error("Search failed with status:", res.status);
        const errorData = await res.json();
        console.error("Error details:", errorData);
      }
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchUsers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const isOnline = (userId: string) => onlineUsers.includes(userId);

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-green-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={currentUser.profilepic}
              alt={currentUser.fullname}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://avatar.iran.liara.run/public/boy?username=${currentUser.username}`;
              }}
            />
            <div>
              <h2 className="font-semibold">{currentUser.fullname}</h2>
              <p className="text-sm opacity-90">Online</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-2 hover:bg-green-700 rounded-full transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {search ? (
          <div className="p-2">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Search Results</h3>
            {users.map((user) => (
              <UserItem
                key={user._id}
                user={user}
                isSelected={selectedUser?._id === user._id}
                isOnline={isOnline(user._id)}
                unreadCount={unreadCounts[user._id] || 0}
                onClick={() => onSelectUser(user)}
              />
            ))}
          </div>
        ) : (
          <div className="p-2">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Recent Chats</h3>
            {currentChatters.map((user) => (
              <UserItem
                key={user._id}
                user={user}
                isSelected={selectedUser?._id === user._id}
                isOnline={isOnline(user._id)}
                unreadCount={unreadCounts[user._id] || 0}
                onClick={() => onSelectUser(user)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserItem({ user, isSelected, isOnline, unreadCount, onClick }: {
  user: User;
  isSelected: boolean;
  isOnline: boolean;
  unreadCount: number;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected ? "bg-green-100" : "hover:bg-gray-100"
      }`}
    >
      <div className="relative">
        <img
          src={user.profilepic}
          alt={user.fullname}
          className="w-12 h-12 rounded-full object-cover"
          onError={(e) => {
            e.currentTarget.src = `https://avatar.iran.liara.run/public/boy?username=${user.username}`;
          }}
        />
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">{user.fullname}</h4>
        <p className="text-sm text-gray-500">@{user.username}</p>
      </div>
      <div className="flex items-center space-x-2">
        {unreadCount > 0 && (
          <div className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
        <MessageCircle size={16} className="text-gray-400" />
      </div>
    </div>
  );
}
