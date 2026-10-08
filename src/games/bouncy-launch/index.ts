import { Circle, Container, Graphics, type FederatedPointerEvent } from 'pixi.js';
import { Critter } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { puffs, starPoints } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { idle, type CouchControls } from '../../engine/controller';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { CLOUDS } from './course';
import { judge, MAX_PULL, MIN_PULL, nextAsk, padAt, PADS, planFor, pullFor, reach, targets, type LaunchPlan } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 3 },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 5 },
  school: { min: 4, max: 5 },
};

const PET_SCALE = 0.5;
/** Couch play: how far the spring squashes straight down at full power, in logical units. */
const SQUASH = 90;
const SPRING = { fill: 0xc9d3dc, line: 0x8c9aa8 };

/** A soft landing cloud resting on the grass. */
function padArt(w: number): Graphics {
  const r = w / 4;
  return puffs(new Graphics(), [[-r * 1.4, 0, r], [-r * 0.5, -r * 0.5, r * 1.2], [r * 0.5, -r * 0.4, r * 1.15], [r * 1.4, 0, r]], 0xffffff, 0xbfe0f4, 6);
}

function starArt(r: number): Graphics {
  return new Graphics().poly(starPoints(r, r * 0.45, 5)).fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.yellow.line, join: 'round' });
}

class BouncyLaunch implements Game {
  readonly plan: LaunchPlan;
  readonly targets: number[];
  readonly pet: Critter;
  readonly pads: Container[] = [];
  shot = 0;
  misses = 0;
  hints = 0;
  /** How far every launch landed from the middle of its cloud, as a fraction of the strip, added up. */
  off = 0;
  /** Where the last landing was (0..1 along the strip), for compare levels. */
  last: number | undefined;
  ask: 'farther' | 'nearer' | undefined;
  flying = false;
  finished = false;
  hinting = false;

  private readonly backdrop: Backdrop;
  private readonly spring = new Graphics();
  private readonly preview = new Graphics();
  /** The pet itself launches, so the fixed spring base is the safe instruction-replay target. */
  private readonly replay = new Container();
  private readonly star = starArt(30);
  private readonly flag = new Graphics();
  /** The finger pulling the spring, and where it first touched. */
  private grab: { id: number; from: { x: number; y: number } } | null = null;
  private readonly release = (e: PointerEvent) => {
    if (!this.grab || e.pointerId !== this.grab.id) return;
    this.grab = null;
    if (!this.letGo()) void this.ctx.tw.to(this.pet, { x: this.seat.x, y: this.seat.y }, { duration: 0.3, ease: ease.outBack }).then(() => this.drawSpring());
  };
  private wrongs = 0;
  private clock = 0;
  private seat = { x: 0, y: 0 };
  private flight: { pts: { x: number; y: number }[]; t: number; duration: number; done: () => void } | null = null;
  private strip = { x0: 0, x1: 0, y: 0 };
  private controllerPower = 0.5;
  /** Driven by a stick or keys (couch play) instead of a finger: the spring squashes straight down by the power. */
  private stick = false;
  private botWait = 1;
  /** Couch challenge: a fixed run of small clouds, scored by launches. Null in ordinary play. */
  private readonly course: { padWidth: number } | null;
  /** Launches taken at each cloud finished so far. */
  private done: number[] = [];
  /** Launches at the cloud in play, carried across a reload so leaving cannot erase them. */
  private tries = 0;
  private assisted = false;
  private told = false;
  private instruction: { id: LineId; vars?: LineVars } | null = null;

  /** The "watch me" demo: hold toward the next cloud's power, then press the launch button. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    this.botWait -= dt;
    const target = this.targets[this.shot];
    if (this.flying || this.finished || this.grab || this.botWait > 0 || target === undefined) return out;
    const gap = padAt(target) - this.controllerPower;
    out.players[0].active = true;
    if (Math.abs(gap) > 0.015) out.players[0].x = Math.max(-1, Math.min(1, gap / (Math.max(dt, 1e-3) * 0.5)));
    else {
      out.players[0].action = true;
      this.botWait = 1.4;
    }
    return out;
  }

  control(input: CouchControls, dt: number) {
    if (this.flying || this.finished || this.grab) return;
    const p = input.players.find(p => p.x || p.y || p.action);
    if (!p) return;
    // Down (or right) squashes the spring for more power; up (or left) lets it back up.
    const push = Math.max(-1, Math.min(1, p.x + p.y));
    this.stick = true;
    this.controllerPower = Math.max(0, Math.min(1, this.controllerPower + push * dt * 0.5));
    this.squash();
    if (p.action) this.fire();
  }

  /** The spring squashed straight down by the current power, the pet riding on top of it. */
  private squash() {
    this.pet.position.set(this.seat.x, this.seat.y + this.controllerPower * SQUASH);
    this.drawPreview();
    this.drawSpring();
  }

  /** Let the squashed spring go. The power is already the landing spot, so no pull has to be measured. */
  private fire() {
    if (this.flying || this.finished) return;
    this.preview.clear();
    void this.launch(this.controllerPower);
  }

  /** Where the pet sits on the spring between launches. */
  private restingY() {
    return this.seat.y + (this.stick ? this.controllerPower * SQUASH : 0);
  }

  constructor(private readonly ctx: GameContext) {
    const run = ctx.couch?.course;
    if (run?.id === 'clouds') {
      // A star over each cloud, as in the "land on the cloud with the star" level, but on the course's own clouds.
      this.plan = planFor(3);
      this.targets = [...CLOUDS.targets];
      this.course = { padWidth: CLOUDS.padWidth };
      this.shot = run.resume.board;
      this.done = run.resume.done.slice();
      this.tries = run.resume.attempts;
      this.assisted = run.resume.assisted;
    } else {
      this.plan = planFor(ctx.level);
      this.targets = targets(this.plan, ctx.rng);
      this.course = null;
    }
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.78, clouds: 4, sun: true, seed: 88 }, ctx.view);
    ctx.stage.addChild(this.backdrop, this.flag);
    const padW = this.course?.padWidth ?? 0.85;
    for (let i = 0; i < PADS; i++) {
      const pad = new Container();
      pad.addChild(padArt(120 * padW));
      if (this.plan.mode === 'number') {
        const n = label(String(i + 1), 46, ink);
        n.anchor.set(0.5);
        n.y = -22;
        pad.addChild(n);
      }
      this.pads.push(pad);
      ctx.stage.addChild(pad);
    }
    this.star.visible = this.plan.mode === 'star';
    this.stick = !!ctx.couch;
    // The pet is the one flying, so the corner guide steps out (as in Splish Splash).
    ctx.pet.visible = false;
    this.pet = new Critter(ctx.petSpec);
    this.pet.scale.set(PET_SCALE);
    this.pet.hitArea = new Circle(0, -125, 190);
    this.replay.hitArea = new Circle(0, 0, 68);
    onTap(this.replay, () => this.repeatInstruction(), { cooldown: 500 });
    ctx.track(this.pet);
    ctx.stage.addChild(this.star, this.spring, this.preview, this.replay, this.pet);
    if (this.plan.mode === 'tap') {
      onTap(this.pet, () => void this.launch(this.ctx.rng.range(0.15, 0.95)), { cooldown: 500 });
    } else {
      // A slingshot pull, not a drag-and-drop: the pet moves by however far the finger moves,
      // wherever on the pet it was grabbed (drag.ts would snap the pet onto the fingertip).
      this.pet.eventMode = 'static';
      this.pet.on('pointerdown', (e: FederatedPointerEvent) => {
        if (this.flying || this.finished || this.grab || palmOnGlass()) return;
        this.grab = { id: e.pointerId, from: this.ctx.stage.toLocal(e.global) };
        sfx.squeak(6);
      });
      this.pet.on('globalpointermove', (e: FederatedPointerEvent) => {
        if (!this.grab || e.pointerId !== this.grab.id) return;
        const p = this.ctx.stage.toLocal(e.global);
        this.pull(this.seat.x + p.x - this.grab.from.x, this.seat.y + p.y - this.grab.from.y);
      });
      window.addEventListener('pointerup', this.release);
      window.addEventListener('pointercancel', this.release);
    }
  }

  start() {
    // A challenge run left after its last cloud was landed on has nothing more to play: settle it.
    if (this.course && this.shot >= this.targets.length) return void this.finale();
    void this.askShot();
  }

  resize(v: View) {
    this.backdrop.resize(v);
    const ground = this.backdrop.groundY + 30;
    this.seat = { x: 210, y: ground - 150 };
    this.strip = { x0: 380, x1: v.w - 80, y: ground + 10 };
    this.replay.position.set(this.seat.x, this.strip.y - 8);
    this.pads.forEach((pad, i) => pad.position.set(this.landX(padAt(i)), this.strip.y));
    if (!this.flying && !this.grab) this.pet.position.set(this.seat.x, this.restingY());
    if (this.stick && !this.flying) this.squash();
    else this.drawSpring();
    this.placeStar();
  }

  private landX(f: number) {
    return this.strip.x0 + f * (this.strip.x1 - this.strip.x0);
  }

  update(dt: number) {
    this.clock += dt;
    this.star.rotation = 0.2 * Math.sin(this.clock * 2);
    this.star.scale.set(1 + 0.08 * Math.sin(this.clock * 5));
    if (this.grab) this.drawSpring();
    const fl = this.flight;
    if (fl) {
      fl.t = Math.min(1, fl.t + dt / fl.duration);
      const { pts } = fl;
      const i = Math.min(pts.length - 2, Math.floor(fl.t * (pts.length - 1)));
      const k = fl.t * (pts.length - 1) - i;
      this.pet.position.set(pts[i].x + (pts[i + 1].x - pts[i].x) * k, pts[i].y + (pts[i + 1].y - pts[i].y) * k);
      this.pet.rotation = fl.t * Math.PI * 2;
      if (fl.t >= 1) {
        this.flight = null;
        fl.done();
      }
    }
  }

  destroy() {
    window.removeEventListener('pointerup', this.release);
    window.removeEventListener('pointercancel', this.release);
  }

  private placeStar() {
    const t = this.targets[this.shot];
    if (t === undefined) return;
    this.star.position.set(this.landX(padAt(t)), this.strip.y - 110);
  }

  private instruct(id: LineId, vars?: LineVars) {
    this.instruction = { id, vars };
    return this.ctx.instruct(id, vars);
  }

  private repeatInstruction() {
    if (!this.instruction || this.flying || this.finished || this.grab) return;
    this.pet.poke();
    sfx.giggle();
    void this.ctx.say(this.instruction.id, this.instruction.vars);
  }

  private async askShot() {
    this.wrongs = 0;
    this.hinting = this.plan.mode === 'free';
    this.placeStar();
    if (this.course) {
      // The misses already made at this cloud (after a reload) count towards the hint.
      this.wrongs = this.tries;
      this.hinting = this.wrongs >= 2;
      this.report();
      if (this.told) return;
      this.told = true;
      return this.instruct('launch.star');
    }
    switch (this.plan.mode) {
      case 'tap':
        if (this.shot === 0) await this.instruct('launch.tap');
        return;
      case 'free':
        if (this.shot === 0) await this.instruct('launch.pull');
        return;
      case 'star':
        return this.instruct('launch.star');
      case 'number':
        return this.instruct('launch.number', { n: this.targets[this.shot] + 1 });
      case 'compare':
        if (this.last === undefined) return this.instruct('launch.pull');
        this.ask = nextAsk(this.last);
        return this.instruct(this.ask === 'farther' ? 'launch.farther' : 'launch.nearer');
    }
  }

  /** Keep the pull on a short leash behind and below the seat. */
  private pull(x: number, y: number) {
    let dx = Math.min(0, x - this.seat.x);
    let dy = Math.max(0, y - this.seat.y);
    const d = Math.hypot(dx, dy);
    if (d > MAX_PULL) {
      dx *= MAX_PULL / d;
      dy *= MAX_PULL / d;
    }
    this.pet.position.set(this.seat.x + dx, this.seat.y + dy);
    this.drawPreview();
  }

  private pullNow() {
    return Math.hypot(this.pet.x - this.seat.x, this.pet.y - this.seat.y);
  }

  private letGo(): boolean {
    this.preview.clear();
    const p = this.pullNow();
    if (p < MIN_PULL || this.flying || this.finished) return false;
    void this.launch(reach(p));
    return true;
  }

  /** While pulling: where this pull would land (always on easy levels, after a hint on target levels). */
  private drawPreview() {
    const g = this.preview.clear();
    if (!this.hinting) return;
    const f = this.stick ? this.controllerPower : reach(this.pullNow());
    const x1 = this.landX(f);
    const pts = this.arc(f);
    for (let i = 2; i < pts.length; i += 3) g.circle(pts[i].x, pts[i].y, 6).fill({ color: 0xffffff, alpha: 0.85 });
    g.ellipse(x1, this.strip.y - 4, 46, 14).stroke({ width: 5, color: 0xffffff, alpha: 0.9 });
    // A ring shows how far the right pull is: a circle around the seat for a pulled pet, and for a squashed
    // spring an outline where the red plate should be pushed down to.
    const t = this.targets[this.shot];
    if (t !== undefined && (this.plan.mode === 'star' || this.plan.mode === 'number')) {
      if (this.stick) g.roundRect(this.seat.x - 68, this.seat.y + padAt(t) * SQUASH - 8, 136, 36, 14).stroke({ width: 5, color: swatch.yellow.fill, alpha: 0.85 });
      else g.circle(this.seat.x, this.seat.y, pullFor(padAt(t))).stroke({ width: 4, color: swatch.yellow.fill, alpha: 0.7 });
    }
  }

  /** The flight path for a landing at `f`, as points. */
  private arc(f: number) {
    const from = { ...this.seat };
    const to = { x: this.landX(f), y: this.strip.y - 20 };
    const h = 140 + 260 * f;
    return Array.from({ length: 31 }, (_, i) => {
      const t = i / 30;
      return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t - h * 4 * t * (1 - t) };
    });
  }

  private drawSpring() {
    const g = this.spring.clear();
    const base = { x: this.seat.x, y: this.strip.y + 4 };
    const top = this.flying ? this.seat : { x: this.pet.x, y: this.pet.y };
    g.roundRect(base.x - 70, base.y - 22, 140, 30, 12).fill(wood.fill).stroke({ width: 5, color: wood.line });
    const coils = 7;
    g.moveTo(base.x, base.y - 20);
    for (let i = 1; i <= coils; i++) {
      const t = i / coils;
      const x = base.x + (top.x - base.x) * t + (i % 2 ? -34 : 34);
      const y = base.y - 20 + (top.y + 10 - (base.y - 20)) * t;
      g.lineTo(x, y);
    }
    g.lineTo(top.x, top.y + 10);
    g.stroke({ width: 10, color: SPRING.line, join: 'round', cap: 'round' });
    g.roundRect(top.x - 60, top.y - 2, 120, 22, 10).fill(swatch.red.fill).stroke({ width: 5, color: swatch.red.line });
  }

  /** Wheee: up, over and down onto the grass or a cloud. */
  private async launch(f: number) {
    if (this.flying || this.finished) return;
    this.flying = true;
    if (this.course) {
      this.tries++;
      this.report();
    }
    sfx.boing();
    // A challenge run goes launch after launch, so it stays quiet between them.
    if (!this.course) void this.ctx.say('launch.wee');
    const pts = this.arc(f);
    // Fly from where the pull let go.
    pts[0] = { x: this.pet.x, y: this.pet.y };
    this.drawSpring();
    await new Promise<void>((done) => (this.flight = { pts, t: 0, duration: 0.7 + 0.6 * f, done }));
    this.pet.rotation = 0;
    this.pet.y = this.strip.y - 20;
    sfx.pop(4);
    this.ctx.particles.burst(this.pet.x, this.pet.y, { colors: [0xffffff, 0xd6eefa], count: 14, speed: [80, 220], gravity: 300, angle: -Math.PI / 2, spread: 1.6, size: [0.3, 0.6] });
    this.pet.poke();
    await this.landed(f);
  }

  private async landed(f: number) {
    const tw = this.ctx.tw;
    const verdict = judge(this.plan, f, this.targets[this.shot] ?? 0, this.ask, this.last, this.course?.padWidth);
    if (this.plan.mode === 'star' || this.plan.mode === 'number') this.off += Math.abs(f - padAt(this.targets[this.shot]));
    const firstCompare = this.plan.mode === 'compare' && this.last === undefined;
    if (verdict === 'yes') {
      if (!firstCompare && this.plan.mode !== 'tap' && this.plan.mode !== 'free') {
        this.pet.cheer();
        sfx.sparkle();
        this.ctx.particles.burst(this.pet.x, this.pet.y - 100, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.yellow.fill], count: 18, speed: [120, 300], gravity: 0, life: [0.6, 1] });
        if (!this.course) await this.ctx.say('praise');
      } else {
        this.pet.cheer();
      }
      this.last = f;
      this.drawFlag();
      this.shot++;
      if (this.course) {
        this.done.push(this.tries);
        this.tries = 0;
        this.report(true);
      }
    } else {
      this.misses++;
      this.wrongs++;
      if (!this.course) await this.ctx.say(verdict === 'short' ? 'launch.short' : 'launch.long');
      if (this.wrongs >= 2 && !this.hinting) {
        this.hinting = true;
        this.hints++;
        this.assisted = true;
        this.report();
      }
    }
    // Hop back onto the spring (still squashed to the last power on a stick, so a retry is a nudge away).
    await tw.to(this.pet, { x: this.seat.x, y: this.restingY() }, { duration: 0.7, ease: ease.outBack });
    this.flying = false;
    if (this.stick) this.squash();
    else this.drawSpring();
    const goal = this.course ? this.targets.length : this.plan.mode === 'compare' ? this.plan.shots + 1 : this.plan.shots;
    if (this.shot >= goal) return void this.finale();
    if (verdict === 'yes') await this.askShot();
  }

  /** Hand a course's numbers to the shell. `finished` means the cloud was just landed on, so none of its launches are "in progress". */
  private report(finished = false) {
    const run = this.ctx.couch?.course;
    if (!run || !this.course) return;
    run.progress({ board: this.shot, boards: this.targets.length, done: this.done.slice(), attempts: finished ? 0 : this.tries, par: 1, minimum: this.targets.length, assisted: this.assisted });
  }

  /** Compare levels: a little flag where the last landing was. */
  private drawFlag() {
    const g = this.flag.clear();
    if (this.plan.mode !== 'compare' || this.last === undefined) return;
    const x = this.landX(this.last);
    const y = this.strip.y + 10;
    g.moveTo(x, y).lineTo(x, y - 90).stroke({ width: 6, color: wood.line, cap: 'round' });
    g.poly([x, y - 90, x + 50, y - 74, x, y - 58]).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line, join: 'round' });
  }

  private async finale() {
    this.finished = true;
    sfx.tada();
    this.pet.cheer();
    await this.ctx.say('launch.done');
    await this.ctx.tw.wait(0.8);
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: Math.round(this.off * 100) });
  }
}

class LaunchIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const g = new Graphics();
    g.roundRect(-70, -20, 140, 26, 10).fill(wood.fill).stroke({ width: 5, color: wood.line });
    g.moveTo(0, -18);
    for (let i = 1; i <= 6; i++) g.lineTo(i % 2 ? -26 : 26, -18 - i * 18);
    g.lineTo(0, -130).stroke({ width: 9, color: SPRING.line, join: 'round' });
    g.roundRect(-50, -140, 100, 20, 9).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line });
    const s = starArt(26);
    s.position.set(70, -190);
    const cloud = padArt(90);
    cloud.position.set(-60, -200);
    c.addChild(g, cloud, s);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const cloud = padArt(160);
  cloud.y = 30;
  c.addChild(cloud);
  for (let i = 0; i < 3; i++) {
    const s = starArt(rng.range(14, 24));
    s.position.set(rng.range(-80, 80), rng.range(-120, -50));
    c.addChild(s);
  }
  return c;
}

export const bouncyLaunch: GameModule = {
  id: 'bouncy-launch',
  name: 'Bouncy Launch',
  titleLine: 'game.bouncy-launch',
  region: 'tinker-lab',
  skills: ['cause-and-effect', 'measurement', 'numbers'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.bubbles,
  coplayHint: 'Say "pull... and let go!" together, then guess where {name}\'s pet will land.',
  offScreen: 'Roll a ball down a ramp: tilt it more or less and see how far it goes.',
  hubIcon: () => new LaunchIcon(),
  sticker,
  create: (ctx) => new BouncyLaunch(ctx),
};
