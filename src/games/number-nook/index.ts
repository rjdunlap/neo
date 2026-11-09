import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, shadow, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  fifteenRoute,
  goal,
  inPlace,
  lineSlide,
  makeBoard,
  nookLayout,
  planFor,
  solutionStep,
  solved,
} from './logic';

type Tone = { fill: number; line: number; light: number };
/** Three seeded looks, all from the palette. A tile in its goal place is green in every look, and yellow stays for the hint. */
const LOOKS = [
  {
    name: 'lantern paper',
    tiles: [swatch.purple],
    tray: swatch.purple.light,
    edge: swatch.purple.line,
    gap: cream,
    number: ink,
  },
  {
    name: 'driftwood',
    tiles: [wood],
    tray: swatch.brown.fill,
    edge: swatch.brown.line,
    gap: swatch.brown.light,
    number: ink,
  },
  {
    name: 'sea glass',
    tiles: [swatch.blue, swatch.teal],
    tray: swatch.white.fill,
    edge: swatch.white.line,
    gap: swatch.blue.light,
    number: ink,
  },
] as const;
type Look = (typeof LOOKS)[number];
const GLIDE = 0.15,
  NUDGE = 0.2;
/** A wooden block: a 2-unit shadow under it and a 4-unit lighter top edge, so a gliding tile reads as sliding in a groove. */
function block(size: number, tone: Tone): Graphics {
  const s = size - 8,
    h = s / 2;
  return new Graphics()
    .roundRect(-h, -h + 2, s, s, 18)
    .fill(shadow)
    .roundRect(-h, -h, s, s, 18)
    .fill(tone.fill)
    .stroke({ width: 4, color: tone.line })
    .roundRect(-h + 12, -h + 5, s - 24, 4, 2)
    .fill(tone.light);
}
function numberArt(value: number, size: number, correct = false, look: Look = LOOKS[0]): Container {
  const c = new Container();
  c.addChild(
    block(size, correct ? swatch.green : look.tiles[value % look.tiles.length]),
    label(String(value), size * 0.4, look.number),
  );
  c.eventMode = 'none';
  return c;
}
class NumberNook implements Game {
  readonly plan;
  readonly look: Look;
  readonly targetBoard: number[];
  board: number[];
  readonly initial: number[];
  /** The shortest route from the starting board, shown after finishing. */
  readonly fewest: number | null;
  private route: ReturnType<typeof fifteenRoute> = null;
  readonly nodes: Container[] = [];
  readonly undoButton = new Container();
  readonly hintButton = new Container();
  readonly againButton = new Container();
  private readonly grid = new Container();
  private readonly tray = new Graphics();
  private readonly target = new Container();
  private readonly glow = new Graphics();
  private readonly heading = label('Put the numbers in order', 32, ink);
  private readonly status = label('', 23, ink);
  private readonly targetLabel = label('Your goal', 22, ink);
  private history: number[][] = [];
  private cell = 120;
  private view: View;
  /** The tiles gliding one cell each, into `cell` from `from`: one for a single slide, the whole line for a line slide. */
  glide: { tiles: { cell: number; from: number }[]; t: number } | null = null;
  private nudge: { cell: number; toward: number; t: number } | null = null;
  queued: number | null = null;
  finished = false;
  misses = 0;
  hints = 0;
  hinted = -1;
  moves = 0;
  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.targetBoard = goal(this.plan.rows, this.plan.cols, this.plan.order);
    if (this.plan.order === 'columns') this.heading.text = 'Match the column-order goal';
    this.look = ctx.rng.pick(LOOKS);
    this.board = makeBoard(ctx.level, ctx.rng);
    this.initial = this.board.slice();
    if (this.plan.rows === 4) this.route = fifteenRoute(this.initial);
    this.fewest =
      this.plan.rows === 4
        ? (this.route?.distance ?? null)
        : solutionStep(this.initial, this.plan.cols, this.plan.order)!.distance;
    this.view = ctx.view;
    this.grid.addChild(this.tray);
    this.tray.eventMode = 'none';
    this.glow.eventMode = 'none';
    for (let i = 0; i < this.board.length; i++) {
      const node = new Container();
      node.hitArea = new Rectangle(-60, -60, 120, 120);
      onTap(node, () => this.choose(i));
      this.nodes.push(node);
      this.grid.addChild(node);
    }
    this.grid.addChild(this.glow);
    for (const [node, text, action] of [
      [this.undoButton, 'Undo ↶', () => this.undo()],
      [this.hintButton, 'Hint ◇', () => this.askForHint()],
      [this.againButton, 'Start over ↺', () => this.restart()],
    ] as const) {
      node.addChild(tile(160, 100, 'purple'), label(text, 24, ink));
      onTap(node, action);
    }
    for (const part of [this.heading, this.status, this.target, this.targetLabel]) part.eventMode = 'none';
    ctx.stage.addChild(
      this.heading,
      this.status,
      this.grid,
      this.target,
      this.targetLabel,
      this.undoButton,
      this.hintButton,
      this.againButton,
    );
    this.resize(this.view);
  }
  start() {
    const instruction =
      this.plan.order === 'columns'
        ? 'nook.columns'
        : this.plan.rows === 4
          ? 'nook.fifteen'
          : this.plan.rows === 3 && this.plan.cols === 4
            ? 'nook.twelve'
            : 'nook.go';
    void this.ctx.instruct(instruction);
  }
  choose(at: number) {
    if (this.finished || !this.ctx.alive) return;
    // One tap during a glide waits for it to land.
    if (this.glide) {
      this.queued ??= at;
      return;
    }
    if (this.board[at] === 0) return;
    const gap = this.board.indexOf(0),
      line = lineSlide(this.board, this.plan.cols, at);
    if (!line) {
      this.misses++;
      sfx.boing();
      void this.ctx.say('nook.miss');
      this.nudge = { cell: at, toward: gap, t: 0 };
      if (this.misses % 2 === 0) this.showHint(false);
      return;
    }
    const before = inPlace(this.board, this.targetBoard);
    this.history.push(this.board.slice());
    this.board = line.board;
    if (this.route?.moves[0] === at && line.steps.length === 1) this.route.moves.shift();
    else this.route = null;
    // Each tile moved is one slide, so a line slide counts the same as its single slides and Undo takes it back whole.
    this.moves += line.steps.length;
    this.hinted = -1;
    const tiles = line.steps.map((from, i) => ({ cell: i ? line.steps[i - 1] : gap, from }));
    this.glide = { tiles, t: 0 };
    this.nudge = null;
    // The gliding tiles ride above the new gap's square, with the hint glow still on top.
    this.grid.addChild(...tiles.map((g) => this.nodes[g.cell]), this.glow);
    sfx.tick();
    // The in-place note climbs a step for each tile now home and falls back when one leaves.
    const now = inPlace(this.board, this.targetBoard);
    if (now !== before) sfx.bell(2 + now, 0.25);
    if (solved(this.board, this.targetBoard)) this.finished = true;
    this.draw();
  }
  private landed() {
    this.glide = null;
    this.draw();
    if (this.finished) {
      void this.ctx.say('nook.done').then(() => {
        if (this.ctx.alive) this.ctx.finish({ misses: this.misses, hints: this.hints });
      });
      return;
    }
    if (this.queued !== null) {
      const at = this.queued;
      this.queued = null;
      this.choose(at);
    }
  }
  /** Ends any motion at once, so Undo, Hint and Start over act on the board she sees. */
  private settle() {
    this.glide = null;
    this.nudge = null;
    this.queued = null;
    this.place();
  }
  private draw() {
    this.nodes.forEach((node, i) => {
      node.removeChildren().forEach((c) => c.destroy({ children: true }));
      const value = this.board[i];
      node.addChild(
        value
          ? numberArt(value, this.cell, value === this.targetBoard[i], this.look)
          : new Graphics()
              .roundRect(-this.cell / 2 + 4, -this.cell / 2 + 4, this.cell - 8, this.cell - 8, 18)
              .fill(this.look.gap)
              .stroke({ width: 3, color: this.look.edge }),
      );
    });
    this.status.text = this.finished
      ? this.fewest === null
        ? `${this.moves} slides`
        : `${this.moves} slides · the fewest from the start: ${this.fewest}`
      : `${this.moves} slides · green tiles are in place`;
    this.glow.clear();
    if (this.hinted >= 0) {
      const node = this.nodes[this.hinted];
      this.glow
        .roundRect(node.x - this.cell / 2, node.y - this.cell / 2, this.cell, this.cell, 20)
        .stroke({ width: 6, color: swatch.yellow.fill });
    }
    this.place();
  }
  /** Moves the gliding and nudged tiles' art; the cells themselves never move, so taps land where she sees. */
  private place() {
    this.nodes.forEach((node) => node.children[0]?.position.set(0, 0));
    const offset = (from: number, to: number) => ({
      x: ((from % this.plan.cols) - (to % this.plan.cols)) * this.cell,
      y: (Math.floor(from / this.plan.cols) - Math.floor(to / this.plan.cols)) * this.cell,
    });
    if (this.glide) {
      const k = 1 - this.glide.t / GLIDE,
        ease = k * k;
      for (const g of this.glide.tiles) {
        const d = offset(g.from, g.cell);
        this.nodes[g.cell].children[0]?.position.set(d.x * ease, d.y * ease);
      }
    }
    if (this.nudge) {
      const d = offset(this.nudge.toward, this.nudge.cell),
        len = Math.hypot(d.x, d.y) || 1,
        push = 6 * Math.sin((Math.PI * this.nudge.t) / NUDGE);
      this.nodes[this.nudge.cell].children[0]?.position.set((d.x / len) * push, (d.y / len) * push);
    }
  }
  private nextSlide(): number {
    if (this.plan.rows === 4) {
      this.route ??= fifteenRoute(this.board);
      return this.route?.moves[0] ?? -1;
    }
    return solutionStep(this.board, this.plan.cols, this.plan.order)?.next ?? -1;
  }
  private showHint(spoken: boolean) {
    // A hint already showing is repeated without counting again.
    if (this.hinted < 0) {
      const next = this.nextSlide();
      if (next < 0) return;
      this.hinted = next;
      this.hints++;
      this.draw();
    }
    if (spoken) void this.ctx.say(this.route?.distance === null ? 'nook.borderHint' : 'nook.hint');
  }
  askForHint() {
    if (!this.finished) {
      this.settle();
      this.showHint(true);
    }
  }
  private undo() {
    if (this.finished) return;
    const before = this.history.pop();
    if (before) {
      this.settle();
      this.board = before;
      this.route = null;
      this.hinted = -1;
      this.draw();
      sfx.tick();
    }
  }
  restart() {
    if (this.finished) return;
    this.settle();
    this.board = this.initial.slice();
    this.route = null;
    this.history = [];
    this.hinted = -1;
    this.draw();
    void this.ctx.say('nook.restart');
  }
  resize(v: View) {
    this.view = v;
    const l = nookLayout(v.w, v.h, this.plan.rows, this.plan.cols);
    this.cell = l.cell;
    this.grid.position.set(l.grid.x, l.grid.y);
    this.nodes.forEach((node, i) => {
      node.position.set((i % this.plan.cols) * this.cell, Math.floor(i / this.plan.cols) * this.cell);
      node.hitArea = new Rectangle(-this.cell / 2, -this.cell / 2, this.cell, this.cell);
    });
    const edge = this.cell / 2 + 10;
    this.tray
      .clear()
      .roundRect(-edge, -edge, this.plan.cols * this.cell + 20, this.plan.rows * this.cell + 20, 26)
      .fill(this.look.tray)
      .stroke({ width: 5, color: this.look.edge });
    this.heading.position.set(v.w / 2, 112);
    this.status.position.set(v.w / 2, 155);
    const tx = l.target.x;
    this.targetLabel.position.set(tx, 205);
    this.target.position.set(tx - (this.plan.cols - 1) * 25, 250);
    this.target.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.targetBoard.forEach((value, i) => {
      const art = value
        ? numberArt(value, 50, true, this.look)
        : new Graphics()
            .roundRect(-21, -21, 42, 42, 8)
            .fill(this.look.gap)
            .stroke({ width: 2, color: this.look.edge });
      art.position.set((i % this.plan.cols) * 50, Math.floor(i / this.plan.cols) * 50);
      this.target.addChild(art);
    });
    [this.undoButton, this.hintButton, this.againButton].forEach((node, i) =>
      node.position.set(l.buttons[i].x, l.buttons[i].y),
    );
    this.draw();
  }
  autotouch(): TouchIntent | null {
    if (this.finished || this.glide) return null;
    const next = this.nextSlide();
    return next >= 0 ? { tap: { on: this.nodes[next] }, pause: 0.5 } : null;
  }
  update(dt: number) {
    if (!this.glide && !this.nudge) return;
    if (this.nudge && (this.nudge.t += dt) >= NUDGE) this.nudge = null;
    if (this.glide && (this.glide.t += dt) >= GLIDE) {
      this.landed();
      return;
    }
    this.place();
  }
  destroy() {
    this.finished = true;
  }
}
function iconArt(seed = 0) {
  const c = new Container();
  [1, 2, 3].forEach((v, i) => {
    const art = numberArt(v, 94, (seed + i) % 2 === 0);
    art.position.set((i % 2) * 100 - 50, Math.floor(i / 2) * 100 - 150);
    c.addChild(art);
  });
  c.addChild(
    new Graphics().roundRect(7, -93, 86, 86, 15).fill(cream).stroke({ width: 4, color: swatch.teal.line }),
  );
  return c;
}
export const numberNook: GameModule = {
  id: 'number-nook',
  name: 'Number Nook',
  titleLine: 'game.number-nook',
  region: 'puzzle-peaks',
  challenge: 'numbers',
  skills: ['spatial-reasoning', 'planning', 'number-order'],
  bands: ['grownup'],
  touchDemo: true,
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.lullaby,
  upright: true,
  coplayHint: 'Plan together: which tile needs the empty space next? A green tile can still move.',
  offScreen:
    'Arrange numbered paper squares on a tray with one empty space. Slide one neighbour into the gap at a time.',
  hubIcon: () => new WigglyIcon(iconArt()),
  sticker: (seed) => {
    const c = iconArt(seed);
    c.pivot.set(0, -100);
    c.scale.set(0.65);
    return c;
  },
  create: (ctx) => new NumberNook(ctx),
};
