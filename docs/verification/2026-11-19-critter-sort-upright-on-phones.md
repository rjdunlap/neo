# 2026-11-19 — Critter Sort upright on phones (PR #1874)

**Changed:** All twelve offered levels open upright. Loose pieces use two rows when needed, hooped and mat pieces follow the new diagram, and the three rule or comparison choices fit beside the guide. The game's sign flaps around its own centre during a rule change, even through a resize; a returning piece settles in its latest bank slot. The sorting and counting rules stay the same.

**Ran:** Against base `1435d9793` plus the PR diff, local typecheck, focused Critter Sort and registry tests, generated game docs, scoped format and lint, links and diff. At `http://localhost:5367`, the filtered all-band `uprightsweep` before the flag opened all twelve and flagged nine for layout or visual review. Filtered `uprightgames` used real Chromium touches at 390 × 844 and reviewed the opening screenshots. Filtered `fingerdemo` completed school level 13. The 390 × 625 level 8 touch probe included the caption bubble, two wrong drops, the hint, a turn during the sign flip and both passes for one sticker.

**Not run:** Local production build, offline, or broad browser suites.
