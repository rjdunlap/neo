# RW07: Welcome a New Friend, the build packet (definition)

Defined 2026-10-21 for [RW07](WORK-ITEMS.md#rw07-welcome-adventure-and-visible-reward) ([issue #491](https://github.com/rjdunlap/neo/issues/491)). **Docs only: nothing here is built.** It turns [RW04's packet](WELCOME-ADVENTURE.md), which remains the authority on steps, asks, levels, results and evidence, into slices against the code as it now stands. That code includes RW05's collection (`store.meet`, the `metAt` token), RW06's root Home and creature play, and RW03's [route table](HOME-NAVIGATION.md#routes-and-meaning). Sources were checked at `f43ae313` (`origin/main`, 2026-10-21).

## Summary

- **Where it lives:** the site root only (`app.creatureWorld`). Classic's island never shows the project, and its picnics are untouched.
- **Who sees it:** profiles at `preschool` and `prek`, as RW04 says. Lap, toddler, school and grown-up profiles get no Continue and no project, and their Home is unchanged.
- **What it adds:** a saved `projects.welcome` record, a project round beside today's story rounds, a `ProjectScene` reached from Home's **Continue**, an ending in which the newcomer is named and joins her collection, and the newcomer's basket bed in creature play. The bed shows her picture over it and plays her tune.
- **Three slices.** Slice 1 is built (2026-10-21, #712): the record, the page, Continue, and the `pretty` and `yummy` steps. Slice 2, the `song` step, is built (2026-10-23, #907): Song Maker 2 at both bands as the decided ([record](../archive/DECISIONS-2026-10-23.md#decisions)), test-guarded `freeBelowRange` exception. Slice 3, the ending, adoption and bed, is next, because the ending needs all three results.

## What the code offers now (audit at `f43ae313`)

| Need | What exists | Consequence |
| --- | --- | --- |
| RW04's levels | Stamp Studio preschool 3–5 and pre-K 4–6. Pet Kitchen preschool 1–4 and pre-K 3–6; level 2 is one whole, four friends, cuts `[2,4]`, and `recipe()` gives `[1,1]` at level 5. Song Maker preschool 4–6 and pre-K 5–7; levels 1–2 are `mode: 'free'` | RW04's choices still hold: Stamp Studio 3 and 4, Pet Kitchen 2 and 5, and Song Maker 2 as the exception |
| A round that returns to its story | `StoryRound` in `src/app/App.ts:26` (picnic or woodland). `GameScene` plays `story.level`, skips the how-to intro (`shouldExplain`'s `story`), never moves the level (`recordRound`'s fourth argument), calls `store.completeStep`, shows a basket on the result and returns through `goHome()` | A third member of the union reuses all of it. `finish` and `goHome` gain one branch each |
| Adoption | `store.meet(species, name, color, metAt)` is idempotent on `metAt`, writes at once, refuses past 24 and sets `companion` only when it is `null` | Adoption is `meet(…, 'project:welcome')`. A replay, a reload or a second ending returns the same individual |
| Home's actions | `homeLayout()` (`src/creatures/home-layout.ts`) places Play and Explore for preschool and up. Continue "is not drawn, rather than drawn and empty" until RW07 | Slice 1 adds a `continue` spot and its layout test |
| Kept creations | `cleanCreation`, `cleanPicture` and `cleanTune` in `src/content/creations.ts`. A tune under `TUNE_MIN_NOTES` (2) cleans to nothing | The project's copies are validated by the same functions and never use the treehouse slots |
| A name picker | `HatchScene`'s three suggested-name buttons from `SPECIES[…].names` | The ending reuses the pattern, without a typed name |
| Reset | `store.reset()` keeps `profile`, `settings` and `creatures` | A reset clears the project and keeps the newcomer. The token stops a second adoption |

## The saved record

This replaces RW04's sketch with the fields the slices use. The record is in the active profile's `SaveData`; `version` stays 3, and `migrate()` repairs a missing or damaged block to the default, under the [development-save exception](../../AGENTS.md#project-direction).

```ts
type WelcomeStep = 'pretty' | 'yummy' | 'song';
interface WelcomeProject {
  band: 'preschool' | 'prek' | null;   // fixed by the first step launched; null before
  steps: WelcomeStep[];                // completed, unique, known, in WELCOME_STEPS order
  results: { pretty?: StampPictureCreation; song?: TuneCreation };  // cleanPicture / cleanTune; a dirty value is dropped
  newcomer: SpeciesId | null;          // fixed with band; who is coming (below)
  ended: boolean;                      // the ending's last write happened
}
// SaveData.projects: { welcome: WelcomeProject }, default { band: null, steps: [], results: {}, newcomer: null, ended: false }
```

- **Repair:** an unknown band becomes `null`. Steps are filtered to known IDs, with duplicates dropped. A `song` result is kept only when `song` is a completed step, and the same for `pretty`. `newcomer` must be a known species. `ended` is true only when all three steps are present.
- **No separate `rewarded` flag.** The adoption is `creatures.owned` holding an individual with `metAt === 'project:welcome'`, and the basket bed exists exactly when that individual does. One fact cannot disagree with another, and `meet`'s write is the reward's write.
- **Backup, restore and `PreviousSave`** go through `migrate()` as they do now. A save test covers each.

**Who is coming.** When the first step is launched, `newcomer` is fixed to the first species in `['river', 'glider']` she does not yet own, or `river` when she owns both (a development seed). Two of one species are allowed, each with its own name. The newcomer is drawn on the project page from the start, as a shy creature peeking from a basket, so the invitation shows who is coming.

## Routes and scenes

| Route | Opens | Back / Home |
| --- | --- | --- |
| Home's **Continue** (preschool and up, root only, drawn while `projects.welcome` is not `ended` and the profile's band is `preschool`/`prek`, or `band` is set) | `go.project()` | — |
| `go.project(step?)` (new in `Routes`; the classic table points it at `go.hub()`) | `ProjectScene`: the newcomer in a basket and three 150-unit step cards. A finished card is ticked and shows its result: her picture, the fixed plates, or a note (slice 2) | Back (an arrow) and Home both return Home |
| A step card | The first tap speaks the step's ask (`welcome.ask.<step>`, the pre-K line for `yummy` at pre-K) and raises a green Play arrow on that card. Play opens `go.game(id, band, { project: 'welcome', step, level })` | — |
| The round | An ordinary round at the project's level, with no intro card (as a story round), no adaptive move and no discovery hop. Its result's basket button returns to `go.project(step)`, which speaks the done line | Pause and Home leave the step undone: nothing is stored or awarded |
| All three ticked (slice 3) | The ending, in `ProjectScene` | — |

- **Continue lands on the page, then the first unfinished step's ask**, spoken and raised as if tapped, per RW03. With nothing done it is the invitation: `welcome.invite` ("Someone new is coming to live with us! Let's get ready.") then the first card's ask.
- **Make it again:** a ticked card can be replayed until the ending. A finished replay replaces that step's result, and an unfinished one keeps the old result.
- **Voice:** new `welcome.*` lines are RW04's asks and done lines, `welcome.invite`, `welcome.back` (Back), `welcome.name` ("Our new friend wants a name. Tap a name to hear it, then tap the green arrow."), `welcome.joined` ("{new} lives here now!") and `welcome.bed`. Navigation needs no reading.

### `GameScene` changes

- `StoryRound` gains `{ project: 'welcome'; step: WelcomeStep; level: number }`. Every `!!this.story` test (intro skip, no level move, no hop, the result's basket and no Next level) then holds for it.
- `finish`: for a project round, call `store.completeWelcomeStep(step, cleanCreation(result.creation))` instead of `completeStep`. It writes the step and its typed result in one save: `pretty` keeps a picture, `song` keeps a tune, and `yummy` keeps nothing. The sticker and round record stay as they are.
- `goHome`: a project round returns to `go.project(step)`.
- The result's optional **Keep** still writes the treehouse slot, independently. The project's copy is kept either way.

## The ending (slice 3)

Shown in `ProjectScene` when the page opens with all three steps done and the newcomer not yet adopted. It plays as RW01 and RW04 describe:

1. The companion leads the newcomer in. Her picture hangs over the basket, and the plates or bowl RW04 pictures sit beside it.
2. Her tune plays on the loop, as `creation-art.ts`'s plaque plays it in creature play. With no tune, the two creatures hum and no notes play.
3. **Naming:** the newcomer's three `SPECIES[…].names` as 120-unit buttons, each spoken on touch, and a green arrow. The arrow calls `store.adoptWelcome(name)`, which is `meet(newcomer, name, SPECIES[newcomer].color, 'project:welcome')` and `ended = true` in one write. Then comes `welcome.joined`, then Home.
4. **Leaving before the arrow** adopts nothing. Continue reopens the ending from the start. **A reload after the arrow** finds the individual and `ended`, so the page says `welcome.joined` and goes Home. Continue is no longer drawn.

The companion does not change. The newcomer appears in Friends at once and travels only after an explicit **Come with me**, as RW05 requires.

**What changes at home.** In creature play (`PlayScene`, the root's `room`), the newcomer's **basket bed** is drawn in a corner clear of the ball's floor, with the newcomer curled in it and her project picture over it. Tapping the newcomer wakes it with a chirp and plays her project tune, or a hum without one. Tapping the bed says `welcome.bed`. The bed is derived from the adopted individual, so there is no inventory, and it never asks for anything, waits or wears out. If she later makes the newcomer her companion, the bed stays and is empty. The stage friend is the companion, so the newcomer is not drawn twice.

## Not in this packet

- **A journal page.** RW04 lists one, but the journal is not reachable from the root until RW08's library. The bed is the record for now ([default 4](#decisions-defaults-the-build-uses)).
- A retelling, a second project, a project library, lap/toddler or school variants (RW04 leaves them undefined), RW09's evidence fields, RW08's cutover and Explore, controller reach of the project page (as Home, a focus ring waits for RW08), and any change to the picnics, couch play or classic's map.

## Decisions: defaults the build uses

**Decided 2026-10-23 (on the developer's delegation):** the defaults stand: the first unowned of river, then glider comes; the species' three suggested names only; the species' palette colour with no colour step; no journal page until the root has the journal; a reset clears the project and keeps the newcomer.

Decided 2026-10-23 on the developer's delegation ([record](../archive/DECISIONS-2026-10-23.md#decisions)). Each has a default, so none blocks slice 1 or 3. The hello-song level stays the one blocking call, and it gates slice 2.

1. **Who comes:** the first unowned of river, then glider. (Alternative: a fixed species, or a pick between two eggs.)
2. **Naming:** the species' three suggested names only. (Alternative: the hatch's grown-up typed name as well.)
3. **Its colour:** the species' palette colour, with no colour step, which keeps the ending short. (Alternative: the hatch's eight swatches.)
4. **No journal page** until the root has the journal. (Alternative: a journal entry now, readable only in classic.)
5. **A reset clears the project and keeps the newcomer**, and replaying the ending adopts no one new. (Alternative: a reset leaves a finished project finished.)

## Build slices, in order

**Slice 1: the project record, the page, Continue, `pretty` and `yummy`.** Shell, save and navigation tier. **Built 2026-10-21 (#712)**; `BROWSER_SUITE=welcome` is `welcomeFlow`. A finished replay replaces the picture, but a replay that ends with an empty or non-stamp picture keeps the old one (the default chosen).
- `projects.welcome` with defaults, repair and tests: unknown steps, a result without its step, band and newcomer, backup and `PreviousSave`, and reset. `store.completeWelcomeStep` with tests: a step completes once, a replay replaces a result, an empty or dirty picture is dropped, and band and newcomer are fixed by the first launch.
- `WELCOME_PLAN` in `src/content/welcome.ts`: each step's game, levels per band and voice lines. A test asserts that every level is inside the game's band range (the song row is absent until slice 2). A second test asserts that Pet Kitchen 2 at preschool and 5 at pre-K still mean four quarter plates and `recipe(5) = [1,1]`.
- The `StoryRound` member, `GameScene`'s two branches, `go.project`, `ProjectScene` with two cards (the song card is not drawn yet), Continue in `homeLayout` with its layout test in five views at both bands (three 120-unit actions, clear of the link and guide corners), and cleanup on destroy.
- The page reaches no ending in slice 1. With both cards ticked, it says `welcome.soon` ("Our new friend is almost here!").
- **Checks:** typecheck; unit tests; build; a new `BROWSER_SUITE=welcome` case at the root (preschool profile: Home → Continue → invitation → `yummy` with one wrong cut → Home mid-`pretty` → reload → chooser → Continue → `pretty` again → finished, both cards ticked with her picture shown → the treehouse slots unchanged → a pre-K profile sees the pre-K ask, and a toddler profile sees no Continue); `home` (Home changed); `picnic` (the story branch in `GameScene` changed); and the offline check (persistence and navigation). One portrait screenshot of the project page. `world` only if classic's routes change beyond the `project → hub` stub.

**Slice 2: the `song` step.** Shell, save and navigation tier. **Built 2026-10-23 (#907)**; `BROWSER_SUITE=welcome` extended. `WELCOME_PLAN.song` is Song Maker 2 at both bands, flagged `freeBelowRange: true`; a test asserts it is the only below-range step and runs in free mode. `welcomeDoneLine()` picks `welcome.done.song` or, with fewer than two notes kept, `welcome.done.song-hum`. The third card shows her tune as a `TunePlaque` (a soft note before one is kept); a finished replay replaces the tune and a one-note or empty replay keeps the old one. With all three done the page still says `welcome.soon`. The browser case plays a one-note song (hum line, nothing stored) then a replay with 14 tapped jellies (tune kept, Song Maker level unmoved, treehouse unchanged).

**Slice 3: the ending, adoption and basket bed** (after slice 2). Shell, save and navigation tier.
- `store.adoptWelcome`, with tests: one individual across two calls, a reload and a reset; the companion unchanged; and a full collection (24) ends the project without adopting, saying `welcome.full` and never dropping a friend.
- The ending in `ProjectScene`, the bed in `PlayScene` (with `playLayout`'s test extended so the bed clears the ball's floor and every button), and Continue's removal.
- **Checks:** typecheck; unit tests; build; the `welcome` case extended (finish the song → ending → leave at naming → Continue replays the ending → name → Home has no Continue → creature play shows the bed, her picture and her tune → reload → Friends lists the newcomer → Come with me → the guide is the newcomer → a second profile has neither); `home`; the offline check. One portrait screenshot of the ending and one landscape screenshot of the bed.

**Not established by any slice:** whether a child understands the invitation, whether she reads the newcomer as hers, the asks' device speech, or naming by tap at three or four. These go to [device checks](../DEVICE-CHECKS.md) when each slice is built.
