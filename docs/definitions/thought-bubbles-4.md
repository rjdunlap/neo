# Thought Bubbles, level 4 (definition)

**Built:** build batch 1, levels 1–3 upright (PR #2020, 2026-11-22); to build level 4, read “Build batches” item 2 and the sections above it. Note for batch 2: on the 390 × 844 phone the upright level-2 screen fits and clears Home and the guide, but its content ends about halfway down, leaving the lower half empty; batch 2 re-lays the upright top row and moves Replay under the cards, so use that to use the height rather than patching it now.

**Status: ready to build in two batches, no review gate.** Defined 2026-11-22 as slice LM2 of the [literature and meaning study](../deep-dives/subjects/literature-meaning.md#build-slices-in-order), from its [audience row U](../deep-dives/subjects/literature-meaning.md#a-first-games-ladder-thought-bubbles-13) and [candidates row LM2](../deep-dives/subjects/literature-meaning.md) (*Two bubbles*: two friends, two bubbles, different things seen; RL.3.6). The study's slice line said "after 1–3 are played"; the developer admitted Thought Bubbles 4 for definition on the study's lean without waiting for play on [2026-11-17](../archive/DECISIONS-2026-11-17.md#games), and [OBSERVATIONS](../OBSERVATIONS.md) has no Thought Bubbles notes yet, so nothing below draws on observed play. It extends the built [levels 1–3](thought-bubbles.md) (PR #1122) and changes none of them. Docs only: no code, voice line or art exists yet.

**Fun action and purpose.** Two friends share one thing. It is put away while both watch; then a kind friend moves it, and moves it again, while one or both of the owners are out of the door. When they come back, **both** friends get an empty thought bubble, and she drags a place card into each. Then each friend walks to the place in its own bubble, and the story shows what each one saw. The learning purpose is **two characters' points of view at once: each friend thinks what it last saw, so two friends in one story can think different things, or the same thing, and neither has to be where the thing really is** (CCSS RL.3.6, "distinguish their own point of view from that of the narrator or those of the characters", as read in the [study's anchors](../deep-dives/subjects/literature-meaning.md#anchors-opened-at-their-source)). Nothing has to be read. The how-to card makes no claim of a reading, theory-of-mind, attention or school benefit.

## Identity and overlap

Rechecked 2026-11-22 against the catalog, open definitions and `git log origin/main`. Level 2 already asks where *one* friend will look; level 4 keeps the same stage, cards, places and belief model and adds the second mind and a second move, so it is the same meaningful action (dragging a place into a friend's thought) and stays in Thought Bubbles. *Two Viewpoints* (social-emotional study, proposed) still owns two people's differing accounts of a quarrel; here nobody disagrees, they simply saw different moves. **Notice Board** keeps *who saw it* as a question about a source. **LM4 *Who is telling?*** (Thought Bubbles 5, define after this) reuses these same event lists.

## Bands and ladder

| Level | Name | Bands | What she decides |
| --- | --- | --- | --- |
| 4 | *Two bubbles* | school 4 | Where each of two friends thinks their shared thing is, from what each saw |

`LEVELS.school` becomes `{ min: 1, max: 4 }`; `prek` stays `1–2`. No `order`. The study places this rung at about 9 and up, the top of `school`, so `describeLevel(4)` is "Two bubbles (about 9 and up): two friends saw different things" and the how-to card carries the same note. A six-year-old reaches it only by two smooth rounds at level 3, and two struggling rounds step her back down as standard.

## The model (`logic.ts`)

The level-2 model is used as it is: `compile` (who saw each action), `believedPlace`, `actualPlace` and the three `PLACES`. Its tests already cover two moves where the first was seen and the second was not (definition test 1), which is exactly what level 4 plays.

- **Template** (`TwoTemplate`): `{ id, friends: [Friend, Friend], thing: Thing, movers: [Who, Friend] }`. The second mover is always a friend (never the wind), so someone can show where the thing went. At most three critters are on the stage at once. Bear and dog never share a story.
- **Pattern** (`TwoPattern`): which moves each friend saw. A friend who sees a move stays in the room (sitting by the rug); a friend who does not goes out of the door to play, and the door closes. The window is not used at level 4: one way of not seeing keeps the stage readable with two owners. Both friends always see the **put**, so each has a belief and a last-seen event.

  | Pattern | Friend who saw more | Other friend | Beliefs (more, other) | Kind |
  | --- | --- | --- | --- | --- |
  | `oneMove` | saw move 1, then went out | out before move 1 | middle, start | different |
  | `bothMoves` | stayed for both moves | out before move 1 | actual, start | different |
  | `lastMove` | stayed for both moves | saw move 1, then went out | actual, middle | different |
  | `sameMiddle` | both saw move 1, then went out together | (same) | middle, middle | same |
  | `sameStart` | both went out before move 1 | (same) | start, start | same |

  *Start* is where it was put, *middle* where move 1 took it and *actual* where move 2 took it; the three are the three places, all different. Everyone who went out comes back after move 2, in the order they left.
- **Story** (`TwoStory`): `{ template, pattern, more: 0 | 1, start, middle, actual, events }`, compiled by `twoStory(template, pattern, more, [start, middle, actual])`. `more` says which of the two friends saw more. `answersOf(story)` is `[believedPlace(events, friends[0], thing), believedPlace(events, friends[1], thing)]`, read from the event list, never stored.
- **`lastSeen(events, who, thing)`** returns the index of the last `put` or `move` of the thing that `who` saw. This is what a miss replays.
- **Bubbles:** bubble 0 belongs to `friends[0]` and is on the left (or on top in landscape), bubble 1 to `friends[1]`.

### Templates (`TWO_TEMPLATES`)

Every move is kind: tidying, sharing, making room, a puppy, the wind. Never a trick or a theft (study decision 3).

| ID | Friends and their thing | Move 1 | Move 2 |
| --- | --- | --- | --- |
| `ball-tidy` | Bear and Bunny's ball | Duck tidies it away | Duck moves it to sweep the floor |
| `shell-wind` | Cat and Pig's shell | a gust through the open window blows it along | Duck puts it somewhere safe |
| `teddy-puppy` | Duck and Cat's teddy | Dog, a puppy, carries it off | Dog drops it somewhere new |
| `drum-room` | Pig and Duck's drum | Bunny makes room to sit down | Bunny makes room to dance |
| `book-dust` | Bunny and Dog's book | Cat dusts where it was | Cat finds it a sunny spot |
| `apple-safe` | Bear and Pig's apple | Duck keeps it safe from the puppy next door | Duck makes room for the picnic cloth |

### Rounds

A round is three stories (`STORIES_PER_ROUND` stays 3) and earns one sticker. `roundFor(4, rng, first)`:

- **Two different stories in every round.** At least two of the three stories use a *different* pattern (`oneMove`, `bothMoves`, `lastMove`), and those two use two different patterns. In one of them the friend who saw more has the left bubble, and in the other the right one. The third story is any of the five patterns.
- The seed picks the templates (three different), the order, the patterns within that rule, which friend saw more and the three places.
- **The first round is authored:**
  1. `ball-tidy`, `oneMove`, Bear saw more (left). The ball goes red box → blue basket → shelf. Bear thinks the blue basket, Bunny the red box.
  2. `drum-room`, `sameStart`. The drum goes shelf → red box → blue basket. Both think the shelf.
  3. `book-dust`, `bothMoves`, Dog saw more (right). The book goes blue basket → shelf → red box. Bunny thinks the blue basket, Dog the red box, where it really is.

  So the same place is right for different friends for different reasons, the two bubbles agree once, and the place where it really is is right once.

**Why three stories and this rule (the habit property).** Two smooth rounds step her up, and a smooth round allows at most one miss. Every fixed habit that ignores who was in the room must therefore cost at least two misses in every round. Count a habit's misses as the number of bubbles where it gives the wrong place, and count copying as filling the first bubble right and putting the same card in the second. Each *different* pattern costs at least one miss under each of these habits:

- always the start place;
- always the middle place;
- always where the thing really is;
- copy the first bubble into the second.

So two different stories per round cost at least two misses each. The authored first round costs 2, 5, 5 and 2. A two-story round could not include a *same* story without letting copying pass. The rule test below checks this over every dealt round.

## Screen and controls

- **Stage, cards, places and Replay** are level 2's, unchanged: the 640 × 400 cottage, the three place cards (150 × 170, `draggable`, named on touch-down), and Replay (100) after the story's first play. Both friends stand at the front of the stage when the story ends, the friend with bubble 0 on the left.
- **Two bubbles**, each level 2's 220 × 150 `puffs` cloud with its 30-unit hit margin. Each carries a small head of its friend (`Critter` head at about 0.25 scale) on its rim, and its trailing dots run to that friend's head. So whose bubble it is shows without reading. Both are live drop targets at once, and she fills them **in either order**. The drop test uses the card's own position as now; the two hit areas never overlap.
- **A right card** floats home and leaves its picture in the bubble, the way level 3's held reason does, so one place card can fill both bubbles in a *same* story. A filled bubble takes no more drops: a card dropped on it floats home, free. A wrong card makes the bubble's friend shake its head, and the card floats home.
- **Layout** (`thoughtLayout(view, level)` gains the level and returns `bubbles: Pt[]`, one or two):
  - Landscape (1024 × 768): the two bubbles stacked in the right-hand column (centres about y 125 and 355, hit areas 20–230 and 250–460), Replay under them (centre about y 530), the stage and cards as now.
  - Upright (768 × 1024): the two bubbles side by side above the stage, right of Home (centres about x 300 and 600, hit areas 160–440 and 460–740). Home, two hit areas and Replay do not fit in one 768 row (130 + 2 × 280 + 100 = 790), so at level 4 Replay moves under the card row, at the right (centre about x `w` − 80, 70 below the cards' bottom edge), clear of the guide's bottom-left corner.

  These are candidate envelopes. The builder measures the art, safe insets and the guide at runtime and moves things within `view`, never shrinking a target below 100.
- **Phone first:** Thought Bubbles levels 1–3 are `upright` since batch 1 (PR #2020; the [upright sweep](phone-portrait.md#the-upright-sweep-built-2026-11-09) had measured them as "fits as is"), so an upright phone no longer shows the turn prompt, and level 4 is upright from its first commit.

## Narration and pacing

Level 4's stories are longer than level 2's: a put, two moves, and two friends coming and going. So the pet narrates **beat by beat**, one short line as each beat plays, instead of one line for the whole story. Each beat line belongs to the template, and the pattern only changes which beats play and in what order:

- the put (both friends watch);
- each friend going out;
- move 1 and move 2 (each with its kind reason);
- each friend coming back.

A friend who stays sits by the rug and watches the mover, and the beat line says so ("Dog stays and reads in the corner"). The two moves are the same length whoever is watching. The deciding difference is who is on the stage, not the wording.

## Accounting, help and finishing

- **Free, never a miss:** Replay; a card's spoken name; a card dropped off both bubbles or onto a filled one.
- **A wrong card in a bubble** is one miss. The friend does not walk anywhere (as at level 2). The pet asks that friend's question (`thought.two.saw.{friend}`, "What did Bunny see last?") and the stage replays **that friend's last-seen beat** (`lastSeen`), with the friend's bubble pulsing.
- **Hints are per bubble.** Two misses on one bubble glow that bubble's answer card and the bubble's edge, counted as **one hint**. **Show me** glows the first unfilled bubble (left or top first) and its card, one hint, unless that bubble's glow is already on. `Tally` gains a per-bubble reset (`newQuestion()`, called per bubble at level 4 and per story at levels 1–3, so those levels are unchanged).
  - Each bubble is its own question, and each glow is real help, so assisted play is not counted as independent. One story where both bubbles needed the glow therefore gives two hints and a struggling round. That is intended: it takes two struggling rounds to step down.
- **When both bubbles are filled**, the friends act one after the other, bubble 0 first. Each walks to the place in its bubble:
  - If its belief is where the thing really is, it finds it ("There it is!").
  - If not, the move-2 mover kindly shows it where the thing went (`thought.two.{id}.helped`).
  - Then the pet sums up the story: "They saw different things, so they thought different things." or "They saw the same things, so they thought the same thing."

  No friend ever walks to a place that was not its answer.
- **Assisted ending:** every story ends through her drags, after the glow if needed. One sticker per round of three stories, including with help. After the third story, `ctx.finish({ misses, hints })` is called, once.

## Model and rule tests (`logic.ts`, `logic.test.ts`)

1. **Compile:** every template × pattern × `more` × place order compiles. Both friends see the put. `answersOf` matches the pattern table's beliefs (start, middle, actual). `lastSeen` is never null, and its event's `to` is that friend's answer.
2. **Kinds:** the three *different* patterns give two different answers, and the two *same* patterns give equal answers. `bothMoves` and `lastMove` give one friend the actual place, and the others give neither friend the actual place.
3. **Rounds** (300 seeds): three distinct templates; at least two *different* stories with two different patterns, one with the friend who saw more on the left and one on the right. Every pattern, every template and each place as an answer occur across seeds. The same seed gives the same round. The first round matches the authored list.
4. **The habit property:** over the first round and every dealt round in 300 seeds, each of the four habits (always start, always middle, always where it really is, and copy the first bubble right into the second) gives at least two misses.
5. **Casts:** at most three critters on the stage per template, never bear with dog, and the second mover is never the wind.
6. **Accounting:** a wrong card in either bubble is one miss. Free actions count nothing. Two misses on one bubble give exactly one hint for that bubble. Show me picks the first unfilled bubble. A filled bubble refuses a drop, free. Levels 1–3's tallies are unchanged.
7. **Hints lead somewhere:** `glowFor` at level 4 gives the first unfilled bubble and its answer card. Replaying `lastSeen` ends with the thing at that friend's answer.
8. **Layout:** `thoughtLayout` at the four standard views and the upright 768 × 1024 view, for levels 1–4. Every card, both bubbles' hit areas and Replay are at least 100 and inside the view. The two hit areas never overlap each other, a card, Replay or Home. Stage scale is at least 0.85. Cards never overlap the stage or the guide's corner. `upright.test.ts` walks every level.

## Speech, how-to, ghost and registration

Instructions use `ctx.instruct`; everything else `ctx.say`. Every line is slot-free.

- **Instruction:** `thought.instruct.4`: "Where does each friend think it is? Fill both thought bubbles." Then the template's own question as an instruction, `thought.two.{id}.ask`, for example "Where do Bear and Bunny think their ball is?", skipped if she has already filled both.
- **Per template** (6): `.put`, `.out.{friend}` (2), `.stay.{friend}` (2), `.move1`, `.move2`, `.back.{friend}` (2), `.ask`, `.helped`. For example, `thought.two.ball-tidy.move1`: "Duck tidies the ball away." and `thought.two.ball-tidy.helped`: "Duck shows Bunny: here it is, I moved it to sweep!"
- **Per friend** (6): `thought.two.saw.{friend}`: "What did Bear see last?"
- **Shared:** `thought.two.found` ("There it is!"), `thought.two.done.different`, `thought.two.done.same`. The existing `thought.thinks` and `thought.notquite` and the place names are reused.
- **Words:** *thinks*, *saw* and *saw different things*. *Point of view* appears only on the grown-up card. No line says *wrong*, *trick*, *silly* or *fooled*. A friend who missed a move is helped, never laughed at.
- **How-to card** (`src/content/howto.ts`), adding to the existing card:
  - Step `{ from: 4, to: 4 }`: "Two friends each get a bubble: drag the place each one thinks the thing is. Who was in the room when it moved?"
  - Note `{ from: 4, to: 4 }`: "About 9 and up. Two friends can think different things, or the same thing; neither has to be right about where it really is."
  - The grown-up note gains "two characters' points of view" for level 4.
- **Ghost finger:** `autotouch()` at level 4 waits for the story, then drags `glowFor`'s card to its bubble, twice. `fingerdemo` runs at level 4.
- **Registration:** ID, land (Story Grove), skills, music, sticker and co-play stay. `describeLevel(4)` is as above. The co-play line gains nothing; the grown-up can play the second friend in the existing *hider* game. No save fields, journal entries, couch or rework couplings.

## Build batches

1. **`thought-bubbles upright`, levels 1–3, built 2026-11-22 (PR #2020)** (phone play; existing-game change to layout): `upright: true`, an `upright.test.ts` walking levels 1–3 through `thoughtLayout` on the 768 × 1024 view (whose portrait branch already exists), and any placement fix that test finds. No rule or speech change.
2. **`thought-bubbles 2`, level 4, *Two bubbles*** (batch 1 is built): everything above.

## Check tier

- **Batch 1, existing-game layout change:** typecheck, its rule and new upright tests, one filtered `BROWSER_SUITE=thoughtbubbles` play on an upright phone viewport, and one upright phone screenshot at level 2. No build unless shared files change.
- **Batch 2, new interaction tier:**
  - Typecheck and unit tests: tests 1–8 above, plus the registry, lands, how-to and upright tests.
  - One filtered `BROWSER_SUITE=thoughtbubbles` play on an upright phone at level 4, after the suite learns it: one wrong card in a bubble (the miss and the replayed beat), a second on the same bubble (the glow, one hint), then both bubbles filled through a *same* story.
  - One upright phone screenshot at level 4 with both bubbles and the three cards.
  - `fingerdemo` at level 4.
  - `npm run build`, because voice lines and the how-to card change.

  If the allowance cannot cover the whole level, stop with a draft-PR checkpoint after the model, rounds and tests (1–7).

## Open decisions

Each has a default the build uses; none waits on the developer (standing rule S8).

1. **Three stories a round, two of them different.** Default as above, from the habit property. Alternative: two stories a round to keep the round short; not chosen, because a two-story round with a *same* story lets copying pass smooth, and one without a *same* story teaches "always different".
2. **Hints per bubble, not per story.** Default per bubble, because each bubble is its own question and each glow is real help. Alternative: one hint per story, as at levels 1–3; not chosen, because it would count a story where she needed help on both friends as only one hint's worth of help.
3. **No window at level 4.** Default: a friend who does not see a move has gone out of the door. Alternative: mix in the window as at level 2; not chosen, because two owners plus the window crowd the stage and a second way of not seeing adds nothing to the two-viewpoints point.
4. **Free order for the two bubbles.** Default: either first, with Show me taking the left or top one. Alternative: the pet asks for one friend, then the other; not chosen, because both minds should be in view at once (RL.3.6), and the per-friend question already comes with a miss.
5. **Upright first.** Default: batch 1 makes levels 1–3 upright before level 4. Alternative: fold it into batch 2; not chosen, because it is a small, separately checkable phone slice, and phone work comes first in READY.
6. **Invented stories only** (study decision 5), as at levels 1–3.
