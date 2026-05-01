import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RAG Chatbot — Chat with your PDFs",
  description:
    "Upload a PDF and ask questions. Powered by OpenAI embeddings + Supabase pgvector.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="min-h-screen font-sans antialiased app-bg">{children}</body>
    </html>
  );
}
