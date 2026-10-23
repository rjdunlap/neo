# Melt and Freeze, levels 1–4 (definition)

Defined 2026-10-22 as slice 1 of the [matter study](../deep-dives/subjects/matter.md#build-slices-in-order), from its [first game's ladder](../deep-dives/subjects/matter.md#a-first-games-ladder-melt-and-freeze) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#matter-recommendations). *Melt and Freeze* is a working name and `melt-freeze` a working ID; levels 5–11 (predictions, the can't-go-back sort, three states, the sealed-jar scale, the dial, the particle lens) are not defined here.

**Status: defined, build not ready.** The build waits on the developer's calls in the [Waiting row](../WAITING-ON-DEVELOPER.md) "Melt and Freeze: new game, land and bands" ([decisions 1–3](#open-decisions)). Merging this definition does not authorize the build. Docs only: no game, ID, voice line, save field or journal entry exists yet. Levels 1–4 use only ice, butter, chocolate, a stone and a spoon, never heat food for her and draw no flame or steam, so no science or food-safety reviewer gates them ([decision 4](#open-decisions)).

**Fun action and purpose:** a thing sits on a little table. She taps the big **sun** and it slowly melts into a puddle with a drip and a chime; she taps the **snowflake** and it freezes back into the thing. Some things do not change at all. The learning purpose is **warm makes some things melt, cool makes them hard again, and it is still the same thing** (the study's anchors: NGSS 2-PS1-1/3/4 for observed properties and changes that can be undone, with 5-PS1-4 the later horizon). Younger levels are pure cause and effect; the choice of tool arrives at level 3 and the "some things don't" contrast at level 4.

## Identity and overlap

- **Sink or Float** (Bubble Beach) owns floating and density in water, with no warm or cool. Melt and Freeze never puts anything in water to test it and never asks "will it float".
- **Pet Kitchen** only cuts and counts food; it has no change of state. **Color Garden** owns colour mixing; nothing here mixes.
- **Drop's Journey** (the weather study) follows water round a world. Melt and Freeze never leaves the table, shows no cloud, rain or steam at levels 1–4, and the later dial (level 9) is not in Drop's Journey. Ice and a puddle are shared drawings, not a shared water cycle.
- **Ramp Race**'s two-lane fair test is the model for levels 9+ and is not copied here.

## The model (`logic.ts`)

The state table is authored, not simulated, so every change can be tested.

- **Tools (levels 1–4):** `sun` (one warm step) and `snow` (one cool step). No dial, no hot setting and no flame at these levels; the three-setting dial is level 9's.
- **Substance:** `{ id, solid, melted | null, reversible }`. A substance with `melted: null` never changes. A substance has two **states**, `solid` and `melted`; the state starts `solid` unless a request says otherwise.
- **Step:** `step(substance, state, tool)`: `sun` takes `solid` to `melted` if the substance melts, else leaves it; `snow` takes `melted` to `solid` if the substance is reversible (every one in levels 1–4 is), else leaves it. Any other combination (sun on a puddle, snow on a solid) is **no change**, and the voice says so ("It's already melted.", "It's already hard.").
- **Identity:** a substance keeps its `id` in both states. The table keeps a small outline of its solid beside a puddle, so a puddle is always seen as *that thing's* puddle.

### The substance table (levels 1–4)

| id | Solid | Melted | Changes? | Reversible | Used at levels |
| --- | --- | --- | --- | --- | --- |
| `ice` | an ice cube | a clear puddle | yes (sun) | yes (snow) | 1, 2, 3, 4 |
| `butter` | a butter block | a yellow puddle | yes | yes | 2, 3, 4 |
| `chocolate` | a chocolate square | a brown pool | yes | yes | 3, 4 |
| `stone` | a grey stone | none | no | not applicable | 2, 4 |
| `spoon` | a wooden spoon | none | no | not applicable | 4 |

Wording is "melts" and "freezes" for ice and "melts and goes hard again" for butter and chocolate (voice never says butter or chocolate "freezes"). Popcorn, toast, a candle, steam and any hot setting are later levels.

## Levels

| Level | Name | Bands (default) | What she decides | Round |
| --- | --- | --- | --- | --- |
| 1 | **Sun and snow** | lap, toddler | Nothing; she watches | One ice cube |
| 2 | **Three things** | lap, toddler | Nothing; she watches | Three things in turn |
| 3 | **Make it…** | toddler, preschool | Sun or snowflake | Three requests |
| 4 | **Some do, some don't** | preschool | Nothing; she finds out | Two trays of four |

**Bands.** `lap` 1–2, `toddler` 1–3, `preschool` 3–4; levels 5–8 add `prek` and `school`, 9–11 older still ([decision 2](#open-decisions)). `playBand` handles any other band. The `lap` entry is a tap-the-big-picture experience with no reading and no failure.

### Rounds (authored pools; each level's first round is authored)

- **Level 1:** the ice cube, always. The round ends when she has seen it **melt and freeze once each** (sun then snowflake, any other order of extra taps is free). After three sun taps in a row with no snowflake, the snowflake pulses ("pulse", not a hint; nothing counts). After a long idle pause the pet taps the missing tool as a ghost and the round finishes ("supported finish", no count).
- **Level 2:** three things in turn, drawn by the seeded RNG from the pool above but always at least one that changes and at least one that does not. The authored first is `ice`, `butter`, `stone`. For each she taps sun (and for a thing that melted, the snowflake). The voice names what happens: "The ice melts!", "The stone stays a stone." The round ends after the third thing's sun (a changer also needs its snowflake). No wrong action exists.
- **Level 3:** three requests, each a start state, a target and two tools: "Make the ice into water" (`ice`, solid, melted), "Make the puddle hard again" (a melted `butter`), "Make the chocolate melt" (`chocolate`, solid, melted). The authored first is the ice request. Requests alternate direction (a melt, a freeze, any) and never use `stone` or `spoon` (nothing can be made to change). The request card shows a picture of the target next to the thing.
- **Level 4:** a tray of four distinct things from the pool, always two that change and two that don't (the authored first tray is `ice`, `butter`, `stone`, `spoon`; the second round's tray is `chocolate`, `ice`, `stone`, `spoon`). Sun warms all four at once; snowflake cools all four at once; she is free to do both in any order and repeat. A tray finishes after she has used each tool at least once; a round is two trays.

## Screen and controls

- **Tools:** the sun and the snowflake are drawn at least **120 logical units** across and sit together in one corner (landscape: right edge; portrait: bottom centre, above the home line and clear of the pet). Touch-down brightens the tool at once and starts its sound. Level 3 shows them as the same two buttons, never as words.
- **The table:** a rounded tabletop in the middle; one thing at a time at levels 1–3, up to four things in a row at level 4, each at least 100 units wide as a solid and as a puddle. A thing can also be tapped to wiggle (a free tick, no meaning).
- **Change animation:** a melt shrinks the solid and spreads the puddle over about 1.2 s with a drip, then a soft chime; a freeze reverses it with a crystal chime. Both use `ctx.tw` and are cut cleanly if the scene is destroyed. Pitched sounds use `src/audio/notes.ts`. No hot object, flame or steam is drawn near the pet or at all at these levels.
- **Layout:** `tableLayout(view, n)` for one to four things plus the tools, audited in the four views the lands test uses with the bottom-left pet and the home and corner buttons clear. Four things at 100 units are the portrait question: if four do not fit, level 4 shows three (still one change and one non-change at minimum, or two and one) rather than shrinking a thing, and the build records it.
- **Request card (level 3):** a card of at least 140 units pictures the target state; it never covers the thing.
- **Pause sheet:** Start again and Show a hint (`Scene.pauseActions()`).
- **Music:** the island's loop plays (she is not making music).

## Accounting, help and finishing

- **Never a miss:** every tap at levels 1, 2 and 4; touching a thing; repeating a tool; sun on a puddle or snow on a solid (the voice just says it is already so).
- **Level 3 only:** a tool that does not make the requested change is one miss (the thing shows the "already…" or "nothing happens" result, so she sees what that tool does), counted once per request per tool until she picks the right one. Picking the other tool and then the right one is a normal try, never scolded.
- **Hints (level 3):** after a miss, one short line ("Ice melts when it's warm."); after two misses the right tool glows and `hints++` once per request; Show a hint does the same, still once per request. **Supported finish:** a third miss makes the pet tap the right tool, so every request finishes. Assisted completion is not mastery evidence.
- **Finish:** `ctx.finish({ misses, hints })`; one ordinary sticker, with or without help. Adaptation uses the ordinary rule; at levels 1, 2 and 4 misses are always 0, so a smooth round steps up on its own and the game never steps down from them.
- **Discoveries:** level 4 files one **journal entry per substance that changed** (`ice`, `butter`, `chocolate`) and one for "some things don't change" only if a round actually showed a stone or spoon not changing. The entries and their spoken lines live in `src/content/journal.ts` with a test against the game's table. A creation is not kept.

## Speech (`voice-script.ts`)

Lines under `meltfreeze.*`: `intro`, `instruct.watch` ("Tap the sun!"), `instruct.both` ("Tap the sun. Tap the snowflake!"), `instruct.make` ("Make the {thing} {target}!"), `instruct.tray` ("Warm them all. Cool them all. What do you see?"), `melt` ("It melts!"), `freeze` ("It goes hard again!"), `samestone` ("The stone stays a stone."), `already.melted`, `already.hard`, `hint.melt` ("Ice melts when it's warm."), `hint.freeze` ("Cool makes it hard again."), `same` ("Same ice, in a puddle."), `done`. No line names a temperature, a state of matter, "liquid", "solid" or "steam", and none offers advice about heating food. A test checks the forbidden words.

## Rule tests (`logic.test.ts`)

- **Table:** every substance's solid and melted forms are authored; `stone` and `spoon` have `melted: null`; each id is unique; ids are stable.
- **Reversibility:** for every substance that melts, `snow(sun(solid))` returns the solid; sun and snow on the wrong state are no changes; a non-melting substance never changes under either tool.
- **Identity:** the same `id` in every state a request or round touches.
- **Rounds:** level 1 is always ice; level 2 draws three distinct things with at least one changer and one non-changer, first authored; level 3 requests are all solvable in exactly one tool with the other tool a no-change; level 4 trays have two changers and two non-changers (the layout cap may reduce this to a stated minimum).
- **Check accounting:** a scripted level-3 request (right tool: no miss; wrong tool: one miss; the same wrong tool again: one more; Show a hint twice: one hint; a third wrong tool: supported finish) counts the stated misses and hints; levels 1, 2 and 4 count 0 and 0 for any tap sequence.
- **Hints:** each hint points to the tool that makes the requested change.
- **Layout:** `tableLayout` at the four views for one to four things and the two tools: sizes at least 100 (tools 120), no overlap, the pet corner and buttons clear, inside `view`.
- **Voice and journal:** forbidden-words test; each filed discovery has a journal entry whose line matches the table.
- **Registry, lands and how-to tests** pass, including the home land on one screen at every band that sees it.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` follows the round: level 1 taps the sun then the snowflake; level 2 the same for each thing in turn; level 3 taps the right tool for the request; level 4 taps the sun then the snowflake once each. It finishes inside the demonstration window.
- **How-to card** (`src/content/howto.ts`). Goal: "Warm and cool things, and see which ones melt and which go hard again."
  - Steps: "Tap the sun to warm the thing, and the snowflake to cool it" (levels 1–2); "Make the thing the way the card shows: choose the sun or the snowflake" `{ from: 3, to: 3 }`; "Warm and cool the whole tray and see which things change" `{ from: 4, to: 4 }`.
  - Finish: "She has seen the thing melt and go hard again" `{ from: 1, to: 2 }`; "The thing is the way the card shows" `{ from: 3, to: 3 }`; "Both tools used on the tray" `{ from: 4, to: 4 }`.
  - Notes: "Nothing here counts as a mistake" `{ from: 1, to: 2 }` and `{ from: 4, to: 4 }`; "Choosing the wrong tool shows what it does; the pet gives a hint, and after two it glows" `{ from: 3, to: 3 }`.
- **Registration:** ID `melt-freeze` (working), name "Melt and Freeze" (working), spoken title `game.melt-freeze`. Region (subject) `tinker-lab`. Skills `['states-of-matter', 'cause-and-effect', 'observation']`. Bands as above. Home land **Bubble Beach** by default ([decision 3](#open-decisions)). Hub icon: a cube beside a puddle. Sticker (page `meadow`): a seeded small drop or cube shape.
- **Art (code-drawn, `src/games/melt-freeze/art.ts`, colours from `src/art/palette.ts`):** sun, snowflake, tabletop, one solid and one melted drawing per substance, the faint solid outline. Puddle art reuses shared drawings only where `src/art/` already has them.
- **Co-play:** *What happened?* The grown-up asks her to name what the sun did, then the snowflake. **Off-screen** (a spoken tip, no printed card): "Put an ice cube on a plate by a window and watch it with her. Say what is happening." No stove, kettle, microwave or food-heating advice until a reviewer is named.
- **Couch:** none. **Rework couplings:** none required; a discovery per changer could later become a collectible the [rework brief](../rework/README.md) decides.

## Check tier

New-game tier, in one or two build sessions (the study's slice 2: levels 1–4; if the layout or art grows, split levels 1–2 from 3–4): typecheck and unit tests (the properties above plus registry, lands, journal and how-to tests); one scripted play through a new `browser-check.mjs` case (and its README row) at the first and last level, with one wrong tool at level 3 and one hint; one portrait screenshot at level 4's four-thing tray; `fingerdemo` at levels 1 and 3; `npm run build`, because the registry, lands, voice, journal and how-to files change.

Device and person checks stay open: whether a one-year-old notices the puddle after the cube; whether a 3–4-year-old reads the sun and snowflake as warm and cool; whether the drip and chime sounds are comfortable; and how the device speech says the lines. Browser automation establishes none of these.

## What comes next

Levels 5–6 (predictions; the can't-go-back sort with toast and a popped kernel) and 7–9 follow the study's [slices 3–4](../deep-dives/subjects/matter.md#build-slices-in-order); the dial, steam and the particle lens wait on the named science reviewer. **Stir and See** is defined after this table is frozen, as its outcome table can reuse the substance record.

## Open decisions

Decisions 1 and 3 block the build; the rest have defaults the build uses.

1. **A new game or a mode of Sink or Float** (blocks). Lean: a new game, since the action (warm, cool) and learning (changes that can be undone) differ from density, and the overlap check above found no game that owns it.
2. **Bands.** Default `lap` 1–2, `toddler` 1–3, `preschool` 3–4; later levels extend to `prek`, `school` and older. Confirm lap is wanted (the claim that a one-year-old watches a puddle appear is an inference).
3. **Home land** (blocks). Default **Bubble Beach** (10 games today, next to Sink or Float), else **Tinker Lab** (12; Bond Beads and Gear Garden's definitions also list it) or Cozy Village (Pet Kitchen). The subject `region` is `tinker-lab` either way; the lands layout test decides.
4. **Reviewer.** Levels 1–4 need none (no heating, no steam). A named science and food-safety reviewer is needed before the dial, steam, any food-heating line or a printed card. Please confirm.
5. **Journal.** Default: one entry per substance that changed. Alternative: nothing filed, until the rework decides how discoveries relate to collecting.
