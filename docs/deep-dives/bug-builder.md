# Bug Builder deep dive

*ID `bug-builder` · bands toddler, preschool, pre-K, school · levels 1–7 on 2026-10-14 · session `claude/bug-builder-deep-dive` ([PR #296](https://github.com/rjdunlap/neo/pull/296))*

## The game today

She drags a reusable stamp (a colored shape) from a tray onto spots on a code-drawn bug until the bug matches. The learning is visual matching on two attributes (shape and color), copying from a model by position, and mirror symmetry across a center line. Sources read: [`index.ts`](../../src/games/bug-builder/index.ts), [`logic.ts`](../../src/games/bug-builder/logic.ts), [`art.ts`](../../src/games/bug-builder/art.ts), [`logic.test.ts`](../../src/games/bug-builder/logic.test.ts), [GAMES.md](../GAMES.md#bug-builder), the how-to card (`src/content/howto.ts`) and voice lines `bug.*`. It has no couch entry, no journal entry and no picnic step.

Band windows (`levels`): toddler 1–2, preschool 2–5, pre-K 4–7, school 6–7. Lap is not served.

| Level | Plan (`BUG_PLANS`) | Bands | Spots · tray stamps | What she decides |
| --- | --- | --- | --- | --- |
| 1 | Guided: decorate two spots | T | 2 · 2 | Which of two stamps fits the faint ghost in each spot |
| 2 | Guided: match four outlines | T, P | 4 · 3 | The same, with four spots and three stamps |
| 3 | Copy: four spots from a model | P | 4 · 3 | Read a small model bug beside the big one; put the same stamp in the same place |
| 4 | Copy: six spots | P, K | 6 · 4 | The same with six spots |
| 5 | Mirror: two spots onto the other wing | P, K | 2 (one per side) · 3 | The model is the left wing; put its twin across the dashed line on the right |
| 6 | Mirror: three spots | K, S | 3 · 4 | The same with three rows |
| 7 | Mirror: six spots, shape and color | K, S | 6 · 6 | Two columns on each wing, so the near and far spots must each cross to their own place; repeated shapes (two circles, two squares) force her to match both attributes |

### How it plays, from the source

- A stamp dropped on an empty spot with the wrong token is a miss (`slot.wrong++`), says `bug.wrong`, and on the **second wrong drop on the same spot** says `bug.hint` ("Try the {color} {shape} in the glowing spot") and glows that spot and its tray stamp. That is one hint per spot, so a round can count several hints. A drop on open ground, or a filled spot, does nothing and is not a miss.
- A right stamp fills the spot permanently (no undo needed, since a wrong stamp never stays), rings a pentatonic bell, and the pet cheers. The last spot says `bug.done`, wobbles the bug, and finishes after 1.2 s.
- `bugPuzzle` picks `plan.colors` tokens as the **first N entries** of `BUG_TOKENS` (shuffled) and deals them to spots in a fixed cycle (`palette[spots.length % palette.length]`). Mirror targets are the model's spots reflected across the vertical axis; copy targets are the model's own positions.
- The ghost finger (`autotouch` → `nextStamp`) carries the next needed stamp to its spot. A rule test runs it over 50 seeds of every plan, and another checks that spots are further apart than twice `SLOT_REACH`.
- Targets are 100+ units (tray tiles 102, spots drawn at radius 50 with a drop reach of 57). The copy model is drawn at 0.62 scale, which is only for looking.

### Known gaps

- **Level 1 and 2 never vary in content.** Tokens are the first 2–3 entries of the pool, so level 1 is always the blue circle and the yellow triangle, only in shuffled places; level 7 is always all six tokens with each used once. The six-token pool (`circle`, `triangle`, `square`, `heart` in four colors plus two repeats) is smaller than the shape set (`star` and `hexagon` exist in `src/art/shapes.ts` and are unused here).
- **The pattern is fixed per level.** Because spots are dealt in a fixed cycle, level 4 is always "a b c d a b" over some permutation of four tokens. Copy mode can also deal a left wing identical to a right wing, so the mirror idea and the copy idea are not told apart.
- **A mirror miss does not point at the partner.** The hint names the color and shape but not "look across the line"; the model spot it copies is not highlighted. The `copy` hint likewise does not light the matching spot on the model.
- **The mirror axis is always vertical, the model is always on the left, and mirror rows always share y.** Nothing asks for a different line, a diagonal reflection, or a spot at a different height, so the level 7 skill is "find the same row on the other side".
- **The ceiling is low for school.** School plays only 6–7, both mirror with a fixed dashed line. Preschool reaching mirror at level 5 (age 3–4) is an open person check, since mirror matching of abstract pairs is chance-level until about 8 to 9 in the research below, though a visible line and a same-row twin is a much easier task than that study's.
- **No creative or free finish.** Every round has exactly one answer. There is no "decorate my own bug", and nothing in the treehouse keeps a bug.
- **No counting use.** The spots are always as many as the model; she never decides how many.
- **No lap entry** and no couch entry.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Millie's Math House, Build-a-Bug](https://mathequity.terc.edu/gw/html/Millie.html) (Edmark, ages 2–5; [review](https://mathequity.terc.edu/gw/html/MillieReview.html)) | Counting software | Free play adds eyes, ears, spots, legs, tails and antennae to a body of her own design; a question mode shows a plan ("3 eyes and 8 legs") and she picks the number and part, with unlimited tries and no penalty | The count plan with a body she can add to and take away from; a free-build mode next to the checked one | The TERC reviewer noted a four-year-old's valid part-whole strategy was not accepted. A count mode here accepts any arrangement, not one picture |
| [PhET Area Builder](https://phet.colorado.edu/en/simulations/area-builder) (Univ. of Colorado) | Simulation and game | Build a shape of a given area or perimeter from unit blocks; "find the area"; scale up to compare | Area and perimeter on a grid is a later school mode (see IDEAS) and not this game's mirror idea | Scoring and levels with a star count; the grid-and-number layer is a different game's worth of work |
| [Symmetry School (PixelSoup)](https://teachnet.ie/symmetry-school/) | Classroom iPad app | Reflective and rotational symmetry across three difficulty levels, plus free play; mirror mode drags matching objects onto grid tiles across a line | Free play beside the checked levels; rotational symmetry as a later mode | Priced app structure; grades 3–6 focus |
| [AxisMaster](https://apps.apple.com/us/app/axismaster/id6756833353) | Phone app | Four modes: mirror drawing, find the axis, is it symmetric, count the axes; grids from 6×6 to 12×12 | The ladder of questions *about* a line (draw across it, find it, count them) is what a school-age arc needs | Difficulty names such as "extreme" and a grid up to 12×12 |
| [Symmetry IWB](https://www.teacherled.com/2015/01/08/symmetry-counters/) | Whiteboard tool | Place counters across a mirror line that can be vertical, horizontal or diagonal | The line itself changes, so the child must find where a spot lands across it | No answer feedback; it is a teaching board |
| Folded-paper butterfly or "blot" painting (classic classroom craft) | Physical play | Paint one side, fold, press, and the other side appears | Folding is the most natural explanation of a mirror, so the animation of a wing folding closed explains the answer | Nothing to leave out; it is the off-screen activity already on the game |
| Pattern blocks, pegboards and mosaic pegs | Physical play | Copy a picture on a board, then a picture in a different orientation | Copy by position leads to copy by rule | The loose pieces |

Developmental and standards references:

- Young children matched symmetric shape pairs no better than chance until about 8 to 9 years of age ([Shao and Gentner, 2019](https://groups.psych.northwestern.edu/gentner/papers/ShaoGentner_2019-Symmetry.pdf)), though a second study there found young children could make symmetric relational matches when the choices invited informative comparison. Children 3 to 6 could tell which half of a screen a face was on, except near the midline ([Ortmann and Schutte, 2010](https://groups.psych.northwestern.edu/gentner/papers/ShaoGentner_2019-Symmetry.pdf), cited there). Reading: a visible fold line and a same-row twin is a localization task, which small children can do; saying *why* two bugs match is a symmetry relation, which comes later. The ladder asks for the first and only names the second.
- Counting standards for a count mode: Common Core [K.CC.B.4 and K.CC.B.5](https://www.thecorestandards.org/Math/Content/K/CC/) (one-to-one counting, and counting out a given number up to 20). Line symmetry is [4.G.A.3](https://www.thecorestandards.org/Math/Content/4/G/A/3/) (draw lines of symmetry), which is the school-end of this game's arc; area on a grid is [3.MD.C](https://www.thecorestandards.org/Math/Content/3/MD/C/).
- Not verified in this session: any claim about the standards' exact wording beyond the section names above. Check the linked page before the card or a voice line quotes one.

## What makes sense here

Bug Builder's three ideas are separate skills in one body: *match* (levels 1–2), *copy by position* (3–4) and *mirror* (5–7). The strongest next growth keeps the bug and adds a fourth decision that is not matching:

1. **Fix content before adding levels.** Draw tokens from a larger pool (six shapes in the palette colors) so level 1 does not always show a blue circle and a yellow triangle, and so a round's pattern differs, not just its order. This is the cheapest and fixes the most replay.
2. **Make a mistake lead somewhere.** A mirror miss should light the model spot that the target answers to; a copy miss should light the same place on the model. The hint then teaches the rule rather than naming the stamp.
3. **Add a count mode, from Build-a-Bug.** "A bug with three spots" (any arrangement) is a different decision from matching and opens the game to a younger band and to the pre-K counting audience. Taking a stamp off the bug is never a miss.
4. **Add a predicted fold for the school band.** Show the left wing, ask which of three finished bugs the fold will make, then fold the wing over and show it. The prediction is unscored (as in Sink or Float); the fold explains the answer. This is IDEAS' *Fold a Friend*, kept to its first step.
5. **Add revision.** A finished bug with one wing spot wrong: find it and fix it. This is "older puzzles can require revision, with undo and an explanation".
6. **Let her make one.** A free-decorate bug, with a gentle finish, for the treehouse picture slots; no answer to check.

The two ideas the notebook parks stay parked: crease choice (which line makes the bug match) belongs near age 9, and area and perimeter belong to a different game's mode.

The arc: toddler matches a ghost; preschool copies and starts counting; pre-K copies, mirrors and counts with a color or shape rule; school predicts the fold, repairs a wing and later chooses a line.

## Experience and presentation

- **First unsupported action.** Drag a stamp from the tray onto a spot. The glowing ghost at levels 1–2 is the support that exists today; the lap entry below removes the need for even that, a single big stamp anywhere is right.
- **Why it feels good.** The stamp thumps down with a bell on a pentatonic step, the spot wiggles, and the bug wobbles at the end. Make the wobble a wing-flutter: the two wings fold up and out once together, so a finished mirror bug is visibly symmetric.
- **Touch-down feedback and consequence.** The tick on pick-up exists. A wrong drop shows the stamp sliding back to the tray and (new) the *partner* spot pulsing, so the consequence of "wrong" is "look there", not "no".
- **Art or feel example (code-drawn).** In mirror mode the dashed center line becomes a fold: when the bug is finished, `board` scales on x from 1 to -1 for the left wing in 0.5 s (a `Container` flip with `scale.x`), the spots meet their twins, and the bug opens again. The model wing stays on screen as a faint copy. No new assets.
- **Replay variety without changing the rule.** The larger token pool; four or five body styles from `bugBody` parameters (ladybird, beetle, butterfly, dragonfly) that change only wing shape and colors; a random model side in mirror mode (left or right wing); spot heights that differ per row.
- **Reasoning versus reading, memory and motor.** Nothing is read: the voice line carries every instruction and the hint names a color and shape. Copy mode puts the model in view throughout, so there is no memory load. Motor precision is the drop on a 57-unit reach with spots 116 apart.
- **Supported ending and replay.** A hint after two wrong drops at one spot already exists. Completion with help ends the round normally and gives a sticker. "Make another" offers a new body.
- **Co-play.** Level 1–4: a grown-up reads the model aloud ("the red heart is at the top") while she places it. A mirror level suits two seats with one wing each (one places the left, the other the right) only if the seed shows both sides, which is a slice-sized couch decision, not a requirement.
- **Needs a person or device.** Whether a three-year-old can do mirror level 5 at all; whether the predicted fold animation explains the answer to a six-year-old without words; whether the count mode's over-count message feels like a correction; stamp reach on a real iPad.

## Proposed ladder

### Fresh content inside existing levels

- A shape and color pool of at least 12 tokens (circle, square, triangle, heart, star, hexagon in the palette colors), with each plan drawing `plan.colors` of them by seed. Tests: tokens in a plan are distinct; shape *and* color both vary at levels that need both (level 7 keeps repeated shapes and colors); the pool has enough tokens for every plan. Existing token indexes 0–5 stay, so no saved data depends on them. Cost: small (logic and one test); the art already draws any token.
- Body styles and the random model side (see above). No rule change.
- A mirror/copy distinction test: a copy board must not be symmetric by accident (left and right differ), and a mirror board's twin positions are exact reflections.
- A hint upgrade: the model spot glows with the target on any miss that reaches the hint; `bug.hint` keeps naming color and shape, and a second line says "Look across the line" in mirror mode. Cost: one voice line and a glow.
- Fix a small drift in the accounting while there: one hint per spot means a round can count several hints; decide whether a round counts one hint only (the shell treats two hints as struggling).

### New levels on top

IDs are appended after 7 and never renumbered; the band column is the window each level should fall in once the `levels` table and `order` are extended.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | Count the spots | P, K | "Give the bug three spots!" A sign shows "3" and three dots; the bug is bare, with six open places. The count is said as each stamp lands | How many, and where; any stamp, any place | Stamping a fourth is not a miss: "That's four. We wanted three. Tap one to take it off." Tapping a stamp lifts it. Two over-counts glow the extra stamp | Any arrangement with exactly the sign's count finishes; the bot's count equals the sign; counts fit the open places | M. Count sign (Bubble Pop's sign pattern), a lift-off tap, six open places per body, 6–8 voice lines, how-to, bot |
| 9 | Count a kind | K | "Two red spots and one heart." A sign with two parts (a color and a count) | Choose by color or shape, and how many | Wrong kind names what was put ("That's a blue circle; we wanted a red spot"); a lift-off tap; hint glows a stamp in the tray | Every sign has at least one stamp in the tray that satisfies it; a finished bug satisfies the sign exactly; two attributes never contradict | M. Reuses 8; a sign of 2 parts is new |
| 10 | Fold a friend | K, S | The left wing has three spots, the right is hidden under a fold; three finished bugs show choices (right mirror, same copy slid across, colors swapped) | Which finished bug the fold will make | The prediction is unscored. A fold animation shows the true answer and the pet says why ("each spot lands across the line"). No miss, no hint; the round ends after the fold | Exactly one of the three is the reflection; the other two are plausible but different (a translation and a swapped pair); the reflection is not always in the same position | M–L. The fold animation, three choice boards, 5–6 lines, how-to; reuses the mirror geometry in `logic.ts` |
| 11 | Mend the wing | K, S | A finished bug with one spot wrong on the right wing (the wrong color, the wrong shape, or a missing spot) | Which spot differs from its twin, and what it should be | Tapping the wrong spot is a gentle boing and a look at the twin; two taps glow the wrong spot. Replacing uses the same tray | Exactly one spot is wrong per board; the repair makes it symmetric; a hint always points at the true error; a bot repairs it | M. A new tap-to-change interaction, 6 lines, how-to, bot. |
| 12 | Which fold? (sketch) | S | A bug whose spots are in a row, with a vertical and a horizontal fold line both shown; the bug matches only one | Which line makes it match (the crease choice) | Unscored prediction first, then fold; tests as 10 | A board has exactly one line that gives a match; the other line never does by accident | L. The horizontal axis is new geometry; IDEAS places this near age 9, so confirm the fit with the developer |

### Younger-band openings

| Level | Name | Band | First round | What she decides | Mistakes and hints | A rule test asserts | Cost |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 13 | Dab a spot | L | One big stamp in the tray and a bug with one big open spot; "Put the spot on the bug!" Any drop on the bug is right and rings a bell | Nothing: the action is the toy | None; a drop anywhere on the bug lands, and one more makes two spots. The round ends after the third dab | A drop anywhere in the body is accepted; the round finishes after three; the stamp is at least 100 units | S–M. One level, one voice line, how-to, bot. Easy-entry ID: needs `entryLevels` and `order` so a birthday lands on it, not on level 1 |

Toddler already starts at level 1 (two spots, a ghost), which is a fine first matching step once lap exists.

### Easier entries and levels between existing ones

- Level 13 above is the one appended easy entry. It needs `order` for lap and `entryLevels: [13]` so a newly one-year-old lands on it. The existing 1–7 are not renumbered.
- A one-spot match (a single ghost and two stamps) between 13 and 1 is possible but the first level's two spots are already close to it; leave it unless the toddler observation says level 1 is too hard.
- A "free dab" mode (the level 13 rule) at later bands is the creative finish below.

### Left out on purpose

- Timers, speed, a "number of bugs finished" count, stars, a perfect-bug bonus, a crying bug.
- Area, perimeter and unit tiling: a later school mode of its own (IDEAS, PhET Area Builder), not bug decoration. The [area, volume and space study](subjects/area-volume-space.md) (2026-10-22) takes it as Meadow Pens and cites level 10 *Fold a friend* as the mirror owner.
- Rotational symmetry, which is Puzzle Pals' territory (turned pieces).
- A mode that grades a free design. Creative bugs have no wrong answer.
- Reading numbers as the only way to say the count: the sign always shows dots beside the numeral.

## Decisions for the developer

1. **Creative bug.** A free-decorate bug (no checked answer) that she can keep in the treehouse as a creation: yes or no. It needs a bounded creation slot kind in `src/content/creations.ts`; recommend yes, as a later slice, with "Make a bug" a mode that has no answer and finishes when she says she is done.
2. **Count mode as part of Bug Builder.** IDEAS says "a counting mode, not a second bug game"; this write-up agrees. Confirm the sign style (dots plus a numeral) and that over-counting is never a miss.
3. **Lap opening.** Whether lap should open Bug Builder at all (level 13). The action is a stamp drop, which is a drag, and lap's drag success is a person check.
4. **School mirror prediction (levels 10–12).** Confirm the predicted fold counts as an unscored prediction, and that level 12's crease choice waits for age 9 as IDEAS says.
5. **Hint accounting.** Whether several hints in one round (one per spot) should count as one hint, so adaptation reads the round as a struggle only when she was.

Add each to [Waiting on the developer](../WAITING-ON-DEVELOPER.md#waiting-on-the-developer) when the roadmap chunk is next edited.

## Build slices, in order

1. **Bigger pool, a fair board and a hint that points (rules; built 2026-10-15, branch `claude/bug-builder-pool-hint`).** The 12-token pool, the distinct-token rule, the copy-not-symmetric rule, and the model/partner glow on a miss. Check tier: typecheck and `logic.test.ts` only; the glow is small visual code, so one filtered play of levels 1 and 7 and one portrait screenshot (existing-game fix tier). Built with a 12-token pool, `pickTokens`, and the twin/model ring on the second miss; the portrait screenshot was not reviewed, and the one-hint-per-round accounting stays per spot (open).
2. **Wing flutter and a fold finish for the mirror levels (feel; built 2026-10-15).** [PR #416](https://github.com/rjdunlap/neo/pull/416), branch `codex/bug-wing-flutter`, worker `01a142ae-a2cb-71e2-98b6-c0937479cdea`, dispatch `bug-flutter-20261016T030732Z`. Paired wings and stamps fold across the center and reopen during the existing finish wait; a faint model wing stays visible. Rules/accounting unchanged. Level-7 filtered play and portrait/fold screenshots passed and were reviewed; [build note](../archive/COMPLETED-2026-10-09.md#bug-builder-paired-wing-finish-2026-10-15).
3. **Count the spots, level 8 (new interaction).** Count sign, lift-off tap, bot, how-to, README and GAMES entries. Check: typecheck, rule tests, one scripted play (first level of the band, one over-count, one hint) and `fingerdemo` at it.
4. **Count a kind, level 9.** Reuses 3. Check: rule tests and one filtered play.
5. **Fold a friend, level 10.** The three-choice prediction, the fold animation and its lines. Check: rule tests, one play and a portrait screenshot.
6. **Mend the wing, level 11.** Tap-to-change interaction, bot, how-to. Check: as for a new interaction.
7. **Dab a spot, level 13 (after the lap decision).** Needs `order` and `entryLevels`; rules test that birthday placement lands on it. Check: rule tests and one play.
8. **Make a bug (after the creative-bug decision).** A free mode that saves to the treehouse on request. Check: save-field tests, one play.
9. **Which fold? (sketch).** Defer until the developer confirms the age fit.

Closing each slice also updates the README row, GAMES.md, the how-to card (with level-scoped steps), and the roadmap.

## What was built in this session

Nothing: a deep dive session is research and ideation only. Only documents changed; links and `git diff --check` ran.
