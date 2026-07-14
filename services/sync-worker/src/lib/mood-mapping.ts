/**
 * Mood tagging heuristic — resolves Section 28's open question ("which
 * mood tags are assigned via TMDB keywords/genres vs. requiring a
 * supplemental tagging pass?") with: genre gives a base signal, TMDB
 * keywords refine it. No LLM call, no extra cost — both sources already
 * come from data we're syncing anyway.
 *
 * Deliberately conservative: only the 10 starter moods (Section 28's own
 * "pilot a small, well-tested set before expanding" guidance), and a
 * title only gets a mood tag if its aggregated weight clears
 * MOOD_WEIGHT_THRESHOLD — weak signals don't produce noisy tags.
 */

export const MOOD_WEIGHT_THRESHOLD = 0.3;

const GENRE_MOOD_WEIGHTS: Record<string, { mood: string; weight: number }[]> = {
  Comedy: [
    { mood: "funny", weight: 0.8 },
    { mood: "feel-good", weight: 0.5 },
  ],
  Romance: [
    { mood: "romantic", weight: 0.9 },
    { mood: "heartwarming", weight: 0.4 },
  ],
  Horror: [
    { mood: "scary", weight: 0.9 },
    { mood: "dark", weight: 0.5 },
  ],
  Thriller: [
    { mood: "exciting", weight: 0.7 },
    { mood: "dark", weight: 0.4 },
  ],
  Drama: [{ mood: "emotional", weight: 0.7 }],
  "Science Fiction": [{ mood: "mind-bending", weight: 0.6 }],
  Fantasy: [{ mood: "mind-bending", weight: 0.4 }],
  Family: [
    { mood: "feel-good", weight: 0.7 },
    { mood: "heartwarming", weight: 0.5 },
  ],
  Animation: [{ mood: "feel-good", weight: 0.5 }],
  Crime: [
    { mood: "dark", weight: 0.5 },
    { mood: "exciting", weight: 0.4 },
  ],
  Mystery: [{ mood: "mind-bending", weight: 0.6 }],
  Action: [{ mood: "exciting", weight: 0.8 }],
  Music: [
    { mood: "feel-good", weight: 0.4 },
    { mood: "relaxing", weight: 0.3 },
  ],
  War: [{ mood: "dark", weight: 0.6 }],
  Documentary: [{ mood: "relaxing", weight: 0.3 }],
  Adventure: [{ mood: "exciting", weight: 0.5 }],
  History: [{ mood: "emotional", weight: 0.3 }],
  "TV Movie": [{ mood: "relaxing", weight: 0.2 }],
};

// Substring match against TMDB keyword names, case-insensitive. Each hit
// adds to (not replaces) whatever the genre pass already contributed.
const KEYWORD_MOOD_BOOSTS: { pattern: string; mood: string; weight: number }[] = [
  { pattern: "tearjerk", mood: "emotional", weight: 0.4 },
  { pattern: "uplifting", mood: "feel-good", weight: 0.4 },
  { pattern: "heartwarming", mood: "heartwarming", weight: 0.5 },
  { pattern: "psycholog", mood: "mind-bending", weight: 0.4 },
  { pattern: "time travel", mood: "mind-bending", weight: 0.4 },
  { pattern: "surreal", mood: "mind-bending", weight: 0.3 },
  { pattern: "supernatural", mood: "scary", weight: 0.3 },
  { pattern: "haunt", mood: "scary", weight: 0.4 },
  { pattern: "ghost", mood: "scary", weight: 0.3 },
  { pattern: "slow burn", mood: "relaxing", weight: 0.3 },
  { pattern: "meditat", mood: "relaxing", weight: 0.4 },
  { pattern: "revenge", mood: "dark", weight: 0.3 },
  { pattern: "violence", mood: "dark", weight: 0.3 },
  { pattern: "coming of age", mood: "heartwarming", weight: 0.3 },
  { pattern: "friendship", mood: "heartwarming", weight: 0.3 },
  { pattern: "based on true story", mood: "emotional", weight: 0.2 },
];

export function computeMoodWeights(
  genreNames: string[],
  keywordNames: string[]
): { mood: string; weight: number }[] {
  const totals = new Map<string, number>();

  for (const genre of genreNames) {
    for (const { mood, weight } of GENRE_MOOD_WEIGHTS[genre] ?? []) {
      totals.set(mood, (totals.get(mood) ?? 0) + weight);
    }
  }

  const lowerKeywords = keywordNames.map((k) => k.toLowerCase());
  for (const { pattern, mood, weight } of KEYWORD_MOOD_BOOSTS) {
    if (lowerKeywords.some((k) => k.includes(pattern))) {
      totals.set(mood, (totals.get(mood) ?? 0) + weight);
    }
  }

  return Array.from(totals.entries())
    .map(([mood, weight]) => ({ mood, weight: Math.min(weight, 1) }))
    .filter((m) => m.weight >= MOOD_WEIGHT_THRESHOLD);
}