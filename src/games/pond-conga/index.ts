import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { idle, type CouchControls } from '../../engine/controller';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { COURSES, courseMinimum, coursePonds, isCongaCourse } from './course';
import { LEVELS, DX, DY, schoolStep, tapToward, firstCrumbs, foodAt, groupOf, openCrumbs, pondLook, headAfter, hintDir, hintPath, makePond, nextCrumb, opposite, planFor, startState, step, stepDue, STEP_GLIDE, swipeDir, SWIPE, type Cell, type Conga, type Dir, type Food, type Pond, type PondLook } from './logic';
import { pondTouchLayout, type Slot } from './layout';

const WATER = 0xa9e0f2;
const WATER_LINE = 0x4f9fbf;
const RIPPLE = 0xd2f1fb;
const PAD = 0x6cbd54;
const PAD_LINE = 0x3f8a36;
const OATS = 0xf2e2bf;
const OATS_LINE = 0xb89a62;
const REED = 0x5c9a3c;
const CATTAIL = 0x7a4f2e;
/** What the tally counts: one bite of each food. */
const FOOD_WORD: Record<Food, string> = { peas: 'peas', sweetcorn: 'bits of corn', oats: 'bites of oats' };
/** Each food's colours for the pop when it is eaten. */
const FOOD_SPARK: Record<Food, number[]> = { peas: [swatch.green.fill, 0xd6f5c8], sweetcorn: [swatch.yellow.fill, 0xfff3a0], oats: [OATS, 0xfff8e8] };
/** How much of a cell a duckling fills: a little less than all of it, so a line that turns does not pile up. */
const DUCK = 0.86;
/** A breather after a bonk, so there is time to choose where to go next. */
const BREATHER = 0.9;
/** How long the leader shakes when a step is refused, in seconds. */
const SHAKE = 0.3;
/** The ghost finger's pond: steps a second, slow enough that a hand which swipes in about half a second can turn at every other step. */
const DEMO_SPEED = 1;
/** The ghost finger's pond is short: its first crumbs only, so a slow demonstration still ends within the card's time. */
const DEMO_CRUMBS = 4;
/** Seconds from the ghost finger's touch-down until its swipe has gone far enough to turn the line. */
const DEMO_SWIPE = 0.5;
/** Touch play: one finger steers, so one finger is followed. `x`, `y` is where it last came down or turned the line. */
interface Finger { id: number; x: number; y: number; moved?: boolean }

/** One duckling facing right, filling about `size` units around (0, 0). The leader has a bigger head and a red bow. */
function ducklingArt(size: number, leader: boolean): Container {
  const c = new Container();
  const g = new Graphics(), s = size;
  g.ellipse(-0.06 * s, 0, 0.4 * s, 0.31 * s).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
  g.ellipse(-0.14 * s, 0.02 * s, 0.17 * s, 0.1 * s).fill(swatch.yellow.line);
  const head = leader ? 0.25 : 0.2;
  g.circle(0.27 * s, 0, head * s).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
  g.poly([0.27 * s + head * s * 0.8, -0.08 * s, 0.27 * s + head * s * 0.8 + 0.17 * s, 0, 0.27 * s + head * s * 0.8, 0.08 * s]).fill(swatch.orange.fill).stroke({ width: 2, color: swatch.orange.line });
  g.circle(0.33 * s, -0.08 * s, 0.035 * s).fill(ink);
  g.circle(0.33 * s, 0.08 * s, 0.035 * s).fill(ink);
  if (leader) {
    g.poly([0.08 * s, 0, 0.0, -0.1 * s, 0.0, 0.1 * s]).fill(swatch.red.fill).stroke({ width: 2, color: swatch.red.line });
    g.poly([0.08 * s, 0, 0.16 * s, -0.1 * s, 0.16 * s, 0.1 * s]).fill(swatch.red.fill).stroke({ width: 2, color: swatch.red.line });
  }
  c.addChild(g);
  return c;
}

/** A little heap of duck-friendly food, about `size` across: three peas, four kernels of sweetcorn or a pile of oats. */
function foodArt(kind: Food, size: number): Container {
  const c = new Container();
  const g = new Graphics(), s = size;
  if (kind === 'peas') {
    for (const [x, y] of [[-0.15, 0.1], [0.15, 0.1], [0, -0.14]]) {
      g.circle(x * s, y * s, 0.16 * s).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
      g.circle((x - 0.05) * s, (y - 0.05) * s, 0.045 * s).fill({ color: 0xffffff, alpha: 0.8 });
    }
  } else if (kind === 'sweetcorn') {
    for (const [x, y] of [[-0.14, -0.13], [0.14, -0.13], [-0.14, 0.13], [0.14, 0.13]]) {
      g.roundRect((x - 0.12) * s, (y - 0.11) * s, 0.24 * s, 0.22 * s, 0.08 * s).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
      g.ellipse((x - 0.04) * s, (y - 0.04) * s, 0.05 * s, 0.03 * s).fill({ color: 0xffffff, alpha: 0.6 });
    }
  } else {
    // A small pile of flakes, each turned its own way, the bottom row first.
    for (const [x, y, t] of [[-0.18, 0.14, 0.4], [0.02, 0.17, -0.3], [0.2, 0.12, 0.6], [-0.1, -0.02, -0.5], [0.12, -0.03, 0.2], [0.0, -0.18, 0.9]]) {
      const flake = new Graphics().ellipse(0, 0, 0.13 * s, 0.075 * s).fill(OATS).stroke({ width: 2.5, color: OATS_LINE });
      flake.position.set(x * s, y * s);
      flake.rotation = t;
      c.addChild(flake);
    }
  }
  c.addChildAt(g, 0);
  return c;
}

/**
 * A fringe of reeds and cattails in the shallows along one bank (`side`, a `Dir` from the middle) of a pond `w` by `h`. It keeps to
 * the margin between the bank's line and the cells, so it never covers food, a lily pad or a duckling, and it is never a target.
 */
function reedArt(side: Dir, w: number, h: number): Graphics {
  const g = new Graphics();
  g.eventMode = 'none';
  const along = side === 0 || side === 2 ? h : w;
  // Measured inward from the bank's line, 14 units outside the cells: roots on the line, heads short of the first row of cells.
  const at = (t: number, d: number) => {
    const u = t - 14;
    if (side === 0) return { x: w + 14 - d, y: u };
    if (side === 2) return { x: -14 + d, y: u };
    if (side === 1) return { x: u, y: h + 14 - d };
    return { x: u, y: -14 + d };
  };
  for (let t = 18; t < along + 10; t += 15) {
    const k = Math.round(t / 15);
    const lean = ((k * 7) % 5 - 2) * 2;
    const root = at(t, 0), tip = at(t + lean, 11 + (k % 3));
    g.moveTo(root.x, root.y).lineTo(tip.x, tip.y).stroke({ width: 3, color: REED, cap: 'round' });
    if (k % 3 === 0) {
      const head = at(t + lean * 0.8, 8);
      const upright = side === 1 || side === 3;
      g.ellipse(head.x, head.y, upright ? 3 : 5, upright ? 5 : 3).fill(CATTAIL);
    }
  }
  return g;
}

/** A lily pad about `size` across, with its notch turned to `turn` and, now and then, a pink flower. */
function padArt(size: number, turn: number, flower: boolean): Container {
  const c = new Container();
  const g = new Graphics(), r = size * 0.46;
  g.moveTo(0, 0).arc(0, 0, r, turn + 0.35, turn + Math.PI * 2 - 0.35).closePath().fill(PAD).stroke({ width: 4, color: PAD_LINE });
  g.moveTo(0, 0).lineTo(Math.cos(turn + Math.PI) * r * 0.6, Math.sin(turn + Math.PI) * r * 0.6).stroke({ width: 2, color: PAD_LINE, alpha: 0.6 });
  if (flower) {
    for (let k = 0; k < 5; k++) g.circle(Math.cos(k * 1.2566) * size * 0.1, Math.sin(k * 1.2566) * size * 0.1, size * 0.07).fill(swatch.pink.fill);
    g.circle(0, 0, size * 0.06).fill(swatch.yellow.fill);
  }
  c.addChild(g);
  return c;
}

class PondConga implements Game {
  index = -1;
  /** Bonks in the whole round: the couch's misses. */
  misses = 0;
  hints = 0;
  /** Steps beyond each pond's fewest, added up: the couch face-off score (lower is better). */
  excess = 0;
  busy = true;
  finished = false;
  pond!: Pond;
  state!: Conga;
  /** Every step and every bonk on this pond. */
  tries = 0;
  /** Showing the way to the next crumb. */
  hinted = false;
  private hintCells: Cell[] = [];
  /** Waiting for the first turn of the stick, so nothing moves before somebody is ready. */
  waiting = true;

  private readonly ponds: Pond[];
  private readonly speed: number;
  /** False on level 8, Step by step: nothing moves until she asks, and each swipe, touch or press is one step. */
  readonly paced: boolean;
  /** School's ponds (10 and 11): 100-unit cells and buttons, a tap steps toward the touch, and a bump leaves the line where it was. */
  readonly school: boolean;
  /** Bumps on this pond at school: the second shows the dots by itself. */
  private bumps = 0;
  private bumpTold = false;
  /** Until when the leader shakes after a refused step. */
  private shakeUntil = 0;
  private readonly board = new Container();
  private readonly water = new Graphics();
  private readonly pads = new Container();
  private readonly trail = new Graphics();
  private readonly crumbs = new Container();
  private readonly line = new Container();
  /** Touch play (every play outside the couch): a swipe on the pond turns the line and a touch sets off. Couch play drives the same pond with a controller. */
  touch: boolean;
  /** Catches the swipes: the whole pond is one target, so the cells (which can be under 64 units wide) are never touched one by one. */
  readonly tapLayer = new Graphics();
  readonly touchLayer = new Container();
  slots: Slot[] = [];
  slotNodes: Container[] = [];
  private pressed: { slot: number; until: number } | null = null;
  private finger: Finger | null = null;
  private readonly buttons = new Graphics();
  private readonly buttonText = new Container();
  private readonly top = label('', 30, ink);
  private readonly note = label('', 26, ink, '500');
  /** The next bit of food and the faint one after it: holders whose picture is this pond's food. */
  private readonly crumbNext = new Container();
  private readonly crumbAfter = new Container();
  /** Level 7's third bite of a group: a group of three shows at once, all at full strength. */
  private readonly crumbThird = new Container();
  /** The round's food and reed bank, from its seed; a course's ponds take the next food in turn. */
  private readonly look: PondLook;
  private food: Food = 'peas';
  private readonly reeds = new Container();
  private ducks: Container[] = [];
  private cell = 56;
  private clock = 0;
  private acc = 0;
  private breather = 0;
  /** The line as it was one step ago, to glide from. */
  private before: Cell[] = [];
  private queue: Dir[] = [];
  private view: View;
  private botWait = 0.9;
  /** Whether the line is still on the pond's own route, which is what the demo bot follows. */
  private onRoute = true;
  private routeAt = 0;
  /** Steps and bumps so far on this pond, for the ghost finger to count the beat by. */
  private ticks = 0;
  private told = false;
  private bonked = false;
  private ate = false;
  private settled = false;
  /** Couch challenge course: fixed ponds in a row. Null in ordinary play, where one pond is made from the seed. */
  private readonly course: { minimum: number } | null;
  private done: number[] = [];
  /** Steps already spent on the pond we are resuming, so leaving and coming back cannot erase them. */
  private carry = 0;
  private assisted = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    const run = ctx.couch?.course;
    this.look = pondLook(ctx.rng);
    if (run && isCongaCourse(run.id)) {
      this.ponds = coursePonds(run.id);
      this.speed = COURSES[run.id].speed;
      this.paced = true;
      this.course = { minimum: courseMinimum(run.id) };
      this.index = run.resume.board - 1;
      this.done = run.resume.done.slice();
      this.carry = run.resume.attempts;
      this.assisted = run.resume.assisted;
    } else {
      const plan = planFor(ctx.level);
      const pond = makePond(plan, ctx.rng);
      this.ponds = [ctx.demo && !ctx.couch ? firstCrumbs(pond, DEMO_CRUMBS) : pond];
      this.speed = plan.speed;
      this.paced = plan.paced !== false;
      this.course = null;
    }
    this.school = ctx.band === 'school' && !ctx.couch && !this.paced;
    for (const part of [this.board, this.water, this.reeds, this.pads, this.trail, this.crumbs, this.line, this.top, this.note]) part.eventMode = 'none';
    this.crumbs.addChild(this.crumbAfter, this.crumbThird, this.crumbNext);
    this.board.addChild(this.water, this.reeds, this.pads, this.trail, this.crumbs, this.line);
    ctx.stage.addChild(this.board, this.top, this.note);
    this.touch = !ctx.couch;
    if (this.touch) {
      this.tapLayer.eventMode = 'static';
      this.tapLayer.cursor = 'pointer';
      this.tapLayer.on('pointerdown', (e) => this.fingerDown(e));
      this.tapLayer.on('globalpointermove', (e) => this.fingerMove(e));
      for (const end of ['pointerup', 'pointerupoutside', 'pointercancel'] as const) this.tapLayer.on(end, (e) => this.fingerUp(e));
      this.buttons.eventMode = 'none';
      this.buttonText.eventMode = 'none';
      ctx.stage.addChild(this.buttons, this.buttonText, this.tapLayer, this.touchLayer);
    }
  }

  start() { void this.next(); }

  /* -------------------------------------------------------------------------------------------- */
  /* Layout and drawing                                                                            */
  /* -------------------------------------------------------------------------------------------- */

  resize(v: View) {
    this.view = v;
    if (!this.pond) return;
    if (this.touch) return this.resizeTouch(v);
    // Clear of the buttons along the top, the controller reminder along the bottom, and the pet in the corner (a crumb must never hide behind it).
    this.cell = Math.max(24, Math.min(80, Math.floor((v.w - 60) / this.pond.cols), Math.floor((v.h - 312) / this.pond.rows)));
    this.board.position.set((v.w - this.pond.cols * this.cell) / 2, 138);
    this.top.position.set(v.w / 2, 96);
    this.note.position.set(v.w / 2, v.h - 130);
    this.layout();
  }

  /**
   * Touch layout: the pond under the tally with Hint and Start over beneath it, and a line of help under those. The pond is one
   * target for a swipe, so its cells may be under 64 units; the two buttons are always at least 64 across and tall. The home and
   * help buttons sit in the top-left corner, so the pond keeps to the right of them (a crumb must never hide behind one), or on a
   * tall view goes below them.
   */
  private resizeTouch(v: View) {
    const p = this.pond, fit = pondTouchLayout(p.cols, p.rows, v.w, v.h, this.school);
    this.cell = fit.cell;
    const w = p.cols * this.cell, h = p.rows * this.cell;
    this.board.position.set(fit.x, fit.y);
    this.top.position.set(v.w / 2, 96);
    this.slots = fit.slots;
    this.note.position.set(v.w / 2, fit.noteY);
    this.tapLayer.clear().rect(0, 0, w, h).fill({ color: 0xffffff, alpha: 0.001 });
    this.tapLayer.hitArea = new Rectangle(0, 0, w, h);
    this.tapLayer.position.copyFrom(this.board.position);
    for (const node of this.touchLayer.removeChildren()) node.destroy();
    this.slotNodes = this.slots.map((slot, k) => {
      const node = new Container();
      node.position.set(slot.x, slot.y);
      node.hitArea = new Rectangle(0, 0, slot.w, slot.h);
      onTap(node, () => this.tapSlot(k), { cooldown: 60 });
      this.touchLayer.addChild(node);
      return node;
    });
    this.layout();
    this.paintButtons();
  }

  /** Hint and Start over, each a tile that sinks while it is pressed. */
  private paintButtons() {
    const g = this.buttons.clear();
    this.buttonText.removeChildren().forEach((c) => c.destroy());
    this.slots.forEach((s, k) => {
      const down = this.pressed?.slot === k && this.clock < this.pressed.until ? 3 : 0;
      const sw = s.kind === 'hint' ? swatch.blue : swatch.teal;
      g.roundRect(s.x, s.y + 4, s.w, s.h, 14).fill(sw.line);
      g.roundRect(s.x, s.y + down, s.w, s.h, 14).fill(sw.light).stroke({ width: 3, color: sw.line });
      const t = label(s.kind === 'hint' ? 'Hint ◇' : 'Start over ↺', 24, ink);
      if (t.width > s.w - 14) t.scale.set((s.w - 14) / t.width);
      t.position.set(s.x + s.w / 2, s.y + s.h / 2 + down);
      this.buttonText.addChild(t);
    });
  }

  private center(c: Cell) {
    return { x: c.x * this.cell + this.cell / 2, y: c.y * this.cell + this.cell / 2 };
  }

  /** The water, the lily pads and the crumbs' size. */
  private layout() {
    const p = this.pond, cell = this.cell, w = p.cols * cell, h = p.rows * cell;
    this.water.clear().roundRect(-14, -14, w + 28, h + 28, 26).fill(WATER).stroke({ width: 6, color: WATER_LINE });
    for (let k = 0; k < p.cols * 2; k++) {
      const x = (k * 97) % (w - 40), y = (k * 53 + 17) % (h - 8);
      this.water.moveTo(x + 10, y + 6).lineTo(x + 38, y + 6).stroke({ width: 3, color: RIPPLE, cap: 'round' });
    }
    this.reeds.removeChildren().forEach((c) => c.destroy());
    this.reeds.addChild(reedArt(this.look.reeds, w, h));
    this.pads.removeChildren().forEach((c) => c.destroy({ children: true }));
    p.pads.forEach((pad, i) => {
      const art = padArt(cell, (i * 1.7) % (Math.PI * 2), i % 3 === 0);
      const at = this.center(pad);
      art.position.set(at.x, at.y);
      this.pads.addChild(art);
    });
    for (const art of [this.crumbNext, this.crumbAfter, this.crumbThird]) art.scale.set(cell / 70);
    this.ducks.forEach((d, i) => d.scale.set(DUCK * cell / 100 * (i === 0 ? 1.06 : 1)));
  }

  /** Make sure there is a duckling picture for every duckling in the line. */
  private grow() {
    while (this.ducks.length < this.state.body.length) {
      const leader = this.ducks.length === 0;
      const d = ducklingArt(100, leader);
      d.scale.set(DUCK * this.cell / 100 * (leader ? 1.06 : 1));
      d.eventMode = 'none';
      this.ducks.push(d);
      this.line.addChildAt(d, 0);
    }
  }

  /** Every frame: the line glides from where it was to where it is, the next crumb pulses, and the hint's dots show. */
  private draw(glide: number) {
    if (!this.pond) return;
    const body = this.state.body, before = this.before;
    this.grow();
    this.ducks.forEach((d, i) => {
      d.visible = i < body.length;
      if (i >= body.length) return;
      const to = this.center(body[i]), from = this.center(before[i] ?? body[i]);
      d.position.set(from.x + (to.x - from.x) * glide, from.y + (to.y - from.y) * glide);
      if (i === 0 && this.clock < this.shakeUntil) d.x += Math.sin(this.clock * 60) * this.cell * 0.06;
      const ahead = i === 0 ? null : body[i - 1];
      const dir = ahead ? this.toward(body[i], ahead) : this.state.heading;
      d.rotation = dir * Math.PI / 2;
    });
    const pulse = 1 + 0.07 * Math.sin(this.clock * 5);
    if (groupOf(this.pond) > 1) {
      // A group shows together, every bite at full strength, and nothing of the next group: she picks the order.
      const open = openCrumbs(this.pond, this.state);
      [this.crumbNext, this.crumbAfter, this.crumbThird].forEach((holder, i) => {
        holder.visible = !!open[i];
        if (!open[i]) return;
        const at = this.center(open[i]);
        holder.position.set(at.x, at.y);
        holder.scale.set(this.cell / 70 * pulse);
        holder.alpha = 1;
      });
    } else this.drawNextAndAfter(pulse);
    const t = this.trail.clear();
    if (this.hinted && !this.busy) {
      for (const c of this.hintCells) {
        const m = this.center(c);
        t.circle(m.x, m.y, this.cell * 0.13).fill({ color: swatch.yellow.fill, alpha: 0.95 }).stroke({ width: 2, color: swatch.yellow.line });
      }
    }
  }

  /** One bite at a time: the next at full strength and a faint look at the one after. */
  private drawNextAndAfter(pulse: number) {
    const next = nextCrumb(this.pond, this.state), after = this.pond.crumbs[this.state.eaten + 1];
    this.crumbNext.visible = !!next;
    this.crumbAfter.visible = !!after;
    this.crumbThird.visible = false;
    if (next) {
      const at = this.center(next);
      this.crumbNext.position.set(at.x, at.y);
      this.crumbNext.scale.set(this.cell / 70 * pulse);
    }
    if (after) {
      const at = this.center(after);
      this.crumbAfter.position.set(at.x, at.y);
      this.crumbAfter.scale.set(this.cell / 70 * 0.62);
      this.crumbAfter.alpha = 0.5;
    }
  }

  /** The dots of a hint: the next few cells of the way to the crumb from where the line is now. Worked out once a step, not every frame. */
  private refreshHint() {
    this.hintCells = [];
    if (!this.hinted) return;
    let at = this.state.body[0];
    for (const d of hintPath(this.pond, this.state).slice(0, 7)) {
      at = { x: at.x + [1, 0, -1, 0][d], y: at.y + [0, 1, 0, -1][d] };
      this.hintCells.push(at);
    }
  }

  private toward(from: Cell, to: Cell): Dir {
    return to.x > from.x ? 0 : to.y > from.y ? 1 : to.x < from.x ? 2 : 3;
  }

  update(dt: number) {
    this.clock += dt;
    if (!this.pond) return;
    if (this.pressed && this.clock >= this.pressed.until) { this.pressed = null; this.paintButtons(); }
    let glide = 1;
    if (!this.busy && !this.finished && !this.waiting && !this.paced) {
      // Step by step: a step only when one was asked for, once the one before it has landed.
      this.acc += dt;
      while (stepDue({ paced: false, speed: this.speed }, this.acc, this.queue.length) && !this.busy && !this.finished) {
        this.acc = 0;
        this.tick();
      }
      glide = this.busy ? 1 : Math.min(1, this.acc / STEP_GLIDE);
    } else if (!this.busy && !this.finished && !this.waiting) {
      if (this.breather > 0) {
        this.breather = Math.max(0, this.breather - dt);
        if (this.breather === 0) this.acc = 0;
      } else {
        this.acc += dt;
        const period = 1 / this.pace();
        while (this.acc >= period && !this.busy && this.breather <= 0 && !this.finished) {
          this.acc -= period;
          this.tick();
        }
        glide = this.breather > 0 || this.busy ? 1 : Math.min(1, this.acc / period);
      }
    }
    this.draw(glide);
  }

  destroy() {}

  /** Steps a second. The how-to card's demonstration by a finger paddles slower, so the hand has time to swipe each turn. */
  private pace() {
    return this.ctx.demo && this.touch ? Math.min(this.speed, DEMO_SPEED) : this.speed;
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Rounds and ponds                                                                              */
  /* -------------------------------------------------------------------------------------------- */

  private async next() {
    this.busy = true;
    this.index++;
    if (this.index >= this.ponds.length) return void this.finale();
    this.pond = this.ponds[this.index];
    this.food = foodAt(this.look, this.index);
    for (const holder of [this.crumbNext, this.crumbAfter, this.crumbThird]) {
      holder.removeChildren().forEach((c) => c.destroy({ children: true }));
      holder.addChild(foodArt(this.food, 70));
    }
    this.state = startState(this.pond);
    this.before = this.state.body.map((c) => ({ ...c }));
    this.tries = this.carry;
    this.carry = 0;
    this.bumps = 0;
    this.bumpTold = false;
    this.queue = [];
    this.hinted = false;
    this.waiting = true;
    this.acc = 0;
    this.breather = 0;
    this.onRoute = true;
    this.routeAt = 0;
    this.ducks.forEach((d) => d.destroy({ children: true }));
    this.ducks = [];
    this.line.removeChildren();
    this.resize(this.view);
    this.tally();
    this.board.alpha = 0;
    await this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.3 });
    this.busy = false;
    this.report();
    if (this.told) return;
    this.told = true;
    if (this.school) return this.ctx.instruct('conga.go-school');
    if (!this.paced) return this.ctx.instruct(this.touch ? 'conga.steps-touch' : 'conga.steps');
    if (groupOf(this.pond) > 1) return this.ctx.instruct(this.touch ? 'conga.order-touch' : 'conga.order');
    return this.ctx.instruct(this.touch ? 'conga.go-touch' : 'conga.go');
  }

  private tally() {
    const n = this.pond.crumbs.length;
    this.top.text = `${this.tries} ${this.tries === 1 ? 'step' : 'steps'}  ·  ${Math.min(this.state.eaten, n)} of ${n} ${FOOD_WORD[this.food]}`;
    this.note.text = this.school && this.touch ? 'Swipe, or tap beside the leader: one step each time'
      : !this.paced
      ? (this.touch ? 'Swipe for one step that way, or touch the pond for a step straight on' : 'Press a direction for each step')
      : this.waiting ? (this.touch ? 'Touch the pond to set off, then swipe to turn' : 'Press a direction to set off') : '';
  }

  /** Hand a course's numbers to the shell. `finished` means the pond just ended, so none of its steps are "in progress". */
  private report(finished = false) {
    const run = this.ctx.couch?.course;
    if (!run || !this.course) return;
    run.progress({
      board: this.index,
      boards: this.ponds.length,
      done: this.done.slice(),
      attempts: finished ? 0 : this.tries,
      par: this.pond.par,
      minimum: this.course.minimum,
      assisted: this.assisted,
    });
  }

  /** One step of the line, at the pace the pond sets. */
  private tick() {
    const want = this.takeTurn();
    if (want !== null && want !== this.state.heading) sfx.tick();
    const r = this.school ? schoolStep(this.pond, this.state, want) : { ...step(this.pond, this.state, want), held: false };
    const heading = r.state.heading;
    this.tries++;
    this.ticks++;
    if (r.held) this.refused(want ?? this.state.heading);
    else if (r.event === 'bonk') {
      this.misses++;
      this.before = r.state.body.map((c) => ({ ...c }));
      this.state = r.state;
      this.onRoute = false;
      // Step by step needs no breather: nothing moves until the next swipe anyway.
      this.breather = this.paced ? BREATHER : 0;
      this.queue = [];
      this.acc = 0;
      sfx.boing();
      this.ctx.pet.hop(0.5);
      this.bonkAt(r.state.body[0]);
      if (!this.bonked) {
        this.bonked = true;
        void this.ctx.say('conga.bonk');
      }
    } else {
      this.before = this.state.body.map((c) => ({ ...c }));
      this.state = r.state;
      if (this.onRoute && this.pond.route[this.routeAt] === heading) this.routeAt++;
      else this.onRoute = false;
      if (r.event === 'crumb') this.crumbEaten();
    }
    this.refreshHint();
    this.tally();
    if (r.event === 'crumb' && this.state.eaten >= this.pond.crumbs.length) void this.pondDone();
    else this.report();
  }

  /**
   * A bump at school: a refused step. The line stays where it was with a boing and a shake of the leader; it counts as a miss,
   * and the second on a pond shows the dots to the next bite without counting a hint.
   */
  private refused(to: Dir) {
    this.misses++;
    this.bumps++;
    this.onRoute = false;
    this.queue = [];
    this.acc = STEP_GLIDE;
    this.before = this.state.body.map((c) => ({ ...c }));
    sfx.boing();
    this.ctx.pet.hop(0.5);
    const lead = this.state.body[0];
    this.bonkAt({ x: lead.x + DX[to] * 0.5, y: lead.y + DY[to] * 0.5 });
    this.shakeUntil = this.clock + SHAKE;
    if (this.bumps === 2 && !this.hinted) this.hinted = true;
    if (!this.bumpTold) {
      this.bumpTold = true;
      void this.ctx.say('conga.bonk-school');
    }
  }

  /** The next turn she asked for that still makes sense: one that goes straight back is dropped. */
  private takeTurn(): Dir | null {
    while (this.queue.length) {
      const d = this.queue.shift()!;
      if (d !== opposite(this.state.heading)) return d;
    }
    return null;
  }

  private crumbEaten() {
    const at = this.ctx.stage.toLocal(this.board.toGlobal(this.center(this.state.body[0])));
    this.ctx.particles.burst(at.x, at.y, { kind: 'star', colors: [...FOOD_SPARK[this.food], 0xffffff], count: 10, speed: [90, 220], gravity: 0, life: [0.35, 0.7] });
    sfx.pop(2 + (this.state.eaten % 7));
    this.hinted = false;
    this.hintCells = [];
    if (!this.ate) {
      this.ate = true;
      void this.ctx.say(`conga.yum.${this.food}`);
    }
  }

  /** A little burst where the leader bumped, so the bump is seen as well as heard. */
  private bonkAt(cell: Cell) {
    const at = this.ctx.stage.toLocal(this.board.toGlobal(this.center(cell)));
    this.ctx.particles.burst(at.x, at.y, { kind: 'star', colors: [swatch.orange.fill, 0xffffff], count: 8, speed: [80, 190], gravity: 0, life: [0.3, 0.55] });
    const text = label('Bonk!', 34, swatch.orange.line);
    text.position.set(at.x, at.y - this.cell * 0.9);
    this.ctx.stage.addChild(text);
    void this.ctx.tw.to(text, { y: text.y - 24, alpha: 0 }, { duration: 0.8 }).then(() => text.destroy());
  }

  /** The score for the pond just cleared, over the board for a moment. */
  private async pondScore() {
    const best = this.pond.par, total = this.ponds.length;
    const text = this.tries === best
      ? `Pond ${this.index + 1} of ${total}: ${this.tries} steps, the fewest possible!`
      : `Pond ${this.index + 1} of ${total}: ${this.tries} steps (fewest ${best})`;
    const note = label(text, 32, ink);
    note.position.set(this.view.w / 2, 100);
    note.alpha = 0;
    this.top.visible = false;
    this.ctx.stage.addChild(note);
    await this.ctx.tw.to(note, { alpha: 1 }, { duration: 0.2 });
    await this.ctx.tw.wait(1.3);
    await this.ctx.tw.to(note, { alpha: 0 }, { duration: 0.25 });
    note.destroy();
    this.top.visible = true;
  }

  private async pondDone() {
    this.busy = true;
    this.hinted = false;
    this.hintCells = [];
    this.excess += Math.max(0, this.tries - this.pond.par);
    if (this.course) {
      this.done.push(this.tries);
      this.report(true);
    }
    sfx.sparkle();
    this.ctx.pet.cheer();
    // The whole line does a little hop.
    for (let i = 0; i < this.ducks.length; i++) {
      const d = this.ducks[i];
      void this.ctx.tw.wait(i * 0.05).then(() => this.ctx.tw.to(d, { y: d.y - this.cell * 0.28 }, { duration: 0.14 })).then(() => this.ctx.tw.to(d, { y: d.y + this.cell * 0.28 }, { duration: 0.16 }));
    }
    const mid = this.ctx.stage.toLocal(this.board.toGlobal({ x: (this.pond.cols * this.cell) / 2, y: (this.pond.rows * this.cell) / 2 }));
    this.ctx.particles.burst(mid.x, mid.y, { kind: 'star', colors: [0xffffff, ...FOOD_SPARK[this.food]], count: 28, speed: [160, 420], gravity: 0, life: [0.6, 1.1] });
    // A course moves straight on after a short score; ordinary play praises.
    if (this.course) await this.pondScore();
    else await this.ctx.say('conga.pond');
    await this.ctx.tw.to(this.board, { alpha: 0 }, { duration: 0.3 });
    await this.next();
  }

  private async finale() {
    if (this.settled) return;
    this.settled = true;
    this.finished = true;
    this.top.visible = false;
    this.note.visible = false;
    this.touchLayer.visible = false;
    this.tapLayer.visible = false;
    this.buttons.visible = false;
    this.buttonText.visible = false;
    sfx.tada();
    await this.ctx.say('conga.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.excess });
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Controls                                                                                      */
  /* -------------------------------------------------------------------------------------------- */

  /** A finger on the pond: a ring where it landed; a swipe from here turns the line, and lifting without one sets it off. */
  private fingerDown(e: FederatedPointerEvent) {
    if (palmOnGlass() || this.busy || this.finished || !this.pond) return;
    const at = this.tapLayer.toLocal(e.global);
    if (!Number.isFinite(at.x) || !Number.isFinite(at.y)) return;
    // The newest finger is the one that steers, so a release that never arrived cannot leave an old one in charge.
    this.finger = { id: e.pointerId, x: at.x, y: at.y };
    this.ripple(e);
  }

  /** A finger that has gone far enough one way turns the line, and starts over from there, so one stroke can turn it twice. */
  private fingerMove(e: FederatedPointerEvent) {
    const f = this.finger;
    if (!f || f.id !== e.pointerId || this.busy || this.finished || !this.pond) return;
    const at = this.tapLayer.toLocal(e.global);
    if (!Number.isFinite(at.x) || !Number.isFinite(at.y)) return;
    if (!this.paced && f.moved) return;
    const dir = swipeDir(at.x - f.x, at.y - f.y);
    if (dir === null) return;
    // Step by step: one stroke is one step, however far it goes.
    f.moved = true;
    f.x = at.x;
    f.y = at.y;
    this.press(dir);
  }

  /** Lifting a finger that did not turn anything is a tap: it sets the line off straight ahead (a swipe sets it off already turned). */
  private fingerUp(e: FederatedPointerEvent) {
    if (this.finger?.id !== e.pointerId) return;
    const moved = this.finger.moved;
    this.finger = null;
    if (this.busy || this.finished || !this.pond) return;
    if (!moved && this.school) {
      // School: a tap steps toward where it lands; on the leader or straight back it does nothing.
      const at = this.tapLayer.toLocal(e.global), from = this.queue.at(-1) ?? this.state.heading;
      const lead = this.queue.length ? null : this.state.body[0];
      const dir = lead && Number.isFinite(at.x) && Number.isFinite(at.y) ? tapToward(lead, at.x, at.y, this.cell, from) : null;
      if (dir !== null) this.press(dir);
      return;
    }
    if (!this.paced) { if (!moved) this.press(this.queue.at(-1) ?? this.state.heading); return; }
    if (this.waiting) this.press(this.state.heading);
  }

  /** A ring where the finger came down, so the touch is seen the moment it lands. */
  private ripple(e: FederatedPointerEvent) {
    const at = this.ctx.stage.toLocal(e.global);
    if (!Number.isFinite(at.x) || !Number.isFinite(at.y)) return;
    const ring = new Graphics().circle(0, 0, 26).stroke({ width: 5, color: swatch.blue.line, alpha: 0.8 });
    ring.eventMode = 'none';
    ring.position.set(at.x, at.y);
    this.ctx.stage.addChild(ring);
    void this.ctx.tw.to(ring, { alpha: 0 }, { duration: 0.4 });
    void this.ctx.tw.to(ring.scale, { x: 2, y: 2 }, { duration: 0.4 }).then(() => ring.destroy());
  }

  /** A finger on a button. It sinks at once. */
  private tapSlot(k: number) {
    if (this.busy || this.finished || !this.pond) return;
    const s = this.slots[k];
    this.pressed = { slot: k, until: this.clock + 0.15 };
    if (s.kind === 'hint') this.askForHint();
    else this.restart();
    this.paintButtons();
  }

  /** Only a controller (the couch, or the couch's own demonstration) calls `control`: from then on the pond is laid out for it. */
  private useController() {
    this.touch = false;
    this.finger = null;
    this.touchLayer.visible = false;
    this.tapLayer.visible = false;
    this.buttons.visible = false;
    this.buttonText.visible = false;
    this.tally();
    this.resize(this.view);
  }

  /** A finger came back after keys: the pond goes back to its touch layout. */
  touchReturned() {
    if (this.touch || this.finished || !this.pond) return;
    this.touch = true;
    this.touchLayer.visible = true;
    this.tapLayer.visible = true;
    this.buttons.visible = true;
    this.buttonText.visible = true;
    this.tally();
    this.resize(this.view);
  }

  control(input: CouchControls) {
    if (this.touch) this.useController();
    if (this.busy || this.finished || !this.pond) return;
    for (const p of input.players) {
      if (p.direction >= 0) this.press(p.direction as Dir);
      else if (p.action && (this.waiting || !this.paced)) this.press(this.queue.at(-1) ?? this.state.heading);
    }
  }

  /** A turn of the stick: the first one sets the line off; after that a turn waits for the next step, two at most, and straight back is ignored. */
  private press(dir: Dir) {
    if (!this.paced) {
      // Step by step: every press is one step that way (straight on included), two can wait in line, and straight back does nothing.
      const last = this.queue.at(-1) ?? this.state.heading;
      if (dir === opposite(last) || this.queue.length >= 2) return;
      if (this.waiting) {
        this.waiting = false;
        this.acc = STEP_GLIDE;
      }
      this.queue.push(dir);
      return;
    }
    if (this.waiting) {
      this.waiting = false;
      this.acc = 0;
      this.queue = dir === this.state.heading || dir === opposite(this.state.heading) ? [] : [dir];
      this.tally();
      return;
    }
    if (this.queue.length >= 2) return;
    const last = this.queue.at(-1) ?? this.state.heading;
    if (dir === last || dir === opposite(last)) return;
    this.queue.push(dir);
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Help                                                                                          */
  /* -------------------------------------------------------------------------------------------- */

  /** Couch pause menu's "Show a hint": dots along the way to the next crumb, until it is eaten. Marks the run helped. */
  askForHint() {
    if (this.busy || this.finished || !this.pond) return;
    this.hinted = true;
    this.hints++;
    this.assisted = true;
    this.refreshHint();
    this.report();
    void this.ctx.say('conga.hint');
  }

  /** Couch pause menu: put the line back at the start of the pond. Steps already taken keep counting, so a restart never improves a score. */
  restart() {
    if (this.finished || !this.pond || this.busy) return;
    this.state = startState(this.pond);
    this.before = this.state.body.map((c) => ({ ...c }));
    this.ducks.forEach((d) => d.destroy({ children: true }));
    this.ducks = [];
    this.line.removeChildren();
    this.queue = [];
    this.hinted = false;
    this.waiting = true;
    this.acc = 0;
    this.breather = 0;
    this.onRoute = true;
    this.routeAt = 0;
    this.hintCells = [];
    this.tally();
    this.report();
  }

  /* -------------------------------------------------------------------------------------------- */
  /* The "watch me" demo                                                                           */
  /* -------------------------------------------------------------------------------------------- */

  /**
   * The ghost finger on the how-to card: touch the pond and lift to set off straight ahead, or swipe to set off turned; then
   * swipe each turn of the way to the crumb. A swipe takes about half a second to go far enough to count, so the hand lands a
   * step or so ahead and presses when the swipe will end between the step before the turn and the turn itself (`when`). Turns
   * on neighbouring steps are one stroke.
   */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.pond || !this.touch || this.queue.length) return null;
    const period = 1 / this.pace(), s0 = this.state, t0 = this.ticks, bonks = this.misses;
    const plan = this.onRoute ? this.pond.route.slice(this.routeAt) : hintPath(this.pond, this.state);
    if (!plan.length) return null;
    // How many steps until the line has to turn (0: at the very next step).
    const turnsAt = (i: number) => plan[i] !== undefined && plan[i] !== (i === 0 ? s0.heading : plan[i - 1]);
    const j = plan.findIndex((_, i) => turnsAt(i));
    const spot = (head: Cell, dir: Dir, along: number) => {
      const c = this.center(head);
      return { on: this.board, x: c.x + DX[dir] * along, y: c.y + DY[dir] * along };
    };
    const reach = SWIPE * 1.7;
    if (!this.paced) {
      // Step by step: one touch or one short stroke a step, once the last step has landed.
      if (!this.waiting && this.acc < STEP_GLIDE) return null;
      const head = s0.body[0], d = plan[0];
      // At school a tap on the leader does nothing: tap the cell it is to go to.
      if (d === s0.heading) return { tap: spot(head, d, this.school ? this.cell : 0), receiver: this.tapLayer, pause: 0.2 };
      return { trace: spot(head, d, -reach / 2), via: [spot(head, d, reach / 2)], receiver: this.tapLayer, pause: 0.2 };
    }
    // One stroke: back from the turn's cell, along the first direction, then along the direction of each turn on the steps right after it (three at most:
    // the turns wait in line and are made one a step, and a leg of the stroke takes half a second, so the line never holds more than two).
    const stroke = (when?: () => boolean | 'cancel'): TouchIntent => {
      const head = headAfter(this.pond, s0, plan, j), first = plan[j], from = spot(head, first, -reach / 2);
      const via = [spot(head, first, reach / 2)];
      for (let k = 1; k < 3 && turnsAt(j + k); k++) {
        const last = via[via.length - 1], d = plan[j + k];
        via.push({ on: this.board, x: last.x + DX[d] * reach, y: last.y + DY[d] * reach });
      }
      return { trace: from, via, receiver: this.tapLayer, pause: 0.1, when };
    };
    // Nothing moves until the line is set off, so there is no moment to hit.
    if (this.waiting) return j === 0 ? stroke() : { tap: spot(s0.body[0], s0.heading, 0), receiver: this.tapLayer, pause: 0.15 };
    if (j < 0 || (j === 0 && this.breather <= 0)) return null;
    const when = () => {
      if (this.busy || this.finished || this.queue.length || this.misses !== bonks) return 'cancel';
      // A bump gives a breather in which no step is taken: there is time to swipe.
      if (this.breather > 0) return true;
      // The swipe counts `DEMO_SWIPE` seconds after the hand lands. It has to count after the step before the turn and before the turn's
      // own step, with a tenth of a step to spare at each end: land as soon as that is so, and give it up once it cannot be.
      const rem = j - (this.ticks - t0), before = rem * period - this.acc;
      if (rem < 1) return 'cancel';
      if (DEMO_SWIPE > before + period - 0.1 * period) return 'cancel';
      return DEMO_SWIPE >= before + 0.1 * period;
    };
    return stroke(when);
  }

  /** A bot that paddles a fewest-steps route: the pond's own while the line is on it, else straight to the next crumb. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    this.botWait -= dt;
    if (this.busy || this.finished || !this.pond || this.botWait > 0) return out;
    const want = this.onRoute ? this.pond.route[this.routeAt] ?? this.state.heading : hintDir(this.pond, this.state);
    const p = out.players[0];
    p.active = true;
    if (!this.paced) {
      // One press a step, each after the last has landed.
      if (this.queue.length || (!this.waiting && this.acc < STEP_GLIDE)) return out;
      p.direction = want;
      this.botWait = 0.25;
      return out;
    }
    if (this.waiting) { p.direction = want; return out; }
    const last = this.queue.at(-1) ?? this.state.heading;
    if (want !== last && this.queue.length === 0) p.direction = want;
    return out;
  }
}

/* ---------------------------------------------------------------------------------------------- */
/* The game's picture                                                                              */
/* ---------------------------------------------------------------------------------------------- */

class PondIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    c.addChild(new Graphics().roundRect(-130, -190, 260, 170, 26).fill(WATER).stroke({ width: 6, color: WATER_LINE }));
    const pad = padArt(70, 0.6, true);
    pad.position.set(78, -128);
    c.addChild(pad);
    const peas = foodArt('peas', 54);
    peas.position.set(-96, -138);
    c.addChild(peas);
    [-64, 0, 64].forEach((x) => {
      const d = ducklingArt(70, x === 64);
      d.position.set(x, -92);
      c.addChild(d);
    });
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, 78).fill(WATER).stroke({ width: 6, color: WATER_LINE }));
  const d = ducklingArt(130, true);
  d.rotation = rng.range(-0.3, 0.3);
  d.position.set(0, 2);
  c.addChild(d);
  return c;
}

export const pondConga: GameModule = {
  id: 'pond-conga',
  liveController: true,
  name: 'Pond Conga',
  titleLine: 'game.pond-conga',
  region: 'puzzle-peaks',
  challenge: 'hands',
  skills: ['planning', 'steering', 'sequencing'],
  bands: ['school', 'grownup'],
  entryLevels: [8, 10, 11],
  inputs: ['touch', 'controller'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.lullaby,
  upright: true,
  coplayHint: 'On the step-by-step ponds, take turns: one of you says which way, the other swipes or taps.',
  offScreen: 'Walk a duckling line together: the leader picks the way, everyone follows, and nobody crosses the line.',
  touchDemo: true,
  hubIcon: () => new PondIcon(),
  sticker,
  create: (ctx) => new PondConga(ctx),
};
