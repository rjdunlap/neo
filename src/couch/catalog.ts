import type { LineId } from '../content/voice-script';
import type { Band } from '../progress/bands';
import type { CouchId } from './party';

/** Controller parts, named by position: Nintendo's printed letters differ from the browser's standard layout. */
export type PadPart = 'stick' | 'dpad' | 'bottom' | 'left' | 'start';

export interface ControlRow {
  parts: PadPart[];
  text: string;
  /** The keyboard equivalent, for playing without a controller. */
  keys: string;
}

/** How two players compete on a stop: each on their own board, on one shared board, or as a team. */
export type FaceOff = 'twin' | 'shared' | 'team';

export interface CouchInfo {
  /** Spoken (and shown) on the "how to play" screen. One variant, so the text matches the speech. */
  goal: LineId;
  /** A few words for the chooser card. */
  tagline: string;
  controls: ControlRow[];
  /** The pause menu's "start this part again" button, for a game that implements `Game.restart`. */
  restart?: string;
  /** The pause menu's "show a hint" button, for a game that implements `Game.askForHint`: help she asks for, rather than help that arrives after misses. */
  hint?: string;
  /** Who plays: one at a time, or both at once. */
  play: 'turns' | 'together';
  faceoff: FaceOff;
  /** For face-off stops that compare scores: which way wins, and what the number counts. */
  score?: { better: 'lower' | 'higher'; unit: string };
  /** The band the game is created in, and the level the "watch me" demo plays. */
  band: Band;
  demoLevel: number;
  /** The level each of the trip's six stops plays (0-based). Must stay inside the game's range for `band`. */
  level(stop: number): number;
  /** Spoken lines that mention touch, mapped to their controller versions. */
  lines?: Partial<Record<LineId, LineId>>;
}

const STICK: PadPart[] = ['stick', 'dpad'];

/** Everything the couch screens need to explain a game. Games themselves stay unaware of it. */
export const COUCH_INFO: Record<CouchId, CouchInfo> = {
  'penguin-slide': {
    goal: 'couch.how.penguin-slide',
    tagline: 'Plan your slides. Collect both fish on each of two ice puzzles.',
    controls: [
      { parts: STICK, text: 'Slide the penguin. It keeps going until it bumps into something.', keys: 'Arrow keys' },
      { parts: ['left'], text: 'Undo the last slide.', keys: 'Backspace' },
      { parts: ['start'], text: 'Pause menu: start the pond again. Slides so far still count.', keys: 'Esc' },
    ],
    restart: 'Start this pond again',
    play: 'turns',
    faceoff: 'twin',
    score: { better: 'lower', unit: 'slides over the best route' },
    band: 'school',
    demoLevel: 2,
    level: (stop) => (stop < 3 ? 4 : 5),
    lines: { 'slide.go': 'couch.slide.go', 'slide.stuck': 'couch.slide.stuck' },
  },
  'bouncy-launch': {
    goal: 'couch.how.bouncy-launch',
    tagline: 'Aim the spring. Land on three star clouds.',
    controls: [
      { parts: STICK, text: 'Push down (or right) to squash the spring for more power; up (or left) for less.', keys: 'Down / right arrows: more · up / left: less' },
      { parts: ['bottom'], text: 'Press to launch.', keys: 'Enter' },
    ],
    play: 'turns',
    faceoff: 'twin',
    score: { better: 'lower', unit: 'off the cloud centres' },
    band: 'prek',
    demoLevel: 3,
    level: () => 3,
    lines: { 'launch.short': 'couch.launch.short', 'launch.long': 'couch.launch.long' },
  },
  'bounce-back': {
    goal: 'couch.how.bounce-back',
    tagline: 'Keep the ball going together. Reach a rally of eight.',
    controls: [
      { parts: STICK, text: 'Move your paddle up and down. Player 2 uses the second controller.', keys: '↑ ↓ (Player 2: W / S)' },
    ],
    play: 'together',
    faceoff: 'team',
    // Preschool's range (2–4) holds both the demo's five-bounce rally and the trip's level 3.
    band: 'preschool',
    demoLevel: 2,
    level: () => 3,
  },
  'memory-match': {
    goal: 'couch.how.memory-match',
    tagline: 'Turn over cards and remember where the pairs hide.',
    controls: [
      { parts: STICK, text: 'Move the highlight from card to card.', keys: 'Arrow keys' },
      { parts: ['bottom'], text: 'Turn the highlighted card over.', keys: 'Enter' },
    ],
    play: 'turns',
    faceoff: 'shared',
    score: { better: 'higher', unit: 'pairs' },
    band: 'preschool',
    demoLevel: 2,
    level: (stop) => (stop < 3 ? 4 : 5),
  },
  'rhythm-neighbors': {
    goal: 'couch.how.rhythm-neighbors',
    tagline: 'Answer the bird with the frogs, long and short, on the beat.',
    controls: [
      { parts: STICK, text: 'Play the left or right frog.', keys: 'Left / right arrows' },
      { parts: ['bottom'], text: 'Send your answer.', keys: 'Enter' },
      { parts: ['left'], text: 'Hear the bird’s call again.', keys: 'Backspace' },
    ],
    play: 'together',
    faceoff: 'team',
    band: 'school',
    demoLevel: 5,
    level: (stop) => (stop < 3 ? 5 : 6),
    lines: { 'neighbors.rhythm': 'couch.neighbors.rhythm' },
  },
  'light-lab': {
    goal: 'couch.how.light-lab',
    tagline: 'Turn the mirrors to carry the sunbeam to every flower.',
    controls: [
      { parts: STICK, text: 'Move the highlight to a mirror, or the sun.', keys: 'Arrow keys' },
      { parts: ['bottom'], text: 'Turn the mirror. On the sun, shine the light.', keys: 'Enter' },
      { parts: ['left'], text: 'Shine the light from anywhere.', keys: 'Backspace' },
    ],
    play: 'turns',
    faceoff: 'twin',
    score: { better: 'lower', unit: 'extra turns and tries' },
    band: 'school',
    demoLevel: 4,
    level: (stop) => (stop < 2 ? 4 : stop < 4 ? 5 : 6),
    lines: { 'light.two': 'couch.light.two' },
  },
  'secret-code': {
    goal: 'couch.how.secret-code',
    tagline: 'Crack the hidden row of stones from the green, yellow and gray clues.',
    controls: [
      { parts: STICK, text: 'Choose a stone.', keys: 'Left / right arrows' },
      { parts: ['bottom'], text: 'Place it. When every slot is full, press again to turn the key.', keys: 'Enter' },
      { parts: ['left'], text: 'Take the last stone back.', keys: 'Backspace' },
    ],
    play: 'turns',
    faceoff: 'twin',
    score: { better: 'lower', unit: 'guesses' },
    band: 'school',
    demoLevel: 3,
    level: (stop) => (stop < 2 ? 4 : stop < 4 ? 5 : 6),
  },
  'peg-garden': {
    goal: 'couch.how.peg-garden',
    tagline: 'Swing the launcher and drop pearls onto the numbered flowers.',
    controls: [
      { parts: STICK, text: 'Hold left or right to swing the launcher.', keys: 'Left / right arrows' },
      { parts: ['bottom'], text: 'Let the pearl go.', keys: 'Enter' },
    ],
    play: 'turns',
    faceoff: 'twin',
    score: { better: 'lower', unit: 'shots' },
    band: 'prek',
    demoLevel: 4,
    level: (stop) => (stop < 3 ? 4 : 5),
    lines: { 'peg.number': 'couch.peg.number', 'peg.order': 'couch.peg.order' },
  },
  'bumper-garden': {
    goal: 'couch.how.bumper-garden',
    tagline: 'Flip the ladybug back up together, one flipper each.',
    controls: [
      { parts: STICK, text: 'Flip the left or right flipper. With two controllers, Player 1 has the left one and Player 2 the right.', keys: 'Left / right arrows' },
    ],
    play: 'together',
    faceoff: 'team',
    band: 'prek',
    demoLevel: 3,
    level: (stop) => (stop < 3 ? 3 : 4),
  },
  'pattern-train': {
    goal: 'couch.how.pattern-train',
    tagline: 'Look at the train, then choose what comes next.',
    controls: [
      { parts: STICK, text: 'Move the highlight to the picture that fits the glowing car.', keys: 'Left / right arrows' },
      { parts: ['bottom'], text: 'Choose it.', keys: 'Enter' },
    ],
    play: 'together',
    faceoff: 'team',
    // Pre-K's range (3–9) holds the shape and animal patterns used here; its bell levels (7 and 8) need listening and a confirm button.
    band: 'prek',
    demoLevel: 6,
    level: (stop) => (stop < 2 ? 4 : stop < 4 ? 6 : 9),
  },
  'egg-catch': {
    goal: 'couch.how.egg-catch',
    tagline: 'Slide the basket under the falling eggs.',
    controls: [
      { parts: STICK, text: 'Slide the basket left and right. With two controllers, you both steer the same basket.', keys: 'Left / right arrows' },
    ],
    // With two controllers both steer one basket. A face-off on separate boards would mostly tie, so this is a team game.
    play: 'together',
    faceoff: 'team',
    // Preschool's range (2–4) holds the two catching levels; the chute levels above them are touch puzzles.
    band: 'preschool',
    demoLevel: 2,
    level: (stop) => (stop < 3 ? 2 : 3),
    lines: { 'egg.catch': 'couch.egg.catch' },
  },
  'robot-path': {
    goal: 'couch.how.robot-path',
    tagline: 'Plan the robot’s steps to the star, then press play.',
    controls: [
      { parts: STICK, text: 'Add a step for the robot: up, down, left or right.', keys: 'Arrow keys' },
      { parts: ['bottom'], text: 'Play the whole path.', keys: 'Enter' },
      { parts: ['left'], text: 'Take the last step back out.', keys: 'Backspace' },
    ],
    // Its boards are authored per level, not drawn from the seed, so a second player would face a path they had watched: a team game.
    play: 'together',
    faceoff: 'team',
    band: 'school',
    demoLevel: 4,
    level: (stop) => (stop < 2 ? 4 : stop < 4 ? 5 : 6),
    lines: { 'robot.start': 'couch.robot.start' },
  },
  'frog-hop': {
    goal: 'couch.how.frog-hop',
    tagline: 'Hop along the lily pads to where the frog will land.',
    controls: [
      { parts: STICK, text: 'Move the highlight along the lily pads, or the number cards.', keys: 'Left / right arrows' },
      { parts: ['bottom'], text: 'Choose it.', keys: 'Enter' },
    ],
    play: 'together',
    faceoff: 'team',
    band: 'school',
    demoLevel: 3,
    level: (stop) => [3, 3, 4, 5, 6, 6][stop] ?? 6,
    lines: { 'hop.gap': 'couch.hop.gap' },
  },
  'sink-float': {
    goal: 'couch.how.sink-float',
    tagline: 'Will it float or sink? Guess, then watch the water.',
    controls: [
      { parts: STICK, text: 'Choose float on the left or sink on the right.', keys: 'Left / right arrows' },
      { parts: ['bottom'], text: 'Make your guess.', keys: 'Enter' },
    ],
    play: 'together',
    faceoff: 'team',
    // Early school's range (5–6) has one guessing level, with surprises; the sorting level is a drag.
    band: 'school',
    demoLevel: 6,
    level: () => 6,
    lines: { 'sink.guess': 'couch.sink.guess' },
  },
  'sudoku-garden': {
    goal: 'couch.how.sudoku-garden',
    tagline: 'Fill the bed so every row, column and box holds each number once.',
    controls: [
      { parts: STICK, text: 'Move around the bed. In the number tray, choose a number.', keys: 'Arrow keys' },
      { parts: ['bottom'], text: 'On a square, open the number tray. In the tray, place the number or switch pencil marks on and off.', keys: 'Enter' },
      { parts: ['left'], text: 'Close the tray, or take a number (or its pencil marks) back out. Free.', keys: 'Backspace' },
      { parts: ['start'], text: 'Pause menu: show a hint, or start the bed again. A hint marks the run as helped.', keys: 'Esc' },
    ],
    restart: 'Start this bed again',
    hint: 'Show a hint',
    play: 'turns',
    faceoff: 'twin',
    score: { better: 'lower', unit: 'entries over the empty squares' },
    band: 'school',
    demoLevel: 1,
    // Trips stay on the small beds; the 9 by 9 beds are the Three Big Beds course on the puzzle shelf.
    level: (stop) => [1, 1, 2, 2, 3, 3][stop] ?? 3,
  },
  'lantern-lights': {
    goal: 'couch.how.lantern-lights',
    tagline: 'Press a lantern to flip it and its neighbours. Light every lantern on the pond.',
    controls: [
      { parts: STICK, text: 'Move from lantern to lantern. The glow shows what a press would flip.', keys: 'Arrow keys' },
      { parts: ['bottom'], text: 'Press the lantern: it and the four beside it flip.', keys: 'Enter' },
      { parts: ['left'], text: 'Take the last press back. It still counts.', keys: 'Backspace' },
      { parts: ['start'], text: 'Pause menu: show a hint, or put the pond back as it began. A hint marks the run as helped.', keys: 'Esc' },
    ],
    restart: 'Start this pond again',
    hint: 'Show a hint',
    play: 'turns',
    faceoff: 'twin',
    score: { better: 'lower', unit: 'presses over the fewest' },
    band: 'school',
    demoLevel: 2,
    // Trips climb from the small ponds to a 5 by 5 that takes a short way to light; the hardest ponds are on the puzzle shelf.
    level: (stop) => [1, 2, 3, 3, 4, 5][stop] ?? 5,
  },
  'word-search': {
    goal: 'couch.how.word-search',
    tagline: 'Find the hidden words in a grid of letters.',
    controls: [
      { parts: STICK, text: 'Move around the grid.', keys: 'Arrow keys' },
      { parts: ['bottom'], text: 'Mark a word\'s first letter; move to its last letter and press again to check it.', keys: 'Enter' },
      { parts: ['left'], text: 'Let go of the line you are marking.', keys: 'Backspace' },
      { parts: ['start'], text: 'Pause menu: a hint, or search the grid again.', keys: 'Esc' },
    ],
    restart: 'Search this grid again',
    hint: 'Show a hint',
    play: 'turns',
    faceoff: 'twin',
    score: { better: 'lower', unit: 'guesses over the words' },
    band: 'school',
    demoLevel: 1,
    // Trips stay on the 8 by 8 to 12 by 12 grids; the 14 by 14 grids are The Big Hunt course on the puzzle shelf.
    level: (stop) => [1, 2, 2, 3, 3, 3][stop] ?? 3,
  },
  'ferry-jam': {
    goal: 'couch.how.ferry-jam',
    tagline: 'Slide the boats aside so the red ferry can sail out to the dock.',
    controls: [
      { parts: STICK, text: 'Move between boats. With one picked up, slide it along its lane.', keys: 'Arrow keys' },
      { parts: ['bottom'], text: 'Pick up the highlighted boat; press again to set it down.', keys: 'Enter' },
      { parts: ['left'], text: 'Put a held boat back, or take the last slide back. It still counts.', keys: 'Backspace' },
      { parts: ['start'], text: 'Pause menu: a hint, or the harbor again.', keys: 'Esc' },
    ],
    restart: 'Start this harbor again',
    hint: 'Show a hint',
    play: 'turns',
    faceoff: 'twin',
    score: { better: 'lower', unit: 'slides over the fewest' },
    // Early school's range (3 to 6) is the 5 by 5 and 6 by 6 harbors; trips climb through it.
    band: 'school',
    demoLevel: 3,
    level: (stop) => [3, 4, 4, 5, 5, 6][stop] ?? 6,
    lines: { 'ferry.start': 'couch.ferry.start' },
  },
  'picture-logic': {
    goal: 'couch.how.picture-logic',
    tagline: 'Fill the squares the numbers allow, and a picture appears.',
    controls: [
      { parts: STICK, text: 'Move around the grid.', keys: 'Arrow keys' },
      { parts: ['bottom'], text: 'Fill a square. Hold it and move to paint a run.', keys: 'Enter (hold)' },
      { parts: ['left'], text: 'Cross a square out. Hold it to cross a run. Free.', keys: 'Backspace (hold)' },
      { parts: ['start'], text: 'Pause menu: a hint, or empty the picture.', keys: 'Esc' },
    ],
    restart: 'Empty this picture',
    hint: 'Show a hint',
    play: 'turns',
    faceoff: 'twin',
    score: { better: 'lower', unit: 'fills over the picture' },
    band: 'school',
    demoLevel: 1,
    // Trips stay on the 6 by 6 and 10 by 10 pictures; the 15 by 15 pictures are The Big Pictures course on the puzzle shelf.
    level: (stop) => [1, 2, 2, 3, 3, 3][stop] ?? 3,
  },
};

/** The line to speak for `line` in couch play: a controller version when the original talks about touch. */
export const couchLine = (id: CouchId, line: LineId): LineId => COUCH_INFO[id].lines?.[line] ?? line;
