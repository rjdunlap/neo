# Brain Break: number order first slice

Claimed 2026-10-13 on `codex/brain-break-number-order` for roadmap step 9.

Fun action: light numbered pond stones in sequence, searching a shuffled board.
Skill: visual search and number order, described as practice on this task without
claims about general cognition. Grown-up only, touch or mouse, in Lantern Lake.

Levels 1–3 use 3×3 (1–9), 4×4 (1–16), and 5×5 (1–25) seeded permutations.
All numbers remain visible; selected stones stay in place and gain a check.
The current target is always shown and spoken at the start and after a selection.
Tapping a different unfinished number is a miss with a gentle boing and a spoken
target reminder. A completed stone is ignored. Two consecutive misses highlight
the target and count one hint; a separate Hint button does the same on request.
Completion of the final number finishes exactly once through the shell.
No clock, personal-best persistence, speed target or training claim: the finite
board adapts the notebook's timed proposal to the project's no-timer contract.
Color words and quick sums remain separate future slices.

Number Trails traces numeral forms and counts quantities; Number Nook calculates
with numbers. Neither hosts a visual-search sequence, so this is a new game.
No controller or couch catalog entry in this slice. A ghost finger plays every
level using the same taps as the person. Targets are at least 100 logical units;
portrait/landscape layout keeps clear of the guide and shell controls.

Expected files: `src/games/brain-break/{logic,index}.ts`, rule tests, registry,
lands, voice-script, howto, filtered browser suite, README, GAMES, ROADMAP,
IDEAS and VERIFICATION. Verify typecheck, unit tests, build, one first/last-level
scripted play with mistakes and help, portrait screenshot, and filtered finger demo.

## Sums in order: levels 4–6 (definition, 2026-11-03)

Status: **built** 2026-11-05 ([PR #1272](https://github.com/rjdunlap/neo/pull/1272)). This is roadmap step 9's "finite quick-sum round".

**Fun action and skill.** The same pond and the same search: light the stones in order from 1 up. Each stone now shows a short sum (from level 6, a sum or a take-away) instead of its number, so finding "the one that makes 7" means working out each candidate in one's head. Grown-up wording names the task: *adding and taking away within 30 while searching in order*. It claims practice on this task only; no brain-training, attention or school benefit.

**Why an extension, not a new game.** The meaningful action is the same as levels 1–3 (find the next number on a shuffled board), so the existing `judge`, `hintIndex`, miss/hint accounting, layout and ghost finger carry over unchanged; only the stone's label differs. Pyramid Solitaire already owns *two cards that make a total* (13, with cover planning) and Number Nook owns worked calculation, so this round has no pick-two rule; a pick-two "make ten" round would duplicate Pyramid Solitaire's action and is not defined.

**Ladder (grownup only).** `LEVELS.grownup` becomes `{ min: 1, max: 6 }` and `planFor` clamps to 6; the ladder is simply `min..max`, so no `order`.

| Level | Board | Stones show | `describeLevel` |
| --- | --- | --- | --- |
| 4 | 3×3, totals 1–9 | sums `a+b`, addends 1–8 (total 1 is `1+0`) | Find the sums that make 1 to 9, in order |
| 5 | 4×4, totals 1–16 | sums `a+b`, drawn addend 1–9 (total 1 is `1+0`) | Find the sums that make 1 to 16, in order |
| 6 | 5×5, totals 1–25 | sums as at 5, or take-aways `a−b` with `b` 1..min(9, 30 − total), so `a` is at most 30; at least ten of each | Find sums and take-aways that make 1 to 25, in order |

**Generation (`logic.ts`, seeded `ctx.rng`).** `makeBoard` keeps returning the shuffled totals 1..N, so `judge` and `hintIndex` are untouched. A new `makeLabels(board, level, rng)` builds each stone's label: at levels 1–3 the plain number; at levels 4–6 a sum's total 1 is `1+0` (the only zero addend), otherwise the drawn addend `b` comes from 1..min(9, total − 1) (it may be the larger of the two, as in `1+9`) and the pair is written in either order at random; at level 6 each stone is such a sum or the take-away `(total + b)−b` with `b` from 1..min(9, 30 − total), the kinds dealt so each has at least ten stones (total 1 may be either kind). Labels are at most four characters (largest `24+1`, `29−4`) and use a true minus sign; the label's width stays within 88 units (shrink the font from the current 42 px if needed), which the level-6 portrait screenshot confirms. Stones stay 100 units on the same 3×3/4×4/5×5 layout as levels 1–3, which already fits portrait and landscape.

**Play.**
- The sign reads `Make 7 · 6 / 16`. `ctx.instruct('brain.sums.start', { n })`: "Find the sums in order, from the one that makes one up to {n}. Take your time."
- A right stone chimes, dims, gains its check and **its label changes to its total**, so lit stones read as a trail of plain numbers and only unsolved sums remain to search; then `brain.next` ("Now find {n}.") as today.
- A different unfinished stone: boing, one miss, and an explanation, `brain.sums.try`: "That one makes {m}. Look for the one that makes {n}." Touching a lit stone is free, as today.
- Two consecutive misses, or Hint: outline the stone that makes the target and count one hint (the levels 1–3 rule), with `brain.sums.hint`: "The one that makes {n} has a golden outline." The outline clears on the next right stone.
- Lighting the last stone finishes once through `ctx.finish({ misses, hints })` with `brain.done`: one sticker, including with help. No timer, speed goal, score or saved best.

**Grown-up text.** `skills` adds "Adding and taking away". The how-to card scopes the existing steps `to: 3` and adds `LevelLine`s `from: 4` ("Each stone shows a sum. Find the one that makes the number on the sign; a lit stone shows its answer.") and `from: 6` ("Some stones take away, such as 12 − 3."). Co-play: one person reads a sum aloud and the other says what it makes. Off-screen: write sums on paper squares and lay them out in order.

**Bot.** `autotouch` is unchanged: it taps `hintIndex(board, next)`, which plays every new level.

**Colour words stay a proposal.** An untimed colour-word (Stroop) board reduces to reading the word, so it has no honest finite version under the no-timer rule; it is not defined.

**Rule tests (`logic.test.ts`).** Over many seeds at levels 4–6: the totals are exactly 1..N; every label evaluates to its stone's total; operand bounds hold (level 4 addends 1–8 and level 5 drawn addend 1–9, except total 1 as `1+0`; level 6 take-away `b` 1–9 and `a` at most 30); every label is at most four characters; levels 4–5 have no take-aways and level 6 has at least ten of each kind; a 4×4 board uses at least three distinct drawn addends (not all `+1`); `planFor` clamps 0 to 1 and 7 to 6; the hint index is the stone whose total is `next`; the same seed gives the same labels.

**Check tier: new levels on an existing interaction.** Typecheck; the rule tests; one filtered `brainbreak` play of level 6 with one wrong stone (its spoken total), a second for the outline, then to the sticker; one portrait screenshot of level 6 to confirm the labels fit; `fingerdemo` at 6. No build (no shared assets) unless voice clips are rendered.

**Files.** `src/games/brain-break/{logic,logic.test,index}.ts`, `src/content/voice-script.ts` (three `brain.sums.*` lines), `src/content/howto.ts`, the `brainbreak` browser case; at closeout the README row and suite row, GAMES.md, ROADMAP step 9, the IDEAS row and VERIFICATION.
