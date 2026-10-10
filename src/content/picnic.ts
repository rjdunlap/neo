import type { Rng } from '../engine/random';
import { playBand, type Band } from '../progress/bands';
import type { PicnicStep } from './world';
import type { LineId } from './voice-script';

/**
 * The Windy Picnic, the first Island Errands story (a pilot). The wind has blown Juniper the gardener's
 * picnic into a muddle, and three requests put it right, in any order:
 *
 * - **blanket**, played in the picnic scene: find Juniper's striped blanket where the wind dropped it.
 * - **sandwiches**, a Pet Kitchen round: share the sandwiches fairly.
 * - **invitation**, a Jelly Drums round: play the invitation song so the friends come.
 *
 * Finishing a game round completes its step, whatever the misses and hints, so help reaches the same ending.
 * The round's result carries only misses and hints, so the picnic shows a fixed picture of each step
 * (four shared plates, three friends, Juniper's tune) rather than what the child actually made.
 */
export interface GameStep {
  id: Exclude<PicnicStep, 'blanket'>;
  game: string;
  /** The level to play for the child's band; the round doesn't move the game's own saved level. */
  level: Record<Band, number>;
}

export const GAME_STEPS: GameStep[] = [
  // Pet Kitchen 1: halves for two friends; 3: two halves each; 4: two sandwiches for four, halves or quarters.
  { id: 'sandwiches', game: 'pet-kitchen', level: { lap: 1, toddler: 1, preschool: 1, prek: 3, school: 4 } },
  // Jelly Drums 1: free play; 4: copy two-note tunes; 5: three notes; 7: four notes.
  { id: 'invitation', game: 'jelly-drums', level: { lap: 1, toddler: 1, preschool: 4, prek: 5, school: 7 } },
];

export const stepLine: Record<PicnicStep, { ask: LineId; done: LineId; recap: LineId }> = {
  blanket: { ask: 'picnic.blanket', done: 'picnic.blanket-done', recap: 'picnic.blanket-recap' },
  sandwiches: { ask: 'picnic.sandwiches', done: 'picnic.sandwiches-done', recap: 'picnic.sandwiches-recap' },
  invitation: { ask: 'picnic.invitation', done: 'picnic.invitation-done', recap: 'picnic.invitation-recap' },
};

/** The band to play a story's game in: the child's own if the game has it, otherwise its nearest (`playBand`). */
export const bandForGame = playBand;

// The blanket -----------------------------------------------------------------------------------

export const PATTERNS = ['stripes', 'spots', 'checks'] as const;
export type Pattern = (typeof PATTERNS)[number];
/** Where the wind dropped each blanket. Each place has room for two. */
export const HANGS = ['tree', 'line', 'bush'] as const;
export type Hang = (typeof HANGS)[number];
/** Spoken: "in the tree", "on the clothesline", "on the bush". */
export const HANG_WORDS: Record<Hang, string> = { tree: 'in the tree', line: 'on the clothesline', bush: 'on the bush' };

export interface Blanket {
  pattern: Pattern;
  hang: Hang;
  slot: 0 | 1;
}

export interface BlanketPuzzle {
  blankets: Blanket[];
  /** Juniper's blanket, which always has stripes. */
  target: number;
  /** At early school the clue also says where it landed, and another striped blanket blew somewhere else. */
  withPlace: boolean;
}

/**
 * Two blankets for the youngest, three with different patterns from preschool, and at early school two
 * striped blankets in different places, so the pattern and the place are both needed.
 */
export function blanketPuzzle(band: Band, rng: Rng): BlanketPuzzle {
  if (band === 'school') {
    const [home, away] = rng.shuffle([...HANGS]);
    const slot = rng.int(0, 1) as 0 | 1;
    const blankets: Blanket[] = rng.shuffle([
      { pattern: 'stripes', hang: home, slot },
      { pattern: rng.pick(['spots', 'checks'] as const), hang: home, slot: (1 - slot) as 0 | 1 },
      { pattern: 'stripes', hang: away, slot: rng.int(0, 1) as 0 | 1 },
    ]);
    return { blankets, target: blankets.findIndex((b) => b.pattern === 'stripes' && b.hang === home), withPlace: true };
  }
  const count = band === 'lap' || band === 'toddler' ? 2 : 3;
  const patterns: Pattern[] = ['stripes', ...rng.shuffle(['spots', 'checks'] as Pattern[]).slice(0, count - 1)];
  const hangs = rng.shuffle([...HANGS]);
  const blankets = rng.shuffle(patterns.map((pattern, i): Blanket => ({ pattern, hang: hangs[i], slot: rng.int(0, 1) as 0 | 1 })));
  return { blankets, target: blankets.findIndex((b) => b.pattern === 'stripes'), withPlace: false };
}

/** Why a blanket isn't Juniper's: it has another pattern, or (with the place clue) it is striped but elsewhere. */
export function whyNot(p: BlanketPuzzle, i: number): 'pattern' | 'place' | null {
  if (i === p.target) return null;
  return p.blankets[i].pattern !== 'stripes' ? 'pattern' : 'place';
}
