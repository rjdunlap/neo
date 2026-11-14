# 2026-11-14 — Chain Reaction level 11 The chime opens the gate (PR #1673)

**Changed:** `chain-reaction`: level 11 (a fixed gate ramp that works only after the marble touches the chime; shut, the marble falls straight; 5x5, two loose ramps, 4 decoys), school order now 3, 4, 5, 6, 9, 10, 11; `chain.gate-*` voice lines; how-to steps; no journal entry.
**Ran:** typecheck; unit tests (chain-reaction rule tests 20 pass, 3 new for level 11; `npx vitest run src/games src/content` 6120 pass after regenerating the stale game-docs block); `BROWSER_SUITE=machines CHAIN_LEVELS=11` (gate-first miss, hint glowing the chime, gate opens, phone portrait; re-run after the review fix, passed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=chain-reaction FINGER_LEVELS=11` passed; screenshots chain-reaction-11, -11-open, -11-portrait (390x844); `game-reviewer` found two small issues, both fixed.
**Not run:** `npm run build` (no shared files or assets changed; CI runs it), offline, other suites.
