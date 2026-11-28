# Saved mix: keeping a chosen lineup and an unfinished mix (definition D5b)

*Defined 2026-11-27 · docs only · chunk 19, [discovery action D5b](../ROADMAP.md#discovery-actions) · follows [Make my mix](make-my-mix.md) (D5a, built) and [Little surprises](little-surprises.md) (D2a/D2b, built).* The source audit read `src/app/discovery.ts` (`MixMemory`, `HeldLineup`), `src/content/mix.ts` (`lineup`, `repairLineup`, `startMix`, `step`), `GameScene.finishRound` (the `recordRound`, `addSticker`, `mixMemory.finish`, `flush` run at about lines 844–873), `src/progress/save.ts` (`migrate`, `defaults`) and `src/progress/store.ts` (`save`, `flush`, `write`, profile switch, backup, restore, undo).

**Built 2026-11-28** (PR #2314) as one save/navigation slice, following every open decision's lean; see [DESIGN](../DESIGN.md#application-and-scenes) and the [verification entry](../verification/2026-11-28-saved-mix-d5b.md).

This is a shell and save change, not a game. It adds no game, level, how-to card or bot. It makes two things D5a deliberately left in memory survive a reload, a closed tab or a crash: **the chosen lineup** and **a mix she has started and not finished**.

## What it is

**For the grown-up:** the picnic-blanket table remembers the lineup she arranged, on that child's profile, until she changes or resets it. If the app closes in the middle of a mix, the next tap on the mix spot carries on with the stops not yet played, instead of starting over.

**Purpose:** co-play continuity. A grown-up who arranged five games should not have to arrange them again after the phone's browser reloaded the page, and a child who has played two of three stops should not repeat them. Each stop keeps its own learning purpose, card and sticker. Saving adds no reward, streak, reminder, countdown or "you left a mix" prompt: she meets the saved mix only by tapping the spot she already knows.

**The honest limit, stated on every screen's behalf:** the app saves *which stops are done*, never *where inside a round she was*. A round that was running when the app closed is not restored. Its stop is simply still to play, and a tap plays it from the beginning. No line, card or doc says a game "resumes" ([DISCOVERY](../DISCOVERY.md#what-the-island-does-today) records why `flush()` is not a durable receipt).

## What is saved, and what is not

One new bounded field in `SaveData`, beside `favorites`, so a backup, restore, undo, profile switch and reset treat it exactly as they treat everything else. There is no new storage key.

```ts
mix: {
  /** The lineup a grown-up arranged, per home spot (D5a). Absent = the default Little surprises. */
  lineups: { lap?: string[]; toddler?: string[] };
  /** The one unfinished Little surprises session, or null. */
  session: null | {
    place: 'lap' | 'toddler';
    ids: string[];                  // 1–5, frozen when the session started
    items: { s: 'u' | 'p' | 's' | 'x'; seed?: number }[]; // same length as ids: upcoming, played, skipped, unavailable
  };
}
```

| Kept | Not kept (and why) |
| --- | --- |
| The lineup per place band (`lap`, `toddler`): 1 to `MIX_MAX` IDs | The live round token, `at` and the pending launch: a round that was running is not restored, and the serial restarts |
| An unfinished session: its frozen `ids`, one state per stop, and the sticker `seed` of each played stop (the receipt, below) | A **Today's six** session ([D10](todays-six.md)): it is bound to a day and its own stops, so it keeps its in-memory rule and is never written here |
| | Which pool tiles were looked at, the table's page, a hold in progress, or anything about the table's open/closed state |

**Size and bounds.** At most two lineups of five IDs and one session of five items, a few hundred bytes. `migrate` repairs the shape and bounds only: an ID is a string of 1–40 characters from `[a-z0-9-]`; `lineups` keeps only the keys `lap` and `toddler`, each trimmed to `MIX_MAX` and dropped if empty; a session needs a valid `place`, 1–5 IDs, and an `items` array of the same length (shorter is padded with `u`, longer trimmed), each state one of the four letters, and a `seed` only on a `p` item, as a finite integer. Anything else becomes the default (`lineups: {}`, `session: null`). `defaults()` gains the empty field and `save.test.ts` covers the default, repair of garbage and of out-of-range lengths, survival through backup and restore, and profile isolation. **The version stays 3**, as with `briefResults`: an older cached build ignores the field, and a save without it reads as the default.

`migrate` does not know the game registry, so it cannot say whether an ID is still a game. **Registry and band checks run when the saved value is used**, with the rules D5a already has (`mixPool`, `repairLineup`, the per-stop launch check, below).

## Writing: one record, so the receipt cannot disagree

A completed mix round touches the history, the difficulty step, the sticker and the stop's state. These must never disagree after a crash. The audit shows they already run in one synchronous block in `finishRound`: `recordRound`, `addSticker` and `mixMemory.finish`, then `store.flush()`. `store.write()` hands the whole `SaveData` to one IndexedDB `set`, which is one transaction. So the rule is:

> **The stop's new state is mirrored into `data.mix.session` in the same synchronous block, before `flush()`, so the sticker, the history and the item receipt are in the same write.** After a crash or a lost write the reloaded save holds either all of that round or none of it. There is no new awaited step and no second key to keep in step.

The same holds for every other change: `MixMemory` mirrors each settle (`finish`, `skip`, `unavailable`) and each start, end or forget into `store.data.mix` and calls `store.save()` (debounced) like every other setting. Lineup edits at the table (`add`, `move`, `remove`, Reset) mirror the same way. `flush()` stays what it is, a request to start a write now; this definition does **not** claim it is awaited, and no screen waits for it.

**The item receipt.** A `p` item stores the `seed` of the sticker that round awarded, the same value as `addSticker(id, seed)`. On load of a saved session, a `p` item whose game has no sticker record with that `seed` (a hand-edited backup, a partial restore) is **repaired to `u`**: the stop is simply played again. The repair can never award anything, because a sticker comes only from a completed round. The opposite mismatch (a sticker with no item) cannot arise from the single write; if it does, nothing happens, since a played round never needs an item.

**Invariant.** A saved session always has at least one `u` item. The write that settles the last stop also sets `session` to `null`, so a reload on the ending shows nothing to resume. The ending itself is in memory, as today; **Again mix** starts a new session from the held lineup and saves it.

## Where a saved session starts, ends and returns

`MixMemory` stays the one owner of the live session. D5b adds two places it touches the save, both at a moment that already exists.

| Event | Live session | Saved `mix.session` |
| --- | --- | --- |
| A tap on the mix spot, Play on the table, Again mix | Starts as today (`start(owner, place, ids)`) | Written with the new session: `ids`, all `u` |
| A stop settles (played, skipped, unavailable) | As today | The item mirrored in the same call; the whole session cleared if none is left upcoming |
| Back as **Explore**, Home on the ending, any other leave that calls `end()` | Ended, lineup kept | **Cleared.** She chose to leave the mix, so it does not wait for her |
| Page reload, a closed tab, a crash, the OS ending the app | Lost, as today | **Kept.** This is the one case D5b adds |
| Profile switch, reset, restore, undo | `forget()` | Belongs to the save, so it goes with that save: the new save's own `mix` is read, a restore brings back the restored one |
| The next tap on the mix spot, Play on the table (no live session), by this profile | Hydrated from the save (below) | Unchanged until a stop settles |
| A birthday moves her out of `lap`/`toddler`, or the saved `place` is not her home spot's band | Not offered | Cleared the next time the spot is shown |

The mix spot is the only door. There is **no** "resume" button, banner or voice line on the map, and no new ring or badge on the spot. A saved session changes only what the existing tap does ([decision 1](#open-decisions)).

### Hydrating the saved session

When no live session exists for this save, the first tap on the mix spot (or Play on the table when it would otherwise start fresh) reads `store.data.mix.session` and, if it passes these checks, builds a live session from it:

1. `place` equals this home spot's band and the profile is still `lap` or `toddler`.
2. Each `ids` entry is resolved through the registry; an ID that is no longer registered, plays by touch, or plays at her band, makes that item `x` (unavailable). Nothing is substituted: the picture of a missing game never opens a different game.
3. Each `p` item's receipt is checked against the stickers (above); a failing one becomes `u`.
4. If no `u` item is left after 2 and 3, the saved session is cleared and the tap starts an ordinary new mix.

Then it launches the first `u` item through the same path a tap uses today: with cards on, that stop's own card; with them off, the preview sheet showing what is done and what is next. The session has `at: null` and a new serial, exactly like a fresh one. Stop tiles show played stops as played (with their stickers' pictures, as D2a draws them) and skipped stops as skipped. Nothing is spoken about "coming back".

**The table and the lineup.** Opening the table reads `lineups[place]`, repairs it with `repairLineup` against the pool, and shows it. A saved *session* does not appear in the table, which shows the lineup to edit. Pressing **Play** on the table starts a **new** session from the lineup and replaces any saved one. That is the grown-up's explicit "start over" ([decision 2](#open-decisions)). A lineup edit never changes a saved session, as it never changed a live one.

**Reset** (the held picnic-blanket on the table) removes `lineups[place]`, so Little surprises returns as the default. It does not touch a saved session.

## What saving never changes

Plays, misses, hints, difficulty, pins, stickers, favorites, the discovery journal and the new-game Sparkle change only through an ordinary finished round, as today. Hydrating a session launches a stop through the existing path, so each resumed round resolves its band, pin and level at launch, and a stop's help, card and result are exactly the ones an ordinary launch gives. Opening, editing and clearing a mix award nothing.

No timer, expiry, notification, streak or count. A saved session **never expires**: a mix left in March is still there in July, until she plays it out, leaves it with Explore, starts a new one from the table, or resets or restores the profile. The pet, treehouse and journal never mention it, and there is no unfinished-business marker anywhere ([AGENTS](../../AGENTS.md#rules-for-every-activity): nothing waits or accrues).

## Failure and boundary cases

| Case | Behavior |
| --- | --- |
| A crash after the round's write | The reload holds the sticker, history and the played item together: the mix carries on from the next stop |
| A crash before the write landed | None of the round, its sticker or the item exists: that stop is still to play, and a replay awards one sticker |
| A crash while a round was running | The stop is `u` in the save: it plays from its start |
| A removed or renamed game in a saved lineup or session | Dropped from the lineup (`repairLineup`); an `x` stop in a session. Never replaced by another game |
| Two tabs or two devices on one profile | Last write wins, as for every other field. D5b adds no merge |
| A backup made mid-mix, restored later | Brings back the lineup and the unfinished session, checked as above |
| Undo of a reset | Swaps the saves, including their `mix` fields |
| A save written by an older build | No `mix` field, so the default: no lineup, no session |
| A guest or a profile above `toddler` | The field exists but no mix entry shows, so it is never read |

## Checks and tier

**Docs first (this PR), then the build at the save and navigation tier**: typecheck, unit tests, build, one filtered browser flow, and the offline check, because persistence changed.

- **Unit (`save.test.ts`, `mix.test.ts`, `discovery.test.ts`):** default and repair of `mix`; bounds and padding of `items`; that a `seed` survives only on `p`; backup/restore and profile isolation; hydration table (place mismatch, unregistered ID, band change, receipt missing, nothing upcoming, one upcoming); that `start`, each settle, `end` and `forget` mirror into `data.mix` and call `save()`; that the last settle clears `session`; that Reset clears only `lineups[place]`; that hydration awards nothing and starts at `at: null`.
- **Crash boundary, with the store's storage double:** run a mix round's `finishRound` block, then take the stored value at two points: before the write fires (the old record) and after (the new one). Reload each into a fresh `Store` and assert that stickers, history length and the item agree: both old or both new. A third case replays the new record, finishes the next stop and checks one sticker per played stop in total.
- **One filtered browser flow (`BROWSER_SUITE=discovery`, a new `DISCOVERY_ONLY=saved-mix` filter, an isolated toddler profile):** arrange a four-stop lineup, play one stop to its result, **reload the page**, tap the mix spot, and see the second stop's card with the first marked played; finish it and check two stickers and no duplicate; reload on the ending and see a fresh new mix on the next tap. Then Back as Explore mid-mix, reload, and tap: a new mix, no resume. One portrait screenshot of the preview sheet with a played stop. `DISCOVERY_ONLY=my-mix` and `mix` rerun unchanged.
- **Offline:** `npm run test:offline` once, since a save field changed.
- **Not claimed:** how a grown-up finds or likes the behaviour, or a child's reaction. A phone playtest note answers the first ([parked checks](../DEVICE-CHECKS.md) keep the second).

### Expected files

`src/progress/save.ts` (field, default, repair) and its test; `src/app/discovery.ts` (`MixMemory` mirrors into the save and hydrates); `src/content/mix.ts` (a pure `hydrateSession(saved, catalog, stickers, band)` and its tests); `src/app/mix.ts` and `PlaceScene`/`SubjectPlaceScene` (the existing tap path asks the memory first); `GameScene` only where `mixMemory.finish` and the skip/unavailable calls already run (no new call sites); `scripts/browser-check.mjs`; at closeout ROADMAP, DESIGN (the shipped contract) and VERIFICATION.

## What it deliberately does not do

- No resume of a round inside a game, and no promise of one.
- No saved Today's six session, daily itinerary or pick-for-me result ([D7](../ROADMAP.md#discovery-actions) keeps its in-memory rule).
- No "continue" banner, badge, voice line, reminder, expiry or count.
- No saved table state, history of past mixes, naming or sharing of a lineup, or more than one lineup per place.
- No change to rewards, difficulty, favorites or the journal.

## Couplings

- **D5a:** this saves its `held` lineup as plain IDs, as D5a said it would, and reuses `lineup`, `repairLineup` and `mixPool` unchanged.
- **D2a/D2b and D3:** the session's rules, tokens and stop card stand. A hydrated session is an ordinary live session from its first frame.
- **D8 (starting view):** independent; a later "start in Play" would still reach the same tap.
- **RW08:** the mix spot moves to the new Home's direct-play area and takes this behaviour with it.
- **Couch, stories, older bands:** excluded, as in D2a.

## Open decisions

None gates the build. Each has a lean the build follows unless the developer says otherwise.

1. **How a saved mix is found.** Lean: the existing tap on the spot continues it, with no new control. The alternative adds a visible "Continue" and "Start over" pair on the preview sheet. With cards on the sheet never shows before a stop, so it would rarely be seen, and two buttons put a choice on a child's tap.
2. **Starting over.** Lean: Play on the table, Again mix and leaving with Explore start over, so the grown-up always has a way. The alternative is a held "start over" on the spot itself.
3. **Saving a lineup.** Lean: each edit is saved as made, as in D5a's held lineup, and Reset clears it. The alternative is a Save button with a cancel, which makes the table a form.
4. **No expiry.** Lean: none, per the project's rule that nothing expires. The alternative is to drop a saved session after a day, which would make the saved state depend on the clock.
