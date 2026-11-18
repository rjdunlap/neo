# Talk cards on the grown-ups' page (definition)

Defined 2026-11-17. Six built games each have a study follow-up that is one short conversation card for the grown-up, and none is on the page: Not Always' question card ([philosophy and reasoning](../deep-dives/subjects/philosophy-reasoning.md#build-slices-in-order), PR3), Notice Board's "Who made this?" ([media literacy](../deep-dives/subjects/media-literacy.md#build-slices-in-order), ML3), Shell Rows' table games ([strategy games](../deep-dives/subjects/strategy-games.md#build-slices-in-order), SG5), Maker Lane's "Where did it begin?" ([food and fiber systems](../deep-dives/subjects/food-fiber-systems.md#build-slices-in-order), FS3), Thought Bubbles' story talk ([literature and meaning](../deep-dives/subjects/literature-meaning.md#build-slices-in-order), LM3) and Puppet Stage's show card ([theatre and puppetry](../deep-dives/subjects/theatre-puppetry.md#build-slices-in-order), TP5). The [At-home card](at-home-card.md) left them out of scope as "later content for the card this build makes". This page freezes all six: the wording, its sources, where a card shows, the copy rules and the phone layout.

**Build 1 implemented 2026-11-18** ([PR #1796](https://github.com/rjdunlap/neo/pull/1796)). The three question cards are in the At home block. Build 2 is claimed by `claude/talk-cards-build-2` (the Shell Rows, Maker Lane and Puppet Stage cards; `src/content/talk.ts`, `src/content/talk.test.ts`). The builds are [two slices](#build-slices-in-order).

Audited on `origin/main` at `979f05fc`. The page's **At home** section (`atHomeSection` in `src/parent/panel.ts`, from `atHomeCard` in `src/content/athome.ts`) shows three ideas, a kit line and a closing line, with no `input`, `button`, `a` or `details` inside `data-at-home` (the `grownups` browser case asserts it). All six games are built and registered: Not Always, Notice Board, Shell Rows and Thought Bubbles list pre-K and school; Maker Lane lists toddler to school; Puppet Stage lists lap to school. None lists `grownup`.

## What the grown-up sees

Inside **At home**, after the kit line and before the closing line, one block headed by a bold line, **Something to talk about**, holding at most **two** cards. Each card is:

- its title in bold;
- two to four short paragraphs, exactly as in [the six cards](#the-six-cards), with the child's name where the wording has `{name}`;
- for a lap or toddler profile, the card's *under two* paragraph where it has one, in place of the others;
- one muted source line: "From Notice Board." followed, where the card borrows from someone, by one plain sentence naming who.

There is nothing to press: no checkbox, button, link, count, date, "done" or "new" mark, and no `<details>`. A source is named in words, not linked, because the section has no links. When no card qualifies the block and its heading are absent, and the section reads exactly as it does today. The section's closing line ("Say it in whatever language you speak at home. There is no right way to do these.") already covers the cards and is not repeated.

A `grownup` profile never sees the block: no card's game lists that band, and a grown-up playing for themself is given no conversation card, as the At-home card already decided.

## Which cards show

A card shows **only once its game has been played**, so the page never talks about a game the family has not met. One pure function, `talkCards`, in a new `src/content/talk.ts`. Its inputs are the games the lands show the profile (`visibleGames(band, GAMES)`, catalog order), the profile band and name, and a function giving each game's most recent round time. It reads no store and writes nothing.

1. Take the games that have an entry in `TALK_CARDS` and at least one saved round, however old. (At home's three ideas use a seven-day window because they rotate with the week; a talk card is tied to having met the game at all.)
2. Order them most recent round first, ties in catalog order.
3. Keep the first two.

The same inputs always give the same cards: no rotation and no randomness. Two is the cap so that a family who has played all six still gets a section short enough to read on a phone; the card for a game played again comes back to the top.

A card sits in this block and not in the This week table, although that is where a game's row is: the table's cells are a name, a level picker and two numbers, and a paragraph inside a cell would force the table wider than a phone. The source line names the game instead.

## The six cards

Wording is recorded here and copied into `TALK_CARDS`. Quotation marks inside a line are things the grown-up says. Build 1 rephrased the Not Always rain question to follow the shared wording rule against “every day”.

| Game (bands) | Title | Paragraphs | Source sentence |
| --- | --- | --- | --- |
| Not Always (pre-K, school) | A question with no right answer | 1. Pick one thing you both saw today and ask one open question about it: "Is it always true that big things are heavy?" or "What if it never stopped raining?" 2. Whatever {name} says, two follow-ups: "Why do you think that?" and "Can you think of a time when it isn't so?" 3. A what-if or an is-it-fair question has no right answer, so there is nothing to correct. Say what you think too; disagreeing kindly is part of it. | The shape, one thing to look at, one question and two follow-ups, is borrowed from Philosophy for Children classroom practice. |
| Notice Board (pre-K, school) | Who made this? | 1. When a poster, a toy box or a video is in front of you both, wonder aloud about three things: "Who made this?", "Why did they make it?" and "What did they leave out?" 2. Any answer is a start: "the shop", "so we come in". Say your own guess too. 3. A thing made to sell is ordinary, not bad. The questions are about who and why. | The three questions follow the key questions of the National Association for Media Literacy Education. |
| Shell Rows (pre-K, school) | Two table games | 1. Noughts and crosses on paper: before each move, each of you says out loud which square you are watching. 2. Last one wins: lay seven spoons in a row and take turns taking one or two. Whoever takes the last spoon wins. Play again with {name} going second. 3. Change a rule together, ten spoons or up to three at a time, and see what happens. | Both are old table games with no single author; the second is usually called Nim. |
| Maker Lane (toddler–school) | Where did it begin? | 1. Find three things at home that began as a plant, an animal and a tree: a cotton sock, a wool hat, a cardboard box. 2. Read a clothing label together ("100% cotton") and ask: what did it look like before? 3. Tear the edge of a cardboard box and look at the little fibres. *Under two:* Touch a wool hat and a cardboard box together and name them: soft hat, bumpy box. | (none) |
| Thought Bubbles (pre-K, school) | Story talk | 1. At any picture book, stop on one page and ask instead of telling: "What does the bear want?" "Does the fox know that?" 2. Then: "How do you know? Show me in the picture." 3. With a reader who is ready for it: "Who is telling this story?" | Asking instead of telling is borrowed from dialogic reading (Whitehurst and colleagues, 1988). |
| Puppet Stage (lap–school) | A sofa puppet show | 1. A sock over your hand is a puppet. Give it a voice and let it say hello to {name} over the back of the sofa. 2. Then a show in three scenes, one of the island's own. Bunny looks for a hat: "Where is my hat?" Duck finds one: "Quack! I found a hat!" Bunny says thank you. 3. Swap places: {name} holds the puppets, and you sit in the front row and clap. *Under two:* A sock over your hand is a puppet. Let it peek over the sofa, say hello to {name} and hide again. | (none) |

### Sources, and what each card leaves out

- **Not Always (PR3).** The study's model is the Philosophy for Children enquiry (a stimulus, a chosen question, "why?", a counterexample), which it read through search summaries of three school guides, not in full; the card therefore says "borrowed from" and quotes nobody. The study's finding that a large trial found no reading gain is why the card claims nothing. The "Is it fair if…?" example is left to the grown-up: a fairness example written here would carry our own view of what is fair.
- **Notice Board (ML3).** The three questions are after NAMLE's *Key Questions for Analyzing Media*, reopened for this definition: under Authorship "Who made this?", under Purpose "Why was this made?", under Content "What is left out that might be important to know?". The study also proposed a caution from the American Academy of Pediatrics' statement on digital advertising (that recognising an advert does not protect a young child). **It is left off the card:** the statement returned HTTP 403 again when this definition tried to open it, the study had it only from secondary coverage, and a sentence about what adverts do to a child is a factual claim this page cannot yet source. The card makes no protection claim in either direction. The study's line that pictures can be made by computers is left off for the same reason.
- **Shell Rows (SG5).** Noughts and crosses and Nim are traditional and unattributed. The sowing game the study lists waits with Seed Bowls and its cultural-source review. Spoons, not pebbles or coins, so the wording is the same as the At-home kit's.
- **Maker Lane (FS3).** The wording is the [game definition's](maker-lane.md#ghost-finger-how-to-card-voice-and-registration), with the loaf dropped (food is a class the At-home rules defer to a reviewer) and the *under two* sentence written without a pronoun. Conversation and looking only: no making, dyeing or cooking.
- **Thought Bubbles (LM3).** The four questions are the study's, with animal characters in place of "she" and "he". Dialogic reading was read through search summaries; the card borrows the idea of asking and names the paper, and claims no effect.
- **Puppet Stage (TP5).** The study proposed a sock or paper-bag puppet that the grown-up cuts, with a library or museum source for the craft, and printed story cards. **This card has no cutting and no printing:** a sock on a hand needs neither, scissors are a deferred class, and printable cards are the [off-screen study's](../deep-dives/subjects/off-screen-companions.md#build-slices-in-order) own later slice. The three scenes are story card b, *The lost hat*, from [levels 4–6](puppet-stage-4-6.md). With no craft there is no practical advice to source.

## The contract (`src/content/talk.ts`)

- **Table.** `TALK_CARDS: Record<string, TalkCard>` keyed by game ID, with `type TalkCard = { title: string; lines: string[]; under2?: string; source?: string }`. It lives in one file, like `AT_HOME_NOTES`, so the wording is read and revised together and a wording change touches no game folder. `GameModule` and `src/games/types.ts` do not change.
- **Selection.** `talkCards({ games, band, childName, lastPlayed }): { game, title, lines, source }[]` as [above](#which-cards-show): `lines` is `[under2]` at a lap or toddler profile when the card has one, else the card's lines, each with `{name}` filled exactly as `offScreenFor` fills it ("your little one" for a blank name). An empty list at a `grownup` profile.
- **Panel.** `atHomeSection` appends the block when the list is not empty: an element with `data-talk-cards`, the bold heading, and each card a `div` with the existing `parent__idea` class and `data-talk-card="<game id>"`. Every string goes through `esc`. No new CSS class.
- **Save.** No `SaveData` field, no profile-index field, no `localStorage` key. The build's diff touches nothing under `src/progress/`.

## The copy rules and their tests (`src/content/talk.test.ts`)

All pure, over `GAMES` and every band, with a sample name.

- **Table shape.** Every key is a registered game ID; a title is at most 40 characters; a card has two to four lines, each at most 240 characters; a card whose game lists lap or toddler has an `under2` line.
- **Shared wording rules.** Every resolved title, line, `under2` and source passes `EVERY_BAND` (no minutes, "every day", "must", "buy", no unfilled brace) and names no `DEFERRED_CLASSES` word; the cards of games that list lap or toddler (Maker Lane, Puppet Stage) also name no `UNDER_3` word. The game's name in the source line is added by the panel and is not part of the table, so the name Thought Bubbles does not trip the bubble rule.
- **No claim.** No resolved text contains "protect", "safe", "learn", "teach", "improve", "boost", "develop", "skill", "brain", "attention", "smarter", "benefit" or "helps", and none contains the At-home card's measuring words ("can't", "able", "yet", "should", "by now", "behind", "ahead" as whole words; "ready" is allowed once, in Thought Bubbles' third line, where it describes a reader and the test names that exception).
- **Selection.** Nothing played: an empty list at every band. Notice Board played once, a year ago: its card alone. Three card games played: the two most recent, most recent first. A card game the lands do not show the profile (Not Always at a toddler profile, with a stub round) is skipped. A lap profile with Puppet Stage played gets the one *under two* line. A `grownup` profile gets an empty list. The same inputs twice give deeply equal results.
- **Proof the tests bite.** During the build, put "This protects {name} from adverts." in as one line and "a pebble" into Puppet Stage's card, watch each fail, then restore.

The building session also rereads the six cards as a set on a phone-width page: the tests cannot tell whether a card sounds like homework.

## On a phone

Both players read this page on a phone, so the layout is fixed at 390 logical pixels wide: stacked paragraphs in the page's one column, no table, no side-by-side cards, no horizontal scroll with the section open. A card is at most a title, four paragraphs and a source line; two cards are at most twelve short paragraphs. Nothing in the block is collapsed, because a `<details>` is something to press.

## Check tier

**Build 1** is shell tier, kept light, for a panel change with no game interaction: `npm run typecheck`, `npm test` (with the new file), `npm run build`, and the single `grownups` case that also runs as `BROWSER_SUITE=talkcards`. On a pre-K test profile with one saved Notice Board round, the At home section holds a `data-talk-cards` block with exactly one `data-talk-card="notice-board"`, still no `input`, `button`, `a` or `details` inside `data-at-home`, and no sideways scroll at 390 wide; on a fresh profile there is no `data-talk-cards` element. One screenshot at that width. No `world`, offline, `fingerdemo` or game suite.

**Build 2** adds strings only: `npm run typecheck` and the rule tests.

Not established by any of this: whether a family reads a card, whether a question on it starts a conversation, or whether a real phone shows the section as the browser does.

## Build slices, in order

1. **The block and the three question cards** (shell tier): `src/content/talk.ts` with the type, `talkCards` and the Not Always, Notice Board and Thought Bubbles cards; the panel block; the rule tests; the one browser case. All three games list pre-K and school, so no *under two* line is exercised on the page yet, though the rule tests cover the resolver with a stub.
2. **The three making-and-playing cards** (strings tier): Shell Rows, Maker Lane and Puppet Stage, with the two *under two* lines.

Docs at each build's closeout: this page's status and any as-built differences; the study's slice and its backlog and recommendations rows marked built for the cards shipped; DESIGN.md's per-band grown-up text row gains `talkCards`; a verification entry and, for build 1, the `grownups` coverage row. README and GAMES.md stay unchanged (no game behaviour).

## Left out

- Shell Rows' sowing game (waits with Seed Bowls), the paper-bag puppet and printed story cards, the advertising caution and the note about computer-made pictures, each for the reason [above](#sources-and-what-each-card-leaves-out).
- The other cards studies hand over (writing, keyboard, sign, phonics, vocabulary, look-it-up, Puppet Problem Cards, Program the Puppet): their games or conditions are not met, and each can join `TALK_CARDS` later with its own wording review.
- Any record of a card having been read or tried.
