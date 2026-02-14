'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden px-4">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]"></div>

      <div className="text-center max-w-lg relative z-10 px-6 py-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl">
        <div className="w-24 h-24 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-purple-500/20">
          <MessageCircle size={48} className="text-white" />
        </div>

        <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Zync Chat
          </span>
        </h1>

        <p className="text-gray-400 mb-10 text-lg leading-relaxed max-w-sm mx-auto">
          Experience seamless, high-performance messaging with premium dark aesthetics.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/login" className="w-full sm:w-auto">
            <button className="w-full bg-white text-slate-900 px-8 py-3.5 rounded-2xl font-bold hover:bg-gray-100 transition duration-300 shadow-xl shadow-white/5 active:scale-95">
              Get Started
            </button>
          </Link>
          <Link href="/register" className="w-full sm:w-auto">
            <button className="w-full bg-white/5 text-white border border-white/10 px-8 py-3.5 rounded-2xl font-bold hover:bg-white/10 transition duration-300 active:scale-95">
              Create Account
            </button>
          </Link>
        </div>

        <div className="mt-12 flex items-center justify-center gap-6 text-gray-500 text-sm font-medium">
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Secure</span>
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Private</span>
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div> Fast</span>
        </div>
      </div>
    </main>
  );
}

