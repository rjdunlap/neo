# Marble Jump

<!-- generated: from src/games/marble-jump; edit the text below the end mark (npm run game-docs) -->

**ID:** `marble-jump` · **Land:** Puzzle Peaks · **Ages:** grown-up · **Challenge:** space · **Plays by:** touch · **Ghost finger:** yes

**Skills:** spatial planning, revising a route

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–9 |

| Level | Plays like |
| --- | --- |
| 1 | 3 marbles on a triangular board; leave one |
| 2 | 5 marbles on a triangular board; leave one |
| 3 | 7 marbles on a triangular board; leave one |
| 4 | 9 marbles on a triangular board; leave one |
| 5 | 11 marbles on a triangular board; leave one |
| 6 | 14 marbles on a triangular board; leave one |
| 7 | 14 marbles; the last one must finish in the star hole |
| 8 | 9 marbles, one gold; the gold one must be the last left |
| 9 | 20 marbles on a bigger, 21-hole triangle; leave one |

<!-- end generated -->

**Starts as:** jump a marble over a neighbour into an empty hole to leave one

**Grows into:** six seeded triangle levels starting with 3/5/7/9/11/14 marbles, then level 7, finish the last marble in the marked star hole, and level 8, keep the gold marble from being jumped and leave it last; exact clearing-route hints, Undo, restart and ghost finger; touch only, in Puzzle Peaks

## Design notes

Grown-up, Puzzle Peaks; touch only. Tap a marble and an empty landing hole two spaces away, jumping and removing its neighbour until one remains. Six seeded 15-hole triangle levels start with 3, 5, 7, 9, 11 and 14 marbles. Exact solver hints show a useful jump; blocked routes offer recovery. Invalid jumps get gentle feedback; Undo and restart support revision. Repeating an already visible hint counts once. Each level draws from a seeded pool of every clearable reachable board (levels 2–5 only boards with a trap first jump); marbles keep their colour, the jump arcs into a pocket groove with one queued tap, a refused landing tilts the marble, and three seeded tray looks (oak, slate, birch) vary the board. One sticker on completion, including with help; Level 7 marks one hole with a star; the last marble must finish there, and one marble elsewhere is not a miss: Undo tries another route, and Hint recovers to the nearest board that can still finish on the star. After any finish the status shows the moves used and the fewest possible (a chain by one marble counts as one move). Level 8 has nine marbles, one gold: a jump over the gold marble is refused with a boing, a spoken hint and one miss, no hint ever jumps gold, and the gold one must be the last left; its boards offer a jump over gold from the start and a first jump can strand it. Ghost-finger demonstration included.
