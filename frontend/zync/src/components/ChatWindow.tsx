"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Paperclip, MoreVertical, Download, Play, Pause, MessageCircle, Smile } from "lucide-react";
import { useSocket } from "@/context/SocketContext";
import toast from "react-hot-toast";
import VoiceRecorder from "./voiceRecorder";
import ImageUploader from "./ImageUploader";
import { API_URL } from "@/lib/constants";

interface User {
  _id: string;
  username: string;
  fullname: string;
  profilepic: string;
}

interface Message {
  _id: string;
  senderId: string | User;
  reciverId: string | User;
  message: string;
  createdAt: string;
  messageType?: 'text' | 'image' | 'voice';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
}

interface Props {
  currentUser: User;
  selectedUser: User | null;
  onNewMessage?: (senderId: string) => void;
}

export default function ChatWindow({ currentUser, selectedUser, onNewMessage }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, onlineUsers } = useSocket();

  // Fetch messages when selected user changes
  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [selectedUser]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      console.log("Received new message via socket:", message);

      const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId._id;
      const receiverId = typeof message.reciverId === 'string' ? message.reciverId : message.reciverId._id;

      // Only add message if it's for current conversation
      if (selectedUser &&
        ((senderId === selectedUser._id && receiverId === currentUser._id) ||
          (senderId === currentUser._id && receiverId === selectedUser._id))) {

        setMessages(prev => {
          const exists = prev.some(msg => msg._id === message._id);
          if (exists) return prev;

          // Add new message and sort in reverse chronological order (newest first)
          return [...prev, message].sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
      }

      // Trigger unread count for messages received by current user from others
      if (receiverId === currentUser._id && senderId !== currentUser._id && onNewMessage) {
        onNewMessage(senderId);
      }
    };

    const handleUserTyping = (data: { senderId: string; isTyping: boolean }) => {
      if (selectedUser && data.senderId === selectedUser._id) {
        setIsTyping(data.isTyping);
        if (data.isTyping) {
          setTimeout(() => setIsTyping(false), 3000);
        }
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("userTyping", handleUserTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("userTyping", handleUserTyping);
    };
  }, [socket, selectedUser, currentUser._id, onNewMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!selectedUser) return;

    try {
      const res = await fetch(`${API_URL}/api/messages/${selectedUser._id}`, {
        credentials: "include"
      });

      if (res.ok) {
        const data = await res.json();
        // Sort messages by creation time (oldest to newest for display)
        setMessages(data.sort((a: Message, b: Message) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ));
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast.error("Failed to load messages");
    }
  };

  const sendTextMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedUser || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      senderId: currentUser._id,
      reciverId: selectedUser._id,
      message: messageText,
      createdAt: new Date().toISOString(),
      messageType: 'text'
    };

    // Add optimistic message to the end (newest)
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const res = await fetch(`${API_URL}/api/messages/send/${selectedUser._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ messages: messageText, messageType: 'text' })
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const sentMessage = await res.json();
      setMessages(prev =>
        prev.map(msg =>
          msg._id === optimisticMessage._id ? sentMessage : msg
        )
      );

    } catch (error) {
      console.error("Send message error:", error);
      toast.error("Failed to send message");
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const sendVoiceMessage = async (audioBlob: Blob, duration: number) => {
    if (!selectedUser || isSending) return;

    setIsSending(true);
    setShowVoiceRecorder(false);

    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      senderId: currentUser._id,
      reciverId: selectedUser._id,
      message: 'Voice message',
      createdAt: new Date().toISOString(),
      messageType: 'voice',
      duration: duration
    };

    // Add optimistic message to the end (newest)
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const formData = new FormData();
      formData.append('messageType', 'voice');
      formData.append('duration', duration.toString());
      formData.append('file', audioBlob, 'voice-message.webm');

      const res = await fetch(`${API_URL}/api/messages/send/${selectedUser._id}`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (!res.ok) {
        throw new Error("Failed to send voice message");
      }

      const sentMessage = await res.json();
      setMessages(prev =>
        prev.map(msg =>
          msg._id === optimisticMessage._id ? sentMessage : msg
        )
      );

      toast.success("Voice message sent!");

    } catch (error) {
      console.error("Send voice message error:", error);
      toast.error(`Failed to send voice message`);
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
    } finally {
      setIsSending(false);
    }
  };

  const sendImageMessage = async (imageFile: File) => {
    if (!selectedUser || isSending) return;

    setIsSending(true);
    setShowImageUploader(false);

    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      senderId: currentUser._id,
      reciverId: selectedUser._id,
      message: 'Image',
      createdAt: new Date().toISOString(),
      messageType: 'image',
      fileName: imageFile.name
    };

    // Add optimistic message to the end (newest)
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const formData = new FormData();
      formData.append('messageType', 'image');
      formData.append('file', imageFile);

      const res = await fetch(`${API_URL}/api/messages/send/${selectedUser._id}`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (!res.ok) {
        throw new Error("Failed to send image");
      }

      const sentMessage = await res.json();
      setMessages(prev =>
        prev.map(msg =>
          msg._id === optimisticMessage._id ? sentMessage : msg
        )
      );

      toast.success("Image sent!");

    } catch (error) {
      console.error("Send image error:", error);
      toast.error("Failed to send image");
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (socket && selectedUser) {
      socket.emit('typing', {
        senderId: currentUser._id,
        receiverId: selectedUser._id,
        isTyping: e.target.value.length > 0
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getSenderId = (message: Message): string => {
    return typeof message.senderId === 'string' ? message.senderId : message.senderId._id;
  };

  const isOnline = selectedUser ? onlineUsers.includes(selectedUser._id) : false;

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0f172a] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]"></div>
        <div className="text-center relative z-10">
          <div className="w-24 h-24 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl rotate-3 transform transition-transform hover:rotate-0 duration-500">
            <MessageCircle size={48} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Select a Chat</h2>
          <p className="text-gray-400 max-w-[250px] mx-auto text-sm leading-relaxed">
            Choose a friend from the sidebar and start your conversation on Zync
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0f172a] h-full relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Chat Header */}
      <div className="bg-[#1e293b]/80 backdrop-blur-md border-b border-white/5 p-4 z-20 sticky top-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={selectedUser.profilepic}
                alt={selectedUser.fullname}
                className="w-11 h-11 rounded-full object-cover border-2 border-white/10"
                onError={(e) => {
                  e.currentTarget.src = `https://avatar.iran.liara.run/public/boy?username=${selectedUser.username}`;
                }}
              />
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#1e293b] rounded-full"></div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg tracking-tight">{selectedUser.fullname}</h3>
              <p className={`text-xs font-medium flex items-center ${isTyping ? "text-purple-400 animate-pulse" : isOnline ? "text-green-400" : "text-gray-500"}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isTyping ? "bg-purple-400" : isOnline ? "bg-green-400" : "bg-gray-500"}`}></span>
                {isTyping ? "Typing..." : isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
          <button className="p-2.5 hover:bg-white/5 rounded-xl transition-all active:scale-90 text-gray-400">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar scroll-smooth">
        {messages.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            isOwn={getSenderId(message) === currentUser._id}
            senderAvatar={getSenderId(message) === currentUser._id ? currentUser.profilepic : selectedUser.profilepic}
            isOptimistic={message._id.startsWith('temp-')}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <div className="bg-[#1e293b]/60 backdrop-blur-xl border-t border-white/5 p-4 relative z-20">
        {showVoiceRecorder && (
          <div className="mb-4 animate-in slide-in-from-bottom-5 duration-300">
            <VoiceRecorder
              onSend={sendVoiceMessage}
              onCancel={() => setShowVoiceRecorder(false)}
            />
          </div>
        )}

        {showImageUploader && (
          <div className="mb-4 animate-in slide-in-from-bottom-5 duration-300">
            <ImageUploader
              onSend={sendImageMessage}
              onCancel={() => setShowImageUploader(false)}
            />
          </div>
        )}

        <form onSubmit={sendTextMessage} className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={`p-2.5 rounded-xl transition-all active:scale-90 ${showImageUploader ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              onClick={() => {
                setShowImageUploader(!showImageUploader);
                setShowVoiceRecorder(false);
              }}
              title="Send Image"
            >
              <Paperclip size={20} />
            </button>
            <button
              type="button"
              className={`p-2.5 rounded-xl transition-all active:scale-90 ${showVoiceRecorder ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              onClick={() => {
                setShowVoiceRecorder(!showVoiceRecorder);
                setShowImageUploader(false);
              }}
              title="Voice Message"
            >
              <MessageCircle size={20} />
            </button>
          </div>

          <div className="flex-1 relative group">
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Write a message..."
              disabled={isSending || showVoiceRecorder || showImageUploader}
              className="w-full bg-slate-800/80 border border-white/5 text-gray-100 pl-5 pr-12 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all placeholder:text-gray-500 disabled:opacity-50"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-400 transition-colors"
            >
              <Smile size={20} />
            </button>
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="p-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
            ) : (
              <Send size={22} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message, isOwn, senderAvatar, isOptimistic }: {
  message: Message;
  isOwn: boolean;
  senderAvatar: string;
  isOptimistic?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const playVoiceMessage = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMessageContent = () => {
    switch (message.messageType) {
      case 'image':
        return (
          <div className="max-w-[280px] rounded-2xl overflow-hidden shadow-xl border border-white/10 group relative">
            {message.fileUrl ? (
              <>
                <img
                  src={message.fileUrl}
                  alt="Shared"
                  className="w-full h-auto cursor-zoom-in transition-transform duration-500 group-hover:scale-105"
                  onClick={() => window.open(message.fileUrl, '_blank')}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <Download size={24} className="text-white transform scale-90 group-hover:scale-100 transition-transform" />
                </div>
              </>
            ) : (
              <div className="bg-slate-800 p-8 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mb-2"></div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Processing Image</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'voice':
        return (
          <div className={`flex items-center gap-3 min-w-[220px] p-1 ${isOwn ? 'text-white' : 'text-gray-100'}`}>
            {message.fileUrl && (
              <audio
                ref={audioRef}
                src={message.fileUrl}
                onEnded={() => setIsPlaying(false)}
              />
            )}

            <button
              onClick={playVoiceMessage}
              disabled={!message.fileUrl}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isOwn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20'} disabled:opacity-50`}
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>

            <div className="flex-1">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-1.5 relative">
                <div className={`absolute top-0 left-0 h-full bg-current opacity-40 ${isPlaying ? 'animate-progress' : ''}`} style={{ width: isPlaying ? '100%' : '0%' }}></div>
              </div>
              <div className="flex justify-between items-center px-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">Voice Note</span>
                <span className="text-[11px] font-mono tabular-nums opacity-60">
                  {message.duration ? formatTime(message.duration) : '0:00'}
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{message.message}</p>;
    }
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] lg:max-w-md ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
        <div className="shrink-0 mb-1">
          <img
            src={senderAvatar}
            alt="User"
            className="w-8 h-8 rounded-full object-cover border border-white/5 shadow-sm"
            onError={(e) => {
              e.currentTarget.src = `https://avatar.iran.liara.run/public/boy?username=user`;
            }}
          />
        </div>
        <div
          className={`relative px-4 py-3 rounded-2xl shadow-lg ${isOwn
            ? `bg-gradient-to-br from-purple-600 to-blue-700 text-white rounded-br-none ${isOptimistic ? 'opacity-70 grayscale-[0.5]' : ''}`
            : "bg-[#1e293b] text-gray-100 border border-white/5 rounded-bl-none"
            }`}
        >
          {renderMessageContent()}
          <div className={`flex items-center justify-end gap-1.5 mt-1.5 opacity-50 ${isOwn ? "text-purple-100" : "text-gray-400"}`}>
            <p className="text-[10px] font-medium uppercase tracking-tighter">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            {isOwn && !isOptimistic && (
              <div className="flex items-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
            )}
            {isOptimistic && (
              <div className="animate-spin rounded-full h-2.5 w-2.5 border border-white/40 border-t-transparent"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

