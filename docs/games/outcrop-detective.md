# Outcrop Detective

<!-- generated: from src/games/outcrop-detective; edit the text below the end mark (npm run game-docs) -->

**ID:** `outcrop-detective` · **Land:** Lantern Lake · **Ages:** school–grown-up · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** reading a cliff as a record of events, ordering events by what lies lower and what cuts what, telling missing evidence from contradicting evidence, choosing the look that would decide

| Band | Levels, easiest first |
| --- | --- |
| school | 1–2 |
| grown-up | 1–2 |

| Level | Plays like |
| --- | --- |
| 1 | Put four rock events in the order the cliff shows |
| 2 | Two stories fit: find the look that tells them apart |

<!-- end generated -->

**Starts as:** swap four rock-event cards until the story builds the same made-up cliff, then say whether the rocks tell that order for sure.

**Grows into:** Level 2 hides one contact under sand: two stories fit, so the honest answer is *not enough to tell*, and she picks the one look that decides. Later proposals, each needing its own definition: a second dark rock, a wavy erosion surface, a fault, two hidden contacts, or a case no look can decide. See [the definition](../definitions/outcrop-detective.md).

## Design notes

Built from [the definition](../definitions/outcrop-detective.md); rules are in `src/games/outcrop-detective/logic.ts`, the scene in `index.ts`, the layout in `layout.ts`.

- **The island's rules, stated as the island's.** Layers were laid flat, lower first; nothing has been flipped; dark rock cuts the layers that were already there. A, B and C are pattern names, nothing has an age, and the how-to says real cliffs can be bent or broken.
- **Play is the interaction.** The story frame builds the cliff a ribbon would make, card by card, with the pet saying each step. It is free and never a Check; a swap clears it.
- **Misses.** One per distinct wrong ribbon per record state (sand in place, or sand brushed off); re-checking the same wrong ribbon only repeats the reason. A wrong answer to *for sure?* and each uninformative look count once. Swaps, Play, look previews and an incomplete Look are free.
- **Level 1, a wrong *Not enough to tell*:** the pet plays one other order with the cliff's stack (the first such in the fixed ribbon order) in the story frame and rings where it breaks a contact; her ribbon stays. **Level 2, a wrong *Yes*:** the ribbon swaps to the other story that fits and plays; a second wrong *Yes* swaps back, free.
- **Hints.** Two misses on a step make its target glow once (one hint): the card the hint walk moves next and its slot, the right answer, or the sand look. Show a hint in the pause sheet moves one card by the walk (at most three from any ribbon) or makes the step's target glow, one hint per press that changes something. Before the sand look the words say "a story that fits", never "the story".
- **Swapping is by tap:** tap one card to lift it and another to swap. Dragging a card onto another, which the definition also lists, is not built yet.
- **Layout differs from the definition's pixel plan.** Only the current step's row shows (Check, the two answers, or the three look cards with Look), because the definition's single row of looks, Look and Check is wider than the upright screen. Upright, the frames start right of Home and "?", and every target sits above the caption bubble on the captioned small phone. Sideways, the frames sit above the bubble on the left and the ribbon (two numbered rows of two), Play and the step's row fill a column on the right. Every target is at least 100 units in every check view.
