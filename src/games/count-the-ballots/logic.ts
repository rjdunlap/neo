import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Count the Ballots' rules (docs/definitions/count-the-ballots.md). Nine villagers each rank three rides, best first.
 * A deal says how many of the nine hold each of the six possible rankings. Nobody holds five first choices, so the
 * smallest pile is out and its ballots move to their next choice that is still in.
 */
export const LEVELS: BandLevels = { grownup: { min: 1, max: 2 }, school: { min: 1, max: 2 } };

export const VOTERS = 9;
export const MAJORITY = Math.floor(VOTERS / 2) + 1;
export const CANDIDATES = 3;

/** The six rides the seed draws three from. */
export const RIDES = ['wheel', 'carousel', 'boat swing', 'bumper cars', 'slide tower', 'balloon ride'] as const;

/** A ballot: the three candidates, best first. */
export type Ballot = readonly [number, number, number];

/** The six rankings, in a fixed order; a deal is a count for each. */
export const PERMS: readonly Ballot[] = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];
export type Deal = readonly number[];

/** A ballot's pick among the candidates still in: its highest-ranked one not out. */
export const choiceOf = (b: Ballot, out: readonly number[] = []): number => b.find((c) => !out.includes(c)) as number;

/** The ballots a deal holds, in ranking order. */
export const ballotsOf = (deal: Deal): Ballot[] => deal.flatMap((n, i) => Array.from({ length: n }, () => PERMS[i]));

/** First-choice counts of the candidates still in (a candidate that is out holds none). */
export function count(deal: Deal, out: readonly number[] = []): number[] {
  const piles = [0, 0, 0];
  deal.forEach((n, i) => (piles[choiceOf(PERMS[i], out)] += n));
  return piles;
}
const countBallots = (ballots: readonly Ballot[], out: readonly number[]): number[] => {
  const piles = [0, 0, 0];
  for (const b of ballots) piles[choiceOf(b, out)]++;
  return piles;
};

/** Every composition of 9 into six parts: 2,002 deals. */
export const ALL_DEALS: readonly Deal[] = (() => {
  const out: number[][] = [];
  const go = (at: number, left: number, so: number[]) => {
    if (at === 5) return void out.push([...so, left]);
    for (let n = 0; n <= left; n++) go(at + 1, left - n, [...so, n]);
  };
  go(0, VOTERS, []);
  return out;
})();

const argmax = (a: readonly number[]) => a.indexOf(Math.max(...a));
const unique = (a: readonly number[], v: number) => a.filter((x) => x === v).length === 1;

/** The first count, when no one has a majority and both the largest and the smallest pile are alone in their size. */
export function clean(deal: Deal): boolean {
  const c = count(deal);
  return Math.max(...c) < MAJORITY && unique(c, Math.max(...c)) && unique(c, Math.min(...c));
}

/** Most first choices: the first count's largest pile. */
export const plurality = (deal: Deal): number => argmax(count(deal));

export interface Runoff {
  first: number[];
  out: number;
  second: number[];
  winner: number;
}
/** Drop the smallest first-choice pile and count again; with three candidates one elimination reaches a majority. */
export function runoff(deal: Deal): Runoff {
  const first = count(deal);
  const out = first.indexOf(Math.min(...first));
  const second = count(deal, [out]);
  return { first, out, second, winner: argmax(second) };
}

/** Level 1: the run-off and the first count agree. Level 2: they do not. */
export const LEVEL_DEALS: Record<1 | 2, readonly Deal[]> = (() => {
  const clear = ALL_DEALS.filter(clean);
  return {
    1: clear.filter((d) => runoff(d).winner === plurality(d)),
    2: clear.filter((d) => runoff(d).winner !== plurality(d)),
  };
})();

export interface Round {
  level: 1 | 2;
  /** Which ride (index into RIDES) is candidate 0, 1, 2. */
  rides: [number, number, number];
  /** The nine ballots in the order they lie in the hand. */
  hand: Ballot[];
  out: number;
  plurality: number;
  winner: number;
  first: number[];
  second: number[];
}

export const levelOf = (level: number): 1 | 2 => (level >= 2 ? 2 : 1);

/** A seeded round: a deal of the level's class, a ride trio, and the hand's order. */
export function makeRound(level: number, rng: Rng): Round {
  const lv = levelOf(level);
  const deal = rng.pick(LEVEL_DEALS[lv]);
  const rides = rng.shuffle(RIDES.map((_, i) => i)).slice(0, CANDIDATES) as [number, number, number];
  const hand = rng.shuffle(ballotsOf(deal));
  const r = runoff(deal);
  return { level: lv, rides, hand, out: r.out, plurality: plurality(deal), winner: r.winner, first: r.first, second: r.second };
}

/** The pile a ballot belongs in: its first choice before the run-off, its next choice still in after it. */
export const pileFor = (b: Ballot, out: number | null): number => choiceOf(b, out === null ? [] : [out]);

/** The ballots that move at the run-off: those of the eliminated pile, by hand index. */
export const movers = (round: Round): number[] =>
  round.hand.flatMap((b, i) => (choiceOf(b) === round.out ? [i] : []));

/** The first-count pile the plurality question glows after a wrong tap. */
export const questionHint = (round: Round): number => round.plurality;

export const rideName = (round: Round, candidate: number): string => RIDES[round.rides[candidate]];

export function describeLevel(level: number): string {
  return level >= 2
    ? 'Sort the ballots, then say whether the most first choices found the ride most villagers can live with'
    : 'Sort nine ballots by first choice, then move the smallest pile on to its next choice';
}

export { countBallots };
