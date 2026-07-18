# CineRoulette — UI/UX Overhaul Plan

Grounded in a read of the actual codebase (Next.js 14 App Router, Tailwind, Framer Motion, Prisma/Neon, Upstash Redis, PostHog).

---

## 0. Confirmed stack & scope

| Assumption in brief | Actual |
|---|---|
| React + TypeScript | **Next.js 14 App Router** + TS. Server Components available — matters for perf work. |
| MUI or Tailwind | **Tailwind** already configured with custom tokens. Keeping it. Adding MUI would double the CSS payload for no gain. |
| Frontend-only | **Two backend additions required** (see §9). Everything else is frontend. |

---

## 1. Critical defects found in code review

These are bugs, not taste. Fix before any styling work.

### 1.1 Filter state trap — severity: critical
`app/page.tsx` wraps all filter controls in `{stage === "idle" && ...}`. `stage` transitions `idle → revving → spinning → revealed` and **never returns to `idle`** on the success path. After one spin the user cannot change any filter without a full page reload.

**Fix:** filters live in persistent chrome, not in a stage-conditional branch. Addressed structurally by the layout in §3.

### 1.2 Bookmarks are write-only — severity: high
`POST /api/v1/interactions` writes `SAVED` rows. No `GET` route exists. Nothing in the UI ever lists saved titles. The heart button is decorative from the user's perspective.

**Fix:** new `GET /api/v1/saved?sessionId=` + a Saved drawer. Backend implication.

### 1.3 Monolithic page component — severity: medium
375 lines, 11 `useState`, fetch logic, and all markup in one client component. Every future change risks regression, and the whole page ships as one client bundle.

**Fix:** component decomposition + a reducer (§4).

### 1.4 Fixed-width reel breaks small screens — severity: medium
`SpinReel.tsx` hardcodes `CARD_W = 300`, `CARD_H = 450`, `STEP = CARD_H + GAP`. On a 320px viewport this overflows with the surrounding padding. The `STEP` arithmetic means width/height can't simply be made fluid — the transform math depends on exact pixel height.

**Fix:** drive dimensions from a measured container via `ResizeObserver`, keeping `STEP` derived from the *measured* height so the transform stays exact. Details in §6.4.

### 1.5 No loading states
Genre and language `<select>`s render empty, then pop full when their fetches resolve. Layout shifts, and there's no indication anything is loading. Same for the poster wall.

### 1.6 Cold grays on a warm base
Background is `#0a0605` (warm near-black); text uses Tailwind `neutral-400`/`neutral-700` (cold blue-gray). The mismatch is subtle but it's a large part of why the page reads as "unfinished default" rather than art-directed.

---

## 2. Design direction

### 2.1 The problem with the current screen
It has **atmosphere** — grain, spotlight, poster wall, floating particles, spinning badges — but no **structure**. Everything is a centered column of evenly-spaced rows. Effects were added on top of a form layout instead of the layout itself being designed. That's why more effects haven't made it feel less basic.

### 2.2 Concept: **The Booking Counter**

The idle screen is not a settings form. It's a box-office counter where you compose a ticket order, and the spin is that ticket being printed and dispensed.

This does three things at once: it gives the filters a reason to be visually rich, it gives the page a spatial composition, and it makes the existing ticket-stub result card the *payoff* of a setup rather than an unrelated flourish.

### 2.3 Tokens

**Color** — extends the existing palette, adds the two missing roles (a raised surface, and a resting-state metal so gold stays special).

| Token | Hex | Role |
|---|---|---|
| `velvet` | `#0a0605` | Page base (existing) |
| `ink` | `#14100e` | Raised surface: panels, cards, drawer |
| `marquee` | `#c8102e` | Primary action only (existing) |
| `gold` | `#ffd36a` | Active state, lit bulbs, focus (existing) |
| `brass` | `#8a6d3b` | Resting borders, dividers, inactive metal |
| `smoke` | `#a09a94` | Body text — warm-tinted, replaces `neutral-400` |
| `ash` | `#827a73` | Secondary text, placeholders |

Rule: **gold means lit.** If something isn't active, selected, or focused, it's brass. Currently gold is used for resting borders too, which is why nothing feels like it turns on.

**Type** — keeps the existing pairing, adds the missing third role.

| Role | Face | Use |
|---|---|---|
| Display | Bebas Neue | Brand, title reveal, section headers |
| Body | Inter | Prose, labels, controls |
| **Data (new)** | **IBM Plex Mono** | Ticket fields, ratings, runtime, serial numbers |

The mono face is the highest-leverage addition. Real ticket stubs are printed in monospace — it grounds the metaphor in a material detail and gives numeric data a distinct voice instead of blending into body copy.

Scale: `11 / 13 / 15 / 18 / 24 / 32 / 48 / 72` with display used only at 32+.

### 2.4 Signature element

**The order stub that becomes the ticket.**

As the user selects mood / genre / language / rating, those choices print onto a ticket stub in mono type — perforated edge, serial number, "ADMIT ONE" header. Empty fields show as dotted rules waiting to be filled. When they hit spin, *that same stub* is what the reel dispenses, now stamped with the movie.

Why this and not a casino wheel: a literal roulette wheel is the obvious read of the product name, and it would fight the cinema identity that's already built (marquee bulbs, film sprockets, ticket perforation). The stub ties the setup and the payoff into one object. It's also cheap to build — the perforation CSS already exists.

Spend the boldness here. Everything around it stays quiet.

---

## 3. Layout & flow

### 3.1 Screen inventory

```
/                     Counter (idle) + Stage (reel/result)
/title/[id]           Permalink detail (exists, needs restyle)
/saved                Saved list — or drawer overlay on /
404                   Exists
```

### 3.2 Desktop (≥1024px)

```
┌──────────────────────────────────────────────────────────────┐
│ ◉ CINEROULETTE          [search…]        ♥ Saved   ? Help    │  56px bar, sticky
├────────────────────────┬─────────────────────────────────────┤
│                        │                                     │
│   THE COUNTER          │          THE STAGE                  │
│   ┌──────────────┐     │                                     │
│   │ ADMIT ONE    │     │      ┌─────────────┐                │
│   │ ---------    │     │      │             │                │
│   │ MOOD  ·····  │     │      │   reel /    │                │
│   │ GENRE ·····  │     │      │   poster    │                │
│   │ LANG  ·····  │     │      │             │                │
│   │ RATING ····  │     │      └─────────────┘                │
│   │ no. 0413     │     │        ticket details               │
│   └──────────────┘     │        [actions]                    │
│                        │                                     │
│   mood chips           │                                     │
│   genre / lang / stars │                                     │
│                        │                                     │
│   [ SPIN THE ROULETTE ]│                                     │
└────────────────────────┴─────────────────────────────────────┘
     40%                            60%
```

Filters stay mounted and visible during and after the spin. That alone fixes §1.1.

### 3.3 Mobile (<768px)

Stacked, stage first once a result exists:

```
┌──────────────────┐
│ ◉ CINE…  ♥  ?    │
├──────────────────┤
│   [stage]        │  ← result scrolls into view on reveal
│   [ticket]       │
│   [actions]      │
├──────────────────┤
│   ▲ Filters (2)  │  ← collapsible, badge = active count
│   [stub preview] │
│   [chips…]       │
├──────────────────┤
│ [ SPIN ]         │  ← sticky bottom bar, thumb-reachable
└──────────────────┘
```

The spin button becomes a sticky bottom bar on mobile — it's the primary action and should never require scrolling.

### 3.4 First-run flow

```
Land → poster wall fades in → stub outline draws → 
  coach mark: "Pick a mood, or just spin." (dismissible, once)
  → user spins → result → coach mark 2: "Save it, or spin again." (once)
```

Stored in `localStorage` alongside the existing session id. No modal, no multi-step wizard — two inline coach marks. A wizard would block the one thing the product promises (instant results).

---

## 4. Component plan & state

### 4.1 Tree

```
app/layout.tsx
└── AppShell (server)
    ├── AppHeader (client)        brand, search, saved, help
    ├── {children}
    └── Footer                    TMDB attribution

app/page.tsx (client, thin — orchestration only)
├── PosterWallBackground          exists
├── ParticleField                 exists
├── CounterPanel
│   ├── OrderStub                 ★ signature
│   ├── MoodChips
│   ├── FilterSelects             + FilterSkeleton
│   ├── RatingSlider
│   ├── ActiveFilterBar           chips w/ clear-all
│   └── SpinButton
├── StagePanel
│   ├── SpinReel                  exists — needs responsive fix
│   ├── ResultTicket
│   │   ├── TicketMeta            rating, genres, runtime (mono)
│   │   ├── WatchProviderLinks
│   │   └── ResultActions         spin again / save / not for me / share
│   └── EmptyStage                pre-first-spin invitation
├── SavedDrawer                   ★ new
└── CoachMark                     ★ new
```

### 4.2 State

Current: 11 `useState` in one component. Replace with:

**`useReducer` for spin flow** — the stage machine is a genuine finite state machine and `useState` sprawl is why the trap in §1.1 happened. Explicit transitions make an unreachable `idle` state obvious.

```ts
type Stage = "idle" | "revving" | "spinning" | "revealed" | "empty" | "error";

type Action =
  | { type: "SPIN_REQUESTED" }
  | { type: "SPIN_RESOLVED"; result: SpinResult; explanation: string }
  | { type: "SPIN_EMPTY"; message: string }
  | { type: "SPIN_FAILED"; message: string }
  | { type: "REVEAL_COMPLETE" }
  | { type: "RESET_TO_IDLE" };          // ← the transition that was missing
```

**`useState` for filters** — they're independent values, a reducer would add ceremony without benefit.

**No global store.** Zustand is already a dependency but nothing uses it. Two panels sharing one page's state is prop-drilling one level deep. Adding a store here is architecture for its own sake. Revisit only if filters need to persist across routes.

**Server Components for reference data.** `genres` and `languages` are fetched client-side in `useEffect` today — two waterfall round-trips after hydration. They're static per deploy. Fetch them in the server component and pass as props: removes two client fetches and the layout shift entirely.

### 4.3 Data layer

Keep raw `fetch`. TanStack Query is in `package.json` but unused; adding it for three endpoints is overhead. Reconsider if saved-list pagination or optimistic sync lands.

---

## 5. Roulette interaction — specs & storyboard

The existing sequence is good and should be **kept**, not replaced. It has a real point of view (film-strip + near-miss + marquee lock). What it needs is responsive sizing, a reduced-motion path that isn't a hard skip, and stage-anchored scroll.

### 5.1 Storyboard

| t (ms) | Phase | Visual | Audio | A11y |
|---|---|---|---|---|
| 0 | `revving` | Stub lifts 4px, shadow deepens. Button → spinner. | — | `aria-live` "Spinning" |
| 0–1550 | `fast` | Strip accelerates through filler cards, motion blur, sprocket rails ticking | tick loop, decelerating 70→240ms | — |
| 1600 | `nearMiss` | Hard stop on decoy card, gold hairline flickers | low thud | — |
| 1900 | `correcting` | Overshoot correction, 2 quick ticks | tick ×2 | — |
| 2350 | `locked` | Poster snaps in w/ spring overshoot, screen kick ±6px, **marquee bulbs chase** | two-note ding | `aria-live` announces title |
| 2400+ | `revealed` | Stub perforation tears, details fade up staggered 60ms | — | focus moves to result heading |

Total 2.4s. Long enough for anticipation, short enough to repeat. Don't extend it — repeat-spin is the core loop.

### 5.2 Motion tokens

```
ease-reel-decel   cubic-bezier(0.15, 0.85, 0.25, 1)
ease-snap         cubic-bezier(0.34, 1.56, 0.64, 1)   // overshoot
ease-ui           cubic-bezier(0.4, 0, 0.2, 1)
dur-micro         120ms    hover, press
dur-ui            240ms    panel, chip, drawer
dur-reel          1550ms   main pass
```

### 5.3 Reduced motion

Current code hard-skips to `locked` — correct instinct, but the user gets *no* feedback that a spin happened. Replace with a **300ms crossfade** into the result plus the `aria-live` announcement. Respects the preference without making the interaction feel broken.

### 5.4 Responsive reel

`STEP = CARD_H + GAP` must equal rendered spacing exactly or the strip drifts (this caused a real bug earlier in the project). So don't guess at fluid sizing — measure it:

```ts
const [cardH, setCardH] = useState(450);
const boxRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const el = boxRef.current;
  if (!el) return;
  const ro = new ResizeObserver(([entry]) => {
    const w = entry.contentRect.width;
    setCardH(Math.round(w * 1.5));  // locked 2:3 poster ratio
  });
  ro.observe(el);
  return () => ro.disconnect();
}, []);

const STEP = cardH + GAP;   // derived from measurement, never hardcoded
```

Container: `w-full max-w-[300px] sm:max-w-[340px]`.

### 5.5 Micro-interactions

| Element | Rest | Hover | Active | Selected |
|---|---|---|---|---|
| Mood chip | brass border | lift 2px, border gold/60 | scale .96 | marquee fill + glow |
| Spin button | pulse glow 2.4s | brightness 1.1 | scale .95 | — |
| Provider pill | brass border | gold border + text | — | — |
| Save | outline | gold border | scale .96 | filled gold, heart morph |
| Stub field | dotted rule | — | — | mono value types in, 40ms/char |

The stub field typing effect is the one place worth a flourish — it makes filter selection feel consequential.

---

## 6. Accessibility

Current state is better than most projects — `aria-pressed`, `aria-live`, focus rings, `sr-only`, and `prefers-reduced-motion` are already handled. Gaps:

| Gap | Fix |
|---|---|
| No skip link | `<a href="#stage" class="sr-only focus:not-sr-only">Skip to result</a>` |
| Reveal doesn't move focus | On `revealed`, focus the result `<h2>` (`tabIndex={-1}`) |
| Drawer has no focus trap | Trap focus, `Esc` closes, restore focus to trigger |
| Reduced-motion = no feedback | Crossfade + announcement (§5.3) |
| Emoji read aloud | Already `aria-hidden` on chips — apply to all decorative glyphs |
| Contrast unverified | See below |

**Contrast — measured, not estimated (WCAG AA: 4.5:1 body, 3:1 large & UI):**

| Pair | Measured | Verdict |
|---|---|---|
| `gold #ffd36a` on `velvet #0a0605` | 14.19:1 | Pass |
| `smoke #a09a94` on `velvet` | 7.25:1 | Pass body |
| `smoke` on `ink #14100e` | 6.80:1 | Pass body |
| white on `marquee #c8102e` | 5.88:1 | Pass body |
| `ash #827a73` on `velvet` | 4.78:1 | Pass body |
| `brass #8a6d3b` on `velvet` | 4.16:1 | **UI/borders only — fails body text** |

Two corrections made during verification, worth noting because both would have shipped as defects:

- `ash` was originally specced `#6b6560`, which measures **3.51:1 — fails AA body text.** Lightened to `#827a73` (4.78:1).
- `brass` at 4.16:1 clears large-text/UI but not body. Enforce as a border-and-icon token only; never set text in it.

**Keyboard map:**

```
Tab          traverse: skip → header → search → mood chips → selects → slider → spin
Enter/Space  activate
↑ ↓          search suggestions
Esc          close drawer / dropdown / coach mark
S            spin (global shortcut, when no input focused)
```

---

## 7. Responsive

| Breakpoint | Layout |
|---|---|
| <640 | Single column, filters collapsed behind a toggle w/ active count, sticky spin bar |
| 640–1023 | Single column, filters expanded, inline spin button |
| ≥1024 | Two-column counter/stage split |
| ≥1440 | Same, wider gutters, poster wall denser |

Touch targets ≥44×44px — current mood chips at `py-2` (~36px) fail; bump to `py-2.5` + `min-h-[44px]`.

---

## 8. Performance

| Issue | Fix | Impact |
|---|---|---|
| Poster wall loads 32 images at full opacity-14 | `loading="lazy"`, `w92` not `w185`, cap 16 tiles | ~400KB saved |
| `<img>` everywhere | `next/image` with `sizes` — `image.tmdb.org` already whitelisted in `next.config.js` | AVIF/WebP + no CLS |
| Genres/languages client-fetched | Server Component (§4.2) | −2 round trips |
| No skeletons | Skeleton for filters, stage, saved list | Perceived speed |
| Whole page is `"use client"` | Only leaves need it | Smaller hydration bundle |
| Particles animate always | Pause when `document.hidden` | Battery |

Targets (Section 13 NFR): p50 <800ms, p95 <1.5s warm. LCP <2.5s, CLS <0.1, INP <200ms.

---

## 9. Backend additions required

Only two. Everything else is frontend-only.

**1. `GET /api/v1/saved?sessionId=` — required for bookmarks (§1.2)**
Returns titles with a `SAVED` interaction for the session, minus any later `NOT_INTERESTED`. Poster, title, year, rating.

**2. `DELETE /api/v1/interactions` — required for un-saving**
Currently save is irreversible; a bookmark you can't remove isn't a bookmark. Deletes the `SAVED` row for `(sessionId, titleId)`.

Neither needs a schema migration — `UserInteraction` already has `sessionId`, `titleId`, `action`, `createdAt`.

---

## 10. Phased roadmap

### Phase 1 — Ship-blocking (½ day)
1. Fix filter state trap (§1.1) — layout change
2. Warm token system + mono face (§2.3)
3. `AppHeader` + shell
4. Filter/stage skeletons
5. Touch target + contrast fixes

*Ship here. The app is correct and coherent.*

### Phase 2 — The signature (1 day)
6. `OrderStub` with typing fields
7. Two-column counter/stage layout
8. Responsive reel via `ResizeObserver`
9. Result ticket restyle w/ mono meta
10. Reduced-motion crossfade

### Phase 3 — Completeness (1 day)
11. `GET /saved` + `DELETE` routes
12. `SavedDrawer` w/ focus trap + optimistic toggle
13. Coach marks
14. Skip link + focus management
15. `next/image` migration

### Phase 4 — Polish (½ day)
16. Keyboard shortcut `S`
17. Sticky mobile spin bar
18. Empty/error state copy pass
19. Lighthouse + axe run, fix findings

---

## 11. Copy revisions

Current copy is functional but system-voiced in places.

| Current | Revised | Why |
|---|---|---|
| "No titles match these filters yet." | "Nothing matches all four filters. Try dropping the language." | Names the fix |
| "Something went wrong mid-spin. Try again." | "The spin didn't go through. Try again." | Errors don't apologize or hedge |
| "revving up the reel..." | keep | Good voice |
| "✋ Not Interested" | "Not for me" | Shorter, plainer, less like a form field |
| "🔗 Share" | "Copy link" | Says what happens |
| (no empty state) | "Pick a mood, or just spin. Either works." | An empty screen is an invitation |

---

## 12. Testing checklist

**Functional**
- [ ] Change every filter *after* a spin without reload ← regression test for §1.1
- [ ] Spin with 0, 1, and 4 filters
- [ ] Empty result renders empty state, not error
- [ ] Save → open drawer → title present
- [ ] Un-save → removed, persists reload
- [ ] Search: <2 chars, no match, match, Enter, click
- [ ] Reroll 10× — no immediate repeat
- [ ] Share link opens correct permalink

**A11y**
- [ ] Full flow keyboard-only, no mouse
- [ ] Focus ring visible on every interactive element
- [ ] Focus moves to result on reveal
- [ ] Focus trapped in drawer, `Esc` closes, returns to trigger
- [ ] Screen reader announces spin start + result
- [ ] `prefers-reduced-motion` → crossfade, still announces
- [ ] axe DevTools: 0 violations
- [ ] 200% zoom, no horizontal scroll

**Responsive**
- [ ] 320 / 375 / 768 / 1024 / 1440
- [ ] Reel never overflows
- [ ] Touch targets ≥44px
- [ ] Sticky spin bar doesn't cover content

**Performance**
- [ ] Lighthouse ≥90 perf, 100 a11y
- [ ] LCP <2.5s, CLS <0.1
- [ ] No layout shift on filter load

---

## 13. Deployment

- Vercel auto-deploys `main`; verify preview build before merge
- Run `npm run typecheck` locally first — `noUncheckedIndexedAccess` fails on Vercel but not `next dev`
- `npm run db:generate` after any `npm install` (Prisma client gets stubbed)
- New env: none for Phase 1–2
- Watch PostHog `spin_started → title_saved` funnel post-deploy for regression
- Vercel Speed Insights for the NFR targets in §8