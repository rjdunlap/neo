import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { demoAction, EVENTS, hourOf, makeTasks, minuteChoices, planFor, spoken, timeOf, type ClockPlan, type ClockTask } from './logic';

const LEVELS: BandLevels = {
  prek: { min: 1, max: 4 },
  school: { min: 2, max: 7 },
};

const R = 200;
const EVENT_WORDS: Record<string, string> = { breakfast: 'breakfast', school: 'school', lunch: 'lunch', park: 'the park', bath: 'a bath', bed: 'bed' };

/** Little pictures of the day, for reading the clock. */
function eventArt(id: string): Graphics {
  const g = new Graphics();
  if (id === 'breakfast') {
    g.moveTo(-36, -4).quadraticCurveTo(0, 44, 36, -4).closePath().fill(swatch.blue.fill).stroke({ width: 4, color: swatch.blue.line });
    g.ellipse(0, -6, 34, 8).fill(swatch.yellow.light);
    g.moveTo(20, -10).lineTo(40, -36).stroke({ width: 6, color: swatch.white.line, cap: 'round' });
  } else if (id === 'school') {
    g.rect(-34, -10, 68, 44).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line });
    g.poly([-42, -10, 0, -40, 42, -10]).fill(swatch.red.line);
    g.rect(-8, 12, 16, 22).fill(wood.fill).circle(0, -18, 7).fill(0xffffff).stroke({ width: 2, color: ink });
  } else if (id === 'lunch') {
    g.poly([-38, 20, 0, -30, 38, 20]).fill(swatch.yellow.light).stroke({ width: 4, color: wood.line, join: 'round' });
    g.moveTo(-28, 8).lineTo(28, 8).stroke({ width: 6, color: swatch.green.fill }).moveTo(-22, 0).lineTo(22, 0).stroke({ width: 5, color: swatch.red.fill });
  } else if (id === 'park') {
    g.moveTo(-30, 34).lineTo(-30, -26).lineTo(30, 34).stroke({ width: 6, color: swatch.orange.line, cap: 'round', join: 'round' });
    g.moveTo(-30, -26).lineTo(-12, -26).lineTo(-12, 34).stroke({ width: 5, color: swatch.orange.fill });
    g.circle(26, -16, 12).fill(swatch.pink.fill).stroke({ width: 3, color: swatch.pink.line });
  } else if (id === 'bath') {
    g.roundRect(-40, -4, 80, 34, 14).fill(0xffffff).stroke({ width: 4, color: swatch.blue.line });
    for (const [x, y, r] of [[-20, -10, 10], [0, -18, 12], [20, -8, 9], [12, -30, 6]]) g.circle(x, y, r).fill({ color: swatch.blue.light, alpha: 0.9 }).stroke({ width: 2, color: swatch.blue.fill });
  } else {
    g.roundRect(-40, 4, 80, 24, 8).fill(swatch.purple.fill).stroke({ width: 4, color: swatch.purple.line });
    g.roundRect(-40, -8, 26, 16, 6).fill(0xffffff);
    g.circle(22, -26, 14).fill(swatch.yellow.fill).circle(28, -30, 12).fill(swatch.purple.light);
  }
  return g;
}

class ClockTower implements Game {
  readonly plan: ClockPlan;
  readonly tasks: ClockTask[];
  /** The hands the child has set: an hour 1–12 and a minute from the level's choices. */
  hour = 12;
  minute = 0;
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  readonly face = new Container();
  readonly bell: RoundButton;
  readonly choices: { id: string; node: Container }[] = [];

  private readonly backdrop: Backdrop;
  private readonly tower = new Graphics();
  private readonly hourHand = new Graphics();
  private readonly minuteHand = new Graphics();
  private readonly ghost = new Graphics();
  private readonly glow = new Graphics();
  private view: View;
  private wrongs = 0;
  private hinted = false;
  /** The hand being turned, and the finger turning it. */
  private grab: { hand: 'hour' | 'minute'; id: number } | null = null;
  /** While turning, the hand follows the finger freely; it snaps on release. */
  private freeAngle: number | null = null;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.tasks = makeTasks(this.plan, ctx.rng);
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.6, clouds: 2, sun: true, seed: 19 }, ctx.view);
    this.drawFace();
    this.ghost.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.face.addChild(this.ghost, this.hourHand, this.minuteHand);
    this.face.addChild(new Graphics().circle(0, 0, 14).fill(ink));
    this.face.eventMode = 'static';
    this.face.hitArea = new Circle(0, 0, R + 30);
    this.face.on('pointerdown', (e: FederatedPointerEvent) => this.down(e));
    this.face.on('globalpointermove', (e: FederatedPointerEvent) => this.move(e));
    this.face.on('pointerup', (e: FederatedPointerEvent) => this.up(e));
    this.face.on('pointerupoutside', (e: FederatedPointerEvent) => this.up(e));
    this.face.on('pointercancel', () => this.cancel());
    this.bell = new RoundButton(this.bellArt(), swatch.white, 60, () => void this.check());
    this.bell.visible = this.plan.mode !== 'read';
    ctx.stage.addChild(this.backdrop, this.tower, this.face, this.glow, this.bell);
  }

  private bellArt() {
    const g = new Graphics();
    g.poly([-26, 14, -20, -14, 0, -26, 20, -14, 26, 14]).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line, join: 'round' });
    g.roundRect(-32, 12, 64, 10, 5).fill(swatch.yellow.line).circle(0, 28, 7).fill(swatch.yellow.line);
    return g;
  }

  private drawFace() {
    const g = new Graphics().circle(0, 0, R + 18).fill(wood.line).circle(0, 0, R + 8).fill(wood.fill).circle(0, 0, R).fill(cream);
    for (let m = 0; m < 60; m++) {
      const a = (m / 60) * Math.PI * 2;
      const inner = m % 5 ? R - 12 : R - 24;
      g.moveTo(Math.sin(a) * inner, -Math.cos(a) * inner).lineTo(Math.sin(a) * (R - 4), -Math.cos(a) * (R - 4)).stroke({ width: m % 5 ? 2 : 5, color: ink, alpha: m % 5 ? 0.4 : 0.8 });
    }
    this.face.addChild(g);
    if (this.plan.mode === 'five') {
      // Counting by fives: small helper numbers just outside the rim.
      for (let m = 5; m <= 60; m += 5) {
        const a = (m / 60) * Math.PI * 2;
        const n = label(String(m), 24, ink);
        n.alpha = 0.6;
        n.position.set(Math.sin(a) * (R + 40), -Math.cos(a) * (R + 40));
        this.face.addChild(n);
      }
    }
    for (let h = 1; h <= 12; h++) {
      const a = (h / 12) * Math.PI * 2;
      const n = label(String(h), 38, ink);
      n.position.set(Math.sin(a) * (R - 56), -Math.cos(a) * (R - 56));
      this.face.addChild(n);
    }
  }

  get task() {
    return this.tasks[this.index];
  }

  get shown() {
    return timeOf(this.hour, this.minute);
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const cx = v.w * 0.42;
    const cy = Math.max(R + 70, v.h * 0.52);
    this.face.position.set(cx, cy);
    // A little tower around the clock.
    this.tower.clear().roundRect(cx - R - 50, cy - R - 60, 2 * R + 100, v.h - (cy - R - 60) + 40, 30).fill(0xe8dcc8).stroke({ width: 6, color: wood.line });
    this.tower.poly([cx - R - 70, cy - R - 56, cx, cy - R - 150, cx + R + 70, cy - R - 56]).fill(swatch.red.fill).stroke({ width: 6, color: swatch.red.line, join: 'round' });
    this.bell.position.set(cx + R + 150, cy);
    this.choices.forEach((c, i) => c.node.position.set(cx + R + 170, cy - 160 + i * 160));
  }

  update(dt: number) {
    this.clock += dt;
    this.drawHands();
    const g = this.glow.clear();
    if (this.hinted && this.plan.mode === 'read' && !this.busy) {
      const right = this.choices.find((c) => this.isRight(c.id));
      if (right) g.roundRect(right.node.x - 78, right.node.y - 72, 156, 144, 26).stroke({ width: 6 + 2 * Math.sin(this.clock * 6), color: swatch.yellow.fill });
    }
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.grab || !this.task) return null;
    const action = demoAction(this.plan.mode, this.hour, this.minute, this.task);
    if (action.kind === 'pick') {
      const choice = this.choices.find((c) => c.id === action.id);
      return choice ? { tap: { on: choice.node }, pause: 0.12 } : null;
    }
    if (action.kind === 'check') return { tap: { on: this.bell }, pause: 0.12 };
    const radius = action.kind === 'minute' ? R * 0.82 : R * 0.5;
    const fromTurns = action.kind === 'minute' ? this.minute / 60 : ((this.hour % 12) + this.minute / 60) / 12;
    const toTurns = action.kind === 'minute' ? action.minute / 60 : ((action.hour % 12) + this.minute / 60) / 12;
    const spot = (turns: number) => ({ on: this.face, x: Math.sin(turns * Math.PI * 2) * radius, y: -Math.cos(turns * Math.PI * 2) * radius });
    return { trace: spot(fromTurns), via: [spot(toTurns)], pause: 0.12 };
  }

  destroy() {
    this.grab = null;
  }

  private drawHands() {
    // The short hand sits between numbers as the minutes pass, like a real clock's gears.
    const hourAngle = this.grab?.hand === 'hour' && this.freeAngle !== null ? this.freeAngle : (((this.hour % 12) + this.minute / 60) / 12) * Math.PI * 2;
    const minuteAngle = this.grab?.hand === 'minute' && this.freeAngle !== null ? this.freeAngle : (this.minute / 60) * Math.PI * 2;
    const hand = (g: Graphics, angle: number, len: number, width: number, color: number, lifted: boolean) => {
      g.clear().moveTo(0, 0).lineTo(Math.sin(angle) * len, -Math.cos(angle) * len).stroke({ width: lifted ? width + 6 : width, color, cap: 'round' });
      g.circle(Math.sin(angle) * len, -Math.cos(angle) * len, width * 0.9).fill(color);
    };
    hand(this.hourHand, hourAngle, R * 0.52, 18, swatch.blue.line, this.grab?.hand === 'hour');
    hand(this.minuteHand, minuteAngle, R * 0.82, 11, swatch.red.line, this.grab?.hand === 'minute');
    const ghost = this.ghost.clear();
    if (this.hinted && this.plan.mode !== 'read' && this.task) {
      const t = this.task.time;
      const ha = ((hourOf(t) % 12) + (t % 60) / 60) / 12 * Math.PI * 2;
      const ma = ((t % 60) / 60) * Math.PI * 2;
      ghost.moveTo(0, 0).lineTo(Math.sin(ha) * R * 0.52, -Math.cos(ha) * R * 0.52).stroke({ width: 18, color: swatch.yellow.fill, alpha: 0.55, cap: 'round' });
      ghost.moveTo(0, 0).lineTo(Math.sin(ma) * R * 0.82, -Math.cos(ma) * R * 0.82).stroke({ width: 11, color: swatch.yellow.fill, alpha: 0.55, cap: 'round' });
    }
  }

  private canTurn(hand: 'hour' | 'minute') {
    if (this.plan.mode === 'read') return false;
    return hand === 'hour' || this.plan.mode !== 'hour';
  }

  /** Touch the face: the outer ring takes the long hand, the middle the short one. */
  private down(e: FederatedPointerEvent) {
    if (this.busy || this.finished || this.grab || palmOnGlass()) return;
    const p = this.face.toLocal(e.global);
    const r = Math.hypot(p.x, p.y);
    const hand = r > R * 0.6 && this.canTurn('minute') ? 'minute' : 'hour';
    if (!this.canTurn(hand)) return;
    this.grab = { hand, id: e.pointerId };
    this.freeAngle = Math.atan2(p.x, -p.y);
    sfx.tick();
  }

  private move(e: FederatedPointerEvent) {
    if (!this.grab || e.pointerId !== this.grab.id) return;
    const p = this.face.toLocal(e.global);
    if (!Number.isFinite(p.x)) return;
    this.freeAngle = Math.atan2(p.x, -p.y);
  }

  private up(e: FederatedPointerEvent) {
    if (!this.grab || e.pointerId !== this.grab.id) return;
    const turns = (((this.freeAngle ?? 0) / (Math.PI * 2)) % 1 + 1) % 1;
    if (this.grab.hand === 'minute') {
      // Snap the long hand to the nearest mark this level uses.
      const choices = minuteChoices(this.plan.mode);
      const m = turns * 60;
      this.minute = choices.reduce((best, c) => (Math.min(Math.abs(c - m), 60 - Math.abs(c - m)) < Math.min(Math.abs(best - m), 60 - Math.abs(best - m)) ? c : best), choices[0]);
    } else {
      // The short hand's number is where it points, allowing for how far past the hour it sits.
      this.hour = Math.round(turns * 12 - this.minute / 60 + 12) % 12 || 12;
    }
    this.cancel();
    sfx.clunk();
  }

  private cancel() {
    this.grab = null;
    this.freeAngle = null;
  }

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hinted = false;
    if (this.index >= this.tasks.length) return void this.finale();
    const t = this.task;
    if (this.plan.mode === 'read') {
      this.hour = hourOf(t.time);
      this.minute = t.time % 60;
      this.buildChoices(t.options!);
    } else if (this.plan.mode === 'later') {
      this.hour = hourOf(t.from!);
      this.minute = t.from! % 60;
    } else {
      // Start somewhere else, with the long hand at 12.
      this.hour = ((hourOf(t.time) + 4) % 12) || 12;
      this.minute = 0;
    }
    this.busy = false;
    if (this.plan.mode === 'read') return this.ctx.instruct('clock.read');
    if (this.plan.mode === 'later') return this.ctx.instruct('clock.later', { time: spoken(t.from!) });
    return this.ctx.instruct(this.plan.mode === 'hour' ? 'clock.hour' : 'clock.set', { time: spoken(t.time) });
  }

  private buildChoices(ids: string[]) {
    for (const c of this.choices.splice(0)) c.node.destroy({ children: true });
    for (const id of ids) {
      const node = new Container();
      node.addChild(new Graphics().roundRect(-70, -64, 140, 128, 22).fill(0xffffff).stroke({ width: 5, color: wood.line }));
      const art = eventArt(id);
      art.scale.set(1.3);
      node.addChild(art);
      node.hitArea = new Rectangle(-74, -68, 148, 136);
      onTap(node, () => void this.pick(id), { cooldown: 300 });
      this.choices.push({ id, node });
      this.ctx.stage.addChild(node);
    }
    this.resize(this.view);
  }

  private isRight(id: string) {
    const e = EVENTS.find((x) => x.id === id)!;
    return timeOf(e.hour, e.minute) === this.task.time;
  }

  private async pick(id: string) {
    if (this.busy || this.finished) return;
    if (this.isRight(id)) return void this.right(id);
    await this.wrong('clock.read.wrong', {});
  }

  private async check() {
    if (this.busy || this.finished) return;
    if (this.shown === this.task.time) return void this.right();
    if (this.plan.mode === 'later') return void this.wrong('clock.later.wrong', { now: spoken(this.shown), from: spoken(this.task.from!) });
    await this.wrong('clock.shows', { now: spoken(this.shown), time: spoken(this.task.time) });
  }

  private async wrong(line: 'clock.read.wrong' | 'clock.later.wrong' | 'clock.shows', vars: Record<string, string>) {
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    await this.ctx.say(line, vars);
    if (this.wrongs >= 2 && !this.hinted) {
      this.hinted = true;
      this.hints++;
      void this.ctx.say(this.plan.mode === 'read' ? 'clock.hint.read' : 'clock.hint');
    }
    this.busy = false;
  }

  private async right(event?: string) {
    this.busy = true;
    this.hinted = false;
    const t = this.task.time;
    // The tower chimes: one dong per hour on the hour, a little tune otherwise.
    if (t % 60 === 0) {
      for (let i = 0; i < hourOf(t); i++) {
        sfx.bell(2, 0.35);
        await this.ctx.tw.wait(0.22);
      }
    } else for (const step of [4, 7, 9]) {
      sfx.bell(step, 0.3);
      await this.ctx.tw.wait(0.18);
    }
    this.ctx.particles.burst(this.face.x, this.face.y - R, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.yellow.fill], count: 18, speed: [120, 320], gravity: 0, life: [0.5, 0.9] });
    this.ctx.pet.cheer();
    if (event) await this.ctx.say('clock.itis', { time: spoken(t), event: EVENT_WORDS[event] });
    else await this.ctx.say('clock.yay');
    await this.ctx.tw.to(this.face.scale, { x: 1.04, y: 1.04 }, { duration: 0.12, ease: ease.outQuad });
    await this.ctx.tw.to(this.face.scale, { x: 1, y: 1 }, { duration: 0.15 });
    await this.next();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('clock.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

/** A small clock face for the hub icon and sticker. */
function miniClock(hour: number, minute: number, r: number): Graphics {
  const g = new Graphics().circle(0, 0, r + 8).fill(wood.line).circle(0, 0, r).fill(cream);
  for (let h = 0; h < 12; h++) {
    const a = (h / 12) * Math.PI * 2;
    g.circle(Math.sin(a) * r * 0.82, -Math.cos(a) * r * 0.82, r * 0.05).fill(ink);
  }
  const ha = (((hour % 12) + minute / 60) / 12) * Math.PI * 2;
  const ma = (minute / 60) * Math.PI * 2;
  g.moveTo(0, 0).lineTo(Math.sin(ha) * r * 0.5, -Math.cos(ha) * r * 0.5).stroke({ width: r * 0.1, color: swatch.blue.line, cap: 'round' });
  g.moveTo(0, 0).lineTo(Math.sin(ma) * r * 0.8, -Math.cos(ma) * r * 0.8).stroke({ width: r * 0.06, color: swatch.red.line, cap: 'round' });
  return g.circle(0, 0, r * 0.07).fill(ink);
}

class ClockIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    c.addChild(new Graphics().roundRect(-80, -180, 160, 180, 20).fill(0xe8dcc8).stroke({ width: 5, color: wood.line }).poly([-96, -176, 0, -240, 96, -176]).fill(swatch.red.fill).stroke({ width: 5, color: swatch.red.line, join: 'round' }));
    const face = miniClock(3, 0, 58);
    face.y = -100;
    c.addChild(face);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(miniClock(rng.int(1, 12), rng.pick([0, 30]), 90));
  return c;
}

export const clockTower: GameModule = {
  id: 'clock-tower',
  name: 'Clock Tower',
  titleLine: 'game.clock-tower',
  region: 'cozy-village',
  skills: ['telling-time', 'daily-routines', 'number-sense'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'Look at a real clock together at mealtimes: "The short hand is on 12. Lunch time!"',
  offScreen: 'Make a paper-plate clock with a split pin and set it for bedtime, bath time and breakfast.',
  hubIcon: () => new ClockIcon(),
  sticker,
  touchDemo: true,
  create: (ctx) => new ClockTower(ctx),
};
