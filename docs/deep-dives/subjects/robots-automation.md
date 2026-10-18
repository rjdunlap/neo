# Robots and automation: sensors, rules that keep checking, and loops that change what they sense

**Subject:** `robots-automation` · **Audiences:** L, T, P, K, S, U, M and G as [defined in the tracker](../subjects.md#the-audiences) · **Date:** 2026-10-17 · **Session:** `claude/subject-robots-automation`, [PR #533](https://github.com/rjdunlap/neo/pull/533). The tracker row names "sensors, actions and automation in the real world: thermostat, door, traffic light".

**Research and proposals only.** Three earlier studies already cover the neighbouring ground, so this study claims only what none of them holds. The [how-computers-work study](how-computers-work.md) gives **Sorting Machine** the moment a sensor reads one critter and a gate decides, and its packet explicitly excludes "cycles, … delays, feedback oscillation, clocking". The [programming study](programming.md) gives **Robot Path** its fixed command sequences and **Cue Studio** events that the child triggers. What is left is **time and feedback**. A helper's sensor checks *again and again* without anyone pressing anything. Its action changes the very thing it senses: a lamp lights the room its light sensor watches, and a heater warms the air its thermometer reads. The machine settles, flickers or overshoots because of that loop. Recommend one new identity, **Helper House**. A friend moves into the creature home. She wires a helper (a door, a lamp, a heater, a sprinkler) to a sensor with one or two big picture rule cards, taps Watch, and sees a day of the house run by itself, with a glowing line that shows each check. Everything else is a pointer into another game's own dive: **Stop and Go**'s proposed *Smart light* level, a bump rule in **Robot Path**'s conditions definition, and factory-line automation in **Machine Line**. No game, band, zone, land registration or save format is added.

## Anchors opened at their source

Opened 2026-10-17 unless marked. Anchors are guides, not prerequisites or claims that a round teaches a standard. CSTA 2026 codes run EK (PK/K), E1–E5 (grades 1–5), MS and HS; page numbers are the printed footers of the [2026 CSTA PK–12 standards PDF](https://csteachers.org/2026-csta-pk-12-computer-science-standards/) (CC BY-NC-SA 4.0).

| Anchor | Scope used here | Design consequence |
| --- | --- | --- |
| CSTA 2026 **EK-SOC-HU-15** (printed p. 94) | Children recognize that "programmable toys … do not appear by magic, but are created by people" | The house's helpers are made by a creature tinkerer the child meets; she is the person who sets them up |
| CSTA 2026 **E1-SOC-HU-15** (p. 94) | "Differentiate between activities that humans do well and activities that computing technologies do well", e.g. "repeating tasks without mistakes" | The payoff of automation is that a helper keeps doing the job every night without her; the creature still chooses, plays and feels |
| CSTA 2026 **E2-SOC-HU-15** (p. 95) | Concrete examples: "traffic lights that help cars and pedestrians move safely … automatic doors that help people enter buildings"; investigate the problem each was made to solve | The first rounds use exactly these: a door, a lamp and a crossing light. Each round opens with the problem ("friends bump the door with full arms") |
| CSTA 2026 **E2-SYS-HW-11** (p. 75) | Inputs and outputs that "take in information from the real world and produce an action that can be seen or heard"; "light sensors, sound sensors, and distance sensors" are named | Three pictured sensor kinds (eye for near/far, sun for light/dark, thermometer for warm/cold) and visible actions |
| CSTA 2026 **E3-PRO-PD-04** (p. 50) | Sequence, events, iteration and "basic decisions (e.g., conditionals [if/then statements])" | A rule card is one if/then; the house keeps re-checking it (iteration) |
| CSTA 2026 **E5-SYS-HW-12** (p. 76) | Hardware and software together; "role-play activities (e.g., students acting as a computer …), and physical computing projects that use sensors are appropriate" | The unplugged **Be the Helper** card: one person is the sensor, one the heater |
| CSTA 2026 **MS-SYS-HW-31** (p. 77) | Describe devices "used in various industries" (robots, vehicle control units, "agricultural sensors") and how they use input, output, processing and "mechanical interactions" | The upper rung's greenhouse and robot cases; describing, not building, real devices |
| CSTA 2026 **MS-SOC-CE-45** (p. 99) | "Evaluate how automation in technology can create or replace jobs"; students "are not expected to design or program automated systems" | A family conversation card for teens and parents, not a game. Labour economics is not simulated |
| CSTA 2026 **S2-PHY-IO-02** (p. 146, a high-school specialty) | "Design a closed-loop feedback control system to meet a desired outcome"; feedback "may be conceptual, simulated"; trade-offs of "accuracy, responsiveness" | **A ceiling, not an M anchor.** CSTA places designed closed-loop control in high school. The island's U/M feedback rungs run ahead of it on purpose, with a visible discrete model, and claim no standard |
| [NGSS Appendix G, Crosscutting Concepts](https://www.nextgenscience.org/sites/default/files/Appendix%20G%20-%20Crosscutting%20Concepts%20FINAL%20edited%204.10.13.pdf), pp. 8, 10–11 | Systems: K-2 "systems in the natural and designed world have parts that work together"; 6-8 "inputs, processes and outputs". Stability and change: K-2 "some things stay the same while other things change"; 6-8 "systems in dynamic equilibrium are stable due to a balance of feedback mechanisms"; 9-12 "negative feedback can stabilize a system". It quotes the *Framework*: "A feedback loop is any mechanism in which a condition triggers some action that causes a change in that same condition, such as the temperature of a room triggering the thermostatic control that turns the room's heater on or off" | The thermostat is the canonical example. Early rungs show parts working together; the loop that holds a room steady is the school-top and later rung |
| ISTE Student Standards 1.1.d | **Reused, opened in the [how-computers-work study](how-computers-work.md#anchors-and-evidence-limits)**, not reopened: broad technology fundamentals | Nothing beyond CSTA |
| Head Start infant–toddler and preschool science | **Reused from the [life-science](life-science.md) and [inventions](inventions.md) studies**; the infant–toddler page returned 403 today | L/T stay with shared cause and effect; no sensor concept is expected |

**Recalled, not opened (reviewer items):** that robots are commonly described as sense–think–act machines; that a real thermostat uses a dead band (hysteresis) to stop the heater switching constantly; that some automatic doors use motion or presence sensors. Helper House uses fictional sensors and its own level units (warmth 0–6, light dark/dim/bright) and never tells a family how to set a real thermostat or wire a device.

## What people can do, and what remains uncertain

**Kindergarten (about 5;6–6;3).** Levy and Mioduser, [*Approaching Complexity Through Planful Play*](https://ccl.northwestern.edu/2010/Levy%202010.pdf) (Int J Comput Math Learning 15:21–43, 2010; opened, text extracted), followed **six** kindergarten children for five sessions as they built a Lego robot's behaviour on a "behavior construction board": two conditions (touch sensor pressed or not) with an action arrow dragged beside each, then Go. Findings, opened:

- Children "conducted intensive and extended playful investigations" and their constructions "were planful and anticipatory".
- One transition was "a shift from viewing rules as one-time events to their view as recurring and continual descriptions of a process". **Design consequence: show every re-check, not just the first.**
- From the companion analysis it summarizes (Mioduser and Levy 2010, not opened): the children "required more adult support in the more complex tasks involving four condition-action pairs (or two rules)", and "children were able to do more than what they were able to say", with a gap of about one rule. **K gets one rule (two condition/action pairs) and no explanation is required.**
- The children reduced complexity by "pruning" (ignoring part of the logic) and "fusing" (merging rules). A missing *off* row is the natural mistake to design for.

**Early grades.** Hokayem, Jin and Yamaguchi, [*Feedback Loop Reasoning and Knowledge Sources for Elementary Students in Three Countries*](https://www.ejmste.com/article/feedback-loop-reasoning-and-knowledge-sources-for-elementary-students-in-three-countries-7779) (EURASIA J. Math. Sci. Tech. Ed. 16(2), 2020; abstract opened), interviewed **128** first- to fourth-graders in Japan, Lebanon and the US about predator and prey: "the majority of students used one-way causal reasoning" and "only a few students reasoned using two-way causality with multiple feedback loops". This was ecology, not machines, but it argues for putting the true loop (the action changes what is sensed) at school's top and older rungs, with the loop drawn, not inferred.

**Fourth grade and adults.** Brandes and Wilensky, [*Treasureworld*](https://ccl.northwestern.edu/papers/treasureworld/treasure.html) (opened; year not on the page), studied 19 fourth-graders exploring feedback and leave as an open question "at what age do children begin to respond to feedback … the way adults do". They report, citing Kempton (1986, **not opened**), that "many people believe that the thermostat is like a valve" and turn it up higher to heat faster. That is an adult misconception, and a good parent and teen rung.

**Middle school and teachers.** Hallström, [*Evaluating an Intervention to Improve Secondary Pre-Service Teachers' Conceptions of Feedback in Technological Systems*](https://journals.oslomet.no/index.php/techneA/article/download/4288/3942/18895) (Techne Series A 28(2), 2021; opened, five participants). It states that "there is virtually no research on how students of any age conceive of and/or learn about feedback" in technology education, and quotes Mioduser, Venezky and Gong (1996, not opened): middle-school students "phrased the control laws in phenomenal or behavioral terms (what is observed), rather than in functional terms". Hallström adds that feedback loops are "invisible" in the flow of information. **Design consequence: draw the information flow (sensor → rule → helper) every time it happens.**

**Gaps, recorded as gaps.** No study was found of under-fives and sensors on a screen, of a game teaching feedback to six- to eight-year-olds, or of tween or parent interest in automation puzzles. The KIBO sensor set (distance, light and sound) and its IF blocks for ages 4–7 come from a search summary and KinderLab's [product page](https://kinderlabrobotics.com/kibo/) (opened: "PreK through elementary", "IF/End IF Conditional programming blocks"; sensors not listed there). No outcome data for KIBO conditionals was found.

| Audience | What the evidence supports, with caveats |
| --- | --- |
| L | Cause and effect shared with a grown-up. No sensor concept |
| T | One action, one immediate response; something that "notices" her friend can delight without being understood |
| P | Pictured if/then in a story ("when it's dark, the lamp turns on"); choosing which picture fits, with the result shown |
| K | One rule with two condition/action pairs on a board (Levy and Mioduser); explanation lags construction |
| S | One rule with both its pairs (on and off); noticing a rule is re-checked all day; placing a sensor where it can see the right thing |
| U | The loop: an action changes what is sensed; a single threshold that makes a helper flicker. Feedback reasoning is uncommon before this (Hokayem et al.), so the loop is drawn |
| M | Two thresholds (a calm band), helpers that fight, describing real devices (MS-SYS-HW-31) and automation and work (MS-SOC-CE-45) |
| G | The valve misconception is common in adults (Kempton via Brandes and Wilensky) |

## On the island today

- **Stop and Go** (lap–preschool, Cozy Village; [GAMES](../../GAMES.md#stop-and-go)): the child *is* the controller, at the top level for two crossing lights. Its [deep dive](../stop-and-go.md) (PR #535, landed during this session) proposes level 7 **Smart light**, a school level where she picks the light's rule card ("green for the road with a car on the plate"), with its decision leaning to wait for this study; level 8 *Walk signal* waits on the safety reviewer.
- **Robot Path** (preschool–school, Tinker Lab; [GAMES](../../GAMES.md#robot-path)): a robot with no sensors running a fixed program; conditions are "a later language definition" in its [dive](../robot-path.md).
- **Sorting Machine** (proposed, [how-computers-work H1](RECOMMENDATIONS.md#how-computers-work-recommendations)): sensors and gates, one critter at a time, no time or feedback.
- **Machine Line** (proposed seed, [programming P5](RECOMMENDATIONS.md#programming-recommendations)): an order of machines transforms a toy; factory automation in the shapez sense belongs there.
- **Garden Grow, Light Lab, Chain Reaction**: cause and effect, beams and contraptions; nothing senses and responds.
- **Gap:** Stop and Go's light changes by itself on a fixed cycle, but nothing on the island senses and responds, re-checks a rule, or changes what it senses. The [rework](../../rework/README.md#learning-belongs-in-the-story) gives a natural home: the creature home base, and a new friend's comfort as the project.

## Similar games, apps and physical play

| Game or toy | Kind | How progression grows | Borrow | Leave out |
| --- | --- | --- | --- | --- |
| KIBO (KinderLab; [page](https://kinderlabrobotics.com/kibo/), opened) | Screen-free robot, wooden blocks, PreK–elementary | Sequences → repeats → IF blocks with sensors (from search summary) | Big tangible rule pieces; sensors as pictured parts | Hardware; nothing to copy at lap/toddler |
| Levy and Mioduser's behaviour board (research tool, opened) | Two-condition rule board for a Lego robot | One rule → two interrelated rules | **The board layout itself**: condition rows, drag an action beside each, Go | A real robot; open-ended tasks without a finish |
| [Autonauts](https://store.steampowered.com/app/979120/Autonauts/) (opened) | Colony automation, "Scratch-style programming" of workerbots | Upgrades widen bot intelligence; colonists add needs | Helpers that keep doing a job for a community | Survival framing ("require your assistance to survive"), open-ended sprawl |
| [shapez](https://store.steampowered.com/app/1318690/shapez/) (opened) | Factory automation; "no enemies, timers, or resource limits", "low-stakes" | Delivering shapes unlocks buildings; "optional wiring and logic" | Calm, permanent unlocks through delivery (fits the rework) | An infinite map; throughput as the goal; this is Machine Line's territory |
| [Opus Magnum](https://www.zachtronics.com/opus-magnum/) (opened; metrics recalled) | Machine-building puzzles for teens and adults | "simplest, fastest, and most compact solutions" compared | After success only, an optional comparison (how many clicks, how much warmth wasted) | Global leaderboards; the cost/cycles/area histograms are recalled, not seen |
| [micro:bit Thermometer](https://microbit.org/projects/make-it-code-it/thermometer/) (opened) and Sunlight sensor | Physical computing, "Beginner" | `while True:` loop + `if` | The forever loop made visible as a repeating check; the sunlight sensor as a night-light cousin | Text code; real wiring advice |
| [CS Unplugged Kidbots](https://www.csunplugged.org/en/topics/kidbots/) (opened) | Unplugged role play, ages 5–10 | Lessons from "Rescue Mission" to Mars | Children take machine roles | The page does not cover sensors; Be the Helper adds them |
| Unplugged equivalent: **Be the Helper** (this study) | Family role play | One rule → a calm band | One person is the thermometer calling "chilly!", another the heater who tucks a blanket on a teddy, and they discover the teddy gets too warm if no one says "warm now!" | Real appliances; any safety instruction |

The LEGO SPIKE Essential page was opened but is retired and does not state its sensors or programming; it is not used.

## What fits

- **A rule that keeps checking is a fun action** when the house visibly runs a day by itself and a friend reacts (the door swooshes for each friend, the lamp glows at dusk, the lizard friend stretches out in a warm patch). The learning purpose is the result: she does not open the door, she makes the door able to open itself.
- **The loop must be drawn** (Hallström, Mioduser et al.): every check pulses along a line from sensor to rule card to helper, and the sensor's reading shows as a big picture gauge.
- **A run is an observation, not a miss.** Following [Welcome Ways](engineering-design.md#a-first-games-ladder-welcome-ways): Watch plays a day; it never counts as wrong. The same failure twice glows the card to change and counts one hint. Whether a deliberate Check exists is a [decision](#decisions-for-the-developer).
- **No clock pressure.** The "day" is a fixed number of steps played at a steady pace, with Pause and Step. It is not a round-ending timer; nothing is lost while away, and no helper "breaks" between sessions.
- **Comfort, not need.** No creature suffers without a helper (the pet never creates neglect). The lizard friend is "a bit chilly" and fluffs up; the problem is "it would be nice if…", and supported completion reaches the same friendship.
- **Rework fit.** A helper she sets up stays in the creature home as a permanent unlock (the porch lamp keeps coming on at dusk at home), shown only for the helpers actually completed. This needs RW-era home infrastructure and is not part of the first build.
- **Does not fit:** a general robot-programming editor (Cue Studio and Robot Path own sequences), real-world appliance advice, surveillance framing (cameras watching people), robots as fighters (Gladiabots-style), job-loss simulation for children, or a timer on the day.

**Overlap test against Sorting Machine.** A Helper House goal must depend on **helper state carried from an earlier step** (the lamp still on in the morning because no row turns it off; the heater still running when the nook is already warm) **or on a reading the helper itself changed** (the lamp lighting its own sensor, the heater warming its thermometer). A twelve-step day alone does not pass: Sorting Machine's parade also checks several critters. Stated openly: levels 0–2 (place the eye, choose eye or sun) share their action with Sorting Machine's "choose the sensor" round; they are a cause-and-effect opening, and Helper House earns its identity from level 3, where a missing off row leaves the lamp on. If the developer prefers, levels 1–2 can fold into Sorting Machine and Helper House start at 3. The rule tests check the property for every authored level from 3 up.

## An answer for every audience

| Audience | First action | Deeper rung (a decision, not speed) |
| --- | --- | --- |
| **L**, under 2 | *None as automation, and why:* no sensor concept is expected. Existing cause and effect (Bubble Pop, Garden Grow's rain) serves; Helper House adds no lap level | — |
| **T**, 2 | Helper House **toddler entry (H0)**: tap a friend, it waddles to the door, the door's eye blinks and the door swooshes open by itself with a chime. Nothing to get wrong | Two friends arrive, one after the other; the door opens for each and closes behind them (the re-check shown, not taught) |
| **P**, 3 | **H1**: the door is asleep; drag its eye to the door, then watch three friends come in | Choose which of two pictured sensors wakes the door (an eye, not a sun) |
| **K**, 4–5 | **H2**: make the porch lamp come on when it gets dark; choose the sun sensor | **H3**: two rows (dark → on, bright → off); the lamp left on all morning shows the missing row |
| **S**, 6–8 | **H4**: the chilly lizard friend's nook: chilly → heater on, warm → heater off, and the warmth gauge rises and falls | **H5**: the night light flickers because its sensor sits under its own lamp; move the sensor to the window |
| **U**, 9–12 (school top) | **H6**: set the comfy line on the heater; predict (unscored) whether a higher line warms faster, then watch (the valve idea, tested) | **H7**: one line makes the heater click on and off every check; set two lines (on below, off above) so it runs calmly |
| **M**, 11–14 | **Helper House Cases** (H8–H9, school top): a greenhouse with a heater and a vent fan that fight; set lines so they never run at once and the plants stay in their band | An optional comparison after success: how many switches, how much warmth spent. What a 12- or 13-year-old would choose: factory and machine puzzles like shapez and Opus Magnum (recalled appeal, not studied); this belongs to `school`'s top levels, not a new band |
| **G**, play for themselves | The same Cases rendered at the `grownup` band (no new Lantern Lake title unless the developer wants one): three rooms on one thermostat-like controller, a fewest-switches optional score | — |
| **G**, play with the child | Co-play tip for H2–H5: the grown-up is **the weather** (drags the sun down, opens the window), the child sets the rules, and they watch together | Swap: the child makes the weather and the grown-up guesses what the helper will do |
| **G**, page card | **Be the Helper** (unplugged role play; see above) and **Helpers around us** (a conversation card: spot an automatic door, a light that comes on by itself, a crossing light, and ask "what does it notice? what does it do?"). For teens, one prompt from MS-SOC-CE-45: "What jobs do helpers do, and what do people still decide?" | Needs the existing practical-card review: no electrical, appliance or road-safety advice, and the crossing-light prompt must not instruct how to cross |

## Candidates and recommended order

| Candidate | Fun action | Learning goal | Audiences | Effort | New infrastructure |
| --- | --- | --- | --- | --- | --- |
| **Helper House** (new identity) · define first | Wire a helper to a sensor with picture rule cards, Watch the house run a day, a friend reacts | Sensor → rule → action; rules re-check; the action changes what is sensed; calm bands | T–M, G at school top | M–L | A discrete house simulator in `logic.ts` (steps, sensor readings, rule evaluation); rule card sockets via `drag.ts`; a gauge; no engine change |
| **Stop and Go 7: Smart light** (existing game, [its dive](../stop-and-go.md)) | Choose the light's rule card; plates under each road; watch cars use it | The crossing she ran by hand now runs itself | school window (the dive's decision 2) | S | None; the dive's own level. **This study's answer to that decision: build it**, since it passes the overlap test (a car left waiting forever is carried state a single classification cannot show). Fiction only, no claim about real signals and no crossing instruction |
| **Robot Path: a bump rule** (pointer only) | "When bumped: turn right" lets a robot find the star in a room without a program | Reactive versus planned behaviour (Levy and Mioduser's obstacle task) | school | M | Belongs to Robot Path's conditions definition after its recorded routine/couch decision; not defined here |
| **Machine Line** (pointer only) | Factory automation (shapez-style) | Order and transformation | school | — | Stays in the programming study's P5 |
| **Be the Helper / Helpers around us** (page cards) | Family role play and a sensor-spotting walk | Sensing, rules and feedback off-screen | P–G | S | Plain HTML; named practical-card review first |

## A first game's ladder: Helper House

### The model, stated once

One house, one day of **12 steps** (dawn to night and back), played at a steady pace with Pause and Step. Each step: (1) the world changes (the sun moves, a friend arrives, outside air cools); (2) **every sensor reads**, and a pulse runs to its rule cards; (3) each rule whose condition matches sets its helper; (4) the helper acts on the world. Readings are pictured levels: near/far for the eye, dark/dim/bright for the sun sensor, warmth 0–6 for the thermometer (a fictional scale; 2–4 is "comfy" for the lizard friend). A heater adds 1 warmth per step while on; the nook loses 1 per step toward the outside value while off. A lamp lights its own glow two levels (dark to bright), so a sun sensor placed inside that glow reads bright while the lamp is on. Rules with no matching condition leave a helper as it is, which is what makes a missing *off* row visible.

### Proposed levels and bands

| ID | Name | Bands | First round | What she decides | Done when |
| --- | --- | --- | --- | --- | --- |
| 0 | Hello door | toddler | A friend waits; tap it, it walks up, the door opens by itself | Nothing (cause and effect) | Three friends in |
| 1 | Wake the door | preschool, pre-K | The door's eye lies on the bench; drag it to the door | Where the sensor goes | Three friends come in by themselves |
| 2 | Lamp at dusk | pre-K | Lamp, two sensors (eye, sun) | Which sensor | Lamp on at dusk in a Watch |
| 3 | On and off | pre-K, school | One row given (dark → on) | Add the second row | Lamp on at night, off by morning |
| 4 | Chilly nook | school | Heater, thermometer, two empty rows | Which reading turns it on, which off | Warmth stays 2–4 after warming up |
| 5 | Where does it look? | school | Night light, sensor under the lamp: it flickers | Move the sensor | No flicker all night |
| 6 | The comfy line | school (top) | Heater with a line to set; unscored prediction first | Where the line goes | Warmth stays in the band |
| 7 | Calm heater | school (top) | One line: the heater switches every step | Two lines, a gap | Fewer switches than the one-line heater (a bound frozen in RA4) and comfy |
| 8–9 | Helper House Cases | school (top), grown-up | Greenhouse: heater and vent fan | Lines so they never fight | Plants in band, never both on; optional switch count after |

Levels are proposals; IDs, band ranges and orders are frozen only in the definition packet. Each finished helper may later appear in the creature home (rework).

**Mistakes and hints.** Watch is free: the day plays and the friend reacts truthfully (squints, fluffs up, fans itself), with a spoken reason ("The lamp is still on. Nothing tells it to turn off"). The same failure twice glows the card or socket that would fix it and counts one hint; "Show me" places one accepted card and counts one hint. Predictions (level 6) are never misses. A supported finish places the remaining cards and runs the day.

### A rule test

`logic.ts` exhaustively enumerates every board a level allows (sensors × sockets × rule cards × line positions; bounded and small) and checks: at least one accepted board; every accepted board meets the level's goal on every seeded day; the starting board fails; hints lead to an accepted board; **the overlap property** for levels 3 and up (some board that meets every single-step classification still fails the goal, because of carried helper state or a reading the helper changed); at level 5, with the level 3 rows (dark → on, bright → off), the under-the-lamp position flickers on and off every step after dusk and the window position does not; at level 6 a higher line never reaches comfy sooner than a lower one (the valve idea is false in the model); at level 7, with ±1 warmth per step and comfy 2–4, every one-line board switches every step and **exactly one** two-line board is accepted (on at 2 or below, off at 4 or above), so the level asks her to find that gap rather than choose among several; RA4 may widen the comfy band if a choice is wanted.

### Cost

M–L: a new `logic.ts` simulator and solver, `Graphics` house, helpers and gauges, rule cards with `drag.ts` sockets, a step player reusing Chain Reaction's run-and-replay structure, voice lines, how-to card and a ghost-finger `autotouch()` that places an accepted board and taps Watch. Placement: Tinker Lab holds 13 games and Welcome Ways is also asking for a slot, so a `landLayout` capacity check is needed (never smaller targets); Cozy Village (12, houses) is the alternative; the tracker's Skywatch Isles is still a proposed zone.

## Experience and presentation

- **First unsupported action:** the eye sensor lies on the bench beside a sleeping door with a dotted socket; dragging it lifts and wiggles at touch-down, and the socket glows as it nears.
- **Touch-down feedback:** rule cards and sensors are at least 100 units; the Watch and Step buttons press in and pulse immediately.
- **The loop, drawn:** each step a soft pulse runs sensor → card → helper; a matched card lights; the gauge needle moves. In portrait the house stacks above the rule board.
- **Replay variety:** seeded friends, weather and house colours; the day's events vary within the level's tested set.
- **Off-screen:** Be the Helper with a teddy and a blanket.
- **Speech:** `ctx.instruct` per level ("Make the lamp come on when it gets dark"); reasons are lines in `voice-script.ts`; navigation never requires reading.

## Decisions for the developer

1. **Identity and placement:** Helper House as a new game (recommended, since the overlap test separates it from Sorting Machine from level 3), and do levels 1–2 stay as its opening or fold into Sorting Machine, placed in Tinker Lab after a capacity check, Cozy Village, or a future zone?
2. **Accounting:** are Watch runs always free, with only repeated identical failures counting a hint (the Welcome Ways rule), or does a deliberate Check button count misses so adaptation has evidence?
3. **Toddler entry (H0):** worth a level, given no sensor concept at two, or leave toddlers to existing cause-and-effect games?
4. **Older reach:** register H8–H9 at `grownup` too, or keep them at `school`'s top only?
5. **Rework tie-in:** should completed helpers appear in the creature home as permanent unlocks once the home exists (RW-era), and which friend (a chilly lizard) carries the warmth levels?

## Build slices, in order

1. **RA1 — Define Helper House 1–4** (docs only): the step model, sensor and helper tables, round plans, voice reasons, accounting (after decision 2), layouts at 100 units in both orientations, the how-to card with level-scoped steps, the ghost-finger plan, the rule tests above and the overlap test, placement after the capacity check.
2. **RA2 — Build Helper House 1–3** (new-game tier): one scripted play, portrait screenshot.
3. **RA3 — Build level 4** (new levels on an existing interaction tier).
4. **RA4 — Define and build 5–7** (sensor placement, the comfy line, two lines).
5. **RA5 — Define Helper House Cases 8–9** and decide registration (decision 4).
6. **RA6 — Stop and Go 7 *Smart light***, through Stop and Go's dive (its build slice 7), now that this study recommends it; independent of the walk-signal safety review.
7. **RA7 — Be the Helper / Helpers around us** page cards, after the named practical-card review.
8. **Robot Path bump rule:** not a slice here; it waits on the Robot Path dive's conditions definition.

## What was built and what ran

Nothing was built. Docs only: the CSTA 2026 PDF, NGSS Appendix G and the Hallström and Levy and Mioduser PDFs were opened and their text extracted locally; the other sources are linked above with what was opened. Checks: `node scripts/check-links.mjs` and `git diff --check`. No typecheck, unit, browser, device, child, tween or parent check applies or was run; independent understanding of feedback, appeal at any age, and transfer to real devices remain unestablished.
