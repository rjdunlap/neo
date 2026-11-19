# 2026-11-19 — Circuit Garden upright on phones (PR #1854)

**Changed:** Circuit Garden plays upright (`upright: true`). Its layout is a pure `layout.ts` (`layoutFor`, `boardBottom`, `HALF`). The scene's portrait branch already took upright widths, but the board was fixed at y 235–545, so on a tall phone it floated with a large empty gap above the tray; `boardBottom(v)` = clamp(`v.h` − 530, 545, 1000) now stretches the board down toward the tray. Sideways is unchanged.
**Ran:** `npm run typecheck`; eslint and prettier; vitest `src/games` (9,670 passed), including the new `upright.test.ts` over levels 1–3, both board mirrorings and four views (phone, small, tall, captioned), which passed first time (the only fix, the stretch, was found by looking at the screenshot).
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=circuit-garden PHONE_BAND=prek` levels 1–3 by real touches, each completing with one sticker; screenshots of levels 2 and 3 viewed. Headless Chrome only.
**Not run:** `uprightsweep`, build, offline, other browser suites.
