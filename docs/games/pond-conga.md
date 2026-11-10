# Pond Conga

<!-- generated: from src/games/pond-conga; edit the text below the end mark (npm run game-docs) -->

**ID:** `pond-conga` · **Land:** Lantern Lake · **Ages:** school–grown-up · **Challenge:** hands · **Plays by:** touch and controller, upright on a phone · **Ghost finger:** yes

**Skills:** planning, steering, sequencing

| Band | Levels, easiest first |
| --- | --- |
| school | 10–11 |
| grown-up | 8, 1, 2, 3, 4, 5, 6, 7, 9 |

| Level | Plays like |
| --- | --- |
| 1 | A small open pond: five crumbs, no lily pads |
| 2 | A few lily pads to steer round, six crumbs |
| 3 | More lily pads and eight crumbs |
| 4 | A bigger pond, ten crumbs and a longer line |
| 5 | Twelve crumbs among sixteen lily pads |
| 6 | A crowded pond: twenty lily pads, twelve crumbs |
| 7 | Choose the order: three bites show at once, nine in all |
| 8 | Step by step: the line waits, one step a swipe |
| 9 | A long conga: seven ducklings from the start, so the tail is in the way |
| 10 | A little pond, one step at a time |
| 11 | Round the lily pads, one step at a time |

<!-- end generated -->

**Starts as:** a line of ducklings paddles on at a steady pace and is steered to each helping of duck food (peas, sweetcorn or oats) in turn, round lily pads: touch to set off, swipe anywhere to turn (Hint and Start over are buttons); a controller plays it too

**Grows into:** eleven levels (grown-up 1 to 9, school 10 and 11) from a small open pond with five crumbs to a crowded one with twelve, then level 7 with nine bites in three groups of three eaten in any order, then level 8, Step by step, where nothing moves between inputs and each swipe, touch, D-pad press or button is one step (a new player starts there), then level 9, A long conga, which starts seven ducklings long in an L so the tail is in the way; the two school levels (about 6 and up, no gate; home stays Lantern Lake, Wonder Woods lists it by subject) are step-by-step 6 by 4 and 7 by 4 ponds at 100-unit cells where a bump is a refused step and the line stays put; at the grown-up levels a bump turns the whole line about and counts a step, so nothing can be lost or stuck; an exact fewest steps for every pond; one puzzle-shelf course scored in steps against par (Crumb Trail)

## Design notes

*grown-up couch play · after Snake and Neopets' Meerca Chase, made gentle.* A line of ducklings paddles across a pond at a steady, easy pace, and the stick or D-pad turns the leader to each helping of duck food (peas, sweetcorn or oats, one kind a pond) in turn. Eating a crumb adds a duckling; only the next crumb (and a faint look at the one after, so a route can be planned) is shown. **Controls:** the stick or D-pad turns (a turn is made at the next step, two can wait in line, a turn straight back is ignored); the bottom button, or any turn, sets off, because nothing moves before somebody is ready. A **bump** into a lily pad, the bank or the line itself is a **bonk**: nothing is lost, the whole conga turns about (the old tail leads), there is a breather of a second to choose, and the bonk counts as one more step. Because it turns about, the line can never box itself in, and there is no game over.

**Duck food and the bank.** Each round has a look from `pondLook` (a clone of the round's RNG, so the pond itself is unchanged): one food kind, peas, sweetcorn or oats (`FOODS`, drawn by `foodArt`), and one reed bank edge (code-drawn reeds and cattails in the shallows margin, decorative only). A course's ponds take the next food in turn (`foodAt`). The tally reads "0 of 5 peas", "bits of corn" or "bites of oats", and the voice says "Yum, peas!" and so on; nothing mentions bread. Level plans, pars and the Crumb Trail course are unchanged (the course name and code names keep "crumb").

**Score and help.** Every step of the leader counts, and so does every bonk, so the score is steps over the fewest. The fewest is exact (no route can be shorter than the lily-pad-aware distances between the crumbs added up, and a pond is used only if a route with no bonk at all gets there), so a perfect run is a real thing to reach, and a bonk or a wasted turn each cost steps. The pause menu has **Show a hint** (yellow dots along the next few steps to the crumb, kept up as the line moves; marks a challenge run as helped) and **Start this pond again** (the line goes back to the start, steps so far keep counting). The pace is constant (2.4 to 3.4 steps a second, 3 on the course) so what makes a pond harder is the number of crumbs and lily pads, never speed.

**The rules** are in `logic.ts`: `step` (the whole rule of play), `distances` and `lowerBound`, `legRoutes`/`solveRoute` (bonk-free fewest-step routes with the line's own body simulated), `hintPath`, `parsePond`/`pictureOf`, and `makePond`, which places lily pads (the open water stays one piece, with a clear runway in front of the start), then each crumb at a distance from the one before within the level's range, keeping a pond only if a route as short as the crumbs allow exists. Six levels: 11 by 7 with five crumbs and no pads at 2.4 steps a second, then 13 by 9 with 4, then 8 pads, then 15 by 9 with 12, 16 and 20 pads (ten, twelve and twelve crumbs); **level 7, Choose the order** (added 2026-11-04), 13 by 9 with 6 pads at 2.8 steps a second and nine bites in three groups of three. Rule tests assert exactly that for every level on a dozen seeds each (par equals the lower bound and a bonk-free route reaches it), that a hint always leads on from wherever the line has wandered, and that a bonk keeps every duckling.

**Level 7, Choose the order.** A group of three bites shows together at full strength (no faint look) and she eats them in any order; the next group appears when the group is eaten. Par is the fewest steps over every order of every group (`restBound`/`lowerBound`, a DP over each group's end bite), a bonk-free route meets it, and generation rejects ponds where in some group every order ties, so the choice matters. A longer order is only more steps, never a miss; a bonk is still a miss. **Hint** dots lead to a bite that starts a best order from where the line is. The demonstration pond keeps whole groups (one group of three). Not on the couch trip (levels 1 to 5; Crumb Trail par 259 unchanged). Spoken lines `conga.order` and `conga.order-touch`; the how-to card keeps a neutral goal, the in-turn step for levels 1 to 6 and a level-7 step.

**Level 8, Step by step** (added 2026-11-04; 11 by 7, 2 lily pads, 5 bites, `paced: false`). There is no pace: the line waits, and each input is one step. A swipe stroke is one step that way, a touch (a lift without a swipe) is one step straight on, and each D-pad press or the action button is one step; a step straight back does nothing, and two steps can wait in line. A step glides in 0.18 s (`STEP_GLIDE`, `stepDue`). A bump is a miss as before, with no breather; hint dots are as before. `LEVELS.grownup` is 1 to 8 with `order` `[8, 1, 2, 3, 4, 5, 6, 7]` and `entryLevels: [8]`, so a new player starts here and no saved level or pin moves. Not on the couch trip (levels 1 to 5; Crumb Trail unchanged). Voice `conga.steps` and `conga.steps-touch`; the how-to card's "paddles on by itself" and swipe-to-turn steps now stop at level 7, level 7 has its own step, and two steps are for level 8. The demonstration taps or makes one short stroke per step; the couch bot (autoplay) presses once per step.

**Levels 10 and 11, the school opening** (added 2026-11-04; `school` joins `bands`, `LEVELS.school` 10 to 11, `entryLevels` `[8, 10, 11]`; about 6 and up, no gate; home stays Lantern Lake and Wonder Woods lists it by subject). Both are step-by-step ponds (`paced: false`, as level 8) on four rows at 100-unit cells with Hint and Start over buttons 210 by 100 beside the pond: **level 10** is 6 by 4, no pads, 3 bites; **level 11** is 7 by 4, 2 pads, 4 bites. A tap steps one cell toward the touch (a tap on the leader or straight back does nothing) and a swipe is one step, so she can tap or swipe. A bump at school is a **refused step**: the line stays where it is, there is a boing, the leader shakes with a small puff on the side that was refused, and it counts as a miss (`conga.bonk-school`, said in full once a pond). The second bump on a pond shows the hint dots without counting a hint. The line turns about only when every way but back is shut. Spoken start `conga.go-school` (through `ctx.instruct`); the new lines are on device speech until the next voice render. The how-to card has steps scoped to levels 10 and 11 and the grown-up level-9 steps now end at 9. Co-play: take turns, one says which way and the other swipes or taps; off screen, a duckling walk. The bot (`autotouch`) steps along the hint path and never bumps. Not on the couch trip or a course; the school rules read `ctx.band`, which couch play never sets to school.

**Swipe anywhere** (2026-11-10, after a phone playtest note, [PR #1463](https://github.com/rjdunlap/neo/pull/1463)). On an upright phone the pond sits in the top third, so the swipe layer covers the whole view (`pondTouchLayout`'s `swipe`): a thumb steers from the empty space below the pond without covering the ducklings. The round's home, help and pet, and Hint and Start over, sit above it and keep their taps. A stroke that wanders more than a third of `SWIPE` without making a swipe is neither a turn nor a tap (it used to be a step straight on). A school tap-toward still counts only on the pond.

**Couch.** A trip stop (face-off `twin`: each plays their own seeded pond, scored in steps over the fewest) plays one pond at levels 1 to 5. One puzzle-shelf course of frozen ponds, **Crumb Trail** (four ponds of 6, 8, 10 and 12 crumbs among 3, 8, 13 and 17 lily pads; par 34 + 50 + 77 + 98 = 259), with **Watch the best routes** replaying each pond's fewest-steps way; `course.ts` holds them with a `version`, and tests assert each parses to a route as short as its crumbs allow. It opens in the last tier of trips and is on the shelf from the start. Not built: a timer (none is wanted), a bonk variant that costs nothing, two lines on one pond for a face-off, a wrapping pond.
