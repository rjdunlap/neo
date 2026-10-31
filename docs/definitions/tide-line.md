# Tide Line, levels 1–4 (definition)

Defined 2026-10-31 (levels 1–2 and the shore kit built 2026-10-31, [PR #1059](https://github.com/rjdunlap/neo/pull/1059); levels 3–4 not built) as slice 1 of the [oceans study](../deep-dives/subjects/oceans.md#build-slices-in-order) ([packet row](../deep-dives/subjects/RECOMMENDATIONS.md#oceans-recommendations)), [PR #1042](https://github.com/rjdunlap/neo/pull/1042). The study's decisions were taken 2026-10-23 on the developer's delegation ([record](../archive/DECISIONS-2026-10-23.md#standing-rules)): a new game, if level 3's line-reading round survives definition (it does, below); Bubble Beach if the lands test passes, else Counting Cove, moving no other game; the S1 content review is this session's source check (recorded below), no named reviewer; the cause of tides only at school and behind review; no litter, polluted sea, suffering animal or predation; shore safety stays with the unscheduled safety study; synthesized wave and gull sounds. Levels 5–7 are a separate definition (study slice 3); level 7 stays review-gated.

**Fun action and purpose:** pull the big wave up the sand and let it slide back while the shore answers (shells wobble, the sea star waves, the anemone closes and opens); then keep a pail dry by putting it above the seaweed line; then read a line the last tide left, with the sea out, to place three things so they stay dry; then finish a day's picture strip of in, out, in, out. Learning goal: *the sea comes in and goes out again and again, and the shore keeps evidence of how far it came.* The central decision from level 2 on is **where the sea will reach**, read from the line; level 4 adds **when**, read from the pattern. That is the identity test the study set (decision 1): Sea Lift owns above/below as a number line and Day by Day owns the clock day; neither asks where the next tide will reach from evidence on the sand.

## Source check (S1, this session)

The study's model is kept, with what the sources support and what the game must not say:

- **Two highs and two lows.** NOAA's tides tutorial ([tidal cycles](https://oceanservice.noaa.gov/education/tutorial_tides/tides07_cycles.html)): a semidiurnal tide has two highs and two lows of about equal height each *lunar* day; mixed semidiurnal tides have unequal highs; parts of the Gulf of Mexico have one high and one low (diurnal); patterns "often differ greatly" by place. **So:** level 4's strip shows "high, low, high, low" as *this island's* pattern and never a clock time; the grown-up card says "on this island's shore; many shores, not all, have two highs and two lows, and the timing shifts each day". Nothing says "every day at the same time" or names the Moon.
- **The wrack line.** Connecticut Sea Grant (a NOAA–state partnership; read from search summaries of its *Wrack Lines* magazine) describes wrack lines as seaweed, sea grass, shells and feathers that high tides leave on the shore; Beachapedia says the wrack line usually marks the high-tide line; COASST notes several lines from the freshest near the surf up to the highest, oldest one, and the Buzzards Bay Coalition notes storm-surge wrack is hard to tell from the high-tide line. **So:** the model's "the line is where the last high tide reached" holds for one line; level 3's second round has two lines (an ordinary one and a higher windy-day one) and the pet trusts the **higher** one ("The windy-day sea came up to the top line"), which is also the safe-side habit. The game never teaches that the lower line is safe.
- **The anemone.** Beadlet-anemone accounts (the Wildlife Trusts, the Charmouth Heritage Coast Centre) and a general intertidal account: an intertidal anemone pulls its tentacles in when disturbed or left out of water at low tide, and opens again in water. **So:** level 1's anemone closes to a poke and as the sea leaves, and opens when the sea covers it; the grown-up note says "some anemones". Crab, sea star and shell keep the common names (decision 8); the crab is the beach scene's hermit crab in a borrowed shell; no reef fish.
- **Not checked, so not used:** any tide timing, height in metres, the Moon or Sun, spring and neap tides (all level 7 or later), and any shore-safety statement.

## Overlap and reuse

- **Shore art** exists privately in the island's beach scene (`src/app/scenes/beach.ts`: `pool`, `star`, `anemone`, `kelp`, `crab`, `gull`, `rock`, `barnacle`). The build moves the creatures it needs into a shared `src/art/shore.ts` (the study's "Tide Pool Friends" kit) with the beach scene importing them unchanged, guarded by `beach.test.ts`; it adds a shell, a pail, a flag, a towel and the wrack line (kelp strands and shells in a ragged band). No sprites, no render texture.
- **Sound:** `sfx.splash()`, `sfx.whoosh()` and `sfx.boing()` exist; the build adds a synthesized `sfx.wave(rise: boolean)` (filtered noise swelling up or hissing back) and `sfx.gull()` to `sfx.ts`. Music `STYLES.bubbles` keeps playing (she is not making music).
- **Input:** `onTap` for the level-4 choices, the pet and the lap-band wave tap; `src/engine/drag.ts` for the pail, flag and towel (they ride 40 units above the finger and resolve on drop); the wave handle is a custom vertical pointer drag (as a slider: palm rejection, leave-the-screen and cancel release it, the sea eases back). Sea Lift's water drawing and Sink or Float's floating bob are the visual references. No new engine helper, save field or journal filing.

## The model (`logic.ts`)

**The shore.** The beach slopes **up the screen**: the sea sits at the bottom, the sand rises to grass and dunes at the top, so "up the beach" is up. Heights are a single number `h` in 0–1 along the sand (0 = the low-tide water's edge, 1 = the foot of the dunes); layout maps `h` to screen y. `waterAt(phase)` is one smooth periodic curve, `low + (high − low) × (1 − cos 2πt) / 2` per half-cycle, so the water rises monotonically from low to high and falls back; a round's `high` is seeded from three heights {0.45, 0.55, 0.65} and `low` is 0.

**The line.** `wrack(round)` is the previous high: a band of height 0.05 centred on `high`. A thing is **dry** when the bottom of its footprint is above the band's top; anything touching the band or below it is **wet**. At level 3's second round there are two bands, `high` and a windy-day line `stormHigh = high + 0.15` (at most 0.85); the incoming sea reaches `stormHigh`, so dry means above the higher band.

**Levels.**

| Level | ID | Bands | A round | The question (only place a miss can happen) |
| --- | --- | --- | --- | --- |
| 1 Come in, go out | `wave` | lap, toddler | She pulls the wave handle up the sand and lets go; it slides back. Shells wobble, the sea star waves, the anemone closes and opens, a gull calls once. Two full cycles (the water passes 0.6 and returns below 0.1) finish it. Lap: a tap anywhere on the sea also sends one wave | None. No misses, no hints |
| 2 Stop at the line | `pail` | toddler, preschool | Two pails, one after the other; the line is showing and the sea is out. She drags the pail onto the sand and lets go; **only then** does the sea come in to the line and go out | The pail is wet: it floats, bobs and the pet fetches it back to the start |
| 3 Read the line | `line` | preschool, pre-K | Two rounds; the sea is out. Round 1: one line; she places a pail, a flag and a towel, then taps the wave button and the sea comes in. Round 2: two lines (ordinary and windy-day) and the sea that comes in is the windy one | Each thing below or on the line that reaches it at the wave: it floats and is fetched back; the round continues with only the wet ones to place again |
| 4 In, out, in, out | `cycle` | pre-K | Two strips; each is four shore pictures across a day in order, alternating high and low (seeded start), one missing (seeded slot). Three choice cards under it: a high picture, a low picture and an in-between one | The card that completes the alternation is right; the other two are wrong |

**The pictures (level 4).** Each picture is the same small shore with a rock and the wrack line: *high* covers the rock to its top with the water at the line; *low* shows the whole rock and a rock pool with its sea star; *in-between* shows the rock half covered with the water well below the line. They differ by **where the water reaches against the rock and the line**, never by colour alone; the sun's place in a thin sky arc above each picture moves left to right across the strip (decision 4 of the study keeps it a pattern; the arc is a "where in the day" cue, not a clock).

**No timers.** The sea never comes in on its own at levels 2–3: it waits for the drop (2) or the wave button (3). Nothing she places is lost, and a floated pail is always fetched back.

**Exploration is free.** At level 2 a pail placed well above the line is right however high it goes; at level 3 placements can be moved any number of times before the wave button and nothing counts until the sea comes in. Placing a thing on the grass above the sand is fine (dry). Pulling the level-1 wave any way, any number of times, is never wrong.

### Bands and ranges

`BandLevels`: `lap: { min: 1, max: 1 }`, `toddler: { min: 1, max: 2 }`, `preschool: { min: 2, max: 3 }`, `prek: { min: 3, max: 4 }`. No `school` window until levels 5–6 are defined (school then gets `{ min: 4, max: 6 }`; nothing is renumbered). No `order`.

## Screen and controls

- **Shore stage.** Full-width shore; sea at the bottom quarter at low tide, sand above it to about 15% from the top, dunes and sky above. Portrait gives the sand more height; landscape keeps the sand at least 420 units tall from low water to the dunes so the dry zone above the highest line (0.85) is at least 60 units **plus** the grass strip, and the level-2 dry zone (above 0.65) at least 140 units of sand plus the grass, enough for a 120-unit pail.
- **Level 1.** The wave handle is the foam crest across the whole sea width, a band at least 140 units tall around the crest (the whole sea is grabbable at low tide); it swells under the finger at touch-down. The sea follows the finger up to `h = 0.95` and eases back on release (about 1.5 s); a pentatonic step plays as the water passes each fifth of the sand. Creatures sit on rocks at heights 0.2–0.5 so the sea covers and uncovers them.
- **Level 2–3 things.** Pail 120 × 120, flag 100 × 160, towel 160 × 100, each a 120-unit minimum hit area, starting in a tray on the sea-side rocks at the right (left in portrait is the pet's corner; the tray stays clear of it). Dropped on the sand they stand where dropped, clamped to the sand and grass. The wave button (level 3) is a 130 × 120 wave shape at the right of the tray; it lifts on touch-down.
- **Level 4.** The strip of four pictures (each 200 × 160) across the top half, the gap a dashed frame of the same size; three choice cards (200 × 160) beneath it; portrait stacks the strip as two rows of two and the cards in a row of three, each card at least 160 wide. A tapped right card flies into the gap; a wrong one shakes and returns.
- **Touch-down feedback.** Foam and a soft whoosh on the wave; things lift and grow under the finger; cards lift; the pet hops when tapped and repeats the instruction.
- **Layout audit.** `layout(level, view)` at the lands test's four views (landscape, portrait and two phone insets): every input at least 100 units, nothing under the bottom-left pet or the corner buttons, the dry zone large enough for every thing, portrait stacks rather than shrinks.
- **Speech.** `ctx.instruct`: "Pull the sea up the sand, then let it go" (1) / "Put the pail where the sea won't reach. Look for the seaweed line" (2) / "The sea is out. Put each thing where it will stay dry, then tap the wave" (3) / "In, out, in, out. Which picture comes next?" (4). The pet repeats it and tapping the pet repeats it. The water is named "in" and "out", the line "the seaweed line"; no word must be read.
- **Tone.** The sea rises only against a pail, a flag, a towel and the creatures, never against a person or the pet; the pet stands on the dunes. Creatures react with curiosity. No litter is drawn; the wrack is seaweed and shells only.

## Accounting, help and finishing

| Level | Counts a miss | Counts a hint | Never counted |
| --- | --- | --- | --- |
| 1 | nothing | nothing | every pull and tap |
| 2 | a pail that floats (one per pail) | the glow after the second miss on a pail, or asked-for help; at most one per pail | lifting and re-placing before letting go; a pail placed high anywhere above the line |
| 3 | each thing that floats at the wave (so at most three per wave) | the same, at most one per round | moving things before the wave; placing on the grass |
| 4 | each tap on a wrong card | the same, at most one per strip | tapping the pictures in the strip (each says "in" or "out") |

- **Spoken reasons.** Level 2: "Oh, a floaty pail! The sea came up to the seaweed line. Higher!" Level 3: "The towel got wet. The sea comes up to the line" and, round 2, "The windy-day sea came up to the top line." Level 4: "That one's in. What comes after in?" / "That one's halfway. Is it in or out?"
- **Help.** After the second miss on a pail, round or strip, or on the pause sheet's *Show me* (`askForHint`, `hintLabel = 'Show me'`): level 2 glows the seaweed line and the sand above it; level 3 glows the line that the sea will reach (the higher one in round 2) and the dry sand above it; level 4 glows the right card. Asked again while the glow is on, the ghost finger makes the next move (carries the pail or the next wet thing above the line, taps the card): the supported finish, still one hint.
- **Finishing.** Every round ends in `ctx.finish({ misses, hints })` with one ordinary sticker, help or not. Level 1 ends after its two cycles; 2 after both pails stay dry; 3 after both rounds' things stay dry; 4 after both strips. Nothing is kept or filed.
- **Adaptation.** Level 1 has no misses, so it always steps a toddler up to 2. Nothing claims she understands tides; it claims she put things above the line, read a line with the sea out, and completed an alternating strip.

## Rule tests (`logic.test.ts`)

Over 500 seeds per level, as the study asked:

- **Curve:** `waterAt` is monotone between each low and the next high and back; it stays in `[low, high]`; level 1's cycle detector counts exactly one cycle per rise past 0.6 and fall below 0.1.
- **Line:** the wrack band is centred on the previous `high`; `isDry(thing, line)` is true exactly when the footprint's bottom is above the band's top; with two lines dry means above the higher; `stormHigh ≤ 0.85` and at least 0.12 above `high`.
- **Levels 2–3:** every round has at least one dry position and one wet one for every thing (a 120-unit pail fits whole above the highest line in all four layout views); in round 2 there is a place between the lines (wet) and one above both (dry); the three things fit side by side above the line at once.
- **Level 4:** each strip alternates high and low with exactly one gap; exactly one card completes it (the in-between card never does); both starts and all four gap slots appear over the seeds.
- **Help:** for every state the glow names a line and its dry sand or a card, and following the hint (or the ghost's move) from any state finishes the round; a hint counts at most once per pail, round or strip.
- **Layout:** `layout(level, view)` at the four views: every input at least 100 units, no overlap with the pet or corner buttons, the tray, button and things clear of each other.
- **Registry, lands, how-to and off-screen tests** pass with the new game in Bubble Beach (below).

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`, an `autotouch()` through the public inputs reading `game.state` and the current layout after every resize. Level 1: pull the wave to the top and let go, twice. Level 2: drag the pail to the middle of the dry sand. Level 3: drag each thing to its own spot above the line the sea will reach, then tap the wave. Level 4: tap the card that completes the strip. It never calls finish.
- **How-to card** (`src/content/howto.ts`). Goal: "Watch the sea come in and go out, and use the seaweed line to keep things dry." Steps: "Pull the wave up the sand and let it go" `{ from: 1, to: 1 }`; "Put the pail above the seaweed line; then the sea comes in" `{ from: 2, to: 2 }`; "With the sea out, place three things where they'll stay dry, then tap the wave; with two lines, the sea reaches the top one" `{ from: 3, to: 3 }`; "Tap the picture that comes next: in, out, in, out" `{ from: 4, to: 4 }`. Finish: "The round ends when the sea has been in and out twice, or everything stays dry, or both strips are done." Note: "The seaweed line is where the last high tide reached. On this island the sea comes in twice and goes out twice a day; many shores do, not all, and the times shift each day. A floating pail is fetched back, never lost."
- **Voice lines** under `tl.*`: `intro`, `instruct.1`–`instruct.4`, `in`, `out`, `whee`, `float`, `higher`, `line-reach`, `top-line`, `wet.{pail|flag|towel}`, `dry-all`, `after-in`, `after-out`, `halfway`, `anemone` ("The anemone closes up, then opens in the water"), `done`. `{pet}` optional; no number slots.
- **Registration:** ID `tide-line`, name "Tide Line", spoken title `game.tide-line`, region (subject) `tinker-lab` (science, as Sink or Float), skills `['science', 'patterns', 'prediction']` (all three already used: Sink or Float, Pattern Train). Bands `['lap', 'toddler', 'preschool', 'prek']`. Hub icon: a wave over sand with a seaweed line and a pail above it. Sticker: a seeded shore with its line, a pail and a sea star. Music `STYLES.bubbles`.
- **Home land:** **Bubble Beach**, measured this session at 12 games, so Tide Line is its 13th. `landPages` keeps a side on one page while the host, its games and the signpost fit `LAND_SPOTS` (13), so a side showing all thirteen pages (two near-equal pages; nothing shrinks), as Barnyard and Tinker Lab already do, while a younger side that hides older games may still fit one page. The build's lands test decides; the study's oversubscription (Puddle Lens, Sand Table, Melt and Freeze and Tide Line) no longer applies, since Sand Table went to Rainbow Meadow and the other two are already here. Fallback by decision 2: Counting Cove (13 today, 14 with Spinner Fair), only if the Bubble Beach test fails.
- **Co-play:** one person is the sea (pulls the wave), the other says "in!" and "out!" before it turns; at level 3 a grown-up asks "where did the sea come up to last time?" before she places. **Off-screen:** none ships in this batch; the study's *Find the Line* card waits on the safety review (decision 7).
- **Couch:** none.

## Check tier (for the builds)

Two batches, so each fits one session:

- **Batch `tide-line 1` (levels 1–2 and the shore kit), new-game tier:** `npm run typecheck`; the rule tests above for levels 1–2 with the registry, lands, how-to, off-screen and `beach.test.ts` (the moved art); one scripted play through a `browser-check.mjs` filter (level 1 to its sticker; level 2 with one pail below the line, the float and fetch, a second miss and the glow, then a dry pail); one portrait screenshot of level 2; `fingerdemo` at level 2; `npm run build` because the registry, lands, voice, sfx and shared art change.
- **Batch `tide-line 2` (levels 3–4), new-interaction tier** (several things then a wave button; the picture-strip pick): typecheck and the rule tests; one scripted play (level 3 round 2 with a thing between the lines; level 4 with one wrong card and the glow); one portrait screenshot of level 4; `fingerdemo` at levels 3 and 4; build only if shared files change.
- Not run in this docs slice: everything but `node scripts/check-links.mjs` and `git diff --check`. Device checks open at the build: whether a one-year-old on a lap pulls or taps the wave and watches the shore; whether a toddler holds a pail long enough to place it; whether the seaweed line reads as a line on an iPad in sunlight; whether pre-K children tell the in-between picture from high and low; device speech for "anemone".

## Open decisions

Each has a default the build uses; none blocks the first batch.

1. **Identity.** Default: a new game (study decision 1), since level 3's line-reading round has a decision Sea Lift and Day by Day lack.
2. **Which line to trust at level 3.** Default: the higher (windy-day) line, always. A weather-dependent choice (calm sky trusts the lower line) is not taken: it teaches that a lower line can be safe, which belongs to the safety study.
3. **Level 4's distractor.** Default: an in-between picture, so the pick is not a coin flip between high and low. A two-card version for a younger pre-K child is a later easing, not this batch.
4. **The sea waits.** Default: the sea comes in only after the drop (2) or the wave button (3); no round-ending timer, as AGENTS requires.
5. **Land.** Default: Bubble Beach as its 13th game; fallback Counting Cove.
6. **Music.** Default: `STYLES.bubbles` playing; the wave sound sits on top. If it competes with the whoosh on the device, `silenced(STYLES.bubbles)` is a one-line change and the registry's silenced list gains it.
