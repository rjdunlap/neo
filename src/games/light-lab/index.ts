import { Circle, Container, Graphics } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { flower } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { nextSpot, routeStep, type Spot } from '../../couch/focus';
import { idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { beamEnd, hintMirror, makePuzzle, planFor, predictionChoices, solved, trace, whyNot, type BeamEnd, type LightPlan, type LightPuzzle, type Tilt, type Tint } from './logic';

const LEVELS: BandLevels = {
  prek: { min: 1, max: 4 },
  school: { min: 2, max: 7 },
};

const CELL = 100;
const TINT_COLOR: Record<Tint, number> = { sun: 0xffe066, pink: swatch.pink.fill, blue: swatch.blue.fill };

/** A smiling sun: the beam's start, and the button that shines it on planning levels. */
function sunArt(): Graphics {
  const g = new Graphics();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    g.moveTo(Math.cos(a) * 30, Math.sin(a) * 30).lineTo(Math.cos(a) * 44, Math.sin(a) * 44);
  }
  g.stroke({ width: 6, color: swatch.yellow.line, cap: 'round' });
  g.circle(0, 0, 28).fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.yellow.line });
  g.circle(-9, -4, 3).circle(9, -4, 3).fill(ink);
  g.moveTo(-9, 8).quadraticCurveTo(0, 15, 9, 8).stroke({ width: 3, color: ink, cap: 'round' });
  return g;
}

/** A mirror on a little stand; it is drawn as "/" and rotated a quarter for "\". */
function mirrorArt(): Container {
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, 40).fill({ color: 0xffffff, alpha: 0.5 }).stroke({ width: 3, color: swatch.white.line, alpha: 0.6 }));
  const glass = new Graphics().roundRect(-8, -42, 16, 84, 6).fill(0xdff3ff).stroke({ width: 5, color: swatch.blue.line });
  glass.moveTo(-2, -32).lineTo(-2, 30).stroke({ width: 3, color: 0xffffff, alpha: 0.9 });
  glass.rotation = Math.PI / 4;
  c.addChild(glass);
  return c;
}

function rockArt(): Graphics {
  return new Graphics().poly([-38, 26, -30, -16, -8, -34, 22, -28, 38, 4, 30, 30]).fill(swatch.white.line).stroke({ width: 5, color: ink, alpha: 0.4, join: 'round' });
}

function glassArt(tint: Tint): Graphics {
  return new Graphics().roundRect(-34, -34, 68, 68, 12).fill({ color: TINT_COLOR[tint], alpha: 0.45 }).stroke({ width: 5, color: TINT_COLOR[tint] });
}

class Bloom extends Container {
  private readonly bud = new Graphics();
  private readonly open: Graphics;
  awake = false;
  constructor(readonly wants: Tint) {
    super();
    const petal = wants === 'pink' ? swatch.pink : swatch.yellow;
    this.bud.ellipse(0, -6, 16, 24).fill(petal.light).stroke({ width: 4, color: petal.line });
    this.open = flower(new Graphics(), 34, petal.fill, petal.line);
    this.open.y = -8;
    this.open.scale.set(0);
    const stem = new Graphics().moveTo(0, 40).lineTo(0, 12).stroke({ width: 6, color: swatch.green.line, cap: 'round' }).ellipse(10, 28, 10, 5).fill(swatch.green.fill);
    this.addChild(stem, this.bud, this.open);
  }
  wake(tw: GameContext['tw']) {
    if (this.awake) return;
    this.awake = true;
    this.bud.visible = false;
    void tw.to(this.open.scale, { x: 1, y: 1 }, { duration: 0.45, ease: ease.outBack });
  }
  sleep() {
    this.awake = false;
    this.bud.visible = true;
    this.open.scale.set(0);
  }
}

class LightLab implements Game {
  readonly plan: LightPlan;
  puzzle!: LightPuzzle;
  tilts: Tilt[] = [];
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** Mirror nodes by thing index. */
  readonly mirrors = new Map<number, Container>();
  readonly sun = new Container();

  private readonly board = new Container();
  private readonly floor = new Graphics();
  private readonly pieces = new Container();
  private readonly beam = new Graphics();
  private readonly glow = new Graphics();
  private readonly blooms = new Map<number, Bloom>();
  private view: View;
  private wrongs = 0;
  private hinted = -1;
  private clock = 0;
  /** Couch face-off score: turns beyond the ones this board needs, plus shines that missed, added up (lower is better). */
  excess = 0;
  private taps = 0;
  private needed = 0;
  private shinesMissed = 0;
  // Couch play: a ring over the mirrors (and the sun on planning levels).
  private spots: (Spot & { thing: number })[] = [];
  private focus = 0;
  private couchOn = false;
  private readonly ring = new Graphics();
  private botWait = 1;
  private readonly predictionMarks = new Map<string, Container>();

  private get predicting() { return this.plan.mode === 'predict' && this.index < 3; }
  private get planning() { return this.plan.mode === 'plan' || (this.plan.mode === 'predict' && this.index >= 3); }

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.sun.addChild(sunArt());
    this.sun.hitArea = new Circle(0, 0, 55);
    onTap(this.sun, () => void this.shine(), { cooldown: 500 });
    this.beam.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.ring.eventMode = 'none';
    this.board.addChild(this.floor, this.beam, this.pieces, this.sun, this.glow, this.ring);
    ctx.stage.addChild(this.board);
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    this.view = v;
    if (!this.puzzle) return;
    const { cols, rows } = this.puzzle;
    this.board.position.set((v.w - cols * CELL) / 2, Math.max(110, (v.h - rows * CELL) / 2 + 20));
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.hinted >= 0 && !this.busy) {
      const t = this.puzzle.things[this.hinted];
      g.circle((t.x + 0.5) * CELL, (t.y + 0.5) * CELL, 46 + 4 * Math.sin(this.clock * 6)).stroke({ width: 7, color: swatch.yellow.fill });
    }
    const ring = this.ring.clear();
    const spot = this.couchOn && !this.busy && !this.finished ? this.spots[this.focus] : undefined;
    if (spot) {
      const c = this.at(spot.x, spot.y);
      ring.circle(c.x, c.y, 52 + 3 * Math.sin(this.clock * 6)).stroke({ width: 8, color: swatch.teal.line });
    }
    // On planning levels the sun pulses to show it can be tapped.
    if (this.planning && !this.busy) this.sun.scale.set(1 + 0.05 * Math.sin(this.clock * 4));
  }

  destroy() {}

  /** Couch play: the stick moves the ring, the bottom button turns a mirror (or shines on the sun), the left button shines. */
  control(input: CouchControls) {
    this.couchOn = true;
    if (this.busy || this.finished || !this.spots.length) return;
    for (const p of input.players) {
      if (p.direction >= 0) this.focus = nextSpot(this.spots, this.focus, p.direction);
      if (p.undo) void this.shine();
      if (p.action) {
        const t = this.spots[this.focus].thing;
        if (t <= -2) void this.predict(predictionChoices(this.puzzle)[-t - 2]);
        else if (t < 0) void this.shine(); else this.turn(t);
      }
    }
  }

  /** The "watch me" demo: turn each mirror on the way that still points the wrong way, then shine. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    out.players[0].active = true;
    this.botWait -= dt;
    if (this.busy || this.finished || this.botWait > 0 || !this.spots.length) return out;
    const want = hintMirror(this.puzzle, this.tilts);
    const target = this.predicting ? 0 : want >= 0 ? this.spots.findIndex((sp) => sp.thing === want) : this.spots.findIndex((sp) => sp.thing < 0);
    if (target < 0) return out;
    if (target === this.focus) {
      out.players[0].action = true;
      this.botWait = 1;
    } else {
      out.players[0].direction = routeStep(this.spots, this.focus, target);
      this.botWait = 0.45;
    }
    return out;
  }

  /**
   * The ghost finger on the how-to card: tap the mirror the solution still needs turned (the same one the hint names),
   * and on planning levels, with every mirror right, the sun to shine.
   */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.puzzle) return null;
    if (this.predicting) {
      const answer = predictionChoices(this.puzzle)[0];
      const target = answer && this.predictionMarks.get(answer.key);
      return target ? { tap: { on: target } } : null;
    }
    const want = hintMirror(this.puzzle, this.tilts);
    const mirror = want >= 0 ? this.mirrors.get(want) : undefined;
    if (mirror) return { tap: { on: mirror } };
    return this.planning ? { tap: { on: this.sun } } : null;
  }

  private at(x: number, y: number) {
    return { x: (x + 0.5) * CELL, y: (y + 0.5) * CELL };
  }

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hinted = -1;
    if (this.index >= this.plan.puzzles) return void this.finale();
    this.puzzle = makePuzzle(this.plan, this.ctx.rng);
    this.tilts = [...this.puzzle.start];
    this.build();
    this.resize(this.view);
    this.board.alpha = 0;
    await this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.3 });
    this.busy = false;
    if (this.plan.mode === 'live') this.drawBeam();
    if (this.index > 0) return;
    if (this.plan.mode === 'predict') return this.ctx.instruct('light.predict');
    if (this.plan.glass) return this.ctx.instruct('light.color');
    if (this.plan.flowers === 2) return this.ctx.instruct('light.two');
    return this.ctx.instruct(this.plan.mode === 'live' ? 'light.live' : 'light.plan');
  }

  private build() {
    const p = this.puzzle;
    this.pieces.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.taps = 0;
    this.shinesMissed = 0;
    this.needed = p.pathMirrors.filter((i) => p.start[i] !== p.solution[i]).length;
    this.predictionMarks.clear();
    if (this.predicting) {
      const choices = predictionChoices(p).slice(0, 3);
      this.spots = choices.map((end, i) => ({ x: end.targetX, y: end.targetY, thing: -2 - i }));
      this.focus = 0;
    } else {
      this.spots = p.things.flatMap((t, i) => (t.kind === 'mirror' ? [{ x: t.x, y: t.y, thing: i }] : []));
      if (this.planning) this.spots.push({ x: 0, y: p.sunRow, thing: -1 });
      this.focus = Math.max(0, this.spots.findIndex((sp) => sp.thing === p.pathMirrors[0]));
    }
    this.mirrors.clear();
    this.blooms.clear();
    this.beam.clear();
    const f = this.floor.clear();
    f.roundRect(-14, -14, p.cols * CELL + 28, p.rows * CELL + 28, 26).fill(wood.light).stroke({ width: 6, color: wood.line });
    for (let x = 0; x < p.cols; x++) for (let y = 0; y < p.rows; y++) f.roundRect(x * CELL + 4, y * CELL + 4, CELL - 8, CELL - 8, 14).fill((x + y) % 2 ? 0xf3f7ff : 0xe8f0fb);
    const s = this.at(0, p.sunRow);
    this.sun.position.set(s.x, s.y);
    p.things.forEach((t, i) => {
      const c = this.at(t.x, t.y);
      let node: Container;
      if (t.kind === 'mirror') {
        node = mirrorArt();
        node.hitArea = new Circle(0, 0, CELL / 2);
        onTap(node, () => this.turn(i), { cooldown: 200 });
        node.children[1].rotation = this.tilts[i] === 0 ? Math.PI / 4 : -Math.PI / 4;
        this.mirrors.set(i, node);
      } else if (t.kind === 'rock') node = rockArt();
      else if (t.kind === 'glass') node = glassArt(t.tint);
      else {
        const b = new Bloom(t.wants);
        this.blooms.set(i, b);
        node = b;
      }
      node.position.set(c.x, c.y);
      this.pieces.addChild(node);
    });
    if (this.predicting) for (const end of predictionChoices(p).slice(0, 3)) this.addPredictionMark(end);
  }

  private addPredictionMark(end: BeamEnd) {
    const c = new Container();
    const g = new Graphics().circle(0, 0, 43).fill({ color: 0xffffff, alpha: 0.78 }).stroke({ width: 7, color: swatch.teal.line });
    if (end.kind === 'rock') {
      g.poly([-20, 10, -15, -12, 0, -21, 18, -15, 21, 7, 12, 19, -10, 18]).fill(swatch.white.line).stroke({ width: 3, color: ink, alpha: 0.55 });
    } else if (end.kind === 'edge') {
      const dirs: Record<number, [number, number]> = { 0: [24, 0], 1: [0, 24], 2: [-24, 0], 3: [0, -24] };
      const [dx, dy] = dirs[end.exit ?? 0];
      g.moveTo(-dx * 0.55, -dy * 0.55).lineTo(dx * 0.55, dy * 0.55).stroke({ width: 7, color: swatch.teal.line, cap: 'round' });
      g.poly([dx * 0.75, dy * 0.75, dx * 0.25 - dy * 0.28, dy * 0.25 + dx * 0.28, dx * 0.25 + dy * 0.28, dy * 0.25 - dx * 0.28]).fill(swatch.teal.line);
    }
    c.addChild(g);
    const at = this.at(end.targetX, end.targetY);
    c.position.set(at.x, at.y);
    c.hitArea = new Circle(0, 0, 50);
    onTap(c, () => void this.predict(end), { cooldown: 250 });
    this.pieces.addChild(c);
    this.predictionMarks.set(end.key, c);
  }

  /** Tap a mirror: it tilts the other way. Turning is always free; it is how you explore. */
  private turn(i: number) {
    if (this.busy || this.finished || this.predicting) return;
    this.taps++;
    this.tilts[i] = (1 - this.tilts[i]) as Tilt;
    const glass = this.mirrors.get(i)!.children[1];
    void this.ctx.tw.to(glass, { rotation: this.tilts[i] === 0 ? Math.PI / 4 : -Math.PI / 4 }, { duration: 0.18, ease: ease.outBack });
    sfx.tick();
    if (this.hinted === i) this.hinted = -1;
    if (this.plan.mode === 'live') {
      this.drawBeam();
      if (solved(this.puzzle, this.tilts)) void this.win();
    } else this.beam.clear();
  }

  /** The beam as far as it gets: full on live levels, or `upTo` cells while it is shining. */
  private drawBeam(upTo = Infinity) {
    const t = trace(this.puzzle, this.tilts);
    const g = this.beam.clear();
    // One line per color, so the soft glow doesn't stack up where segments meet.
    const shown = t.cells.slice(0, upTo);
    let from = this.at(0, this.puzzle.sunRow);
    for (let i = 0; i < shown.length; ) {
      const tint = shown[i].tint;
      const run = [from];
      while (i < shown.length && shown[i].tint === tint) run.push(this.at(shown[i].x, shown[i].y)), i++;
      for (const [width, alpha] of [[22, 0.35], [8, 1]]) {
        g.moveTo(run[0].x, run[0].y);
        for (const p of run.slice(1)) g.lineTo(p.x, p.y);
        g.stroke({ width, color: TINT_COLOR[tint], alpha, cap: 'round', join: 'round' });
      }
      from = run[run.length - 1];
    }
    // Live levels wake flowers as the light reaches them.
    for (const [i, b] of this.blooms) {
      if (t.woken.includes(i) && upTo === Infinity) b.wake(this.ctx.tw);
      else if (this.plan.mode === 'live') b.sleep();
    }
    return t;
  }

  /** Planning levels: the sun shines, the beam travels, and either everything wakes or we see why not. */
  private async shine() {
    if (this.busy || this.finished || !this.planning || this.predicting) return;
    this.busy = true;
    this.sun.scale.set(1);
    sfx.whoosh();
    const t = trace(this.puzzle, this.tilts);
    for (let n = 1; n <= t.cells.length; n++) {
      this.drawBeam(n);
      const c = t.cells[n - 1];
      const i = this.puzzle.things.findIndex((x) => x.x === c.x && x.y === c.y);
      if (i >= 0 && t.woken.includes(i)) {
        this.blooms.get(i)?.wake(this.ctx.tw);
        sfx.bell(7 + n % 5, 0.25);
      }
      await this.ctx.tw.wait(0.09);
    }
    if (solved(this.puzzle, this.tilts)) return void this.win();
    this.misses++;
    this.shinesMissed++;
    this.wrongs++;
    sfx.boing();
    const why = whyNot(this.puzzle, this.tilts);
    await this.ctx.say(why === 'color' ? 'light.miss.color' : why === 'sleeping' ? 'light.miss.sleeping' : why === 'rock' ? 'light.miss.rock' : 'light.miss.edge');
    if (this.wrongs >= 2 && this.hinted < 0) {
      this.hinted = hintMirror(this.puzzle, this.tilts);
      if (this.hinted >= 0) {
        this.hints++;
        void this.ctx.say('light.hint');
      }
    }
    await this.ctx.tw.wait(0.6);
    for (const b of this.blooms.values()) b.sleep();
    this.beam.clear();
    this.busy = false;
  }

  /** A prediction is an experiment: show the route and explain the endpoint without a miss. */
  private async predict(choice?: BeamEnd) {
    if (this.busy || this.finished || !this.predicting || !choice) return;
    this.busy = true;
    const answer = beamEnd(this.puzzle, this.tilts);
    sfx.whoosh();
    const route = trace(this.puzzle, this.tilts);
    for (let n = 1; n <= route.cells.length; n++) {
      this.drawBeam(n);
      const cell = route.cells[n - 1];
      const i = this.puzzle.things.findIndex((thing) => thing.x === cell.x && thing.y === cell.y);
      if (i >= 0 && route.woken.includes(i)) this.blooms.get(i)?.wake(this.ctx.tw);
      await this.ctx.tw.wait(0.09);
    }
    const line = choice.key === answer.key ? 'light.predict.right' : answer.kind === 'rock' ? 'light.predict.rock' : 'light.predict.edge';
    await this.ctx.say(line);
    await this.ctx.tw.wait(0.8);
    for (const b of this.blooms.values()) b.sleep();
    this.beam.clear();
    this.board.alpha = 0;
    await this.next();
  }

  private async win() {
    this.busy = true;
    this.excess += Math.max(0, this.taps - this.needed) + this.shinesMissed;
    this.hinted = -1;
    this.drawBeam();
    for (const b of this.blooms.values()) {
      b.wake(this.ctx.tw);
      const p = this.ctx.stage.toLocal(b.getGlobalPosition());
      this.ctx.particles.burst(p.x, p.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.pink.light], count: 16, speed: [100, 280], gravity: 0, life: [0.5, 0.9] });
    }
    sfx.sparkle();
    this.ctx.pet.cheer();
    await this.ctx.say('light.yay');
    await this.ctx.tw.wait(0.5);
    await this.ctx.tw.to(this.board, { alpha: 0 }, { duration: 0.3 });
    await this.next();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('light.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.excess });
  }
}

class LightIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const sun = sunArt();
    sun.position.set(-70, -150);
    sun.scale.set(0.8);
    const beam = new Graphics().moveTo(-70, -150).lineTo(30, -150).lineTo(30, -60).stroke({ width: 16, color: 0xffe066, alpha: 0.5, cap: 'round' }).moveTo(-70, -150).lineTo(30, -150).lineTo(30, -60).stroke({ width: 6, color: 0xffe066, cap: 'round' });
    const m = mirrorArt();
    m.position.set(30, -150);
    m.scale.set(0.7);
    m.children[1].rotation = -Math.PI / 4;
    const f = new Bloom('sun');
    f.position.set(30, -60);
    f.children[1].visible = false;
    f.children[2].scale.set(1);
    c.addChild(beam, sun, m, f);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const pink = rng.chance(0.5);
  const f = new Bloom(pink ? 'pink' : 'sun');
  f.children[1].visible = false;
  f.children[2].scale.set(1);
  f.scale.set(1.6);
  const rays = new Graphics();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5;
    rays.moveTo(Math.cos(a) * 70, Math.sin(a) * 70 - 14).lineTo(Math.cos(a) * 100, Math.sin(a) * 100 - 14);
  }
  rays.stroke({ width: 8, color: pink ? swatch.pink.fill : 0xffe066, cap: 'round' });
  c.addChild(rays, f);
  return c;
}

export const lightLab: GameModule = {
  id: 'light-lab',
  name: 'Light Lab',
  titleLine: 'game.light-lab',
  region: 'tinker-lab',
  skills: ['spatial-reasoning', 'planning', 'cause-and-effect', 'light'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'Before shining, trace the path with your finger together: "The light goes here, bumps the mirror, and turns..."',
  offScreen: 'Use a hand mirror to bounce a sunbeam onto the wall, then onto a toy.',
  hubIcon: () => new LightIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new LightLab(ctx),
};
