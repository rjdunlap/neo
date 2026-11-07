import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Bounce the ball back and forth with the pet, then aim it.',
  steps: [
    { to: 1, text: 'Slide the huge paddle on the right toward the ball; it also drifts to help when nobody is touching it.' },
    { from: 2, to: 2, text: 'Slide the paddle on the right under the ball.' },
    { from: 3, to: 3, text: 'Slide the right paddle under the ball. A grown-up can slide the left one.' },
    { from: 4, to: 4, text: 'Slide the paddle so the ball goes through the star: meet it with the end of the paddle to send it sideways.' },
    { from: 5, to: 5, text: 'Slide the paddle under the ball and count each bounce out loud together.' },
    { from: 6, to: 6, text: 'Listen for the color the pet calls, then meet the ball with the paddle\'s end to send it to that color on the wall.' },
    { from: 7, to: 8, text: 'Send the ball past the pet\'s paddle into the goal: meet it with the end of the paddle to aim it away from the pet.' },
    { from: 8, to: 8, text: 'The ball gets faster with every bounce in a rally.' },
    { from: 9, to: 9, text: 'The pet calls three colors in order, and the dots on top show them. Send the ball to each color in turn.' },
    { from: 10, to: 10, text: 'Slide the paddle under the ball and count by twos out loud with the pet: 2, 4, 6.' },
    { from: 11, text: 'Slide the paddle under the ball and count by fives out loud with the pet: 5, 10, 15.' },
  ],
  finish: [
    { from: 1, to: 3, text: 'The round ends when the bounces reach the goal; the pet\'s bounces count too.' },
    { from: 4, to: 4, text: 'The round ends when the ball has gone through five stars.' },
    { from: 5, to: 5, text: 'The round ends at ten bounces in a row; the pet\'s bounces count too.' },
    { from: 6, to: 6, text: 'The round ends when the ball has gone to the called color four times. Another color is just a new try.' },
    { from: 7, to: 7, text: 'The round ends when someone scores five goals. Win or lose, it is a good game.' },
    { from: 8, to: 8, text: 'The round ends when someone scores seven goals. Win or lose, it is a good game.' },
    { from: 9, to: 9, text: 'The round ends after two calls of three colors. Another color is just a new try at the same one.' },
    { from: 10, to: 10, text: 'The round ends at 20, after ten bounces; the pet\'s bounces count too.' },
    { from: 11, text: 'The round ends at 50, after ten bounces; the pet\'s bounces count too.' },
  ],
  note: [
    { to: 5, text: 'The pet takes the left paddle if no grown-up joins.' },
    { from: 6, text: 'The pet is not a rival to beat: its paddle is slow, a good shot always gets by it, and a loss still finishes with a sticker.' },
  ],
};
