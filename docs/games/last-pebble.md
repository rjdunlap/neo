# Last Pebble

<!-- generated: from src/games/last-pebble; edit the text below the end mark (npm run game-docs) -->

**ID:** `last-pebble` · **Land:** Puzzle Peaks · **Ages:** school–grown-up · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** planning, logic, looking ahead

| Band | Levels, easiest first |
| --- | --- |
| school | 1–4 |
| grown-up | 1–4 |

| Level | Plays like |
| --- | --- |
| 1 | Near the far bank: lay 1 or 2 stones to land on the far bank or three back (about 10 and up) |
| 2 | Across the stream: work backwards from the far bank to hit every stepping stone (about 10 and up) |
| 3 | Who goes first? choose to start or let the pet start, then reach the far bank (about 10 and up) |
| 4 | Bigger steps: lay up to 3 or 4 stones at a time, and choose who goes first (about 10 and up) |

<!-- end generated -->

**Starts as:** she and the pet take turns laying one or two stones forward along a stream of numbered stepping-stone spots (`1..T`); whoever lands on the far-bank stone `T` finishes the crossing.

**Grows into:** level 1 (*Near the far bank*, school about 10 and up, grown-up): three short crossings (`rem = 2, 4, 5`) so she discovers the `T - 3` stepping stone and sees why it forces a win; level 2 (*Across the stream*, school about 10 and up, grown-up): a full crossing from `pos = 0` on a stream of `7, 8, 10`, or `11` spots, working backwards in threes from the far bank. A wrong move at level 1 or a pet win at level 2 plays a *show me why* reply and rewinds to the turning point. Level 3 (*Who goes first?*, school and grown-up, about 10 and up): three crossings with takes of `1..2`, one stream per remainder mod 3, where she first taps *I go first* or *Pet goes first* (a wrong starter, or a missed stepping stone, ends in a pet win that steps back to the choice or the turning point and lights the stepping stones once). Level 4 (*Bigger steps*): two crossings with takes of `1..3` and `1..4` shown as a row of stones beside a four-row stream (`T` up to `16`), one that wants her to go first and one that wants the pet to. One sticker per round; upright phone ready (`128`-unit spots, `65.0` CSS px at `390 × 844`).

## Design notes

*Levels 1–2 · strategy-games SG3, batch `last-pebble 1`, 2026-11-24; [definition](../definitions/last-pebble.md).* Pure Nim / *Got It* stepping-stone model in `src/games/last-pebble/logic.ts` (`MAX_TAKE = 2`, period `3`, `steppingStones`, `isSteppingStone`, `bestMove`, `petMove`, `turningPoint`, `streamLayout`).

- **Level 1 (*Near the far bank*):** three crossings (`rem = 2, 4, 5`) with `T` drawn from `{6, 7}`, `{7, 8}`, `{8, 9}`. A wrong move plays the pet's honest reply (`lp.could-reach`, `lp.leave-three`, `lp.took-stone`), highlights the deciding stone or far bank, and rewinds only to the turning point (preserving an earlier good `T - 3` stone). Each wrong move counts a miss (`missOnRequest`), glowing the winning spot after two misses on a crossing (one hint).
- **Level 2 (*Across the stream*):** one full crossing from `pos = 0` with `T ∈ {7, 8, 10, 11}`. The pet plays `bestMove` off stepping stones and hashes deterministically on stepping stones (`petMove`). If the pet reaches `T`, the far bank glows with the pet's paw ring (`lp.got-bank`), counts one miss (`missEvery`), rewinds to `turningPoint(moves).from`, and glows on every second miss.
- **Help (`Show me`) & controls:** `Show me` glows `pos + bestMove` (`lp.hint-reach` / `lp.hint-step`); if called while in a losing position at level 2, it rewinds immediately to `turningPoint(moves).from` (`lp.hint-rewind`) and glows the winning stone there. A second `Show me` tap while glowing plays the spot with no extra hint. Taps on laid or out-of-reach spots (`<= pos` or `> pos + 2`) wobble (`lp.pick-ahead`) and count nothing.
- **Upright phone layout:** continuous winding S-path (`4` columns × `2–3` rows) of `128 × 128` spots (`65.0` CSS px at `390 × 844`), clear of Home/`?`, the corner guide, and the caption strip across `UPRIGHT_VIEWS`, `short`, `shortPhone`, and all 4 landscape views (`upright.test.ts`, `grownup-thumbs.test.ts`). Stones show both colour and icon (star for hers, paw for the pet's) plus a corner spot number.
- **Levels 3–4 (*Who goes first?*, *Bigger steps*) · strategy-games SG3b, batch `last-pebble 2`, 2026-11-24 (PR #2152; [definition](../definitions/last-pebble-3-5.md)):** `goFirstWins`/`bestChoice` (the first player wins unless `T` is a multiple of `maxTake + 1`), `stoneSpots`, `choiceLayout` and per-crossing `maxTake`/`choose` in `logic.ts`; levels 3 and 4 are one `playLevel2Move` flow with a `choose` phase before it. The two choice buttons (`240 × 180` units, stone icon plus words) sit over the dimmed middle of the board; the take is a row of her stones beside the stream (below it upright). A pet win with no turning point (her pick was the mistake) lights the stepping stones, says `lp.why.*`, lifts the stones and returns to the choice, counting one miss with a glow on every second; *Show me* on the choice screen glows the right button and a second tap plays it. `streamLayout` already handles four rows (`T <= 16`) in every view (`upright.test.ts`).
- **Follow-up (queued):** level 5 (*Last stone loses*, misère), batch `last-pebble 3`, [defined](../definitions/last-pebble-3-5.md#level-5-last-stone-loses-misère).
