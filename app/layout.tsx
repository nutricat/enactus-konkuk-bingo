import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "기말고사 빙고 🎯",
  description: "기말고사 빙고 챌린지",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
