# Decisions of 2026-11-17

The developer, after the READY refill of 2026-11-17 listed what it had skipped as gated: "Can you make the decisions as though you are the owner." These are those calls, made under the [standing rules of 2026-10-23](DECISIONS-2026-10-23.md#standing-rules), the [parked device checks](../DEVICE-CHECKS.md) ("nothing waits on a parked check") and the current focus on phone play. Each is recorded in its source and can be reversed by a playtest note or a word from the developer.

## Rules used

- **A gate that a session can meet is not a gate.** A screenshot review, a layout or geometry probe and a land capacity test are done by the building session, first, in the same slice.
- **"After it is played" means parked.** Levels that waited for a child or a person to play the earlier ones are defined now on the study's lean; a playtest note can still change them before or after the build.
- **The youngest bands come first among optional openings.** The game is for a one-year-old: a cheap lap or toddler entry that a dive already sketched is opened; optional openings for older bands follow the dive's default.
- **The journal files observations about the world.** A finding she could repeat outside the game (a longer rope swings slower) is filed; numerals, fruit kinds, berry colours and tidy rows are not.
- **Kept for the developer:** an irreversible step, a named family reviewer (until the developer [answered that](#answered-the-same-day-the-portuguese-reviewer)), money, accounts and the child's data. The deferred research scopes (living cultures, colonization, practical safety, sign language) stay deferred.

## Phone play

| Call | Decided | Why |
| --- | --- | --- |
| Upright order for the school games ([roadmap](../ROADMAP.md#upright-games-for-grown-ups-recommendations-2026-11-09) 3) | Fits-as-is games first, six at a time and six kinds where the list allows, then the small-fix games with music first, then games that need a layout. | It is what batches 5–7 already did and it is the cheapest way to widen the six; the recommendation's "music first" is kept inside the small-fix step. |
| Consecutive days (roadmap 4; Today's six "recently played") | Deal the ready pool across the week from a weekly seed; no history is read and no save field is added. | Thirty games are upright, so there is something to rotate; a game that returns two days running is the first thing a daily player notices. |
| Grown-up share of a phone six (roadmap 5; Today's six "the grown-up blend") | Four grown-up games and two early-school games at their hardest. | The recommendation's own threshold (all the first nineteen grown-up games upright) is passed at twenty-two; the two players are grown-ups. |
| Thumb size in pixels (roadmap 6) | Adopted for upright grown-up layout tests: record the smallest target in CSS pixels at 390 × 844; a board under about 44 zooms or scrolls. One read-through measures the games already upright. | 64 units is about 33 pixels on a phone. |
| New grown-up games ship upright (roadmap 7) | Adopted: `upright: true` and the upright layout test are part of a new `grownup` game's first slice. | The backlog stops growing. |
| Shared or per-profile six; the island's `?daily` | The definition's proposals stand (shared per band and day; `?daily` only). | Nothing in play has argued otherwise. |
| TotoLogic P1 to P4 and P7 | All admitted. P2 (add a player with taps) is a build. P3 (the question on screen) is defined first: always for the `grownup` band, for `school` when speech is off or the phone is muted, never for younger bands. P1 (play first, set up after) is defined after P3; its guest round awards nothing until the blank profile is adopted, and adoption is a rename. P4 and P7 take their notes, then their builds. | A muted phone is how grown-ups play in company, so P3 is worth most; all of it is local save and shell work with no account or child data beyond what a profile already holds. |
| Better voice V1, the rest of the script | Rendered in batches without waiting for the listen, the lines of the upright games first, each batch recording the size it adds to the offline cache. Slotted lines (V3) stay on device speech; nothing is stitched until someone has listened. | S6: the listening judgement is not a blocker, and one game in two voices is worse than either voice. A listen can roll a batch back. |
| The other residents (Pok Pok P5) | The session judges Trill from a scripted capture strip; if it reads as alive the other five follow, and a phone look can roll them back. | Judging a capture by eye is what a screenshot review is. |

## Games

| Call | Decided |
| --- | --- |
| Puzzle pages, how many to queue | PP2 Domino Pond, PP9 Word Code, PP3 Bunny Patches and PP4 (Garden Rows' tall flowers) are admitted for definition, one session each, in that order. PP5 to PP7 keep the study's condition (after PP2 or PP3 is built); PP8 is written after that. |
| Example Express level 3 (D3) | Admitted. The remaining person gates concern pre-K, not the school level. |
| Lantern Lake "capacity test" | Met: lands page since PR #915 and the lands tests are the capacity test. Tide Tables, Truth Bridge, Fence the Field, Shadow Play, Key It Out, Jar Clues and Harbor Orders are ordinary next definitions, one session each. |
| Levels waiting on play | Defined now on each study's lean: Not Always 4–6, Notice Board 4–5, Shell Rows 4–5 (Last Pebble after it is built), Swap Meet 5–6, Village Vote 4–6, Look It Up 4–6, Lasso Loops 7, Word Glue 4–5, Thought Bubbles 4. |
| Gem Swap | Levels 1–2 open to `school`. The roadmap's Zen refill is dropped (levels 5–8 are the "more"). No couch course. |
| Lift It | Toddler entry, level 10 *One big pull*: yes. Pre-K stays below level 9. |
| Block Garden | Stays pre-K and up; level 13 stays a proposal. |
| Swing Pals | Level 7 stays where it is built. *Paint the beat* is a creative level, kept only on request through the saved-creations path every other creation uses; it needs a definition. The journal files "a longer rope swings slower". Level 9 takes its layout probe and definition. |
| Draw the Pattern | Lap stays 1 and 10. A school window opens for level 11 if the geometry probe passes in the building session. Level 12 *Your pattern* lives here, not in Pattern Train, because the action is drawing; it needs a definition. |
| Puddle Gobble | Lap entry, level 13 *Splash*: yes. No journal entry. |
| Fruit Slice | The fractions rung is closed. No journal entry. |
| Number Trails | A school window at level 7 if the layout probe passes in the building session. No journal entries. |
| Mossy Path | Lap entry, level 12 *Turtle walk*: yes. Toddler stays at level 4. No journal entry. |
| Bolt Boards | Level 8 stays where it is built. Lap entry (one huge bolt): yes. |

## Rework

| Call | Decided |
| --- | --- |
| RW14 slice 10 | The session does the screenshot review of slices 4 and 6 beside the untouched lands itself, records it, and goes on to the backdrops if it passes. |
| RW10 | Its definition starts now: the dependency on RW08 is met by slices 1–2, and a packet needs no cutover. RW11 and RW12 follow it as written. |
| `paint-mixer` 4 | The hatch colour step and the grown-ups' select are built now; the recolour of a dress or collection book waits for RW10's packet. |
| RW08 cutover | Not yet, and still the developer's word. Nothing above waits on it, and deleting the island cannot be undone. |
| Portuguese reviewer; building the language plumbing early | Still the developer's to name; nothing is built before that. |

## Answered the same day: the Portuguese reviewer

The developer, later on 2026-11-17: "I also don't have a Portuguese reviewer, AI will be handling that part." So the last row above is superseded: nobody is to be named, the assistant writes and reviews every Portuguese line, and WL2 (the build of stage 1) is queued in [READY](../READY.md). The [definition](../definitions/additional-languages.md#assistant-review-of-the-portuguese-2026-11-17) sets out how the review is done so that it is an honest substitute: one pass writes and a separate pass checks against European Portuguese dictionaries, the grown-ups' page says an AI assistant chose and checked the words, a family member's correction always wins, and how a phone's voice sounds is a playtest question that gates nothing. The other family languages are reviewed the same way unless the developer names someone. A family reviewer is no longer one of the calls [kept for the developer](../WAITING-ON-DEVELOPER.md).
