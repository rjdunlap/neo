# 2026-11-24 — Jar Clues level 3 play and readable earlier clues

**Changed:** Jar Clues' note never draws the list of earlier clues below 0.9 of its size (about 11 CSS px on an upright phone). When the whole list would need to be smaller, as at level 4's last clue with a long one-of-two clue in it, the oldest clues give way to a "…" line; the board still shows what they crossed off. Before, it shrank to 0.79. The `jarclues` suite gains a level-3 section (a wrong check on the board's multiple, not-a-multiple, prime or square clue, explained in that clue's own terms; one hint; finish) and checks the note's size at level 4's last clue.

**Ran (cloud container, dev server on http://localhost:5173, Chromium from /opt/pw-browsers):** `npm run typecheck`, `eslint src/games/jar-clues`, Prettier on both changed files, and the Jar Clues and registry unit tests (111 passed). `BROWSER_SUITE=jarclues` passed with levels 1 to 4 at 390 × 625. A forced level-4 board with the longest earlier clues at clue 5 drew "…" and the last two clues at full size. Before the change, levels 3 and 4 were played to the sticker with audio unlocked: every line, including the 13 clips from PR #2061, played its rendered clip, and there was no device-speech fallback.

**Not run:** `fingerdemo`, `npm run build` (no shared files or assets changed), offline, other suites.
