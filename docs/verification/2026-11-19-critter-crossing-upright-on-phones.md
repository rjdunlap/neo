# 2026-11-19 — Critter Crossing upright on phones (PR #1887)

**Changed:** Critter Crossing plays upright at every level (`upright: true`). The layout is now the pure `crossLayout` in `layout.ts` (sideways plan pinned identical by test): bank columns at a 120 pitch, three rows hung up from the bottom edge, the guess bulb between guide and shelf. The old fractions put the banks 92 apart and the bulb on the shelf.
**Ran:** typecheck, prettier, eslint; Critter Crossing and registry unit tests including the new per-level `upright.test.ts` (every plan's critter count, five views), passed first time.
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=critter-crossing` by real touches at prek 1 and 8 and school 2 and 7, one sticker each; screenshots of levels 2 and 8 viewed. Headless Chrome only.
**Not run:** build, offline, other suites.
