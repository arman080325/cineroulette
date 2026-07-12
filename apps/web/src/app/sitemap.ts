import { MetadataRoute } from "next";
import { prisma } from "@cineroulette/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cineroulette-web-nu.vercel.app";

  const titles = await prisma.title.findMany({
    select: { id: true, updatedAt: true },
    take: 5000, // sane ceiling; revisit if the catalog grows well past this
  });

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    ...titles.map((t) => ({
      url: `${base}/title/${t.id}`,
      lastModified: t.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}