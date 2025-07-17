'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-green-100 px-4">
      <div className="text-center max-w-md">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
          alt="Zync Logo"
          className="w-24 h-24 mx-auto mb-6"
        />
        <h1 className="text-4xl font-bold text-green-700 mb-2">Zync Chat</h1>
        <p className="text-gray-700 mb-6">
          A modern WhatsApp-style chat application. Secure. Fast. Private.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/login">
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition duration-300">
              Login
            </button>
          </Link>
          <Link href="/register">
            <button className="bg-white text-green-700 border border-green-600 px-6 py-2 rounded-lg hover:bg-green-50 transition duration-300">
              Register
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
