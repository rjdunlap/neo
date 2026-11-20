# 2026-11-19 — Caravan Days upright on phones (PR #1883)

**Changed:** 
**Ran:** 
**Not run:** 
**Changed:** Caravan Days plays upright at every level (`upright: true`, levels 1–7). `roadLayout` in `logic.ts` was already pure and gained upright branches, all hung up from the bottom edge so a tall phone's spare height is sky. Levels 3, 5, 6 and 7 returned null or overlapped on the 768-wide upright area: level 3's 3-stop branches sat 114 apart (the map now stands on end, home at the bottom, the city at the top, branches as columns 178 apart); level 5's three boards were 150 wide on a 136 pitch (now 126 wide, loads lifted 120 and centred clear of the guide corner); level 6's five 110-unit day cards (614 wide) did not fit beside Go (now one row above Go, bands widened); level 7's 16-mark road put sites two marks apart overlapping at the bend's slant (bend radius 85 to 120, discs 100, left 185). Levels 1, 2 and 4 passed size checks but floated mid-screen.
**Ran:** `npm run typecheck`; eslint; Caravan Days and registry unit tests (92 passed) including the new per-level `upright.test.ts` (66+ seeds, every level, five upright views).
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=caravan-days`: levels 1–7 played through all bands by real touches, every level completes with one sticker; `PHONE_SHOTS` screenshots of levels 3, 5 and 7 viewed. Headless Chrome only.
**Not run:** build, offline, other suites (no shared files touched).
