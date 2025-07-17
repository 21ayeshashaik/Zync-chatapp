import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Zync Chat",
  description: "A modern chat application",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
