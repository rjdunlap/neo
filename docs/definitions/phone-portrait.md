# Phone held upright: portrait play, a few games at a time (chunk 31)

Requested by the developer on 2026-11-05: on a phone the app asks to be turned sideways, and the developer prefers to play upright. Enable both orientations, converting a few games at a time and tying each batch to [Today's six](todays-six.md) so the developer can play the new ones and give feedback. Chunk **31** of the [roadmap](../ROADMAP.md#chunks). The build status of each slice is recorded below.

## Why the phone asks to turn today

Every scene is laid out on a 1024 × 768 design area that always fits; whichever side has spare room grows (`computeView`, `src/engine/view.ts`). On an upright phone (390 × 844 CSS pixels) a 1024-unit width gives a scale of about 0.38, so a 100-unit target is about 38 pixels and grown-up text is unreadable. That is why the phone support pass of 2026-10-09 ([verification](../archive/VERIFICATION-2026-10-07-13.md#phone-support-safe-areas-the-turn-prompt-and-a-phone-size-pass-2026-10-09)) added `needsTurn` (a touch screen taller than 1.6 times its width) and the `TurnPrompt`. Only plain-HTML scenes that set `Scene.upright` ("Who's playing?", couch play) skip it. Both web manifests (`vite.config.ts` and `public/classic/manifest.webmanifest`) also ask for `orientation: 'landscape'`, which locks an installed app on Android.

Taking the prompt away alone would break the 100-unit rule. The plan instead gives an upright phone **its own design area, the same one turned on its side: 768 × 1024**.

| Screen | Design area | Scale | A 100-unit target | View in units |
| --- | --- | --- | --- | --- |
| Phone sideways, 844 × 390 (today) | 1024 × 768 | 0.51 | about 51 px | 1660 × 768 |
| Phone upright, 390 × 844 (today) | 1024 × 768 | 0.38 | about 38 px (so the prompt) | 1024 × 2216 |
| **Phone upright, 390 × 844 (proposed)** | **768 × 1024** | **0.51** | **about 51 px** | **768 × 1660** |
| iPad upright, 768 × 1024 (unchanged) | 1024 × 768 | 0.75 | 75 px | 1024 × 1365 |

Upright targets come out exactly as large as sideways ones already are, so the rule "more games must not mean smaller targets" holds. iPads and desktop windows keep the 1024 × 768 area: the 82 games with an iPad-portrait branch were checked at 1024 × 1365, and none of that changes.

## What a game has to do

A game is **upright-ready** when, with the view at least 768 wide and much taller than wide (768 × 1100 to 768 × 1700), every target is at least 100 units (64 for grown-up play), inside the view and clear of the pet and the corner buttons, and the play reads at a glance. Usually that means the row of choices becomes two rows or a column, and the scene centers in the guaranteed 768 × 1024 rectangle with scenery above and below, the way a wide desktop window shows scenery at the sides today. A game that already relays out from `view.w`/`view.h` with a portrait branch is mostly a narrower-width check; one with positions built on a 1024 width needs real layout work.

A game says it is ready with one field on its module, `upright: true` (`src/games/types.ts`). A registry test lists the games carrying it, the way the silenced-music test lists those games, so the converted set is always inspectable. A game without the field keeps the turn prompt on an upright phone, exactly as today; nothing becomes worse while the batches proceed.

## Slices

### Shell slice 1: the upright design area, Home, Today's six and the round chrome (built, with batch 1)

Built 2026-11-05: `computeView(..., upright)`, `Scene.uprightArea`, `GameModule.upright`, `dailySix(..., upright)`, `resultSpots` in `src/app/result-layout.ts`, both manifests `any`, batch 1's six games upright-ready (`src/games/upright-check.ts` is the shared layout check), and the `phonefit` upright root pass. Upright is not yet played on a real phone ([device check](../DEVICE-CHECKS.md)).

- **The area.** `computeView` takes the design area as an input: `UPRIGHT_W × UPRIGHT_H` (768 × 1024) when `needsTurn` is true **and** the scene is upright-ready, else 1024 × 768. `safeArea(view)` returns the rectangle of whichever area was used. A turn of the phone is an ordinary `resize`.
- **The seam.** `Scene.upright` already exists for HTML scenes; it becomes true for any scene that has a portrait layout (Pixi scenes included). `GameScene` is upright when its game module says `upright: true`, so the prompt shows over a not-yet-ready game and never over a ready one. `App.refreshTurn` already reads the scene's flag.
- **Shell scenes in this slice:** the root's Home, Today's six (`DailyScene`), and `GameScene`'s own chrome: the guide corner and pet, the how-to card (with `textBoost`), the intro's level arrows, Pause, the celebration and the sticker reveal. "Who's playing?" is already upright.
- **Manifests:** `orientation` becomes `any` in both manifests, so an installed app may turn.
- **Today's six, the link (R4 extension of [D10](todays-six.md)):** the [weekly phone deal](todays-six.md#the-weekly-phone-deal) prefers upright-ready games in both orientations. A card that needs the phone turned carries a turn badge in portrait and opening it shows the prompt. The pure pick lives in `src/content/daily.ts` with its tests.
- **Batch 1 in the same slice** (below), so the first upright six is all upright on the day it lands.
- **Files (expected):** `src/engine/view.ts` (+ test), `src/app/App.ts`, `src/app/Scene.ts`, `src/app/scenes/GameScene.ts`, `HomeScene.ts`, `DailyScene.ts`, `src/creatures/home-layout.ts`, `src/content/daily.ts` (+ test), `src/games/types.ts`, `src/games/registry.test.ts`, `vite.config.ts`, `public/classic/manifest.webmanifest`, `src/app/scenes/resident-check.ts` (a `phoneUpright: computeView(390, 844, …)` fixture beside `portrait` and `phone`), `scripts/browser-check.mjs` (upright cases), plus batch 1's games.
- **Check tier:** shell. Typecheck, unit tests, build; the layout tests at the new fixture for every touched scene; `phonefit` changed to expect no prompt over a ready game and the prompt over a not-ready one; one filtered upright browser pass at 390 × 844 with `hasTouch` (Home → Today's six → one card → a finished round → back on the six with a tick) and one screenshot of each touched screen; the offline check once because the manifest changes. `world` only if the island's route changes.

### The daily playtest slice: a phone is Today's six alone (built 2026-11-09)

The developer, 2026-11-09: the developer and their wife will playtest the six each day on their phones, and the rest of the experience is archived on a phone. Built in one PR:

- **A phone is the six.** `phoneSized` (`src/engine/view.ts`: a touch screen whose shorter side is under 600 CSS pixels, held either way) makes `App.phoneOnly` true at the root; the hub route then opens `DailyScene` instead of Home, the six page's Back goes to "Who's playing?", and its All games button is not drawn. Home, Explore, creature play and the island at `classic/` stay on tablets and computers; nothing is deleted. A daily round's result on a phone has one way out, Back to the six, and no house (phone polish, 2026-11-11).
- **First run upright.** `HatchScene` sets `uprightArea` and lays out from `hatchLayout` (choices centered across the plate, the go button under them, the grown-up's name field below), and `App.refreshTurn` no longer shows the prompt before the first scene exists.
- **The six page upright.** A tall view uses the whole width (two columns, cards up to 300 units, a larger name and level line) and keeps a strip under the cards for the pet; a turn redraws the turn badges and keeps the same cards.
- **Play all.** A green play button opens the first card not yet played today; a daily round's result shows the next unplayed card in the discovery rectangle (`nextOfSix` in `src/content/daily.ts`), so the set is one tap per game. With all six played the way out returns to the page and its flourish.
- **Playtest notes (grown-up profiles only).** A pencil on the six page and on a daily round's result opens a plain-HTML sheet (`src/ui/playtest-sheet.ts`): Good, Fine or Needs work plus a line of text per game and day, saved in the profile's own save (`SaveData.playtest`, bounded at 300 notes, repaired on load) and copied as text with Copy all notes for [OBSERVATIONS](../OBSERVATIONS.md).
- **Shortcut.** The root manifest has a Today's six shortcut (`./?daily`) for tablets, where Home is still the root.

Shell slices 2 (built) and 3 now matter only on tablets and computers that are narrow enough to be asked to turn (none today), so the game batches come first.

### Phone polish: the way in, the six's level lines and the result (built 2026-11-11)

**Built:** 2026-11-11 (PR #1496), from a walk of the phone's four screens at 390 × 844, 844 × 390, 360 × 640 and 320 × 568 in Chrome.

- **"Who's playing?"** (`src/chooser.css`, two media queries; `--u` is 1 on a phone). Upright: the title is one line below the sun and the gear, one large card (two across from two players, `chooser__cards--many`), and Add a player is a row under the cards so it stays on the screen; spare height goes one part above and two below. Sideways: a short heading and cards about 220 px tall, so a whole card and its Couch play show; `ChooserScene.resize` stands a smaller sun beside the heading.
- **The six's level lines.** A grown-up card's level line keeps its full size and is cut at a clause, then at a word with an ellipsis (`levelLine` in `src/content/daily.ts`, tested over every touch game's every level), to two lines on a wide view and three on a tall one; names and lines wrap inside the cell, so neighbouring plates stay apart. The whole description is still on the how-to card and the grown-ups' page.
- **A daily round's result.** `dailySpots` (`src/app/result-layout.ts`) puts the next game's tile between Again and Back on a tall view, where a thumb is, with the note pencil in the top-left corner; a wide view is unchanged. On a phone the house is not drawn for a daily round: it went to the same six as Back.

### Shell slice 2: the rest of the root (built 2026-11-10)

Built 2026-11-10: `ExploreScene` (its five entries, All games, Places), `FriendsScene`, `DressScene`, `JournalScene` and `StickerBookScene` set `upright`/`uprightArea` and lay out on the 768 × 1024 area. Places (`exploreLayout`, `src/creatures/home-layout.ts`) goes three to a row there; `journalLayout` (four rows of two; on the wide area the column gap narrowed 24 to 16 so the 100-unit page arrows stay in the view) and `stickerBookLayout` (four on the tray; arrows 100 units) are pure functions with tests in `src/app/scenes/upright-root.test.ts`; `UPRIGHT_VIEWS` from `src/games/upright-check.ts` joined the Friends, Dress, Home and Explore layout tests. Home's companion now stands right of the guide corner at 768 wide. All games at lap and toddler, where Little surprises leads, keeps the turn prompt (`upright = !this.lead`). One scripted pass at 390 × 844 shot each scene with no prompt and no page errors. The island at `classic/` stays sideways-only: the cutover retires it.

**Still sideways at the root:** nothing but games not yet upright-ready. Shell slice 3 below laid out the scenes slice 2 left, so All games at lap and toddler is upright too (`upright = !this.lead` is gone). The island at `classic/` (`LandScene`, the map) stays sideways-only.

### Shell slice 3: the rest of the root's scenes (built 2026-11-10)

**Built:** 2026-11-10 (PR #1480). `PlayScene` (creature play), `LibraryScene`, `ProjectScene` (Welcome a New Friend's project and ending pages), `LocationScene` (the root's locations) and `ExploreScene` at lap and toddler (Little surprises leading) set `upright`/`uprightArea` and lay out on the 768 × 1024 area. `playLayout` (`src/creatures/home-layout.ts`) stands her friend at mid-width 240 above the bottom on a view narrower than 1024 (above the guide corner); `projectLayout` centres the step cards, and so the ending's three names, on a narrow view; wide output is unchanged. `LandScene.resize` keeps the heading between the house/Back and the book, shrinking only when needed on a narrow view. Little surprises' sheet uses the new pure `sheetPlaces(count, view)` (`src/ui/mix.ts`): wide unchanged; upright wraps tiles two to a row (three over two for five), Skip under each tile, the block centred a little above the middle, tile sizes unchanged so a turn never resizes one. Make my mix's `tableLayout` (`src/ui/mix-table.ts`) now returns view-unit `slotXs`/`poolXs`/`prev`/`next`; a narrow tall form packs slots and pool 140 apart across 768 with the page arrows under the pool. `UPRIGHT_VIEWS` joined the land pages test, the location clearance sweep (`resident-check.ts`), the play/project/ending layout tests, the Make my mix table test and a new sheet test; `explore-fold.test.ts` now expects lap/toddler Explore upright. One scripted pass at 390 × 844 shot creature play, the library, a project page, Rainbow Meadow, toddler Explore, the mix table and the sheet, each upright with no prompt and no page errors; unit tests prove the welcome ending page. The Arcade was already upright (U6a, [one way to browse](one-way-to-browse.md)). Nothing at the root keeps the turn prompt now except games not yet upright-ready.

### Game batches

Each batch is one session and one PR, picked so that Today's six at the developer's band has six **different kinds of challenge** ready, which is what the six already prefers. Per game: `upright: true`, a layout test at the upright fixture (targets ≥ 100 units (64 for grown-up play), inside the view, pet and corners clear) for its first and top level, and one upright screenshot at 390 × 844. `fingerdemo` for a game only if its bot's targets moved in a way the layout test cannot show. The tier is the "existing-game bug fix on an unchanged interaction" one, six times over, with no new rules: rule tests are untouched.

| Batch | For | Games (kind) |
| --- | --- | --- |
| 1 (built in shell slice 1) | grown-up six | `word-search` (words), `sudoku-garden` (logic), `island-bridges` (space), `pond-conga` (hands), `brain-break` (noticing), `number-nook` (numbers) |
| 2 (built) | grown-up: a second game per kind, and music | `hat-band` (music), `crossword` (words), `picture-logic` (logic), `tile-pairs` (noticing), `gem-swap` (space), `lantern-lights` (logic) |
| 3 (built) | grown-up: the rest of the smaller boards | `block-garden`, `logic-grid`, `species-comeback`, `pyramid-solitaire` |
| 4 (built) | grown-up: boards drawn for a 1024 width | `log-roll`, `marble-jump`, `snowball-merge` |
| 5 (built) | lap and toddler six | `bubble-pop` (hands), `sing-along-barn` (music), `animal-snack` (words), `size-parade` (numbers), `far-lights` (noticing), `stamp-studio` (space) |
| Grown-up catch-up (built 2026-11-17) | grown-up: games that gained the grown-up band after batch 4 | `puddle-lens` (noticing); `ribbon-workshop` (fractions; all three scenes drawn into a world scaled to the 768-wide area) |
| 6 (built 2026-11-17, in part) | school: six early-school games the sweep measured as fits-as-is | whole: `drift-cards` (its Home and "?" column kept clear upright), `word-glue` (every level, four phone views in `upright-batch-6.test.ts`). Later, `beat-builder` became whole-game upright (levels 4 and 5, eight 100-unit steps, wrap into two bars of four in `layout.ts`; levels 1 and 2 share the four-step layout) and so did `orchard-rows` (2026-11-18: levels 1–3 get an upright `rowsLayout` in `layout.ts`, rows the full width and 104 units tall with the pads and turn button in a line under them; the four bottom controls of levels 4–6 and 8 close up through `controlRow` in `logic.ts`; `layout.test.ts`). `pixel-pictures` also became whole-game upright (2026-11-18): the reference sits above the grid, row clues have room at the left and paint fits below the grid (`upright-batch-6.test.ts`). Partial: `pattern-train` levels 8–16 (level 10’s tunnel arch was widened from 88 to 100 units, 2026-11-18). |
| 7 (built 2026-11-17) | school: six more early-school games the sweep measured as fits-as-is | whole, at every level of every band they list (`src/games/upright-batch-7.test.ts`, four phone views): `rhyme-time` (noticing: words; upright layout), `paint-mixer` (numbers; fits as it was), `who-am-i` (logic; levels 6 and 7's answer strip moved below Home and "?"), `puzzle-pals` (space; upright layout), `memory-match` (noticing; upright layout), `maker-lane` (noticing; fits as it was) |
| 8 (built 2026-11-18) | school: six more games the sweep measured as fits-as-is | whole, at every level of every band they list (`upright.test.ts` in each game's folder, four phone views plus a short 375 × 601 one): `adventure-walk` (words; level 4's map in two columns), `timeline-trail` (logic; a full line of four no longer returns a null layout), `lasso-loops` (numbers; upright `lassoLayout`), `spinner-fair` (numbers; larger bar faces), `feelings-faces` (noticing; upright `feelingLayout`), `keep-house` (space; levels 3–5 no longer return a null layout) |
| 9 (built 2026-11-18) | school: six more games the sweep measured as fits-as-is | whole, at every level of every band they list (`upright.test.ts` in each game's folder, four phone views plus a short 375 × 601 one): `lemonade-stand` (numbers; `standLayout` and `towerLayout`), `helper-house` (logic; levels 3–5 no longer return a null layout), `notice-board` (words; tests only), `swing-pals` (noticing; two-swing levels hang higher), `bug-builder` (space; `bugLayout` and `foldLayout`), `food-web-workshop` (logic; tests only) |
| 10 (built 2026-11-18, in part) | school: the next six from the sweep's fits-as-is list | whole, at every level of every band they list (`upright.test.ts` in each game's folder, four phone views plus a short 375 × 601 one): `garden-rows` (logic; bed and packet placing moved into a pure `gardenLayout`, packets in a line under the 5 by 5 bed), `shell-rows` (logic; the board sits in the middle of a tall screen instead of under Home), `not-always` (logic; tests only). Held back for batch 11, each needing its layout pulled out of the scene into a tested function: `clap-syllables`, `word-monsters`, `sprout-shuffle` |
| 11 onward | one band at a time | six games of six different kinds at the band the developer is playing, chosen from those Today's six shows most; games from the sweep's fits-as-is list first (cheapest), then small fixes |

The order of batches 2 to 5 was changed on 2026-11-09, when the phone became the grown-ups' daily playtest: the [roadmap's recommendations](../ROADMAP.md#upright-games-for-grown-ups-recommendations-2026-11-09) give the reasons and what follows the grown-up games (the upright sweep of the early-school games, built the same day and recorded [below](#the-upright-sweep-built-2026-11-09), then batches by kind).

Batch 1 gave grown-ups one upright game in each of six kinds. Feedback from the phone playtest can move a game up in the order.

Batch 2 brings the grown-up upright pool to 12 games across seven kinds. The [batch closeout](../archive/COMPLETED-2026-10-09.md#grown-up-upright-games-batch-2-chunk-31-2026-11-09) records the layouts and checks.

Batch 3 brings the grown-up upright pool to 16 games across the same seven kinds. The [batch closeout](../archive/COMPLETED-2026-10-09.md#grown-up-upright-games-batch-3-chunk-31-2026-11-09) records the layouts and checks.

Batch 4 brings the grown-up upright pool to 19 games, every game that lists the grown-up band. The [batch closeout](../archive/COMPLETED-2026-10-09.md#grown-up-upright-games-batch-4-chunk-31-2026-11-09) records the layouts and checks.

Batch 5 brings the upright-ready games to 25, adding the lap and toddler six (`far-lights`, left unjudged by the sweep, is now laid out). The [batch closeout](../archive/COMPLETED-2026-10-09.md#lap-and-toddler-upright-games-batch-5-chunk-31-2026-11-09) records the layouts and checks.

The grown-up catch-up brings the upright-ready games to 30 and the grown-up upright games to 22 of the 22 that list the grown-up band (every grown-up game is upright). Puddle Lens level 2's hand-lens table runs the whole width on a tall view, so a dropped glass rests centred on the thing it is let go on instead of being pulled off it. Ribbon Workshop's bench, Whole Switch and Ribbon Cases keep their sideways layout and draw it into a container scaled to the 768-wide area (`frame.ts`), with the tray clear of the guide.

Batch 8 brings the upright-ready games to 47. Two of its games drew nothing at some levels on a 768-wide view (`timeline-trail`'s full line of four, `keep-house` levels 3–5), which the sweep's "fits as is" had not shown, so a batch runs the sweep with `PHONE_BANDS=all` first and looks at an upright screenshot of every changed level. The layout tests live in each game's own folder.

Batch 9 brings the upright-ready games to 53. The sweep reads drawn bounds at one moment of one round, so it both called real overlaps "fits" (`swing-pals`' three hook targets 91–96 units apart on levels 4, 5, 6 and 8; `bug-builder` level 7's tray; `lemonade-stand` level 7's towers, 49 apart under 110-unit drag grips, which only appear on the last day; `helper-house`'s null layout on the captioned and short views) and flagged targets that were fine (`bug-builder` level 11's tap circles are 132 units): the per-game layout test over every level, moment and view is what finds them. Once a game is marked `upright: true` the sweep no longer lists it, so run the sweep before the flag and use `BROWSER_SUITE=uprightgames PHONE_BAND=<band> PHONE_LEVELS=…` after.

Batch 10 brings the upright-ready games to 56. Two more lessons. The sweep's "fits" passed `clap-syllables` levels 3, 5 and 6, whose screenshots show overlapping cards, clipped outer bins and an engine running off the right edge, so look at every screenshot on the contact sheet whatever its label. And do not edit source while the sweep runs on the same dev server: a Vite page reload ends the sweep with "neo is not defined". Three of the six games were held back because each lays out inside its scene (`clap-syllables`' private `layout()`, `word-monsters`' `layoutMonsters`, `slotAt` and `shelfSpot`, `sprout-shuffle`'s four scene files), so a pure layout function has to be pulled out and tested first.

Batch 6 brings the fully upright-ready games to 32 and puts four more on `uprightLevels`. The sweep now takes `PHONE_LEVELS=all` (every school level, screenshots named `<id>-<level>.jpg`) and lists the wrong boxes as `culprits` in `sweep.json`.

Batch 7 brought the fully upright-ready games to 38 (40 once `beat-builder` and `orchard-rows` were made whole-game upright), all six of its games upright at every level of every band they list. The sweep's "fits as is" is the top school level and sizes only, so before marking a game upright run it with `PHONE_BANDS=all` and write the layout test: that is what found the overlaps (rhyme-time's rows on the 768-wide area, puzzle-pals' pieces of 83–98 units and one piece over the guide and off the edge, who-am-i's strip reaching under Home). The sweep takes `PHONE_BANDS=all` (every level of every band a game lists, each launched at a band that plays it); `uprightgames` takes `PHONE_BAND=<band>` (default grownup) so younger bands' upright games can be played by real touches, and `PHONE_SECONDS` (default 90) sets how long a level may take (Orchard Rows levels 2 and 3 need about 140).

### Thumb sizes of the upright grown-up games (measured 2026-11-18)

Each of the 22 upright `grownup` games was measured from its own layout function at the grown-up band's levels on the 390 × 844 upright view: the design area is 768 units wide at scale 0.508, so 100 units are 50.8 CSS pixels and the band's 64-unit minimum is 32.5 pixels. The smallest fixed target is listed, meaning a thing she taps or a place she drops on. A board that slides is judged by its window, and the grown-up band rule already allows a board that cannot fit to zoom or scroll.

[`src/games/grownup-thumbs.test.ts`](../../src/games/grownup-thumbs.test.ts) guards the table (`thumbPx` in `src/games/upright-check.ts` turns units into pixels). A layout change that alters a number fails it, and it fails if an upright grown-up game is not measured. It also keeps an `UNDER` list of the games with a fixed target under 44 pixels, so a fix updates the list and this table together.

| Game | Smallest (px) | What it is | Note |
| --- | --- | --- | --- |
| `block-garden` | 36.6 | bed square, 72 units | The 8 × 8 beds of levels 7, 8 and 12, a drop place for a dragged piece rather than a tap. 6 × 6 beds are 100 units (50.8). The 768-wide area has room for about 90-unit squares. |
| `brain-break` | 50.8 | stone | |
| `crossword` | 44.7 | square and key, 88 units | |
| `gem-swap` | 44.7 | button, 88 units high | Gems are 49.8 at the largest tray. |
| `hat-band` | 50.8 | song card | |
| `island-bridges` | 32.5 | sea square, 64 units | The 11 × 11 sea (level 4). 9 × 9 seas are 74 units (37.6); 5 and 7 are 80 (40.6). Buttons are 72 to 76 units high (36.6 to 38.6). The sea does not slide, and 11 across cannot reach 44 on 768 units without sliding or zooming. |
| `lantern-lights` | 50.8 | button | Lanterns are 58.9 or more. |
| `log-roll` | 50.8 | direction button | Stones are not tapped. |
| `logic-grid` | 32.5 | case-file square, 64 units | Level 7 sits whole in its window and does not slide. Level 8's squares are also 32.5, but that board slides. |
| `marble-jump` | 39.6 | hole and button, 78 units | Does not slide. |
| `number-nook` | 43.7 | tile, 86 units | The four-column boards (levels 4, 6 and 7). Counted as about 44, so no fix is queued. |
| `picture-logic` | 44.7 | tool button | Squares are 44.7 on a board that slides. |
| `pond-conga` | 44.7 | Hint and Start over, 88 units high | The pond is one swipe surface, so only the buttons are targets. Fixed 2026-11-18 (was 76 units, 38.6). |
| `puddle-lens` | 55.9 | stop button | |
| `pyramid-solitaire` | 50.8 | card | Level 8's covered back-card strips (36.6) are not targets until the card stands whole. |
| `ribbon-workshop` | 49.8 | bow, scissors and Undo | |
| `snowball-merge` | 50.8 | arrow | |
| `sorting-machine` | 52.8 | machine button | |
| `species-comeback` | 32.5 | turtle card, 64 units | Level 4. Levels 2 and 3 are 80 units (40.6) and level 1 is 96 (48.8). Does not slide. |
| `sudoku-garden` | 42.7 | bed square, 84 units | The 9 × 9 bed, fixed 2026-11-18 (was 64 units, 32.5). 6 × 6 squares are 96 units (48.8), number buttons 100 (50.8, two rows at 9 × 9) and Marks, Erase, Hint, Start over and Fill marks 88 units high (44.7). Does not slide. 768 units across nine squares cannot reach 44 pixels (86 units) without sliding or zooming, and 1.3 pixels under does not warrant a sliding board, so it stays on the list. A short view (the 375 × 667 phone) shrinks the bed, never below 72 units in the tested views. |
| `word-search` | 35.0 | letter square, 69 units, on a grid that fits | Buttons are 72 units high (36.6). Larger grids slide at 64-unit squares (32.5), which the band rule allows. The square size is `touchSquare` in `src/games/word-search/layout.ts`. |

Fifteen games are at about 44 pixels or more (`pond-conga` and the Sudoku Garden buttons and 6 × 6 beds were fixed 2026-11-18). Seven have a fixed target under it: `block-garden`, `island-bridges`, `logic-grid` (level 7), `marble-jump`, `species-comeback`, `sudoku-garden` (the 9 × 9 bed, 42.7) and `word-search` (the squares of a grid that just fits, and the buttons). Two READY lines queue the rest: one for the boards that already have the room (bigger squares and buttons), one for the boards that need to slide or zoom, a game per session.

### The upright sweep (built 2026-11-09)

Before choosing early-school games to convert, every `school`-band game not yet `upright` was played at its top school level on a 390 × 844 touch phone with the development-only switch `?uprightall` (honoured only on the dev server through `import.meta.env.DEV`; not in the build; a game is upright in the build only when it says `upright: true` and has its layout test). The suite measures each game's interactive objects in units (≥ 100, inside the view, clear of Home, "?" and the guide) and sorts them. It is a survey, not a gate: it fails only if the turn prompt shows. Of 124 games: 57 fit, 37 need a small fix, 28 need a layout, 1 not judged, 1 not a phone game. Top school level only; lower levels may differ.

**Measured** means the suite's own numbers; **by eye** means judged from about 130 px thumbnails of the "look" group (whole-screen or one-board input, or 0–1 measurable targets), so piece sizes are unmeasured.

- **Fits as is (57).** Measured (41): `bubble-pop`, `puddle-lens`, `drift-cards`, `beat-builder`, `pixel-pictures`, `orchard-rows`, `adventure-walk`, `who-am-i`, `timeline-trail`, `lasso-loops`, `ribbon-workshop`, `paint-mixer`, `spinner-fair`, `feelings-faces`, `lemonade-stand`, `helper-house`, `keep-house`, `notice-board`, `maker-lane`, `swing-pals`, `food-web-workshop`, `sprout-shuffle`, `pattern-train`, `memory-match`, `size-parade`, `puzzle-pals`, `garden-rows`, `shell-rows`, `word-monsters`, `rhyme-time`, `clap-syllables`, `word-glue`, `not-always`, `bug-builder`, `ramp-race`, `sense-detective`, `bond-beads`, `sorting-machine`, `water-road`, `drops-journey`, `measuring-post`. By eye (16): `bounce-back`, `sink-float`, `puddle-gobble`, `sea-lift`, `gear-garden`, `duckling-parade`, `egg-catch`, `thought-bubbles`, `bouncy-launch`, `seesaw-balance`, `block-topple`, `vine-snip`, `quick-tricks`, `sand-table`, `treasure-map`, `letter-trails`.
- **Small fix (37).** Measured (31): `fruit-slice`, `lost-layers`, `jelly-drums`, `rhythm-neighbors`, `puppet-stage`, `movie-night`, `gadget-bench`, `look-it-up`, `pet-kitchen`, `picture-graph`, `scoop-shop`, `teddy-doctor`, `market-stall`, `clock-tower`, `day-by-day`, `swap-meet`, `relay-woods`, `tangram-town`, `lift-it`, `peekaround-island`, `penguin-slide`, `mossy-path`, `story-steps`, `photo-safari`, `trackway-tales`, `robot-path`, `block-tower`, `chain-reaction`, `cue-studio`, `welcome-ways`, `circuit-garden`. By eye (6): `pile-match` and `duck-pond` (clipped at the right edge); `jar-sort`, `bolt-boards`, `cut-along`, `inchworm` (board drawn small with room to spare).
- **Needs a layout (28).** Measured (23): `domino-run`, `song-maker`, `rainbow-fingers`, `stamp-studio`, `critter-sort`, `monster-munch`, `little-helpers`, `frog-hop`, `fruit-sums` (borderline: two runs said fits, two said needs a layout, as its fruit settle late), `mail-carrier`, `second-chance-shed`, `village-vote`, `caravan-days`, `habitat-helpers`, `secret-code`, `rule-machine`, `ferry-jam`, `critter-crossing`, `read-do`, `attic-finds`, `story-weaver`, `light-lab`, `shape-buddies`. By eye (2): `river-tablets` (play area off screen), `example-express` (tiny, overflowing the right edge). Did not open (3): `meadow-pens`, `rain-garden`, `forecast-detective`; their layout functions return null on the 768-wide upright area, so they crash with the switch on (not a shipped bug: they are not upright in a build).
- **Not judged (1):** `far-lights` (only its dark sky showed at that moment; it is also in batch 5). **Not a phone game (1):** `pond-typing` opens in couch play (keyboard).

Rerun: start the dev server and run `BROWSER_SUITE=uprightsweep` (about 8 minutes for all; `PHONE_ONLY=id,id` filters; `PHONE_LEVELS=all` takes every school level, `PHONE_BANDS=all` every level of every band a game lists). It writes per-game JPEGs, `sweep.json` and `contact-sheet.jpg`/`.html` to `test-results/browser/uprightsweep/upright-sweep/`. To look at one game by hand, open the dev server at `/?uprightall`. Rerun a game after fixing it, or the whole sweep after layout changes to the shared shell.

## Feedback loop

After each batch lands, the developer plays the upright six on the phone. What they say goes into [OBSERVATIONS](../OBSERVATIONS.md) and decides the next batch: a game that plays badly upright returns to its batch's branch as a fix before the next batch starts, and a game the developer reaches for that is not ready yet moves up.

## Defaults (decided under the [standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules); say if any is wrong)

1. **Band for the first batches: grown-up**, since the developer plays on the phone; batch 3 serves the child's band. If the developer plays a child's profile on the phone, swap batches 1 and 3.
2. **iPad upright stays on the 1024 × 768 area.** Moving an iPad held upright to the 768 × 1024 area would make its targets a third larger (100 units at 1.0 scale), but it changes 82 checked layouts at once; it is a later option once most games are upright-ready.
3. **Not-ready cards stay in the six** with a badge, filling from the rest of the pool, rather than the six shrinking on an upright phone.
4. **No "play upright anyway" button.** A game is upright when its layout says so.

## Out of scope

Couch play (TV and controller, sideways by nature); the island at `classic/`; a third design area for small phones (an iPhone SE at 375 × 667 gets a scale of 0.49, close enough); any change to target sizes, rules or levels.
