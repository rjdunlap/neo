# Microgames and new kinds of play

A companion to [ARCADE-IDEAS.md](ARCADE-IDEAS.md), exploring WarioWare and other references for more varied Puddle Island activities. Everything here is a **proposal**. Age ranges describe possible adaptations, not the source games' ratings or new implemented bands. [ROADMAP.md](ROADMAP.md) remains the development backlog.

The opportunity is to vary the shape of play as well as the subject: a tiny physical joke, a rhythm conversation, a cooperative construction, a scene seen from another side, or a puzzle with several good answers. Learning goals below describe intended practice, not measured educational effects.

## WarioWare: a useful model for Quick Tricks

WarioWare combines short, varied interactions with visual comedy. The touch input in **WarioWare: Touched!** makes it a useful interface reference; **Get It Together!** also explores how different characters approach microgames and provides ways to revisit favorites. These are references for interaction and presentation, not templates for the pacing or reward system. ([Nintendo's Touched! manual](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_WarioWareTouched_EN.pdf), [Get It Together!](https://www.nintendo.com/sg/switch/aw7n/index.html), [Nintendo's practice/replay tips](https://play.nintendo.com/news-tips/tips-tricks/warioware-microgames-quick-tips/))

The existing **Quick Tricks** idea becomes a little variety show: **hear a short prompt → try one satisfying action → enjoy its funny consequence → choose to continue or replay**. For example, pull an enormous leaf over a bunny when it rains; the bunny shakes the water onto a flower, which opens into a tiny umbrella of its own.

What to carry over:

- **A scene that explains the action.** A long parcel and a sideways slot suggest turning. Add a spoken prompt and a freely replayable demonstration.
- **A strong verb.** Turn, stretch, match, share, uncover, connect, or echo. Use a familiar gesture before adding a new one.
- **An expressive payoff.** A satisfied monster wears its matched socks on its ears; a bridge wiggles proudly when the passengers cross.
- **Variation within something familiar.** Move the slot or change the amount after the child knows the task. Keep controls stable within a set.
- **A finale that combines learned actions.** A little picnic or train departure uses two actions already practiced, with each step visible. It is a celebration, not an exam.

For Puddle Island, each scene waits for the child. No fuse, countdown, lives, escalating speed, or forced jump to the next screen. Humor never depends on humiliating the player. Moving targets return and wait. A hint shows the relationship or action, and a demonstrated completion still counts as completing the scene.

### Three ways to present the same small activities

| Format | Who it might fit | How it works |
| --- | --- | --- |
| **Toy shelf** | Lap/toddler with a grown-up | Choose one toy and keep playing with it. A large Next control is available; there is no surprise rule switching. |
| **Little show** | Roughly 3–6 | Three scenes with one gesture family, followed by a small finale. A picture strip shows the sequence; the child advances each scene. |
| **Remix show** | Roughly 6–8 | Mix familiar actions and add one visible condition: turn the long parcel, share the red fruit, then copy the rhythm. Surprise comes from the scene, while the current rule stays clear. |

Quick Tricks is built with two Little Shows: **Umbrella Up → Sock Gobbler → Bridge Stretch** (levels 1–3) and **Parcel Turn → Picnic Places → Last Berry** (levels 4–6). [DESIGN.md](DESIGN.md) describes them; neither has been judged with a child yet. The first show's scenes all use a single-finger drag to change a visible relationship, yet produce different reactions. Add further gestures one show at a time, as in [the proposed third show](#a-third-show-new-gestures).

The whole show is one round and earns one sticker. A scene inside it does not call the shell's finish function. Keep each scene's input, hints, and cleanup contained; report round statistics once at the end. Define miss/hint accounting before mixing tasks so a longer show does not automatically look like a struggling round. Replaying a prompt or demonstration is not a wrong answer. The first prototype can be one game with a few small scenes; it does not need a general microgame framework or dozens of map icons.

### Microgame seeds

Six of the original twelve seeds are now the two Quick Tricks shows above. The six below remain small scenes, not promised standalone games. Some intentionally reuse a current learning loop; the new value is the situation, interaction, or shared show.

| Scene / rough range | Spoken invitation and action | The satisfying result | Skill and deeper variation |
| --- | --- | --- | --- |
| **Finish the Wiggle / 4–7** | “What comes next?” Choose the next pose in a short dance pattern. | The whole line of critters performs it. | Pattern continuation; later fill a missing middle pose. A possible Pattern Train extension. |
| **What Changed? / 4–7** | “Something changed!” Look at a before/after pair of a pet dressing scene. | The changed hat turns into a tiny waving friend. | Careful comparison; later hide the before view behind a freely available Peek button. No exposure timer. |
| **Echo Knock / 3–7** | “Your turn.” Echo a woodpecker's two or three knocks on a stump. | A sleepy tree opens its eyes and answers with a flourish. | Listening, order, and rhythm; later trade short/long patterns. Use synthesis, no microphone. Sound Garden's echo level already does the core of this; the new value would be the scene and its payoff. |
| **Switch the Track / 4–7** | “Send it to the flower.” Turn one big track junction. | A seed wagon reaches a pot and a flower pops up. | Following a route and predicting consequences; later two junctions. A compact Robot Path relative. |
| **Make Two Halves / 5–8** | “Share it equally.” Slide a dividing line across a square sandwich, then serve the two pieces. | Two guests unfold them into matching butterfly wings. | Equal parts of the same whole; later compare two valid ways to halve it. Snap to clear positions and show unequal pieces side by side. |
| **Rhyme Picnic / 4–7** | “Who rhymes with bee?” Hear and choose between picture names such as tree and boat. | Bee and Tree sing their rhyming names together. | Sound comparison; later choose another member of a word family. Review pronunciations and give a replay for every picture. |

## Other references worth borrowing from

The source links describe the original mechanics. The Puddle Island translations are design proposals, including substantial changes in controls, scope, and difficulty.

| Reference | Useful design idea | Puddle Island translation |
| --- | --- | --- |
| [Rhythm Heaven / Rhythm Paradise Megamix](https://www.nintendo.com/en-gb/Games/Nintendo-3DS-games/Rhythm-Paradise-Megamix-1091313.html) | Simple inputs, rhythmic audio/visual cues, comic routines, and remixes | **Rhythm Neighbors** (built): a woodpecker and frog chorus trade musical parts, then perform a duet. Fruit-bouncing and remix phrases remain ideas. |
| [Snipperclips](https://media.nintendo.com/snipperclips/) | Change shapes to solve physical puzzles together; several solutions can work | **Shape Buddies:** two paper friends make a cradle, ramp, or scoop to help a ball or seed reach home. |
| [Nintendo Land](https://www.nintendo.com/en-gb/News/2012/New-Nintendo-Land-details-released-as-Wii-U-launch-approaches-660170.html) | A recognizable park of compact attractions with different interactions | **Island Toy Fair:** choose three familiar activities on a picture route; each contributes one visible piece of a shared celebration. |
| [Big Brain Academy](https://www.nintendo.com/en-ca/whatsnew/ask-the-developer-vol-3-big-brain-academy-brain-vs-brain-part-1/) | A collection organized around distinct kinds of tasks | **Peek and Think:** explore silhouettes, compare amounts, and infer what a picture is gradually revealing. No brain-age score or intelligence claim. |
| [Captain Toad: Treasure Tracker](https://www.nintendo.com/en-gb/News/2015/January/In-shops-and-on-Nintendo-eShop-now-Captain-Toad-Treasure-Tracker-947257.html) | A small diorama becomes a puzzle when viewed from different sides | **Peekaround Island** (built): turn a tiny island to find who hides behind the tree and place friends behind, in front of and next to it. Older modes could find an opening or a path. |
| [Scribblenauts Unlimited](https://www.nintendo.com/en-gb/Games/Wii-U-games/Scribblenauts-Unlimited-701721.html) | Objects and adjectives change how a problem can be solved | **Silly Describer:** choose spoken picture words such as long/short or big/small, watch an object change, and try it in the scene. |
| [A Little to the Left](https://www.maxinferno.com/press/) | Tactile sorting, fitting, and patterns, sometimes with multiple solutions | **Toy Drawer:** organize the same objects by color, shape, or size; each sensible rule creates a different pleasing arrangement. |
| [World of Goo 2](https://tomorrowcorporation.com/posts/world-of-goo-2-is-out-now) | Building a structure and then watching it behave is the central interaction | **Wobble Works:** assemble a little bridge, send a passenger across, and change one support after watching where it bends. |
| [Baba Is You](https://www.hempuli.com/Baba/) | The rules themselves become movable objects | **Rule Parade:** rearrange spoken picture-rule tiles to change which critters can cross or what action they perform. A later 7–10 stretch. |

### Develop these into complete activities

**Shape Buddies — roughly 4–8; spatial problem solving and cooperation.** Two paper creatures need to carry a rolling seed to a pot. Give them three reversible shape tools: flatten, scoop, and slope. A child can switch between both; a grown-up can take one side. Begin with one gap and one known workable construction. Later, solve with a different arrangement or combine two useful shapes. The first version uses a small set of predefined silhouettes, avoiding arbitrary cutting geometry. Keep multiple successful arrangements valid. M effort.

**Silly Describer — roughly 4–8; descriptive language with a visible consequence.** A giraffe wants a scarf that reaches its shoulders. Choose a picture word to make the scarf longer; it becomes so long that two friends can share it. Another scene needs a small box to fit a shelf. Start with three nouns and four carefully authored modifiers, with every valid combination having a defined visual result. Offer several workable solutions where possible, then ask what changed through a picture choice or co-play prompt. No free-text generation, voice recognition, or online service is needed. M effort.

**Toy Drawer — roughly 3–8; classification, ordering, and explanation.** Spread six toy bugs around a box. Arrange them by color or size; the bugs settle down in a different little dance for each complete rule. Show an optional model if the child wants a puzzle; free arranging remains valid play. Older levels ask “Can you find another way?” or combine a size order with paired colors. Start as a Size Parade/Color Garden extension if the existing rules fit. Avoid implying there is one morally correct way to organize belongings. S–M effort.

**Wobble Works — roughly 5–8; prediction, comparison, and revision.** Build a short bridge from large snap-together pieces and walk a sleepy hedgehog over it. Watch a supported beam stay level while an unsupported one sags. A soft cushion catches everything, and a replay returns the exact construction for editing. Later, compare two designs using the same pieces or change one support while keeping the load fixed. Start with an authored set of stable/unstable constructions and explain it as a simplified model. This complements **Chain Reaction**: supporting a load is a different problem from routing a moving ball. L effort; do not assume the existing ball helper is a structural simulator.

**Rule Parade — roughly 7–10; symbolic reasoning and debugging.** Three big tiles initially read aloud as “Blue friends can cross.” Move a red tile into the first slot, then test which friends cross. Later, connect a visible condition to an action: friends with hats hop; friends without hats wave. Keep a trace showing which rule applied and allow undo. Start with two conditions and two actions, one rule at a time; interactions between several rules belong much later. This practices interpreting and changing a system, with icons and narration supporting emerging readers. M for the tiny prototype; L for interacting rules.

**Buddy Delivery — roughly 4–8 together; communication and sequencing.** One player chooses a destination from a picture request while the other guides a wagon, then swap roles. The map stays visible to both; cooperation does not depend on concealing half an iPad. Add a one-player toggle and let either player take over. A later request needs a route with two stops in an order chosen together. Use Mail Carrier as the starting point and borrow the attraction/co-play framing from Island Toy Fair. S–M as an extension.

Effort is relative and includes content and verification: S = contained extension, M = a new activity, L = substantial new simulation or several connected systems. A small prompt still needs robust touch behavior, solvable content, readable art, and a good ending.

## Additional seeds to keep on the shelf

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

## More references for new kinds of play

These were added by the [reference gap review](ARCADE-IDEAS.md#reference-gap-review-2026-10-06). Links are given where they were checked.

| Reference | Useful design idea | Puddle Island translation |
| --- | --- | --- |
| Vectorpark's Windosill and Metamorphabet | Wordless, tactile scenes in which poking, pulling or turning anything causes a surprising change; Metamorphabet's letters grow into things that begin with them | A **lap toy shelf** where every object transforms when touched; later, a letter that grows into its word, which suits Word Monsters |
| [Hidden Folks](https://hiddenfolks.com/press) | A busy hand-drawn scene where hundreds of things react to touch, with mouth-made sound effects, and a list of things to find | **Count the Peekers** and Critter Spotter: every bush rustles and every critter waves, so searching is fun before anything is found |
| [Thinkrolls](https://apps.apple.com/us/app/917176209) | Logic puzzles about what objects do (squish, melt, float), with easy and hard modes | **Roll-a-Roll**: properties become the puzzle pieces, and a cave can have a second answer at the harder level |
| Monument Valley | Paths that connect only from the right viewpoint | An 8–11 Peekaround Island mode; younger bands keep the four honest views |
| [Chrome Music Lab's Kandinsky](https://musiclab.chromeexperiments.com/Kandinsky/) | Any drawing plays as music, and different shapes have different voices | **Draw a Song**: Rainbow Fingers-style strokes become pentatonic tunes |
| [Blob Opera](https://experiments.withgoogle.com/blob-opera) | Drag a singer up or down and the others harmonize | **Sing Higher**: sliding pitch, snapped to pentatonic steps, as a Sound Garden mode |
| Incredibox | Dressing characters adds layered loops that always fit together | **Hat Band**: hats are instruments, so dressing up is composing |
| Pokémon Ranger (DS) | Draw loops around a creature to befriend it | **Lasso Loops**: a closed loop makes a group, the basis for counting groups and tens |
| Art of Balance (WiiWare); Boom Blox | Stacking and toppling are the whole game | **Block Tower**: an explicit support rule, gentle topples, and a cheer for the crash |
| Super Mario Galaxy's co-star mode; New Super Mario Bros. Wii's Super Guide | A second player helps through a simpler role; a stuck player can watch the way through | A grown-up **helper role** in more games, and demonstrated completion that still counts as finishing |
| Unpacking; Wilmot's Warehouse | Putting belongings in sensible places tells a story; the player's own categories work if things can be found again | **Toy Drawer** and the pet treehouse: tidy by any sensible rule, then fetch what the pet asks for |

## Gestures the island does not use yet

Current games tap, drag, hold a basket, pull back, draw, steer and use two hands at once; Lasso Loops now draws closed loops, so the loop row below is in use. Sesame Workshop's touch research found tapping and dragging easiest for preschoolers and pinching and flicking hard, so try each new gesture as a small scene before building a game around it.

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

### A third show: new gestures

The first two Quick Tricks shows use one-finger drags and taps. A third show could try three new gestures before any becomes a full game: **Wind the Music Box** (turn the crank until a friend pops up), **Fill the Cups** (pour to each cup's line) and **Loop the Fireflies** (draw one loop around three fireflies). In the finale the fireflies light their jar while the music box plays. At toddler level any turn, pour or loop succeeds; preschool and pre-K add a named amount ("fill it to the line", "loop three"), and a 6–8 remix asks for "two whole turns" or "half full". Cranking and pouring cannot go wrong, since an overflowing cup spills into a tray and can be poured back; only a closed loop around the wrong number of fireflies counts as a miss. Accounting follows the earlier shows: one sticker for the show, misses summed across it, and at most one hint per trick. Watch whether small hands can crank and close a loop before building Gear Garden or Pour and Fill. (Lasso Loops was built first, so its loop gesture can be watched directly on the iPad; Loop the Fireflies could still bring the gesture to toddlers.)

## A practical shortlist

1. **Shape Buddies is the remaining distinct interaction** from this list: collaborative construction with predefined shapes. Peekaround Island, its alternative, is built.
2. **Hold Silly Describer, Wobble Works, and Rule Parade for later scope decisions:** each needs authored behavior or deeper rules, and the last belongs in the older-child exploration.
3. **Try new gestures in [a third show](#a-third-show-new-gestures)** before building the crank, pour and loop games proposed in the [gap review](ARCADE-IDEAS.md#reference-gap-review-2026-10-06).

When observing a prototype, ask whether the child knows what to try, enjoys the result, can ask for help, and wants another variation. Try a fresh arrangement to distinguish understanding from memorizing one screen. Do not infer general cognitive gains from a completed microgame or a faster response.

These candidates broaden the idea pool without replacing the roadmap's verification, navigation, adventure, or home work. Promote a small slice when it fits the next requested task; this brainstorming pass does not mark any game or new framework implemented.
