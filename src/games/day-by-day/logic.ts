import type { Rng } from '../../engine/random';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export const WEATHER = ['sunny', 'cloudy', 'rainy'] as const;
export const PLANS = [
  { name: 'Place the days and record a pretend week', relatives: false, tally: false },
  { name: 'Tomorrow and yesterday, including the week turning', relatives: true, tally: false },
  { name: 'Yesterday, tomorrow and a sunny-day tally', relatives: true, tally: true },
  { name: 'A day beside any day', relatives: true, tally: false },
] as const;
/** The level whose tomorrow and yesterday questions start from seeded days, not only the week's turn. */
export const ANCHOR_LEVEL = 4;
export const COUNT_LEVEL = 10;
const COUNT_PLAN = { name: 'Count beside the record', relatives: false, tally: true } as const;
export const planFor = (level: number) => level === COUNT_LEVEL ? COUNT_PLAN : PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];
/** Supplied bridge evidence: three suns among both other skies, varied by the round seed. */
export function makeCountWeek(rng: Rng): readonly number[] {
  return Object.freeze(rng.shuffle([0, 0, 0, 1, 1, 2, 2]));
}
export const neighbor = (day: number, direction: -1 | 1) => (day + direction + 7) % 7;
export interface Relative { today: number; direction: -1 | 1 }
/** Two questions, one forward and one back. Before the anchor level they are the week's turn; there, two different seeded days. */
export function relativeQuestions(level: number, rng: Rng): Relative[] {
  if (level < ANCHOR_LEVEL) return [{ today: 6, direction: 1 }, { today: 0, direction: -1 }];
  const first = rng.int(0, 6);
  const second = (first + rng.int(1, 6)) % 7;
  return rng.shuffle<Relative>([{ today: first, direction: 1 }, { today: second, direction: -1 }]);
}
export const sunnyCount = (week: readonly number[]) => week.filter(w => w === 0).length;
/** At least one of each weather, and 1–5 sunny records: no missing category or seven identical days. */
export function makeWeek(rng: Rng): number[] {
  return rng.shuffle([0, 1, 2, ...Array.from({ length: 4 }, () => rng.int(0, 2))]);
}
export function choicesFor(answer: number, rng: Rng, kind: 'day' | 'number'): number[] {
  const pool = kind === 'day' ? Array.from({ length: 7 }, (_, i) => i) : Array.from({ length: 8 }, (_, i) => i);
  return rng.shuffle([answer, ...rng.shuffle(pool.filter(n => n !== answer)).slice(0, 2)]);
}
export function toggleMark(marks: readonly number[], day: number, recorded: number): number[] {
  if (!Number.isInteger(day) || day < 0 || day >= recorded) return [...marks];
  return marks.includes(day) ? marks.filter(n => n !== day) : [...marks, day];
}
/** Logical coordinates. Seven 108×112 records and three 170×110 choices never shrink. */
export function weekLayout(w: number, h: number) {
  return {
    records: Array.from({ length: 7 }, (_, i) => ({ x: w / 2 + (i - 3) * 118, y: 280 })),
    choices: Array.from({ length: 3 }, (_, i) => ({ x: w / 2 + (i - 1) * 190, y: 470 })),
    confirm: { x: w / 2 + 365, y: 470 },
    garden: { x: w / 2, y: h - 105 },
  };
}
