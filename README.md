<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:B22234,100:FFD36A&height=200&section=header&text=CineRoulette&fontSize=60&fontColor=0A0A0A&animation=fadeIn&fontAlignY=38&desc=Stop%20Searching.%20Start%20Watching.&descAlignY=58&descSize=20" width="100%"/>

<a href="#"><img src="https://readme-typing-svg.demolab.com?font=Bebas+Neue&size=26&duration=2600&pause=900&color=FFD36A&center=true&vCenter=true&width=650&lines=One+spin.+One+explained+pick.+Never+a+coin+flip.;Weighted%2C+not+random.+Global%2C+not+Hollywood-only.;Mood-first.+Progressive+disclosure.+Decisive." alt="typing-svg" /></a>

<br/>

![status](https://img.shields.io/badge/status-in--development-B22234?style=for-the-badge&labelColor=0A0A0A)
![phase](https://img.shields.io/badge/phase-1%20of%2011-FFD36A?style=for-the-badge&labelColor=0A0A0A)
![build](https://img.shields.io/badge/build%20order-step%209%20%2F%2024-B22234?style=for-the-badge&labelColor=0A0A0A)
![license](https://img.shields.io/badge/license-TBD-FFD36A?style=for-the-badge&labelColor=0A0A0A)

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white)
![TMDB](https://img.shields.io/badge/Data-TMDB-01B4E4?style=flat-square&logo=themoviedatabase&logoColor=white)

</div>

<br/>

## 🎟️ What is this

> **"I have 100,000 movies available and still don't know what to watch."**

CineRoulette solves exactly that, and nothing else. Set a mood and a filter or two — as few as one, as many as thirty — hit **Spin**, and get back **one** intelligently-weighted, explainable pick. Not a list. Not a browse screen. A decision.

<table>
<tr>
<td width="20%" align="center">🎯<br/><b>Decisive</b><br/><sub>one great pick beats twenty unranked ones</sub></td>
<td width="20%" align="center">🎭<br/><b>Mood-first</b><br/><sub>how you feel &gt; a genre dropdown</sub></td>
<td width="20%" align="center">🌍<br/><b>Truly global</b><br/><sub>every language is first-class, not a filter afterthought</sub></td>
<td width="20%" align="center">🎲<br/><b>Smart, not random</b><br/><sub>weighted score, never a coin flip</sub></td>
<td width="20%" align="center">🪄<br/><b>Progressive</b><br/><sub>simple by default, powerful on demand</sub></td>
</tr>
</table>

---

## 🎬 The signature interaction

<div align="center">
<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0A0A0A,100:1a1a1a&height=3&width=800" width="100%"/>
</div>

The spin/reveal is CineRoulette's whole reason to exist, so it got real design attention, not a generic spinner:

```
 ▸ fast pass  →  one deliberate near-miss false-stop  →  corrective snap  →  locked
      film-strip reel, sprocket rails               MarqueeBorder chasing-bulb reveal
      synthesized tick / thud / ding (no audio assets, useSpinSound.ts)
```

The result lands on a **torn ticket stub** — a perforated divider with punched notches separates the poster from an "Admit One" section showing rating and genre chips. `prefers-reduced-motion` skips straight to the result, no half-measures.

<details>
<summary><b>▸ Why not just <code>ORDER BY RANDOM()</code>?</b></summary>
<br/>

Because that's the single most common mistake in this category of product — it treats a beloved classic the same as an obscure, poorly-rated entry, and it quietly biases toward whichever language has the most catalog volume. CineRoulette computes a **Recommendation Score** across nine signals (popularity, rating, critic score, recency trend, awards, mood match, region-relative quality, streaming availability, per-user feedback) and does a **weighted random draw** from the filter-matched pool instead — smart, but still surprising on reroll.

The quality floor and popularity normalization are computed **relative to each language/region's own rating distribution**, so a well-regarded Korean or Nigerian film competes on its own terms instead of against Hollywood's raw vote counts.
</details>

---

## 🧱 Architecture

```
Client (Web/PWA)
      │
      ▼
CDN / Edge cache
      │
      ▼
App server ── filter + scoring + selection API (NestJS)
      │                              │
      ▼                              ▼
PostgreSQL                        Redis
(synced catalog + scores)   (hot filter-combo cache, session state)
      ▲
      │
Sync Worker (scheduled) ── TMDB + OMDb + JustWatch + Wikidata
      │
AI Service (v2, optional) ── NL-to-filter translation → same filter schema
```

**Principles:** the public app is read-only and stateless — all catalog writes go through the sync worker · scores are precomputed at sync time, never per request · weighted selection is a single indexed SQL query, not an in-memory scan · the AI layer only ever translates into the existing filter schema, it never bypasses scoring.

```
cineroulette/
├── apps/web/              Next.js frontend + API routes
├── services/sync-worker/  Scheduled TMDB (+ OMDb/JustWatch/Wikidata) sync
├── services/ai-service/   NL-to-filter translation (v2 scope)
├── packages/db/           Prisma schema + migrations
├── packages/scoring/      Recommendation Score engine
└── packages/ui/           Shared components (filter bar, spin button, result card)
```

---

## ⚡ Quick start

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL (Neon) and TMDB_API_KEY
npm run db:generate
npm run db:migrate        # creates tables from packages/db/prisma/schema.prisma
npm run sync               # first full sync: reference data + titles + scores
npm run dev:web            # → http://localhost:3000
```

---

## 📊 Build order — where things actually stand

<div align="center">

![progress](https://progress-bar.dev/38/?title=Step%209%20of%2024&width=500&color=B22234)

</div>

| Step | Milestone | Status |
|---|---|:---:|
| 1 | Project setup & CI | ✅ |
| 2 | TMDB API key & sync worker skeleton | ✅ |
| 3 | Genres/Languages/Moods reference sync | ✅ <sub>curated starter set only</sub> |
| 4 | Full title bulk import | ✅ |
| 5 | Recommendation score computation | ✅ <sub>default weights, untuned</sub> |
| 6 | Indexed weighted-random query at scale | ⏳ <sub>works, untested past a few hundred titles</sub> |
| 7 | Core `/spin` API | ✅ <sub>reference-list endpoints still TODO</sub> |
| 8 | Basic filter bar UI | ✅ <sub>mood + rating only — genre/language/runtime/type TODO</sub> |
| 9 | Spin button + shuffle/reveal animation | ✅ <sub>`SpinReel.tsx` — see above</sub> |
| 10 | Result card + "why this pick" UI | ✅ <sub>minimal version</sub> |
| 11 | Reroll + no-repeat session logic | ⏳ <sub>schema ready via `UserInteraction`, route doesn't write yet</sub> |
| 12–24 | Permalinks, watch-provider sync, Redis cache, analytics, beta, advanced filters, AI layer, accounts, social | ⬜ |

> Full 28-section product doc — filter taxonomy, scoring formula, API contract, DB schema, roadmap — lives in `docs/`.

---

## 🎨 UI/UX pass — July 12

**Fixed a real bug first:** the reel's `translateY` step size wasn't accounting for the `gap` between filler cards, so by the final card the strip had drifted ~120px off-frame — that was the double-box artifact in the screenshot. Fixed with a fixed, explicit height + margin (`STEP` constant in `SpinReel.tsx`) instead of relying on flexbox gap, and the reel window is now sized to a real poster's 2:3 ratio (300×450) instead of a roughly-square frame.

**Then restyled** around a distinct *cinema ticket* identity instead of generic dark mode:

<table>
<tr><td>🅱️</td><td><b>Bebas Neue</b> for display type — reads like real marquee lettering</td></tr>
<tr><td>🔤</td><td><b>Inter</b> for body copy</td></tr>
<tr><td>🎟️</td><td>Gold <code>#ffd36a</code> accent alongside the marquee red</td></tr>
<tr><td>🎞️</td><td>Film-grain overlay + radial spotlight instead of flat black</td></tr>
<tr><td>🧾</td><td>Result card shaped like a torn ticket stub, perforated divider, punched notches</td></tr>
</table>

---

## 🚧 Known TODOs (called out in code)

- [ ] Region-relative score normalization is currently a simple global min-max per sync batch, not per-language/region yet — see comment in `syncTitles.ts`
- [ ] Mood-vector tagging (`TitleMood`) has no data source yet — needs TMDB keyword mapping or a supplemental tagging pass before the mood filter does anything
- [ ] `/spin` doesn't write to `UserInteraction` per shown result yet — no-repeat-on-reroll isn't wired end-to-end
- [ ] `Save` / `Not Interested` buttons are inert — not yet hitting `/api/v1/interactions`
- [ ] `runtimeMinutes` is in the schema but the sync worker never populates it (needs a per-title `movieDetails` call) — the runtime badge is UI-ready and waiting on data

---

## 🗺️ Roadmap

```mermaid
graph LR
  A[MVP<br/>decision-first core loop] --> B[v2<br/>depth & intelligence]
  B --> C[v3<br/>personal layer]
  C --> D[v4<br/>social]
  D --> E[v5<br/>ecosystem]
```

| Stage | Ships |
|---|---|
| **MVP** | Basic filters, weighted `/spin`, reroll, permalinks, watch links |
| **v2** | Advanced filter tier, curated collections, AI natural-language layer, "why this pick" |
| **v3** | Accounts, watchlists, taste learning, personal dashboard |
| **v4** | Follow friends, shared watchlists, compatibility score, group voting |
| **v5** | Public API for the catalog + scoring engine, browser extension |

---

## ⏭️ Next session

Pick up at **Step 6** (prove the weighted query is fast at scale — needs a real sync run with more pages first) or **Step 9 polish** (poster-wall backdrop texture behind the idle hero, wiring `Save` / `Not Interested` to `/api/v1/interactions`, populating `runtimeMinutes` at sync time).

---

<div align="center">

*This product uses the TMDB API but is not endorsed or certified by TMDB.*

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:FFD36A,100:B22234&height=100&section=footer" width="100%"/>

</div>