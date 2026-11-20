# 2026-11-19 — Rule Machine upright on phones (PR #1885)

**Changed:** Rule Machine plays upright at every level (`upright: true`). `layout()` in `logic.ts` now wraps `baseLayout` and, on an upright view, hangs the whole scene up from the bottom edge (the lowest row rests 190 units above it); the sideways and portrait plan is unchanged. The new per-level `upright.test.ts` found only the floating-mid-screen fault (rows ended near 825 on every view), no overlaps or size faults.
**Ran:** `npm run typecheck`; the registry and Rule Machine unit tests (123 pass), including `upright.test.ts` over levels 1–6 and five upright views.
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=rule-machine` levels 1–6, one sticker each; screenshots of levels 3 and 6 viewed. Headless Chrome only.
**Not run:** build, other suites.
