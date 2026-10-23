import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/**
 * Look It Up: a picture guide of seven real animals. Level 1 touches the labels on a page to hear them; level 2 finds a
 * hungry visitor's page by its tab and gives it the food the page shows; level 3 also finds the right row of the fact box
 * (Eats or Where) before helping. The facts are real: each row keeps the sources it was checked against.
 */
export type AnimalId = 'cow' | 'pig' | 'duck' | 'rabbit' | 'bear' | 'frog' | 'penguin';
export type Row = 'eats' | 'where' | 'baby';
export type Picture =
  | 'grass' | 'rootPlant' | 'seeds' | 'berries' | 'snail' | 'fish'
  | 'field' | 'mudPen' | 'pond' | 'burrow' | 'den' | 'rockyBeach'
  | 'calf' | 'piglet' | 'duckling' | 'kit' | 'cub' | 'tadpole' | 'chick';

/** The word on a label tag for each picture (level 1), printed and spoken. */
export const PICTURE_WORDS: Record<Picture, string> = {
  grass: 'grass', rootPlant: 'plants', seeds: 'seeds', berries: 'berries', snail: 'snails', fish: 'fish',
  field: 'field', mudPen: 'mud', pond: 'pond', burrow: 'burrow', den: 'den', rockyBeach: 'beach',
  calf: 'calf', piglet: 'piglet', duckling: 'duckling', kit: 'kit', cub: 'cub', tadpole: 'tadpole', chick: 'chick',
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
  woodland: 'https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/animals/reptiles-and-amphibians/common-frog/',
  sdzPenguin: 'https://ielc.libguides.com/sdzg/factsheets/africanpenguin',
  lpPenguin: 'https://www.lpzoo.org/wp-content/uploads/2020/06/Penguins-Fact-Sheet-2016-FINAL-1.pdf',
  mdPenguin: 'https://www.marylandzoo.org/animal/african-penguin/',
};

export const ANIMALS: Record<AnimalId, Animal> = {
  cow: {
    id: 'cow', title: 'Cow', kind: 'cow',
    rows: {
      eats: { line: 'Cows eat grass.', picture: 'grass', sources: [S.sfDocents, S.zooKidsCows], ask: 'Cow is hungry. What does a cow eat?' },
      where: { line: 'Cows live in a grassy field.', picture: 'field', sources: [S.sfDocents, S.zooKidsCows], ask: 'Cow wants some fresh air. Where do cows live?' },
      baby: { line: 'A baby cow is called a calf.', picture: 'calf', sources: [S.sfDocents, S.zooCow] },
    },
  },
  pig: {
    id: 'pig', title: 'Pig', kind: 'pig',
    rows: {
      eats: { line: 'Pigs eat plants, roots and bugs.', picture: 'rootPlant', sources: [S.mnPig, S.eriePig, S.ngPig], ask: 'Pig is hungry. What does a pig eat?' },
      where: { line: 'Pigs roll in mud to keep cool.', picture: 'mudPen', sources: [S.ngPig, S.moPig, S.mnPig], ask: 'Pig is hot. Where can a pig keep cool?' },
      baby: { line: 'A baby pig is called a piglet.', picture: 'piglet', sources: [S.ngPig, S.mnPig] },
    },
  },
  duck: {
    id: 'duck', title: 'Duck', kind: 'duck',
    rows: {
      eats: { line: 'Ducks eat seeds and water plants.', picture: 'seeds', sources: [S.audMallard, S.massMallard], ask: 'Duck is hungry. What does a duck eat?' },
      where: { line: 'Ducks live near ponds and lakes.', picture: 'pond', sources: [S.rspbMallard, S.ngMallard], ask: 'Duck wants a swim. Where do ducks live?' },
      baby: { line: 'A baby duck is called a duckling.', picture: 'duckling', sources: [S.rspbMallard, S.audMallard] },
    },
  },
  rabbit: {
    id: 'rabbit', title: 'Rabbit', kind: 'rabbit',
    rows: {
      eats: { line: 'Rabbits eat grass.', picture: 'grass', sources: [S.ptes, S.ypte, S.rspca], ask: 'Rabbit is hungry. What does a rabbit eat?' },
      where: { line: 'Rabbits live in a burrow under the ground.', picture: 'burrow', sources: [S.wtRabbit, S.ptes], ask: 'Rabbit wants to go home. Where do rabbits live?' },
      baby: { line: 'A baby rabbit is called a kitten, or kit.', picture: 'kit', sources: [S.ptes, S.wtRabbit] },
    },
  },
  bear: {
    id: 'bear', title: 'Brown bear', kind: 'brown bear',
    rows: {
      eats: { line: 'Brown bears eat berries, grass and roots, and sometimes fish.', picture: 'berries', sources: [S.npsKefj, S.npsBears], ask: 'Bear is hungry. What does a brown bear eat?' },
      where: { line: 'A brown bear sleeps in a den all winter.', picture: 'den', sources: [S.npsBears, S.ngBear], ask: 'Bear is sleepy. Where does a brown bear sleep in winter?' },
      baby: { line: 'A baby bear is called a cub.', picture: 'cub', sources: [S.npsKefj, S.ngBear] },
    },
  },
  frog: {
    id: 'frog', title: 'Frog', kind: 'frog',
    rows: {
      eats: { line: 'Frogs eat slugs, snails and bugs.', picture: 'snail', sources: [S.wtFrog, S.froglife], ask: 'Frog is hungry. What does a frog eat?' },
      where: { line: 'Frogs lay their eggs in a pond.', picture: 'pond', sources: [S.wtFrog, S.froglife], ask: 'Frog has eggs to lay. Where does a frog lay its eggs?' },
      baby: { line: 'A baby frog is called a tadpole.', picture: 'tadpole', sources: [S.wtFrog, S.woodland] },
    },
  },
  penguin: {
    id: 'penguin', title: 'African penguin', kind: 'penguin',
    rows: {
      eats: { line: 'African penguins catch fish in the sea.', picture: 'fish', sources: [S.sdzPenguin, S.lpPenguin, S.mdPenguin], ask: 'Penguin is hungry. What does a penguin eat?' },
      where: { line: 'African penguins live on a rocky beach.', picture: 'rockyBeach', sources: [S.sdzPenguin, S.mdPenguin], ask: 'Penguin wants to rest. Where do African penguins live?' },
      baby: { line: 'A baby penguin is called a chick.', picture: 'chick', sources: [S.sdzPenguin, S.mdPenguin] },
    },
  },
};

export const ANIMAL_IDS = Object.keys(ANIMALS) as AnimalId[];

export interface LookPlan {
  /** 'labels' touches words; 'page' finds a page, then a food; 'row' finds the page, the row, then the thing. */
  mode: 'labels' | 'page' | 'row';
  name: string;
}
export const PLANS: LookPlan[] = [
  { mode: 'labels', name: 'Talking labels: touch a word on the page to hear it' },
  { mode: 'page', name: 'Find the page: tap the visitor\'s tab, then give it the food' },
  { mode: 'row', name: 'The fact box: find the page and the row, then help' },
];
export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export interface Visit { animal: AnimalId; row: 'eats' | 'where' }
export interface Round {
  level: number;
  /** The animals on the tabs, in tab order (level 1: its three pages, in the order they turn). */
  tabs: AnimalId[];
  visits: Visit[];
  /** The page the guide opens on. */
  open: AnimalId;
}

const factOf = (animal: AnimalId, row: Row) => ANIMALS[animal].rows[row];
export const pictureOf = (v: Visit) => factOf(v.animal, v.row).picture;
export const askOf = (v: Visit) => factOf(v.animal, v.row).ask!;

/** Three animals whose chosen rows show different pictures, so a picture means one animal's answer. */
function pickTabs(rows: Row[], rng: Rng): AnimalId[] {
  const tabs: AnimalId[] = [];
  for (const id of rng.shuffle([...ANIMAL_IDS])) {
    if (tabs.every((t) => rows.every((r) => factOf(t, r).picture !== factOf(id, r).picture))) tabs.push(id);
    if (tabs.length === 3) break;
  }
  return tabs;
}

export function makeRound(level: number, rng: Rng): Round {
  const mode = planFor(level).mode;
  if (mode === 'labels') {
    const tabs = rng.shuffle([...ANIMAL_IDS]).slice(0, 3);
    return { level, tabs, visits: [], open: tabs[0] };
  }
  const tabs = pickTabs(mode === 'page' ? ['eats'] : ['eats', 'where'], rng);
  const order = rng.shuffle([...tabs]);
  let rows: ('eats' | 'where')[] = order.map(() => 'eats');
  if (mode === 'row') {
    rows = rng.shuffle(['eats', 'where', rng.chance(0.5) ? 'eats' : 'where'] as ('eats' | 'where')[]);
  }
  const visits = order.map((animal, i) => ({ animal, row: rows[i] }));
  // The guide never opens on the first visitor's page, so finding it is always a turn.
  const open = rng.pick(tabs.filter((t) => t !== visits[0].animal));
  return { level, tabs, visits, open };
}

/** What the scene offers for a visit: each tab animal's picture for the asked row, in a seeded order. */
export function choicesFor(round: Round, visit: Visit, rng: Rng): Picture[] {
  return rng.shuffle(round.tabs.map((t) => factOf(t, visit.row).picture));
}

export type Verdict = { kind: 'right' } | { kind: 'wrong'; owner: AnimalId } | { kind: 'ignore' };

/** A choice is right if it is the visitor's own picture for the asked row; a wrong one names whose it is. */
export function check(round: Round, visit: Visit, choice: Picture | null): Verdict {
  if (!choice) return { kind: 'ignore' };
  if (choice === pictureOf(visit)) return { kind: 'right' };
  const owner = round.tabs.find((t) => factOf(t, visit.row).picture === choice);
  return owner ? { kind: 'wrong', owner } : { kind: 'ignore' };
}

export type Hint = { kind: 'tab'; animal: AnimalId } | { kind: 'row'; row: 'eats' | 'where' } | { kind: 'choice'; picture: Picture };

/** The tab while another page is open; then, at level 3, the asked row until it has been touched; then the answer. */
export function hintFor(round: Round, visit: Visit, open: AnimalId, rowSeen: boolean): Hint {
  if (open !== visit.animal) return { kind: 'tab', animal: visit.animal };
  if (planFor(round.level).mode === 'row' && !rowSeen) return { kind: 'row', row: visit.row };
  return { kind: 'choice', picture: pictureOf(visit) };
}

/** The distinct wrong choices counted as misses: one per choice per visitor. */
export const countsAsMiss = (seen: ReadonlySet<Picture>, choice: Picture) => !seen.has(choice);

/** Wrong tries before the glow, and before the pet finishes the visit herself. */
export const GLOW_AFTER = 2;
export const HELP_AFTER = 4;

/** Overlapping drops go to the nearest target within reach. */
export function nearestPoint(points: { x: number; y: number }[], x: number, y: number, reach = 200): number {
  let best = -1;
  let dist = reach;
  points.forEach((p, i) => {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d <= dist) { best = i; dist = d; }
  });
  return best;
}

export interface Rect { x: number; y: number; w: number; h: number }
export interface GuideLayout {
  book: Rect;
  /** Tab faces, top to bottom (landscape) or in a column beside the book (portrait too). */
  tabs: Rect[];
  /** Fact-box rows, top to bottom, inside the book. */
  rows: Rect[];
  /** Where the visitor stands. */
  visitor: { x: number; y: number };
  /** Choices (basket foods or places). */
  choices: Rect[];
}

export const TAB = 110;
export const ROW_H = 100;
export const CHOICE = 130;
const PET_CORNER = { w: 160, h: 170 };

/** Book and tabs on one side, the scene with its basket on the other; the bottom-left pet stays clear. */
export function guideLayout(view: View, rowCount = 3, choiceCount = 3): GuideLayout {
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
    const tx = book.x + book.w + 6;
    for (let i = 0; i < 3; i++) tabs.push({ x: tx, y: book.y + 10 + i * (TAB + 14), w: TAB, h: TAB });
    const sceneX = tx + TAB + 24;
    const sceneW = w - sceneX - 20;
    visitor = { x: sceneX + sceneW / 2, y: 330 };
    for (let i = 0; i < choiceCount; i++) {
      choices.push({ x: sceneX + (sceneW - CHOICE) / 2, y: h - 20 - (choiceCount - i) * (CHOICE + 6) + 6, w: CHOICE, h: CHOICE });
    }
  } else {
    book = { x: 20, y: 100, w: w - 20 - TAB - 30, h: 70 + rowCount * ROW_H + 20 };
    const tx = book.x + book.w + 6;
    for (let i = 0; i < 3; i++) tabs.push({ x: tx, y: book.y + 10 + i * (TAB + 14), w: TAB, h: TAB });
    const top = book.y + book.h + 20;
    visitor = { x: Math.max(120, w * 0.2), y: top + 210 };
    const gap = 14;
    const rowW = choiceCount * CHOICE + (choiceCount - 1) * gap;
    const startX = Math.max(PET_CORNER.w + 10, w - 20 - rowW);
    for (let i = 0; i < choiceCount; i++) {
      choices.push({ x: startX + i * (CHOICE + gap), y: h - 30 - CHOICE - 60, w: CHOICE, h: CHOICE });
    }
  }
  for (let i = 0; i < rowCount; i++) rows.push({ x: book.x + 14, y: book.y + 70 + i * ROW_H, w: book.w - 28, h: ROW_H });
  return { book, tabs, rows, visitor, choices };
}

/** What the ghost finger does next: the right tab, the asked row at level 3, then the right choice (a look at another tab first at level 2 is the how-to's). */
export type LookMove = { tab: AnimalId } | { row: Row } | { label: number } | { choice: Picture };

export function lookTouch(
  round: Round,
  state: { visitor: number; open: AnimalId; rowSeen: boolean; touched: number },
): LookMove | null {
  const mode = planFor(round.level).mode;
  if (mode === 'labels') return state.touched < 3 ? { label: state.touched } : null;
  const visit = round.visits[state.visitor];
  if (!visit) return null;
  const hint = hintFor(round, visit, state.open, state.rowSeen);
  if (hint.kind === 'tab') return { tab: hint.animal };
  if (hint.kind === 'row') return { row: hint.row };
  return { choice: hint.picture };
}
