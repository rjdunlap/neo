import { parseGrid, type WordGrid } from './logic';

/**
 * A challenge course: fixed grids played in a row as one round, scored by the guesses made (a guess is a marked line that is
 * checked, right or wrong). The grids are frozen data, so a record always means the same puzzles; the fewest guesses for a
 * grid is the number of its words, one guess for each. Change a grid and the version must change too, which starts a fresh
 * record and keeps the old one.
 */
export type WordCourseId = 'words' | 'bigwords';

export interface CourseGrid {
  theme: string;
  rows: readonly string[];
  /** The words hidden in it, each of which must be in the grid exactly once. */
  words: readonly string[];
}

export interface Course {
  id: WordCourseId;
  /** Bump when a grid or a scoring rule changes: records compare only within a version. */
  version: number;
  name: string;
  blurb: string;
  grids: readonly CourseGrid[];
}

export const COURSES: Record<WordCourseId, Course> = {
  words: {
    id: 'words',
    version: 1,
    name: 'Pond Words',
    blurb: 'Three themed word searches in a row: by the pond, in the garden, and the weather. Find every word with as few guesses as you can.',
    grids: [
      { theme: 'pond', rows: ['EDGEGEGDOR', 'HUILSSTDWE', 'BCNBLPALDR', 'PKSHFNDMEE', 'IIDEBRPNUE', 'KHOLNEOULD', 'IENEAFLGVD', 'WRIPPLESRO', 'NOAOGSLEPG', 'NNPLCMOTRC'], words: ['TADPOLE', 'RIPPLE', 'HERON', 'DUCK', 'FROG', 'REED', 'MUD'] },
      { theme: 'garden', rows: ['OCADKSRSWTBR', 'WEEDKWTTEEBP', 'AHNBOEEOBAIS', 'VSVRMDALPEPL', 'PHMGPAUFKLAC', 'THONEPILUTER', 'NGOLVSFEREIR', 'LTLREOCOGMAO', 'GIBPFAIUNDSS', 'YGHGEGFETLDE', 'IDOLNKETNGRG', 'NVUEUFPGWGNT'], words: ['SPADE', 'TULIP', 'BLOOM', 'WEED', 'LEAF', 'STEM', 'ROSE', 'WORM', 'BEE'] },
      { theme: 'weather', rows: ['LGVKATGMUNCT', 'RIOHGWINDDHS', 'AANAOLSRCBAG', 'ITEIFNLLODUL', 'NHDLWUBREEZE', 'BSEUDSEEATRA', 'OYPSODNPNWEC', 'WAIUNTURVRTV', 'NEGUYRYPDYSK', 'RKHAARDINDOF', 'KTOHRLASTORM', 'WIBFGNKGOHFE'], words: ['RAINBOW', 'THUNDER', 'PUDDLE', 'BREEZE', 'FROST', 'STORM', 'HAIL', 'WIND', 'SUN'] },
    ],
  },
  bigwords: {
    id: 'bigwords',
    version: 1,
    name: 'The Big Hunt',
    blurb: 'Two big 14 by 14 word searches with twelve words each, in every direction: by the sea, then a cozy evening.',
    grids: [
      { theme: 'sea', rows: ['NSEMHNSTFCDSUD', 'AYRTKSMBEVGWSN', 'EYDKOWABTPAVOW', 'NIALLOFNNTSEDS', 'EMAMRUEUDDBOBA', 'EVAWAROODEOKLI', 'RYAHENIGINANPL', 'ILSAPECANFTRDB', 'NRTLBMLHENWLDA', 'MRSECIEDOIOAYR', 'LAESSDIDBRWRSC', 'HVAEGTELSMGOLO', 'LKANFFUAYGYCBA', 'IEDSTAYESOAUYA'], words: ['ANCHOR', 'PEARL', 'WHALE', 'CORAL', 'SAIL', 'BOAT', 'REEF', 'SAND', 'SEAL', 'TIDE', 'WAVE', 'CRAB'] },
      { theme: 'cozy', rows: ['LOWOMNPUASEAAG', 'NCDFRTFUILLRNN', 'BRARAOGUWIDEIW', 'EUNBWOLLIPNAEF', 'CGKLMGEAEPAPNV', 'KDAADRTPIECEYS', 'MEONHAEENRLRIA', 'TTWKRNVGYSWEUO', 'IAOENTELYHDAUH', 'ADETADBWLISSRR', 'GAOLSFOEAWSHRG', 'YKAIMEOPOPMASN', 'GNDUBSKSYGYGOK', 'OKGQFCOCOALENV'], words: ['SLIPPERS', 'BLANKET', 'CANDLE', 'PILLOW', 'QUILT', 'COCOA', 'SOFA', 'WARM', 'BOOK', 'FIRE', 'RUG', 'TEA'] },
    ],
  },
};

export const isWordCourse = (v: unknown): v is WordCourseId => v === 'words' || v === 'bigwords';

const parsed = new Map<WordCourseId, WordGrid[]>();
/** The grids of a course, read once, each with where every word is. */
export function courseGrids(id: WordCourseId): WordGrid[] {
  let grids = parsed.get(id);
  if (!grids) parsed.set(id, grids = COURSES[id].grids.map((g) => parseGrid(g.rows, g.theme, g.words)));
  return grids;
}

/** The fewest guesses for each grid: one for each word. */
export const courseBest = (id: WordCourseId): number[] => courseGrids(id).map((g) => g.words.length);
/** The fewest guesses for a whole course. */
export const courseMinimum = (id: WordCourseId) => courseBest(id).reduce((n, b) => n + b, 0);
