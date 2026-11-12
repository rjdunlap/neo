# 2026-11-12 — melt-freeze level 5: one big ice cube (PR #1574)

**Changed:** Level 5 leads lap's order [5, 1, 2]. The cube waits for three playfield touches. Each gives an immediate sound and shrinks the cube, and the snowflake appears after the melt animation. Tapping the snowflake freezes the puddle and completes the round with zero misses and hints. The how-to and ghost finger follow those steps.

**Ran:** Typecheck, 49 rule and registry tests, game-doc regeneration, `BROWSER_SUITE=meltfreeze MELT_LAP=1` and `BROWSER_SUITE=fingerdemo FINGER_ONLY=melt-freeze FINGER_LEVELS=5 FINGER_BAND=lap`. The filtered play checked taps on and off the cube, the snowflake's timing, freezing, and the saved sticker. Reviewed the 390 × 844 opening screenshot.

**Not run locally:** Other browser levels, production build and offline checks. The two new spoken lines use device speech.
