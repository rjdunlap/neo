import type { Band } from '../progress/bands';
import { earnsShells, MAX_BALANCE, type ShellsSave } from './shells';

/**
 * The daily gift (the progression loop, chunk 32, docs/definitions/progression-loop.md, slice 8): the first time a grown-up
 * opens Today's six on a day, a few shells arrive by themselves. Nothing to tap or remember, and nothing stacks: a day not
 * opened simply had no gift, and nothing shows it.
 */
export const DAILY_GIFT = 10;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export interface GiftSave {
  /** The last local day (`dayKey`) a gift arrived, or ''. */
  day: string;
}

export const emptyGift = (): GiftSave => ({ day: '' });

export function cleanGift(raw: unknown): GiftSave {
  const day = typeof raw === 'object' && raw !== null ? (raw as { day?: unknown }).day : undefined;
  return { day: typeof day === 'string' && DAY.test(day) ? day : '' };
}

/** Today's gift, once: a band that earns gets `DAILY_GIFT` shells (never past the largest balance); again the same day, nothing. */
export function claimGift(
  gift: GiftSave,
  shells: ShellsSave,
  day: string,
  band: Band,
): { gift: GiftSave; shells: ShellsSave; amount: number } {
  if (!earnsShells(band) || !DAY.test(day) || gift.day === day) return { gift, shells, amount: 0 };
  const amount = Math.min(DAILY_GIFT, MAX_BALANCE - shells.balance);
  return { gift: { day }, shells: { ...shells, balance: shells.balance + amount }, amount };
}
