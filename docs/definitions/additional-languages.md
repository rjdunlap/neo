# Additional languages: stage 1, the pet says the word

**Definition, 2026-10-15 (docs only; nothing built).** Roadmap [chunk 15](../ROADMAP.md#next-up) and [Additional languages](../ROADMAP.md#additional-languages). The developer decided on 2026-10-11 that additional languages are wanted. Which languages, their order and who reviews the lines are still open ([Waiting on the developer](../WAITING-ON-DEVELOPER.md#waiting-on-the-developer)); this definition is language-neutral so a build can start the day one is named. Stages 2 and 3 are not defined here.

## Purpose

A child hears a second language in the place she already hears naming and counting: the pet says "a cow", then the second-language word for it. Fun action: unchanged (peeking, feeding, popping, hopping). Learning goal: an everyday word, said in context and repeated, in a language the family chose. No new screen, no quiz, nothing she can get wrong in the second language, and no change to levels, misses, hints or stickers.

## Decision: a word table, not a translated script

The roadmap sketched a table keyed by `LineId`. A read of the code changes the shape: the lines these games speak are English *sentences* with a slot (`'peek.found'`: "{word}! Behind the {cover}, a {animal}!", `'snack.yum'`, `'bubble.friend'`), and translating a sentence forces grammar (gender, plurals, word order) that a native reviewer must check per line and that "after the English one" does not need. Stage 1 therefore translates **words, not lines**:

- A vocabulary table per language, `src/content/words/<lang>.ts`, keyed by a typed `WordKey` such as `animal.cow`, `color.red`, `shape.circle`, `number.4`, `food.carrot`. Each entry is the spoken word (with its article where the language needs one) and an optional display spelling.
- Sentences stay English and unchanged. After a naming or counting line finishes, a game calls one new context helper, `ctx.sayWord(key)`, which speaks the second-language word if the person has the language on and the table has the key, and does nothing otherwise.
- Because only nouns, colors, shapes and number words move, a native reviewer checks about 60–80 short entries per language instead of hundreds of sentences, and a missing key is silent English, never a gap.

If the developer prefers whole-line tables, that is stage 2's `lineText(id)` work and is unaffected: the word table and the setting below are reused.

## The setting

- One bounded, repaired field on the active profile's save: `settings.language2: 'none' | <LanguageCode>`, default `'none'`. `LanguageCode` is a closed union (`'es'` and so on) so an unknown value repairs to `'none'`. Add the default, the repair and a `migrate()` test in `src/progress/save.ts`; old saves and backups load with `'none'`; a restore from an older backup never invents a language.
- It follows the person (profiles exist), not the device. It lives only in the grown-ups' page (`src/parent/panel.ts`, plain HTML): a select "Second language: none / <names>", the note "She hears the word in this language after the English one in picture and counting games," and a one-line status: *Voice found on this device* or *No voice for this language is installed here, so speech stays in English.* The child never sees it and no scene reads it as a gate.
- It never changes difficulty, level pins, save keys, sticker or journal content. `profile.band`, levels and adaptation do not read it.

## Speech

- `Voice` gains `speakIn(lang, text)`. It picks a device voice whose `lang` starts with the code, using the same scoring as `pickVoice` (premium/enhanced, local service), kept per language and refreshed on `voiceschanged`. The rate and pitch (0.95, 1.15) were tuned on English, so a language may carry its own pair in its table file; start at the English pair and note it as "check on a device".
- If no matching voice exists, `speakIn` resolves immediately without speaking (never English text through an English voice, which mispronounces), and the grown-ups' page shows the status line. Speech stays English; nothing breaks.
- `ctx.sayWord` queues after the English line's promise, so the same rules hold: a destroyed scene's promises never resolve and the chain stops there; it ignores a missing key; at most one second-language word follows any English line (the first time per round that word appears, as `bubble.friend` and `peek.found` already name once), so repeated play does not become a drill.
- Number counting says the English count as today; the second-language numeral follows on the *final* number only ("five" then "cinco"), never on every step, which would double the speaking time of Duck Pond and Frog Hop.

## First slice (the build this definition authorizes, once a language is named)

Three games chosen for a plain noun-after-sentence shape and no new interaction:

1. **Peekaboo Barn**: the animal after `peek.found`/`peek.yes`.
2. **Animal Snack**: the animal and the food after `snack.yum`.
3. **Bubble Pop**: the friend after `bubble.friend`, and the color after `bubble.color` (level 4's color word).

Later in stage 1 (separate slices, same helper): Rainbow Fingers' color names, Duck Pond's and Frog Hop's final numbers, Splish Splash toys, Peg Garden's flower colors. A game opts in by calling `ctx.sayWord`; nothing is added to a game that does not call it.

Vocabulary for the first slice: the seven `CRITTERS` names used in those games (`cat`, `cow`, `duck`, `pig`, `dog`, `bunny`, `bear`), the snack foods in Animal Snack's data, and the color names. The table has a `WordKey` for each; a type test makes `sayWord`'s argument the key union, so a game cannot ask for a word the table type does not declare.

## Tests and checks

- **Parity of vocabulary:** for each language, every `WordKey` a first-slice game can ask for exists in the table (derived from the games' data, e.g. the `CRITTERS` and food lists), and no entry is empty. A language may be partial; the test lists the missing keys per language as a report, and fails only for a key a *shipped* language is marked complete on.
- **Fallback:** `sayWord` with `'none'`, with a missing key, and with no matching device voice speaks nothing and never throws or leaves the scene waiting (a fake `speechSynthesis`).
- **Repair:** `settings.language2` repairs from garbage, from an unknown code and from a missing field; backup/restore keeps it; an older save loads as `'none'`.
- **Unaffected:** a golden round of each touched game is identical with the setting on and off (misses, hints, level, sticker seed).
- **Tier:** save and shell (typecheck, unit tests, build) plus one filtered play of each touched game with the language on (screenshots add nothing, since nothing is drawn). Not run by automation and recorded as open in [DEVICE-CHECKS](../DEVICE-CHECKS.md): the real pronunciation of each word on an iPad voice, and a native speaker's review of every entry before it ships.

## Not in stage 1

Translating sentences, the journal and captions (stage 2); the how-to cards, the grown-ups' page and couch pages (English); letter names and sounds, rhymes, syllables and reading (stage 3, one dive each); recorded audio (parked: no audio files); any language-dependent level or scoring; a per-device setting; and gating anything by language.

## Open before building

1. **Which language first, and who reviews it** (developer; [Waiting](../WAITING-ON-DEVELOPER.md#waiting-on-the-developer)). The build needs one native-reviewed table of the first-slice vocabulary.
2. **Word table versus line table** (this definition's recommendation: word table for stage 1). Confirm or revert.
3. **Whether the grown-ups' page labels the status line** with a way to test the voice (a "hear a sample" button is plain HTML and cheap, but is proposed, not defined).

**Decided 2026-10-23 (on the developer's delegation):** stage 1 adds the second-language word after the English one, as the per-person `settings.language2` above, spoken by device speech; whole-voice switching is only a later option for older bands, and replacing English, a per-device setting and recorded parent lines are not used. The first language and its family reviewer remain the developer's call.
