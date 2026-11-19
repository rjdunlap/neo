# 2026-11-19 — Cut Along upright on phones

**Changed:** Cut Along plays upright at every level (`upright: true`). On an upright view `arrange` puts the paper under the picture using the full 768 width less its ring room and stops above the pet corner (480 tall, was 334 beside a 170-wide pet column). New `upright.test.ts` over levels 1–11 and the four upright views plus 768 × 1024: paper at least 420, ring room in view and clear of Home, pet and picture, corridor at least 30, start rings in view 116 across and clear of Home and guide (levels 8 and 10 included), level-11 shape boxes at least 100, level-1 snip marks 110 × 140.
**Ran:** `npm run typecheck`; eslint; `npx vitest run src/games/cut-along` (234 passed).
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=cut-along PHONE_BAND=school PHONE_LEVELS=6,11 PHONE_SHOTS=1`: both levels completed with one sticker each, screenshots viewed (paper full width). Headless Chrome only.
**Not run:** `uprightsweep`, build, full suites, offline.
