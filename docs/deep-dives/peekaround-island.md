# Peekaround Island deep dive

*ID `peekaround-island` · bands toddler 1–2, preschool 2–4, pre-K 3–5, school 4–5 · levels 1–5 on 2026-10-31 · session `claude/dive-peekaround-island` ([PR #1082](https://github.com/rjdunlap/neo/pull/1082))*

## The game today

A round island seen from the side, a big round tree in the middle, four friend spots a quarter turn apart. Turning is drawn, not 3D: each spot's angle projects onto an ellipse, depth sets scale and draw order, and a friend behind the crown is hidden and cannot be tapped. "In front of", "behind" and "next to" are always from her side (`whereIs` in `logic.ts`), so turning the island changes them. The learning purpose is that things still exist when hidden, then that position words depend on where you look from (Puzzle Peaks; [GAMES.md](../GAMES.md#peekaround-island)).

| Level | Plan | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | `find`, 3 scenes | toddler | Turn (arrow or tap the tree) until the one hidden friend shows, then tap it |
| 2 | `named`, 3 scenes | toddler, preschool | Which friend was asked for; two others stand in plain sight (tapping one is a miss) |
| 3 | `who`, 3 scenes, no arrows | preschool, pre-K | Which of four picture tiles is the friend she cannot see (elimination); a right pick turns the island halfway to show it |
| 4 | `place`, four friends from the shore | preschool, pre-K, school | Where "behind", "in front of" or "next to" is; drag the friend there |
| 5 | `two`, two pairs | pre-K, school (top) | Two directions at once; then the island turns halfway and the pet names who is in front now |

**Content pools.** Seven friends (`FRIENDS`); the hider never repeats back to back; visible friends stand on the three non-behind spots. Placement requests prefer a word not yet asked. One tree is the only thing that hides; every `around.*` line names "the tree". Adventure Walk's test imports `WHERE_WORDS` and asserts none of its path phrases contains a Peekaround word, so this game owns static position words and Adventure Walk owns movement words ([definition](../definitions/adventure-walk.md)).

**Mistakes and help.** Level 1 cannot be missed. Level 2: tapping a visible friend is a miss ("That is the pig! Where is the duck hiding?"); two misses ring the arrows and say "Tap an arrow to turn". Level 3: a visible friend's tile is a miss and that friend says where it stands; two misses ring the hider's tile. Levels 4–5: a drop on a spot that does not fit is a miss with the word explained; a drop off the island floats home free; two misses ring the fitting free spots. The bot (`peekTouch`) turns, taps or drags to a fitting spot and is rule-tested.

**Known gaps found reading the code** (not fixed here; slice 1):

- **The how-to is untrue at several levels.** Step 1, "Tap an arrow to turn the island round", is a plain string, so it shows at every level, but levels 3–5 have no arrows (the tree only rustles). The `to: 3` step says "tap the picture", but levels 1–2 tap the friend on the island; only level 3 has pictures. The level-5 step says "tap who is in front now", but the code only says it (`around.now`); nothing is tapped.
- **Level 5's half turn often names nobody.** After the first pair only two spots are filled; `placed()` names the friend now in front, and skips the line silently when that spot is empty. Working through `nextRequest`, someone stands behind (and so comes to the front) after about 58% of first pairs; in the other ~42% the turn ends with no word.
- **The last placement is forced.** With four friends and four spots, level 4's fourth request has one free spot, and `spotNear` only considers free spots, so any drop near the island lands it correctly. Level 5's second pair has two free spots; when both are side spots, either friend fits either spot. No decision is left in those requests.
- **The level-2 hint points at the arrows even after she has turned the hider into view** (she tapped two visible friends while the hider was showing); it should ring the hider then.
- **Level 4 never turns.** Positions in level 4 are always from the starting view, so it practises the words but not the turned world; only level 5 ties turning to the words. This is acceptable for its band and is noted so a builder does not assume otherwise.
- Small: `LEVELS` lists `lap` though `bands` omits it (AGENTS: list only supported bands); `hint()` repeats its `if (this.hinting) return` guard.

Layout is fine: the view's design area is 1024 wide in every orientation, so the arrows at the centre ±400 stay on screen; tiles are 128 units, friends' hit circles about 168 across.

## Similar games

| Reference | What its progression does | What Puddle Island must not take |
| --- | --- | --- |
| [Captain Toad: Treasure Tracker](https://en.wikipedia.org/wiki/Captain_Toad:_Treasure_Tracker) (Nintendo) | Small diorama levels you rotate; three hidden gems per course sit in alcoves seen only from some angles ([Nintendo listing](https://www.nintendo.com/au/games/nintendo-switch/captain-toad-treasure-tracker)); later courses hide more and need more turning | Timed bonus challenges and lives |
| [Fez](https://www.giantbomb.com/games/3030-24768/) (Polytron) | A 2D world turned in 90° steps reveals that a flat view is one of four sides; ledges that look apart join from another side | Obscure codes and long memory puzzles |
| [Monument Valley](https://www.pocketgamer.com/articles/058349/r/) (ustwo) | Paths connect only from one viewpoint; turning a piece joins them | Its Escher paradoxes are well past the school band |
| Piaget and Inhelder's [three mountains task](https://en.wikipedia.org/wiki/Three_mountain_problem) | Choose the picture that shows what a doll sees from its side; Borke (1975) found 3–4-year-olds succeed with familiar toys instead of mountains | Using it as a test; it is a level shape here |
| Flavell's Level 1 / Level 2 [perspective taking](https://en.wikipedia.org/wiki/Perspective-taking) | Level 1, *whether* someone can see a thing, is reliable around 2–2½ ([Moll & Tomasello 2006](https://dornsife.usc.edu/mid-la/wp-content/uploads/sites/317/2023/11/Moll-Tomasello06a.pdf)); Level 2, *how it looks* from there, usually around 4–5 on classic tasks, earlier on non-verbal ones ([Moll & Meltzoff 2011](https://dornsife.usc.edu/aba/wp-content/uploads/sites/130/2023/10/Moll_Meltzoff_2011a.pdf)) | — |
| Sunburst's *Building Perspective* (notebook: [Skyline View](../IDEAS.md#elementary-reasoning-classics)) | Towers seen from front and side; choose the view from above | Scored test framing |
| Bailey's Book House, *Edmo and Houdini* (notebook: Doghouse Directions) | Tap a word and the puppy goes in, out, on, off or under | — (a word-ownership question, below) |
| Wii Party U's *Lost-and-Found Square* (notebook: Where Am I?) | Describe where someone stands so another finds them | Competitive racing |
| Hide-and-seek around a chair (the game's `offScreen`) | The body version of every level | — |

**Standard.** [CCSS K.G.A.1](https://thecorestandards.org/Math/Content/K/G/A/1/): describe the relative positions of objects using above, below, beside, in front of, behind and next to. The game covers in front of, behind and next to (beside); above and below are Stamp Studio's ([dive](stamp-studio.md)). Search summaries for the developmental sources were read this session; the papers were not read in full.

## What makes sense here

The game's distinct asset is a world she turns, with a tree that really hides. Every other position game in the island (Stamp Studio's relations, Photo Safari's requests, Adventure Walk's path words) uses a fixed picture. So the ladder grows along perspective taking, in the order the research gives: things still exist when hidden (1–3, built), position words from her own side (4–5, built), **whether someone else can see a thing** (Level 1, new 6), **how it looks from where they stand** (Level 2, new 7), and **a view from above** (a definition). The study reservations already point here: the networks study's [NC6 *Who can see it?*](subjects/networks-citizenship.md) and the area-volume-space study's [Skyline View](subjects/area-volume-space.md).

More words (in, on, under) would make the game a vocabulary drill and collide with Adventure Walk's "under", so they are a decision, not a level. *Warm-and-Cool Dig* (in the [notebook](../IDEAS.md)) is about near/far evidence on a map, not viewpoint: its home is Treasure Map, not here.

## Experience and presentation

- **First unsupported action:** at level 1 the arrows and the tree both turn the island; a toddler who taps a friend in front gets a poke and an animal sound, never a miss.
- **Touch acknowledgment and consequence:** a turn whooshes for 0.55 s and whoever comes out from behind the crown hops and makes its sound; a correct drop pops; a correct find bursts stars. The consequence of a turn (who appears) is the lesson, so the turn should stay slow.
- **Variety:** seven friends, four spots, the hider changing each scene; content is thin beyond that (one tree, one island). Fresh landmarks (a hut, a haystack) are possible later but need every `around.*` line slotted for the hiding thing, which keeps them on device speech since V1 renders slot-free lines only; not in this dive's ready slices.
- **Cognitive versus motor:** the challenge is reasoning; the drops snap to the nearest free spot within 150 units, so precision is not the test.
- **Supported ending and replay:** the round ends with a full spin and "Everyone came out to play!" Levels 6–7 below end the same way.
- **Co-play:** the `coplayHint` (a toy behind a cup) is right for 1–3. At 6–7, a grown-up sits on the opposite side of the iPad from her: "Can I see the duck from here?" is the same question with a real second viewer.
- **Art/feel example:** at level 1, let the hider's tail or ear tips peek out at the trunk's edge while it is behind the crown (a small `Graphics` shape drawn at the trunk's side with the hider's colour from `CRITTERS[name]`, depth just below the tree), so a toddler has a reason to turn. A person should judge whether it helps or spoils the surprise.
- **Needs a person:** whether toddlers turn by the arrows or the tree; whether "next to" on either side reads as right; whether the turn's speed is calm; whether a four-year-old can pick another's view (level 7) on a screen.

## Proposed ladder

### Fresh content inside existing levels

- **Every request a real choice (levels 4–5).** Each placement request leaves at least one free spot that does not fit it. Level 4's shore holds three friends (three requests, all three words), so the last request is never the only spot left; level 5's first pair always includes *behind*, so the half turn always brings someone to the front, and each pair leaves a wrong spot for each friend. Rule tests: across seeds, every request has a fitting and a non-fitting free spot; all three words appear at level 4; a level-5 first pair includes behind. Cost: logic only; the bot is unchanged.
- **Level 5 asks instead of tells.** Before the half turn: "When we look from the other side, who will be in front?" She taps a friend on the island; it is a **prediction, never a miss**. Then the island turns and the friend now in front cheers; if she picked another, the pet says "The one behind came round to the front!" The plan's description already ends "who is in front now?". Rule test: the friend in front after the turn is the one who was behind before it. Cost: one tap state, two slot lines, the bot taps the right friend.
- **Truthful support.** Level-scoped how-to steps; the level-2 hint rings the hider when it is in view, the arrows when it is not.

### New levels on top

**6 *Who can't see it?*** (pre-K and school; NC6). The pet stands a picture card on one spot (a sticker drawn from the sticker art, propped on a small easel). Two or three friends stand on other spots, always one directly across the tree from the picture. "Who can't see the picture?" She taps a friend. A right tap turns the island until that friend is at the front, her view now matches theirs, and the picture is hidden behind the crown: "I can't see it! The tree is in the way." A wrong tap is a miss, and the island also turns to that friend's side so she sees the picture plainly: "I can see it!" Two misses ring the friend across. Three scenes; when the picture stands behind the tree from her side, she cannot see it either, and the pet says so. Decides: whether the tree is between a viewer and a thing, in the turned world. Rule tests: exactly one friend is across from the picture; every scene's answer is that friend; the picture's spot varies across all four facings over a round. Couplings: the bot taps the friend across; a turn-to-viewer helper (`spin` to that friend's spot) reused by 7.

With four spots the only blocked viewer is the one across, which is right for this level (one rule, seen many ways). A school version with a second hiding thing (a rock on the ring, so more than one friend can be blocked and she taps every one) needs sight lines beyond `whereIs`; it stays a sketch.

**7 *What does the duck see?*** (pre-K top and school; Level 2). A named friend stands on one spot. Three picture cards show the island from three sides, rendered by drawing the same scene at another `spin.angle` into a `RenderTexture` (as Puzzle Pals does). The scene needs asymmetric marks so each side differs: the apples are already uneven; add a swing on one branch and the four coloured flowers. "Which picture shows what the duck sees?" A wrong card is a miss, and the island turns to that card's side: "That's what the cow sees!" Two misses ring the right card; a right card turns the island to the duck's side so the picture and the island match. Three scenes. Rule tests: the three cards come from three different sides, one of them the named friend's; no two cards are alike (a side's marks differ). Couplings: render textures freed in `destroy()`, the bot taps the right card.

### Younger-band openings

Toddler already starts at level 1. A **lap** entry (any tap anywhere turns the island and the friend pops out on its own, no second tap) is plausible at her age now, but Peekaboo Barn already gives lap object permanence; whether a second lap peekaboo game is wanted is a decision.

### Easier entries and levels between existing ones

Level 6 suits preschool by the research (Level 1 at about 2½), but preschool's window is 2–4; putting 6 into it needs a preschool `order` such as `[2, 3, 4, 6]`. A decision; slice 3 builds 6 for pre-K and school only.

### Definitions (docs only)

- **From the sky** (school): which of three top-down maps shows the island from above (friends as coloured dots around the tree's circle), a bridge from side views to Treasure Map's maps. The block-tower **Skyline View** from the area-volume-space study (towers from the front and the side, choose the top view) is costed separately and larger (M: drawn block plots, a new scene); define the island version first and judge the tower version after it.

### Left out on purpose

- Monument Valley-style paths that join from one viewpoint: past the school band's needs and a large new interaction.
- Left and right from a friend's facing (about 7–8): a sketch only; it splits "next to" and would add words to `WHERE_WORDS`.
- More landmarks than the tree: possible fresh content later; every line would need a slot.
- Timers, scores for fewest turns, or a lives count on wrong drops.

## Decisions for the developer

1. **Level 6 in preschool?** Default: no; 6 builds for pre-K and school. Alternative: a preschool `order` `[2, 3, 4, 6]`.
2. **Doghouse Directions (in, on, under, out, off):** a Peekaround mode or not? "under" is Adventure Walk's path word, and its test forbids any Peekaround position word inside its phrases, so it would need a separate word set or a change in which game owns "under". Default: leave it out.
3. **A lap opening:** wanted beside Peekaboo Barn? Default: no, until an observation of her with level 1 says it is needed.

## Build slices, in order

1. **Truthful support and real choices** (existing-game fix tier: typecheck, rule tests for every request leaving a wrong spot, all three words at 4, behind in level 5's first pair and the level-2 hint target, one filtered regression play at levels 2 and 5, `fingerdemo` at 5): level-scoped how-to, the level-2 hint on the hider when visible, level 4's three shore friends, level 5's pair rule so the turn always names someone, drop `lap` from `LEVELS` and the repeated guard.
2. **Level 5 *Who will be in front?*** (existing level, new tap: typecheck, rule tests, one play of level 5 with one wrong prediction (no miss) and one right, `fingerdemo` at 5): after slice 1.
3. **Level 6 *Who can't see it?*** (new-interaction tier: typecheck, rule tests, one play of level 6 with one wrong friend (the turn shows it can see), a second for the glow, then the right friend, one portrait screenshot with the picture card, `fingerdemo` at 6): pre-K max 6, school max 6; after slice 1.
4. **Level 7 *What does the duck see?*** (new-interaction tier: typecheck, rule tests, one play of level 7 with one wrong card and its turn, a second for the glow, then the right card, one portrait screenshot of the three cards, `fingerdemo` at 7, one build for the render textures): after slice 3 (shares the turn-to-viewer helper); pre-K and school max 7.
5. **Define *From the sky*** (docs only).

Gated: level 6 for preschool (decision 1), Doghouse Directions (decision 2), a lap opening (decision 3), the two-obstacle *Who can't see it?*, left/right from a friend's facing, and the block-tower Skyline View (sketches).

## What was built in this session

Nothing: research and ideation only. Links and `git diff --check` ran.
