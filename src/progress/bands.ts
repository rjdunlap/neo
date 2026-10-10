export type Band = 'lap' | 'toddler' | 'preschool' | 'prek' | 'school';

export interface BandInfo {
  id: Band;
  label: string;
  ages: string;
}

export const BANDS: BandInfo[] = [
  { id: 'lap', label: 'Lap', ages: 'under 2 years' },
  { id: 'toddler', label: 'Toddler', ages: '2 years' },
  { id: 'preschool', label: 'Preschool', ages: '3 years' },
  { id: 'prek', label: 'Pre-K', ages: '4–5 years' },
  { id: 'school', label: 'Early school', ages: '6 years and up' },
];

export const bandInfo = (id: Band): BandInfo => BANDS.find((b) => b.id === id) ?? BANDS[0];

/** Where a band sits on the ladder from lap (0) to early school. */
export const bandRank = (band: Band) => BANDS.findIndex((b) => b.id === band);

/**
 * The band to play a game in: the person's own if the game has it, otherwise the highest band it has below
 * theirs (a game for younger children plays its most demanding levels), otherwise the lowest above (a game
 * for bigger children plays its easiest). Every launch goes through this, because a game's level table has
 * nothing for a band it does not list.
 */
export function playBand(bands: readonly Band[], person: Band): Band {
  if (bands.includes(person)) return person;
  const r = bandRank(person);
  const below = bands.filter((b) => bandRank(b) < r);
  if (below.length) return below.reduce((a, b) => (bandRank(b) > bandRank(a) ? b : a));
  return bands.reduce((a, b) => (bandRank(b) < bandRank(a) ? b : a));
}

/** The youngest band a game plays in: a land shows the game to everyone at that age or older. */
export const lowestBand = (bands: readonly Band[]): Band => bands.reduce((a, b) => (bandRank(b) < bandRank(a) ? b : a));
