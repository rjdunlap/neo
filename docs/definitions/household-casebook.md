# Attic Finds levels 7–9: Household Casebook (definition)

Defined 2026-11-01 on `claude/define-household-casebook` ([PR #1100](https://github.com/rjdunlap/neo/pull/1100)), slice **H5** of the [everyday-life-long-ago study](../deep-dives/subjects/daily-life-long-ago.md#build-slices-in-order), from steps **5 *Two sources***, **6 *What can we tell?*** and **7 *Mend the exhibit*** of its [proposed ladder](../deep-dives/subjects/daily-life-long-ago.md#first-games-proposed-ladder-attic-finds), its [candidate row](../deep-dives/subjects/daily-life-long-ago.md#candidates-and-overlap-decisions) and the [IDEAS row](../IDEAS.md#candidates). Docs only: no level, voice line, art or save field exists yet. **Ready to build** as two same-game batches (levels 7–8, then 9); every open call has a default the build uses. Everything is invented island make-believe: no real object, place, people, date or "old" appears, so the study's reviewer decisions 3–5 (named historian, located packet, labour and harm) gate only later real-object content (H6), and the building session's source check (S1 of the [October 23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules)) has no factual line to check beyond the grown-up wording below.

**What it adds:** three appended levels of the built `attic-finds` game (`src/games/attic-finds/`; levels 1–2 [defined](attic-finds.md), 3–4 [defined](lid-and-lever.md), 5–6 [defined](same-job.md)), all built on **one case**: the island museum wants to borrow the bird box she found in the attic (levels 1–2), and asks what can truly be said about bird boxes like it. Three papers come out of the attic trunk.

- **Level 7, *Two sources*** (school): two claim cards, each with an empty slot, and the case's three papers. She drags into each claim the paper that shows it. A storeroom list can show a thing was in a house; a drawing can show someone using it; a shop's poster shows it was for sale. Two boards per round.
- **Level 8, *What can we tell?*** (school): three claim cards; she stamps each **The papers show it** or **Can't tell**. Some claims cannot be decided from these three papers, and "Seaside House had **no** bird box" is one of them: no paper from Seaside House is no proof of anything. Two boards per round.
- **Level 9, *Mend the exhibit*** (school): the museum's exhibit card has three captions that say too much ("Every child on the island loved bird boxes"). She swaps each for a caption the papers support, then picks which new paper could answer a question the papers leave open. One exhibit per round.

**Fun action and purpose:** papers that answer back. Tap a paper and the pet reads it (the list's pictures light one by one, the drawing's bird bobs, the poster's crowd cheers); drop it on a claim and the claim either lights up with the part of the paper that shows it, or the paper says what it really shows and hops home. The goal is the study's **sources and their limits** strand (NCSS C3 D2.His.10–11 for 3–5 and 6–8: compare sources, their origins and purposes, and recognize their limits; England KS2–3: use sources for supported interpretations): what kind of record shows what, absence of a record is not proof of absence, and a shop's poster is selling, not reporting. These anchors were opened by the study on 2026-10-16 and are cited for the purpose and the grown-ups' wording only; nothing claims a historical-thinking benefit.

- Levels 1–6, their IDs, rules, pins and their how-to wording do not change. No band, land, save field, journal entry, creation, couch entry or new registration is added.
- **Numbering.** The study's "steps 5–7" are planning labels; they take **IDs 7, 8 and 9**, the next free IDs, as the [Same Job definition](same-job.md) set.
- **One case, not three.** The study and READY ask for "one fictional three-source/three-claim case". The three levels are three actions on the same case (match, judge, mend), so the papers, houses and claims are learned once and the model is one table. Replay varies which claims a board holds, their order and the papers' places, never what a paper shows.

## Overlap and identity

Rechecked 2026-11-01 against the catalog, the open definitions and `git log origin/main`:

- **Attic Finds level 2** asks which **part** of an object proves what it does (`supports(clue, claim)`). Levels 7–9 ask which **paper** shows a claim about the object's past, and whether any does. Same attic, same drag-into-a-slot input; separate tables. Levels 5–6's `works(tool, job)` is untouched.
- **Forecast Detective** ([built](forecast-detective.md)) owns *Can't tell yet* for weather: clues remove possible weathers, and *Can't tell yet* is right only when every clue is open. **Lost Layers** owns *Can't tell* between two rock stories. Here every paper is always open, nothing is predicted, and *Can't tell* carries the history point the others do not: **no record is not proof of absence**, and a seller's claim is not evidence. The boards never ask about weather, rocks or the future.
- **Notice Board** ([definition](notice-board.md), queued) owns who **made** a poster, who **saw** what it says and why it was made, and always resolves. Level 9's poster is a fixed paper in a past case; she never names its maker, and the point is what the poster can and cannot support about the households.
- **Not Always** ([definition](not-always.md), queued) tests a general claim against visible cards for a counterexample. Here a universal ("every child loved them") is never refuted by a counterexample; it is simply not shown, so the answer is *Can't tell* or a narrower caption.
- **Island Archive / Timeline Trail** (proposals) own ordering undated pictures; there is no order, date or "before/after" here. **Unpack the Room** owns arranging a room; nothing is placed in a room. **Story Stamp Checker** (IDEAS, data/AI literacy) would stamp a toy reporter's claims; if it is ever defined it must take a different domain (news-like reports), and its stamps must not reuse these two.
- **Photo Safari** 8–9 judge a spoken claim against her own photo; here the evidence is a fixed set of authored papers and the question is what kind of record shows what.

## The case

All invented. Two island houses (**Hilltop House**, a round house with a red roof on a hill; **Seaside House**, a blue house on stilts by the waves), the island **toy shop** (a striped awning), and the island **fair** (bunting and stalls). The object is the bird box from levels 1–2, drawn the same.

### Facts (the model's atoms)

| Atom | Meaning |
| --- | --- |
| `has.hilltop`, `has.seaside` | A bird box was in that house |
| `crank.hilltop`, `crank.seaside` | Someone in that house cranked their bird box |
| `crank.fair` | Someone cranked a bird box at the fair |
| `sold` | The toy shop sold bird boxes |
| `advert` | The toy shop's poster said every child would love one |
| `loved.all` | Every child on the island loved bird boxes |
| `loved.hilltop` | The children at Hilltop House loved theirs |

**Constraints:** `crank.h ⇒ has.h` for both houses; `loved.all ⇒ loved.hilltop`. A **world** is an assignment of the nine atoms meeting the constraints (enumerated: at most 512).

### The case's three papers

| Paper | Drawn as | Spoken on tap | Shows (a constraint) |
| --- | --- | --- | --- |
| `list` | Hilltop House's storeroom list: the red roof at the top, then pictures of a bird box, a lantern and a pail, each with a tick | "Hilltop House's storeroom list: a bird box, a lantern and a pail." | `has.hilltop` |
| `drawing` | A crayon drawing from the fair: bunting, a stall, a friend turning a bird box's crank, the bird up | "A drawing from the island fair. Someone is cranking a bird box, and the bird pops up!" | `crank.fair` |
| `poster` | The toy shop's poster: a bird box, three shells for its price, a crowd of smiling friends with hearts | "The toy shop's poster: bird boxes for sale! Every child will love one!" | `sold ∧ advert` |

The poster's "every child will love one" is the shop's **advertising**: it shows `advert` (the shop said so), never `loved.all`. That is the model's whole stance on promotional sources, and the pet says it when it matters ("The shop wanted to sell them").

### Status of a claim

A **claim** is a small formula over the atoms (an atom, `not`, `and`). `status(claim, papers)`, by enumeration over the worlds consistent with the papers' constraints:

- **`shown`**: the claim is true in every consistent world;
- **`ruled-out`**: false in every consistent world;
- **`unknown`**: true in some and false in others.

No paper in this case shows a negative fact, so no authored claim is `ruled-out`; the levels have no "the papers show it's not true" stamp, and the model keeps the third status for a later case (decision 4). `supports(paper, claim)` is `status(claim, [paper]) === 'shown'`.

### The claims

| ID | Picture card (spoken on tap) | Formula | Status with all three papers | Shown by |
| --- | --- | --- | --- | --- |
| `hilltop-had` | Hilltop House with a bird box in its window ("A bird box was in Hilltop House.") | `has.hilltop` | shown | `list` only |
| `fair-cranked` | A paw on a bird box's crank, bunting above ("Someone cranked a bird box at the fair.") | `crank.fair` | shown | `drawing` only |
| `shop-sold` | The striped shop with a bird box and shells ("The toy shop sold bird boxes.") | `sold` | shown | `poster` only |
| `hilltop-cranked` | Hilltop House and a paw on the crank ("Someone at Hilltop House cranked their bird box.") | `crank.hilltop` | unknown | — |
| `seaside-had` | Seaside House with a bird box in its window ("Seaside House had a bird box.") | `has.seaside` | unknown | — |
| `seaside-none` | Seaside House with the bird box crossed out ("Seaside House had no bird box.") | `not has.seaside` | unknown | — |
| `all-loved` | Many friends with hearts round a bird box ("Every child on the island loved bird boxes.") | `loved.all` | unknown | — |

Each shown claim has **exactly one** supporting paper, so at level 7 the slot's answer is unique and the third paper is a real distractor. `hilltop-cranked` is the drawing trap (it shows cranking, but at the fair); `seaside-none` is the absence trap; `all-loved` is the advertising trap.

### Captions (level 9)

The exhibit card has three caption rows. Each starts with an overclaim and offers two other captions; the strip always holds the starting caption too, so she can put it back.

| Row | Starts as (unknown) | A caption the papers support | A caption they do not |
| --- | --- | --- | --- |
| Love | "Every child on the island loved bird boxes." (`loved.all`) | "The toy shop said every child would love one." (`advert`) | "The children at Hilltop House loved theirs." (`loved.hilltop`) |
| Cranking | "Children cranked bird boxes in every home." (`crank.hilltop ∧ crank.seaside`) | "Someone cranked a bird box at the fair." (`crank.fair`) | "Someone at Hilltop House cranked theirs." (`crank.hilltop`) |
| Homes | "Every house on the island had a bird box." (`has.hilltop ∧ has.seaside`) | "Hilltop House had a bird box." (`has.hilltop`) | "Seaside House had a bird box." (`has.seaside`) |

A caption row is **right** when its caption's status is `shown`; the Check accepts every caption the papers support and rejects every other. The unsupported alternatives are each narrower than the overclaim but still not shown, so "make it smaller" is not enough: it has to be what a paper shows.

### A paper that could answer (level 9)

After the captions, a **question card** asks one thing the papers leave open, seeded per round: "Did Seaside House have a bird box?" (`has.seaside`) or "Did anyone at Hilltop House crank theirs?" (`crank.hilltop`). Three **new papers** are offered, each a hypothetical record with its possible readings:

| New paper | Could read | Answers `has.seaside`? | Answers `crank.hilltop`? |
| --- | --- | --- | --- |
| Seaside House's storeroom list | lists a bird box (`has.seaside`) · lists other things (nothing: a list of one storeroom is not the whole house) | yes | no |
| A drawing made at Hilltop House | shows someone cranking the bird box there (`crank.hilltop`) · shows something else (nothing) | no | yes |
| Another copy of the shop's poster | `sold ∧ advert` | no | no |
| Another drawing from the fair | `crank.fair` | no | no |

`useful(paper, question)` is true when **some** reading of the paper, added to the case's three, makes the question's status `shown` or `ruled-out`. The round offers the question's one useful paper, the other house's paper and one of the two copies (seeded), so the wrong picks are a paper from the wrong place and a paper that only repeats what is already known.

## Screen and controls

The same attic (roof line, round window, the shelf across the top) with no crank, Turn, rug or cart. A small **exhibit stand** with a glass dome stands in the attic's corner at level 9; the bird box sits in it.

- **Papers** (all levels): the case's three papers lie on the attic table in a row under the shelf, each a 200×150 picture card at least 30 units apart. **Tap** a paper: it lifts on touch-down, grows a little and the pet reads it while its pictures light in turn (the list's three things, the drawing's bird bobbing, the poster's crowd cheering). Free, any time, as often as she likes.
- **Level 7:** two **claim cards** (380×120, picture plus a speaker corner; a tap anywhere on the card says it) in rows under the papers, each with an empty 120-unit **slot** on its right. **Drag** a paper onto a slot (`src/engine/drag.ts`, nearest slot): a copy drops in, the original stays on the table, so one paper can sit in both slots. A slotted copy can be dragged out or replaced freely. **Check** (104-unit green button, right of the bottom row) is dim until both slots hold a paper.
- **Level 8:** three claim cards in rows, each with two **stamps** on its right: **The papers show it** (110-unit round stamp, a tick on a paper) and **Can't tell** (110-unit round stamp, a question mark on a paper). Tapping a stamp presses it onto the card with a thump; tapping the other stamp swaps it; tapping the pressed stamp lifts it. Check is dim until every card is stamped.
- **Level 9:** the **exhibit card** (three caption rows, each a 380×120 picture caption with a speaker corner) beside the dome. **Tap a caption row**: it lifts and its **caption strip** opens (three 120×120 picture cards: the current caption and the row's two others); tap one to set it, which closes the strip and speaks it. Below: the **question card** (300×120, spoken on tap) with a 120-unit slot, and the three **new papers** (110×120 each); tap one to put it in the slot (tap another to swap). Check is dim until the slot holds a paper.
- **Keep clear:** the attic's existing `petCorner` (200×205, bottom-left) and `shellButtons` (130×130, top-left and top-right).
- **Levels 7–8, landscape (1024×768 design area):** papers in a row at y 160–310 (3 × 200 + 2 × 30 = 660 units, centred); claim rows of 120 below them with 10-unit gaps (level 8: y 320–700), cards at x 210–590; level 7's slot or level 8's two stamps to the card's right (x 610–840); Check (104) bottom-right. **Portrait (768×1024):** the same paper row at y 140–290 (x 54–714), rows at y 310–690 with cards at x 30–410 and stamps at x 430–670, Check bottom-right above y 1004; the pet's corner starts at y 819.
- **Level 9** has more on screen, so its papers shrink to **120×120 thumbnails** (still tappable and still lit by a Check). Landscape: caption rows at x 210–590, y 140–520; the open row's strip as a column of three beside them (x 610–730); the paper thumbnails as a column at the right (x 870–990, y 140–520) with Check under it (y 530–634); the question row along the bottom at y 640–760: question card (260), its slot (120), the three new papers (110 each), ending at x 970. Portrait: paper thumbnails in a row at y 140–260; caption rows at x 30–410, y 280–660 with the strip column at x 440–560; the question card and slot at y 690–810; the new papers at y 830–950 from x 220 (right of the pet's corner); Check bottom-right.
- `atticLayout(view, level)` returns every rectangle for levels 7–9, or **null** rather than shrink a target; the four test views must all fit (the two phone views are 768 units tall and wider than the iPad, so the landscape heights above are the binding case).
- **Touch and timing:** taps during a Check animation are ignored and no drag starts; a cancelled or lost drag returns the copy to nowhere (the original never left the table); leaving mid-animation stops it with the scene; hit boxes use local units and the nearest slot wins.
- **Sound and music:** a paper rustle on tap, a soft rubber thump for a stamp, a pentatonic rising pair when a claim lights, a falling pair when a paper hops home, the shelf chime when a board is done, and a small fanfare when the dome lights at level 9; `STYLES.paint` keeps playing as at levels 1–6.

### What a Check does

- **Level 7:** each slot in turn: a supporting paper lights the part that shows the claim (the list's bird box picture, the drawing's crank, the poster's shop) and the claim card glows; it stays. A paper that does not support its claim shows what it **does** show with the pet's reason (below) and hops back. Both right: the board shrinks onto the shelf; next board.
- **Level 8:** each card in turn: a right **shown** stamp lights the paper that shows it; a right **Can't tell** gently shakes all three papers ("None of the papers shows it"). A wrong stamp pops off with the claim's reason; right stamps stay. All right: the board goes to the shelf.
- **Level 9:** each caption in turn: a supported caption lights its paper; an unsupported one wobbles, says why, and its strip opens again. Then the new paper: a useful one shows its possible answer in a thought bubble ("If it lists a bird box, we'd know!"); a paper that could not answer says why and hops back. All right: the dome lights, the bird box bobs inside it, the museum friend cheers and the round ends.

### Reasons (spoken, one per mismatch)

| Paper or claim | Reason |
| --- | --- |
| `list` in `fair-cranked` | "The list shows a bird box was in Hilltop House. It doesn't show anyone cranking it." |
| `list` in `shop-sold` | "That's Hilltop House's list, not the shop's." |
| `drawing` in `hilltop-had` | "The drawing is from the fair, not Hilltop House." |
| `drawing` in `shop-sold` | "The drawing shows the fair, not the shop." |
| `poster` in `hilltop-had` | "The poster is selling bird boxes. It doesn't say which house had one." |
| `poster` in `fair-cranked` | "The poster is selling bird boxes. It doesn't show anyone cranking one." |
| *Shows it* on `hilltop-cranked` | "The list shows the box was there, and the drawing is from the fair. Nothing shows Hilltop House cranking it." |
| *Shows it* on `seaside-had` or `seaside-none` | "None of the papers is from Seaside House. No paper doesn't mean no bird box." |
| *Shows it* on `all-loved` | "Only the shop's poster says so, and the shop wanted to sell them." |
| *Can't tell* on a shown claim | The supporting paper's line: "Look at Hilltop House's list: the bird box is on it." · "Look at the fair drawing: someone is cranking one." · "Look at the shop's poster: they're for sale." |
| An unsupported caption | Its formula's reason above (the love row reuses `all-loved`'s; Seaside rows reuse the Seaside line; cranking rows reuse `hilltop-cranked`'s) |
| A new paper that cannot answer | "That paper is from the wrong place for this question." (the other house's) · "We already know what that paper says." (a copy) |

### First rounds

- **Level 7, board 1 (authored: `hilltop-had` above `fair-cranked`; papers list, poster, drawing):** "The museum wants to borrow our bird box! Let's see what the papers show. Drag the paper that shows each card into its slot, then tap Check." She taps the drawing (the bird pops up), drags it into `hilltop-had` and the list into `fair-cranked`, Check: both hop back with their reasons; one miss. She swaps them, Check: the list's bird box lights, the drawing's crank lights; the board goes to the shelf. Board 2 holds `shop-sold` and one of the others.
- **Level 8, board 1 (authored: `hilltop-had`, `seaside-none`, `all-loved`):** "Can the papers tell us? Stamp each card: the papers show it, or can't tell." Stamping *Shows it* on `seaside-none` and Check: "None of the papers is from Seaside House. No paper doesn't mean no bird box." The stamp pops off; one miss. Board 2 holds `seaside-had`, a shown claim and `hilltop-cranked`, so both "had one" and "had none" turn out to be *Can't tell*.
- **Level 9 (authored question: Seaside House):** "The museum wrote a card for the bird box, but it says too much. Tap each line and choose one the papers really show. Then pick a paper that could answer the question."

## Levels, bands and ranges

| Level | Name | Bands | What she decides | Finish |
| --- | --- | --- | --- | --- |
| 7 | **Two sources** | school | Which paper goes in each claim's slot, which to read first, when to Check | Two boards done |
| 8 | **What can we tell?** | school | *Shows it* or *Can't tell* on each of three claims | Two boards done |
| 9 | **Mend the exhibit** | school | Which caption replaces each overclaim, and which new paper could answer the open question | The exhibit Checked right |

| Band | Before | After |
| --- | --- | --- |
| lap, toddler, preschool, pre-K | as built | unchanged |
| school | `{ min: 2, max: 6, order: [2, 5, 6] }` | `{ min: 2, max: 9, order: [2, 5, 6, 7, 8, 9] }` |

No saved level moves; a school 6 steps up to 7, then 8, then 9. `entryLevels: [3, 4]` is unchanged. No `grownup` registration ([decision 2](#open-decisions)).

`describeLevel` uses the plan names: 7 "Two sources: drag the paper that shows each claim into its slot (a list, a drawing, a shop poster)"; 8 "What can we tell?: stamp each claim shown by the papers, or can't tell (no paper is no proof)"; 9 "Mend the exhibit: swap three overclaiming captions for ones the papers show, and pick a paper that could answer an open question". The grown-up level descriptions say "about 9 and up".

### Rounds

- **Level 7:** two boards. Board 1 takes two of the three shown claims, board 2 the one left out plus one of the other two (seeded), so each shown claim appears at least once. Paper order on the table is a seeded permutation per board; the claims' row order is seeded.
- **Level 8:** two boards of three claims. Each board has **one Seaside claim** (`seaside-had` on one board, `seaside-none` on the other, seeded which first), **one shown claim** (seeded from the three) and **one other trap** (`hilltop-cranked` on one board, `all-loved` on the other, seeded). So every board needs one *Shows it* and two *Can't tell*, and stamping everything *Can't tell* fails every board. Row order and paper order are seeded.
- **Level 9:** one exhibit: the three rows in a seeded order, each strip's three cards in a seeded order, the question seeded, its offered papers (useful, other house, one copy) in a seeded order.
- The authored first round (`first`, as levels 1–6) is the one above; the same seed always gives the same round.

## Accounting, help and finishing

- **Never a miss:** tapping a paper, claim, caption or question (reading), dragging copies in and out, pressing and swapping stamps, opening a caption strip and changing captions, choosing and swapping a new paper, a Check while a slot, stamp or the question slot is empty (the empty place wiggles and the pet says "Fill every slot first" / "Stamp every card first" / "Choose a paper for the question first"; nothing counted), repeated taps during a Check, and repeating the instruction.
- **A miss:** a Check with anything wrong on the board (a non-supporting paper, a wrong stamp, an unsupported caption, a paper that could not answer); **one per Check**, whatever the number wrong. Right parts stay; wrong parts return with their reasons, as above.
- **Hint:** after two misses on one board (or the exhibit), the first wrong or empty place glows with its answer (the supporting paper glows and its slot pulses; the right stamp glows; the supported caption glows in its strip; the useful paper glows), and the deciding paper on the table lights; `hints++` **once for that board**. **Show a hint** in the pause sheet gives the same glow and counts at most once per board. Start again rebuilds the same seeded round and keeps misses and hints.
- **Finish:** `ctx.finish({ misses, hints })` after the last board or the exhibit, with or without help: one ordinary sticker from the shell. Nothing is kept: no creation, discovery or journal entry ([decision 6](#open-decisions)).
- **Adaptation:** smooth and struggling rounds step inside school's `order`. Levels 7–8 claim that she matched a paper's kind to what it can show and kept *Can't tell* for what none shows; level 9 claims she chose supported captions and a useful next paper. Assisted completion is one sticker, not evidence of mastery, and no level claims historical understanding beyond this invented case.

## Logic (`logic.ts`, or a new `cases.ts` beside `jobs.ts`)

- `Plan.id` widens to `… | 7 | 8 | 9` and `mode` gains `'sources' | 'tell' | 'mend'`; `PLANS` gains ids 7–9 with the names above; `isCase(plan)` beside `isJobs`; `isFree` unchanged.
- `Atom`, `World`, `Formula` (`{ atom } | { not } | { and: Formula[] }`), `PaperId = 'list' | 'drawing' | 'poster'`, `NewPaperId = 'seaside-list' | 'hilltop-drawing' | 'poster-copy' | 'fair-copy'`, `ClaimId` for the seven claims (named to avoid level 2's `ClaimId`, e.g. `CaseClaimId`), `CaptionRow = 'love' | 'cranking' | 'homes'`, `QuestionId = 'seaside' | 'hilltop-crank'`.
- Tables: `PAPERS` (constraint, line, the part to light), `CLAIMS` (formula, line, picture), `CAPTIONS` (row → starting, supported, unsupported, each a formula and line), `NEW_PAPERS` (readings), `REASONS`.
- `worlds()` (constraint-filtered), `status(formula, papers)`, `supports(paper, claim)`, `useful(newPaper, question)`.
- Rounds: `makeCaseRound(plan, rng, first)`; state and pure steps `placePaper(slot, paper)`, `stamp(claim, 'shown' | 'unknown' | null)`, `setCaption(row, option)`, `chooseNewPaper(paper)`, `checkCase(state)` returning `'empty' | 'miss' | 'done'` with the wrong places and their reasons, `helpCase` (counts once per board), `glowFor(state)`.
- `atticLayout(view, level)` gains the paper row, the claim rows with slots or stamps, the exhibit rows, the caption strip, the question row and Check for levels 7–9.

## Rule tests

- **Model:** every world in `worlds()` meets both constraints; each paper's constraint is satisfiable; `status` is a pure function of the formula and the paper set (order of papers never matters).
- **Papers and claims:** with all three papers, the statuses are exactly the table's; each shown claim is supported by exactly one of the three papers (`supports` over 3 × 7); no claim is supported by the poster except `shop-sold` (and the `advert` caption), and `all-loved` is `unknown` with the poster present (promotion is not evidence).
- **Evidence limits:** for every subset of the three papers and every claim, adding a paper never turns `shown` into `unknown` and never turns `unknown` into `ruled-out` for any authored claim; removing a paper never shrinks the set of consistent worlds; with no Seaside paper, both `seaside-had` and `seaside-none` are `unknown` (no record is never proof of absence); no authored claim or caption is `ruled-out` with the case's papers.
- **Level 7 Check:** for every board and every assignment of the three papers (or empty) to its two slots (16), `checkCase` is `done` exactly when each slot holds its supporting paper, `miss` exactly when some slot holds a non-supporting paper, `empty` otherwise; a right slot keeps its paper after a miss; the reason for each wrong pairing is the table's.
- **Level 8 Check:** for every board and every stamping (3³ including unstamped), `done` exactly when each stamp equals the claim's status, `miss` when some stamp is wrong, `empty` otherwise; right stamps stay after a miss.
- **Level 9 Check:** over every caption choice (3³) and every new-paper choice (3 + empty), `done` exactly when every row's caption is `shown` and the paper is `useful`; every supported caption is accepted; every starting and unsupported caption is rejected; for each question exactly one offered paper is useful.
- **Rounds (500 seeds per level):** level 7's two boards together cover all three shown claims; level 8's boards each hold one Seaside claim (one `had`, one `none`), exactly one shown claim and one other trap (one `hilltop-cranked`, one `all-loved`); level 9 offers the useful paper, the other house's and one copy; all orders are permutations; the same seed gives the same round; the authored first round is as written.
- **Hints and accounting:** following `glowFor` from any state reaches `done`; `helpCase` counts at most once per board; a scripted level-8 board with one wrong Check, a second wrong Check, then the glow followed gives misses 2, hints 1; reading every paper and claim any number of times and an empty Check leave misses 0.
- **Bands and layout:** school `{2, 9, [2, 5, 6, 7, 8, 9]}`, the other bands unchanged; stepping up from 6 gives 7, then 8, then 9; at the four views for levels 7–9 every paper, slot, stamp, caption row, strip card, new paper, question slot and Check is at least 100 units, inside `view`, clear of the pet's corner and the shell buttons, and no two overlap (the open strip included, at each row).
- **Registry, lands and how-to tests** pass, with no "later levels" wording on the card.

## Ghost finger, how-to card, voice and registration

- **Ghost finger** (`autotouch()`): level 7, each board: tap one paper (it reads), drag each claim's supporting paper into its slot, tap Check. Level 8, each board: tap one paper, press the right stamp on each card, tap Check. Level 9: tap each caption row and its supported caption, tap the useful paper, tap Check. It never submits a wrong Check, reads `game.state` and the layout after every resize, and drives the scripted play.
- **How-to card** (`src/content/howto.ts`). The goal is unchanged. Add:
  - Steps: `{ from: 7, to: 9, text: 'Tap a paper to hear what it shows.' }`; `{ from: 7, to: 7, text: 'Drag the paper that shows each card into its slot, then tap Check.' }`; `{ from: 8, to: 8, text: "Stamp each card: the papers show it, or can't tell. Then tap Check." }`; `{ from: 9, to: 9, text: 'Tap each line of the museum card and choose one the papers really show; then choose a paper that could answer the question, and tap Check.' }`.
  - Finish: `{ from: 7, to: 8, text: 'Both boards are done; they sit on the shelf.' }`, `{ from: 9, to: 9, text: 'The museum card is true, and the bird box lights up in its case.' }`.
  - Note `{ from: 7, to: 9 }`: "Reading the papers, moving them and changing stamps or captions are never counted against her. A Check with a paper that does not show the card, a wrong stamp, a caption the papers do not show, or a paper that could not answer counts as one miss; after two on a board the answer glows, which counts as a hint. *Can't tell* is the right answer when no paper shows it, including 'Seaside House had no bird box': no record is not proof. The shop's poster is advertising, so it shows what the shop said, not what children felt. The houses, papers and bird box are made up for the island."
- **Co-play hint** (shared; add a sentence): "In the casebook, one reads a paper aloud and the other says which card it could show, before anyone taps Check."
- **Voice lines** (`voice-script.ts`, no slots, each with an optional `{pet}`):
  - Instructions: `attic-finds.instruct-sources` ("The museum wants to borrow our bird box! Let's see what the papers show. Drag the paper that shows each card into its slot, then tap Check."), `instruct-tell` ("Can the papers tell us? Stamp each card: the papers show it, or can't tell."), `instruct-mend` ("The museum wrote a card for the bird box, but it says too much. Tap each line and choose one the papers really show. Then pick a paper that could answer the question.").
  - Papers: `paper-list`, `paper-drawing`, `paper-poster`, `new-seaside-list` ("Seaside House's storeroom list."), `new-hilltop-drawing` ("A drawing made at Hilltop House."), `new-poster-copy` ("Another copy of the shop's poster."), `new-fair-copy` ("Another drawing from the fair.").
  - Claims and captions (the table texts): `claim-hilltop-had`, `claim-fair-cranked`, `claim-shop-sold`, `claim-hilltop-cranked`, `claim-seaside-had`, `claim-seaside-none`, `claim-all-loved`, `caption-crank-every-home`, `caption-every-house`, `caption-shop-said`, `caption-hilltop-loved`; questions `question-seaside`, `question-hilltop-crank`.
  - Reasons: `why-list-crank`, `why-list-shop`, `why-drawing-hilltop`, `why-drawing-shop`, `why-poster-house`, `why-poster-crank`, `why-hilltop-crank`, `why-seaside`, `why-all-loved`, `look-list`, `look-drawing`, `look-poster`, `why-wrong-place`, `why-copy`.
  - Feedback: `shows-it` ("The papers show it!"), `none-shows` ("None of the papers shows it. Can't tell!"), `could-answer` ("If it says yes, we'd know!"), `fill-slots`, `stamp-all`, `choose-paper`, `board-done` ("On the shelf it goes!"), `exhibit-done` ("Now the museum card is true!").
  - `ctx.instruct` uses the level's instruction, so the corner pet repeats it when tapped.
- **Registration:** `PLANS`, `LEVELS` (school above) and `describeLevel` change, plus the co-play sentence; ID, name, title line, region (`story-grove`), skills (unchanged: `evidence` and `comparing` already cover it), music, bands, `entryLevels`, hub icon and sticker do not. Story Grove's capacity is unchanged (no new game). Couch: none.
- **Off screen** (optional; the study's card review still applies before any printed card): with a grown-up, pick one ordinary thing at home and say what a photo, a shopping receipt or an advert for it could show, and what none of them could ("Did anyone like it?"). No family records, heirlooms or private papers are needed.
- **Rework couplings:** none. Nothing is saved; the shelf and the dome are the round's picture.

## Build and check tier

Two same-game batches, both school-only on the existing registration:

- **Batch attic-finds 3, levels 7–8** (new-interaction tier: the case model, paper copies dragged into claim slots, and stamps): typecheck and unit tests (the model, level 7–8 Check enumerations, rounds, hints, bands and layout above, plus the registry, lands and how-to tests); one scripted play through a new `browser-check.mjs` case (`atticcase`, with its README row) at level 7 (one free read, one wrong Check, then right) and level 8 (a wrong *Shows it* on the Seaside claim twice, the glow, then right), with the expected misses and hints; one portrait screenshot at level 8 with a stamp pressed; `fingerdemo` at 7 and 8; `npm run build`, because the how-to and voice files are shared.
- **Batch attic-finds 4, level 9**, after batch 3 (new-interaction tier: caption strips and the question slot): typecheck and unit tests (the level 9 Check enumeration, `useful`, rounds and layout with each strip open); one scripted play of level 9 with the starting captions Checked (a miss), a copy paper in the question slot (a miss with the glow), then right; one portrait screenshot with a strip open; `fingerdemo` at 9; `npm run build`.

### Expected files

`src/games/attic-finds/logic.ts` (plans), a new `cases.ts` (model, rounds, layout) and its tests, `index.ts` (dispatch to the case scene, as to `jobs.ts`), drawing helpers inside the game folder; `src/content/howto.ts`; `src/content/voice-script.ts`; `scripts/browser-check.mjs`; README (the inventory row's levels and the browser-check row), `docs/GAMES.md` (the Attic Finds entry), `docs/VERIFICATION.md`.

Device checks stay open: whether a school child reads the three papers' pictures without the pet (the list's tick marks, the fair's bunting); whether *Can't tell* on "Seaside House had no bird box" is understood or only learned from the reason; whether the poster's crowd with hearts is read as "the shop says" or as "children say"; whether a grown-up finds the exhibit mending worth doing together; device speech of the new lines.

## Open decisions

Each has a default the build uses. None blocks it. Numbered after the Same Job definition's 1–7.

1. **One case.** Default: one bird-box case for all three levels, replay varying claims and order. Alternative: dress the same model with the fish churn as a second case (doubles the claim, caption and reason lines; content, not a new level).
2. **Grown-up window.** Default: school only. The study's "grown-up 6–7" window would register `grownup` on a game with child-sized touch, place it in Lantern Lodge as well as Story Grove, and needs the land rules rechecked; a later slice if wanted.
3. **Choosing a paper at level 7.** Default: drag a copy, the original stays (one paper may serve two claims; matching is not one-to-one). Alternative: tap a paper, then tap a slot (no drag), as level 2 left unbuilt.
4. **A third stamp.** Default: two stamps; no authored claim is `ruled-out`. Alternative: a later case with a paper that shows a negative ("the shop's list of what it never sold") and a third stamp *The papers show it's not true*; the model already returns `ruled-out`.
5. **Real records.** Default: none; the houses, papers and object are invented, and the card says so. A located real storeroom inventory, advert or drawing waits on the study's decisions 3–5 (H6) and is a separate content slice with its own review.
6. **Shelf and journal.** Default: boards and the lit dome for the round only; no discovery filed. Alternative: file "no record is not proof" once level 8 is finished, as Seesaw Balance files only what a round showed.
7. **Partial Checks.** Default: an empty place is never a miss and right places stay after a miss. Alternative: a level-8 Check allowed with blanks, treating a blank as *Can't tell*; rejected because it makes *Can't tell* the default instead of a decision.
