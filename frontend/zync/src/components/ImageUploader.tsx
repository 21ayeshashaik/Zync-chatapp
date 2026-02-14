"use client";

import { useState, useRef } from "react";
import { Image as ImageIcon, Send, X } from "lucide-react";

interface ImageUploaderProps {
  onSend: (imageFile: File) => void;
  onCancel?: () => void;
}

export default function ImageUploader({ onSend, onCancel }: ImageUploaderProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const sendImage = () => {
    if (selectedImage) {
      onSend(selectedImage);
      resetState();
    }
  };

  const resetState = () => {
    setSelectedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (selectedImage) {
    return (
      <div className="bg-slate-800/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl max-w-sm animate-in fade-in zoom-in-95">
        <div className="relative aspect-video rounded-xl overflow-hidden mb-4 border border-white/5">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <button
            onClick={resetState}
            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-200 truncate">{selectedImage.name}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
              {(selectedImage.size / 1024 / 1024).toFixed(2)} MB • READY
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={sendImage}
              className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center justify-center gap-3 w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 py-3 rounded-xl border border-blue-500/20 transition-all active:scale-[0.98]"
      >
        <ImageIcon size={20} />
        <span className="text-sm font-bold tracking-wider uppercase">Select a photo</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/*"
        onChange={handleFileSelect}
      />
    </>
  );
}

