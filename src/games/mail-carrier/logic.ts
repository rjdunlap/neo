import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';

/**
 * Mail Carrier, after Paperboy: the pet delivers letters along a little street. A letter
 * shows who it's for (a door color, a number of dots, or a numeral) and the child taps the
 * matching mailbox. A wrong mailbox politely hands the letter back.
 */
export type MailMode = 'drop' | 'color' | 'dots' | 'numeral' | 'count';

export interface MailPlan {
  mode: MailMode;
  houses: number;
  letters: number;
  /** Highest house number. */
  top: number;
  name: string;
}

export const PLANS: MailPlan[] = [
  { mode: 'drop', houses: 4, letters: 6, top: 4, name: 'Tap any mailbox to post a letter' },
  { mode: 'color', houses: 3, letters: 5, top: 3, name: 'Match the letter\'s color to the door' },
  { mode: 'dots', houses: 4, letters: 5, top: 5, name: 'Match dots on the letter to dots and numbers on the mailboxes' },
  { mode: 'numeral', houses: 5, letters: 5, top: 9, name: 'Deliver to the house number on the letter (1 to 9)' },
  { mode: 'count', houses: 5, letters: 5, top: 9, name: 'Count the dots on the letter, then find that house number' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const DOOR_COLORS: ColorName[] = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];

export interface House {
  number: number;
  door: ColorName;
}

/** A street of houses, numbered in order left to right (like a real street), each a different door color. */
export function makeStreet(plan: MailPlan, rng: Rng): House[] {
  const pool = Array.from({ length: plan.top }, (_, i) => i + 1);
  const numbers = rng.shuffle(pool).slice(0, plan.houses).sort((a, b) => a - b);
  const doors = rng.shuffle([...DOOR_COLORS]).slice(0, plan.houses);
  return numbers.map((number, i) => ({ number, door: doors[i] }));
}

/** Which house each letter goes to: every house gets mail, never the same one twice in a row. */
export function makeLetters(plan: MailPlan, street: House[], rng: Rng): number[] {
  const out: number[] = [];
  const order = rng.shuffle(street.map((_, i) => i));
  for (let i = 0; i < plan.letters; i++) {
    let h = order[i % order.length];
    if (h === out[i - 1]) h = (h + 1) % street.length;
    out.push(h);
  }
  return out;
}

/** What the letter shows, and what the mailboxes show, at each level. */
export const letterShows = (mode: MailMode): 'nothing' | 'color' | 'dots' | 'numeral' => (mode === 'drop' ? 'nothing' : mode === 'color' ? 'color' : mode === 'numeral' ? 'numeral' : 'dots');
export const mailboxShows = (mode: MailMode): { numeral: boolean; dots: boolean } => ({ numeral: mode !== 'color' && mode !== 'drop', dots: mode === 'dots' });
