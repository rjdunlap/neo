# Sense Detective, levels 1–2 (definition)

Defined 2026-10-22 as slice **B1** of the [body-health study](../deep-dives/subjects/body-health.md#build-slices-in-order), from its [proposed ladder](../deep-dives/subjects/body-health.md#first-games-proposed-ladder-sense-detective), its [overlap table](../deep-dives/subjects/body-health.md#on-the-island-today-and-overlap), its [presentation notes](../deep-dives/subjects/body-health.md#experience-and-presentation) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#body-and-health-recommendations). Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: built 2026-10-23 (B2, PR #861; levels 1–2 on the defaults below).** The study's B1 gate asks this packet to settle identity beside Photo Safari, accounting for free reveals, the K/S window and the land; each has a default here ([open decisions](#open-decisions)) that the build uses and the developer can still change. Nothing here is clinical or practical health content: the three toys are invented island instruments, the clues are an authored toy table rather than a rule about real objects, and no reviewer is needed before this slice. The study's reviewer gates (body models, practical care, real-object cards) stay on its later slices. Levels 3–5 (several toys still possible, "can we tell?") are the separate definition B3, because multi-select is a new interaction.

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

Each has a default the build uses; none blocks B2.

1. **Identity.** Default: a new game, because choosing the sense and knowing when the evidence is enough is an action no shipped game has. Alternative: a Photo Safari mode, if play shows the choice of channel does not matter to her.
2. **Bands.** Default pre-K 1–2, school 2 (B4 extends school through 5). Alternatives: school 1–2; a preschool level 1 as the study's observation trial once a person has tried it with a three-year-old.
3. **Home land.** Default Tinker Lab (13th game). Alternative: Music Mountain (6 games), which suits instruments; the region stays `tinker-lab` either way.
4. **Not-yet guidance.** Default: a not-yet Check and the bobbing button it brings are free. Alternative: the second not-yet counts as a hint, so a round where the game had to point at Listen is not a smooth round.
5. **Level 1's toys.** Default bell and rattle, as the study's ladder. Alternative: a seeded pair from all three toys whenever the look decides it (rattle with either round toy).
6. **Journal.** Default: nothing filed. Alternative: a discovery "a look can't tell a bell from a drum, but listening can" after the first level-2 round that showed it.
