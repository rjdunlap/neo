# RW08: Explore and default-home cutover, the build packet (definition)

[Work item / issue #492](WORK-ITEMS.md#rw08-explore-and-default-home-cutover) · [PR #743](https://github.com/rjdunlap/neo/pull/743) · 2026-10-21 · docs only, nothing built

## Summary

The root (`src/rework.ts`) already boots the chooser and then the person's Home. It has creature play, Friends and Dress, the Welcome project's first steps, and all eleven lands as locations behind a one-page Explore picker. The island game (`src/main.ts`) still runs at `classic/`, and some of what a child or grown-up can do is only there. RW08 moves those remaining responsibilities to the root, then retires `classic/`. It follows [RW03's routes](HOME-NAVIGATION.md#routes-and-meaning) and its [RW08 acceptance row](HOME-NAVIGATION.md#exact-downstream-acceptance). It is split into three slices:

1. **Explore's four entries:** Places, Favorites, All games and Family play, with a typed browse origin and the result's **Back to [origin]** label. These are root only, and `classic/` is unchanged.
2. **The library, the stories and the remaining home duties at the root:** the journal, the Windy and Woodland Picnics, Little surprises and Make my mix, the birthday, and the grown-ups' gear on Home.
3. **The cutover:** delete `classic/`, the map, the age places and their layout switch, the `{ place }` origin, the `?preview` entry, RW03's HTML wireframe and the page link to the island games. Repoint the browser harness at the root and reseed development saves. **This slice waits for the developer's go-ahead** ([decision](../archive/DECISIONS-2026-10-23.md#decisions)), because it removes the deployed `classic/` page.

Slices 1 and 2 do not depend on RW07's song step or ending. Home's Continue already exists, and RW08 changes no project behaviour.

## What the root reaches now (audit at `03e20c70`)

| Responsibility | Root today | Classic today | Slice |
| --- | --- | --- | --- |
| Person selection, couch by Enter/pad | Chooser (`go.start()`), the same scene | Same | Kept |
| Home, creature play, Friends, Dress | `HomeScene`, `PlayScene`, `FriendsScene`, `DressScene` | Treehouse `RoomScene` (furniture, sticker frame, journal magnifier) | Kept. Treehouse: see [default 4](#decisions-defaults-the-build-uses) |
| Lands | `LocationScene` for all eleven (RW13), reached from `ExploreScene`, one page of cards | `MapScene` → `LandScene` | 1 (Places) |
| Every game for her age and younger | Only through a location's spots, one land at a time | Age place (`PlaceScene` / `SubjectPlaceScene`) | 1 (All games) |
| Hearted favorites | Not reachable (hearts still save from results) | The age place's shelf (`shelfFor`, 5 slots of `FAVORITES_MAX` 12) | 1 (Favorites) |
| Couch play from the island | Chooser Enter only | Chooser Enter only (`go.couch` takes an `origin`, but no island caller passes one) | 1 (Family play) |
| Journal and kept creations | Creations show in creature play; the journal cannot be reached | `RoomScene`'s magnifier → `JournalScene` | 2 |
| Windy Picnic, Woodland Picnic | Not reachable | Map's picnic spot; Wonder Woods' (school place) path | 2 |
| Little surprises and Make my mix (D2b, D5a) | Not reachable | Lap/toddler age place's picnic-blanket spot | 2 |
| Birthday | Never thrown | `MapScene` (`world.band` behind `profile.band`) | 2 |
| Grown-ups' gear | Chooser only | Chooser and map | 2 |
| Sticker book | A location's book button | Map, lands and places | Kept |
| RW02b preview, RW03 wireframe | `?preview` (production too), `docs/rework/home-navigation.html` | — | 3 (removed) |
| The page link to the island games | `.classic-link`, top right on Home | — | 3 (removed) |

## Slice 1: Explore's four entries

**`ExploreScene` becomes four pictured entries** of 150 units each, in one row in landscape and two by two in portrait, with Back and Home at the top left as in creature play. Each entry speaks its name on touch-down. The voice lines are new: `explore.places`, `explore.favorites`, `explore.all` and `explore.family`, and `explore.pick` becomes the arrival line.

- **Places** opens today's picker of the eleven locations, unchanged except that its Back returns to Explore. The picker's layout (`exploreLayout`, rows of up to four) and its tests carry over.
- **Favorites** opens a paged shelf of her hearted games, of every age, newest first, from `store.data.favorites`. Each card shows the game's hub icon and says its spoken title. A game outside her band says so on touch-down (`explore.other-age`: "This one is for bigger kids" or "This one is for little ones"). It then plays at `playBand` as the age places do now. Nothing re-pins a level. With no favorites, the page shows one big All games card and speaks `explore.no-favorites`. It invents no recommendations.
- **All games** opens a paged index of every registration in `GAMES` that `visibleIn` shows for her band, in `LANDS` order (land by land, each land's own order). It opens on the first page with no filter. The last card on the last page is a signpost, **Other ages**, which turns the index to the games that `olderIn` and the younger bands add. It is spoken, and a grown-up can find it, but it never gates anything. The index is built from `GAMES` and `LANDS` at run time, never from a copied list. A unit test checks that every `GAMES` ID appears exactly once across the two index modes at every band.
- **Family play** shows one card. It names that a controller or keyboard is needed (picture and speech: `explore.family-pads`) and opens `go.couch(false, origin)` with the Explore origin, so leaving couch play returns to Explore and not to the chooser. Grown-up games stay in `GROWNUP_GAMES` and are reached only inside couch play, as today.

**Pages.** At most four game cards per page (150 units, rows of up to four as in the picker), with 120-unit previous and next arrows. Each arrow is drawn only when it has somewhere to go and speaks `explore.page` with the page picture count. Nothing advances by itself. The page and the entry are kept for the visit. They are forgotten on `selectPlayer`, as `forgetLands` already does.

**The origin.** `Origin` in `src/app/App.ts` gains `{ explore: 'places' | 'favorites' | 'all' | 'family'; page: number; others?: boolean }`. It is bounded and typed, with no serialized scene. `goToOrigin` sends it to `go.explore(entry, page, others)`, a new root route. In classic, `go.explore` falls back to `go.hub()`, since classic never makes this origin. A game launched from a location keeps the existing `{ land }` origin, so Back returns to the location, whose own Back returns to Places.

**Back to [origin] on results, root only.** At the root, the result's blue Home, which already returns to the origin, becomes a return arrow beside the origin's picture: the location's icon, or the Explore entry's. It speaks `result.back` ("Back to {place}"). A house-picture **Home** joins it, at least 120 units apart centre to centre, and returns to `HomeScene`. D1b's Next game, Another, Again and Next level keep the origin across every hop, as they do now. Classic keeps its wording until slice 3 deletes it. The pause sheet's Leave uses the same origin. Its label already names the destination, so no new label is needed.

**Check tier:** shell and navigation. Run typecheck, unit tests (Explore and page layouts in five views, the index enumeration, empty favorites, the origin round trip, `go.explore` in both entries) and the build. Extend `BROWSER_SUITE=home` with Home → Explore → All games, page 2 → a game → result → Back (same page) → Home. Also play one Favorites launch of an older game, and Family play → leave → Explore, in both orientations. Run the offline check, because root navigation changes. `world`, `couch` and `picnic` are not needed: classic and couch code do not change.

## Slice 2: the library, the stories and the rest of Home

- **The library.** Creature play gains a third object, a book on the shelf, which opens a **library** scene. It holds three 150-unit cards: the **journal** (`JournalScene`, unchanged), the **Windy Picnic** (`go.picnic()`) and the **Woodland Picnic** (`go.woodland()`). The Woodland Picnic card shows only where Wonder Woods' path shows it today, at school band. The library reads progress but does not change it. Each story keeps its own save identity and step idempotence (`store.completeStep` and the others), and a story step's round still returns to its story scene. The story scene's and the journal's Back go to the library at the root. They still call `go.room()`, which already means creature play at the root, so the library needs a `{ library: true }` origin only for a journal replay. That origin replaces `{ journal: true }` at the root, and `go.library()` is a new root route. A kept picture or tune still replays from creature play as now.
- **Little surprises and Make my mix.** For lap and toddler, the mix's picnic blanket becomes the first card of All games' page 1. It works the same: a hold to edit, the same `MixHost` and the same preview. The mix's Explore, which today leaves to the age place, leaves to All games page 1. A mix keeps its own session rules (D2b). This settles the [open placement lean](../archive/DECISIONS-2026-10-23.md#decisions) "after RW08 move it to the new Home's direct-play area" as All games, [default 2](#decisions-defaults-the-build-uses).
- **The birthday.** `HomeScene` runs the check `MapScene` makes (`world.band` behind `profile.band`), throws the existing birthday once with its existing lines, and saves `world.band`. The move goes into a shared helper so both entries agree until slice 3.
- **The grown-ups' gear** (`src/ui/grownups.ts`, held two seconds) goes top right on Home. The `.classic-link` moves to sit below it until slice 3, keeping both clear of the companion and the actions (`homeLayout` gains the gear's box and its test keeps every action clear).

**Check tier:** shell and navigation. Run typecheck, unit tests (library layout, the Woodland card's band rule, the birthday helper in both entries, the mix's new leave target, the gear's clearance) and the build. Run `BROWSER_SUITE=home` (creature play → library → journal → Back; a lap profile's mix card → first stop → Explore leaves to All games), `BROWSER_SUITE=picnic` filtered to one Windy step at the root, and the offline check.

## Slice 3: the cutover (waits for the developer)

Run this only after the developer says go. They should first have played slices 1 and 2 on the iPad ([device check](../DEVICE-CHECKS.md)).

- **Deleted:** `classic/index.html`, `public/classic/manifest.webmanifest`, the `classic` Vite input and its precache entry, and `src/main.ts`. The root becomes the only page, and `src/rework.ts` may be renamed `src/main.ts`. Also delete `MapScene`, `PlaceScene`, `SubjectPlaceScene`, `settings.placeLayout`, `go.place`, the `{ place }` origin, place session caches, `CreaturePreview` and its `?preview` branch (`src/dev/creature-preview.ts`; `?cast` stays dev-only), `docs/rework/home-navigation.html` (its packet stays; the HTML lives on in Git history) and the `.classic-link`. `places.ts` keeps only what other code reads (place names in grown-up text and the band's voice). It is not a catalog. `LandScene` stays as `LocationScene`'s base. `forgetLands` stays.
- **Every `go.hub()` caller is audited together**, as RW03 asks. That covers the chooser, the hatch, the birthday, the grown-ups' page launch, stories, result fallbacks, the sticker book, the treehouse and the dev harness. At the root they already mean Home. Each is checked and none is deleted blindly.
- **The browser harness** stops adding `classic/` to a bare origin. It drives the root, picks the first chooser card and lands on Home. `world` is rewritten as Home → Explore → each entry → one game per land through Places → Back. Suites that open games directly through `neo.go.game` keep working unchanged, because the root exposes `neo` in DEV.
- **Saves.** Per the [development-save exception](../../AGENTS.md#project-direction), the save format does not change. Two things can be dropped: a save's place-session memory, and the `settings.placeLayout` value, which loads as "ignored" and is not repaired into anything. The reset path is the grown-ups' page's existing reset, with its undo snapshot. Nothing migrates.
- **Docs:** README (the two-page note goes, and the root becomes Puddle Island), DESIGN's app/scenes, routes and catalog layout sections, and AGENTS' route and catalog rows. Superseded planning passages in HOME-NAVIGATION, HOME and ISLAND-REVAMP move to the archive.

**Check tier:** shell, save and navigation. Run typecheck, unit tests (with the deleted scenes' tests removed rather than kept), the build, the rewritten `world`, `home`, `picnic`, one couch trip from Family play (`BROWSER_SUITE=couch` filtered to entry and leave), and the offline check against the matched preview. The full couch and couchcourse suites are not needed: couch code does not change.

## Not in this packet

- A controller focus ring on Home, Explore and the library. Esc already opens the pause sheet (`canPause`). Controller reach of the root waits for its own slice, as RW03 and HOME leave it.
- A grown-up search box, filters by subject or input, and an Explore Play mode (D7, D8, D9). A D9 definition can build on All games' index rather than adding a second one.
- Collection goals, chosen unlocks and the collection book (RW10). Learning recaps (RW09).
- New toys or rooms at Home, and moving the treehouse's furniture there. Retiring the treehouse is [default 4](#decisions-defaults-the-build-uses).
- Any change to couch save, scores, courses or unlocks.

## Decisions: defaults the build uses

**Decided 2026-10-23 (on the developer's delegation):** defaults 1–4 stand (age-first All games with an Other ages signpost; Little surprises on All games' first page for lap and toddler; the library from a book in creature play with the journal and both picnics; the treehouse retired at the cutover). The cutover itself, deleting `classic/`, stays the developer's call.

Recorded in [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md#still-waiting). Each has a default, so none of them blocks slices 1–2. Slice 3 waits on its own row in [Decisions that block work](../archive/DECISIONS-2026-10-23.md#decisions).

1. **All games is age-first, with Other ages as a signpost**, never a gate. Alternative: one index of every game with age badges.
2. **Little surprises sits on All games' first page** for lap and toddler. Alternative: a fourth Home action for the youngest, beside the ball and Explore.
3. **The library holds the journal and both picnics, reached from a book in creature play.** Alternatives: stories in Explore Places as a twelfth card, or on Home's Continue once the Welcome project ends.
4. **The treehouse (`RoomScene`) is retired at the cutover.** Its furniture placement (`room`) is no longer shown, though the save field stays bounded. Sticker ownership and the sticker book stay. Alternative: a door from creature play to the treehouse, kept as it is.
5. **The cutover itself waits for the developer** after an iPad look at slices 1–2. Alternative: build slice 3 straight after slice 2.

## Build slices, in order

1. **Explore's four entries, the browse origin and Back to [origin] at the root.** **Built 2026-10-21** (PR #744; build note in the [archive](../archive/COMPLETED-2026-10-09.md#rw08-slice-1-explores-four-entries-2026-10-21)). Shell and navigation tier, [above](#slice-1-explores-four-entries).
2. **The library, the stories, the mix, the birthday and the gear at the root.** **Built 2026-10-21** (PR #745; build note in the [archive](../archive/COMPLETED-2026-10-09.md#rw08-slice-2-the-library-the-mix-the-birthday-and-the-gear-2026-10-21); the Windy step ran inside the `home` suite, not `picnic`). Shell and navigation tier, [above](#slice-2-the-library-the-stories-and-the-rest-of-home).
3. **The cutover.** Status `decision` (the developer's go-ahead), after slice 2. Shell, save and navigation tier, [above](#slice-3-the-cutover-waits-for-the-developer).

**Proof of this packet:** links and `git diff --check`. Nothing was built or run in a browser. Child comprehension of the four entries and of Back versus Home is not established. Neither is device speech of the new lines. The observed-play script in [RW03](HOME-NAVIGATION.md#short-observed-play-script-and-open-observations) covers both.
