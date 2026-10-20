# RW13: island revamp location packet

Definition for [RW13](WORK-ITEMS.md#rw13-island-revamp-ecosystems-as-locations), written 2026-10-20. Docs only: this packet changes no code, save or route. It proposes how the root experience (today the creature preview, `src/rework.ts`) grows into the whole revamped island: the eleven lands rethought as ecosystems and environments, each with a backdrop, a resident creature and its games, reached through the [RW03 navigation](HOME-NAVIGATION.md), so `classic/` can retire at RW08. Everything here is proposed behavior until a build slice delivers it.

## The recommendation in short

- **Keep the eleven land IDs; give each an ecosystem.** RW03 already keeps land identity, hosts and memberships for Explore Places, and saves, origins and tests key on `LandId`. So a location is a land with a new place, not a new catalog: no `LandId` is added, removed or renumbered. One land is renamed (Paint Pier becomes **Painted Canyon**); the other ten names already fit their new places.
- **Move five games, no more.** Each move puts a game where its own scene or subject already lives (an owl at night, a barn on the farm). Every game keeps its ID, levels, stickers and a reachable home.
- **Residents are the illustrated cast.** The nine species already have [home lands in the cast](art-requests/CAST.md#shape-families-and-homes); each becomes its location's resident in place of the code-drawn host. The pilot three are rigged; the second-wave six wait on RW02b step 3.
- **Backdrops are code-drawn first.** Each location slice draws its place with `Graphics` (an extended `BackdropStyle` with a few landmarks), which ships without waiting on anyone. Generated backdrops are requested below but stay blocked on the developer's [catalog-wide art decision](../WAITING-ON-DEVELOPER.md); when one is accepted it replaces that location's drawn backdrop with no other change.
- **Build order:** the catalog moves first (data only, no dependency), then one complete location (Rainbow Meadow, the sprout's home) in the new shell, then one location per session.

## Ecosystems are factual where they teach

The backdrops show real habitats with real plants and animals. The nine resident species are invented creatures and are labelled as such (they are "island creatures", never presented as real animals). The friends the games already use (duck, frog, owl, bear, cow…) are real animals in places they really live, or the location says why they are visiting. Where a real fact would be bent, this packet names it rather than drawing it.

A Codex branch is researching the `ecosystems` subject (`codex/ecosystems-subject-research`, unmerged); when it lands, each location slice checks its plants and animals against that study before drawing them.

## The eleven locations

| Land ID (kept) | Name | Ecosystem | What the backdrop shows (real) | Resident (invented) | Notes |
| --- | --- | --- | --- | --- | --- |
| `rainbow-meadow` | Rainbow Meadow | Wildflower meadow | Clover, daisies, poppies and tall grass; bees, butterflies, a rabbit at the edge; open sky | **Sprout** (rigged) | The starter's home and the first location built. The rainbow is weather, not a landmark |
| `counting-cove` | Counting Cove | Marsh where a river meets the sea | Reeds and cattails, lily pads in the fresh pond upstream, mudflat at the mouth; heron, ducks, frogs, dragonflies | **River** (rigged) | River otters really use marshes and estuaries; the frogs stay on the fresh side |
| `puzzle-peaks` | Puzzle Peaks | Mountain, from bamboo forest to snow | Bamboo and conifers on the lower slopes, a snowline, rocky peaks and high cloud | **Cloud glider** (rigged) | The Bamboo Hill kit (panda) belongs on the lower slopes, as pandas really live in mountain bamboo forest. Penguins do not live on mountains: Penguin Slide keeps its own sea-ice scene, and the backdrop draws no penguin |
| `bubble-beach` | Bubble Beach | Rocky shore with tide pools | Rock pools with sea stars, anemones, barnacles and kelp; hermit crabs; gulls; waves | **Tote** (step 3) | A coral reef is warm open water, not a tide pool: the reef stays inside Bubble Pop's own scene (the Tide Pools and Reef kit) |
| `music-mountain` | Music Mountain | Tropical cloud forest | Misty mountain forest, mossy trunks, tree ferns, orchids and bromeliads; hummingbirds, tree frogs | **Trill** (step 3) | A cloud forest is a rainforest on a mountain, so the name stays true; calls and birdsong suit the music games |
| `treehouse` | **Painted Canyon** (was Paint Pier) | Desert canyon with a spring | Layered red and orange rock, prickly pear and yucca, cottonwoods at a spring; a roadrunner, a lizard, a jackrabbit | **Dapple** (step 3) | The rock layers are the "paint"; a colour-changing climber fits. Desert kept to one real place (the American Southwest), so no camels or date palms |
| `cozy-village` | Cozy Village | Village with hedgerows | Cottages, a lane, a hawthorn-and-bramble hedge with blackberries; robins, a hedgehog | **Bramble** (step 3) | A town is a human-made environment; the hedge is the habitat |
| `story-grove` | Story Grove | Woodland garden at night | Moon and stars, fireflies, moths, evening primrose; an owl, a bat, a hedgehog | **Lumen** (step 3) | The Night Garden kit's home. Bedtime stories at night: Goodnight Room and Owl Walk live here |
| `tinker-lab` | Tinker Lab | A workshop in a cave mouth | Stalactites, a cave pool, glow-worm lights on the ceiling, bats roosting; the workshop's benches and tools | **Mossback** (step 3) | The cave is real (glow-worms are real cave insects); the workshop is labelled human-made. Light Lab reads well in the dark |
| `barnyard` | Barnyard | Farm | Barn, fence, pail and orchard trees (already given in [PR #460](https://github.com/rjdunlap/neo/pull/460)) | none: the farm friends | Keeps its identity, as decided 2026-10-16. Gains the orchard for Orchard Rows |
| `lantern-lake` | Lantern Lake | Lake at dusk | Unchanged | none | Grown-up puzzles only; shown to a child behind its signpost, as today |

A later twelfth location is possible (Savanna, the most expensive kit) but is not proposed: it would need a new `LandId`, a voice line and a layout check, and no game needs it yet.

## Every game's home

Five moves, each to the place its own scene or subject already belongs. Counts after the moves: 7 · 10 · 13 · 5 · 5 · 4 · 12 · 10 · 11 · 8 · 12 = 97, every game in exactly one land, and no land above the 13 that `landLayout` already fits at every band, so no target shrinks.

| Game | From | To | Why |
| --- | --- | --- | --- |
| `owl-walk` | Rainbow Meadow | Story Grove | Owls hunt at night; the night garden is its scene |
| `habitat-helpers` | Tinker Lab | Rainbow Meadow | Matching animals to homes belongs outdoors, and the meadow takes Owl Walk's place |
| `sink-float` | Tinker Lab | Bubble Beach | Floating things in water at the shore; Tinker Lab keeps eleven |
| `sing-along-barn` | Music Mountain | Barnyard | Its singers are the farm animals in a barn |
| `orchard-rows` | Counting Cove | Barnyard | An orchard is part of the farm, not the marsh |

| Location | Games, in order |
| --- | --- |
| Rainbow Meadow (7) | shape-sorter, color-garden, dot-link, tangram-town, garden-grow, treasure-map, habitat-helpers |
| Counting Cove (10) | duck-pond, monster-munch, little-helpers, pet-kitchen, frog-hop, picture-graph, lasso-loops, fill-dump, number-trails, fruit-sums |
| Puzzle Peaks (13) | marble-jump, pattern-train, memory-match, size-parade, puzzle-pals, quick-tricks, peekaround-island, penguin-slide, secret-code, garden-rows, ferry-jam, critter-crossing, mossy-path |
| Bubble Beach (5) | bubble-pop, peg-garden, bounce-back, bumper-garden, sink-float |
| Music Mountain (5) | jelly-drums, song-maker, sound-garden, rhythm-neighbors, beat-builder |
| Painted Canyon (4) | rainbow-fingers, fluffy-salon, stamp-studio, pixel-pictures |
| Cozy Village (12) | splish-splash, feelings-faces, weather-wardrobe, scoop-shop, mail-carrier, teddy-doctor, market-stall, clock-tower, day-by-day, stop-and-go, pet-says, lemonade-stand |
| Story Grove (10) | letter-trails, story-steps, word-monsters, photo-safari, goodnight-room, rhyme-time, opposites, clap-syllables, read-do, owl-walk |
| Tinker Lab (11) | log-roll, robot-path, bug-builder, bouncy-launch, seesaw-balance, light-lab, ramp-race, inchworm, block-tower, chain-reaction, shape-buddies |
| Barnyard (8) | peekaboo-barn, duckling-parade, roundup, egg-catch, animal-snack, critter-sort, sing-along-barn, orchard-rows |
| Lantern Lake (12) | snowball-merge, brain-break, pyramid-solitaire, number-nook, gem-swap, tile-pairs, lantern-lights, sudoku-garden, picture-logic, word-search, island-bridges, pond-conga |

**Games that fit by subject, not by place.** Monster Munch and Pet Kitchen are counting games with indoor or invented scenes; they stay at Counting Cove because that is where counting lives, and their own scenes do not change. Lemonade Stand, Clock Tower and Market Stall are town games and fit the village. No game fits nowhere.

**Games whose scenery or cast could change later (not part of RW13's build).** The habitat kits stay the [zoo study's](../deep-dives/subjects/zoo-animals.md#habitat-kits-order-lands-and-cast-swaps) proposals, now with a fixed home each: Night Garden dresses Story Grove (Photo Safari, Peekaboo Barn's night scene); Bamboo Hill dresses Puzzle Peaks' lower slopes; Tide Pools and Reef dresses Bubble Beach (Bubble Pop, Peekaboo Barn's beach scene); Rainforest Canopy's calls fit Music Mountain's cloud forest (Sound Garden); Desert Oasis becomes Painted Canyon's desert friends (a lizard, a jackrabbit); Savanna has no location yet. Each kit stays its own slice with the zoo study's rule: a cast swap keeps every pose and part the game uses. RW13 only gives each kit a place; it builds none.

## The location in the new shell

What a location is at the root, for the build slices to implement:

- **One screen.** The location's backdrop, its resident standing where the host stands, its games as spots and its signpost to the bigger kids' games, all from `landLayout` and `visibleIn`/`olderIn` as today. Nothing gates; targets stay at least 100 units; the bottom-left pet corner stays clear; navigation never needs reading (the resident says the location's line when she arrives and when tapped).
- **The resident.** Tapping it pokes it (its rig's reaction) and it speaks the location's line; it suggests a game the way the host does (`suggest` in `lands.ts`). It is not her companion and is not collected by being seen (collecting is RW05/RW10's job).
- **Routes reuse the land seam.** In the root entry, `go.land(id)` shows the location scene, and a game launched from it uses the existing land `origin`, so Home from a game returns to the location with no new origin variant. Until RW06/RW08 give the root a real home, the location's Home button returns to the root's entry scene after RW05 slice 1 (which deletes the creature preview).
- **Explore.** RW03's Explore Places lists these locations by the same IDs; RW08 wires it. RW13 adds no Explore page of its own.
- **Music.** Each land keeps its `music` style; a location slice may retune it to its place.

## Backdrops: what is generated and what stays code-drawn

| Thing | Pipeline | When |
| --- | --- | --- |
| Location backdrop | **Code-drawn** (`Graphics`, an extended `BackdropStyle` plus landmark shapes) in each location slice. **Generated** later, one image per location, if the developer's art decision adopts land backdrops | Drawn now; generated only after R23 is accepted on a device |
| Resident creature | Generated and rigged (the cast) | Pilot three now; second-wave six after RW02b step 3 |
| Game spots, signpost, buttons, hub icons, stickers | Code-drawn | Always (the art review's lean: small, numerous, seeded) |
| Each game's own scene | Unchanged | Kits are separate slices |
| Friends and hosts (duck, cow…) | Code-drawn | Until R22's decision |

**Art requests.** [R23](art-requests/QUEUE.md#r23-land-backdrops) is rewritten as the Rainbow Meadow location backdrop with this packet's ecosystem list (still the pilot, still blocked on the decision); a new [R26](art-requests/QUEUE.md#r26-location-backdrops) holds the other ten, one image each, blocked until R23 is judged on a device. Lantern Lake is included in R26 last, since a grown-up land gains least from it.

## Build slices, in order

Each slice is one session; each adds to the root and removes nothing from `classic/` until RW08.

1. **Catalog moves and the canyon's name** (catalog/data tier: typecheck, unit tests including the lands layout test at every band, build; `world` filtered to one land visit only if a test's expectation of membership breaks). The five moves in `LANDS`, Paint Pier renamed Painted Canyon in `lands.ts`, `world.ts` and the `subject.art` voice line, the README land counts and GAMES.md mentions. No dependency; `classic/` shows the new memberships and name at once.
2. **The first location: Rainbow Meadow** (shell/navigation tier: typecheck, units, build, one filtered root probe of arrive → tap the resident → launch a game → Home returns to the location, in both orientations, and the offline check because root navigation and assets change; after RW05 slice 1, which makes the illustrated sprout the species' renderer). A `LocationScene` at the root for `rainbow-meadow`: its code-drawn meadow backdrop, the illustrated Sprout as resident (poke and line), its seven games as spots with the signpost, `go.land` routed to it in the root entry, and an entry to it from the root's entry scene after RW05 slice 1. This slice sets the pattern the rest copy.
3. **Counting Cove** (location tier: typecheck, units, one filtered root probe of arrive → launch → return; build only if shared files change): the marsh backdrop and the illustrated River.
4. **Puzzle Peaks**: the mountain backdrop and the illustrated glider (whose touch circle and 380-unit span must clear the spots: check its layout at every band).
5. **Bubble Beach**, **Music Mountain**, **Painted Canyon**, **Cozy Village**, **Story Grove**, **Tinker Lab**: one session each, after RW02b step 3 prepares their residents (Tote, Trill, Dapple, Bramble, Lumen, Mossback). A location may ship with its code-drawn host if its resident is not ready, and swap later.
6. **Barnyard and Lantern Lake** together: code-drawn backdrops that reuse what they have; no resident species.

**What `classic/` keeps until cutover.** Everything: the map, lands, age places, stories, journal, treehouse and couch play. Slice 1 changes its land memberships and one name; slices 2–6 add root scenes only. RW08 retires the map-as-front-door, the age places and `classic/` itself once every location and Explore reach every game.

## Acceptance (from the work item)

- Every game keeps a reachable home (the table above, 97 of 97); no land exceeds the 13 that already fits; nothing gates by grade; the resident speaks, so nothing needs reading.
- Ecosystems are factual where they teach; the residents are labelled invented; the two bent facts (penguins, the reef) are kept inside their games' own scenes.
- Backdrops follow the [art bible](ART-BIBLE.md) rules where generated (flat ground, plum ink, cel shading, no text) and are code-drawn until the decision.
- `classic/` keeps everything until RW08; each slice says what it adds.

## Open for the developer

- The rename (Paint Pier → Painted Canyon) and the five moves are small, reversible data edits that slice 1 builds; the developer was notified when this packet merged and can stop or undo any of them.
- Whether land backdrops follow onto the generated pipeline remains the existing [decision](../WAITING-ON-DEVELOPER.md); nothing here decides it.
