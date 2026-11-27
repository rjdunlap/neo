# Common Ground

<!-- generated: from src/games/common-ground; edit the text below the end mark (npm run game-docs) -->

**ID:** `common-ground` · **Land:** Story Grove · **Ages:** school–grown-up · **Challenge:** space · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** listening, perspective-taking, spatial reasoning

| Band | Levels, easiest first |
| --- | --- |
| school | 1–3 |
| grown-up | 3 |

| Level | Plays like |
| --- | --- |
| 1 | A place for you: arrange two things so a friend’s two requests are kept |
| 2 | A request changed: the friend asks for the basket on a different side, so revise the room |
| 3 | Two residents: place a drawing and a drum so both friends’ needs are kept, then choose a plan |

<!-- end generated -->

**Starts as:** a friend comes to visit and states two requests: the cushion by the window (or door) and the book basket right beside it. She drags a cushion, a basket and an optional plant onto a 2 × 3 floor, presses Visit, and the friend sits down to read. The learning purpose is designing for someone else from what they said: many rooms keep the same promise.

**Grows into:** level 2, built: after the first Visit the friend asks for the basket on a different side ([definition](../definitions/common-ground-2.md)); a dashed outline marks the old place, Undo steps back, and misses and hints count across both Visits. Level 3, built (`school` 1–3, `grownup` 3): two residents share the floor ([definition](../definitions/common-ground-3.md)). A drawer needs the window and a drummer needs the drums not right beside the drawing; each also has a wish (the shelf, the doorway) that is never a need. Eight plans keep both needs, and no plan serves both wishes: trying for both is shown, not counted a miss, and *Keep this plan* finishes whichever wish the plan serves.

## Design notes

- Rules live in `logic.ts` on integers (cells `0 1 2 / 3 4 5`): `check` accepts exactly 35 of 150 arrangements per fixture, the plant is never judged, `place` swaps and never refuses a drop, and `hintAction` reaches an accepted room within three moves from any state. The unit tests re-derive each count.
- Placing is free; only Visit judges. A Visit that is not accepted is one miss and names one unmet request (the cushion first); the request bubbles carry a tick for each request currently kept, so a move shows its effect without a miss.
- Help, or the second miss, lights one move (a hint); a third hint is carried out by the pet so every round can finish. The round still gives its one sticker.
- Built deviations from the definition: the seed picks the fixture (each fixture comes once before it repeats), the friend and the cushion colour only; the cushion-and-basket versus rug-and-toy-box pair is not drawn, because the spoken words name a cushion and a basket. Voice lines carry her name or the fixture word so they stay on device speech until a Better voice pass; the spoken title is `common-ground.title` (not a `game.` line, which would need a rendered clip) for the same reason, and a Better voice pass can move it.
- Layout reads `view` (`layout.ts`): cells `min(160, (w − 80) / 3)`, never under 100, the tray under the room upright and in a column at the right sideways, the pet's bottom-left corner clear. `layout.test.ts` checks four views.
