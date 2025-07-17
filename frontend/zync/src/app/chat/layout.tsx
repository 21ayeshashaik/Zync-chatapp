// app/chat/layout.tsx
"use client";
import { ReactNode } from "react";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen">
      {children}
    </div>
  );
}
