# Common Ground

<!-- generated: from src/games/common-ground; edit the text below the end mark (npm run game-docs) -->

**ID:** `common-ground` · **Land:** Story Grove · **Ages:** school · **Challenge:** space · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** listening, perspective-taking, spatial reasoning

| Band | Levels, easiest first |
| --- | --- |
| school | 1 |

| Level | Plays like |
| --- | --- |
| 1 | A place for you: arrange two things so a friend’s two requests are kept |

<!-- end generated -->

**Starts as:** a friend comes to visit and states two requests: the cushion by the window (or door) and the book basket right beside it. She drags a cushion, a basket and an optional plant onto a 2 × 3 floor, presses Visit, and the friend sits down to read. The learning purpose is designing for someone else from what they said: many rooms keep the same promise.

**Grows into:** one school level for now. The [definition](../definitions/common-ground.md#the-level) names the later rungs, each its own definition: a request changed after the preview, then two residents with compatible requests and different preferences.

## Design notes

- Rules live in `logic.ts` on integers (cells `0 1 2 / 3 4 5`): `check` accepts exactly 35 of 150 arrangements per fixture, the plant is never judged, `place` swaps and never refuses a drop, and `hintAction` reaches an accepted room within three moves from any state. The unit tests re-derive each count.
- Placing is free; only Visit judges. A Visit that is not accepted is one miss and names one unmet request (the cushion first); the request bubbles carry a tick for each request currently kept, so a move shows its effect without a miss.
- Help, or the second miss, lights one move (a hint); a third hint is carried out by the pet so every round can finish. The round still gives its one sticker.
- Built deviations from the definition: the seed picks the fixture (each fixture comes once before it repeats), the friend and the cushion colour only; the cushion-and-basket versus rug-and-toy-box pair is not drawn, because the spoken words name a cushion and a basket. Voice lines carry her name or the fixture word so they stay on device speech until a Better voice pass.
- Layout reads `view` (`layout.ts`): cells `min(160, (w − 80) / 3)`, never under 100, the tray under the room upright and in a column at the right sideways, the pet's bottom-left corner clear. `layout.test.ts` checks four views.
