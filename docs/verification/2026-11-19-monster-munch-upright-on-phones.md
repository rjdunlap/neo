# 2026-11-19 — Monster Munch upright on phones (PR #1875)

**Changed:** Monster Munch plays upright at every level (`upright: true`). Its layout is pulled out of the scene into the pure `layout.ts` (`munchLayout`, `trayRows`; `MONSTER_W`/`MONSTER_H` moved there from `art.ts`); the sideways layout is unchanged and a test pins it. Upright, the tray hangs up from the bottom edge in rows of five and the monsters, sign, pads, bell and cave hang just over them (empty sky above by design).
**Ran:** `npm run typecheck`; the `src/games` unit tests, including the new per-plan `upright.test.ts` over every plan, round, seating and five views (passed first time) and the registry list.
**Ran:** `BROWSER_SUITE=uprightgames PHONE_BAND=school PHONE_ONLY=monster-munch PHONE_LEVELS=6,7,8,11,12`: five levels completed with one sticker each; screenshots of levels 8 and 12 viewed. Headless Chrome only.
**Not run:** build, offline, other suites.
