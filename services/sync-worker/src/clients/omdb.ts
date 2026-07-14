/**
 * OMDb — Section 14 supplemental source, "IMDb-linked ratings and
 * additional metadata for cross-referencing." Only queried by IMDb ID
 * (never title+year fuzzy search) since ID lookup is exact and free-tier
 * quota is too tight to waste on ambiguous matches.
 */

const BASE_URL = "https://www.omdbapi.com/";

interface OmdbRating {
  Source: string; // "Internet Movie Database" | "Rotten Tomatoes" | "Metacritic"
  Value: string; // "7.4/10" | "85%" | "72/100"
}

interface OmdbResponse {
  Response: "True" | "False";
  Ratings?: OmdbRating[];
}

function apiKey(): string | null {
  return process.env.OMDB_API_KEY || null;
}

/**
 * Returns a 0-1 critic score, preferring Rotten Tomatoes, falling back to
 * Metacritic, falling back to null if neither is present (computeBaseScore
 * already falls back to the aggregate rating when criticNorm is null).
 */
export async function getCriticScore(imdbId: string): Promise<number | null> {
  const key = apiKey();
  if (!key || !imdbId) return null;

  try {
    const url = new URL(BASE_URL);
    url.searchParams.set("apikey", key);
    url.searchParams.set("i", imdbId);

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = (await res.json()) as OmdbResponse;
    if (data.Response !== "True" || !data.Ratings) return null;

    const rt = data.Ratings.find((r) => r.Source === "Rotten Tomatoes");
    if (rt) {
      const pct = parseInt(rt.Value.replace("%", ""), 10);
      if (!isNaN(pct)) return pct / 100;
    }

    const mc = data.Ratings.find((r) => r.Source === "Metacritic");
    if (mc) {
      const score = parseInt(mc.Value.split("/")[0], 10);
      if (!isNaN(score)) return score / 100;
    }

    return null;
  } catch {
    return null; // one failed lookup should never fail the whole sync
  }
}