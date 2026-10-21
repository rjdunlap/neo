# Roundup deep dive

*ID `roundup` · bands lap, toddler, preschool, pre-K · levels 1–8, 10–11 built · session `claude/dive-roundup` ([PR #580](https://github.com/rjdunlap/neo/pull/580))*

Research and ideation only: nothing under `src/` changed. Roundup is the island's one flee-steering game (Duckling Parade steers a leader; here the herd runs *away* from the finger), so this dive keeps that feel and grows what the pens ask for: more kinds, sorting by more than kind, equal shares, a missing part, and two gentler rungs for the youngest hands.

## The game today

**What she does.** Farm animals wander on a meadow (`src/games/roundup/index.ts`); fenced pens with an open left-hand gate sit on the right. At level 1 a tap sends an animal hopping through its gate by itself. From level 2 a finger on the grass makes every animal within 190 units scoot away from it (faster the closer it is: `fleeSpeed`), so she wiggles a finger behind the herd to push it through the gate. Animals bump along fences instead of passing through them (`throughGate`) and never leave the field. A penned animal cheers, speaks in its own voice (`sfx.animal`) and ambles about inside. Counting levels show a numeral on the pen sign, say each animal's count as it enters and end on a bell button the pen waits for.

**Learning purpose.** Motor planning (getting behind a moving target and steering it), sorting by kind, counting out an exact number and reading a numeral. Skills `motor-planning`, `sorting`, `counting`; land Barnyard; music `STYLES.hub`.

**The ladder** (`PLANS` in `logic.ts`; windows lap 1, toddler 1–3, preschool 2–5, pre-K 3–6; no `order` or `entryLevels` when this dive was written; levels 10 and 11 have since been built with them, see slices 3 and 4):

| Level | Mode | Bands whose window holds it | What she decides |
| --- | --- | --- | --- |
| 1 | `tap`, 3 animals of one kind | lap, toddler | Nothing can be wrong: which animal to tap next; a tapped animal hops in by itself |
| 2 | `shoo`, 3 animals | toddler, preschool | Where to put the finger so the animal moves toward the gate, not away from it |
| 3 | `shoo`, 5 animals | toddler, preschool, pre-K | The same, with a bigger herd that scatters |
| 4 | `sort`, 4 animals, two pens | preschool, pre-K | Which pen each animal belongs in (pigs to the mud, bunnies to the carrots) |
| 5 | `count`, 6 animals of one kind, one pen asking 2–4 | preschool, pre-K | How many to let in, and when to stop and ring the bell |
| 6 | `sortCount`, 7 animals, two pens asking 1–3 each | pre-K | Both at once: kind and count, then the bell |

**Content pools.** Kinds `pig`, `bunny`, `cow` (`Kind`); one-pen levels pick one of the three, the two sorting levels are always pigs and bunnies, so the cow is never sorted. Pen floors are mud, carrots and hay (`FLOORS`); the sign shows the animal's face and, at counting levels, a numeral. Level 4 is always two pigs and two bunnies (`Math.ceil(n / 2)`); level 5's target is 2–4 of six; level 6 gives each pen its target plus one spare. Starting positions come from a seed of the level and herd size, so a level's first layout is the same every time and only the wander varies.

**Mistakes and help.** An animal through the wrong gate boings and hops back out with "Oops! That's the pig pen!" (one miss, at most one spoken line every two seconds). The bell with too many says "Oops, that's 5! We need 4" and the extra ones hop out; too few says "We have 2. We need 3!"; each ring that is wrong is one miss. Two misses, or fifteen seconds without progress, light every loose animal that still has a pen to go to and that pen's gate, and wiggle the bell when the pens are right (one hint). At thirty seconds without progress the nearest needed animal trots home by itself (`helped`), uncounted. The ghost finger shoos from a point behind the animal, opposite its gate (`shooPoint`), and taps the bell.

**Known gaps** (write-up findings, not fixes):

1. **The uncounted helper (fixed in slice 1).** The thirty-second trot-home finishes rounds that a hand could not, and the round's result does not say so; a struggling toddler can step up on help alone. It should count as a hint.
2. **A numeral alone (fixed in slice 1).** Level 5's sign shows "3" with no dots; the same child reads Animal Snack's and Bubble Pop's numeral-plus-dots signs. Spoken counts as each animal enters are the only support for the number.
3. **Fixed sorting cast.** Every sort is pigs and bunnies, two and two; replay varies the shuffle and little else, and the cow, who has a hay pen drawn for her, never meets a second pen.
4. **Level 1 answers only its animals (fixed in slice 1).** A lap tap on the grass, the pen or the sign does nothing (the stage's hit area is only set for shooing); a one-year-old's first touches mostly land there.
5. **Toddler's second rung is the hard one.** Toddler's window is 1–3: after tapping, a toddler meets three animals that run from the finger, with the gate's half-open fence to find. There is no rung between "tap and it goes" and "shoo three".
6. **One finger.** The flee logic follows one pointer (`pointer`), so a parent's second finger is ignored; co-play is advice on the card ("show her how to wiggle a finger behind the animals"), not a role.
7. **Only "that's the pig pen" is spoken** for a wrong pen (`herd.wrongpen` names pig or bunny); the sort instruction is fixed text. Both need `{a}`/`{b}` arguments before any other kinds can be sorted.
8. **No journal entries, no couch entry**, and the first layout of a level repeated across rounds (layout part fixed in slice 1: the start comes from the round's rng).
9. **Person checks never recorded:** whether a one-year-old's tap on a wandering critter lands (the body-centred hit circle is 85 body units at 0.32 scale, about 54 on screen, larger than the drawn body), whether the flee radius feels like "they run from me" or like broken touch, whether the bell is understood as "I'm done" rather than another animal.

Couch: none, and none proposed. A pad can move a dog that the herd runs from (Duckling Parade's couch steering), but the fun here is the finger on the grass; a couch version would be a new game.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Extreme Herder](https://pinkpt.com/extreme-herder-tips) (Neopets, Flash) | Carry petpets one at a time to an exit before Balthazar catches them; later levels close exits and the [sequel](https://thedailyneopets.com/neopets-games/extreme-herder-two/) adds rocks, puddles and power-ups | Fewer exits, more obstacles, a chaser that picks the nearest petpet | The nearest-first rule as a hint ("that one first"), closed gates as a later puzzle (which pen is open) | Balthazar, three lives, the game over, speed as the only variable |
| [Puffle Roundup](https://tundrapenguin.fandom.com/wiki/Puffle_Roundup) (Club Penguin) | Puffles flee the cursor; push them into a pen before 120 seconds run out; different colours run at different speeds; a puffle pushed off the edge is lost | Speed by colour, a timer, score by time left | The core: a crowd that scatters from the pointer and a pen you push toward; a colour or kind that is calmer than another as a *visible* difference | The timer and its score, escape off the edge (the island's fences hold) |
| [Stampede](https://en.wikipedia.org/wiki/Stampede_(video_game)) (Activision, Atari 2600) | Rope cattle in a scrolling run; most run ahead of you, the black calf stands still; three escapes end the game; eight speed levels | Faster herds, point values by colour, a stubborn one | A stubborn animal who must be gone and fetched (a reason to steer, not just push); keeping the slow ones bunched in front | Lives, escapes, speed levels, score |
| [Flock!](https://www.co-optimus.com/article/347/Slaugh_err_Herd_Animals_with_a_Friend_in_Flock.html) (Proper Games/Capcom, 2009) | A UFO herds sheep, chickens, pigs and cows to a mothership; each species reacts to the UFO in its own way; two-player co-op; a suggested time | Species with different responses, terrain puzzles (bridges, boulders), optional time rewards | Species that answer the finger differently (slower, braver, in a line), and the two-shepherd co-op | The time rewards; physics puzzles belong to Chain Reaction |
| [Sheep Control](https://apps.apple.com/us/app/sheep-control/id6745818043), [Flock It!](https://toucharcade.com/games/flock-it), [Flockwork](https://toucharcade.com/community/threads/flockwork-by-the-pig-rush-dev-99-to-free.134167/) (iOS) | Current touch herders: a flock that runs from a finger, or (Flockwork) *follows* it as one group | Level packs, obstacles, mini-games | Flockwork's follow-the-finger as the gentle rung for small hands (a herd that comes along is easier than one that runs); Flock It!'s finger-only control | Level packs for their own sake, star ratings |
| Sheepdog trials (physical) | A dog drives sheep through gates and into a pen; the shepherd stands still at the post and directs | Harder outruns, more gates, a split (shedding) of marked sheep from the flock | Shedding: take only the marked ones (the *Leave the cows* level), and the pen as the final, calm act | Judged points |
| [Farmer's Market Color Sorting Set](https://www.walmart.com/ip/seort/23434455) (Learning Resources, 18 months+) and farm sorting toys | Put each piece in the basket of its colour; count the baskets | A grown-up changes the rule: by colour, then by kind, then "two of each" | The rule that changes while the pieces stay the same; "two of each" as a counting rule a toddler can hold | Nothing to leave out: it is the table version of this game, and the off-screen suggestion already names it |

**Learning references.** Kindergarten standards [K.MD.B.3](https://tasks.illustrativemathematics.org/content-standards/K/MD/B.html) (classify objects into categories, count each category) and [K.CC.B.5](https://achievethecore.org/content/upload/K.MD.B.3_NWEA.pdf) (count out a given number of objects, up to ten scattered) are exactly levels 4–6; equal sharing and "how many more" sit under K.OA. On sorting by more than one attribute at once, [curricula and classroom summaries](https://www.isbe.net/Documents_KIDSWebsiteResources/COG_MATH_Research_Summary.pdf) put single-attribute sorting at three and reliable two-attribute sorting at four to five, so *Big and little* (one attribute, size) fits pre-K and *Two things at once* (kind and size) is a top rung for pre-K or a school window. The [Clements and Sarama counting trajectory](https://www.otffeo.on.ca/en/wp-content/uploads/sites/2/2017/05/Learning_trajectories_math.pdf) places counting out a small set with cardinality in the preschool years and notes children who count a set correctly and still recount it when asked "how many": the bell ("is it right?") is that question, so saying the total once more at the bell helps.

## What makes sense here

Roundup's identity is the finger on the grass and a herd that answers it. Every proposal keeps that: new levels change the *rule the pen holds*, not the control. Fewer, calmer rungs for lap and toddler (a herd that comes along; one animal to shoo), more kinds and varied casts for replay, and for pre-K the three rules that kindergarten sorting and counting actually use: leave some out, make two groups equal, and fill a part that is already started. Size sorting is the one new attribute, because a big and a little pig need only a scale change. A school window exists only as a decision: Roundup's control is a lap-to-pre-K pleasure, and "combine attributes, plan an order" at school is better served by Critter Sort and Robot Path than by a faster herd.

Timers, escapes, lives, speed tiers and score (every reference's progression) stay out; so do power-ups and a chaser, which make the meadow a place to fear.

## Experience and presentation

- **First unsupported action.** At level 1 a tap on any animal sends it home with its own voice and hearts; at level 2 a finger laid anywhere makes the nearest animals scoot, which is a satisfying result even when it goes the wrong way. The gentle rung proposed below (*Come along*) makes the first drag of a lap child an immediate success: the herd gathers to the finger and follows it.
- **Acknowledgment and consequence.** Touch-down draws the pulsing white ring under the finger; animals rotate and hop as they run; a gate entry cheers, speaks, bursts hearts and the animal begins to potter. A wrong gate boings and the animal hops back out to the gate mouth, so the pen never looks like it swallowed a mistake. A right bell says "Everyone is home!"; a wrong bell says the number and the extras walk out.
- **A concrete art and sound example.** *Big and little* needs no new critter art: `new Critter(CRITTERS.pig)` at scale 0.32 beside one at 0.22, with the hit circle kept at its body centre (`new Circle(0, -120, 85 / scale)`) so the small pig stays as tappable as the big one, and the pen sign draws the same pig face at two sizes. The equal-share bell can answer with a two-note seesaw from `src/audio/notes.ts` (low–high when a pen has more, the same note twice when they match) so "fair" has a sound.
- **Variety on replay.** Which kinds appear, how many of each, which two pens are drawn, where the herd starts (seeded per round rather than per level); never a faster herd or a smaller gate.
- **Reasoning versus precision.** Steering is the motor part, and the pen rules are the reasoning. The ladder keeps them separate: new rules arrive on herds no bigger than today's, and the hint lights the animal and its gate without moving them. *Come along* is proposed precisely so the youngest band gets the reasoning of "into the pen" without the precision of getting behind a runner.
- **Supported ending and replay.** The idle hint and the trot-home keep every round finishable; the write-up asks that the trot-home be counted. Again replays the same level with a new herd; the celebration's next level plays the one above.
- **Roles.** Solo stays the default. With two fingers supported (slice 9) a grown-up can hold a side while she pushes, which is how two people herd in life; neither finger is scored differently.
- **Person or device checks.** Whether a one-year-old's taps land on a wandering critter; whether fleeing reads as "they run from me"; whether the small pig is distinguishable at an iPad's size; whether "fair" and "the rest" are understood from the pen signs without reading.

## Proposed ladder

### Fresh content inside existing levels

- **More kinds and pens.** Add `duck` (pond floor, quack) and `dog` (kennel floor, woof) to `Kind`, both already drawn in `CRITTERS` and voiced in `sfx.animal`; the one-pen levels pick from five kinds, and the sorting levels draw their two pens from the pool (pig/mud, bunny/carrots, cow/hay, duck/pond, dog/kennel), so a cow finally meets a second pen. `herd.sort` and `herd.wrongpen` take `{a}`/`{b}` and `{pen}` from the kinds in play.
- **Varied casts.** Level 4 deals 4–5 animals with at least one of each kind, so 1+3 and 3+2 happen; level 6 keeps its spare per pen. A rule test asserts at least one of each kind, more than each target, and both pens different.
- **A count sign with dots** at every counting level, the numeral plus a row of dots like Animal Snack's food sign; at the bell the pet says the total once more ("Three pigs in the mud!") before "Everyone is home".
- **Every touch answers at level 1.** A lap tap on grass makes the nearest loose animal hop once in place and speak; a tap on the pen's sign speaks who lives there. Neither is a miss or a hint.
- **The helper counts.** The thirty-second trot-home adds one hint, and the how-to card's note says so.
- **A seeded layout per round**, from `ctx.rng` rather than the level number, so the herd starts somewhere new on replay.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | **Leave the cows** | pre-K (7 after 6) | Three kinds, two pens: "Pigs in the mud, bunnies in the carrots. The cows stay on the grass!" Six animals, two of each kind | Which animals belong to a pen and which belong to none; the round ends when both pens hold their kind, with the cows still loose | A cow through a gate boings out: "Oops! The cows stay out" (a miss). Two misses light only the animals that have a pen; the cows never glow | Every seeded herd has at least one of each kind, the two penned kinds differ, and the outsider kind matches neither pen; the finish rule ignores the outsiders | Logic: a `stay` kind on the herd and `needs()` returning −1 for it; voice lines; the bot skips outsiders already |
| 8 | **Make it fair** | pre-K (8 after 7) | One kind, two pens with the same floor and a sign showing two pigs with an equals mark between them; 6 animals: "Put the same number in each pen, then ring the bell!" | How many go in each pen; the only rule is equal. 3+3 is right; so is 2+2 with two left loose (a pen that is empty is not "the same") | A wrong bell says which pen has more ("This pen has four, that one has two") and the extra hop out of the fuller pen; two wrong bells glow the emptier pen's gate (a hint) | Herds of 6 or 8; `ringBell` accepts any equal non-zero split; the hint names the emptier pen | Logic: a `fair` mode where `ringBell` compares pens instead of targets; a two-pig equals sign; the seesaw sound; the bot fills to half each |
| 9 | **Fill it up** | pre-K (9 after 8) | One pen asking 4 or 5 (numeral and dots) that already holds 1–3 animals pottering inside; 6 loose: "The pen wants five. Two are in. Put in the rest!" | How many more are needed, from the sign and the pen, before ringing | Too many or too few as at level 5, with the pet counting the pen aloud from one before saying the number still needed ("One, two, three. We need two more") | The pre-filled count is at least one and less than the target; the loose herd exceeds the remainder; the hint counts from the pen's present number | Logic: a `start` count on the pen that `makeHerd` settles before the round; the `count` voice line with a remainder; the bot handles it with `needs()` unchanged |
| 10 | **Shoo one** | toddler, placed by `order` between 1 and 2 | One animal on a short meadow near a pen whose gate is 80% of its fence: "Help the pig into its pen! Wiggle your finger behind it" | Only where to put the finger; one success ends the round, then a second animal appears for a second success | Nothing is a miss. Ten seconds without progress lights the animal and gate; twenty seconds trots it in (a hint) | The gate fraction and flee radius for the plan; two animals per round | Logic: a plan with `gate` and a one-at-a-time herd; `order` for toddler and `entryLevels: [10, 11]`; how-to lines; the bot already shoos |
| 11 | **Come along** | lap and toddler, placed by `order` after 1 | Three animals of one kind that *gather to* the finger and follow it (attraction instead of flight, with the same ring under the finger); one wide pen: "The pigs want to follow you! Lead them to the pen" | Nothing is wrong: where to lead; the pen takes them as they cross the gate | No misses; after fifteen seconds without progress the herd drifts gently toward the gate on its own (a hint, counted) | The follow speed is capped below the flee speed, animals never pile onto one point (a minimum spacing), and the gate accepts them in any order | A `follow` mode in the update loop (a second velocity rule, the fences unchanged); `order` lap [1, 11] and toddler [1, 11, 10, 2, 3]; the bot drags the finger to the gate |
| 12 | **Big and little** | pre-K (12 after 9) | One kind at two sizes, two pens signed with a big and a little face: "Big pigs in this pen, little pigs in that one" | Which pen each animal belongs in by size, with kind held constant | A wrong gate boings out with "That's the little pigs' pen" (a miss); two misses glow the animal and its gate | Every herd has at least two of each size; sizes differ by at least a third; the finish rule uses size, not kind | Scale 0.32 and 0.22 critters with centred hit circles; `Pen.size`; sign art; voice lines; the bot's `needs()` reads the size |

Pre-K's window becomes 3–9 with `order [3, 4, 5, 6, 7, 8, 9, 12]`; preschool stays 2–5; toddler 1–3 with `order [1, 11, 10, 2, 3]`; lap `order [1, 11]`; `entryLevels: [10, 11]`.

### Younger-band openings

Lap already opens at level 1. *Come along* (11) gives lap a second rung without flight, and toddler a success before shooing. No band below lap exists.

### Easier entries and levels between existing ones

*Shoo one* (10) sits between toddler's 1 and 2; *Come along* (11) between 1 and 10. Both are appended IDs placed by `order`, so saved levels and pins keep their meaning. Nothing is renumbered.

### Left out on purpose

- **Speed, timers, escapes and lives**, which are how every reference progresses.
- **A chaser (Balthazar, a fox)**: the meadow stays safe; Peekaboo Barn and Stop and Go already handle surprise.
- **Obstacle puzzles (rocks, closed gates)**: Robot Path and Chain Reaction hold planning; a closed gate here would mostly mean a longer shoo.
- **Colour sorting** (red pigs, blue pigs): Color Garden and Critter Sort own colour; Roundup sorts kinds and sizes that animals really have.
- **A couch mode**: the finger on the grass is the game.

## Decisions for the developer

Each has a default below; the build proceeds on it.

1. **A school window** with 13 *Two things at once* (big pigs only in the mud, little pigs and all bunnies out; kind and size together). Default: no school band; 12 is pre-K's top. Alternative: school `order [12, 13]`.
2. **Lap's second rung.** Default: *Come along* joins lap by `order` once built. Alternative: lap stays at level 1 and 11 is toddler only.
3. **Equal shares with leftovers at 8.** Default: 2+2 with two loose is accepted (equal is the rule, and the pet says "and two are still on the grass"). Alternative: every animal must be penned, which makes 8 a division level.
4. **The trot-home as a hint.** Default: counted from slice 1. Alternative: keep it silent and show it on the card only.

## Build slices, in order

1. **Support truth** (built; existing-game bug fix tier: typecheck, `logic.test.ts`, one filtered play of levels 1 and 5): the trot-home counts a hint, a count sign with dots at 5–6, a lap tap on grass or sign answered without a miss, the total spoken at the bell, a seeded layout per round, and the how-to note. IDs and windows unchanged.
2. **Kinds and pens** (built; [PR #672](https://github.com/rjdunlap/neo/pull/672); logic tier plus one filtered play of 4 and 6, `fingerdemo` at 6): duck and dog, pens drawn from the pool, dynamic voice lines, varied casts at 4; level 6 retains exactly one spare per pen.
3. **Level 10 *Shoo one*** (built; [PR #686](https://github.com/rjdunlap/neo/pull/686); new levels tier): two successive one-animal successes, 80% gate, unchanged 190-unit flee radius, a short near-gate meadow, ten-second glow and twenty-second trot-home (each counts one hint, fresh per animal); no misses. Toddler `order [1, 10, 2, 3]`, `entryLevels: [10]`. Level 11 remains unbuilt.
4. **Level 11 *Come along*** (built; [PR #688](https://github.com/rjdunlap/neo/pull/688); new interaction tier: typecheck, units, one scripted play of 11 at lap and toddler, one portrait screenshot, `fingerdemo` at 11): the follow mode (`COME_ALONG`: three animals of one kind gather to the finger at a capped 190-unit follow speed, led through an 80% gate into one pen, no misses; fifteen idle seconds start a drift and one hint, the thirty-second trot-home stays), lap `order [1, 11]`, toddler `order [1, 11, 10, 2, 3]`, `entryLevels: [10, 11]`.
5. **Level 7 *Leave the cows*** (built; [PR #698](https://github.com/rjdunlap/neo/pull/698); new levels tier): two pigs and two bunnies go into their pens; two cows stay outside. Outsider-specific instruction, miss and finish speech; only needed animals/gates glow; completion ignores outsiders. Pre-K 3–7.
6. **Level 8 *Make it fair*** (built; [PR #709](https://github.com/rjdunlap/neo/pull/709); new levels tier, with the seesaw sound): an even herd of 6 or 8 of one kind and two pens of that kind; the bell accepts any equal non-zero split (loose animals allowed), a wrong bell is one miss that names the counts and levels the fuller pen, two wrong bells give one hint (glow on the emptier pen), `sfx.seesaw` on every bell. Pre-K 3–8.
7. **Level 9 *Fill it up*** (claimed by chat `01a15ffa-b425-7cf1-95ec-179ad1e4546f`, branch `codex/roundup-fill`; new levels tier): pre-K 3–9. Only prefilled counting pen/remainder support. Expected files: `src/games/roundup/{logic.ts,logic.test.ts,index.ts}`, voice/how-to content, filtered browser case and game/roadmap/verification/queue docs. Proof: typecheck, Roundup rules, arcade level 9 and fingerdemo level 9; no other levels/interactions/decisions.
8. **Level 12 *Big and little*** (new levels tier, plus a portrait screenshot for the small pig's size): pre-K `order [3, 4, 5, 6, 7, 8, 9, 12]`.
9. **Two shepherds** (existing-game interaction change: typecheck, one filtered play with two scripted pointers, `fingerdemo` at 3): every active pointer repels, palm rejection kept, both rings drawn; the card's co-play line becomes a role.

Gated: 13 *Two things at once* and a school window (decision 1).

## What was built in this session

Deep dive session: research and ideation only (`node scripts/check-links.mjs`, `git diff --check`).

**Slice 1, support truth** ([PR #627](https://github.com/rjdunlap/neo/pull/627), commit 7786d03e): the thirty-second trot-home adds one hint; counting pens (5-6) show the numeral plus that many dots (`signDots`, up to two a row); at level 1 a tap on grass or a pen makes the nearest loose animal cheer and speak (`nudge`) and a tap on a sign says "The {animals} live here!" (`herd.sign`), neither a miss nor a hint; a right bell has the pet say each pen's total ("3 pigs in the mud!", `herd.total`, singular for 1) before "Everyone is home"; the start layout comes from `ctx.rng` (`startSpots`); the how-to note says the trot-home counts a hint. IDs, windows and other accounting unchanged. The arcade browser case now taps whichever animal is still loose. Checks are in [VERIFICATION](../VERIFICATION.md).
