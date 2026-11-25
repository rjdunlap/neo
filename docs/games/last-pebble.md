# Last Pebble

<!-- generated: from src/games/last-pebble; edit the text below the end mark (npm run game-docs) -->

**ID:** `last-pebble` · **Land:** Puzzle Peaks · **Ages:** school–grown-up · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** planning, logic, looking ahead

| Band | Levels, easiest first |
| --- | --- |
| school | 1–2 |
| grown-up | 1–2 |

| Level | Plays like |
| --- | --- |
| 1 | Near the far bank: lay 1 or 2 stones to land on the far bank or three back (about 10 and up) |
| 2 | Across the stream: work backwards from the far bank to hit every stepping stone (about 10 and up) |

<!-- end generated -->

**Starts as:** she and the pet take turns laying one or two stones forward along a stream of numbered stepping-stone spots (`1..T`); whoever lands on the far-bank stone `T` finishes the crossing.

**Grows into:** level 1 (*Near the far bank*, school about 10 and up, grown-up): three short crossings (`rem = 2, 4, 5`) so she discovers the `T - 3` stepping stone and sees why it forces a win; level 2 (*Across the stream*, school about 10 and up, grown-up): a full crossing from `pos = 0` on a stream of `7, 8, 10`, or `11` spots, working backwards in threes from the far bank. A wrong move at level 1 or a pet win at level 2 plays a *show me why* reply and rewinds to the turning point. One sticker per round; upright phone ready (`128`-unit spots, `65.0` CSS px at `390 × 844`).

## Design notes

*Levels 1–2 · strategy-games SG3, batch `last-pebble 1`, 2026-11-24; [definition](../definitions/last-pebble.md).* Pure Nim / *Got It* stepping-stone model in `src/games/last-pebble/logic.ts` (`MAX_TAKE = 2`, period `3`, `steppingStones`, `isSteppingStone`, `bestMove`, `petMove`, `turningPoint`, `streamLayout`).

- **Level 1 (*Near the far bank*):** three crossings (`rem = 2, 4, 5`) with `T` drawn from `{6, 7}`, `{7, 8}`, `{8, 9}`. A wrong move plays the pet's honest reply (`lp.could-reach`, `lp.leave-three`, `lp.took-stone`), highlights the deciding stone or far bank, and rewinds only to the turning point (preserving an earlier good `T - 3` stone). Each wrong move counts a miss (`missOnRequest`), glowing the winning spot after two misses on a crossing (one hint).
- **Level 2 (*Across the stream*):** one full crossing from `pos = 0` with `T ∈ {7, 8, 10, 11}`. The pet plays `bestMove` off stepping stones and hashes deterministically on stepping stones (`petMove`). If the pet reaches `T`, the far bank glows with the pet's paw ring (`lp.got-bank`), counts one miss (`missEvery`), rewinds to `turningPoint(moves).from`, and glows on every second miss.
- **Help (`Show me`) & controls:** `Show me` glows `pos + bestMove` (`lp.hint-reach` / `lp.hint-step`); if called while in a losing position at level 2, it rewinds immediately to `turningPoint(moves).from` (`lp.hint-rewind`) and glows the winning stone there. A second `Show me` tap while glowing plays the spot with no extra hint. Taps on laid or out-of-reach spots (`<= pos` or `> pos + 2`) wobble (`lp.pick-ahead`) and count nothing.
- **Upright phone layout:** continuous winding S-path (`4` columns × `2–3` rows) of `128 × 128` spots (`65.0` CSS px at `390 × 844`), clear of Home/`?`, the corner guide, and the caption strip across `UPRIGHT_VIEWS`, `short`, `shortPhone`, and all 4 landscape views (`upright.test.ts`, `grownup-thumbs.test.ts`). Stones show both colour and icon (star for hers, paw for the pet's) plus a corner spot number.
- **Follow-up (queued):** SG3b (levels 3–4: choose first/second player, variable `maxTake`, and misère *last stone loses*).
