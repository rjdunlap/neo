# Quick Tricks — the third show (level 9): wind the music box, fill the cups, loop the fireflies

*Definition, 2026-11-04 · dive slice 4 ([Quick Tricks dive](../deep-dives/quick-tricks.md#build-slices-in-order)) · from [IDEAS](../IDEAS.md#a-third-show-new-gestures) · docs only; nothing here is built*

## Scope and identity

Level 9 is a third show of three tricks, each a gesture the island's touch games barely use: **Wind the Music Box** (turn a crank round and round until a friend pops up), **Fill the Cups** (tip a jug to fill three cups, one at a time) and **Loop the Fireflies** (draw one loop around some fireflies). In the finale the fireflies light their jar while the music box plays. It is one round and one sticker, like shows one and two, with the same green "next" arrow between tricks and the same bow and `tricks.done` at the end.

What she learns: **counting whole turns** (one chime per turn, said aloud at the pop), **filling to a mark** and, at school, the words *half*, *a quarter* and *three quarters* of a cup, and **making a set of a named size** from a scatter (the loop). The crank and the pour are new hand skills first; only the loop has a wrong answer.

The tricks' amounts depend on the band she plays at, not on a level number (see [Amounts by band](#amounts-by-band)); that keeps one show at one level ID for every band, as the IDEAS note asks ("at toddler level any turn … preschool and pre-K add a named amount … a 6–8 remix asks for two whole turns or half full"). The precedent for reading `ctx.band` inside a level is Tangram Town and Size Parade.

## Which show plays (the level-to-show map)

Today `create` and `describeLevel` send every level `>= 4` to show two, and `encoreFor` clamps to level 6, so level 9 (and the planned 7 and 8) would silently play show two. The build replaces that test with one explicit map in `logic.ts`, so slices 2, 3 and this one can land in any order:

```ts
export type Show = 'first' | 'second' | 'third';
export const showFor = (level: number): Show => level >= 4 && level <= 6 ? 'second' : level === 9 ? 'third' : 'first';
```

Levels 1–3, 7 and 8 are show one (7 and 8 being the planned *Two at once* and *A tiny show*), 4–6 show two, 9 show three. `create` builds `QuickTricks`, `SecondShow` or a new `ThirdShow` from it, and `describeLevel` returns `THIRD.name` for 9. A rule test pins the map for every level 1–9.

## Level number and band order

Level 9 is appended **last** in every band's play order. `rangeFor` plays `min..max` unless an `order` is given, so the ranges get explicit orders that never schedule an unbuilt level:

| Band | Today | If level 9 lands first | After slice 2 (level 7) | After slice 3 (level 8) as well |
| --- | --- | --- | --- | --- |
| toddler | 1–1 | `{ min: 1, max: 9, order: [1, 9] }` | unchanged | `order: [8, 1, 9]`, `entryLevels: [8]` |
| preschool | 1–4 | `{ min: 1, max: 9, order: [1, 2, 3, 4, 9] }` | unchanged | whatever slice 3 sets for preschool, with 9 still last |
| pre-K | 2–6 | `{ min: 2, max: 9, order: [2, 3, 4, 5, 6, 9] }` | `order: [2, 3, 4, 5, 6, 7, 9]` | unchanged |
| school | 5–6 | `{ min: 5, max: 9, order: [5, 6, 9] }` | `order: [5, 6, 7, 9]` | unchanged |

Level 8 never enters pre-K's or school's order. A rule test asserts every order lists only levels whose plan exists (`showFor` plus the built plan tables), ends with 9, and that toddler reaches 9 only after 1. Toddler gets 9 because at toddler nothing in it can go wrong (below); if the developer later prefers toddler to stay on show one only, dropping 9 from toddler's order is a one-line change.

## Amounts by band

| Trick | toddler | preschool | pre-K | school |
| --- | --- | --- | --- | --- |
| Music box | Any turning; the friend pops after one whole turn | "Turn it **two** times" | "Turn it **three** times" | "Turn it **two and a half** times" (half-turn marks on the dial) |
| Cups (three, served one at a time) | Any pour; no line drawn; a cup is served when she lets go with anything in it | One line on every cup, at 0.5: "fill it to the line" | One line per cup at 0.5, then 0.25 and 0.75 in shuffled order (Fill & Dump's `POUR_TARGETS`) | No line: faint quarter ticks on every cup and a spoken amount, *half full*, then *a quarter full* and *three quarters full* in shuffled order |
| Fireflies | Three big fireflies; any closed loop around at least one catches them all | Five fireflies in two loose clusters of three and two: "loop **three**" | Six scattered fireflies: "loop **three**" | Eight scattered fireflies: "loop **half** of them" (four) |

`thirdAmounts(band)` in a new `third-logic.ts` returns this table's row; the bands the game supports are exactly these four.

## The tricks

### 1. Wind the Music Box (new pointer handling)

A wooden box sits centre stage with a crank on its side: an axle and an arm of radius 130 ending in a round knob (hit circle radius 60, so 120 across). A friend from the seeded cast is inside (the lid shows a sliver of ear). A row of dots under the box shows the turns asked for (two, three, or two and a half with a half dot at school; none at toddler).

**Pointer handling.** Not `drag.ts`: its 40-unit lift would break the angle. The pattern is Fill & Dump's `pour.ts`:

- `pointerdown` on the box's crank layer starts a turn when it lands anywhere in the ring 40–230 units from the axle (the knob included), so a small hand need not hit the knob exactly; one pointer ID at a time; `palmOnGlass()` rejects it.
- `globalpointermove` reads the angle with `atan2` around the axle in stage-local units. Points within 40 units of the axle are a dead zone (no angle). Each move's delta is wrapped to (−π, π]; a delta larger than π/2 in one move is a jump (a lost touch), so the anchor resets with no progress.
- The direction is set by the first 30° of movement, either way (left-handed or not); turning backwards after that is free and never unwinds. Progress is the accumulated forward angle, never time held or event count (the comment on `pourAmount` says the same for pouring).
- `pointerup`, `pointerupoutside`, a window `pointerup` and `pointercancel` listener (Pixi 8 never forwards `pointercancel`), `blur`, `visibilitychange` and leaving the view all stop the turn; progress is kept, so letting go mid-turn loses nothing. `destroy()` removes the window and document listeners.

The pure part is `crankStep(state, angle): CrankState` in `third-logic.ts` (anchor, direction, accumulated radians, whole and half turns), tested without Pixi.

**Feedback.** The arm follows the finger from touch-down (the knob swells to 1.1 at once); every half turn the friend peeks a little higher; every whole turn (every half at school) one pentatonic note from `src/audio/notes.ts` rings, the next step up, and the next dot fills. At the target the lid pops, the friend springs out on a coil and waves, and the box plays its short tune (the same pentatonic steps). It cannot go wrong: the friend pops by itself on reaching the amount, so the count is spoken scaffolding, not a judgment ("Two turns! Pop!").

**Nudge.** After ten quiet seconds with no turn, the pet re-says the instruction and a curved ghost arrow circles the knob once. Not a hint and not counted.

### 2. Fill the Cups (reuses Fill & Dump's pour)

A jug on the left, a catch tray under one cup at a time, and two more cups waiting on a shelf. The jug and its pour reuse `pour`, `emptyCup`, `recoverTray`, `pourAmount`, `POUR_DISTANCE` and `POUR_TOLERANCE` from `src/games/fill-dump/logic.ts` (cross-game imports from another game's `logic.ts` already exist: Cut Along takes `offTrail` and `tuneStep` from Letter Trails). It does **not** reuse `checkPour`, which counts a wrong check as a miss, and there is no yellow check button: a cup is judged when she lets go of the jug.

- She drags the jug to the right to tip it; the amount follows the furthest rightward movement in the gesture, and moving back only rights the jug, exactly as in `pour.ts`. The jug holds 3 cup-units.
- **On release**, if the cup is within `POUR_TOLERANCE` of its target, it is served: a "Just right!" ding, the cup slides to a friend who drinks with a gulp, its water and the tray's go back to the jug, and the next cup slides in. Under the target, she simply pours again (after the first under-release of a cup the pet says "a little more").
- **Overfill is never a miss.** Above the line, the pet says to tap the cup to tip it out (`emptyCup`, into the tray). A cup's capacity is 1, so anything past the brim spills into the tray as it pours. When the jug runs dry, the pet says to tap the tray, which pours it back (`recoverTray`). No water is ever lost and no state can be stuck.
- **Help.** After two overfills on the same cup, the line (at school, the target tick) glows and the jug pours at half speed for that cup. That is real help, so it counts as the trick's one hint (at most one per trick, as in the earlier shows). At toddler nothing is counted and no glow is needed.

### 3. Loop the Fireflies (reuses Lasso Loops' loop)

Dusk falls over the stage; fireflies blink in a meadow above a jar. The loop reuses Lasso Loops' rules from `src/games/lasso-loops/logic.ts`: `scatter`/`gridFor` for placing fireflies, `inside` for what a loop holds, the closing rule (the loop always closes back to its start, so a nearly closed loop counts), the "too small" rule (a trail shorter than 120 units is ignored, free), `nearestGroup` for the glow and `demoLoop` for the bot. Preschool's two clusters are made by a small `clusters(rng)` helper in `third-logic.ts` (three and two, at least 260 units apart), since `scatter` spreads evenly.

- A loop around **no** firefly is a free doodle; the pet re-says the instruction once.
- At toddler a loop around **at least one** firefly succeeds and every firefly follows into the jar.
- From preschool, a loop around **exactly** the asked number succeeds; those fireflies fly into the jar and glow, and the rest drift in after them. A loop around any other number (one or more) is a **miss**: the caught fireflies light up, the pet says how many ("That loop has four. We need three."), and they flutter back out.
- **Glow.** After two misses in this trick, `nearestGroup(points, free, n)` glows (the trick's one hint).

### Finale

The jar glows on the box's lid while the music box plays its tune once more, the cups' friends and the popped friend bow, and the pet says `tricks.done`. One sticker through `ctx.finish({ misses, hints })`.

## Accounting

| Trick | Can miss? | Hint (at most one) | Free |
| --- | --- | --- | --- |
| Music box | Never | Never (the ten-second nudge is not a hint) | Any turning, backwards turning, letting go mid-turn |
| Cups | Never | The glowing line and slow pour after two overfills on one cup | Under-pours, overfills, tipping the cup out, tapping the tray |
| Fireflies | A closed loop around the wrong number (≥ 1) of fireflies, from preschool | The glowing group after two misses | Loops around none, trails under 120 units |

At toddler nothing is counted: `misses` and `hints` stay 0 for every action. Misses are summed across the show and reported once; adaptation treats the show like the others. A smooth show here is mostly the loop, which is fair: the loop is the only judged choice.

## Art (code-drawn, `Graphics`, palette colours)

Music box: a wooden box in `swatch.brown`, a gold crank (`swatch.yellow.line`), a coil spring and the seeded friend (`Critter` from `CRITTERS`, as show two now uses). Cups: three plain cups in different palette colours, a blue water fill clipped to each cup, a line as a dashed stroke, quarter ticks at school. Fireflies: small yellow bodies with a soft additive glow, blinking out of phase; a glass jar. No sprites, no imported audio.

## Voice (planned IDs, not yet in `voice-script.ts`)

| ID | Line |
| --- | --- |
| `tricks.third-start` | Welcome to the show! Three new tricks. |
| `tricks.crank` | Turn the handle round and round! Who is inside? |
| `tricks.crank-n` | Turn the handle {n} times! |
| `tricks.crank-half` | Turn the handle two and a half times! |
| `tricks.pop-n` | {n} turns! Pop! Hello! |
| `tricks.pop` | Pop! Hello! |
| `tricks.cups` | Pour some water into the cup! |
| `tricks.cups-line` | Fill the cup up to the line! |
| `tricks.cups-half` / `-quarter` / `-three-quarters` | Fill this cup half full. / … a quarter full. / … three quarters full. |
| `tricks.cup-more` | A little more! |
| `tricks.cup-over` | Oops, too much! Tap the cup to tip it out. |
| `tricks.cup-tray` | Tap the tray to pour the water back into the jug. |
| `tricks.cup-slow` | Pour slowly, and stop at the line. |
| `tricks.cup-yes` | Just right! |
| `tricks.loop` | Draw a loop around the fireflies! |
| `tricks.loop-n` | Draw a loop around {n} fireflies! |
| `tricks.loop-half` | Draw a loop around half of the fireflies! |
| `tricks.loop-count` | That loop has {got}. We need {n}. |
| `tricks.loop-small` | A bigger loop! Go all the way around. |
| `tricks.loop-hint` | These fireflies are close together. Loop them! |
| `tricks.loop-yes` | Into the jar! Look how they glow! |

Each instruction goes through `ctx.instruct` so the pet repeats it; `tricks.next` and `tricks.done` are reused. `{n}` and `{got}` are numbers, filled by the caller (two-slot precedent: `relay-woods.long`).

## Layout and presentation

Portrait and landscape from `view` in `resize()`. The box, the jug-and-cup and the meadow each take the middle of the stage, clear of the bottom-left pet and the corner buttons; the crank ring (radius 230) and the meadow's firefly spacing (at least 110 units between fireflies; fireflies are never tapped, only looped) fit a 768-wide portrait. The jug's hit area is at least 200 by 220 as in `pour.ts`, the cup's and the tray's at least 170 and 280 wide. Music stays `STYLES.stickers`: she is not composing, so no `silenced`; the music box's notes are pentatonic sfx over it.

## Co-play, off-screen, how-to and bot

- **Co-play:** the grown-up counts the turns aloud with her, or says "stop!" at the line.
- **Off-screen:** pouring water into cups at bath time to a mark; winding a real music box or a toy's key.
- **How-to card:** one step `{ from: 9, to: 9, text: 'The third show: turn the handle round and round, pour from the jug and let go at the line (too much is tipped out, never a mistake), then draw a loop around the fireflies asked for.' }`; the existing steps already cover the green arrow and the bow.
- **Bot (`autotouch`):** all three gestures use the existing `{ trace: Spot; via: Spot[] }` intent. Crank: a trace from the knob along a 24-point circle of radius 130, one whole turn per intent, until the friend pops. Cups: a trace from the jug rightward by exactly `(target − cup) × POUR_DISTANCE` (read from the state) and release; if the cup is over, a tap on the cup, then on the tray when the jug is low. Fireflies: `demoLoop(points, n)` as a trace (at toddler, `n = 1`). Then the green arrow as in show one.

## Rule tests the build needs (`third-logic.test.ts`)

- `showFor` maps 1–3, 7, 8 to show one, 4–6 to two, 9 to three; every band's `order` lists only levels that exist, ends with 9, and level 8 appears only in toddler's (once slice 3 lands).
- `crankStep`: a full circle of moves in either direction gives one turn; a backward move after the direction is set adds nothing and takes nothing; a jump over π/2 adds nothing; moves in the dead zone add nothing; progress survives a release; the half-turn count is exact at school.
- The cups: for every band's targets, a sequence of `pourAmount` releases reaches each target within tolerance; an overfill followed by `emptyCup` and `recoverTray` returns all the water (jug + cup + tray is conserved); no state leaves the jug, cup and tray all empty; overfills never change `misses`.
- The fireflies: for every seed and band, `demoLoop(points, n)` exists (the generator re-rolls otherwise), fireflies are at least 110 units apart in a 768-wide portrait, preschool's clusters hold three and two; a loop around 0 is free, around the wrong count is one miss, the glow comes after the second miss and at most once.
- At toddler, every action leaves `misses` and `hints` at 0.
- The bot's three traces finish the show for a sample of seeds at every band.

## Settled and open

**Settled here:** level 9 for all four bands, appended last; amounts read from the band; one show, one sticker; the crank's own pointer handling on the `pour.ts` pattern; Fill & Dump's pour functions without `checkPour`; Lasso Loops' loop functions; only the loop can miss; the cups' slow-pour help counts as the trick's hint.

**Left out on purpose:** any timer or speed (a faster crank does nothing more), device tilt for the pour (see [gestures the island does not use yet](../IDEAS.md#gestures-the-island-does-not-use-yet)), a lap version (that band is the developer's call, see [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md)), a couch version (chunk 9's decision is still open).

**Open, not blocking:** whether Gear Garden or a pour game should later take a crank of their own depends on the device check below.

## Device and person checks

To add to [DEVICE-CHECKS](../DEVICE-CHECKS.md) when the build lands: on an iPad, can a toddler or preschooler keep a finger on the crank through a whole turn (or does the 230-unit ring need widening); does a small hand stop the pour near the line, and is the half-speed help enough; does a toddler close a loop at all. Chrome automation establishes none of these.

## Build order and check tier

One slice, **after slice 1** (built) and independent of slices 2 and 3 (the show map and the orders above let them land in any order): new files `src/games/quick-tricks/third-logic.ts`, `third-logic.test.ts` and `third-show.ts`; edits to `index.ts` (the show map, `LEVELS`, `describeLevel`, `create`), `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

**Tier: new interaction.** Typecheck, unit tests, one scripted play of level 9 at pre-K that releases the crank mid-turn (progress kept), overfills a cup once (no miss) and tips it out, then loops the wrong number of fireflies twice (two misses, the glow) and finishes to the sticker; one portrait screenshot of the music box mid-turn; `fingerdemo` at 9; one `npm run build` for the voice lines. If the allowance cannot cover the whole show, push the crank and the cups as a draft checkpoint with level 9 kept out of every band's order until the loop lands.
