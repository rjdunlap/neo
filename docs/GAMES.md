# Puddle Island games

What each game does and the design decisions behind its rules: what counts as a miss, what a hint shows, how the levels grow, and what was learned while building it. The [README inventory](../README.md#the-island-and-its-games) is the one-line summary and the game count; `src/games/registry.ts` and each game's `logic.ts` are the source of truth; the grown-up how-to cards in `src/content/howto.ts` say how to play each one. Shared systems (the shell, saves, the treehouse, couch play) are in [DESIGN.md](DESIGN.md).

Games are grouped by subject, the stable IDs in `src/content/world.ts`. Each game also has a home land on the island map (`LANDS` in `src/content/lands.ts`); today each land holds one subject's games under the subject's name, and the art subject's land is Paint Pier. Each entry gives the bands it plays in (from the registry) and, where there is one, what inspired it. Some games also play on the couch; [COUCH-PLAY.md](COUCH-PLAY.md) lists them.

When a game changes, update its entry here. A new game gets an entry in its subject.

## Bubble Beach (senses)

### Bubble Pop

*lap–school.* Tap bubbles as they float up; later, one color, numbers in order, then pairs. A wrong bubble only wobbles and gets a spoken hint. Levels 10–11 (number bonds): every bubble has a partner that makes 5 (pre-K) or 10 (early school). Tap one to hold it still with a glow, then its partner: both pop with "3 and 2 make 5!" A wrong pair is a gentle miss that says both numbers and their total; two in a row glow a pair that works. Tapping the held bubble again lets it go. Because drifting bubbles overlap, a touch goes to the bubble whose middle is nearest the finger (a play-through found taps landing on the wrong, overlapping bubble).

### Peg Garden

*lap–pre-K · after Peggle and pachinko.* A pearl drops through a sea garden; each flower bud it touches blooms and chimes, and nothing is lost. Later levels ask for every flower, the orange ones, then aiming a launcher at a numbered flower and at 1, 2, 3 in order. `engine/ball.ts` simulates every board, so each numbered peg is reachable by some aim. It stays at one lap level: its bloom level has no guaranteed finish if the same spot is tapped again and again.

### Bounce Back

*lap–pre-K · after Pong and air hockey.* A slow, giggly ball between two big paddles, with no score: bounces are counted together toward a goal. A grown-up takes the left paddle on the play-together level, and the pet steps in when no second finger is there. Later levels aim through stars and count a rally of ten.

### Bumper Garden

*lap–pre-K · after Pokémon Pinball and 3D Pinball Space Cadet.* A ladybug ball bounces around flower bumpers on a garden table. It never drains: past the flippers a flower pot catches it and pops it back up. Tapping either half of the screen flips that side's flipper; young levels get a wider reach. Levels: launch for fun, flip until every flower blooms, bloom one color, bump numbered flowers in order. On goal levels a shot that blooms nothing wanted is a gentle miss; two in a row light the wanted flowers and aim the next launch at one (found by simulating the table).

## Music Mountain (music)

### Jelly Drums

*lap–school.* Free play on five notes, then copying tunes of two to five notes. Replaying the tune is always available. The island's background loop is silenced here (the jellies still bob to its quiet clock), so nothing competes with the notes she plays.

### Song Maker

*lap–school.* A looping grid of jelly beads; higher rows sound higher (pentatonic steps), and the playhead follows the music clock's beat (`music.beats()`). Free play at lap and toddler; then copying a song from shadow notes, then from a small card; continuing a repeating pattern (stairs, hops, zigzags); and finding a four-note tune by ear, where a wrong jelly is followed by the right note so the difference can be heard. A song from a free level can be kept on the treehouse's tune plaque; a copied song is not hers and is not offered. The background loop is silenced so the song is the only music; its clock keeps running at the game's tempo for the playhead.

### Sound Garden

*lap–pre-K · after Electroplankton.* Garden creatures sing when touched. Listening questions follow: high or low (bird or frog), fast or slow (bunny or turtle), does the tune go up or down, then echoing a woodpecker's rhythm on a drum, judged forgivingly for wobble but not for the wrong rhythm. The background loop is silenced, so the garden's own sounds are the only music and a fast-or-slow question is not blurred by a tempo underneath.

### Rhythm Neighbors

*lap–school · after Rhythm Heaven and call-and-response songs.* Two lap modes let taps make a bird call and frog chorus. Later levels alternate a bird call with a different pictured frog reply, add a second frog voice, then short/long rhythm gaps. The relative-gap judge is shared with Sound Garden. Explicit submission avoids any deadline; replay demonstrates both parts. After two misses, or when help is requested, guided play highlights the next frog and accepts the correct sequence at any pace. Three exchanges finish with a short duet and one sticker. The background loop is silenced, so the bird and frog parts are the only rhythm.

### Beat Builder

*preschool–school · after Chrome Music Lab's Rhythm and step sequencers.* A step-sequencer grid with a looping playhead: rows are drum, clap and bell, columns are 4 or 8 steps. Free play finishes with a green check once a beat has gone round twice. Copying a visible beat leaves wrong squares off as gentle misses; copying by ear has a listen button and a check (two misses show where the beats differ); repeat levels give the first half and ask for the second to match. The game uses a near-silent `quiet` music style so the child's beat is the music.

## Paint Pier (art)

### Rainbow Fingers

*lap–school.* Finger painting that grows over seven levels: rainbow or color-pot painting, paint pots that say their color, coloring pages ("paint the sun yellow", then "what color is an apple?"), mixing colors in a bowl, then remembering that a pumpkin is orange and mixing it. Any color is welcome in free painting. Lap play includes the second, unjudged free-play mode (color pots). A painting from either open-ended level can be kept on the treehouse picture board (bounded, normalized marks, never a bitmap); guided coloring pages offer nothing to keep.

### Fluffy Salon

*lap–pre-K · after Toca Hair Salon.* The pet sits in the chair with fluffy fur to grow, snip, comb, curl and color. Free play first (lap play includes the all-tools free mode), then one request at a time, two-part requests checked in the mirror ("short and blue"), then copying a pictured style. Requests never start already done, and the hint points to the tool for what to fix next.

### Stamp Studio

*lap–school · after Mario Paint and Kid Pix.* Two simple lap modes stamp stars or animals. Later modes offer colors, moving stamps, two sizes, quarter-turn rotation and spoken garden/story invitations. Any picture is valid; the green arrow can finish after the first stamp. Undo removes the latest stamp, and 24 stamps bound the scene. Coordinates stay normalized when resizing. A finished picture can be kept on the treehouse picture board.

### Pixel Pictures

*preschool–school · after Picross and Mario Paint.* Tap squares to copy a small picture (4×4, then 5×5 with two colors from a palette), finish a mirror half (the left half is drawn), then solve picture-logic puzzles (nonograms) from run numbers along rows and columns. Only pictures that row-and-column logic alone can solve are used (rule-tested). A square that should stay empty is a gentle miss and, on logic levels, gets a gray cross. Two misses glow a square that can be decided (on logic levels, by the same line logic). The finished picture shows in its colors and is named; after the round, the final design can be kept on the treehouse picture board.

## Barnyard (animals)

### Peekaboo Barn

*lap–pre-K.* Tap a hiding place to see who is behind it; later, find a named animal, then remember who hid where.

### Duckling Parade

*lap–pre-K · after Meerca Chase (Neopets).* Tap the grass to walk Mama Duck; ducklings fall in behind (steer a growing line). Later: lead them to the pond, bring exactly N, find one color, build a color pattern in line. A wrong duckling that merely waits beside Mama at the start is never a "not me": a refusal counts only once a finger has set a destination near it (a miss also needs that destination to be nearer it than to any duckling that may join).

### Roundup

*lap–pre-K · after Extreme Herder (Neopets), Puffle Roundup (Club Penguin) and Stampede (Atari 2600).* Tap an animal and it hops into its pen; later, shoo animals through the gate with a finger (guide a crowd), sort pigs and bunnies, and put exactly N in and ring the bell.

### Egg Catch

*lap–school · after Big Bird's Egg Catch (Atari 2600), Kaboom! and Game & Watch "Fire".* Hens lay eggs that roll gently into a basket. Then the child slides the basket under slow falls, catches only brown eggs, and flips gates to route eggs down chutes. Missed eggs land in soft hay and hatch, so nothing breaks. Level 6 (predict): the gates are set and locked; the egg waits at the top until the child taps the bin where it will land; a basket appears there and the egg rolls to show where it really goes. A wrong prediction is a miss ("follow the gates"); two light the egg's whole path. Level 7 (set it once, school): a brown egg waits above the shared fork and a white egg waits at a second hen's feeder into the other branch. Set all three gates, then tap the green arrow. The gates lock while the two eggs roll one at a time, so one arrangement must send brown to the basket and white to the nest. Three correctly routed pairs finish. A missed pair counts one miss, keeps its targets and gate arrangement for revision, and gives spoken guidance; after two misses the needed directions glow (one hint). Seeded boards start unsolved and have exactly one solution. The ghost finger follows the same gate taps and arrow. A play-through found the catch levels' full-screen steering layer still on top of the bins when routing, swallowing taps; it is now off when routing.

### Animal Snack

*lap–preschool · after farm feeding toys and animal sound books.* Cow, bunny, dog, cat, duck, pig and bear, each with one favorite food (hay, carrot, bone, fish, seeds, apple, honey). Lap levels are cause and effect: tap an animal and it munches its snack with its own voice, or tap a snack and it floats to the animal who loves it. Then "who eats the carrot?" (tap the animal), dragging each snack to its eater, and giving an animal 2–4 snacks before ringing the bell. A wrong animal shakes its head and says what it eats instead; too many snacks come back. Two misses glow the right animal or the next useful thing. Each animal that eats its favorite food files a discovery-journal entry. (Level 1 once left the animals stacked off screen at the top-left; they are now laid out whenever a round creates them, and the play-through asserts it.)

### Critter Sort

*pre-K–school · after Venn-diagram sorting and Zoombinis.* Critters, some wearing top hats, are dragged into hoops labelled with picture signs (a hat, a brown or white paint blob, floppy or pointy ears, whiskers). Levels: one hoop, two separate hoops (rules that never overlap), overlapping hoops where the middle means both, a guessing level where critters are already sorted and the child picks the rule from three pictures, then a red-lined picture that means **not**: the critters outside the hoop share the pictured property. Every part of the diagram gets at least one critter and exactly one offered rule sorts the guessing round that way (rule-tested). A wrong hoop is a miss with a reason ("the cow is not brown"; "the dog is brown and has floppy ears, so it goes in the middle"); putting a critter back on the grass is never a miss.

## Counting Cove (numbers)

### Duck Pond

*lap–school.* Count along as ducks hop in; then put N in, how many?, adding and taking away. The dots beside a number are there to count. Level 10 (make ten): 3–9 ducks swim in. "How many more to make 10?" is answered on lily pads. The missing ducks then swim in to fill the pond's ten places ("7 and 3 make 10!"). A wrong pad counts on aloud from the ducks already there. Level 11 (hiding ducks): the sign gives a whole from 5 to 10, some ducks paddle beneath a code-drawn bridge, and the child finds the hidden part on the lily pads. A wrong pad counts on from the visible ducks to the whole.

### Monster Munch

*lap–school.* A code-drawn monster gapes, chews, burps, and shows eaten food in a tummy window. It complements Duck Pond rather than repeating it: lap levels feed by tapping, toddler levels count along and give one cookie to each monster, and preschool levels ask for an exact order (cookies, or cookies and apples) that the child completes by ringing a bell, deciding for herself when to ring. A full monster refuses another of that food, which counts as a miss. Pre-K shares cookies fairly among two or three monsters; unequal shares hand the extras back to the tray, then the child says how many each monster got. Level 8 (leftovers): the tray holds one or two more cookies than share evenly, and the bell says "I think it's fair". Uneven shares hand the extras back; ringing while everyone could still have one more is a gentle miss. Then two questions: how many each, and how many left over (those go to the pet).

### Little Helpers

*lap–school · after Pikmin.* Tap a fruit and a helper runs to carry it; bigger fruit needs more helpers, shown by dots or a numeral. Later levels wait for a whistle so the child sends exactly enough: too few cannot lift, extras walk back. The level before equal groups asks how many more are needed when some are already helping. Level 6 (equal groups): a bunch of two or three same-size fruits that each need the same team of two or three (2×2, 3×2, 2×3, each once before any repeats). The badge groups its dots by fruit and helpers line up in a team under each fruit. A wrong whistle counts by the team size ("2, 4, 6"), and each lift ends with "3 groups of 2 make 6".

### Pet Kitchen

*toddler–school · after Cooking Mama and JumpStart's cafeteria.* Cut one or two sandwiches into halves or quarters, move equal pieces between plates, then serve. Both halves and quarters are accepted when they share the wholes equally. A round-arrow control restores the wholes to try another cut. The school ladder then asks for a named fraction of one sandwich (a half, a quarter or three quarters; two quarters count as a half), and ends by halving an even picture recipe for one friend. The earlier two recipe levels double two kinds of fruit; every recipe has undo. Only unsuccessful serving checks count as misses; cutting, arranging and undo are exploration. Two misses highlight a useful next action. The Windy Picnic plays a Pet Kitchen round as its sandwich step.

### Frog Hop

*preschool–school · after number-line hopping games and Frogger.* A number line of lily pads. Levels: find a number; one more and one less; add by hopping; take away by hopping back; how many hops between two numbers (number cards); a line to 20 that slides to keep the start and answer in view; then split a sum that crosses ten by first choosing the hops to 10 and then landing the rest. A sign shows the sum (`4 + 3`, `7 − 3`, `3 → 8`). Two misses bring a counted demonstration, the frog hopping and counting aloud, then the answer glows.

### Picture Graph

*pre-K–school · after classroom picture graphs and tally charts.* Critters play in a meadow; the child builds a bar graph below by tapping above a bar to add a block (tapping the bar takes one away), then checks it. A wrong bar is a miss ("count the ducks again"); two make that kind's critters glow. Then questions about the graph she built: which has the most and the fewest (tap a bar), how many more of one than another (number pads), and a finished graph to read (how many in all; which two bars are the same). Counts never tie where "most" or "fewest" is asked (rule-tested). Two more levels add a **key**: one block stands for two critters, shown on a card ("block = two dots"), on every row of the graph's side scale (2, 4, 6...) and in the meadow, where the critters stand in pairs. On level 5 she builds the bars from the pairs and then answers how many more of one kind than another; on level 6 the keyed graph is already built and she answers how many critters in all and how many more. Answers count critters, so the number of blocks (the answer read straight off the bars) is always among the choices, and picking it says "that is how many blocks, each block is two critters" (rule-tested; counts are whole numbers of blocks and no two kinds tie, so the difference is never nothing). A bar with one block per critter is a miss ("each block is two ducks; count the pairs again").

### Lasso Loops

*preschool–school · after Montessori golden beads, ten frames and Pokémon Ranger's capture loop.* Draw a loop around fireflies and they fly into a jar. The loop always closes back to its start, so a nearly closed loop counts; a loop around none is just explained. Levels: loop any fireflies; loop exactly 2 or 3 per jar; jars of five, then of ten, with the rest resting on a leaf, followed by "how many in all?" (the choices include the swapped tens and ones); and equal groups ("make 3 groups of 4", then how many). A wrong-sized loop lets the fireflies go and is a miss; two put white rings round a close group of the right size. A wrong total is counted aloud the way the jars show it (by fives, by tens and ones, by groups). Drawing uses its own pointer handling with palm rejection; a cancelled touch drops the loop.

## Cozy Village (everyday life)

### Splish Splash

*lap–pre-K.* Scrub mud off the pet; eight levels grow into named body parts in a shuffled order, two at once, then "first … then …". Washing the wrong part just makes the pet giggle and repeats the request; a finger that is still within reach of a patch it scrubbed in the same touch is not told off for brushing a neighbor on the way (the ears reach into the head's patch), but sliding on to another part still is.

### Feelings Faces

*lap–pre-K.* The critter gained `sad` and `calm` moods, with brows and a tear so feelings read even at sticker size. Lap play is cause and effect: four feeling bubbles change the big pet's face, with a matching sound, and tapping a sad pet gives it a hug. Later levels match the pet's face, find a named feeling, choose what helps a need (a hug, a pillow, an apple, or a scarf), watch a small event and choose how the pet feels (the pet stays `calm` until answered, so the event carries the answer), and find which of four friends feels a named feeling. The big pet replaces the corner guide and repeats the instruction when tapped.

### Weather Wardrobe

*lap–pre-K.* Sun, rain and snow fill the sky. At lap, tapping the sky changes the weather and the pet dresses itself; later the child picks one item, then every item that fits, then packs a suitcase for a two-weather trip. Each item belongs to exactly one weather, and a wrong choice says which weather it is for. Clothing is drawn in critter body coordinates and attached, so it hops with the pet. The pet is the star, so tapping the big pet repeats the instruction.

### Scoop Shop

*lap–school · after Papa's Freezeria and Neopets' Ice Cream Machine.* Tap tubs to pile scoops on a cone for a customer (build an order); then one color, two scoops, "four blue scoops", three flavors stacked in order, then from memory.

### Mail Carrier

*lap–school · after Paperboy.* The pet delivers letters along a street. A letter shows a door color, a number of dots, or a numeral (1 to 9), and the child taps the matching mailbox; a wrong mailbox politely hands it back. Levels 6–7 (pre-K–school): Hazel the squirrel postkeeper's picture map of the woods, with paths from her hollow-tree post office to five houses marked only by a sign (acorn, mushroom, leaf, flower, star). A picture key beside the map says which neighbor lives behind each sign, and tapping a row says it. Level 6 brings one letter at a time with a neighbor's picture: find them in the key, then tap their house, and the pet walks the paths there. Level 7 brings two numbered letters: tap the house for letter 1, then letter 2 (a dotted purple route and numbered flags show the plan, and tapping a planned house takes it and later stops out), then the green arrow walks it. A wrong house says who lives there; letter 2's house first, or a house with no letter, is a gentle miss; two misses light the key row and the house that's due. The map is a small graph in `logic.ts`, and walks follow it (rule-tested). The brown dog is left out of the woods, since at key size it looks like the bear.

### Teddy Doctor

*lap–school · after Toca Doctor and Dr. Panda.* Soft-toy patients (bear, cat, dog, bunny, pig) visit a little clinic; tools are reusable and dragged onto the body. Levels: tap boo-boos for bandages, bandage the part the patient names (open to lap play as a naming game: "on my ear"), choose what helps a symptom you can see (ice for a bump, a tissue for sniffles, a warm bottle for a tummy ache, socks for cold feet), then the same from a spoken clue alone, where the tool must also land on the right body part, and check-ups (heart, temperature, ears) in the order on a picture card or in the order the patient says. Where a tool lands is judged by the nearest body part (the body is mirrored, so either foot or ear counts), and a tap on boo-boos goes to the nearest one. A boo-boo or bandage always sits mid-belly, on the head or an ear, or on a foot, never low in the gap between the feet (a rule test checks it).

### Market Stall

*preschool–school · after Neopets shops and pretend shops.* Tap shell coins worth 1, 2 and 5 onto the mat; tap one on the mat to take it back (the nearest coin to the finger); ring the bell. Price tags show the numeral and dots. Running totals are said aloud except where adding up is the puzzle (two items, giving change). Later levels pay two prices together, pay the same price a second, different way, give change from a customer's 10, then pay prices from 4 to 10 with the fewest shells. An exact but longer payment at that last step stays on the mat with an invitation to swap; repeating the invitation counts as a miss. Too much or too little is a miss with a spoken comparison; two bring faint coins showing one way.

### Lemonade Stand

*school · after MECC's Lemonade Stand and the Coolmath version.* A short market week. Each day shows a forecast (a sun, clouds or rain, and from level 2 an event: a ferry bringing visitors or a quiet day), the child taps a batch of 4, 8 or 12 cups (and from level 3 a price of 1, 2 or 3 shells), then taps OPEN. Friends come one at a time: each who finds a cup buys it, the rest watch the cups run out under a SOLD OUT sign, and spare cups go to two friends on a picnic blanket. A row (weather, price, cups made, sold and left, shells) joins a picture table; tapping a row reads it aloud. After the last day the pet points out one comparison the table can show (the same weather at two prices, two weathers at the same price, or the day that kept the most).

The market is a plain function of the day (`logic.ts`): the lowest crowd for rain, clouds and sun is 2, 6 and 10 friends (plus a fixed 0 to 2 per day from the seed), a ferry adds 4 and a quiet day takes 4 away, and each shell of price loses friends (price 2 loses 2, price 3 loses 6; at least one friend always comes). Sold is the smaller of cups made and friends who came. The three weathers never overlap at one price, so the nearest batch above a day's crowd always leaves at most two cups. A week is rebuilt exactly from its seed, always has two or more weathers, and on level 1 is exactly two weathers with one of them twice, so there is always a day to compare. A rainy quiet day is never made.

Levels: **1** three days, weather only; **2** three days with an event; **3** four days with a price (a middle price earns most on a plain sunny day, the lowest in the rain, the highest on a very busy ferry day, so no price is a dead button); **4** a five-day market week where a lemon costs one shell and makes two cups (a batch of 4, 8 or 12 costs 2, 4 or 6 shells), the purse starts at 6 and carries from day to day, a batch the purse cannot pay for is dimmed (tapping it says what it costs), spare cups still cost their lemons (a small, causal loss), and if the purse falls below the smallest batch's cost the ferry captain tops it up to exactly that, so there is no debt and no failed week. A best choice that does not lose shells exists on every day of every week (tested).

Mistakes and help: nothing is a miss, so `misses` is always 0. Running out, spare cups and a weak first batch are results the table and the pet explain ("All sold out! 5 more friends wanted a cup", "4 cups are left. They go to a picnic with friends!", "The spare cups go to a picnic, but they cost shells to make"). OPEN before choosing only nudges the cards or prices. The lightbulb asks the pet for one true thing about today, most useful first: what happened the last time it was the same weather (ran out, a smaller batch would have sold as well, or nearly everything sold), how another weather compared (levels without a price), what the event does, how the forecast works, and what a higher price does. The rows the message is about are circled; asking again steps to the next. Every message is checked against the model (`helps()`), and on day 1, with no row to point at, it explains the forecast. Asking for help counts as one hint for the day however often she asks, so a round where help was asked on two or more days counts as struggling and two of those step the level down, while two rounds with no help step it up.

Not built: a saved week or market-week chart in the journal, recipe quality and advertising, a "close the stand" button (the home button always works), the Maker Harbor tickets and fair board that this game is the first slice of, and a couch version.

### Clock Tower

*pre-K–school · after teaching clocks and JumpStart's clock activities.* Drag the clock's hands; the outer ring takes the long hand and the middle the short one, and each snaps to the marks the level uses. The short hand slides between numbers as the minutes pass, like real gears. Levels: the hour hand alone, o'clock, half past, quarter past and to, reading the clock to pick a daily-routine picture, one hour later, and (school, level 7) five-minute times such as 3:25, counting by fives with small helper numbers around the rim. A wrong time is read back aloud ("The clock says half past 4. We want 3 o'clock"); two misses show faint yellow target hands. On the hour, the tower chimes the hour.

### Stop and Go

*lap–preschool · after red light, green light and toy traffic lights.* A road, smiling cars and a three-lamp traffic light. On the lap level the light is a toy: tapping it steps green, yellow, red, and the car zooms off on green. Then the light cycles by itself (long greens and reds, a short yellow) and the child sends the front car only on green; on the walk level the pet steps toward a flag on green ("red light, green light"). Going on red is a gentle miss; yellow is only a nudge; waiting is never wrong and nothing is timed. The top level is a two-road crossing with two lights the child controls: each road has three cars, and both roads green at once is the one mistake (cars just wait). At the crossing, misses count across the round, and the hint glows the green light that should turn red. A play-through found two bugs: cars added before the light was on the stage (now a car layer), and the first crossing design letting one road finish the round without any decision.

### Pet Says

*lap–pre-K · after Simon Says and action songs such as "Head, Shoulders, Knees and Toes".* The big pet, with two mitten hands riding on its body, claps, stomps, waves, jumps, turns, wiggles, reaches up and crouches; the child copies off the screen and a grown-up taps the green arrow to go on. Nothing is judged and no miss is possible. Levels: copy single moves; body words (nose, tummy, ears, head, toes); two moves in order; "Pet says" (the pet moves either way to tempt, and two spaced-out commands without "Pet says" end with "did you stay still?"); and a freeze dance, where the music stops after a few seconds and the pet freezes in a pose. Tapping the big pet shows the move again; the corner guide steps out while it is the star.

## Rainbow Meadow (colors and shapes)

### Shape Sorter

*toddler–pre-K.* One circle hole, growing to six plain holes, one color, and tilted pieces. A shape that does not fit slides back with a hint.

### Color Garden

*toddler–pre-K.* Sort fruit, balloons and flowers into baskets by color; level 1 is dragging practice with one basket, growing to six colors.

### Dot Link

*lap–pre-K · after Two Dots and Candy Crush.* Tap dots to pop them, then drag a line through neighboring dots of one color; new dots drop in from the top. Later levels ask for one color, chains of four, and a closed square that clears every dot of that color. A move that counts always exists.

### Tangram Town

*toddler–school · after tangrams and silhouette puzzles.* Each of six levels draws one of 2–5 pictures from its pool (eleven in all: house, tree, boat, sailboat, flag, cottage, truck, tower, ferry, rocket, houseboat), built from shuffled large pieces. Quarter-turn controls rotate the selected piece; identical triangles and symmetric rectangle/square rotations are accepted. Later silhouettes can reveal outlines and orient the next piece through help. Off-board drops and turning are exploration. Wrong placements on the picture get a spoken hint and a glow after two misses. Help affects hint accounting.

### Garden Grow

*lap–preschool · after toy gardens and Viva Piñata.* Tap the soil and a seed grows into a smiling flower that sings when tapped. Level 2 adds the cloud: plant, then make it rain. Later levels plant the color asked for (a wrong packet shakes, as a miss), then exactly 2–5 seeds before the rain, then two colors with a number of each. A picture sign shows what was asked and each planted seed has a marker in its color. Tapping a planted seed takes it out; two misses make the sign and the beds still to plant glow.

### Treasure Map

*pre-K–school · after Battleship and treasure-hunt maps.* A parchment grid where row 1 is at the bottom, as on maps and graphs. Levels: picture rows and colored columns ("the apple row, the red column"), letters and numbers ("B3"), putting a tree, house, boat or flag at a named square, following directions from where the pet stands ("2 left, then 3 up"; the pet then walks it, counting), and two landmark clues (for example, "the tree is 2 right" and "the boat is 1 up") whose lines meet at the treasure. A sign shows each request in pictures or letters. A wrong dig leaves a mark and says what was right ("right column, now look along the row"); two misses glow the target's column and row—or, for landmark clues, the two clue lines.

### Owl Walk Home

*toddler–pre-K · after Hoot Owl Hoot! and First Orchard, without the losing clock.* Turn over a color card and tap an owl: it hops to the next stone of that color ahead, skipping a stone with an owl on it, or flies home if there is none. Stones and cards also carry a shape per color (heart, circle, star, triangle). Level 1 is one owl; then two, then three owls, taking turns with the pet, which turns its own card and hops the owl that goes farthest. The top level shows how far each owl would hop with the card and asks for the farthest; a shorter hop is a gentle miss with both numbers said, and two light the best owl. Everyone wins together, and the sun only rises when every owl is home. A random-play simulation shows every game ends.

## Puzzle Peaks (puzzles)

### Pattern Train

*preschool–school.* Advances from AB through AAB/ABB and ABC, animal patterns, missing middle cars, bell patterns, and two-car gaps. The three school follow-ons ask for a seventh car after two repeats, then follow color and shape together, then count numbered cars by 2, 5 or 10. Bell choices can be auditioned before confirming; tapping a shown car is always free exploration.

### Memory Match

*preschool–school.* Grows from four to sixteen cards, then teaches number/dot, two-attribute, upper/lowercase, and number-word/numeral matches (one through ten). Exploring unseen cards does not count as a miss: an incorrect pair counts only if the matching card was already known.

### Size Parade

*toddler–school.* Four levels ask for the biggest or smallest friend across four short questions. Four later levels ask the child to drag three or five friends into an ascending or descending line. Friends share an appearance and baseline, so size determines the answer; positions are shuffled. A fixed large hit area keeps the smallest friend easy to select.

### Puzzle Pals

*lap–school.* Six code-drawn scenes (a cow on the farm, a duck in the pond, and so on) are rendered once into a texture and cut into 2 to 12 pieces. Faint pictures guide the early levels; later ones show only an empty frame. Dropping off the frame is exploration; a wrong place is a gentle miss. The finished picture comes alive and the animal says hello.

### Quick Tricks

*toddler–school · after WarioWare: Touched!* One show of three tricks, one sticker. Levels 1–3: Umbrella Up (hold a leaf above a bunny in the rain; at pre-K, choose the leaf big enough for two friends), Sock Gobbler (give the monster the partner sock, by color, then by color and pattern), and Bridge Stretch (stretch a springy plank to the far bank; at pre-K, choose the one plank long enough). Levels 4–6, a second show: Parcel Turn (rotate and fit parcels), Picnic Places (give each friend a bowl; the top level begins partly set) and Last Berry (add to a visible starting quantity and undo extras to make four, five or six berries). An arrow appears after each trick's payoff and the child moves on when ready; misses are summed across the show, with at most one hint per trick. The microgame thinking behind it, and a proposed third show, are in [IDEAS.md](IDEAS.md#quick-tricks-and-microgames).

### Peekaround Island

*toddler–school · after Captain Toad: Treasure Tracker and Fez.* A round island seen from the side, with a big round tree in the middle and four friend spots a quarter turn apart. Turning is drawn, not 3D: each spot's angle projects onto an ellipse, depth sets scale and draw order, and anything behind the tree's crown is hidden and cannot be tapped. Flowers between the spots make each quarter turn visible. "In front of", "behind" and "next to" are always from the child's side, so turning changes them (`logic.ts` `whereIs`).

- Levels 1–2 show arrow buttons; tapping the tree also turns it. Level 1 finds whoever hides behind the tree. Level 2 finds a named friend while two others stand in plain sight; tapping one of them is a miss, and two misses make the arrows glow.
- Level 3 has no arrows. A picture card shows all four friends and the child taps the one who is hiding: an elimination. A visible friend tapped by mistake says where it stands; the hider's picture glows after two misses. A right answer turns the island halfway round to reveal the friend.
- Levels 4–5 drag friends from the shore onto the island. Level 4 asks one friend at a time, covering all three words. Level 5 gives two directions at once, then turns the island halfway and names who is in front now. Either side counts for "next to". A drop away from the island floats home without a miss; a drop on the wrong spot gets a spoken explanation of the word, and the fitting spots glow after two misses.
- Requests are always answerable whichever fitting spot is used (rule-tested). The hider never repeats back to back. The round ends with a full spin of the island.

### Penguin Slide

*preschool–school · after the ice-sliding puzzles in Pokémon and Zelda.* Tap the ice in a direction and the penguin slides until a snowy rock, the pond's edge or soft snow stops it, eating fish it passes. Puzzles are generated and kept only when a breadth-first search over slides finds the planned shortest solution (1–2 moves at first, up to 4–6 with two fish and soft snow). Sliding is exploration: there are no misses. Undo steps back one slide. Three slides beyond the shortest bring a hint arrow showing a best next slide; if no route is left, the undo button glows. **Level 6, Ice Blocks (school):** an ice block sits on the pond. Slide up to it, then slide into it again to push it: the block skates until it meets a rock, the pond's edge, another block, a fish (it never covers one) or soft snow, and the penguin stays where it is. A block that cannot move yet stops the penguin like a rock. Pushing counts as a slide; every level-6 pond is generated so that it needs a push (with the blocks frozen like rocks the fish is out of reach or takes longer), and the solver proves the fewest slides over the penguin's place, the fish eaten and where each block is. A block pushed against the only way to the fish leaves nothing reachable, so undo glows. Its fixed ponds also make two couch challenge courses (Pond Practice and the Five Ponds). On the couch the round arrow is not drawn (the couch screen takes no pointer input); the left button undoes a slide and the pause menu's **Start this pond again** puts the penguin and every fish back, with the slides so far still counted.

### Secret Code

*pre-K–school · after Mastermind and Neopets' Time Tunnel.* Tap stones into a door's slots and turn the key. Each slot gets a green check, a yellow dot (in the code elsewhere; from level 3) or a gray cross; guesses stay listed above the door, and green stones stay in place. Each stone also carries a shape, so colors never rely on hue alone. A guess is never a miss in itself. The miss is ignoring a clue: putting a stone where a mark already ruled it out, a rule that understands repeated colors. Two such misses, or many guesses, bring faint stones in the empty slots that fit every clue so far. Later levels have more slots and colors, then a repeated color. School level 7 is a detective door: two or three distinct prior guesses identify exactly one three-stone code, with no repeated colors. Each of the round’s two doors has fresh seeded clues. A try that contradicts any of that evidence counts as one miss and gets a spoken reminder; two misses bring faint solution stones. The original clues remain visible throughout retries.

### Garden Rows

*pre-K–school · after picture sudoku and Latin squares.* Plant a 3 by 3 flower bed so each row has one of every flower; from level 2 the columns count too, then 4 by 4 beds with fewer flowers to start, and a 5 by 5 bed. Every bed has exactly one way to finish (rule-tested over many seeds per level). A flower that repeats in a row or column will not stay and counts as a miss; tapping a planted flower takes it out. The glowing spot is a hint. Seeded beds would suit a couch face-off; it is not a couch game yet.

### Ferry Jam

*pre-K–school · after ThinkFun's Rush Hour Jr.* Drag boats along their lanes in a small harbor so the red ferry can reach the dock; a boat stops at the next boat or the wall. Harbors grow from small to 4 by 4, 5 by 5 and 6 by 6, needing more slides in a planned order. Nothing is a mistake and the round arrow takes back the last slide. Harbors come from a frozen, solver-checked list, each solvable within its plan's slides. After a long wander without getting closer, a glowing boat shows a next slide that moves one step closer.

**On the couch (Harbor Rush).** Grown-ups play its 5 by 5 and 6 by 6 harbors (levels 3 to 6) with a controller: the stick moves a highlight to the nearest boat in the direction pushed, the bottom button picks it up and later sets it down, the stick slides a held boat along its lane one cell at a time, and the left button puts a held boat back for nothing (or, with nothing held, takes the last slide back; it stays counted). A boat moved any distance is one slide, counted when it ends somewhere new. The pause menu has **Show a hint** (the solver's next slide; on the couch the automatic hint after a long wander is off, and a shown hint marks a challenge run as helped) and **Start this harbor again** (slides kept). `boatToward` and `focusPath` in `logic.ts` are the highlight's rules, tested to reach every boat in every harbor of the game. One puzzle-shelf course, **Busy Harbors** (five frozen harbors with fewest slides 8, 10, 12, 16 and 18, par 64), with **Watch the best routes** after a first finish; a trip climbs levels 3 to 6 and a face-off compares slides over the fewest. The round arrow is not drawn on the couch.

### Critter Crossing

*pre-K–school · after Zoombinis.* A bridge gate with a rule: shown on the sign at level 1, then a secret to work out by sending critters one at a time (each crosses or waits with a red mark) and then guessing from three or four pictures. Rules are one picture, "not" a picture, or two pictures together. Trying a critter is never a mistake. A guess counts as a miss only if it contradicts something already seen; a fair but unproven guess says to try another critter. Rule tests check that every round has critters who cross and who wait, that trying everyone leaves exactly one picture, and that the hint's suggested test always narrows the pictures without ruling out the true one.

## Story Grove (stories)

### Letter Trails

*preschool–school.* Defines all 26 capitals as ordered strokes. A firefly and moving beacon guide the finger; successive checkpoints enforce the trail while tolerating imprecise motion. Each finished letter becomes a code-drawn illustration with a spoken association. Top levels spell short words and the child's name. Accented Latin names normalize to A–Z; names with no supported letters fall back to PIP. Additional scripts would need their own stroke data.

### Story Steps

*toddler–school.* Seven levels progress from a shown beginning through three- and four-picture ordering, missing middles, and unrelated distractors. Four stories depict a flower, a block tower, a snow friend, and a butterfly. Completed pictures are narrated in sequence; the music-note button reads only already placed pictures. Cards belong to a known story and stage, so every missing position has one answer.

### Word Monsters

*lap–school · after Endless Alphabet and Reader Rabbit.* Every letter is a little monster that says its sound. Tap to hear them, find a letter by name, then by its sound, match first sounds ("apple starts with aah"), then drag letters into slots to build three-letter words, at the top level from sounds alone with a spare letter. Lookalike letters are never neighbors. The sounds come from device speech (`sound.a`…`sound.z`), which approximates phonics sounds at best: they are stand-ins until checked on the iPad. Level 7 (word families): the ending (at, og, ig, un, op) already stands in the last two slots as monsters, and the child drags the first sound in to make hat, then cat, then bat. Most other choices are the same family's first sounds, so hearing decides it. Two families of three words per round. The "sun" picture (a big S) is hidden here so it doesn't give the answer away.

### Photo Safari

*lap–school · after Pokémon Snap.* Animals are busy around the island; tap one to photograph it. Requests grow from the animal's name to what it is doing ("jumping") and where it is ("under the tree"), then both. Exactly one animal matches each request. Level 2 (finding a named animal) is open to lap play as a naming game. Level 6 (not): "the animal that is not sleeping": everyone else is doing the same thing, and only the asked-for animal is doing something different. A wrong photo says what that animal *is* doing ("that is the cat sleeping"). Each action in a successful photo—jumping, sleeping, eating or dancing—files its action-word observation in the discovery journal.

### Goodnight Room

*lap–preschool · after* Goodnight Moon *and bedtime routines.* A calm bedroom: lamp, wall clock, fishbowl, and teddy, kitten and puppy critters. Tap each to say goodnight: it gets sleepy eyes, a "z" floats up, the room darkens a little and stars appear in the window. When everyone is asleep, a soft chime ends the round. Level 1 shows four of the six friends, chosen by the round's seed, and level 2 may open with up to two friends already asleep (tapping one is a soft tick). Later levels name who to say goodnight to, then two in order. A wrong friend, or the right two out of order, is a gentle miss with a glow after two; tapping someone already asleep is just a soft "shh".

### Rhyme Time

*pre-K–school · after rhyming picture games and Dr. Seuss read-alouds.* 29 code-drawn word pictures in twelve rhyme families (cat/hat/bat, star/car/jar, bear/pear/chair, and so on); critters stand in for cat, dog, bear and duck, and a crowned bear is the king. Every question is said aloud with all its words, and a music-note button repeats it. Levels: which one rhymes with a word (three, then four choices), find the rhyming pair (tap one, then another), and the odd one out of three rhymes. Distractors come from other families, so exactly the intended answer rhymes (rule-tested). A non-rhyme is a gentle miss naming both words; two misses glow the answer.

### Opposites

*lap–pre-K · after concept board books and Sesame Street.* Eight concept pairs drawn in code: big and small (bears), happy and sad (cat moods), up and down (a balloon with arrows), open and closed (a box), full and empty (a glass), hot and cold (a steaming mug, an ice cube), day and night, fast and slow (a bunny, a snail). On the lap, tapping the picture flips it to its opposite while the word is spoken. Then find the one named, find the opposite among three, and match three opposite pairs. Wrong picks are gentle misses naming the words; two glow the answer.

### Clap the Syllables

*preschool–pre-K · after classroom syllable clapping and Rhythm Heaven.* The pet says a word whole and claps its beats ("but-ter-fly") with beads lighting up, and the child claps along on big hands. Then she claps a word by herself (a wrong count brings the pet's demonstration; a second leaves the beats showing), sorts pictures into 1-, 2- and 3-clap bins, and hears some claps and finds the picture with that many beats. Twenty-seven words of one to three beats. A clap is a count, not a timing, so the game counts claps in a burst rather than using Sound Garden's rhythm judge. Friends' names were left out: counting a child's own name would need a syllable counter the game does not have. Whether device speech says each word clearly is unchecked. The background loop is silenced, so her claps are the only beat.

## Tinker Lab (science)

### Robot Path

*pre-K–school.* A visible arrow program, a play button, and editable steps. Its first six levels add turns, grid size, rocks, and longer routes. Every board has a tested solution within its program limit. Levels 7–8 hold *counted* steps: tapping the same arrow again makes "right ×4", so a long route fits in two or four slots. Levels 9–10 add a purple loop button that repeats the whole program ×2–×4 (a staircase is "right, down, ×4"). Each level has an authored solution; rule tests check that it works and that the plain route doesn't fit the slots without the new idea. Playback lights up the slot being carried out (step-through), and the hint follows the known solution: the arrow to tap again, the next arrow, the loop button, or clear. Boards are authored per level, which is why it can only be a team game on the couch.

### Bug Builder

*toddler–school.* Two guided levels show pale matching shape outlines; two copy levels use a separate small model; three mirror levels ask for matching wings, ending with two columns and six spots. Reusable stamps return to the tray. The final palette contains repeated shapes and colors, requiring both attributes to match. Drops outside a spot are exploration, not mistakes.

### Sink or Float

*lap–school.* Things arc into a water tank; floaters bob and sinkers drift down trailing bubbles. Lap drops things in; then the voice names the result; then the child guesses before each test, and guesses never count as misses; then sorting into float and sink baskets, first with familiar things and then with surprises such as a floating apple and a sinking coin. A wrong sort is tested in the water before the thing goes to its basket. Each thing that actually goes into the water files a discovery-journal entry (a thing only sorted correctly was never tested, so it is not found).

### Bouncy Launch

*lap–school · after Kass Basher (Neopets) and Toss the Turtle (Kongregate).* Tap the spring and the pet boings onto a cloud (pull and release); later, pull back farther to fly farther, land on the star cloud, then a numbered cloud, farther or nearer than last time. School's last level shows a fixed pull: choose the cloud it will reach, then watch, with predictions unscored. After two plainly different pulls, the observed bigger-pull/farther-landing rule goes into the discovery journal. On the couch the spring squashes straight down instead of stretching sideways, and the game's twelve small clouds make the Cloud Hopper challenge course ([DESIGN](DESIGN.md#couch-play)).

### Seesaw Balance

*toddler–school · after Hasee Bounce (Neopets) and balance toys; levels 8–10 after DragonBox and PhET's Equality Explorer.* Friends, blocks, number weights and presents go on level trays at the ends of a springy seesaw, so only weight matters. Levels: make a little friend go up, choose a friend heavy enough, level it with blocks (one at a time, so it never tips too far), find the heaviest of three look-alike presents by testing pairs (testing is never a mistake) and put it in a wagon, make the same weight with different number weights (any combination counts), and weigh a mystery box with blocks then say how heavy it is. The journal records the heavier side going down and equal sides becoming level only after a tray change actually shows each rule. Level 7: two identical hidden weights balance together; the child divides the visible block total into two equal groups to name one box's weight, and wrong answers demonstrate the two groups aloud. Levels 8–9 (school): the seesaw starts level with a mystery box and blocks on one tray and only blocks on the other (level 9 has a box on each side too). Anything can come off. Taking something off one side tips it, which is said aloud and never counted as a miss; two tips in a row light the thing whose twin should come off (or the thing to put back). When the box stands alone and the seesaw is level, the blocks across from it are its weight; a wrong number is a miss and the blocks are counted aloud. Level 10 leaves two identical boxes balancing blocks after equal things are taken away, so she shares the visible blocks between the two boxes to name one weight. Two different unknown weights are a possible next step.

### Light Lab

*pre-K–school · after laser and mirror puzzles.* Mirrors on a grid turn a sunbeam a quarter; tap one to tilt it. Flowers wake when the light reaches them and let it pass on; colored glass tints the beam, and a pink flower only wakes in pink light. Puzzles are built backwards from a random beam path, with spare mirrors and rocks placed off it, and start unsolved (rule-tested over hundreds of seeds, including that following hints always solves). Levels 1–2 show the beam live as mirrors turn (no misses possible); from level 3 the child plans and then taps the sun, which draws the beam cell by cell. A shine that misses is a miss, explained aloud (off the edge, a rock, the wrong color, one flower still asleep); two misses make the next wrong mirror on the known path. School level 7 adds three unscored predictions: the mirrors are locked, and the child taps one of three reachable rock or edge endpoints before the beam is replayed with an explanation. A fourth board returns to planning with the mirrors unlocked.

### Ramp Race

*pre-K–school · after toy car ramps and classroom fair-test experiments.* Tap the ramp to change its height (three heights) and the floor to change its surface (carpet, wood, ice); press go and the car rolls down and glides to a stop. The model is deliberately simple and stated plainly: distance = height × floor glide, in floor marks. Levels: explore (every roll is fine), choose the height that stops the car on a star (wood only), height and floor together, and fair tests with two lanes (change only the floor, or only the ramp). A short or long roll is a gentle miss naming what to change; two misses show a ghost ramp and glowing floor that would work. An unfair test (both things changed) is a miss; an identical setup is only a nudge.

### Inchworm Measure

*pre-K–school · after measuring with nonstandard units and classroom rulers.* Drag inchworms from a bucket onto a leaf, pencil, snake or stick; they snap end to end with no gaps or overlaps. Levels: lay worms along a leaf and count them; measure, then pick how many worms long; measure two things and say which is longer and by how many worms; read a ruler, where every other question starts past 0 and the number at the end is offered as the tempting wrong answer; use the ruler to find **how much longer** one of two things is when they start at different marks (the gap between the ends is the tempting wrong answer, and only differs from the true answer when the starts differ; rule-tested); and put **two things end to end** on the ruler and say how long they are together (the mark where all of it stops, or where the first one stops, is the tempting wrong answer). A worm that would hang off the end, or a wrong number, is a gentle miss with a spoken hint (count again; count the spaces; it did not start at 0; count the extra spaces); two misses glow the right number, the thing's end, the ruler spaces it covers, or, for "how much longer", a ring around the extra part of the longer thing.

### Block Tower

*lap–school · after stacking blocks, Jenga and Art of Balance.* Stacking and knocking down, with one explicit balance rule: a block stays up when the middle of it and everything on top is over the block below, and not on its edge (`topples` in `logic.ts`; positions are in eighths of a block, so checks are exact). Levels: tap anywhere to stack six and tap to tumble (lap); stack as tall as a friend; build up to a numbered flag from a basket, tap the tower to take the top off, and ring the bell (too short or too tall is a miss, two bring counting together); compare with Bear's tower (as tall, one taller, one shorter); which of two leaning towers will stand when the ropes let go (a guess is never wrong; the fallen tower's ghost shows the middle line past the edge, the standing tower's shows it over the block); and reach: drag blocks onto a table so one touches a star line past its edge without toppling (two blocks to half a block out, then three to five eighths). A topple is a miss, explained with the middle line; two bring a glowing place for the next block (found by searching every slot) or a glow on the top block to take off. The stars were chosen by counting solutions: one block alone can never reach either.

### Chain Reaction

*pre-K–school · after The Incredible Machine.* Drag loose ramps into large sockets, run the machine and watch the marble; then move one part and run again. Six levels with two small machines per round: a single loose ramp, fixed and loose ramps together, two-piece revisions, touching a little chime before the final bell, and a top level with several valid designs. Replay is deterministic. A run that misses is an experiment, never a miss; loose ramps can go back to their tray. The light bulb gives (and counts as a hint) one useful placement that keeps correct work. Rule tests enumerate every visibly different placement across many seeds per level and require the planned solution count, solvability and a useful hint.

### Habitat Helpers

*preschool–school · after nature gardens and simple habitat models.* Bunny and Duck visit a garden when it supplies food, water and shelter that work for them. The request sign always shows those three needs, and every garden feature has a fixed role in the game's deliberately small model. Levels: place Bunny's three obvious pieces; build obvious gardens for both visitors; choose the right three among distractors; inspect a prepared two-piece habitat (the sign shows a `?`, never the visitor; touching a piece says what it gives) and predict who will come; fit each visitor's needs into two spaces with a multipurpose berry hedge or pond with reeds; then make one three-piece garden that welcomes both. The last answer uses the hedge for Bunny's food and shelter, seed grass for Duck's food, and the pond with reeds for shared water and Duck's shelter.

The green gate tests a garden. An incomplete test and an unmatched prediction are observations, not mistakes; the pet names the first missing need, and after two incomplete tests the pieces from an arrangement that works glow and one hint is recorded (with only two spaces, that is the multipurpose piece rather than everything that meets some need). Every generated round has a rule-tested solution inside its capacity, prediction gardens welcome exactly the visitor they reveal, and the compact levels require their multipurpose pieces. A completed round files only the Bunny and Duck need observations it actually showed in the discovery journal. The how-to card's ghost finger (a mouse pointer on a desktop) places the fewest pieces that work, or picks the visitor the prepared garden welcomes, and then taps the gate; a test plays that rule against every generated round. The model says that real animals need food, drinking water and somewhere to shelter; it does not claim those are their only needs.

## Grown-up puzzles (couch only)

Games made for one or two grown-ups on the couch route and nowhere else. They are in `GROWNUP_GAMES` (`src/games/registry.ts`), not in `GAMES`, so no place, shelf, favorite, journal, parent panel or sticker book on the child's island ever lists them and `go.game` cannot open them; couch play finds them with `couchGameById`. They are played with a controller or the keyboard only (the couch screen takes no pointer input), keep no child history, and give a couch sticker. They have no touch how-to card; their how-to is in `src/couch/catalog.ts`. A score is a personal best in its own unit, never a timer, and help (the pause menu's **Show a hint**) is asked for rather than arriving after misses.

### Sudoku Garden

*grown-up couch play · after sudoku, and Garden Rows grown up.* Fill a bed so every row, column and box holds each number once: 6 by 6 beds (boxes two rows by three columns) and 9 by 9 beds. A square holds a numbered blossom whose color is its number's, so a bed reads at a glance as well as by its digits; numbers given at the start are inked, numbers placed are blue, a number that repeats in its row, column or box turns red with its twin and a soft boing (spoken once a bed). A wrong number is never refused. **Controls:** the stick or D-pad moves the cursor (hold to repeat); the bottom button on a square opens the number tray at the right of the bed (a tile per number with how many are left to place, and a pencil tile); in the tray the bottom button places the highlighted number or, on the pencil, switches marks on; the left button closes the tray, or takes a number (or its marks) back out of a square.

**Score and help.** Every number placed counts one entry (a replaced number costs another); taking one out and pencil marks are free; placing the number that is already there changes nothing. The fewest is the bed's empty squares, so a perfect bed is a bed with no mistaken or replaced number, and the score is the entries over par. The pause menu has **Show a hint** (marks a challenge run as helped for good) and **Start this bed again** (entries already made keep counting). A hint points at a number she placed that cannot be right first (a clashing one if there is one); otherwise at the next number the techniques below can place from where the bed stands, with its reason spoken and written above the bed: *only the 4 fits there* (a lone number), *the 4 has only one square left in this box* (an only place), or, on the hardest beds, the pair or pointing line that rules numbers out first, with its squares marked. A square left with no number that fits turns orange and the game says one of her numbers has to come out.

**The rules** are in `logic.ts` and carry the tests. `search` counts solutions (a bed must have exactly one) and grows random full beds. `techniqueSolve` works a bed the way a person does, easiest step first: **lone** (only one number fits a square), **place** (a number has one square left in a row, column or box), **pair** (two squares in a house can only hold the same two numbers) and **locked** (a number's squares in a house all lie along one line, or one box). A bed's *grade* is the hardest technique it needs. `makePuzzle` takes numbers out of a random full bed in random order, keeping each removal only if the bed stays unique and workable, and throws a bed away unless it has exactly the plan's blanks and grade. Six levels: 6 by 6 with 14, then 21 empty squares (lone numbers only), 6 by 6 with 24 that needs an only place; 9 by 9 with 42 (lone), 52 (only places) and 55 (a pair or pointing line). A 6 by 6 bed almost never needs a pair, so it has no third rung. Rule tests assert every plan makes exactly its blanks and grade over many seeds, one solution, every technique step sound against the solution (a placement is the solution's number; nothing ruled out is in it), and a follow-the-hints player always finishes, with and without a wrong number to start.

**Couch.** A trip stop (face-off `twin`: each plays their own seeded bed, scored in entries over the empty squares) plays the three 6 by 6 levels. Two challenge courses of frozen beds are on the puzzle shelf with par: **Six Beds** (six 6 by 6 beds, par 124 entries) and **Three Big Beds** (three 9 by 9 beds, one of each grade, par 149); `course.ts` holds them with a `version`, and tests assert each is unique, solvable by the techniques and graded as stated. It opens in the last tier of trips and is on the shelf from the start. Not built: a keyboard fallback for typing digits (the tray works with arrows and Enter), a daily or random bed on the shelf, 4 by 4 or 12 by 12 beds, killer or other variants.

### Lantern Lights

*grown-up couch play · after Lights Out, on a pond at dusk.* A square of paper lanterns, each lit or dark. Pressing one flips it and the lanterns above, below and beside it; the goal is every lantern lit. The cursor shows a faint glow over what a press would flip. **Controls:** the stick or D-pad moves (hold to repeat); the bottom button presses; the left button takes the last press back; the pause menu has **Show a hint** and **Start this pond again**.

**Score and help.** Every press counts, and a press taken back stays counted (taking it back is free); the fewest is the pond's par, so the score is presses over par. A hint (marks a challenge run as helped) points at a lantern in one of the fewest-press ways to light the pond from where it stands now, and the cursor goes to it; pressing it always brings the fewest down by exactly one, so a hint never leads away from the finish. A restart puts the pond back as it began, with the presses so far still counted. There are no misses to count: any press is allowed, and nothing is ever stuck, because every pond can always be lit.

**The rules** are in `logic.ts`. Pressing is its own undo and the order never matters, so a way to win is just which lanterns get pressed an odd number of times, and whether a set wins is a system of linear equations over two numbers. `solve` finds every winning set by Gaussian elimination over two numbers and picks the fewest, so a pond's par is worked out, never guessed (a 5 by 5 pond has four winning sets, a 4 by 4 sixteen, a 3 by 3 or 6 by 6 one). `makePond` lights every lantern and then presses a plan's number of different lanterns at random, so every pond can be lit, and drops one that turns out easier than the plan's `atLeast`. Six levels: 3 by 3 with two, then four presses to find; 4 by 4 with four, then seven; 5 by 5 with five, then ten. Rule tests assert the fewest against a brute force over every 3 by 3 and 4 by 4 board and over 4000 random 5 by 5 boards (including the quarter that cannot be lit, which `solve` reports as none), every winning set lights the board, each level's par lies inside its plan, hints bring the fewest down by exactly one on every level, and the same seed gives the same ponds.

**Couch.** A trip stop (face-off `twin`: each plays their own seeded pond, scored in presses over the fewest) climbs the six levels. One puzzle-shelf course of frozen ponds, **Dusk on the Pond**: a 4 by 4 pond and four 5 by 5 ponds with fewest presses 4, 5, 7, 9 and 11 (par 36); `course.ts` holds them with a `version`, and tests assert each can be lit, none starts lit, the par is the solver's, and the ponds climb. It opens in the last tier of trips and is on the shelf from the start. Not built: a 6 by 6 level, a replay of the best way, lanterns with more than two states.

### Picture Logic

*grown-up couch play · after Picross and Cross Pix, built on Pixel Pictures' logic levels.* A grid hides a picture. The numbers beside each row and above each column say how long the runs of filled squares in that line are, in order. Fill what the numbers allow, cross out what they rule out, and when the filled squares are exactly the picture's, its squares take their colors and it says what it is ("It is a sailboat!"). **Controls:** the stick or D-pad moves (hold to repeat) and the cursor's row and column are tinted so a far-off number is easy to follow; the bottom button fills the square (on a filled one it empties it); the left button crosses a square out (on a crossed one it lifts the cross); and **holding** either button while the stick moves paints a whole run, the first square deciding what the stroke does. A line's clue turns grey when its filled runs match it and red when no way of filling it fits the marks, judged from the clue alone and never from the answer.

**Score and help.** Every fill counts, and a filled square that is emptied and filled again counts twice; crosses, lifting them and emptying are free. The fewest is the picture's filled squares, so the score is fills over par (a filled square the picture does not have counts as a miss for adaptation, and is never refused or shown as one). The pause menu has **Show a hint** (marks a challenge run as helped) and **Empty this picture** (fills already made keep counting). A hint names a mark that cannot be right first (a filled square outside the picture, then a cross inside it), otherwise a square that one line decides from what she has marked rightly, preferring a fill to a cross and the square nearest the cursor: *"In row 4, the clue 6, 2 leaves only one way to fit. The ringed square must be filled."* with the line outlined and the sentence written beside the grid.

**The rules** are in `logic.ts`, the drawings in `pictures.ts`. `deductions` finds every square one line decides on its own: the squares every way of fitting the clue to what is known agrees on (it reuses Pixel Pictures' `placements`), so a hint is exactly what a person doing line logic would find next. A picture is accepted only if line logic alone solves it (`solvableByLines`), which also makes its solution unique. `passesNeeded` counts the rounds of "every line, once" a picture takes, which is how the gentler and harder 10 by 10 pictures are told apart. Four levels: a 6 by 6 warm-up drawn from the pictures Pixel Pictures can set as logic puzzles, an easier and a harder 10 by 10 level, and a 15 by 15 level; a seed picks the picture. Rule tests assert every picture is square, in palette letters and named, solvable by line logic and neither nearly empty nor nearly full, that the harder bank needs more passes than the easier, that every deduction matches the picture from many partly-solved states, that a player who follows every hint from an empty grid finishes every picture with exactly its par in fills (never a wrong one), that a wrong mark is named first, and the exact rules of each brush.

**Couch.** A trip stop (face-off `twin`: each plays their own seeded picture, scored in fills over the picture's squares) plays the 6 by 6 and 10 by 10 levels; the 15 by 15 pictures are the course. Two puzzle-shelf courses of frozen pictures: **Pond Pictures** (a sailboat, a cat and a duck; par 46 + 76 + 60 = 182) and **The Big Pictures** (a lighthouse and a butterfly; par 102 + 128 = 230); `course.ts` holds them with a `version`, and a test pins each picture's clues so an edit without a version bump fails. It opens in the last tier of trips and is on the shelf from the start. Not built: a replay of the best way, pictures she draws, colored puzzles, a 20 by 20 size.

### Word Search

*grown-up couch play · after the classic word-search puzzle.* A grid of letters hides the words of a themed list ("By the pond", "In the garden", "The weather"). **Controls:** the stick or D-pad moves (hold to repeat); the bottom button marks a word's first letter, and with the cursor on its last letter checks the line, a pale capsule showing the line being marked; the left button lets go of a mark. A word reads either way, so marking from the last letter to the first works. A found word keeps a colored band across the grid, its list entry is struck through and its dot takes the band's color, and the word is spoken. A mark that is not a straight line (across, down or on a slant) cannot be checked: it is neither right nor wrong and costs nothing.

**Score and help.** Every checked line is a guess, right or wrong; letting go of a mark and a crooked mark are free. The fewest is the number of words, so a perfect grid has no wrong guess and the score is guesses over par (a wrong guess counts as a miss for adaptation and is spoken about once a grid). The pause menu has **Show a hint** (marks a challenge run as helped; it rings the first letter of the word nearest the cursor and names it) and **Search this grid again** (forgets what was found; guesses already made keep counting).

**The rules** are in `logic.ts`, the words in `words.ts` and the block list in `blocked.ts`. `makeGrid` places each of a plan's words (longest first) somewhere it fits, sometimes crossing one already there, in the directions the plan allows, then fills the rest with letters and redraws only the filler until every listed word occurs exactly once in the grid, read in all eight directions, and none of the blocked words can be read anywhere (a 14 by 14 grid read in eight directions would otherwise show a short word by accident about one time in five). A test fails if a theme word contains a blocked word, forwards or backwards. Four levels: 8 by 8 with five words across and down, 10 by 10 with seven including slants, 12 by 12 with nine in every direction (so some read backwards), 14 by 14 with twelve; a seed picks the theme. Rule tests assert that every level hides exactly its words exactly once in the directions it allows, that backwards words only appear where allowed, the exact meaning of a line between two squares, a word reading both ways and a found word no longer matching, the hint's nearest-first-letter rule, and that the same seed makes the same grid.

**Couch.** A trip stop (face-off `twin`: each plays their own seeded grid, scored in guesses over the words) plays levels 1 to 3. Two puzzle-shelf courses of frozen grids: **Pond Words** (pond, garden and weather; 7 + 9 + 9 words, par 25) and **The Big Hunt** (a sea grid and a cozy grid on 14 by 14, 12 words each, par 24); `course.ts` holds them with a `version`, and tests assert each word is in its grid exactly once and from its theme, no blocked word can be read, and the big grids use backwards words. It opens in the last tier of trips and is on the shelf from the start. Not built: Letter Pond, typed answers, her own word lists, a timer (none is wanted).

### Pond Conga

*grown-up couch play · after Snake and Neopets' Meerca Chase, made gentle.* A line of ducklings paddles across a pond at a steady, easy pace, and the stick or D-pad turns the leader to each crumb of bread in turn. Eating a crumb adds a duckling; only the next crumb (and a faint look at the one after, so a route can be planned) is shown. **Controls:** the stick or D-pad turns (a turn is made at the next step, two can wait in line, a turn straight back is ignored); the bottom button, or any turn, sets off, because nothing moves before somebody is ready. A **bump** into a lily pad, the bank or the line itself is a **bonk**: nothing is lost, the whole conga turns about (the old tail leads), there is a breather of a second to choose, and the bonk counts as one more step. Because it turns about, the line can never box itself in, and there is no game over.

**Score and help.** Every step of the leader counts, and so does every bonk, so the score is steps over the fewest. The fewest is exact (no route can be shorter than the lily-pad-aware distances between the crumbs added up, and a pond is used only if a route with no bonk at all gets there), so a perfect run is a real thing to reach, and a bonk or a wasted turn each cost steps. The pause menu has **Show a hint** (yellow dots along the next few steps to the crumb, kept up as the line moves; marks a challenge run as helped) and **Start this pond again** (the line goes back to the start, steps so far keep counting). The pace is constant (2.4 to 3.4 steps a second, 3 on the course) so what makes a pond harder is the number of crumbs and lily pads, never speed.

**The rules** are in `logic.ts`: `step` (the whole rule of play), `distances` and `lowerBound`, `legRoutes`/`solveRoute` (bonk-free fewest-step routes with the line's own body simulated), `hintPath`, `parsePond`/`pictureOf`, and `makePond`, which places lily pads (the open water stays one piece, with a clear runway in front of the start), then each crumb at a distance from the one before within the level's range, keeping a pond only if a route as short as the crumbs allow exists. Six levels: 11 by 7 with five crumbs and no pads at 2.4 steps a second, then 13 by 9 with 4, then 8 pads, then 15 by 9 with 12, 16 and 20 pads (ten, twelve and twelve crumbs). Rule tests assert exactly that for every level on a dozen seeds each (par equals the lower bound and a bonk-free route reaches it), that a hint always leads on from wherever the line has wandered, and that a bonk keeps every duckling.

**Couch.** A trip stop (face-off `twin`: each plays their own seeded pond, scored in steps over the fewest) plays one pond at levels 1 to 5. One puzzle-shelf course of frozen ponds, **Crumb Trail** (four ponds of 6, 8, 10 and 12 crumbs among 3, 8, 13 and 17 lily pads; par 34 + 50 + 77 + 98 = 259), with **Watch the best routes** replaying each pond's fewest-steps way; `course.ts` holds them with a `version`, and tests assert each parses to a route as short as its crumbs allow. It opens in the last tier of trips and is on the shelf from the start. Not built: a timer (none is wanted), a bonk variant that costs nothing, two lines on one pond for a face-off, a wrapping pond.

### Island Bridges

*grown-up couch play · after Hashiwokakero (Bridges).* Numbered islands sit in a sea. Join them with plank bridges, one or two between the same pair, running straight along a row or column to the next island, so that every island ends with as many planks as its number, no bridge crosses another, and all the islands are one group. **Controls:** the stick or D-pad moves the highlight to the nearest island in the direction pushed; the bottom button *arms* the island to lay planks, and then a push toward a neighbor lays one (a second push lays another, a third bumps); the left button arms it to take planks off instead (free); pressing the same button again lets go. A faint line shows each neighbor the island can reach. An island turns green when it has its planks, and its outline turns red when its number can no longer be reached, whichever bridges were laid (judged from the numbers and the room left, never from the answer).

**Score and help.** Every plank laid is an entry, and taking one off is free, so a wrong plank costs the one entry it took to lay it; a bridge that would cross another, a third plank, or an island with no room bumps and costs nothing. The fewest is the planks in the answer, so the score is planks over par (a plank that is not in the answer counts as a miss for adaptation and is never refused). The pause menu has **Show a hint** (marks a challenge run as helped) and **Clear this sea** (planks already laid keep counting). A hint names a bridge that has more planks than the answer first; otherwise an edge one island decides by itself (its number equals the room it has left, so each open bridge must carry a plank); otherwise any plank the answer needs, with the two islands ringed and the bridge lit.

**The rules** are in `logic.ts`. `layoutOf` finds the pairs of islands that face each other and which of those bridges would cross; `solve` settles each island's number against the room it has (a bridge that must carry planks forces what crosses it to none) and searches what is left, and a finished try must also join every island. `makePuzzle` grows a layout and its planks together (each new island joined to one already there, then extra bridges where two face each other across clear water), numbers each island with the planks it got, and keeps the puzzle only if `solve` finds exactly one answer; the two gentler levels also need `bycounting` (propagation alone finishes it, which is how an easy puzzle is told from one that needs guessing). Four levels: 7 by 7 with seven to nine islands, 9 by 9 with eleven to fourteen, a busier 9 by 9 with fifteen to eighteen, and 11 by 11 with nineteen to twenty-four. Rule tests assert that the solver agrees with a brute force over every plank assignment on thousands of random small layouts, that a two-answer layout is counted as two and refused as a puzzle, that every made puzzle has exactly one answer with numbers one to eight, that the highlight reaches every island, and that a player who follows every hint from an empty sea lays exactly the answer's planks.

**Couch.** A trip stop (face-off `twin`: each plays their own seeded sea, scored in planks over the answer) plays levels 1 to 3. One puzzle-shelf course of frozen seas, **Island Hopping** (five seas of 8, 13, 18, 20 and 22 islands; par 11 + 17 + 27 + 27 + 38 = 120); `course.ts` holds them with a `version`, and tests assert each has exactly one answer, every number one to eight, and that they climb. It opens in the last tier of trips and is on the shelf from the start. Not built: a replay of the best way, a 13 by 13 size, hints that teach a named technique.
