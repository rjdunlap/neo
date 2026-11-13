# 2026-11-12 — Roundup level 1 at lap: one animal at a time (PR #1594)

**Changed:** `roundup` level 1 (tap mode) at lap: one animal out at a time, the next 0.8 s after each goes home; the fifteen-second glow and thirty-second trot home count no hint at lap (`lapTap` in `logic.ts`). Toddler's level 1 is unchanged. The `arcade` suite plays level 1 at lap and toddler, and at lap checks one animal out, the glow, the trot home bringing out the next, and zero hints.
**Ran:** `npm run typecheck`; `npx vitest run src/games/roundup` (25 passed); `BROWSER_SUITE=arcade ARCADE_ONLY=roundup ARCADE_LEVELS=1` at lap and at toddler (saved [0,0] each, sticker saved).
**Not run:** `npm run build` (no shared files or assets changed); `fingerdemo` (the demonstrated action is unchanged); a portrait screenshot (existing-game tier).
