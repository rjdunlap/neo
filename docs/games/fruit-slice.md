# Fruit Slice

<!-- generated: from src/games/fruit-slice; edit the text below the end mark (npm run game-docs) -->

**ID:** `fruit-slice` · **Land:** Bubble Beach · **Ages:** toddler–school · **Challenge:** hands · **Plays by:** touch · **Ghost finger:** yes

**Skills:** fine-motor, sorting, counting, spatial-reasoning

| Band | Levels, easiest first |
| --- | --- |
| toddler | 1–2 |
| preschool | 2–4 |
| pre-K | 3–6 |
| school | 5–8 |

| Level | Plays like |
| --- | --- |
| 1 | Touch the fruit |
| 2 | Swipe across |
| 3 | Only the apples |
| 4 | Only fruit |
| 5 | Just enough |
| 6 | Two kinds, two numbers |
| 7 | One straight swipe |
| 8 | Pieces by twos |

<!-- end generated -->

**Starts as:** touch a fruit hanging at the top of its slow arc and it splits

**Grows into:** swipe across it, only one kind, only fruit, stop at the number and send the bowl, two kinds, one straight line through exactly N, and pieces by twos; a wrong cut bounces off with a boing, missed fruit drifts back, no clock

## Design notes

*After Fruit Ninja's Zen mode and Toca Kitchen's chopping board; [definition](../definitions/fruit-slice.md).* Big fruit lofts from a basket and hangs near the top of a slow arc (at least 1.6 s); a swipe across it splits it with a pop, drops and a rising pentatonic note. Nothing is timed and missed fruit drifts back down, so there are no bombs, lives or clock. Levels: 1 Touch it (any contact slices; a tap works), 2 Swipe across it, 3 Only one kind (the sign shows the kind), 4 Only fruit (a balloon or flower bounces off), 5 Stop at the number (the sign counts; the bowl lids when full and a tap sends it), 6 Two kinds (a row each, with its own count), 7 One straight line (draw one line that cuts exactly N fruit; it follows the finger from touch-down and cuts on lift), 8 Pieces by twos (each slice drops two pieces and the bowl counts by twos; the last sign is a still board of three pairs cut with the straight-line tool). Toddler 1–2, preschool 2–4, pre-K 3–6, school 5–8. A miss is one refused cut (wrong kind, not fruit, a cut past the sign or a finished row, or a level 7 line through the wrong number); one stroke counts at most one miss, and the right fruit in it still count. The refused fruit bounces with a boing and the pet says why; from the second miss the right fruit glows and counts one hint, and the pause sheet's "Show a hint" gives the same. Level 7 boards always have lines through N and N−1, and through N+1 only when N is below 4. Board box 820×400 units, translated and never scaled. Strokes end on pointer up, up outside or cancel. The ghost-finger bot waits until its 180-unit stroke is clear of other fruit. Nothing is saved and there is no couch play.
