import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Predict and plan where a marble will go: build the ramps so it rings the big bell (or each marble its own bell), or say which bell a finished machine rings.',
  steps: [
    { from: 7, to: 7, text: 'Tap a coloured ramp to flip its direction. The wooden ramp stays fixed.' },
    { from: 7, to: 7, text: 'Tap the green arrow to test the machine. The red trail shows the last run; tap the blue cup to watch it again.' },
    { from: 7, to: 7, text: 'Try another turn, or tap the yellow light bulb to glow a useful ramp to flip.' },
    { from: 8, to: 8, text: 'Look at the finished machine and tap the bell you think the marble will ring.' },
    { from: 8, to: 8, text: 'Tap the green arrow and watch. If another bell rings, a faint red trail shows the way the ramps sent it.' },
    { from: 8, to: 8, text: 'The yellow light bulb glows the start and says to follow the marble down with a finger.' },
    { from: 1, to: 6, text: 'Drag every loose ramp into a round socket.' },
    { from: 1, to: 6, text: 'Tap the green arrow to run the machine and watch what each ramp changes; a faint red trail stays behind, and tapping the blue cup shows the run again.' },
    { from: 1, to: 6, text: 'Move one ramp and run it again, or tap the yellow light bulb for one useful placement.' },
    { from: 9, to: 9, text: 'Drag both loose ramps into round sockets so the red marble reaches the red bell and the blue marble the blue bell.' },
    { from: 9, to: 9, text: 'Tap the green arrow: red runs, then blue. Each leaves a faint trail; tap a cup to watch again.' },
    { from: 9, to: 9, text: 'A ramp in the wrong socket can knock the other marble off course. Move a ramp, or tap the light bulb to glow one for the marble that missed.' },
  ],
  finish: [
    { from: 7, to: 7, text: 'The round ends after both machines ring their bells.' },
    { from: 8, to: 8, text: 'The round ends after three machines have run, whichever bell each one rang.' },
    { from: 1, to: 6, text: 'The round ends after both machines ring their bells.' },
    { from: 9, to: 9, text: 'The round ends after both machines send each marble to its own bell.' },
  ],
  note: [
    { from: 7, to: 7, text: 'Experimental runs are free. Requested help counts as a hint; the ramps stay in their sockets.' },
    { from: 8, to: 8, text: 'A prediction is never a wrong answer, and the light bulb is not counted as help.' },
    {
      from: 6, to: 6,
      text: 'A run that misses is an experiment, not a wrong answer. Loose ramps can be moved back to their tray, and this puzzle has several working designs.',
    },
    { text: 'A run that misses is an experiment, not a wrong answer. Loose ramps can be moved back to their tray.' },
  ],
};
