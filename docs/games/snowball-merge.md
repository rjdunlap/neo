# Snowball Merge

<!-- generated: from src/games/snowball-merge; edit the text below the end mark (npm run game-docs) -->

**ID:** `snowball-merge` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** space · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** spatial-planning, doubling, revision

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–3 |

| Level | Plays like |
| --- | --- |
| 1 | Make 16 · open snowfield |
| 2 | Make 32 · choose your pairs |
| 3 | Make 64 · make room first |

<!-- end generated -->

**Starts as:** slide equal numbered snowballs together to make the pictured target

**Grows into:** three finite 3×3 boards making 16/32/64; exact hints, Undo, restart and ghost finger; touch only, in Lantern Lake

## Design notes

Grown-up, Lantern Lake; touch only. Slide a finite 3×3 board so equal snowballs merge once per slide, making 16, 32 or 64 across three levels. No refill, clock or turn limit. Exact hints, Undo and restart support recovery; inert presses are free exploration, and a repeated visible hint counts once. Making the target completes the round for one sticker, including with help; ghost-finger demonstration included.

**Boards and looks (2026-11-10).** `scripts/snowball-merge-boards.ts` freezes four boards per level into `boards.ts` (authored plan first, then picked, turned and mirrored by seed); route depth is 3–4 at level 1 with no reachable dead end, 5–7 at level 2 and 7–9 at level 3 with a reachable dead end. Sizes have their own colours (64 yellow with a scarf stripe). A join squashes the pair, puffs and pops the doubled ball. Each round gets one of three field looks: morning, dusk or flurry (flakes never touch play).

**Automatic glow and par line.** A slide into a dead end lights Undo and the pet says the stuck line; two inert arrows in a row light the route's next arrow. Each counts as one hint, once; asking while something glows counts nothing, and Restart still counts as help. After finishing, the status reads "N slides · the shortest route is M", information only.
