# Starting view: Explore or Today's six (definition D8)

*Defined 2026-11-27 · docs only · chunk 19, [discovery action D8](../ROADMAP.md#discovery-actions) · its Play entrance is [Today's six](todays-six.md) (D10, built).* The source audit read `src/rework.ts` (the root's `hub`, `App.phoneOnly`, the one-shot `?daily` flag), `src/app/routes.ts` (`classic/`'s `hub` and `daily`), `ChooserScene.begin`, `beginGuest` and `create`, `src/app/chooser.ts` (`modeFor`), `src/app/players.ts` (`selectPlayer`, `playerChanged`), `DailyScene`'s Back, `HomeScene`'s exits, `src/progress/save.ts` (`settings`, `migrate`, `defaults`) and `src/parent/panel.ts` with `src/parent/copy.ts`.

This is a shell and save change, not a game. It adds no game, level, how-to card, voice line or bot.

## What it is

**For the grown-up:** one setting per player on the grown-ups' page, *Opens with*: **Home** (the default, today's behaviour) or **Today's six**. With Today's six, tapping that player's card on "Who's playing?" opens the day's six games straight away instead of Home (or the map at `classic/`). Back from the six goes to Home or the map as it does today, so nothing else moves.

**Purpose:** a family that mostly plays the six (the developer and their wife playtesting on a tablet or laptop, or a child who always taps the six first) skips one screen. Nothing is inferred from play, and the default stays Explore-first.

## Where it matters, and where it does not

| Place | Today after a card is tapped | With *Opens with: Today's six* |
| --- | --- | --- |
| The root on a phone (`App.phoneOnly`) | The six (the six is the whole root on a phone) | Unchanged: the six. The setting has nothing to change here |
| A guest (play-first) | A first round, then the six | Unchanged |
| The root on a tablet or computer | `HomeScene` | `DailyScene`, once |
| `classic/` | `MapScene` | `DailyScene`, once |
| A card chosen with keys or a pad (`modeFor` gives `couch`) | Couch play | Unchanged: couch play. Controller routes keep their meaning until controller migration exists |
| A new player (`create`) or a player with no friend yet | The hatch, which ends at `hub` | Unchanged: the hatch, then Home or the map |

So the setting is read in exactly one place: the island-mode branch at the end of `ChooserScene.begin`, where today it calls `go.hub()` for a player who owns a friend.

**Why Today's six is the Play entrance.** The roadmap row allows D2b's mix or D9's library. D9 is not built. D2b's Little surprises is for `lap` and `toddler` only and has no home spot at the root. Today's six works at every band, is on both route tables (`daily` in `routes.ts` and at the root), already has a Back to the hub off a phone, and is the entrance the phone playtests already use.

## The one-shot rule

The preference changes **the chooser's exit, never the `hub` route.** `hub` is also Home and Back: `DailyScene`'s Back calls `go.hub()` off a phone, as do Explore, the lands, the sticker book, the treehouse and a game's Home. If `hub` honoured the preference, Back from the six would open the six again and Explore would become unreachable.

The root's `?daily` query already works this way (consumed once, then `daily = false`), and D8 reuses the same idea without a flag: `begin` calls `go.daily()` instead of `go.hub()`. Every later `go.hub()` is the ordinary hub. Explore stays one tap away: the six's Back on a tablet or computer is Home, and Home's Explore is where it is today; at `classic/` the Back is the map.

## What is saved

One field in `SaveData.settings`, beside `placeLayout`, so a backup, restore, undo, profile switch and reset treat it as they treat every other setting:

```ts
settings: {
  // …
  /** Where tapping this player's card on "Who's playing?" opens (D8). Explore = Home at the root, the map at classic/. */
  startView: 'explore' | 'six';
}
```

- `defaults()` sets `'explore'`. `migrate` keeps `'six'` and repairs anything else to `'explore'`. **The version stays 3**, as with `briefResults`: an older cached build ignores the field, and a save without it reads as Explore.
- **Per person by construction.** It lives in the player's own save, so `selectPlayer` brings each person's own value with their save. Nothing else carries over: `playerChanged` already forgets the mix, the pick and every screen's remembered place, so the next person never meets the last one's lineup or queue.
- `save.test.ts` covers the default, repair of garbage (a number, an unknown string, a missing `settings`), survival through backup and restore, and that switching between two profiles with different values reads each one's own.

## The control

Plain HTML in `src/parent/panel.ts`, shown at the root and at `classic/`:

- A select in the "Finding games" section, labelled **Opens with**, options **Home** / **Today's six** (at `classic/`: **The map** / **Today's six**, wording from `src/parent/copy.ts`, as `findingCopy` already words that section per app). At the root the section is not shown today (`findingCopy` returns null), so the build shows the section at the root with this row alone.
- One muted note: "Where this player starts after tapping their card. Back from Today's six goes Home. On a phone Today's six is always the start." No claim about attention, habit or learning.
- Saving is the same `change` → `store.save()` as `placeLayout`. The page edits whoever it is pointed at, so it is per player like the rest.

## Not in this slice

- No change on a phone, for a guest, on the hatch path or for couch play.
- No Play choice on "Who's playing?" itself and no child-facing control: the card stays one tap.
- No other targets (the mix, a favourite, a land). Adding one later is a new value with its own row here; `migrate` already repairs an unknown value to Explore.
- No remembered "last screen" and no automatic switch after she plays the six often: the setting changes only when a grown-up changes it.

## Build slice (one session, save and navigation tier)

1. `startView` in `SaveData.settings`: type, `defaults`, `migrate` repair, `save.test.ts` cases above.
2. `ChooserScene.begin`: in island mode, for a player who owns a friend, `startView === 'six' ? go.daily() : go.hub()`. A unit-level check where the chooser's exit is testable (`chooser.ts`), otherwise the browser check below.
3. The grown-ups' page row and its copy in `copy.ts`, with a `copy.test.ts` case for both apps.
4. Checks: typecheck, unit tests, build; one filtered browser run that sets the setting, taps the card at the root (tablet viewport) and at `classic/`, sees the six, taps Back and sees Home or the map, then switches to a second player and sees Home. `world` is not needed: `hub` and every other route are unchanged. Offline only if the persistence code is touched beyond the new field.

**Exit evidence:** a player set to Today's six starts in the six and gets Home or the map on Back; a second player on the default starts where they always did; garbage in the field reads as Explore; a phone, a guest, a new player and a pad-chosen card behave exactly as before.
