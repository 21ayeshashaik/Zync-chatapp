"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  type: "login" | "register";
}

export default function AuthForm({ type }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isLogin = type === "login";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`${type.toUpperCase()} with: ${email}, ${password}`);
    // TODO: Call backend API
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-500 to-indigo-600 px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
          {isLogin ? "Welcome Back" : "Create an Account"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition"
          >
            {isLogin ? "Login" : "Register"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          {isLogin ? (
            <>
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-indigo-600 font-semibold">
                Register
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-600 font-semibold">
                Login
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
