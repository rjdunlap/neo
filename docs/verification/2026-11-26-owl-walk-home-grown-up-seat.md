# 2026-11-26 — Owl Walk Home grown-up seat (PR #2213)

**Changed:** Owl Walk Home levels 2–4: a seat button lets a grown-up take the pet's turns; their taps are never her misses or hints (`seatStep`, `partnerHops` in `src/games/owl-walk/`). Voice, how-to card and the shortlist suite's level 2 play updated.
**Ran:** `npm run typecheck`, lint, prettier, `npx vitest run src/games/owl-walk src/content` (30 files, 285 passed); `BROWSER_SUITE=shortlist SHORTLIST_ONLY=owls FROM_LEVEL=1 TO_LEVEL=4` passed on the head commit before the docs closeout (solo play at 1, 3 and 4 unchanged with their `[0, 0]` / `[2, 1]` scores; level 2 with the seat on, a wrong grown-up tap that left her counts alone, then the right stone), one 768×1024 screenshot of the seat button.
**Not run:** the full `npm test` (left to PR CI), `fingerdemo` (the ghost finger stays solo and the bot is unchanged), build, offline.
