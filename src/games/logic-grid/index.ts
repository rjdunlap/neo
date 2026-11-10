import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { cream, ink, swatch } from '../../art/palette';
import { blanketArt, bushArt, treeArt } from '../../art/picnic';
import { prop } from '../../art/props';
import { Backdrop, drawFarBarn } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import type { FederatedPointerEvent } from 'pixi.js';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { safeArea, type View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import { SCRIPT, type LineId } from '../../content/voice-script';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  answerOf,
  applyStep,
  blockOf,
  brokenClue,
  colOf,
  contradicts,
  CROSSED,
  cycle,
  EMPTY,
  emptyMarks,
  FILLED,
  fullWrong,
  HATS,
  isTime,
  makeRound,
  nextStep,
  TIMES,
  type Time,
  planFor,
  rowOf,
  shapeOf,
  shown,
  sizeOf,
  sq,
  solved,
  solveSteps,
  wrongSquares,
  type Board,
  type Clue,
  type Item,
  type Mark,
  type Place,
  type Plan,
  type Step,
  type Thing,
} from './logic';

const SQ = 100;
const PITCH = 104;
const CARD_W = 220;
/**
 * Level 5's narrower clue cards, so five fit in one row under the two blocks, and level 6's, two wide beside the 4 by 4 (the
 * written clue shows in the caption below them).
 */
const CARD_S = 128;
/** The gap between level 5's place block and item block. */
const GAP = 12;
/**
 * Level 7's case file, on the grown-up 64-unit rule: squares 64 across with no gap, row headers (friends, then snacks) 100
 * wide, column headers (places, then snacks) 80 deep, and an 8-unit gutter between blocks. The L leaves its bottom-right
 * quarter empty; Help sits there.
 */
const C = 64;
const HW = 100;
const HH = 80;
const GUT = 8;
/** A written clue's card in the case file's list: 212 by 64, so the column fits beside the L at 1024 across. */
const LINE_H = 64;
const CASE_W = 212;
/** Level 8's written clues are longer (an unaligned pair names two times), so its list cards are wider, in a smaller type. */
const CASE_W8 = 264;
/** A finger on a level-8 header that moves this far slides the grid instead of naming the header. */
const SLIDE_SLOP = 14;
/** A mark is judged once it rests this long, so the yes on the way to a no is never counted. */
const SETTLE = 2.5;

const nameOf = (f: CritterName) => f[0].toUpperCase() + f.slice(1);

/** A pond: a blue oval with reeds. */
function pondArt(): Graphics {
  const g = new Graphics();
  for (const [x, h] of [
    [-30, 46],
    [-20, 58],
    [26, 50],
  ]) {
    g.moveTo(x, -18)
      .lineTo(x + 3, -18 - h)
      .stroke({ width: 5, color: swatch.green.line, cap: 'round' });
    g.roundRect(x - 2, -18 - h, 9, 22, 4).fill(swatch.brown.fill);
  }
  g.ellipse(0, 0, 44, 20).fill(swatch.blue.fill).stroke({ width: 5, color: swatch.blue.line });
  g.ellipse(-10, -5, 16, 5).fill({ color: 0xffffff, alpha: 0.5 });
  return g;
}

function placeArt(p: Place): Container {
  const c = new Container();
  if (p === 'pond') {
    const g = pondArt();
    g.position.set(0, 26);
    c.addChild(g);
  } else if (p === 'tree') {
    const g = treeArt(52, 34);
    g.scale.set(0.82);
    g.position.set(0, 42);
    c.addChild(g);
  } else if (p === 'bush') {
    const g = bushArt(84);
    g.position.set(0, 30);
    c.addChild(g);
  } else if (p === 'barn') {
    const g = new Graphics();
    drawFarBarn(g, 0, 36, 64);
    c.addChild(g);
  } else {
    const g = blanketArt('checks', 76, 44);
    g.position.set(0, 8);
    c.addChild(g);
  }
  return c;
}

/** Level 8's time row: a small hill with the sun climbing from dawn to noon and setting by evening. */
function timeArt(t: number): Graphics {
  const g = new Graphics();
  const a = Math.PI * (1 - t / (TIMES.length - 1));
  const low = t === 0 || t === TIMES.length - 1;
  g.circle(Math.cos(a) * 34, 18 - Math.sin(a) * 38, 14)
    .fill(low ? swatch.orange.fill : swatch.yellow.fill)
    .stroke({ width: 4, color: low ? swatch.orange.line : swatch.yellow.line });
  g.ellipse(0, 26, 46, 14).fill(swatch.green.fill);
  return g;
}

/** How a time is said in a clue: "at dawn", "in the morning". */
const WHEN: Record<Time, string> = {
  dawn: 'at dawn',
  morning: 'in the morning',
  noon: 'at noon',
  afternoon: 'in the afternoon',
  evening: 'in the evening',
};

/** The missing ball (levels 3–4): a striped circle. */
function ballArt(): Graphics {
  const g = new Graphics();
  g.circle(0, 0, 30).fill(swatch.white.fill);
  g.moveTo(-30, 0)
    .arc(0, 0, 30, Math.PI, Math.PI * 1.5)
    .lineTo(0, 0)
    .closePath()
    .fill(swatch.red.fill);
  g.moveTo(30, 0)
    .arc(0, 0, 30, 0, Math.PI * 0.5)
    .lineTo(0, 0)
    .closePath()
    .fill(swatch.blue.fill);
  g.circle(0, 0, 30).stroke({ width: 5, color: ink });
  g.ellipse(-11, -14, 9, 5).fill({ color: 0xffffff, alpha: 0.7 });
  return g;
}

/** The missing kite (level 5): a diamond with a cross-spar and a bowed tail. */
function kiteArt(): Graphics {
  const g = new Graphics();
  g.moveTo(0, 26).bezierCurveTo(-14, 40, 14, 46, 0, 60).stroke({ width: 4, color: ink, cap: 'round' });
  for (const [x, y] of [
    [-4, 40],
    [4, 52],
  ])
    g.poly([x - 7, y - 5, x + 7, y + 5, x + 7, y - 5, x - 7, y + 5]).fill(swatch.red.fill);
  g.poly([0, -34, 24, -4, 0, 26, -24, -4])
    .fill(swatch.yellow.fill)
    .stroke({ width: 5, color: swatch.orange.line, join: 'round' });
  g.poly([0, -34, 24, -4, 0, -4]).fill(swatch.orange.fill);
  g.poly([0, 26, -24, -4, 0, -4]).fill(swatch.orange.fill);
  g.moveTo(0, -34)
    .lineTo(0, 26)
    .moveTo(-24, -4)
    .lineTo(24, -4)
    .stroke({ width: 3, color: swatch.orange.line });
  return g;
}

/** The missing picnic basket (level 7): a woven tub with a handle. */
function basketArt(): Graphics {
  const g = new Graphics();
  g.moveTo(-30, -6)
    .bezierCurveTo(-30, -52, 30, -52, 30, -6)
    .stroke({ width: 7, color: swatch.brown.line, cap: 'round' });
  g.roundRect(-40, -8, 80, 38, 10).fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.brown.line });
  for (const y of [4, 17]) g.moveTo(-36, y).lineTo(36, y).stroke({ width: 3, color: swatch.orange.line });
  for (const x of [-20, 0, 20]) g.moveTo(x, -6).lineTo(x, 28).stroke({ width: 3, color: swatch.orange.line });
  return g;
}

const thingArt = (t: Thing) =>
  t === 'ball' ? ballArt() : t === 'kite' ? kiteArt() : t === 'basket' ? basketArt() : pieArt();

const ITEM_COLOR = {
  apple: 'red',
  balloon: 'blue',
  flower: 'purple',
  orange: 'orange',
  lemon: 'yellow',
  pear: 'green',
} as const;

/** Level 5's items and level 7's snacks, from `prop()`, about 60 across. */
function itemArt(i: Item): Container {
  if (isTime(i)) {
    const t = new Container();
    t.addChild(timeArt(TIMES.indexOf(i)));
    return t;
  }
  const c = prop(i, ITEM_COLOR[i]);
  c.scale.set(i === 'balloon' ? 0.56 : 0.62);
  return c;
}

/** Levels 5–6 use the narrow cards and print the written clue under them; level 7 lists its written clues. */
const narrow = (b: Board) => !!b.items || b.friends.length > 3;
/** Levels 5–6: the written clue in a caption under the cards (level 7's cards are the written clues). */
const captioned = (b: Board) => narrow(b) && !b.case;

/** Fills a line's slots, for the written clue under the narrow cards. */
const written = (id: LineId, vars: Record<string, string>) =>
  SCRIPT[id][0].replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? k);

/**
 * Level 7's written clues, in the past tense of a case file: places ("Cat was at the pond"), snacks ("Cat brought the pear"),
 * snack and place ("The pear was at the pond"; "The friend at the pond did not bring the pear"), by hat, and this-or-that.
 */
function caseLine(c: Clue, b: Board): [LineId, Record<string, string>] {
  const friend = (f: number, hat?: true): Record<string, string> =>
    hat && b.hats ? { hat: HAT_NAME[HATS[b.hats[f]].color] } : { friend: nameOf(b.friends[f]) };
  if (c.kind === 'apart') return ['lg.case.without', { place: b.places[c.place], item: b.items![c.item] }];
  if (b.times || c.kind === 'order' || c.kind === 'pair') return timeLine(c, b, friend);
  const has = c.block === 1;
  const what = (i: number) => (has ? b.items![i] : b.places[i]);
  const by = (hat?: true) => (hat && b.hats ? 'hat.' : '');
  if (c.kind === 'neither')
    return [
      has ? 'lg.case.neither.has' : 'lg.case.neither',
      {
        friend: nameOf(b.friends[c.friend]),
        nor: nameOf(b.friends[c.nor]),
        [has ? 'item' : 'place']: what(c.place),
      },
    ];
  if (c.kind === 'either')
    return [
      `lg.case.${by(c.hat)}either${has ? '.has' : ''}` as LineId,
      { ...friend(c.friend, c.hat), [has ? 'item' : 'place']: what(c.place), or: what(c.or) },
    ];
  if (c.block === 2)
    return [
      c.kind === 'direct' ? 'lg.case.with' : 'lg.case.without',
      { item: b.items![c.friend], place: b.places[c.place] },
    ];
  const kind = has ? (c.kind === 'direct' ? 'has' : 'hasnot') : c.kind;
  return [
    `lg.case.${by(c.hat)}${kind}` as LineId,
    { ...friend(c.friend, c.hat), [has ? 'item' : 'place']: what(c.place) },
  ];
}

/**
 * Level 8's written clues: places as level 7's, times with "came" ("Cat came at noon"; "Whoever was at the pond came in the
 * evening"), order ("Bear came before Duck"; "Pig came right after Cat"; "Pig came two steps after Cat") and the unaligned
 * pair ("Of Cat and the friend at the pond, one came at dawn and one at noon").
 */
function timeLine(
  c: Exclude<Clue, { kind: 'apart' }>,
  b: Board,
  friend: (f: number, hat?: true) => Record<string, string>,
): [LineId, Record<string, string>] {
  const when = (t: number) => WHEN[b.items![t] as Time];
  const name = (f: number) => nameOf(b.friends[f]);
  const by = (hat?: true) => (hat && b.hats ? 'hat.' : '');
  if (c.kind === 'order') {
    if (!c.by) return ['lg.case.before', { friend: name(c.friend), later: name(c.later) }];
    return [
      c.by === 1 ? 'lg.case.after1' : 'lg.case.after2',
      { friend: name(c.friend), later: name(c.later) },
    ];
  }
  if (c.kind === 'pair')
    return [
      'lg.case.pair',
      { friend: name(c.friend), place: b.places[c.place], when: when(c.time), or: when(c.or) },
    ];
  if (c.kind === 'neither') {
    if (c.block === 1)
      return ['lg.case.neither.came', { friend: name(c.friend), nor: name(c.nor), when: when(c.place) }];
    return ['lg.case.neither', { friend: name(c.friend), nor: name(c.nor), place: b.places[c.place] }];
  }
  if (c.kind === 'either') {
    if (c.block === 1)
      return [
        `lg.case.${by(c.hat)}either.came` as LineId,
        { ...friend(c.friend, c.hat), when: when(c.place), or: when(c.or) },
      ];
    return [
      `lg.case.${by(c.hat)}either` as LineId,
      { ...friend(c.friend, c.hat), place: b.places[c.place], or: b.places[c.or] },
    ];
  }
  if (c.block === 2)
    return [
      c.kind === 'direct' ? 'lg.case.whenat' : 'lg.case.whenatnot',
      { when: when(c.friend), place: b.places[c.place] },
    ];
  if (c.block === 1)
    return [
      `lg.case.${by(c.hat)}${c.kind === 'direct' ? 'came' : 'camenot'}` as LineId,
      { ...friend(c.friend, c.hat), when: when(c.place) },
    ];
  return [
    `lg.case.${by(c.hat)}${c.kind}` as LineId,
    { ...friend(c.friend, c.hat), place: b.places[c.place] },
  ];
}

const HAT_COLOR = {
  red: swatch.red,
  blue: swatch.blue,
  yellow: swatch.yellow,
  green: swatch.green,
  purple: swatch.purple,
} as const;
const HAT_NAME = {
  red: 'red striped',
  blue: 'blue spotty',
  yellow: 'yellow starry',
  green: 'green zigzag',
  purple: 'purple checked',
} as const;

/**
 * Level 4's hat, in critter body coordinates (as `strawHat` sits): a brimmed dome in the hat's colour with its own pattern in
 * white, so stripes, spots, stars and (level 6) a zigzag tell the hats apart without the colour.
 */
function hatArt(h: number): Graphics {
  const { color, pattern } = HATS[h];
  const sw = HAT_COLOR[color];
  const g = new Graphics();
  g.moveTo(-62, -238)
    .bezierCurveTo(-62, -316, 62, -316, 62, -238)
    .closePath()
    .fill(sw.fill)
    .stroke({ width: 6, color: sw.line });
  if (pattern === 'stripes')
    for (const x of [-34, 0, 34])
      g.roundRect(x - 7, -286 + Math.abs(x) * 0.5, 14, 44 - Math.abs(x) * 0.5, 6).fill(0xffffff);
  else if (pattern === 'spots')
    for (const [x, y] of [
      [-30, -254],
      [0, -282],
      [30, -254],
    ])
      g.circle(x, y, 13).fill(0xffffff);
  else if (pattern === 'stars')
    for (const [x, y] of [
      [-32, -258],
      [0, -280],
      [32, -258],
    ])
      g.star(x, y, 5, 18, 8).fill(0xffffff);
  else if (pattern === 'checks')
    for (const [x, y] of [
      [-36, -262],
      [-12, -284],
      [12, -262],
      [36, -284],
      [-12, -244],
      [36, -244],
    ])
      g.rect(x - 9, y - 9, 18, 18).fill(0xffffff);
  else
    g.moveTo(-48, -256)
      .lineTo(-30, -280)
      .lineTo(-12, -256)
      .lineTo(6, -280)
      .lineTo(24, -256)
      .lineTo(42, -280)
      .stroke({ width: 10, color: 0xffffff, cap: 'round', join: 'round' });
  g.ellipse(0, -236, 104, 20).fill(sw.fill).stroke({ width: 6, color: sw.line });
  return g;
}

/** The missing pie: a round crust with a lattice. */
function pieArt(): Graphics {
  const g = new Graphics();
  g.ellipse(0, 8, 40, 18).fill(swatch.brown.line);
  g.ellipse(0, 0, 40, 18).fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.brown.line });
  for (const x of [-18, 0, 18])
    g.moveTo(x, -15).lineTo(x, 15).stroke({ width: 5, color: swatch.orange.line });
  for (const y of [-7, 7]) g.moveTo(-34, y).lineTo(34, y).stroke({ width: 5, color: swatch.orange.line });
  return g;
}

function friendArt(f: CritterName, scale: number): Critter {
  const c = new Critter(CRITTERS[f]);
  c.scale.set(scale);
  return c;
}

function card(color: { fill: number; line: number }, w = SQ, h = SQ, r = 18): Graphics {
  return new Graphics().roundRect(0, 0, w, h, r).fill(color.fill).stroke({ width: 4, color: color.line });
}

/**
 * A clue's picture card: the friend (or just their hat), a green check or a red cross, and the place or item. Level 5's
 * different-person card shows the place, a red cross and the item. Level 6's either-or card shows the friend and their two
 * places with a small "or" between; its neither-nor card shows both friends, a red cross and the place. Levels 5–6's cards are
 * narrower (`CARD_S`), drawn at 0.66.
 */
class ClueCard extends Container {
  readonly glow = new Graphics();
  readonly w: number;
  constructor(
    readonly clue: Clue,
    b: Board,
    text?: string,
    width = 0,
  ) {
    super();
    if (text !== undefined) {
      // Level 7: a written clue on a plain strip, spoken again when tapped.
      this.w = width;
      this.glow.roundRect(-6, -6, width + 12, LINE_H + 12, 16).fill({ color: 0xfff3a0, alpha: 0.95 });
      this.glow.visible = false;
      const t = label(text, 16, ink, '500');
      t.style.wordWrap = true;
      t.style.wordWrapWidth = width - 20;
      t.style.lineHeight = 19;
      t.style.align = 'left';
      t.anchor.set(0, 0.5);
      t.position.set(10, LINE_H / 2);
      t.eventMode = 'none';
      this.addChild(this.glow, card({ fill: cream, line: swatch.purple.line }, width, LINE_H, 12), t);
      this.hitArea = new Rectangle(0, 0, width, LINE_H);
      return;
    }
    const w = (this.w = narrow(b) ? CARD_S : CARD_W);
    const small = w < CARD_W;
    /** The three pictures' centres, and the scale of the pictures beside the full-size card's. */
    const [x0, x1, x2] = small ? [32, 66, 100] : [48, 110, 170];
    const k = small ? 0.66 : 1;
    this.glow.roundRect(-12, -12, w + 24, SQ + 24, 28).fill({ color: 0xfff3a0, alpha: 0.95 });
    this.glow.visible = false;
    this.addChild(this.glow, card({ fill: cream, line: swatch.purple.line }, w, SQ));
    this.hitArea = new Rectangle(0, 0, w, SQ);
    if (clue.kind === 'either' || clue.kind === 'neither') {
      this.drawThisOrThat(clue, b, k);
      return;
    }
    // Level 8's order and pair clues are only ever written (its cards take the text path above).
    if (clue.kind === 'order' || clue.kind === 'pair') return;
    let who: Container;
    if (clue.kind === 'apart') {
      who = placeArt(b.places[clue.place]);
      who.scale.set(0.8 * k);
      who.position.set(x0, 50 - 4 * k);
    } else if (clue.hat && b.hats) {
      who = hatArt(b.hats[clue.friend]);
      who.scale.set(0.36 * k);
      who.position.set(x0, 46 + 100 * k);
    } else {
      const f = friendArt(b.friends[clue.friend], 0.32 * k);
      f.alive = false;
      f.position.set(x0, small ? 82 : 92);
      who = f;
    }
    const sign = new Graphics();
    if (clue.kind === 'direct')
      sign
        .circle(0, 0, 20)
        .fill(swatch.green.fill)
        .moveTo(-9, 0)
        .lineTo(-2, 8)
        .lineTo(10, -8)
        .stroke({ width: 6, color: 0xffffff, cap: 'round', join: 'round' });
    else
      sign
        .circle(0, 0, 20)
        .fill(swatch.red.fill)
        .moveTo(-8, -8)
        .lineTo(8, 8)
        .moveTo(8, -8)
        .lineTo(-8, 8)
        .stroke({ width: 6, color: 0xffffff, cap: 'round' });
    sign.scale.set(small ? 0.75 : 1);
    sign.position.set(x1, 50);
    let what: Container;
    const item = clue.kind === 'apart' ? clue.item : clue.block ? clue.place : -1;
    if (item >= 0) {
      what = itemArt(b.items![item]);
      what.scale.set(what.scale.x * k);
      what.position.set(x2, 50);
    } else {
      what = placeArt(b.places[clue.place]);
      what.scale.set(0.8 * k);
      what.position.set(x2, 46);
    }
    for (const x of [who, sign, what]) x.eventMode = 'none';
    this.addChild(who, sign, what);
  }

  private drawThisOrThat(clue: Extract<Clue, { kind: 'either' | 'neither' }>, b: Board, k: number) {
    const parts: Container[] = [];
    const place = (p: number, x: number, y: number) => {
      const a = placeArt(b.places[p]);
      a.scale.set(0.55 * k);
      a.position.set(x, y);
      parts.push(a);
    };
    const friend = (f: number, x: number) => {
      const c = friendArt(b.friends[f], 0.26 * k);
      c.alive = false;
      c.position.set(x, 84);
      parts.push(c);
    };
    if (clue.kind === 'either') {
      if (clue.hat && b.hats) {
        const h = hatArt(b.hats[clue.friend]);
        // The dome sits about 260 above the hat's origin, so this centres it on the card.
        h.scale.set(0.4 * k);
        h.position.set(32, 50 + 104 * k);
        parts.push(h);
      } else friend(clue.friend, 26);
      place(clue.place, 76, 22);
      place(clue.or, 76, 70);
      const or = label('or', 18, ink);
      or.position.set(112, 50);
      parts.push(or);
    } else {
      friend(clue.friend, 24);
      friend(clue.nor, 62);
      const sign = new Graphics()
        .circle(0, 0, 20)
        .fill(swatch.red.fill)
        .moveTo(-8, -8)
        .lineTo(8, 8)
        .moveTo(8, -8)
        .lineTo(-8, 8)
        .stroke({ width: 6, color: 0xffffff, cap: 'round' });
      sign.scale.set(0.6);
      sign.position.set(102, 24);
      parts.push(sign);
      place(clue.place, 102, 60);
    }
    for (const x of parts) x.eventMode = 'none';
    this.addChild(...parts);
  }
}

class MysteryGrid implements Game {
  readonly plan: Plan;
  readonly boards: Board[];
  index = 0;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** 'grid' while she marks; 'answer' once solved, when she taps who has the pie. */
  phase: 'grid' | 'answer' = 'grid';
  marks: Mark[] = [];
  /** A just-tapped square, judged once it rests. */
  pending: { square: number; t: number } | null = null;
  /** The step Help last pointed at: pressing again while it is still next puts its mark down. */
  pointed: Step | null = null;

  private readonly backdrop: Backdrop;
  readonly board = new Container();
  private readonly cells: Container[] = [];
  private readonly markLayer = new Graphics();
  /**
   * The squares, their marks and glow (`body`), and level 7–8's column and row headers (`colStrip`, `rowStrip`). At level 8 the
   * L is bigger than the screen, so the body slides under a window with the headers pinned: the column strip follows the slide
   * across and the row strip follows it down, each clipped to its edge of the window.
   */
  private readonly body = new Container();
  private readonly colStrip = new Container();
  private readonly rowStrip = new Container();
  private readonly bodyMask = new Graphics();
  private readonly colMask = new Graphics();
  private readonly rowMask = new Graphics();
  /** Soft bars on the window's edges that have more grid beyond them. */
  private readonly edges = new Graphics();
  scrollX = 0;
  scrollY = 0;
  /** The window onto the squares at level 8 (the whole L elsewhere). */
  private win = { w: 0, h: 0 };
  private slideDrag: { id: number; x: number; y: number; ox: number; oy: number; moved: boolean } | null =
    null;
  private readonly faces = new Container();
  private readonly glowLayer = new Graphics();
  readonly friendCards: Container[] = [];
  readonly clueCards: ClueCard[] = [];
  private readonly clueRow = new Container();
  /** Level 5: the written clue of the card last lit or tapped, under the row of cards (not a target). */
  private readonly caption = label('', 22, ink, '500');
  readonly help = new Container();
  /** The missing thing, shown by its place once the grid is solved. */
  private readonly pie = new Container();
  private critters: Critter[] = [];
  /** Square:clue pairs already counted this board, and the squares behind them. */
  private counted = new Set<string>();
  private countedSquares = new Set<number>();
  private rings = new Set<number>();
  private boardMisses = 0;
  private pulse: number | null = null;
  private clock = 0;
  private view: View;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.boards = makeRound(this.plan, ctx.rng);
    this.backdrop = new Backdrop(
      { sky: [0xcfe0ff, 0xfff6e0], hills: [0xb3c7f2, 0xa8dc8f], horizon: 0.72, clouds: 2, seed: 223 },
      ctx.view,
    );
    for (const g of [this.markLayer, this.glowLayer, this.bodyMask, this.colMask, this.rowMask, this.edges])
      g.eventMode = 'none';
    this.faces.eventMode = 'none';
    this.caption.eventMode = 'none';
    const hb = new Graphics()
      .roundRect(-60, -50, 120, 100, 26)
      .fill(swatch.yellow.fill)
      .stroke({ width: 5, color: swatch.yellow.line });
    const q = label('?', 60, ink);
    q.eventMode = 'none';
    this.help.addChild(hb, q);
    this.help.hitArea = new Rectangle(-60, -50, 120, 100);
    onTap(this.help, () => this.useHelp(), { cooldown: 500 });
    ctx.stage.addChild(this.backdrop, this.board, this.clueRow, this.caption, this.help);
  }

  get current(): Board | undefined {
    return this.boards[this.index];
  }

  start() {
    this.setBoard();
    void this.intro();
  }

  private async intro() {
    await this.ctx.say(this.line('mystery'));
    await this.ctx.instruct(
      (['lg.one', 'lg.two', 'lg.three', 'lg.four', 'lg.five', 'lg.six', 'lg.seven', 'lg.eight'] as const)[
        this.plan.level - 1
      ],
    );
    if (this.slides) await this.ctx.say('lg.slide');
    await this.readClues();
  }

  /** The lines that name the missing thing: `lg.event` for the pie, `lg.event.ball` for the ball, `lg.event.kite` for the kite. */
  private line(id: 'mystery' | 'event' | 'who' | 'reveal'): LineId {
    return this.plan.thing === 'pie' ? `lg.${id}` : `lg.${id}.${this.plan.thing}`;
  }

  /** The event clue: by its place, or (level 5) tied to its item (level 7: a bit of a snack on the basket). */
  private sayEvent(b: Board) {
    if (b.eventItem && b.times)
      return this.ctx.say('lg.event.basket.time', { when: WHEN[b.items![b.event] as Time] });
    if (b.eventItem)
      return this.ctx.say(b.case ? 'lg.event.basket.item' : 'lg.event.kite.item', {
        item: b.items![b.event],
      });
    return this.ctx.say(this.line('event'), { place: b.places[b.event] });
  }

  private async readClues() {
    const b = this.current;
    if (!b) return;
    const at = this.index;
    for (const c of this.clueCards) {
      if (this.index !== at || this.finished) return;
      this.lightClues([this.clueCards.indexOf(c)]);
      await this.sayClue(c.clue, b);
      if (this.index !== at || this.finished) return;
      c.glow.visible = false;
    }
  }

  /** A clue's line and its slots: `lg.clue.not`, `lg.clue.hat.has`, `lg.clue.apart` and so on (`remind` for the miss reminder). */
  private clueLine(c: Clue, b: Board, id: 'clue' | 'remind'): [LineId, Record<string, string>] {
    if (b.case || c.kind === 'order' || c.kind === 'pair') return caseLine(c, b);
    if (c.kind === 'apart') return [`lg.${id}.apart`, { place: b.places[c.place], item: b.items![c.item] }];
    if (c.kind === 'neither')
      return [
        `lg.${id}.neither`,
        { friend: nameOf(b.friends[c.friend]), nor: nameOf(b.friends[c.nor]), place: b.places[c.place] },
      ];
    if (c.kind === 'either') {
      const where = { place: b.places[c.place], or: b.places[c.or] };
      if (c.hat && b.hats)
        return [`lg.${id}.hat.either`, { hat: HAT_NAME[HATS[b.hats[c.friend]].color], ...where }];
      return [`lg.${id}.either`, { friend: nameOf(b.friends[c.friend]), ...where }];
    }
    const kind = c.block ? (c.kind === 'direct' ? 'has' : 'hasnot') : c.kind;
    const what: Record<string, string> = c.block ? { item: b.items![c.place] } : { place: b.places[c.place] };
    if (c.hat && b.hats)
      return [`lg.${id}.hat.${kind}`, { hat: HAT_NAME[HATS[b.hats[c.friend]].color], ...what }];
    return [`lg.${id}.${kind}`, { friend: nameOf(b.friends[c.friend]), ...what }];
  }

  private sayClue(c: Clue, b: Board, id: 'clue' | 'remind' = 'clue') {
    const [line, vars] = this.clueLine(c, b, id);
    if (captioned(b)) this.caption.text = written(this.clueLine(c, b, 'clue')[0], vars);
    // Level 7's reminder points at the lit clue, then reads it.
    if (b.case && id === 'remind') return this.ctx.say('lg.remind.case').then(() => this.ctx.say(line, vars));
    return this.ctx.say(line, vars);
  }

  update(dt: number) {
    this.clock += dt;
    if (this.pending && (this.pending.t -= dt) <= 0) this.settle();
    if (this.pulse !== null || this.boardMisses >= 2) this.drawGlow();
  }

  destroy() {
    this.pending = null;
  }

  // Layout -------------------------------------------------------------------------------

  private get upright() {
    return this.view.h > this.view.w * 1.1;
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const b = this.current;
    if (!b) return;
    const s = shapeOf(b);
    const blocks = s.blocks ?? 1;
    const gw = (s.cols * blocks + 1) * PITCH - 4 + (blocks - 1) * GAP,
      gh = (s.rows + 1) * PITCH - 4;
    const safe = safeArea(v);
    const n = this.clueCards.length;
    if (b.times) this.layoutSliding(v, n);
    else if (b.case) {
      // Level 7: the L of three blocks, its written clues in a column beside it (landscape) or two columns under it (portrait),
      // and Help in the L's empty quarter.
      const l = caseLayout(v, n, this.upright);
      this.board.position.copyFrom(l.board);
      this.clueCards.forEach((c, i) => c.position.copyFrom(l.clues[i]));
      this.help.position.copyFrom(l.help);
      this.win = l.win;
    } else if (b.items) {
      // Level 5: the two blocks across, the five narrow cards in one row under them, the written clue under the cards.
      const row = n * (CARD_S + 10) - 10;
      const up = this.upright;
      // An upright phone's 768 width puts the two blocks' corner under Home and "?" (chunk 31), so they start below them.
      this.board.position.set(
        up ? (v.w - gw) / 2 : Math.max(safe.x + 180, (v.w - gw) / 2),
        v.upright ? 214 : 150,
      );
      const y = this.board.y + gh + 22;
      const x = up ? (v.w - row) / 2 : this.board.x;
      this.clueCards.forEach((c, i) => c.position.set(x + i * (CARD_S + 10), y));
      this.caption.anchor.set(0.5);
      this.caption.position.set(x + row / 2, y + SQ + 30);
      this.caption.style.wordWrap = true;
      this.caption.style.wordWrapWidth = up ? v.w - 40 : row;
      if (up) this.help.position.set(Math.min(v.w - 110, v.w / 2 + 300), Math.min(v.h - 114, 910));
      else this.help.position.set(Math.max(x + row + 70, v.w - 90), Math.min(v.h - 80, y + SQ / 2));
    } else if (narrow(b)) {
      // Level 6: the 4 by 4, its narrow cards two wide beside it (landscape) or in rows of three under it (portrait), the
      // written clue under the cards and Help beside or under them.
      const up = this.upright;
      const per = up ? 3 : 2;
      const rows = Math.ceil(n / per);
      this.board.position.set(
        up ? (v.w - gw) / 2 : Math.max(safe.x + 170, Math.min((v.w - gw - 300) / 2, safe.x + 200)),
        150,
      );
      const x0 = up ? 0 : this.board.x + gw + 28,
        y0 = up ? this.board.y + gh + 24 : 150;
      const width = (inRow: number) => inRow * (CARD_S + 10) - 10;
      this.clueCards.forEach((c, i) => {
        const r = Math.floor(i / per),
          inRow = Math.min(per, n - r * per);
        const x = up ? (v.w - width(inRow)) / 2 : x0;
        c.position.set(x + (i % per) * (CARD_S + 10), y0 + r * (SQ + 10));
      });
      const below = y0 + rows * (SQ + 10);
      const cw = width(per);
      this.caption.style.wordWrap = true;
      // Hung from its top, so a long wrapped clue grows down, never back over the cards.
      this.caption.anchor.set(0.5, 0);
      if (up) {
        const left = (v.w - cw) / 2;
        this.caption.style.wordWrapWidth = cw;
        this.caption.position.set(left + cw / 2, below + 6);
        this.help.position.set(Math.min(v.w - 70, left + cw + 80), Math.min(v.h - 60, below + 50));
      } else {
        this.caption.style.wordWrapWidth = cw;
        this.caption.position.set(x0 + cw / 2, below + 6);
        this.help.position.set(x0 + 60, Math.min(v.h - 60, below + 180));
      }
    } else if (this.upright) {
      // A 3 by 3 sits a little higher so a second row of clues stays above the pet's corner (y804).
      const big = s.rows >= 3;
      this.board.position.set((v.w - gw) / 2, big ? 150 : 160);
      const y = this.board.y + gh + (big ? 24 : 40);
      const per = n <= 3 ? n : 2;
      this.clueCards.forEach((c, i) => {
        const row = Math.floor(i / per),
          inRow = Math.min(per, n - row * per);
        c.position.set(
          v.w / 2 - (inRow * (CARD_W + 16) - 16) / 2 + (i % per) * (CARD_W + 16),
          y + row * (SQ + 12),
        );
      });
      this.help.position.set(Math.min(v.w - 110, v.w / 2 + 300), Math.min(v.h - 114, 910));
    } else {
      const left = safe.x + 180;
      const total = gw + 48 + CARD_W;
      this.board.position.set(Math.max(left, left + (v.w - 140 - left - total) / 2), 160);
      const x = this.board.x + gw + 48;
      this.clueCards.forEach((c, i) => c.position.set(x, 160 + i * (SQ + 16)));
      this.help.position.set(v.w - 90, Math.min(v.h - 80, 660));
    }
    if (this.pie.parent) this.placePie();
  }

  /** Level 8 slides its grid under a window. */
  get slides() {
    return !!this.current?.times;
  }

  /**
   * Level 8: the L (748 by 728) is taller than the screen below the shell, so its squares slide under a window, headers pinned.
   * Landscape: the window right of the pet's corner, the written clues in one column beside it, Help above the pet. Portrait:
   * the window across the top, the clues in two columns under it, right of the pet, and Help above the pet.
   */
  private layoutSliding(v: View, n: number) {
    const l = slidingLayout(v, n, this.upright);
    this.board.position.copyFrom(l.board);
    this.win = l.win;
    this.clueCards.forEach((c, i) => c.position.copyFrom(l.clues[i]));
    this.help.position.copyFrom(l.help);
    const { w, h } = this.win;
    this.bodyMask.clear().rect(HW, HH, w, h).fill(0xffffff);
    this.colMask.clear().rect(HW, 0, w, HH).fill(0xffffff);
    this.rowMask.clear().rect(0, HH, HW, h).fill(0xffffff);
    this.setScroll(this.scrollX, this.scrollY);
  }

  /** Slide the grid to `x`, `y`, kept inside what there is to see. */
  setScroll(x: number, y: number) {
    if (!this.slides) return;
    const full = 10 * C + GUT;
    this.scrollX = Math.round(Math.max(0, Math.min(full - this.win.w, x)));
    this.scrollY = Math.round(Math.max(0, Math.min(full - this.win.h, y)));
    this.body.position.set(-this.scrollX, -this.scrollY);
    this.colStrip.x = -this.scrollX;
    this.rowStrip.y = -this.scrollY;
    const { w, h } = this.win;
    const g = this.edges.clear();
    const bar = { color: swatch.orange.line, alpha: 0.35 };
    if (this.scrollX > 0) g.roundRect(HW, HH, 8, h, 4).fill(bar);
    if (this.scrollX < full - w) g.roundRect(HW + w - 8, HH, 8, h, 4).fill(bar);
    if (this.scrollY > 0) g.roundRect(HW, HH, w, 8, 4).fill(bar);
    if (this.scrollY < full - h) g.roundRect(HW, HH + h - 8, w, 8, 4).fill(bar);
    if (this.pie.parent) this.placePie();
  }

  /** Is this square wholly inside the window? */
  inView(square: number) {
    if (!this.slides) return true;
    const { x, y } = this.cellAt(square);
    return (
      x - this.scrollX >= HW &&
      x - this.scrollX + C <= HW + this.win.w &&
      y - this.scrollY >= HH &&
      y - this.scrollY + C <= HH + this.win.h
    );
  }

  /** Slide so a square is in the middle of the window (as near as the edges allow), unless it is already in view. */
  private reveal(square: number) {
    if (!this.slides || this.inView(square)) return;
    const { x, y } = this.cellAt(square);
    this.setScroll(x - HW - (this.win.w - C) / 2, y - HH - (this.win.h - C) / 2);
  }

  /** A finger down on a level-8 header: it names the header when lifted in place, and slides the grid when it moves. */
  private headDown(e: FederatedPointerEvent) {
    if (palmOnGlass() || (this.slideDrag && !e.isPrimary)) return;
    const p = this.board.toLocal(e.global);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    this.slideDrag = { id: e.pointerId, x: p.x, y: p.y, ox: this.scrollX, oy: this.scrollY, moved: false };
  }

  private headMove(e: FederatedPointerEvent) {
    const d = this.slideDrag;
    if (!d || e.pointerId !== d.id) return;
    const p = this.board.toLocal(e.global);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    if (!d.moved && Math.hypot(p.x - d.x, p.y - d.y) < SLIDE_SLOP) return;
    d.moved = true;
    this.setScroll(d.ox - (p.x - d.x), d.oy - (p.y - d.y));
  }

  private headUp(e: FederatedPointerEvent, onPress: () => void) {
    const d = this.slideDrag;
    if (!d || e.pointerId !== d.id) return;
    this.slideDrag = null;
    if (!d.moved) onPress();
  }

  /** A square's size: 100, or 64 on level 7's case file. */
  get cs() {
    return this.current?.case ? C : SQ;
  }

  /**
   * A column's left edge on the board: past the friend headers, and past the place block and its gap for an item. Level 7's
   * snack × place block (2) sits under the places.
   */
  private colX(col: number, block = 0) {
    const b = this.current!;
    const s = shapeOf(b);
    if (b.case) return HW + (block === 1 ? s.cols * C + GUT : 0) + col * C;
    return PITCH + block * (s.cols * PITCH + GAP) + col * PITCH;
  }

  /** A row's top edge: friends under the column headers, and (level 7) the snacks under the friends. */
  private rowY(row: number, block = 0) {
    if (!this.current!.case) return PITCH + row * PITCH;
    return HH + (block === 2 ? this.current!.places.length * C + GUT : 0) + row * C;
  }

  private cellAt(square: number) {
    const s = shapeOf(this.current!);
    const k = blockOf(s, square);
    return { x: this.colX(colOf(s, square), k), y: this.rowY(rowOf(s, square), k) };
  }

  // The board ----------------------------------------------------------------------------

  private setBoard() {
    const b = this.current!;
    const s = shapeOf(b);
    for (const c of this.critters) this.ctx.untrack(c);
    this.critters = [];
    const keep = new Set<Container>([
      this.glowLayer,
      this.markLayer,
      this.faces,
      this.body,
      this.colStrip,
      this.rowStrip,
      this.bodyMask,
      this.colMask,
      this.rowMask,
      this.edges,
    ]);
    for (const layer of [this.board, this.body, this.colStrip, this.rowStrip])
      layer.removeChildren().forEach((c) => !keep.has(c) && c.destroy({ children: true }));
    this.slideDrag = null;
    this.scrollX = this.scrollY = 0;
    this.body.position.set(0, 0);
    this.colStrip.position.set(0, 0);
    this.rowStrip.position.set(0, 0);
    this.board.addChild(this.body);
    this.body.addChild(this.glowLayer);
    this.clueRow.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.cells.length = 0;
    this.friendCards.length = 0;
    this.clueCards.length = 0;
    this.pie.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.marks = emptyMarks(s);
    this.pending = null;
    this.pointed = null;
    this.pulse = null;
    this.counted = new Set();
    this.countedSquares = new Set();
    this.rings = new Set();
    this.boardMisses = 0;
    this.phase = 'grid';

    if (b.case) this.caseHeaders(b);
    else this.headers(b);
    this.board.addChild(this.colStrip, this.rowStrip);
    // Level 8's window: the body and each header strip clipped to its edge of it.
    const masks: [Container, Graphics][] = [
      [this.body, this.bodyMask],
      [this.colStrip, this.colMask],
      [this.rowStrip, this.rowMask],
    ];
    for (const [layer, mask] of masks) {
      layer.mask = b.times ? mask : null;
      if (b.times) this.board.addChild(mask);
    }
    if (b.times) this.board.addChild(this.edges);
    else this.edges.clear();
    this.caption.text = '';
    const cs = this.cs;
    for (let i = 0; i < sizeOf(s); i++) {
      const cell = new Container();
      cell.addChild(
        b.case
          ? card({ fill: 0xffffff, line: swatch.white.line }, C, C, 6)
          : card({ fill: 0xffffff, line: swatch.white.line }),
      );
      cell.position.copyFrom(this.cellAt(i));
      cell.hitArea = new Rectangle(0, 0, cs, cs);
      onTap(cell, () => this.tapSquare(i), { cooldown: 150 });
      this.cells.push(cell);
      this.body.addChild(cell);
    }
    this.body.addChild(this.markLayer, this.faces);
    b.clues.forEach((c) => {
      const cc = b.case
        ? new ClueCard(c, b, written(...caseLine(c, b)), b.times ? CASE_W8 : CASE_W)
        : new ClueCard(c, b);
      onTap(cc, () => this.tapClue(cc), { cooldown: 400 });
      this.clueCards.push(cc);
      this.clueRow.addChild(cc);
    });
    this.drawMarks();
    this.board.alpha = 0;
    this.clueRow.alpha = 0;
    void this.ctx.tw.to(this.clueRow, { alpha: 1 }, { duration: 0.35 });
    void this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.35 }).then(() => (this.busy = false));
    this.resize(this.view);
  }

  /** Levels 1–6: the missing thing in the corner, the place (and item) headers across, the friends down. */
  private headers(b: Board) {
    // The corner: the missing pie with a question mark.
    const corner = new Container();
    corner.addChild(card({ fill: 0xfffbe6, line: swatch.orange.line }));
    const pie = thingArt(b.thing);
    pie.scale.set(0.8);
    pie.position.set(50, 62);
    const qm = label('?', 40, swatch.orange.line);
    qm.position.set(50, 24);
    corner.addChild(pie, qm);
    this.board.addChild(corner);
    b.places.forEach((p, i) => {
      const h = new Container();
      h.addChild(card({ fill: swatch.green.light, line: swatch.green.line }));
      const art = placeArt(p);
      art.position.set(50, 44);
      art.eventMode = 'none';
      h.addChild(art);
      h.position.set(this.colX(i), 0);
      h.hitArea = new Rectangle(0, 0, SQ, SQ);
      onTap(h, () => this.tapPlace(i), { cooldown: 300 });
      this.board.addChild(h);
    });
    b.items?.forEach((it, i) => {
      const h = new Container();
      h.addChild(card({ fill: swatch.orange.light, line: swatch.orange.line }));
      const art = itemArt(it);
      art.position.set(50, 50);
      art.eventMode = 'none';
      h.addChild(art);
      h.position.set(this.colX(i, 1), 0);
      h.hitArea = new Rectangle(0, 0, SQ, SQ);
      onTap(h, () => this.tapItem(i), { cooldown: 300 });
      this.board.addChild(h);
    });
    b.friends.forEach((f, i) => {
      const h = new Container();
      h.addChild(card({ fill: swatch.purple.light, line: swatch.purple.line }));
      const cr = this.ctx.track(friendArt(f, b.hats ? 0.3 : 0.34));
      if (b.hats) cr.attach(hatArt(b.hats[i]));
      cr.position.set(50, b.hats ? 98 : 94);
      cr.eventMode = 'none';
      this.critters.push(cr);
      h.addChild(cr);
      h.position.set(0, PITCH + i * PITCH);
      h.hitArea = new Rectangle(0, 0, SQ, SQ);
      onTap(h, () => this.tapFriend(i), { cooldown: 300 });
      this.friendCards.push(h);
      this.board.addChild(h);
    });
  }

  /**
   * Level 7's headers, each a picture with its written name: the basket in the corner, places then snacks across the top (64
   * by 80), friends then snacks down the side (100 by 64).
   */
  private caseHeaders(b: Board) {
    const corner = new Container();
    corner.addChild(card({ fill: 0xfffbe6, line: swatch.orange.line }, HW, HH, 10));
    const basket = basketArt();
    basket.scale.set(0.7);
    basket.position.set(HW / 2, HH / 2 + 8);
    corner.addChild(basket);
    this.board.addChild(corner);
    const head = (
      fill: { light: number; line: number },
      x: number,
      y: number,
      w: number,
      h: number,
      art: Container,
      name: string,
      onPress: () => void,
      across: boolean,
    ) => {
      const c = new Container();
      c.addChild(card({ fill: fill.light, line: fill.line }, w, h, 10));
      art.eventMode = 'none';
      const t = label(name, b.times && name.length > 6 ? (name.length > 8 ? 11 : 12) : 14, ink, '600');
      t.eventMode = 'none';
      if (across) {
        art.position.set(w / 2, 30);
        t.anchor.set(0.5, 0.5);
        t.position.set(w / 2, h - 13);
      } else {
        art.position.set(24, h / 2);
        t.anchor.set(0, 0.5);
        t.position.set(51, h / 2);
      }
      c.addChild(art, t);
      c.position.set(x, y);
      c.hitArea = new Rectangle(0, 0, w, h);
      if (b.times) {
        // Level 8: a header names itself when lifted in place and slides the grid when dragged; it dims at once under the finger.
        c.eventMode = 'static';
        c.cursor = 'grab';
        c.on('pointerdown', (e) => {
          c.alpha = 0.65;
          void this.ctx.tw.to(c, { alpha: 1 }, { duration: 0.3 });
          this.headDown(e);
        });
        c.on('globalpointermove', (e) => this.headMove(e));
        for (const ev of ['pointerup', 'pointerupoutside', 'pointercancel'] as const)
          c.on(ev, (e) => this.headUp(e, onPress));
      } else onTap(c, onPress, { cooldown: 300 });
      (across ? this.colStrip : this.rowStrip).addChild(c);
      return c;
    };
    const small = (a: Container, k: number) => (a.scale.set(a.scale.x * k), a);
    b.places.forEach((p, i) =>
      head(swatch.green, this.colX(i), 0, C, HH, small(placeArt(p), 0.5), p, () => this.tapPlace(i), true),
    );
    b.items!.forEach((it, i) =>
      head(
        swatch.orange,
        this.colX(i, 1),
        0,
        C,
        HH,
        small(itemArt(it), 0.6),
        it,
        () => this.tapItem(i),
        true,
      ),
    );
    b.items!.forEach((it, i) =>
      head(
        swatch.orange,
        0,
        this.rowY(i, 2),
        HW,
        C,
        small(itemArt(it), 0.55),
        it,
        () => this.tapItem(i),
        false,
      ),
    );
    b.friends.forEach((f, i) => {
      const cr = this.ctx.track(friendArt(f, 0.17));
      if (b.hats) cr.attach(hatArt(b.hats[i]));
      // The critter stands on its feet: lift it so its middle sits on the row.
      const h = head(
        swatch.purple,
        0,
        this.rowY(i),
        HW,
        C,
        new Container(),
        nameOf(f),
        () => this.tapFriend(i),
        false,
      );
      cr.position.set(24, C - 6);
      cr.eventMode = 'none';
      h.addChild(cr);
      this.critters.push(cr);
      this.friendCards.push(h);
    });
  }

  private drawMarks() {
    const b = this.current!;
    const s = shapeOf(b);
    const g = this.markLayer.clear();
    this.faces.removeChildren().forEach((c) => c.destroy({ children: true }));
    // Drawn on the 100-unit square and scaled to level 7's 64.
    const k = this.cs / SQ;
    shown(s, this.marks).forEach((m, i) => {
      const { x: x0, y: y0 } = this.cellAt(i);
      const P = (u: number, v: number) => [x0 + u * k, y0 + v * k] as const;
      if (m.mark === FILLED) {
        g.roundRect(...P(6, 6), (SQ - 12) * k, (SQ - 12) * k, 14 * k).fill(swatch.green.light);
        // Level 7's snack rows show the snack; every other yes shows the row friend's face.
        if (b.case && blockOf(s, i) === 2) {
          const a = itemArt(b.items![rowOf(s, i)]);
          a.scale.set(a.scale.x * 0.55);
          a.position.set(...P(40, 58));
          this.faces.addChild(a);
        } else {
          const face = friendArt(b.friends[rowOf(s, i)], 0.24 * k);
          face.alive = false;
          face.position.set(...P(42, 88));
          this.faces.addChild(face);
        }
        const [cx, cy] = P(76, 26);
        g.circle(cx, cy, 18 * k)
          .fill(swatch.green.fill)
          .moveTo(...P(68, 26))
          .lineTo(...P(74, 33))
          .lineTo(...P(85, 19))
          .stroke({ width: 5 * k, color: 0xffffff, cap: 'round', join: 'round' });
      } else if (m.mark === CROSSED) {
        const a = m.auto ? 0.3 : 0.85;
        g.moveTo(...P(28, 28))
          .lineTo(...P(72, 72))
          .moveTo(...P(72, 28))
          .lineTo(...P(28, 72))
          .stroke({ width: 9 * k, color: swatch.red.line, alpha: a, cap: 'round' });
      }
      if (this.rings.has(i))
        g.roundRect(...P(2, 2), (SQ - 4) * k, (SQ - 4) * k, 16 * k).stroke({
          width: 6 * k,
          color: swatch.red.fill,
          alpha: 0.8,
        });
    });
    this.drawGlow();
  }

  /** Help's pulse, and after two misses on a board the rule solver's next square, glow softly behind the grid. */
  private drawGlow() {
    const g = this.glowLayer.clear();
    const b = this.current;
    if (!b || this.phase !== 'grid') return;
    const target = this.pulse ?? (this.boardMisses >= 2 ? (nextStep(b, this.marks)?.square ?? null) : null);
    if (target === null) return;
    const { x, y } = this.cellAt(target);
    const a = 0.55 + 0.35 * Math.sin(this.clock * 5);
    const pad = this.current?.case ? 6 : 12;
    g.roundRect(x - pad, y - pad, this.cs + 2 * pad, this.cs + 2 * pad, 2 * pad + 2).fill({
      color: 0xfff3a0,
      alpha: a,
    });
  }

  private lightClues(ids: number[]) {
    this.clueCards.forEach((c, i) => (c.glow.visible = ids.includes(i)));
    const b = this.current;
    // One written clue at a time, so a step behind several clues never runs the caption off the screen.
    if (b && captioned(b) && ids.length)
      this.caption.text = written(...this.clueLine(b.clues[ids[0]], b, 'clue'));
  }

  // Taps ---------------------------------------------------------------------------------

  private tapSquare(i: number) {
    const b = this.current;
    if (!b || this.busy || this.finished || this.phase !== 'grid') return;
    // Level 8: a square cut by the window's edge slides into view instead of taking the mark.
    if (!this.inView(i)) return void this.reveal(i);
    if (this.pending && this.pending.square !== i) this.settle();
    if (this.phase !== 'grid' || this.busy) return;
    const was = this.marks[i];
    const now = cycle(was);
    this.marks[i] = now;
    this.rings.delete(i);
    this.pointed = null;
    this.pulse = null;
    this.lightClues([]);
    const cell = this.cells[i];
    cell.scale.set(0.92);
    void this.ctx.tw.to(cell.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack });
    if (now === FILLED) sfx.marimba(4 + (i % 5));
    else if (now === CROSSED) sfx.brush();
    else sfx.pop(3);
    this.drawMarks();
    this.pending = now === EMPTY ? null : { square: i, t: SETTLE };
    if (solved(b, this.marks)) void this.solvedBoard();
  }

  /** Judges the mark that has rested: one miss when a single shown clue rules it out, counted once per square and clue. */
  private settle() {
    const p = this.pending;
    this.pending = null;
    const b = this.current;
    if (!p || !b || this.phase !== 'grid' || this.finished) return;
    const mark = this.marks[p.square];
    const against = contradicts(b, p.square, mark);
    if (against.length) {
      const fresh = against.filter((c) => !this.counted.has(`${p.square}:${c}`));
      if (fresh.length) this.miss();
      for (const c of against) this.counted.add(`${p.square}:${c}`);
      this.countedSquares.add(p.square);
      sfx.boing();
      this.rings.add(p.square);
      this.lightClues([against[0]]);
      void this.sayClue(b.clues[against[0]], b, 'remind');
      // A full grid's wrong yeses lift too; this mark already counted, so no second miss.
      if (fullWrong(b, this.marks))
        for (const s of wrongSquares(b, this.marks)) if (this.marks[s] === FILLED) this.marks[s] = EMPTY;
      this.drawMarks();
      return;
    }
    if (fullWrong(b, this.marks)) {
      const wrong = wrongSquares(b, this.marks).filter((s) => this.marks[s] === FILLED);
      if (!wrong.every((s) => this.countedSquares.has(s))) this.miss();
      sfx.boing();
      const broken = brokenClue(b, this.marks);
      if (broken >= 0) {
        this.lightClues([broken]);
        void this.sayClue(b.clues[broken], b, 'remind');
      } else void this.ctx.say('lg.one-each');
      for (const s of wrong) this.marks[s] = EMPTY;
      this.drawMarks();
    }
  }

  private miss() {
    this.misses++;
    this.boardMisses++;
    // Level 8: the glow after two misses slides into view.
    const b = this.current;
    const next = b && this.boardMisses >= 2 ? nextStep(b, this.marks) : null;
    if (next) this.reveal(next.square);
  }

  private tapClue(c: ClueCard) {
    const b = this.current;
    if (!b || this.finished) return;
    sfx.pop(5);
    c.scale.set(1.06);
    void this.ctx.tw.to(c.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    void this.sayClue(c.clue, b);
  }

  private tapPlace(i: number) {
    const b = this.current;
    if (!b || this.finished) return;
    sfx.pop(6);
    void this.ctx.say('lg.place', { place: b.places[i] });
  }

  private tapItem(i: number) {
    const b = this.current;
    if (!b?.items || this.finished) return;
    sfx.pop(6);
    void this.ctx.say('lg.item', { item: b.items[i] });
  }

  private tapFriend(i: number) {
    const b = this.current;
    if (!b || this.finished || this.busy) return;
    this.critters[i]?.poke();
    if (this.phase === 'grid') {
      sfx.pop(7);
      void this.ctx.say('lg.friend', { friend: nameOf(b.friends[i]) });
      return;
    }
    if (i === answerOf(b)) void this.found();
    else {
      this.misses++;
      sfx.boing();
      const card = this.friendCards[i];
      card.alpha = 0.6;
      void this.ctx.tw.to(card, { alpha: 1 }, { duration: 1.2 });
      void this.sayEvent(b);
    }
  }

  // The answer ---------------------------------------------------------------------------

  private placePie() {
    const b = this.current!;
    const x = this.colX(b.event, b.eventItem ? 1 : 0) - this.scrollX;
    this.pie.position.set(this.board.x + x + this.cs / 2, this.board.y - 6);
    // Level 8: hidden while its column is slid out of the window.
    this.pie.visible = !this.slides || (x >= HW && x + C <= HW + this.win.w);
  }

  private async solvedBoard() {
    const b = this.current!;
    this.busy = true;
    this.pending = null;
    this.phase = 'answer';
    this.lightClues([]);
    this.pulse = null;
    this.drawGlow();
    sfx.sparkle();
    for (const c of this.critters) c.cheer();
    // Level 8: slide so the friends and the event's column are in view.
    this.setScroll(0, 0);
    this.reveal(sq(shapeOf(b), 0, b.event, b.eventItem ? 1 : 0));
    const at = this.index;
    await this.ctx.say('lg.solved');
    if (this.index !== at || this.finished) return;
    // The pie appears by its place.
    const pie = thingArt(b.thing);
    if (b.case) pie.scale.set(0.7);
    this.pie.addChild(pie);
    this.ctx.stage.addChild(this.pie);
    this.placePie();
    this.pie.scale.set(0);
    void this.ctx.tw.to(this.pie.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
    await this.sayEvent(b);
    if (this.index !== at || this.finished) return;
    this.busy = false;
    for (const c of this.critters) c.hop();
    void this.ctx.say(this.line('who'));
  }

  private async found() {
    const b = this.current!;
    this.busy = true;
    sfx.tada();
    const who = answerOf(b);
    this.critters[who]?.cheer();
    const at = this.friendCards[who];
    const half = b.case ? { x: HW / 2, y: C / 2 } : { x: SQ / 2, y: SQ / 2 };
    this.ctx.particles.burst(this.board.x + at.x + half.x, this.board.y + at.y + this.rowStrip.y + half.y, {
      kind: 'star',
      colors: [0xffffff, 0xfff3a0, swatch.orange.light],
      count: 16,
      speed: [100, 260],
      gravity: 0,
      life: [0.5, 0.9],
    });
    if (b.times)
      await this.ctx.say('lg.reveal.basket.time', {
        friend: nameOf(b.friends[who]),
        place: b.places[b.solution[who]],
        when: WHEN[b.items![b.having![who]] as Time],
      });
    else
      await this.ctx.say(this.line('reveal'), {
        friend: nameOf(b.friends[who]),
        place: b.places[b.solution[who]],
        item: b.items?.[b.having![who]] ?? '',
      });
    if (this.finished) return;
    this.index++;
    this.pie.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.pie.parent?.removeChild(this.pie);
    if (!this.current) return void this.end();
    await this.ctx.tw.to(this.board, { alpha: 0 }, { duration: 0.3 });
    this.setBoard();
    await this.ctx.say('lg.next');
    await this.readClues();
  }

  /**
   * Help points at the clue that decides the next square: the card lights and speaks, the square pulses, one hint. Pressing
   * again while that step is still next puts its mark down (clearing wrong marks), with no second hint. Once solved, it speaks
   * where the pie is and lights the friend there; again, it answers.
   */
  useHelp() {
    const b = this.current;
    if (!b || this.busy || this.finished) return;
    if (this.pending) this.settle();
    if (this.busy || (this.phase === 'grid' && solved(b, this.marks))) return;
    if (this.phase === 'answer') {
      if (this.pointed) return void this.found();
      this.hints++;
      this.pointed = { square: -1, mark: EMPTY, clues: [], why: 'clue' };
      this.critters[answerOf(b)]?.hop(1.4);
      void this.sayEvent(b);
      return;
    }
    const st = nextStep(b, this.marks);
    if (!st) return;
    if (this.pointed && this.pointed.square === st.square && this.pointed.mark === st.mark) {
      this.marks = applyStep(b, this.marks, st);
      this.rings.clear();
      this.pointed = null;
      this.pulse = null;
      this.lightClues([]);
      if (st.mark === FILLED) sfx.marimba(6);
      else sfx.brush();
      this.drawMarks();
      if (solved(b, this.marks)) void this.solvedBoard();
      return;
    }
    this.hints++;
    this.pointed = st;
    this.pulse = st.square;
    this.reveal(st.square);
    this.lightClues(st.clues);
    this.drawGlow();
    const s = shapeOf(b);
    const item = blockOf(s, st.square) === 1;
    const snack = blockOf(s, st.square) === 2;
    const when = (t: number) => WHEN[b.items![t] as Time];
    if (b.times && st.why === 'link') void this.ctx.say('lg.link.time');
    else if (b.times && st.why === 'last' && snack)
      void this.ctx.say('lg.last.time', { when: when(rowOf(s, st.square)) });
    else if (b.times && st.why === 'col' && snack)
      void this.ctx.say('lg.last.timeplace', { place: b.places[colOf(s, st.square)] });
    else if (b.times && st.why === 'last' && item)
      void this.ctx.say('lg.last.when', { friend: nameOf(b.friends[rowOf(s, st.square)]) });
    else if (b.times && st.why === 'col' && item)
      void this.ctx.say('lg.last.whenfriend', { when: when(colOf(s, st.square)) });
    else if (st.why === 'order' || st.why === 'pair')
      void this.sayClue(b.clues[st.clues.find((i) => b.clues[i].kind === st.why)!], b);
    else if (st.why === 'link') void this.ctx.say('lg.link');
    else if (st.why === 'last' && snack)
      void this.ctx.say('lg.last.snack', { item: b.items![rowOf(s, st.square)] });
    else if (st.why === 'col' && snack)
      void this.ctx.say('lg.last.snackplace', { place: b.places[colOf(s, st.square)] });
    else if (st.why === 'last')
      void this.ctx.say(item ? 'lg.last.thing' : 'lg.last', {
        friend: nameOf(b.friends[rowOf(s, st.square)]),
      });
    else if (st.why === 'col' && item)
      void this.ctx.say('lg.last.item', { item: b.items![colOf(s, st.square)] });
    else if (st.why === 'col') void this.ctx.say('lg.last.place', { place: b.places[colOf(s, st.square)] });
    else if (st.why === 'apart')
      void this.sayClue(b.clues[st.clues.find((i) => b.clues[i].kind === 'apart')!], b);
    else void this.sayClue(b.clues[st.clues[0]], b);
  }

  /**
   * The ghost finger replays the rule solver: one tap for a yes, two for a no (the second soon after, before the first is
   * judged), then taps the friend who has the pie. Level 7 taps only the yeses.
   */
  autotouch(): TouchIntent | null {
    const b = this.current;
    if (!b || this.busy || this.finished) return null;
    if (this.phase === 'answer') {
      const c = this.friendCards[answerOf(b)];
      return { tap: { on: c, x: (b.case ? HW : SQ) / 2, y: this.cs / 2 } };
    }
    // Level 7's 48 squares: the case file's demo taps the rule solver's yeses in order, since each yes crosses its own row
    // and column; the full step list takes over if a mark of hers is left in the way.
    const yes = b.case
      ? solveSteps(shapeOf(b), b.clues).steps.find(
          (x) => x.mark === FILLED && this.marks[x.square] !== FILLED,
        )
      : undefined;
    const st = yes ?? nextStep(b, this.marks);
    if (!st) return null;
    this.reveal(st.square);
    const cell = this.cells[st.square];
    const twice = st.mark === CROSSED && this.marks[st.square] !== FILLED;
    return { tap: { on: cell, x: this.cs / 2, y: this.cs / 2 }, pause: twice ? 0.25 : undefined };
  }

  /** For scripted checks: the square and mark Help would point at next. */
  next() {
    const b = this.current!;
    const st = nextStep(b, this.marks);
    return st && { square: st.square, mark: st.mark };
  }

  /** For scripted checks: a square a single clue rules a yes out of (a wrong yes that counts), or -1. */
  wrongYes() {
    const b = this.current!;
    const s = shapeOf(b);
    for (let i = 0; i < sizeOf(s); i++)
      if (this.marks[i] === EMPTY && contradicts(b, i, FILLED).length) return i;
    return -1;
  }

  private async end() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    this.ctx.pet.cheer();
    await this.ctx.say('lg.done');
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

/** A 2 by 3 grid of checks and crosses with a pie at the corner. */
function miniGrid(): Container {
  const c = new Container();
  const g = new Graphics();
  for (let r = 0; r < 3; r++) {
    for (let col = 0; col < 3; col++) {
      const x = -96 + col * 68,
        y = -96 + r * 68;
      g.roundRect(x, y, 60, 60, 10)
        .fill(r === 0 && col === 0 ? 0xfffbe6 : 0xffffff)
        .stroke({ width: 4, color: swatch.purple.line });
      if (r === 0 || col === 0) continue;
      if ((r + col) % 3 === 0) g.circle(x + 30, y + 30, 16).fill(swatch.green.fill);
      else
        g.moveTo(x + 18, y + 18)
          .lineTo(x + 42, y + 42)
          .moveTo(x + 42, y + 18)
          .lineTo(x + 18, y + 42)
          .stroke({ width: 7, color: swatch.red.line, cap: 'round' });
    }
  }
  c.addChild(g);
  const pie = pieArt();
  pie.scale.set(0.6);
  pie.position.set(-66, -62);
  c.addChild(pie);
  return c;
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(
    new Graphics()
      .roundRect(-80, -80, 160, 160, 24)
      .fill(0xffffff)
      .stroke({ width: 7, color: swatch.purple.line }),
  );
  const f = friendArt(rng.pick<CritterName>(['cat', 'duck', 'bear', 'dog', 'bunny', 'pig']), 0.48);
  f.alive = false;
  f.position.set(-10, 72);
  const pie = pieArt();
  pie.scale.set(0.7);
  pie.position.set(42, 40);
  c.addChild(f, pie);
  return c;
}

/**
 * Level 7: the L of three blocks (its 64-unit squares start HW, HH in from the board's corner), its written clues in a column
 * beside it (landscape) or two columns under it (portrait), and Help in the L's empty quarter. An upright phone (chunk 31)
 * starts the board below Home and "?".
 */
export function caseLayout(v: View, n: number, portrait: boolean) {
  const safe = safeArea(v);
  const cw = HW + 8 * C + GUT,
    ch = HH + 8 * C + GUT;
  let board: { x: number; y: number }, clues: { x: number; y: number }[];
  if (portrait) {
    board = { x: Math.round((v.w - cw) / 2), y: v.upright ? 214 : 146 };
    const y0 = board.y + ch + 10,
      x0 = Math.max(safe.x + 176, (v.w - 2 * CASE_W - 12) / 2);
    const per = Math.ceil(n / 2),
      pitch = Math.min(LINE_H + 8, Math.floor((safe.y + safe.h - y0) / per));
    clues = Array.from({ length: n }, (_, i) => ({
      x: x0 + Math.floor(i / per) * (CASE_W + 12),
      y: y0 + (i % per) * pitch,
    }));
  } else {
    board = { x: Math.max(safe.x + 162, Math.round((v.w - cw - 14 - CASE_W) / 2)), y: 146 };
    const x0 = board.x + cw + 14,
      y0 = 146;
    const pitch = Math.min(LINE_H + 16, Math.floor((safe.y + safe.h - 8 - y0) / Math.max(1, n)));
    clues = Array.from({ length: n }, (_, i) => ({ x: x0, y: y0 + i * pitch }));
  }
  return {
    board,
    clues,
    clueSize: { w: CASE_W, h: LINE_H },
    cell: C,
    help: { x: board.x + HW + 6 * C + GUT, y: board.y + HH + 6 * C + GUT },
    win: { w: 8 * C + GUT, h: 8 * C + GUT },
  };
}

/**
 * Level 8: the L (748 by 728) is taller than the screen below the shell, so its squares slide under a window, headers pinned.
 * Landscape: the window right of the pet's corner, the written clues in one column beside it, Help above the pet. Portrait:
 * the window across the top (below Home and "?" on an upright phone), the clues in two columns under it, right of the pet,
 * and Help beside them.
 */
export function slidingLayout(v: View, n: number, portrait: boolean) {
  const safe = safeArea(v);
  const full = 10 * C + GUT;
  const bottom = safe.y + safe.h - 8;
  if (portrait) {
    // The list sits right under the window, which takes what height the list leaves (the whole L on a tall screen).
    const per = Math.ceil(n / 2);
    const listH = per * (LINE_H + 6) - 6;
    const board = { x: Math.max(safe.x + 8, Math.round((v.w - HW - full) / 2)), y: v.upright ? 214 : 146 };
    const win = {
      w: Math.min(full, safe.x + safe.w - 8 - board.x - HW),
      h: Math.min(full, Math.max(v.h - 12, bottom) - listH - 14 - board.y - HH),
    };
    const y0 = board.y + HH + win.h + 14;
    const x0 = Math.max(safe.x + 176, (v.w - 2 * CASE_W8 - 12) / 2);
    return {
      board,
      win,
      clues: Array.from({ length: n }, (_, i) => ({
        x: x0 + Math.floor(i / per) * (CASE_W8 + 12),
        y: y0 + (i % per) * (LINE_H + 6),
      })),
      clueSize: { w: CASE_W8, h: LINE_H },
      cell: C,
      help: { x: Math.min(safe.x + 80, x0 - 74), y: Math.min(y0 + 50, v.h - (v.upright ? 230 : 280)) },
    };
  }
  const board = { x: safe.x + 162, y: 146 };
  const x0 = safe.x + safe.w - 8 - CASE_W8;
  const pitch = Math.min(LINE_H + 16, Math.floor((bottom - 146) / Math.max(1, n)));
  return {
    board,
    win: { w: Math.min(full, x0 - 14 - board.x - HW), h: Math.min(full, bottom - board.y - HH) },
    clues: Array.from({ length: n }, (_, i) => ({ x: x0, y: 146 + i * pitch })),
    clueSize: { w: CASE_W8, h: LINE_H },
    cell: C,
    help: { x: safe.x + 80, y: Math.min(470, v.h - 300) },
  };
}

export const logicGrid: GameModule = {
  id: 'logic-grid',
  upright: true,
  name: 'Mystery Grid',
  titleLine: 'game.logic-grid',
  region: 'puzzle-peaks',
  challenge: 'logic',
  skills: ['deduction', 'reasoning', 'using-evidence'],
  bands: ['preschool', 'prek', 'school', 'grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  touchDemo: true,
  coplayHint: 'Read a clue aloud together while {name} marks the grid, and ask why a square is a no.',
  offScreen: 'Hide a toy and give one clue at a time until someone finds it.',
  hubIcon: () => new WigglyIcon(miniGrid()),
  sticker,
  create: (ctx) => new MysteryGrid(ctx),
};
