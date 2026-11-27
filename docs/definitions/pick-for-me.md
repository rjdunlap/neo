# Pick for me: a scoped pick and a finite shuffle (definition D7)

*Defined 2026-11-27 · docs only · chunk 19, [discovery action D7](../ROADMAP.md#discovery-actions) · from the [discovery study](../DISCOVERY.md#different-people-different-preferences).* This packet says what the two D7 build sessions do. It builds on what exists: D1b's pictured Next game and Another, D3's preview card, D2b's mix planner and D5a's lineup table. It adds one pure selection module and one entry; it adds no game, level, how-to card, reward or save field.

**Fun action:** a grown-up or a reader taps one picture, chooses what to pick from (hearts, played lately, a land, a kind of challenge) and gets one game shown on its card. Another shows a different one. Play starts it at her own level.

**Purpose:** a way into the catalog that needs no scrolling or reading and asks for no decision about difficulty. Each game keeps its own learning purpose, card, accounting and sticker. The pick teaches nothing and records nothing.

**Rework fit:** a navigation slice in the current home spots; it creates no collection, unlock, currency, streak or obligation, so it does not conflict with RW05–RW12. RW08 moves the entry with the home spot.

**Built (D7a, 2026-11-27, [PR #2285](https://github.com/rjdunlap/neo/pull/2285)).** As built, three things differ from the sketch below. The entry is a round Pick button beside the book on both home-spot layouts (not a pictured spot on the path or a shelf card, which would have changed the path and card counts those layouts' tests rely on). The pick card on the sheet shows the game's picture and name with Play, Another and Back; it does not show this level's goal, because reading the level would create a stats entry, so the game's own how-to card after Play is the introduction, exactly as for D1b's tile. `pickMemory` holds the chosen scope and the last game opened from a pick, not the shuffled order: Pick builds a new order each time the sheet opens a pick. Scope names are on the chips as text, with no spoken line per scope. D7b is unchanged.

## What is chosen from: the four scopes

A **scope** is a named pool of game IDs, computed fresh each time from data that already exists. Every scope is then filtered by the one **eligibility rule**: the game is registered, touch-playable, supports her band and plays at it (`mixPlayable(mod, band)`), and it is not a story or couch route. Nothing is ever picked that this rule rejects, and no scope falls back to another scope.

| Scope | Pool | Notes |
| --- | --- | --- |
| **Hearts** | `store.data.favorites`, oldest first | The hearts shelf's own list, not the five-slot shelf (`shelfFor`): all up to `FAVORITES_MAX`. A game hearted at another band is dropped by the rule, not by the scope. |
| **Played lately** | the six games whose most recent `history[].at` is latest, newest first | Completed rounds only (`GameStats.history`). Opening a card, previewing or leaving never counts. "Recent" means the last completed rounds the save keeps (`HISTORY_LENGTH`), nothing else, until a separate record is designed. |
| **A land** | `LANDS[i].games` that `visibleIn` shows at her band | One chip per land she can see, in `LANDS` order. A land's own pager is unchanged. |
| **A kind** | games whose `challenge` is that `ChallengeKind` | Numbers, words, logic, space, music, noticing, hands. The registry test already requires every touch game to name one, so this is the reviewed action category. |

**Empty is not drawn.** A scope chip is shown only when its eligible pool has at least one game, so there is no empty state, no "nothing here" line and no silent substitution. With no hearts and no completed rounds, a new profile sees only land and kind chips. A pool of exactly one game shows the card without Another.

**A default exists.** Opening the chooser selects **Everything for me**: the union of all land pools, the same eligible games she sees on her pages. It is a chip like the others, so there is always at least one scope.

## One pick and Another

1. **Opening.** The chooser holds the scope (`Everything for me` at first). Pressing One pick builds one **shuffled order** of the scope's pool from the session's seeded RNG and shows the first game.
2. **The card.** The pick opens D3's preview card as it does for D1b's tile: the game's picture, name, this level's goal, actions and finish, demonstration, spoken replay, **Play** and **Back**. Looking, replaying or Back saves nothing and changes no progress. Level and band resolve at Play, never in the preview: `playBand`, the module's ordered range, then `store.levelFor` with any pin ([D1b](../DISCOVERY.md#d1b-build-packet-one-direct-next-game)).
3. **Another** steps to the next game in the same shuffled order. It never repeats a game until every game in the scope has been shown once (**without replacement**). The game she just launched or finished is not first in a new order when the pool has two or more games.
4. **The end of an order.** After the last game, Another shows the line `pick.all` ("That was all of them") once and offers **Again from the start** with a fresh shuffle, which never opens on the game last shown. There is no automatic refill and no endless feed: a new order is her tap.
5. **Preference-neutral.** The order is uniform within the scope. It does not favour unplayed games, old games, high or low levels or anything the history suggests: choosing the scope is the choice. (D1b's unplayed-first suggestion is a different, frozen rule and is untouched.)
6. **Nothing is inferred.** Neither the pick nor its refusal is written anywhere: no count, no "skipped" mark, no neglected-game list, no mastery claim. Passing over a game never changes how often it is offered.

**Memory.** The held scope and shuffled order live in `pickMemory` beside `discoveryMemory` and `mixMemory` in `src/app/discovery.ts`, with the same owner and epoch token: a profile switch, reset, restore or undo drops them, a reload loses them, and a stale scene cannot read another person's. Nothing is saved ([saved scopes are D8/D9](../ROADMAP.md#discovery-actions)).

## The shuffle (second slice)

A **Shuffle** button on the chooser builds a finite lineup from the chosen scope, for the lap and toddler mix only (`MIX_BANDS`; widening the mix is a separate decision this definition does not make).

- **Size:** `min(3, pool)` stops, the same length as Little surprises; the grown-up can edit it up to `MIX_MAX` on the table.
- **Without replacement, in scope.** The stops are the first of the same seeded order, so no game repeats unless she chooses it. A pool of one or two gives a one- or two-stop lineup. An **intentional** repeat exists only through D5a's table, where a grown-up adds the same game twice.
- **Previewable.** Shuffle fills the held D5a lineup (`mixMemory.hold`) and opens the mix table, so the lineup is shown, reordered or edited before any play. Play on the table runs the existing mix (`startMix(ids)`) with D2b's stops, cards, results, Skip and ending. Nothing starts until Play.
- **Finite.** The mix ends after its last stop and does not refill. Shuffling again is a tap.
- **Rewards and accounting** are each game's own, exactly as in any mix. The shuffle adds no bonus sticker and no new result.

## Screens and controls

Logical units in the usable `view`, 1024-wide design area centered; every target at least 100 units after scaling, nothing shrinks to fit; one layout test checks every chip count in four views.

- **Entry:** one pictured **Pick spot** (a hand pointing at a card fan, no text needed) next to the mix spot on lap and toddler home spots, and on the first page of the home shelf at older bands, where the subject layout already holds its home items. It opens the chooser sheet.
- **Chooser sheet:** a row of scope pictures (heart, a game thumbnail for played lately, a land's own icon, a kind's icon), **One pick** and, at lap and toddler, **Shuffle**. The selected scope is outlined; text labels are a supplement. When the chips do not fit one row they page (`landLayout` returns null rather than shrink a chip).
- **A held press** is not required: nothing here changes anything that matters, so a tap opens it.
- **Controller and keyboard:** the island's controller route keeps its current semantics and does not reach the chooser in this pilot; mouse and touch only, like D2a.
- **Return:** Back and any end of a pick return to the launching home layout and page. A launched round's result keeps D1b's Next game tile unchanged; the pick adds no tile of its own.

## Spoken support

New lines in `voice-script.ts` and `voice.ts`: `pick.offer` ("Pick one for me?"), `pick.scope.*` (one short name per scope kind, and the land or kind's own existing name), `pick.all` and `pick.another`. Device speech is the fallback; no clip is required to render the build. Navigation never requires reading.

## Open leans

1. **Played lately has six games.** The count is a constant; widening is a one-line change. Lean: six, a screenful on a phone.
2. **Everything for me includes the D1b pool.** No special case.
3. **Entry beside the mix spot, not inside the grown-ups' page.** Lean: it is a child's own tool; no gate.
4. **Shuffle at older bands** waits for the mix itself to widen. Lean: not now.

## What it deliberately does not do

- No weighting, rotation, daily schedule, streak or notification; no "you haven't played" prompt.
- No automatic refill, auto-advance or countdown (that is D6, separately opt-in).
- No saved scope or lineup (D5b, D8, D9) and no change to favorites limits or the shelf.
- No substitute for an ineligible game and no mastery or preference inference.

## Tests and checks (build tiers)

- **Slice 1 (One pick, shell and navigation tier):** `src/content/pick.ts` is pure: scope pools, the eligibility filter, the shuffled order, Another and the end-of-order restart. Unit tests state the properties above: each scope respects band, input and the eligibility rule; no repeat before the order is exhausted; a new order never opens on the last shown game when there are two or more; an empty pool draws no chip; a one-game pool has no Another; the order is a pure function of the seed; no function writes to the save. Layout test for the sheet. Typecheck, unit tests, build, one filtered `discovery` browser play (open, change scope, Another, Play, result, return), `world` for the navigation change and a portrait phone screenshot. Offline only if navigation assets changed.
- **Slice 2 (Shuffle, same tier):** tests that the lineup is the order's first `min(3, pool)`, is held and shown on the table before Play, and that Play runs `startMix`; one filtered mix flow.
- **Not claimed:** how it feels to a child ([parked](../DEVICE-CHECKS.md)); the check is a grown-up's own phone playtest.

## Couplings

- **D9** (favorites, recent games and the family library) will reuse the same Hearts and Played-lately pools for its shelf: the pools live in `src/content/pick.ts` and D9 imports them rather than redefining them.
- **D6** (Keep moving) may later consume a shuffled lineup; it needs only the finite lineup D2b already plays.
- **D8** (a profile's starting view) may later save a preferred scope; D7 reads no setting.
