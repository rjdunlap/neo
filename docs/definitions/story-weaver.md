# Story Weaver 1–3: a story for a reader who was not there

WC1 definition, 2026-10-22, [PR #835](https://github.com/rjdunlap/neo/pull/835), branch `claude/define-story-weaver`. Based on the [writing-composition study](../deep-dives/subjects/writing-composition.md) and its [recommendation packet](../deep-dives/subjects/RECOMMENDATIONS.md#writing-and-composition-recommendations). **Docs only; no game, registration, code or device evidence.** The rules below are a concrete proposal for developer review. The build waits on decision 1 (identity and land) and on the ordinary content review of every tile and line (decision 5).

## Scope and identity

Fun action: build a little picture-book story out of tiles, hear the pet read it with each word lighting, then answer an owl's question or choose a reason. Learning purpose: a story has parts in an order (who and where, what went wrong, what was tried, how it ended, how they felt), a reader who was not there needs the words, a reader's question can send the writer back to add a part, and a feeling is joined to an event with *because*. No typed or handwritten text, no free text, nothing is judged. Names appear only through `ctx.childName` where a line asks for it (never required, never in a tile). IDs `story-weaver` and levels 1–3 are provisional until identity is accepted; no saved IDs are reserved.

Overlap test: Story Steps owns ordering, repairing and predicting stories someone else wrote; Story Theater owns choosing cast, weather and prop and watching. Story Weaver's difference is a **spoken page and a reader who is absent and responds**. If the eventual experience is only "pick tiles and watch", reopen identity and fold it into Story Theater instead of registering this. Excluded: WC2–WC12, dialogue and thought bubbles, a second ending to compare, keeping or sharing a story (decision 2), new saves, new creation kinds, shell or navigation changes, and anything about writing readiness or delay. A story is a transient local record of at most six tile ids; leaving discards it with no loss of reward.

## Tiles, clauses and the support table

Every clause is a phrase that follows the friend's name, so no sentence needs a gendered pronoun. Text is composed from these authored lines only; a test composes every reachable combination.

| Part | Tiles (id → spoken clause) |
| --- | --- |
| Who | `bunny` “Bunny”, `duck` “Duck”, `turtle` “Turtle”, `frog` “Frog” (drawings from `src/art/critter.ts` and `animals.ts`) |
| Where | `pond` “at the pond”, `meadow` “in the meadow”, `barn` “by the barn”, `woods` “in the woods” (existing scenery) |
| What went wrong (`problem`) | `hat` “lost a hat”, `rain` “got caught in the rain”, `mud` “got stuck in the mud”, `tower` “made a tower that wobbled”, `hungry` “felt hungry” |
| What they tried (`try`, optional) | hat: “looked under the leaves” / “asked a friend”; rain: “ran under a mushroom” / “held up a big leaf”; mud: “pulled with all their might” / “called for help”; tower: “put the biggest block at the bottom” / “held it steady”; hungry: “looked for berries” / “asked a friend to share” |
| How it ended (`ending`) | hat: “found it in a tree” / “got it back from a friend” / “made a new one from a leaf”; rain: “stayed dry and cozy” / “splashed in the puddles” / “saw a rainbow”; mud: “popped out with a squelch” / “was pulled out by friends” / “hopped out and shook off”; tower: “stood up tall” / “fell, so they built it again” / “fell with a happy crash and laughed”; hungry: “shared a snack” / “found sweet berries” / “had a big picnic” |
| How they felt (`feeling`, level 3 only) | `proud`, `happy`, `sleepy`, `surprised`, `sad`, `relieved` |

A try tile is offered only after a problem is chosen and only that problem's two tries; an ending tile only that problem's three endings, so every combination she can build is a sensible story. Changing the problem clears its try and ending (they are removed visibly, never silently kept). The `try` part is never asked about by the owl and never required.

**`supports(feeling, event)`** is an authored table over her story's own event tiles (problem, try, ending); a test reads it for every feeling. Rules of the table, with the full rows to be written at build and content-reviewed:

- `happy`, `relieved`: every ending of every problem.
- `proud`: every try, and the endings “made a new one from a leaf”, “stood up tall”, “fell, so they built it again”, “hopped out and shook off”.
- `surprised`: “saw a rainbow”, “found it in a tree”, “fell with a happy crash and laughed”, “found sweet berries”.
- `sleepy`: “stayed dry and cozy”, “splashed in the puddles”, “had a big picnic”, “pulled with all their might”.
- `sad`: every problem tile **while the problem is the reason**, never an ending.

Because every problem has a `sad` row and every ending has `happy` and `relieved` rows, any story with a problem and an ending supports at least three feelings by construction. The *because* frame opens only once the story has a problem and an ending (level 3 reaches it only then), and **only feelings with at least one supporting event among her own events are offered**.

## Scene, accounting and the three rounds

Scene: a book with three page cards across the top (first, next, last), a tray of tiles for the current part, and an owl on a stump at the side, clear of the pet, “who can’t see the pictures, only hear the words”. Touching a tile speaks its clause and dips it; tapping it again places it on the page with a soft page turn and reads the page clause back with the words lit one by one; tapping a placed tile takes it out and puts it back in the tray. Page one is who and where, page two is the problem and, once chosen, its try, page three is the ending. Pause freezes a reading; restart returns to the authored first page; leaving or destroy cancels readings, owl animations and timers so a late callback cannot finish a round.

| Level | First action and growth | Finish and accounting |
| --- | --- | --- |
| 1 **Page by page** | Only the next page is open. Pick a friend and place, a problem (the try is offered and skippable), an ending. The pet reads each page as it completes. | The ending placed starts the full read-back and a bow; then `ctx.finish({ misses: 0, hints: 0 })`. No miss or hint exists. After five quiet seconds on an empty page the pet names the next choice once per page. A story missing a required part cannot finish at level 1. |
| 2 **The owl asks** | All pages open, any order, any part may stay bare. **Read it to the owl** appears once a friend is placed and reads the story so far. If a required part is missing the owl asks about the **first** one in order (where, what went wrong, how it ended), its tiles glow, and she may add it (the owl rereads the whole story) or tap **That’s my story**. A complete story gets no question. | Declining or adding, then the last reading, finishes the round. **The question is never a miss and costs no hint**; the owl sounds curious. Zero misses and zero hints, always, so the shell’s adaptation sees a smooth round (see Bands). The next question follows only after another Read. |
| 3 **Because** | She builds a complete story as in level 2 (the owl’s questions work the same), then the feeling page opens with the offered feelings. After a feeling the frame “{Friend} felt {feeling} because ___” offers her own events as reason tiles. | A supported reason: the pet reads the whole story with the *because* sentence, then finish. An unsupported reason (for example `sad` because the ending is “found it in a tree”): the owl asks, e.g. “Hmm, the hat was found. Was Bunny sad then?”, the tile returns to the tray and nothing is removed. **The first unsupported reason in a round is free.** Each later unsupported reason counts one miss. After two counted misses the supporting tiles glow once (one hint); the in-round hint button gives the same glow. A hint is counted once per round. She may change the feeling at any time. |

Seeds choose which tiles are shown first and their tray order; the tile sets above are fixed. Level 1 may offer a seeded subset of three of the four friends and places. Rewards: one sticker per completed round, with or without help or an added part. No timer ends a round, nothing is scored, and the story is not kept.

## Bands and adaptation: proposal awaiting decision

**Decided 2026-10-23 (on the developer's delegation):** A new game, school 1–3 with default 1 (levels 1–2 never miss), as proposed. Story Grove allocation: Word Glue, Story Weaver and Pond Typing each try Story Grove first; the CI lands test (`landLayout` at every band in all four views) decides at merge; a game that does not fit goes to Treehouse; a built game is never moved to make room. (Puzzle Peaks already lays out 13, so it is no longer the fallback.) For the problem, ending and feeling tiles and every owl line, the building session checks it against reputable sources (museums, universities, government science agencies, established curricula), lists them here and records the check in its VERIFICATION entry; no outside reviewer is needed.

Proposed `school` range 1–3, default 1, no other band: lap to pre-K have no reader of a written page and WC2 (a pet scribe) is deliberately later. Levels 1–2 can never produce a miss or a hint, so two completed rounds step the level up to 3 with no evidence of independent writing; level 3’s free first question and its glow keep it supported. This is a conservative proposal, **not an approved band mapping**. The developer may prefer pinned entry or a shell adaptation exception; do not add one here. A completed read-back is not evidence of reading or writing; descriptions for grown-ups say “builds a three-page story”, “answers the owl’s question about a missing part” and “joins a feeling to an event with because”, with no grade claims. Land: Story Grove is the lean (twelve games listed, so the thirteenth must pass `landLayout` at every band in all four views); Puzzle Peaks is the fallback; neither is approved.

## Layout, art and sound

Targets are at least 112 logical units and tiles at least 140×120, with gaps of at least 16; the tray wraps to rows of three if it has more than four tiles. This is a **layout specification, not a screenshot or touch fit**.

- Landscape (1024×768 design area, expanded): corner buttons and instruction in y0–104. Page cards 260×180 at x192, 468, 744, y112. Tray rows y320 and y456, from x192 (tiles 140×120). Owl on the right at x844–1008, y320–560, with its reread button 112 square. Control row (Read it to the owl, Undo, Hint, That’s my story, Finish where it applies) at y620, x192 upward, each 112 square. The bottom-left x0–160/y500–768 pet clearance stays empty.
- Portrait (taller view, same 1024-wide bounds): page cards y144–324, owl y340–520 at the right, tray rows below y540, controls at the bottom with at least 16 above the guide corner. Short views use landscape. Resizing mid-reading keeps the story, selection and reading position and recomputes hit areas from `view`.

A build asserts no overlap of page, tray, owl, control, guide and navigation bounds at the harness’s portrait and landscape sizes and takes one portrait screenshot. Art is code-drawn from existing critters, scenery and a new owl; sounds are synthesized (a page turn, a small bell, pentatonic tile dips); meaning survives sound off. No assets are imported. Quiet music style.

## Voice, how-to and bot

Planned ids, not yet in `voice-script.ts`: `ww.title` “Story Weaver.”; `ww.one` “Pick who and where, then what went wrong. Then pick how it ended.”; `ww.two` “Make a story and read it to the owl. The owl can’t see the pictures.”; `ww.three` “Tell why the friend felt that way. Use because.”; one clause line per tile above; four owl questions (“Where were they?”, “What went wrong?”, “How did it end?”, “How did {Friend} feel?”) and a reread cue; `ww.thatsmine` “That’s my story!”; `ww.becausefree`/`ww.becausenudge` (the owl’s question per unsupported pair, e.g. “Hmm, the hat was found. Was {Friend} sad then?”). Use `ctx.instruct` for the goal and `ctx.say` for the rest. The how-to card gives per-level steps (`LevelLine`), the owl’s question in plain words, and a ghost-finger demonstration.

Bot (`autotouch`): level 1 taps a friend, place, problem and ending; level 2 places a friend, reads, then alternates between adding the owl’s first missing part and tapping That’s my story by seed; level 3 completes the story, picks a feeling and a supporting reason.

## Rule tests the build needs

Each offered tile set has at least two members; each problem has two tries and three endings, none contradicting it; every reachable combination composes a sentence with no gendered pronoun; `missing(story)` returns required parts in the fixed order and the owl’s question always names its first element; a complete story is never questioned; adding the asked part removes that question; declining always completes; every feeling offered has a supporting event among her events and the frame never opens without one; `supports` has a `sad` problem row and `happy`/`relieved` ending rows for every problem; the first unsupported reason is free, later ones count one miss, the glow lists only supporting tiles, hints count once; the bot completes every seed and level; level descriptions name no grade.

## Open for review before a build

Decision 1 (identity, land, Story Grove capacity); decision 5 (ordinary content review of problems, endings, feelings and every owl line: gentle problems only; “sad” is a reason to something that went wrong, never an ending, and a lost hat is the mildest loss the set contains); whether a six-year-old understands that the owl cannot see pictures; whether the owl’s question reads as a suggestion; portrait tile fit; whether levels 1–2 should step up on zero misses. Decision 2 (keeping a story) is deferred with its own bounded creation kind. Checks needing a child or device go to [DEVICE-CHECKS.md](../DEVICE-CHECKS.md) once a build exists.
