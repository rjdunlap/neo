import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  complete,
  DIRECTIONS,
  makePuzzle,
  planFor,
  SIZE,
  slide,
  solve,
  type Direction,
} from './logic';

const ARROWS = { left: '←', up: '↑', right: '→', down: '↓' };

function snowball(value: number, radius: number) {
  const c = new Container(),
    shade = value >= 16 ? swatch.purple : swatch.blue;
  c.eventMode = 'none';
  c.addChild(
    new Graphics()
      .circle(0, 4, radius)
      .fill(shade.line)
      .circle(0, 0, radius)
      .fill(shade.light)
      .stroke({ width: 3, color: shade.line })
      .ellipse(-radius * 0.3, -radius * 0.35, radius * 0.28, radius * 0.16)
      .fill(swatch.white.fill),
  );
  c.addChild(label(String(value), radius * 0.8, ink));
  return c;
}

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

class SnowballMerge implements Game {
  readonly puzzle;
  board: number[];
  route: Direction[] | null = null;
  hinted: Direction | 'undo' | null = null;
  misses = 0;
  hints = 0;
  slides = 0;
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
  private readonly balls = new Container();
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
    this.puzzle = makePuzzle(ctx.level, ctx.rng);
    this.board = this.puzzle.board.slice();
    for (const part of [this.field, this.ground, this.balls, this.glow, this.title, this.status])
      part.eventMode = 'none';
    this.field.addChild(this.ground, this.balls);
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

  start() {
    void this.ctx.instruct('snowball.go', { target: this.puzzle.target });
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
    this.ground
      .clear()
      .roundRect(-14, -14, w + 28, w + 28, 24)
      .fill(swatch.blue.light)
      .stroke({ width: 5, color: swatch.blue.line });
    for (let i = 0; i < SIZE * SIZE; i++) {
      const p = this.center(i);
      this.ground
        .roundRect(p.x - this.cell / 2 + 5, p.y - this.cell / 2 + 5, this.cell - 10, this.cell - 10, 14)
        .fill(swatch.white.light);
    }
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
      if (!value) return;
      const node = snowball(value, 42),
        p = this.center(i);
      node.scale.set(this.cell / 108);
      node.position.set(p.x, p.y);
      this.balls.addChild(node);
      this.nodes.set(i, node);
    });
  }
  private refresh() {
    this.route = solve(this.board, this.puzzle.target);
    this.title.text = `Merge to ${this.puzzle.target}`;
    this.status.text =
      this.route === null
        ? 'Try Undo or Start over to find a new route.'
        : `${this.board.filter((v) => v > 0).length} snowballs · ${this.slides} slides`;
    this.undoButton.alpha = this.history.length ? 1 : 0.55;
    this.drawBalls();
  }

  private async move(direction: Direction) {
    if (!this.ctx.alive || this.busy || this.finished) return;
    const next = slide(this.board, direction);
    if (!next.changed) {
      // An inert arrow is exploration, never evidence of a wrong answer.
      sfx.boing();
      void this.ctx.say('snowball.still');
      return;
    }
    this.busy = true;
    this.hinted = null;
    this.history.push(this.board.slice());
    if (this.history.length > 100) this.history.shift();
    this.slides++;
    if (next.merges) sfx.bell(2 + next.merges);
    else sfx.marimba(1);
    await Promise.all(
      next.motions.map((m) => {
        const node = this.nodes.get(m.from)!;
        return this.ctx.tw.to(node, this.center(m.to), { duration: 0.18 });
      }),
    );
    if (!this.ctx.alive) return;
    this.board = next.board;
    this.busy = false;
    this.refresh();
    if (complete(this.board, this.puzzle.target)) {
      this.finished = true;
      await this.ctx.say('snowball.done', { target: this.puzzle.target });
      if (this.ctx.alive) this.ctx.finish({ misses: this.misses, hints: this.hints });
    } else if (this.route === null) void this.ctx.say('snowball.stuck');
  }

  undo() {
    if (!this.ctx.alive || this.busy || this.finished || !this.history.length) return;
    this.board = this.history.pop()!;
    this.hinted = null;
    this.refresh();
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
    this.hinted = null;
    // Restart is support, so a supported completion cannot appear as independent mastery.
    this.hints++;
    this.refresh();
    void this.ctx.say('snowball.restart');
  }
  askForHint() {
    if (!this.ctx.alive || this.busy || this.finished || this.hinted) return;
    this.hinted = this.route?.[0] ?? 'undo';
    this.hints++;
    if (this.hinted === 'undo') void this.ctx.say('snowball.stuck');
    else void this.ctx.say(`snowball.${this.hinted}`);
  }
  autotouch(_dt: number): TouchIntent | null {
    if (!this.ctx.alive || this.busy || this.finished) return null;
    const direction = this.route?.[0];
    return direction ? { tap: { on: this.arrows[direction] }, pause: 0.22 } : null;
  }
  update(dt: number) {
    this.clock += dt;
    this.flash -= dt;
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
