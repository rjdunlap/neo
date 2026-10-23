# Little surprises: a three-game mix and its lifecycle (definition D2a)

Defined 2026-10-17 as action **D2a** of the [discovery actions](../ROADMAP.md#discovery-actions), from the [discovery study](../DISCOVERY.md#a-round-boundary-that-keeps-the-groove). D2b built 2026-10-20 on the leans below, with one deviation: the result’s All done (and a pause-sheet skip of the last stop) goes to the home spot, where the ending sheet opens, instead of drawing the ending over the last result. The source audit used base `d0d5b65` (`src/app/discovery.ts`, `src/content/discovery.ts`, `GameScene.ts`, `PlaceScene.ts`, `SubjectPlaceScene.ts`, `origin.ts`, `pause.ts` and the three games' level tables). Built as D2b. The [open decisions](#open-decisions) each have a lean, and none gated D2b.

This is a shell feature, not a game. It adds no game ID, no learning claim, no level, no how-to card and no ghost-finger bot. Each stop is an ordinary round of an existing game, with that game's own goal, card, demo, accounting and sticker.

## What it is

**Fun action:** on her home spot, a lap or toddler child taps one pictured spot and sees three games in a row: bubbles, the barn and the fruit basket. She presses Play, and each finished game leads straight to the next game's picture, with no trip back to the map. After the third game, a short ending shows the three games together, with the stickers she earned on them.

**Purpose:** a prepared short sequence for co-play at the youngest bands. A grown-up can start it, and the child moves through cause and effect, a familiar song and a hands-on toy without catalog work in between. The mix teaches nothing on its own; each game keeps its own learning purpose. It is the D2 concept from the study: one visible, finite three-game mix, held in memory only.

**Rework fit:** it is a navigation slice changed in place in the current home spot. It adds no collection, unlock, currency or bonus, so it cannot conflict with RW05–RW12. RW08 later moves its entry (see [couplings](#couplings)). There are no timers, lives, streaks, quotas, ads or guilt. Stopping after any game, or skipping every game, ends comfortably.

## Frozen pool, bands and levels

| Position | Game (stable ID) | Lap levels now | Toddler levels now | Finish |
| --- | --- | --- | --- | --- |
| 1 | Bubble Pop (`bubble-pop`) | ordered `[15, 1, 2, 3]` (15 is the broad swat mode) | 1–6 | Ends itself at its target |
| 2 | Sing-Along Barn (`sing-along-barn`) | 1–2 | 1–3 | Ends itself when the song finishes |
| 3 | Fill and Dump (`fill-dump`) | 1–2 (tip-out, cannot go wrong) | 1–4 (3–4 count to a number) | Ends itself after the last dump or count |

- **The order is fixed:** Bubble Pop, then Sing-Along Barn, then Fill and Dump. It is the same reviewed pool as D1b, in the same pool order. The mix never substitutes another game, an older mode or a controller route.
- **Levels resolve at each launch, never in the preview.** The launch takes the current profile band, then `playBand`, then the module's ordered range, then `store.levelFor` with any valid pin. The source game's level and any one-round override never carry over. The mix never raises difficulty or moves a pin. Again and Next level work as they do today.
- **Who sees the entry:** only when the active profile's band is `lap` or `toddler`, the place on screen is that profile's own home spot (`place.band === profile.band`), and all three IDs are registered, touch-playable and support that band. If any check fails, the entry is not drawn. There is no partial mix.
- **None of the three makes a creation** today, so no pending Keep arises. The rule still applies if one ever does: as in D1b, Next stop, Skip and Home deliberately leave a pending Keep, never auto-save it, and add no confirmation.

## Screens and controls

All coordinates are logical units in the usable `view`, inside App's safe areas. The 1024-wide design area holds in both orientations. Every target is at least 100 units after scaling, and nothing scales down to fit. Pictures use each module's code-drawn hub icon, and text labels are only a supplement. Speech lines live in `voice-script.ts` (IDs [below](#voice)).

### Entry: the mix spot

- **Path layout (`PlaceScene`):** a **mix spot** stands first on the path, in the slot a `StorySpot` uses at Wonder Woods. It takes one step like a game, so no game's target shrinks. The lap and toddler places have no story spot, so the slot is free. Its art is a picnic blanket holding three small icons (bubble, barn, basket), the same footprint as a game landmark (`ICON_W` × `ICON_H`), plus a small three-dot marker. A first tap pokes it and opens the preview. It never shows the new-game Sparkle.
- **Subject layout (`SubjectPlaceScene`):** the same art, as the first item on the first page of the home shelf, where the Woodland Picnic card sits at school.
- The map stays the default start. There is no Mix button on the map, a land, the chooser or couch play.

### Preview sheet

A Pixi sheet over the home spot (scrim plus panel, inside that scene, with no new route). While it is open, the place's buttons and the pet are covered.

| Element | Landscape `1024 × 768` | Portrait `1024 × 1365` |
| --- | --- | --- |
| Back (round, arrow) | center `(65, 65)` | `(65, 65)` |
| Stop tiles 1–3, `220 × 220` | centers `(232, 300)`, `(512, 300)`, `(792, 300)` | same x, y `520` |
| Skip (`112 × 112`, hop-over arrow) | under the next-up tile, center y `470` | y `690` |
| Play (green circle, triangle, ⌀ 140) | center `(512, 640)` | `(512, 900)` |

- **Tile states** use pictures, not words:
  - Next up: bright, with a gentle bob.
  - Upcoming: bright and still.
  - Played: a small copy of the sticker from that position's first round in the tile's corner.
  - Skipped: dimmed, with a small hop-over arc. It carries no cross, frown or sound.
- **Hearing a tile:** tapping a tile speaks its title (`mix.stop`) and pokes it. It does not launch.
- **Play** launches the next-up position. **Skip** settles the next-up position as skipped and moves the highlight. When no upcoming position remains, Play and Skip are replaced by the ending ([below](#ending)).
- **Back** ends the mix and leaves her on the home spot as it was.

### Result during a mix

The existing celebration is unchanged: sticker, pet, discovery pill, Heart, Keep if any, green Again, orange Next level, and blue Home at their current centers. **Inside a mix, D1b's offer is suppressed.** The mix's controls take D1b's rectangles, so two "next" pictures never compete.

| Element | Rectangle (both orientations) | Notes |
| --- | --- | --- |
| **Next stop** tile | `(32, 24, 288, 112)` | The next upcoming game's icon on a pale **yellow** tile (D1b's tile is pale blue), with three progress dots and a travel arrow |
| **Skip** | `(32, 160, 112, 112)` | Hop-over arrow. It skips the shown next stop, and the tile then shows the one after |
| **All done** tile | `(32, 24, 288, 112)`, replacing Next stop when nothing is upcoming | The picnic blanket with three mini icons and a ribbon. Opens the ending |

- **Same input rules as D1b:** controls appear only once the result's buttons do, never during celebration animation or from the release that finished the round. A fresh press is latched once. Pointer cancel or a lost release does nothing. A key or pad change hides the touch-only controls.
- **Speech is sequenced after the result's own lines:** `mix.next` ("Next: {title}.") on display, or `mix.last` on the All done tile.
- **Again** and **Next level** keep the same position and its upcoming stops. They create a new round at that same position.

### Leaving a game during a mix

The pause sheet opens only from Esc or a pad, so on touch it cannot be a child's only way to skip. Instead, **while a mix is live, every route back to the home spot reopens the preview** at the next-up stop. This departs from the study, which has leaving end the first pilot's mix: touch Skip needs a screen to live on, and the preview is that screen. The preview's **Back** is the mix's **Explore**, so the roadmap's "Explore ends the itinerary" still holds there ([decision 4](#open-decisions)). The routes back are:

- the round's corner Home (the round is abandoned exactly as Home abandons it today);
- leaving the how-to card before Play;
- the result's blue Home.

From the preview she can Play again, Skip or press Back. Esc or a pad's pause sheet adds **Skip this game** through `Scene.pauseActions()`. It does the same as Skip on the abandoned stop and opens the next stop's intro, or the ending.

**Ending a mix:** the session ends when any scene enters other than the `GameScene` the mix launched or its origin `PlaceScene` (where the sheet reopens). That covers the preview's Back (Explore), the map, the sticker book, the chooser and pause-sheet routes without listing them. A profile switch, reset, restore or undo, and a reload also end it. A game opened any way other than the mix launcher is never in a mix.

### Ending

The same sheet geometry as the preview, opened over the last result or the preview:

- the three tiles in their final states, with played tiles showing their sticker copies;
- the pet's cheer and `mix.end` ("That was Little surprises!"), or `mix.end.quiet` ("We can play these another time.") when every stop was skipped;
- **Again mix** (the green replay circle, center `(372, 640)` landscape, `(372, 900)` portrait): a new session from position 1;
- **Home** (blue, center `(652, 640)` landscape, `(652, 900)` portrait): back to the home spot with the mix ended.

There is no bonus sticker, finale reward, score, tally of mistakes or "you finished" quota language. A tile copy shows a sticker she already owns; it awards nothing.

## Lifecycle

Three kinds of token keep three different kinds of settlement apart. They reuse the owner + epoch pattern of `DiscoveryMemory` (`src/app/discovery.ts`).

| Token | Made when | Settles | Guards |
| --- | --- | --- | --- |
| **Session** `S = { owner: store.data, epoch, id }` | The mix spot opens the preview, or Again mix starts a new session | Nothing to save; it ends | Any callback whose `S` is not live does nothing. Profile switch, reset, restore and undo bump the epoch; a reload loses the memory |
| **Item** `I[p]` for positions 0–2, stable within `S` | With the session | `upcoming → played` once, on the position's first completed round; `upcoming → skipped` once; `upcoming → unavailable` once if launch revalidation fails | A played item never becomes skipped or played again |
| **Round** `R` | Each legitimate launch: Play, Next stop, Again, Next level | Through the shell's existing `finish()`, once: ordinary sticker, stats, history and difficulty | A finish whose `R` is not the current round for `I[p]` in a live `S` changes no item state. The round's own settlement is the shell's as today, so the mix never settles it again |

### Events

| From | Event | Result |
| --- | --- | --- |
| Home spot, eligible | Tap the mix spot | New `S`, all items upcoming, preview with position 0 next up. Nothing saved |
| Preview | Play | Revalidate S, profile, band, registration and touch input. Latch, make a new `R`, launch `go.game(id, profileBand, undefined, false, { place: band })` |
| Preview | Skip | Next-up item becomes skipped. Highlight moves on, or the ending opens if none remain |
| Preview | Back, or any other route out | `S` ends. Completed rounds stay saved |
| Intro | Leave before Play | `R` is discarded with no stats. Back to the home spot, which reopens the preview (S live) |
| Round | Finishes (with or without help) | The shell settles `R` as today. If `I[p]` is upcoming, it becomes played. The result shows Next stop and Skip, or All done |
| Round | Corner Home | Abandoned as today. Back to the preview, where `I[p]` keeps its state: upcoming stays next up, played moves on |
| Round | Pause sheet's Skip this game | Abandoned. If `I[p]` is upcoming, it becomes skipped. **If `I[p]` was already played** (an unfinished Again or Next level round), only the extra round is dropped: `I[p]` stays played and is not counted twice. Then the next stop's intro opens, or the ending |
| Result | Again / Next level | New `R` at the same `p`. Upcoming items are unchanged |
| Result | Next stop | Latch once. `p` moves to the next upcoming item. New `R`, launch |
| Result | Skip | Next upcoming item becomes skipped. The tile shows the following one, or All done |
| Result | Home | Preview, S still live |
| Result | All done | Ending sheet |
| Ending | Again mix | Old `S` ends, new `S`, launch position 0 |
| Ending | Home | `S` ends. The home spot, sheet closed |
| Any | Launch revalidation fails (birthday band change, game gone, input changed) | Do not launch a different game behind its picture. `I[p]` becomes unavailable (drawn like skipped, no blame), `mix.changed` is spoken once, and the next stop is offered, or the ending |
| Any | Profile switch, reset, restore, undo, reload | Epoch bumped or memory lost. Late finishes, taps and speech continuations do nothing |

**What the mix never changes:** plays, misses, hints, history, difficulty, pins, stickers, the new-game Sparkle and the discovery journal. Only an ordinary finished round changes these, through `finish()`. Previewing, Skip, leaving and Again mix change navigation state only. Inside a mix, D1b's `discoveryMemory.last` is neither read nor written. D1b's offer comes back on the first ordinary result after the mix ends.

## What the rule tests assert

D2b puts the itinerary in a pure module (proposed `src/content/mix.ts`: the frozen pool, eligibility and a reducer `step(state, event)`). The tests assert:

- **Eligibility:** lap and toddler only; place band must equal profile band; a missing or unsupported ID gives no entry rather than a partial mix; there is never a controller route.
- **Order and tokens:** a complete run is 0 → 1 → 2 → ending. Next stop moves exactly once under a double press. A finish with a stale `R`, or after the session ended, changes nothing. Two finishes for one `R` settle the item once.
- **Skips:** skipping from the preview, from the result and from the pause sheet. An unfinished replay skip keeps played. Skipping everything leads to the quiet ending. Unavailable is treated like skipped.
- **Ending the session:** preview Back, entering any scene other than the launched `GameScene` or the origin `PlaceScene`, profile switch or epoch bump, and reload each end it with zero stat changes. Completed rounds stay saved.
- **Launch resolution:** a launch resolves the current band, order (lap Bubble Pop 15 first) and pin at that moment. A pin changed between preview and launch wins. A band changed by a birthday makes the item unavailable, never a silent substitute.
- **No reward from the mix:** a full run adds exactly one sticker per completed round, and the mix adds nothing on top.

## Bot, card and filtered check

- **No new ghost finger or card.** Each stop's own how-to card and demo run as today, governed by `settings.howToCards`. With cards off, each stop launches directly.
- **One new filtered flow:** `BROWSER_SUITE=discovery DISCOVERY_ONLY=mix`, added to `scripts/browser-check.mjs` and the README table:
  1. Use an isolated lap profile with cards on.
  2. Open the home spot. The entry is present at the path layout's first slot.
  3. Open the preview, tap a tile (it speaks and does not launch), then press Play.
  4. Finish Bubble Pop 15 with the bot or scripted taps. Check one sticker and the Next stop tile showing Barn. D1b's tile is absent.
  5. Press Skip. The tile shows Fill and Dump. Press Next stop and finish it. The ending opens with Bubble Pop's sticker, Barn skipped and Fill and Dump's sticker. Check that the save has exactly two new rounds.
  6. Start Again mix, then corner Home mid-round. The preview reopens with position 0 still next up. Press Back. The mix has ended, stats are unchanged, and the next ordinary Bubble Pop result shows D1b's offer again.
  7. Take one landscape and one portrait screenshot of the preview and of a mix result.
- **Unit tests** cover the subject layout, toddler ranges, pause-sheet Skip and the profile-switch branches.

## Voice

New lines in `voice-script.ts`:

| ID | Line |
| --- | --- |
| `mix.offer` | "Little surprises! Three games in a row." |
| `mix.stop` | "{title}." |
| `mix.next` | "Next: {title}." |
| `mix.skip` | "Okay, we'll hop over that one." |
| `mix.last` | "All done! Let's see." |
| `mix.end` | "That was Little surprises!" |
| `mix.end.quiet` | "We can play these another time." |
| `mix.changed` | "That one can't come today. Here's the next." |

The preview speaks `mix.offer` once on opening, then the next-up title. Nothing repeats on resize or idle frames.

## Couplings

- **D1b:** shares its pool, tile class, latch, input-in-use rule and launch call. Inside a mix, the D1b offer gate in `GameScene` (`canDiscover` / `syncDiscovery`) returns no offer, and the mix's result controls take D1b's rectangles.
- **D3:** a combined preview and introduction may later merge a stop tile with that game's card. D2a keeps the current full card on each launch, so D3 changes nothing here.
- **D5a and D7:** editing, rerolling and reordering stops, and other mixes, belong there. D2a's reducer should take its pool as an argument so D5a reuses it, but D2b ships only Little surprises. D5a is now defined in [make-my-mix.md](make-my-mix.md).
- **RW03 and RW08:** RW03's [navigation packet](../rework/HOME-NAVIGATION.md) relabels the result's blue Home as Back to its origin at RW08, and RW08 replaces the default home. The mix spot then moves to the new Home's creature-play or direct-play area, with the same origin and session rules. Until RW08, wording and placement stay as above.
- **Art:** the picnic-blanket spot and the yellow tile are Pixi `Graphics` in `palette.ts` colors and reuse the hub icons. No assets.
- **Couch, controllers and stories:** excluded. A story round is never a stop, and couch play never sees the entry.
- **Save:** none. No field, migration or backup change. A saved mix belongs to D5b.

## Check tier (D2b)

Shell and navigation tier:

- typecheck, unit tests (reducer, eligibility, layout fit) and build;
- `BROWSER_SUITE=discovery DISCOVERY_ONLY=mix` once, at an explicit strict-port URL, plus `DISCOVERY_ONLY=direct-next` for the shared tile code;
- `BROWSER_SUITE=world`;
- the production offline check, after confirming that the served hashed build matches `dist`.

Nothing for couch, picnic or a release sweep. Child understanding of Next stop, Skip and Next level, device speech and iPad reach stay [person checks](../DEVICE-CHECKS.md).

### Expected D2b files

- `src/content/mix.ts` and its tests.
- `src/app/discovery.ts`: a `MixSession` beside `DiscoveryMemory`.
- `src/app/scenes/PlaceScene.ts` and `SubjectPlaceScene.ts`: the mix spot and the preview and ending sheet.
- `src/app/scenes/GameScene.ts`: result controls, D1b suppression, Home and intro back to the preview, and the pause action.
- A small `src/ui/mix.ts` for the sheet and tiles if `src/ui/discovery.ts` does not stretch to them.
- `voice-script.ts`.
- `scripts/browser-check.mjs`, README, ROADMAP, VERIFICATION, and DESIGN only for the shipped contract.

## References

| Reference | Precedent | Puddle's reading |
| --- | --- | --- |
| [Just Dance 2023 playlist help](https://www.ubisoft.com/es-es/help/just-dance-2023-edition/gameplay/article/playlists-in-just-dance-2023-edition/000103702) | After results, a leader chooses Next Activity and can skip songs | Next stop waits for a press, and Skip is always available; there is no countdown |
| [WarioWare: Get It Together! (Nintendo)](https://play.nintendo.com/news-tips/game-releases/warioware-game-announcement/) | Short games strung together, and a separate Variety Pack | Borrow the string of short games, not its speed, lives or failure |
| [Khan Academy Kids](https://learn.khanacademy.org/khan-academy-kids/) | An adaptive Learning Path picks a next activity, beside a Library she can browse herself | Little surprises is authored, not adaptive, and Explore stays the default beside it |
| [YouTube Kids parental controls](https://support.google.com/youtubekids/answer/13877231) | Parents can disable autoplay, and kid accounts default to autoplay off | A counter-reference: the mix is finite and never starts the next item by itself |
| [Xbox Accessibility Guideline 116](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/116) | Give people time to read and act | Every choice waits indefinitely |

None of these shows that a mix improves learning. The study's [limits](../DISCOVERY.md#other-references-and-research-limits) apply.

## Open decisions

None of these gates D2b. Each has a lean the build follows unless the developer says otherwise.

**Decided 2026-10-23 (on the developer's delegation):** the leans stand: keep the name "Little surprises"; no grown-up switch to hide the mix spot (revisit with D8); its place after RW08 is All games' first page (built); Home during a mix reopens the mix preview.

1. **Name and picture.** "Little surprises", with a picnic-blanket spot. Lean: keep it. The title remains an exploration, like the rework's names.
2. **A grown-up switch to hide the mix spot.** Lean: none now. The spot is one optional tap and the map stays the default. Revisit with D8.
3. **Where the entry lives after RW08.** Lean: the new Home's direct-play area, decided in RW08 rather than now.
4. **Home during a mix reopens the preview instead of ending the mix.** This departs from the study's first-pilot rule. The pause sheet's Skip needs Esc or a pad, so on touch the preview is the only place for Skip. The preview's Back is the mix's Explore and does end it. Lean: keep this. The alternative is to end the mix on Home and accept that touch has no mid-round Skip.
