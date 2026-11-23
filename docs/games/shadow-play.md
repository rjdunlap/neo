# Shadow Play

<!-- generated: from src/games/shadow-play; edit the text below the end mark (npm run game-docs) -->

**ID:** `shadow-play` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** space · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** how a point of light scales a shadow with distance, reading a joined outline back into its parts

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–2 |

| Level | Plays like |
| --- | --- |
| 1 | Near and far: the lamp is lit; slide three cut-outs along their rails until the shadow fills the outline |
| 2 | Lamp out: work out each cut-out’s mark from the grid, then light the lamp to check |

<!-- end generated -->

**Starts as:** a lit lamp, a cloth screen and three flat cut-outs on rails; slide each cut-out nearer the lamp or the screen until its shadow fills the outline of tonight's skyline.

**Grows into:** the same skyline with the lamp out, where each cut-out's mark is worked out from the grid before Light checks it.

## Design notes

On Lantern Night the islanders put on a shadow show. The lamp is a point at one end of the table and the screen stands 12 marks away, so a cut-out at mark *d* casts a shadow 12 ÷ *d* times its size: ×6 at mark 2, ×4 at mark 3, ×3 at mark 4 and ×2 at mark 6. The twelve cut-outs are a block, a tent and a dome, each 1 or 2 squares wide and 1 or 2 tall, and each rail's shadow stays centred on its own spot on the screen's 24 × 12 grid. The whole model is in `logic.ts`; it is a game rule built on similar triangles, not a physics simulation.

A level 1 round is two boards whose three shadow parts stand apart (44,496 boards), with the lamp lit: the shadow follows every slide, a board finishes by itself, and nothing can be a miss. A level 2 round is one board whose parts join into one skyline (30,516 boards, each with exactly one answer among its 64 arrangements), with the lamp out until Light. Boards are sampled from the pool by rejection, never repeating the last one, and the rule tests re-derive both counts by brute force.

Drag a cut-out along its rail or tap a mark; both are always free. The marks are drawn to scale, so marks 2 and 3 sit closer together than the handle is wide: a tap on the handle that is nearer another mark moves the cut-out there, and a tap where it stands says its size again. Light on a wrong arrangement shows the real shadow over the dashed outline, with upright strokes where shadow falls outside the outline and level strokes where the outline is left uncovered, and names the first rail from the left that differs with its working. Each distinct wrong arrangement lit is one miss; lighting the same one again replays the explanation. Help, and the second counted miss, work out one rail's mark, left to right, and each new hint counts once.

Every size, miss explanation and hint is a whole spoken line with a rendered clip (306 lines), built in `voice.ts` from the rules. Levels 3–4 (turning a cut-out on its stick and choosing which rail it stands on) are the next batch. [Definition](../definitions/shadow-play.md)
