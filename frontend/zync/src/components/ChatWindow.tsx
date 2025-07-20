"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Paperclip, MoreVertical, Download, Play, Pause, MessageCircle } from "lucide-react";
import { useSocket } from "@/context/SocketContext";
import toast from "react-hot-toast";
import VoiceRecorder from "./voiceRecorder";
import ImageUploader from "./ImageUploader";

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
      const res = await fetch(`http://localhost:8000/api/messages/${selectedUser._id}`, {
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
      const res = await fetch(`http://localhost:8000/api/messages/send/${selectedUser._id}`, {
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
      formData.append('file', audioBlob, 'voice-message.webm');
      formData.append('messageType', 'voice');
      formData.append('duration', duration.toString());

      console.log('Sending voice message to:', `http://localhost:8000/api/messages/send/${selectedUser._id}`);
      console.log('FormData contents:');
      for (const [key, value] of Object.entries(formData)) {
        console.log(key, value);
      }

      const res = await fetch(`http://localhost:8000/api/messages/send/${selectedUser._id}`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      console.log('Voice message response status:', res.status);
      console.log('Response headers:', Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Voice message error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || "Failed to send voice message" };
        }
        
        throw new Error(errorData.message || "Failed to send voice message");
      }

      const sentMessage = await res.json();
      console.log('Voice message sent successfully:', sentMessage);
      
      setMessages(prev => 
        prev.map(msg => 
          msg._id === optimisticMessage._id ? sentMessage : msg
        )
      );
      
      toast.success("Voice message sent!");
      
    } catch (error) {
      console.error("Send voice message error:", error);
      toast.error(`Failed to send voice message: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      formData.append('file', imageFile);
      formData.append('messageType', 'image');

      console.log('Sending image to:', `http://localhost:8000/api/messages/send/${selectedUser._id}`);

      const res = await fetch(`http://localhost:8000/api/messages/send/${selectedUser._id}`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      console.log('Image response status:', res.status);

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Image error:', errorData);
        throw new Error(errorData.message || "Failed to send image");
      }

      const sentMessage = await res.json();
      console.log('Image sent successfully:', sentMessage);
      
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
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Send size={48} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Welcome to Zync Chat</h2>
          <p className="text-gray-500">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={selectedUser.profilepic}
                alt={selectedUser.fullname}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://avatar.iran.liara.run/public/boy?username=${selectedUser.username}`;
                }}
              />
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{selectedUser.fullname}</h3>
              <p className="text-sm text-gray-500">
                {isTyping ? "Typing..." : isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <MoreVertical size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        {showVoiceRecorder && (
          <div className="mb-3">
            <VoiceRecorder 
              onSend={sendVoiceMessage}
              onCancel={() => setShowVoiceRecorder(false)}
            />
          </div>
        )}
        
        {showImageUploader && (
          <div className="mb-3">
            <ImageUploader 
              onSend={sendImageMessage}
              onCancel={() => setShowImageUploader(false)}
            />
          </div>
        )}

        <form onSubmit={sendTextMessage} className="flex items-center space-x-2">
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            onClick={() => setShowImageUploader(!showImageUploader)}
          >
            <Paperclip size={20} />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Type a message..."
              disabled={isSending || showVoiceRecorder || showImageUploader}
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            />
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setShowImageUploader(!showImageUploader)}
              className={`p-2 rounded-full cursor-pointer ${showImageUploader ? 'bg-red-100 text-red-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              <Paperclip size={20} />
            </button>

            <button
              type="button"
              onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
              className={`p-2 rounded-full cursor-pointer ${showVoiceRecorder ? 'bg-red-100 text-red-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              <MessageCircle size={20} />
            </button>

            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
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
          <div className="max-w-xs">
            {message.fileUrl ? (
              <img
                src={message.fileUrl}
                alt="Shared image"
                className="rounded-lg max-w-full h-auto cursor-pointer"
                onClick={() => window.open(message.fileUrl, '_blank')}
              />
            ) : (
              <div className="bg-gray-200 p-4 rounded-lg">
                <p className="text-sm">Loading image...</p>
              </div>
            )}
          </div>
        );
        
      case 'voice':
        return (
          <div className="flex items-center gap-2 min-w-[200px]">
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
              className={`p-2 rounded-full ${isOwn ? 'bg-green-700 text-white' : 'bg-gray-200 text-gray-700'} hover:opacity-80 disabled:opacity-50`}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            
            <div className="flex-1">
              <div className="text-sm">Voice message</div>
              <div className="text-xs opacity-70">
                {message.duration ? formatTime(message.duration) : '0:00'}
              </div>
            </div>
            
            {message.fileUrl && (
              <a
                href={message.fileUrl}
                download
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Download size={14} />
              </a>
            )}
          </div>
        );
        
      default:
        return <p className="text-sm">{message.message}</p>;
    }
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwn ? "flex-row-reverse space-x-reverse" : ""}`}>
        <img
          src={senderAvatar}
          alt="Avatar"
          className="w-8 h-8 rounded-full object-cover"
          onError={(e) => {
            e.currentTarget.src = `https://avatar.iran.liara.run/public/boy?username=user`;
          }}
        />
        <div
          className={`px-4 py-2 rounded-lg ${
            isOwn
              ? `bg-green-600 text-white rounded-br-none ${isOptimistic ? 'opacity-70' : ''}`
              : "bg-white text-gray-900 rounded-bl-none shadow-sm"
          }`}
        >
          {renderMessageContent()}
          <div className="flex items-center justify-between mt-1">
            <p className={`text-xs ${isOwn ? "text-green-100" : "text-gray-500"}`}>
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            {isOptimistic && (
              <div className="ml-2">
                <div className="animate-spin rounded-full h-3 w-3 border border-green-200 border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
