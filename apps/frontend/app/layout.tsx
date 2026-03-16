import type { Metadata } from "next";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/toaster";
import "highlight.js/styles/github.css";
import "@uiw/react-markdown-preview/markdown.css";
import "@uiw/react-md-editor/markdown-editor.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hogaprüefung",
  description: "Azubi web application frontend",
};

function LearningBackdrop() {
  return (
    <div aria-hidden className="learning-backdrop">
      <div className="learning-backdrop-mesh" />
      <div className="learning-backdrop-orb learning-backdrop-orb--primary" />
      <div className="learning-backdrop-orb learning-backdrop-orb--accent" />
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="relative isolate min-h-screen overflow-x-hidden">
          <LearningBackdrop />
          <QueryProvider>
            <div className="relative z-10 kokonut-fade">{children}</div>
            <Toaster />
          </QueryProvider>
        </div>
      </body>
    </html>
  );
}
