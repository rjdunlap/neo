# 2026-11-18 — Gadget Bench upright on phones

**Changed:** Gadget Bench plays upright (`upright: true`, added to the registry test's upright list). Its layout was already a pure function (`benchLayout`), but a browser play showed level 1's pair floating mid-screen with the lower 40% empty though every size check passed. Held upright, the boards (and level 1's Give hands) now sit low in the spare room (bias 0.85) above the path row instead of centred; sideways and an upright tablet keep their centred layout.
**Ran:** `npm run typecheck`; prettier and eslint on the game; vitest for `src/games/gadget-bench` and `registry.test.ts` (169 pass), including the new `upright.test.ts` (levels 1–6, plus a six-level five-tray case, on five upright views with `uprightProblems` and a bottom-edge check).
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=gadget-bench` at school levels 2–6 and prek level 1: all completed with one sticker each; screenshots of levels 1 and 5 looked at. Headless Chrome only.
**Not run:** the `uprightsweep` suite, build, full browser suites, any real phone.
