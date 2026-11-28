# First-play audit, 2026-11-28

Robert (2026-11-28): "on quite a few games ... they're not intuitive to play, and unless you read the instructions at the start it's hard to figure out. Maybe some games need a tutorial or guided play the first time someone is playing that sort of game?"

This review looks at what a player meets when they skip the how-to card, ranks the games by how much the card is carrying, and records the fix adopted (guided first play) and the order it is rolled out in.

## What a player meets today

- **Before the round:** every game opens on its how-to card: a small window where a ghost finger plays the level, and four labelled blocks of text (Goal, What to do, The round ends, Good to know), then Play. It is good help for a grown-up who reads it. A child who cannot read, or a grown-up who taps Play straight away, gets nothing from the text, and the demonstration is a third of the screen wide and finished before they look.
- **In the round:** the spoken instruction (and the caption band for grown-ups), and the speaker button to hear it again. Nothing shows *where to touch* or *which gesture*. Many games already glow a hint after two misses, but a player who does not know what to touch never misses: the board just sits there. The "?" button reopens the card, which is reading again.

So the gap is not the card. It is the round itself, on the real board, at the moment of not knowing.

## What makes a game hard to figure out without the card

From the 205 how-to cards (at each band's first level) and a look at the rounds on a phone screen, the same few causes recur:

1. **A gesture you would not guess:** dragging along a rail (Ferry Jam, Shadow Play), sliding (Snowball Merge, Number Nook), drawing or tracing (Letter Trails, Draw a Ramp, Cut Along), holding, swiping (Pond Conga).
2. **Two-step taps:** pick something, then tap where it goes (Jar Sort, Bubble Pop's pairs, Toy Drawer, Domino Pond, Memory Desk). The first tap does something quiet, and nothing says the second is needed.
3. **A button that finishes or checks:** Check, Go, Try, a bell, a flag, the green arrow (Fossil Dig, Block Tower, Chain Reaction, Draw a Ramp). The round waits on a button the player has not noticed.
4. **Rules that are not visible:** which tile is free (Tile Pairs), which jumps are legal (Marble Jump), what a lever does (Workshop Detective). These need the first move shown, not only the gesture.
5. **Several rules on the card at once** (three or four "What to do" lines): the more the card says, the more a player who skipped it is missing.

## The fix adopted: guided first play

One shared piece in the shell (`src/app/round-guide.ts`, `src/ui/move-pointer.ts`), switched on game by game:

- **First play:** on a player's first round of a game, once the spoken instruction has finished, a drawn hand shows the next move *on the real board*: it drifts in, presses with a ripple, carries along a dotted path for a drag or a trace, lifts, and does it once more. It shows again every five seconds until the player touches the board, and after that whenever they pause for half the usual wait. It is free: no hint is counted.
- **Quiet board:** in any later round, when nothing has been touched for a while (8 seconds for the youngest bands, 12 at school age, 25 for grown-ups, who may simply be thinking), the hand shows the move once. It counts as one hint for the round (never at lap or toddler, where a grown-up playing alongside is the point), because an assisted round is not independent mastery.
- The hand **never touches anything**: the move stays the player's. Any touch makes it go. It waits while a line is being said, never plays for a controller player, and is off whenever a grown-up turns the how-to cards off.
- A game opts in by answering `showMove()`: the move to show, aimed at a right answer where there is one. For most games that is exactly what the how-to card's ghost finger already computes (`autotouch`), so the opt-in is a few lines once its bot has been read for side effects. A game whose bot errs on purpose, plans with timers or knows hidden things (Memory Match's face-down pairs) gets its own `showMove` that shows the action without giving away what is hidden.

Things considered and not done: bringing back the guide pet to explain (it was removed from game scenes on purpose, 2026-11-27); a forced tutorial round before the real one (slower for everyone who already knows, and the youngest cannot tell it apart from the real round); shrinking the card's text (it is grown-up help and good at that job).

## Ranking and rollout order

Scored from each game's how-to card: two points for each hidden gesture (three for a swipe or a hold), two for two-step taps, one and a half for a finishing button and for each "What to do" line after the first, plus a little for length. "Bot reads only" means its `autotouch` assigns nothing, so the opt-in is likely a one-liner; "needs a look" means the bot keeps state and its `showMove` may need writing out. The rollout follows this order in batches of about twenty-five, one pull request each.

**Batch 1 (with the shared piece):** Bolt Boards, Ferry Jam, Jar Sort, Tile Pairs, Marble Jump, Snowball Merge.

| Rank | Game | Band read | Why it needs the card | Opt-in |
| --- | --- | --- | --- | --- |
| 1 | Word Search (`word-search`) | grownup | 4 rules on the card; a button to finish or check; a drag; a slide; two-step taps | bot reads only |
| 2 | Stamp Studio (`stamp-studio`) | school | 4 rules on the card; a button to finish or check; a drag; turning; two-step taps | bot reads only |
| 3 | Shape Buddies (`shape-buddies`) | school | 4 rules on the card; a button to finish or check; a drag; turning; two-step taps | bot reads only |
| 4 | Pet Says (`pet-says`) | school | 3 rules on the card; a button to finish or check; a hold; turning | bot reads only |
| 5 | Ferry Jam (`ferry-jam`) | prek | 4 rules on the card; a button to finish or check; a drag; a slide | bot reads only |
| 6 | Letter Trails (`letter-trails`) | school | 3 rules on the card; a button to finish or check; a drag; drawing; tracing; turning | bot reads only |
| 7 | Rainbow Fingers (`rainbow-fingers`) | preschool | a button to finish or check; a drag; a hold; two-step taps | bot reads only |
| 8 | Workshop Detective (`workshop-detective`) | grownup | 4 rules on the card; a button to finish or check | bot reads only |
| 9 | Beat Builder (`beat-builder`) | school | 4 rules on the card; a button to finish or check; turning | bot reads only |
| 10 | Toy Drawer (`toy-drawer`) | preschool | a button to finish or check; a drag; drawing; two-step taps | bot reads only |
| 11 | Circuit Garden (`circuit-garden`) | prek | 3 rules on the card; a button to finish or check; a drag; two-step taps | bot reads only |
| 12 | Cue Studio (`cue-studio`) | school | 4 rules on the card; a button to finish or check; turning | bot reads only |
| 13 | Bubble Pop (`bubble-pop`) | school | 3 rules on the card; a button to finish or check; a hold; two-step taps | bot reads only |
| 14 | Attic Finds (`attic-finds`) | school | 3 rules on the card; a button to finish or check; a drag; turning; two-step taps | bot reads only |
| 15 | Snowball Merge (`snowball-merge`) | grownup | 4 rules on the card; a button to finish or check; a slide | bot reads only |
| 16 | Dream Cards (`dream-cards`) | school | 4 rules on the card; turning; two-step taps | bot reads only |
| 17 | Swap Meet (`swap-meet`) | preschool | 3 rules on the card; a button to finish or check; a drag | bot reads only |
| 18 | Jar Clues (`jar-clues`) | grownup | 4 rules on the card; a drag; two-step taps | bot reads only |
| 19 | Animal Charades (`animal-charades`) | preschool | 4 rules on the card; a button to finish or check; two-step taps | bot reads only |
| 20 | Shadow Play (`shadow-play`) | grownup | 4 rules on the card; a drag; a slide | bot reads only |
| 21 | Lost Layers (`lost-layers`) | school | 4 rules on the card; a drag; two-step taps | bot reads only |
| 22 | Day by Day (`day-by-day`) | school | 3 rules on the card; a button to finish or check; two-step taps | bot reads only |
| 23 | Number Trails (`number-trails`) | preschool | 3 rules on the card; a button to finish or check; drawing | bot reads only |
| 24 | Quick Tricks (`quick-tricks`) | toddler | 3 rules on the card; a button to finish or check; a drag; turning | bot reads only |
| 25 | Hat Band (`hat-band`) | school | 3 rules on the card; a button to finish or check; a drag; two-step taps | bot reads only |
| 26 | Trackway Tales (`trackway-tales`) | school | a button to finish or check; a drag; two-step taps | bot reads only |
| 27 | Sand Table (`sand-table`) | prek | 4 rules on the card; a button to finish or check; two-step taps | bot reads only |
| 28 | Draw a Ramp (`draw-a-ramp`) | preschool | a button to finish or check; a drag; drawing; two-step taps | bot reads only |
| 29 | Number Nook (`number-nook`) | grownup | 4 rules on the card; a slide | bot reads only |
| 30 | Pond Conga (`pond-conga`) | school | a button to finish or check; a swipe | bot reads only |
| 31 | Fossil Dig (`fossil-dig`) | prek | 3 rules on the card; a button to finish or check; two-step taps | bot reads only |
| 32 | Domino Pond (`domino-pond`) | grownup | 4 rules on the card; a button to finish or check; turning | bot reads only |
| 33 | Chain Reaction (`chain-reaction`) | prek | 3 rules on the card; a button to finish or check; turning | bot reads only |
| 34 | Penguin Slide (`penguin-slide`) | preschool | 3 rules on the card; a button to finish or check; a slide | bot reads only |
| 35 | Memory Match (`memory-match`) | toddler | 4 rules on the card; two-step taps | bot reads only |
| 36 | Welcome Ways (`welcome-ways`) | school | 3 rules on the card; a button to finish or check; a drag | bot needs a look |
| 37 | Common Ground (`common-ground`) | grownup | 3 rules on the card; a button to finish or check; a drag | bot reads only |
| 38 | Campsite (`campsite`) | school | 3 rules on the card; a button to finish or check | bot reads only |
| 39 | Village Planner (`village-planner`) | school | a button to finish or check; a drag; two-step taps | bot reads only |
| 40 | Gear Garden (`gear-garden`) | prek | a button to finish or check; a drag; turning; two-step taps | bot needs a look |
| 41 | Mystery Grid (`logic-grid`) | grownup | 3 rules on the card; a drag | bot reads only |
| 42 | Bond Beads (`bond-beads`) | school | 3 rules on the card; a button to finish or check; a drag | bot reads only |
| 43 | Tangram Town (`tangram-town`) | prek | a button to finish or check; a drag; turning | bot reads only |
| 44 | Marble Jump (`marble-jump`) | grownup | 4 rules on the card | bot reads only |
| 45 | Cut Along (`cut-along`) | school | 4 rules on the card; a button to finish or check; turning | bot reads only |
| 46 | Memory Desk (`memory-desk`) | school | 3 rules on the card; drawing; two-step taps | bot reads only |
| 47 | Tile Pairs (`tile-pairs`) | grownup | 4 rules on the card | bot reads only |
| 48 | Sudoku Garden (`sudoku-garden`) | grownup | 3 rules on the card; a button to finish or check; two-step taps | bot needs a look |
| 49 | Picnic Pantry (`picnic-pantry`) | school | 3 rules on the card; a button to finish or check | bot reads only |
| 50 | Word Code (`word-code`) | school | 3 rules on the card; a button to finish or check | bot reads only |
| 51 | Block Tower (`block-tower`) | preschool | 3 rules on the card; a button to finish or check | bot reads only |
| 52 | Second Chance Shed (`second-chance-shed`) | school | 4 rules on the card; a drag | bot reads only |
| 53 | Movie Night (`movie-night`) | school | 3 rules on the card; a drag | bot reads only |
| 54 | Wave Ribbon (`wave-ribbon`) | grownup | a button to finish or check; two-step taps | bot reads only |
| 55 | Pyramid Solitaire (`pyramid-solitaire`) | grownup | 4 rules on the card | bot reads only |
| 56 | Jar Sort (`jar-sort`) | preschool | 3 rules on the card; a button to finish or check; two-step taps | bot needs a look |
| 57 | Sum Crates (`sum-crates`) | school | 3 rules on the card; a drag | bot reads only |
| 58 | Playdate Workshop (`playdate-workshop`) | school | 3 rules on the card; a button to finish or check; turning | bot reads only |
| 59 | Crossword (`crossword`) | school | 3 rules on the card; a drag | bot reads only |
| 60 | Ribbon Workshop (`ribbon-workshop`) | grownup | 4 rules on the card; a button to finish or check | bot reads only |

The rest of the 205 follow in the same order. A grown-up's notes on a game in [OBSERVATIONS](../OBSERVATIONS.md) move it to the front.
