# 2026-11-18 — Talk cards build 2, the Shell Rows, Maker Lane and Puppet Stage cards (PR #1804)

**Changed:** Three cards join `TALK_CARDS` in `src/content/talk.ts` (Shell Rows' "Two table games" with its Nim source sentence, Maker Lane's "Where did it begin?" and Puppet Stage's "A sofa puppet show", the last two with under-two lines), wording copied from the definition. The under-two test now reads the real Maker Lane and Puppet Stage cards at lap, toddler and preschool instead of a stub, and new tests check that a card with no borrowed idea has no source sentence and that the table holds exactly the six defined cards. No panel, save or game change.

**Ran:** `npm run typecheck`; `npx vitest run src/content src/parent` (26 files, 246 passed, 1 skipped). The tests bite: "This protects {name} from adverts." in Maker Lane's card and "a pebble" in Puppet Stage's under-two line each failed the copy test, then were restored.

**Not run:** Build, any browser suite (the `talkcards` case is unchanged and already recorded), offline. Not checked: a phone-width reread of the three new cards on the rendered page.
