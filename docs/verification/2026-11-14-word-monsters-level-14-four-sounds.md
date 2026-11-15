# 2026-11-14 — Word Monsters level 14 Four sounds (PR #1693)

**Changed:** Ten pictured words with four separate sound boxes and five loose monsters. The narrow layout has two rows of monsters.

**Ran:** Typecheck, 15 Word Monsters rule tests, production build, links and diff checks. `BROWSER_SUITE=batch BATCH_ONLY=monsters MONSTER_LEVELS=14` completed a round with two wrong drops, the glow and sound-box hints, and a saved sticker. Reviewed the layout at 390×844 and 320×568 with touch emulation and the development upright override, plus 844×390 and 1024×768. `BROWSER_SUITE=fingerdemo FINGER_ONLY=word-monsters FINGER_LEVELS=14 FINGER_BAND=school` passed.

**Not run:** Offline or a real-phone speech check.
