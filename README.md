# CineRoulette

> Stop Searching. Start Watching.

Monorepo scaffold matching Section 22 of the Master Design & Development Document v2.

## Structure

```
apps/web/            Next.js frontend + API routes (Section 21)
services/sync-worker/ Scheduled TMDB (+ OMDb/JustWatch/Wikidata) sync (Section 14/15)
services/ai-service/  NL-to-filter translation, v2 scope (Section 08)
packages/db/          Prisma schema + migrations (Section 16)
packages/scoring/      Recommendation Score engine (Section 07)
packages/ui/           Shared components (filter bar, spin button, result card)
```

## Setup

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL (Neon) and TMDB_API_KEY
npm run db:generate
npm run db:migrate        # creates tables from packages/db/prisma/schema.prisma
npm run sync               # first full sync: reference data + titles + scores
npm run dev:web            # http://localhost:3000
```

## Build order (Section 24), what's scaffolded so far

- [x] Step 1 — Project setup & CI
- [x] Step 2 — TMDB API key & sync worker skeleton (`services/sync-worker/src/clients/tmdb.ts`)
- [x] Step 3 — Genres/Languages/Moods reference sync (`jobs/syncReferenceData.ts`) — mood tagging is a curated starter set only; see TODO below
- [x] Step 4 — Full title bulk import (`jobs/syncTitles.ts`)
- [x] Step 5 — Recommendation score computation (`packages/scoring`) — weights are defaults, not tuned
- [ ] Step 6 — Indexed weighted-random query at full catalog scale (current `/spin` route works but hasn't been load-tested past a few hundred titles)
- [x] Step 7 — Core `/spin` API (reference-list endpoints for genres/moods/languages/collections still TODO)
- [x] Step 8 — Basic filter bar UI (mood pills + rating slider only so far — genre/language/runtime/type still TODO)
- [x] Step 9 — Spin button + shuffle/reveal animation. Signature element: `SpinReel.tsx` — a film-strip reel (sprocket rails, motion) that does a fast pass, one deliberate near-miss false-stop, a corrective snap, then locks with a `MarqueeBorder` chasing-bulb reveal tied to the brand name. Synthesized tick/thud/ding sounds via `useSpinSound.ts` (no audio assets). Full `prefers-reduced-motion` fallback skips straight to the result.
- [x] Step 10 — Result card + "why this pick" UI (minimal version)
- [ ] Step 11 — Reroll + no-repeat session logic (schema supports it via `UserInteraction`, route doesn't write interactions yet)
- [ ] Steps 12+ — permalinks, watch-provider sync, Redis cache, analytics, beta, etc.

## Known TODOs called out in code

- Region-relative score normalization (Section 07) is currently a simple global min-max per sync batch, not per-language/region — see comment in `syncTitles.ts`.
- Mood-vector tagging (`TitleMood`) has no data source yet — Section 28 open question, needs either TMDB keyword mapping or a supplemental tagging pass before the mood filter actually does anything.
- `/spin` doesn't yet write to `UserInteraction` on each shown result, so "no immediate repeat on reroll" isn't wired up end-to-end.
- `Save` / `Not Interested` buttons are inert — don't hit `/api/v1/interactions` yet.
- `runtimeMinutes` is defined in the schema but the sync worker never populates it (would need a per-title `movieDetails` call, not just `discover`) — the ticket's runtime badge is ready in the UI once this lands.

## UI/UX pass (July 12) — fixed a real bug, then restyled

The poster wasn't "fitting" because of an actual pixel-drift bug: the reel's
`translateY` step size didn't account for the `gap` between filler cards, so
by the final card the strip had drifted ~120px off-frame — that's the double
box you saw in the screenshot. Fixed by giving every reel slot a fixed,
explicit height + margin (`STEP` constant in `SpinReel.tsx`) instead of
relying on flexbox gap. The reel window is also now sized to a real poster's
2:3 ratio (300×450) instead of a roughly-square frame, so posters fill it
without cropping oddly.

Restyled around a distinct "cinema ticket" identity rather than generic dark
mode: Bebas Neue for display type (reads like real marquee lettering) paired
with Inter for body copy, a gold (`#ffd36a`) accent alongside the marquee
red, a film-grain overlay + radial spotlight instead of flat black, and the
result card is shaped like a torn ticket stub — a perforated divider with
punched notches separates the poster from an "Admit One" details section
showing rating and genre chips (now returned by `/spin`, see route.ts).

Next candidates: poster-wall backdrop texture behind the idle hero, wiring
Save/Not Interested to `/api/v1/interactions`, and populating `runtimeMinutes`
at sync time so the runtime badge has data to show.

## Next session

Pick up at Step 6 (prove the weighted query is fast at scale — needs a real sync run with more pages first) or Step 9 (the spin/reveal animation, since that's your signature interaction, Section 09).
