# Story Weaver

<!-- generated: from src/games/story-weaver; edit the text below the end mark (npm run game-docs) -->

**ID:** `story-weaver` · **Land:** Story Grove · **Ages:** school · **Challenge:** words · **Plays by:** touch · **Ghost finger:** yes

**Skills:** story-structure, composition, sequencing, feelings, listening

| Band | Levels, easiest first |
| --- | --- |
| school | 1–3 |

| Level | Plays like |
| --- | --- |
| 1 | Page by page: build a three-page story |
| 2 | The owl asks: answer the owl's question about a missing part |
| 3 | Because: join a feeling to an event with because |

<!-- end generated -->

**Starts as:** build a little picture-book story out of tiles, hear the pet read it back with each word lighting, then answer an owl's question or choose a reason

**Grows into:** level 1 opens pages one at a time (who and where; a problem with an optional try; an ending) and reads the whole story, never a miss; level 2 lets her fill the pages in any order, the ear button reads the story to the owl, who cannot see pictures and asks about the first missing part (its tiles glow), and "That's my story" finishes, never a miss or hint; level 3 adds a fourth page, a feeling the story supports, and one of her own events as the *because* (the first unfitting reason is free, later ones count a miss, two counted misses or the star button glow the fitting tiles, one hint); touch a tile once to hear it and again to place it; nothing is kept or filed

## Design notes

*Slice WC1 of the [writing-composition study](../deep-dives/subjects/writing-composition.md), [definition](../definitions/story-weaver.md).* She builds a little picture-book story out of tiles and a reader (the pet, then an owl) takes it in; school plays levels 1–3, default 1. Touch a tile once to hear it, again to place it; touching a placed tile takes it back; changing the problem clears its try and ending. Level 1, *Page by page*: pages open one at a time (who and where; a problem with an optional try and a page-turn arrow; an ending); placing the ending reads the whole story back with each word lighting and finishes; always 0 misses and 0 hints. Level 2, *The owl asks*: pages in any order; the ear button reads the story to the owl, who cannot see the pictures and asks about the first missing part (where, problem, ending) with that part's tiles glowing; adding it gets a reread, and a complete story or "That's my story" finishes; never a miss or hint. Level 3, *Because*: a complete story opens a fourth page (a feeling); only feelings with a supporting event among her own are offered; then she picks one of her events as the reason. The first unfitting reason is free; later ones count one miss each; two counted misses glow the fitting tiles (one hint), and the star button gives the same glow (counted once). The tower endings are worded so the friend is the subject, and no composed sentence uses a gendered pronoun. Music is the calm `STYLES.paint` (not `quiet`, which is for games where she makes the music). Home land Story Grove (its 15th). Nothing is kept or filed. Ghost finger demonstrates levels 1–3. Rule tests: [`logic.test.ts`](../../src/games/story-weaver/logic.test.ts) (layout against the corner and pet, the bot finishing every seed and level, no gendered pronouns).

**A page's reading never holds the next tile (U7 fix batch 22, 2026-11-12).** At levels 2–3 a placed tile's page is read back with input open, unless the tile answers the owl or ends the story (those still wait). Her next tile touch (the first, selecting touch says the tile and so cuts the reading) or slot touch stops the word lighting, and a placed tile starts its own page's reading. The ghost finger waits for an ask.
