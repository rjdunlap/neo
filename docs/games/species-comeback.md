# Species Comeback

<!-- generated: from src/games/species-comeback; edit the text below the end mark (npm run game-docs) -->

**ID:** `species-comeback` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** animals, logic, planning, reasoning

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–4 |

| Level | Plays like |
| --- | --- |
| 1 | Not brothers and sisters |
| 2 | Not cousins either |
| 3 | Where will they live? |
| 4 | Two plans |

<!-- end generated -->

**Starts as:** tap two pond turtles on a family tree to put them in a nest, with no brothers and sisters in a pair, then press Spring

**Grows into:** no cousins or aunt-and-nephew pairs at levels 2 and 3 (a forbidden pair lights and names the shared relative, a tempting pair is always on the board, undo any nest, a hint glow for the next good pair); level 3 adds choosing a release site that has every need on the card; level 4 offers two keeper's plans and a note about this spring, and she says which plan fits and why before the site step; touch only, in Lantern Lake

## Design notes

*grown-up, Lantern Lake; touch only · after studbook pairing and recovery programmes (sources in the [definition](../definitions/species-comeback.md)).* A family tree of invented pond turtles hangs on the wall, each with a name and a ♀ or ♂ tag. Tap two turtles to put them in a nest (one mother, one father); tap a nest to undo it. At level 1 no brother and sister may share a nest; at levels 2 and 3 cousins and an aunt or uncle with a niece or nephew are forbidden too. Press Spring when every nest is full and hatchlings appear under each nest, one sticker per round. **Level 3** then asks her to choose a release site, with every need on the card; a site missing a need is a miss and the need is named.

**Misses and help.** A forbidden pair is a miss: the shared relative lights up and is named, and the pair is not nested. Undoing, re-pairing and pressing Spring too early are never counted. The hint glow shows the next good pair, or the nest to undo when the nests cannot be completed. **The rules** are in `logic.ts`: a seeded tree, a kin rule over parents and grandparents, and a solver that guarantees at least two full plans and at least one tempting pair (close but forbidden); tests cover those properties. **Level 4** is a tree of 21 turtles (4 founder pairs, 9 young, two earlier nests): the keeper's note ("Room for N nests" fits Plan B, "A big spring" fits Plan A) and two solver-made plans, Plan A a largest plan with no brothers or sisters (4 pairs, 1 or 2 related, written in orange) and Plan B a largest plan with no related pair (3). The plan that does not fit is a miss with the trade spoken; then one of three reason cards ("It has more pairs" fits A, "Its pairs are less closely related" fits B, "It uses every turtle" fits neither; a wrong card is a miss), then the plan slides into the nests, Spring, hatchlings and the site step. Hearing the note or a name is free; the glow comes after two misses and a requested hint counts once per step (plan, reason, site). Badges say "N pairs, M related" because a related pair can be an aunt and a niece.

On an upright phone at levels 2–4, swipe the tree sideways to follow the family lines and see every turtle. The cards are 88 units wide and the nests, Spring and the keeper choices stay in place.
