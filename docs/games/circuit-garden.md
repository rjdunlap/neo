# Circuit Garden

<!-- generated: from src/games/circuit-garden; edit the text below the end mark (npm run game-docs) -->

**ID:** `circuit-garden` · **Land:** Tinker Lab · **Ages:** pre-K–school · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** complete-circuit, cause-and-effect, observation

| Band | Levels, easiest first |
| --- | --- |
| pre-K | 1–3 |
| school | 1–3 |

| Level | Plays like |
| --- | --- |
| 1 | A way back: join the return gap |
| 2 | A switch changes it: see the lantern on and off |
| 3 | Mend the lantern: fill both gaps, then check it lights |

<!-- end generated -->

**Starts as:** pre-K–school

**Grows into:** drag a broad connector into the gap in a toy flower lantern's wire and watch the lantern light

## Design notes

*Levels 1–3 · [definition](../definitions/circuit-garden.md) · energy/waves slice E2.* A toy flower lantern sits on a toy battery. Level 1 "A way back": the supply wire is drawn but the way back has a gap; she drags (or taps, then taps) one broad connector into it and the lantern lights; Undo takes back one step, Put back returns a piece to the tray, and Done is there once a lit state has been seen. Level 2 "A switch changes it": she taps the switch and watches the light go off and on; Done appears once both states have been seen, and she may finish on either. Level 3 "Mend the lantern": two empty bridges (supply P–L, return R–N) and two tray connectors; a magnifier Check button sits between Help and Done, and Done appears only after a correct Check of the current board (any real edit, Undo or removal clears it); an early Done points at Check. The lantern is plainly a manufactured toy, never a claim that a living flower runs on a battery.

Rules (`src/games/circuit-garden/logic.ts`): a terminal graph where the lamp lights when the positive side reaches one lamp terminal and the negative side the other with the lamp itself removed, and any positive-to-negative bypass is rejected. Ranges pre-K and school {1,3}.

Misses and help: no misses at levels 1–2. At level 3 a wrong Check is one miss each, with a boing, "There is a break…" and the named break (supply first) plus a red pulsing outline on that bridge; after two wrong Checks that bridge glows and counts as its help identity once. Show me (the hand button, also the pause sheet's hint) counts one hint per help identity (return, show-on, show-off); at level 3 it fills supply then return, then points at Check or Done without a new hint; with nothing new it only points at Done. Touch demonstration on the how-to card (`touchDemo`); challenge `noticing`; no off-screen suggestion, since practical electrical cards need a named reviewer. In Tinker Lab.

Deviations from the definition: level 3 *Mend the lantern* (two gaps, Check, misses, automatic glow) is the definition's E3 and is not built.
