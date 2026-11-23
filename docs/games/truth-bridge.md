# Truth Bridge

<!-- generated: from src/games/truth-bridge; edit the text below the end mark (npm run game-docs) -->

**ID:** `truth-bridge` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** checking that statements are consistent, deduction from one settled fact to the next

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–4 |

| Level | Plays like |
| --- | --- |
| 1 | Two at the gate: two islanders, one sentence each; mark who speaks straight and who is Topsy |
| 2 | Three on the bridge: three islanders, where one sentence’s result is needed to read another |
| 3 | Try it both ways: rule out a possible mark by seeing which sentence stops fitting |
| 4 | Which plank? Mark three islanders and work out which plank is sound from what they say |

<!-- end generated -->

**Starts as:** two islanders at the gate each say one sentence; tap each to mark them Straight or Topsy until both sentences fit, then tap Cross.

**Grows into:** three islanders on the bridge, trying a mark to see what it would contradict, then using what the islanders say to choose the sound plank.

## Design notes

On Lantern Night a Topsy islander says the opposite of what is so, and everyone else speaks straight. A sentence fits when it is so and its speaker is marked Straight, or not so and its speaker is marked Topsy. Every board has exactly one marking where every sentence fits. The cast is Cat, Duck and Bear; the seeded board picks who appears and where they stand. A level 1 round is two boards: one where each sentence settles someone by itself, then one where the first result is needed to read the second. A level 2 round is one three-islander board of that chained kind. The boards are drawn from the 26 two-islander and 1,191 three-islander boards the rule tests count.

Tapping an islander cycles blank, Straight (an upright lantern) and Topsy (the lantern upside down); tapping a bubble repeats its sentence. Both are always free. Cross with a blank mark names the first unmarked islander, also free. Cross on a wrong complete marking shows and says the first sentence, in seat order, that does not fit, and counts one miss for each distinct wrong marking; the same marks again replay the explanation. Help, and the second counted miss, point to a sentence and the islander it settles, starting from the marks that are already right. A hint counts once until the marks change. When every sentence fits, the islanders cross in seat order, a lantern lights for each, and the round ends with one sticker.

Level 3 adds supposition hints: Help names a mark to try, the sentence that would stop fitting, and the mark that follows. Level 4 adds three tappable planks. Tap the selected plank again to clear it. Cross asks for a missing plank for free and counts a wrong complete combination of marks and plank once. The islanders take the chosen plank after every sentence fits. The solver keeps all remaining plank choices, so two separate rotten-plank clues can leave the sound one.

Every sentence, miss explanation and hint is a whole spoken line with a rendered clip. The script enumerates the lines the pools can ask for, including the current cast order. [Definition](../definitions/truth-bridge.md)
