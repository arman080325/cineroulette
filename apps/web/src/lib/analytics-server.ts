import { PostHog } from "posthog-node";

/**
 * Server-side PostHog client — for events that originate from API routes
 * (interactions, spin completion) rather than the browser. Section 26's
 * metrics need both: filter usage happens client-side, but Save/Not
 * Interested/Watched go through /api/v1/interactions, so tracking only in
 * the browser would miss them if that fetch ever fails silently.
 *
 * flushAt: 1 / flushInterval: 0 because this runs in serverless functions
 * that terminate right after responding — no background flush loop would
 * survive, so every capture must send immediately.
 */
let client: PostHog | null = null;

function getClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  if (!client) {
    client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

export async function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const ph = getClient();
  if (!ph || !distinctId) return;
  ph.capture({ distinctId, event, properties });
  await ph.shutdown(); // forces the immediate flush before the function exits
}