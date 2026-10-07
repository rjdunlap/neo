# Island Party and playing on Switch

Follow-up to the play/progression review, 2026-10-06. **Proposals and feasibility research only.** The developer's wife enjoys Mario Party, and the home console is an original-generation Nintendo Switch (including OLED/Lite), not Switch 2. No party mode, controller support, console export, or developer access has been implemented or obtained.

## Status (2026-10-07): built as couch trips

A first version of Island Party now exists as **couch play** (see [Couch play in the design doc](DESIGN.md#couch-play-2026-10-07) and [CONTROLLER-SETUP](CONTROLLER-SETUP.md)): a separate grown-up save, six-stop trips with three choices per stop, alternating choosers, lanterns, and keyboard/controller play, extended with a how-to screen and bot demo before each game, games that open as trips are finished, and a **face-off** mode. It runs in the browser on a computer, as recommended below; the Switch route is unchanged and unexplored. Nine games are couch-ready, not the six listed below: Block Tower and Quick Tricks are still candidates.

Decisions made while building the competitive part, following the equal-information rule below:

- A face-off stop gives each player **their own fresh board** (different seeds, same plan and level) and scores it against **that board's own best**, so boards of slightly different difficulty still compare fairly. The second player never faces a board whose answer was just watched. This rules out games whose boards are fixed per level (Robot Path) for versus play; they can be team games.
- Games with natural alternation (Memory Match) play **one shared board**, taking turns, with no hints, since a glowing hint would favor whoever asked.
- Cooperative games (Bounce Back, Rhythm Neighbors, Bumper Garden) are **team stops** that score for both players. Ties also score for both. The trip never shows a loser, and every lantern still lights.
- A stop gives one couch sticker, not one per turn. The first turn of a two-turn stop is saved, so leaving and reloading between turns does not repeat or lose it.

Built since: a **finale** (a night sky with six lanterns lit in the color of whoever took each stop, a scoreboard, a recap, and the games the trip opened) and the one known **keepsake**, Lantern Night, from the first finished trip. Not built: a shared scoring contract across more than two scored games, simultaneous face-off, and any Switch route. Real controllers and a TV have not been tried.

## Recommended next slice: choose the next stop

Build **Island Party** before the longer single-game course. It is the horizontal proof of concept: several existing activities become one evening's play. Penguin Slide's course remains the next vertical slice for deeper decisions and personal records.

The first party has six stops. Before each stop, offer **three large game cards**, chosen from a curated pool of six games. Each shows its action, difficulty, and who plays. Three is a starting design choice to compare with four in desktop play, not a research-established optimum. Show progress toward lighting six island lanterns and finish with one shared finale. Players may leave and resume; the number of stops is a goal, not a time limit.

Start with solo or two adults taking turns at the same computer. Alternate who chooses and plays, with both free to advise. This is pass-and-play, not a claim that existing games support simultaneous controllers. The first six candidates are Penguin Slide, Bouncy Launch, Light Lab, Block Tower, Quick Tricks, and Rhythm Neighbors; review their selected modes for adult interest before calling them a finished party pool.

Offer distinct games and varied actions, avoiding the two most recently played games when possible. Prefer activities not yet visited; allow earlier games back into the offer when fewer than three unplayed games remain. A free Shuffle and a favorites option preserve choice; unchosen cards can return later. After a completed game, use a brief result/sticker acknowledgment and return directly to the next three cards. No map hunt or restart button between stops. The party host adds no extra sticker: each completed minigame retains its ordinary one-sticker award, and one known party keepsake can be earned once.

Use the separate adult save context proposed in [Play and progression](PLAY-AND-PROGRESSION.md). Save the offered cards, chosen game/level/seed, next chooser, completed stops, and award identity. Do not reroll the offer on reload. At a round boundary, commit the round and party advancement together so reopening cannot duplicate rewards. Leaving an unfinished round resumes that stop by restarting its round; do not claim mid-game persistence until a game supports it. The session setting still owns goodnight, and returns must distinguish a party stop from ordinary play or a picnic request.

Completion fills the shared lantern route even with help. Keep each game's performance in its own units. An optional adult competition can follow once two games have reliable score rules: each minigame contributes one win point, with an explicit tie rule, rather than adding incomparable slide/launch/rhythm totals. Do not use pass-and-play exposure to the same hidden puzzle as a fair head-to-head test; the second player has seen the solution. Competitive content needs equal information, appropriate controls, and defined support categories.

## References and concrete experiments

These are design translations, not copies of characters, artwork, or exact games.

| Reference | What to study | Puddle Island experiment |
| --- | --- | --- |
| [Super Mario Party Jamboree: Minigame Bay](https://www.nintendo.com/my/switch/a7hl/harbor/index.html) | Packs of minigames, tag matches, and free selection outside a full board session | The three-choice party route; retain always-available play rather than daily availability. |
| [Super Mario Party: Partner Party and River Survival](https://play.nintendo.com/news-tips/tips-tricks/super-mario-party-modes-tips-tricks/) | Discussing routes and coordinating toward a shared destination | A later two-player raft delivery: one controls each side, collect supplies, dock together. This would be a new activity, with a solo helper and a fixed delivery goal. |
| [WarioWare: Get It Together!](https://www.nintendo.com/us/store/products/warioware-get-it-together-switch/) | Varied tiny actions and characters with different abilities; cooperative play | Extend the existing Quick Tricks family with complementary jobs, such as one player holding a bridge while the other carries a parcel. Keep the island's forgiving pacing. |
| [Snipperclips](https://www.nintendo.com/us/store/products/snipperclips-cut-it-out-together-switch/) | Talking through a spatial problem and coordinating different actions | Develop the existing Shape Buddies idea with a small set of predefined shapes and roles before freeform cutting or general geometry. |

Use existing games for the party shell first. Of the new interaction ideas, the raft delivery is the strongest small controller experiment; cooperative construction is a deeper later slice. Bounce Back is also an existing candidate for simultaneous two-controller play, but its current implementation handles multiple touch pointers, not gamepads.

## What implementation involves

1. A party route/scene, three-card chooser, bounded seeded selection rules, and a six-stop progress display.
2. A general launch/return context in the shell that preserves the existing place and picnic behavior, plus a compact celebration option for party rounds.
3. Adult save isolation, explicit selected levels, and saved/idempotent party progress. Existing completion results are enough for the first cooperative route; scoring needs the later typed metrics proposal.
4. Browser checks for all six launch/return paths, distinct offers and repeat avoidance, early leave, reload, assisted completion, both orientations, save isolation, rewards, and finale. Navigation/persistence changes also need production offline verification.
5. A separate controller milestone: menu focus/confirm/back, player assignment, disconnect/pause handling, and semantic game actions. Start with Penguin Slide (directions/undo), Bouncy Launch (aim/power/release), and then Bounce Back (one paddle per player). Test on real connected controllers; keyboard emulation alone does not verify them.

This is a contained shell feature with persistence work. Full simultaneous multiplayer across the catalog is a much larger project. A whole dice board, item economy, online matchmaking, and all-game controller support are not needed for the first party.

## Running a game on the original Switch

Nintendo says the Switch does not provide an Internet browser. There is no supported route to open this PWA as an ordinary website on the home console. [Nintendo browser FAQ](https://www.nintendo.com/sg/support/qa/detail/34190).

| Route | What it accomplishes | Work or limitation |
| --- | --- | --- |
| Computer connected to the TV | Plays this project on the couch; controller support can be added incrementally | Runs on the computer, not the Switch. This is the recommended near-term test. |
| [Game Builder Garage](https://www.nintendo.com/au/games/nintendo-switch/game-builder-garage/) | Build and play a small original game directly on the retail Switch using Nintendo's visual tools | Recreate an idea within that application; it is not an importer/exporter for this TypeScript/Pixi project. |
| Official native Switch development | Build a standalone console game through Nintendo's development and distribution process | Separate platform approval, development hardware, a console runtime/port, and release review. A developer account alone does not turn a retail console into a development unit. |

Nintendo accepts individual developers and home offices; registration and tool downloads are free, while development hardware costs are provided inside the portal. Switch access requires a separate application. Publication requires a publishing agreement, rating, and Nintendo review. The public pages do not establish a private sideloading channel for arbitrary builds on a retail Switch; confirm any testing/distribution arrangements after approval rather than promising that an account lets this home console run them. [Developer FAQ](https://developer.nintendo.com/faq), [official process](https://developer.nintendo.com/the-process).

For this codebase, the port is substantive: Pixi/WebGL rendering, DOM/pointer input, Web Audio synthesis, browser speech, IndexedDB, HTML parent controls, and service-worker installation are all browser dependencies. The pure game rules, seeded puzzles, content, tests, and procedural-art designs are useful material to carry over. A suitable licensed JavaScript runtime or specialist port might retain some code, but no compatible path has been verified for this project; do not assume an HTML wrapper suffices.

An engine with a supported console route is another option. [Unity documents](https://unity.com/solutions/console) platform approval and Unity Pro or an applicable platform license key for console modules. [Godot documents](https://godotengine.org/consoles/) approved developer access and private console middleware/export templates, including third-party Switch support. Neither removes Nintendo approval or the work of adapting this game's rendering, input, audio, speech, and saves. Do not choose or migrate engines before a single-game feasibility test.

If native Switch becomes a firm objective, first prove one controller-driven game with rendering, procedural sound, save/load, suspend/resume, and the intended docked/handheld controls on approved development hardware. Resolve spoken support explicitly: the current browser speech API cannot be presumed available, and replacing it with recordings would change the project's no-imported-audio rule. Only then estimate a small party collection or the full island. Devkit price, access timing, engine/middleware fees, and port duration remain unverified; no cost or delivery date is promised here.

For now: **three-choice party in the browser → controller/TV trial → decide whether a small native Switch game is worth pursuing**. Switch feasibility should not block the playable browser slice.
