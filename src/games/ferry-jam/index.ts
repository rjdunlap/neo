import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch, wood, type ColorName } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { againIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { HARBORS } from './harbors';
import { atDock, FERRY, hintSlide, parse, planFor, reach, solve, start, type FerryPlan, type Harbor, type Layout, type Slide } from './logic';

const LEVELS: BandLevels = {
  prek: { min: 1, max: 4 },
  school: { min: 3, max: 6 },
};

const CELL = 100;
/** Colors for the boats besides the ferry. */
const HULLS: ColorName[] = ['blue', 'green', 'purple', 'orange', 'teal', 'pink', 'yellow', 'brown', 'blue', 'green'];

/** A boat lying sideways in `len` cells, its stern at the left, drawn at the origin. */
function boatArt(len: number, ferry: boolean, color: ColorName): Container {
  const w = len * CELL;
  const sw = swatch[ferry ? 'red' : color];
  const g = new Graphics()
    .roundRect(6, 16, w - 12, CELL - 32, 30).fill(sw.line)
    .roundRect(6, 10, w - 12, CELL - 32, 30).fill(sw.fill).stroke({ width: 5, color: sw.line })
    .roundRect(22, 26, w - 44, CELL - 62, 16).fill(sw.light);
  if (ferry) {
    // A cabin with a funnel and a flag at the bow.
    g.roundRect(w * 0.2, 22, w * 0.44, CELL - 54, 12).fill(0xffffff).stroke({ width: 4, color: swatch.white.line });
    g.roundRect(w * 0.34, 8, 22, 22, 6).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
    g.moveTo(w - 26, 18).lineTo(w - 26, -4).stroke({ width: 4, color: swatch.brown.line, cap: 'round' });
    g.poly([w - 26, -4, w - 6, 3, w - 26, 10]).fill(swatch.yellow.fill).stroke({ width: 2, color: swatch.yellow.line, join: 'round' });
    for (const x of [0.28, 0.4, 0.52]) g.circle(w * x, 42, 6).fill(swatch.blue.light).stroke({ width: 2, color: swatch.blue.line });
  } else {
    for (let i = 0; i < len; i++) g.circle(CELL * (i + 0.5), 40, 9).fill(0xffffff).stroke({ width: 3, color: sw.line });
  }
  const c = new Container();
  c.addChild(g);
  return c;
}

class FerryJam implements Game {
  readonly plan: FerryPlan;
  readonly harbors: Harbor[];
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  harbor!: Harbor;
  layout: Layout = [];

  private readonly board = new Container();
  private readonly water = new Graphics();
  private readonly boatLayer = new Container();
  private readonly glow = new Graphics();
  private readonly undoButton: RoundButton;
  private nodes: Container[] = [];
  private handles: DragHandle[] = [];
  private undoStack: Layout[] = [];
  private moves = 0;
  private sinceHint = 0;
  private hinted: Slide | null = null;
  private clock = 0;
  private settled = false;
  /** What the held boat can reach in its lane while it is held. */
  private held: { boat: number; min: number; max: number } | null = null;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.harbors = ctx.rng
      .shuffle([...HARBORS[Math.min(Object.keys(HARBORS).length, Math.max(1, ctx.level))]])
      .slice(0, this.plan.harbors)
      .map((rows) => parse(rows));
    this.glow.eventMode = 'none';
    this.water.eventMode = 'none';
    this.board.addChild(this.water, this.boatLayer, this.glow);
    this.undoButton = new RoundButton(againIcon(), swatch.white, 54, () => this.undo());
    this.undoButton.alpha = 0.35;
    ctx.stage.addChild(this.board, this.undoButton);
  }

  get n() {
    return this.harbor?.size ?? this.plan.size;
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    const w = this.n * CELL;
    // The dock sticks out on the right, so the harbor sits a little left of center.
    this.board.position.set(Math.max(150, (v.w - w - 110) / 2), Math.max(100, (v.h - w) / 2));
    this.undoButton.position.set(v.w - 80, v.h - 80);
    this.drawWater();
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.finished || this.busy || !this.hinted) return;
    const b = this.harbor.boats[this.hinted.boat];
    const at = this.layout[this.hinted.boat];
    const box = (p: number) => (b.dir === 'h' ? new Rectangle(p * CELL + 4, b.row * CELL + 4, b.len * CELL - 8, CELL - 8) : new Rectangle(b.col * CELL + 4, p * CELL + 4, CELL - 8, b.len * CELL - 8));
    const pulse = 6 + 2 * Math.sin(this.clock * 6);
    const now = box(at);
    g.roundRect(now.x, now.y, now.width, now.height, 22).stroke({ width: pulse, color: swatch.yellow.fill });
    const to = box(this.hinted.to);
    g.roundRect(to.x, to.y, to.width, to.height, 22).stroke({ width: 4, color: swatch.yellow.fill, alpha: 0.7 });
  }

  destroy() {
    for (const h of this.handles) h.destroy();
  }

  private async next() {
    this.busy = true;
    this.index++;
    this.hinted = null;
    this.moves = 0;
    this.sinceHint = 0;
    this.undoStack = [];
    this.undoButton.alpha = 0.35;
    if (this.index >= this.harbors.length) return void this.finale();
    this.harbor = this.harbors[this.index];
    this.layout = start(this.harbor);
    for (const h of this.handles.splice(0)) h.destroy();
    this.boatLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.nodes = this.harbor.boats.map((b, i) => this.makeBoat(i, b.len, i === FERRY));
    this.resize(this.ctx.view);
    this.placeAll(false);
    this.board.alpha = 0;
    await this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.3 });
    this.busy = false;
    if (this.index === 0) return this.ctx.instruct('ferry.start');
  }

  private makeBoat(i: number, len: number, ferry: boolean): Container {
    const b = this.harbor.boats[i];
    const node = new Container();
    const art = boatArt(len, ferry, HULLS[(i - 1 + HULLS.length) % HULLS.length]);
    if (b.dir === 'v') {
      // Stand it up: turned a quarter, with its corner kept at the node's origin.
      art.rotation = Math.PI / 2;
      art.x = CELL;
    }
    node.addChild(art);
    const { w, h } = this.sizeOf(i);
    node.hitArea = new Rectangle(0, 0, w, h);
    // The node sits on the boat's middle, so the grow-a-little feel of a pick-up is about its centre.
    node.pivot.set(w / 2, h / 2);
    this.boatLayer.addChild(node);
    const handle = draggable(node, this.ctx.tw, {
      lift: 0,
      keepGrab: true,
      onPick: () => this.pick(i),
      onMove: () => this.slideTo(i),
      onDrop: () => this.drop(i),
    });
    this.handles.push(handle);
    return node;
  }

  private sizeOf(i: number): { w: number; h: number } {
    const b = this.harbor.boats[i];
    return b.dir === 'h' ? { w: b.len * CELL, h: CELL } : { w: CELL, h: b.len * CELL };
  }

  /** Where a boat's middle sits (its node's position) with its lane position at `p`. */
  private cellXY(i: number, p: number): { x: number; y: number } {
    const b = this.harbor.boats[i];
    const { w, h } = this.sizeOf(i);
    return b.dir === 'h' ? { x: p * CELL + w / 2, y: b.row * CELL + h / 2 } : { x: b.col * CELL + w / 2, y: p * CELL + h / 2 };
  }

  private placeAll(animate: boolean) {
    this.harbor.boats.forEach((_, i) => {
      const at = this.cellXY(i, this.layout[i]);
      const node = this.nodes[i];
      node.scale.set(1);
      if (animate) void this.ctx.tw.to(node, at, { duration: 0.2, ease: ease.outQuad });
      else node.position.set(at.x, at.y);
      this.handles[i].home = at;
    });
  }

  private pick(i: number) {
    if (this.busy || this.finished) return;
    this.hinted = null;
    const { min, max } = reach(this.harbor, this.layout, i);
    this.held = { boat: i, min, max };
    sfx.pop(3 + i);
  }

  /** The held boat follows the finger along its lane, and stops where another boat or the harbor wall is. */
  private slideTo(i: number) {
    if (!this.held || this.held.boat !== i) return;
    const b = this.harbor.boats[i];
    const node = this.nodes[i];
    const lo = this.cellXY(i, this.held.min);
    const hi = this.cellXY(i, this.held.max);
    if (b.dir === 'h') {
      node.x = Math.min(hi.x, Math.max(lo.x, node.x));
      node.y = lo.y;
    } else {
      node.y = Math.min(hi.y, Math.max(lo.y, node.y));
      node.x = lo.x;
    }
  }

  private drop(i: number): boolean {
    const held = this.held;
    this.held = null;
    if (!held || held.boat !== i || this.busy || this.finished) return false;
    const b = this.harbor.boats[i];
    const node = this.nodes[i];
    const { w, h } = this.sizeOf(i);
    const p = Math.min(held.max, Math.max(held.min, Math.round((b.dir === 'h' ? node.x - w / 2 : node.y - h / 2) / CELL)));
    const was = this.layout[i];
    const at = this.cellXY(i, p);
    node.scale.set(1);
    void this.ctx.tw.to(node, at, { duration: 0.12, ease: ease.outQuad });
    this.handles[i].home = at;
    if (p === was) return true;
    this.undoStack.push(this.layout.slice());
    this.undoButton.alpha = 1;
    this.layout[i] = p;
    this.moves++;
    this.sinceHint++;
    sfx.marimba(4 + (this.moves % 5), 0.3);
    if (atDock(this.harbor, this.layout)) void this.sail();
    else this.maybeHint();
    return true;
  }

  private undo() {
    if (this.busy || this.finished) return;
    const before = this.undoStack.pop();
    if (!before) return;
    this.hinted = null;
    this.layout = before;
    this.undoButton.alpha = this.undoStack.length ? 1 : 0.35;
    this.placeAll(true);
    sfx.pop(2);
  }

  /** Lots of slides without getting there: point at a boat worth moving next. The first harbors stay hint-free for a while. */
  private maybeHint() {
    const fewest = solveLength(this.harbor, start(this.harbor));
    if (this.sinceHint < Math.max(8, fewest * 2) || this.hinted) return;
    const slide = hintSlide(this.harbor, this.layout);
    if (!slide) return;
    this.hinted = slide;
    this.hints++;
    this.sinceHint = 0;
    void this.ctx.say('ferry.hint');
  }

  /** The ferry has reached the dock: off it sails. */
  private async sail() {
    this.busy = true;
    this.hinted = null;
    const fewest = solveLength(this.harbor, start(this.harbor));
    const ferry = this.nodes[FERRY];
    sfx.whoosh();
    await this.ctx.tw.to(ferry, { x: ferry.x + CELL * 3.2 }, { duration: 0.9, ease: ease.inOutSine });
    const at = this.ctx.stage.toLocal(ferry.getGlobalPosition());
    this.ctx.particles.burst(at.x, at.y + 40, { kind: 'dot', colors: [0xffffff, swatch.blue.light], count: 14, speed: [60, 200], gravity: 0, life: [0.5, 0.9] });
    this.ctx.pet.cheer();
    sfx.sparkle();
    await this.ctx.say(this.moves <= fewest ? 'ferry.best' : 'ferry.out');
    await this.ctx.tw.to(this.board, { alpha: 0 }, { duration: 0.3 });
    await this.next();
  }

  private drawWater() {
    const w = this.n * CELL;
    const g = this.water.clear();
    g.roundRect(-14, -14, w + 28, w + 28, 26).fill(swatch.blue.light).stroke({ width: 7, color: wood.line });
    for (let r = 0; r < this.n; r++)
      for (let c = 0; c < this.n; c++) g.roundRect(c * CELL + 5, r * CELL + 5, CELL - 10, CELL - 10, 16).fill({ color: swatch.blue.fill, alpha: (r + c) % 2 ? 0.18 : 0.28 });
    // The dock: a gap in the wall on the ferry's row, with planks running out of the harbor.
    const exit = this.harbor ? this.harbor.boats[FERRY].row : 1;
    g.rect(w + 4, exit * CELL + 10, 24, CELL - 20).fill(swatch.blue.light);
    g.roundRect(w + 8, exit * CELL + 8, 100, CELL - 16, 12).fill(wood.fill).stroke({ width: 5, color: wood.line });
    for (let x = w + 30; x < w + 104; x += 24) g.moveTo(x, exit * CELL + 12).lineTo(x, exit * CELL + CELL - 12).stroke({ width: 3, color: wood.line, alpha: 0.6 });
  }

  private async finale() {
    if (this.settled) return;
    this.settled = true;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('ferry.done');
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

const fewestSlides = new WeakMap<Harbor, number>();
/** The fewest slides to finish a harbor from where it began (the frozen harbors are all solvable; tests check). */
function solveLength(h: Harbor, from: Layout): number {
  let n = fewestSlides.get(h);
  if (n === undefined) {
    n = solve(h, from)?.length ?? 8;
    fewestSlides.set(h, n);
  }
  return n;
}

class FerryIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const panel = new Graphics().roundRect(-100, -210, 200, 200, 22).fill(swatch.blue.light).stroke({ width: 6, color: wood.line });
    c.addChild(panel);
    const ferry = boatArt(2, true, 'red');
    ferry.scale.set(0.6);
    ferry.position.set(-84, -132);
    const small = boatArt(2, false, 'green');
    small.scale.set(0.6);
    small.position.set(-6, -190);
    small.rotation = 0;
    const tall = boatArt(3, false, 'orange');
    tall.scale.set(0.6);
    tall.rotation = Math.PI / 2;
    tall.position.set(70, -188);
    const wide = boatArt(2, false, 'purple');
    wide.scale.set(0.6);
    wide.position.set(-90, -70);
    c.addChild(ferry, small, tall, wide);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, 80).fill(swatch.blue.light).stroke({ width: 6, color: swatch.blue.line }));
  const boat = boatArt(2, rng.chance(0.5), rng.pick(HULLS));
  boat.scale.set(0.8);
  boat.position.set(-80, -42);
  c.addChild(boat);
  c.addChild(new Graphics().roundRect(-62, 38, 124, 10, 5).fill({ color: swatch.white.fill, alpha: 0.8 }));
  return c;
}

export const ferryJam: GameModule = {
  id: 'ferry-jam',
  name: 'Ferry Jam',
  titleLine: 'game.ferry-jam',
  region: 'puzzle-peaks',
  skills: ['planning', 'spatial-reasoning', 'problem-solving', 'sequencing'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'Ask: which boat is in the ferry\'s way? Where does it have to go?',
  offScreen: 'Slide small boxes or toy cars on a tray with a few gaps so one of them can slide out of a notch in the edge.',
  hubIcon: () => new FerryIcon(),
  sticker,
  create: (ctx) => new FerryJam(ctx),
};
