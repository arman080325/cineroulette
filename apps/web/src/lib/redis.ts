import { Redis } from "@upstash/redis";

/**
 * Section 19: Redis for hot filter-combo caching and per-session
 * "recently shown" lists — not general-purpose caching. REST-based client
 * (not ioredis) because Vercel's serverless functions can't hold a
 * persistent TCP connection the way a long-running server can.
 */
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const RECENTLY_SHOWN_TTL_SECONDS = 60 * 60; // 1 hour
const FILTER_COMBO_TTL_SECONDS = 90; // short — scores only change at sync time, but titles do get added

export async function getRecentlyShown(sessionId: string): Promise<string[]> {
  if (!sessionId) return [];
  const ids = await redis.lrange<string>(`shown:${sessionId}`, 0, 19);
  return ids ?? [];
}

export async function pushRecentlyShown(sessionId: string, titleId: string): Promise<void> {
  if (!sessionId) return;
  const key = `shown:${sessionId}`;
  await redis.lpush(key, titleId);
  await redis.ltrim(key, 0, 19); // keep last 20 only
  await redis.expire(key, RECENTLY_SHOWN_TTL_SECONDS);
}

export async function getCachedCandidates<T>(comboKey: string): Promise<T | null> {
  return redis.get<T>(`combo:${comboKey}`);
}

export async function setCachedCandidates<T>(comboKey: string, value: T): Promise<void> {
  await redis.set(`combo:${comboKey}`, value, { ex: FILTER_COMBO_TTL_SECONDS });
}