"use client";

import { useState } from "react";

export default function MessageInput({ onSend }: { onSend: (msg: string) => void }) {
  const [message, setMessage] = useState("");

  const sendMessage = () => {
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };

  return (
    <div className="mt-4 flex gap-2">
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:outline-none"
      />
      <button
        onClick={sendMessage}
        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
      >
        Send
      </button>
    </div>
  );
}
