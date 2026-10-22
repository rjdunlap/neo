# Photo Safari levels 10–11: Tell me which and Tell me both (definition)

Defined 2026-10-22 on `claude/define-photo-safari-tell` ([PR #813](https://github.com/rjdunlap/neo/pull/813)). This is slices SL1–2 of the [speaking-and-listening study](../deep-dives/subjects/speaking-listening.md#build-slices-in-order), taken from its [proposed ladder](../deep-dives/subjects/speaking-listening.md#first-games-proposed-ladder-photo-safari-tell-me-which-and-tell-me-both) and its [recommendation](../deep-dives/subjects/RECOMMENDATIONS.md#speaking-and-listening-recommendations). It is slice 8 of the [Photo Safari dive](../deep-dives/photo-safari.md#build-slices-in-order). It is one same-game packet: one build, one branch, one PR.

**Built 2026-10-22:** [PR #827](https://github.com/rjdunlap/neo/pull/827), batch1/SL1–2 only. [Scope and proof](../archive/COMPLETED-2026-10-09.md#photo-safari-batch-1-tell-me-which-and-tell-me-both-2026-10-22); person checks remain open.

**What it adds:** two new school levels at the end of `photo-safari` (`src/games/photo-safari/`).

- **Level 10, *Tell me which*.** A visiting friend wants a photo of one sparkling animal. The pet holds the camera and cannot tell which one is meant. She taps picture-word chips (a doing word, a place word) and presses **Tell**. The pet photographs whatever her words fit.
- **Level 11, *Tell me both*.** The same, on level 7's scene, where every chip fits two animals. One word is never enough, so she adds a second.

Every level so far asks her to *follow* a spoken request. These two give her the speaker's side: a listener depends on her words, and its reaction is the feedback (CCSS SL.K.4, "provide additional detail"; the referential-communication task of Matthews, Lieven and Tomasello 2007, the child's own attempt with a listener's feedback). Nothing listens to her voice or scores speech, and a child who signs or uses AAC plays the same way. This is not the hidden-information deduction the dive leaves out: she *sees* the wanted animal, and the pet does the finding.

- Levels 1–7 keep their IDs, plans, pins and rules. This adds no band, land, game, save field, journal entry, creation slot, couch entry or asset. Successful photos still file their action's existing journal entry.
- **Reserved IDs.** The dive reserves **8** (*What changed?*, decision 2) and **9** (*Is it true?*, decision 3). They stay reserved and unbuilt. These levels take **10** and **11**. When 8 or 9 is built, its build adds the ID to school's `order` at whatever position its definition decides. Nothing here moves.
- **Not gated.** No open decision blocks this build. The dive's Waiting row (toddler entry, *What changed?*, *Is it true?*) covers only dive slices 5–7. The study's decision 1 (accounting below school) applies only to a pre-K opening, which this packet does not make. No content reviewer is needed, because the chips reuse the game's existing action and place words. The study's person checks are listed [below](#person-checks-after-the-build).

## Bands and ranges

| Band | Before | After |
| --- | --- | --- |
| lap, toddler, preschool, prek | unchanged | unchanged |
| school | `{ min: 4, max: 7 }` | `{ min: 4, max: 11, order: [4, 5, 6, 7, 10, 11] }` |

No saved level moves. A school player at 7 now steps up to 10, then to 11; stepping down from 10 goes to 7. A pre-K player never reaches 10, because the how-to arrows stay inside her band's order. A grown-up at the school band can open it with those arrows. `clampLevel` snaps a stray 8 or 9 to a listed ID, so neither is ever played.

## Plans and IDs (`logic.ts`)

`SafariMode` gains `'tell'`. `SafariPlan` gains an optional `tell?: 'which' | 'both'`.

```ts
export const TELL_WHICH_LEVEL = 10;
export const TELL_BOTH_LEVEL = 11;
export const TELL_WHICH_PLAN: SafariPlan = { mode: 'tell', tell: 'which', photos: 4, animals: 3, name: 'Tell me which: tap the one picture word only the sparkly animal has, then Tell' };
export const TELL_BOTH_PLAN: SafariPlan = { mode: 'tell', tell: 'both', photos: 4, animals: 4, name: 'Tell me both: every picture word fits two, so tell a doing word and a place word together' };
```

**`planFor` must change.** Today it clamps to `PLANS.length`, so level 10 would quietly play level 7. Use Bouncy Launch's pattern: a `PLANS_BY_ID` record built from `PLANS` (IDs 1–7) plus 10 and 11, with `planFor = (level) => PLANS_BY_ID[level] ?? <the existing clamp>`. The fallback for 8 and 9 is level 7's plan. They are never played, but the how-to and demo tests loop `min..max` and call `describeLevel` and `howToFor` on them, as they do on Bouncy Launch's gaps, so they must return a string.

## The scenes

Both levels leave out swimming (`actionsAt('tree')`), as levels 5 and 7 do: it is pond-only, so "swimming" and "in the pond" would always go together. Every tell scene uses exactly **two places and two actions**, so it always offers **four chips** and fits the two-stage shared-place layout (`spotPosition` has only two stages, 0.3 w and 0.76 w; a third occupied place would stack on the second).

**Level 10 (`tell: 'which'`), three animals.** Pick two places `s1, s2`, two actions `a1, a2` and three different animals. The seed chooses which feature is unique (the place in some rounds, the action in others, so the answer is not always a place chip):

| Unique feature | Target | Shares the target's other feature | Shares neither |
| --- | --- | --- | --- |
| place | `(a1, s1)` | `(a1, s2)` | `(a2, s2)` |
| action | `(a1, s1)` | `(a2, s1)` | `(a2, s2)` |

With the place unique: *in s1* fits only the target, *a1* fits the target and one more, *s2* fits two non-targets, *a2* fits one non-target. The action case is the mirror image. Sighting order is shuffled, as in `makeScene`.

**Level 11 (`tell: 'both'`), four animals.** Exactly level 7's `clues` scene (a strict 2×2: every action at both places). Every chip fits exactly two animals, and only the target's action-and-place pair fits it alone.

**Chips.** `chipsFor(scene)` returns one chip per action present and one per place present, four in all, in a seeded order (not doings-then-places, so position is no cue). Chips are only values present in the scene and never animal names, as at level 7.

## The rules (`logic.ts`)

```ts
export interface Chip { kind: 'action' | 'spot'; value: Action | Spot }
export function chipsFor(scene: Scene, rng: Rng): Chip[];
/** Indices of the sightings every chip is true of. */
export function fits(chips: Chip[], sightings: Sighting[]): number[];
/** One chip per kind: a second doing word replaces the first; tapping a chosen chip removes it. */
export function toggleChip(chosen: Chip[], chip: Chip): Chip[];
export type TellResult = 'empty' | 'right' | 'too-little' | 'other' | 'other-many' | 'nobody';
export function judgeTell(chips: Chip[], scene: Scene): { result: TellResult; fits: number[] };
/** The smallest chip set that fits only the target: one chip at level 10, the action and the place at level 11. */
export function fewestChips(scene: Scene): Chip[];
/** "jumping", "in the pond", "jumping in the pond": what the pet echoes and asks about. */
export function chipPhrase(chips: Chip[]): string;
```

**One chip per kind** (a decision this definition fixes). The study said a second tap removes a chip. It did not say what happens with two doing words, and "jumping eating" is not a description. So choosing a second doing word swaps out the first, and the same for places. Her description is therefore at most one doing word and one place word.

**What a Tell does.** Keyed on which animals her words fit. **In every miss case her chips stay** so she can fix them.

| Her words fit | Result | What happens | Counts |
| --- | --- | --- | --- |
| no chips chosen | `empty` | `safari.tell-empty`. The camera stays put | free |
| only the target (one chip or two, including more than enough at level 10) | `right` | The camera swings to the target, flash, polaroid to the album as now, the friend hops, `safari.thanks` | the photo |
| the target and one more | `too-little` | The camera wobbles between the two twice, then rests between them. `safari.which`: "Which one? Two are {what}!" | one miss |
| exactly one other animal | `other` | The camera swings to it, flash (no polaroid, as level 7's wrong photo), `safari.thatis` with `describe('both', …)`: "That is the dog eating under the tree!" | one miss |
| two other animals | `other-many` | The camera wobbles between those two. `safari.which`, as above | one miss |
| no animal | `nobody` | The camera sweeps across the scene and back. `safari.nobody`: "Nobody is {what}!" | one miss |

- **More than enough is never a miss or a comment.** At level 10, the unique chip with the other true chip is `right`.
- The `other-many` and `nobody` cases settle the study's open question with its lean: one miss each, the pet says what it sees, and her chips stay. The pet cannot see the sparkle (the premise), so "Which one? Two are eating!" is honest even when neither is the wanted one. The sparkle stays on the target the whole time, so she can see her words were about other animals.
- With these scenes, `fits` of a single chip is always 1 or 2 animals, and of two chips at most 1. So "Two are…" is always true. The rule tests assert it.
- **Chip taps and animal taps never change `misses`.** Only a Tell can.
- **Hints.** As level 7: each miss adds to `wrongs`. At two, the chips of `fewestChips(scene)` that are **not already chosen** glow, `hints` goes up by one, and `wrongs` resets. The glow is a pulsing pale-yellow plate behind the chip (the same colour as `Actor.glow`). The glow stays until that request's photo. At the same moment, any chosen chip that is **not true of the target** drops back into the tray, so what stays chosen plus the glowing chips always makes a `right` Tell. (Without that, at level 10 a chosen wrong doing word plus the glowing place chip could fit nobody.) At level 11 with her right doing word already chosen, only the place chip glows.
- **Tapping an animal is free.** It hops (`critter.hop`) and the pet says `safari.tell-tap`. It never takes a photo. In tell mode the `cast`'s full-screen `hitArea` must not be set (`sharedPlaces` sets it today), because it would sit under the tray. Give each actor its own `onTap` for the hop, or no hit area at all, and put the tray and Tell button in a layer above the cast.

After a `right` Tell the chips clear, `wrongs` resets, the friend's sparkle moves to the next scene's target and the next request starts. A round is four photos, then the existing `finale()` album and `ctx.finish({ misses, hints, discoveries })`.

## Screen and layout

**The wanted animal sparkles.** It does not use the yellow `Actor.glow` ellipse, which is the hint style. Draw a gold four-point star above the target's head (about 40 units, at y −200 in actor space), slowly turning and pulsing, plus an occasional `ctx.particles` sparkle. `eventMode = 'none'`.

**The friend.** A critter from `CRITTERS`, seeded and not one of the scene's animals. Scale 0.45, standing at (`w − 110`, 250), top right. A thought bubble to its left at about (`w − 220`, 140) holds a small camera, so the friend reads as "wants a photo". The album strip (x 180–about 430, y 24–about 110) and home and help (top left) stay clear. On the narrowest landscape view (1024 × 768) the right-hand pair of animals stands at about x 698 and 858 with their tops near y 400, below the friend's feet. `eventMode = 'none'`.

**The camera.** The listener is the corner guide (the pet stays small in its corner, so no large-pet rule applies). Its camera is a **viewfinder**: four white corner brackets, 220 × 250, resting over the middle of the scene. It swings to whatever her words fit, wobbles between two, or sweeps for none. `eventMode = 'none'`. The existing flash and `polaroid()` run on a photo. No tripod or second pet is drawn.

**Ground.** Tell plans lift the animals so the tray fits: `ground = min(0.78 h, h − 200)`. `spotPosition` and `sightingPositions` take an optional ground argument that defaults to today's `0.78 h`, so levels 1–7 are unchanged.

| View | Ground | Pond feet (+26) | Tray (chip tops to bottoms) |
| --- | --- | --- | --- |
| landscape 1024 × 768 | 568 | 594 | 630–750 |
| portrait 1024 × 1365 | 1065 | 1091 | 1227–1347 |

**The tray** is a row along the bottom, centred between x 150 (the corner pet) and `w − 40`. It is 806 units wide: four chips of 140 × 120, gaps of 16, a gap of 28, then the **Tell** button at 170 × 130. At 1024 wide it runs from x 164 to 970. Chip centres sit at y `h − 78`. The tray is in a layer above the cast and the fronts.

- **A chip** is a rounded card: a drawn icon at the top and its word at size 22 underneath. The word is a help for readers. It is never needed, because every chip speaks on touch.
  - Icons: jumping, an arc with an up arrow; sleeping, a moon and a "z"; eating, the apple prop; dancing, a music note; waving, a small hand. Places are tiny versions of the drawn tree, bush, rock and pond.
  - Touch area `Rectangle(-75, -65, 150, 130)` via `onTap`. The gaps leave 6 units between neighbours' areas.
  - On touch-down the chip dips (0.94) and the pet echoes its word with `safari.chip` ("in the pond!").
  - A chosen chip rises 16 units and wears a white ring. Choosing it again lowers it. Choosing the other doing word lowers the first.
- **The Tell button** is a speech bubble with a camera, at least 100 units in both directions after scaling. It shows small copies of the chosen chips' icons inside the bubble, so she sees what she is about to say. On a press it puffs (scale 1.08 and back). While the camera moves (`busy`), presses do nothing.

## Voice lines (`src/content/voice-script.ts`)

| Key | Line | When |
| --- | --- | --- |
| `safari.tell` | *A friend wants a photo of the sparkly one, but I can't tell which! Tap picture words to tell me, then press Tell.* | `ctx.instruct` at each new request, both levels |
| `safari.chip` | *{what}!* | chip touch-down, the pet echoing her word |
| `safari.tell-empty` | *Tell me something about it! Tap a picture word.* | empty Tell |
| `safari.which` | *Which one? Two are {what}!* | `too-little` and `other-many` |
| `safari.nobody` | *Nobody is {what}!* | `nobody` |
| `safari.tell-tap` | *You can see which one! Tell me with the picture words.* | tapping an animal |
| `safari.thanks` | *Thank you! That's the one!*, *You told me just right!* | `right`, after `safari.click` |

`safari.thatis` is reused for `other`. `{what}` is `chipPhrase`: the action word, the place words from `PLACE_WORDS`, or both ("eating in the pond"). The pet sounds curious, never disappointed. There is no buzzer on `too-little`: a soft two-note "hm?" on pentatonic steps from `notes.ts` instead of `sfx.boing`. The `other` and `nobody` cases keep the existing boing, as level 7's wrong photo does.

## How-to card (`src/content/howto.ts`)

The goal stays. Add two `LevelLine` steps. Every level still resolves to at most four steps.

- `{ from: 10, to: 10, text: 'One animal sparkles: the friend wants its photo, but the pet can't tell which. Tap a picture word only the sparkly animal has, then press Tell. If two animals fit, the pet asks "Which one?"' }`
- `{ from: 11, to: 11, text: 'One animal sparkles. Every picture word fits two animals, so tap a doing word and a place word that together fit only the sparkly one, then press Tell.' }`

The finish ("The round ends when the photos asked for are taken.") and the journal note stay true. The co-play hint and off-screen line stay as they are. The study's co-play idea (the grown-up whispers which animal, and she tells the pet) and its *Describe it, find it* card are left to its slice SL8.

## Ghost finger

`autotouch()` returns one intent per call. When nothing is moving and the request is open:

1. the first chip of `fewestChips(scene)` that is not chosen, `{ tap: { on: chip }, receiver: chip }`;
2. when every solver chip is chosen, the Tell button.

That plays both levels (one chip then Tell at 10, two chips then Tell at 11) and makes no mistakes. `fingerdemo` must run at 10 and at 11.

## Rule tests (`logic.test.ts`)

Over at least 200 seeds for each level:

- **Scene shape.** Level 10 has three animals and level 11 has four, all different kinds. Each scene has exactly two places and two actions, never swimming. `chipsFor` returns exactly four chips, each a value present in the scene, none of them an animal.
- **Level 10's rule.** Exactly one single chip fits only the target. At least one chip true of the target fits two animals. `fewestChips` has length 1. Across the seeds, both a place and an action are sometimes the unique chip.
- **Level 11's rule.** Every chip fits exactly two animals. No single chip fits only the target. Exactly one doing-and-place pair fits only the target. `fewestChips` has length 2.
- **Every description classified.** With one chip per kind there are 9 possible chosen sets: empty, four singles and four pairs. For each one, `judgeTell` returns the right result from the table above. That includes a set that is more than enough (`right`), not enough (`too-little`), untrue (`other`, `other-many`) and fitting no animal (`nobody`). Every non-`right`, non-`empty` result has `fits.length` 0, 1 or 2, and every "Which one?" case has exactly 2.
- **`toggleChip`.** Tapping a chosen chip removes it. A second chip of the same kind replaces the first. The result never holds two of one kind.
- **Solver.** `judgeTell(fewestChips(scene))` is `right` for every seed.
- **Hint.** For every one of the 9 chosen sets: after the hint drops the chips untrue of the target, the remaining chosen chips plus the glowed chips (solver chips not chosen) make a `right` Tell.
- **IDs.** `planFor(10)` and `planFor(11)` are the tell plans, `planFor(1..7)` are unchanged, and `planFor(8)`/`planFor(9)` return a plan with a name. School's range is `{ min: 4, max: 11, order: [4, 5, 6, 7, 10, 11] }`. Step up from 7 is 10, and step down from 10 is 7.
- **Positions.** With the lifted ground, the four positions at level 11 keep every pair of animals at least 150 units apart, and no animal's feet are below the tray's top in either view in the table.

## Build check tier

New interaction in an existing game (the speaking-and-listening study's slice 2):

- typecheck and unit tests;
- one filtered browser play (`BROWSER_SUITE=batch BATCH_ONLY=safari SAFARI_LEVELS=10,11`) of both levels, with one under-informative Tell and one hint;
- `fingerdemo` at 10 and at 11;
- one portrait screenshot of the chip tray.

The `batch` safari case needs a tell-mode branch: tap chips and Tell, not animals. Build only if shared files change (the how-to and voice script are shared, so run it).

## Person checks after the build

For [DEVICE-CHECKS](../DEVICE-CHECKS.md):

- Does a six-year-old accept that the pet cannot see the sparkle (the pretend premise)?
- Does the camera's wobble between two friends read as "I'm not sure" rather than "wrong"?
- Are the chips big enough, and does the tray fit comfortably, in portrait on an iPad?
- Does device speech say "Which one? Two are in the pond!" clearly?

Nothing here establishes any transfer to talking with people.

## Left for later

From the study's slices, unchanged:

- SL3 *Just enough* (mixed rounds) and SL6 *Whose clue works?*, after a child has played 10–11.
- SL4 *Which one?*, after the study's decision 2.
- SL5 Mystery Friend, reusing `fits` and `fewestChips`.
- A pre-K opening of level 10, after the study's decision 1 and a child's play at school.
- Photo Safari 8 and 9 stay in the dive's order.
