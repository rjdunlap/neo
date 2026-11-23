# Thought Bubbles, level 5 (definition)

**Status: ready to build in one batch, no review gate.** Defined 2026-11-23 as slice LM4 of the [literature and meaning study](../deep-dives/subjects/literature-meaning.md#build-slices-in-order), from its [audience row U](../deep-dives/subjects/literature-meaning.md#an-answer-for-every-audience) and candidates row LM4 (*Who is telling?*: hear a version of the story and find the friend who could have told it, who was there for every part told; RL.3.6, RL.6.6). It extends the built [levels 1–3](thought-bubbles.md) and [level 4](thought-bubbles-4.md) and changes none of them. [OBSERVATIONS](../OBSERVATIONS.md) has no Thought Bubbles notes yet, so nothing below draws on observed play. Docs only: no code, voice line or art exists yet.

**Fun action and purpose.** Two friends put their shared thing away, a kind helper comes in and moves it twice, and the friends come and go, so **every friend misses one part or more**. Then two speech bubbles appear, each holding a **telling**: two or three parts of the story, shown as small pictures and spoken by the pet. Three friend cards wait below, and she drags into each speech bubble the friend who could have told it. The learning purpose is **a teller's point of view: a friend can only tell the parts they were there to see, so what a telling includes and what it skips show who told it** (CCSS RL.3.6 and RL.6.6 as read in the [study's anchors](../deep-dives/subjects/literature-meaning.md#anchors-opened-at-their-source)). Nothing has to be read. The how-to card makes no claim of a reading, theory-of-mind, attention or school benefit.

## Identity and overlap

Rechecked 2026-11-23 against the catalog, open definitions, IDEAS and `git log origin/main`. Level 4 asks what each friend *thinks* from what it saw; level 5 turns that around and asks *who* a telling fits, on the same stage, with the same templates, event model, two bubbles and per-bubble accounting. The action is still dragging a picture card into a bubble, so it stays in Thought Bubbles. Nothing else on the island asks who told a story: **Puppet Stage**'s narrator is the grown-up reading a card aloud, **Notice Board** keeps *who saw it* as a question about a source, and *Two Viewpoints* (social-emotional study, proposed) owns two people's differing accounts of a quarrel. *Two tellings* (LM5) stays a sketch that waits on this level, and the study's M rung (a teller who leaves something out on purpose) is not defined here; the *stayed* pattern below is its seed.

## Bands and ladder

| Level | Name | Bands | What she decides |
| --- | --- | --- | --- |
| 5 | *Who is telling?* | school 5 | Which of three friends could have told each of two tellings, from which parts each friend was there to see |

`LEVELS.school` becomes `{ min: 1, max: 5 }`; `prek` stays `1–2`. No `order`. `describeLevel(5)` is "Who is telling? (about 9 and up): which friend was there for every part told". She reaches it only by two smooth rounds at level 4, and two struggling rounds step her back down as standard.

## The model (`logic.ts`)

Level 4's `TwoTemplate` list, `PLACES`, `compile` and beat lines are reused. Level 4's five patterns are not: in them the mover sees everything and each friend's view contains the other's, so under the rule below almost no telling would have exactly one possible teller. Level 5 has its own four patterns in which the three friends' views cross.

- **The three friends** of a story are `friends[0]`, `friends[1]` and the **helper**, `movers[1]` (always a friend, never the wind). `candidatesOf(template)` returns them in that order, which is also the order of the three cards.
- **The three parts** are the put, move 1 and move 2: the only events a telling can include.
- **`compile` gains an optional third argument**, the friends who start outside (default none, so levels 2 and 4 are unchanged). At level 5 the helper starts outside and comes in through the door straight after the put (a `back` action), so **the helper never sees the put** and is there for both moves. Both owners always see the put.
- **Pattern** (`TellPattern`). X and Y are the two owners; `x: 0 | 1` says which of `friends` is X.

  | Pattern | Actions in order | X saw | Y saw | Helper saw |
  | --- | --- | --- | --- | --- |
  | `crossed` | put, helper in, Y out, move 1, Y back, X out, move 2, X back | put, move 1 | put, move 2 | moves 1 and 2 |
  | `early` | put, helper in, Y out, move 1, X out, move 2, Y back, X back | put, move 1 | put | moves 1 and 2 |
  | `late` | put, helper in, X out, Y out, move 1, X back, move 2, Y back | put, move 2 | put | moves 1 and 2 |
  | `stayed` | put, helper in, Y out, move 1, move 2, Y back | all three | put | moves 1 and 2 |

  A friend who comes back in the middle of a story (`crossed`, `late`) is new to level 5; the existing `back` action and "… comes back." lines cover it.
- **Telling:** `{ told: number[] }`, the event indexes of two or three of the three parts, in story order. `couldTell(events, who, told)` is true when `who` is in `saw` for every told event. `tellersOf(story, told)` filters the three candidates.
- **The dealing rule:** a telling is dealt only when **exactly one** of the three friends could have told it. The table lists every such telling of two or more parts; the tests derive it from the event lists and do not trust the table.

  | Pattern | Tellings with one possible teller |
  | --- | --- |
  | `crossed` | put + move 1 → X; put + move 2 → Y; move 1 + move 2 → helper |
  | `early` | put + move 1 → X; move 1 + move 2 → helper |
  | `late` | put + move 2 → X; move 1 + move 2 → helper |
  | `stayed` | put + move 1 → X; put + move 2 → X; all three → X |

  A telling of one part is never dealt (two friends always fit the put alone). A telling that skips the middle part (put + move 2) is how a friend who was out for move 1 would tell it.
- **Story** (`TellStory`): `{ template, pattern, x, start, middle, actual, events, tellings: [Telling, Telling] }`, compiled by `tellStory(template, pattern, x, places, tellings)`. The two tellings are different. `tellerOf(story, bubble)` reads the one friend from `tellersOf`, never stores it. Bubble 0 is on the left (or on top in landscape), as at level 4.
- **`firstMissed(events, who, told)`** returns the first told event `who` did not see, or −1. This is what a miss replays.
- **`Story`** gains `{ level: 5; tell: TellStory; cards: Friend[] }`, and `answerOf(s, bubble)` returns `tellerOf` for it.

### Rounds

A round is three stories (`STORIES_PER_ROUND` stays 3), each with two speech bubbles, and earns one sticker. `roundFor(5, rng, first)` deals so that:

- the three templates are different;
- at least one story is `crossed` and at most one is `stayed`;
- at least two stories have two different tellers;
- over the round's six bubbles, each card position (left, middle, right) is the answer at least once and at most three times.

The seed picks the templates, the order, the patterns, which owner is X, the three places and the two tellings, redrawing within a fixed bound until the rule holds.

**The first round is authored:**

1. `ball-tidy`, `early`, Bear is X. The ball goes red box → blue basket → shelf. Left bubble: put + move 1 (Bear). Right bubble: move 1 + move 2 (Duck, the helper).
2. `book-dust`, `crossed`, Dog is X. The book goes blue basket → shelf → red box. Left bubble: put + move 2 (Bunny, who was out for move 1). Right bubble: put + move 1 (Dog).
3. `drum-room`, `stayed`, Duck is X (an owner here; Bunny helps). The drum goes shelf → red box → blue basket. Left bubble: all three parts (Duck). Right bubble: put + move 1 (Duck again).

So the helper tells once, a telling skips the middle once, and one friend tells twice, so "never the same friend twice" is not a rule she can lean on.

**Why this rule (the habit property).** Two smooth rounds step her up, and a smooth round allows at most one miss. Every fixed habit that ignores who was in the room must therefore cost at least two misses in every round. Count a habit's misses as the bubbles where it picks the wrong card, and count copying as filling the left bubble right and putting the same card in the right one:

- always the left card, always the middle card, or always the right card (the helper, who did the moving): each position is right at most three times in six, so each costs at least three;
- copy the first bubble into the second: two stories with two different tellers cost at least two.

The authored first round costs 4, 3, 5 and 2.

## Screen and controls

- **Stage, Replay, the two bubble slots and the card row** are level 4's, with `thoughtLayout(view, 5)` returning level 4's layout unchanged. Replay plays the whole story again, free.
- **The story** plays beat by beat as at level 4. The helper waits outside the door and walks in after the put. When the story ends all three friends are in the room: the owners at level 4's two spots and the helper at the mover's spot.
- **Two speech bubbles** take the place of the thought bubbles: the same 220 × 150 size and 30-unit hit margin, drawn with a smooth outline and a pointed tail to a small question-mark badge instead of puffs and a friend's head, so a telling does not look like a thought and shows no owner. Each holds its told parts as two or three **part pictures** (the thing in or on its place, about 60 wide, left to right in story order). The pictures are not targets.
- **The tellings are spoken** by the pet when the story ends, left bubble first: the bubble pulses, and each part picture appears as its line is said. The lines are the story's own `.put`, `.move1` and `.move2` clips, so a telling is the same words with parts missing. Touching a bubble says its telling again, free.
- **Three friend cards** (level 4's 150 × 170 cards, `draggable`) show the head of each candidate: left owner, right owner, helper. Touch-down says the friend's name and that friend hops on the stage. She drags a card into a speech bubble, **in either order**.
- **A right card** floats home and leaves the friend's head on the bubble's badge, so one card can fill both bubbles in a `stayed` story. A filled bubble takes no more drops. A wrong card floats home and that friend shakes its head on the stage.
- **Phone first:** upright from its first commit, as levels 1–4 are. The builder measures the part pictures inside the bubble at the upright phone view and may shrink the pictures, never a card, bubble hit area or Replay below 100.

## Accounting, help and finishing

- **Free, never a miss:** Replay; hearing a telling again; a card's spoken name; a card dropped off both bubbles or onto a filled one.
- **A wrong friend in a bubble** is one miss. The pet asks `thought.tell.was.{friend}` ("Was Bunny there for this part?"), the bubble's first part that friend missed pulses, and the stage replays that beat (`firstMissed`), with the friend out of the door.
- **Hints are per bubble**, through level 4's `Tally.wrong(bubble)` and `showMe(stage, bubble)` unchanged. Two misses on one bubble glow its teller's card and the bubble's edge, counted as one hint. **Show me** glows the first unfilled bubble and its card, one hint, unless that glow is already on.
- **A right friend** hops, and the pet says `thought.tell.there.{friend}` ("Bear was there for every part.").
- **When both bubbles are filled**, the helper hops at the place where the thing is now, and the pet sums up: "A friend can only tell the parts they were there to see." Nobody is left looking for the thing, and nobody is laughed at for missing a part.
- **Assisted ending:** every story ends through her drags, after the glow if needed. One sticker per round of three stories, including with help. After the third story, `ctx.finish({ misses, hints })` is called, once.

## Model and rule tests (`logic.ts`, `logic.test.ts`)

1. **Compile:** every template × pattern × `x` × place order compiles. Both owners see the put and the helper does not; the helper sees both moves; each friend's seen parts match the pattern table. `compile` without the third argument gives levels 2 and 4 the event lists they have today.
2. **Tellings:** for every pattern, the tellings of two or three parts with exactly one possible teller are exactly the pattern table's, with its tellers. Every dealt telling has exactly one teller, and the two tellings of a story differ.
3. **Rounds** (300 seeds): three different templates; at least one `crossed` and at most one `stayed`; at least two stories with two different tellers; each card position the answer one to three times. Every pattern, every template, every listed telling and each position as an answer occur across seeds. The same seed gives the same round, and the redraw bound is never reached. The first round matches the authored list.
4. **The habit property:** over the first round and every dealt round in 300 seeds, always-left, always-middle and always-right each give at least three misses, and copying the first bubble into the second gives at least two.
5. **Casts:** three different friends per story, never bear with dog, and the helper is never the wind.
6. **Accounting:** a wrong card in either bubble is one miss; free actions count nothing; two misses on one bubble give exactly one hint for it; Show me picks the first unfilled bubble; a filled bubble refuses a drop, free. Levels 1–4's tallies are unchanged.
7. **Hints lead somewhere:** `glowFor` at level 5 gives the first unfilled bubble and its teller's card. `firstMissed` is −1 for the teller and a told event for each of the other two friends.
8. **Layout:** the existing layout and `upright.test.ts` walks include level 5; three part pictures fit inside a bubble at every tested view.

## Speech, how-to, ghost and registration

Instructions use `ctx.instruct`; everything else `ctx.say`. Every line is slot-free.

- **Instruction:** `thought.instruct.5`: "Who could have told it? Put a friend in each speech bubble."
- **Reused:** each template's `.put`, `.out.{friend}`, `.stay.{friend}`, `.move1`, `.move2` and `.back.{friend}` lines, for the story and for the tellings. The stay rule of `beatsOf` applies to the two owners as it does now.
- **New, per friend:** `thought.tell.in.{helper}` for the four helpers ("Duck comes in."); `thought.friend.{friend}` (6, the card names: "Bear."); `thought.tell.was.{friend}` (6); `thought.tell.there.{friend}` (6).
- **New, shared:** `thought.tell.intro.0` ("Somebody told it like this."), `thought.tell.intro.1` ("And somebody told it like this."), `thought.tell.done` (the summing-up line above).
- **Words:** *told*, *was there*, *saw*. *Narrator* and *point of view* appear only on the grown-up card. No line says *wrong*, *lied*, *forgot* or *left out*: a teller tells what they saw.
- **How-to card** (`src/games/thought-bubbles/howto.ts`), adding to the existing card:
  - Step `{ from: 5, to: 5 }`: "Two speech bubbles each hold a telling of the story. Drag in the friend who could have told it: who was there for every part?"
  - Note `{ from: 5, to: 5 }`: "About 9 and up. A friend who was out of the door cannot tell that part, and the helper came in after the thing was put away. One friend can fit both bubbles. On the grown-up side, this is a narrator's point of view; it shows how she answers with the pet's spoken story, not that she reads stories this way on her own."
- **Ghost finger:** `autotouch()` at level 5 waits for the story and the two tellings, then drags `glowFor`'s card to its bubble, twice. `fingerdemo` runs at level 5; the builder measures the demonstration against the 75-second cap and plays fewer stories if needed, as level 4 does.
- **Registration:** ID, land (Story Grove), skills, music, sticker and co-play stay. No save fields, journal entries, couch or rework couplings.

## Build batches

1. **`thought-bubbles 3`, level 5, *Who is telling?*:** everything above.

## Check tier

New levels on level 4's interaction, with a new card kind and new voice lines:

- Typecheck and unit tests: tests 1–8 above, plus the registry, lands, how-to, voice and upright tests.
- One filtered `BROWSER_SUITE=thoughtbubbles` play on an upright phone at level 5, after the suite learns it: one wrong friend in a bubble (the miss and the replayed beat), a second on the same bubble (the glow, one hint), then a round finished through a `stayed` story where one card fills both bubbles.
- One upright phone screenshot at level 5 with both speech bubbles and the three friend cards.
- `fingerdemo` at level 5.
- `npm run build`, because voice lines and the how-to card change.

If the allowance cannot cover the whole level, stop with a draft-PR checkpoint after the model, rounds and tests (1–7).

## Open decisions

Each has a default the build uses; none waits on the developer (standing rule S8).

1. **Drag a friend card into a speech bubble, not tap a friend on the stage.** The study's row says "tap the friend". Default: drag, because it is the game's one action at every level, it reuses level 4's bubbles, drops, tally and ghost finger whole, a card dropped short is free where a slipped tap would be a miss, and the card row sits by the thumbs on a phone.
2. **Two tellings a story.** Default as above: the story is the long part to watch, so each story carries two questions, and level 4's per-bubble accounting fits as it is. Alternative: one telling a story; not chosen, because a three-question round cannot keep every fixed habit to two misses while still letting one friend tell twice.
3. **The helper comes in after the put.** Default as above, so no friend sees everything in three of the four patterns and the helper's card is a real choice. Alternative: the helper on stage from the start, as at level 4; not chosen, because then the helper could have told any telling and no owner would ever be the only fit.
4. **Only tellings with exactly one possible teller.** Default as above, so there is one right card and a miss can always show the part that friend was not there for. Alternative: "drag every friend who could have told it"; not chosen, because it needs a done button and a new kind of accounting.
5. **Tellings reuse the story's own lines in the pet's voice.** Default as above: no new clips per template, and no friend's voice gives the teller away. A first-person telling ("then I went out") waits for the M rung.
6. **Invented stories only** (study decision 5), as at levels 1–4.
