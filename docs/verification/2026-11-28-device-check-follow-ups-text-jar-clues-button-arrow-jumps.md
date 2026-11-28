# 2026-11-28 — Device check follow-ups: text, Jar Clues button, arrow jumps

**Changed:**
- `src/app/pad-pointer.ts`: arrow jumps use `jumpTarget` (nearest that way counting sideways distance twice; a near thing may lie well to the side, a far one must be within about 40 degrees), replacing the couch ring rule that left corner buttons unreachable. Things a game lists are not counted twice.
- Clock Tower: request heading 26, "Tap to hear again" 25, hand key labels 26 units (were 22, 18, 20). Animal Charades: seat buttons scaled 1.25. Jar Clues: wide-layout First clue 104 units tall, note 20 units shorter.
- The 2026-11-28 device check report says what was followed up; Duck Pond 17 measured 55 px per duck once settled, so unchanged.

**Ran:** `npx tsc --noEmit`; `npx vitest run src/app/pad-pointer.test.ts` (8, including all eight Clock Tower 10 targets reachable and the Village Planner far-button case) and `src/games/jar-clues` (72, including the sideways and tablet layout checks); phone screenshots (Chromium emulation, 390 by 844 and 844 by 390) of Clock Tower 1 and 10, Animal Charades 1, Jar Clues 1 and Duck Pond 17.

**Not run:** full `npm test` (CI runs it), browser suites. Emulation is not a real phone or pad.
