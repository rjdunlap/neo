# Notice Board, levels 4–5 (definition)

Defined 2026-11-22 as slice ML2 of the [media literacy study](../deep-dives/subjects/media-literacy.md#build-slices-in-order), from its [ladder](../deep-dives/subjects/media-literacy.md#a-first-games-ladder-notice-board) rows 4 and 5 and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#media-literacy-recommendations). The developer admitted "Notice Board 4–5" for definition on the study's leans on [2026-11-17](../archive/DECISIONS-2026-11-17.md#games) without waiting for play of levels 1–3. It extends the built game ([levels 1–3 definition](notice-board.md), batch `notice-board 1`, PR #1113) and keeps its model, cast, badges, places, speech rules and accounting unless this page says otherwise. Docs only: no code, voice line, clip or art exists yet.

**Fun action and purpose.** Level 4, *What did it leave out?*: a poster shows the best part of a stall or a show; she taps the sign beside it to **go and see**, the real place slides out, and she taps the picture tag for the thing the poster did not show (the price, the queue, the last pie, the rain). Level 5, *Who's behind it?*: a poster comes from a club with a little club house beside it; she can open the club's door to see whose badge is inside, then taps the friend she would ask whether the poster is right: the one who tried the thing and does not sell it. The learning purpose is NAMLE's "What is left out of this message?" and "Who paid for this / who benefits?" in their simplest island form: **a poster can be true and still not show everything, and the friend who made it is not the best one to ask about it.** The how-to card makes no protection, learning or attention claim (study decision 3; the AAP finding).

## Identity and overlap

Rechecked 2026-11-22 against the catalog, the open definitions and `git log origin/main`:

- **Notice Board 2** owns exaggeration: the poster says more than happened and the witness's photo settles it. Level 4 posters are **never stretched**: everything the poster shows is at the stand. What differs is one thing the stand has that the poster did not draw. This departs from the study's level-4 example ("Biggest cups on the island!" with a giant cup, which is an exaggeration level 2 already teaches); see [open decision 1](#open-decisions).
- **Photo Safari 8** (*What changed?*) compares a remembered photo with a scene after one change; **Photo Safari 9** judges a spoken claim with thumbs. Level 4 has no memory step (poster and stand are on screen together) and no true/false judgement: the poster is true, and she names what it left out.
- **ML5 *Outside the frame*** (handed to the [Photo Safari dive](../deep-dives/photo-safari.md), proposal) widens a cropped *photo*. Level 4's poster is a drawing a maker chose, not a crop: the stand is a different place in the same moment, not the rest of the same picture. Cropping stays with Photo Safari.
- **Household Casebook 8** stamps claims **The papers show it** or **Can't tell**. Level 5's absorbed *Story Stamp Checker* act (study decision 4) is a **paw pin**: the friend she chose to ask pins a little paw-print note under the poster's claim. It is not a stamp, takes neither casebook stamp's picture, and is about whom to ask, not what papers show ([household-casebook.md](household-casebook.md) asks exactly this).
- **Not Always** and **Forecast Detective** keep *Can't tell yet*; every Notice Board poster still resolves.
- **Lemonade Stand, Market Stall, Scoop Shop** keep their games; their wares appear here as ordinary stalls, unchanged.

## The model (`logic.ts`)

Everything from levels 1–3 carries over: `FRIENDS` (seven critters, no Pip), `Badge` and its star-and-sun rule, `Place`, `Thing`, `Item`, `Play`, `answerFor`/`glowFor`. New:

- **Left-out kinds** (`Omit`): `'price' | 'queue' | 'last' | 'rain' | 'night' | 'far'`, each a code-drawn tag picture: three shells (shore's `shell()`), a line of three small friend silhouettes, one lone item on an empty tray, a rain cloud, a moon over a dark sky, a long winding path up a hill.
- **Level 4 poster** (`OmitPoster`): `{ id, place, thing, omit }`. The poster draws `thing` large over the place backdrop; the stand (in the side slot) draws the same `thing` **and** `omit`. A sell stall's poster still shows no price unless `omit` is something else; for `omit: 'price'` the stand's price is the only shells on screen.
- **Level 4 tags:** three tags per poster, `[omit, thing, other]`, where `other` is a left-out kind the stand does **not** show. So "tap what you see on the poster" picks the `thing` tag (it is on both) and "tap the odd one" is as likely to pick `other` (it is on neither): only comparing the poster with the stand decides.
- **Level 5 case** (`ClubCase`): `{ id, place, thing, club }`. `club` names an emblem (a hat on a sign, a pie on a sign, and so on; spoken, never read). Three bench friends: the **seller** (behind the club; their memory bubble shows them behind a stall of the thing), the **tried-it** friend (their bubble shows them using the thing: wearing the hat, eating the pie) and the **heard-it** friend (the ear-and-whisper from level 2). Badges are dealt as at level 1; the club door hides the seller's badge.
- **Answers:** level 4, the `omit` tag; level 5, the tried-it friend. `glowFor` is the same target.

### Level 4 pool, *What did it leave out?* (8 posters)

| Poster | Place | Says | The stand also shows (`omit`) | The *other* tag is drawn from |
| --- | --- | --- | --- | --- |
| lemonade | square | "Cold lemonade!" | price: two shells | queue, last, night |
| icecream | beach | "Ice cream by the sea!" | queue: three friends waiting | price, rain, far |
| pie | square | "Fresh pies today!" | last: one pie on the tray | price, queue, rain |
| kites | beach | "Kite day at the beach!" | rain: a cloud over the beach | night, far, last |
| show | square | "Come to my show!" | night: the moon, the show is late | rain, price, far |
| apples | orchard | "Sweet apples to pick!" | far: the tree is up a long hill path | price, queue, night |
| flowers | meadow | "Flowers, fresh from the meadow!" | price: three shells | rain, last, far |
| hats | square | "Hats for everyone!" | last: one hat left on the hook | queue, night, price |

Every left-out kind appears at least once as an answer; the *other* list never contains the poster's own `omit`. Posters are cheerful and true (study decision 5): the maker only drew the best part.

### Level 5 pool, *Who's behind it?* (6 cases)

| Case | Club (emblem) | Poster says | Tried-it friend's bubble and line |
| --- | --- | --- | --- |
| hats | the Happy Hat Club (a hat) | "The best hats on the island!" | wearing a hat in the rain: "I wore one in the rain. It kept me dry, but it's a bit big!" |
| pies | the Pie Club (a pie) | "Our pies are the yummiest!" | eating a slice: "I had one. Yummy, but very sticky!" |
| lemonade | the Lemon Club (a lemon) | "The coldest lemonade ever!" | holding a glass: "I tried it. Nice and cold, and a bit sour!" |
| kites | the Kite Club (a kite) | "Our kites fly the highest!" | flying a kite: "Mine flew high, till the wind stopped!" |
| icecream | the Scoop Club (a cone) | "The biggest scoops!" | licking a cone: "I had a scoop. Big enough for me!" |
| boats | the Boat Club (a sail) | "Our boats never tip!" | in a little boat on the pond: "I sailed one. It wobbled, but it didn't tip!" |

Every tried-it line is a real, mixed report, neither praise nor complaint, so the lesson is "she tried it", not "she disagrees". The seller's line after the door opens: "That's my club! I sell the hats." (one per case, `noticeboard.club.{case}`). Selling is named, never judged (study decision 3): no line calls the club sneaky, and the seller is never told off.

## Levels

| Level | Name | Bands | Per round | What she does |
| --- | --- | --- | --- | --- |
| 4 | *What did it leave out?* | school 4 | 3 posters | Tap the stand sign to go and see, then tap the tag for what the poster did not show |
| 5 | *Who's behind it?* | school 5 | 3 cases | Open the club door if she likes, then tap the friend who tried it and sells none |

`LEVELS` becomes `school: { min: 1, max: 5 }`; `prek` stays `{ min: 1, max: 2 }`; no `order`. **Authored first rounds:** level 4 `['lemonade', 'pie', 'kites']` (price, last, rain: three different kinds); level 5 `['hats', 'lemonade', 'pies']` with the tried-it friend in slots 2, 0, 1. Seeded rounds afterwards.

**Age:** the study pitched level 5 at about 10. With a plain `min..max` ladder a seven-year-old who plays two smooth level-4 rounds steps up into it. That is the default: the adaptation steps down after two struggling rounds, the level asks for nothing she cannot see or hear, and a grown-up can pin her lower. The alternative (a `grownup` range for level 5 only) was not chosen, because the decision is the same act as level 2's "who could know" with one more reason.

## Screen and controls

Both levels reuse the level-2 geometry exactly (poster plus a side slot of **200 × 170**, three bench rectangles below), which already passes the upright phone, captioned and short views in `upright.test.ts`:

- **Level 4:** the side slot starts as a **Go and see** sign (a signpost with an arrow and an eye, the whole 200 × 170 slot is the target; free). Tapping it slides the **stand** in its place: the same `thing` and the `omit`, drawn as a stall front or a stage, with the maker's face-pin on its awning. The bench's three rectangles become three **tags** (190 × 200, `FRIEND_H_3`, string-hung paper tags each showing one picture). Tags are dimmed until the stand is out and tapping a dimmed tag only wobbles the sign (free): she has to look before she chooses. Touch-down: a tag lifts on its string.
- **Level 5:** the side slot is the **club house**: a small door with the club's emblem above it (200 × 170, free). Tapping opens the door; the seller's badge hangs inside, and the matching bench friend waves. The bench is three friends with memory bubbles, as at level 2 (190 × 240). On success the tried-it friend walks to the board and their **paw pin** (a round note with a paw print, 64 across) is pressed under the poster's claim, and the friend says their line.
- **Layout:** `noticeBoardLayout(view, level)` treats 4 and 5 as level 2 for the poster, board and side slot, level 4 as level 3's shorter bench (200) for the tags, and level 5 as level 2's bench (240). Home and the pet's corner stay clear; every target at least 100, and at least 44 on screen on the 390 × 844 phone, as for 1–3.

## Accounting, help and finishing

- **Free, never a miss:** the poster (re-read), the Go and see sign, the club door, a dimmed tag before the stand is out, the stand, the paw pin, anything during a reaction.
- **Level 4, counted:** the `thing` tag ("The poster shows that already!"), the `other` tag ("The stand doesn't have that."). One miss each, a gentle `boing`, repeats counted.
- **Level 5, before the door is open:** the right friend counts as right, and the door then opens by itself in the reaction so she sees who was behind it. A wrong friend is **never a miss**: a guess before she looked is exploration. The door opens by itself, the seller waves ("That's my club! I sell the hats.") or the heard-it friend says "I only heard about it", and the question stays.
- **Level 5, after the door is open:** the seller ("I made that poster, and I sell them. Ask someone who tried one!") or the heard-it friend ("I only heard about it.") is one miss each.
- **Hints:** two misses on a poster glow its answer (one hint, once per poster); **Show me** glows it too and counts one hint, as at 1–3.
- **Finish:** every poster or case ends through her tap; after the last, `ctx.finish({ misses, hints })`, once. One sticker per round, with help too.
- **Adaptation:** standard. A smooth level 5 can include a lucky right pick before the door opened; the how-to card says so.

## Speech (`voice-script.ts`)

All lines slot-free so Kokoro covers them; no line names a species; none says *wrong*, *fake*, *lie*, *trick* or *scam*; no maker or seller is sad or embarrassed.

- `noticeboard.instruct.4`: "What did the poster leave out? Go and see, then tap what the poster didn't show." `noticeboard.instruct.5`: "Who's behind this poster? Tap the friend who could tell us if it's right."
- Level 4: `noticeboard.poster.l4-{id}` (8, the "Says" column); `noticeboard.omit.{kind}` (6, said as the right tag lands: "It costs two shells!", "There's a long line!", "Only one left!", "It's raining!", "It's late at night!", "It's a long walk up the hill!"; the price line names the stand's own price, so `price` posters say "two shells" or "three shells" from two lines `noticeboard.omit.price2`/`price3`); `noticeboard.best`: "I only drew the best part!" (the maker, after each poster); `noticeboard.already` and `noticeboard.nothere` (the two miss lines); `noticeboard.gosee`: "Let's go and see!"
- Level 5: `noticeboard.poster.l5-{case}` (6); `noticeboard.club.{case}` (6, the seller's door line); `noticeboard.tried.{case}` (6, the tried-it lines above); `noticeboard.askother`: "I made that poster, and I sell them. Ask someone who tried one!" `noticeboard.heard` is reused.
- A test checks every level-4 poster, kind and level-5 case has its lines. About 37 new clips.

## Rule tests (`logic.test.ts`)

1. **Pools:** eight level-4 posters with each kind an answer at least once and no poster's *other* list containing its `omit`; six level-5 cases each with poster, club and tried lines; the authored first rounds meet their rules.
2. **Level 4 rounds** (300 seeds): three distinct posters; per poster three distinct tags `{omit, thing, other}`, `other` not the poster's `omit`; the right tag occupies at least two slots across a round, and each slot holds it 25–42% over all seeds.
3. **Level 5 rounds** (300 seeds): three distinct cases; per case exactly one seller, one tried-it and one heard-it friend, three distinct badges (never star with sun), the door's badge is the seller's; the tried-it friend's slot rule as in test 2.
4. **Accounting:** level 4, both wrong tags count one miss each and dimmed tags count nothing; level 5, a wrong friend before the door counts nothing and opens the door, after the door counts one miss; a right friend before the door is right; two misses glow once; misses never block the answer.
5. **Hints lead somewhere:** `glowFor` is the `omit` tag and the tried-it friend.
6. **Layout:** `noticeBoardLayout` at levels 4 and 5 on the four standard views (every target at least 100, in view, the corners clear); `upright.test.ts` grows from levels 1–3 to 1–5 (its "covers levels" case changes), including the side slot as a target at both levels.

## Ghost finger, how-to card and grown-ups

- **Ghost finger:** `autotouch()` at level 4 taps the sign, then the `omit` tag; at level 5 taps the door, then the tried-it friend. `fingerdemo` runs at 4 and 5.
- **How-to card** (`howto.ts`), new level-scoped lines: steps "Tap the sign to go and see the real stall, then tap what the poster didn't show" `{ from: 4, to: 4 }`; "Open the club door to see who made the poster, then tap the friend who tried it" `{ from: 5, to: 5 }`. Notes: "The posters are true; they just leave something out" `{ from: 4, to: 4 }`; "A guess before the door is open is never counted; a smooth round may include a lucky guess" `{ from: 5, to: 5 }`. The goal line widens to "…who made it, who saw it, why it was made, and what it didn't say."
- **Level descriptions** (`describeLevel`) for 4 and 5 from the Levels table; the generated game page picks them up.
- **Grown-ups' page:** the "Who made this?" talk card (ML3) is unchanged.
- **Saves, journal, couch:** nothing new; nothing kept (study decision 6).

## Check tier

**Batch `notice-board 2` (levels 4–5), new interaction tier:** typecheck and unit tests (rule tests 1–6, how-to, registry and lands tests); one filtered `noticeboard` play on an upright phone at levels 4 and 5 (the build adds a level filter to `scripts/browser/suites/notice-board-play.mjs`, such as `NOTICE_LEVELS=4,5`): level 4 with a dimmed-tag tap (free), the sign, the `thing` tag (a miss), Show me (a hint), then the answer; level 5 with a wrong friend before the door (free, the door opens), the seller after it (a miss), then the tried-it friend; one upright phone screenshot at level 5 with the door open; `fingerdemo` at 4 and 5; `npm run build` and the offline check, because voice, clips and how-to change. If one run cannot finish both levels, stop after a complete level 4 with a draft-PR checkpoint.

## Open decisions

Each has a default the build uses; none waits on the developer (standing rule S8).

1. **Level 4 is omission, not exaggeration.** Default: the poster is true and the stand shows one thing it left out, so level 4 is new and not a repeat of level 2. Alternative: the study's example, a giant cup on the poster and ordinary cups at the stand; not chosen, because a "Who saw it?" stretched poster already teaches it, and "left out" was the level's own name.
2. **Level 5 asks whom to ask, with one poster.** Default: one club poster, a club door in the side slot and three bench friends; the paw pin of the friend she chose is the absorbed *Story Stamp Checker* act. Alternative: the study's two posters side by side (the club's and a disinterested friend's); not chosen, because two readable posters do not fit beside a bench on an upright phone, and choosing a friend keeps levels 1–5 one act (tap someone).
3. **A wrong pick before the door is free.** Default: never a miss, the door opens itself (the study's "choosing before visiting is allowed and never a miss"). Alternative: count it; not chosen, because a guess before looking is exploration under the shared rules.
4. **School climbs into level 5 by the ordinary ladder.** Default: `school 1–5`, no `order`. Alternative: a `grownup` range for 4–5; not chosen (see Levels).
