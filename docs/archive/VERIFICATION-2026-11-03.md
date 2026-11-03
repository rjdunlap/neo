# Verification 2026-11-03 (archived entries)

## 2026-11-03 — Orchard Rows deep dive (docs only)

- [PR #1133](https://github.com/rjdunlap/neo/pull/1133), branch `ccr-73906eb2-r3nm6v`: [dive](../deep-dives/orchard-rows.md). Fresh orchards and baskets queued ([batch](../GAME-BATCHES.md#orchard-rows-2-fresh-orchards-and-baskets)); levels 7–9 *a path through the orchard* (distributive property, the split at ten) queued as a definition. Tracker, READY, batches, backlog, IDEAS, roadmap and the estimation study's E4 pointer updated; the last unstarted game dive.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built under `src/`). Open: the batch and the definition.

## 2026-11-03 — Picture Graph fair meadows, a visible first pick and hints that show why (picture-graph batch 1)

- [PR #1138](https://github.com/rjdunlap/neo/pull/1138): fair single-critter placement, the level-4 lift, the taller-bar distractor, why-hints (dashed line and glowing blocks), `bear`, seeded meadows.
- Ran: typecheck; picture-graph rule tests, 19 passed (placement sweep, 4 views by 300 seeds; taller distractor; `sameTap`/`sameHint`; `whyBlocks`; bear; bot same path); `src/content` and registry tests, 190 passed; build; `BROWSER_SUITE=woods WOODS_ONLY=graph FROM_LEVEL=4` levels 4–7 passed on http://localhost:5353 (level 4 double tap free; level 7 taller pick and a second wrong answer, misses/hints 4/2, why-hint screenshot).
- Not run: `fingerdemo` (bot taps unchanged), browser play of levels 1–3, offline.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): does the lift read as "picked"; does the dashed line explain "more".

## 2026-11-03 — Picture Logic fresh pictures and named hints (picture-logic batch 1)

- [PR #1139](https://github.com/rjdunlap/neo/pull/1139): eight easier and eight harder 10 by 10 pictures and five 15 by 15, banks split by measured passes; fill/cross hints carry a reason (`done`, `full`, `overlap`, `fits`) with five voice lines (device speech, no clips).
- Ran (code a1e79178 plus review fix 9cc44bf8): typecheck; `npm test` 297 files / 4493 tests passed; picture-logic and content tests 197 passed after the fix (bank sizes, unique drawings, pass split, every named reason holds on its line, a mutation failed the overlap test); one scripted level-2 play on http://localhost:5937 at 1024x768 (one hint gave a `full` reason with its banner line, then to the sticker, 0 misses / 1 hint, no page errors); one portrait 768x1024 level-4 screenshot (longest overlap line fits in two lines above the paper).
- Not run: `fingerdemo` (bot unchanged), build (no assets), couch suites (couch untouched), a registered browser suite (the play was a one-off probe).
- Open: no spoken clips rendered for the new lines; a real device speech check.

## 2026-11-03 — Pond Conga duck-friendly food and a seeded bank (pond-conga batch 1)

- [PR #1140](https://github.com/rjdunlap/neo/pull/1140): each round has a seeded duck food (peas, sweetcorn or oats, `foodArt`) and a reed bank edge from `pondLook` (reads a clone of the RNG, so ponds are unchanged); a course's ponds cycle the food; voice, how-to, couch catalog and Crumb Trail card wording lost bread. No new level.
- Ran (commit 34d448d2): typecheck; `npm test` 4497 passed (pond-conga rule tests: seeded look, pond unchanged by the look, all foods and edges appear, course food cycle); `npm run build`; `BROWSER_SUITE=congatouch` on http://localhost:5609 (levels 1 and 6, a bump, a hint, Start over, a sticker each); portrait 768x1024 screenshots of pea, sweetcorn and oat ponds with reeds on different edges reviewed.
- Not run: `fingerdemo` (bot unchanged), couch suites (couch logic unchanged).
- Open: how the food art reads on an iPad and the TV ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-03 — Quick Tricks truthful accounting, a seeded cast and a bow (quick-tricks batch 1)

- [PR #1141](https://github.com/rjdunlap/neo/pull/1141): a leaf below the friend is free at level 1; show one has a seeded friend, crosser (new snail and ladybug) and monster colour with per-critter lines; show two has seeded `Critter` friends, a mailbox flag, cheers, a berry gulp, no yellow arrow at Picnic Places, a ten-second nudge and a cast bow. No new level.
- Ran (commit 1cfc6ba2, base 87ae28a1, Vite on http://localhost:5558, `VITE_SPEECH=off`): typecheck; `src/games/quick-tricks` and `src/content` 20 files / 178 tests; `BROWSER_SUITE=next NEXT_ONLY=tricks` levels 1–6 (level 1 now 2/1, show two 4/2, waits for the bow; re-run `FROM_LEVEL=4` passed after the review fixes); `BROWSER_SUITE=fingerdemo FINGER_ONLY=quick-tricks FINGER_LEVELS=1,4` clean 18.9 s and 24.7 s; portrait probe screenshots of the mailbox with its flag up and the level-6 picnic critters, and suite screenshots of both bows; `npm run build`.
- Not run: the full unit suite (CI), the offline check, device or child checks.
- Open: the free low leaf, the hidden yellow arrow and show-two critter readability ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-03 — Read & Do fresh words and pictures (read-do batch 1)

- [PR #1142](https://github.com/rjdunlap/neo/pull/1142): level 1 draws three of five colours (red, blue, yellow, green, pink) with seeded hats; level 2 is three rounds (big, small, a seeded third) on a seeded animal from duck, cat, pig and dog; level 3 plays all four sentences for a seeded pair of animals; 15 words, new voice lines green, pink, pig, dog (device speech). No new level.
- Ran (commit 4c6ed7ac, Vite on http://localhost:5371, classic): `npm run typecheck`; read-do rule tests plus content and registry tests 196 passed; `npm run build`; `BROWSER_SUITE=readdo READ_LEVELS=1,2,3` passed (signs seen: level 1 red/pink/yellow, level 2 small pig/big cat/small dog, level 3 cat+pig; two misses, one hint, a sticker each level). A first run was killed by an HMR reload from a mid-run edit, not a code failure. `game-reviewer` found no code issues.
- Not run: `fingerdemo` (bot unchanged), the offline check, device speech for the new words.
- Open: iPad speech for green, pink, pig and dog and a child's reading ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-03 — Rhyme Time fresh families: bug, sock and snail (rhyme-time batch 1)

- [PR #1143](https://github.com/rjdunlap/neo/pull/1143): seven new code-drawn pictures plus `rock` and `pail` from the shore art; families ug, ock and ail (38 pictures, fifteen families, eight three-word families); riddle pool re-pinned 102 to 178; an `ARGUABLE` guard keeps arguable fits from being the neutral or mate. No new level.
- Ran: `npm run typecheck`; `npx vitest run src/games/rhyme-time` 13 passed (the guard test fails with the old neutral rule restored); `BROWSER_SUITE=woods WOODS_ONLY=rhyme FROM_LEVEL=4` on http://localhost:5299 passed at commit 1ffda591 (first shelf mug rug bug dish; the later `ARGUABLE` change does not touch odd mode); a one-off probe screenshot of all nine pictures looked right.
- Not run: `fingerdemo` (bot unchanged), `npm run build`, the full unit suite.
- Open: a child's reaction to the new pictures ([DEVICE-CHECKS](../DEVICE-CHECKS.md) if wanted; none added).

## 2026-11-03 — Secret Code fair rows, a hint that keeps up and three doors (secret-code batch 1)

- [PR #1144](https://github.com/rjdunlap/neo/pull/1144): misses count only from past tries still drawn above the door (level 7 only the shown clues); the faint-stone hint is redrawn after every later try with no new hint; gray reads "no more of that stone"; seeded door, gate or chest per door. No new level, bot unchanged.
- Ran: `npm run typecheck`; `npx vitest run src/games/secret-code src/content` 177 passed (hidden-row, refreshed-hint and door tests); one scripted level-5 landscape play on http://localhost:5798/classic/ at 32ba685c: tries 1-5 gave misses 0,0,0,0,1 (try 5 repeated on-screen try 2), try 6 repeated scrolled-away try 1 with no miss, try 7 opened; second door one on-screen repeat miss, then to the sticker, no page errors; portrait screenshots of the gate and chest.
- Not run: `fingerdemo` (bot unchanged), `npm run build`, the full unit suite (CI runs it), device or child checks.

---
