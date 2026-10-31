# Thought Bubbles, levels 1–3 (definition)

Defined 2026-10-31 as slice 1 (LM1) of the [literature and meaning study](../deep-dives/subjects/literature-meaning.md#build-slices-in-order), from its [ladder](../deep-dives/subjects/literature-meaning.md#a-first-games-ladder-thought-bubbles-13) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#literature-and-meaning-recommendations). The study's five decisions were adopted on its leans under the [October 23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) ([study](../deep-dives/subjects/literature-meaning.md#decisions-for-the-developer)). Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: ready to build** as one same-game batch, `thought-bubbles 1` (levels 1–3, new-game tier). Registration, bands and land take the defaults below under standing rule S8. Every story is an invented island story about pictured things, so S1 has no real-world claim to check (study decision 5). It depends on no other unbuilt game.

**Fun action and purpose:** a tiny picture story plays on a little cottage stage, narrated by the pet. Then one friend in it gets an empty **thought bubble**, and she drags a picture card into it. The friend **acts on what is in the bubble**: reaches for that thing, walks to that place, or nods at that reason. So the story itself shows whether the bubble made sense. The learning purpose is **reading a character: what a friend wants (from a visible reach), where a friend thinks something is (from what he saw), and what in the picture shows why a friend did something** (CCSS RL.K.3, RL.2.3, RL.3.1, RL.3.3, RL.3.6 and RL.3.7, as read in the [study's anchors](../deep-dives/subjects/literature-meaning.md#anchors-opened-at-their-source)). Nothing has to be read. The how-to card makes no claim of a reading, theory-of-mind, attention or school benefit.

## Identity and overlap

Rechecked 2026-10-31 against the catalog, the open definitions and `git log origin/main`:

- **Feelings Faces** level 12 *Ask first* shows a friend's wish in a bubble (`wishBubble`) **after she asks**: the wish is told, not inferred. Here nothing is told. The goal, the belief or the reason has to be read from the picture and the story. Feelings stay with Feelings Faces; Thought Bubbles never asks how a friend feels.
- **Relay Woods** (built, NC2) has no thought bubbles in its code today. The [networks study](../deep-dives/subjects/networks-citizenship.md)'s *Postcard or envelope* (who saw a postcard) is still a proposal and a privacy lesson; Thought Bubbles' "you know what you saw" is about a character in a story.
- **Story Steps** orders strips, chooses causes, predicts endings (level 11) and replays a changed choice (Story Theater, levels 12–13). Its action is arranging and predicting events. Here the events are given and the question is about a character's mind. Story Steps is 13 levels deep (study decision 1).
- **Notice Board** ([definition](notice-board.md), queued) asks *who saw it* to judge whether a poster can be trusted. That is about a source, not a character's belief. **Attic Finds** asks what an old object was for; it has no character.
- *Two Viewpoints* (social-emotional study, proposed) owns two people's differing accounts of a quarrel. Thought Bubbles has one friend's mind per story at levels 1–3; two bubbles are LM2.

## The model (`logic.ts`)

- **Things** (`Thing`): `'apple' | 'ball' | 'kite' | 'cup' | 'book' | 'drum' | 'boat' | 'balloon' | 'teddy' | 'shell'`. **Places** (`Place`, level 2): `'redBox' | 'blueBasket' | 'shelf'`. **Reasons** (`Reason`, level 3): `'rain' | 'cold' | 'visitor' | 'sleeping' | 'birthday' | 'droopy' | 'bedtime' | 'thirsty' | 'beach' | 'dance' | 'bath' | 'hungry'`. Each is one picture and one spoken name.
- **Cast:** each story template names its own friends from `CRITTERS` (`bunny`, `bear`, `duck`, `cat`, `pig`, `dog`), fixed per template so every line is slot-free. **Bear and dog never share a story** (both are brown).
- **Level 1 story** (`WantStory`): `{ id, friend, cued: Thing, items: { thing: Thing, x, y }[] }`. There are three items in stage units (640 × 400, origin top-left); the friend stands at `friendAt`; the reach comes from `pawAt` toward the cued item. `cueAngle(story, thing)` is the angle between the reach direction and the direction from `pawAt` to that item.
- **Level 2 story** (`LookStory`): a template plus a seeded `kind: 'away' | 'watching'` and a seeded assignment of places. It compiles to an **event list**:
  - `put(owner, thing, place)`
  - `leave(owner, to: 'outside' | 'window')`
  - `move(mover, thing, from, to)`
  - `back(owner)`

  Every event records **who saw it**. A friend sees an event when they are in the room or at the window, and not when they are outside.
- **`believedPlace(events, who, thing)`** returns the `to` of the last `put` or `move` of that thing that `who` saw. **`actualPlace(events, thing)`** returns the last `to` of all. The model is general: any number of moves, and any mix of seen and unseen moves. Levels 1–3 use stories with exactly one move. The three level-2 cards are the start place, the end place and the third place. The answer is the start place exactly when `kind === 'away'`.
- **Level 3 story** (`WhyStory`): `{ id, friend, action, reasons: [Reason, Reason, Reason], supported: Reason, regions: { id, rect, supports: Reason | null }[] }`. A region is an area of the stage picture that speaks its name when tapped. Exactly one region supports the right reason (the clue); no region supports either distractor.
- **Rounds** are three stories; one round earns one sticker. `roundFor(level, rng, first)` deals three stories from the level's pool. The first round at each level is authored (the first row of each table below, then the next two in order). After that the seed varies:
  - which stories, and their order;
  - card order;
  - at level 2, away or watching and which places start and end.

  Level 1 never repeats a cued thing within a round. Every level-2 round has at least one away and at least one watching story.
- **Layout** (`thoughtLayout(view, level)`, from `view`, never `window`): the stage rect and its scale, the bubble, the three card slots, the Replay button and, at level 3, the region rects mapped to the screen.
- `glowFor(story, stage)` is the hint target: the cued thing's card; the believed place's card (after the deciding beat replays); the supported reason's card; then the clue region.

## Levels

| Level | Name | Bands | What she decides |
| --- | --- | --- | --- |
| 1 | *What does she want?* | pre-K 1, school 1 | Which thing the friend is reaching for |
| 2 | *Where will he look?* | pre-K 2, school 2 | Where the friend thinks his thing is, from what he saw |
| 3 | *How do we know?* | school 3 | Why the friend did something, then where the picture shows it |

`BandLevels`: `prek: { min: 1, max: 2 }`, `school: { min: 1, max: 3 }`. No toddler or preschool range (the study's audience table). A grown-up opening it from the signpost plays at pre-K level 1 by `playBand`. No `order`.

### Level 1 stories (`WANT_STORIES`)

All six are authored; stage units 640 × 400. In each, the friend reaches toward the cued thing with a raised paw and leans that way, and hops toward it every few seconds as if it is just out of reach.

| ID | Friend and scene | Cued (reached for) | Distractors in the scene |
| --- | --- | --- | --- |
| `apple-tree` | Bunny under a tree, reaching up | apple, in the branches | ball by her feet, kite on the grass to the right |
| `cup-table` | Bear at a table, reaching across it | cup, at the far end | book right beside him, drum under the table |
| `boat-pond` | Duck at the pond's edge, reaching out | boat, floating | ball on the grass behind her, balloon tied to a post |
| `book-shelf` | Cat on tiptoe at a tall shelf | book, on the top shelf | cup on a low stool by her, teddy on the floor |
| `balloon-bush` | Pig reaching up to a bush | balloon, caught in the bush | apple on the ground, kite on the fence |
| `ball-bed` | Dog lying flat, reaching under a bed | ball, under the bed | book and teddy on the bed above |

**The decoy rule** (the study's person check made a property): in at least four of the six stories, a distractor is **nearer** the friend's paw than the cued thing. The cued thing is above the friend in some stories and level with or below him in others. So "tap what is closest" or "tap what is highest" fails, and only the reach decides.

### Level 2 templates (`LOOK_TEMPLATES`)

Every move is kind: tidying, sharing, a puppy or a gust of wind, **never a trick or a theft** (study decision 3). The owner goes out of the door to play (away), or goes out and watches through the window (watching). Then he comes back for his thing.

| ID | Owner and thing | Mover and why it moves |
| --- | --- | --- |
| `bear-ball` | Bear's ball | Duck tidies up |
| `bunny-book` | Bunny's book | Pig dusts where it was and puts it somewhere else |
| `cat-shell` | Cat's shell | a gust of wind through the open window blows it along |
| `duck-teddy` | Duck's teddy | Dog, a puppy, carries it off in his mouth |
| `pig-drum` | Pig's drum | Bunny makes room to sit down |
| `dog-apple` | Dog's apple | Cat keeps it safe from the puppy next door |

The first round is authored:

1. `bear-ball`, away: ball from the red box to the blue basket; the answer is the red box.
2. `cat-shell`, watching: shell from the shelf to the red box; the answer is the red box.
3. `bunny-book`, away: book from the blue basket to the shelf; the answer is the blue basket.

In this round the start place is the answer in the away stories and the end place in the watching one. The same place (the red box) is right for different reasons, so no place-name habit works.

**Picture of the two kinds:**

- **Away:** the owner walks out of the door, the door closes, and he is nowhere on screen while the thing moves.
- **Watching:** the owner walks out, then appears in the window frame (head and shoulders, facing in) and stays there while it moves.

The deciding beat (the move) is the same length in both kinds.

### Level 3 stories (`WHY_STORIES`)

All six are authored. Reason cards are **pictures** (never words), each spoken on touch-down. Regions are at least 120 stage units on each side and never overlap one another.

| ID | Friend and surprising action | Reasons (✓ supported) | Clue region | Other regions |
| --- | --- | --- | --- | --- |
| `duck-umbrella` | Duck takes an umbrella out on a sunny morning | ✓ `rain` (rain cloud), `birthday` (cake), `bedtime` (moon) | the window: dark clouds coming | the open door with sunshine, a vase of flowers, the rug |
| `bear-cups` | Bear sets out two cups | ✓ `visitor` (a friend's face), `thirsty` (water drop), `bedtime` (moon) | the window: Bunny walking up the path | the kettle, a plant, the rug |
| `cat-scarf` | Cat puts on a scarf and mittens | ✓ `cold` (snowflake), `beach` (sun and bucket), `dance` (music note) | the window: snow falling | the coat hook, a lamp, the rug |
| `bunny-tiptoe` | Bunny tiptoes across the room | ✓ `sleeping` (closed eyes), `dance` (music note), `hungry` (empty bowl) | a cot with a duckling asleep | the toy box, the sunny window, a lamp |
| `pig-present` | Pig wraps a box with a bow | ✓ `birthday` (cake), `cold` (snowflake), `bath` (bubbles) | a cake with candles on the table | the sunny window, a chair, the rug |
| `dog-watering` | Dog carries a full watering can outside | ✓ `droopy` (droopy flower), `bath` (bubbles), `rain` (rain cloud) | droopy flowers outside the door | the sunny window, the doormat, a toy bucket |

A region's picture never supports a distractor. Where a distractor is ruled out by something visible, that region names it without supporting it: "The sun is shining" is a sunny-window region, not the clue for `rain`.

## Screen and controls

- **The stage** is code-drawn in `src/games/thought-bubbles/art.ts`: a cottage room 640 × 400 stage units with a door on the left, a window at the back (`windowArt` from `src/art/room.ts`) and the scene's items. Level 1 scenes are outdoors (tree, pond, bush) or indoors (table, shelf, bed) on the same frame. Friends are `Critter`s at about 0.45 scale with `alive = true`.
- **The cue is a paw, not the eyes.** `Critter`'s pupils follow the last touch anywhere on screen, so gaze cannot carry a cue. The reach is a code-drawn arm and paw (`reachArm(angle)` in the game's `art.ts`, the friend's colour, drawn locally rather than imported from another game) attached with `critter.attach`, plus a 10° lean of the friend's node toward the thing. No shared-file change.
- **Thing, place and reason pictures:** `prop('apple' | 'balloon', …)` from `src/art/props.ts` for the apple and balloon; everything else is drawn in the game's `art.ts` with `src/art/palette.ts`. Story Theater's `theaterScene` is fixed to its own two-cast weather scenes, so it is not reused; its narrated-beat pacing is the model.
- **The bubble** is drawn with `puffs` from `src/art/shapes.ts` (the shape `wishBubble` uses), about 220 × 150, beside the friend's head with two trailing dots. It is the drop target. Its own hit area is the whole cloud plus a 30-unit margin, at least 100 on screen. It swells and its edge brightens while a dragged card is over it.
- **Cards** are cream tiles of **150 × 170** in one row of three under the stage, each holding a picture. They use `draggable` from `src/engine/drag.ts`; the drop test uses the card's own position (which rides 40 above the finger). A card dropped anywhere but the bubble floats home, free. A card speaks its name on touch-down.
- **Replay** (100 × 100, top right of the stage) plays the story again, free, at any time after it first ends. Cards and the bubble appear only after the story's first play.
- **Layout:**
  - Landscape (1024 × 768): the stage at scale 1 on top, the bubble overlapping its top edge beside the friend, and the cards below (3 × 150 + 2 × 24 = 498).
  - Portrait (768 × 1024): the stage at about 1.1, the cards below it, shifted right if needed so the pet's bottom-left corner stays clear.

  Stage scale is never below 0.85 at the four standard views, so a 120-unit region is at least 100 on screen. Home top-left and the pet corner stay clear.

## Accounting, help and finishing

- **Free, never a miss:**
  - Replay, at any time.
  - A card's spoken name on touch-down.
  - A card dropped off the bubble.
  - At level 3's pointing stage, every tap on a region that is not the clue (it speaks the region's name: "A vase of flowers").
- **Level 1:** a wrong card in the bubble is one miss. The friend looks at it, shakes its head, and the bubble lets it float home. The pet asks the story's hint question ("Bunny is reaching up. What is up there?"). The right card: the friend gets it (the apple drops into Bunny's paws), cheers, and the story ends.
- **Level 2, counted from the first pick** (the advice-reviewed change from the study's free first pick; see open decision 3). A wrong place in the bubble is one miss. The friend does **not** act on it, because walking to a wrong place would show the wrong answer as if it were true. The pet replays the deciding beat with the story's question ("Was Bear in the room when it moved?"). The right card: the friend walks there. In an away story the thing is not there; the mover shows him where it went, kindly ("Here it is! I tidied it"). In a watching story he finds it at once.
- **Level 3:** a wrong reason is one miss. The friend tilts its head and the card floats home; the pet says what the picture would need ("Is there a cake?"). The right reason: the friend nods, the bubble keeps the picture, and the pet says "Show me how you know." Then a tap on the clue region sparkles and ends the story.
- **Hints:**
  - Two misses on one story glow `glowFor`'s card, counted as **one hint** per story. At level 2 the deciding beat replays first.
  - At level 3's pointing stage, the third non-clue region tap makes the pet ask again and glows the clue, counted as one hint (once per story). The taps themselves are never misses.
  - **Show me** (`askForHint`, `hintLabel = 'Show me'`) glows the current target and counts one hint.
- **Assisted ending:** every story ends through her drag (and at level 3 her tap), after the glow if needed. One sticker per round, including with help.
- **Finishing:** after the third story, `ctx.finish({ misses, hints })`, once.
- **Adaptation:** two smooth rounds step up, two struggling rounds step down, as standard. Because level 2 counts the first pick, a child who always chooses where the thing really is misses in every away story. That rules out smooth rounds, so she does not step up to level 3 on that habit.

## Speech (`voice-script.ts`)

Instructions use `ctx.instruct`; everything else uses `ctx.say`. Every line is slot-free (each template names its own cast), so the Kokoro renderer can cover them all.

- **Instructions:**
  - `thought.instruct.1`: "What does she want? Put it in the thought bubble."
  - `thought.instruct.2`: "Where will he look? Put the place in his thought bubble."
  - `thought.instruct.3`: "Why did she do that? Put the reason in her thought bubble."
  - `thought.showme`: "Show me how you know. Tap it in the picture."
- **Names** (spoken on touch-down):
  - `thought.thing.{thing}` (10): "The apple", "The ball", and so on.
  - `thought.place.{place}` (3): "The red box", "The blue basket", "The shelf".
  - `thought.reason.{reason}` (12): "It will rain", "It's cold", "A friend is coming", "Someone is sleeping", "It's a birthday", "The flowers are droopy", "It's bedtime", "Thirsty", "Going to the beach", "Time to dance", "Bath time", "Hungry".
- **Level 1, per story** (6 × 3):
  - `thought.want.{id}.story`: "Bunny is under the apple tree."
  - `thought.want.{id}.hint`: "Bunny is reaching up. What is up there?"
  - `thought.want.{id}.got`: "Bunny wanted the apple!"
- **Level 2, per template and kind** (6 × 2 story lines, plus 6 × 3 shared lines):
  - `thought.look.{id}.away`: "Bear puts his ball away and goes out to play. Duck tidies up. Bear comes back for his ball."
  - `thought.look.{id}.watching`: "Bear puts his ball away and goes outside. He watches through the window. Duck tidies up. Bear comes back for his ball."
  - `thought.look.{id}.ask`: "Where will Bear look for his ball?"
  - `thought.look.{id}.saw`: "Was Bear in the room when it moved?"
  - `thought.look.{id}.helped`: "It's not there! Duck shows him: here it is, I tidied it."

  The away and watching lines differ only in the window clause, so the pictures, not the wording, carry the difference.
- **Level 3, per story** (6 × 4, plus regions):
  - `thought.why.{id}.story`: "Duck takes her umbrella. It's a sunny morning!"
  - `thought.why.{id}.ask`: "Why did Duck take her umbrella?"
  - `thought.why.{id}.found`: "The clouds are coming. Duck thinks it will rain!"
  - `thought.why.{id}.again`: "What in the picture tells us?"
  - `thought.region.{story}.{region}` (24): "Dark clouds", "A vase of flowers", and so on.
  - `thought.need.{reason}` (12): "Is there a cake?", "Is there snow?", "Is it night?", and so on, one per reason.
- **Shared:**
  - `thought.thinks` (3 variants): "That's what he thinks!", "You knew what she wanted!", "Good looking!"
  - `thought.notquite`: "Hmm, look again."
- **Words** (study decision 4): *wants*, *thinks*, *saw* and *how do we know* in speech. *Point of view*, *inference* and *narrator* appear only on the grown-up card. No line says *wrong*, *trick*, *silly* or *fooled*. The friend who was away is helped, never laughed at.

## Rule tests (`logic.test.ts`)

1. **Belief model:** `believedPlace` on hand-built event lists:
   - away with one move gives the start place;
   - watching gives the end place;
   - **two moves, the first seen and the second not**, give the middle place (neither the start nor the actual place);
   - two moves both unseen give the start;
   - an owner who sees the thing put down and then every move ends up believing the actual place.
2. **Level 2 compile:** every template × kind × place assignment compiles to a valid event list. The answer equals the start place exactly when away, and never equals the third place. `actualPlace` is the end place.
3. **Level 2 rounds** (300 seeds): three stories, at least one away and one watching. Both kinds occur in every position across seeds, and each place is the answer somewhere. The first round matches the authored table. The same seed gives the same round.
4. **Level 1 stories:**
   - exactly one cued thing per story, and it is among the items;
   - `cueAngle` to the cued thing is at most 10°;
   - every distractor's `cueAngle` is at least 35°;
   - **the decoy rule** (a distractor nearer the paw in at least four of six; the cued thing above the friend in some stories and not in others);
   - three distinct cued things in every round across 300 seeds.
5. **Level 3 stories:**
   - three distinct reasons, with the supported one among them;
   - exactly one region supports it, and no region supports a distractor;
   - regions are at least 120 stage units on each side, pairwise non-overlapping and inside the stage.
6. **Accounting:**
   - a wrong card at any level counts one miss;
   - Replay, touch-down names, off-bubble drops and non-clue region taps count nothing;
   - two misses on a story give exactly one hint;
   - the third non-clue tap gives one hint once per story;
   - misses never block the right answer;
   - always choosing the actual place gives a miss in every away story.
7. **Hints lead somewhere:** `glowFor` is the right card at each stage and the clue region after the reason.
8. **Layout:** `thoughtLayout` at the four standard views for each level:
   - every card, the bubble's hit area, Replay and every level-3 region (mapped through the stage scale) is at least 100 and inside the view;
   - stage scale is at least 0.85;
   - cards never overlap the stage or the pet corner.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`. `autotouch()` waits for the story to end, reads the current story from the scene, and drags `glowFor`'s card to the bubble. At level 3 it then taps the clue region's centre. `fingerdemo` runs at levels 2 and 3.
- **How-to card** (`src/content/howto.ts`). Goal: "Watch a little story, then put a picture in a friend's thought bubble: what the friend wants, thinks or why they did something."
  - Steps:
    - "Watch the story; the replay button plays it again" (all levels).
    - "Drag what the friend is reaching for into the bubble" `{ from: 1, to: 1 }`.
    - "Drag the place where the friend thinks the thing is; did he see it move?" `{ from: 2, to: 2 }`.
    - "Drag the reason into the bubble, then tap the part of the picture that shows it" `{ from: 3, to: 3 }`.
  - Finish: "The round ends after three little stories" (all levels).
  - Notes:
    - "The friend acts on what is in the bubble, so the story shows whether it made sense" (all levels).
    - "A friend who went out of the door did not see what moved; a friend at the window did" `{ from: 2, to: 2 }`.
    - "Tapping around the picture is free; only the bubble counts" `{ from: 3, to: 3 }`.
    - "On the grown-up side, this is a character's point of view and an inference from the picture; it shows how she answers with the pet's spoken story, not that she reads stories this way on her own" (all levels).
- **Registration (default under S8):** ID `thought-bubbles`, name "Thought Bubbles", spoken title `game.thought-bubbles` ("Thought bubbles"). Region (subject) `story-grove`. Skills `['characters', 'perspective', 'inference', 'listening']` (free strings).
  - Home land **Story Grove**, as its 17th game, or 18th if Not Always lands first. Story Grove has 16 games on `main` and `LAND_SPOTS` is 13, so it already pages, and Thought Bubbles joins its second page.
  - Fallback **Cozy Village** (19 today). `lands.test.ts` decides at build time.
  - Hub icon: a friend with an empty thought bubble. Sticker: Bunny holding the apple, with a bubble showing it.
- **Art:** code-drawn as above. No imported art or audio; music `STYLES` as the land's ordinary style (not silenced, since she makes no music).
- **Co-play** (`coplayHint`, the study's *hider* role): "Play the hider: while the friend is out of the room, say where the thing goes, then ask where the friend will look. Swap turns." **Off-screen:** "Hide a toy while teddy is 'asleep', then ask: where will teddy look for it? How do you know?" The grown-ups' story-talk card stays LM3.
- **Couch:** none. **Journal:** nothing filed. **Saves:** nothing new beyond the shell's ordinary round history; nothing kept.
- **Rework couplings:** none required. A creature that did not see something is a natural later thread, as the [study](../deep-dives/subjects/literature-meaning.md#fit-with-the-creature-world-rework) notes; the cast is the island friends until the rework's cast settles.

## Check tier

**Batch `thought-bubbles 1` (levels 1–3), new-game tier:**

- Typecheck and unit tests (tests 1–8, plus the registry, lands and how-to tests).
- One scripted play through a new `browser-check.mjs` case (and its README row):
  - level 1: one wrong card, a second for the glow, then the right card;
  - level 2: the actual place in an away story (a miss and the replayed beat), then the right card; a watching story answered right;
  - level 3: one wrong reason, then the right one, one free region tap, then the clue.
- One portrait screenshot at level 2 with the bubble, the window and the three cards.
- `fingerdemo` at levels 2 and 3.
- `npm run build`, because the registry, lands, voice and how-to change.

If the allowance cannot cover level 3, stop after complete levels 1–2 with a draft-PR checkpoint.

Person and device checks stay open (DEVICE-CHECKS once built):

- whether a four- or five-year-old reads the empty bubble as "what he thinks", or as a place to put the right object;
- whether the window story feels fair after the away story, or like a trick;
- whether *show me how you know* feels like finding treasure or like a test;
- whether the reach reads at iPad size.

Browser automation establishes none of these.

## What comes next

**LM3** the grown-ups' story-talk card follows the build. **LM2** Thought Bubbles 4 *Two bubbles* (two friends who saw different things, and the two-move stories the model already handles) is defined after levels 1–3 are played; then **LM4** *Who is telling?*.

## Open decisions

Each has a default the build uses; none waits on the developer (S8).

1. **A new game in Story Grove**, pre-K 1–2 and school 1–3, fallback Cozy Village (study decisions 1–2).
2. **A paw, not the eyes, carries level 1's cue.** Default: the attached reaching arm and a lean, because `Critter`'s pupils follow touches. Alternative: give `Critter` a fixed gaze target; not chosen, because it is a shared-file change to the rig every game uses.
3. **Level 2 counts the first pick.** Default: counted, with the replayed beat as the response. Alternative: the study's free first pick; not chosen, because always choosing where the thing really is would then finish every round smooth and step her up without showing she follows what the friend saw.
4. **No two-move stories at 1–3.** Default: the model and tests handle them, and LM2 uses them. Alternative: one school-only template; not chosen, because content would then differ by band within a level.
5. **Invented stories only** (study decision 5): no folktale, fable or religious story until a named reviewer.
