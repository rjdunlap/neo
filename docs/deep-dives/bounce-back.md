# Bounce Back deep dive

*ID `bounce-back` · bands lap, toddler, preschool, pre-K · levels 1–5 on 2026-10-12 · session `codex/bounce-back-deep-dive`*

## The game today

The fun action is sliding a big paddle to meet a slow, giggly ball and hearing the pet count each bounce. The learning is visual tracking, predicting where a moving thing will arrive, hand-eye timing, turn-taking and counting. There is no score and no loss. Source baseline: `origin/main` `f2f3489`. Inspected [implementation](../../src/games/bounce-back/index.ts), [rules](../../src/games/bounce-back/logic.ts), [rule tests](../../src/games/bounce-back/logic.test.ts), [GAMES.md](../GAMES.md#bounce-back), the [how-to](../../src/content/howto.ts), the [voice script](../../src/content/voice-script.ts) (`bounce.*`) and the [couch catalog](../../src/couch/catalog.ts). This is a source audit, not a playtest.

Band windows are the actual adaptive ranges: lap 1, toddler 1–2, preschool 2–4, pre-K 3–5. There is no school window.

| Level / plan | Bands | Ball speed · paddle | First round and decision | Response, help and completion |
| --- | --- | --- | --- | --- |
| 1 · Solo (goal 3) | Lap, toddler | 230 · 300 | Slide the right paddle under the ball; if no finger is down, the paddle drifts toward the ball on its own at 220 units/s | Goal of 3 hits (the pet's count too). Ball past her paddle is a miss with "Whoops"; two misses in a row start a hint |
| 2 · Rally (goal 5) | Toddler, preschool | 280 · 240 | Same, with no drift help | Same. Uses the `bounce.solo` line, which does not say the number |
| 3 · Together (goal 8) | Preschool, pre-K | 300 · 220 | A grown-up may touch the left half; the pet plays the left paddle until a left finger moves and again after 5 idle seconds | Same miss and hint rule. The left side is ignored on every other level |
| 4 · Stars (goal 5) | Pre-K | 320 · 210 | A star appears; the ball passing within 78 units collects it; the rally count is not used | Stars persist across misses. Hint only marks where the ball will arrive; it does not teach aiming |
| 5 · Count (goal 10) | Pre-K | 340 · 200 | Count a rally of 10 aloud with the pet | A miss resets the rally to 0 |

### How it plays, from the source

- Both paddles' hits add to one `rally` count, so a goal of 8 is four of hers. `count` is spoken on each hit.
- The paddle bounce angles the ball by where it strikes (offset × 0.85 rad), the middle returning it straight; the pet centres on the ball, so its return is always straight and the child alone aims. Stars at 4 are therefore only reachable by sliding the paddle off-centre.
- A hint (`hinting`) is set after two misses in a row, counted once per round, slows the ball to 75 % and shows a ring where it will arrive. It never turns off again for that round.
- Misses are balls past her paddle only. The pet never misses and the ball never leaves the table on her side without a gentle boing.
- The ghost finger (`autotouch`) and the couch bot (`autoplay`) both use `predictY`/`paddleTarget`; the stars bot slides the paddle so the bounce goes through the star, and a rule test asserts it reaches more than 85 % of random stars.
- Couch: tier 1 trip game, `play: 'together'`, face-off `team` (no winner), trip level 3, demo level 2. Both players use sticks; the pet takes seat 2.

### Known gaps and person checks

- The how-to is nearly true but thin: step 1 has no range (it is true at every level), but level 2 reads as level 1 and the finish line ("when the rally reaches the goal") is false at level 4, where stars end the round. Put the real goal on each card.
- The miss rule resets progress on levels 2, 3 and 5: a miss at nine bounces of ten sends her back to zero. Stars do not reset. This is the only place in the game where a mistake takes something away, and the rules ask that mistakes teach. See the decisions.
- The hint never wears off and changes the ball's speed, so one hint slows the rest of the round; a second hint cannot happen (hints stay at 1).
- The hint at 4 shows where the ball arrives but nothing about where the star is relative to the paddle.
- `rally` counts the pet's hits, so "count a rally of 10" at level 5 is five bounces by her.
- Rounds are short at the top: level 5 at 340 units/s takes about 25 seconds with no misses.
- Level 1's helper drift stops the moment a finger is down, which is right, but a lap child touching and dragging slowly gets no help. Person check.
- Not reproduced: a second finger on the right side while one is held; both fingers go to the same target. Level 3 touches on the left from a child's hand look like a grown-up's, and the pet leaves.
- Person checks already on the roadmap: whether lap/toddler children enjoy it, and two real hands with the pet taking over.

## Similar games

Research opened or searched pages on 2026-10-12; nothing here is from hands-on play. Borrow and leave-out columns are design judgments.

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Pong](https://en.wikipedia.org/wiki/Atari_Pong) (Atari, 1972) | Arcade, two paddles | No levels: the ball speeds up and the paddle is split into eight segments so the hit place changes the return angle | The angle-by-contact rule is already here and is the aiming skill | Scoring against an opponent, the ball speeding until someone misses |
| [Breakout](https://en.wikipedia.org/wiki/Breakout_(video_game)) and [Arkanoid](https://pixelatedarcade.com/games/arkanoid) | Single paddle and bricks | Breakout speeds the ball up as bricks clear and shrinks the paddle when the top is reached; Arkanoid adds 33 layouts, tougher bricks and power-ups caught on the paddle | Layouts as authored content, a target to aim at (stars are the seed), catching a falling thing on the paddle | Shrinking the paddle as a penalty, lives, a boss, ever-faster balls |
| [Kaboom!](https://videogamegeek.com/videogame/69094/kaboom-1981) | Catch with buckets | Eight waves; bombs get faster and the Mad Bomber more erratic; losing a bucket drops you back a wave | The "basket width is the handicap" idea (already in IDEAS) | Lives, speeding to 13 a second, losing buckets |
| [Bluey Keepy Uppy](https://blueypedia.fandom.com/wiki/Keepy_Uppy) and its [boardgame](https://camp.com/products/bluey-keepy-uppy-game) | Keep a balloon up | The toy has players bop a balloon with character paddles and lose a token when it reaches their hedge; the episode raises difficulty with fans | A floaty, slow, wobbling thing kept up together; a "wind" seat for the second player | Elimination by tokens; there is no app with levels, so this is inspiration only |
| [Alleyway](https://en.wikipedia.org/wiki/Alleyway_(gameboy)) | Handheld Breakout | The paddle's movement and contact point steer the ball | Reading the paddle's speed as a steer later, if ever | Hidden physics a toddler cannot see |
| [Special Olympics Young Athletes](https://media.specialolympics.org/resources/community-building/young-athletes/lesson-plans/YA-Lesson-Plans-2to4-Abridged.pdf) | Physical play guide, ages 2–7 | Starts with slow bubbles she can follow, then rolling, trapping, catching; sessions can be taken in any order | Slow first targets, turn-taking as a goal, rolling before throwing | Group-lesson timing; it is not a screen design |

Developmental source: the Young Athletes guide lists visual tracking, eye-hand coordination, timing, following directions and taking turns as the skills of catching and trapping. It is physical-play guidance, not a claim about what a screen game proves. Catching relies on predicting a flight path and meeting it, which is what the arrival ring and the stars level ask.

## What makes sense here

Keep the paddle, the ball and the pet. The game grows through what the ball does and what she aims at, never through speed or scarcity: Kaboom!'s waves, Breakout's shrinking paddle and Pong's endless acceleration are all out. The long arc is: follow the ball (lap), meet it (toddler), rally together (preschool), aim it (pre-K), then reason about where to send it (a possible early-school step). Younger entries need only one level 1 variation, not a new engine. A softer ball is more important than a harder one.

## Proposed ladder

### Fresh content inside existing levels

- **Courts** (from IDEAS): a beach with a driftwood net, a pond with lily-pad stars, snow. Only drawing and a spoken name change, no rules.
- **Balls with a voice**: beach ball, balloon, a duckling that quacks on each hit; sounds are `sfx` voices and the sticker seed stays pinned.
- **Pet-specific returns**: the pet's return is straight today. A little variety (a gentle lob angle up to 0.3 rad on levels 3 and 5) makes the pet less predictable without making it fail; the child's paddle must still be able to meet every ball.
- **Gentler resets**: a miss does not zero the rally (see decisions). Count the best run as "so far".
- **Counting by hers**: at level 5 count only her bounces ("your bounces") or speak a "that's 5!" at the halfway point.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 6 | Bounce to a color | Pre-K, school | Left wall has three color zones; the pet says "to the red!" | Where on the paddle to hit to send the ball to the called zone | A bounce to another zone is a free try with the zone lit; no miss. Hint: the paddle end that sends it there glows | Every called zone is reachable from every arrival height under the paddle bounce rule; zones never overlap the pet's paddle | New zones art, voice for color names, bot extends `paddleTarget` to a zone; couch cannot show it without a catalog line |
| 7 | Two balls | School | Two balls of different size cross at different times | Which to meet first when both come toward her | A missed ball returns after a pause; hint slows one | A fair schedule: never two balls arriving within the paddle's reach time; a solver finds a path for each seed | A second ball object, serve schedule, bot changes; new rule module |
| 8 | Make a pattern | School | The pet asks for "high, low, high" | Hit the ball to the top or bottom third in order | Wrong order is shown again; no miss | Sequence generation is reachable; the paddle length fits the zone | Needs a decision on school scope and a zone drawing |

These are proposals. Level 6 is the strongest: it builds directly on stars and `paddleBounce`. 7 and 8 stretch the age and need decisions.

### Versus play for older kids and grown-ups (proposed, the developer's direction of 2026-10-12)

Scoring a goal against an opponent is welcome here. Keep the rest of the rules: no lives, no game-over screen, no round-ending timer, a sticker for finishing, and a loss is a finished round, not a failure.

- **Level 7, Goal** (school window): a goal gap behind the pet's paddle; she scores by sending the ball through it. The pet is a keeper with a set reaction speed (its skill is a plan field, so a test can pin it), and the pet can also score on her goal. First to 5 ends the round; a win and a loss both finish and give a sticker, and the speech is "good game" either way. Misses on her side are goals against, not adaptation misses; adaptation reads the pet's skill and the margin instead (decision below).
- **Level 8, Rally to win** (school): a point is won when the other side fails to return; the ball speeds a little after each return up to a cap, then resets after a point. First to 7.
- **Couch face-off (grown-ups):** a `GROWNUP_GAMES` or couch-only versus mode, two paddles on two controllers, goals on both ends, first to 7, seeded serves so it is fair. The pet is only a fallback seat. This replaces the current team stop for Bounce Back in a face-off trip once built, and needs a new course version.
- **Handicaps, not shame:** paddle length and the pet's skill are set per side so a child and a grown-up can play evenly (the Kaboom! basket-width idea).
- **Rule tests:** a goal is reachable from any arrival height, the pet's reaction speed always leaves a gap a sensible shot can use, serves are seeded and alternate, and the first to N finishes exactly once.

### Younger-band openings

- **Lap and toddler, level 1**: a slower serve (about 180 units/s) and a paddle of 340, so the ball almost always touches; the drift help already exists.
- **Roll-it variant (off screen)**: roll a soft ball between a grown-up and the child; the how-to already suggests it.
- A "Keepy Uppy" floaty mode (IDEAS) would overlap this game's rally; fold it in as the slowest speed with a wobble, not a new game.

### Levels below level 1 (waiting on the level-order decisions)

- **Follow the ball**: the ball rolls across and she only watches; the pet cheers when she touches it.
- **Pat the ball**: any touch near the ball sends it back, no paddle.

### Left out on purpose

Speeding up until someone fails, shrinking paddles, lives, tokens, power-ups that punish, a boss, and a hidden physics beyond the contact angle already taught. Opponent scoring is **not** left out for older players (the developer, 2026-10-12): the rules forbid lives, game-over screens and round-ending timers, not a score against an opponent. See the versus ladder.

## Decisions for the developer

1. **Should a miss reset the rally** on levels 2, 3 and 5? Lean: no; keep the best run so far, or only reset at level 5 as a restart. Needs your call because adaptation uses misses.
2. **Should the hint wear off** after the next bounce, and should it slow the ball? Lean: slow only until the next hit, and let a second hint come after another two misses.
3. **School window:** decided that older play may be competitive. Open: whether levels 6 (bounce to a color), 7 (goal) and 8 (rally to win) all go in the island, and whether a versus loss counts as a miss for adaptation (lean: no; adapt on the pet's skill and the margin).
4. **Is the pet's straight return a fixed rule or a lever?** Lean: lob a little on levels 3 and 5.
5. **Younger entries:** add a level 0 for follow-the-ball? Waiting on the level-order decisions.

**Decided 2026-10-23 (on the developer's delegation):** the couch face-off stays first to five goals; two real people on two controllers is a later device check, not a blocker; the follow-the-ball entry is a new stable level ID placed below level 1 with `order` (no renumbering), and the duel demo may be built.

## Build slices, in order

1. **Truthful words and rule guards (ready; unit tests, one filtered browser play).** Per-level how-to lines and finish text (level 4's finish is stars); a `bounce.rally` line that says the number at level 2; a test that no level's goal is satisfiable in a single pet-only rally; pin the sticker seed results first. Tier: typecheck, the game's rule tests, `BROWSER_SUITE=batch BATCH_ONLY=bounce`.
2. **A gentler miss (after decision 1 and 2).** Rally best-so-far, hint that wears off, and a second hint. Rule tests for the hint lifetime; one `fingerdemo` play at level 5.
3. **Courts and ball voices (ready; art only).** Three courts and balls; screenshot each at portrait; sticker pins.
4. **Pet variety.** Lob returns on 3 and 5 with a test that every return is reachable by the child's paddle.
5. **Level 6 Bounce to a color**, then **level 7 Goal** (zones and the goal gap share one reachability test). Zones, bot, how-to, voice, rule tests; `fingerdemo` at level 6.
6. **Below-level-1 follow-the-ball** (after the level-order decisions).

## What was built in this session

The deep dive itself built nothing (links and `git diff --check` only). Slice 1's words then followed on `codex/bounce-back-words`: per-level how-to steps and finish lines, and a `bounce.rally` line that says the number at level 2. Typecheck and the content and game unit tests passed; no browser play was run (words only).

Slice 2 followed on `codex/bounce-back-gentle-miss` (decisions 1 and 2, taken as the lean): a miss no longer resets the rally, and a hint ends on her next bounce so a later run of two misses can earn another (`afterMiss`/`afterHit` in `logic.ts`, with a rule test). Typecheck, the game's unit tests and `BATCH_ONLY=bounce` (levels 1–5) passed.

Levels 6–8 followed on `codex/bounce-back-levels-6-8` (6 bounce to a color for pre-K and school, 7 goal, 8 first to 7 with a speeding volley, for school): `reachableZones` makes every call fair on tall and wide tables, `keeperSpeed`/`keeperReach` keep a good shot ahead of the keeper, `versusMisses` scores a round by margin. Typecheck, the whole unit suite (1066 tests), `BATCH_ONLY=bounce` (1–8, with two deliberate misses and a hint at each) and `FINGER_ONLY=bounce-back FINGER_LEVELS=5,6,7,8` (clean) passed; not run: portrait screenshots, a real iPad, a child.

The couch face-off followed on `codex/bounce-back-couch-versus`: Bounce Back's catalog entry is now a shared-board face-off (`DUEL_PLAN`, scores `[Player 1's goals, Player 2's]`, most goals wins), with no pet seat and no hints, goals at both ends, a seeded first serve and then a serve to whoever let it by. A together trip is unchanged. Typecheck, the unit suite (1088), `COUCH_ONLY=bounce-back` and the full `BROWSER_SUITE=couch` (on a snapshot, including a Player 1 versus an idle Player 2 stop) passed; not run: two real people with two real controllers, whether five goals is the right length, the intro demo (it still shows a rally).

Levels 10 and 11 (school), skip-counting rallies, followed on `codex/bounce-back-skip-count`: ten bounces counted by twos to 20 and by fives to 50, with the number big on the table (`countFor`, tested). Typecheck, the unit suite (1069), `BOUNCE_FROM=10 BATCH_ONLY=bounce` and `FINGER_LEVELS=10,11` passed; the numeral's tint was changed after a screenshot and not re-seen.

Level 9, colors in order (school), followed on `codex/bounce-back-colors-in-order`: the pet calls the three colors in an order (shown as dots on top, the next one larger), she sends the ball to each in turn, two calls finish the round. The serve angle is chosen so the next color is always one her paddle can reach (`serveAngleFor`, tested at four view sizes); a wrong color is a free try at the same color. Typecheck, the unit suite (1068), `BATCH_ONLY=bounce` (1–9) and `FINGER_LEVELS=9` passed.

Slice 4 followed on `codex/bounce-back-pet-lob`: on the play-together and count rallies the pet holds its paddle a little off the ball (up to 0.3 of half the paddle, about 0.26 rad) so the return is not always straight (`petLob`, with a rule test). Typecheck, the game's unit tests and `BATCH_ONLY=bounce` (1–8) passed.

Slice 3 followed on `codex/bounce-back-courts`: three courts (pond, beach, snow) picked from the round's seeded generator, each with its own ball (smiling ball, beach ball, duckling that quacks on her bounces). Look and sound only; the sticker still draws the original ball. Typecheck, the game's unit tests and `BATCH_ONLY=bounce` passed; the pond and snow courts were seen in screenshots, the beach court was not.
