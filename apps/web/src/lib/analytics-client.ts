"use client";

import posthog from "posthog-js";

/**
 * Section 21/26: PostHog for spin/filter-usage/click-through analytics.
 * Client-side init — call once from a top-level layout effect. Anonymous
 * by default (no identify() call), consistent with Section 20's "no
 * personal data required for the core flow."
 */
let initialized = false;

export function initAnalytics(sessionId?: string) {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
  });
  initialized = true;

  // Align the client-side anonymous ID with our own sessionId, so it
  // matches the distinct ID the server-side tracker uses in
  // analytics-server.ts. Without this, the same spin shows up as two
  // different "people" in PostHog — one from the browser, one from the
  // API route — breaking any funnel between spin_started and title_saved.
  if (sessionId) {
    posthog.identify(sessionId);
  }
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, properties);
}