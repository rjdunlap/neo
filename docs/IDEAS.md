# Puddle Island ideas

The one notebook for future play: game concepts, modes for existing games, new gestures, story and world ideas, and the references behind them. Everything here is a **proposal**, not an instruction or a promise. The [roadmap](ROADMAP.md) chooses what gets built and in what order; [GAMES.md](GAMES.md) describes what already exists; [DESIGN.md](DESIGN.md) describes the shared systems.

How to use it:

- **Prefer a mode of an existing game** when the meaningful action is the same; make a new game when the learning or the controls differ. The [overlaps table](#overlaps-and-scope-decisions) records decisions already made.
- **Before promoting an idea** to the roadmap, specify a complete round, the learning goal, a support ladder, how mistakes and experiments are handled, and a verification plan. A source title is inspiration, not a design.
- **Effort** is relative and includes content and verification: **S** = a contained mode or small game; **M** = a new activity with rules and art; **L** = several scenes, a substantial simulation, or persistent systems. It is not a time estimate.
- When an idea is built, remove it from the candidate tables here and give it an entry in [GAMES.md](GAMES.md).

**Already built:** see [GAMES.md](GAMES.md); each game's entry names its inspiration. Rows for built ideas are removed from the tables below, and the notes on the ones moved out are in [the completed-work archive](archive/COMPLETED-2026-10-09.md#from-the-idea-notebook).

**Closest to buildable.** The roadmap's [Next up](ROADMAP.md#next-up) chooses among these, and every decision they wait on is collected under [Waiting on the developer](ROADMAP.md#waiting-on-the-developer).

| Where | What is there |
| --- | --- |
| [Sketches (first drafts of the definition of ready)](#sketches-first-drafts-of-the-definition-of-ready) | Fill and Dump, Sing-Along Barn, Number Trails, Read & Do |
| [Sketches for the next two to build](#sketches-for-the-next-two-to-build) | Memory Match 10–12, Pattern Train 10–12 |
| [Fun and arcade review](#fun-and-arcade-review-2026-10-09) | Lander and Drift, a real-time grown-up game; waits on a scoring decision |
| [Short-ladder audit](#short-ladder-audit-2026-10-09) | Every school-reaching ladder, with the ordered list of next decisions |
| [Candidates](#candidates), [Gap review proposals](#proposals) and [Extend existing games](#extend-existing-games-before-making-duplicates) | The rest; each needs its definition of ready first |

## Design lessons

### What to borrow from JumpStart and Neopets

JumpStart 1st Grade put activities in recognizable school spaces with a recurring guide; its cafeteria used serving food to introduce fractions, a model for making a learning action belong in its setting ([gameplay reference](https://en.wikipedia.org/wiki/JumpStart_1st_Grade)). A contemporary review of JumpStart 3rd Grade describes exploring rooms, gathering clues and using an activity's answer in a later task, and also confusion about destinations and vocabulary: borrow the continuity and purpose, while making every destination and clue replayable and easy to find ([Leslie LaRose's 1999 review](https://people.potsdam.edu/betrusak/reviews/jumpstart3rdgrade.html)). Neopets connects a persistent companion with a broad world of activities; pet customization and Neohomes suggest a home and collection that matter beyond any one round ([customization help](https://classic.support.neopets.com/hc/en-us/articles/17705564361741-How-do-I-customize-my-pets), [Neohome Central](https://www.neopets.com/neohome/)). These are design judgments for this project, not claims that nostalgia proves educational effectiveness.

| Design lesson | Puddle Island translation | What makes it educational and fun |
| --- | --- | --- |
| A familiar cast makes activities memorable | A gardener, postkeeper, cook, and inventor recur across games and short stories | Learn their preferences, hear new vocabulary in context, and see a funny response to help |
| Give practice a purpose in the world | Repair a picnic cart, find a missing melody, or prepare a visitor's room | Counting, listening, and planning visibly change the situation |
| A small mystery gives several games a shared destination | Two or three illustrated clues lead to a reveal; any step can be resumed | Remember evidence and apply it somewhere new, with no repetitive point quota |
| Let the player choose where to go | Free play stays one tap away; adventures are optional invitations | Agency and curiosity, without a compulsory curriculum route |
| Collections can tell a personal story | A field journal records friends met, experiments tried, and things made | Revisit, compare, classify, and retell; all entries have known ways to find them |
| A home makes rewards useful | Arrange decorations, display a picture, and hear a saved tune | Creative expression, spatial language, and ownership; no upkeep debt |
| A strong arcade loop is worth revisiting | A ball ricochets, helpers carry a load, an order becomes a silly feast | The learning changes the action itself; avoid interrupting play with unrelated quizzes |

### How a classic becomes a Puddle Island game

- **Learning progress is not lost.** There are no lives, drains, crashes or game over. A miss bounces back, waits, or gets a gentle “try again.” An older economic simulation may let a visible, low-stakes choice shrink that round's pretend purse when the consequence is causal, bounded and recoverable; it never removes stickers, creations, permanent unlocks or previously owned things.
- **Speed belongs to the child.** Nothing ends on a timer. Things move slowly and wait to be noticed.
- **The physics is the reward.** Bounces, wobbles, splashes and pops give the "one more go" feeling without a score.
- **A loop can grow across the bands when that makes sense:** lap is free play and cause and effect; toddler a single simple goal; preschool a named target (a color, a number, a shape); pre-K counting, patterns, memory, comparison or planning; early school applied number work, deduction, comprehension, design and debugging. A game can start at an older band without an artificial toddler mode.
- **Drawing is a control, not just art.** The Nintendo DS touch games (Yoshi Touch & Go, Kirby Canvas Curse) are the nearest ancestors of iPad play: draw a line and a character rides it.
- **Undo instead of failure.** For puzzle games, a big rewind button (as in Braid) lets a child try something without consequence.
- **Big, soft targets have a long history.** In 1983 Atari shipped a Kid's Controller with twelve large soft buttons for its Sesame Street games.
- **Boundaries:** no energy meters, streaks, ads, real-money shops, paid or opaque random rewards, or gacha collection pressure; no microphone, camera or body tracking unless a grown-up opts in; no shooting or fighting (Space Invaders, Asteroids, Missile Command, Geometry Wars, Math Blaster, Worms and Castle Crashers are out, as are scary themes like Limbo). Their *motions* can survive in friendly form: aiming becomes tossing, and catching replaces defending. An older-band wheel may use earned pretend tickets, disclosed odds and bounded cosmetic rarity when probability and opportunity cost are the activity.

### What not to borrow

The same references show patterns that conflict with this project's rules:

- **Care that decays.** Neopets pets grow hungry while their owners are away, and early Club Penguin puffles could run away if neglected. The treehouse must never punish a break.
- **Memberships and manipulative scarcity.** Webkinz, Moshi Monsters and many pet apps gate rooms, items or play behind memberships, codes or limited-time events. Keep stickers predictable; never sell access, expire an offer or make a break cost progress. A bounded offline Harbor currency may support saving, spending and child-chosen older-band unlocks, with the existing trail kept open and a grown-up open-all switch.
- **Daily obligations.** Neopets' dailies and similar streaks turn play into a chore. A voluntary bank certificate may mature automatically in real time because waiting and interest are its lesson; it must never require a daily claim or penalize absence.
- **Countdowns and chasers.** Potato Counter's timer, Number Munchers' chasing Troggles, and the clocks that let everyone lose together in cooperative board games (Hoot Owl Hoot!'s sunrise, First Orchard's raven). Keep the shared goal and drop the clock.
- **Peril.** The Oregon Trail's illnesses and deaths, Carmen Sandiego's thieves, and *Peter and the Wolf*'s wolf. Use a friend's trip, a mix-up, or the music alone instead.
- **Ads and upsells** in free pet apps.

## Candidates

The ideas closest to being built. The roadmap's [next-up list](ROADMAP.md#next-up) picks among them.

| Idea / likely range | Play and learning | Smallest useful version | Effort |
| --- | --- | --- | --- |
| **Story Theater / 4–8** (Living Books, JumpStart, puppet play) | Choose characters, arrange events, then watch a narrated little show; at 6–8, choose an ending supported by clues, or change one event and compare its consequences | Extend Story Steps with one branching story and a replay stage. Pairs with **Busy Picture** (a storybook page where everything reacts, words lighting as they are read). Review each story's clues and acceptable endings; free theater accepts any creation | M |
| **Shape Buddies / 4–8** (Snipperclips) | Two paper creatures need to carry a rolling seed to a pot, using three reversible shape tools: flatten, scoop and slope. A child can switch between both; a grown-up can take one side | One gap and one known workable construction, from predefined silhouettes (no arbitrary cutting); later a different arrangement, or two useful shapes combined. Keep multiple successful arrangements valid | M |
| **Sorting Machine / 8–11** (Rocky's Boots, Gertrude's Secrets) | Critters ride past a gate with one sensor (a hat opens it); then join two sensors with AND, OR and NOT tiles and test the machine on a parade of critters, with a visible history | Continues Critter Sort → Critter Crossing → Rule Parade with a visible machine instead of words | M–L |
| **A third Quick Tricks show** (a gesture test) | Wind the Music Box (crank), Fill the Cups (pour) and Loop the Fireflies (lasso); see [below](#a-third-show-new-gestures) | Three tricks and a finale in the existing Quick Tricks show format | S–M |
| **Silly Describer / 4–8** (Scribblenauts) | A giraffe wants a scarf that reaches its shoulders: choose a picture word to make the scarf longer; it becomes so long two friends share it. Another scene needs a small box to fit a shelf | Three nouns and four carefully authored modifiers, every valid combination with a defined visual result; ask what changed through a picture choice. No free text, voice recognition or online service | M |
| **Toy Drawer / 3–8** (A Little to the Left, Unpacking) | Arrange six toy bugs in a box by color or by size; the bugs settle into a different little dance for each complete rule. Older levels ask "Can you find another way?" or combine a size order with paired colors | Start as a Size Parade or Color Garden extension if their rules fit. An optional model if she wants a puzzle; free arranging stays valid. Never imply one morally correct way to organize belongings | S–M |
| **Wobble Works / 5–8** (World of Goo 2) | Build a short bridge from large snap-together pieces and walk a sleepy hedgehog over it; a supported beam stays level while an unsupported one sags. Later compare two designs with the same pieces, or change one support with the load fixed | An authored set of stable and unstable constructions explained as a simplified model; a soft cushion catches everything and replay returns the exact construction. Complements Chain Reaction (supporting a load, not routing a ball); `engine/ball.ts` is not a structural simulator | L |
| **Rule Parade / 7–10** (Baba Is You) | Three big tiles read aloud as "Blue friends can cross"; move a red tile into the first slot and test who crosses. Later connect a visible condition to an action (friends with hats hop; without, wave), with a trace of which rule applied and undo | Two conditions and two actions, one rule at a time; interactions between rules much later. Icons and narration support emerging readers | M (tiny), L (interacting rules) |
| **Buddy Delivery / 4–8 together** (Nintendo Land's attractions) | One player chooses a destination from a picture request while the other guides a wagon, then they swap; later a route with two stops in an order chosen together | A Mail Carrier extension with a one-player toggle; the map stays visible to both, so cooperation never depends on hiding half an iPad | S–M |
| **Raft Delivery / couch, 2 players** (Super Mario Party's Partner Party and River Survival) | One player paddles each side of a raft; collect supplies and dock together | A new couch activity with a solo helper and a fixed delivery goal; the strongest small controller experiment from the party research. Bounce Back is the existing two-controller game to learn from first | M |
| **Complementary jobs** (WarioWare: Get It Together!) | Quick Tricks for two: one player holds a bridge while the other carries a parcel | A Quick Tricks show where each trick has two roles, keeping the island's forgiving pacing | S–M |
| **Number Merge / Number Friends** (Threes, 2048; Numberblocks, DragonBox Numbers) | Slide or drop two number friends together and they join into a bigger number that says its name; split a 5 into two friends every way | "Make a 5": choose which tiles add up, with no full-board loss; towers of ten later | S |

### Smaller seeds

Scenes and modes worth keeping on the shelf; most belong inside an existing game or a Quick Tricks show.

| Idea | First complete loop | Learning / likely fit |
| --- | --- | --- |
| **Shadow Stage** | Move a lamp or prop until its shadow fits one large silhouette; the puppet then dances. | Position, shape, and light; 4–8. Distinct from simply matching a shadow card. Use an explicit simplified light model. |
| **Parcel Peek** | Reveal a wrapped shape one flap at a time; choose its matching object whenever ready. | Shape inference and vocabulary; 3–6. More reveals cost nothing. A Peek and Think activity. |
| **Puddle Pipes** | Turn three chunky pipe elbows so water reaches a thirsty flower; watch the route fill. | Connectivity and planning; 4–8. A snapped-piece alternative to the existing free-drawn Water Paths. |
| **Fairground Lift** | Put a counterweight in a bucket until a puppet rises to a window. | Equality and comparison; 4–8. A Seesaw Balance mode, not a new physics system. |
| **Sound Detective** | Hear a short sequence—bell, splash, footsteps—and arrange three scene cards to show what happened. | Listening and event order; 4–8. Use synthesized sounds with unambiguous pictures; an extension of Story Steps. |
| **Fold a Friend** | Fold one half of a paper creature over a visible crease, then unfold a matching pair of wings. | Symmetry and prediction; 4–7. Extend Bug Builder with a visible transformation. |
| **Fossil Dig** | Brush sand away to uncover bones, then fit them into a skeleton outline; the dinosaur stretches and yawns. | Careful uncovering, part–whole and early science words; 3–8. Reuse Splish Splash's scrubbing and Puzzle Pals' pieces; review any facts about real dinosaurs. |
| **Magnet Fishing** | A magnet on a fishing line lifts the keys and spoons but not the leaves and shells; sort what it catches. | Magnetic and non-magnetic materials; 4–8. A mode of the proposed Fishing Pond, treating guesses as unscored predictions, as in Sink or Float. |

### Story episodes and the personal world

The Windy Picnic set the pattern: a friend has a concrete need, two or three actions help, and the scene remembers what changed. A story pilot needed no world framework (a route, a scene and one save field), and later episodes should reuse that pattern before any general story engine. Each Poptropica island, a self-contained story a child can finish and revisit, is the right size for an episode.

- **Next episodes:** a missing melody or a mixed-up delivery; **the Woodland Picnic** in Wonder Woods, using Mail Carrier's map; **Mother Goose Muddle** (after Sierra's Mixed-Up Mother Goose: carry Bo Peep's sheep and other lost things home one at a time, each with its rhyme as a song; public-domain rhymes, resumable steps); **Postcard Detective** (after Carmen Sandiego: a traveling friend's postcards show an animal, a plant and the weather, and she works out which island place each came from; real-world facts need review). Carrying what she made into a story needs the [typed story result](DESIGN.md#proposed-story-results).
- **The treehouse and journal:** entries from Photo Safari, Seesaw Balance and Bouncy Launch are built, as is showing the exact action that found each one. Candidates are notes she adds herself and a saved-project shelf to continue or show a grown-up. Lemonade Stand (built) teaches value with a pretend operating purse that lives only inside its round, and a later bounded Harbor balance can teach saving and spending; neither buys stickers, removes creations or turns the treehouse into upkeep. **Story Weaver** (after MECC's Storybook Weaver, Kid Pix and Drawn to Life) makes a three-page picture story the pet narrates; it depends on bounded creation storage, which now exists.

## Grown-up play candidates (couch route)

Proposals for the couch route, written after the first grown-up playtest (2026-10-07): Pond Practice, the Five Ponds and Cloud Hopper were fun, and Penguin Slide's restart did not work (now fixed). What those courses share is the template for everything below: **a fixed puzzle, an exact best possible number, one precise control and a reason to run again** (beat your own best, or close the gap to par). The [roadmap](ROADMAP.md#grown-up-play-the-couch-route-for-one) orders the work.

**Ground rules for a grown-up game.** The couch route may be harder and more exacting than the island, but the rest of the island's rules hold: no lives, streaks, dailies, ads, purchases or loot; a score is a personal best in its own unit (slides, launches, entries, words); a timer may be a second statistic but never ends a round; a wrong move costs a try, not the run; every game has a start-over and a way to ask for help, and help is recorded apart from unhelped runs. Games are controller-first (stick or d-pad, a bottom button, a left button, pause) with the arrow keys and Enter as the fallback, because the main case is the TV with a controller. A **Settings** page records where she is playing (TV with a controller, laptop with a keyboard, later a tablet by touch); a game that needs letters is offered only for the laptop and says so before it starts, and a game that supports pointer play shows its own buttons only there. No combat: the motions of Typing Terror, Snake or Tetris survive; destroying things does not.

**Research notes.** Neopets' own games point at the genres missing from the island: *Typing Terror* (type the word on each approaching robot; five levels, then a boss round of 25 eight-letter words, with an accuracy bonus; [guide](https://thedailyneopets.com/neopets-games/typing-terror)), *Spell or Starve* (chain letters into dictionary words in a rotating board, with a five-minute limit; [guide](https://thedailyneopets.com/neopets-games/spell-or-starve/)), *Sutek's Tomb* (a match-three with a no-clock Zen mode; [guide](https://pinkpt.com/sutekstomb_sub1.htm)), *Meerca Chase* (snake-style steering that avoids your own trail; [guide](https://pinkpt.com/meercachaseii_sub2.htm)), *Pyramids* (solitaire) and *Hannah and the Ice Caves* (a platformer where two characters collect every treasure chest). The official [Mega Mini Games Collection](https://store.steampowered.com/sub/1485653) of 26 of them offers Arcade, Challenge and Endless modes, which parallel the couch trips and courses plus one missing piece, an endless run. For logic puzzles, nonograms are the best-proven controller genre (Nintendo's [Cross Pix 2](https://ec.nintendo.com/AU/en/titles/70010000103550) maps select/mark, check, toggle-X and center to buttons; its sibling Picross S is [timed and has no touch input](https://nintendoworldreport.com/review/45619/picross-s-review-switch)), then inequality and arithmetic grids (Futoshiki, KenKen), sudoku and bridges; Kakuro's clue cells make a cursor busy. [A Little to the Left](https://www.gameinformer.com/review/a-little-to-the-left/tidy-tranquility) shows the appetite for untimed, several-answer tidying puzzles. **On "brain training":** the best review found practice improves the practiced task and little evidence of broader or real-world benefit ([Simons et al. 2016 summary](https://www.psychologicalscience.org/publications/brain-training.html)), so the drills below are games with a personal best, never claims about the mind.

| Idea (after) | Play and skill | Smallest useful version and controls | Effort |
| --- | --- | --- | --- |
| **Ice Blocks** (Sokoban, Pengo; a mode of Penguin Slide) | The penguin pushes a block of ice that slides until it hits something; park it to open a path | New levels on Penguin Slide's breadth-first-search solver, which already proves the minimum; best enjoyed as a third course. Extends the game the playtest liked rather than starting a new one | S–M |
| **More par courses** (built games) | Light Lab (fewest turns), Robot Path (fewest steps), Memory Match (fewest flips on a fixed board), Secret Code (guesses) | Each needs a frozen board list, a solver or search for the minimum, and a `couchcourse` entry. Secret Code has no obvious exact minimum; choose a par rule before building | S each |
| **Tile Pairs** (Mahjong solitaire; Pyramids) | Remove matching pairs of free tiles from a layered stack; a calm clear-the-board | Boards built backwards, so always solvable; d-pad hops between free tiles, the bottom button picks; undo is free and counted. Score: undos and shuffles | M |
| **Gem Swap** (Sutek's Tomb, Bejeweled, Candy Crush) | Swap two neighbors to line up three; as puzzle levels, clear the board in N moves | Untimed: "clear these in N moves" boards plus a Zen mode with no limit, as Sutek's Tomb had. d-pad and one button | M |
| **Snowball Merge** (2048, Threes) | Slide a board so equal numbers join | Pure d-pad. A seeded sequence, an undo that counts, and a "reach 512" course instead of a loss screen | S |
| **Pond Typing** (Typing Terror, ZType; a keyboard-only extra for the Laptop setting) | Type the word on each bubble to pop it before it drifts off the top | Friendly: bubbles, no robots and no lives; a wrong key only lowers accuracy and never ends anything. Letter, word and sentence levels, then a fixed 25-word boss list; accuracy and words per minute are separate personal bests. Needs letters in the couch input, which today reads only a few keys | M |
| **Letter Pond** (Spell or Starve, Boggle) | Chain adjacent letters into words in a board; find the longest and the most | The d-pad walks the chain, so it works on a controller; a bundled, reviewed word list as data, with par as the number of words the board holds; no clock; "turn the board" to reshuffle. Word Search is the gentler sibling (themed lists) | M |
| **Brain Break** (Brain Age; Stroop, Schulte tables, mental arithmetic) | Sixty-second drills: name the ink color of a color word, tap 1 to 25 in order, quick sums, echo a tune, count a flash of critters | Each drill is a fixed seeded course with a personal best; first three only. Honest framing: games with a score | S each |
| **Pyramid Solitaire** (Neopets' Pyramids; Klondike, FreeCell) | Remove pairs that add to 13 from a pyramid of cards | Code-drawn cards; deals proven solvable by search; d-pad cursor. FreeCell later, since its deals are almost all solvable | M |
| **Two boards at once** (Penguin Slide and Garden Rows face-offs) | Face-off on side-by-side boards of the same seed, instead of taking turns | Needs the `twin` games to render two boards in one scene; a proposal in the roadmap's parked list | M |
| **Shared-cursor co-op** (Sudoku Garden for two) | One partner chooses the square, the other the number | Both controllers on one board; the pet takes the second seat when alone | S |
| **Endless runs** (Mega Mini Games' Endless) | "How many boards in a row" with no end screen, only a record | Opt-in per game; the couch counterpart of the parked "Keep playing" mode | S |
| **Lander and Drift** (Lunar Lander, Thrust; Asteroids' motion without the shooting) | *Fun action:* turn and thrust a small lander onto a lit pad against gravity; Drift collects stars in a wrap-around sky on the same flight model. *Skill:* judging momentum and touching down gently | One flight model in fixed 1/120 s steps (as Bumper Garden moved to). Stick turns, bottom button thrusts, left button levels the lander; a speed band and guide arc; a hard touchdown bounces and counts a bump, never ends anything; fuel is a counter, not a limit. Terrain and pads from `ctx.rng`, an autopilot as the bot, frozen terrains as a course. Scoring is a decision ([below](#fun-and-arcade-review-2026-10-09)) | M, two modes |
| **Time Trial with a ghost** (Micro Machines, Trackmania, Mario Kart ghosts) | *Fun action:* steer a small boat round a track against a faint copy of your best lap. *Skill:* smooth steering and racing lines | Top-down, automatic throttle, stick steers, a button brakes; the ghost is a deterministic replay in fixed steps; frozen tracks as a course. The ghost, not an opponent, is the reason to run again. A lap time as the main score needs a ground-rule change | M–L |
| **Mini Putt** (Mario Golf; the grown-up form of the island's Mini Golf idea) | *Fun action:* aim and power a putt round walls and bumpers. *Skill:* geometry and judging power, with bank shots | A top-down roll with friction, walls and slopes. `engine/ball.ts` is a side-view gravity simulation with pegs and a ceiling, so it does not carry over; only its deterministic, previewable design does. Par from a search over aim and power; nine frozen holes as a course; face-off by turns on the same hole | M |
| **Hidden Pond** (hidden-object apps; the grown-up form of Critter Spotter) | *Fun action:* find twelve named things in a crowded, code-drawn scene. *Skill:* visual search | The stick moves a cursor, a button marks; scenes composed from the seed so no target is fully covered (a test); a hint ring; no timer; hints used is its one statistic, a deliberate exception to the exact-best template | M |
| **Pond Jigsaw** (jigsaw puzzles) | *Fun action:* sort and fit a picture from 48 to 150 pieces. *Skill:* spatial matching and patience | Code-drawn scenes cut with the texture technique Puzzle Pals uses; edge pieces first; the controller carries a piece and it snaps within a margin; joined pieces move together; no timer, par or score, a deliberate relaxing exception to the exact-best template | M–L |
| **Word Code** (Wordle; a sibling of Secret Code) | *Fun action:* guess a five-letter word, each guess marking letters right, in the wrong place, or absent. *Skill:* deduction with vocabulary | Secret Code's feedback with letters; a letter wheel on the d-pad; a bundled, reviewed word list and block list as data. Needs a par rule first: there is no exact minimum | M |
| **Block Garden** (the calm side of block-placement puzzles; the set-aside Tetris item, revisited) | *Fun action:* drag shaped pieces onto a 10 by 10 board and clear full rows and columns, with nothing falling and no clock. *Skill:* spatial planning | Touch drag, or a controller cursor and a rotate button; three pieces at a time from a seeded sequence. It ends when nothing fits, so: a free undo, a reshuffle that counts as a try, and fixed-sequence puzzles ("clear the board with these pieces") scored in tries. An endless run only as the opt-in | M · grown-up |
| **Marble Jump** (peg solitaire) | *Fun action:* jump a peg over a neighbor into a hole, removing it, to leave one. *Skill:* planning | English, French and triangular boards. Exhaustive search is feasible (the English board has about 23.5 million reachable positions), so the exact fewest pegs left is the par; compute it offline and freeze it with the board, as course data is, because 33 holes overflow 32-bit bit operations and the search is heavy for a test run. A test can search the 15-hole triangle exhaustively and check the frozen results against known solutions. Tap a peg, tap a hole; a free undo | S–M · grown-up |
| **Photo Hunt** (spot the differences; the grown-up form of What Changed?) | *Fun action:* find what differs between two near-identical code-drawn scenes. *Skill:* visual comparison | The differences are generated from the seed and known exactly (a test: each is visible and none overlap), so a board is "found all of them"; tap; a hint ring; no timer. Hints used is its one statistic, a deliberate exception to the exact-best template | M · grown-up |
| **Card Table: FreeCell and Klondike** (AARP features Klondike, FreeCell and Spider; Pyramid is a row above) | *Fun action:* move cards onto the foundations. *Skill:* planning | One card engine with code-drawn cards; tap to move or drag; a free undo that counts. FreeCell is full information and almost always solvable (all but #11982 of the Microsoft 32,000; roughly one deal in 84,000 overall), so a solver checks each deal, but its par is a solver's best, not a proved fewest. Klondike is about 82% winnable even with every card known, so it is luck-dependent: a deal is kept only if a solver wins it, which still does not promise a win to a player who cannot see the face-down cards. A deliberate exception | M · grown-up |
| **Dominoes** (block and draw games) | *Fun action:* match an end and empty your hand. *Skill:* matching and counting spots | Tap or drag a tile; bots fill the other seats; the rules are public; luck-heavy, a deliberate exception. Two homes: a grown-up table of two to four, and an island form with a grandparent beside her, where matching dots carries counting but takes the whole island contract (a band, a how-to card, voice lines, a sticker) | M · both |
| **Pond Bingo** (bingo, picture lotto) | *Fun action:* a caller draws, you mark what matches. *Skill:* attention and recognition | One to four cards on a shared screen; the caller speaks; picture cards for her, numbers for grown-ups; marking by hand is the default so attention is the game; luck, a deliberate exception | S–M · both |
| **Board games against the pet** (four in a row, mancala, checkers; Four in a Row is already in the mechanic table) | *Fun action:* a quick match against a friendly opponent. *Skill:* looking ahead | One board engine and a small search for the pet's moves; the search depth sets difficulty and works as a handicap, so two adults of different skill can play fairly; two people on one device take turns. Generic names, not Connect 4. An island form for her would need the full island contract | M · grown-up |
| **Pond Pinball and Brick Breaker** (two ball games for the same engine) | *Fun action:* flippers and bumpers, or a paddle and a wall of bricks. *Skill:* timing and angles | Pinball extends Bumper Garden, which already builds its flippers from small circular pegs inside `engine/ball.ts` and has a pot that catches the ball so it never drains (a table would keep that). `ball.ts` collides with circles and walls only, so Brick Breaker needs rectangle collisions. A personal best in points, Game pace as the slow option | M · grown-up |
| **Color by Number and quiet toys** (adult coloring books; sand-garden raking, stacking stones) | *Fun action:* tap a region and it fills; rake the sand; no score and nothing to fail. *Skill:* none claimed (relaxation is a reason 79% of 50+ players give) | Pictures drawn from palette letters, as Pixel Pictures does. The couch save has no creations store and its results must never reach the child's save, so a kept picture needs a bounded couch gallery with the same repair and backup rules; it cannot hang in her treehouse | S–M · grown-up |
| **Board numbers** (a platform feature) | Play the same puzzle as someone far away by typing its number, and compare over a phone call | A number gives the same board only if its generator never changes, so each generator carries a version inside the number, as courses do. No server, no daily, no account; a number pad that touch can use | S–M per game · grown-up |
| **Tile Village and Island Builder** (Dorfromantik, Islanders; the cozy side of Little Town Planner) | *Fun action:* place a tile or a building where it fits and watch a village grow; matching edges and suiting neighbors score. *Skill:* none claimed (planning) | A seeded stack of tiles or buildings, a drag or a cursor and a turn button; no fail state, quests as optional goals, a personal best in points. Edge matching and adjacency scoring are rule-testable. No exact best, a deliberate exception | M · Lantern Lake |
| **Unpack the Room** (Unpacking, A Little to the Left; the grown-up form of Toy Drawer) | *Fun action:* take things from a box and find each a place. *Skill:* none claimed | Code-drawn items and a room; each item has several sensible homes, so there is no single correct arrangement (the island's creative rule); a nudge says where it was found; no score. Keeping a room needs a bounded gallery | M · Lantern Lake |
| **Cottage Garden** (Stardew Valley, Animal Crossing; the grown-up form of Little Farm) | *Fun action:* plant, tend and decorate a plot, with a *next day* button that moves in-game days. *Skill:* none claimed | No real-time waiting, and nothing wilts or waits for her (the island's rule); blooms form patterns she can arrange. A kept plot needs a bounded per-profile save with repair and backup | M–L · Lantern Lake |
| **Escape Room** (point-and-click puzzle rooms; the grown-up cousin of the Windy Picnic) | *Fun action:* a room whose locks are puzzles the catalog already has. *Skill:* deduction | One room, six locks (Lantern Lights, Secret Code, Pattern Train and the like) and items to find; resumable steps like the picnic; a family can solve it together on one screen. Art-heavy | L · Lantern Lake |
| **Pond Charades** (charades, Pictionary) | *Fun action:* a card shows a picture, one person acts or draws it, the others guess aloud. *Skill:* none claimed | The tablet is the deck, with picture cards so a toddler can guess "cat", and a draw pad for the drawer; no score, no timer, no network. Cards come from the existing art | S–M · both |
| **Roll Table** (bowling, curling and pool on one rolling simulation; the grown-up form of Pin Roll and Mini Golf) | *Fun action:* flick a ball at pins, slide a stone to a target, or pot a ball. *Skill:* judging weight and angle | Top-down rolling with friction and ball-to-ball hits, which neither `ball.ts` nor Mini Putt's roll has; bumpers (gutter guards) on or off for each player are the handicap; turns | M–L · both |
| **Hop Course** (obstacle-course platformers; Hannah and the Ice Caves is the Neopets one) | *Fun action:* run and jump through a course of ledges and gaps. *Skill:* timing | Checkpoints, no lives, an instant restart that counts as a try; fixed-step physics; left, right and jump buttons on touch. Ages about 9 and up | L · Maker Harbor |
| **Beat Hopper** (Geometry Dash; a one-button rhythm runner) | *Fun action:* a figure runs by itself and a tap hops it to the beat. *Skill:* timing | The music carries the course; a miss goes back to the last checkpoint at no cost beyond a count; fixed-step; timing windows are playtest values, as with Stomp Steps. Ages about 9 and up | M · Maker Harbor |

**Built and moved out of this table** (each has an entry in [GAMES.md](GAMES.md); the notes are in [the archive](archive/COMPLETED-2026-10-09.md#built-ideas-as-written)): couch settings, Sudoku Garden, Lantern Lights, Picture Logic, Harbor Rush (a couch mode of Ferry Jam), Word Search, Island Bridges and Pond Conga. **Still open from those ideas:** Sudoku Garden's keyboard digit entry, a daily bed, other sizes, killer and other variants; Lantern Lights' 6 by 6 level; Picture Logic's replay, her own pictures and colored puzzles; Letter Pond, the word chain that Word Search is the gentler sibling of; Pond Conga's two lines on one pond and a wrapping pond. Pond Conga is scored in steps against an exact fewest, not the proposed "fewest bonks, then time", because a bonk count of zero rewards nothing (circling slowly costs nothing).

Considered and set aside: Tetris-style falling blocks (a real-time pressure game, and the island has no fail state to give it; revisit as a calm "no speed-up" mode), Minesweeper (a wrong guess ends it; a gentle "garden sweep" could mark mistakes instead), crosswords (a clue bank is a large authored-content task), trivia (fact review) and Cheat! (a bluffing game against bots).

### Fun and arcade review (2026-10-09)

The request: add games that are fun first and "educational" second (Lunar Lander and its cousins), aimed mainly at the older end for mental stimulation. **Interpretation:** this is the couch route, which is already where adult play lives, with its own save. No `Band` is added; the ways adult play differs are comfort options in couch Settings (below). Correct this if "older adult bands" meant something else. **Superseded in part (2026-10-09, later):** [Profiles first](ROADMAP.md#profiles-first-one-map-for-every-age) proposes a `grownup` band and comfort questions kept per profile in place of couch Settings. The games and comfort options below still stand.

**Two tracks, because the evidence does not all point at arcade.**

- **Track one, the request: real-time fun.** Lander and Drift, a ghost time trial, Mini Putt. Of the games made only for grown-ups, five are logic puzzles and one (Pond Conga) is arcade. The island's real-time games on the couch (Bouncy Launch, Egg Catch, Bounce Back, Peg Garden, Bumper Garden, Rhythm Neighbors) are short and gentle, and none is a thrust or inertia game, so that family is empty.
- **Track two, what 50+ players say they play.** AARP's 2023 survey of adults 50 and over found puzzle and logic games at 73%, card and tile at 69%, word games at 58% and brain games at 37%; arcade was not among the genres the report's summary listed. The couch has no solitaire or mahjong-style game at all. Tile Pairs, Pyramid Solitaire, Gem Swap and Letter Pond are already rows above; this review moves them up, and adds Hidden Pond, Pond Jigsaw and Word Code.
- **They do not compete** (different code), but the roadmap's step 8b says to choose the next relaxing arcade game after Pond Conga has been played, and nobody has played it with her yet. So: **one** real-time game next (Lander and Drift, built on one flight model), **one** card or tile game, and the comfort options before either.

**Stance.** Fun, not educational: no skill is claimed, a game is described as a game with a score, and **no game here is offered as a health measure**. The brain-training evidence is narrow (practice improves the practiced task, with little transfer to distant tasks), and none of it supports a game proposed here. The survey figures behind the 50+ players' reasons, and the sources, are in [the archive](archive/COMPLETED-2026-10-09.md#the-fun-and-arcade-review-why-they-play-and-the-evidence).

**Lander and Drift, the sketch** (*definition of ready, first draft*).

- **Fun action:** turn and thrust a small lander down onto a lit pad against gravity. Drift is the same flight model in a wrap-around sky: collect the stars and bump harmless rocks, with inertia as the pleasure (Asteroids' motion without its shooting, which the boundaries rule out). *Skill:* judging momentum, and touching down gently.
- **Why it works, and where it is thin.** The 1979 arcade game had no time limit: a round ended only when the fuel ran out, and there were four ship-control difficulty levels. The tension is every burn costing fuel, and failure still paying a little. Reviews of later versions (from search excerpts) say the formula is thin without a reason to go on, so progression must come from the terrain and pads, not from speed.
- **Smallest round:** one terrain, one pad, gravity light. Left stick turns, the bottom button thrusts, the left button levels the lander (assist). A green speed band on the readout, a guide arc for the coming touchdown, no time limit.
- **Crash handling:** a hard touchdown bounces the lander and counts a **bump** (Pond Conga's bonk is the precedent): nothing is lost, the round goes on from there, there is no game over. **Fuel is a counter, never a limit.**
- **Physics:** fixed 1/120-second steps, as Bumper Garden moved to, so a par, a twin face-off and the bot all give the same landing at any frame rate. Terrain and pads come from `ctx.rng`. The bot is an autopilot; the `couchgames` check waits on its `finished` flag.
- **Levels and courses:** terrains with more than one pad (a narrow pad asks for a gentler approach); a course of frozen terrains with a version, like the others. This is also the answer to "levels" for Drift: star runs of increasing count.
- **Island form, if wanted:** a school-band Tinker Lab "Pet Lander" would need a learning purpose (controlling speed); it is not proposed here.

**Decisions this needs.**

1. **Lander's score.** Fuel against a reference autopilot is not an exact best, which departs from the template the first playtest produced. Pick one: (a) *bumps over zero* across a set of pads (exact, and the same shape as Penguin Slide's slides over par), with fuel as a second statistic; (b) fuel against a bot's reference, labeled as a bot reference; (c) a touchdown grade. The lean is (a).
2. **Racing and time.** The ground rules say a timer may be a second statistic but never ends a round. A time trial's main score is a lap time; the round still ends when the lap does, but this needs an explicit rule change before it is a fit.
3. **A Wordle-style game has no exact minimum**, the same problem the notebook already flags for Secret Code, so it needs a par rule first. Wordle itself is not elsewhere in the notebook (the one search hit is "Wordless" in a Metamorphabet row).
4. **Whether a pace or assist setting makes a run "helped".** Records keep helped and unhelped runs apart; a slower pace changes the physics, so it probably counts as its own category.

**Comfort options: audit of what is built, and proposed Settings.** The Game Accessibility Guidelines are a checklist for older and slower players. Couch Settings today has place, sound, music, text size and players, and nothing for pace, contrast or motion.

| Guideline (level) | Where the built couch games stand |
| --- | --- |
| Include an option to adjust game speed (Basic) | None. The real-time games (Pond Conga, Egg Catch, Bounce Back, Bouncy Launch, Peg Garden, Bumper Garden, Rhythm Neighbors) have a fixed pace, classified here from their docs and to be confirmed per game |
| Avoid or provide alternatives to holding buttons (Intermediate) | Only Picture Logic uses a held *button* (painting a run), and a tap on the bottom button already fills one square. Four real-time games ask for a held *stick* instead: Bouncy Launch builds its power by holding down, Egg Catch moves its basket, Bounce Back its paddle and Peg Garden its aim. The guideline is about buttons, but it is the same demand on a tired or unsteady hand, so the Assist and sensitivity settings below should reach them |
| Include an option to adjust the sensitivity of controls (Basic) | Stick hold-to-repeat in six puzzles (Sudoku Garden, Lantern Lights, Word Search, Island Bridges, Ferry Jam, Picture Logic) uses fixed `after` and `every` times (the sampler's comments describe them as parameters), so a repeat-speed setting should be cheap |
| Provide an option to adjust contrast (Intermediate); text size adjustable (Advanced) | Text size exists; contrast does not |
| Avoid flickering images; option to hide background movement (Basic, Intermediate) | Not audited; the shake and particle effects should be checked |
| Include a means of practicing without failure (Intermediate) | Puzzles have start-over and no failure; a practice sandbox is worth adding to the real-time games |

Proposed additions to couch Settings (under [Profiles first](ROADMAP.md#profiles-first-one-map-for-every-age) each person's own comfort questions), all small: **Game pace** (normal, relaxed, slow), **Assist** (levels the lander, steadies a paddle, steers a ghost kart), **Calm visuals** (no shake or flashes, still backgrounds), **High contrast**, and a **repeat speed** for held sticks. They apply to the real-time games; the puzzles need only the last two.

**Levels for the games already built.** The [More par courses row](#grown-up-play-candidates-couch-route) already covers Light Lab, Robot Path, Memory Match and Secret Code. New fun-game courses are listed above: terrains for Lander, star runs for Drift, nine holes for Mini Putt, a handful of tracks for the time trial.

Evidence labels and sources for this review (what was opened and what was only a search excerpt) are in [the archive](archive/COMPLETED-2026-10-09.md#the-fun-and-arcade-review-why-they-play-and-the-evidence).

### Touch, laptop and grandparents (2026-10-09)

The audience widens from "two grown-ups with controllers" to **parents and grandparents**, on whatever they hold. These notes cover where such players are, what it takes to serve them, and a second batch of games. All of it is a proposal.

**Where older players are.** AARP's 2023 report on adults 50 and over found 45% play games, 84% of those on a smartphone, 53% on a computer, tablet or laptop and **28% on a console** (up from 13% in 2019); 81% mostly play alone. The couch already takes a keyboard, so laptops are served; what it lacks is touch, which is the phone (84%) and some part of the 53% that AARP does not split between laptops and tablets. A route without touch reaches the smaller share, and "a phone later" defers the device most of them use. AARP's own games portal, which is a curated menu and not survey data, features Mahjongg Solitaire, a daily crossword, word games, Klondike, FreeCell, Spider and Pyramid solitaire, and a game called "10x10" among its most popular (with "Block Champ" under Arcade; by their names block-placement puzzles, which I did not open); arcade titles are fewer, and it lists no sudoku or board games.

**What touch and mouse play for grown-up games would change.** This breaks contracts that are written down, so it is a decision before it is a task.

- **The written rules.** [AGENTS.md](../AGENTS.md) and [DESIGN.md](DESIGN.md) say the couch stage takes no pointer input (`CouchScene` sets the stage's `eventMode` to `none`), and the README says couch play "is not a phone feature". Touch play changes `CouchScene`, adds a place to `PLACE_CHOICES` (today `auto`, `tv`, `laptop`), gives every game a pointer layer that shows its own buttons only there (the ground rule above already says so), and updates those three documents.
- **It stays inside the grown-up route.** Games remain in `GROWNUP_GAMES` and never in `GAMES`, so nothing moves onto the child's island and the couch save stays separate. **Superseded (2026-10-09, later):** [Profiles first](ROADMAP.md#profiles-first-one-map-for-every-age) stage 3 moves the six couch-only games into the ordinary catalog with a `grownup` band, which retires `GROWNUP_GAMES`.
- **What already helps.** The ghost-finger and mouse-pointer demonstration (`autotouch`, `TouchIntent`, `Demo`) exists for the island's cards, and the couch demo already accepts `finger` and `mouse` input, so a grown-up game's how-to screen can show the input in use.
- **The order.** Tablet and laptop first; a phone later, for the target-size reason below.
- **The name.** "Couch play" is the wrong word on a tablet; the visible label could be "Grown-up games" while the code keeps its names. **Superseded:** the label stops mattering when there is no separate route.
- **A shared-iPad decision, and it is current.** The title screen's "Couch play · C / controller" button is a plain tap shown on every device, unlike the grown-ups' gear, which needs a two-second hold, and the couch's menus are buttons that answer a tap. So today a toddler who taps in can already start a trip and change Settings (names, who is playing, text size, sound). What she cannot do is play: the game stage takes no touch, so course records are safe. Once games answer touch, the records are exposed too. Options: a hold to enter, like the gear; a tap to enter and a hold only for the records and Settings; or leave it, since the couch save is separate and nothing can reach her profile. **Decided 2026-10-09: no hold at entry.** [Profiles first](ROADMAP.md#profiles-first-one-map-for-every-age) moves the protection to the destructive actions, which stay behind the gear's hold, and gives each profile an undo snapshot. **Built (Profiles stage 1):** the title screen and its Couch play button are gone; "Who's playing?" opens anyone's card with a tap, and Enter or a controller button opens couch play.

**Target size.** Studies of older adults point at **about 11 to 16 mm** for handheld touch targets, with 10 mm as a general floor, around 40 mm for a large wall display (a 2025 study of twelve people), and unsettled advice on spacing; tremor research favors tap tolerance, a drag that does not let go when the finger jitters, and slide-based alternatives, and a study of 100 people aged 61 to 92 found pinching to zoom easier than a double tap. These figures are from search excerpts, not the papers. The island's 100-unit rule converts like this (**my arithmetic, to measure on a device**): on a 10.9-inch iPad Air (about 227 by 158 mm of screen) the 1024 by 768 design area fits the 158 mm height, so 100 units are about 21 mm; on a 9.7-inch iPad, about 19 mm; on a 6.1-inch phone held sideways (about 141 by 65 mm) the fit is to the 65 mm height and 100 units are about **8.5 mm**. So the rule is ample on a tablet and short of the older-adult range on a phone. **Decision: which minimum do grown-up touch games use?** Under the island's 100-unit rule a grid of about seven across is the most that fits unzoomed (700 of the 768 units, before the home button and clues). The older-adult range of 11 to 16 mm is about 53 to 78 units on an iPad Air (my arithmetic: 0.206 mm a unit), which allows about nine to thirteen across. Either way, bigger grids need a zoom, which older hands find easy; the table below shows both lines.

| Built or proposed | Touch | What touch needs |
| --- | --- | --- |
| Lantern Lights, Sudoku Garden | Natural | Tap a lantern; tap a square, then a number tray of large buttons |
| Word Search, Island Bridges | Natural | Drag a line, or drag island to island, with a drag that holds on a jittery finger. Word Search runs 8, 10, 12 and 14 across and Island Bridges 7, 9 and 11: past 7 needs a zoom under the 100-unit rule, past about 9 to 13 under the older-adult range |
| Picture Logic | Good | A tap fills, a drag paints a run; the 6 across picture fits, and the 10 and 15 across pictures need a zoom under either rule (the clues take room too) |
| Pond Conga | Fair | A real-time steer by a drag or four large arrows, with Game pace |
| Lander and Drift | Fair | Large turn and thrust buttons or a slider; the continuous control suits a stick better |
| Block Garden, Marble Jump, Photo Hunt, the card games, dominoes, bingo | Natural | A tap or a drag; these suit touch better than a controller |

**Together with her.** Research on grandparents and grandchildren playing is small. A systematic review and others describe short sessions, flexibility, roles that shift between the generations, and a difference in ability as the key factor; one design review says building the relationship should come first; an Open University study found board games over a video call made calls longer and more enjoyable; and the barriers were a grandparent's unease with technology, instructions written for adults, and play happening mostly on special occasions (all from search excerpts). Two homes follow. A game in the **grown-up route** is one she never sees. A game **on the island** with a grandparent beside her takes the whole island contract: a learning purpose, bands, a how-to card, voice lines and one sticker. Each row below says which. On the island, a handicap (an Assist setting, or a gentler pet) is what lets a five-year-old and a seventy-year-old play fairly; in the grown-up route it does the same for two adults of different skill. Online play stays out: there is no account or server, and the Board numbers row below is the nearest thing.

**Second batch of candidates.** Luck games (dominoes, bingo, Klondike) have no exact best; they are deliberate exceptions to the template, as Pond Jigsaw is. Names are generic on purpose. Game ideas, rules and methods, and game names, are not protected by copyright (a name may be a trademark, and a rulebook's text and a board's artwork can be copyrighted; a court summary suggests a video game's own sights and sounds can be too), so these should be drawn and named afresh, avoiding brands such as Connect 4, Scrabble, Yahtzee, Uno, Wordle, Tetris and Candy Crush. This is not legal advice.

**Levels for what is already built.** AARP found 69% of 50+ players say games are not designed with them in mind and that many find games too complicated and need a tutorial. The built puzzles open at 6 by 6 (Sudoku Garden and Picture Logic), 7 by 7 (Island Bridges) and 8 by 8 (Word Search). A gentler way in could be a 4 by 4 bed, a 5 by 5 picture, a 5 by 5 sea and a 6 by 6 grid, offered first to a new player. Saved levels are never renumbered, but a level moves by one inside a band's contiguous range, so an easier level appended above the hard ones would make stepping up run backwards. A new band can instead take its own appended slice ordered easy to hard (see [Profiles first](ROADMAP.md#profiles-first-one-map-for-every-age), which sets out the problem). Open from the earlier entries: colored Picture Logic puzzles, more Pond Conga ponds, Sudoku variants and a 6 by 6 Lantern Lights level.

Evidence labels and sources for this round (what was opened and what was only a search excerpt) are in [the archive](archive/COMPLETED-2026-10-09.md#the-touch-laptop-and-grandparents-review-evidence-labels).

### Cozy games, motivations and profiles (2026-10-09)

The evidence behind [Profiles first](ROADMAP.md#profiles-first-one-map-for-every-age) and the cozy rows above came from search excerpts and none was opened, so it is background and not proof. It and its sources are in [the archive](archive/COMPLETED-2026-10-09.md#cozy-games-motivations-and-profiles-the-evidence). What it concluded:

- **Older players want less competition.** The grown-up place leads with low-competition play, and a face-off is an option and never the default.
- **"Cozy" is mostly the absence of a fail state,** with low stakes, no timers, gentle art, and tending, making or decorating. The project's rules already match, so the cozy builders, Unpack the Room and Cottage Garden belong.
- **Tweens build and make.** Building, creating and obstacle-course games for a 9 to 12 place, not shooters (Fortnite is outside the boundaries).
- **Age to start, play to adjust.** Puddle Island chooses no lock at entry, because the cost of a toddler opening a grown-up's card is low once destructive actions are protected.

## World variety: animals, pets and environments

Today the pet is one creature design (`pip`) in nine colors, which she names (`petSpec()` is `CRITTERS.pip` plus the saved color). Seven more designs already exist as friends in games (cow, duck, pig, cat, bear, dog, bunny, in `src/art/critter.ts`), and the island has five places drawn with `Backdrop` styles. More variety is cheap where it reuses those pieces and costly where it needs new anatomy. Everything here is a proposal; none of it may add care, decay or a currency.

| Idea | What it adds | Smallest useful version | Effort |
| --- | --- | --- | --- |
| **Choose your pet's kind** (Neopets species × color) | At hatching she (or a grown-up) picks the companion's kind as well as its color. Now needed by [Profiles first](ROADMAP.md#profiles-first-one-map-for-every-age): every grown-up profile gets a friend | The seven existing designs are ready: add a `kind` to the saved pet (bounded to known kinds, default `pip`, repaired on load with a migration test), have `petSpec()` use it, and check every place the pet appears: voice lines with `{pet}`, stickers, the treehouse, the couch pet, the hatch scene. Existing saves stay Pip | M |
| **More kinds** (needs new anatomy) | Fox, frog, owl, penguin (already drawn in Penguin Slide), turtle, hedgehog, sheep, mouse, otter, deer, panda, raccoon, koala, elephant, lion and monkey as friends first, pets later | `CritterSpec` handles ears, snouts, wings, horns, tuft, whiskers and spots; most new kinds also need a tail, and some a shell, spikes, a trunk or a beak. Draw two kinds with one new feature each before a list | M each |
| **Patterns and small changes** | Spots, stripes or a scarf on the same creature, free and changeable, so two pets of one kind differ | A `pattern` choice at hatching and in the treehouse; no unlocks | S–M |
| **A couch companion** | Her own pet in couch play (a kind, a color and the name she already types), beside the child's | Stored in the couch save, bounded; it cheers on the finale and the shelf, takes the second seat in Bounce Back and the second cursor in co-op. Never touches the child's pet | S–M |
| **Habitat kits** | A new environment is a bundle: a backdrop style, three or four critters, a prop set and music, then a few existing games dressed in its cast | Candidates: **Tide Pools and Reef** (crab, starfish, octopus, fish), **Rainforest Canopy** (monkey, parrot, sloth, frog), **Desert Oasis** (camel, fennec fox, lizard), **Savanna** (giraffe, zebra, elephant), **Bamboo Hill** (panda, red panda, crane) and **Night Garden** (owl, hedgehog, fireflies). Each should attach to a zone already proposed in the roadmap rather than become a seventh place; pick one and prove a cast swap in two games | M per kit |
| **Couch backdrops** | Each course and shelf screen gets a scene instead of plain paper | `Backdrop` styles are code-drawn and cheap: a daylight frozen pond for Pond Practice, an aurora night for the Five Ponds, a sunrise sky for Cloud Hopper, lantern night for the shelf | S |

## Extend existing games before making duplicates

Proposed modes, by the game they would extend. Steps already built are in [GAMES.md](GAMES.md) and are not repeated here.

| Existing game | Next mode (roughly 6–8 unless noted) | Later stretch, only if useful |
| --- | --- | --- |
| Seesaw Balance | Two different unknown weights, solved by doing the same to both pans (Box Balance below); **Guess the Pumpkin** as an estimation mode (an unscored prediction); **Fairground Lift** for younger bands | 8–10: lever distance as a separate step, as in PhET's Balancing Act |
| Robot Path | Step through and repair one wrong command; a reusable routine | 8–10: conditions, then nested loops, each with a visual trace |
| Little Helpers / Monster Munch / Pet Kitchen | Split a visible group two ways; **Slice to Fit** fractions as measures | 8–10: remainders as friends or items to redistribute, never discarded; **Share Fairly** (the fair share as an average) |
| Mail Carrier | Compare routes; dock routes for a future Maker Harbor | 8–10: several route constraints; shortest route as an optional puzzle |
| Word Monsters / Letter Trails / Rhyme Time | Blend a small set of clear sounds into words; build a word that fits a spoken clue; the pet as a learner who reads the word back (after Teach Your Monster to Read) | 8–10: meaningful prefixes; content review before adding rules |
| Song Maker / Sound Garden | Compose an answer to a phrase; alternate parts with the pet; **Sing Higher** (sliding pitch snapped to pentatonic steps) | Longer forms and rhythm changes; keep the shared pentatonic pitch system |
| Peg Garden / Bouncy Launch | Predict a landing, compare two launches, and explain with replay; **Block Topple** as a launch mode | 8–10: controlled trials and a picture chart, with no claim that arcade physics models everything |
| Bug Builder / Rainbow Fingers | **Fold a Friend** (symmetry by folding); **Build-a-Bug** counting mode | 8–10: area on a large grid and equivalent shapes (PhET's Area Builder) |
| Photo Safari / Sink or Float | Keep observations as journal entries; sort by evidence rather than appearance; compare two examples; **Magnet Fishing** as a materials mode | 8–10: one-variable experiments with a stated, limited model |
| Light Lab | Ask where the beam will land before it shines, then compare two beam paths in a replay (a Skywatch Isles extension); any explanation must match the simulated model | Shadow Stage's simplified light model |
| Peekaround Island | **Doghouse Directions** (in, out, on, off, under) | 7–11: **Skyline View** (views from above); Monument Valley-style paths that connect only from one viewpoint |
| Critter Sort / Critter Crossing | **Fripple Orders** (a customer asks for "the one with stripes"; then two attributes and "but not") | 8–11: Sorting Machine |
| Story Steps | **Sound Detective** (arrange scene cards to match a heard sequence); Story Theater | Clue-based endings, alternative viewpoints |
| Duck Pond | **Count the Peekers** (counting in a busy scene, after Kacheek Seek, untimed) | Estimate "a few or lots?" first, then count |
| Color Garden / Pattern Train | **Color Train**, a lap entry (needs the decision about lap levels outside a ladder's order) | Two things for each car |
| Market Stall | Keep its exact-payment ladder coherent. **Lemonade Stand** is built as a neighboring game (see [GAMES](GAMES.md#lemonade-stand)): weather, cups made and a picture table across days; extra cups go to friends, while its market-week level counts the lemons' cost | Price, unit cost, profit and a bounded recoverable operating loss are Lemonade Stand's later levels |
| Bounce Back | **Keepy Uppy**, a floatier one-player mode (after Bluey) | A grown-up's second finger joins |
| Feelings Faces | **Belly Breaths**, a calming strategy (hold the pet's tummy to breathe in) | Name a feeling, breathe, choose a plan |
| Penguin Slide | **Mossy Path** (visit every square once; a different decision from sliding to a stop) | Thick moss crossed twice; larger grids |

Do not stretch every ladder. Some favorites (bubble popping, dressing the pet, free painting) can stay simple toys for an older child. Introduce a harder mode only when its controls, spoken explanation and learning goal make sense together.

## Quick Tricks and microgames

WarioWare combines short, varied interactions with visual comedy; **WarioWare: Touched!** is a useful touch-interface reference, and **Get It Together!** explores how different characters approach microgames ([Touched! manual](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_WarioWareTouched_EN.pdf), [Get It Together!](https://www.nintendo.com/sg/switch/aw7n/index.html), [practice and replay tips](https://play.nintendo.com/news-tips/tips-tricks/warioware-microgames-quick-tips/)). They are references for interaction and presentation, not for pacing or rewards. Quick Tricks is the island's version: **hear a short prompt → try one satisfying action → enjoy its funny consequence → choose to continue or replay.**

What to carry over: a scene that explains the action (a long parcel and a sideways slot suggest turning), a strong verb (turn, stretch, match, share, uncover, connect, echo), an expressive payoff (a satisfied monster wears its matched socks on its ears), variation within something familiar (move the slot once the task is known; keep controls stable within a set), and a finale that combines learned actions as a celebration, not an exam. Each scene waits for the child: no fuse, countdown, lives, escalating speed or forced jump. Humor never humiliates the player. A demonstrated completion still counts.

A whole show is one round and one sticker; a scene never calls the shell's finish. Keep each scene's input, hints and cleanup contained, report statistics once, and define miss and hint accounting before mixing tasks so a longer show does not look like a struggling round. Replaying a prompt or demonstration is not a wrong answer. Add a show at a time; no general microgame framework is needed.

Three ways to present the same small activities:

| Format | Who it might fit | How it works |
| --- | --- | --- |
| **Toy shelf** | Lap/toddler with a grown-up | Choose one toy and keep playing with it. A large Next control is available; there is no surprise rule switching. |
| **Little show** | Roughly 3–6 | Three scenes with one gesture family, followed by a small finale. A picture strip shows the sequence; the child advances each scene. |
| **Remix show** | Roughly 6–8 | Mix familiar actions and add one visible condition: turn the long parcel, share the red fruit, then copy the rhythm. Surprise comes from the scene, while the current rule stays clear. |

### Microgame seeds

Six of the original twelve seeds became the two Quick Tricks shows. These remain small scenes, not promised standalone games; some reuse a current learning loop, and the new value is the situation or payoff.

| Scene / rough range | Spoken invitation and action | The satisfying result | Skill and deeper variation |
| --- | --- | --- | --- |
| **Finish the Wiggle / 4–7** | “What comes next?” Choose the next pose in a short dance pattern. | The whole line of critters performs it. | Pattern continuation; later fill a missing middle pose. A possible Pattern Train extension. |
| **What Changed? / 4–7** | “Something changed!” Look at a before/after pair of a pet dressing scene. | The changed hat turns into a tiny waving friend. | Careful comparison; later hide the before view behind a freely available Peek button. No exposure timer. |
| **Echo Knock / 3–7** | “Your turn.” Echo a woodpecker's two or three knocks on a stump. | A sleepy tree opens its eyes and answers with a flourish. | Listening, order, and rhythm; later trade short/long patterns. Use synthesis, no microphone. Sound Garden's echo level already does the core of this; the new value would be the scene and its payoff. |
| **Switch the Track / 4–7** | “Send it to the flower.” Turn one big track junction. | A seed wagon reaches a pot and a flower pops up. | Following a route and predicting consequences; later two junctions. A compact Robot Path relative. |
| **Make Two Halves / 5–8** | “Share it equally.” Slide a dividing line across a square sandwich, then serve the two pieces. | Two guests unfold them into matching butterfly wings. | Equal parts of the same whole; later compare two valid ways to halve it. Snap to clear positions and show unequal pieces side by side. |
| **Rhyme Picnic / 4–7** | “Who rhymes with bee?” Hear and choose between picture names such as tree and boat. | Bee and Tree sing their rhyming names together. | Sound comparison; later choose another member of a word family. Review pronunciations and give a replay for every picture. |

### A third show: new gestures

A third show could try three new gestures before any becomes a full game: **Wind the Music Box** (turn the crank until a friend pops up), **Fill the Cups** (pour to each cup's line) and **Loop the Fireflies** (draw one loop around three fireflies). In the finale the fireflies light their jar while the music box plays. At toddler level any turn, pour or loop succeeds; preschool and pre-K add a named amount ("fill it to the line", "loop three"), and a 6–8 remix asks for "two whole turns" or "half full". Cranking and pouring cannot go wrong, since an overflowing cup spills into a tray and can be poured back; only a closed loop around the wrong number of fireflies counts as a miss. Accounting follows the earlier shows: one sticker for the show, misses summed across it, and at most one hint per trick. Watch whether small hands can crank before building Gear Garden or Pour and Fill. Lasso Loops already uses the loop gesture, so it can be watched on the iPad; Loop the Fireflies would bring it to toddlers.

### Gestures the island does not use yet

Current games tap, drag, hold a basket, pull back, draw, draw closed loops, steer and use two hands at once. Sesame Workshop's touch research found tapping and dragging easiest for preschoolers and pinching and flicking hard, so try each new gesture as a small scene before building a game around it.

| Gesture | What it feels like | First scene | Fuller activity | Care points |
| --- | --- | --- | --- | --- |
| **Crank** (a circular drag) | Winding a music box | Wind the Music Box | Gear Garden | Measure the angle swept around the crank's center, not speed; any direction counts at first; a handle at least 100 units across; cancel cleanly when the finger leaves |
| **Press and hold** | Filling a balloon; a slow breath | Balloon Breath | Belly Breaths | No required duration; letting go always does something pleasant; keep palm rejection |
| **Pour** (drag to tilt) | Tipping a jug | Fill the Cups | Pour and Fill | The jug tilts with its handle, not the device; the flow slows near the line; overfilling spills into a tray that can be poured back |
| **Loop** (a closed drawing) | Lassoing | Loop the Fireflies | Lasso Loops (built) | Close generously (Lasso Loops always joins the end back to the start); count things whose centers fall inside |
| **Sliding pitch** | Singing higher and lower | Sing Higher | A Sound Garden mode | Snap to pentatonic steps from `notes.ts` and show the step reached |
| **Baton** (a rhythmic up-and-down drag) | Conducting | Wake the Band | Little Conductor | Take the tempo from turnarounds with heavy smoothing; never require a precise beat |
| **Time scrub** (a large slider) | A time-lapse | Grow Overnight: drag the sun across the sky to watch a sprout grow | Moon Window, Caterpillar Week | Both directions work; there is no right speed |

Leave out device tilt and shaking unless a grown-up opts in: Safari asks permission before a page can read motion, and on-screen controls must work without it. Microphone blowing stays out under the existing boundaries.

## Mechanic families

Grouping by the underlying mechanic shows overlaps and possible reuse. Inspect existing helpers before adding infrastructure.

| Family | Built | Candidates | Reuse to consider |
| --- | --- | --- | --- |
| Steer a leader or a crowd | Duckling Parade, Roundup, Little Helpers | Munch Maze, Lane Hop, Follow the Leader, Island Taxi | Trail-following and flee steering from Duckling Parade and Roundup |
| Catch what falls | Egg Catch | Juice Squish | Egg Catch's slow falls, held-finger basket and gates |
| Aim and bounce (physics) | Bouncy Launch, Peg Garden, Bounce Back, Bumper Garden | Mini Golf, Pin Roll, Roll Ball, Block Topple, Snack Drop, Keepy Uppy | `engine/ball.ts`: ball, peg and wall physics with an optional ceiling and springy bumpers, and `simulate()` to preview or pick a shot |
| Draw to control | Rainbow Fingers, Letter Trails, Dot Link, Lasso Loops | Cloud Path, Rainbow Road, Water Paths, Draw a Song | Lasso Loops' custom pointer handling; turning a drawn line into something a ball can ride |
| Build and place | Bug Builder, Tangram Town, Stamp Studio, Chain Reaction | Block Builder, Shape Drop, Machine Line, Little Town Planner, Shape Buddies | Chain Reaction's sockets and deterministic replay; a grid and snap-placement helper |
| Serve an order | Scoop Shop, Monster Munch, Mail Carrier, Pet Kitchen, Market Stall | Juice Bar, Little Farm | An order bubble and customer queue |
| Match and sort | Color Garden, Shape Sorter, Sink or Float, Critter Sort, Critter Crossing | Trash Sort, Bug Net, Claw Catch, Fripple Orders, Snap Pairs, Shape Rollers, Sorting Machine | `drag.ts` covers most of it |
| Rhythm and sound | Jelly Drums, Song Maker, Sound Garden, Rhythm Neighbors, Beat Builder, Clap the Syllables | Stomp Steps, Little Conductor, Hat Band, Sing Higher, Draw a Song | Beat-synced spawning from `music.beats()`; Sound Garden's forgiving rhythm-echo judge |
| Care and pretend | Splish Splash, Weather Wardrobe, Feelings Faces, Fluffy Salon, Teddy Doctor, Pet Says | Puppy Pal, Belly Breaths | Tools attached to a critter (`Critter.attach`) |
| Grid logic | Robot Path, Penguin Slide, Secret Code, Pixel Pictures, Treasure Map, Garden Rows, Ferry Jam | Color Hop, Ice Push, Swap Match, Mossy Path, Pancake Stack, Number Munch Grid | A tile grid with undo; the solvers in Penguin Slide, Garden Rows and Ferry Jam |
| Play together | Bounce Back, Owl Walk Home, Pet Says (off screen), couch play | Match the Card, Four in a Row, Island Race, Two Friends, Shape Buddies, Raft Delivery, Snap Pairs | Bounce Back's grown-up paddle with the pet standing in; Owl Walk Home's turn-taking with the pet |
| Short shows and remixes | Quick Tricks (two shows), Rhythm Neighbors | A third Quick Tricks show, complementary jobs, Island Toy Fair | Contained scenes with clear prompts and a shared ending |
| Investigate and revisit | Story Steps, the Windy Picnic | Lost and Found, Story Theater, Clue Paws, Mother Goose Muddle, Postcard Detective | The picnic's resumable steps and journal; extend game results only as needed |
| Make and keep | Sticker placement, treehouse creations (Stamp Studio, Rainbow Fingers, Pixel Pictures, Song Maker), the discovery journal | Story Weaver, more journal sources, a saved-project shelf | Bounded records in `src/content/creations.ts` and `journal.ts`, normalized placement, migration and backup |
| Turn, pour and fill | None yet | Gear Garden, Pour and Fill, the third Quick Tricks show | An angle-swept crank helper and a fill level |
| Stack and topple | Block Tower | Wobble Works | An explicit support rule (Block Tower's `topples`), not `engine/ball.ts` |

## Gaps in the catalog

Areas and interactions no game covers yet, read from each game's skills and levels.

| Area | Covered now | Still missing | Candidates |
| --- | --- | --- | --- |
| **Lap play** | 37 games at Puddle Lagoon, mostly tapping to see something happen; Block Tower (stacking and knocking down) and Pet Says (copying actions) | Pretend use of everyday things, songs she already knows (Song Maker makes random songs; the CDC lists these kinds of skills around 15–18 months), filling and emptying containers | Brown Bear Parade, Keepy Uppy, Color Train, [Sing-Along Barn, Fill and Dump](#gap-review-2026-10-09) |
| **Measurement** | Length (Inchworm Measure), weight (Seesaw Balance), time (Clock Tower), money (Market Stall) | Capacity, and estimating before measuring | Fill and Dump, Pour and Fill, Guess the Pumpkin, Count the Peekers |
| **Number** | Counting, number bonds to ten, a number line to 20, fair shares with leftovers, tens and ones to 39 and equal groups (Lasso Loops) | A number shown as one thing that splits and joins; place value past 39; arrays (rows and columns) | Number Friends, Flip Ten, Number Munch Grid, [Orchard Rows](#gap-review-2026-10-09) |
| **Shape and space** | Flat shapes, tangrams, symmetry, turning a scene, grid names | 3D shapes, views from above, and words for movement (through, around, over) | Shape Rollers, Skyline View, Bear Hunt Walk, Doghouse Directions |
| **Science** | Floating, ramps, light, plants, dressing for the weather, balance, a marble machine, and food/water/shelter in a small habitat model | Gears and simple machines, electricity, life cycles, the moon's phases, material properties | Gear Garden, Circuit Garden, Caterpillar Week, Moon Window, Roll-a-Roll |
| **Logic and planning** | Code-breaking, Venn sorting, a hidden rule, sliding puzzles, Latin squares, sliding blocks, picture logic, routes and loops | Recursive moves, visiting every square, working out a process from its product | Pancake Stack, Mossy Path, Machine Line, Seed Order |
| **Literacy** | Letters, sounds, word families, rhymes, opposites, syllables, picture stories | Reading a printed word for its meaning (every prompt today is spoken), connected spoken stories, using a clue's meaning, building a sentence, retelling a known rhyme, the pet as a learner | [Read & Do](#gap-review-2026-10-09), Story Theater, Mother Goose Muddle, Story Weaver, Fripple Orders |
| **Writing** | Capital letters and the child's name traced in stroke order (Letter Trails) | Numerals, lowercase letters | [Number Trails](#gap-review-2026-10-09) |
| **Time beyond the clock** | O'clock to quarter past and to (Clock Tower); dressing for the weather | Days of the week, yesterday and tomorrow, months, seasons, life cycles | [Day by Day](#gap-review-2026-10-09), Caterpillar Week |
| **Music** | Drums, step sequencing, echoes, call and response, high and low | Tempo and loudness that the child controls, instrument sounds, layering loops, sliding pitch | Little Conductor, Hat Band, Sing Higher, Draw a Song |
| **Feelings and self-control** | Naming feelings, choosing what helps, waiting for green, moving only on "Pet says" | A calming strategy to practice | Belly Breaths |
| **Playing together** | Bounce Back's grown-up paddle, Owl Walk Home's shared goal, couch play for grown-ups | Puzzles where each player can do something the other can't; the child joining couch play | Two Friends, Shape Buddies, Raft Delivery, Snap Pairs with the pet |
| **Creative work that persists** | A kept picture, painting, pixel design or song in the treehouse | A kept construction, program or story, and returning to a work in progress | Story Weaver, a saved-project shelf, [Pixel Flipbook](#gap-review-2026-10-09) |
| **Ages 8–11** | Light Lab, Secret Code, Robot Path loops, picture graphs, Chain Reaction | Logic machines, small systems with visible needs, data across several days, evidence across places; the island has no touch form of the solver-checked couch puzzles | Sorting Machine, Little Town Planner, Postcard Detective, [touch forms of the couch puzzles](#gap-review-2026-10-09) |
| **Touch interactions** | Tap, drag, hold, pull back, draw, loop, steer, two hands | Turning a crank, holding for a while, pouring, sliding a pitch, conducting, scrubbing time | [Gestures the island does not use yet](#gestures-the-island-does-not-use-yet) |

## Gap review (2026-10-09)

A review of each registered game's bands, subject and level table against the [roadmap](ROADMAP.md) and the tables above, followed by web and code research on the gaps it found. Everything here is a **proposal**; the roadmap's [next-up list](ROADMAP.md#next-up) says what is chosen. The rows in [Gaps in the catalog](#gaps-in-the-catalog) were amended to match.

### What the registry shows

The review's findings as of 2026-10-09; the full read of the registry is in [the archive](archive/COMPLETED-2026-10-09.md#the-gap-review-what-the-registry-showed). Wonder Woods mostly replays the top levels of older games; ages 8–11 have no band; the best-tested puzzles are couch-only; reading and writing stop early; time stops at the clock; and the lap band has no song she already knows. Counts of games live in the roadmap and README, not here.

### Proposals

*Tag:* **promoted** = already written down in this notebook, here re-ranked or sharpened; **new** = not written down before. A mode is preferred to a new game wherever the meaningful action is the same.

| Idea / likely range | Play and learning | Smallest useful version | Effort · tag |
| --- | --- | --- | --- |
| **Fill and Dump / lap–preschool** | Tip a basket and watch everything tumble out; scoop it back in; later tip a jug to a line | Basket and bin, items that chime as they fall; every dump is a success. Fill-to-a-line with a spill tray comes at toddler and preschool. Containment (in/out, full/empty), then capacity | S–M · promoted (the Pour and Fill and Fill the Cups seeds) |
| **Sing-Along Barn / lap–toddler** | Tap and the next note of a song the grown-up sings plays; animals join each verse | Old MacDonald with three animals; each tap plays the animal's sound and the next phrase. Song order, animal words, anticipation | M · new |
| **Number Trails / preschool–pre-K** | Trace a numeral with the firefly, then see that many things | A `DIGITS` table beside `LETTERS` for Letter Trails; 1 to 5, then 0 to 9, then "make this many ducks". Lowercase letters later | S (digits), M (lowercase) · new |
| **Day by Day / pre-K–school** | Put the day cards of a pretend week in order; record each day's weather; watch a garden or a caterpillar change | Seven in-game days, "what comes after Tuesday?", "what was yesterday?", a tally of sunny days; Caterpillar Week and seasons as later modes | S–M · new, widens Caterpillar Week |
| **Mirror Brush / toddler–school** | Paint on one side of a fold and the other side paints itself | A mode of Rainbow Fingers: a fold line and mirrored marks. The mirror does the work, so it needs no prediction and comes first; [Fold a Friend](#extend-existing-games-before-making-duplicates) (predict the unfolded half) follows at about 6 | S · promoted (a live-mirror form of Fold a Friend) |
| **Read & Do / pre-K–school** | Read a sign and make the scene do it ("the duck can jump"); tap any word to hear it | One sight word and a picture, then two-word phrases, then a sentence and an action. Hazel the squirrel can post the signs | M–L · new (sharpens "building a sentence") |
| **Orchard Rows / school** | Plant trees in rows and columns, then count by rows and turn the orchard to count by columns | 2 by 3 up to 5 by 5 rectangles with the total said by rows. Arrays are the step between Lasso Loops' "3 groups of 4" and multiplication. Place value 40 to 99 can be a Lasso Loops mode | S–M · new |
| **Stomp Steps / pre-K–school** | Tap big footprints along with the music | A wide timing window and a visible pulse; nothing is ever missed. Read simple rhythm patterns at school | M · promoted |
| **Pixel Flipbook / school** | Draw two to four small frames and watch them play | A Pixel Pictures extension with a faint copy of the previous frame; kept on the treehouse picture board | M · new |
| **Touch forms of the couch puzzles / school, about 8–9** | Lantern Lights, Picture Logic and Island Bridges with fingers instead of a controller | Their solvers, hints and tests already exist; the 100-unit target rule caps a grid at about 7 cells across before any screen chrome, so each layout needs measuring | M each · new, *fits the school band* |
| **Rule Parade / school, 7–10** | Choose rule tiles and test a machine on a parade of critters | Two conditions and two actions, one rule at a time, with a trace of which rule applied | M · promoted, *fits the school band* in its tiny form |

Already in this notebook and still the right small lap picks: Brown Bear Parade, Color Train and Keepy Uppy ([Color Train waits on the lap-level decision](ROADMAP.md#next-up)). **Needs the band and zone decision:** Sorting Machine at its full 8–11 size, Little Town Planner, Discovery Marsh investigations and Postcard Detective.

### Sketches (first drafts of the definition of ready)

These four are the nearest to buildable. The other rows need the same treatment before they move to the roadmap.

**Fill and Dump.** *Fun action:* tip a basket and watch fruit tumble out with a chime for each piece; drag or tap pieces back in. *Skill:* containment and capacity. *Smallest round:* a big basket and a bin; any dump is a success; the round ends when everything is back in or after a few dumps. *Support:* lap has no wrong move; toddler fills a basket with a stated number; preschool tips a jug to a line, where the flow slows near the line and an overfill spills into a tray that can be poured back (from [Gestures the island does not use yet](#gestures-the-island-does-not-use-yet)); a glow marks the line after two overshoots. *Deeper play:* compare two cups, "which holds more?", pour one into the other. *Host alternative:* none; the pour gesture is new, so the first scene could be the third Quick Tricks show's "Fill the Cups" before it grows into a game. *Co-play and off-screen:* the grown-up dumps and she fills; real large containers and water or sand play.

**Sing-Along Barn.** *Fun action:* tap the scene and the tune moves one note on; each verse brings an animal. *Skill:* song order and animal words for the youngest; memory for the tune. *Smallest round:* Old MacDonald, three animals. *Support:* any tap advances the tune; the verse line is spoken ("and on that farm he had a cow"); the animal answers. *Deeper play:* choose who is on the farm, then pick which animal comes next, then repeat a phrase. *Host alternative:* a mode of Song Maker or Peekaboo Barn would hide a game whose point is a known song. *Co-play:* the grown-up sings and she taps, which suits the American Academy of Pediatrics advice in [Design and learning references](#design-and-learning-references). *Constraints:* see the pentatonic note below. A song she plays by copying a card is not hers, so nothing is offered to the tune plaque.

**Number Trails.** *Fun action:* follow the firefly along a numeral. *Skill:* forming 0 to 9 in stroke order, with the quantity beside it. *Smallest round:* trace 1 to 5 and see that many things. *Support:* a start dot and an arrow at the beginning of each stroke, because the reversed numerals are usually 2, 3, 5 and 7 and children confuse 6 and 9; the existing ordered checkpoints already teach the movement rather than the shape. *Deeper play:* 0 to 9, a numeral in order, "make the number of ducks". *Host:* a mode of Letter Trails; its `LETTERS` table is a map of strokes in a 0 to 1 box and `advanceTrace` is shape-agnostic, so digits are a sibling table plus pictures. Lowercase is larger: it needs a four-line frame (ascender, x-height, descender). Pick one stroke convention (Handwriting Without Tears, D'Nealian and Zaner-Bloser differ) and check it against the publisher's chart before encoding.

**Read & Do.** *Fun action:* read a sign and make the scene do it. *Skill:* recognising common words by sight, then reading a short sentence. *Smallest round:* one sight word beside a picture ("red", choose the red hat), then "big duck", then "the duck can jump". *Support:* every word replays its speech when tapped (replaying is free and never a hint); a wrong action plays out what the sentence would mean and then re-reads it word by word. *Deeper play:* two actions in order, a sentence with a question, then a short story. *Word source:* the Dolch lists, 40 pre-primer words and 52 primer words, are the natural ladder; the colors, numbers and directions already in the art cover many of them, and the three-letter nouns Word Monsters teaches supply the rest. *Host alternative:* none; no game asks her to read. *Checks:* AGENTS asks for a check of the actual device speech before claiming a phonics skill, and the same care applies to words read aloud here; reading progress is its own level and never forces harder number work (the E2 note in the [roadmap](ROADMAP.md#e2-middle-elementary)).

### Research notes

What was found, and what it means for the sketches. These are starting points, not evidence of effect: much of the early-childhood material is practitioner guidance. **Opened and read for this review:** the Common Core RF.K and 2.OA pages, NGSS K-ESS2-1, the Dolch list article, the Lovevery post, the three Kodály pages cited below, a UK school's stop-motion post and MIT's ScratchJr page. **Cited from search-result excerpts only** (not opened, blocked, or an unreadable PDF when tried): Nemours, Playvolution, the NHS page, Shao and Gentner, the Achieve the Core note, Fletcher, 4.G.A.3, TERC, FableVision, the Frontiers study and the UK Year 3 plan.

- **Filling and emptying.** Practitioner guides ([Lovevery](https://blog.lovevery.com/?p=14038), [Nemours Reading BrightStart](https://www.nemours.org/reading-brightstart/at-home-activities/6-to-11-months/fill-and-dump.html), [Playvolution](https://playvolutionhq.com/filling-and-emptying-schema/)) tie filling and emptying to in/out and full/empty ideas and to fine-motor practice; Lovevery adds that emptying comes first and refilling a month or two later. No controlled studies were found. *Use:* build the dump first; make filling the second step.
- **Songs for the youngest.** Kodály teaching brings in *fa* and *ti* late because the minor second is hard for younger singers ([Teaching Children Music](https://www.teaching-children-music.com/2011/01/kodaly-method/)), and starts singing on *so* and *mi*, a small interval that is easy to sing ([MRA Music Place](https://mramusicplace.net/2014/07/29/what-are-the-best-pitch-combinations-for-teaching-our-youngest-children-singing/)). His Fifty Nursery Songs use five notes to avoid semitones and begin on two notes ([Music Is Elementary](https://musiciselementary.com/?p=9605)). *Use:* the island's pentatonic rule already matches how the youngest sing, and in this order the tunes that need F (*fa*) are a later step than the pentatonic ones, although families sing them first. A traditional tune is public domain but a published arrangement is not, so write the melody from the tune and check it against a source. No verified list of public-domain so-mi-la songs was found.
- **Which familiar tunes fit.** Written by scale degree from memory and screened against `PENTATONIC` in [`src/audio/notes.ts`](../src/audio/notes.ts) (C, D, E, G, A), these fit: Hot Cross Buns, Mary Had a Little Lamb, the Old MacDonald refrain, Au Clair de la Lune, Rain Rain Go Away, Bounce High Bounce Low and the first line of Itsy Bitsy Spider. These need F, the fourth step: Twinkle Twinkle (and the ABC and Baa Baa tunes), Wheels on the Bus, Row Row Row Your Boat, London Bridge, Frère Jacques, Jingle Bells and Ode to Joy. The tunes most families sing first are in the second list. Verify every transcription before building.
- **Numerals.** NHS therapy guidance lists 2, 3, 5 and 7 as the numerals children most often reverse, and 6 and 9 as often confused, and advises learning numerals as movements with start points and arrows ([Somerset NHS](https://www.somersetft.nhs.uk/children-and-young-peoples-therapy-service/letter-and-number-reversals/)). The Handwriting Without Tears stroke descriptions found were secondhand; none was taken from the publisher's chart.
- **High-frequency words.** The Common Core kindergarten standard reads "Read common high-frequency words by sight (e.g., the, of, to, you, she, my, is, are, do, does)" ([RF.K.3.c](https://www.thecorestandards.org/ELA-Literacy/RF/K/)). The Dolch list has 40 pre-primer and 52 primer words, compiled by Edward Dolch and first published in 1936 ([Wikipedia](https://en.wikipedia.org/wiki/Dolch_word_list)); the article does not state the list's licensing, so record the source and treat the words as common vocabulary. A search found no independent evaluation of Teach Your Monster to Read, only developer figures, so do not present Read & Do as proven instruction.
- **Arrays.** Common Core 2.OA.C.4 asks for the total of a rectangular array "with up to 5 rows and up to 5 columns", written as a sum of equal addends ([2.OA](https://www.thecorestandards.org/Math/Content/2/OA/)). An alignment note calls arrays the bridge between the addition work of kindergarten to grade 2 and multiplication in grades 3 to 5, and says the array idea matters more than the computation ([Achieve the Core, NWEA](https://achievethecore.org/content/upload/2.OA.C.4_NWEA.pdf)). *Use:* the same array read as 3 rows of 5 and as 5 columns of 3 is the point of turning the orchard.
- **Weather over time.** NGSS K-ESS2-1 is "Use and share observations of local weather conditions to describe patterns over time", with sunny, cloudy and rainy tallies as the examples ([K-ESS2-1](https://www.nextgenscience.org/pe/k-ess2-1-earths-systems)). Weekdays, months and yesterday and tomorrow are state-standard skills; one search surfaced a Virginia kindergarten calendar standard that was not opened. *Use:* Day by Day's tally gives Picture Graph's counting a purpose; keep the days in-game so nothing is tied to the device's date or a daily return.
- **Symmetry.** Young children matched symmetric shape pairs no better than chance until about 8 to 9 years old ([Shao and Gentner, 2019](https://groups.psych.northwestern.edu/gentner/papers/ShaoGentner_2019-Symmetry.pdf)), line symmetry is a grade 4 standard ([4.G.A.3](https://thecorestandards.org/Math/Content/4/G/A/3/)), and a Columbia study of first and second graders found structured symmetry instruction helped ([Fletcher](https://academiccommons.columbia.edu/doi/10.7916/D8RF5T4Z)). Practitioner guidance for preschoolers is to expose them to the idea without expecting symmetrical work. *Use:* Mirror Brush is a toy where the mirror does the work and comes first; Fold a Friend can follow at about 6; save "find the fold lines" for about age 9.
- **Animation.** A UK school describes making flipbooks before stop motion and finding that objects must move only a little between frames ([school blog](https://inskip.lancs.sch.uk/blog/2024-02-08-15-43-48-stop-motion-animation)); a UK Year 3 plan found by search described onion skinning, a faint earlier frame, as the aid for placing the next one, though that page could not be opened. ScratchJr is designed for ages 5 to 7 ([MIT](https://www.media.mit.edu/projects/scratchjr/overview/)). No study of flipbooks for sequencing in this age range was found.
- **Rhythm timing.** No published timing tolerance for under-fives was found; a tapping study compared 3- and 5-year-olds without giving a window ([Frontiers](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2014.01346/pdf)). *Use:* treat any window as a playtest value, start wide, show the pulse, and consider a latency step for tablets and Bluetooth audio. Sound Garden's rhythm-echo judge is the internal precedent.
- **Logic for 8–11.** TERC's NSF-funded study looked at the computational thinking children do while playing Zoombinis, whose current publisher lists grades 3 to 8 ([TERC](https://www.terc.edu/zoombinis/), [FableVision](https://fablevisionlearning.com/zoombinis)). Lightbot is described as teaching loops, procedures and conditions; its publisher's page was not opened. Zoombinis' puzzles are mostly about sorting and sequencing rather than if/then, which matches Critter Sort and Critter Crossing as the stepping stones to Rule Parade.

### Decisions this needs from the developer

1. **A pentatonic exception for tunes.** The rule exists so every free tap sounds musical. In a tap-to-advance tune the tune, not the tap, chooses the pitch, so the reason does not apply, but the rule is a shared contract. Either build only the tunes that fit first, or allow a documented exception for tap-to-advance tunes so Twinkle and Wheels on the Bus can be included.
2. **Island forms of couch puzzles.** [AGENTS.md](../AGENTS.md) keeps grown-up-only games in `GROWNUP_GAMES` so the island cannot open them. Touch forms of Lantern Lights, Picture Logic and Island Bridges would be new island `GameModule`s sharing their solvers, with ordinary adaptive levels and one sticker, and none of the couch pars or records.
3. **Grid size on the island.** Targets must be at least 100 logical units, so seven cells take 700 of the 768-unit short side before the home button, the pet's corner or a clue gutter (Picture Logic's) is counted. About 7 is the arithmetic ceiling, not a promise: each layout, portrait included, needs measuring before anyone says it fits. Lantern Lights (3 to 5) is the likeliest; Island Bridges' 7 by 7, Picture Logic's 6 by 6 with its clues and Word Search's 8 by 8 start may need a layout exception.
4. **In-game days only** for Day by Day, so there is no tie to the real date, a streak or a daily return.
5. **One stroke convention** for numerals and lowercase letters, checked against the publisher's chart.
6. **Whether Wonder Woods grows before a band above it.** Longer school ladders and the games above can carry about age 9; a band for 9 to 11 waits on the zone-identity work in the roadmap.
7. **Flipbook storage.** The picture slot is shared by stamps, paintings and pixel designs, and a pixel design is at most 6 by 6. Frames need a new bounded creation shape, with repair on load, migration and backup tests.

### Suggested order (non-binding)

Weighted to the next few years, because the youngest play comes first: **Fill and Dump** and **Sing-Along Barn** for lap and toddler; **Number Trails** as the cheapest build; **Day by Day**; then, for 6 to 8, **Read & Do** and **Orchard Rows**; the **touch puzzles** and **Rule Parade** for about 8 and 9; **Mirror Brush** and **Pixel Flipbook** as creative modes whenever convenient. Read & Do is the largest long-term hole, because reading is the main skill of the school band and nothing else covers it.

## Short-ladder audit (2026-10-09)

An audit of every school-reaching game's ladder, read from each game's `levels(band)` and `describeLevel` and checked against its [GAMES.md](GAMES.md) entry and level plans. The question is the roadmap's: where does a **meaningful next decision** exist, as opposed to a bigger number, a faster pace or more to remember ([depth before pressure](../AGENTS.md#rules-for-every-activity))? A next level qualifies when it changes what she has to decide, reuses the game's own interaction, and has a property a unit test can assert (solvable, one clear answer, a hint that leads somewhere). The verdicts are judgments from reading rules and code; nothing was played and no child has used any of it.

### What the ladders look like

- **Two populations overlap.** 25 island games have a whole ladder of only four or five levels (the roadmap's number); 12 of them reach the `school` band, and 13 end at pre-K by design. Separately, 23 games give the school band only one or two levels. Counting both, 33 school-reaching games are short in one sense or the other.
- **Six levels is a convention, not a measure.** 28 of the 74 ladders top out at six, and the school band is usually its last two. A "school window" is whatever is left at the top, so extending every ladder evenly would be the wrong fix.
- **The top is what she meets most at 7 and 8.** At a band's last level two smooth rounds step up to nothing, so she replays it. A top level that is a toy-sized idea shows up as repetition.
- **How a level is added.** The plan lookups read (Pattern Train, Memory Match, Sink or Float, Song Maker, Rainbow Fingers) clamp the level to the table's length, so appending to the plan table and raising the school `max` is the safe edit; never renumber. A new level also needs its `describeLevel` text, `LevelLine` steps on the how-to card scoped to it, rule tests for the plan, and, for a game with a ghost finger, a bot that can play it, because `fingerdemo` plays each game's first and last level.
- **Two couplings to budget for.** 11 of the 23 short-window games have a ghost-finger bot (Bouncy Launch, Little Helpers, Rhythm Neighbors, Scoop Shop, Sink or Float, Song Maker, Size Parade, Jelly Drums, Memory Match, Pattern Train, Bubble Pop). Five are also couch games (Bouncy Launch, Rhythm Neighbors, Sink or Float, Memory Match, Pattern Train), but a couch trip names its level for each stop, so appended levels leave trips and courses alone.

### Extend: a real next decision, small to build

Mostly plan entries and rule tests; each row names any art, voice or layout it needs. *Tag:* **roadmap** = already named there; **new** = from this audit.

| Game (ladder top · school levels) | What the top level asks now | Next decision | Cost · tag |
| --- | --- | --- | --- |
| **Memory Match** (9 · 8–9) | Match uppercase to lowercase letters | *Same, said differently:* number word to numeral (one to ten), a fraction picture to its name, a clock face to its digital time. The pairing rule becomes equivalence of representations rather than the same look | S for number words (text cards, as letters are today); S–M for fractions and clocks, which need small new art: a card-sized fraction picture, and a clock face (Clock Tower's is drawn inside its own scene, so it would be shared). Check legibility in the 140-unit card first. New. Bot and couch levels unaffected if card pairs carry ids. Sketch below |
| **Pattern Train** (9 · 8–9) | Fill two cars of an AAB pattern | *The seventh car:* name a car far down the line from two shown repeats, then two things changing per car, then numbered cars that count by 2, 5 or 10. Generalizing the rule replaces continuing it. Fills the skip-counting hole | S–M · new. Numbered cars are a new car kind (today `shape`, `animal` and `bell`), and a train that runs off the edge is a layout change. Sketch below |
| **Pet Kitchen** (6 · 5–6) | Double a picture recipe | *Three quarters, please:* name a fraction and give that many equal pieces (two quarters make a half), then halve a recipe, choosing double or half from the card. The voice script's only fraction word today is "quarters" in the recut hint | S · new. No new art (it reuses the sandwich); it needs voice lines for the fraction words. The cheapest of the three. Sketch below |
| **Treasure Map** (4 · 1–4) | Follow directions from where the pet stands | A square found from two clues ("two right of the tree, one below the rock"), where the answer is where the clues meet | S · roadmap. Has a ghost finger, so the bot learns the new clue type |
| **Critter Sort** (4 · 2–4) | Guess the rule from sorted critters | A hoop for "not": the critters outside it share the missing property | S · roadmap. No ghost finger |
| **Bouncy Launch** (5 · 4–5) | Farther or nearer than last time | Predict which cloud a shown pull will reach, then launch and compare (an unscored prediction, like Sink or Float). Needs the pull-to-cloud mapping to be deterministic, which should be confirmed first | S–M · new. Ghost finger and couch game |
| **Rainbow Fingers** (6 · 5–6) | Mix two pots into orange, green or purple | *Paint the pumpkin:* recall that it is orange, then mix it from two pots. Joins the recall and mix modes that already exist | S · new. Modest |

### Extend later: a real next decision that costs more

A new interaction, authored art, a stated model, or a precondition.

| Game (ladder top · school levels) | Next decision | Why it waits |
| --- | --- | --- |
| **Sink or Float** (6 · 5–6) | *Make it float:* change one thing about an object (flatten the clay into a boat, take weights off) and compare trials. The first fair-test variable | A stated, honest model of why shapes float, plus the journal; a ghost finger and couch game to keep working |
| **Ramp Race** (4 · 1–4) | Predict where the car stops, then roll | The finish rule and its half-marks (such as 1.5 × 3) are worked out before building; a recorded-trials table is a new screen ([E2](ROADMAP.md#e2-middle-elementary)) |
| **Bug Builder** (7 · 6–7) | *Fold a Friend:* predict where each spot lands when the wing folds over; later, which crease makes the bug match | Pairs with Mirror Brush (above); the crease-choice step belongs near age 9 |
| **Peekaround Island** (5 · 4–5) | *View from above:* which picture shows the island from the sky | A new top-down view to draw |
| **Block Tower** (6 · 5–6) | Unclear. The top level is already the optimization (reach the star with only N blocks), and a farther star with more blocks is a bigger number. A counterweight block behind the table edge, which lets the stack reach out, would be a different decision | Needs design first. `finish()` already searches every slot, so solvability and the fewest blocks would be cheap to test once a decision is chosen |
| **Puzzle Pals** (7 · 6–7) | Pieces that arrive turned, so she turns them to fit | A tap-to-turn interaction with its own hint; more pieces is not a next decision |
| **Quick Tricks** (6 · 5–6) | A third show, the remix | The new gestures (crank, pour, loop) and a visible condition; shares its gesture test with Fill and Dump |
| **Song Maker** (7 · 6–7) | *Answer the phrase:* end a given four-note start so it comes home | A rule for "comes home" that a test can check, and a mode that fits the loop grid |
| **Story Steps** (7 · 6–7) | Choose the picture that caused what happened | Authored story content and art, near Story Theater |
| **Letter Trails** (8 · 7–8) | Lowercase letters, then tracing the word a picture spells | Needs a four-line writing frame; digits are a separate preschool mode (Number Trails above) |
| **Tangram Town** (6 · 5–6) | Flip a piece; make the same shape with fewer pieces | More silhouettes to author |
| **Penguin Slide** (5 · 2–5) | *Mossy Path:* visit every square once | A new rule with its own solver (roadmap names it) |
| **Beat Builder** (5 · 3–5) | Two sections (a verse and a chorus) | A bigger design in a thin subject; do it as a music slice |
| **Pixel Pictures** (5 · 3–5) | Pixel Flipbook (above) | A new bounded creation shape |

### Leave: the ceiling is right

| Game | Why |
| --- | --- |
| **Jelly Drums** (9 · 8–9) | Each level adds a note to remember, which is memory load, not a decision; making tunes belongs to Song Maker and Beat Builder |
| **Bubble Pop** (11 · 10–11) | A simple toy that has already grown pairs-to-10; arithmetic lives in Duck Pond and Frog Hop |
| **Size Parade** (8 · 7–8) | The school window only adds more friends, which is a bigger number rather than a new decision; measurement lives in Inchworm Measure |
| **Scoop Shop** (6 · 5–6) | The top level is already "remember the order"; more would only add load |
| **Stamp Studio** (6 · 5–6) | Open-ended; every story is welcome, so there is nothing to climb |
| **Teddy Doctor** (6 · 5–6) | Care role-play whose top level already sequences a check-up |
| **Rhythm Neighbors** (6 · 5–6) | A couch game; layered rhythms are a larger design for a music slice |
| **Little Helpers** (6 · 5–6) | Equal groups is the right end; remainders are in Monster Munch and Lasso Loops, and rows and columns are Orchard Rows |
| **Lasso Loops** (5 · 3–5) | Place value past 39 would mean forty or more fireflies, which is clutter; it needs a different representation, not a longer ladder |
| **Rhyme Time** (4 · 2–4) | Rhyming with printed words is Read & Do |
| **Critter Crossing** (5 · 2–5) | Already holds "not" and two pictures; the next step is Rule Parade |
| **Lemonade Stand** (4 · 1–4) | Owned by the economy pilot |
| The 13 younger ladders (Animal Snack, Bounce Back, Bumper Garden, Clap the Syllables, Dot Link, Fluffy Salon, Garden Grow, Goodnight Room, Opposites, Owl Walk Home, Peg Garden, Pet Says, Stop and Go) | End at pre-K by design; the roadmap already says to wait for a reason to grow them |

### Sketches for the next two to build

Both are modes of an existing game, extend a ladder the child already knows, and close gaps from the [gap review](#gap-review-2026-10-09).

**Memory Match 10–12, "Same, said differently."** *Fun action:* flip cards to find the two that mean the same. *Skill:* reading number words, naming fractions and reading a clock, as one idea about equivalence. *Smallest round:* four pairs of number words and numerals, each spoken as it turns over. *Support:* exploring unseen cards still costs nothing; a pair counts as a miss only if its partner was already known (the game's existing rule); replaying a card's speech is free. *Levels:* 10 number words to numerals (one to ten); 11 fraction pictures to names (a half, a quarter, three quarters); 12 clock faces to digital times (o'clock and half past). Build 10 first: its cards are text, as the letter cards are. 11 and 12 need small new art (a fraction picture and a shared clock face) and a look at whether they read clearly on a 140-unit card before they are promised. *Rule tests:* every deck has one partner per card, no two cards could both match, and every equivalence is true. *Checks:* the device speech for number and fraction words, and how long words such as "eight" fit at card size; the existing ghost-finger bot should pair by id.

**Pattern Train 10–12, "The seventh car."** *Fun action:* look down the train and say what the far car must be. *Skill:* using a repeating rule to find a position without filling every car. *Smallest round:* two full repeats of an ABC pattern are shown and the train runs off the edge; she picks the seventh car from three. *Support:* she may tap the cars to count along, which is not a hint; a hint highlights the repeat. *Levels:* 10 find a far car in a one-attribute pattern (the train runs into a tunnel instead of off the edge); 11 two attributes that change together (color and shape move in step), with different rates a later step to check because the combined cycle is six or more; 12 numbered cars that count by 2, 5 or 10, a new car kind drawn with `label()`. *Rule tests:* the answer follows from the shown repeats alone, the three choices differ, and the counting steps match the numerals. *Checks:* the couch trip names its levels (4, 6 and 9), so it is unaffected.

### Open questions

1. **Is two levels enough for a favorite?** The adaptive clamp means a child stays at the last level, so a favorite she plays often may want a longer school window (three or four levels). The audit favors giving the best games more depth over stretching all of them.
2. **Representations versus a new game.** Memory Match 10–12 teaches fractions and a clock through matching; Pet Kitchen and Clock Tower teach them by doing. Decide whether the matching levels are a bridge or a duplicate once they can be played.
3. **Order.** Pet Kitchen first (no new art), then Memory Match 10 (text cards) and Pattern Train, with Memory Match 11 and 12 after a legibility look; then Treasure Map and Critter Sort (already on the roadmap), then Bouncy Launch and Rainbow Fingers. Sink or Float's *make it float* is the strongest of the costlier set.

## Reference backlog

The wider pool of ideas, kept by the reference that suggested them. Repeated names refer to the same concept as above, not separate tasks. "First playable loop" is an entry point, not a claim that every concept fits a toddler. Source descriptions are brief summaries; recheck a source before a design depends on its details. Rows for ideas that became games have been removed.

The shelf, in short: **Flash and web** (Neopets, Kongregate, Miniclip, Club Penguin, Webkinz, Poptropica, Animal Jam, Moshi Monsters, Orisinal, Eyezmaze); **mobile and tablet** (the most-downloaded hits, the best toddler apps, and touch-native learning apps such as Khan Academy Kids, Teach Your Monster to Read, DragonBox, Thinkrolls and Toca Nature); **early consoles and arcades** (the Atari 2600 and its Sesame Street games, arcade cabinets, Game Boy); **later consoles** (Xbox Live Arcade, Nintendo DS, Wii and Switch family games); **computers** (JumpStart from JumpStart Baby to its pet world, Living Books, Humongous adventures, Zoombinis, The Incredible Machine, Edmark, Sierra, Sunburst, The Learning Company, MECC, Carmen Sandiego and Maxis' sims for children); and **off the screen** (cooperative board games, logic toys, classroom manipulatives, picture books, nursery rhymes and preschool television).

### By source

#### Flash and web

| Idea | Inspired by | First playable loop | Grows into | Notes |
| --- | --- | --- | --- | --- |
| Bubble Cannon | Faerie Bubbles (Neopets), Bust-a-Move, Zuma | Tap where to send a bubble; three of a color pop | Plan a shot to drop a whole cluster | Preschool and up |
| Hill Roll | Turmac Roll, Snowmuncher (Neopets) | The pet rolls downhill; tap to hop and collect berries; bumps only bounce | Collect only red berries, or exactly five | Overlaps Tap to Flap |
| Factory Sort | Freaky Factory (Neopets) | Toys ride a belt; tap a gate to send each to its bin | Sort by two rules at once | Overlaps Color Garden |
| Swap Match | Bejeweled, Tetris Attack, Hexic | Swap two neighbors to make three in a row | Plan two moves ahead | Roughly 5–8; no move/life limit |

#### Mobile

| Idea | Inspired by | First playable loop | Grows into | Notes |
| --- | --- | --- | --- | --- |
| Snack Drop | Cut the Rope | Tap a rope and the snack swings and drops to a hungry critter | Two ropes and a bubble; timing the cut | Preschool; physics |
| Water Paths | Where's My Water | Draw through sand and water flows to a thirsty duckling | Fill three cups, avoid the mud, count the drops | Tinker Lab |
| Juice Squish | Fruit Ninja (no blades) | Swipe through floating fruit to squish it into a juice jar | Only the red fruit, or exactly four | Swipes stay gentle; no bombs |
| Lane Hop | Subway Surfers, Temple Run | The pet trots down a three-lane path; tap a lane to hop over and collect | Collect a color pattern, or count coins into a jar | Bumps just bounce, no crash |
| Tap to Flap | Flappy Bird, Tiny Wings, Barnstorming (Atari) | Hold to fly up and let go to glide; stars float by | Fly through numbered rings in order | Big gaps; walls are soft clouds |
| Cloud Hop | Doodle Jump | Tap left or right to bounce up cloud to cloud | Bounce only on even numbers or one color | Vertical; nobody falls off |
| Block Topple | Angry Birds | Fling a ball at a block tower and watch it tumble | Count what fell, then knock down the 3 | Could be a Bouncy Launch mode |
| Little Farm | Hay Day, Stardew Valley, Harvest Moon | Plant, water and pick; plants grow while you watch, not in real time | Grow what an order asks for; compare harvests | Could supply Market Stall later; keep the first shop self-contained |
| Critter Spotter | Pokémon GO, hidden-object apps | Find critters hiding in a busy scene | "Find three things that are red", or positions | No camera or GPS |
| Toy Box Town | Pok Pok, Toca Boca, Sago Mini | Open-ended play: tap anything and it does something | None; it stays a sandbox | Good for lap; quiet play |

#### Atari 2600

The 2600's Sesame Street titles (Children's Computer Workshop, 1983) were made for preschoolers. Their ideas carry over almost unchanged.

| Idea | Inspired by | First playable loop | Grows into | Notes |
| --- | --- | --- | --- | --- |
| Trash Sort | Oscar's Trash Race | Toss each thing into the bin it goes in: paper, food scraps, bottles | Sort by two rules; count what's in each bin | Everyday life; merges the catalog's Tidy Up |
| Castle Keys | Adventure | Carry the gold key to the gold castle door, and it opens on a surprise | Three keys and doors; remember which room the key was in | Color matching plus exploring |
| Fishing Pond | Fishing Derby | Lower a line and a fish nibbles; reel it in | Catch fish numbered 1 to 5 in order, or by color | Merges the catalog's Letter Fishing (letters on the fish) |
| Snow Slalom | Skiing, SkiFree (no yeti) | Steer down a snowy hill through flag gates | "Go left of the red flags": left and right | Spatial language |
| Crossing Guard | Freeway, Frogger | Hold up the stop sign and the friendly cars stop so ducklings can cross | Wait for green; red, yellow and green lights | Road safety; cars always stop |
| Brick Garden | Breakout | A slow ball bounces off a big paddle and pops flower bricks; a soft net catches it at the bottom | Pop only the blue bricks; count what's left | Lower priority |
| Vine Swing | Pitfall! | Tap to swing on a vine over a pond; a splash just means climb out | Swing to the numbered lily pad | Lower priority |

#### Arcade cabinets

| Idea | Inspired by | First playable loop | Grows into | Notes |
| --- | --- | --- | --- | --- |
| Color Hop | Q*bert | Hop the pet onto tiles and each turns the target color | Fill the shape without undoing your own tiles | Grid logic |
| Claw Catch | Claw machine | Move the claw over a toy and drop; it always grabs | "Get the small blue one": two or three attributes | Language for describing things |
| Pop-up Pals | Whac-A-Mole (no whacking) | Friends pop up from holes; tap to boop hello | Boop only the ones with hats, or the numbers in order | Overlaps Peekaboo Barn; good lap game |
| Roll Ball | Skee-Ball | Swipe a ball up a ramp into rings | Rings worth 1, 2 and 3; add your two rolls | Counting Cove |
| Juice Bar | Tapper | Slide cups along counters to thirsty critters | Two counters; the right drink for each | Could be a Scoop Shop mode |
| Burger Stack | BurgerTime | Walk across ingredients to drop them onto the plate below | Build in the right order from a picture | Overlaps Pet Kitchen |
| Ice Push | Pengo, Sokoban | Push ice blocks around; they slide until they bump | Push three blocks into a row, or build a bridge | Pre-K planning; undo button |
| Garden Dig | Dig Dug (no enemies) | Dig tunnels to find buried carrots and treasure | Compare two routes; fewer tunnels is an optional puzzle | Lower priority |
| Stomp Steps | Dance Dance Revolution, Taiko no Tatsujin | Tap big footprints and drums along with the music; every tap sounds good | Follow a step pattern; echo the drum | Music; nothing is ever missed |
| Island Taxi | Crazy Taxi | Pick up critters and drive them where they ask: the beach, the farm | Two passengers; plan the route | Uses island places as destinations |

#### Game Boy and Game Boy Color

| Idea | Inspired by | First playable loop | Grows into | Notes |
| --- | --- | --- | --- | --- |
| Shape Drop | Tetris | Big shapes float down slowly into a picture outline; tap to turn | Fill a silhouette in two different ways | Spatial; no stacking out |
| Germ Wash | Dr. Mario | Drop colored bubbles onto matching germs and they wash away | Two-color bubbles; plan which way to turn | Colors |
| Puff Float | Kirby's Dream Land | Hold to puff up and float, let go to drift down onto stars | Float through gaps or to a numbered star | Gentle timing |
| Cookie Rows | Yoshi's Cookie | Slide rows and columns until a line of the same cookie forms | Two kinds at once | Pre-K |
| Dig Down | Mr. Driller | Tap a block and every touching block of that color pops; dig toward treasure | Choose the color that clears the most | No air meter |
| Treasure Hunt | Link's Awakening | Follow spoken directions on a small island map ("past the tree, into the cave") | Read a picture map, then give your own directions | Spatial language |
| Critter Friends | Pokémon Red/Blue | Meet a critter and offer what it likes to befriend it | A friends book to complete by habitat or color | Collecting without battling |
| Mini Golf | Mario Golf | Pull back to putt; the ball always rolls in eventually | Bank shots; count the putts without scoring | Tinker Lab |

#### Xbox Live Arcade (Xbox 360)

| Idea | Inspired by | First playable loop | Grows into | Notes |
| --- | --- | --- | --- | --- |
| Big Fish, Little Fish | Feeding Frenzy | Swim a little fish and gobble littler snacks to grow; big fish just swim by | Eat only things smaller than you; order fish by size | Size comparison; nobody gets eaten |
| Piñata Garden | Viva Piñata | Plant flowers and fruit, and the critters who love them come to visit | Each visitor wants something; plan the garden to invite three | Nature and habitats; treehouse garden |
| Block Builder | Minecraft, A Kingdom for Keflings | Tap to place soft blocks; a critter moves into whatever you build | Copy a little blueprint; count blocks per wall | Treehouse creativity |
| Match the Card | Uno, Family Game Night | Take turns with the pet: play a card that matches the color or the number | Choose between two matches; count cards left | Playing together and turn-taking |
| Four in a Row | Connect Four (Family Game Night) | Drop discs together to make a glowing line | Find a way to complete a line from a puzzle position | Roughly 5–8; cooperative puzzle first |
| Puddle Boats | Hydro Thunder | Tap to paddle a boat; everyone waits at the finish and cheers | Paddle around buoys in number order | Lower priority |

Out of bounds, but with a salvageable piece:
- **Plants vs. Zombies** (defense): its lane grid survives as "plant three in each row", an early taste of multiplication arrays, in Little Farm.
- **Trials HD and Doritos Crash Course** (crash physics): they could become a wobbly bike that only ever bounces, but it's low value.

#### Nintendo DS and Wii

| Idea | Inspired by | First playable loop | Grows into | Notes |
| --- | --- | --- | --- | --- |
| Cloud Path | Yoshi Touch & Go | A baby critter floats down; draw cloud lines to steer it past stars to a cushion | Collect the stars in number order | Drawing to control |
| Rainbow Road | Kirby Canvas Curse, Line Rider | Draw a rainbow and a rolling critter rides it to a goal | Ramps, bridges and walls to turn it around | Merges Draw a Ramp |
| Bug Net | Animal Crossing | Swish a net to catch butterflies and bugs, then let them go | Sort catches into jars by kind or color; a little museum page | Science; nothing is kept in a jar forever |
| Blob Roll | LocoRoco (PSP) | Tilt the land with two big buttons to roll a jelly blob that sings | Split the blob into 5 and merge them back ("2 and 3 make 5") | Part-whole numbers |
| Find the Friend | Find Mii (Wii Play) | Find the friend who looks like this one in a little crowd | Find by two clues: hat *and* stripes | Visual discrimination |
| Pin Roll | Wii Sports Bowling | Roll a ball and knock pins down | How many fell? How many are left? (taking away) | Counting Cove |
| Puppy Pal | Nintendogs, Tamagotchi, Pou | Feed, wash and play fetch with a pet that's always happy to see you | Its routine: what comes after lunch? | Fits the treehouse; no neglect states |
| Rolly Ball | Katamari Damacy (PS2) | Roll a sticky ball; small things stick and it grows | Pick up things smaller than the ball first | Size comparison |

#### 90s computer edutainment

These references span preschool through elementary school. Preserve exploration and playful feedback; scale reading, number work, and multi-step reasoning deliberately.

| Idea | Inspired by | First playable loop | Grows into | Notes |
| --- | --- | --- | --- | --- |
| Busy Picture | Living Books | A storybook page where everything does something when tapped | Words light up as they're read; tap a word to hear it | Story Grove literacy |
| Lost and Found | Putt-Putt, Freddi Fish, Pajama Sam | Help a friend find a lost thing across three little screens | Give each thing to the right friend (a bone for the dog) | Problem solving; short quests |
| Follow the Leader | Lemmings | Little critters march along; place signs to guide them to the door | Split them between two doors; compare plans | Roughly 5–8; nobody falls (they turn around) |
| Munch Maze | Cookie Monster Munch (Atari), Pac-Man | Carry cookies one at a time through a simple maze to the jar | Bring exactly 4; the ghosts are friendly and wave | Merges the catalog's Maze Walk |

#### Board games

| Idea | Inspired by | First playable loop | Grows into | Notes |
| --- | --- | --- | --- | --- |
| Island Race | Candy Land, Chutes and Ladders | A grown-up and child take turns: tap the spinner, and hop that color or number of steps along a path | Count the hops yourself; slides are fun, not setbacks | Playing together; turn-taking |
| Who Is It? | Guess Who? | Tap the friend with a hat | Narrow down with yes/no clues | Pre-K reasoning |

### Reference shelves added in the gap review (2026-10-06)

That review compared both idea notebooks with the registry, which then held 63 games, and found whole shelves of references that had never been consulted. Ideas it suggested that are now built are marked.

| Missing shelf | Why it matters here | Ideas it suggests below |
| --- | --- | --- |
| **JumpStart's full range** | Only JumpStart 1st and 3rd Grade were cited. [JumpStart Baby](https://www.mobygames.com/game/99805/jumpstart-baby/) (1998) was made for 9–24 months, her current age: eight activities around a house with a teddy bear, where any key press moves the activity along. JumpStart's 3D Virtual World and JumpStart.com (2007–2009) let children adopt and care for pets beside the learning games, the literal meeting point of this project's two inspirations. | Color Train; a model for the pet treehouse |
| **Preschool computer classics** | Edmark's Early Learning House (Millie's Math House, Bailey's Book House, Sammy's Science House) gave most activities an explore mode and a mode where a character asks for something, the same split as Puddle Island's free-play and named-target levels. Sierra's [Mixed-Up Mother Goose](https://mocagh.org/sierra/mothergoose-manual.pdf) (1987) is a whole adventure of returning lost things to nursery-rhyme characters, one at a time. | Build-a-Bug counting, Doghouse Directions, Fripple Orders, Mother Goose Muddle |
| **Elementary reasoning classics** | The 6–11 plan cites curriculum standards but few games made for that age: Sunburst's The Factory and [Building Perspective](https://education.ti.com/html/eguides/discontinued/applications/EN/Building-Perspective-Guidebook-TI73_EN.pdf), The Learning Company's Rocky's Boots and Gertrude's Secrets, Edmark's [Thinkin' Things](https://www.atarimagazines.com/compute/issue168/78_Thinkin_things.php), MECC's The Oregon Trail, Number Munchers, Lemonade Stand and Storybook Weaver, Broderbund's Carmen Sandiego, and Maxis' SimTown, SimPark and SimSafari. | Machine Line, Skyline View, Sorting Machine, Number Munch Grid, Postcard Detective, Little Town Planner, Story Weaver |
| **Other children's worlds** | Webkinz (pet rooms and minigame jobs), Poptropica (self-contained story islands), Animal Jam (animal facts in a social world) and Moshi Monsters (a monster, its room and collectible creatures) show what children loved about pet worlds, and which membership and neglect patterns to avoid. More Neopets and Club Penguin games also fit: Kacheek Seek, Lunar Temple and Thin Ice. | Count the Peekers, Guess the Pumpkin, Moon Window, Mossy Path |
| **Gentle flash games** | Orisinal's calm one-button games (Winterbells), Eyezmaze's order puzzles (the Grow series), Fantastic Contraption, Fireboy and Watergirl's two-player puzzles and Snail Bob's slow walker. | Seed Order, Two Friends, Snail Walk |
| **Touch-native learning apps** | Games designed for this age on tablets: Khan Academy Kids, [Teach Your Monster to Read](https://www.teachyourmonster.org/) (the child creates a monster and teaches it to read), DragonBox, Slice Fractions, [Thinkrolls](https://apps.apple.com/us/app/917176209), Toca Nature, Tinybop's explorable systems, Lightbot, ScratchJr, and Breathe, Think, Do with Sesame. | Roll-a-Roll, Slice to Fit, Box Balance, Number Friends, Belly Breaths |
| **Toy-like music and art apps** | Chrome Music Lab's Kandinsky, Blob Opera, Incredibox, Vectorpark's Windosill and Metamorphabet, Hidden Folks, and Fox and Sheep's Nighty Night! (the nearest app relative of Goodnight Room). | Draw a Song, Hat Band, Sing Higher; more in [the microgame notebook](#console-and-app-references-for-new-kinds-of-play) |
| **Cooperative games and logic toys** | Only competitive board games were cited. Peaceable Kingdom's Hoot Owl Hoot! and Count Your Chickens!, HABA's First Orchard and Gamewright's Outfoxed! share one goal among the players. ThinkFun's Rush Hour Jr., Robot Turtles and Laser Maze, Spot It!, mancala, Shut the Box and classroom manipulatives (ten frames, Montessori golden beads) build logic and number ideas in careful steps. | Owl Walk Home (built), Garden Rows (built), Ferry Jam (built), Pancake Stack, Snap Pairs, Seed Bowls, Flip Ten, Lasso Loops (built) |
| **Picture books, rhymes and preschool TV** | What a one-year-old meets first: *Brown Bear, Brown Bear, What Do You See?*, *The Very Hungry Caterpillar*, *We're Going on a Bear Hunt*, *Rosie's Walk*, nursery and action songs, Numberblocks, Blue's Clues and Bluey. | Brown Bear Parade, Caterpillar Week, Bear Hunt Walk, Clue Paws, Keepy Uppy, Pet Says (built) |
| **Hands-on science and simulations** | Stacking blocks, gears, water play and ramps, and the University of Colorado's free PhET simulations (Balancing Act, [Equality Explorer](https://phet.colorado.edu/en/simulations/equality-explorer), Mean: Share and Balance, Area Builder, Circuit Construction Kit). | Block Tower (built), Gear Garden, Pour and Fill, Shape Rollers, Circuit Garden, Share Fairly |
| **Design and learning research** | Touch-gesture studies with preschoolers, developmental milestones for the lap band, and research-based orderings of early math skills. | [Design and learning references](#design-and-learning-references) |

### New ideas from the gap review

#### Early-learning software

| Idea | Inspired by | First playable loop | Grows into | Notes |
| --- | --- | --- | --- | --- |
| Color Train | JumpStart Baby (Color Train) | Any tap sends the next thing from the cupboard (a red apple, a blue boat) to the train car of its color; the pet names both | She chooses the car; then two things for each car | A lap entry for Color Garden or Pattern Train. Needs the open decision about lap levels outside a ladder's order. S |
| Build-a-Bug counting | Millie's Math House (Build-a-Bug) | Freely add legs, eyes and spots to a bug | "A bug with three legs and two eyes"; compare two bugs | A Bug Builder counting mode, not a second bug game. S |
| Doghouse Directions | Bailey's Book House (Edmo & Houdini) | Tap a picture word and the puppy goes in, out, on, off or under the doghouse | Make the puppy match a picture; two directions in a row | Peekaround Island already places friends behind, in front of and next to; this adds words for movement. A Peekaround mode. S |
| Fripple Orders | Thinkin' Things (Fripple Shop) | A customer asks for "the one with stripes"; pick it from a shelf of critters | Two attributes, then "stripes but not purple"; later a short written order, read aloud on request | One attribute-logic family with Critter Sort and Critter Crossing; extend those first. S |
| Mother Goose Muddle | Mixed-Up Mother Goose; Living Books | Bo Peep's sheep wandered to the beach: carry one thing home at a time, and its rhyme plays as a little song | Remember where things were seen; a picture list of three errands | A toddler-sized Lost and Found that could seed Island Errands. Public-domain rhymes, synthesized tunes, resumable steps. M–L |

#### Elementary reasoning classics

| Idea | Inspired by | First playable loop | Grows into | Notes |
| --- | --- | --- | --- | --- |
| Machine Line | Sunburst's The Factory | Send a plain block through machines that paint it, add a stripe or turn it, and see what comes out | See a finished toy, then choose the machines and their order; find two orders that make the same toy | Inductive reasoning and sequence, roughly 6–10; Robot Path's plan-then-run with a product instead of a route. M |
| Skyline View | Sunburst's Building Perspective | Look at block towers from the front and the side, then choose how they look from above | Build towers that match given side views | Peekaround Island's older mode or a Skywatch Isles activity, roughly 7–11. M |
| Sorting Machine | The Learning Company's Rocky's Boots and Gertrude's Secrets | Critters ride past a gate with one sensor: a hat opens it | Join two sensors with AND, OR and NOT tiles; test the machine on a parade of critters | Continues Critter Sort → Critter Crossing → Rule Parade with a visible machine instead of words. Roughly 8–11. M–L |
| Number Munch Grid | MECC's Number Munchers | The pet hops around a grid of numbers and munches those that fit a rule: even, more than 5 | Multiples, then sums such as "makes 10" | No chasing creatures, lives or timer; roughly 6–10. Treasure Map's grid could host it. S–M |
| Postcard Detective | Broderbund's Where in the World Is Carmen Sandiego? | A traveling friend sends postcards showing an animal, a plant and the weather; choose which island place each came from | Combine two clues; later a world map with reviewed facts about continents and animals | Inference from evidence, roughly 6–11; a friend's trip instead of a thief. Real-world facts need content review. M |
| Harbor Fortune Wheels | Neopets' named wheels; probability spinners | Compare the fully visible **Steady** and **Surprising** wheels, predict, spend one earned ticket and record what happened | Natural-frequency history; direct-price alternatives; a bounded cosmetic collection with disclosed rarity | Promoted to the roadmap as part of the Maker Harbor fair, not a stand-alone catalog game. An empty slice is a valid bounded loss when chosen with visible odds; no purchases, expiring prizes, hidden odds or real-time spin cooldown. S after Harbor Tickets |
| Harbor Bank | Neopets' National Neopian Bank; savings accounts and certificates of deposit | Voluntarily set aside a concrete ticket amount and see the guaranteed larger amount and date before confirming | Compare liquid savings with longer certificates; later percentages, compounding and early withdrawal | Promoted to the roadmap as the one planned real-time exception: maturity and interest happen automatically while away, with no daily claim or absence penalty. Start with “10 becomes 11 tomorrow”; accelerated island rates must be labeled as a model. M after Harbor Tickets |
| Little Town Planner | Maxis' SimTown, SimPark and SimSafari | Place houses, a park and a shop; residents walk where the paths lead | Meet visible needs (a park near every house); compare two layouts | Systems thinking for 8–11, overlapping Block Builder and Habitat Helpers. No budget failure or disasters. L |
| Story Weaver | MECC's Storybook Weaver; Kid Pix; Drawn to Life (DS) | Make a three-page picture story from scenes, characters and stamps; the pet narrates it | Add a sentence from word tiles; save one story to the journal | Persistent creative work; depends on Stamp Studio and bounded creation storage. M–L |

#### Children's worlds and flash games

| Idea | Inspired by | First playable loop | Grows into | Notes |
| --- | --- | --- | --- | --- |
| Count the Peekers | Neopets' Kacheek Seek and Potato Counter | How many bunnies hide in the garden? Tap each one to count it, and it waves back | A busier scene; guess "a few or lots?" first, then count to check | Kacheek Seek is the untimed version of Potato Counter, with unlimited guesses; keep that version. A Critter Spotter level or a Duck Pond mode. S |
| Guess the Pumpkin | Neopets' Guess the Weight of the Marrow; fairground guessing games | Does the pumpkin weigh as much as 2, 5 or 10 apples? The seesaw shows the answer | Estimate, then measure with units; compare guesses | Estimation as an unscored prediction, like Sink or Float. A Seesaw Balance mode. S |
| Moon Window | Neopets' Lunar Temple | Tap the bedroom window to see the next night's moon | Choose the next moon in the sequence; later relate its shape to where the sun is | Space science, roughly 5–9. Nights advance by taps, never by real days. Check the model before explaining causes. S–M |
| Mossy Path | Club Penguin's Thin Ice | A turtle crosses a mossy grid and every square it steps on blooms; visit every square once to reach the pond | Thick moss can be crossed twice; larger grids | A path-covering puzzle for roughly 5–10, a different decision from Penguin Slide. Undo; nothing falls in. S–M |
| Seed Order | Eyezmaze's Grow series | Place four things on a tiny island in any order; each changes the others (rain makes a seed sprout) | Find the order where everything reaches its happiest form; compare two orders | Order and cause and effect, roughly 6–11. Every order makes something charming, and replay is free. M |
| Two Friends | Fireboy and Watergirl | A duck can swim and a hen can fly; each opens a gate the other needs | One player for each friend, or switch between them; puzzles need both | Cooperative play; overlaps Shape Buddies. A one-player switch is required. M |
| Snail Walk | Snail Bob; Lemmings | A snail walks slowly home; tap levers and bridges to make its path | More switches, where the order matters | Cause and effect, roughly 4–8. The snail waits at gaps and never falls; one walker instead of Follow the Leader's crowd. S–M |

#### Touch-native learning and music apps

| Idea | Inspired by | First playable loop | Grows into | Notes |
| --- | --- | --- | --- | --- |
| Roll-a-Roll | Thinkrolls | Roll a round friend through a little cave: jelly squishes, ice melts by the lantern, a balloon floats up | Combine properties: push a block onto a button, melt ice to open a drop | Material properties and planning, roughly 3–8. M |
| Slice to Fit | Slice Fractions | Slice a log so the right piece fills a gap in a bridge | Halves, thirds and quarters of different wholes; two slices that fit the same gap | Fractions as measures, roughly 6–10; a 6–8 mode for Inchworm or Pet Kitchen. S–M |
| Box Balance | DragonBox Algebra 5+; PhET's Equality Explorer | A mystery box shares one pan with apples; take the same thing off both sides until the box is alone | Two-step equations; check by putting things back | Taking the same off both sides is built (Seesaw Balance 8–9); two-step equations and two different unknowns remain. Every change happens to both sides. S–M |
| Number Friends | Numberblocks; DragonBox Numbers | Drop a 2 onto a 3 and they join into a 5 that says its name | Split a 5 into two friends every way; towers of ten | A stronger reference for the existing Number Merge idea. S |
| Belly Breaths | Breathe, Think, Do with Sesame; Daniel Tiger's Neighborhood | Hold the pet's tummy and it breathes in as a balloon grows; let go and it breathes out | Name a feeling, breathe, then choose a plan (ask for help, take a turn) | A calming strategy to practice, lap–pre-K. No right speed, never scored, and it ends whenever she likes. Could be a Feelings Faces mode. S |
| Draw a Song | Chrome Music Lab's Kandinsky | Draw a line and it plays; higher lines sing higher notes, and a circle sings with a voice | Draw a tune's rising or falling shape to match one she heard | Art and music together, lap–school, on pentatonic steps from `notes.ts`. S–M |
| Hat Band | Incredibox; Toca Band | Drop a hat on a critter and it joins the song with its own loop | Up to four parts; mute and solo; a verse and a chorus | Layered composition where dressing up makes music; every mix stays in key. M |
| Sing Higher | Blob Opera | Drag a singer up and it sings higher while the others harmonize | Copy a two-note shape; lead a call and response | A Sound Garden high/low mode, with the sliding pitch snapped to pentatonic steps. S |

#### Board games, logic toys and manipulatives

| Idea | Inspired by | First playable loop | Grows into | Notes |
| --- | --- | --- | --- | --- |
| Pancake Stack | Tower of Hanoi | Move three pancakes to a friend's plate; a big pancake slides off a smaller one | Four pancakes; count moves as an optional challenge | Recursive planning for roughly 6–10. The rule is shown physically, not scored as a miss. S |
| Snap Pairs | Spot It! (Dobble) | Two cards share exactly one picture; tap it on either card | Bigger cards; take turns with the pet | Visual search for roughly 4–9. No race: the pet waits for her. S |
| Seed Bowls | Mancala | Scoop the seeds from a bowl and drop one in each bowl along the row | Predict where the last seed lands; fill the store together | One-to-one counting and prediction, preschool–school; a shared goal instead of capturing. S–M |
| Flip Ten | Shut the Box | Roll two dice and flip down tiles that add up to the roll | Choose between ways to make the total; clear every tile | Number combinations, roughly 6–8. A stuck box simply resets. S |

#### Picture books, rhymes and preschool TV

| Idea | Inspired by | First playable loop | Grows into | Notes |
| --- | --- | --- | --- | --- |
| Brown Bear Parade | *Brown Bear, Brown Bear, What Do You See?* | Tap the page: "Red bird, what do you see?" and the next colored animal appears | Choose who comes next by color; build a chain and hear it read back | Call and response with colors and animal words, lap–toddler. Use original animals and wording. S |
| Caterpillar Week | *The Very Hungry Caterpillar* | Feed the caterpillar one apple, then two pears the next day, and so on | Days of the week in order; a cocoon, then a butterfly | Counting, the order of days and a life cycle, preschool–pre-K. S–M |
| Bear Hunt Walk | *We're Going on a Bear Hunt*; *Rosie's Walk* | Lead the family over the bridge, through the grass and under the log; each obstacle has its own sound | Follow a two-step spoken route; retell the walk in order; walk it back home | Words for movement and sequence, beside Peekaround Island's positions. The bear only wants a hug. M |
| Clue Paws | Blue's Clues; Outfoxed! | Pawprints mark three things around the room (a bowl, a ball, a blanket); collect them, then guess what the puppy wants | Clues that leave two answers until the third decides | Inference for roughly 3–6, between Peekaboo Barn and Secret Code. Clues stay replayable. S–M |
| Keepy Uppy | Bluey ("Keepy Uppy") | Tap a slowly floating balloon to send it up; if it lands, it bounces and floats back | Count taps; two balloons; a grown-up's second finger joins in | Tracking for lap–preschool; overlaps Bounce Back's rally with floatier physics. S |
| Little Conductor | *Peter and the Wolf*; *Fantasia* | Wave a baton (drag up and down) and the critter band plays faster or slower; tap a section to start it | Louder and quieter; "which instrument is the bird?" by listening | Tempo, loudness and instrument sounds for Music Mountain, with a new conducting gesture. M |

#### Hands-on science and simulations

| Idea | Inspired by | First playable loop | Grows into | Notes |
| --- | --- | --- | --- | --- |
| Gear Garden | Gear toys; crank music boxes; jack-in-the-box | Turn a big crank and a music box plays; at the end a friend pops up | Connect gears so a flower spins; predict which way the last gear turns; a big gear turns a small one fast | Simple machines from lap to 6–8, with a new crank gesture. M |
| Pour and Fill | Water-table play; Piaget's conservation tasks | Tilt a jug to pour juice into a cup until it reaches the line | Which holds more, the tall cup or the wide bowl? Count small cups to fill a big jug | Capacity and conservation, toddler–school, with a new pour gesture. Spills go into a tray and can be poured back. M |
| Shape Rollers | Classroom 3D-shape ramp tests | Send a ball, a block, a can and a cone down a ramp; see which roll, slide or stack | Sort shapes by what they do; name sphere, cube, cylinder and cone | 3D shapes, preschool–pre-K, reusing Ramp Race's ramp. S–M |
| Circuit Garden | PhET's Circuit Construction Kit; snap-together circuit kits | Join a battery, wires and a lamp so the firefly lantern lights | Open and closed loops; a switch; two lamps | Electricity, roughly 6–10, with an explicit simple model. M |
| Share Fairly | PhET's Mean: Share and Balance | Move cookies between plates until everyone has the same | Leftovers; the fair share as an average | An 8–10 mode for Monster Munch or Pet Kitchen. S |

### Console and app references for new kinds of play

The source links describe the original mechanics; the translations are proposals, with substantial changes in controls, scope and difficulty.

| Reference | Useful design idea | Puddle Island translation |
| --- | --- | --- |
| [Snipperclips](https://media.nintendo.com/snipperclips/) | Change shapes to solve physical puzzles together; several solutions can work | **Shape Buddies:** two paper friends make a cradle, ramp, or scoop to help a ball or seed reach home. |
| [Nintendo Land](https://www.nintendo.com/en-gb/News/2012/New-Nintendo-Land-details-released-as-Wii-U-launch-approaches-660170.html) | A recognizable park of compact attractions with different interactions | **Island Toy Fair:** choose three familiar activities on a picture route; each contributes one visible piece of a shared celebration. |
| [Big Brain Academy](https://www.nintendo.com/en-ca/whatsnew/ask-the-developer-vol-3-big-brain-academy-brain-vs-brain-part-1/) | A collection organized around distinct kinds of tasks | **Peek and Think:** explore silhouettes, compare amounts, and infer what a picture is gradually revealing. No brain-age score or intelligence claim. |
| [Scribblenauts Unlimited](https://www.nintendo.com/en-gb/Games/Wii-U-games/Scribblenauts-Unlimited-701721.html) | Objects and adjectives change how a problem can be solved | **Silly Describer:** choose spoken picture words such as long/short or big/small, watch an object change, and try it in the scene. |
| [A Little to the Left](https://www.maxinferno.com/press/) | Tactile sorting, fitting, and patterns, sometimes with multiple solutions | **Toy Drawer:** organize the same objects by color, shape, or size; each sensible rule creates a different pleasing arrangement. |
| [World of Goo 2](https://tomorrowcorporation.com/posts/world-of-goo-2-is-out-now) | Building a structure and then watching it behave is the central interaction | **Wobble Works:** assemble a little bridge, send a passenger across, and change one support after watching where it bends. |
| [Baba Is You](https://www.hempuli.com/Baba/) | The rules themselves become movable objects | **Rule Parade:** rearrange spoken picture-rule tiles to change which critters can cross or what action they perform. A later 7–10 stretch. |
| Vectorpark's Windosill and Metamorphabet | Wordless, tactile scenes in which poking, pulling or turning anything causes a surprising change; Metamorphabet's letters grow into things that begin with them | A **lap toy shelf** where every object transforms when touched; later, a letter that grows into its word, which suits Word Monsters |
| [Hidden Folks](https://hiddenfolks.com/press) | A busy hand-drawn scene where hundreds of things react to touch, with mouth-made sound effects, and a list of things to find | **Count the Peekers** and Critter Spotter: every bush rustles and every critter waves, so searching is fun before anything is found |
| [Thinkrolls](https://apps.apple.com/us/app/917176209) | Logic puzzles about what objects do (squish, melt, float), with easy and hard modes | **Roll-a-Roll**: properties become the puzzle pieces, and a cave can have a second answer at the harder level |
| Monument Valley | Paths that connect only from the right viewpoint | An 8–11 Peekaround Island mode; younger bands keep the four honest views |
| [Chrome Music Lab's Kandinsky](https://musiclab.chromeexperiments.com/Kandinsky/) | Any drawing plays as music, and different shapes have different voices | **Draw a Song**: Rainbow Fingers-style strokes become pentatonic tunes |
| [Blob Opera](https://experiments.withgoogle.com/blob-opera) | Drag a singer up or down and the others harmonize | **Sing Higher**: sliding pitch, snapped to pentatonic steps, as a Sound Garden mode |
| Incredibox | Dressing characters adds layered loops that always fit together | **Hat Band**: hats are instruments, so dressing up is composing |
| Super Mario Galaxy's co-star mode; New Super Mario Bros. Wii's Super Guide | A second player helps through a simpler role; a stuck player can watch the way through | A grown-up **helper role** in more games, and demonstrated completion that still counts as finishing |
| Unpacking; Wilmot's Warehouse | Putting belongings in sensible places tells a story; the player's own categories work if things can be found again | **Toy Drawer** and the pet treehouse: tidy by any sensible rule, then fetch what the pet asks for |

### Party and co-op references

From the research behind couch play. Use existing games first; the raft is the strongest small controller experiment, and cooperative construction a deeper later slice.

| Reference | What to study | Puddle Island experiment |
| --- | --- | --- |
| [Super Mario Party Jamboree: Minigame Bay](https://www.nintendo.com/my/switch/a7hl/harbor/index.html) | Packs of minigames, tag matches, and free selection outside a full board session | The three-choice party route; retain always-available play rather than daily availability. |
| [Super Mario Party: Partner Party and River Survival](https://play.nintendo.com/news-tips/tips-tricks/super-mario-party-modes-tips-tricks/) | Discussing routes and coordinating toward a shared destination | A later two-player raft delivery: one controls each side, collect supplies, dock together. This would be a new activity, with a solo helper and a fixed delivery goal. |
| [WarioWare: Get It Together!](https://www.nintendo.com/us/store/products/warioware-get-it-together-switch/) | Varied tiny actions and characters with different abilities; cooperative play | Extend the existing Quick Tricks family with complementary jobs, such as one player holding a bridge while the other carries a parcel. Keep the island's forgiving pacing. |
| [Snipperclips](https://www.nintendo.com/us/store/products/snipperclips-cut-it-out-together-switch/) | Talking through a spatial problem and coordinating different actions | Develop the existing Shape Buddies idea with a small set of predefined shapes and roles before freeform cutting or general geometry. |

## Design and learning references

- **Touch gestures.** Sesame Workshop's [Best Practices: Designing Touch Tablet Experiences for Preschoolers](https://joanganzcooneycenter.org/?p=19607) (2012) reports that tapping is the most intuitive gesture, that pinching and flicking are hard for developing hands, that preschoolers rest their wrists on the tablet's bottom edge (so controls there get touched by accident), and that non-readers need spoken and visual reinforcement. Check new controls against the bottom-edge finding as well as the pet's corner.
- **The lap band.** The CDC's [milestone checklists](https://www.cdc.gov/act-early/milestones/15-months.html) list stacking two blocks, copying other children, and following directions given with words and a gesture by about 15 months; copying chores and following one-step directions without a gesture by about 18 months. These point toward lap activities beyond tap-to-reveal scenes. The American Academy of Pediatrics' [Media and Young Minds](https://doi.org/10.1542/peds.2016-2591) (2016) advises against screen media other than video chat before 18 months and recommends that grown-ups use media together with children aged 18–24 months. That supports designing lap modes for a grown-up's lap, with short sessions and off-screen suggestions.
- **Ordering early math.** Clements and Sarama's research-based learning trajectories, used in their Building Blocks pre-K curriculum, describe the steps children usually take in counting, subitizing, shape composition and other topics. Use them to check the order of levels in number and shape games.
- **Low floor, high ceiling, wide walls.** Seymour Papert's and Mitchel Resnick's principle for Logo and Scratch: easy to start, room to grow, and many different things to make. It is a compact test for creative games such as Stamp Studio and Story Weaver.
- **The pet as a learner.** Teach Your Monster to Read frames reading practice as teaching a monster the child made. Word Monsters and Rhyme Time could let the child's answers teach the pet, who proudly reads the word back.
- **Supported completion has precedents.** New Super Mario Bros. Wii's Super Guide offers a demonstration after repeated difficulty; Super Mario Galaxy's co-star mode gives a second player a simple helping role; Mario Kart 8 Deluxe's smart steering keeps young drivers on the track. They support Puddle Island's demonstrated completion and suggest a grown-up helper role in more games.
- **Story islands.** Each Poptropica island is a self-contained story with a clear ending that a child can finish and revisit, which is the right size for an Island Errands episode.
- **Honest simplified models.** PhET simulations show how a simplified model can stay truthful. Balancing Act adds lever distance, a later step after Seesaw Balance's fixed pans; Area Builder suggests an area and perimeter mode for Bug Builder.

## Overlaps and scope decisions

Prefer a mode of an existing game when the meaningful action is the same; make a new game when the learning and controls differ.

| Earlier name / idea | Keep it here | Scope decision |
| --- | --- | --- |
| Pizza Shop | Pet Kitchen for fractions; Scoop Shop for ordered toppings | Sharing equal pieces is different from stacking an order |
| Maze Walk | Munch Maze or a Robot Path board | Avoid another maze with the same decisions |
| Tidy Up | Trash Sort | Sort familiar objects; explain categories without judging a family's routine |
| Letter Fishing | Fishing Pond | A spoken sound/letter target can be a mode |
| Word Builder | Word Monsters | Extend sound/word work after checking speech quality |
| Sock Match / Shadow Match | Memory Match or Shape Sorter modes | Add attribute or silhouette reasoning if it is meaningfully new |
| Lost and Found | A later Island Errands story | Keep one adventure system and a small authored cast |
| Critter Friends / Piñata Garden / Puppy Pal | Habitat Helpers, journal, and pet treehouse | Befriending, inviting visitors, and pretend care share the persistent world |
| Echo Knock / a woodpecker's rhythm | Sound Garden's echo level and Rhythm Neighbors | Both already cover echoing and answering a rhythm; add a new scene only if its payoff adds something |
| Rhyme Picnic | Rhyme Time | Rhyme Time covers choosing a rhyme; a picnic scene is only worth it for its payoff |
| Color Train (JumpStart Baby) | A lap mode of Color Garden or Pattern Train | Needs the decision about lap levels outside a ladder's order |
| Build-a-Bug counting | Bug Builder | A counting mode, not a second bug game |
| Doghouse Directions / Bear Hunt Walk | Peekaround Island for positions; Bear Hunt Walk for movement along a route | Start as a Peekaround mode for in, on and under; build Bear Hunt Walk only if moving along a route proves to be the new decision |
| Fripple Orders / Sorting Machine | Critter Sort, then Critter Crossing and Rule Parade | One attribute-logic family across ages; the machine adds AND, OR and NOT for 8–11 |
| Count the Peekers | Critter Spotter, or a Duck Pond mode | Counting in a busy scene, without Potato Counter's countdown |
| Guess the Pumpkin / Box Balance | Seesaw Balance modes | Estimation as an unscored prediction; equations continue levels 8–9 |
| Number Friends | Number Merge | Numberblocks and DragonBox Numbers become its references |
| Sing Higher | Sound Garden | Sliding pitch as a high/low mode |
| Keepy Uppy | Bounce Back | A floatier one-player mode first |
| Mossy Path | Penguin Slide, or a new grid puzzle | Visiting every square is a different decision from sliding to a stop; share the grid and undo code |
| Snail Walk | Follow the Leader | One slow walker instead of a crowd; choose one of the two |
| Story Weaver | Story Theater and Stamp Studio | One creative-story system, built on the existing creation storage |
| Fantastic Contraption, Crayon Physics Deluxe | Chain Reaction and Rainbow Road | Additional references, not a separate contraption game |
| Island Toy Fair | Couch trips | Choosing three activities that build a shared celebration is what a couch trip does; revisit only for the child's island |
