import type { GameHowTo } from '../types';

export const HOW_TO: GameHowTo = {
  goal: 'A scribe left two tablets: a line of pictures with the signs written under each, and a new line of signs nobody has read. Work out which sign makes which sound, then read the new line.',
  steps: [
    'Tap a picture or sign on the first tablet to hear it; a sign you tap drops its sound into the key strip.',
    { text: 'Match each sign to its sound from the first tablet. Then read the new line.', to: 1 },
    { text: 'One sign is new on both lines. Read the line you can, and it tells you the sound.', from: 2 },
    'Tap a picture under each group of new signs to choose it, then press Read it.',
  ],
  finish: 'The round ends when every group of new signs has the picture it spells.',
  note: 'A wrong reading wobbles and the group asks to be looked at again; nothing is lost. After two wrong readings the Show me button glows, and Show me dims a picture that cannot be it, then points at the sign on the first tablet that gives it away. Undo and Restart are always there. With a keyboard, arrow keys move a ring, Enter taps and R reads it. Scholars learned to read old scripts by lining up one message written in more than one script.',
};
