# Owl Walk Home

<!-- generated: from src/games/owl-walk; edit the text below the end mark (npm run game-docs) -->

**ID:** `owl-walk` · **Land:** Story Grove · **Ages:** toddler–pre-K · **Challenge:** logic · **Plays by:** touch · **Ghost finger:** yes

**Skills:** colors, taking turns, shared goals, comparing distances

| Band | Levels, easiest first |
| --- | --- |
| toddler | 1–2 |
| preschool | 1–3 |
| pre-K | 2–4 |

| Level | Plays like |
| --- | --- |
| 1 | Flip a color card, then tap the next stone of that color for the owl to hop to |
| 2 | Two owls, one each: take turns with the pet and tap the next stone of the card’s color |
| 3 | Three owls, taking turns: choose an owl, then tap its stone (or the nest when none is left) |
| 4 | Which owl hops the farthest with this card? Plan to get everyone home sooner |

<!-- end generated -->

**Starts as:** turn over a color card and tap the next stone of that color; the owl hops there, or home when none is left

**Grows into:** one owl, then an owl each with the pet, then three shared owls (choose an owl, then its stone), then choose the owl a card carries farthest

## Design notes

*After Hoot Owl Hoot! and First Orchard, without the losing clock.* The goal is choosing the move that helps all of us: matching a card to a stone is the way in. Turn over a color card, then **tap the next stone of that color** ahead of the owl; it hops there, counted aloud, skipping a stone another owl stands on. When no stone of that color is left ahead, the owl flies home: tap the nest. Stones and cards also carry a shape per color (heart, circle, star, triangle). Levels 1–2 draw only colors that have a stone ahead for the owl whose turn it is (so flying home arrives later), and the matching stones ahead twinkle with fireflies when a card turns (the set to look through, never the answer). Level 1 is one owl. Level 2 gives each owl its own player: purple is hers and brown is the pet's, each turn spotlighting its owl, the pet saying what it looked for and touching the same place she would; when one owl is home the other is shared and turns keep alternating. Level 3 shares three owls: tap the owl to hop (a free choice, never a miss, and it can be changed), then its stone; no twinkle, and a card may have no stone ahead (the voice says so and the nest is the answer). The top level shows how far each owl would hop with the card and asks for the farthest owl; a shorter hop is a gentle miss with both numbers said, two light the best owl, then she taps its stone. A wrong tap is a gentle boing and a spoken reason (the other color named, "a red heart, but is there one closer?", the owl only walks forward, a friend is sitting there, or a stone is still ahead before the nest); two misses glow the right stone (one hint a turn), and a third has the pet hop it with her. A touch resolves to the nearest stone, owl or the nest (a stone with an owl on it means the owl; on the top level a numbered ring means its owl) and answers at touch-down with a ring and a squash. Tapping an owl on levels 1–2, what the old game taught, is a reminder to tap the stone and never a miss. Everyone wins together, and the sun only rises when every owl is home. A random-play simulation shows every game ends; rule tests check the stone verdicts against the hop rule, the first levels' cards and the one-each turn order. Not yet built, from its [deep dive](../deep-dives/owl-walk.md): Stepping stones for lap, Color or shape, Our two cards, Check the helper, a grown-up in the pet's seat.

**A card's colour never holds her tap (U7 fix batch 21, 2026-11-12).** Her flipped card's colour starts as it turns and the stones open at once; what to do with the card waits for the colour, is said by the guide, or is dropped at her first tap (the card face shows the colour). The pet's turn is unchanged.
