import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Nav from "@/components/nav"
import Footer from "@/components/footer"

const instrumentSans = localFont({
  src: "../../public/fonts/InstrumentSans-Variable.woff2",
  display: "swap",
  variable: "--font-instrument-sans",
});

const sora = localFont({
  src: "../../public/fonts/Sora-Variable.woff2",
  display: "swap",
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "Layoutr",
  description: "AI-native sitemap and wireframe builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${sora.variable}`}
    >
      <body className="min-h-full flex flex-col relative w-screen font-sans overflow-x-hidden">

        <Nav />
        <main className="px-[150px]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
