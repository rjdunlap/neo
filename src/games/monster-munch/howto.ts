import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Feed the monster the right number of cookies, carrots, berries and more.',
  steps: [
    { from: 9, to: 9, text: 'Tap a big cookie, or the monster, to feed it; its belly grows and it counts each bite aloud.' },
    { from: 1, to: 1, text: 'Tap a cookie, or the monster, to feed it; it counts each bite aloud.' },
    { from: 2, to: 2, text: 'Drag a cookie to the monster, or tap it; it counts each bite aloud.' },
    { from: 3, to: 3, text: 'Give each monster one cookie.' },
    { from: 10, to: 10, text: 'Give each monster a cookie and an apple; a second of the same food is handed back.' },
    { from: 4, to: 5, text: 'Feed the monster the number of foods asked for (cookies, apples, carrots, berries or crackers); it counts each one aloud. Ring the bell when done.' },
    { from: 6, to: 6, text: 'Feed the two foods asked for, like "2 carrots and 1 apple"; it counts each kind aloud. Then ring the bell.' },
    { from: 7, to: 7, text: 'Move every food from the tray to the monsters; when the tray is empty they check it is fair. Then tap how many each monster got.' },
    { from: 12, to: 12, text: 'Share every cookie and apple fairly. When the tray is empty, tap how many cookies each monster got, then how many apples each got.' },
    { from: 11, to: 11, text: 'The sign shows 2 or 3 cookies each. Tap the cave to call friends and feed each a whole share. Ring when another friend cannot have a whole share; tap how many friends ate, then how many cookies remain (zero is possible).' },
    { from: 8, to: 8, text: 'Share the food fairly; some may be left over. Ring the bell, then tap how many each monster got and how many are left over.' },
  ],
  finish: [
    { to: 6, text: 'The round ends when the monster has the right amount.' },
    { from: 9, to: 10, text: 'The round ends when every monster has been fed.' },
    { from: 11, to: 12, text: 'The round ends when the sharing is fair and both counting questions are answered.' },
    { from: 7, to: 8, text: 'The round ends when the sharing is fair and the counting questions are answered.' },
  ],
};
