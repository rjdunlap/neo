# Two Tablets

<!-- generated: from src/games/two-tablets; edit the text below the end mark (npm run game-docs) -->

**ID:** `two-tablets` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** deduction, pattern recognition

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–2 |

| Level | Plays like |
| --- | --- |
| 1 | Find the missing sound: match signs to sounds from the first tablet and read one group |
| 2 | Two unknown signs: read one group to learn a sign, then use it on the next |

<!-- end generated -->

**Starts as:** A scribe left two tablets: a line of picture-words with the island signs written under each, and a new line of signs nobody has read. She taps the first tablet's signs to drop their sounds into the key strip, finds the one sound the first tablet has not used, and reads one group of new signs by choosing the picture it spells. The learning is cross-referencing and elimination: a sign carries one sound and a sound sits in one sign.

**Grows into:** Level 2 leaves two signs unknown on both lines; reading the first group teaches a sign the second group needs. More cases (new sounds and words) are later slices, each needing its own enumeration test.

## Design notes

- Definition: [two-tablets](../definitions/two-tablets.md). A separate Lantern Lake puzzle for grown-ups, not River Tablets level 9. The sign shapes are invented, never real cuneiform or hieroglyphs. The rules (crib, solver `keys`, `consistent`, `readings`, `judge`, `readingHint`) are in `logic.ts` and are proved by an exhaustive count over all 40,320 sign-to-sound assignments: level 1's crib leaves one, level 2's leaves two, and every group has exactly one readable picture.
- A miss is a Read it press where a group's chosen picture is not the one its signs spell; one press with two wrong groups is one miss, and a wrong group goes back to unchosen. Looking up signs and pictures, choosing, Undo and Restart are free. Two misses on a group glow Show me. Show me counts one hint each press: first it dims a picture that cannot be it, then it glows the first-tablet sign that gives the answer away (or, for a group with no known sign yet, the other group to read first).
- Layout is `tabletsLayout` (pure, upright-ready, checked at the phone views). The key strip is display only; its cells are smaller than a target.
- The ghost finger never reads wrongly: the wrong reading and the hint are exercised by the `twotablets` browser suite instead.
- No couch play, no save field and no kept creation; one sticker as for every game.
