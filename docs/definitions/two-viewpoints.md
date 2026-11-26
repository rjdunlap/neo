# Story Steps, level 14: Two Viewpoints (definition)

Defined 2026-11-26 as slice **3** of the [social-emotional study](../deep-dives/subjects/social-emotional.md#build-slices-in-order), from its [Two Viewpoints / Different Feelings](../deep-dives/subjects/social-emotional.md#existing-game-follow-ups-and-priority) plan, the [commercial/tabletop follow-up](../deep-dives/subjects/social-emotional.md#sources-recognition-and-what-to-borrow) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#social-emotional-play-recommendations). Written docs-only first: no code, voice line, art or test exists yet. Lives inside the built `story-steps` game (`src/games/story-steps/`, [game page](../games/story-steps.md)) within Story Theater as **level 14** (`school` band `6–14`), preserving levels 1–13, younger bands (`toddler: 1–2`, `preschool: 2–5`, `prek: 4–8`), all saved levels and pins, `story-grove` placement and no story persistence.

**Fun action and purpose:** Bunny and Bear set out a picnic, when a wind-up picnic horn nearby starts playing lively music (one harmless surprise/mishap). She taps both friends to hear what each one says: one loves the lively beat and wants to dance, while the other finds it too loud for their ears and wants a quiet spot for their snack. She picks one of four pictured endings, taps **Watch** to see it play out on the Story Theater stage, may optionally try and compare another ending, and taps **Take a bow** once she has watched an ending that keeps **both** friends' stated wishes. The learning purpose is **comparing two explicit viewpoints of the same event and choosing a consequence that respects both**: hearing each person's own words rather than guessing from a face ([Barrett et al., 2019](../deep-dives/subjects/social-emotional.md#anchors-and-evidence-limits)), seeing why a one-sided fix leaves someone out, and noticing that more than one arrangement works (separate spots or softer distance) without forcing either friend to pretend.

## Overlap

Checked against `origin/main` at `6b8bdc6e3`.

| Game / mode | What it already owns | Why this belongs in `story-steps` level 14 |
| --- | --- | --- |
| Story Theater (`story-steps` 12–13) | Choose cast, weather and prop for one character's picnic; change one event and compare two endings | Same stage, cast (`bunny`, `bear`), `Watch` / `Undo` / `Help` / `Take a bow` controls and un-saved shows; adds a second character's differing account of one event |
| Common Ground (`common-ground` 1–2) | Place a cushion and basket on a 2×3 floor against stated spatial rules | Spatial placement puzzle vs. Story Theater's narrated story enactment and outcome comparison |
| Playdate Workshop 1–3 (defined) | Two friends' pictured craft requests, shared-material plan and operating steps | Operating tools/pages in turns vs. choosing and watching story endings for a shared picnic mishap |
| Feelings Faces (`feelings-faces`) | L–K expression matching, naming and event-to-feeling/care prompts | Here both characters state their differing preferences directly in words and pictures, with multiple accepted endings |
| Thought Bubbles (`thought-bubbles` 1–5) | Infer what a friend saw, knows or meant from pictured evidence | Inference from clues vs. directly hearing two stated accounts and enacting how the story ends |

Per the study's decision, **never register a separate Story Theater game**; extend `story-steps` (`LEVELS.school` `6–13` -> `6–14`) and reuse `theater-art.ts` and `layout.ts`.

## The model (`theater-logic.ts`)

Pure data and functions, zero Pixi dependencies. Existing level 12–13 exports (`THEATER_PLANS`, `editStory`, `canFinish`, `nextTheaterAction`, etc.) stay unchanged.

- **Seeded viewpoint roles (anti-stereotype):** each round assigns `musicFriend: 'bunny' | 'bear'` by `ctx.rng.bool()` (the other friend is `quietFriend`). Neither friend is stereotyped as always loud or always quiet-seeking; both assignments obey the exact same rules.
- **Two stated accounts:** `music` (`musicFriend` explicitly says they like the lively music and want to dance) and `quiet` (`quietFriend` explicitly says the music is too loud for their ears and wants a quiet spot for their snack). Track `heard: { music: boolean; quiet: boolean }`.
- **Four endings (`VIEWPOINTS_ENDINGS`):**

| ID | Label | What happens on stage | Keeps `music`? | Keeps `quiet`? | Verdict |
| --- | --- | --- | --- | --- | --- |
| `stay-loud` | **Stay by the horn** | Both stay right beside the horn; `musicFriend` dances while `quietFriend` covers their ears | Yes | No | `unmet-quiet` |
| `turn-off` | **Turn it off** | Put the horn away so it is silent; `quietFriend` relaxes while `musicFriend` has no music to dance to | No | Yes | `unmet-music` |
| `two-spots` | **Two spots** | `musicFriend` dances by the music blanket while `quietFriend` takes a snack to the quiet shady tree, and they wave across the meadow | Yes | Yes | `ok` |
| `soft-spot` | **Shady hill** | Both move their blanket up the shady hill where the music sounds soft and gentle enough for both | Yes | Yes | `ok` |

  Display order of the four ending cards is shuffled per seed with `ctx.rng.shuffle`.
- **Pure helpers:**
  - `evaluateViewpoints(ending)`: returns `'ok'`, `'unmet-quiet'`, or `'unmet-music'`. Exactly **2** endings return `'ok'`.
  - `canWatchViewpoints(heard, draft)`: `heard.music && heard.quiet && draft !== null`.
  - `canFinishViewpoints(heard, draft, watched)`: `canWatchViewpoints(heard, draft) && watched.includes(draft) && evaluateViewpoints(draft) === 'ok'`.
  - `watchConsequence(ending, watchedBefore)`: returns `{ verdict: evaluateViewpoints(ending), accepted: boolean, miss: boolean }`. Watching an `ok` ending or watching an unseen one-sided ending for the **first time** has `miss: false` (free exploration!). Repeating an **already-watched** one-sided ending (`!accepted && watchedBefore.includes(ending)`) returns `miss: true`.
  - `nextViewpointsAction(heard, draft, watched)`: returns the next useful control for Help and the ghost finger without overwriting a player's valid choice:
    1. `!heard.music` -> `{ kind: 'hear', role: 'music' }`
    2. `!heard.quiet` -> `{ kind: 'hear', role: 'quiet' }`
    3. `canFinishViewpoints(heard, draft, watched)` -> `{ kind: 'finish' }`
    4. `!draft || evaluateViewpoints(draft) !== 'ok'` -> `{ kind: 'choose', ending: 'two-spots' }` (if she already picked `soft-spot`, it never switches her to `two-spots`!)
    5. Otherwise -> `{ kind: 'show' }`.

## Level, bands and first round

| Level | Name (`describeLevel`) | Band window |
| --- | --- | --- |
| 1–13 | Unchanged | `toddler: 1–2`, `preschool: 2–5`, `prek: 4–8`, `school: 6–13` |
| **14** | *Story Theater: Two Viewpoints — hear two accounts and choose an ending* | **`school` only (`6–14`)** |

Saved levels 1–13 and all grown-up pins (`store.pin`) stay untouched. Two smooth rounds at level 13 (`misses <= 1 && hints === 0`) step up to level 14 via `difficulty.ts`; two struggling rounds step down.

### First round

`musicFriend` = Bunny, `quietFriend` = Bear. She taps Bunny's card ("I like this lively music! I want to dance!") and Bear's card ("It is too loud for my ears. I want a quiet spot for my snack."). Both friend cards show a heard tick. Curious, she taps **Stay by the horn** and **Watch**: Bunny dances, Bear covers his ears, and Bear's card gently outlines while the pet notes Bear still needs a quiet spot (`misses = 0`). She then taps **Two spots** and **Watch**: Bunny dances on the grass, Bear enjoys a snack under the shady tree, and they wave. **Take a bow** lights up; she may optionally try **Shady hill** to compare both accepted endings beside the stage, or tap **Take a bow** right away for one sticker.

## Screen, controls and upright layout (`layout.ts`, `theater-art.ts`, `viewpoints.ts`)

Played both upright (`768 × 1024+`) and landscape (`1024+ × 768`); `resize(v)` lays out solely from `viewpointsLayout(v)` (`view`, never `window`). Reuses Story Theater's `Critter`, `theaterSymbol` (`bunny`, `bear`, `show`, `undo`, `help`, `finish`), `tile`, `swatch`, `label`, and adds code-drawn Pixi `Graphics` for the picnic horn/notes and the four ending scenes/icons (no imported sprites or audio).

- **Friend account cards (2):** each at least `164 × 100` landscape / `180 × 106` upright, showing the friend's `Critter` portrait, a speech-bubble icon and name (`Bunny` / `Bear`). Tapping one plays its spoken account (re-tapping replays for free) and adds a green check when heard.
- **Ending cards (4):** each `148 × 106` (upright 2×2 grid) or `156 × 100` (landscape 1×4 row), with a clear picture and short label (`Stay by the horn`, `Turn it off`, `Two spots`, `Shady hill`). Tapping selects `draft` (records `previous` for Undo) and speaks the card's title.
- **Action buttons (4):** `Watch`, `Undo`, `Help`, `Take a bow` (`148 × 106` upright in the same 2×2 right-of-guide grid as `theaterLayout`; `148 × 100` landscape row).
- **Comparison thumbnails (optional):** just like level 13, up to two accepted watched shows (`two-spots` and `soft-spot`) can appear as small stage thumbnails beside the stage if she tries both, never required to finish.
- **Target & keep-out bounds (`upright.test.ts`):** on all four `UPRIGHT_VIEWS` (`phone`, `small`, `tall`, `captioned` at `768 × 1206`), every card and button is >= `100` logical units, inside the view, non-overlapping, and clear of Home/Help (`0..115 × 0..210`) and the corner guide (`0..150 × (v.h - 170)..v.h`):
  - Upright (`captioned` `768 × 1206`): title `y = 140`, stage (`0.85` scale) `y = 278`, caption `y = 404`, friend cards `y = 524` (`x = 274, 494`), ending cards `2×2` at `y = 682, 804` (`x = 274, 494`), action buttons `2×2` at `y = 956, 1074` (`x = 334, 514`).

## Accounting, help and finishing

- **Zero-miss exploration:** tapping friend cards, replaying accounts, changing ending selections, pressing `Undo`, pressing `Watch` or `Take a bow` before both friends are heard (speaks a reminder and pulses the unheard friend card), and watching **either** one-sided ending (`stay-loud`, `turn-off`) for the **first time** all cost `misses = 0` and never play `sfx.boing()`. When a one-sided ending plays, the unmet friend calmly states what they still need and their account card pulses so she can re-hear it.
- **Repeated one-sided watch:** watching the *same* one-sided ending a second time in the round counts `misses++`, plays a gentle `sfx.boing()`, and speaks the unmet friend's stated wish. On the **second miss** in the round, a supported ending card (`two-spots`) gains a persistent help glow and counts **1 hint** (`hints++`, once per auto-hint).
- **Requested Help (`Help` button):** increments `hints++`, highlights the control named by `nextViewpointsAction`, and speaks its guidance line.
- **Finish:** `Take a bow` is enabled as soon as any supported ending (`two-spots` or `soft-spot`) matching the current draft has been watched (comparison is optional). Tapping it plays `sfx.bell`, speaks the closing line, and finishes through `ctx.finish({ misses: this.misses, hints: this.hints })` for one shell sticker (including when completed with help). No story is saved; leaving via Home awards nothing.

## Speech (`voice.ts`)

Lines live in `src/games/story-steps/voice.ts` (run `node scripts/content-barrels.mjs` when built; device speech is the fallback until a `Better voice` pass, so do not run Kokoro in the build slice). Source-checked against [anchors and evidence limits](../deep-dives/subjects/social-emotional.md#anchors-and-evidence-limits): characters state their own wishes directly, neither friend is blamed or told what they "should" feel, and no personal disclosure is asked.

| Moment | Line |
| --- | --- |
| Start (`ctx.instruct`) | "Bunny and Bear set out a picnic, then unexpected music starts! Tap both friends to hear what each one says, then choose an ending." |
| Music friend account | "{friend} says: I love this lively music! It makes me want to dance." |
| Quiet friend account | "{friend} says: The music is too loud for my ears. I want a quiet spot for my snack." |
| Watch before hearing both | "Tap both friends first so we hear what each one asks for!" |
| Watch before picking ending | "Choose an ending card below, then tap the stage to watch." |
| Pick cards (`stay-loud` / `turn-off` / `two-spots` / `soft-spot`) | "Stay right by the horn." / "Turn the music off." / "Try two spots across the meadow." / "Move to the shady hill where it sounds soft." |
| Cue 0 (mishap) | "Bunny and Bear spread the picnic blanket, when a little horn begins to play lively music!" |
| Cue 1 (both viewpoints) | "{musicFriend} loves the lively beat, while {quietFriend} asks for a quiet spot." |
| End `stay-loud` (unmet quiet) | "They stay beside the horn. {musicFriend} dances, while {quietFriend} covers their ears: it is still too loud for my snack!" |
| End `turn-off` (unmet music) | "They put the horn away. {quietFriend} has a quiet snack, while {musicFriend} sighs: now there is no music to dance to!" |
| End `two-spots` (accepted) | "{musicFriend} dances by the blanket while {quietFriend} enjoys a quiet snack by the shady tree, and both friends wave!" |
| End `soft-spot` (accepted) | "They move up to the shady hill. The music sounds soft for {quietFriend} and lively enough for {musicFriend} to tap a toe!" |
| Repeated one-sided watch (`miss`) | "Remember what {unmetFriend} asked for. Let us pick an ending that works for both friends." |
| Accepted watch ready (`ctx.instruct`) | "Both friends got what they asked for! Tap the green check to take a bow, or watch the other ending to compare." |
| Help (`hear` / `choose` / `show` / `bow`) | "Tap the glowing friend to hear what they say." / "Try this glowing ending so both friends get what they asked for." / "Tap the glowing stage to watch your ending." / "Tap the glowing green check to take a bow!" |
| Bow before ready | "Hear both friends and watch an ending that keeps both wishes before taking a bow." |
| Finish | "You listened to both viewpoints! A bow for the storyteller!" |

## Rule tests (`theater-logic.test.ts` and `upright.test.ts`)

1. `VIEWPOINTS_ENDINGS` has 4 distinct endings: exactly 2 return `'ok'` (`two-spots`, `soft-spot`), `stay-loud` returns `'unmet-quiet'`, and `turn-off` returns `'unmet-music'`.
2. Role seeding across seeds covers both `musicFriend === 'bunny'` and `musicFriend === 'bear'`, always pairs the two distinct friends, and shuffles ending order without losing any ending.
3. `canWatchViewpoints` is `false` until both `heard.music` and `heard.quiet` are `true` and a `draft` is chosen; `canFinishViewpoints` is `true` only when `draft` is `'ok'` and already in `watched`.
4. `watchConsequence`: first watch of either one-sided ending gives `miss: false`; repeating an already-watched one-sided ending gives `miss: true`; both `'ok'` endings always give `miss: false`.
5. `nextViewpointsAction`: hears both friends in order, never overwrites `draft === 'soft-spot'` with `'two-spots'`, proposes `'two-spots'` when `draft` is missing or one-sided, proposes `'show'` once a supported `draft` is selected, and proposes `'finish'` once watched; stepping `nextViewpointsAction` from a fresh state finishes in at most 5 steps with 0 misses.
6. Level ranges & docs: `storySteps.levels('school')` is `{ min: 6, max: 14 }` (update existing `max: 13` assertions in `theater-logic.test.ts` and `predictions.test.ts`), younger bands (`toddler: 1–2`, `preschool: 2–5`, `prek: 4–8`) are unchanged, `describeLevel(14)` names Two Viewpoints, and `howToFor(storySteps, 14)` is scoped to level 14 (without touching 12–13's steps).
7. `upright.test.ts`: `viewpointsLayout(v)` passes `uprightProblems(v, targets) === []` and stage/caption/label clearance on all four `UPRIGHT_VIEWS`.

## Ghost finger, how-to card and build slice

- **How-to card (`howto.ts`):** add level-14-only (`from: 14, to: 14`) steps ("Tap both friends to hear what each one says, then choose an ending and tap the stage to watch.") and finish text ("Watch an ending that works for both friends, then tap the green check to take a bow. Trying a one-sided ending once is free; repeating it counts a miss, and Help highlights a working next step."). Keep `from: 12, to: 13` steps unchanged.
- **Ghost finger (`autotouch`):** follows `nextViewpointsAction` — taps the glowing/unheard friend card(s), taps a supported ending card (`two-spots`), taps **Watch**, then taps **Take a bow**. `fingerdemo` plays level 14 cleanly.
- **Files:** `src/games/story-steps/` (`theater-logic.ts`, `theater-logic.test.ts`, `viewpoints.ts` or `theater.ts`, `theater-art.ts`, `layout.ts`, `upright.test.ts`, `index.ts`, `howto.ts`, `voice.ts`, `predictions.test.ts`), `npm run game-docs` (`docs/games/story-steps.md`, `README.md`, `docs/GAMES.md`), `node scripts/content-barrels.mjs`, `docs/deep-dives/subjects/social-emotional.md`, `docs/STUDY-BACKLOG.md`, and a verification entry. No new game, land, save field or Kokoro voice pass.
- **Check tier (queued build slice):** new interaction on an existing game — `npm run typecheck`, `story-steps` unit tests (`theater-logic.test.ts`, `upright.test.ts`, `predictions.test.ts`, `logic.test.ts`) plus `howto`/`game-docs`/`voice` tests, one filtered scripted `story` play at level 14 (hearing both friends, watching one one-sided ending for 0 misses, repeating it for 1 miss, using Undo/Help, and watching a supported ending to finish), one portrait screenshot at level 14, and `fingerdemo` at level 14; `npm run build` only if shared files change.

## Open decisions

1. **First-watch miss policy.** Default: watching each unseen one-sided ending once is free exploration (`misses = 0`), and repeating a watched one-sided ending counts a miss. Alternative: count every one-sided watch as a miss after both accounts were heard.
2. **Comparison thumbnails.** Default: optional (show up to two watched supported endings beside the stage if the player chooses to compare both, matching level 13's thumbnail strip). Alternative: omit comparison thumbnails on level 14 to keep the stage cleaner upright; rule tests do not change.
3. **Additional scenario pool.** Default: one rich, role-swapped picnic-music scenario (`bunny`/`bear` swap roles by seed) so the build stays one bounded session. Later scenarios (e.g., spilled banner, Feelinks-style varied prompts) can extend the same model in a future slice.
4. **Younger placement.** Default: `school` only (`level 14`), per the study's recommendation; no pre-K opening without its own packet.
