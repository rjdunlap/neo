# Clock Tower deep dive

*ID `clock-tower` · bands pre-K and school · levels 1–7 on 2026-10-11 · session `codex/clock-tower-deep-dive`, [PR 156](https://github.com/rjdunlap/neo/pull/156)*

## The game today

She turns a large clock and rings its bell to check the time. The learning purpose is connecting the two hands to hours and minutes, then using a time to make a choice. Four tasks complete a round; the shell awards one sticker, including with help. This is simulated time, never a real play limit or an appointment the player must keep.

Source read: `src/games/clock-tower/index.ts`, `logic.ts` and `logic.test.ts`; the game's how-to, voice lines, GAMES entry, IDEAS ladder rounds, browser case and recorded verification. No game was played in this research session.

| Level | Plan | Current bands | What she decides |
| --- | --- | --- | --- |
| 1 | Short hand only | pre-K | Which hour to show; long hand fixed at 12 |
| 2 | O'clock | pre-K, school | Set the hour and leave or return the long hand to 12 |
| 3 | Half past | pre-K, school | Long hand at 6 or 12, short hand between the hour numbers |
| 4 | Quarter past and to | pre-K, school | Set four quarter-hour positions; quarter to names the next hour |
| 5 | Read a routine | school | Which of three event pictures matches the shown time |
| 6 | One hour later | school | Move one hour forward from an o'clock or half-past start |
| 7 | Five-minute times | school | Count by fives to set a time such as 3:25 |

**Windows:** pre-K 1–4, school 2–7. Preschool, toddler and lap are not registered. Plans and seeded tasks already live in `logic.ts`; preserve level IDs and pins.

**Pools.** Hours draw from 1–12. O'clock gives twelve possible times, half-past modes twenty-four, quarters forty-eight. Level 3 asks half past with probability 0.75, so a round need not include both kinds. Level 4's four tasks cover all four quarter positions, including o'clock and half past. Level 7 asks only minutes 5, 10, 20, 25, 35, 40, 50 and 55 (ninety-six possible times); each task draws one minute from a different two-item group. All rounds reject duplicate target times. Level 6 draws a start and adds 60 modulo 720.

Level 5 draws four of six fixed events: breakfast 7:00, school 8:30, lunch 12:00, park 3:00, bath 6:30 and bed 8:00. Each task offers its event and two distractors with distinct clock times. That guarantees one answer in the data, but the clock alone cannot establish an arbitrary family's routine. No visible schedule tells the player those associations.

**Hands and input.** Radius 200; the outer zone above radius 120 controls minutes and the inner zone hours. The hand follows the pointer on touch-down and snaps on release. Hour position includes the minute fraction, and the hour release calculation subtracts that fraction. Minute snapping is circular, including across 12; moving minutes does not carry the stored hour into the next hour. This is a setting control, not a geared elapsed-time instrument. Pointer IDs, palm rejection, cancellation and outside release are handled; handlers belong to the scene's display tree. The ghost finger uses `demoAction`, adjusts minutes then hours and rings the bell, or taps an event.

**Accounting.** Hand adjustments are free; an incorrect bell check or event choice is one miss. Two misses on a task count one hint and show target hands or glow the right event. Each new task resets help. Wrong setting feedback reads shown and requested time; the later mode explains the one-hour change. No requested-help control exists. Clock Tower has no couch catalog entry, `control()` or couch bot. It has no journal source, kept creation or story result. Sticker seeds choose an hour and 0 or 30 minutes for a fixed small face; the hub face is 3:00.

### Known gaps and checks to plan

Slice 1 built on 2026-10-11 ([PR #165](https://github.com/rjdunlap/neo/pull/165)): gaps 2–4 now have a truthful four-answer card, free replayable sign, explicit five-minute speech and length/shape hand markings. Native pointer cancellation was also repaired with listener cleanup after a focused probe found the face listener never receives it. The filtered browser case reaches 7. The research observations below describe the pre-slice code; visible appointments and the exposure/explanation slice remain next.

1. **Level 5 needs visible evidence.** Its generic instruction asks what “we” do at this time; correctness depends on an unstated schedule. Change it to a fictional friend's appointments with visible, replayable times. Do not grade a child's home routine. Keep the saved level and the three-picture action.
2. **How-to finish and help are inaccurate.** The card describes a single answer ending the round, although there are four tasks. Its note says target hands appear when help is asked for, but they appear after two misses. Correct those statements, and bound level 7's open-ended step/finish before appending levels. The goal should cover reading and changing time as well as setting hands.
3. **Level 7 relies on speech for the target.** The proposed digital sign in IDEAS is not drawn in the game. `spoken` returns `3:25`, which device speech might pronounce differently. Add a persistent target sign with replay and an explicit spoken phrase such as “three twenty-five”; confirm actual device speech before claiming pronunciation. Retain quarter-past/to wording where it is taught.
4. **Clarify hand selection.** Any touch in the outer zone chooses minutes, even beside the short hand. Add consistent short/long hand markings and spoken guidance without changing that mechanic first. Colors alone should not explain which hand is which. The inner dead-center angle deserves a guarded rule in a later input fix if a probe finds it causes surprise.
5. **Geometry and interruption proof.** Twelve snap positions are about 85 units apart at the 164-unit minute tip and 104 at the rim; they are drag positions, not twelve tiny buttons. The whole face and the 120-unit bell are large. Review the helper ring, pet clearance and event choices in four logical views. Keep cancellation and leaving during chimes safe; use scene-owned waits, never a separate real-time clock.
6. **Tests read, not rerun.** Existing tests cover distinct attainable tasks, quarter coverage, five-minute choices, hour angles, event answer uniqueness and bot actions. They do not prove routine comprehension, rendered signs, hand selection geometry or four-task how-to accuracy. Extract new rules, not a second copy of the game, when a slice needs them.
7. **Existing browser evidence has a limit.** VERIFICATION records level 7's typecheck, targeted tests and first/top ghost-finger play on 2026-10-10, but no portrait look or actual speech. At research time, the `woods` suite's `clock` case stopped at 6; a later level slice must extend its bounded filter and mode handling. Do not rerun old suites during this docs session.

## Similar games

Six references inspected on 2026-10-11. These are publisher descriptions and rules, not evidence of learning effectiveness. The ladder below is our design inference. Math Clock's main page and Learning Resources' product page returned 403 on direct open; the former's official tutorial opened, and the latter is search-description only.

| Reference | Kind | How progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Teaching Clock](https://www.topmarks.co.uk/time/teaching-clock) | Browser teaching tool | Analog/digital displays, different time steps, earlier/later and 12/24-hour formats | Show both representations and change the question while keeping one clock | A live clock or all settings exposed to a small child |
| [Math Clock tutorial](https://apps.mathlearningcenter.org/math-clock/info/info-how-to.html) | Classroom virtual manipulative | Geared/free hands, minute jumps, elapsed-time shading and fraction overlays | Keep an interval visible; show the hour moving with minutes | A full drawing toolbar, sharing codes or assuming a free-hand setter measures rotations |
| [What's the Time, Mr. Wolf? rules](https://www.orchardtoys.com/orchardtoys/fs/pdf/whats_the_time_mr_wolf_instructions.pdf) | Physical classic | Beginner clock matching, setting hands and saying the time; two board-game variants | A visible model before a request, turn-taking and a purpose for setting the clock | Racing to fill a board, the wolf taking collected cards and a winner requirement |
| [Time Activity Set](https://www.learningresources.com/item-time-activity-set) | Physical educational set; search description only | Moving hands, analog/digital puzzles and daily-activity cards | Small varied appointment cards and off-screen manipulation | Importing a large worksheet/card set as one screen; publisher age as readiness proof |
| [Set the clock](https://www.tellingtimeapp.com/) | Touch educational app | Hours, halves, quarters and fives; setting, reading, comparing and moving forward/backward | Mix representations and direction of change, with spoken assignments | Champion/medal claims as mastery; nine separate modes before the game needs them |
| [I Can Tell Time](https://apps.apple.com/us/app/telling-time-for-kids-clock/id1005958411?platform=ipad) | Current touch app; developer's store description | Hours through individual minutes; alternate reading, finding and dragging; free spoken exploration | Replayable readings and varied actions inside a familiar face | Streaks, reminders, premium gates and reports that imply mastery from completion |

The current GAMES entry also names teaching clocks and JumpStart clock activities. Keep that historical inspiration; this session does not independently establish those older activities' ladders.

**Learning references.** [1.MD.B.3](https://www.thecorestandards.org/Math/Content/1/MD/B/3/) motivates the hour/half-hour bridge; [2.MD.C.7](https://www.thecorestandards.org/Math/Content/2/MD/C/7/) motivates five-minute readings and explicit a.m./p.m. context. [3.MD.A.1](https://www.thecorestandards.org/Math/Content/3/MD/A/1/) includes minute readings and interval problems, with a number-line example. They support a progression from points in time to durations, not a curriculum-alignment claim. Quarter/half-hour intervals are a scaffold toward the last standard; individual-minute precision is not required for the proposed slices.

## What makes sense here

Keep turning the hands and hearing the tower answer. Grow quantity through seeded appointments, times and explanations, then grow decisions through reversing a change, finding an endpoint, measuring a duration and fitting a visit into a schedule. One complete round remains four requests and one sticker. Nothing depends on the device's actual date/time, saved obligations or punctuality.

Memory Match's proposed clock cards recognize equivalent representations; Clock Tower manipulates and reasons with times. Day by Day owns weeks and weather, so months and seasons belong there. Mail Carrier owns walking a route; an appointment puzzle can use a visit picture without building another map. Use current props and critters rather than importing art. No new shared timing, save or creation system is needed.

## Proposed ladder

### Fresh content inside existing levels

- **Support first, levels 1–7:** truthful four-task how-to, bounded mode lines, hand markings, target sign and free replay. Say “short hour hand” and “long minute hand”; a replay or adjustment is never a miss/hint. The first task explains the control with a model; an always-visible answer model is reserved for level 1 or earned help, not silently shown on every older task.
- **Hour/half/quarter coverage:** retain all twelve hours; ensure level 3 has at least one half-past request, and rotate target positions across seeds. Keep level 4's four quarter positions. A rule test verifies required exposure and distinct reachable targets; do not add more tasks merely to lengthen play.
- **Level 5 appointment boards:** the existing six events become fictional appointment data, not universal routines. First board: lunch 12:00, park 3:00, bath 6:30, visibly named by pictures and analog/digital time labels; the large clock asks which appointment matches. Each task keeps its three time labels visible and tappable for replay. Start with current art; later add a friend's tea, painting, music and a picnic. Select three distinct times from o'clock/half-past, then four tasks with distinct targets across the round. Display each task's appointment set; never expect memorization of a prior board. A rule test checks one match and all speech/labels agree. Hearing a label is free support, even when it makes a match easy.
- **Level 6 explanations:** after a check, show the old clock faintly beside the new hour position and say that minutes stayed the same. Keep 11→12 and 12→1 cases in the pool; test wraparound explicitly. Wrong feedback can distinguish moving only minutes from moving the hour the wrong way.
- **Level 7 examples:** keep the eight new minute values, varied hours and large ring. Add spoken fives when help appears and a short arc from 12 to the target mark. Mark 0 at 12 for digital minutes and explain that a whole turn is 60; avoid an unexplained “60 minutes” sign beside a `:00` answer. Test target sign and speech from the same task data.
- **Stable art:** the icon and sticker keep their current face and seed behavior. New appointment content never changes old stickers. Code-drawn scenes (a music rehearsal or picnic clock) may follow as content, with the same input zones and enough clearance; scenery is not another level.

### New levels on top

Proposals after 7, never renumbered. Keep pre-K 1–4 and school minimum 2; grow the school maximum only as accepted levels are built. Level 8 is simpler than 7 in minute precision: place it with `order`. Levels 9–11 keep half-hour quantities so reasoning grows without finer fingers. None is a countdown.

| Level | Name | Band window | First round and decision | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- |
| 8 | One hour earlier | school | Clock shows 4:30; set 3:30 for a friend's earlier visit. Reverse level 6's change; four requests | A wrong check reads both times and explains backward one hour, minutes unchanged; two misses show target hands, one hint per task | `(from + 660) % 720`; unchanged minutes; wraparound and distinct tasks; starts use 0/30 minutes | S: reuse hands/bell, new instruction/explanation, `demoAction` target unchanged, scoped card and bot |
| 9 | Half an hour from now | school | Painting starts at 3:45 and takes half an hour; set 4:15. Four starts at quarter positions, including crossing the hour | Free adjustments; wrong check counts one miss and shows a spoken +30-minute arc; two misses target hands | Endpoint `(from + 30) % 720`; starts cover crossing/noncrossing; target attainable at quarter snaps; hour moves when minutes wrap | S–M: existing setter plus a duration sign and explanatory arc; final-time equality, no rotation counting; new bot mode |
| 10 | How long? | school | Start 3:00, finish 5:30 on two fixed clocks. Choose a duration with separate hours (0–3) and half-hour (0/30) controls, then ring the bell; four intervals | Choices reversible until check. Wrong check explains the chosen duration/end; two misses show hour hops then the half-hour and glow the required controls, one hint per task | Store absolute start/end minutes for a stated same-day interval; positive durations 30–210 in steps of 30; unique answer; full turns cannot collapse to zero; picker reaches every task | M: two clock drawings and at least 100-unit picker controls; a number-line/strip worked example; new touch bot; portrait and cancellation review |
| 11 | Time for a visit | school | Friend is free 2:00–3:30, visit takes 30 minutes; choose among 1:45, 2:30 and 3:15, then set the big clock to the chosen start. Four requests | Replay availability and duration freely. A wrong choice says “before our friend is free” or “finishes after”; two misses glow the valid start. Setting mistakes share the task's single hint count | Absolute same-day interval; valid iff start ≥ opening and start + duration ≤ closing, inclusive boundaries; exactly one valid candidate; completion requires chosen start set correctly | M: three appointment targets and staged choose/set flow; quarter snapping, explicit interval strip; bot picks then drags; no Mail Carrier map or save changes |

### Later horizons to define

**12, Morning or evening?** Two contextual appointment cards can share 7:00, one explicitly “morning” and the other “evening”; choose the requested visit. Say the period, display a.m./p.m. with replay and show both contexts. A clock face alone cannot decide. Before building, define noon/midnight wording and exactly how it changes the skill from level 5; it is easier than 11, so `order` places it. A future test must distinguish absolute day minutes (0–1439) from face minutes (0–719), including 12 noon versus 12 midnight.

**13, To the minute**, and **14, A longer timetable** remain sketches for later elementary play. Sixty angular stops on the present face are about 17 units apart at the tip. If individual minutes are useful, keep a broad coarse drag and add large ±1-minute controls; never make sixty tiny targets. A timetable must state its day/period, permit replay and make more than one valid plan acceptable. Define after someone plays the interval and visit slices, with a band/order review rather than a silent school-window expansion. Twenty-four-hour conversion and travel across dates wait there too.

### Younger-band openings

**Preschool 1–1 candidate, decision:** one hand, four spoken o'clock requests, a persistent small model face, and large clock/bell. The skill is copying an hour position, not independently telling time. Support is visible from the start, so do not count its model as a hint or claim mastery; ordinary round misses still count incorrect confirmations and two misses glow the target. No new ID or level-order change needed. Rule proof covers twelve hours, the fixed minute hand, attainable targets and registry/land fit; add a person check for radial hand selection, model copying and speech. Pre-K should retain its current request support unless separately changed.

**Toddler and lap:** not openings of the present level 1. Routine matching at level 5 cannot become a low-end window without passing harder saved IDs. A pat-to-chime toy overlaps Jelly Drums, so prefer that game unless clock-hand manipulation has a distinct observed use. No younger band is added by this plan alone.

### Levels below level 1 (waiting on the level-order decisions)

| Sketch | First round and decision | Mistakes/help | Rule proof and cost |
| --- | --- | --- | --- |
| Copy the hands, preschool | Big clock, visible model at 2:00; turn the short hand and ring; two model requests | Wrong check names current hour; two misses glow target, copying support free | Model and target agree, long hand fixed; reuse setter/model art; omit this separate sketch if the preschool model opening is accepted |
| Turn and hear, toddler co-play | Free short-hand turning; bell names and chimes chosen hour; a large Done button finishes after at least one turn | Any chosen hour welcome, no misses/hints; parent points to a new number | Every selected hour representable; repeated ringing does not auto-check an unstated goal; bot turns then Done |
| Morning pictures, toddler | Replay two visible fictional appointments, choose one and hear its time; two freely chosen visits finish | No correct family routine or penalty | Every choice advances and labels agree; overlaps Day by Day/Goodnight Room, define a distinct reason before building |

No numeric IDs assigned. These are not easier tasks appended after school puzzles; they wait on the shared ordering/mode decisions. Lap cause-and-effect chimes stay in Jelly Drums.

### Left out on purpose

Races, alarm countdowns, real-time waiting, lateness penalties, compulsory routines, streaks, a running second hand as distraction, or deadlines that end a round. No negative duration inferred from a bare 12-hour face; no guessing how many rotations a drag meant. Roman numerals, time zones, daylight saving and calendar arithmetic add reading or rules before this game's useful interval choices are established. A generic fraction clock overlaps Pet Kitchen and Memory Match unless the action specifically measures part of an hour. Do not build a saved schedule, calendar, journal or couch system for these four-task rounds.

## Decisions for the developer

1. **School levels 8–11:** lean yes to backward change, half-hour endpoints, a stated duration picker and fitting a visit; preserve minimum 2. Accept the precision inversion at 8 after five-minute level 7 or wait on explicit ordering. The elapsed-time picker is a new interaction and needs its full definition and checks.
2. **Preschool 1–1:** lean model-supported copying with one hand, rather than an unsupported telling-time claim. Add only after band/land checks; a child's comfort is unjudged.
3. **Morning/evening and precision horizons:** lean define a.m./p.m. context after the appointment slice, then individual minutes and longer schedules only after a person plays intervals. Decide band and ordering before assigning a built maximum beyond 11.

The first support/content slices need none of those decisions: they repair the evidence and wording in current modes without moving levels or pins. Keep couch absent and sticker/save behavior fixed.

## Build slices, in order

Each is a later session. Ready slices improve existing play; decision slices stay proposals.

1. **Built 2026-10-11: truthful words and control support** ([PR #165](https://github.com/rjdunlap/neo/pull/165)). Four-task finish, accurate automatic-help note, level-7 bounds, persistent target sign/free replay, explicit time speech and hand markings. Rules for labels, speech and band ceilings follow `PLANS`; pin unchanged icon/sticker behavior. Tier: existing interaction fix, typecheck, targeted rules/how-to, one filtered `woods WOODS_ONLY=clock` regression and `fingerdemo` at 7 for demonstrated control/sign clearance; one portrait look fills the recorded visual gap. Add level 7 to the browser case when verifying it, without broadening to other games.
2. **Ready: level 5's visible appointments.** Keep three picture choices; each has a time label/replay, with fictional schedule wording and distinct seeded target times. Start with six existing pictures, then four new appointments in a separate art/content session if needed. Tests prove evidence, speech and unique matching. Tier: existing-game fix plus one filtered level-5 play; `fingerdemo` if bot/targets change. Fresh art only: content tier, typecheck/rules and one screenshot.
3. **Ready (rules half claimed 2026-10-15, branch `claude/clock-tower-coverage`: guaranteed half past at level 3, wraparound starts at level 6, in `logic.ts` only; the animated explanations and level 7 examples stay open): explanation and variety at 3, 6 and 7.** Required half-past exposure, wraparound cases, fives and hour-change demonstrations. Keep four tasks, sizes and current modes. Tier: rules-only changes use typecheck/rule tests; animated explanation changes need one affected regression and ghost-finger play. A failing old-rule comparison should prove any generator fix.
4. **Decision: level 8, one hour earlier.** Small plan, wraparound rules, voice, scoped how-to, bot and bounded browser filter. Tier: new levels, typecheck/rule tests, one new top-level play and `fingerdemo`; build only if shared files/assets change.
5. **Decision: level 9, half an hour from now.** Destination setting with quarter snaps and an arc explanation, preserving the independent setter. Tier: new levels, targeted rules, one top-level play and ghost finger. Do not add geared rotation tracking to this slice.
6. **Decision: level 10, how long?** Finalize picker/strip layout, implement interval arithmetic, reversible choices and worked help, plus its bot. Tier: new interaction, typecheck/unit tests, one filtered first/top-level play with wrong answer/hint and one portrait screenshot; build if shared rendering changes. No clock read from wall time, persistence or navigation change.
7. **Decision: level 11, fit a visit.** Defined availability/duration data and uniquely valid candidates, choose/set stages, bot and explanation. Tier: new interaction, same filtered checks; accept boundary-fitting visits. No new map.
8. **Decision: preschool 1–1.** Model support, band/inventory counts, scoped card, registry/lands rules and a person check. Tier: younger-band opening plus one filtered play/demo if model behavior changes. Pre-K and school ranges unchanged.
9. **Define later:** morning/evening, minute precision and longer schedules, then below-level-1 entries when ordering is settled. No new shared helpers before a concrete implemented need (Memory Match may later reuse the small face; review both games before extracting it).

Every implemented level needs its description, voice, card lines, seeded properties and bot. Use normalized face minutes only for displaying hands; future duration/period tasks carry absolute start/end values. All four-task rounds finish through the existing shell.

## What was built in this session

Nothing: research and ideation only. Updated this write-up, tracker, idea rows, roadmap and verification log. Research sources and local document links/anchors checked; `git diff --check` ran. No code/tests, typecheck, build or browser play. Actual iPad speech, finger comfort, family routines and a child's understanding remain unjudged.
