import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Layoutr - AI-native sitemap and wireframe builder",
  description:
    "Build sitemaps and wireframes visually or via API/MCP. Designed for AI agents and humans alike.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.variable} ${ibmPlexMono.variable} font-sans antialiased text-slate-50`}>
        {children}
      </body>
    </html>
  );
}
