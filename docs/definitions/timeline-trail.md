# Timeline Trail, levels 1–4 (definition)

Defined 2026-10-23 as the first packet of the [time-and-change study's](../deep-dives/subjects/time-change.md#first-games-proposed-ladder-timeline-trail) **Timeline Trail** follow-up, from the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#time-and-change-recommendations) (slice 1 of its [build slices](../deep-dives/subjects/time-change.md#build-slices-in-order)). Docs only: no game, ID registration, voice line, art or save field exists yet. Levels 5–8 (continuity, the two-gap card, pointing at proof, Island Archive) and real-object content stay in the study.

**Fun action and purpose:** the pet hangs pictures of a place on a clothesline between two posts, "long ago" on the left and "now" on the right, and she decides where each picture goes. A finished line plays as a **flipbook**: the place grows in front of her. The learning goal is **before and after, then and now**: the same place looks different at different times, and a picture shows when it is from by what is in it (D2.His.1, 2 and 11 in the study). Everything is the island's own made-up past; no real date, object or fact appears.

## Identity and overlap

- **Story Steps** (`story-steps`) already drags four pictures of **one short story** into order, with missing middles. Any round that is only "put N cards of one story in order" belongs there. Timeline Trail differs in three ways: the line is **one place across a long span**, not a story with characters acting; she **inserts** into a line that is already hung, one card at a time; and each card is judged against the cards already hung (level 3) and against a clue inside another place's picture (level 4). If a later level reduces to ordering one story's cards, it becomes a Story Steps level instead.
- **Day by Day** and **Clock Tower** own the week and clock time; no clock, calendar or date appears here. **Garden Grow** and Life Story Lab own growth biology; a sapling here is a picture clue, never a lesson on trees. **Attic Finds** owns objects and their use. The study's later "real things then and now" rung is a separate, reviewed definition.

## The model

- **A place** is an authored record in `logic.ts`: `id`, a spoken name and **four or five stages**, oldest first, each `{ id, caption, line }`. The stage index is hidden from the player; the drawing carries the evidence.

  | Place | Stages (oldest first) |
  | --- | --- |
  | `shore` | an empty shore with one rock → a little dock → a dock with a boat shed → the shed with a boat and a lantern on the dock |
  | `tree` | a sapling with two leaves → a young tree → a big tree → the big tree with a swing hung from its branch |
  | `nest` | the pet's egg in a nest → a hatchling → a young pet with a first scarf → the pet as she is now, in the treehouse door (drawn from the saved companion, so "now" is hers) |

  Tests require every stage of a place to be visibly different from its neighbours in at least one named element (the `changes` field lists it), so no two cards ever look alike.
- **A line** is the pictures hung on the clothesline, in stage order. **A card** is one stage's picture. **A gap** is a glowing space between hung cards or at either end.
- **A round** (`planFor(level)` plus `ctx.rng`) names a place and the cards used (level 1: two stages; level 2: three; levels 3–4: four), chosen with at least one stage between neighbours so the change is big enough to see, and a seeded left/right order for any cards shown loose. The places come from a shuffled bag so all three turn up before any repeats.
- **Valid gaps.** `validGaps(line, card)` returns the gaps where the card's stage fits given the cards already hung. At levels 1–3 that is always exactly one gap. Level 4 adds a clue inside the picture (below). Looking, replaying and hearing a card are free.

## Screen and controls

- **Landscape (1024×768 design area):** the clothesline runs across the middle between two posts. The left post wears a faded, sepia-soft picture of the same place's first stage and the spoken words "long ago"; the right post wears the bright "now" with the pet, and the words "now". The pet says the direction every round until level 4. Loose cards wait in a tray below the line, each at least 150×150. Gaps are glowing pegs at least 110 wide and 40 apart, never smaller than 100 units after scaling; a line of four cards plus gaps wraps into **two rows in portrait** (`lineLayout(view, level)` returns every rectangle, and a test asserts sizes, spacing, no overlap with the home button, the pet's corner, the tray or the posts, and everything inside `view` at the four views the lands test uses).
- **Cards:** touch-down lifts a card and it sways like washing; dragging uses `src/engine/drag.ts`. Dropping on or near a gap pegs it there (the nearest valid-or-not gap wins, so close gaps never swallow a drop). A tap on a loose card says what it shows (free). At level 1 a card may also be **tapped** to answer, and flies to the left or right post; dragging to the post works too, so a small hand has two ways.
- **Flipbook:** when the last card is hung the line plays stage by stage, the place growing on the right post's big frame, a soft page-turn on a pentatonic rise, then the pet says the closing line. This is the reward and the replay: tapping the flipbook plays it again.
- **Music:** the land's style plays underneath; this is not a game where she makes the music.

## Levels

| Level | Name | Bands (default) | What she decides | Finish |
| --- | --- | --- | --- | --- |
| 1 | **Long ago or now?** | preschool, pre-K | Two pictures of one place: tap or drag the one from long ago to the left post | Flipbook of two |
| 2 | **Hang it between** | preschool, pre-K, school | A line of two already hangs; drag the third picture into the right one of three gaps | Flipbook of three |
| 3 | **Grow the line** | pre-K, school | Build a line of four, one card at a time; each new card is placed against the cards already hung | Flipbook of four |
| 4 | **A clue inside** | pre-K, school | Two places share one line: the dock picture shows the sapling in the background, still small, so it hangs early | Flipbook of both strands |

At level 4 the line holds two places' cards (two each) and the question is whether a picture hangs before or after the other place's; a clue shared between them (the small tree behind the dock) decides it. Each strand then plays in turn, and the shared clue lights up in both. The ladder deepens by adding insertion, a growing line and a clue, with no timing and no more cards to remember than a line of four (AGENTS' depth-before-pressure rule). Levels 5–8 in the study are appended later so no saved level moves.

### First rounds

- **Level 1 (place: tree).** The pet: "These pictures are two times in the life of one tree. Which one is from long ago?" She taps the sapling; it flies to the left post and the pet says "Yes, long ago it was a little sapling!" The big tree takes the right post, and the flipbook shows sapling then big tree. Tapping the big tree first: boing, the card hops back, "That's the tree now. Which one is from long ago?" (one miss).
- **Level 2 (place: shore).** The empty shore hangs on the left, the shed-and-lantern dock on the right. The pet holds up the little dock: "Where does this one go?" Three gaps glow: before the empty shore, between, after. She drops it between; the pegs close and the flipbook plays three stages. Dropping it after the lantern dock: it slides back, "The lantern dock is later. The little dock has no shed yet, so it goes before it."
- **Level 3 (place: nest).** The pet hangs the egg at the left post, then gives a card at a time: she hangs the hatchling after the egg, then the pet in her scarf after the hatchling, then the pet as she is now at the right. Each drop is checked against the cards already hung. Wrong: the card slides back with its reason.
- **Level 4 (places: shore and tree).** The line holds the empty shore and the lantern dock; the loose dock-with-shed card shows a small sapling behind it, and the big-tree card shows no dock at all. The pet: "Look behind the dock. The tree is still little." She hangs the shed-and-sapling card before the lantern dock card, because the tree in its picture is smaller than the tree in the lantern dock's. The shared clue glows in both strands during the flipbook.

## Accounting, help and finishing

- **Never a miss:** tapping a loose card or the posts to hear them; dragging a card across the line and releasing it away from every gap (it settles back where it was, nothing said); replaying the flipbook; the pet's tap.
- **A miss:** a card dropped in a gap the rules do not allow. It slides back with a boing and the reason, in words about **what the picture shows** ("the tree here is still small, so this picture is from long ago"). A second drop of the same card in the same wrong gap repeats the reason and counts nothing more. At level 1 tapping the "now" picture as "long ago" is the miss.
- **After two misses on the same card**, its valid gap glows and `hints++` (at most once per card). Show a hint (`Scene.pauseActions`) does the same for the card in hand, still at most once per card.
- **Adaptation:** the ordinary rule (`src/progress/difficulty.ts`). A zero-miss level-1 round shows she matched the words "long ago" and "now" to the pictures, with the pet's convention repeated each time; it is not evidence she can order unfamiliar things by age.
- **Start again** (pause sheet) restores the round's first state, keeping misses and hints.
- **Finish:** `ctx.finish({ misses, hints })` after the flipbook, with or without help: one ordinary sticker. Nothing is kept, filed in the journal or saved by the game ([decision 6](#open-decisions)).

## Rule tests (`logic.test.ts`)

- **Table:** three places with four or five stages each; every adjacent pair of stages differs in at least one named `changes` element; no caption or line contains a number, date or unit of time.
- **Rounds, over 500 seeds per level:** the card count and stage gaps above; level 1's two cards are at least one stage apart; the places bag gives all three before any repeats; the same seed gives the same round.
- **Valid gaps:** at levels 1–3 every card has exactly one valid gap and the hung line is always stage-ordered; any random legal build order of a level-3 round reaches a full line (solvable); at level 4 every card's valid gap is decided by a visible clue (the `clue` field names the element), checked by deleting that element from the model and requiring the gap to become ambiguous.
- **Placement:** `place(line, card, gap)` returns `go` for the valid gap and `other`, with a reason built from the card's `changes` element, for any other gap; a wrong drop never mutates the line.
- **Hints:** the glowed gap is the valid gap; a scripted level-3 round (wrong, wrong again in the same gap, Show a hint twice on one card) counts one miss per distinct wrong drop and at most one hint per card.
- **Layout:** `lineLayout` at the four views for each level, as above.
- **Registry, lands and how-to tests** pass with the new game, including its home land still fitting on one screen at every band.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` uses the same drag and tap actions as play. Level 1 taps the long-ago card; level 2 drags the loose card to the valid gap; level 3 builds the line in a legal order; level 4 drags the clue card first, then finishes.
- **How-to card** (`src/content/howto.ts`). Goal: "Hang pictures of one place on the clothesline, from long ago to now."
  - Steps: "Tap the picture from long ago" `{ from: 1, to: 1 }`; "Drag the new picture into the gap where it belongs" `{ from: 2, to: 2 }`; "Add the pictures one at a time; each fits against the ones already hung" `{ from: 3, to: 3 }`; "Look behind the picture: a clue in it shows when it is from" `{ from: 4, to: 4 }`.
  - Finish: "The pictures play like a flipbook and the place grows."
  - Notes: "A picture put in the wrong place slides back with a reason; after two tries on one picture its gap glows, which counts as a hint" `{ from: 1, to: 4 }`; "Looking, listening and replaying the flipbook are never counted" (all levels); "The place is made up for the island; no real dates are taught" (all levels).
- **Voice lines** under `trail.*`: `intro` (with `{place}`), `instruct-first` (level 1), `instruct-hang` (levels 2–3), `instruct-clue` (level 4), `card.*` (the stage captions, spoken), `yes` (with `{caption}`), `other` (with `{reason}`, built from the `changes` element), `hint-glow`, `flipbook` and `done`. `{pet}` optional. The words "long ago" and "now" are spoken and printed only as the picture on each post, never as text to read.
- **Registration:** ID `timeline-trail`, name "Timeline Trail", spoken title `game.timeline-trail` ("Timeline trail"). Region (subject) `story-grove` (language and stories, beside Story Steps; the game's skill row is `['sequencing', 'then-and-now', 'cause-and-effect']`, free strings). Bands: preschool 1–2, pre-K 1–4, school 2–4 ([decision 2](#open-decisions)). Home land **Barnyard** by default (11 games today, 12 with this one), fallback Treehouse (7); Story Grove (12) and Rainbow Meadow (12) are avoided because their scene decor tests fail at 13 games, as Adventure Walk found ([decision 3](#open-decisions)). Hub icon: a little clothesline with two pegged pictures. Sticker: a seeded place card (sapling, dock or egg) pegged on a line.
- **Art:** code-drawn in `src/games/timeline-trail/art.ts` with `src/art/palette.ts`: the three places' stages, a sepia/bright treatment for the posts, pegs and the line. The "now" nest card draws the saved companion with `ctx.companion()`. No imported art or audio.
- **Co-play:** a grown-up asks "what changed between this picture and that one?" while she hangs a card. **Off-screen** (spoken tip, default): "Look at a baby photo and a recent photo of the same person, or plant a seed, and talk about what looks different, then and now." Real family photos are the grown-up's choice; the game shows none.
- **Couch:** none.
- **Rework couplings:** none required and nothing saved. The flipbook of a place growing is a natural future way to show an [RW13 ecosystem location](../rework/WORK-ITEMS.md#rw13-island-revamp-ecosystems-as-locations) changing; that is the rework's to define.

## Check tier

T2 (levels 1–3) is the new-game tier: typecheck and unit tests (the rule properties above plus registry, lands and how-to tests); one scripted play through a new `browser-check.mjs` case (its README row is part of the build) at level 2 (one wrong gap, one hint) and level 3 (the full line); one portrait screenshot at level 3 showing the two-row line and the tray; `fingerdemo` at levels 1–3; `npm run build`, because the registry, lands, voice and how-to files change. Level 4 (T3) is a later batch on the same game, tested by the clue-decides-the-gap property and one scripted play plus `fingerdemo` at it.

Device and person checks stay open: whether a preschooler reads the sepia post and the bright post as "before" and "now"; whether the drag is easy at four cards in portrait; whether device speech separates the stage captions; whether a grown-up joins the "what changed" talk. Browser automation cannot establish any of these.

## What comes next

**T2 (levels 1–3)** and **T3 (level 4)** are the first batches and share one game; T3 adds the second place and the clue test. Then the study's slice 4 (levels 5–6: the "still here" ribbon, the counter-progress card with its failing-heuristic test, and the two-valid-gaps card) and slice 5 (level 7, pointing at proof). Island Archive and the real-object rung wait on the study's decisions and a named history reviewer.

## Open decisions

Each has a default the build uses; none blocks T2.

1. **Identity.** Default: a new game, because inserting pictures of one place into a line across a long span, judged against what is already hung, is not what Story Steps asks. Alternative: Story Steps levels 14–17, if play shows the clothesline adds nothing to its ordering.
2. **Bands.** Default preschool 1–2, pre-K 1–4, school 2–4, with lap and toddler left out (the study's youngest sequencing lives in Story Steps and Day by Day). Alternative: a toddler level 1 of two pictures with only the flipbook and no wrong answer.
3. **Subject and home land.** Default region `story-grove`, home land Barnyard. Alternatives: Treehouse; Story Grove or Rainbow Meadow only if their scene decor tests are raised first; the proposed Storybook Square waits on the rework's map.
4. **Personal timeline from stickers.** Default: not built. Stickers carry `at`, an old save repairs it to 0, and a dated strip would show the gaps between visits, which cuts against "nothing waits". Alternative: an order-only strip, never dates or gaps, after a reviewer reads it.
5. **Level 1 accounting.** Default: tapping the "now" picture as "long ago" is a miss with the reason; every other tap is free. Alternative: level 1 is all free and counts 0/0 like Adventure Walk's, because a two-card choice cannot be told from a guess.
6. **Journal.** Default: nothing filed. Alternative: a discovery page of the three places' flipbooks after she has hung each one once.
7. **Real-history content.** Default: none; the `time-change` study's reviewer decision still gates the real-object rung and Island Archive.
