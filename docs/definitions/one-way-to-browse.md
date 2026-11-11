# One way to browse (U6, definition)

**Built:** U6a (PR #1474) and U6b (PR #1475); nothing left to build here.

*Status: defined 2026-11-10; U6a built 2026-11-10 (PR #1474: For me first and default, the page count, the Arcade upright); U6b, the fold, built 2026-11-10 (PR #1475: Explore's entries are Places, Favorites, Arcade and Family play; Little surprises first among them at lap and toddler; the empty Favorites heart; Family play straight to couch). R1 deviated: four entries lay out in one row in landscape (two by two upright), as Favorites' pages of four already do, not two over two; five with the mix stay three over two. Couch play's Back from Family play opens Explore's entries. The voice lines `explore.others` and `explore.mine` are unused but kept, since the rendered clip manifest covers them; R8's topic-pictures row stays out. R4 deviated slightly: the upright area already fit four to six cards, so the spotlight was not shortened; the Topics sheet's 13 tiles fit with no paging by laying rows above the guide corner across the full width, and the arrows and count shift right when they sit as low as the guide corner.*

From the [adversarial UX review](../UX-REVIEW-2026-11-09.md#5-five-ways-to-browse-one-catalog-and-their-names-disagree), finding 5 and recommendation U6: Explore offers five ways into one catalog and their names disagree. The review asked to fold the All games card into the Arcade, add a "for my age" topic that opens first, show the page count, and say on an empty Favorites how the heart works. This page settles where that fold meets what All games does today.

**Where it shows.** Only on tablets and computers. On a phone the root is Today's six (`App.phoneOnly`), Explore and the Arcade are not reached, and the six's All games button is not drawn ([phone-portrait](phone-portrait.md)). So this is not phone work, and it sits after the phone and playtest lines in READY.

## What is there today (`origin/main` at `6f5cae0e`)

- **Explore** (`ExploreScene`, `src/content/explore.ts`) has five entries, three over two: Places, Favorites, All games, Arcade, Family play.
- **All games** pages four at a time with yellow arrows and one tap to start: her age and younger, land by land (`allGames`), then an Other ages signpost as the last card that turns the list to the bigger kids' games (`turnSign`). At lap and toddler, Little surprises' picnic blanket leads the first page (`MixHost`: a tap starts the mix, a grown-up's hold opens Make my mix). It is laid out upright except where the mix leads.
- **The Arcade** (`ArcadeScene`, `src/content/arcade.ts`, [ARCADE.md](../rework/ARCADE.md)) pages six at a time (1024 × 768, three by two), every game: hers and younger first, then the rest with a Bigger kids tag. A first tap spotlights a card and says its name; a second tap or the green Play starts it. The Topics pill opens tiles: All games, Played before, then ten subjects. The pill shows the chosen filter's name, so its header reads "All games". No page count. Still sideways-only (phone-portrait shell slice 3).
- **Routes to All games:** `placeAtRoot` (`src/app/origin.ts`: a `{ place }` origin, a game with no origin, and the mix's stops), Today's six's tiles button (`DailyScene`, tablets only), the empty-Favorites card, the signpost, and a game's `{ explore: 'all', page, others }` origin for the result's Back.

How many games a list holds, per band (175 games, registry and lands at `6f5cae0e`):

| Band | Hers (`ageOf` = `'hers'`) | Hers and younger (All games today) | Every game |
| --- | --- | --- | --- |
| lap | 57 | 57 | 175 |
| toddler | 86 | 86 | 175 |
| preschool | 118 | 118 | 175 |
| pre-K | 138 | 141 | 175 |
| school | 132 | 164 | 175 |
| grown-up | 19 | 175 | 175 |

A grown-up's All games is 44 pages of four, youngest first; their own games are 19, four pages of six.

## Requirements

### R1. The Arcade is the one place to browse games

- Explore's entries become **Places, Favorites, Arcade, Family play** (four), plus Little surprises at lap and toddler (R5). `'all'` leaves `EXPLORE_ENTRIES`; the layout lays out four (two over two) or five (three over two, as now).
- The Explore card keeps the Arcade's cabinet picture and the name **Arcade**. The four squares (`tilesIcon`), which [U2](../UX-REVIEW-2026-11-09.md#recommendations-in-priority-order) kept for All games, stay on the Arcade's **All games** tile and on Today's six's button, which now opens the Arcade on All games: one meaning, every game.
- Every former route lands somewhere valid, with no migration (the [development-save exception](../../AGENTS.md#project-direction)): Today's six's button → the Arcade on All games; the empty-Favorites card → the Arcade on For me; a `{ explore: 'all' }` origin and `go.explore('all', …)` → the Arcade on For me (the page is not carried over, since the lists differ); `placeAtRoot` → R5.
- The signpost goes: the Arcade's All games topic already lists the other ages after hers, tagged Bigger kids or Little ones. `exploreMemory.others` and the `others` argument go with it.

### R2. "For me" opens first

- A new filter **`'mine'`**, named **For me**: the games with `ageOf(mod, band) === 'hers'`, land by land in `LANDS` order (the same order `allGames` uses), no others. At grown-up it holds only the grown-up games; at school it leaves out the games only little ones play.
- It is the **first tile** of the Topics sheet and the **default filter**: on a first visit, after `forgetArcade()` (a different player), and when the remembered filter is no longer offered.
- **Its picture** is her own companion's face (her dressed companion as Home draws it, small and still), which no other control uses; the build confirms that against the meanings test (`src/app/nav-meaning.test.ts`) and picks another unused picture if it collides. Spoken by a new line, `arcade.mine`: "Games for you!".
- The Topics pill shows "For me" on arrival, so the header no longer repeats Explore's card name.
- **Topics stay unfiltered by age.** A subject tile shows that subject's games across every age, hers first, as now; For me is the way to see only hers. (A per-subject age filter is the ARCADE.md slice 4 proposal and stays there.)

### R3. The page count shows

- Under the grid, between the yellow arrows, a plain label **"2 of 6"** from `arcadePages`: not dots (30 pages will not fit as dots), not a tap target, in the muted grey over a cream pill so it reads on the backdrop. Hidden when the list has one page.
- A page turn still says `explore.page` ("Here are {n} more!"); no new speech.

### R4. The Arcade lays out upright

All games is upright-ready today and the Arcade is not, so folding one into the other would put the turn prompt back on narrow tablets. The U6 build therefore takes **the Arcade's part of phone-portrait shell slice 3**; at the U6 build's closeout that READY line drops the Arcade.

- `arcadeLayout` already stacks the spotlight above the grid when the view is tall, but on the 768 × 1024 area it fits only two cards (one row of two). Upright, the grid holds **at least four cards (two by two)**, with the spotlight shortened to fit; cards stay 150 units, Topics 240 by 100, Play and the arrows 120, and the page label clears the arrows and the guide corner.
- The Topics sheet (`topicsLayout`) fits its thirteen tiles on the upright area at 100 units or more, two sheets' worth paging if they cannot (never shrinking a tile).
- `ArcadeScene` sets `upright` and `uprightArea`. Layout tests at every `UPRIGHT_VIEWS` entry, as Explore's are.

### R5. Little surprises keeps its own tap

The Arcade's first tap spotlights; Little surprises' card starts on one tap and opens Make my mix on a grown-up's hold. Mixing the two in one grid would give one picture two tap rules, so the blanket does not join the Arcade.

- At lap and toddler, **Little surprises becomes an Explore entry**, the first card, with the picnic blanket picture and `MixHost`'s pointer handling unchanged (tap starts, hold opens Make my mix). Elsewhere it is not shown, as now.
- `placeAtRoot` → `go.explore()` (the entries page). There, at lap and toddler, the blanket stands first; elsewhere she sees the four entries. A mix's stops and its Explore come back to the entries page.
- The entries page at lap and toddler keeps the turn prompt (`upright = !this.lead`) exactly as All games' first page does today, until shell slice 3 lays out the mix's sheet and Make my mix's table upright; that part of shell slice 3 stays on its line.

### R6. Lap and toddler in the Arcade

The Arcade needs two taps and shows six cards a page, where All games started on one tap, four a page. [ARCADE.md](../rework/ARCADE.md#for-the-developer) decided the portal grid and attract mode from preschool up; lap and toddler already get a still spotlight. **Decided here: lap and toddler keep the two-tap Arcade.** A first tap says the game's name and shows it large, which a child who cannot read needs before a game starts, and a stray tap by a one-year-old opens nothing. The Play button and a second tap on the same card both start it. If watching her play shows the second tap is a wall, a one-tap Arcade at lap and toddler is a one-flag change (open decision below).

### R7. An empty Favorites shows how the heart works

Speech may be off (the review's condition), so the spoken `explore.no-favorites` is not enough.

- The empty page shows the result's **heart** (`heartIcon`, outlined, as it first appears beside the sticker) large above a short line, "Tap the heart after a game", and the Arcade card (cabinet, named Arcade) beside it, which opens the Arcade on For me. The heart is a picture, not a button: a tap on it says `explore.no-favorites` again.
- The spoken line stays as it is.

### R8. The rest of finding 5

| Finding | Decision |
| --- | --- |
| Family play opens a page holding one Family play card | **In.** The entry goes straight to couch play (`go.couch(false, { explore: 'family', page: 0 })`), saying `explore.family-pads` on the way. The build first checks that couch play's own menu, with no pad connected, shows how to start with a keyboard; if it does not, the one-card page stays and this row moves to open decisions |
| The Arcade's topics reuse the Places pictures under other names (Senses for Bubble Beach, Shapes for Rainbow Meadow) | **Out.** A subject is drawn by its home land's landmark on purpose ([ARCADE.md](../rework/ARCADE.md#design)); the two names name different things (a place, a subject). It belongs with a later picture pass like U2's, not with the fold |

## What the rule tests assert

In `src/content/arcade.test.ts` and `explore.test.ts`, over the real registry and lands:

- `arcadeList('mine', band, …)` is exactly the games with `ageOf` = `'hers'` at every band, in `LANDS` order; at grown-up it holds no game whose `ageOf` is `'little'`, and its length is 19 at `6f5cae0e` (asserted as "equals the hers set", not as a number).
- `arcadeList('all', …)` still holds every registry game exactly once, at every band.
- `arcadeFilters` starts with `'mine'`, then `'all'`, `'played'` and the subjects; the default filter is `'mine'` on a new memory and after `forgetArcade()`.
- The page label reads `${page + 1} of ${arcadePages(n, perPage)}` and is absent when there is one page.
- `EXPLORE_ENTRIES` has no `'all'`; at lap and toddler the entries page leads with Little surprises; every former `'all'` route (Today's six's button, empty Favorites, an `{ explore: 'all' }` origin, `placeAtRoot`) resolves to a valid scene (a routes test in `src/app/` or the scene tests).
- Layout tests (`arcade-layout.test.ts`): at every `UPRIGHT_VIEWS` entry the Arcade holds at least four cards of 150 units with no overlap, Topics, Play, the arrows and the page label clear of each other, the corners and the guide corner; the Topics sheet's tiles are at least 100 units; Explore's four- and five-entry layouts at both areas.
- The meanings test still passes with For me's picture (R2).

## Slices and check tier

1. **U6a, the Arcade first** (shell tier): R2, R3, R4. Files: `src/content/arcade.ts` and its test, `src/creatures/arcade-layout.ts` and its test, `src/app/scenes/ArcadeScene.ts`, `src/content/voice-script.ts`, and the For me picture (`src/ui/icons.ts` or the companion rig). Checks: typecheck, unit tests, build, `BROWSER_SUITE=home HOME_ONLY=arcade` (it covers the Arcade in both orientations) with one upright screenshot at 390 × 844 and one at 768 × 1024. `world` not needed: no route changes.
2. **U6b, the fold** (shell tier, after U6a): R1, R5, R6, R7, R8. Files: `src/content/explore.ts` and its test, `src/creatures/home-layout.ts` and its test, `src/app/scenes/ExploreScene.ts`, `src/app/origin.ts`, `src/app/scenes/DailyScene.ts` (the button's target only), `src/ui/origin-art.ts`, `src/content/voice-script.ts`, and the `home` suite's Explore steps in `scripts/browser/` (All games and its signpost are gone, empty Favorites changes). Checks: typecheck, unit tests, build, the `home` suite's main flow (Explore's entries, empty Favorites, Family play), `BROWSER_SUITE=discovery DISCOVERY_ONLY=mix` at toddler (Little surprises from its new entry and back), and `world`, since navigation changes. No offline check: persistence and assets do not change.

Each slice is one session. U6a can ship alone; it already fixes the header and the grown-up's 44 pages.

**Dependencies.** U6a takes the Arcade out of phone-portrait shell slice 3 (READY's line is edited at U6a's closeout). Both slices touch Explore or the Arcade, which the phone-upright and RW14 slices also change; the building session runs `scripts/overlap.sh` on those files first. `classic/` is untouched: it has its own map and no Arcade.

## Open decisions

For [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md) after U6b is played, none blocking:

- **One tap at lap and toddler.** Decided two taps (R6); a one-tap Arcade for the youngest bands is a flag if real play shows the second tap stops her.
- **Little surprises' place.** Proposed as an Explore entry at lap and toddler (R5). The alternative, a card in the Arcade with its own tap rule, was rejected for giving one grid two tap rules.
- **For me's picture.** Proposed: her companion's face (R2).
