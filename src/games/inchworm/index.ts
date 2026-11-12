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
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  answerOf,
  choices,
  hintSpans,
  hopTicks,
  isRuler,
  isWide,
  longerShorter,
  makeMeasures,
  measureTouch,
  planFor,
  RULER,
  slideSlots,
  temptingReading,
  UNIT_SIZE,
  type Measure,
  type MeasurePlan,
  type Thing,
} from './logic';

const U = 88;
export const THING_WORDS: Record<Thing, string> = {
  leaf: 'leaf',
  pencil: 'pencil',
  snake: 'snake',
  stick: 'stick',
  crayon: 'crayon',
  carrot: 'carrot',
  rope: 'rope',
  paintbrush: 'paintbrush',
  feather: 'feather',
};
/** The long jump's two jumpers, top track first. */
const JUMPERS = ['Bunny', 'Duck'] as const;

function wormArt(): Container {
  const c = new Container();
  const g = new Graphics();
  for (let k = 0; k < 5; k++)
    g.circle(-U / 2 + 12 + k * 16, 0, 11)
      .fill(k === 4 ? swatch.green.fill : swatch.green.light)
      .stroke({ width: 3, color: swatch.green.line });
  g.circle(U / 2 - 12, -3, 2.5).fill(ink);
  c.addChild(g);
  return c;
}

/** A big worm, two little worms long: bigger and orange, so size and colour both tell them apart. */
function bigWormArt(): Container {
  const c = new Container();
  const g = new Graphics();
  for (let k = 0; k < 10; k++)
    g.circle(-U + 15 + k * 16, 0, 15.4)
      .fill(k === 9 ? swatch.orange.fill : swatch.orange.light)
      .stroke({ width: 3, color: swatch.orange.line });
  g.circle(U - 15, -4, 3.2).fill(ink);
  c.addChild(g);
  return c;
}

function thingArt(thing: Thing, length: number, unit = U): Graphics {
  const w = length * unit;
  const g = new Graphics();
  if (thing === 'leaf') {
    g.moveTo(0, 0)
      .quadraticCurveTo(w / 2, -34, w, 0)
      .quadraticCurveTo(w / 2, 34, 0, 0)
      .fill(swatch.green.fill)
      .stroke({ width: 4, color: swatch.green.line });
    g.moveTo(4, 0)
      .lineTo(w - 4, 0)
      .stroke({ width: 3, color: swatch.green.line });
  } else if (thing === 'pencil') {
    g.rect(0, -14, w - 30, 28)
      .fill(swatch.yellow.fill)
      .stroke({ width: 3, color: swatch.yellow.line });
    g.poly([w - 30, -14, w, 0, w - 30, 14])
      .fill(wood.light)
      .stroke({ width: 3, color: wood.line })
      .poly([w - 9, -4, w, 0, w - 9, 4])
      .fill(ink);
    g.rect(0, -14, 14, 28).fill(swatch.pink.fill);
  } else if (thing === 'snake') {
    g.roundRect(0, -14, w, 28, 14).fill(swatch.purple.fill).stroke({ width: 3, color: swatch.purple.line });
    for (let x = 20; x < w - 20; x += 30) g.circle(x, 0, 5).fill(swatch.purple.light);
    g.circle(w - 14, -4, 3).fill(ink);
  } else if (thing === 'crayon') {
    g.poly([w - 26, -14, w - 3, -4, w - 3, 4, w - 26, 14])
      .fill(swatch.blue.fill)
      .stroke({ width: 3, color: swatch.blue.line });
    g.roundRect(0, -14, w - 24, 28, 6)
      .fill(swatch.blue.fill)
      .stroke({ width: 3, color: swatch.blue.line });
    g.rect(12, -14, Math.max(10, w - 54), 28)
      .fill(swatch.blue.light)
      .stroke({ width: 2, color: swatch.blue.line });
  } else if (thing === 'carrot') {
    // Leaves sprout from the wide end at the start; the root tapers to its tip at the end.
    for (const a of [-0.5, 0, 0.5])
      g.ellipse(-12, a * 26, 14, 6)
        .fill(swatch.green.fill)
        .stroke({ width: 2, color: swatch.green.line });
    g.moveTo(0, -18)
      .quadraticCurveTo(w * 0.6, -14, w, 0)
      .quadraticCurveTo(w * 0.6, 14, 0, 18)
      .closePath()
      .fill(swatch.orange.fill)
      .stroke({ width: 3, color: swatch.orange.line });
    for (let x = 24; x < w * 0.8; x += 34)
      g.moveTo(x, -8)
        .lineTo(x + 10, -6)
        .stroke({ width: 2, color: swatch.orange.line });
  } else if (thing === 'rope') {
    g.roundRect(0, -11, w, 22, 11).fill(wood.light).stroke({ width: 3, color: wood.line });
    for (let x = 10; x < w - 10; x += 14)
      g.moveTo(x, -10)
        .lineTo(x + 9, 10)
        .stroke({ width: 2, color: wood.line });
  } else if (thing === 'paintbrush') {
    g.roundRect(0, -8, w - 58, 16, 8)
      .fill(swatch.red.fill)
      .stroke({ width: 3, color: swatch.red.line });
    g.rect(w - 60, -12, 22, 24)
      .fill(swatch.white.light)
      .stroke({ width: 3, color: swatch.white.line });
    g.moveTo(w - 38, -12)
      .quadraticCurveTo(w - 8, -12, w, 0)
      .quadraticCurveTo(w - 8, 12, w - 38, 12)
      .closePath()
      .fill(wood.light)
      .stroke({ width: 3, color: wood.line });
    g.moveTo(w - 14, -7)
      .quadraticCurveTo(w - 4, -5, w, 0)
      .quadraticCurveTo(w - 4, 5, w - 14, 7)
      .closePath()
      .fill(swatch.purple.fill);
  } else if (thing === 'feather') {
    // The vane hugs the quill, which runs the whole length.
    g.moveTo(w * 0.18, 0)
      .quadraticCurveTo(w * 0.5, -30, w, 0)
      .quadraticCurveTo(w * 0.5, 30, w * 0.18, 0)
      .fill(swatch.teal.light)
      .stroke({ width: 3, color: swatch.teal.line });
    for (let x = w * 0.28; x < w * 0.92; x += 18)
      g.moveTo(x, 0)
        .lineTo(x + 10, -14)
        .moveTo(x, 0)
        .lineTo(x + 10, 14)
        .stroke({ width: 2, color: swatch.teal.line });
    g.moveTo(0, 0).lineTo(w, 0).stroke({ width: 4, color: swatch.teal.line });
  } else {
    g.roundRect(0, -10, w, 20, 10).fill(wood.fill).stroke({ width: 3, color: wood.line });
  }
  return g;
}

/**
 * One long jump in the sand: a dashed track from the take-off board (just left of 0) to the footprints at
 * the end, so worms laid end to end from 0 stop exactly at the prints. Bunny's paws are pink, Duck's yellow.
 */
function jumpArt(who: number, length: number, unit = U): Graphics {
  const w = length * unit;
  const g = new Graphics();
  g.rect(-22, -16, 18, 32).fill(wood.fill).stroke({ width: 3, color: wood.line });
  for (let x = 0; x < w - 30; x += 22)
    g.moveTo(x, 0)
      .lineTo(Math.min(x + 12, w - 30), 0)
      .stroke({ width: 4, color: wood.line, alpha: 0.6 });
  const c = who === 0 ? swatch.pink : swatch.yellow;
  for (const dy of [-9, 9]) {
    g.ellipse(w - 12, dy, 12, 7)
      .fill(c.fill)
      .stroke({ width: 2, color: c.line });
    for (const t of [-5, 0, 5]) g.circle(w - 1, dy + t * 0.8, 2.6).fill(c.line);
  }
  g.moveTo(w, -30).lineTo(w, 30).stroke({ width: 3, color: ink, alpha: 0.5 });
  return g;
}

interface Row {
  thing: Thing;
  /** The long jump: whose jump this track is (0 Bunny, 1 Duck). */
  jumper?: number;
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
  /** The next measure's instruction, waiting behind the last one's right-answer line (U7 R4); `askGen` drops a stale wait. */
  unasked = false;
  private askGen = 0;
  /** The waiting instruction has not been said: a move of hers stops it being said by itself, but the guide still says it. */
  private unsaid = false;

  private readonly backdrop: Backdrop;
  private readonly ruler = new Graphics();
  /** The long jump's sand pit, behind both tracks. */
  private readonly pit = new Graphics();
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
  /** One worm, hop by hop: the worm she taps along, and the chalk ticks (and, with help, their numbers) it leaves. */
  private hopper: Container | null = null;
  private readonly chalk = new Container();
  /** Longer than the ruler: the short ruler she lays twice (its origin is its middle, so a grab does not lurch it). */
  private slider: { node: Container; drag: DragHandle } | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    // Big and little worms lay up to nine worms a stick, and one worm hops up to eight times: the how-to card's demonstration measures one thing, inside its time.
    const measures = makeMeasures(this.plan, ctx.rng);
    this.measures =
      ctx.demo && (this.plan.mode === 'units' || this.plan.mode === 'hop' || this.plan.mode === 'slide')
        ? measures.slice(0, 1)
        : measures;
    this.backdrop = new Backdrop(
      {
        sky: [0xd6f5c8, 0xf6fbf0],
        hills: [0xc8ecb0, 0xa6de8e],
        horizon: 0.8,
        clouds: 1,
        sun: false,
        seed: 23,
      },
      ctx.view,
    );
    this.glow.eventMode = 'none';
    this.placed.eventMode = 'none';
    this.pit.eventMode = 'none';
    this.chalk.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.pit, this.ruler, this.chalk, this.placed, this.glow);
  }

  get m() {
    return this.measures[this.index];
  }

  start() {
    void this.next();
  }

  /** The ruler levels fit 0 to 10 on screen with a smaller unit, and so does one worm's eight hops; worms keep their size elsewhere. */
  private get u(): number {
    return isWide(this.plan.mode) ? 74 : U;
  }

  private x0() {
    // The broken ruler: its piece from the break to 10 is centred, so the missing part leaves no gap.
    const brk = this.plan.mode === 'broken' ? this.m?.brk : undefined;
    if (brk !== undefined) return Math.max(40, (this.view.w - (RULER - brk) * this.u) / 2) - brk * this.u;
    // One worm, hop by hop: the thing and the worm waiting one length before it are centred together.
    if (this.plan.mode === 'hop' && this.m)
      return Math.max(40, (this.view.w - (this.m.length + 1) * this.u) / 2) + this.u;
    // Longer than the ruler: the thing and the ruler's second lay (which reaches past its end) are centred together.
    if (this.plan.mode === 'slide' && this.m)
      return Math.max(40, (this.view.w - 2 * this.m.ruler! * this.u) / 2);
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
    this.pads.forEach((p, i) =>
      isWide(this.plan.mode)
        ? p.node.position.set(v.w / 2 - 150 + i * 150, v.h - 110)
        : p.node.position.set(v.w - 110, v.h * 0.3 + i * 125),
    );
    this.drawRuler();
    this.drawPit();
    this.placeHopper();
    this.placeSlider();
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (!this.hinting || this.busy) return;
    const pulse = 6 + 2 * Math.sin(this.clock * 5);
    if (this.plan.mode === 'slide') {
      // Both parts of the thing, and the chalk mark between them.
      const r = this.rows[0];
      for (const s of hintSpans(this.m, 'slide'))
        g.roundRect(this.x0() + s.from * this.u + 3, r.y - 34, s.count * this.u - 6, 68, 12).stroke({
          width: pulse,
          color: swatch.yellow.fill,
        });
      g.circle(this.x0() + this.m.ruler! * this.u, r.y - 72, 26).stroke({
        width: pulse,
        color: swatch.yellow.fill,
      });
      return;
    }
    if (isRuler(this.plan.mode)) {
      for (const s of hintSpans(this.m, this.plan.mode)) {
        const r = this.rows[s.row];
        // How much longer: ring the extra part of the longer thing. Otherwise light the ruler spaces under it, from where it starts.
        if (this.plan.mode === 'rulerdiff')
          g.roundRect(this.x0() + s.from * this.u + 3, r.y - 34, s.count * this.u - 6, 68, 12).stroke({
            width: pulse,
            color: swatch.yellow.fill,
          });
        else
          for (let k = 0; k < s.count; k++)
            g.roundRect(this.x0() + (s.from + k) * this.u + 4, r.y + 30, this.u - 8, 44, 10).stroke({
              width: 4,
              color: swatch.yellow.fill,
            });
      }
      return;
    }
    const p = this.pads.find((x) => x.n === answerOf(this.m, this.plan.mode));
    if (p)
      return void g
        .roundRect(p.node.x - 66, p.node.y - 60, 132, 120, 22)
        .stroke({ width: pulse, color: swatch.yellow.fill });
    for (const r of this.plan.mode === 'units' ? [this.active()].filter((x) => !!x) : this.rows) {
      const end = this.x0() + (r.start + r.length * r.size) * this.u;
      g.moveTo(end, r.y - 50)
        .lineTo(end, r.y + 50)
        .stroke({ width: pulse, color: swatch.yellow.fill });
    }
  }

  /** Lay the next worm end to end, or tap the reading once the measuring is complete. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.unasked || !this.m) return null;
    const move = measureTouch(
      this.m,
      this.plan.mode,
      this.rows.map((r) => r.worms),
    );
    if (!move) return null;
    if (move.kind === 'hop') return this.hopper ? { tap: { on: this.hopper } } : null;
    if (move.kind === 'slide') {
      const at = this.slotSpot(move.at);
      return this.slider && at ? { drag: { on: this.slider.node }, to: { on: this.ctx.stage, ...at } } : null;
    }
    if (move.kind === 'answer') {
      const pad = this.pads.find((p) => p.n === move.value);
      return pad ? { tap: { on: pad.node } } : null;
    }
    const worm = this.bucket.find((b) => !b.drag.dragging);
    const row = this.rows[move.row];
    return worm && row
      ? {
          drag: { on: worm.node },
          to: { on: this.ctx.stage, x: this.slotX(row), y: row.y - 30 },
        }
      : null;
  }

  destroy() {
    for (const b of this.bucket) b.drag.destroy();
    this.slider?.drag.destroy();
    this.slider = null;
    this.hopper?.destroy({ children: true });
    this.hopper = null;
  }

  /** The row being measured: the first one not yet full. */
  private active(): Row | undefined {
    return this.rows.find((r) => r.worms < r.length);
  }

  /** Where the next worm of a row lies, end to end. */
  private slotX(r: Row) {
    return this.x0() + (r.start + r.worms * r.size) * this.u + (r.size * this.u) / 2;
  }

  /** The next thing to measure; with `after`, its instruction waits for that line (the last answer's), her first touch or the guide. */
  private async next(after?: Promise<void>) {
    this.dropAsk();
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hinting = false;
    if (this.index >= this.measures.length) return void this.finale();
    for (const r of this.rows.splice(0)) r.node.destroy({ children: true });
    this.placed.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.chalk.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.overlay = null;
    this.hopper?.destroy({ children: true });
    this.hopper = null;
    this.clearSlider();
    this.clearPads();
    const m = this.m;
    const v = this.view;
    const add = (thing: Thing, length: number, y: number, start = 0, size = 1) => {
      const node = new Container();
      const jumper = m.jump ? this.rows.length : undefined;
      node.addChild(
        jumper === undefined ? thingArt(thing, length * size, this.u) : jumpArt(jumper, length, this.u),
      );
      this.ctx.stage.addChildAt(node, this.ctx.stage.getChildIndex(this.placed));
      this.rows.push({ thing, length, start, y, worms: 0, size, node, jumper });
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
    else if (this.plan.mode === 'hop') this.makeHopper();
    else if (this.plan.mode === 'slide') this.makeSlider();
    else this.fillBucket();
    this.resize(v);
    this.busy = false;
    if (!after) return this.instruct();
    this.unasked = true;
    this.unsaid = true;
    const gen = this.askGen;
    void after.then(() => {
      if (gen === this.askGen) this.askNow();
    });
  }

  /** The measure's instruction. */
  private instruct() {
    const m = this.m;
    const what = THING_WORDS[m.thing];
    if (this.plan.mode === 'hop') return this.instructLine('worm.hop', { what });
    if (this.plan.mode === 'slide') return this.instructLine('worm.slide', { what });
    if (this.plan.mode === 'broken') return this.instructLine('worm.broken', { what });
    if (m.jump) return this.instructLine('worm.jump');
    if (this.plan.mode === 'rulerdiff') {
      const [longer, shorter] = longerShorter(m);
      return this.instructLine('worm.rulerdiff', { a: THING_WORDS[longer], b: THING_WORDS[shorter] });
    }
    if (this.plan.mode === 'rulersum')
      return this.instructLine('worm.rulersum', { a: what, b: THING_WORDS[m.other!.thing] });
    if (this.plan.mode === 'ruler')
      return this.instructLine(m.start ? 'worm.rulerstart' : 'worm.ruler', { what });
    if (this.plan.mode === 'compare')
      return this.instructLine('worm.compare', { a: what, b: THING_WORDS[m.other!.thing] });
    if (this.plan.mode === 'units') return this.instructLine('worm.big', { what });
    return this.instructLine(this.index === 0 ? 'worm.lay' : 'worm.again', { what });
  }

  /** Says the waiting instruction, if there is one. */
  private askNow() {
    if (!this.unsaid || this.finished) return false;
    this.dropAsk();
    void this.instruct();
    return true;
  }

  private dropAsk() {
    this.quietAsk();
    this.unsaid = false;
  }

  /** Her move takes the waiting instruction's place: it is no longer said by itself, but the guide still says it. */
  private quietAsk() {
    this.unasked = false;
    this.askGen++;
  }

  /** Speaks an instruction, which becomes the one the guide repeats. */
  private instructLine(...args: Parameters<GameContext['instruct']>) {
    this.dropAsk();
    return this.ctx.instruct(...args);
  }

  /** The guide was tapped while the instruction waits behind the measurement: say it, not the one before it. */
  sayWaitingAsk() {
    return this.askNow();
  }

  /** Longer than the ruler: a short ruler (0 to its length) waiting below the thing, with a touch area at least 320 wide and 120 tall. */
  private makeSlider() {
    const n = this.m.ruler!;
    const half = (n * this.u) / 2;
    const node = new Container();
    const g = new Graphics();
    g.roundRect(-half - 16, -30, n * this.u + 32, 60, 10)
      .fill(swatch.yellow.light)
      .stroke({ width: 4, color: wood.line });
    for (let k = 0; k <= n; k++)
      g.moveTo(-half + k * this.u, -30)
        .lineTo(-half + k * this.u, -6)
        .stroke({ width: 3, color: ink });
    node.addChild(g);
    for (let k = 0; k <= n; k++) {
      const t = label(String(k), 22, ink);
      t.position.set(-half + k * this.u, 12);
      node.addChild(t);
    }
    const reach = Math.max(half + 16, 160);
    node.hitArea = new Rectangle(-reach, -60, 2 * reach, 120);
    // Above the chalk, so the mark it starts from stays in view above the ruler.
    this.ctx.stage.addChildAt(node, this.ctx.stage.getChildIndex(this.glow));
    const item = { node, drag: null as unknown as DragHandle };
    item.drag = draggable(node, this.ctx.tw, {
      onPick: () => sfx.tick(),
      onDrop: (x, y) => this.layRuler(x, y),
    });
    this.slider = item;
  }

  private clearSlider() {
    if (!this.slider) return;
    this.slider.drag.destroy();
    this.slider.node.destroy({ children: true });
    this.slider = null;
  }

  /** Where the ruler's middle lies with its 0 at mark `at` under the thing. */
  private slotSpot(at: number): { x: number; y: number } | null {
    const r = this.rows[0];
    return r && this.m?.ruler ? { x: this.x0() + (at + this.m.ruler / 2) * this.u, y: r.y + 60 } : null;
  }

  /** The ruler waits below the thing until laid; then its home is where it was last laid. */
  private placeSlider() {
    const r = this.rows[0];
    // After the last round there is no measure left to lay it along.
    if (!this.slider || !r || !this.m) return;
    const laid = r.worms > 0 ? this.slotSpot(slideSlots(this.m)[r.worms - 1]) : null;
    const home = laid ?? { x: this.view.w / 2, y: r.y + 200 };
    this.slider.drag.home = home;
    if (!this.slider.drag.dragging && !this.ctx.tw.busy(this.slider.node))
      this.slider.node.position.set(home.x, home.y);
    this.drawChalk();
  }

  /** A drop near the next place snaps the ruler there; anywhere else it slides back, and nothing counts as a miss. */
  private layRuler(x: number, y: number): boolean {
    const r = this.rows[0];
    const s = this.slider;
    if (this.busy || this.finished || !r || !s || r.worms >= 2) return false;
    const at = this.slotSpot(slideSlots(this.m)[r.worms])!;
    if (Math.abs(x - at.x) > this.u || Math.abs(y - at.y) > 70) return false;
    // Her move needs no instruction: its own lines take the waiting one's place.
    this.quietAsk();
    r.worms++;
    s.drag.home = at;
    sfx.pop(4 + r.worms);
    void this.ctx.tw.to(s.node, at, { duration: 0.2, ease: ease.outQuad });
    this.drawChalk();
    void this.laid(r.worms);
    return true;
  }

  private async laid(lays: number) {
    const what = THING_WORDS[this.m.thing];
    if (lays === 1) return this.instructLine('worm.slidemark', { n: this.m.ruler!, what });
    this.busy = true;
    // Laid twice: the ruler stays put while she adds the two parts.
    if (this.slider) this.slider.node.eventMode = 'none';
    sfx.sparkle();
    await this.ctx.tw.wait(0.3);
    this.showPads();
    this.busy = false;
    return this.instructLine('worm.slidehow', { what });
  }

  /** One worm, hop by hop: a worm in the ruler unit, nose at the thing's start, with a touch area over 100 units each way. */
  private makeHopper() {
    const node = wormArt();
    node.scale.set(this.u / U);
    node.hitArea = new Rectangle(-76, -64, 152, 128);
    onTap(node, () => void this.hop(), { cooldown: 200 });
    // On the stage, not the placed worms' layer, which takes no touches.
    this.ctx.stage.addChildAt(node, this.ctx.stage.getChildIndex(this.glow));
    this.hopper = node;
  }

  /** The worm lies over the space before its nose: none yet at the start, space k after hop k. */
  private placeHopper() {
    const r = this.rows[0];
    if (!this.hopper || !r) return;
    // Mid-hop a relayout leaves the worm to land; the hop places it again from the new layout.
    if (!this.ctx.tw.busy(this.hopper))
      this.hopper.position.set(this.x0() + (r.worms - 0.5) * this.u, r.y - 30);
    this.drawChalk();
  }

  /** One hop: the worm inches one length and chalks a tick where its nose lands; at the end it stops by itself and the pads ask. */
  private async hop() {
    const r = this.rows[0];
    const worm = this.hopper;
    if (this.busy || this.finished || !r || !worm || r.worms >= r.length) return;
    this.quietAsk();
    this.busy = true;
    r.worms++;
    sfx.pop(3 + r.worms);
    // An inch: squash, stretch forward, settle.
    void this.ctx.tw
      .to(worm.scale, { x: (0.8 * this.u) / U }, { duration: 0.1 })
      .then(() => this.ctx.tw.to(worm.scale, { x: this.u / U }, { duration: 0.2, ease: ease.outQuad }));
    await this.ctx.tw.to(
      worm,
      { x: this.x0() + (r.worms - 0.5) * this.u },
      { duration: 0.3, ease: ease.outQuad },
    );
    this.placeHopper();
    if (r.worms < r.length) return void (this.busy = false);
    sfx.sparkle();
    await this.ctx.tw.wait(0.3);
    this.showPads();
    this.busy = false;
    return this.instructLine('worm.hops', { what: THING_WORDS[r.thing] });
  }

  /** A white chalk tick under the thing at each hop's end; with help, each tick's number too. */
  private drawChalk() {
    const r = this.rows[0];
    this.chalk.removeChildren().forEach((c) => c.destroy({ children: true }));
    if (this.plan.mode === 'slide' && r && this.m && r.worms > 0) {
      // Where the first ruler ended: a chalk tick across the thing, and how far it reached.
      const x = this.x0() + this.m.ruler! * this.u;
      const tick = new Graphics();
      tick
        .moveTo(x, r.y - 46)
        .lineTo(x, r.y + 26)
        .stroke({ width: 9, color: ink, alpha: 0.35, cap: 'round' });
      tick
        .moveTo(x, r.y - 46)
        .lineTo(x, r.y + 26)
        .stroke({ width: 5, color: 0xffffff, cap: 'round' });
      const n = label(String(this.m.ruler), 30, ink);
      n.position.set(x, r.y - 72);
      this.chalk.addChild(tick, n);
      return;
    }
    if (this.plan.mode !== 'hop' || !r) return;
    const g = new Graphics();
    this.chalk.addChild(g);
    for (const k of hopTicks(r.worms)) {
      const x = this.x0() + k * this.u;
      g.moveTo(x, r.y + 18)
        .lineTo(x, r.y + 56)
        .stroke({ width: 9, color: ink, alpha: 0.35, cap: 'round' });
      g.moveTo(x, r.y + 18)
        .lineTo(x, r.y + 56)
        .stroke({ width: 5, color: 0xffffff, cap: 'round' });
      if (!this.hinting) continue;
      const n = label(String(k), 26, ink);
      n.position.set(x, r.y + 82);
      this.chalk.addChild(n);
    }
  }

  /** The long jump's sand pit under both tracks, from the take-off board past the longest jump. */
  private drawPit() {
    const g = this.pit.clear();
    if (!this.m?.jump || this.rows.length < 2) return;
    const far = Math.max(...this.rows.map((r) => r.length)) * this.u;
    const top = this.rows[0].y - 70;
    g.roundRect(this.x0() - 40, top, far + 90, this.rows[1].y - top + 50, 26)
      .fill(0xf3dfa8)
      .stroke({ width: 4, color: 0xd9b96a });
  }

  private drawRuler() {
    const g = this.ruler.clear();
    if (!isRuler(this.plan.mode) || !this.rows[0]) return;
    // The ruler sits under the lowest row (the two things of "end to end" share one row).
    const y = Math.max(...this.rows.map((r) => r.y)) + 30;
    // The broken ruler starts at its break, with a jagged snapped edge and no marks below it.
    const from = this.m?.brk ?? 0;
    const left = this.x0() + from * this.u;
    if (from > 0) {
      const jag = [
        left - 16,
        y,
        left - 30,
        y + 12,
        left - 18,
        y + 24,
        left - 32,
        y + 36,
        left - 20,
        y + 48,
        left - 28,
        y + 60,
      ];
      g.poly([...jag, this.x0() + 10 * this.u + 16, y + 60, this.x0() + 10 * this.u + 16, y])
        .fill(swatch.yellow.light)
        .stroke({ width: 4, color: wood.line });
    } else
      g.roundRect(this.x0() - 16, y, 10 * this.u + 32, 60, 10)
        .fill(swatch.yellow.light)
        .stroke({ width: 4, color: wood.line });
    for (let k = from; k <= 10; k++)
      g.moveTo(this.x0() + k * this.u, y)
        .lineTo(this.x0() + k * this.u, y + 24)
        .stroke({ width: 3, color: ink });
    // With two rows stacked above one ruler, faint lines drop from each thing's two ends so the marks can be read.
    if (this.plan.mode === 'rulerdiff') {
      for (const r of this.rows)
        for (const mark of [r.start, r.start + r.length])
          g.moveTo(this.x0() + mark * this.u, r.y + 18)
            .lineTo(this.x0() + mark * this.u, y)
            .stroke({ width: 2, color: ink, alpha: 0.28 });
    }
    this.ruler.removeChildren().forEach((c) => c.destroy());
    for (let k = from; k <= 10; k++) {
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
      node.hitArea =
        size > 1 ? new Rectangle(-U - 10, -46, 2 * U + 20, 92) : new Rectangle(-U / 2 - 10, -40, U + 20, 80);
      const item = { node, drag: null as unknown as DragHandle };
      item.drag = draggable(node, this.ctx.tw, {
        onPick: () => sfx.tick(),
        onDrop: (x, y) => this.drop(item, x, y),
      });
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
      void (r.jumper === undefined
        ? this.ctx.say('worm.toomany', { what: THING_WORDS[r.thing] })
        : this.ctx.say('worm.pastprints'));
      if (this.wrongs >= 2 && !this.hinting) {
        this.hinting = true;
        this.hints++;
      }
      return false;
    }
    // Snap end to end: no gaps, no overlaps. Her move needs no instruction: its count takes the waiting one's place.
    this.quietAsk();
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
    void counted.then(() => this.instructLine('worm.little', { what: THING_WORDS[next.thing] }));
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
      return this.instructLine(this.m.ask === 'big' ? 'worm.whichbig' : 'worm.whichlittle');
    }
    if (this.m.jump) {
      const [a, b] = this.m.length > this.m.other!.length ? JUMPERS : [JUMPERS[1], JUMPERS[0]];
      return this.ctx.say('worm.jumpmuch', { a, b });
    }
    const [a, b] =
      this.m.length > this.m.other!.length
        ? [this.m.thing, this.m.other!.thing]
        : [this.m.other!.thing, this.m.thing];
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
    // A ruler level's pads show with the thing: a pad tap before its question is heard says the question, and is not judged.
    if (this.unasked && this.askNow()) return;
    const m = this.m;
    if (n === answerOf(m, this.plan.mode)) {
      this.busy = true;
      this.hinting = false;
      sfx.sparkle();
      this.ctx.pet.cheer();
      const said =
        this.plan.mode === 'compare' || this.plan.mode === 'rulerdiff'
          ? this.ctx.say('worm.yay')
          : this.plan.mode === 'units'
            ? this.ctx.say('worm.samestick', { what: THING_WORDS[m.thing] })
            : this.plan.mode === 'rulersum'
              ? this.ctx.say('worm.together', { n })
              : this.plan.mode === 'hop'
                ? this.ctx.say('worm.hoplong', { what: THING_WORDS[m.thing], n })
                : this.ctx.say('worm.long', { what: THING_WORDS[m.thing], n: m.length });
      // The last measure's line is heard out before the finale; otherwise the next thing follows at once and the
      // measurement plays over its instruction, which waits for the line (U7 R4).
      if (this.index + 1 >= this.measures.length) await said;
      return void this.next(said);
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
      if (this.plan.mode === 'hop') this.drawChalk();
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
    if (mode === 'broken')
      return likely
        ? ['worm.brokenend', { n: m.brk! }]
        : n === m.length + 1
          ? ['worm.marks']
          : ['worm.spaces'];
    if (mode === 'rulerdiff')
      return likely ? ['worm.fromends'] : ['worm.extra', { a: THING_WORDS[longerShorter(m)[0]] }];
    if (mode === 'rulersum') return [likely ? (m.start ? 'worm.fromzero' : 'worm.firstonly') : 'worm.spaces'];
    if (mode === 'units')
      return [m.ask === 'big' ? 'worm.bigger' : 'worm.smaller', { what: THING_WORDS[m.thing] }];
    if (mode === 'hop') return ['worm.chalk'];
    if (mode === 'slide') return [likely ? 'worm.secondpart' : 'worm.firstthenrest', { n: m.ruler! }];
    return ['worm.countagain'];
  }

  private async finale() {
    if (this.finished) return;
    this.dropAsk();
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
  challenge: 'numbers',
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
