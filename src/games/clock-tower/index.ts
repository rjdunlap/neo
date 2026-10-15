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
import { appointmentFor, demoAction, EVENT_WORDS, fiveExample, hourOf, laterExample, makeTasks, minuteChoices, planFor, PLANS, requestFor, spoken, timeOf, type Appointment, type ClockPlan, type ClockTask } from './logic';

const LEVELS: BandLevels = {
  prek: { min: 1, max: 4 },
  school: { min: 2, max: PLANS.length },
};

const R = 200;

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
  readonly request = new Container();
  private readonly requestHeading = label('', 22, ink);
  private readonly requestTime = label('', 38, ink);
  private readonly handKey = new Container();
  private readonly comparison = new Container();
  private readonly oldClock = new Container();
  private readonly newClock = new Container();
  private readonly exampleHand = new Graphics();
  private readonly oldTime = label('', 22, ink);
  private readonly newTime = label('', 22, ink);
  private readonly example = { hour: 0, arc: 0 };
  private readonly minuteArc = new Graphics();
  readonly bell: RoundButton;
  readonly choices: { id: string; node: Container; replay: Container; card: Container }[] = [];
  private readonly appointmentHeading = label("A friend's pretend plan", 28, ink);

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
  private readonly cancelPointer = (e: PointerEvent) => {
    if (this.grab?.id === e.pointerId) this.cancel();
  };

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.tasks = makeTasks(this.plan, ctx.rng);
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.6, clouds: 2, sun: true, seed: 19 }, ctx.view);
    this.drawFace();
    this.ghost.eventMode = 'none';
    this.minuteArc.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.face.addChild(this.minuteArc, this.ghost, this.hourHand, this.minuteHand);
    this.face.addChild(new Graphics().circle(0, 0, 14).fill(ink));
    this.face.eventMode = 'static';
    this.face.hitArea = new Circle(0, 0, R + 30);
    this.face.on('pointerdown', (e: FederatedPointerEvent) => this.down(e));
    this.face.on('globalpointermove', (e: FederatedPointerEvent) => this.move(e));
    this.face.on('pointerup', (e: FederatedPointerEvent) => this.up(e));
    this.face.on('pointerupoutside', (e: FederatedPointerEvent) => this.up(e));
    this.face.on('pointercancel', () => this.cancel());
    // Pixi's pointer event system listens for pointerup, but not native pointercancel.
    window.addEventListener('pointercancel', this.cancelPointer);
    this.request.addChild(new Graphics().roundRect(-125, -60, 250, 120, 22).fill(cream).stroke({ width: 4, color: wood.line }), this.requestHeading, this.requestTime);
    this.requestHeading.y = -34;
    this.requestTime.y = 4;
    const replay = label('Tap to hear again', 18, ink);
    replay.y = 40;
    this.request.addChild(replay);
    this.request.hitArea = new Rectangle(-125, -60, 250, 120);
    this.request.visible = this.plan.mode !== 'read';
    onTap(this.request, () => { if (!this.busy && !this.finished) void this.instruction(); });
    // A length and shape key, so color is never the only cue for choosing a hand.
    const key = new Graphics().moveTo(-90, 0).lineTo(-35, 0).stroke({ width: 10, color: swatch.blue.line, cap: 'round' }).circle(-35, 0, 10).fill(swatch.blue.line);
    key.moveTo(-90, 44).lineTo(0, 44).stroke({ width: 7, color: swatch.red.line, cap: 'round' }).poly([-10, 44, 0, 34, 10, 44, 0, 54]).fill(swatch.red.line);
    this.handKey.addChild(key);
    const short = label('Short: middle', 20, ink); short.position.set(50, 0);
    const long = label('Long: edge', 20, ink); long.position.set(65, 44);
    this.handKey.addChild(short, long);
    this.appointmentHeading.visible = this.plan.mode === 'read';
    this.appointmentHeading.eventMode = 'none';
    this.handKey.visible = this.plan.mode !== 'read';
    this.handKey.eventMode = 'none';
    // Explanations take no input and leave the existing clock, sign and bell untouched.
    this.comparison.eventMode = 'none';
    this.comparison.visible = false;
    this.comparison.addChild(new Graphics().roundRect(-125, -80, 250, 160, 20).fill(cream).stroke({ width: 3, color: wood.line }));
    const before = label('Before', 20, ink); before.position.set(-65, -58);
    const after = label('+1 hour', 20, ink); after.position.set(65, -58);
    this.oldClock.position.set(-65, -2); this.oldClock.alpha = 0.5;
    this.newClock.position.set(65, -2);
    this.newClock.addChild(this.exampleHand);
    this.oldTime.position.set(-65, 55); this.newTime.position.set(65, 55);
    this.comparison.addChild(before, after, this.oldClock, this.newClock, this.oldTime, this.newTime);
    this.bell = new RoundButton(this.bellArt(), swatch.white, 60, () => void this.check());
    this.bell.visible = this.plan.mode !== 'read';
    ctx.stage.addChild(this.backdrop, this.tower, this.face, this.glow, this.bell, this.request, this.handKey, this.appointmentHeading, this.comparison);
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
        const n = label(String(m % 60), 24, ink);
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
    const cx = v.w * (this.plan.mode === 'read' ? 0.30 : 0.42);
    const cy = Math.max(R + 70, v.h * 0.52);
    this.face.position.set(cx, cy);
    // A little tower around the clock.
    this.tower.clear().roundRect(cx - R - 50, cy - R - 60, 2 * R + 100, v.h - (cy - R - 60) + 40, 30).fill(0xe8dcc8).stroke({ width: 6, color: wood.line });
    this.tower.poly([cx - R - 70, cy - R - 56, cx, cy - R - 150, cx + R + 70, cy - R - 56]).fill(swatch.red.fill).stroke({ width: 6, color: swatch.red.line, join: 'round' });
    this.bell.position.set(cx + R + 150, cy);
    this.request.position.set(cx + R + 185, cy - 170);
    this.handKey.position.set(cx + R + 150, cy + 120);
    this.comparison.position.set(cx + R + 185, Math.min(cy + 265, v.h - 90));
    this.appointmentHeading.position.set(v.w - 250, cy - 285);
    this.choices.forEach((c, i) => c.card.position.set(v.w - 250, cy - 170 + i * 170));
  }

  update(dt: number) {
    this.clock += dt;
    this.drawHands();
    if (this.comparison.visible) {
      const a = this.example.hour / 60 * Math.PI * 2;
      this.exampleHand.clear().moveTo(0, 0).lineTo(Math.sin(a) * 22, -Math.cos(a) * 22).stroke({ width: 5, color: swatch.blue.line, cap: 'round' });
    }
    const arc = this.minuteArc.clear();
    if (this.hinted && this.plan.mode === 'five' && this.example.arc > 0) {
      const end = this.example.arc / 60 * Math.PI * 2;
      arc.arc(0, 0, R + 13, -Math.PI / 2, end - Math.PI / 2).stroke({ width: 7, color: swatch.yellow.line, cap: 'round' });
      arc.circle(Math.sin(end) * (R + 13), -Math.cos(end) * (R + 13), 9).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
    }
    const g = this.glow.clear();
    if (this.hinted && this.plan.mode === 'read' && !this.busy) {
      const right = this.choices.find((c) => this.isRight(c.id));
      if (right) g.roundRect(right.card.x - 224, right.card.y - 79, 448, 158, 26).stroke({ width: 6 + 2 * Math.sin(this.clock * 6), color: swatch.yellow.fill });
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
    window.removeEventListener('pointercancel', this.cancelPointer);
    this.cancel();
  }

  private drawHands() {
    // The short hand sits between numbers as the minutes pass, like a real clock's gears.
    const hourAngle = this.grab?.hand === 'hour' && this.freeAngle !== null ? this.freeAngle : (((this.hour % 12) + this.minute / 60) / 12) * Math.PI * 2;
    const minuteAngle = this.grab?.hand === 'minute' && this.freeAngle !== null ? this.freeAngle : (this.minute / 60) * Math.PI * 2;
    const hand = (g: Graphics, angle: number, len: number, width: number, color: number, lifted: boolean) => {
      g.clear().moveTo(0, 0).lineTo(Math.sin(angle) * len, -Math.cos(angle) * len).stroke({ width: lifted ? width + 6 : width, color, cap: 'round' });
      const x = Math.sin(angle) * len, y = -Math.cos(angle) * len;
      if (g === this.minuteHand) g.poly([x - 12, y, x, y - 12, x + 12, y, x, y + 12]).fill(color);
      else g.circle(x, y, width * 0.9).fill(color);
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
    this.comparison.visible = false;
    this.example.arc = 0;
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
    const request = requestFor(this.plan.mode, t);
    this.requestHeading.text = request.heading;
    this.requestTime.text = request.time;
    await this.instruction();
    if (this.index === 0 && this.plan.mode !== 'read') await this.ctx.say(this.plan.mode === 'hour' ? 'clock.control.hour' : 'clock.controls');
    if (this.index === 0 && this.plan.mode === 'five') await this.ctx.say('clock.five.zero');
  }

  private instruction() {
    const t = this.task;
    if (this.plan.mode === 'read') return this.ctx.instruct('clock.read');
    if (this.plan.mode === 'later') return this.ctx.instruct('clock.later', { time: spoken(t.from!) });
    return this.ctx.instruct(this.plan.mode === 'hour' ? 'clock.hour' : 'clock.set', { time: spoken(t.time) });
  }

  private buildChoices(appointments: Appointment[]) {
    for (const c of this.choices.splice(0)) c.card.destroy({ children: true });
    for (const appointment of appointments) {
      const { id, time } = appointment;
      const evidence = appointmentFor(appointment);
      const card = new Container();
      const background = new Graphics().roundRect(-220, -75, 440, 150, 22).fill(cream).stroke({ width: 4, color: wood.line });
      background.moveTo(-40, -70).lineTo(-40, 70).stroke({ width: 3, color: wood.line });
      background.eventMode = 'none';
      const node = new Container();
      node.x = -130;
      const art = eventArt(id);
      art.scale.set(1.1);
      art.y = -14;
      const name = label(evidence.event, 22, ink); name.y = 53;
      node.addChild(art, name);
      node.hitArea = new Rectangle(-90, -75, 180, 150);
      onTap(node, () => void this.pick(id), { cooldown: 300 });
      const replay = new Container();
      replay.x = 90;
      const clock = miniClock(hourOf(time), time % 60, 36); clock.x = -75;
      const timeLabel = label(evidence.time, 32, ink); timeLabel.position.set(44, -18);
      const hear = label('Tap to hear', 19, ink); hear.position.set(44, 24);
      replay.addChild(clock, timeLabel, hear);
      replay.hitArea = new Rectangle(-130, -75, 260, 150);
      onTap(replay, () => {
        if (this.busy || this.finished) return;
        sfx.tick();
        replay.alpha = 0.65;
        void this.ctx.tw.to(replay, { alpha: 1 }, { duration: 0.2 });
        void this.ctx.say('clock.appointment', { event: evidence.event, time: evidence.speech });
      });
      card.addChild(background, node, replay);
      this.choices.push({ id, node, replay, card });
      this.ctx.stage.addChild(card);
    }
    this.resize(this.view);
  }

  private isRight(id: string) {
    return this.task.options!.some((appointment) => appointment.id === id && appointment.time === this.task.time);
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
    if (this.plan.mode === 'later') await this.explainLater(vars.now);
    else if (!(this.plan.mode === 'five' && this.wrongs === 2)) await this.ctx.say(line, vars);
    if (this.wrongs >= 2 && !this.hinted) {
      this.hinted = true;
      this.hints++;
      if (this.plan.mode === 'five') {
        const example = fiveExample(this.task);
        await Promise.all([
          this.ctx.tw.to(this.example, { arc: this.task.time % 60 }, { duration: 0.8, ease: ease.linear }),
          this.ctx.say('clock.five.help', { counts: example.counts, time: example.time }),
        ]);
      } else void this.ctx.say(this.plan.mode === 'read' ? 'clock.hint.read' : 'clock.hint');
    }
    this.busy = false;
  }

  private async explainLater(now?: string) {
    const e = laterExample(this.task);
    for (const node of this.oldClock.removeChildren()) node.destroy({ children: true });
    // Keep the animated hand alive when replacing the small static clock.
    this.exampleHand.removeFromParent();
    for (const node of this.newClock.removeChildren()) node.destroy({ children: true });
    this.oldClock.addChild(miniClock(hourOf(this.task.from!), e.minute, 42));
    // A separate dial avoids changing the icon/sticker's stable drawing helper.
    const face = new Graphics().circle(0, 0, 50).fill(wood.line).circle(0, 0, 42).fill(cream);
    for (let h = 0; h < 12; h++) {
      const a = h / 12 * Math.PI * 2;
      face.circle(Math.sin(a) * 34, -Math.cos(a) * 34, 2).fill(ink);
    }
    const ma = e.minute / 60 * Math.PI * 2;
    face.moveTo(0, 0).lineTo(Math.sin(ma) * 34, -Math.cos(ma) * 34).stroke({ width: 3, color: swatch.red.line, cap: 'round' });
    this.newClock.addChild(face, this.exampleHand, new Graphics().circle(0, 0, 3).fill(ink));
    this.oldTime.text = e.from; this.newTime.text = e.to;
    this.example.hour = e.hourStart;
    this.comparison.visible = true;
    await Promise.all([
      this.ctx.tw.to(this.example, { hour: e.hourEnd }, { duration: 0.8, ease: ease.inOutSine }),
      this.ctx.say(now ? 'clock.later.wrong' : 'clock.later.example', { now: now ?? '', from: e.fromSpeech, time: e.toSpeech }),
    ]);
  }

  private async right(event?: string) {
    this.busy = true;
    this.hinted = false;
    const t = this.task.time;
    if (this.plan.mode === 'later') await this.explainLater();
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
    else if (this.plan.mode !== 'later') await this.ctx.say('clock.yay');
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
