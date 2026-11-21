# 2026-11-21 — Swing Pals files a discovery (PR #1946)

**Changed:** Swing Pals files the journal entry `swing-pals:longer-slower` once from a finished level 3 or level 7 round (`showsSlower`, `SLOWER`, `swingJournalPicture()`, `journal.swing.slower`); `JournalGame` gained `swing-pals`.
**Ran:** typecheck; full `npm test` (463 files, 17,382 passed, 1 skipped) with new rule tests (every authored and 200 seeded rounds per level: 3 and 7 file, others never; equal ropes never) and journal tests; `BROWSER_SUITE=swingpals` (levels 1, 6, 3, 7, 8; level 1 files nothing, level 7 files the entry); headless journal-scene screenshot of the new card at 390x844; `npm run build` (precache 1871 entries).
**Not run:** journal browser suite, `fingerdemo` (bot unchanged), offline.
