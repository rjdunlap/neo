import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Look It Up: a picture guide of seven real animals. Level 1 touches the labels on a page to hear them; level 2 finds a
 * hungry visitor's page by its tab and gives it the food the page shows; level 3 also finds the right row of the fact box
 * (Eats or Where) before helping. The facts are real: each row keeps the sources it was checked against.
 */
export type AnimalId = 'cow' | 'pig' | 'duck' | 'rabbit' | 'bear' | 'frog' | 'penguin';
export type Row = 'eats' | 'where' | 'baby';
export type Picture =
  | 'grass'
  | 'rootPlant'
  | 'seeds'
  | 'berries'
  | 'snail'
  | 'fish'
  | 'field'
  | 'mudPen'
  | 'pond'
  | 'burrow'
  | 'den'
  | 'rockyBeach'
  | 'calf'
  | 'piglet'
  | 'duckling'
  | 'kit'
  | 'cub'
  | 'tadpole'
  | 'chick';

/** The word on a label tag for each picture (level 1), printed and spoken. */
export const PICTURE_WORDS: Record<Picture, string> = {
  grass: 'grass',
  rootPlant: 'plants',
  seeds: 'seeds',
  berries: 'berries',
  snail: 'snails',
  fish: 'fish',
  field: 'field',
  mudPen: 'mud',
  pond: 'pond',
  burrow: 'burrow',
  den: 'den',
  rockyBeach: 'beach',
  calf: 'calf',
  piglet: 'piglet',
  duckling: 'duckling',
  kit: 'kit',
  cub: 'cub',
  tadpole: 'tadpole',
  chick: 'chick',
};

export interface Fact {
  line: string;
  picture: Picture;
  /** At least two opened sources per fact, so a reader can check it. */
  sources: string[];
  /** The pet's question for this row (eats and where only), before "Let's look it up!". */
  ask?: string;
}

export interface Animal {
  id: AnimalId;
  /** The page title, printed and spoken. */
  title: string;
  /** How a sentence names it: "What does a {kind} eat?" */
  kind: string;
  rows: Record<Row, Fact>;
}

const S = {
  sfDocents: 'https://www.sfzoodocents.org/notebook/FactSheets/MAMMALIA/ARTIODACTYLA/CattleDomestic.pdf',
  zooKidsCows: 'https://nationalzoo.si.edu/node/11298',
  zooCow: 'https://nationalzoo.si.edu/node/6882',
  mnPig: 'https://mnzoo.org/blog/animals/pig',
  eriePig: 'https://www.eriezoo.org/animal-areas/barn-area/pot-bellied-pig',
  ngPig: 'https://kids.nationalgeographic.com/animals/mammals/facts/pig',
  moPig: 'https://extension.missouri.edu/news/sweating-like-a-pig',
  audMallard: 'https://www.audubon.org/field-guide/bird/mallard',
  massMallard: 'https://www.massaudubon.org/nature-wildlife/birds/mallards',
  rspbMallard: 'https://www.rspb.org.uk/birds-and-wildlife/mallard',
  ngMallard: 'https://kids.nationalgeographic.com/animals/birds/facts/mallard-duck',
  ptes: 'https://ptes.org/get-informed/facts-figures/rabbit/',
  ypte: 'https://ypte.org.uk/factsheets/rabbit/print',
  rspca: 'https://www.rspca.org.uk/adviceandwelfare/pets/rabbits/diet/myths',
  wtRabbit: 'https://www.wildlifetrusts.org/wildlife-explorer/mammals/rabbit',
  npsKefj: 'https://home.nps.gov/kefj/learn/nature/brown-bear.htm',
  npsBears: 'https://www.nps.gov/subjects/bears/brown-bears.htm',
  ngBear: 'https://kids.nationalgeographic.com/animals/mammals/facts/brown-bear',
  wtFrog: 'https://www.wildlifetrusts.org/wildlife-explorer/amphibians/common-frog',
  froglife: 'https://www.froglife.org/info-advice/amphibians-and-reptiles/common-frog-2/',
  woodland:
    'https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/animals/reptiles-and-amphibians/common-frog/',
  sdzPenguin: 'https://ielc.libguides.com/sdzg/factsheets/africanpenguin',
  lpPenguin: 'https://www.lpzoo.org/wp-content/uploads/2020/06/Penguins-Fact-Sheet-2016-FINAL-1.pdf',
  mdPenguin: 'https://www.marylandzoo.org/animal/african-penguin/',
};

export const ANIMALS: Record<AnimalId, Animal> = {
  cow: {
    id: 'cow',
    title: 'Cow',
    kind: 'cow',
    rows: {
      eats: {
        line: 'Cows eat grass.',
        picture: 'grass',
        sources: [S.sfDocents, S.zooKidsCows],
        ask: 'Cow is hungry. What does a cow eat?',
      },
      where: {
        line: 'Cows live in a grassy field.',
        picture: 'field',
        sources: [S.sfDocents, S.zooKidsCows],
        ask: 'Cow wants some fresh air. Where do cows live?',
      },
      baby: { line: 'A baby cow is called a calf.', picture: 'calf', sources: [S.sfDocents, S.zooCow] },
    },
  },
  pig: {
    id: 'pig',
    title: 'Pig',
    kind: 'pig',
    rows: {
      eats: {
        line: 'Pigs eat plants, roots and bugs.',
        picture: 'rootPlant',
        sources: [S.mnPig, S.eriePig, S.ngPig],
        ask: 'Pig is hungry. What does a pig eat?',
      },
      where: {
        line: 'Pigs roll in mud to keep cool.',
        picture: 'mudPen',
        sources: [S.ngPig, S.moPig, S.mnPig],
        ask: 'Pig is hot. Where can a pig keep cool?',
      },
      baby: { line: 'A baby pig is called a piglet.', picture: 'piglet', sources: [S.ngPig, S.mnPig] },
    },
  },
  duck: {
    id: 'duck',
    title: 'Duck',
    kind: 'duck',
    rows: {
      eats: {
        line: 'Ducks eat seeds and water plants.',
        picture: 'seeds',
        sources: [S.audMallard, S.massMallard],
        ask: 'Duck is hungry. What does a duck eat?',
      },
      where: {
        line: 'Ducks live near ponds and lakes.',
        picture: 'pond',
        sources: [S.rspbMallard, S.ngMallard],
        ask: 'Duck wants a swim. Where do ducks live?',
      },
      baby: {
        line: 'A baby duck is called a duckling.',
        picture: 'duckling',
        sources: [S.rspbMallard, S.audMallard],
      },
    },
  },
  rabbit: {
    id: 'rabbit',
    title: 'Rabbit',
    kind: 'rabbit',
    rows: {
      eats: {
        line: 'Rabbits eat grass.',
        picture: 'grass',
        sources: [S.ptes, S.ypte, S.rspca],
        ask: 'Rabbit is hungry. What does a rabbit eat?',
      },
      where: {
        line: 'Rabbits live in a burrow under the ground.',
        picture: 'burrow',
        sources: [S.wtRabbit, S.ptes],
        ask: 'Rabbit wants to go home. Where do rabbits live?',
      },
      baby: {
        line: 'A baby rabbit is called a kitten, or kit.',
        picture: 'kit',
        sources: [S.ptes, S.wtRabbit],
      },
    },
  },
  bear: {
    id: 'bear',
    title: 'Brown bear',
    kind: 'brown bear',
    rows: {
      eats: {
        line: 'Brown bears eat berries, grass and roots, and sometimes fish.',
        picture: 'berries',
        sources: [S.npsKefj, S.npsBears],
        ask: 'Bear is hungry. What does a brown bear eat?',
      },
      where: {
        line: 'A brown bear sleeps in a den all winter.',
        picture: 'den',
        sources: [S.npsBears, S.ngBear],
        ask: 'Bear is sleepy. Where does a brown bear sleep in winter?',
      },
      baby: { line: 'A baby bear is called a cub.', picture: 'cub', sources: [S.npsKefj, S.ngBear] },
    },
  },
  frog: {
    id: 'frog',
    title: 'Frog',
    kind: 'frog',
    rows: {
      eats: {
        line: 'Frogs eat slugs, snails and bugs.',
        picture: 'snail',
        sources: [S.wtFrog, S.froglife],
        ask: 'Frog is hungry. What does a frog eat?',
      },
      where: {
        line: 'Frogs lay their eggs in a pond.',
        picture: 'pond',
        sources: [S.wtFrog, S.froglife],
        ask: 'Frog has eggs to lay. Where does a frog lay its eggs?',
      },
      baby: { line: 'A baby frog is called a tadpole.', picture: 'tadpole', sources: [S.wtFrog, S.woodland] },
    },
  },
  penguin: {
    id: 'penguin',
    title: 'African penguin',
    kind: 'penguin',
    rows: {
      eats: {
        line: 'African penguins catch fish in the sea.',
        picture: 'fish',
        sources: [S.sdzPenguin, S.lpPenguin, S.mdPenguin],
        ask: 'Penguin is hungry. What does a penguin eat?',
      },
      where: {
        line: 'African penguins live on a rocky beach.',
        picture: 'rockyBeach',
        sources: [S.sdzPenguin, S.mdPenguin],
        ask: 'Penguin wants to rest. Where do African penguins live?',
      },
      baby: {
        line: 'A baby penguin is called a chick.',
        picture: 'chick',
        sources: [S.sdzPenguin, S.mdPenguin],
      },
    },
  },
};

export const ANIMAL_IDS = Object.keys(ANIMALS) as AnimalId[];

export interface LookPlan {
  /**
   * 'labels' touches words; 'page' finds a page, then a food; 'row' finds the page, the row, then the thing; 'contents'
   * finds the page from a contents page in a fixed book, with printed captions; 'baby' reads the baby's name on its page
   * and gives the baby its printed name tag; 'share' reads the visitor's page, then finds another page that says the
   * same thing, and brings that friend.
   */
  mode: 'labels' | 'page' | 'row' | 'contents' | 'baby' | 'share';
  name: string;
}
export const PLANS: LookPlan[] = [
  { mode: 'labels', name: 'Talking labels: touch a word on the page to hear it' },
  { mode: 'page', name: "Find the page: tap the visitor's tab, then give it the food" },
  { mode: 'row', name: 'The fact box: find the page and the row, then help' },
  { mode: 'contents', name: "Contents page: find the animal's name and page, then help" },
  { mode: 'baby', name: "Picture or words? Read the baby's name, then give it its tag" },
  { mode: 'share', name: 'Two pages together: find who shares a fact with the visitor' },
];

export const LEVELS: BandLevels = {
  toddler: { min: 1, max: 1 },
  preschool: { min: 1, max: 2 },
  prek: { min: 2, max: 3 },
  school: { min: 3, max: 6 },
};
export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export interface Visit {
  animal: AnimalId;
  row: Row;
  /** Level 6: the question (an index into `SHARES`), the accepted friend offered and the two offered as wrong. */
  share?: ShareVisit;
}
export interface ShareVisit {
  q: number;
  friend: AnimalId;
  wrong: AnimalId[];
}
/** A page of the guide: an animal's, or (levels 4 and up) the contents page. */
export type Page = AnimalId | 'contents';
export interface Round {
  level: number;
  /**
   * The round's animals: at levels 1–3 the tabs, in tab order (level 1: its three pages, in the order they turn); from
   * level 4 the three visitors, whose pictures or name tags are the choices, while the book holds every page.
   */
  tabs: AnimalId[];
  visits: Visit[];
  /** The page the guide opens on. */
  open: Page;
  /** 'tabs' at levels 1–3; from level 4 a fixed book with a contents page and one Contents button. */
  book: 'tabs' | 'contents';
}

/** The fixed book's pages from level 4, in the fact table's order: Cow is page 1, African penguin page 7. */
export const PAGE_ORDER: readonly AnimalId[] = ANIMAL_IDS;
export const pageNumber = (id: AnimalId) => PAGE_ORDER.indexOf(id) + 1;
/** The modes that use the fixed book, with the level whose authored first round each plays. */
const CONTENTS_MODES = { contents: 4, baby: 5, share: 6 } as const;
export const usesContents = (level: number) => planFor(level).mode in CONTENTS_MODES;

const factOf = (animal: AnimalId, row: Row) => ANIMALS[animal].rows[row];
export const pictureOf = (v: Visit) => factOf(v.animal, v.row).picture;
export const askOf = (v: Visit) => (v.share ? SHARES[v.share.q].ask : factOf(v.animal, v.row).ask!);

/** What the scene offers and the visitor is given: a picture or name tag, or (level 6) a friend. */
export type ChoiceKey = Picture | AnimalId;
/** The visit's one right choice: its picture (or baby's name tag), or at level 6 the accepted friend offered. */
export const rightOf = (v: Visit): ChoiceKey => v.share?.friend ?? pictureOf(v);

/**
 * Level 6's questions: a source page and row, asked without the fact, so she reads the page to learn the key word and
 * then finds another page whose same row says it. `never` holds the animals that are left out because the fact may be
 * true of them in life though their caption does not say it; every other animal is accepted (its caption has the word)
 * or may be offered as wrong.
 */
export interface Share {
  source: AnimalId;
  row: 'eats' | 'where';
  ask: string;
  key: string;
  never: AnimalId[];
}
export const SHARES: readonly Share[] = [
  {
    source: 'cow',
    row: 'eats',
    ask: 'Cow wants a lunch friend. Who else eats what a cow eats?',
    key: 'grass',
    never: ['pig', 'duck'],
  },
  {
    source: 'rabbit',
    row: 'eats',
    ask: 'Rabbit wants a lunch friend. Who else eats what a rabbit eats?',
    key: 'grass',
    never: ['pig', 'duck'],
  },
  {
    source: 'frog',
    row: 'eats',
    ask: 'Frog wants a lunch friend. Who else eats what a frog eats?',
    key: 'bugs',
    never: ['duck', 'bear'],
  },
  {
    source: 'penguin',
    row: 'eats',
    ask: 'Penguin wants a lunch friend. Who else eats what an African penguin eats?',
    key: 'fish',
    never: ['duck', 'pig'],
  },
  {
    source: 'duck',
    row: 'where',
    ask: 'Duck is going home. Who else needs that kind of place?',
    key: 'pond',
    never: ['pig'],
  },
  {
    source: 'frog',
    row: 'where',
    ask: 'Frog is going to lay eggs. Who else needs that kind of place?',
    key: 'pond',
    never: ['pig'],
  },
];

/** Whether a caption says the key word: a whole word, with a plural allowed ("ponds" says pond; "grassy" is not grass). */
export const says = (line: string, key: string) => new RegExp(`\\b${key}s?\\b`, 'i').test(line);

/** Every other animal whose same row says the share's key word, computed from the fact table. */
export const acceptedFor = (share: Share): AnimalId[] =>
  ANIMAL_IDS.filter((id) => id !== share.source && says(factOf(id, share.row).line, share.key));

/** The animals that may be offered as wrong: neither the source, accepted, nor left out. */
export const offeredFor = (share: Share): AnimalId[] => {
  const accepted = acceptedFor(share);
  return ANIMAL_IDS.filter(
    (id) => id !== share.source && !accepted.includes(id) && !share.never.includes(id),
  );
};

/** Three animals whose chosen rows show different pictures, so a picture means one animal's answer. */
function pickTabs(rows: Row[], rng: Rng): AnimalId[] {
  const tabs: AnimalId[] = [];
  for (const id of rng.shuffle([...ANIMAL_IDS])) {
    if (tabs.every((t) => rows.every((r) => factOf(t, r).picture !== factOf(id, r).picture))) tabs.push(id);
    if (tabs.length === 3) break;
  }
  return tabs;
}

/**
 * Level 5's visitors: never duck with penguin (a duckling is also called a chick, so a chick tag would be wrongly
 * wrong), and at most one of pig and duck (piglet and duckling give the parent away).
 */
export function babyVisitorsOk(ids: readonly AnimalId[]): boolean {
  if (ids.includes('duck') && ids.includes('penguin')) return false;
  return !(ids.includes('pig') && ids.includes('duck'));
}

/** Each level's authored first round (levels 4 to 6): visitors and rows in order; the guide opens on the contents page. */
export const AUTHORED: Record<4 | 5 | 6, readonly Visit[]> = {
  4: [
    { animal: 'pig', row: 'where' },
    { animal: 'penguin', row: 'eats' },
    { animal: 'rabbit', row: 'where' },
  ],
  5: [
    { animal: 'rabbit', row: 'baby' },
    { animal: 'frog', row: 'baby' },
    { animal: 'bear', row: 'baby' },
  ],
  6: [
    { animal: 'cow', row: 'eats', share: { q: 0, friend: 'rabbit', wrong: ['frog', 'penguin'] } },
    { animal: 'penguin', row: 'eats', share: { q: 3, friend: 'bear', wrong: ['cow', 'frog'] } },
    { animal: 'duck', row: 'where', share: { q: 4, friend: 'frog', wrong: ['rabbit', 'bear'] } },
  ],
};

/** Level 6: three questions with three different key words, the frog visiting at most once. */
function shareVisits(rng: Rng): Visit[] {
  for (;;) {
    const picked: number[] = [];
    for (const q of rng.shuffle(SHARES.map((_, i) => i)))
      if (picked.every((p) => SHARES[p].key !== SHARES[q].key)) picked.push(q);
    const qs = picked.slice(0, 3);
    if (qs.filter((q) => SHARES[q].source === 'frog').length > 1) continue;
    return qs.map((q) => {
      const s = SHARES[q];
      return {
        animal: s.source,
        row: s.row,
        share: { q, friend: rng.pick(acceptedFor(s)), wrong: rng.shuffle(offeredFor(s)).slice(0, 2) },
      };
    });
  }
}

export function makeRound(level: number, rng: Rng, authored = false): Round {
  const mode = planFor(level).mode;
  if (mode === 'labels') {
    const tabs = rng.shuffle([...ANIMAL_IDS]).slice(0, 3);
    return { level, tabs, visits: [], open: tabs[0], book: 'tabs' };
  }
  if (mode === 'contents' || mode === 'baby' || mode === 'share') {
    let visits: Visit[];
    if (authored) visits = AUTHORED[CONTENTS_MODES[mode]].map((v) => structuredClone(v));
    else if (mode === 'share') visits = shareVisits(rng);
    else if (mode === 'baby') {
      let ids = rng.shuffle([...ANIMAL_IDS]).slice(0, 3);
      while (!babyVisitorsOk(ids)) ids = rng.shuffle([...ANIMAL_IDS]).slice(0, 3);
      visits = ids.map((animal) => ({ animal, row: 'baby' as const }));
    } else {
      const ids = rng.shuffle(pickTabs(['eats', 'where'], rng));
      const rows = rng.shuffle(['eats', 'where', rng.chance(0.5) ? 'eats' : 'where'] as Row[]);
      visits = ids.map((animal, i) => ({ animal, row: rows[i] }));
    }
    return { level, tabs: visits.map((v) => v.animal), visits, open: 'contents', book: 'contents' };
  }
  const tabs = pickTabs(mode === 'page' ? ['eats'] : ['eats', 'where'], rng);
  const order = rng.shuffle([...tabs]);
  let rows: Row[] = order.map(() => 'eats');
  if (mode === 'row') {
    rows = rng.shuffle(['eats', 'where', rng.chance(0.5) ? 'eats' : 'where'] as ('eats' | 'where')[]);
  }
  const visits = order.map((animal, i) => ({ animal, row: rows[i] }));
  // The guide never opens on the first visitor's page, so finding it is always a turn.
  const open = rng.pick(tabs.filter((t) => t !== visits[0].animal));
  return { level, tabs, visits, open, book: 'tabs' };
}

/**
 * What the scene offers for a visit, in a seeded order: each visitor's (or tab animal's) picture for the asked row, or at
 * level 6 the three friends.
 */
export function choicesFor(round: Round, visit: Visit, rng: Rng): ChoiceKey[] {
  if (visit.share) return rng.shuffle([visit.share.friend, ...visit.share.wrong]);
  return rng.shuffle(round.tabs.map((t) => factOf(t, visit.row).picture));
}

export type Verdict = { kind: 'right' } | { kind: 'wrong'; owner: AnimalId } | { kind: 'ignore' };

/**
 * A choice is right if it is the visitor's own picture for the asked row, or at level 6 the accepted friend; a wrong one
 * names whose it is (a wrong friend is its own owner).
 */
export function check(round: Round, visit: Visit, choice: ChoiceKey | null): Verdict {
  if (!choice) return { kind: 'ignore' };
  if (choice === rightOf(visit)) return { kind: 'right' };
  if (visit.share)
    return visit.share.wrong.includes(choice as AnimalId)
      ? { kind: 'wrong', owner: choice as AnimalId }
      : { kind: 'ignore' };
  const owner = round.tabs.find((t) => factOf(t, visit.row).picture === choice);
  return owner ? { kind: 'wrong', owner } : { kind: 'ignore' };
}

export type Hint =
  | { kind: 'tab'; animal: AnimalId }
  | { kind: 'contents' }
  | { kind: 'line'; animal: AnimalId }
  | { kind: 'row'; row: Row }
  | { kind: 'choice'; choice: ChoiceKey };

/**
 * Levels 1–3: the tab while another page is open. From level 4: the Contents button while another animal's page is
 * open, the visitor's line on the contents page. Then, from level 3, the asked row until it has been touched; then the
 * answer (a picture, or at level 5 the name tag of the baby's picture).
 *
 * Level 6 walks two pages: the visitor's own, then the accepted friend's, each to its asked row, then the friend. `read`
 * holds the pages whose asked row has been touched this visit (it survives page turns); it decides which page the next
 * step points to.
 */
export function hintFor(
  round: Round,
  visit: Visit,
  open: Page,
  rowSeen: boolean,
  read: ReadonlySet<AnimalId> = new Set(),
): Hint {
  if (visit.share) {
    const page = [visit.animal, visit.share.friend].find((p) => !read.has(p));
    if (!page) return { kind: 'choice', choice: visit.share.friend };
    if (open === page) return { kind: 'row', row: visit.row };
    return open === 'contents' ? { kind: 'line', animal: page } : { kind: 'contents' };
  }
  if (open !== visit.animal) {
    if (round.book === 'tabs') return { kind: 'tab', animal: visit.animal };
    return open === 'contents' ? { kind: 'line', animal: visit.animal } : { kind: 'contents' };
  }
  if (planFor(round.level).mode !== 'page' && !rowSeen) return { kind: 'row', row: visit.row };
  return { kind: 'choice', choice: pictureOf(visit) };
}

/** The distinct wrong choices counted as misses: one per choice per visitor. */
export const countsAsMiss = (seen: ReadonlySet<ChoiceKey>, choice: ChoiceKey) => !seen.has(choice);

/** Wrong tries before the glow, and before the pet finishes the visit herself. */
export const GLOW_AFTER = 2;
export const HELP_AFTER = 4;

/**
 * One visitor's accounting, shared by every level: a miss once per distinct wrong choice, at most one hint (from the
 * glow after `GLOW_AFTER` wrong tries, or Show a hint), and the supported finish after `HELP_AFTER` wrong tries.
 */
export class VisitTally {
  misses = 0;
  hints = 0;
  attempts = 0;
  glow = false;
  private readonly seen = new Set<ChoiceKey>();

  /** A wrong choice given to the visitor: whether the glow has just come on, and whether the pet now finishes the visit. */
  wrong(choice: ChoiceKey): { firstGlow: boolean; help: boolean } {
    this.attempts++;
    if (countsAsMiss(this.seen, choice)) {
      this.seen.add(choice);
      this.misses++;
    }
    const firstGlow = this.attempts >= GLOW_AFTER && this.hint();
    return { firstGlow, help: this.attempts >= HELP_AFTER };
  }

  /** The glow goes on (after two wrong tries, or Show a hint); true when it was off, so its first step can be said. */
  hint(): boolean {
    this.hints = 1;
    const first = !this.glow;
    this.glow = true;
    return first;
  }
}

/** Overlapping drops go to the nearest target within reach. */
export function nearestPoint(points: { x: number; y: number }[], x: number, y: number, reach = 200): number {
  let best = -1;
  let dist = reach;
  points.forEach((p, i) => {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d <= dist) {
      best = i;
      dist = d;
    }
  });
  return best;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface GuideLayout {
  book: Rect;
  /** Tab faces, top to bottom (landscape) or in a column beside the book (portrait too). */
  tabs: Rect[];
  /** Fact-box rows, top to bottom, inside the book. */
  rows: Rect[];
  /** Where the visitor stands. */
  visitor: { x: number; y: number };
  /** Choices (basket foods or places, or name tags). */
  choices: Rect[];
  /** The contents page's seven lines in page order (empty without `contents`). */
  lines: Rect[];
}

export const TAB = 110;
export const ROW_H = 100;
export const CHOICE = 130;
const PET_CORNER = { w: 160, h: 170 };

/**
 * The contents page's lines: a 50-unit title band (70 upright, so the first line clears Home and the help button as
 * the rows do), then 100-unit lines in two columns with 8-unit gaps.
 */
export const LINE_GAP = 8;
const contentsTop = (landscape: boolean) => (landscape ? 50 : 70);

/**
 * Book and tabs on one side, the scene with its basket on the other; the bottom-left pet stays clear. With `contents`
 * (levels 4 and up) the tab column holds the one Contents button and the book is tall enough for the contents page's
 * seven lines: three on the left (above the pet corner in landscape) and four on the right, or four and three upright.
 */
export function guideLayout(view: View, rowCount = 3, choiceCount = 3, contents = false): GuideLayout {
  const { w, h } = view;
  const landscape = w >= h;
  const tabs: Rect[] = [];
  const choices: Rect[] = [];
  const rows: Rect[] = [];
  let book: Rect;
  let visitor: { x: number; y: number };
  if (landscape) {
    const bookW = Math.min(w * 0.46, 520);
    book = { x: 30, y: 100, w: bookW, h: Math.min(h - 100 - PET_CORNER.h, 100 + rowCount * ROW_H + 40) };
    book.h = Math.max(book.h, 70 + rowCount * ROW_H + 20);
    if (contents) book.h = Math.max(book.h, contentsTop(landscape) + 4 * ROW_H + 3 * LINE_GAP + 20);
    const tx = book.x + book.w + 6;
    for (let i = 0; i < (contents ? 1 : 3); i++)
      tabs.push({ x: tx, y: book.y + 10 + i * (TAB + 14), w: TAB, h: TAB });
    const sceneX = tx + TAB + 24;
    const sceneW = w - sceneX - 20;
    visitor = { x: sceneX + sceneW / 2, y: 330 };
    for (let i = 0; i < choiceCount; i++) {
      choices.push({
        x: sceneX + (sceneW - CHOICE) / 2,
        y: h - 20 - (choiceCount - i) * (CHOICE + 6) + 6,
        w: CHOICE,
        h: CHOICE,
      });
    }
  } else {
    // Upright, the first row starts below Home and the "?" column (y 210); the book's title sits beside them.
    book = { x: 20, y: 140, w: w - 20 - TAB - 30, h: 70 + rowCount * ROW_H + 20 };
    if (contents) book.h = Math.max(book.h, contentsTop(landscape) + 4 * ROW_H + 3 * LINE_GAP + 20);
    const tx = book.x + book.w + 6;
    for (let i = 0; i < (contents ? 1 : 3); i++)
      tabs.push({ x: tx, y: book.y + 10 + i * (TAB + 14), w: TAB, h: TAB });
    const top = book.y + book.h + 20;
    visitor = { x: Math.max(120, w * 0.2), y: top + 210 };
    const gap = 14;
    const rowW = choiceCount * CHOICE + (choiceCount - 1) * gap;
    const startX = Math.max(PET_CORNER.w + 10, w - 20 - rowW);
    for (let i = 0; i < choiceCount; i++) {
      choices.push({ x: startX + i * (CHOICE + gap), y: h - 30 - CHOICE - 60, w: CHOICE, h: CHOICE });
    }
  }
  for (let i = 0; i < rowCount; i++)
    rows.push({ x: book.x + 14, y: book.y + 70 + i * ROW_H, w: book.w - 28, h: ROW_H });
  const lines: Rect[] = [];
  if (contents) {
    const colW = (book.w - 28 - LINE_GAP) / 2;
    const left = landscape ? 3 : 4;
    PAGE_ORDER.forEach((_, i) => {
      const col = i < left ? 0 : 1;
      const k = col === 0 ? i : i - left;
      lines.push({
        x: book.x + 14 + col * (colW + LINE_GAP),
        y: book.y + contentsTop(landscape) + k * (ROW_H + LINE_GAP),
        w: colW,
        h: ROW_H,
      });
    });
  }
  return { book, tabs, rows, visitor, choices, lines };
}

/** What the ghost finger does next: the right tab, the asked row at level 3, then the right choice (a look at another tab first at level 2 is the how-to's). */
export type LookMove =
  | { tab: AnimalId }
  | { contents: true }
  | { line: AnimalId }
  | { row: Row }
  | { label: number }
  | { choice: ChoiceKey };

export function lookTouch(
  round: Round,
  state: { visitor: number; open: Page; rowSeen: boolean; touched: number; read?: ReadonlySet<AnimalId> },
): LookMove | null {
  const mode = planFor(round.level).mode;
  if (mode === 'labels') return state.touched < 3 ? { label: state.touched } : null;
  const visit = round.visits[state.visitor];
  if (!visit) return null;
  const hint = hintFor(round, visit, state.open, state.rowSeen, state.read);
  if (hint.kind === 'tab') return { tab: hint.animal };
  if (hint.kind === 'contents') return { contents: true };
  if (hint.kind === 'line') return { line: hint.animal };
  if (hint.kind === 'row') return { row: hint.row };
  return { choice: hint.choice };
}
