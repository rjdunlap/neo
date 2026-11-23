import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

/**
 * A tiny picture story, then a friend's empty thought bubble: what she wants (1), where he will look (2), why she did it (3),
 * and two friends with a bubble each who saw different things (4).
 */

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

// ---------------------------------------------------------------- level 4

/** Two friends share one thing; it moves twice. The second mover is always a friend, so someone can show where it went. */
export interface TwoTemplate {
  id: string;
  friends: [Friend, Friend];
  thing: Thing;
  movers: [Who, Friend];
}

/** Every move is kind: tidying, making room, a puppy, the wind. At most three critters share the stage. */
export const TWO_TEMPLATES: readonly TwoTemplate[] = [
  { id: 'ball-tidy', friends: ['bear', 'bunny'], thing: 'ball', movers: ['duck', 'duck'] },
  { id: 'shell-wind', friends: ['cat', 'pig'], thing: 'shell', movers: ['wind', 'duck'] },
  { id: 'teddy-puppy', friends: ['duck', 'cat'], thing: 'teddy', movers: ['dog', 'dog'] },
  { id: 'drum-room', friends: ['pig', 'duck'], thing: 'drum', movers: ['bunny', 'bunny'] },
  { id: 'book-dust', friends: ['bunny', 'dog'], thing: 'book', movers: ['cat', 'cat'] },
  { id: 'apple-safe', friends: ['bear', 'pig'], thing: 'apple', movers: ['duck', 'duck'] },
];

/**
 * Which moves each friend saw. A friend who does not see a move has gone out of the door (the window is not used here).
 * `oneMove`: one saw move 1 then went out, the other was out for both. `bothMoves`: one stayed for both, the other was out
 * for both. `lastMove`: one stayed for both, the other saw move 1 then went out. `sameMiddle`: both saw move 1, then went
 * out together. `sameStart`: both went out before move 1.
 */
export type TwoPattern = 'oneMove' | 'bothMoves' | 'lastMove' | 'sameMiddle' | 'sameStart';
export const DIFFERENT_PATTERNS: readonly TwoPattern[] = ['oneMove', 'bothMoves', 'lastMove'];
export const SAME_PATTERNS: readonly TwoPattern[] = ['sameMiddle', 'sameStart'];
export const TWO_PATTERNS: readonly TwoPattern[] = [...DIFFERENT_PATTERNS, ...SAME_PATTERNS];
export const isDifferent = (p: TwoPattern) => DIFFERENT_PATTERNS.includes(p);

export interface TwoStory {
  template: TwoTemplate;
  pattern: TwoPattern;
  /** Which of the two friends saw more (it has bubble 0 when this is 0). In a same story neither did. */
  more: 0 | 1;
  /** Where it was put, where move 1 took it, where move 2 took it: the three places, all different. */
  start: Place;
  middle: Place;
  actual: Place;
  events: StoryEvent[];
}

export function twoStory(
  template: TwoTemplate,
  pattern: TwoPattern,
  more: 0 | 1,
  [start, middle, actual]: readonly [Place, Place, Place],
): TwoStory {
  const [f0, f1] = template.friends;
  const m = template.friends[more];
  const o = template.friends[1 - more];
  const thing = template.thing;
  const put: Action = { kind: 'put', who: f0, thing, to: start };
  const move1: Action = { kind: 'move', who: template.movers[0], thing, from: start, to: middle };
  const move2: Action = { kind: 'move', who: template.movers[1], thing, from: middle, to: actual };
  const out = (who: Friend): Action => ({ kind: 'leave', who, to: 'outside' });
  const back = (who: Friend): Action => ({ kind: 'back', who });
  // Everyone who went out comes back after move 2, in the order they left.
  const actions: Record<TwoPattern, Action[]> = {
    oneMove: [put, out(o), move1, out(m), move2, back(o), back(m)],
    bothMoves: [put, out(o), move1, move2, back(o)],
    lastMove: [put, move1, out(o), move2, back(o)],
    sameMiddle: [put, move1, out(f0), out(f1), move2, back(f0), back(f1)],
    sameStart: [put, out(f0), out(f1), move1, move2, back(f0), back(f1)],
  };
  const cast = [...new Set<Friend>([f0, f1, ...template.movers.filter((w): w is Friend => w !== 'wind')])];
  return { template, pattern, more, start, middle, actual, events: compile(cast, actions[pattern]) };
}

/** Where each friend thinks the thing is, read from the event list: bubble 0 is `friends[0]`'s. */
export const answersOf = (s: TwoStory): [Place, Place] => [
  believedPlace(s.events, s.template.friends[0], s.template.thing)!,
  believedPlace(s.events, s.template.friends[1], s.template.thing)!,
];

/** The index of the last put or move of the thing that `who` saw: the beat a miss replays. */
export function lastSeen(events: readonly StoryEvent[], who: Friend, thing: Thing): number {
  let at = -1;
  events.forEach((e, i) => {
    if ((e.kind === 'put' || e.kind === 'move') && e.thing === thing && e.saw.includes(who)) at = i;
  });
  return at;
}

/** A narrated beat: its voice line, and the event it plays (null for a friend who stays behind, which moves nothing). */
export interface Beat {
  line: string;
  event: number | null;
  /** The friend a stay beat is about. */
  who?: Friend;
}

/** The story beat by beat. The template owns each line; the pattern only says which beats play and in what order. */
export function beatsOf(s: TwoStory): Beat[] {
  const id = `thought.two.${s.template.id}`;
  const inRoom = new Set<Friend>(s.template.friends);
  const beats: Beat[] = [];
  let moves = 0;
  let stayed = false;
  s.events.forEach((e, i) => {
    if (e.kind === 'put') beats.push({ line: `${id}.put`, event: i });
    else if (e.kind === 'move') beats.push({ line: `${id}.move${++moves}`, event: i });
    else if (e.kind === 'back') beats.push({ line: `${id}.back.${e.who}`, event: i });
    else {
      beats.push({ line: `${id}.out.${e.who}`, event: i });
      inRoom.delete(e.who);
      // One friend stays to watch: said once, when the other has gone and this one is not next out of the door.
      const next = s.events[i + 1];
      const [left] = [...inRoom];
      if (!stayed && inRoom.size === 1 && !(next.kind === 'leave' && next.who === left)) {
        stayed = true;
        beats.push({ line: `${id}.stay.${left}`, event: null, who: left });
      }
    }
  });
  return beats;
}

const two = (id: string) => TWO_TEMPLATES.find((t) => t.id === id)!;

/**
 * The authored first round: the same place is right for different friends for different reasons, the two bubbles agree
 * once, and the place where it really is is right once.
 */
export const FIRST_TWO: readonly TwoStory[] = [
  twoStory(two('ball-tidy'), 'oneMove', 0, ['redBox', 'blueBasket', 'shelf']),
  twoStory(two('drum-room'), 'sameStart', 0, ['shelf', 'redBox', 'blueBasket']),
  twoStory(two('book-dust'), 'bothMoves', 1, ['blueBasket', 'shelf', 'redBox']),
];

/**
 * A dealt round of three: two different stories with two different patterns, the friend who saw more on the left in one
 * and on the right in the other, and a third story of any pattern. So every habit that ignores who was in the room
 * (always the start, the middle or the real place, or copying one bubble into the other) costs at least two misses.
 */
export function twoRound(rng: Rng): TwoStory[] {
  const tpls = rng.shuffle([...TWO_TEMPLATES]).slice(0, 3);
  const [a, b] = rng.shuffle([...DIFFERENT_PATTERNS]);
  const [sideA, sideB] = rng.shuffle<0 | 1>([0, 1]);
  const picks = rng.shuffle<[TwoPattern, 0 | 1]>([
    [a, sideA],
    [b, sideB],
    [rng.pick(TWO_PATTERNS), rng.pick([0, 1] as const)],
  ]);
  return tpls.map((t, i) => {
    const [pattern, more] = picks[i];
    return twoStory(
      t,
      pattern,
      isDifferent(pattern) ? more : 0,
      rng.shuffle([...PLACES]) as [Place, Place, Place],
    );
  });
}

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
  | { level: 3; why: WhyStory; cards: Reason[] }
  | { level: 4; two: TwoStory; cards: Place[] };

export const STORIES_PER_ROUND = 3;

export interface LevelPlan {
  level: 1 | 2 | 3 | 4;
  name: string;
}
export const PLANS: readonly LevelPlan[] = [
  { level: 1, name: 'What does she want? A friend reaches for one of three things' },
  { level: 2, name: 'Where will he look? Was the friend there when his thing moved?' },
  { level: 3, name: 'How do we know? The reason, then where the picture shows it' },
  { level: 4, name: 'Two bubbles (about 9 and up): two friends saw different things' },
];

export const LEVELS: BandLevels = {
  prek: { min: 1, max: 2 },
  school: { min: 1, max: 4 },
};
export const planFor = (level: number): LevelPlan =>
  PLANS[Math.max(1, Math.min(PLANS.length, Math.round(level))) - 1];

/** The right card for a story; at level 4, for one of its two bubbles. */
export function answerOf(s: Story, bubble = 0): Thing | Place | Reason {
  if (s.level === 1) return s.want.cued;
  if (s.level === 2) return lookAnswer(s.look);
  if (s.level === 4) return answersOf(s.two)[bubble];
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
 * Level 4 deals `twoRound`.
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
  if (lv === 4) {
    const twos = first ? [...FIRST_TWO] : twoRound(rng);
    return twos.map((t) => ({ level: 4, two: t, cards: first ? [...PLACES] : rng.shuffle([...PLACES]) }));
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

/** What the glow shows: a card by its value (at level 4 with the bubble it belongs in), or a level-3 region. */
export type Glow = { card: Thing | Place | Reason; bubble?: number } | { region: RegionArt } | null;

/** The first bubble not yet filled (left, or top, first), or -1. */
export const firstUnfilled = (filled: readonly boolean[]): number => [0, 1].find((b) => !filled[b]) ?? -1;

/** What to do now. At level 4 that is the first unfilled bubble and its card; `filled` says which bubbles are done. */
export function glowFor(story: Story, stage: Stage, filled: readonly boolean[] = []): Glow {
  if (stage === 'card' && story.level === 4) {
    const bubble = firstUnfilled(filled);
    return bubble < 0 ? null : { card: answerOf(story, bubble), bubble };
  }
  if (stage === 'card') return { card: answerOf(story) };
  if (stage === 'point' && story.level === 3) return { region: clueOf(story.why).id };
  return null;
}

/**
 * The round's misses and hints. A wrong card is one miss; two on one story glow the answer as one hint. At level 3's
 * pointing stage every non-clue tap is free, and the third asks again and glows the clue as one hint, once per story.
 * Replay, a card's name and a card dropped off the bubble never reach here. At level 4 each bubble is its own question:
 * its wrong cards and its glow are counted by the bubble's number, so the two can be filled in either order.
 */
export class Tally {
  misses = 0;
  hints = 0;
  private wrongs = [0, 0];
  private cardHinted = [false, false];
  private taps = 0;
  private pointHinted = false;

  newStory() {
    this.wrongs = [0, 0];
    this.cardHinted = [false, false];
    this.taps = 0;
    this.pointHinted = false;
  }

  /** A wrong card in a bubble. True when this one turns that bubble's glow on. */
  wrong(bubble = 0): boolean {
    this.misses++;
    this.wrongs[bubble]++;
    if (this.wrongs[bubble] >= 2 && !this.cardHinted[bubble]) {
      this.cardHinted[bubble] = true;
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
  showMe(stage: Stage, bubble = 0): boolean {
    if (stage === 'card' && !this.cardHinted[bubble])
      return ((this.cardHinted[bubble] = true), this.hints++, true);
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
  /** The first bubble's centre; the cloud is 220 × 150. */
  bubble: Pt;
  /** Every bubble's centre: one, or at level 4 two (bubble 0 on the left, or on top in landscape). */
  bubbles: Pt[];
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

export function thoughtLayout(v: Pick<View, 'w' | 'h'>, level = 1): ThoughtLayout {
  const row = 3 * CARD_W + 2 * CARD_GAP;
  const two = Math.round(level) >= 4;
  const hitW = BUBBLE_W + 2 * BUBBLE_MARGIN;
  const hitH = BUBBLE_H + 2 * BUBBLE_MARGIN;
  let bubbles: Pt[];
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
    // Level 4 stacks its two bubbles in that column, 20 apart, with Replay under them.
    bubbles = two ? [bubble, { x: bubble.x, y: bubble.y + hitH + 20 }] : [bubble];
    replay = { x: bubble.x, y: bubbles[bubbles.length - 1].y + hitH / 2 + REPLAY_R + 20 };
    cardsY = y + STAGE_H * scale + 24 + CARD_H / 2;
  } else if (two) {
    // Upright at level 4: the two bubbles side by side above the stage, right of Home; Home, two drop areas and Replay
    // do not fit one 768 row, so Replay sits under the cards at the right, clear of the guide. A taller screen (a phone)
    // moves the whole block down by a share of the spare height, toward the thumbs.
    const scale = Math.min(1.1, (v.w - 48) / STAGE_W);
    const top = 40 + Math.max(0, v.h - 1024) * 0.55;
    const y = top + BUBBLE_H + 30;
    stage = { x: (v.w - STAGE_W * scale) / 2, y, scale };
    const right = { x: v.w - 28 - hitW / 2, y: top + BUBBLE_H / 2 };
    bubbles = [{ x: right.x - hitW - 20, y: right.y }, right];
    bubble = bubbles[0];
    cardsY = y + STAGE_H * scale + 24 + CARD_H / 2;
    replay = { x: v.w - 30 - REPLAY_R, y: cardsY + CARD_H / 2 + 20 + REPLAY_R };
  } else {
    // Portrait: the bubble and Replay above the stage (right of the home button), the cards below it.
    const scale = Math.min(1.1, (v.w - 48) / STAGE_W);
    const y = 40 + BUBBLE_H + 30;
    stage = { x: (v.w - STAGE_W * scale) / 2, y, scale };
    bubble = { x: v.w - 30 - BUBBLE_W / 2, y: 40 + BUBBLE_H / 2 };
    bubbles = [bubble];
    replay = { x: bubble.x - BUBBLE_W / 2 - BUBBLE_MARGIN - REPLAY_R - 30, y: bubble.y };
    cardsY = y + STAGE_H * scale + 24 + CARD_H / 2;
  }
  // The row centres under the stage, shifted right when it would reach into the guide's corner.
  let cx = stage.x + (STAGE_W * stage.scale) / 2;
  if (cardsY + CARD_H / 2 > v.h - PET_H && cx - row / 2 < PET_W) cx = PET_W + row / 2;
  cx = Math.min(cx, v.w - 10 - row / 2);
  const cards = [-1, 0, 1].map((i) => ({ x: cx + i * (CARD_W + CARD_GAP), y: cardsY }));
  return { stage, bubble, bubbles, replay, cards };
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

/** The bubble whose hit area holds (x, y), or -1. The hit areas never overlap. */
export function bubbleAt(l: ThoughtLayout, x: number, y: number): number {
  return l.bubbles.findIndex(
    (b) =>
      Math.abs(x - b.x) <= BUBBLE_W / 2 + BUBBLE_MARGIN && Math.abs(y - b.y) <= BUBBLE_H / 2 + BUBBLE_MARGIN,
  );
}

/** Whether a card let go at (x, y) lands in a bubble's hit area. */
export const inBubble = (l: ThoughtLayout, x: number, y: number): boolean => bubbleAt(l, x, y) >= 0;
