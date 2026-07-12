import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative min-h-screen text-white flex flex-col items-center justify-center px-4 text-center">
      <div className="hero-spotlight" />
      <div className="relative z-10">
        <h1 className="font-display text-6xl text-gold mb-4">Scene Missing</h1>
        <p className="text-neutral-400 font-body mb-8">
          That title isn&apos;t in the reel — it may have been removed or never existed.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-2xl bg-marquee font-body font-medium hover:brightness-110 transition focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          🎬 Back to CineRoulette
        </Link>
      </div>
    </main>
  );
}