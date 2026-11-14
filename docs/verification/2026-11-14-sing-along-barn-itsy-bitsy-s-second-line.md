# 2026-11-14 — Sing-Along Barn Itsy Bitsy's second line (PR #1667)

**Changed:** `sing-along-barn`: `itsy` gets its own notes; level 6 offers the full two-line verse (`ITSY_FULL`, 23 notes); the opening pickup is now the G below (a rising fourth), checked against Wikipedia's score; level-6 description and how-to card; `SING_ONLY=itsy` in `sing-barn-play`.
**Ran:** `npm run typecheck`; full `npm test` (351 files, passed after the level-6 how-to card was shortened); `BROWSER_SUITE=singalong SING_ONLY=itsy` passed 2026-11-14 (level 6 upright, spider card, pickup and second-line notes asserted, two friends, one sticker, 0 misses, 0 hints; screenshot `test-results/browser/singalong/sing-along-barn-6-itsy-rain-portrait.png`).
**Not run:** `npm run build` (no shared files or assets changed), `fingerdemo` (bot unchanged), other suites, a `game-reviewer` pass.
