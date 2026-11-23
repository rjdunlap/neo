# Shadow Play

<!-- generated: from src/games/shadow-play; edit the text below the end mark (npm run game-docs) -->

**ID:** `shadow-play` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** space · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** how a point of light scales a shadow with distance, reading a joined outline back into its parts, how turning a cut-out changes its shadow’s width

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–4 |

| Level | Plays like |
| --- | --- |
| 1 | Near and far: the lamp is lit; slide three cut-outs along their rails until the shadow fills the outline |
| 2 | Lamp out: work out each cut-out’s mark from the grid, then light the lamp to check |
| 3 | Turn it: use the height to find the mark and turn a cut-out to make its shadow half as wide |
| 4 | Which goes where?: swap cut-outs between rails, then set their marks and turns to fill the outline |

<!-- end generated -->

**Starts as:** a lit lamp, a cloth screen and three flat cut-outs on rails; slide each cut-out nearer the lamp or the screen until its shadow fills the outline of tonight's skyline.

**Grows into:** read the skyline with the lamp out, set each cut-out's mark and turn, then swap cut-outs between rails to fit the outline.

## Design notes

On Lantern Night the islanders put on a shadow show. The lamp is a point at one end of the table and the screen stands 12 marks away, so a cut-out at mark *d* casts a shadow 12 ÷ *d* times its size: ×6 at mark 2, ×4 at mark 3, ×3 at mark 4 and ×2 at mark 6. The twelve cut-outs are a block, a tent and a dome, each 1 or 2 squares wide and 1 or 2 tall, and each rail's shadow stays centred on its own spot on the screen's 24 × 12 grid. The whole model is in `logic.ts`; it is a game rule built on similar triangles, not a physics simulation.

A level 1 round is two boards whose three shadow parts stand apart (44,496 boards), with the lamp lit: the shadow follows every slide, a board finishes by itself, and nothing can be a miss. Levels 2–4 each use one joined skyline with the lamp out until Light. Level 2 has 30,516 boards with one answer among 64 arrangements. Level 3 adds a turn that halves the width while keeping the height (51,627 boards, 512 arrangements each). Level 4 lets three different cut-outs change rails, with at least two cut-outs of the same shape (38,050 boards, 3,072 arrangements each). Each level draws from its own pool without repeating the previous board. The rule tests re-derive the counts.

Drag a cut-out along its rail or tap a mark to move it. At levels 1–2 a tap where the cut-out stands repeats its size. At levels 3–4 tap the handle to turn it, or tap the numbered marks below it to slide. At level 4 tap two chips to swap their cut-outs. Each cut-out carries its mark and turn to the new rail. Tap the selected chip again to clear it. These moves are free.

Light on a wrong arrangement shows the real shadow over the dashed outline, with upright strokes where shadow falls outside the outline and level strokes where the outline is left uncovered. The voice names the first rail that differs. Level 2 speaks the calculation. At levels 3–4 a full numeric script would exceed 600 lines, so a short spoken reason accompanies a comparison on the highlighted rail. Each distinct wrong arrangement lit is one miss. Checking it again repeats the feedback for free. Help and the second counted miss lead from left to right, choosing the cut-out, mark or turn one step at a time. Repeating the same hint without changing the arrangement is free. [Definition](../definitions/shadow-play.md)
