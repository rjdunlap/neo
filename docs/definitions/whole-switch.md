# Ribbon Workshop, Whole Switch: level 6 (definition)

**Status:** defined, not built. The build is one session, queued in [READY](../READY.md).

Defined 2026-11-17 as slice **R4** of the [fractions study](../deep-dives/subjects/fractions.md#build-slices-in-order), from its [candidates row](../deep-dives/subjects/fractions.md#candidates-and-fit) and [proposed ladder](../deep-dives/subjects/fractions.md#first-games-proposed-ladder-ribbon-workshop) (the study's "7", renumbered to **6** by the [Ribbon Workshop definition](ribbon-workshop.md#levels)). It is one new level of the existing game `ribbon-workshop`, not a new game. Every [open decision](#open-decisions) has a default the build uses.

**Fun action and purpose:** one ribbon lies on the bench and never changes. She unrolls a spool above it, the short one or the long one, and that spool is the whole. Then she picks the name card that says what part of that whole the ribbon is, and taps the bow. The ribbon is a half of the short spool and a quarter of the long spool. The second tag of the round asks her to give the same ribbon its other name, and the only way is to switch the whole. The learning goal is that **a fraction names an amount only against a declared whole**: the same length is ½ of one whole and ¼ of another, and neither name is wrong (CCSS 3.NF.A.3d says comparisons are valid only when two fractions refer to the same whole, and 4.NF.A.2 repeats it; both are on the pages the [study's anchors](../deep-dives/subjects/fractions.md#anchors-and-evidence-limits) opened).

## References and source check

No new source was opened for this definition. The study's [anchors](../deep-dives/subjects/fractions.md#anchors-and-evidence-limits) and [similar-games table](../deep-dives/subjects/fractions.md#similar-games-and-tools) apply. The study asked for a mathematics educator to read the unit language before Whole Switch ships. Under the [October 23 record](../archive/DECISIONS-2026-10-23.md#standing-rules) that review is the building session's source check: before merging, the builder reads every line in the [voice table](#voice) against the opened standard pages and confirms that each spoken fraction names its whole in the same sentence. The wording below was written to that rule and should change only to keep it.

## Overlap

Checked against `origin/main` at `46ddb90f` (GAMES entries, the games' `logic.ts`).

| Game or level | What it already owns | Why Whole Switch is different |
| --- | --- | --- |
| Ribbon Workshop 1–3 | Composing a requested length from halves and quarters of one whole that never changes | Here the amount never changes and the whole does. Nothing is composed, snipped or placed |
| Pet Kitchen 14 and 15 | Different shapes with the same share; one cup made several ways | Both keep one whole and vary the pieces. Neither changes the reference |
| Frog Hop 9–10 | Fractions as positions on a 0–1 and 0–2 line | The unit interval is fixed for the whole round |
| Memory Match 11 | Naming pictured halves and quarters | Recognition of a part of one pictured whole |
| Seesaw Balance, Inchworm Measure | Equal weights; counting whole units | No fraction names and no change of unit |

**Identity:** a level of Ribbon Workshop, as the study recommends. It reuses the bench, the spool as the declared whole, the tag, the bow, undo and the two-tags-one-sticker round.

## The model (`logic.ts`)

All lengths are whole numbers of ticks, and nothing is compared in pixels. This level has its own small state. It does not use levels 1–3's tray, bench pieces or solver.

- **Constants:** `SWITCH_RIBBON = 6` ticks. `SWITCH_WHOLES = [12, 24]`: the short spool and the long spool. `SWITCH_CLAIMS = [1, 2, 3]`: the name cards, counted in quarters (¼, ½, ¾).
- **Truth:** a claim of `q` quarters is true for whole `w` exactly when `SWITCH_RIBBON × 4 === q × w`. With these constants that is `(12, ½)` and `(24, ¼)` and nothing else. ¾ is true for neither whole. No card says ⅓, 1 or 2⁄4, so no other true statement can be made (see [decision 3](#open-decisions)).
- **State:** `{ whole: 0 | 12 | 24, claim: 0 | 1 | 2 | 3, made: 0 | 12 | 24 }`. `0` means not chosen. `made` is the whole of the statement already accepted on tag 1, and `0` during tag 1. An undo stack holds earlier `whole` and `claim` values.
- **Actions:** `setWhole(w)` and `setClaim(q)` replace the current choice. `undo()` restores the choice before the last change. `check()` judges the statement. The ribbon has no action: a tap on it wiggles it and says the ribbon line, and never counts.
- **Tags:** a round is two tags over the same ribbon.
  - **Tag 1, *Name it*:** any true statement is accepted, so both `(12, ½)` and `(24, ¼)` finish it.
  - **Tag 2, *Switch the whole*:** only the true statement with the other whole is accepted. After `(12, ½)` it is `(24, ¼)`, and after `(24, ¼)` it is `(12, ½)`. Tag 2 starts with tag 1's whole and name still showing, so the first useful action is always the switch.
- **Verdicts from `check()`:**

  | Verdict | When | Counts |
  | --- | --- | --- |
  | `empty` | no whole or no name card chosen | nothing |
  | `right` | the statement is true and, on tag 2, uses the other whole | finishes the tag |
  | `same` | tag 2 only: the statement is tag 1's own, still true | nothing |
  | `wrong` | a whole and a name are chosen and the statement is false | one miss |

  A true statement is never called wrong. `same` is true, so it is free: the pet says so and asks for the other whole.
- **Hint:** `hintAction(state)` is the first step of the shortest route to an accepted statement: the spool card of an accepted whole when the current whole is not one (on tag 1 with no whole, the first spool card in the round's seeded order), else that whole's true name card, else the bow.

Every state can be enumerated: three values of `whole`, four of `claim`, three of `made`, 36 in all, 24 of them reachable in play.

## The level

| Level | Name | The frozen case | What it adds |
| --- | --- | --- | --- |
| 6 | *Whole Switch* | Ribbon 6 ticks. Wholes 12 and 24. Name cards ¼, ½, ¾. Tag 1 accepts ½ of the short spool or ¼ of the long spool. Tag 2 accepts the other one | The whole can change while the amount stays. A fraction's name belongs to its whole |

There is one case. The seed varies the ribbon's colour, which spool card is on the left and the order of the name cards, never the quantities. This is a single idea to meet and return to, not a drill, and the definition does not add more wholes to pad it out. An 18-tick whole (the ribbon as a third) is left to a later definition (see [decision 3](#open-decisions)).

**Numbering and bands.** Level IDs 4 (Three halves) and 5 (Five sixths) stay reserved and undefined. Level 6 is registered now with `school: { min: 1, max: 6, order: [1, 2, 3, 6] }`, so it is the top of the school ladder and two smooth rounds at level 3 step up to it. When 4 and 5 are defined they take their places in `order`. Saved levels and pins at 1–3 are untouched, and `LEVEL_IDS` becomes `[1, 2, 3, 6]`. Still `school` only: the study aims this rung at older children and grown-ups, and `school` is where older play lives today. A `grownup` entry is left to the Ribbon Cases definition (R5), which the study charges with settling the older registration.

### First round

The ribbon lies on the bench. The tag shows it with a question mark. "Here is a ribbon. Pick a spool to be the whole. Then pick its name."

1. She taps the short spool card. It unrolls on the rail above the ribbon, starting at the same left edge: "The short spool is the whole."
2. She taps ¼: "A quarter." The sentence strip reads, in pictures, *ribbon = ¼ of the short spool*.
3. She taps the bow. It is a miss. A ghost of the ribbon steps along the whole: "Look. The ribbon fits two times in the short spool." The name card dims back.
4. She taps ½, then the bow: "Yes! Two of these make the short spool. The ribbon is a half of the short spool." A paper tag with ½ and a short-spool picture clips to the rail.
5. Tag 2: "Same ribbon. Give it a different name. Don't change the ribbon. Change the whole."
6. She taps the long spool. The rail grows to twice the length, with the ribbon still where it was: "The long spool is the whole." She taps ¼ and the bow: "Yes! Four of these make the long spool. The ribbon is a quarter of the long spool."
7. Both wholes show, one above the other, each with its tag, and the ribbon under both: "One ribbon, two names. A half of the short spool, and a quarter of the long spool. The ribbon did not change. The whole did." The ribbon ties round the gift and the round finishes.

## Screen and controls

The design area is 1024×768 and the width is always at least 1024. One tick is drawn **30 logical units** long at every view size, so the ribbon is 180, the short whole 360 and the long whole 720. The bench starts at x = 100, so the long whole ends at 820 and clears the right button column.

- **Ribbon (bench):** 180×120, fixed at the bench's left edge, with a pin drawn at each end to show it stays. Its hit area is its drawn rectangle.
- **Whole rail (above the ribbon):** empty and dashed until a spool is chosen. The chosen whole is a striped bar from the same left edge as the ribbon, with end caps and the label "1 whole". It has **no division marks**: marks would give the count away. Marks appear only in the measure animation and stay after it for that tag.
- **Spool cards (bottom left, two):** each 220×130, a wound spool with a tail drawn at its true length ratio (one twice the other). The chosen card stays lit.
- **Name cards (bottom right of the spool cards, three):** each 150×130, written `¼`, `½`, `¾` over a small four-cell bar with one, two or three cells shaded. The bar is a picture of the name, not of either spool. The chosen card stays lit. Both card groups sit above the pet's bottom-left square, as the level 1–3 tray does.
- **Sentence strip (under the tag):** pictures of the current statement: the ribbon, the chosen name card and the chosen spool, with a gap for whatever is not chosen yet. It is not a control.
- **Tag (top, centre-left):** tag 1 shows the ribbon and a question mark. Tag 2 shows the ribbon, tag 1's name crossed by a curved arrow to a question mark. A tap repeats the instruction (`ctx.instruct`).
- **Buttons (right column, each at least 120×120):** the **bow** (Check) and **undo**. The scissors are not shown at level 6.
- **Portrait:** the same horizontal geometry. The extra height goes between the bench and the cards. At the finish the two wholes stack above the ribbon, 70 units each, in either orientation.

**Input:** ordinary taps through `onTap`, with touch-down feedback (a card lifts and brightens). No drag and no mode. Every target is at least 120 units on its short side, which meets the [inherited geometry rule](ribbon-workshop.md#screen-and-controls).

**The measure animation** (on a `wrong` Check, and as the last beat of a `right` one): a translucent copy of the ribbon lifts to the rail and steps along the chosen whole from the left edge, leaving a mark at each step and a soft pentatonic note per step: two steps on the short whole, four on the long. It takes about 1.2 s on scene-owned timing, is skipped by any tap, and is guarded against a destroyed scene.

## Accounting, help and finishing

- **Free:** choosing and changing a spool or a name card, undo, tapping the tag or the ribbon, an `empty` Check, and a `same` Check on tag 2.
- **Miss:** a `wrong` Check counts one miss for that tag. The measure animation shows how many times the ribbon fits in the chosen whole, and the spoken line names that whole and that count. It does not say the fraction's name. This is the study's "a failed Check explains which whole is active".
- **Help:** after the second miss on a tag, one persistent glow appears on `hintAction`'s target and counts **one hint**. It moves as she acts and never recharges on that tag. The pause sheet's **Show a hint** shows the same glow and counts one hint unless the glow is already up.
- **Finish:** each tag completes on `right`. After tag 2 the game calls `ctx.finish({ misses, hints })` with the round's totals. One sticker, also with help. No timer.
- **Restart:** clears the current tag's choices (on tag 2, back to tag 1's statement showing). Misses and hints already counted stay.
- **Adaptation:** the shell's ordinary rule, within the school order.

## Rule tests (`logic.test.ts`)

1. Truth: over every whole and name card, the true statements are exactly `(12, ½)` and `(24, ¼)`; ¾ is true for neither.
2. Tag 1 accepts both true statements. For each, tag 2 accepts exactly the other and returns `same`, not `wrong`, for tag 1's own.
3. No verdict is `wrong` for a true statement, and none is `right` for a false one, over all 36 states.
4. `empty` whenever the whole or the name is missing, on both tags.
5. From every reachable state on both tags, following `hintAction` reaches `right` in at most three steps (spool, name, bow) and each step shortens the route by one. On tag 2 from tag 1's statement, the first step is the other spool card.
6. The ribbon constant is read, never written: no action changes it, and undo after any action sequence restores the exact earlier choices.
7. Accounting: `empty` and `same` count nothing, `wrong` counts one miss, the automatic glow counts once per tag, and a hint request while the glow is up counts nothing.
8. The measure count is `whole / SWITCH_RIBBON` (2 and 4), an integer for both wholes.
9. Seeded rounds 0–199: the quantities never vary, both card orders appear, and levels 1–3 produce the same rounds for a seed as before this level existed.
10. `LEVELS.school.order` is `[1, 2, 3, 6]`, a saved or pinned 1–3 is unchanged by `clampLevel`, and every voice line the level names exists in `voice.ts`.

## Ghost finger, how-to card, voice and registration

- **Ghost finger (`autotouch`, `touchDemo`):** follows `hintAction`: a spool card, its true name card, the bow, then on tag 2 the other spool, its name and the bow. It finishes the round unaided.
- **How-to card (`howto.ts`), level 6 only:** goal: "Say what part of the spool the ribbon is. The ribbon stays the same; you choose the spool." Steps: "Tap a spool to make it the whole." "Tap a name card: a quarter, a half or three quarters." "Tap the bow to check." "Then give the same ribbon its other name by changing the spool." Finish: "Two names, one sticker." Note: "Both names are right. A half of the short spool and a quarter of the long spool are the same ribbon." The existing goal, steps and note become `to: 3`.
- **Co-play:** "Ask {name}: half of what? Then find something that is a half of one thing and a quarter of another." **Off-screen:** cut one strip of paper. Lay it on a strip twice as long, then on one four times as long, and say its name each time.
- **Registration:** `describeLevel(6)`: "Whole Switch: one ribbon is a half of the short spool and a quarter of the long one; choose the whole, then name the part". Skills, bands, land, music, icon and sticker are unchanged. No journal entry.

### Voice

These lines go in `src/games/ribbon-workshop/voice.ts`. Every line that says a fraction names its whole.

| ID | Line |
| --- | --- |
| `ribbon.switch.ask` | Here is a ribbon. Pick a spool to be the whole. Then pick its name. |
| `ribbon.switch.ask2` | Same ribbon. Give it a different name. Don't change the ribbon. Change the whole. |
| `ribbon.switch.whole.short` / `.long` | The short spool is the whole. / The long spool is the whole. |
| `ribbon.switch.name.quarter` / `.half` / `.threeQuarters` | A quarter. / A half. / Three quarters. |
| `ribbon.switch.ribbon` | The ribbon stays just as it is. |
| `ribbon.switch.empty.whole` / `.name` | Pick a spool first. / Pick a name card first. |
| `ribbon.switch.fits.short` / `.long` | Look. The ribbon fits two times in the short spool. / Look. The ribbon fits four times in the long spool. |
| `ribbon.switch.same` | That is true, and you made it already. Now change the whole. |
| `ribbon.switch.made.short` | Yes! Two of these make the short spool. The ribbon is a half of the short spool. |
| `ribbon.switch.made.long` | Yes! Four of these make the long spool. The ribbon is a quarter of the long spool. |
| `ribbon.switch.both` | One ribbon, two names. A half of the short spool, and a quarter of the long spool. The ribbon did not change. The whole did. |

The existing `ribbon.hint` ("Try this one.") is reused for the glow.

## Check tier

The build is a **new interaction on an existing game**: typecheck; unit tests (this game's rule tests plus the registry, how-to and voice tests); one filtered scripted play, `BROWSER_SUITE=ribbon` extended with a level 6 case (a `wrong` Check, a second `wrong` Check that brings the glow, tag 1, a `same` Check on tag 2, then tag 2); one portrait screenshot of the finish with both wholes; and `BROWSER_SUITE=fingerdemo FINGER_ONLY=ribbon-workshop` at level 6. `npm run build` only if a shared file changes. No `world`, couch or offline suite.

### Expected files

`src/games/ribbon-workshop/{logic.ts, logic.test.ts, index.ts, voice.ts, howto.ts}`, the `ribbon` case in `scripts/browser-check.mjs`; at closeout the game page (`npm run game-docs`), this file's status line, the fractions study, STUDY-BACKLOG, READY and a verification entry.

## Open decisions

Each has a default the build uses. None waits on the developer.

1. **Tag 1 is free.** Default: either true statement finishes tag 1 and tag 2 asks for the other, so her first choice is never wrong for being the "other" one. The alternative, a seeded first whole, gives every round the same two tags in a fixed order and removes a real choice.
2. **`same` is free.** Default: checking tag 1's statement again on tag 2 is true, so it is answered and not counted. The alternative counts it as a miss, which would call a true statement wrong.
3. **Three name cards, two wholes.** Default: ¼, ½ and ¾ only, and 12 and 24 only, so exactly two statements are true and ¾ is the one tempting false name (the part of the long spool the ribbon does not cover). A 2⁄4 card (true for the short spool) and an 18-tick whole (the ribbon as a third) are each a later appended level with its own definition, not seeds of this one.
4. **Band.** Default: `school` only, top of the order. A `grownup` entry waits on R5.
5. **No marks before a Check.** Default: the whole is unmarked until a measure animation runs. The alternative, marks from the start, turns the level into counting cells.
6. **Educator review.** Default: the building session's source check of the voice table, per the [October 23 record](../archive/DECISIONS-2026-10-23.md#standing-rules).
