"use client";

import { useState, useRef } from "react";
import { Image, Send } from "lucide-react";

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
      <div className="bg-gray-100 p-3 rounded-lg max-w-xs">
        <img
          src={previewUrl}
          alt="Preview"
          className="w-full h-32 object-cover rounded-lg mb-2"
        />
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedImage.name} ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
          </div>
          
          <div className="flex gap-2">
            {onCancel && (
              <div
                onClick={onCancel}
                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                Cancel
              </div>
            )}
            <div
              onClick={sendImage}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 cursor-pointer"
            >
              <Send size={16} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        onClick={() => fileInputRef.current?.click()}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full cursor-pointer"
      >
        <Image size={20} />
      </div>
      
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
