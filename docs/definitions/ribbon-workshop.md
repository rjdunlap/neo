# Ribbon Workshop, levels 1–3 (definition)

Defined 2026-10-21 as slice **R1** of the [fractions study](../deep-dives/subjects/fractions.md#build-slices-in-order), from its [proposed ladder](../deep-dives/subjects/fractions.md#first-games-proposed-ladder-ribbon-workshop), [experience notes](../deep-dives/subjects/fractions.md#experience-and-presentation) and [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#fractions-recommendations). **Built 2026-10-22** as slice R2 on branch `claude/ribbon-workshop`: new game `ribbon-workshop`, levels 1–3, `school` only, in Counting Cove as its twelfth game ([build note](../archive/COMPLETED-2026-10-09.md#ribbon-workshop-levels-1-3-fractions-r2-2026-10-22)). The sections below stay as the build's specification. Every [open decision](#open-decisions) has a default the build uses. The study's later math-educator review covers Whole Switch, Window Mosaic and the division packet. It does not gate these three levels, which use only halves and quarters of one declared whole.

**Fun action and purpose:** a gift waits on the workbench, and its tag asks for a ribbon of a certain length. A spool above the bench shows **one whole**. She taps ribbon pieces in the tray, and each one unrolls onto the bench end to end. From level 2 she can snip a half into two quarters with the scissors. When the ribbon is the right length she taps the bow. The pieces join into one ribbon and tie around the gift. The learning goal is **fractions as lengths of one declared whole, and equivalence by composing them**: two halves or four quarters make a whole, two quarters are as long as a half, and three quarters can be a half and a quarter (CCSS 3.NF.A.1 and 3.NF.A.3a–c, through lengths; the [study's anchors](../deep-dives/subjects/fractions.md#anchors-and-evidence-limits)). Every way that makes the length is accepted, so each round shows that one amount has several names.

## References

No new source was opened for this definition. The study's [similar-games table](../deep-dives/subjects/fractions.md#similar-games-and-tools) applies. From it the build takes these ideas: the mathematical action changes the scene (Slice Fractions), a same-size whole stays visible as the reference (Polypad fraction bars), and an exchange keeps its length (MLC Fractions). It rejects free cutting, precision slicing, locked progression and tiny pieces.

## Overlap

Checked against `origin/main` at `47796e46` (GAMES entries, `src/content/lands.ts`, the games' `index.ts`).

| Game | What it already owns | Why Ribbon Workshop is different |
| --- | --- | --- |
| Inchworm Measure (Tinker Lab, pre-K–school) | Measuring an object in whole worm units, then reading a ruler | Its units are always whole and the same size. Ribbon Workshop's units are fractions of a declared whole, mixed in one build, and exchanged. Nothing is measured; a length is composed |
| Pet Kitchen (Counting Cove, toddler–school) | Cutting food into equal shares for friends; a named fraction of one sandwich; halving recipes | Pet Kitchen partitions one object to share it. Ribbon Workshop joins pieces from many objects into one length and accepts several compositions of the same amount. No friends are served and no cutting is chosen by position |
| Fill and Dump | Pour marks at a half, a quarter and three quarters | That is a level on a container. Ribbon Workshop needs no liquid and adds composition |
| Memory Match level 11 | Naming half, quarter and three-quarter pictures | Recognition only, with no construction |
| Frog Hop | The number line (Fraction Landings, R3, belongs there) | Ribbon Workshop has no positions, only lengths from 0 |

**Identity default: a new game.** Composing one length from mixed unit fractions, with an exchange that keeps the length, is the action. No existing game has it.

## The model (`logic.ts`)

- A level has `ticks`: the number of equal ticks in one whole. Levels 1–3 use 4, so a half is 2 ticks and a quarter is 1. Later rungs choose their own count (12 for sixths and thirds), and all lengths are integers. Nothing is compared in pixels.
- A **gift case** is `{ target, tray }`. `target` is an integer number of ticks. `tray` is a multiset of piece sizes in ticks (2 = half, 1 = quarter).
- **State:** the tray as an ordered list of pieces (with stable piece IDs for the ghost finger and undo), the bench as an ordered list of placed pieces, and the undo stack.
- **Actions:** `place(pieceId)` moves a tray piece to the end of the bench. `return(pieceId)` moves a placed piece back to the end of the tray. `snip(pieceId)` replaces a tray half with two quarters in the same tray position, so the row keeps its width. It is available from level 2 and only on a tray half. `undo()` reverses the last place, return or snip. `check()` compares the bench's total with `target`.
- **Bench capacity** is 6 ticks (one and a half wholes). A place that would pass it is refused with a shake and the "no more room" line. That is not a miss. Its only purpose is to keep the bench on screen.
- **Equality** is `sum(bench) === target`, independent of order. Every stock-feasible composition is accepted. The voice names the composition from its multiset (see [voice](#voice)).
- **Solver:** a breadth-first search over states reachable by place, return and snip, bounded by the tray's size. It gives the shortest action list to a state whose total equals the target. It prefers paths without returns, then the fewest actions, then tray order. `hintAction(state)` is the first action of that path. From an overfull bench it is always a return, because no addition can help.

## Levels

Three levels, all `school`. Each round is **two gifts** and earns one sticker. A round picks two different cases from the level's pool with the seeded RNG; the level-2 and level-3 snip gift is always the second. Seeds also vary the tray order and the ribbon colours. Colour is decoration only.

| Level | Name | Gift cases (target ← tray) | What it adds |
| --- | --- | --- | --- |
| 1 | *A whole ribbon* | whole ← {½, ½, ¼, ¼, ¼, ¼}; whole ← {½, ¼, ¼, ¼, ¼}; whole ← {½, ½, ¼, ¼} | Compose one whole three ways: ½+½, ½+¼+¼, ¼+¼+¼+¼. No scissors yet |
| 2 | *Snip a half* | gift 1: half ← {½, ¼, ¼}, half ← {¼, ¼, ¼}, half ← {½, ¼, ¼, ¼}; gift 2: quarter ← {½, ½} | Two quarters are as long as a half. The scissors appear, and gift 2 cannot be made without a snip |
| 3 | *Three quarters* | gift 1: ¾ ← {½, ¼, ¼, ¼}, ¾ ← {½, ½, ¼}, ¾ ← {¼, ¼, ¼, ¼}; gift 2: ¾ ← {½, ½} | ¾ as ½+¼ or ¼+¼+¼. For gift 2 the tempting wrong answer is ½+½ (one whole); the fix is to snip the second half and use one quarter |

`school` range `{ min: 1, max: 3 }`. Not offered to `prek`; see [decision 2](#open-decisions).

**Changes from the study's proposed IDs.** These are written down so later packets do not go stale.

- The study numbered the creative preschool entry 1 and launched at 2–4. This packet registers the assessed levels as **1–3** so the first build has no gap. Study 2→1, 3→2, 4→3. A creative or pre-K entry later gets the next free ID and an `order`/`entryLevels` that puts it first. Existing IDs are never renumbered.
- The later rungs become: Three halves 4, Five sixths 5, Whole Switch 6 (the study's R4 "7"), Ribbon Cases 7 (the study's R5 "8"). Each needs its own definition.
- **Level 2's second gift asks for a quarter, not a half.** In the study's level 3 (make a half, with an exchange), the exchange is never needed while a half is in the tray, so no rule test could show it is taught. Here gift 1 still asks for a half: one case has only quarters, so "two quarters make a half" must be built. Gift 2 then requires the snip.

### First rounds

- **Level 1, first gift:** the tag shows a whole. The spool above shows the whole length. The dashed outline on the bench is exactly that long, with the gift at its end. Tapping ½ then ½ fills the outline, and the bow ties: "Two halves make one whole!"
- **Level 3, second gift:** the tray holds two halves. Placing both overfills past the gift. Check is a miss: "Too long. See the extra bit past the gift?", and the extra quarter flashes. Tap the second half on the bench to return it, tap the scissors, then that half. Place one of its quarters and check.

## Screen and controls

The design area is 1024×768 and the view expands the spare dimension, so the width is always at least 1024. One whole is drawn **560 logical units** long at every view size. A half is 280 and a quarter is 140; bench capacity reaches 840.

- **Request (top, centre-left):** the gift's tag shows the target as a short ribbon picture on a mini spool (a whole, a half, a quarter or three quarters of it) and its written fraction (`1`, `½`, `¼`, `¾`). Tapping the tag repeats the instruction (`ctx.instruct`).
- **Spool (reference whole):** a 560-unit striped bar labelled "1 whole", with end caps. It starts at the bench's left edge, so the two line up.
- **Bench:** the build rail, starting at x = 100. The target outline is dashed, with the gift sitting at its end. Placed pieces sit end to end with a seam mark at each join; a half has no inner mark. **The hit area of each placed piece is its full length × 120 units tall.** A quarter is 140×120. Tapping one returns it.
- **Tray (bottom):** rows of piece cards, drawn at true length (half 280, quarter 140) and 110 tall, with `½`/`¼` written on the card. Each row holds at most four quarters' length (560). A row starts at x ≥ 170 and stays above the pet's bottom-left square, which matches `spread(n, 150, …)` practice. At most six pieces means at most two rows. A card's hit area is its drawn rectangle, and the smallest is 140×110.
- **Buttons (right column, each at least 120×120):** the **bow** (Check), the **scissors** (from level 2), and **undo**. They sit below the shell's top corner and centre controls.
- **Portrait:** the same horizontal geometry, because the width stays at least 1024. The extra height goes between the bench and the tray, and the tray rows move up from the bottom edge to the pet's clearance line.

**Input:** ordinary taps through `onTap`, with touch-down feedback: a card brightens and its end curls; a bench piece lifts. There is no drag. The study's "tap a card, then its join bay" is shortened to **one tap places at the bench's end**, because the end is the only place a piece can join. The bay still pulses where the piece lands. The scissors is a **mode**. A tap turns it on: the scissors glow, the tray halves wiggle, and "Tap a half to snip it." A tap on a tray half snips it and turns the mode off. Any other tap, a second scissors tap, `pointercancel` (listened on `window` capture and removed in `destroy`), or leaving the screen turns it off without acting. A tap on a quarter while snipping says "A quarter stays a quarter here" and turns the mode off.

**Inherited geometry rule for later rungs:** a hit area never drops below 100 units on a side. When a later rung would draw a piece shorter than that (a sixth of 560 is 93), its definition must keep the card at a 100-unit minimum and give the bench a separate full-height return row. The drawn length stays exact. R4 and R5 re-prove this; this packet only fixes the rule.

## Accounting, help and finishing

- **Free:** placing, returning, snipping, undo, tapping the tag, a refused overfull place, and Check with an empty bench ("Put a piece on first"). None of these counts.
- **Miss:** Check with a non-empty bench whose total differs from the target counts one miss for that gift. Too short flashes the gap between the ribbon's end and the gift. Too long flashes the part past the gift. The spoken line names the direction, not the missing amount.
- **Help:** after the second miss on a gift, one persistent glow appears on `hintAction`'s target (a tray card, the scissors, a bench piece to return, or the bow when the bench is already right) and counts **one hint**. It moves with the solver as she acts and never recharges on that gift. The pause sheet's **Show a hint** (`askForHint`) shows the same glow and counts one hint, unless the glow is already up.
- **Finish:** each gift completes when Check matches. The pieces fuse, the ribbon ties a bow round the gift, the composition line plays, and a pentatonic run sounds (`src/audio/notes.ts`). After the second gift the game calls `ctx.finish({ misses, hints })` with the round's totals. Supported completion earns the same sticker. There is no timer, and no score other than misses and hints.
- **Adaptation:** the shell's ordinary rule applies, within `school` 1–3.
- **Restart (`restart`):** puts the current gift's tray and bench back to their start. Misses and hints already counted stay.

## Rule tests (`logic.test.ts`)

1. Every case at every level is solvable from its start, and the solver's path ends on an exact match.
2. The accepted multisets for each case equal a brute-force enumeration of the tray's sub-multisets (with snips from level 2) that sum to the target. Level 1's three whole cases accept exactly ½+½, ½+¼+¼ and ¼+¼+¼+¼, as far as each tray allows.
3. **The snip is taught:** level 2's and level 3's second gift has no solution without a snip. Level 2 has a gift-1 case with no half in the tray.
4. A snip keeps the tray's total ticks and its position, and `undo` after any action sequence restores the exact earlier state (tray order, bench order, piece IDs).
5. Equality does not depend on bench order.
6. From every state reachable from every case's start (enumerated; the trays are small), `hintAction` lowers the solver distance by exactly one. From any overfull state it is a return.
7. A place past capacity is refused and leaves the state unchanged.
8. Seeded rounds: each picks two different cases, the snip gift is second at levels 2–3, and seeds 0–199 all produce valid rounds.
9. Accounting: an empty Check counts nothing, a non-empty wrong Check counts one miss, the automatic glow counts once per gift, and a request while the glow is up counts nothing.
10. The composition line for each accepted multiset exists in `voice-script.ts`.

## Ghost finger, how-to card, voice and registration

- **Ghost finger (`autotouch`, `touchDemo`):** it follows `hintAction` from the current state, tapping a tray card, the scissors and then the half, a bench piece to return, and the bow. It finishes a level-3 snip gift unaided. One gift fills the card's demonstration window at her current level.
- **How-to card (`src/content/howto.ts`):** goal: "Make a ribbon as long as the gift's tag asks, using halves and quarters of the whole." Steps: "Tap a piece and it joins the ribbon." "Tap a piece on the ribbon to take it back." From level 2 to 3: "Tap the scissors, then a half, to snip it into two quarters." "Tap the bow to check." Finish: "Two gifts, one sticker." A note says any way that makes the length counts.
- **Co-play:** the grown-up asks for a length ("make me three quarters") and she builds it. **Off-screen:** fold a paper strip in half and in half again, cut the pieces, and lay them against a whole strip.
- **Registration:** ID `ribbon-workshop`, name "Ribbon Workshop", region `counting-cove`, bands `['school']`, a `BandLevels` table `{ school: { min: 1, max: 3 } }`, and `describeLevel` from the level table above. Music is an ordinary island style, not silenced. The hub icon is a ribbon spool. The sticker art is a gift with a bow, its ribbon colour seeded. Land: see [decision 3](#open-decisions). The browser case is in the [check tier](#check-tier).

### Voice

These lines go in `src/content/voice-script.ts`, under `ribbon.*`.

| ID | Line |
| --- | --- |
| `game.ribbon-workshop` | Ribbon Workshop |
| `ribbon.ask.whole` / `.half` / `.quarter` / `.threeQuarters` | Make a ribbon one whole long for this gift. (…a half…, …a quarter…, …three quarters…) Tap pieces, then tap the bow. |
| `ribbon.piece.half` / `.quarter` | A half. / A quarter. (said when a piece is placed) |
| `ribbon.short` | Not long enough yet. See the gap? |
| `ribbon.long` | Too long. See the extra bit past the gift? |
| `ribbon.empty` | Put a piece on first. |
| `ribbon.full` | No more room on the bench. |
| `ribbon.snip.on` | Tap a half to snip it. |
| `ribbon.snip.done` | Two quarters, just as long as one half! |
| `ribbon.snip.none` | No halves to snip. |
| `ribbon.snip.quarter` | A quarter stays a quarter here. |
| `ribbon.hint` | Try this one. |
| `ribbon.next` | One more gift! |
| `ribbon.made.hh` / `.hqq` / `.qqqq` | Two halves make one whole! / A half and two quarters make one whole! / Four quarters make one whole! |
| `ribbon.made.h` / `.qq` / `.q` | One half! / Two quarters make a half! / One quarter! |
| `ribbon.made.hq` / `.qqq` | A half and a quarter make three quarters! / Three quarters! |

## Check tier

The R2 build is **new game / new interaction**: typecheck, unit tests (this game's rules plus the registry, lands, how-to and voice tests), and `npm run build`, because the registry and lands are shared. Then one game-specific browser suite (`BROWSER_SUITE=ribbon`, a new case in `scripts/browser-check.mjs` with a README row): level 1 with one wrong Check, a second wrong Check that brings the hint glow, then both gifts; and level 3 through the snip gift. Take one portrait screenshot of level 3, then `BROWSER_SUITE=fingerdemo FINGER_ONLY=ribbon-workshop` (first and last level) and `BROWSER_SUITE=smoke SMOKE_ONLY=ribbon-workshop`. No `world`, couch or offline suite. iPad touch, device speech and a child's response stay open in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

### Expected files

`src/games/ribbon-workshop/{index.ts, logic.ts, logic.test.ts}`, `src/games/registry.ts`, `src/content/lands.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, `scripts/browser-check.mjs`; at closeout README, GAMES, READY, this packet's status line, the fractions study, VERIFICATION and DEVICE-CHECKS.

## Open decisions

Each has a default the build uses. None waits on the developer before R2.

**Decided 2026-10-23 (on the developer's delegation):** the defaults stand: a new game, not a Pet Kitchen mode; `school` 1–3 only, with no pre-K entry now (whether a younger child manages level 1 is a person check, not a gate); Counting Cove if the lands test passes, else Rainbow Meadow, never Tinker Lab; `½` and `¼` written and spoken; the scissors stay a mode.

1. **Identity.** Default: a new game, per [overlap](#overlap). The alternative is a Pet Kitchen mode, rejected because joining many pieces into one length is not sharing one food.
2. **Bands.** Default: `school` 1–3 only, which is the study's lean. A `prek` entry (level 1 alone, or a creative "any ribbon" round with no Check) waits on watching a child play level 1. It would be appended with a new ID and `order`.
3. **Land.** Default: **Counting Cove**, its twelfth game, if the lands layout test passes at every band and view. If it returns null there, use **Rainbow Meadow** (eleven games today). The region stays `counting-cove`. Never Tinker Lab, which already holds twelve. Never shrink a target.
4. **Written fractions.** Default: `½` and `¼` on the cards and the tag at school, with the spoken name on every place. The alternative is pictures only, for a later pre-K entry.
5. **Snip as a mode.** Default as specified. The alternative is a scissors button that snips the last tray half, which is modeless but leaves her no choice of piece. Choose it only if the browser play shows the mode being lost.
6. **Later rungs.** Three halves (4), Five sixths (5), Whole Switch (6) and Ribbon Cases (7) each need their own definition, R4/R5 in the study, with the math-educator review the study names before Whole Switch ships.
