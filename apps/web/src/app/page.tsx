"use client";

import { useEffect, useState } from "react";
import { SpinReel, SpinReelResult } from "@/components/SpinReel";
import { getSessionId } from "@/lib/session";

const MOODS = [
  { label: "feel-good", icon: "😊" },
  { label: "funny", icon: "😂" },
  { label: "emotional", icon: "😢" },
  { label: "romantic", icon: "💕" },
  { label: "exciting", icon: "⚡" },
  { label: "scary", icon: "👻" },
  { label: "mind-bending", icon: "🌀" },
  { label: "relaxing", icon: "🌊" },
  { label: "heartwarming", icon: "🔥" },
  { label: "dark", icon: "🌑" },
];

type Stage = "idle" | "revving" | "spinning" | "revealed";
type InteractionState = "idle" | "saved" | "not-interested";

export default function HomePage() {
  const [sessionId, setSessionId] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [languages, setLanguages] = useState<{ code: string; name: string }[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<SpinReelResult | null>(null);
  const [explanation, setExplanation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [interaction, setInteraction] = useState<InteractionState>("idle");

  // Anonymous session id (Section 20) — generated once on the client, never sent anywhere but our own API.
  useEffect(() => {
    setSessionId(getSessionId());
    fetch("/api/v1/genres")
      .then((r) => r.json())
      .then((d) => setGenres(d.genres ?? []))
      .catch(() => setGenres([]));
    fetch("/api/v1/languages")
      .then((r) => r.json())
      .then((d) => setLanguages(d.languages ?? []))
      .catch(() => setLanguages([]));
  }, []);

  async function spin() {
    setStage("revving");
    setMessage(null);
    setExplanation("");
    setResult(null);
    setInteraction("idle");

    try {
      const res = await fetch("/api/v1/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minRating: minRating || undefined,
          sessionId: sessionId || undefined,
          genre: selectedGenre ? [selectedGenre] : undefined,
          language: selectedLanguage || undefined,
        }),
      });
      const data: { title: SpinReelResult | null; scoreExplanation?: string; message?: string } =
        await res.json();

      if (!data.title) {
        setMessage(data.message ?? "No matches for these filters yet — try loosening one.");
        setStage("idle");
        return;
      }

      setResult(data.title);
      setExplanation(data.scoreExplanation ?? "");
      setStage("spinning");
    } catch {
      setMessage("Something went wrong mid-spin. Try again.");
      setStage("idle");
    }
  }

  async function sendInteraction(action: "SAVED" | "NOT_INTERESTED" | "WATCHED") {
    if (!result) return;
    if (action === "SAVED") setInteraction("saved");
    if (action === "NOT_INTERESTED") setInteraction("not-interested");

    try {
      await fetch("/api/v1/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleId: result.id, action, sessionId }),
      });
    } catch {
      // Non-critical — worst case the signal is lost for this one spin, not worth surfacing an error over.
    }
  }

  return (
    <main className="relative min-h-screen text-white flex flex-col items-center px-4 py-16 overflow-hidden">
      <div className="hero-spotlight" />

      <div className="relative z-10 text-center mb-10">
        <h1 className="font-display text-7xl sm:text-8xl tracking-wide text-gold drop-shadow-[0_0_18px_rgba(255,211,106,0.25)]">
          CineRoulette
        </h1>
        <p className="text-neutral-400 mt-1 font-body tracking-wide">Stop Searching. Start Watching.</p>
      </div>

      {stage === "idle" && (
        <div className="relative z-10 flex flex-col items-center gap-8 w-full">
          <div className="flex flex-wrap gap-2.5 justify-center max-w-xl">
            {MOODS.map((m) => (
              <button
                key={m.label}
                onClick={() => setMood(mood === m.label ? null : m.label)}
                className={`px-4 py-2 rounded-pill text-sm font-body border transition-all flex items-center gap-1.5 ${mood === m.label
                  ? "bg-marquee border-marquee shadow-glow"
                  : "border-neutral-700 hover:border-gold/60 hover:text-gold"
                  }`}
              >
                <span>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 font-body">
            <label className="text-sm text-neutral-400">Min rating</label>
            <input
              type="range"
              min={0}
              max={9}
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="accent-marquee"
            />
            <span className="w-10 text-sm text-gold">{minRating || "Any"}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 font-body text-sm">
            <select
              value={selectedGenre ?? ""}
              onChange={(e) => setSelectedGenre(e.target.value || null)}
              className="bg-neutral-900 border border-neutral-700 rounded-pill px-4 py-2 text-neutral-300 focus:border-gold outline-none"
            >
              <option value="">Any genre</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-neutral-900 border border-neutral-700 rounded-pill px-4 py-2 text-neutral-300 focus:border-gold outline-none"
            >
              <option value="">Any language</option>
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={spin}
            className="relative px-10 py-5 rounded-2xl bg-marquee font-display text-2xl tracking-wide shadow-glow hover:brightness-110 active:scale-95 transition-all"
          >
            🎬 Spin the Roulette
          </button>

          {message && <p className="text-neutral-400 text-sm font-body">{message}</p>}
        </div>
      )}

      {stage === "revving" && (
        <div className="relative z-10 flex flex-col items-center gap-3 text-neutral-400 mt-8">
          <div className="h-10 w-10 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          <span className="text-sm tracking-wide font-body">revving up the reel...</span>
        </div>
      )}

      {(stage === "spinning" || stage === "revealed") && result && (
        <div className="relative z-10 flex flex-col items-center gap-0 w-full">
          <SpinReel
            spinning={stage === "spinning"}
            result={result}
            onRevealComplete={() => setStage("revealed")}
          />

          {stage === "revealed" && (
            <div
              className="max-w-[300px] w-full text-center mt-0 animate-[fadeUp_0.4s_ease-out]"
              style={{ ["--ticket-bg" as string]: "#0a0605" }}
            >
              <div className="ticket-divider" />
              <div className="pt-5 px-1">
                <p className="text-xs tracking-[0.3em] text-gold/70 font-body uppercase mb-1">
                  Admit One
                </p>
                <h2 className="font-display text-3xl tracking-wide">
                  {result.title} {result.releaseYear ? `· ${result.releaseYear}` : ""}
                </h2>

                <div className="flex flex-wrap justify-center gap-1.5 mt-3 font-body text-xs">
                  {typeof result.voteAverage === "number" && (
                    <span className="px-2.5 py-1 rounded-pill border border-gold/40 text-gold">
                      ★ {result.voteAverage.toFixed(1)}
                    </span>
                  )}
                  {result.genres?.map((g) => (
                    <span key={g} className="px-2.5 py-1 rounded-pill border border-neutral-700 text-neutral-300">
                      {g}
                    </span>
                  ))}
                </div>
                {result.overview && (
                  <p className="text-neutral-400 mt-4 text-sm leading-relaxed font-body">{result.overview}</p>
                )}

                {result.watchProviders && result.watchProviders.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mt-4 font-body text-xs">
                    {Array.from(new Set(result.watchProviders.map((w) => w.name)))
                      .slice(0, 4)
                      .map((name) => {
                        const provider = result.watchProviders!.find((w) => w.name === name)!;

                        return (
                          <a
                            key={name}
                            href={provider.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-pill border border-neutral-700 text-neutral-300 hover:border-gold/60 hover:text-gold transition"
                          >
                            ▶ {name}
                          </a>
                        );
                      })}
                  </div>
                )}

                <p className="text-sm text-gold mt-4 italic font-body">{explanation}</p>

                <div className="flex flex-wrap justify-center gap-3 mt-6 font-body">
                  <button
                    onClick={spin}
                    className="px-5 py-2.5 rounded-2xl bg-marquee font-medium hover:brightness-110 active:scale-95 transition shadow-glow"
                  >
                    🔁 Spin Again
                  </button>
                  <button
                    onClick={() => sendInteraction("SAVED")}
                    disabled={interaction === "saved"}
                    className={`px-5 py-2.5 rounded-2xl border transition ${interaction === "saved"
                      ? "border-gold text-gold"
                      : "border-neutral-700 hover:border-gold/60 hover:text-gold"
                      }`}
                  >
                    {interaction === "saved" ? "✓ Saved" : "❤️ Save"}
                  </button>
                  <button
                    onClick={() => sendInteraction("NOT_INTERESTED")}
                    disabled={interaction === "not-interested"}
                    className={`px-5 py-2.5 rounded-2xl border transition ${interaction === "not-interested"
                      ? "border-neutral-600 text-neutral-600"
                      : "border-neutral-700 hover:border-neutral-500 text-neutral-400"
                      }`}
                  >
                    {interaction === "not-interested" ? "Noted" : "✋ Not Interested"}
                  </button>
                  <a
                    href={`/title/${result.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-2xl border border-neutral-700 hover:border-gold/60 hover:text-gold transition font-body"
                  >
                    🔗 Share
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )
      }
    </main >
  );
}