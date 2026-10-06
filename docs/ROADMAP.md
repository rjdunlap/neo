# Continuation plan

Status: the original island plan below is implemented, including Robot Path. A second expansion adds Size Parade, Bug Builder, and Story Steps, and a third adds Feelings Faces and Monster Munch for seventeen total games. The games and supporting systems are described in [DESIGN.md](DESIGN.md); completed checks and device-specific limits are recorded in [VERIFICATION.md](VERIFICATION.md).

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

## Development direction after this expansion

These are future candidates, not claims of implemented features:

1. Validate on the actual iPad: speech availability offline, first-touch audio, small-hand dragging, orientation, installation, and Guided Access. Use observed friction to tune the existing games before adding complexity.
2. Add a gentle listening/language activity in Music Mountain or Story Grove: matching familiar sounds or spoken initial sounds to pictures, with freely replayable examples.
3. Add cooperative pretend play in Cozy Village: packing a picnic or choosing clothes for illustrated weather (the catalog's Weather Wardrobe), with many acceptable choices and no rigid judgments about a child's routines.
4. Extend creative play in the Treehouse: reusable shape stamps and saved artwork pages, keeping local storage bounded and export under grown-up control.
5. More lap-first games for the regions that still have one at lap: Song Maker (Music Mountain) as a tap-to-light looping grid, and Puzzle Pals jigsaws growing from two pieces.
