import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Word Glue: two pictures join into a third, and the pet says the parts and the whole. Level 1 joins the only pair,
 * level 2 finds the two parts of an asked word among three pictures, level 3 keeps the second part (a house, a box, a
 * brush) and asks which first part makes the thing a friend needs. Every entry is a transparent compound whose parts
 * can both be drawn; nothing is printed. Level 5 shows a made thing over its two parts and asks which part it is: the
 * last part names the thing. Level 6 tells two real words apart by their order, and level 7 names a new thing from its
 * pictures with the thing last; level 8 joins an action to a person to make a word for someone who does it (painter).
 * See docs/definitions/word-glue.md, word-glue-5-6.md, word-glue-7.md and word-glue-8-9.md.
 */

export interface Compound {
  word: string;
  first: string;
  second: string;
  /** Who or what it is for, said after the word on level 3 and in level 2's miss ("a house for a dog"). */
  meaning: string;
  levels: readonly number[];
}

export const COMPOUNDS: readonly Compound[] = [
  {
    word: 'sunflower',
    first: 'sun',
    second: 'flower',
    meaning: 'a flower that turns to the sun',
    levels: [1, 2, 5],
  },
  { word: 'cupcake', first: 'cup', second: 'cake', meaning: 'a little cake in a cup', levels: [1, 2, 5] },
  { word: 'doghouse', first: 'dog', second: 'house', meaning: 'a house for a dog', levels: [1, 2, 3, 5] },
  { word: 'toothbrush', first: 'tooth', second: 'brush', meaning: 'a brush for teeth', levels: [1, 2, 3, 5] },
  { word: 'raincoat', first: 'rain', second: 'coat', meaning: 'a coat for the rain', levels: [1, 2] },
  { word: 'beehive', first: 'bee', second: 'hive', meaning: 'a home for bees', levels: [1, 2, 5] },
  { word: 'sailboat', first: 'sail', second: 'boat', meaning: 'a boat with a sail', levels: [1, 2, 5] },
  { word: 'mailbox', first: 'mail', second: 'box', meaning: 'a box for mail', levels: [1, 2, 3] },
  { word: 'birdhouse', first: 'bird', second: 'house', meaning: 'a house for a bird', levels: [3, 5] },
  { word: 'dollhouse', first: 'doll', second: 'house', meaning: 'a house for a doll', levels: [3, 5] },
  { word: 'toybox', first: 'toy', second: 'box', meaning: 'a box for toys', levels: [3, 5] },
  { word: 'sandbox', first: 'sand', second: 'box', meaning: 'a box for sand', levels: [3] },
  { word: 'hairbrush', first: 'hair', second: 'brush', meaning: 'a brush for hair', levels: [3] },
  { word: 'paintbrush', first: 'paint', second: 'brush', meaning: 'a brush for paint', levels: [3] },
];

/** Opaque compounds the study ruled out of every meaning rung: a test checks none is in the table. */
export const OPAQUE = ['butterfly', 'hotdog', 'pineapple', 'starfish', 'rainbow', 'buttercup'] as const;

/** Single pictures that can sit beside an asked pair on level 2. */
export const POOL = [
  'moon',
  'star',
  'key',
  'tree',
  'car',
  'hat',
  'duck',
  'frog',
  'bell',
  'spoon',
  'shell',
  'chair',
  'jar',
] as const;

/**
 * Real or rude words that must never be makeable on screen, in either order, from a pair of pictures shown together.
 * The definition's list, plus the joins the session's check of the parts and pool found (dictionary compounds and
 * common two-word names a child hears as one thing).
 */
export const DENY: readonly string[] = [
  // From the definition.
  'sunfish',
  'sunhat',
  'sunshine',
  'sunset',
  'sunrise',
  'sunlight',
  'sunbeam',
  'sundog',
  'moonflower',
  'moonbeam',
  'moonlight',
  'starfish',
  'flowerpot',
  'flowerbed',
  'cupboard',
  'teacup',
  'pancake',
  'catfish',
  'dogfish',
  'hotdog',
  'dogbowl',
  'dogbed',
  'houseboat',
  'boathouse',
  'housefly',
  'treehouse',
  'cathouse',
  'bughouse',
  'toothpaste',
  'toothpick',
  'raindrop',
  'rainbow',
  'overcoat',
  'bumblebee',
  'beeswax',
  'sailfish',
  'mailbag',
  'boxcar',
  'hatbox',
  'keyhole',
  'keyboard',
  'shellfish',
  'seashell',
  'bellhop',
  'doorbell',
  'cowbell',
  'armchair',
  'highchair',
  'footprint',
  'football',
  // Added by the session's check (2026-10-24): real compounds and common two-word names makeable from a part and a picture.
  'sunbird',
  'sunsail',
  'sunchair',
  'sunhouse',
  'sunboat',
  'bellflower',
  'starflower',
  'flowerbox',
  'hairflower',
  'beeflower',
  'paintcup',
  'cakebox',
  'mooncake',
  'sandcake',
  'dollcake',
  'dogstar',
  'dogcoat',
  'dogbox',
  'dogtoy',
  'doghair',
  'dogbrush',
  'dogbell',
  'housekey',
  'duckhouse',
  'beehouse',
  'toyhouse',
  'shellhouse',
  'carbrush',
  'cupbrush',
  'dollbrush',
  'toybrush',
  'rainhat',
  'raintree',
  'rainfrog',
  'rainbird',
  'rainshell',
  'carcoat',
  'coattree',
  'duckcoat',
  'dollcoat',
  'mailcoat',
  'beetree',
  'beebox',
  'beehat',
  'hivebox',
  'toyboat',
  'duckboat',
  'boathat',
  'mailboat',
  'shellboat',
  'mailcar',
  'mailhat',
  'housecoat',
  'housepaint',
  'dogtooth',
  'boxtree',
  'keybox',
  'paintbox',
  'birdbox',
  'sandbee',
  'moonsail',
];

export const REVERSED_LEVEL = 6;

/** Level 7: a thing nobody has named, and two name cards to fill from its three pictures; the thing goes last. */
export const NAME_LEVEL = 7;

/**
 * Level 7's invented things: a head (what it is) with two true details drawn on it. Kept apart from `COMPOUNDS` so
 * `makes`, `forms` and `distractorsFor` never offer an invented name on levels 1 to 6. Every name is said as two words.
 */
export interface Invented {
  head: string;
  details: readonly [string, string];
  /** What each name means, by its detail ("a hat with a star on it"). */
  meanings: Readonly<Record<string, string>>;
}

const INVENTED_ROWS = [
  {
    head: 'hat',
    details: ['star', 'bell'],
    meanings: { star: 'a hat with a star on it', bell: 'a hat with a bell on it' },
  },
  {
    head: 'boat',
    details: ['tree', 'key'],
    meanings: { tree: 'a boat with a tree on it', key: 'a boat with a key on it' },
  },
  {
    head: 'cake',
    details: ['shell', 'duck'],
    meanings: { shell: 'a cake with shells on it', duck: 'a cake with a duck on top' },
  },
  {
    head: 'chair',
    details: ['sail', 'flower'],
    meanings: { sail: 'a chair with a sail', flower: 'a chair with flowers on it' },
  },
  {
    head: 'cup',
    details: ['frog', 'car'],
    meanings: { frog: 'a cup with a frog on it', car: 'a cup with a car on it' },
  },
  {
    head: 'coat',
    details: ['moon', 'spoon'],
    meanings: { moon: 'a coat with a moon on it', spoon: 'a coat with spoons in its pockets' },
  },
] as const satisfies readonly Invented[];

export const INVENTED: readonly Invented[] = INVENTED_ROWS;

type Row = (typeof INVENTED_ROWS)[number];
type Orders<All extends string, T extends string = All> = T extends string
  ? `${T}-${Exclude<All, T>}`
  : never;
/** Every level-7 line id: a row's head, then the two pictures in the order said. */
export type NameLineId = Row extends infer R
  ? R extends {
      head: infer H extends string;
      details: readonly [infer A extends string, infer B extends string];
    }
    ? `wordglue.name.${H}.${Orders<H | A | B>}`
    : never
  : never;

/** An invented name, said as two words: "star hat". */
export const inventedName = (first: string, last: string) => `${first} ${last}`;

/** Level 7's verdict on a name: right with the head last and a detail first, else what the name would call (its last part). */
export function judgeName(
  row: Invented,
  first: string,
  last: string,
): { kind: 'right' } | { kind: 'wrong'; calls: string } {
  return last === row.head && row.details.includes(first) && first !== last
    ? { kind: 'right' }
    : { kind: 'wrong', calls: last };
}

/** Keep both orders here so the joining rounds still have one meaning per pair. */
const PAIR_DATA = [
  ['house', 'boat', 'houseboat', 'a boat you can live in', 'boathouse', 'a house for boats'],
  ['pan', 'cake', 'pancake', 'a flat cake you cook in a pan', 'cake pan', 'a pan for baking a cake'],
  ['race', 'horse', 'racehorse', 'a horse that runs in races', 'horse race', 'a race for horses'],
  ['sled', 'dog', 'sled dog', 'a dog that pulls a sled', 'dog sled', 'a sled that dogs pull'],
] as const;

export type ChoiceWord = (typeof PAIR_DATA)[number][2 | 4];

export const PAIRS: readonly (readonly [Compound, Compound])[] = PAIR_DATA.map(
  ([first, second, word, meaning, reversed, reversedMeaning]) => [
    { first, second, word, meaning, levels: [REVERSED_LEVEL] },
    { first: second, second: first, word: reversed, meaning: reversedMeaning, levels: [REVERSED_LEVEL] },
  ],
);

/** Level 8: an action joins the person in the middle to make someone who does it. */
export const DOER_LEVEL = 8;
/** Level 8's fixed tile in the middle: a soft grey figure, "someone who…". */
export const PERSON = 'person';

const DOER_ROWS = [
  { action: 'paint', word: 'painter', meaning: 'someone who paints' },
  { action: 'bake', word: 'baker', meaning: 'someone who bakes' },
  { action: 'sing', word: 'singer', meaning: 'someone who sings' },
  { action: 'swim', word: 'swimmer', meaning: 'someone who swims' },
  { action: 'drive', word: 'driver', meaning: 'someone who drives' },
  { action: 'read', word: 'reader', meaning: 'someone who reads' },
  { action: 'build', word: 'builder', meaning: 'someone who builds' },
] as const;
export type DoerWord = (typeof DOER_ROWS)[number]['word'];
export type Action = (typeof DOER_ROWS)[number]['action'];

/**
 * Level 8's words: each is a plain action she knows plus -er, meaning someone who does it. Each row is shaped like a
 * compound (the action first, the person second) so an ask and a drop keep one type; none is in `COMPOUNDS`, so the
 * compound rungs never see them. A drop resolves to these very objects, so `check` can compare by identity.
 */
export const DOERS: readonly Compound[] = DOER_ROWS.map(({ action, word, meaning }) => ({
  word,
  first: action,
  second: PERSON,
  meaning,
  levels: [DOER_LEVEL],
}));

/** Level 8's pictures: the person and the seven actions. */
export const DOER_PICTURES: readonly string[] = [PERSON, ...DOERS.map((d) => d.first)];

/** Levels whose middle picture stays put: only the pictures round it move, and only onto it. */
export const headFixed = (level: number) => level === 3 || level === DOER_LEVEL;

export const ENDING_LEVEL = 9;
export const FULL_CUP = 'full-cup';
export const EMPTY_CUP = 'empty-cup';
export type Cup = typeof FULL_CUP | typeof EMPTY_CUP;

export const ENDINGS = [
  { base: 'fruit', thing: 'tree', full: 'fruitful', without: 'fruitless' },
  { base: 'color', thing: 'fish', full: 'colorful', without: 'colorless' },
  { base: 'power', thing: 'lamp', full: 'powerful', without: 'powerless' },
  { base: 'cheer', thing: 'room', full: 'cheerful', without: 'cheerless' },
  { base: 'care', thing: 'bear', full: 'careful', without: 'careless' },
] as const;
export type Ending = (typeof ENDINGS)[number];

export function endingEntry(ending: Ending, cup: Cup): Compound {
  const full = cup === FULL_CUP;
  return {
    first: ending.base,
    second: cup,
    word: full ? ending.full : ending.without,
    meaning: `${full ? 'full of' : 'without'} ${ending.base}`,
    levels: [ENDING_LEVEL],
  };
}

export interface Plan {
  level: number;
  name: string;
}

export const PLANS: readonly Plan[] = [
  { level: 1, name: 'Stick them: join the only pair to make a new thing' },
  { level: 2, name: 'What do they make? Find the two pictures that make the asked word' },
  { level: 3, name: 'Who is it for? Join the friend who needs the thing in the middle' },
  {
    level: 4,
    name: 'One big picture: a touch anywhere flies its partner in to stick on, and the new thing joins the shelf (5 things)',
  },
  { level: 5, name: 'What kind of thing? Tap the part the made thing really is (5 asks)' },
  { level: REVERSED_LEVEL, name: 'Which way round? Tap the thing the pet names (4 asks)' },
  { level: NAME_LEVEL, name: 'Name the new thing: tap two pictures, the thing it is last (5 asks)' },
  {
    level: DOER_LEVEL,
    name: 'Someone who: join an action to the person to make the asked word, like painter (5 asks)',
  },
  { level: ENDING_LEVEL, name: 'Full of or without: tap a meaning cup to make the asked word (5 asks)' },
];

/** Level 4, lap's opening before level 1: one big picture at a time, and a touch anywhere joins it; toddler still starts at 1. */
export const BIG_LEVEL = 4;

/** Level 5: a made thing and its two parts; a tap on the part it is (its last part) answers. */
export const KIND_LEVEL = 5;

export const LEVELS: BandLevels = {
  lap: { min: 1, max: BIG_LEVEL, order: [BIG_LEVEL, 1] },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 3 },
  prek: { min: 3, max: 3 },
  // An explicit order keeps lap's level 4 out of school's ladder.
  school: {
    min: 3,
    max: ENDING_LEVEL,
    order: [3, KIND_LEVEL, REVERSED_LEVEL, NAME_LEVEL, DOER_LEVEL, ENDING_LEVEL],
  },
};

export const planFor = (level: number): Plan => PLANS.find((p) => p.level === level) ?? PLANS[0];

/** The level-3 heads, each with exactly three level-3 compounds. */
export const HEADS = ['house', 'box', 'brush'] as const;
export type Head = (typeof HEADS)[number];

const byWord = (word: string): Compound => {
  const c = COMPOUNDS.find((x) => x.word === word);
  if (!c) throw new Error(`no compound ${word}`);
  return c;
};

export const forHead = (head: string): Compound[] =>
  COMPOUNDS.filter((c) => c.second === head && c.levels.includes(3));

/** The entry two pictures make, in either drag order, or null. */
export function makes(a: string, b: string): Compound | null {
  return (
    COMPOUNDS.find((c) => (c.first === a && c.second === b) || (c.first === b && c.second === a)) ?? null
  );
}

/** The thing two pictures make at `level`: a doer at level 8, a listed compound everywhere else. */
export function joined(level: number, a: string, b: string): Compound | null {
  if (level !== DOER_LEVEL) return makes(a, b);
  return DOERS.find((d) => (d.first === a && d.second === b) || (d.first === b && d.second === a)) ?? null;
}

/** Whether a joined string is a listed or denied word, in either order. */
export function forms(a: string, b: string): boolean {
  const words = new Set([...COMPOUNDS.map((c) => c.word), ...DENY]);
  return words.has(a + b) || words.has(b + a);
}

/** Every picture the game draws: all the parts and the pool. */
export const PICTURES: readonly string[] = [
  ...new Set([...COMPOUNDS.flatMap((c) => [c.first, c.second]), ...POOL]),
];

export interface Ask {
  /** The thing this ask makes. */
  entry: Compound;
  /**
   * The pictures on the table. At levels 3 and 8 the head (the person at 8) is first, then the three first parts; level
   * 3's stay put for the head's asks. At level 5 the entry's two parts in screen order.
   */
  pictures: string[];
  /** Level 5: the part the question says first ("a dog or a house?" or "a house or a dog?"), chosen apart from the screen order. */
  saidFirst?: string;
  /** Level 6: the other made thing, with its parts in the opposite order. */
  other?: Compound;
  /** Level 7: the thing to name; `pictures` holds its head and two details in screen order, and `entry` is its first detail's name. */
  invented?: Invented;
  /** Level 9: the pictured thing whose state changes. */
  ending?: Ending;
}

export interface Round {
  plan: Plan;
  asks: Ask[];
}

/** Level 2's valid distractors for an entry: no part-plus-distractor join is a listed or denied word. */
export function distractorsFor(entry: Compound): string[] {
  const parts = new Set(COMPOUNDS.flatMap((c) => [c.first, c.second]));
  const candidates = [...new Set([...POOL, ...parts])];
  return candidates.filter(
    (d) => d !== entry.first && d !== entry.second && !forms(entry.first, d) && !forms(entry.second, d),
  );
}

const AUTHORED_2: [string, string][] = [
  ['doghouse', 'moon'],
  ['raincoat', 'key'],
  ['cupcake', 'star'],
  ['mailbox', 'duck'],
  ['sunflower', 'jar'],
];
/** Level 5's first round: the word, whether its right part sits on the first side, and whether the question says it first. */
const AUTHORED_5: [string, boolean, boolean][] = [
  ['doghouse', false, false],
  ['sunflower', true, true],
  ['toothbrush', true, false],
  ['cupcake', false, true],
  ['sailboat', true, false],
];
const AUTHORED_1 = ['sunflower', 'doghouse', 'cupcake', 'beehive', 'sailboat'];
/** Level 7's first round: hat, boat, cake, chair, cup, with the head in each place at least once and at most twice. */
const AUTHORED_7: string[][] = [
  ['hat', 'star', 'bell'],
  ['key', 'tree', 'boat'],
  ['shell', 'cake', 'duck'],
  ['chair', 'flower', 'sail'],
  ['car', 'cup', 'frog'],
];

/** Level 8's first round: the asked word and its three actions in screen order, the right one in each place at least once. */
const AUTHORED_8: [string, string[]][] = [
  ['painter', ['paint', 'bake', 'sing']],
  ['swimmer', ['read', 'swim', 'drive']],
  ['baker', ['build', 'bake', 'paint']],
  ['driver', ['drive', 'sing', 'read']],
  ['builder', ['swim', 'read', 'build']],
];

const doer = (word: string): Compound => {
  const d = DOERS.find((x) => x.word === word);
  if (!d) throw new Error(`no doer ${word}`);
  return d;
};

/** Two or three of five, in a seeded order. */
function balancedFlags(rng: Rng): boolean[] {
  const n = rng.int(2, 3);
  return rng.shuffle(Array.from({ length: 5 }, (_, i) => i < n));
}

/** The name a level-7 ask stands for: its first detail before its head, so the head is `second` as on every level. */
const inventedEntry = (row: Invented, first = row.details[0]): Compound => ({
  word: inventedName(first, row.head),
  first,
  second: row.head,
  meaning: row.meanings[first],
  levels: [NAME_LEVEL],
});

/** A round at `level`. `authored` gives the definition's first round (the how-to card and demonstration open on it). */
export function makeRound(level: number, rng: Rng, authored = false): Round {
  const plan = planFor(level);
  // Level 4 joins level 1's pairs, one big picture at a time.
  if (plan.level === 1 || plan.level === BIG_LEVEL) {
    const words = authored
      ? AUTHORED_1
      : [
          'sunflower',
          ...rng
            .shuffle(COMPOUNDS.filter((c) => c.levels.includes(1) && c.word !== 'sunflower'))
            .slice(0, 4)
            .map((c) => c.word),
        ];
    return {
      plan,
      asks: words.map((w) => byWord(w)).map((entry) => ({ entry, pictures: [entry.first, entry.second] })),
    };
  }
  if (plan.level === 2) {
    const picks: [Compound, string][] = authored
      ? AUTHORED_2.map(([w, d]) => [byWord(w), d])
      : rng
          .shuffle(COMPOUNDS.filter((c) => c.levels.includes(2)))
          .slice(0, 5)
          .map((entry) => [entry, rng.pick(distractorsFor(entry))]);
    return {
      plan,
      asks: picks.map(([entry, d], i) => ({
        entry,
        pictures:
          authored && i === 0 ? ['dog', 'house', 'moon'] : rng.shuffle([entry.first, entry.second, d]),
      })),
    };
  }
  if (plan.level === ENDING_LEVEL) {
    const rows = authored
      ? [ENDINGS[0], ENDINGS[1], ENDINGS[4], ENDINGS[2], ENDINGS[3]]
      : rng.shuffle([...ENDINGS]);
    const full = authored ? [true, false, true, false, true] : balancedFlags(rng);
    const rightFirst = authored ? [false, true, true, false, true] : balancedFlags(rng);
    return {
      plan,
      asks: rows.map((ending, i) => {
        const right = full[i] ? FULL_CUP : EMPTY_CUP;
        const other = full[i] ? EMPTY_CUP : FULL_CUP;
        const cups = rightFirst[i] ? [right, other] : [other, right];
        return { ending, entry: endingEntry(ending, right), pictures: [ending.base, ...cups] };
      }),
    };
  }
  if (plan.level === KIND_LEVEL) {
    let picks = AUTHORED_5;
    if (!authored) {
      const tagged = COMPOUNDS.filter((c) => c.levels.includes(KIND_LEVEL));
      const heads = rng.shuffle([...new Set(tagged.map((c) => c.second))]).slice(0, 5);
      const sides = balancedFlags(rng),
        said = balancedFlags(rng);
      picks = heads.map((h, i) => [rng.pick(tagged.filter((c) => c.second === h)).word, sides[i], said[i]]);
    }
    return {
      plan,
      asks: picks.map(([word, rightFirst, rightSaidFirst]) => {
        const entry = byWord(word);
        return {
          entry,
          pictures: rightFirst ? [entry.second, entry.first] : [entry.first, entry.second],
          saidFirst: rightSaidFirst ? entry.second : entry.first,
        };
      }),
    };
  }
  if (plan.level === NAME_LEVEL) {
    if (authored)
      return {
        plan,
        asks: AUTHORED_7.map((pictures) => {
          const row = INVENTED.find((r) => pictures.includes(r.head))!;
          return { entry: inventedEntry(row), invented: row, pictures };
        }),
      };
    // Five of the six things; the head's place across the round is two, two and one of the three places.
    const rows = rng.shuffle([...INVENTED]).slice(0, 5);
    const places = rng.shuffle([0, 1, 2, 0, 1, 2]).slice(0, 5);
    return {
      plan,
      asks: rows.map((row, i) => {
        const pictures = rng.shuffle([...row.details]);
        pictures.splice(places[i], 0, row.head);
        return { entry: inventedEntry(row), invented: row, pictures };
      }),
    };
  }
  if (plan.level === DOER_LEVEL) {
    if (authored)
      return {
        plan,
        asks: AUTHORED_8.map(([word, actions]) => ({ entry: doer(word), pictures: [PERSON, ...actions] })),
      };
    // Five of the seven words; the right action's place is two, two and one of the three places.
    const rows = rng.shuffle([...DOERS]).slice(0, 5);
    const places = rng.shuffle([0, 1, 2, 0, 1, 2]).slice(0, 5);
    return {
      plan,
      asks: rows.map((entry, i) => {
        const others = rng
          .shuffle(DOERS.filter((d) => d !== entry))
          .slice(0, 2)
          .map((d) => d.first);
        others.splice(places[i], 0, entry.first);
        return { entry, pictures: [PERSON, ...others] };
      }),
    };
  }
  if (plan.level === REVERSED_LEVEL) {
    const picks = authored ? [PAIRS[0], PAIRS[1], PAIRS[3], PAIRS[2]] : rng.shuffle([...PAIRS]);
    const reversed = authored ? [false, true, true, false] : rng.shuffle([true, true, false, false]);
    const rightFirst = authored ? [false, true, true, false] : rng.shuffle([true, true, false, false]);
    return {
      plan,
      asks: picks.map(([first, second], i) => {
        const [entry, other] = reversed[i] ? [second, first] : [first, second];
        const words = [entry.word, other.word];
        return { entry, other, pictures: rightFirst[i] ? words : words.reverse() };
      }),
    };
  }
  const heads: Head[] = authored ? ['house', 'brush'] : rng.shuffle([...HEADS]).slice(0, 2);
  const asks: Ask[] = [];
  for (const head of heads) {
    const entries = forHead(head);
    const firsts = authored ? entries.map((e) => e.first) : rng.shuffle(entries.map((e) => e.first));
    const asked = authored
      ? (head === 'house' ? ['birdhouse', 'dollhouse'] : ['toothbrush', 'paintbrush']).map(byWord)
      : rng.shuffle(entries).slice(0, 2);
    for (const entry of asked) asks.push({ entry, pictures: [head, ...firsts] });
  }
  return { plan, asks };
}

/* The play state ------------------------------------------------------------------------------- */

export interface GlueState {
  round: Round;
  /** The ask in play; `asks.length` once the round is done. */
  index: number;
  misses: number;
  hints: number;
  /** Distinct wrong pairs dropped on this ask (sorted "a+b"). */
  wrong: Set<string>;
  /** Every wrong drop on this ask, repeats included; at level 5 every counted wrong tap (two at most). */
  wrongDrops: number;
  /** The right pictures (level 2) or the asking friend (level 3) glow; a hint has been counted for this ask. */
  glow: boolean;
  /** Level 7: the two name cards, each empty or holding a picture. */
  slots: [string | null, string | null];
  done: boolean;
}

export const newState = (round: Round): GlueState => ({
  round,
  index: 0,
  misses: 0,
  hints: 0,
  wrong: new Set(),
  wrongDrops: 0,
  glow: false,
  slots: [null, null],
  done: false,
});

export const currentAsk = (s: GlueState): Ask | null => (s.done ? null : s.round.asks[s.index]);

const pairKey = (a: string, b: string) => [a, b].sort().join('+');

/** The pair that makes the ask: the two parts at levels 1–2, the asked first part and the head at levels 3 and 8. */
export function hintFor(s: GlueState): [string, string] | null {
  const ask = currentAsk(s);
  return ask ? [ask.entry.first, ask.entry.second] : null;
}

/** Which pictures can be dragged now: every one at levels 1–2, only the first parts at levels 3 and 8. */
export function canDrag(s: GlueState, picture: string): boolean {
  const ask = currentAsk(s);
  if (!ask || !ask.pictures.includes(picture)) return false;
  return !headFixed(s.round.plan.level) || picture !== ask.pictures[0];
}

export type Outcome =
  | { kind: 'ignore' }
  | { kind: 'right'; entry: Compound }
  /** A supported join: a wrong drop after the glow and two earlier wrong drops makes the right thing with no further count. */
  | { kind: 'assist'; entry: Compound }
  | { kind: 'wrong'; made: Compound | null; counted: boolean; glowed: boolean };

/** What dropping picture `a` onto picture `b` would be, without changing anything. */
export function check(s: GlueState, a: string, b: string): Outcome['kind'] {
  const ask = currentAsk(s);
  if (!ask || a === b || !ask.pictures.includes(a) || !ask.pictures.includes(b)) return 'ignore';
  const level = s.round.plan.level;
  if (headFixed(level) && (a === ask.pictures[0] || b !== ask.pictures[0])) return 'ignore';
  return joined(level, a, b) === ask.entry ? 'right' : 'wrong';
}

/** Drop picture `a` onto picture `b`: count it and move on to the next ask after a join. */
export function drop(s: GlueState, a: string, b: string): Outcome {
  const kind = check(s, a, b);
  const ask = currentAsk(s);
  if (kind === 'ignore' || !ask) return { kind: 'ignore' };
  if (kind === 'right') {
    advance(s);
    return { kind: 'right', entry: ask.entry };
  }
  // Level 1 has one pair on the table, so it cannot get here.
  if (s.glow && s.wrongDrops >= 2) {
    advance(s);
    return { kind: 'assist', entry: ask.entry };
  }
  s.wrongDrops++;
  const key = pairKey(a, b);
  const counted = !s.wrong.has(key);
  let glowed = false;
  if (counted) {
    s.wrong.add(key);
    s.misses++;
    if (s.wrong.size >= 2 && !s.glow) {
      s.glow = true;
      s.hints++;
      glowed = true;
    }
  }
  return { kind: 'wrong', made: joined(s.round.plan.level, a, b), counted, glowed };
}

/** The picture that answers an ask by tapping, if the round uses a choice. */
export function rightChoice(s: GlueState): string | null {
  const ask = currentAsk(s);
  if (!ask) return null;
  if (ask.other) return ask.entry.word;
  if (ask.ending) return ask.entry.second;
  return s.round.plan.level === KIND_LEVEL ? ask.entry.second : null;
}

/** What tapping picture `key` would do, without changing anything. */
export function checkTap(s: GlueState, key: string): Outcome['kind'] {
  const ask = currentAsk(s);
  const right = rightChoice(s);
  if (!ask || !right || !ask.pictures.includes(key) || key === ask.ending?.base) return 'ignore';
  if (key === right) return 'right';
  return s.wrongDrops >= 2 ? 'assist' : 'wrong';
}

/**
 * Levels 5, 6 and 9: tap a picture. With two choices every wrong tap counts, up to two an ask; the second glows the right part (one
 * hint, unless Show a hint already counted it), and a wrong tap after that plays the right answer with no further count.
 */
export function tap(s: GlueState, key: string): Outcome {
  const kind = checkTap(s, key);
  const ask = currentAsk(s);
  if (kind === 'ignore' || !ask) return { kind: 'ignore' };
  if (kind === 'right' || kind === 'assist') {
    advance(s);
    return { kind, entry: ask.entry };
  }
  s.wrongDrops++;
  s.misses++;
  let glowed = false;
  if (s.wrongDrops >= 2 && !s.glow) {
    s.glow = true;
    s.hints++;
    glowed = true;
  }
  return { kind: 'wrong', made: null, counted: true, glowed };
}

/** Level 4: a touch anywhere joins the big picture with its partner. Returns the thing made and moves to the next ask. */
export function bigJoin(s: GlueState): Compound | null {
  const ask = currentAsk(s);
  if (!ask || s.round.plan.level !== BIG_LEVEL) return null;
  advance(s);
  return ask.entry;
}

/** Show a hint: the right pictures glow, counted once per ask. Levels 1 and 4 have nothing to get wrong and count nothing. */
export function applyHint(s: GlueState): [string, string] | null {
  const pair = hintFor(s);
  if (!pair) return null;
  const free = s.round.plan.level === 1 || s.round.plan.level === BIG_LEVEL;
  if (!free && !s.glow) {
    s.glow = true;
    s.hints++;
  }
  return pair;
}

function advance(s: GlueState) {
  s.index++;
  s.wrong = new Set();
  s.wrongDrops = 0;
  s.glow = false;
  s.slots = [null, null];
  if (s.index >= s.round.asks.length) s.done = true;
}

/** Start again: the same round from its first ask, keeping misses and hints. */
export function restartState(s: GlueState) {
  if (s.done) return;
  s.index = 0;
  s.wrong = new Set();
  s.wrongDrops = 0;
  s.glow = false;
  s.slots = [null, null];
}

/* Level 7: name the new thing ------------------------------------------------------------------ */

/** Level 7: send a picture to the first empty name card. Returns the card it went to, or null (not on the table, already in a card, or both full). */
export function place(s: GlueState, key: string): number | null {
  const ask = currentAsk(s);
  if (!ask?.invented || !ask.pictures.includes(key) || s.slots.includes(key)) return null;
  const i = s.slots.indexOf(null);
  if (i < 0) return null;
  s.slots[i] = key;
  return i;
}

/** Level 7: take a picture back out of its name card, which is free. Returns the card it left, or null. */
export function takeBack(s: GlueState, key: string): number | null {
  const i = s.slots.indexOf(key);
  if (i < 0) return null;
  s.slots[i] = null;
  return i;
}

export type NameOutcome =
  | { kind: 'ignore' }
  /** An accepted name, or the supported one after two counted misses: `first` is the detail said first. */
  | { kind: 'right' | 'assist'; row: Invented; first: string }
  /** A name with the wrong part last, said as `first` then `last`; the cards empty and the ask stays. */
  | { kind: 'wrong'; row: Invented; first: string; last: string; glowed: boolean };

/**
 * Level 7: judge the name in the two full cards. A wrong name counts, up to two an ask; the second glows the head and the
 * last card (one hint, unless Show a hint already counted it); a wrong name after that finishes the ask with the head last
 * and her detail first, with no further count.
 */
export function nameIt(s: GlueState): NameOutcome {
  const ask = currentAsk(s);
  const [first, last] = s.slots;
  if (!ask?.invented || !first || !last) return { kind: 'ignore' };
  const row = ask.invented;
  if (judgeName(row, first, last).kind === 'right') {
    advance(s);
    return { kind: 'right', row, first };
  }
  if (s.wrongDrops >= 2) {
    // Her detail stays first: the first card holding one, else the first detail on the table.
    const mine = s.slots.find((k) => k !== null && row.details.includes(k));
    const chosen = mine ?? ask.pictures.find((k) => row.details.includes(k))!;
    advance(s);
    return { kind: 'assist', row, first: chosen };
  }
  s.wrongDrops++;
  s.misses++;
  s.slots = [null, null];
  let glowed = false;
  if (s.wrongDrops >= 2 && !s.glow) {
    s.glow = true;
    s.hints++;
    glowed = true;
  }
  return { kind: 'wrong', row, first, last, glowed };
}

/* The table ------------------------------------------------------------------------------------ */

export interface Pt {
  x: number;
  y: number;
}

/** A picture card's side, and the made thing's size when it appears. */
export const CARD = 150;
export const MADE = 210;
/** Level 4: the one big picture, and the thing it makes, at the table's centre. */
export const BIG = 300;
/** The shelf's things along the top. */
export const SHELF = 84;
/** How far from a picture's centre a drop still lands on it. */
export const DROP_R = 140;

/**
 * Where the pictures sit for two (level 1), three (level 2) or four (level 3: the head in the middle, its three
 * first parts left, right and below) pictures, clear of the home button and the guide's corner.
 */
export function tableLayout(v: View, n: number): Pt[] {
  const cx = v.w / 2;
  if (n <= 2) {
    const y = v.h * 0.55;
    return [
      { x: cx - 170, y },
      { x: cx + 170, y },
    ].slice(0, n);
  }
  if (n === 3) {
    const y = v.h * 0.55;
    return [
      { x: cx - 260, y },
      { x: cx, y },
      { x: cx + 260, y },
    ];
  }
  const y = v.h * 0.48;
  return [
    { x: cx, y },
    { x: cx - 300, y },
    { x: cx + 300, y },
    { x: cx, y: y + 215 },
  ];
}

/**
 * Level 5: the made thing at the top of the table, below the shelf, and its two parts side by side under it. The same
 * arrangement serves a sideways and an upright view; a taller view opens the gap a little.
 */
export function kindLayout(v: View): { made: Pt; parts: [Pt, Pt] } {
  const cx = v.w / 2;
  const top = Math.max(250, Math.min(v.h * 0.34, 520));
  const y = top + MADE / 2 + CARD / 2 + Math.max(24, Math.min(v.h * 0.06, 70));
  return {
    made: { x: cx, y: top },
    parts: [
      { x: cx - 150, y },
      { x: cx + 150, y },
    ],
  };
}

/** Level 9: the base tile sits between the two meaning cups in one centred row. */
export function endingLayout(v: View): { made: Pt; tiles: [Pt, Pt, Pt] } {
  const { made, parts } = kindLayout(v);
  const dx = CARD + 30;
  const y = parts[0].y;
  return {
    made,
    tiles: [
      { x: made.x, y },
      { x: made.x - dx, y },
      { x: made.x + dx, y },
    ],
  };
}

export function reversedLayout(v: View): Pt[] {
  if (!v.upright) return tableLayout(v, 2);
  const y = Math.max(360, Math.min(v.h * 0.36, 540));
  return [
    { x: v.w / 2, y },
    { x: v.w / 2, y: y + MADE + 46 },
  ];
}

/**
 * Level 7: the thing to name at the top of the table below the shelf, the two name cards under it with a pause dot between,
 * and the three pictures in a row under those. The column is centred, so it clears Home and the guide's corner in a
 * sideways and an upright view; a taller view opens the gaps and centres the column in the room below the shelf.
 */
export function nameLayout(v: View): { made: Pt; cards: [Pt, Pt]; dot: Pt; tiles: [Pt, Pt, Pt] } {
  const cx = v.w / 2;
  const top = 130,
    bottom = v.h - 20;
  const content = MADE + CARD + CARD;
  const gap = Math.max(16, Math.min((bottom - top - content) / 3, 80));
  const start = top + Math.max(gap, (bottom - top - content - 2 * gap) / 2);
  const madeY = start + MADE / 2;
  const cardY = madeY + MADE / 2 + gap + CARD / 2;
  const tileY = cardY + CARD + gap;
  const cardDx = CARD / 2 + 30;
  const tileDx = CARD + 24;
  return {
    made: { x: cx, y: madeY },
    cards: [
      { x: cx - cardDx, y: cardY },
      { x: cx + cardDx, y: cardY },
    ],
    dot: { x: cx, y: cardY },
    tiles: [
      { x: cx - tileDx, y: tileY },
      { x: cx, y: tileY },
      { x: cx + tileDx, y: tileY },
    ],
  };
}

/** The centre of the table, where a made thing appears. */
export const tableCentre = (v: View, n: number): Pt =>
  n === 4 ? tableLayout(v, 4)[0] : { x: v.w / 2, y: v.h * 0.55 };

/** The shelf's slots along the top, one per ask. */
export const PAIRED_SHELF = 68;

export function shelfLayout(v: View, n: number, paired = false): Pt[] {
  if (paired) {
    // Two pairs per row, with a wider gap between pairs than within them.
    const offsets = [-132, -54, 54, 132];
    return Array.from({ length: n * 2 }, (_, i) => ({
      x: v.w / 2 + offsets[i % 4],
      y: 78 + Math.floor(i / 4) * 78,
    }));
  }
  const gap = SHELF + 16;
  return Array.from({ length: n }, (_, i) => ({ x: v.w / 2 + (i - (n - 1) / 2) * gap, y: 78 }));
}

/** The picture a drop at (x, y) lands on: the nearest within reach other than its own, among `targets`, or null. */
export function dropTarget(
  points: readonly Pt[],
  own: number,
  x: number,
  y: number,
  targets?: readonly number[],
): number | null {
  let best: number | null = null;
  let bestD = DROP_R;
  points.forEach((p, i) => {
    if (i === own || (targets && !targets.includes(i))) return;
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}
