# 2026-11-18 — Jelly Drums upright on phones (PR #1830)

**Changed:** Jelly Drums plays upright at every level 1–10. Its layout moved from the scene into a pure `layout.ts`. Held upright the stage, the listen-again button and the fans sit in the lower part of the screen, the five jellies stand side by side (their tap areas set the spacing, so they shrink to 0.85 rather than overlap) and the garland is above. Sideways and an upright tablet keep their stage. `upright: true` is set and the registry list holds 66 games.
**Ran:** `npm run typecheck`; eslint and prettier on the changed files; vitest for jelly-drums and the registry (127 passed), including the new `upright.test.ts` over levels 1–10 and the five upright views.
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=jelly-drums PHONE_SHOTS=1` at lap levels 10 and 1 and pre-K levels 9 and 5: each finished with one sticker, and the screenshots (stage, button and fans in the lower part) were looked at. Headless Chrome only.
**Not run:** `uprightsweep` (the sweep stops listing a flagged game), `npm run build` locally (CI runs it), any other browser suite.
