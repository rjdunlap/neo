/**
 * Timeline Trail's rules: three made-up island places, each a run of four stages from long ago to now; a round names a
 * place and the stages in play; a line is the cards already hung in stage order; a gap is a space before, between or
 * after them. A card has exactly one valid gap (where it sorts among the hung cards), and a wrong gap answers with a
 * reason about what the picture shows. Level 4 hangs two places on one line: the shore and the tree grow side by side,
 * a card's number is its time on the shared line, and each card carries a clue, a little picture of the other place at
 * the same time, which is the only thing that orders one place's card against the other's. Level 5 grows one of two
 * later places (a village green, a bread oven) whose middle picture is the grandest, then asks which of three things is
 * still here in every picture: every stage lists what its picture `shows`, and an element in all of them is still here.
 * Everything here is pure; the scene draws it. Definitions: docs/definitions/timeline-trail.md (levels 1–4) and
 * docs/definitions/timeline-trail-5-7.md (level 5).
 */
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

// ——— Places and stages ———

export type PlaceId = 'shore' | 'tree' | 'nest' | 'green' | 'oven';
/** The three places of levels 1–3 (level 4 uses two of them). */
export const PLACE_IDS: readonly PlaceId[] = ['shore', 'tree', 'nest'];
/** The two places used only from level 5 on: in each, something grand is replaced by something plainer. */
export const LATER_PLACES = ['green', 'oven'] as const satisfies readonly PlaceId[];
export type LaterPlace = (typeof LATER_PLACES)[number];

export interface Stage {
  /** `<place>-<n>`; the voice line is `trail.card.<id>`. */
  id: string;
  /** What the picture shows, spoken and used in reasons. */
  caption: string;
  /** The element this stage has that the stage before it lacks (the first stage names what only it shows bare). */
  changes: string;
  /** The named elements this picture draws; one in every stage of a place is still here. */
  shows: readonly string[];
}

export interface Place {
  id: PlaceId;
  /** Spoken in "the life of one {place}". */
  name: string;
  /** Oldest first. */
  stages: readonly Stage[];
}

export const PLACES: Record<PlaceId, Place> = {
  shore: {
    id: 'shore',
    name: 'shore',
    stages: [
      {
        id: 'shore-0',
        caption: 'an empty shore with one rock',
        changes: 'bare sand and one rock',
        shows: ['rock'],
      },
      {
        id: 'shore-1',
        caption: 'a little dock on the shore',
        changes: 'little dock',
        shows: ['rock', 'dock'],
      },
      {
        id: 'shore-2',
        caption: 'the dock with a boat shed',
        changes: 'boat shed',
        shows: ['rock', 'dock', 'shed'],
      },
      {
        id: 'shore-3',
        caption: 'the dock with a boat and a lantern',
        changes: 'boat and lantern',
        shows: ['rock', 'dock', 'shed', 'boat', 'lantern'],
      },
    ],
  },
  tree: {
    id: 'tree',
    name: 'tree',
    stages: [
      { id: 'tree-0', caption: 'a sapling with two leaves', changes: 'tiny sapling', shows: ['sapling'] },
      {
        id: 'tree-1',
        caption: 'a young tree',
        changes: 'trunk and a small crown of leaves',
        shows: ['trunk', 'crown'],
      },
      { id: 'tree-2', caption: 'a big tree', changes: 'big round crown', shows: ['trunk', 'crown'] },
      {
        id: 'tree-3',
        caption: 'the big tree with a swing',
        changes: 'swing',
        shows: ['trunk', 'crown', 'swing'],
      },
    ],
  },
  nest: {
    id: 'nest',
    name: 'nest',
    stages: [
      { id: 'nest-0', caption: 'an egg in the nest', changes: 'egg', shows: ['nest', 'egg'] },
      {
        id: 'nest-1',
        caption: 'a hatchling in the nest',
        changes: 'hatchling',
        shows: ['nest', 'hatchling'],
      },
      {
        id: 'nest-2',
        caption: 'a young pet with a first scarf',
        changes: 'scarf',
        shows: ['nest', 'pet', 'scarf'],
      },
      {
        id: 'nest-3',
        caption: 'the pet now, at the treehouse door',
        changes: 'treehouse door',
        shows: ['pet', 'door'],
      },
    ],
  },
  // The later places: stage 1 is the grandest picture, and what tells stage 2 from it is the thing that only grows
  // (the tree, the vine), never the plain bench or table, so no reason ever says "newer has more".
  green: {
    id: 'green',
    name: 'village green',
    stages: [
      {
        id: 'green-0',
        caption: 'a green with a big rock and a sapling',
        changes: 'big rock and a sapling',
        shows: ['big rock', 'sapling'],
      },
      {
        id: 'green-1',
        caption: 'a grand merry-go-round on the green',
        changes: 'merry-go-round',
        shows: ['big rock', 'merry-go-round', 'flags', 'tree'],
      },
      {
        id: 'green-2',
        caption: 'a plain bench by a taller tree',
        changes: 'taller tree',
        shows: ['big rock', 'bench', 'tree'],
      },
      {
        id: 'green-3',
        caption: 'the bench with a flower bed and a big tree',
        changes: 'flower bed',
        shows: ['big rock', 'bench', 'flower bed', 'tree'],
      },
    ],
  },
  oven: {
    id: 'oven',
    name: 'bread oven',
    stages: [
      {
        id: 'oven-0',
        caption: 'a stone oven with a vine shoot',
        changes: 'stone oven and a vine shoot',
        shows: ['stone oven', 'vine shoot'],
      },
      {
        id: 'oven-1',
        caption: 'a fancy stall around the oven',
        changes: 'striped awning',
        shows: ['stone oven', 'striped awning', 'sign', 'bunting', 'vine'],
      },
      {
        id: 'oven-2',
        caption: 'a plain table beside the oven',
        changes: 'longer vine',
        shows: ['stone oven', 'table', 'vine'],
      },
      {
        id: 'oven-3',
        caption: 'the oven with a cat asleep on top',
        changes: 'sleeping cat',
        shows: ['stone oven', 'table', 'vine', 'sleeping cat'],
      },
    ],
  },
};

/** How much a picture shows: the count of its named elements. In the later places the grandest picture is not the newest. */
export const detail = (place: PlaceId, stage: number) => PLACES[place].stages[stage].shows.length;

/** The elements in every stage of a place: what is still here. */
export function stillHere(place: PlaceId): string[] {
  const [first, ...rest] = PLACES[place].stages;
  return first.shows.filter((e) => rest.every((s) => s.shows.includes(e)));
}

/** How many of a place's pictures show an element. */
export const picturesWith = (place: PlaceId, element: string) =>
  PLACES[place].stages.filter((s) => s.shows.includes(element)).length;

/**
 * Level 5's chips for each later place: the grand thing that came and went, and the plainer things a third chip is
 * drawn from. The growing thing (sapling to tree, shoot to vine) is never a chip: she could fairly call it still here.
 */
export const CHIPS: Record<LaterPlace, { grand: string; others: readonly string[] }> = {
  green: { grand: 'merry-go-round', others: ['bench', 'flower bed'] },
  oven: { grand: 'striped awning', others: ['table', 'sleeping cat'] },
};

/** Why a chip is not the answer, in words about the pictures. */
export function chipReason(place: PlaceId, element: string): string {
  const n = picturesWith(place, element);
  return `The ${element} is ${n === 1 ? 'only in one picture' : 'not in every picture'}.`;
}

// ——— Levels ———

export interface Plan {
  level: number;
  name: string;
  /** Stages in play. */
  cards: number;
  /** Cards hung before she starts (the pet hangs them). */
  hungAtStart: number;
}

export const PLANS: readonly Plan[] = [
  { level: 1, name: 'Long ago or now?', cards: 2, hungAtStart: 0 },
  { level: 2, name: 'Hang it between', cards: 3, hungAtStart: 2 },
  { level: 3, name: 'Grow the line', cards: 4, hungAtStart: 1 },
  { level: 4, name: 'A clue inside', cards: 4, hungAtStart: 2 },
  { level: 5, name: 'Still here', cards: 4, hungAtStart: 1 },
];

export const LEVELS: BandLevels = {
  preschool: { min: 1, max: 2 },
  prek: { min: 1, max: 4 },
  school: { min: 2, max: 5 },
};

export function planFor(level: number): Plan {
  return PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];
}

// ——— Rounds ———

export interface Round {
  level: number;
  /** The place on the posts (at level 4, the place whose two cards hang first). */
  place: PlaceId;
  /** Level 4 only: the second place on the line, whose two cards wait loose. */
  other?: PlaceId;
  /** Level 4 only: which place each card (by its time on the shared line) shows. */
  owners?: PlaceId[];
  /** Stage indices in play, ascending (at level 4, times on the shared line; a card shows its owner at that stage). */
  cards: number[];
  /** Stage indices hung before she starts, ascending (level 3's first card; level 2's two ends or two neighbours). */
  hung: number[];
  /** Stage indices waiting in the tray, in their seeded tray order. */
  loose: number[];
  /** Level 5 only: the three elements on the chips, in their seeded order; exactly one is `still`. */
  chips?: string[];
  /** Level 5 only: the element in every picture, the chip that pins to the ribbon. */
  still?: string;
}

/** Which place the next round shows: a shuffled bag, so every place turns up before any repeats. */
export class PlaceBag<P extends PlaceId = PlaceId> {
  private bag: P[] = [];
  constructor(
    private readonly rng: Rng,
    private readonly ids: readonly P[] = PLACE_IDS as readonly P[],
  ) {}
  next(): P {
    if (!this.bag.length) this.bag = this.rng.shuffle([...this.ids]);
    return this.bag.pop()!;
  }
}

/** Level 4's two places: the shore and the tree grow side by side, so each can show the other in its little picture. */
export const CLUE_PLACES: readonly PlaceId[] = ['shore', 'tree'];

/** The session's bag: rounds take places from it in turn, so consecutive rounds never repeat a place until all three have shown. */
const sessionBag = new PlaceBag(new Rng());
/** Level 5's own bag of the two later places, so the three-place bag above is untouched. */
const laterBag = new PlaceBag<LaterPlace>(new Rng(), LATER_PLACES);
const isLater = (p: PlaceId | undefined): p is LaterPlace =>
  p !== undefined && (LATER_PLACES as readonly PlaceId[]).includes(p);

/**
 * A round: the place, the stages in play and which hang first. Level 1 shows two stages at least one stage apart, both
 * loose; level 2 drops one stage of the four, hangs two of the remaining three and leaves one loose (any of the three);
 * level 3 uses every stage, hangs the first, and the three others wait in a seeded order; level 5 does the same with a
 * later place and adds three chips (the still-here element, the grand thing and one plainer thing) in a seeded order.
 */
export function roundFor(level: number, rng: Rng, chosen?: PlaceId): Round {
  const plan = planFor(level);
  if (plan.level === 4) {
    // Two places, one line: one place's two cards hang at two seeded times, the other place's two wait loose at the
    // other two times. Nothing in one place's own pictures says where the other's go; only the little picture does.
    const place = chosen && CLUE_PLACES.includes(chosen) ? chosen : rng.pick(CLUE_PLACES);
    const other = CLUE_PLACES.find((p) => p !== place)!;
    const times = [0, 1, 2, 3];
    const hung = rng
      .shuffle([...times])
      .slice(0, 2)
      .sort((a, b) => a - b);
    const owners = times.map((t) => (hung.includes(t) ? place : other));
    const loose = rng.shuffle(times.filter((t) => !hung.includes(t)));
    return { level: plan.level, place, other, owners, cards: times, hung, loose };
  }
  if (plan.level === 5) {
    const place = isLater(chosen) ? chosen : laterBag.next();
    const cards = PLACES[place].stages.map((_s, i) => i);
    const loose = rng.shuffle(cards.slice(1));
    const [still] = stillHere(place);
    const chips = rng.shuffle([still, CHIPS[place].grand, rng.pick(CHIPS[place].others)]);
    return { level: plan.level, place, cards, hung: [cards[0]], loose, chips, still };
  }
  const place = chosen ?? sessionBag.next();
  const n = PLACES[place].stages.length;
  if (plan.level === 1) {
    const pairs: [number, number][] = [];
    for (let a = 0; a < n; a++) for (let b = a + 2; b < n; b++) pairs.push([a, b]);
    const cards = rng.pick(pairs);
    return { level: plan.level, place, cards: [...cards], hung: [], loose: rng.shuffle([...cards]) };
  }
  if (plan.level === 2) {
    const dropped = rng.int(0, n - 1);
    const cards = Array.from({ length: n }, (_, i) => i).filter((i) => i !== dropped);
    const loose = rng.pick(cards);
    return { level: plan.level, place, cards, hung: cards.filter((c) => c !== loose), loose: [loose] };
  }
  const cards = Array.from({ length: n }, (_, i) => i);
  return { level: plan.level, place, cards, hung: [cards[0]], loose: rng.shuffle(cards.slice(1)) };
}

// ——— The line and its gaps ———

/** How many gaps the line offers: one more than the hung cards, level 1's two posts, or none once level 5's line is full. */
export function gapCount(round: Round, line: readonly number[]): number {
  if (round.level === 1) return 2;
  if (asking(round, line)) return 0;
  return line.length + 1;
}

/** What one card shows: its place and stage, and at level 4 its clue, the other place at the same time. */
export interface CardFace {
  place: PlaceId;
  stage: number;
  /** The little picture in the card's corner (level 4): the other place as it was when this picture was made. */
  clue?: { place: PlaceId; stage: number };
}

/** The face of card `n`: its own place's stage n, and at level 4 its owner and clue. */
export function faceOf(round: Round, n: number): CardFace {
  if (round.level !== 4 || !round.owners || !round.other) return { place: round.place, stage: n };
  const place = round.owners[n];
  const other = place === round.place ? round.other : round.place;
  return { place, stage: n, clue: { place: other, stage: n } };
}

/**
 * How two faces compare by what the pictures show: negative when `a` is older, positive when newer, null when nothing in
 * them decides it. One place's pictures compare by stage; two places' compare only through a clue that shows the other.
 */
export function compareFaces(a: CardFace, b: CardFace, clues = true): number | null {
  if (a.place === b.place) return a.stage - b.stage;
  if (!clues) return null;
  if (a.clue && a.clue.place === b.place) return a.clue.stage - b.stage;
  if (b.clue && b.clue.place === a.place) return a.stage - b.clue.stage;
  return null;
}

/**
 * Every gap where card `n` could hang without any picture contradicting the order: each hung card it can be compared
 * with must be on the right side of it. With the clues there is exactly one; without them (`clues: false`), a level-4
 * card of the second place fits several, because only the little picture ties the two places' times together.
 */
export function fittingGaps(round: Round, line: readonly number[], n: number, clues = true): number[] {
  const me = faceOf(round, n);
  const fits: number[] = [];
  for (let gap = 0; gap <= line.length; gap++) {
    const ok = line.every((m, i) => {
      const c = compareFaces(me, faceOf(round, m), clues);
      if (c === null) return true;
      return i < gap ? c > 0 : c < 0;
    });
    if (ok) fits.push(gap);
  }
  return fits;
}

/**
 * The gaps where a card fits given the cards already hung: exactly one at every level. Level 1 offers the two posts,
 * and the older card belongs on the left; the others are decided by what the pictures (and level 4's clues) show.
 */
export function validGaps(round: Round, line: readonly number[], stage: number): number[] {
  if (round.level === 1) return [stage === Math.min(...round.cards) ? 0 : 1];
  return fittingGaps(round, line, stage);
}

/** A caption read after "the": "an empty shore" becomes "empty shore", "the dock" stays "dock". */
export const bare = (caption: string) => caption.replace(/^(a|an|the) /i, '');

/**
 * Why `card` cannot hang on the wrong side of `neighbour` (`after`: it belongs after it), in words about what the
 * pictures show: the card's own picture when both show one place, else the little picture in its corner.
 */
export function reasonFor(round: Round, card: number, neighbour: number, after: boolean): string {
  const me = faceOf(round, card);
  const them = faceOf(round, neighbour);
  const theirs = PLACES[them.place].stages;
  const caption = bare(theirs[them.stage].caption);
  if (me.place === them.place) {
    const mine = PLACES[me.place].stages;
    return after
      ? `This picture already has the ${mine[me.stage].changes}, so it comes after the ${caption}.`
      : `This picture has no ${theirs[them.stage].changes} yet, so it comes before the ${caption}.`;
  }
  // Two places: the little picture shows the neighbour's place as it was when this picture was made.
  const clue = me.clue!;
  const name = PLACES[them.place].name;
  return after
    ? `In the little picture, the ${name} already has the ${theirs[clue.stage].changes}, so this comes after the ${caption}.`
    : `In the little picture, the ${name} has no ${theirs[them.stage].changes} yet, so this comes before the ${caption}.`;
}

export type Placement = { ok: true; line: number[] } | { ok: false; reason: string; line: readonly number[] };

/**
 * Hang a card in a gap. The valid gap returns the new line; any other gap returns the line untouched and a reason
 * about what the picture shows, built from the hung neighbour the card is wrongly before or after.
 */
export function place(round: Round, line: readonly number[], stage: number, gap: number): Placement {
  const [valid] = validGaps(round, line, stage);
  if (gap === valid) {
    const next = [...line, stage].sort((a, b) => a - b);
    return { ok: true, line: next };
  }
  if (round.level === 1) {
    // The only wrong answer: the newer picture called "long ago" (or the older one hung at "now").
    const other = round.cards.find((c) => c !== stage)!;
    return { ok: false, reason: reasonFor(round, stage, other, stage > other), line };
  }
  // Too early, the hung card just after the gap is older than this one; too late, the one just before it is newer.
  if (gap < valid) return { ok: false, line, reason: reasonFor(round, stage, line[gap], true) };
  return { ok: false, line, reason: reasonFor(round, stage, line[gap - 1], false) };
}

/** The loose card the ghost finger takes next: the oldest, so any line it builds is legal. */
export function nextCard(round: Round, loose: readonly number[]): number | null {
  if (!loose.length) return null;
  if (round.level === 1) return Math.min(...round.cards);
  return Math.min(...loose);
}

// ——— Misses and hints ———

/**
 * Keeps the round's accounting: a miss per distinct wrong drop (the same card in the same wrong gap again repeats the
 * reason and counts nothing), a glow on a card's valid gap after its second miss (one hint a card, at most), and
 * Show a hint for the card in hand (the same single hint). Level 5's three chips count the same way as one more card:
 * a miss per distinct wrong chip, the right chip glowing after the second, one hint at most.
 */
export class Tally {
  /** The key level 5's chip set counts under, as a card's stage does: `missed(CHIP_SET, chip)`, `help(CHIP_SET)`. */
  static readonly CHIP_SET = -1;
  misses = 0;
  hints = 0;
  private wrong = new Map<number, number>();
  private last: { stage: number; gap: number } | null = null;
  private hinted = new Set<number>();
  /** The stage whose valid gap glows, or null. */
  glowing: number | null = null;

  /** A wrong drop of `stage` in `gap`: whether it counted, and whether the glow just lit. */
  missed(stage: number, gap: number): { counted: boolean; lit: boolean } {
    if (this.last && this.last.stage === stage && this.last.gap === gap)
      return { counted: false, lit: false };
    this.last = { stage, gap };
    this.misses++;
    const n = (this.wrong.get(stage) ?? 0) + 1;
    this.wrong.set(stage, n);
    if (n >= 2 && !this.hinted.has(stage)) return { counted: true, lit: this.help(stage) };
    return { counted: true, lit: false };
  }

  /** Light the card's valid gap, once per card; true when it lit now. */
  help(stage: number): boolean {
    if (this.hinted.has(stage)) {
      this.glowing = stage;
      return false;
    }
    this.hinted.add(stage);
    this.hints++;
    this.glowing = stage;
    return true;
  }

  /** The card was hung: its glow goes out and the last wrong drop no longer repeats. */
  hung(stage: number) {
    if (this.glowing === stage) this.glowing = null;
    this.last = null;
  }
}

// ——— Layout ———

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Pt {
  x: number;
  y: number;
}
export const centre = (r: Rect): Pt => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

export const CARD = 150;
export const GAP_W = 110;
export const GAP_H = 150;
/** Between a card and a gap. */
const SPACE = 24;
/** Between the two rows when the line wraps. */
const ROW_SPACE = 36;
/** A post's own width, picture included. */
const POST_W = 112;
/** Where the posts start: below the home and help buttons in the top-left corner. */
const POST_Y = 150;
/** The post's small picture hangs this far below its top (its centre a further 48 down). */
export const POST_PICTURE_Y = 70;

export interface LineLayout {
  posts: { left: Rect; right: Rect };
  /** Each hung card's rectangle, in line order. */
  cards: Rect[];
  /** Each gap's rectangle, gap 0 first (the posts themselves while level 1's line is empty). */
  gaps: Rect[];
  /** The y of each row the line uses (one or two). */
  rows: number[];
  /** Loose cards' rectangles, tray order. */
  tray: Rect[];
  /** The flipbook frame. */
  frame: Rect;
  /** Level 5, once the line is full: the "still here" ribbon under the row of cards, the chips' drop target. */
  ribbon?: Rect;
  /** Level 5, once the line is full: the three chips, where the tray was. */
  chips: Rect[];
}

/** The ribbon's height: a full-size drop target. */
export const RIBBON_H = 100;
/** Level 5 asks its question once every card is hung. */
export const asking = (round: Round, line: readonly number[]) =>
  round.level === 5 && line.length === round.cards.length;

/**
 * Posts at the edges, the line between them (wrapping into two rows when its cards and gaps do not fit one), the tray
 * below and the flipbook frame in the middle. Every target keeps full size; null when the view cannot hold them.
 * Level 5's full line needs no gaps any more, so its four cards stand in one row with the ribbon under them and the
 * three chips where the tray was; null rather than a smaller ribbon or chip.
 */
export function lineLayout(
  round: Round,
  line: readonly number[],
  looseCount: number,
  v: View,
): LineLayout | null {
  const wide = v.w >= v.h;
  // Landscape: tall posts at the sides with the line between them. Portrait: shorter posts in the top corners, the line
  // below them across the width (two rows when it does not fit one), the tray at the bottom.
  // Level 1 hangs its cards on the posts themselves, so they stand a little further in to give a full card room.
  const px = round.level === 1 ? 40 : 16;
  // The posts start below the corner buttons; level 1's cards hang on the posts, so those stay tall in portrait too.
  const postH = wide || round.level === 1 ? 330 : 230;
  const posts = {
    left: { x: px, y: POST_Y, w: POST_W, h: postH },
    right: { x: v.w - px - POST_W, y: POST_Y, w: POST_W, h: postH },
  };
  const trayY = v.h - CARD - 28;
  const trayLeft = 176;
  const trayRight = v.w - 24;
  /** `count` card-sized places along the tray, or null when they do not fit side by side. */
  const trayRects = (count: number): Rect[] | null => {
    const step = Math.min(CARD + SPACE, (trayRight - trayLeft - CARD) / Math.max(1, count - 1) || 0);
    const start = (trayLeft + trayRight) / 2 - (step * (Math.max(1, count) - 1)) / 2 - CARD / 2;
    const rects = Array.from({ length: count }, (_, i) => ({
      x: start + i * step,
      y: trayY,
      w: CARD,
      h: CARD,
    }));
    if (count > 1 && step < CARD) return null;
    if (rects.length && (rects[0].x < trayLeft || rects[rects.length - 1].x + CARD > trayRight)) return null;
    return rects;
  };
  const tray = trayRects(looseCount);
  if (!tray) return null;

  const frameSize = wide ? 360 : 420;
  const frame = { x: (v.w - frameSize) / 2, y: wide ? 100 : 180, w: frameSize, h: frameSize };

  const gapsN = gapCount(round, line);
  if (round.level === 1) {
    // The posts are the two gaps, and a hung card sits on its post.
    const pic = (p: Rect): Rect => ({
      x: p.x + p.w / 2 - CARD / 2,
      y: p.y + p.h - GAP_H - 20,
      w: CARD,
      h: GAP_H,
    });
    const gaps = [pic(posts.left), pic(posts.right)];
    return {
      posts,
      cards: line.map((_s, i) => gaps[i]),
      gaps,
      rows: [posts.left.y + posts.left.h - GAP_H / 2 - 20],
      tray,
      frame,
      chips: [],
    };
  }
  const left = wide ? posts.left.x + posts.left.w + 12 : 24;
  const right = wide ? posts.right.x - 12 : v.w - 24;
  const room = right - left;
  const lineTop = wide ? posts.left.y + 40 : posts.left.y + posts.left.h + 20;
  const lineBottom = trayY - 30;
  if (asking(round, line)) {
    // The cards in one row, no gaps, the ribbon under them as wide as the row, the chips in the tray.
    const chips = trayRects(round.chips?.length ?? 3);
    const rowW = line.length * CARD + (line.length - 1) * SPACE;
    const blockH = CARD + 16 + RIBBON_H;
    if (!chips || rowW > room || blockH > lineBottom - lineTop) return null;
    const top = (lineTop + lineBottom) / 2 - blockH / 2;
    const x0 = (left + right) / 2 - rowW / 2;
    const cards = line.map((_s, i) => ({ x: x0 + i * (CARD + SPACE), y: top, w: CARD, h: CARD }));
    const ribbon = { x: x0, y: top + CARD + 16, w: rowW, h: RIBBON_H };
    return { posts, cards, gaps: [], rows: [top + CARD / 2], tray, frame, ribbon, chips };
  }
  // Items in line order: gap, card, gap, card, …, gap.
  type Item = { kind: 'gap' | 'card'; index: number; w: number };
  const items: Item[] = [];
  for (let g = 0; g < gapsN; g++) {
    items.push({ kind: 'gap', index: g, w: GAP_W });
    if (g < line.length) items.push({ kind: 'card', index: g, w: CARD });
  }
  const width = (its: Item[]) => its.reduce((s, it) => s + it.w, 0) + SPACE * (its.length - 1);
  let rowsOf: Item[][];
  if (width(items) <= room) rowsOf = [items];
  else {
    // Break after a card so each row starts and ends usefully; the first row takes the larger half.
    const cardsHung = line.length;
    const firstCards = Math.ceil(cardsHung / 2);
    const cut = items.findIndex((it) => it.kind === 'card' && it.index === firstCards - 1) + 1;
    rowsOf = [items.slice(0, cut), items.slice(cut)];
  }
  if (rowsOf.some((r) => width(r) > room)) return null;
  const rowH = Math.max(CARD, GAP_H);
  const mid = (lineTop + lineBottom) / 2;
  const rows =
    rowsOf.length === 1
      ? [wide ? posts.left.y + posts.left.h - GAP_H / 2 - 20 : mid]
      : [mid - rowH / 2 - ROW_SPACE / 2, mid + rowH / 2 + ROW_SPACE / 2];
  if (rows[rows.length - 1] + rowH / 2 > lineBottom) return null;
  const cards: Rect[] = [];
  const gaps: Rect[] = [];
  rowsOf.forEach((its, r) => {
    let x = (left + right) / 2 - width(its) / 2;
    for (const it of its) {
      const h = it.kind === 'card' ? CARD : GAP_H;
      const rect = { x, y: rows[r] - h / 2, w: it.w, h };
      (it.kind === 'card' ? cards : gaps)[it.index] = rect;
      x += it.w + SPACE;
    }
  });
  return { posts, cards, gaps, rows, tray, frame, chips: [] };
}

export const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
