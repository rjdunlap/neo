# 2026-11-19 — Relay Woods upright on phones

**Changed:** Relay Woods plays upright (`upright: true`). In `layout()` the upright receiver's stump moved in from 4 units off the right edge, and on views under 1,100 tall the two sides of a reflected graph squeeze so no friend sits under Home, the request or the ribbon (taller views centre lower). Sideways is unchanged.
**Ran:** `npm run typecheck`; `npx vitest run src/games` (9,387 passed, including the new `upright.test.ts`: levels 1–4, both graph shapes, both reflections, five-plus views, 96+ cases, and the registry list).
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=relay-woods PHONE_BAND=preschool` levels 1–4 by real touches, one sticker each; portrait screenshots of levels 2 and 4 reviewed. Headless Chrome only.
**Not run:** build, `uprightsweep`, full browser suites.
