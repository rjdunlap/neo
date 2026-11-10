# Sand Table, level 4: Where did it go? (definition)

Defined 2026-11-09 as slice **E3** of the [earth-materials study](../deep-dives/subjects/earth-materials.md#build-slices-in-order), from its [rung 4](../deep-dives/subjects/earth-materials.md#first-games-proposed-ladder-sand-table) and the built [levels 1–3](sand-table.md). Docs only: no code, voice line or art exists for it yet.

**Status: built 2026-11-10 (E4), level 4 *Where did it go?*.** Built differences: the pulsing "ghost finger" is a soft glow behind the gaining pad plus sparkles; the pre-puff hint runs the breeze; the how-to goal line is level-neutral and level-scoped steps carry the level-4 wording; the two breeze voice lines share one text; pad taps while grains move give a tick and do not answer. Original status: ready to build. The 2026-10-23 delegation freezes the transport table after a source check against university or geological-survey sources instead of a named reviewer. This session's check is [below](#source-check); the building session repeats it once, as E1's did, and records any change here before writing `logic.ts`. Every open call has a default ([open decisions](#open-decisions)).

**Fun action and purpose:** an authored sand hill sits in the tray, and its top grains shimmer. She taps the breeze, a whoosh crosses the table, and the shimmering grains hop over the top and drop on the far side. The old outline stays drawn. The pet asks, "Where did the blown sand land?" and she taps under that part of the tray. The learning is **observing where wind moves sand and where it drops it**, the study's rung 4 for K/S: the breeze lifts grains from the side it hits and the top, and they settle where the hill shelters them. It is the observation step before rung 5's controlled comparison (NGSS 4-ESS2-1, observations of erosion; 2-ESS2-1, how wind changes land). It makes no claim about wind speed, time or how much real sand moves.

## Identity and overlap

- **Levels 1–3** stay as built: pour and scoop, no wrong answers. Level 4 is the same tray and the same settle rule with one new force, the breeze, and the game's first question with a right answer.
- **Rain Garden, Water Paths and Puddle Pipes** (proposals) keep water. Nothing here is wet. The study's line holds: if a rung only reroutes water, it belongs there.
- **Weather and water games** keep the weather itself. The breeze is a tool of the experiment, not a forecast.
- **Rungs 5 and 6** (covers, *Same breeze, one change*; paths and dunes) are **not** defined here. Each waits for its own model packet ([build slices](../deep-dives/subjects/earth-materials.md#build-slices-in-order)).

## Source check

Opened 2026-11-09; rechecked 2026-11-10 by the building session, unchanged (both pages still say the same):

| Source | What it says | What the toy borrows |
| --- | --- | --- |
| [Geological Society of London, "By wind"](https://www.geolsoc.org.uk/ks3/gsl/education/resources/rockcycle/page3707.html) (KS3 rock-cycle resource) | "Wind picks up and transports grains of sand by saltation, where sand grains bounce along the ground." Sand "is then deposited where there is shelter from the wind." Dunes "move down-wind as sand is blown up the dune and over the crest." | Grains hop low along the surface, only downwind. They come off the slope that faces the breeze and the top, and land where the surface first drops away (shelter) |
| [University of Arizona HiRISE, "Eroding Dunes in Chasma Boreale"](https://hirise.lpl.arizona.edu/PSP_009114_2645) | "Sand dunes move by having the wind push sand grains up and over the top of the dune where they then slide down to the base." | Landed grains on a steep lee then slide down: the built settle rule does this already |

**Access limits:** the USGS *Deserts: Geology and Resources* eolian page returned 403, and the NPS White Sands geology brochure (PDF) opened without a readable text layer, so neither is used. The Geological Society is a learned society rather than a survey, and the HiRISE page describes Martian dunes. Both support only the qualitative direction (upwind side loses, sheltered downwind side gains, steep lee slides), which is all the toy uses. **Invented and disclosed:** the bottom layer that never blows, one breeze puff, which grains move, how far each hops and every number below. The how-to card names the breeze a made-up toy rule.

## The breeze rule

Added to `logic.ts` beside the built rules. It reuses the tray, `COLS = 12`, `RIM = 6`, the 48 grains and the built settle and spill.

- **Direction:** each round's breeze blows from one wall, **left** or **right**, chosen by the seed. A breeze from the right is defined as **reverse the heights, run the left-hand rule, reverse back** (the animation events mirrored the same way), so the two directions are exact mirror images. The rest of this section is the left-hand rule.
- **Lifted grains** are chosen on the tray **before** anything moves. Column `i` (0 to 10; column 11, against the far wall, never lifts) is lifted when `h[i] ≥ 2` and `h[i] ≥ h[i−1]`, taking `h[−1] = 0` at the open upwind edge. In words: on the side facing the breeze or at the top, and above the packed bottom layer. Each lifted column gives exactly **one** top grain, and these are the grains that shimmer before the breeze ("disclosed").
- **Hops:** all lifted grains leave first. Then they land one at a time, the most downwind source first. Each lands in the first column `j > i` where `h[j] < h[j−1]` on the current heights (the surface drops away: shelter), or in column 11, the far wall, if there is none.
- **Then settle and spill** exactly as built. The settle moves are the "slide down to the base".
- **One puff per round.** The breeze runs once; there is no second gust to choose. (A simulation of three puffs on these mounds sent nearly all the sand to the far wall by the third, which leaves nothing to observe.)
- **Termination and conservation:** a puff lifts at most 11 grains, each hop moves strictly downwind and stays in the tray, and the built settle bound applies. `bucket + tray + pail = 48` still holds.

### Authored hills and their frozen traces

Three authored hills, each with neighbours within one, the bucket holding the rest of the 48. With two directions there are **six setups**. The seed picks one. Bays are the built level-3 thirds: left 0–3, middle 4–7, right 8–11. Traces from a scratch simulation of the rule above, breeze from the left; each right-hand setup is the exact mirror (reverse the heights, columns `c → 11 − c`, left and right bays swapped).

| Hill (sum) | Before | Lifted columns | Hops | Settle moves | After | Bay sums before → after | Answer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Hill on the left** (21) | `1 2 3 4 3 2 1 1 1 1 1 1` | 1, 2, 3 | 3→5, 2→6, 1→6 | 6→7 | `1 1 2 3 3 3 2 2 1 1 1 1` | 10, 7, 4 → 7, 10, 4 | **middle** |
| **Hill and hollow** (16) | `1 2 3 3 2 1 0 0 1 1 1 1` | 1, 2, 3 | 3→5, 2→6, 1→6 | 6→7 | `1 1 2 2 2 2 1 1 1 1 1 1` | 9, 3, 4 → 6, 6, 4 | **middle** (the hollow fills) |
| **Hill in the middle** (21) | `1 1 1 1 2 3 4 3 2 1 1 1` | 4, 5, 6 | 6→8, 5→9, 4→9 | 9→10 | `1 1 1 1 1 2 3 3 3 2 2 1` | 4, 12, 5 → 4, 9, 8 | **right** |

Mirrored, the answers are middle, middle and **left**, so across the six setups every bay is sometimes the answer, and the upwind bay never is. No setup spills.

### The answer

- **Accepted:** the bay or bays whose tray sum after the puff is greater than before (`gainedBays(before, after)`). For every authored setup this is exactly one bay, and it is also the bay every hop lands in. A test holds both, so the "where the hops landed" and "where the sand grew" readings never disagree for an authored hill.
- **Wrong, with a reason from the trace:** a bay whose sum fell is **lost** ("That part got lower. The breeze lifted sand from there."); a bay that did not change is **same** ("That part looks just like the outline."). Each line is chosen by `bayChange(before, after, bay)`, never by the author's story.

## Screen and controls

The level-3 screen with three bays (`sandLayout(view, 3)`, already tested at the four views), with these level-4 roles. No new rectangle is added, so the built layout test still covers every target.

- **The tray** shows the authored hill. Before the puff the lifted grains shimmer, and a few drawn breeze lines and a little shell windmill sit at the upwind wall. There is no bucket pour at level 4: the bucket is drawn but empty-looking, and the scoops are not shown.
- **Breeze** takes the flag's rectangle (130×130, bottom-right): a windmill button. On touch-down it presses in and a soft unpitched whoosh starts. The lifted grains hop along low arcs to their landing columns, each landing with a pentatonic pluck pitched by height (as built), then the settle moves slide.
- **The outline:** once the puff starts, a dashed line keeps the surface from before, and the moved grains keep a different palette tint where they land. Both stay until the round ends.
- **Answer pads** take the three paddle rectangles under the bays (each at least 180×100), shown only after the puff, each with an upward arrow into its bay.
- **Replay** takes the pail's rectangle once the puff has run. It replays the same trace from the outline, free and as often as she likes. It changes nothing in the model.
- **Taps that are not an answer are never silent:**
  - a tray tap before the puff wiggles the windmill and says "Tap the breeze to see where the sand goes.";
  - a tray tap after the puff glows the pad under that bay and says "Tap down here to choose this part." It is not an answer and counts nothing;
  - Breeze is replaced by Replay after the puff, so it cannot run twice.
- **Pause sheet:** Start again restores the authored hill and the Breeze button. The same seed gives the same puff. Misses and hints already counted in the round stay counted.
- **The pet** keeps its bottom-left corner, which `sandLayout` already keeps clear.

## Level

| Level | Name | Bands (default) | What she decides | Finish |
| --- | --- | --- | --- | --- |
| 4 | **Where did it go?** | school | After watching, which part of the tray the blown sand landed in | Tapping the bay that gained |

`BandLevels` change: school `{ min: 3, max: 4 }` (new; the built ladder reserves ID 4 for this rung and says school arrives with it). Lap, toddler, preschool and pre-K stay as built ([decision 1](#open-decisions)). `describeLevel` 4: "Watch the breeze and find where the sand landed". Rungs 5 and 6 keep IDs 5 and 6.

### First round

Hill in the middle, breeze from the left. The pet says, "These top grains can blow away. Tap the breeze!" Three grains shimmer on the left slope and the top. She taps the windmill: whoosh, the grains hop over the top, plunk, plunk, plunk, and one slides. The outline shows the old hill. "Where did the blown sand land? Tap under that part." She taps the left pad: boing, "That part looks just like the outline." She taps Replay and watches again, then taps the right pad: a chime, "Yes! It hopped over the top and dropped where the hill hides it from the breeze." The round finishes.

## Accounting, help and finishing

**Level 4 is the game's first counted rung.** Levels 1–3 keep every built rule.

- **Misses:** a tap on a pad that did not gain is one miss: the gentle boing, the trace's **lost** or **same** line. The pads stay, and she can tap again. Breeze, Replay, Start again, tray taps and watching again never count.
- **Glow after two misses:** the gaining pad glows softly and the pet says, "The sand dropped where the breeze couldn't reach it." The glow counts **one hint**, once per round.
- **Show a hint** (pause sheet), at level 4:
  - **before the puff,** the ghost finger taps Breeze. It counts nothing, since running the experiment is free;
  - **after the puff, first request,** a replay in which one hopping grain leaves a dotted path to where it lands, and the pet says, "Follow this grain. Where did it stop?" It counts **one hint**;
  - **after that,** the gaining pad glows and the ghost finger points at it. It is the same help as the glow, so it counts only if the glow has not already counted.
  - **At most two hints** are counted in a round: the dotted path and the glow.
- **Finish:** a tap on a gaining pad chimes, the pet says the trace's **right** line, then `ctx.finish({ misses, hints })` once. A hill-and-hollow setup gets the hollow line: "It dropped into the hollow, out of the breeze." Assisted completion earns the ordinary one sticker. Nothing is kept.
- **Adaptation** is the shell's ordinary rule: two smooth rounds (at most one miss, no hints) step up and two struggling rounds step down, clamped to school 3–4. A helped round is not independent mastery.

### What changes in the built text

These built rules and card lines say "all levels" and become `{ from: 1, to: 3 }` in E4 ([built definition](sand-table.md)):

- "There are no wrong actions at any rung. Every round finishes with `ctx.finish({ misses: 0, hints: 0 })`" ([accounting](sand-table.md#accounting-help-and-finishing));
- Show a hint "counts nothing";
- how-to steps "Tap the sand to pour a shower of grains" and "Tap a scoop to lift some sand back into the bucket";
- how-to note "Nothing she does here is wrong, and finishing is not a test".

The note "The sand follows a made-up toy rule; real sand behaves differently" stays at all levels.

## Rule tests (`logic.test.ts`)

- **Frozen traces:** each of the six setups gives the lifted columns, hops, settle moves and after-heights in the table (mirrored for the right-hand three), and no spill.
- **Mirror:** for 2,000 seeded settled trays, a breeze from the right equals reverse, left-hand rule, reverse.
- **The answer:** for every authored setup, `gainedBays` is exactly one bay, every hop lands in it, and the upwind bay is never in it.
- **Random trays** (2,000 seeded trays reached by levels 1–3 actions, both directions):
  - conservation, `bucket + tray + pail = 48`;
  - heights within 0–6;
  - neighbours within one after the puff;
  - every hop lands strictly downwind of its source;
  - a puff lifts at most 11 grains, and lifts none from the far-wall column.
- **Determinism:** the same seed gives the same setup, the same event list and the same answer, including after Start again.
- **Reasons:** `bayChange` gives **lost** for the upwind lifted bay and **same** for an untouched bay in each setup, and never **lost** or **same** for the answer.
- **Accounting:** a scripted round with two wrong pads, the glow and the dotted path counts misses 2 and hints 2. A round with a request after the glow does not count a third. Replay, Start again and tray taps count nothing.
- **Layout and registry:** the built `sandLayout` test covers every level-4 target. Registry, lands and how-to tests pass with school added. The school land page is checked at build time, since a full land pages rather than shrinks.

## Ghost finger, how-to card and voice

- **Ghost finger:** `autotouch()` at level 4 taps Breeze, waits for the trace to finish, then taps the gaining pad. The scripted play uses the same bot with one wrong pad first.
- **How-to card** for `{ from: 4, to: 4 }`:
  - Goal: "Watch the breeze, then find where the sand landed."
  - Steps: "Tap the breeze and watch the shimmering grains"; "Tap Replay to watch again"; "Tap under the part where the sand landed".
  - Finish: "The round ends when she finds where it landed".
  - Note: "The breeze is a made-up toy rule. Real wind also carries sand downwind and drops it where it is sheltered, but not like this."
- **Voice lines** under `sand.`:
  - `instruct.4`, `breeze.ready`, `breeze.from-left`, `breeze.from-right`, `breeze.first`;
  - `ask`, `choose-here`;
  - `wrong.lost`, `wrong.same`;
  - `hint.path`, `hint.glow`;
  - `right.lee`, `right.hollow`.

  `{pet}` is optional. Nothing is written as text to read. Run `node scripts/content-barrels.mjs`.
- **Art:** in `art.ts`: the shell windmill (button and upwind-wall decoration), breeze lines, the dashed outline, moved-grain tint, the arrow pads and the dotted hop path. Palette colours, Graphics only.
- **Grown-ups' card:** "Watches what the breeze moves, then says where the sand landed." No claim about real wind or erosion rates.
- **Co-play:** one watches the breeze, the other says or points to where it went, and they swap with Start again.
- **Off-screen:** none. Real sand and fans wait for the practical reviewer.

## Check tier

E4 is the **new-interaction tier**:

- typecheck and unit tests (the properties above, plus registry, lands and how-to tests);
- **one** filtered scripted play of level 4, with one wrong pad, one hint and the right pad, asserting misses 1 and hints 1;
- one portrait screenshot of level 4 after the puff, with the outline, tinted grains and pads;
- `fingerdemo` at 4;
- `npm run build`, because the voice and how-to files change.

Device and person checks stay open: whether a school player reads the outline as "before", the whoosh's comfort, and device speech of the new lines.

## Open decisions

Each has a default the build uses. None blocks E4.

1. **Bands.** Default: school `{ min: 3, max: 4 }`, with pre-K staying at 3, so a school player shapes a landscape before the breeze arrives. Alternatives: pre-K `{ min: 3, max: 4 }` (the study labels the rung K/S), or school `{ min: 4, max: 4 }`.
2. **A second question.** Default: one question, where it landed. Alternative: then ask where it came from (the bay that lost), for a fuller erode-and-deposit story. It would be a second decision with its own miss count.
3. **Answer by tray tap.** Default: answers only on the pads, with a tray tap glowing its pad. Alternative: a tray tap after the puff answers directly.
4. **More hills.** Default: the three authored hills. A fourth must keep exactly one gaining bay and no spill, and pass the frozen-trace test before it is added.
