# Snowball Merge

<!-- generated: from src/games/snowball-merge; edit the text below the end mark (npm run game-docs) -->

**ID:** `snowball-merge` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** space · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** spatial-planning, doubling, revision

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–6 |

| Level | Plays like |
| --- | --- |
| 1 | Make 16 · open snowfield |
| 2 | Make 32 · choose your pairs |
| 3 | Make 64 · make room first |
| 4 | Make 128 · the big snowball |
| 5 | Make 64 · the ice rock |
| 6 | Build a snowman · keep the 16s apart |

<!-- end generated -->

**Starts as:** slide equal numbered snowballs together to make the pictured target

**Grows into:** finite 3×3 boards making 16/32/64/128, then an ice rock that never moves and stops snowballs beside it, then a snowman of three 16s that must not be joined too far; exact hints, Undo, restart and ghost finger; touch only, in Lantern Lake

## Design notes

Grown-up, Lantern Lake; touch only. Slide a finite 3×3 board so equal snowballs merge once per slide, making 16, 32, 64 or 128, or three 16s for a snowman, across six levels. No refill, clock or turn limit. Exact hints, Undo and restart support recovery; inert presses are free exploration, and a repeated visible hint counts once. Making the target completes the round for one sticker, including with help; ghost-finger demonstration included.

**Boards and looks (2026-11-10).** `scripts/snowball-merge-boards.ts` freezes four boards per level into `boards.ts` (authored plan first, then picked, turned and mirrored by seed); route depth is 3–4 at level 1 with no reachable dead end, 5–7 at level 2 and 7–9 at level 3 with a reachable dead end. Sizes have their own colours (64 yellow with a scarf stripe). A join squashes the pair, puffs and pops the doubled ball. Each round gets one of three field looks: morning, dusk or flurry (flakes never touch play).

**Level 4, Make 128 (2026-11-10).** Three 32s sit on the board and the player works out which one waits; the route is 10–14 slides with a reachable dead end. The 128 is a white snowball with a scarf and two coal eyes; the radius step is 1.3 per doubling so it still fits the cell.

**Automatic glow and par line.** A slide into a dead end lights Undo and the pet says the stuck line; two inert arrows in a row light the route's next arrow. Each counts as one hint, once; asking while something glows counts nothing, and Restart still counts as help. After finishing, the status reads "N slides · the shortest route is M", information only.

**Level 5, the ice rock (2026-11-11).** A grey-blue rock holds one cell and never moves or joins; a row or column splits at it, so snowballs behind it stop beside it and the player chooses which side a pair meets on. Boards run 8–11 slides with a reachable dead end and the rock never in the centre (a centre rock leaves most boards unsolvable). The pet says the rock line once per round, the first time a slide rests a snowball against it; that is no miss and no hint. Levels 1–4 are unchanged.

**Level 6, Build a snowman (2026-11-11).** The goal is three 16s on a board of 48 snow, anywhere on the field. Two 16s that meet join into a 32 and nothing unjoins, so the decision is when to stop merging; a goal of different sizes (a 32 and a 16) can never be overshot, which is why the goal is three equal snowballs. Boards run 6–9 slides, most reachable states are dead ends, and a join too many says "One join too many: Undo takes it back.", lights Undo (one hint, never a miss) and the pet says `snowball.over`. The finish stacks the three snowballs in the middle column (coal eyes and a carrot on the top one) for the one sticker. Levels 1–5 are unchanged.
