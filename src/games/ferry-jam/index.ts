import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { HeldDirection, idle, type CouchControls } from '../../engine/controller';
import { draggable, type DragHandle } from '../../engine/drag';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { label } from '../../ui/text';
import { againIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { courseHarbors, courseMinimum, isHarborCourse } from './course';
import { HARBORS } from './harbors';
import { atDock, boatToward, FERRY, focusPath, hintSlide, parse, planFor, reach, solve, start, type FerryPlan, type Harbor, type Layout, type Slide } from './logic';

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
  /** Couch play: the boat the highlight is on, and the boat she has picked up, with where it is along its lane. */
  focus = FERRY;
  grab: { boat: number; p: number; min: number; max: number } | null = null;

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
  /** What the held boat can reach in its lane while it is held. */
  private held: { boat: number; min: number; max: number } | null = null;

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
    this.undoButton.visible = !ctx.couch;
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
    if (this.finished || this.busy) return;
    if (this.ctx.couch) this.drawFocus(g);
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
    this.focus = FERRY;
    await this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.3 });
    this.busy = false;
    this.report();
    if (this.course ? this.told : this.index > 0) return;
    this.told = true;
    return this.ctx.instruct('ferry.start');
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
    this.report();
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
    // On the couch a hint is asked for in the pause menu, never handed over.
    if (this.ctx.couch) return;
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
    this.excess += Math.max(0, this.moves - fewest);
    if (this.course) {
      this.done.push(this.moves);
      this.report(true);
    }
    const ferry = this.nodes[FERRY];
    sfx.whoosh();
    await this.ctx.tw.to(ferry, { x: ferry.x + CELL * 3.2 }, { duration: 0.9, ease: ease.inOutSine });
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

  control(input: CouchControls, dt: number) {
    if (this.busy || this.finished || !this.harbor) return;
    for (const dir of this.repeat.poll(input, dt)) {
      if (this.grab) this.shift(dir);
      else this.moveFocus(dir);
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
    if (atDock(this.harbor, this.layout)) void this.sail();
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
  touchDemo: true,
  sticker,
  create: (ctx) => new FerryJam(ctx),
};
