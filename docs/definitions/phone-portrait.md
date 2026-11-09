# Phone held upright: portrait play, a few games at a time (chunk 31)

Requested by the developer on 2026-11-05: on a phone the app asks to be turned sideways, and the developer prefers to play upright. Enable both orientations, converting a few games at a time and tying each batch to [Today's six](todays-six.md) so the developer can play the new ones and give feedback. Chunk **31** of the [roadmap](../ROADMAP.md#chunks). Docs only; nothing here is built yet.

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

A game is **upright-ready** when, with the view at least 768 wide and much taller than wide (768 × 1100 to 768 × 1700), every target is at least 100 units, inside the view and clear of the pet and the corner buttons, and the play reads at a glance. Usually that means the row of choices becomes two rows or a column, and the scene centers in the guaranteed 768 × 1024 rectangle with scenery above and below, the way a wide desktop window shows scenery at the sides today. A game that already relays out from `view.w`/`view.h` with a portrait branch is mostly a narrower-width check; one with positions built on a 1024 width needs real layout work.

A game says it is ready with one field on its module, `upright: true` (`src/games/types.ts`). A registry test lists the games carrying it, the way the silenced-music test lists those games, so the converted set is always inspectable. A game without the field keeps the turn prompt on an upright phone, exactly as today; nothing becomes worse while the batches proceed.

## Slices

### Shell slice 1: the upright design area, Home, Today's six and the round chrome (built, with batch 1)

Built 2026-11-05: `computeView(..., upright)`, `Scene.uprightArea`, `GameModule.upright`, `dailySix(..., upright)`, `resultSpots` in `src/app/result-layout.ts`, both manifests `any`, batch 1's six games upright-ready (`src/games/upright-check.ts` is the shared layout check), and the `phonefit` upright root pass. Upright is not yet played on a real phone ([device check](../DEVICE-CHECKS.md)).

- **The area.** `computeView` takes the design area as an input: `UPRIGHT_W × UPRIGHT_H` (768 × 1024) when `needsTurn` is true **and** the scene is upright-ready, else 1024 × 768. `safeArea(view)` returns the rectangle of whichever area was used. A turn of the phone is an ordinary `resize`.
- **The seam.** `Scene.upright` already exists for HTML scenes; it becomes true for any scene that has a portrait layout (Pixi scenes included). `GameScene` is upright when its game module says `upright: true`, so the prompt shows over a not-yet-ready game and never over a ready one. `App.refreshTurn` already reads the scene's flag.
- **Shell scenes in this slice:** the root's Home, Today's six (`DailyScene`), and `GameScene`'s own chrome: the guide corner and pet, the how-to card (with `textBoost`), the intro's level arrows, Pause, the celebration and the sticker reveal. "Who's playing?" is already upright.
- **Manifests:** `orientation` becomes `any` in both manifests, so an installed app may turn.
- **Today's six, the link (R4 extension of [D10](todays-six.md)):** on an upright phone the six are drawn **from upright-ready games first**: the same seeded kind-first pick, run over the ready pool, then filled from the rest of the band's pool if fewer than six are ready. Cards for games that are not ready yet carry a small turn-the-phone badge, and opening one shows the prompt as today. The seed is still the day and band, so the phone's six can differ from the iPad's on the same day while batches are being converted; once every eligible game at a band is ready the two agree again. The pick stays a pure function in `src/content/daily.ts` with an `upright` input and tests.
- **Batch 1 in the same slice** (below), so the first upright six is all upright on the day it lands.
- **Files (expected):** `src/engine/view.ts` (+ test), `src/app/App.ts`, `src/app/Scene.ts`, `src/app/scenes/GameScene.ts`, `HomeScene.ts`, `DailyScene.ts`, `src/creatures/home-layout.ts`, `src/content/daily.ts` (+ test), `src/games/types.ts`, `src/games/registry.test.ts`, `vite.config.ts`, `public/classic/manifest.webmanifest`, `src/app/scenes/resident-check.ts` (a `phoneUpright: computeView(390, 844, …)` fixture beside `portrait` and `phone`), `scripts/browser-check.mjs` (upright cases), plus batch 1's games.
- **Check tier:** shell. Typecheck, unit tests, build; the layout tests at the new fixture for every touched scene; `phonefit` changed to expect no prompt over a ready game and the prompt over a not-ready one; one filtered upright browser pass at 390 × 844 with `hasTouch` (Home → Today's six → one card → a finished round → back on the six with a tick) and one screenshot of each touched screen; the offline check once because the manifest changes. `world` only if the island's route changes.

### The daily playtest slice: a phone is Today's six alone (built 2026-11-09)

The developer, 2026-11-09: the developer and their wife will playtest the six each day on their phones, and the rest of the experience is archived on a phone. Built in one PR:

- **A phone is the six.** `phoneSized` (`src/engine/view.ts`: a touch screen whose shorter side is under 600 CSS pixels, held either way) makes `App.phoneOnly` true at the root; the hub route then opens `DailyScene` instead of Home, the six page's Back goes to "Who's playing?", and its All games button is not drawn. Home, Explore, creature play and the island at `classic/` stay on tablets and computers; nothing is deleted. A round's house on a phone comes back to the six.
- **First run upright.** `HatchScene` sets `uprightArea` and lays out from `hatchLayout` (choices centered across the plate, the go button under them, the grown-up's name field below), and `App.refreshTurn` no longer shows the prompt before the first scene exists.
- **The six page upright.** A tall view uses the whole width (two columns, cards up to 300 units, a larger name and level line) and keeps a strip under the cards for the pet; a turn of the phone re-picks the six and redraws the turn badges.
- **Play all.** A green play button opens the first card not yet played today; a daily round's result shows the next unplayed card in the discovery rectangle (`nextOfSix` in `src/content/daily.ts`), so the set is one tap per game. With all six played the way out returns to the page and its flourish.
- **Playtest notes (grown-up profiles only).** A pencil on the six page and on a daily round's result opens a plain-HTML sheet (`src/ui/playtest-sheet.ts`): Good, Fine or Needs work plus a line of text per game and day, saved in the profile's own save (`SaveData.playtest`, bounded at 300 notes, repaired on load) and copied as text with Copy all notes for [OBSERVATIONS](../OBSERVATIONS.md).
- **Shortcut.** The root manifest has a Today's six shortcut (`./?daily`) for tablets, where Home is still the root.

Shell slice 2 below now matters only on tablets and computers that are narrow enough to be asked to turn (none today), so the game batches come first.

### Shell slice 2: the rest of the root (ready)

All games, Explore, Friends, Dress, the hatch, the journal and the sticker book on the root, each with a layout test at the upright fixture and one screenshot. The island at `classic/` (map, lands, places, stories) stays sideways-only: the cutover retires it, and the turn prompt stays there.

### Game batches: six games each (ready; batch 1 built)

Each batch is one session and one PR, picked so that Today's six at the developer's band has six **different kinds of challenge** ready, which is what the six already prefers. Per game: `upright: true`, a layout test at the upright fixture (targets ≥ 100 units, inside the view, pet and corners clear) for its first and top level, and one upright screenshot at 390 × 844. `fingerdemo` for a game only if its bot's targets moved in a way the layout test cannot show. The tier is the "existing-game bug fix on an unchanged interaction" one, six times over, with no new rules: rule tests are untouched.

| Batch | For | Games (kind) |
| --- | --- | --- |
| 1 (built in shell slice 1) | grown-up six | `word-search` (words), `sudoku-garden` (logic), `island-bridges` (space), `pond-conga` (hands), `brain-break` (noticing), `number-nook` (numbers) |
| 2 | grown-up: a second game per kind, and music | `hat-band` (music), `crossword` (words), `picture-logic` (logic), `tile-pairs` (noticing), `gem-swap` (space), `lantern-lights` (logic) |
| 3 | grown-up: the rest of the smaller boards | `block-garden`, `logic-grid`, `species-comeback`, `pyramid-solitaire` |
| 4 | grown-up: boards drawn for a 1024 width | `log-roll`, `marble-jump`, `snowball-merge` |
| 5 | lap and toddler six | `bubble-pop` (hands), `sing-along-barn` (music), `animal-snack` (words), `size-parade` (numbers), `far-lights` (noticing), `stamp-studio` (space) |
| 6 onward | one band at a time | six games of six different kinds at the band the developer is playing, chosen from those Today's six shows most; games with a portrait branch first (cheaper) |

The order of batches 2 to 5 was changed on 2026-11-09, when the phone became the grown-ups' daily playtest: the [roadmap's recommendations](../ROADMAP.md#upright-games-for-grown-ups-recommendations-2026-11-09) give the reasons and what follows the grown-up games (an upright sweep of the early-school games, then batches by kind).

Batch 1 is all games that list `grownup`, and between them cover six kinds, so a grown-up's upright six is complete on the first day. About 168 games means roughly 28 batches; the order after batch 4 follows the feedback, not this table.

## Feedback loop

After each batch lands, the developer plays the upright six on the phone. What they say goes into [OBSERVATIONS](../OBSERVATIONS.md) and decides the next batch: a game that plays badly upright returns to its batch's branch as a fix before the next batch starts, and a game the developer reaches for that is not ready yet moves up.

## Defaults (decided under the [standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules); say if any is wrong)

1. **Band for the first batches: grown-up**, since the developer plays on the phone; batch 3 serves the child's band. If the developer plays a child's profile on the phone, swap batches 1 and 3.
2. **iPad upright stays on the 1024 × 768 area.** Moving an iPad held upright to the 768 × 1024 area would make its targets a third larger (100 units at 1.0 scale), but it changes 82 checked layouts at once; it is a later option once most games are upright-ready.
3. **Not-ready cards stay in the six** with a badge, filling from the rest of the pool, rather than the six shrinking on an upright phone.
4. **No "play upright anyway" button.** A game is upright when its layout says so.

## Out of scope

Couch play (TV and controller, sideways by nature); the island at `classic/`; a third design area for small phones (an iPhone SE at 375 × 667 gets a scale of 0.49, close enough); any change to target sizes, rules or levels.
