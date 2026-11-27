# The short result: an optional brief round acknowledgment (definition D4a)

*Defined 2026-11-27 · docs only · chunk 19, [discovery action D4a](../ROADMAP.md#discovery-actions) · decided 2026-10-23 ([record](../archive/DECISIONS-2026-10-23.md#decisions), [round boundary](../DISCOVERY.md#a-round-boundary-that-keeps-the-groove)).* This packet says what a D4a build session does. The direction is settled: **a brief result is an option; the full celebration stays; the sticker is awarded every round; Heart and Keep stay one tap away; new evidence or a first discovery still gets the full result.** This packet only fixes the details, for one toy and one puzzle. It is independent of introduction shortcuts ([D4b](../ROADMAP.md#discovery-actions)) and of automatic handoff (D6).

## Why, and what the full result costs today

`GameScene.celebrate` (after `finishRound` has saved the round and the sticker, and flushed) runs a fixed sequence before any button can be pressed: the veil fades in (0.3 s), confetti and the cheer play with a 0.5 s beat, a 0.6 s beat, the sticker pops (0.5 s) and the sticker line plays for 1.8 s, then the buttons grow in (0.45 s). The first button can be pressed about **4.2 seconds** after the last action, and about 1.8 s later for each extra card (a journal find, a grown blossom). That suits a first or rare round. It is a long wait for a toy she plays ten times in a row, and for a grown-up deciding to stop: the way out is the one thing not available during the celebration. Nothing there is wrong; the option is for a person who has seen it.

## What the option is

A per-profile **Short results** switch on the grown-ups' page, beside the how-to cards switch. It is a `SaveData.settings` boolean (`briefResults`), **default off**, bounded and repaired on load like `howToCards` (a non-boolean repairs to `false`), with a `save.test.ts` case for the default, repair and profile isolation. It is a grown-up setting, never inferred from play count, speed or a child's behaviour, and never written by the result itself. Wording names what it does ("a shorter round result"), nothing about attention or patience.

**It changes the presentation of a settled round, never the round's accounting.** Rewards, difficulty steps, history, `store.discover`, Heart and Keep behave exactly as in the full result.

## Pilot scope

| Pilot | Game | Why |
| --- | --- | --- |
| Toy | `bubble-pop` (Bubble Beach; lap to school; challenge `hands`) | The most repeated cause-and-effect toy: no creation to keep, no discoveries, every band. |
| Puzzle | `jar-sort` (preschool to school; challenge `space`) | A rule-based puzzle with a real finish and no creation to keep. |

The pilot list is a small named set in `src/content/` (for example `BRIEF_RESULT_GAMES`), not a field on `GameModule`; adding a game later is one line and a check, never a change to the game's code. A registry-style test asserts every id exists and has no `made` creation.

**Eligibility, checked at the moment the result starts.** A round gets the short result only when all of these hold; otherwise it gets the full celebration, unchanged:

1. `settings.briefResults` is on for the playing profile (a guest never has it on).
2. The game is in the pilot set.
3. The round has no `made` creation to keep, no new journal `discovered` entries and no grown blossom (`grewForm`): **new evidence or a first discovery always gets the full result**, and a Keep offer never changes shape in this pilot.
4. It is not a story round, a mix stop, a Today's six round or a collection-book round (`origin` of `book`). Those results carry other tiles (next stop, next of six, book path) that their own definitions place; they keep the full result until each is reviewed separately.
5. It is **not the first completed round of that game for this profile** (`store.data.games[id].history` is empty before this round). A first result is always the full one.

Rule 3 means the first pilot has no Keep or discovery in its short layout. The layout keeps the **Keep slot** (below) so a later slice can add a Keep-bearing game without redefining it.

## The short result, in order

1. **Settle first, as today.** `recordRound`, `addSticker`, the mix settlement and `store.flush()` all run before the first frame of the result, exactly as in the full result. Nothing about the short result waits for, or depends on, an animation.
2. **A lighter veil.** The same cream veil (and place backdrop where there is one) fades in over 0.2 s. It still blocks the round underneath.
3. **The sticker, at once.** The earned sticker pops in the same place at the same size, with the same sparkle, within 0.15 s of the veil. The pet does its one species' cheer and a **smaller confetti burst** (about a third of the count, one cannon). The big cheer line is replaced by one short spoken line (the existing `sticker` line, not `praise` plus `sticker`). Total spoken result: one line.
4. **Buttons arrive early and never wait for the animation.** The buttons (Again, Next level when offered, Heart, Home and the way-out house, plus the D1b Next game tile and Another when offered) start growing in 0.4 s after the veil begins and can be pressed 0.45 s after that, about **1 second** after the last action instead of 4.2. The sticker pop, confetti and the pet's hop keep animating **underneath and around** the buttons and **never intercept a press** (the particle layer and sticker are `eventMode: 'none'` for the short result). Press priority never favours the animation.
5. **The existing arming rules stay.** The 0.45 s arrival wait protects a finger already held where a button lands; `resultReady`, `liveResult`, `navigating` and the controller's 0.35 s `offeredFor` guard are unchanged. Nothing is shortened below them.
6. **Sound-off reads.** The sticker and its pop are the acknowledgment with the sound off; the pet's cheer pose and the confetti are visual. The buttons carry the same names at the root (`RESULT_NAMES`) as in the full result. No result information is spoken only.
7. **Stopping is immediate.** Home (and the house where the origin gives one) works from the moment the buttons can be pressed, and Esc and a pad's Start go through `App.escape()` as always. A press during the pop is ignored only by the arming guard; there is no wait to "finish" the celebration, no timer that dismisses the result and nothing that advances it. The result waits indefinitely, as today.

The full celebration is **not removed or sped up for anyone who has the switch off**, and its timings are untouched.

## Heart, Keep and the rest of the result

- **Heart** keeps its place, size and behaviour. It is on screen as soon as the buttons are, and one tap toggles it, with its short sparkle. (A guest still sees Add me in its place.)
- **Keep slot.** The Keep button's rectangle is reserved in the short layout, shown only when a round has a `made` creation, and it is never required: no confirmation after it, no auto-save, and a pending creation stays available until the player deliberately navigates away, as in the full result. In the pilot rule 3 sends such rounds to the full result, so this is a contract for a later slice, not code to build now beyond the layout reservation if it costs nothing.
- **New evidence.** Any round that files a journal entry or grows a blossom gets the full result with its card, as above. Evidence is never shown in the short layout in this pilot, so nothing is shortened out of sight.
- **Again, Next level, Next game, Another, Home** keep their pictures, order, speech names and accounting (`navigateResult` once, one settlement token). Again and Next level still mean what they mean now.
- **The discovery tile and mix controls** (D1b) show on the same `resultReady` schedule, which is now earlier. Their eligibility rules, memory and spoken offers are unchanged, except that the spoken offer waits for the one short line to finish rather than the longer sequence.

## Spoken support

`voice.ts` adds nothing. The short result reuses `sticker` and the existing result lines (`again`, `keep.offer` is not used in the pilot), so no new clip or `voice-script.ts` entry is needed. The `again` offer line (the question) plays after the sticker line as it does now; a press interrupts speech with `voice.stop()` through `navigateResult`, as today.

## What the build changes

- `src/progress/save.ts`: `settings.briefResults` with its default and repair; `save.test.ts` cases (default false, repair of a non-boolean, survives backup/restore, per profile).
- `src/parent/panel.ts`: one labelled checkbox, plain HTML, in the existing settings group, saved with the rest. No new section.
- `src/content/brief-result.ts` (new, pure): the pilot id set and `briefResult({ settings, id, history, made, discovered, grewForm, story, mix, daily, book })` returning a boolean, with a test table for each of the five eligibility rules.
- `GameScene.celebrate`: branches once at the top on that boolean. The short path reuses the same objects (veil, backdrop, star, sticker, buttons, `layoutResult`); only the timing, the confetti count, the single spoken line and `eventMode` on the decoration differ. No duplicated button construction: extract the button build (`again`, `next`, `heart`, `keep`, way out) into one method used by both paths, since both must stay identical.
- No change to the games, `finishRound`, the store, difficulty, stickers or the discovery and mix modules.

## Tests and checks (the D4a build tier)

Shell tier with the affected flows, as the ROADMAP row says.

- **Unit:** `brief-result.test.ts` (eligibility table: switch off, guest, non-pilot game, `made`, discovered, `grewForm`, story, mix, daily, book, first round of the game); save defaults and repair; an assertion that the pilot ids exist in `GAMES` and are touch games with no `made`.
- **Event sequence (a pure helper or fake clock):** with the switch on, the first press is accepted at about 1 s after the veil and not before the 0.45 s arrival; with it off, the full 4.2 s sequence is unchanged; the settlement ran before the first result frame in both; a press during the sticker pop reaches the button, not the decoration.
- **One filtered browser play:** `bubble-pop` and `jar-sort` each with the switch on (second round, so the first-round rule is cleared) and one with it off; confirm the round saved and the sticker awarded before the buttons, Home works at once, Heart toggles, and Again plays the same level. Then `BROWSER_SUITE=world` filtered if navigation changed (it should not), a portrait phone screenshot of the short result and `npm run build`. Offline only if persistence changed beyond the one setting field (it is part of the save, so run the save unit tests; the offline suite only if the save shape check fails).
- **Not claimed:** how it feels to a child. That is [parked](../DEVICE-CHECKS.md); the pilot's value is a grown-up's own comparison on a phone.

## What it deliberately does not do

- No introduction shortcut: the how-to card, `shouldExplain` and `again` are untouched (that is D4b).
- No automatic advance, countdown or timer, ever (that is D6, separately opt-in).
- No change to when a sticker is awarded: one per completed round, with help, in both results.
- No new reward, streak, score or praise tied to using the option.
- No rule inferred from a child's play: the switch is set by a grown-up.

## Couplings

- [Combined preview (D3)](combined-preview.md) and [Little surprises (D2a)](little-surprises.md) own the mix's stop card and result; the short result does not apply to mix stops until a later slice reviews their tiles.
- [D4b](../ROADMAP.md#discovery-actions) may later reuse `briefResults` as a sibling setting; it does not depend on this.
- A later widening (more games, mix stops, the Keep-bearing games) is one new READY line each, after the pilot's playtest note.

## Open decisions

None needed to start the build. The leans: a per-profile switch default off; the two pilot games above; first-round and evidence rounds always full. A change to any of those is a note in the build PR, not a blocker.
