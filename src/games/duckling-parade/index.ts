import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { swatch, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { arrive, canJoin, makeRound, needed, nextInPattern, planFor, readyForPond, type ParadePlan, type Round } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 3 },
  preschool: { min: 2, max: 6 },
  prek: { min: 4, max: 8 },
};

const MAMA_SCALE = 0.5;
const DUCK_SCALE = 0.2;
/** How close Mama has to come for a duckling to notice her. */
const REACH = 90;
/** Spacing along the trail between ducklings in the line. */
const GAP = 58;
const WATER = 0x7cc4f2;
const WATER_EDGE = 0x5aa9e0;

interface Duckling {
  color: ColorName;
  critter: Critter;
  glow: Graphics;
  state: 'loose' | 'line' | 'pond' | 'busy';
  /** Where it waits on the meadow, as fractions of the play area. */
  home: { fx: number; fy: number };
  /** No more fuss from this one until then (after saying "not me"). */
  calmUntil: number;
  phase: number;
}

class DucklingParade implements Game {
  readonly plan: ParadePlan;
  readonly round: Round;
  readonly ducklings: Duckling[] = [];
  readonly line: Duckling[] = [];
  readonly mama = new Critter({ ...CRITTERS.duck, color: 'white' });
  readonly target = { x: 0, y: 0 };
  misses = 0;
  hints = 0;
  homeCount = 0;
  busy = false;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly ground = new Container();
  private readonly pond = new Graphics();
  private readonly pondGlow = new Graphics();
  private readonly card = new Container();
  private readonly cardSlots = new Graphics();
  private readonly world = new Container();
  private readonly trail: { x: number; y: number }[] = [];
  private view: View;
  private pondAt = { x: 0, y: 0, rx: 160, ry: 90 };
  private steering: number | null = null;
  private clock = 0;
  private lastMiss = -10;
  private wrongs = 0;
  private sinceProgress = 0;
  private hinting = false;
  private announcedHome = false;
  private placed = false;
  /** When the finger last set a destination, and when the duckling it picked joined: then the tap is spent. */
  private aimedAt = 0;
  private joinedAt = -1;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.round = makeRound(this.plan, ctx.rng);
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0xa6de8e, 0x9edb86], horizon: 0.3, clouds: 3, sun: true, seed: 61 }, ctx.view);
    // The steering layer sits on top: anything drawn above it would catch the finger instead.
    ctx.stage.addChild(this.backdrop, this.pondGlow, this.pond, this.world, this.card, this.ground);
    this.card.addChild(this.cardSlots);

    this.ground.eventMode = 'static';
    this.ground.on('pointerdown', (e: FederatedPointerEvent) => this.steer(e, true));
    this.ground.on('globalpointermove', (e: FederatedPointerEvent) => e.pointerId === this.steering && this.steer(e, false));
    const up = (e: { pointerId: number }) => e.pointerId === this.steering && (this.steering = null);
    this.ground.on('pointerup', up);
    this.ground.on('pointerupoutside', up);

    this.mama.scale.set(MAMA_SCALE);
    ctx.track(this.mama);
    const spots = this.spots(this.round.ducklings.length, ctx.rng);
    this.round.ducklings.forEach((color, i) => {
      const critter = new Critter({ ...CRITTERS.duck, color });
      critter.scale.set(DUCK_SCALE);
      const glow = new Graphics().ellipse(0, -4, 52, 22).fill({ color: 0xfff3a0, alpha: 0.85 });
      glow.visible = false;
      ctx.track(critter);
      this.ducklings.push({ color, critter, glow, state: 'loose', home: spots[i], calmUntil: 0, phase: ctx.rng.range(0, 6) });
      this.world.addChild(glow, critter);
    });
    this.world.addChild(this.mama);
  }

  start() {
    const { want, target, pattern } = this.round;
    switch (this.plan.mode) {
      case 'tap':
        void this.ctx.instruct('parade.tap');
        break;
      case 'walk':
        void this.ctx.instruct('parade.walk');
        break;
      case 'count':
        void this.ctx.instruct('parade.count', { n: target! });
        break;
      case 'color':
        void this.ctx.instruct('parade.color', { color: want! });
        break;
      case 'colorCount':
        void this.ctx.instruct('parade.colorcount', { n: target!, color: want! });
        break;
      case 'pattern':
        void this.ctx.instruct('parade.pattern', { pattern: pattern!.slice(0, (this.plan.unit ?? 2) * 2).join(', ') });
        break;
    }
  }

  /** Spread-out waiting spots on the meadow, clear of the pond and the corner guide. */
  private spots(n: number, rng: Rng) {
    const out: { fx: number; fy: number }[] = [];
    for (let tries = 0; out.length < n && tries < 4000; tries++) {
      const p = { fx: rng.range(0.06, 0.54), fy: rng.range(0.08, 0.92) };
      if (p.fx < 0.2 && p.fy > 0.6) continue;
      const gap = tries < 3000 ? 0.15 : 0.09;
      if (out.every((q) => Math.hypot((q.fx - p.fx) * 1.4, q.fy - p.fy) > gap)) out.push(p);
    }
    return out;
  }

  /** The meadow under the sky, in stage units. */
  private field(v: View) {
    return { x0: 60, x1: v.w - 60, y0: v.h * 0.36, y1: v.h - 40 };
  }

  private spotAt(home: { fx: number; fy: number }) {
    const f = this.field(this.view);
    return { x: f.x0 + (f.x1 - f.x0) * home.fx, y: f.y0 + (f.y1 - f.y0) * home.fy };
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.ground.hitArea = new Rectangle(0, 0, v.w, v.h);
    const f = this.field(v);
    this.pondAt = { x: v.w - 210, y: f.y0 + (f.y1 - f.y0) * 0.55, rx: 165, ry: 95 };
    const p = this.pondAt;
    this.pond
      .clear()
      .ellipse(p.x, p.y, p.rx + 10, p.ry + 8)
      .fill(WATER_EDGE)
      .ellipse(p.x, p.y, p.rx, p.ry)
      .fill(WATER)
      .ellipse(p.x - 60, p.y - 30, 40, 10)
      .fill({ color: 0xffffff, alpha: 0.35 });
    for (const [dx, dy] of [[-150, 60], [140, -60], [120, 70]]) this.pond.circle(p.x + dx, p.y + dy, 20).fill(0x7cc463).stroke({ width: 3, color: 0x4a9a35 });
    for (const d of this.ducklings) if (d.state === 'loose') d.critter.position.copyFrom(this.spotAt(d.home));
    if (!this.placed) {
      this.placed = true;
      this.mama.position.set(f.x0 + 160, f.y0 + (f.y1 - f.y0) * 0.35);
      this.target.x = this.mama.x;
      this.target.y = this.mama.y;
    }
    this.card.position.set(v.w / 2, 60);
    this.drawCard();
  }

  private steer(e: FederatedPointerEvent, down: boolean) {
    if (this.busy || this.finished) return;
    if (down) {
      // The newest finger leads, so a lost pointerup can never leave Mama stuck.
      if (palmOnGlass()) return;
      this.steering = e.pointerId;
    }
    const p = this.ctx.stage.toLocal(e.global);
    const f = this.field(this.view);
    this.aimedAt = this.clock;
    // Mama walks on the meadow; aim a little below the finger so it doesn't hide her.
    this.target.x = Math.max(f.x0, Math.min(f.x1, p.x));
    this.target.y = Math.max(f.y0, Math.min(f.y1, p.y + 30));
  }

  update(dt: number) {
    this.clock += dt;
    this.walk(dt);
    this.follow(dt);
    if (!this.busy && !this.finished) {
      this.meet();
      this.sinceProgress += dt;
      if (this.sinceProgress > 15 && !this.hinting) this.showHint();
      if (this.atPond() && readyForPond(this.plan, this.round, this.line.length)) void this.homecoming();
    }
    this.drawGlows();
  }

  private walk(dt: number) {
    const m = this.mama;
    const dx = this.target.x - m.x;
    const dy = this.target.y - m.y;
    const dist = Math.hypot(dx, dy);
    const speed = this.plan.mode === 'tap' ? 280 : 420;
    if (dist > 2) {
      const step = Math.min(dist, speed * dt);
      m.x += (dx / dist) * step;
      m.y += (dy / dist) * step;
      if (Math.abs(dx) > 4) m.scale.x = MAMA_SCALE * Math.sign(dx);
      m.rotation = 0.1 * Math.sin(this.clock * 14);
      const last = this.trail[0];
      if (!last || Math.hypot(last.x - m.x, last.y - m.y) > 4) {
        this.trail.unshift({ x: m.x, y: m.y });
        if (this.trail.length > 700) this.trail.pop();
      }
    } else {
      m.rotation *= 0.8;
    }
    // Things lower on the meadow are nearer: draw them in front.
    this.world.children.sort((a, b) => a.y - b.y);
  }

  /** The point `d` units back along Mama's trail. */
  private along(d: number) {
    let prev = { x: this.mama.x, y: this.mama.y };
    for (const p of this.trail) {
      const seg = Math.hypot(p.x - prev.x, p.y - prev.y);
      if (seg >= d) return { x: prev.x + ((p.x - prev.x) * d) / seg, y: prev.y + ((p.y - prev.y) * d) / seg };
      d -= seg;
      prev = p;
    }
    return prev;
  }

  private follow(dt: number) {
    const k = Math.min(1, dt * 9);
    this.line.forEach((d, i) => {
      const t = this.along((i + 1) * GAP + 14);
      const c = d.critter;
      const dx = t.x - c.x;
      c.x += dx * k;
      c.y += (t.y - c.y) * k;
      if (Math.abs(dx) > 1) c.scale.x = DUCK_SCALE * Math.sign(dx);
      c.rotation = Math.abs(dx) > 1 ? 0.14 * Math.sin(this.clock * 16 + i) : c.rotation * 0.8;
    });
    for (const d of this.ducklings) {
      if (d.state !== 'loose') continue;
      // Waiting ducklings potter about their spot.
      const s = this.spotAt(d.home);
      d.critter.x = s.x + 10 * Math.sin(this.clock * 0.7 + d.phase);
      d.critter.y = s.y + 4 * Math.sin(this.clock * 1.3 + d.phase);
    }
    this.ducklings.forEach((d, i) => {
      if (d.state !== 'pond') return;
      const slot = this.pondSlot(i);
      d.critter.x += (slot.x - d.critter.x) * k * 0.3;
      d.critter.y = slot.y + 3 * Math.sin(this.clock * 2 + d.phase);
    });
  }

  private pondSlot(i: number) {
    const p = this.pondAt;
    const n = this.ducklings.length;
    const a = (i / n) * Math.PI * 2 + 0.4;
    return { x: p.x + Math.cos(a) * p.rx * 0.6, y: p.y + 20 + Math.sin(a) * p.ry * 0.45 };
  }

  private atPond() {
    const p = this.pondAt;
    return ((this.mama.x - p.x) / (p.rx + 30)) ** 2 + ((this.mama.y - p.y) / (p.ry + 40)) ** 2 < 1;
  }

  /** Mama walks past a waiting duckling: it joins, or says why not. */
  private meet() {
    for (const d of this.ducklings) {
      if (d.state !== 'loose' || this.clock < d.calmUntil) continue;
      if (Math.hypot(d.critter.x - this.mama.x, d.critter.y - this.mama.y) > REACH) continue;
      const result = canJoin(this.plan, this.round, this.line.map((x) => x.color), d.color);
      if (result === 'join') this.join(d);
      else this.refuse(d, result);
    }
  }

  private join(d: Duckling) {
    d.state = 'line';
    // Reaching the duckling the finger picked spends that tap; ones joining on the way don't.
    if (Math.hypot(this.target.x - d.critter.x, this.target.y - d.critter.y) < REACH * 1.2) this.joinedAt = this.clock;
    d.glow.visible = false;
    this.line.push(d);
    this.sinceProgress = 0;
    this.hinting = false;
    d.critter.hop(0.7);
    sfx.animal('quack');
    if (this.plan.mode === 'pattern') void this.ctx.say(`color.${d.color}`);
    this.drawCard();
    const lineDone =
      this.plan.mode === 'pattern'
        ? this.line.length === this.round.pattern!.length
        : this.plan.mode === 'tap' || this.plan.mode === 'walk' || this.plan.mode === 'color'
          ? this.homeCount + this.line.length >= needed(this.plan, this.round)
          : false;
    if (lineDone && !this.announcedHome) {
      this.announcedHome = true;
      if (this.plan.mode === 'tap') {
        // Lap: the parade heads home by itself.
        this.target.x = this.pondAt.x - 40;
        this.target.y = this.pondAt.y;
      }
      void this.ctx.instruct('parade.home');
    }
  }

  private refuse(d: Duckling, why: 'wrong-color' | 'wrong-next') {
    d.critter.poke();
    // Waddling past on the way somewhere else is fine; only stopping on this duckling is a choice.
    // A tap between two ducklings counts for whichever one is nearer the finger.
    const near = (x: Duckling) => Math.hypot(this.target.x - x.critter.x, this.target.y - x.critter.y);
    const line = this.line.map((x) => x.color);
    const aimed =
      this.aimedAt > this.joinedAt &&
      near(d) < REACH * 1.2 &&
      !this.ducklings.some((x) => x !== d && x.state === 'loose' && near(x) < near(d) && canJoin(this.plan, this.round, line, x.color) === 'join');
    if (!aimed) {
      d.calmUntil = this.clock + 0.8;
      sfx.pop(9);
      return;
    }
    d.calmUntil = this.clock + 3.5;
    sfx.boing();
    if (this.clock - this.lastMiss < 3) return;
    this.lastMiss = this.clock;
    this.misses++;
    this.wrongs++;
    const want = why === 'wrong-next' ? nextInPattern(this.round, this.line.length)! : this.round.want!;
    void this.ctx.say(why === 'wrong-next' ? 'parade.next' : 'parade.notme', { color: d.color, want });
    if (this.wrongs >= 2 && !this.hinting) this.showHint();
  }

  private showHint() {
    this.hints++;
    this.wrongs = 0;
    this.hinting = true;
  }

  /** Which ducklings the hint lights up, or the pond when the line is ready to go home. */
  private drawGlows() {
    const pondReady = !this.busy && readyForPond(this.plan, this.round, this.line.length) && (this.announcedHome || this.hinting);
    this.pondGlow.clear();
    if (pondReady) {
      const p = this.pondAt;
      this.pondGlow.ellipse(p.x, p.y, p.rx + 26 + 5 * Math.sin(this.clock * 6), p.ry + 22).fill({ color: 0xfff3a0, alpha: 0.7 });
    }
    for (const d of this.ducklings) {
      const show = this.hinting && d.state === 'loose' && canJoin(this.plan, this.round, this.line.map((x) => x.color), d.color) === 'join';
      d.glow.visible = show;
      if (show) {
        d.glow.position.copyFrom(d.critter.position);
        d.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 7);
      }
    }
  }

  /** The card up top: the color asked for, the pattern so far, or how many to bring. */
  private drawCard() {
    const g = this.cardSlots.clear();
    const { want, target, pattern } = this.round;
    let dots: { color: number; filled: boolean; next?: boolean }[] = [];
    if (pattern) dots = pattern.map((c, i) => ({ color: swatch[c].fill, filled: i < this.line.length, next: i === this.line.length }));
    else if (target !== undefined) dots = Array.from({ length: target }, (_, i) => ({ color: swatch[want ?? 'yellow'].fill, filled: i < this.homeCount }));
    else if (want) dots = [{ color: swatch[want].fill, filled: true }];
    this.card.visible = dots.length > 0;
    if (!dots.length) return;
    const w = dots.length * 54 + 26;
    g.roundRect(-w / 2, -34, w, 68, 26).fill({ color: 0xffffff, alpha: 0.92 }).stroke({ width: 4, color: 0xb9c6d1 });
    dots.forEach((d, i) => {
      const x = -w / 2 + 40 + i * 54;
      // Pattern dots show their color; filled ones are done, the next one is ringed.
      if (pattern) g.circle(x, 0, 18).fill({ color: d.color, alpha: d.filled ? 1 : 0.3 });
      else if (d.filled) g.circle(x, 0, 18).fill(d.color);
      else g.circle(x, 0, 18).stroke({ width: 5, color: d.color });
      if (d.next) g.circle(x, 0, 24).stroke({ width: 4, color: 0x5a4a3c });
    });
  }

  /** At the pond: ducklings swim in one by one; any extras hop back out to the meadow. */
  private async homecoming() {
    this.busy = true;
    this.steering = null;
    const tw = this.ctx.tw;
    const counting = this.round.target !== undefined;
    const { swimIn, extra } = arrive(this.round, this.homeCount, this.line.length);
    const going = this.line.splice(0);
    for (let i = 0; i < going.length; i++) {
      const d = going[i];
      d.state = 'busy';
      const slot = this.pondSlot(this.ducklings.indexOf(d));
      d.critter.rotation = 0;
      await tw.to(d.critter, { x: slot.x, y: slot.y - 40 }, { duration: 0.28, ease: ease.outQuad });
      await tw.to(d.critter, { y: slot.y }, { duration: 0.18, ease: ease.inQuad });
      sfx.splash();
      this.ctx.particles.burst(slot.x, slot.y, { colors: [WATER, 0xffffff], count: 8, speed: [80, 180], gravity: 500, angle: -Math.PI / 2, spread: 1.2, size: [0.25, 0.4] });
      if (i < swimIn) {
        d.state = 'pond';
        this.homeCount++;
        this.drawCard();
        if (counting) await this.ctx.say('count', { n: this.homeCount });
        else await tw.wait(0.15);
      } else {
        d.state = 'pond';
      }
    }
    this.sinceProgress = 0;
    this.trail.length = 0;
    if (extra > 0) {
      this.misses++;
      await this.ctx.say('parade.extra', { count: this.round.target! + extra, n: this.round.target! });
      // The extras hop back out to wait on the meadow again.
      const extras = going.slice(swimIn);
      for (const d of extras) {
        d.state = 'busy';
        const s = this.spotAt(d.home);
        await tw.to(d.critter, { x: s.x, y: s.y }, { duration: 0.5, ease: ease.outBack });
        d.state = 'loose';
        d.calmUntil = this.clock + 2;
      }
    }
    if (this.homeCount >= needed(this.plan, this.round)) {
      void this.finale();
      return;
    }
    if (counting) await this.ctx.say('parade.more', { k: this.homeCount, n: this.round.target! });
    // Step Mama out of the water so she doesn't trigger again straight away.
    this.target.x = this.pondAt.x - this.pondAt.rx - 70;
    this.target.y = this.pondAt.y;
    await tw.wait(0.6);
    this.busy = false;
  }

  private async finale() {
    this.finished = true;
    const p = this.pondAt;
    this.target.x = p.x;
    this.target.y = p.y + 10;
    await this.ctx.tw.wait(0.8);
    this.mama.cheer();
    for (const d of this.ducklings) if (d.state === 'pond') d.critter.cheer();
    sfx.tada();
    this.ctx.particles.burst(p.x, p.y - 60, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.blue.light], count: 26, speed: [150, 380], gravity: 0, life: [0.8, 1.3] });
    await this.ctx.say('parade.done');
    await this.ctx.tw.wait(1);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  destroy() {
    this.ground.removeAllListeners();
  }
}

/** Mama and two ducklings waddling in place on the place map. */
class ParadeIcon extends WigglyIcon {
  private readonly ducks: Critter[] = [];
  private t = 0;

  constructor() {
    const c = new Container();
    super(c);
    const mama = new Critter({ ...CRITTERS.duck, color: 'white' });
    mama.scale.set(0.55);
    mama.x = 50;
    const kids = (['yellow', 'blue'] as ColorName[]).map((color, i) => {
      const d = new Critter({ ...CRITTERS.duck, color });
      d.scale.set(0.26);
      d.x = -30 - i * 62;
      return d;
    });
    this.ducks.push(mama, ...kids);
    c.addChild(...kids.reverse(), mama);
  }

  update(dt: number) {
    super.update(dt);
    this.t += dt;
    this.ducks.forEach((d, i) => {
      d.update(dt);
      d.rotation = 0.1 * Math.sin(this.t * 6 + i);
    });
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const water = new Graphics().ellipse(0, 10, 120, 34).fill(WATER).stroke({ width: 6, color: WATER_EDGE });
  c.addChild(water);
  const mama = new Critter({ ...CRITTERS.duck, color: 'white' });
  mama.alive = false;
  mama.scale.set(0.42);
  mama.position.set(50, 20);
  const colors = rng.shuffle(['yellow', 'blue', 'pink', 'purple'] as ColorName[]).slice(0, 3);
  colors.forEach((color, i) => {
    const d = new Critter({ ...CRITTERS.duck, color });
    d.alive = false;
    d.scale.set(0.2);
    d.position.set(-10 - i * 40, 22);
    c.addChild(d);
  });
  c.addChild(mama);
  return c;
}

export const ducklingParade: GameModule = {
  id: 'duckling-parade',
  name: 'Duckling Parade',
  titleLine: 'game.duckling-parade',
  region: 'barnyard',
  skills: ['motor-planning', 'counting', 'colors', 'patterns'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'Count the ducklings out loud as they line up behind Mama Duck.',
  offScreen: 'Play follow-the-leader around the room, then count everyone in the line.',
  hubIcon: () => new ParadeIcon(),
  sticker,
  create: (ctx) => new DucklingParade(ctx),
};
