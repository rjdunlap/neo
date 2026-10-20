# RW06: Playable home and customization (definition)

Defined 2026-10-20 for [RW06](WORK-ITEMS.md#rw06-playable-home-and-customization) ([issue #490](https://github.com/rjdunlap/neo/issues/490)). **Slice 1 is built (2026-10-20, [PR #637](https://github.com/rjdunlap/neo/pull/637), see [Built slice 1](#built-slice-1-2026-10-20)); slice 2 is built (2026-10-20, [PR #638](https://github.com/rjdunlap/neo/pull/638), see [Built slice 2](#built-slice-2-2026-10-20)).** It builds on the [RW03 navigation packet](HOME-NAVIGATION.md) (routes, Back and Home, the per-band Home and the [RW06 acceptance row](HOME-NAVIGATION.md#exact-downstream-acceptance)), the [RW05 collection](CREATURE-COLLECTION.md) (individuals, the companion, Friends; slice 1 built in [PR #630](https://github.com/rjdunlap/neo/pull/630)) and the [wearables fit](../../src/art/creatures/wearables/README.md#the-fit-on-the-pilot-three) ([PR #632](https://github.com/rjdunlap/neo/pull/632)). Source claims were checked at `ddd29812` (`origin/main`, 2026-10-20). Being defined does not authorize RW07–RW12.

## Summary

- **Where it lives.** At the site root, the creature-world entry (`src/rework.ts`). The root's `hub` becomes a new **Home**, replacing RW02b's creature preview as the entry scene. The island game at `classic/` keeps its map and treehouse unchanged; RW08 decides what replaces them there.
- **What she does there.** Home shows her companion on the R06 home backdrop. From Home she can go to **creature play**: one toy that repeats freely, her kept picture and tune, and the basket to Friends. From Friends she can **dress** the friend she is looking at. What it wears is saved on that individual and follows it to the guide, the result star, Friends and creature play.
- **What it stores.** One new bounded field, `look.worn`, on each individual. No wardrobe inventory, toys, currency, hunger or decay.
- **Two build slices.** Slice 1 is the saved look and the dressing scene, reached through the classic treehouse's existing Friends route. Slice 2 is the root's Home and creature play, plus the root front door and the full RW03 route chain. See [Build slices, in order](#build-slices-in-order).

## The saved look

**The record.** `Individual.look` grows from `{ color }` to `{ color, worn }`. `worn` is a list of wearable ids (`WEARABLES` in `src/art/creatures/wearables.ts`): at most one per **slot**, at most seven, in the order they were put on. No version bump is needed. A missing `worn` repairs to `[]`, and development saves may reset anyway ([the exception](README.md#decisions-and-working-recommendations)).

**Slots.** These are added to `wearables.ts` as a `SLOT` table beside `ITEM_ART`, so a hat replaces a hat instead of stacking:

| Slot | Items |
| --- | --- |
| head | crown, sun hat, beanie |
| face | sunglasses |
| neck | scarf |
| body | raincoat |
| held | umbrella |
| hands | mittens |
| feet | boots |

**Repair on load** happens beside the RW05 `creatures` repair in `migrate()`, with tests. Unknown ids are dropped. Duplicates keep the first. When two items share a slot, the later one stays (the one put on last). The list is cut at seven. An item the species cannot wear (a `misfit` in its wear table) **is kept**: it is simply not drawn. An R19 redraw can later turn an angle misfit into a fit, and a wear table must never silently change her save. Dressing never offers a misfit, so the only way one is stored is through a changed table.

**Writes** go through one store call, `store.wear(id, item, on)`. It finds the individual by `id`, replaces whatever else is in that slot when `on` is true, removes the item when `on` is false, and writes immediately, as `meet()` and `choose()` do. An id the profile does not own changes nothing; callbacks hold ids, never references (the RW05 rule). Reset keeps creatures and so keeps their looks. Undo, restore and backups carry `worn` with the individual. Profiles are untouched, because `creatures` lives inside each profile's `SaveData`.

**Ownership.** A worn item is not consumed, and taking it off loses nothing, because **RW06 keeps no wardrobe inventory**: every prepared item is available to every individual whose species wears it, as the treehouse's furnishings are all free. Earned items (RW07's rewards, RW10's chosen goals, the PET-INTEGRATION §4 kinds) arrive later as *new* items with their own token. These nine are never locked afterwards ([default 1](#decisions-defaults-the-build-uses)).

## Dressing

**Route.** `go.dress(id)` opens `DressScene` for one owned individual. The way in is a **Dress** button (a hanger picture, 100 units, touch-down feedback) on Friends, beside Come with me. It dresses the individual currently previewed on the stage, not only the companion, because RW03 says dress entry uses individual identity. Back returns to Friends with that individual still previewed (`go.friends(previewId?)`). Home is described under [Routes](#routes-and-the-root-front-door).

**Layout.** This covers both orientations, with a layout test at every band in four views, as `friends-layout` has:

- **The individual**, at stage scale on the left (landscape) or the top (portrait), with its body-centred touch circle. Tapping it pokes it, plays its chirp and repeats the instruction (`dress.pick`). This scene uses a large creature instead of the corner guide, so it must repeat the instruction itself.
- **The wardrobe**: one 150-unit card per item that fits this species, in a grid on the right (landscape) or below (portrait). That is seven cards for the sprout (no raincoat, no boots until R19), seven for the river and four for the glider. A worn item's card shows a ring. There is one page with no paging. If a later species fits more than the grid holds, it uses the Friends scene's held arrows.
- **Take everything off**: one 100-unit button, which takes off every item and keeps the colour.

**Interaction.** Tapping a card puts the item on, or takes it off if it is already worn. When the item goes on, the creature hops, the item pops in, the item's line plays (`dress.on`, e.g. "A crown for {pet}!"), and a short pentatonic sparkle sounds. Taking it off plays a softer sound and `dress.off`. When the item shares a slot with something already worn, the old item comes off first, visibly. Each change writes at once. There is no Done, score, sticker, miss or hint, and no right outfit. Leaving at any moment keeps exactly what is on.

**Voice** (added to `src/content/voice-script.ts`): `dress.pick` (the instruction), `dress.on` and `dress.off` with `{pet}` meaning the dressed individual's name, `dress.none` ("All off!"), and `friends.dress` (spoken on the Dress button's touch).

## The look follows the creature

`Companion` (`src/creatures/companion.ts`) puts on its individual's `worn` items when it is built, through `wearItem` and the species' wear table. Every scene that builds a companion or an individual therefore shows the look without its own code. `loadWearables()` moves into `loadCollectionArt()` so that **both** entries load the item textures (today only `src/rework.ts` loads them). Like the rest of that loader, it never throws: an item whose texture failed is not drawn.

| Where she sees her friend | Shows the look |
| --- | --- |
| The guide in every game, the result star | Yes, from slice 1 |
| Friends' stage creature, the dressing scene | Yes |
| The classic treehouse resident, the map and land walkers, the picnics, the couch's demo and finale pet | Yes, because they all use `makeCompanion()` |
| Root Home and creature play | Yes (slice 2) |
| **The ten large-pet games** (Splish Splash and the rest) | **Not until [RW05 slice 2](CREATURE-COLLECTION.md#the-companion-in-code-one-seam-two-slices)**: they still draw a `Critter` from `ctx.petSpec`. When `CompanionRig` lands, it wears `worn` as part of its build, and that slice adds a test for it |
| Friends' cards and the chooser's portrait | **No**: these are prepared still portraits. This is a known gap, not a miss; a dressed thumbnail waits for actual use |
| The Graphics fallback rig (art failed to load) | No: `wearItem` works on `IllustratedCreature` only |

**The guide footprint.** The RW05 test keeps each species inside the bottom-left clearance at `GUIDE_SCALE`. Slice 1 extends it to the **widest outfit each species can wear** (the umbrella and sun hat on the sprout, the sun hat and boots on the river, the sun hat on the glider). If an outfit breaks the clearance, the guide drops that item's `held` slot, or the species gets a smaller guide scale. The test decides; the slice records which.

Both RW05 slice 2 and RW06 slice 1 edit `companion.ts`. **Do not build them in parallel.** Either order works, and the second one rebases.

## Creature play and Home

### Home (`HomeScene`, the root's `hub`)

- **Backdrop.** R06's `home-day-3` ([review notes](concepts/generated/README.md#r06-review-and-preparation-notes)), prepared into `src/art/home/` as a WebP at most 1536 × 1024 and **under 1 MiB**. Workbox's per-file precache limit is 3 MiB, and a bigger file would quietly drop out of the offline cache. The preparation command is recorded in a README beside it, as the creature sprites' are. The backdrop covers the view: the 4:3 crop fills 1024 × 768, and the spare dimension shows more sky or floor. Dusk is not used ([default 2](#decisions-defaults-the-build-uses)).
- **The companion**, large, standing on the floor in the centre (the R06 foreground is empty for it). It is the largest target: tapping it pokes it and plays its chirp. Idle motion only; it never asks for anything.
- **Exits, per RW03's band table:**

| Band | On Home |
| --- | --- |
| Lap, toddler | The companion (the play target), **one toy** (the ball, playable right here: the same toy as creature play, so the youngest never need the second scene) and the **Explore** picture |
| Preschool and older | Three pictured 120-unit actions: **Continue** (absent until RW07: it is not drawn, rather than drawn and empty), **Play with {pet}** (a ball-and-basket picture, which opens creature play) and **Explore** |

- **Explore until RW08** opens `ExploreScene`, a one-page picker of the built locations (built 2026-10-20, [PR #640](https://github.com/rjdunlap/neo/pull/640)): at most four 150-unit cards (`EXPLORE_MAX`; all four are taken since Bubble Beach, so the fifth location needs a higher cap or a page), each tapping to `go.land(id)`; Back returns Home. RW08 replaces it with the four entries. The page's DOM `.classic-link` to the island game keeps showing on Home, as it shows on the root's hub today.
- **Who's playing**, a person picture at the top left (Home has no Back), which opens the chooser (`go.start()`).
- **Voice**: `home.hello` ("{pet} is home!"), spoken on arrival once per visit; `home.play`, `home.explore` and `home.who` on each picture's touch. No reading is needed.

### Creature play (`PlayScene`)

- **The toy: a ball.** Tapping the ball (a 120-unit target, squashing on touch-down) sends it bouncing to a new spot on the floor. The companion goes after it (a walk, or a flight for the glider, with hops), noses it, plays its chirp and is `happy` for a moment. The ball is then free to tap again. It repeats as often as she likes, with no count, score, sticker or end. A tap while the ball is moving redirects it rather than queueing. Tapping the companion pokes it. The ball's flight is drawn with `ctx`-style scene tweens. Every tween and timer is scene-owned, so leaving mid-bounce stops it.
- **What she made.** The picture board and the tune plaque from `src/ui/creation-art.ts`, drawn from `store.creations` exactly as the treehouse draws them. Tapping the picture shows it large, as in the treehouse. Tapping the plaque plays the tune, and the companion hops on each note. With nothing kept, the board shows an empty frame, and tapping it says `room.picture-empty` (an existing line). No new creation kinds and no keeping from here: keeping still happens only at a round's end.
- **The basket** opens Friends (`go.friends()`), with the companion going to look first, as in the treehouse.
- **Back** returns Home, and **Home** returns Home. At the root, creature play is `go.room`, so Friends' existing Back (`go.room()`) lands here with no change to Friends' code. See below.
- **Voice**: `play.ball` (the instruction, "Throw the ball for {pet}!", repeated on a poke) and `play.fetch` (a few varied lines).

## Routes and the root front door

The root's `Routes` in `src/rework.ts` already override `hub` and `land`. Slice 2 adds:

| Route at the root | Opens | Why |
| --- | --- | --- |
| Boot | `go.start()`, the chooser | RW03: reload begins at the chooser, then the selected person's Home. The chooser already routes a touch pick to `go.hub()` (or `go.hatch()` for a profile with no friend, and `HatchScene` ends on `go.hub()`), and Enter or a pad to couch play |
| `hub` | `HomeScene` | Replaces `CreaturePreview` as the root's entry. Every `go.hub()` caller at the root (the chooser, the hatch, a location's Home, the sticker book, the grown-ups' page) lands on Home |
| `room` | `PlayScene` | Friends' Back already calls `go.room()`. The journal's Back does too, but the journal is not reachable from the root until RW08's library |
| `dress` (new, in both entries) | `DressScene` | In classic it comes from the treehouse's Friends (slice 1). At the root it comes from creature play's Friends |

Home and Back follow RW03. Creature play, Friends and Dress each show **Back** (a return arrow beside the destination's picture) at the top left. At the root they also show **Home** (a house picture) to its right, at least 120 units apart centre to centre. Classic's Friends and Dress keep Back only, as Friends does today ([RW05 difference 5](CREATURE-COLLECTION.md#built-slice-1-2026-10-20)). The RW03 chain is: Home → creature play → Friends → Dress; Back → Friends (still previewing the same individual); Back → creature play; and Home from Dress → Home.

**The creature preview** moves behind `?preview` on the root URL (in production as well, so the developer can still compare rigs on the iPad), with its wearables and meadow buttons as they are. `?cast` stays dev-only. **RW08 removes the `?preview` entry**, together with RW03's HTML wireframe, when Explore replaces the root's interim Explore. This is the temporary entry the work item asks to record.

## Not in this packet

- Wardrobe ownership, earned items and the welcome adventure's basket bed: [RW07](WORK-ITEMS.md#rw07-welcome-adventure-and-visible-reward) and [RW10](WORK-ITEMS.md#rw10-collection-book-and-chosen-unlock-goals).
- Weather Wardrobe's outfit, Fluffy Salon's hairstyle, meals, shelf toys and garden beds coming home ([PET-INTEGRATION §4](PET-INTEGRATION.md#4-what-a-round-makes-comes-home-to-the-creature-rw06-rw07-rw10)): these wait on the open "Creatures inside the games" decision in [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md).
- More toys, more rooms, moving furniture at the root, or a second backdrop. The classic treehouse keeps all of that. The work item says more rooms and large inventories wait for actual use.
- Explore's four entries, the Continue card, the Back-to-origin relabel on results and retiring the classic map: [RW08](WORK-ITEMS.md#rw08-explore-and-default-home-cutover) and RW07.
- Controller reach of Home, creature play and dressing. Esc opens the pause sheet (`canPause`); a focus ring waits for RW08, as RW05 left Friends.
- Redrawn wearables (queue [R19](art-requests/QUEUE.md#r19-wearables-at-the-casts-angle)) and dressed card portraits.

## Decisions: defaults the build uses

These are recorded in [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md#defaults-in-use-block-nothing). Each has a default, so none of them blocks a slice.

1. **All nine items free now.** Every fitting item is available from the first visit, like the treehouse furnishings. Earned items come later as new items. (Alternative: start with three and earn the rest, which needs RW07 first.)
2. **Day backdrop only.** No dusk at Home. (Alternative: dusk after a local evening hour. That is a clock-driven change, cosmetic only, and never a bedtime cue.)
3. **The ball is the one toy.** It is chosen because it reads at lap and suits all three bodies. (Alternatives: a music box, already a treehouse item; a bubble wand.)
4. **The preview stays reachable in production** at `?preview` until RW08. (Alternative: dev-only, which drops it from the build.)

## Build slices, in order

**Slice 1: the saved look and dressing.** Shell/save tier: typecheck, unit tests, build, `world` (a new route; Friends changed), one filtered guide-only game (the dressed guide; the ten large-pet games are unchanged, so no large-pet regression), and the production offline check (persistence changed).
- `look.worn`, `SLOT`, the repair and `store.wear`, with save, store and profile tests (a restored backup keeps `worn`; another profile's individual is untouched).
- `Companion` wears `worn`. `loadWearables()` moves into `loadCollectionArt()`. The guide-footprint test is extended to the widest outfits.
- `DressScene`, `go.dress(id)`, Friends' Dress button and `go.friends(previewId?)`, the voice lines, a layout test in four views at every band, and cleanup on destroy (no listener, tween or texture left; the wearable textures are shared and never destroyed by the scene).
- One scripted `dress` case in `scripts/browser-check.mjs`. In the treehouse: Friends → Dress → put on the crown and the scarf → put on the sun hat (the crown comes off) → Back → Friends previews the same individual → Back → the treehouse resident wears the sun hat and scarf → reload → still dressed → a guide-only game's guide is dressed → a second profile's companion is undressed. One landscape and one portrait screenshot of Dress.

**Slice 2: Home and creature play at the root** (after slice 1). Shell/navigation tier: typecheck, unit tests, build, `world` (the root's routes changed; classic must be unaffected), and the production offline check (a new asset and new navigation, confirming the backdrop is in the precache).
- The R06 backdrop prepared under 1 MiB, with its README command. `HomeScene` with its per-band exits. `PlayScene` with the ball, the kept picture and tune, and the basket. The root's boot goes to the chooser, and `hub`, `room` and `dress` are overridden as the route table above says. The preview moves to `?preview`.
- A layout test for Home and creature play at every band in four views (targets at least 100 units, the ball 120, the bottom-left guide corner clear, Back and Home 120 units apart).
- One scripted `home` case at the root: the chooser → Home (both band layouts, by profile band) → creature play → the ball three times (it repeats, nothing is recorded: stats, stickers and journal unchanged) → the kept tune plays → basket → Friends → Dress → Back → Friends → Back → creature play; then Dress → Home → Home. Also: leave mid-bounce with no error; Explore → Rainbow Meadow → its Home → Home; and Who's playing → a second profile → its own Home and companion. Screenshots of Home and creature play in landscape and portrait.

**Not established by either slice:** whether a child reads the ball as hers to throw, whether the hanger picture says "dress", how the items read on an iPad, device speech of the new lines, and frame rate with a dressed live rig on the backdrop. These go to [device checks](../DEVICE-CHECKS.md) when each slice is built.

## Built slice 1 (2026-10-20)

[PR #637](https://github.com/rjdunlap/neo/pull/637), tested at `c92a51d3` on `797dd0c9`. Built as specified, with these differences and decisions:

- **`wear-slots.ts` (Pixi-free)** holds `WEARABLES`, `SLOT` (head: crown, sun hat, beanie; face: sunglasses; neck: scarf; body: raincoat; held: umbrella; hands: mittens; feet: boots), `MAX_WORN` 7, `cleanWorn` (unknown dropped, duplicates keep the first, a slot clash keeps the later item, cut at 7, misfits kept) and `changeWorn`; `wearables.ts` re-exports them. No save version bump; `meetIn` creates `worn: []`.
- **Correction: the river fits six items, not seven.** Its wear table has three misfits (raincoat, umbrella, mittens). The sprout fits seven and the glider four (`wearableBy(species)`), so Dress shows 7, 6 or 4 cards.
- **Guide footprint decision: the guide leaves off `held`.** The sprout's umbrella reaches about 25 units past the corner clearance at `GUIDE_SCALE`, so `makeGuide()` (`GUIDE_LEAVES_OFF = ['held']`) drops the held slot; every other outfit for every species fits. The item stays saved and shows everywhere else (result star, treehouse, Friends, Dress). A test asserts the umbrella breaks the bound without the drop.
- **`loadCollectionArt()` loads the wearables**, so classic loads them too. The Graphics fallback rig draws nothing.
- **Dress:** `DressScene`, `dressLayout` (tested in the five Friends views for every species' card count), `go.dress(id)`, `go.friends(previewId?)`, a yellow hanger Dress button on Friends (above Come with me) and a "take everything off" button. Back on Dress returns to Friends with that friend previewed. Voice: `friends.dress` then `dress.pick`, nine per-item `dress.on.<item>` lines (instead of one `dress.on`, so each phrase reads naturally), `dress.off`, `dress.none`.
- **Checks:** typecheck, `npm test` (169 files, 1614 tests), `npm run build`, `BROWSER_SUITE=dress` (also the guide-only game check, bubble-pop), `world`, `friends`, `test:offline`. Not run: large-pet regressions (unchanged), couch suites.
- **Known gaps:** Friends' cards and the chooser's portraits are undressed stills; the ten large-pet games show the look only after [RW05 slice 2](CREATURE-COLLECTION.md#the-companion-in-code-one-seam-two-slices). Device questions are in [DEVICE-CHECKS.md](../DEVICE-CHECKS.md).

## Built slice 2 (2026-10-20)

[PR #638](https://github.com/rjdunlap/neo/pull/638), tested at `44633f94` on `f787f736`. Built as specified, with these differences and decisions:

- **Routes.** `src/rework.ts` boots the chooser (`go.start()`); `hub` is `HomeScene`, `room` is `PlayScene`; built locations still replace lands. A new `App.creatureWorld` flag is true at the root (classic leaves it false) and switches the root-only parts of Friends and Dress. The creature preview moved to `?preview` (production too); `?cast` stays dev-only. In DEV the root also loads the testkit, for scripted checks.
- **Home.** The companion on the R06 day backdrop (`src/art/home/home-day.webp`, 1536×1024, 150 KB, prepared with sharp; command in `src/art/home/README.md`), large, poke and chirp, idle only. Lap and toddler get the ball on Home plus Explore; preschool and up get "Play with {pet}" plus Explore; Continue is not drawn (RW07). Who's playing (people picture, top-left) opens the chooser. Explore first opened Rainbow Meadow; it now opens the location picker (PR #640, voice `explore.pick`). Voice: `home.hello` on arrival, `home.play`, `home.explore`, `home.who` on touch.
- **Creature play.** The ball, the kept picture board and tune plaque (drawn by `src/ui/creation-art.ts` as the treehouse does; the companion hops on each note) and the basket to Friends (the friend walks to it first). Back and Home (house picture, 130 units right of Back) both return Home. Voice: `play.ball` (the instruction, repeated on a poke), `play.fetch`.
- **Ball (`ball-play.ts`, `BallPlay`).** A tap on the 120-unit ball bounces it twice to a new spot on the grass; a tap mid-flight redirects it; the friend runs (the glider flies) to it, noses it, chirps and is happy. No count, score or sticker. All motion is a tracked update, so leaving mid-bounce stops it. The youngest's ball on Home uses the same `BallPlay`.
- **Decision: the ball always draws over the friend,** and the friend stops beside it. Found in the browser check: a resting ball under the friend's hit circle swallowed the second tap. On a screen turn the friend is clamped back onto the grass.
- **Deviation: the page's `.classic-link` ("Island games") moved from top-left to top-right** (`src/style.css`), because Who's playing takes Home's top-left. It still shows only on the root's entry scene (Home, or the preview); the preview caption says top-right.
- **Deviation: Friends' Back shows an arrow at the root** (the treehouse picture in classic). Friends and Dress show a house-picture Home right of Back at the root only; both layout tests keep it clear.
- **Layout.** `src/creatures/home-layout.ts` (`homeLayout`, `playLayout`, `backdropFit`, `HOME_BUTTON`), tested in five views (iPad both ways, phone, notched phone, wide laptop): targets at least 100 (actions and ball 120), the guide corner clear, the link corner (300×100 top-right) clear on Home, the ball's landing floor clear of every button, Back and Home at least 120 apart. `backdropFit` cover-scales and anchors to the bottom (grass begins at y 730 of 1024); the loader never throws and falls back to cream sky and grass.
- **Assets.** `vite.config.ts` precache globs gained `webp`; without it the backdrop would silently drop out of the offline cache. `meadowIcon` moved from the preview to `src/ui/icons.ts`; new `ballIcon`, `playWithIcon`.
- **Checks.** Typecheck; `npm test` (170 files, 1617 tests, before the last ball-play tweak, which typecheck and the `home` case then covered); `npm run build` (precache 100 entries, 9414.81 KiB); `BROWSER_SUITE=home` (new; the chain in the slice list, plus the toddler Home); `world`; `test:offline` against the matched preview; a one-off production probe of the root (the service worker cached the webp, an offline reload shows the chooser, no page errors). Not run: couch suites, friends and dress suites (only the root-only Home button changed; the `home` case covers it), large-pet regressions.
- **Known gaps.** Not established: whether a child reads the ball as hers to throw, the people and house pictures, device speech of the six new lines, the frame rate of a dressed rig on the backdrop on an iPad ([device checks](../DEVICE-CHECKS.md)). The preview stays at `?preview` until RW08.
