import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

/** A tiny picture story, then a friend's empty thought bubble: what she wants (1), where he will look (2), why she did it (3). */

export type Thing =
  'apple' | 'ball' | 'kite' | 'cup' | 'book' | 'drum' | 'boat' | 'balloon' | 'teddy' | 'shell';
export type Place = 'redBox' | 'blueBasket' | 'shelf';
export type Reason =
  | 'rain'
  | 'cold'
  | 'visitor'
  | 'sleeping'
  | 'birthday'
  | 'droopy'
  | 'bedtime'
  | 'thirsty'
  | 'beach'
  | 'dance'
  | 'bath'
  | 'hungry';
/** The island friends a story names, fixed per story so every line is slot-free. Bear and dog never share one. */
export type Friend = 'bunny' | 'bear' | 'duck' | 'cat' | 'pig' | 'dog';

export const THINGS: readonly Thing[] = [
  'apple',
  'ball',
  'kite',
  'cup',
  'book',
  'drum',
  'boat',
  'balloon',
  'teddy',
  'shell',
];
export const PLACES: readonly Place[] = ['redBox', 'blueBasket', 'shelf'];
export const REASONS: readonly Reason[] = [
  'rain',
  'cold',
  'visitor',
  'sleeping',
  'birthday',
  'droopy',
  'bedtime',
  'thirsty',
  'beach',
  'dance',
  'bath',
  'hungry',
];

/** The stage is a 640 × 400 picture, origin top-left. */
export const STAGE_W = 640;
export const STAGE_H = 400;

export interface Pt {
  x: number;
  y: number;
}

// ---------------------------------------------------------------- level 1

export interface WantStory {
  id: string;
  friend: Friend;
  cued: Thing;
  /** The friend's feet. */
  friendAt: Pt;
  /** Where the reaching paw is. */
  pawAt: Pt;
  /** The direction the paw reaches, in degrees (0 is right, negative is up). */
  reach: number;
  /** Indoors stories draw the cottage room; outdoors ones the garden. */
  scene: 'tree' | 'table' | 'pond' | 'shelf' | 'bush' | 'bed';
  items: { thing: Thing; x: number; y: number }[];
}

/** Authored; the first round at level 1 is the first three in order. */
export const WANT_STORIES: readonly WantStory[] = [
  {
    id: 'apple-tree',
    friend: 'bunny',
    cued: 'apple',
    scene: 'tree',
    friendAt: { x: 300, y: 370 },
    pawAt: { x: 330, y: 300 },
    reach: -68,
    items: [
      { thing: 'apple', x: 390, y: 150 },
      { thing: 'ball', x: 250, y: 350 },
      { thing: 'kite', x: 520, y: 330 },
    ],
  },
  {
    id: 'cup-table',
    friend: 'bear',
    cued: 'cup',
    scene: 'table',
    friendAt: { x: 180, y: 370 },
    pawAt: { x: 215, y: 305 },
    reach: -8,
    items: [
      { thing: 'cup', x: 520, y: 265 },
      { thing: 'book', x: 250, y: 255 },
      { thing: 'drum', x: 300, y: 360 },
    ],
  },
  {
    id: 'boat-pond',
    friend: 'duck',
    cued: 'boat',
    scene: 'pond',
    friendAt: { x: 220, y: 360 },
    pawAt: { x: 255, y: 300 },
    reach: 8,
    items: [
      { thing: 'boat', x: 470, y: 330 },
      { thing: 'ball', x: 140, y: 350 },
      { thing: 'balloon', x: 300, y: 140 },
    ],
  },
  {
    id: 'book-shelf',
    friend: 'cat',
    cued: 'book',
    scene: 'shelf',
    friendAt: { x: 330, y: 370 },
    pawAt: { x: 360, y: 280 },
    reach: -71,
    items: [
      { thing: 'book', x: 420, y: 110 },
      { thing: 'cup', x: 420, y: 320 },
      { thing: 'teddy', x: 230, y: 350 },
    ],
  },
  {
    id: 'balloon-bush',
    friend: 'pig',
    cued: 'balloon',
    scene: 'bush',
    friendAt: { x: 260, y: 370 },
    pawAt: { x: 290, y: 300 },
    reach: -55,
    items: [
      { thing: 'balloon', x: 380, y: 170 },
      { thing: 'apple', x: 320, y: 355 },
      { thing: 'kite', x: 520, y: 250 },
    ],
  },
  {
    id: 'ball-bed',
    friend: 'dog',
    cued: 'ball',
    scene: 'bed',
    friendAt: { x: 150, y: 370 },
    pawAt: { x: 230, y: 355 },
    reach: 2,
    items: [
      { thing: 'ball', x: 420, y: 360 },
      { thing: 'book', x: 340, y: 240 },
      { thing: 'teddy', x: 410, y: 205 },
    ],
  },
];

const deg = (r: number) => (r * 180) / Math.PI;

/** The angle in degrees between the paw's reach and the direction from the paw to that thing. */
export function cueAngle(story: WantStory, thing: Thing): number {
  const item = story.items.find((i) => i.thing === thing);
  if (!item) return 180;
  const to = deg(Math.atan2(item.y - story.pawAt.y, item.x - story.pawAt.x));
  const d = Math.abs(((((to - story.reach) % 360) + 540) % 360) - 180);
  return d;
}

/** The thing's distance from the paw, for the decoy rule. */
export function pawDistance(story: WantStory, thing: Thing): number {
  const item = story.items.find((i) => i.thing === thing)!;
  return Math.hypot(item.x - story.pawAt.x, item.y - story.pawAt.y);
}

/** Above the friend's head (0.45 scale stands about 112 tall). */
export const isAbove = (story: WantStory) =>
  story.items.find((i) => i.thing === story.cued)!.y < story.friendAt.y - 120;

// ---------------------------------------------------------------- level 2

export type Who = Friend | 'wind';

export type Action =
  | { kind: 'put'; who: Friend; thing: Thing; to: Place }
  | { kind: 'leave'; who: Friend; to: 'outside' | 'window' }
  | { kind: 'move'; who: Who; thing: Thing; from: Place; to: Place }
  | { kind: 'back'; who: Friend };

/** An action and every friend who saw it happen. */
export type StoryEvent = Action & { saw: Friend[] };

/** Who saw each action: a friend sees it in the room or at the window, not outside. Everyone in `cast` starts in the room. */
export function compile(cast: readonly Friend[], actions: readonly Action[]): StoryEvent[] {
  const where = new Map<Friend, 'room' | 'window' | 'outside'>(cast.map((f) => [f, 'room']));
  return actions.map((a) => {
    if (a.kind === 'leave') where.set(a.who, a.to);
    if (a.kind === 'back') where.set(a.who, 'room');
    return { ...a, saw: cast.filter((f) => where.get(f) !== 'outside') };
  });
}

/** Where `who` thinks the thing is: the last put or move of it that they saw. */
export function believedPlace(events: readonly StoryEvent[], who: Friend, thing: Thing): Place | null {
  let at: Place | null = null;
  for (const e of events)
    if ((e.kind === 'put' || e.kind === 'move') && e.thing === thing && e.saw.includes(who)) at = e.to;
  return at;
}

/** Where the thing really is. */
export function actualPlace(events: readonly StoryEvent[], thing: Thing): Place | null {
  let at: Place | null = null;
  for (const e of events) if ((e.kind === 'put' || e.kind === 'move') && e.thing === thing) at = e.to;
  return at;
}

export interface LookTemplate {
  id: string;
  owner: Friend;
  thing: Thing;
  mover: Who;
}

/** Every move is kind: tidying, sharing, a puppy or the wind, never a trick. */
export const LOOK_TEMPLATES: readonly LookTemplate[] = [
  { id: 'bear-ball', owner: 'bear', thing: 'ball', mover: 'duck' },
  { id: 'bunny-book', owner: 'bunny', thing: 'book', mover: 'pig' },
  { id: 'cat-shell', owner: 'cat', thing: 'shell', mover: 'wind' },
  { id: 'duck-teddy', owner: 'duck', thing: 'teddy', mover: 'dog' },
  { id: 'pig-drum', owner: 'pig', thing: 'drum', mover: 'bunny' },
  { id: 'dog-apple', owner: 'dog', thing: 'apple', mover: 'cat' },
];

export interface LookStory {
  template: LookTemplate;
  kind: 'away' | 'watching';
  start: Place;
  end: Place;
  events: StoryEvent[];
}

export function lookStory(
  template: LookTemplate,
  kind: 'away' | 'watching',
  start: Place,
  end: Place,
): LookStory {
  const cast: Friend[] = template.mover === 'wind' ? [template.owner] : [template.owner, template.mover];
  const events = compile(cast, [
    { kind: 'put', who: template.owner, thing: template.thing, to: start },
    { kind: 'leave', who: template.owner, to: kind === 'away' ? 'outside' : 'window' },
    { kind: 'move', who: template.mover, thing: template.thing, from: start, to: end },
    { kind: 'back', who: template.owner },
  ]);
  return { template, kind, start, end, events };
}

export const lookAnswer = (s: LookStory): Place =>
  believedPlace(s.events, s.template.owner, s.template.thing)!;
export const thirdPlace = (s: LookStory): Place => PLACES.find((p) => p !== s.start && p !== s.end)!;

const tpl = (id: string) => LOOK_TEMPLATES.find((t) => t.id === id)!;

/** The authored first round: the same place (the red box) is right for different reasons. */
export const FIRST_LOOK: readonly LookStory[] = [
  lookStory(tpl('bear-ball'), 'away', 'redBox', 'blueBasket'),
  lookStory(tpl('cat-shell'), 'watching', 'shelf', 'redBox'),
  lookStory(tpl('bunny-book'), 'away', 'blueBasket', 'shelf'),
];

// ---------------------------------------------------------------- level 3

/** Where a region sits in the stage: the door side, the back wall, the window, beside the friend, the floor on the right. */
export type Slot = 'left' | 'back' | 'window' | 'midFloor' | 'floor';
export const SLOTS: Record<Slot, { x: number; y: number; w: number; h: number }> = {
  left: { x: 20, y: 120, w: 130, h: 260 },
  back: { x: 170, y: 30, w: 180, h: 140 },
  window: { x: 400, y: 30, w: 180, h: 140 },
  midFloor: { x: 160, y: 250, w: 120, h: 130 },
  floor: { x: 440, y: 240, w: 180, h: 140 },
};

/** What a region shows; each has its own picture and spoken name. */
export type RegionArt =
  | 'clouds'
  | 'sunny'
  | 'friendPath'
  | 'snow'
  | 'sunDoor'
  | 'droopyDoor'
  | 'coatHook'
  | 'toyBox'
  | 'chair'
  | 'doormat'
  | 'plant'
  | 'vase'
  | 'kettle'
  | 'lamp'
  | 'cake'
  | 'rug'
  | 'cot'
  | 'bucket';

export interface Region {
  id: RegionArt;
  slot: Slot;
  supports: Reason | null;
}

/** The friend's surprising action, drawn with the friend. */
export type WhyAction = 'umbrella' | 'cups' | 'scarf' | 'tiptoe' | 'present' | 'watering';

export interface WhyStory {
  id: string;
  friend: Friend;
  action: WhyAction;
  reasons: [Reason, Reason, Reason];
  supported: Reason;
  regions: Region[];
}

export const WHY_STORIES: readonly WhyStory[] = [
  {
    id: 'duck-umbrella',
    friend: 'duck',
    action: 'umbrella',
    reasons: ['rain', 'birthday', 'bedtime'],
    supported: 'rain',
    regions: [
      { id: 'clouds', slot: 'window', supports: 'rain' },
      { id: 'sunDoor', slot: 'left', supports: null },
      { id: 'vase', slot: 'back', supports: null },
      { id: 'rug', slot: 'floor', supports: null },
    ],
  },
  {
    id: 'bear-cups',
    friend: 'bear',
    action: 'cups',
    reasons: ['visitor', 'thirsty', 'bedtime'],
    supported: 'visitor',
    regions: [
      { id: 'friendPath', slot: 'window', supports: 'visitor' },
      { id: 'kettle', slot: 'back', supports: null },
      { id: 'plant', slot: 'midFloor', supports: null },
      { id: 'rug', slot: 'floor', supports: null },
    ],
  },
  {
    id: 'cat-scarf',
    friend: 'cat',
    action: 'scarf',
    reasons: ['cold', 'beach', 'dance'],
    supported: 'cold',
    regions: [
      { id: 'snow', slot: 'window', supports: 'cold' },
      { id: 'coatHook', slot: 'left', supports: null },
      { id: 'lamp', slot: 'back', supports: null },
      { id: 'rug', slot: 'floor', supports: null },
    ],
  },
  {
    id: 'bunny-tiptoe',
    friend: 'bunny',
    action: 'tiptoe',
    reasons: ['sleeping', 'dance', 'hungry'],
    supported: 'sleeping',
    regions: [
      { id: 'cot', slot: 'floor', supports: 'sleeping' },
      { id: 'toyBox', slot: 'midFloor', supports: null },
      { id: 'sunny', slot: 'window', supports: null },
      { id: 'lamp', slot: 'back', supports: null },
    ],
  },
  {
    id: 'pig-present',
    friend: 'pig',
    action: 'present',
    reasons: ['birthday', 'cold', 'bath'],
    supported: 'birthday',
    regions: [
      { id: 'cake', slot: 'back', supports: 'birthday' },
      { id: 'sunny', slot: 'window', supports: null },
      { id: 'chair', slot: 'midFloor', supports: null },
      { id: 'rug', slot: 'floor', supports: null },
    ],
  },
  {
    id: 'dog-watering',
    friend: 'dog',
    action: 'watering',
    reasons: ['droopy', 'bath', 'rain'],
    supported: 'droopy',
    regions: [
      { id: 'droopyDoor', slot: 'left', supports: 'droopy' },
      { id: 'sunny', slot: 'window', supports: null },
      { id: 'doormat', slot: 'midFloor', supports: null },
      { id: 'bucket', slot: 'floor', supports: null },
    ],
  },
];

/** The friend stands between the regions, feet on the floor. */
export const WHY_FRIEND_AT: Pt = { x: 340, y: 385 };

export const clueOf = (s: WhyStory): Region => s.regions.find((r) => r.supports === s.supported)!;
export const regionRect = (r: Region) => SLOTS[r.slot];

// ---------------------------------------------------------------- rounds

export type Story =
  | { level: 1; want: WantStory; cards: Thing[] }
  | { level: 2; look: LookStory; cards: Place[] }
  | { level: 3; why: WhyStory; cards: Reason[] };

export const STORIES_PER_ROUND = 3;

export interface LevelPlan {
  level: 1 | 2 | 3;
  name: string;
}
export const PLANS: readonly LevelPlan[] = [
  { level: 1, name: 'What does she want? A friend reaches for one of three things' },
  { level: 2, name: 'Where will he look? Was the friend there when his thing moved?' },
  { level: 3, name: 'How do we know? The reason, then where the picture shows it' },
];

export const LEVELS: BandLevels = {
  prek: { min: 1, max: 2 },
  school: { min: 1, max: 3 },
};
export const planFor = (level: number): LevelPlan => PLANS[Math.max(1, Math.min(3, Math.round(level))) - 1];

/** The right card for a story. */
export function answerOf(s: Story): Thing | Place | Reason {
  if (s.level === 1) return s.want.cued;
  if (s.level === 2) return lookAnswer(s.look);
  return s.why.supported;
}

/** The authored card order: the answer in the middle, then on the right, then on the left. */
function placed<T>(answer: T, all: readonly T[], story: number): T[] {
  const rest = all.filter((x) => x !== answer);
  const at = [1, 2, 0][story % 3];
  rest.splice(at, 0, answer);
  return rest;
}

/**
 * Three stories from the level's pool. The first round at each level is authored (the first three, in order, cards in table
 * order); after it the seed picks the stories and their order, the card order and, at level 2, away or watching and the places.
 */
export function roundFor(level: number, rng: Rng, first: boolean): Story[] {
  const lv = planFor(level).level;
  if (lv === 1) {
    const picks = first ? WANT_STORIES.slice(0, 3) : rng.shuffle([...WANT_STORIES]).slice(0, 3);
    return picks.map((want, i) => ({
      level: 1,
      want,
      cards: first
        ? placed(
            want.cued,
            want.items.map((it) => it.thing),
            i,
          )
        : rng.shuffle(want.items.map((it) => it.thing)),
    }));
  }
  if (lv === 2) {
    const looks = first
      ? [...FIRST_LOOK]
      : (() => {
          const tpls = rng.shuffle([...LOOK_TEMPLATES]).slice(0, 3);
          const kinds = rng.shuffle<'away' | 'watching'>([
            'away',
            'watching',
            rng.pick(['away', 'watching'] as const),
          ]);
          return tpls.map((t, i) => {
            const [start, end] = rng.shuffle([...PLACES]);
            return lookStory(t, kinds[i], start, end);
          });
        })();
    return looks.map((look) => ({ level: 2, look, cards: first ? [...PLACES] : rng.shuffle([...PLACES]) }));
  }
  const whys = first ? WHY_STORIES.slice(0, 3) : rng.shuffle([...WHY_STORIES]).slice(0, 3);
  return whys.map((why, i) => ({
    level: 3,
    why,
    cards: first ? placed(why.supported, why.reasons, i) : rng.shuffle([...why.reasons]),
  }));
}

// ---------------------------------------------------------------- accounting and help

/** A story's part in play: watching it, choosing a card, pointing in the picture (level 3), finished. */
export type Stage = 'watch' | 'card' | 'point' | 'done';

/** What the glow shows: a card by its value, or a level-3 region. */
export type Glow = { card: Thing | Place | Reason } | { region: RegionArt } | null;

export function glowFor(story: Story, stage: Stage): Glow {
  if (stage === 'card') return { card: answerOf(story) };
  if (stage === 'point' && story.level === 3) return { region: clueOf(story.why).id };
  return null;
}

/**
 * The round's misses and hints. A wrong card is one miss; two on one story glow the answer as one hint. At level 3's
 * pointing stage every non-clue tap is free, and the third asks again and glows the clue as one hint, once per story.
 * Replay, a card's name and a card dropped off the bubble never reach here.
 */
export class Tally {
  misses = 0;
  hints = 0;
  private wrongs = 0;
  private cardHinted = false;
  private taps = 0;
  private pointHinted = false;

  newStory() {
    this.wrongs = 0;
    this.cardHinted = false;
    this.taps = 0;
    this.pointHinted = false;
  }

  /** A wrong card in the bubble. True when this one turns the glow on. */
  wrong(): boolean {
    this.misses++;
    this.wrongs++;
    if (this.wrongs >= 2 && !this.cardHinted) {
      this.cardHinted = true;
      this.hints++;
      return true;
    }
    return false;
  }

  /** A tap on a region that is not the clue. True when this one turns the glow on. */
  freeTap(): boolean {
    this.taps++;
    if (this.taps >= 3 && !this.pointHinted) {
      this.pointHinted = true;
      this.hints++;
      return true;
    }
    return false;
  }

  /** Show me: glows the current target and counts a hint, unless that stage's glow is already on. */
  showMe(stage: Stage): boolean {
    if (stage === 'card' && !this.cardHinted) return ((this.cardHinted = true), this.hints++, true);
    if (stage === 'point' && !this.pointHinted) return ((this.pointHinted = true), this.hints++, true);
    return false;
  }
}

// ---------------------------------------------------------------- layout

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ThoughtLayout {
  /** The stage's top-left and its scale. */
  stage: { x: number; y: number; scale: number };
  /** The bubble's centre; the cloud is 220 × 150. */
  bubble: Pt;
  replay: Pt;
  /** The three card centres; each card is CARD_W × CARD_H. */
  cards: Pt[];
}

export const CARD_W = 150;
export const CARD_H = 170;
export const CARD_GAP = 24;
export const BUBBLE_W = 220;
export const BUBBLE_H = 150;
/** The bubble's hit area reaches this far past the cloud. */
export const BUBBLE_MARGIN = 30;
export const REPLAY_R = 50;
/** The guide's corner, bottom-left, and the home button's, top-left. */
export const PET_W = 210;
export const PET_H = 210;
export const HOME_W = 130;

export function thoughtLayout(v: Pick<View, 'w' | 'h'>): ThoughtLayout {
  const row = 3 * CARD_W + 2 * CARD_GAP;
  let stage: ThoughtLayout['stage'];
  let bubble: Pt;
  let replay: Pt;
  let cardsY: number;
  if (v.w > v.h) {
    // Landscape: the bubble and Replay in a column to the right of the stage, the cards below it.
    const side = BUBBLE_W + 40;
    const scale = Math.min(1.2, (v.w - HOME_W - side - 30) / STAGE_W, (v.h - 40 - CARD_H - 50) / STAGE_H);
    const total = STAGE_W * scale + 20 + side;
    const x = Math.max(HOME_W, (v.w - total) / 2);
    const y = 30;
    stage = { x, y, scale };
    bubble = { x: x + STAGE_W * scale + 20 + side / 2, y: y + BUBBLE_H / 2 + 20 };
    replay = { x: bubble.x, y: bubble.y + BUBBLE_H / 2 + BUBBLE_MARGIN + REPLAY_R + 20 };
    cardsY = y + STAGE_H * scale + 24 + CARD_H / 2;
  } else {
    // Portrait: the bubble and Replay above the stage (right of the home button), the cards below it.
    const scale = Math.min(1.1, (v.w - 48) / STAGE_W);
    const y = 40 + BUBBLE_H + 30;
    stage = { x: (v.w - STAGE_W * scale) / 2, y, scale };
    bubble = { x: v.w - 30 - BUBBLE_W / 2, y: 40 + BUBBLE_H / 2 };
    replay = { x: bubble.x - BUBBLE_W / 2 - BUBBLE_MARGIN - REPLAY_R - 30, y: bubble.y };
    cardsY = y + STAGE_H * scale + 24 + CARD_H / 2;
  }
  // The row centres under the stage, shifted right when it would reach into the guide's corner.
  let cx = stage.x + (STAGE_W * stage.scale) / 2;
  if (cardsY + CARD_H / 2 > v.h - PET_H && cx - row / 2 < PET_W) cx = PET_W + row / 2;
  cx = Math.min(cx, v.w - 10 - row / 2);
  const cards = [-1, 0, 1].map((i) => ({ x: cx + i * (CARD_W + CARD_GAP), y: cardsY }));
  return { stage, bubble, replay, cards };
}

/** A stage point on screen. */
export const toScreen = (l: ThoughtLayout, p: Pt): Pt => ({
  x: l.stage.x + p.x * l.stage.scale,
  y: l.stage.y + p.y * l.stage.scale,
});

/** A stage rectangle on screen. */
export function rectToScreen(l: ThoughtLayout, r: Box): Box {
  const p = toScreen(l, r);
  return { x: p.x, y: p.y, w: r.w * l.stage.scale, h: r.h * l.stage.scale };
}

/** The region under a stage point, or null. */
export function regionAt(story: WhyStory, p: Pt): Region | null {
  return (
    story.regions.find((r) => {
      const b = SLOTS[r.slot];
      return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
    }) ?? null
  );
}

/** Whether a card let go at (x, y) lands in the bubble's hit area. */
export function inBubble(l: ThoughtLayout, x: number, y: number): boolean {
  return (
    Math.abs(x - l.bubble.x) <= BUBBLE_W / 2 + BUBBLE_MARGIN &&
    Math.abs(y - l.bubble.y) <= BUBBLE_H / 2 + BUBBLE_MARGIN
  );
}
