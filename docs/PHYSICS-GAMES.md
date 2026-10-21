# Physics games: research and plan

Written 2026-10-14 from the developer's request to look for more physics-type games and to find out what physics games do and what makes sense here. **Research and ideas only: nothing here is built or promised.** The [roadmap](ROADMAP.md) (chunk 27) chooses what happens next; candidates are also in the [idea notebook](IDEAS.md#candidates). Sources are linked; where a search came back thin, the gap is stated.

## What the island has already

Built: Sink or Float (buoyancy by trial), Seesaw Balance (balance), Ramp Race (ramps), Bouncy Launch (a pull sets a flight; `engine/ball.ts` takes a `gravity` value), Peg Garden and Bumper Garden (bounces), Block Tower (stacking by an explicit balance rule), Chain Reaction (a deterministic marble machine), Light Lab (beams), Fill and Dump (pouring), Pond Conga and Duckling Parade (steering). In the notebook already: Wobble Works (bridges), Water Paths (draw a channel), Magnet Fishing, Gear Garden, Circuit Garden, Roll Table and Pond Merge (a circle-pile solver), Mini Putt, Lander and Drift, Breezy Balloon, Keepy Uppy, Tilt Together, Sand Table and Mole Mine. Sketched this week: [Vine Snip](vine-snip.md) (ropes) and [Block Topple](block-topple.md) (a slingshot at a stack).

## What the research says

- **Physics games teach when the rules are the world's rules.** *World of Goo* is solved by reasoning about gravity and wind, so no game-specific rule has to be memorized; *Crayon Physics* turns a drawing into a physical object and says outright that there is no single correct solution ([Mechanics of Magic](https://mechanicsofmagic.com/?p=11636), [Common Sense Media](https://www.commonsensemedia.org/app-reviews/world-of-goo)). The search found little on Poly Bridge, *Where's My Water?* or The Incredible Machine design, so those are described only by their mechanics below.
- **Physics Playground** (Shute, Ventura and colleagues, formerly *Newton's Playground*): the player draws simple machines (ramps, levers, pendulums, springboards) to get a ball to a balloon, and in-game behavior (including persistence) was measured as evidence of learning. In a 2013 study, 167 eighth and ninth graders played about four hours over 1.5 weeks and gained significantly in physics ([Journal of Educational Research 2013](https://ideas.repec.org/a/taf/vjerxx/v106y2013i6p423-430.html), [Shute's papers](https://myweb.fsu.edu/vshute/pdf/IJAIED2020.pdf)). The players were teenagers, and the full paper would not load for me, so effect sizes and any design detail beyond the abstract are not recorded here.
- **PhET** designs by *implicit scaffolding*: controls, feedback and structure steer exploration with very little text, and the designers target exploration, understanding, link to daily life, enjoyment and ownership ([PhET](https://phet.colorado.edu/en/about), [arXiv: implicit scaffolding](https://arxiv.org/pdf/1306.6544)). That matches the island's rule that navigation never requires reading.
- **Thinkrolls 2** (ages 3–9, rolling characters, 270 levels by the publisher's count; Common Sense Media's count differs) adds one science idea per chapter (gravity, buoyancy, levitation, electricity, density, acceleration) and gives no hints, so children learn by trial and error ([Common Sense](https://www.commonsense.org/education/reviews/thinkrolls), publisher text via [app listing](https://www.bluestacks.com/campaign/com.avokiddo.games.thinkrolls2/en)). The one-idea-per-chapter ladder is the part to borrow; the no-hint rule is not ours.
- **Tinybop's Simple Machines** (ages 4+) covers levers, pulleys, wheels and axles, screws, inclined planes and wedges; **GraviTrax** (a marble-run toy with an app) uses magnets and kinetics in a track sandbox; **PhET** is rated elementary through college ([Fatherly](https://www.fatherly.com/gear/the-best-physics-apps-for-kids/)). These are listicle summaries, not independent reviews.
- ***Where's My Water?*** (2011): swipe to dig, with distinct fluids (steam rises, mud dries). The simple control plus consistent, varied materials is why it stays learnable ([Wikipedia](https://en.wikipedia.org/wiki/Where%27s_My_Water%3F)). The "design lessons" from that search were the search tool's own synthesis, not a source.
- **What children can do when:** a cognitive-science summary says sensitivity to gravity appears by about 2, balance prediction takes much longer, and inertia only around 5 to 6; 4- and 5-year-olds do better at using weight to cause outcomes ([UC study](https://escholarship.org/uc/item/5qc9c2j0)). I found **no controlled study that ramp or balance play improves these skills at ages 3 to 6**, so this plan treats physics play as exploration, not instruction.
- **School science anchors** (NGSS, as I know them; the official text for grades 2–5 did not load in this session, so check [nextgenscience.org](https://www.nextgenscience.org/) before relying on a code): kindergarten pushes and pulls (K-PS2), first-grade light and sound (1-PS4), grade 3 balanced and unbalanced forces and the patterns of a pendulum (3-PS2), magnets, grade 4 energy transfer (4-PS3), grade 5 gravity (5-PS2), and engineering design across K–5 (K-2-ETS1). The search confirmed K-PS2-1, 1-PS4 and the engineering strand ([NGSS topics](https://www.nextgenscience.org/search-standards-dci)).

## What physics games do, and what to borrow

| Pattern | Seen in | For Puddle Island |
| --- | --- | --- |
| A visible goal and a small kit | Physics Playground, Chain Reaction | Yes: a bell, a friend's mouth, a basket; the kit is a few large pieces |
| One new idea per chapter | Thinkrolls 2 | Yes: a new part or planet per level range, never a new rule and speed together |
| Run, watch, revise | Chain Reaction, The Incredible Machine | Yes; a failed run is an experiment, not a miss ([Chain Reaction](GAMES.md#chain-reaction)) |
| More than one valid solution | Crayon Physics, World of Goo | Yes; tests count solutions, never one exact answer |
| Distinct materials extend the puzzle without changing the control | Where's My Water? | Yes: new materials (a feather, a rock) as new levels |
| Stealth measurement of persistence | Physics Playground | Already in `difficulty.ts`; not extended |
| Move limits, three-star ratings, par | World of Goo (moves, leftover goo), Cut the Rope | Leave out. A "best" may be shown, never a gate |
| Timers, lives, hazards that end a run | many | Leave out; the fruit or ball is never lost |
| Hints that cost something | many | Leave out; hints only count for adaptation |

## Three tiers of physics, by what the island must build

1. **Rule models and analytic curves (no engine).** The rule is a small formula a test can check exactly: Block Tower's balance rule, a pendulum's period, a ballistic arc under a chosen gravity (`ball.ts` already takes `gravity`), buoyancy by a stated density rule, a lever's torque, a row of dominoes where the next tips if the gap is short enough. Results are the same on every device and every test.
2. **Existing circle simulation** (`engine/ball.ts`): pegs, walls, bumpers, replay.
3. **A new deterministic solver:** ropes (Vine Snip), rigid blocks (Block Topple), a circle pile (Pond Merge, Roll Table), drawn lines (Draw a Ramp). These need the engine decision recorded in [Waiting on the developer](WAITING-ON-DEVELOPER.md#waiting-on-the-developer).

**Recommendation:** build tier-1 ideas first. They are cheap, exactly testable, and teach real ideas; they can also prove the first physics game in a lane before a new solver is decided. A simplified tipping rule for blocks (explicit thresholds, not a rigid-body solver) is also worth a look for Block Topple, since it keeps every result identical on every device at some cost in realism.

## New candidates

All names are generic. "Tier" is the list above. Effort is relative (S / M / L).

| Candidate | After | Fun action and learning | Bands | Tier | Effort |
| --- | --- | --- | --- | --- | --- |
| **Planet Hop** (a mode of Bouncy Launch) | Moon jumps, Kerbal-style planets | The same pull flies farther on the moon and shorter on a heavy planet; predict, then compare. Gravity as a stronger or weaker pull (not the 5-PS2-1 anchor, which is gravity directed down) | school | 1 (a stated reach rule: reach divided by a toy gravity factor; not `ball.ts`) | S; [built at school level 12](definitions/planet-hop.md), 2026-10-16 |
| **Domino Run** | Domino toppling videos, Incredible Machine | Stand dominoes so the chain reaches the bell; a gap that is too wide stops it, a branch lights two bells, a pattern of colors sets the order. Spacing, cause and effect, counting. No fall to harm; a stalled chain just stands up again | toddler–school | 1 (a 1D tipping rule) | S–M; [built 2026-10-20](definitions/domino-run.md) as levels 1–8 |
| **Swing Pals** | Playground swings; a pendulum | Tap in time to swing a friend higher (any rhythm works, a steady one swings higher); a longer rope swings slower. Patterns of motion (3-PS2-2) | lap–school | 1 (analytic pendulum) | S–M; [built 2026-10-20](definitions/swing-pals.md) |
| **Lift It** ([machines/tools study](deep-dives/subjects/machines-tools.md), which refines this seed) | Tinybop Simple Machines; Physics Playground's agents | Get a heavy crate up to the treehouse with a lever, a ramp, a pulley or a wedge; a movable load pulley with two supporting strands takes twice the rope travel in the ideal model, a ramp a longer push. Simple machines and trade-offs; several machines work | preschool–school | 1 (stated rules) | M; [built 2026-10-20, levels 1–6](definitions/lift-it.md) (pulleys only; ramps and levers later) |
| **Build a Boat** (a mode of Sink or Float; Raft Delivery in the notebook is the nearby game) | the classic foil-boat challenge | Shape a hull wide or deep to carry more cargo before it sinks; compare two boats; the model is stated, not full fluid physics. *Same material, change the shape* belongs to Make it float (Sink or Float level 7, [definition](definitions/make-it-float.md)); Build a Boat keeps cargo and hull capacity | school | 1 (a stated buoyancy rule) | M |
| **Mobile Maker** (a Seesaw Balance extension) | Calder mobiles, PhET Balancing Act | Hang objects on a mobile's arms so it balances; heavier near the middle, lighter far out. Unequal arms and the idea of torque | school | 1 (a torque rule, in eighths as Block Tower does) | M |
| **Draw a Ramp** | Physics Playground, Crayon Physics; notebook's Rainbow Road | Draw a line that becomes a ramp, a bridge or a slide so a ball reaches the balloon; many solutions, replay and undo | preschool–school | 3 (circle-vs-segment collisions; a small extension of `ball.ts`) | M–L |
| **More parts for Chain Reaction** (a ladder, not a new game) | Thinkrolls' chapters, GraviTrax | Add one part per level range: a see-saw, a fan, a spring, a magnet, a bell; each introduces one force. The same sockets and replay | pre-K–school | 2 | M |
| **Vine Snip** and **Block Topple** | [vine-snip.md](vine-snip.md), [block-topple.md](block-topple.md) | Already sketched | | 3 | M–L |

Existing notebook candidates (Wobble Works, Water Paths, Magnet Fishing, Gear Garden, Circuit Garden, Mini Putt) are not re-argued here. The new evidence changes none of their rankings except Water Paths, whose distinct-fluid idea (water, steam, mud) is the cleanest bridge from physics to the states-of-matter session in [subject sessions](deep-dives/subjects.md).

## Every band

The island's goal (the developer, 2026-10-14) is games for toddlers, preschoolers, elementary and middle-school children and the parents. The candidates above lean to 3–8, so this table says what each physics idea offers the others. Grown-ups' rows are in Lantern Lake or couch play; "page" means a plain-HTML card on the grown-ups' page.

| Idea | Lap and toddler | Preschool and pre-K | School (6–8) | Upper school (9–12) and early teens | Grown-ups (parents) |
| --- | --- | --- | --- | --- | --- |
| Planet Hop | Tap to boing the pet on the moon (it floats up higher) | Near or far on two planets | Predict which planet, then compare | Gravity as a number: the same pull flies twice as far where gravity is half | Mini Putt on the moon |
| Domino Run | Tap a domino and watch the line fall | Fill the gaps to reach a bell | Branches and color patterns | Spacing and height as a rule; a chain reaction with a puzzle limit | A cozy puzzle (a Rube Goldberg builder) |
| Swing Pals | Tap to push a friend | Swing as high as the star | Short rope or long: which is faster | Rope length sets how fast it swings back and forth; weight and height do not (a pattern of motion, 3-PS2-2, which keeps the word "period" out), predict then measure | A calm, rhythmic cozy toy |
| Lift It | Push a crate; the ramp does the rest | Pick the ramp or the lever | Which machine is easier; trade-offs | Mechanical advantage by numbers (a movable load pulley with two supporting strands takes half the ideal force and twice the rope travel) | A mechanism puzzle |
| Draw a Ramp | Scribble and a ball rolls | Draw a slide to the friend | Draw, replay, revise | Several balls, obstacles | Physics Playground-style sandbox |
| Vine Snip, Block Topple | One vine, one tap | Two vines, a big tower | Order and angle | Angle and power as numbers; torque | Harder authored levels |

Parents: the family table (play together, chunk 16) is the natural home for the shared versions, such as one person pulling the sling and the other choosing the planet.

## Suggested order

**Planet Hop is built** as Bouncy Launch’s school level 12 ([definition and closeout](definitions/planet-hop.md), [verification](archive/VERIFICATION-2026-10-16.md#2026-10-16--bouncy-launch-12-planet-hop)). Its younger and grown-up audience ideas above remain proposals. Remaining order (Domino Run has since been built):

1. **Domino Run** is built (2026-10-20, a tier-1 game for toddlers to school; [definition](definitions/domino-run.md)).
2. **Swing Pals** is built (2026-10-20, levels 1–6; [definition](definitions/swing-pals.md)), and **Lift It** is built (2026-10-20, levels 1–6; [definition](definitions/lift-it.md)).
3. Make the physics-engine decision before **Vine Snip**, **Block Topple**, **Draw a Ramp** and **Pond Merge**.

## Open decisions (for the developer)

- The physics approach: small hand-written solvers, a library, or tier-1 rule models wherever possible. Not measured: a library's bundle size or its output across Node and Safari.
- Whether physics games are one land (Tinker Lab is full) or split across lands; `landLayout` decides capacity.
- Whether a "best number of tries" is ever shown. The plan says no gating and no star ratings; a plain "best" is allowed in Gem Swap for grown-ups only.

## Not run

Docs only. No code, no browser, no device. Sources are search results and a few fetches; the Physics Playground paper would not load, so its detail is limited to its abstract; NGSS grade 2–5 text was not retrieved.
