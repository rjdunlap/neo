# Animal Charades, level 1: Who is moving? (definition)

Defined 2026-11-27 as the **Animal Charades** packet of the [movement and exercise study](../deep-dives/subjects/movement-exercise.md#recommended-follow-ups-requested-2026-10-14) (the developer asked on 2026-10-14 to prioritise it for definition; see the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#movement-and-family-play-recommendations) and the [IDEAS row](../IDEAS.md#candidates)). Checked against `origin/main` at `c52bf3f5e`. Nothing here is built.

**Fun action and purpose:** a friend (the pet, or a second person on the same device) acts out an animal without saying its name. The pet's way is a little dance of a plain shape: hops, waddles, swishes, flaps, slides or stomps. She watches and points to the animal she thinks it is. Then the animal appears, says how it moves ("Frogs hop!") and the round is over. She can then take the acting turn herself, and the pet guesses. The learning purpose is **watching how something moves and saying what it is**: an animal is known by how it moves as well as by how it looks (animal words and movement words), and a guess can be tried again. It claims no motor skill, fitness or social-skills benefit, and nothing is graded in a person's body.

## Overlap

| Game / mode | What it already owns | Why Animal Charades is separate |
| --- | --- | --- |
| Pet Says (`pet-says`) | She copies the pet's moves, some with animal names (level 9 woodland stops) | There she moves and the pet checks nothing. Here she **watches and names**, and the clue is hidden |
| Peekaboo Barn, Who Am I?, Photo Safari | A hidden animal found by its look, a sound or yes/no clues | Here the only clue is how it moves, shown by a person or the pet; no questions, no elimination |
| [Dream Cards](dream-cards.md) | A picture clue with several fair readings, school age | Acting a real animal has **one right answer** (the Dream Cards definition keeps the two apart). Here a wrong guess is a gentle try-again, not a different fair view |
| Pond Charades ([IDEAS](../IDEAS.md#candidates)) | Acting or drawing any picture for a guess | Not built or defined; this packet is its animal-only, preschool first step and does not reserve its name |

No general card-deck or role framework is built: the first level owns its six animals and six motions.

## The model (`logic.ts`)

All integers and fixed tables; nothing is random except which round is dealt.

- **The pool, original and code-drawn** (Pixi `Graphics` from `src/art/palette.ts`, no imported art): six animals, each with **one signature motion that no other animal in the pool shares**: `frog` hops (up and down in arcs), `duck` waddles (rocks side to side), `fish` swishes (sways in a wave), `bird` flaps (two quick wing beats), `snail` slides (slow and low, no bounce) and `bear` stomps (heavy steps with a small ground shake). A test checks that the six motion ids are distinct.
- **The motion player** (`motion.ts`): draws the pet's plain shape (the corner pet's body drawn large in one colour, no ears, tail or wings that name an animal) performing a motion id for about three seconds, then once more if she taps *Again*. Each motion also has a two-to-four note pentatonic phrase from `src/audio/notes.ts` (hop: two quick rising notes; waddle: two alternating low notes; swish: three rising and falling; flap: two high taps; slide: one long low note; stomp: two low thumps), played with the motion. The sound never says a name.
- **A round** deals 3 distinct animals and one of them as the target: any of the `C(6,3) = 20` triples with any of its 3 members as the target, so **60 rounds** (a test enumerates all of them). Every dealt animal's motion differs from the other two, which holds for any triple because the six motions are distinct. The seeded RNG picks the round and the left-to-right order of the three animal cards.
- **The phases of a guessing round:** `act` (the pet performs, or the second person acts and the screen waits), `guess` (three animal cards, each a tap target; *Again* replays the pet's motion), `reveal` (the target card slides forward and the motion plays once beside it), then *Finish* or *Swap*.
- **Unlimited guesses.** A wrong card gets a soft boing, the card dims gently and the voice says what that animal does ("A duck waddles. Watch again!"), then she can try another. A wrong guess is a miss; a right one ends the guessing and goes to `reveal`. After two misses the hint glows on the target (see accounting). She can always take *Show me* (supported, a hint).
- **The act-it-out turn (`Swap`, once):** the roles swap. She sees one animal on a card (no hiding, because the pet is the guesser) and shows it any way she likes, with her hands, face, voice or whole body, or by tapping the big *Ready* button when she has finished. The pet then guesses in a **fixed seeded order** of the three dealt animals and asks ("Is it a frog?") with two large buttons, *Yes!* and *Not yet*. *Not yet* moves to the pet's next guess; the pet never runs out (after three it says "It was the {animal}!" and reveals). Whichever she taps, the round is complete and warm; a *Yes!* tapped for an animal other than the card is not a miss and the reveal simply names the real animal. Nothing in this turn is a miss.
- **Two people, one device (seat *Two of us*):** the second person is the actor and the pet is a quiet companion. The device holds a pictured **Peek** card for them: tapping *Peek* shows the target animal as a picture **with no speech and no sound** (the voice never names or plays a motion while the card is open), tapping it again hides it. While the card is open a small picture of a closed eye shows beside it as the cue for the guesser to look away; this is drawn, never spoken, so the speaker cannot give the answer away. The guesser then looks at the actor, not the screen, and taps a card on the screen. The first tap on a card selects it and a *This one* button guesses, so a first tap is never final.
- **No camera, no microphone, no body checking.** The app never sees or judges anyone's acting. The pet's motion is an on-screen drawing; the acted turn is trusted and unscored.
- **`hintAction(state)`** (see accounting) glows the target card and replays its motion; it never speaks the name before the reveal.
- **Seeded appearance only:** the pet's body colour, the order of cards and the round dealt. It never changes the rules or counts above.

## The level

| Level | Name (`describeLevel`) | What it is |
| --- | --- | --- |
| 1 | *Who is moving?: watch how it moves and name the animal* | Three animals, one motion; the pet or a second person acts, she points; then, once, she acts for the pet |

`preschool` and `prek` (about 3–5, with a grown-up as the second person): `bands: ['preschool', 'prek']`, level 1 only, both bands starting at 1. Later levels are separate definitions and none is built or reserved beyond the next free stable IDs: an animal with an action (the study's later "animal plus action"), a four-animal round, and a grown-up family mode where a person acts from several cards. The toddler and lap bands are **not** included.

### First round

Solo, the pet acts. The dealt cards are the frog, the bear and the fish. The pet's shape hops up and down in arcs with two quick rising notes. She taps the bear: a soft boing, the bear dims, "A bear stomps. Watch again!" and the hop replays. She taps the frog: the frog slides forward, "A frog hops!" She taps *Finish*, or *Swap* to act for the pet.

## Screen, controls and layout (`layout.ts`, `art.ts`)

Played upright and landscape; the layout reads `view` in `resize()`.

- **The stage:** the pet's performance shows in a stage area at the top (portrait) or on the left (landscape). Replay is a large *Again* button beside it.
- **The animal cards:** three cards in a row (portrait: a column or a 3-up row, whichever keeps every card at least 100 units), each a tap target with a 10-unit gap and the animal drawn at card size. A tap uses `onTap`; touch-down feedback is immediate. Tapping a card never says its name until she has picked it (a pick says the name and its motion in the wrong-guess line, or the reveal).
- **Buttons:** *Again*, *Show me*, *Finish*, *Swap*, *Peek*, *Ready*, *Yes!* and *Not yet*, each at least 100 units, pictured (an eye, an arrow, a check) with no required reading.
- **The reveal:** the target's card slides forward and its motion plays beside it; the other two cards fade.
- **Seats:** a pictured chooser at the start, *Me and the pet* (default) or *Two of us*, always allows solo. A second person gets no profile credit or seat record here, per the [family-role decisions](../WAITING-ON-DEVELOPER.md#waiting-on-the-developer).
- The pet is the corner guide in the act-it-out turn and a quiet companion elsewhere (the motion shape is not the pet's whole body, so the corner pet stays where it is).
- Navigation never needs reading.

## Accounting, help and finishing

- **Misses:** a wrong card in the guessing turn is a miss (count with `src/progress/coach.ts`). Nothing in the act-it-out turn, the Peek step or the reveal is a miss.
- **Hints:** after two misses the target card glows and its motion replays; *Show me* reveals at any time. Both count as a hint. In the act-it-out turn the pet's fixed guessing order needs no hint.
- **Supported ending:** *Show me* in the guessing turn always finishes the round, unscored for the guess; the round still gives its one sticker, supported rather than independent ([AGENTS](../../AGENTS.md#adding-or-extending-a-minigame)).
- **Adaptation:** one level only, so `difficulty.ts` has nothing to step; misses and hints are still recorded.
- **Finish:** after the reveal's line the voice says the finishing line and the shell awards the sticker. The game saves no guesses and no record of who acted, and draws no celebration of its own. Nothing is scored across rounds.
- **What is not claimed:** no motor-skill, fitness, social or language benefit. Where the first level mentions a body, it names it as a choice ("with your hands, face, voice or whole body"), never an instruction to hop, jump, stomp or balance.

## Speech (`voice.ts`)

`{name}` is her name and `{a}` is an animal name, so each line with a slot stays on device speech; the slot-free lines need a rendered clip (the build runs the voice-clips step or confirms CI accepts them). The Peek card has **no spoken line at all**.

| Key | When | Line |
| --- | --- | --- |
| `charades.ask-guess` (instructed) | the guess begins | "Watch how it moves, {name}. Who is it?" |
| `charades.wrong` | a wrong card | "A {a} {does}. Watch again!" |
| `charades.hint` | after two misses | "Look at this one, {name}." |
| `charades.reveal` | the reveal | "It was the {a}! The {a} {does}." |
| `charades.show-me` | *Show me* | "Here it is, {name}. A {a}." |
| `charades.swap` | *Swap* | "Your turn, {name}. Show me an animal any way you like." |
| `charades.pet-guess` | the pet guesses | "Is it a {a}?" |
| `charades.pet-found` | *Yes!* | "I got it!" |
| `charades.pet-reveal` | after three guesses | "It was the {a}!" |
| `charades.finish` | finishing | "What a lot of ways to move, {name}!" |

`{does}` is the motion word: hops, waddles, swishes, flaps, slides or stomps. No line says right, wrong, correct or mistake; "Watch again!" is the only correction.

## Rule tests (`logic.test.ts`)

- The pool: six animals with six distinct motion ids and distinct names; every motion has a phrase from `notes.ts`.
- The rounds: exactly 60 (20 triples × 3 targets), each with three distinct animals and one target in the triple; over 200 seeds a round is always valid and the targets rotate across seeds.
- A guess transition is total: every (state, card) pair moves to a guessing, hint-glowing or `reveal` state; the right card always reaches `reveal`; any sequence of taps ends in `reveal` after at most three taps (there are only two wrong cards).
- Misses and hints: with a fixed wrong-then-right script the counts are 1 miss and 0 hints; two wrong cards then *Show me* is 2 misses and 1 hint.
- The pet's guessing order in the act-it-out turn visits the dealt animals in a fixed seeded order and reaches `reveal` after at most three *Not yet* taps, whatever she taps; no state in that turn has a miss.
- The privacy rule: in the two-person seat the state a renderer reads before `Peek` does not include the target (a render test draws the cards before and after `Peek`, and the cards are identical), and no voice or sound call is made while the Peek card is open.
- A layout test at every band and both orientations: every card and button at least 100 units, the stage and the corner pet clear of the cards.

## Ghost finger, how-to card and registration

- **How-to card:** level 1: the pet's shape hops, a finger taps a card, the card slides forward and the frog hops.
- **Ghost finger:** `autotouch()` plays the guessing turn by tapping a wrong card first and then the right one, then *Finish*; a unit test runs 50 seeds and every one reaches `finish` with 1 miss and 0 hints. `fingerdemo` plays level 1 once.
- **Registration:** a new `GameModule` `animal-charades`: grown-up name *Animal Charades*, spoken title "Who is moving?", `challenge` set, skills `animal words`, `movement words` and `watching` (add only if not already in the skills list), `bands: ['preschool', 'prek']`, level 1 only, `STYLES.quiet` music, hub icon and sticker art (the target animal, pinned to the pool index so a sticker keeps its animal), a co-play suggestion (act out an animal for the child any way you like and let her point) and an off-screen suggestion (move like one of the six animals together and take turns guessing). **Land: Barnyard**, with Cozy Village (where `pet-says` lives) as the fallback if the lands test reports the page full at either band. Run `node scripts/content-barrels.mjs` after writing `voice.ts` and `howto.ts`.
- Expected files: `src/games/animal-charades/` (`index.ts`, `logic.ts`, `logic.test.ts`, `motion.ts`, `art.ts`, `layout.ts`, `howto.ts`, `voice.ts`), `src/content/lands.ts`, `docs/games/animal-charades.md` (`npm run game-docs`), the README tables, `docs/GAMES.md`, the movement study and a verification entry.

## Check tier

New game: typecheck, unit tests, **one** filtered scripted play (level 1: one wrong card then the right one, then *Swap* and a *Not yet* then *Yes!*, then *Finish*), one portrait screenshot, then `fingerdemo` at level 1. `npm run build` because the lands and registry files change. Whether a preschooler can tell the six motions apart on a phone (hop against stomp, swish against slide) and whether the Peek card reads without speech stay person checks on a phone, not gates.

## Open decisions

1. **Registration.** Default: a new game `animal-charades`, preschool and pre-K. The alternative (a Pet Says level) was rejected: there she moves and copies; here she watches and names.
2. **Land.** Default: Barnyard, Cozy Village as the lands-test fallback.
3. **Motion legibility.** Default: six motions on a plain shape. If a phone playtest shows two motions look alike (probably hop and flap), swap one animal; the tests do not change.
4. **Peek and the guesser.** Default: a silent pictured Peek card, with the guesser looking at the actor. If play shows children cannot keep from looking, a later level can add a pass-the-device blanket as in Dream Cards.
5. **Seat credit.** Default: none, per the family-role decisions; the second person is the same profile's helper.
6. **Younger bands.** Default: none. Toddler and lap wait until a phone has shown the guessing turn reads for her.
