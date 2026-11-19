# 2026-11-19 — Block Tower upright on phones (PR #1862)

**Changed:** Block Tower plays upright at every level (`upright: true`). Its layout is pulled into a pure `layout.ts`; the window, beam, rope tops and the Watch again and Continue buttons hang from the floor, the stand level's left leaning tower clears the guide, and the reach tray's pitch is 130 (tap areas had overlapped at 120). New per-level upright test over levels 3–6 and five views (levels 1–2 take a tap anywhere, so have no targets).
**Ran:** `npm run typecheck`; full `npm test` (passed).
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=block-tower PHONE_SHOTS=1`: preschool 3 and 4, toddler 2, school 5 and 6 completed, one sticker each; screenshots viewed (the upper half of a tall phone is empty cream by design). Headless Chrome only.
**Not run:** lap level 1 in the suite (the lap band lists no upright games; it is tap-anywhere with no targets), build, offline, `world`, `uprightsweep` (a flagged game is no longer listed), real device.
