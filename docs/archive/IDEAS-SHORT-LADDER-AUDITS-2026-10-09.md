# Short-ladder audits (2026-10-09 and 2026-10-10)

Moved out of [IDEAS.md](../IDEAS.md) on 2026-10-17: the three ladder audits that the [game deep dives](../deep-dives/README.md) turned into one researched plan per game. The dives are the authority now; these rows are history, kept so the dives' links still resolve.

## Short-ladder audit (2026-10-09)

An audit of every school-reaching game's ladder, read from each game's `levels(band)` and `describeLevel` and checked against its [GAMES.md](../GAMES.md) entry and level plans. The question is the roadmap's: where does a **meaningful next decision** exist, as opposed to a bigger number, a faster pace or more to remember ([depth before pressure](../../AGENTS.md#rules-for-every-activity))? A next level qualifies when it changes what she has to decide, reuses the game's own interaction, and has a property a unit test can assert (solvable, one clear answer, a hint that leads somewhere). The verdicts are judgments from reading rules and code; nothing was played and no child has used any of it.

### What the ladders look like

- **Two populations overlap.** 25 island games have a whole ladder of only four or five levels (the roadmap's number); 12 of them reach the `school` band, and 13 end at pre-K by design. Separately, 23 games give the school band only one or two levels. Counting both, 33 school-reaching games are short in one sense or the other.
- **Six levels is a convention, not a measure.** 28 of the 75 ladders top out at six, and the school band is usually its last two. A "school window" is whatever is left at the top, so extending every ladder evenly would be the wrong fix.
- **The top is what she meets most at 7 and 8.** At a band's last level two smooth rounds step up to nothing, so she replays it. A top level that is a toy-sized idea shows up as repetition.
- **How a level is added.** The plan lookups read (Pattern Train, Memory Match, Sink or Float, Song Maker, Rainbow Fingers) clamp the level to the table's length, so appending to the plan table and raising the school `max` is the safe edit; never renumber. A new level also needs its `describeLevel` text, `LevelLine` steps on the how-to card scoped to it, rule tests for the plan, and, for a game with a ghost finger, a bot that can play it, because `fingerdemo` plays each game's first and last level.
- **Two couplings to budget for.** 11 of the 23 short-window games have a ghost-finger bot (Bouncy Launch, Little Helpers, Rhythm Neighbors, Scoop Shop, Sink or Float, Song Maker, Size Parade, Jelly Drums, Memory Match, Pattern Train, Bubble Pop). Five are also couch games (Bouncy Launch, Rhythm Neighbors, Sink or Float, Memory Match, Pattern Train), but a couch trip names its level for each stop, so appended levels leave trips and courses alone.

### Extend: a real next decision, small to build

Mostly plan entries and rule tests; each row names any art, voice or layout it needs. *Tag:* **roadmap** = already named there; **new** = from this audit.

| Game (ladder top · school levels) | What the top level asks now | Next decision | Cost · tag |
| --- | --- | --- | --- |
| **Memory Match** (11 · 8–11) | Match fraction pictures to their names | *Same, said differently:* number word to numeral (one to ten), a fraction picture to its name, a clock face to its digital time. The pairing rule becomes equivalence of representations rather than the same look | S for number words (text cards, as letters are today); S–M for fractions and clocks, which need small new art: a card-sized fraction picture, and a clock face (Clock Tower's is drawn inside its own scene, so it would be shared). Check legibility after board scaling. Levels 10–11 built; remaining content and ladder are in the [deep dive](../deep-dives/memory-match.md). Bot and couch levels unaffected if card pairs carry ids. Sketch below |
| **Pattern Train** (12 · 8–12; **[deep dive](../deep-dives/pattern-train.md)**, which finds levels 10 and 11 play like level 4 and level 12's answer is always the smallest, and plans fixes plus 13 Odd car out, 14 Fix the train, 15 Same pattern in new pieces, 16 Build the same, 17 Make your own, 18 Stairs, 19 Up and down, 20 Start anywhere and a to-define 21) | Fill two cars of an AAB pattern | *The seventh car:* name a car far down the line from two shown repeats, then two things changing per car, then numbered cars that count by 2, 5 or 10. Generalizing the rule replaces continuing it. Fills the skip-counting hole | S–M · new. Numbered cars are a new car kind (today `shape`, `animal` and `bell`), and a train that runs off the edge is a layout change. Sketch below |
| **Pet Kitchen** (6 · 5–6) | Double a picture recipe | *Three quarters, please:* name a fraction and give that many equal pieces (two quarters make a half), then halve a recipe, choosing double or half from the card. The voice script's only fraction word today is "quarters" in the recut hint | S · new. No new art (it reuses the sandwich); it needs voice lines for the fraction words. The cheapest of the three. Sketch below |
| **Treasure Map** (4 · 1–4) | Follow directions from where the pet stands | A square found from two clues ("two right of the tree, one below the rock"), where the answer is where the clues meet | S · roadmap. Has a ghost finger, so the bot learns the new clue type |
| **Bouncy Launch** (5 · 4–5) ([deep dive](../deep-dives/bouncy-launch.md)) | Farther or nearer than last time | Predict which cloud a shown pull will reach, then launch and compare (an unscored prediction, like Sink or Float). Needs the pull-to-cloud mapping to be deterministic, which should be confirmed first | S–M · new. Ghost finger and couch game |
| **Rainbow Fingers** (6 · 5–6) | Mix two pots into orange, green or purple | *Paint the pumpkin:* recall that it is orange, then mix it from two pots. Joins the recall and mix modes that already exist | S · new. Modest |

### Extend later: a real next decision that costs more

A new interaction, authored art, a stated model, or a precondition.

| Game (ladder top · school levels) | Next decision | Why it waits |
| --- | --- | --- |
| **Ramp Race** (4 · 1–4) | Predict where the car stops, then roll | The finish rule and its half-marks (such as 1.5 × 3) are worked out before building; a recorded-trials table is a new screen ([E2](../ROADMAP.md#e2-middle-elementary)) |
| **Bug Builder** (7 · 6–7) ([deep dive](../deep-dives/bug-builder.md)) | *Fold a Friend:* predict where each spot lands when the wing folds over; later, which crease makes the bug match | Pairs with Mirror Brush (above); the crease-choice step belongs near age 9 |
| **Peekaround Island** (5 · 4–5) | *View from above:* which picture shows the island from the sky | A new top-down view to draw |
| **Block Tower** (6 · 5–6) ([deep dive](../deep-dives/block-tower.md)) | Unclear. The top level is already the optimization (reach the star with only N blocks), and a farther star with more blocks is a bigger number. A counterweight block behind the table edge, which lets the stack reach out, would be a different decision | Needs design first. `finish()` already searches every slot, so solvability and the fewest blocks would be cheap to test once a decision is chosen |
| **Puzzle Pals** (7 · 6–7) | Pieces that arrive turned, so she turns them to fit. **Planned in its [deep dive](../deep-dives/puzzle-pals.md)** as levels 8–11 (half turns, two pictures, mend, quarter turns), after a fairness guard | A tap-to-turn interaction with its own hint; more pieces is not a next decision |
| **Quick Tricks** (6 · 5–6) | A third show, the remix | The new gestures (crank, pour, loop) and a visible condition; shares its gesture test with Fill and Dump |
| **Song Maker** (7 · 6–7) | *Answer the phrase:* compose/revise an answer to a given four-note question | [Music study / M4](../deep-dives/subjects/RECOMMENDATIONS.md#music-and-instruments-recommendations) refines this existing mode: explicit structural constraints and many accepted melodies, without a universally correct musical ending. **Defined in its [deep dive](../deep-dives/song-maker.md)** as proposed level 9, with 12 Bring it home and 13 Change one thing |
| **Story Steps** (7 · 6–7) | Choose the picture that caused what happened | Authored story content and art, near Story Theater |
| **Letter Trails** (8 · 7–8; **[deep dive](../deep-dives/letter-trails.md)**) | Lowercase letters, then tracing the word a picture spells. **Planned in its deep dive** as levels 9–18 (a fading guide, five groups of little letters, big and little, little words, her name as it is written, words that matter), after a fix so every capital starts at the top | Needs a four-line writing frame and the stroke-convention decision; digits are a separate preschool mode (Number Trails above) |
| **Tangram Town** (6 · 5–6) | Flip a piece; make the same shape with fewer pieces | More silhouettes to author. **[Deep dive](../deep-dives/tangram-town.md) (2026-10-10):** fewer pieces (needs cover sets), fix the picture and a flip (needs a parallelogram) are designed; the picture pool is built |
| **Beat Builder** (5 · 3–5) | Two contrasting sections; [deep dive](../deep-dives/beat-builder.md) proposes A/B and returning ABA after repair/isolation | Superseded by the researched ladder; appended modes/windows need a developer decision |
| **Pixel Pictures** (5 · 3–5) | Pixel Flipbook (above) | A new bounded creation shape |

### Leave: the ceiling is right

| Game | Why |
| --- | --- |
| **Jelly Drums** (9 · 8–9) | Each level adds a note to remember, which is memory load, not a decision; making tunes belongs to Song Maker and Beat Builder. **Its [deep dive](../deep-dives/jelly-drums.md)** keeps that for length (nothing past five notes for a child) but proposes three levels that add a decision at five notes or fewer (backwards, same or different, lowest to highest) as a decision that overrides this leave |
| **Bubble Pop** (11 · 10–11) | A simple toy that has already grown pairs-to-10; arithmetic lives in Duck Pond and Frog Hop. **Its [deep dive](../deep-dives/bubble-pop.md)** keeps that for arithmetic but proposes three counting-sequence levels (start at, count back, skip count) as a decision that overrides this leave |
| **Size Parade** (8 · 7–8) | The school window only adds more friends, which is a bigger number rather than a new decision; measurement lives in Inchworm Measure |
| **Scoop Shop** (6 · 5–6) | The top level is already "remember the order"; more would only add load |
| **Stamp Studio** (6 · 5–6) | Open-ended; every story is welcome, so there is nothing to climb. **Its [deep dive](../deep-dives/stamp-studio.md)** keeps that for answers (no checked puzzle, no score) but proposes five levels of invitations she cannot fail (place words, relations, her own pattern, a mirror, a repeating tile) as a decision that overrides this leave |
| **Teddy Doctor** (6 · 5–6) | Care role-play whose top level already sequences a check-up. **Its [deep dive](../deep-dives/teddy-doctor.md)** keeps memory load where it is but proposes a toddler entry 7 *Who needs help?* and a school 8 *Before and after* (an order rule with several right answers), which overrides this leave |
| **Rhythm Neighbors** (6 · 5–6) | A couch game; layered rhythms are a larger design for a music slice |
| **Little Helpers** (6 · 5–6) | Equal groups is the right end; remainders are in Monster Munch and Lasso Loops, and rows and columns are Orchard Rows |
| **Lasso Loops** (5 · 3–5) | Place value past 39 would mean forty or more fireflies, which is clutter; it needs a different representation, not a longer ladder |
| **Rhyme Time** (4 · 2–4) | Rhyming with printed words is Read & Do |
| **Critter Crossing** (5 · 2–5) | Already holds "not" and two pictures; the next step is Rule Parade ([deep dive](../deep-dives/critter-crossing.md): Either one, Settle it, a visible "not" entry first) |
| **Lemonade Stand** (4 · 1–4) | Owned by the economy pilot |
| The 13 younger ladders (Animal Snack, Bounce Back, Bumper Garden, Clap the Syllables, Dot Link, Fluffy Salon, Garden Grow, Goodnight Room, Opposites, Owl Walk Home, Peg Garden, Pet Says, Stop and Go) | End at pre-K by design; the roadmap already says to wait for a reason to grow them. The quantity direction gives Garden Grow a pre-K window (levels 6–7 built), Goodnight Room more levels ([deep dive](../deep-dives/goodnight-room.md)), and Opposites the same reason plus a school gap ([deep dive](../deep-dives/opposites.md)); Animal Snack's [deep dive](../deep-dives/animal-snack.md) proposes pre-K and school windows; Pet Says' [deep dive](../deep-dives/pet-says.md) proposes levels 6–10 for pre-K and a school window 6–12 |

### Sketch for the next one to build

This is a mode of an existing game, extends a ladder the child already knows, and closes a gap from the [gap review](../IDEAS.md#gap-review-2026-10-09).

**Memory Match 10–12, "Same, said differently."** *Fun action:* flip cards to find the two that mean the same. *Skill:* reading number words, naming fractions and reading a clock, as one idea about equivalence. *Smallest round:* four pairs of number words and numerals, each spoken as it turns over. *Support:* exploring unseen cards still costs nothing; a pair counts as a miss only if its partner was already known (the game's existing rule); replaying a card's speech is free. *Levels:* 10 number words to numerals (one to ten); **11 built 2026-10-10:** three pairs, fraction pictures to names (a half, a quarter, three quarters); 12 clock faces to digital times (o'clock and half past). Level 11 divides a 64-unit square into equal parts centered on the 140-unit card; "three quarters" breaks across two lines. Level 12 still needs a small clock face and its legibility look. The [Memory Match deep dive](../deep-dives/memory-match.md) supersedes this sketch with source findings, support/content slices, explicit quantity decisions and proposed levels 12–14. *Rule tests:* every deck has one partner per card, no two cards could both match, and every equivalence is true. *Checks:* the device speech for number and fraction words, and how long words such as "eight" fit at card size; the existing ghost-finger bot should pair by id.

### Open questions

1. **Is two levels enough for a favorite?** *The developer's direction on 2026-10-10 favors more:* see [round three](#round-three-more-to-play-in-every-band-2026-10-10). The adaptive clamp means a child stays at the last level, so a favorite she plays often may want a longer school window (three or four levels). The audit favors giving the best games more depth over stretching all of them.
2. **Representations versus a new game.** Memory Match 10–12 teaches fractions and a clock through matching; Pet Kitchen and Clock Tower teach them by doing. Decide whether the matching levels are a bridge or a duplicate once they can be played.
3. **Order.** Pet Kitchen first (no new art), then Memory Match 10 (text cards) and Pattern Train, with Memory Match 11 and 12 after a legibility look; then Treasure Map and Critter Sort (already on the roadmap), then Bouncy Launch and Rainbow Fingers. Sink or Float's *make it float* is the strongest of the costlier set.

### Round two: the longer ladders (2026-10-10)

A **proposal**. The audit above read only the short ladders. This round reads the school-reaching ladders it skipped, whose school window is already three levels or more, plus two pre-K ceilings. It applies the same test: a new level must change what she decides, reuse the game's own interaction, and have a property a unit test can assert. Every level here is **appended above the current top** and is harder than it. An easier or entry level would wait on two decisions: [how levels are ordered](../WAITING-ON-DEVELOPER.md#waiting-on-the-developer). Each level was checked against the game's plan table in `logic.ts`, its `levels(band)` and its [GAMES.md](../GAMES.md) entry. Nothing was played.

**Every row has the same couplings.** It needs a `describeLevel` line, how-to steps scoped with a `LevelLine`, voice lines and rule tests. Every game has a ghost finger, so the bot must also play the new top level, because `fingerdemo` plays it. Couch trips and courses name their levels in `src/couch/catalog.ts` and `courses.ts`, so an appended level leaves Light Lab, Secret Code, Egg Catch, Robot Path, Frog Hop and Ferry Jam's couch play alone. Such a level reaches the couch only if its `control()` is taught the new mode.

#### Extend now: a real next decision, small to build

| Game (top · school levels) | What the top asks now | Next level | What a test asserts | Cost and couplings |
| --- | --- | --- | --- | --- |
| **Market Stall** (7 · 3–7; **[deep dive](../deep-dives/market-stall.md)**, which adds 8 How much is in the purse?, 9 The ten-shell shell, 10 Two baskets to twenty, 11 Change from twenty and two to-define levels, 12 Can I buy it? and 13 Trade up) | Give change from a customer's 10 | **7, Fewest coins (built):** pay a price from 4 to 10 with as few shells as possible. Any payment that totals the price still buys the fruit. A payment with more coins than needed gets "can you use fewer shells?" and the coins stay on the mat to swap. That counts as a miss only after the swap is offered twice. Optimization replaces "any way works" | With coins 1, 2 and 5, taking the biggest coin each time always gives the fewest. Every price has its fewest count, and the hint's faint coins are a fewest set | S. The plan, a check against the minimum and two voice lines |
| **Clock Tower** (7 · 2–7; [deep dive](../deep-dives/clock-tower.md)) | Five-minute setting is built; one-hour change is level 6 | Visible appointments built at 5 ([build note](COMPLETED-2026-10-09.md#clock-tower-5-visible-appointments-2026-10-15)); existing-level explanations built ([build note](COMPLETED-2026-10-09.md#clock-tower-hour-change-and-fives-explanations-2026-10-15)); proposed levels 8–11 are in the deep dive: earlier, half-hour endpoint, duration and fitting a visit | Keep clock face arithmetic separate from absolute interval values; tasks and hints must have visible evidence | Support/content slices 1–3 built; new levels and preschool opening need the recorded decisions |
| **Frog Hop** (7 · 3–7; **[deep dive](../deep-dives/frog-hop.md)**, which adds 8 Back over ten, 9 Count up to take away, 10 Over ten your way, 11 Hop by tens and two to-define levels, 12 Big hops and little hops and 13 Where does it go?) | Hop on or back up to 6 on a line to 20 | **7, Hop to ten first (built):** a sum that crosses 10 (8 + 5). First a number card asks "how many hops to 10?" (2), and the frog hops there. Then she taps where the rest of the hops (3) land. Splitting a number to bridge ten is a strategy, not a bigger sum | Every question starts at 6 to 9 and crosses 10 without passing 20. The two parts add up to the sum. The second hop always starts at 10 | S. It reuses the card mode from level 5 and the line to 20 from level 6 |
| **Seesaw Balance** (9 · 6–9) | Boxes on both sides: take the same off both until one box is alone | **10, Two steps:** two identical boxes and some blocks balance blocks (2 boxes + 2 = 8). First take the same off both sides, as on levels 8 and 9, then share what is left between the two boxes, as on level 7. This is the "two-step" stretch of [Box Balance](../IDEAS.md#new-ideas-from-the-gap-review) | Every seesaw starts level. The box weight is a whole number from 1 to 5. Only same-on-both-sides removals keep it level. The answer is unique | S. Both halves already exist (`same` and the two-box division) |
| **Secret Code** (6 · 2–6) | Crack a code that can repeat a color | **7, Detective door:** the door opens with two or three guesses and their marks already shown, made by "the pet earlier". She works out the one code that fits every clue and enters it on her first try. Any try that contradicts a shown mark is the existing miss. Pure deduction replaces guessing | `candidates(plan, history)` is exactly one code for every generated door. No shown guess is already the answer. The hint's faint stones are that code | S. The generator loops until one candidate remains. No par rule is involved, so the [par decision](../WAITING-ON-DEVELOPER.md#waiting-on-the-developer) for Word Code does not block it |
| **Robot Path** (11 · 4–11; planned in the [deep dive](../deep-dives/robot-path.md) as levels 12–15) | A shown program predicts where the robot will stop | **12, Fix the program (built):** watch a short counted program once for free, then select its wrong slot and add the missing step to reach the star. This is debugging, the [E1 step](../ROADMAP.md#how-familiar-games-keep-growing) "repair one wrong command" | Each authored board's broken program fails; exactly one one-slot edit reaches the star; the hint lights that slot | S, three authored boards. Select-a-slot control and ghost-finger sequence |
| **Egg Catch** (6 · 4–6; level 7 built; **[deep dive](../deep-dives/egg-catch.md)**, which adds 8 Under the hen, 9 One gate, 10 Fix the run, 11 Flip-flop gate and a to-define 12 Sorting gate) | The gates are locked: predict where the egg lands | **7, Set it once:** one brown and one white egg will drop from different hens. She sets the gates before either rolls so brown reaches the basket and white the nest, then taps go. One gate setting has to work for two paths | Every board has at least one setting that routes both eggs, and none routes both with the gates as dealt. The hint flips a gate the solution needs | S. It reuses the route and sort boards |
| **Light Lab** (6 · 2–6) | A four-mirror path with spares and rocks | **7, Where will it shine?** Three locked-mirror predictions choose among reachable rock or edge endpoints; each replay explains the result without counting a miss. A fourth board returns to the ordinary plan puzzle. This is the [predict-then-compare](../IDEAS.md#extend-existing-games-before-making-duplicates) mode | Puzzle generation keeps three distinct reachable endpoints, including the actual one; the plan puzzle stays solvable | S–M. Three 100-unit targets on a 7 by 5 grid |
| **Duck Pond** (11 · 8–11; **[deep dive](../deep-dives/duck-pond.md)**, which keeps round three's 12 Doubles and adds 13 Ten and some more and a to-define 14 Every way) | How many more make 10? | **11, Hiding ducks (built):** the sign says how many ducks live in the pond (5 to 10). Some paddle under the bridge, and she answers on lily pads how many are hiding. Part and whole with any total, not only ten | The hidden count is at least 1 and the total is at most 10. A wrong pad counts on aloud from the ducks she can see | S. The bridge is a new scenery shape in Graphics |
| **Word Monsters** (8 · 5–8; **[deep dive](../deep-dives/word-monsters.md)**, which adds 9 Last sound, 10 Blend it, 11 Say it slowly, 12 Fix the pet's word, 13 Two letters one sound, 14 Four sounds, 15 The magic e, 16 Change one sound and a to-define 17 Which vowel?) | Change the last sound to make a pictured word (cat, cap, can) | **Planned in the deep dive as 9–16** (a school window of 5–16): it finds that levels 3–8 all say the sound aloud, so the new levels ask for a word and let the sound be the hint | Offered sounds are pairwise distinct; every built word is pictured; slot count equals sound count | S–M each; about 40 small pictures across the plan; every level waits on the iPad speech check |

#### Extend later: a real next decision that costs more

| Game | Next decision | Why it waits |
| --- | --- | --- |
| **Photo Safari** (6 · 4–6) | *Two clues, no name:* "the animal jumping by the pond", where two animals jump and two stand by the pond, so neither clue alone is enough | Today every animal has its own spot (`makeScene` takes one spot each), so level 5's place word alone already identifies the animal. Two animals sharing a spot is a layout change. → [deep dive](../deep-dives/photo-safari.md) |
| **Clock Tower** (after 7; [deep dive](../deep-dives/clock-tower.md#new-levels-on-top)) | *How long?* is proposed level 10: two stated same-day endpoints, separate hours/half-hour controls and a reversible confirmation | Defined answer form and interval proof in the deep dive; do not infer whole rotations from the existing hand drag. Proposed, not built |
| **Seesaw Balance** (after 10) | Two different unknown boxes on two seesaws: the first gives the square, then the second uses it | A second seesaw on screen, and the substitution idea is closer to age 8–9 |
| **Garden Rows** (6 · 3–6) | A 4 by 4 bed with 2 by 2 boxes, a third rule | Overlaps the couch-only Sudoku Garden and the [island forms of couch puzzles](../WAITING-ON-DEVELOPER.md#waiting-on-the-developer) decision. A bigger bed is only a size step |
| **Light Lab** (after 7) | A splitter that sends one beam two ways to wake two flowers | A new piece with its own beam rule and solver change |
| **Robot Path** (after 11) | A reusable routine: a purple "do this" box called twice | A second program row; the next idea after the loop |
| **Word Monsters** (after 8) | *Blend it:* the monsters say c, a, t slowly and she picks the picture. **Planned as level 10 in its [deep dive](../deep-dives/word-monsters.md)** | Device speech for isolated sounds must be heard on the iPad first |

#### Two pre-K ceilings

These games stop at pre-K, so appending a level only widens the pre-K range.

| Game (top · pre-K levels) | Next level | What a test asserts | Cost |
| --- | --- | --- | --- |

#### Leave: the ceiling is right, or it was just raised

| Game | Why |
| --- | --- |
| **Monster Munch** (8 · 6–8) | Fair shares with leftovers is the right end. An average (Share Fairly) is for ages 8–10 |
| **Habitat Helpers** (6 · 4–6) | The model is deliberately small. A third visitor would be more of the same, and real ecology needs a stated model first |
| **Chain Reaction** (6 · 3–6) ([deep dive](../deep-dives/chain-reaction.md)) | Bigger machines are only a size step; the deep dive adds prediction, tap-to-turn, two-marble, spring and gate levels (7–11) instead |
| **Ferry Jam** (6 · 3–6) | The ladder is already a size ladder, and the couch course owns the hardest harbors |
| **Pet Kitchen, Inchworm Measure, Picture Graph** | Raised from the first audit in the last two days. Play them before going higher |
| **Lemonade Stand** | Owned by the economy pilot |

Duckling Parade now has a [researched ladder](../deep-dives/duckling-parade.md) (2026-10-15), superseding its omission below: existing 1–10 and school audited; support and ABB 11 ready; continuation, mapping, authoring and a lap entry remain gated. Its steering references elsewhere remain ideas, not mandates.

Not read in this round: the pre-K ceilings of Color Garden, Shape Sorter, Splish Splash, Peekaboo Barn, Duckling Parade, Roundup and Sound Garden.

**Suggested order** (non-binding): Market Stall, Clock Tower, Frog Hop, Seesaw Balance and Secret Code first. They are plan entries on modes that already exist. Then Robot Path and Egg Catch, which need authored or searched boards. Then Light Lab, Duck Pond and Word Monsters, which need a little new drawing. Mail Carrier is last, because it needs a second map.

### Round three: more to play in every band (2026-10-10)

*Each game's rows here are a starting point for its [deep dive](../deep-dives/README.md); once a game has one, its deep dive supersedes these rows.*

**The developer's direction (2026-10-10):** "there could be a lot more quantity to a lot of the different games to allow more time to enjoy across age bands." The first two rounds admitted a level only if it changed what she decides. This round takes **quantity** as a goal in its own right: more fresh rounds and more levels in every band, so a favorite lasts for months. **Pressure is still out.** Nothing here adds speed, a timer, clutter, or more to remember than the band can hold, and targets stay at least 100 units. Everything below is a **proposal**, checked against each game's plan table and band ranges in `src/games/<id>/`. Nothing was played.

#### Four ways to add more

| Kind | What it is | What it touches | Blocked by |
| --- | --- | --- | --- |
| **A. Fresh content inside a level** | A larger pool for the level to draw from: more pictures, stories, animals, words, boards and scenes. The rule and the level number stay the same, but she rarely sees the same round twice. This is the only route that adds play to lap and toddler today | A content table in `logic.ts` (or art in `src/art/`), voice lines, and a rule test that every item in the pool satisfies the level's rule (each story has its steps, each silhouette is solvable, each word has its picture) | Nothing |
| **B. New levels on top** | Appended above the current top, never renumbered. The new modes from the first two rounds, and now also a **next board**: a richer version of the top level (a bigger bed, a third visitor, a new weather) when it keeps targets large and adds no memory load | The plan, `describeLevel`, how-to `LevelLine`s, rule tests and the ghost-finger bot (`fingerdemo` plays the new top). The band's `max` rises, and a game that stops at pre-K gains a `school` window when its new levels suit ages 6–8 | Nothing |
| **C. Open a game to a younger band** | A game whose level 1 is already gentle adds the next band down, with a range starting at 1. No new level and no save change | The game's `bands` and levels table, then the place's game count (README and roadmap) and the registry tests. Whether level 1 suits a younger child is a judgment, so each opening goes on the [person checks](../DEVICE-CHECKS.md#needs-a-person-or-a-device) | Nothing for the code; the fit is checked later by a person |
| **D. New levels below level 1** | An easier entry for lap or toddler under an existing ladder | Level order | Built: a band's `order` may skip IDs and sets the order ([DESIGN.md](../DESIGN.md)) |

Kinds A and C need no decision and reach the youngest bands. Kind B carries the older ones. Kind D should wait. The cheap option for it is an appended slice ordered easy to hard and given to the younger band.

#### Every island game, by subject

*Bands:* L lap, T toddler, P preschool, K pre-K, S school. "R1" and "R2" mark levels already proposed in the [audit](#short-ladder-audit-2026-10-09) and [round two](#round-two-the-longer-ladders-2026-10-10); new numbers continue after them. A dash means nothing is proposed for that kind.

**Senses and music**

| Game (bands · top) | A. Fresh content | B. New levels on top | C. Younger band |
| --- | --- | --- | --- |
| Bubble Pop (L–S · 11) | Bubble scenes (bath, sea, night sky) and pictures inside bubbles (fish, stars) for the young levels (see its [deep dive](../deep-dives/bubble-pop.md), which supersedes this row) | — (the audit's leave stands; the deep dive proposes 12–14 as a decision) | Pop anywhere (lap), big and little (toddler), which one has the dots (preschool); all wait on level order |
| Peg Garden (L–K · 5) ([deep dive](../deep-dives/peg-garden.md), which supersedes this row) | More garden boards per level, each simulated in `ball.ts` | **6, Into the cup:** cups along the bottom show dots, and she aims so the pearl rests in the cup with four. Each cup is reachable by some aim (simulated) | — |
| Bounce Back (L–K · 5) | Courts: beach, snow, a pond with lily pads | **6, Bounce to a color:** the pet calls a color and she bounces the ball to that zone of the wall | — |
| Bumper Garden (L–K · 5) ([deep dive](../deep-dives/bumper-garden.md)) | More tables | **6, Count on / 7, Pattern bloom / 8, Not this color / 9, Count back / 10, Make five** (pre-K); Pond and Hive tables; Floaty garden and Anywhere flip as easier entries; make ten and a tune are proposals behind a school-window decision | — |
| Jelly Drums (L–S · 9) ([deep dive](../deep-dives/jelly-drums.md)) | Tunes with shapes and names (*Hot Cross Buns*, *Mary*, *Oh! Susanna*: songs on the jellies' five pitches), a replay target, color and size words, sound sets and stages; the deep dive supersedes this row | **10, Backwards, 11, Same or different?, 12, Lowest to highest** (the leave stands for length; the deep dive proposes these as a decision), and a couch memory duel for grown-ups | Between-level entries: echo jellies and one big jelly (lap), follow the glow and which jelly sang (toddler), finish the song (preschool); all wait on level order |
| Song Maker (T–S · 7) ([deep dive](../deep-dives/song-maker.md)) | More tunes to copy and patterns to continue; the dive defines ten spoken patterns and authored motifs | R1-later: *answer the phrase*; the dive proposes 8–13 (compose, answer, finish, ear entry, bring it home, change one thing) | — (no younger opening; level 1 serves lap) |
| Sound Garden (L–K · 6) ([deep dive](../deep-dives/sound-garden.md), which supersedes this row) | More singer pairs (owl and mouse for high and low; snail and hare for slow and fast) | **7, Loud or quiet**, a new contrast. **8, Two at once:** "high and fast", a two-attribute listen | — |
| Rhythm Neighbors (L–S · 6) | More frog voices and call shapes | — (audit: leave) | — |
| Beat Builder (P–S · 5) | [Deep dive](../deep-dives/beat-builder.md): authored phrase library after support fixes | Proposed 6 mend, 7 isolate, 8 A/B, 9 ABA; decision | Toddler single-hit finish and distinct lap pat-to-score opening; decision in the deep dive |

**Art and animals**

| Game (bands · top) | A. Fresh content | B. New levels on top | C. Younger band |
| --- | --- | --- | --- |
| Rainbow Fingers (L–S · 7) ([deep dive](../deep-dives/rainbow-fingers.md)) | 15 more pictures (6 to 21) with accepted alternatives, fold-down-the-middle pages (Mirror Brush's live mirror), colors named as she paints, a journal source; the deep dive supersedes this row | **Built 2026-10-10:** 7 *paint the pumpkin* (**unfinishable live**; fix first). **8 Finish the color wheel, 9 Make it pink, 10 Brown from all three, 11 Mix it from memory**, 12 Match the sample (define) | Two pots and Copy the picture (wait on level order) |
| Fluffy Salon (L–K · 5) | Accessories as a sixth tool (a bow, a hat) | **6, Two customers:** two tickets, styled one after the other | — |
| Stamp Studio (L–S · 6) ([deep dive](../deep-dives/stamp-studio.md)) | Six stamp sets with a backdrop each (sea, farm, garden, space, picnic, town; thirty-two new stamps), a sound and a spoken name per stamp, seven colors, three sizes, a wake-up on finishing, a picture that plays and a pet that tells it back; the deep dive supersedes this row | The audit's leave stands for answers; the deep dive proposes **7 Where does it go?, 8 Next to, between, above, 9 Make a pattern, 10 Butterfly paper, 11 Wrapping paper** as a decision (invitations, never wrong answers) | Pat the paper, Follow the sparkle and Stamp a duck! (lap and toddler); all wait on level order |
| Pixel Pictures (P–S · 5) | More pictures per level (fifteen today, across three grid sizes) | **Built 2026-10-10:** level 6, two-color picture logic: each clue number has a color | — |
| Peekaboo Barn (L–K · 8) | Hiding places in new scenes (a bedroom, a beach), covers that open their own ways, animals who name how they feel and more animals (seven today); see its [deep dive](../deep-dives/peekaboo-barn.md), which supersedes this row | — (the audit's leave stands; the deep dive proposes 9–15 as a decision) | One door, where did it go?, who says moo? and hide it yourself (lap and toddler); all wait on level order |
| Roundup (L–K · 6) | More animal kinds | **7, Two things at once:** big pigs in one pen, little pigs in the other. **8, Make the pens fair:** share 6 or 8 animals equally between two pens | — |
| Egg Catch (L–S · 7; see its [deep dive](../deep-dives/egg-catch.md), which supersedes this row) | More chute boards per level; egg colours, hen notes and a hatching basket | R2: 7 *set it once* (built); the deep dive adds 9–12 | 8 Under the hen (toddler), placed by `order` |
| Animal Snack (L–P · 5) | Food eaten its own way, scenes, two ways to ask, and sheep, horse, hen and mouse (shared with Peekaboo Barn); see its [deep dive](../deep-dives/animal-snack.md), which supersedes this row | **6, Who says moo?**, **7, Their own snacks**, **8, Who eats it too?**, then a school window with **9–10, the menu board** (a decision). Replaces the earlier *Snacks for two* and *Who is still hungry?*, which Monster Munch, Garden Grow and Duck Pond already hold | Open wide, taste test and what does the cow eat? (lap and toddler); all wait on level order |
| Critter Sort (K–S · 5) | More critter features | See the [deep dive](../deep-dives/critter-sort.md), which places this as level 7 (6 is a preschool easy entry). **6, Where does the new one go?:** the hoops are already sorted and one more critter arrives, so she places it from the rule | Preschool, at level 1 (one hoop) |

**Numbers**

| Game (bands · top) | A. Fresh content | B. New levels on top | C. Younger band |
| --- | --- | --- | --- |
| Duck Pond (L–S · 11) | Ponds at night, frogs in place of ducks; see its [deep dive](../deep-dives/duck-pond.md), which supersedes this row (arrangements, zero, dotted pads, mixed ponds, real stopping) | R2: 11 *hiding ducks* (built). **12, Doubles** (the same number of ducks on each side of the bridge, so how many in all?; kept), **13, Ten and some more** and a to-define **14, Every way**, in a school window of 8–14 | Bye-bye ducks (lap and toddler), Count the peekers, Which pond has more?; all wait on level order |
| Monster Munch (L–S · 8) | New monsters and foods | — (round two: leave) | — |
| Little Helpers (L–S · 6) | Fruits and trees | — (audit: leave) | — |
| Pet Kitchen (T–S · 9) | Round wholes (a pizza, a pie) as well as the sandwich | **Built 2026-10-10:** level 9, *Thirds*: cut one pizza into three equal slices and share one with each friend | — |
| Frog Hop (P–S · 7) | Lines in new places (stepping stones, a flower path, an evening pond), landing numerals said aloud, dots and landmark flowers; see its [deep dive](../deep-dives/frog-hop.md), which supersedes this row | R2: 7 *hop to ten first* (built). **8, Back over ten**, **9, Count up to take away**, **10, Over ten, your way**, **11, Hop by tens**, and to define **12, Big hops and little hops** and **13, Where does it go?** (a school window of 3–13) | Hop along (lap and toddler), Hop to the dots (toddler), Which pad lost its number? and Who is further along? (pre-K); all wait on level order |
| Picture Graph (K–S · 7) | More critter kinds and meadows | **Built 2026-10-10:** one graph cycle: tally three counts in groups of five, then build the bars and compare | Preschool, at level 1 (two bars) |
| Lasso Loops (P–S · 5) | Fireflies in new skies | — (audit: leave) | — |
| Market Stall (P–S · 7) | Flower and balloon stalls (bakery and toys wait on new props), the coin named on first use, pips on the coins; see its [deep dive](../deep-dives/market-stall.md), which supersedes this row | R2: 7 *fewest coins* (built). **8, How much is in the purse?**, **9, The ten-shell shell** (prices to 20 with a 10-coin), **10, Two baskets to twenty**, **11, Change from twenty**, and to define **12, Can I buy it?** and **13, Trade up** (a school window of 3–13) | Shell in the jar (lap), Give me one, two, three (toddler), Which coin? and Which costs more? (preschool and pre-K); all wait on level order |
| Clock Tower (K–S · 7; [deep dive](../deep-dives/clock-tower.md)) | Six-picture visible appointments built ([build note](COMPLETED-2026-10-09.md#clock-tower-5-visible-appointments-2026-10-15)); four new appointment pictures remain proposed separately | Five-minute level 7 built; proposals 8–11 and precision horizons in the deep dive | Preschool model-supported 1–1 proposed, decision first |
| Inchworm Measure (K–S · 6) | More things to measure | — (raised this week) | Preschool, at level 1 (count the worms) |

**Everyday life**

| Game (bands · top) | A. Fresh content | B. New levels on top | C. Younger band |
| --- | --- | --- | --- |
| Splish Splash (L–K · 8) ([deep dive](../deep-dives/splish-splash.md)) | Rooms and messes (beach sand, garden grass, paint, jam), foam and bath toys, and **muddy friends in the tub** (a pig first) in place of a toy car or teddy, plus the part named as it goes clean; the deep dive supersedes this row | **9, What do we hear with?, 10, The picture card** (scrub three parts in the order a card shows), **11, Soap, scrub, rinse, 12, Top to bottom** (drips); left and right and a school window are left for a decision | Pat the bubbles, foam hunt, this one! and wash two (lap and toddler); all wait on level order |
| Feelings Faces (L–K · 8) | More small events | **9, Two friends, one event:** the same thing happens and they feel differently (perspective), which opens a `school` window | — |
| Weather Wardrobe (L–K · 7) ([deep dive](../deep-dives/weather-wardrobe.md)) | **New weathers: wind and fog**, with a kite and a bright coat; the deep dive keeps wind (kite, windbreaker), leaves fog out and adds more items per weather; it supersedes this row | **8 Try it on, 9 Which sky?, 10 Two friends, two places**; school levels gated | Lap entry 8 *Try it on* |
| Scoop Shop (L–S · 6) | Toppings and cones | — (audit: leave) | — |
| Teddy Doctor (L–S · 6) ([deep dive](../deep-dives/teddy-doctor.md)) | More patients (five today) and boo-boos; the deep dive adds a scale and height chart to check-ups and keeps new ailments as a decision | **7 Who needs help?** (toddler entry), **8 Before and after** (school); the deep dive supersedes this row | Level 1 every touch counts, with the part named |
| Stop and Go (L–P · 4) ([deep dive](../deep-dives/stop-and-go.md)) | Bikes and boats as well as cars | **5, Walk signal:** the walker crosses only on the little green figure, which opens a pre-K window (in the deep dive: level 8, gated on the safety review; 5 is *Whose light?*) | — |
| Pet Says (L–K · 5) ([deep dive](../deep-dives/pet-says.md)) | Moves in tiers (peekaboo, pat-a-cake, tiptoe, march, frog, cat, duck, bird), ten body words and a chant, counts, richer tricks, four tunes with named statue poses and five scenes; the deep dive supersedes this row | **6 Opposite day, 7 Quiet dance, 8 More opposites, 9 A walk in the woods, 10 Sun or moon** (pre-K 3–10), and as a decision a school window **6–12** with 11 Pet says, opposite and 12 This hand (nothing is judged: the pet reveals the opposite) | Pat the pet (lap) and Your turn! (toddler); both wait on level order |

**Colors, shapes and puzzles**

| Game (bands · top) | A. Fresh content | B. New levels on top | C. Younger band |
| --- | --- | --- | --- |
| Shape Sorter (T–K · 8) | New shapes (oval, heart, star) | **Built 2026-10-10:** level 8, *The feely bag*: a spoken property clue asks her to find the matching shape ([build note](COMPLETED-2026-10-09.md#shape-sorter-level-8-the-feely-bag-2026-10-10)) | — |
| Color Garden (T–K · 7) | More things to sort | **Built 2026-10-13:** 7, *Light and dark*, light blue and dark blue baskets. **8, Color and kind:** red fruit only | — |
| Dot Link (L–K · 6) | More dot colors and boards | Researched: [deep dive](../deep-dives/dot-link.md) (levels 7–10, a toddler entry, empty-cell boards); level 6 and the marks in the dots built: (level 6 built; see [completed work](COMPLETED-2026-10-09.md#dot-link-level-6-exactly-five-2026-10-10)) | — |
| Tangram Town (T–S · 6) | **Built 2026-10-10:** each level draws from a pool of 2–5 pictures (11 in all). More pictures, spoken shape names and the rest are in the [deep dive](../deep-dives/tangram-town.md) | R1-later: flip a piece (the deep dive's level 9; it needs a parallelogram) | — |
| Garden Grow (L–P · 5) ([deep dive](../deep-dives/garden-grow.md)) | Flower kinds (the deep dive's slice 3, with growth stages and wet soil); the deep dive supersedes this row for new levels: **8 Grow it up** (lap), **9 Rows of colors**, **10 Columns of colors**, **11 Same in every row** (pre-K) | **Built 2026-10-10:** levels 6, *One more than the sign*, and 7, *Two rows of three*, open a pre-K window ([build note](COMPLETED-2026-10-09.md#garden-grow-levels-67-one-more-and-two-rows-of-three-2026-10-10)) | — |
| Treasure Map (K–S · 5) | Maps of new places | **6, Give directions:** the pet asks the way and she chooses the arrows, turning reading directions into writing them | Preschool, at level 1 (a picture row meets a color column) |
| Owl Walk Home (T–K · 4) ([deep dive](../deep-dives/owl-walk.md)) | Paths and seasons; stones that carry color and shape independently | **Levels 1–4 reworked in place and built 2026-10-13** (tap the stone rather than the owl; an owl each at level 2; choose an owl at 3). **Planned in the deep dive**: 6 Color or shape, 7 Our two cards, 8 Check the helper | **Planned as level 5, Stepping stones** (a free toy for lap and toddler; decision 6) |
| Pattern Train (P–S · 12) ([deep dive](../deep-dives/pattern-train.md), which supersedes this row) | A pool of car kinds (fruit, flowers, boats, sizes, turns, acting) so a level never looks the same twice | **Planned as 18, Stairs** (growing patterns), 19 Up and down and 20 Start anywhere; also 13–17 (odd car out, fix the train, same pattern in new pieces, build the same, make your own). Lap and toddler entries in the code are dead; the deep dive proposes a toddler window on level 1 with two choices | Color Train’s tap entry is built as Color Garden 9 |
| Memory Match (P–S · 11) | Vehicles and dot arrangements are built (2026-10-14); shape/friend/fruit decks are [built](COMPLETED-2026-10-09.md#memory-match-familiar-picture-decks-2026-10-13) at the same sizes; [researched plan](../deep-dives/memory-match.md) | **Built 2026-10-10:** 10 number words, 11 fraction pictures; proposed 12 clocks, 13 same total, 14 same share ([deep dive](../deep-dives/memory-match.md#new-levels-on-top)) | Proposed toddler 1–1 (four cards); level 2 has six ([deep dive](../deep-dives/memory-match.md#younger-band-openings)) |
| Size Parade (T–S · 8) | More friends | — (audit: leave) | — |
| Puzzle Pals (T–S · 7) | **Twelve scenes** (built 2026-10-11, the first six pinned for stickers and the map icon; see its [deep dive](../deep-dives/puzzle-pals.md), which supersedes this row) | R1-later: turned pieces (deep dive levels 8–11) | — (below-level-1 ideas are in the deep dive) |
| Quick Tricks (T–S · 6) | More props per trick | R1-later: a third show | — |
| Peekaround Island (L–S · 5) | More friends and landmarks | R1-later: view from above | — |
| Penguin Slide (P–S · 5) | More rinks per level | **6, Three fish, in any order**, a next board. Mossy Path is now a separate built game | — |
| Secret Code (K–S · 6) | Stone sets | R2: 7 *detective door* | Preschool, at level 1 (two slots) |
| Garden Rows (K–S · 6) | Flower sets | **7, A 5 by 5 bed with fewer flowers to start**, a next board. Boxes wait (round two) | — |
| Ferry Jam (K–S · 6) | **More harbors** in the frozen, solver-checked list for each level | — | — |
| Critter Crossing (K–S · 5) | More critter features | — (audit: leave, then Rule Parade; ladder in its [deep dive](../deep-dives/critter-crossing.md)) | — |

**Stories, words and science**

| Game (bands · top) | A. Fresh content | B. New levels on top | C. Younger band |
| --- | --- | --- | --- |
| Letter Trails (P–S · 8) ([deep dive](../deep-dives/letter-trails.md)) | A bigger word list that ends on the word's own picture (cat, dog, sun, and about seventeen more shared with Word Monsters); journal entries; a show-me hint | R1-later: lowercase; the deep dive adds 9–18 | Toddler: Shape Trails (a line, a circle, a cross) below level 1, waiting on the level-order decisions |
| Story Steps (T–S · 7) ([deep dive](../deep-dives/story-steps.md)) | **Ten stories (built 2026-10-11):** the six added are a seed becoming an apple, washing the dog, making a sandwich, a rainy day, building a sandcastle and getting ready for bed. Every level gains, and level 7's six-picture mix gets better | R1-later: choose the cause | — |
| Word Monsters (L–S · 8) ([deep dive](../deep-dives/word-monsters.md)) | More picturable three-letter words, including short-e words and drawn family words; a sound-twin guard (c and k both say "kuh") and real decoys on level 8 | R1-later: levels 9–16 (last sound, blend it, say it slowly, fix the pet's word, two letters one sound, four sounds, the magic e, change one sound) | Below level 1 and between: one big monster, my letter, big and little, spell my name (all wait on the level-order decisions) |
| Photo Safari (L–S · 6) | **New actions** (swimming, climbing, waving) and animals | R2-later: two clues, no name → [deep dive](../deep-dives/photo-safari.md) | — |
| Goodnight Room (L–K · 5) ([deep dive](../deep-dives/goodnight-room.md)) | Bedroom, barn, tent and boat cabin are built. Seeded friends and already-asleep starts are built | Level 5 and its pre-K window are built ([archive](COMPLETED-2026-10-09.md#goodnight-room-barn-and-animals-2026-10-10)); Levels 6–9 are built; proposed next: level 10 tour | — |
| Rhyme Time (K–S · 4) | More rhyme families (twelve today) | — | Preschool, at level 1 |
| Opposites (L–K · 4) ([deep dive](../deep-dives/opposites.md)) | **Twelve pairs today**; the first four additions and family guards are [built](COMPLETED-2026-10-09.md#opposites-content-and-fairness-2026-10-10). Next wet and dry, clean and dirty, thick and thin; loud and quiet wait as sound cards | **5, Which two?** (five cards, no busy picture); the deep dive adds 6–10 (in between, line them up, only the word, un- words, two answers) and a school window | — |
| Clap the Syllables (P–S · 5) ([deep dive](../deep-dives/clap-syllables.md)) | More words (slice 1 of the dive: twelve to sixteen words) | **Built 2026-10-10:** level 5 sorts long words into four clap counts; see the [completed-work note](COMPLETED-2026-10-09.md#clap-the-syllables-level-5-long-words-2026-10-10) | — |
| Robot Path (K–S · 10) | **One authored board per level today**; give each level three. The rule tests already check every authored board ([deep dive](../deep-dives/robot-path.md)) | R2: *fix the program*, now planned as level 12 after 11 *where will it stop?* ([deep dive](../deep-dives/robot-path.md#new-levels-on-top)) | Preschool, at levels 1–2 ([deep dive](../deep-dives/robot-path.md#younger-band-openings)) |
| Bug Builder (T–S · 7) ([deep dive](../deep-dives/bug-builder.md)) | Bug and wing shapes | R1-later: fold a friend | — |
| Sink or Float (T–S · 6) | More things to test (nine today) | R1-later: make it float (built 2026-10-17 as level 7: [definition](../definitions/make-it-float.md)) | — |
| Bouncy Launch (L–S · 5) ([deep dive](../deep-dives/bouncy-launch.md)) | Cloud skies; notches and rising landing notes; a seeded cloud bag at level 1 | R1: 6 *predict the cloud* (built). **Planned in the deep dive**: 7 Near or far (an easy entry), 8 Feed the friend, 9 Between two flights, 10 Where on the line?, 11 Pick a spring | A lap pull level (decision) |
| Seesaw Balance (T–S · 9) | Friends and presents | R2: 10 *two steps* | — |
| Ramp Race (K–S · 4) | Floors and cars | R1-later: predict the stop | Preschool, at level 1 (higher goes farther) |
| Block Tower (L–S · 6) ([deep dive](../deep-dives/block-tower.md)) | Equal-block height variety first; different shapes need a new contact/mass model | Proposed 7 repair, 8 scaffolded counterweight, 9 remove a spare; order/windows and experiments need decisions | Already L–S; optional toddler 1–3 and easier named entries wait on decisions |
| Chain Reaction (K–S · 6) ([deep dive](../deep-dives/chain-reaction.md)) | Cargo and goal skins, a note per ramp | Proposed 7 tap to turn, 8 which bell, 9 two marbles, 10 springboard, 11 gate | Preschool/toddler at the appended easy entries 7–8 (decision) |
| Habitat Helpers (P–S · 6) | **A third visitor**, Bird (seeds, a birdbath, a tree), as a next board on the same three needs. The quantity direction now welcomes what round two left alone | **7, Three visitors:** one garden in four spaces for Bunny, Duck and Bird | Toddler, at level 1 (Bunny's three obvious pieces) |
| Lemonade Stand (S · 4) | — (owned by the economy pilot) | — | — |

The couch-only grown-up puzzles (Sudoku Garden, Lantern Lights, Picture Logic, Word Search, Pond Conga, Island Bridges) gain from more frozen or seeded boards per level. Their courses keep their own versions.

#### What this adds up to

- **37 new levels on top**, beyond the ones from the first two rounds; ten are built (Clap the Syllables 5, Garden Grow 6–7, Pixel Pictures 6, Pet Kitchen 9, Picture Graph 7, Dot Link 6, Shape Sorter 8 and Duckling Parade 9–10), leaving 27.
- **Seven ladders gain a band window:** three reach school (Duckling Parade, Feelings Faces and Clap the Syllables), and four reach pre-K (Animal Snack, Stop and Go, Garden Grow and Goodnight Room). Animal Snack's planned levels 6–7 are replaced by its [deep dive](../deep-dives/animal-snack.md) (6–8 and a school window with 9–10).
- **Thirteen younger-band openings** that need no new level (kind C).
- **A content pass for nearly every game.**

The youngest bands gain most from kinds A and C. Puddle Lagoon and Daisy Meadow gain fresh rounds in their favorites without waiting on the level-order decisions.

**Suggested order** (non-binding):

1. **Content where one round repeats today:** Tangram Town, Story Steps, Robot Path's boards, Goodnight Room, Opposites and Puzzle Pals.
2. **Younger-band openings in batches of four**, each batch one change to the bands and registry, with its person check written down.
3. **New levels**, interleaved with the first two rounds' lists, cheapest first. Each level is one session at the "new levels" check tier.
