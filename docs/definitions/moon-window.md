# Moon Window, levels 1–3 (definition)

Defined 2026-10-22 as slice 1 of the [space study](../deep-dives/subjects/space.md#build-slices-in-order), from its [first game's ladder](../deep-dives/subjects/space.md#a-first-games-ladder-moon-window), the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#space-science-recommendations) and the notebook seed ([IDEAS](../IDEAS.md)). Nothing is built.

**Status: defined; the build (the study's slice 2) waits on the developer.** The [Waiting row](../WAITING-ON-DEVELOPER.md) "Space: model review, placement and exploration accounting" asks for the identity, band windows and land to be confirmed **before registration**, and for an adaptation policy that does not treat three presses as phase mastery. This packet gives a default for each ([open decisions](#open-decisions)); the build starts when the developer accepts or changes them. The astronomy-educator review (study decision 2) gates the causal model at levels 4–7, not levels 1–3. Levels 1–3 claim nothing about why the Moon changes: they show views drawn from the model and ask her to look, match and compare.

**Fun action and purpose:** a big round window looks out at a quiet night sky with the Moon in it. She presses a large **Later** button: the window dims for a moment, then opens again on how the Moon looks some days later. At level 2 a Moon card has to match the window, and at level 3 she picks which of two Moons shows more light (or less). The learning purpose is **noticing that the Moon's look changes, and comparing how much of it is lit** ([NGSS 1-ESS1-1](https://www.nextgenscience.org/pe/1-ess1-1-earths-place-universe), opened in the study: observe and describe recurring Moon patterns, with no causal explanation asked). A correct card proves a correct card in this toy; it is not evidence that she knows phases or their cause.

## Identity and overlap

- **The notebook seed** "Moon Window" is this game; the study develops it rather than adding a second Moon toy. Its original "next night" wording is replaced: views are **snapshots some days apart**, never consecutive nights.
- **Light Lab** (Tinker Lab) keeps mirrors and rays; nothing here reflects or aims light.
- **Day by Day** keeps the pretend week and daylight records; Moon Window never reads the device date, never asks her to come back on a later night and has no calendar.
- **Photo Safari**'s proposed Night Safari (astronomy study) photographs a Moon in a scene; Moon Window compares the Moon's lit part, which Photo Safari does not.
- **Far Lights** (astronomy, proposed) owns brightness with distance. "More light" here means **more of the Moon is lit**, never a brighter or nearer Moon: both Moons in a comparison are drawn the same size and the same brightness.
- **Opposites** (`Sun or moon`, Pet Says) use the Moon as a word; no overlap.

## The model (`logic.ts`)

- **Stops.** Eight samples of one smooth cycle, `k = 0..7`, with Moon angle `theta = k × 45°` measured from the Sun direction (study model). Each stop's **lit fraction** is `(1 − cos theta) / 2`: 0 (k 0), about 0.15 (k 1 and 7), 0.5 (k 2 and 6), about 0.85 (k 3 and 5), 1 (k 4). Neighbouring stops are about 3.7 days apart; they are samples of the cycle, not eight named phases of equal length and not eight nights.
- **Drawing a stop** (`moonShape(k, r)`): a disk of radius `r`. The lit region is half the disk on the lit side joined to half an ellipse whose horizontal semi-axis is `r × |cos theta|` (the projected terminator of a lit sphere), never a straight pie wedge. For `k` 1–3 the lit side is the right, for 5–7 the left (one fixed model-up convention; [decision 4](#open-decisions)); k 0 draws no Moon, k 4 the full disk. The unlit part is a faint grey-blue disk only at k 1–7, so she sees the whole Moon's outline beside its lit part; at k 0 the window shows sky and stars alone.
- **A view** is `{ k }`; the **later** view is `{ (k + 1) mod 8 }`. Time only moves forward and wraps around.
- **Level 1 round:** a start stop and three Later presses, so four views in model order. The start is any stop with at least one lit view among the first two (so a round never opens on two empty windows). The authored first round is **k 1 → 2 → 3 → 4** (thin crescent, half, mostly lit, full).
- **Level 2 board:** a target stop `t` in 1–7 shown in the window, and two cards: the **match** (stop `t`, drawn identically) and a **different** stop `d` in 1–7 with `|lit(t) − lit(d)| ≥ 0.3`. A round is two boards with different targets. The 0.3 threshold rules out a mirrored twin (k 1 against 7, 2 against 6, 3 against 5: the same lit amount on the other side) and the near pair of mostly lit against full (difference about 0.15), so the cards always differ in how much is lit, never only in which side.
- **Level 3 comparison:** two Moons `a` and `b` in 1–7, with `|lit(a) − lit(b)| ≥ 0.3`, and a request, `more` or `less`. The answer is the Moon with the larger (more) or smaller (less) lit fraction; it is always unique because of the threshold. A round is three comparisons, at least one of each request, the left/right position of the answer not the same all three times. Mirror orientation never decides an answer: a pair may mix sides (a right-lit crescent against a left-lit half), and the answer follows the lit amount alone.
- **Check** `check(state, pick)` returns `right`, `wrong` (with the answer), or `ignore` (a card already shown wrong on this board, a tap during the window's dip, or the window itself).
- **Hint** `hintFor(state)` returns the right card (levels 2–3), or Later (level 1).
- **Cases** are seeded from `ctx.rng` within these rules; the first round of each level is authored (below) so the how-to card and demonstration open on the same story.

## Screen and controls

- **The window** is a large round frame (a porthole-shaped window in a wooden wall) on the left half, at least 300 logical units across in landscape, with a quiet night sky: a few stars, no clock, no horizon, no buildings, nothing that implies an hour. The Moon sits in the middle at radius about 90. Day, dusk and night tints are **not** used: the sky colour never changes, so the only thing that changes between views is the Moon.
- **Level 1: Later.** One large pictured button right of the window, at least 140 × 140: a curved arrow over three small dots (some days going by), never a clock. Touch-down squashes it at once; the window's shutter dims for about 0.4 s with a soft pentatonic chime, and opens on the next view before the pet speaks. Presses during the dip are ignored. Nothing is timed.
- **The replay ribbon** runs along the bottom, right of the guide's corner: one thumbnail per view seen this round (at least 110 × 110 each, four at most at level 1), left to right in the order she saw them. Tapping a thumbnail plays its line again ("A thin slice of Moon") and pulses it; it never changes the window and never counts. The ribbon is a record, not a memory test.
- **Levels 2–3: cards.** Two large Moon cards (at least 170 × 170, the Moon inside at the same radius as the window's at level 3, slightly smaller at level 2), side by side right of the window in landscape and below it in portrait. At level 3 the window shows only the sky and the two cards carry the Moons, each in its own small round frame, so the two are compared side by side at one size. A request card above them shows a big glowing Moon and an arrow up (more) or a small glow and an arrow down (less), spoken every time.
- **A tap on a card commits** (no separate check button: the tap is the pictured check the study asks for, and toddlers play level 2). Touch-down lifts the card at once.
- **`windowLayout(view)`** returns the window, the Later button, the two card boxes, the request card and the ribbon's slots. A test runs it at the four views `lands.test.ts` uses (landscape, portrait, phone, notch) and asserts every control at least the sizes above, no overlaps, the home and help buttons (top-left) and the guide's bottom-left corner clear, everything inside `view`, and both Moons at level 3 drawn at the same radius. If a view cannot fit, it returns null rather than shrink, and the test fails.
- **Pause sheet:** Start again (the same seeded round from its first view or board, keeping misses and hints) and Show a hint (`Scene.pauseActions`).
- **Music:** `STYLES.lullaby` keeps playing underneath; it is only the calm loop, with no bedtime framing and nothing that says it is night-time for her. The chime and card sounds are pentatonic steps from `src/audio/notes.ts`.

## Levels

| Level | Name | Bands (default) | What she decides | Round |
| --- | --- | --- | --- | --- |
| 1 | **Look again** | lap, toddler | When to look again; any press works | Three Later presses |
| 2 | **Same view** | toddler, preschool | Which card shows the same Moon as the window | Two boards |
| 3 | **More light** | preschool, pre-K | Which of two Moons shows more (or less) light | Three comparisons |

Ranges ([decision 2](#open-decisions)): lap 1, toddler 1–2, preschool 2–3, pre-K 3. School is not listed until levels 4–5 exist (the study's school window starts at 4).

### First rounds

- **Level 1 (authored):** the window shows a thin slice of Moon, lit on the right. Pet: "Look! A thin slice of Moon." She presses Later: the shutter dims and opens on a half-lit Moon; "Some days later, half of it is lit." Later again: mostly lit. Later again: the whole round Moon, "All of it is lit! A full Moon." The ribbon holds four thumbnails; the sticker follows.
- **Level 2 (authored):** the window shows a half-lit Moon. Two cards: a thin slice and the half Moon. "Which card looks the same as the window?" She taps the thin slice: boing, the card slides next to the window so both show together, and the pet says, "This one has a little light. The window has half." (one miss). She taps the half Moon: it flies into the window and fits exactly, with a chime. Then a full Moon against a thin slice.
- **Level 3 (authored):** a full Moon and a thin slice, side by side. "Which Moon shows more light?" She taps the full Moon: it glows and the pet says, "All of it is lit!" Then "Which Moon shows less light?" with a half Moon and a mostly lit Moon; then one seeded comparison.

## Accounting, help and finishing

- **Level 1 has no misses and no hints.** Every press works; the round finishes after the third press and the fourth view's line, then `ctx.finish({ misses: 0, hints: 0 })`. Show a hint on the pause sheet pulses Later and counts nothing.
- **A miss** (levels 2–3) is a tap on the wrong card, counted once per board. The wrong card slides beside the window (level 2) or both cards outline their lit part (level 3), and the pet compares them in words ("This one has a little light; that one has a lot"). The card returns and stays tappable; a second tap on the same wrong card on that board is ignored.
- **Never a miss:** tapping the window, the ribbon or the request card (it replays the request), taps during an animation, replays.
- **Hints.** Levels 2–3 have two cards, so one wrong tap leaves only the answer. A board therefore holds at most one miss, and help follows that miss rather than a second one: after a miss the right card glows softly, which **counts no hint**, because nothing is left to choose. Show a hint on the pause sheet, before any tap on a board, glows the right card and counts `hints++` once per board. This adapts AGENTS' "glow after two misses" to a two-card board ([decision 5](#open-decisions)).
- **Supported finish:** not needed beyond the glow. Every board ends when she taps the right card, which is always available, so every round can finish.
- **Finish:** after the last view or board, the window's Moon gives a soft glow and `ctx.finish({ misses, hints })`; one ordinary sticker from the shell, with or without help. Nothing is kept or filed.
- **Adaptation (the study's all-valid-round question; [decision 3](#open-decisions)):** default, the ordinary shell rule (`src/progress/difficulty.ts`). A level-1 round is always 0/0 and so smooth; for a toddler (range 1–2) two finished level-1 rounds move her to level 2, where the cards do check something. This follows Sand Table, Recipe Workshop and Stamp Studio. The grown-up page says what the step means: two finished level-1 rounds show she pressed and looked, **not** that she knows how the Moon changes. A smooth level-3 round shows she compared lit amounts in this toy.

## Speech (`voice-script.ts`)

Lines under `moonwindow.*`: `intro`, `instruct.look` ("Press the button to see how the Moon looks later."), `instruct.same` ("Which card looks the same as the window?"), `instruct.more` and `instruct.less` ("Which Moon shows more light?", "Which Moon shows less light?"), `view.none` ("No Moon to see this time."), `view.slice` ("A thin slice of Moon."), `view.half` ("Half of it is lit."), `view.most` ("Most of it is lit."), `view.full` ("All of it is lit! A full Moon."), `later` ("Some days later…", spoken before the view line), `miss.same` (with `{has}` and `{want}`: "This one has {has}. The window has {want}."), `miss.compare` (with `{a}` and `{b}`), `right`, `hint` ("Try the glowing card."), `done`. The amount words are fixed: "no light", "a little light", "half", "most", "all". "Phase", "waxing", "waning", "crescent", "gibbous", "night", "tonight", "tomorrow" and any reason ("because the Sun…") do not appear at levels 1–3; the mathematical and causal words join with the reviewed model at level 5 (study decision 2). Every line is replayable, and navigation never needs reading.

## Rule tests (`logic.test.ts`)

- **Model:** `lit(k)` equals `(1 − cos(k × 45°)) / 2` for every stop; `lit` is symmetric (`lit(k) = lit(8 − k)`), 0 only at k 0 and 1 only at k 4; the later stop is `(k + 1) mod 8` and the cycle wraps.
- **Drawing:** `moonShape` at k 2 and 6 lights exactly half the disk area (within 1 %), at k 4 all of it, at k 0 none; at every stop the lit area divided by the disk area equals `lit(k)` within 2 % (the ellipse terminator, not a wedge).
- **Level 1, over 500 seeds:** four views in model order; at least one lit view in the first two; the round finishes after exactly three presses, once; no line names a night, a day of the week or a date.
- **Level 2, over 500 seeds:** two boards with different targets; each has exactly one card at the target stop and one at a different stop with a lit difference of at least 0.3; no board pairs mirrored twins or mostly lit with full; k 0 never appears.
- **Level 3, over 500 seeds:** three comparisons, both requests present, the answer's side not the same all three times; each pair differs in lit fraction by at least 0.3, so the answer is unique; for every pair, swapping the two Moons' sides (mirroring) does not change the answer.
- **Authored first rounds** match the stories above.
- **Accounting:** a scripted level-2 board (wrong, the same wrong again, right) counts one miss and no hint; Show a hint before any tap counts one hint, and a second Show a hint on that board counts nothing more; a level-1 round always returns 0/0.
- **Layout:** `windowLayout` at the four views: sizes, no overlaps, corners clear, inside `view`, equal Moon radius at level 3.
- **Registry, lands and how-to tests** pass with the new game, including its land on one screen at every band.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` presses Later three times at level 1 (tapping one ribbon thumbnail once to show the free replay), and taps `hintFor` at levels 2–3. The demonstration opens on the authored round, shortened to two presses or one board.
- **How-to card** (`src/content/howto.ts`). Goal: "Look at the Moon through the window and notice how its lit part changes."
  - Steps: "Press the big button to see how the Moon looks some days later" `{ from: 1, to: 1 }`; "Tap the card that looks the same as the Moon in the window" `{ from: 2, to: 2 }`; "Tap the Moon that shows more light, or less, as asked" `{ from: 3, to: 3 }`; "Tap a picture along the bottom to hear it again" `{ from: 1, to: 1 }`.
  - Finish: `{ from: 1, to: 1 }` "Three looks, then a sticker"; `{ from: 2, to: 3 }` "Every card answered."
  - Notes: "Each view is a few days after the one before. The game never reads today's date and never asks you to come back on another night" (all levels); "More light means more of the Moon is lit, not a brighter Moon" `{ from: 3, to: 3 }`; "A wrong card is one miss, and then the right card glows; Show a hint before trying counts as a hint" `{ from: 2, to: 3 }`; "Level 1 has nothing to get wrong: finishing it shows she looked, not that she knows why the Moon changes" `{ from: 1, to: 1 }`.
- **Registration:** ID `moon-window`, name "Moon Window", spoken title `game.moon-window` ("Moon window"). Region (subject) `tinker-lab`, the science subject. Skills `['observing', 'moon-appearance', 'matching', 'comparing']`. Bands lap 1, toddler 1–2, preschool 2–3, pre-K 3 ([decision 2](#open-decisions)). Home land **Tinker Lab** if `lands.test.ts` still fits it at build time, else **Bubble Beach** ([decision 1](#open-decisions)). Hub icon: a round window with a half-lit Moon. Sticker (page `space`): a seeded Moon stop in a little round frame.
- **Art:** code-drawn in `src/games/moon-window/art.ts` with `src/art/palette.ts`: the window frame and shutter, the sky and stars, `moonShape`, the Later button, cards, the ribbon. No imported art or audio.
- **Co-play:** the grown-up asks "what will it look like later?" before she presses (a guess is never checked), then they look together. **Off-screen** (spoken tip): "Next time you see the Moon, say how much of it is lit. If you can't see it, that counts too." No viewing instructions, no Sun, no equipment, no nightly task (study decision 3).
- **Couch:** none.
- **Rework couplings:** none required and nothing saved. A journal page of Moon views she has seen, or a creature that comes to the window, waits on the [rework brief](../rework/README.md).

## Check tier

Moon Window 1–3 is the new-game tier: typecheck and unit tests (the properties above plus registry, lands and how-to tests); one scripted play through a new `browser-check.mjs` case (and its README row) at level 2 (one wrong card, Show a hint on the next board) and level 3 (a "less" comparison); one portrait screenshot at level 3 showing both cards at one size; `fingerdemo` at levels 1 and 3; `npm run build`, because the registry, lands, voice and how-to files change.

Device and person checks stay open: whether a toddler presses Later again on her own and looks at the change; whether the ellipse terminator reads as "a thin slice" at the iPad's size; whether "more light" is heard as more lit rather than brighter; whether a grown-up takes the "what will it look like?" part. Browser automation establishes none of these.

## What comes next

**Levels 4–5** (the study's slices 3–4, docs first): *Our record* (rebuild a missing card in a shown strip) and *Make this view* (move the Moon among three orbit stops with the Sun fixed), after the astronomy educator reads the phase projection, the fixed model-up convention and the unseen new Moon (study decision 2). **Levels 6–7** and **Observatory Files** follow (slice 5); **Moon Window 8–9** (eclipses) wait on 1–7 (astronomy study). A school window opens with level 4.

## Open decisions

Each has a default; decisions 1–3 are the Waiting row's and must be confirmed before registration.

1. **Home land.** Default **Tinker Lab**, the science land and the study's provisional home. It lists 12 games; Gear Garden's [capacity measurement](gear-garden.md#home-land-and-capacity) found a 13th fits and a 14th fails, and Gear Garden, Sense Detective and Rain Garden also default there, so whichever builds first takes the place. Fallback **Bubble Beach** (10 games; the Moon over the island's own sea), which `lands.test.ts` decides at build time.
2. **Bands.** Default lap 1, toddler 1–2, preschool 2–3, pre-K 3, as the study proposes (L 1, T 1–2, P 2–3, K 3–4) with pre-K's 4 and the school window waiting on levels 4–5.
3. **All-valid adaptation.** Default the ordinary rule (a 0/0 level-1 round is smooth and two of them climb within the band), stated on the how-to card as not phase mastery. Alternative: a `GameModule` flag that records a round without moving the level, a shell change in its own slice that Sand Table's and Stamp Studio's invitation levels would also use.
4. **Model-up convention.** Default lit on the right as the Moon fills (k 1–3) and on the left as it empties, one fixed convention, with no line saying it is how everyone sees it; levels 1–3 never ask which side. The astronomy educator reviews it with levels 4–5.
5. **Two-card help.** Default above: one miss per board, the glow follows it without a hint, and only Show a hint before a tap counts. Alternative: three cards at level 3 for pre-K so "glow after two misses" applies literally; that makes the threshold rule harder to keep (three lit amounts each 0.3 apart leaves only crescent, half and full).
6. **Level 1 at lap.** Default lap 1 (press and see, any press works). A person check with a one-year-old decides whether the shutter dip holds her attention or a direct tap on the Moon should advance instead.
