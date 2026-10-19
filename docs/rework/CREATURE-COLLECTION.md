# RW05: Creature collection and active companion (definition)

Defined 2026-10-17 for [RW05](WORK-ITEMS.md#rw05-creature-collection-and-active-companion) ([issue #489](https://github.com/rjdunlap/neo/issues/489)). **Docs only: nothing here is built**, and being defined does not authorize RW06–RW12. It is the model, save and selection authority the collection builds from; the [RW02 art packet](CREATURE-ART.md) and [RW02b pilot](GENERATED-CREATURE-PILOT.md) own how a creature is drawn and rigged, the [RW03 navigation packet](HOME-NAVIGATION.md#routes-and-meaning) owns routes and return rules, the [cast](art-requests/CAST.md) and [game fit](art-requests/GAME-FIT.md) own what each species is and what the games ask of it. Every source claim below was checked at `05e2366d` (`origin/main`, 2026-10-17).

## Summary

- **Three layers, kept apart:** a **species** is content (a table in code, never saved); an **individual** is a saved creature the child owns, with its own id, species, name and look; the **companion** is the one owned id that travels. Nothing speculative (rarity, breeding, combat, experience, hunger) is stored.
- **A fresh save:** `SaveData` version 3 replaces the single `pet` field with a bounded `creatures` block. An older development save keeps its stickers and levels but owns no creature, so it meets its first friend again at the egg; there is no migration of the old pet, per the [development-save exception](README.md#decisions-and-working-recommendations). One API, `store.meet()`, is both the hatch's seed and the reseed path, and later RW07's adoption.
- **A selection surface, Friends:** opened from the treehouse until RW08's Home exists. Cards for every owned individual, a live stage creature to preview and poke, and one explicit **Come with me** button that changes the companion, saves at once and survives reload. Looking changes nothing; choosing counts as no learning.
- **Two build slices:** the first lands the model, the hatch, Friends, the guide, the chooser, the island scenes and the grown-ups' page, with the ten large-pet games still on `Critter`; the second moves those ten games to the species rigs through one small `CompanionRig` surface. The RW03 gate ("guide and pet-sensitive game agree") is met at the end of the second.

## Species versus individual versus companion

| Layer | Where it lives | What it holds | What it never holds |
| --- | --- | --- | --- |
| **Species** | `src/creatures/species.ts`, a `SPECIES` table like `CRITTERS`; ids `sprout`, `river`, `glider` (the pilot three; `SpeciesId` already exists in `src/art/creatures/creature.ts`) | Grown-up name and spoken name line; shape family; the land where it is met (a `LandId`, informative only in RW05); which rig draws it (the Graphics rig, or the illustrated mesh rig when its art has been generated and prepared); the slot/misfit table from RW02; the moods it can show (`base`, `blink`, `happy`, `surprised`, `sleepy`, `sad`; the game-fit list); three suggested names; a pentatonic chirp (two or three steps from `src/audio/notes.ts`); stage, card and guide scales, and the guide-scale footprint | Anything per child. A species is never "owned"; ownership is only of individuals |
| **Individual** | `SaveData.creatures.owned[]` | `id` (random, `[a-z0-9]{4,32}` like a profile id, unique in the profile, never reused); `species`; `name` (1–40 characters, the current pet-name rule); `look: { color }` (one of the eight `PET_COLORS`, the tint the rig applies as the Graphics pip is tinted today); `metAt` (the token that created it: `start` for the first friend, `dev:<species>` for a development seed, later `project:<id>:<step>` from RW07, so a replay can never adopt twice, which the RW03 table requires) | Experience, level, hunger, mood, affection, rarity, a wardrobe (RW06 adds `worn` with its own repair), toys or a home (RW06), forms (RW11), a currency |
| **Companion** | `SaveData.creatures.companion`, an owned `id` or `null` | Which individual travels: the guide in every game, the big pet in the ten large-pet games, the walker on the island, the treehouse's resident, the chooser's portrait | A history of past companions, a schedule, a mood about being left at home |

Two individuals of one species are allowed (two sprouts with different names), as in the cast's Neopets model; in RW05 only a development seed can create that. "Dress entry uses individual identity, not species as ownership" (RW03) is therefore a rule about keys: every later surface addresses an individual by `id`.

## The fresh save and the reset and reseed path

**The record.** `version` becomes `3`. `pet` goes; `creatures` arrives:

```text
creatures: {
  owned: Individual[]   // at most 24 (MAX_CREATURES), in the order met
  companion: string | null  // an owned id; null exactly when owned is empty
}
```

**Repair on load** (`migrate()`, with tests beside the existing save tests): every individual is rebuilt from a whitelist; one with an unknown species or a malformed id is dropped; duplicate ids keep the first; a name is trimmed and clamped to 40 characters and falls back to the species' first suggested name; a look with an unknown colour becomes the species' palette colour; `metAt` is clamped to 60 characters; the list is cut at 24, keeping the earliest. `companion` must name an owned id, else it becomes the first owned id, else `null`. Defaults are `owned: []`, `companion: null`.

**An older development save** (version 2, or any record without a valid `creatures` block) is repaired like any other missing field: progress, stickers, room, creations and journal stay (the whitelist already keeps them at no cost) and the profile owns no creature, so the chooser shows its egg again and the next tap meets its first friend. The old `pet` field is not read. This is the simplest honest reading of "old formats may reset"; rejecting the whole save instead is the developer's call ([decision 1](#decisions-for-the-developer)). The one-profile `PreviousSave` snapshot and a backup file go through the same `migrate()`, so a restored older backup behaves the same way; `BACKUP_VERSION` stays 3 (the file format is unchanged; its saves carry their own version).

**`store.reset()`** keeps profile, settings **and creatures**, as it keeps the pet today: a named friend is not progress, and losing her on "start over" would be a lost possession. `undo` swaps the whole save as it does now.

**`store.meet(species, name, color, metAt)`** is the only way an individual comes to exist. It is idempotent on `metAt` within a profile (a second call with a token already in `owned` returns the existing individual and changes nothing), refuses beyond 24, writes immediately rather than through the 300 ms batch, and sets `companion` when it was `null`. Three callers:

| Caller | Token | When |
| --- | --- | --- |
| `HatchScene` | `start` | The first friend, as today's hatch |
| A development seed | `dev:<species>` | `kit.store.meet(...)` from a scripted check, and a dev-only "Meet everyone (development)" button on the grown-ups' page under `import.meta.env.DEV`, which seeds the river and the glider with their first suggested names. This is the reseed path at cutover: it is how a developer sees three cards before RW07 exists, and it is absent from a production build |
| RW07's adoption | `project:<id>:<step>` | Not built here; the token rule is what makes its replay idempotent |

**Profiles** are untouched: `creatures` sits inside each profile's `SaveData`, so the index, `switchTo`, `removeProfile`, `exportAll` and `restoreAll` need no change beyond their tests. `applySettings()` pushes the companion's name into `voice.pet` instead of `pet.name`, so every `{pet}` voice line (46 today) speaks the companion; `selectPlayer` already calls it.

## Meeting the first friend (the hatch, kept)

`HatchScene` keeps its three steps, its four cracking taps, its eight colours, its three suggested names with the grown-ups' typed name, its `hatch.*` lines and its quick path for a person thirteen or older (`skipsEgg`). What changes is what hatches: the creature on the shell is a **sprout** (the cast's starter and the current pet's successor), and finishing calls `store.meet('sprout', name, color, 'start')` then `go.hub()`. The egg is not offered a species choice: the river and the glider are met through adventures (RW07), and the chooser's egg stays an egg, drawn by `drawEgg`. The chooser's card shows the companion's portrait (a still texture, below) when the profile owns one, else the egg, and `App.ts` and `ChooserScene` route on `owned.length > 0` where they test `pet.hatched` today.

## Friends: the selection surface

**Route.** `go.friends(origin?)` opens `FriendsScene`. Until RW08's Home exists, the entry is the treehouse (`RoomScene`): a basket by the door, a 100-unit target with touch-down feedback, that the companion goes to look at when tapped (the room's existing "a tap, not a move: the pet goes to see" rule) before the scene opens. Back returns to the treehouse; Home returns to the home spot, as every island scene does today. After RW08, the same scene sits under Home → creature play → collection, with RW03's Back order (collection, then creature play), and the basket entry goes. No new route flag, no second scene.

**Layout** (both orientations; `landLayout`'s rule that a target never shrinks applies, with a test at every band in four views):

- A **stage creature**: the previewed individual's live rig at stage scale (0.8–0.95, the RW02 sizes), with its body-centred touch circle (105–135 units). Tapping it plays the species' touch reaction and chirp and repeats the instruction (`friends.pick`): this scene uses a large creature instead of the corner guide, so it must repeat the instruction itself.
- **Cards**, one per owned individual, 150 units, in a column on the right in landscape and a row along the bottom in portrait (the RW02 preview's layout). A card holds a **still-texture thumbnail** (one frozen frame of the rig rendered into a `RenderTexture` on scene load, as CREATURE-ART recommends, so no card keeps a live rig), the name, and a ring with a small "with me" mark on the companion. Tapping a card previews it: the stage creature becomes that individual and its name is spoken (`friends.name`, "{pet}!" with that individual's name). Tapping never selects.
- **Come with me**, one 100-unit button beside the stage creature, with touch-down feedback. It is the only thing that changes the companion.
- Up to six cards fit a page; a seventh owned individual adds two held arrows (the intro's level-arrow hold, so a small hand's tap does nothing) for the next page. RW05 can only ever show three, so paging is defined and tested in layout but needs no art.
- Keyboard and pad: Esc opens the pause sheet (`canPause`); a focus ring for the cards is not built here (RW06/RW08 decide the controller reach of creature play).

**Selection semantics.** Come with me sets `creatures.companion` to the previewed id, writes immediately, calls `applySettings()` so `voice.pet` follows, says `friends.come` ("{pet} is coming with you!") and returns Back after the line. Pressing it on the current companion says `friends.already` and does nothing. The change is visible the moment any scene builds a companion again: the treehouse, the island, the guide. Reload shows the new companion from the save; a profile switch builds the other profile's companion; reset keeps it; a restore replaces it with the backup's. Scene callbacks hold an individual's `id`, never a reference, and are rebuilt per scene, so an old callback cannot select an individual the current profile does not own (the RW03 gate).

**Never mastery.** Friends starts no round, awards no sticker, records no stats, journal entry, miss or hint, and takes no time limit. A grown-up's pin, level and the difficulty tables are untouched.

**Voice** (added to `src/content/voice-script.ts`): `friends.pick` (the instruction), `friends.name`, `friends.come`, `friends.already`, and `species.<id>` (the spoken species name). Sound: one pentatonic chirp per species on a poke, synthesized; the island's loop keeps playing.

**The grown-ups' page** keeps its name and colour fields; they edit the companion (label "Your friend's name"), with the existing 40-character rule.

## The companion in code: one seam, two slices

Today `src/art/pet.ts` gives the shell `petSpec()`, `petSpecFor(pet)` and `makePet()`, and the games get `ctx.petSpec: CritterSpec` and build `new Critter(ctx.petSpec)` ([game fit](art-requests/GAME-FIT.md#what-the-games-ask-of-a-companion) lists the ten and what each needs). The three species rigs (`src/art/creatures/`) share `Creature`: `poke()`, `update(dt)`, slots and `wear()`, a touch circle, but no moods, hops or named body parts.

**Slice 1** adds `src/creatures/companion.ts`: `companion()` (the active individual, or `null`), `makeCompanion()` (its species rig, tinted its colour, with `guideScale` applied) and `companionPortrait(renderer)` (the still texture). The guide, the result star, the chooser, the treehouse, the map, lands, places, the picnics and the couch's demo and finale stage switch to it. The ten large-pet games keep `ctx.petSpec` and `Critter`, built as today in the companion's colour: a stand-in, named in the verification entry, so the glider's child sees a teal pip in Splish Splash until slice 2. `ctx.pet` (the guide handle games speak and emote through) keeps its surface: the rig gains `setMood()`, `hop()`, `cheer()` and `currentMood` with the six moods above, which is what the sixty-odd guide-only games use.

**Slice 2** defines `CompanionRig`, the surface the ten games need and no more, straight from the game-fit table: named parts (`part('tummy' | 'head' | 'cheeks' | 'ears' | 'nose' | 'eyes' | 'hands' | 'feet' | 'back' | 'neck')`, each a container inside a moving body part, like the RW02 slots), `attach()`, the moods, `hop`, `spin`, `wiggle`, `cheer`, and a body bounds for the whole-body games. `ctx.companion()` builds one; `ctx.petSpec` is removed when the last game stops reading it. Each species fills the table or records a misfit (the glider has no hands or feet; Weather Wardrobe's boots and mittens then skip, as the scarf does on the glider today), and a unit test checks every part a game names exists or is a recorded misfit on every species. The games move one at a time with a filtered regression each; Splish Splash, Weather Wardrobe and Pet Says are the three that name the most parts and go first.

**The guide with a job.** The [pet integration review](PET-INTEGRATION.md#1-a-guide-with-a-job-every-game-rw05) asks RW05 for its first way in: the guide's mood following play (`happy` on a right answer, `surprised` on a miss, `sleepy` when nothing happens), the species chirp on a tap and at the celebration, and the result star doing the species' signature move. All three ride on slice 1 as defined here: `GameScene` already sees every miss, hint and finish, the rig gains the moods and the chirp above, and the result star is `makeCompanion()` with its `poke()`. Casting owned creatures as friends inside games, the review's second way, is a separate proof slice after RW05, not part of either slice here.

**Art (updated 2026-10-19).** All three pilot species have prepared illustrated sets and mesh rigs (`src/art/creatures/<species>-illustrated.ts`, [step 2 result](GENERATED-CREATURE-PILOT.md#step-2-result-2026-10-19)); RW05 takes them as the species' renderers, and the species table's "which rig" field is where a later species swaps from Graphics to illustrated, with no change to the save or Friends. RW05 keeps one glider renderer (the illustrated one, the developer's choice) and deletes `src/art/creatures/glider.ts`, `src/dev/creature-preview.ts`, the `?creatures` hook and the texture load in `src/main.ts`, moving the glider's asset load into the scene loads that draw it. The guide must still fit bottom-left: a test renders each species at `guideScale` and asserts its bounds stay within the current pip's clearance (the guide stands at (74, `view.h` − 18) at scale 0.42; the glider's 380-unit span needs a smaller guide scale than the sprout's).

## Call sites to regress

Every reader of the pet today, from `grep petSpec|makePet|petSpecFor|pet\.name|pet\.color|pet\.hatched`:

| Site | Today | After slice 1 | Regression |
| --- | --- | --- | --- |
| `src/art/pet.ts` | `petSpec`, `petSpecFor`, `makePet`, `drawEgg` | Replaced by `src/creatures/companion.ts`; `drawEgg` moves with it | Unit: the companion of an empty collection is `null`, and the fallback rig is the sprout |
| `src/progress/save.ts`, `store.ts`, `profiles.ts` and tests | `pet` field, reset keeps it | `creatures` block, `meet()`, reset keeps it | The save tests above; store: meet is idempotent and immediate; profiles: a restored v2 backup opens at the egg |
| `GameScene` (guide at 0.42, result star, `ctx.petSpec`) | `makePet()` | `makeCompanion()` at `guideScale`; `ctx.petSpec` from the companion's colour | `BROWSER_SUITE=games` filtered to two large-pet games (Splish Splash, Pet Says) and one guide-only game |
| `HatchScene` | writes `pet` | `store.meet('sprout', …, 'start')` | The `world` suite's hatch path; a scripted quick hatch |
| `ChooserScene`, `App.ts` | egg or pip by `pet.hatched`; parent launch routes on it | egg or portrait by `owned.length` | `chooser.test.ts`; `world` |
| `RoomScene` | `makePet()` at 0.62, poke | companion rig, the basket entry | The scripted Friends flow below |
| `MapScene`, `LandScene`, `PlaceScene`, `SubjectPlaceScene`, `PicnicScene`, `WoodlandScene` | the pet walks or stands | companion rig; idle motion must not fight the scene | `world` (map, land, place); `picnic` only if the picnic's pet code changes |
| `src/app/settings.ts` | `voice.pet = pet.name` | the companion's name | Unit |
| `src/parent/panel.ts` | pet name and colour | the companion's name and look; the dev-only seed button | A scripted rename, reload, guide spoken name |
| `src/couch/demo.ts`, `finale-stage.ts`, `CouchScene` | `makePet()` for the demo's pet and the finale's cheering pet | companion rig, cosmetic only; couch unlocks and scores still never touch the child's save | `BROWSER_SUITE=couch` only if the finale stage's code changes beyond the constructor call; otherwise the demo's unit test |
| The ten large-pet games | `new Critter(ctx.petSpec)` | Unchanged in slice 1 (stand-in); `CompanionRig` in slice 2 | Slice 2: one filtered regression per game as it moves, and its `fingerdemo` where the bot touches the pet |
| `src/content/voice-script.ts` | 46 `{pet}` lines | Unchanged; `friends.*` and `species.*` added | The voice test that every line id is known |
| `src/art/creatures/*`, `src/dev/creature-preview.ts`, `src/main.ts` | RW02 preview | The Graphics glider, the preview and the dev hook deleted; rigs gain moods | `creatures.test.ts` extended to moods and the guide footprint |

## Scripted checks and proof

Shell/save tier, as the work item says: typecheck, unit tests, build, `world` (a new scene, the hatch and the chooser changed), one or two filtered game suites, and the production offline check (persistence and assets changed). One scripted flow, in `scripts/browser-check.mjs` as `friends`:

1. A fresh isolated profile hatches a sprout named Mochi; the guide in a guide-only game says "Mochi" and shows a sprout.
2. `kit.store.meet('river', 'Pebble', 'blue', 'dev:river')`; open the treehouse, tap the basket; Friends shows two cards with Mochi ringed; tap Pebble's card (the stage shows a river, the name is spoken, nothing saved); tap Come with me; back in the treehouse the resident is a river.
3. Reload; the chooser's card shows the river portrait; the guide is a river named Pebble; a large-pet game builds the stand-in (slice 1) or a river rig (slice 2), and the spoken name is Pebble in both.
4. Switch to a second profile: its own companion or egg, never Pebble; switch back.
5. Grown-ups' page: Start over keeps Pebble as companion; undo brings the previous save back whole.
6. A portrait and a landscape screenshot of Friends.

Not established by any of this: a child's recognition of the three species or her wish to choose between them, device speech of the new lines, iPad frame rate with a live rig plus thumbnails, and the feel of the basket entry. Those go to [device checks](../DEVICE-CHECKS.md) at build time.

## Not in this packet

- A wardrobe, toys, a playable home or the equipped look following the creature: [RW06](WORK-ITEMS.md#rw06-playable-home-and-customization).
- Meeting the river and the glider through an adventure, and the adoption reward: [RW07](WORK-ITEMS.md#rw07-welcome-adventure-and-visible-reward), using the `metAt` token rule above.
- The Home route, Explore and the removal of the basket entry and the home-spot fallback: [RW08](WORK-ITEMS.md#rw08-explore-and-default-home-cutover).
- A collection book that previews species not yet met, and chosen unlock goals: [RW10](WORK-ITEMS.md#rw10-collection-book-and-chosen-unlock-goals). Friends shows owned individuals only.
- Later forms, talents and the second-wave six: RW11 and the [cast](art-requests/CAST.md).
- The final species names, colours and the generated art itself: the [art request queue](art-requests/QUEUE.md) and the developer's decisions already recorded.

## Decisions for the developer

1. **Older development saves:** keep progress and meet the first friend again (this packet's rule, the cheaper one) or reject a version-2 save outright. Lean: keep.
2. **Suggested names per species:** the sprout keeps Pip, Mochi and Clover; the river and the glider each get three of their own, provisional until the cast's names are final (lean: yes; the typed name is always available).
3. **Not-yet-met species in Friends:** silhouettes with "not met yet" before RW10's book exists (lean: no; a silhouette is a goal, and goals are RW10's to preview).

The build uses the leans unless a decision says otherwise; nothing here waits on them.
