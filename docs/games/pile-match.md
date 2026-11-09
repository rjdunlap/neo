# Pile Match

<!-- generated: from src/games/pile-match; edit the text below the end mark (npm run game-docs) -->

**ID:** `pile-match` · **Land:** Counting Cove · **Ages:** preschool–school · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** matching, visual-search, counting, planning

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1, 2, 3, 11, 4 |
| pre-K | 3, 11, 4, 5, 6 |
| school | 5–9 |

| Level | Plays like |
| --- | --- |
| 1 | Find three, flat |
| 2 | Find three in a little pile |
| 3 | Any three you like |
| 4 | A little heap, a little tray |
| 5 | Four kinds |
| 6 | Five kinds, three layers |
| 7 | Six kinds |
| 8 | The big heap |
| 9 | A smaller tray |
| 11 | Any three in a little pile |

<!-- end generated -->

**Starts as:** tap a thing on top of a heap into a three-slot basket, asked for one kind at a time (apples, then shells); the covered ones wait dimmed

**Grows into:** a free five-slot tray where any three of a kind pop into the basket, a heap of up to 24 pieces on layers, a full tray that costs one miss (a four-place tray at the top), put-back that is always free, and the pet counting the pops by threes; heaps are frozen and clear along a route

## Design notes

*After Triple Tile and Match 3D; [definition](../definitions/pile-match.md).* A windy-day heap of island things lies on the grass in layers. She taps a piece on top (a covered piece is dimmed and takes no touch) and it hops into a tray; three of a kind pop together into the host's basket, and the round ends when the grass is clear, with one sticker, with or without help. Heaps are frozen shapes with kinds dealt along a clearing route, so every board can be cleared and nothing dead-ends; the asked kind always has a free piece.

Levels: 1–2 a 3-slot basket that asks for one kind at a time (apples, then a seeded second kind at level 1: shell, toy duck or leaf; shells at level 2); 3 a free 5-slot tray where any three of a kind pop and the tray cannot fill; 11 the same with six pieces of two kinds on two layers (free play, between 3 and 4); 4–8 bigger heaps (up to 24 pieces) where the tray can fill, 9 the level 7 heap again with a four-place tray, and at 6–9 the pet counts the pops by threes (15, 18, 24). Preschool plays 1, 2, 3, 11, 4 (by `order`), pre-K 3, 11, 4, 5, 6, school 5–9 (a level 11 carried into school lands at 5); there is no toddler level. The heap always draws at scale 1. Each round has a seeded look (meadow, sand with a wet line and shells, or autumn with fallen leaves; levels 1–2 are always meadow) under a sky band, and the pieces drop in on a windy gust, bottom layer first, in under a second, with taps waiting until the last lands. Ten heap shapes a level, none shared between levels 1/3, 2/4 or 11 and 2/4.

Misses and hints: a wrong kind at levels 1–2 is one miss and nothing is taken. From level 4 a full tray costs one miss per full-tray episode (a refused tap on a full tray). Covered touches and put-backs (tap a tray piece to set it back) never count. Every second miss glows the hint piece (one hint), and three put-backs at levels 4–9 send a wander hint. The hint is a memoized search capped at 200,000 states, falling back to the route. A ghost finger plays the route (the demonstration). Touch only; no couch play.
