import { nextCard, PICTURE_POOLS, type MemoryCard, type MemoryPicture } from './logic';

/**
 * A challenge course: fixed card tables played in a row as one round, scored by cards turned over (every flip counts,
 * a card turned again after it was seen counts again, tapping the card already turned does not). The tables are frozen
 * data, not generated, and so are the pictures on them (named by id, so a change to a picture pool cannot change a
 * table). A table has no exact fewest (a lucky first flip finds a pair at once), so par is a fixed reference player's
 * count (`solverFlips`, the same remembering player the demo and the how-to ghost use) on each table, worked out, never
 * typed in (the October 23 rule). Beating par is possible; missing it fails nothing. Change a table and the version
 * must change too, which starts a fresh record and keeps the old one.
 *
 * `deck` lists the cards left to right (then row by row), one letter per pair: `ABCBAC` is three pairs.
 */
export type MemoryCourseId = 'cardtables';

export interface CourseTable {
  /** Picture ids, one per pair letter in order (A first), from the picture pools. */
  faces: readonly string[];
  deck: string;
}

export interface Course {
  id: MemoryCourseId;
  /** Bump when a table or a scoring rule changes: records compare only within a version. */
  version: number;
  name: string;
  blurb: string;
  tables: readonly CourseTable[];
}

export const COURSES: Record<MemoryCourseId, Course> = {
  cardtables: {
    id: 'cardtables',
    version: 1,
    name: 'The Card Tables',
    blurb:
      'Four tables of cards in a row, from three pairs to eight. Find every pair in the fewest flips; par is a careful remembering player’s count, and you can beat it.',
    tables: [
      { faces: ['friend-cow', 'friend-duck', 'friend-pig'], deck: 'ABCBAC' },
      { faces: ['prop-apple', 'prop-pear', 'prop-grapes', 'prop-flower'], deck: 'ABCDBDAC' },
      {
        faces: [
          'vehicle-car',
          'vehicle-bus',
          'vehicle-truck',
          'vehicle-train',
          'vehicle-boat',
          'vehicle-plane',
        ],
        deck: 'ABCDEFBDFAEC',
      },
      {
        faces: [
          'shape-red-circle',
          'shape-blue-star',
          'shape-yellow-square',
          'shape-purple-heart',
          'shape-green-triangle',
          'shape-pink-hexagon',
          'shape-orange-circle',
          'shape-teal-star',
        ],
        deck: 'ABCDEFGHBDFHACEG',
      },
    ],
  },
};

export const isMemoryCourse = (v: unknown): v is MemoryCourseId => v === 'cardtables';

export interface Table {
  pairs: number;
  cards: MemoryCard[];
  pictures: MemoryPicture[];
}

const allPictures = PICTURE_POOLS.flat();

/** Read one frozen table: check its letters and pictures, and build the cards. */
export function parseTable({ faces, deck }: CourseTable): Table {
  const pairs = faces.length;
  if (deck.length !== pairs * 2) throw new Error('A table has two cards for every picture');
  const sides = new Array<number>(pairs).fill(0);
  const cards = [...deck].map((ch): MemoryCard => {
    const pair = ch.charCodeAt(0) - 65;
    if (pair < 0 || pair >= pairs) throw new Error(`Unknown pair ${ch}`);
    return { pair, side: Math.min(1, sides[pair]++) as 0 | 1 };
  });
  if (sides.some((n) => n !== 2)) throw new Error('Every picture appears on exactly two cards');
  const pictures = faces.map((id) => {
    const found = allPictures.find((p) => p.id === id);
    if (!found) throw new Error(`Unknown picture ${id}`);
    return found;
  });
  if (new Set(faces).size !== faces.length) throw new Error('A table needs different pictures');
  return { pairs, cards, pictures };
}

/** The reference player's flips on a table: it turns a card, then its partner when seen, else an unseen card. */
export function solverFlips(cards: readonly MemoryCard[]): number {
  const seen = new Set<number>();
  const matched = new Set<number>();
  let first: number | null = null;
  let flips = 0;
  for (let guard = 0; guard < 1000 && matched.size < cards.length; guard++) {
    const k = nextCard(cards, seen, (j) => matched.has(j), first);
    if (k < 0) break;
    flips++;
    seen.add(k);
    if (first === null) first = k;
    else {
      if (cards[first].pair === cards[k].pair) {
        matched.add(first);
        matched.add(k);
      }
      first = null;
    }
  }
  return flips;
}

const parsed = new Map<MemoryCourseId, Table[]>();
/** The tables of a course, read once. */
export function courseTables(id: MemoryCourseId): Table[] {
  let tables = parsed.get(id);
  if (!tables) parsed.set(id, (tables = COURSES[id].tables.map(parseTable)));
  return tables;
}

/** The reference player's flips on each table of a course: its par. */
export const courseBest = (id: MemoryCourseId): number[] => courseTables(id).map((t) => solverFlips(t.cards));
/** Par for a whole course. */
export const courseMinimum = (id: MemoryCourseId) => courseBest(id).reduce((n, b) => n + b, 0);
