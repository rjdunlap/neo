import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { BOARDS } from './boards';
import {
  LEVELS,
  complete,
  DIRECTIONS,
  FIELD_LOOKS,
  makePuzzle,
  nextHelp,
  NO_HELP,
  overshot,
  PLANS,
  planFor,
  ROCK,
  SIZE,
  sizeLook,
  slide,
  solve,
  type Direction,
  type FieldLook,
  type Help,
  type HelpEvent,
} from './logic';

const ARROWS = { left: '←', up: '↑', right: '→', down: '↓' };

/** A snowball in its size's look. The drawing sits in one inner container, so a join can squash and pop it without
 * fighting the outer node's scale, which follows the cell size. */
function snowball(value: number, radius = sizeLook(value).radius) {
  const c = new Container(),
    body = new Container(),
    look = sizeLook(value),
    shade = swatch[look.color];
  c.eventMode = body.eventMode = 'none';
  const g = new Graphics()
    .circle(0, 4, radius)
    .fill(shade.line)
    .circle(0, 0, radius)
    .fill(shade.light)
    .stroke({ width: 3, color: shade.line })
    .ellipse(-radius * 0.3, -radius * 0.35, radius * 0.28, radius * 0.16)
    .fill(swatch.white.fill);
  if (look.scarf)
    g.roundRect(-radius * 0.68, radius * 0.48, radius * 1.36, radius * 0.2, radius * 0.1)
      .fill(swatch.red.fill)
      .roundRect(radius * 0.25, radius * 0.55, radius * 0.2, radius * 0.45, radius * 0.08)
      .fill(swatch.red.line);
  if (look.face)
    g.circle(-radius * 0.34, -radius * 0.56, radius * 0.09)
      .circle(radius * 0.34, -radius * 0.56, radius * 0.09)
      .fill(ink);
  body.addChild(g, label(String(value), radius * 0.8, ink));
  c.addChild(body);
  return c;
}
const bodyOf = (node: Container) => node.children[0] as Container;

/** How each seeded field look colours the snowfield; dusk adds stars, a flurry adds slow flakes that never touch play. */
const FIELD_COLORS: Record<FieldLook, { ground: number; line: number; cell: number }> = {
  morning: { ground: swatch.blue.light, line: swatch.blue.line, cell: swatch.white.light },
  dusk: { ground: swatch.purple.light, line: swatch.purple.line, cell: swatch.blue.light },
  flurry: { ground: swatch.teal.light, line: swatch.teal.line, cell: swatch.white.fill },
};

/**
 * Where the field and its buttons go: the field's top-left corner and cell, the 100-unit arrows in one row under it (which
 * keeps every button apart and clear of the corner pet, in both orientations) and the 160 × 100 Undo, Hint and Start over
 * row under them. An upright phone (chunk 31) has the width for 160-unit cells.
 */
export function snowballLayout(v: View) {
  const cell = Math.min(v.upright ? 160 : 128, (v.h - 430) / SIZE);
  const top = 155 + (v.h - 768) * 0.3,
    w = cell * SIZE;
  const arrows = Object.fromEntries(
    (['left', 'up', 'down', 'right'] as Direction[]).map((d, i) => [
      d,
      { x: v.w / 2 + (i - 1.5) * 120, y: top + w + 78 },
    ]),
  ) as Record<Direction, { x: number; y: number }>;
  return {
    cell,
    field: { x: (v.w - w) / 2, y: top },
    arrows,
    buttons: [0, 1, 2].map((i) => ({ x: v.w / 2 + (i - 1) * 180, y: top + w + 190 })),
  };
}

/** The stacked finish, base first: equal snowballs are drawn a little bigger below and smaller on top, so three 16s
 * read as a snowman. `y` is in cells down the field. */
const STACK = [
  { y: 2.3, scale: 1.15 },
  { y: 1.66, scale: 1 },
  { y: 1.12, scale: 0.85 },
];

class SnowballMerge implements Game {
  readonly puzzle;
  board: number[];
  route: Direction[] | null = null;
  help: Help = NO_HELP;
  misses = 0;
  slides = 0;
  /** The shortest route from the starting board, shown beside her slide count after the finish as information only. */
  readonly par: number;
  readonly look: FieldLook;
  busy = false;
  finished = false;
  readonly arrows = Object.fromEntries(DIRECTIONS.map((d) => [d, new Container()])) as Record<
    Direction,
    Container
  >;
  readonly undoButton = new Container();
  readonly hintButton = new Container();
  readonly restartButton = new Container();
  readonly field = new Container();
  private readonly ground = new Graphics();
  private readonly rocks = new Graphics();
  private readonly balls = new Container();
  /** Level 6: the round is over and its snowballs stand stacked as a snowman, biggest at the bottom. */
  stacked = false;
  /** The ice rock's line is said once a round, the first time a snowball stops beside it. */
  rockSaid = false;
  private readonly sky = new Graphics();
  private readonly flakes = new Graphics();
  private readonly starSpots: { x: number; y: number; r: number }[] = [];
  private readonly flakeSpots: { x: number; y: number; r: number; speed: number }[] = [];
  private readonly glow = new Graphics();
  private readonly title = label('', 36);
  private readonly status = label('', 24, ink, '500');
  private nodes = new Map<number, Container>();
  private history: number[][] = [];
  private cell = 108;
  private clock = 0;
  private pressed: Container | null = null;
  private flash = 0;

  constructor(private readonly ctx: GameContext) {
    this.puzzle = makePuzzle(ctx.level, ctx.rng, BOARDS[PLANS.indexOf(planFor(ctx.level))]);
    this.board = this.puzzle.board.slice();
    this.par = solve(this.puzzle.board, this.puzzle.goal)?.length ?? 0;
    // Drawn after the puzzle, so a look never changes which board a seed gives.
    this.look = ctx.rng.pick(FIELD_LOOKS);
    for (let i = 0; i < 9; i++)
      this.starSpots.push({ x: ctx.rng.range(0, 1), y: ctx.rng.range(0, 1), r: ctx.rng.range(4, 7) });
    if (this.look === 'flurry')
      for (let i = 0; i < 14; i++)
        this.flakeSpots.push({
          x: ctx.rng.range(0, 1),
          y: ctx.rng.range(0, 1),
          r: ctx.rng.range(2.5, 5),
          speed: ctx.rng.range(0.03, 0.07),
        });
    for (const part of [
      this.field,
      this.ground,
      this.rocks,
      this.balls,
      this.sky,
      this.flakes,
      this.glow,
      this.title,
      this.status,
    ])
      part.eventMode = 'none';
    this.field.addChild(this.sky, this.ground, this.rocks, this.flakes, this.balls);
    ctx.stage.addChild(this.field, this.title, this.status);
    for (const d of DIRECTIONS) {
      const node = this.arrows[d];
      node.addChild(tile(100, 100, 'blue'), label(ARROWS[d], 50));
      node.hitArea = new Rectangle(-50, -50, 100, 100);
      onTap(node, () => {
        this.feedback(node);
        void this.move(d);
      });
      ctx.stage.addChild(node);
    }
    const buttons: [Container, string, () => void][] = [
      [this.undoButton, 'Undo ↶', () => this.undo()],
      [this.hintButton, 'Hint ◇', () => this.askForHint()],
      [this.restartButton, 'Start over ↺', () => this.restart()],
    ];
    for (const [node, text, act] of buttons) {
      node.addChild(tile(160, 100, 'purple'), label(text, 24));
      node.hitArea = new Rectangle(-80, -50, 160, 100);
      onTap(node, () => {
        this.feedback(node);
        act();
      });
      ctx.stage.addChild(node);
    }
    ctx.stage.addChild(this.glow);
    this.resize(ctx.view);
    this.refresh();
  }

  get hinted() {
    return this.help.hinted;
  }
  get hints() {
    return this.help.hints;
  }
  private assist(event: HelpEvent) {
    const before = this.help.hinted;
    this.help = nextHelp(this.help, event, this.route);
    return this.help.hinted !== before ? this.help.hinted : null;
  }

  /** Level 6 asks for several snowballs (a snowman) instead of one. */
  private get snowman() {
    return typeof this.puzzle.goal === 'number' ? null : this.puzzle.goal;
  }
  /** A board that cannot finish: on the snowman level a join too many gets its own line, since Undo is the only way back. */
  private get stuckLine() {
    return overshot(this.board, this.puzzle.goal) ? 'snowball.over' : 'snowball.stuck';
  }
  start() {
    if (this.snowman) void this.ctx.instruct('snowball.go.snowman');
    else void this.ctx.instruct('snowball.go', { target: this.puzzle.target });
  }
  private feedback(node: Container) {
    if (this.ctx.alive && !this.finished) {
      this.pressed = node;
      this.flash = 0.18;
    }
  }
  private center(i: number) {
    return { x: ((i % SIZE) + 0.5) * this.cell, y: (Math.floor(i / SIZE) + 0.5) * this.cell };
  }

  resize(v: View) {
    const l = snowballLayout(v);
    this.cell = l.cell;
    const top = l.field.y,
      w = this.cell * SIZE;
    this.field.position.copyFrom(l.field);
    this.title.position.set(v.w / 2, top - 70);
    this.status.position.set(v.w / 2, top - 40);
    const colors = FIELD_COLORS[this.look];
    this.ground
      .clear()
      .roundRect(-14, -14, w + 28, w + 28, 24)
      .fill(colors.ground)
      .stroke({ width: 5, color: colors.line });
    for (let i = 0; i < SIZE * SIZE; i++) {
      const p = this.center(i);
      this.ground
        .roundRect(p.x - this.cell / 2 + 5, p.y - this.cell / 2 + 5, this.cell - 10, this.cell - 10, 14)
        .fill(colors.cell);
    }
    // The ice rock (level 5): a grey-blue block frozen into its cell. It never moves, so it is drawn with the field.
    this.rocks.clear();
    this.puzzle.board.forEach((value, i) => {
      if (value !== ROCK) return;
      const p = this.center(i),
        r = this.cell * 0.4;
      this.rocks
        .poly(
          [-0.95, 0.75, -0.8, -0.25, -0.3, -0.9, 0.45, -0.8, 0.95, -0.1, 0.85, 0.75].map(
            (n, k) => (k % 2 ? p.y : p.x) + n * r,
          ),
        )
        .fill(swatch.white.line)
        .stroke({ width: 4, color: swatch.blue.line, join: 'round' })
        .poly(
          [-0.8, -0.25, -0.3, -0.9, 0.45, -0.8, 0.1, -0.15, -0.35, 0.05].map(
            (n, k) => (k % 2 ? p.y : p.x) + n * r,
          ),
        )
        .fill(swatch.blue.light)
        .poly([0.45, -0.8, 0.95, -0.1, 0.35, 0.3, 0.1, -0.15].map((n, k) => (k % 2 ? p.y : p.x) + n * r))
        .fill({ color: swatch.white.fill, alpha: 0.55 });
    });
    // Dusk: a few drawn stars in the margins beside the field.
    this.sky.clear();
    if (this.look === 'dusk')
      this.starSpots.forEach((star, i) => {
        const x = i % 2 ? w + 30 + star.x * 30 : -30 - star.x * 30,
          y = star.y * w,
          r = star.r;
        this.sky
          .moveTo(x, y - r * 2)
          .lineTo(x + r * 0.5, y - r * 0.5)
          .lineTo(x + r * 2, y)
          .lineTo(x + r * 0.5, y + r * 0.5)
          .lineTo(x, y + r * 2)
          .lineTo(x - r * 0.5, y + r * 0.5)
          .lineTo(x - r * 2, y)
          .lineTo(x - r * 0.5, y - r * 0.5)
          .closePath()
          .fill(swatch.yellow.fill);
      });
    DIRECTIONS.forEach((d) => this.arrows[d].position.copyFrom(l.arrows[d]));
    [this.undoButton, this.hintButton, this.restartButton].forEach((b, i) =>
      b.position.copyFrom(l.buttons[i]),
    );
    // Nodes remain the same during a tween; scale and its final position follow the new view.
    for (const node of this.nodes.values()) node.scale.set(this.cell / 108);
    if (!this.busy) this.drawBalls();
  }

  private drawBalls() {
    for (const node of this.balls.removeChildren()) node.destroy({ children: true });
    this.nodes.clear();
    this.board.forEach((value, i) => {
      if (value <= 0) return;
      const node = snowball(value),
        p = this.center(i);
      node.scale.set(this.cell / 108);
      node.position.set(p.x, p.y);
      this.balls.addChild(node);
      this.nodes.set(i, node);
    });
    if (!this.stacked) return;
    // The snowman: biggest at the bottom, each drawn over the one below, coal eyes and a carrot on the top one.
    const order = this.stackOrder();
    order.forEach((i, k) => {
      const node = this.nodes.get(i)!;
      node.position.copyFrom(this.stackSpot(k));
      node.scale.set((this.cell / 108) * STACK[Math.min(k, STACK.length - 1)].scale);
      this.balls.addChild(node);
    });
    const r = sizeLook(this.board[order.at(-1)!]).radius;
    bodyOf(this.nodes.get(order.at(-1)!)!).addChild(
      new Graphics()
        .circle(-r * 0.34, -r * 0.56, r * 0.09)
        .circle(r * 0.34, -r * 0.56, r * 0.09)
        .fill(ink)
        .poly([r * 0.5, -r * 0.3, r * 1.05, -r * 0.16, r * 0.5, -r * 0.04])
        .fill(swatch.orange.fill)
        .stroke({ width: 2, color: swatch.orange.line, join: 'round' }),
    );
  }
  /** The cells holding snowballs, biggest first: the order they stack in. */
  private stackOrder() {
    return this.board
      .map((v, i) => [v, i])
      .filter(([v]) => v > 0)
      .sort((a, b) => b[0] - a[0] || a[1] - b[1])
      .map(([, i]) => i);
  }
  /** Where the k-th snowball of the snowman stands (0 is the base), up the middle of the field. */
  private stackSpot(k: number) {
    return { x: this.cell * 1.5, y: this.cell * STACK[Math.min(k, STACK.length - 1)].y };
  }
  private refresh() {
    this.route = solve(this.board, this.puzzle.goal);
    this.title.text = this.snowman
      ? `Snowman: ${this.snowman.join(' + ')}`
      : `Merge to ${this.puzzle.target}`;
    this.status.text = complete(this.board, this.puzzle.goal)
      ? `${this.slides} slides · the shortest route is ${this.par}`
      : this.route === null
        ? overshot(this.board, this.puzzle.goal)
          ? 'One join too many: Undo takes it back.'
          : 'Try Undo or Start over to find a new route.'
        : `${this.board.filter((v) => v > 0).length} snowballs · ${this.slides} slides`;
    this.undoButton.alpha = this.history.length ? 1 : 0.55;
    this.drawBalls();
  }

  private async move(direction: Direction) {
    if (!this.ctx.alive || this.busy || this.finished) return;
    const next = slide(this.board, direction);
    if (!next.changed) {
      // An inert arrow is exploration, never evidence of a wrong answer; a second in a row lights the way on.
      sfx.boing();
      const lit = this.assist('inert');
      void this.ctx.say(lit ? (lit === 'undo' ? this.stuckLine : `snowball.${lit}`) : 'snowball.still');
      return;
    }
    this.busy = true;
    this.history.push(this.board.slice());
    if (this.history.length > 100) this.history.shift();
    this.slides++;
    if (next.merges) sfx.bell(2 + next.merges);
    else sfx.marimba(1);
    // Cells two snowballs arrive in: they squash into each other, then the doubled ball pops in with a puff.
    const joins = [...new Set(next.motions.map((m) => m.to))].filter(
      (to) => next.motions.filter((m) => m.to === to).length === 2,
    );
    await Promise.all(
      next.motions.map((m) => {
        const node = this.nodes.get(m.from)!;
        return this.ctx.tw.to(node, this.center(m.to), { duration: 0.18 });
      }),
    );
    if (!this.ctx.alive) return;
    if (joins.length) {
      await Promise.all(
        next.motions
          .filter((m) => joins.includes(m.to))
          .map((m) =>
            this.ctx.tw.to(bodyOf(this.nodes.get(m.from)!).scale, { x: 1.18, y: 0.8 }, { duration: 0.06 }),
          ),
      );
      if (!this.ctx.alive) return;
    }
    this.board = next.board;
    this.refresh();
    // A slide into a dead end lights Undo on its own and says so.
    if (this.assist('changed') === 'undo') void this.ctx.say(this.stuckLine);
    else if (next.rocked && !this.rockSaid && this.route?.length) {
      // Stopping at the rock is how the level works, never a miss: name the rule once, the first time it shows.
      this.rockSaid = true;
      void this.ctx.say('snowball.rock');
    }
    if (joins.length) {
      for (const to of joins) {
        const p = this.ctx.particles.toLocal(this.balls.toGlobal(this.center(to)));
        this.ctx.particles.burst(p.x, p.y, {
          kind: 'dot',
          colors: [swatch.white.fill, swatch.blue.light],
          count: 7,
          speed: [40, 110],
          gravity: -30,
          size: [0.18, 0.32],
          life: [0.35, 0.6],
        });
      }
      await Promise.all(
        joins.map((to) => {
          const body = bodyOf(this.nodes.get(to)!);
          body.scale.set(1.15);
          return this.ctx.tw.to(body.scale, { x: 1, y: 1 }, { duration: 0.16, ease: ease.outBack });
        }),
      );
      if (!this.ctx.alive) return;
    }
    if (complete(this.board, this.puzzle.goal)) {
      this.finished = true;
      if (this.snowman) {
        // The stacked finish: the snowballs roll to the middle and stand on each other. Still busy, so a resize waits.
        const order = this.stackOrder();
        order.forEach((i) => this.balls.addChild(this.nodes.get(i)!));
        await Promise.all(
          order.map((i, k) =>
            this.ctx.tw.to(this.nodes.get(i)!, this.stackSpot(k), { duration: 0.4, ease: ease.outBack }),
          ),
        );
        if (!this.ctx.alive) return;
        this.stacked = true;
        this.drawBalls();
        sfx.bell(5);
      }
      this.busy = false;
      if (this.snowman) await this.ctx.say('snowball.done.snowman');
      else await this.ctx.say('snowball.done', { target: this.puzzle.target });
      if (this.ctx.alive) this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    this.busy = false;
    if (this.route === null) void this.ctx.say(this.stuckLine);
  }

  undo() {
    if (!this.ctx.alive || this.busy || this.finished || !this.history.length) return;
    this.board = this.history.pop()!;
    this.refresh();
    this.assist('changed');
  }
  restart() {
    if (
      !this.ctx.alive ||
      this.busy ||
      this.finished ||
      this.board.every((v, i) => v === this.puzzle.board[i])
    )
      return;
    this.board = this.puzzle.board.slice();
    this.history = [];
    this.refresh();
    this.assist('changed');
    // Restart is support, so a supported completion cannot appear as independent mastery.
    this.help = { ...this.help, hints: this.help.hints + 1 };
    void this.ctx.say('snowball.restart');
  }
  askForHint() {
    if (!this.ctx.alive || this.busy || this.finished || this.hinted) return;
    const lit = this.assist('ask');
    if (lit === 'undo') void this.ctx.say(this.stuckLine);
    else if (lit) void this.ctx.say(`snowball.${lit}`);
  }
  autotouch(_dt: number): TouchIntent | null {
    if (!this.ctx.alive || this.busy || this.finished) return null;
    const direction = this.route?.[0];
    return direction ? { tap: { on: this.arrows[direction] }, pause: 0.22 } : null;
  }
  update(dt: number) {
    this.clock += dt;
    this.flash -= dt;
    if (this.flakeSpots.length) {
      const w = this.cell * SIZE,
        f = this.flakes.clear();
      for (const flake of this.flakeSpots) {
        flake.y = (flake.y + flake.speed * dt) % 1;
        const x = (flake.x + Math.sin(this.clock * 0.6 + flake.r) * 0.02) * (w + 20) - 10;
        f.circle(x, flake.y * (w + 20) - 10, flake.r);
      }
      f.fill({ color: swatch.white.fill, alpha: 0.85 });
    }
    const g = this.glow.clear();
    if (!this.ctx.alive || this.finished) return;
    const ring = (node: Container, w: number, color: number) =>
      g.roundRect(node.x - w / 2 - 3, node.y - 53, w + 6, 106, 20).stroke({ width: 5, color });
    if (this.flash > 0 && this.pressed)
      ring(
        this.pressed,
        this.pressed === this.undoButton ||
          this.pressed === this.hintButton ||
          this.pressed === this.restartButton
          ? 160
          : 100,
        swatch.white.fill,
      );
    if (this.hinted && !this.busy) {
      const node = this.hinted === 'undo' ? this.undoButton : this.arrows[this.hinted];
      ring(node, this.hinted === 'undo' ? 160 : 100, swatch.yellow.fill);
      g.alpha = 0.85 + Math.sin(this.clock * 5) * 0.15;
    } else g.alpha = 1;
  }
  destroy() {}
}

function sticker(seed: number) {
  const c = new Container(),
    rng = new Rng(seed);
  const value = rng.pick([16, 32, 64]);
  c.addChild(snowball(value, 68));
  const sparkles = new Graphics();
  for (let i = 0; i < 7; i++) {
    const angle = rng.range(0, Math.PI * 2),
      r = rng.range(80, 100),
      x = Math.cos(angle) * r,
      y = Math.sin(angle) * r;
    sparkles
      .moveTo(x - 5, y)
      .lineTo(x + 5, y)
      .moveTo(x, y - 5)
      .lineTo(x, y + 5)
      .stroke({ width: 3, color: swatch.blue.line });
  }
  c.addChild(sparkles);
  return c;
}
export const snowballMerge: GameModule = {
  id: 'snowball-merge',
  name: 'Snowball Merge',
  titleLine: 'game.snowball-merge',
  region: 'puzzle-peaks',
  challenge: 'space',
  skills: ['spatial-planning', 'doubling', 'revision'],
  bands: ['grownup'],
  upright: true,
  inputs: ['touch'],
  touchDemo: true,
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.lullaby,
  coplayHint: 'Predict which pair will join before pressing an arrow. Compare two possible slide orders.',
  offScreen:
    'Put numbered counters in a three-by-three grid. Slide a row toward an edge and replace equal neighbours with their doubled number.',
  hubIcon: () => {
    const c = sticker(143);
    c.y = -90;
    return new WigglyIcon(c);
  },
  sticker,
  create: (ctx) => new SnowballMerge(ctx),
};
