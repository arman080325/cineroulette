import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cineroulette/db";

interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

const FALLBACK_TRAILERS: Record<string, { youtubeKey: string; title: string }> = {
  "fb-parasite": { youtubeKey: "5xH0R_gx35c", title: "Parasite" },
  "fb-inception": { youtubeKey: "YoHD9XEInc0", title: "Inception" },
  "fb-spirited-away": { youtubeKey: "ByXuk9QqQkk", title: "Spirited Away" },
  "fb-eeaao": { youtubeKey: "wxN1T1uxQ2g", title: "Everything Everywhere All at Once" },
  "fb-interstellar": { youtubeKey: "zSWdZKt4jVg", title: "Interstellar" },
  "fb-whiplash": { youtubeKey: "7d_jQycdQGo", title: "Whiplash" },
  "fb-lalaland": { youtubeKey: "0pdqf4P9MB8", title: "La La Land" },
};

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (FALLBACK_TRAILERS[params.id]) {
    return NextResponse.json(FALLBACK_TRAILERS[params.id]);
  }

  try {
    const title = await prisma.title.findUnique({
      where: { id: params.id },
      select: { id: true, title: true, tmdbId: true, releaseYear: true },
    });

    if (title) {
      const tmdbApiKey = process.env.TMDB_API_KEY;

      if (tmdbApiKey && title.tmdbId) {
        try {
          const res = await fetch(
            `https://api.themoviedb.org/3/movie/${title.tmdbId}/videos?api_key=${tmdbApiKey}`
          );
          if (res.ok) {
            const data = (await res.json()) as { results: TmdbVideo[] };
            const youtubeVideos = data.results.filter((v) => v.site === "YouTube");

            const trailer =
              youtubeVideos.find((v) => v.type === "Trailer" && v.official) ||
              youtubeVideos.find((v) => v.type === "Trailer") ||
              youtubeVideos.find((v) => v.type === "Teaser") ||
              youtubeVideos[0];

            if (trailer) {
              return NextResponse.json({
                youtubeKey: trailer.key,
                name: trailer.name,
                title: title.title,
              });
            }
          }
        } catch {
          // Fallback to search url below
        }
      }

      const searchQuery = encodeURIComponent(`${title.title} ${title.releaseYear ?? ""} official trailer`);
      return NextResponse.json({
        youtubeKey: null,
        searchUrl: `https://www.youtube.com/results?search_query=${searchQuery}`,
        title: title.title,
      });
    }
  } catch {
    // Database connection or table unavailable
  }

  return NextResponse.json({
    youtubeKey: "5xH0R_gx35c",
    title: "Official Trailer",
  });
}
