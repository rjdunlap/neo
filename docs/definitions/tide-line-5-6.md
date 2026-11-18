# Tide Line 5–6, Pool time and Read the chart

The sky arc in [levels 1–4](tide-line.md) becomes a time control in level 5. Level 6 plots the same moving water as a line so the player can choose a time from the height alone. Together they form one build slice in the [oceans study](../deep-dives/subjects/oceans.md#build-slices-in-order).

## The island day

Use the existing `waterAt(phase, low, high)` for both levels, with normalized shore height. Fix `low = 0.10`, draw `high` from `0.55` and `0.65` with `ctx.rng`, and choose whether the first stop is low or high. The authored first round starts low with `high = 0.55`; demos use it too. Let `t` run from 0 to 1 from left to right. Sample the curve at `phase = 2 * (t - 1/8) + offset`, with `offset = 0` or `0.5`. Four equal-width time targets sit at `t = 1/8, 3/8, 5/8, 7/8`. Each chooses the interval within `1/32` of its center. The visible chart shades just those short intervals. The larger target around each makes the interval easy to select. The strip and chart use the same morning-to-night icon sequence for their four positions. Sun position marks time in the model.

Decide whether a window fits a task from the whole interval, evaluating its endpoints and center. Those three samples include both interval bounds and its only extremum. Use the same shore thresholds throughout:

| Change in the scene | Height condition |
| --- | --- |
| The rock pool is revealed, with water still in the hollow and a sea star visible | `h <= 0.20` |
| There is enough water to float the paper boat in the illustrated inlet | `h >= 0.45` |
| The pictured picnic shelf stays dry | `h < 0.40` |

Every generated day offers two low windows and two high windows. The pool and picnic fit either low, the boat either high. The curve and thresholds govern the choice. Two jobs may share the same window.

## Level 5 · Pool time

Drag the time marker along the strip to bring the sea in and out. Preview the shore continuously under the finger. On release, snap to the nearest stop. Tapping a stop moves directly there. Start at the left endpoint with no selected stop. Each stop can show a covered rock or a visible pool and sea star through the geometry of the waterline. Use the same rock and pool on every stop.

Ask for the exposed pool first, then for the sea covering it. The exact ask goes through `ctx.instruct`. A large flag button beside the selection marks the chosen stop. Keep it inactive until a stop is selected. Scrubbing, tapping and marking the other water state all remain exploration. On a marked stop that shows the other state, name what the player found and keep the ask available. Marking either fitting stop pins its flag above the strip and advances the request. Keep the first flag visible while finding the second. Review the two marks with the guide before `ctx.finish`.

## Level 6 · Read the chart

Show the tide curve and four short time windows. Place `Time` left to right and `Water height` bottom to top, with sky icons along time and small low/high shore silhouettes beside the height scale. The left silhouettes and all axis labels are explanatory. The curve and the shapes carry the same relationship when the phone is muted. Preview a window by touching it before selecting a card, or by hovering over it with a dragged card. Preview updates a small shore picture. A card commits on a drop onto a window or by tapping a card and then a window. Release outside the four targets cancels. The first card is ready to drag immediately, with tap selection explicit.

Serve one job at a time in the authored order (pool, boat, picnic), then shuffle their order on seeded rounds. Read the current ask via `ctx.instruct` and show its picture and a reference mark at the task's height on the chart. A fitting drop or tap pairs the card with its time icon in a small completed row. Several cards can share the same time. A clashing answer briefly shows the consequence on the shore and returns the card for another try. The scene shows the three saved choices at the end of the round, then calls `ctx.finish`.

## Feedback, help and completion

- **Pool time.** Each request starts with zero misses. A Help press lights both fitting stops and plays the cue, counted as one hint when shown. A further Help press on the same request moves and marks the earlier fitting stop. It uses the same confirmation path as the flag. No idle help is needed.
- **Read the chart.** Count one miss only for a committed clashing window. Use `missOnRequest`, a gentle boing and a reason from the table below. The second miss on the same card or the first Help press lights both fitting intervals, with one hint counted when the glow appears. Subsequent Help on that card places it at the earlier fitting window. Reset request help with `nextRequest`; preserve the round tally. Canceled drags, previews and repeated taps during the return animation leave the tally alone.
- Let the player choose either glowing window or use guided completion. An ordinary completed round and a guided round each finish once through the shell. Keep the two flags or three cards in round state only. Retain the shell's regular sticker and difficulty behavior.

## Prompts and how-to

| Request | `ctx.instruct` | Feedback or hint |
| --- | --- | --- |
| Exposed pool | “Slide along the day. Mark a time when you can see the rock pool.” | “The sea is over the pool here. Look for lower water.” |
| Covered pool | “Now mark a time when the sea covers the rock pool.” | “The pool shows here. Look for higher water.” |
| Pool card | “Find a time when the rock pool shows.” | “The line is too high here. The sea covers the pool.” |
| Boat card | “Find a time when the water is high enough to float the boat.” | “There's too little water here. The boat rests on the sand.” |
| Picnic card | “Find a time when the picnic shelf stays dry.” | “The water reaches the picnic shelf here. Look for a lower part of the line.” |

Use stable `tl.*` IDs in `voice.ts` and `ctx.say` for results and cues. On correct placements name the evidence, for example “The line is low here, so the rock pool shows.” End level 5 with “The pool shows when the sea is out. Higher water covers it again.” For the chart use “Each picture has a time when the water suits it.”

Add two level-scoped how-to steps in `howto.ts`: “Slide along the day and mark one time the pool shows and one time the sea covers it” (5) and “Look at the height of the line. Put each picture on a time that fits” (6). Add the matching finish conditions. Co-play can trade predicting where the line will be and moving the marker to check. The existing decision on outdoor shore activities still applies.

## Layout, bands and saves

Keep Tide Line in Bubble Beach. Append stable IDs 5 and 6. Extend pre-K to `3..5` and open school at `4..6`, as anticipated in the first definition. Keep lower ranges and existing IDs and pins. Before publishing, verify that established histories and pins still resolve and that `landPages` reaches Tide Line on the school side.

Keep the chart and strip at least 500 logical units wide. Four 116-unit hit areas with 12-unit gaps fit within that span. Place the chart/card row and the time targets inside the game safe area after scaling, with at least 100 logical units on each interactive target. In portrait, stack shore preview, strip or chart, and active control. In landscape use the available width to keep the preview and controls visible without covering the chart. Require a clear route between the job card and all four hit areas. Reuse `shorePicture` for the preview, `draggable` for marker and card, and `onTap` for stops and cards. Store selections by stop ID and rebuild geometry on resize. Cancel any live drag on resize or scene exit without committing it.

## Build checks

- Rule tests over at least 500 seeds per level. Assert equal reachability of the two accepted windows, their strict separation from the conflicting pair for every task, agreement of shore preview with the chart and thresholds, monotonicity between extrema, and coverage of both starting phases and both high values. Check the authored day, the two independent flags, repeat-window acceptance, cancellation, Help-to-completion, one hint per request, and the final tally.
- Typecheck, unit tests including band, land and how-to checks, and one filtered scripted play of the two levels. At 5, scrub through both states and mark the other state without a miss before marking both fitting times. At 6, preview freely, commit a conflicting time twice, see the glow and use it; finish with a shared window. Expect 0/0 and 2/1 respectively. Take one portrait screenshot of the chart. Add `fingerdemo` for both levels. The ghost finger uses real scrubs, flags and card drops with refreshed hit centers after a resize. It waits for state transitions and never calls finish. Run build locally if shared files or assets change.

## Source check

NOAA describes several coastal tide patterns and differences between successive peaks. Equal peaks and four roughly spaced stops are a simplified day for this island. Use “on this island” when stating that pattern. [NOAA National Ocean Service, tidal patterns](https://oceanservice.noaa.gov/facts/high-tide.html)

NOAA's tide prediction graph plots height over time for a particular station and uses a reference level. Its guide shows two unequal peaks and a separate threshold tool. The game uses normalized height above its own shore reference and fictional conditions for the three jobs. Keep the chart labelled “Island tide,” with no dates, units or clock times. [NOAA Tide Predictions help](https://tidesandcurrents.noaa.gov/noaatidepredictionshelp.html) · [NOAA Tide Predictions User Guide](https://www.tidesandcurrents.noaa.gov/education/tech-assist/training/user-guides/assets/pdfs/Tide_Predictions_User_Guide_v4.pdf)

The fortnight chart, lunar explanation and real-shore advice retain the study's reviewer gates.
