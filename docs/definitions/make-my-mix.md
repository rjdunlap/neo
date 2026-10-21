# Make my mix: choosing the mix's games, in memory (definition D5a)

Defined 2026-10-21 as action **D5a** of the [discovery actions](../ROADMAP.md#discovery-actions), from the [discovery study](../DISCOVERY.md#different-people-different-preferences) and the couplings that [Little surprises](little-surprises.md#couplings) (D2a) and [the stop card](combined-preview.md#couplings) (D3) left to it. The source audit used base `c8a4e8ac` (`src/content/mix.ts`, `src/app/discovery.ts`, `src/app/mix.ts`, `src/ui/mix.ts`, `src/ui/howto-card.ts`, `GameScene.ts`, `PlaceScene.ts`, `SubjectPlaceScene.ts`, `voice-script.ts`). Docs only: nothing is built. **Ready to build** as one shell/navigation slice. Each [open decision](#open-decisions) has a lean the build follows.

This is a shell feature, not a game. It adds no game ID, level, how-to card or bot. It saves nothing: a chosen lineup lives in memory for the current save object, and saving one is [D5b](../ROADMAP.md#discovery-actions).

## What it is

**Fun action:** a grown-up holds the picnic-blanket mix spot on a lap or toddler home spot, and a **mix table** opens. Its top row is the lineup: Little surprises' three pictures at first. Below are the pictures of every game she can play here. A tap on a picture puts that game at the end of the lineup. Dragging a lineup picture along the row moves it, and dragging it off the row puts it back. Play starts the mix with that lineup, through the same stops, cards, results, Skip and ending as today.

**Purpose:** co-play. A grown-up who knows what the child loves this week lines up up to five games, the same one twice if she wants, and hands over a mix the child moves through without the catalog. The mix still teaches nothing on its own, and each stop keeps its own learning purpose, card, accounting and sticker.

**Who it is for:** the grown-up beside a lap or toddler child, on her own home spot. The entry gate is unchanged ([decision 1](#open-decisions)). A child's tap on the spot still just starts the mix. The hold that opens the table is long enough that a small hand's tap or rest does nothing.

**Rework fit:** a navigation slice in the current home spot. It adds no collection, unlock, currency or bonus. RW08 moves the mix spot to the new Home, and the table goes with it (see [couplings](#couplings)). There are no timers, quotas or obligations. An unedited lineup is exactly Little surprises.

## What the audit found

D2b and D3 shipped a mix whose stops are fixed in code. The build changes these places. Each is an expected file below.

| Place (base `c8a4e8ac`) | Assumes | D5a change |
| --- | --- | --- |
| `mixGames(profileBand, placeBand, catalog, ids = MIX_IDS)` (`src/content/mix.ts`) | One lineup, all-or-none: one unplayable ID hides the entry | Kept for the entry's **default** check. Each stop is checked on its own with `mixPlayable` at launch, so an unplayable stop takes the existing `unavailable` path rather than ending the whole mix |
| `startMix(count = MIX_IDS.length)` | Three items | `startMix(ids)`: the items come from the lineup, and the session holds the IDs |
| `MixSession` (`src/app/discovery.ts`) | No IDs. Its stops are re-derived from `MIX_IDS` | Gains `ids: readonly string[]`, frozen when the session starts. Editing never changes a live session |
| `MixHost.mods` (`src/app/mix.ts`) | Fixed in the constructor from `MIX_IDS` | The spot's art and the entry check still use the default. The sheet reads the live session's IDs |
| `GameScene.mixSession()` | `mixGames(..., GAMES)` with the default IDs. The result's Next stop tile, the stop card's row (`stopRowFor`) and `launchMixStop` all read it | Reads `session.ids` and resolves each through the registry. D3's coupling note ("the row reads its stops from the session") becomes true only with this change |
| `MixSheet.layout` (`src/ui/mix.ts`) | Three tile centers `[232, 512, 792]`, 220 across | Tile size and centers come from the count ([below](#the-preview-and-ending-with-one-to-five-stops)) |
| `progressDots` | Dots at `(i − 1) × 22`, centered for three | Centered for any count: `(i − (n − 1) / 2) × 22` |
| `allDoneArt` | Three pictures at fixed offsets | Up to three pictures: the first three stops. The ribbon stays |
| `howto-card.ts`, inline stop row | `tilesEnd = 32 + 3 × STOP + 2 × STOP_GAP` | Uses the count. The inline variant is taken only when Back, Play and Skip still clear ([below](#the-stop-cards-row)) |
| `mix.offer` | "Three games in a row." | Count-free ([voice](#voice)) |

## The lineup

- **A lineup** is an ordered list of game IDs: 1 to `MIX_MAX = 5` entries. A game may appear more than once. Each entry is its own stop, with its own item and token, so the D2a reducer is unchanged: it already settles by position.
- **The default** is Little surprises: `MIX_IDS` in pool order.
- **The bound comes from the narrowest row that shows every stop:** the portrait stop card (760 across) holds five 100-unit tiles, 12 apart, beside the 112-unit Skip with 36 to spare (`32 + 5 × 100 + 4 × 12 = 580`, Skip's left edge at `760 − 32 − 112 = 616`). A sixth would overlap Skip, so the limit is five. A layout test checks every count from 1 to 5 in four views and fails rather than shrink a target below 100.
- **Never empty.** The last stop in the lineup cannot be dragged out: it slides back to its slot and the table says `mix.one` once. There is no empty state to recover from. Reset ([below](#the-mix-table)) returns to the default.
- **The pool** for adding is every registered `GAMES` module that `mixPlayable(mod, profileBand)` accepts (touch, supports her band and plays at it), and that her home spot shows, in the home spot's own order. The IDs come from the same list `PlaceScene` and `SubjectPlaceScene` draw from. No story round, couch route or `GROWNUP_GAMES` entry can be added. A rule test states this.

### Who holds it, and for how long

`MixMemory` gains one **lineup** beside the session: `{ owner: store.data, place: Band, ids }`.

| Event | The lineup |
| --- | --- |
| Opening the table | Starts from the held lineup for this owner and place, or the default |
| Any edit | Changes the held lineup at once. There is no separate save or cancel |
| Play on the table, the mix spot's tap, Again mix | A new session copies the held lineup's IDs. Editing later never touches that session |
| A session ends (Back as Explore, Home on the ending, leaving for any other scene) | Kept. The next tap on the spot plays the same lineup |
| Profile switch, reset, restore or undo (the save object changes) | Dropped with the session. The next owner starts from the default |
| Reload | Lost. It was never saved (D5b) |
| A held ID that no longer passes the pool rule (a birthday band change, a game unregistered) | Dropped when the table opens or the spot starts a mix. If none remains, the default comes back. Nothing is spoken: she never chose it |

Inside a live session, a stop that fails its launch check takes the existing D2a path: `unavailable`, `mix.changed`, then the next stop or the ending. It never plays a different game behind the picture.

## Screens and controls

All coordinates are logical units in the usable `view`, with the 1024-wide design area centered as `MixSheet` does (`ox = (view.w − 1024) / 2`). Every target is at least 100 units, and nothing scales down to fit.

### Entry: hold the mix spot

- **A tap** on the spot is unchanged: a new session with the held lineup (stop 0's card with cards on, the preview sheet with cards off).
- **A hold** of 0.6 s without moving opens the mix table. A ring fills around the spot's three-dot marker while the finger stays down, using the `HoldButton` ring's look. Moving past the path's scroll threshold cancels the hold, as it cancels a tap today, so scrolling the path never opens the table. A lift before 0.6 s is an ordinary tap. Pointer cancel or a lost release does nothing.
- **Subject layout:** the same hold on the shelf's mix card.
- The hold is a grown-up's door, not a lock. Finding the table by accident changes nothing about her progress, and Back closes it.
- **The grown-ups' page** gains one plain-HTML line beside its how-to cards switch: "Hold the picnic blanket on a little one's home spot to choose its games." `src/parent/panel.ts` stays plain HTML.

### The mix table

A Pixi sheet over the home spot, on the same scrim and panel as the preview. The place's buttons and the pet are covered.

| Element | Landscape `1024 × 768` | Portrait `1024 × 1365` |
| --- | --- | --- |
| Back (round, arrow, r 50) | `(65, 65)` | `(65, 65)` |
| Lineup slots 1–5, `130 × 130`, 16 apart | centers x `170, 316, 462, 608, 754`, y `190` | same x, y `260` |
| Play (green, ⌀ 140) | `(905, 190)` | `(512, 1220)` |
| Pool tiles, `130 × 130`, 16 apart, 5 per row | x `220, 366, 512, 658, 804`; rows y `400, 560` (10 per page) | same x; rows y `520, 680, 840` (15 per page) |
| Page arrows (r 50), only with a second page | `(60, 480)`, `(964, 480)` | `(60, 680)`, `(964, 680)` |
| Reset (held 0.6 s; the picnic-blanket icon, r 56) | `(512, 700)` | `(220, 1220)` |

- **Lineup slots** show a game's hub icon on a pale yellow tile, the picture a stop tile uses. An empty slot is a faint dashed outline, showing there is room. A tap on a filled slot speaks its title (`mix.stop`) and pokes it.
- **Moving a stop:** drag a filled slot along the row, using `src/engine/drag.ts`. The other stops slide to make room, and the drop takes the nearest slot (the nearest-target rule). There is no speech, only a soft pop.
- **Taking a stop out:** drag it below the row's band (more than 110 units under the row's center) and let go. It shrinks into the pool and `mix.out` is spoken. The last remaining stop slides back instead, with `mix.one`.
- **Adding a stop:** tap a pool tile. A copy flies to the first empty slot and `mix.in` is spoken. When all five slots are full, the tile pokes, the lineup gives one gentle wiggle and `mix.full` is spoken. This is not a wrong answer: no boing and no glow.
- **Pool tiles** show the hub icon on a pale blue tile, with a small count badge when that game is already in the lineup (1 to 5 dots, never a number to read). Pages turn with the arrows. A tile is never shrunk to fit more on a page.
- **Reset** holds for 0.6 s, so it is never a stray tap. It restores Little surprises and speaks `mix.reset`.
- **Play** closes the table and starts a new session with the lineup, exactly as a tap on the spot does.
- **Back** closes the table and keeps the lineup. No session starts.

### The preview and ending, with one to five stops

The sheet's geometry is unchanged except for the tiles. They are centered on x 512 at today's y (300 landscape, 520 portrait):

| Stops | Tile size | Gap | Centers (x, before `ox`) |
| --- | --- | --- | --- |
| 1 | 220 | — | 512 |
| 2 | 220 | 60 | 372, 652 |
| 3 | 220 | 60 | 232, 512, 792 (today) |
| 4 | 190 | 24 | 191, 405, 619, 833 |
| 5 | 150 | 18 | 176, 344, 512, 680, 848 |

Skip stays 112 across under the next-up tile. The bob, sticker copies and hop arcs scale with the tile, as `StopTile`'s `size` already allows. The ending's Again mix replays the session's lineup.

### The stop card's row

The row keeps D3's 100-unit tiles, 12 apart from x 32, with Skip at the right end. With five stops it is 548 wide.

- **Own row** (above Play and Back): fits every count from 1 to 5 on both card widths (760 and 1000).
- **Inline** (the wide landscape card, in the button row): `tilesEnd` comes from the count. The inline variant is taken only when Play's right edge clears Skip's left edge by at least 24. At five stops it does not (Play reaches 874, Skip starts at 856), so that card uses its own row and the fit loop gives text first, as D3 says. At four or fewer it fits.

The fit test from D3 runs for the default pool at 1–5 stops in all four views.

### The result

The result's Next stop tile and Skip are unchanged in size and place. The tile shows the next stop from the session's lineup. Its progress dots center on the count. All done shows the first three stops' pictures.

## Lifecycle additions

D2a's [events](little-surprises.md#events) and D3's [routes](combined-preview.md#routes-in-a-mix-with-cards-on) stand. These rows are added:

| From | Event | Result |
| --- | --- | --- |
| Home spot, eligible, no live session | Hold the mix spot 0.6 s | The table opens on the held lineup. No session. Nothing saved |
| Table | Tap a pool tile | Added at the end if a slot is free (`mix.in`), else `mix.full` |
| Table | Drag a stop along the row | Reordered |
| Table | Drag a stop off the row | Removed (`mix.out`), unless it is the last (`mix.one`, slides back) |
| Table | Hold Reset | The default lineup (`mix.reset`) |
| Table | Play | New session with the lineup's IDs; then exactly the tap-on-spot path |
| Table | Back | Table closes; the lineup is kept |
| Any | Profile switch, reset, restore, undo | Session and lineup both dropped |
| Any | Reload | Session and lineup both lost |

**What editing never changes:** plays, misses, hints, history, difficulty, pins, stickers, favorites, the new-game Sparkle, the discovery journal and the save. Only an ordinary finished round changes those, through `finish()`.

## What the rule tests assert

In `src/content/mix.ts` and its tests:

- **Lineup edits** are pure functions, `add`, `move`, `remove` and `reset`, over `readonly string[]`. `add` refuses a sixth entry. `remove` refuses the last. `move` keeps the length and the multiset. A repeated ID is two entries.
- **The pool rule:** `mixPool(profileBand, placeIds, catalog)` returns only touch modules that support the band and play at it, in the place's order, never a `GROWNUP_GAMES` ID. Lap and toddler only.
- **Repair:** `repairLineup(ids, pool)` drops IDs not in the pool, keeps order and repeats, and returns the default when nothing remains.
- **Sessions:** `startMix(ids)` makes one upcoming item per entry. A run over a five-stop lineup with a repeat settles each position once. Two entries of the same game each award their own round's sticker and nothing extra. A stale round token changes nothing, as today.
- **Isolation:** editing the held lineup while a session is live leaves `session.ids` and its items unchanged. A new owner starts from the default.
- **Launch check per stop:** one unplayable entry makes that position `unavailable` and leaves the others playable.
- **Layout:** sheet tiles for every count from 1 to 5, the table in four views (landscape and portrait at 1024, and a phone's safe-area landscape and portrait), and the stop card's row at every count. Each fails rather than draw a target under 100.

## Filtered browser check

One new filter, `BROWSER_SUITE=discovery DISCOVERY_ONLY=my-mix`:

1. Use an isolated toddler profile with cards on.
2. Hold the mix spot. The table opens with Little surprises' three games.
3. Tap a pool tile that is not in the lineup, and tap Bubble Pop again: five stops, one a repeat. Tap one more: `mix.full`, still five.
4. Drag the last stop to the front, and drag Sing-Along Barn off the row: four stops in the new order.
5. Play. Stop 0's card shows a four-tile row. Skip it, then play and finish the next stop. The result's tile shows the third stop.
6. Back on the next card (Explore). Tap the spot: the same four-stop lineup starts.
7. Switch to another profile and back. The spot plays Little surprises.
8. Take one landscape and one portrait screenshot of the table.

`DISCOVERY_ONLY=mix` reruns unchanged, because the default lineup must behave exactly as before.

## Voice

New lines in `voice-script.ts`:

| ID | Line |
| --- | --- |
| `mix.in` | "{title} is in." |
| `mix.out` | "{title} can rest." |
| `mix.full` | "That's five. Take one out first." |
| `mix.one` | "A mix needs one game." |
| `mix.reset` | "Back to Little surprises." |

The changed line:

| ID | Was | Becomes |
| --- | --- | --- |
| `mix.offer` | "Little surprises! Three games in a row." | "Little surprises! Games in a row." |

Lines that name the mix ("That was Little surprises!") keep the name for any lineup ([decision 2](#open-decisions)).

## Couplings

- **D2a/D2b and D3:** the default lineup must play exactly as today. Every rule, route and token there stands. D5a only feeds them a lineup.
- **D5b:** the held lineup is the thing D5b saves. D5a keeps it as plain IDs with a pure `repairLineup`, so D5b adds a bounded save field, migration and backup around it rather than a new model. D5a makes no save or resume claim.
- **D7:** a shuffle or pick-for-me can produce a lineup and hand it to the same `startMix(ids)`. Its scopes and empty-pool rules are D7's.
- **D8 and D9:** not touched. The map stays the default start.
- **RW08:** the mix spot moves to the new Home's direct-play area, and the table and the hold go with it. Only the origin changes.
- **Couch, controllers, stories and older bands:** excluded, as in D2a. The table is touch only. A key or pad press closes it as Back does.
- **Save:** none.

## Check tier (the D5a build)

Shell and navigation tier:

- typecheck, unit tests (lineup edits, pool, repair, sessions, layouts) and build;
- `BROWSER_SUITE=discovery DISCOVERY_ONLY=my-mix` once, then `DISCOVERY_ONLY=mix` for the unchanged default, at an explicit strict-port URL;
- `BROWSER_SUITE=world` only if `PlaceScene`'s touch routing changed beyond the hold;
- no offline check, because nothing is saved or added as an asset.

A grown-up finding the hold, and a child's reaction to a chosen mix, stay [person checks](../DEVICE-CHECKS.md).

### Expected files

- `src/content/mix.ts` and its tests: `MIX_MAX`, lineup edits, `mixPool`, `repairLineup`, `startMix(ids)`, per-stop playability.
- `src/app/discovery.ts`: `MixSession.ids`, the held lineup and its owner rule.
- `src/app/mix.ts`: the hold, the table's host, launch per stop.
- `src/ui/mix.ts`: the table sheet, count-based sheet tiles, `progressDots` and `allDoneArt`.
- `src/ui/howto-card.ts`: the count in the stop row and the inline rule.
- `src/app/scenes/GameScene.ts`: `mixSession()` from `session.ids`.
- `src/app/scenes/PlaceScene.ts` and `SubjectPlaceScene.ts`: the hold on the spot and its scroll cancel.
- `src/parent/panel.ts`: the one line.
- `voice-script.ts`.
- `scripts/browser-check.mjs`, README's browser table, and ROADMAP, DESIGN (the shipped contract) and VERIFICATION at closeout.

## References

| Reference | Precedent | Puddle's reading |
| --- | --- | --- |
| [Spotify: create and edit playlists](https://support.spotify.com/us/article/create-playlists/) | Add songs, drag to reorder, remove; the same song can appear twice | The lineup is a playlist of games. It never plays the next item without a press |
| [Khan Academy Kids](https://learn.khanacademy.org/khan-academy-kids/) | A Library beside an adaptive path | A chosen mix sits beside Explore and never replaces it |

None of these shows that a chosen mix helps learning. The study's [limits](../DISCOVERY.md#other-references-and-research-limits) apply.

## Open decisions

None gates the build. Each has a lean the build follows unless the developer says otherwise. They are recorded in [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md).

1. **Who sees the table.** Lean: unchanged from D2a, so only on a lap or toddler child's own home spot, as a grown-up's co-play tool. The alternative opens the mix spot and the table at every child band, so an older child can make her own mix. That widens D2a's reviewed-pool gate and its eligibility tests, and RW08 moves the entry anyway, so it is a separate decision.
2. **The name of an edited lineup.** Lean: it stays "Little surprises", and only the count leaves `mix.offer`. The alternative names an edited lineup "Our mix", with its own offer and ending lines.
3. **The bound.** Lean: five, derived from the portrait stop card's row. The alternative of three keeps every row exactly as built and reduces editing to choosing and ordering three.
4. **The hold as the door.** Lean: 0.6 s on the spot, with a line on the grown-ups' page. The alternative is a visible pencil button on the preview and ending sheets. With cards on, the preview sheet never shows before the first stop, so a pencil there would rarely be seen.
5. **A lineup's lifetime.** Lean: kept across sessions until the save object changes or the page reloads. The alternative is that each session starts from the default, so a chosen mix is one-shot.
