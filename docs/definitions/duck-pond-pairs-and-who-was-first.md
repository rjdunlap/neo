# Duck Pond levels 19 and 20, *Pairs* and *Who was here first?* (definition)

*Game `duck-pond` · levels 19 and 20 · school window · defined 2026-11-28 on `claude/define-duck-pond-pairs-who-first` · [deep dive](../deep-dives/duck-pond.md#new-levels-on-top) slice 11. The dive's decision 4 was settled 2026-10-23 (Duck Pond owns evens and odds, so Bubble Pop builds no pairs level). Each level is its own build session, Pairs first. A child's play of either is a person check, not a gate.*

**Overlap checked.** Level 18 (*Which side has more?*) pairs ducks *across* the bridge to compare two groups; Pairs pairs ducks *within one* group to ask whether one is left over, so it reuses level 18's partner language and its spare-duck highlight but asks a different question (2.OA.C.3, even and odd by pairing). Level 14 (*Doubles*) adds two equal sides, which is the other face of an even number, and Pairs is placed straight after it. Level 11 (*Hiding ducks*) asks for a hidden part of a known total, shown all at once; *Who was here first?* tells the same pond as a story in time, with the start as the unknown, and adds the take-away story whose start is unknown, which no level asks (1.OA.A.1's start-unknown position). Both levels reuse the answer pads, the bridge and the reveal; neither needs a new region. Frog Hop's level 19 (*Who is further along?*) is a different game's comparison on a line; the shared number is a coincidence.

## Level IDs and window

IDs are appended, never renumbered (17 is *Count the peekers* and 18 *Which side has more?*). Two modes join `DuckMode`, `'pairs'` and `'first'`, and two entries join `PLANS` as the nineteenth and twentieth:

```ts
// School (dive slice 11, appended as 19, played after 14): ducks line up two by two; does every duck have a partner?
{ mode: 'pairs', rounds: 5, min: 2, max: 10 },
// School (dive slice 11, appended as 20, played after 11): some ducks were here first, under the bridge; the start is unknown.
{ mode: 'first', rounds: 5, min: 1, max: 9, away: 2 },
```

`away` is a new optional `DuckPlan` field: how many of the level's last rounds are take-away stories. The bridge shows for mode `first` as it does for `hide` (the `bridge.visible` test in `index.ts`), not through `split`, because level 20 uses level 11's bridge and seats rather than the left-and-right sides. The school window becomes `{ min: 8, max: 20, order: [8, 9, 10, 11, 20, 14, 19, 15, 16] }` once both are built; the Pairs session alone writes `[8, 9, 10, 11, 14, 19, 15, 16]` with `max: 19`, and the second session inserts 20 after 11. Lap, toddler, preschool and pre-K are unchanged, and the lower bound stays 8, so no saved level moves. `describeLevel(19)` reads "Pairs: line the ducks up two by two; does every duck have a partner? (even and odd, 2 to 10)"; `describeLevel(20)` reads "Who was here first? Some ducks came or swam away; how many were swimming at the start?". If another level takes 19 or 20 first, these take the next free IDs and this page's numbers are read as names.

## Level 19, *Pairs*

**Fun action and purpose.** The ducks want to swim two by two. She taps each duck on the bank and it swims into the parade line, filling it a pair at a time; when every duck is in, the pairs swim a loop round the pond, and a duck with no partner paddles along at the back looking round for one. She answers whether every duck has a partner. The learning is *even and odd as "every one has a partner" or "one is left over"* (2.OA.C.3: "determine whether a group of objects (up to 20) has an odd or even number of members, e.g., by pairing objects"), with the words even and odd said after the answer, never needed to choose it.

### A round

1. **The bank.** *N* ducks (2 to 10) wait on the bank in a loose row. The pet says "{n} ducks want to swim two by two. Tap each duck!" The sign shows *N* as a numeral (no dots: counting is not the task).
2. **Lining up.** Each tap sends one bank duck to the next seat of the parade line: the existing two-rows-of-five seats (`rows` layout), filled **column by column**, top then bottom, so the line is a five-frame of pairs and a lone duck is always the top of the last column. A duck that is still swimming ignores a second tap. Tapping a duck already in the line does nothing (there is nothing to undo; every duck must swim). Lining up is never wrong and counts nothing.
3. **The question.** When the bank is empty the pairs touch beaks (a short bob, the level 18 pairing tween), a lone duck looks left and right, and the pet asks "Does every duck have a partner?" Two big answer buttons replace the three lily pads, drawn and never read: **two ducks side by side** ("Yes, every duck has a partner") and **one duck alone** ("No, one is left over"). Each is at least 140 units across and touch-down lights it.
4. **Right.** A chime from the pentatonic steps; the voice says "{n} is even: every duck has a partner!" or "{n} is odd: one duck is left over!", and the sign writes "{n} is even" or "{n} is odd" under the numeral. The pairs swim one loop and the round ends.
5. **Wrong.** The gentle boing, and the pairs bob once more: for an odd number the lone duck waves ("Look at this duck. Does it have a partner?"); for an even number each pair bobs in turn, beak to beak ("Look, each duck has a buddy beside it. Does every duck have a partner?"). A second miss on the question glows the right button.
6. **Rounds 4 and 5: they arrive in pairs.** The last two rounds start with the ducks already swimming in from the hill two by two (the parade forms by itself, as level 15's full ten arrives with one splash), so she reads the structure without building it. The question, the right and wrong responses and the accounting are the same.

### Stuck, hints and accounting

A miss is a wrong button on the question; lining up is free. The glow comes after two misses on a question and counts one hint for that question, as at the other pad levels (`coach.ts`). In the school order 19 sits between 14 and 15, so two smooth rounds step up to 15 and two struggling rounds down to 14.

### The rule (`logic.ts`)

- `pairsCounts(rng, plan)` returns `rounds` counts in `min..max`: the first round is 4 (even, small, the pattern seen at once), both even and odd appear in every level, never the same count twice running and never three of the same answer running. With five rounds there are two or three of each.
- `pairsAnswer(n)` is `'even'` when `n % 2 === 0`, else `'odd'`.
- `pairSeat(i)` is the parade seat of the *i*th duck: column `floor(i / 2)`, top for even `i` and bottom for odd `i`, on the `rows` seats; `loneDuck(n)` is the index of the duck with no partner (`n − 1` when odd) or null.
- `pairsMove(plan, bank, answer)` is the bot's next touch: a bank duck while any are left (none in the arriving rounds), then the right button.

### Voice, how-to and bot

- **Voice:** a prefix outside the rendered clip list (`duckpair.`), so the lines stay on device speech as levels 17 and 18 do and no clip needs rendering: `duckpair.ask` ("{n} ducks want to swim two by two. Tap each duck!"), `duckpair.arrive` ("Here they come, two by two!"), `duckpair.q` ("Does every duck have a partner?"), `duckpair.even` ("{n} is even: every duck has a partner!"), `duckpair.odd` ("{n} is odd: one duck is left over!"), `duckpair.hintOdd` ("Look at this duck. Does it have a partner?") and `duckpair.hintEven` ("Look, each duck has a buddy beside it. Does every duck have a partner?").
- **How-to:** a card `{ from: 19, to: 19 }` showing three ducks tapped into the line, the lone duck looking round, and a finger on the one-duck button.
- **Bot:** taps the bank ducks in order, then the right button; `fingerdemo` at 19 shows the first two rounds within 75 s.

### Rule tests

Counts lie in 2–10; the first is 4; both answers appear; no count twice running and no answer three times running (seeds 0–99); `pairsAnswer` matches parity; `pairSeat` gives distinct seats inside the pond, clear of the button row at the four standard views; `loneDuck` is the top of the last column exactly when the count is odd; the bot's moves finish every seeded level with no misses; the school order contains 19 straight after 14.

## Level 20, *Who was here first?*

**Fun action and purpose.** Some ducks were already snoozing under the bridge before the story began. Then more came, wearing ribbons, or some swam away over the hill, and the sign says how many there are now. She works out how many were there at the start, and the hidden ducks paddle out to show her. The learning is *the start-unknown story* (1.OA.A.1: "? + 3 = 8" and "? − 2 = 4"), the hardest place for the unknown in a story, with a wrong answer checked by playing the guess forwards.

### A round

1. **The pond.** The footbridge from level 11 stands across the middle, with ripples beneath it; no duck is seen. The pet says "Some ducks were swimming under the bridge. Nobody counted them!" The sign shows "?".
2. **The change (rounds 1 to 3, came).** *b* ducks (1 to 4) swim in from the bank one at a time, each with a small red ribbon at its neck, counted aloud ("1, 2, 3 more came!"). They sit in front of the bridge on the first `HIDING_SLOTS` seats, as level 11's visible ducks do. The sign now reads "? + 3".
3. **The change (rounds 4 and 5, swam away).** *b* ducks (1 to 3) paddle out from under the bridge and swim away over the hill, counted aloud ("2 swam away!"); the sign reads "? − 2".
4. **The question.** The pet says "Now there are {n} ducks. How many were here first?" (came; the ribbon ducks are seen, the others are still under the bridge, and the sign writes "= 8") or "Now there are {n} under the bridge. How many were here first?" (swam away; nothing is seen). Three lily pads from 1 to 10, the answer and two neighbours (`padValues`).
5. **Right.** The ducks who were here first paddle out from under the bridge, counted aloud, and the sign writes the whole sentence: "5 + 3 = 8" ("5 were here first! 5 and 3 more make 8!"), or for the swam-away story the left ducks paddle out and the ones who left swim back in for a moment ("4 are left, and 2 swam away: 6 were here first! 6 minus 2 makes 4!").
6. **Wrong.** The gentle boing, and the guess is played forwards: the sign writes "4 + 3 = 7" with the 7 shaking, and the voice says "If 4 were here first, 4 and 3 more make 7. We need 8." (or "If 5 were here first and 2 swam away, 3 are left. We need 4."). The pad stays tappable, so she can try again. A second miss glows the right pad.

### Stuck, hints and accounting

A miss is a wrong pad; the glow after two misses counts one hint for that question. The forward check after a miss is feedback, not a hint. Level 20 sits after 11 in the school order, so two smooth rounds step up to 14 and two struggling rounds down to 11.

### The rule (`logic.ts`)

- `firstStory(rng, plan, away)` returns `{ start, change, away, now }`. Came: `start` 1–6, `change` 1–4, `now = start + change` at most 10 and at least 3. Swam away: `start` 3–9, `change` 1–3, `now = start − change` at least 1. The answer is always `start`.
- `firstStories(rng, plan)` returns `rounds` stories, the last `plan.away` of them swam away, never the same `start` twice running.
- `forwardCheck(story, guess)` returns the number the guess would make (`guess + change` or `guess − change`, which may be 0 or below for a low guess; the voice then says "there would be none left", never a negative number).
- The seats reuse `HIDING_SLOTS` (ten seats in two rows). Came: the ribbon ducks take the first `change` seats and the first ducks the seats after them, `hidingRevealSlots({ visible: change, hidden: start, total: now })`, so the two groups never share a seat. Swam away: all `start` ducks sit in the first `start` seats under the bridge, the leavers are the last `change` of them, and the `now` left ducks are the ones revealed. The sentence comes from the existing `numberSentence(start, change, away)`.
- `duckMove` returns the answer pad for mode `first`, as for `hide`.

### Voice, how-to and bot

- **Voice:** prefix `duckfirst.`, on device speech: `duckfirst.intro` ("Some ducks were swimming under the bridge. Nobody counted them!"), `duckfirst.came` ("{b} more came!"), `duckfirst.went` ("{b} swam away!"), `duckfirst.askCame` ("Now there are {n} ducks. How many were here first?"), `duckfirst.askWent` ("Now there are {n} under the bridge. How many were here first?"), `duckfirst.found` ("{a} were here first! {a} and {b} more make {n}!"), `duckfirst.foundWent` ("{a} were here first! {a} minus {b} makes {n}!"), `duckfirst.checkCame` ("If {g} were here first, {g} and {b} more make {m}. We need {n}."), `duckfirst.checkWent` ("If {g} were here first and {b} swam away, {m} are left. We need {n}.") and `duckfirst.checkNone` ("If {g} were here first and {b} swam away, there would be none left. We need {n}.").
- **How-to:** a card `{ from: 20, to: 20 }`: ripples under the bridge, two ribbon ducks swimming in, the sign "? + 2 = 5", and a finger on the 3 pad.
- **Bot:** the existing pad rule; `fingerdemo` at 20.

### Rule tests

Every came story has `now` in 3–10 and `start` in 1–6; every swam-away story has `now` at least 1 and `start` at most 9; the last `away` rounds swim away and the others came; the answer pads contain `start`, lie in 1–10 and are distinct; no `start` twice running (seeds 0–99); `forwardCheck` equals the guess played forward, and the right guess makes `now`; ribbon and revealed seats are distinct and inside the pond at the four views; the school order contains 20 straight after 11.

## Build slices and checks

1. **Level 19, *Pairs*** (new-interaction tier: the parade line, the two picture buttons and the arriving pairs): typecheck, the duck-pond unit tests above, one filtered scripted play (the first and last round, one wrong button, one glow), one portrait screenshot of an odd parade, `fingerdemo` at 19; `npm run build` only if shared files change.
2. **Level 20, *Who was here first?*** (new-levels tier, after 19 merges: the hide level's bridge, pads and reveal with a new story and the ribbons): typecheck, the unit tests, one browser play of level 20 (one wrong pad with its forward check, one swam-away round) and `fingerdemo` at 20.

Each closes out with the game's page (`npm run game-docs`), the dive's slice 11 line, a verification entry and coverage row.

**Co-play and off-screen.** Pairs: "Line up the spoons two by two. Does every spoon have a partner?"; off-screen, pair the socks after the wash, or count shoes by the door. Who was here first: "Hide some buttons under a cup, add three, and tell her how many there are now. How many were under the cup?"; off-screen, the same story with toy ducks in the bath.

**Out of scope.** Counts above 10 for Pairs (the teen seats would fit 20, but the parade line and the two-by-two loop are not laid out for it; a later slice can widen it); counting by twos aloud as a skill (Bubble Pop owns skip counting); saying "even" or "odd" before the answer, or reading them on the buttons; a change-unknown story (level 10 *Make ten* and level 11 cover the missing part); the night pond and *Fill to any number*, which stay sketches; couch play.
