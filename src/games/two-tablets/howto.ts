import type { GameHowTo } from '../types';

export const HOW_TO: GameHowTo = {
  goal: 'Two tablets carry one message. Work out which sign makes which sound, then read the new line.',
  steps: [
    'Tap a sign on the first tablet to hear it and drop its sound into the key strip.',
    {
      text: 'One sound is missing from the key. Read the new group of signs by choosing the picture it spells.',
      to: 1,
    },
    {
      text: 'Two signs are new. Read the group you can, and it tells you a sound for the next one.',
      from: 2,
    },
    'Choose a picture under each new group, then press Read it.',
  ],
  finish: 'The round ends when every group of new signs has the picture it spells.',
  note: 'A wrong reading wobbles and nothing is lost. After two wrong readings Show me glows: it dims a picture that cannot be it, then points at the sign that gives it away. Scholars learned to read old scripts by lining up one message in more than one script.',
};
