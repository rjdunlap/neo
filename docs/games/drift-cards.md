# Drift Cards

<!-- generated: from src/games/drift-cards; edit the text below the end mark (npm run game-docs) -->

**ID:** `drift-cards` · **Land:** Bubble Beach · **Ages:** school · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** ocean, currents, maps, evidence

| Band | Levels, easiest first |
| --- | --- |
| school | 1–3 |

| Level | Plays like |
| --- | --- |
| 1 | Where will it wash up? Tap the beach each card reaches |
| 2 | Send it to a friend: pick the boat whose card reaches them |
| 3 | Find the hidden current: pick the arrows under the fog that send every returned card where it was found |

<!-- end generated -->

**Starts as:** numbered wooden cards ride the arrows of a pretend sea from boats at the harbour wall; touch the sea and a dotted line shows two cells of the current ahead

**Grows into:** level 1: predict which beach each of three cards washes up on (West, South or East); the first card of a round is a free guess, a later wrong beach is a miss that traces the first two steps, two misses glow the beach, Show me traces the whole drift (one hint per card). Level 2: four beaches and four friends; tap a boat so the card reaches the friend who asked (any boat that gets there is right; a wrong boat's card reaches someone else and floats back, one miss; two misses or Show me glow a right boat). Level 3 (6×4 sea, a fogged 2×2 patch, returned cards shown as numbered flags on boats and in the finders' hands): lay one of three patch cards into the fog (free), then press Check; a patch a card contradicts is one miss once per patch, and that card rides to the wrong beach while its finder shakes their head; two different wrong patches glow the right card, Show me names the card that rules out the patch; a right Check rides every card back through her patch. Bubble Beach

## Design notes

*Levels 1–3 · after the oceans study; [definition](../definitions/drift-cards.md).* A pretend sea of current arrows (east, south or west; none north) under a harbour wall. A numbered wooden card, not a bottle, rides the arrows cell by cell (about 0.35 s a cell) until it washes up on a beach. Touching the sea shows a dotted line two cells ahead, never counted. Art is code-drawn; music is the quiet style; the lines about real drift cards (`drift.real`, once per session after the first finish) rest on the NatureBridge Elwha 2015 study and NOAA's "What is a current?" (source check 2026-10-31).

Levels (school 1–3): 1 "Where will it wash up?": three cards from boats over columns 0, 2 and 4 of a 5×4 sea; she taps the West, South or East beach. 2 "Send it to a friend": three requests on 6×4 seas with boats over columns 1, 3 and 5 and four beaches (West turtle, South-west frog, South-east duck, East penguin); any boat that reaches the asked friend is right. 3 "Find the hidden current": a 6×4 sea with a fogged 2×2 patch (rows 1–2); returns show as numbered card flags on boats over the return columns and the same card in the finder's hand; she lays one of three patch cards into the fog (free) and presses the green Check. The cards and Check sit in a row under the sea in every orientation (a deviation from the definition's side column in landscape, which cannot hold three 160-unit cards and Check in a 768-tall view). The first round of each level in a session is the definition's authored sea; seas are seeded after that and no drift crosses another. Start again keeps misses and hints.

Misses and hints: the first card of a level-1 round is a free guess; a later wrong beach is a miss, the card stays and the first two cells are traced and spoken; two misses glow the right beach (one hint) and Show me traces the whole drift (one hint, one per card). At level 2 a wrong boat is a miss, its card drifts to whoever finds it and floats back, and the request stays; two misses or Show me glow a right boat (one hint per request). One sticker per round. At level 3 laying a patch is free; a contradicted Check is one miss once per patch (re-checking a ruled-out patch, even after Start again, is free and repeats its line); the contradicting card rides her arrows to the wrong beach while its real finder shakes their head. Two different wrong patches glow the right card (one hint); Show me names the card that rules out the patch in the fog and traces its ride, glows Check if the patch already fits (`drift.hint.3fit`), or with none in dims a wrong card and names its card (one hint per case). A right Check rides each finder's card back through her patch into their hand, then `drift.limits` once a session. Seeded cases have 2 or 3 returns with columns at least 2 apart; the fog never draws, shimmers or traces the true patch. `drift.instruct.3` says "fit every card" since there can be three returns. `drift.limits` ("Real currents change with the wind and the tides. This pretend sea stays still.") rests on NOAA's "What is a current?" (source check 2026-11-02; it says nothing about seasons, so the definition's wording was changed). Open: a card mid-drift during a rotation finishes at its old coordinates (rare, self-corrects on the next card).

**A landed card never holds the next one (U7 fix batch 4, 2026-11-11).** At levels 1–2 `drift.landed` starts and the next card is held (level 1) or the next sea shown (level 2) at once with input open. At level 2 the friend's ask (`drift.instruct.2`) is spoken when the line ends, or at once if she picks a boat first. The first card's `drift.first` still holds, because it is a result. On the last card the line is heard out.
