import "./globals.css";
import type { Metadata } from "next";
import { Bebas_Neue, Inter, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AnalyticsInit } from "@/components/AnalyticsInit";
import { AppHeader } from "@/components/AppHeader";

const display = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

// Ticket stubs are printed in monospace — this grounds the metaphor in a
// real material detail and gives numeric data its own voice.
const data = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-data",
});

export const metadata: Metadata = {
  title: "CineRoulette — Stop Searching. Start Watching.",
  description: "Set a mood, hit spin, get one great explained movie pick.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${data.variable}`}>
      <body className="bg-velvet text-smoke">
        <AnalyticsInit />
        <a href="#stage" className="skip-link">Skip to result</a>
        <div className="grain-overlay" aria-hidden="true" />
        <AppHeader />
        {children}
        <footer className="text-center text-xs text-ash py-6 font-body">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}