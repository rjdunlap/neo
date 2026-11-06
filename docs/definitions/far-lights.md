# Far Lights, levels 1–8 (definition)

**Admitted to the build queue 2026-11-05** ([READY](../READY.md#queued)): the developer asked for the recommendations to be made without waiting, so the build uses this packet's defaults (settled in the [October 23 record](../archive/DECISIONS-2026-10-23.md#decisions)). Its source check and the lands test still run at build time.

Defined 2026-10-22 as slice 1 of the [astronomy study](../deep-dives/subjects/astronomy.md#build-slices-in-order), from its [first game's ladder](../deep-dives/subjects/astronomy.md#a-first-games-ladder-far-lights), the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#astronomy-recommendations) and the notebook row ([IDEAS](../IDEAS.md)). Docs only: no game, ID registration, voice line, save field or band exists yet.

**Levels 5–8 defined 2026-11-06** (the study's slice 3, docs only): [Levels 5–8](#levels-58-definition). They are queued as two builds, 5–6 then 7–8. Everything above that section describes levels 1–4 as built.

**Status: built 2026-11-05 (levels 1–4, [PR #1273](https://github.com/rjdunlap/neo/pull/1273), the study's slice 2) with this packet's defaults: Tinker Lab, no shell change for levels 1–2, two boards at level 4, no journal.** The paragraph below is the pre-build status. The [Waiting row](../WAITING-ON-DEVELOPER.md) "Astronomy: Far Lights identity, model review and older placement" asks for three things before registration: the identity beside Light Lab, the band windows and land, and an exploration-accounting policy for levels 1–2 that matches Space's. This packet gives a default for each ([open decisions](#open-decisions)); the build starts when the developer accepts or changes them. No astronomy educator is named. Levels 1–4 claim only the **order** "nearer looks brighter, farther looks dimmer" for lights that are the same; no round asks how much brighter, and no line names a ratio, a star or a law. The default therefore lets the review gate levels 5–8 and any quantitative wording, not this build ([decision 4](#open-decisions)).

**Fun action and purpose:** a quiet night lake, seen two ways. On top, the lake from the side: a little house with a round window at the left end, and two paths of floating lights running away from it. Below, the view out of that window: the same lights over the dark water, each a small fixed core inside a soft halo. She taps a light and watches it float close and glow up in the window. Later she drags lights nearer and farther, picks which looks brighter from the window, and moves one light until two look the same. The learning purpose is **how bright a light looks depends on how far away it is** (the study's L–K rows, [audiences](../deep-dives/subjects/astronomy.md#an-answer-for-every-audience)): the light itself never changes, and in the side view it is drawn the same at every stop, while the window shows it brighter near and dimmer far. Halo size shows how bright it looks, **never how big the light is**; the pet and the card say "It looks brighter, not bigger." A correct answer proves a correct answer in this toy; it is not evidence of understanding starlight.

## Identity and overlap

- **Light Lab** (Tinker Lab) aims a beam with mirrors so it reaches flowers: direction and path. Far Lights never aims or reflects; the one control is distance, and the one observation is how bright a light looks. Different action and different learning, so a new game (study decision 1).
- **Moon Window** (defined, gated) compares how much of one Moon is lit, from a fixed window. Far Lights compares separate lights at different distances. Both may share a night palette; neither reuses the other's model.
- **Lantern Lights** (Lantern Lake, grown-up) is a lights-out puzzle; to keep the two apart, these are never called lanterns. **Photo Safari**'s proposed Night Safari photographs a night scene; nothing here is photographed.
- **Sense Detective**, **Puddle Lens** and **Ramp Race** are unchanged.

## The model (`logic.ts`)

- **Stops:** four, at toy distances `1`, `2`, `3`, `4` from the window, numbered from the window outward. No distance number or unit is drawn or spoken.
- **Glow:** every light at levels 1–4 has glow `1`. Glows 4 and 9 arrive with level 7 and are not in this build's tables.
- **How bright it looks:** `look(glow, stop) = glow / stop²`, so `1`, `1/4`, `1/9`, `1/16` for stops 1–4. This is the inverse-square relation, recalled in the study and not opened; levels 1–4 use only its order ([decision 4](#open-decisions)).
- **Halo:** in the window view, a light is a fixed core (radius 10, never changing) inside a halo of radius `110 × √look` (110, 55, 36.7 and 27.5 for stops 1–4) and opacity `0.35 + 0.65 × √look`. Halo **area** is proportional to `look`, the convention the reviewer is asked to accept. In the side view every light is drawn the same, core and a constant small glow, at every stop.
- **Readable steps:** two judged states count as different only if one looks at least **twice** as bright, and the same only if equal. Stops 3 and 4 differ by only 1.78×, so no judged state ever compares a stop-3 light with a stop-4 light. Passing states while dragging are never judged.
- **Lanes:** two parallel paths, **A** (upper in the side view, left in the window) and **B** (lower, right). Level 1 uses three window positions instead ([level 1](#levels)).

| Level | Judged boards | Rule |
| --- | --- | --- |
| 3 | Pairs `{nearer, farther}` from `{1,2}`, `{1,3}`, `{1,4}`, `{2,3}`, `{2,4}` (never `{3,4}`) | Two pairs a round; the brighter is in lane A for one and lane B for the other; the two pairs differ |
| 4 | Reference stop `r ∈ {1, 2}`; movable start `m`: `r = 1` → `m ∈ {3, 4}`, `r = 2` → `m = 4` | Exactly one matching stop (`r`); every other stop a Check can judge differs at least twofold (`r = 1`: 4×, 9×, 16×; `r = 2`: 4×, 2.25×, 4×) |

`judgeBrighter(board, lane)` returns `'right'` or `'dimmer'`; `judgeMatch(board, stop)` returns `'same'`, `'too-bright'` or `'too-dim'`; `helpFor(board)` returns the brighter lane (level 3) or `r` (level 4).

## Screen and controls

- **The side strip** (levels 2–4) runs across the top of the room below the home and `?` buttons: the little house and its round window at the left end, then stops 1–4 to the right, at least **120** apart, each a short post with one to four dots (no reading). Lane A above lane B, each at least 120 tall. A light's touch area in the strip is a circle at least **120** across, centred on its core whatever its drawn size.
- **The window view** fills the room below the strip and right of the guide's bottom-left corner: a big rounded window frame on the night lake, at least 440 wide and 300 tall. Lane A's light sits left of centre, lane B's right, at fixed positions at least 240 apart (two stop-1 halos never touch). Its answer touch areas (level 3) are circles **120** across, independent of the halo, which at stop 4 is only 55 across.
- **One arrangement in both orientations.** The study proposed side by side in landscape; four stops at 120 plus the house need about 640 units of width, which leaves too little beside it for two 220-unit halos at 1024 wide. So the strip sits above the window in both orientations, and in landscape the window view starts right of the guide's column. This is a departure from the study, recorded here.
- **Level 1** has no strip: the window view takes the whole room, with three lights at least 200 apart and touch areas **160** across.
- **Check (level 4):** a 120×120 button with a big tick, bottom right of the window view.
- **Touch:** taps use `onTap`; touch-down brightens the light's core ring at once, before any sound or speech. Drags (levels 2 and 4) use `src/engine/drag.ts` move callbacks on the strip only: the light rides with the finger horizontally, clamped between stops 1 and 4, and its lane is fixed; release snaps to the nearest stop. Lights do not ride 40 above the finger here, because the lane fixes their height. The window shows the look of the stop nearest the finger, live; crossing a stop plays a pentatonic note from `src/audio/notes.ts`, rising toward the window.
- **Sizing:** `farLayout(view, level)` places all of this inside `view`, clear of the home button, the `?` button and the guide's corner. It returns **null** rather than give a touch area under 120 (160 at level 1), stops closer than 120, a lane under 120, a window view under 440×300, or a Check under 120; the layout test fails then. The study's three-stop fallback is not taken: four stops are expected to fit in all four test views, and if they do not, the build reports it rather than shrinking.
- **Pause sheet:** Start again (the same seeded round from its first board, keeping hints) and Show a hint (`Scene.pauseActions`).
- **Music:** the land's island style keeps playing; she is not making music.

## Levels

| Level | Name | What she does | Round |
| --- | --- | --- | --- |
| 1 | **Glow** | Taps a light; it floats close and glows up in the window, then drifts back | Three counted taps, any lights |
| 2 | **Come closer** | Drags each light along its path to the window; it looks brighter at every stop | Both lights at stop 1 |
| 3 | **Which looks brighter?** | Taps the light that looks brighter from the window | Two pairs |
| 4 | **Make them match** | Moves one light until it looks the same as the other, then presses Check | Two boards |

Ranges (a `BandLevels` table): lap `{1,1}`, toddler `{1,2}`, preschool `{2,3}`, prek `{3,4}`, school `{4,4}`, as the study proposes (L 1, T 1–2, P 2–3, K 3–4). The study's school window 4–6 and upper school 6–8 open with levels 5–8. No `grownup` range and no `GROWNUP_GAMES` entry.

**Level 4's round** is two boards, where the study's ladder and the recommendation row say one board and one check. One board makes a round a single decision; two match level 3's two pairs and let the second swap lanes. Recorded as a change ([decision 6](#open-decisions)).

### First rounds

- **Level 1 (authored):** three lights at stop 4 across the window, small and dim. She taps the middle one: its ring brightens at once, it floats to stop 1 over 0.8 s (three rising notes as its halo swells), the pet says "Ooh, so bright!", it holds 1.5 s and drifts back. **The light's glow never changes; only its stop does.** A tap on a light already moving is free and not counted. Repeats count, so three taps on one light finish too. The round finishes 1 s after the third counted light has drifted back.
- **Level 2 (authored):** lane A's light at stop 4, lane B's at stop 3. She drags A toward the window: each stop it crosses rings a higher note and its halo steps up; at its first arrival at each nearer stop the pet says "Brighter!" (once per stop per light). Dragging away is free ("Dimmer."). A light can rest at stop 1 while she moves the other. The round finishes 1 s after both rest at stop 1, with "It looks brighter, not bigger."
- **Level 3 (authored):** pair one, lane A at stop 1 and lane B at stop 3. "Which light looks brighter from the window? Tap it!" She taps B: a boing and "That one looks dimmer. It's farther away." (a miss); she taps A: a chime, A bobs in the strip, "That one's nearer, so it looks brighter!". Pair two is seeded with the brighter in lane B and a different pair. Lights in the strip bob when tapped but do not answer (free).
- **Level 4 (authored):** reference in lane A at stop 2 (a small mooring rope marks it in the strip; it cannot be dragged); the movable light in lane B at stop 4. She drags B to stop 1 and presses Check: "This one looks brighter. Move it farther away." (a miss). She drags it to stop 2 and presses Check: "They look the same!". Board two is seeded with lanes swapped and the other reference stop.

## Accounting, help and finishing

- **Levels 1–2: no misses, ever.** **The shell has no exploratory round flag:** `RoundResult` carries only `misses` and `hints`, and `src/progress/difficulty.ts` steps up after two smooth rounds. With the ranges above, a toddler at level 1 moves to level 2 after two rounds without Show a hint, and a preschooler at level 2 moves to level 3 the same way. **Default, with no shell change:** accept both steps, as Moon Window's and Puddle Lens's packets do, and say on the how-to card that these levels are for looking, not evidence of what she knows. The alternative is a shared exploratory flag on `RoundResult` (Space, Puddle Lens, Sand Table and Far Lights would all use it), which is shell work in its own slice and would gate this build ([decision 3](#open-decisions)).
- **Level 3 misses:** each wrong tap in the window is one miss, with a boing and the named reason. After **two misses on one pair**, the brighter light glows (a standing glow; counts nothing extra).
- **Level 4 misses:** only Check can miss: each wrong Check is one miss, named "This one looks brighter. Move it farther away." or "This one looks dimmer. Move it closer.". Dragging is always free. After two misses on one board, the matching stop's post in the movable lane glows.
- **Hints** (at most **one counted per board, pair or tap**): Show a hint in the pause sheet. Level 1: the light nearest her last touch pulses and floats by itself (counted as that tap). Level 2: the light farther from the window steps one stop closer by itself. Level 3: the brighter light pulses. Level 4: the movable light glides to `r`, and she still presses Check. Asking again on the same board repeats the help without counting.
- **Supported completion:** the glow plus a hint leaves only one tap (level 3) or one Check (level 4). Nothing times out, and nothing is ever taken away.
- **Finish:** after the last board both lights bob once and `ctx.finish({ misses, hints })`; one ordinary sticker from the shell, with or without help. Nothing is kept or saved; no `discoveries` and no journal entry ([decision 7](#open-decisions)).

## Speech (`voice-script.ts`)

Lines under `far.*`: `intro`; `instruct.glow` ("Tap a little light!"); `instruct.closer` ("Bring the lights close to the window!"); `instruct.brighter` ("Which light looks brighter from the window? Tap it!"); `instruct.match` ("Move the light until both look the same, then press the check!"); `so-bright` ("Ooh, so bright!"); `brighter` ("Brighter!"); `dimmer` ("Dimmer."); `not-bigger` ("It looks brighter, not bigger."); `right-brighter` ("That one's nearer, so it looks brighter!"); `wrong-brighter` ("That one looks dimmer. It's farther away."); `same` ("They look the same!"); `too-bright` ("This one looks brighter. Move it farther away."); `too-dim` ("This one looks dimmer. Move it closer."); `hint`; `done`.

Every line describes **these lights from this window**. No line says star, Sun, planet, lantern, "twice", "a quarter" or "the law"; stars arrive with levels 5–8 after review. No line suggests looking at the Sun or through any instrument.

## Rule tests (`logic.test.ts`)

- **Model:** `look` is strictly decreasing in stop for glow 1; the halo radius is strictly decreasing and its area is proportional to `look`; the core radius is the same at every stop; the side view's drawn glow is the same at every stop.
- **Level 3:** across 500 seeds every round is two different pairs from the legal set, never `{3,4}`, with the brighter in lane A once and lane B once; in every pair the brighter looks at least twice as bright; `judgeBrighter` accepts exactly the nearer light.
- **Level 4:** across 500 seeds every board has `r ∈ {1,2}` and a start from the table; exactly one stop judges `'same'`; **every other stop a Check can judge differs from the reference at least twofold**; `'too-bright'` exactly at stops nearer than `r` and `'too-dim'` exactly farther; the two boards swap lanes and use different `r`; a scripted board (wrong Check, Show a hint, Show a hint again, Check) counts one miss and one hint and finishes.
- **Help:** `helpFor` names the brighter lane (level 3) and `r` (level 4); following it finishes every seeded round. Two wrong taps on a level-3 pair light the brighter light.
- **Levels 1–2:** exactly three counted taps finish level 1 once, and taps on a moving light do not count; at level 2 every stop crossed toward the window increases `look`, a release snaps to the nearest stop, both lights can always reach stop 1, the cheer plays once per stop per light, and nothing at either level counts a miss.
- **Layout:** `farLayout` in the four views `lands.test.ts` uses (landscape, portrait, phone, notch) at every level gives touch areas at least 120 (160 at level 1) **independent of halo size**, stops at least 120 apart, lanes at least 120 tall, a window view at least 440×300, a Check at least 120, nothing overlapping the home button, the `?` button or the guide's corner, everything inside `view`, and null rather than smaller.
- **Registry, lands and how-to tests** pass with the new game, including its home land on one screen at every band.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` follows `helpFor`. Level 1: three taps on different lights, each after the last has drifted back. Level 2: the real drag of each light from its stop to stop 1, pausing 0.3 s on each stop so the window can be seen. Level 3: a tap on the brighter light in the window. Level 4: a real drag of the movable light to `r`, then Check.
- **How-to card** (`src/content/howto.ts`). Goal: "See how a light looks brighter when it is nearer."
  - Steps: "Tap a light; it floats close to the window and glows up, then drifts back" `{ from: 1, to: 1 }`; "Drag each light along its path to the window" `{ from: 2, to: 2 }`; "Tap the light that looks brighter in the window" `{ from: 3, to: 3 }`; "Drag the loose light until both look the same in the window, then press the tick" `{ from: 4, to: 4 }`.
  - Finish: "Three taps" `{ from: 1, to: 1 }`; "Both lights at the window" `{ from: 2, to: 2 }`; "Two pairs" `{ from: 3, to: 3 }`; "Two lights matched" `{ from: 4, to: 4 }`.
  - Notes: "The halo shows how bright a light looks, not how big it is; every light here is the same" (all levels); "Nothing here is ever wrong; these levels are for looking, not a sign of what she knows" `{ from: 1, to: 2 }`; "Moving a light is never wrong; only a tap on the dimmer light, or a tick that does not match, counts" `{ from: 3, to: 4 }`; "Show a hint counts once per pair or board" `{ from: 3, to: 4 }`; "A toy model: real stars also differ in their own brightness" (all levels).
- **Registration:** ID `far-lights`, name "Far Lights", spoken title `game.far-lights` ("Far lights"). Region (subject) `tinker-lab`, the science subject. Skills `['observation', 'comparing', 'distance', 'brightness']` (free strings; `distance` and `brightness` are new). Bands as above, child `GAMES` only. Hub icon: a round window with two halos, one big and one small. Sticker: a seeded pair of lights over the lake, one near and one far.
- **Art:** code-drawn in `src/games/far-lights/art.ts` with `src/art/palette.ts`: the night lake, the house and window, posts, the lights (original floating lights with soft faces only in the strip, never in the window view), the halo, the rope and the Check. The companion comes from `ctx.companion()` in the guide's corner. No imported art or audio.
- **Co-play:** "Hand over the lake" from the study's arrange-and-guess: at level 3 a grown-up covers the side strip with a hand, she picks the brighter light from the window, and they lift the hand to see which is nearer. **Off-screen** (spoken tip, no equipment): "Tonight, look out of a window. Does a near light or a far light look brighter?" No torch-walking card, Sun, eclipse or telescope instruction ([decision 5](#open-decisions)).
- **Couch:** none. **Rework couplings:** none required. The study's Discovery Club project ("How can everyone see the lantern-boat festival?") and a journal line are later rework work.

## Home land and capacity

Not measured in this docs-only session. Known measurements: Tinker Lab lists **12** games today; Gear Garden's [probe](gear-garden.md#home-land-and-capacity) found that a 13th fits and a 14th fails at pre-K, school and grown-up. Gear Garden, Sense Detective (queued), Moon Window and Rain Garden already default to that last place, under Gear Garden's rule that whichever builds first takes it.

Default **Tinker Lab**, the study's and the Waiting row's lean, under the same first-to-build rule. Fallback **Music Mountain**, the only uncontested land (6 games today, 7 with Far Lights): a lookout over the night lake fits the scene, and other lands already hold 12–13, though `lands.test.ts` decides at build time. The rework's Explore places are for later.

## Check tier

New-game tier: typecheck and unit tests (above, plus registry, lands and how-to). Then one scripted play through a new `browser-check.mjs` case (and its README row): level 1 (three taps) and level 4 (one too-bright Check, Show a hint, Check, then board two), one portrait screenshot of level 3 with both views, `fingerdemo` at levels 1, 2 and 4, and `npm run build`, because the registry, lands, voice and how-to files change.

Device and person checks stay open: whether a lap child links her tap to the swelling halo; whether a toddler keeps a light moving along its lane with one finger on an iPad; whether a four-year-old reads the halo as brighter rather than bigger; whether the stop-4 halo is visible on the iPad in a lit room; and how the iPad says "brighter, not bigger". Browser automation establishes none of these.

## What comes next

**Far Lights 5–8** is defined below. Its builds are two sessions: **5–6** (the curtain and ordering), then **7–8** (unequal glows and the sideways step) [after 5–6](#build-slices-levels-58).

## Levels 5–8 (definition)

Defined 2026-11-06 from the study's [ladder](../deep-dives/subjects/astronomy.md#proposed-levels-and-bands) rows 5–8 and its [decisions of 2026-10-23](../deep-dives/subjects/astronomy.md#decisions-for-the-developer): 7–8 sit at the top of `school`; the scientific check is the building session's check against cited sources, with no named educator; "both could fit" follows Space's policy, so the ordinary level rule applies and there is no exploratory flag. Docs only: nothing below exists in code yet.

**What these levels add:** the side view goes behind a **curtain**. At 5–6 she works out how far the lights are from how bright they look, then lifts the curtain to see. At 7–8 lights differ in their **own glow**: a strong light far away can look the same as a gentle light nearby, and at 8 she cannot tell which is which until she steps to the side and watches the lights shift. Every line still talks about **these lights from this window**: no star, Sun, planet or law is named ([wording](#speech-and-the-held-wording-levels-58)).

### The model, extended (`logic.ts`)

- **Glows** `1` (gentle), `4` (strong) and `9` (strongest). `look(glow, stop) = glow / stop²`, as built. The full table:

| Glow \ stop | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- |
| 1 | 1 | 0.25 | 0.111 | 0.0625 |
| 4 | *4* | **1** | 0.444 | **0.25** |
| 9 | *9* | *2.25* | **1** | 0.5625 |

- **Exactly equal looks** with different glows: `{1@1, 4@2, 9@3}` all look `1`; `{1@2, 4@4}` both look `0.25`. No other look repeats.
- **Frozen cells.** A light may be **shown resting** only at `1@1–4`, `4@2`, `4@4` and `9@3`, plus `4@3` only during level 7's opening look ([level 7](#levels-58)). Never shown: `4@1`, `9@1`, `9@2` (look over 1, which would draw a halo past `HALO_MAX` = 110 and break the window layout) and `9@4` (0.5625 is within 2× of both 1 and 0.444). **No resting state ever has look over 1**, so `haloRadius` and the built layout checks stay as they are. Passing states while a light glides are never judged.
- **Readable steps, unchanged:** two judged lights count as different only at least twofold apart, and as the same only if exactly equal. Every judged board below is listed with its ratios.
- **Own glow in the side view** (levels 7–8 only, once the curtain lifts): each light carries one, two or three thin rings of short rays for glow 1, 4 and 9. **The core and the float stay the same size**; the rays never appear in the window view. "Strong" means its own glow, never its size.
- **Toy parallax** (level 8): a sideways step moves the window view; a light at stop `s` shifts by `120 / s` units against **far trees** on the horizon, which do not move (shifts 120, 60, 40 at stops 1–3). Two shifts count as readably different only if one is at least twice the other **and** they differ by at least 50 units. This is a labelled toy: no distance follows from the shift, and no line names parallax.
- **The curtain** covers the whole side strip at levels 5–8 and lifts (0.6 s) to reveal the lights on their stops. At these levels the strip is **display only**: nothing in it is dragged or judged, so its lanes need not be 120 tall; the touch areas live in the window and on the curtain's tassel.

### Levels 5–8

| Level | Name | What she does | Round |
| --- | --- | --- | --- |
| 5 | **Behind the curtain** | Two gentle lights; taps the one that is **farther away**; the curtain lifts | Two pairs |
| 6 | **Near to far** | Three gentle lights; taps them nearest first, then pulls the tassel to lift the curtain and check | Two boards |
| 7 | **Strong and gentle** | Sees a strong and a gentle light side by side, watches the gentle one come until both look the same, then taps the one that is farther | Two boards |
| 8 | **Can't tell yet** | Two lights look the same, glows hidden; says "both could fit", steps to the side, then taps the farther | Two boards |

Every round is **two boards**, where the study's ladder says one board for levels 4–8: the built levels 3–4 use two, and two let the second board swap lanes. Recorded as a departure ([decision 8](#open-decisions)).

**Level 5 boards:** the level-3 pair set `{1,2}`, `{1,3}`, `{1,4}`, `{2,3}`, `{2,4}` (never `{3,4}`; every pair at least 2.25×), both glow 1, the farther in lane A once and lane B once, the two pairs different. `judgeFarther(pair, lane)` accepts exactly the farther (dimmer-looking) light.

**Level 6 boards:** three glow-1 lights at stops `{1,2,3}` or `{1,2,4}` (every adjacent pair at least 2.25×; `{x,3,4}` never), placed in the window's three spots in a seeded order that is never already nearest-to-farthest left to right; the two boards use both stop sets. Tapping a light gives it the next order mark (one, two, three dots on its touch ring); tapping a marked light clears its mark and every later mark (free). Once all three are marked, the tassel glows; pulling it checks. `judgeOrder(board, picks)` returns `'right'` or the first wrong position. The only accepted order is nearest first.

**Level 7 boards** (the stronger is always the farther, the looks always exactly equal):

| Pair | Look | Opening look (both at the strong light's stop) | Ratio there |
| --- | --- | --- | --- |
| `1@1` + `4@2` | 1 | `1@2` beside `4@2` | 4× |
| `1@1` + `9@3` | 1 | `1@3` beside `9@3` | 9× |
| `4@2` + `9@3` | 1 | `4@3` beside `9@3` | 2.25× |
| `1@2` + `4@4` | 0.25 | `1@4` beside `4@4` | 4× |

A board opens with the curtain down and both lights at the strong light's stop, so in the window the strong one plainly looks brighter ("This one is a strong light."). Then the gentle light glides nearer to its own stop (1.2 s) until both look exactly the same ("Now they look the same!"). She taps the one that is farther. The two boards use different pairs, with the strong light in lane A once and lane B once. `judgeFarther` accepts exactly the strong light.

**Level 8 boards:** only `1@1` + `4@2` (shifts 120 vs 60) and `1@1` + `9@3` (120 vs 40), one each, strong light in lane A once and B once. `4@2` + `9@3` (60 vs 40, 1.5×) and `1@2` + `4@4` (60 vs 30, a 30-unit difference) fail the readable-shift rule and never appear here. The curtain stays down and **the glows are hidden**.

- **Before the step**, both lights look `1`. The explanations that fit are every assignment of `{1@1, 4@2, 9@3}` to the two lanes: the farther light could be A, could be B, or they could be at the same stop. `candidates(board, null)` lists them; more than one "which is farther" answer survives. Pressing **Both could fit** (a 120 button: two lights with a two-way arrow) is the right answer: a chime, "Both could fit! Let's step to the side and look again.", and the step button appears.
- **A light tapped before the step is a prediction, never a miss:** "Maybe! A strong light far away could look the same. We can't tell yet." Both could fit then pulses, and the round goes on as above.
- **The step:** a 120 button (two footprints and an arrow). The window glides sideways over 1 s; the far trees stay put, each light shifts left by its toy shift, and a faint ring stays where each light was. Pressing it again steps back and forth, free. After the first step, `candidates(board, shifts)` leaves exactly one assignment. She taps the farther light: "It hardly moved, so it's farther away!", then the curtain lifts and shows both glows' rays.

**Bands:** `school: { min: 4, max: 8 }`. Levels 5–6 serve the study's school window (4–6), 7–8 its top for 9–12 (decided 2026-10-23); pre-K stays `{3, 4}` and every other band is unchanged. Appending levels renumbers nothing, so saved levels and pins keep their meaning. Still no `grownup` range.

### Screen and controls, levels 5–8

- **The strip** keeps its place and height (260) above the window. At level 6 it holds **three display lanes** of 80 inside the same height; at 5, 7 and 8, the built two lanes. Nothing in it is a touch target except the curtain's **tassel**: a 120 circle at the strip's right end, which lifts the curtain at level 6 (Check) and replays the lifted view after a board ends (free).
- **The window** keeps its built size (at least 824×448 in all four test views; measured on the built `farLayout`). Answer touch areas are circles **120** across around each light, independent of halo size.
  - Level 5 and 7: the two built spots, at least 240 apart.
  - Level 6: three spots at least 240 apart in a row (two stop-1 halos never meet; `2×240 + 2×110 = 700 ≤ 824`).
  - Level 8: the two spots and two 120 buttons (Both could fit, then the step) along the window's bottom edge. Every halo stays inside the window at **both** step positions and never meets another halo or a button: with spots ±150 from the centre and a 120 shift, the outermost halo edge is 380 from the centre, inside 412.
- **`farLayout(view, level)`** gains branches for 5–8 and still returns **null** rather than give a touch area under 120, a tassel under 120, a window under 440×300 or a halo outside the window at either step position; the layout test runs every level in all four views.
- **Touch:** taps through `onTap` with the core ring brightening on touch-down, as built. Levels 5–8 drag nothing.

### Accounting, help and finishing, levels 5–8

- **Level 5:** each tap on the nearer light is one miss, "That one looks brighter, so it's nearer." Two misses on one pair: the farther light glows.
- **Level 6:** marking is free; each pull of the tassel with a wrong order is one miss, naming the first wrong place ("The brightest one is nearest. Look again!" or "Which one looks dimmest? That one is farthest."), and the curtain stays down. Two misses on one board: the next correct light glows.
- **Level 7:** each tap on the gentle light is one miss, "That's the gentle light. It had to come close to look as bright." Two misses: the strong light glows.
- **Level 8:** before the step nothing can miss. After it, each tap on the nearer light is one miss, "That one moved a lot, so it's nearer." Two misses after the step: the farther light glows.
- **Hints** (Show a hint in the pause sheet, at most **one counted per board or pair**; asking again repeats it free): 5, the farther light pulses; 6, the nearest unmarked light is marked and locked in place by itself, which leaves a solvable board; 7, the opening look replays (the gentle light slides back out and in again) and the strong light pulses; 8, before the step Both could fit pulses, after it the two faint rings and the lights are joined by short lines so both shifts show side by side, and the farther light pulses.
- **Supported completion:** a glow plus a hint always leaves one tap, or at level 6 one pull. Nothing times out.
- **Finish:** as built, `ctx.finish({ misses, hints })` after the second board; one ordinary sticker. The 0-miss "both could fit" counts as a smooth round under the ordinary rule (decided 2026-10-23; the card says these rounds are not proof).
- **Journal (level 7):** a finished level-7 round files `entryId('far-lights', 'strong-far')` ("A strong light far away"; line `far.journal.strong-far`: "A strong light far away can look as bright as a gentle light close by."; find "tell which light is farther when a strong light and a gentle light look the same", found "a strong light far away looked as bright as a gentle light close by") in `src/content/journal.ts`, with `JournalGame` extended to `far-lights` and the journal tests updated. Levels 1–6 and 8 file nothing. This replaces [decision 7](#open-decisions)'s "belongs to level 7" placeholder with a default; its old wording ("small light") is dropped because the game never calls a light small.

### Speech and the held wording, levels 5–8

New lines under `far.*`: `instruct.farther` ("Which light is farther away? Tap it!"); `instruct.order` ("Tap the lights from nearest to farthest, then pull the curtain!"); `instruct.strong` ("Which light is farther away? Tap it!", reusing `instruct.farther`'s text under its own ID); `instruct.cant-tell` ("They look the same. Which one is farther? Or could it be either?"); `right-farther` ("Yes! It looks dimmer, so it's farther away."); `wrong-farther` ("That one looks brighter, so it's nearer."); `curtain` ("Let's lift the curtain!"); `order-right` ("Nearest to farthest!"); `order-first` ("The brightest one is nearest. Look again!"); `order-last` ("Which one looks dimmest? That one is farthest."); `strong-look` ("This one is a strong light."); `same-now` ("Now they look the same!"); `right-strong` ("That strong light is farther away. It looks just as bright as the gentle light up close."); `wrong-strong` ("That's the gentle light. It had to come close to look as bright."); `both-fit` ("Both could fit! Let's step to the side and look again."); `maybe` ("Maybe! A strong light far away could look the same. We can't tell yet."); `step` ("Step to the side!"); `right-step` ("It hardly moved, so it's farther away!"); `wrong-step` ("That one moved a lot, so it's nearer."); `journal.strong-far` (above).

**Held for the building session's cited-source check** (the 2026-10-23 decision; this docs session opened no source): the toy-parallax lines `right-step`, `wrong-step` and the card note on stepping, and the card's own-glow note. They claim only qualitative relations: a nearer thing seems to shift more against faraway things when you step sideways, and a light's look depends on both its own glow and its distance. The build session opens at least one source for each (an agency or university astronomy page on parallax and on apparent brightness) and cites it in its verification entry; if a source contradicts a line, it rewrites the line before merging rather than shipping it. No line names a star, parallax, a ratio or a law; stars stay out of the voice script.

### Rule tests (`logic.test.ts`), levels 5–8

- **Model:** the look table above; the exactly-equal sets are exactly `{1@1, 4@2, 9@3}` and `{1@2, 4@4}`; no resting cell any board can show has look over 1; the side-view rays differ by glow while the core and float radii do not.
- **Level 5:** across 500 seeds, two different legal pairs, the farther in lane A once and B once, at least 2.25× apart; `judgeFarther` accepts exactly the farther; following `helpFor` finishes.
- **Level 6:** across 500 seeds, stop sets `{1,2,3}` and `{1,2,4}` one each, never already in order left to right; exactly one accepted order; every adjacent pair at least 2.25×; from **any** set of locked hint marks the board stays solvable; clearing a mark clears the later ones; a scripted board (wrong pull, hint, hint again, right pull) counts one miss and one hint.
- **Level 7:** every board is one of the four listed pairs; the looks are exactly equal; the stronger is the farther; the opening look differs at least 2.25×; two boards differ and swap lanes; a finished round reports the journal discovery.
- **Level 8:** only the two listed pairs; before the step `candidates` holds more than one "which is farther" answer, and after it exactly one, which is the strong light; every shift pair is at least 2× and 50 apart; a tap before the step never counts; Both could fit never counts; a scripted board (tap before, Both could fit, step, wrong tap, hint, right tap) counts one miss and one hint.
- **Layout:** `farLayout` at levels 5–8 in the four views: touch areas and tassel at least 120 and clear of the corners and each other, three display lanes inside the strip at 6, every halo inside the window and apart at both step positions at 8, buttons clear of halos, and null rather than smaller.
- **Registry:** the school range is `{4, 8}` and `describeLevel` names levels 5–8.

### Ghost finger, how-to card and registration, levels 5–8

- **Ghost finger** (`autotouch()` follows `helpFor`): 5, a tap on the farther light; 6, three taps nearest first, then the tassel; 7, waits for the opening look to finish, then taps the strong light; 8, Both could fit, the step, a 0.5 s pause, then a tap on the farther light. `fingerdemo` runs at the top new level of each build (6, then 8).
- **How-to card**, extending the built steps:
  - Steps: "Tap the light that is farther away, then watch the curtain lift" `{ from: 5, to: 5 }`; "Tap the lights from nearest to farthest, then pull the tassel" `{ from: 6, to: 6 }`; "Watch a strong light and a gentle light come to look the same, then tap the farther one" `{ from: 7, to: 7 }`; "Press Both could fit, step to the side, then tap the light that moved less" `{ from: 8, to: 8 }`.
  - Finish: "Two pairs" `{ from: 5, to: 5 }`; "Two boards" `{ from: 6, to: 8 }`.
  - Notes: "Changing a mark is never wrong; only pulling the tassel with the wrong order counts" `{ from: 6, to: 6 }`; "Some lights are stronger than others; their rays show only once the curtain lifts" `{ from: 7, to: 8 }`; "Before the step, picking a light is a guess and never counts; Both could fit is the right answer" `{ from: 8, to: 8 }`; "A toy: when you step to the side, nearer things seem to shift more against faraway trees" `{ from: 8, to: 8 }`; "Show a hint counts once per pair or board" widened to `{ from: 3, to: 8 }`. The built note "A toy model: real stars also differ in their own brightness" stays for all levels.
- **`PLANS`** gains: 5 "Behind the curtain: tap the farther light"; 6 "Near to far: put three lights in order"; 7 "Strong and gentle: which light is farther when both look the same?"; 8 "Can't tell yet: both could fit, then step to the side".
- **Art** (`art.ts`): the curtain and tassel, the order dots, the ray rings, the far trees and the two buttons, code-drawn with the palette. **Sound:** the curtain lift a soft rising pentatonic run, the step a two-note shuffle; the island style keeps playing.
- **Co-play** (extends "Hand over the lake"): at level 6 the grown-up and she take turns marking; at level 8 she says out loud "both could fit" before anyone steps. **Off-screen** (spoken tip, unchanged in kind): "Next time you're in a car or on a walk, look out of the side: do near things or far things seem to go past faster?" Never Sun or telescope advice.
- **Couch** none; **land** unchanged (Tinker Lab, where the game already lives, so the lands test is unaffected).

### Build slices, levels 5–8

1. **Far Lights 5–6** (new-interaction tier: the curtain, three-light ordering and the tassel): typecheck and rule tests; one scripted play of levels 5 and 6 (one wrong tap at 5, a wrong pull and Show a hint at 6); one portrait screenshot of level 6 with the curtain down and the order marks on; `fingerdemo` at 6; `npm run build` (voice, how-to and registry files change).
2. **Far Lights 7–8, after 5–6** (new-interaction tier: the opening look, Both could fit and the sideways step): the same tiers, scripted at 7 (one wrong tap) and 8 (a tap before the step, Both could fit, the step, a wrong tap, Show a hint); one portrait screenshot of level 8 after the step; `fingerdemo` at 8; the cited-source check of the [held wording](#speech-and-the-held-wording-levels-58) in its verification entry; `npm run build`.

Device and person checks to add when each builds: whether a seven-year-old works out "farther" from a dimmer halo without the strip; whether the order dots read as order without numbers; whether the 40-unit shift at level 8 is visible on the iPad; and whether "both could fit" makes sense said aloud by the iPad voice.

## Open decisions

Each has a default; decisions 1–3 are the Waiting row's and must be confirmed before registration.

1. **Identity.** Default: a new game beside Light Lab, whose action (aiming a beam) and learning (paths) differ ([identity](#identity-and-overlap)).
2. **Home land.** Default Tinker Lab if its last place is still free when this builds; fallback Music Mountain ([capacity](#home-land-and-capacity)).
3. **Levels 1–2 accounting.** Default: no shell change, the ordinary rule, stated on the card as not mastery. Alternative: a shared exploratory `RoundResult` flag, built first in its own slice.
4. **Reviewer.** Default: levels 1–4 claim only the order (nearer looks brighter for identical lights) and never a ratio, so the astronomy educator (study decision 2, not named) gates levels 5–8, the halo-area convention's use in any comparison of unequal lights, and any quantitative line, not this build. Alternative: the reviewer reads the [model](#the-model-logicts) and the card's toy note before this build merges.
5. **Practical card.** None drafted beyond the spoken looking tip. A torch-and-distance card needs a named reviewer; never Sun, eclipse or telescope viewing.
6. **Level 4 round.** Default two boards (lanes swapped). Alternative: the study's one board.
7. **Journal.** Default: no journal entry or discoveries at levels 1–6 or 8; level 7 files `far-lights:strong-far` ([levels 5–8](#accounting-help-and-finishing-levels-58)).
8. **Rounds at 5–8.** Default two boards (or pairs) at every level, as built at 3–4. Alternative: the study's one board.
9. **Level 8's pairs.** Default only the two pairs with a light at stop 1, so every shift reads at least twofold and 50 apart. Alternative: a larger step (a bigger window shift) to admit `1@2 + 4@4`, which the layout would have to prove.
