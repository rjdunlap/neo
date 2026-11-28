# 2026-11-28 — Pattern Train level 21: Add three, add four (PR #2377)

**Changed:** `pattern-train` level 21 ([definition](../definitions/pattern-train-add-three-add-four.md)): a `rule` phase where she names the step (+3 or +4) on a jump chip before the last number, hop arcs between the cars, summed misses and one hint per question, voice lines, how-to lines, `uprightLevels` to 21, ghost finger and couch control for the rule phase; the `pattern` suite plays 21 and its "says why" check now covers levels 18–21.

**Ran:** `npm run typecheck`, `npm run format:check`, `npm run lint`; vitest for `src/games/pattern-train`, `src/audio`, `src/content/barrels.test.ts`, `src/content/game-docs.test.ts`, `src/games/registry.test.ts` (all pass). `BROWSER_SUITE=pattern PATTERN_LEVELS=20,21` passed (level 21: two wrong chips gave one hint, then two wrong numbers a second; said `pattern.whyAdd`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=pattern-train FINGER_LEVELS=21` passed (2.9 s). A portrait 390×844 screenshot of the rule phase and of the how-to card's demo looked right.

**Not run:** the full `npm test` (left to PR CI), `npm run build` (no shared files or assets changed), couch suites (the couch never reaches level 21).
