# Chain Reaction deep dive

*ID `chain-reaction` · bands pre-K, school · levels 1–6 on 2026-10-14 · session `claude/chain-reaction-deep-dive` ([PR #299](https://github.com/rjdunlap/neo/pull/299))*

## The game today

She drags purple (point left) and teal (point right) ramps from a tray into round sockets on a small wooden machine, taps the green arrow, and a red marble falls row by row. Each ramp it meets sends it one column sideways. A run that ends on the big bell wins; at the higher levels the marble must also touch a little chime on the way. Every round is two machines. Sources read: [`index.ts`](../../src/games/chain-reaction/index.ts), [`logic.ts`](../../src/games/chain-reaction/logic.ts), [`logic.test.ts`](../../src/games/chain-reaction/logic.test.ts), [GAMES.md](../GAMES.md#chain-reaction), the how-to card (`src/content/howto.ts`), voice lines `chain.*`, and the IDEAS rows. It has no couch entry and no journal entry. It lives in the Tinker Lab subject and in the Maker lands list (`LANDS`).

Band windows (`levels`): pre-K 1–3, school 3–6. Lap, toddler and preschool are not served.

| Level | Plan (`PLANS`) | Bands | Board · parts | What she decides |
| --- | --- | --- | --- | --- |
| 1 | One ramp in place | K | 4×2 · 0 fixed, 1 loose, 2 decoy sockets | Which of three sockets takes the ramp. On the first machine the right socket already glows (free, not counted) |
| 2 | Add one ramp to a machine with a ramp | K | 4×3 · 1 fixed, 1 loose, 3 decoys | The same, after reading the fixed ramp's effect |
| 3 | Two ramps | K, S | 5×4 · 1 fixed, 2 loose, 3 decoys; 1–2 accepted designs | Which ramp goes in which socket (direction now matters) |
| 4 | Chime then bell | S | 5×4 · 2 fixed, 2 loose, 4 decoys, chime | Plan a path that passes the chime cell and ends at the bell |
| 5 | Five-part machine | S | 5×5 · 3 fixed, 2 loose, 5 decoys, chime | The same, with a longer chain of fixed ramps |
| 6 | Several working designs | S | 5×5 · 3 fixed, 2 loose, 6 decoys, chime; 2–6 accepted designs | Any of several designs; the board accepts them all |

### How it plays, from the source

- **A run that misses is never a miss.** `misses` is declared and passed to `finish` but nothing increments it. The only adaptation signal is `hints`, from the light bulb. A child who tries eight times unaided counts as a smooth round. That follows the rules ("experimental predictions are not wrong answers"), but it means the ladder steps up on persistence as well as on understanding. See decision 1.
- A failed run says one of `chain.left`, `chain.right` or `chain.missed-chime`, boings, then re-enables the parts. Escaping through a side wall is spoken as "left"/"right of the bell"; the marble animates off the board column. A person check should confirm it reads as falling off the machine.
- The bulb (`hintFor`) keeps the sockets she has already filled correctly and glows one part and one socket. With a completed correct layout it says "tap the green arrow" (`chain.run-now`), and that is not a hint.
- Boards come from `makeBoard`: an authored path, then decoy sockets, then every layout enumerated, rejecting any board whose number of visibly different solutions is outside the plan's `solutions` range. Eight hundred attempts, otherwise throw.
- Pools: 4–5 columns, 2–5 rows, three ramp sets (fixed wood, purple loose left, teal loose right), one marble, one bell design, one chime design. Nothing varies visually between machines except the layout, so a long session looks the same.
- The ghost-finger bot (`chainTouch`) places along a working design, then taps run; a rule test plays it against fifty seeds per level.

### Known gaps

- Misses are not counted, as above. Two smooth rounds are easy to reach by trial and error.
- Only one verb: place a ramp. The marble, bell, chime and ramps never change, so levels 4–6 are the same idea with a bigger board.
- Nothing is predicted before a run. The prediction habit (what will it do?) is the actual learning purpose but the game only supports try, watch, adjust.
- After a failed run the path is gone; she cannot compare this try with the last one. The run cannot be watched again without moving a part.
- Preschool and younger children cannot enter: level 1 still asks for a drag into one of three sockets, with 4×2 columns. Pre-K starts there.
- `school` starts at level 3 and so never sees the one-ramp machines; a school child who is slow can step down only to 3.
- No saved creation, no journal discovery, no couch play.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [The Incredible Machine](https://www.hardcoregaming101.net/the-incredible-machine-the-even-more-incredible-machine/) (Sierra, 1993) | PC puzzle classic | A limited toolbox per puzzle; parts introduced one at a time, then combined in more elaborate ways; a freeform mode with unlimited parts | Introduce one new part per level; keep the toolbox small so every board is solvable; a freeform ending | Dozens of parts at once, text goals, unchecked physics that can wobble |
| [Crazy Machines](https://games.softpedia.com/get/Shareware-Games/Crazy-Machines.shtml) series | PC/mobile physics | A hundred-puzzle "training camp" first, then 200+ challenges; very little instruction, so children experiment; sandbox | A short guided start, an experimenting tone, a sandbox | Real-time physics that varies between runs; score pressure |
| [Contraption Maker](https://techlearning.com/resources/contraption-maker) (Spotkin) | Rube Goldberg builder and editor | Puzzles, then an editor for building your own; reviews say teachers must bridge fun to learning | Saving a made machine; the editor as the last rung | A full editor; sharing; the learning bridge being left to a teacher: the pet and discovery journal should do it |
| [ThinkFun Gravity Maze](https://whatsgoodtodo.com/thinkfun-gravity-maze-review/) | Physical marble-tower puzzle, age 8+ | Four card tiers from few pieces to expert; the marble may pass through the same tower more than once; a dot shows each tower's direction | Pieces whose direction is readable on the piece; a "same part used twice" late level | Reading small cards; the age 8 floor (this one starts at about 4) |
| [Mouse Trap](https://www.amazeum.org/assets/Education/MousetrapClassPack.pdf) and Rube Goldberg classroom lessons | Board game and school unit | Build the chain, run it, find what failed, redesign over days | Run, find the one weak step, change only that | A ten-step chain in one round; the multi-day build |
| [Lightbot](https://www.lightbot.com/Lightbot_HowDoesLightbotTeachProgramming.pdf) | Programming puzzle | 20 puzzles: basics, then procedures, then loops; one new idea per section; an easier level was swapped in after players got stuck | Keep a section per idea; replace a level that stalls rather than adding hints | Abstract procedure call syntax |
| Puddle Island's [Robot Path](robot-path.md) and [Block Tower](block-tower.md) | Own games | Robot Path: solvable programs and predict-the-stop; Block Tower: predict-then-test and removal levels | The same "predict, run, compare" pattern, kept as an unpenalized experiment | — |

Learning sources: the NGSS kindergarten standards on [pushes and pulls](https://nyssls.info/index.php/K-PS2-1) (K-PS2-1, planning an investigation of how a push or pull changes motion) and K-PS2-2 / K-2-ETS1-3 (check whether a design changes an object's direction as intended, then compare two designs and improve), as summarized on the [CA NGSS standards](https://www2.cde.ca.gov/cacs/science?c0=15%2C37) pages. Both cite the marble path as a standard example problem. Cause and effect is the crosscutting concept. I did not find a developmental source for preschool cause-and-effect reasoning; the searches returned only the school standards, so the younger entries below are design judgment, not citation.

## What makes sense here

- **One new part or one new question per level.** The Incredible Machine and Lightbot both teach this way. Chain Reaction's levels 1–6 are the same part with a bigger board; the next rungs should change the question: predict first, two marbles, a spring that skips a row, a gate that the chime opens.
- **Prediction before action is the learning purpose.** K-PS2-1 and ETS1-3 are about predicting and then testing. The game currently has no moment where she says what will happen. A prediction step with no penalty (the Sink or Float and Habitat Helpers pattern) fits the rules exactly.
- **Tap-to-turn is a gentler verb than drag-and-socket.** It opens a toddler or preschool entry with no drag and no tray.
- **Keep the machine tiny.** Gravity Maze needs 8+ for a reason. Boards stay at most 5–6 columns and 5–6 rows, with no moving timers and no real-time physics. The run is deterministic, so everything stays rule-testable.
- **Leave out** a free-build editor with scoring, sharing, ratings, speeding the marble up, and score for fewest ramps. IDEAS already says bigger boards are only a size step ("Leave: the ceiling is right"); this dive agrees for size alone and adds new parts and modes instead. The audit row for this game should be updated to point here.
- **The arc.** Pre-K: "what does one ramp do" (tap or drag, one marble, one bell). Preschool (new): the turning ramp and a bell to predict. Pre-K/school: place, chime, several designs. School: two marbles, spring, gate, and finally a machine she keeps.

## Experience and presentation

- **First unsupported action.** Level 1's first machine already glows the right socket for free. The first thing she can try without an adult is dropping the ramp in any of three sockets and pressing the arrow; a wrong guess is a free run and a visible path.
- **What is pleasurable.** The marble's ride and the ramp marimba note (4 for left, 8 for right), then the bell's tada. Replay variety is only the seeded layout today; fresh content below varies the cargo (marble, acorn, duckling in a tub), the destination (bell, friend's bowl, basket) and the machine's wooden colors, with the rule untouched.
- **Touch-down and consequence.** A ramp picked up plays a pop and leaves its socket empty. Missing runs boing and speak where the marble ended. Proposed: leave a faint trail of the last run on the board (a dashed Graphics line in the marble's red), so she can compare "that way" with the new try. This is the concrete art example: one `Graphics` path built from the `trace()` steps, alpha 0.35, cleared by the next run.
- **Cognition versus motor.** Reasoning is reading each ramp's pale groove (it shows where the marble leaves). Motor demand is low (96-wide ramps, 52-radius sockets). No reading is needed; speech repeats the instruction. Memory is not used: the board stays visible.
- **Supported ending and replay.** The bulb gives a placement that keeps correct work; completing with it still gets the sticker. Proposed "watch again" (tap the start cup to replay the last run) is free and counts nothing. Stopping is comfortable: every machine ends on its own bell.
- **Co-play.** One child places, the grown-up (or a second child) points at the ramp and says where the marble will go before the run. Proposed roles: the "predictor" taps the bell they think will ring (the prediction level below makes that explicit).
- **Needs a person or a device.** Whether a four-year-old reads the groove on the ramp as a direction, whether the marble leaving through a side reads as "fell off", whether drag from the tray at 100-wide targets is comfortable on an iPad, and whether tap-to-turn is discovered without a prompt.

## Proposed ladder

### Fresh content inside existing levels

- **Cargo and goal skins, chosen per machine by the seeded RNG:** a marble to a bell (today), an acorn to a squirrel's bowl, a duckling in a tub to the pond. Same trace, same board. Cost: three cheap code-drawn props, three voice lines using the same `chain.rang`-style template, no logic change.
- **A different note per ramp pair** so a finished machine plays a short run of notes that she may hear as a tune (pentatonic `notes.ts`, already used by `marimba(4/8)`). No rule change.
- **Last-try trail and "watch again"** (built 2026-10-15, slice 1). No rule change; touches `run()` only.
- **Free-run counter that never scores:** after three runs on one machine without a hint the bulb pulses gently (no hint counted until it is tapped). Needs decision 1.

### New levels on top

Appended IDs 7–10, never renumbered. Level 7 and 8 are easy entries and are placed ahead of 1 by `order` (see below).

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | Tap to turn | preschool 1–2; pre-K 1–3 (entry) | Three rows, one fixed ramp, ramps already placed in two sockets, each showing its direction; tap a ramp to flip it | Which ramp to flip so the marble hits the bell | A wrong run is a free run with the trail; hint glows the ramp to flip; counts a hint | Every seed has at least one flip set that rings the bell; the no-flip state does not; hint points to a ramp that flips toward a working set | New `mode: 'turn'` in the plan; tapping uses `onTap`; the ghost finger taps the flip. New how-to step line scoped to 7–8; art: no new art (flip animation of the groove) |
| 8 | Which bell? | preschool 2–3; pre-K 1–4 (entry) | A finished fixed machine, no loose parts, three bells at the bottom; tap the bell you think it will ring, then press run | A prediction | No wrong answer. A mismatch just says where it landed and the trail shows why; the hint is "follow the marble with your finger" (no counted hint) | The machine's `trace().end` is one of the bell columns and the bells are all reachable; a prediction never records a miss | Reuses `trace`; three bell props; a "predict" label; a how-to line; bot taps the correct bell then run |
| 9 | Two marbles | pre-K 5; school 3–7 | A red and a blue marble, two bells (red and blue), a shared board | One placement that sends each marble to its bell; the same ramp affects both | Hint glows the part that matters for the marble that missed | `solutions` filters on both traces; no seed has the same ramp serve both only trivially; at least one solution requires different sockets | `trace` gets a second start; draws a second marble; new voice lines; bot unchanged but plays both runs; art: blue marble swatch |
| 10 | Springboard | school 5–8 | A spring part that sends the marble two rows down | Place a ramp so the marble lands on the spring column | Hint glows the spring column; a miss says where it landed | Spring skips exactly one row; solution enumeration remains exact; the fixed part cannot be placed on the last row | New part kind in `trace()`; new art; journal "the spring skips a row" discovery (a test that its voice line matches data) |
| 11 | The chime opens the gate | school 6–8 | A gate fixed ramp that exists only after the marble touches the chime | Plan so the chime comes first, then the gate-turned path | A miss that never opens the gate says so; the hint shows the chime's cell | `trace` records the order; solvable; the no-chime path fails | A conditional in `trace()`; a gate prop; chime ordering is already tracked |

Level 12 and beyond (a machine she builds on an open board and keeps) is a creation-slot proposal; see decisions.

### Younger-band openings

- **Preschool and toddler from level 7.** Tap to turn needs no drag, so a three-year-old can attempt it: one ramp, one bell, large 100-unit tap area. A lap or toddler start at level 7 with a three-column, two-row machine and a single flippable ramp is the cheapest opening. Check: whether the existing band windows allow a toddler to enter; a toddler window of 7–7 and a preschool window of 7–8 are proposed, which is a decision (3).
- **Prediction level 8 is a younger idea too:** at toddler it is two bells and a single tap on one.

### Easier entries and levels between existing ones

Levels 7 and 8 are appended IDs that are easier than 1. Place them with `order` (7, 8, then 1–6, then 9+) and declare `entryLevels: [7, 8]` so a birthday lands on them. The built `BandLevels` table and `order` support exist already (see `jelly-drums`, `pet-says`, `bubble-pop` for the pattern); no renumbering of saves or pins. The band windows above are proposals; `rangeFor` clamps.

### Left out on purpose

- Board size alone (7+ columns): the audit already recommended against it; it makes ramps and sockets smaller, and the 100-unit rule would then cost screen space.
- Speed controls, a timer, "fewest ramps" scoring, stars for efficiency.
- Free-build with a score; shared machines.
- Gravity, bounce physics or any real-time simulation; everything stays on `trace()`.
- Couch play: a cooperative couch version (one player places, one predicts) is possible but not proposed, since the game is a two-input drag-and-tap game and the couch needs a focus ring.

## Decisions for the developer

1. **Count runs?** Should the adaptation signal include "runs before success"? Proposal: do not record misses, but record `tries` and let two rounds with more than five tries count as struggling (not a miss, not a hint). Alternative: leave as is.
2. **Tap-to-turn and prediction as younger entries (7–8):** build them as appended easy entries placed before level 1, and widen the band windows to preschool and toddler.
3. **Toddler window.** The game has never served toddlers; level 7 might. Check with a real child first (DEVICE-CHECKS).
4. **Saved machine.** A final "My machine" mode (open board, a friend target, saved in a `creations` slot) is a creative extension. It needs a typed creation result and a treehouse slot; it is not proposed to start without a decision.
5. **Cargo skins.** Acorn and duckling props are code-drawn; confirm that an acorn and a squirrel fit the Tinker Lab theme (Maker Harbor).

## Build slices, in order

1. **Trail and watch-again** (built 2026-10-15; see below). `run()` draws a faded path from `trace().steps`; tapping the start cup replays. Tier: typecheck, the game's rule tests (none change), one filtered browser play at level 3 and `fingerdemo` for the bot.
2. **Level 8, Which bell?** (built 2026-10-16, branch `claude/chain-reaction-which-bell`, PR #441; preschool window left to decision 2) Plan field `predict`, bell row, voice lines, a how-to line. Tier: typecheck, rule tests (reachable bells, no recorded miss), one filtered play, `fingerdemo` at level 8, and a portrait screenshot.
3. **Level 7, Tap to turn.** A `turn` mode in the board and `trace`; the ghost finger taps the flip. Tier: the same, plus `order`/`entryLevels` tests in the registry tests.
4. **Decision 1** if approved: `tries` stat feeding the difficulty step. Tier: shell and save contracts (typecheck, unit tests, build).
5. **Cargo and goal skins, note per ramp.** Tier: typecheck and one screenshot.
6. **Level 9, Two marbles.** Tier: rule tests and one play.
7. **Level 10, Springboard.** Tier: rule tests, one play, `fingerdemo`.
8. **Level 11, The chime opens the gate.** Tier: the same.
9. **A kept "My machine"** only after decision 4.

## What was built in this session

The deep-dive session itself built nothing (research and ideation only; links and `git diff --check` ran).

**Slice 2, level 8 Which bell? (built 2026-10-16, branch `claude/chain-reaction-which-bell`, PR #441).** A finished fixed machine (4 columns, 3 rows, 2 fixed ramps on the marble's path; it never escapes and ends away from its start) with three bells (104 by 140 tap areas). She taps a bell (blue backdrop), then runs; a different bell is told and shown with the trail, never a miss, and running first only asks for a bell. The bulb glows the start cup (not a hint). Three machines per round. Pre-K is now `{ min 1, max 8, order [8, 1, 2, 3] }` with `entryLevels [8]`; school stays 3–6; the preschool window waits on decision 2. Ghost finger taps the correct bell, then run. Voice: `chain.predict-start/-first/-hint/-right/-other`. Checks: see [VERIFICATION](../VERIFICATION.md).

**Slice 1, trail and watch-again (built 2026-10-15, branch `claude/chain-reaction-trail`).** After a run that misses, a faint red path (alpha 0.35) of the marble's last run stays on the board until the next run or the next machine. Tapping the blue start cup (a 120 by 104 hit area) replays the last run and changes no misses or hints. Rules and levels are unchanged and the how-to step is updated. Checks: typecheck, the Chain Reaction unit tests (7), `BROWSER_SUITE=machines` (level 6 now asserts the trail and the replay) and `fingerdemo` with `FINGER_ONLY=chain-reaction` (both levels passed). Not run: build, offline, a device or a child.
