# The At-home card and kit list (definition)

Defined 2026-11-17 from the [off-screen companions study](../deep-dives/subjects/off-screen-companions.md#build-slices-in-order), slice 4, and its [recommendations packet](../deep-dives/subjects/RECOMMENDATIONS.md#off-screen-companions-recommendations). It follows the built [per-band lines](off-screen-lines.md) (slices 1–3) and freezes one build: an **At home** section on the grown-ups' page with three ideas, each a *try* line and, where one has been written, a *notice* and a *say* line, and under them one sentence of things from around the house. Plain HTML, no save field, nothing to press. Talk-about lines (slice 5), upper-school challenge lines (6), printable cards (7) and the cards other studies hand to this one (the writing, keyboard, sign, phonics, vocabulary and look-it-up cards, Puppet Problem Cards, Program the Puppet) are out of scope; each is later content for the card this build makes.

**Status: built 2026-11-17** ([PR #1747](https://github.com/rjdunlap/neo/pull/1747)); see [As built](#as-built) for where the build differs from this page.

Re-audited on `origin/main` at `d5c1e6ed`: 176 games, **167 with an `offScreen` line**, 20 of them band-keyed. A profile's lands list 57 games at lap (55 with a line there), 86 at toddler (81), 118 at preschool (112), 141 at pre-K (134), 165 at school (156) and 176 at `grownup` (167). The page prints at most two lines, as `<p><strong>Off-screen idea:</strong> …</p>` at the end of **This week** (`weekSummary` in `src/parent/panel.ts`, through `offScreenIdeas`), chosen from the games played in the last seven days in catalog order, else the first two games her band lists; a week with one played game shows one idea. No game has a *notice* or *say* line today.

## What the grown-up sees

A new section **At home**, between **This week** and **Backup**, redrawn whenever This week is. For a child profile (lap to school):

- One muted line: "Three things to try away from the screen, from games played this week and games for their age. Nothing here is tracked, counted or due."
- **Three ideas.** Each is a block of short paragraphs: **Try:** the game's off-screen line for the band she plays it at (the sentence the page prints today); **Notice:** one question about what she might do; **Say:** one short thing to say, in quotation marks; and a muted source line, "From Jelly Drums, played this week." or "From Jelly Drums." *Notice* and *Say* appear only for a game that has them at her band ([the first eight](#the-first-notice-and-say-lines)); any other game's idea is its *Try* and source line alone. Nothing is invented to fill the gap.
- **The kit line:** "**Things from around the house:** a large soft ball, pots and pans, a laundry basket or box." It is [derived](#the-kit-list) from the three *Try* lines and left out when nothing matches.
- One muted closing line: "Say it in whatever language you speak at home. There is no right way to do these."

There is no checkbox, button, link, count, date, "done", "new" mark or `<details>` in the section, and the old "Off-screen idea" paragraphs leave This week (the card replaces them; the phrase no longer appears on the page). A family that never opens the section loses nothing, and the card does not change when it is ignored.

For a `grownup` profile the section shows the *Try* and source lines only, with the opening line "Paper versions of puzzles played this week or waiting on the shelf. Nothing here is tracked, counted or due.", and no *Notice*, *Say*, kit or closing line: the study gives a grown-up playing for themself no card, and their lines are the puzzles' paper twins.

**On a phone.** The section is stacked paragraphs with no table, so it wraps at the page's narrowest width; the build checks that the page does not scroll sideways at 390 logical pixels wide with the section open.

## Which three ideas

One pure function, `atHomeCard`, in a new `src/content/athome.ts`. Its inputs are the games the lands show her (`visibleGames(band, GAMES)`, catalog order), `LANDS`, her profile band and name, and a function giving each game's most recent round time; it reads no store and writes nothing. The same inputs always give the same card: no rotation, no randomness.

1. **Played.** Games with a round in the last seven days and a line at her band (`offScreenFor` not `null`), most recent round first, ties in catalog order, up to three.
2. **Starters, complete.** If fewer than three: walk `LANDS` in order, skipping a land that already has a game on the card; in each land take the first game, in the land's own order, that the lands show her and that lists her own band, is not on the card, and has *Try*, *Notice* and *Say* at her band. Stop at three.
3. **Starters, any.** If still fewer than three: the same walk taking a game with a *Try* alone; then the same walk again without skipping lands already used.

In steps 2 and 3 a starter is always a game that lists the profile's own band, one rule for every band (a school profile still sees younger games, so without it Roundup would be a school starter); for a `grownup` profile that is the same rule, and step 2 is skipped (there are no notes to complete).

With all 24 games and nothing played, the card is Bounce Back, Jelly Drums and Peekaboo Barn at lap (Peekaboo Barn comes before Roundup in Barnyard's order), Bounce Back, Jelly Drums and Recipe Workshop at toddler (Treehouse has a complete toddler game from batch 3), and Bounce Back, Jelly Drums and Pixel Pictures at preschool, pre-K and school (Treehouse's first complete game at those bands is Pixel Pictures, third in land order); the first eight games gave Roundup at lap through pre-K and Little Helpers at school until batch 2, and toddler matched lap until batch 3. The rule tests pin the starters.

This changes two things from today on purpose: played games come most recent first (the study's "recent play first"; today they come in catalog order), and the card is filled to three where today a one-game week shows one idea.

## The contract (`src/content/athome.ts`)

- **Notes table.** `AT_HOME_NOTES: Record<string, AtHomeNotes>` keyed by game ID, with `type AtHomeNote = { notice: string; say: string }` and `type AtHomeNotes = { all: AtHomeNote } & Partial<Record<Band, AtHomeNote>>`, the shape of `OffScreenLines` without `null`. The table lives in this one file rather than as a `GameModule` field: the wording is read and revised together (and one day translated together), and a notes batch then touches no game folder another session may be working in. `GameModule` and `src/games/types.ts` do not change.
- **Resolver.** `atHomeNoteFor(mod, band, childName): AtHomeNote | null`: `null` when the profile band is `grownup`, the game has no entry, or `offScreenFor` is `null` at that band (a withheld *Try* withholds its notes); otherwise the entry for `playBand(mod.bands, band)` if that key is present, else `all`, with `{name}` replaced exactly as `offScreenFor` does (`NO_NAME`, "your little one", for a blank name).
- **Card.** `atHomeCard(...)` returns `{ ideas: { game, try, note: AtHomeNote | null, played: boolean }[], kit: string[] }` as [above](#which-three-ideas). `offScreenIdeas` loses its only caller and is removed with its tests; `offScreenFor` stays the one reader of a line.
- **Panel.** A new `atHomeSection(app)` beside `weekSummary` builds the HTML, every string through `esc`, in an element with `data-at-home`; each idea carries `data-at-home-idea="<game id>"` and the kit line `data-at-home-kit`, for the browser case. The section's wording stays plain and makes no claim of benefit.
- **Save.** No `SaveData` field, no profile-index field, no `localStorage` key. The build's diff touches nothing under `src/progress/`.

## The first notice and say lines

Eight games, one from each of eight lands, all reaching lap, six reaching school. Each *Try* is today's sentence, unchanged; only the *Notice* and *Say* are new. A band key is written where the game's *Try* differs at that band or where the `all` wording would not fit an older child.

| Game (bands) | Entry | Try (today's line, for reference) | Notice | Say |
| --- | --- | --- | --- | --- |
| Bounce Back (lap–school) | `all` | Roll a ball back and forth across the floor, counting each roll. | Does {name} watch the ball, reach for it or push it back? | Roll! Here it comes. Again? |
| | `school` | Roll a ball at a wall from three different spots. Before each roll, point to where it will come back, then check. | Does {name} move the point after seeing the first roll come back? | Where will it come back this time? What makes you think so? |
| Jelly Drums (lap–school) | `all` | Make a pots-and-pans band: big pot, low sound; small pot, high sound. | Does {name} go back to one pot, or try each one? | Big pot: boom. Little pot: ting. |
| | `school` | Line up pots by size and guess which one will sound lowest before you tap it. Then play a tune from low to high. | Does {name} change the guess after hearing the first two pots? | Which will sound lowest? What makes you think so? |
| Roundup (lap–pre-K) | `all` | Herd stuffed animals into a laundry-basket "pen", counting each one in. | Does {name} put the animals in, tip the basket out or hand one to you? | One in. Two in. All in! |
| Little Helpers (lap–school) | `all` | Carry a big pillow together: how many hands does it take? | Does {name} take a corner, hug the middle or watch you lift? | Two hands. Lift! We carried it together. |
| | `school` | (the same) | Does {name} look for a way to carry it with fewer hands? | How many hands did that take? Is there another way? |
| Color Garden (lap–pre-K) | `all` | Sort socks or blocks into piles by color together. | Does {name} start a pile, add to yours or mix the piles up again? | Red with red. Blue with blue. |
| Size Parade (lap–school) | `all` | Line up three spoons or shoes from smallest to biggest, then reverse the line. | Which one does {name} pick up first: the biggest, the smallest or the nearest? | Little, bigger, biggest. |
| | `school` | (the same) | Does {name} check by holding two side by side? | Where would a fourth one go? How do you know? |
| Opposites (lap–school) | `all` | Play opposites with toys: put the teddy up high, then down low; open the box, close the box. | Does {name} look where the teddy went, or reach for the box? | Up high. Down low. Open. Closed. |
| | `school` | (the same) | Does {name} come up with a pair you had not thought of? | What is the opposite of that? Can anything be in between? |
| Block Tower (lap–school) | `all` | On the floor, build towers with blocks or cups: which is taller? Try shifting the top block a little and see whether it stands. | Does {name} stack, knock down or hand you a block? | Up, up, up. Down! Again? |
| | `school` | Build two towers from the same blocks, one wide at the bottom and one narrow. Guess which stands taller before it wobbles, then try. | Does {name} change the guess after the first tower? | Which will stand taller? What made that one wobble first? |

**Wording rules** (the rule tests enforce the checkable ones; the building session rereads each pair against the rest):

- **Notice** is one question that lists things she might do, every one of them fine. It names her once with `{name}` and uses no pronoun, so it reads correctly for any child. It never measures her: no "can", "able", "yet", "should", "ready", "by now", "behind", "ahead" or an age.
- **Say** is something the grown-up says, short enough to say while playing. An entry reachable at lap or toddler asks for no answer in words, the same line the lap tip draws (`coplayHintLap` in `src/games/types.ts`): no "what", "which", "why", "how", "tell", "say", "count" or "name". "Again?" is an offer, not a question to answer. School entries may ask one or two open questions; none has a single right answer the grown-up checks.
- **No practical-care advice.** A game gets notes only if its *Try* at every band avoids food and drink, bath and water, ice, sun, soap and bubbles, scissors and knives, sand and other loose fill, mirrors and torches, cords, and every word on the under-3 list. That keeps the reviewer-deferred lines the [earlier definition flagged](off-screen-lines.md#lap-and-toddler-removal-only) exactly as they are: still printable as a *Try*, never extended. The notes themselves give no safety, health, feeding or development advice, and make no factual claim to source.
- **No obligation.** No minutes, "every day", "each morning", "must" or "buy", as for the lines.

## The kit list

A fixed vocabulary, `KIT`, in the same file: a label and a pattern each, in display order.

| Label | Matches (whole words, plurals included) |
| --- | --- |
| a large soft ball | ball |
| blocks | block |
| cups or bowls | cup, bowl |
| pots and pans | pot, pan |
| spoons | spoon |
| a teddy or other soft toy | stuffed animal, soft toy, teddy, doll |
| a few toys | toy (left out when the row above matched) |
| socks or shoes | sock, shoe |
| a laundry basket or box | basket, box |
| a pillow or cushion | pillow, cushion |
| a blanket | blanket |
| a book | book |
| paper and crayons | paper, crayon |
| a tray | tray |
| a cardboard tube | tube |

`kitFor(lines)` returns the labels whose pattern matches any of the card's resolved *Try* lines, in table order, each once. The line is a help, not an inventory: it does not claim to list everything an idea uses, and it never lists food, water, anything on the under-3 list or any of the classes above, even when a *Try* names one. A ball is always listed as "a large soft ball", the substitute the lap and toddler swaps already use. Nothing on the list is to be bought; the heading says where the things are.

The study proposed a test that every line's objects are in the list. That would need every one of 167 free-text lines tagged by hand, so the first build tests the narrower thing that matters for the card: every game with notes has at least one kit label at every band, so a complete idea never comes without one.

## Rule tests (`src/content/athome.test.ts`)

All pure, over `GAMES`, `LANDS` and every band, with a sample name.

- **Table shape.** Every `AT_HOME_NOTES` key is a registered game ID with an `offScreen` line; every band key is a band the game lists; every `notice` and `say` is non-empty.
- **Notice.** Resolved at every band the game lists: ends with "?", contains the sample name exactly once, contains no `{` or `}`, no pronoun (*she, her, hers, he, him, his, they, them, their*), none of the measuring words above, and is at most 110 characters.
- **Say.** At most 80 characters at every band; at lap and toddler none of the answer-seeking words above.
- **Every band.** The lines' own `EVERY_BAND` and `UNDER_3` patterns (moved to a shared export rather than copied) pass for every resolved *Notice* and *Say*, `UNDER_3` at lap and toddler.
- **Deferred classes.** For every game with notes, at every band it lists, the resolved *Try* matches none of the deferred-class words.
- **Resolver.** `null` at a `grownup` profile, for a game without an entry, and for a game whose line is withheld (a stub game with `offScreen: { all: '…', lap: null }` and notes); a `school` key wins over `all` at school; a blank name gives "your little one".
- **Kit.** Every label passes `UNDER_3`, `EVERY_BAND` and the deferred-class list; `kitFor` keeps table order, lists a label once, drops "a few toys" beside the soft-toy label, and returns an empty list for a line with no match; every game with notes has at least one label at every band.
- **Selection.** Nothing played: the starters are the two triples named [above](#which-three-ideas), one land each. One game played two days ago: it comes first, marked played, and two starters from other lands follow. Four played: the three most recent, most recent first. A played game with no line at her band is skipped. A round eight days old does not count. A `grownup` profile gets no note and only games that list `grownup` as starters. The same inputs twice give deeply equal cards.
- **Proof the tests bite.** During the build, put "Can {name} stack three yet?" in as one *Notice* and "a marble" in as one kit label, watch each fail, then restore.

## Check tier

**Shell**, kept light, for a panel change with no game interaction: `npm run typecheck`, `npm test` (with the new file), `npm run build`, and `BROWSER_SUITE=grownups` filtered to **one** new case: on a fresh lap test profile the section holds three `data-at-home-idea` blocks whose IDs are the lap starters, a kit line, no `input`, `button`, `a` or `details` inside `data-at-home`, no "Off-screen idea" text on the page, and no sideways scroll at 390 wide. Two screenshots at that width, one at the lap profile and one at a school test profile. No `world`, offline, `fingerdemo` or game suite: navigation, persistence, assets and games are untouched.

Not established by any of this: whether a family reads or uses the card, whether a *Notice* or *Say* line helps, and the safety of any *Try* beyond the classes the notes avoid.

## Docs at closeout (the build's)

The study's slice 4 marked built; this page's status and any as-built differences; DESIGN.md's per-band grown-up text row gains `atHomeCard`, `atHomeNoteFor` and `kitFor` and its grown-ups' page paragraph the section; the recommendations row and the IDEAS row move from proposal to built; a verification entry and the `grownups` coverage row. README and GAMES.md stay unchanged (no game behaviour). Queue the next notes batch (eight more games, strings tier: typecheck and the rule tests) only if Next ten needs a line.

## Batch 2 (built 2026-11-17, PR #1754)

Eight more games, one land each, so every one of the 11 lands now has a game with notes (Treehouse, Cozy Village and Lantern Lake had none) and the table holds 16 games. Wording is copied from `src/content/athome.ts`; each *Try* is the game's `offScreen`, unchanged. Word Search's `all` entry is what a school profile reads; a grown-up profile gets no notes, as before.

| Game (bands) | Entry | Try (today's line, for reference) | Notice | Say |
| --- | --- | --- | --- | --- |
| Pixel Pictures (preschool–school) | `all` | Color squares on graph paper to copy a simple picture, or make one for her to copy. | Does {name} copy square by square, or color a whole row at once? | Two blue, then one red. What shall we make next? |
| Peekaboo Barn | `all` | Play peekaboo with stuffed animals under a blanket. Ask "Where did the cow go?" | Does {name} look at the blanket, pull it off or wait for you to lift it? | Where did the cow go? Peekaboo! There it is. |
| | `school` | (the same) | Does {name} take a turn hiding an animal for you to find? | Your turn to hide one. Will you give me a clue? |
| Duck Pond | `all` | Line up toy ducks or spoons and count them together, touching each one. | Does {name} touch each one, pick one up or push the line along? | One, two, three. Three in a row! |
| | `school` | (the same) | Does {name} start again from one, or carry on from the last number? | How many would there be with two more? How do you know? |
| Swap Meet (toddler–school) | `all` | With a grown-up, each hold a toy and say which toy you would like to swap. | Does {name} hold on, hold a toy out or reach for yours? | Swap? Here is mine. Thank you! |
| | `school` | (the same) | Does {name} offer a different toy after a "no thanks"? | Would you swap? What would make it a good swap for both of us? |
| Dot Link | `all` | Line up colored blocks or buttons (blocks only under 3), then count how many of each color. | Does {name} line the blocks up, stack a few or gather one color? | Red, red, blue. Two red, one blue. |
| | `school` | (the same) | Does {name} sort by color first, or keep a tally along the line? | Which color has the most? How many more than the next one? |
| Photo Safari | `all` | Play "I spy" with places: "I spy a teddy under the table." | Does {name} look toward the teddy, point or go and fetch it? | I spy a teddy under the table. There it is! |
| | `school` | (the same) | Does {name} use a place word such as under, beside or on top of? | Your turn to spy. Where is it hiding? |
| Bouncy Launch | `all` | Roll a ball down a ramp: tilt it more or less and see how far it goes. | Does {name} watch the ball, chase it or carry it back to the ramp? | Down it goes! Far, far away. Again? |
| | `school` | Make a ramp from a book and roll a ball off it. Mark where it lands with a sock, tilt the book and guess the new spot first. | Does {name} move the guess nearer or farther after each roll? | Where will it land now? What changed? |
| Word Search (school, grown-up) | `all` | Hide a few words in a grid of letters on paper for someone else to find. | Does {name} hide the words across, down or both ways? | Which word was hardest to hide? Where would you look first? |

Left out, with reasons: Stamp Studio (its *Try* names a potato, food in spirit though not on the word list), Teddy Doctor (plasters) and Maker Lane (bread). One wording was caught by the rule tests during the build: a school *Notice* for Photo Safari used "behind", a measuring word, and became "under, beside or on top of". The unchanged selection rule changed the nothing-played starters, as described under [Which three ideas](#which-three-ideas); Roundup and Little Helpers still come onto the card with notes when played.

## Batch 3 (built 2026-11-17, PR #1757)

Eight more games, so the table holds 24. Wording is copied from `src/content/athome.ts`; each *Try* is the game's `offScreen`, unchanged (Seesaw Balance reads its `lap` and `toddler` line, spoons only, under 3).

| Game (bands) | Entry | Try (today's line, for reference) | Notice | Say |
| --- | --- | --- | --- | --- |
| Recipe Workshop (toddler–pre-K) | `all` | With pretend kitchen toys, make a bowl from a picture, then tell someone what you did first. | Does {name} fill the bowl, stir it or hand it to you? | In it goes. Stir, stir. All done! |
| Song Maker (lap–school) | `all` | Make a song with pots and spoons, then play it again the same way together. | Does {name} tap one pot, tap each in turn or watch your spoon? | Tap, tap, boom. Again? Tap, tap, boom. |
| | `school` | (the same) | Does {name} play it back the same way, or change a part? | Was that the same song? Which part would you change? |
| Sound Garden (lap–pre-K) | `all` | Play a pot-and-spoon drum: copy each other's taps, fast and slow. | Does {name} tap along, wait for a turn or speed up? | Tap, tap, tap. Slow, slow. Fast, fast, fast! |
| Egg Catch (lap–school) | `all` | Roll a ball down a cardboard tube and catch it in a bowl. | Does {name} watch the tube, look in the bowl or reach for the ball? | In it goes. Here it comes. Caught it! |
| | `school` | (the same) | Does {name} move the bowl after seeing where the first roll lands? | Where will it come out? What happens if we tilt the tube more? |
| Bumper Garden (lap–pre-K) | `all` | Roll a ball down a tilted tray with a few cups as bumpers. Which cup does it hit first? | Does {name} follow the ball, move a cup or tip the tray? | Roll! Bump. It hit the cup. Again? |
| Goodnight Room (lap–pre-K) | `all` | At bedtime, say goodnight to the things in her room together: "Goodnight, lamp. Goodnight, teddy." | Does {name} look at each thing, point to one or wave? | Goodnight, lamp. Goodnight, teddy. Goodnight, window. |
| Seesaw Balance (lap–school) | `all` | Hang two cups from a coat hanger and add spoons or coins until it hangs level. | Does {name} add a spoon, take one out or swing the hanger? | One more spoon. Down it goes! Now this side. |
| | `school` | (the same) | Does {name} even it up by adding to one cup, or by taking from the other? | Which cup will go down? What would make it hang level? |
| Relay Woods (toddler–school) | `all` | With a grown-up, pass a drawn picture along a row of toy friends. | Does {name} pass the picture along, keep hold of it or give it to one friend? | Here you go, bear. Pass it on. Thank you! |
| | `school` | (the same) | Does {name} give each friend a turn, or skip to the end of the row? | Who gets it next? What would show us it got to the end? |

Treehouse now has a toddler game with notes, so the nothing-played starters at toddler become Bounce Back, Jelly Drums and Recipe Workshop; lap, preschool, pre-K and school are unchanged, and the lap kit line is unchanged. The rule tests pin the starters.

Left out, with reasons: Fill Dump (dry beans at preschool, loose fill in spirit), Peg Garden (a marble at preschool), Pet Kitchen (a sandwich), Puzzle Pals and Tangram Town (cutting), Vine Snip (string), Quick Tricks ("keep a toy dry") and Puppet Stage ("at dinner").

**Observation: the youngest-band gaps cannot be filled under the present rules.** The rule test requires every game with notes to have a kit label at every band it lists. Treehouse at lap: the only un-noted lap game whose *Try* is clear of the deferred word list is Gear Garden ("Look for something at home that turns…"), which names nothing in the kit; Stamp Studio stays out for its potato, and Rainbow Fingers, Fluffy Salon and Draw the Pattern name deferred classes. Cozy Village at lap: Weather Wardrobe, Mail Carrier, Stop and Go and Pet Says name no kit item, Teddy Doctor has plasters, and Splish Splash, Feelings Faces and Scoop Shop name deferred classes. Lantern Lake has no game below school. A fourth batch can therefore add games in bands already served, but closing the lap gaps in Treehouse and Cozy Village would need the kit rule revisited, for instance allowing notes for an idea that needs no object.

## Open decisions

Each has a default the build takes; none waits on anyone.

1. **Notes in one table, not on `GameModule`.** Default: the table, for the reasons in [the contract](#the-contract-srccontentathomets). The cost is that a game's notes are not beside its line; the shape test ties them together.
2. **Played ideas most recent first, and always three.** Default: as written; both are small changes from today's two ideas in catalog order.
3. **A `grownup` profile.** Default: *Try* lines only, starters from games that list `grownup`, no kit. The alternative, no section at all, would remove the paper twins the page shows today.
4. **Kit coverage.** Default: the narrower test above, not a tag on every line.
5. **`{name}` and no pronoun in a *Notice*.** Default: as written, so the card reads correctly for every profile.
6. **Its own section, not inside This week.** Default: its own, so the study's "opens the gear, sees At home" holds and This week stays a record of play.
7. **Which eight games first.** Default: the table above (one per land, all at lap, safe *Try* lines). Further batches are content, eight games at a time, under the same wording rules.

## As built

Built 2026-11-17 (PR #1747). Differences from this page:

- Three *Notice* lines were reworded, because the table used "them" (for pots, animals, piles) and the no-pronoun rule and its test forbid it; the table above now shows the built wording.
- A starter is always a game that lists the profile's own band (the selection text above now says so); a younger game she played this week still comes onto the card with its notes.
- The kit line at a fresh lap profile is "a large soft ball, pots and pans, a teddy or other soft toy, a laundry basket or box": the example sentence left out the soft toy that Roundup's "stuffed animals" matches.
- `atHomeSection()` takes no `app` argument. `atHomeCard` takes one input object, including `now` and an optional `notes` table for tests; `atHomeNoteFor` and `kitFor` take an optional table too.
- The browser case is its own suite name, `athome` (it also runs inside `grownups` and `all`), and also checks that a grown-up profile gets *Try* lines only and no kit.
- The deferred practical-care classes are a concrete word list, `DEFERRED_CLASSES` in `src/content/offscreen-rules.ts` (food, snack, fruit, eat, drink, juice, milk, bath, bathtub, water, ice, sun, sunny, soap, bubble, scissors, knife, knives, sand, rice, flour, mirror, torch, flashlight, cord, rope), beside the shared `UNDER_3`, `wordPattern` and `EVERY_BAND` moved out of `offscreen.test.ts`.
- Batch 2 changed that lap kit line to "a large soft ball, pots and pans, a teddy or other soft toy, a blanket" (see below).
