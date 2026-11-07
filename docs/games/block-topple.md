# Block Topple

<!-- generated: from src/games/block-topple; edit the text below the end mark (npm run game-docs) -->

**ID:** `block-topple` · **Land:** Tinker Lab · **Ages:** preschool–school · **Challenge:** hands · **Plays by:** touch · **Ghost finger:** yes

**Skills:** estimation, cause-and-effect, prediction

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1–2 |
| pre-K | 1–4 |
| school | 2–5 |

| Level | Plays like |
| --- | --- |
| 1 | Big and close: pull back and let go to tip a big tower |
| 2 | Farther: how hard to pull, from the last arc |
| 3 | Over the hill: aim high enough to clear it |
| 4 | Hit it high: a short wide stack only tips from a bump high up |
| 5 | Count the basket: tip each stack, then count the fruit in the tray |

<!-- end generated -->

**Starts as:** pull a big springy sling back, let go, and a soft ball arcs into a block tower; the top tips onto a cushion and a bell rings

**Grows into:** levels 1–5: a short, thick tower close by (any shot is fine; it tells her what happened), a thin tower farther away, a thin tower behind a hill she must aim over, then three lines of a short wide stack, a tall thin tower and a wide stack, where only a hit high up tips a wide stack; a thump low on a tower wiggles it and says to try higher, never a miss, and after two thumps on a line a golden band shows how high to hit (a hint); a short, over or hill shot is a miss from level 2, and after two on a line a dotted arc shows a pull that works; at level 5 the same three lines drop red fruit into a tray, and she taps the number pad for how many fruits are in the tray (one miss per line, the pet counts aloud, a second wrong tap glows the right pad); preschool plays 1–2, pre-K 1–4, school 2–5

## Design notes

*After Angry Birds and Crush the Castle, with no enemies and no star ratings; Tinker Lab; levels 1–5 built ([definition](../definitions/block-topple.md)).* Pull a big springy sling back and let go: a soft ball arcs out, thumps a block tower, the top tips onto a cushion, and a bell rings or a sleepy friend giggles. Angle and how far she pulls both matter. A grab circle sits on the ball; a pull under the minimum just springs back with no miss. Rules are a toy model in `logic.ts` (the board is 860 × 600 units, never scaled; slow toy gravity; no air or spin). The ball's centre entering a block grown by the ball's radius is a hit (square corners). A hit tips the part of the tower from the lowest block it is high enough above (at least that block's width above its base) and everything on top of it; a hit too low is a **thump**: the tower wiggles and the pet says "Bump! Try higher up." A thump is never a miss (an experiment, as in Block Tower).

Level 1, **Big and close**: a thick three-block tower and a bell close by; any shot counts no miss, and a short, over or hill shot only tells her what happened (it can still earn the dotted path, counted as a hint). Level 2, **Farther**: a thin two-block tower farther off with a sleepy friend; level 3, **Over the hill**: a thin tower behind a hill, so a flat pull meets the hill. From level 2 a short, over or hill shot is one miss with a spoken reason ("Short! Pull a bit harder or aim higher.", "Over! A gentler pull.", "The hill's in the way. Aim higher!"). After two misses on a line, a dotted arc of a nearby working pull appears from her last pull (one hint per line); it never gives the shot. Three lines a round; when all have fallen the friends wave and one sticker follows, with or without help. Level 4, **Hit it high**: three lines of one stack each, an authored short wide stack (150-wide base, a 100-wide block centred on top, a pig), a seeded tall thin tower and a seeded wide stack. A wide stack only tips from a push at least 150 high (its top block's upper half or the friend); lower hits thump. After two thumps on a line (never misses) a golden band shows from the stack's lowest tipping height to its top (one hint per line). Level 5, **Count the basket**: level 4's three lines, with red apples drawn on the blocks (decoration only; flight and tipping are unchanged). After each tip the fruit hop into a woven tray, and three 110 number pads (the total and one either side, in seeded order) appear top-left; she taps how many fruits are in the tray. The authored line holds 2 fruit, a wide stack 1–2 and a tall tower 1–3, so a round's total is 4–7. A wrong count is one miss per line with a boing, and the pet counts the tray aloud, fruit pulsing ("{n} were in already." or "Let's count them together." on the first line, then each new fruit); a second wrong tap glows the right pad (one hint). Pads press on every tap, and the ghost finger taps the right pad. Preschool plays 1–2, pre-K 1–4 and school 2–5. Working pulls were measured as 38%, 32% and 23% of the sampled grid at levels 1–3, and the largest working windows are 41° × 60, 42° × 42 and 37° × 36 units. Pulling reuses Bouncy Launch's palm rejection and cancel handling; a fresh grab stops the spring-back tween.
