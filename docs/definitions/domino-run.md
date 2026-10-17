# Domino Run, levels 1–8 (definition)

Defined 2026-10-17 for [chunk 27](../ROADMAP.md#chunks) (physics games), from the [PHYSICS-GAMES candidate](../PHYSICS-GAMES.md#new-candidates) and its [IDEAS row](../IDEAS.md#candidates). Docs only: no game, ID registration, voice line or save field exists yet. **Ready to build:** every open call below has a default the build can use, and none needs a content reviewer. They are listed in [Open decisions](#open-decisions) and in [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md).

**Fun action and purpose:** stand dominoes in the gaps of a lane, tap the first one and watch the whole line clack down until the last domino rings the bell. If a gap is too wide, or the next domino is too big to push, the chain stops, the pet says why, and the fallen dominoes stand back up so she can fix it. The learning goal is **cause and effect with a spacing rule**: the next domino falls only if the one before can reach it, a taller domino reaches farther, and a domino can push one at most one size bigger than itself. Later levels add a fork that rings two bells and a tray with just enough dominoes. A stalled run is an experiment, never a miss. There is no clock, no move count and nothing to lose.

## References

| Reference | What it shows | What Domino Run takes or rejects |
| --- | --- | --- |
| [Domino Cascade](https://apps.apple.com/us/app/-/id6450254490) (ORSO, store listing, weighted lightly) | Drag blocks and gadgets from the bottom of the screen, tap Play, and the stage clears when the last domino touches the goal; Retry resets a layout | Takes the place-then-play loop and the goal at the end of the line. Rejects the gadget catalogue: one rule per level range |
| [Domino Physics](https://iphoneaddict.fr/apps/jeux/domino-physics-489.html) (Cornbread Games, review page) | Build a path from the start domino to a gold one with as few pieces as possible, with a countdown timer and rewind, on a real 2D physics engine | Takes rewind as "the dominoes stand back up". **Rejects** the countdown and fewest-pieces scoring, and the physics engine: the island's rule is a stated tier-1 model ([PHYSICS-GAMES](../PHYSICS-GAMES.md#three-tiers-of-physics-by-what-the-island-must-build)) |
| [Domino Rally](https://en.wikipedia.org/wiki/Domino_Rally) (Pressman, late 1980s–2000s; Wikipedia, partly unsourced) | A domino-track toy with stairs, bridges and splitters; early hollow pieces tipped over on the stairs | Takes the splitter (level 5's fork) and the bell at the end. The frustration of a set-up knocked over by accident is designed out: placed dominoes never fall until she taps the starter |
| [PythagoraSwitch](https://en.wikipedia.org/wiki/PythagoraSwitch) (NHK preschool series, from 2002; devices designed with a Keio University team) | Short Rube Goldberg devices, each showing one simple physical idea to preschoolers | Supports the toddler and preschool entry: one simple chain, watched from start to end, with a sound at the finish |
| Lorne Whitehead, "Domino chain reaction", *American Journal of Physics* 51, 182 (1983), as summarized by [Young Stars Wiki](https://youngstarswiki.org/it/node/1849) (secondary; the paper itself was not read) | A domino can topple one about 1.5 times its size, so a chain of growing dominoes amplifies a tiny push | Level 6's toy rule: a domino can push one at most **one size** bigger. The 1.5 figure is not used as a number in the game |
| J. M. J. van Leeuwen, ["The Domino Effect"](https://arxiv.org/abs/physics/0401018) (arXiv 2004; abstract only) | Computes the speed of a domino chain as it depends on width, height and spacing | Confirms spacing against height is the real variable. The game makes reach a whole number of slots and claims nothing about speed |

**The model is a toy, stated as one.** Real dominoes reach a neighbour roughly up to their own height away (recalled, not sourced) and the real limit depends on friction and thickness. The island turns that into slots and sizes so every result is identical on every device and every test, and the how-to card says it is a game rule.

## Overlap

- **Chain Reaction** is the closest game: sockets, a run button, deterministic replay, and "a run that misses is an experiment". Its question is **which way a marble rolls** (ramp direction on a two-dimensional board). Domino Run's question is **whether each piece can reach and push the next** (distance against height, and size against size), on a one-dimensional lane. The meaningful action differs, so it is a new game, per AGENTS.md. It reuses Chain Reaction's experiment accounting, faint trail idea and bot pattern, not its board.
- **Ramp Race** keeps fair tests; **Block Tower** keeps a balance rule; **Bouncy Launch** a pull. **Size Parade** orders by size without a consequence; here size order is what lets the chain grow.
- The IDEAS **Dominoes** row is the tile-matching table game. It is unrelated, and if built it must not take the ID `domino-run` (for example `domino-table`).

## The model

- **A lane** is a row of slots `0..n`, `n ≤ 6`. Slot 0 is the **starter**, a fixed small domino with a green paw. Slot `n` is the **bell**. Slots `1..n−1` are **fixed** (a pinned, darker domino), **empty with a socket** (a faint outline where a domino can stand) or **filled** by her.
- **Domino sizes:** small (1), tall (2) and giant (3). A domino's **reach** is its size in slots.
- **The tipping rule.** A falling domino at slot `i` of size `h` finds the nearest standing piece ahead, at slot `j`. It falls if `j − i ≤ h` (**in reach**) and that piece's size is at most `h + 1` (**not too heavy**). Otherwise the chain **stalls** at `i` with the reason `too-far` or `too-heavy`. The bell counts as a piece of size 1. The **gong** (levels 6–8) counts as size 4, so only a giant rings it.
- **The fork** (levels 5 and 8) is a fixed block after the starter. Hit by the starter, it falls into slot 1 of **both** lanes at once; each lane then runs by the rule above and has its own bell. A line is done only when every bell rings.
- **A run** (`run(line)`) returns, per lane, the fallen slots in order, the bell rung or the stall slot and reason. It is deterministic. After a stall the fallen dominoes stand back up (0.6 s wobble), keeping her placements.
- **A line** is solved by any arrangement of tray dominoes that rings every bell. Leftover tray dominoes are never required. `solutions(line)` enumerates every arrangement of the tray multiset into empty sockets (at most 5 sockets per lane, at most 3 tray pieces) and returns those that ring every bell, so tests count solutions, never one exact answer.
- `logic.ts` holds plain functions: `run`, `solutions`, `hintPlacement(line, placed)`, `stallReason`, `planFor(level)`, `makeLine(plan, rng)` (seeded generation from each plan, built backward from a solution and accepted only if it passes the plan filter; at most 50 tries, then an authored fallback that a test asserts is never needed over 500 seeds) and `dominoLayout(lanes, view)`.

## Screen and controls

- **Slots are the targets.** Slot pitch is 100 units; a slot's hit area is its full 100 × 180 column, never the thin domino body. Dominoes are drawn bottom-aligned: small 80, tall 120 and giant 160 units high, about 36 wide. The tray holds at most three pieces in 124 × 160 slots.
- **Layout** (`dominoLayout`, tested at the four standard views). A lane is at most 7 slots, 700 units.
  - **Landscape 1024 × 768.** One lane at y 420 (baseline), x 150–850. Two lanes (fork levels) at baselines 300 and 540, the fork block at the left joining them. The tray is a column at x 880–1004, y 180–720. Home and `?` stay top-left.
  - **Portrait 768 × 1024.** Lanes at x 34–734, baselines 380 (one lane) or 300 and 560. The tray is a row of three slots at y 760–920 starting at x 220, keeping the pet's corner clear.
  - The layout test asserts slots ≥ 100 units, no overlapping hit areas, nothing in the pet's corner or under the shell's buttons, the drag finger (40 below a carried domino) inside `view`, and the same puzzle on every view.
- **Place.** Drag a domino from the tray (`src/engine/drag.ts`, riding 40 units above the finger); it snaps to the **nearest** empty socket within 0.6 of a slot, with a shadow while it hovers. Dropping elsewhere springs it back. Dropping on her own placed domino swaps them. **Tapping** a placed domino sends it back to the tray. At levels 1–2 tapping a tray domino also hops it into the glowing socket, so a toddler need not drag. Fixed dominoes do not move.
- **Run.** Tap the starter (its paw pulses once all sockets that matter are filled, never before). Each domino falls 0.18 s after the one before with a rising pentatonic clack (`src/audio/notes.ts`), so a longer chain plays a longer tune; the bell rings its own note. Placing, swapping and tapping are ignored during a run. A run can be started at any time, gaps and all.
- **Stall.** The chain stops; the gap where it stopped gets a soft pulsing ring, the last fallen domino wobbles, a gentle boing plays and the pet names the reason ("Too far to reach!" or "Too big to push!"). Then everything stands back up.
- **Speech:** `ctx.instruct` gives the instruction and the corner pet repeats it. Navigation never needs reading.
- **Feel:** a calm existing music style (not `silenced`: the clacks are short accents, not her music). Wooden dominoes in `palette.ts` colors with dot faces (1, 2 or 3 dots by size, so size is never shown by height alone), a sandy lane, Pixi `Graphics` only.

## Levels

| ID | Name (`describeLevel`) | Lanes · goal | Tray | Lines per round | Plan filter (rule test) |
| --- | --- | --- | --- | --- | --- |
| 1 | Tip the line | 1 lane, all fixed small, bell | none | 3 | Contiguous; tapping **any** domino tips it and the rest; always rings |
| 2 | One missing | 1 lane, one socket glowing | 1 small | 3 | Exactly one socket; the tray domino fills it |
| 3 | Fill the gaps | 1 lane, 2–3 sockets | as many small as sockets | 2 | Exactly one solution; a run before filling stalls `too-far` |
| 4 | Tall ones reach farther | 1 lane, 3–4 sockets | 2–3, small and tall | 2 | Fewer pieces than sockets; every solution uses a tall domino to span an empty slot |
| 5 | Two bells | fork, 2 lanes, 1–2 sockets each | 2–3 small | 2 | Both lanes need a piece; a solution exists only with pieces in both |
| 6 | Growing dominoes | 1 lane, gong | 2–3, all sizes | 2 | Every solution steps up in size (small → tall → giant); at least one tempting placement stalls `too-heavy` |
| 7 | Just enough | 1 lane, bell or gong | the minimum number, sizes mixed | 2 | Tray size equals the fewest pieces that solve it; at least one arrangement of the same pieces stalls |
| 8 | Two bells, one tray | fork, 2 lanes, bell and gong | 3 mixed | 2 | Every solution splits the tray unevenly by size; one lane's tempting piece is too heavy there |

**Bands (`BandLevels`):** `toddler: { min: 1, max: 2 }`, `preschool: { min: 2, max: 4 }`, `prek: { min: 3, max: 5 }`, `school: { min: 4, max: 8 }`. No `order`; no lap or grown-up levels in the first build ([decision 1](#open-decisions)).

### First rounds

Slots are numbered from the starter (0) to the bell (6).

- **Level 1, line 1 (authored):** small dominoes stand in slots 1–5. "Tap a domino!" Any tap tips it and everything after it; the bell rings; they stand back up and the next line slides in. Lines 2–3 are seeded lengths of 3–5 with different colours. There is no stall and nothing to count.
- **Level 2, line 1 (authored):** fixed small at 1, 2, 4 and 5; a glowing socket at 3; one small in the tray. "Put the domino in the gap, then tap the green one." Lines 2–3 move the gap.
- **Level 3, line 1 (authored):** fixed small at 1 and 4; sockets 2, 3 and 5; three small in the tray. Only filling all three rings the bell.
- **Level 4, line 1 (authored):** fixed small at 1 and 4; sockets 2, 3 and 5; one tall and one small in the tray. The only solution is tall at 2 (reaching over 3 to the fixed domino at 4) and small at 5. "Tall ones reach farther."
- **Level 5, line 1 (authored):** the fork; top lane fixed at 1, 2, 3 and 5 with a socket at 4; bottom lane fixed at 1, 3, 4 and 5 with a socket at 2; two small in the tray. Two bells ring two notes.
- **Level 6, line 1 (authored):** fixed small at 1; sockets 2–5; the gong at 6; a tall and a giant in the tray. Solutions: tall at 2 with the giant at 3 or 4. A giant at 2 stalls `too-heavy`, which the pet explains: "The little one can't push the giant. Try a middle one first."
- **Level 7, line 1 (authored):** fixed small at 1; sockets 2–5; the bell; two tall in the tray. Only tall at 2 and 4 rings it; tall at 2 and 3 stalls `too-far` before the bell.
- **Level 8, line 1 (authored):** the fork; top lane fixed small at 1, sockets 2–5, the gong; bottom lane fixed small at 1 and 2, fixed tall at 5, sockets 3–4, the bell; tray: tall, tall, giant. Top needs tall at 2 and the giant at 3 or 4; bottom needs tall at 3 (a giant there is too heavy for the small at 2).
- Later lines at every level are seeded from the plan.

## Accounting, help and finishing

- **Never a miss:** any placement, swap or return to the tray; a drop outside a socket; a run with gaps; a stalled run of any kind; tapping the starter twice; repeating the instruction. **Misses stay 0 at every level**, as in Chain Reaction, so adaptation steps down only through hints ([decision 2](#open-decisions)).
- **A stall is the gentle wrong-answer response:** boing, the ring at the gap and the spoken reason.
- **The glow after two stalls:** at a line's second stalled run, and at every second stall after that, the next useful placement glows: the tray domino pulses and its socket shows a shadow until she places something. Each glow counts `hints++` once. Level 1 cannot stall; at level 2 the socket glows from the start and that is not a hint.
- **Show a hint** in the pause sheet (`Scene.pauseActions`) gives the same glow on request and counts `hints++` once per glow; asking when the line already rings only says "Tap the green one!".
- **`hintPlacement`** keeps her correct work: it picks a solution that agrees with the most of her current placements and names one placement it needs (moving a misplaced domino back to the tray first, glowing that domino, if no socket is free).
- **Finish:** when every line in the round rings, the dominoes fall one last time in a parade, then `ctx.finish({ misses: 0, hints })` gives one ordinary sticker, with or without help. No creation, discovery or journal entry is filed in this build.

## Rule tests (`logic.test.ts`)

- **The tipping rule:** reach 1/2/3 by size; `too-far` exactly when the gap exceeds reach; `too-heavy` exactly when the next piece is more than one size bigger; the bell is size 1, the gong size 4; the fork starts both lanes; `run` is deterministic and stands everything back up.
- **Each authored first line** has exactly the solutions listed above, and its named wrong arrangements stall with the named reason.
- **Generation**, for every plan over 500 seeds: well formed (lane length, socket count, tray size), unsolved at the start, solvable, passes the plan filter in the table, same seed gives the same line, and the fallback is never used.
- **`hintPlacement`:** from every reachable placement state of sampled lines (the state space is small enough to enumerate), following the hint repeatedly reaches a solution within `sockets + 3` steps and never removes a placement that some solution agrees with when a free placement would do.
- **Layout:** `dominoLayout` at the four views for one and two lanes, against the size assertions above.
- **Registry, lands and how-to tests** pass with the new game, including the home land still fitting on one screen at every band.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` drags the hint placement's domino from the tray to its socket, repeats until a solution stands, then taps the starter. At level 1 it taps the first domino. It never demonstrates a stall. The same bot drives the scripted play.
- **How-to card** (`src/content/howto.ts`). Goal: "Stand the dominoes so the chain rings the bell."
  - Steps: "Tap a domino and the line falls" `{ from: 1, to: 1 }`; "Drag a domino from the side into a gap" `{ from: 2, to: 8 }`; "Tap the green domino to start the chain" `{ from: 2, to: 8 }`; "A tall domino reaches over one empty space" `{ from: 4, to: 8 }`; "The split block starts two lines" `{ from: 5, to: 5 }` and `{ from: 8, to: 8 }`; "A domino can push one size bigger, not two. Only a giant rings the gong" `{ from: 6, to: 8 }`.
  - Finish: "Every bell rings."
  - Note: "A chain that stops is never counted against her: the dominoes stand back up so she can fix the gap. Reach and size are a game rule, not exact physics." Plus `{ from: 3, to: 8 }`: "After two stopped chains, the next domino to place glows; that counts as a hint."
- **Voice lines** under `domino-run.*`: `intro`, `instruct-tap` (1), `instruct` (2–4, 6–7), `instruct-fork` (5, 8), `tall` (4), `grow` (6), `too-far`, `too-heavy`, `ring`, `gong`, `start` (the paw reminder), `hint`, `done`. `{pet}` is optional.
- **Registration:** ID `domino-run`, name "Domino Run", spoken title `game.domino-run`. Region (subject) `tinker-lab`. Skills `['cause-and-effect', 'spacing', 'planning', 'revision']`. Home land **Bubble Beach** by default (4 games today, beside Peg Garden and Bumper Garden; Tinker Lab is at 13), [decision 3](#open-decisions). Hub icon: three dominoes mid-fall toward a bell. Sticker: a seeded domino line with a bell.
- **Co-play:** one person places, the other predicts aloud where the chain will stop before the tap. **Off-screen:** stand books or wooden blocks in a row; try a wide gap and a narrow one, then a small block pushing a big one.
- **Couch:** none in the first build. A later candidate: a focus ring over sockets (`src/couch/focus.ts`), a button to place the selected tray domino, frozen lines for a fair face-off.
- **Rework couplings:** none required, nothing saved or unlocked. A ringing bell or gong is a natural "the learning causes the result" piece for a later project (for example, a welcome bell for a new friend in the [welcome adventure](../rework/README.md#learning-belongs-in-the-story)), and domino colours or faces could become collectable looks; that is the rework's to define.

## Check tier

New-game tier. Typecheck and unit tests (the rule properties above, plus registry, lands and how-to tests). One scripted play through a new `browser-check.mjs` case (its README row is part of the build), filtered to level 1 and level 8, with one stalled run and one requested hint; one portrait screenshot at level 5 (two lanes). `fingerdemo` at levels 1 and 8, since a drag bot has to land the snap. `npm run build`, because the registry, lands, voice and how-to files change.

Device checks stay open: whether a toddler's tap-to-hop at level 2 is found without help; whether the stall ring is read as "here is the gap"; whether three dot faces are enough to tell sizes apart on an iPad.

## Open decisions

Each has a default the build uses. None blocks it.

1. **Bands.** Default toddler 1–2, preschool 2–4, pre-K 3–5, school 4–8, matching PHYSICS-GAMES's toddler–school. Not in the first build: a lap opening (tap and watch, which level 1 nearly is) and the grown-up "Rube Goldberg builder" from the [every-band table](../PHYSICS-GAMES.md#every-band).
2. **Accounting.** Default: a stalled run is never a miss at any level, as in Chain Reaction; struggling shows only as hints. Alternative: count a stall as one miss from level 6, where the rule is stated and tested.
3. **Home land.** Default Bubble Beach (region stays `tinker-lab`). Alternative Tinker Lab, whose 14th game needs `landLayout` to fit, or a physics land, which PHYSICS-GAMES leaves to the developer.
4. **Colour patterns.** The PHYSICS-GAMES sketch mentions "a pattern of colours sets the order". Left out: Pattern Train owns patterns, and a colour rule would muddy the spacing rule. A later mode could make the chain's clacks play a pictured tune.
5. **More parts** (stairs, a bridge, a ball that a chain releases) stay proposals; each would be one new rule per level range, with Chain Reaction's [more parts](../PHYSICS-GAMES.md#new-candidates) as the pattern.
