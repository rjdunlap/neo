import { Circle, Container, Graphics } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { advanceTrace, sampleStroke, traceWaypoints, type Point } from '../letter-trails/strokes';
import { WigglyIcon, tile } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { DIGITS } from './digits';
import {
  LEVELS, THING_HIT, groupSize, numeralFor, planFor, stickerDigit, thingFor, thingSpots, thingWord, trailTolerance,
} from './logic';

type Phase = 'trace' | 'show' | 'wake' | 'done';

/** A sleeping thing is tinted this pale blue, with a small z, until she wakes it. */
const ASLEEP = 0xc5cdea;

const line = (color: number, width = 6) => ({ width, color, cap: 'round' as const, join: 'round' as const });

/** One of the things she counts, drawn from shapes, centered on (0, 0) and about 100 units across. */
function drawThing(id: string): Container {
  const c = new Container(), g = new Graphics();
  c.addChild(g);
  if (id === 'duck') {
    g.ellipse(0, 12, 46, 32).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line))
      .circle(26, -22, 24).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line))
      .poly([46, -22, 68, -14, 46, -6]).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 4))
      .circle(32, -28, 4.5).fill(ink)
      .moveTo(-30, 8).quadraticCurveTo(-8, 34, 22, 14).stroke(line(swatch.yellow.line, 5));
  } else if (id === 'apple') {
    g.moveTo(0, -24).bezierCurveTo(-16, -44, -62, -32, -54, 8).bezierCurveTo(-48, 48, -20, 62, 0, 52)
      .bezierCurveTo(20, 62, 48, 48, 54, 8).bezierCurveTo(62, -32, 16, -44, 0, -24).closePath()
      .fill(swatch.red.fill).stroke(line(swatch.red.line))
      .moveTo(0, -26).quadraticCurveTo(4, -48, 12, -56).stroke(line(swatch.brown.line, 6))
      .ellipse(24, -44, 18, 8).fill(swatch.green.fill).stroke(line(swatch.green.line, 4));
  } else {
    const pts: number[] = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 50 : 22, a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push(Math.cos(a) * r, Math.sin(a) * r + 4);
    }
    g.poly(pts).fill(swatch.yellow.fill).stroke(line(swatch.orange.line));
    g.circle(-10, 4, 4).circle(10, 4, 4).fill(ink);
  }
  return c;
}

/** The numeral drawn with the same stroke table the game traces, for icons and stickers. */
function numeralArt(digit: number, width: number, color: number): Graphics {
  const g = new Graphics();
  for (const stroke of DIGITS[String(digit)]) {
    stroke.forEach(([x, y], i) => (i === 0 ? g.moveTo(x * width, y * width * 1.4) : g.lineTo(x * width, y * width * 1.4)));
    g.stroke({ width: width * 0.16, color, cap: 'round', join: 'round' });
  }
  return g;
}

class NumberTrails implements Game {
  readonly n: number;
  private readonly thing: ReturnType<typeof thingFor>;
  private phase: Phase = 'trace';
  private stroke = 0;
  private progress = 0;
  private points: Point[] = [];
  private previous: Point = [0, 0];
  private readonly background = new Graphics();
  private readonly canvas = new Container();
  private readonly outline = new Graphics();
  private readonly ink = new Graphics();
  private readonly cue = new Graphics();
  private readonly beacon = new Graphics();
  private readonly firefly = new Container();
  private readonly heading = label('', 64, swatch.purple.line);
  private readonly pile = new Container();
  private readonly handle: DragHandle;
  private things: Container[] = [];
  private woken = 0;
  private readonly awake = new Set<Container>();
  private size = 420;
  private view: View;
  private busy = false;
  private misses = 0;
  private hints = 0;
  private wrong = 0;
  private missedDrag = false;
  private clock = 0;
  private readonly tolerance: number;
  private readonly strokes: readonly (readonly Point[])[];

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.n = numeralFor(ctx.level, ctx.rng);
    this.thing = thingFor(ctx.rng);
    this.strokes = DIGITS[String(this.n)];
    this.tolerance = trailTolerance(ctx.level);
    ctx.stage.addChild(this.background, this.canvas, this.pile, this.heading);
    this.canvas.addChild(this.outline, this.ink, this.cue, this.beacon, this.firefly);
    this.firefly.addChild(new Graphics().ellipse(-14, -12, 16, 10).ellipse(14, -12, 16, 10).fill(swatch.teal.light).circle(0, 0, 18).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line }).circle(-6, -3, 3).circle(6, -3, 3).fill(swatch.brown.line));
    this.firefly.hitArea = new Circle(0, 0, 56);
    this.handle = draggable(this.firefly, ctx.tw, {
      lift: 0,
      onPick: () => { this.previous = this.points[this.progress]; this.missedDrag = false; sfx.bell(7, 0.15); },
      onMove: (x, y) => this.trace([x / this.size, y / this.size]),
      onDrop: () => { this.placeFirefly(); return true; },
    });
    this.prepareStroke();
  }

  private prepareStroke() {
    this.points = sampleStroke(this.strokes[this.stroke]);
    this.progress = 0; this.previous = this.points[0]; this.wrong = 0;
    this.handle.enabled = true; this.firefly.visible = true;
    this.draw(); this.placeFirefly();
  }

  private placeFirefly() {
    const p = this.points[this.progress];
    this.firefly.position.set(p[0] * this.size, p[1] * this.size);
    this.handle.home.x = this.firefly.x; this.handle.home.y = this.firefly.y;
  }

  private trace(to: Point) {
    if (this.busy || this.phase !== 'trace') { this.placeFirefly(); return; }
    const next = advanceTrace(this.points, this.progress, this.previous, to, this.tolerance);
    const checkpoint = this.points[this.progress];
    if (next === this.progress && Math.hypot(to[0] - checkpoint[0], to[1] - checkpoint[1]) > this.tolerance * 2 + 1e-9 && !this.missedDrag) {
      this.missedDrag = true; this.misses++; this.wrong++;
      sfx.boing(); void this.ctx.say('nt.wrong');
      if (this.wrong === 2) this.hints++;
    }
    this.progress = next;
    this.previous = to;
    this.placeFirefly(); this.draw();
    if (this.progress === this.points.length - 1) void this.completeStroke();
  }

  private async completeStroke() {
    this.busy = true; this.handle.enabled = false;
    sfx.sparkle();
    // Every new stroke starts with a fresh touch, so moving across a pen lift never draws it.
    while (this.handle.dragging) await this.ctx.tw.wait(0.05);
    await this.ctx.tw.wait(0.2);
    this.stroke++;
    if (this.stroke < this.strokes.length) {
      this.busy = false; this.prepareStroke(); void this.ctx.instruct('nt.stroke'); return;
    }
    this.outline.clear(); this.ink.clear(); this.cue.clear(); this.beacon.clear(); this.firefly.visible = false;
    this.handle.enabled = false;
    await this.meetThings();
  }

  /** The numeral is done: the things it stands for come out, either by themselves or as she wakes them. */
  private async meetThings() {
    const plan = planFor(this.ctx.level);
    const size = groupSize(this.n, plan.wakeThem);
    this.heading.text = `${this.n}`;
    if (this.n === 0) {
      await this.ctx.say('nt.zero', { things: this.thing.plural });
      await this.ctx.tw.wait(1);
      this.phase = 'done'; this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    const spots = thingSpots(size, this.pileRect());
    if (!spots) throw new Error(`Number Trails: ${size} things do not fit this view`);
    this.things = spots.map((s) => {
      const t = drawThing(this.thing.id);
      t.position.set(s.x, s.y); t.hitArea = new Circle(0, 0, THING_HIT);
      this.pile.addChild(t);
      return t;
    });
    if (plan.wakeThem) {
      this.things.forEach((t) => {
        t.tint = ASLEEP; t.scale.set(0.85);
        const z = label('z', 38, swatch.purple.fill); z.position.set(-46, -50); z.name = 'z'; t.addChild(z);
        onTap(t, () => this.wake(t), { cooldown: 200 });
      });
      this.phase = 'wake'; this.busy = false;
      await this.ctx.instruct('nt.wake', { n: this.n, things: thingWord(this.thing, this.n) });
      return;
    }
    this.things.forEach((t) => t.scale.set(0));
    this.phase = 'show';
    for (let i = 0; i < this.things.length; i++) {
      const t = this.things[i];
      sfx.marimba(i % 8, 0.4);
      void this.ctx.tw.to(t.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
      await this.ctx.say('nt.count', { n: i + 1 });
      await this.ctx.tw.wait(0.2);
    }
    await this.ctx.say('nt.made', { n: this.n, things: thingWord(this.thing, this.n) });
    await this.ctx.tw.wait(1);
    this.phase = 'done'; this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  private async wake(t: Container) {
    if (this.phase !== 'wake' || this.busy) return;
    if (this.awake.has(t)) return;
    this.awake.add(t);
    this.woken++;
    const count = this.woken;
    t.tint = 0xffffff; t.getChildByName('z')?.destroy(); sfx.marimba((count - 1) % 8, 0.4);
    void this.ctx.tw.to(t.scale, { x: 1.15, y: 1.15 }, { duration: 0.18, ease: ease.outBack }).then(() => this.ctx.tw.to(t.scale, { x: 1, y: 1 }, { duration: 0.15 }));
    if (count < this.n) { void this.ctx.say('nt.count', { n: count }); return; }
    this.busy = true;
    await this.ctx.say('nt.made', { n: this.n, things: thingWord(this.thing, this.n) });
    // The ones left over go back to sleep for good: nothing more to tap.
    this.things.forEach((x) => { if (!this.awake.has(x)) x.eventMode = 'none'; });
    await this.ctx.tw.wait(1);
    this.phase = 'done'; this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  private pileRect() {
    const v = this.view;
    return { x: 150, y: 140, w: v.w - 190, h: v.h - 190 };
  }

  private drawPath(g: Graphics, points: readonly Point[], color: number, width: number) {
    g.moveTo(points[0][0] * this.size, points[0][1] * this.size);
    points.slice(1).forEach((p) => g.lineTo(p[0] * this.size, p[1] * this.size));
    g.stroke({ width, color, cap: 'round', join: 'round' });
  }

  private draw() {
    if (this.phase !== 'trace') return;
    this.outline.clear(); this.ink.clear(); this.cue.clear();
    this.strokes.forEach((stroke, i) => {
      this.drawPath(this.outline, stroke, i === this.stroke ? swatch.purple.light : swatch.white.line, 28);
      if (i < this.stroke) this.drawPath(this.ink, stroke, swatch.teal.fill, 24);
    });
    if (this.progress > 0) this.drawPath(this.ink, this.points.slice(0, this.progress + 1), swatch.teal.fill, 24);
    if (this.progress === 0) this.drawStart();
    this.heading.text = `${this.n}`;
  }

  /** A ring at the start and an arrow just ahead of it, pointing the way the stroke leaves. */
  private drawStart() {
    const a = this.points[0], b = this.points[Math.min(this.points.length - 1, 7)];
    const ax = a[0] * this.size, ay = a[1] * this.size, bx = b[0] * this.size, by = b[1] * this.size;
    this.cue.circle(ax, ay, 34).stroke({ width: 5, color: swatch.green.line, alpha: 0.9 });
    const len = Math.hypot(bx - ax, by - ay) || 1, dx = (bx - ax) / len, dy = (by - ay) / len;
    const tipX = bx + dx * 12, tipY = by + dy * 12;
    this.cue.poly([tipX, tipY, tipX - dx * 26 - dy * 14, tipY - dy * 26 + dx * 14, tipX - dx * 26 + dy * 14, tipY - dy * 26 - dx * 14])
      .fill(swatch.green.fill).stroke(line(swatch.green.line, 4));
  }

  resize(v: View) {
    this.view = v;
    this.background.clear().rect(0, 0, v.w, v.h).fill(cream);
    this.size = Math.min(v.h - 260, v.w - 360, 520);
    this.canvas.position.set(v.w / 2 - this.size / 2 + 35, (v.h - this.size) / 2 + 55);
    this.heading.position.set(v.w / 2, 70);
    this.draw(); this.placeFirefly();
    if (this.things.length) {
      const spots = thingSpots(this.things.length, this.pileRect());
      if (spots) this.things.forEach((t, i) => t.position.set(spots[i].x, spots[i].y));
    }
  }

  async start() {
    void this.ctx.instruct('nt.start', { n: this.n });
  }

  update(dt: number) {
    this.clock += dt; this.beacon.clear();
    if (this.phase !== 'trace' || this.busy) return;
    const lead = Math.min(this.points.length - 1, this.progress + 1 + Math.floor((this.clock % 1.8) / 1.8 * 16));
    const p = this.points[lead];
    this.beacon.circle(p[0] * this.size, p[1] * this.size, 12).fill({ color: swatch.yellow.fill, alpha: 0.7 });
    if (this.wrong >= 2) this.beacon.circle(this.firefly.x, this.firefly.y, 40 + Math.sin(this.clock * 4) * 5).stroke({ width: 6, color: swatch.yellow.line });
  }

  autotouch(): TouchIntent | null {
    if (this.phase === 'wake' && !this.busy) {
      const next = this.things.find((t) => !this.awake.has(t));
      return next ? { tap: { on: next } } : null;
    }
    if (this.phase !== 'trace' || this.busy || !this.firefly.visible) return null;
    const route = traceWaypoints(this.points.slice(this.progress));
    if (route.length < 2) return null;
    return {
      trace: { on: this.firefly },
      via: route.slice(1).map((p) => ({ on: this.canvas, x: p[0] * this.size, y: p[1] * this.size })),
      pause: 0.12,
    };
  }

  destroy() { this.handle.destroy(); }
}

function icon(): Container {
  const c = new Container();
  const three = numeralArt(3, 120, swatch.purple.fill); three.position.set(-60, -170);
  c.addChild(three, new Graphics().circle(62, -150, 18).fill(swatch.yellow.fill).ellipse(44, -164, 14, 9).ellipse(80, -164, 14, 9).fill(swatch.teal.light));
  return c;
}

function sticker(seed: number): Container {
  const c = new Container(), d = stickerDigit(seed);
  const board = tile(260, 260, 'yellow');
  const digit = numeralArt(d, 120, swatch.purple.fill); digit.position.set(-60, -85);
  c.addChild(board, digit);
  return c;
}

export const numberTrails: GameModule = {
  id: 'number-trails', name: 'Number Trails', titleLine: 'game.number-trails', region: 'counting-cove',
  skills: ['numerals', 'counting', 'fine-motor', 'writing'], bands: ['preschool', 'prek'], levels: (b) => rangeFor(LEVELS, b),
  describeLevel: (l) => planFor(l).name,
  music: STYLES.paint,
  coplayHint: 'Say each number aloud with {name} as the things appear, and trace the same numeral in the air together.',
  offScreen: 'Draw big numerals in sand, flour or on a foggy window, then line up that many pebbles beside each one.',
  hubIcon: () => new WigglyIcon(icon()), sticker, create: (ctx) => new NumberTrails(ctx),
  touchDemo: true,
};
