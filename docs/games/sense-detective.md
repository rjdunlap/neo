# Sense Detective

<!-- generated: from src/games/sense-detective; edit the text below the end mark (npm run game-docs) -->

**ID:** `sense-detective` · **Land:** Tinker Lab · **Ages:** pre-K–school · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** observation, evidence, senses, comparing

| Band | Levels, easiest first |
| --- | --- |
| pre-K | 1–3 |
| school | 2–5 |

| Level | Plays like |
| --- | --- |
| 1 | Peek inside |
| 2 | Look or listen? |
| 3 | Which could it be? |
| 4 | Narrow it down |
| 5 | Can we tell? |

<!-- end generated -->

**Starts as:** choose Look (a peephole outline) or Listen (the parcel's sound and a matching picture) to find which toy is in the wrapped parcel, then pick its toy on the shelf and Check

**Grows into:** level 1 a look decides (bell or rattle); level 2 a look leaves bell and drum both possible, so she listens; level 3 (pre-K, school) two parcels, Look only, select every toy the look allows; level 4 (school) a look gives "so far", then she listens and keeps the one toy that fits; level 5 (school) two parcels where a look can leave two toys, a free "both fit" when she picks one, and a *Can't tell yet* card, then the eye (a miss) or the ear (reveals); a toy the clues rule out is a gentle miss, and Check on a toy that might still be it asks for another clue and is not a miss

## Design notes

*[definition](../definitions/sense-detective.md).* A wrapped parcel has come to the toy museum, and its toy belongs on the empty shelf. Beside the parcel are a round **Look** window (a peephole that shows the toy's outline from above) and, at level 2, a **Listen** ear (the parcel wobbles, the toy's sound plays and a matching sound picture drops in). Each clue lands as a card in the evidence strip. She taps a toy card on the shelf (it plays its own sound, so she can compare) and presses the green Check. Three invented toys, not claims about real ones: bell (round view, ring), rattle (handle view, shake) and drum (round view, beat). Level 1 *Peek inside*: bell and rattle with Look only, so a look decides. Level 2 *Look or listen?*: bell and drum with both buttons; the look is a plain circle for both, so she needs the other sense. Level 3 *Which could it be?* (pre-K, school): two parcels, Look only; she taps every toy the look allows (the pet says "One more" while one is missing), Check passes when the selection is exactly the allowed set, and a kept ruled-out toy is a miss and deselects. Level 4 *Narrow it down* (school): one bell-or-drum parcel; the look's set gives "so far", then the Listen ear appears, and she keeps only the fitting toy (Check before listening stays "so far", not a miss). Help counts per parcel; the glow shows the useful edit. Level 5 *Can we tell?* (school): two quilted parcels (Look only); stage A picks the one fitting toy or the *Can't tell yet* card (one toy while two fit is a free "both fit"; *Can't tell yet* when the look decides, or a ruled-out toy, is a miss); stage B picks the eye (a miss) or the ear, which reveals: the quilt slides off, the sound plays, its card drops in, the remaining toy glows and the parcel opens. Pre-K plays levels 1-3, school plays levels 2-5. The hidden toy comes from a shuffled bag so each takes a turn; the same seed gives the same round.

Check compares the selected toy with the toys the revealed clues still allow. If only that toy fits, the paper unfolds, the toy hops onto the shelf and the round finishes. If the clues rule it out, that is a gentle miss and the pet says why ("The peephole shows a handle. The bell has no handle."). If it fits but another toy fits too (or nothing has been revealed), it is "not yet": free, the pet asks for another clue and bobs the unused button, and a lucky guess never finishes a round. Free: Look, Listen and replays, selecting or changing a toy, Check with nothing selected, a not-yet Check. Pressing Check again with nothing changed repeats the reason and counts nothing more. Two misses glow the one possible toy (one hint, once per round); Show a hint runs the deciding clue first if it has not been made, then glows it, still at most once. A zero-miss round shows she observed before choosing, not that she chose the right sense unprompted. Every sound has an equal picture, so hearing is never required. Start again rebuilds the same round and keeps misses and hints. Nothing is saved, filed in the journal or shown as real, and there is no couch play. The game silences the island music (`silenced(STYLES.quiet)`) because its sounds are the clues. The ghost-finger bot looks before it checks (level 2: look, listen, compare, pick, Check). Co-play: one chooses what to find out, the other says what the clue shows. Off-screen: with a grown-up, put a toy in a bag, feel and shake it, and say what you know and what you can't tell yet.
