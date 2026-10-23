# Phone party play (after Jackbox)

Written 2026-10-23 at the developer's request: review how the Jackbox games use one shared screen and everyone's phones, and their art, and propose mini-games for the family or a group. Everything here is a **proposal**, like [IDEAS.md](IDEAS.md). Nothing is built, and no slice is claimed.

**This reopens a recorded decision.** On 2026-10-23, [Table mode and a second screen](IDEAS.md#order-and-decisions-for-the-family-table) was decided "not now", with Mission Cards (a printed card behind a physical barrier) first for hidden information ([record](archive/DECISIONS-2026-10-23.md)). The costs it named still hold: a second screen breaks "one iPad", and hidden information needs its own layout and contract. Phones would also bring the app's first network dependency. Whether to go ahead is the developer's call ([Waiting on the developer](WAITING-ON-DEVELOPER.md#still-waiting)). Until then this is a design notebook. Mission Cards stay first.

## How Jackbox works

Facts are from [Wikipedia's Jackbox Party Pack article](https://en.wikipedia.org/wiki/The_Jackbox_Party_Pack), opened 2026-10-23, and Jackbox's own pages where linked. **(recalled)** marks details from memory that were not checked.

- **One shared screen, a phone each.** The game runs on a TV or computer. Players open jackbox.tv in a phone, tablet or computer browser and type the room code the TV shows. There is no app to install. Joining is described by [Jackbox support](https://support.jackboxgames.com/hc/en-us/articles/15794771245975-How-do-I-get-started-playing-Jackbox-Games); the first to join is the VIP who starts the game **(recalled)**. The Netflix release joins through a QR code instead.
- **Private input, public reveal.** Each phone holds something only you see: a prompt, a secret role, a canvas, an answer. The TV shows the shared scene, then reveals everyone's entries one at a time, with a host's comic commentary. That reveal is the game's loudest beat **(recalled)**.
- **Small rooms, big audiences.** Most games take 4 to 8 players. Anyone who joins after that is in the audience: they vote and sway the scoring, and in some games add content.
- **Range of games.** Twelve numbered packs (2014–2026) of five games each, plus standalones. They are mostly writing and bluffing games (Quiplash, Fibbage), drawing games (Drawful, Tee K.O., Cookie Haus), hidden roles (Fakin' It, Push the Button, Suspectives), team and co-op games (Bomb Corp., Quixort, Legends of Trivia), and phone-as-controller action or music games (Zeeple Dome's flinging, Dodo Re Mi's rhythm).
- **Content and ratings.** Packs default to ESRB Teen, and only Pack 8 is E10+. The family-friendly filter removes suggestive built-in content but **does not screen what players type or draw** ([Jackbox, Pack 8 features](https://jackboxgames.com/streaming-moderation-accessibility-features-jackbox-party-pack-eight)).
- **Art.** Each game has its own look: Quiplash 3 moved from flat 2D art to claymation, and Drawful: Animate uses two-frame drawings. A narrator-host gives each game its character **(recalled)**. Phone screens are themed to match the game, with a few big buttons **(recalled)**.

## What our rules decline, and what survives

This is the same screen as the [Mario Party table](IDEAS.md#the-screens-what-the-series-does-that-the-rules-decline-and-what-the-design-guide-asks).

| Jackbox does | Our rules decline it because | What survives |
| --- | --- | --- |
| Round timers on every prompt | No round-ending timers | **Ready lights**: each phone's lantern lights when its player is done; the reveal starts when all are lit or a grown-up taps "go on" |
| Writing jokes and lies, reading prompts | Navigation never requires reading; she is about one | Picture choices with the prompt spoken on the TV; drawing; stamps. Free text only at the `grownup` band |
| Players' own text and drawings shown to the room | The family filter does not screen them | Drawings stay inside a round and vanish at its end, with no kept or shared free text from children. A kept drawing goes through the existing "our picture" slot decision |
| Points, a scoreboard and one winner | Cooperative by default; nobody is shown as the loser | A shared goal (fill the picnic, finish the song); ribbons for every seat; couch face-off stays the one competitive precedent |
| Bluffing and voting someone out (Push the Button) | No one is out | Guessing games where being fooled is funny and nobody leaves |
| Recording sound from the phone microphone (Hear Say) | No microphone or camera unless a grown-up opts in; no recorded audio files | Parked |
| Mature-rated packs | It is a child's app | Nothing comparable |
| Audience mode | (fits) | **The cheer section**: anyone past the player count, or a grandparent who only wants to watch, throws confetti and votes for "funniest". The Cooney Center's "a grown-up who only watches still takes part" |

## Hosting: where the phones meet

The app is a static, offline PWA on GitHub Pages. It has no server, so phones and the shared screen have nowhere to meet. The options:

| Option | How | Cost and concerns |
| --- | --- | --- |
| **A. Hosted relay** | A small WebSocket or room service holds a 4-letter room. The TV and the phones both connect to it. | Needs an account, maybe money, and a service on the internet that sees traffic from a child's app. Simplest to build and the most like Jackbox. |
| **B. WebRTC, signalled once through a relay** | The relay only introduces the devices, then they talk directly over the home Wi-Fi. | Still needs A's relay for the introduction, though very little passes through it. More code; some home routers block direct connections. |
| **C. Manual QR exchange, no server** | The TV shows a QR code, and the phone answers with a QR code that the TV must scan. | Needs the shared screen's camera, which falls under the camera opt-in rule. Clumsy for each of four phones. |

Whichever is chosen:

- **The island stays fully offline.** Only phone mode needs the network, and it says so plainly when there is none.
- **Privacy.** No accounts, no names sent unless a grown-up types one, nothing kept on the relay, and rooms that expire. The repository is public, so no secrets go in it.
- **Built only with the first phone game** (the AGENTS rule on shared infrastructure). No relay ahead of a game that needs it.

The choice of relay is the developer's: it is an account, possibly money, and the child's data. No specific product has been checked here.

## Where it lives and how it grows

**New phone games start in couch play.** Couch play already is "a big screen plus controllers" on the Mac and TV. It has its own scene and save, and its additions never touch the child's touch play. The steps:

1. **A phone as a gamepad.** The phone shows a D-pad and two big buttons. Its presses go into the same input couch play already reads, and on to `control()`. Every existing couch game and its bot then works with phones unchanged, so the first slice proves the hosting before any new game exists.
2. **A phone as a private screen.** Games where each phone shows something different (the proposals below).
3. **The iPad as one more phone.** Later, the island's child can join a couch room from her own iPad with island-sized targets. This is how the youngest players take part (see [bands](#bands-honestly)).

**Island rows keep their decided homes.** The 2026-10-23 decision on [where games made for two live](IDEAS.md#order-and-decisions-for-the-family-table) still applies. Phone versions of island rows (Same Pick, Lantern Keeper's Manual) stay in Pal Plaza or their best-fitting land, and phone seats become an option there. The party board stays with Game night. Only games that are new and made for phones start in couch play.

**Phone screen rules (proposal).** A phone held upright and plain HTML, like the couch. At most four choices per screen, each at least a quarter of the phone, since a 100-unit island target is only about 50 points on a phone (per [DESIGN](DESIGN.md#application-and-scenes)). Phones stay silent: the TV speaks every line from `voice-script.ts`, so the room hears one voice. The phone shows your creature and your ready lantern. Losing connection never loses a round: the TV holds the state, and a phone that comes back takes its seat again.

**The seat contract still applies** ([IDEAS](IDEAS.md#the-seat-contract)): seat 1 is the active profile and the only seat measured by `difficulty.ts`; other seats are anonymous; credit goes to the active profile. Every game needs a **solo fallback** with the pet or a bot in the empty seats.

## Art: what carries over

The [art bible](rework/ART-BIBLE.md) sets one look for the cast, so Jackbox's new art style per game does not transfer. What does:

- **A host.** The pet (or a creature host per game) narrates with gentle jokes, names whose turn it is, and reacts to each reveal. Lines are in `voice-script.ts`, voiced through Kokoro.
- **A lobby.** The TV shows a big QR code and a 4-letter code made of picture tiles (fish, star, boat, shell) a child can read. Seat 1 brings their own creature from the collection the rework is building. Every other phone picks a guest creature from a fixed set, since other seats are anonymous and uncredited under the seat contract. The lobby alone is a reason to gather.
- **The reveal.** One entry at a time, with a drumroll, a spotlight and the host's reaction. This is the moment to borrow most.
- **A stage per game.** Each game gets a distinct set (a bakery, a bandstand, a parade route) and an accent colour from `palette.ts`, with the same creatures and ink outline. Variety comes from places, not new styles.
- **Themed phones.** The phone wears the game's set and colour and your creature, so the phone feels like part of the stage.

## Mini-game proposals

Each row gives the Jackbox source, what the TV does, what the phones do, the band, the learning, and what it overlaps with here. All are cooperative, have no timers, and give a sticker or ribbon to everyone who finishes.

| Proposal (after) | Shared screen | Phones | Band · learning | Overlap and notes |
| --- | --- | --- | --- | --- |
| **Bakery Orders** (Cookie Haus) | A creature customer orders aloud and in pictures: "a cookie with three red dots and one star". The finished cookies parade out, and the customer checks each against the order. | Each phone decorates a cookie with big stamps for dots, stars and sprinkles, and a colour pot. | preschool–school · counting, colours, shapes, following a two-part order; later "more dots than stars" | Hints follow the boing-then-hint rule. Free-decoration rounds are not judged. Overlaps Bug Builder's stamp-to-a-model levels; could be a phone mode of it |
| **Pond Band** (Dodo Re Mi) | Notes travel down a lane per player toward the frogs; the song plays along, and a missed note simply does not sound. | Each phone shows one to three big pads, a player's part. | toddler (one pad, any time) to school (rhythm parts) · beat, taking turns in music, listening | Pentatonic steps from `notes.ts` unless it is a known tune, as in Sing-Along Barn. `music: silenced`. Overlaps Sing-Along Barn and Song Maker |
| **Same Pick, with phones** (Guesspionage, Poll Mine) | Asks a picture question ("something you'd take to the beach") and reveals all picks at once. A match makes the creatures dance. | Each phone secretly picks one of six pictures. | toddler (with a grown-up) and up · categories, guessing another mind | **Unblocks the existing [Same Pick](IDEAS.md#candidates-for-two) row**: the phone replaces its "close your eyes" honour system |
| **Lantern Keeper's Manual, with phones** (Keep Talking, Fakin' It) | Shows the music box with its dials and gems to the describer. | The helpers' phones hold the manual pages, in pictures for younger players. | school–grownup · precise description, listening, following rules | **Unblocks the existing [Lantern Keeper's Manual](IDEAS.md#candidates-for-two) row**, which waited on exactly this. Mission Cards remain the offline version |
| **Everybody's Question** (Legends of Trivia, Bomb Corp.) | The family fights a grumpy-but-friendly storm cloud together: each right answer shines a sunbeam, and enough sunbeams make a rainbow. | **Each phone gets its own question at its own level**: a picture-count for a 4-year-old, a times table for a 9-year-old, a riddle for Grandpa. | preschool–grownup · each player's own subject, pulled from existing games' `logic.ts` | The key idea: **one shared goal from questions at each player's level**, so mixed ages help each other instead of competing. Wrong answers get a hint and another try |
| **Line Up Parade** (Quixort) | Says "line up from smallest to biggest" and shows the parade route. | Each phone shows one card (a number, an animal's size, a time of day). Players **stand up and arrange themselves** in the room, then each taps "I'm next" in turn, and the parade marches in that order. | preschool–school · ordering, comparison, number sense; plenty of talk | An off-screen activity built in. A wrong order gets a gentle "swap two" hint. Size Parade's ordering levels are the on-screen version |
| **Doodle Guess** (Drawful) | Shows one player's drawing; everyone guesses from picture choices (no writing). The artist's creature bows for each right guess. | The artist draws a secret picture prompt ("a fish wearing a hat"); the others pick what it is. | preschool–grownup · drawing to communicate, recognising shapes | A grown-up can draw for the toddler, who guesses by tapping a picture on the iPad. Drawings vanish at the end of the round. Overlaps Two-Knob Doodle |
| **Mix-a-Creature** (Champ'd Up) | Reveals a creature built from parts nobody saw together, to cheers. | Each phone secretly chooses one part (head, body, tail, pattern) from its collection. | toddler–school · combining parts, describing ("it has a fish tail") | Fits the rework's creature collection. Keeping the result is a collection-system question for the [rework brief](rework/README.md). Unlike Bug Builder, nothing is matched |
| **Flick Fling** (Zeeple Dome) | A friendly arena where a creature bounces off springs into the bells. | Each phone flicks to aim and launch its creature. | toddler (any flick rings something) to school (angles, banking) · aiming, cause and effect | Overlaps Bouncy Launch (pull back to fly); could be a group mode of it. Reuses `ball.ts` `simulate()`. Co-op: the bells are a shared target count |
| **What Is It?** (Blather 'Round) | Collects the clues and shows them as a growing picture sentence; everyone guesses. | The describer's phone shows a secret picture and clue tiles ("animal", "lives in water", "bigger than a dog"). | preschool–school · describing, categories, vocabulary, without needing to read | Clue tiles are spoken when tapped. Overlaps the language games |
| **Cheer Section** (audience mode) | Shows confetti, applause and "funniest" votes from the audience. | Audience phones get three big buttons: clap, confetti, heart. | everyone · taking part without having to play | A layer every phone game gets, not a game on its own. It never changes who finishes |

Parked: anything built on writing and bluffing (Quiplash, Fibbage) below the `grownup` band; Hear Say (microphone); hidden-role games where someone is voted out (Push the Button). A **grown-up party shelf** with free-text games on the `grownup` band can be considered once phones exist; the family filter's limits make it a grown-ups-only room.

## Bands, honestly

She is about one. The full Jackbox shape (each person reading their own phone) fits **school** and **grownup**.

- **Lap and toddler.** A grown-up holds the phone or plays beside her. She plays on the iPad with island-sized targets, or watches the TV and claps. Pond Band (any tap plays), Flick Fling (any flick rings a bell), Same Pick and Mix-a-Creature reach her first.
- **Preschool and pre-K.** Picture-only phone screens with spoken prompts: Bakery Orders, Doodle Guess, Line Up Parade, What Is It?
- **School and up.** Everything, including Everybody's Question at each player's own level and Lantern Keeper's Manual.

## Suggested order (non-binding)

1. **The decision** on hosting and on reopening the second screen ([waiting](WAITING-ON-DEVELOPER.md#still-waiting)).
2. **Phones as couch gamepads**, which proves the room, the QR lobby, the creatures arriving and reconnecting with games that already exist.
3. **Same Pick with phones**, the smallest private-screen game, reusing an already-defined row.
4. **Bakery Orders** or **Pond Band**, the first new game made for phones, plus the Cheer Section.
5. **Everybody's Question**, which needs question sources from several games' logic.
6. Lantern Keeper's Manual, Line Up Parade, Doodle Guess and the rest, each through its own definition of ready.

Each still needs a definition of ready (round, ladder, misses, solo fallback, bot, checks) before it can be built.
