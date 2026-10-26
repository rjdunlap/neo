import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, RAINBOW, swatch, wood, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { entryId } from '../../content/journal';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { label } from '../../ui/text';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  sortTouch,
  predictionComparison,
  type PairReading,
  aloneSide,
  balanceObservation,
  downSide,
  FRIEND_FOR,
  friendScale,
  makeRounds,
  numberChoices,
  other,
  pairHint,
  progress,
  planFor,
  seesawTouch,
  shareSide,
  stays,
  tilt,
  total,
  weigh,
  type FriendWeight,
  type BalanceObservation,
  type SeesawPlan,
  type SeesawRound,
  type Side,
  type Thing,
  type ThingKind,
} from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 12, max: 12, order: [12] },
  toddler: { min: 1, max: 12, order: [12, 1, 2] },
  preschool: { min: 2, max: 13, order: [2, 13, 3, 4] },
  prek: { min: 3, max: 15, order: [3, 4, 14, 5, 6, 7, 15] },
  school: { min: 6, max: 16, order: [6, 7, 15, 16, 8, 9, 10, 11] },
};

/** From the middle of the seesaw to each tray's post. */
const ARM = 290;
/** How far a tray stands above the plank. */
const POST = 64;
const TRAY_W = 250;
const WEIGHT_COLORS: ColorName[] = ['teal', 'yellow', 'orange', 'purple'];
const PRESENT_COLORS: ColorName[] = ['pink', 'blue', 'green', 'purple'];

const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

interface Item {
  thing: Thing;
  node: Container;
  /** Room it takes up on a tray. */
  width: number;
  height: number;
  critter?: Critter;
  /** The mystery box's label, which shows its weight at the end. */
  sign?: ReturnType<typeof label>;
  drag?: DragHandle;
  fixed: boolean;
  side: Side | null;
  /** Its spot on the grass. */
  ground: { x: number; y: number };
  /** Gliding onto its tray; the frame loop leaves it alone until it lands. */
  settling: boolean;
  inWagon: boolean;
  shelf?: number;
  /** Where the last touch picked it up, so a touch that barely moved reads as a tap. */
  pickedAt?: { x: number; y: number };
}

/** A touch that ends this close to where it began is a tap, not a drag. */
const TAP_REACH = 60;

/** The plank, its stand, and a tray at each end that stays level as the plank tips. */
function drawPlank(g: Graphics) {
  g.roundRect(-ARM - 44, -15, 2 * ARM + 88, 30, 15).fill(wood.fill).stroke(line(wood.line));
  for (let x = -ARM + 40; x < ARM - 20; x += 80) g.moveTo(x, -6).lineTo(x + 24, -6).stroke(line(wood.light, 4));
  return g;
}

function drawTray(g: Graphics, color: ColorName) {
  const sw = swatch[color];
  return g
    .roundRect(-12, 0, 24, POST, 8)
    .fill(wood.line)
    .roundRect(-TRAY_W / 2, -10, TRAY_W, 22, 11)
    .fill(sw.fill)
    .stroke(line(sw.line, 5));
}

function thingNode(thing: Thing, index: number): { node: Container; width: number; height: number; critter?: Critter; sign?: ReturnType<typeof label> } {
  const node = new Container();
  switch (thing.kind) {
    case 'friend': {
      const s = friendScale(thing.weight);
      const critter = new Critter(CRITTERS[thing.face ?? FRIEND_FOR[thing.weight as FriendWeight]]);
      critter.scale.set(s);
      node.addChild(critter);
      const h = Math.max(100, 240 * s);
      node.hitArea = new Rectangle(-70, -h - 10, 140, h + 25);
      return { node, width: 70 + 120 * s, height: 240 * s, critter };
    }
    case 'block': {
      node.addChild(new Graphics().roundRect(-30, -60, 60, 60, 9).fill(wood.fill).stroke(line(wood.line, 5)).circle(0, -30, 9).fill(wood.line));
      node.hitArea = new Rectangle(-50, -80, 100, 100);
      return { node, width: 66, height: 60 };
    }
    case 'weight': {
      const w = thing.weight;
      const sw = swatch[WEIGHT_COLORS[(w - 1) % WEIGHT_COLORS.length]];
      const bw = 46 + 14 * w;
      const bh = 40 + 9 * w;
      const g = new Graphics()
        .moveTo(-10, -bh - 2)
        .arc(0, -bh - 2, 12, Math.PI, 0)
        .stroke(line(ink, 6))
        .moveTo(-bw / 2 + 8, -bh)
        .lineTo(bw / 2 - 8, -bh)
        .lineTo(bw / 2, 0)
        .lineTo(-bw / 2, 0)
        .closePath()
        .fill(sw.fill)
        .stroke(line(sw.line, 5));
      const n = label(String(w), 30 + 3 * w, 0xffffff);
      n.style.stroke = { color: sw.line, width: 7, join: 'round' };
      n.y = -bh / 2;
      node.addChild(g, n);
      node.hitArea = new Rectangle(-Math.max(50, bw / 2 + 8), -Math.max(100, bh + 30), Math.max(100, bw + 16), Math.max(100, bh + 30) + 10);
      return { node, width: bw + 8, height: bh };
    }
    case 'present': {
      const sw = swatch[PRESENT_COLORS[index % PRESENT_COLORS.length]];
      const g = new Graphics()
        .roundRect(-44, -76, 88, 76, 10)
        .fill(sw.fill)
        .stroke(line(sw.line, 5))
        .rect(-8, -76, 16, 76)
        .fill(swatch.yellow.fill)
        .ellipse(-16, -84, 16, 10)
        .ellipse(16, -84, 16, 10)
        .fill(swatch.yellow.fill)
        .stroke(line(swatch.yellow.line, 4));
      const wrap = new Graphics();
      if (thing.wrap === 'dots') for (const [x, y] of [[-28, -58], [-22, -32], [-30, -12], [24, -58], [30, -34], [22, -12]]) wrap.circle(x, y, 6).fill({ color: 0xffffff, alpha: 0.85 });
      if (thing.wrap === 'stripes') for (const x of [-34, -20, 20, 34]) wrap.moveTo(x, -72).lineTo(x, -4).stroke({ width: 7, color: 0xffffff, alpha: 0.8, cap: 'round' });
      node.addChild(g, wrap);
      node.hitArea = new Rectangle(-55, -100, 110, 110);
      return { node, width: 96, height: 76 };
    }
    case 'box': {
      if (thing.look === 'pumpkin') {
        const g = new Graphics();
        for (const x of [-26, 26, 0]) g.ellipse(x, -44, 30, 42).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 4));
        g.moveTo(0, -84).quadraticCurveTo(-6, -106, 12, -104).stroke(line(swatch.green.line, 9));
        const sign = label('?', 40, swatch.orange.line); sign.y = -42;
        node.addChild(g, sign); node.hitArea = new Rectangle(-60, -110, 120, 120);
        return { node, width: 116, height: 110, sign };
      }
      if (thing.shape === 'round') {
        // Level 11's round box: an orange hatbox with a lid, the same footprint as the square box.
        const sw = swatch.orange;
        const g = new Graphics()
          .roundRect(-46, -80, 92, 80, 30)
          .fill(sw.fill)
          .stroke(line(sw.line, 6))
          .ellipse(0, -80, 52, 16)
          .fill(sw.light)
          .stroke(line(sw.line, 6))
          .moveTo(-46, -62)
          .quadraticCurveTo(0, -48, 46, -62)
          .stroke(line(sw.line, 4));
        const sign = label('?', 56, sw.line);
        sign.y = -34;
        node.addChild(g, sign);
        node.hitArea = new Rectangle(-55, -105, 110, 115);
        return { node, width: 104, height: 96, sign };
      }
      if (thing.look === 'parcel' || thing.look === 'crate') {
        // Levels 6-7: a paper parcel tied with string, or a slatted crate; the same footprint as the plain box.
        const g = new Graphics();
        if (thing.look === 'parcel') {
          g.roundRect(-50, -92, 100, 92, 10).fill(0xd9b98a).stroke(line(0x9a7448, 6));
          g.moveTo(0, -92).lineTo(0, 0).moveTo(-50, -46).lineTo(50, -46).stroke(line(0x8a4b2a, 5));
          g.ellipse(-12, -98, 12, 8).ellipse(12, -98, 12, 8).stroke(line(0x8a4b2a, 4));
        } else {
          g.roundRect(-50, -92, 100, 92, 6).fill(wood.fill).stroke(line(wood.line, 6));
          for (const y of [-62, -31]) g.moveTo(-50, y).lineTo(50, y).stroke(line(wood.line, 4));
          g.moveTo(-44, -86).lineTo(44, -6).moveTo(44, -86).lineTo(-44, -6).stroke(line(wood.line, 4));
        }
        const sign = label('?', 60, swatch.purple.line);
        sign.style.stroke = { color: 0xffffff, width: 8, join: 'round' };
        sign.y = -48;
        node.addChild(g, sign);
        return { node, width: 104, height: 92, sign };
      }
      const g = new Graphics()
        .roundRect(-50, -92, 100, 92, 10)
        .fill(wood.light)
        .stroke(line(wood.line, 6))
        .moveTo(-50, -46)
        .lineTo(50, -46)
        .stroke(line(wood.line, 4));
      const sign = label('?', 60, swatch.purple.line);
      sign.y = -48;
      node.addChild(g, sign);
      return { node, width: 104, height: 92, sign };
    }
  }
}

/** A round answer button with a number. */
class Pad extends Container {
  readonly glowRing = new Graphics();
  glowing = false;
  private clock = 0;

  constructor(readonly value: number) {
    super();
    const n = label(String(value), 56, 0xffffff);
    n.style.stroke = { color: swatch.blue.line, width: 8, join: 'round' };
    this.addChild(this.glowRing, new Graphics().circle(0, 0, 58).fill(swatch.blue.fill).stroke(line(swatch.blue.line)), n);
    this.hitArea = new Circle(0, 0, 70);
  }

  update(dt: number) {
    this.clock += dt;
    this.glowRing.clear();
    if (this.glowing) this.glowRing.circle(0, 0, 74 + 4 * Math.sin(this.clock * 8)).fill({ color: 0xfff3a0, alpha: 0.8 });
  }
}

class SeesawBalance implements Game {
  readonly plan: SeesawPlan;
  readonly rounds: SeesawRound[];
  items: Item[] = [];
  pads: Pad[] = [];
  index = -1;
  misses = 0;
  hints = 0;
  /** Mistakes this round; the second one brings a hint. */
  wrongs = 0;
  busy = true;
  finished = false;
  /** Balance rules the child has actually watched after changing a tray. */
  readonly observations = new Set<BalanceObservation>();
  /** How far the plank leans now, and how fast it is turning. */
  angle = 0;
  /** Take-the-same-off levels: changes in a row that left it tipped (an experiment, not a miss). */
  tips = 0;
  /** The thing that glows to help after two tips. */
  hintItem: Item | null = null;
  private lastOff: { item: Item; from: Side } | null = null;
  /** Level 11: the gap between the trays after the last change, and whether this pair's glow has been given. */
  private gap = 0;
  private glowUsed = false;
  /** Level 11: changes so far, so a quick burst of moves is judged once, as one change. */
  private changes = 0;
  private spin = 0;
  /** Presents already compared on a tray during the how-to demonstration. */
  private readonly demoTested = new Set<Item>();

  readonly readings: PairReading[] = [];
  readonly shelves = [new Container(), new Container(), new Container()];
  readonly guessSign = label('', 30, ink);
  readonly bounceTargets: Record<Side, Container> = { left: new Container(), right: new Container() };
  private readonly backdrop: Backdrop;
  private readonly stand = new Graphics();
  private readonly plank = new Container();
  readonly trays: Record<Side, Container> = { left: new Container(), right: new Container() };
  private readonly wagon = new Container();
  private readonly layer = new Container();
  private readonly glow = new Graphics();
  private view: View;
  private pivot = { x: 0, y: 0 };
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.rounds = makeRounds(this.plan, ctx.rng);
    this.backdrop = ctx.track(new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.5, clouds: 3, sun: false, seed: 57 }, ctx.view));
    this.plank.addChild(drawPlank(new Graphics()));
    this.trays.left.addChild(drawTray(new Graphics(), 'pink'));
    this.trays.right.addChild(drawTray(new Graphics(), 'teal'));
    const cart = new Graphics()
      .moveTo(-96, -50)
      .lineTo(-150, -86)
      .stroke(line(ink, 6))
      .roundRect(-96, -74, 192, 54, 12)
      .fill(swatch.red.fill)
      .stroke(line(swatch.red.line))
      .circle(-56, -14, 22)
      .circle(56, -14, 22)
      .fill(ink)
      .circle(-56, -14, 8)
      .circle(56, -14, 8)
      .fill(0xb0b0b0);
    this.wagon.addChild(cart);
    this.wagon.visible = this.plan.mode === 'heaviest';
    this.shelves.forEach((spot, rank) => {
      spot.visible = this.plan.mode === 'sort';
      spot.addChild(new Graphics().roundRect(-70, -145, 140, 145, 18).fill(wood.light).stroke(line(wood.line, 4)));
      const size = 14 + rank * 9;
      spot.addChild(new Graphics().roundRect(-size / 2, -size - 6, size, size, 4).fill(wood.fill).stroke(line(wood.line, 3)));
      spot.eventMode = 'none';
    });
    this.guessSign.eventMode = 'none';
    this.glow.eventMode = 'none';
    for (const side of ['left', 'right'] as Side[]) {
      const target = this.bounceTargets[side];
      target.visible = this.plan.mode === 'bounce';
      onTap(target, () => void this.bounce(side));
    }
    ctx.stage.addChild(this.backdrop, this.stand, this.plank, this.trays.left, this.trays.right, this.wagon, ...this.shelves, this.glow, this.layer, this.bounceTargets.left, this.bounceTargets.right, this.guessSign);
  }

  /** The rider's face, for the voice line's `{animal}`. */
  private animalOf(r: SeesawRound): string {
    const rider = r.fixed.find((t) => t.kind === 'friend');
    return rider?.face ?? FRIEND_FOR[r.answer as FriendWeight] ?? 'friend';
  }

  get round(): SeesawRound {
    return this.rounds[this.index];
  }

  start() {
    void this.nextRound();
  }

  // ----- layout -----

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.pivot = { x: v.w / 2, y: v.h * 0.6 };
    const { x, y } = this.pivot;
    const base = y + 120;
    this.stand
      .clear()
      .moveTo(x, y)
      .lineTo(x + 70, base)
      .lineTo(x - 70, base)
      .closePath()
      .fill(wood.line)
      .stroke(line(0x7a5230))
      .circle(x, y, 16)
      .fill(wood.light)
      .stroke(line(wood.line, 4))
      .ellipse(x, base + 4, 110, 14)
      .fill({ color: swatch.green.line, alpha: 0.25 });
    this.plank.position.set(x, y);
    this.wagon.position.set(v.w - 130, v.h - 30);
    for (const side of ['left', 'right'] as Side[]) {
      const target = this.bounceTargets[side];
      target.position.set(side === 'left' ? 0 : v.w / 2, y - 260);
      target.hitArea = new Rectangle(0, 0, v.w / 2, 370);
    }
    this.shelves.forEach((spot, i) => spot.position.set(v.w / 2 + (i - 1) * 180, v.h - 15));
    this.guessSign.position.set(v.w / 2, 150);
    this.layoutGround();
    this.layoutPads();
  }

  private layoutGround() {
    const v = this.view;
    const loose = this.items.filter((i) => !i.fixed);
    const right = this.plan.mode === 'heaviest' ? v.w - 300 : v.w - 40;
    const xs = spread(loose.length, 150, right, loose.some((i) => i.thing.kind === 'friend') ? 190 : 130);
    loose.forEach((item, i) => {
      item.ground = { x: xs[i], y: v.h - (this.plan.mode === 'sort' ? 210 : 34) };
      if (!item.side && !item.inWagon && item.shelf === undefined && !item.drag?.dragging) {
        if (item.drag) item.drag.home = item.ground;
        item.node.position.set(item.ground.x, item.ground.y);
      }
    });
  }

  private layoutPads() {
    const v = this.view;
    this.pads.forEach((p, i) => p.position.set(v.w / 2 + (i - 1) * 170, v.h - 90));
  }

  /** The middle of a tray's top, where things stand. */
  trayTop(side: Side) {
    const s = side === 'left' ? -1 : 1;
    return {
      x: this.pivot.x + s * ARM * Math.cos(this.angle),
      y: this.pivot.y + s * ARM * Math.sin(this.angle) - POST - 10,
    };
  }

  /** Where each thing on a side stands, relative to the tray's top: rows that fit on the tray. */
  private slots(side: Side) {
    const on = this.items.filter((i) => i.side === side);
    const rows: Item[][] = [[]];
    let width = 0;
    for (const item of on) {
      if (width + item.width > TRAY_W && rows[rows.length - 1].length) {
        rows.push([]);
        width = 0;
      }
      rows[rows.length - 1].push(item);
      width += item.width;
    }
    const out = new Map<Item, { x: number; y: number }>();
    let y = 0;
    for (const row of rows) {
      const rowW = row.reduce((s, i) => s + i.width, 0);
      let x = -rowW / 2;
      for (const item of row) {
        out.set(item, { x: x + item.width / 2, y });
        x += item.width;
      }
      y -= Math.max(...row.map((i) => i.height)) + 4;
    }
    return out;
  }

  private slotFor(item: Item) {
    const top = this.trayTop(item.side!);
    const at = this.slots(item.side!).get(item) ?? { x: 0, y: 0 };
    return { x: top.x + at.x, y: top.y + at.y };
  }

  get weights() {
    const on = (side: Side) => total(this.items.filter((i) => i.side === side).map((i) => i.thing));
    return { left: on('left'), right: on('right') };
  }

  // ----- the frame loop -----

  update(dt: number) {
    this.clock += dt;
    const { left, right } = this.weights;
    // A springy seesaw: it swings toward its lean and wobbles a little before settling.
    const step = Math.min(dt, 1 / 30);
    this.spin += (60 * (tilt(left, right) - this.angle) - 7 * this.spin) * step;
    this.angle += this.spin * step;
    this.plank.rotation = this.angle;
    for (const side of ['left', 'right'] as Side[]) {
      const top = this.trayTop(side);
      this.trays[side].position.set(top.x, top.y + 10);
    }
    for (const item of this.items) {
      if (!item.side || item.settling || item.drag?.dragging) continue;
      const p = this.slotFor(item);
      item.node.position.set(p.x, p.y);
      if (item.drag) item.drag.home = p;
    }
    if (this.plan.mode === 'sort') {
      for (const item of this.items) if (item.shelf !== undefined && !item.drag?.dragging) {
        const spot = this.shelves[item.shelf]; item.node.position.set(spot.x, spot.y - 55);
        if (item.drag) item.drag.home = { x: item.node.x, y: item.node.y };
      }
      const a = this.items.findIndex(i => i.side === 'left' && !i.settling && !i.drag?.dragging);
      const b = this.items.findIndex(i => i.side === 'right' && !i.settling && !i.drag?.dragging);
      if (a >= 0 && b >= 0 && !this.readings.some(r => [r.lighter, r.heavier].includes(a) && [r.lighter, r.heavier].includes(b))) {
        this.readings.push(this.items[a].thing.weight < this.items[b].thing.weight ? { lighter: a, heavier: b } : { lighter: b, heavier: a });
      }
    }
    this.drawGlow();
  }

  /** Use the real drags to compare, balance, or take equal things away, then tap the box's weight. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.round) return null;
    for (const item of this.items) if (item.side) this.demoTested.add(item);
    const demoItems = this.items.map((item) => ({
      thing: item.thing,
      fixed: item.fixed,
      side: item.side,
      inWagon: item.inWagon,
      tested: this.demoTested.has(item), shelf: item.shelf,
    }));
    const move = this.plan.mode === 'sort' ? sortTouch(demoItems, this.readings) : seesawTouch(this.plan, this.round, demoItems, this.pads.length > 0);
    if (!move) return null;
    if (move.kind === 'tray') return { tap: { on: this.bounceTargets[move.side], x: this.view.w / 4, y: 200 } };
    if (move.kind === 'friend') {
      const item = this.items[move.item];
      return { tap: { on: item.node, x: 0, y: -item.height / 2 } };
    }
    if (move.kind === 'answer') {
      const pad = this.plan.mode === 'guess' && this.round.prediction === undefined ? this.pads[0] : this.pads.find((p) => p.value === move.value);
      return pad ? { tap: { on: pad } } : null;
    }
    const item = this.items[move.item];
    if (!item?.drag || item.drag.dragging || !item.drag.enabled) return null;
    if (typeof move.to === 'number') return { drag: { on: item.node }, to: { on: this.shelves[move.to], x: 0, y: -70 } };
    if (move.to === 'wagon') return { drag: { on: item.node }, to: { on: this.wagon, x: 0, y: -66 } };
    if (move.to === 'ground') return { drag: { on: item.node }, to: { on: this.ctx.stage, x: item.ground.x, y: item.ground.y } };
    const at = this.trayTop(move.to);
    return { drag: { on: item.node }, to: { on: this.ctx.stage, x: at.x, y: at.y } };
  }

  private drawGlow() {
    const g = this.glow.clear();
    const a = 0.55 + 0.3 * Math.sin(this.clock * 6);
    const hint = this.hintItem;
    if (hint && !this.finished) g.roundRect(hint.node.x - hint.width / 2 - 20, hint.node.y - hint.height - 22, hint.width + 40, hint.height + 40, 24).fill({ color: 0xfff3a0, alpha: a });
    if (this.finished || this.wrongs < 2) return;
    const mode = this.plan.mode;
    const ring = (x: number, y: number, w: number, h: number) => g.roundRect(x - w / 2, y - h, w, h, 24).fill({ color: 0xfff3a0, alpha: a });
    if (mode === 'up' || mode === 'heavy') {
      const top = this.trayTop(other(this.round.fixedSide));
      ring(top.x, top.y + 24, TRAY_W + 30, 50);
      if (mode === 'heavy') {
        const heavier = this.items.find((i) => !i.fixed && i.thing.weight > this.round.answer);
        if (heavier && !heavier.side) ring(heavier.node.x, heavier.node.y + 10, heavier.width + 40, heavier.height + 40);
      }
    }
    if (mode === 'sort') {
      const item = this.hintItem;
      if (item && item.shelf === undefined) { const rank = this.rank(item); const spot = this.shelves[rank]; ring(spot.x, spot.y, 140, 145); }
    }
    if (mode === 'heaviest') {
      const heaviest = this.items.find((i) => i.thing.weight === this.round.answer && !i.inWagon);
      if (heaviest) ring(heaviest.node.x, heaviest.node.y + 10, 130, 120);
    }
    if (mode === 'level' || mode === 'mystery' || mode === 'parts' || mode === 'guess' || mode === 'difference') {
      // Glow what to take off: the things beyond a level seesaw.
      const over = this.excess();
      for (const item of over) ring(item.node.x, item.node.y + 8, item.width + 16, item.height + 20);
      // Under, not over: ring the next block on the grass.
      if (!over.length) {
        const next = seesawTouch(this.plan, this.round, this.items.map((i) => ({ thing: i.thing, fixed: i.fixed, side: i.side, inWagon: i.inWagon })));
        const pick = next?.kind === 'move' ? this.items[next.item] : undefined;
        if (pick && !pick.side && !pick.drag?.dragging) ring(pick.node.x, pick.node.y + 8, pick.width + 16, pick.height + 20);
      }
    }
  }

  /** On an overloaded side, the most recently added things that make it too heavy. */
  private excess(): Item[] {
    const side = other(this.round.fixedSide);
    const fixed = total(this.round.fixed);
    const added = this.items.filter((i) => i.side === side);
    const out: Item[] = [];
    let sum = total(added.map((i) => i.thing));
    for (const item of [...added].reverse()) {
      if (sum <= fixed) break;
      out.push(item);
      sum -= item.thing.weight;
    }
    return out;
  }

  destroy() {
    for (const item of this.items) item.drag?.destroy();
  }

  // ----- rounds -----

  private async nextRound() {
    this.index++;
    this.wrongs = 0;
    this.busy = true;
    this.tips = 0;
    this.hintItem = null;
    this.lastOff = null;
    this.gap = 0;
    this.glowUsed = false;
    this.demoTested.clear();
    this.readings.length = 0;
    this.guessSign.text = '';
    const r = this.round;
    const same = this.plan.mode === 'same' || this.plan.mode === 'share';
    // On the take-the-same-off levels everything starts on the trays, and anything can come off. Level 11's
    // reading only shows the square box against its blocks, and the round box never comes off.
    const reading = r.phase === 'read';
    const held = (thing: Thing) => (this.plan.mode === 'pair' ? reading || stays(thing) : !same);
    r.fixed.forEach((thing, i) => this.addItem(thing, i, held(thing), r.fixedSide));
    r.across?.forEach((thing, i) => this.addItem(thing, i, reading || this.plan.mode === 'compare' || this.plan.mode === 'difference', other(r.fixedSide)));
    r.offered.forEach((thing, i) => this.addItem(thing, i, false, null));
    this.layoutGround();
    for (const item of this.items) {
      item.node.scale.set(0);
      void this.ctx.tw.to(item.node.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
    }
    await this.ctx.tw.wait(0.4);
    const animal = this.animalOf(r);
    const mode = this.plan.mode;
    if (mode === 'bounce') await this.ctx.instruct('seesaw.bounce');
    else if (mode === 'compare') await this.ctx.instruct(r.asked === 'heavier' ? 'seesaw.ask-heavy' : 'seesaw.ask-light');
    else if (mode === 'up') await this.ctx.instruct('seesaw.up', { animal });
    else if (mode === 'heavy') await this.ctx.instruct('seesaw.heavy', { animal });
    else if (mode === 'level') await this.ctx.instruct('seesaw.level');
    else if (mode === 'guess') {
      await this.ctx.instruct('seesaw.guess');
      this.showPads(); return;
    }
    else if (mode === 'sort') await this.ctx.instruct('seesaw.sort');
    else if (mode === 'difference') await this.ctx.instruct('seesaw.difference', { heavy: total(r.fixed), light: total(r.across ?? []) });
    else if (mode === 'heaviest') await this.ctx.instruct('seesaw.heaviest');
    else if (mode === 'parts') await this.ctx.instruct('seesaw.parts', { n: r.answer });
    else if (mode === 'same') await this.ctx.instruct(this.plan.boxes === 2 ? 'seesaw.same-boxes' : 'seesaw.same');
    else if (mode === 'share') await this.ctx.instruct('seesaw.share');
    else if (mode === 'pair') {
      const square = r.fixed.find((t) => t.shape === 'square')!;
      if (reading) {
        await this.ctx.instruct('seesaw.pair-first');
        return this.showPads();
      }
      await this.ctx.instruct('seesaw.pair', { n: square.weight });
    } else await this.ctx.instruct(this.plan.boxes === 2 ? 'seesaw.twins' : 'seesaw.mystery');
    this.busy = false;
  }

  private addItem(thing: Thing, i: number, fixed: boolean, side: Side | null) {
    const made = thingNode(thing, i);
    const item: Item = { thing, ...made, fixed, side, ground: { x: 0, y: 0 }, settling: false, inWagon: false };
    if (made.critter) this.ctx.track(made.critter);
    // The square box keeps the number it was given on the reading for the rest of its pair.
    if (thing.shape === 'square' && this.round.phase === 'pair') made.sign!.text = String(thing.weight);
    if (stays(thing)) onTap(made.node, () => this.roundStays(made.node), { cooldown: 800 });
    if (this.plan.mode === 'compare') {
      // Body-centred circles stay at least 140 units wide even for the smallest friend.
      made.node.hitArea = new Circle(0, -made.height / 2, Math.max(70, made.height / 2 + 10));
      onTap(made.node, () => void this.compare(item), { cooldown: 400 });
    }
    if (!fixed && this.plan.mode !== 'bounce') {
      item.drag = draggable(made.node, this.ctx.tw, {
        onPick: () => {
          item.pickedAt = { x: made.node.x, y: made.node.y };
          if (this.plan.mode === 'sort' && this.wrongs >= 2) this.hintItem = item;
          sfx.tick();
          made.critter?.poke();
        },
        onDrop: (x, y) => this.drop(item, x, y),
      });
    }
    this.layer.addChild(made.node);
    this.items.push(item);
    if (side) made.node.position.set(this.slotFor(item).x, this.slotFor(item).y);
  }

  /** Any touch on the empty half lifts the rider; touching the rider is free exploration. */
  private async bounce(side: Side) {
    if (this.busy || this.finished) return;
    if (side === this.round.fixedSide) {
      this.items[0].critter?.poke();
      sfx.tick();
      void this.ctx.instruct('seesaw.bounce');
      return;
    }
    this.busy = true;
    const lifter = this.items.find((i) => !i.fixed)!;
    lifter.critter?.poke();
    sfx.pop();
    lifter.side = side;
    lifter.settling = true;
    await this.ctx.tw.to(lifter.node, this.slotFor(lifter), { duration: 0.4, ease: ease.outBack });
    lifter.settling = false;
    this.observations.add('heavy-down');
    await this.ctx.say('seesaw.wee', { animal: this.animalOf(this.round) });
    await this.won();
  }

  private async compare(item: Item) {
    if (this.busy || this.finished) return;
    this.busy = true;
    item.critter?.poke();
    sfx.tick();
    if (item.thing.weight !== this.round.answer) {
      this.miss();
      if (this.wrongs === 2) {
        this.hintItem = this.items.find((i) => i.thing.weight === this.round.answer)!;
      }
      await this.ctx.say(this.round.asked === 'heavier' ? 'seesaw.hint-heavy' : 'seesaw.hint-light');
      this.busy = false;
      return;
    }
    this.hintItem = null;
    this.observations.add('heavy-down');
    const heavy = this.round.asked === 'heavier';
    sfx.bell(heavy ? 2 : 7);
    await this.ctx.tw.wait(0.18);
    sfx.bell(heavy ? 7 : 2);
    await this.ctx.say(heavy ? 'seesaw.yes-heavy' : 'seesaw.yes-light');
    await this.won();
  }

  /** A touch on the round box: a wiggle and a reminder, never a miss. */
  private roundStays(node: Container) {
    if (this.finished) return;
    sfx.tick();
    void this.ctx.tw.to(node, { rotation: 0.12 }, { duration: 0.08 }).then(() => this.ctx.tw.to(node, { rotation: -0.12 }, { duration: 0.12 })).then(() => this.ctx.tw.to(node, { rotation: 0 }, { duration: 0.08 }));
    if (!this.pads.length) void this.ctx.say('seesaw.round-stays');
  }

  private trayAt(x: number, y: number): Side | null {
    for (const side of ['left', 'right'] as Side[]) {
      const top = this.trayTop(side);
      if (Math.abs(x - top.x) < TRAY_W / 2 + 40 && y > top.y - 260 && y < top.y + 100) return side;
    }
    return null;
  }

  private overWagon(x: number, y: number) {
    return this.wagon.visible && Math.abs(x - this.wagon.x) < 130 && y > this.wagon.y - 220 && y < this.wagon.y + 40;
  }

  private drop(item: Item, x: number, y: number): boolean {
    if (this.busy || this.finished) return false;
    const mode = this.plan.mode;
    if (mode === 'sort') {
      const slot = this.shelves.findIndex(spot => Math.abs(x - spot.x) <= 75 && y >= spot.y - 145 && y <= spot.y + 20);
      if (slot >= 0) return this.toShelf(item, slot);
    }
    if (mode === 'guess' && this.round.prediction === undefined) return false;
    if (mode === 'heaviest' && this.overWagon(x, y)) return this.toWagon(item);
    // Levels 1 and 2: a tap on a friend on the grass hops it to the empty tray.
    const tapped = (mode === 'up' || mode === 'heavy') && item.thing.kind === 'friend' && !item.side && !!item.pickedAt && Math.hypot(x - item.pickedAt.x, y - item.pickedAt.y) < TAP_REACH;
    const side = tapped ? other(this.round.fixedSide) : this.trayAt(x, y);
    if (!side) {
      if (item.side) this.takeOff(item);
      return false;
    }
    if (side === item.side) {
      this.settle(item);
      return true;
    }
    // Blocks and weights go opposite what is already there; a friend on the rider's own side is a mistake.
    if ((mode === 'level' || mode === 'parts' || mode === 'mystery' || mode === 'guess' || mode === 'difference') && side === this.round.fixedSide) {
      void this.ctx.say(mode === 'difference' ? 'seesaw.already-down' : 'seesaw.this-side');
      if (item.side) this.takeOff(item);
      return false;
    }
    if (mode === 'heaviest' || mode === 'sort') for (const there of this.items.filter((i) => i.side === side)) this.takeOff(there, true);
    if (item.side) this.lastOff = { item, from: item.side };
    if (item.side) item.side = null;
    item.shelf = undefined;
    item.side = side;
    this.settle(item);
    this.observeBalance();
    sfx.clunk();
    void this.placed(item, side);
    return true;
  }

  /** Glides a dropped thing into its spot on the tray. */
  private settle(item: Item) {
    item.settling = true;
    const p = this.slotFor(item);
    void this.ctx.tw.to(item.node, { x: p.x, y: p.y }, { duration: 0.16, ease: ease.outQuad }).then(() => (item.settling = false));
  }

  /** Off the seesaw and back to the grass. `walk` sends it home (otherwise the drag floats it there). */
  private takeOff(item: Item, walk = false) {
    if (item.side) this.lastOff = { item, from: item.side };
    item.side = null;
    item.settling = false;
    this.observeBalance();
    if (item.drag) item.drag.home = item.ground;
    if (walk) void this.ctx.tw.to(item.node, { x: item.ground.x, y: item.ground.y }, { duration: 0.4, ease: ease.outBack });
    void this.removed();
  }

  private miss() {
    this.misses++;
    this.wrongs++;
    if (this.wrongs === 2) this.hints++;
    sfx.boing();
  }

  private observeBalance() {
    const seen = balanceObservation(this.weights.left, this.weights.right);
    if (seen) this.observations.add(seen);
  }

  private async placed(item: Item, side: Side) {
    const mode = this.plan.mode;
    const r = this.round;
    if (mode === 'heaviest' || mode === 'sort') return;
    if (mode === 'same' || mode === 'share' || mode === 'pair') return this.checkSame();
    if (mode === 'up' || mode === 'heavy') {
      this.busy = true;
      await this.ctx.tw.wait(0.7);
      const { left, right } = this.weights;
      const rider = this.items.find((i) => i.fixed)!;
      if (side !== r.fixedSide && downSide(left, right) === side) {
        rider.critter?.cheer();
        sfx.giggle();
        await this.ctx.say('seesaw.wee', { animal: this.animalOf(r) });
        return this.won();
      }
      this.miss();
      await this.ctx.say(side === r.fixedSide ? 'seesaw.other' : 'seesaw.light', { animal: this.animalOf(r) });
      this.takeOff(item, true);
      await this.ctx.tw.wait(0.4);
      this.busy = false;
      return;
    }
    // Level, parts and mystery: compare what was added with what was there.
    const fixed = total(r.fixed);
    const on = this.items.filter((i) => i.side === side);
    const added = total(on.map((i) => i.thing));
    const result = weigh(fixed, added);
    if (result === 'over') {
      this.miss();
      void this.ctx.say('seesaw.too-many');
      return;
    }
    void this.ctx.say('count', { n: mode === 'parts' ? added : on.filter(i => i.thing.kind === 'block').length });
    if (result === 'level') await this.balanced();
  }

  private async removed() {
    if (this.busy || this.finished) return;
    const mode = this.plan.mode;
    if (mode === 'same' || mode === 'share' || mode === 'pair') return this.checkSame();
    if (mode !== 'level' && mode !== 'parts' && mode !== 'mystery' && mode !== 'guess' && mode !== 'difference') return;
    const side = other(this.round.fixedSide);
    const added = total(this.items.filter((i) => i.side === side).map((i) => i.thing));
    if (weigh(total(this.round.fixed), added) === 'level') await this.balanced();
  }

  /**
   * After any change on a take-the-same-off level: tipped means one side changed alone (said aloud, never a
   * miss); level with the box alone means we can read its weight from the blocks across.
   */
  private async checkSame() {
    if (this.busy || this.finished) return;
    const change = ++this.changes;
    await this.ctx.tw.wait(0.5);
    if (this.busy || this.finished) return;
    if (this.plan.mode === 'pair' && change !== this.changes) return;
    const { left, right } = this.weights;
    if (this.plan.mode === 'pair') return this.checkPair(Math.abs(left - right));
    if (left !== right) {
      this.tips++;
      await this.ctx.say('seesaw.tipped');
      if (this.tips >= 2 && !this.hintItem) {
        this.hintItem = this.suggest();
        if (this.hintItem) {
          this.hints++;
          void this.ctx.say('seesaw.same-hint');
        }
      }
      return;
    }
    this.tips = 0;
    this.hintItem = null;
    const sides = { left: this.items.filter((i) => i.side === 'left').map((i) => i.thing), right: this.items.filter((i) => i.side === 'right').map((i) => i.thing) };
    if (aloneSide(sides) || (this.plan.mode === 'share' && shareSide(sides))) return this.balanced();
    void this.ctx.say('seesaw.still-level');
  }

  /**
   * Level 11: a change that narrows the gap is free and resets the tips; one that widens it, or tips a level
   * seesaw, is a tip (said aloud, never a miss). When the tagged square box leaves, the pet says what it is worth.
   */
  private async checkPair(after: number) {
    const step = progress(this.gap, after);
    this.gap = after;
    const sides = { left: this.items.filter((i) => i.side === 'left').map((i) => i.thing), right: this.items.filter((i) => i.side === 'right').map((i) => i.thing) };
    if (step === 'level') {
      this.tips = 0;
      this.hintItem = null;
      if (aloneSide(sides)) return this.balanced();
      void this.ctx.say('seesaw.still-level');
      return;
    }
    // The glow follows the gap: once its thing has moved, it goes out.
    if (this.hintItem && this.hintItem !== this.hintAt()) this.hintItem = null;
    if (step === 'closer') {
      this.tips = 0;
      void this.ctx.say('seesaw.closer');
      return;
    }
    this.tips++;
    const off = this.lastOff?.item;
    const swapped = off && off.side === null && off.thing.shape === 'square';
    await this.ctx.say(swapped ? 'seesaw.swap-tipped' : 'seesaw.tipped', { n: off?.thing.weight ?? 0 });
    if (this.busy || this.finished) return;
    if (this.tips >= 2 && !this.glowUsed) {
      this.hintItem = this.hintAt();
      if (this.hintItem) {
        this.glowUsed = true;
        this.hints++;
        void this.ctx.say('seesaw.same-hint');
      }
    }
  }

  /** Level 11's glow: the thing that narrows the gap now. */
  private hintAt(): Item | null {
    const off = this.lastOff ? this.items.indexOf(this.lastOff.item) : -1;
    const pick = pairHint(this.items.map((item) => ({ thing: item.thing, fixed: item.fixed, side: item.side })), off < 0 ? null : off);
    return pick === null ? null : this.items[pick];
  }

  /** Something that makes it level again: the same kind of thing from the heavy side, or the last thing back on. */
  private suggest(): Item | null {
    const { left, right } = this.weights;
    const heavy = downSide(left, right);
    if (!heavy) return null;
    const off = this.lastOff;
    const kind: ThingKind = off?.item.thing.kind ?? 'block';
    const match = this.items.find((i) => i.side === heavy && i.thing.kind === kind);
    if (off && off.from !== heavy && match) return match;
    if (off && !off.item.side) return off.item;
    return this.items.find((i) => i.side === heavy) ?? null;
  }

  private async balanced() {
    this.busy = true;
    await this.ctx.tw.wait(0.6);
    if (this.plan.mode !== 'mystery' && this.plan.mode !== 'same' && this.plan.mode !== 'share' && this.plan.mode !== 'pair' && this.plan.mode !== 'guess' && this.plan.mode !== 'difference') {
      await this.ctx.say('seesaw.balanced');
      return this.won();
    }
    // How heavy is the box? The blocks tell us.
    this.hintItem = null;
    if (this.plan.mode === 'guess') await this.ctx.instruct('seesaw.pumpkin-answer');
    else if (this.plan.mode === 'difference') await this.ctx.instruct('seesaw.difference-answer');
    else if (this.plan.mode === 'same') await this.ctx.instruct('seesaw.alone');
    else if (this.plan.mode === 'pair') await this.ctx.instruct('seesaw.round-alone');
    else if (this.plan.mode === 'share') await this.ctx.instruct('seesaw.share-answer');
    else await this.ctx.instruct(this.plan.boxes === 2 ? 'seesaw.each' : 'seesaw.how-many', { n: total(this.round.fixed) });
    this.showPads();
  }

  /** The three number pads; the things on the trays stay put and the spares on the grass fade away. */
  private showPads() {
    this.pads = numberChoices(this.ctx.rng, this.round.answer).map((n) => {
      const pad = this.ctx.track(new Pad(n));
      onTap(pad, () => void this.answer(pad), { cooldown: 400 });
      pad.scale.set(0);
      this.ctx.stage.addChild(pad);
      void this.ctx.tw.to(pad.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
      return pad;
    });
    // The blocks have done their job: they stay put, and the spares on the grass fade away.
    for (const item of this.items) if (item.drag) item.drag.enabled = false;
    for (const item of this.items.filter((i) => !i.side && !(this.plan.mode === 'guess' && this.round.prediction === undefined))) void this.ctx.tw.to(item.node, { alpha: 0 }, { duration: 0.3 });
    this.layoutPads();
    this.busy = false;
  }

  private async answer(pad: Pad) {
    if (this.busy || this.finished || !this.pads.length) return;
    this.busy = true;
    if (this.plan.mode === 'guess' && this.round.prediction === undefined) {
      this.round.prediction = pad.value;
      this.guessSign.text = `Guess: ${pad.value}`;
      this.clearPads();
      for (const item of this.items) if (item.drag) item.drag.enabled = true;
      await this.ctx.say('seesaw.guessed', { guess: pad.value });
      await this.ctx.instruct('seesaw.measure-pumpkin');
      this.busy = false;
      return;
    }
    // Level 11 names only the box being weighed: the square box on the reading, the round box after.
    const pair = this.plan.mode === 'pair';
    const reading = this.round.phase === 'read';
    const boxes = this.items.filter((i) => i.thing.kind === 'box' && (!pair || i.thing.shape === (reading ? 'square' : 'round')));
    if (pad.value === this.round.answer) {
      pad.glowing = true;
      sfx.bell(8, 0.3);
      boxes.forEach(box => { box.sign!.text = String(this.round.answer); });
      if (this.plan.mode === 'guess') {
        this.guessSign.text = `Guess: ${this.round.prediction}    Measured: ${this.round.answer}`;
        const comparison = predictionComparison(this.round.prediction!, this.round.answer);
        await this.ctx.say(`seesaw.guess-${comparison}`, { guess: this.round.prediction!, n: this.round.answer });
      } else await this.ctx.say(this.plan.mode === 'difference' ? 'seesaw.difference-yes' : reading ? 'seesaw.pair-tag' : 'seesaw.box', { n: this.round.answer });
      return this.won();
    }
    this.miss();
    const twins = this.plan.mode === 'mystery' && this.plan.boxes === 2;
    await this.ctx.say(twins ? 'seesaw.twins-hint' : 'seesaw.count-again', { n: total(this.round.fixed), each: this.round.answer });
    const blocks = this.items.filter((i) => i.side && i.thing.kind === 'block');
    for (let k = 0; k < blocks.length; k++) {
      void this.ctx.tw.to(blocks[k].node.scale, { x: 1.2, y: 1.2 }, { duration: 0.15 }).then(() => this.ctx.tw.to(blocks[k].node.scale, { x: 1, y: 1 }, { duration: 0.15 }));
      sfx.bell(5 + k, 0.2);
      await this.ctx.say('count', { n: twins ? k % this.round.answer + 1 : k + 1 });
    }
    if (this.plan.mode !== 'guess' && this.plan.mode !== 'difference' || this.wrongs >= 2) this.pads.find((p) => p.value === this.round.answer)!.glowing = true;
    this.busy = false;
  }

  private rank(item: Item) { return this.items.filter(i => i.thing.weight < item.thing.weight).length; }

  private toShelf(item: Item, slot: number): boolean {
    if (slot !== this.rank(item)) {
      this.miss();
      if (this.wrongs >= 2) this.hintItem = item;
      void this.ctx.say('seesaw.sort-hint');
      if (item.side) this.takeOff(item);
      return false;
    }
    item.side = null; item.shelf = slot;
    item.drag!.enabled = false;
    this.hintItem = null;
    item.node.position.set(this.shelves[slot].x, this.shelves[slot].y - 55);
    sfx.clunk();
    if (this.items.every(i => i.shelf !== undefined)) void this.won();
    return true;
  }

  private clearPads() {
    for (const pad of this.pads) { this.ctx.untrack(pad); pad.destroy({ children: true }); }
    this.pads = [];
  }

  private toWagon(item: Item): boolean {
    if (item.thing.weight !== this.round.answer) {
      this.miss();
      void this.ctx.say('seesaw.not-heaviest');
      if (item.side) this.takeOff(item);
      return false;
    }
    this.busy = true;
    if (item.side) item.side = null;
    item.inWagon = true;
    item.drag!.enabled = false;
    void this.ctx.tw.to(item.node, { x: this.wagon.x, y: this.wagon.y - 66 }, { duration: 0.2, ease: ease.outQuad });
    sfx.clunk();
    void this.ctx.say('seesaw.heaviest-yes').then(() => this.won());
    return true;
  }

  private async won() {
    this.busy = true;
    this.ctx.pet.cheer();
    for (const item of this.items) item.critter?.cheer();
    sfx.sparkle();
    const top = this.pivot;
    this.ctx.particles.burst(top.x, top.y - 120, { kind: 'star', colors: [0xffd54a, 0xffffff], count: 14, speed: [120, 300], gravity: 0, life: [0.5, 0.9] });
    await this.ctx.tw.wait(1.4);
    await this.clear();
    if (this.index + 1 >= this.rounds.length) return this.finale();
    void this.nextRound();
  }

  /** Everyone and everything hops off and away. */
  private async clear() {
    const gone = [...this.items];
    this.items = [];
    for (const pad of this.pads) {
      this.ctx.untrack(pad);
      pad.destroy({ children: true });
    }
    this.pads = [];
    await Promise.all(
      gone.map(async (item) => {
        item.drag?.destroy();
        this.ctx.tw.kill(item.node);
        await this.ctx.tw.to(item.node, { alpha: 0 }, { duration: 0.3 });
        if (item.critter) this.ctx.untrack(item.critter);
        item.node.destroy({ children: true });
      }),
    );
  }

  private async finale() {
    this.finished = true;
    const colors = RAINBOW.map((c) => swatch[c].fill);
    this.ctx.particles.burst(this.view.w / 2, this.view.h * 0.3, { kind: 'confetti', colors, count: 60, speed: [200, 600], gravity: 600, life: [1.2, 2] });
    sfx.tada();
    await this.ctx.say('seesaw.done');
    await this.ctx.tw.wait(0.6);
    this.ctx.finish({ misses: this.misses, hints: this.hints, discoveries: [...this.observations].map((seen) => entryId('seesaw-balance', seen)) });
  }
}

/** A little seesaw for the hub, rocking a duck and a bear. */
function seesawArt(left: FriendWeight, right: FriendWeight, lean = 0): { art: Container; plank: Container } {
  const art = new Container();
  const stand = new Graphics().moveTo(0, -70).lineTo(40, 0).lineTo(-40, 0).closePath().fill(wood.line).stroke(line(0x7a5230, 5));
  const plank = new Container();
  plank.position.set(0, -70);
  plank.addChild(new Graphics().roundRect(-140, -9, 280, 18, 9).fill(wood.fill).stroke(line(wood.line, 5)));
  for (const [x, w] of [[-112, left], [112, right]] as const) {
    const c = new Critter(CRITTERS[FRIEND_FOR[w]]);
    c.alive = false;
    c.scale.set(friendScale(w) * 0.55);
    c.position.set(x, -8);
    plank.addChild(c);
  }
  plank.rotation = lean;
  art.addChild(stand, plank);
  return { art, plank };
}

/** The two balance observations as still pictures for the discovery journal. */
export function seesawJournalPicture(observation: BalanceObservation): Container {
  const { art } = observation === 'heavy-down' ? seesawArt(1, 4, 0.16) : seesawArt(2, 2, 0);
  art.y = 60;
  return art;
}

class SeesawIcon extends Container {
  private readonly plank: Container;
  private clock = 0;

  constructor() {
    super();
    const { art, plank } = seesawArt(1, 4);
    this.plank = plank;
    this.addChild(art);
  }

  update(dt: number) {
    this.clock += dt;
    this.plank.rotation = 0.12 + 0.06 * Math.sin(this.clock * 1.8);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const light = rng.int(1, 2) as FriendWeight;
  const heavy = rng.int(3, 4) as FriendWeight;
  const flip = rng.chance(0.5);
  const c = new Container();
  const { art } = seesawArt(flip ? heavy : light, flip ? light : heavy, flip ? -0.16 : 0.16);
  art.y = 70;
  c.addChild(art);
  return c;
}

export const seesawBalance: GameModule = {
  id: 'seesaw-balance',
  name: 'Seesaw Balance',
  titleLine: 'game.seesaw-balance',
  region: 'tinker-lab',
  skills: ['comparison', 'measurement', 'equality', 'counting'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  entryLevels: [12, 13],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.stickers,
  touchDemo: true,
  coplayHint: 'Hold two things with {name}, one in each hand: which is heavier? Then try them on the seesaw.',
  offScreen: 'Hang two cups from a coat hanger and add spoons or coins until it hangs level.',
  hubIcon: () => new SeesawIcon(),
  sticker,
  create: (ctx) => new SeesawBalance(ctx),
};
