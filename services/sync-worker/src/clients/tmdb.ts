/**
 * Minimal TMDB client. Only the sync worker ever talks to TMDB directly —
 * the public app is read-only against Postgres (Section 15/19).
 *
 * Requires TMDB_API_KEY in env. Attribution requirement (Section 14):
 * "This product uses the TMDB API but is not endorsed or certified by TMDB."
 * — surface that string in the web app's footer.
 */

const BASE_URL = "https://api.themoviedb.org/3";

function apiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY is not set");
  return key;
}

async function tmdbGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(BASE_URL + path);
  url.searchParams.set("api_key", apiKey());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`TMDB ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  runtime?: number;
  popularity: number;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  original_language: string;
  poster_path: string | null;
}

export interface TmdbWatchProviderRegion {
  link: string;
  flatrate?: { provider_name: string }[];
  rent?: { provider_name: string }[];
  buy?: { provider_name: string }[];
}

export const tmdb = {
  genres: (mediaType: "movie" | "tv") =>
    tmdbGet<{ genres: TmdbGenre[] }>(`/genre/${mediaType}/list`),

  languages: () =>
    tmdbGet<{ iso_639_1: string; english_name: string; name: string }[]>("/configuration/languages"),

discoverMovies: (page: number, language?: string) =>
    tmdbGet<{ results: TmdbMovie[]; total_pages: number }>("/discover/movie", {
      page: String(page),
      sort_by: "popularity.desc",
      ...(language ? { with_original_language: language } : {}),
    }),

  movieDetails: (id: number) =>
    tmdbGet<TmdbMovie & { runtime: number }>(`/movie/${id}`),

  watchProviders: (id: number) =>
    tmdbGet<{ results: Record<string, TmdbWatchProviderRegion> }>(`/movie/${id}/watch/providers`),
};