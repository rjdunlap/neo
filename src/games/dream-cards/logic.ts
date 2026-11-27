import type { BandLevels } from '../../progress/difficulty';
import type { Rng } from '../../engine/random';

/**
 * Dream Cards, level 1 (docs/definitions/dream-cards.md): three dream pictures and three pictured clues. One of two
 * people picks a picture and gives one clue about it; the other points to the picture the clue makes them think of;
 * the picked picture turns over. Nothing about the choice is wrong, so the round never counts a miss: the fit table only
 * guides what the pet says and which deals are dealt.
 */
export const LEVELS: BandLevels = { school: { min: 1, max: 1 } };
export const describeLevel = (_level: number) => 'Dream clues: give one clue and read another’s';

export const PICTURES = [
  'moon swing',
  'cloud stairs',
  'sky whale',
  'umbrella forest',
  'teacup house',
  'lantern boat',
] as const;
export const CLUES = ['quiet', 'high up', 'cozy', 'floating', 'glowing', 'tiny'] as const;
export type PictureId = number;
export type ClueId = number;

/** Which clues each picture invites (indices into CLUES): a suggestion of what to say, never a scoring key. */
export const FITS: readonly (readonly ClueId[])[] = [
  [0, 1, 4], // moon swing: quiet, high up, glowing
  [1, 3, 0], // cloud stairs: high up, floating, quiet
  [3, 2, 1], // sky whale: floating, cozy, high up
  [2, 5, 0], // umbrella forest: cozy, tiny, quiet
  [2, 5, 4], // teacup house: cozy, tiny, glowing
  [3, 4, 5], // lantern boat: floating, glowing, tiny
];

export const fits = (picture: PictureId, clue: ClueId) => FITS[picture].includes(clue);

export interface Deal {
  /** Three distinct pictures, left to right. */
  pictures: readonly [PictureId, PictureId, PictureId];
  /** Three distinct clues, left to right. */
  clues: readonly [ClueId, ClueId, ClueId];
}
export interface Pair {
  picture: PictureId;
  clue: ClueId;
}

/** A deal is valid when every dealt clue fits at least two dealt pictures and every dealt picture fits a dealt clue. */
export function validDeal(d: Deal): boolean {
  const clueOk = d.clues.every((c) => d.pictures.filter((p) => fits(p, c)).length >= 2);
  const picOk = d.pictures.every((p) => d.clues.some((c) => fits(p, c)));
  return clueOk && picOk;
}

/** The (picture, clue) pairs of a deal that fit: what the pet may say, and what a hint may point to. */
export function fittingPairs(d: Deal): Pair[] {
  const out: Pair[] = [];
  for (const picture of d.pictures)
    for (const clue of d.clues) if (fits(picture, clue)) out.push({ picture, clue });
  return out;
}

const triples = (): [number, number, number][] => {
  const out: [number, number, number][] = [];
  for (let a = 0; a < 6; a++)
    for (let b = a + 1; b < 6; b++) for (let c = b + 1; c < 6; c++) out.push([a, b, c]);
  return out;
};

/** All valid deals, as sets (sorted ids), in a fixed order: 28 of the 400. */
export const VALID_DEALS: readonly Deal[] = (() => {
  const out: Deal[] = [];
  for (const pictures of triples())
    for (const clues of triples()) if (validDeal({ pictures, clues })) out.push({ pictures, clues });
  return out;
})();

/** A seeded valid deal with its pictures and its clues in a seeded left-to-right order. */
export function dealRound(rng: Rng): Deal {
  const base = rng.pick(VALID_DEALS);
  const [p0, p1, p2] = rng.shuffle([...base.pictures]);
  const [c0, c1, c2] = rng.shuffle([...base.clues]);
  return { pictures: [p0, p1, p2], clues: [c0, c1, c2] };
}

/** The pet as giver: one fitting pair, rotating through the deal's pairs with the seed so it is not always the same picture. */
export function petPick(deal: Deal, seed: number): Pair {
  const pairs = fittingPairs(deal);
  return pairs[Math.abs(Math.trunc(seed)) % pairs.length];
}

/** The pet as listener: a dealt picture the clue fits, rotating with the seed (a clue fits at least two dealt pictures). */
export function petPoint(deal: Deal, clue: ClueId, seed: number): PictureId {
  const options = deal.pictures.filter((p) => fits(p, clue));
  return options[Math.abs(Math.trunc(seed)) % options.length];
}

export type RevealKind = 'same' | 'both-fit' | 'new-view';

/** What is said at the reveal, never a verdict: the same picture, two pictures that both fit, or a new way to see it. */
export function revealKind(giverPick: PictureId, clue: ClueId, listenerPick: PictureId): RevealKind {
  if (giverPick === listenerPick) return 'same';
  return fits(giverPick, clue) && fits(listenerPick, clue) ? 'both-fit' : 'new-view';
}

export type Phase = 'choose' | 'cover' | 'point' | 'reveal';
export interface State {
  phase: Phase;
  deal: Deal;
  /** The giver's picture: it lives only here and in the scene's private field, and no card draw reads it before the reveal. */
  giverPick: PictureId | null;
  clue: ClueId | null;
}

/** What a renderer may read in a phase: the giver's pick appears only once the picture has turned over. */
export function visible(s: State): {
  phase: Phase;
  deal: Deal;
  clue: ClueId | null;
  revealed: PictureId | null;
} {
  return { phase: s.phase, deal: s.deal, clue: s.clue, revealed: s.phase === 'reveal' ? s.giverPick : null };
}

export type Hint = { kind: 'clue'; clue: ClueId } | { kind: 'picture'; picture: PictureId };

/** What Help lights: the listener gets a picture the clue fits that is not the giver's; the giver gets a clue that fits the picked picture. */
export function hintAction(s: State): Hint | null {
  if (s.phase === 'point' && s.clue !== null) {
    const options = s.deal.pictures.filter((p) => p !== s.giverPick && fits(p, s.clue as ClueId));
    return options.length ? { kind: 'picture', picture: options[0] } : null;
  }
  if (s.phase === 'choose' && s.giverPick !== null) {
    const c = s.deal.clues.find((x) => fits(s.giverPick as PictureId, x));
    return c === undefined ? null : { kind: 'clue', clue: c };
  }
  return null;
}
