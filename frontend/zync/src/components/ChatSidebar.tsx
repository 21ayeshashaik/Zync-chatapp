"use client";
import { useState, useEffect } from "react";
import { Search, LogOut, Settings, User as UserIcon, X, Camera } from "lucide-react";
import { useSocket } from "@/context/SocketContext";
import { API_URL } from "@/lib/constants";
import toast from "react-hot-toast";

interface User {
  _id: string;
  username: string;
  fullname: string;
  profilepic: string;
  bio?: string;
  email?: string;
}

interface Props {
  currentUser: User;
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  unreadCounts: Record<string, number>;
  refreshTrigger?: number;
}

export default function ChatSidebar({ currentUser, selectedUser, onSelectUser, onLogout, onUpdateUser, unreadCounts, refreshTrigger }: Props) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [currentChatters, setCurrentChatters] = useState<User[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { onlineUsers } = useSocket();

  useEffect(() => {
    fetchCurrentChatters();
  }, [refreshTrigger, currentUser]);

  const fetchCurrentChatters = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/currentchatters`, {
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
      const res = await fetch(`${API_URL}/api/users/search?search=${encodeURIComponent(search)}`, {
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
    <div className="w-80 bg-[#1e293b] border-r border-white/10 flex flex-col h-full shadow-2xl relative">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setShowProfileModal(true)}>
            <div className="relative">
              <img
                src={currentUser.profilepic}
                alt={currentUser.fullname}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/20 group-hover:border-white/50 transition-all"
                onError={(e) => {
                  e.currentTarget.src = `https://avatar.iran.liara.run/public/boy?username=${currentUser.username}`;
                }}
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1e293b] rounded-full"></div>
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-lg leading-tight truncate w-32 group-hover:text-purple-100 transition-colors">{currentUser.fullname}</h2>
              <p className="text-xs text-white/80 font-medium tracking-wide">SETTINGS</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowProfileModal(true)}
              className="p-2.5 hover:bg-white/10 rounded-xl transition-all active:scale-95"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={onLogout}
              className="p-2.5 hover:bg-white/10 rounded-xl transition-all active:scale-95 text-red-100 hover:text-red-400"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {showProfileModal && (
        <ProfileModal
          user={currentUser}
          onClose={() => setShowProfileModal(false)}
          onUpdate={onUpdateUser}
        />
      )}

      {/* Search */}
      <div className="p-4 pb-2">
        <div className="relative group">
          <Search className="absolute left-3.5 top-3.5 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-white/5 text-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2">
        {search ? (
          <div className="space-y-1">
            <h3 className="text-[11px] font-bold text-gray-500 mb-2 px-3 tracking-widest uppercase">Search Results</h3>
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
          <div className="space-y-1">
            <h3 className="text-[11px] font-bold text-gray-500 mb-3 px-3 tracking-widest uppercase">Messages</h3>
            {currentChatters.length > 0 ? (
              currentChatters.map((user) => (
                <UserItem
                  key={user._id}
                  user={user}
                  isSelected={selectedUser?._id === user._id}
                  isOnline={isOnline(user._id)}
                  unreadCount={unreadCounts[user._id] || 0}
                  onClick={() => onSelectUser(user)}
                />
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 text-sm">No recent chats</p>
                <p className="text-gray-600 text-[11px] mt-1 italic">Try searching for a friend</p>
              </div>
            )}
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
      className={`flex items-center space-x-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 ${isSelected
        ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/20 shadow-lg"
        : "hover:bg-white/5 border border-transparent"
        }`}
    >
      <div className="relative">
        <img
          src={user.profilepic}
          alt={user.fullname}
          className={`w-12 h-12 rounded-full object-cover border-2 ${isSelected ? 'border-purple-400/30' : 'border-transparent'}`}
          onError={(e) => {
            e.currentTarget.src = `https://avatar.iran.liara.run/public/boy?username=${user.username}`;
          }}
        />
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#1e293b] rounded-full shadow-sm"></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>{user.fullname}</h4>
          {unreadCount > 0 && (
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-[20px] px-1.5 flex items-center justify-center shadow-lg shadow-purple-500/30 animate-in zoom-in-50 duration-200">
              +{unreadCount > 9 ? '9' : unreadCount}
            </div>
          )}
        </div>
        <p className={`text-xs truncate ${isSelected ? 'text-purple-300' : 'text-gray-500'}`}>
          {user.bio || `@${user.username}`}
        </p>
      </div>
    </div>
  );
}

function ProfileModal({ user, onClose, onUpdate }: { user: User; onClose: () => void; onUpdate: (user: User) => void }) {
  const [fullname, setFullname] = useState(user.fullname);
  const [bio, setBio] = useState(user.bio || "");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(user.profilepic);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePic(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append('fullname', fullname);
      formData.append('bio', bio);
      if (profilePic) {
        formData.append('profilePic', profilePic);
      }

      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        credentials: "include",
        body: formData
      });

      if (res.ok) {
        const updatedUser = await res.json();
        onUpdate(updatedUser);
        toast.success("Profile updated successfully!");
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error || "Update failed");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1e293b] border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <UserIcon size={24} />
            <h3 className="text-xl font-bold">Profile Settings</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={() => document.getElementById('pic-upload')?.click()}>
              <img
                src={previewUrl}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border-4 border-purple-500/30 group-hover:border-purple-500 transition-all shadow-xl"
                onError={(e) => {
                  e.currentTarget.src = `https://avatar.iran.liara.run/public/boy?username=${user.username}`;
                }}
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={24} />
              </div>
              <input
                id="pic-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <p className="mt-3 text-xs text-gray-500 font-bold tracking-widest uppercase">Tap to change photo</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Full Name</label>
              <input
                type="text"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                className="w-full bg-slate-800/50 border border-white/5 text-gray-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                placeholder="Ex: John Doe"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Bio / Status</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-slate-800/50 border border-white/5 text-gray-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all h-24 resize-none"
                placeholder="Write a short bio..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex-[2] bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-purple-900/20 hover:from-purple-500 hover:to-blue-500 transition-all active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isUpdating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
