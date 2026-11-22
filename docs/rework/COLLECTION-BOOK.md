# RW10: Collection book and chosen unlock goals (definition)

Defined 2026-11-22 for [RW10](WORK-ITEMS.md#rw10-collection-book-and-chosen-unlock-goals) ([issue #494](https://github.com/rjdunlap/neo/issues/494)); the definition started on the [2026-11-17 decision](../archive/DECISIONS-2026-11-17.md#rework) that RW08's slices 1–2 meet its dependency. **Nothing here is built**, and being defined does not authorize RW11 or RW12. It builds on the [RW05 collection model](CREATURE-COLLECTION.md) (individuals, `meet()`, the `metAt` token, Friends), [RW06's dressing](HOME.md) (looks, no wardrobe inventory), [RW07's welcome project](WELCOME-BUILD.md) (the adoption token, the basket bed) and [RW08's library](RW08-CUTOVER.md#slice-2-the-library-the-stories-and-the-rest-of-home). Every code claim below was checked at `dc3645c94` (`origin/main`, 2026-11-22).

## Summary

- **A fourth book in the library.** Creature play → the books → the library gains a **collection book** card beside the journal and the stories. The book is pictures: her friends grouped by species, the things she has earned, and the goals she can reach next. It never selects or dresses anyone itself; a friend's picture opens Friends with that friend previewed, where Come with me and Dress already are.
- **Goals are only what a built path can reach.** A goal is a row in a content table with a derived done-state and a path button straight into the project or level that completes it. Nothing is counted, nothing is stored about progress, and a species or item with no built path does not appear at all: no silhouette of a creature she cannot reach.
- **Two goals exist at first, in different bands.** The **discovery** goal is the welcome project's newcomer (preschool and pre-K, while the project is open). The **customization** goal is a paint-shelf colour from Paint Mixer level 5 (school), which becomes a colour she can give a friend. Lap, toddler and grown-up profiles see the book with no goals.
- **She chooses one goal; the book shows it first.** The only new save field is the chosen goal's id. Choosing changes nothing in any game.
- **The put-down test holds by construction.** Goal progress appears only in the book, which she opens by choice. A round's result never mentions a goal, and a test keeps the result code from importing the goal table.
- **Two build slices:** the book with the discovery goal, then the colour goal, which comes after the `paint-mixer 4` batch.

## What exists today

| Piece | Where | What RW10 uses |
| --- | --- | --- |
| Individuals and the companion | `SaveData.creatures` (`src/progress/save.ts`), at most 24, `metAt` tokens, `store.meet()` idempotent on the token | The book's friend pages read `owned`; nothing writes it |
| Species | `SPECIES` in `src/creatures/species.ts`: `sprout`, `river`, `glider`, each with prepared portraits (Friends' cards) | Card pictures and the newcomer's silhouette |
| The second-wave six | `src/art/creatures/cast/`, sprites only, outside the build on purpose ([pilot](GENERATED-CREATURE-PILOT.md)) | Nothing: not in `SPECIES`, no path, so not in the book |
| Welcome a New Friend | `src/content/welcome.ts`: preschool and pre-K, three steps, `newcomerFor()` (the first of river and glider she does not own), adoption token `project:welcome`, `welcomeFriend()` | The discovery goal and its path (`go.project()`) |
| The basket bed | `PlayScene`, drawn once the project adopted its newcomer | A thing on the book's things page |
| Looks | `look.color` (one of `PET_COLORS`, `src/content/world.ts`) and `look.worn`; every wearable is free (RW06) | Wearables are not goals, since nothing locks them |
| The paint shelf | `src/content/journal.ts`: six `paint-mixer:<colour>` entries, filed when a level-5 bucket matches (help included) | The colour goal's done-state, derived from `journal.found` |
| Paint Mixer level 5 | `makeSample()` in `src/games/paint-mixer/logic.ts` picks each bucket's triple and order **from the seed** | The colour goal needs a requested recipe (slice 2) |
| A launched level | `go.game(id, band, story, again, origin, level)`; `GameScene` records with adapt off only for a `{ daily: true }` origin with a start level | Slice 2 extends that rule to the book's origin |
| The library | `LibraryScene`: journal, Windy Picnic, Woodland (school); Back to creature play, Home to Home | The fourth card |

**On a phone** the root is Today's six alone (`App.phoneOnly` in `src/rework.ts`), so Home, creature play, the library and the welcome project are not there, and neither is the book. That is the existing phone decision ([todays-six](../definitions/todays-six.md#on-a-phone-and-playing-all-six-built-2026-11-09)); this packet adds no phone entry. The book is played on a tablet or a computer.

## The book

**Route.** `go.book()` opens `BookScene`. Its way in is a fourth library card (a closed book with a paw on the cover, Graphics, 150 units like the others, spoken `library.book`). Back returns to the library; Home goes Home. No Home button, card or badge anywhere else points at the book or at a goal.

**Pages.** One page at a time, laid out from `view`, paged with the held arrows Friends uses rather than shrunk (`landLayout`'s rule: a target never shrinks below 100 units; tests at every band in four views, upright included):

1. **Goals** (shown first, and only when at least one goal is reachable at her band): a large card per reachable goal, the chosen one first and marked with a star. A card holds the goal's picture (the newcomer's portrait as a dark silhouette, or a paint jar in the colour), a plain-picture path button (the project's icon, or Paint Mixer's), and nothing that counts. A done goal turns into its result: the friend's portrait in colour, or the jar full.
2. **Friends**, grouped by species: one row per species she owns, headed by that species' portrait and spoken name, with her individuals of that species as 150-unit cards (portrait recoloured to the individual's colour, its name under it). Six cards fit a page; more page. Tapping a card says the name; a second tap on the same card opens `go.friends(id)` with that friend previewed (one tap looks, the next goes, as the Arcade's cards do).
3. **Things**: what she has earned and can still use. At first that is the basket bed (once adopted; tapping it opens creature play, where the bed is) and, after slice 2, the colours she has mixed (tapping one opens Dress for her companion with the colour row showing). Nothing here can be lost, used up or locked again.

The page order is fixed; the dots under the page show where she is. A profile with no goal starts on Friends.

**Choosing a goal.** Each goal card has a star button (100 units, touch-down feedback). Tapping it makes that goal the chosen one, says `book.chosen`, and moves its card first; tapping the chosen star again clears the choice. At most one goal is chosen. Choosing starts nothing, changes no level, and is never asked for. Following a path button does not choose the goal either.

**Grouping keeps a larger collection readable.** The book never shows more than six cards at a time, groups by species and pages within a group. A 24-friend profile with three species is at most five Friends pages. A test fills a profile to 24 and checks the paging at every view.

**Never mastery.** Opening, paging, choosing and following a path record nothing: no sticker, round, miss, hint, journal entry or stat. The journal stays the place discoveries are filed; the book reads it.

## Goals

A goal is a row in `src/content/goals.ts`:

```text
Goal {
  id: string               // stable forever: 'friend:welcome', 'colour:<shelf colour>'
  kind: 'friend' | 'colour'
  reachable(save, band): boolean   // a built path exists for this profile now
  done(save): boolean              // derived from the save; never stored
  path: { project: true } | { game: 'paint-mixer'; level: 5; recipe: ShelfColour }
}
```

| Goal | Reachable when | Done when | Path |
| --- | --- | --- | --- |
| `friend:welcome`: meet the newcomer (`newcomerFor(owned)`, named by species) | The project is hers and open: `showsContinue(projects.welcome, band)` | `welcomeFriend(owned)` exists | `go.project()`, the page Home's Continue also opens |
| `colour:<c>`, one per paint-shelf colour (slice 2) | Band `school`, where Paint Mixer plays | `journal.found` holds `paint-mixer:<c>` | `go.game('paint-mixer', band, undefined, false, { book: true }, 5)` with the recipe requested (below) |

**After the welcome project ends** the friend goal is done, shown once as the friend in colour, and the next open of the book has no friend goal: the remaining pilot species and the second wave have no built path, so they are not shown. A second project that welcomes another species (PET-INTEGRATION's [meeting a creature inside a game](PET-INTEGRATION.md#5-meeting-a-creature-inside-a-game-rw10-with-rw07-style-projects)) adds its row here when it is built; RW12 owns that.

**What each band sees:**

| Band | Goals page | Friends | Things |
| --- | --- | --- | --- |
| lap, toddler | none | yes | the bed only if it exists (it cannot be earned at these bands) |
| preschool, pre-K | the newcomer while the project is open | yes | the bed once adopted |
| school | the six colours (slice 2), and the newcomer only if this profile began the project at a younger band | yes | mixed colours (slice 2) |
| grown-up | none | yes | the bed or colours only if earned before the profile changed band |

**Supported completion counts the same.** The welcome project adopts whatever help it took (RW07), and a level-5 bucket finished by the ghost pour files its colour (the Paint Mixer definition). Replays cannot complete a goal twice: adoption is idempotent on its token and the journal files an entry once.

**No farming.** A goal names exactly one project or one recipe, so a round started from the path is guaranteed to be able to complete it. There is no quota, no count of rounds, no random drop and no schedule.

## The saved record

`SaveData` gains one field:

```text
book: { goal: string | null }   // the chosen goal's id, or null
```

**Repair on load** (`migrate()`, with tests beside the save tests): `goal` must be the id of a row in the goal table, else `null`. A known goal that is done or unreachable is kept as chosen: the book shows it done or leaves it out, and nothing is lost if the band changes back. Defaults: `{ goal: null }`. No count, date or progress field exists to repair.

**Reset** (Start over) clears the chosen goal, since it is play state like levels; creatures stay (RW05), so a friend goal that was done stays done. **Undo, backup, restore and profile copy** carry the field with the save; profiles are isolated because it lives inside each profile's `SaveData`. Done-states are derived, so a restored older save shows exactly what its creatures and journal show.

## The put-down test

The [Pok Pok review's P6](../reviews/POK-POK.md#p6-the-put-down-test-for-unlock-goals-a-line-for-rw10-docs), already an RW10 acceptance line, holds without new rules:

- Goal progress is shown only in the book, which she opens by choice from the library.
- The result screen is unchanged: no goal, no "almost", no rounds to go. Its Again and stopping choices stay as they are. A round launched from the book returns to the book after Home or Back (origin `{ book: true }`), exactly as a library round returns to the library.
- A goal's done-state is binary. The book never draws a bar, a count or a partly filled picture.
- **Guard test:** `src/app/scenes/GameScene.ts` and the result code it calls never import `src/content/goals.ts` (a source scan, as other layering tests do).

## Slice 1: the book and the discovery goal

Claimed by `codex/neo-ready-rw10-book` (Neo roadmap slices, 2026-11-22).

`BookScene`, `go.book()` in both route tables (the island's falls back to the treehouse, as `library` does), the library card, the goals table with `friend:welcome`, the Friends and Things pages, the star, `book.goal` with repair, the guard test.

- **Files:** `src/app/scenes/BookScene.ts` (new), `src/creatures/book-layout.ts` and its test (new), `src/content/goals.ts` and its test (new), `src/app/scenes/LibraryScene.ts`, `src/app/App.ts` (`Routes.book`, the `{ book: true }` origin), `src/app/routes.ts`, `src/rework.ts`, `src/progress/save.ts`, `src/progress/store.ts` (`chooseGoal(id | null)`, written immediately like `choose()`), their tests, `src/content/voice-script.ts`.
- **Silhouette:** the newcomer's prepared portrait drawn with a dark tint (a `ColorMatrixFilter`, as `recolor()` does), no new art.
- **Voice:** `library.book`, `book.pick` (the instruction the book repeats when the page is tapped, since it has no corner guide: "Here are your friends and what you can find next"), `book.meet` ("Get the house ready, and a new friend will come to stay!", after the species' `species.<id>` line), `book.chosen`, `book.things`. Navigation needs no reading. Their clips follow the voice-clip batches.
- **Tests:** goals: `friend:welcome` reachable exactly when `showsContinue`, done exactly when `welcomeFriend`, its name follows `newcomerFor`; save: unknown goal ids repair to null, reset clears, profiles do not share; layout: every target at least 100 units, cards 150, nothing under the corner buttons, paging at 24 friends in four views; the guard test.
- **Check tier: shell, save and navigation.** Typecheck, unit tests, build, `BROWSER_SUITE=home` extended with creature play → library → book (a pre-K profile with the project open: the goal card, its star, the path to the project page, Back to the book; a friend card twice to Friends with that friend previewed; one landscape and one upright screenshot), and the offline check because persistence and root navigation change. `world`, `couch` and `picnic` are not needed.

## Slice 2: the colour goal (after `paint-mixer 4`)

The [`paint-mixer 4` batch](../GAME-BATCHES.md#paint-mixer-4-palette-unlock) adds the six paint-shelf colours to the palette, to save repair's accepted colours, to the hatch colour step and to the grown-ups' select ([its definition](../definitions/paint-mixer-5-6.md#the-palette-unlock-decision-7-a-separate-later-batch)). This slice adds only what waited for RW10:

- **Six `colour:<c>` goal rows**, reachable at school, done from the journal.
- **A requested recipe.** Level 5 today picks each bucket's recipe from the seed, so a path that said "mix peach" could hand her coral. The book's origin carries the goal's recipe (`{ book: true; recipe: ShelfColour }`), and `makeRound(5, rng, recipe)` makes the first bucket that recipe; the second bucket stays seeded from the other triple. A rule test covers every recipe over 300 seeds. A round opened any other way is unchanged.
- **A launched level does not move hers.** `GameScene`'s adapt-off rule extends from the daily origin to a book origin with a start level, so a goal never changes her saved Paint Mixer level.
- **The Dress colour row.** Dress gains one row of colour swatches (the eight `PET_COLORS` plus the colours she has mixed, at least 100 units, paging rather than shrinking) that recolours the dressed individual through `store.recolor(id, color)`, written immediately and repaired as `look.color` already is. This is the recolour the `paint-mixer 4` batch left to RW10. A colour she has not mixed is not offered; one already given to a friend stays valid whatever happens to the journal.
- **Files:** `src/content/goals.ts`, `src/games/paint-mixer/logic.ts` and `index.ts` (the requested recipe), `src/app/scenes/GameScene.ts` (the adapt rule), `src/app/App.ts` (the origin's field), `src/app/scenes/DressScene.ts`, `src/creatures/dress-layout.ts`, `src/progress/store.ts`, their tests, voice lines for the colour goal and the row.
- **Check tier: shell, save and navigation, with the new-interaction play.** Typecheck, unit tests, build, `BROWSER_SUITE=home` filtered to a school profile: book → choose peach → Paint Mixer level 5 starts on peach → one wrong Check and the help to its finish → the result shows no goal → Back to the book with peach done → Things → Dress → recolour → reload keeps it; `fingerdemo` is not needed (the bot's action does not change); the offline check because persistence changes.

## Not in this packet

- A second creature-welcoming project, wild sightings in games and the second-wave six in `SPECIES`: [RW12](WORK-ITEMS.md#rw12-first-expansion-and-later-school-coverage) and [PET-INTEGRATION §5](PET-INTEGRATION.md#5-meeting-a-creature-inside-a-game-rw10-with-rw07-style-projects). Their portraits are prepared when a species joins `SPECIES` ([pilot note](GENERATED-CREATURE-PILOT.md)), not for the book.
- Forms and talents: [RW11](WORK-ITEMS.md#rw11-optional-forms-and-useful-talents).
- Round results that come home (hair, outfits, meals): [PET-INTEGRATION §4](PET-INTEGRATION.md#4-what-a-round-makes-comes-home-to-the-creature-rw06-rw07-rw10). When one becomes a permanent item it joins Things, not the goal table, unless a path to it is a named project or recipe.
- A book on the phone root, a currency, a shop, rarity, chance or a daily or weekly goal.

## Decisions (defaults the build uses)

Each has a lean; the build uses the leans, and a [playtest note](../OBSERVATIONS.md) can reopen any of them.

1. **Unreachable species are not shown.** Lean: hide them. A silhouette with no way to it is a goal she cannot act on; RW05 already kept silhouettes out of Friends for this reason.
2. **The entry is the library, not Home.** Lean: the library. Home gains no button, and a goal on Home would put progress in front of her whether or not she chose to look.
3. **Reset clears the chosen goal.** Lean: clear it, as levels are cleared; creatures and done-states are untouched.
4. **The colour goal waits for `paint-mixer 4`** rather than absorbing it. Lean: wait, as the 2026-11-17 record split the batch.

**Proof of this packet:** links and `git diff --check`. Nothing was built or run.
