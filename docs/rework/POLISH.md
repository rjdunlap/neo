# RW14: polish and navigation flow

Written 2026-10-23 from the developer's request, relayed by the session that started this one: make the game look and feel like a polished game, with more generated images integrated (the developer will make them in ChatGPT) and navigation that flows better. This packet is the [RW14 work item](WORK-ITEMS.md#rw14-polish-and-navigation-flow): what looks unfinished today, then ordered build slices. Each slice has what changes, the files, a done-when and its check tier (the names in [AGENTS.md's verification budget](../../AGENTS.md#verification-budget)). The images come through the [ChatGPT batch](art-requests/CHATGPT-BATCH.md) and the [import pipeline](art-requests/IMPORT.md).

Every slice keeps the standing rules: targets at least 100 logical units after scaling, touch-down feedback, nothing to read in order to navigate, the bottom-left guide and the corner buttons clear, and no gates, timers or streaks. Saves may reset during the rework.

## What looks unfinished (2026-10-23)

Seen on the dev server at 1024 × 768 and 768 × 1024, a new preschool player at the root and at `classic/`, commit `47e0615e`. These are screenshots from scripted Chromium, not iPad checks.

| Where | What it looks like now | Why it reads unfinished |
| --- | --- | --- |
| **First run** (`HatchScene`) | The illustrated R08 egg on a flat cream screen; the egg is small in portrait | It is a new player's first screen, and the barest one in the game |
| **Every scene change** (`App.show`) | Each route fades to flat cream and back (0.22 s + 0.3 s) | Every tap blinks through an empty screen; nothing says where she is going |
| **Home** (`HomeScene`) | The R06 illustrated backdrop with the illustrated sprout: the best screen | Its three exits are flat coloured circles; "Island games" is a text pill |
| **Explore and Places** | The home backdrop behind flat icon cards with text labels; Places is eleven small icon cards | A place is a picture of an icon, not a view of the place |
| **Locations** (11, `LocationScene`) | Code-drawn gradient hills, a smiling code-drawn sun, scenery shapes; a sparkle on every unplayed spot | Flat beside the illustrated creatures. For a new player every spot sparkles, so the mark means nothing. In Rainbow Meadow her own sprout appears twice, as the resident and as the guide |
| **Residents** | Three locations have an illustrated resident; six still show the land's code-drawn host | The second-wave six were prepared on 2026-10-20 ([PR #633](https://github.com/rjdunlap/neo/pull/633)) but ship only in the dev preview (`/?cast`) |
| **Games** | Code-drawn scenes (Duck Pond's pond, Pattern Train's empty cream lower half) beside the illustrated guide | The friends (the duck is in fifteen games) are flat `Graphics` |
| **Celebration and result** | Confetti and flat round buttons on flat cream | The proudest moment of the round has no place behind it |
| **Buttons** | Code-drawn circles in four sizes | The house means different things: in a round it returns to the place that opened the game; on Explore it means Home. A location has a back arrow and no house |
| **Taps to play** | Home → Explore → Places → a location → a spot → Play: five taps | A returning child walks the same path every time |

## Principles

1. **Use the art that already exists before asking for more.** The egg stages, the home backdrop, six prepared species and the R15 looks are in the repository; slices 1–2 need no new image.
2. **One look per screen.** An illustrated creature stands on an illustrated or softened ground. Code-drawn things that stay, such as game spots, hub icons and stickers (the [lean](../WAITING-ON-DEVELOPER.md#decisions-that-block-work)), are drawn on soft plates so they sit on a picture.
3. **Every button means one thing.** The house always goes to Home, her creature's home. The back arrow, with a small picture of the place, goes back to whatever opened the screen. Each has its own spoken label (the [RW03 route table](HOME-NAVIGATION.md#routes-and-meaning)).
4. **Moving between screens shows where she is going.** A screen grows out of the thing she tapped, and Back shrinks it home. Nothing blinks to an empty colour.
5. **A drop-in pipeline.** Once a slice has wired a kind of image (a location backdrop, a friend), a new image of that kind needs only `node scripts/art/import-inbox.mjs`, with no code change.

## Build slices, in order

Slices 1–3 need no new image. Slices 4 and 6 wait on images from [ChatGPT batch 1](art-requests/CHATGPT-BATCH.md#batch-1-generate-these-first), which the developer can make while slices 1–3 are being built. Slices touching the same file go one at a time, so the files are listed for overlap checks.

### Slice 0: the art inbox (built with this packet)

`scripts/art/import-inbox.mjs` and its rules in `inbox-core.mjs`: drop PNGs in `docs/rework/concepts/inbox/`, run the script, and each original is filed in `generated/` with a manifest row. A lone candidate is chosen, and the script prepares it: a backdrop becomes a WebP and its Places card, and a creature or friend set is cut with `prepare-sprite.mjs`. **Proof:** `inbox-core.test.mjs` (names, sizes, numbering, manifest rows, choosing), plus one smoke run on copies of existing originals, reverted afterwards. See [IMPORT.md](art-requests/IMPORT.md).

### Slice 1: the first run on the island

- **Changes:** `HatchScene` draws the home backdrop (`homeBackdrop()` and `backdropFit`, as Home does) behind its egg, colour and name steps, instead of flat cream. The egg sits on the grass at the companion's Home position and size, so hatching happens where her friend will live. The colour and name steps keep their controls on a soft plate. `classic/` gets the same treatment by loading the backdrop at boot, or keeps the plain sky fallback (`homeBackdrop()` already draws one).
- **Files:** `src/app/scenes/HatchScene.ts`, `src/creatures/home-layout.ts` (reuse; add a hatch position only if Home's stage does not fit), `src/main.ts` (only if `classic/` loads the backdrop).
- **Done when:** a new player's hatch shows the backdrop at 1024 × 768 and 768 × 1024; the egg is at least Home's companion height; the egg's tap area and the colour and name controls are still at least 100 units and keep touch-down feedback; the step order and the saved result are unchanged.
- **Check tier:** shell. Typecheck, unit tests, build, `BROWSER_SUITE=home` filtered to the first-run case, one portrait screenshot. Run `world` filtered to hatching only if `classic/` changes.

### Slice 2: residents in six locations, and her own friend at home

- **Changes:** the prepared second-wave six become the residents the [RW13 packet](ISLAND-REVAMP.md#the-eleven-locations) names: Tote at Bubble Beach, Trill at Music Mountain, Dapple at Painted Canyon, Bramble at Cozy Village, Lumen at Story Grove and Mossback at Tinker Lab. Each gets one `LOCATIONS` entry, a poke reaction and a spoken hello line. The cast textures ship in production. They are 12 MB as PNGs today, so prepare them as WebP or at a smaller shrink to keep the offline precache reasonable, and record the total. **Her friend at home:** when her companion is the resident's species (a sprout child in Rainbow Meadow), her companion stands in the resident's place, says it is home, and the corner guide hides in that location. This is the default; a developer may change it in the Waiting row "RW14 defaults".
- **Files:** `src/app/scenes/LocationScene.ts`, `src/art/creatures/cast.ts` (a production loader), `src/rework.ts` (load at boot), `src/content/voice-script.ts`, and the six locations' tests (`beach.test.ts`, `mountain.test.ts`, `canyon.test.ts`, `village.test.ts`, `grove.test.ts`, `lab.test.ts`), which gain the touch-circle clearance check `peaks.test.ts` already makes.
- **Done when:** each of the six shows its illustrated resident at every band and in four views; the resident's touch circle (at least 100 across) and idle motion clear every spot, the signpost, the guide corner and the heading; no location shows her species twice; `npm run build` reports the new precache total.
- **Check tier:** shell (assets and a shared scene). Typecheck, unit tests, build, one filtered root probe of arrive → poke the resident → launch → return for one of the six, in both orientations, and the offline check (new assets).

### Slice 3: one meaning per button

- **Changes:** at the root (`app.creatureWorld`), the house always calls `go.hub()`. The control that leaves to the place that opened the screen is a back arrow with that place's picture (`backToArt(originArt(origin))`, which the result screen already uses). That means the in-round hold button shows the back arrow whenever the round has an origin; a location shows a house beside its back arrow; and the how-to card's leave button follows the same rule. Press-down speaks the label ("Home" or "Back to Rainbow Meadow"). `classic/` keeps today's buttons.
- **Files:** `src/app/scenes/GameScene.ts`, `src/app/scenes/LandScene.ts` and `LocationScene.ts`, `src/ui/howto-card.ts`, `src/ui/origin-art.ts`, `src/content/voice-script.ts`; a new route test beside `src/app/origin.test.ts`.
- **Done when:** a unit test walks each root scene (Home, creature play, Explore and each of its pages, a location, a game's how-to card, the round, the result) and checks that a house calls `go.hub()` and a back arrow calls the screen's origin; the RW03 table and this test agree; all buttons stay at least 100 units and clear of the guide.
- **Check tier:** shell and navigation. Typecheck, unit tests, build, `BROWSER_SUITE=home` filtered to the location → game → result → back path.

### Slice 4: the illustrated Rainbow Meadow, and postcards in Places

- **Needs:** `land-meadow` (R23) from [batch 1](art-requests/CHATGPT-BATCH.md#batch-1-generate-these-first), imported.
- **Changes:** a location draws `src/art/locations/<land-id>.webp` when the file exists, through a small loader that uses `import.meta.glob`. A location without the file keeps its code-drawn scenery, which also remains `classic/`'s. With the picture, the code-drawn sun and scenery are off, and each spot sits on a soft cream plate, so a code-drawn icon reads on a painted ground. Places shows `<land-id>-card.webp` as the card picture where it exists, and the icon otherwise. **After this slice, a new backdrop needs only the import script.**
- **Files:** `src/art/locations/index.ts` (new), `src/app/scenes/LocationScene.ts`, `src/app/scenes/LandScene.ts` (a `backdropImage` option beside `backdrop`), `src/app/scenes/ExploreScene.ts` and its layout, `src/ui/landmark.ts` (the plate), and a test that every file in `src/art/locations/` names a real land.
- **Done when:** Rainbow Meadow shows the picture at every band, in both orientations and at four views; the picture's horizon sits behind the heading band and no landmark sits behind a spot (the R23 prompt asks for this, and the slice checks it at four views); the spots and the resident read against it; a location without a file is unchanged; Places shows the meadow's postcard; the WebP is under 1 MiB.
- **Check tier:** shell (a new asset kind). Typecheck, unit tests, build, `BROWSER_SUITE=home` filtered to the meadow in both orientations, the offline check, and one screenshot per orientation for the developer's device judgement ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

### Slice 5: celebration and result in place

- **Changes:** at the root, `GameScene`'s celebration and result draw the round's place behind a soft veil instead of flat cream: the origin location's picture or code-drawn backdrop, or the home backdrop when the round has no origin. The companion stands on its ground, the confetti stays, and the result buttons keep their sizes and positions.
- **Files:** `src/app/scenes/GameScene.ts` (the result and celebration layout), `src/ui/origin-art.ts` (expose the origin's backdrop), with slice 4's loader reused.
- **Done when:** the result screen shows its place at 1024 × 768 and 768 × 1024 for an origin with a picture, an origin without one and no origin; every result button keeps its formula, size and route; stories keep their own result.
- **Check tier:** shell. Typecheck, unit tests, build, one filtered regression play of one game launched from a location (Duck Pond), and `picnic` only if the story result path changed.

### Slice 6: the duck pilot

- **Needs:** `duck-base` and `duck-portrait` (R22) from batch 1, imported into `src/art/friends/`.
- **Changes:** Duck Pond's ducks use the prepared duck sprite, with a code-driven bob and squash and the same hit circles, instead of `src/art/critter.ts`'s drawing. The fourteen other duck games keep the drawing until the developer judges the pair (this slice and slice 4) on the iPad, as the [catalog-wide art row](../WAITING-ON-DEVELOPER.md#decisions-that-block-work) asks.
- **Files:** `src/art/friends/duck.ts` (new: a still sprite with a tween, not a mesh rig), `src/games/duck-pond/index.ts`.
- **Done when:** Duck Pond plays the same at its first and top level, the bot (`fingerdemo`) still finishes, the ducks' touch areas are unchanged, and a portrait screenshot is recorded for the device judgement.
- **Check tier:** existing-game change on an unchanged interaction. Typecheck, Duck Pond's rule tests, one filtered regression play, `fingerdemo` at the top level, and a build (a new asset).

### Slice 7: buttons and cards with a finish

- **Changes:** no images; this is code. `RoundButton`, `HoldButton` and the Explore and Places cards get one shared finish: a two-tone face with a soft upper-left highlight, a darker rim in the swatch's `line` colour, a short ground shadow, and a squash on press-down with a release spring. Home's three exits become picture buttons in that finish. The "Island games" text pill becomes a picture door, keeping its spoken label. Sizes, positions and hit areas do not change.
- **Files:** `src/ui/buttons.ts`, `src/app/scenes/HomeScene.ts`, `src/app/scenes/ExploreScene.ts`, `src/art/palette.ts` (only if a shared shadow tone is missing).
- **Done when:** every button and card in the root uses the finish; a unit test confirms each control's hit area is unchanged; press feedback starts on pointer-down.
- **Check tier:** shell. Typecheck, unit tests, build, `BROWSER_SUITE=home` unfiltered beyond its first two cases only if a hit-area test changed.

### Slice 8: the last place first

- **Changes:** Explore opens with a large postcard of the last location she visited ("Back to Counting Cove") before its four entries, so a returning child goes Home → Explore → her place → a spot → Play. The visit memory is per profile, cleared on a profile switch, and never a gate or a nag ([RW03](HOME-NAVIGATION.md#routes-and-meaning)).
- **Files:** `src/app/scenes/ExploreScene.ts` and its layout, `src/app/origin.ts` or a small per-profile field in `src/progress/save.ts` (bounded and repaired, with tests).
- **Done when:** the postcard appears only after a visit; it fits with the four entries at every view without shrinking a target (`exploreLayout`'s tests); a profile switch clears it.
- **Check tier:** shell and save. Typecheck, unit tests, build, `BROWSER_SUITE=home` filtered to Explore, and the offline check (a save field).

### Slice 9: moving between screens

- **Changes:** `App.show` gains an optional "from" point and picture. Opening a location from Places grows its postcard from the tapped card into the screen, and launching a game grows its spot. Back plays the reverse, about 0.35 s in all. A route without a point crossfades the old scene into the new one, with no flash of cream. Taps stay swallowed during the transition, as now.
- **Files:** `src/app/App.ts`, `src/app/Scene.ts` (an optional snapshot of the old scene), `src/app/scenes/ExploreScene.ts`, `LandScene.ts`.
- **Done when:** no route shows a bare colour between scenes; destroyed scenes' callbacks never run (the existing `Scene.test.ts` guarantees hold); transition time stays under 0.4 s.
- **Check tier:** shell and navigation. Typecheck, unit tests, build, `world` and `home` each filtered to one route, and the offline check only if assets changed.

### Slice 10: the other ten backdrops

- **Needs:** R26 from [batch 2](art-requests/CHATGPT-BATCH.md#batch-2-after-the-meadow-is-accepted), which waits until slice 4's meadow is accepted on the iPad.
- **Changes:** none in code. Import each image; slice 4's loader shows it.
- **Done when:** each location is checked at four views with the slice 4 rules (horizon, landmarks clear of spots, the plates), and the precache total is recorded.
- **Check tier:** one root probe per location in both orientations, then the offline check once at the end.

## Later, not sliced yet

- **Game scenes.** Illustrated surroundings for one game's own scene (Duck Pond's pond, behind the code-drawn water) after slice 6 is judged. It would be a queue row like R22, and the game's geometry stays code-drawn.
- **Home at dusk.** `home-dusk-2` exists; the [RW06 default](HOME.md#decisions-defaults-the-build-uses) is day only.
- **"New" marks.** Sparkles on unplayed spots could start only after her first round in a location, so that they mean "new since you were here". This is a proposal; it changes no gate.

## Not established

Screenshots in scripted Chromium are not iPad play. Whether the illustrated meadow and duck read better to her, whether spots read on painted ground on the device, and the transitions' feel are [device checks](../DEVICE-CHECKS.md) once slices 4–6 and 9 are built.
