# Verification 2026-10-27 (archived entries)

## 2026-10-27 — Moon Window levels 1–3 (space slice 2)

- [PR #1004](https://github.com/rjdunlap/neo/pull/1004), branch `claude/moon-window-1-3`, tested commit `6becf05c`, server `http://localhost:5617`: new game in Tinker Lab (now 18), levels 1–3, a Kokoro title clip; Tinker Lab pages at school as 9 and 8.
- Ran: `npm run typecheck`; `npx vitest run src/games/moon-window` 20 tests (model, ellipse area within 2 %, orientation, 500 seeds per level, authored rounds, accounting, layout at landscape/portrait/phone/notch, miss slide spot); full `npm test` 3457 tests after the two Tinker Lab count tests moved to 18 entries / 9+8 pages; `npm run build`.
- `BROWSER_SUITE=moonwindow` passed twice (after the card widening and after review fixes): level 2 wrong slice one miss, same wrong again ignored, Show a hint twice on board 2 one hint, saved 1/1; level 3 authored more, portrait screenshot reviewed (both Moons one size, request card above, pet corner clear), a wrong most-on-less one miss, seeded third, saved 1/0.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=moon-window FINGER_LEVELS=1,3` passed (level 1 lap 7.1 s, level 3 preschool 2.5 s). A game-reviewer pass found the landscape miss slide covering the other card and a hint during the right-card animation; both fixed.
- Not run: offline check, `world`, iPad, device speech, a child. Open: [DEVICE-CHECKS](../DEVICE-CHECKS.md#moon-window-levels-13-space-slice-2-2026-10-27).
