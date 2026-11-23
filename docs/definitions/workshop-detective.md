# Workshop Detective, one case (definition)

Documentation packet, 2026-11-23, branch `claude/define-workshop-detective`, [PR #2060](https://github.com/rjdunlap/neo/pull/2060). Inquiry slice Q6 from the [study](../deep-dives/subjects/inquiry.md#build-slices-in-order), under its decision 3 (a labelled invented mechanism with its own `grownup` entry for 13+). Proposed game `workshop-detective`; nothing is registered or implemented. **Docs only.** One build batch follows below.

## What you do

A lamp from the lamplighter's bench at Lantern Lake has two levers, a shell lever and a feather lever, each up or down. Two cards on the bench record what the lamp did: both levers down, dim; both levers up, bright. Two notes beside it each give an explanation: *the shell lever sets the light* and *the feather lever sets the light*. One of them is right.

First decide what the two records can show. Mark each note **fits** or **ruled out** and Check: both notes fit both records, so the records cannot tell. Then set the levers and press **Try it** as often as you like. A setup where the notes disagree (one lever up, the other down) settles it. Mark the notes again and Check: the case closes when exactly the note that fits every record is marked fits.

The learning is the study's older inquiry step: tell a working result from evidence for a cause, accept that some records cannot decide, choose a test whose outcome would separate two explanations, and claim only what the records support. Repeating a setup adds nothing, because the lamp does the same thing every time.

Use stable level ID 1 and the `grownup` band only (`levels('grownup')` is 1 to 1). Use Tinker Lab as the learning region, the home of Ramp Race's fair tests, and Logic as the challenge. Add one Lantern Lake tile through the existing land paging: the [2026-11-17 record](../archive/DECISIONS-2026-11-17.md#games) settled that Lantern Lake pages and that the lands tests are its capacity test. Workshop Detective is not on that record's named list; it relies on the same paging rule, and the lands tests in the build batch check it. Mark the game `upright: true`. Use the classic round contract: level progress and one sticker. The lamp, the records and the marks are round state. Nothing is saved between rounds, and no record, lamp or note is kept.

`describeLevel(1)`: "Two notes, one bench lamp: find the test that tells them apart".

## The invented lamp

The lamp is made up, and the game says so. A tag hangs from it, drawn as a small card with a gear: "A made-up lamp. It follows its own rule." The instruction speaks the same idea before the first Check, and the how-to card shows the tag. The lamp has no wick, battery, wire or bulb to reason about; the levers are carved pictures, and nothing about a shell or a feather should suggest a real cause. There is no ramp, car, distance or near and far in it, so it is never read as a change to Ramp Race's height × glide rule, and Ramp Race's levels do not refer to it.

**Every round is a different lamp.** The round draws, with `ctx.rng`, one of two lever pairs (shell and feather, or star and moon), which lever sits on the left, the true note, and a shade colour from four palette colours. The pet opens with "A new lamp from the bench." The bench shows the previous lamp's shade colour on a hook at the side as scenery only, so a player who saw the shell lever decide last time sees that this is another lamp with its own rule. That is why the true note may change between rounds without feeling like a trick.

## The case

Write the levers as *P* and *Q* (for this lamp, P is the first lever of the pair and Q the second), each 0 (down) or 1 (up). The lamp is **bright** or **dim**.

**The two notes.**

- **Note P:** bright exactly when P is up.
- **Note Q:** bright exactly when Q is up.

The true note is one of the two. The lamp's result for a setup is the true note's prediction. Nothing is random after the round is drawn.

**The four setups.**

| Setup | Note P says | Note Q says | Role |
| --- | --- | --- | --- |
| P down, Q down | dim | dim | Opening record 1 |
| P up, Q up | bright | bright | Opening record 2 |
| P up, Q down | bright | dim | Separates the notes |
| P down, Q up | dim | bright | Separates the notes |

**Why this opening.** The opening records are always both down (dim) and both up (bright), the only pair of setups that both notes fit. Any other pair contains a separating setup and would decide the case before the player tests anything. Later variants must keep this property or define a different case.

**Useful tests.** Exactly two: P up with Q down, and P down with Q up. Either one decides the case. After one of them, the other agrees with the same note and adds a record without new information. Repeating an opening setup lights its existing card and adds nothing.

**The record state** is the set of distinct setups tried so far, starting with the two opening setups. It has two kinds:

- **undecided:** only the opening setups, so both notes fit every record;
- **decided:** at least one separating setup, so only the true note fits.

## Marks, the Check and every answer

Each note card carries two toggles, **fits** and **ruled out**, both unset at the start. Tapping one sets it and clears the other; tapping the set one again clears it. **Check** looks at the marks once both notes are marked; with a note unmarked, Check pulses the unmarked card and says "Mark both notes first.", free.

The two notes give four mark sets. Here is every mark set in both record states. *True* and *other* are the true note and the other note.

| Record state | Marks | Verdict | What happens |
| --- | --- | --- | --- |
| Undecided | Both fit | Right, the case stays open | "Right: both notes fit both records. Set the levers to find a test that tells them apart." The levers unlock |
| Undecided | One fits, the other ruled out | Miss | Ring the note marked ruled out and both records: "The [note] fits every record so far: both down, dim; both up, bright." |
| Undecided | Neither fits | Miss | Ring both notes and both records: "Both notes fit every record so far." |
| Decided | True fits, other ruled out | Right, the case closes | "[True note] fits every record. Record [n] rules out the [other note]." The round finishes |
| Decided | Both fit | Miss | Ring the first separating record and the other note: "Record [n] rules out the [other note]: [setup], [result]. The [other note] says [its prediction]." |
| Decided | Other fits, true ruled out | Miss | Say the same line as for both fit first, then "The [true note] fits every record." |
| Decided | Neither fits | Miss | Ring the true note: "The [true note] fits every record." |

**The opening Check comes first.** The levers are latched until a Check passes in the undecided state; a tap on a latched lever wiggles the latch and says "Check the notes first.", free. This asks the study's first question on its own: can these records decide? A correct "both fit" is right but does not close the case.

**After a separating test,** the marks stay as they were, so a player who marked both fit must now change one. A correct Check in the decided state closes the case at once. Further tries after a decision are free and need no new Check.

## Trying setups, feedback and credit

- **Setting the levers.** Tap a lever to flip it up or down. It clicks over on touch-down. The lamp shows a "?" until **Try it**.
- **Try it.** The lamp glows bright or dim with a soft pentatonic note (a higher note for bright), and the setup becomes a record card on the bench. A repeated setup lights its existing card instead of adding one, and the pet says "Same setup, same light. A repeat adds nothing new." A second separating test adds its card and says nothing more. There are at most four cards.
- **Free moves.** Flipping levers, trying any setup (repeats and uninformative ones included), tapping a record card or a note card to hear it, setting and clearing marks, and an incomplete Check are always free. Nothing is refused, and there is no limit on tries.
- **Misses.** A miss is counted only at a complete Check whose marks are wrong. Count **one miss per distinct wrong mark set within a record state**. Checking the same wrong marks again in the same state replays the explanation, free. A new record that changes the state lets the same marks count once more, because they are now a different wrong answer.
- **Why a miss counts here.** A Check is a worked claim: the records and the notes are on screen and settle the answer before Check is pressed, as with Check in Sorting Machine or Ramp Race's *What can we tell?*.
- **The second counted miss** gives one assisted hint, and **Help** asks for one at any time. Count each new hint once; repeating the current hint with no change replays it, free.
- **Predictions are not shown by default.** Each note card shows its rule as a picture (its lever up, then a bright lamp), not a forecast for the current setup. Working out what each note predicts for a setup is the whole of the test-choosing step; showing both forecasts all the time would turn the round into spotting two different lamps. The hint shows them.

**The hint walk.** Each hint is for the first unmet step:

1. **Undecided, the opening Check not yet passed:** light each record with both notes' predictions beside it: "Both down: both notes say dim. Both up: both notes say bright. Both notes fit." The player marks.
2. **Undecided, the opening Check passed:** pick the separating setup that sets P up and Q down (a fixed choice, so a replayed hint does not move), glow its two levers in their target positions, and show both predictions: "Shell up, feather down: the shell note says bright, the feather note says dim. Try it." The player flips and tries.
3. **Decided, marks wrong or unset:** ring the first separating record and the note it rules out, and say the line from the decided rows above. The player marks and checks.

From any state, following the hints closes the case in at most three hints. The hint never names the true note without a record that shows it, as the study requires. Help in the decided state with the right marks already set says "These marks fit the records. Check them.", free.

**Completion.** The case closes on the right Check in the decided state. The pet says the closing line, the lamp glows, and the game finishes once through the normal shell with the round's misses and hints. One sticker, with help or without.

## Play and presentation

- **Scaffold and helpers.** Use the [new-game scaffold](../NEW-GAME.md), `onTap`, the coach and the round helpers. Check the [reuse map](../DESIGN.md#reuse-map) for a two-state toggle, a record card and a Check button (Sorting Machine's sign cards and Ramp Race's trial cards) before drawing new ones.
- **Upright phone first.** At 390 × 625 with captions and the active guide, lay out the following, top to bottom:
  - the lamp in the middle of a strip with its tag, a lever on each side (each lever a target of at least 100 × 140 units), and **Try it** beneath it;
  - the bench: a row of up to four record cards, each showing its two lever pictures and a bright or dim lamp, each a tap-to-hear target of at least 64 units;
  - the two note cards side by side, each with its picture rule and its **fits** and **ruled out** toggles (at least 64 units each);
  - **Help** and **Check** in a row.
- **Targets.** The game is in the `grownup` band, so the minimum is 64 logical units; the levers and Try it keep 100 because they are the main action. A layout test checks every target's size and that the strip, bench, notes and buttons fit above the caption at 390 × 625 with the guide showing, and that the lamp keeps at least 160 units of height. If the test cannot be met, the building session first drops the printed text from the note cards (their picture rule and speech stay), then shortens the lamp to no less than 160 units; it never shrinks a target.
- **Landscape.** Put the lamp and levers on the left and the bench, notes and buttons on the right.
- **Captions and the guide.** Reserve their space first.
- **Reading.** Note rules and record cards are pictures first, with a short caption. Every card speaks when tapped, so the round never depends on print. Navigation to the game requires no reading.
- **State that does not lean on colour.** Bright is a lamp with rays and dim a lamp without; a lever's position is drawn by its angle; *fits* is a tick and *ruled out* a cross; a latched lever shows a latch.
- **Art.** Draw the bench, the lamp, its shade in the round's colour, its tag, the levers with carved shell, feather, star and moon pictures, the record cards, the note cards and the new hub icon (a lamp with two levers and a magnifying glass) in Pixi `Graphics` with palette colours. Use existing confirmation sounds and pentatonic notes from `src/audio/notes.ts`. Keep the land's music.

**Voice.** Keep the voice lines in `voice.ts`, and use the shell's Kokoro title and clip workflow. Every line is a whole line with no slots, written once for each lever pair where it names a lever:

- **Per lever pair (two pairs):** the two note readings ("The shell note: when the shell lever is up, the lamp is bright."); the four setup names ("Shell up, feather down."); the four predictions ("The shell note says bright." and dim, for each note); "The [note] fits every record so far." and "The [note] fits every record." for each note; "This record rules out the [note]." for each note; and the hint-2 line. That is 17 lines a pair, 34 in all.
- **Shared:** "Bright." "Dim." "A new lamp from the bench." "A made-up lamp. It follows its own rule." "Mark both notes first." "Check the notes first." "Both notes fit every record so far." "Right: both notes fit both records. Set the levers to find a test that tells them apart." "Same setup, same light. A repeat adds nothing new." "These marks fit the records. Check them." and the hint-1 line.

A miss or a hint plays its lines in sequence (for example the record's setup, its result, then the ruled-out line), and the caption carries the whole working with the record number in it; say on the game's page that the caption is fuller than the speech. A unit test checks that every verdict, explanation and hint the case can produce, for both pairs and both true notes, has its lines. The instruction is `ctx.instruct`: "One note is right. Mark what the records show, then test."

**How-to card.** Level 1 shows the tagged lamp, the two opening records, both notes marked fits, then the levers set to one up and one down with a "?" lamp, then the lamp lit and one note crossed. The ghost finger marks both notes fits, taps Check, flips the levers to the hint-2 setup, taps Try it, marks the ruled-out note, and taps Check.

**Solo and co-play.** Solo play has everything: the notes and records are all on screen, and no step needs a second person. With two grown-ups, or a grown-up and an older child, one sets the levers and, before Try it, the other says aloud what each note predicts for that setup; swap at the next lamp. Nothing on screen depends on it. `coplayHint` is for the early bands, so the game sets none.

**Off-screen.** None. Practical instructions are left out of this case, as the READY line asks; the plain *Two Tries, One Change* page card is the study's slice Q7 and waits on its own review.

**Grown-ups' wording.** Name what the game asks: "Decide what two records can show, then choose a test that tells two explanations apart." It makes no claim about scientific thinking in general, attention or school results.

## Identity and overlap

- **Ramp Race** (`ramp-race`) levels 4–7 compare real setups under the public ramp model and ask whether a comparison is fair. Workshop Detective has no variables to hold fixed: the explanations are given, and the skill is choosing the test that separates them. The study's proposed Ramp Race level 8 *Which test helps?* is superseded by this separate entry (decision 3) and is not proposed for Ramp Race.
- **Secret Code** and **Example Express** discover an unknown rule from feedback or labelled examples. Here the candidate explanations are a closed set of two, printed on the bench, and nothing is induced.
- **Sorting Machine** (`sorting-machine`) levels 8–9 build a gate machine to a specification. This case keeps and, or and exclusive-or mechanisms out; a later case with an interaction would need to be checked against Sorting Machine first.
- **Truth Bridge** (`truth-bridge`) is deduction from statements. Workshop Detective's records come from trying things, and the decision is which thing to try.
- **Forecast Detective** (`forecast-detective`) weighs weather evidence for a school child. Its evidence is given; here the player makes it.
- **Not here:** a par or a count of tries, a timer, a ranking, a daily lamp, saved lamps, a typed answer, a third note, real electrical or mechanical parts, or any practical instruction.

## Build batch

1. **`workshop-detective 1`, level 1.** This is the new game: the lamp, levers, records, notes, marks, the Check, the hint walk and the close.

   **Checks:** typecheck and unit tests, which cover:
   - the truth table: for both true notes and both lever pairs, each setup's result is the true note's prediction, the opening records fit both notes, exactly the two mixed setups separate them, and repeats add no card;
   - the verdict table: every mark set in both record states gives the verdict and explanation above, and only the right decided marks close the case;
   - miss counting: one per distinct wrong mark set per record state, a re-Check of the same marks free, an incomplete Check free;
   - that lever flips, tries, repeats, uninformative tests and card taps never change misses or hints;
   - the hint walk: from every reachable state, following hints closes the case in at most three hints, and no hint names the true note before a separating record exists;
   - the latch: no try is possible before the opening Check passes;
   - the seeded draw: pair, side, true note and shade vary across seeds;
   - voice coverage, the layout test, and registry, lands and paging.

   **Model wording:** under the study's decision 4, the building session checks the tag, instruction, closing line and grown-ups' wording against reputable sources (museums, universities, government science agencies, established curricula), lists them in the study and records the check in its verification entry.

   **Browser and build:** one filtered `workshopdetective` play at 390 × 625 with captions, reaching Lantern Lake through the normal grown-up route and its page. Check once with one note ruled out (one miss), follow Help, pass the opening Check, try a repeat of an opening setup (no miss, no new card), try a separating setup, Check with both fit (a second miss and the assisted hint), then mark correctly, rotate, and finish with one sticker. Take one upright screenshot of the bench with three record cards, run `fingerdemo` at level 1, and build with the generated voice assets.

Later proposals, not in this batch: a three-note case (where one test can rule out one note but not decide between the other two); a case with an interaction between the levers, checked against Sorting Machine first; a scoped-claim step ("in this lamp" against "in every lamp"); a case where no available test separates the notes, so "we cannot tell" is the final answer. Each needs its own definition.

## Source check

Nothing new was opened for this packet. The study's anchors stand as it recorded them: NGSS Appendix F practices 3 and 4 move from guided investigations to evaluating whether evidence supports a claim, and its MS-PS2-2 note supports asking whether evidence distinguishes explanations, without claiming that performance expectation is met. The study's bounded example (two binary controls, two mechanisms, the confounded opening, two separating tests) is the case defined here, with its outcome renamed from near and far to bright and dim.

The lamp, the notes and the accounting are invented game rules, so no fact about the lamp needs a source. The wording that describes the method to grown-ups is checked by the building session under decision 4. Closing a case shows that the player chose a separating test for this lamp and marked what its records support. It is not evidence about inquiry skill in general.
