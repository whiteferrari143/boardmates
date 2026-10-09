import type { Metadata } from "next";
import "./globals.css";
import "./deception.css";

export const metadata: Metadata = {
  title: "Boardmates · ชวนเพื่อนมาเล่น",
  description: "ล็อบบี้และห้องบอร์ดเกมออนไลน์กับเพื่อน",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased">{children}</body>
    </html>
  );
}
