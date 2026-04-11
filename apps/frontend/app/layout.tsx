import type { Metadata } from "next";
import { JetBrains_Mono, Nunito } from "next/font/google";
import { JsonLd } from "@/components/seo/json-ld";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "highlight.js/styles/github.css";
import "@uiw/react-markdown-preview/markdown.css";
import "@uiw/react-md-editor/markdown-editor.css";
import "./globals.css";

const frontendUrl = process.env.FRONTEND_URL;
const siteUrl =
  frontendUrl && frontendUrl.startsWith("http")
    ? frontendUrl
    : "http://localhost:3000";
const normalizedSiteUrl = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
const iconVersion = process.env.NEXT_PUBLIC_ICON_VERSION?.trim() || "20260411";
const brandSameAs = (process.env.NEXT_PUBLIC_BRAND_SAME_AS ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter((entry) => entry.startsWith("http"));
const azubivnKnowsAbout = [
  "Fachkraft für Gastronomie",
  "Abschlussprüfung Gastronomie",
  "Ausbildung in Deutschland",
  "Gastronomie Nachhilfe",
] as const;
const organizationId = `${normalizedSiteUrl}/#organization`;
const websiteId = `${normalizedSiteUrl}/#website`;

const brandEntitySchemas = [
  {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": organizationId,
    name: "AzubiVN",
    url: normalizedSiteUrl,
    logo: "https://azubivn.de/images/Logo_Book.png",
    areaServed: { "@type": "Country", name: "Germany" },
    foundingDate: "2026",
    description:
      "Nền tảng phi lợi nhuận hỗ trợ người Việt học và chuẩn bị Ausbildung tại Đức.",
    knowsAbout: [...azubivnKnowsAbout],
    ...(brandSameAs.length > 0 ? { sameAs: brandSameAs } : {}),
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId,
    url: normalizedSiteUrl,
    name: "AzubiVN",
    inLanguage: "vi-VN",
    publisher: {
      "@id": organizationId,
    },
    knowsAbout: [...azubivnKnowsAbout],
    ...(brandSameAs.length > 0 ? { sameAs: brandSameAs } : {}),
  },
];

const nunito = Nunito({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-nunito",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(normalizedSiteUrl),
  title: {
    template: "%s | AzubiVN",
    default: "AzubiVN - Nền tảng học tập Azubi",
  },
  description:
    "Nền tảng phi lợi nhuận hỗ trợ người Việt học và chuẩn bị Ausbildung tại Đức.",
  applicationName: "AzubiVN",
  icons: {
    icon: [
      { url: `/favicon.ico?v=${iconVersion}` },
      { url: `/icon.png?v=${iconVersion}`, type: "image/png", sizes: "512x512" },
    ],
    shortcut: [{ url: `/favicon.ico?v=${iconVersion}` }],
    apple: [
      { url: `/apple-icon.png?v=${iconVersion}`, type: "image/png", sizes: "180x180" },
    ],
  },
  alternates: {
    canonical: "/",
    languages: {
      "vi-DE": "/",
    },
  },
  openGraph: {
    title: "AzubiVN - Nền tảng học tập Azubi",
    description:
      "Nền tảng phi lợi nhuận hỗ trợ người Việt học và chuẩn bị Ausbildung tại Đức.",
    type: "website",
    locale: "vi_VN",
    siteName: "AzubiVN",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "AzubiVN - Nền tảng học tập Azubi",
    description:
      "Nền tảng phi lợi nhuận hỗ trợ người Việt học và chuẩn bị Ausbildung tại Đức.",
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
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${nunito.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <JsonLd data={brandEntitySchemas} />
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
