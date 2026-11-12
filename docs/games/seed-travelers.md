# Seed Travelers

<!-- generated: from src/games/seed-travelers; edit the text below the end mark (npm run game-docs) -->

**ID:** `seed-travelers` · **Land:** Rainbow Meadow · **Ages:** toddler–pre-K · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** science, observation, cause and effect, living things

| Band | Levels, easiest first |
| --- | --- |
| toddler | 1–2 |
| preschool | 1–3 |
| pre-K | 2–3 |

| Level | Plays like |
| --- | --- |
| 1 | A seed rides the breeze |
| 2 | A hitchhiker |
| 3 | Try both |

<!-- end generated -->

**Starts as:** toddler–pre-K

**Grows into:** tap the bellows and a fluffy seed drifts to the tray; later load a hooky seed on a furry critter, then try both seeds with either helper

## Design notes

*Levels 1–3 · slice 2 of the [life-science study](../deep-dives/subjects/life-science.md), [definition](../definitions/seed-travelers.md).* A lit patch, a tray and two kinds of seed: a fluffy plume that catches the wind and a hooky burr that catches on fur. Level 1 *A seed rides the breeze* (toddler 1, preschool 1): tap the bellows and the plume drifts in an arc to the tray; the bellows becomes Replay, and after the first arrival a bobbing Finish basket ends the round. Level 2 *A hitchhiker* (toddler 2, preschool 2, pre-K 2): tap the burr and it hops on a furry critter, a close-up shows the hooks in the fur, tap the critter and it walks to the tray where the burr drops off. Level 3 *Try both* (preschool 3, pre-K 3): a plume and a burr, a bellows and a critter; choose a seed and a helper in either order and the trip runs. A pairing that does not travel (the burr and the bellows, the plume and the critter) ends with the seed back on the patch and a spoken reason; each tried pairing fills a cell of a 2 by 2 picture board; the round ends when both seeds are in the tray.

**Misses and help.** No misses at any level: a seed that stays is a result, not a mistake. Show a hint counts once per support task; after two stays in a row the right helper glows for free. Replay is always free. The help glow does not take taps (it is `eventMode: 'none'`; found when a glow over the carrier swallowed taps).

**Registration.** Home land Rainbow Meadow (its 16th game; the lands test passes, so the Barnyard fallback is not used); region `tinker-lab`; challenge `noticing`; bands toddler 1–2, preschool 1–3, pre-K 2–3 (a school child plays the pre-K window). Voice lines `seeds.*` and `game.seed-travelers` (its title clip is rendered with Kokoro). Deviations from the definition: the toddler band has its own off-screen line ("Blow gently together like the wind...") because the off-screen test forbids "seed" under 3; `seeds.done` ("Both seeds made it!") is said only at level 3. The ghost finger plays levels 1 and 3. Rule tests: [`logic.test.ts`](../../src/games/seed-travelers/logic.test.ts) (58 tests across the plans, the compatibility table, hints and layout). Not built: levels 4 and up (the floating case and the two-destination graph are later study rungs). Known gaps: device speech and a child's reaction are unchecked.

**An arrival never holds the next seed (U7 fix batch 16, 2026-11-12).** `seeds.arrived.breeze` or `fur` starts as the seed lands and level 1's bellows and basket and level 3's next pairing open at once; `seeds.stayed.*` and the round's last arrival are still heard out. Level 1's "Tap the basket" waits for a line heard out, or is said by the guide, and is dropped once she taps the basket.
