# Typing Land, reviewed for Puddle Island

*Reference review · 2026-10-23 · `claude/typing-land-review-88a7ed`. Documents only: nothing was built. Proposals here are proposals until the developer or a dispatch takes one.*

**What it is.** [Typing Land](https://store.steampowered.com/app/1818940/Typing_Land/) (higopage, 2021; free on iOS, Android, Windows, macOS, Steam and a [browser edition](https://typingland.higopage.com/play)) teaches touch typing on a physical keyboard through 81 lessons in nine worlds, each lesson a fixed trio of short mini-games drawn from about forty, with stars for speed and accuracy, 150 badges that double as profile icons, and a Challenge mode with preset or custom text. Steam shows it 87% positive from 225 reviews; the App Store is more mixed (about 3.5 of 5), mostly over external-keyboard bugs. One person built it in about two years of spare time after making the 1999 typing game *Ozawa-Ken* ([press kit](https://typingland.higopage.com/presskit.html), [Den Fami Nico Gamer](https://news.denfaminicogamer.jp/news/2110282c)).

**How this was checked.** I played the browser edition through setup, the tutorial, World 1 lesson 1 (all three mini-games and the result) and the World 1, 2 and 6 maps in the app's own browser pane, and opened the Steam, App Store and official pages plus three reviews ([Gigazine](https://gigazine.net/gsc_news/en/20211029-typing-land/), [shikaku-koko](https://shikaku-koko.com/typing-land/), the [Steam](https://steamcommunity.com/app/1818940/reviews/) and [App Store](https://apps.apple.com/us/app/typing-land/id1568264476?see-all=reviews&platform=mac) review pages). Sound was not heard (a headless pane); later worlds and Challenge mode were not played. The game is a Unity build, so nothing about its code structure is known or borrowed.

**Recommendation in one paragraph.** Typing Land confirms the island's keyboarding study rather than overturning it: a physical keyboard, keys found by letter not by position, no gates, spoken support and gentle misses are all places where the island is already ahead. What it adds are four presentation patterns worth taking: a round built from **three short scenes over one key pool**, a **result readout that shows how close she came** (bars with the thresholds drawn on them), a **progress number that only ever grows with play** and is separate from stars, and a **map of round picture-portholes with the lesson buttons in front**. The cheapest wins are docs-only amendments to the [Pond Typing definition](definitions/pond-typing.md) and small additions to [RW10](rework/WORK-ITEMS.md#rw10-collection-book-and-chosen-unlock-goals) and [RW14](rework/POLISH.md). Its locks, silence, speed stars and finger-posture lessons stay out, by the island's existing rules.

## What Typing Land does, screen by screen

| Screen | What it does | Seen or read |
| --- | --- | --- |
| **Setup** | A notice that a physical keyboard is required; pick your keyboard by comparing its picture with the yellow J key; type a name; pick one of twenty icons by its printed key | Seen |
| **Home** | One card per player (icon, name, "Lv.", star and crown counts), a number key per player, M for the menu, C for Challenge mode. Every button prints the key that presses it; no mouse is needed anywhere | Seen; [Gigazine](https://gigazine.net/gsc_news/en/20211029-typing-land/) |
| **Tutorial** | A soft-serve-ice-cream teacher with a pointer and a crab sidekick walks through about twenty text cards, each advanced by Enter: Enter "with your right pinky", F and J as No and Yes, "do you look at your hands?", an on-screen keyboard with translucent hands and the home row tinted, a picture of a child looking at the keyboard with a red cross, the ␣ mark for a space. Two yes/no questions let a confident typist start at World 6 | Seen; [shikaku-koko](https://shikaku-koko.com/typing-land/) |
| **World map** | Nine round numbered buttons in two rows in front of a circular picture of the world (a meadow house, a lighthouse and sea, a candy land); stars under cleared lessons; a black sea-urchin lock on lessons that need stars; F and J arrows between worlds; P replays the home-row practice; X exits. Worlds 1–6 are open from the start, 7–9 after clearing 6 | Seen; [Gigazine](https://gigazine.net/gsc_news/en/20211029-typing-land/) |
| **A lesson** | Three mini-games in a row, shown as three dots, with a one-second smiley card between them. In 1-1: a frog hops up lily pads, each pad printing the next key, until a lotus; hot dogs each printing a two- to five-symbol string (F, J and ␣), a stack on a plate counting down the ones left; a yellow block creature walking a row of key tiles to a pink friend. World 6-1 opens with the same frog over all three rows, so the games are a fixed set reused with a growing key pool. The on-screen keyboard lights the key to press with a dot under the finger. A wrong key is counted and nothing else: no stop, no sound I could see, no hint | Seen |
| **Result** | Two bars: Speed (characters per minute) with two star marks on it, Accuracy with one mark near the right; a correct/mistype count; R to retry. Two stars at 93% accuracy with 24 cpm, so the third star is accuracy (about 95% or better per shikaku-koko; three stars with zero mistakes earns a crown). Then "Level up, Lv.2: the more you type, the higher your level" | Seen; [shikaku-koko](https://shikaku-koko.com/typing-land/) |
| **Badges** | Every three stars earns a badge; 150 in all; any badge can be the profile icon; collecting all of them opens a bonus game | [Official site](https://typingland.higopage.com/), [Den Fami](https://news.denfaminicogamer.jp/news/2110282c) |
| **Challenge mode** | Five games scored on speed and accuracy over preset sentences or the player's own text; *Typing Sword* (an *Ozawa-Ken* homage) unlocks with a donation | [Gigazine](https://gigazine.net/gsc_news/en/20211029-typing-land/), [press kit](https://typingland.higopage.com/presskit.html) |
| **Settings** | Hide the on-screen keyboard, lowercase display, Dvorak and Colemak, a break reminder every fifteen minutes, parental controls, hide rankings, save backup between devices, a school edition with sixty players, eleven languages | [App Store](https://apps.apple.com/us/app/typing-land/id1568264476), Steam reviews |

**What players say** (reviews opened 2026-10-23; quotes are short). Steam reviewers compare the lesson rhythm to *Rhythm Heaven* and *WarioWare*, call the art "bright and cheerful" and the sound effects "satisfying", and like that games "can be repeated until mastery" and that badges give "a real sense of progression". Parents report a four-year-old "easily typing large words" after a week and a seven-year-old who "loves unlocking profile icons". The complaints are as useful: the mini-games are silent apart from effects (one wants music, another wants letters and words read aloud as they are typed); the "basketball frogs" and "hot dogs on a conveyor belt" levels are "too stressful for beginners" with no way to skip them; the locked worlds block shared classroom iPads; custom text exists but custom *word sets* for the mini-games do not; and external iPad keyboards drop ñ, ö and AZERTY keys, which comes from reading key positions rather than letters.

## Against the island's rules

| Typing Land | Island rule or state | Verdict |
| --- | --- | --- |
| Physical keyboard required; layout picked by picture | [Keyboarding study](deep-dives/subjects/keyboarding-editing.md): no keyboard on glass for children; Pond Typing reads `KeyboardEvent.key`, so no layout step is needed and the ñ/AZERTY class of bug cannot happen | Confirms the study |
| Stars for speed and accuracy; a crown for zero mistakes; star-count locks and a World 7 gate | No round-ending timers, no gates; Pond Typing is accuracy only for children; couch play allows a personal best in its own unit | Stays out. The classroom complaint about locks is the case against gates made by its own players |
| A wrong key is counted silently; retry with R | Gentle boing, a spoken name of what was pressed, a glow after two misses; Another after the celebration | The island's is better for a child; keep |
| Twenty text cards of tutorial, Enter after each | Navigation never requires reading; the how-to card demonstrates the input | Stays out for children. For the Laptop setting, the couch how-to already shows key caps |
| Hands drawn on the keyboard, a finger dot, "right pinky" | Decision 5 (2026-10-23): posture and finger-placement text stays undrafted without a named reviewer; the coach is a lit key | Stays out; the lit key is already defined |
| Silent play; no read-aloud | `ctx.instruct`/`ctx.say`; the pet reads each letter, word and line back | The island is ahead; players asked for exactly this |
| Break reminder every fifteen minutes | Limits belong to the device (Screen Time, Guided Access) | Stays out |
| Badges that become the profile icon | Stickers (one per round) and the rework's permanent unlocks through play | **Take**: below |
| A "Lv." that only grows with practice, separate from stars | A creature's change is not a claim about the child's skill; participation and completion, with help, earn the same reward | **Take** as a precedent for RW10: below |
| A lesson is three short games over one key pool | One game per round; the Discovery mixes (D2) chain three games | **Take** for Pond Typing: below |
| A result with the thresholds drawn on the bars | Stickers only; misses and hints feed adaptation silently | **Take** for school and couch rounds, without speed: below |
| World map: a round picture of the place with buttons in front | [RW14](rework/POLISH.md): "a place is a picture of an icon, not a view of the place" | **Take** as a layout pattern for Places: below |
| Custom text for Challenge mode; players want custom word sets | KE7 *Type it together*; no stored typed text in a child's game | Proposal with a decision: below |

## Proposals

Each is a proposal, sized for one session, with the document it would change. None is on [READY](READY.md) yet.

### P1. Pond Typing rounds as three short scenes over one key pool (docs only, S)

The [definition](definitions/pond-typing.md) gives one scene, a bubble that waits, for all six levels. Typing Land's lesson shows why three *different* scenes over the *same* keys feel like a game rather than a drill: the hop, the string and the walk each take the same two keys and the space bar, and none of them teaches anything new. Amend the definition so a round is three scenes of about five targets each, all from the level's pool: the bubble that waits (as defined), a lily-pad hop (the pet hops to the pad whose letter she typed; the frog is the island's own [Frog Hop](deep-dives/frog-hop.md) cast), and a walk along a row of letter tiles to a friend at the end (the line is the level-5 line, read left to right, which also previews level 6's caret). Keep every rule of the definition: nothing drifts, no timer, a wrong key wobbles and is named, the first wrong key on a target is free, Backspace and the arrows are never misses, one sticker per round. The bot plays all three scenes. Cost: three small scene renderers instead of one; the art is the pond, pads and tiles already in the code-drawn kit. What stays out: the hot-dog countdown stack if it reads as pressure (shikaku-koko's reviewer felt none; a Steam parent did); use the three dots instead.

### P2. A calm result readout for school and couch rounds (shell, S–M)

Typing Land's result draws the thresholds on the bars, so a player sees they were two mistypes from the third star. The island tells her nothing after a round except the sticker, and the two-smooth-rounds rule steps the level silently. For the `school` band and couch play only, add to the celebration a single line and bar: *letters first try* (or the game's own unit: *cards first try*, *sorts first try*) with her personal best marked on it, and no speed, no stars, no percentage. Lap to pre-K rounds show nothing new. This is within the couch rule (a personal best in its own unit) and the grown-up wording rule (it names what the game asked, not a skill claim). It needs the shell to pass misses to the celebration (it already has them from `ctx.finish`) and a bounded per-game best in `SaveData` with repair and tests. Pair with [RW14 slice 5](rework/POLISH.md#slice-5-celebration-and-result-in-place), which is already redrawing the result screen.

### P3. An earned profile picture (RW10, S)

The App Store's seven-year-old plays for the icons. The island's "Who's playing?" card shows her creature; let it show, at her choice, any sticker she owns or any look her creature has unlocked, chosen from the collection book RW10 is defining. This is customization from things already owned, not a new reward, so it respects "nothing accrues, wears out or waits" and "owned looks stay selectable". Add one line to the [RW10 first slice](rework/WORK-ITEMS.md#rw10-collection-book-and-chosen-unlock-goals): the chosen picture is a profile-index field, bounded to owned items, repaired to the creature when the item is gone.

### P4. A play tally that only grows, as RW10's precedent (docs, S)

"Lv.2: the more you type, the higher your level" is a number that cannot go down and does not judge: it counts practice. The rework already says permanent unlocks come through play and that a creature's change is not a claim about mastery. Typing Land is a concrete precedent that such a count is motivating on its own (Steam: "a real sense of progression") *as long as it is separate from the accuracy stars*. Record it in RW10's packet as the model for its "attainable next goal": goals phrased as rounds played or things made, never as rounds without misses. No new counter is needed; round history is already saved.

### P5. Portholes on Places (RW14 slices 4 and 8, no new image)

Typing Land's map is one round picture of the world with the nine lesson buttons laid in front, and it reads at a glance on a flat striped ground. RW14 already notes that Places "is eleven small icon cards". When slice 4 imports the Rainbow Meadow backdrop, draw each place on Places as a round porthole cut from its backdrop (the code-drawn hills until a backdrop exists) with the place's name below, and in a location keep the spots in front of the porthole rather than beside it. No new image; it is a mask and a layout. The lesson numbers in two staggered rows are also a cheap layout for a location's spots that keeps every target at 100 units.

### P6. A breath between games in a mix (D2, S)

Typing Land puts a one-second smiley card between the three games of a lesson, so the change of scene never surprises. The Discovery "Little surprises" mix chains three games; between them, show the next game's hub icon on a plain card for about a second, spoken by the pet ("Next: Bubble Pop"), before the how-to card or the game. It also replaces the blink-to-cream that [RW14 slice 9](rework/POLISH.md#slice-9-moving-between-screens) is removing.

### P7. Her words, typed by a grown-up (decision, S)

Typing Land's most-asked-for missing feature is custom word sets for the mini-games. The island forbids stored typed text *in a child's game*; a short list of words a grown-up types on the grown-ups' page (plain HTML in `src/parent/panel.ts`) is a grown-up's text, like the child's name. Proposal: a bounded list of up to ten words of two to six letters A–Z, validated and repaired on load, offered to Pond Typing level 3 as an alternative pool and to Word Monsters' shelf. **Needs a developer decision**: it is new save data, and the study's lean was "no typed text stored". If accepted, it is a definition first, with the reviewed-pool rule (decision 5) applied to the grown-up's own list by skipping the check (it is their list) and reading each word back through `voice.speak`. Added to [Waiting on the developer](WAITING-ON-DEVELOPER.md) is **not** done here; it is listed for the next refill to decide.

### What not to take

Speed stars and crowns; star-count locks and world gates; the silent wrong key; finger and pinky instruction without a reviewer; the long read-through tutorial for a child; the fifteen-minute reminder; a home screen that shows counts before play. Typing Land's "40 kinds of mini-games" is, from what was seen, a smaller set of mechanics reused across worlds with a growing key pool; the island's per-game ladders already do this better, with learning rather than key count as what grows.

## For the Pond Typing build

Facts from this review that the build session should carry, beside its definition:

- Read `key`, never `code`: Typing Land's worst reviews are the layout bugs this avoids.
- The pet reads every target aloud: the feature Typing Land's parents asked for and do not have.
- The key-cap strip is the coach; there are no hands on the keyboard (decision 5).
- Three scenes per round (P1) if the definition is amended; otherwise the bubble alone.
- Show the result as *first try* only (P2) if it lands first; never speed, never a crown.
- The hop scene can reuse Frog Hop's frog and pads; the walk scene is the level-5 line.

## Sources

Opened 2026-10-23: [Steam store page](https://store.steampowered.com/app/1818940/Typing_Land/), [Steam reviews](https://steamcommunity.com/app/1818940/reviews/), [App Store listing](https://apps.apple.com/us/app/typing-land/id1568264476) and [Mac reviews](https://apps.apple.com/us/app/typing-land/id1568264476?see-all=reviews&platform=mac), [official site](https://typingland.higopage.com/) and [press kit](https://typingland.higopage.com/presskit.html) ([Japanese](https://typingland.higopage.com/presskit-jp.html)), [the browser edition](https://typingland.higopage.com/play) (played), [Gigazine, 2021](https://gigazine.net/gsc_news/en/20211029-typing-land/), [Den Fami Nico Gamer, 2021](https://news.denfaminicogamer.jp/news/2110282c), [shikaku-koko review](https://shikaku-koko.com/typing-land/). Google Play and the Microsoft Store returned no readable page; the manual PDF returned an error.
