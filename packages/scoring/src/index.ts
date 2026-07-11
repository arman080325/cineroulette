/**
 * Recommendation Score Engine — Section 07
 *
 * Computes a 0-1 score per title, per region, from the nine signals in the
 * design doc. Run at sync time (packages/scoring is imported by the sync
 * worker), never per request — the API only ever reads the precomputed
 * RecommendationScore row.
 *
 * Weights below are the "reasonable defaults" called out in Section 28's
 * open questions — tune once beta data on spin -> outcome exists. Keep the
 * weights summing to 1 so the final score stays in [0,1].
 */

export interface ScoreInputs {
  /** TMDB popularity index, already normalized 0-1 relative to this region's distribution */
  popularityNorm: number;
  /** Aggregate rating (IMDb/TMDB), normalized 0-1 */
  ratingNorm: number;
  /** Critic score (RT/Metacritic) normalized 0-1, or null if unavailable */
  criticNorm: number | null;
  /** Recency trend signal, 0-1 — rewards titles currently gaining attention */
  recencyTrendNorm: number;
  /** 1 if the title has a major award, else a partial credit 0-1 */
  awardsBoost: number;
  /** Cosine similarity (or equivalent) between title mood vector and user's selected mood(s), 0-1 */
  moodMatch: number;
  /** How well the title's language/region fits the user's language filter, 0-1 */
  languageRelevance: number;
  /** 1 if available on the user's selected streaming platform(s), else 0 */
  streamingAvailable: number;
  /** Logged-in only: down-weight from repeated "Not Interested" on this title's genres/moods, 0-1 (1 = no penalty) */
  userFeedbackMultiplier: number;
}

export const SCORE_WEIGHTS = {
  popularity: 0.15,
  rating: 0.2,
  critic: 0.1,
  recencyTrend: 0.1,
  awards: 0.05,
  moodMatch: 0.2,
  languageRelevance: 0.1,
  streamingAvailable: 0.1,
} as const;

export interface ScoreResult {
  score: number; // final 0-1 score, pre-user-feedback-multiplier baked in
  components: Record<string, number>;
}

/**
 * Computes the base recommendation score (region-relative, no user context).
 * This is what gets stored in RecommendationScore.computedScore /
 * componentsJson at sync time.
 */
export function computeBaseScore(inputs: Omit<ScoreInputs, "userFeedbackMultiplier">): ScoreResult {
  const critic = inputs.criticNorm ?? inputs.ratingNorm; // fall back to aggregate rating if no critic score

  const components = {
    popularity: inputs.popularityNorm * SCORE_WEIGHTS.popularity,
    rating: inputs.ratingNorm * SCORE_WEIGHTS.rating,
    critic: critic * SCORE_WEIGHTS.critic,
    recencyTrend: inputs.recencyTrendNorm * SCORE_WEIGHTS.recencyTrend,
    awards: inputs.awardsBoost * SCORE_WEIGHTS.awards,
    moodMatch: inputs.moodMatch * SCORE_WEIGHTS.moodMatch,
    languageRelevance: inputs.languageRelevance * SCORE_WEIGHTS.languageRelevance,
    streamingAvailable: inputs.streamingAvailable * SCORE_WEIGHTS.streamingAvailable,
  };

  const score = Object.values(components).reduce((sum, v) => sum + v, 0);

  return { score: clamp01(score), components };
}

/**
 * Applies the (optional, logged-in-only) user feedback multiplier on top of
 * the precomputed base score at selection time — this is the one part of
 * scoring that IS per-request, since it's per-user, not per-title.
 */
export function applyUserFeedback(baseScore: number, userFeedbackMultiplier: number): number {
  return clamp01(baseScore * userFeedbackMultiplier);
}

/**
 * Weighted random draw from a scored candidate pool (Section 07, Selection
 * Mechanic step 3). Higher score = higher probability, never a guarantee.
 */
export function weightedRandomPick<T extends { score: number }>(candidates: T[]): T {
  if (candidates.length === 0) {
    throw new Error("weightedRandomPick called with an empty candidate pool");
  }
  const total = candidates.reduce((sum, c) => sum + Math.max(c.score, 0.0001), 0);
  let r = Math.random() * total;
  for (const c of candidates) {
    r -= Math.max(c.score, 0.0001);
    if (r <= 0) return c;
  }
  return candidates[candidates.length - 1];
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}
