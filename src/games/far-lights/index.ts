import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { answerGlow, checkArt, houseArt, iconArt, postArt, postGlow, ropeArt, sideLight, stripArt, touchRing, windowArt, WindowLight } from './art';
import {
  boardsFor, brighterOf, closerHelp, CloserWalk, farLayout, FarTally, GLOW, GlowTaps, judgeBrighter, judgeMatch, LANES, look, movable,
  nearestStop, pairsFor, planFor, STOPS, type Board, type FarLayout, type Lane, type Pair, type PlanInfo, type Stop,
} from './logic';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 3 },
  prek: { min: 3, max: 4 },
  school: { min: 4, max: 4 },
};

/** Each level's authored first round leads its first round of a session, and every demonstration. */
const authoredShown = new Set<number>();

/** A note per stop, rising toward the window (pentatonic steps). */
const stopNote = (s: Stop) => 9 - s;
/** A light at a distance between stops (while it floats): how bright it looks. */
const lookAt = (d: number) => GLOW / (d * d);

class FarLights implements Game {
  readonly plan: PlanInfo;
  readonly tally = new FarTally();
  readonly pairs: Pair[];
  readonly boards: Board[];
  readonly taps = new GlowTaps();
  walk = new CloserWalk();
  index = 0;
  finished = false;
  busy = false;
  layout: FarLayout | null = null;
  /** Where each light rests in the strip, and the stop nearest it while it is dragged (what the window shows). */
  stops: Record<Lane, Stop> = { A: 4, B: 3 };
  live: Record<Lane, Stop> = { A: 4, B: 3 };
  /** Level 1: each light's distance, animated while it floats close and back. */
  readonly dist = [{ d: 4 }, { d: 4 }, { d: 4 }];

  private alive = true;
  private view: View;
  private relayout = false;
  private epoch = 0;
  private talking = false;
  private lastTouch = 1;
  private readonly board = new Container();
  private readonly backdrop = new Graphics();
  stripLights: Partial<Record<Lane, Container>> = {};
  windowLights: WindowLight[] = [];
  check: Container | null = null;
  private drags: DragHandle[] = [];
  private glows: Graphics[] = [];

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const level = this.plan.level;
    const authored = !!ctx.demo || !authoredShown.has(level);
    if (!ctx.demo) authoredShown.add(level);
    this.pairs = level === 3 ? pairsFor(ctx.rng, authored) : [];
    this.boards = level === 4 ? boardsFor(ctx.rng, authored) : [];
    this.place();
    ctx.stage.addChild(this.backdrop, this.board);
  }

  start() {
    this.build();
    const lines: LineId[] = ['far.instruct.glow', 'far.instruct.closer', 'far.instruct.brighter', 'far.instruct.match'];
    void this.ctx.instruct(lines[this.plan.level - 1]);
  }

  destroy() {
    this.alive = false;
    for (const d of this.drags) d.destroy();
    this.drags = [];
  }

  resize(v: View) {
    this.view = v;
    if (this.busy || this.drags.some((d) => d.dragging)) {
      this.relayout = true;
      return;
    }
    this.build();
  }

  update() {
    if (this.plan.level === 1) this.windowLights.forEach((w, i) => w.setLook(lookAt(this.dist[i].d)));
    else for (const lane of LANES) this.windowLights[lane === 'A' ? 0 : 1]?.setLook(look(GLOW, this.live[lane]));
  }

  /** The round's current pair or board sets where the lights rest. */
  private place() {
    const level = this.plan.level;
    if (level === 2) this.stops = { ...this.walk.at };
    else if (level === 3) {
      const p = this.pairs[this.index];
      this.stops = { A: p.A, B: p.B };
    } else if (level === 4) {
      const b = this.boards[this.index];
      this.stops = { [b.ref]: b.r, [movable(b)]: b.m } as Record<Lane, Stop>;
    }
    this.live = { ...this.stops };
  }

  private settle() {
    this.busy = false;
    if (this.relayout && this.alive && !this.finished) this.build();
  }

  private say(id: LineId) {
    return this.ctx.say(id);
  }

  /** A short line while dragging, skipped while another is still being said. */
  private chirp(id: LineId) {
    if (this.talking) return;
    this.talking = true;
    void this.say(id).then(() => (this.talking = false));
  }

  // ----- building -----

  private build() {
    this.relayout = false;
    for (const d of this.drags) d.destroy();
    this.drags = [];
    for (const c of this.board.removeChildren()) c.destroy({ children: true });
    this.stripLights = {};
    this.windowLights = [];
    this.glows = [];
    this.check = null;
    const v = this.view;
    this.backdrop.clear().rect(0, 0, v.w, v.h).fill(0x3a4372);
    const level = this.plan.level;
    const l = (this.layout = farLayout(v, level));
    if (!l || this.finished) return;

    if (l.strip && l.house) {
      this.board.addChild(stripArt(l.strip), houseArt(l.house));
      for (const lane of LANES) for (const s of STOPS) this.board.addChild(postArt(l.stopX[s - 1], l.laneY[lane], s));
    }
    this.board.addChild(windowArt(l.window));

    const count = level === 1 ? 3 : 2;
    for (let i = 0; i < count; i++) {
      const w = new WindowLight(l.touchR);
      w.position.set(l.spots[i].x, l.spots[i].y);
      this.board.addChild(w);
      this.windowLights.push(w);
      if (level === 1 || level === 3) {
        w.hitArea = new Circle(0, 0, l.touchR);
        onTap(w, () => this.tapWindow(i), { cooldown: 200 });
      }
    }
    this.update();

    if (l.strip) for (const lane of LANES) this.buildStripLight(lane, l);
    if (level === 4 && l.check) {
      const c = checkArt(l.check.w);
      c.position.set(l.check.x + l.check.w / 2, l.check.y + l.check.h / 2);
      c.hitArea = new Rectangle(-l.check.w / 2, -l.check.h / 2, l.check.w, l.check.h);
      onTap(c, () => this.pressCheck(), { cooldown: 300 });
      this.board.addChild(c);
      this.check = c;
    }
    this.showGlow();
  }

  private buildStripLight(lane: Lane, l: FarLayout) {
    const level = this.plan.level;
    const light = new Container();
    const ring = touchRing(34);
    ring.alpha = 0;
    light.addChild(sideLight(), ring);
    light.position.set(l.stopX[this.stops[lane] - 1], l.laneY[lane]);
    light.hitArea = new Circle(0, 0, l.touchR);
    const moored = level === 4 && this.boards[this.index].ref === lane;
    if (moored) light.addChild(ropeArt());
    this.board.addChild(light);
    this.stripLights[lane] = light;
    const flash = () => {
      ring.alpha = 1;
      void this.ctx.tw.to(ring, { alpha: 0 }, { duration: 0.5 });
    };
    if (level === 3 || moored) {
      // Lights in the strip bob when tapped but do not answer.
      onTap(light, () => {
        flash();
        this.bob(light);
      });
      return;
    }
    const left = l.stopX[0];
    const right = l.stopX[3];
    const drag = draggable(light, this.ctx.tw, {
      lift: 0,
      keepGrab: true,
      onPick: () => {
        flash();
        sfx.pop(6);
      },
      onMove: (x) => {
        light.position.set(Math.min(right, Math.max(left, x)), l.laneY[lane]);
        const s = nearestStop(light.x, l.stopX);
        if (s !== this.live[lane]) this.cross(lane, this.live[lane], s);
      },
      onDrop: (x) => {
        const s = nearestStop(Math.min(right, Math.max(left, x)), l.stopX);
        if (s !== this.live[lane]) this.cross(lane, this.live[lane], s);
        light.y = l.laneY[lane];
        void this.ctx.tw.to(light, { x: l.stopX[s - 1] }, { duration: 0.2, ease: ease.outCubic });
        this.rest(lane, s);
        if (this.relayout) queueMicrotask(() => this.alive && !this.busy && this.build());
        return true;
      },
    });
    this.drags.push(drag);
  }

  /** A light passed from one stop to the next: a note, and at level 2 a word. */
  private cross(lane: Lane, from: Stop, to: Stop) {
    const step = Math.sign(to - from) as 1 | -1;
    for (let s = from + step; step > 0 ? s <= to : s >= to; s += step) sfx.bell(stopNote(s as Stop));
    this.live[lane] = to;
    if (this.plan.level === 2) {
      const said = this.walk.cross(lane, from, to);
      if (said) this.chirp(said === 'brighter' ? 'far.brighter' : 'far.dimmer');
    }
  }

  private rest(lane: Lane, s: Stop) {
    this.stops[lane] = s;
    this.live[lane] = s;
    if (this.plan.level === 2) {
      this.walk.rest(lane, s);
      if (this.walk.done && !this.busy) void this.finishWalk();
    }
  }

  private bob(c: Container) {
    const y = c.y;
    void this.ctx.tw.to(c, { y: y - 14 }, { duration: 0.15, ease: ease.outQuad }).then(() => {
      if (!c.destroyed) void this.ctx.tw.to(c, { y }, { duration: 0.2, ease: ease.inQuad });
    });
  }

  private showGlow() {
    for (const g of this.glows) g.destroy();
    this.glows = [];
    const l = this.layout;
    if (!l || !this.tally.glow) return;
    if (this.plan.level === 3) {
      const k = brighterOf(this.pairs[this.index]) === 'A' ? 0 : 1;
      const g = answerGlow(l.touchR);
      g.position.set(l.spots[k].x, l.spots[k].y);
      this.board.addChildAt(g, this.board.getChildIndex(this.windowLights[0]));
      this.glows.push(g);
    } else if (this.plan.level === 4) {
      const b = this.boards[this.index];
      const g = postGlow(l.stopX[b.r - 1], l.laneY[movable(b)]);
      this.board.addChildAt(g, this.board.getChildIndex(this.stripLights[movable(b)]!));
      this.glows.push(g);
    }
  }

  // ----- level 1: glow -----

  private tapWindow(i: number) {
    if (this.finished) return;
    const w = this.windowLights[i];
    w.ring.alpha = 1;
    void this.ctx.tw.to(w.ring, { alpha: 0 }, { duration: 0.5 });
    this.lastTouch = i;
    if (this.plan.level === 1) void this.float(i);
    else if (this.plan.level === 3) void this.answer(i === 0 ? 'A' : 'B');
  }

  /** A counted tap: the light floats close and glows up, holds, then drifts back. Its glow never changes; only its distance. */
  private async float(i: number) {
    if (!this.taps.tap(i)) return;
    this.tally.next();
    const e = this.epoch;
    const proxy = this.dist[i];
    void this.notes(e);
    await this.ctx.tw.to(proxy, { d: 1 }, { duration: 0.8, ease: ease.outCubic });
    if (!this.alive || e !== this.epoch) return;
    void this.say('far.so-bright');
    await this.ctx.tw.wait(1.5);
    if (!this.alive || e !== this.epoch) return;
    await this.ctx.tw.to(proxy, { d: 4 }, { duration: 1.2, ease: ease.inOutSine });
    if (!this.alive || e !== this.epoch) return;
    this.taps.back(i);
    if (this.taps.done) {
      await this.ctx.tw.wait(1);
      if (this.alive && e === this.epoch) void this.finale();
    }
  }

  /** Three rising notes as a light floats close. */
  private async notes(e: number) {
    for (let k = 0; k < 3; k++) {
      if (!this.alive || e !== this.epoch) return;
      sfx.bell(6 + k);
      await this.ctx.tw.wait(0.27);
    }
  }

  // ----- level 2: come closer -----

  private async finishWalk() {
    this.busy = true;
    this.hold(true);
    const e = this.epoch;
    await this.ctx.tw.wait(1);
    if (!this.alive || e !== this.epoch) return;
    await this.say('far.not-bigger');
    if (this.alive && e === this.epoch) void this.finale();
  }

  // ----- level 3: which looks brighter? -----

  private async answer(lane: Lane) {
    if (this.busy) return;
    const p = this.pairs[this.index];
    if (judgeBrighter(p, lane) === 'dimmer') {
      sfx.boing();
      this.tally.miss();
      this.showGlow();
      void this.say('far.wrong-brighter');
      return;
    }
    this.busy = true;
    const e = this.epoch;
    sfx.sparkle();
    const s = this.stripLights[lane];
    if (s) this.bob(s);
    await this.say('far.right-brighter');
    if (this.alive && e === this.epoch) this.next();
  }

  // ----- level 4: make them match -----

  private async pressCheck() {
    if (this.busy || this.finished || this.drags.some((d) => d.dragging)) return;
    const b = this.boards[this.index];
    const v = judgeMatch(b, this.stops[movable(b)]);
    if (v !== 'same') {
      sfx.boing();
      this.tally.miss();
      this.showGlow();
      void this.say(v === 'too-bright' ? 'far.too-bright' : 'far.too-dim');
      return;
    }
    this.busy = true;
    const e = this.epoch;
    sfx.sparkle();
    for (const lane of LANES) if (this.stripLights[lane]) this.bob(this.stripLights[lane]!);
    await this.say('far.same');
    if (this.alive && e === this.epoch) this.next();
  }

  private next() {
    this.index++;
    this.tally.next();
    const total = this.plan.level === 3 ? this.pairs.length : this.boards.length;
    if (this.index >= total) return void this.finale();
    this.place();
    this.busy = false;
    this.build();
    void this.ctx.instruct(this.plan.level === 3 ? 'far.instruct.brighter' : 'far.instruct.match');
  }

  // ----- help, restart, finish -----

  hintLabel = 'Show a hint';

  askForHint() {
    if (this.finished || this.busy || this.drags.some((d) => d.dragging) || !this.layout) return;
    const level = this.plan.level;
    const l = this.layout;
    if (level === 1) {
      const free = [0, 1, 2].filter((i) => !this.taps.moving.has(i));
      if (!free.length || this.taps.count >= 3) return;
      const i = free.reduce((a, b) => (Math.abs(b - this.lastTouch) < Math.abs(a - this.lastTouch) ? b : a));
      this.tally.hint();
      void this.say('far.hint');
      this.pulse(this.windowLights[i]);
      void this.float(i);
      return;
    }
    if (level === 3) {
      this.tally.hint();
      void this.say('far.hint');
      this.pulse(this.windowLights[brighterOf(this.pairs[this.index]) === 'A' ? 0 : 1]);
      return;
    }
    const lane = level === 2 ? closerHelp(this.stops)?.lane : movable(this.boards[this.index]);
    if (!lane) return;
    const to = level === 2 ? closerHelp(this.stops)!.to : this.boards[this.index].r;
    const light = this.stripLights[lane];
    if (!light) return;
    this.tally.hint();
    void this.say('far.hint');
    if (this.stops[lane] === to) return void this.pulse(light);
    // The glide holds the lights: a finger cannot grab one (and kill the glide) until it lands.
    this.busy = true;
    this.hold(true);
    const e = this.epoch;
    void this.ctx.tw.to(light, { x: l.stopX[to - 1] }, { duration: 0.8, ease: ease.inOutSine }).then(() => {
      if (!this.alive || e !== this.epoch) return;
      this.cross(lane, this.live[lane], to);
      this.busy = false;
      this.hold(false);
      this.rest(lane, to);
      if (!this.busy) this.settle();
    });
  }

  /** Hold every draggable light still (a hint's glide, the finish). */
  private hold(on: boolean) {
    for (const d of this.drags) d.enabled = !on;
  }

  private pulse(c: Container) {
    void this.ctx.tw.to(c.scale, { x: 1.25, y: 1.25 }, { duration: 0.25 }).then(() => {
      if (!c.destroyed) void this.ctx.tw.to(c.scale, { x: 1, y: 1 }, { duration: 0.3 });
    });
  }

  /** Start again: the same round from its first board, misses and hints kept. */
  restart() {
    if (this.finished) return;
    this.epoch++;
    this.index = 0;
    this.walk = new CloserWalk();
    this.taps.count = 0;
    this.taps.moving.clear();
    for (const p of this.dist) {
      this.ctx.tw.kill(p);
      p.d = 4;
    }
    this.tally.next();
    this.busy = false;
    this.place();
    this.build();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    this.hold(true);
    sfx.tada();
    this.ctx.pet.cheer();
    for (const c of [...Object.values(this.stripLights), ...this.windowLights]) if (c) this.bob(c);
    await this.say('far.done');
    await this.ctx.tw.wait(0.8);
    if (this.alive) this.ctx.finish({ misses: this.tally.misses, hints: this.tally.hints });
  }

  // ----- the ghost finger -----

  autotouch(): TouchIntent | null {
    const l = this.layout;
    if (this.finished || this.busy || !l || this.drags.some((d) => d.dragging)) return null;
    const level = this.plan.level;
    if (level === 1) {
      if (this.taps.moving.size || this.taps.count >= 3) return null;
      return { tap: { on: this.windowLights[this.taps.count % 3] } };
    }
    if (level === 3) return { tap: { on: this.windowLights[brighterOf(this.pairs[this.index]) === 'A' ? 0 : 1] } };
    const b = level === 4 ? this.boards[this.index] : null;
    const help = b ? { lane: movable(b), to: b.r as Stop } : closerHelp(this.stops);
    if (!help) return null;
    const at = this.stops[help.lane];
    if (at === help.to) return b && this.check ? { tap: { on: this.check }, pause: 1 } : null;
    const next = (at + Math.sign(help.to - at)) as Stop;
    const light = this.stripLights[help.lane];
    if (!light) return null;
    return { drag: { on: light }, to: { on: this.board, x: l.stopX[next - 1], y: l.laneY[help.lane] }, lift: 0, pause: 0.3 };
  }
}

class FarIcon extends WigglyIcon {
  constructor() {
    const art = iconArt(200);
    art.y = -100;
    super(art);
    this.hitArea = new Circle(0, -100, 110);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const near = rng.pick([1, 2] as const);
  const far = rng.pick([3, 4] as const);
  return iconArt(150, look(GLOW, near), look(GLOW, far));
}

export const farLights: GameModule = {
  id: 'far-lights',
  name: 'Far Lights',
  titleLine: 'game.far-lights',
  region: 'tinker-lab',
  challenge: 'noticing',
  skills: ['observation', 'comparing', 'distance', 'brightness'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  touchDemo: true,
  coplayHint: 'Hand over the lake: cover the top strip with your hand, let {name} pick the brighter light from the window, then lift your hand to see which is nearer.',
  offScreen: 'Tonight, look out of a window. Does a near light or a far light look brighter?',
  hubIcon: () => new FarIcon(),
  sticker,
  create: (ctx) => new FarLights(ctx),
};
