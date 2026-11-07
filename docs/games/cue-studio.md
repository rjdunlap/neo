# Cue Studio

<!-- generated: from src/games/cue-studio; edit the text below the end mark (npm run game-docs) -->

**ID:** `cue-studio` · **Land:** Tinker Lab · **Ages:** pre-K–school · **Challenge:** logic · **Plays by:** touch · **Ghost finger:** yes

**Skills:** following a sequence of instructions, choosing a command, order, changing a plan

| Band | Levels, easiest first |
| --- | --- |
| pre-K | 1–2 |
| school | 3 |

| Level | Plays like |
| --- | --- |
| 1 | Make a move: choose one action, wave or turn, and play it |
| 2 | My little show: make any two-action show and play it |
| 3 | Fix the cue: repair the pictured order, then check the show |

<!-- end generated -->

**Starts as:** tap a Wave or a Turn card into a slot on a shelf, press Play (or Step), and watch your own pet perform the show left to right, each slot lighting as it acts; Finish after a complete run

**Grows into:** level 2 has two slots: tap an occupied slot, then a card, to change it; Undo takes back the last change, any edit needs a new run, and a bulb Help fills a slot, plays the show, then points at Finish; free creation at pre-K; school level 3 asks for Wave then Turn, with a free watch, local repairs, Check, and graduated help; only a wrong Check is a miss

## Design notes

*After ScratchJr-style sequencing and the Kidbots tile idea, with no coding claims; [definition](../definitions/cue-studio.md).* The saved companion stands on a stage above a wooden shelf of one slot (level 1) or two (levels 2–3). Two action cards sit in a palette: Wave (a hand) and Turn (a circle arrow). She taps a card to fill the first empty slot; she can tap an occupied slot (it shows an arrow and a dark outline) and then a card to replace it. A full shelf with nothing selected changes nothing and the pet says "Choose a place to change". Undo takes back the last change, one step. Play runs the show left to right on the pet (Wave is a mitten raised and lowered, Turn a full spin), each slot glowing with a lit trace dot as it acts; Step runs one move per press. At creative levels 1–2, Finish (a blue tick) appears only after a complete run of the current show, and any edit needs a new run.

At pre-K levels 1–2, misses are always 0, since a show is free creation; empty Play or Finish and edits that change nothing are inert, not wrong. Help (the bulb) first offers a Wave in the first empty slot (one hint per slot, never twice even after Undo or restart), then plays a full unwatched show (one hint, once), then points at Finish for free. Bands: pre-K 1–2, school 3–3 (decided 2026-10-23). At level 3, the pictured request is Wave then Turn, starting from Turn then Wave. Play and Step are free experiments, with separate requested and actual traces. Only a full wrong Check counts a miss; two wrong Checks supply the earliest mismatch clue (one hint). Help gives a clue, then repairs that slot and demonstrates it, then repairs the next mismatch; assistance identities survive Undo and Start again, so the same clue/repair is never charged twice. Only a successful Check enables Finish; an edit or Undo clears it. Start again cancels a running Check. Programs are not saved; no couch play. Layout deviations from the definition: the landscape palette sits 32 units further left (x 96 and 224), and the portrait palette is at y 600 with the controls at y 748, so they clear the shelf. The ghost-finger bot plays level 1 (Wave, Play, Finish) and level 2 (Wave, Turn, Play, select slot 1, Turn, Play, Finish); at level 3 it watches the swapped show, repairs each slot, then presses Check and Finish. Music: the quiet style. Co-play: ask her what the pet will do before pressing Play, watch together, and take turns choosing a move. Off-screen: take turns giving each other a two-move show to act out ("wave, then turn around"), then swap the order.
