# Continuation plan

Status: the original island plan below is implemented, including Robot Path. A second expansion adds Size Parade, Bug Builder, and Story Steps; a third adds Feelings Faces and Monster Munch; then the map became an age trail and a fourth expansion added Song Maker, Puzzle Pals, Weather Wardrobe, and Sink or Float, for twenty-one games. Sections 1–2 describe the original ten-region map, since replaced by the age trail in section 9. The games and supporting systems are described in [DESIGN.md](DESIGN.md); completed checks and device-specific limits are recorded in [VERIFICATION.md](VERIFICATION.md).

## 1. Groundwork

- [x] Add region data for all ten regions: map position, landmark drawing, region-view backdrop, and spoken name.
- [x] Add saved `pet { name, color, hatched }`, `world.opened`, and optional sticker placement. Supply defaults and repair behavior in `migrate()`, with tests for older and invalid saves.
- [x] Expose the customized pet's look through `GameContext` and support `{pet}` in spoken lines.
- [x] Add a pre-K level to Splish Splash so its region does not close when the child moves up a band.
- [x] Add a test enforcing that an available region stays available in later bands.

The ten regions are Bubble Beach, Music Mountain, Treehouse, Barnyard, Counting Cove, Cozy Village, Rainbow Meadow, Puzzle Peaks, Story Grove, and Tinker Lab. Story Grove fills the previously unspecified tenth region and hosts Letter Trails. Positions, generated landmarks, spoken titles, and backdrops live in `src/content/regions.ts`.

## 2. Island map

- [x] Replace the hub pages with an island map scene.
- [x] Tapping a landmark makes Pip hop there, then zooms into a region scene using the hub's existing flowers and game spots.
- [x] Put an island button at the top-left of region scenes. A game's home button returns to its region.
- [x] Cover regions with no games for the current band with clouds the child can poke.
- [x] On the first map visit after a band increases, reveal newly available regions with a cloud-parting party and a birthday for Pip.
- [x] Move the parent gate and sticker book button to the map.

## 3. Hatching and pet customization

- [x] Add an egg scene that cracks over four taps.
- [x] Offer eight large paint blobs for choosing the pet's color.
- [x] Offer three spoken name bubbles plus a plain HTML name field for grown-ups.
- [x] Show the egg on the start screen until it has hatched.
- [x] Add pet name and color settings to the grown-up zone.

## 4. Sticker book

- [x] Add five scene pages: meadow, beach, farm, under the sea, and space.
- [x] Add a tray of unplaced stickers.
- [x] Use `src/engine/drag.ts` to place stickers anywhere on a page; dropping one back onto the tray removes its placement, retaining the earned sticker.
- [x] Save positions as fractions of the page so placements survive resizing.

## 5. New games

All three main additions support preschool and pre-K, with level ladders that introduce new modes as well as larger challenges.

### Pattern Train

- [x] Progress through AB → AAB/ABB → ABC → animal patterns → a missing car → bell sound patterns → filling two cars.

### Memory Match

- [x] Grow from four to sixteen cards, then introduce number-to-dots matches, shapes with two attributes, and uppercase-to-lowercase letters.
- [x] Count an incorrect match as a miss only when the child had already seen the partner card.

### Letter Trails

- [x] Add stroke data for all 26 capital letters.
- [x] Have a firefly lead each stroke in order.
- [x] Turn a finished letter into a picture with a spoken association, such as “A is for apple.”
- [x] Add short words and then the child's name at the top levels.

### Required for each new game

- [x] Register its metadata and band ranges, with a grown-up description of every level.
- [x] Add a hub icon, reward sticker, and spoken instructions and feedback.
- [x] Run a scripted browser play-through including wrong answers, hints, and round completion.

### Stretch: Robot Path

- [x] Add Robot Path so Tinker Lab opens at pre-K. Its six modes progress from two straight steps through turns, a larger grid, rocks, and programs of up to eight steps.

## 6. Documentation and verification

- [x] Update the README game list and navigation instructions.
- [x] Update `AGENTS.md` for the new architecture and `docs/DESIGN.md` for implementation status.
- [x] Run `npm run typecheck`, `npm test`, and `npm run build`.
- [x] Run the production preview (`npm run build-and-preview`), load it online so the service worker can install, then verify reload and play while offline.
- [x] Record what was verified and any remaining limitations, including device-specific checks still needed on the iPad.

## 7. Second expansion: earlier exploration and new skills

- [x] Size Parade: eight levels from big/small comparisons to ordering three or five friends in either direction.
- [x] Bug Builder: seven levels from matching outlines to copying a model and reflecting six spots across a bug's wings.
- [x] Story Steps: seven levels using four picture stories, progressing through shown beginnings, whole sequences, missing middles, and unrelated distractors.
- [x] Support toddler through pre-K for all three; open Puzzle Peaks, Tinker Lab, and Story Grove earlier while retaining later-band access.
- [x] Add generated landmarks, reward stickers, spoken instructions and hints, parent level descriptions, co-play tips, and off-screen activities.
- [x] Page region menus so a growing catalog retains large, separate touch targets.
- [x] Test the puzzle rules and add scripted play-throughs for every level, wrong answers, hints, portrait layouts, saved rewards, reload persistence, and menu paging.

## 8. Third expansion: more to do at lap

- [x] Verify the second expansion: typecheck, unit tests, build, the full browser suite, and a tap-through of map → region → page arrows for every band. All fifteen games were reachable at their bands; nine wait under clouds at lap by design.
- [x] Show grown-ups which band opens each clouded game, keep a region's page when returning from a game, outline page dots, and keep region ground green.
- [x] Feelings Faces in Cozy Village: seven levels from free-play feeling bubbles to naming, helping, causes, and friends' feelings. Add `sad` and `calm` critter moods.
- [x] Monster Munch in Counting Cove: seven levels from tap-to-feed to counting along, one-to-one giving, exact orders with a bell, two-food orders, and fair sharing.
- [x] Unit tests for both games' rules and a `BROWSER_SUITE=third` play-through of every level with mistakes, hints, saved scores, lap regions, and reload persistence.

## 9. Age trail and fourth expansion

- [x] Make the map the age selection: four places (Puddle Lagoon, Daisy Meadow, Bumpy Hills, Starry Peak) on a switchback trail, all open; each lays out every game for its band at that band's levels. Retire subject regions, clouds and region pages; keep subject IDs for grouping.
- [x] Pass the place's band through `go.game(id, band)`; home returns to the place; start goes straight to her place; birthdays walk the pet up the trail.
- [x] Swipeable places with momentum, arrow paging, launch-on-lift with touch-down feedback, and remembered scroll.
- [x] Song Maker, Puzzle Pals, Weather Wardrobe and Sink or Float, each from lap to pre-K with unit-tested rules.
- [x] Browser suites updated for the trail (`world`, `expansion`, `third`) plus a new `fourth` suite; offline check rewritten for the trail.

## 10. Deeper ladders for the first games

- [x] Rainbow Fingers grows from 2 levels to 6: coloring pages with named colors (2, then 3 pictures), remembered colors ("paint the apple"), and mixing primaries in a bowl. Outlines stay above the paint; a picture fills in neatly once 70% is covered in the right color. Wrong colors are gentle misses, and the right pot glows after two, or after 12 quiet seconds. Bands: toddler 1–3, preschool 2–5, pre-K 3–6.
- [x] Splish Splash grows from 5 levels to 8: five shuffled parts (adds the nose), two parts at once in any order, and "first … then …" in order. Bands: preschool 3–7, pre-K 5–8.
- [x] Unit tests for both games' rules (`logic.ts`) and a `BROWSER_SUITE=early` play-through of every level with wrong answers, hints and saved scores.
- [ ] Rule tests and browser play-throughs for the other original games (Bubble Pop, Jelly Drums, Peekaboo Barn, Duck Pond, Shape Sorter, Color Garden).

## 11. Arcade-inspired games

Researched classic arcade and Flash games (Neopets, Kongregate, Miniclip, Club Penguin) and adapted the best fits to the toddler rules. The idea list and reasoning are in [ARCADE-IDEAS.md](ARCADE-IDEAS.md).

- [x] Duckling Parade (Meerca Chase) in the barnyard: eight levels from tap-to-walk to leading ducklings home, exact numbers, one color, and AB/ABC color patterns in the line. Walking past a wrong duckling is free; only stopping on one counts.
- [x] Scoop Shop (Papa's Freezeria, Ice Cream Machine) in the village: six levels from free stacking to color orders, pairs, counted scoops, ordered stacks and remembered orders (tap the customer to peek, which counts as a hint).
- [x] Roundup (Extreme Herder, Puffle Roundup) in the barnyard: six levels from tap-to-hop to shooing with a finger, sorting into two pens, and counting with a bell. Animals near their gate are drawn in, and one trots home by itself after 30 quiet seconds.
- [x] Bouncy Launch (Kass Basher, Toss the Turtle) in the tinker lab: five levels from tap-to-boing to pull-strength control, star and numbered clouds, and farther/nearer than last time. A hint shows the flight path and the right pull.
- [x] Unit tests for all four games' rules and a `BROWSER_SUITE=arcade` play-through of every level with mistakes, hints and saved scores. The offline check now pages Daisy Meadow to reach Monster Munch.
- [x] Widen the idea backlog to mobile, Atari 2600, arcade cabinets, Game Boy, Xbox Live Arcade, Nintendo DS/Wii, 90s computer edutainment and board games. [ARCADE-IDEAS.md](ARCADE-IDEAS.md) holds:
  - the inventory by subject, with thin spots;
  - a suggested next batch aimed at those spots (Word Monsters, Peg Garden, Fluffy Salon, Sound Garden, Little Helpers, Egg Catch, Mail Carrier, Photo Safari, Bounce Back, Dot Link) and strong alternates;
  - mechanic families, showing overlaps and shared code worth building;
  - the backlog by source.
- [ ] Deferred: reorganize places (16 games at lap, 25 at pre-K) once the inventory has grown. Paging by subject and showing fewer games at once are the options.

## Development direction after this expansion

These are future candidates, not claims of implemented features:

1. Validate on the actual iPad: speech availability offline, first-touch audio, small-hand dragging, orientation, installation, and Guided Access. Use observed friction to tune the existing games before adding complexity.
2. Add a gentle listening/language activity (music or stories): matching familiar sounds or spoken initial sounds to pictures, with freely replayable examples.
3. Add cooperative pretend play (everyday life), such as packing a picnic, with many acceptable choices and no rigid judgments about a child's routines. Weather Wardrobe now covers choosing clothes for the weather.
4. Extend creative play (art): reusable shape stamps and saved artwork pages, keeping local storage bounded and export under grown-up control.
5. More from the catalog: Sock Match and Tidy Up (everyday life), Shadow Match and Maze Walk (puzzles), Rhyme Time, Letter Fishing and Word Builder (stories and letters), Pizza Shop and Market Stall (numbers and money), and Tangram Town. The larger arcade, mobile and handheld backlog is in [ARCADE-IDEAS.md](ARCADE-IDEAS.md).
6. Pet treehouse room and pet things from stickers (the design catalog's Neopets thread).
7. Recorded parent voices slotting in by line id.
