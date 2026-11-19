# 2026-11-18 — Lost Layers upright on phones (PR #1835)

**Changed:** Lost Layers plays upright at both levels. The portrait branch of `layersLayout` was rebuilt from the bottom edge (buttons and story cards stand up from it with the two columns right above; at level 2 the columns sit at the right edge so the look cards and the slot wait on their left, clear of Home). The old portrait branch was never reached: its tests used a non-upright 768 × 1024 view, which takes the sideways 1024 × 768 branch. Sideways and an upright tablet keep their layout. `upright: true` is set and the registry list holds 70 games.
**Ran:** `npm run typecheck`; eslint and prettier on `src/games/lost-layers`; vitest for `src/games/lost-layers`, `registry.test.ts` and game-docs, including the new `upright.test.ts` (levels 1–2 on phone, small, tall, captioned and short views, 31 tests).
**Ran:** `BROWSER_SUITE=uprightgames` at school levels 1 and 2 (390 × 844, `PHONE_SHOTS=1`): both completed with one sticker each; screenshots looked at (the sky above the columns is empty on a tall phone, by design, as in Rhythm Neighbors). Headless Chrome only.
**Not run:** full build, offline, the sweep, the other suites.
