# Play first, set up after (TotoLogic P1, definition)

*Status: defined 2026-11-21 (docs only). Slice 1 (the guest in the save) and slice 2 (the first-visit screen and the guest's round) built 2026-11-21: both slices are built.*

**Built:** slices 1 and 2, the guest in the save ([PR #1949](https://github.com/rjdunlap/neo/pull/1949)) and the first-visit screen and the guest's round ([PR #1952](https://github.com/rjdunlap/neo/pull/1952)); nothing is left to build here. Slice 2 departs from this page in one place: **Add me sits in the heart's place on a guest's result** (a purple plus, `RESULT_NAMES.addMe`), not as one more button, so `result-layout`'s fits need no new spot; a guest has no favorites shelf, so a guest cannot set a favorite during the guest round. The six also hides its Arcade/All games button for a guest, and the root's island link is hidden. The built code is `ChooserScene` (`FIRST_VISIT_PLACES` in `src/app/chooser.ts`), `firstDemoPick` in `src/app/daily-six.ts`, and the shell line `chooser.first` (a new slot-free line for the next Better voice batch).

From the [TotoLogic review](../reviews/TOTOLOGIC.md#p1-play-first-set-up-after-a-definition-then-shell-and-save-m), proposal P1. Someone handed a link to Puddle Island on a phone meets a form before a game. The [decision of 2026-11-17](../archive/DECISIONS-2026-11-17.md#phone-play) admitted P1 after [the question on screen](question-on-screen.md), with two rules fixed: the guest round **awards nothing until the blank profile is adopted**, and **adoption is a rename, not a copy**. This page settles the rest: when the first-visit screen shows, its age places and bands, which round is played, where the guest's round is kept, what the result offers, where the egg goes, and what the save does.

## What is there today (`origin/main` at `6d09a1f47`)

- **A fresh device has one blank profile.** `repairIndex` never leaves the index empty: a first run makes one `legacy` profile whose save is `neo.save` (`src/progress/profiles.ts`). `isBlankProfile(save, entry)` is true while it has no name, no owned creature, no birth, no `startBand`, no sticker and no game with `plays > 0`.
- **"Who's playing?" is the first screen everywhere.** The root's `start` route (shared with `classic/`, `src/app/routes.ts`) opens `ChooserScene`, which hides blank profiles and shows "Add a player" (`.chooser__add`). On a fresh device that button is all there is.
- **Add fills the blank profile.** The form (age chips from P2, an optional name) calls `create()`, which takes `blankToFill(items)` (the blank `legacy` profile first, so the first person stays at `neo.save`), selects it, sets the birth and name, and goes to `hatch`. The hatch ends at `hub`: Today's six on a phone (`App.phoneOnly`), Home elsewhere.
- **A round with no pet already works.** `makeGuide()` and `makeStar()` fall back to `STAND_IN` when there is no companion, so every game, large-pet games included, plays before a hatch.
- **A daily round records without adapting.** A card opened from `DailyScene` carries `{ daily: true }` and its preset level; `GameScene.finish` records it with `adapt` off, adds one sticker and flushes. Its result offers the next unplayed card of the six (`showDailyNext`).
- **The browser harness adds the first player through `.chooser__add`** (`addFirstPlayer`, `scripts/browser/fixture.mjs`), and `home-first-run` expects `HatchScene` after it.

## When the first-visit screen shows

- **At the root only, when every profile is hidden.** The root's `start` opens the first-visit screen instead of the plain chooser when no profile would show a card: each is blank (`isBlankProfile`) or a guest (below). That is the same set the chooser's `shown` filter leaves out, so the test is one exported function, `everyoneHidden(items)`, used by both.
- **Never on a device that is set up.** As soon as one profile shows a card (a birth from the form is enough, since P2 made the name optional), `start` is "Who's playing?" exactly as today. A family device never sees the first-visit screen again unless a grown-up removes every player.
- **`classic/` is unchanged.** Its `start` stays the plain chooser. It shares the profile index, so it hides a guest like a blank profile, and its "Add a player" adopts the guest (below).

## The first-visit screen

It is `ChooserScene` in a first-visit mode, so its scene name, gear, keys and the harness's `.chooser__add` stay as they are.

- **Three age places, as large cards** in one row sideways and one column upright, each at least 100 logical units after scaling, with immediate touch-down feedback:

  | Card | Band | Why |
  | --- | --- | --- |
  | Little one | `toddler` | A toddler round is easy and safe for any small child for one round, and needs no lap or grown-up hand as `lap` does. A birth typed at adoption moves the band at once |
  | Bigger kid | `school` | The school band covers about 6 to 12; one round is short enough that a 5-year-old is fine |
  | Grown-up | `grownup` | The developer, their wife and anyone they hand a link to; the caption ([question on screen](question-on-screen.md)) shows for this band always |

  `preschool` and `prek` have no card of their own: four cards make the column too tall for a 390-wide upright phone beside "Add a player", and the age typed at adoption sets the real band after one round.
- **Pictures, not reading.** Each card draws the stand-in friend's portrait (the chooser's `friend()` picture) at three sizes, small to large, with its word below. No new art.
- **One spoken line** when the screen opens, a new shell voice line with no slots ("Who's playing? Tap one!"), on device speech until a batch renders it.
- **"Add a player" stays**, smaller, below the cards, for a grown-up who wants to set up first. It opens today's form and adopts the guest if there is one.
- **The gear stays** (held, as now) so a grown-up can restore a backup before anyone plays.

## The guest

- **A tap on an age place makes the hidden profile a guest.** `blankToFill(items)` picks it (the `legacy` one first). Its index entry gets `guest: true` and its save's `profile.band` the card's band (`store.setBand`); `birth` and `startBand` stay null, so `effectiveBand` falls back to that saved band. The profile is selected through `selectPlayer` as any other.
- **`guest` is a bounded index field.** `ProfileEntry.guest: boolean`, repaired to `false` when missing or not `true` (`repairIndex`), written by `updateEntry`. A profile is **hidden** when it is blank or a guest; `isBlankProfile` itself does not change, so nothing that reads it today changes meaning.
- **Tapping an age place again** (the guest came back to the screen without adopting) reuses the same guest and sets its band to the new card's. There is only ever one guest: `blankToFill` prefers an existing guest over a blank profile.
- **A guest sees the six and its rounds, nothing else.** While the active profile is a guest, `hub` opens `DailyScene` on every device (not Home, Explore, the treehouse, the sticker book or couch play), and the six's Back returns to the first-visit screen.

## The guest's round

- **The first card of the band's six that has a ghost finger.** The guest's round opens the first pick of `todaysSix(day, upright, phone)` whose module sets `touchDemo`, at the level U5a gives a new player (the band's first level in play order). The how-to card and ghost finger then carry it with the sound off, which the review's after-play note asks for. It is opened as a daily round (`{ daily: true }`), so the rest of the six follows naturally.
- **The round records into the guest's save, as every round does.** `GameScene.finish` is unchanged: `recordRound` (adapt off, as for any daily card), `discover`, one `addSticker`, `flush`. A reload loses nothing.

### What "awards nothing until adopted" means here

The 2026-11-17 decision and AGENTS' one sticker per completed round meet like this: **the sticker is earned and kept in the guest's save, but nothing shows it as anyone's until adoption.** The celebration plays as for any round (the stand-in friend cheers and the sticker appears), and a guest has no sticker book, tray, journal or Home to see it in. At adoption the same save becomes the player's by the rename, so the sticker, the round's history and any discovery are simply theirs: there is no pending field, no second award and nothing to give twice, because the award happened once, into the save that is renamed. If the guest is never adopted, nothing is lost and nothing is owed: the guest stays hidden, and the next visit to the first-visit screen continues in it.

If the developer meant that a guest round stores no sticker at all, the build changes one line (skip `addSticker` while `guest`) and the rename rule is unaffected; this page takes the reading that keeps the one-sticker rule.

## The result: Keep playing and Add me

- **Keep playing** is the result's existing next-of-six tile (`showDailyNext`), unchanged.
- **Add me** is one more result button, shown only while the active profile is a guest, at the same size as the result's other buttons and inside `result-layout`'s upright and sideways fits. It goes to `start`, which opens the plain chooser with its add form already open (the first-visit screen's "Add a player" path). The form's Cancel returns to the first-visit screen, where the same age place continues the same guest.
- **No guilt.** No "your sticker will be lost", no count, no prompt after every round: Add me sits beside the other buttons on each guest result and is never spoken.

## Adoption is a rename

- **`create()` keeps its path** with one change: `blankToFill` prefers the guest, so the form fills the guest's profile. It sets birth and name as today and clears `guest`. Same id, same save key (`neo.save` for the `legacy` profile), same stickers and history; nothing is copied or moved.
- **The egg comes after the first round.** `create()` still goes to `hatch` (or the friend choice from 13, `skipsEgg`), then `hub`. Because the round came first, the pet is a reward for having played rather than a toll before it. The hatch's end (`hub`) is now an adopted player's: Today's six on a phone (with the guest's card already shown played), Home elsewhere.
- **Adopting from the plain chooser or `classic/`** (its "Add a player") also adopts the guest. It is one device with no accounts; a grown-up who wants a clean start removes the guest first (below).

## Grown-ups' page, backups and removal

- **The grown-ups' page lists a guest** in its player select as "Played as a guest (not set up)", beside today's "New player (not set up)" for a blank one, so it can be removed. Removal is today's `removeEntry`: the last profile is replaced by a fresh blank one, which is the reset path.
- **Backups carry the flag.** `BackupProfile.guest` is written when true and repaired to `false` by `parseBackup`; `BACKUP_VERSION` stays 3, since an older build ignores the field (it would show the guest as a nameless card, which development saves may do). `planRestore` treats a guest like any profile: replaced by id or added if there is room, and still hidden after the restore.
- **Profile isolation is unchanged:** the guest is an ordinary profile with its own save key.

## What this is not

- Not an account, a sign-up, a copy or a merge of saves.
- Not a change to a device that has a player: "Who's playing?" stays first there.
- Not a label the player sees: the word "guest" appears only on the grown-ups' page.
- Not a timer, a limit on guest rounds or a reminder to set up.
- Not couch play: the first-visit screen's cards open touch play only; couch play stays on each person's card once they exist.

## What the rule tests assert

In `src/progress/profiles.test.ts`, `src/app/chooser.test.ts` and the store's tests:

- `repairIndex` keeps `guest: true`, repairs anything else to `false`, and an index without the field loads with every profile not a guest.
- `everyoneHidden` is true for a fresh index (one blank profile), true with one guest who has played a round (a sticker and `plays > 0`), and false once any profile has a birth, a `startBand`, a name or is a non-guest with a round.
- `blankToFill` returns the guest when there is one, even beside a blank `legacy` profile; otherwise the blank `legacy` profile, as now.
- **Adoption is a rename:** after a guest round (one recorded round, one sticker) and `create()`, the profile has the same id and save key (`neo.save` when `legacy`), the same sticker and history, `guest: false`, the typed birth and name, and the index has the same number of profiles.
- **One sticker:** a guest round followed by adoption leaves exactly one sticker for that round.
- **The guest's game:** for each of `toddler`, `school` and `grownup`, on every day of a sampled year, upright and sideways, `todaysSix` has at least one pick with `touchDemo`, and the chosen first card is in the band.
- Backups: a guest survives `buildBackup` then `parseBackup`; a backup without the field restores with `guest: false`.

## Build slices, in order

1. **The guest in the save** (save, S; built 2026-11-21): `ProfileEntry.guest` with repair, `updateEntry`, backups and restore; `everyoneHidden`; `blankToFill`'s preference; the grown-ups' page label; adoption clears the flag. The chooser hides guests. No new screen yet. Tier (save): typecheck, unit tests, build, `profiles`, offline.
2. **The first-visit screen and the guest's round** (shell and navigation, M; after slice 1): the first-visit mode of `ChooserScene`, the root's `start` choosing it, the guest's `hub`, the first card, the result's Add me, the opened add form and its Cancel, the spoken line. Tier (shell and navigation): typecheck, unit tests, build, `profiles`, `phonefit`, `home` (its first run must still reach `HatchScene` through `.chooser__add`), `world`, offline. A browser play of the whole path on an upright phone size: first visit, Grown-up, one round with one wrong answer, Add me, adopt, hatch, the six with the card played; one portrait screenshot of the first-visit screen.

## Open for the developer (not blocking)

- **Whether a guest round should store its sticker at all** (see [above](#what-awards-nothing-until-adopted-means-here)); the build follows this page unless told otherwise.
- **Whether Add me should take the heart's place** on a guest's result (built so; the alternative is one more button if the fits allow it).
- **Whether three age places are enough** once someone has used it on a phone; a fourth (`prek`) is a one-row change if the column fits.
