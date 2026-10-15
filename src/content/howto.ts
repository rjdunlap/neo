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
  'snowball-merge': {
    goal: 'Slide matching snowballs together until one reaches the target number.',
    steps: [
      'Tap an arrow to slide every snowball toward that edge. Equal neighbours join into their doubled number.',
      'Each snowball joins at most once per slide. No new snowballs arrive.',
      'Undo takes back a slide. Start over restores the same starting snowfield.',
      'Hint outlines an arrow on a finishing route, or Undo if your choices need revision.',
    ],
    finish: 'The round ends when the snowfield holds one snowball with the target number.',
    note: 'There is no clock or loss screen. Exploration and Undo count no misses; Hint and Start over count as help. An arrow that changes nothing adds no slide.',
  },
  'log-roll': {
    goal: 'Tip a log across stepping stones and stand it in the dark hollow with the gold rim.',
    steps: ['Tap an arrow to roll. A standing log tips onto two stones. Tipping along its length stands it up; rolling sideways moves one space.', 'Both ends need stones. The hollow supports a lying log, but only standing in it finishes.', 'Undo takes back a roll. Hint glows a direction on a shortest route. Start over restores the starting position.'],
    finish: 'Stand upright in the hollow to finish one puzzle and earn one sticker.',
    note: 'Exploration counts no misses. An unsupported roll stays put; two in a row show a hint. Help counts toward adaptation. Undo and Start over keep rolls and hints.',
  },
  'marble-jump': {
    goal: 'Leave exactly one marble on the triangle.',
    steps: [
      'Tap a marble to select it. Tap it again to cancel, or another marble to change selection.',
      'Tap an empty hole two spaces away in a straight line, jumping over one marble. The jumped marble comes off.',
      'Undo takes back a jump; Start over restores this same puzzle.',
      'Hint outlines a clearing jump. If your route cannot finish, it first takes back jumps to the nearest board that can.',
    ],
    finish: 'The round ends as soon as one marble remains.',
    note: 'Trying a legal route is free exploration. Only an attempted illegal jump counts as a miss. Undo and Start over keep misses and hints.',
  },
  'mossy-path': {
    goal: 'Bloom every moss tile once and guide the turtle to the pond last.',
    steps: ['Tap a tile beside the turtle to take one step. Each visited tile blooms.', 'Plan around the rocks. Reach the pond only after all other tiles bloom.', 'Undo takes back one step; Start over restores the same patch. Hint outlines a completing next step, or Undo until a route is possible.'],
    finish: 'Visiting every tile and reaching the pond finishes the round, including with help.',
    note: 'Legal route experiments and dead ends are free. Non-adjacent, visited and early-pond taps count a miss; two consecutive misses show help. Repeating help on the same path counts once. Undo and Start over preserve misses and hints.',
  },
  'brain-break': {
    goal: 'Light every numbered stone by finding the numbers in order.',
    steps: ['Tap the stone with the number shown above the pond.', 'Find the next number on the same shuffled board. Checked stones stay where they are.', 'Hint outlines the next stone; there is no time limit.'],
    finish: 'Finding the final number finishes the round, including with help.',
    note: 'A different unfinished number counts a miss. Two consecutive misses reveal a hint. Checked stones can be touched freely. This is number-search practice, without claims about general brain training.',
  },
  'pyramid-solitaire': {
    goal: 'Clear the pyramid by lifting exposed pairs that add to thirteen, or a king alone.',
    steps: ['Tap two exposed cards that add to 13. A = 1, J = 11, Q = 12; tap a K = 13 by itself.', 'A card is exposed when both cards directly below it have gone. Every rank is visible; no new cards arrive.', 'Tap the selected card again to cancel. Undo restores a removal; Start over restores this same deal.', 'Hint outlines a clearing move. On a blocked route it restores the nearest solvable position first.'],
    finish: 'Clearing every card finishes the round, including with help.',
    note: 'A mismatched exposed pair counts one miss; two give a hint. Covered-card taps and legal experiments are free. Undo and Start over preserve misses and hints. This miniature pyramid has no stock or conventional deck restriction.',
  },
  'number-nook': {
    goal: 'Slide the numbered tiles into row order, with the empty space at the bottom right.',
    steps: ['Tap a tile directly above, below, left or right of the empty space to slide it into the gap.', 'Compare the board with the small goal beside it. Green tiles are in their goal position, but may still need to move.', 'Undo takes back a slide. Hint outlines a tile on a shortest route from the current board. Start over restores the starting board.'],
    finish: 'The round ends when every numbered tile and the empty space match the goal.',
    note: 'Legal exploratory slides are free choices. A tile away from the gap gets a gentle hint; two rejected taps outline a useful slide. Undo and Start over preserve the slide count, misses and hints.',
  },
  'shape-buddies': {
    goal: 'Change two paper friends into useful shapes to bring a seed to a pot.',
    steps: [
      'Tap a friend to select it, then tap Flat, Cup or Slope to replace its shape.',
      'Drag one friend to the bridge dock and the other to the catching dock. A flat or sloped bridge works; a cup catches the seed.',
      'Tap Try to release the seed. After it is caught, tap the pot to carry and plant it.',
      'Use Replay to return a caught seed to the chute. Undo restores the last shape or placement edit. Drag a friend to its own parking spot to free a dock.',
    ],
    finish: 'Plant the caught seed to grow a sprout and finish the round.',
    note: 'Experiments never count as mistakes. Help and two unsuccessful runs glow the useful friend, shape tool and dock. Each unresolved role counts at most one hint. Either friend can do either job.',
  },
  'day-by-day': {
    goal: 'Make and read a pretend week of days and weather.',
    steps: [
      'Tap day cards to hear their names, then tap the arrow to place the selected day in the next slot.',
      'Look at the sky picture, then tap the matching weather button to record that day.',
      { from: 2, to: 3, text: 'After Sunday, choose tomorrow and yesterday for the days spoken. Tap the arrow to confirm. The week repeats from Sunday to Monday.' },
      { from: 3, to: 3, text: 'Count the sunny records and choose the total. Tap records to mark or unmark them as you count.' },
    ],
    finish: [
      { to: 1, text: 'The round ends after all seven days and their weather are recorded.' },
      { from: 2, to: 2, text: 'Record the week and answer two yesterday/tomorrow questions to finish.' },
      { from: 3, text: 'Record the week, answer two day questions, and count the sunny days to finish.' },
    ],
    note: 'Card naming, replaying recorded days, and counting marks are free support. Two wrong answers glow the right choice. This is a pretend week, independent of the real date.',
  },
  'orchard-rows': {
    goal: 'Plant an orchard in equal groups and count its trees.',
    steps: [
      { to: 2, text: 'Tap each empty row to plant all its trees.' },
      { from: 3, to: 3, text: 'Choose how many trees fill the empty row, then tap that row to plant them.' },
      'Tap each full row to count equal groups aloud, then choose the total on a number button.',
      { from: 2, to: 3, text: 'Tap the turning arrow to view the same orchard from the side. Tap each group to count by columns, then choose the total again.' },
    ],
    finish: 'The round ends after two orchards are planted and counted.',
    note: 'Rows can be planted or counted in any order. Replaying a counted row adds nothing and is free support. Two wrong number choices glow the answer.',
  },
  'bubble-pop': {
    goal: 'Pop the bubbles.',
    steps: [
      { to: 3, text: 'Tap a bubble to pop it.' },
      { from: 15, to: 15, text: 'Tap or pat anywhere on the screen. The bubble nearest the touch pops, so there is nothing to aim at.' },
      { from: 4, to: 6, text: 'Listen for the color, then tap only the bubbles of that color.' },
      { from: 7, to: 9, text: 'Tap the numbered bubbles in order, starting at 1.' },
      { from: 12, to: 12, text: 'Tap the numbered bubbles in order, starting at the number on the sign at the top, then counting up.' },
      { from: 13, to: 13, text: 'Start at the number on the sign at the top, then tap the bubbles counting back, one less each time, down to 1.' },
      { from: 14, to: 14, text: 'The sign at the top says what to count by, tens or fives. Tap the bubbles in that order, starting with the smallest.' },
      { from: 7, to: 8, text: 'Count the dots beneath a number if you want help.' },
      { from: 10, to: 11, text: 'The sign at the top shows the number the two bubbles make together.' },
      { from: 10, to: 10, text: 'Count the dots on the two bubbles together to make 5.' },
      { from: 10, to: 10, text: 'Tap a bubble to hold it, then tap the bubble that makes 5 with it. Tap the held bubble again to let it go.' },
      { from: 11, to: 11, text: 'Tap a bubble to hold it, then tap the bubble that makes 10 with it. Tap the held bubble again to let it go.' },
    ],
    finish: [
      { to: 14, text: 'The round ends when the last bubble that was asked for is popped.' },
      { from: 15, text: 'After a few pops a rainbow bubble floats up; a touch anywhere pops it and the round ends.' },
    ],
    note: [
      { to: 14, text: 'A wrong bubble only wobbles and gets a spoken hint; nothing is lost.' },
      { from: 15, text: 'No touch is wrong: a touch with no bubble on the screen does nothing.' },
    ],
  },
  'rainbow-fingers': {
    goal: 'Paint with colors.',
    steps: [
      { to: 1, text: 'Drag a finger across the page to paint.' },
      { from: 2, to: 2, text: 'Tap a paint pot to pick a color and hear its name, then drag a finger across the page to paint.' },
      { from: 3, to: 4, text: 'Tap the paint pot for the color asked, then drag a finger across the named part, like the sun.' },
      { from: 5, to: 5, text: 'Think what color the named thing is (an apple), tap that paint pot, then drag a finger across it.' },
      { from: 6, to: 6, text: 'Tap two paint pots to pour them into the bowl, then drag a finger across the named part to paint it with the mixed color.' },
      { from: 7, to: 7, text: 'Remember the pumpkin’s color, then tap two paint pots to mix it before dragging a finger across the pumpkin.' },
    ],
    finish: [
      { to: 2, text: 'The round ends once there is plenty of color on the page.' },
      { from: 3, text: 'The round ends when every asked-for part is colored.' },
    ],
    note: [{ to: 2, text: 'Any color is welcome in free painting.' }],
  },
  'gem-swap': {
    goal: 'Clear the tray by swapping gems into matching lines.',
    steps: [
      'Tap a gem, then an occupied neighbour to swap them; tap the selected gem again to cancel.',
      'Make a horizontal or vertical line of three matching shapes. Gems above fall into the gaps; no new gems arrive.',
      'Tap Undo to revise a swap, or Restart to bring back the starting tray.',
      'Tap Hint to outline a swap that starts a clearing route.',
    ],
    finish: 'The round ends when every gem is cleared; there is no turn limit.',
    note: 'A swap that makes no line stays put and counts as a miss. Undo keeps your swap count; Restart counts as help. If no clearing route remains, revise with Undo or Restart.',
  },
  'tile-pairs': {
    goal: 'Clear the stack by removing matching pairs.',
    steps: [
      'Tap two tiles with the same picture. Each needs a clear top and an open left or right side. Bright tiles are free.',
      'Tap a selected tile again to cancel it. A different picture gives a gentle reminder; neither tile is removed.',
      'Undo restores the last pair or shuffle. Hint outlines a pair on a clearing route.',
      'Shuffle brings the remaining pictures into solvable open rows. Removed tiles stay removed; each shuffle counts as help.',
    ],
    finish: 'The round ends when all tiles are gone, with one sticker even when you use help.',
    note: 'There is no clock or loss screen. Undo and Shuffle are counted. A hint is help; a blocked tile is exploration and does not count as a mistake.',
  },
  'lantern-lights': {
    goal: 'Light every lantern on the pond.',
    steps: [
      'Tap a lantern to flip it and the four lanterns beside it.',
      'Tap Undo to take the last tap back; Start over puts the pond back as it began.',
      'Tap Hint to see which lantern to try next.',
    ],
    finish: 'Every pond is done when all its lanterns glow; the round ends after the last pond.',
    note: 'There is no wrong tap, and taking one back is free. Each hint counts as help.',
  },
  'sudoku-garden': {
    goal: 'Fill the bed so every row, column and box holds each number once.',
    steps: [
      'Tap a square, then tap a number to put it there. A clash lights up red.',
      'Tap Marks to pencil small notes; Erase takes a number or its notes out.',
      'Tap Hint to see which square to try next; Start over begins the bed again.',
    ],
    finish: 'The bed is done when every square holds the right number.',
    note: 'A number that does not belong counts as a miss, and a hint counts as help. Taking a number out is free.',
  },


  'picture-logic': {
    goal: 'Fill the squares the numbers allow, and a picture appears.',
    steps: [
      'The numbers beside each row and column say how many squares in a row to fill. Touch a square to fill it, or drag along a row or column.',
      'Cross marks an empty square. Fill on a filled square empties it.',
      { from: 2, to: 4, text: 'A big picture slides: choose Slide, or drag the numbers.' },
      'Hint rings a square; Start over empties the picture.',
    ],
    finish: 'The picture is done when every filled square matches its numbers.',
    note: 'A fill outside the picture is a miss, and a hint is help. Crossing and emptying are free.',
  },
  'word-search': {
    goal: 'Find the hidden words in a grid of letters.',
    steps: [
      'Tap a word\'s first letter, then tap its last letter to check the line. Tapping the same letter again lets go.',
      { from: 1, to: 1, text: 'You can also drag a finger along the word, from its first letter to its last.' },
      { from: 2, to: 4, text: 'If part of the grid is out of sight, drag it to slide it. A quick tap marks a letter; a drag only slides.' },
      'Tap Hint to see where a word starts and hear which word it is; Start over clears the words found.',
    ],
    finish: 'The search is done when every word in the list is found.',
    note: 'A line that is not one of the words counts as a miss, and a hint counts as help. A mark that is not straight costs nothing.',
  },
  'island-bridges': {
    goal: 'Join the islands with bridges: each island needs as many planks as its number.',
    steps: [
      'Tap the water between two islands to lay a plank; tap again for a second. Bridges cannot cross.',
      'Tap Take off, then a bridge, to lift a plank.',
      'Hint shows a bridge to try; Start over clears the sea.',
    ],
    finish: 'The puzzle is done when every island has its planks and all the islands are joined.',
    note: 'A plank that is not in the answer counts as a miss, and a hint counts as help. Taking a plank off is free.',
  },
  'pond-conga': {
    goal: 'Steer a line of ducklings to each crumb of bread, in order.',
    steps: [
      'Touch the pond and lift to set the line off. It paddles on by itself.',
      'Swipe the way you want the line to turn; one stroke can turn it twice. A swipe straight back does nothing.',
      'A bump turns the whole line about. Hint shows the way to the next crumb; Start over puts the line back at the start.',
    ],
    finish: 'The pond is done when the ducklings have gobbled every crumb.',
    note: 'A bump counts as a miss, and a hint counts as help. Steps are not timed against you: the pace stays the same.',
  },
  'sing-along-barn': {
    goal: 'Sing a short song by tapping, Old MacDonald, Hot Cross Buns, Mary Had a Little Lamb or Au Clair de la Lune: every tap is the next note, and a friend joins each verse.',
    steps: [
      { to: 2, text: 'Tap anywhere to play the next note. Sing along, one syllable for each note. Old MacDonald: "Old MacDonald had a farm", then "And on that farm he had a cow" for each friend. Hot Cross Buns, Mary Had a Little Lamb and Au Clair de la Lune each open with their first lines, then each friend sings the next verse.' },
      { from: 3, to: 3, text: 'Tap the friends you want on the farm. When the barn is full, tap anywhere to play each note of the song.' },
      { from: 4, to: 4, text: 'Tap anywhere to sing the opening. Then, at the end of each verse, tap the friend you want to sing next; the friends who have sung wait in the row and only say hello. Tap anywhere to sing that friend\'s verse.' },
      { from: 5, to: 5, text: 'Tap the song you want, Old MacDonald, Hot Cross Buns, Mary Had a Little Lamb or Au Clair de la Lune. Then tap anywhere to sing the opening; at the end of each verse, tap the friend you want to sing next. The friends who have sung wait in the row and only say hello.' },
      { from: 6, text: 'Tap the song you want, the whole Old MacDonald verse, Hot Cross Buns, Mary Had a Little Lamb or Au Clair de la Lune. Tap anywhere to sing; after each verse, tap the friend who sings next. Old MacDonald adds "With a moo-moo here and a moo-moo there" and the first line again.' },
    ],
    finish: 'The round ends after the last verse of the last friend. Each round sings one song.',
    note: 'There is no wrong tap. Tapping fast or slowly only changes how the song is sung, and the animals answer on their own.',
  },
  'jelly-drums': {
    goal: 'Tap the jelly drums to make music, then copy tunes.',
    steps: [
      { from: 10, to: 10, text: 'Touch anywhere on the stage and the big jelly sings. Every few touches another jelly wakes up and joins in.' },
      { from: 1, to: 3, text: 'Tap a jelly to hear its note.' },
      { from: 4, to: 9, text: 'Listen to the tune, then tap the same jellies in the same order.' },
    ],
    finish: [
      { from: 1, to: 3, text: 'The round ends after a number of notes.' },
      { from: 4, to: 9, text: 'The round ends when every tune has been copied.' },
      { from: 10, to: 10, text: 'The round ends after a number of touches, once all five jellies are awake.' },
    ],
    note: [{ from: 4, to: 9, text: 'Replaying the tune is always available.' }],
  },
  'peekaboo-barn': {
    goal: 'Find the animals hiding in the barnyard or garden.',
    steps: [
      { from: 16, to: 16, text: 'Touch anywhere on the screen: the big house opens and an animal says hello. If she waits, it opens by itself.' },
      { from: 1, to: 2, text: 'Tap a hiding place to see who is behind it.' },
      { from: 3, to: 5, text: 'Listen for the animal asked about, then tap where it is peeking.' },
      { from: 6, to: 8, text: 'Watch who hides where, then tap the hiding place of the animal asked about.' },
    ],
    finish: [
      { from: 16, to: 16, text: 'The round ends after six touched reveals; the house opening by itself does not count.' },
      { to: 1, text: 'The round ends after eight reveals.' },
      { from: 2, to: 2, text: 'The round ends after twelve reveals.' },
      { from: 3, to: 8, text: 'The round ends when every animal asked about has been found.' },
    ],
  },
  'splish-splash': {
    goal: 'Give the pet a bath.',
    steps: [
      { to: 2, text: 'Rub a finger over the mud to scrub it off.' },
      { from: 9, to: 9, text: 'Pat anywhere on the screen: each pat washes a third of the nearest patch of mud away.' },
      { from: 3, to: 6, text: 'Rub a finger over the body part the pet names to wash it, then the next one it asks for.' },
      { from: 7, to: 7, text: 'Rub a finger over each of the two body parts the pet names.' },
      { from: 8, to: 8, text: 'Wash the two body parts in the order the pet says: first one, then the other.' },
    ],
    finish: [
      { to: 2, text: 'The round ends when the mud is all gone.' },
      { from: 3, to: 8, text: 'The round ends when everything asked for is clean.' },
      { from: 9, to: 9, text: 'The round ends when the mud is all gone.' },
    ],
    note: [{ from: 3, to: 8, text: 'Washing the wrong part just makes the pet giggle and repeats the request.' }],
  },
  'duck-pond': {
    goal: 'Count ducks and put the right number in the pond.',
    steps: [
      { from: 12, to: 12, text: 'Tap a duck on the pond to wave it bye-bye; it swims off and the pet counts down. When the last one has gone, they all swim back.' },
      { from: 1, to: 2, text: 'Tap a duck to send it into the pond; the ducks are counted aloud.' },
      { from: 3, to: 5, text: 'Tap ducks into the pond until the number asked for is there; they are counted aloud.' },
      { from: 6, to: 7, text: 'Count the ducks, then tap the answer button with that number.' },
      { from: 8, to: 9, text: 'Work out how many ducks there are after some join (or swim away), then tap the answer button.' },
      { from: 10, to: 10, text: 'Work out how many more ducks make ten, then tap that lily pad.' },
      { from: 11, to: 11, text: 'The sign tells the whole pond. Count the ducks you can see, then find how many are hiding under the bridge.' },
    ],
    finish: [
      { from: 12, to: 12, text: 'The round ends when the ducks have come back and been counted.' },
      { from: 1, to: 2, text: 'The round ends when all the ducks are in the pond.' },
      { from: 3, to: 5, text: 'The round ends when the right number of ducks is in the pond.' },
      { from: 6, to: 11, text: 'The round ends when the answer is right.' },
    ],
    note: [
      { from: 3, to: 4, text: 'The dots beside a number are there to count; counting them aloud together helps.' },
      { from: 8, to: 11, text: 'After a right answer, the sign shows the number sentence and the pet reads it aloud.' },
      { from: 11, to: 11, text: 'The hidden ducks paddle out one by one so both parts of the whole can be seen.' },
    ],
  },
  'read-do': {
    goal: 'Read a sign and make its meaning happen in the scene.',
    steps: [
      'Tap any printed word to hear it, or the speaker to hear the whole sign. This support is free.',
      { from: 1, to: 1, text: 'Choose the hat whose color matches the printed word.' },
      { from: 2, to: 2, text: 'Choose the big or small duck named by the two-word sign.' },
      { from: 3, to: 3, text: 'Choose both the animal and its action: the arrow means jump, and Z means sleep.' },
    ],
    finish: [
      { from: 1, to: 1, text: 'Choose all three color words to finish.' },
      { from: 2, to: 2, text: 'Choose both duck sizes to finish.' },
      { from: 3, to: 3, text: 'Act out all four sentences to finish.' },
    ],
    note: 'A wrong picture plays out its meaning, then the sign is read word by word. After two misses on a sign, its answer glows. Listening support does not establish independent reading.',
  },
  'number-trails': {
    goal: 'Draw a numeral by following the firefly, then meet that many things and count them.',
    steps: [
      'Put your finger on the firefly and follow its path from the glowing dot, along the arrow. A numeral with two parts takes two touches.',
      { to: 2, text: 'When the numeral is done, the things pop up one at a time. Count them aloud together.' },
      { from: 3, text: 'When the numeral is done, tap the sleeping things to wake exactly that many. Count as you tap.' },
    ],
    finish: [
      { to: 2, text: 'The round ends after the last thing has been counted.' },
      { from: 3, text: 'The round ends when exactly the right number are awake.' },
    ],
    note: 'Zero has no things: the round ends with “zero” said aloud. Wandering off the trail is a gentle miss; counting things can never be wrong.',
  },
  'fruit-sums': {
    goal: 'Make the number on the sign from two numbered fruit, and then find a different way to make it.',
    steps: [
      { to: 2, text: 'Tap two fruit; they hop into the boxes. Tap a fruit in a box to put it back.' },
      { from: 3, text: 'Tap two fruit, then a leaf to choose plus or take away. The fruit you tap first is the one you start from.' },
      'Tap the green check to see what you made. Any way that makes the number counts.',
    ],
    finish: 'The round ends after two different ways to make the number.',
    note: [
      { to: 2, text: 'A try that makes another number tells how much it made, and you can swap a fruit and check again. After two misses a fruit to start with glows. Adding the same two fruit the other way round is the same way.' },
      { from: 3, text: 'A try that makes another number tells how much it made, and you can swap a fruit and check again. After two misses a fruit to start with glows. Taking away more than you have just says so, and is not a miss.' },
    ],
  },
  'fill-dump': {
    goal: 'Fill, empty and refill: count fruit or pour water to a line.',
    steps: [
      { to: 2, text: 'Tap the basket to tip the fruit out. Then tap each piece (or the basket) to put it back.' },
      { from: 3, to: 4, text: 'Tap the fruit on the grass to put it in the basket, as many as the voice asks for.' },
      { from: 3, to: 4, text: 'Tap the basket to take the last one back out if there are too many.' },
      { from: 3, to: 4, text: 'Tap the green check when the basket has the right number.' },
      { from: 5, text: 'Pull the jug right to pour. Pull farther for more water; lift at the purple line.' },
      { from: 5, text: 'Tap the cup to empty into the tray. Tap the tray to refill the jug.' },
      { from: 5, text: 'Tap the green check when the water reaches the line.' },
    ],
    finish: [
      { to: 1, text: 'The round ends when all the fruit is back in the basket.' },
      { from: 2, to: 2, text: 'The round ends when all the fruit is back in after the second tip.' },
      { from: 3, to: 4, text: 'The round ends when the check is tapped with the right number in the basket.' },
      { from: 5, text: 'Fill three cups to their lines and check each one to finish the round.' },
    ],
    note: [
      { to: 2, text: 'There is no wrong move here; every tap does something.' },
      { from: 3, to: 4, text: 'Tapping the check with the wrong number is a gentle miss. After two, a glow shows what to do next.' },
      { from: 5, text: 'Spills and empty checks are free. Other wrong checks count misses. Two misses glow the next move, once per cup.' },
    ],
  },
  'shape-sorter': {
    goal: 'Put each shape in the hole it fits.',
    steps: [
      'Drag a shape to a hole and let go.',
      { to: 4, text: 'Each hole is the color of the shape that fits it.' },
      { from: 5, to: 5, text: 'The holes are plain, so match by shape alone.' },
      { from: 6, to: 6, text: 'Every shape is the same color, so match by shape alone.' },
      { from: 7, text: 'Every shape is the same color and tilted: match by shape, however it leans.' },
      { from: 8, text: 'Listen to the shape clue, then drag that shape into the box.' },
    ],
    finish: 'The round ends when every shape is in a hole.',
    note: [
      { to: 7, text: 'A shape that does not fit slides back with a hint.' },
      { from: 8, text: 'A shape that does not fit the clue slides back. After two misses, its hole glows.' },
    ],
  },
  'color-garden': {
    goal: 'Sort the fruit, balloons and flowers into baskets by color.',
    steps: [
      { to: 1, text: 'Drag each fruit to the basket.' },
      { from: 2, to: 5, text: 'Drag each fruit to the basket of the same color.' },
      { from: 6, to: 6, text: 'Drag each fruit, balloon and flower to the basket of the same color. A balloon or flower can be any color.' },
      { from: 7, text: 'Both baskets are blue. Drag each balloon and flower to the light blue basket or the dark blue one, whichever matches.' },
    ],
    finish: 'The round ends when everything is in a basket.',
  },
  'pattern-train': {
    goal: 'Finish the pattern on the train.',
    steps: [
      { to: 5, text: 'Look to see what repeats, then tap the choice that comes next.' },
      { from: 6, to: 6, text: 'Look to see what repeats, then tap the choice that fits the gap in the middle.' },
      { from: 7, to: 8, text: 'Listen to the bells on the train. Tap a bell to hear it, choose the bell that comes next, then tap the arrow.' },
      { from: 9, to: 9, text: 'Look to see what repeats, then tap the choice for each of the two empty cars.' },
      { from: 10, to: 10, text: 'The train rolls into a tunnel with dots for the cars hiding inside. Keep the pattern going through them, then tap the car that comes out.' },
      { from: 11, to: 11, text: 'The colors repeat in their own pattern and the shapes in theirs. Look at both, then tap the car that fits the glowing space. It can be anywhere after the first car.' },
      { from: 12, to: 12, text: 'Count the numbered cars by 2, 5, or 10, then tap the number for the glowing car. It can be at the end or in the middle.' },
      { from: 13, to: 13, text: 'One car does not belong in the pattern. Tap it and it hops off. Tapping a car that fits is a gentle miss.' },
      { from: 14, to: 14, text: 'One car shows the wrong piece. Tap it, then choose the piece that belongs there.' },
      { from: 15, to: 15, text: 'The train on top has a pattern. Tap the row of animals that repeats the same way, even though the pieces are different.' },
      { from: 16, to: 16, text: 'Build the same pattern with the animals. Fill each glowing car so cars that match on top match below, and cars that differ on top differ below. Any animals that do this are right.' },
    ],
    finish: 'The round ends when the missing car or cars are filled in correctly, or the wrong car is found and mended.',
  },
  'memory-match': {
    goal: 'Turn over cards to find matching pairs.',
    steps: [
      'Tap a card to flip it and hear its name, then tap a second card.',
      'Tap your first open card again to hear its name without choosing another card.',
      'Matching cards stay up; others flip back so you can remember them.',
      { from: 1, to: 5, text: 'Find identical pictures: shapes, island friends, fruit and other familiar things, or vehicles.' },
      { from: 6, to: 7, text: 'A number matches the card with that many dots.' },
      { from: 8, to: 8, text: 'A match needs the same shape and the same color.' },
      { from: 9, to: 9, text: 'A capital letter matches its small letter.' },
      { from: 10, to: 10, text: 'A number word matches the numeral that names it.' },
      { from: 11, to: 11, text: 'A picture of equal parts matches the fraction that names the shaded parts.' },
    ],
    finish: 'The round ends when every pair is found.',
    note: 'A nonmatching pair counts as a miss only when the first card’s partner was already seen. After two misses, one known partner glows until a match clears it.',
  },
  'letter-trails': {
    goal: 'Form capital letters, words and names by following a trail with one finger.',
    steps: [
      'Start at the glowing dot.',
      "Drag along the firefly's path to draw the letter.",
      { from: 7, to: 8, text: 'Trace each letter in turn, from the first to the last.' },
    ],
    finish: [
      { to: 6, text: 'The round ends when the whole letter has been traced.' },
      { from: 7, to: 8, text: 'The round ends when the whole word or name has been traced.' },
    ],
  },
  'robot-path': {
    goal: 'Explore how the robot follows or fixes a program.',
    steps: [
      { to: 10, text: 'Tap arrows to add steps to the program.' },
      { to: 10, text: 'Tap a program slot to remove it (and what follows), then press play.' },
      { from: 7, to: 8, text: 'Tap an arrow again to go further the same way ("right x4").' },
      { from: 9, to: 10, text: 'Use the loop button to repeat a few steps.' },
      { from: 11, to: 11, text: 'Read the shown program, tap the square where the robot will stop, then press play to watch.' },
      { from: 12, text: 'Press play to watch the program once. Then tap the slot to fix and tap an arrow to change it. Press play again.' },
    ],
    finish: [
      { to: 10, text: 'The round ends when the robot reaches the star.' },
      { from: 11, to: 11, text: 'The round ends after the robot shows where the program stops.' },
      { from: 12, text: 'The round ends when the fixed program reaches the star.' },
    ],
    note: [
      { to: 10, text: 'The board is drawn from three possible layouts. If the robot cannot get there it simply stops; edit the program and try again.' },
      { from: 11, to: 11, text: 'Predictions are just a chance to think; every guess is welcome.' },
      { from: 12, text: 'The first watch is free. A repair that still stops short gets a gentle hint after two tries.' },
    ],
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
    goal: 'Tell stories in pictures, explore what makes things happen, and predict or create an ending.',
    steps: [
      { from: 12, to: 13, text: 'Tap one picture in each pair: a character, weather, and a picnic prop. Tap the stage with the triangle to watch your narrated show.' },
      { from: 13, to: 13, text: 'After watching, change the weather or prop and watch again. The first show stays beside the stage so you can compare the endings; the cast stays the same.' },
      { from: 12, to: 13, text: 'The curved arrow undoes one edit. Watch replays your current story; the lightbulb speaks help and glows a useful control.' },
      { to: 2, text: 'Drag the picture that comes next into the glowing space.' },
      { from: 3, to: 5, text: 'Drag the pictures into the spaces in the order the story happens.' },
      { from: 6, to: 6, text: 'Drag the picture that belongs in the missing middle into the glowing space; some pictures are from another story.' },
      { from: 7, to: 7, text: 'Choose the four pictures that make one story, and drag them into place in order.' },
      { from: 8, to: 8, text: 'Look at the picture already shown. Drag the picture that made it happen into the glowing space before it.' },
      { to: 8, text: 'Tap the music button to hear the pictures placed so far.' },
      { from: 10, to: 10, text: 'Drag each picture into the first glowing space of its own story row, in order. Tap a picture beside a row to hear that story’s name.' },
      { from: 11, to: 11, text: 'Look at the three shown pictures and drag one of the two endings into the glowing space. Tap a shown picture to hear it, or the music button to replay the three clues.' },
      { from: 10, to: 10, text: 'The music button tells the pictures placed so far in both rows.' },
      { from: 9, to: 9, text: 'Tap one picture, then another, to swap them; tap the selected picture again to leave it where it is.' },
      { from: 9, to: 9, text: 'Tap the music button to hear the current order. The curved arrow puts the last swapped pair back.' },
    ],
    finish: [
      { from: 12, to: 12, text: 'After watching your show, tap the green check to take a bow and finish. Every story is accepted; you can edit and watch again first.' },
      { from: 13, to: 13, text: 'After watching the first show and a version with one changed event, tap the green check to take a bow. Creative choices cost no misses; each lightbulb request counts one hint.' },
      { to: 7, text: 'The round ends when the story pictures are in a sensible order.' },
      { from: 8, to: 8, text: 'The round ends when the cause is before its effect, and the pet explains what happened.' },
      { from: 11, to: 11, text: 'The round ends with the ending supported by the clue and a spoken explanation. The first other prediction plays without a miss; repeating it counts a miss and glows the clue, with one hint per round.' },
      { from: 10, to: 10, text: 'The round ends when both three-picture stories are in order. Two misses glow a useful next picture.' },
      { from: 9, to: 9, text: 'The round ends when all four pictures tell the story in order. Swaps are experiments; after eight swaps, a glow helps with an out-of-place picture.' },
    ],
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
      { from: 8, text: 'Watch what happens, then choose what would help the pet feel better.' },
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
      { from: 5, to: 7, text: 'The frame is empty. Thick flat sides belong along its outside edge; corners have two.' },
    ],
    finish: 'The round ends when every piece is in place.',
    note: 'After two wrong places, one piece and its place glow, and the pet names where it goes. Help starts with a corner, then builds beside completed pieces.',
  },
  'weather-wardrobe': {
    goal: 'Dress the pet for the weather.',
    steps: [
      { to: 1, text: 'Tap the sky to change the weather; the pet dresses itself.' },
      { from: 2, to: 3, text: 'Tap the one thing that suits the weather.' },
      { from: 4, to: 5, text: 'Tap every thing that suits the weather.' },
      { from: 6, text: 'Tap the clothes that suit each kind of weather, to pack for the trip.' },
      { from: 7, text: 'Tap each worn item that does not suit the new weather to take it off, then tap clothes for the new weather.' },
    ],
    finish: [
      { to: 6, text: 'The round ends when the pet is dressed for the weather (or the trip).' },
      { from: 7, text: 'The round ends when the pet has changed clothes for each new weather.' },
    ],
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
      { from: 7, to: 8, text: 'Collect ducklings in the color pattern asked for, in order, then bring them to the pond.' },
      { from: 9, to: 9, text: 'Repeat a group of two matching colors followed by one different color.' },
      { from: 10, text: 'Collect the ducklings that fit the color pattern and leave the odd duckling out.' },
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
      { to: 1, text: 'Tap the pet and watch the pet bounce.' },
      { from: 2, to: 5, text: 'Pull the pet back and let go. A bigger pull goes farther.' },
      { from: 3, to: 3, text: 'Aim for the cloud with the star.' },
      { from: 4, to: 4, text: 'Aim for the numbered cloud that was asked for.' },
      { from: 5, to: 5, text: 'Pull more or less than the red flag, as asked. After a miss, the red ring marks the previous pull.' },
      { from: 6, to: 6, text: 'Look at the shown pull, tap a cloud, then watch. Numbered flags mark the flights you watched.' },
      { from: 7, text: 'A friend waits on the grass. Pull the pet back and let go to land beside the friend. The dotted path and the puff show the last flight, so pull a little more or less.' },
    ],
    finish: [{ to: 2, text: 'The round ends after its launches.' }, { from: 3, to: 5, text: 'The round ends when the pet lands where it was asked to.' }, { from: 6, to: 6, text: 'The round ends after each shown pull has flown.' }, { from: 7, text: 'The round ends when every friend has had a snack.' }],
    note: [
      { from: 2, to: 7, text: 'After two clearly different pulls, the bigger-pull observation is added to her discovery journal in the treehouse.' },
      { from: 2, to: 5, text: 'A short or wrong-way pull gets a spoken nudge; after two, an arrow shows back and down. Neither counts as a miss or hint.' },
      { from: 3, to: 5, text: 'Landing short or long is just a try again.' },
      { from: 6, to: 6, text: 'Predictions are for noticing what happens; a different guess is not a miss.' },
      { from: 7, text: 'Landing a little short or long is just a try again; after two tries a ring shows how far back to pull.' },
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
      { from: 7, to: 7, text: 'Change the first sound to make the next word in the family, like hat, cat, bat.' },
      { from: 8, to: 8, text: 'Keep the first two sounds. Change the last sound to make the pictured word.' },
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
      { from: 6, to: 6, text: 'The gates are already set: tap the hay where the egg will land, then watch it roll.' },
      { from: 7, text: 'Set the gates for both waiting eggs, then tap the green arrow. Brown enters the top fork; white enters the other branch from its own hen.' },
    ],
    finish: [{ to: 6, text: 'The round ends when the eggs have all been gathered or sorted.' }, { from: 7, text: 'Route three pairs correctly to finish.' }],
    note: [
      { from: 7, text: 'The gates lock while both eggs roll, one at a time. A missed pair stays for revision; two misses light the needed gate directions.' },
      { from: 2, to: 5, text: 'A missed egg only hatches in the hay.' },
      { from: 6, to: 6, text: 'A wrong guess shows how the gates send the egg; follow them and try again.' },
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
      { from: 8, text: 'Find who the letter is for in the picture key and tap their house. Then compare the two paths and tap the one with fewer stepping stones.' },
    ],
    finish: [
      { to: 7, text: 'The round ends when the letters are delivered.' },
      { from: 8, text: 'The round ends when the shorter path is walked and the letter is delivered.' },
    ],
    note: [{ from: 8, text: 'The stones mark the path length. Count them together; every destination has one path with fewer stones.' }],
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
    goal: 'Bounce the ball back and forth with the pet, then aim it.',
    steps: [
      { to: 1, text: 'Slide the huge paddle on the right toward the ball; it also drifts to help when nobody is touching it.' },
      { from: 2, to: 2, text: 'Slide the paddle on the right under the ball.' },
      { from: 3, to: 3, text: 'Slide the right paddle under the ball. A grown-up can slide the left one.' },
      { from: 4, to: 4, text: 'Slide the paddle so the ball goes through the star: meet it with the end of the paddle to send it sideways.' },
      { from: 5, to: 5, text: 'Slide the paddle under the ball and count each bounce out loud together.' },
      { from: 6, to: 6, text: 'Listen for the color the pet calls, then meet the ball with the paddle\'s end to send it to that color on the wall.' },
      { from: 7, to: 8, text: 'Send the ball past the pet\'s paddle into the goal: meet it with the end of the paddle to aim it away from the pet.' },
      { from: 8, to: 8, text: 'The ball gets faster with every bounce in a rally.' },
      { from: 9, to: 9, text: 'The pet calls three colors in order, and the dots on top show them. Send the ball to each color in turn.' },
      { from: 10, to: 10, text: 'Slide the paddle under the ball and count by twos out loud with the pet: 2, 4, 6.' },
      { from: 11, text: 'Slide the paddle under the ball and count by fives out loud with the pet: 5, 10, 15.' },
    ],
    finish: [
      { from: 1, to: 3, text: 'The round ends when the bounces reach the goal; the pet\'s bounces count too.' },
      { from: 4, to: 4, text: 'The round ends when the ball has gone through five stars.' },
      { from: 5, to: 5, text: 'The round ends at ten bounces in a row; the pet\'s bounces count too.' },
      { from: 6, to: 6, text: 'The round ends when the ball has gone to the called color four times. Another color is just a new try.' },
      { from: 7, to: 7, text: 'The round ends when someone scores five goals. Win or lose, it is a good game.' },
      { from: 8, to: 8, text: 'The round ends when someone scores seven goals. Win or lose, it is a good game.' },
      { from: 9, to: 9, text: 'The round ends after two calls of three colors. Another color is just a new try at the same one.' },
      { from: 10, to: 10, text: 'The round ends at 20, after ten bounces; the pet\'s bounces count too.' },
      { from: 11, text: 'The round ends at 50, after ten bounces; the pet\'s bounces count too.' },
    ],
    note: [
      { to: 5, text: 'The pet takes the left paddle if no grown-up joins.' },
      { from: 6, text: 'The pet is not a rival to beat: its paddle is slow, a good shot always gets by it, and a loss still finishes with a sticker.' },
    ],
  },
  'dot-link': {
    goal: 'Link dots of the same color.',
    steps: [
      { to: 1, text: 'Tap a dot to pop it.' },
      { from: 2, to: 2, text: 'Drag from one dot to another of the same color to link them.' },
      { from: 3, to: 3, text: 'Drag from one dot to another of the color asked for, until the number asked for have popped.' },
      { from: 4, to: 4, text: 'Drag from dot to dot of one color to make a chain of four; make three chains.' },
      { from: 5, text: 'Drag a line all the way around four dots of one color to close a square; do it twice.' },
      { from: 6, to: 6, text: 'Drag through exactly five neighboring dots of one color; make three chains.' },
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
      { from: 8, to: 9, text: 'Take the same thing off both sides, one at a time, until a box is alone; then tap the answer button for how heavy it is.' },
      { from: 10, text: 'Take the same things off both sides. When two boxes balance the blocks, share the blocks fairly and tap how many belong to each box.' },
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
      { from: 7, to: 7, text: 'Pat the paper to press a big soft stamp. Pat as often as you like.' },
      { from: 1, to: 1, text: 'Tap the paper to press the stamp shown.' },
      { from: 2, to: 2, text: 'Choose either stamp, then tap the paper to press it.' },
      { from: 3, to: 6, text: 'Choose a stamp and a color, then tap the paper. Drag a stamp to move it.' },
      { from: 4, to: 6, text: 'Turn a stamp, or make it big or small.' },
      { to: 2, text: 'The back arrow removes the latest stamp.' },
      { from: 3, to: 6, text: 'The back arrow removes the latest stamp; pick up another and tap the bin to remove it.' },
      { from: 5, to: 6, text: 'Make the picture you are asked for (a garden, or two friends on an adventure) and tell its story.' },
    ],
    finish: [
      { from: 7, to: 7, text: 'The eighth pat finishes the picture by itself.' },
      { from: 1, to: 2, text: 'Tap the green arrow to finish; it wiggles after five stamps. A full paper finishes itself.' },
      { from: 3, to: 6, text: 'Tap the green arrow when your picture is done.' },
    ],
    note: "Every picture is welcome. After the round, the tree house button hangs it up.",
  },
  'pet-kitchen': {
    goal: 'Share food fairly with friends.',
    steps: [
      { to: 4, text: 'Tap a cutting picture to cut the food into equal pieces.' },
      { to: 4, text: 'Move pieces between plates until everyone has the same.' },
      { from: 5, to: 6, text: 'Look at the recipe card and double it: put in two fruits for each fruit on the card.' },
      { from: 7, to: 7, text: 'Listen to the amount your friend asks for, cut equal pieces, then put that fraction on their plate.' },
      { from: 8, text: 'Look at the recipe card and halve it: put in one fruit for every two fruits on the card.' },
      { from: 9, text: 'Cut the pizza into three equal slices, then give one slice to each friend.' },
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
      { to: 6, text: 'Drag each shape onto its shadow.' },
      { from: 7, to: 7, text: 'Make the house wall with one square or two triangles; add its roof. Either way finishes.' },
      { from: 7, to: 7, text: 'Leave spare shapes in the tray.' },
      { from: 3, to: 7, text: 'To turn a shape, choose it and tap the round arrow; the yellow button helps.' },
      { from: 8, to: 8, text: 'Find a shape facing the wrong way. Tap it, then use the round arrow to turn it in place.' },
      { from: 8, to: 8, text: 'Turns are free experiments; four turns put a shape back. The yellow button shows a mismatch.' },
      { from: 8, to: 8, text: 'Tap the green check when every shape matches its outline.' },
      { from: 6, to: 7, text: 'Fill the whole silhouette; the yellow button shows outlines and the next turn.' },
    ],
    finish: [{ to: 7, text: 'The round ends when the shapes fill the picture.' }, { from: 8, to: 8, text: 'A correct green check ends the repaired picture.' }],
    note: 'For toddler, preschool and pre-K play, each piece says its shape name the first time you pick it up.',
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
      { to: 6, text: 'Tap a mirror to turn it.' },
      { from: 3, to: 6, text: 'Turn the mirrors first, then tap the sun to shine.' },
      { from: 5, to: 5, text: 'Colored glass changes the beam: shine through the pink glass to wake the pink flower.' },
      { from: 7, to: 7, text: 'For three puzzles, tap the rock or edge where you think the locked beam will stop. Then turn the mirrors and shine the sun on one final puzzle.' },
    ],
    finish: [{ to: 6, text: 'The round ends when every flower has woken up.' }, { from: 7, text: 'The round ends when the final planning puzzle wakes every flower.' }],
    note: [
      { to: 6, text: 'A mirror turned the wrong way is just another try; the glowing mirror is a hint.' },
      { from: 7, text: 'Predictions are experiments and never count as misses. On the final puzzle, the glowing mirror is a hint.' },
    ],
  },
  'penguin-slide': {
    goal: 'Slide the penguin to the fish.',
    steps: [
      'Tap the ice where the penguin should slide.',
      { to: 4, text: 'It only stops when it bumps into something.' },
      { from: 5, to: 5, text: 'It stops when it bumps into something, or in soft snow.' },
      { from: 6, to: 7, text: 'Slide into an ice block to push it; it skates until it bumps into something.' },
      { from: 9, to: 9, text: 'Push both blocks to make stopping places on the route to the fish.' },
      { from: 8, to: 8, text: 'Push the block to make a stop. Soft snow stops both the penguin and the block.' },
      { from: 7, to: 8, text: 'Collect both fish; plan where to park the block so the penguin can reach them.' },
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
      { from: 6, to: 6, text: 'A color can be used twice in the code.' },
      { from: 7, text: 'Two or three guesses are already shown. Find the one code that fits every mark; its colors are all different.' },
    ],
    finish: 'The round ends when the code is cracked.',
    note: [{ to: 6, text: 'A wrong try is how you learn the code.' }, { from: 7, text: 'A try that contradicts the shown clues gets a reminder. After two, faint stones help; the original clues stay visible.' }],
  },
  'frog-hop': {
    goal: 'Hop the frog along a number line.',
    steps: [
      { to: 1, text: 'Tap the lily pad with the number asked for to hop the frog there.' },
      { from: 2, to: 2, text: 'Hop one more or one less: tap the next lily pad up, or the one just before.' },
      { from: 3, to: 3, text: 'Start at the number shown and hop on the number of hops asked for: tap the lily pad where the frog lands.' },
      { from: 4, to: 4, text: 'Start at the number shown and hop back the number of hops asked for: tap the lily pad where the frog lands.' },
      { from: 5, to: 5, text: 'Count the hops from one number to the other, then tap a number card.' },
      { from: 6, to: 6, text: 'Hop on or back along the long line, and tap the lily pad where the frog lands.' },
      { from: 7, to: 7, text: 'The sign shows the whole sum. First tap the number card for the hops that reach 10. Listen to the split, then tap the lily pad where the rest of the hops land.' },
    ],
    finish: 'Answer five questions to bring the frog home.',
    note: 'Two misses show the hops and glow the answer. Help counts once per question; tapping a pad when a number card is wanted is free.',
  },
  'market-stall': {
    goal: 'Pay for things with shell coins.',
    steps: [
      { to: 3, text: 'Tap coins onto the counter to add up the price, then ring the bell.' },
      { from: 4, to: 4, text: 'Add the two prices, tap coins onto the counter to pay for both, then ring the bell.' },
      { from: 5, to: 5, text: 'Pay the price and ring the bell, then buy another one at the same price and pay a different way with other coins, ringing the bell again.' },
      { from: 6, to: 6, text: 'The customer pays 10: tap coins onto the counter to give the change, then ring the bell.' },
      { from: 7, to: 7, text: 'Tap coins onto the counter to pay the price with as few shells as you can, then ring the bell; tap a coin on the mat to put it back and swap it.' },
    ],
    note: 'Tap a coin on the mat to put it back. Two misses show a payment; help counts once per order, including when you pay two different ways.',
    finish: [
      { to: 5, text: 'The round ends when the right amount has been paid.' },
      { from: 6, to: 6, text: 'The round ends when the right change has been given.' },
      { from: 7, to: 7, text: 'The round ends when the price has been paid with the fewest shells.' },
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
      { from: 6, to: 6, text: 'Look at the flowers on the sign. Plant one more of that color than the sign shows, then tap the cloud; tap a seed to take it out.' },
      { from: 7, text: 'Plant the flowers shown in two rows of three, then tap the cloud; tap a seed to take it out.' },
    ],
    finish: 'The round ends when the garden has grown as asked.',
  },
  'clock-tower': {
    goal: 'Set, read and change times on a clock.',
    steps: [
      { to: 1, text: 'Touch the middle to turn the short hour hand to the time asked, then ring the bell.' },
      { from: 2, to: 4, text: 'Touch the middle to turn the short hour hand and the edge to turn the long minute hand, then ring the bell.' },
      { from: 5, to: 5, text: 'Look where the short and long hands point, then tap the picture of what happens at that time.' },
      { from: 6, to: 6, text: 'Turn the hands to one hour after the time on the sign, then ring the bell.' },
      { from: 7, to: 7, text: 'Turn the hands to the time on the sign, like 3:25. The small numbers around the edge count by fives for the long hand. Then ring the bell.' },
      { to: 4, text: 'Tap the time sign to hear the request again for free.' },
      { from: 6, to: 7, text: 'Tap the time sign to hear the request again for free.' },
    ],
    finish: [{ to: 7, text: 'Four correct answers complete the round.' }],
    note: [
      { to: 4, text: 'After two misses on a time, yellow hands show the answer to copy. Turning or replaying is free.' },
      { from: 5, to: 5, text: 'After two misses on a time, the matching picture glows.' },
      { from: 6, to: 7, text: 'After two misses on a time, yellow hands show the answer to copy. Turning or replaying is free.' },
    ],
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
      { from: 5, to: 5, text: 'The rule may be "not" something, or have two parts: use everything you have seen.' },
      { from: 6, to: 6, text: 'The rule has two parts joined by "or": a critter that fits either one crosses, so most critters cross. Look for who waits.' },
      { from: 7, text: 'Two pictures are still in the running after two tries. Choose the critter that the two pictures would answer differently, then tap the light bulb for the one that is left. A critter they would answer the same way is a free try, never a mistake.' },
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
      { from: 6, text: 'Each number is colored to show the color of that run. Choose that color, then fill its squares.' },
    ],
    finish: 'The round ends when the picture matches.',
  },
  'goodnight-room': {
    goal: 'Listen, choose friends and say goodnight.',
    steps: [
      { to: 2, text: 'Tap each thing to say goodnight.' },
      { from: 3, to: 3, text: 'Tap the thing that is named to say goodnight.' },
      { from: 4, to: 4, text: 'Tap the two things in the order they are named.' },
      { from: 5, to: 5, text: 'Tap the animals in any order. The lamp and clock settle together afterwards.' },
      { from: 6, to: 6, text: 'Tap everyone else in any order, then the lamp or lantern last so its light helps you see.' },
      { from: 9, to: 9, text: 'Leave the lamp or lantern awake as the night-light. Tap every other friend in any order.' },
      { from: 8, to: 8, text: 'Listen for orange or brown, then tap every friend of that color in any order. The fish means the orange fish inside its blue bowl.' },
      { from: 7, to: 7, text: 'Listen for how many friends to say goodnight to, then tap that many awake friends. Any friends count; each goodnight is counted aloud.' },
    ],
    finish: [
      { to: 6, text: 'The round ends when the room is asleep.' },
      { from: 9, to: 9, text: 'The round ends when every other friend is asleep. The night-light keeps its warm glow.' },
      { from: 8, to: 8, text: 'After all the matching friends sleep, the others settle together and the round ends.' },
      { from: 7, to: 7, text: 'Reaching the requested count finishes your goodnights. The other friends stay awake briefly, then settle together for the finale.' },
    ],
  },
  'animal-snack': {
    goal: 'Feed the animals their favorite snacks.',
    steps: [
      { to: 1, text: 'Tap an animal to hear it munch its snack.' },
      { from: 2, to: 2, text: 'Tap a snack and it floats to the animal who loves it.' },
      { from: 3, to: 3, text: 'Tap the animal that eats the food asked for. Every second question plays an animal sound instead: tap the animal that makes it, or tap the speaker to hear it again.' },
      { from: 4, to: 4, text: 'Drag each snack to the animal who eats it.' },
      { from: 5, to: 5, text: 'Give the animal the number of snacks shown by the dots and numeral, then ring the bell.' },
    ],
    finish: [
      { to: 2, text: 'The round ends after six snacks are eaten.' },
      { from: 3, to: 3, text: 'The round ends after four food questions are answered.' },
      { from: 4, to: 4, text: 'The round ends when all three animals have their snack.' },
      { from: 5, to: 5, text: 'The round ends after three animals receive the requested count, confirmed with the bell.' },
    ],
    note: 'Each animal she sees eating its favorite food is added to her discovery journal in the treehouse.',
  },
  'beat-builder': {
    goal: 'Arrange percussion sounds in a repeating beat.',
    steps: [
      { from: 2, to: 5, text: 'Each beat has a spoken nickname; there is nothing to read.' },
      { from: 1, to: 3, text: 'The grid has four steps: drum on top, clap below. Tap a square to turn its sound on or off; the playhead loops.' },
      { from: 1, to: 1, text: 'To reveal the green check, leave at least three squares on and wait for the playhead to return to the start twice after your last edit.' },
      { from: 1, to: 1, text: 'Tap the green check when you want to finish your beat.' },
      { from: 1, to: 1, text: 'For two-year-olds one sound is enough: the green check appears once a single square has sounded all the way round. If every square is turned off, it goes away until a sound comes back.' },
      { from: 2, to: 2, text: 'Fill the faint dots to copy the visible beat. Squares outside the beat stay off when tapped.' },
      { from: 2, to: 2, text: 'Each exact match advances automatically; there is no green check.' },
      { from: 3, to: 3, text: 'Listen to the target and build it by ear. Tap the note button to hear it again.' },
      { from: 3, to: 3, text: 'The target plays twice first; then edit your beat. Tap the green check to compare. After two wrong checks, glowing plus marks ask you to add a sound and minus marks to remove one.' },
      { from: 4, to: 4, text: 'The grid has eight steps with drum on top and clap below. The first four columns are fixed.' },
      { from: 4, to: 4, text: 'Tap squares in the last four columns to make each row repeat its first four. Squares outside the pattern stay off when tapped.' },
      { from: 4, to: 4, text: 'Each exact match advances automatically; there is no green check. After two misses, glowing plus marks show missing sounds in the second half.' },
      { from: 5, to: 5, text: 'The grid has eight steps: drum on top, clap in the middle and bell below. Tap squares to turn sounds on or off.' },
      { from: 5, to: 5, text: 'Listen to the target and build it by ear. Tap the note button to hear it again.' },
      { from: 5, to: 5, text: 'The target plays twice first; then edit your beat. Tap the green check to compare. After two wrong checks, glowing plus marks ask you to add a sound and minus marks to remove one.' },
      { from: 6, to: 6, text: 'A small model beat sits under the buttons. Your grid starts as a copy with one square wrong: a sound is missing or one is extra. Tap the note to hear the model, tap squares to fix your copy, then tap the green check.' },
      { from: 7, to: 7, text: 'The drum row is locked in the right place. Listen to the target beat, then move the claps in the bottom row to match it. Tap the clap button to hear only the target claps and the note button to hear the whole beat.' },
      { from: 7, to: 7, text: 'Tap the green check to compare. A wrong check names the row and the square to look at; after two wrong checks, a glowing plus or minus marks a clap to add or take away. Tapping the locked drum does nothing but remind you.' },
      { from: 8, to: 8, text: 'You make a short piece of two parts. Tap the circle or the square to choose which part is on the grid. Make the circle part, tap the copy button to copy it to the square part, then change that.' },
      { from: 8, to: 8, text: 'Tap play to hear the circle part, then the square part; the arrow undoes your last change. Any two different parts with a sound each are welcome.' },
      { from: 8, to: 8, text: 'The green check waits until you have heard both parts since your last change; the guide says what is missing, and nothing counts as a miss.' },
      { from: 9, to: 9, text: 'The song has three cards in a row: tap a card to turn it between the circle part and the square part. A song that comes back plays circle, square, circle.' },
      { from: 9, to: 9, text: 'Tap the circle or square button to choose the part on the grid and change its sounds; the cards show it. Tap play to hear the song, the arrow to undo.' },
      { from: 9, to: 9, text: 'The green check waits until you have heard the song since your last change. If the cards do not read circle, square, circle, it counts one miss and explains; after two, the card to turn glows.' },
      { from: 6, to: 6, text: 'A wrong check names the instrument row and the square to look at. After two wrong checks, a glowing plus or minus marks the square to fix.' },
    ],
    finish: [
      { from: 1, to: 1, text: 'One composition finishes the round when you tap the revealed green check.' },
      { from: 2, to: 2, text: 'The round ends after three visible beats are matched automatically.' },
      { from: 3, to: 3, text: 'The round ends after three heard beats are matched and confirmed with the green check.' },
      { from: 4, to: 4, text: 'The round ends after two repeating patterns are matched automatically.' },
      { from: 5, to: 5, text: 'The round ends after two heard beats are matched and confirmed with the green check.' },
      { from: 6, to: 6, text: 'The round ends after three copies are mended and confirmed with the green check.' },
      { from: 7, to: 7, text: 'The round ends after two clap patterns are matched and confirmed with the green check.' },
      { from: 8, to: 8, text: 'The round ends when you tap the green check on a finished two-part piece.' },
      { from: 9, to: 9, text: 'The round ends when you tap the green check on a song that comes back.' },
    ],
    note: [
      { from: 1, to: 2, text: 'On the woodland stage, the bear moves with the drum and the bunny with the clap. They respond to the sounds in your beat.' },
      { from: 3, to: 3, text: 'On the picnic blanket, the pig moves with the drum and the duck with the clap. They move to your beat and the target.' },
      { from: 4, to: 4, text: 'On the woodland stage, the bear moves with the drum and the bunny with the clap. They respond to the sounds in your beat.' },
      { from: 6, to: 9, text: 'On the woodland stage, the bear moves with the drum and the bunny with the clap. They move to your beat and the model or target.' },
      { from: 5, to: 5, text: 'On the picnic blanket, the pig moves with the drum, the duck with the clap and the dog with the bell. They move to your beat and the target.' },
    ],
  },
  'clap-syllables': {
    goal: 'Hear that words are made of beats.',
    steps: [
      { to: 2, text: 'Tap the big hands once for each beat in the word: "but-ter-fly" is three claps.' },
      { from: 3, to: 3, text: 'Drag each picture to the number of beats in its name.' },
      { from: 4, text: 'Listen to the claps, then tap the picture with that many beats.' },
      { from: 5, text: 'Sort long words into the one-, two-, three- and four-clap bins.' },
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
      { from: 6, to: 6, text: 'One critter is already in the hoop. Drag the other critter that fits the sign into it.' },
      { to: 3, text: 'Drag a critter into the hoop where it fits.' },
      { from: 3, to: 3, text: 'In the overlapping hoops, the middle is for critters that fit both rules.' },
      { from: 4, to: 4, text: 'Look at the sorted pictures, work out the rule, then tap the picture that shows it.' },
      { from: 5, text: 'The red line means not. Drag every critter that is not like the picture into the hoop.' },
    ],
    finish: 'The round ends when every critter has been sorted.',
  },
  'treasure-map': {
    goal: 'Use the grid to find or place things.',
    steps: [
      { to: 1, text: 'Find the picture row and the color column, then tap the square where they meet.' },
      { from: 2, to: 2, text: 'Find the column letter, then the row number (like "B3"), and tap that square.' },
      { from: 3, to: 3, text: 'Drag the thing to the named square, like "a tree at D2".' },
      { from: 4, to: 4, text: 'Follow the directions from the start, like "3 right, then 1 up", and tap the square where you end up.' },
      { from: 5, text: 'Read both landmark clues. Follow each line to the square where they meet, then tap it.' },
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
      { to: 1, text: 'Tap a picture to flip it to its opposite. Big and small friends step, fast and slow friends move, and the balloon rises or sinks.' },
      { from: 2, to: 2, text: 'Tap the one that is named, like "the big one".' },
      { from: 3, to: 3, text: 'Look at the picture, then tap its opposite.' },
      { from: 4, to: 4, text: 'Tap a picture, then tap its opposite, to match all three pairs.' },
    ],
    finish: [
      { to: 1, text: 'Flip eight pictures to finish the round.' },
      { from: 2, to: 2, text: 'Find five named pictures to finish the round.' },
      { from: 3, to: 3, text: 'Find four opposites to finish the round.' },
      { from: 4, to: 4, text: 'Match all three pairs on each of two boards to finish the round.' },
    ],
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
      { from: 7, text: 'Count each kind in the meadow and add tally marks above its face. Four lines and one across make five. Tap the green check, then build the bar graph from the critters and answer how many more.' },
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
    goal: 'Explore tower height and balance by stacking, comparing and predicting.',
    steps: [
      { from: 1, to: 1, text: 'Tap anywhere to stack six blocks, then tap again to knock the tower down.' },
      { from: 2, to: 2, text: 'Tap anywhere to stack until the tower is as tall as the friend, then tap again to knock it down.' },
      { from: 3, to: 4, text: 'Tap the basket for blocks; tap the tower to take the top block off.' },
      { from: 3, to: 3, text: 'Build up to the kite flag: its number and dots show how many blocks. Then ring the bell.' },
      { from: 4, to: 4, text: "Build a tower as tall as Duck's, one block taller or one shorter, as asked, then ring the bell." },
      { from: 5, to: 5, text: 'Tap the tower you think will stand. The ropes let go automatically; watch what happens.' },
      { from: 5, to: 5, text: 'The round arrow watches the same release again. The forward arrow continues to the next observation.' },
      { from: 6, to: 6, text: 'Drag blocks from the tray out past this table edge so one touches the star line without tipping. One task reaches left and one right.' },
      { from: 6, to: 6, text: 'Drag the top block to move it, or drag it back to the tray to take it off.' },
    ],
    finish: [
      { from: 1, to: 1, text: 'The round ends after two towers are knocked down.' },
      { from: 2, to: 2, text: 'The round ends after three friend-height towers are knocked down.' },
      { from: 3, to: 3, text: 'The round ends after three towers reach their flags and are checked with the bell.' },
      { from: 4, to: 4, text: "The round ends after three towers match the requests and are checked with the bell." },
      { from: 5, to: 5, text: 'Press Continue after each observation. The third Continue ends the round, whichever towers you chose.' },
      { from: 6, to: 6, text: 'The round ends after two standing stacks touch their star lines.' },
    ],
    note: [{ from: 5, to: 5, text: 'Either prediction is welcome; choosing the tower that falls counts no miss or hint.' }],
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
      { from: 5, to: 5, text: 'Dance away from the screen while the music plays, and freeze when it stops.' },
      { from: 13, to: 13, text: 'Pat the pet. Each pat makes it do its next move: wave, clap, jump, wiggle, turn around. Do the move together if you like.' },
      { to: 12, text: 'A grown-up taps the arrow to go on.' },
    ],
    finish: [
      { to: 12, text: 'The round ends after the last move.' },
      { from: 13, text: 'The round ends after the fifth move; the pet cheers by itself.' },
    ],
    note: 'This is a body game; the screen is the guide.',
  },
  'owl-walk': {
    goal: 'Bring the owls home across the stepping stones.',
    steps: [
      { to: 1, text: 'Flip a color card, then tap the next stone of that color ahead of the owl. The owl hops there. The matching stones twinkle.' },
      { from: 2, to: 2, text: 'Flip a color card, then tap the next stone of that color for your owl, the purple one. Take turns with the pet, who plays the brown owl. The matching stones twinkle.' },
      { from: 3, to: 3, text: 'Flip a color card, tap the owl you choose, then tap the next stone of that color ahead of it. When no stone of that color is left, tap the nest. Take turns with the pet.' },
      { from: 4, text: 'Flip a color card, tap the owl that hops the farthest with it (the rings show how far), then tap its stone, or the nest when no stone of that color is left.' },
    ],
    finish: 'The round ends when the owls are home.',
  },
  'lemonade-stand': {
    goal: 'Run a lemonade stand for a few days and learn from who comes.',
    steps: [
      { to: 1, text: 'Look at the weather sign, then tap how many cups to make.' },
      { from: 2, to: 2, text: 'Look at the weather sign (a ferry or a quiet day can join it), then tap how many cups to make.' },
      { from: 3, text: 'Look at the weather sign (a ferry or a quiet day can join it), then tap how many cups and a price in shells.' },
      'Tap OPEN and watch the friends buy, then look at the new row of the table. Tap a row to hear it.',
      'The lightbulb asks the pet for help, based on the table so far.',
    ],
    finish: 'The round ends after the last day, when the pet points out one comparison.',
    note: [
      {
        from: 4,
        text: 'Running out or having cups left is never a mistake: spare cups go to a picnic. Asking for help counts once a day. A lemon costs a shell and makes two cups.',
      },
      {
        text: 'Running out or having cups left is never a mistake: spare cups go to a picnic. Asking for help counts once a day.',
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
