import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Steer a line of ducklings to the duck food (peas, sweetcorn or oats), bite by bite.',
  steps: [
    { to: 7, text: 'Touch the pond and lift to set the line off. It paddles on by itself.' },
    { to: 7, text: 'Swipe the way you want the line to turn; one stroke can turn it twice. A swipe straight back does nothing.' },
    { to: 6, text: 'Only the next bite shows, with a faint look at the one after: eat them in turn. A bump turns the whole line about. Hint shows the way to the next bite; Start over puts the line back at the start.' },
    { from: 7, to: 7, text: 'Three bites show at once: eat them in any order, and the next three appear. The fewest steps need the best order. A bump turns the whole line about; Hint shows the way to a bite that starts a best order; Start over puts the line back at the start.' },
    { from: 8, to: 8, text: 'Nothing moves until you do: each swipe takes one step that way, and touching the pond takes one step straight on. A swipe straight back does nothing.' },
    { from: 8, to: 8, text: 'Only the next bite shows, with a faint look at the one after: eat them in turn. A bump turns the whole line about. Hint shows the way to the next bite; Start over puts the line back at the start.' },
    { from: 9, to: 9, text: 'Touch the pond and lift to set the line off. It paddles on by itself; swipe the way you want it to turn. A swipe straight back does nothing.' },
    { from: 9, to: 9, text: 'The line starts seven ducklings long, so its own tail is in the way: leave room before you double back. Only the next bite shows, with a faint look at the one after. A bump turns the whole line about. Hint shows the way to the next bite; Start over puts the line back at the start.' },
    { from: 10, to: 11, text: 'Swipe the way the ducklings should go, or tap a spot beside the leader. The line takes one step each time and waits for you.' },
    { from: 10, to: 11, text: 'If something is in the way, the line stays put. Try another way. Hint shows dots to the next bite.' },
  ],
  finish: 'The pond is done when the ducklings have gobbled every bite.',
  note: 'A bump counts as a miss and a hint as help. Steps are never timed: the pace stays the same; Step by step has none. At school (about 6 and up): two small step-by-step ponds; a bump leaves the line put.',
};
