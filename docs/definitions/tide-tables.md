# Tide Tables, levels 1–2

**Built:** levels 1–2 (PR #2013), grown-up touch play in Lantern Lake. [Oceans study](../deep-dives/subjects/oceans.md#build-slices-in-order) · [Placement decision](../archive/DECISIONS-2026-11-17.md#games)

## What you do

Take the harbor keeper's job cards, read four time-and-height rows, and make a plan for one helper. Tap a job, then a time. When all three jobs fit, watch the keeper work through the plan in order. The puzzle asks players to compare numerical tide heights and coordinate several conditions across one schedule. [Tide Line 6](tide-line-5-6.md#level-6--read-the-chart) reads a curve and answers jobs separately. Here all jobs share the same four time rows, and moving a flexible job can free the only suitable time for another.

Use stable level IDs 1 and 2 and the `grownup` band only. Use Tinker Lab as the learning region and Logic as the challenge. Add one Lantern Lake tile through existing land paging, including the usual return to its originating page. Use the classic round contract for level progress and one sticker. A schedule is round state and carries no economy, inventory, streak or saved plan.

## The harbor boards

Show **Fictional harbor** near the table. Each printed row describes the water at its listed time only. Heights are metres on the game's harbor gauge, with all comparisons exact and inclusive. Use integer tenths in the rule data. Each job reserves one whole row and every row fits at most one job because there is one helper. The table already spaces these jobs apart. The puzzle uses the four listed slots and never asks for a time between them.

The three pictured jobs are a rock-pool sketch (R), a toy-boat float (B) and a picnic setup on the upper terrace (P). The selected card shows its condition in plain language with the number and unit. The terrace accepts any height on these boards. On each round, use the seeded RNG to select one of the two authored boards for that level. Redisplay the same table, jobs and draft through resize.

| Level and board | Times and heights (metres), in row order | Conditions | Valid schedules, by row number (R, B, P) |
| --- | --- | --- | --- |
| 1A · Find a time | 07:00 / 1.0 · 11:00 / 3.0 · 15:00 / 2.0 · 19:00 / 4.0 | R at most 2.0 m. B at least 3.0 m. P any free row. | 8, e.g. (1, 2, 3) or (3, 4, 1) |
| 1B · Find a time | 07:30 / 3.2 · 11:30 / 1.2 · 15:30 / 3.0 · 19:30 / 2.0 | R at most 2.0 m. B at least 3.0 m. P any free row. | 8, e.g. (2, 1, 3) or (4, 3, 2) |
| 2A · Make room | 07:00 / 2.0 · 11:00 / 4.0 · 15:00 / 1.0 · 19:00 / 3.0 | R at most 1.0 m. B at least 3.0 m. P strictly before R. | 3: (3, 2, 1), (3, 4, 1), (3, 4, 2) |
| 2B · Make room | 07:30 / 1.0 · 11:30 / 3.0 · 15:30 / 2.0 · 19:30 / 4.0 | R at most 1.0 m. B at least 3.0 m. P strictly after B. | 2: (1, 2, 3), (1, 2, 4) |

Level 1 opens with the sketch selected. The first instruction names the height column and the sketch threshold. After that, the player can place jobs in any order. Level 2 puts the ordering condition on the terrace card with the related job's icon. In 2B, 19:30 has enough water for the toy boat, and putting it there leaves no time after it for the picnic. Moving it to 11:30 leaves two valid terrace choices. This is a planning conflict the keeper can explain after Check.

## Revision, feedback and credit

All three job cards stay visible in the tray with their assigned time when placed. Tapping a row with a selected job assigns or moves that job and returns any displaced card to the tray in one edit. Undo restores the previous complete draft, including the displaced card. Tapping an already assigned row for the same job does nothing. With no selection, tapping a row reads its time and height and selects and describes any job there. Previewing a row, trying a placement, moving a card or undoing is free. Keep selection clear in both portrait and landscape.

Check on a partial board names the first unplaced job, free. Check on a complete board tests R's height, B's height, then the order rule. Count one miss per distinct invalid complete schedule within a round and explain the first failing rule using visible evidence, for example, “Seven thirty has enough water for the boat. There is no picnic time after it.” Repeating a submitted arrangement can replay that explanation. The second counted miss gives one assisted hint. The Help button can also request a hint. Highlight the recommended card and its target time row, and name the reason. Repeating the current hint without editing replays it free. Count each new hint once.

For a hint, enumerate legal schedules and choose the one preserving the most current placements, with ties broken by row order for R, then B, then P. Point to the first job that differs. Keep this recommendation stable until the draft changes. Moving a suggested job into its row increases the number of matching placements with that solution, even when it displaces a job. Validate this on every possible partial draft so a sequence of hints always reaches a legal schedule. Accept every valid schedule on Check. Replay the three jobs in chronological order, then finish once through the normal shell with the round's misses and hints.

## Play and presentation

Use the new-game scaffold and the existing `onTap`, coach, layout and round helpers. Draw room for four full-width time rows, three side-by-side job cards and Undo, Help and Check. Aim for 100 logical units per target, with the grown-up minimum of 64. Reserve caption and guide space first. Use a compact vertical table on upright phones and a table beside the jobs in landscape, preserving chronological row order across both. Test the shortest supported portrait layout with captions open and the active guide. Use numbers, icons and text to show the conditions, selection and feedback without depending on color.

Keep rules in `logic.ts`, voice in `voice.ts`, and use the shell's Kokoro title and clip workflow. The instruction, card selection, time readout, height and order feedback belong in voice so the numbers can be heard. The first how-to card demonstrates reading a row and assigning a job. The second demonstrates moving a job when its time crowds out another. The ghost finger follows a valid schedule derived from the seeded board and taps Check. Reuse Tide Line's shore art where it fits and draw the table, boat, terrace and new game icon with repository palette colors. Use a gentle existing confirmation sound or pentatonic notes.

For co-play, one person reads the gauge and suggests a time while the other moves the cards. Swap roles after a round. Off-screen, write four pretend times on paper and fit three household jobs around one shared helper, with one job that has to follow another.

## Build checks

- Run typecheck and unit tests. Enumerate all 24 complete schedules and all 73 injective partial or complete drafts per board. Check the solution totals above, boundary heights, both strict order relations, Check and Undo behavior, deterministic ties, and hint completion from every draft. Cover the registry, lands and current standard paging checks as part of normal integration.
- Add a filtered `tidetables` browser case at 390 × 625 with captions. Reach Lantern Lake through the normal grown-up route, finish levels 1 and 2, and on 2B try a boat at 19:30, submit an order miss, follow Help, revise, rotate and finish with one sticker. Check duplicate Check and the return route. Review one portrait screenshot, run the grown-up ghost finger at level 2 and build with generated voice assets.
- This batch covers one fictional harbor and one table format. Comparing places or tidal patterns and minimizing changes stay later proposals. Real-shore advice stays with the study's separate reviewer gate.

## Source check

NOAA's [tide tables explanation](https://oceanservice.noaa.gov/facts/tide-tables.html) describes a table as predicted high and low tides with their times and heights. Its [tidal cycles tutorial](https://oceanservice.noaa.gov/education/tutorial_tides/tides07_cycles.html) describes a range of patterns, including places with two highs and two lows of unequal height. The tables here are authored puzzle data for a made-up place. The task conditions and the four available slots are game rules.
