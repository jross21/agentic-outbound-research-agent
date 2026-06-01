import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Outreach Agent — grounded account research → personalized outbound",
  description:
    "An autonomous research agent that runs a transparent tool-use loop to research a target account, builds a cited evidence ledger, and drafts a personalized multi-touch outbound sequence — gated by human approval before any enrollment.",
  keywords: [
    "GTM engineering",
    "agentic systems",
    "outbound",
    "account research",
    "RevOps",
    "tool use",
    "Claude",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
