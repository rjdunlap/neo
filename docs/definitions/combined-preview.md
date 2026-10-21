# The stop card: a mix preview that is the game's own introduction (definition D3)

*Defined 2026-10-21, **built 2026-10-21 ([PR #701](https://github.com/rjdunlap/neo/pull/701))**; the wide fallback below is in use at 1024×768 (landscape overflowed by up to 116 without it) · originally docs only · source audit `22a52828` · chunk 19, [discovery action D3](../ROADMAP.md#discovery-actions).* This packet says what a D3 build session does. The packet below is the build brief and is now built. The research behind it is [Introductions: reduce duplication without losing support](../DISCOVERY.md#introductions-reduce-duplication-without-losing-support).

## What it changes, and what it does not

**The duplicate today.** With how-to cards on (the default), Little surprises asks for the same decision twice. She taps the mix spot, and the [preview sheet](little-surprises.md#preview-sheet) shows three stops with a green Play. She presses Play, and the game opens on its full how-to card, which has a second green Play. The same happens whenever a route reopens the sheet: the round's corner Home, the result's blue Home, or leaving a card before Play.

**Where no duplicate exists.** Two routes already go straight to a game's card and need no change:

- D1b's pictured **Next game** tile ([packet](../DISCOVERY.md#d1b-build-packet-one-direct-next-game)): it launches with `again = false`, and the target's card is the only screen before its round.
- The mix result's **Next stop** tile and the pause sheet's **Skip this game** (`launchMixStop` in `GameScene`): each goes to the next stop's card.

D3 therefore changes Little surprises only. The next-up stop's how-to card becomes the preview. It carries the mix's stops and Skip, and there is one Play.

**Kept exactly as it is:**

- When a card shows. `shouldExplain` and the grown-up switch `settings.howToCards` are unchanged. Every game still explains itself each time it opens. Remembering what she has already seen this session is [D4b](../WAITING-ON-DEVELOPER.md), a separate developer decision.
- `again` keeps its one meaning: the same game, straight after its own result.
- With cards **off**, the D2a sheet stays, because it is then the only screen before a stop. Nothing is duplicated, so nothing is removed.
- The D2a lifecycle tokens (session, item, round), its pool, the bands, the ending sheet, result controls and settlement rules.
- The card's contents: title and picture, the level line and its held arrows, the ladder, goal, steps, finish, note, the ghost-finger demonstration, Play and Back.

## Who owns the card

**`GameScene` owns the combined card.** It is already the one place that:

- resolves the band, pin and `store.levelFor` at launch;
- builds the card for that level, with the demo for the current input;
- steps the level with the held arrows;
- builds the round only on Play.

The stop card is that same intro (`HowToPanel` with `HowToIntro`), opened by a `GameScene` that holds a live mix round (`mixRound`, claimed from `mixMemory` as today). The mix supplies a small read-only description of its stops. It never draws its own copy of the card's goal, steps or demonstration.

This choice answers the packet's questions:

| Question | Answer |
| --- | --- |
| **How is a second card avoided after a launch?** | There is no second launch. The preview *is* the scene that will play the round, so Play calls `playFromIntro()` and builds the round in place, as it does today. No acknowledgment token is passed, no `go.game` argument is added, and `again` is never set to hide a card. |
| **Does the card agree with the launch after a pin, band or input change?** | The card and the round read the same `this.level` in the same scene. A held arrow changes both together, as today. A pin set on the grown-ups' page while the card is open does not redraw the card: Play builds at the card's level, and the finished round moves her saved level under the existing intro rule (a pin stays put). A birthday band change or a removed game is caught before the stop's scene opens, by the D2a revalidation (`launchMixStop`, `mix.changed`). The demonstration follows `pointerKind()` when the card opens, as every intro does. |
| **Is a round built behind the preview?** | No. `build()` runs only from `playFromIntro()`. |
| **Do looking and Back save anything?** | No. Looking, a stop tile's spoken title, the arrows and Back change no plays, misses, hints, history, difficulty, pins, stickers or Sparkle. Skip changes only the mix's item state, as in D2a. A round token made for a card that is left before Play is dropped with no stats, as D2a's "Intro: leave before Play" row already says. |

## The stop card

This is the ordinary intro card, plus one **stop row**. It appears only when all of these hold:

- the scene's `mixRound` is current (`inMix()`);
- the card is the intro, not the in-round "?" card;
- the input in use is touch or mouse. A key or pad change hides the row, under the D2a touch-only rule. Enter still plays and Backspace still goes Back.

### The stop row

The row sits directly above the Play and Back row, inside the card.

- **Three stop tiles**, `100 × 100` each, 12 apart, starting at the card's left text margin (x = 32). Each shows a module hub icon, drawn in its D2a state:
  - next up (this card's game): bright with an outline;
  - upcoming: bright;
  - played: that stop's sticker copy in a corner;
  - skipped or unavailable: dimmed, with the hop-over arc.

  A tap on any tile speaks `mix.stop` with that stop's title and pokes the tile. It never launches. The tiles reuse `src/ui/mix.ts` drawing at this size.
- **Skip**: the existing yellow hop tile, `112 × 112`, at the row's right end (right edge at `width − 32`). A stop card always shows an upcoming stop (Again and Next level set `again` and open no card), so Skip is always on it. On the last upcoming stop, Skip leads to the ending.
- **Row height:** 112 (the Skip tile), plus 18 above it. This height is counted in the card's fit loop as a fixed row. When the card does not fit, the order of giving is unchanged (the ladder is dropped first, then text steps down through `SCALES`). The stop row and the buttons are never dropped or scaled.

### Buttons and speech

- **Play** (green, existing): `playFromIntro()`, as today.
- **Back** (blue house, existing): in a mix this is the mix's **Explore**. It ends the session (`mixMemory.end()`, before the route, since `App` keeps a session alive across any scene that `holdsMix()`) and goes to the origin home spot with the sheet closed. This is what Back on the D2a sheet does today; the card took the sheet's place. The pet replays nothing before a round, so spoken support comes from the tiles and the picture.
- **The game's picture in the header**: a tap repeats the title line (`mod.titleLine`). This applies on every intro card, in a mix or not, and is the card's spoken replay. Today the picture takes no touch, and the 100-unit `ICON_BOX` is already big enough. The tap has a 400 ms cooldown and changes nothing else.
- **Opening speech:** the first stop from the mix spot says `mix.offer`, then the title line. A later stop card says `mix.next` with its title, in place of the plain title line. No new voice lines are needed.

### Skip on the card

Skip settles the shown stop as skipped. It uses the same `mixMemory.apply({ type: 'skip', p })` as the result's Skip, latched once on a fresh press, and does nothing on pointer cancel or a lost release. Then:

- If another stop is upcoming, `launchMixStop` opens that stop's card, with revalidation and `mix.skip` spoken first.
- If none is upcoming, it goes to the origin home spot, which opens the D2a ending sheet.

Skip is not a wrong answer, and it records nothing about the game.

### Layout

The card already fits a 1024-wide design area in both orientations. The stop row adds 130 units of height and nothing else.

| View | Expected fit with the row |
| --- | --- |
| Landscape `1024 × 768`, demo beside the text (card width 1000) | Text steps down, or the ladder drops, before anything else gives. Buttons and the row keep their size |
| Portrait `1024 × 1365`, demo above the text (card width 760) | Expected to fit at full text size for the three pool games' current levels (not yet measured) |

The build proves the fit for every pool game (Bubble Pop, Sing-Along Barn, Fill and Dump) at every lap and toddler level, in four views: landscape and portrait at 1024, and a phone's safe-area landscape and portrait. A card that still would not fit, and so would scale its targets below 100 units, fails the test. If landscape at 768 fails once the text reaches 0.7, the wide card (1000 across) takes the stop row into its Play and Back row instead, adding no height: the three tiles on the left, Back and Play moved right so Back's left edge clears the tiles by at least 24, and Skip right of Play. The portrait card keeps the row of its own.

## Routes in a mix, with cards on

This table replaces only the D2a rows that open the sheet. With cards off, D2a's rows stand as written.

| From | Event | D2a today | D3 |
| --- | --- | --- | --- |
| Home spot | Tap the mix spot | New session, preview sheet | New session. `mixMemory.launch(p = 0)`, then `go.game(stop 0, profile band, undefined, false, { place })`, which opens stop 0's card |
| Stop card | Play | (card Play after sheet Play) | Builds the round, as every intro does |
| Stop card | Back | Leave before Play: the home spot reopens the sheet | Ends the session (Explore). The home spot, sheet closed |
| Stop card | Skip | (on the sheet) | The next upcoming stop's card, or the ending sheet on the home spot |
| Round | Corner Home | Round abandoned; the sheet at the next-up stop | Round abandoned. The **next-up stop's card**: the same game again if it is still upcoming, the following one if this stop was already played. The ending sheet if none remain |
| Result | Blue Home | The sheet | The next-up stop's card, or the ending sheet if none remain |
| Result | Next stop / All done | Next stop's card / ending | Unchanged |
| Pause sheet | Skip this game | Next stop's card, or the ending | Unchanged |
| Ending sheet | Again mix | New session, stop 0 launched | New session. Stop 0's card (unchanged in effect) |

**How the routes are built.** The decision lives in `GameScene` and `MixHost`, not in `routes.ts`:

- **The card's Back is not `goHome()`.** Today the corner Home, the intro's Back and Backspace on the intro all call `leave()` → `goHome()`. In a mix, the intro's Back and Backspace on the intro get their own handler: `mixMemory.end()`, then `go.place(origin band)`. If they went through the mix-aware `goHome()` below, Back on an upcoming stop's card would reopen that same card and seem to do nothing.
- Only the round's corner Home and the result's blue Home go through `goHome()`, which asks the mix first. In a mix with cards on, it launches the next-up stop through `launchMixStop`, or goes to the place for the ending. Otherwise it goes to the origin, as today.
- `MixHost.start()` launches stop 0 instead of opening the sheet when `settings.howToCards` is on.
- `MixHost.resume()` opens only the ending sheet when cards are on. A live mix whose next stop is upcoming never stops at the home spot with cards on, because the routes above go past it.

These go through one pure function in `src/content/mix.ts` that the tests own: `mixReturn(state, cardsOn)` returns `{ kind: 'stop', p }`, `{ kind: 'ending' }` or `{ kind: 'sheet' }`.

**Session end is unchanged.** Any scene other than the mix's `GameScene` or its origin place ends the session. A stop card is a mix `GameScene`, so moving card to card keeps the session.

**A Home that returns the same game.** If she presses the corner Home mid-round, she comes back to that same stop's card while the stop is upcoming. This is the D2a behavior with the sheet replaced by the card: the stop's Skip and Back are both on that card, one press away. See [decision 1](#open-decisions).

## What the rule tests assert

In `src/content/mix.test.ts` (pure):

- `mixReturn` for every combination of state and cards setting:
  - cards off always returns `sheet`, or `ending` when nothing is upcoming;
  - cards on returns `stop p` for the next upcoming stop, skipping played, skipped and unavailable stops, or `ending`.
- A played stop is never returned as `stop`. A skipped stop is never offered again.
- Skip from a card settles the item once. A second Skip with the same token, or a stale one, changes nothing.

In `src/app/mix-flow.test.ts` (the existing scene-flow test): the [routes table](#routes-in-a-mix-with-cards-on), card to card, with the session kept and then ended by Back. One assertion: Back on an upcoming stop's card lands on the place with the session ended, not on the same card.

In a new `src/ui/howto-card.test.ts`, or a headless layout check if Pixi's text measurement allows it (otherwise one browser probe):

- The stop row fits as described in [Layout](#layout), with every touch target at least 100 units after scaling.
- Without a mix, the row does not exist, and the card's measured layout is unchanged.

In `src/content/howto.test.ts`: `shouldExplain` keeps its current table. D3 adds no input to it.

## Filtered browser check

Extend `BROWSER_SUITE=discovery DISCOVERY_ONLY=mix` and run it once, at an explicit strict-port URL, with an isolated toddler profile. The harness turns `settings.howToCards` off in `ready()`, so steps 1–5 must turn it back **on** afterwards, as D1b's flow did; otherwise the run never reaches a stop card. Step 6 is the existing flow's default:

1. Tap the mix spot: Bubble Pop's card opens with the stop row and a single Play, and no sheet appears. No round is built (`neo.scene.game` is unset).
2. Tap the Sing-Along Barn tile: its title is spoken and nothing launches. Tap the header picture: the title repeats.
3. Play, and finish Bubble Pop: one sticker. The result shows Next stop, as today.
4. Press the result's blue Home: Sing-Along Barn's card opens with the row (Bubble Pop's tile shows its sticker).
5. Skip on the card: Fill and Dump's card opens. Its Back ends the mix at the home spot with the sheet closed. One sticker in total, and Barn has no plays.
6. Again, with **cards off**: the mix spot opens the D2a sheet, as today.

Run `DISCOVERY_ONLY=direct-next` once too, because the tile and launch code are shared. Take one landscape and one portrait screenshot of a stop card.

## Check tier (the D3 build)

Shell and navigation tier:

- typecheck, unit tests and build;
- the two filtered `discovery` runs above;
- `BROWSER_SUITE=world`;
- the production offline check, after confirming that the served hashed build matches `dist`.

Nothing for couch, picnic or a release sweep. Child understanding of the stop row and Skip, device speech and iPad reach stay [person checks](../DEVICE-CHECKS.md).

### Expected files

- `src/content/mix.ts` (`mixReturn`) and its tests.
- `src/ui/howto-card.ts`: an optional `stops` field on `HowToIntro` (tiles, states, Skip, tap handlers), the stop row in the fit loop, and the header picture's tap.
- `src/ui/mix.ts`: the tile drawing at 100 units, shared with the sheet.
- `src/app/scenes/GameScene.ts`: the stops passed to `openIntro` in a mix, Skip from the card, Back as Explore, `goHome()` asking the mix, and the touch-only rule on the row.
- `src/app/mix.ts`: `start()` and `resume()` with cards on.
- `scripts/browser-check.mjs`, README's browser table, and ROADMAP, DESIGN (the shipped contract) and VERIFICATION at closeout.

There is no save field, no new route argument, no voice line, no asset and no game rule change.

## Couplings

- **D2a/D2b:** this replaces the sheet's role as a preview when cards are on. The sheet stays for cards off and for the ending. D2a's [decision 4](little-surprises.md#open-decisions) (Home reopens the preview) carries over, with the card as the preview.
- **D4b:** separate. If the developer later approves brief support for an introduced mode, a stop card may shorten under that rule. D3 neither assumes nor blocks it.
- **D5a and D7:** a chosen or shuffled lineup reuses the stop row unchanged, since the row reads its stops from the session.
- **RW03 and RW08:** when RW08 moves the mix entry to the new Home, the stop card goes with it unchanged. Only the origin changes.
- **Couch, controllers and stories:** excluded, as in D2a.

## Open decisions

None gates the build. Each has a lean the build follows unless the developer says otherwise. They are recorded in [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md).

1. **The corner Home mid-round returns to the same stop's card.** Lean: keep it, as D2a does with its sheet; Skip and Back are one press away. The alternative is that the corner Home always ends the mix, which leaves touch without a mid-round Skip.
2. **The header picture's tap on every intro, not only in a mix.** Lean: every intro. It is a spoken replay a child can find without reading, and it changes nothing else.
3. **Cards off keeps the D2a sheet.** Lean: keep it. Without a card the sheet is the only preview. Removing it would launch a round with no stop row and no Skip.
