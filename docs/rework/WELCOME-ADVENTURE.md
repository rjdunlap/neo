# RW04: Welcome a New Friend (welcome adventure and learning packet)

Defined 2026-10-17 for [RW04](WORK-ITEMS.md#rw04-welcome-adventure-and-learning-packet) ([issue #488](https://github.com/rjdunlap/neo/issues/488)). **Docs only: nothing here is built.** It turns RW01's [story beats](NAME-AND-STORY.md#one-complete-invitation-and-ending-welcome-a-new-friend) into buildable steps and is the step/result/accounting authority RW07 builds from. RW03's [routes](HOME-NAVIGATION.md#routes-and-meaning) own navigation; RW05/RW06 own the collection and the home. Every source claim below was checked at `84e1433` (`origin/main`, 2026-10-17).

## Summary

- **Bands:** `preschool` and `prek` only, as one project with per-band levels. Lap/toddler and school variants are [scoped separately](#younger-and-older-variants-not-defined-here).
- **Three steps, any order:** *something pretty* (Stamp Studio), *something yummy* (Pet Kitchen), *a song to say hello* (Song Maker free loop).
- **Honest results:** her **actual stamped picture** and **actual tune** are kept with the project and used in the ending. The food is a **fixed consequence that the round really guarantees**: the levels chosen only finish when the plates hold exactly the pictured amounts.
- **One decision for the developer:** Song Maker keeps a tune only in its free mode (levels 1–2), which is below both bands' ranges. This packet recommends a stated, test-guarded story exception (play level 2) over a new compose level; see [The song step](#3-a-song-to-say-hello-song-maker).
- **New plumbing:** a typed, step-scoped project result (the [proposed story results](../DESIGN.md#proposed-story-results), first used here) and a project variant of `StoryRound`. Nothing else in the shell changes.

## What the audit found

| Game | Preschool / pre-K range | Modes in range | Does the round report what she made? | Source |
| --- | --- | --- | --- | --- |
| Stamp Studio | 3–5 / 4–6 | 3 choose colors, stamp, rearrange; 4 turn and resize; 5 imaginary garden | Yes: every finish hands over `{ kind: 'picture', stamps }`, always with `misses: 0, hints: 0`. The green arrow only shows once one stamp is down, so a picture is never empty | `stamp-studio/index.ts:83-85`, `:128`, `:176`; `logic.ts:31-38` |
| Pet Kitchen | 1–4 / 3–6 | 1–4 sharing; 5–6 doubling a picture recipe | No: misses and hints only. But the round finishes only when the check passes (`fair`, `doubled`, …), so at some levels the finished plates are fully determined | `pet-kitchen/index.ts:132-134`, `:212`; `logic.ts:3-21` |
| Song Maker | 4–6 / 5–7 | 4 copy shadows, 5 copy a card, 6 continue a pattern, 7 find a tune by ear | Only in free mode (levels 1–2): `creation` is `undefined` for every copied song, so no in-range level produces her tune | `song-maker/index.ts:231-233`, `:347`; `logic.ts:14-22` |

Two more findings shape the design:

- **A story round keeps nothing.** `GameScene.finish` holds a round's creation in `this.made` and stores it only if she presses the optional Keep button, which writes the treehouse's picture/tune slot (`GameScene.ts:387-403`, `:503-524`; `store.keepCreation`). The project therefore needs its own result storage; it must not borrow the treehouse slots, which would push out what she has on display.
- **Free Song Maker can finish with almost nothing.** The free round ends after a fixed count of taps, and a tap that turns a note off also counts (`song-maker/index.ts:163-169`); `cleanTune` drops a tune under `TUNE_MIN_NOTES` (2) notes (`creations.ts:23`, `:193`). The packet handles a missing tune explicitly.

Fixed-result levels for Pet Kitchen, from `PLANS` and `recipe()`:

| Level | What finishing guarantees | Already a story round? |
| --- | --- | --- |
| 1 | two plates of one half | Windy Picnic, preschool (`picnic.ts:26-29`) |
| **2** | **four plates of one quarter** (halves cannot reach four friends) | no |
| 3 | two plates of two halves | Windy Picnic, pre-K |
| 4 | four equal plates, halves *or* quarters | no, but not determined |
| **5** | **the recipe doubled: two berries and two apples** (`recipe()` gives `[1,1]` at level 5) | no |
| 6 | a random recipe doubled | no, not determined |

So the yummy step uses **2 at preschool** and **5 at pre-K**: truthful pictures without a typed result, and no repeat of the Windy Picnic's rounds.

## The steps

Each step is an ordinary round played at the project's level, launched from the project page. The game's own instruction plays as usual; the project adds an ask on the page before and a done line after. Finishing completes the step whatever its misses and hints, so help reaches the same ending.

| Step ID | Ask (spoken on the project page) | Game and level | Fun action / learning purpose | Result kept |
| --- | --- | --- | --- | --- |
| `pretty` | "Our new friend needs something pretty over their bed. Make them a picture!" | Stamp Studio **3** (preschool), **4** (pre-K) | stamping, choosing, arranging / composition and spatial choices, free creation | her `StampPictureCreation` |
| `yummy` | "Our new friend is hungry. Share the sandwich so all four of us get the same!" (preschool) · "Our new friend loves fruit salad. Make it twice as big so there's enough for two!" (pre-K) | Pet Kitchen **2** (preschool), **5** (pre-K) | cutting and dealing / equal quarters; doubling a pictured recipe | none; the fixed picture is true by the round's rule |
| `song` | "Let's make a song to say hello. Tap the jellies to make your own tune!" | Song Maker **2** (free 6-beat loop), both bands, as a stated exception | lighting notes on a loop / high and low, a pattern that repeats, free creation | her `TuneCreation`, or none if fewer than two notes stayed lit |

Done lines (after the round returns to the project page): "Look, it's hanging over the basket!" · "Four plates, all the same. Yum!" / "Two bowls, twice as much. Yum!" · "That's our hello song!" (or, with no tune, "We'll hum hello together!"). The card's recap line for each finished step repeats the done line. All of these are new `welcome.*` lines in `voice-script.ts`; the game rounds keep their own lines.

### 1. Something pretty (Stamp Studio)

- Plays level 3 (preschool) or 4 (pre-K), the lowest level of each band's range that has colors and moving stamps (`logic.ts:33-34`). Level 5's garden-and-story prompt asks for a different picture, so it is not used.
- The stamps she pressed are the project's `pretty` result, validated by `cleanPicture`. Every finished round has at least one stamp.
- No right or wrong: misses and hints are always 0.

### 2. Something yummy (Pet Kitchen)

- The fiction names the plates: her companion, the newcomer and two club friends (preschool, four quarters), or the companion's bowl and the newcomer's bowl (pre-K, one berry and one apple each becomes two each).
- The project page and ending picture exactly what the round guarantees: four plates with one quarter each, or a bowl of two berries and two apples. A test pins the level/band pair to the plan and recipe so a later ladder change fails loudly.
- Misses and hints keep their current meaning in the game; the project ignores them except as [learning evidence](#learning-intentions-and-evidence).

### 3. A song to say hello (Song Maker)

**The problem:** no level inside preschool (4–6) or pre-K (5–7) lets her make a tune; only the free loop (1–2) does.

**Recommendation (developer decision):** the `song` step plays **level 2** (free, 6 beats × 4 rows, `notes: 14` taps) at either band, as a named exception: *a project step may use a free-making level below the band's range when that level has no right answers.* A test asserts the exception's level has `mode: 'free'` and that every other project step stays in range. It is safe because a story round never moves the saved level (`GameScene.ts:398-399`) and free play scores no misses. Song Maker 4 stays free for the proposed [Missing Melody](../definitions/missing-melody.md) at preschool.

**Alternative:** add a Song Maker compose level inside both ranges ("make a hello song, then press the green arrow"), which also lets her choose when it is finished. It is a real game change at the new-levels tier and a separate slice. The project's step contract is the same either way.

**When fewer than two notes stay lit:** the step still completes. The project keeps no tune, the ending never plays a stand-in as hers, and the done and ending lines change to humming together (no notes play). She can [make it again](#replay-resume-and-leaving) before the ending.

## Project record and typed results

A new saved record, `projects.welcome`, in the active profile's save, bounded and repaired on load:

```ts
type WelcomeStep = 'pretty' | 'yummy' | 'song';
interface WelcomeProject {
  steps: WelcomeStep[];            // completed, unique, known IDs only
  results: {
    pretty?: StampPictureCreation; // cleanPicture; ≤ PICTURE_MAX stamps
    song?: TuneCreation;           // cleanTune; absent = no tune kept
  };
  band?: 'preschool' | 'prek';     // fixed when the project starts, so levels and pictures stay consistent
  ended: boolean;
  rewarded: boolean;               // adoption and item applied (the once-only token)
}
```

- **Round to project:** a `ProjectRound` variant (`{ project: 'welcome'; step: WelcomeStep; level: number }`) beside today's picnic/woodland union in `App.ts:25`. `GameScene` treats it like a story round (story level, no adaptive move, no discovery hop: `GameScene.ts:120`, `:398-399`, `:564`) and on finish saves the step and its typed result in one write: `pretty` from `result.creation` when it is a picture, `song` from it when it is a tune.
- **Treehouse unchanged:** the Keep button still appears after a project round and still means "hang a copy in the treehouse". It is optional and independent; the project's copy is kept either way, because she made it for the request.
- **Development saves:** under the [development-save exception](../../AGENTS.md#project-direction), an older save may simply get an empty `projects.welcome`; no migration layer. Current-format validation and backup/restore still cover the new field.

## Replay, resume and leaving

- **Any order.** The card shows three step pictures; finished ones are ticked and show their result (her picture, the full plates, a note for her tune).
- **Leaving mid-step** (Home, the pause sheet, reload): the step stays undone, no result is stored, nothing is awarded. Continue reopens the project page, then the first unfinished step's introduction (RW03).
- **Make it again (before the ending):** a finished step can be replayed from its card. A finished replay **replaces** that step's result (her newer picture or tune); a replay left unfinished keeps the old one. The step is not completed twice, so nothing repeats.
- **The ending** needs all three steps. Reload during the ending replays it from the start: `rewarded` is set in the same write that applies the adoption and item, so they happen once.
- **After the ending:** the project is done; its results stay in the newcomer's corner of the home. No retelling in the first slice (a later slice may add one, as the picnics have).
- **Profiles:** a project belongs to one profile's save; switching players through `selectPlayer` never carries it.

## The ending and what changes

RW01's ending beats stand, with these results:

| In the ending | What it is | Honest label |
| --- | --- | --- |
| Picture over the newcomer's basket | **her** `pretty` result | hers |
| Plates or bowls on the floor | four quarters (preschool) or the doubled bowl (pre-K) | fixed, but exactly what her finished round made |
| The newcomer's song | **her** `song` result played on the loop; without one, the companion and newcomer hum and no notes play | hers, or plainly not a tune |
| The newcomer joins the home | adoption into RW05's collection, once (`rewarded`) | story consequence, same with or without help |
| One item (the newcomer's basket bed) | a home item for RW06, once | story consequence |
| Journal page | her picture, her tune's note, the newcomer | record of what she did |

Round stickers stay the shell's (one per completed round). The project itself awards no stickers and makes no mastery claim.

## Learning intentions and evidence

What a step can show, using only what the shell records today (`misses`, `hints`, level, completion). Richer signals are RW09's to add.

| Step | Intention | Observable action | Evidence class |
| --- | --- | --- | --- |
| `pretty` | makes and arranges a picture by choice | stamps placed, kinds and colors used, stamps moved or turned (in the saved picture) | **free creation**: participation, never correct/incorrect |
| `yummy` (preschool) | makes four equal shares from one whole | served four equal quarters | **independent** if finished with 0 misses and 0 hints; **helped** if any hint or the two-miss glow; **unknown** if left unfinished |
| `yummy` (pre-K) | doubles each part of a pictured recipe | made two of each from one of each | same three classes |
| `song` | explores high and low notes in a repeating loop | notes lit, rows (pitches) used, beats used (in the saved tune) | **free creation**; whether she meant a melody is unknown |

One round is one observation. Finishing with help is supported completion, not independent mastery, and nothing here claims transfer.

## Overlaps

- **Windy Picnic:** uses Pet Kitchen 1 (preschool) and 3 (pre-K) and Jelly Drums; this project avoids both levels.
- **Missing Melody** (proposed): Song Maker 4, Sound Garden and Sing-Along Barn at preschool; this project uses Song Maker 2 only.
- **Woodland Picnic:** school only; no shared rounds.
- **Treehouse creations:** two slots per kind (`creations.ts`); the project stores its own copies and never writes the slots itself.
- **Visual and habitat studies:** the newcomer's look comes from RW02's pilot species; the project adds no habitat kit or art pipeline.
- **D1b discovery hops:** skipped for project rounds, as for story rounds.

## Younger and older variants (not defined here)

- **Lap / toddler:** one-action shared play (RW01's "one or two glowing toys"). Toddler ranges happen to include Stamp Studio 2, Pet Kitchen 1 and Song Maker 2, but a three-step project is not assumed to suit them; define a one-step welcome separately after observation.
- **School:** Stamp Studio 5–6, Pet Kitchen 5–9 and Song Maker 6–7 (no free mode in range) need their own project with planning and revision (RW12's territory).

## First implementation slice and checks

RW07 builds this packet. It needs RW05's collection (to adopt into) and RW06's home (to show the results), so **build it after both**. One part can come first if a session wants a smaller slice:

- **RW07a (optional, before RW05/RW06):** the `ProjectRound` variant, `projects.welcome` with validation and backup coverage, the typed `pretty`/`song` results, the project page with three steps, and the song-step exception and its test. It ends on the project page showing her picture and playing her tune, with adoption, item and home display left to RW07. Tier: shell/save/navigation.
- **RW07 (the rest):** the ending, adoption, item, journal page and home display, plus the Home → Continue routes in [RW03's acceptance](HOME-NAVIGATION.md#exact-downstream-acceptance).

Checks for either: `npm run typecheck`; unit tests (steps complete once; replay replaces a result; reward applies once across reload; every project level is in range except the free-mode song exception; Pet Kitchen 2/5 still produce the pictured plates; a tune under two notes stores nothing; results validated); `npm run build`; a filtered browser flow modeled on `picnic` (open the project, finish `yummy` with one miss, leave `song` mid-round and resume, finish all three, ending once); `world` for the new route; the offline check because persistence changes. One portrait screenshot of the project page and one of the ending.

## Not in this packet

Adoption mechanics and individual identity (RW05), home layout and display (RW06), the route cutover (RW08), family recap and new evidence fields (RW09), any change to the picnics, couch play, a retelling, and observed child engagement or learning (none has been observed).
