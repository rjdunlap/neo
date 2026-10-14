# Vine Snip — first playable slice (sketch)

Status: **sketch** (written 2026-10-13 from the developer's request for a Cut the Rope type game). Nothing is built. Proposed game ID: `vine-snip`. Review it against the [planning rules](ROADMAP.md#planning-rules) and run `scripts/overlap.sh vine-snip src/engine/rope.ts` before building.

"Cut the Rope" and its monster are ZeptoLab's names and characters, so this game uses its own: fruit hangs from vines in the orchard, and a hungry island friend waits below. The idea of cutting a rope so something falls is not protected; the characters and art are not borrowed.

## Fun action and learning

Snip a vine and watch the fruit fall, or swing, into a friend's mouth. The learning is cause and effect, then prediction (where will it go if I cut here?), then planning an order of cuts, and later counting how many fruit each friend wants. It is the physics cousin of Chain Reaction (place a ramp, then run), not a duplicate: here she acts *during* the run, and the skill is timing and choosing which vine.

## What the research gave (opened 2026-10-13)

- ZeptoLab had built a rope physics engine for an earlier game and reused it; the game began as "deliver an object from A to B" and the candy and monster came later ([Wikipedia](https://en.wikipedia.org/wiki/Cut_the_Rope_(video_game)), [PocketGamer.biz](https://www.pocketgamer.biz/om-nom-and-beyond-zeptolab-a-studio-profile/)). The pocketgamer.biz page names the 325 levels and the baby-modelled character; I found nothing on the rope's integrator, so the Verlet choice below is mine, not the original's.
- Swiping and tapping are the easiest gestures for small children, and a swipe needs a visible cue for where to go ([Cooney Center](https://joanganzcooneycenter.org/?p=19607), [Frontiers](https://pmc.ncbi.nlm.nih.gov/articles/PMC5388766)). So a tap on a vine snips it as well as a swipe.

## The shared piece: `src/engine/rope.ts` (new, used by this game first)

A vine is a short chain of points joined by fixed-length distance constraints (position-based, a few relaxation passes), a fixed timestep (1/120 s) and no randomness, so a run is **deterministic and can be simulated ahead**, like `ball.ts`. The fruit is a heavier end mass. `cutAt(a, b)` takes a swept swipe segment and cuts a vine where the segment crosses it, which makes the cut independent of frame rate. Tests: the same inputs give the same frames; segment lengths stay within a few percent; nothing becomes NaN; a pendulum's period is near its textbook value; a segment crossing a vine cuts it, a segment missing it does not.

## Level rules (`logic.ts`)

A level is data: vine anchors and lengths, fruit, the friend and its mouth rectangle, and later extras. `solve(level)` tries every cut sequence at a coarse time step, using the engine, and returns the working ones. Tests:

- every shipped level is **solvable**, and the first working cut is the **hint**;
- the **window** (how long a cut can be made and still land in the mouth) is at least 0.4 s at every level, so timing never needs a quick finger;
- the mouth is at least 100 logical units wide on screen, the hit band for each vine is at least 100 wide, and a swipe resolves to the **nearest** vine;
- seeded variation (mirroring, fruit kind, friend) never changes solvability.

## First-slice levels (toddler to school)

1. **One vine.** A friend sits under a fruit on a single vine. Tap or swipe the vine and the fruit drops into its mouth; the munch rings a pentatonic note. Nothing else can happen, so nothing is a miss.
2. **Two vines.** The fruit hangs between two vines. Cutting one swings it; cutting the second drops it. Cutting only one is exploration (it keeps swinging and the other vine stays available).
3. **Swing to the side.** The friend is off to one side, so the fruit must be released while it swings over the mouth. The mouth glows softly when the fruit is over it (a cue, not an answer).
4. **Count.** Three fruit hang on three vines over one friend whose sign shows 3 (or 2): cut the right number, hear it counted aloud. A friend who wants 2 and three fruit hanging means she chooses which to leave; the leftover stays hung and is not wasted.
5. **Order.** Two linked vines (the fruit on the lower one hangs from the first): the order of cuts decides where the fruit lands. Two attempts at most are expected.

Later, as proposals: two friends who want different counts, a bubble that lifts, a bounce leaf, a spider that is gently shooed rather than a hazard. No bombs, no spikes and no lives; the fruit is never lost.

## Misses, hints and stickers

- A fruit that misses the mouth drifts down to a leaf and floats back up, the cut vines grow back, and she tries again. Nothing is lost or timed.
- **Default accounting (the developer may overrule; see below):** levels 1–2 and any run before a first judgment count nothing. From level 3, a drop that misses the mouth is one miss with a spoken hint ("wait until it swings over {friend}"); two misses glow the next vine to cut (the glow counts as a hint). Level 4 counts a wrong total once and counts it aloud. Free cutting of a vine that was not decisive (level 2, a second vine still holding) is never a miss.
- One sticker per completed round, including with help. Two smooth rounds step up and two struggling rounds step down, as for every game.

## Touch, how-to and audio

- Custom pointer handling with `palmOnGlass`; `pointercancel` and leaving the screen end the swipe cleanly; the swipe draws a bright trail from the first touch-down. A tap cuts the nearest vine in range.
- A how-to card with a ghost-finger `autotouch()` demonstration (a touch game requires one): swipe across the vine at her level.
- Voice lines in `src/content/voice-script.ts`; `ctx.instruct` repeats "Snip the vine to feed {friend}!". Snip, sproing and munch sounds are synthesized in `src/audio/sfx.ts`; munch notes are pentatonic steps from `notes.ts`. The default music style plays.
- Controller play is not in the first slice (the couch route is separate).

## Placement and decisions

- **Land:** Tinker Lab holds Chain Reaction, Bouncy Launch and the other physics toys, so it is the natural home. It already has 12 games, and the lands test fails if a land would shrink a target, so the first build must check `landLayout` and move the game to Rainbow Meadow if Tinker Lab is full.
- **Waiting on the developer:** whether a timing drop that misses counts as a miss at level 3 (the default above), or stays an unscored experiment like Chain Reaction's runs; and whether a lap-band single-vine level is wanted (she is about one; the engine supports it).

## Build slices

1. **The engine slice:** `src/engine/rope.ts`, its tests and the level solver in `logic.ts`. Unit tests only; no game is registered yet.
2. **Levels 1–3 as a registered game:** `vine-snip` with the contract (`GameModule`), art, sound, voice lines, how-to with ghost finger, README row, [GAMES.md](GAMES.md) entry. Tier: typecheck, rule tests, one scripted play of levels 1 and 3 (one miss, one hint), one portrait screenshot, and `fingerdemo` filtered to it.
3. **Levels 4–5 (count and order).**
4. **Extras as separate slices:** bubble, bounce leaf, two friends.

Not run: any code. The solver, the window width and the engine's determinism are claims until slice 1 tests them.
