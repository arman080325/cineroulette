"use client";

import { useState } from "react";

interface SpinResult {
  title: {
    id: string;
    title: string;
    releaseYear: number | null;
    overview: string | null;
    posterPath: string | null;
  };
  scoreExplanation: string;
}

const MOODS = [
  "feel-good",
  "funny",
  "emotional",
  "romantic",
  "exciting",
  "scary",
  "mind-bending",
  "relaxing",
  "heartwarming",
  "dark",
];

export default function HomePage() {
  const [mood, setMood] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function spin() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minRating: minRating || undefined }),
      });
      const data = await res.json();
      if (!data.title) {
        setMessage(data.message ?? "No matches.");
        setResult(null);
      } else {
        setResult(data);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8 px-4">
      <h1 className="text-4xl font-bold">CineRoulette</h1>
      <p className="text-neutral-400">Stop Searching. Start Watching.</p>

      <div className="flex flex-wrap gap-2 justify-center max-w-xl">
        {MOODS.map((m) => (
          <button
            key={m}
            onClick={() => setMood(mood === m ? null : m)}
            className={`px-4 py-2 rounded-full text-sm border ${
              mood === m ? "bg-red-600 border-red-600" : "border-neutral-700"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm text-neutral-400">Min rating</label>
        <input
          type="range"
          min={0}
          max={9}
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
        />
        <span>{minRating || "Any"}</span>
      </div>

      <button
        onClick={spin}
        disabled={loading}
        className="px-8 py-4 rounded-2xl bg-red-600 text-lg font-semibold disabled:opacity-50"
      >
        {loading ? "Spinning..." : "🎬 Spin the Roulette"}
      </button>

      {message && <p className="text-neutral-400">{message}</p>}

      {result && (
        <div className="mt-6 max-w-md bg-neutral-900 rounded-2xl p-6 text-center">
          <h2 className="text-2xl font-semibold">
            {result.title.title} {result.title.releaseYear ? `(${result.title.releaseYear})` : ""}
          </h2>
          <p className="text-neutral-400 mt-2">{result.title.overview}</p>
          <p className="text-sm text-red-400 mt-4">{result.scoreExplanation}</p>
        </div>
      )}
    </main>
  );
}
