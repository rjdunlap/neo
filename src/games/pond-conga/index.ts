import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { idle, type CouchControls } from '../../engine/controller';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { COURSES, courseMinimum, coursePonds, isCongaCourse } from './course';
import { DX, DY, firstCrumbs, headAfter, hintDir, hintPath, makePond, nextCrumb, opposite, planFor, startState, step, swipeDir, SWIPE, type Cell, type Conga, type Dir, type Pond } from './logic';

/** Grown-up play only: this game lives in Lantern Lake, played by touch or on the couch. */
const LEVELS: BandLevels = { grownup: { min: 1, max: 6 } };

const WATER = 0xa9e0f2;
const WATER_LINE = 0x4f9fbf;
const RIPPLE = 0xd2f1fb;
const PAD = 0x6cbd54;
const PAD_LINE = 0x3f8a36;
const BREAD = 0xf2d199;
const BREAD_LINE = 0xbf8a45;
/** How much of a cell a duckling fills: a little less than all of it, so a line that turns does not pile up. */
const DUCK = 0.86;
/** A breather after a bonk, so there is time to choose where to go next. */
const BREATHER = 0.9;
/** The smallest touch target in a grown-up game, in logical units. */
const MIN_TOUCH = 64;
/** The ghost finger's pond: steps a second, slow enough that a hand which swipes in about half a second can turn at every other step. */
const DEMO_SPEED = 1;
/** The ghost finger's pond is short: its first crumbs only, so a slow demonstration still ends within the card's time. */
const DEMO_CRUMBS = 4;
/** Seconds from the ghost finger's touch-down until its swipe has gone far enough to turn the line. */
const DEMO_SWIPE = 0.5;
type SlotKind = 'hint' | 'again';
interface Slot { kind: SlotKind; x: number; y: number; w: number; h: number }
/** Touch play: one finger steers, so one finger is followed. `x`, `y` is where it last came down or turned the line. */
interface Finger { id: number; x: number; y: number }

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

/** A piece of bread, about `size` across. */
function crumbArt(size: number): Container {
  const c = new Container();
  const g = new Graphics(), s = size;
  g.roundRect(-0.32 * s, -0.28 * s, 0.64 * s, 0.56 * s, 0.14 * s).fill(BREAD).stroke({ width: 4, color: BREAD_LINE });
  for (const [x, y] of [[-0.12, -0.06], [0.1, 0.08], [0.0, 0.14], [0.14, -0.12]]) g.circle(x * s, y * s, 0.032 * s).fill(BREAD_LINE);
  g.ellipse(-0.14 * s, -0.17 * s, 0.1 * s, 0.045 * s).fill({ color: 0xffffff, alpha: 0.5 });
  c.addChild(g);
  return c;
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
  private crumbNext = crumbArt(70);
  private crumbAfter = crumbArt(70);
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
    if (run && isCongaCourse(run.id)) {
      this.ponds = coursePonds(run.id);
      this.speed = COURSES[run.id].speed;
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
      this.course = null;
    }
    for (const part of [this.board, this.water, this.pads, this.trail, this.crumbs, this.line, this.top, this.note]) part.eventMode = 'none';
    this.crumbs.addChild(this.crumbAfter, this.crumbNext);
    this.board.addChild(this.water, this.pads, this.trail, this.crumbs, this.line);
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
    const p = this.pond, btn = 76, rest = 16 + btn + 44 + 12;
    const beside = Math.min(80, Math.floor((v.w - 124 - 24) / p.cols), Math.floor((v.h - 132 - rest) / p.rows));
    const below = Math.min(80, Math.floor((v.w - 60) / p.cols), Math.floor((v.h - 212 - rest) / p.rows));
    const top = beside >= below ? 132 : 212;
    this.cell = Math.max(24, Math.max(beside, below));
    const w = p.cols * this.cell, h = p.rows * this.cell, x = top === 132 ? Math.max(124, (v.w - w) / 2) : (v.w - w) / 2;
    this.board.position.set(x, top);
    this.top.position.set(v.w / 2, 96);
    const by = top + h + 16, bw = Math.max(MIN_TOUCH, Math.min(210, Math.floor((v.w - 2 * 170) / 2)));
    this.slots = (['hint', 'again'] as const).map((kind, k) => ({ kind, x: v.w / 2 - bw - 8 + k * (bw + 16), y: by, w: bw, h: btn }));
    this.note.position.set(v.w / 2, by + btn + 28);
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
    this.pads.removeChildren().forEach((c) => c.destroy({ children: true }));
    p.pads.forEach((pad, i) => {
      const art = padArt(cell, (i * 1.7) % (Math.PI * 2), i % 3 === 0);
      const at = this.center(pad);
      art.position.set(at.x, at.y);
      this.pads.addChild(art);
    });
    for (const art of [this.crumbNext, this.crumbAfter]) art.scale.set(cell / 70);
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
      const ahead = i === 0 ? null : body[i - 1];
      const dir = ahead ? this.toward(body[i], ahead) : this.state.heading;
      d.rotation = dir * Math.PI / 2;
    });
    const next = nextCrumb(this.pond, this.state), after = this.pond.crumbs[this.state.eaten + 1];
    this.crumbNext.visible = !!next;
    this.crumbAfter.visible = !!after;
    const pulse = 1 + 0.07 * Math.sin(this.clock * 5);
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
    const t = this.trail.clear();
    if (this.hinted && !this.busy) {
      for (const c of this.hintCells) {
        const m = this.center(c);
        t.circle(m.x, m.y, this.cell * 0.13).fill({ color: swatch.yellow.fill, alpha: 0.95 }).stroke({ width: 2, color: swatch.yellow.line });
      }
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
    if (!this.busy && !this.finished && !this.waiting) {
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
    this.state = startState(this.pond);
    this.before = this.state.body.map((c) => ({ ...c }));
    this.tries = this.carry;
    this.carry = 0;
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
    return this.ctx.instruct(this.touch ? 'conga.go-touch' : 'conga.go');
  }

  private tally() {
    const n = this.pond.crumbs.length;
    this.top.text = `${this.tries} ${this.tries === 1 ? 'step' : 'steps'}  ·  ${Math.min(this.state.eaten, n)} of ${n} crumbs`;
    this.note.text = this.waiting ? (this.touch ? 'Touch the pond to set off, then swipe to turn' : 'Press a direction to set off') : '';
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
    const r = step(this.pond, this.state, want);
    const heading = r.state.heading;
    this.tries++;
    this.ticks++;
    if (r.event === 'bonk') {
      this.misses++;
      this.before = r.state.body.map((c) => ({ ...c }));
      this.state = r.state;
      this.onRoute = false;
      this.breather = BREATHER;
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
    this.ctx.particles.burst(at.x, at.y, { kind: 'star', colors: [BREAD, 0xfff3a0, 0xffffff], count: 10, speed: [90, 220], gravity: 0, life: [0.35, 0.7] });
    sfx.pop(2 + (this.state.eaten % 7));
    this.hinted = false;
    this.hintCells = [];
    if (!this.ate) {
      this.ate = true;
      void this.ctx.say('conga.crumb');
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
    this.ctx.particles.burst(mid.x, mid.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, BREAD], count: 28, speed: [160, 420], gravity: 0, life: [0.6, 1.1] });
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
    const dir = swipeDir(at.x - f.x, at.y - f.y);
    if (dir === null) return;
    f.x = at.x;
    f.y = at.y;
    this.press(dir);
  }

  /** Lifting a finger that did not turn anything is a tap: it sets the line off straight ahead (a swipe sets it off already turned). */
  private fingerUp(e: FederatedPointerEvent) {
    if (this.finger?.id !== e.pointerId) return;
    this.finger = null;
    if (this.waiting && !this.busy && !this.finished && this.pond) this.press(this.state.heading);
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

  control(input: CouchControls) {
    if (this.touch) this.useController();
    if (this.busy || this.finished || !this.pond) return;
    for (const p of input.players) {
      if (p.direction >= 0) this.press(p.direction as Dir);
      else if (p.action && this.waiting) this.press(this.state.heading);
    }
  }

  /** A turn of the stick: the first one sets the line off; after that a turn waits for the next step, two at most, and straight back is ignored. */
  private press(dir: Dir) {
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
    const bread = crumbArt(54);
    bread.position.set(-96, -138);
    c.addChild(bread);
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
  name: 'Pond Conga',
  titleLine: 'game.pond-conga',
  region: 'puzzle-peaks',
  skills: ['planning', 'steering', 'sequencing'],
  bands: ['grownup'],
  inputs: ['touch', 'controller'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.lullaby,
  touchDemo: true,
  hubIcon: () => new PondIcon(),
  sticker,
  create: (ctx) => new PondConga(ctx),
};
