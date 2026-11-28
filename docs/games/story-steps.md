# Story Steps

<!-- generated: from src/games/story-steps; edit the text below the end mark (npm run game-docs) -->

**ID:** `story-steps` · **Land:** Story Grove · **Ages:** lap–school · **Challenge:** words · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** sequencing, cause-and-effect, storytelling, prediction

| Band | Levels, easiest first |
| --- | --- |
| lap | 15 |
| toddler | 15, 1, 2 |
| preschool | 2–5 |
| pre-K | 4–8 |
| school | 6–14 |

| Level | Plays like |
| --- | --- |
| 1 | Finish a two-picture story, with the beginning shown |
| 2 | Choose what comes next in a three-picture story |
| 3 | Put three story pictures in order |
| 4 | Put three pictures of a changing story in order |
| 5 | Tell a whole story in four pictures |
| 6 | Fill the missing middle, leaving out pictures from another story |
| 7 | Build a four-picture story from six mixed pictures |
| 8 | Choose the picture that caused the shown effect |
| 9 | Fix a four-picture story by swapping pictures |
| 10 | Untangle two three-picture stories into their own rows |
| 11 | Use a visible clue to choose what will happen next |
| 12 | Story Theater: choose a cast, weather and prop, then watch your picnic |
| 13 | Story Theater: change one event and compare two picnic endings |
| 14 | Story Theater: Two Viewpoints, hear two friends and choose an ending |
| 15 | One picture grows: put the next picture in the space |

<!-- end generated -->

**Upright on a phone (2026-11-19).** `layout.ts` holds the placing as pure functions for all five modes (`stripLayout` for levels 1–8, then repair, untangle, predict and Story Theater). Held upright (768 wide) the 4-slot strips stand 2×2 with trays of 4–6 pictures in rows of 2 or 3 (four slots of 164 and a row of four 156 pictures do not fit one row); untangle's anchor picture sits left of three slots; Theater's three groups stand one above another with the stage at 0.85 scale, its four buttons in a 2×2 and the compare thumbnails at ±200. `upright.test.ts` checks every level (all eight strip plans × six seeds, repair, untangle, predict, theater) on the four upright views. Sideways is unchanged.

**Starts as:** lap opens with one picture that grows in when it is put in the space; toddlers meet it first too, then finish a two-picture story

**Grows into:** order four pictures, fill missing middles, leave out unrelated pictures; choose a cause from eight pairs; repair a mixed-up story with swaps and undo; untangle two stories into separate rows; predict endings from eight authored clue stories; make narrated picnic shows and revise one event in Story Theater (school 12–13); hear two friends' viewpoints and choose an ending that keeps both wishes (school 14); eleven sequencing stories

## Design notes

The first seven levels progress from a shown beginning through three- and four-picture ordering, missing middles, and unrelated distractors. Eleven stories, each four pictures drawn with one camera: a flower, a block tower, a snow friend, a butterfly, a sandcastle, a sandwich, an apple tree, washing the dog, washing the picnic blanket, a rainy day and getting ready for bed. Each level draws from its own pool: levels 1–2 from the stories where a picture is built on the one before (a tower, a snow friend, a sandcastle, a sandwich, and a flower at level 2), level 3 adds the apple tree, level 4 draws from flower, butterfly, apple, dog and the picnic blanket, and levels 5–7 from all eleven. Extra pictures from another story never come from a lookalike of the round's own story (a seed is a flower's or an apple tree's, and a stack is a tower's, a snow friend's, a castle's or a sandwich's), and level 7's two extras come from two different kinds of story, so the story cannot be spotted from one end. Completed pictures are narrated in sequence; the music-note button reads only already placed pictures. Cards belong to a known story and stage, so every missing position has one answer.

Level 8 (pre-K and school), **Choose the cause**: an effect is already shown, and she drags its cause from three pictures into the glowing space before it. Eight authored pairs show spilled water, fallen blocks, a muddy boot, a popped balloon, a shining lamp, a ringing bell, cut paper and wheel tracks. A wrong drop names that action and asks her to reconsider; two misses glow the cause and count one hint. A correct cause completes the two-picture strip, narrated with a “because” explanation. Replay reads the shown effect without giving away the cause. The ghost finger follows the same missing-picture rule.

Level 9 (school), **Fix the mixed-up story**: a seeded draw from the eleven stories starts with two neighboring pictures reversed in a full four-picture strip. Tap one picture then another to swap them; tapping the selected picture again cancels selection. The music button narrates the current order without changing it, and the curved arrow undoes the last swap for free. Swaps are experiments, with no misses. After eight swaps without finishing, one hint names the picture that belongs in the first misplaced position and glows that position; the glow follows it through further experiments without charging again. Putting the full strip in order triggers its narration and one sticker, with help or without. School extends from 6–8 to 6–9, preserving saved levels and pins; younger ranges stay as before. The ghost finger fixes the first misplaced position through the same two card taps, taking at most three swaps from any order.

Level 10 (school), **Untangle two stories**: six pictures (stages 0, 1, 3 from each story) share a tray under two rows. A tappable end-picture beside each row identifies its story, with a spoken name. Drag each picture into its own row’s first empty space; either story can advance first. Pairings exclude the same visual family and dog/bedtime and laundry/bedtime in both orders, whose soap and suds pictures look alike. Wrong-row or out-of-order drops receive a gentle boing and a spoken question; two consecutive misses glow a useful next card and count one hint. Replay narrates only placed cards, top story then bottom story. Both completed rows are narrated before one sticker. School extends to 6–10 without renumbering levels or pins; younger ranges and saves stay unchanged. The ghost finger uses the same six drags.

Level 11 (school), **What will happen?**: a seeded draw from eight authored clue stories shows three pictures and two possible endings. The clues are dark clouds, a hand pushing blocks, a full bucket tipping beside a sand tower, top bread coming down, opening petals, an apple growing on a branch, emerging wings, and bedding ready beside pajamas. Endings are alternatives within the story rather than unrelated cards. Drag an ending to the final space: an unsupported prediction is shown and narrated before returning to the tray, with spoken attention to the named clue. The first unsupported choice is free exploration; every repeated unsupported choice counts a miss, and the second unsupported choice glows the clue and records one hint for the round. Tapping a shown picture speaks its sentence; replay narrates all three shown pictures without giving the ending away. The supported ending is narrated with an evidence explanation before one sticker. School reached 6–11 here; younger ranges, saved levels/pins and save format are preserved. The ghost finger makes the same supported drag.

Levels 12–13 (school), **Story Theater**: choose Bunny or Bear, Sun or Rain, and Blanket or Umbrella, then Watch a narrated four-scene picnic. All eight combinations are valid; rain with a blanket ends in a friendly indoor picnic. Level 12 ends only when she taps **Take a bow** after watching. At level 13, the first show stays visible and the cast stays fixed: change exactly one of weather or prop, watch the revision and compare its consequences, then take a bow. Switching the revised field restores the other field to the first show’s choice. Watch replays the current draft; Undo restores one edit; the lightbulb speaks and glows a useful next action, counting one hint per request. Creative choices and incomplete presses cost no misses, and there are no automatic hints or round timers. One shell sticker follows the explicit bow, including with help. No stories are saved. School is 6–13; younger ranges and existing levels 1–11 are unchanged. The how-to card and ghost finger follow these same taps. Broader theater, younger placement and kept books remain proposals.

Level 14 (school), **Two Viewpoints** ([definition](../definitions/two-viewpoints.md)): a picnic horn starts lively music. She taps both friends to hear their own words, one who loves the music and wants to dance and one who finds it too loud and wants a quiet spot (Bunny and Bear swap roles by seed), then picks one of four pictured endings and taps Watch. *Stay by the horn* and *Turn it off* each leave one friend's wish unmet; *Two spots* and *Shady hill* keep both. Hearing either account again, trying a one-sided ending once, Undo and watching before both accounts are heard cost nothing; watching the same one-sided ending a second time counts a miss with a gentle boing, the second miss glows *Two spots* and counts one hint, and each lightbulb request counts one hint. Take a bow needs a watched working ending and gives one shell sticker, including with help. No story is saved. School is now 6–14; levels 1–13 and younger ranges are unchanged. The optional comparison thumbnails in the definition (open decision 2) were left out to keep the upright stage clean; the rules do not depend on them.

Level 15 (lap and toddler), **One picture grows** (the dive's level 0a): `GROW_LEVEL` and `GROW_PLAN` in `logic.ts` give a two-card strip from the tower or flower story (stages 0 and 1, "One block sits on the ground" then "We add a second block", or seed then "A little sprout grows"): the first card is shown and the next is the only card on the tray, so there is no wrong answer, no miss and no hint. The scene accepts any put-down, or a still tap on the picture, wherever it lands; the placed picture grows in over about one second (scale 0.35 to 1.15 to 1, a bell and sparkles), then the usual read-aloud and finish. The new slotted voice line `story.grow` ("Put the picture in the space, {name}, and watch it grow!") plays on device speech. Lap runs 15 only; toddler runs `order: [15, 1, 2]`, so toddlers meet it first and `entryLevels` is `[15]`. Level 0b (press the picture to watch) is not built. Both 0a and 0b need a person check on a real one-year-old before they are relied on.
