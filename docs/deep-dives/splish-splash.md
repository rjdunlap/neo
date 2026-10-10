# Splish Splash deep dive

*ID `splish-splash` · bands lap, toddler, preschool, pre-K · levels 1–8 on 2026-10-10 · session `claude/roadmap-item-14-game-content-jtnvee` ([PR 102](https://github.com/rjdunlap/neo/pull/102))*

## The game today

The pet sits in a foamy tub, muddy, with the corner guide stepped out so the pet is the star. She rubs a finger over the mud and it scrubs off with squeaks, bubbles and a giggle; later the pet asks for a named body part, then two at once, then "first … then …". The shower rinses the pet at the end. The learning purpose is fine-motor scrubbing, then body-part words and following one- and two-part directions (`skills`: fine-motor, body-parts). It lives in Cozy Village, first in its list.

| Level | Plan | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | free: tummy, head, cheeks (4 splotches) | lap, toddler | nothing: scrub anywhere |
| 2 | free: + ears (6 splotches) | lap, toddler | the same, one more part |
| 3 | parts, fixed order: tummy, ears, head | toddler, preschool | which part the pet names |
| 4 | parts, fixed order: + cheeks | toddler, preschool | the same, four parts |
| 5 | parts, shuffled | preschool, pre-K | the same in a new order each round |
| 6 | parts, shuffled, + nose (5 parts) | preschool, pre-K | the same, five parts |
| 7 | pairs, any order: four parts, two questions | preschool, pre-K | two parts named in one breath |
| 8 | ordered pairs, "first … then …" | pre-K only | which of the two comes first |

The ranges are lap 1–2, toddler 1–4, preschool 3–7 and pre-K 5–8 (`LEVELS` in `src/games/splish-splash/index.ts`). `PLANS` in `logic.ts` holds each level.

**What a round draws from.** One bather (the saved pet, `ctx.petSpec`, which varies only in color), one tub and bathroom drawn in `resize()`, one rubber duck, five body parts (`Part`: tummy, head, cheeks, ears, nose) with seven splotch positions (`PART_SPOTS`, in Pip's own units; cheeks and ears are two splotches each), and one kind of mess: brown mud, six blobs and ten specks per splotch seeded by `ctx.rng`. Levels 5 and up shuffle the order of the parts with `ctx.rng.shuffle`, so a level has at most 120 orders (24 at four parts); nothing else differs between rounds. Levels 1 and 2 differ by one part.

**How scrubbing works.** Each splotch is drawn into its own `RenderTexture` and erased with a brush texture along the finger's path (steps every 10 pixels). A hidden sample of 28 points inside the blobs is knocked out by the same brush, and a splotch counts as clean at 75% (`CLEAN_ENOUGH`); the rest fades. A tap alone clears a disc of `SCRUB_R = 26` Pip units (about 31 logical units on screen). The reaches of neighbouring splotches overlap (the ears reach into the head's, the nose sits inside the tummy's), so `wrongTouches` forgives a point that is on an asked-for splotch or still within reach of one this finger just scrubbed.

**Misses and hints.** Levels 1–2 have none. From level 3, rubbing a part that was not asked for gives a giggle and a repeat of the question (`bath.notthat`; `bath.first` at level 8 if she reaches for the second part first) and counts one miss, at most one every four seconds. A hint is the glow on the asked-for splotches after seven seconds with no progress on the question, and it counts one hint (`hints++`) per question. The rubber duck is a large tap target that repeats the instruction without scrubbing. The round ends with the shower rinse, "Squeaky clean!" and confetti; the finish reports `misses` and `hints`.

**Couplings.** How-to card: four steps, two finish lines and one note, with a ghost finger (`touchDemo`, `autotouch()` through `scrubPath`, the zig-zag rule that leaves no mud behind). Voice: seven lines (`bath.free`, `.part`, `.notthat`, `.two`, `.order`, `.first`, `.clean`). Sticker: a rubber duck and seeded foam, with no pool of anything, so new content cannot change a saved sticker. Map icon: `TubIcon`. Music `STYLES.paint`. Browser: `EARLY_ONLY=bath` plays levels 1–8 with real touches (a deliberate wrong part and a sticker at each), `fingerdemo` plays 1–8 (15–22 s each), and `howto` has its card. No couch entry, journal entry, picnic step or saved creation. [IDEAS](../IDEAS.md) lists Fossil Dig as a possible reuse of this scrubbing.

**Known gaps** (read from the code and docs; none has been seen on a device unless said).

1. **The how-to card has three unbounded lines.** The last step is `{ from: 8 }` and the finish line and note are `{ from: 3 }`, so a level 9 would inherit the ordered-pair text. `howto.test.ts` checks that every step is bounded for Bubble Pop only (Peekaboo Barn's gap 2 is the same).
2. **The hint rule is not the one in AGENTS.md.** The glow comes after seven seconds with no progress, never after two misses, and it counts as a hint. The seven seconds start when the question is asked (`sinceProgress = 0` is set before the voice is awaited), so a toddler who pauses to listen or to look at the part gets about four quiet seconds after the words end. The question resets the hint, so pausing on two questions of one round gives two hints, which makes it a struggling round (two hints); two such rounds send her down a level.
3. **Free play never nudges.** Levels 1 and 2 have no hint and no idle response, so a child who does nothing sees nothing change after the first instruction.
4. **Naming happens only from level 3.** In free play the parts are never named: the voice says "scrub scrub", and the co-play line asks a grown-up to name the parts. The youngest bands, where body words are being learned, hear none.
5. **A tap clears a small disc** (about 31 units radius), so patting a splotch takes several well-aimed pats. A palm is wider than that. **Needs a person.**
6. **Levels 7 and 8 are the shortest parts rounds:** four parts, so two questions, against five at level 6. They also drop the cheeks.
7. **Body parts are limited by the art.** `CritterSpec` has no arms or hands, the feet sit behind `tubFront` (drawn above the pet), and the eyes and mouth carry the pet's reactions. The five parts in use are the whole set that Pip's blob can wear mud on without art changes.
8. **Speech uses the raw part id.** `{part}` is the part's id and `notThatPart` composes "`a` and my `b`", so a new part must read naturally in "Wash my {part}", "That's my {touched}" and "Wash my {a} and my {b}".
9. **Recorded flake and open question** ([VERIFICATION](../VERIFICATION.md)): `EARLY_ONLY=bath` failed at level 5 (`[2, 0]`) in one of three runs after the forgiveness rule was narrowed, and whether a later touch on a clean neighbour should be forgiven (it is not) is still open.
10. **Person checks open:** lap level 1 with a real child ([roadmap](../ROADMAP.md#needs-a-person-or-a-device)); and whether a one-year-old scrubs, pats or slaps (gap 5).

## Similar games

Splish Splash's genre is "rub the dirt off a friend", from the classic pet-care games to a toddler's tray of muddy plastic animals. **Every page below was read through search summaries only; I did not open any page, so none of the details is quoted from the page itself.** Store listings are the developers' own words and change.

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| *Nintendogs* bath, Nintendo DS ([review](https://www.nintendoworldreport.com/review/4394), [overview](https://screenwiseapp.com/media/nintendogs-game), [wiki mirror](https://breezewiki.discard.no/nintendogs/wiki/Bath)) | console pet game | No levels: choose a shampoo, drag a sponge over the dog, and its bubbles turn from dirty grey to white as you scrub. A review calls the touch screen what makes the care feel natural | **Foam that changes as it is scrubbed**, the satisfying part; the dirty-to-clean change itself | Cleanliness on five levels that decays to Filthy (a neglect meter), shampoo that runs out |
| *Dr. Panda Bath Time* ([App Store listing](https://apps.apple.com/app/id1104191752)) | app, ages 3–5 | Six bath activities: snorkelling in the tub, a soapy beard, drying with a magical blow dryer; caring for the animals "to build empathy"; interactive bathroom objects. A $3.99 listing | **Different bath jobs** (soap, rinse, dry) in one scene; bathroom objects that react when tapped | Nothing in the listing is a timer; the price is the only thing not to copy |
| *Sago Mini Babies* ([overview](https://screenwiseapp.com/media/sago-mini-babies-app)), and *Sago Mini Friends* ([Common Sense](https://www.commonsensemedia.org/app-reviews/sago-mini-friends)) | toddler apps | Feed, bathe, dress and rock four baby animal friends; one review praises the lack of timers or scores. *Friends* re-creates a toddler's day (bathtime, naptime, snacktime) through chores | **Several animal bathers** with their own reactions; care as a calm routine | Nothing |
| *Crayola Scribble Scrubbie Pets* ([review](https://thetoyinsider.com/crayola-scribble-scrubbie-pets-review/)) | physical toy and app, age 3+ | Colour a velvet pet with washable markers, then rinse it in a tub with a shower button and a brush; press lightly or colour stays | **Colour as the mess** (paint, not only mud); the rinse as its own beat | Small parts; the marker stains that stay |
| Washing muddy toy animals ([Growing Hands-On Kids](https://www.growinghandsonkids.com/practical-life-washing-activities-for-toddlers.html), [doll washing](https://livingmontessorinow.com/baby-doll-washing-practical-life-toddlers-preschoolers/)) | Montessori practical life | A tray of mud, animal toys to wash with a soapy brush and a cloth to dry; farm or zoo sets; sponge squeezing comes first | **The animal as the bather** (a muddy pig); wash, then dry as a routine | Nothing |
| *PowerWash Simulator* ([analysis](https://scientificgamer.com/thoughts-powerwash-simulator), [review](https://www.dualshockers.com/powerwash-simulator-review-clean-me-up-scotty/)) | PC and console cleaning game | Each object is split into segments with their own progress; a cha-ching and a visible dirty-to-clean change at each finished segment; fatigue on large jobs. One analysis reports the job completes at about 95–98% of the dirt and tidies the last specks | **Independent support for `CLEAN_ENOUGH = 0.75` with an automatic finish** (a miss-the-last-speck complaint is the other reading); a small reward for each cleaned part | Money, large jobs and the grind |
| *Head-Toes-Knees-Shoulders* ([IES](https://ies.ed.gov/use-work/awards/touch-your-toes-developing-new-measure-behavioral-regulation), [Frontiers](https://www.frontiersin.org/articles/10.3389/fpsyg.2014.00599/full)) | self-regulation task | Children do the opposite of the command (touch toes when told head), with more commands added: cognitive flexibility, working memory and inhibition | Body words as the vocabulary of a listening game | The opposite rule, which is Pet Says' proposed level 6; scoring |
| *Here We Go Round the Mulberry Bush* ([Family Lives](https://familylives.org.uk/advice/early-years-development/singing-with-your-baby/here-we-go-round-the-mulberry-bush), [verses](https://nurseryrhymescollections.com/lyrics/here-we-go-round-the-mulberry-bush.html)) | traditional action song | Verse after verse of daily jobs (wash our face, brush teeth, comb hair, get dressed), each mimed; parents make up their own | **Washing as a routine with a name for each part**, the off-screen companion | Nothing |
| Sesame Street's handwashing songs and book ([H is for Handwashing](https://sesameworkshop.org/resources/h-is-for-handwashing/), [PSAs](https://www.mediapost.com/publications/article/349202/sesame-workshop-rolls-out-psas-to-teach-kids-pande.html)) | songs, book | A song sized to 20 seconds; the book has the child pull a tab to wet, turn a wheel for suds and sing while scrubbing | **A song, off the screen, for the scrub**; wet, suds, scrub as separate gestures | A timer on the screen |
| The CDC's handwashing steps ([transcript](https://cdc.gov/digital-social-media-tools/cdctv/fight-germs-wash-hands/fight-germs-wash-hands-transcript.html)) | health guidance | Wet, lather, scrub for at least 20 seconds, rinse, dry | **The order** soap → scrub → rinse (level 11), where soap before rinse is a true cause and effect | The 20 seconds as a round timer; hands (the pet has none) |

**Developmental sources** (secondhand; none checked against the original).

- **Body-part words.** Sources differ on pointing against naming. One parent guide says children start recognizing body parts as early as 12 months ([Expressable](https://www.expressable.com/learning-center/babies-and-toddlers/teaching-your-child-to-name-body-parts-a-parents-guide)); a handout says 18-month-olds know the names of body parts ([HealthLinkBC](https://www.healthlinkbc.ca/healthwise/speech-and-language-milestones-ages-1-3-years)) and 2-year-olds at least seven; Kaiser says two body parts pointed to at 24 months and notes that language milestones are the most variable ([Kaiser](https://healthy.kaiserpermanente.org/health-wellness/health-encyclopedia/he.ue5419)). So a lap child may point before she names, and level 3's single asks fit a toddler.
- **Following directions.** ASHA lists a child following a two-step direction ("get the spoon, and put it on the table") at 19–24 months ([ASHA](https://www.asha.org/public/developmental-milestones/communication-milestones-19-to-24-months/)); a secondary source places the sequence words first, next and last and three-step directions at about 4–5. Pairs open only at level 7, so a two-year-old could be ready earlier (a between-levels entry below).
- **Self-regulation tasks.** The Head-Toes-Knees-Shoulders task is validated for pre-K and kindergarten and is about doing the opposite. The island's rules keep a score out of it, and the idea sits with Pet Says.

## What makes sense here

**A bath is a routine, and a routine has an order.** The ladder today teaches the one thing a bath has most of, body words, and does it with one muddy pet. The quantity direction of 2026-10-10 fits it well, because the cheapest lever is not a level but **who is in the tub and what they are covered in**: with four rooms, six kinds of mess and seven friends as bathers, a level that repeats today becomes a round she has not seen. The older-band levels then add the bath's real structure: reading a description instead of a part name, a three-step picture card, the soap-scrub-rinse order, and washing from the top so the drips do not dirty what is clean.

**Fits.**

- **The mess and the room** (*Scribble Scrubbies*, the Montessori tray): paint in a rainbow colour, sand at the beach, grass in the garden, jam in the kitchen. All draw in code, and a test keeps a mess readable against every pet colour.
- **A friend in the tub** (*Sago Mini Babies*, a muddy pig): the friends are already drawn (`CRITTERS`) and Teddy Doctor already places body spots on them by kind. A friend brings its own part words (snout, horns, bill, wings, whiskers), read from its spec so a word is never false.
- **Foam that turns white, and a rinse** (*Nintendogs*, *Dr. Panda*): one visual layer, with no new rule, and the base of level 11.
- **Naming the part as it is cleaned** for the youngest: the cheapest language gain in this document.
- **Top to bottom** and **a picture card** are the two new reasoning ideas; the rest is vocabulary and routine.

**Does not fit** is under "Left out on purpose".

**Arc by band.** Lap: any scrub, then a tap that does the scrubbing, with the part named as it goes clean, and bathers who make their sounds. Toddler: named parts, sparkling when asked, then two at once. Preschool: a shuffled order, then pairs. Pre-K: first … then, descriptions, a card of three, the routine and top to bottom. School: a window is not recommended (decision 3); a seven-year-old plays the top of the pre-K ladder at most.

## Proposed ladder

### Fresh content inside existing levels

All ready; none needs a decision except where it says so. The rule tests are named for each.

1. **Guards first.** Bound the how-to's last step and its finish line and note, and make the bounded-step test generic (gap 1). A free-play nudge: after eight seconds without a touch on levels 1–2 the nearest muddy splotch sparkles and Pip wiggles, with no hint counted (gap 3). A larger brush on the free levels (a plan field, `brush: 1.6`, so a pat clears a palm-sized disc; gap 5, with the `scrubPath` test keeping the demonstration clean). A table of spoken phrases per part so a new part reads naturally in every line (gap 8). Tests: every how-to line is bounded; the nudge never fires while she scrubs; the larger brush still leaves no mud behind on any splotch; every part has a phrase for each line.
2. **Name the part as it goes clean** (levels 1–2, and from 3 as part of the praise). "Clean tummy!" with `{part}` when a part finishes, and "Cheeks!" at its first touch in free play, rate-limited. Cost S: lines only. Test: every part has a spoken word and a line, and the free levels name each part once per round.
3. **Foam and a shake.** Scrubbing leaves a white foam trail (the `ctx.particles` bubbles already burst there; a foam layer over the erased area is new), the final shower pops it, and Pip shakes dry with droplets. No rule. Cost M (a foam sprite per splotch, no extra texture, or one shared layer). A portrait and a landscape screenshot.
4. **Rooms and messes, drawn together.** The seeded round picks a room and its mess: the bathroom (mud, as today), the garden (mud and grass, a paddling pool and a hose), the beach (sand, a bucket and a shell), the art room (paint, in a colour that is not the pet's) and the kitchen (jam and cake). Each room is `resize()` drawing plus a mess palette and one line (`bath.free.beach`: "{pet} is sandy!"). Tests: every room has a mess and a line; every mess reads against all eight pet colours (a contrast rule over `PET_COLORS`, the fix for a red pet and red paint); a round's room comes from `ctx.rng` (nothing carries between rounds, so a repeat can happen; avoiding one would need memory in the shell). A **screenshot per room**, landscape and portrait.
5. **Bath toys.** A second toy on the left rim (boat, fish or whale, by seed) beside the duck, 100 units or more, squeaks and says its name when tapped. The duck stays the instruction replay. Test: the toys' hit areas do not overlap the duck's or the scrub zone's mud.
6. **Friends in the tub** (the biggest item here; decision 1). Once in a few rounds from level 3, a friend takes the tub in place of the pet: a muddy pig, a duck, a dog, a cow, a bear, a bunny or a cat. Each friend has per-kind splotch spots (as Teddy Doctor's `partSpot`, whose ears differ by kind), its own part words read from its `CritterSpec` (the cow's horns and spots, the pig's snout, the duck's bill and wings, the bunny's long ears, the cat's whiskers), and says its sound (`sfx.animal`) when it is clean. Sheep, horse, hen and mouse join when Peekaboo Barn's and Animal Snack's new animals land. Tests: every spot lies on the friend's body; no part word is false for its kind; the overlap and forgiveness rules hold for every kind, not only Pip (the tests are tuned to Pip's geometry and generalize to a table). The pet's own bath stays the default, so her pet is still the star.
7. **More voice variety and co-play.** Two or three variants for each of the seven lines, a "Thank you!" from the bather, and co-play and off-screen lines for the above ("Sing 'this is the way we wash our face' while you scrub").

### New levels on top

IDs are appended, never inserted. None needs the level-order decisions. Order is by learning axis, easiest first. Nothing is timed.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | What do we hear with? | pre-K | Four muddy parts. "Wash what we hear with!" | which part matches a description of what it does or is for | A wrong part giggles and the voice names what it is for ("That's my nose. We smell with it. Wash what we hear with!"); two misses glow the right part (a hint) | every clue is true for exactly one part in the round; no clue contains the part's own word; a round never repeats a clue | S–M. A `CLUES` table: ears (hear), nose (smell), tummy (where our dinner goes), head (where a hat sits), cheeks (what goes pink when we giggle); about 12 lines; the bot is the existing `nextToScrub` |
| 10 | The picture card | pre-K | A card of three small pictures of Pip, each with a ring on a part, numbered 1, 2, 3. "First the ears, then the nose, then the tummy." | the order, with a picture to keep it | Reaching a later step first: "First the ears!" (a miss, as level 8); each picture ticks when its part is clean; two misses glow the next one (a hint) | the card order equals the plan order; three distinct parts; the pictures come from `PART_SPOTS`, so each ring sits on its part | M. A card strip (about 110 units a picture; replays the line when tapped), `bath.three`, a three-step plan field. ASHA places three steps at about 4–5, secondhand. The bot follows `nextToScrub` |
| 11 | Soap, scrub, rinse | pre-K | A bar of soap on the left rim and the shower, both big targets. "First the soap!" | the order of three jobs | Scrubbing before soap: the mud only streaks and the voice says "Soap first!"; rinsing before scrubbing says "Scrub first!"; two misses on one step glow the next tool (a hint) | the state machine soap → scrub → rinse always has exactly one next step; a wrong tap changes nothing but the voice; the round ends only after the rinse | M–L. A foam layer that becomes real here (builds on fresh content 3); two tool buttons; the shower animation; about 8 lines; the bot taps the tools and scrubs between them |
| 12 | Top to bottom | pre-K | Four muddy parts, no order asked. A line says a drip can fall. | in what order to wash so the drips do not dirty what is clean | Washing a lower part before a higher one makes a small drip land on the clean part below it ("Drip! Mud runs down. Start at the top!"). A drip is never a miss, because she is trying things out; after the second drip the topmost muddy part glows (a hint) | for any order the round ends; drips equal the pairs washed bottom-up; head to toe makes none; a drip is one swipe | M. Drips are small extra splotches, `Mud` with a flag; a height rank per part; about 6 lines; the bot washes top-down |
| 13 | Left and right | school (sketch) | "Wash the ear on the left." | which side | see decision 4 | each side word names exactly one splotch | wait for the perspective decision |

Level 9 is easier than level 8 for a child who knows the words; level 10 is about level 8; 11 and 12 are harder in different ways. The step-up rule assumes a level is not easier than the one below it, so decision 2 asks.

Windows (lean): lap 1–2 and toddler 1–4 unchanged; **preschool 3–7 unchanged; pre-K 5–12** (the lower bound does not move). School is left out; if the developer wants one, the natural fit is 12 and 13 (decision 3).

Sketches, not levels: **three bathers in order** ("the pig first, then the duck": a 2-bather round), **wash then dry** with a towel drag, **a muddy tail and paws** when the friends gain them (not drawn today), **count the bubbles** while she scrubs, **bedtime** as a step before Goodnight Room, once stories carry typed results.

### Younger-band openings

**None to add.** Lap is the lowest band and level 1 already has no miss. The between-levels entries below are for the youngest ones.

### Levels below level 1 (waiting on the level-order decisions)

These are easier than levels that exist, or fall between them, so they wait on [how levels are ordered and whether a range may skip](../ROADMAP.md#waiting-on-the-developer). IDs are assigned when built (14 and up).

| Entry | Band and place | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- |
| **Pat the bubbles** | lap, before level 1 | A big foamy tub and a muddy pet. Any touch anywhere is a splash: bubbles pop, the duck squeaks and the nearest muddy patch comes off a third at a time. Three patches | nothing | None: no miss, no hint. After six seconds without a touch a patch sparkles (not a hint) | every touch makes progress; a round ends in at most nine touches; the touch anywhere reaches the nearest patch | S. A stage-wide input; no new art. A person check: whether she pats or looks first |
| **Foam hunt** | lap and toddler, between 2 and 3 | Foam heaps hide two or three bath toys (duck, boat, fish). She rubs a heap away and the toy squeaks and says its name; at toddler: "Where is the boat?" | which heap (toddler); nothing (lap) | A wrong heap shows its own toy and names it (a miss at toddler only); two misses wiggle the right heap (a hint) | the asked toy is under exactly one heap; every toy has a name and a sound | M. Reveal-by-rubbing is *Peek-a-Boo Woods*' lap gesture; overlaps Peekaboo Barn's reveal and is kept apart by the rubbing and the toy words |
| **This one!** | toddler, between 2 and 3 | One question, "Wash my ears!", and the ears sparkle as they are named | which part, with the answer shown | Nothing counts as a miss; the sparkle fades after one pass | the asked part is in the plan; the sparkle ends | S. A plan field `show: true`; reuses the glow without counting a hint |
| **Wash two, with sparkle** | toddler and preschool, between 4 and 5 | "Wash my ears and my nose!" and both sparkle | two parts in one breath, with help | As level 7, with the sparkle in place of the glow | the pair is distinct; both parts are in the plan | S. ASHA's two-step direction is 19–24 months, so this could be earlier than level 7 |

### Left out on purpose

- **Cleanliness that decays, a dirt meter that refills or a pet that smells** (*Nintendogs*, *Pou*): the rules forbid neglect. A bath is something she does, not something she owes.
- **A 20-second scrub timer, a countdown or a score:** no timers on the screen. The CDC's 20 seconds is a song, off the screen.
- **Hands, fingernails and "wash your hands":** the pet has no arms or hands anywhere on the island. A grown-up's own off-screen line covers it, and a handwashing game would need new art first.
- **Mud on the eyes and mouth:** they carry the pet's mood. "Wash around my eyes" would also teach rubbing eyes.
- **Soap in the eyes, a temperature dial and a too-hot tub:** unpleasant or a safety lesson for a grown-up to teach in the bath, not a risk to stage.
- **Do the opposite** (*Head-Toes-Knees-Shoulders*): Pet Says' proposed level 6. **"Everything but the nose":** Goodnight Room 9 holds "everyone but the one".
- **Washing the hair, brushing teeth, dressing:** Fluffy Salon holds grooming; a brushing game is a different game.
- **A couch entry:** a calm toy for the lap and toddler bands; the co-play line covers it.

## Decisions for the developer

1. **Friends in the tub.** Lean: yes, from level 3, a quarter of rounds or so, pig first. If no, rooms, messes, foam and toys carry the fresh content. The sheep, horse, hen and mouse follow the Peekaboo Barn and Animal Snack decisions.
2. **Levels 9–12 and the step-up rule.** Lean: build 9–12 in pre-K 5–12. Level 9 is easier than level 8 (one step, a description); two struggling rounds there send her back to 8, which is not hard. Say if that is acceptable or if the picture card should be 9. Round three's plan of record had the picture card as level 9 (the [IDEAS](../IDEAS.md#round-three-more-to-play-in-every-band-2026-10-10) row, now superseded), so the card moves to 10 here; the roadmap's count of new levels on top is unchanged.
3. **A school window.** Lean: no. Body parts and the bath routine are learned by about five or six, and the pre-K top is enough for a seven-year-old who wants a quick cozy game. If yes, it is 12 and 13 with a school lower bound that does not move any saved level.
4. **Left and right (level 13).** The pet faces her, so its left is her right. Lean: leave it a sketch until the developer chooses "the left of the screen" (matches the picture on a worksheet) or the pet's own left (matches a mirror).
5. **Hint accounting.** Lean: change the idle glow to a free sparkle at seven seconds and count a hint only when the glow follows two misses on one question (AGENTS' rule). The cost is a small change to adaptation: a toddler who pauses no longer steps down for it. If no, the current rule stands and the new levels follow it.
6. **Level order for the entries below level 1.** They join the existing level-order rows. Lean: do the general fix (an explicit order apart from the saved ids) before building more than one.
7. **Extra parts for the pet.** Lean: no feet or hands. A sprout (the leaf) is possible with a screenshot to check its size; feet need a new pose (a foot up on the rim).
8. **Person checks to add:** whether a one-year-old scrubs, pats or slaps, and whether the larger brush feels right; device speech for the part, clue and room lines ("tummy", "cheeks", "sandy"); whether the sense and hat clues land with a four-year-old; and whether the mud-colour contrast reads on an iPad in a real light.

## Build slices, in order

Each is sized for one session. Slices that add a level are built in level order so saved ids stay unbroken. Each level slice also updates `scripts/browser-check.mjs` (the `early` bath loop stops at level 8 and expects `[1, 0]` or `[0, 0]`), the `fingerdemo` levels, the how-to `LevelLine`s, `describeLevel`, the README row and [GAMES.md](../GAMES.md).

1. **Words and guards** (ready, no decision). The bounded how-to lines and the generic test; the phrase table; naming the part as it goes clean; the free-play nudge; the larger brush on levels 1–2. Tier: typecheck, the game's rule tests and the how-to test; then `EARLY_ONLY=bath` once (it plays 1–8; one repeat is acceptable for the recorded level-5 flake).
2. **Hint accounting** (decision 5). Tier: rule tests and the same `EARLY_ONLY=bath` run.
3. **Foam, the shake and bath toys** (ready). Tier: rule tests, one landscape and one portrait screenshot, `fingerdemo` at level 1.
4. **Rooms and messes** (ready; a sub-slice per room if needed). Tier: rule tests including the contrast rule, one screenshot per room.
5. **Friends in the tub** (decision 1; the pig first, then one slice for the rest). Tier: rule tests, a screenshot per friend, `fingerdemo` at levels 1 and 6.
6. **Level 9, What do we hear with?** (decision 2). Tier: new level on an existing interaction: rule tests, one browser play of level 9, `fingerdemo` at it.
7. **Level 10, The picture card.** Same tier, plus a portrait screenshot of the card strip.
8. **Level 11, Soap, scrub, rinse.** Same tier, plus the abandon-cards check, since the shower tween can outlive a scene.
9. **Level 12, Top to bottom.** Same tier.
10. **The below-level-1 entries** (they wait on decision 6; Pat the bubbles first, This one! second).
11. **Sketches:** left and right (decision 4), a sprout or feet (decision 7), two bathers in order, wash then dry, bedtime.

## What was built in this session

Nothing: a deep dive session is research and ideation only. `git diff --check` and a relative-link check ran on the changed docs.
