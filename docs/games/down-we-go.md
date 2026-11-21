# Down We Go

<!-- generated: from src/games/down-we-go; edit the text below the end mark (npm run game-docs) -->

**ID:** `down-we-go` · **Land:** Bubble Beach · **Ages:** pre-K–school · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** ocean, light, measuring, evidence

| Band | Levels, easiest first |
| --- | --- |
| pre-K | 1–2 |
| school | 2–4 |

| Level | Plays like |
| --- | --- |
| 1 | Down we go: ride the lantern past every knot, then plant the seaweed on the deepest ledge it can grow |
| 2 | Measure first: choose which knots to measure on a five-knot rope, then plant the seaweed as deep as it can live |
| 3 | Clear water, cloudy water: guess whether the seaweed lives deeper or not as deep in the next cove, then find its deepest ledge |
| 4 | Half each knot: choose the sun dial that fits a covered knot, from the rule that each knot leaves half the light |

<!-- end generated -->

**Starts as:** a boat on a calm sea lowers a lantern down a knotted rope; at each knot a sun dial opens as many petals as there is daylight left and the water deepens in colour, then she plants a seaweed sprout on the deepest ledge where enough light still reaches.

**Grows into:** measuring first (level 2: choose which knots of a five-knot rope to measure before planting). clear and cloudy coves (level 3: a free guess on two plates, then the deepest ledge in that cove) and each knot leaves half (level 4: a covered dial and three dial cards). All four levels are built: [definition](../definitions/down-we-go.md).

## Design notes

Built from the [definition](../definitions/down-we-go.md) (batch `down-we-go 1`, levels 1-2; batch `down-we-go 2`, levels 3-4, school band now 2-4, pre-K unchanged). Home land Bubble Beach (the lands test passed; the pre-K side now pages); region tinker-lab. The sun dial reads daylight only; the lantern is her light and is never claimed to grow seaweed.

- **Misses and hints.** Planting on a too-dark ledge is a counted miss; two misses show one glow hint. A shallow ledge that is still lit is free (it grows, with "can it live deeper?"), and at level 2 an unmeasured ledge is free ("Now we know"). At level 1 the ledge tapped before the ride finishes is free. The only help button is the pause sheet's Show a hint.
- **Departures from the definition.** (1) No round counter exists, so level 1's first dive of every round is the authored [8,4,0] and the other two are seeded; the authored three play in full only in the how-to demo. Level 2's first dive is the authored [8,8,4,1,0]. (2) One added voice line, `down.ride` ("Pull the lantern all the way down first."), for a ledge tapped during the level-1 ride.
- **Source check (S1).** NOAA's light-travel page supports "rarely any significant light beyond 200 meters" and that photosynthesis is no longer possible beyond; it does not mention seaweed itself, but NOAA's kelp page says kelp forests form in shallow open waters "because of their dependency upon light for photosynthesis" and that kelp are large brown algae. NOAA's bioluminescence page gives "light produced by an organism using a chemical reaction" and that most animals between 200 and 1,000 m are bioluminescent. So `down.why` and `down.glow` are supported. `down.cloudy` and `down.limits` were checked in batch 2 (below).
- **Level 3 (coves).** Two coves per round, clear then cloudy or the reverse (authored clear-to-cloudy needs 2); cloudy water is drawn murkier. Before the first cove's dive she guesses Deeper or Not as deep on two plates for the next cove: the guess is free either way, never a miss. The first cove's dials stay in a 4-dial logbook column (4 of the 5 knots: the last is always 0 and the pet's corner is clear, a departure from the definition's five). The four predict-result voice lines are keys `rightClear`, `rightCloudy`, `otherClear`, `otherCloudy`, so each is true for its water.
- **Level 4 (half each knot).** A dial sits covered under a shell and she picks one of three dial cards. The first question is free; a later wrong card is 1 miss; two misses on a question glow the right card (1 hint). The pause sheet's hint is 1 hint and splits the dial above. The lantern is display only (not draggable) and drops to the covered knot after the right answer. The pool is the definition's four questions.
- **Source check, batch 2 (S1).** Re-read 2026-11-20: the University of Hawai'i page supports clear tropical water's lit zone of about 80 m against turbid water's "a few centimeters", and NOAA's turbidity page supports "light-blocking particles", so `down.cloudy` stands. No source stating the halving or exponential rule was found, so `down.limits` ends at "The real sea is far deeper." and the halving stays the game's own toy rule, never claimed as how the sea works.
