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
      <head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kanit:wght@500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&family=Silkscreen:wght@400;700&display=swap"/></head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
