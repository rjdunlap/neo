# 2026-11-24 — Bubble Pop level 19 blow then pop (PR #2125)

**Changed:** `bubble-pop` level 19 (lap, placed after level 1 by `order`): a touch on empty space blows a bubble, a dragged finger blows a trail (`blowAlong`), blown bubbles float up and are tapped; eight pops, then the rainbow bubble. New mode card, how-to step, finish and note, three voice lines with `{pet}` (device speech, so no clip render).

**Ran:** `npm run typecheck`, `format:check`, `lint`; the full unit suite once locally (19,122 passing; the one failure was the voice-clip coverage test, fixed by giving the new lines a `{pet}` slot) and the targeted suites (`bubble-pop`, `content`, `voice-clips`) again after. A headless Chromium play at 390×844 (touch): level 19 started with no bubbles, a dragged swipe blew a trail of three, tapping the bubbles (and a swipe when none was showing) finished the round with the rainbow bubble, no page errors; one portrait screenshot looked right. `BROWSER_SUITE=fingerdemo FINGER_ONLY=bubble-pop FINGER_LEVELS=19 FINGER_BAND=lap` passed (the ghost finger swipes, then pops).

**Not run:** a real phone or a child (whether a lap child drags before she taps stays a person check), the offline suite, a palm-on-glass check (covered by `palmOnGlass`, not exercised), spoken lines on a device.
