# Harbor Orders

<!-- generated: from src/games/harbor-orders; edit the text below the end mark (npm run game-docs) -->

**ID:** `harbor-orders` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** Assign work to fill an order in the fewest mornings, Compare what each workshop gives up to make one good

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–4 |

| Level | Plays like |
| --- | --- |
| 1 | Two workshops: fill the order in the given number of mornings. |
| 2 | Better at both: give each workshop work that helps the order leave as soon as possible. |
| 3 | Three workshops: some may split their mornings between crates and boats. |
| 4 | Lanterns too: three workshops share crates, boats and lanterns. |

<!-- end generated -->

**Starts as:** Give two workshops a few mornings to make crates and boats for a waiting order.

**Grows into:** Find the fewest mornings the order needs when one workshop is better at making both goods, then share an order among three workshops (level 3) and add lanterns as a third good (level 4).

## Design notes

- Tap a closed door to make crates, then tap again to switch to boats. Each sign shows its workshop's rates, and the order card tracks how many of each good the plan makes.
- Level 1 supplies the number of mornings. Level 2 starts with one morning and lets you add or take away columns. Trying a plan, rereading a sign and sending an order that is still short are free.
- A full order sent with spare mornings counts once for each distinct plan. Changing the order of jobs within a row keeps the same plan. Feedback shows the surplus and the fewest mornings that would suffice.
- Help lights a morning control, a workshop or Send it. A workshop hint stays visible while you set its row. It preserves matching rows when their plan is still reachable, since a filled square can change goods but cannot close again. The on-board note shows the precise quantities and reasoning while the pet speaks a short cue.
- Levels 3 and 4 add the Bell as a third workshop; at level 4 a square steps through crates, boats and lanterns. The generator rejects boards where every workshop can just make its best good, and at level 4 boards where each good has its own single best maker, so most boards need a workshop to split its mornings. A level 4 round start takes about 12 ms on a laptop (worst 147 ms in 1,000 seeds).
- The same order and plan stay on the board when the screen turns. Send a full order in the fewest mornings to see the cargo pass down the jetty and the boat leave.

[Definition and build batches](../definitions/harbor-orders.md#build-batches)
