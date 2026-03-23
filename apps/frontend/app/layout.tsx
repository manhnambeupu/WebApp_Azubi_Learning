import type { Metadata } from "next";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "highlight.js/styles/github.css";
import "@uiw/react-markdown-preview/markdown.css";
import "@uiw/react-md-editor/markdown-editor.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Azubi Learning",
    default: "Hogaprüefung - Nền tảng học tập Azubi",
  },
  description:
    "Hệ thống quản lý bài giảng, kiểm tra và theo dõi tiến độ học tập chuyên nghiệp.",
  openGraph: {
    title: "Azubi Learning App",
    description: "Hệ thống quản lý bài giảng, kiểm tra và theo dõi tiến độ học tập.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <div className="relative isolate min-h-screen overflow-x-hidden">
            <div role="presentation">
              <LearningBackdrop />
            </div>
            <QueryProvider>
              <main className="relative z-10 kokonut-fade">{children}</main>
              <Toaster />
            </QueryProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
