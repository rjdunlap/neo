import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'See how a light looks brighter when it is nearer.',
  steps: [
    { from: 1, to: 1, text: 'Tap a light; it floats close to the window and glows up, then drifts back.' },
    { from: 2, to: 2, text: 'Drag each light along its path to the window.' },
    { from: 3, to: 3, text: 'Tap the light that looks brighter in the window.' },
    { from: 4, to: 4, text: 'Drag the loose light until both look the same in the window, then press the tick.' },
    { from: 5, to: 5, text: 'Tap the light that is farther away, then watch the curtain lift.' },
    { from: 6, to: 6, text: 'Tap the lights from nearest to farthest, then pull the tassel.' },
    { from: 7, to: 7, text: 'Watch a strong light and a gentle light come to look the same, then tap the farther one.' },
    { from: 8, to: 8, text: 'Press Both could fit, step to the side, then tap the light that moved less.' },
  ],
  finish: [
    { from: 1, to: 1, text: 'Three taps.' },
    { from: 2, to: 2, text: 'Both lights at the window.' },
    { from: 3, to: 3, text: 'Two pairs.' },
    { from: 4, to: 4, text: 'Two lights matched.' },
    { from: 5, to: 5, text: 'Two pairs.' },
    { from: 6, to: 8, text: 'Two boards.' },
  ],
  note: [
    { from: 1, to: 2, text: "Every light here is the same; the halo shows how bright it looks, not how big it is. Nothing here is ever wrong: this is for looking, not a sign of what she knows. A toy model: real stars also differ in their own brightness." },
    { from: 3, to: 4, text: 'Every light here is the same; the halo shows how bright it looks, not how big it is. Moving a light is never wrong; only a tap on the dimmer light, or a tick that does not match, counts. Show a hint counts once per pair or board. A toy model: real stars also differ in their own brightness.' },
    { from: 5, to: 5, text: 'Every light here is the same, so the dimmer one is farther; the curtain hides where they are until she answers. Only a tap on the nearer, brighter light counts. Show a hint counts once per pair. A toy model: real stars also differ in their own brightness.' },
    { from: 6, to: 6, text: 'Each tap gives a light the next mark of one, two or three dots; tapping a marked light takes off its mark and every mark after it. Changing a mark is never wrong; only pulling the tassel with the wrong order counts, and then the marks from the first wrong one come off. Show a hint marks the next light for her and keeps it, counted once per board. A toy model: real stars also differ in their own brightness.' },
    { from: 7, to: 7, text: "Some lights are stronger than others; their rays show only once the curtain lifts. A strong light far away can look just as bright as a gentle light close by, so here the farther light is the strong one. Only a tap on the gentle light counts. Show a hint plays the opening look again, counted once per board. A toy model: real stars also differ in their own brightness." },
    { from: 8, to: 8, text: "Some lights are stronger than others; their rays show only once the curtain lifts. Before the step, picking a light is a guess and never counts; Both could fit is the right answer. A toy: when you step to the side, nearer things seem to shift more against faraway trees. After the step, only a tap on the light that moved more (the nearer one) counts as a miss. Show a hint counts once per board. These rounds are practice, not proof of what she knows. A toy model: real stars also differ in their own brightness." },
  ],
};
