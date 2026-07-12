import "./globals.css";
import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AnalyticsInit } from "@/components/AnalyticsInit";

// Bebas Neue reads exactly like physical marquee/poster lettering — the one
// deliberate typographic risk this design takes. Inter carries body copy so
// the display face stays special-occasion, not a burden to read paragraphs in.
const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "CineRoulette — Stop Searching. Start Watching.",
  description: "Set a mood, hit spin, get one great explained movie pick.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <AnalyticsInit />

        <div className="grain-overlay" aria-hidden="true" />

        {children}

        {/* TMDB attribution — required */}
        <footer className="text-center text-xs text-neutral-600 py-6 font-body">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </footer>

        {/* Vercel Analytics */}
        <Analytics />

        {/* Vercel Speed Insights */}
        <SpeedInsights />
      </body>
    </html>
  );
}