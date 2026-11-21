# 2026-11-21 — The guest in the save (TotoLogic P1 slice 1)

**Changed:** `ProfileEntry.guest` (repaired to false unless exactly true, `updateEntry`, `Store.setGuest`), `isHiddenProfile` and `everyoneHidden`, `blankToFill` preferring a guest, backups and restore carrying `guest` (BACKUP_VERSION stays 3), the chooser hiding guests, "Add a player" clearing the flag (adoption is a rename), the grown-ups' page label. Nothing sets `guest: true` yet; slice 2 does.
**Ran:** typecheck; `npm test` (463 files, 17390 passed), including the new cases in `profiles.test.ts`, `chooser.test.ts` and `store.test.ts` (adoption is a rename, backup round trip); build; `BROWSER_SUITE=profiles` (pass, expected entry keys now include `guest`); `npm run test:offline` (pass).
**Not run:** no other browser suite (`phonefit`, `home`, `world`); no screen changed.
