"use client";

import { useState } from "react";
import { SpinReel, SpinReelResult } from "@/components/SpinReel";

interface SpinApiResponse {
  title: SpinReelResult & { id: string };
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

type Stage = "idle" | "revving" | "spinning" | "revealed";

export default function HomePage() {
  const [mood, setMood] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<SpinReelResult | null>(null);
  const [explanation, setExplanation] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function spin() {
    setStage("revving");
    setMessage(null);
    setExplanation("");
    setResult(null);

    try {
      const res = await fetch("/api/v1/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minRating: minRating || undefined }),
      });
      const data: { title: SpinApiResponse["title"] | null; scoreExplanation?: string; message?: string } =
        await res.json();

      if (!data.title) {
        setMessage(data.message ?? "No matches for these filters yet — try loosening one.");
        setStage("idle");
        return;
      }

      setResult(data.title);
      setExplanation(data.scoreExplanation ?? "");
      setStage("spinning"); // hands off to SpinReel's own timed sequence
    } catch {
      setMessage("Something went wrong mid-spin. Try again.");
      setStage("idle");
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">CineRoulette</h1>
        <p className="text-neutral-400 mt-1">Stop Searching. Start Watching.</p>
      </div>

      {stage === "idle" && (
        <>
          <div className="flex flex-wrap gap-2 justify-center max-w-xl">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => setMood(mood === m ? null : m)}
                className={`px-4 py-2 rounded-pill text-sm border transition-colors ${
                  mood === m ? "bg-marquee border-marquee" : "border-neutral-700 hover:border-neutral-500"
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
            <span className="w-10 text-sm">{minRating || "Any"}</span>
          </div>

          <button
            onClick={spin}
            className="px-8 py-4 rounded-2xl bg-marquee text-lg font-semibold hover:brightness-110 active:scale-95 transition"
          >
            🎬 Spin the Roulette
          </button>

          {message && <p className="text-neutral-400 text-sm">{message}</p>}
        </>
      )}

      {stage === "revving" && (
        <div className="flex flex-col items-center gap-3 text-neutral-400">
          <div className="h-10 w-10 rounded-full border-2 border-marquee border-t-transparent animate-spin" />
          <span className="text-sm tracking-wide">revving up the reel...</span>
        </div>
      )}

      {(stage === "spinning" || stage === "revealed") && result && (
        <div className="flex flex-col items-center gap-6 w-full">
          <SpinReel
            spinning={stage === "spinning"}
            result={result}
            onRevealComplete={() => setStage("revealed")}
          />

          {stage === "revealed" && (
            <div className="max-w-sm w-full text-center animate-[fadeUp_0.4s_ease-out]">
              <h2 className="text-2xl font-semibold">
                {result.title} {result.releaseYear ? `(${result.releaseYear})` : ""}
              </h2>
              {result.overview && (
                <p className="text-neutral-400 mt-2 text-sm leading-relaxed">{result.overview}</p>
              )}
              <p className="text-sm text-amber-400 mt-4 italic">{explanation}</p>

              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <button
                  onClick={spin}
                  className="px-5 py-2.5 rounded-2xl bg-marquee font-medium hover:brightness-110 active:scale-95 transition"
                >
                  🔁 Spin Again
                </button>
                <button className="px-5 py-2.5 rounded-2xl border border-neutral-700 hover:border-neutral-500 transition">
                  ❤️ Save
                </button>
                <button className="px-5 py-2.5 rounded-2xl border border-neutral-700 hover:border-neutral-500 transition">
                  ✋ Not Interested
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
