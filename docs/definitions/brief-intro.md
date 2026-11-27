# The short reminder: brief support for a game already introduced this visit (definition D4b)

**Built:** 2026-11-27 (PR #2273): `settings.briefIntros`, `introKey`/`briefIntro`, `introMemory`, and the short form of `HowToPanel`. A later session may add mix stops and Today's six under "Open leans".

*Defined 2026-11-27 · docs only · chunk 19, [discovery action D4b](../ROADMAP.md#discovery-actions) · decided 2026-10-23 ([record](../archive/DECISIONS-2026-10-23.md#decisions), [alternatives](../DISCOVERY.md#introductions-reduce-duplication-without-losing-support)).* This packet says what a D4b build session does. The direction is settled: **an exact mode and input already introduced this session may use brief, replayable support; a new or changed mode still gets its full introduction.** This packet fixes the details. It follows D3 (built) and is independent of the short result ([D4a](brief-result.md)) and of automatic handoff (D6).

## Why

Every game opens on its full how-to card each time, with a demonstration and the level's goal, steps and finish (`shouldExplain` in `src/content/howto.ts`). That is right the first time. A grown-up who plays one level of a game three times in a visit (Next game, then back to it, or Explore and the same land) sees the same card each time and presses Play. The option is for them. It saves a press and a demonstration; it removes no information.

## What the option is

A per-profile **Short reminders** switch on the grown-ups' page, beside the how-to cards switch. It is a `SaveData.settings` boolean (`briefIntros`), **default off**, bounded and repaired on load like `howToCards` (a non-boolean repairs to `false`), with a `save.test.ts` case for the default, repair, backup/restore and profile isolation. It is a grown-up setting, never inferred from play count, speed or a child's behaviour, and never written by a card. Wording names what it does ("a shorter reminder for a game she has just seen"). With **How-to cards off** nothing opens a card and this switch does nothing.

`shouldExplain` and `again` are **not changed**: `again` keeps its one meaning (the same game straight after its own result), and no other route passes it to hide a card.

## What counts as introduced

An in-memory **introduction memory**, `introMemory`, beside `discoveryMemory` and `mixMemory` in `src/app/discovery.ts`.

- **Key:** `id|band|level|input`: the game's stable ID, the band the round plays at (`playBand`), the level on the card when Play is pressed (after any held-arrow steps), and the input in use, `touch` or `mouse` from `pointerKind()`. The controller route has no brief card (below), so it has no key.
- **Written** only when the player presses **Play on a full card** (including a full card reached through Show me). A card that is opened, spoken, stepped or left with Back writes nothing. **A completed round alone never establishes familiarity:** a round started with cards off, by Again, by a story or by a mix is not an introduction, and finishing a round, any number of times, does not write a key.
- **Lasts** for the visit: it is forgotten on reload, on a profile switch or removal (`playerChanged`), and whenever the save is replaced (reset, restore, undo), using the same owner and epoch token as `DiscoveryMemory`, so a stale scene cannot read or write another person's marks.
- **Bounded:** at most 64 keys, the oldest dropped first. It stores no counts, times or scores, and is never saved or shown.
- **Not mastery.** The key says "this card was pressed Play on in this visit". It is UI support state, never read by difficulty, history, stickers or the grown-ups' page.

## When the short card shows

The scene opens the intro as today (`GameScene` constructor, before `openIntro`). It shows the **short reminder** instead of the full card only when all of these hold; otherwise the full card opens exactly as now:

1. `settings.howToCards` and `settings.briefIntros` are both on, and `shouldExplain` is true (so not a story and not `again`).
2. The scene is not in a Little surprises mix and not a Today's six round. Those routes keep the full stop card (D3's row of stops, Skip) in this pilot; each is reviewed on its own later.
3. The input is `touch` or `mouse` (the island's controller route keeps the full card, the D2a touch-only rule).
4. `introMemory` has the key for this game, band, **resolved level** and input. The level is the one the round would build at, after the pin and `store.levelFor`.

**Changed mode, full card.** A different level (an adaptive step, a new pin, a held arrow), a different band (a birthday or a pin to another band) or a different input (a mouse after a finger, or a finger after a mouse) has no key, so it gets the **full card**, with its demonstration. That is the changed-mode explanation: the existing level-specific card already says what this level asks and does, so no new line, badge or voice clip is added. If the input changes while a short reminder is open (the pointer kind flips), the scene swaps it for the full card in place.

## The short reminder

It is the ordinary intro card in a smaller form, in the same `HowToPanel` (one card class, not a second one):

- The game's picture and title, with the picture's tap speaking the title line again (the D3 replay).
- The level's **goal line** only (the first line of the card), in the same text size, so a reader with the sound off still has what to do.
- **Play** (green, existing size and place) and **Back** (existing), both at least 100 units.
- **Show me** (a round blue "?" button, 100 units, beside Play): opens the full card in place. That is the replay. It calls the same `card.show` path the held arrows use, so the full card, its level arrows and its demonstration for the current input appear, and Play there writes the key again, harmlessly.
- **No demonstration plays by itself, no level arrows and no ladder.** Stepping a level is a full-card control: Show me gives it.
- Opening speech: the title line, as on the full card. Nothing else is spoken, and no new voice line is needed.

The in-round `?` button and the pet's repeat of the instruction are unchanged. A round started from the short reminder is the same round, built at the same level, with the same accounting.

## What it does not do

- It does not hide a card the person has not seen this visit, or a different level, band or input of the same game.
- It does not change `again`, `shouldExplain`, the how-to card's contents, the demo, the arrows, Play, Back, difficulty, hints, stickers, history or save data beyond the one setting.
- It does not apply to a mix stop card or a Today's six round, to stories, or to couch play (`CouchScene` has its own flow and save).
- It adds no timer, countdown, streak, praise or reward for using it, and nothing that advances without a press.

## What the build changes

- `src/progress/save.ts`: `settings.briefIntros`; `src/parent/panel.ts`: one labelled checkbox beside the cards switch.
- `src/content/howto.ts`: a pure `introKey({ id, band, level, input })` and `briefIntro({ cards, brief, explained, mix, daily, input, introduced })` returning a boolean, with a table test for each rule above (switch off, cards off, story, `again`, mix, daily, controller, no key, changed level, changed band, changed input).
- `src/app/discovery.ts`: `introMemory` (token-checked, bounded, cleared by `playerChanged`), with tests for the bound and the stale-token case.
- `GameScene`: choose the short or full card once in the constructor; write the key from `playFromIntro` only when the open card is the full one; swap to the full card on Show me and on an input flip.
- `src/ui/howto-card.ts`: a short form of `HowToPanel` (goal line, Play, Back, Show me), laid out at every band's design area in portrait and landscape.

## Tests and checks (the D4b build tier)

Shell tier with the intro flow.

- **Unit:** the eligibility table above; `introKey` agrees with the level the round builds at after a pin and a held arrow; memory bound, owner and epoch; save default, repair and profile isolation.
- **One filtered browser play** (`BROWSER_SUITE=discovery` or the nearest intro suite): with both switches on, open a game, press Play on the full card, finish or leave, open the same game again and see the short reminder; step the level or change the pin and see the full card; press Show me and see the full card with its demonstration; with the switch off, every opening is the full card. A portrait phone screenshot of the short reminder.
- `npm run build` only if shared files or assets change; `world` only if navigation changes (it should not).
- **Not claimed:** how it feels to a child. That is [parked](../DEVICE-CHECKS.md); the pilot's value is a grown-up's own comparison on a phone.

## Open leans

- Whether Little surprises stop cards and Today's six should use the short reminder is deferred; each keeps its row of stops, so it needs its own layout check.
- Whether the short reminder should also appear for the same game at a different level of the same band is **no** in this pilot: a new level is a new mode.
