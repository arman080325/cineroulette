import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CineRoulette — Stop Searching. Start Watching.",
  description: "Set a mood, hit spin, get one great explained movie pick.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* TMDB attribution — required, Section 14 */}
        <footer className="text-center text-xs text-neutral-600 py-4">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </footer>
      </body>
    </html>
  );
}
