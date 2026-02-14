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
      <div className="flex items-center gap-4 bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl animate-in fade-in slide-in-from-bottom-2">
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={() => {
            if (audioRef.current && isFinite(audioRef.current.duration)) {
              setDuration(Math.floor(audioRef.current.duration));
            }
          }}
        />

        <button
          onClick={playAudio}
          className="w-10 h-10 bg-purple-600 hover:bg-purple-500 text-white rounded-full flex items-center justify-center transition-all shadow-lg shadow-purple-900/20 active:scale-90"
        >
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-1.5 relative">
            <div className={`absolute top-0 left-0 h-full bg-purple-500 ${isPlaying ? 'animate-progress' : ''}`} style={{ width: isPlaying ? '100%' : '0%' }}></div>
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase text-gray-500">
            <span>READY TO SEND</span>
            <span className="font-mono text-purple-400">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={deleteRecording}
            className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all active:scale-90"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>

          <button
            onClick={sendVoiceMessage}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-90"
            title="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl">
      {recording ? (
        <>
          <div className="relative">
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-25"></div>
            <button
              onClick={stopRecording}
              className="relative w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all active:scale-90"
            >
              <Square size={16} fill="currentColor" />
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs font-bold tracking-widest uppercase text-red-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Recording
              </span>
              <span className="font-mono">{formatTime(recordingTime)}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-4 w-full">
          <button
            onClick={startRecording}
            className="w-full flex items-center justify-center gap-3 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 py-3 rounded-xl border border-purple-500/20 transition-all active:scale-[0.98]"
          >
            <Mic size={20} />
            <span className="text-sm font-bold tracking-wider uppercase">Tap to record voice</span>
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-3 text-sm font-bold tracking-wider uppercase text-gray-500 hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

