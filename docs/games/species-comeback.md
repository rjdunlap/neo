# Species Comeback

<!-- generated: from src/games/species-comeback; edit the text below the end mark (npm run game-docs) -->

**ID:** `species-comeback` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** logic · **Plays by:** touch · **Ghost finger:** yes

**Skills:** animals, logic, planning, reasoning

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–3 |

| Level | Plays like |
| --- | --- |
| 1 | Not brothers and sisters |
| 2 | Not cousins either |
| 3 | Where will they live? |

<!-- end generated -->

**Starts as:** tap two pond turtles on a family tree to put them in a nest, with no brothers and sisters in a pair, then press Spring

**Grows into:** no cousins or aunt-and-nephew pairs at levels 2 and 3 (a forbidden pair lights and names the shared relative, a tempting pair is always on the board, undo any nest, a hint glow for the next good pair); level 3 adds choosing a release site that has every need on the card; touch only, in Lantern Lake

## Design notes

*grown-up, Lantern Lake; touch only · after studbook pairing and recovery programmes (sources in the [definition](../definitions/species-comeback.md)).* A family tree of invented pond turtles hangs on the wall, each with a name and a ♀ or ♂ tag. Tap two turtles to put them in a nest (one mother, one father); tap a nest to undo it. At level 1 no brother and sister may share a nest; at levels 2 and 3 cousins and an aunt or uncle with a niece or nephew are forbidden too. Press Spring when every nest is full and hatchlings appear under each nest, one sticker per round. **Level 3** then asks her to choose a release site, with every need on the card; a site missing a need is a miss and the need is named.

**Misses and help.** A forbidden pair is a miss: the shared relative lights up and is named, and the pair is not nested. Undoing, re-pairing and pressing Spring too early are never counted. The hint glow shows the next good pair, or the nest to undo when the nests cannot be completed. **The rules** are in `logic.ts`: a seeded tree, a kin rule over parents and grandparents, and a solver that guarantees at least two full plans and at least one tempting pair (close but forbidden); tests cover those properties. Level 4 (two keeper plans with a note) is not built.
