# Puzzle Pals deep dive

*ID `puzzle-pals` · bands lap, toddler, preschool, pre-K, school · levels 1–7 on 2026-10-10 · session `claude/zealous-franklin-64zmgc` ([PR 89](https://github.com/rjdunlap/neo/pull/89))*

## The game today

She drags pieces of a code-drawn picture into a frame. When the last one is in, the picture comes alive: the friend hops, makes its sound, and the voice says "You made a cow on the farm!". The learning purpose is part–whole and spatial reasoning (which part goes where), with fine motor control in the drag.

| Level | Plan (`PUZZLE_PLANS`) | Cut | Guide in the frame | Bands whose window includes it | What she decides |
| --- | --- | --- | --- | --- | --- |
| 1 | One half is already in place | 2×1, 1 placed | faint picture | lap (1–2) | nothing much: one piece, and anywhere over the frame finds the last empty place |
| 2 | Put two halves together | 2×1 | faint picture | lap, toddler (2–4) | which half goes left, which right (nearest empty place wins) |
| 3 | Three strips | 3×1 | faint picture | toddler | left to right order, against the faint picture |
| 4 | Four pieces | 2×2 | faint picture | toddler, preschool (4–6) | four places, matched to the faint picture |
| 5 | Six pieces, empty frame | 3×2 | none | preschool, pre-K (5–7) | places from the pieces alone |
| 6 | Nine pieces, empty frame | 3×3 | none | preschool, pre-K, school (6–7) | the same, nine places |
| 7 | Twelve pieces, empty frame | 4×3 | none | pre-K, school | the same, twelve places |

Windows are in `index.ts`: lap 1–2, toddler 2–4, preschool 4–6, pre-K 5–7, school 6–7. The unchanging parts: 600×420 picture units (`PICTURE_W/H`), the picture rendered once into a `RenderTexture` and cut into sub-textures, a tray under the frame (one row up to four pieces, two rows otherwise), nearest-empty-place drop (`dropSlot`; for two pieces or fewer, anywhere over the frame counts).

**What a round draws from.** `SCENES` is six fixed scenes: cow (barn and fence), duck (pond), bunny (garden), cat (party balloons), bear (woods), dog (ball). The seed changes the sun's side, the cloud's side and the flowers' small shifts, so a scene looks a little different each time, and the choice of scene is `rng.pick`. Only these six critters are used; `pig` (and `oink`) and `pip` are not.

**Misses and hints.** Dropping off the frame is free exploration: the piece floats home with no word. A drop on a wrong place is a boing, a miss and "Hmm, that piece goes somewhere else. Look at its picture!"; the second wrong drop in a row counts one hint and glows the first waiting piece in the tray and its place. A correct placement resets the streak. The round always finishes; there is no way to fail.

**Couplings.** How-to card: four `LevelLine` steps (`src/content/howto.ts`). Ghost finger: `autotouch()` drags `nextToPlace` to the middle of its own place (a unit test runs 50 seeds per level; `fingerdemo` played levels 1–7 with no wrong move). Voice: `puzzle.ghost`, `puzzle.start`, `puzzle.wrong`, `puzzle.hint`, `puzzle.done`. Home land: Puzzle Peaks. Music `STYLES.paint`. The sticker art is `pictureThumb(seed, 170)`; the map icon is `puzzleIcon()`. The browser case plays levels 1–7 (`scripts/browser-check.mjs`). No couch entry, journal entry, picnic step or saved creation.

**Known gaps (read from the code; none has been seen on a device).**

1. **Levels 5–7 can ask for a guess.** There is no picture to look at (the faint copy stops after level 4), the pieces are plain rectangles, and `drop()` accepts only the exact column and row. Reading `pictureScene` in `art.ts` (the picture is 600×420, the horizon at about y 244, the sun at x 90 or 510 and the cloud on the other side):
   - **12 pieces (4×3, cells 150×140):** in the duck, bunny, bear and dog scenes the two middle cells of the top row (x 150–300 and 300–450, y 0–140) hold nothing but sky. The cloud's edge reaches 6 units into one of them at most, which is a few pixels at tray scale. They look the same, so putting one into the other's place is a boing, a miss and "that piece goes somewhere else" when the answer was reasonable. The cow's roof and the cat's balloons give those scenes a feature in each cell.
   - **Left or right of two flowers.** The ground row of every scene is grass with one flower per column (pink, yellow, purple, orange from the left, jittered by up to 20 units). Nothing on a piece says which column its flower belongs to, so at 9 and 12 pieces some places can only be found by trying.
   - **9 pieces (3×3, cells 200×140)** have one blank top-middle cell, so elimination can find it; the flank pieces at the bottom (pink flower versus orange flower) are still a coin flip. 6 pieces (3×2) are similar.
   - Why it matters: misses and hints decide the adaptive level. A level with places she cannot know could send her down by itself (four misses, or two hints, in two rounds). I have not measured this; the claim is a prediction from the rules in [AGENTS.md](../../AGENTS.md#adding-or-extending-a-minigame). This was worked out from the drawing code and coordinates, not from a screenshot. Slice 1 starts with a screenshot of the 12-piece tray before anything changes.
2. **Six scenes, one per animal.** After a few rounds she has seen them all; the roadmap's chunk 13 item 1 names this. Adding scenes is not free: stickers store only `{ game, seed }` and `pictureThumb(seed)` does `new Rng(seed).pick(SCENES)`, so growing the list silently changes the picture on every sticker she already owns (and `puzzleIcon()` on the map, which uses seed 2).
3. **The how-to step for levels 5+ is open-ended** (`{ from: 5, … }`). It would still show on a level 8, which is the trap Opposites' write-up found. Bound it with `to: 7` before any new level.
4. **The hint is the first piece in the tray's shuffled order,** not a useful piece, and the spoken hint says "the glowing spot" with no spatial word.
5. **Nothing for a one-year-old who cannot drag yet.** Lap starts at a drag.
6. Person checks still open: lap level 1 with a real child, the iPad ([roadmap](../ROADMAP.md#needs-a-person-or-a-device)).

**Target sizes.** At 1024×768, tray pieces are drawn at `min(board scale, 100/ph, 130/pw)`, which is 91 tall at 3×3, 95 wide at 3×2 and 107×100 at 4×3. The 100-unit target rule is met by the hit area, which pads each piece by 10 local units on every side (121×114 at 4×3, 143×104 at 3×3). Any new cut has to keep both numbers; see "Left out on purpose".

## Similar games

The genre is the jigsaw: first the knob and peg puzzles of toddler wood, then picture jigsaws with more pieces, then the grown-up jigsaw with rotation, edges and a picture on the box. Apps copy that ladder almost exactly, mostly as **piece count alone**. Store listings are the developers' own words and change often. **Every page below was read through search summaries; the page fetches failed in this session, so none of the details is quoted from the page itself.**

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| *Toddler Jigsaw Puzzles 2-5* ([listing](https://appgoblin.info/apps/6787705540)) | app, ages 2+ | Three levels (4, 9 and 16 pieces) and every picture plays at any level | **Separate the picture from the difficulty**: the same scene at any size, which Puzzle Pals already does | its in-app purchases if any |
| *Pirate Preschool Puzzle* ([App Store](https://apps.apple.com/app/id868206299), [TouchArcade](https://toucharcade.com/games/pirate-preschool-puzzle-toddler-games-complete)) | app, ages 1–6 | Twelve puzzles; a parent raises the piece count from 9 to 24 and can remove other helpers | **Helpers that fade** (our ghost, then a lid, then nothing) | the parent-only setting; ours adapts |
| *Monster Games for Kids: Jigsaw Puzzles HD* ([TouchArcade](https://toucharcade.com/games/monster-games-for-kids-jigsaw-puzzles-hd-gold)) | app | Piece count rises from 9 to 24 | confirms a ceiling around two dozen for this age | piece count as the only growth |
| *Preschool jigsaw puzzles* ([listing](https://www.appspy.com/app/85073227/preschool-jigsaw-puzzles)) | app | 4, 6, 9 and 12 pieces, then a harder "Rectangles" mode; progress saved per size | a **different kind of cut** as a later mode, not only more pieces | per-size progress screens |
| *Binky Puzzles* / *Toddler Puzzle: Games for Kids* ([App Store](https://apps.apple.com/app/id1606375591)) | app, ages 2–5 | Five modes: cut-out, jigsaw, rotate, ABC and number puzzles | a **rotate mode as its own step**, apart from piece count | the ABC and number puzzles (other games hold them); it is free with purchases and the listing does not say how rotation ramps up |
| *Jigsaw Explorer* ([overview](https://www.educatorstechnology.com/2023/03/jigsaw-explorer-free-online-jigsaw.html), [older review](https://old.imaging-resource.com/SOFT/jigsaw-explorer/index.htm)) | web, grown-ups | Rotation can be switched on, an **Edges only** filter hides the interior pieces, a **box top** shows the finished picture, and several people can work at once | **the box picture** (our lid), **edges first** as a way in, and rotation as an option | the piece-count ceiling (hundreds), saving, multiplayer |
| Knob and peg puzzles (Melissa & Doug jumbo knob puzzle, [HABA's guide](https://www.haba-play.com/en-at/magazine/parenting-psychology/physical-development/puzzling-for-development), [Science Insights](https://scienceinsights.org/what-skills-do-puzzles-develop-in-toddlers/)) | physical | Up to about 8 chunky pieces from about two, 6–12 piece floor puzzles for 2–3, 12–24 pieces for 3–4; the sources disagree by a few months | a **piece you can grab and a place it fits**; our levels 1–4 follow this; the piece counts here are rough guidelines | nothing; the knob is the gesture |
| A homemade puzzle (cut up a picture; [DREME](https://dreme.stanford.edu/?p=1836)) | physical | Fewer pieces first, and the grown-up names where each piece goes | the existing off-screen suggestion | nothing |
| Our own *Tangram Town* and *Quick Tricks*' Parcel Turn | island games | Turning a piece by tapping (Tangram Town's turn button on the selected piece; Parcel Turn needs a half or quarter turn to fit) | **turning needs no new gesture**: the island already has a tap-to-turn habit | the two-finger twist |

**Learning and developmental sources.**

- **Puzzle play and spatial skill.** Levine, Ratliff, Huttenlocher and Cannon (2012), *Early puzzle play: a predictor of preschoolers' spatial transformation skill* (the sources I saw give *Developmental Psychology* 48, 530–542). They followed 53 child–parent pairs at home from 26 to 46 months; children who played with puzzles did better on a mental transformation task at about 54 months, controlling for income, education and parents' overall language, and more play predicted more skill. Puzzle quality (difficulty, parent engagement, parent spatial language) counted. The authors caution that it is correlational. I read [ScienceDaily](https://www.sciencedaily.com/releases/2012/02/120217101906.htm) and [UChicago's summary](https://news.uchicago.edu/story/puzzle-play-helps-boost-learning-important-math-related-skills) through the search tool, not the paper. This is the reason for the **spatial words** in the hints and the co-play line.
- **Spatial words to say.** [DREME at Stanford](https://dreme.stanford.edu/?p=1836) suggests pairing puzzles with words like straight, flat, curved, edge, inside, outside, long and short, and with gestures; it suggests homemade puzzles. I could not confirm "corner" or "next to" on that page, so the voice words below are my choice, not its list.
- **Spatial assembly and early maths.** Verdine et al. (2014), *Deconstructing building blocks: preschoolers' spatial assembly performance relates to early mathematical skills* (Child Development); a companion study in the Journal of Experimental Child Psychology. I read the press release and abstracts through search, not the papers. A reason the game is more than a toy; no age claim is drawn from it.
- **Rotation develops between three and five.** Frick, Hansen and Newcombe (2013, *Cognitive Development*): in a puzzle-like task children chose which of two asymmetric figures would fit a hole, shown in seven orientations; the share of children above chance rose from 10% of 3-year-olds to 95% of 5-year-olds, and mean accuracy from 54% to 83% ([PDF](https://sonar.ch/documents/305957/files/FrickHansenNewcombe_CogDev13pp.pdf), [a touch-screen version](https://boris.unibe.ch/117591) for 3½ to 5½). The numbers are from search summaries. This is the basis for putting turning from pre-K and letting a turned piece never be a miss.
- **What a small hand can do on glass.** Aziz et al.'s iPad gesture studies of children aged 2 to 4 ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4969291), [Loughborough](https://repository.lboro.ac.uk/articles/journal_contribution/Selection_of_touch_gestures_for_children_s_applications_repeated_experiment_to_increase_reliability/9402956)): 4-year-olds managed the common gestures; some 3-year-olds had trouble with two of them; a high share of 2-year-olds struggled with free rotate, drag-and-drop, pinch and spread. A design article summarized there says children under five often lose contact in a drag and suggests tap-and-tap. I could not open the PMC page to confirm what it is, so these details are **secondhand**. They support two things: no two-finger rotation anywhere, and a **tap-only first step for lap**.
- **Piece counts by age** are rough: the sources above disagree, and a HABA-style "24 pieces from three" is a toy-box guide, not a standard.

## What makes sense here

- **Fix fairness first.** The reasonable-answer-marked-wrong rule applies to a hidden twin as much as to an arguable word. Before any new scene or turn level, the 12-piece tray needs pieces that can be told apart and a way to find the place. This follows Opposites' order (guards before new content).
- **The helper ladder is the game.** The levels already fade a helper (a one-piece start, then a ghost). The natural continuation is a faint ghost, then **a small copy of the finished picture, like the lid of a box** (Pirate Preschool lets parents remove helpers; Jigsaw Explorer has a box top), then no copy for the few rounds that are about something else. An empty frame with no copy at all is not a harder puzzle, it is an unanswerable one.
- **Grow by decision, not by piece count.** Twelve pieces is the cap on this screen (below). New levels change what she decides: which way up a piece goes (turning), which picture it belongs to (sorting two pictures), which piece is wrong (mending). None adds a timer, a lives count, clutter or a memory load.
- **Rotation is the research-backed next step** (Frick, Hansen and Newcombe; Binky's rotate mode; Jigsaw Explorer's rotation) and the roadmap's old round-two proposal ("pieces that arrive turned"). Tap to turn, never a twist. A piece dropped in the right place but not turned is **not** a miss: it hops back with "Turn it round!".
- **Edges first is a strategy, not a rule.** Jigsaw Explorer's "Edges only" is for experts; here the flat sides show on the edge pieces and the hint starts at a corner, so she can learn the strategy from play. Nothing is locked.
- **Spatial words are the cheapest research-backed gain.** Levine's measure of puzzle quality includes spatial language. The glow already shows where to go; the voice can say "at the top", "in the corner", "next to the flower".
- **Fresh content is cheap but has a catch** (stickers). Twelve scenes are better than six, and they teach seasons and weather words; but the sticker mapping has to be pinned first.
- **Long-term arc.** Lap: a piece hops in, then one drag. Toddler: halves and strips over a faint picture. Preschool: four, then six pieces. Pre-K: six to twelve pieces with a lid, then turned pieces and two pictures in one tray. School: mending a picture and quarter turns.

## Proposed ladder

### Fresh content inside existing levels

In build order; none renumbers a level.

- **Fairness guard (slice 1).**
  - `art.ts` exports each scene's **feature boxes** (sun, cloud, barn roof, trees, balloons, fence, pond, flowers, ball, the friend), so a test can see what each cell holds.
  - Make the art put at least one distinct feature in every cell of the largest grid: a seeded bird, kite or extra cloud at a different spot in the sky (the duck, bunny, bear and dog scenes have a blank sky band), and flowers chosen so each ground cell differs in more than a shifted pink.
  - Test: for every scene, seed and level plan, every cell holds a feature covering more than a sliver (say 600 square units, about 1% of a 4×3 cell), and no two cells hold the same feature set. The 4×3 duck case fails today.
  - The alternative is to **accept a drop into a visually identical place**: it needs pixel signatures read back from the render (slow in a test, a guess in play) and still leaves the flower row unknown, so I lean to the art fix. Turned pieces make the same guard essential (a plain sky piece looks the same turned, so a wrong turn could not be seen).
- **A box lid for levels 5–7.** A small copy of the finished picture beside the frame (about 170×119, in the left strip, clear of the home button and the pet). Shown from level 5 (decision 1). It is the same picture the pieces were cut from, so it cannot disagree with them. A layout check at portrait and the phone view is part of the slice.
- **Flat sides, then a useful hint.** From level 5, pieces on the picture's edge draw a thicker flat rim on their outer sides (corners get two); a `hintPiece(plan, placed)` function picks a corner, then an edge that touches something placed, then any piece next to a placed one, in place of "first in tray". Test: the hint is always an unplaced piece, is a corner while a corner is waiting, and finishes any board.
- **Spatial words in the hint and the finish.** `puzzle.hint.corner`, `.top`, `.bottom`, `.left`, `.right`, `.middle` chosen by `whereWords(plan, piece)` ("It goes in the top corner!"). Test: every plan and piece has exactly one description; corners, edges and middles of 3×3 and 4×3 are labelled as expected. Device speech is unchecked; the lines are short and plain.
- **Pin the sticker pictures, then twelve scenes (slice 2).** `SCENES` becomes data with its own `id`, `place`, `animal`, `sound`, `what`, sky and ground, and a draw function per place instead of a `switch` on the animal. Stickers and the map icon keep using the first six so existing seeds stay put; a test pins seed → scene for seeds 1–200. Six new places with existing critters and props:
  - **a pig in the mud** (`pig`, `oink`): a brown puddle and a muddy ground.
  - **a cow in the snow**: a pale sky, white ground, a few snowflakes.
  - **a bunny in the autumn leaves**: orange and red leaves, a low sun.
  - **a cat at night**: a dark sky, a moon, stars at fixed spots.
  - **a bear at a picnic**: a blanket and fruit props the island already draws.
  - **a dog in the rain**: a grey sky, a few streaks and a doghouse.
  - Tests: every scene has a unique `id` and `what`; a valid animal sound; its feature boxes pass the fairness test at every plan; every picture has a distinct sky or ground from at least two others (so two pictures in one tray, level 9, can be told apart). A portrait screenshot of the 12 pictures at 4×3.
  - The finished picture's friend already has a cheer and a sound. Seasons and weather give new words for the voice to use ("a cow in the snow").
- **A grown-up tip: say where.** The `coplayHint` already asks what is in each piece. Add: "Say where it goes: top, bottom, corner, next to." This is the one co-play change the research directly supports.
- **Sketches, not slices.**
  - **{pet} in the picture:** her own pet joins one scene (`ctx.petSpec`), so the finished picture comes alive with her pet. The sticker cannot use it (its `sticker(seed)` has no context), so it would be a `pip` scene only in play.
  - **Pictures I have put together,** a journal row per scene seen, from `RoundResult.discoveries`. Needs a journal game, a save field and a line per scene; revisit past twelve scenes.
  - **Her own picture:** cut a kept picture (Stamp Studio or Pixel Pictures) into pieces. Blank areas make twins everywhere, so it waits on the twin decision (decision 2) and on whether a kept picture may be used as game content.

### New levels on top

Windows after this ladder: lap 1–2, toddler 2–4, preschool 4–6 **unchanged**; **pre-K 5–9** (was 5–7); **school 6–11** (was 6–7; the lower bound stays 6 so saved levels are not moved). A new level is appended and never renumbers a saved level. Levels 8–11 run easy to hard as I read them; the order is decision 3.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | **Turn it round** (half turns) | pre-K, school | A 3×2 puzzle with the lid; three pieces arrive upside down in the tray, with a small turn arrow on them. Tap a piece: it turns half a turn (and back); then drag it | which pieces are upside down, and which way up each goes | Turning is free and never a miss. A turned piece dropped in the **right place** hops back with "Turn it round!"; in the **wrong place** it is a miss, as today. A second miss glows the place and, if the glowing piece needs turning, makes its arrow pulse | the turned set is never empty and never all pieces; two turns restore a piece; a drop in the right place and the wrong turn is not a miss; the bot taps then drags (`autotouch` returns the tap first) | `turn` state on the piece (0 or 2), a tap on a piece that does not move (check it does not fight `draggable`); two voice lines; a how-to step bounded to the level. Frick, Hansen and Newcombe; Binky and Jigsaw Explorer |
| 9 | **Two pictures, one tray** | pre-K, school | Two 2×2 pictures side by side (a cow in the snow and a cat at night), faint ghosts under each, eight pieces mixed in one tray | which picture a piece belongs to, then its place | A piece dropped on the other picture is a miss: "That one is from the cat's picture!"; two misses glow its own place. The two pictures are always from different scenes | the pieces in the tray are exactly the union of both boards; the two scenes differ in sky or ground (so a sky piece belongs to one board); every piece can be told apart from every piece of the other board; the bot places all eight | two board layouts (portrait and landscape); `dropSlot` takes the board as well as the place; a voice line per scene name; seeds a pair of scenes. Costlier than level 8 |
| 10 | **Mend the picture** | school | A finished 3×3 picture in which two pieces have swapped places. "Two pieces are mixed up! Swap them." Tap one, tap the other | spotting what does not fit (a hill that breaks, a flower in the wrong column), a first look at error-finding | A swap that does not make both right swaps back with a soft boing; "That one fits here. Find the pieces that don't match."; the two odd pieces pulse after two misses | the two swapped pieces are never look-alikes (the fairness test's feature sets differ); swapping them restores the picture; any other swap puts both back; the bot taps both | a mode that starts with all pieces placed and a swap (like Robot Path's fix-the-program idea); one voice line; a lid is not shown (it would give the answer away; the pieces themselves are the clue) |
| 11 | **Quarter turns** | school | A 4×3 puzzle of 140-unit squares cut from the picture's middle 560×420, with the lid; five pieces arrive on their side or upside down. Tap to turn a quarter turn | which way up, with four ways | as level 8; the turn arrow glows after two misses | four taps restore a piece; the square crop's cells are 140×140 and the crop keeps a feature in every cell (the fairness test again, on the crop); the bot's tap count is the shortest way round | the square crop needs `PICTURE_W/H` to become per-plan fields; the lid becomes the crop; tray pieces are 100 square. The costliest of the four |

**Cost the build must not forget.** The how-to card gains a bounded `LevelLine` per new level (and the existing "empty frame" step gets `to: 7`). `registry.test.ts` lists the game's ranges, so the band rows change with levels 8 and 9 and again after 11. The browser case at `scripts/browser-check.mjs` loops over levels; it extends one at a time. `fingerdemo` plays each new top level, so `autotouch()` grows a branch for tap-to-turn and for the swap. Every new voice line goes in `src/content/voice-script.ts`. The home-spot and map icons do not change.

### Younger-band openings

**None to add.** The game already serves lap from level 1, the youngest band. What would help a one-year-old sits below level 1.

### Levels below level 1 (waiting on the level-order decisions)

Both wait on [how levels are ordered for a band and whether a band's range may skip](../ROADMAP.md#waiting-on-the-developer): an easier level appended above level 7 would make "step up" run backwards for lap.

- **Tap to hop in** (lap). One piece, the rest of the picture already placed and a whole-screen tap target; any tap sends the piece hopping into place and starts the picture. The reason is that tapping is the first gesture a toddler has and dragging comes later (Aziz et al., secondhand above). Rule test: any tap anywhere completes the round with zero misses; the bot taps. Cost: a mode and a piece that is a tap target, no art. A person check: whether a one-year-old finds the drag at level 1 hard enough to need it.
- **Which piece fits?** (toddler and preschool). The picture is finished except one hole, and three pieces wait: the real one and two cut from other scenes (a different colour sky or ground). Drag the one that fits. Mistakes get the boing and a spoken hint; the real piece glows after two. A harder version with same-scene decoys (the bird, the fence, the hill) is a pre-K sketch: it needs edge continuity to answer, and the twin guard to be fair. Rule test: exactly one candidate matches the hole; decoys from other scenes differ in sky or ground; same-scene decoys come from other cells of the same picture and are not twins of the target. Cost: a mode and a hole; the pieces and the cutting are already there.

### Left out on purpose

- **More than twelve pieces.** At 12 the tray pieces are exactly 100 tall and the board cells ~130 tall; at 16 the board cells would be under 100 and the tray would overflow `spread` at its gap of 145. A paged tray could fix it, but it would add clutter and a place to lose a piece. Piece count stays at twelve.
- **Stacked halves and strips** (1×2, 1×3) and **2×3 cuts.** They are flat, so tray pieces would scale to between 56 and 84 units tall, under the target rule.
- **Interlocking jigsaw edges.** The pieces are plain rectangles by design, and a drawn tab would need a drawn socket and a different drop rule. A shape cue is not needed once the lid and flat sides exist.
- **A free rotation or a two-finger twist.** Aziz et al. found young children struggle with free rotate.
- **A timer, par or best time.** Ruled out by the project; Jigsaw Explorer's times and multiplayer are left out too.
- **Edges-only as a lock.** Nothing is gated; flat rims and a hint that starts at a corner teach the strategy.
- **Hundreds of pieces and saved half-finished puzzles.** Different game; this one finishes in minutes.
- **Letters and numbers on the pieces** (Binky's ABC and number puzzles). Other games hold them.
- **A couch entry.** A calm drag-and-drop that the co-play line already covers.
- **In-app purchases and ads** found on the reference apps.

## Decisions for the developer

1. **A box lid from level 5, or only from level 6?** Lean: from level 5. Real jigsaws come with the picture; without it levels 5–7 can hide an unanswerable place. A lid does make those levels easier than they are written, though a small copy to match is still work for a five-year-old. The alternative is a hold-to-peek lid.
2. **Twin pieces: fix the art or accept look-alikes?** Lean: fix the art and add the test; accepting twins needs pixel signatures and still does not settle the flower row.
3. **Level order and windows.** Lean: 8 Turn it round, 9 Two pictures, 10 Mend the picture, 11 Quarter turns; pre-K 5–9 and school 6–11, with school's lower bound staying 6 so no saved level is moved. Level 11 could be dropped without breaking the others.
4. **Stickers for the new scenes.** Lean: the sticker art and the map icon stay on the first six scenes forever (a pinned test), so no saved sticker ever changes picture. The cost: a sticker never shows a pig in the mud. A scheme that gives new stickers the full set means a stored version, which the sticker has no field for.
5. **A tap-to-hop first step for lap.** Waits on the level-order decisions already on the roadmap. It also raises a small shell question: should every drag game offer tap-and-tap for under-fives? Not in scope here; recorded.
6. **Her own picture as a puzzle** (a kept picture cut into pieces) and **{pet} in a picture** are sketches; each needs its own call (what a kept picture may be used for; whether a scene may differ per player).

The level-order decision already has a row in [Waiting on the developer](../ROADMAP.md#waiting-on-the-developer); the others are added there as one row.

## Build slices, in order

Each is sized for one session. The slices that add a level are built in level order so saved IDs stay unbroken.

1. **Fairness guard, the lid, flat sides and a useful hint** (ready; the lid depends on decision 1). Screenshot of the 12-piece tray first; feature boxes in `art.ts`; no-blank-cell test; lid; flat rims; `hintPiece` and `whereWords`; the how-to `to: 7` fix; the co-play line. Tier: typecheck, the game's rule tests, the how-to test, one filtered browser play at levels 5 and 7 and one portrait screenshot. Update the GAMES.md entry and the README row.
2. **Scene data, pinned stickers and six new scenes** (ready). Tier: rule tests including the seed pin, then a screenshot of the new pictures. Update the "six scenes" counts in GAMES.md and the README row, and chunk 13 item 1.
3. **Level 8, Turn it round** (ready after 1; band row becomes pre-K 5–8). Tier: new level on an existing interaction, plus `fingerdemo` at level 8.
4. **Level 9, Two pictures, one tray** (ready after 2 and 3).
5. **Level 10, Mend the picture** (ready after 2).
6. **Level 11, Quarter turns** (ready after 3; the square crop is its own sub-slice).
7. **Below level 1: tap to hop in, and Which piece fits?** (waits on the level-order decisions).
8. **Sketches:** {pet} in the picture, a journal row per picture, her own picture (design first).

## What was built in this session

Nothing in the game: this session wrote the research and the plan, and the docs were updated as the procedure says. Checks: docs only (links and `git diff --check`).
