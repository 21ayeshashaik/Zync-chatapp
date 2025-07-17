"use client";

import { useEffect, useState, useRef } from "react";
import { Mic, Square, Play, Pause, Trash2, Send } from "lucide-react";

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void;
  onCancel?: () => void;
}

export default function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      audioChunksRef.current = [];
      setRecordingTime(0);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorderRef.current.start(100);
      setRecording(true);
      
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setDuration(recordingTime);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const playAudio = () => {
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

  const deleteRecording = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl("");
    setIsPlaying(false);
    setDuration(0);
    setRecordingTime(0);
  };

  const sendVoiceMessage = () => {
    if (audioBlob) {
      onSend(audioBlob, duration);
      deleteRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (audioBlob) {
    return (
      <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg">
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(Math.floor(audioRef.current.duration));
            }
          }}
        />
        
        <div
          onClick={playAudio}
          className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 cursor-pointer"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </div>
        
        <div className="flex-1">
          <div className="text-sm text-gray-600">Voice message</div>
          <div className="text-xs text-gray-500">{formatTime(duration)}</div>
        </div>
        
        <div
          onClick={deleteRecording}
          className="p-2 text-red-500 hover:bg-red-50 rounded-full cursor-pointer"
        >
          <Trash2 size={16} />
        </div>
        
        <div
          onClick={sendVoiceMessage}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 cursor-pointer"
        >
          <Send size={16} />
        </div>
        
        {onCancel && (
          <div
            onClick={onCancel}
            className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            Cancel
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {recording ? (
        <div className="flex items-center gap-2 bg-red-50 p-2 rounded-lg">
          <div
            onClick={stopRecording}
            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 animate-pulse cursor-pointer"
          >
            <Square size={16} />
          </div>
          <div className="text-sm text-red-600">
            Recording... {formatTime(recordingTime)}
          </div>
        </div>
      ) : (
        <div
          onClick={startRecording}
          className="cursor-pointer"
        >
          <Mic size={20} />
        </div>
      )}
    </div>
  );
}
