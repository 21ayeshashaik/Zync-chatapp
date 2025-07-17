"use client";

type Message = {
  id: number;
  text: string;
  sender: "you" | "other";
};

export default function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div className="flex-1 overflow-y-auto space-y-2 mb-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`p-2 px-4 rounded-lg max-w-xs ${
            msg.sender === "you"
              ? "bg-indigo-600 text-white ml-auto"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
}
