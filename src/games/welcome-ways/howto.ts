import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Build one entrance that every pictured visitor can use.',
  steps: [
    {to:1,text:'Put the ramp in the gap. Tap Try and watch Roly roll in.'},
    {from:2,to:2,text:'Put a step or a ramp in the gap. Tap Try to see whether Roly can roll in.'},
    {from:3,to:3,text:'Bunny hops; Roly rolls. Build one entrance for both. Tap Try, then change any part that stops a friend.'},
    {from:4,to:4,text:'Fill both gaps and choose a door. Roly needs ramps; Bear needs a wide door. Tap Try and invite both friends.'},
    {from:5,to:5,text:'The path turns at the pond. Fill both ramp gaps and choose a landing for the corner. Bear is big and needs the big landing to turn. Tap Try.'},
    {from:6,to:6,text:'Roly needs ramps. Two ramps in a row need a rail for Teeter, and Duck needs a perch. Put a rail on one side and a perch on the other, then tap Try.'},
    {from:7,text:'Teeter and Duck can already come in. Change the entrance so Roly can come in too, keeping any part that still works. Tap Try after each change.'},
    'Drag a part, or tap a part then a gap. Tap an installed part to select it, then Out to remove it. Undo restores the last edit.',
    'Show me outlines a useful part and its destination; you still place it.',
  ],
  finish: 'One successful Try brings everyone inside and ends the round.',
  note: 'Trying, changing parts and replaying a visitor’s need are free observations. Help counts once per distinct repair.',
};
