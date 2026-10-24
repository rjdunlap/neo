# Ramp Race: Trial Shelf and One Change (definition)

Defined 2026-10-17 as slice **Q3** of the [scientific inquiry study](../deep-dives/subjects/inquiry.md#build-slices-in-order), which proposed the [ladder these levels come from](../deep-dives/subjects/inquiry.md#first-games-proposed-ladder-ramp-race-extensions). **Level 5 built 2026-10-24 ([PR #918](https://github.com/rjdunlap/neo/pull/918)); level 6 not built.** Q4 builds level 5, then level 6, in separate sessions. Small deviations in the build: the guess zone starts 12 units right of the ramp foot so a guess never cycles the ramp, and the paw on card B sits above the flags (y 16). **Gated:** Q4 waits on [inquiry decisions 1–2](../deep-dives/subjects/inquiry.md#decisions-for-the-developer) (new-mode accounting and the school 1–6 window), listed in [Waiting on the developer](../WAITING-ON-DEVELOPER.md). It also waits on Q2, the [truthful support correction](ramp-race-support.md), because level 6 reuses Q2's `classifyFair`, `fairRepair`, voice lines and corrective glow.

**What it adds:** two appended levels of `ramp-race` (`src/games/ramp-race/`), 5 and 6.
- Levels 1–4, their IDs and pins, the pre-K 1–2 window and the stated toy model (distance = height × floor glide, in floor marks) do not change.
- It adds no band, land, tile, save field, journal entry, creation slot or couch entry.
- The `ramp-race` row in the [deep-dive tracker](../deep-dives/README.md) stays unclaimed: this is a subject-study packet, not a full game deep dive.

## Fun action and learning goal

- **Level 5, Trial Shelf.** Roll the car and its stop drops onto a pictured **record card**. Change the ramp, guess if you like, roll again, and a second card lands under the first. Then she taps the card whose car went farther.
  - The goal is to tell a **guess** (a paw marker) from a **record** (a flag on a card), and to answer from the record, not from memory.
- **Level 6, One Change.** The orange lane starts with two things different from the blue lane. She fixes it so only the thing on the sign differs, presses go, and reads the two cards.
  - The goal is to repair a confounded comparison (control of variables), then to read the evidence it produced.
- Anchors are those of the study: NGSS practice 3 (plan and carry out investigations, fair tests with controlled variables) and practice 4 (analyze and interpret data), and 3-5-ETS1-3 (fair tests in which variables are controlled).

## Bands and ranges (proposal, pending decision 2)

| Band | Today | Proposed |
| --- | --- | --- |
| `prek` | 1–2 | 1–2, unchanged. A pre-K trial of 5 needs observation first (study audience K) |
| `school` | 1–4 | **1–6**, plain `min..max`, so no `order` is needed. Level 7 ([What can we tell?](what-can-we-tell.md), Q5) would be the school top later |

`describeLevel` names:
- 5: *Trial Shelf: roll two ramps, keep both cards, tap the one that went farther*
- 6: *One Change: fix the orange lane so only one thing differs, then read the cards*

## Level 5: Trial Shelf

**Setup:** one lane (lane 0, blue car), wood floor, exactly as level 2. The floor is not changeable: tapping it outside the guess phase says `ramp.woodonly`, as now. A round is **two pairs**.

**Start heights:** `makeShelf(rng)` gives the two pairs' first heights, `[2, 4]` or `[4, 2]` in seeded order.
- The second roll of a pair must use a different height. So a pair that starts at 2 always ends with the second card farther, and a pair that starts at 4 always ends with the first card farther.
- So **the correct card is the top one in one pair and the bottom one in the other**. Tapping the same position twice never completes a round.
- The study's example first round is the `[2, 4]` order.

**A pair, step by step:**
1. **First roll.** The ramp stands at the start height and is **locked** until the first card lands: tapping it says `ramp.shelf.first` (a nudge, not a miss), so every pair really starts at 2 or 4. `ramp.shelf` asks her to roll it (`ctx.instruct`). She presses go and the car rolls, as on levels 1–3.
   - When it stops, a blue flag grows at the stop on the lane floor and one pentatonic landing note sounds. The note acknowledges the stop; it never judges.
   - Record card A (blue stripe) slides into the top slot of the shelf.
   - The car returns to the ramp top. The blue flag stays on the lane floor.
2. **Change and guess.** `ramp.shelf.change` (instructed, so the pet repeats it) asks her to change the ramp and, if she likes, to guess.
   - The car turns orange. This is decorative and matches card B's stripe; colors never change results.
   - **Changing the ramp:** tapping it cycles 2 → 3 → 4 as now.
   - **Guessing (optional, free):** tapping the floor region drops a **paw marker** where she tapped, before or past the blue flag. Tapping again moves it. The paw is a different shape from a flag, so a guess never looks like a record.
   - **Same height:** pressing go with the ramp still at the first height says `ramp.shelf.same`. It is a nudge, not a miss, and nothing rolls.
3. **Second roll.** An orange flag grows at the new stop and record card B (orange stripe) slides into the bottom slot. The lane's flags and paw clear, so the cards are now the only record.
   - If she guessed, the card shows her paw on the matching side of its ruler, and the pet says `ramp.guess.right` or `ramp.guess.new`.
   - Neither guess line is a miss or a boing, and neither is ever counted.
4. **Read the record.** `ramp.shelf.ask` (instructed) asks which car went farther: "tap its card."
   - Both cards are 104 units tall and stacked, so their rulers line up and the flags can be compared directly.
   - **Right card:** sparkle, and `ramp.shelf.yay` with `{what}` = *taller* (on wood the taller ramp always goes farther).
   - **Wrong card:** described under [Misses, hints and glow](#misses-hints-and-glow-proposal-pending-decision-1).
5. **Next pair.** Both cards slide off; only two records are ever shown. The ramp is set to the next start height, and the car turns blue again.

After two pairs, `ramp.done.shelf` plays, then `ctx.finish`.

**What she decides:**
- which different height to try second (from 2: 3 or 4; from 4: 2 or 3);
- whether and where to guess;
- which card answers the question.

The pairs she can roll always have distinct stops (wood: 3, 4.5 and 6 marks), so a question never has two right answers.

## Level 6: One Change

**Setup:** two lanes, as on level 4, with one difference: **lane A (blue, top) is the locked control**, always `{ height: 3, floor: 'wood' }` (`CONTROL`).
- Tapping lane A's ramp or floor says `ramp.keepblue`, with a soft tick and no other effect. It is not a miss.
- Only lane B (orange, bottom) changes.
- **Why lock it:** a fixed control is what a record compares against. It keeps both of the study's starting setups true. It lets Q2's `fairRepair`, which already holds lane A, serve as both the hint and the bot.
- The rejected alternative (both lanes editable, any fair pair accepted, as on level 4) is recorded as developer decision 3 below.

**Questions:** `makeChange(rng)` gives a round of **two questions, exactly one floor and one height**, in seeded order.
- This differs from level 4's `makeQuestions`, which can repeat a kind.
- Each question gives lane B a **both-changed start**, picked from the four setups that differ from `CONTROL` in height *and* floor: `{2|4} × {carpet|ice}`. The two questions use different starts.
- The first round of the study's example is the floor question with B at `{ 4, carpet }`.
- Lane B is set to its start when each question begins. It does **not** reset to 3/wood the way level 4's lanes do.

**A question, step by step:**
1. **The sign.** The level-4 sign shows floors or ramps, and `ramp.change.floor` or `ramp.change.height` is instructed.
2. **Edit and Check.** She edits lane B and presses go, which is the Check. Q2's classification answers it:

   | Pair kind | What happens |
   | --- | --- |
   | `same` | `ramp.same.*`, a nudge, not a miss |
   | `wrong-only` | Miss, boing, `ramp.wrong.*` |
   | `both-changed` | Miss, boing, `ramp.unfair.*` |
   | `fair` | Both cars roll |

3. **After the run.** The sign fades out. The two stops become cards, A on top and B underneath, in the shelf slot. The cars go back to their ramp tops, so the cards carry the evidence, as on level 5.
4. **Read.** `ramp.shelf.ask` asks which car went farther. A right tap says `ramp.fairyay` with `{what}` as on level 4 (the floor name, or *taller/shorter ramp*). The next question follows.
   - The answer depends on her repair, so it is a real reading:
     - Floor question: B carpet (3 marks) loses to A (4.5); B ice (7.5) wins.
     - Height question: B height 2 (3) loses; B height 4 (6) wins.
   - Because A is locked, each question has exactly two fair repairs, and both are accepted.

After two questions, `ramp.done` ("What a scientist! You tested it fairly."), then `ctx.finish`.

**What she decides:**
- which control to put back to match;
- which value of the named control to test;
- when the pair is ready to Check;
- which card answers.

## Misses, hints and glow (proposal, pending decision 1)

The study's principle is that **prediction, editing, guessing, repeats and nudges are free**. Only an explicit Check of a goal (an unfair pair) or of the evidence (a card tap) can miss.

| Event | Level 5 | Level 6 |
| --- | --- | --- |
| Guess, change, re-tap the paw, tap a locked ramp or lane, same pair or same height | Free | Free |
| Go on a confounded pair (`wrong-only` / `both-changed`) | — | 1 miss each, a boing and its line |
| Second confounded Check on one question | — | Q2's corrective glow on lane B and `ramp.fairhint`. **1 hint, once per question**; further unfair Checks still miss but never stack, restart or re-announce the glow |
| Tap the card that went less far | 1 miss, a boing, `ramp.shelf.wrong`. Both cards replay at once: each card's mini car slides from its ramp to its flag | Same |
| Second wrong card on one pair or question | A pulsing yellow ring on the farther card and `ramp.shelf.hint`. **1 hint, once**. Tapping it completes the pair normally. With two cards this is reached only by tapping the same wrong card again: the replay after the first miss is the real help | Same |

- **Contrast with level 4.** Level 6 counts setup help **once per question**. Level 4, as Q1 recorded and Q2 keeps, counts a hint on every unfair Check from the second on.
  - Level 6 is new, so it starts with the once-per-question rule the other levels use.
  - Whether level 4 also moves to it stays part of decision 1.
- **Most help in one question:** 2 hints, one for the setup and one for the reading.
- **Help still finishes:** a round finished with help ends normally, with one sticker.
- **Adaptation:** reading two pictured cards correctly is the skill level 5 checks. So a zero-miss round there counts toward the two-smooth-rounds step up into level 6, but it is **weak evidence**: with two cards a pure guesser has at most one miss in about three rounds of four. A guess that turns out wrong is never counted, so a cautious guesser is not stepped down.
  - Decision 1 still has to approve this, including whether a level-5 round with no wrong card taps but many same-height nudges should count as smooth. **Proposed: yes**, because nudges are not errors.
- **The ring and glow take no touches:** both draw in the existing `glow` graphic (`eventMode = 'none'`). The ring is worked out each frame from the card positions, so a resize cannot strand it.

## Layout (frozen; the view is at least 1024 × 768 in every orientation)

The existing pieces it has to avoid:

| Piece | Where |
| --- | --- |
| Home | (62, 62) |
| `?` | (62, 160) |
| Pet | (74, h − 18) |
| Go | r 60 at (w − 80, h − 80) |
| Ramps | x 130–330, up to 214 units above their floor including the hit pad |
| Lane floors | x 320 to w − 150 |
| Lanes | Single lane at 0.66h (levels 1–3 and 5); two lanes at 0.42h / 0.78h (levels 4 and 6) |

The new pieces:
- **Shelf:** two record cards, each **460 × 104**, stacked with a 12-unit gap.
  - Top card at x (w − 500)–(w − 40), y 36–140. Bottom card at the same x, y 152–256.
  - At w = 1024 that is x 524–984, clear of every ramp, home and `?`.
  - Level 6's top lane: the cars on the floor reach up to about floorY − 50 = 272 in landscape, below the shelf's 256.
- **Inside a card:**
  - a color stripe with a car icon;
  - a mini ramp drawn at its height with height ticks;
  - a floor swatch with the lane's texture (carpet dots, wood lines or ice facets, so surfaces never depend on color alone);
  - a ruler from 0 to 10 marks, about 29 units per mark, with the flag at the stop. Both cards' rulers share x, so 4.5 against 6 marks sit about 43 units apart, one above the other;
  - on level 5's card B, a paw on the side she guessed, when she guessed.
- **Level 5's ask badge:** a 100 × 100 "farther" arrow drawing left of the stack at (w − 580, 146). Decoration only.
- **Level 6's sign:** the level-4 sign at (w/2 + 60, 80) is shown only while editing and hidden while the cards are up, so the two never overlap.
- **Guess zone (level 5, change step only):** the floor band from rampEnd to w − 150, y floorY − 110 to floorY + 60 (170 units tall), split at the blue flag.
  - With about 52.3 units per mark at w = 1024, the narrowest side is the 3-mark "before" side of a pair started at 2, **157 units** wide. The narrowest "past" side is 4.6 marks after a start at 4, **240 units** wide.
  - Go's circle (y ≥ h − 140) and the pet's corner stay outside it in both orientations.
- **Portrait** (about 1024 × 1365) uses the same coordinates. Lanes sit lower, which only adds room.
- **Wide phones** (w > 1024) widen floors and units. Cards stay right-aligned at the same size.

Q4 puts the arithmetic in a pure `shelfLayout(view, mode)` in `logic.ts` so a rule test can check it, rather than in a screenshot.

**Resize and cancellation:**
- Records are data (`TrialRecord`), and cards, flags, the paw and the ring are redrawn from marks on every `resize`. Nothing is stored in pixels.
- Taps during a roll, a card slide or a replay are ignored (`busy`). While the cards are asking (levels 5 and 6), the ramps, floors, guess zone and Go are inert too; only the cards answer. `onTap` already handles cancel and leave.
- If the scene is destroyed mid-roll, the awaited chain stops with the tweens, as the scene contract says. No game-owned timer or listener is added, so `destroy()` stays as small as now.
- Card art draws with Pixi `Graphics` into containers the game owns. No `RenderTexture`.

## Logic (`logic.ts`, Q4)

```ts
export type RampMode = 'explore' | 'height' | 'both' | 'fair' | 'shelf' | 'change';
// PLANS gains, after the four existing entries (IDs 1–4 unchanged):
//   { mode: 'shelf', rounds: 2, name: 'Trial Shelf: …' }, { mode: 'change', rounds: 2, name: 'One Change: …' }
export const CONTROL: Setup = { height: 3, floor: 'wood' };
export interface TrialRecord { setup: Setup; stop: number; guess?: 'before' | 'past' }
export const recordOf = (s: Setup, guess?: TrialRecord['guess']): TrialRecord; // stop = distance(s)
export const sideOf = (stop: number, flag: number): 'before' | 'past';   // the paw's side; stops never tie in these levels
export const farther = (a: TrialRecord, b: TrialRecord): 0 | 1;          // index of the larger stop
export function makeShelf(rng: Rng): [number, number];                   // [2, 4] or [4, 2]
export function makeChange(rng: Rng): { question: FairQuestion; start: Setup }[]; // one floor + one height, distinct both-changed starts
/** Misses and hints for one pair or question from its event list, so accounting is testable. */
export type RampEvent = 'unfair-check' | 'wrong-card' | 'free';
export function tally(events: RampEvent[]): { misses: number; hints: number };
```

`rampTouch`'s goal gains `records` and `guess`, and `RampTouch` gains `{ guess: 'before' | 'past' }` and `{ card: 0 | 1 }`:

| Level | Situation | The ghost finger touches |
| --- | --- | --- |
| 5 | No record yet | `'go'` |
| 5 | One record, ramp at the same height | The ramp, once |
| 5 | One record, ramp changed, no guess | `{ guess }`: past when the new ramp is taller, before when it is shorter. It is a stated rule, never a lucky guess |
| 5 | One record, ramp changed, guessed | `'go'` |
| 5 | Two records | `{ card: farther(…) }` |
| 6 | Pair not fair | `{ lane: 1, change: fairRepair(…) }` |
| 6 | Pair fair | `'go'` |
| 6 | Two records | `{ card }` |

**It never returns null in a phase that is not busy**, so a demonstration cannot stall. It never touches lane 0 in level 6, and never taps a less-far card.

## Rule tests (`logic.test.ts`, Q4)

1. **Existing levels are kept.** `PLANS` has six entries. Entries 1–4 keep their modes, rounds and names, and `planFor(5)` / `planFor(6)` are `shelf` / `change`.
2. **Shelf pairs.** Over 200 seeds, `makeShelf` is a permutation of `[2, 4]`.
   - For each start, every legal second height (≠ start) gives a stop different from the first.
   - The two pairs' correct card indices differ.
3. **Records.** For every ordered pair of distinct wood heights:
   - `farther` agrees with `distance`;
   - `sideOf(b.stop, a.stop) === 'past'` exactly when `farther` is 1;
   - `recordOf(...).stop === distance(...)`, with only whole and half marks.
4. **Change starts.** Over 200 seeds, each round has one floor and one height question with distinct starts. Each start is `both-changed` against `CONTROL` for its question (Q2's `classifyFair`).
5. **Repairs.** With A = `CONTROL`:
   - each question has exactly 2 fair B setups, and their distances never tie with A's 4.5;
   - from each of the four starts, `fairRepair` taps reach a fair pair in at most 2 taps;
   - from any of the 9 B setups, at most 3 taps.
6. **The bot finishes.** Simulate `rampTouch` through both levels over 50 seeds, applying each touch the way `index.ts` does. Each round completes its 2 pairs or questions with `tally` giving 0 misses and 0 hints. No non-busy step returns null, and level 6 never touches lane 0.
7. **Accounting.** `tally` gives:
   - free events: 0 / 0;
   - unfair Checks *n*: *n* misses and `min(1, max(0, n − 1))` hints;
   - wrong cards *m*: *m* misses and `min(1, max(0, m − 1))` hints;
   - both together: the sums, so never more than 2 hints.
8. **Layout.** `shelfLayout` at 1024×768, 1024×1365 and 1664×768:
   - cards and guess sides are at least 100 units in both dimensions;
   - no card overlaps home, `?`, the pet's corner, Go, a ramp hit area or the top lane's car band;
   - the guess zone stays clear of Go and the pet.
9. **How-to.** The existing `howto.test.ts` covers wording and length, per level.

## Voice lines (`voice-script.ts`)

| ID | Text | Use |
| --- | --- | --- |
| `ramp.shelf` | Press go and watch where the car stops. Its card will remember. | 5, first roll (instruct) |
| `ramp.shelf.change` | Now change the ramp. If you like, tap the floor to guess: will it stop before the blue flag, or past it? Then press go. | 5, second roll (instruct) |
| `ramp.shelf.first` | Press go first. Then you can change it. | 5, ramp tapped before the first card |
| `ramp.shelf.same` | That is the same ramp as last time. Change it to find out something new. | 5, nudge |
| `ramp.guess.right` | You guessed {side} the flag, and it stopped {side}! | 5, after a guess that matched |
| `ramp.guess.new` | You guessed {guess} the flag. It stopped {side}. Now we know! | 5, after a guess that did not match. No boing |
| `ramp.shelf.ask` | Look at the cards. Which car went farther? Tap its card. | 5 and 6 (instruct) |
| `ramp.shelf.wrong` | Look again. See where each flag stopped. | 5 and 6, wrong card |
| `ramp.shelf.hint` | This card's flag is farther along. Tap it. | 5 and 6, the ring |
| `ramp.shelf.yay` | Yes! The {what} ramp sent it farther. | 5 |
| `ramp.done.shelf` | Two pairs of cards! What a careful tester. | 5, finish |
| `ramp.change.floor` | Which floor lets the car go farther? Fix the orange lane so only the floors are different, then press go. | 6 (instruct) |
| `ramp.change.height` | Does a taller ramp send the car farther? Fix the orange lane so only the ramps are different, then press go. | 6 (instruct) |
| `ramp.keepblue` | The blue lane stays the same. Change the orange lane. | 6 |

- `{side}` / `{guess}` are the words *before* and *past*. `{what}` follows `ramp.fairyay`'s existing values.
- Level 6 reuses Q2's `ramp.wrong.*`, `ramp.unfair.*`, `ramp.same.*` and `ramp.fairhint`, plus the existing `ramp.fairyay` and `ramp.done`.
- Lines are spoken with device speech, so iPad speech of "farther" and the half-mark numbers stays a [device check](../DEVICE-CHECKS.md).

## How-to card (`howto.ts`)

Q1's level-4 lines become `{ from: 4, to: 4, … }`, and these are added. The goal line stays as Q1 wrote it, *Roll a toy car down a ramp and see how far it goes across the floor.*, which is true at every level. None of the new lines says "level", "later", "earlier" or "higher".

| Part | Level 5 | Level 6 |
| --- | --- | --- |
| Step | Press go, and where the car stops goes on a card. Tap the ramp to change it, tap the floor to guess where the car will stop if you like, then press go again. Tap the card whose car went farther. | The sign shows what to test: floors or ramps. The blue lane stays put; change the orange lane until only that thing is different, press go, then tap the card whose car went farther. |
| Finish | The round ends after two pairs of cards. | The round ends after two fair tests, one of floors and one of ramps. |
| Note | Guesses are free, and rolling the same ramp twice only gets a reminder. Tapping the card that went less far is a miss; after two on one pair, the farther card glows. | Two lanes that are just the same get a reminder, not a miss. Pressing go when anything besides the thing on the sign is different is a miss, and so is tapping the card that went less far; after two of either on one test, what to change or tap glows. |

The longest resolved card, level 6, is about 650 characters including the goal and the level name, under the 840 limit.

`coplayHint` stays as Q1 changed it (*Guess together before each roll: how far will the car go, and why?*). It fits levels 5–6. Co-play there is one person choosing the change and the other reading the cards, then swapping. Solo play hides nothing.

## Art, sound, music, couch and rework couplings

- **Art.** Pixi `Graphics` only, from palette `wood`, `swatch` and `ink`. The blue and orange flags are triangle pennants; the paw is a four-toe print, so shape always separates guess from record. No imported art.
- **Sound.** The card's landing note is one `sfx.bell` on a pentatonic step. The boing and sparkle are as now. Music stays `STYLES.hub`; no `silenced`.
- **Couch.** None. Ramp Race has no couch entry, and this adds none.
- **Rework.** This fits the [creature-world brief](../rework/README.md)'s Discovery Club, which *investigates questions*, but adds no hook in this slice:
  - no unlock, collectible, journal discovery or creature reaction;
  - nothing gates, expires or rotates.
  - A later adventure request (the authored requests and typed outcomes of RW07) could ask "which floor is fastest?" and use level 6. That is RW07's to define, not this packet's.
- **Off screen** stays the current book-ramp suggestion.

## Check tier for Q4

New interaction tier, once per level, in separate sessions (5 first):
1. `npm run typecheck`, then `npx vitest run src/games/ramp-race src/content/howto src/games/registry`.
2. One filtered scripted play: extend the `woods` suite's `ramp` case to the new top level (`BROWSER_SUITE=woods WOODS_ONLY=ramp FROM_LEVEL=5`).
   - Level 5: a same-height nudge, a guess, one wrong card, then the hint ring.
   - Level 6: one unfair Check, a second for the glow, then a wrong card.
   - Check that misses and hints match `tally`.
3. `fingerdemo` for `ramp-race` at the new level.
4. One portrait screenshot with both cards up.
5. `npm run build` only if a shared file beyond `voice-script.ts` and `howto.ts` changes.
- Closeout: the README row, GAMES.md entry and how-to card.

**Not established by any check:** whether a child sees each card as *that run*, tells the paw from the flag without reading, finds the farther flag on stacked cards, or wants another pair. These went to [DEVICE-CHECKS](../DEVICE-CHECKS.md) when level 5 built.

## References

Each was opened and described in the [inquiry study's precedents](../deep-dives/subjects/inquiry.md#similar-games-and-physical-play). They were not re-opened for this packet, and no detail beyond that study is claimed.

- [Sesame Workshop, Little Discoverers: Ramp It Up](https://static.pbslearningmedia.org/media/media_files/46629112-d994-4f61-9d46-f0effb7c121c.pdf): compare increasing ramp heights, and mark stopping positions with a consistent measure. This is the source of the pictured, aligned stop records.
- [Exploratorium, Slow Your Roll](https://www.exploratorium.edu/snacks/slow-your-roll): records of positions as a representation of motion. Its older depth stays for level 7 and above.
- [Tinybop Simple Machines](https://tinybop.com/apps/simple-machines): a change has an immediate, inspectable consequence; compare before and after. This is the shape of the second roll.
- [Zendo](https://www.looneylabs.com/games/zendo): keep the evidence in view, and choose an informative example. Behind the shelf and the "different height" nudge.
- [Human Resource Machine](https://tomorrowcorporation.com/humanresourcemachine): a small vocabulary before a bigger plan. So level 5 changes one control on one lane before level 6 repairs two.

PhET Pendulum Lab's controls were not established by the study, and nothing is borrowed from it.

## Developer decisions (in [Waiting on the developer](../WAITING-ON-DEVELOPER.md))

**Decided 2026-10-23 (on the developer's delegation):** 1: the table is approved, and level 5 steps a player up to 6 by the ordinary two-smooth-rounds rule. 2: school 1–6, plain range; pre-K stays 1–2. 3: the locked blue control lane. Q4 is unblocked.

1. **Accounting (inquiry decision 1).** Approve the table above:
   - misses only for unfair Checks and wrong cards;
   - one hint per question for setup help, and one for reading help;
   - nudges, guesses and same-height rolls free;
   - zero-miss reading counts as smooth, although two cards can be guessed (about 75% of guessed rounds have at most one miss). Decide whether level 5 alone may step a player up to 6, or whether 6's own Checks are the real gate.
2. **Window (inquiry decision 2).** School 1–6, plain range; pre-K stays 1–2.
3. **Level-6 lane policy.** **Recommended:** a locked blue control lane. The alternative is both lanes editable with any fair pair accepted, which needs a two-lane repair solver and a level-4-style reset. Only the recommended policy is specified here; choosing the other reopens this packet's level-6 sections.

Nothing else blocks Q4. Q2 must land first.
