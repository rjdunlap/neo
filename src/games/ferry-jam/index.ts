import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { HeldDirection, idle, type CouchControls } from '../../engine/controller';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { label } from '../../ui/text';
import { againIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { courseHarbors, courseMinimum, isHarborCourse } from './course';
import { HARBORS } from './harbors';
import { LEVELS, blockers, boatToward, distance, docked, FERRY, ferries, focusPath, hintSlide, parse, planFor, reach, sailed, settle, solve, solved, start, stuck, YELLOW, type FerryPlan, type Harbor, type Layout, type Slide } from './logic';

const CELL = 100;
/** Colors for the boats besides the ferry. */
const HULLS: ColorName[] = ['blue', 'green', 'purple', 'orange', 'teal', 'pink', 'yellow', 'brown', 'blue', 'green'];

/** A boat lying sideways in `len` cells, its stern at the left, drawn at the origin. A ferry is red, or yellow for the second one. */
function boatArt(len: number, ferry: boolean, color: ColorName): Container {
  const w = len * CELL;
  const sw = swatch[color];
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

/** A rounded grey boulder in a ring of foam, filling one cell and drawn about its middle. */
function rockArt(): Graphics {
  const r = CELL / 2;
  const g = new Graphics().circle(0, 4, r - 6).fill({ color: 0xffffff, alpha: 0.75 });
  g.poly([-34, 18, -38, -6, -22, -30, 6, -36, 30, -22, 38, 4, 28, 26, -6, 32]).fill(swatch.white.line).stroke({ width: 5, color: ink, alpha: 0.55, join: 'round' });
  g.poly([-24, -8, -14, -24, 6, -28, 20, -18]).stroke({ width: 6, color: swatch.white.light, alpha: 0.8, cap: 'round', join: 'round' });
  g.circle(14, 12, 5).fill({ color: ink, alpha: 0.18 });
  g.circle(-12, 16, 3.5).fill({ color: ink, alpha: 0.18 });
  return g;
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
  /** Couch play: the boat the highlight is on, and the boat she has picked up, with where it is along its lane. */
  focus = FERRY;
  grab: { boat: number; p: number; min: number; max: number } | null = null;

  private readonly board = new Container();
  private readonly water = new Graphics();
  private readonly boatLayer = new Container();
  private readonly glow = new Graphics();
  private readonly undoButton: RoundButton;
  private nodes: Container[] = [];
  /** The rocks drawn for this harbor, each with how long it has left to shake. */
  private rocks: { node: Container; x: number; shake: number }[] = [];
  private rockTold = false;
  private handles: DragHandle[] = [];
  private undoStack: Layout[] = [];
  private moves = 0;
  /** How far from the dock (in fewest slides) the boats were since the count began, then after each slide: what `stuck` reads. */
  private trail: number[] = [];
  private hinted: Slide | null = null;
  private clock = 0;
  private settled = false;
  private readonly repeat = new HeldDirection();
  private botWait = 0.8;
  private botPlan: { key: string; slide: Slide | null } | null = null;
  /** Slides beyond each harbor's fewest, added up: the couch face-off score (lower is better). */
  private excess = 0;
  /** Couch challenge course: fixed harbors in a row. Null in ordinary play, where harbors are drawn from the seed. */
  private readonly course: { minimum: number } | null;
  private done: number[] = [];
  /** Slides already spent on the harbor we are resuming, so leaving and coming back cannot erase them. */
  private carry = 0;
  private assisted = false;
  private told = false;
  /** Level 10: she is still to tap the boat in the ferry's way, and how many other boats she has tapped this harbor. */
  private asking = false;
  private askMisses = 0;
  /** After two wrong taps the boat in the way glows (one hint). */
  private askGlow = false;
  /** What the held boat can reach in its lane while it is held. */
  private held: { boat: number; min: number; max: number } | null = null;
  /** Touch layout (the undo button, no focus ring) until a key or pad is used; couch play never has it. */
  private touch: boolean;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    const run = ctx.couch?.course;
    if (run && isHarborCourse(run.id)) {
      this.harbors = courseHarbors(run.id).map((h) => h.harbor);
      this.course = { minimum: courseMinimum(run.id) };
      this.index = run.resume.board - 1;
      this.done = run.resume.done.slice();
      this.carry = run.resume.attempts;
      this.assisted = run.resume.assisted;
    } else {
      this.harbors = ctx.rng
        .shuffle([...HARBORS[Math.min(Object.keys(HARBORS).length, Math.max(1, ctx.level))]])
        .slice(0, this.plan.harbors)
        .map((rows) => parse(rows));
      this.course = null;
    }
    this.glow.eventMode = 'none';
    this.water.eventMode = 'none';
    this.board.addChild(this.water, this.boatLayer, this.glow);
    this.undoButton = new RoundButton(againIcon(), swatch.white, 54, () => this.undo());
    this.undoButton.alpha = 0.35;
    // The couch screen takes no pointer input, so the round arrow there would look like an undo and do nothing: the left button undoes.
    this.touch = !ctx.couch;
    this.undoButton.visible = this.touch;
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
    // The dock sticks out on the right, so the harbor sits a little left of center; a yellow ferry's dock sticks out below too.
    const below = this.harbor?.yellow ? 110 : 0;
    this.board.position.set(Math.max(150, (v.w - w - 110) / 2), Math.max(100, (v.h - w - below) / 2));
    this.undoButton.position.set(v.w - 80, v.h - 80);
    this.drawWater();
  }

  update(dt: number) {
    this.clock += dt;
    for (const r of this.rocks) {
      if (r.shake <= 0) continue;
      r.shake = Math.max(0, r.shake - dt);
      r.node.x = r.x + Math.sin(r.shake * 70) * 7 * (r.shake / 0.35);
    }
    const g = this.glow.clear();
    if (this.finished || this.busy) return;
    if (!this.touch) this.drawFocus(g);
    if (this.asking && this.askGlow) {
      const i = blockers(this.harbor, this.layout)[0];
      const box = this.boxOf(i, this.layout[i]);
      g.roundRect(box.x, box.y, box.width, box.height, 22).stroke({ width: 6 + 2 * Math.sin(this.clock * 6), color: swatch.yellow.fill });
    }
    if (!this.hinted) return;
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

  /** The ghost finger on the how-to card: take hold of the boat the solver's next slide moves and slide it along its lane. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.harbor || this.held) return null;
    if (this.asking) {
      const i = blockers(this.harbor, this.layout)[0];
      const node = this.nodes[i];
      if (!node || node.destroyed) return null;
      const { w, h } = this.sizeOf(i);
      return { tap: { on: node, x: w / 2, y: h / 2 } };
    }
    const slide = hintSlide(this.harbor, this.layout);
    const node = slide && this.nodes[slide.boat];
    if (!slide || !node || node.destroyed) return null;
    const { w, h } = this.sizeOf(slide.boat);
    const to = this.cellXY(slide.boat, slide.to);
    // The boat stays where it was taken hold of (`keepGrab`), so the finger goes from its middle to where its middle should be.
    return { drag: { on: node, x: w / 2, y: h / 2 }, to: { on: this.boatLayer, x: to.x, y: to.y }, lift: 0 };
  }

  private async next() {
    this.busy = true;
    this.index++;
    this.hinted = null;
    this.grab = null;
    this.moves = this.carry;
    this.carry = 0;
    this.trail = [];
    this.undoStack = [];
    this.undoButton.alpha = 0.35;
    if (this.index >= this.harbors.length) return void this.finale();
    this.harbor = this.harbors[this.index];
    this.layout = start(this.harbor);
    // The distance table is built here, while the board is still hidden, so a slide never waits for it. The couch never hints on its own.
    if (!this.ctx.couch) this.trail = [distance(this.harbor, this.layout)];
    for (const h of this.handles.splice(0)) h.destroy();
    this.boatLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.rocks = (this.harbor.rocks ?? []).map((r) => this.makeRock(r.row, r.col));
    this.nodes = this.harbor.boats.map((b, i) => this.makeBoat(i, b.len, ferries(this.harbor).includes(i)));
    this.resize(this.ctx.view);
    this.placeAll(false);
    this.board.alpha = 0;
    this.focus = FERRY;
    // Level 10 asks before any slide, on every harbor: the boats wait until she taps the one in the ferry's way.
    this.asking = !this.course && !!this.plan.ask;
    this.askMisses = 0;
    this.askGlow = false;
    for (const h of this.handles) h.enabled = !this.asking;
    await this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.3 });
    this.busy = false;
    this.report();
    if (this.asking) return this.ctx.instruct('ferry.who');
    if (this.course ? this.told : this.index > 0) return;
    this.told = true;
    if (this.course) return this.ctx.instruct('ferry.start');
    if (this.plan.entry) return this.ctx.instruct('ferry.start.one');
    return this.ctx.instruct(this.harbor.yellow ? 'ferry.both' : this.harbor.rocks?.length ? 'ferry.start.rocks' : 'ferry.start');
  }

  private makeBoat(i: number, len: number, ferry: boolean): Container {
    const b = this.harbor.boats[i];
    const node = new Container();
    // With two ferries the yellow one is boats[1], so the other boats count from 2 and never wear yellow.
    const hulls = this.harbor.yellow ? HULLS.filter((c) => c !== 'yellow') : HULLS;
    const first = this.harbor.yellow ? 2 : 1;
    const art = boatArt(len, ferry, i === FERRY ? 'red' : ferry ? 'yellow' : hulls[(i - first + hulls.length) % hulls.length]);
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
    // Level 10's question. Added after the drag, so the touch that answers finds the drag still held and does not pick the boat up.
    onTap(node, () => this.answer(i));
    return node;
  }

  /**
   * Level 10: she taps the boat she thinks is in the ferry's way. The right one lets the boats slide; another boat is a miss
   * with a spoken hint, and after two the right one glows (one hint). Tapping the ferry itself only asks again.
   */
  private answer(i: number) {
    if (!this.asking || this.busy || this.finished) return;
    const blocker = blockers(this.harbor, this.layout)[0];
    if (i === blocker) {
      this.asking = false;
      this.askGlow = false;
      for (const h of this.handles) h.enabled = true;
      sfx.bell(7);
      this.ctx.pet.cheer();
      // Praise, then the slide instruction becomes the line the pet repeats.
      void this.ctx.say('ferry.yes').then(() => this.ctx.instruct('ferry.start'));
      return;
    }
    if (i === FERRY) {
      sfx.pop(3);
      void this.ctx.say('ferry.who');
      return;
    }
    this.misses++;
    this.askMisses++;
    sfx.boing();
    if (this.askMisses === 2) {
      this.askGlow = true;
      this.hints++;
    }
    void this.ctx.say('ferry.notway');
  }

  /** A rock: touching or dragging it shakes it with a low knock. It never moves, and touching it is never a miss. */
  private makeRock(row: number, col: number) {
    const node = new Container();
    node.addChild(rockArt());
    node.hitArea = new Rectangle(-CELL / 2, -CELL / 2, CELL, CELL);
    const x = col * CELL + CELL / 2;
    node.position.set(x, row * CELL + CELL / 2);
    const rock = { node, x, shake: 0 };
    onTap(node, () => {
      if (this.busy || this.finished) return;
      rock.shake = 0.35;
      sfx.knock();
      if (this.rockTold) return;
      this.rockTold = true;
      void this.ctx.say('ferry.rock');
    });
    this.boatLayer.addChild(node);
    return rock;
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
      const node = this.nodes[i];
      // A ferry that has sailed out of a two-ferry harbor is gone until the harbor starts again.
      const gone = sailed(this.harbor, this.layout, i);
      node.visible = !gone;
      node.eventMode = gone ? 'none' : 'static';
      if (gone) return;
      node.alpha = 1;
      const at = this.cellXY(i, this.layout[i]);
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
    sfx.marimba(4 + (this.moves % 5), 0.3);
    this.report();
    this.landed();
    return true;
  }

  /**
   * After a slide. With one ferry, reaching the dock ends the harbor. With two, a ferry at its dock sails away at once
   * (the layout is settled the way the solver settles it), and the harbor ends when the second one has gone too.
   */
  private landed() {
    const i = docked(this.harbor, this.layout);
    if (i === null) return this.maybeHint();
    if (!this.harbor.yellow) return void this.sail(i);
    this.layout = settle(this.harbor, this.layout);
    if (solved(this.harbor, this.layout)) return void this.sail(i);
    void this.sailOne(i);
  }

  /** The ferry slides out through its dock: the red one to the right, the yellow one down, fading when another is still to go. */
  private fly(i: number, fade: boolean) {
    const node = this.nodes[i];
    // From the dock cell rather than the node, which may still be settling from the drop.
    const at = this.cellXY(i, this.harbor.size - this.harbor.boats[i].len);
    const to = this.harbor.boats[i].dir === 'h' ? { x: at.x + CELL * 3.2 } : { y: at.y + CELL * 2.4 };
    return this.ctx.tw.to(node, fade ? { ...to, alpha: 0 } : to, { duration: 0.9, ease: ease.inOutSine });
  }

  /** The first of two ferries has reached its dock: off it sails, and the other ferry can pass where it was. */
  private async sailOne(i: number) {
    this.busy = true;
    this.hinted = null;
    // A ferry that has sailed does not come back, so there is no slide before it to take back.
    this.undoStack = [];
    this.undoButton.alpha = 0.35;
    const node = this.nodes[i];
    node.eventMode = 'none';
    sfx.whoosh();
    await this.fly(i, true);
    node.visible = false;
    this.ctx.pet.cheer();
    sfx.sparkle();
    if (this.focus === i) this.focus = i === FERRY ? YELLOW : FERRY;
    this.busy = false;
    // The slide that sailed it still goes on the trail, once the glow could show on the boats that are left.
    this.maybeHint();
    if (!this.hinted) await this.ctx.say('ferry.one');
  }

  private undo() {
    if (this.busy || this.finished) return;
    const before = this.undoStack.pop();
    if (!before) return;
    this.hinted = null;
    this.layout = before;
    // Undo is not a slide: the slide it takes back leaves the trail too, so an undone step closer is no longer her best.
    if (this.trail.length > 1) this.trail.pop();
    this.undoButton.alpha = this.undoStack.length ? 1 : 0.35;
    this.placeAll(true);
    sfx.pop(2);
  }

  /** Slide after slide without getting any closer to the dock: point at a boat worth moving next. A longer route that keeps getting closer never earns one. */
  private maybeHint() {
    // On the couch a hint is asked for in the pause menu, never handed over.
    if (this.ctx.couch) return;
    const now = distance(this.harbor, this.layout);
    this.trail.push(now);
    if (this.hinted || !stuck(this.trail, distance(this.harbor, start(this.harbor)))) return;
    const slide = hintSlide(this.harbor, this.layout);
    if (!slide) return;
    this.hinted = slide;
    this.hints++;
    this.trail = [now];
    void this.ctx.say('ferry.hint');
  }

  /** The ferry has reached the dock (the last one, when there are two): off it sails. */
  private async sail(last = FERRY) {
    this.busy = true;
    this.hinted = null;
    const fewest = solveLength(this.harbor, start(this.harbor));
    this.excess += Math.max(0, this.moves - fewest);
    if (this.course) {
      this.done.push(this.moves);
      this.report(true);
    }
    const ferry = this.nodes[last];
    sfx.whoosh();
    await this.fly(last, false);
    const at = this.ctx.stage.toLocal(ferry.getGlobalPosition());
    this.ctx.particles.burst(at.x, at.y + 40, { kind: 'dot', colors: [0xffffff, swatch.blue.light], count: 14, speed: [60, 200], gravity: 0, life: [0.5, 0.9] });
    this.ctx.pet.cheer();
    sfx.sparkle();
    await this.ctx.say(this.moves <= fewest ? 'ferry.best' : 'ferry.out');
    if (this.course) await this.harborScore(fewest);
    await this.ctx.tw.to(this.board, { alpha: 0 }, { duration: 0.3 });
    await this.next();
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Couch play                                                                                    */
  /* -------------------------------------------------------------------------------------------- */

  /** Hand a course's numbers to the shell. `finished` means the harbor just ended, so none of its slides are "in progress". */
  private report(finished = false) {
    const run = this.ctx.couch?.course;
    if (!run || !this.course || !this.harbor) return;
    run.progress({
      board: this.index,
      boards: this.harbors.length,
      done: this.done.slice(),
      attempts: finished ? 0 : this.moves,
      par: solveLength(this.harbor, start(this.harbor)),
      minimum: this.course.minimum,
      assisted: this.assisted,
    });
  }

  /** The score for the harbor just cleared, over the board for a moment. */
  private async harborScore(fewest: number) {
    const total = this.harbors.length;
    const text = this.moves === fewest ? `Harbor ${this.index + 1} of ${total}: ${this.moves} slides, the fewest possible!` : `Harbor ${this.index + 1} of ${total}: ${this.moves} slides (fewest ${fewest})`;
    const note = label(text, 34, ink);
    note.position.set(this.board.x + (this.n * CELL) / 2, Math.max(48, this.board.y - 46));
    note.alpha = 0;
    this.ctx.stage.addChild(note);
    await this.ctx.tw.to(note, { alpha: 1 }, { duration: 0.2 });
    await this.ctx.tw.wait(1.2);
    await this.ctx.tw.to(note, { alpha: 0 }, { duration: 0.25 });
    note.destroy();
  }

  private boxOf(i: number, p: number) {
    const b = this.harbor.boats[i];
    return b.dir === 'h' ? new Rectangle(p * CELL + 4, b.row * CELL + 4, b.len * CELL - 8, CELL - 8) : new Rectangle(b.col * CELL + 4, p * CELL + 4, CELL - 8, b.len * CELL - 8);
  }

  /** The highlight on the boat the stick is on; a picked-up boat also shows the way it can slide. */
  private drawFocus(g: Graphics) {
    if (!this.harbor) return;
    const held = this.grab, i = held ? held.boat : this.focus, b = this.harbor.boats[i];
    const box = this.boxOf(i, held ? held.p : this.layout[i]);
    g.roundRect(box.x - 3, box.y - 3, box.width + 6, box.height + 6, 24).stroke({ width: held ? 8 : 6, color: ink });
    if (!held) return;
    // Arrowheads past each end of the lane it can still go along.
    const bob = 4 * Math.sin(this.clock * 8), mid = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const head = (dx: number, dy: number, ok: boolean) => {
      if (!ok) return;
      const tx = mid.x + dx * (box.width / 2 + 22 + bob), ty = mid.y + dy * (box.height / 2 + 22 + bob);
      g.poly([tx, ty, tx - dx * 18 - dy * 16, ty - dy * 18 + dx * 16, tx - dx * 18 + dy * 16, ty - dy * 18 - dx * 16]).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line, join: 'round' });
    };
    if (b.dir === 'h') { head(-1, 0, held.p > held.min); head(1, 0, held.p < held.max); }
    else { head(0, -1, held.p > held.min); head(0, 1, held.p < held.max); }
  }

  /** A finger came back after keys on the island: a boat held by keys goes back, and the undo button returns. */
  touchReturned() {
    if (this.touch || this.ctx.couch || this.finished) return;
    this.touch = true;
    if (this.grab) this.putBack();
    this.undoButton.visible = true;
  }

  control(input: CouchControls, dt: number) {
    if (this.touch) {
      // The first key or pad press on the island: the undo button goes and the focus ring shows.
      this.touch = false;
      this.undoButton.visible = false;
    }
    if (this.busy || this.finished || !this.harbor) return;
    for (const dir of this.repeat.poll(input, dt)) {
      if (this.grab) this.shift(dir);
      else this.moveFocus(dir);
    }
    // Level 10 by keys: the button answers the question with the highlighted boat.
    if (this.asking) {
      if (input.players.some((p) => p.action)) this.answer(this.focus);
      return;
    }
    if (input.players.some((p) => p.action)) {
      if (this.grab) this.setDown();
      else this.pickUp(this.focus);
    } else if (input.players.some((p) => p.undo)) {
      if (this.grab) this.putBack();
      else this.undo();
    }
  }

  private moveFocus(dir: number) {
    const next = boatToward(this.harbor, this.layout, this.focus, dir);
    if (next === null) return;
    this.focus = next;
    sfx.tick();
  }

  /** Pick the highlighted boat up: it can now slide along its lane as far as the boats and the wall allow. */
  private pickUp(i: number) {
    const { min, max } = reach(this.harbor, this.layout, i);
    this.grab = { boat: i, p: this.layout[i], min, max };
    this.hinted = null;
    this.node(i).scale.set(1.04);
    sfx.pop(3 + i);
  }

  private node(i: number) { return this.nodes[i]; }

  /** One cell along the picked-up boat's lane, if the stick points along it and there is room. */
  private shift(dir: number) {
    const g = this.grab!, b = this.harbor.boats[g.boat];
    const delta = b.dir === 'h' ? (dir === 0 ? 1 : dir === 2 ? -1 : 0) : dir === 1 ? 1 : dir === 3 ? -1 : 0;
    if (!delta) return;
    const p = Math.min(g.max, Math.max(g.min, g.p + delta));
    if (p === g.p) return void sfx.squeak();
    g.p = p;
    void this.ctx.tw.to(this.node(g.boat), this.cellXY(g.boat, p), { duration: 0.1, ease: ease.outQuad });
    sfx.tick();
  }

  /** Set the boat down where it is. A slide counts when it ends somewhere new, however far it went. */
  private setDown() {
    const g = this.grab!;
    this.grab = null;
    const node = this.node(g.boat);
    node.scale.set(1);
    const at = this.cellXY(g.boat, g.p);
    this.handles[g.boat].home = at;
    if (g.p === this.layout[g.boat]) return void sfx.pop(2);
    this.undoStack.push(this.layout.slice());
    this.layout[g.boat] = g.p;
    this.moves++;
    sfx.marimba(4 + (this.moves % 5), 0.3);
    this.report();
    this.landed();
  }

  /** Put the picked-up boat back where it was: nothing was slid, so nothing counts. */
  private putBack() {
    const g = this.grab!;
    this.grab = null;
    const node = this.node(g.boat);
    node.scale.set(1);
    void this.ctx.tw.to(node, this.cellXY(g.boat, this.layout[g.boat]), { duration: 0.12, ease: ease.outQuad });
    sfx.pop(2);
  }

  /** Couch pause menu's "Show a hint": the boat to slide next and where it goes. Marks the run helped. */
  askForHint() {
    if (this.busy || this.finished || !this.harbor) return;
    if (this.grab) this.putBack();
    const slide = hintSlide(this.harbor, this.layout);
    if (!slide) return;
    this.hinted = slide;
    this.hints++;
    this.assisted = true;
    this.focus = slide.boat;
    this.report();
    void this.ctx.say('ferry.hint');
  }

  /** Couch pause menu: put every boat back where it began. Slides already made keep counting, so a restart never improves a score. */
  restart() {
    if (this.finished || !this.harbor || this.busy) return;
    if (this.grab) this.putBack();
    this.hinted = null;
    this.layout = start(this.harbor);
    this.undoStack = [];
    this.focus = FERRY;
    this.placeAll(true);
  }

  /** The "watch me" demo: play the solver's way out, moving the highlight to each boat, picking it up, sliding it and setting it down. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    this.botWait -= dt;
    if (this.busy || this.finished || !this.harbor || this.botWait > 0) return out;
    if (this.asking) {
      // Answer the question first: move the highlight to the boat in the way and press.
      const p = out.players[0];
      p.active = true;
      const path = focusPath(this.harbor, this.layout, this.focus, blockers(this.harbor, this.layout)[0]);
      if (path?.length) p.direction = path[0];
      else p.action = true;
      this.botWait = 0.35;
      return out;
    }
    const key = this.layout.join(',');
    if (this.botPlan?.key !== key) this.botPlan = { key, slide: solve(this.harbor, this.layout)?.[0] ?? null };
    const next = this.botPlan.slide;
    if (!next) return out;
    const p = out.players[0];
    p.active = true;
    const g = this.grab, b = this.harbor.boats[next.boat];
    if (g) {
      if (g.boat !== next.boat) { p.undo = true; this.botWait = 0.3; }
      else if (g.p === next.to) { p.action = true; this.botWait = 0.4; }
      else { p.direction = b.dir === 'h' ? (next.to > g.p ? 0 : 2) : next.to > g.p ? 1 : 3; this.botWait = 0.22; }
      return out;
    }
    if (this.focus !== next.boat) {
      const path = focusPath(this.harbor, this.layout, this.focus, next.boat);
      if (!path?.length) return out;
      p.direction = path[0];
      this.botWait = 0.3;
      return out;
    }
    p.action = true;
    this.botWait = 0.35;
    return out;
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
    if (!this.harbor?.yellow) return;
    // The yellow ferry's dock: the same, turned to run out of the bottom wall below its column.
    const col = this.harbor.boats[YELLOW].col;
    g.rect(col * CELL + 10, w + 4, CELL - 20, 24).fill(swatch.blue.light);
    g.roundRect(col * CELL + 8, w + 8, CELL - 16, 100, 12).fill(wood.fill).stroke({ width: 5, color: wood.line });
    for (let y = w + 30; y < w + 104; y += 24) g.moveTo(col * CELL + 12, y).lineTo(col * CELL + CELL - 12, y).stroke({ width: 3, color: wood.line, alpha: 0.6 });
  }

  private async finale() {
    if (this.settled) return;
    this.settled = true;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('ferry.done');
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.excess });
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
  const ferry = rng.chance(0.5);
  const hull = rng.pick(HULLS);
  const boat = boatArt(2, ferry, ferry ? 'red' : hull);
  boat.scale.set(0.8);
  boat.position.set(-80, -42);
  c.addChild(boat);
  c.addChild(new Graphics().roundRect(-62, 38, 124, 10, 5).fill({ color: swatch.white.fill, alpha: 0.8 }));
  return c;
}

export const ferryJam: GameModule = {
  id: 'ferry-jam',
  liveController: true,
  name: 'Ferry Jam',
  titleLine: 'game.ferry-jam',
  region: 'puzzle-peaks',
  challenge: 'space',
  skills: ['planning', 'spatial-reasoning', 'problem-solving', 'sequencing'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: [9, 10],
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'Share the boats: one of you slides the ones lying sideways, the other the ones standing up. Talk about which has to go first.',
  offScreen: 'Slide small boxes or toy cars on a tray with a few gaps so one of them can slide out of a notch in the edge.',
  hubIcon: () => new FerryIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new FerryJam(ctx),
};
