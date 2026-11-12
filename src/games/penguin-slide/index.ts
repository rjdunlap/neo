import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { penguinArt } from '../../art/animals';
import { ink, swatch } from '../../art/palette';
import { puffs } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { idle, type CouchControls } from '../../engine/controller';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { RoundButton } from '../../ui/buttons';
import { againIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { courseBoards, courseMinimum, isPondCourse } from './course';
import {
  LEVELS,
  beside,
  cellAt,
  eaten,
  HINT_AFTER,
  makePrediction,
  makePuzzle,
  move,
  movePair,
  pickLook,
  planFor,
  solve,
  solvePair,
  solved,
  stopper,
  tapDirection,
  type Cell,
  type Dir,
  type FishColor,
  type RockLook,
  type ShownSlide,
  type SlidePlan,
  type SlidePuzzle,
} from './logic';

const CELL = 100;
const ICE = 0xe3f4ff;

function fishArt(color: FishColor = 'orange'): Graphics {
  const g = new Graphics();
  const { fill, line } = swatch[color];
  g.poly([22, 0, 40, -16, 40, 16]).fill(fill).stroke({ width: 4, color: line, join: 'round' });
  g.ellipse(0, 0, 28, 17).fill(fill).stroke({ width: 4, color: line });
  g.circle(-12, -4, 4).fill(ink);
  return g;
}

/** A pond's stoppers: a snowy rock, a small igloo or a snowman, all the same to the stop rule. */
function rockArt(look: RockLook = 'rock'): Graphics {
  if (look === 'igloo') {
    const g = new Graphics()
      .moveTo(-40, 30)
      .arc(0, 30, 40, Math.PI, 0)
      .closePath()
      .fill(0xffffff)
      .stroke({ width: 5, color: 0x8fb3d6, join: 'round' });
    for (const r of [14, 27])
      g.moveTo(-Math.sqrt(40 * 40 - r * r), 30 - r)
        .lineTo(Math.sqrt(40 * 40 - r * r), 30 - r)
        .stroke({ width: 3, color: 0xc9d6e6, cap: 'round' });
    return g.moveTo(-14, 30).arc(0, 30, 14, Math.PI, 0).closePath().fill(0x5a7a99);
  }
  if (look === 'snowman') {
    const g = puffs(
      new Graphics(),
      [
        [0, 12, 32],
        [0, -26, 22],
      ],
      0xffffff,
      0x8fb3d6,
      5,
    );
    g.roundRect(-20, -10, 40, 10, 5).fill(swatch.red.fill).stroke({ width: 3, color: swatch.red.line });
    g.circle(-8, -30, 3.5).circle(8, -30, 3.5).fill(ink);
    return g.poly([0, -24, 20, -20, 0, -17]).fill(swatch.orange.fill);
  }
  const g = new Graphics()
    .poly([-40, 30, -34, -14, -12, -34, 18, -32, 38, -6, 40, 30])
    .fill(0x9aa6b8)
    .stroke({ width: 5, color: 0x6b778a, join: 'round' });
  return puffs(
    g,
    [
      [-14, -28, 16],
      [10, -30, 18],
      [28, -14, 12],
    ],
    0xffffff,
    0xc9d6e6,
    4,
  );
}

function softArt(): Graphics {
  return puffs(
    new Graphics(),
    [
      [-24, 10, 22],
      [0, 2, 26],
      [24, 10, 22],
      [-10, 20, 20],
      [12, 20, 20],
    ],
    0xffffff,
    0xc9d6e6,
    4,
  );
}

/** A star mark on the ice, where an ice block has to stop. */
function starArt(): Graphics {
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 17 : 38,
      a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(r * Math.cos(a), r * Math.sin(a));
  }
  return new Graphics()
    .poly(pts)
    .fill({ color: swatch.yellow.fill, alpha: 0.85 })
    .stroke({ width: 5, color: swatch.yellow.line, join: 'round' });
}

/** The second penguin on the two-penguin ponds: the same penguin in a red scarf. */
function scarfedPenguin(): Container {
  const c = penguinArt();
  const g = new Graphics()
    .roundRect(-25, 12, 50, 13, 6)
    .fill(swatch.red.fill)
    .stroke({ width: 3, color: swatch.red.line });
  g.roundRect(8, 18, 13, 26, 5).fill(swatch.red.fill).stroke({ width: 3, color: swatch.red.line });
  c.addChild(g);
  return c;
}

function blockArt(): Container {
  const c = new Container();
  const g = new Graphics()
    .roundRect(-42, -42, 84, 84, 16)
    .fill(0xa8dcff)
    .stroke({ width: 5, color: 0x5aa7e0, join: 'round' });
  g.roundRect(-30, -30, 60, 60, 10).fill({ color: 0xd7f0ff, alpha: 0.9 });
  g.moveTo(-26, -8).lineTo(-8, -26).stroke({ width: 5, color: 0xffffff, cap: 'round' });
  g.moveTo(-26, 12).lineTo(12, -26).stroke({ width: 3, color: 0xffffff, alpha: 0.8, cap: 'round' });
  c.addChild(g);
  return c;
}

interface Step {
  spots: Cell[];
  who: 0 | 1;
  have: number;
  blocks: Cell[];
}

class PenguinSlide implements Game {
  readonly plan: SlidePlan;
  puzzle!: SlidePuzzle;
  /** Where each penguin is: the first, and on two-penguin ponds the scarf penguin. */
  spots: Cell[] = [{ x: 0, y: 0 }];
  /** The chosen penguin, the one the next slide moves. */
  who: 0 | 1 = 0;
  have = 0;
  /** Where each ice block is now (the puzzle's own list is where they started). */
  blocks: Cell[] = [];
  moves = 0;
  index = -1;
  misses = 0;
  hints = 0;
  /** Slides beyond each board's best route, added up: the couch face-off score (lower is better). */
  excess = 0;
  busy = true;
  finished = false;
  readonly penguins: Container[] = [penguinArt(), scarfedPenguin()];
  readonly board = new Container();
  readonly undo: RoundButton;

  private readonly floor = new Graphics();
  private readonly things = new Container();
  private readonly arrow = new Graphics();
  private readonly glow = new Graphics();
  /** The soft ring on the tapped side of the penguin at touch-down. */
  private readonly scuff = new Graphics();
  /** This round's ponds so far, so level 1 can cap its single-slide ponds. */
  private made: SlidePuzzle[] = [];
  /** The pond's seeded look; couch courses keep the plain one. */
  private look: { rock: RockLook; fish: FishColor } = { rock: 'rock', fish: 'orange' };
  private fishNodes: Graphics[] = [];
  private blockNodes: Container[] = [];
  private rockNodes: Graphics[] = [];
  /** Level 11: the slides this pond shows, the one being predicted, and the cell the keys' ring is on. */
  private shown: ShownSlide[] = [];
  private step = 0;
  private focus: Cell = { x: 0, y: 0 };
  /** Her prediction for the slide under way: drawn as a ring and judged when the penguin stops. */
  private guess: Cell | null = null;
  private readonly ring = new Graphics();
  /** The solver's answer for the state it was asked about, so the hint arrow does not search every frame. */
  private route: { key: string; first: Dir | -1; who: 0 | 1; moves: number } | null = null;
  private history: Step[] = [];
  private hinting = false;
  private stuck = false;
  private view: View;
  private clock = 0;
  private botWait = 0.8;
  /** Couch challenge course: fixed ponds in a row. Null in ordinary play, where boards are generated. */
  private readonly course: { boards: SlidePuzzle[]; minimum: number } | null;
  /** Slides taken on each finished pond, undone ones included. */
  private done: number[] = [];
  /** Slides already spent on the pond we are resuming, so leaving and coming back cannot erase them. */
  private carry = 0;
  private assisted = false;
  private told = false;
  /** A restart asked for mid-slide waits until the penguin has stopped. */
  private again = false;
  /** Touch layout (the undo button) until a key or pad is used; couch play never has it. */
  private touch: boolean;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const run = ctx.couch?.course;
    if (run && isPondCourse(run.id)) {
      this.course = { boards: courseBoards(run.id), minimum: courseMinimum(run.id) };
      this.index = run.resume.board - 1;
      this.done = run.resume.done.slice();
      this.carry = run.resume.attempts;
      this.assisted = run.resume.assisted;
    } else this.course = null;
    this.arrow.eventMode = 'none';
    this.glow.eventMode = 'none';
    for (const n of this.penguins) n.eventMode = 'none';
    this.scuff.eventMode = 'none';
    this.ring.eventMode = 'none';
    this.board.addChild(this.floor, this.things, this.ring, this.scuff, ...this.penguins, this.arrow);
    this.board.eventMode = 'static';
    onTap(this.board, (e) => void this.tapIce(e), { cooldown: 150 });
    this.undo = new RoundButton(againIcon(), swatch.white, 54, () => this.back());
    // The couch screen takes no pointer input, so a round arrow there would look like a restart and do nothing.
    // Controllers undo with the left button and restart from the pause menu.
    // Prediction ponds have no undo: every shown slide goes ahead.
    this.undo.visible = !ctx.couch && !this.plan.predict;
    this.touch = !ctx.couch;
    ctx.stage.addChild(this.board, this.undo, this.glow);
  }

  start() {
    void this.next();
  }

  /** The chosen penguin's cell (the only penguin's, on ponds with one). */
  get at(): Cell {
    return this.spots[this.who];
  }

  set at(c: Cell) {
    this.spots[this.who] = c;
  }

  get penguin(): Container {
    return this.penguins[this.who];
  }

  /** A two-penguin pond (level 13). */
  get pair(): boolean {
    return !!this.puzzle?.pal;
  }

  private at2(c: Cell) {
    return { x: (c.x + 0.5) * CELL, y: (c.y + 0.5) * CELL };
  }

  resize(v: View) {
    this.view = v;
    if (!this.puzzle) return;
    const w = this.puzzle.cols * CELL;
    const h = this.puzzle.rows * CELL;
    this.board.position.set((v.w - w) / 2, Math.max(110, (v.h - h) / 2 + 10));
    this.undo.position.set(this.board.x + w + 70, this.board.y + 50);
  }

  update(dt: number) {
    this.clock += dt;
    if (!this.busy) this.penguin.rotation = 0.05 * Math.sin(this.clock * 3);
    // The chosen penguin of two stands lifted a little, over a blue ring.
    this.penguins.forEach((n, i) => (n.pivot.y = this.pair && i === this.who && !this.finished ? 10 : 0));
    const g = this.glow.clear();
    if (this.stuck && !this.busy && this.undo.visible)
      g.circle(this.undo.x, this.undo.y, 68 + 4 * Math.sin(this.clock * 6)).stroke({
        width: 7,
        color: swatch.yellow.fill,
      });
    this.drawArrow();
    this.drawRing();
  }

  destroy() {}

  private get predicting() {
    return !!this.plan.predict && !this.course;
  }

  /** The ghost finger on the how-to card: tap the ice beside the penguin, on the side of the solver's next slide. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.puzzle) return null;
    if (this.predicting) {
      const stop = this.shown[this.step];
      return stop ? { tap: { on: this.board, ...this.at2(stop.to) } } : null;
    }
    const { first, who } = this.ahead();
    if (first === -1) return null;
    // Two penguins: tap the one the solver moves next to choose it first.
    if (who !== this.who) return { tap: { on: this.board, ...this.at2(this.spots[who]) } };
    const cell = this.at2(beside(this.at, first));
    return { tap: { on: this.board, x: cell.x, y: cell.y } };
  }

  /** The "watch me" demo: slide along the solver's best route, pausing between slides like a person thinking. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    this.botWait -= dt;
    if (this.busy || this.finished || !this.puzzle || this.botWait > 0) return out;
    if (this.predicting) {
      const stop = this.shown[this.step];
      if (!stop) return out;
      const dx = stop.to.x - this.focus.x,
        dy = stop.to.y - this.focus.y;
      out.players[0].active = true;
      if (!dx && !dy) {
        out.players[0].action = true;
        this.botWait = 1;
      } else {
        out.players[0].direction = dx > 0 ? 0 : dx < 0 ? 2 : dy > 0 ? 1 : 3;
        this.botWait = 0.45;
      }
      return out;
    }
    const { first, who } = this.ahead();
    if (first < 0) return out;
    this.botWait = 0.9;
    out.players[0].active = true;
    if (who !== this.who) {
      // The action button chooses the other penguin.
      out.players[0].action = true;
      return out;
    }
    out.players[0].direction = first;
    return out;
  }

  /** A finger came back after keys on the island: the undo button returns. */
  touchReturned() {
    if (this.touch || this.ctx.couch || this.finished) return;
    this.touch = true;
    this.undo.visible = !this.predicting;
  }

  control(input: CouchControls) {
    if (this.touch) {
      // The first key or pad press on the island: the undo button goes (the left button undoes).
      this.touch = this.undo.visible = false;
    }
    if (this.busy || this.finished) return;
    if (this.predicting) {
      // The arrow keys move a ring over the pond; the action button predicts that cell.
      for (const p of input.players) {
        if (p.direction >= 0) {
          const c = beside(this.focus, p.direction as Dir);
          this.focus = {
            x: Math.min(this.puzzle.cols - 1, Math.max(0, c.x)),
            y: Math.min(this.puzzle.rows - 1, Math.max(0, c.y)),
          };
        }
        if (p.action) return void this.predict(this.focus);
      }
      return;
    }
    const p = input.players.find((p) => p.undo || p.direction >= 0 || (this.pair && p.action));
    if (p?.undo) this.back();
    else if (p?.action && this.pair) this.choose((1 - this.who) as 0 | 1);
    else if (p && p.direction >= 0) void this.go(p.direction as Dir);
  }

  private async next() {
    this.busy = true;
    this.again = false;
    this.index++;
    if (this.index >= (this.course?.boards.length ?? this.plan.puzzles)) return void this.finale();
    if (this.course) this.puzzle = this.course.boards[this.index];
    else if (this.predicting) {
      ({ puzzle: this.puzzle, slides: this.shown } = makePrediction(this.plan, this.ctx.rng));
      this.step = 0;
      this.guess = null;
      this.look = pickLook(this.ctx.rng);
    } else {
      this.puzzle = makePuzzle(this.plan, this.ctx.rng, this.made);
      this.made.push(this.puzzle);
      this.look = pickLook(this.ctx.rng);
    }
    this.spots = this.startSpots();
    this.who = 0;
    this.have = 0;
    this.blocks = (this.puzzle.blocks ?? []).map((c) => ({ ...c }));
    this.route = null;
    this.moves = this.carry;
    this.carry = 0;
    this.history = [];
    this.hinting = false;
    this.stuck = false;
    this.build();
    this.resize(this.view);
    this.board.alpha = 0;
    await this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.3 });
    if (this.predicting) this.focus = beside(this.at, this.shown[0].dir);
    this.busy = false;
    this.checkHelp();
    this.report();
    if (this.predicting) return this.index > 0 ? undefined : this.ctx.instruct('slide.predict');
    if (this.course) {
      if (this.told) return;
      this.told = true;
      return this.ctx.instruct(this.course.boards.some((b) => b.blocks?.length) ? 'slide.ice' : 'slide.go');
    }
    if (this.index > 0) return;
    if (this.plan.pal) return this.ctx.instruct('slide.pals');
    if (this.plan.stars) return this.ctx.instruct('slide.star');
    if (this.plan.blocks)
      return this.ctx.instruct(
        this.plan.pairedBlocks
          ? 'slide.paired'
          : this.plan.soft
            ? 'slide.ice-snow'
            : this.plan.fish === 2
              ? 'slide.ice-two'
              : 'slide.ice',
      );
    if (this.plan.soft) return this.ctx.instruct('slide.soft');
    if (this.plan.fish === 3) return this.ctx.instruct('slide.three');
    if (this.plan.fish === 2) return this.ctx.instruct('slide.two');
    return this.ctx.instruct('slide.go');
  }

  private build() {
    const p = this.puzzle;
    const w = p.cols * CELL;
    const h = p.rows * CELL;
    this.floor
      .clear()
      .roundRect(-16, -16, w + 32, h + 32, 30)
      .fill(0xffffff)
      .stroke({ width: 6, color: 0xc9d6e6 })
      .roundRect(0, 0, w, h, 18)
      .fill(ICE);
    for (let i = 0; i < 6; i++)
      this.floor
        .moveTo((i * 137) % w, (i * 71) % h)
        .lineTo(((i * 137) % w) + 30, ((i * 71) % h) + 12)
        .stroke({ width: 3, color: 0xffffff, alpha: 0.8 });
    this.board.hitArea = new Rectangle(-16, -16, w + 32, h + 32);
    this.things.removeChildren().forEach((c) => c.destroy({ children: true }));
    for (const c of p.soft) this.place(softArt(), c);
    for (const c of p.stars ?? []) this.place(starArt(), c);
    this.rockNodes = p.rocks.map((c) => this.place(rockArt(this.look.rock), c));
    this.fishNodes = p.fish.map((c) => this.place(fishArt(this.look.fish), c));
    this.blockNodes = this.blocks.map((c) => this.place(blockArt(), c));
    this.penguins[1].visible = this.pair;
    this.spots.forEach((c, i) => {
      const s = this.at2(c);
      this.penguins[i].position.set(s.x, s.y);
      this.penguins[i].rotation = 0;
    });
  }

  private startSpots(): Cell[] {
    return [{ ...this.puzzle.start }, ...(this.puzzle.pal ? [{ ...this.puzzle.pal }] : [])];
  }

  /** Two penguins: choose which one the next slide moves. Choosing is never a slide. */
  private choose(who: 0 | 1) {
    if (this.busy || this.finished || !this.pair || who === this.who) return;
    sfx.pop();
    this.penguin.rotation = 0;
    this.who = who;
  }

  /** Every penguin back where `spots` says, gliding. */
  private settlePenguins(duration: number) {
    this.spots.forEach((c, i) => {
      const p = this.at2(c);
      void this.ctx.tw.to(this.penguins[i], { x: p.x, y: p.y }, { duration, ease: ease.inOutSine });
    });
  }

  private place<T extends Container>(node: T, c: Cell): T {
    const p = this.at2(c);
    node.position.set(p.x, p.y);
    node.eventMode = 'none';
    this.things.addChild(node);
    return node;
  }

  /** Tap the ice: the penguin slides toward it, along whichever way is further. */
  private async tapIce(e: FederatedPointerEvent) {
    if (this.busy || this.finished) return;
    const local = this.board.toLocal(e.global);
    if (this.predicting) return void this.predict(cellAt(this.puzzle, local.x, local.y, CELL));
    if (this.pair) {
      // A tap on the other penguin chooses it.
      const cell = cellAt(this.puzzle, local.x, local.y, CELL),
        other = (1 - this.who) as 0 | 1;
      if (cell.x === this.spots[other].x && cell.y === this.spots[other].y) return void this.choose(other);
    }
    const p = this.at2(this.at);
    const dx = local.x - p.x;
    const dy = local.y - p.y;
    if (Math.hypot(dx, dy) < 40) {
      sfx.squeak();
      return;
    }
    const dir = tapDirection(dx, dy);
    this.scuffAt(p, dir);
    await this.go(dir);
  }

  /** Two soft arcs on the side of the penguin she tapped, gone in 0.15 s. */
  private scuffAt(p: { x: number; y: number }, dir: Dir) {
    const a = (dir * Math.PI) / 2;
    const g = this.scuff.clear();
    for (const r of [52, 66])
      g.moveTo(p.x + r * Math.cos(a - 0.6), p.y + r * Math.sin(a - 0.6))
        .arc(p.x, p.y, r, a - 0.6, a + 0.6)
        .stroke({ width: 6, color: 0x8fb3d6, cap: 'round' });
    g.alpha = 1;
    void this.ctx.tw.to(g, { alpha: 0 }, { duration: 0.15 });
  }

  private async go(dir: Dir) {
    const m = this.pair ? this.pairMove(dir) : move(this.puzzle, this.at, dir, this.blocks);
    if (!m) {
      // Already against something: a little bump, never a mistake.
      sfx.boing();
      this.busy = true;
      const x = this.penguin.x;
      await this.ctx.tw.to(this.penguin, { x: x + [6, 0, -6, 0][dir] }, { duration: 0.06 });
      await this.ctx.tw.to(this.penguin, { x }, { duration: 0.1 });
      this.busy = false;
      if (this.again) this.restart();
      return;
    }
    const { to, passed, pushed } = m;
    this.busy = true;
    this.history.push({ spots: this.spots.slice(), who: this.who, have: this.have, blocks: this.blocks });
    this.moves++;
    this.report();
    if (pushed) {
      // The penguin leans into the block and stays where it is; the block skates away.
      const node = this.blockNodes[pushed.index];
      const from = this.blocks[pushed.index];
      const end = this.at2(pushed.to);
      const far = Math.abs(pushed.to.x - from.x) + Math.abs(pushed.to.y - from.y);
      this.blocks = m.blocks;
      sfx.whoosh();
      const home = this.at2(this.at);
      const lean = async () => {
        await this.ctx.tw.to(
          this.penguin,
          { x: home.x + [10, 0, -10, 0][dir], y: home.y + [0, 10, 0, -10][dir] },
          { duration: 0.08 },
        );
        await this.ctx.tw.to(this.penguin, { x: home.x, y: home.y }, { duration: 0.12 });
      };
      await Promise.all([
        lean(),
        this.ctx.tw.to(node, { x: end.x, y: end.y }, { duration: 0.1 * far + 0.08, ease: ease.outQuad }),
      ]);
      sfx.clunk();
      if (this.puzzle.stars?.some((s) => s.x === pushed.to.x && s.y === pushed.to.y)) {
        this.ctx.particles.burst(this.board.x + end.x, this.board.y + end.y, {
          kind: 'star',
          colors: [0xffffff, swatch.yellow.light],
          count: 14,
          speed: [100, 240],
          gravity: 0,
          life: [0.4, 0.8],
        });
      }
      if (solved(this.puzzle, this.have, this.blocks)) return void this.win();
      this.checkHelp();
      this.busy = false;
      if (this.again) this.restart();
      return;
    }
    sfx.whoosh();
    this.penguin.rotation = [0.3, 0, -0.3, 0][dir];
    const end = this.at2(to);
    await this.ctx.tw.to(
      this.penguin,
      { x: end.x, y: end.y },
      { duration: 0.1 * passed.length + 0.08, ease: ease.outQuad },
    );
    sfx.clunk();
    this.penguin.rotation = 0;
    this.at = to;
    const got = eaten(this.puzzle, passed) & ~this.have;
    this.have |= got;
    this.fishNodes.forEach((f, i) => {
      if (got & (1 << i)) {
        f.visible = false;
        this.ctx.particles.burst(this.board.x + f.x, this.board.y + f.y, {
          kind: 'star',
          colors: [0xffffff, swatch.orange.light],
          count: 12,
          speed: [100, 240],
          gravity: 0,
          life: [0.4, 0.8],
        });
      }
    });
    if (got) {
      sfx.munch();
      if (!this.guess) void this.ctx.say('slide.yum');
    }
    if (this.guess) await this.judge(this.guess, to, dir);
    if (solved(this.puzzle, this.have, this.blocks)) return void this.win();
    this.checkHelp();
    this.busy = false;
    if (this.again) this.restart();
  }

  /** A slide of the chosen penguin on a two-penguin pond, the other stopping it like a rock. */
  private pairMove(dir: Dir) {
    const m = movePair(this.puzzle, this.spots, this.who, dir);
    return m && { to: m.spots[this.who], passed: m.passed, blocks: this.blocks, pushed: null };
  }

  /** Level 11: she taps where she thinks the shown slide will stop; then it goes. A prediction is never a miss. */
  private async predict(cell: Cell) {
    const shown = this.shown[this.step];
    if (this.busy || this.finished || !shown) return;
    if (cell.x === this.at.x && cell.y === this.at.y) {
      // The penguin's own cell: the arrow says it will move, so this is not a guess yet.
      sfx.squeak();
      return;
    }
    sfx.pop();
    this.guess = cell;
    this.focus = cell;
    this.busy = true;
    await this.ctx.tw.wait(0.35);
    await this.go(shown.dir);
  }

  /** The penguin has stopped: a right guess sparkles; a wrong one keeps her ring and the pet names what stopped it. */
  private async judge(guess: Cell, to: Cell, dir: Dir) {
    const p = this.at2(to);
    if (guess.x === to.x && guess.y === to.y) {
      sfx.sparkle();
      this.ctx.particles.burst(this.board.x + p.x, this.board.y + p.y, {
        kind: 'star',
        colors: [0xffffff, swatch.yellow.light],
        count: 14,
        speed: [100, 240],
        gravity: 0,
        life: [0.4, 0.8],
      });
      const feedback = this.ctx.say('slide.predict.right');
      if (this.step + 1 >= this.shown.length) await feedback;
    } else {
      const stop = stopper(this.puzzle, to, dir);
      if (stop.kind === 'rock') {
        const node =
          this.rockNodes[this.puzzle.rocks.findIndex((r) => r.x === stop.cell.x && r.y === stop.cell.y)];
        if (node)
          void this.ctx.tw
            .to(node.scale, { x: 1.15, y: 1.15 }, { duration: 0.12, ease: ease.outQuad })
            .then(() => this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.18 }));
      }
      await this.ctx.say(stop.kind === 'rock' ? 'slide.predict.rock' : 'slide.predict.edge');
    }
    this.guess = null;
    this.step++;
    const next = this.shown[this.step];
    if (next) this.focus = beside(to, next.dir);
  }

  /** Level 11's rings: her prediction while the slide goes, or the keys' ring before she chooses. */
  private drawRing() {
    const g = this.ring.clear();
    if (this.pair && !this.finished) {
      g.ellipse(this.penguin.x, this.penguin.y + 34, 40, 14).stroke({
        width: 6,
        color: swatch.blue.fill,
        alpha: 0.85,
      });
      return;
    }
    if (!this.predicting || !this.puzzle || this.finished) return;
    const at = this.guess ?? (!this.touch && !this.busy ? this.focus : null);
    if (!at) return;
    const p = this.at2(at);
    g.circle(p.x, p.y, 40).stroke({
      width: 8,
      color: this.guess ? swatch.blue.fill : swatch.yellow.fill,
      alpha: this.guess ? 1 : 0.6 + 0.3 * Math.sin(this.clock * 6),
    });
  }

  /** The solver's next slide from where things stand now, remembered until something moves. */
  private ahead() {
    const key = `${this.spots.map((c) => `${c.x}.${c.y}`).join(' ')},${this.who},${this.have},${this.blocks.map((b) => `${b.x}.${b.y}`).join(' ')}`;
    if (this.route?.key !== key) {
      if (this.pair) {
        const { first, moves } = solvePair(this.puzzle, this.spots, this.have);
        this.route = { key, first: first?.dir ?? -1, who: first?.who ?? this.who, moves };
      } else {
        const { first, moves } = solve(this.puzzle, this.at, this.have, this.blocks);
        this.route = { key, first, who: this.who, moves };
      }
    }
    return this.route;
  }

  /** Put every ice block where `blocks` says, gliding or at once. */
  private settleBlocks(blocks: Cell[], duration: number) {
    this.blocks = blocks;
    this.blockNodes.forEach((n, i) => {
      const p = this.at2(blocks[i]);
      if (duration) void this.ctx.tw.to(n, { x: p.x, y: p.y }, { duration, ease: ease.inOutSine });
      else n.position.set(p.x, p.y);
    });
  }

  /**
   * Couch pause menu: start this pond over from its first position, fish and all. The slides already
   * taken keep counting (undone ones do too), so a restart never improves a score.
   */
  restart() {
    if (this.finished || !this.puzzle) return;
    if (this.busy) {
      this.again = true;
      return;
    }
    void this.rewind();
  }

  private async rewind() {
    this.busy = true;
    this.again = false;
    this.spots = this.startSpots();
    this.who = 0;
    this.have = 0;
    this.history = [];
    if (this.predicting) {
      // Back to the first shown slide, from the start.
      this.step = 0;
      this.guess = null;
      this.focus = beside(this.at, this.shown[0].dir);
    }
    this.settleBlocks(
      (this.puzzle.blocks ?? []).map((c) => ({ ...c })),
      0.3,
    );
    this.fishNodes.forEach((f) => (f.visible = true));
    this.settlePenguins(0.3);
    await this.ctx.tw.wait(0.3);
    this.busy = false;
    this.checkHelp();
  }

  /** Undo one slide: the fish it ate come back too. */
  private back() {
    if (this.busy || this.finished || !this.history.length) return;
    const step = this.history.pop()!;
    this.penguin.rotation = 0;
    // The penguin that made the slide steps back and is the chosen one again.
    this.spots = step.spots;
    this.who = step.who;
    this.have = step.have;
    this.settleBlocks(step.blocks, 0.25);
    this.fishNodes.forEach((f, i) => (f.visible = !(this.have & (1 << i))));
    this.settlePenguins(0.25);
    this.checkHelp();
  }

  /** After a few more slides than needed, a yellow arrow shows a best next slide; when there is no way on, undo glows. */
  private checkHelp() {
    // Prediction ponds follow their shown slides: nothing to get stuck on, no help arrow.
    if (this.predicting) return;
    const wasStuck = this.stuck;
    this.stuck = this.ahead().moves < 0;
    if (this.stuck && !wasStuck)
      void this.ctx.say(this.puzzle.stars?.length ? 'slide.star.stuck' : 'slide.stuck');
    if (!this.hinting && this.moves > this.puzzle.best + HINT_AFTER) {
      this.hinting = true;
      this.hints++;
      this.assisted = true;
      this.report();
      if (!this.stuck) void this.ctx.say('slide.hint');
    }
  }

  /** Hand a course's numbers to the shell. `finished` means the pond just ended, so none of its slides are "in progress". */
  private report(finished = false) {
    const run = this.ctx.couch?.course;
    if (!run || !this.course) return;
    run.progress({
      board: this.index,
      boards: this.course.boards.length,
      done: this.done.slice(),
      attempts: finished ? 0 : this.moves,
      par: this.puzzle.best,
      minimum: this.course.minimum,
      assisted: this.assisted,
    });
  }

  /** The score for the pond just finished, over the board for a moment: the slides taken, and the best route. */
  private async pondScore() {
    const best = this.puzzle.best,
      total = this.course!.boards.length;
    const text =
      this.moves === best
        ? `Pond ${this.index + 1} of ${total}: ${this.moves} slides, a perfect route!`
        : `Pond ${this.index + 1} of ${total}: ${this.moves} slides (best route ${best})`;
    const note = label(text, 36, ink);
    note.position.set(this.board.x + (this.puzzle.cols * CELL) / 2, Math.max(52, this.board.y - 50));
    note.alpha = 0;
    this.ctx.stage.addChild(note);
    await this.ctx.tw.to(note, { alpha: 1 }, { duration: 0.2 });
    await this.ctx.tw.wait(1.1);
    await this.ctx.tw.to(note, { alpha: 0 }, { duration: 0.25 });
    note.destroy();
  }

  private drawArrow() {
    const g = this.arrow.clear();
    if (this.predicting) {
      // The big arrow beside the penguin: the way the next slide goes.
      const shown = this.shown[this.step];
      if (!shown || !this.puzzle || this.finished || (this.busy && !this.guess)) return;
      const p = this.at2(this.at),
        ux = [1, 0, -1, 0][shown.dir],
        uy = [0, 1, 0, -1][shown.dir];
      const bob = this.guess ? 0 : 4 * Math.sin(this.clock * 5);
      const tip = { x: p.x + ux * (88 + bob), y: p.y + uy * (88 + bob) },
        base = { x: p.x + ux * (42 + bob), y: p.y + uy * (42 + bob) };
      g.poly([tip.x, tip.y, base.x - uy * 34, base.y + ux * 34, base.x + uy * 34, base.y - ux * 34])
        .fill(swatch.yellow.fill)
        .stroke({ width: 5, color: swatch.yellow.line, join: 'round' });
      return;
    }
    if (!this.hinting || this.stuck || this.busy || !this.puzzle) return;
    // On two-penguin ponds the arrow stands by the penguin to move next, chosen or not.
    const { first, who } = this.ahead();
    if (first < 0) return;
    const p = this.at2(this.spots[who] ?? this.at);
    const bob = 6 * Math.sin(this.clock * 6);
    const ux = [1, 0, -1, 0][first];
    const uy = [0, 1, 0, -1][first];
    const tip = { x: p.x + ux * (70 + bob), y: p.y + uy * (70 + bob) };
    const base = { x: p.x + ux * (40 + bob), y: p.y + uy * (40 + bob) };
    g.poly([tip.x, tip.y, base.x - uy * 22, base.y + ux * 22, base.x + uy * 22, base.y - ux * 22])
      .fill(swatch.yellow.fill)
      .stroke({ width: 4, color: swatch.yellow.line, join: 'round' });
  }

  private async win() {
    this.busy = true;
    // Every successful slide counts, including ones later undone; blocked bumps and undo do not.
    this.excess += Math.max(0, this.moves - this.puzzle.best);
    if (this.course) {
      this.done.push(this.moves);
      this.report(true);
    }
    this.hinting = false;
    this.stuck = false;
    sfx.sparkle();
    this.ctx.pet.cheer();
    await this.ctx.tw.to(this.penguin.scale, { x: 1.25, y: 1.25 }, { duration: 0.2, ease: ease.outBack });
    await this.ctx.tw.to(this.penguin.scale, { x: 1, y: 1 }, { duration: 0.2 });
    // A course moves straight on after a short score; ordinary play praises, and the pet speaks.
    if (this.course) await this.pondScore();
    else await this.ctx.say('praise');
    await this.ctx.tw.to(this.board, { alpha: 0 }, { duration: 0.3 });
    await this.next();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say(this.plan.stars && !this.course ? 'slide.star.done' : 'slide.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.excess });
  }
}

class SlideIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    c.addChild(new Graphics().ellipse(0, -30, 120, 40).fill(ICE).stroke({ width: 5, color: 0xc9d6e6 }));
    const fish = fishArt();
    fish.position.set(70, -40);
    const p = penguinArt();
    p.position.set(-40, -70);
    p.scale.set(1.2);
    c.addChild(fish, p);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const p = penguinArt();
  p.scale.set(1.5);
  const f = fishArt();
  f.position.set(rng.pick([-1, 1]) * 70, 50);
  f.scale.set(0.9);
  c.addChild(p, f);
  return c;
}

export const penguinSlide: GameModule = {
  id: 'penguin-slide',
  liveController: true,
  name: 'Penguin Slide',
  titleLine: 'game.penguin-slide',
  region: 'puzzle-peaks',
  challenge: 'space',
  skills: ['planning', 'spatial-reasoning', 'problem-solving'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.bubbles,
  coplayHint: 'Before each slide, guess together where the penguin will stop.',
  offScreen: 'Slide a toy car across the floor: where does it stop, and what stops it?',
  hubIcon: () => new SlideIcon(),
  entryLevels: [11],
  touchDemo: true,
  sticker,
  create: (ctx) => new PenguinSlide(ctx),
};
