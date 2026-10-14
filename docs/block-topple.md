# Block Topple — first playable slice (sketch)

Status: **sketch** (written 2026-10-14 from the developer's request for an Angry Birds type game). Nothing is built. Proposed game ID: `block-topple`. It was a backlog row ("Block Topple … could be a Bouncy Launch mode") and is promoted here because the new part is the physics, not a level. Run `scripts/overlap.sh block-topple src/engine/blocks.ts` before building.

"Angry Birds", its birds and its pigs are Rovio's. The idea of slinging a ball at a stack is not protected; the characters and art are not borrowed, and nothing here is an enemy.

## Fun action and learning

Pull a slingshot back, let go, and watch a ball arc into a stack of blocks and tumble it. The learning is **estimating angle and power** (improving a shot from the last arc), **prediction** (where is this tower weak: low or high?) and later **counting what fell**. It differs from [Bouncy Launch](GAMES.md#bouncy-launch) (one pull distance, a flat strip, no structure) and [Block Tower](GAMES.md#block-tower) (stacking by an exact balance rule, no impact).

## What the research gave (opened 2026-10-14)

- Rovio's team tried a swing before settling on the slingshot; the game owed its look, not its rules, to the characters, and physics browser games such as Crush the Castle were its inspiration ([Wikipedia](https://en.wikipedia.org/wiki/Angry_Birds_(video_game)), [Discover](https://www.discovermagazine.com/72-the-bird-watcher-13041)). I found no developer statement of design principles; the "simple, recognisable mechanism" reading is from the sources' wording, not an interview.
- A pull-and-release is a drag, which small children manage; a *flick* is the hard one ([Cooney Center](https://joanganzcooneycenter.org/?p=19607)). So the pull is measured from pointer movement, as Bouncy Launch does, never a fast flick.

## The shared piece: `src/engine/blocks.ts` (new)

A fixed-step (1/120 s), no-randomness 2D simulation of a ball and a few rectangular blocks with gravity, friction and rest, so a shot can be previewed and tested in Node. `ball.ts` has circles and pegs only, so it cannot topple anything. Tests: the same shot gives the same frames; a stack left alone stays up for ten simulated seconds (no jitter collapse); the ball's flight matches the ballistic formula before contact; nothing goes NaN or tunnels through the floor; a hit near the top of a thin tower topples it and the same hit on a wide one does not.

**Decision for the developer, shared with other candidates:** a small hand-written solver, or a library such as planck.js (a Box2D port). Pond Merge, Roll Table and Vine Snip's rope want physics too, so the choice is worth making once. I have **not** measured planck's bundle size, or whether its output is identical in Node and Safari, so a recorded-run test must come first. Because a topple is chaotic, levels are tested for a **window of working shots, not one exact shot**.

## Level rules (`logic.ts`)

A level is data: the sling position, the stack (blocks and targets), obstacles (a hill) and the goal. A test samples a grid of pulls with the engine and requires:

- at least one working pull (the **hint** is its nearest arc), and a **window** of working pulls wide enough that a small hand succeeds without precision (a fraction of the grid, set when the first level is tuned);
- the result does not change when the pull is nudged by two percent (robust to rounding differences between devices);
- a target block is not unreachable behind another block;
- the sling's pull handle and every block face are at least 100 logical units on screen;
- seeded mirroring and block colors never change solvability.

## First-slice levels (pre-K to school; a lap fire-and-watch level is a proposal)

1. **Big and close.** Three large blocks and a bell on top. Pull and release; any ordinary pull rings it. Success is easy, so nothing is lost by exploring.
2. **Farther.** The tower is farther, so power matters; a faint dotted trail remembers the last arc.
3. **Over the hill.** A hill hides the tower, so angle matters; a lob works and a flat shot bounces off.
4. **Where to hit.** A tall thin tower and a wide low one; both hold a fruit. Hitting the thin one high topples it, the wide one needs a low hit. Free experiments are not misses.
5. **Count (school).** Two stacks; after the toppling, count the fruit that fell into the basket and choose the number.

Later, as proposals: a bounce leaf, a seesaw, targets that need two hits, a second ball type (a heavy one), two friends sharing the shots.

## Misses, hints and stickers

- Nothing is harmed: a sleepy friend sits on top and lands on a cushion, giggling. No enemies, no score, no star rating, no shot limit.
- **Default accounting:** a shot that does not touch the tower ("short!" or "over!") is a miss, with the last arc kept so the next pull corrects it. A shot that hits but does not topple is an experiment, never a miss. Two misses show the preview arc (one hint). Level 5's wrong count is counted aloud, once.
- One sticker per completed round, including with help; adaptation as for every game.

## Touch, how-to and audio

- The pull is its own pointer handling (Bouncy Launch's pull as the reference), with `palmOnGlass`, `pointercancel` and leaving the screen dropping the shot. Touch-down feedback is the band stretching at once.
- A how-to card with a ghost-finger `autotouch()` pull, as a touch game requires.
- Voice lines in `voice-script.ts`; `ctx.instruct` repeats "Pull back and let go to knock down the tower". Blocks thump with pitched, pentatonic notes (taller blocks lower); the bell rings. The default music style plays.

## Placement and decisions

- **Land:** Tinker Lab is full (12) and the lands test fails if a land would shrink a target; Bubble Beach (4 games) and Paint Pier (4) have room. Decide by running `landLayout`.
- **Waiting on the developer:** the physics choice above; and whether lap gets a fire-and-watch level (she is about one).

## Build slices

1. **The engine slice:** `src/engine/blocks.ts`, its tests and the sampled-window level checker. Unit tests only; no game registered.
2. **Levels 1–3 as a registered game:** the contract, art, sound, voice, how-to with ghost finger, README row, [GAMES.md](GAMES.md) entry. Tier: typecheck, rule tests, one scripted play (levels 1 and 3, one short shot, one hint), one portrait screenshot, `fingerdemo` filtered.
3. **Levels 4–5.**
4. **Extras as separate slices.** A Bubble Cannon built on the same pull handle is a separate game ([IDEAS](IDEAS.md#candidates)).

Not run: any code. The window sizes and the robustness to rounding are claims until slice 1 tests them.
