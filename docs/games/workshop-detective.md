# Workshop Detective

<!-- generated: from src/games/workshop-detective; edit the text below the end mark (npm run game-docs) -->

**ID:** `workshop-detective` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** deciding what two records can show, choosing a test that tells two explanations apart, claiming only what the records support

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1 |

| Level | Plays like |
| --- | --- |
| 1 | Two notes, one bench lamp: find the test that tells them apart |

<!-- end generated -->

**Starts as:** mark two notes about a made-up bench lamp against two records, then try the lever setting that tells them apart.

**Grows into:** One case today (level 1). Later proposals, each needing its own definition: a three-note case, a lever interaction, a scoped-claim step ("in this lamp" against "in every lamp") and a case no test can settle. See [the definition](../definitions/workshop-detective.md).

## Design notes

Built from [the definition](../definitions/workshop-detective.md); rules are in `src/games/workshop-detective/logic.ts`, the scene in `index.ts`.

- **The lamp is invented and labelled so** ("A made-up lamp. It follows its own rule."). Two lever pairs (shell/feather, star/moon) and four shades are drawn from the seed; the look fixes which note is true, so a lamp that looks the same always follows the same rule, and each note is true in eight of the sixteen looks.
- **The opening Check comes first.** The levers stay latched until a Check passes with both notes marked fits (the records cannot decide). A tap on a latched lever wiggles it and says "Check the notes first.", free.
- **Misses.** One per distinct wrong mark set within a record state (undecided or decided). The same marks again replay the explanation, free; the first separating try changes the state, so the same marks can count once more. An incomplete Check, lever flips, tries, repeats and card taps are free.
- **Hints.** The second counted miss gives an assisted hint; Help asks at any time, each new hint counts once and a repeat is free. The walk is at most three hints: light the opening records with both predictions, then the fixed separating setup (first lever up, second down), then the first separating record and the note it rules out. The hint names the true note only with a record that shows it. The assisted hint is owed once per round, so it is given even when a touch cuts the explanation short.
- **The caption is fuller than the speech.** Speech plays the lines in sequence; the caption carries the whole working with the record number in it, as the definition asks.
- **Completion.** The right Check once a separating record exists closes the case, finishes through the shell with the round's misses and hints, and gives one sticker, with help or without.
- **Upright phone.** A layout test keeps every target at least 64 units (the levers and Try it keep 100), and the strip, bench, notes and buttons fit above the caption at 390 x 625 with the guide showing. The browser suite `workshopdetective` runs in a touch context.
- **Model wording** (tag, instruction, closing line, grown-ups' wording) was checked against reputable sources: see [Q6 in the inquiry study](../deep-dives/subjects/inquiry.md#build-slices-in-order).
