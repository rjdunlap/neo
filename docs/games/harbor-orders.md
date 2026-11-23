# Harbor Orders

<!-- generated: from src/games/harbor-orders; edit the text below the end mark (npm run game-docs) -->

**ID:** `harbor-orders` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** Assign work to fill an order in the fewest mornings, Compare what each workshop gives up to make one good

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–2 |

| Level | Plays like |
| --- | --- |
| 1 | Two workshops: fill the order in the given number of mornings. |
| 2 | Better at both: give each workshop work that helps the order leave as soon as possible. |

<!-- end generated -->

**Starts as:** Give two workshops a few mornings to make crates and boats for a waiting order.

**Grows into:** Find the fewest mornings the order needs when one workshop is better at making both goods.

## Design notes

- Tap a closed door to make crates, then tap again to switch to boats. Each sign shows its workshop's rates, and the order card tracks how many of each good the plan makes.
- Level 1 supplies the number of mornings. Level 2 starts with one morning and lets you add or take away columns. Trying a plan, rereading a sign and sending an order that is still short are free.
- A full order sent with spare mornings counts once for each distinct plan. Changing the order of jobs within a row keeps the same plan. Feedback shows the surplus and the fewest mornings that would suffice.
- Help lights a morning control, a workshop or Send it. A workshop hint stays visible while you set its row. It preserves matching rows when their plan is still reachable, since a filled square can change goods but cannot close again. The on-board note shows the precise quantities and reasoning while the pet speaks a short cue.
- The same order and plan stay on the board when the screen turns. Send a full order in the fewest mornings to see the cargo pass down the jetty and the boat leave.

[Definition and build batches](../definitions/harbor-orders.md#build-batches)
