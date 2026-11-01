# Pond Conga deep dive

*ID `pond-conga` · band grown-up · levels 1–6 on 2026-11-01 · session `claude/dive-pond-conga`, [PR #1090](https://github.com/rjdunlap/neo/pull/1090)*

## The game today

A gentle grown-up Snake in Lantern Lake, after Snake and Neopets' Meerca Chase. A line of ducklings paddles on at a steady pace and the leader is steered to each crumb of bread in turn; only the next crumb shows, with a faint look at the one after. Eating a crumb adds a duckling. A bump into a lily pad, the bank or the line is a **bonk**: nothing is lost, the whole line turns about (the old tail leads), a 0.9-second breather follows, and the bonk counts as a step. By touch the whole pond is one target: a touch sets off, a swipe turns (two turns can wait in line, straight back is ignored); **Hint** and **Start over** are 64-unit buttons. On the couch the stick or D-pad turns. It is the only arcade game among the grown-up games (the rest are logic puzzles).

| Level | Plan name (`PLANS` in `logic.ts`) | Band window | Pond | What the player decides |
| --- | --- | --- | --- | --- |
| 1 | A small open pond: five crumbs, no lily pads | grown-up | 11 by 7, 0 pads, 5 crumbs, legs 3–7, 2.4 steps a second | When to turn so the line meets the next crumb in the fewest steps |
| 2 | A few lily pads to steer round, six crumbs | grown-up | 13 by 9, 4 pads, 6 crumbs, legs 3–9, 2.6 | The same, round a few pads |
| 3 | More lily pads and eight crumbs | grown-up | 13 by 9, 8 pads, 8 crumbs, legs 4–10, 2.8 | Which side of a pad to pass, using the faint next crumb |
| 4 | A bigger pond, ten crumbs and a longer line | grown-up | 15 by 9, 12 pads, 10 crumbs, legs 4–11, 3.0 | Keeping the growing tail out of the way |
| 5 | Twelve crumbs among sixteen lily pads | grown-up | 15 by 9, 16 pads, 12 crumbs, legs 4–12, 3.2 | The same, crowded |
| 6 | A crowded pond: twenty lily pads, twelve crumbs | grown-up | 15 by 9, 20 pads, 12 crumbs, legs 5–13, 3.4 | The same, more crowded |

**Content pool.** One pond per round, generated from the seed by `makePond`: pads shuffled into the free cells (open water stays one piece, a clear runway ahead of the 3-duckling start), then each crumb at a lily-pad-aware distance within the level's leg range, kept only if a bonk-free route as short as `lowerBound` exists. Pads take a seeded turn and sometimes a flower; the crumb is always bread, the water always plain. So arrangement varies endlessly, but every pond looks the same.

**Accounting.** A bonk is a miss and a hint is help (`ctx.finish({ misses, hints, score })`, score = steps over par). Hints draw yellow dots along `hintPath` until the crumb is eaten.

**Rules and tests (`logic.ts`, `logic.test.ts`, `course.test.ts`).** `step` is the whole rule; `distances`/`lowerBound`; `legRoutes`/`solveRoute` simulate the body; `hintPath` leads on from any state; `parsePond`/`pictureOf`; `firstCrumbs` makes the demo's short pond, relying on "a prefix of a fewest-steps route is one". Tests check par equals the lower bound on a dozen seeds a level, that a hint always leads on, and that a bonk keeps every duckling.

**Couch.** A trip stop (face-off `twin`) at levels 1–5; one frozen course, **Crumb Trail** (level 5, par 259, `version` 1).

**Known gaps.**
- **Pace rises with level** (2.4 to 3.4 steps a second). It is constant inside a pond, but it is the one place the ladder grows by speed.
- **Bonks against adaptation.** `isStruggle` steps a level down at four misses. On a 10–12 crumb pond four bonks are easy for a careful grown-up to make, so two such rounds drop the level even when every crumb was found. Whether that is right for an arcade game is a developer call (below).
- **Bread.** Waterway charities ask people not to feed ducks bread; the game teaches the opposite picture.
- **One look.** Every pond is the same blue with the same bread.
- **Person checks open** ([DEVICE-CHECKS](../DEVICE-CHECKS.md): Pond Conga on an iPad and on the TV): the pace, the bonk's feel, the swipe, the hint dots. The roadmap's step 8b waits for the game to be played before choosing the next relaxing arcade game.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| *Blockade* (1976), *Nibbler* (1982), *Snake Byte* (1982) (from the [IDEAS arcade-classics row](../IDEAS.md#arcade-classics-and-the-animal-crossing-nes-shelf-2026-10-11)) | Arcade | Two-player head-to-head; a snake in a maze; a level ends when the apples are eaten | Snake Byte's "eat them all and the pond is done" is already the rule | A collision ending the run; two snakes trapping each other |
| Nokia *Snake* (1997) and Google's *Snake* doodle game (modes from fan guides: search excerpts, not opened; e.g. [snakegame.net](https://www.snakegame.net/how-to-play-google-snake), [hawkdive](https://www.hawkdive.com/google-snake-everything-you-need-to-know/)) | Casual arcade | Speed and board size options; modes that change one rule each: Portal, Key (a key opens a lock block), Sokoban (push a crate), Twin (head and tail swap on eating), Yin Yang (a mirrored second snake), Peaceful, Slow, many apples | One rule per mode; a **key and gate** pond (later sketch); several food items at once (**level 7**); the slow and peaceful ideas as a **step-by-step** entry (**level 8**) | Speed options as the ladder; game over; Poison; Yin Yang's collide-and-lose |
| Noumenon Games, *Snakebird* (2015) ([Thinky Games](https://thinkygames.com/games/snakebird), [MobyGames](https://www.mobygames.com/game/76361/snakebird/); search excerpts, not opened) | Turn-based puzzle snake | Hand-made levels; fruit in an order that does not trap you; several birds | Turn-based play "with all the time you want" (**level 8**); eating order as the decision (**level 7**); a long body as the obstacle (**level 9**) | Gravity and falling; the very hard late levels |
| Neopets, *Meerca Chase* (named by the game) | Browser arcade | Faster and more obstacles as the score grows | Already borrowed: the gentle chase | Speed-up with score, negative pickups |
| *Cosmic Express* (2017) | Turn-based track puzzle | Pick-up order and paths that must not cross | The order puzzle with a line that blocks itself | Undo-heavy, very hard late boards |
| Waterway duck-feeding advice: Canal & River Trust campaign as reported (search excerpts, not opened; e.g. [Hungerford Town Council](https://hungerford-tc.gov.uk/Contents/ContentItems/4qw1pkfns42kh2dp7epxfe58wa), [Bexley Wildlife](https://www.bexleywildlife.org/20/03/2015/dont-feed-the-ducks-bread/); the Trust's own page is canalrivertrust.org.uk/ducks) | Real-world guidance | — | Peas, sweetcorn and oats instead of bread (**batch 1**) | — |
| Follow-the-leader and a real conga (off-screen) | Physical play | — | An off-screen suggestion for grown-up and child together: a duckling walk where the leader must not cross the line | — |

No learning standard applies to a grown-up arcade game; it is described as a game with a score, and no wording claims a benefit.

## What makes sense here

The game's depth is route planning with a body that follows you. The Snake genre grows by speed and by one-rule modes; Puddle Island keeps the first out and takes the second. Four directions fit:

1. **Fresh look and honest food**, inside existing levels: duck-friendly food, a seeded look per pond.
2. **Choose the order** (level 7): several foods show at once, any order. The decision moves from "how do I get there" to "which first", Snakebird's real question. Pace stays at level 3's 2.8.
3. **Step by step** (level 8, an easier entry placed first): the line moves one step per swipe or press and waits otherwise, so a grown-up who finds real time stressful still has the whole puzzle and the same par. This is the in-game answer to IDEAS' "Game pace" note for this game; a shared pace setting stays a cross-game proposal.
4. **A long conga** (level 9): start long in a smaller pond, so the tail, not the pads, is the obstacle. Pace 2.6.

The long arc: an open pond, then pads, order, then the body as the puzzle; later, one-rule ponds (a key and gate, a culvert) only after the pace and bonk have been judged by a person.

## Experience and presentation

- **First action.** A touch sets the line off and a swipe turns it: no answer needed from anyone. In step-by-step, every swipe moves the line one cell, so the first swipe is already a move.
- **Pleasure and feedback.** Touch-down shows a ring; the turn happens at the next step; a food item pops with "Yum!" and a new duckling joins the tail; a bonk turns the line about with a breather. A cleared pond hops the whole line and bursts stars.
- **Art example (batch 1).** `crumbArt` becomes `foodArt(kind)`: **peas** as three green `circle`s with a white highlight, **sweetcorn** as four yellow rounded kernels, **oats** as a small pale pile of ellipses; one kind per pond, chosen by the seed, so a pond reads as "the pea pond". A strip of code-drawn reeds (thin green strokes with brown cattail ellipses) along one seeded bank edge, `eventMode = 'none'`, outside the pond's open cells.
- **Variety on replay.** Seeded pads, food kind and reed side; level 7 changes which order is best; level 9 changes where the tail ends up.
- **Reasoning versus precision.** Real-time levels mix planning with timing of a swipe; step-by-step separates them, so a slower hand is never the reason for a bonk.
- **Supported ending.** Hint dots to the next item (in level 7: to the item on the best order); Start over keeps counting; there is no game over, so every pond ends with every item eaten.
- **Co-play.** A child can call "peas next!" in level 7 while the grown-up steers; in step-by-step, two people can take swipes in turn. Solo always works.
- **Person questions.** Whether 2.4–3.4 feels relaxing; whether a bonk reads as a bump; whether step-by-step feels like the same game or like a chore; whether four food items at once in level 7 are too many to scan; whether the food art reads at 42–55-unit cells.

## Proposed ladder

### Fresh content inside existing levels

- **Duck-friendly food.** Peas, sweetcorn or oats, one kind per pond by the seed. The voice lines say "food" or the kind: `conga.go`, `conga.go-touch` and `couch.how.pond-conga` lose "bread"; `conga.crumb` gains "Yum, peas!" and similar lines chosen by kind. The how-to card and couch catalog wording, GAMES.md and COUCH-PLAY.md change with it. Code names (`crumbs`) stay; parse legends stay, so Crumb Trail's ponds and `version` do not change. Rule test: the kind is a pure function of the seed and the pond is unchanged by it.
- **A seeded bank.** Reeds along one seeded edge; pads keep their turn and flowers. No effect on the rule.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | Choose the order | grown-up | 13 by 9, 6 pads, 9 items in three groups of three; a group shows together, the next group after the last of it is eaten; 2.8 steps a second | Which of the three to eat first, second, third | A bonk as today. Eating in a longer order is not a miss, only steps. Hint dots go to the first item of the best order from where the line is | `par` equals the minimum over the 6 orders per group of the summed distances, and a bonk-free route reaches it; a hint from any state leads to an item of a best order; a `firstCrumbs` replacement keeps whole groups | `Board.crumbs` becomes groups (or a `group` size on the plan); `lowerBound`, `solveFrom` and `legRoutes` try each order per group; `firstCrumbs` for the demo cuts at a group boundary; three items drawn at full strength, the faint look dropped; `autotouch` follows the route as today; voice: one new instruction line. Not on the couch trip |
| 8 | Step by step | grown-up; placed first by `order` | 11 by 7, 2 pads, 5 items, no pace: the line waits | Each step: which way | A bonk as today, with no breather needed. Hint dots as today | `step` is unchanged; a scripted swipe list reaches par; with no input, the state never changes over many `update` ticks | A `paced: false` flag on the plan; `update` advances only on a queued turn or a set-off touch (one step each, a touch without a swipe goes straight on); `autotouch` makes one stroke per step; the couch path makes one step per D-pad press; its own level-scoped how-to steps; voice: one instruction line. `order` `[8, 1, 2, 3, 4, 5, 6, 7, 9]`, `entryLevels: [8]`. Not on the couch trip |
| 9 | A long conga | grown-up | 11 by 7, 6 pads, 8 items, the line starts at 7 ducklings in an L along the bottom bank; 2.6 steps a second | How to keep the tail clear when doubling back | As today | Every start cell is inside the pond and open; par equals the lower bound or, where the tail forces a detour, `solveRoute` finds a bonk-free route and `par` is its length (the test asserts the exactness claim only where it holds); a hint leads on from any state | `tryPond` takes a start shape and a wider runway; the "par equals lower bound" filter may need to become "par is the solver's best" (a GAMES.md wording change). Not on the couch trip |

### Younger-band openings

None built from this dive. The IDEAS touch-forms note and the Island Bridges and Lantern Lights precedents suggest a docs-only **school opening definition**: step-by-step ponds at 100-unit cells (7 by 5 is 700 by 500 units), three or four items, a home land in Wonder Woods while the grown-up game stays in Lantern Lake (the one-land rule needs that decided), a sticker, level-scoped how-to steps and the accounting (does a bonk count for a 6-year-old). Real-time steering for 6–8 is the open question; step-by-step avoids it. Queued as a `define` line.

### Easier entries and levels between existing ones

Level 8 is the appended easy entry (stable ID, first by `order`, in `entryLevels`). No saved level or pin moves.

### Left out on purpose

- **Faster ponds or a speed setting as the ladder.** Depth first; new levels keep to 2.6–2.8.
- **A shared Game pace setting** (IDEAS' touch-review row): cross-game, belongs to the comfort-options proposal, not this game.
- **A key and gate pond, a culvert (Portal), a crate (Sokoban)**: one-rule ponds that fit, kept as sketches until the person checks say the pace and the bonk feel right.
- **Two lines on one pond for a face-off (Blockade, Yin Yang)**: the couch face-off code plays each player's own board; a shared pond needs its own definition.
- **A wrapping pond**: GAMES lists it as not built; a pond with no bank reads oddly and removes a planning edge.
- **Poison food, game over, speed-up with score, a bonk that ends anything.**

## Decisions for the developer

- **Should a bonk count as a miss for level adaptation?** Today four bonks make a struggling round and two drop a level. Options: keep it; count only hints for adaptation (as Picture Logic counts only hints); or count a bonk as a miss only past a threshold. The couch score (steps over par) is unaffected either way. Added to [Waiting on the developer](../WAITING-ON-DEVELOPER.md).

## Build slices, in order

1. **Duck-friendly food and a seeded bank (batch pond-conga 1).** `foodArt(kind)` with peas, sweetcorn and oats, one kind per pond by seed; reeds on one seeded bank edge; voice, how-to and couch catalog wording without bread; GAMES.md and COUCH-PLAY.md. *Check:* existing-interaction tier: typecheck, the game's rule tests (kind is seeded; pond unchanged; Crumb Trail par unchanged), one filtered regression play at level 1; bot unchanged, no `fingerdemo`; one build for the art.
2. **Level 7 Choose the order (batch pond-conga 2),** after batch 1 (shares the food art and `index.ts` drawing). *Check:* new rule on the existing interaction: typecheck, rule tests (par over orders, group-aware demo pond, hint to a best-order item), one play of level 7 eating a group in a longer order then with one hint, `fingerdemo` at 7, one portrait screenshot of a group of three.
3. **Level 8 Step by step (batch pond-conga 3),** after batch 1 (shares `index.ts`). *Check:* new-interaction tier: typecheck, unit tests (order, entry, no movement without input), one scripted play of level 8 to its sticker with one bonk, one portrait screenshot, `fingerdemo` at 8, `BROWSER_SUITE=couchgames` filtered to Pond Conga (the controller path changes).
4. **Level 9 A long conga (batch pond-conga 4),** after batch 2 (shares the level table and `order`). *Check:* new-level tier: typecheck, rule tests, one play of level 9 with a tail bonk, `fingerdemo` at 9, one portrait screenshot.
5. *Docs only, `define`:* **Define Pond Conga school opening** (above).
6. *Not queued:* key and gate, culvert and crate ponds; a shared-pond duet; any pace change (each waits on the open person checks or its own definition).

## What was built in this session

Nothing: a deep dive session is research and ideation only (links and `git diff --check` ran).
