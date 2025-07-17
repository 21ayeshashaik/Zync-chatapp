"use client";
import { useState } from "react";
import { Plus, LogOut } from "lucide-react";

const dummyChats = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Smith" },
  { id: 3, name: "Dev Chat Group" },
];

export default function Sidebar() {
  const [chats, setChats] = useState(dummyChats);
  const [activeChat, setActiveChat] = useState<number | null>(null);

  return (
    <div className="h-screen w-72 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="text-xl font-bold text-indigo-600">Zync Chat</div>
        <button
          className="text-indigo-500 hover:text-indigo-700"
          onClick={() => alert("New Chat Modal")}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => setActiveChat(chat.id)}
            className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${
              activeChat === chat.id ? "bg-indigo-100" : ""
            }`}
          >
            <p className="font-medium text-gray-800">{chat.name}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-600">👤 You</div>
        <button
          className="text-red-500 hover:text-red-700"
          onClick={() => alert("Logging out...")}
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
