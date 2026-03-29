import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signal — AI Investment Intelligence",
  description: "Fundamentals + news + sentiment + Polymarket crowd wisdom. One clear signal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
