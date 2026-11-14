# 2026-11-14 — Frog Hop say the numbers, dots and flowers (PR #1643)

**Changed:** landing numerals and a tally dot per hop at levels 3, 4 and 6, a spoken landing line and the croak on a right landing, dots under levels 1–2 and landmark flowers from level 3 (a scene layer; stickers, icon and hit areas unchanged).
**Ran:** typecheck; Frog Hop, content and registry unit tests (23 files, 259 tests); `BROWSER_SUITE=woods WOODS_ONLY=hop HOP_LEVELS=1,3,6` (spoken numerals, tally and landing line at add, back and big; portrait 768×1024 and phone landscape 844×390 screenshots at 1, 3 and 6); `BROWSER_SUITE=fingerdemo FINGER_ONLY=frog-hop FINGER_LEVELS=3`. All passed.
**Not run:** full `npm test`, build (no shared files or assets changed), offline.
