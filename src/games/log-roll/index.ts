import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  countsAsHint,
  LEVELS,
  DIRECTIONS,
  footprint,
  goal,
  isCradle,
  makePuzzle,
  planFor,
  roll,
  solutionStep,
  solved,
  standsOnCradle,
  type Direction,
  type State,
} from './logic';

/** Code-drawn wood: rings distinguish the standing end from a log lying across two stones. */
function drawLog(g: Graphics, w: number, h: number, upright: boolean) {
  g.clear()
    .roundRect(-w / 2, -h / 2, w, h, 12)
    .fill(wood.fill)
    .stroke({ width: 4, color: wood.line });
  if (upright) {
    g.circle(0, 0, Math.min(w, h) * 0.31).stroke({ width: 3, color: wood.line });
    g.circle(0, 0, Math.min(w, h) * 0.14).stroke({ width: 2, color: wood.line });
  } else if (w > h) {
    for (const y of [-h * 0.22, h * 0.22])
      g.moveTo(-w * 0.35, y)
        .lineTo(w * 0.35, y)
        .stroke({ width: 3, color: wood.line });
  } else {
    for (const x of [-w * 0.22, w * 0.22])
      g.moveTo(x, -h * 0.35)
        .lineTo(x, h * 0.35)
        .stroke({ width: 3, color: wood.line });
  }
  return g;
}
function logArt(w: number, h: number, upright: boolean) {
  const g = drawLog(new Graphics(), w, h, upright);
  g.eventMode = 'none';
  return g;
}
/** A seeded pond look: water, stones with a darker underside, and what floats between them. Yellow stays for the hollow's rim and the hint glow. */
const LOOKS = [
  {
    name: 'spring pond',
    water: swatch.blue.light,
    stone: cream,
    under: swatch.teal.line,
    float: [swatch.green.fill, swatch.green.line],
    leaf: false,
  },
  {
    name: 'autumn leaves',
    water: swatch.teal.light,
    stone: swatch.white.light,
    under: swatch.brown.line,
    float: [swatch.orange.fill, swatch.red.fill],
    leaf: true,
  },
  {
    name: 'evening water',
    water: swatch.purple.light,
    stone: cream,
    under: swatch.purple.line,
    float: [swatch.pink.fill, swatch.white.fill],
    leaf: false,
  },
] as const;
/** The log tips over its leading edge (top down: its footprint stretches or folds), then squashes as it lands. */
const TIP = 0.22,
  LAND = 0.08,
  LEAN = 0.24,
  RIPPLE = 0.9;
interface Box {
  cx: number;
  cy: number;
  w: number;
  h: number;
}
const boxOf = (s: State): Box => {
  const cells = footprint(s),
    [x0, y0] = cells[0],
    [x1, y1] = cells.at(-1)!;
  return { cx: (x0 + x1 + 1) / 2, cy: (y0 + y1 + 1) / 2, w: x1 - x0 + 1, h: y1 - y0 + 1 };
};
const STEP: Record<Direction, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
class LogRoll implements Game {
  readonly puzzle;
  readonly look;
  state: State;
  readonly directions = {} as Record<Direction, Container>;
  readonly undoButton = new Container();
  readonly hintButton = new Container();
  readonly againButton = new Container();
  private readonly board = new Graphics();
  private readonly ripples = new Graphics();
  private readonly log = new Container();
  private readonly logShape = logArt(48, 48, true);
  private readonly heading = label('', 32, ink);
  private readonly status = label('', 23, ink);
  private readonly floats: { x: number; y: number; r: number; color: number }[] = [];
  private history: State[] = [];
  private cell = 64;
  private bx = 0;
  private by = 180;
  private failed = 0;
  /** The roll on screen: from one footprint to the next, with at most one tap waiting behind it. */
  tip: { from: Box; t: number } | null = null;
  queued: Direction | null = null;
  lean: { d: Direction; t: number } | null = null;
  private ripple = -1;
  hinted: Direction | null = null;
  finished = false;
  misses = 0;
  hints = 0;
  moves = 0;
  /** Level 5's finish is a lying log across two cradle stones; earlier levels stand in the hollow. */
  readonly cradle: boolean;
  constructor(private readonly ctx: GameContext) {
    this.puzzle = makePuzzle(ctx.level, ctx.rng);
    this.state = { ...this.puzzle.start };
    this.cradle = isCradle(this.puzzle.plan.floor);
    this.heading.text = this.cradle ? 'Lay the log in the cradle' : 'Stand the log in the hollow';
    this.look = ctx.rng.pick(LOOKS);
    const floor = this.puzzle.plan.floor;
    floor.forEach((row, y) =>
      [...row].forEach((v, x) => {
        if (v === ' ')
          this.floats.push({
            x: x + 0.5 + ctx.rng.range(-0.2, 0.2),
            y: y + 0.5 + ctx.rng.range(-0.2, 0.2),
            r: ctx.rng.range(0.12, 0.2),
            color: ctx.rng.pick(this.look.float),
          });
      }),
    );
    for (let i = 0; i < 4; i++)
      this.floats.push({
        x: ctx.rng.pick([-0.08, floor[0].length + 0.08]),
        y: ctx.rng.range(0.3, floor.length - 0.3),
        r: 0.1,
        color: ctx.rng.pick(this.look.float),
      });
    this.board.eventMode =
      this.ripples.eventMode =
      this.log.eventMode =
      this.heading.eventMode =
      this.status.eventMode =
        'none';
    this.log.addChild(this.logShape);
    ctx.stage.addChild(this.board, this.ripples, this.log, this.heading, this.status);
    const names = { up: '↑ Up', down: '↓ Down', left: '← Left', right: 'Right →' };
    for (const d of DIRECTIONS) {
      const node = new Container();
      node.addChild(tile(116, 100, 'teal'), label(names[d], 25, ink));
      node.hitArea = new Rectangle(-58, -50, 116, 100);
      onTap(node, () => this.choose(d));
      this.directions[d] = node;
      ctx.stage.addChild(node);
    }
    for (const [node, text, action] of [
      [this.undoButton, 'Undo ↶', () => this.undo()],
      [this.hintButton, 'Hint ◇', () => this.askForHint()],
      [this.againButton, 'Start over ↺', () => this.restart()],
    ] as const) {
      node.addChild(tile(160, 100, 'purple'), label(text, 24, ink));
      node.hitArea = new Rectangle(-80, -50, 160, 100);
      onTap(node, action);
      ctx.stage.addChild(node);
    }
    this.resize(ctx.view);
  }
  start() {
    void this.ctx.instruct(this.cradle ? 'log.go.cradle' : 'log.go');
  }
  choose(d: Direction) {
    if (this.finished || !this.ctx.alive) return;
    if (this.tip) {
      this.queued ??= d;
      return;
    }
    this.lean = null;
    const next = roll(this.state, d, this.puzzle.plan.floor);
    if (!next) {
      this.failed++;
      sfx.boing();
      void this.ctx.say('log.edge');
      this.lean = { d, t: 0 };
      if (this.failed % 2 === 0) this.showHint(false);
      this.status.text = 'Both ends need stones. Try another direction.';
      return;
    }
    this.tip = { from: boxOf(this.state), t: 0 };
    this.history.push({ ...this.state });
    this.state = next;
    this.moves++;
    this.hinted = null;
    this.failed = 0;
    sfx.pop(3);
    if (solved(this.state, this.puzzle.plan.floor)) this.finished = true;
    else if (standsOnCradle(this.state, this.puzzle.plan.floor)) void this.ctx.say('log.cradle');
    this.draw();
  }
  /** Ends any motion at once, so Undo, Hint and Start over always act on the pose she sees. */
  private settle() {
    this.tip = null;
    this.queued = null;
    this.lean = null;
  }
  private landed() {
    if (!this.finished) {
      if (this.queued) {
        const d = this.queued;
        this.queued = null;
        this.choose(d);
      }
      return;
    }
    this.ripple = 0;
    this.status.text = `Finished in ${this.moves} ${this.moves === 1 ? 'roll' : 'rolls'} · the shortest route is ${this.puzzle.plan.depth}`;
    void this.ctx.say(this.cradle ? 'log.done.cradle' : 'log.done').then(() => {
      if (this.ctx.alive) this.ctx.finish({ misses: 0, hints: this.hints });
    });
  }
  private draw() {
    const c = this.cell,
      floor = this.puzzle.plan.floor,
      cols = floor[0].length,
      rows = floor.length,
      { water, stone, under } = this.look;
    this.board
      .clear()
      .roundRect(this.bx - 14, this.by - 14, c * cols + 28, c * rows + 28, 24)
      .fill(water);
    for (const f of this.floats) {
      const x = this.bx + f.x * c,
        y = this.by + f.y * c,
        r = f.r * c;
      if (this.look.leaf) this.board.ellipse(x, y, r * 1.3, r * 0.7).fill(f.color);
      else
        this.board
          .circle(x, y, r)
          .fill(f.color)
          .moveTo(x, y)
          .lineTo(x + r, y - r * 0.3)
          .stroke({ width: 2, color: water });
    }
    floor.forEach((row, y) =>
      [...row].forEach((v, x) => {
        if (v === ' ') return;
        const sx = this.bx + x * c,
          sy = this.by + y * c;
        this.board.roundRect(sx + 3, sy + 7, c - 6, c - 8, 14).fill(under);
        this.board
          .roundRect(sx + 3, sy + 3, c - 6, c - 8, 14)
          .fill(stone)
          .stroke({ width: 2, color: under });
      }),
    );
    const finish = goal(floor);
    if (this.cradle) this.drawCradle(finish);
    else
      this.board
        .circle(this.bx + (finish.x + 0.5) * c, this.by + (finish.y + 0.5) * c - 2, c * 0.32)
        .fill(ink)
        .stroke({ width: 4, color: swatch.yellow.fill });
    this.drawLog();
    if (!this.finished)
      this.status.text = standsOnCradle(this.state, floor)
        ? 'Standing does not fit · lie it across both cradle stones'
        : `${this.moves} ${this.moves === 1 ? 'roll' : 'rolls'} · ${this.state.pose === 'up' ? 'standing on one stone' : 'lying across two stones'}`;
    for (const d of DIRECTIONS) {
      const node = this.directions[d];
      const old = node.getChildByLabel('hint');
      if (old) {
        node.removeChild(old);
        old.destroy();
      }
      if (this.hinted === d) {
        const glow = new Graphics()
          .roundRect(-61, -53, 122, 106, 20)
          .stroke({ width: 6, color: swatch.yellow.fill });
        glow.label = 'hint';
        glow.eventMode = 'none';
        node.addChild(glow);
      }
    }
  }
  /** Two shallow wooden cradles inside a gold rim around both stones; each cradle's trough runs along the lying log. */
  private drawCradle(finish: State) {
    const c = this.cell,
      { cx, cy, w, h } = boxOf(finish),
      x0 = this.bx + (cx - w / 2) * c,
      y0 = this.by + (cy - h / 2) * c;
    this.board
      .roundRect(x0 + 1, y0 + 1, w * c - 2, h * c - 4, 16)
      .stroke({ width: 5, color: swatch.yellow.fill });
    for (const [x, y] of footprint(finish)) {
      const mx = this.bx + (x + 0.5) * c,
        my = this.by + (y + 0.5) * c - 2,
        r = c * 0.3;
      // Seen from above, a cradle is a wooden saddle: two raised rims either side of a dark trough.
      const [rw, rh] = w > h ? [c * 0.62, r * 2] : [r * 2, c * 0.62];
      this.board
        .roundRect(mx - rw / 2, my - rh / 2, rw, rh, 10)
        .fill(wood.fill)
        .stroke({ width: 3, color: wood.line });
      if (w > h) this.board.roundRect(mx - rw / 2, my - rh * 0.22, rw, rh * 0.44, 6).fill(wood.line);
      else this.board.roundRect(mx - rw * 0.22, my - rh / 2, rw * 0.44, rh, 6).fill(wood.line);
    }
  }
  /** The log at its place in the tip (or lean), in cells, then scaled to the board. */
  private drawLog() {
    const c = this.cell,
      to = boxOf(this.state);
    let box = to,
      squash = 1,
      upright = this.state.pose === 'up';
    if (this.tip) {
      const k = ease.inOutSine(Math.min(1, this.tip.t / TIP)),
        { from } = this.tip;
      box = {
        cx: from.cx + (to.cx - from.cx) * k,
        cy: from.cy + (to.cy - from.cy) * k,
        w: from.w + (to.w - from.w) * k,
        h: from.h + (to.h - from.h) * k,
      };
      if (k < 0.5) upright = from.w === 1 && from.h === 1;
      if (this.tip.t > TIP) squash = 1 - 0.08 * Math.sin((Math.PI * (this.tip.t - TIP)) / LAND);
    }
    let dx = 0,
      dy = 0;
    if (this.lean) {
      const push = Math.sin((Math.PI * this.lean.t) / LEAN) * c * 0.14;
      [dx, dy] = STEP[this.lean.d].map((v) => v * push);
    }
    drawLog(this.logShape, box.w * c - 16, box.h * c - 16, upright);
    this.log.scale.set(1 / squash, squash);
    this.log.position.set(this.bx + box.cx * c + dx, this.by + box.cy * c + dy);
  }
  private showHint(spoken: boolean) {
    const next = solutionStep(this.state, this.puzzle.plan.floor)?.next;
    if (!next) return;
    if (countsAsHint(this.hinted, next)) this.hints++;
    this.hinted = next;
    this.draw();
    if (spoken) void this.ctx.say(this.cradle ? 'log.hint.cradle' : 'log.hint');
  }
  askForHint() {
    if (!this.finished) {
      this.settle();
      this.showHint(true);
    }
  }
  undo() {
    if (this.finished) return;
    this.settle();
    const before = this.history.pop();
    if (before) {
      this.state = before;
      this.hinted = null;
      this.failed = 0;
      sfx.tick();
      this.draw();
    }
  }
  restart() {
    if (this.finished) return;
    this.settle();
    this.state = { ...this.puzzle.start };
    this.history = [];
    this.hinted = null;
    this.failed = 0;
    this.draw();
    void this.ctx.say('log.restart');
  }
  resize(v: View) {
    const { floor } = this.puzzle.plan;
    this.cell = Math.min(96, (v.h - 440) / floor.length, (v.w - 160) / floor[0].length);
    this.bx = (v.w - this.cell * floor[0].length) / 2;
    this.heading.position.set(v.w / 2, 112);
    this.status.position.set(v.w / 2, 155);
    const bottom = this.by + this.cell * floor.length;
    (['left', 'up', 'down', 'right'] as const).forEach((d, i) =>
      this.directions[d].position.set(v.w / 2 + (i - 1.5) * 132, bottom + 76),
    );
    [this.undoButton, this.hintButton, this.againButton].forEach((node, i) =>
      node.position.set(v.w / 2 + (i - 1) * 184, bottom + 192),
    );
    this.draw();
  }
  autotouch(): TouchIntent | null {
    const next = solutionStep(this.state, this.puzzle.plan.floor)?.next;
    return !this.finished && !this.tip && !this.lean && next
      ? { tap: { on: this.directions[next] }, pause: 0.5 }
      : null;
  }
  update(dt: number) {
    if (this.tip) {
      this.tip.t += dt;
      if (this.tip.t >= TIP + LAND) {
        this.tip = null;
        this.drawLog();
        this.landed();
      } else this.drawLog();
    }
    if (this.lean) {
      this.lean.t += dt;
      if (this.lean.t >= LEAN) this.lean = null;
      this.drawLog();
    }
    if (this.ripple >= 0) {
      this.ripple = Math.min(RIPPLE, this.ripple + dt);
      const c = this.cell,
        finish = boxOf(goal(this.puzzle.plan.floor)),
        x = this.bx + finish.cx * c,
        y = this.by + finish.cy * c;
      this.ripples.clear();
      for (const lag of [0, 0.25, 0.5]) {
        const k = (this.ripple - lag) / (RIPPLE - 0.5);
        if (k > 0 && k < 1)
          this.ripples
            .circle(x, y, c * (0.45 + 0.9 * k))
            .stroke({ width: 4, color: swatch.white.fill, alpha: 1 - k });
      }
    }
  }
  destroy() {}
}
function iconArt(seed = 0) {
  const c = new Container();
  c.addChild(
    new Graphics()
      .roundRect(-105, -195, 210, 180, 24)
      .fill(swatch.teal.light)
      .stroke({ width: 4, color: swatch.teal.line }),
  );
  const log = logArt(148, 70, false);
  log.position.set(-10, -125);
  log.rotation = ((seed % 3) - 1) * 0.08;
  c.addChild(log);
  c.addChild(new Graphics().circle(60, -50, 24).fill(ink).stroke({ width: 5, color: swatch.yellow.fill }));
  return c;
}
export const logRoll: GameModule = {
  id: 'log-roll',
  name: 'Log Roll',
  titleLine: 'game.log-roll',
  region: 'puzzle-peaks',
  challenge: 'space',
  skills: ['spatial-reasoning', 'planning', 'mental-rotation'],
  bands: ['grownup'],
  touchDemo: true,
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.lullaby,
  coplayHint: 'Predict which stones the log will cover before each roll. Take turns planning and tipping.',
  offScreen: 'Tip a small rectangular box across a paper grid. Mark a space where it should finish standing.',
  hubIcon: () => new WigglyIcon(iconArt()),
  sticker: (seed) => {
    const c = iconArt(seed);
    c.pivot.set(0, -100);
    c.scale.set(0.65);
    return c;
  },
  create: (ctx) => new LogRoll(ctx),
};
