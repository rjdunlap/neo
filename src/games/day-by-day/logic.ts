import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export const WEATHER = ['sunny', 'cloudy', 'rainy'] as const;
export const PLANS = [
  { name: 'Place the days and record a pretend week', relatives: false, tally: false },
  { name: 'Tomorrow and yesterday, including the week turning', relatives: true, tally: false },
  { name: 'Yesterday, tomorrow and a sunny-day tally', relatives: true, tally: true },
  { name: 'A day beside any day', relatives: true, tally: false },
  { name: 'Count this weather, including none', relatives: true, tally: true },
  { name: 'Weather Window: compare two supplied weeks', relatives: false, tally: false },
  { name: 'Month wheel: the month before and after, round the year', relatives: false, tally: false },
] as const;

export const LEVELS: BandLevels = {
  preschool: { min: 9, max: 9 },
  prek: { min: 1, max: 4, order: [1, 2, 4] },
  school: { min: 2, max: 10, order: [2, 4, 10, 3, 5, 6, 7] },
};
/** The level whose tomorrow and yesterday questions start from seeded days, not only the week's turn. */
export const ANCHOR_LEVEL = 4;
export const COUNT_LEVEL = 10;
export const WEATHER_COUNT_LEVEL = 5;
/** Only the other-weather level draws a category; old levels keep their RNG stream and sunny tally. */
export const tallyWeather = (level: number, rng: Rng) =>
  level === WEATHER_COUNT_LEVEL ? rng.pick([2, 0, 1]) : 0;
export const weatherCount = (week: readonly number[], weather: number) =>
  week.filter((w) => w === weather).length;
/** Author the requested total first, so absent categories and every total 0–7 are reachable. */
export function makeWeatherWeek(rng: Rng, weather: number): number[] {
  const count = rng.int(0, 7);
  const others = [0, 1, 2].filter((w) => w !== weather);
  return rng.shuffle(Array.from({ length: 7 }, (_, i) => (i < count ? weather : rng.pick(others))));
}
const COUNT_PLAN = { name: 'Count beside the record', relatives: false, tally: true } as const;
/** Preschool's entry: three pictured skies matched with the weather buttons. No weekdays, and not a week. */
export const SKIES_LEVEL = 9;
const SKIES_PLAN = {
  name: 'Three little skies: match three pictured skies',
  relatives: false,
  tally: false,
} as const;
export const planFor = (level: number) =>
  level === COUNT_LEVEL
    ? COUNT_PLAN
    : level === SKIES_LEVEL
      ? SKIES_PLAN
      : PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];
/** How many observations a round records: three little skies, otherwise a pretend week of seven. */
export const recordCount = (level: number) => (level === SKIES_LEVEL ? 3 : 7);
/** One sunny, one cloudy and one rainy sky in a seeded order, so every round shows all three categories. */
export function makeSkies(rng: Rng): number[] {
  return rng.shuffle([0, 1, 2]);
}
/** Supplied bridge evidence: three suns among both other skies, varied by the round seed. */
export function makeCountWeek(rng: Rng): readonly number[] {
  return Object.freeze(rng.shuffle([0, 0, 0, 1, 1, 2, 2]));
}
export const neighbor = (day: number, direction: -1 | 1) => (day + direction + 7) % 7;
export interface Relative {
  today: number;
  direction: -1 | 1;
}
/** Two questions, one forward and one back. Before the anchor level they are the week's turn; there, two different seeded days. */
export function relativeQuestions(level: number, rng: Rng): Relative[] {
  if (level < ANCHOR_LEVEL)
    return [
      { today: 6, direction: 1 },
      { today: 0, direction: -1 },
    ];
  const first = rng.int(0, 6);
  const second = (first + rng.int(1, 6)) % 7;
  return rng.shuffle<Relative>([
    { today: first, direction: 1 },
    { today: second, direction: -1 },
  ]);
}
export const sunnyCount = (week: readonly number[]) => week.filter((w) => w === 0).length;
/** At least one of each weather, and 1–5 sunny records: no missing category or seven identical days. */
export function makeWeek(rng: Rng): number[] {
  return rng.shuffle([0, 1, 2, ...Array.from({ length: 4 }, () => rng.int(0, 2))]);
}
export function choicesFor(answer: number, rng: Rng, kind: 'day' | 'number'): number[] {
  const pool =
    kind === 'day' ? Array.from({ length: 7 }, (_, i) => i) : Array.from({ length: 8 }, (_, i) => i);
  return rng.shuffle([answer, ...rng.shuffle(pool.filter((n) => n !== answer)).slice(0, 2)]);
}
export function toggleMark(marks: readonly number[], day: number, recorded: number): number[] {
  if (!Number.isInteger(day) || day < 0 || day >= recorded) return [...marks];
  return marks.includes(day) ? marks.filter((n) => n !== day) : [...marks, day];
}
export type Summary = 'a-more' | 'b-more' | 'equal' | 'different';
export interface WindowQuestion {
  weather: number;
  choices: readonly Summary[];
}
export interface WindowRound {
  weeks: readonly (readonly number[])[];
  questions: readonly WindowQuestion[];
}
export const summaryTrue = (weeks: WindowRound['weeks'], weather: number, summary: Summary): boolean => {
  const [a, b] = weeks.map((week) => weatherCount(week, weather));
  return summary === 'a-more'
    ? a > b
    : summary === 'b-more'
      ? b > a
      : summary === 'equal'
        ? a === b
        : a !== b;
};
/** All comparisons are about these two finite pretend records. No weather/climate prediction. */
export function makeWindow(rng: Rng): WindowRound {
  // [rain A, rain B, sun A, sun B]. Include the introductory 2-v-4 rain / equal sunshine record.
  const counts = rng.pick([
    [2, 4, 2, 2],
    [2, 4, 3, 1],
    [1, 3, 0, 0],
    [3, 5, 2, 1],
  ]);
  const week = (rain: number, sun: number) =>
    Object.freeze(
      rng.shuffle([
        ...Array<number>(rain).fill(2),
        ...Array<number>(sun).fill(0),
        ...Array<number>(7 - rain - sun).fill(1),
      ]),
    );
  const weeks = [week(counts[0], counts[2]), week(counts[1], counts[3])];
  if (rng.chance(0.5)) weeks.reverse();
  return Object.freeze({
    weeks: Object.freeze(weeks),
    questions: Object.freeze([
      { weather: 2, choices: Object.freeze(rng.shuffle<Summary>(['a-more', 'b-more'])) },
      { weather: 0, choices: Object.freeze(rng.shuffle<Summary>(['equal', 'different'])) },
    ]),
  });
}

/** The month wheel: twelve names in a ring, January after December. No month lengths, dates or holidays. */
export const MONTH_LEVEL = 7;
export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;
export const monthNeighbor = (month: number, direction: -1 | 1) => (month + direction + 12) % 12;
export interface MonthQuestion {
  anchor: number;
  direction: -1 | 1;
  answer: number;
}
const question = (anchor: number, direction: -1 | 1): MonthQuestion => ({
  anchor,
  direction,
  answer: monthNeighbor(anchor, direction),
});
/**
 * Three questions: one across the turn of the year (after December or before January), then one month before and one
 * after, each from a month in the middle of the year. The six months involved are all different, so no name answers
 * twice and no answer is another question's anchor.
 */
export function monthQuestions(rng: Rng): MonthQuestion[] {
  const wrap = rng.chance(0.5) ? question(11, 1) : question(0, -1);
  for (;;) {
    const back = question(rng.int(2, 10), -1);
    const forward = question(rng.int(1, 9), 1);
    const used = new Set([
      wrap.anchor,
      wrap.answer,
      back.anchor,
      back.answer,
      forward.anchor,
      forward.answer,
    ]);
    if (used.size === 6) return [wrap, ...rng.shuffle([back, forward])];
  }
}
/** The month wheel's choices are the whole ring; it never hides a month. */
export const monthCards = () => MONTHS.map((_, i) => i);
