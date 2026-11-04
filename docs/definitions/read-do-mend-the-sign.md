# Read & Do — Mend the sign (levels 8–9, KE1): fix a sign that does the wrong thing

KE1 definition, 2026-11-04, branch `claude/define-read-do-mend-the-sign`. This is dive slice 4 of the [Read & Do dive](../deep-dives/read-do.md#build-slices-in-order), from the [keyboarding and editing study](../deep-dives/subjects/keyboarding-editing.md). **Docs only:** no game change, code or device evidence. It settles what the dive left open: the authored broken signs, the delete and swap gestures, the drop-on-word versus gap rule, the hints, the bot and the check tier. Everything not restated here is as in the [level-7 definition](read-do-make-the-sign.md), which these levels extend.

## Scope and identity

**Fun action.** The pet holds up a sign that is nearly right and the animals act it out: the wrong cat naps, or nobody knows which dog to be. She fixes it by putting one word in, taking one out (level 8) or dropping a word onto a word to swap it (level 9). Then she presses **Send**, and the animals do the pet's wish.

**Learning purpose.** Revising written text so it says what the writer meant: read what the sign really says, find the word that makes it go wrong, and use the edit verbs on it (delete, insert, replace). This is the touch half of KE1 (W.2.5, strengthening writing by revising and editing).

**What it is.** Levels 8 and 9 of `read-do`, school only. No new game, land, band, keyboard or free text.

**Overlap:**
- Levels 1–3 read a fixed sign. Levels 4–6 ([definition](read-do-capital-stop.md)) dress a sign whose words are already right.
- Level 7 ([definition](read-do-make-the-sign.md)) composes a sign from an empty row and owns insert, move and take-out.
- Levels 8–9 alone start from an authored broken sign. Their new parts are the broken signs, the opening act-out and (level 9) the swap.

**Depends on batch read-do 3 (level 7).** That batch builds the parts these levels reuse:
- the wish card;
- the tray;
- `act()` and acceptance;
- `hintFor`;
- `signLayout`;
- the three drag gestures;
- the reactions;
- the `read.make.*` lines.

School's range is `min..max`, so 8 cannot ship before 7. The build line is ordered after that batch.

## Where it sits in the ladder

- **School:** the range becomes `{ min: 1, max: 9 }`.
- **Pre-K:** unchanged at `{ min: 1, max: 5, order: [1, 2, 4, 5] }`.
- **`PLANS[7]`:** `{ name: 'Fix a sign by putting one word in or taking one out', rounds: 3 }`.
- **`PLANS[8]`:** `{ name: 'Fix a sign by swapping one word for another', rounds: 3 }`.
- **`planFor`:** its clamp follows the plan count; `describeLevel` reads the plan name, as today.

## The sign, the stage and the wish

Everything is as at level 7, with these settled points:
- the locked `The` and stop;
- one to three slot words;
- the grammar `The (big|small)? animal action .`;
- solo and pair stages;
- `act()` and its four outcomes;
- a size read literally on a solo stage;
- acceptance means `act` with both actor and action equal to the wish.

**The words.** Each sign has level 7's six-word set: *big*, *small*, the stage animal, one decoy animal not on stage, *jumps* and *sleeps*. One of each, never copied. The authored broken sign is made of some of those six words; the rest start in the tray.

**Home slots.** Every one of the six words has a home slot in the tray row (seeded order), whether it starts in the tray or in the sign. A word that starts in the sign shows a faint dotted outline in its home slot from the opening, exactly like a placed tile at level 7. A word taken out of the sign, or replaced by a swap, floats to its home slot. So the tray never overflows, and nothing she removes is lost.

### Level 8: authored broken signs (one insert or one delete)

Patterns use placeholders filled by the seed:
- `X` is the stage animal and `Y` the decoy;
- `s` is the wished or stage size and `s′` the other size;
- `a` is the wished action and `a′` the other action.

| ID | Kind | Stage | Wish | Printed sign | `act()` of the printed sign | The intended fix |
| --- | --- | --- | --- | --- | --- | --- |
| I1 | insert | Pair `X` | `s X a` | *The X a.* | `which` | Put `s` in before `X` |
| I2 | insert | Solo `X` | `X a` | *The X.* | `unreadable` (no action) | Put `a` in after `X` |
| I3 | insert | Solo `X` | `X a` | *The a.* | `unreadable` (no animal) | Put `X` in before `a` |
| D1 | delete | Solo `X` at size `s` | `X a` | *The s′ X a.* | `none` | Take `s′` out |
| D2 | delete | Solo `X` | `X a` | *The X Y a.* | `unreadable` (two animals) | Take `Y` out |
| D3 | delete | Solo `X` | `X a` | *The X a a′.* or *The X a′ a.* (seeded) | `unreadable` (two actions) | Take `a′` out |

D3 is the one that asks for thought: taking out *either* action makes the sign readable, but only one of them makes it the wish. Taking out `a` and sending gives the wrong act (one miss), with level 7's spoken reason.

**A level-8 round** has three signs:
1. **I1.** This is the dive's opening, *The cat sleeps.* with a big and a small cat. It carries level 7's size lesson into editing.
2. **A delete:** D1, D2 or D3, seeded.
3. **A seeded pattern** from I2, I3 and the two deletes sign 2 did not use. It is never the same pattern as sign 2.

So every round has at least one insert and one delete.

### Level 9: authored broken signs (one swap)

| ID | What is wrong | Stage | Wish | Printed sign | `act()` of the printed sign | The intended swap |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | Action | Solo `X` | `X a` | *The X a′.* | wrong act (`X` does `a′`) | `a′` → `a` |
| S2 | Animal | Solo `X` | `X a` | *The Y a.* | `none` (no `Y` here) | `Y` → `X` |
| S3 | Size | Pair `X` | `s X a` | *The s′ X a.* | wrong act (the other `X` does it) | `s′` → `s` |

**A level-9 round** is one of each, S1, S2 and S3, in seeded order. This matches the dive's split into a wrong action, animal or size. The dive's first example, *The pig sleeps.* with the wish *pig jumps*, is S1.

**No level-9 sign can be fixed by one insert or one delete.** Each needs a swap, or a take-out followed by an insert. Both routes are accepted. The swap is the faster verb, not the only one.

### Variety rules (both levels)

- The three signs use three different stage animals, shuffled from the four. Each sign's decoy is a seeded animal not on its stage.
- Across the three wishes, *jumps* and *sleeps* each appear at least once.
- On a solo stage, the size `s` is seeded. The wish card shows the animal at its stage size, as at level 7.
- **No printed sign is accepted.** A rule test asserts that it never already matches the wish.
- The seed fixes the whole round, so a replay never changes a puzzle.

## What she does

**The opening act-out.** Each sign opens with three things in order:
1. The pet says `read.mend.watch`.
2. The sign plays exactly as **Show it** would: the read-back with the highlight, then the animals act out the printed sign's outcome with level 7's reaction.
3. The instruction plays.

This is free. She sees what is wrong before she is asked to fix it. The wish card is up throughout.

**Level 8 gestures.** These are level 7's three gestures, unchanged, through `src/engine/drag.ts`, with tiles riding 40 units above the finger:
- **insert** a tray tile at the nearest gap;
- **move** a sign word to another gap;
- **take out** a sign word, which floats to its home slot.

A tray tile dropped over a sign word at level 8 inserts at the nearest gap, as at level 7.

**Level 9 adds the swap.** A tray tile dropped onto a slot word replaces it. The tray tile takes that word's slot, and the replaced word floats to its home slot, with one soft pentatonic tick. Swap rules:
- **Only a tray tile onto a slot word.** A tile over the locked `The` or the stop resolves to the nearest gap; those two never swap.
- **A sign word dragged over another sign word moves to the nearest gap**, as at level 7. There is no sign-to-sign swap, because moving already fixes word order.
- **A swap on a full three-word sign is allowed**, since the count does not change. An insert on a full sign still floats home with `read.make.full`.

**Drop on a word versus in a gap (level 9).**

Resolution is judged against the row's **rest positions**: where the slots sit with nothing spread open. The live spread is only a picture, so the target never jumps under her finger.

While a tray tile's centre is inside the row's drop zone (level 7's rectangle):
- **Swap state.** It enters swap state when its x is within 27 units of a slot word's rest centre (the word's middle half). It stays in swap state until x is more than 40 units from that centre, which is hysteresis so the preview does not flicker at the edge. In swap state the row does **not** spread, and the target word wobbles and dims to show it will be replaced.
- **Gap state.** Anywhere else in the zone, it resolves to the nearest gap by x, and the row spreads open there as at level 7.
- **Outside the zone,** the tile floats home on release.

**Why the narrow zones are acceptable.** The swap zone is about 54 units wide and each insert zone about 62. Neither is a tap target; they are where a drag resolves while she holds it. The live preview (wobble or spread) shows the result before release. She can slide until it shows what she wants, and every outcome is free and reversible. The tiles themselves stay 108 × 100, and every tap target stays at least 100 units. The device check below covers whether this is comfortable in portrait on an iPad.

**Show it, Send, tapping a word, the empty sign:** all as at level 7. If she takes every word out, Send on the empty sign is free and the pet repeats the instruction.

## Mistakes, hints and accounting

Accounting is level 7's, unchanged:
- every edit (insert, move, take-out, swap) is free;
- every drop that floats home is free;
- a cancelled drag is free;
- Show it, the opening act-out, the speaker, tapping words and the wish card are free;
- an empty Send is free;
- each failed Send on a non-empty sign is one miss, including a Send of the unchanged printed sign;
- two failed Sends on one sign start the glow and count one hint for that sign.

**The glow's next step** comes from a pure rule, `hintFor(sign, stage, wish, level)`:

1. **Already accepted:** glow Send.
2. **Level 9 only, one swap away.** Her sign has the same number of slot words as some accepted sign and differs from it at exactly one position, and the replacement word is in the tray. Glow the sign word and the tray tile together; the pet says `read.mend.hint.swap`, then the tray word's line.
3. **Otherwise:** level 7's rule:
   - if her sign is an in-order subsequence of an accepted sign, add that sign's next missing word (`read.make.hint.add`);
   - if not, take out the leftmost word that breaks the subsequence (`read.make.hint.out`).

The swap step is **gated to level 9**. D1 is also one swap away, but level 8 has no swap gesture, so at level 8 the glow must name the take-out.

On every level-8 pattern, step 3's first glow is the intended fix in the table. On every level-9 pattern, step 2's first glow is the intended swap. Following the glow from any reachable sign reaches an accepted sign in at most six steps, with a swap counting one, and never needs a fourth slot word.

**Adaptation and completion** are as at level 7:
- a round of three signs with at most one miss and no hints is smooth;
- after the third sign, `read.done` plays, then one sticker through `ctx.finish({ misses, hints })`;
- no "do it for me", no `askForHint`, no timer, lives or speed credit.

## Voice (planned IDs, not yet in `voice-script.ts`)

`ctx.instruct` gives each level's goal and `ctx.say` gives everything else. The wording is a draft for ordinary review (standing rule S1).

Every outcome line, the full-sign line, the add and take-out hints and the wish-card tap reuse level 7's `read.make.*` lines:
- the outcomes: `yes`, `other`, `which`, `none`, `mixed`;
- `full`;
- `hint.add` and `hint.out`;
- `wish` (tapping the wish card).

| ID | Draft |
| --- | --- |
| `read.mend.watch` | "Watch what this sign makes them do." |
| `read.mend.instruction` | "That's not my wish! Fix the sign: put a word in, or take a word out. Then Send." |
| `read.mend.swap.instruction` | "That's not my wish! Drop a word on a word to swap them. Then Send." |
| `read.mend.hint.swap` | "Swap this word for this one." |

As at level 7, the wish is **never spoken as words**. There is no new vocabulary: every word is already in `WORDS`, `WORD_LINES` and the voice script after batches read-do 2 and 3.

## Layout and presentation

The geometry is level 7's exactly, at all four views: the sign row, speaker, stage, wish card, Show it and Send column and the six-tile tray.
- `signLayout(view, level)` accepts 8 and 9 and returns the same rectangles as 7.
- The layout test's four-view assertions run for 7, 8 and 9.
- The printed sign uses level 7's five-slot row. At most three slot words are ever printed, so it never needs a fourth.

New presentation, none of it a target:
- the dotted home-slot outlines at the opening;
- the swap preview's wobble and dim on the target word;
- the glow pair for a swap hint (sign word and tray tile).

**Not decorated with the answer.** The broken word is not marked until the glow. The opening act-out is the clue.

## Co-play, off-screen, how-to and bot

- **Co-play:** a grown-up writes a wrong sign in the air ("The big dog sleeps") for a toy and she says which word to change; then swap roles.
- **Off-screen:** write a sign on paper for a toy to act, cross out one word and write the fix above it, the paper version of a swap.
- **How-to card:** one `LevelLine` from 8 to 8 (watch the sign, put a word in or take one out, then Send) and one from 9 to 9 (watch the sign, drop a word on the wrong word to swap it, then Send). No "later levels" wording.
- **Bot:** `autotouch()` returns `null` while busy; otherwise it follows `hintFor` at the current level:
  - an add is a `{ drag, to }` from the tray tile to its gap's rest centre;
  - a take-out is a `{ drag, to }` from the sign word to its home slot;
  - a swap is a `{ drag, to }` from the tray tile to the target word's rest centre (dx 0, inside the swap zone);
  - once accepted, `{ tap: Send }`.

  It never makes a failed Send. The fingerdemo at 8 and 9 proves it.

## Rule tests the build needs

In `logic.test.ts`:

- **Printed outcomes:** for many seeds, each pattern's printed sign gives the `act()` outcome in its table:
  - I1 `which`; I2, I3, D2 and D3 `unreadable`; D1 and S2 `none`;
  - S1 and S3 wrong act.
- **Never already right:** no printed sign is accepted.
- **Each fix works:**
  - every level-8 pattern's intended single insert or delete gives an accepted sign;
  - every level-9 pattern's intended swap does.
- **Level 9 needs the swap:** no single insert or single delete fixes any level-9 printed sign.
- **Words and tray:** the printed sign's words and the tray's words are the six-word set, each once, and every fix uses a tray word.
- **Seeded rounds:**
  - level 8 opens with I1 and holds at least one insert and one delete;
  - level 9 holds S1, S2 and S3 once each;
  - three different stage animals per round, and both actions across the wishes;
  - the same seed gives the same round.
- **Hints lead somewhere:**
  - at level 8, the first `hintFor` step on every pattern is its intended fix, and no step is ever a swap;
  - at level 9, the first step is the intended swap;
  - from every sign reachable from a printed sign and its tray, repeatedly applying `hintFor` reaches an accepted sign within six steps (a swap counts one), never needs a fourth slot word, and every added word is in the tray.
- **Drop resolution:** a pure `resolveDrop(x, restSlots, level, previous)` returns a swap at |dx| ≤ 27 from a slot word's centre at level 9 only and never on `The` or the stop. It keeps a swap until |dx| > 40, and otherwise returns the nearest gap.
- **Layout:** `signLayout` at the four views for levels 8 and 9.
- **Voice:** every `read.mend.*` ID exists in the voice script.

## Settled and open

**Settled by this packet:**
- levels 8 and 9, school only, three signs per round;
- the I/D/S pattern tables and round composition;
- the six-word set split between sign and tray, with home slots;
- the free opening act-out;
- the swap is level 9 only, tray tile onto a slot word only, judged at rest positions with hysteresis;
- no sign-to-sign swap;
- swaps are allowed on a full sign;
- the level-gated swap hint;
- level 7's accounting and voice reused, plus four `read.mend.*` lines.

**Gates:**
1. Batch read-do 3 (level 7) built first.
2. The building session's ordinary content review of the patterns and the `read.mend.*` wording (standing rule S1).
3. The touch layout proof at the four views once built.

**Open for observation, not for the build:**
- whether children reach for the swap or prefer take-out then insert;
- whether level 8's opening act-out is enough of a clue without a spoken one.

## Device and person checks

Added to [DEVICE-CHECKS.md](../DEVICE-CHECKS.md) when the levels are built, not claimed now:
- swap versus insert comfort in portrait on an iPad (the 54- and 62-unit drop zones with their preview);
- whether the opening act-out of a broken sign reads as a funny mistake to fix, not as her failure;
- iPad speech for the `read.mend.*` lines.

## Build order and check tier

**Couplings on level 7's build.** Batch read-do 3 should not hard-code what levels 8 and 9 change:
- words can **start** in the sign while keeping home tray slots (dotted outlines from the opening);
- `signLayout(view, level)` takes the level and returns the same geometry for 7–9;
- drop resolution goes through one function that a level-9 swap zone can extend.

If level 7 lands without these, the read-do 4 build makes the change in place.

**One batch, read-do 4: levels 8–9.**
1. **`logic.ts`:**
   - the pattern tables and `makeMendSigns(rng, level)`;
   - the level-gated swap step in `hintFor`;
   - `resolveDrop`;
   - `PLANS[7]` and `PLANS[8]`;
   - then the rule tests.
2. **`index.ts`:**
   - the opening act-out;
   - starting words in the sign;
   - the level-9 swap with its preview;
   - the swap glow pair;
   - `autotouch()` for 8 and 9;
   - school `max: 9`.
3. **Content:**
   - the four voice lines;
   - two how-to `LevelLine`s;
   - a `readdo` level 8 and 9 case in `scripts/browser-check.mjs`;
   - the README row and the [GAMES.md](../GAMES.md) entry.

**Check tier.** Level 8 is new levels on level 7's interaction; level 9's swap is a new interaction.
- Typecheck, and unit tests including registry, lands, how-to and layout.
- One filtered `readdo` play:
  - level 8 with a Send of the unchanged printed sign (a miss), then a second failed Send to raise the glow and its hint, then on to the sticker;
  - level 9 to its sticker, using one swap.
- One portrait screenshot of the swap preview.
- `fingerdemo` at 8 and 9.
- One `npm run build` for the voice lines.
- If the allowance cannot cover level 9, stop after 8 with a checkpoint.
