import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PitchPilot — AI Sales Proposal Copilot",
  description:
    "Multi-agent sales copilot that researches a prospect, matches offerings, and drafts a customized proposal — with a human review checkpoint.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
