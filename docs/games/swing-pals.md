# Swing Pals

<!-- generated: from src/games/swing-pals; edit the text below the end mark (npm run game-docs) -->

**ID:** `swing-pals` · **Land:** Rainbow Meadow · **Ages:** lap–school · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** cause-and-effect, patterns-of-motion, prediction, variables

| Band | Levels, easiest first |
| --- | --- |
| lap | 1 |
| toddler | 1–2 |
| preschool | 2–3 |
| pre-K | 3, 7, 4 |
| school | 4–8 |

| Level | Plays like |
| --- | --- |
| 1 | Push! |
| 2 | Push when they come back |
| 3 | Short rope, long rope |
| 4 | Swing together |
| 5 | Heavy or light |
| 6 | Big push, small push |
| 7 | Who comes back first? |
| 8 | Twice as quick |

<!-- end generated -->

**Starts as:** tap to push a friend on a tree swing until its feet ring the bell in the leaves; a push never lowers it and the bell stays lit

**Grows into:** a push that waits for the friend to come back, a short rope and a long rope (the short one comes back twice as fast), then tap the hook that makes her friend swing along with the pet's, whatever the friend's weight or push, guess which of two friends on different ropes comes back first, and pick the hook that swings twice or half as quick as the pet's

## Design notes

*After playground swings and NGSS 3-PS2-2 (patterns of motion); [definition](../definitions/swing-pals.md).* Push a friend on a tree swing until its feet ring the bell in the leaves. A swing's beat comes from its rope alone (hooks give 1.0, 1.5 and 2.0 s); the friend's weight and the height never change it, and a rule test asserts that. Levels 1–3 push: a tap pops a big mitten and raises the swing a quarter of the way to the bell, never lowers it, and before the bell a swing keeps its height; the bell latches, so a swing that rang stays done. Levels 4–6 choose a hook: the pet's swing is fixed, hers starts on another hook, she taps a hook and both swings let go together on "Ready… go!", swing for a short watch and settle; they match when the hooks are the same, measured by phase, so two matching swings at different heights are exactly together and every wrong hook visibly parts. Misses: none at levels 1–3 (any tap at any time, a tap while a push waits, pushing a swing that rang). At levels 4–6 the hook her swing starts on is a free look (the swings part and the pet says which way, no boing) and a repeat of a hook already tried says "We tried that one"; a different wrong hook is one miss, with a soft boing, the swings parting and the spoken reason ("Yours is quicker. Try a longer rope."), plus the weight line at level 5 and the height line at level 6. Hints: the right hook glows once two different hooks have swung apart on the line (the free look at the starting hook counts toward that, a repeat does not), counting one hint; as written in the definition ("after the second miss") it could never fire, so this is a deliberate choice, open to the developer. The pause sheet's "Show a hint" has the same glow at levels 4–6 and, at levels 1–3, has the pet give the next two pushes with her (a yellow-tinted mitten), one hint per request. Levels: 1 Push! (one swing, middle rope, every tap pushes at once, four pushes ring the bell), 2 Push when they come back (a tap waits for the back point, a "now" ring on the first two friends; seeded friends start still and the first push lands at once), 3 Short rope, long rope (two swings, two bells, push each half of the screen; the short one comes back twice for every long swing), 4 Swing together, 5 Heavy or light (friends of different weights), 6 Big push, small push (different release heights), 7 Who comes back first? (below), 8 Twice as quick (below). Lap 1, toddler 1–2, preschool 2–3, pre-K 3–4–7 (`order` 3, 7, 4), school 4–8. Each level's first line is authored; later lines are seeded, and a 500-seed test checks that no plan falls back. When every friend has rung (or matched) they line up along the grass and hop in turn, each ringing its bell note, then the sticker. Riders: bunny, duck, bear, mouse and frog, plus cat (light), dog (middle), pig and cow (heavy); levels 5–6 draw heavy friends from the wider pool, level 4 keeps same-kind pairs, and the sticker and hub icon stay on the original five. **Level 7, Who comes back first?** Two friends on two different hooks are pulled back; she taps the friend she predicts returns first (a paw marker), both let go, and the shorter rope's friend reaches the mitten first with a clap and a bright note while the slower one gets a soft note. A wrong guess is never a miss: the first friend is named ("{friend} came back first"), then "Shorter rope, quicker swing!", plus "Heavy or light, big push or small…" on a tempting race. Show a hint lights the shorter rope's strands before she taps, one hint per line. The first race is authored (mouse short left, bear long right, same height); seeded races have seeded sides and every round holds a tempting race (the heavier friend or bigger push on the shorter rope). **Level 8, Twice as quick** uses levels 4–6's hook interaction with a request per line (twice: pet long, hers short; half: pet short, hers long; together), shown as a dot strip under the pet's swing (big dots for the pet's returns, small for hers) and spoken per line. Claps fire only when both swings are back at once, her returns tap soft notes, and the watch is two of the slower of the pet's swing and hers. Misses as at 4–6: the starting hook is a free look, a repeat says "We tried that one", another wrong hook is one miss ("Not twice/half as quick yet. Try a shorter/longer rope."), and the right hook glows once two hooks have missed (one hint). Every round holds twice, half and together; the authored first line is bunny on long asking twice, her duck on the middle rope. Push rounds (levels 1–3) seed one leaf goal per round: bell, wind chimes, an apple that drops into a basket, or a bird's nest whose bird peeks out and tweets; the authored first round keeps the bell, and each rings the friend's note. Music is `STYLES.paint` (she is not making it). Co-play: one pushes, the other says "now!"; at levels 4–6 both guess the rope aloud first. Off-screen: swing a sock on a string short and long and count together. The ghost-finger bot times taps against the swing (levels 2 and 6 demonstrated). Nothing is saved, nothing is filed in the journal and there is no couch play.

**A right hook's line never holds the next pair (U7 fix batch 17, 2026-11-12).** At levels 4–6 and 8 the line starts and the friends hop off and the next pair or race comes in with input open, the lessons playing over it. Level 7's guess reaction does the same, and her next tap, a hint or the guide stops its remaining lines. Level 8's next request waits for the line, or is said at her hook tap or by the guide. The round's last line is heard out before the finale.
