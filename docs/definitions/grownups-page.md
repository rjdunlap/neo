# The grown-ups' page speaks of the root (U8, definition)

*Status: defined 2026-11-10; nothing built. Docs only.*

From the [adversarial UX review](../UX-REVIEW-2026-11-09.md#10-grown-ups-get-child-surfaces-and-stale-words), finding 10 and recommendation U8: the grown-ups' page still describes the island map, and its This week table lists every game for her age with a level picker on each, 57 rows at lap and 175 at grown-up. The review asked for three things: remove the map words, remove the development row, and fold This week's rows behind a search or "played this week". This page settles each, and keeps the classic island's page as it is.

**Where it shows.** The page is reached from the gear on "Who's playing?", on a phone too, so the first grown-up to open it is likely holding a phone upright at about 390 points wide, where a 175-row table is the worst of it. The same page also opens from Home's gear, from the pause sheet, and on `classic/` from the island map's gear.

## What is there today (`origin/main` at `6f9c3f17`)

All in `src/parent/panel.ts`, one `openParentPanel(onClose, onGone)` with no idea which app opened it. Callers: `HomeScene` (the root), `MapScene` (classic), `ChooserScene` and `App`'s pause sheet (both). The app knows: `app.creatureWorld` is true on the root (`src/rework.ts`).

Words that describe only the classic island, at the root:

- **Age and where they start** (around line 91): "It sets their home spot on the map … Every land stays open: a land shows the games for their age and younger … its signpost leads to games for bigger kids". The band buttons' small line is `ages · placeFor(band).name` ("Puddle Lagoon", "Starry Peak"), and `ageNote()` ends with the same place name.
- **Your island friend**: the heading.
- **Playing** (line 121): "Hold the picnic blanket on a little one's home spot to choose its games."
- **Finding games** (lines 123–128): the "Home spot layout" select, "Swiping path (original)" or "Subject cards (try on iPad)", and its note. It sets `settings.placeLayout`, which only `go.place` reads (`src/app/routes.ts`); the root's own screens never open a home spot.
- **This week** (`weekSummary`): "The Windy Picnic (a story on the island map)" with its steps, and a bigger-kids row "A game for bigger kids, from a signpost".

Words that later U slices made wrong in both apps:

- "Today's six, the six-tile button on Home": since U2 it is a day's page with a name pill.
- "Holding the ? in a game opens it again": since U3 (PR #1462) the question mark answers a tap.

The development row: "Meet everyone (development)" (line 107), under `import.meta.env.DEV`, so it never ships; the review saw it on a dev server. [DESIGN](../DESIGN.md) and [creature collection](../rework/CREATURE-COLLECTION.md) name it as the reseed path, which seeds the river and the glider (`store.meet(id, …, 'dev:<id>')`).

The table: `visibleGames(band, GAMES)`, every game for her age and younger, each with its current level and, for a touch game with more than one level, a "Stay on …" select (`data-pin`), then any bigger-kids game played this week. `lands-tour` (around line 180) opens the page and asserts `[data-pin="lantern-lights"]` and `[data-pin="pond-conga"]` each count 1 with no rounds played; `subject-places` drives `#p-layout` on classic.

## Requirements

### R1. The page knows which app opened it

`openParentPanel` takes a third argument, `{ app: 'root' | 'classic' }`, passed by each caller from `app.creatureWorld` (`HomeScene` always `root`, `MapScene` always `classic`, `ChooserScene` and the pause sheet from the flag). It defaults to `classic`, so a scripted check that imports the panel directly (as `lands-tour` does on classic) sees today's page. Classic keeps every word it has today except the two fixed in R3.

### R2. The root's page says nothing about the map

On the root:

- **Age and where they start**: the note becomes "With a birth month and year, their age picks the band by itself and moves them up as they grow. Choose a band below to start somewhere else instead: it sets which games Today's six and Explore offer first and the levels games start at. Every game stays open to every age. The birth month and year stay on this device, and are in the backup file." The band buttons' small line is the ages alone, and `ageNote()` ends with the band's label ("Starting where their age puts them: Pre-K."), not a place.
- **Your island friend** becomes **Their friend**.
- The picnic-blanket line is left out.
- **Finding games** is left out, select and note. `settings.placeLayout` stays in the save, untouched.
- **This week** leaves out the Windy Picnic line, and a bigger-kids game she played reads "A game for older players" rather than "from a signpost".

Where a sentence names Today's six, Explore or the Arcade, it uses the names their buttons now carry (U1's pills). The copy lives in one pure function per section (for example `ageCopy(app)`, `playingCopy(app)`) so it can be tested without a DOM.

### R3. Fix what U2 and U3 made wrong, in both apps

- "Today's six, the day's page on Home, is a different mix of games each day …" (classic has no Home, so on classic the sentence starts "Today's six is …").
- "A card with the goal and how to play, a demonstration for some games, and a big Play button. The ? in a game opens it again."

### R4. The development row leaves the page

The button and its handler go. The reseed stays: the same seeding becomes `kit.meetAll()` in the dev-only `kit` (`src/dev/testkit.ts`, absent from a production build), and DESIGN's creatures paragraph and [creature collection](../rework/CREATURE-COLLECTION.md)'s development-seed row name it instead of the button. No browser suite clicks the button today.

### R5. This week opens on what she played

- **First, without a tap**: a table of the games she played this week, plus any game with a pinned level (a pin must never vanish from view), each with its level, picker, rounds and minutes, most rounds first. With none of either: "Nothing played this week yet."
- **Then a closed "Every game for their age (57)"** (`<details>`, the count for her band) holding today's full table in today's order, with a search box at its top that filters rows by name as she types (case-insensitive, matching anywhere in the name; "No game called …" when nothing matches). The played and pinned games appear in both lists; a pin changed in either re-renders both.
- Every row stays in the DOM, folded or filtered rows only hidden, so every game stays pinnable before she plays it and `lands-tour`'s `data-pin` counts hold. A picker therefore appears twice for a played game; the `lands-tour` check counts unplayed games, where it is once.
- The row selection is a pure function (`weekRows(band, stats, since)` returning the played-or-pinned list and the full list) in `src/parent/`, beside `recap.ts`.
- The stickers line, the Welcome a New Friend recap and the off-screen ideas stay below the tables, as now.

## What the tests assert

- A new `src/parent/copy.test.ts`: the root's copy for every section contains none of "map", "home spot", "picnic", "signpost", "Swiping", "development", "island" (except as a name the game itself carries) or any `placeFor(band).name`; the classic copy still contains "home spot" and the layout note; both apps' Playing copy says the ? opens with a tap and calls Today's six a day's page.
- `weekRows`: a played game and a pinned unplayed game are in the first list and in the full list; an unpinned unplayed game only in the full list; the first list is ordered by rounds this week; a bigger-kids game played this week is in both, and one not played is in neither; an empty week gives an empty first list.
- The search filter, if it is a pure function (`matchesSearch(name, query)`): trims, ignores case, matches mid-word ("lake" finds "Lantern Lake …").

## Slices and check tier

1. **U8a, the root's grown-ups' page** (shell tier: the panel is shared and reached from the chooser): R1 to R5. Files: `src/parent/panel.ts`, a new `src/parent/copy.ts` and `src/parent/week.ts` with their tests, the four callers (`HomeScene`, `MapScene`, `ChooserScene`, `App`), `src/dev/testkit.ts` (`kit.meetAll`), `src/style.css` for the search box, `DESIGN.md` and `rework/CREATURE-COLLECTION.md` for the reseed. Checks: typecheck, unit tests, build, `BROWSER_SUITE=grownups` (the page from the chooser's gear, with an added step: open Every game, search a name, pin it, see it in the first table), `BROWSER_SUITE=lands` (its lands-tour pin step) only if the table's markup changed it, and one upright screenshot of the root's page at 390 × 844. No `world`: no route changes. No offline check: persistence and assets do not change.

One session; nothing else is needed for it.

**Dependencies.** None. U6b (the fold) and U7a touch `ChooserScene` and `HomeScene` but not their gear handlers; the build session runs `scripts/overlap.sh` on the four callers first. `classic/` keeps its page.

## Left out

The rest of finding 10 is not this page's: a grown-up colouring and naming a friend before playing (the add-player flow), the classic door on Home with no label, and couch play's four names (U6b sends Family play straight to couch). Each goes to its own line if real play shows it matters.

## Open decisions

None blocking. Decided here: the page follows the app that opened it rather than having one wording for both, because classic still has the map, the home spots and the picnic; and the development seed moves to the console rather than a hidden toggle, so a grown-up never sees it.
