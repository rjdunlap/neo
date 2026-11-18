# Additional languages: stage 1, the pet says the word

**WL1 definition refined 2026-10-25; docs only, nothing implemented.** This replaces the language-neutral 2026-10-15 proposal in place. [World-languages study](../deep-dives/subjects/world-languages.md#build-slices-in-order), [roadmap](../ROADMAP.md#additional-languages). European Portuguese comes first: English naming line, then one reviewed word, per profile, device speech (developer decisions 2026-10-23). **Review (the developer, 2026-11-17): there is no family reviewer, and the assistant reviews every Portuguese line** by the [assistant review](#assistant-review-of-the-portuguese-2026-11-17) below. WL1 supplies English semantic labels only. WL2 is admitted on that basis and queued in [READY](../READY.md); its building session writes and reviews the word table before anything else.

## Purpose and limits

Fun action stays uncovering a friend, feeding it or popping a bubble. A familiar referent gains a second-language name, with no quiz or second-language wrong answer. English already identifies the answer: successful play is exposure, never evidence of independent Portuguese comprehension. Host completion, supported completion, misses, hints, adaptation, pins, RNG, stickers, discoveries and saved creations stay unchanged. Navigation requires no reading. No new game, language proficiency level or access gate.

Use a small typed word table, not a translated sentence script. Proposed `WordKey` entries belong in `src/content/words/pt-PT.ts` when WL2 is admitted; English host sentences remain in `src/content/voice-script.ts`. Proposed `ctx.sayWord(key)` is a scene-owned optional speech tail tied to the particular English event; it must not be an unguarded `say().then(...)` chain. Articles/forms belong in the reviewed spoken entry when appropriate, even if an entry contains more than one orthographic word. “One word” below means one vocabulary entry per event. No Portuguese spelling or translation is supplied here.

## Current first hosts and events

Audited source: each host's `index.ts` and `logic.ts`, `src/art/palette.ts`, `src/audio/voice.ts` and `src/app/scenes/GameScene.ts` at base `9cdf7e49`. These are existing saved IDs/ranges; this definition changes none. Band membership is not language proficiency.

| Host | Current supported bands and level order | Eligible English event and proposed appended key |
| --- | --- | --- |
| `peekaboo-barn` | `lap` order `[16, 1, 2]` (bounds 1–16); `toddler` 1–5; `preschool` 4–8; `prek` 6–8 | `peek.found` after a free reveal, `peek.feel` after a feeling reveal, and `peek.yes` after a correct find/remember reveal: `animal.<revealed animal>`. Include a One door self-reveal when it emits that naming event. Feelings and covers are not translated |
| `animal-snack` | `lap` 1–2; `toddler` 2–4; `preschool` 3–5 | Only successful `snack.yum` naming events in munch/float/who/match; choose one key by the arbitration below. Count mode level 5 uses count/full feedback, with no appended numeral or food here |
| `bubble-pop` | `lap` order `[15, 1, 2, 3]` (bounds 1–15); `toddler` 1–6; `preschool` 4–9; `prek` 6–12; `school` 10–14 | `bubble.friend` at a released friend's first naming in free modes 15/1–3: `animal.<friend>`. `bubble.color` initial instruction in color modes 4–6: `color.<target>`. All six palette colors are possible, even at level 4. Count/bonds modes 7–14 append nothing |

No tail on titles, how-to/demo speech, ambient animal sounds, `peek.notit`, wrong snacks (`snack.notme`/`snack.nothanks`), nudge/hint lines, count feedback, praise or celebration. Feeling reveals name the animal only; no emotion vocabulary. Pet instruction replay remains the normal English instruction and does not create another word event, including replay of `bubble.color`. No new translated text is drawn. Peek taps on an already open animal do not emit a new naming sentence and gain no tail.

### Exact pilot vocabulary

The pilot has **20 semantic keys**, not a generic 60–80-word language catalog or all of `CRITTERS`. The first seven are shared by all three hosts, from Peek's `ANIMALS`, Bubble's `FRIENDS` and Snack's `FAVORITE`. No carrots, shapes, numerals, feelings or cover words are in this inventory.

| Key | English semantic label / pictured referent | Event coverage |
| --- | --- | --- |
| `animal.cow` | cow | Peek/Bubble naming; Snack animal-selected event |
| `animal.duck` | duck | Peek/Bubble naming; Snack animal-selected event |
| `animal.pig` | pig | Peek/Bubble naming; Snack animal-selected event |
| `animal.cat` | cat | Peek/Bubble naming; Snack animal-selected event |
| `animal.dog` | dog | Peek/Bubble naming; Snack animal-selected event |
| `animal.bunny` | bunny | Peek/Bubble naming; Snack animal-selected event |
| `animal.bear` | bear | Peek/Bubble naming; Snack animal-selected event |
| `food.hay` | hay; cow's pictured snack | Snack food-selected event |
| `food.grass` | grass; bunny's pictured snack | Snack food-selected event |
| `food.bone` | bone; dog's pictured snack (English `FOOD_WORDS` says bones) | Snack food-selected event |
| `food.fish` | fish; cat's pictured snack | Snack food-selected event |
| `food.seeds` | seeds; duck's pictured snack | Snack food-selected event |
| `food.apple` | apple; pig's pictured snack (English `FOOD_WORDS` says apples) | Snack food-selected event |
| `food.honey` | honey; bear's pictured snack | Snack food-selected event |
| `color.red` | red | Bubble target instruction |
| `color.orange` | orange | Bubble target instruction |
| `color.yellow` | yellow | Bubble target instruction |
| `color.green` | green | Bubble target instruction |
| `color.blue` | blue | Bubble target instruction |
| `color.purple` | purple | Bubble target instruction |

The [assistant review](#assistant-review-of-the-portuguese-2026-11-17) must settle article, grammatical gender and number, mass nouns versus pictured units, bunny/rabbit naming and acceptable alternatives in the actual context. English labels are identifiers, not translation instructions or accepted Portuguese forms. Never assemble a phrase by concatenating unchecked fragments. The complete pilot cannot ship with a missing/unreviewed entry, though runtime still handles an absent key safely.

### Animal Snack: choose exactly one entry

Selection is deterministic from the existing mode and successful input, with no extra RNG, alternation schedule or saved counter:

| Mode / successful event | Selected entry | Reason |
| --- | --- | --- |
| Level 1 `munch`, tap an animal and it eats | `animal.<tapped friend>` | The child selected the animal |
| Level 2 `float`, tap a food and it floats to its eater | `food.<tapped snack>` | The child selected the food |
| Level 3 `who`, correct animal answer, whether food or sound question | `animal.<correct friend>` | The answer selected an animal |
| Level 4 `match`, correct food drag | `food.<delivered snack>` | The child delivered the food |
| Level 5 `count` | None | No `snack.yum` hook; numbers are outside this pilot |

At most one entry follows `snack.yum`: never both animal and food. If that selected key was already consumed this round, is missing or cannot speak, append nothing; do not substitute the other key. Wrong deliveries and busy-touch wiggles/pokes create no candidate. Existing support may complete a valid feed and remains eligible; its word is not evidence of independent language knowledge.

## Per-round repeat, priority and cancellation

A round is one host `create(ctx)` through `ctx.finish`/destruction, **not** each reveal, snack question or bubble target. Keep the consumed-key set and pending-event tokens in that scene only; a new round starts empty. No exposure history is saved. Bubble's existing `named` set remains intact.

1. On an eligible event, reserve its selected key synchronously before awaiting English, preventing rapid duplicate callbacks from queuing it twice. Off, muted, absent-key or unavailable-voice events are silent skips, with no deferred replay if availability changes. A reserved or cancelled key is consumed for this round; cancellation does not create a retry drill. A new round may name it again.
2. Only natural completion of that event's English line can start its tail. Current voice promises can settle after error/watchdog/cancellation, so promise resolution alone is insufficient: WL2 needs a completion outcome plus live scene/round, profile/setting and latest-speech token checks. A cancelled, failed or timed-out English event never launches a delayed tail. Preserve the existing English promise/pacing behavior for gameplay.
3. English instructions, feedback, navigation and pet replay take priority. Any newer English speech invalidates an older pending tail and interrupts its active utterance; tails never interrupt newer English or one another. Keep at most one pending tail, with no backlog. Rapid actions may omit optional words. Do not extend `busy`, delay question progression/finish or disable input while a tail speaks; leave the host's existing English waits unchanged.
4. Round finish/celebration, Home/Back/Esc, scene destruction, profile change, language toggle, speech mute and voice removal invalidate pending work and stop its active tail. Use scene-owned cleanup, not unmanaged timers. A destroyed scene's context promises still never resolve. Late utterance end/error/watchdog callbacks must not start speech, touch objects, change accounting or affect the next profile/scene.
5. Tail end/error/watchdog clears its own bounded resources once; speech failure never blocks host completion. No automatic retry. Resize does not reset the consumed set. Instruction replay is English only and is not a new round. Grown-up sample playback is optional future UI work, not a requirement or another replay path authorized here.

## Profile setting and development cutover

Proposed active-profile `SaveData.settings.language2` is exactly `'none' | 'pt-PT'`, default `'none'`. Missing, null, object, unknown, `pt`, `pt-BR` or any other value repairs to `'none'`; no prefix coercion or locale inference. Keep current-format bounds/default/repair tests, writes and failure handling. A parent's plain-HTML select in `src/parent/panel.ts` uses English labels “None” / “European Portuguese”; no device-wide preference, profile-index field or band-dependent enablement. Language changes invalidate speech before applying to the active profile. Test two isolated profiles with different settings, profile switching and independent backup/restore.

The setting persists as chosen even when that device has no European Portuguese voice; show accurate English status separately, do not silently rewrite the setting. Availability is device state, not backup data. Current-format backups round-trip the bounded setting; malformed restore data gets the same repair. Pins, rounds and ownership remain independent.

Under the development-save exception, WL2 may reject/reset incompatible development formats rather than migrate them. At cutover, document the accepted format/version and rejection message, offer the existing reset/start-fresh route for **only the selected profile**, and reseed a fresh current-format save with `language2: 'none'`. A compatible save missing only this field gets the default; an unsupported backup is rejected with an explicit start-fresh choice, never silently merged into another profile. Test current-format backup/restore and fresh offline restart, profile isolation and reliable writes. No data is reset by WL1; no compatibility layer or production-save guarantee is proposed.

## Exact pt-PT speech and fallback

Proposed `Voice.speakIn` must explicitly assign both the chosen voice and utterance language `pt-PT`; never let the system default choose. Compare canonical language tags case-insensitively to **exactly `pt-PT`**. Reject `pt`, `pt-BR`, other regions/extensions, malformed tags and English-only voices. No `startsWith('pt')`, generic Portuguese or “closest” variety fallback. Initial empty lists and `voiceschanged` refreshes must be handled without an event leaking to a newly available voice.

Any locally available exact `pt-PT` voice is eligible (2026-11-17: no per-device listening acceptance is required, since nobody is named to give it). Reject remote-only voices for this offline pilot. If multiple exact local voices exist, choose deterministically (a fixed order by name and URI), never a quality score. Re-read availability at dispatch. A matching tag is eligibility, not proof of accent or intelligibility: that is what a phone playtest note answers.

Ship at rate 0.95 and pitch 1.15, matching current English defaults; a playtest note can change them. A changed text needs a renewed review row. Do not route Portuguese through English cached clips, an English utterance or a remote translation service. No clips/assets are added in this pilot.

With setting off, speech disabled/unsupported, no exact local voice, missing/unreviewed key or synthesis failure: omit the tail, retain English, never throw or stall, and leave normal touch/host support available. Parent status distinguishes “Off,” “No European Portuguese voice on this device; words stay in English,” and the name of the voice in use. Do not present a found voice as a good one. English clip fallback remains its existing behavior; it cannot serve Portuguese words.

## Assistant review of the Portuguese (2026-11-17)

The developer, 2026-11-17: "I also don't have a Portuguese reviewer, AI will be handling that part." This replaces the developer-named family reviewer wherever this packet, the [study](../deep-dives/subjects/world-languages.md) or the roadmap asked for one. Until that day this packet said no assistant could stand in for that person; the rules below are what makes the substitute an honest one.

- **One session writes, another pass checks.** The building session drafts each European Portuguese entry. A second pass in a fresh context (a subagent given only the key, the English line, the pictured context and the draft) checks it; the writer does not accept its own line. A disagreement is settled from the sources, and an entry that cannot be settled is left out (English continues) and never guessed.
- **What is checked, for each key and each shipped variant:** the meaning in the pictured context; article, gender and number; a mass noun against pictured units; that the word and its spelling are European Portuguese and not Brazilian usage (*comboio*, not *trem*); that it is a word a small child in Portugal hears at home; and which alternatives lost, and why.
- **Sources.** At least one European Portuguese dictionary entry for each key ([Priberam](https://dicionario.priberam.org/) or [Infopédia](https://www.infopedia.pt/)), and [Ciberdúvidas](https://ciberduvidas.iscte-iul.pt/) for a doubt about usage, each linked in the evidence row. A Brazilian source or a machine translation alone settles nothing.
- **Evidence.** One row per key in the template below, committed with the word table. A changed entry gets a renewed row.
- **Said honestly.** The grown-ups' page says the Portuguese words were chosen and checked by an AI assistant against European Portuguese dictionaries, and not by a family member. No page, doc or report calls a line "reviewed by a native speaker".
- **A person's correction always wins.** A family member who says a word is wrong (a [playtest note](../OBSERVATIONS.md), or a word to the developer) replaces the entry without argument; the fix is an ordinary READY line.
- **What the assistant cannot do is hear it.** No assistant hears a device voice. Whether a phone's `pt-PT` voice says a word well is answered by the developer or their wife playing with the setting on, as a playtest note; it gates nothing. The exact-`pt-PT` rule above still decides whether a word is spoken at all, and iPad listening is [parked](../DEVICE-CHECKS.md) with the other device checks.

Arabic, French and Spanish are reviewed the same way when their turn comes, unless the developer names a person for one of them.

## Review evidence template and listening questions

**All rows below are unfilled.** The content rows are filled by the [assistant review](#assistant-review-of-the-portuguese-2026-11-17); the listening rows only when a person listens on a phone, and they hold nothing back. Store the completed evidence with the versioned table and its commit.

Repeat this template for **each of the 20 keys and every shipped variant/line**; inventory completeness and explicit acceptance must be auditable:

| Field | Evidence to fill later |
| --- | --- |
| Key / table version / commit | English key above; exact reviewed revision |
| Host / level / event / pictured context | All applicable event contexts, including mass/plural foods and feeling reveals |
| Proposed spoken entry / optional spelling | `[written by the building session]` |
| Meaning / article / gender / number / variety / alternatives | `[assistant review pending]`; accepted form, dictionary links and reasons for rejected alternatives |
| Written by / checked by / date | `[pending]`; the writing session and the separate checking pass, with the commit |
| Content decision | `[pending: accept / revise / reject]`; explicit per-line decision, not blanket approval |
| Device / OS / browser or installed PWA / date / listener | `[only when a person listens on a phone; not a gate]` |
| Voice name / URI / lang / local flag / version where exposed | `[as above]`; record identity even if a version is unavailable |
| Rate / pitch / volume / online and offline conditions | `[as above]`; actual settings used |
| Listening contexts and result | `[as above]`; natural English-then-entry, replay, interruption and normal game sounds; what sounded wrong |

WL2's building session completes the assistant review of the whole candidate vocabulary before any entry ships, and rechecks integrated playback with fake `pt-PT` voices. What only a person playing on a phone can tell us is kept here as questions for a playtest note, not as open checks:

- Does each word sound right after its English line, at the game's rate and pitch and over the game's sounds, for single, plural and mass things?
- Which voice did the phone use (name, language tag, local or not), and does it still speak offline after a restart? A phone with only `pt` or `pt-BR` keeps English and says why.
- After fast repeated taps, a replay, Home or Back, mute, and a change of setting or player, is there ever a stale or late word?

## Future WL2 verification scope

WL1 runs links and `git diff --check` only. No local code/build/browser/device tests are warranted for documentation. WL2 is a shared speech/save change: read the full current integration contracts first, re-audit this inventory if hosts changed, and run typecheck, unit tests and build. Test these meaningful properties with fake voices/controlled completion outcomes:

- Exact inventory parity with actual host pools/palette and every eligible event; 20 nonempty reviewed keys for the shipped pilot, no unreviewed variants. Typed key arguments, mode arbitration and no tail on excluded feedback.
- One reservation per key per full round, no fallback to the other Snack key, rapid-event priority, instruction replay and all cancellation paths; natural end versus error/watchdog/late callback, both English clip and device paths. Scene destruction cannot release a promise or mutate a later scene.
- Closed setting repair; independent profiles, compatible defaults, current-format backup/restore, unsupported-format reset/reseed and write-failure behavior. Matching/rejected/empty/mutating voice lists, off/mute/unavailable/missing-key cases all finish safely.
- Seeded identical inputs on/off yield identical puzzles, misses/hints, completion, adaptation, sticker seed and ownership. Optional speech adds no RNG draw or gameplay wait.

Use at most the two most relevant existing browser suites: `BROWSER_SUITE=originals ORIGINALS_ONLY=peekaboo PEEK_LEVELS=16,1,3,6`, then `BROWSER_SUITE=originals ORIGINALS_ONLY=bubbles BUBBLE_LEVELS=15,4,6,7,10`, then `BROWSER_SUITE=woods WOODS_ONLY=snack FROM_LEVEL=1` (through level 5; confirm current harness filters at build time). Exercise the eligible speech branches via small isolated-profile probes with fake `pt-PT` voices: Peek 16/1/3/6 including a feeling reveal, Snack 1–5 covering all arbitration and exclusion branches, Bubble 15/4/6 and a no-tail count/bonds case. Unit tests cover the full key matrix; do not play every key/level in the browser. Include one miss/hint where supported and cancellation/replay/round restart; no screenshots required for unchanged game drawings. Inspect the changed parent select/status once in portrait and landscape; run `world` only if navigation actually changes. Run production offline after checking served build identity because save/speech availability changed; record commit, filters, seeds and URL. Keep total browser time within the repository budget and mark remaining evidence not run. Device/child listening or learning outcomes cannot be established by these probes.

## Outside this packet

Later hosts/languages, receptive requests, whole-voice switching, translated sentences/captions/journal/how-to, reading/phonics/rhyme/song content, and recordings/clips are separate work. See the study's ordered slices; only WL2 is ready. Existing generated English speech policy is unchanged. No Portuguese content ships from this refinement: WL2 writes and reviews it.
