import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { answerOf, choices, hintSpans, isRuler, longerShorter, makeMeasures, measureTouch, planFor, temptingReading, UNIT_SIZE, type Measure, type MeasurePlan, type Thing } from './logic';

const LEVELS: BandLevels = {
  prek: { min: 1, max: 7, order: [1, 2, 7] },
  school: { min: 1, max: 7, order: [1, 2, 7, 3, 4, 5, 6] },
};

const U = 88;
const THING_WORDS: Record<Thing, string> = { leaf: 'leaf', pencil: 'pencil', snake: 'snake', stick: 'stick' };

function wormArt(): Container {
  const c = new Container();
  const g = new Graphics();
  for (let k = 0; k < 5; k++) g.circle(-U / 2 + 12 + k * 16, 0, 11).fill(k === 4 ? swatch.green.fill : swatch.green.light).stroke({ width: 3, color: swatch.green.line });
  g.circle(U / 2 - 12, -3, 2.5).fill(ink);
  c.addChild(g);
  return c;
}

/** A big worm, two little worms long: bigger and orange, so size and colour both tell them apart. */
function bigWormArt(): Container {
  const c = new Container();
  const g = new Graphics();
  for (let k = 0; k < 10; k++) g.circle(-U + 15 + k * 16, 0, 15.4).fill(k === 9 ? swatch.orange.fill : swatch.orange.light).stroke({ width: 3, color: swatch.orange.line });
  g.circle(U - 15, -4, 3.2).fill(ink);
  c.addChild(g);
  return c;
}

function thingArt(thing: Thing, length: number, unit = U): Graphics {
  const w = length * unit;
  const g = new Graphics();
  if (thing === 'leaf') {
    g.moveTo(0, 0).quadraticCurveTo(w / 2, -34, w, 0).quadraticCurveTo(w / 2, 34, 0, 0).fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line });
    g.moveTo(4, 0).lineTo(w - 4, 0).stroke({ width: 3, color: swatch.green.line });
  } else if (thing === 'pencil') {
    g.rect(0, -14, w - 30, 28).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
    g.poly([w - 30, -14, w, 0, w - 30, 14]).fill(wood.light).stroke({ width: 3, color: wood.line }).poly([w - 9, -4, w, 0, w - 9, 4]).fill(ink);
    g.rect(0, -14, 14, 28).fill(swatch.pink.fill);
  } else if (thing === 'snake') {
    g.roundRect(0, -14, w, 28, 14).fill(swatch.purple.fill).stroke({ width: 3, color: swatch.purple.line });
    for (let x = 20; x < w - 20; x += 30) g.circle(x, 0, 5).fill(swatch.purple.light);
    g.circle(w - 14, -4, 3).fill(ink);
  } else {
    g.roundRect(0, -10, w, 20, 10).fill(wood.fill).stroke({ width: 3, color: wood.line });
  }
  return g;
}

interface Row {
  thing: Thing;
  length: number;
  start: number;
  y: number;
  worms: number;
  /** How many little worms long this row's worms are (2 for the big worms' row). */
  size: number;
  node: Container;
}

class Inchworm implements Game {
  readonly plan: MeasurePlan;
  readonly measures: Measure[];
  readonly rows: Row[] = [];
  readonly bucket: { node: Container; drag: DragHandle }[] = [];
  readonly pads: { n: number; node: Container }[] = [];
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly ruler = new Graphics();
  private readonly placed = new Container();
  private readonly glow = new Graphics();
  private view: View;
  private wrongs = 0;
  private hinting = false;
  private clock = 0;
  /** The size of the worms waiting in the bucket. */
  private bucketSize = 1;
  /** Big and little worms' hint: a see-through big worm over two little ones. */
  private overlay: Container | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    // Big and little worms lay up to nine worms a stick: the how-to card's demonstration measures one stick, inside its time.
    const measures = makeMeasures(this.plan, ctx.rng);
    this.measures = ctx.demo && this.plan.mode === 'units' ? measures.slice(0, 1) : measures;
    this.backdrop = new Backdrop({ sky: [0xd6f5c8, 0xf6fbf0], hills: [0xc8ecb0, 0xa6de8e], horizon: 0.8, clouds: 1, sun: false, seed: 23 }, ctx.view);
    this.glow.eventMode = 'none';
    this.placed.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.ruler, this.placed, this.glow);
  }

  get m() {
    return this.measures[this.index];
  }

  start() {
    void this.next();
  }

  /** The ruler levels fit 0 to 10 on screen with a smaller unit; worms keep their size elsewhere. */
  private get u(): number {
    return isRuler(this.plan.mode) ? 74 : U;
  }

  private x0() {
    return isRuler(this.plan.mode) ? 140 : 200;
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    for (const r of this.rows) r.node.position.set(this.x0() + r.start * this.u, r.y);
    this.bucket.forEach((b, i) => {
      b.drag.home = { x: v.w - 170, y: v.h - 150 + i * 46 };
      if (!b.drag.dragging) b.node.position.set(b.drag.home.x, b.drag.home.y);
    });
    // Pads to the right of the measuring, or along the bottom under the long ruler.
    this.pads.forEach((p, i) => (isRuler(this.plan.mode) ? p.node.position.set(v.w / 2 - 150 + i * 150, v.h - 110) : p.node.position.set(v.w - 110, v.h * 0.3 + i * 125)));
    this.drawRuler();
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (!this.hinting || this.busy) return;
    const pulse = 6 + 2 * Math.sin(this.clock * 5);
    if (isRuler(this.plan.mode)) {
      for (const s of hintSpans(this.m, this.plan.mode)) {
        const r = this.rows[s.row];
        // How much longer: ring the extra part of the longer thing. Otherwise light the ruler spaces under it, from where it starts.
        if (this.plan.mode === 'rulerdiff') g.roundRect(this.x0() + s.from * this.u + 3, r.y - 34, s.count * this.u - 6, 68, 12).stroke({ width: pulse, color: swatch.yellow.fill });
        else for (let k = 0; k < s.count; k++) g.roundRect(this.x0() + (s.from + k) * this.u + 4, r.y + 30, this.u - 8, 44, 10).stroke({ width: 4, color: swatch.yellow.fill });
      }
      return;
    }
    const p = this.pads.find((x) => x.n === answerOf(this.m, this.plan.mode));
    if (p) return void g.roundRect(p.node.x - 66, p.node.y - 60, 132, 120, 22).stroke({ width: pulse, color: swatch.yellow.fill });
    for (const r of this.plan.mode === 'units' ? [this.active()].filter((x) => !!x) : this.rows) {
      const end = this.x0() + (r.start + r.length * r.size) * this.u;
      g.moveTo(end, r.y - 50).lineTo(end, r.y + 50).stroke({ width: pulse, color: swatch.yellow.fill });
    }
  }

  /** Lay the next worm end to end, or tap the reading once the measuring is complete. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.m) return null;
    const move = measureTouch(this.m, this.plan.mode, this.rows.map((r) => r.worms));
    if (!move) return null;
    if (move.kind === 'answer') {
      const pad = this.pads.find((p) => p.n === move.value);
      return pad ? { tap: { on: pad.node } } : null;
    }
    const worm = this.bucket.find((b) => !b.drag.dragging);
    const row = this.rows[move.row];
    return worm && row ? {
      drag: { on: worm.node },
      to: { on: this.ctx.stage, x: this.slotX(row), y: row.y - 30 },
    } : null;
  }

  destroy() {
    for (const b of this.bucket) b.drag.destroy();
  }

  /** The row being measured: the first one not yet full. */
  private active(): Row | undefined {
    return this.rows.find((r) => r.worms < r.length);
  }

  /** Where the next worm of a row lies, end to end. */
  private slotX(r: Row) {
    return this.x0() + (r.start + r.worms * r.size) * this.u + (r.size * this.u) / 2;
  }

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hinting = false;
    if (this.index >= this.measures.length) return void this.finale();
    for (const r of this.rows.splice(0)) r.node.destroy({ children: true });
    this.placed.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.overlay = null;
    this.clearPads();
    const m = this.m;
    const v = this.view;
    const add = (thing: Thing, length: number, y: number, start = 0, size = 1) => {
      const node = new Container();
      node.addChild(thingArt(thing, length * size, this.u));
      this.ctx.stage.addChildAt(node, this.ctx.stage.getChildIndex(this.placed));
      this.rows.push({ thing, length, start, y, worms: 0, size, node });
    };
    if (this.plan.mode === 'units') {
      // The same stick twice: big worms on the top copy, then little worms on the faded one below.
      add(m.thing, m.length, v.h * 0.3, 0, UNIT_SIZE[0]);
      add(m.other!.thing, m.other!.length, v.h * 0.52, 0, UNIT_SIZE[1]);
      this.rows[1].node.alpha = 0.4;
    } else if (this.plan.mode === 'compare') {
      add(m.thing, m.length, v.h * 0.3);
      add(m.other!.thing, m.other!.length, v.h * 0.52);
    } else if (this.plan.mode === 'rulerdiff') {
      // Two rows above one ruler, each starting at its own mark.
      add(m.thing, m.length, v.h * 0.26, m.start ?? 0);
      add(m.other!.thing, m.other!.length, v.h * 0.26 + 96, m.other!.start ?? 0);
    } else if (this.plan.mode === 'rulersum') {
      // The second thing starts exactly where the first stops, on the same row.
      add(m.thing, m.length, v.h * 0.4, m.start ?? 0);
      add(m.other!.thing, m.other!.length, v.h * 0.4, m.other!.start ?? 0);
    } else add(m.thing, m.length, v.h * 0.4, m.start ?? 0);
    if (isRuler(this.plan.mode)) this.showPads();
    else this.fillBucket();
    this.resize(v);
    this.busy = false;
    const what = THING_WORDS[m.thing];
    if (this.plan.mode === 'rulerdiff') {
      const [longer, shorter] = longerShorter(m);
      return this.ctx.instruct('worm.rulerdiff', { a: THING_WORDS[longer], b: THING_WORDS[shorter] });
    }
    if (this.plan.mode === 'rulersum') return this.ctx.instruct('worm.rulersum', { a: what, b: THING_WORDS[m.other!.thing] });
    if (this.plan.mode === 'ruler') return this.ctx.instruct(m.start ? 'worm.rulerstart' : 'worm.ruler', { what });
    if (this.plan.mode === 'compare') return this.ctx.instruct('worm.compare', { a: what, b: THING_WORDS[m.other!.thing] });
    if (this.plan.mode === 'units') return this.ctx.instruct('worm.big', { what });
    return this.ctx.instruct(this.index === 0 ? 'worm.lay' : 'worm.again', { what });
  }

  private drawRuler() {
    const g = this.ruler.clear();
    if (!isRuler(this.plan.mode) || !this.rows[0]) return;
    // The ruler sits under the lowest row (the two things of "end to end" share one row).
    const y = Math.max(...this.rows.map((r) => r.y)) + 30;
    g.roundRect(this.x0() - 16, y, 10 * this.u + 32, 60, 10).fill(swatch.yellow.light).stroke({ width: 4, color: wood.line });
    for (let k = 0; k <= 10; k++) g.moveTo(this.x0() + k * this.u, y).lineTo(this.x0() + k * this.u, y + 24).stroke({ width: 3, color: ink });
    // With two rows stacked above one ruler, faint lines drop from each thing's two ends so the marks can be read.
    if (this.plan.mode === 'rulerdiff') {
      for (const r of this.rows) for (const mark of [r.start, r.start + r.length]) g.moveTo(this.x0() + mark * this.u, r.y + 18).lineTo(this.x0() + mark * this.u, y).stroke({ width: 2, color: ink, alpha: 0.28 });
    }
    this.ruler.removeChildren().forEach((c) => c.destroy());
    for (let k = 0; k <= 10; k++) {
      const t = label(String(k), 22, ink);
      t.position.set(this.x0() + k * this.u, y + 42);
      this.ruler.addChild(t);
    }
  }

  /** Three worms wait in the bucket; take one to measure with. Big ones while the big worms' row is measured. */
  private fillBucket() {
    // Big and little worms: once both rows are measured, no worm is left to drag.
    if (this.plan.mode === 'units' && !this.active()) return this.emptyBucket();
    const size = this.active()?.size ?? 1;
    if (size !== this.bucketSize) this.emptyBucket();
    this.bucketSize = size;
    while (this.bucket.length < 3) {
      const node = size > 1 ? bigWormArt() : wormArt();
      node.hitArea = size > 1 ? new Rectangle(-U - 10, -46, 2 * U + 20, 92) : new Rectangle(-U / 2 - 10, -40, U + 20, 80);
      const item = { node, drag: null as unknown as DragHandle };
      item.drag = draggable(node, this.ctx.tw, { onPick: () => sfx.tick(), onDrop: (x, y) => this.drop(item, x, y) });
      this.bucket.push(item);
      this.ctx.stage.addChild(node);
    }
    this.resize(this.view);
  }

  private emptyBucket() {
    for (const b of this.bucket.splice(0)) {
      b.drag.destroy();
      b.node.destroy({ children: true });
    }
  }

  private drop(item: { node: Container; drag: DragHandle }, x: number, y: number): boolean {
    if (this.busy || this.finished) return false;
    // The row nearest the drop, if it's near enough to mean it.
    const row = this.rows.map((r) => ({ r, d: Math.abs(r.y - y) })).sort((a, b) => a.d - b.d)[0];
    if (!row || row.d > 80 || x < this.x0() - 60) return false;
    // Big and little worms: a drop near an unfinished row goes to the row being measured (a near miss on the faded one is fine).
    const r = this.plan.mode === 'units' && row.r.worms < row.r.length ? this.active()! : row.r;
    if (r.worms >= r.length) {
      // One worm too many: it would hang off the end.
      this.misses++;
      this.wrongs++;
      sfx.boing();
      void this.ctx.say('worm.toomany', { what: THING_WORDS[r.thing] });
      if (this.wrongs >= 2 && !this.hinting) {
        this.hinting = true;
        this.hints++;
      }
      return false;
    }
    // Snap end to end: no gaps, no overlaps.
    this.bucket.splice(this.bucket.indexOf(item), 1);
    item.drag.destroy();
    this.ctx.tw.kill(item.node.scale);
    item.node.scale.set(1);
    this.placed.addChild(item.node);
    void this.ctx.tw.to(item.node, { x: this.slotX(r), y: r.y - 30 }, { duration: 0.2, ease: ease.outQuad });
    r.worms++;
    sfx.pop(3 + r.worms);
    const counted = this.ctx.say('count', { n: r.worms });
    if (this.plan.mode === 'units' && r.worms >= r.length) this.rowDone(r, counted);
    this.fillBucket();
    if (this.rows.every((x) => x.worms >= x.length)) void this.measured(counted);
    return true;
  }

  /** Big and little worms: a full row shows its count; after the big worms, the faded copy wakes for little ones. */
  private rowDone(r: Row, counted: Promise<void>) {
    const n = label(String(r.length), 46, ink);
    n.position.set(this.x0() + (r.start + r.length * r.size) * this.u + 36, r.y - 30);
    this.placed.addChild(n);
    const next = this.active();
    if (!next) return;
    next.node.alpha = 1;
    // After the last count, so speaking does not cut it off.
    void counted.then(() => this.ctx.instruct('worm.little', { what: THING_WORDS[next.thing] }));
  }

  private async measured(counted: Promise<void>) {
    this.busy = true;
    await this.ctx.tw.wait(0.5);
    if (this.plan.mode === 'units') await counted;
    if (this.plan.mode === 'lay') {
      sfx.sparkle();
      this.ctx.pet.cheer();
      await this.ctx.say('worm.long', { what: THING_WORDS[this.m.thing], n: this.m.length });
      return void this.next();
    }
    if (this.plan.mode !== 'units') {
      this.showPads();
      this.busy = false;
    }
    if (this.plan.mode === 'say') return this.ctx.say('worm.howlong', { what: THING_WORDS[this.m.thing] });
    if (this.plan.mode === 'units') {
      await this.ctx.say('worm.counts', { a: this.m.length, b: this.m.other!.length });
      this.showPads();
      this.busy = false;
      if (this.hinting) this.showOverlay();
      return this.ctx.instruct(this.m.ask === 'big' ? 'worm.whichbig' : 'worm.whichlittle');
    }
    const [a, b] = this.m.length > this.m.other!.length ? [this.m.thing, this.m.other!.thing] : [this.m.other!.thing, this.m.thing];
    return this.ctx.say('worm.howmuch', { a: THING_WORDS[a], b: THING_WORDS[b] });
  }

  private showPads() {
    this.clearPads();
    for (const n of choices(this.m, this.plan.mode, this.ctx.rng)) {
      const node = new Container();
      node.addChild(tile(116, 104, 'white'), label(String(n), 46, ink));
      node.hitArea = new Rectangle(-62, -56, 124, 112);
      onTap(node, () => void this.answer(n), { cooldown: 300 });
      this.pads.push({ n, node });
      this.ctx.stage.addChild(node);
    }
    this.resize(this.view);
  }

  private clearPads() {
    for (const p of this.pads.splice(0)) p.node.destroy({ children: true });
  }

  private async answer(n: number) {
    if (this.busy || this.finished) return;
    const m = this.m;
    if (n === answerOf(m, this.plan.mode)) {
      this.busy = true;
      this.hinting = false;
      sfx.sparkle();
      this.ctx.pet.cheer();
      if (this.plan.mode === 'compare' || this.plan.mode === 'rulerdiff') await this.ctx.say('worm.yay');
      else if (this.plan.mode === 'units') await this.ctx.say('worm.samestick', { what: THING_WORDS[m.thing] });
      else if (this.plan.mode === 'rulersum') await this.ctx.say('worm.together', { n });
      else await this.ctx.say('worm.long', { what: THING_WORDS[m.thing], n: m.length });
      return void this.next();
    }
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    await this.ctx.say(...this.missLine(m, n));
    if (this.wrongs >= 2 && !this.hinting) {
      this.hinting = true;
      this.hints++;
      if (this.plan.mode === 'units') this.showOverlay();
    }
    this.busy = false;
  }

  /** Big and little worms' hint: a see-through big worm over the first two little worms shows one covers two. */
  private showOverlay() {
    const r = this.rows[1];
    if (this.overlay || !r) return;
    const o = bigWormArt();
    o.alpha = 0.5;
    o.eventMode = 'none';
    o.position.set(this.x0() + r.start * this.u + U, r.y - 30);
    this.placed.addChild(o);
    this.overlay = o;
  }

  /** What to say to a wrong number: the likely mistake gets its own gentle explanation. */
  private missLine(m: Measure, n: number): [LineId, LineVars?] {
    const mode = this.plan.mode;
    const likely = temptingReading(m, mode) === n;
    if (mode === 'ruler') return [likely ? 'worm.fromzero' : 'worm.spaces'];
    if (mode === 'rulerdiff') return likely ? ['worm.fromends'] : ['worm.extra', { a: THING_WORDS[longerShorter(m)[0]] }];
    if (mode === 'rulersum') return [likely ? (m.start ? 'worm.fromzero' : 'worm.firstonly') : 'worm.spaces'];
    if (mode === 'units') return [m.ask === 'big' ? 'worm.bigger' : 'worm.smaller', { what: THING_WORDS[m.thing] }];
    return ['worm.countagain'];
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('worm.done');
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class WormIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const leaf = thingArt('leaf', 2.4);
    leaf.position.set(-105, -60);
    c.addChild(leaf);
    for (let k = 0; k < 2; k++) {
      const w = wormArt();
      w.scale.set(1.1);
      w.position.set(-58 + k * 96, -96);
      c.addChild(w);
    }
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const n = rng.int(2, 3);
  const leaf = thingArt('leaf', n);
  leaf.position.set((-n * U) / 2, 30);
  c.addChild(leaf);
  for (let k = 0; k < n; k++) {
    const w = wormArt();
    w.position.set((-n * U) / 2 + k * U + U / 2, 0);
    c.addChild(w);
  }
  return c;
}

export const inchworm: GameModule = {
  id: 'inchworm',
  name: 'Inchworm Measure',
  titleLine: 'game.inchworm',
  region: 'tinker-lab',
  skills: ['measuring', 'length', 'units', 'comparing'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  touchDemo: true,
  coplayHint: 'Measure something real together with paper clips or hands: "The book is five hands long!"',
  offScreen: 'Measure toys with LEGO bricks or spoons laid end to end. Which toy is longest?',
  hubIcon: () => new WormIcon(),
  sticker,
  create: (ctx) => new Inchworm(ctx),
};
