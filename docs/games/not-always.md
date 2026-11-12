# Not Always

<!-- generated: from src/games/not-always; edit the text below the end mark (npm run game-docs) -->

**ID:** `not-always` · **Land:** Story Grove · **Ages:** pre-K–school · **Challenge:** logic · **Plays by:** touch · **Ghost finger:** yes

**Skills:** reasoning, claims, counterexamples, listening

| Band | Levels, easiest first |
| --- | --- |
| pre-K | 1–2 |
| school | 1–3 |

| Level | Plays like |
| --- | --- |
| 1 | Not all of them: tap the card that breaks each claim |
| 2 | Every one? Tap a card that breaks it, or stamp it true |
| 3 | Say it better: break the claim, then choose one true of every card |

<!-- end generated -->

**Starts as:** a friend on a crate claims something about a row of picture cards; tap the card that breaks it

**Grows into:** level 1 (pre-K, school): four cards and three "every" claims, tap the single breaker. Level 2: five cards (two rows in portrait), three claims with one or two true; tap a breaker (either of two is right) or press the stamp when the claim is true. Level 3 (school): break the claim, then pick one of three picture-sign mended claims, exactly one true of every card. A fitting card, a false stamp, a card tapped when the claim is true or a false mend is a miss; the friend, the sign and cards during the mend are free; two misses glow the target (one hint), Show me glows once per claim. Claims are about the cards on screen only. Story Grove

## Design notes

*Levels 1–3 · after the philosophy-and-reasoning study; [definition](../definitions/not-always.md).* A friend critter on a crate claims something about a row of picture cards, very sure of itself; the cards are one base creature varying only in colour (red, blue, yellow), hat, wings and spots, and claims are about the cards on screen only (no real-world claim, no *Can't tell yet*). Art is code-drawn; the wings are a custom white feathered pair (`wingsArt`) because Critter's own did not read at card size; the hat art is shared from `src/art/props.ts`.

Levels: 1 "Not all of them" (pre-K 1, school 1): four cards and three *every* claims; she taps the single breaker, and the sign changes from *all* to *not all*. 2 "Every one?" (pre-K 2, school 2): five cards (two rows in portrait or under 850 wide), three claims with one or two true; tap a breaker (either of two is right) or press the stamp, centred under the row, when the claim is true. 3 "Say it better" (school 3): break the claim, then pick one of three picture-sign mended claims, exactly one of them true of every card. Decoys: a false claim at level 1 and in level 2's one-true rows has a non-breaker that is the odd one out on another attribute; two-true rows relax this, since five distinct cards differ on just two dimensions. The first round of each level in a session is the authored one; rounds are seeded after.

Misses and hints: a fitting card, a false stamp, a card tapped when the claim is true and a false mend are each a miss. The friend, the sign and card taps during the mend are free (the friend and sign repeat the claim). Two misses on one claim or mend glow its target (one hint); Show me glows too, and counts one hint, once per claim or mend. One sticker per round. Voice lines `notalways.*` (including `too.*`, `mends`, `hint`, `done`; title clip `game.not-always` rendered). Story Grove is its home land (the 17th game, its second page). Not built: levels 4–6 (only the red ones count, show me why, both can be true), the question card and the "But what about…?" co-play role. Open: the device and person checks in DEVICE-CHECKS.

**A claim's line never holds the next claim (U7 fix batch 22, 2026-11-12).** `breaks.*` then `oops` (and level 2's `notalways.every`, level 3's `mend.right`) start as one chain that her next tap stops before `oops`. After the 0.4 s beat the next claim shows with input open; its read-out waits for the lines, the guide or her first tap, where a breaking card, a true stamp or the true mend goes ahead and anything else hears the read-out, no miss. The last claim's line is heard out. The ghost finger waits for an ask.
