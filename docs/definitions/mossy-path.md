# Mossy Path: first playable slice

Built 2026-10-13 on `codex/mossy-path`; [PR #285](https://github.com/rjdunlap/neo/pull/285). Source: `src/games/mossy-path/`, with registry, land, voice, how-to and browser integration. [Build notes](../archive/COMPLETED-2026-10-09.md#mossy-path-first-slice-2026-10-13); [verification](../archive/VERIFICATION-2026-10-13.md#2026-10-13--mossy-path-first-slice).

**Fun action and purpose:** each step of a turtle blooms a moss tile. Plan a route that visits every tile exactly once and ends at the pictured pond. This is path coverage, distinct from Penguin Slide's sliding and Robot Path's programming.

**Band and ladder:** school, levels 1–3. First a seven-tile winding corridor; then a three-by-four open patch with route choices; then a four-by-four patch with two rocks and bottlenecks. Seeded reflections and rotations vary the boards without changing saved level IDs. Targets remain at least 100 logical units in portrait and landscape.

**Rules and finish:** tap an adjacent unvisited tile. The starting tile already blooms. The pond accepts the final step only after all moss blooms. Any complete valid route earns the shell's one sticker. Tapping the turtle is free; non-adjacent, already-visited and early-pond taps receive specific spoken guidance and a gentle boing. Two consecutive misses show help. Legal route experiments and dead ends are free.

**Revision and help:** Undo takes back one step; Start over restores the same board. Both preserve misses and hints. An exact search finds a completing route from the current path. If none exists, help outlines Undo until a completing prefix is restored, then outlines the next tile. Repeating help on the same path counts once. The ghost finger uses the same tap controls, including undo for recovery.

**Verification:** test seeded solvability, every tile/end constraint, alternative routes, dead-end recovery and hint progress. Run typecheck/unit tests/build, the filtered `mossypath` scripted play at levels 1 and 3 (misses, hint, undo, reward, land/home and portrait), `fingerdemo` filtered to this game, and filtered navigation/offline checks because catalog navigation changes. Real iPad feel, device speech and child play remain open.
