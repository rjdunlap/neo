# Adventure Walk, levels 1–3 (definition)

Defined 2026-10-22 as the first packet of the [movement study's](../deep-dives/subjects/movement-exercise.md#recommended-follow-ups-requested-2026-10-14) **Adventure Walk** follow-up, from the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#movement-and-family-play-recommendations) and the notebook's [Bear Hunt Walk seed](../IDEAS.md). Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: ready to build (AW2) on the defaults below.** The slice is **screen-only**: the companion does all the walking, and no voice line, card or demonstration asks the person playing to move. The study's gate (a named movement reviewer before any physical instruction, demonstration or off-screen movement invitation) therefore does not block it, and stays on [decision 4](#open-decisions). The recommendation's retelling and way-back-home rounds are the successor definition **AW3** (levels 4–5; [below](#what-comes-next)), because a spatial retelling needs a map view, which is a new interaction.

**Fun action and purpose:** the companion sets off from home to a friend's picnic along a little island path. At each landmark on the way (a brook, tall reeds, a fallen log, a boulder, a puddle) there are two ways past, drawn as two big glowing paths: over the bridge or across the stepping stones; through the reeds or around them. She taps a way, and the companion goes that way with its own sound and the path word spoken ("Over the bridge!"). After three landmarks the friend waves from the picnic blanket. The learning goal is **words for moving along a route**: *over, under, through, across, around*, first heard as the result of her own choice, then followed when the friend calls the way, then held for two steps of a spoken route. This is the T–K rows of the study's [follow-up table](../deep-dives/subjects/movement-exercise.md#recommended-follow-ups-requested-2026-10-14) (spatial language and sequencing) and the CDC three-year tip of two- and three-step instructions that the [Pet Says research](../deep-dives/pet-says.md) opened, as a design hypothesis rather than a milestone claim.

## Identity and overlap

The notebook's [overlap row](../IDEAS.md) says build the walk only if **moving along a route** proves to be the new decision. It is: at each landmark she decides **which way the walker goes past it**, and the two ways differ in the path word. No shipped game asks that.

- **Peekaround Island** (Puzzle Peaks) owns **static positions**: in front of, behind, next to, judged from her side as the island turns. Adventure Walk owns **path words**: over, under, through, across, around, each naming a movement past an obstacle. No word is shared, and a test keeps them apart.
- **Pet Says** (Cozy Village) owns guided body actions she copies; its proposed level 9, *A walk in the woods* (not built), is a story of stops the pet performs for her to imitate. Here nobody imitates anything: she chooses or follows the walker's way, and the companion's walk is the consequence. If Pet Says level 9 is built, its stops stay body moves, not path words.
- **Story Steps** (Story Grove) owns ordering picture cards. This slice has no picture strip; AW3's retelling is defined on the map itself (tapping landmarks in the order walked), not as a card ordering.
- **Owl Walk Home** and **Mossy Path** move a token along stones or tiles to cover or reach; **Treasure Map** and **Robot Path** follow grid directions (left, up, steps). None of them names how a walker gets past a landmark.
- **Duckling Parade** steers continuously. Here each step is one tap on a large target.

The notebook's source picture book is inspiration only: no refrain, sound words, bear, chase or illustration from it, and the name "Bear Hunt" appears in no game text or voice line. The landmarks, friend and lines below are original.

## The model

- **A landmark** is an authored record in `logic.ts`: `id`, a spoken name and exactly **two ways**, each `{ word, line, sfx }`, the two words always different.

  | Landmark | Way A | Way B | Drawing |
  | --- | --- | --- | --- |
  | `brook` | **over** the plank bridge | **across** the stepping stones | a shallow blue brook with a little arched bridge on one side and three flat stones on the other |
  | `reeds` | **through** the tall reeds | **around** the reeds | a clump of tall reeds with a parted gap in the middle and a mown path curving past it |
  | `log` | **under** the fallen log | **over** the fallen log | a log resting on two rocks with a crawl-gap beneath and a little step on top |
  | `boulder` | **around** the boulder | **over** the boulder | a big mossy boulder with a worn path curling round it and footholds up its side |
  | `puddle` | **across** the puddle on its stones | **around** the puddle | a wide rain puddle with two stones in it and a dry rim |

  All five path words appear; *over*, *across* and *around* each appear at more than one landmark, so a word is learned as a way of moving, not as a picture. Each way has its own short sound from the existing `sfx` set (for example hollow plank `knock` steps, stone `splash` hops, reed `brush`, a log `squish`, a boulder `pop` hop, a `whoosh` for going round); the build picks and the test only asks that the two ways at one landmark sound different. No new audio files.
- **A route** (`planFor(level)` plus `ctx.rng`) is three different landmarks in order from home to the picnic, the left/right placement of each landmark's two ways, and the picnic friend (seeded from the duck, cow and frog drawings). Landmarks come from a shuffled bag so all five turn up across rounds before any repeats.
- **A request** (levels 2–3) is the way the friend asks for at a landmark: one of its two ways, drawn so that over a round both left and right placements are asked for, and at least two different words are asked.
- **Choose** `choose(route, stop, way)` returns `go` (the walker goes that way) or, when a request is set and `way` is not it, `other` (a miss) with a reason naming both ways.

## Screen and controls

- **Landscape (1024×768 design area):** one landmark fills the middle of the screen at a time, as a stop on the walk. Its two ways are two tappable **way zones** of at least 280×260 each, side by side, each outlined with a dotted path and a soft glow, with a gap of at least 40 units between them. The **companion** (`ctx.companion()`, at about 0.5 scale) stands at the near edge below the zones. A thin, non-interactive **trail line** across the top shows home, the three stops and the picnic, the current stop lit (`eventMode = 'none'`). The home button stays top-left; the companion stands clear of the guide's bottom-left corner. At levels 2–3 the **friend's picture** (a 140×140 badge at the top right, under the trail line) speaks the request; tapping it replays the request, free.
- **Portrait:** the zones stack one above the other (each at least 300 wide and 240 tall), the companion below them, the friend's badge top-right. `stopLayout(view, level)` returns every rectangle; a test asserts sizes (every target at least 100 units each way after scaling), the gap, no overlap with the home button, the friend's badge or the guide's corner, and everything inside `view` at the four views the lands test uses.
- **A way:** touch-down squishes its zone and brightens its dotted path at once. A tap sends the companion along that path (about 1.2 s, tweened through two or three points of the drawing: up and across the bridge, ducking under the log), the way's sound on each step, and the word line ("Over the bridge!"). The landscape then slides on to the next stop (about 0.6 s), and taps during the walk or slide are ignored. The walk is the reward; nothing is timed.
- **The companion:** a tap gives a happy bounce and repeats the current instruction (the large-pet rule).
- **The picnic:** after the third stop the scene slides to the friend's blanket, the companion sits down beside the friend, a short pentatonic rise plays, and the friend says the arrival line; then `ctx.finish`.
- **Music:** the land's style keeps playing underneath (this is not a game where she makes the music), quieter during speech in the usual way.

## Levels

| Level | Name | Bands (default) | What she decides | Finish |
| --- | --- | --- | --- | --- |
| 1 | **Pick a way** | toddler, preschool | Either way past each of three landmarks; both are right | Reach the picnic |
| 2 | **Come this way** | preschool, pre-K | The way the friend calls at each landmark, one call per stop | Reach the picnic |
| 3 | **Two at once** | pre-K, school | Two calls given together before walking ("Over the bridge, then through the reeds!"), followed in order; then the third stop's call | Reach the picnic |

One walk of three stops per round at every level. Level 3's two-step call is replayable through the friend's badge, so the memory load is supported, not tested (AGENTS' depth-before-pressure rule); there are no longer routes or faster walks. Route choices at a fork, the map retelling and the way home are AW3's levels 4–5, appended so no saved level moves.

### First rounds

- **Level 1 (route: brook, reeds, log; friend: duck).** The pet: "Let's walk to Duck's picnic! Which way shall we go?" At the brook she taps the stepping stones: the companion hops stone to stone, splash, splash, "Across the stones!" The path slides on to the reeds; she taps the parted gap: a brushing walk through, "Through the reeds!" At the log she taps the top step: a hop over, "Over the log!" The blanket: "You made it! Duck saved you a sandwich." No choice was wrong, and nothing was counted.
- **Level 2 (route: reeds, puddle, boulder; friend: frog).** Frog's badge: "Come around the reeds!" She taps around: the companion curls round the clump. Frog: "Come across the puddle!" She taps around the puddle: boing, the companion takes one step that way, stops and turns back, and Frog says "That's around the puddle. Come across, on the stones!" (one miss). She taps the stones: across. Frog: "Come over the boulder!" She taps over: the companion climbs the footholds. Frog's blanket.
- **Level 3 (route: brook, log, puddle; friend: cow).** Cow's badge, before the first stop: "Come over the bridge, then under the log!" At the brook she taps the bridge (over). At the log she pauses and taps Cow's badge: "Over the bridge, then under the log!" (free). She taps under: the companion crawls through the gap. Cow: "Now come around the puddle!" She taps around. Cow's blanket.

## Accounting, help and finishing

- **Never a miss:** any choice at level 1; a tap on the companion, the friend's badge (replay), the trail line or the background; taps during a walk or slide. Choosing at level 1 is free exploration, so a level-1 round always counts 0 misses and 0 hints and moves her along the ladder by the ordinary rule; the grown-ups' card says a smooth level-1 round shows she reached the picnic, not that she knows the words.
- **A miss** (levels 2–3): tapping the way the friend did not ask for. The walker turns back from the edge of that way (no fall, no splash on her), and the reason names both ways ("That's around the puddle. Come across, on the stones!"). A second tap on the same wrong way before choosing again repeats the reason and counts nothing more.
- **After two misses at one stop**, the requested way glows and `hints++` (at most once per stop). Show a hint in the pause sheet (`Scene.pauseActions`) does the same at the current stop, still at most once per stop; asked again there, it repeats the request.
- **Replays** of the request through the friend's badge are a listening support, free at every level and never a hint.
- **Adaptation:** the ordinary rule (`src/progress/difficulty.ts`). At levels 2–3 a zero-miss round means she followed the spoken path words, with replay allowed; it is not evidence she would use the words herself.
- **Start again** (pause sheet) returns to the first stop of the same seeded route, keeping misses and hints.
- **Finish:** `ctx.finish({ misses, hints })` at the picnic, with or without help: one ordinary sticker from the shell. Nothing is kept, filed in the journal or saved by the game ([decision 6](#open-decisions)).

## Rule tests (`logic.test.ts`)

- **Table:** five landmarks; each has exactly two ways with different words; every word is one of over, under, through, across, around and all five occur; no path word is one of Peekaround Island's position words (in front of, behind, next to), checked against that game's `WHERE_WORDS`; every way has a word line and a sound, and the two sounds at a landmark differ.
- **Routes, over 500 seeds per level:** three different landmarks; every landmark appears across rounds and the bag gives all five before any repeats; both left and right placements occur for each landmark; the same seed gives the same route.
- **Requests (levels 2–3):** every request is one of its landmark's two ways; across each round at least two different words are asked and both screen sides are asked at least once; at level 3 the first call names the first two stops' requests in route order and the second call names the third.
- **Choices:** at level 1 `choose` returns `go` for every way at every stop; at levels 2–3 it returns `go` for exactly the requested way and `other`, with a reason naming both words, for the other.
- **Hints:** the glowed way is the requested way; a scripted level-2 round (wrong, wrong again on the same way, a different wrong at the next stop, Show a hint twice at that stop) counts the misses once per distinct wrong tap and at most one hint per stop.
- **Layout:** `stopLayout` at the four views for each level: every target at least 100 units each way, way zones at least the sizes above and 40 apart, nothing overlapping, the home button, the friend's badge and the guide's corner clear, everything inside `view`.
- **Registry, lands and how-to tests** pass with the new game, including its home land still fitting on one screen at every band.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` uses the same taps as play. Level 1: the left way at the first stop, the right way at the second, either at the third (showing both are fine). Level 2: the requested way at each stop. Level 3: the requested ways, with one tap on the friend's badge before the second stop to show the replay.
- **How-to card** (`src/content/howto.ts`). Goal: "Walk to the friend's picnic, choosing how to get past each place on the way."
  - Steps: "Tap a way past each place: both ways are fine" `{ from: 1, to: 1 }`; "Listen to the friend, then tap the way they ask for" `{ from: 2, to: 2 }`; "The friend asks for two ways at once; tap them in order" `{ from: 3, to: 3 }`; "Tap the friend's picture to hear the way again" `{ from: 2, to: 3 }`.
  - Finish: "The friends sit down together on the picnic blanket."
  - Notes: "Every choice is right; she hears the word for the way she chose" `{ from: 1, to: 1 }`; "Taking the other way is a miss, with both ways named; after two misses at one place the asked-for way glows, which counts as a hint" `{ from: 2, to: 3 }`; "Hearing the request again is never counted" `{ from: 2, to: 3 }`; "Nobody is asked to move: the companion does the walking" (all levels).
- **Voice lines** under `walk.*`: `intro` (with `{friend}`), `instruct-pick`, `instruct-follow`, `call.one` (with `{way}`), `call.two` (with `{first}`, `{second}`), `way.*` (the ten way lines, such as `way.brook.over` "over the bridge"), `went.*` (the spoken result, "Over the bridge!"), `other` (with `{took}`, `{asked}`), `hint-glow`, `arrive` (with `{friend}`), `done`; friend names reuse existing animal names where the voice script has them. `{pet}` optional. Nothing is written as text to read; the path words are spoken, never printed.
- **Registration:** ID `adventure-walk`, name "Adventure Walk", spoken title `game.adventure-walk` ("Adventure walk"). Region (subject) `story-grove`, the language subject ([decision 3](#open-decisions)). Skills `['spatial-words', 'listening', 'following-directions', 'sequencing']` (free strings). Bands: toddler 1, preschool 1–2, pre-K 2–3, school 3 (a single-level school range until AW3 extends it) ([decision 2](#open-decisions)). Home land **Rainbow Meadow** by default, its 12th game ([decision 3](#open-decisions)). Hub icon: a little winding path past a bridge to a picnic blanket. Sticker: a seeded landmark (bridge, reeds, log, boulder or puddle) with a tiny blanket behind it.
- **Art:** code-drawn in `src/games/adventure-walk/art.ts` with `src/art/palette.ts`: the five landmarks with both ways visible, the dotted path outlines, the trail line, the blanket. The friends use `src/art/critter.ts` (`CRITTERS`). No imported art or audio.
- **Co-play:** a grown-up takes the friend's part and calls the way aloud before she taps, or asks "which way did we go at the brook?" at the picnic. **Off-screen** (spoken tip, default): "Make a little walk on the table with a book bridge and a cushion boulder, and let a toy go over, under and around." A toy walks, not the child; any invitation for her to walk or act the route herself waits on [decision 4](#open-decisions).
- **Couch:** none.
- **Rework couplings:** none required and nothing saved. A walk between island places is a natural future way to arrive at an [RW13 ecosystem location](../rework/WORK-ITEMS.md#rw13-island-revamp-ecosystems-as-locations); that is the rework's to define.

## Check tier

AW2 (levels 1–3) is the new-game tier: typecheck and unit tests (the rule properties above plus registry, lands and how-to tests); one scripted play through a new `browser-check.mjs` case (its README row is part of the build), at level 1 (three free choices) and level 3 (one wrong way, one replay, one requested hint); one portrait screenshot at level 2 with the friend's badge and both way zones; `fingerdemo` at levels 1 and 3; `npm run build`, because the registry, lands, voice and how-to files change.

Device and person checks stay open: whether a toddler reads the two dotted paths as two ways to go; whether the path words are distinct in device speech ("across" and "around" especially); whether level 3's two-step call is fair to a four-year-old with replay; whether a grown-up joins in. Browser automation cannot establish any of these.

## What comes next

**AW3, levels 4–5 (define after AW2 is built):** level 4 **Tell the way home**: after the picnic the view zooms out to the whole path as a map, and she leads the walk home by tapping the way taken at each landmark in reverse order (the order is the decision; the way she came is shown faintly as support); level 5 **Which path?**: a fork with two routes to the picnic, each past different landmarks, chosen freely, then a friend's call naming the landmarks in the route she did not take. Both are new interactions (the map view, the fork) and use the new-interaction tier. Movement invitations, if ever, follow decision 4.

## Open decisions

Each has a default the build uses; none blocks AW2.

1. **Identity.** Default: a new game, because choosing and following a way past a landmark is a decision no shipped game asks. Alternative: a Peekaround Island mode, if play shows the walk adds nothing to the words.
2. **Bands.** Default toddler 1, preschool 1–2, pre-K 2–3, school 3 (AW3 extends school). Alternatives: no school range until AW3; or lap 1 as a watch-and-tap entry, which the study does not recommend.
3. **Subject and home land.** Default region `story-grove` (language) and home land Rainbow Meadow (11 games today, 12 with this one, beside Owl Walk Home; 13 if [Sprout Shuffle](sprout-shuffle.md) also lands there on its default, which Puzzle Peaks already lays out). Alternatives: Story Grove (12 today, 13), or Puzzle Peaks beside Peekaround (13 today, 14, more than `lands.test.ts` has covered).
4. **Moving along (reviewer-gated).** Default: omitted. No voice line, card or demonstration invites the person to walk, crawl, hop or act the route, and the off-screen tip uses a toy. An "act it out with me" option, on screen or off, needs the study's named movement and accessibility reviewers, with seated and non-walking alternatives, before it is written.
5. **Level 1 accounting.** Default: every level-1 choice is free and a round always counts 0/0. Alternative: none sensible; a free choice is never a miss.
6. **Journal.** Default: nothing filed. Alternative: a discovery page of the five path words, each with its landmark, after she has gone each way once.
