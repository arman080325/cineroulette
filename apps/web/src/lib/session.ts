/**
 * Anonymous session id — Section 20: "anonymous session ids (not tied to
 * identity) support no-repeat reroll and 'Not Interested' without login."
 * Generated once per browser, persisted in localStorage, never sent to
 * TMDB or any third party — it only ever round-trips to our own /spin and
 * /interactions endpoints.
 */
const KEY = "cineroulette_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}