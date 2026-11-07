import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Put hats on the friends to make a band: each hat plays its own part.',
  steps: [
    { from: 1, to: 3, text: 'Drag a hat onto a friend, or tap the hat and then tap the friend; the part joins at the next beat.' },
    { from: 1, to: 3, text: 'Tap a worn hat to take it off.' },
    { from: 1, to: 1, text: 'Listen to your band play the whole loop, then tap the green check.' },
    { from: 2, to: 2, text: "Swap hats, tap a friend's star to hear just them, hear two different bands, then tap the green check." },
    { from: 3, to: 3, text: "Put a hat on both friends, tap each friend's star to hear them alone, then hear them together and tap the green check." },
    { from: 4, to: 4, text: 'Tap a part, then tap friends to put their hats on or take them off.' },
    { from: 4, to: 4, text: 'Make the song start with the tune alone and end with everybody; the middle is up to you.' },
    { from: 4, to: 4, text: 'Tap Play to hear the whole song, Undo to go back a step, then the green check.' },
  ],
  finish: 'The band plays your tune once more and takes a bow.',
  note: [
    { from: 1, to: 3, text: 'Every hat on every friend sounds good; nothing is a mistake, and nothing is counted.' },
    { from: 2, to: 3, text: 'The tune hats play notes; the drum hats play a beat.' },
    { from: 4, to: 4, text: 'The three hats are a drum, a tune and a low part (bass). There are seven songs that fit; try asking for another way. A check that does not fit counts as a miss; the pet then says what the start or end needs.' },
    { from: 4, to: 4, text: 'This level asks her to shape when parts come in; finishing with the glow is not evidence she arranges on her own.' },
    { text: 'Moving up a level here means she is ready for the next thing to try, not that she can tell parts apart.' },
  ],
};
