# Sense Detective, levels 1–5 (definition)

Defined 2026-10-22 as slice **B1** of the [body-health study](../deep-dives/subjects/body-health.md#build-slices-in-order), from its [proposed ladder](../deep-dives/subjects/body-health.md#first-games-proposed-ladder-sense-detective), its [overlap table](../deep-dives/subjects/body-health.md#on-the-island-today-and-overlap), its [presentation notes](../deep-dives/subjects/body-health.md#experience-and-presentation) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#body-and-health-recommendations). Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: built 2026-10-23 (B2, PR #861; levels 1–2 on the defaults below).** The study's B1 gate asks this packet to settle identity beside Photo Safari, accounting for free reveals, the K/S window and the land; each has a default here ([open decisions](#open-decisions)) that the build uses and the developer can still change. Nothing here is clinical or practical health content: the three toys are invented island instruments, the clues are an authored toy table rather than a rule about real objects, and no reviewer is needed before this slice. The study's reviewer gates (body models, practical care, real-object cards) stay on its later slices. Levels 3–5 (several toys still possible, "can we tell?") are B3, [defined 2026-11-05 below](#levels-35-definition-2026-11-05) and not yet built, because multi-select is a new interaction.

**Fun action and purpose:** a wrapped parcel has arrived at the island's little toy museum, and something inside it belongs on the empty shelf. Beside the parcel are two **investigation buttons**: a round **Look** window (a peephole that shows the toy's outline from above) and a **Listen** ear (a gentle shake of the parcel that plays the toy's sound and shows a matching sound picture). She chooses how to find out, sees and hears what it tells her, taps the toy on the shelf the clues point to, and presses the big **Check** card. The parcel's paper falls away and the toy plays. The learning goal is **choosing an observation that answers the question, and knowing when the evidence is enough**: at level 1 a look decides it; at level 2 a look leaves two toys possible, so she has to choose the other sense. This is the pre-K observation-and-evidence work in the study's [audience table](../deep-dives/subjects/body-health.md#an-answer-for-every-audience) (K row) and the information-from-the-senses strand of its NGSS anchor, at a scale a four-year-old can act on.

## Identity and overlap

- **Photo Safari** (Story Grove) asks her to photograph the animal a spoken request describes; all the evidence is on screen at once and the action is finding it. Sense Detective's action is **choosing which sense to use**, and its outcome is that the evidence is not always enough. Level 1 alone is visual; it is the entry to that ladder, and level 2 makes the choice matter. If play shows the choice of channel does not read, the fallback is a Photo Safari mode ([decision 1](#open-decisions)).
- **Sound Garden** (Music Mountain) owns pure sound play: high/low, fast/slow, direction. Here a sound is one piece of evidence beside a picture, never a listening quiz on its own, and every sound has an equal picture so hearing is never required.
- **Trackway Tales** (Story Grove) replays proposed movements against fixed evidence and has a "Can't tell" card; its evidence is given. Here she gathers the evidence herself, by choosing an investigation. B3's "can we tell?" card should reuse Trackway Tales' accounting rule where it fits.
- **Who Am I?** (defined, Barnyard) narrows a gallery by clues the pet gives. Here no one gives the clue: she decides what to find out.
- **Teddy Doctor** and **Pet Says** keep body naming and pretend check-ups. This game names no body part beyond the two buttons (an eye and an ear), says "look" and "listen", and never tests her own eyesight or hearing.

## The model

- **A toy** is an authored record in `logic.ts`: `id`, a spoken name, its **view** observation and its **sound** observation.

  | Toy | View (`view`) | Sound (`sound`) | Sound picture | Drawing |
  | --- | --- | --- | --- | --- |
  | bell | `round` | `ring` | a small swinging clapper with three curved ring lines | a domed brass bell with a loop on top |
  | rattle | `handled` | `shake` | a scatter of little beads with short motion dashes | a round head on a straight handle |
  | drum | `round` | `beat` | a stick striking a skin, with one bold thump mark | a short cylinder with a skin and a cord zigzag |

  The view is the parcel **seen from above through the peephole**: the bell and the drum both show a plain circle, the rattle a circle with a handle. Each toy card on the shelf carries a small **from-above badge** (the same circle, or circle-and-handle) so the match is visible rather than remembered. These are this exhibit's three toys, not a claim about bells or drums in general.
- **An observation** is `{ channel, value }`. `observe(toy, channel)` reads the table. A **record** is the list of observations revealed this round, in order.
- **The possible set** is `possible(cards, record) = cards.filter(c => record.every(o => c[o.channel] === o.value))`, exactly the study's rule: accept exactly the toys that agree with everything revealed.
- **A round** (`planFor(level)` plus `ctx.rng`) is the shelf (an ordered list of toys), the hidden toy, and the channels on offer. The hidden toy is drawn from a shuffled bag of the level's toys so each comes up in turn (not by rerolling); the shelf order is shuffled separately. The same seed gives the same round.
- **Check** compares the one selected card with `possible(shelf, record)`:
  - possible set is exactly that card: **found**, the round finishes;
  - the selected card is **not in** the possible set: a **miss**, with a reason from the clue that rules it out;
  - the selected card is in the possible set but so is another (or nothing has been revealed): **not yet**. Not a miss and not a finish, even if her card happens to be the hidden toy; a lucky guess never ends a round.
  - no card selected: the instruction repeats.
- **A reason** names the clue and the toy's own observation: "The peephole shows a handle. The bell has no handle." / "We heard a ring. The drum goes boom." Every (toy, observation) pair that does not match has a reason line, and a test checks the table is complete.

## Screen and controls

- **Landscape (1024×768 design area):** a wooden museum counter. The **parcel** (240×200) sits centre-left with the investigation buttons beside it: **Look** (a round window, 150×150) on its left and, at level 2, **Listen** (an ear on a soft pad, 150×150) on its right. Under the parcel, the **evidence strip** shows each revealed observation as a 140×140 card in order (the circle or circle-and-handle; the sound picture with a small speaker mark). The **shelf** runs across the lower middle with the toy cards (200×220 each, two at these levels), spread with `spread()` clear of the pet's corner (150 units, bottom-left) and the home button (top-left). The **Check** card (170×170, a green tick on a museum label) sits at the right end of the shelf, apart from the toys so a selection tap cannot land on it. All at least 100 units after scaling.
- **Portrait:** the parcel and its buttons stay at the top, the evidence strip below them, the shelf in the middle and Check under the shelf's right end; the pet keeps its corner. `exhibitLayout(view, cards, channels)` returns every rectangle and a test asserts sizes, clearances and no overlap at the four views for two and three cards (three for B3), one and two channels.
- **Look:** touch-down squishes the window; the peephole's shutter slides open and shows the outline, which drops into the evidence strip. Looking again replays the shutter; the strip keeps one card per channel.
- **Listen:** touch-down squishes the ear; the parcel wobbles, the hidden toy's sound plays (`sfx.bell` on a pentatonic step for `ring`, `sfx.drum()` for `beat`, and a new short unpitched bead shake for `shake`: three bandpassed `noise` bursts, a new `sfx.shake()`), and the sound picture drops into the strip. A tap on a sound card in the strip replays it. The picture carries the same information as the sound, so she can answer without hearing it.
- **A toy card:** touch-down lifts it; a tap **selects** it (a soft ring around it, the other card deselects) and the toy plays its own sound once, with its sound picture shown under it for a moment, so she can compare what she heard with each toy. Selecting and changing a selection are free.
- **Check:** pressing it judges the selected card (above). **Found:** the parcel's paper unfolds, the toy hops out, plays, and settles on the empty shelf spot; a short pentatonic rise; then `ctx.finish`. **Miss:** the gentle boing, the selected card half-turns and settles back, the clue that rules it out pulses in the strip, the reason is spoken. **Not yet:** a soft two-note "hmm", the pet says "That one might be it, but so might the other. How else could we find out?" (level 2) or "Let's look first" (level 1, nothing revealed), and the button not yet used bobs once.
- **Sound and music:** the investigations and toys make the sounds that matter, so the game sets `music: silenced(STYLES.quiet)` and joins the registry test's list of games without the island's loop (it keeps a style playing, never `music.stop()`).

## Levels

| Level | Name | Bands (default) | Shelf and channels | What she decides | Finish |
| --- | --- | --- | --- | --- | --- |
| 1 | **Peek inside** | pre-K | bell and rattle; **Look** only | Which toy has the outline the peephole shows | Check the toy that matches |
| 2 | **Look or listen?** | pre-K, school | bell and drum; **Look** and **Listen** | That a look leaves both possible, so listen | Check the toy the sound picks out |

One parcel per round at both levels; two parcels in a round, a third toy on the shelf and several-toys-possible answers are B3's levels 3–5, appended above level 2 so no saved level moves.

### First rounds

- **Level 1 (shelf: rattle, bell; hidden: rattle):** the pet: "A parcel for the museum! Peek inside, then find its toy on the shelf." She presses Check with nothing selected: the instruction repeats. She taps the bell, then Check: "Let's look first", the window bobs (not yet; nothing counted). She taps Look: the shutter opens on a circle with a handle, and the card drops into the strip. She taps Check with the bell still selected: boing, the handle card pulses, "The peephole shows a handle. The bell has no handle." (one miss). She taps the rattle (it shakes), then Check: the paper unfolds and the rattle hops onto the shelf.
- **Level 2 (shelf: bell, drum; hidden: drum):** "What's in this parcel? You can look, or you can listen." She taps Look: a plain circle. She taps the bell, then Check: "That one might be it, but so might the drum. How else could we find out?", and the ear bobs (not yet). She taps Listen: the parcel wobbles, a deep boom, and the thump picture drops in. She taps the bell again (it rings: not the same) and the drum (it booms: the same), then Check: the drum hops out.

## Accounting, help and finishing

- **Never a miss:** Look, Listen and their replays, a tap on a strip card, selecting or changing a toy card, Check with nothing selected, a **not yet** Check, a tap during the reveal, tapping the pet. Observing never costs anything, including an uninformative look at level 2.
- **A miss:** Check with a selected card the revealed clues rule out. Pressing Check again with nothing changed since the last Check (no new selection, no new observation) repeats the reason and counts nothing more.
- **After two misses** in a round, the one possible card glows and `hints++` (once per round). Show a hint in the pause sheet (`Scene.pauseActions`) does the same, still at most once: if the deciding investigation has not been made it first runs it (the shutter opens, or the parcel wobbles and plays) and then glows the possible card. Asked again, it repeats the instruction.
- **Not yet** responses guide without counting: the first speaks the line, the second and later also bob the investigation she has not used. This is free guidance, not a hint ([decision 4](#open-decisions)).
- **Adaptation:** the ordinary rule (`src/progress/difficulty.ts`). A zero-miss round is evidence that she observed before choosing, because Check cannot finish until the revealed clues leave one toy; it is not evidence that she chose the right sense unprompted, and the grown-ups' card says so. Two smooth rounds move her along the ladder, not to a mastery claim.
- **Start again** (pause sheet) rebuilds the same seeded round with the record cleared, keeping misses and hints.
- **Finish:** `ctx.finish({ misses, hints })` when the parcel opens, with or without help: one ordinary sticker from the shell. Nothing is kept, filed in the journal or saved by the game ([decision 6](#open-decisions)).

## Rule tests (`logic.test.ts`)

- **Table:** every toy has one view and one sound; the three sounds are distinct; bell and drum share `round`, the rattle alone is `handled`; every non-matching (toy, observation) pair has a reason line naming the observation and the toy.
- **Possible set:** `possible` with an empty record is the whole shelf; it never grows as observations are added (monotone); it always contains the hidden toy when the record comes from `observe(hidden, …)`.
- **Rounds, over 500 seeds per level:** the shelf is the level's pair; the channels are the level's; the hidden toy is on the shelf; every toy is the hidden toy at least once and the bag gives each in turn; the same seed gives the same round.
- **Level 1:** a look alone leaves exactly the hidden toy.
- **Level 2:** a look alone leaves both toys (the look is genuinely uninformative); a listen alone, or a look then a listen, leaves exactly the hidden toy; at least one channel on offer always reduces the set to one.
- **Guesses are not knowledge:** for each level, two rounds whose hidden toys differ but whose records match give the same Check result for the same card; with an empty record (level 1) or only a look (level 2), Check on the hidden toy returns **not yet**, never found.
- **Hints:** the glowed card is the only member of the possible set after the hint's investigation; the hint's investigation is one that reduces the set to one.
- **Accounting:** a scripted level 2 round (look, Check bell → not yet; listen, Check bell → miss; Check bell again with nothing changed → no new miss; select drum, select bell, Check → second miss and the glow; Check drum) yields misses 2, hints 1, found; a second Show a hint leaves hints at 1.
- **Layout:** `exhibitLayout` at the four views for two and three cards and one and two channels: every target at least 100 units each way, nothing overlapping, the pet's corner and the home button clear, everything inside `view`.
- **Registry, lands and how-to tests** pass with the new game, including the silenced-music list and its home land still fitting on one screen at every band.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` reveals before it checks and never taps straight to the answer. Level 1: tap Look, tap the possible card, tap Check. Level 2: tap Look (both stay possible), tap Listen, tap each toy card once to compare, tap the possible card, tap Check. The same bot drives the scripted play.
- **How-to card** (`src/content/howto.ts`). Goal: "Find out what is in the parcel, then put its toy on the shelf."
  - Steps: "Tap the window to peek at the toy's shape" (all levels); "Tap the ear to hear the toy inside" `{ from: 2, to: 2 }`; "Tap a toy on the shelf to choose it; it plays its own sound" (all levels); "Press the green tick when the clues show which toy it is" (all levels).
  - Finish: "The parcel opens and the toy jumps onto the shelf."
  - Notes: "Peeking, listening and changing her mind are never counted" (all levels); "If the clues still fit two toys, the tick asks for another clue instead of counting a miss; a lucky guess does not finish the round" `{ from: 2, to: 2 }`; "Choosing a toy the clues rule out counts as a miss, with the reason spoken; after two the right toy glows, which counts as a hint" (all levels); "Every sound has a matching picture, so she can play without hearing it" (all levels).
- **Voice lines** under `sense.*`: `intro`, `instruct-look` (1), `instruct-choose` (2), `pick-first`, `look-first`, `not-yet` (with `{name}`, the other possible toy), `reason.view` (with `{name}`, `{seen}`), `reason.sound` (with `{name}`, `{heard}`, `{its}`), `hint-glow`, `found` (with `{name}`), `done`; observation words (`seen.round`, `seen.handled`, `heard.ring`, `heard.shake`, `heard.beat`) and toy names (`toy.bell`, `toy.rattle`, `toy.drum`) as short lines. `{pet}` optional. Nothing is written as text to read.
- **Registration:** ID `sense-detective`, name "Sense Detective", spoken title `game.sense-detective` ("Sense detective"). Region (subject) `tinker-lab`. Skills `['observation', 'evidence', 'senses', 'comparing']` (free strings). Bands: pre-K 1–2, school 2 (one level until B4 extends it; single-level ranges exist elsewhere) ([decision 2](#open-decisions)). Home land **Tinker Lab** by default, its 13th game (Puzzle Peaks already lays out 13; `lands.test.ts` decides) ([decision 3](#open-decisions)). Hub icon: a wrapped parcel with a peephole and a little ear beside it. Sticker: a seeded toy (bell, rattle or drum) on a museum label.
- **Art:** code-drawn in `src/games/sense-detective/art.ts` with `src/art/palette.ts`: the parcel (paper, string, a round peephole), the bell, rattle and drum, their from-above badges, the three sound pictures, the counter and shelf. Swing Pals' private `bellArt()` may be a starting reference but is not moved. No imported art or audio.
- **Co-play:** a grown-up asks "what could it be so far?" before she presses the tick, or takes the Look button while she takes Listen. **Off-screen** (spoken tip only, no card): "Put a toy in a bag and let her guess it by shaking, then by peeking." No food, smell or blindfold prompts.
- **Couch:** none.
- **Rework couplings:** none required and nothing saved. A toy museum shelf is a natural future source of [RW10](../rework/WORK-ITEMS.md#rw10-collection-book-and-chosen-unlock-goals) pages; that is the rework's to define.

## Check tier

B2 (levels 1–2) is the new-game tier: typecheck and unit tests (the rule properties above plus registry, lands and how-to tests); one scripted play through a new `browser-check.mjs` case (its README row is part of the build), at level 1 (one not-yet, one wrong Check, then found) and level 2 (a look, a not-yet, a listen, one requested hint); one portrait screenshot at level 2 with both evidence cards in the strip; `fingerdemo` at levels 1 and 2; `npm run build`, because the registry, lands, voice, sfx and how-to files change.

Device and person checks stay open: whether a four-year-old reads the from-above badge as the same shape the peephole shows; whether "not yet" reads as "find out more" rather than "wrong"; whether the sound pictures are understood without the sound; device speech of the reason lines. Browser automation cannot establish any of these.

## Open decisions

**Decided 2026-10-23 (on the developer's delegation):** Keep all six built defaults; a preschool level 1 waits on a device check with a three-year-old.

Each has a default the build uses; none blocks B2.

1. **Identity.** Default: a new game, because choosing the sense and knowing when the evidence is enough is an action no shipped game has. Alternative: a Photo Safari mode, if play shows the choice of channel does not matter to her.
2. **Bands.** Default pre-K 1–2, school 2 (B4 extends school through 5). Alternatives: school 1–2; a preschool level 1 as the study's observation trial once a person has tried it with a three-year-old.
3. **Home land.** Default Tinker Lab (13th game). Alternative: Music Mountain (6 games), which suits instruments; the region stays `tinker-lab` either way.
4. **Not-yet guidance.** Default: a not-yet Check and the bobbing button it brings are free. Alternative: the second not-yet counts as a hint, so a round where the game had to point at Listen is not a smooth round.
5. **Level 1's toys.** Default bell and rattle, as the study's ladder. Alternative: a seeded pair from all three toys whenever the look decides it (rattle with either round toy).
6. **Journal.** Default: nothing filed. Alternative: a discovery "a look can't tell a bell from a drum, but listening can" after the first level-2 round that showed it.

## Levels 3–5 definition (2026-11-05)

Defined 2026-11-05 as slice **B3** of the [body-health study](../deep-dives/subjects/body-health.md#build-slices-in-order), from its [proposed ladder](../deep-dives/subjects/body-health.md#first-games-proposed-ladder-sense-detective) rows 3–5 and its "rules to freeze". Docs only: nothing below is registered or built. Levels 1–2 above keep their rules, verdicts, tests and how-to lines unchanged; everything here is appended (IDs 3, 4, 5), so no saved level or pin moves.

**What is new:** at levels 3–5 the answer is no longer "the toy" but **what the clues allow**. At 3 she selects **every** toy a look leaves possible; at 4 she then listens and **narrows** that set; at 5 the parcel cannot be heard, and she says whether a look **can tell** which toy it is and, if not, **which sense would**. The learning goal is the study's S row: ambiguity is a valid answer, and a new clue can narrow a set. Same three toys, same table, same art; the only new pictures are the quilt, the *Can't tell yet* card and two evidence-choice cards.

### Levels

| Level | Name | Bands (default) | Parcels, shelf and channels | What she decides | Finish of one parcel |
| --- | --- | --- | --- | --- | --- |
| 3 | **Which could it be?** | pre-K, school | Two parcels; shelf bell, rattle, drum; **Look** only | Select every toy the look allows (two after a plain circle, one after a handle) | Check the exact set |
| 4 | **Narrow it down** | school | One parcel (bell or drum); shelf bell, rattle, drum; **Look**, then **Listen** | Select the look's set; then listen and keep only the toy that still fits | Check the exact set twice: after the look, then after the listen |
| 5 | **Can we tell?** | school | Two parcels; shelf bell, rattle, drum; the parcels are wrapped in a thick quilt, so **Look** only; a *Can't tell yet* card | Whether the look decides it; if not, which sense would tell the two apart | Check the one fitting toy, or *Can't tell yet* and then the Listen card |

Bands become pre-K 1–3 and school 2–5 (ranges are contiguous appends, so no `order`; [decision 7](#levels-35-open-decisions)). `describeLevel` returns the names above.

### The model, added to `logic.ts`

- **Parcels.** `makeRound(level, rng, first)` gains `parcels: ToyId[]` (levels 1, 2 and 4 hold one). Levels 3 and 5 take the first two of `rng.shuffle(TOY_IDS)`: two different toys, so every round holds **at least one round toy** (only one of the three is handled), so at least one parcel is genuinely ambiguous, and about two rounds in three also hold the rattle, which a look decides, so "always pick two" never works. Level 4 takes `rng.pick(['bell', 'drum'])`, so its look always leaves two. The shelf is `rng.shuffle(TOY_IDS)`. Each level's **first round of a session** is authored: level 3 parcels drum then rattle; level 4 bell; level 5 drum then rattle. The **record is cleared between parcels**; the shelf stays.
- **A set verdict.** A new `checkSet(shelf, record, selected: ToyId[], stage)` sits beside the built single-card `check`, which stays as it is for levels 1–2. With `left = possible(shelf, record)`:
  - nothing selected: **empty** (the instruction repeats);
  - nothing revealed: **look first** (free, as level 1);
  - a selected toy outside `left`: **miss**, `ruledOut` is the first such toy in shelf order with the observation that rules it out; every ruled-out selected card half-turns and deselects;
  - every selected toy is in `left`, but one of `left` is not selected: **one more** (free), `missing` is the first such toy in shelf order;
  - selected equals `left`: **right**. At level 3 that finishes the parcel. At level 4's first stage (Listen not yet run) it is **so far**: the parcel stays, the Listen ear slides in and the instruction becomes "now listen, and keep only the toys that still fit". After the listen, **right** finishes the parcel.
- **The tell verdict (level 5).** Stage A has single selection among the three toy cards and the *Can't tell yet* card (tapping one selects it and deselects the rest). `checkTell(shelf, record, answer)`:
  - a toy outside `left`: **miss** with its reason (as level 1);
  - a toy in `left` while another fits too: **both fit**. This is free, as Trackway Tales' `both-fit`: the other toy's from-above badge pulses and the pet says "The bell fits, but so does the drum. Can we tell which one?";
  - the only toy in `left`: **right**, and the parcel opens;
  - *Can't tell yet* when `left` has two or more: **right**, to stage B;
  - *Can't tell yet* when `left` has one: **miss** (as Trackway Tales' `cant-tell-wrong`), with the reason "The peephole shows a handle. Only the rattle has a handle, so we can tell."
- **Stage B (level 5).** The toy cards slide back and two choice cards take the first two shelf slots: an **eye window** and an **ear**, tapped to select (free) and judged by Check. `distinguishing(shelf, record)` is the channel that would leave one toy whichever toy of `left` is inside. With this table that is always `sound`. The ear is **right**: the quilt slides off, the parcel wobbles and plays its sound, the sound card drops into the strip, the remaining toy's card glows and the parcel opens on its own; that last part is a reveal, not another task. The eye is a **miss**: "A look shows a plain circle for the bell and the drum. It can't tell them apart." The quilt is a property of this exhibit: the pet says "This parcel is wrapped in a thick quilt, so shaking it makes no sound." Nothing suggests a listener who cannot hear.
- **Unchanged resubmits.** `countsAsMiss` keys on the parcel index, the stage, the sorted selection and the record length, so pressing Check again with nothing changed repeats the reason and counts nothing more.
- **Reasons and names.** The built reason lines cover every ruled-out pair; the new lines below add the set and tell responses. Two names in one line come from the possible set in shelf order.

### Screen and controls

- **Selection at 3–4 toggles:** touch-down lifts a card; a tap adds it to the selection (the soft ring, and the toy plays its sound once with its sound picture); tapping a selected card again puts it back (ring off, no sound). Selecting is never counted. Levels 1–2 keep single selection, and so does level 5's stage A.
- **The quilt (level 5):** a patchwork cover over the parcel with the peephole flap left open; there is no ear button. In stage B the Listen ear is a choice card, not an investigation, until the reveal.
- **Layout:** `exhibitLayout(view, cards, channels, cantTell = false)` gains `cantTell: Rect | null`, a 170×170 card. In landscape it sits directly above Check, in the column right of the shelf; in portrait it sits left of Check on Check's row. The built four-view layout test extends to `cantTell` true and false with three cards. It asserts every target is at least 100 units, nothing overlaps, the pet's corner and home button stay clear and everything fits inside `view`; nothing is hand-placed outside `exhibitLayout`. Stage B reuses the first two shelf rectangles.
- **The *Can't tell yet* card:** a museum label showing the two round badges side by side under a soft question mark. A tap selects it and the pet says "Can't tell yet", so it is spoken, never read.
- **Between parcels (3 and 5):** the found toy hops onto the empty shelf spot beside its card, a short rise plays, the strip clears and a new parcel slides in ("Here comes another parcel!"). The round finishes after the last parcel.

### First rounds

- **Level 3 (shelf: rattle, bell, drum; parcels drum, rattle):** "Two parcels today. Look, then tap every toy it could be." She taps Look: a plain circle. She taps the bell, then Check: "Another toy could fit too. Look at the clue again." The circle card and the round badges pulse (one more; free). She taps the rattle too, then Check: boing, the rattle half-turns and deselects, "The peephole shows a plain circle. The rattle has a handle." (one miss). She taps the drum, then Check: "It could be the bell or the drum!" The paper unfolds: "It was the drum!" Second parcel: she taps Look (a handle), taps the rattle, then Check: the rattle hops out. The round finishes with misses 1, hints 0.
- **Level 4 (shelf: bell, rattle, drum; parcel bell):** "Look, then tap every toy it could be." She looks (a circle), selects the bell and the drum, then Check: "Yes, it could be the bell or the drum. Now listen, and keep only the toys that still fit." The ear slides in and bobs. She taps Listen: a ring. She presses Check with both still selected: boing, the drum deselects, "We heard a ring. The drum goes boom." (one miss). Check with the bell alone: the bell hops out.
- **Level 5 (shelf: drum, bell, rattle; parcels drum, rattle):** "This parcel is wrapped in a thick quilt, so shaking it makes no sound. Look, then: can we tell which toy it is?" She looks (a circle), taps the bell, then Check: "The bell fits, but so does the drum. Can we tell which one?" The drum's badge pulses (free). She taps *Can't tell yet*, then Check: "That's right, we can't tell yet. What would tell the bell and the drum apart?" The eye and ear cards appear. She taps the eye, then Check: boing, "A look shows a plain circle for the bell and the drum. It can't tell them apart." (one miss). She taps the ear, then Check: "Yes! Listening would tell them apart." The quilt slides off, a boom plays, and the drum hops out. Second parcel: she looks (a handle), taps *Can't tell yet*, then Check: boing, "The peephole shows a handle. Only the rattle has a handle, so we can tell." (second miss in the round, but the first on this parcel, so no glow). She taps the rattle, then Check: found.

### Accounting, help and finishing

- **Never a miss** (as levels 1–2): looking, listening, replays, a tap on a strip card, selecting or deselecting, Check with nothing selected or nothing revealed, **one more** (an undersized but consistent set), **so far**, **both fit**, an unchanged resubmit, a tap during a reveal.
- **A miss:** a Check that includes a toy the clues rule out (3–5), *Can't tell yet* when a look decides it (5), or the eye card in stage B (5).
- **Help counts per parcel:** after two misses **on one parcel** the useful edit glows and `hints++` once for that parcel; Show a hint (pause sheet) does the same, still once per parcel. A two-parcel round can therefore count two hints, which the ordinary rule reads as a struggling round. This matches the built game, where a round is one parcel, and the study's "per task".
- **The useful edit** ("hints strictly improve a wrong set"): if a ruled-out toy is selected, it glows with a small shake (take it out); otherwise, if a fitting toy is missing, it glows (put it in); otherwise Check glows. At level 5 stage A the glow is on the fitting toy or *Can't tell yet*, and in stage B on the ear. Show a hint first runs the investigation the current stage needs: the look if none has been made, or level 4's listen after **so far**. Then it glows the edit. Asked again on the same parcel, it repeats the instruction.
- **The second one more** on a parcel also pulses the strip card and the shelf badges that match it. This is free guidance, as the built not-yet bob, and never names the missing toy.
- **Adaptation:** the ordinary rule. A zero-miss level-3 or level-4 round shows she selected exactly what the look allowed, without being told which toy was missing; a zero-miss level-5 round shows she told a decidable parcel from an undecidable one, and named the deciding sense, without a prompt. None of it is a mastery claim, and the grown-ups' card does not make one.
- **Start again** rebuilds the same seeded round from its first parcel, with the record cleared and misses and hints kept. **Finish:** `ctx.finish({ misses, hints })` after the last parcel opens: one ordinary sticker, nothing saved or filed.

### Rule tests (`logic.test.ts`, added)

- **Rounds, over 500 seeds per level:** levels 3 and 5 have two different parcels, both on the shelf, and **at least one is round**; over the seeds, both one-toy (rattle) and two-toy rounds occur, and each toy is a parcel at least once. Level 4's parcel is always bell or drum, and a look leaves exactly two. The shelf is all three toys, the first rounds are as authored, and the same seed gives the same round.
- **Set verdict:** for every shelf, every record from `observe(parcel, …)` and every subset of the shelf, `checkSet` is **right** exactly when the subset equals `possible`; **miss** exactly when it contains a ruled-out toy; **one more** exactly when it is a proper non-empty subset of `possible`. A miss's `ruledOut` really is ruled out by its named observation.
- **Narrowing (level 4):** after the look, the right set has two toys and **so far** never finishes; adding the listen narrows it to exactly the parcel; the look's set checked after the listen is a miss.
- **Tell verdict (level 5):** a round parcel gives *Can't tell yet* → right, either round toy → both fit (never found, never a miss), the rattle → miss; a rattle parcel gives the rattle → right, *Can't tell yet* → miss. `distinguishing` returns `sound` for every two-toy possible set, and observing the parcel's sound then leaves exactly the parcel.
- **Guesses are not knowledge:** two parcels with different toys but the same record (bell and drum after a look) give the same verdict for every selection and answer.
- **Hints strictly improve:** for every wrong selection, applying the glowed edit reduces the difference from `possible` by one; repeated, the glow always reaches **right**.
- **Accounting scripts:** the three first rounds above give misses 1 and hints 0 (level 3), misses 1 and hints 0 (level 4), and misses 2 and hints 0 (level 5: one miss on each parcel, so no glow). A level-3 parcel with two misses glows once and counts one hint, and Show a hint after that leaves it at one. An unchanged resubmit after a miss adds nothing.
- **Layout:** the four views with three cards, one and two channels, and `cantTell` true and false.
- **Levels 1–2 untouched:** the built tests pass unchanged.

### Ghost finger, how-to card and voice

- **Bot (`senseTouch` extended by level):** it always investigates before a Check and never taps straight to the answer. Level 3: look; select each possible toy in shelf order; Check. Level 4: look; select both possible toys; Check (so far); listen; deselect the toy the sound rules out; Check. Level 5: look; if one toy fits, select it and Check; otherwise select *Can't tell yet*, Check, select the ear, Check. The same bot drives the scripted play and `fingerdemo`.
- **How-to card:** the built lines keep their `{ from: 1, to: 2 }` and `{ from: 2, to: 2 }` scopes. Added steps:
  - "Tap the window to peek at the toy's shape." `{ from: 3, to: 5 }`, the built first step widened rather than duplicated.
  - "Tap every toy it could be; tap one again to put it back." `{ from: 3, to: 4 }`
  - "When the tick says yes, tap the ear and keep only the toys that still fit." `{ from: 4, to: 4 }`
  - "The parcel is wrapped in a quilt, so choose the one toy it must be, or the 'can't tell yet' card when two could fit." `{ from: 5, to: 5 }`
  - "If she chose 'can't tell yet', choose the eye or the ear: which would tell them apart?" `{ from: 5, to: 5 }`
  - "Press the green tick to check." `{ from: 3, to: 5 }`

  Notes added:
  - "Peeking, listening and changing her mind are never counted." `{ from: 3, to: 5 }`, widened.
  - "Leaving out a toy that fits is not a miss: the tick asks for one more. Keeping in a toy the clues rule out is a miss, with the reason spoken." `{ from: 3, to: 4 }`
  - "Choosing one toy when two still fit is not a miss: the pet shows the other. Choosing 'can't tell yet' when the look decides it, or the eye when only listening would help, is a miss." `{ from: 5, to: 5 }`
  - "After two misses on one parcel, the card to change glows, which counts as a hint." `{ from: 3, to: 5 }`

  The finish becomes "Each parcel opens and its toy jumps onto the shelf." These are level-scoped lines with no relative wording.
- **Voice lines (`sense.*`, added):** `instruct-all` ("Look, then tap every toy it could be."), `two-parcels`, `one-more`, `could-be` (`{a}`, `{b}`), `it-was` (`{name}`), `so-far` (`{a}`, `{b}`), `instruct-narrow`, `quilt`, `instruct-tell`, `both-fit` (`{name}`, `{other}`), `can-tell` (`{name}`, `{seen}`), `cant-tell-right` (`{a}`, `{b}`), `what-would` (`{a}`, `{b}`), `look-cant` (`{a}`, `{b}`), `listen-would`, `card.cant-tell`, `card.look`, `card.listen`, `next-parcel`. Nothing is written as text to read.
- **Co-play:** a grown-up asks "which toys could it still be?" before the tick, or holds up fingers for how many toys still fit. **Off-screen:** the built tip stays.
- **Sources (study decision 2):** the only sense language is "look", "listen", "peek" and "hear". The building session checks it against reputable sources, lists them in the study and records the check in its VERIFICATION entry. No body content is added.

### Build slices

B4 splits into two new-interaction builds, so that each fits one session:

- **B4a: levels 3–4, built 2026-11-05** (`checkSet`, toggling selection, parcels, level 4's so-far step, the bands pre-K 1–3 and school 2–4). Tier: typecheck and unit tests (the properties above, plus the registry, lands, how-to and voice tests); one scripted play of level 3 (one more, one miss, to the sticker over both parcels) and of level 4 (so far, a listen, one miss, a requested hint, to the sticker); one portrait screenshot at level 3 with two cards selected; `fingerdemo` at 3 and 4; `npm run build` (voice and how-to change).
- **B4b: level 5** (after B4a: the quilt, `checkTell`, *Can't tell yet*, stage B, school 2–5). Tier: typecheck and unit tests including the layout with `cantTell`; one scripted play of level 5 (both fit, *Can't tell yet*, the eye miss, the ear, then the rattle parcel to the sticker); one portrait and one landscape screenshot with the *Can't tell yet* card; `fingerdemo` at 5; `npm run build`.

Device and person checks stay open: whether a five-year-old reads "every toy it could be" as several taps; whether *Can't tell yet* reads as a good answer rather than giving up; whether the quilt reads as "can't hear it" without speech.

### Levels 3–5 open decisions

Each has a default that B4 uses; none blocks the build.

1. **An undersized set.** Default: free (**one more**), as the built not-yet, Attic Finds level 5 and the 2026-10-23 decision 4 ("only an explicit wrong Check counts"). This **departs from the study's frozen line** "Check of an incorrect final set is one miss", which would count it. Alternative: the study's rule.
2. **A ruled-out toy left selected after level 4's listen.** Default: a miss, since the instruction is to keep only the toys that still fit. Alternative: cards the new clue rules out turn grey on their own, and level 4 asks only for the look's set.
3. **Overclaiming at level 5** (one toy when two fit). Default: free **both fit**, as Trackway Tales. Alternative: a miss, since the level's question is whether we can tell.
4. **Help per parcel**, so a two-parcel round can count two hints. Alternative: once per round.
5. **Two parcels at levels 3 and 5.** Alternative: one parcel, alternating seeded kinds across rounds.
6. **Level 5's stage B.** Default: a choice between the eye and the ear, followed by the reveal. Alternative: stage B goes, and *Can't tell yet* finishes the parcel with the reveal.
7. **Bands.** Default pre-K 1–3 and school 2–5. Alternative: pre-K stays 1–2, and level 3 is school-only.
