import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx, type AnimalSound } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import { RoundButton } from '../../ui/buttons';
import { symbol, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { animalsFor, emptierPen, enter, fairBell, fairNeeds, fleeSpeed, FOLLOW_SPEED, followSpeed, inRect, leadGoal, makeHerd, PLACE, pensFull, planFor, PLURAL, ringBell, SHOO_SPEED, shooPoint, signDots, spreadApart, startSpots, throughGate, usesBell, wanted, type Herd, type HerdPlan, type Kind, type Pen, type Rect } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 11, order: [1, 11] },
  toddler: { min: 1, max: 11, order: [1, 11, 10, 2, 3] },
  preschool: { min: 2, max: 5 },
  prek: { min: 3, max: 8 },
};

const SCALE = 0.32;
/** How far from the finger animals start to scoot, and their top speed. */
const SHOO_R = 190;
/** Come along: once the drift has started, every loose animal ambles toward its gate this fast. */
const DRIFT_SPEED = 70;
const WANDER_SPEED = 30;
const BODY = 34;
/** How much of a pen's left fence is open gate. */
const GATE = 0.6;
const FLOORS: Record<Kind, { fill: number; dot: number }> = {
  pig: { fill: 0xa8743f, dot: 0x8b5a2b },
  bunny: { fill: 0x9edb86, dot: swatch.orange.fill },
  cow: { fill: 0xf3dc8a, dot: 0xd9b95a },
  duck: { fill: 0x8fd3f7, dot: 0x60b5d9 },
  dog: { fill: 0xe5c59a, dot: wood.line },
};

interface Animal {
  kind: Kind;
  critter: Critter;
  glow: Graphics;
  vx: number;
  vy: number;
  wander: { x: number; y: number; next: number };
  state: 'waiting' | 'loose' | 'penned' | 'hopping';
  pen: number;
}

interface PenView {
  pen: Pen;
  rect: Rect;
  inside: number;
  art: Container;
  sign: Container;
  glow: Graphics;
}

const VOICES: Record<Kind, AnimalSound> = { pig: 'oink', bunny: 'hop', cow: 'moo', duck: 'quack', dog: 'woof' };
const voiceOf = (kind: Kind) => VOICES[kind];

class Roundup implements Game {
  readonly plan: HerdPlan;
  readonly herd: Herd;
  readonly animals: Animal[] = [];
  readonly pens: PenView[] = [];
  finger: { x: number; y: number } | null = null;
  readonly bell: RoundButton;
  busy = false;
  misses = 0;
  hints = 0;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly penLayer = new Container();
  /** Pen signs sit in front of the animals so they always stay readable. */
  private readonly signLayer = new Container();
  private readonly world = new Container();
  private readonly touch = new Container();
  private readonly fingerRing = new Graphics();
  /** Make it fair: one board above the pens, the animal = the animal. */
  private readonly fairSign = new Container();
  /** An invisible moving target keeps the demonstration finger behind the animal it is shooing. */
  private readonly autoSpot = new Container();
  private view: View;
  private pointer: number | null = null;
  private clock = 0;
  private lastMiss = -10;
  private wrongs = 0;
  private sinceProgress = 0;
  private hinting = false;
  private helped = false;
  /** Come along's help: the herd drifts toward the gate for the rest of the round. */
  private drifting = false;
  private placed = false;
  private autoAnimal: Animal | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.herd = makeHerd(this.plan, ctx.rng);
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0xb5e39c, 0x9edb86], horizon: 0.26, clouds: 2, sun: true, seed: 72 }, ctx.view);
    this.autoSpot.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.penLayer, this.world, this.signLayer, this.fairSign, this.fingerRing, this.autoSpot, this.touch);
    this.fairSign.eventMode = 'none';
    if (this.herd.fair) this.drawFairSign();
    this.bell = new RoundButton(symbol('bell', 0, 34), swatch.yellow, 56, () => void this.ring());
    this.bell.visible = usesBell(this.plan);
    ctx.stage.addChild(this.bell);

    for (const pen of this.herd.pens) {
      const view: PenView = { pen, rect: { x: 0, y: 0, w: 0, h: 0 }, inside: 0, art: new Container(), sign: new Container(), glow: new Graphics() };
      this.pens.push(view);
      this.penLayer.addChild(view.glow, view.art);
      this.signLayer.addChild(view.sign);
      // Lap: a tap on the sign says who lives there. Never a miss or a hint.
      if (this.plan.mode === 'tap') onTap(view.sign, () => void this.ctx.say('herd.sign', { animals: PLURAL[pen.kind] }), { cooldown: 1200 });
    }
    for (const kind of this.herd.animals) {
      const critter = new Critter(CRITTERS[kind]);
      critter.scale.set(SCALE);
      const glow = new Graphics().ellipse(0, -6, 62, 26).fill({ color: 0xfff3a0, alpha: 0.85 });
      glow.visible = false;
      ctx.track(critter);
      const a: Animal = { kind, critter, glow, vx: 0, vy: 0, wander: { x: 0, y: 0, next: 0 }, state: 'loose', pen: -1 };
      if (this.plan.mode === 'tap') {
        onTap(critter, () => void this.hopIn(a), { cooldown: 400 });
        // Hit areas are in body units (the critter is drawn at a third size): about 85 units round its middle.
        critter.hitArea = new Circle(0, -120, 85 / SCALE);
      }
      if (this.plan.sequential && this.animals.length) {
        a.state = 'waiting';
        critter.visible = false;
      }
      this.animals.push(a);
      this.world.addChild(glow, critter);
    }

    // Shooing listens on top of everything; the lap level taps animals instead.
    if (this.plan.mode !== 'tap') {
      this.touch.eventMode = 'static';
      this.touch.on('pointerdown', (e: FederatedPointerEvent) => {
        if (palmOnGlass()) return;
        this.pointer = e.pointerId;
        this.point(e);
      });
      this.touch.on('globalpointermove', (e: FederatedPointerEvent) => e.pointerId === this.pointer && this.point(e));
      const up = (e: { pointerId: number }) => {
        if (e.pointerId !== this.pointer) return;
        this.pointer = null;
        this.finger = null;
      };
      this.touch.on('pointerup', up);
      this.touch.on('pointerupoutside', up);
    } else {
      // Lap: a tap on the grass or a pen makes the nearest loose animal hop and speak. Never a miss or a hint.
      onTap(this.backdrop, (e) => this.nudge(this.ctx.stage.toLocal(e.global)), { cooldown: 500 });
    }
  }

  /** The loose animal nearest a lap tap hops once in place and says hello. */
  private nudge(p: { x: number; y: number }) {
    if (this.finished) return;
    let near: Animal | null = null;
    for (const a of this.animals) {
      if (a.state !== 'loose') continue;
      if (!near || Math.hypot(a.critter.x - p.x, a.critter.y - p.y) < Math.hypot(near.critter.x - p.x, near.critter.y - p.y)) near = a;
    }
    if (!near) return;
    near.critter.cheer();
    sfx.animal(voiceOf(near.kind));
  }

  start() {
    const [a, b] = this.herd.pens;
    const animals = PLURAL[a.kind];
    switch (this.plan.mode) {
      case 'tap':
        return void this.ctx.instruct('herd.tap', { animals });
      case 'follow':
        return void this.ctx.instruct('herd.follow', { animals });
      case 'shoo':
        return void this.ctx.instruct(this.plan.sequential ? 'herd.shooone' : 'herd.shoo', this.plan.sequential ? { animal: a.kind } : { animals });
      case 'sort':
        return void this.ctx.instruct('herd.sort', { a: PLURAL[a.kind], b: PLURAL[b.kind], placeA: PLACE[a.kind], placeB: PLACE[b.kind] });
      case 'sortStay':
        return void this.ctx.instruct('herd.sortstay', { a: PLURAL[a.kind], b: PLURAL[b.kind], placeA: PLACE[a.kind], placeB: PLACE[b.kind], outsiders: PLURAL[this.herd.stay!] });
      case 'count':
        return void this.ctx.instruct('herd.count', { n: a.target!, animals });
      case 'fair':
        return void this.ctx.instruct('herd.fair', { animals });
      case 'sortCount':
        return void this.ctx.instruct('herd.sortcount', { a: `${a.target!} ${animalsFor(a.kind, a.target!)} in the ${PLACE[a.kind]}`, b: `${b.target!} ${animalsFor(b.kind, b.target!)} in the ${PLACE[b.kind]}` });
    }
  }

  private point(e: FederatedPointerEvent) {
    if (this.finished) return;
    const p = this.ctx.stage.toLocal(e.global);
    this.finger = { x: p.x, y: p.y };
  }

  private field() {
    const v = this.view;
    // Clear of the corner guide and the screen edges, so there's always room to get a finger behind an animal.
    return { x0: this.plan.sequential ? Math.max(230, v.w - 640) : 230, x1: v.w - 40, y0: v.h * 0.34, y1: v.h - 90 };
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    // Only when shooing: under an interactive stage, any hit area catches taps meant for things below.
    if (this.plan.mode !== 'tap') this.touch.hitArea = new Rectangle(0, 0, v.w, v.h);
    else this.backdrop.hitArea = new Rectangle(0, 0, v.w, v.h);
    const f = this.field();
    const two = this.pens.length === 2;
    const w = two ? 270 : 300;
    const h = two ? Math.min(200, (f.y1 - f.y0 - 40) / 2) : Math.min(300, f.y1 - f.y0 - 40);
    this.pens.forEach((p, i) => {
      const top = two ? f.y0 + 10 + i * (h + 30) : (f.y0 + f.y1) / 2 - h / 2;
      p.rect = { x: v.w - 60 - w, y: top, w, h };
      this.drawPen(p);
    });
    this.bell.position.set(v.w - 90, f.y0 - 95);
    this.fairSign.position.set(this.pens[0].rect.x + 15, f.y0 - 95);
    if (!this.placed) {
      this.placed = true;
      const spots = startSpots(this.animals.length, f, this.pens[0].rect.x - 80, this.ctx.rng);
      if (this.plan.sequential) {
        const r = this.pens[0].rect;
        for (const spot of spots) {
          spot.x = this.ctx.rng.range(r.x - 170, r.x - 110);
          spot.y = r.y + r.h / 2 + this.ctx.rng.range(-55, 55);
        }
      }
      this.animals.forEach((a, i) => {
        a.critter.position.set(spots[i].x, spots[i].y);
        a.wander = { x: a.critter.x, y: a.critter.y, next: this.ctx.rng.range(0, 2) };
      });
    }
  }

  /** A fenced pen with its floor, a gap in the left fence, and a sign with who lives there. */
  private drawPen(p: PenView) {
    const { x, y, w, h } = p.rect;
    p.art.removeChildren().forEach((c) => c.destroy());
    const floor = FLOORS[p.pen.kind];
    const g = new Graphics().roundRect(x, y, w, h, 20).fill(floor.fill);
    const rng = new Rng(7);
    for (let i = 0; i < 10; i++) {
      const [dx, dy] = [rng.range(30, w - 30), rng.range(30, h - 30)];
      if (p.pen.kind === 'bunny') g.poly([x + dx - 7, y + dy - 8, x + dx + 7, y + dy - 8, x + dx, y + dy + 16]).fill(floor.dot);
      else if (p.pen.kind === 'duck') g.ellipse(x + dx, y + dy, 14, 5).stroke({ width: 3, color: floor.dot });
      else if (p.pen.kind === 'dog') {
        // Little kennels mark the yard without hiding the sign or narrowing the gate.
        g.poly([x + dx - 12, y + dy, x + dx, y + dy - 13, x + dx + 12, y + dy, x + dx + 12, y + dy + 13, x + dx - 12, y + dy + 13]).fill(wood.fill);
        g.roundRect(x + dx - 5, y + dy + 2, 10, 11, 4).fill(floor.dot);
      } else g.circle(x + dx, y + dy, rng.range(6, 12)).fill(floor.dot);
    }
    const gateTop = y + (h * (1 - (this.plan.gate ?? GATE))) / 2;
    const gateBottom = y + h - (h * (1 - (this.plan.gate ?? GATE))) / 2;
    const rail = { width: 10, color: wood.line, cap: 'round' as const };
    g.moveTo(x, gateTop).lineTo(x, y).lineTo(x + w, y).lineTo(x + w, y + h).lineTo(x, y + h).lineTo(x, gateBottom).stroke(rail);
    g.moveTo(x, gateTop).lineTo(x, y).lineTo(x + w, y).lineTo(x + w, y + h).lineTo(x, y + h).lineTo(x, gateBottom).stroke({ ...rail, width: 5, color: wood.fill });
    for (const [px, py] of [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, gateTop], [x, gateBottom], [x + w / 2, y], [x + w / 2, y + h]]) g.roundRect(px - 9, py - 16, 18, 30, 5).fill(wood.fill).stroke({ width: 4, color: wood.line });
    // An open gate swung outward.
    g.moveTo(x, gateTop).lineTo(x - 50, gateTop - 30).stroke(rail);
    g.moveTo(x, gateBottom).lineTo(x - 50, gateBottom + 30).stroke(rail);
    p.art.addChild(g);
    this.drawSign(p);
  }

  private drawSign(p: PenView) {
    const { x, y, w } = p.rect;
    p.sign.removeChildren().forEach((c) => c.destroy({ children: true }));
    const counting = p.pen.target !== undefined;
    const bw = counting ? 230 : 100;
    const board = new Graphics().roundRect(-bw / 2, -40, bw, 80, 16).fill(0xffffff).stroke({ width: 5, color: wood.line });
    const face = new Critter(CRITTERS[p.pen.kind]);
    face.alive = false;
    face.scale.set(0.24);
    face.position.set(counting ? -72 : 0, 34);
    p.sign.addChild(board, face);
    if (counting) {
      // The numeral and as many dots, like Animal Snack's food sign.
      const n = label(String(p.pen.target), 52, ink);
      n.anchor.set(0.5);
      n.position.set(-6, 0);
      const dots = new Graphics();
      for (const d of signDots(p.pen.target!)) dots.circle(64 + d.x, d.y, 9).fill(ink);
      p.sign.addChild(n, dots);
    }
    p.sign.hitArea = new Rectangle(-Math.max(bw, 120) / 2, -55, Math.max(bw, 120), 110);
    p.sign.position.set(x + w / 2, y - 6);
  }

  /** Two faces of the round's animal with an equals mark between them, and no number: how many is hers to choose. */
  private drawFairSign() {
    const board = new Graphics().roundRect(-125, -42, 250, 84, 16).fill(0xffffff).stroke({ width: 5, color: wood.line });
    const equals = new Graphics().roundRect(-20, -14, 40, 9, 4).roundRect(-20, 5, 40, 9, 4).fill(ink);
    this.fairSign.addChild(board, equals);
    for (const x of [-72, 72]) {
      const face = new Critter(CRITTERS[this.herd.pens[0].kind]);
      face.alive = false;
      face.scale.set(0.24);
      face.position.set(x, 34);
      this.fairSign.addChild(face);
    }
  }

  /** Whether ringing now would be right. */
  private bellRight(): boolean {
    const inside = this.pens.map((p) => p.inside);
    if (this.herd.fair) return fairBell(inside).fair;
    return ringBell(this.herd, inside).every((r) => !r.extra && !r.short);
  }

  update(dt: number) {
    this.clock += dt;
    this.placeAutoSpot();
    const f = this.field();
    for (const a of this.animals) {
      if (a.state === 'loose') this.roam(a, dt, f);
      else if (a.state === 'penned') this.potter(a, dt);
      a.glow.position.copyFrom(a.critter.position);
    }
    this.separate();
    this.world.children.sort((p, q) => p.y - q.y);

    this.fingerRing.clear();
    if (this.finger) this.fingerRing.circle(this.finger.x, this.finger.y, 60 + 6 * Math.sin(this.clock * 8)).stroke({ width: 6, color: 0xffffff, alpha: 0.6 });

    if (!this.finished && this.animals.some((a) => a.state === 'loose')) {
      this.sinceProgress += dt;
      if (this.sinceProgress >= (this.plan.hintAfter ?? 15) && !this.hinting && !this.drifting) this.showHint();
      // Still stuck: the nearest one trots home by itself, so no round gets stuck.
      if (this.sinceProgress >= (this.plan.helpAfter ?? 30) && !this.helped) {
        this.helped = true;
        const a = this.animals.find((x) => x.state === 'loose' && this.needs(x) >= 0);
        // Help, not her own move: it counts as a hint.
        if (a) {
          this.hints++;
          void this.hopIn(a);
        }
      }
    }
    this.drawGlows();
  }

  private placeAutoSpot() {
    const a = this.autoAnimal;
    if (!a || a.state !== 'loose') return;
    const i = this.needs(a);
    if (this.plan.mode === 'follow' && i >= 0) {
      // Lead from in front: the finger stays beyond the herd's gathering ring, on the way to the gate, so it reaches the gate first.
      const goal = leadGoal(a.critter, this.pens[i].rect);
      const dx = goal.x - a.critter.x;
      const dy = goal.y - a.critter.y;
      const d = Math.hypot(dx, dy) || 1;
      const ahead = 160;
      this.autoSpot.position.set(a.critter.x + (dx / d) * ahead, a.critter.y - 30 + (dy / d) * ahead);
      return;
    }
    if (i < 0) {
      // A counted spare stays in the meadow, clear of another animal's route to its gate.
      const p = shooPoint({ x: a.critter.x, y: a.critter.y - 30 }, { x: this.field().x0 + 40, y: a.critter.y - 30 });
      this.autoSpot.position.set(p.x, p.y);
      return;
    }
    const r = this.pens[i].rect;
    // Line up outside the correct gate before pushing across the fence line.
    const aligned = Math.abs(a.critter.y - (r.y + r.h / 2)) < r.h * 0.2;
    const goal = { x: aligned && a.critter.x > r.x - 70 ? r.x + 80 : r.x - 60, y: r.y + r.h / 2 - 30 };
    const p = shooPoint({ x: a.critter.x, y: a.critter.y - 30 }, goal);
    this.autoSpot.position.set(p.x, p.y);
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    // Start with the animal nearest its gate so the finger does not sweep a nearer spare in first.
    const candidates = this.animals.filter((a) => a.state === 'loose' && this.needs(a) >= 0);
    const distance = (a: Animal) => {
      const r = this.pens[this.needs(a)].rect;
      return Math.hypot(a.critter.x - r.x, a.critter.y - r.y - r.h / 2);
    };
    // A spare ahead of a needed animal would be swept into that animal's pen too.
    // Use the same steering gesture to move it left first, rather than correcting an extra at the bell.
    const spare = usesBell(this.plan) ? this.animals.find((a) => a.state === 'loose' && this.needs(a) < 0 && a.critter.x > this.field().x0 + 110) : undefined;
    const animal = spare ?? candidates.sort((a, b) => distance(a) - distance(b))[0];
    if (this.plan.mode === 'tap') return animal ? { tap: { on: animal.critter, y: -120 }, pause: 0.1 } : null;
    if (animal) {
      this.autoAnimal = animal;
      this.placeAutoSpot();
      const spot = { on: this.autoSpot };
      return { trace: spot, via: [spot, spot, spot, spot, spot], receiver: this.touch, pause: 0.05 };
    }
    this.autoAnimal = null;
    // Make it fair: with nobody left to share, the bell; a wrong ring sends the extras back out to share again.
    if (usesBell(this.plan) && (this.bellRight() || (this.herd.fair && !this.animals.some((a) => a.state === 'loose')))) {
      return { tap: { on: this.bell }, pause: 0.1 };
    }
    return null;
  }

  /** The pen an animal belongs in that is still short of animals, or -1. */
  private needs(a: Animal): number {
    if (this.herd.fair) return fairNeeds(this.herd, this.pens.map((p) => p.inside));
    const i = this.penFor(a);
    return i >= 0 && this.pens[i].inside < wanted(this.herd, this.pens[i].pen) ? i : -1;
  }

  /** The pen an animal belongs in that still has room, or -1. */
  private penFor(a: Animal): number {
    // Make it fair: either pen takes them; steering and help lean toward the emptier one.
    if (this.herd.fair) return emptierPen(this.pens.map((p) => p.inside));
    return this.pens.findIndex((p) => p.pen.kind === a.kind && (usesBell(this.plan) || p.inside < wanted(this.herd, p.pen)));
  }

  private roam(a: Animal, dt: number, f: { x0: number; x1: number; y0: number; y1: number }) {
    const c = a.critter;
    let tx = 0;
    let ty = 0;
    a.wander.next -= dt;
    if (a.wander.next <= 0) {
      // Wandering drifts back toward the open middle of the meadow.
      const left = this.pens[0].rect.x - 90;
      a.wander = {
        x: Math.max(f.x0 + 70, Math.min(left, c.x + this.ctx.rng.range(-120, 120))),
        y: Math.max(f.y0 + 50, Math.min(f.y1 - 50, c.y + this.ctx.rng.range(-80, 80))),
        next: this.ctx.rng.range(2, 4),
      };
    }
    const wd = Math.hypot(a.wander.x - c.x, a.wander.y - c.y);
    if (wd > 5) {
      tx = ((a.wander.x - c.x) / wd) * WANDER_SPEED;
      ty = ((a.wander.y - c.y) / wd) * WANDER_SPEED;
    }
    const home = this.pens[this.penFor(a)]?.rect;
    if (this.plan.mode === 'follow' && home && (this.finger || this.drifting)) {
      // A finger past the gate line, or the drift, leads to the gate's mouth first, so nobody presses into the fence.
      const toGate = c.x < home.x && (!this.finger || this.finger.x > home.x - 40);
      const goal = toGate ? leadGoal(c, home) : { x: this.finger!.x, y: this.finger!.y + 30 };
      const dx = goal.x - c.x;
      const dy = goal.y - c.y;
      const d = Math.hypot(dx, dy) || 1;
      const s = !this.finger ? DRIFT_SPEED : toGate ? FOLLOW_SPEED : followSpeed(d);
      tx = (dx / d) * s;
      ty = (dy / d) * s;
      a.wander.next = 1.5;
      a.wander.x = c.x + tx * 0.3;
      a.wander.y = c.y + ty * 0.3;
    } else if (this.finger && this.plan.mode !== 'follow') {
      const dx = c.x - this.finger.x;
      const dy = c.y - 30 - this.finger.y;
      const d = Math.hypot(dx, dy) || 1;
      const s = fleeSpeed(d, this.plan.fleeRadius ?? SHOO_R, SHOO_SPEED);
      if (s > 0) {
        tx = (dx / d) * s;
        ty = (dy / d) * s;
        // Near home, a shooed animal heads for its gate: the finger only has to get it close.
        if (home) {
          const gx = home.x + 20 - c.x;
          const gy = home.y + home.h / 2 - c.y;
          const gd = Math.hypot(gx, gy) || 1;
          if (gd < 220 && tx * gx + ty * gy > 0) {
            const pull = 1 - gd / 220;
            tx += (gx / gd) * s * pull * 1.2;
            ty += (gy / gd) * s * pull * 1.2;
          }
        }
        a.wander.next = 1.5;
        a.wander.x = c.x + tx;
        a.wander.y = c.y + ty;
      }
    }
    const k = Math.min(1, dt * 6);
    a.vx += (tx - a.vx) * k;
    a.vy += (ty - a.vy) * k;
    const from = { x: c.x, y: c.y };
    let to = { x: c.x + a.vx * dt, y: c.y + a.vy * dt };
    to.x = Math.max(f.x0, Math.min(f.x1, to.x));
    to.y = Math.max(f.y0, Math.min(f.y1, to.y));

    for (let i = 0; i < this.pens.length; i++) {
      const r = this.pens[i].rect;
      if (throughGate(r, from, to, this.plan.gate ?? GATE)) {
        this.arrive(a, i);
        return;
      }
      // Fences keep a body's width away, except in the gate's mouth, which stays open.
      const body = { x: r.x - BODY, y: r.y - BODY * 0.6, w: r.w + BODY * 2, h: r.h + BODY * 1.2 };
      const pad = (r.h * (1 - (this.plan.gate ?? GATE))) / 2;
      const ok = (p: { x: number; y: number }) => !inRect(body, p.x, p.y) || (p.x <= r.x && p.y > r.y + pad && p.y < r.y + r.h - pad);
      if (ok(to)) continue;
      // Bump along the fence instead of through it.
      if (ok({ x: from.x, y: to.y })) to = { x: from.x, y: to.y };
      else if (ok({ x: to.x, y: from.y })) to = { x: to.x, y: from.y };
      else to = from;
      a.vx *= 0.3;
      a.vy *= 0.3;
    }
    c.position.set(to.x, to.y);
    const moving = Math.hypot(a.vx, a.vy);
    if (Math.abs(a.vx) > 8) c.scale.x = SCALE * Math.sign(a.vx);
    c.rotation = moving > 20 ? 0.12 * Math.sin(this.clock * 16 + a.wander.next) : c.rotation * 0.8;
  }

  /** Penned animals amble about inside. */
  private potter(a: Animal, dt: number) {
    const r = this.pens[a.pen].rect;
    const c = a.critter;
    a.wander.next -= dt;
    if (a.wander.next <= 0) a.wander = { x: this.ctx.rng.range(r.x + 50, r.x + r.w - 40), y: this.ctx.rng.range(r.y + 60, r.y + r.h - 20), next: this.ctx.rng.range(2, 4) };
    const dx = a.wander.x - c.x;
    const dy = a.wander.y - c.y;
    const d = Math.hypot(dx, dy);
    if (d > 4) {
      c.x += (dx / d) * WANDER_SPEED * dt;
      c.y += (dy / d) * WANDER_SPEED * dt;
      c.scale.x = SCALE * Math.sign(dx || 1);
    }
  }

  /** Loose animals don't pile up on top of each other. */
  private separate() {
    const loose = this.animals.filter((a) => a.state === 'loose');
    spreadApart(loose.map((a) => a.critter));
    // Jostling never pushes anyone through a fence: back out the way they came.
    for (const a of loose) {
      for (const p of this.pens) {
        const r = p.rect;
        const pad = (r.h * (1 - (this.plan.gate ?? GATE))) / 2;
        const { x, y } = a.critter;
        const inMouth = x <= r.x && y > r.y + pad && y < r.y + r.h - pad;
        if (!inMouth && inRect({ x: r.x - BODY, y: r.y - BODY * 0.6, w: r.w + BODY * 2, h: r.h + BODY * 1.2 }, x, y)) a.critter.x = r.x - BODY - 1;
      }
    }
  }

  /** Through the gate: in it goes, or back out it hops. */
  private arrive(a: Animal, i: number) {
    const p = this.pens[i];
    const result = enter(p.pen, a.kind);
    if (result === 'in') {
      void this.settle(a, i);
      return;
    }
    void this.bounceOut(a, i, result);
  }

  private async settle(a: Animal, i: number) {
    const p = this.pens[i];
    a.state = 'penned';
    a.pen = i;
    a.vx = a.vy = 0;
    a.wander = { x: p.rect.x + 80, y: a.critter.y, next: 1 };
    p.inside++;
    this.sinceProgress = 0;
    this.hinting = false;
    this.helped = false;
    a.critter.cheer();
    sfx.animal(voiceOf(a.kind));
    this.ctx.particles.burst(a.critter.x, a.critter.y - 40, { kind: 'heart', colors: [swatch.pink.fill, swatch.red.fill], count: 4, speed: [40, 100], gravity: -60, size: [0.3, 0.45] });
    const next = this.animals.find((x) => x.state === 'waiting');
    if (next) {
      // A new animal arrives only after the first success; the penned friend stays home.
      this.busy = true;
      this.finger = null;
      await this.ctx.tw.wait(0.8);
      next.state = 'loose';
      next.critter.visible = true;
      this.busy = false;
      return;
    }
    if (p.pen.target !== undefined || this.herd.fair) void this.ctx.say('count', { n: p.inside });
    else if (pensFull(this.herd, this.pens.map((x) => x.inside))) void this.finale();
  }

  private async bounceOut(a: Animal, i: number, why: 'wrong-pen') {
    const p = this.pens[i];
    a.state = 'hopping';
    a.vx = a.vy = 0;
    sfx.boing();
    a.critter.poke();
    const c = a.critter;
    void this.ctx.tw.to(c, { x: p.rect.x - 130, y: p.rect.y + p.rect.h / 2 }, { duration: 0.6, ease: ease.outBack }).then(() => {
      a.state = 'loose';
      a.wander = { x: c.x - 60, y: c.y, next: 2 };
    });
    if (this.clock - this.lastMiss < 2) return;
    this.lastMiss = this.clock;
    this.misses++;
    this.wrongs++;
    if (why === 'wrong-pen') {
      if (a.kind === this.herd.stay) void this.ctx.say('herd.stayout', { outsiders: PLURAL[a.kind] });
      else void this.ctx.say('herd.wrongpen', { pen: p.pen.kind });
    }
    if (this.wrongs >= 2 && !this.hinting) this.showHint();
  }

  /** The bell: "I think that's the right number." Extras hop back out; a short pen asks for more. */
  private async ring() {
    if (this.busy || this.finished || !usesBell(this.plan)) return;
    this.busy = true;
    this.finger = null;
    this.sinceProgress = 0;
    if (this.herd.fair) return this.ringFair();
    const result = ringBell(this.herd, this.pens.map((p) => p.inside));
    if (result.every((r) => r.extra === 0 && r.short === 0)) {
      void this.finale(true);
      return;
    }
    this.misses++;
    this.wrongs++;
    sfx.boing();
    for (let i = 0; i < this.pens.length; i++) {
      const p = this.pens[i];
      const { extra, short } = result[i];
      if (extra > 0) {
        await this.ctx.say('herd.extra', { count: p.inside, n: p.pen.target! });
        const out = this.animals.filter((a) => a.state === 'penned' && a.pen === i).slice(0, extra);
        for (const a of out) {
          a.state = 'hopping';
          p.inside--;
          await this.ctx.tw.to(a.critter, { x: p.rect.x - 140, y: p.rect.y + p.rect.h / 2 + this.ctx.rng.range(-60, 60) }, { duration: 0.5, ease: ease.outBack });
          a.state = 'loose';
          a.wander = { x: a.critter.x - 60, y: a.critter.y, next: 2 };
        }
      } else if (short > 0) {
        await this.ctx.say('herd.short', { k: p.inside, n: p.pen.target! });
      }
    }
    if (this.wrongs >= 2 && !this.hinting) this.showHint();
    this.busy = false;
  }

  /** Make it fair's bell: the seesaw levels out, or tips, and the pet says which pen has more. */
  private async ringFair() {
    const inside = this.pens.map((p) => p.inside);
    const bell = fairBell(inside);
    sfx.seesaw(bell.fair);
    if (bell.fair) {
      void this.finale(true);
      return;
    }
    this.misses++;
    this.wrongs++;
    const animals = PLURAL[this.herd.pens[0].kind];
    if (inside[0] === 0 && inside[1] === 0) await this.ctx.say('herd.fairnone', { animals });
    else if (inside[bell.less] === 0) await this.ctx.say('herd.fairempty', { animals });
    else {
      await this.ctx.say('herd.unfair', { more: inside[bell.more], less: inside[bell.less] });
      const p = this.pens[bell.more];
      const out = this.animals.filter((a) => a.state === 'penned' && a.pen === bell.more).slice(0, bell.extra);
      for (const a of out) {
        a.state = 'hopping';
        p.inside--;
        await this.ctx.tw.to(a.critter, { x: p.rect.x - 140, y: p.rect.y + p.rect.h / 2 + this.ctx.rng.range(-60, 60) }, { duration: 0.5, ease: ease.outBack });
        a.state = 'loose';
        a.wander = { x: a.critter.x - 60, y: a.critter.y, next: 2 };
      }
    }
    if (this.wrongs >= 2 && !this.hinting) this.showHint();
    this.busy = false;
  }

  private showHint() {
    this.hints++;
    this.wrongs = 0;
    this.hinting = true;
    // Come along: one hint starts a drift that lasts the rest of the round, rather than one per animal.
    if (this.plan.mode === 'follow') this.drifting = true;
  }

  private drawGlows() {
    for (const p of this.pens) p.glow.clear();
    // Counting levels with every pen right: the bell is what's left to do.
    const bellTime = usesBell(this.plan) && this.bellRight();
    this.bell.rotation = this.hinting && bellTime ? 0.25 * Math.sin(this.clock * 10) : 0;
    const lit = this.hinting || this.drifting;
    for (const a of this.animals) {
      const target = a.state === 'loose' ? this.needs(a) : -1;
      a.glow.visible = lit && target >= 0;
      if (a.glow.visible) a.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 7);
      if (lit && target >= 0) {
        const r = this.pens[target].rect;
        this.pens[target].glow.clear().ellipse(r.x, r.y + r.h / 2, 46, r.h * 0.34 + 4 * Math.sin(this.clock * 7)).fill({ color: 0xfff3a0, alpha: 0.8 });
      }
    }
  }

  /** Lap: a tapped animal hops through its gate by itself. */
  async hopIn(a: Animal) {
    if (a.state !== 'loose' || this.finished) return;
    const i = this.penFor(a);
    if (i < 0) return;
    a.state = 'hopping';
    const r = this.pens[i].rect;
    const c = a.critter;
    c.scale.x = SCALE;
    sfx.whoosh();
    await this.ctx.tw.to(c, { x: r.x - 40, y: r.y + r.h / 2 }, { duration: 0.6, ease: ease.inOutSine });
    await this.ctx.tw.to(c, { x: r.x + 70, y: r.y + r.h / 2 + 10 }, { duration: 0.4, ease: ease.outBack });
    void this.settle(a, i);
  }

  /** `counted`: the bell was right, so the pet says each pen's total once more first. */
  private async finale(counted = false) {
    if (this.finished) return;
    this.finished = true;
    this.finger = null;
    const totals = this.pens.map((p) => ({ n: p.inside, animals: animalsFor(p.pen.kind, p.inside), place: PLACE[p.pen.kind] }));
    for (const a of this.animals) if (a.state === 'penned') a.critter.cheer();
    sfx.tada();
    for (const p of this.pens) this.ctx.particles.burst(p.rect.x + p.rect.w / 2, p.rect.y + p.rect.h / 2, { kind: 'star', colors: [0xffffff, 0xfff3a0], count: 16, speed: [120, 300], gravity: 0, life: [0.6, 1] });
    if (this.herd.fair) {
      // Equal is the rule: any left on the grass are fine, and the pet says so.
      const loose = this.animals.filter((a) => a.state === 'loose').length;
      await this.ctx.say('herd.fairdone', { n: totals[0].n, animals: totals[0].animals });
      if (loose) await this.ctx.say('herd.fairleft', { k: loose, animals: animalsFor(this.herd.pens[0].kind, loose) });
    } else {
      if (counted) for (const t of totals) await this.ctx.say('herd.total', t);
      if (this.herd.stay) await this.ctx.say('herd.staydone', { outsiders: PLURAL[this.herd.stay] });
      else await this.ctx.say('herd.done');
    }
    await this.ctx.tw.wait(1);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  destroy() {
    this.touch.removeAllListeners();
  }
}

class RoundupIcon extends WigglyIcon {
  private readonly critters: Critter[];
  private t = 0;
  constructor() {
    const c = new Container();
    const fence = new Graphics();
    for (const x of [-120, -40, 40, 120]) fence.roundRect(x - 8, -90, 16, 90, 5).fill(wood.fill).stroke({ width: 4, color: wood.line });
    fence.roundRect(-130, -76, 260, 14, 6).roundRect(-130, -36, 260, 14, 6).fill(wood.fill).stroke({ width: 4, color: wood.line });
    const pig = new Critter(CRITTERS.pig);
    pig.scale.set(0.42);
    pig.position.set(-50, 10);
    const bunny = new Critter(CRITTERS.bunny);
    bunny.scale.set(0.38);
    bunny.position.set(60, 14);
    c.addChild(fence, pig, bunny);
    super(c);
    this.critters = [pig, bunny];
  }
  update(dt: number) {
    super.update(dt);
    this.t += dt;
    this.critters.forEach((x, i) => {
      x.update(dt);
      x.x = (i ? 60 : -50) + 10 * Math.sin(this.t * 1.4 + i * 2);
    });
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const fence = new Graphics();
  for (const x of [-100, 0, 100]) fence.roundRect(x - 8, -80, 16, 80, 5).fill(wood.fill).stroke({ width: 4, color: wood.line });
  fence.roundRect(-110, -66, 220, 14, 6).roundRect(-110, -30, 220, 14, 6).fill(wood.fill).stroke({ width: 4, color: wood.line });
  c.addChild(fence);
  const kinds: Kind[] = rng.shuffle(['pig', 'bunny', 'cow']).slice(0, 2) as Kind[];
  kinds.forEach((k, i) => {
    const a = new Critter(CRITTERS[k]);
    a.alive = false;
    a.scale.set(0.36);
    a.position.set(i ? 50 : -50, 20);
    c.addChild(a);
  });
  return c;
}

export const roundup: GameModule = {
  id: 'roundup',
  name: 'Roundup',
  titleLine: 'game.roundup',
  region: 'barnyard',
  skills: ['motor-planning', 'sorting', 'counting'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: [10, 11],
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'Help {name} send the animals home: lead the ones that follow a finger, and wiggle a finger behind the ones that run from it.',
  offScreen: 'Herd stuffed animals into a laundry-basket "pen", counting each one in.',
  hubIcon: () => new RoundupIcon(),
  sticker,
  touchDemo: true,
  create: (ctx) => new Roundup(ctx),
};
