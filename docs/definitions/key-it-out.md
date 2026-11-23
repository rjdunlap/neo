# Key It Out, levels 1–4 (definition)

Documentation packet, 2026-11-23, branch `claude/define-key-it-out`, [PR #2029](https://github.com/rjdunlap/neo/pull/2029). Study follow-up IR4 from [informational reading](../deep-dives/subjects/informational-reading.md#candidates-and-fit); placement settled by the [2026-11-17 record](../archive/DECISIONS-2026-11-17.md#games) (Lantern Lake pages, so no capacity test is owed). Proposed game `key-it-out`; nothing is registered or implemented. **Docs only.** Two build batches follow below.

## What you do

A warden has sketched the creatures that came to Lantern Lake this season, and none of the sketches has a name yet. The lake's field guide has a page for the season: an identification key of numbered yes-or-no questions that ends in the creatures' names and, at the higher levels, a table of each creature's habits. Pick a sketch, work through the key from what the sketch shows, and give the sketch its name. Some sketches are unfinished, so the key alone leaves two or three names open; the warden's margin notes, the habits table and the names already used settle the rest. Whenever three unconfirmed sketches carry their right names at once, the warden stamps those three and they are settled for good.

The learning is using a reference document to answer a question: following a keyed procedure exactly, bringing two parts of a page together (the key and the table), and reasoning from what a document leaves out. "Keying out" is the naturalists' own phrase for it.

Use stable level IDs 1–4 and the `grownup` band only. Use Story Grove as the learning region, the home of Look It Up, and Logic as the challenge. Add one Lantern Lake tile through the existing land paging; it lands on a later page, and every page keeps its targets. Use the classic round contract: level progress and one sticker. A page of names is round state. It carries no economy, inventory, streak, saved puzzle or growing guide.

Stamping in threes comes from *Return of the Obra Dinn*, as the study recorded it: a single right name is never confirmed alone, so a guess tells the player nothing, and no guess is punished.

## Identity and overlap

- **Look It Up** (`look-it-up`) finds one friend's page with tabs and reads one fact from it. Its animals and facts are real and fixed. Key It Out's creatures are invented and redrawn every round, its document is a branching key, and one page must settle nine sketches together.
- **Who Am I?** and **Fewest Clues** narrow a set of suspects from spoken clues. Here the player reads the evidence off a drawing and walks a printed procedure; nobody gives clues.
- **Mystery Grid** (`logic-grid`) and **Picture Logic** mark a grid from clues. Key It Out shares their free marking and their taste for exclusion, and nothing else.
- **The discovery journal is not changed.** The season's guide is a round's puzzle sheet. It never fills from discoveries.
- **Not here:** real animals or real facts (so no fact reviewer is needed); death or injury as a subject; a timer; a mistake cap; a daily page; typed answers; a camera.

## The creatures, the sketches and the guide

Keep the model in `logic.ts`. It is small and closed.

**Looks.** A creature's look is one value for each of four parts, so there are 81 looks.

| Part | Values | How a sketch hides it |
| --- | --- | --- |
| Head | crest, horns, long ears | A smudge over the top of the head |
| Coat | plain, spotted, striped | The body is left as an outline, not filled in |
| Tail | fanned, curled, tufted | Reeds stand in front of the tail |
| Feet | webbed, clawed, hoofed | The creature stands in the water |

Every part always has a value, so "nothing there" never has to be told from "hidden". A hidden part also carries a small question-mark tag, so it never reads by drawing style alone.

**Habits** (levels 3–4). A creature has one value for each of three habits: its **call** (whistles, clicks, hums), its **time** (dawn, noon, dusk) and its **food** (reeds, berries, snails). Two creatures may share habits.

**Names.** Twelve invented names, each starting with a different letter so a name is quick to find on the page: Dabbin, Fennow, Lurkin, Mollin, Ossip, Plish, Quorl, Snoon, Tibbet, Wumble, Yarrel, Zennet. The building session listens to each Kokoro clip and may respell a name that does not speak well. A name has no fixed look. The story is that the lake's creatures come back in new coats each lantern season and the wardens redraw the guide, so every round's page must be read, and no round can be answered from memory.

**A board** is made of:

- **The guide's creatures:** some of the twelve names, each with a look (all different) and habits.
- **The key:** numbered questions, each asking whether one part has one value ("Is the tail fanned?"). **Yes** and **No** each lead to a later question or end in a name. A key for *g* creatures has *g* − 1 questions. Questions are numbered the way printed keys number them: question 1 first, then everything under its Yes branch, then everything under its No branch, so Yes at question *k* always leads to question *k* + 1 or to a name.
- **The table** (levels 3–4): one row for each of the guide's creatures, in alphabetical order, giving its call, time and food.
- **The sketches:** numbered from 1 in page order. Each shows one of the guide's creatures, and no creature is sketched twice. A sketch may hide some parts and may carry margin notes, each giving one of its creature's habits ("Hums.", "Out at dusk.", "Eats snails.").

**A name fits a sketch** when nothing the sketch shows contradicts it:

- at each question on the path from question 1 to that name, if the sketch shows the part the question asks about, the sketch's answer is the branch the path takes (a question about a hidden part rules nothing out);
- each margin note matches that name's row in the table.

The key says only what its questions ask. A name reached through "Is the tail fanned? No" has a tail that is curled or tufted, and the key does not say which. So a sketch with every part showing fits exactly one name, and a sketch with a hidden part may fit several.

**The answer** gives each sketch the name of the creature it shows. **A board is valid** when the answer is the only way to give every sketch a name that fits it with no name used twice, and when the *chain* below reaches it.

**The chain** is the solver, the hint order and the difficulty filter in one. Start with no sketch settled. Repeat:

1. Take the lowest-numbered unsettled sketch that fits exactly one name not yet settled, and settle it with that name (**one name left**).
2. If there is none and the guide has exactly as many creatures as the page has sketches, take the first name in alphabetical order that fits exactly one unsettled sketch, and settle that sketch (**one sketch left**).

The chain *solves* the board when it settles every sketch. When sketches and names are equal in number, a board with one answer is always solved by the chain (a pairing that can be completed in only one way always has a sketch with one name left or a name with one sketch left). At level 4 the guide has three more names than the page has sketches, step 2 does not apply, and the filter keeps only boards that step 1 alone solves.

## Levels and the generator

| Level | Guide | Sketches | Hidden parts | Margin notes | Table | Kept when |
| --- | --- | --- | --- | --- | --- | --- |
| 1 · *By the key* | 6 creatures, 5 questions | 6 | None | None | No | No path in the key is longer than 4 questions |
| 2 · *Unfinished sketches* | 9 creatures, 8 questions | 9 | 4 sketches hide one part each | None | No | The chain solves it; at least 3 sketches fit more than one name; no path longer than 5 |
| 3 · *Margin notes* | 9 creatures, 8 questions | 9 | Every sketch hides one or two parts | One on every sketch | Yes | The chain solves it; at least 3 sketches need the table (a note rules out a name the key left open); at least 3 sketches still fit more than one name after the key and the table together; no path longer than 5 |
| 4 · *Twelve in the guide* | 12 creatures, 11 questions | 9 | Every sketch hides one or two parts | One or two on every sketch | Yes | Step 1 of the chain solves it; the same two "at least 3" conditions; no path longer than 6 |

**The generator** draws a board from `ctx.rng` and redraws until the level's filter keeps it:

1. Draw the guide's creatures: names from the twelve, distinct looks from the 81, and (levels 3–4) each habit at random.
2. Build the key from the top. For the creatures still together, list every question (a part and a value) that sends at least one of them each way, pick one from the seed, and repeat on each side until every creature stands alone.
3. Choose which creatures are sketched and shuffle them onto the page.
4. Choose the hidden parts and the margin notes as the level's row says.

A prototype of this generator and its filters, written with this packet and not committed, kept these shares of 20,000 seeded draws: level 1, 18,561; level 2, 10,436; level 3, 9,278; level 4, 1,966. So the generator needs about ten draws at level 4 and two or fewer below it. Every draw with one answer was also solved by the chain, at level 4 too (5,765 of 5,765). These numbers show the generator is practical. They are not rule-test totals: the build's tests check the properties below on their own seeds.

**What each level asks.**
- **Level 1** teaches the procedure: read the part the question asks about, take the branch, and stop at a name. Six lookups and two stampings.
- **Level 2** makes the key leave names open. A sketch whose tail is behind the reeds cannot answer a tail question, so both branches stay open, and the name that another sketch has taken is no longer available.
- **Level 3** brings the second document in. The key leaves Quorl and Plish; the note says the creature hums; the table says Plish clicks.
- **Level 4** weakens exclusion. Three of the guide's creatures did not come this season, so "the only name left over" stops being an argument, and each sketch has to be settled from its own evidence and the names already settled.

One board is a round at every level. Redisplay the same board, names, stamps, chosen sketch and open page through resize and rotation.

## Naming, stamping, feedback and credit

- **Choosing a sketch.** Tap a sketch on the Sketches page, or step with the arrows on the chosen-sketch strip. The chosen sketch stays in view on every page of the guide, with its hidden-part tags, notes and name plate.
- **Reading the key.** Tapping a question speaks it. Tapping its **Yes** or **No** lights the question that branch leads to and scrolls it into view: a finger on the page, nothing more. It checks nothing, and the game never answers a question for the player.
- **Giving a name.** Tap a name where a branch of the key ends, or at the head of a table row, to give it to the chosen sketch. A name can sit on only one sketch: giving a name that sits on another unstamped sketch moves it, and that sketch's plate goes blank. Tapping the chosen sketch's own name plate lifts its name off. In the guide, a name in use shows the number of the sketch it sits on.
- **Free moves.** Choosing, reading, following branches, giving, moving and lifting names and re-hearing a question are always free, and nothing is refused.
- **Stamping.** After every naming, count the unstamped sketches that carry their right names. At three, the warden stamps those three, one at a time on pentatonic notes; their plates lock and their names grey out in the guide. Because a naming changes at most one sketch from wrong to right, exactly three are stamped each time, and six or nine sketches go in two or three stampings. Stamps say nothing about the other names on the page.
- **A full page that is wrong.** When every unstamped sketch carries a name and no stamping follows, the page is a worked answer that does not hold. Play the gentle boing. The explanation takes the lowest-numbered unstamped sketch whose name does not fit it, and says what on the page rules the name out: "Sketch 4 is named Quorl. The key reaches Quorl through a fanned tail. This tail is curled." or "Sketch 6 is named Plish. The table says Plish clicks. The note says this one hums." Such a sketch always exists, because only the answer gives every sketch a fitting name. The explanation does not say what the right name is. Count **one miss per distinct full wrong page** within a round; reaching the same page again replays the explanation, free.
- **Why a miss counts here.** A full page checks a worked answer: every sketch, the key and the table are on screen and settle every name before the last plate is filled. It is the same step as Check in Picture Logic or Cross in Truth Bridge. A page with a blank plate is never judged, so trying a name and looking again costs nothing, and lifting one name off before changing two keeps a revision from being judged halfway.
- **The second counted miss** gives one assisted hint, and **Help** asks for one at any time. The hint walks the chain and stops at the first step whose sketch does not carry its right name. It chooses that sketch, lights the questions on the right name's path (and its table row at levels 3–4), and says the working:
  - one name left: "Sketch 7 shows a fanned tail and spots, and its head is smudged. The key leaves Quorl and Plish. Plish is sketch 2. Name sketch 7 Quorl."
  - one name left, by a note: "Sketch 3: the key leaves Mollin and Yarrel. The note says it eats snails. The table gives Yarrel berries. Name sketch 3 Mollin."
  - one sketch left: "Only sketch 5 can be Tibbet. Every other open sketch shows something the key rules out for Tibbet. Name sketch 5 Tibbet."

  The player places the name. Repeating the current hint with no change replays it, free. Count each new hint once.
- **Hints always lead somewhere.** Following a hint puts one more right name on its sketch and never takes a right name off: a name it moves was on a wrong sketch. The rule test walks sampled wrong pages of sampled boards at every level and checks that following hints reaches the answer in at most as many hints as the page has sketches.
- **On the last stamping** the sketches colour in one by one, the hidden parts come into view (the reeds part, the creature steps out of the water), and the game finishes once through the normal shell with the round's misses and hints.

## Play and presentation

- **Scaffold and helpers.** Use the [new-game scaffold](../NEW-GAME.md) and the existing `onTap`, coach and round helpers. Check the [reuse map](../DESIGN.md#reuse-map) for a scrolling panel before writing one.
- **Upright phone first.** At 390 × 625 with captions and the active guide, set out the following, top to bottom:
  - the chosen-sketch strip: the sketch drawn large with its tags, its number, its notes, its name plate, and the two arrows;
  - the page tabs: **Sketches**, **Key** and (levels 3–4) **Table**, with **Help** at the end of the row;
  - the open page, filling the rest.
- **The Sketches page** is a grid three across (two rows at level 1, three otherwise) of small sketches, each with its number, its name plate and its stamp. It does not scroll.
- **The Key page** is one row for each question: its number, the question in words with the part's icon, and its Yes and No ends, each a tap target showing a question number or a name. With eight or eleven rows it scrolls inside its panel; the grown-up band allows a board that cannot fit to scroll.
- **The Table page** is one row for each creature: the name, then three cells with an icon and a word each. It scrolls the same way.
- **Targets.** Every tap target meets the grown-up minimum of 64 logical units, aiming for 100. A layout test checks the smallest target on each page at 390 wide and that the strip, tabs and at least three key rows fit above the caption at 390 × 625.
- **Landscape.** Put the Sketches page on the left, always open, and the strip, the Key and Table tabs and Help on the right.
- **Captions and the guide.** Reserve their space first.
- **Reading.** The questions, names and table words are printed, as befits a field guide for a grown-up. Every one of them speaks when tapped, and parts and habits carry icons, so the page never depends on print alone. Navigation to the game requires no reading.
- **Art.** Draw the creatures from the four parts with palette colours in Pixi `Graphics`, in a pencil-sketch style (outline and hatching) that colours in when a sketch is stamped. Every one of the 81 looks must read at the Sketches page's size: a unit test draws each look and checks that each part's three values produce different drawings, and the building session looks at a capture strip of all twelve part values and all four hidden forms. Draw the stamp, the reeds, the water, the smudge, the nine habit icons and the new hub icon (an open guide with a branching line ending at a small creature) the same way. Use existing confirmation sounds or pentatonic notes.

**Voice.** Keep the voice lines in `voice.ts`, and use the shell's Kokoro title and clip workflow. The parts, habits, names and sketch numbers are closed, so the spoken lines are a short finite list of whole lines with no slots:

- **Questions:** 12, one for each part and value ("Is the tail fanned?").
- **Names:** 12, each spoken alone when given to a sketch.
- **Habit words and notes:** 9 table cells ("Clicks.") and 9 notes ("Out at dusk.").
- **Fault lines:** 36 for the key (for each part, the value the key's path needs or bars and the different value the sketch shows: "The key reaches this name through a fanned tail. This tail is curled." and "The key reaches this name through a tail that is not fanned. This tail is fanned.") and 18 for the table (for each habit, the table's value and the note's: "The table says this one clicks. The note says it hums.").
- **Hint lines:** one for each kind of step ("Only one name still fits this sketch." "A note and the table settle this sketch." "Only this sketch can take this name.").

A miss or a hint speaks its fault or hint line while the sketch and the guide rows are lit, and the caption carries the whole working with the sketch number and the names. Say on the game's page that the caption is fuller than the speech. A unit test checks that every question, name, note, fault and hint a board can produce has a voice line. The instruction is `ctx.instruct`: "Name every sketch from the guide."

**How-to cards.**
- Level 1 shows one sketch keyed out: three questions light in turn down the Yes and No branches, and the name at the end goes onto the plate.
- Level 2 shows a sketch with its tail behind the reeds, a tail question whose two branches both stay lit, and one of the two names already sitting on another sketch.
- Level 3 shows a note ("Hums.") beside two open names and the table row that rules one out.
- Level 4 shows the guide's twelve names against nine sketches, with three names left unused at the end.

The ghost finger follows the chain on the seeded board: it chooses each sketch, opens the Key page and taps the right name.

**Co-play and off-screen.** In co-play, one person describes the chosen sketch aloud and the other reads the key and asks its questions; they swap after a stamping. Off-screen, write a yes-or-no key for five spoons, buttons or leaves from the garden, hand it to someone else with one of the five, and see whether your questions bring them to the right one.

**Grown-ups' wording.** Name what the game asks: "Follow a field guide's key to name nine sketched creatures." It makes no claim about reading ability or attention.

## Build batches

1. **`key-it-out 1`, levels 1–2.** This is the new game, the creature drawing, the key generator, naming, stamping in threes, the full-page miss and the chain hints.

   **Checks:** typecheck and unit tests, which cover:
   - the fit rule (a sketch with every part showing fits only its own name; a hidden part opens both branches);
   - the generator: over sampled seeds at each level, a kept board is found within 200 draws, has one answer, is solved by the chain and meets its level's row;
   - that the chain solves every sampled board with one answer at levels 1–2;
   - stamping exactly three at a time and never a wrong name;
   - that a full wrong page always has a sketch whose name does not fit, and miss counting per distinct full wrong page;
   - the hint walk;
   - the 81 looks drawing apart, and the layout test;
   - voice coverage;
   - registry, lands and paging.

   **Browser and build:** one filtered `keyitout` play at 390 × 625 with captions, reaching Lantern Lake through the normal grown-up route and its page. Finish level 1, then at level 2 fill the page wrong, fill it the same way again (no new miss), follow Help, rotate and finish with one sticker. Take one upright screenshot of the Key page with a chosen sketch and the capture strip of the part values, run `fingerdemo` at level 2, and build with the generated voice assets.
2. **`key-it-out 2`, levels 3–4.** This adds the habits, the margin notes, the Table page and the twelve-creature guide.

   **Checks:** typecheck and unit tests (the note fit rule, the generator and filters at levels 3–4, step 1 alone solving every kept level-4 board, the hint walk with note steps, voice coverage), one filtered play at level 4 with one full wrong page and one hint, one upright screenshot of the Table page, `fingerdemo` at level 4, and a build. The batch runs after batch 1.

Later proposals, not in these batches:
- a guide entry in prose ("the smaller of the two crested creatures") beside the key, for a harder second reading;
- a sketch that shows two creatures together, with a note about which stood where;
- a school form at the top of `school` with four sketches, nothing hidden and stamping in twos, which needs its own layout and wording check;
- the player writing a key for someone else to follow, from the off-screen activity.

## Source check

Nothing new was opened for this packet. The study's own sources stand as it recorded them: the *Return of the Obra Dinn* article was opened and gives the confirmation in threes, and the dichotomous-key lesson plan was read through a search summary only. That a pairing with only one completion always has a forced first step is a standard result on matchings, recalled and not opened; the prototype agreed with it on every draw, and the build's rule tests check it on their own seeds.

The parts, habits, names, filters, stamping rule and accounting are game rules. The creatures are invented, so no fact needs a source or a reviewer. Completing a round shows that the player followed this key on this page. It is not evidence about reading in general.
