# Longer play, personal goals, and the next prototypes

Roadmap review, 2026-10-06. **Proposal only; no runtime changes.** The developer's daughter is not yet one, an iPad is not readily available, and the immediate audience for new prototypes is the grown-up playing in a desktop browser. Child observations and physical-device checks remain necessary for judging child readiness, but are not prerequisites for building the next proof of concept.

## Recommendation

Following the Mario Party discussion, build **Island Party with three next-game choices** first: a six-stop session using existing games, alternating choosers, a shared goal, and quick transitions. The [party and Switch follow-up](PARTY-AND-SWITCH.md) specifies this horizontal slice and a separate controller/TV milestone. Then build **Grown-up Play with a Penguin Slide challenge course** as the vertical slice: five boards, a saved personal best, and a clear ending. Try scoring in Bouncy Launch next, then build one small pet room with a display for a creation or keepsake.

The question for these prototypes is: **Would the grown-up choose to play again because there is something interesting to improve, discover, or make?** More minutes played or stickers accumulated does not answer that question.

## What the current implementation explains

- The catalog already contains 67 games. Finding the next game matters, but another batch does not directly address interrupted play or repeated rewards.
- `GameScene.finish()` saves every completed round and adds a sticker, then `celebrate()` blocks the board with a full-screen celebration. Its sequential waits total about 3.7 seconds before the replay/home buttons are created, followed by their entrance animation. Replaying creates a new scene. This is code inspection, not a measured play-session duration.
- Several games already contain multiple tasks inside a round. Penguin Slide has two or three boards per round; Bouncy Launch has three to five successful launches, depending on the level. Extending an internal sequence can improve continuity without removing the ordinary round reward.
- `RoundResult` exposes only misses and hints. The shell adds level, elapsed seconds, and date; only ten recent rounds per game are retained. These are adaptation records, not a durable record board. The saved elapsed time includes instruction/animation time, so it is unsuitable as a fair speed score.
- Sticker records contain game, seed, date, and optional placement. There are no unique achievement identities or performance records. Repeated play can therefore add more variations of the same game's sticker without demonstrating a new accomplishment.
- One local save owns the child's profile, pins, adaptation, story progress, and stickers. Adult experiments currently share that progress unless conducted in a separate browser context.

Relevant code: [GameScene](../src/app/scenes/GameScene.ts), [game contract](../src/games/types.ts), [save model](../src/progress/save.ts), [store](../src/progress/store.ts), [Penguin Slide rules](../src/games/penguin-slide/logic.ts), [Bouncy Launch rules](../src/games/bouncy-launch/logic.ts).

## What the research supports

These findings inform design choices; they do not establish that a particular feature will work in Puddle Island.

| Evidence | Finding and limit | Design implication for this project |
| --- | --- | --- |
| [Ryan, Rigby & Przybylski, 2006: The Motivational Pull of Video Games](https://www.rochester.edu/warner/lida/wp-content/uploads/2022/11/02bfe513dd59366750000000.pdf) | Four studies associate perceived competence and autonomy with enjoyment; the multiplayer study also examines relatedness. This does not test our games or infant play. | Give players a choice of goals, understandable controls, and visible improvement. |
| [Sailer et al., 2017: How gamification motivates](https://doi.org/10.1016/j.chb.2016.12.033) | In an experimental task, the combination of badges, a leaderboard, and performance graphs increased perceived competence and task meaningfulness. Elements were bundled, so this does not isolate a leaderboard's effect. | Scores and achievements are reasonable experiments when they explain an accomplishment. A story alone is not a guaranteed substitute. |
| [Li, Hew & Du, 2024: meta-analysis and systematic review](https://link.springer.com/article/10.1007/s11423-023-10337-7) | Across 35 interventions and 2,500 participants, the average intrinsic-motivation effect was small (Hedges' g = 0.257), with substantial variation. The review also reports discomfort among lower-ranked students on public absolute leaderboards. Educational interventions do not directly predict leisure-game enjoyment. | Test the actual play loop. Begin with personal records; add social comparison only if people want it and comparable challenges exist. |
| [UNICEF RITEC Design Toolbox, 2024](https://www.unicef.org/childrightsandbusiness/workstreams/responsible-technology/online-gaming/ritec-design-toolbox) | Its framework draws on 787 children, mainly ages 8–12, across 18 countries, and includes autonomy, competence, creativity, and relationships. It is not evidence about babies. | Keep making, choosing, and cooperative goals alongside score challenges as older play develops. |

Choosing personal bests before public rankings, and choosing five boards for the first course, are **project design judgments**, not conclusions experimentally established by these sources.

## Separate the kinds of goals

| Goal | Example | Proposed behavior |
| --- | --- | --- |
| Immediate action | Slide around a rock and collect a fish | Fast feedback within the activity. |
| Complete a run | Finish five boards on an illustrated route | Progress stays visible; small transitions between boards; one full ending. |
| Improve a performance | Finish the same course in 27 slides instead of 31 | Local personal best and the underlying numbers; no arbitrary global score. |
| Earn a unique achievement | Finish a named course; solve its five boards at the shortest-route total | One stable achievement per condition, with its requirement visible beforehand. Repeating improves the record rather than adding identical achievements. |
| Make something lasting | Display a drawing, picnic photo, or course memento in the pet's room | A personal destination and a reason to revisit creations; free starter furnishings. |

Keep ordinary stickers as repeatable decorations. Do not delete duplicates or retroactively treat old round history as evidence of an achievement: it lacks the required metrics. A later tray view may group similar stickers while preserving individual seeds, ownership, and placements. Currency conversion and random rare rewards are unnecessary for this experiment.

## First vertical slice: Penguin Slide course

**Fun action and skill:** plan an ice route, slide around obstacles, collect fish, and revise the route. The adult goal is to finish a course and then use fewer slides on a replay. This measures performance on that course, not general mastery.

**Entry:** a desktop-friendly Grown-up Play launcher with direct game/course selection, readable rules, and a clear return. Use a separate local adult save slot, including records and rewards, so testing never changes the child's pins, adaptive history, stickers, story, or band. This is one adult sandbox, not an account system or a new developmental band. Backups and resets must make their scope explicit.

**First course:** five fixed, versioned boards using the existing rules, curated from tested seeds and checked with the existing shortest-path solver. Start with the top modes; make the route choices more interesting within readable board dimensions if adult play finds them trivial. Do not renumber saved child levels. Five to ten minutes is an initial pacing hypothesis to measure, not a timer or a promise that current boards supply enough depth.

**Continuity:** after a board is solved, show a brief in-place response and move to the next automatically, without a restart tap or full sticker screen. Offer pause/leave throughout. The entire course is one round, just as an existing multi-board round is one round: call `ctx.finish` once and award one sticker in the adult slot, including with help. A course adds no per-board sticker awards. At the end, show total slides, best, achievements, Replay this course, and Back; starting another run is deliberate.

**Score:** lower total slides is better. Count each successful movement, including movements later undone; blocked taps and the undo button itself do not add slides. Display the count and the solver's minimum for the course. Example: `31 slides · course minimum 25 · your best 29`. Do not convert exploration into adaptive misses or penalize elapsed thinking time. Preserve undo and hints. Any revealed directional solution help, including automatic hints, marks the run as assisted. Keep assisted and unassisted records separate and plainly labeled; both can complete the course and earn its ordinary completion reward.

**Achievements:** start with two known conditions: complete the named course (with support allowed), and complete it at the solver minimum without revealed solution help. Award each once. Replay knowledge is allowed; a same-course record is not evidence of solving an unseen puzzle. A fresh course is a separate choice and record.

**Persistence:** save board boundaries, accumulated metrics, assistance state, and completion/award identity. Leaving mid-board restarts that unfinished board on resume; completed boards remain. Carry its attempted-move count and any revealed help forward so reloading cannot erase attempts or assistance. Record board identity and the course/rules version; compare only the same course, difficulty, rules, and support category. Preserve old records as old versions when rules change. Bound saved courses and history; begin with a small fixed course list, one in-progress run, one best per category per course, and the last ten runs.

**Implementation seam:** add only the typed challenge data this pilot needs to the game/shell result boundary. Keep normal miss/hint accounting and shell-owned saving/rewards. Select the appropriate store context before entering a scene. Do not simply use `recordRound(..., false)` on the child's store: that still appends adult rounds to the child's history. A supplied seed must reconstruct the same boards independently of decorative RNG consumption; verify this rather than assuming the existing shared `ctx.rng` suffices.

**Done when:** a grown-up can enter from the normal app, finish the full course without restarting between boards, understand and improve the score, use support, leave/reload/resume, and revisit the record. Browser checks must cover undo accounting, automatic help, duplicate finish/reload awards, course versions, backup/restore, both orientations, return navigation, and isolation from the child's save. Run the usual typecheck, unit, build, affected browser, and production offline checks for the implementation. Device validation remains separately open.

## Broaden only after playing that slice

1. **Bouncy Launch target course.** Test the shared entry/results with a different action: a fixed sequence of target clouds, a longer continuous round, and a visible count of launches needed to reach them. Every landing stays soft and retries remain available. Use per-course attempts as the initial personal record; keep unlimited free launches as a separate toy mode. Do not score raw distance, since always pulling hardest is not an interesting optimization in the current rules.
2. **Small pet room.** Build the already-proposed room with six free furnishings and a display for an existing sticker or known keepsake. Then add one saved creation medium, such as a Stamp Studio picture, before both drawing and music. Revisit/rearrange is the goal; no repetitive currency grind. The arcade should remain playable without the room.
3. **Connected project.** Extend the existing picnic pattern with one new consequence: a created picture, route, or tune visibly appears in the ending. Use the proposed typed story result only when this concrete episode needs it. Adult browser observations can guide the prototype now; child comprehension remains unverified until observed.
4. **Further game depth or a themed zone.** Choose a richer puzzle/construction family from the elementary roadmap after the play loop is evaluated. A whole new zone or a large batch is not needed to prove scoring or continuity.

The three-choice party route now precedes these scored courses; it can use ordinary completion results for a shared goal. Reuse the minimum scoring contract after the second scored game establishes what is actually shared. Preserve distinct units: slides, launches, and guesses should not be added into a universal island ranking.

## Leaderboards and repeat play

Start with **My records**: recent runs and a personal best for a comparable course. A local pass-and-play family board is a reasonable next experiment once a second person wants to compare results. It should use explicit player names, identical course versions, and support categories; never invent rivals or scores.

Public online rankings are later work because they require a service, identity, score validation, and rules for comparable runs. They add little to a single-player prototype. They are not ruled out for a future adult mode. No daily reset, streak, required return, or loss of progress is needed to make a record worth beating.

For existing short free-play rounds, a later opt-in **Keep playing** setting could replace the blocking celebration with a small saved-sticker acknowledgment and another round. Each completed round would still earn its sticker and save once, and the grown-up session setting would still own goodnight. Test this on selected games first; story returns and games with meaningful endings need deliberate behavior. The challenge-course pilot already removes repeated restart taps within its run without changing all 67 games at once.

## How to judge the prototypes now

Compare a current short round with the proposed course in a few desktop sessions. Record actual duration and restart/menu interruptions, whether the goal and score were understandable, whether the adult tried a different strategy, and whether another run was chosen voluntarily. A useful result can also be “five boards were repetitive; three deeper ones felt better.” Do not optimize for session length alone.

Treat browser playability, adult enjoyment, educational content review, and child/iPad validation as separate outcomes. Keep physical touch, device speech, first-touch audio, installation, and child understanding on the verification backlog without blocking browser proofs of concept.
