import type { BandLevels } from '../../progress/difficulty';
import { Rng } from '../../engine/random';

/**
 * Dream Cards, level 1 (docs/definitions/dream-cards.md): three dream pictures and three pictured clues. One of two
 * people picks a picture and gives one clue about it; the other points to the picture the clue makes them think of;
 * the picked picture turns over. Nothing about the choice is wrong, so the round never counts a miss: the fit table only
 * guides what the pet says and which deals are dealt.
 */
export const LEVELS: BandLevels = { school: { min: 1, max: 3 } };
export const describeLevel = (level: number) =>
  level >= 3
    ? 'My dream: build a picture, then give its clue'
    : level >= 2
      ? 'Two clues: say more, then look again'
      : 'Dream clues: give one clue and read another’s';

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

/**
 * Level 2 (docs/definitions/dream-cards-two-clues.md) adds a second clue after her first point: `second` is the giver
 * choosing it, `again` is her second look (keep her point or move it).
 */
export type Phase = 'build' | 'choose' | 'cover' | 'point' | 'second' | 'again' | 'reveal';
export interface State {
  phase: Phase;
  deal: Deal;
  /** The giver's picture: it lives only here and in the scene's private field, and no card draw reads it before the reveal. */
  giverPick: PictureId | null;
  clue: ClueId | null;
  /** Level 2 only: the second clue, and the picture she first pointed to. */
  clue2?: ClueId | null;
  first?: PictureId | null;
  /** Level 3 only: the built stamp, kept only in state. */
  stamp?: Stamp;
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

// ---- level 2: two clues for one picture ------------------------------------------------------------------------

/** The dealt pictures that fit both clues: only says what the pet says and dresses a hint, never a score. */
export function bothFit(deal: Deal, c1: ClueId, c2: ClueId): PictureId[] {
  return deal.pictures.filter((p) => fits(p, c1) && fits(p, c2));
}

export interface Triple {
  picture: PictureId;
  clue: ClueId;
  clue2: ClueId;
}

/** Every ordered (picture, clue, clue2) of a deal where the picture fits both clues and the clues differ. */
export function fittingTriples(deal: Deal): Triple[] {
  const out: Triple[] = [];
  for (const picture of deal.pictures)
    for (const clue of deal.clues)
      for (const clue2 of deal.clues)
        if (clue !== clue2 && fits(picture, clue) && fits(picture, clue2)) out.push({ picture, clue, clue2 });
  return out;
}

/** The pet as giver at level 2: one triple, fixed when the round starts, so it never steers by where she pointed. */
export function petPick2(deal: Deal, seed: number): Triple {
  const triples = fittingTriples(deal);
  return triples[Math.abs(Math.trunc(seed)) % triples.length];
}

/** The pet as listener at level 2: keep its point if it fits both clues, else look again at one that does. */
export function petLook(deal: Deal, c1: ClueId, c2: ClueId, first: PictureId, seed: number): PictureId {
  const options = bothFit(deal, c1, c2);
  if (options.length === 0 || options.includes(first)) return first;
  return options[Math.abs(Math.trunc(seed)) % options.length];
}

export type SecondKind = 'kept' | 'moved';
export const secondKind = (first: PictureId, final: PictureId): SecondKind =>
  first === final ? 'kept' : 'moved';

/** What is said at the level 2 reveal, never a verdict; the first point is not graded. */
export function finalKind(giverPick: PictureId, c1: ClueId, c2: ClueId, final: PictureId): RevealKind {
  if (giverPick === final) return 'same';
  return fits(final, c1) && fits(final, c2) ? 'both-fit' : 'new-view';
}

export type Hint2 = { kind: 'clue'; clue: ClueId } | { kind: 'clues'; clues: [ClueId, ClueId] };

/**
 * Level 2 Help. The giver's second turn glows a further clue the picked picture fits (null when none does); the second
 * look glows the two clues and never a picture, and reads nothing about the giver's pick.
 */
export function hintAction2(s: State): Hint2 | null {
  if (s.phase === 'again' && s.clue !== null && s.clue2 != null)
    return { kind: 'clues', clues: [s.clue, s.clue2] };
  if (s.phase === 'second' && s.giverPick !== null) {
    const c = s.deal.clues.find((x) => x !== s.clue && fits(s.giverPick as PictureId, x));
    return c === undefined ? null : { kind: 'clue', clue: c };
  }
  return null;
}

// ---- level 3: make your own dream picture ------------------------------------------------------------------------

export const WHERE = ['sky', 'meadow', 'pond'] as const;
export const THING = ['swing', 'house', 'boat'] as const;
export const LIGHT = ['moon', 'lantern', 'star'] as const;
/** The stamp's three parts, one per slot: where, thing, light (each an index 0 to 2). */
export type Stamp = readonly [number, number, number];
/** The card id the made stamp takes in a deal; ids 0 to 5 are the pool's pictures. */
export const STAMP_CARD = 6;

/** What each part invites (indices into CLUES), two clues each: every clue is invited by exactly three of the nine parts. */
export const PART_CLUES: readonly (readonly (readonly [ClueId, ClueId])[])[] = [
  [
    [1, 3], // sky: high up, floating
    [0, 2], // meadow: quiet, cozy
    [4, 5], // pond: glowing, tiny
  ],
  [
    [1, 0], // swing: high up, quiet
    [2, 5], // house: cozy, tiny
    [3, 4], // boat: floating, glowing
  ],
  [
    [0, 4], // moon: quiet, glowing
    [2, 3], // lantern: cozy, floating
    [1, 5], // star: high up, tiny
  ],
];

export const STAMPS: readonly Stamp[] = (() => {
  const out: Stamp[] = [];
  for (let w = 0; w < 3; w++) for (let t = 0; t < 3; t++) for (let l = 0; l < 3; l++) out.push([w, t, l]);
  return out;
})();

/** Spoken name of a stamp, from its parts: "sky lantern boat". */
export const stampName = (s: Stamp) => `${WHERE[s[0]]} ${LIGHT[s[2]]} ${THING[s[1]]}`;

/** True when any of the stamp's three parts invites the clue: a suggestion of what to say, never a scoring key. */
export const stampFits = (s: Stamp, clue: ClueId) =>
  s.some((part, slot) => PART_CLUES[slot][part].includes(clue));

/** A card in a made deal: the stamp (STAMP_CARD) fits through its parts, a pool picture through FITS. */
export const fits3 = (s: Stamp, card: PictureId, clue: ClueId) =>
  card === STAMP_CARD ? stampFits(s, clue) : fits(card, clue);

/** Valid when every dealt clue fits two cards, the stamp fits a dealt clue, and each decoy fits a dealt clue. */
export function validMade(s: Stamp, d: Deal): boolean {
  const clueOk = d.clues.every((c) => d.pictures.filter((p) => fits3(s, p, c)).length >= 2);
  const picOk = d.pictures.every((p) => d.clues.some((c) => fits3(s, p, c)));
  return clueOk && picOk;
}

/** Every valid made deal for a stamp (sorted sets, in a fixed order): the stamp, two of the six pictures, three clues. */
export function madeDeals(s: Stamp): Deal[] {
  const out: Deal[] = [];
  for (let a = 0; a < 6; a++)
    for (let b = a + 1; b < 6; b++)
      for (const clues of triples()) {
        const d: Deal = { pictures: [a, b, STAMP_CARD], clues };
        if (validMade(s, d)) out.push(d);
      }
  return out;
}

const madeCache = new Map<number, Deal[]>();
const stampKey = (s: Stamp) => s[0] * 9 + s[1] * 3 + s[2];
const madeFor = (s: Stamp) => {
  const k = stampKey(s);
  let m = madeCache.get(k);
  if (!m) madeCache.set(k, (m = madeDeals(s)));
  return m;
};

/** A seeded valid made deal with the three cards and the three clues in a seeded left-to-right order. */
export function dealMade(s: Stamp, seed: number): Deal {
  const rng = new Rng(seed);
  const base = rng.pick(madeFor(s));
  const [p0, p1, p2] = rng.shuffle([...base.pictures]);
  const [c0, c1, c2] = rng.shuffle([...base.clues]);
  return { pictures: [p0, p1, p2], clues: [c0, c1, c2] };
}

/** The pet as listener at level 3: a dealt card the clue fits, rotating with the seed. */
export function petPoint3(s: Stamp, deal: Deal, clue: ClueId, seed: number): PictureId {
  const options = deal.pictures.filter((p) => fits3(s, p, clue));
  return options[Math.abs(Math.trunc(seed)) % options.length];
}

/** The pet as builder at level 3: a seeded recipe, never a hidden right answer. */
export const petStamp = (seed: number): Stamp => STAMPS[(Math.abs(Math.trunc(seed)) * 11) % STAMPS.length];

/** The pet's clue for its own stamp: a dealt clue the stamp fits, rotating with the seed. */
export function petClue3(s: Stamp, deal: Deal, seed: number): ClueId {
  const options = deal.clues.filter((c) => stampFits(s, c));
  return options[Math.abs(Math.trunc(seed)) % options.length];
}

/** What is said at the level 3 reveal, never a verdict. */
export function revealKind3(
  s: Stamp,
  giverPick: PictureId,
  clue: ClueId,
  listenerPick: PictureId,
): RevealKind {
  if (giverPick === listenerPick) return 'same';
  return fits3(s, giverPick, clue) && fits3(s, listenerPick, clue) ? 'both-fit' : 'new-view';
}

export type Hint3 =
  { kind: 'slots' } | { kind: 'clue'; clue: ClueId } | { kind: 'picture'; picture: PictureId };

/**
 * Level 3 Help moves attention, never the answer: while building it names the three slots; once the clues are dealt it
 * glows one token the stamp fits; when she points to the pet's stamp it glows a card that fits the clue and is not the
 * stamp. It never reads which card is hers.
 */
export function hintAction3(s: State): Hint3 | null {
  const stamp = s.stamp;
  if (s.phase === 'build') return { kind: 'slots' };
  if (!stamp) return null;
  if (s.phase === 'choose') {
    const c = s.deal.clues.find((x) => stampFits(stamp, x));
    return c === undefined ? null : { kind: 'clue', clue: c };
  }
  if (s.phase === 'point' && s.clue !== null) {
    const p = s.deal.pictures.find((x) => x !== s.giverPick && fits3(stamp, x, s.clue as ClueId));
    return p === undefined ? null : { kind: 'picture', picture: p };
  }
  return null;
}
