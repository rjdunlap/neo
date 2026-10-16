# Photo Safari deep dive

*ID `photo-safari` · bands lap–school · levels 1–6 on 2026-10-15 · source audit `4052641` · session `claude/photo-safari-deep-dive` ([PR #420](https://github.com/rjdunlap/neo/pull/420))*

The roadmap's short-ladders row asked for Photo Safari's **two-clue observations**, defined through a one-game dive: what counts as evidence, which scenes are fair, and what the journal records. The [family experience shortlist](../FAMILY-EXPERIENCE.md#research-sessions-worth-doing) (row 7) asks the wider question: *can noticing evidence and comparing scenes become more satisfying than fulfilling a picture request?*

## The game today

She taps an animal in a meadow and the camera flashes. A polaroid of that animal flies up into an album strip, and at the end the album opens big for everyone to look at. Each request is spoken (`safari.ask`); a wrong photo is a boing plus "That is {desc}!", naming what she actually caught. After two wrong photos the asked-for animal glows. The learning purpose is listening vocabulary: animal names, action verbs, place words (prepositions) and "not".

| Level | Plan (`PLANS`, `logic.ts`) | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | `snap`: any animal, 6 photos | lap, toddler | Nothing; every tap is a photo |
| 2 | `who`: "the pig" | lap, toddler, preschool | Which animal is named |
| 3 | `doing`: "the bunny jumping" | preschool, pre-K | The action (the name is often shared by distractors) |
| 4 | `where`: "the duck under the tree" | preschool, pre-K, school | The place (every animal is the same kind) |
| 5 | `both`: "the cat sleeping behind the bush" | pre-K, school | Supposedly the action and the place; see known gaps |
| 6 | `not`: "the animal that is not sleeping" | school | The odd one out by action |

Ranges are `lap 1–2, toddler 1–2, preschool 2–4, prek 3–5, school 4–6`. Levels 2–6 take four photos each.

**Content pools:** 6 animals (`ANIMALS`: cat, dog, bunny, pig, duck, bear, drawn with `Critter`), 4 actions (jumping, sleeping, eating, dancing, each animated in `Actor.update`; eating adds an apple prop, sleeping adds drifting z's), 4 spots (tree, bush, rock, pond, at fixed x fractions 0.24/0.45/0.66/0.86 of `view.w`). Each scene has 3 animals in 3 different spots, with exactly one matching the request (`makeScene` retries up to 200 times; rule-tested). One meadow backdrop (seed 64). The journal has four action-word entries (`journal.safari.<action>`, `src/content/journal.ts`), filed for each action in a *successful* photo.

**Ghost finger:** `autotouch()` taps the target, or each animal in turn on level 1 (`animalToTap`, tested). The `batch` suite (`BATCH_ONLY=safari`) plays levels 1–6 with two misses and one hint.

**Known gaps (source audit):**

- **Level 5 does not need both clues.** Every animal stands in its own spot, so the place word alone picks the target. The action word is decoration (already noted in [IDEAS](../IDEAS.md#round-two-the-longer-ladders-2026-10-10)). Level 4's name is likewise redundant (all three are the same animal), and level 3's distractor actions all differ from the target's, so the action alone suffices. Levels 3 and 4 still teach their one new word truthfully; level 5 does not teach "both".
- **Polaroid textures were never freed (fixed in slice 1).** `polaroid()` calls `renderer.generateTexture` for every photo and `destroy()` is empty, so each round leaves four to six textures behind. AGENTS requires games to release their render textures.
- **One spot per animal caps the evidence design.** Any two-clue level needs two animals able to share a spot, which means a layout with an offset per animal and nearest-target tap resolution (the hit circles are 95 units in radius).
- Device speech for "behind the bush" and "not sleeping" is unchecked (already listed in [DEVICE-CHECKS](../DEVICE-CHECKS.md)).
- No couch entry and no picnic step.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [New Pokémon Snap](https://daily.pokecommunity.com/2021/05/11/new-pokemon-snap-review) (2021) | On-rails photo game | Research levels unlock routes and behaviours; requests ask for a specific behaviour | Requests about *what an animal is doing*, not just which one; revisiting the same place to see something new | Star scores, judging by size and centring, and requests that reviewers found [unclear](https://www.rpgfan.com/review/new-pokemon-snap/) |
| [Alba: A Wildlife Adventure](https://www.thesixthaxis.com/2020/12/11/alba-a-wildlife-adventure-review/) | Gentle open-world photo journal | More species and biomes; a photo is what identifies a species in the guide ([guide](https://www.keengamer.com/articles/guides/alba-a-wildlife-adventure-beginners-guide/)) | The photo *is* the record: a journal entry exists because she captured it | Rare-species hunting, and fast movers that frustrate |
| [Umurangi Generation](https://www.playstation.com/en-au/games/umurangi-generation) | Photo bounties | Each place brings its own bounty list with specific conditions | A short checklist of things to photograph, met in any order | Grading on composition; cash |
| *I Spy* and *Where's Wally?* books | Picture search | Busier pages and more specific riddles | Riddles that combine features ("I spy a duck by the pond") | Clutter as the only route to difficulty |
| [Guess Who?](https://en.wikipedia.org/wiki/Guess_Who%3F) | Attribute deduction | Narrowing a set by yes/no features ([Games for Young Minds](https://www.gamesforyoungminds.com/blog/2018/8/15/guess-who)); a preschool variant describes a peer with two or three features ([Teacher Toolbox](https://www.do2learn.com/disabilities/FASDtoolbox/education_resources/games/guess_who.htm)) | Two features that each leave more than one candidate, so both are needed | Hidden information and turn-taking memory load |
| [Sago Mini Magic Camera](https://madisonpubliclibrary.org/node/1852) | Toddler AR hunt | Find hidden things around the room | Lap-age delight that a tap reveals something | AR and a subscription |
| Spot-the-difference puzzles | Comparison | More differences, smaller ones | Comparing two pictures of the *same* scene, with both visible | Tiny differences (motor and visual precision rather than reasoning) |

**Developmental note.** Prepositions (in, on, under, behind) and action verbs are ordinary preschool receptive-language targets, and "not" is a later concept. The open evidence question here is a reasoning one: a clue that leaves more than one candidate is not enough, and two together are. Guess Who's attribute narrowing is the clearest familiar model. The searches turned up no developmental source that ties ages to two-attribute conjunctions, so the band windows below come from Puddle Island's existing ladder (level 5 already sits at pre-K and school). [The life-science study](subjects/life-science.md) holds the science anchors for the later Field Notes horizon.

## What makes sense here

Photo Safari's strength is that **a photo is a record**: the album shows what she noticed. Evidence play grows naturally out of it. The best next steps make her *compare*: a clue against the scene (two clues that are each not enough on their own), or a photo against the scene now (what changed). Neither adds speed, clutter or memory load, because the photo stays on screen.

Long-term arc: name → action / place → **two clues, neither enough alone** → **compare a photo with the scene** → (school/parent horizon) Field Notes Detective, photographing evidence that tells pictured explanations apart. That horizon is owned by the [life-science study's slice 3](subjects/life-science.md) and needs real-biology content review; this dive does not define it.

Left as inspiration only: scores, ratings, rarity, timers, a moving rail.

## Experience and presentation

- **First unsupported action:** at level 1 any tap is a photo. Touch-down gives a flash and a click, and the polaroid flight is the consequence. The return to readiness is the next scene popping in. That stays.
- **What can vary on replay without changing a rule:** a second backdrop (a beach, with the same four spot kinds drawn as a palm, a dune, a rock and a tide pool) chosen by the round's seed, plus new actions (below). Cosmetic only.
- **Reasoning versus reading, memory and motor:** every request is spoken and replayable through the guide, and nothing is read. At "What changed?" the earlier photo stays pinned on screen, so it is a comparison, not a memory test. Targets stay at least 100 units across, and two animals sharing a spot must be at least 150 units apart, centre to centre.
- **Concrete art/feel example:** for *What changed?*, the pinned polaroid sits top-centre in its white frame (`roundRect` 160×190, as `polaroid()` draws it now). When she picks correctly, a dotted `Graphics` line draws from the photo to the changed animal and a soft rising two-note chime plays (pentatonic steps from `notes.ts`). On a wrong pick the chosen animal does a small "same as before" nod (`critter.hop(0.3)`) while the voice says what is still the same.
- **Supported ending:** the album opening stays the finish. A round always completes: the glow after two misses still leads to the answer.
- **Co-play:** a grown-up can make the request instead of the pet ("I spy someone jumping by the pond") while she photographs. The suggestion goes in `coplayHint` for level 7; it needs no new system.
- **Needs a person:** whether a three- or four-year-old hears "jumping by the pond" as two separate clues; whether a toddler enjoys action-only requests; whether lap play wants fewer, bigger animals.

## Proposed ladder

### Fresh content inside existing levels

- **New actions: waving and swimming.** Waving is an arm wiggle drawn with `Graphics`; swimming is allowed only in the pond spot (a per-spot action filter in `makeScene`). Each adds a journal entry with a spoken line (the journal test checks the lines against `ACTIONS`). This raises the action pool from 4 to 6.
- **A second backdrop** (above): seeded and cosmetic.
- **Level 5 made truthful:** once spots can be shared (slice 2), level 5's distractors may stand in the target's spot or do the target's action, so that name + place alone and name + action alone each match more than one animal. That is the level's stated rule ("both"), and its ID, range and description are unchanged.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | **Two clues, no name** | school (4–7) | Four animals, two of them at the pond; two are jumping, one of those at the pond. "Take a picture of the animal jumping by the pond." | Combine an action and a place, each true of two animals | A wrong photo names what it caught, the existing `safari.thatis`, so the clue it did fit is heard ("That is the dog jumping on the rock"). Glow after two misses | Exactly one sighting matches both clues; each clue alone matches at least two; no two animals closer than 150 units; nearest-target resolution picks the intended actor at every shared spot | A shared-spot layout (two offsets per spot), nearest-target tap resolution, a `describe` mode with no name ("the animal jumping by the pond"), one voice key, a how-to line, the batch case. The bot is unchanged (it taps `target`) |
| 8 | **What changed?** | pre-K? school (decision 2) | She takes a photo of the whole meadow (one tap on a big camera button, or any animal). The photo pins top-centre; the animals shuffle behind a bush puff, and one now does something different. "Which friend is doing something new?" | Compare the photo with the scene | A wrong pick: "The cat is still sleeping, just like in your photo." Glow after two. Not counted as a miss on the first photo tap | Exactly one sighting differs from the photo, in exactly one attribute (action at first; place in later rounds); the photo's sightings match the scene's identities | A new interaction tier: a whole-scene photo (a larger `generateTexture`, freed after), the pinned photo, the change animation, 3–4 voice keys, a how-to line, an `autotouch` that taps the changed animal, a new batch case |
| 9 | **Is it true?** (sketch) | school | The pet says "The duck is sleeping by the pond." She photographs the duck; the photo shows what it is really doing, and she presses a thumbs-up or a thumbs-down | Check a claim against evidence | A wrong judgement replays the photo with the voice describing it | Each claim names one animal present; half true, half false by one attribute | Two judgement buttons (a new control); **decision 3** |

### Younger-band openings

Lap and toddler already have levels 1–2. Two candidates, both gated:

- **A toddler action-only request** ("Who is sleeping?"), appended as a new ID between 2 and 3 with `order` and `entryLevels`, so the toddler window reaches it. Verbs are a toddler-age word class, but whether device speech and the animations make the action clear enough is a person check. **Decision 1** (toddler window), after a person check.
- **A lap entry with fewer, bigger animals** (one or two, scale 0.7), only if watching her play level 1 shows three is too busy. **Person** check first.

### Easier entries and levels between existing ones

The action-only request above is the only between-level candidate. Use the built `order`/`entryLevels` support; never renumber 1–6.

### Left out on purpose

Photo scoring and stars, rare animals, timers or moving rails, zoom precision, hidden-information deduction (Guess Who's turn structure), and real-species identification (the critters are characters, not species, as the life-science study notes).

## Decisions for the developer

1. **Toddler action-only entry:** extend the toddler window to an appended "Who is sleeping?" entry? Person check first. (Added to [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md).)
2. **What changed?** at pre-K as well as school, or school only?
3. **Is it true?**: are thumbs-up/down judgement buttons wanted in a photo game, and should younger players ever hear a false claim?

## Build slices, in order

1. **Built: free the polaroid textures.** [PR #468](https://github.com/rjdunlap/neo/pull/468), `codex/safari-textures`: generated textures are owned by the round and freed with their GPU sources after album sprites on destroy; queued scene work is guarded. Gameplay unchanged. [Proof](../VERIFICATION.md#2026-10-16--photo-safari-texture-cleanup).
2. **Ready: level 7, Two clues, no name** (school 4–7), with the shared-spot layout and nearest-target taps. Tier: new interaction (typecheck, rule tests above, one filtered play at 4 and 7 with one wrong photo and one hint, `fingerdemo` with `FINGER_ONLY=photo-safari` at 7, one portrait screenshot). Update the how-to card, GAMES, README row, the batch case's top level.
3. **Ready after 2: level 5 made truthful** (distractors share the target's spot or action). Tier: rule tests and one filtered play at 5.
4. **Ready: new actions, waving and swimming**, with journal entries. Tier: rule tests, the journal tests, one screenshot of each animation, one filtered play at 3.
5. **Decision 2 first: level 8, What changed?** Tier: new interaction, as in slice 2, plus `fingerdemo` at 8.
6. **Decision 3 first: level 9, Is it true?** Tier: new interaction.
7. **Decision 1 / person first: the toddler action-only entry**, then the lap entry with fewer animals. Tier: new levels, plus registry `order`/`entryLevels` tests.
8. **Horizon:** Field Notes Detective, defined by [the life-science study's slice 3](subjects/life-science.md), not here.

## What was built in this session

Nothing: this was a research and ideation session. Links and `git diff --check` ran.
