import type { GameHowTo, GameModule } from '../games/types';

/**
 * Grown-up help for the touch games, one entry per game id. It sits next to the voice script rather than
 * inside each game so the wording can be read and reviewed in one place. The card (opened from the
 * hold-to-open "?" in the game shell) adds the current level's `describeLevel` line, so the entry here only
 * states what stays true across the whole ladder: the goal, the gestures, how a round ends, and any rule
 * about mistakes or experiments worth knowing. It is not a hint and never changes progress.
 *
 * Couch play has its own how-to screens (`src/couch/catalog.ts`); these describe touch play.
 */
export const HOW_TO: Record<string, GameHowTo> = {
  'bubble-pop': {
    goal: 'Pop the bubbles that float up.',
    steps: ['Tap a bubble to pop it.', 'Later levels ask for one color, numbers in order, or two bubbles that make 5 or 10.'],
    finish: 'The round ends when the last bubble that was asked for is popped.',
    note: 'A wrong bubble only wobbles and gets a spoken hint; nothing is lost.',
  },
  'rainbow-fingers': {
    goal: 'Paint with colors.',
    steps: ['Drag a finger across the page to paint.', 'From level 2, tap a paint pot to pick a color and hear its name.', 'Coloring pages ask for a named part, like the sun.'],
    finish: 'Free painting ends once there is plenty of color; coloring pages end when every asked-for part is colored.',
    note: 'Any color is welcome in free painting.',
  },
  'jelly-drums': {
    goal: 'Tap the jelly drums to make music, then copy tunes.',
    steps: ['Tap a jelly to hear its note.', 'In tune levels, listen to the tune, then tap the same jellies in the same order.'],
    finish: 'Free play ends after a number of notes; tune levels end when every tune has been copied.',
    note: 'Replaying the tune is always available.',
  },
  'peekaboo-barn': {
    goal: 'Find the animals hiding in the barn.',
    steps: ['Tap a hiding place to see who is behind it.', 'When asked, tap where a named animal is, or remember who hid where.'],
    finish: 'The round ends when every hiding animal has been found.',
  },
  'splish-splash': {
    goal: 'Give the pet a bath.',
    steps: ['Rub a finger over the mud to scrub it off.', 'Later levels name the body part or parts to wash, sometimes in order.'],
    finish: 'The round ends when everything asked for is clean.',
    note: 'Washing the wrong part just makes the pet giggle and repeats the request.',
  },
  'duck-pond': {
    goal: 'Count ducks and put the right number in the pond.',
    steps: ['Tap a duck to send it into the pond; the ducks are counted aloud.', 'Higher levels ask how many there are, how many after adding or taking away, or how many more make ten: tap the answer button.'],
    finish: 'The round ends when the number is right.',
    note: 'The dots beside a number are there to count; counting them aloud together helps.',
  },
  'shape-sorter': {
    goal: 'Put each shape in the hole it fits.',
    steps: ['Drag a shape to a hole and let go.', 'Later levels remove the color hints, so match by shape alone.'],
    finish: 'The round ends when every shape is in a hole.',
    note: 'A shape that does not fit slides back with a hint.',
  },
  'color-garden': {
    goal: 'Sort the fruit, balloons and flowers into baskets by color.',
    steps: ['Drag one thing to the basket of the same color.', 'Level 1 is practice dragging with one basket.'],
    finish: 'The round ends when everything is in a basket.',
  },
  'pattern-train': {
    goal: 'Finish the pattern on the train.',
    steps: ['Look (or listen) to see what repeats.', 'Tap the choice that comes next, or fits in the gap.', 'On the bell levels, tap a bell to hear it, then tap the arrow.'],
    finish: 'The round ends when the missing car or cars are filled in correctly.',
  },
  'memory-match': {
    goal: 'Turn over cards to find matching pairs.',
    steps: ['Tap a card to flip it, then tap a second card.', 'Matching cards stay up; others flip back so you can remember them.'],
    finish: 'The round ends when every pair is found.',
    note: 'Turning over a card you have not seen is exploring, not a mistake.',
  },
  'letter-trails': {
    goal: 'Trace a letter with one finger.',
    steps: ['Start at the glowing dot.', 'Drag along the firefly\'s path to draw the letter.'],
    finish: 'The round ends when the whole letter, word or name has been traced.',
  },
  'robot-path': {
    goal: 'Plan a path for the robot to reach the star.',
    steps: ['Tap arrows to add steps to the program.', 'Tap a program slot to remove it (and what follows), then press play.', 'From level 7, tap an arrow again to go further, then use the loop button.'],
    finish: 'The round ends when the robot reaches the star.',
    note: 'If the robot cannot get there it simply stops; edit the program and try again.',
  },
  'size-parade': {
    goal: 'Compare sizes of friends.',
    steps: ['Tap the bigger or smaller friend when asked.', 'Later levels ask you to drag friends into a line in size order.'],
    finish: 'The round ends when the friends are chosen or lined up correctly.',
  },
  'bug-builder': {
    goal: 'Decorate a bug so it matches.',
    steps: ['Drag a shape or a color onto a spot on the bug.', 'Later levels copy a model bug, or mirror one wing onto the other.'],
    finish: 'The round ends when the bug matches what was asked for.',
  },
  'story-steps': {
    goal: 'Put pictures in story order.',
    steps: ['Drag the picture that comes next into the glowing space.', 'Tap the music button to hear the pictures placed so far.'],
    finish: 'The round ends when the story pictures are in a sensible order.',
  },
  'feelings-faces': {
    goal: 'Notice how the pet and its friends feel.',
    steps: ['Tap a feeling bubble or a face when asked.', 'Later levels ask what helps, or how someone feels after something happens.'],
    finish: 'The round ends when the question is answered.',
    note: 'The first level is pure exploring: tap bubbles to see each feeling.',
  },
  'monster-munch': {
    goal: 'Feed the monster the right number of cookies.',
    steps: ['Tap a cookie to feed the monster; it counts aloud.', 'Later levels ask for a number, two foods, or sharing fairly and counting the leftovers.', 'Ring the bell when done.'],
    finish: 'The round ends when the monster has the right amount (or the sharing is fair).',
  },
  'song-maker': {
    goal: 'Make a song with jellies, or copy one.',
    steps: ['Tap jellies on the loop to place notes; the loop plays round and round.', 'Copy levels show the song as shadows or a card to match.'],
    finish: 'Free levels end after the song has played a few rounds; copy levels end when the song matches.',
    note: 'Any song is welcome in the free levels. After a free song, a little tree house button hangs it in the pet\'s room, where the pet sings it; copied songs are not offered.',
  },
  'puzzle-pals': {
    goal: 'Put a picture together.',
    steps: ['Drag a piece to where it belongs and let go.', 'Early levels show a faint picture under the frame; later ones do not.'],
    finish: 'The round ends when every piece is in place.',
  },
  'weather-wardrobe': {
    goal: 'Dress the pet for the weather.',
    steps: ['Tap the sky to change the weather in level 1.', 'Then tap the clothes that suit the weather.'],
    finish: 'The round ends when the pet is dressed for the weather (or the trip).',
    note: 'A wrong choice is told which weather it is for, and the glowing one helps.',
  },
  'sink-float': {
    goal: 'Find out which things float and which sink.',
    steps: ['Tap a thing to drop it in the water and watch.', 'From level 3, tap a guess (float or sink) first, then test it.', 'Later levels sort things into float and sink baskets.'],
    finish: 'The round ends when every thing has been dropped (or sorted).',
    note: 'A guess is never wrong; testing is how to find out. Each thing she watches go into the water is added to her discovery journal in the treehouse.',
  },
  'duckling-parade': {
    goal: 'Lead Mama Duck so the ducklings follow her to the pond.',
    steps: ['Drag a finger to walk Mama Duck (level 1: tap to walk).', 'Ducklings join the line as she passes them.'],
    finish: 'The round ends when the right ducklings reach the pond.',
    note: 'Later levels ask for a color, a count, or a color pattern.',
  },
  'scoop-shop': {
    goal: 'Build ice cream cones for customers.',
    steps: ['Tap a tub to put a scoop on the cone.', 'Later levels ask for a color, a number, or a stack order to copy or remember.'],
    finish: 'The round ends when the cone matches the order.',
  },
  roundup: {
    goal: 'Herd the farm animals into their pens.',
    steps: ['Tap an animal to hop it into the pen (level 1).', 'Later, shoo animals with a finger, sort them into pens, or put in an exact number.'],
    finish: 'The round ends when every animal is where it was asked to go.',
  },
  'bouncy-launch': {
    goal: 'Launch the pet and see where it lands.',
    steps: ['Tap the spring in level 1.', 'Later levels: pull back and let go. A bigger pull goes farther.', 'Aim at the star cloud or the numbered cloud.'],
    finish: 'The round ends when the pet lands where it was asked to.',
    note: 'Landing short or long is just a try again.',
  },
  'word-monsters': {
    goal: 'Meet the letter monsters and hear their sounds.',
    steps: ['Tap a monster to hear its letter or sound.', 'Later levels ask you to find a letter, match a first sound, or build a short word.'],
    finish: 'The round ends when the asked-for letters or word are found.',
    note: 'Spoken letter sounds depend on the device\'s speech voice.',
  },
  'peg-garden': {
    goal: 'Drop a pearl through the garden so flowers bloom.',
    steps: ['Tap the top to drop a pearl.', 'Later levels aim a launcher: drag to point it, then let go.', 'Hit the right flower, or flowers in number order.'],
    finish: 'The round ends when the requested flowers have bloomed.',
  },
  'fluffy-salon': {
    goal: 'Give the pet a fluffy makeover.',
    steps: ['Tap a tool, then drag or tap on the pet to use it.', 'Later levels ask for a length, a color or a style to copy.'],
    finish: 'Free play ends when the pet is done; request levels end when the mirror shows what was asked.',
    note: 'Any look is welcome in free play.',
  },
  'sound-garden': {
    goal: 'Listen to the garden friends and choose.',
    steps: ['Tap a friend to hear it sing.', 'Later levels ask high or low, fast or slow, up or down, or to echo a rhythm on the drum.'],
    finish: 'The round ends when the listening questions are answered.',
  },
  'little-helpers': {
    goal: 'Send the right number of helpers to carry fruit.',
    steps: ['Tap a fruit to send a helper; tap again for more. The dots show how many it needs.', 'Blow the whistle when you have sent the number asked for.', 'Later levels ask for an exact number, how many more, or equal groups.'],
    finish: 'The round ends when the fruit has been carried home.',
  },
  'egg-catch': {
    goal: 'Get the eggs into the basket.',
    steps: ['Level 1: tap a hen.', 'Then slide the basket under falling eggs, tap the gates so an egg rolls where you want, or tap where an egg will land.'],
    finish: 'The round ends when the eggs have all been gathered or sorted.',
    note: 'A missed egg only hatches in the hay; at the prediction level there is no wrong place to tap.',
  },
  'mail-carrier': {
    goal: 'Deliver letters to the right houses.',
    steps: ['Tap a mailbox or house to deliver the letter.', 'Match the color, dots, number, or a name from the map key.', 'Map levels: tap the houses in order, then tap the green arrow to walk the route.'],
    finish: 'The round ends when the letters are delivered.',
  },
  'photo-safari': {
    goal: 'Take photos of the animal that is named.',
    steps: ['Listen to the request.', 'Tap the animal that matches (an action, a place, or "not" something).'],
    finish: 'The round ends when the photos asked for are taken.',
    note: 'Level 1 is free: tap any animal.',
  },
  'bounce-back': {
    goal: 'Bounce the ball back and forth with the pet.',
    steps: ['Slide the huge paddle under the ball.', 'A grown-up can take the other paddle from level 3.'],
    finish: 'The round ends when the rally reaches the goal.',
    note: 'The pet takes the other paddle if no grown-up joins.',
  },
  'dot-link': {
    goal: 'Link dots of the same color.',
    steps: ['Tap a dot to pop it (level 1).', 'Drag from one dot to another of the same color to link them.'],
    finish: 'The round ends when the asked-for dots are cleared.',
  },
  'seesaw-balance': {
    goal: 'Make the seesaw go up, stay level, or show how heavy something is.',
    steps: ['Tap a friend, block or box to put it on the other side of the seesaw.', 'Higher levels weigh mystery boxes, then take the same thing off both sides until a box is alone. Tap an answer button to say its weight.'],
    finish: 'The round ends when the seesaw is balanced as asked and the weight is chosen.',
    note: 'Tipping is how the seesaw explains weight; trying things is the game.',
  },
  'teddy-doctor': {
    goal: 'Look after the teddy patient.',
    steps: ['Tap a boo-boo to put on a bandage.', 'Later levels listen to what hurts, then choose the right tool for the right place, in order.'],
    finish: 'The round ends when the patient is all better.',
  },
  'bumper-garden': {
    goal: 'Bump the ladybug into flowers so they bloom.',
    steps: ['Tap to send the ladybug up (level 1).', 'Tap the left or right side of the screen to flip the ladybug back up.', 'Later levels ask for one color or numbered order.'],
    finish: 'The round ends when the asked-for flowers have bloomed.',
  },
  'quick-tricks': {
    goal: 'Do a short show of tiny tricks.',
    steps: ['Do each trick as it appears: drag, tap or turn what is shown.', 'Tap the arrow to move on to the next trick.'],
    finish: 'The round ends after the last trick in the show.',
    note: 'There is at most one hint per trick.',
  },
  'stamp-studio': {
    goal: 'Make a picture with stamps.',
    steps: ['Choose a stamp (and a color), then tap the paper to press it.', 'Drag a stamp to move it; later levels let you turn it or make it big or small.', 'The back arrow undoes a stamp.'],
    finish: 'The round ends when the picture is done: tap the green arrow.',
    note: 'Every picture is welcome; there is no wrong way to stamp. After the round, a little tree house button hangs the picture in the pet\'s room (a new one replaces it, and the earlier one can be brought back).',
  },
  'pet-kitchen': {
    goal: 'Share food fairly with friends.',
    steps: ['Tap a cutting picture to cut the food into equal pieces.', 'Move pieces between plates until everyone has the same.', 'Recipe levels double each ingredient on the card.', 'Tap the green arrow to serve.'],
    finish: 'The round ends when the food is served fairly.',
    note: 'If the pieces are not equal the kitchen asks to cut again; nothing is lost.',
  },
  'tangram-town': {
    goal: 'Fit shapes together to build a picture.',
    steps: ['Drag each shape onto its shadow.', 'To turn a shape, choose it and tap the round arrow; the yellow button helps.'],
    finish: 'The round ends when the shapes fill the picture.',
  },
  'rhythm-neighbors': {
    goal: 'Answer the woodpecker with frog sounds.',
    steps: ['Tap the woodpecker to hear its call, then tap frogs to answer.', 'Later levels copy a pictured reply or a long-and-short rhythm.', 'Tap the green arrow when the song is ready.'],
    finish: 'The round ends when the reply has been played and the green arrow tapped.',
    note: 'Taking turns is the point; a reply need not be perfect.',
  },
  'peekaround-island': {
    goal: 'Turn the island to see who is hiding.',
    steps: ['Tap an arrow to turn the island round.', 'Then tap a friend\'s picture, or put a friend behind, in front of or next to the tree when asked.'],
    finish: 'The round ends when the question has been answered.',
  },
  'light-lab': {
    goal: 'Aim the sunbeam at the sleeping flowers with mirrors.',
    steps: ['Tap a mirror to turn it.', 'From level 3, turn the mirrors first, then tap the sun to shine.', 'Some levels add colored glass.'],
    finish: 'The round ends when every flower has woken up.',
    note: 'A mirror turned the wrong way is just another try; the glowing mirror is a hint.',
  },
  'penguin-slide': {
    goal: 'Slide the penguin to the fish.',
    steps: ['Tap the ice where the penguin should slide.', 'It only stops when it bumps into something, or in soft snow.', 'If it gets stuck, tap the round arrow to go back.'],
    finish: 'The round ends when the penguin has eaten every fish.',
    note: 'The yellow arrow shows the next slide when help is asked for.',
  },
  'secret-code': {
    goal: 'Work out the secret code from clues.',
    steps: ['Tap stones to fill the slots, then turn the key.', 'A green check means the right stone is in the right place; gray means try another stone there.', 'From level 3, yellow means the color is in the code but in another slot.'],
    finish: 'The round ends when the code is cracked.',
    note: 'A wrong try is how you learn the code.',
  },
  'frog-hop': {
    goal: 'Hop the frog along a number line.',
    steps: ['Tap a lily pad to hop the frog there.', 'Later levels ask for one more or less, hops on or back, or how many hops: tap a number card.'],
    finish: 'The round ends when the frog lands on the right number.',
  },
  'market-stall': {
    goal: 'Pay for things with shell coins.',
    steps: ['Tap coins onto the counter to add up the price.', 'Later levels add two prices, pay two ways, or give change.', 'Ring the bell when it is paid.'],
    finish: 'The round ends when the right amount has been paid.',
  },
  'garden-grow': {
    goal: 'Plant seeds and watch them grow.',
    steps: ['Tap the soil to plant a seed.', 'Tap the cloud to make it rain.', 'Later levels ask for a color or a number of seeds; tap a seed to take it out.'],
    finish: 'The round ends when the garden has grown as asked.',
  },
  'clock-tower': {
    goal: 'Set the hands of the clock.',
    steps: ['Turn the short hand (the hour); from level 2, turn the long hand (the minutes) too.', 'Ring the bell when the clock says the time.', 'Some levels read a time and pick what happens then, or set the time an hour later.'],
    finish: 'The round ends when the clock shows the asked-for time.',
    note: 'The yellow hands show the answer to copy when help is asked for.',
  },
  'garden-rows': {
    goal: 'Plant a flower bed so no flower repeats in a row, or in a column.',
    steps: ['Tap a flower packet to choose it, then tap an empty spot to plant it.', 'Tap a flower you planted to take it out again.', 'From level 2, each column needs one of every flower too.'],
    finish: 'The round ends when every bed is full and right.',
    note: 'A flower that repeats in a row or column will not stay. Every bed has exactly one way to finish it, and the glowing spot is a hint.',
  },
  'ferry-jam': {
    goal: 'Slide the boats out of the way so the red ferry can reach the dock on the right.',
    steps: ['Drag a boat along the way it points; it stops at the next boat or the wall.', 'Tap the round arrow to take back the last slide.', 'Work out which boat is in the ferry\'s way and where it can go.'],
    finish: 'The round ends when the ferry has sailed out of every harbor.',
    note: 'Nothing is a mistake here: slide as much as you like. After many slides without getting closer, the glowing boat shows a next slide.',
  },
  'critter-crossing': {
    goal: 'Work out which critters the bridge gate lets across.',
    steps: ['Tap a critter to send it to the gate: it crosses, or waits with a red mark.', 'After a few tries, tap the light bulb and pick the picture that matches who crossed.', 'On the first level the gate shows its rule: tap only the critters that fit.'],
    finish: 'The round ends when the secret rule is guessed; the critters not yet tried then cross or wait by the rule.',
    note: 'Trying a critter is never a mistake. A guess only counts as one if it disagrees with something you saw; a fair guess that is not yet proven just says to try another critter.',
  },
  'pixel-pictures': {
    goal: 'Color squares to make a picture.',
    steps: ['Tap squares to fill them.', 'Pick a color first on the two-color levels.', 'Logic levels use the numbers to say how many squares in a row or column are filled.'],
    finish: 'The round ends when the picture matches.',
  },
  'goodnight-room': {
    goal: 'Say goodnight to everything in the room.',
    steps: ['Tap each thing to say goodnight.', 'Later levels name the thing, or two things in order.'],
    finish: 'The round ends when the room is asleep.',
  },
  'animal-snack': {
    goal: 'Feed the animals their favorite snacks.',
    steps: ['Tap an animal or a snack.', 'Later levels drag each snack to its animal, or give a number of snacks.'],
    finish: 'The round ends when every animal has its snack.',
    note: 'Each animal she sees eating its favorite food is added to her discovery journal in the treehouse.',
  },
  'beat-builder': {
    goal: 'Make a beat with a drum, clap and bell.',
    steps: ['Tap squares to place sounds (drums on top, claps below); the beat plays round and round.', 'Copy levels show faint squares, or play the beat to copy by ear.', 'Tap the green check when the beat is ready.'],
    finish: 'The round ends when you tap the green check (copy levels need the beat to match).',
  },
  'clap-syllables': {
    goal: 'Hear that words are made of beats.',
    steps: ['Tap the big hands once for each beat in the word: "but-ter-fly" is three claps.', 'Later levels sort pictures by their number of claps, or match some claps to a picture.'],
    finish: 'The round ends after the last word, sort or question.',
    note: 'The pet says each word whole and claps its beats with beads lighting up; a wrong count just brings the demonstration and another try. Check on the device that the words are said clearly.',
  },
  'chain-reaction': {
    goal: 'Arrange the ramps so the marble rings the big bell (and, later, the little chime first).',
    steps: ['Drag every loose ramp into a round socket.', 'Tap the green arrow to run the machine and watch what each ramp changes.', 'Move one ramp and run it again, or tap the yellow light bulb for one useful placement.'],
    finish: 'The round ends after both machines ring their bells.',
    note: 'A run that misses is an experiment, not a wrong answer. Loose ramps can be moved back to their tray, and the top level has several working designs.',
  },
  'rhyme-time': {
    goal: 'Find the words that rhyme.',
    steps: ['Listen to the word.', 'Tap the picture that rhymes, or the two that rhyme, or the odd one out.'],
    finish: 'The round ends when the rhyme question is answered.',
    note: 'Tapping a picture replays its word.',
  },
  'stop-and-go': {
    goal: 'Go on green, stop on red.',
    steps: ['Tap the traffic light to change it (level 1).', 'Then tap a car, or the feet, only on green, and freeze on red.', 'At the crossing, tap a light to let one road go at a time.'],
    finish: 'The round ends when the cars or the pet have reached the end.',
  },
  'ramp-race': {
    goal: 'Make a car roll to the star.',
    steps: ['Tap the ramp to make it taller or shorter, then press go.', 'Later levels also let you tap the floor for carpet, wood or ice.', 'The last level compares two lanes, changing only one thing.'],
    finish: 'The round ends when the car stops on the star or the fair test is done.',
    note: 'A run that goes too far or not far enough is a free try.',
  },
  'critter-sort': {
    goal: 'Sort critters by the rule on the hoop.',
    steps: ['Drag a critter into the hoop where it fits.', 'In overlapping hoops, the middle is for both rules.', 'In the last level, work out the rule from the sorted pictures.'],
    finish: 'The round ends when every critter has been sorted.',
  },
  'treasure-map': {
    goal: 'Use the grid to find or place things.',
    steps: ['Read a row and column, a letter and number, or directions.', 'Tap the square (or drag the thing to it).'],
    finish: 'The round ends when the treasure is found or the thing is placed.',
  },
  opposites: {
    goal: 'Find opposite words and pictures.',
    steps: ['Tap a picture to flip it (level 1).', 'Then find the one named, or the opposite of the one shown.'],
    finish: 'The round ends when the pairs are matched.',
  },
  'picture-graph': {
    goal: 'Count critters and build a graph.',
    steps: ['Count each kind of critter, and tap above its bar to add a block for each one.', 'Tap the green check when the bars are built.', 'Then answer questions about the graph: most, fewest, how many more.'],
    finish: 'The round ends when the graph questions are answered.',
  },
  inchworm: {
    goal: 'Measure things with inchworms.',
    steps: ['Drag inchworms end to end along the object.', 'Count them, then answer how long or which is longer.', 'On the ruler level, read the number at the end.'],
    finish: 'The round ends when the measurement is chosen.',
  },
  'block-tower': {
    goal: 'Stack blocks into a tower.',
    steps: ['Tap the basket for blocks; tap the tower to take the top block off.', 'Ring the bell when the tower is as tall as asked.', 'Later levels compare towers, guess which will stand, or drag blocks out past the table\'s edge to touch the star.'],
    finish: 'The round ends when the tower is built as asked, or knocked down in the first levels.',
    note: 'On the "which will stand" level, a guess is never wrong.',
  },
  'lasso-loops': {
    goal: 'Group fireflies by drawing loops around them.',
    steps: ['Draw a loop around fireflies with one finger.', 'Close the loop where it started; the fireflies fly into a jar.'],
    finish: 'The round ends when every firefly is in a jar and the groups are counted.',
  },
  'pet-says': {
    goal: 'Copy what the pet does.',
    steps: ['Watch the pet, then do the move yourself away from the screen.', 'A grown-up taps the arrow to go on.'],
    finish: 'The round ends after the last move.',
    note: 'This is a body game; the screen is the guide.',
  },
  'owl-walk': {
    goal: 'Bring the owls home across the stepping stones.',
    steps: ['Flip a color card, then tap the owl to hop to the next stone of that color.', 'Take turns with the pet.'],
    finish: 'The round ends when the owls are home.',
  },
};

/** What the how-to card shows for one game at one level. */
export interface HowToCard extends GameHowTo {
  title: string;
  /** The current level in a few words, from the game's own `describeLevel`. */
  level: string;
}

export function howToFor(mod: Pick<GameModule, 'id' | 'name' | 'describeLevel'>, level: number): HowToCard | null {
  const entry = HOW_TO[mod.id];
  if (!entry) return null;
  return { ...entry, title: mod.name, level: mod.describeLevel(level) };
}
