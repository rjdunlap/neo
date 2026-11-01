/**
 * Notice Board: island friends pin made-up picture posters to the village board. She taps the friend who made each one
 * (the stamp matches their badge), the friend who saw what it says (their memory picture shows the place), or the
 * basket it belongs in (telling what happened, or asking you to come and get some). Every poster is about something
 * drawn on screen. Pools, rounds, accounting and layout live here so tests can check them.
 */
import type { CritterName } from '../../art/critter';
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export type Badge = 'star' | 'leaf' | 'wave' | 'heart' | 'moon' | 'sun';
export const BADGES: readonly Badge[] = ['star', 'leaf', 'wave', 'heart', 'moon', 'sun'];
/** Both radial: never on the same bench. */
const RADIAL: readonly Badge[] = ['star', 'sun'];

export type Place = 'garden' | 'pond' | 'beach' | 'orchard' | 'meadow' | 'square';
export const PLACES: readonly Place[] = ['garden', 'pond', 'beach', 'orchard', 'meadow', 'square'];
/** Places a small picture could be mistaken for: water with water, green ground with green ground. */
export const LOOKALIKE: Record<Place, Place | null> = { pond: 'beach', beach: 'pond', garden: 'meadow', meadow: 'garden', orchard: null, square: null };

export type Friend = Exclude<CritterName, 'pip'>;
export const FRIENDS: readonly Friend[] = ['cow', 'duck', 'pig', 'cat', 'bear', 'dog', 'bunny'];

/** What a friend remembers at level 2: a place, or only hearing about it. */
export type Memory = Place | 'heard';
export interface BenchFriend { name: Friend; badge: Badge; memory?: Memory }

export type Purpose = 'tell' | 'sell';
/** The picture on a poster (and, at level 2, in the witness's photo). */
export type Thing =
  | 'garden' | 'kite' | 'sandcastle' | 'painting' | 'tower' | 'song' | 'pie' | 'ball' | 'ribbon' | 'party' | 'jump'
  | 'carrot' | 'ducklings' | 'frog' | 'whale' | 'apples' | 'butterfly' | 'crowd'
  | 'lemonade' | 'icecream' | 'hats' | 'flowers' | 'rainbow' | 'appletree';

export interface Poster {
  id: string;
  level: 1 | 2 | 3;
  place: Place;
  thing: Thing;
  purpose: Purpose;
  /** Level 1: a bench friend who is not the maker is drawn on the poster. */
  about?: boolean;
  /** Sell posters only: 1–3 drawn shells. */
  price?: 1 | 2 | 3;
  /** Level 3: what the poster is about, to check a tell poster shows something the pool also sells. */
  item?: string;
  /** Level 2: the topic, which names its stretched and label lines. */
  topic?: string;
}

const own = (id: string, place: Place, thing: Thing): Poster => ({ id: `l1-${id}`, level: 1, place, thing, purpose: 'tell' });
const about = (id: string, place: Place, thing: Thing): Poster => ({ ...own(id, place, thing), about: true });

/** Level 1, *Who made it?*: eight of the maker's own things and three about a friend. */
export const POOL_1: readonly Poster[] = [
  own('garden', 'garden', 'garden'), own('kite', 'meadow', 'kite'), own('sandcastle', 'beach', 'sandcastle'),
  own('painting', 'beach', 'painting'), own('tower', 'square', 'tower'), own('song', 'square', 'song'),
  own('pie', 'square', 'pie'), own('ball', 'meadow', 'ball'),
  about('race', 'meadow', 'ribbon'), about('birthday', 'square', 'party'), about('jump', 'meadow', 'jump'),
];

const topic = (t: string, place: Place, thing: Thing): Poster => ({ id: `l2-${t}`, level: 2, place, thing, purpose: 'tell', topic: t });
/** Level 2, *Who saw it?*: seven topics, each told true or stretched. */
export const POOL_2: readonly Poster[] = [
  topic('carrot', 'garden', 'carrot'), topic('ducklings', 'pond', 'ducklings'), topic('frog', 'pond', 'frog'),
  topic('whale', 'beach', 'whale'), topic('apples', 'orchard', 'appletree'), topic('butterfly', 'meadow', 'butterfly'),
  topic('show', 'square', 'crowd'),
];

const sell = (id: string, place: Place, thing: Thing, price: 1 | 2 | 3, item: string): Poster => ({ id: `sell-${id}`, level: 3, place, thing, purpose: 'sell', price, item });
const tell = (id: string, place: Place, thing: Thing, item: string): Poster => ({ id: `tell-${id}`, level: 3, place, thing, purpose: 'tell', item });
/** Level 3, *To tell or to sell?*: six sell posters (a stall and a price) and six tell posters (neither). */
export const POOL_3: readonly Poster[] = [
  sell('lemonade', 'square', 'lemonade', 2, 'lemonade'), sell('icecream', 'beach', 'icecream', 3, 'icecream'),
  sell('apples', 'orchard', 'apples', 1, 'apples'), sell('hats', 'square', 'hats', 2, 'hats'),
  sell('pies', 'square', 'pie', 3, 'pie'), sell('flowers', 'garden', 'flowers', 1, 'flowers'),
  tell('ducklings', 'pond', 'ducklings', 'ducklings'), tell('rainbow', 'meadow', 'rainbow', 'rainbow'),
  tell('tree', 'orchard', 'appletree', 'apples'), tell('garden', 'garden', 'garden', 'flowers'),
  tell('pie', 'square', 'pie', 'pie'), tell('ball', 'meadow', 'ball', 'ball'),
];

const SOLD = new Set(POOL_3.filter((p) => p.purpose === 'sell').map((p) => p.item));
/** A tell poster whose thing the pool also sells: food or flowers alone cannot decide it. */
export const isItemDecoy = (p: Poster) => p.level === 3 && p.purpose === 'tell' && SOLD.has(p.item);

export const posterById = (id: string): Poster => {
  const p = [...POOL_1, ...POOL_2, ...POOL_3].find((q) => q.id === id);
  if (!p) throw new Error(`no poster ${id}`);
  return p;
};

// Plans --------------------------------------------------------------------------------------------------------------

export type Mode = 'maker' | 'witness' | 'purpose';
export interface Plan { level: number; name: string; mode: Mode; posters: number }
export const PLANS: readonly Plan[] = [
  { level: 1, name: "Who made it? Match the poster's stamp to a friend's badge", mode: 'maker', posters: 3 },
  { level: 2, name: 'Who saw it? Tap the friend who was there; their photo settles the poster', mode: 'witness', posters: 3 },
  { level: 3, name: 'To tell or to sell? Sort each poster into the news or the come-and-buy basket', mode: 'purpose', posters: 4 },
];
export const LEVELS: BandLevels = { prek: { min: 1, max: 2 }, school: { min: 1, max: 3 } };
export const planFor = (level: number): Plan => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];

// Rounds -------------------------------------------------------------------------------------------------------------

export interface Item {
  poster: Poster;
  /** Three friends, left to right. */
  bench: BenchFriend[];
  /** Who made the poster: on the bench at levels 1 and 3, off it at level 2. */
  maker: Friend;
  /** The stamp in the poster's corner. */
  stamp: Badge;
  /** Level 1 about-a-friend posters: the bench index of the friend drawn on the poster. */
  subject?: number;
  /** Level 2: whether the photo matches the poster or shows it stretched. */
  truth?: 'true' | 'stretched';
  /** Level 2: the bench index of the friend who was there. */
  witness?: number;
}
export interface Round { level: number; items: Item[] }

export type Target = { kind: 'friend'; i: number } | { kind: 'basket'; purpose: Purpose };

/** The answer for a poster: the maker (level 1), the witness (level 2) or the basket (level 3). */
export function answerFor(item: Item): Target {
  if (item.poster.level === 3) return { kind: 'basket', purpose: item.poster.purpose };
  if (item.poster.level === 2) return { kind: 'friend', i: item.witness! };
  return { kind: 'friend', i: item.bench.findIndex((f) => f.name === item.maker) };
}
/** The hint glows the answer itself. */
export const glowFor = answerFor;

/** `n` distinct badges, never star with sun. */
function dealBadges(rng: Rng, n: number): Badge[] {
  const drop = rng.pick(RADIAL);
  return rng.shuffle(BADGES.filter((b) => b !== drop)).slice(0, n);
}

/** Levels 1 and 3: three friends, the maker in a random slot, and at level 1 an about-a-friend subject beside them. */
function benchItem(poster: Poster, rng: Rng): Item {
  const names = rng.shuffle([...FRIENDS]).slice(0, 3);
  const badges = dealBadges(rng, 3);
  const bench = names.map((name, i) => ({ name, badge: badges[i] }));
  const m = rng.int(0, 2);
  const item: Item = { poster, bench, maker: names[m], stamp: badges[m] };
  if (poster.about) item.subject = rng.pick([0, 1, 2].filter((i) => i !== m));
  return item;
}

/** Level 2: the maker off the bench, and a witness, an elsewhere and a heard-it friend with the witness in `slot`. */
function witnessItem(poster: Poster, truth: 'true' | 'stretched', slot: number, rng: Rng): Item {
  const names = rng.shuffle([...FRIENDS]).slice(0, 4);
  const badges = dealBadges(rng, 4);
  const away = PLACES.filter((p) => p !== poster.place && p !== LOOKALIKE[poster.place]);
  const others: Memory[] = rng.shuffle<Memory>([rng.pick(away), 'heard']);
  const memories: Memory[] = [0, 1, 2].map((i) => (i === slot ? poster.place : others.shift()!));
  const bench = memories.map((memory, i) => ({ name: names[i + 1], badge: badges[i + 1], memory }));
  return { poster, bench, maker: names[0], stamp: badges[0], truth, witness: slot };
}

const TRUTHS = [['true', 'stretched'], ['stretched', 'true']] as const;

/** Each level's authored first round: about-a-friend second at level 1, a stretched poster first at level 2, the apple-tree decoy at level 3. */
export const AUTHORED: Record<number, readonly string[]> = {
  1: ['l1-kite', 'l1-race', 'l1-pie'],
  2: ['l2-carrot', 'l2-ducklings', 'l2-whale'],
  3: ['tell-tree', 'sell-lemonade', 'tell-ducklings', 'sell-flowers'],
};
const AUTHORED_TRUTH: readonly ('true' | 'stretched')[] = ['stretched', 'true', 'stretched'];

export function makeRound(level: number, rng: Rng, authored = false): Round {
  const plan = planFor(level);
  if (plan.mode === 'maker') {
    let posters: Poster[];
    if (authored) posters = AUTHORED[1].map(posterById);
    else {
      // At least one about-a-friend poster, so the friend in the picture is a wrong friend at least once a round.
      const a = rng.pick(POOL_1.filter((p) => p.about));
      posters = rng.shuffle([a, ...rng.shuffle(POOL_1.filter((p) => p !== a)).slice(0, 2)]);
    }
    return { level: 1, items: posters.map((p) => benchItem(p, rng)) };
  }
  if (plan.mode === 'witness') {
    const posters = authored ? AUTHORED[2].map(posterById) : rng.shuffle([...POOL_2]).slice(0, 3);
    // At least one true and one stretched; the witness's slots are a permutation, so it moves every poster.
    const truths = authored ? AUTHORED_TRUTH : [...rng.pick(TRUTHS), rng.pick(['true', 'stretched'] as const)];
    const order = authored ? [0, 1, 2] : rng.shuffle([0, 1, 2]);
    const shuffledTruths = authored ? truths : rng.shuffle([...truths]);
    const slots = rng.shuffle([0, 1, 2]);
    return { level: 2, items: order.map((k, i) => witnessItem(posters[k], shuffledTruths[i], slots[i], rng)) };
  }
  let posters: Poster[];
  if (authored) posters = AUTHORED[3].map(posterById);
  else {
    // One to three of each purpose, and at least one tell poster about something also sold.
    const sells = rng.int(1, 3);
    const decoy = rng.pick(POOL_3.filter(isItemDecoy));
    const tells = rng.shuffle(POOL_3.filter((p) => p.purpose === 'tell' && p !== decoy)).slice(0, 4 - sells - 1);
    const sold = rng.shuffle(POOL_3.filter((p) => p.purpose === 'sell')).slice(0, sells);
    posters = rng.shuffle([decoy, ...tells, ...sold]);
  }
  return { level: 3, items: posters.map((p) => benchItem(p, rng)) };
}

// Accounting ---------------------------------------------------------------------------------------------------------

export type Outcome =
  /** The answer: the poster is settled and play moves on (or the round is over). */
  | { kind: 'right'; item: Item; done: boolean }
  /** One miss; `glow` when this miss lit the glow (and counted its one hint). */
  | { kind: 'miss'; item: Item; glow: boolean }
  /** Never counted: a friend at level 3, or anything after the round. */
  | { kind: 'free' };

export class Play {
  index = 0;
  misses = 0;
  hints = 0;
  /** Misses on the current poster. */
  posterMisses = 0;
  /** The answer is glowing (two misses or Show me). */
  glowing = false;
  /** The current poster's one hint has been counted. */
  private helped = false;

  constructor(readonly round: Round) {}

  get done() { return this.index >= this.round.items.length; }
  get item(): Item { return this.round.items[Math.min(this.index, this.round.items.length - 1)]; }

  target(): Target | null { return this.done ? null : glowFor(this.item); }

  tapFriend(i: number): Outcome {
    if (this.done || this.round.level === 3) return { kind: 'free' };
    const t = answerFor(this.item);
    return t.kind === 'friend' && t.i === i ? this.right() : this.miss();
  }

  tapBasket(purpose: Purpose): Outcome {
    if (this.done || this.round.level !== 3) return { kind: 'free' };
    return this.item.poster.purpose === purpose ? this.right() : this.miss();
  }

  /** Show me: glow the answer, counting the poster's one hint; false if it already glows. */
  requestHint(): boolean {
    if (this.done || this.glowing) return false;
    this.light();
    return true;
  }

  private light() {
    this.glowing = true;
    if (!this.helped) { this.helped = true; this.hints++; }
  }

  private right(): Outcome {
    const item = this.item;
    this.index++;
    this.posterMisses = 0;
    this.glowing = false;
    this.helped = false;
    return { kind: 'right', item, done: this.done };
  }

  private miss(): Outcome {
    this.misses++;
    this.posterMisses++;
    const glow = this.posterMisses >= 2 && !this.glowing;
    if (glow) this.light();
    return { kind: 'miss', item: this.item, glow };
  }
}

// Layout -------------------------------------------------------------------------------------------------------------

export interface Rect { x: number; y: number; w: number; h: number }
export const FRIEND_W = 190, FRIEND_GAP = 32;
/** The bench friend's target with its memory bubble (levels 1–2), and without (level 3). */
export const FRIEND_H = 240, FRIEND_H_3 = 200;
export const BUBBLE_W = 130, BUBBLE_H = 100;
export const PHOTO_W = 200, PHOTO_H = 170, PHOTO_GAP = 24;
export const BASKET_W = 220, BASKET_H = 170, BASKET_GAP = 80;
export const BOARD_PAD = 20;
export const STAMP_D = 56;
/** The pet's bottom-left corner and the Home button's top-left corner, kept clear. */
export const PET_CORNER = 150, HOME_CORNER = 120;

export const posterSize = (portrait: boolean) => (portrait ? { w: 300, h: 240 } : { w: 360, h: 280 });

export interface NoticeBoardLayout {
  board: Rect;
  poster: Rect;
  /** Level 2: where the witness's photo lands, beside the poster. */
  photo: Rect | null;
  friends: Rect[];
  /** Level 3: the tell basket then the sell basket. */
  baskets: Rect[];
}

export function noticeBoardLayout(view: { w: number; h: number }, level: number): NoticeBoardLayout {
  const portrait = view.h > view.w;
  const { w: pw, h: ph } = posterSize(portrait);
  const cx = view.w / 2;
  const withPhoto = level === 2;
  const friendH = level === 3 ? FRIEND_H_3 : FRIEND_H;
  const boardH = ph + 2 * BOARD_PAD;
  const stack = boardH + friendH + (level === 3 ? BASKET_H : 0);
  const gaps = level === 3 ? 2 : 1;
  const gap = Math.max(16, Math.min(portrait ? (level === 3 ? 80 : 140) : 60, (view.h - 40 - stack) / (gaps + 1)));
  const top = 20;

  // In portrait the poster moves left so the photo fits beside it; in landscape the photo hangs off the board's right.
  let px = cx - pw / 2;
  if (withPhoto && portrait) px = Math.max(HOME_CORNER + BOARD_PAD, cx - (pw + PHOTO_GAP + PHOTO_W) / 2);
  const poster: Rect = { x: px, y: top + BOARD_PAD, w: pw, h: ph };
  const board: Rect = { x: px - BOARD_PAD, y: top, w: pw + 2 * BOARD_PAD, h: boardH };
  const photo = withPhoto ? { x: px + pw + PHOTO_GAP, y: poster.y + (ph - PHOTO_H) / 2, w: PHOTO_W, h: PHOTO_H } : null;

  const benchY = top + boardH + gap;
  const rowW = 3 * FRIEND_W + 2 * FRIEND_GAP;
  const friends = [0, 1, 2].map((k) => ({ x: cx - rowW / 2 + k * (FRIEND_W + FRIEND_GAP), y: benchY, w: FRIEND_W, h: friendH }));

  const baskets: Rect[] = [];
  if (level === 3) {
    const by = benchY + friendH + gap;
    const bw = 2 * BASKET_W + BASKET_GAP;
    for (let k = 0; k < 2; k++) baskets.push({ x: cx - bw / 2 + k * (BASKET_W + BASKET_GAP), y: by, w: BASKET_W, h: BASKET_H });
  }
  return { board, poster, photo, friends, baskets };
}
