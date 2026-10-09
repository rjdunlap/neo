import type { GameHowTo, GameModule, LevelLine } from '../games/types';

/**
 * Grown-up help for the touch games, one entry per game id. It sits next to the voice script rather than
 * inside each game so the wording can be read and reviewed in one place. The card opens by itself every time a
 * game is opened (as the intro before the round, with a demonstration for the games that have a bot) and, during
 * a round, from the hold-to-open "?" in the game shell. It is written for one level at a time: the goal is true
 * across the whole ladder, and each step, finish and note is either a plain string (true at every level) or a
 * `LevelLine` that holds only for the levels it names (`from` and `to` are inclusive and use the numbers in the
 * game's `describeLevel`). `howToFor` keeps what holds at the level on the card, so a step never talks about other
 * levels; the card's own "this level" line (the game's `describeLevel`) says what the level asks. The intro lets a
 * grown-up step the level and the card follows. It is not a hint, and reading it changes no progress.
 *
 * Couch play has its own how-to screens (`src/couch/catalog.ts`); these describe touch play.
 */
export const HOW_TO: Record<string, GameHowTo> = {
  'bubble-pop': {
    goal: 'Pop the bubbles that float up.',
    steps: [
      { to: 3, text: 'Tap a bubble to pop it.' },
      { from: 4, to: 6, text: 'Listen for the color, then tap only the bubbles of that color.' },
      { from: 7, to: 9, text: 'Tap the numbered bubbles in order, starting at 1.' },
      { from: 10, to: 10, text: 'Tap a bubble to hold it, then tap the bubble that makes 5 with it. Tap the held bubble again to let it go.' },
      { from: 11, text: 'Tap a bubble to hold it, then tap the bubble that makes 10 with it. Tap the held bubble again to let it go.' },
    ],
    finish: 'The round ends when the last bubble that was asked for is popped.',
    note: 'A wrong bubble only wobbles and gets a spoken hint; nothing is lost.',
  },
  'rainbow-fingers': {
    goal: 'Paint with colors.',
    steps: [
      { to: 1, text: 'Drag a finger across the page to paint.' },
      { from: 2, to: 2, text: 'Tap a paint pot to pick a color and hear its name, then drag a finger across the page to paint.' },
      { from: 3, to: 4, text: 'Tap the paint pot for the color asked, then drag a finger across the named part, like the sun.' },
      { from: 5, to: 5, text: 'Think what color the named thing is (an apple), tap that paint pot, then drag a finger across it.' },
      { from: 6, text: 'Tap two paint pots to pour them into the bowl, then drag a finger across the named part to paint it with the mixed color.' },
    ],
    finish: [
      { to: 2, text: 'The round ends once there is plenty of color on the page.' },
      { from: 3, text: 'The round ends when every asked-for part is colored.' },
    ],
    note: [{ to: 2, text: 'Any color is welcome in free painting.' }],
  },
  'jelly-drums': {
    goal: 'Tap the jelly drums to make music, then copy tunes.',
    steps: [
      { to: 3, text: 'Tap a jelly to hear its note.' },
      { from: 4, text: 'Listen to the tune, then tap the same jellies in the same order.' },
    ],
    finish: [
      { to: 3, text: 'The round ends after a number of notes.' },
      { from: 4, text: 'The round ends when every tune has been copied.' },
    ],
    note: [{ from: 4, text: 'Replaying the tune is always available.' }],
  },
  'peekaboo-barn': {
    goal: 'Find the animals hiding in the barn.',
    steps: [
      { to: 2, text: 'Tap a hiding place to see who is behind it.' },
      { from: 3, to: 5, text: 'Listen for the animal asked about, then tap where it is peeking.' },
      { from: 6, text: 'Watch who hides where, then tap the hiding place of the animal asked about.' },
    ],
    finish: [
      { to: 2, text: 'The round ends when every hiding animal has been found.' },
      { from: 3, text: 'The round ends when every animal asked about has been found.' },
    ],
  },
  'splish-splash': {
    goal: 'Give the pet a bath.',
    steps: [
      { to: 2, text: 'Rub a finger over the mud to scrub it off.' },
      { from: 3, to: 6, text: 'Rub a finger over the body part the pet names to wash it, then the next one it asks for.' },
      { from: 7, to: 7, text: 'Rub a finger over each of the two body parts the pet names.' },
      { from: 8, text: 'Wash the two body parts in the order the pet says: first one, then the other.' },
    ],
    finish: [
      { to: 2, text: 'The round ends when the mud is all gone.' },
      { from: 3, text: 'The round ends when everything asked for is clean.' },
    ],
    note: [{ from: 3, text: 'Washing the wrong part just makes the pet giggle and repeats the request.' }],
  },
  'duck-pond': {
    goal: 'Count ducks and put the right number in the pond.',
    steps: [
      { to: 2, text: 'Tap a duck to send it into the pond; the ducks are counted aloud.' },
      { from: 3, to: 5, text: 'Tap ducks into the pond until the number asked for is there; they are counted aloud.' },
      { from: 6, to: 7, text: 'Count the ducks, then tap the answer button with that number.' },
      { from: 8, to: 9, text: 'Work out how many ducks there are after some join (or swim away), then tap the answer button.' },
      { from: 10, text: 'Work out how many more ducks make ten, then tap that lily pad.' },
    ],
    finish: [
      { to: 2, text: 'The round ends when all the ducks are in the pond.' },
      { from: 3, to: 5, text: 'The round ends when the right number of ducks is in the pond.' },
      { from: 6, text: 'The round ends when the answer is right.' },
    ],
    note: [{ from: 3, text: 'The dots beside a number are there to count; counting them aloud together helps.' }],
  },
  'shape-sorter': {
    goal: 'Put each shape in the hole it fits.',
    steps: [
      'Drag a shape to a hole and let go.',
      { to: 4, text: 'Each hole is the color of the shape that fits it.' },
      { from: 5, to: 5, text: 'The holes are plain, so match by shape alone.' },
      { from: 6, to: 6, text: 'Every shape is the same color, so match by shape alone.' },
      { from: 7, text: 'Every shape is the same color and tilted: match by shape, however it leans.' },
    ],
    finish: 'The round ends when every shape is in a hole.',
    note: 'A shape that does not fit slides back with a hint.',
  },
  'color-garden': {
    goal: 'Sort the fruit, balloons and flowers into baskets by color.',
    steps: [
      { to: 1, text: 'Drag each fruit to the basket.' },
      { from: 2, to: 5, text: 'Drag each fruit to the basket of the same color.' },
      { from: 6, text: 'Drag each balloon and flower to the basket of the same color.' },
    ],
    finish: 'The round ends when everything is in a basket.',
  },
  'pattern-train': {
    goal: 'Finish the pattern on the train.',
    steps: [
      { to: 5, text: 'Look to see what repeats, then tap the choice that comes next.' },
      { from: 6, to: 6, text: 'Look to see what repeats, then tap the choice that fits the gap in the middle.' },
      { from: 7, to: 8, text: 'Listen to the bells on the train. Tap a bell to hear it, choose the bell that comes next, then tap the arrow.' },
      { from: 9, text: 'Look to see what repeats, then tap the choice for each of the two empty cars.' },
    ],
    finish: 'The round ends when the missing car or cars are filled in correctly.',
  },
  'memory-match': {
    goal: 'Turn over cards to find matching pairs.',
    steps: [
      'Tap a card to flip it, then tap a second card.',
      'Matching cards stay up; others flip back so you can remember them.',
      { from: 6, to: 7, text: 'A number matches the card with that many dots.' },
      { from: 8, to: 8, text: 'A match needs the same shape and the same color.' },
      { from: 9, text: 'A capital letter matches its small letter.' },
    ],
    finish: 'The round ends when every pair is found.',
    note: 'Turning over a card you have not seen is exploring, not a mistake.',
  },
  'letter-trails': {
    goal: 'Trace a letter with one finger.',
    steps: [
      'Start at the glowing dot.',
      "Drag along the firefly's path to draw the letter.",
      { from: 7, text: 'Trace each letter in turn, from the first to the last.' },
    ],
    finish: [
      { to: 6, text: 'The round ends when the whole letter has been traced.' },
      { from: 7, text: 'The round ends when the whole word or name has been traced.' },
    ],
  },
  'robot-path': {
    goal: 'Plan a path for the robot to reach the star.',
    steps: [
      'Tap arrows to add steps to the program.',
      'Tap a program slot to remove it (and what follows), then press play.',
      { from: 7, text: 'Tap an arrow again to go further the same way ("right x4").' },
      { from: 9, text: 'Use the loop button to repeat a few steps.' },
    ],
    finish: 'The round ends when the robot reaches the star.',
    note: 'If the robot cannot get there it simply stops; edit the program and try again.',
  },
  'size-parade': {
    goal: 'Compare sizes of friends.',
    steps: [
      { to: 4, text: 'Tap the friend who is bigger, smaller, biggest or smallest, as asked.' },
      { from: 5, text: 'Drag the friends into a line, in the size order asked.' },
    ],
    finish: [
      { to: 4, text: 'The round ends when the friend is chosen.' },
      { from: 5, text: 'The round ends when the friends are lined up correctly.' },
    ],
  },
  'bug-builder': {
    goal: 'Decorate a bug so it matches.',
    steps: [
      { to: 2, text: 'Drag a shape or a color onto a spot on the bug.' },
      { from: 3, to: 4, text: 'Look at the model bug, then drag the same shapes and colors onto the same spots.' },
      { from: 5, text: 'Look at one wing, then drag matching shapes and colors across onto the other wing, like a mirror.' },
    ],
    finish: 'The round ends when the bug matches what was asked for.',
  },
  'story-steps': {
    goal: 'Put pictures in story order.',
    steps: [
      { to: 2, text: 'Drag the picture that comes next into the glowing space.' },
      { from: 3, to: 5, text: 'Drag the pictures into the spaces in the order the story happens.' },
      { from: 6, to: 6, text: 'Drag the picture that belongs in the missing middle into the glowing space; some pictures are from another story.' },
      { from: 7, text: 'Choose the four pictures that make one story, and drag them into place in order.' },
      'Tap the music button to hear the pictures placed so far.',
    ],
    finish: 'The round ends when the story pictures are in a sensible order.',
  },
  'feelings-faces': {
    goal: 'Notice how the pet and its friends feel.',
    steps: [
      { to: 1, text: 'Tap a feeling bubble to see the pet show that feeling.' },
      { from: 2, to: 2, text: "Look at the pet's face, then tap the matching face." },
      { from: 3, to: 4, text: 'Listen for the feeling named, then tap the face that shows it.' },
      { from: 5, to: 5, text: 'Listen to what the pet needs, then tap what helps.' },
      { from: 6, to: 6, text: 'Watch what happens, then tap how the pet feels.' },
      { from: 7, text: 'Listen for the feeling named, then tap the friend who feels it.' },
    ],
    finish: 'The round ends when the question is answered.',
    note: [{ to: 1, text: 'Pure exploring: tap bubbles to see each feeling.' }],
  },
  'monster-munch': {
    goal: 'Feed the monster the right number of cookies.',
    steps: [
      { to: 2, text: 'Tap a cookie to feed the monster; it counts aloud.' },
      { from: 3, to: 3, text: 'Give each monster one cookie.' },
      { from: 4, to: 5, text: 'Feed the monster the number of cookies asked for; it counts aloud. Ring the bell when done.' },
      { from: 6, to: 6, text: 'Feed the cookies and apples asked for, like "2 cookies and 1 apple", then ring the bell.' },
      { from: 7, to: 7, text: 'Move cookies from the tray to the monsters until each has the same, then ring the bell and tap how many each monster got.' },
      { from: 8, text: 'Share the cookies fairly; some may be left over. Ring the bell, then tap how many each monster got and how many are left over.' },
    ],
    finish: [
      { to: 6, text: 'The round ends when the monster has the right amount.' },
      { from: 7, text: 'The round ends when the sharing is fair and the counting questions are answered.' },
    ],
  },
  'song-maker': {
    goal: 'Make a song with jellies, or copy one.',
    steps: [
      'Tap jellies on the loop to place notes; the loop plays round and round.',
      { from: 3, to: 4, text: 'Copy the song by tapping jellies on its shadow notes.' },
      { from: 5, to: 5, text: 'Copy the song on the little card.' },
      { from: 6, to: 6, text: 'Continue the song pattern (stairs, hops or zigzags).' },
      { from: 7, text: 'Listen, then find each note of the tune by ear.' },
    ],
    finish: [
      { to: 2, text: 'The round ends after the song has played a few rounds.' },
      { from: 3, text: 'The round ends when the song matches.' },
    ],
    note: [
      { to: 2, text: "Any song is welcome. After it, a little tree house button hangs the song in the pet's room, where the pet sings it." },
      { from: 3, text: 'A copied song is not hers, so it is not offered for the pet\'s room.' },
    ],
  },
  'puzzle-pals': {
    goal: 'Put a picture together.',
    steps: [
      'Drag a piece to where it belongs and let go.',
      { to: 1, text: 'One half is already in place: fit the other half to finish the picture.' },
      { from: 2, to: 4, text: 'A faint picture under the frame shows where each piece goes.' },
      { from: 5, text: 'The frame is empty, so work out where each piece belongs.' },
    ],
    finish: 'The round ends when every piece is in place.',
  },
  'weather-wardrobe': {
    goal: 'Dress the pet for the weather.',
    steps: [
      { to: 1, text: 'Tap the sky to change the weather; the pet dresses itself.' },
      { from: 2, to: 3, text: 'Tap the one thing that suits the weather.' },
      { from: 4, to: 5, text: 'Tap every thing that suits the weather.' },
      { from: 6, text: 'Tap the clothes that suit each kind of weather, to pack for the trip.' },
    ],
    finish: 'The round ends when the pet is dressed for the weather (or the trip).',
    note: [{ from: 2, text: 'A wrong choice is told which weather it is for, and the glowing one helps.' }],
  },
  'sink-float': {
    goal: 'Find out which things float and which sink.',
    steps: [
      { to: 2, text: 'Tap a thing to drop it in the water and watch.' },
      { from: 3, to: 3, text: 'Tap a guess (float or sink) first, then drop the thing in to test it.' },
      { from: 4, to: 5, text: 'Sort each thing into the float or the sink basket.' },
      { from: 6, text: 'Tap a guess (float or sink) first, then test the surprising thing.' },
    ],
    finish: 'The round ends when every thing has been dropped (or sorted).',
    note: [
      { from: 3, to: 3, text: 'A guess is never wrong; testing is how to find out. Each thing she watches go into the water is added to her discovery journal in the treehouse.' },
      { from: 6, text: 'A guess is never wrong; testing is how to find out. Each thing she watches go into the water is added to her discovery journal in the treehouse.' },
      { text: 'Each thing she watches go into the water is added to her discovery journal in the treehouse.' },
    ],
  },
  'duckling-parade': {
    goal: 'Lead Mama Duck so the ducklings follow her to the pond.',
    steps: [
      { to: 1, text: 'Tap the grass to walk Mama Duck; ducklings join her line as she passes them.' },
      { from: 2, text: 'Drag a finger to walk Mama Duck; ducklings join her line as she passes them.' },
      { from: 3, to: 3, text: 'Bring exactly the number of ducklings asked for to the pond.' },
      { from: 4, to: 4, text: 'Bring only the ducklings of the color asked for to the pond.' },
      { from: 5, to: 5, text: 'Bring exactly the number of ducklings asked for to the pond.' },
      { from: 6, to: 6, text: 'Bring exactly the number of ducklings of the color named to the pond.' },
      { from: 7, text: 'Collect ducklings in the color pattern asked for, in order, then bring them to the pond.' },
    ],
    finish: 'The round ends when the right ducklings reach the pond.',
  },
  'scoop-shop': {
    goal: 'Build ice cream cones for customers.',
    steps: [
      'Tap a tub to put a scoop on the cone.',
      { from: 2, to: 2, text: 'Choose the color the customer asks for.' },
      { from: 3, to: 3, text: 'Make the two scoops in the picture, in any order.' },
      { from: 4, to: 4, text: 'Stack the number and color of scoops the customer asks for.' },
      { from: 5, to: 5, text: 'Stack the three flavors in the order of the picture, bottom to top.' },
      { from: 6, text: 'Look at the picture, then stack the flavors in the same order after it hides.' },
    ],
    finish: 'The round ends when the cone matches the order.',
  },
  roundup: {
    goal: 'Herd the farm animals into their pens.',
    steps: [
      { to: 1, text: 'Tap an animal to hop it into the pen.' },
      { from: 2, to: 3, text: 'Wiggle a finger behind the animals to shoo them through the gate into the pen.' },
      { from: 4, to: 4, text: 'Shoo the pigs into the mud and the bunnies into the carrots.' },
      { from: 5, to: 5, text: 'Put exactly the number asked for in the pen, then ring the bell.' },
      { from: 6, text: 'Sort the pigs and bunnies into their pens, putting in the number of each that was asked for, then ring the bell.' },
    ],
    finish: 'The round ends when every animal is where it was asked to go.',
  },
  'bouncy-launch': {
    goal: 'Launch the pet and see where it lands.',
    steps: [
      { to: 1, text: 'Tap the spring and watch the pet bounce.' },
      { from: 2, text: 'Pull the pet back and let go. A bigger pull goes farther.' },
      { from: 3, to: 3, text: 'Aim for the cloud with the star.' },
      { from: 4, to: 4, text: 'Aim for the numbered cloud that was asked for.' },
      { from: 5, text: 'Pull back more, or less, than last time, as asked.' },
    ],
    finish: 'The round ends when the pet lands where it was asked to.',
    note: [
      { from: 2, text: 'After two clearly different pulls, the bigger-pull observation is added to her discovery journal in the treehouse.' },
      { from: 3, text: 'Landing short or long is just a try again.' },
    ],
  },
  'word-monsters': {
    goal: 'Meet the letter monsters and hear their sounds.',
    steps: [
      { to: 1, text: 'Tap a monster to hear its letter or sound.' },
      { from: 2, to: 2, text: 'Tap the monster whose letter was named.' },
      { from: 3, to: 3, text: 'Tap the monster whose letter makes the sound you hear.' },
      { from: 4, to: 4, text: 'Listen to the word, then tap the monster whose letter makes its first sound.' },
      { from: 5, to: 5, text: 'Put the letters into the slots to build the three-letter word.' },
      { from: 6, to: 6, text: 'Listen to the sounds of the word and build it from the letters; one letter is a spare.' },
      { from: 7, text: 'Change the first sound to make the next word in the family, like hat, cat, bat.' },
    ],
    finish: 'The round ends when the asked-for letters or word are found.',
    note: "Spoken letter sounds depend on the device's speech voice.",
  },
  'peg-garden': {
    goal: 'Drop a pearl through the garden so flowers bloom.',
    steps: [
      { to: 3, text: 'Tap the top to drop a pearl.' },
      { from: 2, to: 2, text: 'Keep dropping pearls until every flower has bloomed.' },
      { from: 3, to: 3, text: 'Bloom the orange flowers; they are counted aloud.' },
      { from: 4, text: 'Drag to aim the launcher, then let go.' },
      { from: 4, to: 4, text: 'Hit the numbered flower that was asked for.' },
      { from: 5, text: 'Hit the numbered flowers in order: 1, then 2, then 3.' },
    ],
    finish: 'The round ends when the requested flowers have bloomed.',
  },
  'fluffy-salon': {
    goal: 'Give the pet a fluffy makeover.',
    steps: [
      'Tap a tool, then drag or tap on the pet to use it.',
      { from: 3, to: 4, text: 'Listen for what the pet wants (like "make it long", or "short and blue") and use the tools to do it.' },
      { from: 5, text: 'Look at the pictured style and use the tools to copy its length, curls and color.' },
    ],
    finish: [
      { to: 2, text: 'The round ends when the pet is done.' },
      { from: 3, text: 'The round ends when the mirror shows what was asked.' },
    ],
    note: [{ to: 2, text: 'Any look is welcome in free play.' }],
  },
  'sound-garden': {
    goal: 'Listen to the garden friends and choose.',
    steps: [
      { to: 1, text: 'Tap a friend to hear it sing.' },
      { from: 2, to: 2, text: 'Listen to the bird and the frog, then tap the one that sings high (or low), as asked.' },
      { from: 3, to: 3, text: 'Listen to the bunny and the turtle, then tap the one that is fast (or slow), as asked.' },
      { from: 4, to: 4, text: 'Listen to the tune, then tap whether it goes up or down.' },
      { from: 5, to: 5, text: "Listen to the woodpecker's rhythm, then tap it back on the drum." },
      { from: 6, text: 'Listen closely, then answer: high or low, fast or slow, up or down.' },
    ],
    finish: 'The round ends when the listening questions are answered.',
  },
  'little-helpers': {
    goal: 'Send the right number of helpers to carry fruit.',
    steps: [
      { to: 1, text: 'Tap a fruit and a helper carries it home.' },
      { from: 2, to: 2, text: 'Tap a fruit to send a helper; tap again for more. The dots show how many it needs.' },
      { from: 3, to: 4, text: 'Tap a fruit to send helpers until you have sent the number asked for, then blow the whistle.' },
      { from: 5, to: 5, text: 'Some helpers are already there: send as many more as are needed, then blow the whistle.' },
      { from: 6, text: 'Every fruit needs the same team: send a team to each fruit, then blow the whistle.' },
    ],
    finish: 'The round ends when the fruit has been carried home.',
  },
  'egg-catch': {
    goal: 'Get the eggs into the basket.',
    steps: [
      { to: 1, text: 'Tap a hen; her egg rolls into the basket.' },
      { from: 2, to: 2, text: 'Slide the basket under the falling eggs.' },
      { from: 3, to: 3, text: 'Slide the basket under the brown eggs only; white eggs hatch in the hay.' },
      { from: 4, to: 4, text: 'Tap the gates so the egg rolls into the basket.' },
      { from: 5, to: 5, text: 'Tap the gates to send brown eggs to the basket and white eggs to the nest.' },
      { from: 6, text: 'The gates are already set: tap the hay where the egg will land, then watch it roll.' },
    ],
    finish: 'The round ends when the eggs have all been gathered or sorted.',
    note: [
      { from: 2, to: 5, text: 'A missed egg only hatches in the hay.' },
      { from: 6, text: 'A wrong guess shows how the gates send the egg; follow them and try again.' },
    ],
  },
  'mail-carrier': {
    goal: 'Deliver letters to the right houses.',
    steps: [
      { to: 1, text: 'Tap any mailbox to post the letter.' },
      { from: 2, to: 2, text: 'Tap the mailbox whose door is the color of the letter.' },
      { from: 3, to: 3, text: 'Match the dots on the letter to the dots and number on a mailbox.' },
      { from: 4, to: 4, text: 'Tap the house with the number on the letter.' },
      { from: 5, to: 5, text: 'Count the dots on the letter, then tap the house with that number.' },
      { from: 6, to: 6, text: 'Find who the letter is for in the picture key, then tap the house with their sign.' },
      { from: 7, text: 'Tap the house for letter one, then the house for letter two, then tap the green arrow to walk the route.' },
    ],
    finish: 'The round ends when the letters are delivered.',
  },
  'photo-safari': {
    goal: 'Take photos of the animal that is named.',
    steps: [
      { to: 1, text: 'Tap any animal to take its photo.' },
      { from: 2, to: 2, text: 'Listen for the animal named, then tap it to take its photo.' },
      { from: 3, to: 3, text: 'Listen for the animal and what it is doing, like "the bunny jumping", then tap it.' },
      { from: 4, to: 4, text: 'Listen for the animal and where it is, like "the duck under the tree", then tap it.' },
      { from: 5, to: 5, text: 'Listen for what it is doing and where it is, like "the cat sleeping behind the bush", then tap it.' },
      { from: 6, text: 'Listen for what the animal is not doing, like "the animal that is not sleeping", then tap it.' },
    ],
    finish: 'The round ends when the photos asked for are taken.',
    note: 'Each action she successfully photographs is added to her discovery journal in the treehouse.',
  },
  'bounce-back': {
    goal: 'Bounce the ball back and forth with the pet.',
    steps: [
      'Slide the huge paddle under the ball.',
      { from: 3, to: 3, text: 'A grown-up takes the other paddle.' },
      { from: 4, to: 4, text: 'Bounce the ball through the stars.' },
      { from: 5, text: 'Count the bounces out loud together.' },
    ],
    finish: 'The round ends when the rally reaches the goal.',
    note: 'The pet takes the other paddle if no grown-up joins.',
  },
  'dot-link': {
    goal: 'Link dots of the same color.',
    steps: [
      { to: 1, text: 'Tap a dot to pop it.' },
      { from: 2, to: 2, text: 'Drag from one dot to another of the same color to link them.' },
      { from: 3, to: 3, text: 'Drag from one dot to another of the color asked for, until the number asked for have popped.' },
      { from: 4, to: 4, text: 'Drag from dot to dot of one color to make a chain of four; make three chains.' },
      { from: 5, text: 'Drag a line all the way around four dots of one color to close a square; do it twice.' },
    ],
    finish: 'The round ends when the asked-for dots are cleared.',
  },
  'seesaw-balance': {
    goal: 'Make the seesaw go up, balance, or show how heavy something is.',
    steps: [
      { to: 2, text: 'Tap a friend to put it on the other side of the seesaw.' },
      { from: 3, to: 3, text: 'Tap blocks to put them on the other side until the seesaw balances.' },
      { from: 4, to: 4, text: 'Put the presents on the seesaw to see which side drops; the heaviest goes in the wagon.' },
      { from: 5, to: 5, text: 'Tap number weights onto the other side until it weighs the same as this side, using different pieces.' },
      { from: 6, to: 7, text: 'Tap blocks onto the other side until the seesaw balances, then tap the answer button for how heavy the box is.' },
      { from: 8, text: 'Take the same thing off both sides, one at a time, until a box is alone; then tap the answer button for how heavy it is.' },
    ],
    finish: [
      { to: 4, text: 'The round ends when the seesaw is balanced or the heaviest is chosen, as asked.' },
      { from: 5, text: 'The round ends when the seesaw is balanced as asked and the weight is chosen.' },
    ],
    note: 'Tipping is how the seesaw explains weight; trying things is the game. A heavier side going down and equal sides lying flat are added to her discovery journal after she sees them.',
  },
  'teddy-doctor': {
    goal: 'Look after the teddy patient.',
    steps: [
      { to: 1, text: 'Tap a boo-boo to put on a bandage.' },
      { from: 2, to: 2, text: 'Listen to where the patient hurts, then tap that place to put on a bandage.' },
      { from: 3, to: 3, text: 'Look at what is wrong, then tap what helps.' },
      { from: 4, to: 4, text: 'Listen to what hurts, then use the right thing in the right place.' },
      { from: 5, to: 5, text: 'Do the check-up in the order shown on the picture card.' },
      { from: 6, text: 'Do the check-up in the order the patient says.' },
    ],
    finish: 'The round ends when the patient is all better.',
  },
  'bumper-garden': {
    goal: 'Bump the ladybug into flowers so they bloom.',
    steps: [
      'Tap to send the ladybug up.',
      { from: 2, text: 'Tap the left or right side of the screen to flip the ladybug back up.' },
      { from: 3, to: 3, text: 'Bump the flowers of the color asked for.' },
      { from: 4, text: 'Bump the numbered flowers in order.' },
    ],
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
    steps: [
      { to: 2, text: 'Choose a stamp, then tap the paper to press it.' },
      { from: 3, text: 'Choose a stamp and a color, then tap the paper to press it. Drag a stamp to move it.' },
      { from: 4, text: 'Turn a stamp, or make it big or small.' },
      'The back arrow undoes a stamp.',
      { from: 5, text: 'Make the picture you are asked for (a garden, or two friends on an adventure) and tell its story.' },
    ],
    finish: 'The round ends when the picture is done: tap the green arrow.',
    note: "Every picture is welcome; there is no wrong way to stamp. After the round, a little tree house button hangs the picture in the pet's room (a new one replaces it, and the one it replaced can be brought back).",
  },
  'pet-kitchen': {
    goal: 'Share food fairly with friends.',
    steps: [
      { to: 4, text: 'Tap a cutting picture to cut the food into equal pieces.' },
      { to: 4, text: 'Move pieces between plates until everyone has the same.' },
      { from: 5, to: 6, text: 'Look at the recipe card and double it: put in two fruits for each fruit on the card.' },
      { from: 7, to: 7, text: 'Listen to the amount your friend asks for, cut equal pieces, then put that fraction on their plate.' },
      { from: 8, text: 'Look at the recipe card and halve it: put in one fruit for every two fruits on the card.' },
      'Tap the green arrow to serve.',
    ],
    finish: 'The round ends when the food is served fairly.',
    note: [
      { to: 4, text: 'If the pieces are not equal the kitchen asks to cut again; nothing is lost.' },
      { from: 5, to: 6, text: 'The back arrow takes the last fruit out; nothing is lost.' },
      { from: 7, text: 'Two quarters count as one half, and the round arrow lets you cut again; nothing is lost.' },
      { from: 8, text: 'The back arrow takes the last fruit out; nothing is lost.' },
    ],
  },
  'tangram-town': {
    goal: 'Fit shapes together to build a picture.',
    steps: [
      'Drag each shape onto its shadow.',
      { from: 3, text: 'To turn a shape, choose it and tap the round arrow; the yellow button helps.' },
      { from: 6, text: 'Fill the whole silhouette; the yellow button shows outlines and the next turn.' },
    ],
    finish: 'The round ends when the shapes fill the picture.',
  },
  'rhythm-neighbors': {
    goal: 'Answer the woodpecker with frog sounds.',
    steps: [
      { to: 2, text: 'Tap the woodpecker to hear its call, then tap frogs to answer.' },
      { from: 3, to: 3, text: 'Tap the woodpecker to hear its call, then answer with two or three frog notes.' },
      { from: 4, to: 4, text: 'Tap the woodpecker to hear its call, then play the pictured reply with the two frog voices.' },
      { from: 5, to: 5, text: 'Tap the woodpecker to hear its short call, then answer with a different long-and-short rhythm on the frogs.' },
      { from: 6, text: 'Take turns with the woodpecker, playing your frog part each time, then join the final duet.' },
      'Tap the green arrow when the song is ready.',
    ],
    finish: 'The round ends when the reply has been played and the green arrow tapped.',
    note: 'Taking turns is the point; a reply need not be perfect.',
  },
  'peekaround-island': {
    goal: 'Turn the island to see who is hiding.',
    steps: [
      'Tap an arrow to turn the island round.',
      { to: 3, text: "Then tap the picture of the friend hiding behind the tree (or the friend you are asked to find)." },
      { from: 4, to: 4, text: 'Then put a friend behind, in front of or next to the tree, as asked.' },
      { from: 5, text: 'Put friends where you are asked, two directions at once; after the island turns, tap who is in front now.' },
    ],
    finish: 'The round ends when the question has been answered.',
  },
  'light-lab': {
    goal: 'Aim the sunbeam at the sleeping flowers with mirrors.',
    steps: [
      'Tap a mirror to turn it.',
      { from: 3, text: 'Turn the mirrors first, then tap the sun to shine.' },
      { from: 5, to: 5, text: 'Colored glass changes the beam: shine through the pink glass to wake the pink flower.' },
    ],
    finish: 'The round ends when every flower has woken up.',
    note: 'A mirror turned the wrong way is just another try; the glowing mirror is a hint.',
  },
  'penguin-slide': {
    goal: 'Slide the penguin to the fish.',
    steps: [
      'Tap the ice where the penguin should slide.',
      { to: 4, text: 'It only stops when it bumps into something.' },
      { from: 5, text: 'It stops when it bumps into something, or in soft snow.' },
      'If it gets stuck, tap the round arrow to go back.',
    ],
    finish: 'The round ends when the penguin has eaten every fish.',
    note: 'The yellow arrow shows the next slide when help is asked for.',
  },
  'secret-code': {
    goal: 'Work out the secret code from clues.',
    steps: [
      'Tap stones to fill the slots, then turn the key.',
      { to: 2, text: 'A green check means the right stone is in the right place; gray means try another stone there.' },
      { from: 3, text: 'Green means the right stone in the right place; yellow means that color is in the code but in another slot; gray means try another stone.' },
      { from: 6, text: 'A color can be used twice in the code.' },
    ],
    finish: 'The round ends when the code is cracked.',
    note: 'A wrong try is how you learn the code.',
  },
  'frog-hop': {
    goal: 'Hop the frog along a number line.',
    steps: [
      { to: 1, text: 'Tap the lily pad with the number asked for to hop the frog there.' },
      { from: 2, to: 2, text: 'Hop one more or one less: tap the next lily pad up, or the one just before.' },
      { from: 3, to: 3, text: 'Start at the number shown and hop on the number of hops asked for: tap the lily pad where the frog lands.' },
      { from: 4, to: 4, text: 'Start at the number shown and hop back the number of hops asked for: tap the lily pad where the frog lands.' },
      { from: 5, to: 5, text: 'Count the hops from one number to the other, then tap a number card.' },
      { from: 6, text: 'Hop on or back along the long line, and tap the lily pad where the frog lands.' },
    ],
    finish: 'The round ends when the frog lands on the right number.',
  },
  'market-stall': {
    goal: 'Pay for things with shell coins.',
    steps: [
      { to: 3, text: 'Tap coins onto the counter to add up the price, then ring the bell.' },
      { from: 4, to: 4, text: 'Add the two prices, tap coins onto the counter to pay for both, then ring the bell.' },
      { from: 5, to: 5, text: 'Pay the price and ring the bell, then buy another one at the same price and pay a different way with other coins, ringing the bell again.' },
      { from: 6, text: 'The customer pays 10: tap coins onto the counter to give the change, then ring the bell.' },
    ],
    finish: [
      { to: 5, text: 'The round ends when the right amount has been paid.' },
      { from: 6, text: 'The round ends when the right change has been given.' },
    ],
  },
  'garden-grow': {
    goal: 'Plant seeds and watch them grow.',
    steps: [
      { to: 1, text: 'Tap the soil: a seed goes in and grows into a flower.' },
      { from: 2, to: 2, text: 'Tap the soil to plant seeds, then tap the cloud to make it rain.' },
      { from: 3, to: 3, text: 'Tap the seeds of the color asked for to plant them; tap a seed to take it out.' },
      { from: 4, to: 4, text: 'Plant exactly the number of seeds asked for, then tap the cloud to make it rain; tap a seed to take it out.' },
      { from: 5, text: 'Plant the number of seeds of each color asked for, like "2 red and 3 yellow", then tap the cloud; tap a seed to take it out.' },
    ],
    finish: 'The round ends when the garden has grown as asked.',
  },
  'clock-tower': {
    goal: 'Set the hands of the clock.',
    steps: [
      { to: 1, text: 'Turn the short hand (the hour) to the time asked, then ring the bell.' },
      { from: 2, to: 4, text: 'Turn the short hand (the hour) and the long hand (the minutes) to the time asked, then ring the bell.' },
      { from: 5, to: 5, text: 'Look where the short and long hands point, then tap the picture of what happens at that time.' },
      { from: 6, text: 'Turn the hands to one hour after the time shown, then ring the bell.' },
    ],
    finish: [
      { to: 4, text: 'The round ends when the clock shows the asked-for time.' },
      { from: 5, to: 5, text: 'The round ends when the right picture is chosen.' },
      { from: 6, text: 'The round ends when the clock shows one hour after the time it showed.' },
    ],
    note: 'The yellow hands show the answer to copy when help is asked for.',
  },
  'garden-rows': {
    goal: 'Plant a flower bed so no flower repeats in a row, or in a column.',
    steps: [
      'Tap a flower packet to choose it, then tap an empty spot to plant it.',
      'Tap a flower you planted to take it out again.',
      { to: 1, text: 'Each row needs one of every flower.' },
      { from: 2, text: 'Each row and each column needs one of every flower.' },
    ],
    finish: 'The round ends when every bed is full and right.',
    note: 'A flower that repeats in a row or column will not stay. Every bed has exactly one way to finish it, and the glowing spot is a hint.',
  },
  'ferry-jam': {
    goal: 'Slide the boats out of the way so the red ferry can reach the dock on the right.',
    steps: [
      'Drag a boat along the way it points; it stops at the next boat or the wall.',
      'Tap the round arrow to take back the last slide.',
      "Work out which boat is in the ferry's way and where it can go.",
    ],
    finish: 'The round ends when the ferry has sailed out of every harbor.',
    note: 'Nothing is a mistake here: slide as much as you like. After many slides without getting closer, the glowing boat shows a next slide.',
  },
  'critter-crossing': {
    goal: 'Work out which critters the bridge gate lets across.',
    steps: [
      { to: 1, text: 'The gate shows its rule: tap only the critters that fit it to send them across.' },
      { from: 2, text: 'Tap a critter to send it to the gate: it crosses, or waits with a red mark.' },
      { from: 2, text: 'After a few tries, tap the light bulb and pick the picture that matches who crossed.' },
      { from: 4, to: 4, text: 'The rule has two parts: a critter must fit both to cross.' },
      { from: 5, text: 'The rule may be "not" something, or have two parts: use everything you have seen.' },
    ],
    finish: [
      { to: 1, text: 'The round ends when the critters that fit have crossed.' },
      { from: 2, text: 'The round ends when the secret rule is guessed; the critters not yet tried then cross or wait by the rule.' },
    ],
    note: [
      {
        from: 2,
        text: 'Trying a critter is never a mistake. A guess only counts as one if it disagrees with something you saw; a fair guess that is not yet proven just says to try another critter.',
      },
    ],
  },
  'pixel-pictures': {
    goal: 'Color squares to make a picture.',
    steps: [
      { to: 1, text: 'Tap squares to fill them and copy the little picture.' },
      { from: 2, to: 2, text: 'Pick a color first, then tap squares to fill them.' },
      { from: 3, to: 3, text: 'Tap squares to fill the other half, so both sides match like a mirror.' },
      { from: 4, text: 'The numbers say how many squares in a row or column are filled; tap squares to fill them.' },
    ],
    finish: 'The round ends when the picture matches.',
  },
  'goodnight-room': {
    goal: 'Say goodnight to everything in the room.',
    steps: [
      { to: 2, text: 'Tap each thing to say goodnight.' },
      { from: 3, to: 3, text: 'Tap the thing that is named to say goodnight.' },
      { from: 4, text: 'Tap the two things in the order they are named.' },
    ],
    finish: 'The round ends when the room is asleep.',
  },
  'animal-snack': {
    goal: 'Feed the animals their favorite snacks.',
    steps: [
      { to: 1, text: 'Tap an animal to hear it munch its snack.' },
      { from: 2, to: 2, text: 'Tap a snack and it floats to the animal who loves it.' },
      { from: 3, to: 3, text: 'Tap the animal that eats the food asked for.' },
      { from: 4, to: 4, text: 'Drag each snack to the animal who eats it.' },
      { from: 5, text: 'Give the animal the number of its snack that was asked for, then ring the bell.' },
    ],
    finish: 'The round ends when every animal has its snack.',
    note: 'Each animal she sees eating its favorite food is added to her discovery journal in the treehouse.',
  },
  'beat-builder': {
    goal: 'Make a beat with a drum, clap and bell.',
    steps: [
      'Tap squares to place sounds (drums on top, claps below); the beat plays round and round.',
      { from: 2, to: 2, text: 'Fill in the faint squares to copy the beat you can see.' },
      { from: 3, to: 3, text: 'Listen to the beat, then build it by ear; tap the note to hear it again.' },
      { from: 4, to: 4, text: 'Make the second half of the beat match the first half.' },
      { from: 5, text: 'Listen to the longer beat, then build it by ear with drum, clap and bell.' },
      'Tap the green check when the beat is ready.',
    ],
    finish: [
      { to: 1, text: 'The round ends when you tap the green check.' },
      { from: 2, text: 'The round ends when you tap the green check and the beat matches.' },
    ],
  },
  'clap-syllables': {
    goal: 'Hear that words are made of beats.',
    steps: [
      { to: 2, text: 'Tap the big hands once for each beat in the word: "but-ter-fly" is three claps.' },
      { from: 3, to: 3, text: 'Drag each picture to the number of beats in its name.' },
      { from: 4, text: 'Listen to the claps, then tap the picture with that many beats.' },
    ],
    finish: 'The round ends after the last word, sort or question.',
    note: 'The pet says each word whole and claps its beats with beads lighting up; a wrong count just brings the demonstration and another try. Check on the device that the words are said clearly.',
  },
  'chain-reaction': {
    goal: 'Arrange the ramps so the marble rings the big bell (and the little chime first, when there is one).',
    steps: [
      'Drag every loose ramp into a round socket.',
      'Tap the green arrow to run the machine and watch what each ramp changes.',
      'Move one ramp and run it again, or tap the yellow light bulb for one useful placement.',
    ],
    finish: 'The round ends after both machines ring their bells.',
    note: [
      {
        from: 6,
        text: 'A run that misses is an experiment, not a wrong answer. Loose ramps can be moved back to their tray, and this puzzle has several working designs.',
      },
      { text: 'A run that misses is an experiment, not a wrong answer. Loose ramps can be moved back to their tray.' },
    ],
  },
  'rhyme-time': {
    goal: 'Find the words that rhyme.',
    steps: [
      { to: 2, text: 'Listen to the word.' },
      { from: 3, text: 'Listen to the words.' },
      { to: 2, text: 'Tap the picture that rhymes with it.' },
      { from: 3, to: 3, text: 'Tap the two pictures that rhyme with each other.' },
      { from: 4, text: 'Tap the picture that does not rhyme with the others.' },
    ],
    finish: 'The round ends when the rhyme question is answered.',
    note: 'Tapping a picture replays its word.',
  },
  'stop-and-go': {
    goal: 'Go on green, stop on red.',
    steps: [
      { to: 1, text: 'Tap the traffic light to change it: red stops the car, green makes it go.' },
      { from: 2, to: 2, text: 'The light changes by itself: tap a car only when the light is green.' },
      { from: 3, to: 3, text: 'Tap the feet to step toward the flag on green, and freeze on red.' },
      { from: 4, text: 'At the crossing, tap a light to let one road go at a time.' },
    ],
    finish: 'The round ends when the cars or the pet have reached the end.',
  },
  'ramp-race': {
    goal: 'Make a car roll to the star.',
    steps: [
      { to: 2, text: 'Tap the ramp to make it taller or shorter, then press go.' },
      { from: 3, to: 3, text: 'Tap the ramp to change its height and the floor for carpet, wood or ice, then press go.' },
      { from: 4, text: 'Compare two lanes, changing only one thing between them, then press go.' },
    ],
    finish: [
      { to: 3, text: 'The round ends when the car stops on the star.' },
      { from: 4, text: 'The round ends when the fair test is done.' },
    ],
    note: 'A run that goes too far or not far enough is a free try.',
  },
  'critter-sort': {
    goal: 'Sort critters by the rule on the hoop.',
    steps: [
      { to: 3, text: 'Drag a critter into the hoop where it fits.' },
      { from: 3, to: 3, text: 'In the overlapping hoops, the middle is for critters that fit both rules.' },
      { from: 4, text: 'Look at the sorted pictures, work out the rule, then tap the picture that shows it.' },
    ],
    finish: 'The round ends when every critter has been sorted.',
  },
  'treasure-map': {
    goal: 'Use the grid to find or place things.',
    steps: [
      { to: 1, text: 'Find the picture row and the color column, then tap the square where they meet.' },
      { from: 2, to: 2, text: 'Find the column letter, then the row number (like "B3"), and tap that square.' },
      { from: 3, to: 3, text: 'Drag the thing to the named square, like "a tree at D2".' },
      { from: 4, text: 'Follow the directions from the start, like "3 right, then 1 up", and tap the square where you end up.' },
    ],
    finish: [
      { to: 2, text: 'The round ends when the treasure is found.' },
      { from: 3, to: 3, text: 'The round ends when the thing is placed.' },
      { from: 4, text: 'The round ends when the treasure is found.' },
    ],
  },
  opposites: {
    goal: 'Find opposite words and pictures.',
    steps: [
      { to: 1, text: 'Tap a picture to flip it to its opposite.' },
      { from: 2, to: 2, text: 'Tap the one that is named, like "the big one".' },
      { from: 3, to: 3, text: 'Look at the picture, then tap its opposite.' },
      { from: 4, text: 'Tap a picture, then tap its opposite, to match all three pairs.' },
    ],
    finish: 'The round ends when the pairs are matched.',
  },
  'picture-graph': {
    goal: 'Count critters and build a graph.',
    steps: [
      { to: 3, text: 'Count each kind of critter, and tap above its bar to add a block for each one.' },
      { to: 3, text: 'Tap the green check when the bars are built.' },
      { from: 2, to: 2, text: 'Then tap the bar with the most (or the fewest).' },
      { from: 3, to: 3, text: 'Then answer how many more of one kind there are than another.' },
      { from: 4, to: 4, text: 'Read the graph, then answer: how many in all, or which two bars are the same.' },
      { from: 5, to: 5, text: 'The key says each block is two critters. Count the pairs in the meadow, and tap above a bar to add a block for each pair.' },
      { from: 5, to: 5, text: 'Tap the green check when the bars are built.' },
      { from: 5, to: 5, text: 'Then answer how many more critters of one kind there are than another: each block counts for two.' },
      { from: 6, text: 'Read the graph, remembering that each block is two critters, then answer: how many critters in all, and how many more of one kind than another.' },
    ],
    finish: 'The round ends when the graph questions are answered.',
  },
  inchworm: {
    goal: 'Measure things, first with inchworms and then with a ruler.',
    steps: [
      { to: 1, text: 'Drag inchworms end to end along the leaf, and count them.' },
      { from: 2, to: 2, text: 'Drag inchworms end to end along the object, count them, then choose how many worms long it is.' },
      { from: 3, to: 3, text: 'Measure each thing with inchworms, then answer which is longer, and by how many worms.' },
      { from: 4, to: 4, text: 'Count the ruler spaces the object covers, even when it does not start at 0.' },
      { from: 5, to: 5, text: 'Two things sit on one ruler. Count the extra spaces the longer one covers, and choose how much longer it is.' },
      { from: 6, text: 'Two things sit end to end on the ruler. Count the spaces of both, and choose how long they are together.' },
    ],
    finish: 'The round ends when the measurement is chosen.',
  },
  'block-tower': {
    goal: 'Stack blocks into a tower.',
    steps: [
      { to: 1, text: 'Tap to stack blocks, then knock the tower down.' },
      { from: 2, to: 4, text: 'Tap the basket for blocks; tap the tower to take the top block off.' },
      { from: 2, to: 2, text: 'Stack until the tower is as tall as the friend, then knock it down.' },
      { from: 3, to: 3, text: 'Build up to the flag, then ring the bell.' },
      { from: 4, to: 4, text: "Build a tower as tall as Bear's, one block taller or one shorter, as asked, then ring the bell." },
      { from: 5, to: 5, text: 'Guess which tower will stand, then let go and see.' },
      { from: 6, text: "Drag blocks out past the table's edge to touch the star without tipping." },
    ],
    finish: [
      { to: 2, text: 'The round ends when the tower is knocked down.' },
      { from: 3, text: 'The round ends when the tower is built as asked.' },
    ],
    note: [{ from: 5, to: 5, text: 'A guess is never wrong.' }],
  },
  'lasso-loops': {
    goal: 'Group fireflies by drawing loops around them.',
    steps: [
      'Draw a loop around fireflies with one finger.',
      'Close the loop where it started; the fireflies fly into a jar.',
      { from: 2, to: 2, text: 'Loop exactly the number of fireflies the jar wants (2 or 3).' },
      { from: 3, to: 3, text: 'Loop fireflies five at a time, then count by fives and the ones left over.' },
      { from: 4, to: 4, text: 'Loop fireflies ten at a time, then say how many in all: tens and ones.' },
      { from: 5, text: 'Make the groups asked for, like "3 groups of 4", then say how many in all.' },
    ],
    finish: 'The round ends when every firefly is in a jar and the groups are counted.',
  },
  'pet-says': {
    goal: 'Copy what the pet does.',
    steps: [
      { to: 1, text: 'Watch the pet, then do the move yourself away from the screen.' },
      { from: 2, to: 2, text: 'Listen to the body word, then do it yourself away from the screen.' },
      { from: 3, to: 3, text: 'Do the two moves in order, away from the screen: "clap, then stomp".' },
      { from: 4, to: 4, text: "Move only when you hear the pet's name first, away from the screen." },
      { from: 5, text: 'Dance away from the screen while the music plays, and freeze when it stops.' },
      'A grown-up taps the arrow to go on.',
    ],
    finish: 'The round ends after the last move.',
    note: 'This is a body game; the screen is the guide.',
  },
  'owl-walk': {
    goal: 'Bring the owls home across the stepping stones.',
    steps: [
      { to: 1, text: 'Flip a color card, then tap the owl to hop to the next stone of that color.' },
      { from: 2, to: 2, text: 'Flip a color card, then hop an owl to the next stone of that color. Take turns with the pet.' },
      { from: 3, to: 3, text: 'Flip a color card, then choose which owl to hop to that color. Take turns with the pet.' },
      { from: 4, text: 'Flip a color card, then choose the owl that hops the farthest with it, so everyone gets home sooner.' },
    ],
    finish: 'The round ends when the owls are home.',
  },
  'lemonade-stand': {
    goal: 'Run a lemonade stand for a few days and learn from who comes.',
    steps: [
      { to: 1, text: 'Look at the weather sign, then tap how many cups to make.' },
      { from: 2, to: 2, text: 'Look at the weather sign (a ferry or a quiet day can join it), then tap how many cups to make.' },
      { from: 3, text: 'Look at the weather sign (a ferry or a quiet day can join it), then tap how many cups to make and a price in shells.' },
      'Tap OPEN and watch the friends buy, then look at the new row of the table. Tap a row to hear it.',
      'The lightbulb asks the pet for help, based on the table so far.',
    ],
    finish: 'The round ends after the last day, when the pet points out one comparison from the table.',
    note: [
      {
        from: 4,
        text: 'Running out or having cups left is never a mistake: it is a result to learn from, and spare cups go to a picnic. Asking for help counts once a day. A lemon costs a shell and makes two cups.',
      },
      {
        text: 'Running out or having cups left is never a mistake: it is a result to learn from, and spare cups go to a picnic. Asking for help counts once a day.',
      },
    ],
  },
  'habitat-helpers': {
    goal: 'Build or inspect a garden where its visitors have food, water and shelter.',
    steps: [
      { to: 3, text: 'Tap a garden piece to put it in the habitat. Tap it again to take it out.' },
      { from: 4, to: 4, text: 'Tap the pieces in the prepared habitat to hear what each one gives, then tap Bunny or Duck to predict who will visit.' },
      { from: 5, text: 'Tap garden pieces to fill the open spaces. Some pieces meet more than one need.' },
      'Tap the green gate to test the habitat and see who comes.',
    ],
    finish: 'The round ends after every habitat has been tested and its visitor arrives.',
    note: [
      { to: 3, text: 'Testing an incomplete habitat is a free experiment. After two tests, a useful piece glows.' },
      { from: 4, to: 4, text: 'A prediction that does not match is still a useful observation, not a mistake.' },
      { from: 5, text: 'Testing an incomplete habitat is a free experiment. After two tests, a useful piece glows.' },
    ],
  },
};

/** What the how-to card shows for one game at one level: every line already chosen for that level. */
export interface HowToCard {
  title: string;
  /** Which level this is, as the grown-up zone numbers it. */
  levelNumber: number;
  /** The level in a few words, from the game's own `describeLevel`. */
  level: string;
  goal: string;
  steps: readonly string[];
  finish: string;
  note?: string;
}

/** Whether a line holds at a level. */
export const holdsAt = (line: LevelLine, level: number) => (line.from ?? -Infinity) <= level && level <= (line.to ?? Infinity);

/** The first line of a list that holds at the level (a plain string holds at all of them). */
function firstAt(lines: string | readonly LevelLine[] | undefined, level: number): string | undefined {
  if (typeof lines === 'string' || lines === undefined) return lines;
  return lines.find((l) => holdsAt(l, level))?.text;
}

export function howToFor(mod: Pick<GameModule, 'id' | 'name' | 'describeLevel'>, level: number): HowToCard | null {
  const entry = HOW_TO[mod.id];
  if (!entry) return null;
  return {
    title: mod.name,
    levelNumber: level,
    level: mod.describeLevel(level),
    goal: entry.goal,
    steps: entry.steps.flatMap((s) => (typeof s === 'string' ? [s] : holdsAt(s, level) ? [s.text] : [])),
    finish: firstAt(entry.finish, level) ?? '',
    note: firstAt(entry.note, level),
  };
}

/**
 * Whether a game explains itself before its round: every time it is opened, unless a grown-up has turned the cards off.
 * A story request never does (the story's own request comes first), nor does "again" straight after a round (she has just
 * seen it), and a game with no card has nothing to show. Opening a card is never a hint and costs the round nothing.
 */
export function shouldExplain(opts: { enabled: boolean; id: string; story: boolean; again: boolean }): boolean {
  return opts.enabled && !opts.story && !opts.again && opts.id in HOW_TO;
}
