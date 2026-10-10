# Bubble Pop deep dive

*ID `bubble-pop` · bands lap, toddler, preschool, pre-K, school · levels 1–11 on 2026-10-10 · session `claude/adoring-albattani-euqsnp` ([PR 93](https://github.com/rjdunlap/neo/pull/93))*

## The game today

She taps bubbles that drift on a sunny shore. Each pop bursts into colored sparks and a pentatonic note whose pitch follows where on the screen it was (`stepFromUnit(x / view.w)`); every fifth pop the pet cheers; when the goal is reached the rest of the bubbles pop in a cascade and a rainbow bubble floats up to finish the round. Some free-play bubbles hold a friend (30%, one of seven critters) who drops to the sand, hops, giggles and fades. The learning purpose rises with the level: cause and effect and visual tracking (free), color words (color), counting in order (count), and number bonds (bonds).

| Level | Mode | Goal, speed, most on screen, radius | Bands whose window includes it | What she decides |
| --- | --- | --- | --- | --- |
| 1 | free | 12 pops, 55 px/s, 5, 72–96 | lap, toddler | nothing: any bubble is right |
| 2 | free | 15, 65, 6, 64–90 | lap, toddler | the same, a little faster and smaller |
| 3 | free | 18, 75, 7, 58–84 | lap, toddler | the same |
| 4 | color, 2 colors | 8, 55, 5, 66–86 | toddler, preschool | which of two colors is the asked one |
| 5 | color, 3 colors | 10, 60, 6, 62–82 | toddler, preschool | the same among three |
| 6 | color, 5 colors | 12, 70, 7, 56–76 | toddler, preschool, pre-K | the same among five |
| 7 | count to 5 | 5, 35, 5, 62–74 | preschool, pre-K | which bubble is the next number |
| 8 | count to 7 | 7, 42, 7, 56–68 | preschool, pre-K | the same |
| 9 | count to 10 | 10, 48, 10, 50–60 | preschool, pre-K | the same |
| 10 | bonds, sum 5 | 4 pairs, 28, 8, 58–68 | pre-K, school | which two bubbles make 5 |
| 11 | bonds, sum 10 | 5 pairs, 32, 10, 54–62 | school | which two bubbles make 10 |

The ranges are lap 1–3, toddler 1–6, preschool 4–9, pre-K 6–10 and school 10–11 (`LEVELS` in `src/games/bubble-pop/index.ts`).

**What a round draws from.** Free and color bubbles are spawned one at a time below the screen and float up (`vy` about −44 to −94 px/s), swaying; they are removed when they pass the top. Color mode draws `choosePalette(rng, colors)` from the six `RAINBOW` colors; the first color is the target, and the first two bubbles are always the target so the start is errorless. Count and bonds mode place every bubble at once inside the screen and let them bounce about (`drift`), numbers 1..goal or `bondNumbers(sum, pairs, rng)`. A free-mode bubble holds a friend with 30% chance, picked from `FRIENDS` (duck, pig, cat, bunny, cow, bear, dog). There is one background (`Backdrop`, seed 3: sky, hills, clouds, sun).

**Misses and hints.** Free mode has no misses. In color and count a wrong bubble wobbles with a boing, one spoken nag at most every four seconds ("That one's blue. Find red!"), and two wrong in a row glow the right bubbles for three seconds and count one hint. A finger that lands on a wrong bubble overlapping a right one pops the right one with no miss (`meant`). In bonds the first tap holds a bubble (glow, its number said), the second either pops both ("3 and 2 make 5!") or boings, says both numbers and the total, and counts a miss; the second miss in a row glows a pair that works and counts a hint; tapping the held bubble again lets it go. Count mode glows the next number after six idle seconds without counting a hint. The round always finishes.

**Couplings.** How-to card: five `LevelLine` steps. Ghost finger: `autotouch()` through `bubbleToPop` (free, color, count, bonds), played at the first and last level by `fingerdemo`. Voice: `bubble.free`, `.color`, `.wrong`, `.count`, `.find`, `.rainbow`, `.bonds`, `.made`, `.notmade`. Land: Bubble Beach. Music: `STYLES.bubbles` (the island loop, not silenced: the pops are a pentatonic accent, not a tune she makes). Sticker: a friend inside a bubble, `sticker(seed)` picking from `FRIENDS`; the map icon is `BubbleMachine`. Browser cases: `ORIGINALS_ONLY=bubbles` plays levels 1–9 with two wrong pops and the hint glow; `woods` plays levels 10–11. No couch entry, journal entry, picnic step or saved creation.

**Known gaps** (read from the code; none has been seen on a device).

1. **The how-to card has two traps for any new level.** Its last step is `{ from: 11, … }` with no end, so it would say "make 10" on a level 12 (the trap Puzzle Pals and Opposites found), and its goal, "Pop the bubbles that float up", is untrue from level 7, where bubbles drift in place.
2. **The sticker is tied to `FRIENDS`.** `sticker(seed)` does `rng.pick(FRIENDS)`, so adding a critter to that list silently changes the picture on every saved sticker. New pictures in bubbles need their own pool.
3. **A bubble she needs must not leave.** Free and color bubbles float off the top and are removed; count and bonds bubbles drift in place. That is why they differ, but nothing states it. A new mode that needs a particular bubble (ordered, partnered, named) must drift, and a test should assert it.
4. **Free play never uses words.** A released friend giggles and fades without a name or sound, though Web Audio already makes seven cartoon animal voices (`sfx.animal`: moo, quack, oink, meow, woof, growl, hop) and the seven critters are exactly those seven. Levels 1–3 differ only in speed, size and crowd: depth by pressure, which AGENTS.md puts last.
5. **Color words are rationed.** The color is named on every third right pop; the target never changes within a round; level 6 puts five colors in the toddler window.
6. **Count and bonds bubbles show numerals only,** so the quantity is never seen. Duck Pond already uses a convention that dots beside a number are there to count.
7. **The sum-5 level draws only two different facts** (1+4 and 2+3, each twice across four pairs); the sum-10 level has each of five facts once, so every bubble has exactly one partner. Both are fair (a test pairs greedily from any order) but the first is repetitive.
8. **One background.** Every round is the same shore, which the audit's round three also named (scenes and pictures in bubbles).
9. Person checks still open: lap level 1 with a real child, and the iPad ([roadmap](../ROADMAP.md#needs-a-person-or-a-device)).

**Target sizes.** Every plan's smallest radius times `TAP_REACH` (1.2) is a diameter of at least 100 (a test asserts it); level 9's smallest bubble is 50, so 120 units.

## Similar games

Bubble and balloon popping is the most copied toddler touch toy: a first cause-and-effect game for the youngest, then a skin for letters, numbers and colors for older children, with the older versions adding clocks, buzzers and points. The shooter family (Puzzle Bobble and its heirs) is a different game that borrows the same bubbles. **Every page below was read through search summaries; page fetches failed on DNS in this session, so none of the details is quoted from the page itself.** Store listings are the developers' own words and change often; I left out search results that were mirror or spam pages.

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| *GigglePops* ([listing](https://www.applevis.com/apps/ios/games/giggle-pops)) | app, from about six months | No levels, scores, timers or wrong moves: tapping a bubble plays a cheerful note; a caregiver can switch color-name announcements on | Our lap levels already match it; the **color name said at a pop** as a language moment | nothing to leave; it is the model for lap |
| *Bubbles* ([BridgingApps review](https://bridgingapps.org/bridgingapps-reviewed-app-bubbles/)) and *Fun Bubbles Lite* ([listing](https://apps.apple.com/fm/app/fun-bubbles-lite/id418096758)) | apps, toddlers | **She makes the bubbles:** dragging a finger blows them (Fun Bubbles supports up to ten fingers), tapping pops them; each size has its own pop pitch; Bubbles notes that tilting the device slows the bubbles for easy drawing | **Blow, then pop**, as a lap mode (the reverse gesture); **pitch by size** | making bubbles as the only goal; ten fingers |
| *Baby Bubbles Babble* ([listing](https://apps.apple.com/us/app/baby-bubbles-babble/id842788895)) | app, a parent's one-year-old | No menus; a lullaby; seven colors; vibration on each pop | menu-free, wait-for-nothing start (our level 1 is that); a gentle sound | vibration (device-dependent) |
| *Balloon Pop – Learning Games for preschool Kids & Toddlers* ([Nintendo listing](https://nintendo.co.uk/Games/Nintendo-Switch-download-software/Balloon-Pop-Learning-Games-for-preschool-Kids-Toddlers-Learn-numbers-letters-shapes-and-colours-in-14-languages-2039101.html)) | Switch, touch only | One game for numbers 1–20, letters, shapes and colors; the child can change balloon size and speed | **numbers beyond ten** (to 20); size and speed as comfort, not as the ladder | one toy carrying every subject (letters, shapes live in other games) |
| Sheppard Software's *Skip Counting Balloon Pop* ([menu](https://sheppardsoftware.com/mathgames/menus/counting.htm); a [mirror](https://cdn.spellingtraining.com/math-games/skip-counting-balloon-pop.html) describes it) | web, K–2 | Pop balloons in order while counting by 1s, 2s, 5s or 10s; the player picks the step | **the step as the knob**: ones, tens, fives, twos | the buzzer, the point loss and the clock the mirror describes |
| *Bubble Swipe* ([listing](https://apps.apple.com/app/id507489484)) | app, kids and adults | Swiping sweeps bubbles away; clearing a screen brings a new colored one | **swipe-through pop** for hands that cannot yet aim | its "fidget" loop without an end |
| *Bust-a-Move / Puzzle Bobble* ([guide](https://almarsguides.com/retro/walkthroughs/snes/games/bust-a-move/)) | arcade | Fixed layouts to clear; the ceiling lowers after a number of shots; a boss at the end | a **changed rule at a checkpoint**, and a fixed layout as a puzzle | the lowering ceiling and the lost stage; the shooter (it is its own game, the [Bubble Cannon](../IDEAS.md) idea) |
| *Zuma's Revenge!* ([wiki](https://gamicus.fandom.com/wiki/Zuma%27s_Revenge!)) | PC / console | New level kinds (a frog that hops between lily pads, one that slides on a track), a checkpoint every five levels | **new kinds of level, not only faster ones** | power-ups, medals earned by speed |
| Blowing real bubbles; popping bubble wrap (physical) | off-screen | Wand and breath, then chasing and popping; counting the pops aloud | the existing off-screen suggestion; a bubble-wrap sheet to count in tens | nothing |

**Learning and developmental sources** (all read secondhand, none checked against the original).

- **Counting forward from a number other than 1** is a kindergarten standard, K.CC.A.2; an NWEA item write-up says it also builds the idea of counting on that supports addition ([Achieve the Core](https://achievethecore.org/content/upload/K.CC.A.2_NWEA.pdf)). **Counting out and counting to tell how many** are K.CC.B.5; its official wording is on [corestandards.org](https://www.corestandards.org/Math/Content/K/CC/), which I could not fetch, so the "up to 20 in a line or circle, up to 10 scattered" limits come from a [secondary summary](https://goblinsapp.com/standards/math/ohio/k-cc-b-5). **Making ten** is K.OA.A.4 ([StudyPug's list](https://studypug.com/curriculum/us/common-core/math/kindergarten)). Skip counting by 5s, 10s and 100s is a grade-2 standard (2.NBT.A.2) from my own recall; I did not find a page to cite.
- **Subitizing.** Clements (1999), "Subitizing: What is it? Why teach it?", *Teaching Children Mathematics*, is the usual reference; I saw it cited in a [grade-1 lesson](https://www.wccusd.net/cms/lib/CA01001466/Centricity/domain/60/lessons/grade%201%20lessons/NumberRecSubitizingV4.pdf) that has children subitize 1–4 and break them into different dot arrangements. Clements and Sarama call quick partitioning of a group "conceptual subitizing" ([Hechinger Report](https://hechingerreport.org/?p=105260)). A CERME 9 poster found the dice layout the easiest to name and that two-group structures helped children move toward conceptual subitizing ([poster](https://halshs.archives-ouvertes.fr/hal-01288559v1/file/CERME9.TWG13.29.posters.Rodrigues.pdf)).
- **Giving a number.** Wynn (1990, *Cognition* 36, 155–193) introduced the Give-N task; children learn number words one at a time ("one-knower", "two-knower"), and about a year passes between "one-knower" and understanding that the last number counted says how many; most are there by about three and a half ([a secondhand summary](https://jnc.psychopen.eu/index.php/jnc/article/download/7029/7029.pdf); I did not see the paper's own text). This is why a counted set is a Duck Pond and Duckling Parade skill and not new here.
- **Tracking moving things.** Smooth pursuit appears in the first weeks, matures mostly between two and six months and keeps improving; the studies disagree on when it nears adult level, and it is still incomplete at 18 months in some of them ([Rosander](https://www.robotcub.org/misc/papers/07_Rosander.pdf), [BJO paper](https://bjo.bmj.com/content/96/1/73)). This supports slow, big bubbles for a one-year-old; it is not a measurement of her.

## What makes sense here

**The toy stays simple, and the plan says so.** The short-ladder audit and its round three both put Bubble Pop under "Leave: the ceiling is right" (a simple toy; arithmetic lives in Duck Pond and Frog Hop), and the developer's 2026-10-10 note says more quantity is wanted. Those two agree more than they seem to: the quantity worth adding to a toy is **fresh content and gentler ways in**, and the only levels worth adding on top are ones that ask a decision no other island game asks. The plan therefore has a ready core of fresh content, guards and below-level-1 play, and puts the levels on top (12–14, all counting-sequence skills, no arithmetic) in front of the developer as a decision that **overrides the audit's leave**, not as ready work.

**Fits.**

- **Friends who say who they are.** The release animation already exists and the seven critters match the seven synthesized animal voices exactly, so a released friend can name itself and make its sound at no art cost: a language moment in free play.
- **Dots on number bubbles** where she is learning the numerals (count 7–8, bonds-to-5), faded at the next level, following the dot convention Duck Pond uses and the subitizing sources above. This is the missing "seeing the quantity" in a game that today shows only numerals.
- **A new background per round** (shore, bath, night, sea), each costed separately.
- **Counting-sequence levels on top:** start at a number (K.CC.A.2), count back, skip count. Each reuses count mode's drifting bubbles and `next` rule; none is arithmetic.
- **Easier ways in, below level 1 and between levels:** tap anywhere, blow-then-pop, big and little, which one has the dots. These wait on the level-order decisions.

**Does not fit,** and why, is under "Left out on purpose".

**Arc by band.** Lap: pop anything, then pop anywhere, then blow bubbles; the friends name themselves. Toddler: a color word at a pop, big and little, two to five colors. Preschool: colors then numbers in order with dots beside them, then which bubble has this many dots. Pre-K: numbers in order, start at a number, bonds to 5 with dots. School: bonds to 10, count back, count by tens and fives. Nothing speeds up past what level 3 already does.

## Proposed ladder

### Fresh content inside existing levels

All ready; none needs a decision. Costs name what each needs.

1. **Friends name themselves** (levels 1–3). When a friend is released the voice says "A duck!" and the animal makes its sound (`sfx.animal`), then the hop and giggle as today. Needs 7 short voice lines (a name each; `{pet}` is not involved) and a table from critter to `AnimalSound`. A rule test asserts that every critter in the sticker list has both a sound and a line. No art.
2. **Pictures in bubbles beyond friends** (levels 1–3). A second pool drawn in code, chosen by the round's scene: a fish and a starfish for the sea, a star and a moon for the night, a rubber duck and a boat for the bath, a flower and a shell for the shore. They are not critters, so they do not change the sticker. Each releases like a friend (drops, hops) and the voice names it. Cost: about six small drawings. Reuse `props.ts` and `scenery.ts` pieces where one fits. Test: every picture has a line; the sticker pool stays exactly the seven in order (slice 1 pins it).
3. **Four backgrounds, one per round, picked by `rng`** (all levels). Costed separately because they are not equal:
   - *Shore* (today): none.
   - *Bath*: a recolor of `Backdrop` (pale teal sky, tile-colored hills) plus a drawn tub rim and bathwater line at the bottom. Small.
   - *Night*: a recolor (navy sky, no sun) plus about thirty drawn stars and a moon, since `Backdrop` has neither. Plain bubbles are 20% opaque, so at night the rim has to be lighter. Small to medium; **needs a legibility screenshot** of plain and colored bubbles.
   - *Sea*: `Backdrop` is a sky with hills, so a sea is a different background: a water gradient, light rays, seaweed and a few decorative fish (`eventMode = 'none'`, so they do not intercept taps). Medium. It is the one most worth doing, since bubbles belong in water.
   Test: each scene's background colors contrast with a plain bubble's rim; the scene draw is deterministic for a seed. A seeded round always picks the same scene, so a sticker can show it later without a stored version (the sticker keeps the shore).
4. **A color word on every right pop at level 4,** every other at level 5 and every third from level 6. The first colors are what a two-year-old is learning; the voice stays rationed once she knows them. Voice lines exist (`color.<name>`).
5. **Dots on number bubbles.** Dice layouts for 1–6 and a five-and-some ten-frame layout for 7–10, drawn small under the numeral. On at levels 7 and 8 and at level 10 (bonds to 5, where the two bubbles' dots make five); off at levels 9 and 11 so the support fades. Test: the dot count equals the number; dots stay inside the bubble and do not overlap the numeral; the layout for each number is fixed (the same eye-shape every time), because dice layout is what the subitizing source found easiest to name. The tap target and the number's size stay as they are.
6. **Bonds-to-5 stays as it is.** It draws only two different facts (known gap 7), but a zero bubble would be a new idea and a longer round is more clutter. With dots on (item 5) the repeat reads as practice, not a flaw.
7. **Co-play and off-screen lines** that match the new content: "Name the color together as {name} pops it" already stands; add "Count the dots on each bubble with your finger" for 7–8 and 10.

### New levels on top

These **override the audit's leave** and so wait for decision 1 in "Decisions for the developer". Each asks a decision no other island game asks (counting on, counting back, skipping by a step) and none is arithmetic. All three are count mode with a different rule for which number is next, so they reuse the drifting bubbles, the `next` check, the glow hint, the voice and the bot (`bubbleToPop` already pops `next`). IDs are appended, never inserted.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 12 | Start at a number | pre-K 6–12 (lean), school 10–14 | "Start at 6!" Bubbles 6, 7, 8, 9, 10 drift; she pops 6 first, then each next number | the next number after a given one (K.CC.A.2): not always 1 | A wrong bubble wobbles and says "Find 8!"; two wrong in a row glow the right one (a hint); the idle glow after six seconds stays free. The start is said again after a miss | `from` is at least 2; the run `from..from+goal−1` has no number above 12 in pre-K rounds and above 20 in school; every number appears once; the run fits `most`; count mode drifts | Plan fields `from`, `step`; initial `nextNumber`; one voice line (`bubble.start`); how-to step bounded `from: 12, to: 12`; `describeLevel`; no new art; the bot works unchanged |
| 13 | Count back | school 10–14 (pre-K top left to the developer) | "Count back from 5!" Bubbles 5, 4, 3, 2, 1; the next is one fewer | the next number going down; the start is the largest | as level 12; "Find 3!". After the 1 pops the finale's rainbow bubble comes with "Blast off!" | `step` is −1; the run ends at 1 (or a stated end) and never goes below 0; the start is ≥ 4; count mode drifts | As 12, plus one finale line. **Overlaps Bumper Garden's proposed level 6 "Count back"** ([IDEAS](../IDEAS.md)); decision 3 chooses one home |
| 14 | Count by tens and fives | school 10–14 | "Count by tens!" Bubbles 10, 20, 30, 40, 50; later rounds count by fives to 25 or 30 and by tens from a teen start (10, 20…) | the next number in a skip pattern (K.CC.A.1 for tens; the grade-2 standard for fives) | as level 12; no arithmetic is said (never "ten more than 20"); the voice counts the step aloud as she pops ("ten, twenty, thirty"), which is the hint the sequence needs | `step` ∈ {5, 10}; every number is a multiple of the step; the run is within `most` and ≤ 100; the count voice has a line for every number it can say (device speech for "forty", "fifty" and so on is **unchecked**) | As 12; voice lines for the multiples; **a person check** for number words on a device |

Windows: pre-K 6–12 means she meets bonds-to-10 (level 11) and "start at" (12) before reaching school, and school 10–14 keeps its lower bound so no saved level moves. Leaving pre-K at 6–10 is also fine and leaves the new levels to school alone; decision 2 asks.

Sketches, not levels yet: **15, Evens and odds** (pop the numbers that pair up: 2.OA.C.3 pairs objects, and bubbles can show their pairs by joining two at a time), and **a "make 20" bonds level** (11 + 9; it overlaps Duck Pond 10 and Frog Hop's crossing ten, so it only goes ahead if those do not cover it).

### Younger-band openings

**None to add.** The game already starts at lap from level 1. What would help a one-year-old sits below level 1.

### Levels below level 1 (waiting on the level-order decisions)

These wait on [how levels are ordered for a band and whether a band's range may skip](../ROADMAP.md#waiting-on-the-developer): each is easier than a level that already exists, so appending it makes "step up" run backwards unless levels get an explicit order apart from their IDs. IDs are assigned when built.

- **Pop anywhere** (lap, before level 1). A tap anywhere on the screen pops the nearest bubble that is on the screen, however far; there is no miss and no wrong place. The rainbow bubble at the end is also "tap anywhere". The reason: level 1's smallest target is already a 173-unit circle, but a one-year-old's tap is a swat, and a flat palm is a legitimate "tap". Rule test: every point of the screen resolves to a bubble while one is in reach; none resolves to nothing, none counts a miss; a tap with no bubble showing does nothing. Cost: a whole-stage input layer last in the stage, no art, no voice; the bot taps a bubble as today. A person check: whether she pops by swatting at all.
- **Blow, then pop** (lap). Dragging a finger blows a trail of bubbles that then float and can be tapped (the reverse gesture of *Bubbles* and *Fun Bubbles Lite* above); the round ends after a number of pops with the rainbow bubble, so the gentle finish is the same one. New custom pointer handling: palm rejection, `pointercancel`, leaving the screen and cleanup are in scope. Rule test: a drag of length d creates at most k bubbles and never more than `most`; a cancel creates none. Cost: M. A sketch until a person check shows a lap child drags before she taps.
- **Big and little** (toddler, between levels 3 and 4). The voice says "Pop the big ones!" or "the little ones!"; bubbles come in two sizes with a ratio of at least 1.7 (little at 42–48, big at 84–96, so the smallest tap target is about 101 units), and the round asks for one size. A wrong size wobbles and says "That one's little. Find big!"; two in a row glow the right size. The pop pitch can follow size (bigger is lower, as in *Fun Bubbles*), which makes the contrast audible too. Rule test: the two size ranges do not overlap by at least the ratio and the smallest keeps the 100-unit target; there is always a target size showing (as `spawnTarget` does for color). Cost: a plan field `sizes`, one voice line each way, a `bubbleToPop` branch. **Overlap check:** Size Parade asks for the biggest or smallest friend and for ordering friends, so this is a sort by size on moving bubbles, not seriation; it sits where color sits, a property the bubble itself has.
- **Which one has the dots?** (preschool, between levels 6 and 7). The voice says "Pop the one with four!" and the bubbles carry dot patterns only (no numeral), then a later round carries numerals and dots mixed, matching dots to a numeral by popping the pair. Subitizing 1–4 first (the grade-1 lesson above), dice layout throughout. A wrong bubble wobbles and the voice counts its dots aloud, "That one has three. Find four!"; two in a row glow the right bubble. Rule test: exactly one bubble per target count showing; no two showing bubbles have the same count unless both are right; every count 1–6 has a fixed dice layout. Cost: a mode that reuses the dot art from "Dots on number bubbles" and `isRight`'s pattern from color; one voice line; a bot branch.

### Left out on purpose

- **Pop exactly N** (the Give-N task). Duck Pond already has "put N in" and Duckling Parade "bring exactly N"; a third copy would teach nothing new and the stop-at-N rule can be won by waiting for the bubbles to run out.
- **Make 20 and other arithmetic past ten** as a ready level (see the sketch above): Duck Pond 10 and Frog Hop hold making ten and crossing ten.
- **Letters and words in bubbles** (the *Balloon Pop* and ABC apps). Letter Trails, Word Monsters and Clap the Syllables hold them, and a letter game needs checked device speech.
- **A timer, a buzzer, a lost point or a clock** (Sheppard's mirror has all of them). Ruled out by the project; a bubble that floats off is not a loss.
- **Shooters, boards that fill, a lowering ceiling, power-ups, boss levels** (*Puzzle Bobble*, *Zuma*). Different games; the shooter idea is in [IDEAS](../IDEAS.md) as Bubble Cannon and carries its own rules.
- **Speed-ups.** Nothing in this plan is faster than level 3 (75 px/s). Levels 2, 3 and 5 and 6 already add speed and a crowd; I would not add more, and a future slice could check whether those levels belong gentler.
- **Vibration, ten fingers and tilt** (the toddler apps' extras): device-dependent or multi-touch for a game whose point is one tap.
- **A couch entry.** A calm toy; the co-play line already covers it.

## Decisions for the developer

1. **Override the audit's leave for levels 12–14?** The audit says Bubble Pop's ceiling is right. The plan's lean: yes, as three counting-sequence levels (start at, count back, skip count) that ask something no other game asks and that are not arithmetic. If the answer is no, the fresh content and the below-level-1 play stand on their own.
2. **Windows.** Lean: pre-K 6–12, school 10–14 (school's lower bound stays 10). Alternative: pre-K stays 6–10 and the new levels belong to school.
3. **"Count back": here or in Bumper Garden 6?** Both are proposals. Lean: here, because count mode already has everything it needs; Bumper Garden could then take a different level 6.
4. **Which backgrounds and what happens to the sticker.** Lean: shore, bath, night and sea in that order of cost, with the sticker and map icon staying on the shore and the friend inside, as before.
5. **Dots on the numeral bubbles at levels 7, 8 and 10.** Lean: yes, then check the bubble is not too busy at level 9's 10 bubbles; no dots on 9 and 11 so the support fades.
6. **The below-level-1 and between-level entries** wait on the two level-order decisions already on the roadmap; "blow, then pop" additionally needs the person check above.
7. **Skip-counting words** (tens and fives) are unverified on a device, the same open question as Opposites' un- words.

The level-order decisions already have a row in [Waiting on the developer](../ROADMAP.md#waiting-on-the-developer); the others are added there as one row.

## Build slices, in order

Each is sized for one session. Slices that add a level are built in level order so saved IDs stay unbroken.

1. **Guards and friends who say who they are** (ready; no decision). Bound the how-to's last step (`to: 11`) and correct its goal; pin `sticker(seed)`'s list with a test; extract the "this mode drifts in place" rule into `logic.ts` and assert that every mode that needs a particular bubble uses it; give a released friend its name and sound. Tier: typecheck, the game's rule tests and the how-to test, then one filtered browser play of level 1 (`ORIGINALS_ONLY=bubbles`) since release changed. Update the GAMES.md entry and the README row.
2. **Dots on the number bubbles** (ready). Tier: rule tests, then a portrait screenshot of levels 7, 9 and 10 for the busy-bubble check, and `fingerdemo` at 10.
3. **Backgrounds: bath and night, then sea** (ready; each a sub-slice). Tier: rule tests, one screenshot of each scene (plain and colored bubbles on each).
4. **Pictures in bubbles beyond friends** (ready after 3 for the scene-linked pool).
5. **Level 12, Start at a number** (needs decisions 1–2; school-only window first if pre-K is undecided). Tier: new level on an existing interaction: rule tests, one browser play of level 12 and `fingerdemo` at it.
6. **Level 13, Count back** (needs decision 3), then **level 14, Count by tens and fives** (needs the word check).
7. **Below level 1 and between levels: pop anywhere, big and little, which one has the dots** (wait on the level-order decisions); **blow, then pop** after a person check.
8. **Sketches:** evens and odds, make 20, a journal row per picture.

## What was built in this session

**Slice 1, the guards and friends who name themselves** (the first half of build slice 1; the pinned-list and drift tests are the rest of its guards).

- `FRIENDS` moved into `logic.ts` and a test pins it to the seven in order; `staysPut(mode)` is the one rule that count and bonds bubbles drift in place (used by `update()` and `spawn()`), with a test that their whole set fits `most`; each friend has an animal voice (`FRIEND_SOUND`, a test checks all seven are distinct) and the first of each friend in a round says its name (`bubble.friend`, "A duck!") as it makes the sound, replacing the giggle.
- The how-to card's last step is bounded (`from: 11, to: 11`), its goal no longer says the bubbles "float up", and a test asserts a level above the ladder starts with no inherited step.
- Checks: `npm run typecheck` and `npm test` (122 files, 864 tests) pass. Browser results are in `docs/VERIFICATION.md`.
- Not done: the sound and the spoken name on a device (they are synthesized and device speech), and how often a child hears the name.
