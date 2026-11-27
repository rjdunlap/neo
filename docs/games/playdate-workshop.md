# Playdate Workshop

<!-- generated: from src/games/playdate-workshop; edit the text below the end mark (npm run game-docs) -->

**ID:** `playdate-workshop` · **Land:** Story Grove · **Ages:** preschool–school · **Challenge:** logic · **Plays by:** touch · **Ghost finger:** yes

**Skills:** taking turns, listening, planning, shared goals, repair

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1 |
| pre-K | 1–3 |
| school | 3–5 |

| Level | Plays like |
| --- | --- |
| 1 | Stamp and pass: one stamp pad, a star on each friend's page |
| 2 | Two ways to make: take turns or roll together for one banner |
| 3 | My page, our plan: a plan that works for both friends' requests |
| 4 | The smudged banner: fix the spill so both friends' requests are met |
| 5 | A new idea: change the plan when a friend has a new request |

<!-- end generated -->

**Starts as:** two critter friends say what they would like; give the one stamp pad to one, stamp, then pass it to the other

**Grows into:** choose how to make one four-cell banner (take turns or roll it together) from plan cards you can try first, then a page for one friend and a banner for both, where leaving out the page-asking friend is a plan that cannot be made. No misses; the lightbulb gives one hint per decision

## Design notes

*preschool–school (levels 1–5; preschool 1, pre-K 1–3, school 3–5) · after the social-emotional study; [definition](../definitions/playdate-workshop.md).* Two critter friends stand at a craft table and say, with a picture bubble each, what they would like. Fictional island friends only; nothing says how any real child should feel. Challenge `logic`; skills taking turns, listening, planning, shared goals. Layout is a 1024×768 box centred in every view.

Level 1, *Stamp and pass*: give the one stamp pad to a friend, stamp, pass it, stamp again; tapping out of turn is refused and free. Level 2, *Two ways to make*: one four-cell banner made either by taking turns or by rolling it together; plan cards with Try it (ticks and outlines the request bubbles with the friend's line) and Make it. Level 3, *My page, our plan*: four plan cards where one friend asks for a page and the other for a banner; "Just the banner" leaves the page-asking friend out and cannot be made, and two unmet previews glow that request.

Misses and hints: misses are always 0; refused taps, previews, Undo, back-to-cards and Watch again are free. The lightbulb (also Show a hint) counts one hint per decision (plan, then make). The pet button picks (1) then makes (1); Help me make it costs 2 at every level. At level 1 the first give counts as its own plan decision, so the pet doing both roles costs 2 there too. Finish sits over the cleared tray and Watch again at the start of the button row so the made banner stays in view. Co-play and off-screen tip are in the module. One new voice clip (game title). Browser suite `playdateworkshop`. Open: the device and person checks in DEVICE-CHECKS.

Levels 4 and 5 (school; [definition](../definitions/playdate-workshop-4-6.md), built from the same rules): level 4, *The smudged banner*: a spill covers one banner cell (nobody's fault); two repairs, *Stamp over it* and *Roll over it together*, meet both friends, and *Start a new banner* leaves the friend who wants to keep the made stars out (preview only). *Try the other way* replays the other repair free. Level 5, *A new idea*: the friends make two stars in turns; a bell rings and one friend asks for flowers on the last two, the cards return (Flowers by stamp, Flowers by roller, *Keep going with stars* as the draft) and the two stars stay on the banner. Undo past the change restores the first request. Misses stay 0; hints are at most 2 (level 4: plan, make) and 3 (level 5: plan, revise, make).

Where the build differs from the definition: the change point at level 5 is two *stars made* (four accepted actions), as the definition's "two stars on the banner" says; the first Plan phase has the one card, *Take turns*. The flower stamp reuses the pad (passed on, drawn as flowers), not a separate tool. Try the other way plays the other repair on a fresh start but does not ghost it. Level 6 (*Ask first*) is not built; `LEVELS.school` ends at 5 until it is.

The new lines of levels 4 and 5 each carry the child's name (`{name}`), so they are spoken by device speech and no clip had to be rendered; a later `Better voice` pass may give them clips.
