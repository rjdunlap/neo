# Story Theater: first slice

Status: built in [PR #287](https://github.com/rjdunlap/neo/pull/287); Story Steps levels 12–13, school band. School is 6–13; younger ranges and levels 1–11 keep their meaning.

Story Theater belongs inside Story Steps: it uses the same story and cause-and-effect family, with a new creative interaction. Existing saved levels 1–11 keep their meaning. This first slice is school only; younger-band placement remains for a later reviewed ladder.

- **Fun action:** choose Bunny or Bear, sunshine or rain, and a blanket or umbrella; press the pictured stage button to watch a short narrated picnic show.
- **Learning:** a beginning, an event and a response make a story; changing an event changes its consequences.
- **Level 12:** make and watch one show, then explicitly choose the pictured **Take a bow** finish button. Every combination is a valid story; a wet blanket gets a friendly indoor picnic ending.
- **Level 13:** watch a first show, retain its cast, change exactly one of weather or prop against that first show, and watch the revision. Switching which field is revised restores the other field to the first show’s choice. Finish becomes available after the comparison. The first show and the revised ending remain visible for comparison.
- **Support:** replay the current show; undo one edit; optional spoken Help highlights the next useful control and counts one requested hint. No creative choice or incomplete press is a miss. No automatic hints, timer or score.
- **Completion:** the shell awards one sticker after an explicit finish, including with help. Leaving never awards. No story persistence is added; kept books remain a separate proposal.
- **Interaction:** picture choices and show/finish/help/undo controls at least 100 logical units, immediate touch-down feedback, spoken instructions and scene-owned narration timing. Ghost-finger bot plays through the same tap handlers.
- **Art and sound:** code-drawn stage, weather, picnic props and existing critters; palette colors and synthesized sound only.

Source files: `src/games/story-steps/theater-logic.ts`, its rule tests, `theater.ts`, `theater-art.ts`, `index.ts`, existing level-range tests, `src/content/voice-script.ts`, `src/content/howto.ts`, and `scripts/browser-check.mjs`. Closeout updates README, GAMES, ROADMAP, IDEAS, VERIFICATION and completed-work notes.

Verification: typecheck and unit tests; one filtered browser play at levels 12 and 13 covering free counterfactual choices, requested help, replay/undo, finish gating, leaving during narration and one sticker; one portrait screenshot; ghost finger at both levels. Build because shared content files change. No navigation or persistence change, so no world/offline suites.

Recorded checks and remaining device/person gaps: [Story Theater verification](../archive/VERIFICATION-2026-10-07-13.md#2026-10-13--story-theater-first-slice).
