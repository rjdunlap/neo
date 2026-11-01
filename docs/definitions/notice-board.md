# Notice Board, levels 1–3 (definition)

Defined 2026-10-31 as slice ML1 of the [media literacy study](../deep-dives/subjects/media-literacy.md#build-slices-in-order), from its [ladder](../deep-dives/subjects/media-literacy.md#a-first-games-ladder-notice-board) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#media-literacy-recommendations). The study's six decisions were adopted on its leans under the [October 23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) ([study](../deep-dives/subjects/media-literacy.md#decisions-for-the-developer)). Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: built 2026-11-01** (levels 1–3, batch `notice-board 1`, PR #1113) as one same-game batch, `notice-board 1` (levels 1–3, new-game tier). Registration, bands and land take the defaults below under standing rule S8. Every poster is a made-up island poster about something drawn on screen, so the spoken lines make no real-world claim for S1 to check; the study's opened anchors (NAMLE's Key Questions, RI.K.6) are cited only for the purpose and the grown-ups' wording. It depends on no other unbuilt game.

**Fun action and purpose:** island friends pin picture posters to a big wooden notice board in the village. The pet reads each poster aloud; she taps the friend who made it (the stamp matches their badge), the friend who actually saw what it says (their memory picture shows the place), or the basket it belongs in (telling what happened, or asking you to come and get some). The board answers: the maker steps up and pins their face to the poster, the witness's photo pops up and settles it, the maker says why they made it. The learning purpose is **someone made this, someone saw it (or did not), and they made it for a reason**: authorship (RI.K.6, "name the author… and define the role of each"; NAMLE's "Who made this?"), who had access to the facts (ISTE 1.3.b, evaluating accuracy), and purpose (NAMLE's "Why was this made?"). The how-to card makes no protection, learning or attention claim (decision 3; the study's AAP finding).

## Identity and overlap

Rechecked 2026-10-31 against the catalog, the open definitions and `git log origin/main`:

- **Photo Safari** 8–9 own *the picture as evidence* (compare a changed scene with her photo; judge a spoken claim with thumbs). Notice Board never asks her to judge the poster against the photo: at level 2 she chooses **who could know**, and the witness's photo then settles the poster by itself. Edited and cropped pictures stay with the Photo Safari dive (ML5).
- **Not Always** ([definition](not-always.md), queued) tests a claim against visible cards; **Forecast Detective** ([definition](forecast-detective.md), queued) owns *Can't tell yet*. Notice Board always resolves and has no *Can't tell yet*.
- **Lemonade Stand, Market Stall, Scoop Shop** (Cozy Village) are sellers; their keepers' wares appear on level-3 posters as ordinary selling, and their games are not changed.
- **Keep House** level 1 (*Who's at the door*) also matches a figure to a sign, but by job; here the stamp is the maker's own mark on a thing they made, and levels 2–3 have no Keep House counterpart.

## The model (`logic.ts`)

- **Friends** are `CritterName`s from `CRITTERS` without `pip` (cow, duck, pig, cat, bear, dog, bunny); three stand on the bench each poster, seeded and reshuffled per poster.
- **Badges** (`Badge`): `'star' | 'leaf' | 'wave' | 'heart' | 'moon' | 'sun'`, each a distinct silhouette with its own fixed colour (yellow, green, blue, pink, purple, orange) so the glyph decides and the colour only helps. Badges are dealt to friends per round, never tied to a species, so she cannot learn "the bunny is the leaf". **Star and sun never share a bench** (both radial).
- **Places** (`Place`): `'garden' | 'pond' | 'beach' | 'orchard' | 'meadow' | 'square'`, each with a code-drawn backdrop (poster background and memory picture) built around one landmark and a dominant colour: carrot rows, reeds on water, a wave on sand, one big apple tree, tall grass with flowers, a little house and well. **Lookalikes:** pond and beach (water), garden and meadow (green ground); an *elsewhere* memory picture is never the witness place's lookalike.
- **A poster** is `{ id, level, place, maker, subject?, purpose, price?, truth? }`, authored in three pools below. `maker` is filled per round from the bench (levels 1 and 3) or off the bench (level 2); `subject` is a pictured friend who is not the maker; `purpose` is `'tell' | 'sell'`; `price` is 1–3 drawn shells (shore's `shell()`), present exactly on `sell` posters; `truth` (level 2) is `'true' | 'stretched'`.
- **Answers:** `answerFor(poster, bench)` is the maker (level 1), the witness (level 2) or the basket (level 3). `glowFor` (the hint target) is the same thing.

### Level 1 pool, *Who made it?* (11 posters)

Eight **own-thing** posters (the poster pictures the maker's thing; the maker is not drawn): garden ("Come see my garden!"), kite ("I made a kite!"), sandcastle ("Look at my sandcastle!"), painting ("I painted the sea!"), tower ("I built a tall tower!"), song ("Come and hear me sing!"), pie ("I baked a pie!"), lost ball ("Have you seen my ball?"). Three **about-a-friend** posters (a bench friend who is not the maker is drawn on the poster with a prop): the race ("Look who won the race!", a ribbon), the birthday ("Happy birthday to my friend!", a party hat), the jump ("Look how high my friend can jump!"). Each has one *why* line for the maker ("I want you to see my flowers!", "I'm so happy for my friend!").

**Subject decoy (rule):** every level-1 round of three posters includes at least one about-a-friend poster, so "tap the friend in the picture" picks a wrong friend at least once a round and only the stamp decides.

### Level 2 pool, *Who saw it?* (7 topics)

Each topic has a place, the maker's claim (first person, so no line names a species), the photo of what happened and, when stretched, a correction label:

| Topic | Place | Poster says | Photo when true | Photo when stretched, and the label |
| --- | --- | --- | --- | --- |
| carrot | garden | "I found a carrot as big as a tree!" | a carrot taller than the maker | a big carrot, knee-high: "A big carrot! Not as big as a tree." |
| ducklings | pond | "Ten ducklings hatched!" | ten ducklings | three ducklings: "Three ducklings hatched." |
| frog | pond | "I saw a purple frog!" | a purple frog | a green frog behind a purple flower (a mix-up): "A green frog, by a purple flower." |
| whale | beach | "I saw a whale!" | a whale's back and spout | a big fish jumping: "A big fish jumped." |
| apples | orchard | "My tree has a hundred apples!" | a tree heavy with apples | five apples: "Five apples. Still lots!" |
| butterfly | meadow | "A butterfly as big as a kite!" | a huge butterfly | an ordinary butterfly on a flower: "A little butterfly." |
| show | square | "The whole village came to my show!" | a crowd of friends | four friends: "Four friends came." |

The bench is three friends, none of them the maker: **one witness** whose memory picture is the poster's place, **one elsewhere** whose memory picture is another, non-lookalike place, and **one heard-it** whose memory picture is an ear beside a whispering mouth. The maker appears only as the stamp, and **the stamp's badge is never a bench badge**, so the level-1 habit (match the stamp) cannot pick anyone.

**A round** is three posters with distinct topics, **at least one true and at least one stretched**, seeded. **Positions:** the three roles are shuffled per poster; across a round the witness stands in at least two different bench slots, and across seeds each slot holds the witness about a third of the time, so neither "the friend nearest the poster" nor "the same place as last time" works.

Stretched posters are cheerful exaggerations or mix-ups (decision 5): the maker laughs ("It *felt* as big as a tree!"), never apologises or is called wrong, and nobody lies on purpose.

### Level 3 pool, *To tell or to sell?* (12 posters)

Six **sell** posters, each with a drawn stall awning on the poster and a price of 1–3 drawn shells spoken in its line: lemonade ("Lemonade, two shells!"), ice cream ("Ice cream, three shells!"), apples ("Apples, one shell!"), hats ("Hats, two shells!"), pies ("Pies, three shells!"), flowers ("Flowers, one shell!"). Six **tell** posters, no awning and no shells: ducklings ("The ducklings hatched!"), rainbow ("I saw a rainbow!"), my apple tree ("My apple tree has apples!"), my garden ("My flowers came up!"), the pie ("I baked a pie for my friend!"), the lost ball found ("I found my ball!").

**A round** is four posters, one to three of each purpose, seeded. **Item decoy (rule):** each round has at least one tell poster whose thing (apples, flowers or pie) is also sold in the pool, so "food or flowers means selling" fails and the drawn price and stall decide. No poster is a request, an invitation or both purposes.

Each poster has a *want* line for its maker: sell, "I want you to buy my lemonade!"; tell, "I want you to know the ducklings hatched!". Selling is named, never judged (decision 3): no line calls it a trick, bad or a scam.

## Levels

| Level | Name | Bands | Per round | What she does |
| --- | --- | --- | --- | --- |
| 1 | *Who made it?* | pre-K 1, school 1 | 3 posters | Tap the friend whose badge matches the poster's stamp |
| 2 | *Who saw it?* | pre-K 2, school 2 | 3 posters | Tap the friend who was there; the photo settles the poster |
| 3 | *To tell or to sell?* | school 3 | 4 posters | Tap the basket the poster goes in |

`BandLevels`: `prek: { min: 1, max: 2 }`, `school: { min: 1, max: 3 }`. No `order`. A round is one board (one sticker); seeded rounds after an authored first round per level (the building session writes it to the rules above, with an about-a-friend poster second at level 1, a stretched poster first at level 2 and the apple-tree decoy at level 3).

**Preschool:** the study's audience row has preschool "by a grown-up's pin, two friends". A pin is a level inside the played band's range, so without a `preschool` range no pin can give a two-friend board. The default follows Not Always: **no preschool range**; a preschooler opening it from the signpost plays pre-K level 1 by `playBand`, with three friends. The two-friend board is left for the device check: if a four-year-old struggles with three, the follow-up adds `preschool: { min: 1, max: 1 }` and a two-friend bench read from the band (open decision 2).

## Screen and controls

- **The board** is a code-drawn wooden board with a cork face, top centre, holding one poster at a time: a cream sheet, **360 × 280** in landscape (300 × 240 in portrait), its picture over the place backdrop, a round stamp of the maker's badge in its bottom-right corner (56 across). Tapping the poster re-reads it, free.
- **Friends** stand on a bench below the board: three `Critter`s at about 0.6 scale, each with a 44-across badge on the chest; each friend's target is **190 × 240**, including at level 2 its memory bubble (a thought bubble, **130 × 100**, over its head showing a place or the ear-and-whisper). Touch-down: the friend lifts and turns to the poster at once.
- **The witness's photo** (level 2) is a white-bordered photo, **200 × 170**, that slides out beside the poster (to its right in landscape; in portrait the poster moves left and the photo sits to its right, 300 + 24 + 200 = 524). A stretched poster then gets its **correction label**: a small paper tag pinned to the poster's corner showing the photo's thing, read aloud. It is a label on the poster, not a sticker; the shell's one sticker per round is unrelated.
- **Baskets** (level 3) are two woven baskets, **220 × 170**, under the board: *Here's what happened* marked with a big eye, *Come and get some!* marked with an open hand. Both are on screen every round. Tapping a basket answers: the poster folds and drops in. Touch-down: the basket rim lifts.
- **The maker's pin:** at levels 1 and 3 the maker hops to the board and a round face-pin of their head is pressed into the poster; at level 2 the maker's face-pin arrives with the photo.
- **Layout** (`noticeBoardLayout(view, level)` in `logic.ts`, from `view`, never `window`): landscape (1024 × 768) board top centre, bench across the lower middle (3 × 190 + 2 × 32 = 634), baskets in the bench's place at level 3; portrait (768 × 1024) the same stack with more air. Home top-left and the pet's bottom-left corner stay clear; every target at least 100 on screen at all four standard views.

## Accounting, help and finishing

- **Free, never a miss:** tapping the poster (re-read), the board, the photo or the label; tapping a friend at level 3 (they wave); tapping anything during the success reaction.
- **Counted:** level 1, a friend whose badge does not match ("Not me. My badge is a star," holding the badge up); level 2, the elsewhere friend ("I was at the beach, so I can't tell") or the heard-it friend ("I only heard about it"); level 3, the wrong basket (the maker says their *want* line, and the poster slides back). Each is one miss and a gentle `boing`; a repeated wrong tap counts again.
- **Two misses on the same poster** glow its answer (`glowFor`); the shell counts **one hint**, once per poster. **Show a hint** (`askForHint`, `hintLabel = 'Show me'`) glows the same target and counts one hint.
- **Level 2 has no second judgement.** Once she taps the witness, the photo settles the poster by itself, true or stretched; she is never asked or scored on whether it was true.
- **Assisted ending:** every poster ends through her tap, after the glow if needed; finishing with help earns the ordinary one sticker. After the last poster, `ctx.finish({ misses, hints })`, once.
- **Adaptation:** standard. Because of the subject and item decoys, a smooth level 1 or 3 is some evidence she used the stamp or the price; the how-to card says that with spoken posters it is not evidence she asks "who made this?" of real media on her own.

## Speech (`voice-script.ts`)

Instructions use `ctx.instruct`; everything else uses `ctx.say`. Every line is slot-free so the Kokoro renderer can cover it; no line names a species.

- `noticeboard.instruct.1`: "Who made this poster? Find the friend with the same badge as the stamp." `noticeboard.instruct.2`: "Who saw it? Tap the friend who was there." `noticeboard.instruct.3`: "Is it telling what happened, or asking you to come and get some? Tap a basket."
- Posters: `noticeboard.poster.{id}` (11 + 7 + 12 = 30), the quoted lines above.
- Level 1: `noticeboard.why.{id}` (11 maker *why* lines); `noticeboard.notme.{badge}` (6): "Not me. My badge is a star."
- Level 2: `noticeboard.elsewhere.{place}` (6): "I was at the beach, so I can't tell." `noticeboard.heard` (2 variants): "I only heard about it." `noticeboard.saw`: "I was there! Here's my photo." `noticeboard.true`: "See? Just like the poster!" `noticeboard.stretched.{topic}` (7, the maker's laugh): "It *felt* as big as a tree!" `noticeboard.label.{topic}` (7): the labels in the table.
- Level 3: `noticeboard.want.{id}` (12); `noticeboard.tell`: "Here's what happened!" `noticeboard.sell`: "Come and get some!"
- No line says *wrong*, *fake*, *lie*, *trick* or *scam*; no maker is sad or embarrassed. A test checks every poster, badge, place and topic has its lines.

## Rule tests (`logic.test.ts`)

1. **Pools:** level 1 has 11 posters (3 about-a-friend), level 2 seven topics, level 3 six sell and six tell; every poster has its line(s); `price` present exactly on sell posters; the authored first rounds meet their rules.
2. **Level 1 rounds** (300 seeds): three distinct posters; three distinct badges per bench, never star with sun; exactly one bench friend's badge matches the stamp; at least one about-a-friend poster whose subject is on the bench and is not the maker; same seed, same round.
3. **Level 2 rounds** (300 seeds): three distinct topics; at least one true and one stretched; exactly one witness per poster, its memory picture the poster's place; the elsewhere place is neither the poster's place nor its lookalike; the stamp's badge is not on the bench; the witness occupies at least two slots per round, and over all seeds each slot between 25% and 42%.
4. **Level 3 rounds** (300 seeds): four distinct posters, one to three of each purpose; at least one tell poster whose thing is also sold; no poster is both purposes.
5. **Accounting:** wrong friends and wrong baskets count one miss each, repeats included; poster, board, photo, label and level-3 friend taps count nothing; two misses on a poster give exactly one glow hint; misses never block the right answer; level 2 never scores the photo.
6. **Hints lead somewhere:** `glowFor` is the maker, the witness and the right basket.
7. **Layout:** `noticeBoardLayout` at four views for each level, every target at least 100 and inside the view, the pet corner clear, the photo beside the poster in portrait.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` reads the poster and bench from the scene and taps `answerFor` (the matching badge, the witness, the basket). `fingerdemo` runs at levels 2 and 3.
- **How-to card** (`src/content/howto.ts`). Goal: "Find out about each poster on the village board: who made it, who saw it, and why it was made."
  - Steps: "The pet reads each poster; tap the poster to hear it again" (all levels); "Tap the friend whose badge matches the stamp" `{ from: 1, to: 1 }`; "Tap the friend whose picture shows they were there" `{ from: 2, to: 2 }`; "Tap the eye basket for news, the hand basket for something to buy" `{ from: 3, to: 3 }`.
  - Finish: "The round ends after the board's last poster" (all levels).
  - Notes: "Some posters stretch the truth; the witness's photo shows what happened, and nobody is told off" `{ from: 2, to: 2 }`; "Selling is ordinary here: the maker just says what they want" `{ from: 3, to: 3 }`; "Rounds without hints move her up, which means she found makers, witnesses and purposes with the posters read aloud, not that she questions real adverts on her own" (all levels).
- **Registration (default under S8):** ID `notice-board`, name "Notice Board", spoken title `game.notice-board` ("Notice board"). Region (subject) `cozy-village`. Skills `['media', 'authorship', 'evidence', 'purpose']` (free strings). Home land **Cozy Village** (19 games on `main`, already paging at `LAND_SPOTS` 13, so it joins a page; decision 2), fallback **Tinker Lab**; `lands.test.ts` decides at build time. Hub icon: a small cork board with one poster and a star stamp. Sticker: the board with a poster, a face pin and a photo beside it.
- **Art:** code-drawn in `src/games/notice-board/art.ts` with `src/art/palette.ts`: the board, poster sheets, six badges, six place backdrops (shared by posters and memory bubbles), the ear-and-whisper, the photo frame, the correction label, the awning, the baskets and the face-pin. Friends reuse `Critter`; shells reuse `shell()` from `src/art/shore.ts`; flowers and apples reuse `prop()` from `src/art/props.ts`. No shared-file art change. No imported art or audio.
- **Co-play** (`coplayHint`, the study's ML4 hand frame in its simplest form): "Cover most of a picture-book page with your hand and say something about it, like 'this bear is all alone!' Let her guess, lift your hand, then swap." **Off-screen:** "When you pass a sign or poster together, ask: who made this, and why?" A role-swapped hand-frame round counts as supported completion (S5) only once a co-play role exists in the app; here it is a suggestion.
- **Couch:** none. **Journal:** nothing filed (decision 6). **Saves:** nothing new beyond the shell's ordinary round history.
- **Rework couplings:** none required. The friends could later be her collected creatures (posters about what she did), as the [rework brief](../rework/README.md) decides.

## Check tier

**Batch `notice-board 1` (levels 1–3), new-game tier:** typecheck and unit tests (tests 1–7 plus registry, lands, how-to and off-screen tests); one scripted play through a new `browser-check.mjs` case (and its README row): level 1 with two wrong friends (the glow), then the maker; level 2 with the heard-it friend (a miss), then the witness, through one stretched and one true poster; level 3 with one wrong basket, then the right one; one portrait screenshot at level 2 with the memory bubbles and the photo; `fingerdemo` at levels 2 and 3; `npm run build`, because the registry, lands, voice and how-to change. If the allowance cannot cover level 3, stop after complete levels 1–2 with a draft-PR checkpoint.

Person and device checks stay open (DEVICE-CHECKS once built), from the study: does a four-year-old pick the witness from the memory picture, or the friend nearest the poster; does a seven-year-old's basket follow the price and stall or the maker's words; does a grown-up use the "Who made this?" card with a real box or advert (after ML3); are the six badges and six place pictures told apart at bubble size on an iPad. Browser automation establishes none of these.

## What comes next

**ML3**, the "Who made this?" card on the grown-ups' page, follows the build; **ML4**'s hand frame ships as this game's `coplayHint`; **ML2** Notice Board 4–5 (what did it leave out, who's behind it, absorbing *Story Stamp Checker*) is defined after levels 1–3 are played; **ML5** stays with the Photo Safari dive.

## Open decisions

Each has a default the build uses; none waits on the developer (S8).

1. **Register Notice Board as a new game,** pre-K 1–2 and school 1–3, home Cozy Village, fallback Tinker Lab (study decisions 1–2).
2. **No preschool range.** Default: Not Always's precedent; the two-friend board waits on the device check. Alternative: `preschool: { min: 1, max: 1 }` with two friends now; not chosen, because it would show the game on a preschooler's land page by default, which the study's "by pin" did not intend.
3. **Level 2 asks who could know, not whether it is true.** Default: the photo settles the poster with no second tap (Photo Safari 9 owns judging a claim with thumbs). Alternative: a thumbs judgement after the photo; not chosen, because it duplicates Photo Safari and adds a second miss source to a pre-K level.
4. **Tap, not drag, at level 3.** Default: tap a basket and the poster drops in, keeping the whole game tap-only for pre-K. Alternative: drag the poster; not chosen, because the act is the choice of purpose.
