# Planet Hop: a Bouncy Launch level (definition)

Defined 2026-10-16 for [chunk 27](../ROADMAP.md#chunks), from the [physics-games plan](../PHYSICS-GAMES.md#new-candidates). **Built 2026-10-16:** [PR #466](https://github.com/rjdunlap/neo/pull/466), [proof](../archive/VERIFICATION-2026-10-16.md#2026-10-16--bouncy-launch-12-planet-hop); device/child checks remain open. Planet Hop is a level of Bouncy Launch (`src/games/bouncy-launch/`), not a new game: the pet, the spring and the shown pull of level 6 stay the same, and only the world under them changes.

**Fun action and purpose:** the pet is launched on the island and leaves a flag where it lands. Then it is launched again with the very same pull on a light planet or a heavy one, and she guesses whether this landing will be past the flag or before it. On the light planet the pet floats up and lands far past the flag. On the heavy one it thumps down short. Learning goal: the world's pull changes what the same push does, and less pull means a longer, floatier flight. This is a stated model, not real astronomy: the toy planets pull half as much and twice as much as the island, while the real moon pulls about one sixth as much as Earth. A grown-up how-to note says so. No school standard is cited: NGSS 5-PS2-1 is about gravity pulling *down*, not about stronger and weaker pulls, so it is not this level's anchor.

**Band and ID:** school only, as **level 12**, last in school's order: `school: { min: 4, max: 12, order: [4, 5, 7, 6, 12] }`. IDs 8–11 stay reserved for the [dive's proposed levels](../deep-dives/bouncy-launch.md#new-levels-on-top), so none is renumbered. Pre-K is left for later; adding it would be another `order` entry once school has been played.

**One variable per pair.** She never pulls the spring at this level: each pull is shown, as at level 6. The only thing that changes between the two flights of a pair is the planet. So aiming by pull on another planet, which would make gravity a second variable she controls, is left out. That belongs with decision 3 (Pick a spring) on [Waiting on the developer](../WAITING-ON-DEVELOPER.md), and this level does not wait on it.

**First round:** three pairs.

1. *Home flight.* A shown pull flies on the island (today's sky) and leaves level 6's numbered flag.
2. *Planet flight.* The sky and ground change to a planet. "Same pull on the light planet! Will {pet} land past the flag, or before it?" Two tap regions split the screen at the flag: before it (from the spring to the flag) and past it (from the flag to the far edge). Any tap is routed by `x` against the flag, so both are full-height targets. At 1024 wide the strip runs 380 to 944, and the narrowest region (before a flag at 0.2, plus the spring area) is wider than 100 units.
3. Her pick gets a ring, and the flight proves it. The pet lands, and a line explains what happened: "A light planet pulls less, so the same pull floats farther." or "A heavy planet pulls more, so the same pull lands sooner."

Each round includes both planets, with the third pair's planet seeded. The base landings come from `{0.2, 0.3, 0.4}` of the strip, a different one for each pair in seeded order.

**The model (rules in `logic.ts`):** `reach(pull, gravity = 1)` returns `reach(pull) / gravity`, using the toy values `LIGHT = 0.5` and `HEAVY = 2`. The light planet lands at `2f` (0.4–0.8 of the strip) and the heavy one at `f/2` (0.1–0.2), so every landing is on the strip and at least 0.1 of it (about 56 units) from the flag.

The drawn arc is still a drawing, not `ball.ts` projectile physics: Bouncy Launch's flight is `arc(f)` with height `140 + 260f` and duration `0.7 + 0.6f`. On a planet the duration is multiplied by a stated airtime factor: ×1.5 light (the floaty one), ×0.8 heavy. The landing puff uses the particles' `gravity` option, scaled the same way. The physics plan's "`ball.ts` takes `gravity`" applies to Peg Garden's simulator, not to this game.

**Couplings the build must handle:**
- `planFor` sends every level of 7 or more to Feed the friend, so it becomes a lookup by ID that keeps 1–7 as they are.
- Add a `planet` value to `LaunchMode`.
- `reach`, `PADS`, `padAt` and `padHit` are shared with the Cloud Hopper course (`course.ts`, version 1). The new parameter defaults to 1, and a regression test pins the course's constants and a few landings, so the course `version` does not change.
- Couch play and Cloud Hopper stay on level 3 and are untouched.

**Mistakes, hints and accounting:** a prediction is never a miss, as on level 6. The round always reports `misses: 0`, and a different guess gets the explanation, not a boing. The shell's Show a hint (pause sheet) rings the correct side and says the planet's rule. It counts as one hint for adaptation only. Every round finishes after three pairs, with one sticker. Like the other levels that cannot miss, it steps up on smooth rounds, but it is the top of school's order, so nothing moves.

**Look and sound:** both planets are code-drawn from `palette.ts` through the existing `Backdrop` parameters plus a ground tint:
- **Light planet:** pale lavender ground with a few craters, and a small island far up in the sky.
- **Heavy planet:** warm orange ground with a ringed planet low on the horizon.

Sounds are the existing pentatonic boing and landing, with the landing note a step higher on the light planet and lower on the heavy one. Music is unchanged.

**What the build adds:**
- Voice lines `launch.planet-light`, `launch.planet-heavy`, `launch.planet-why-light` and `launch.planet-why-heavy`, and `{pet}` in the ask.
- `describeLevel(12)`: "The same pull on a light or a heavy planet: past the flag or before it?"
- A how-to `LevelLine` at 12 (12 to 12), including the stated-model note.
- The ghost-finger bot, `autotouch()`, which taps the correct region: past for light, before for heavy.
- The README row, the GAMES.md entry and a VERIFICATION entry.

**Rule tests:**
- Every base landing and planet landing is within 0.05–0.95 of the strip.
- Each planet landing is at least 0.1 from its flag.
- "Past" holds exactly when the planet is light.
- Both planets appear in every seeded round, and the base landings within a round are distinct.
- `reach(p)` equals `reach(p, 1)` for every pull, and the Cloud Hopper pins hold.
- The bot's taps resolve to the correct region.
- `planFor` returns the same plan as before for levels 1–7.

**Check tier:** new level on an existing interaction. That means typecheck, the Bouncy Launch rule and course tests and the registry tests. Then one browser play of level 12 (a different guess, a hint, the finish) with one portrait screenshot, and `fingerdemo` at 12. Run `build` only if shared files change.

**Left out:** aiming on a planet (decision 3's question); real planet names or ratios; moving or extra planets; a planet chooser; orbits, which belong to [Orbit Garden](../ROADMAP.md#space-science-recommendations); a journal entry ("same pull, farther on a light planet" is a later candidate that needs the journal's voice-line test).
