# Tide Tables

<!-- generated: from src/games/tide-tables; edit the text below the end mark (npm run game-docs) -->

**ID:** `tide-tables` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** reading a table, comparing measurements, planning with constraints

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–2 |

| Level | Plays like |
| --- | --- |
| 1 | Find a time: fit three jobs to the tide heights. |
| 2 | Make room: fit the heights and the order of jobs. |

<!-- end generated -->

**Starts as:** read four tide heights and tap a time for each of three harbor jobs.

**Grows into:** make room for a picnic that needs to happen before the sketch or after the boat float.

## Design notes

The fictional harbor has two boards per level. Each time fits one job. Tapping a time with a job selected places it there and lifts any occupant. Undo restores the whole previous draft. Tapping a time without a selection reads its height and selects any job already there.

Check accepts every fitting schedule and replays its three jobs in time order for one sticker. A partial draft gets a reminder. Each distinct invalid full draft counts once, with feedback on the first unmet condition. Help and the glow after two misses point to one move toward the schedule that keeps the most current placements. The same hint can replay until the draft changes. [Definition](../definitions/tide-tables.md)
