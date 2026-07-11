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
- [ ] Step 9 — Spin button + shuffle/reveal animation (Framer Motion is installed, animation not built yet)
- [x] Step 10 — Result card + "why this pick" UI (minimal version)
- [ ] Step 11 — Reroll + no-repeat session logic (schema supports it via `UserInteraction`, route doesn't write interactions yet)
- [ ] Steps 12+ — permalinks, watch-provider sync, Redis cache, analytics, beta, etc.

## Known TODOs called out in code

- Region-relative score normalization (Section 07) is currently a simple global min-max per sync batch, not per-language/region — see comment in `syncTitles.ts`.
- Mood-vector tagging (`TitleMood`) has no data source yet — Section 28 open question, needs either TMDB keyword mapping or a supplemental tagging pass before the mood filter actually does anything.
- `/spin` doesn't yet write to `UserInteraction` on each shown result, so "no immediate repeat on reroll" isn't wired up end-to-end.

## Next session

Pick up at Step 6 (prove the weighted query is fast at scale — needs a real sync run with more pages first) or Step 9 (the spin/reveal animation, since that's your signature interaction, Section 09).
