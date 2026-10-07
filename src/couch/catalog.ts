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
    ],
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
      { parts: STICK, text: 'Hold left or right to set the spring’s power.', keys: 'Left / right arrows' },
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
};

/** The line to speak for `line` in couch play: a controller version when the original talks about touch. */
export const couchLine = (id: CouchId, line: LineId): LineId => COUCH_INFO[id].lines?.[line] ?? line;
