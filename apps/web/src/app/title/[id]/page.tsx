import type { Metadata } from "next";
import { prisma } from "@cineroulette/db";
import { explainScore } from "@cineroulette/scoring";
import { notFound } from "next/navigation";
import { TitleClientView } from "./TitleClientView";

const FALLBACK_TITLES: Record<string, {
  id: string;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  overview: string;
  posterPath: string;
  voteAverage: number;
  genres: string[];
  watchProviders: { name: string; link: string }[];
  explanation: string;
}> = {
  "fb-parasite": {
    id: "fb-parasite",
    title: "Parasite",
    releaseYear: 2019,
    runtimeMinutes: 132,
    overview: "All unemployed, Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.",
    posterPath: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    voteAverage: 8.5,
    genres: ["Drama", "Thriller", "Comedy"],
    watchProviders: [{ name: "Max", link: "https://www.max.com" }],
    explanation: "Picked for strong critical acclaim and audience rating.",
  },
  "fb-inception": {
    id: "fb-inception",
    title: "Inception",
    releaseYear: 2010,
    runtimeMinutes: 148,
    overview: "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets, is offered a chance to regain his old life as payment for a task considered to be impossible: inception.",
    posterPath: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    voteAverage: 8.4,
    genres: ["Action", "Science Fiction", "Adventure"],
    watchProviders: [{ name: "Netflix", link: "https://www.netflix.com" }],
    explanation: "Picked for strong mind-bending concept and critical acclaim.",
  },
  "fb-spirited-away": {
    id: "fb-spirited-away",
    title: "Spirited Away",
    releaseYear: 2001,
    runtimeMinutes: 125,
    overview: "A young girl, Chihiro, becomes trapped in a strange new world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage she never knew she had to free her family.",
    posterPath: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    voteAverage: 8.5,
    genres: ["Animation", "Family", "Fantasy"],
    watchProviders: [{ name: "Max", link: "https://www.max.com" }],
    explanation: "Picked for strong feel-good mood match and awards pedigree.",
  },
  "fb-eeaao": {
    id: "fb-eeaao",
    title: "Everything Everywhere All at Once",
    releaseYear: 2022,
    runtimeMinutes: 139,
    overview: "An aging Chinese immigrant is swept up in an insane adventure, where she alone can save what's important to her by connecting with the lives she could have led in other universes.",
    posterPath: "/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg",
    voteAverage: 8.0,
    genres: ["Action", "Adventure", "Science Fiction"],
    watchProviders: [{ name: "Amazon Prime Video", link: "https://www.amazon.com" }],
    explanation: "Picked for awards pedigree and high current buzz.",
  },
  "fb-interstellar": {
    id: "fb-interstellar",
    title: "Interstellar",
    releaseYear: 2014,
    runtimeMinutes: 169,
    overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
    posterPath: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    voteAverage: 8.4,
    genres: ["Adventure", "Drama", "Science Fiction"],
    watchProviders: [{ name: "Amazon Prime Video", link: "https://www.amazon.com" }],
    explanation: "Picked for emotional depth and mind-bending journey.",
  },
  "fb-whiplash": {
    id: "fb-whiplash",
    title: "Whiplash",
    releaseYear: 2014,
    runtimeMinutes: 107,
    overview: "Under the direction of a ruthless instructor, a talented young drummer begins to pursue perfection at any cost, even his humanity.",
    posterPath: "/6uSpfdNuRsgbkyRBkP366i9tF9p.jpg",
    voteAverage: 8.4,
    genres: ["Drama", "Music"],
    watchProviders: [{ name: "Netflix", link: "https://www.netflix.com" }],
    explanation: "Picked for intense excitement and critical acclaim.",
  },
  "fb-lalaland": {
    id: "fb-lalaland",
    title: "La La Land",
    releaseYear: 2016,
    runtimeMinutes: 128,
    overview: "Mia, an aspiring actress, and Sebastian, a dedicated jazz musician, are struggling to make ends meet in a city known for crushing hopes and breaking hearts.",
    posterPath: "/uDO8zWDhfWwoFdKS4fzkVJt0Rf0.jpg",
    voteAverage: 7.9,
    genres: ["Comedy", "Drama", "Romance"],
    watchProviders: [{ name: "Netflix", link: "https://www.netflix.com" }],
    explanation: "Picked for romantic mood match and awards pedigree.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const fallback = FALLBACK_TITLES[params.id];
  if (fallback) {
    return {
      title: `${fallback.title} — CineRoulette`,
      description: fallback.overview.slice(0, 155),
    };
  }

  try {
    const title = await prisma.title.findUnique({
      where: { id: params.id },
      select: { title: true, releaseYear: true, overview: true, posterPath: true },
    });

    if (title) {
      return {
        title: `${title.title} — CineRoulette`,
        description: title.overview?.slice(0, 155) ?? "Discover it on CineRoulette.",
      };
    }
  } catch {
    // Database connection error
  }

  return { title: "Movie Pick — CineRoulette" };
}

export default async function TitlePage({
  params,
}: {
  params: { id: string };
}) {
  const fallback = FALLBACK_TITLES[params.id];
  if (fallback) {
    return (
      <main className="relative min-h-screen text-white flex flex-col items-center px-4 py-12">
        <div className="hero-spotlight" />
        <TitleClientView title={fallback} />
      </main>
    );
  }

  try {
    const title = await prisma.title.findUnique({
      where: { id: params.id },
      include: {
        genres: { include: { genre: true } },
        ratings: { orderBy: { updatedAt: "desc" }, take: 1 },
        scores: { where: { region: "GLOBAL" }, take: 1 },
        watchProviders: { where: { region: "US" } },
      },
    });

    if (!title) {
      notFound();
    }

    const latestRating = title.ratings[0];
    const score = title.scores[0];

    const explanation = score
      ? explainScore(score.componentsJson as Record<string, number>)
      : null;

    const data = {
      id: title.id,
      title: title.title,
      releaseYear: title.releaseYear,
      overview: title.overview,
      posterPath: title.posterPath,
      voteAverage: latestRating?.voteAverage ?? null,
      genres: title.genres.map((g) => g.genre.name),
      watchProviders: title.watchProviders.map((w) => ({
        name: w.providerName,
        link: w.link,
      })),
      explanation,
    };

    return (
      <main className="relative min-h-screen text-white flex flex-col items-center px-4 py-12">
        <div className="hero-spotlight" />
        <TitleClientView title={data} />
      </main>
    );
  } catch {
    notFound();
  }
}