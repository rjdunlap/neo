/**
 * Maker Lane: a bundle walks a lane of makers' stalls and changes at each one, from something growing to a scarf, a sock,
 * a loaf or a box. Level 1 sends it to the waving maker, level 2 to whichever maker can use it now (a maker who can't shows
 * the form they need in a thought bubble), and level 3 starts from the finished thing and asks where it began. One table is
 * the whole rule: maker k of a chain accepts form k and gives form k + 1. Chains, rounds, accounting and layout live here
 * so tests can check them.
 */
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export type Chain = 'wool' | 'cotton' | 'wheat' | 'tree';
export const CHAINS: readonly Chain[] = ['wool', 'cotton', 'wheat', 'tree'];

export type Form =
  | 'sheep'
  | 'fleece'
  | 'cleanFleece'
  | 'yarn'
  | 'scarf'
  | 'cottonPlant'
  | 'bolls'
  | 'cleanCotton'
  | 'thread'
  | 'sock'
  | 'wheatField'
  | 'sheaf'
  | 'grain'
  | 'flour'
  | 'loaf'
  | 'tree'
  | 'log'
  | 'chips'
  | 'pulp'
  | 'box'
  /** Levels 4–5 only: old paper, a beginning that skips the chipper. In no chain. */
  | 'oldPaper';

/** Each chain's five forms: the living beginning, three middle forms and the product. */
export const FORMS: Record<Chain, readonly Form[]> = {
  wool: ['sheep', 'fleece', 'cleanFleece', 'yarn', 'scarf'],
  cotton: ['cottonPlant', 'bolls', 'cleanCotton', 'thread', 'sock'],
  wheat: ['wheatField', 'sheaf', 'grain', 'flour', 'loaf'],
  tree: ['tree', 'log', 'chips', 'pulp', 'box'],
};

export type Step = 1 | 2 | 3 | 4;
export type Job =
  | 'shearer'
  | 'washer'
  | 'spinner'
  | 'weaver'
  | 'picker'
  | 'cleaner'
  | 'threadSpinner'
  | 'knitter'
  | 'cutter'
  | 'thresher'
  | 'miller'
  | 'baker'
  | 'woodcutter'
  | 'chipper'
  | 'pulper'
  | 'presser'
  /** Level 4's dyer: in no chain, so the 1–3 graph is unchanged. */
  | 'dyer';
export type Tool =
  | 'shears'
  | 'tub'
  | 'wheel'
  | 'loom'
  | 'bag'
  | 'comb'
  | 'spindle'
  | 'needles'
  | 'sickle'
  | 'flail'
  | 'millstone'
  | 'oven'
  | 'saw'
  | 'chipperBox'
  | 'vat'
  | 'press'
  | 'dyePots';

export interface Maker {
  chain: Chain;
  step: Step;
  job: Job;
  tool: Tool;
  accepts: Form;
  gives: Form;
}

const JOBS: Record<Chain, readonly [Job, Tool][]> = {
  wool: [
    ['shearer', 'shears'],
    ['washer', 'tub'],
    ['spinner', 'wheel'],
    ['weaver', 'loom'],
  ],
  cotton: [
    ['picker', 'bag'],
    ['cleaner', 'comb'],
    ['threadSpinner', 'spindle'],
    ['knitter', 'needles'],
  ],
  wheat: [
    ['cutter', 'sickle'],
    ['thresher', 'flail'],
    ['miller', 'millstone'],
    ['baker', 'oven'],
  ],
  tree: [
    ['woodcutter', 'saw'],
    ['chipper', 'chipperBox'],
    ['pulper', 'vat'],
    ['presser', 'press'],
  ],
};

export const MAKERS: readonly Maker[] = CHAINS.flatMap((chain) =>
  JOBS[chain].map(([job, tool], k) => ({
    chain,
    step: (k + 1) as Step,
    job,
    tool,
    accepts: FORMS[chain][k],
    gives: FORMS[chain][k + 1],
  })),
);

export const makerOf = (chain: Chain, step: Step): Maker =>
  MAKERS.find((m) => m.chain === chain && m.step === step)!;
/** The one maker who can use this form, or null for a product. */
export const makerFor = (form: Form): Maker | null => MAKERS.find((m) => m.accepts === form) ?? null;
export const nextForm = (form: Form): Form | null => makerFor(form)?.gives ?? null;
export const chainOf = (form: Form): Chain => CHAINS.find((c) => FORMS[c].includes(form))!;
/** 0 for the beginning, 4 for the product. */
export const stageOf = (form: Form): number => FORMS[chainOf(form)].indexOf(form);
export const productOf = (chain: Chain): Form => FORMS[chain][4];
export const isProduct = (form: Form) => stageOf(form) === 4;

// Level 3: finished things and where they began --------------------------------------------------------------------

export type Thing = 'sock' | 'box' | 'loaf' | 'scarf';
export const THINGS: readonly Thing[] = ['sock', 'box', 'loaf', 'scarf'];
export type Card = 'sheep' | 'cottonPlant' | 'wheatField' | 'tree' | 'cow' | 'hen' | 'factory';

export const CARDS_FOR: Record<Thing, { right: Card; tempting: Card; pool: readonly Card[] }> = {
  sock: { right: 'cottonPlant', tempting: 'sheep', pool: ['tree', 'wheatField', 'factory'] },
  box: { right: 'tree', tempting: 'factory', pool: ['sheep', 'cottonPlant', 'wheatField'] },
  loaf: { right: 'wheatField', tempting: 'cow', pool: ['hen', 'tree', 'sheep'] },
  scarf: { right: 'sheep', tempting: 'cottonPlant', pool: ['tree', 'wheatField', 'hen'] },
};

/** What a beginning card makes when it walks the lane: its chain's product, milk or an egg (no maker step), or nothing. */
export type CardResult = Form | 'milk' | 'egg' | null;
export function cardResult(card: Card): CardResult {
  if (card === 'cow') return 'milk';
  if (card === 'hen') return 'egg';
  if (card === 'factory') return null;
  return productOf(chainOf(card));
}
/** The chain a card walks, or null for the cow, the hen and the factory, which never take a maker step. */
export const cardChain = (card: Card): Chain | null =>
  card === 'cow' || card === 'hen' || card === 'factory' ? null : chainOf(card);

// Levels -------------------------------------------------------------------------------------------------------------

export const LEVELS: BandLevels = {
  toddler: { min: 1, max: 1 },
  preschool: { min: 1, max: 2 },
  prek: { min: 2, max: 3 },
  school: { min: 2, max: 5 },
};
export const LEVEL_NAMES: Record<number, string> = {
  1: 'Along the lane',
  2: 'Who can use it now?',
  3: 'Where did it begin?',
  4: 'Stripes or plain',
  5: 'Two ways to a box',
};
export const clampLevel = (level: number) => Math.max(1, Math.min(5, Math.round(level))) as 1 | 2 | 3 | 4 | 5;
/** Levels 1, 2, 4 and 5 are a lane of stalls the bundle walks; level 3 is the card question. */
export const isLaneLevel = (level: number) => clampLevel(level) !== 3;
/** Levels 4 and 5 branch: the level-2 layout, with the branching state machine below. */
export const isBranchLevel = (level: number) => clampLevel(level) >= 4;
/** How many stalls a level's lane has. */
export const stallCount = (level: number) => (clampLevel(level) === 1 || clampLevel(level) === 3 ? 4 : 3);

// Rounds -------------------------------------------------------------------------------------------------------------

/** A bundle to carry along the lane: its chain, the stalls left to right, and the form it starts as. */
export interface Bundle {
  chain: Chain;
  stalls: readonly Maker[];
  start: Form;
}
export interface Question {
  thing: Thing;
  cards: readonly Card[];
}
export type Round =
  { level: 1 | 2; bundles: readonly Bundle[] } | { level: 3; questions: readonly Question[] };

const steps = (chain: Chain, order: readonly Step[]) => order.map((s) => makerOf(chain, s));

/** Level 2's three stalls (makers 2–4), never in chain order: the washer's slot is uniform, so the first carry's answer is too. */
export function stallOrder(rng: Rng): Step[] {
  const slot = rng.int(0, 2);
  const rest: Step[] = slot === 0 ? [4, 3] : rng.shuffle<Step>([3, 4]);
  rest.splice(slot, 0, 2);
  return rest;
}

const bundle = (level: 1 | 2, chain: Chain, order: readonly Step[]): Bundle => ({
  chain,
  stalls: steps(chain, order),
  start: FORMS[chain][level === 1 ? 0 : 1],
});

/** Level 3 cards: the right beginning, the tempting wrong one and one from the pool, in a seeded order. */
const question = (thing: Thing, rng: Rng): Question => {
  const c = CARDS_FOR[thing];
  return { thing, cards: rng.shuffle([c.right, c.tempting, rng.pick(c.pool)]) };
};

/** Each level's authored first round: wool then wheat; wool (weaver, washer, spinner) then tree; the sock, box and loaf. */
export const AUTHORED: { 1: Round; 2: Round; 3: Round } = {
  1: { level: 1, bundles: [bundle(1, 'wool', [1, 2, 3, 4]), bundle(1, 'wheat', [1, 2, 3, 4])] },
  2: { level: 2, bundles: [bundle(2, 'wool', [4, 2, 3]), bundle(2, 'tree', [3, 4, 2])] },
  3: {
    level: 3,
    questions: [
      { thing: 'sock', cards: ['sheep', 'tree', 'cottonPlant'] },
      { thing: 'box', cards: ['tree', 'factory', 'wheatField'] },
      { thing: 'loaf', cards: ['cow', 'wheatField', 'hen'] },
    ],
  },
};

export function roundFor(level: number, rng: Rng, authored = false): Round {
  const l = Math.min(3, clampLevel(level)) as 1 | 2 | 3;
  if (authored) return AUTHORED[l];
  if (l === 3)
    return {
      level: 3,
      questions: rng
        .shuffle([...THINGS])
        .slice(0, 3)
        .map((t) => question(t, rng)),
    };
  const chains = rng.shuffle([...CHAINS]).slice(0, 2);
  return { level: l, bundles: chains.map((c) => bundle(l, c, l === 1 ? [1, 2, 3, 4] : stallOrder(rng))) };
}

// Accounting ---------------------------------------------------------------------------------------------------------

export type Target = { kind: 'stall'; i: number } | { kind: 'card'; i: number };

export type Outcome =
  /** The maker worked: the bundle is now `to`; `finished` when it became the product, `done` when the round is over. */
  | { kind: 'made'; maker: Maker; from: Form; to: Form; finished: boolean; done: boolean }
  /** Level 3's right card: the thing is found. */
  | { kind: 'began'; question: Question; card: Card; done: boolean }
  /** One miss: a maker who can't use it yet (their bubble goes up), or a wrong card (it dims). `glow` when it lit the glow. */
  | { kind: 'miss'; glow: boolean; maker?: Maker; card?: Card }
  /** Never counted: why it was free. */
  | { kind: 'free'; why: 'notme' | 'bubble' | 'worked' | 'dimmed' | 'over' };

export class Play {
  /** The bundle or question in play. */
  index = 0;
  misses = 0;
  hints = 0;
  /** Misses on the current bundle (across its steps) or question. */
  itemMisses = 0;
  /** The answer is glowing (two misses or Show me; levels 2 and 3). */
  glowing = false;
  /** The current bundle's form (levels 1–2). */
  form: Form;
  /** Stalls whose thought bubble is up for the present form. */
  readonly bubbles = new Set<number>();
  /** Level 3 cards already tried on this question. */
  readonly dimmed = new Set<number>();
  private helped = false;

  constructor(readonly round: Round) {
    this.form = round.level === 3 ? 'sheep' : round.bundles[0].start;
  }

  get level() {
    return this.round.level;
  }
  get count() {
    return this.round.level === 3 ? this.round.questions.length : this.round.bundles.length;
  }
  get done() {
    return this.index >= this.count;
  }
  get bundle(): Bundle | null {
    return this.round.level === 3 ? null : this.round.bundles[Math.min(this.index, this.count - 1)];
  }
  get question(): Question | null {
    return this.round.level === 3 ? this.round.questions[Math.min(this.index, this.count - 1)] : null;
  }

  /** The stall whose maker can use the bundle now, or the right card. */
  target(): Target | null {
    if (this.done) return null;
    if (this.round.level === 3) {
      const q = this.question!;
      return { kind: 'card', i: q.cards.indexOf(CARDS_FOR[q.thing].right) };
    }
    const i = this.bundle!.stalls.findIndex((m) => m.accepts === this.form);
    return i < 0 ? null : { kind: 'stall', i };
  }

  /** A maker who has done their step has stepped aside; their stall is no longer a target. */
  worked(i: number): boolean {
    const m = this.bundle?.stalls[i];
    return !!m && m.step <= stageOf(this.form);
  }

  /** Send the bundle to stall `i` (a tap or a drop). */
  send(i: number): Outcome {
    const b = this.bundle;
    if (this.done || !b || !b.stalls[i]) return { kind: 'free', why: 'over' };
    if (this.worked(i)) return { kind: 'free', why: 'worked' };
    const maker = b.stalls[i];
    if (maker.accepts === this.form) {
      const from = this.form;
      this.form = maker.gives;
      this.bubbles.clear();
      this.glowing = false;
      const finished = isProduct(this.form);
      if (finished) this.next();
      return { kind: 'made', maker, from, to: maker.gives, finished, done: this.done };
    }
    if (this.round.level === 1) return { kind: 'free', why: 'notme' };
    if (this.bubbles.has(i)) return { kind: 'free', why: 'bubble' };
    this.bubbles.add(i);
    return { kind: 'miss', glow: this.miss(), maker };
  }

  /** Level 3: tap beginning card `i`. */
  pick(i: number): Outcome {
    const q = this.question;
    if (this.done || !q || !q.cards[i]) return { kind: 'free', why: 'over' };
    if (this.dimmed.has(i)) return { kind: 'free', why: 'dimmed' };
    const card = q.cards[i];
    if (card === CARDS_FOR[q.thing].right) {
      this.next();
      return { kind: 'began', question: q, card, done: this.done };
    }
    this.dimmed.add(i);
    return { kind: 'miss', glow: this.miss(), card };
  }

  /** Show me (levels 2 and 3): the same glow as two misses, counted once per bundle or question. False when nothing changed. */
  requestHint(): boolean {
    if (this.round.level === 1 || this.done || this.glowing) return false;
    this.light();
    return true;
  }

  private miss(): boolean {
    this.misses++;
    this.itemMisses++;
    if (this.itemMisses < 2 || this.glowing) return false;
    this.light();
    return true;
  }

  private light() {
    this.glowing = true;
    if (!this.helped) {
      this.helped = true;
      this.hints++;
    }
  }

  private next() {
    this.index++;
    this.itemMisses = 0;
    this.glowing = false;
    this.helped = false;
    this.bubbles.clear();
    this.dimmed.clear();
    if (!this.done && this.round.level !== 3) this.form = this.round.bundles[this.index].start;
  }
}

// Layout -------------------------------------------------------------------------------------------------------------

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
/** A stall's target: the maker and their tool (levels 1–2), and the smaller watched stalls of level 3. */
export const STALL_W = 160,
  STALL_H = 220,
  STALL_GAP = 28;
export const SMALL_W = 120,
  SMALL_H = 165,
  SMALL_GAP = 16;
export const BUNDLE = 130,
  SMALL_BUNDLE = 96;
export const BUBBLE_W = 120,
  BUBBLE_H = 100;
export const FRAME = 220,
  CARD = 200,
  CARD_GAP = 24;
/** The space in front of a stall where the bundle waits. */
export const PATH_H = 150;
/** The pet's bottom-left corner and the Home button's top-left corner, kept clear. */
export const PET_CORNER = 150,
  HOME_CORNER = 120;

export interface MakerLaneLayout {
  portrait: boolean;
  /** The beginning spot (the sheep's pen, the plant, the field, the tree): slot 0 of the lane. */
  begin: Rect;
  /** The stalls, in the round's order. */
  stalls: Rect[];
  /** Where the bundle waits in front of the beginning (0) and each stall (k + 1): its centre. */
  spots: { x: number; y: number }[];
  bundle: number;
  /** Level 3: the asked thing's frame and the three beginning cards. */
  frame: Rect | null;
  cards: Rect[];
  /** How many lane rows (two in portrait at levels 1–2 and 4–5). */
  rows: number;
  /** Level 4: the wanted scarf's picture bubble, in the pet's corner (not a target); null at every other level. */
  order: Rect | null;
}

/** The order bubble's side. */
export const ORDER = 120;

export function makerLaneLayout(view: { w: number; h: number }, level: number): MakerLaneLayout {
  const L = laneLayout(view, level);
  if (clampLevel(level) !== 4) return { ...L, order: null };
  // Landscape: bottom-left beside the pet. Upright: in the empty half of the lane's second row, above the pet.
  const order = L.portrait
    ? {
        x: L.stalls[0].x + (STALL_W - ORDER) / 2,
        y: L.begin.y + STALL_H + PATH_H + 30 + 30,
        w: ORDER,
        h: ORDER,
      }
    : { x: PET_CORNER + 24, y: view.h - 24 - ORDER, w: ORDER, h: ORDER };
  return { ...L, order };
}

function laneLayout(view: { w: number; h: number }, level: number): Omit<MakerLaneLayout, 'order'> {
  const l = clampLevel(level);
  const portrait = view.h > view.w;
  const cx = view.w / 2;
  const n = stallCount(l);
  if (l === 3) {
    // A watched lane across the middle, the asked thing top-right and three cards along the bottom.
    const slots = 1 + n;
    const rowW = slots * SMALL_W + (slots - 1) * SMALL_GAP;
    const frame = { x: view.w - 24 - FRAME, y: 24, w: FRAME, h: FRAME };
    const laneY = frame.y + FRAME + 24;
    const x0 = cx - rowW / 2;
    const rects = Array.from({ length: slots }, (_, k) => ({
      x: x0 + k * (SMALL_W + SMALL_GAP),
      y: laneY,
      w: SMALL_W,
      h: SMALL_H,
    }));
    const spotY = laneY + SMALL_H + SMALL_BUNDLE / 2 + 6;
    const spots = rects.map((r) => ({ x: r.x + r.w / 2, y: spotY }));
    const cardsW = 3 * CARD + 2 * CARD_GAP;
    // Landscape: the cards start right of the pet's corner. Portrait: centred, above it.
    const cy = portrait ? view.h - PET_CORNER - 24 - CARD : view.h - 24 - CARD;
    const cardX = portrait ? cx - cardsW / 2 : Math.max(PET_CORNER + 24, cx - cardsW / 2);
    const cards = [0, 1, 2].map((k) => ({ x: cardX + k * (CARD + CARD_GAP), y: cy, w: CARD, h: CARD }));
    return {
      portrait,
      begin: rects[0],
      stalls: rects.slice(1),
      spots,
      bundle: SMALL_BUNDLE,
      frame,
      cards,
      rows: 1,
    };
  }
  const slots = 1 + n;
  const rowH = STALL_H + PATH_H;
  if (!portrait) {
    const rowW = slots * STALL_W + (slots - 1) * STALL_GAP;
    const y = Math.max(HOME_CORNER, (view.h - rowH) / 2 - 20);
    const x0 = cx - rowW / 2;
    const rects = Array.from({ length: slots }, (_, k) => ({
      x: x0 + k * (STALL_W + STALL_GAP),
      y,
      w: STALL_W,
      h: STALL_H,
    }));
    const spots = rects.map((r) => ({ x: r.x + r.w / 2, y: r.y + STALL_H + PATH_H / 2 }));
    return {
      portrait,
      begin: rects[0],
      stalls: rects.slice(1),
      spots,
      bundle: BUNDLE,
      frame: null,
      cards: [],
      rows: 1,
    };
  }
  // Portrait: three columns; the beginning and two stalls left to right, then the rest right to left beneath, so the
  // lane bends and its end stays clear of the pet's corner.
  const gap = 40;
  const colW = 3 * STALL_W + 2 * gap;
  const x0 = cx - colW / 2;
  const colX = (c: number) => x0 + c * (STALL_W + gap);
  const vgap = 30;
  const top = Math.max(HOME_CORNER, (view.h - 2 * rowH - vgap) / 2 - 30);
  const rects: Rect[] = [];
  for (let k = 0; k < slots; k++) {
    const row = k < 3 ? 0 : 1;
    const col = row === 0 ? k : 2 - (k - 3);
    rects.push({ x: colX(col), y: top + row * (rowH + vgap), w: STALL_W, h: STALL_H });
  }
  const spots = rects.map((r) => ({ x: r.x + r.w / 2, y: r.y + STALL_H + PATH_H / 2 }));
  return {
    portrait,
    begin: rects[0],
    stalls: rects.slice(1),
    spots,
    bundle: BUNDLE,
    frame: null,
    cards: [],
    rows: 2,
  };
}

/** The stall whose rect holds (x, y), or -1: a drop anywhere else floats home, free. */
export function stallAt(layout: MakerLaneLayout, x: number, y: number): number {
  return layout.stalls.findIndex(
    (r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h + PATH_H * 0.5,
  );
}

// Levels 4 and 5: a path can branch ------------------------------------------------------------------------------------

export type Colour = 'red' | 'blue' | 'yellow' | 'green';
export const COLOURS: readonly Colour[] = ['red', 'blue', 'yellow', 'green'];

/** A stall at levels 4–5: a job and its tool (the dyer is in no chain). */
export type Stall = Pick<Maker, 'job' | 'tool'>;
const SPINNER: Stall = { job: 'spinner', tool: 'wheel' };
const DYER: Stall = { job: 'dyer', tool: 'dyePots' };
const WEAVER: Stall = { job: 'weaver', tool: 'loom' };
const CHIPPER: Stall = { job: 'chipper', tool: 'chipperBox' };
const PULPER: Stall = { job: 'pulper', tool: 'vat' };
const PRESSER: Stall = { job: 'presser', tool: 'press' };
const STALLS_4 = [SPINNER, DYER, WEAVER] as const;
const STALLS_5 = [CHIPPER, PULPER, PRESSER] as const;

/** Level 4's wanted scarf: one colour, or two-colour stripes. */
export type Order =
  { kind: 'plain'; colour: Colour } | { kind: 'stripes'; colours: readonly [Colour, Colour] };

/** One bundle on the path: the stalls of its order, what it starts as, and the colour the dyer will give it (level 4). */
export interface Item {
  stalls: readonly Stall[];
  start: Form;
  order: Order | null;
  dye: Colour | null;
  /** The second bundle of a striped order (the weaver is holding the first one's yarn). */
  second: boolean;
}
export interface BranchRound {
  level: 4 | 5;
  items: readonly Item[];
}

const plainItems = (stalls: readonly Stall[], colour: Colour): Item[] => {
  const order: Order = { kind: 'plain', colour };
  return [{ stalls, start: 'cleanFleece', order, dye: colour, second: false }];
};
const stripeItems = (stalls: readonly Stall[], colours: readonly [Colour, Colour]): Item[] => {
  const order: Order = { kind: 'stripes', colours };
  return colours.map((c, k) => ({ stalls, start: 'cleanFleece', order, dye: c, second: k === 1 }));
};
const boxItems = (stalls: readonly Stall[], first: 'log' | 'oldPaper'): Item[] =>
  (first === 'log' ? (['log', 'oldPaper'] as const) : (['oldPaper', 'log'] as const)).map((start) => ({
    stalls,
    start,
    order: null,
    dye: null,
    second: false,
  }));

export const AUTHORED_BRANCH: Record<4 | 5, BranchRound> = {
  4: {
    level: 4,
    items: [
      ...plainItems([SPINNER, WEAVER, DYER], 'red'),
      ...stripeItems([DYER, SPINNER, WEAVER], ['red', 'blue']),
    ],
  },
  5: { level: 5, items: boxItems([PULPER, CHIPPER, PRESSER], 'log') },
};

export function branchRoundFor(level: 4 | 5, rng: Rng, authored = false): BranchRound {
  if (authored) return AUTHORED_BRANCH[level];
  if (level === 5)
    return { level, items: boxItems(rng.shuffle([...STALLS_5]), rng.pick(['log', 'oldPaper'])) };
  const [a, b] = rng.shuffle([...COLOURS]);
  const plain = plainItems(rng.shuffle([...STALLS_4]), rng.pick(COLOURS));
  const stripes = stripeItems(rng.shuffle([...STALLS_4]), [a, b]);
  return { level, items: rng.pick([true, false]) ? [...plain, ...stripes] : [...stripes, ...plain] };
}

/** What a maker who can't use the bundle needs, for the thought bubble, and the line they say. */
export interface Need {
  form: Form;
  /** A coloured form (the bubble tints it); null for the plain form. */
  colour: Colour | null;
  line: 'notyet.wool.4' | 'notyet.stripes' | 'notyet.oldpaper' | 'notyet.tree.3' | 'notyet.tree.4';
}

export type BranchOutcome =
  /** The maker worked. `holds`: the weaver kept the first striped yarn; `orderDone`: a whole order or box is finished. */
  | {
      kind: 'made';
      job: Job;
      from: Form;
      to: Form;
      colour: Colour | null;
      /** The form the dyer worked on, for naming the route (null if the dyer has not worked on this bundle). */
      dyedAt: Form | null;
      holds: boolean;
      finished: boolean;
      orderDone: boolean;
      done: boolean;
    }
  /** One miss: this maker can't use the bundle yet (their bubble goes up). `glow` when it lit the glow. */
  | { kind: 'miss'; glow: boolean; job: Job; need: Need }
  | { kind: 'free'; why: 'bubble' | 'worked' | 'over' };

/** Levels 4 and 5: the load is a form and a colour; every stall that can use it is right, so more than one route works. */
export class BranchPlay {
  index = 0;
  misses = 0;
  hints = 0;
  itemMisses = 0;
  glowing = false;
  form: Form;
  /** The bundle's colour once the dyer has worked on it. */
  colour: Colour | null = null;
  /** The form the dyer worked on (for the route line). */
  dyedAt: Form | null = null;
  /** The weaver is holding this yarn (the first of a striped order). */
  held: Colour | null = null;
  readonly bubbles = new Set<number>();
  private helped = false;

  constructor(readonly round: BranchRound) {
    this.form = round.items[0].start;
  }

  get level() {
    return this.round.level;
  }
  get count() {
    return this.round.items.length;
  }
  get done() {
    return this.index >= this.count;
  }
  get item(): Item {
    return this.round.items[Math.min(this.index, this.count - 1)];
  }
  get striped() {
    return this.item.order?.kind === 'stripes';
  }

  private jobAt(i: number): Job | null {
    return this.item.stalls[i]?.job ?? null;
  }

  /** Whether the stall's job can use the bundle now. */
  accepts(job: Job): boolean {
    switch (job) {
      case 'dyer':
        return this.colour === null;
      case 'spinner':
        return this.form === 'cleanFleece';
      case 'weaver':
        return this.form === 'yarn' && (!this.striped || this.colour !== null);
      case 'chipper':
        return this.form === 'log';
      case 'pulper':
        return this.form === 'chips' || this.form === 'oldPaper';
      case 'presser':
        return this.form === 'pulp';
      default:
        return false;
    }
  }

  /** A maker who has done their step for this bundle has stepped aside. */
  worked(i: number): boolean {
    switch (this.jobAt(i)) {
      case 'dyer':
        return this.colour !== null;
      case 'spinner':
        return this.form !== 'cleanFleece';
      case 'weaver':
        return this.form === 'scarf';
      case 'chipper':
        return this.form !== 'log' && this.form !== 'oldPaper';
      case 'pulper':
        return this.form === 'pulp' || this.form === 'box';
      case 'presser':
        return this.form === 'box';
      default:
        return false;
    }
  }

  /** The one stall the glow lights: the dye-first route at level 4 (dyer, then spinner, then weaver). */
  glowFor(): number | null {
    if (this.done) return null;
    for (const job of ['dyer', 'spinner', 'weaver', 'chipper', 'pulper', 'presser'] as const) {
      const i = this.item.stalls.findIndex((s) => s.job === job);
      if (i >= 0 && !this.worked(i) && this.accepts(job)) return i;
    }
    return null;
  }

  private need(job: Job): Need {
    const dye = this.striped ? this.item.dye : null;
    switch (job) {
      case 'weaver':
        // Fleece: yarn first; plain yarn in a striped order: coloured yarn.
        return this.form === 'yarn'
          ? { form: 'yarn', colour: dye, line: 'notyet.stripes' }
          : { form: 'yarn', colour: dye, line: 'notyet.wool.4' };
      case 'chipper':
        return { form: 'log', colour: null, line: 'notyet.oldpaper' };
      case 'pulper':
        return { form: 'chips', colour: null, line: 'notyet.tree.3' };
      default:
        return { form: 'pulp', colour: null, line: 'notyet.tree.4' };
    }
  }

  /** Send the bundle to stall `i` (a tap or a drop). */
  send(i: number): BranchOutcome {
    const job = this.jobAt(i);
    if (this.done || !job) return { kind: 'free', why: 'over' };
    if (this.worked(i)) return { kind: 'free', why: 'worked' };
    if (!this.accepts(job)) {
      if (this.bubbles.has(i)) return { kind: 'free', why: 'bubble' };
      this.bubbles.add(i);
      return { kind: 'miss', glow: this.miss(), job, need: this.need(job) };
    }
    const from = this.form;
    let holds = false;
    let finished = false;
    let orderDone = false;
    switch (job) {
      case 'dyer':
        this.colour = this.item.dye;
        this.dyedAt = from;
        finished = from === 'scarf';
        break;
      case 'spinner':
        this.form = 'yarn';
        break;
      case 'weaver':
        if (this.striped && this.held === null) {
          holds = true;
          finished = true;
        } else {
          this.form = 'scarf';
          finished = this.striped || this.colour !== null;
        }
        break;
      case 'chipper':
        this.form = 'chips';
        break;
      case 'pulper':
        this.form = 'pulp';
        break;
      case 'presser':
        this.form = 'box';
        finished = true;
        break;
    }
    const colour = this.colour;
    const dyedAt = this.dyedAt;
    const to = this.form;
    this.bubbles.clear();
    this.glowing = false;
    if (finished) {
      orderDone = !holds;
      const heldNext = holds ? colour : null;
      this.next();
      this.held = heldNext;
    }
    return { kind: 'made', job, from, to, colour, dyedAt, holds, finished, orderDone, done: this.done };
  }

  /** Show me: the same glow as two misses, counted once per bundle. False when nothing changed. */
  requestHint(): boolean {
    if (this.done || this.glowing) return false;
    this.light();
    return true;
  }

  private miss(): boolean {
    this.misses++;
    this.itemMisses++;
    if (this.itemMisses < 2 || this.glowing) return false;
    this.light();
    return true;
  }

  private light() {
    this.glowing = true;
    if (!this.helped) {
      this.helped = true;
      this.hints++;
    }
  }

  private next() {
    this.index++;
    this.itemMisses = 0;
    this.glowing = false;
    this.helped = false;
    this.bubbles.clear();
    this.colour = null;
    this.dyedAt = null;
    this.held = null;
    if (!this.done) this.form = this.round.items[this.index].start;
  }
}
