# Gear Garden

<!-- generated: from src/games/gear-garden; edit the text below the end mark (npm run game-docs) -->

**ID:** `gear-garden` · **Land:** Painted Canyon · **Ages:** lap–school · **Challenge:** space · **Plays by:** touch · **Ghost finger:** yes

**Skills:** cause-and-effect, simple-machines, gears, direction

| Band | Levels, easiest first |
| --- | --- |
| lap | 1 |
| toddler | 1 |
| preschool | 1–2 |
| pre-K | 2–3 |
| school | 3 |

| Level | Plays like |
| --- | --- |
| 1 | Turn a flower: tap two gears until the flower blooms |
| 2 | Bridge the gap: put the missing gear in, then turn |
| 3 | Two machines: pick one, mend it and see which way the flower turns |

<!-- end generated -->

**Starts as:** tap a machine of equal gears to spin a flower, drop the loose gear into a gap, then choose one of two broken machines, mend it and turn it, hearing whether the last flower turns the same way or the other way

**Grows into:** level 1 tap the machine to turn three flowers (two gears each); level 2 a gap to bridge; level 3 two machines of three or four gears, where three keep the handle's direction and four reverse it; a Turn-back button, no misses, one gentle hint per machine; taps or drags, in Painted Canyon

## Design notes

*After gear toys and the researched [machines-and-tools ladder](../deep-dives/subjects/machines-tools.md#gear-garden-first-games-proposed-ladder); [definition](../definitions/gear-garden.md).* A handle turns a row of equal gears and a flower at the far end. Level 1 *Turn a flower* (two gears, three flowers): a tap on the machine spins every gear and the flower blooms. Level 2 *Bridge the gap*: one gear is loose in a tray; she drops it into the gap (a short drop glides home) and the machine turns. Level 3 *Two machines*: two broken machines of three or four gears, she opens one, mends it and turns it, and hears whether the last flower turns the same way as the handle (three gears) or the other way (four). A Turn-back button reverses any machine at every level. Code-drawn art, a Kokoro clip for the title "Gear garden!" and no real-world words yet (bikes and clocks wait on the mechanism reviewer; levels 4-5 are the study's slice 5).

Misses: always 0, since turning a broken machine, a drop off the gap, pulling a gear out and opening the other machine are experiments. Help is at most one hint per machine: Show a hint, then the gap's glow after two still trials, then the gear going in by itself after two more; the round then finishes normally. Bands: lap 1, toddler 1, preschool 1-2, pre-K 2-3, school 3. Region `tinker-lab` (the subject), but the home land is Painted Canyon, since Tinker Lab is full at 14 games. A resize in the middle of a turn, hint or bloom waits for it; the gear is locked while it flies in. A ghost-finger bot plays levels 1 and 3. Co-play: ask which way the last flower will turn before the turn. Off-screen: line up chairs or cups and pass a clap along, asking whether the last one faces the same way.
