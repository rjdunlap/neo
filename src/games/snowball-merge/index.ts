import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { complete, DIRECTIONS, makePuzzle, planFor, SIZE, slide, solve, type Direction } from './logic';

const LEVELS: BandLevels = { grownup: { min: 1, max: 3 } };
const ARROWS = { left: '←', up: '↑', right: '→', down: '↓' };

function snowball(value: number, radius: number) {
  const c = new Container(), shade = value >= 16 ? swatch.purple : swatch.blue;
  c.eventMode = 'none';
  c.addChild(new Graphics().circle(0, 4, radius).fill(shade.line)
    .circle(0, 0, radius).fill(shade.light).stroke({ width: 3, color: shade.line })
    .ellipse(-radius * 0.3, -radius * 0.35, radius * 0.28, radius * 0.16).fill(swatch.white.fill));
  c.addChild(label(String(value), radius * 0.8, ink));
  return c;
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
  readonly arrows = Object.fromEntries(DIRECTIONS.map(d => [d, new Container()])) as Record<Direction, Container>;
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
  private dead = false;
  private clock = 0;
  private pressed: Container | null = null;
  private flash = 0;

  constructor(private readonly ctx: GameContext) {
    this.puzzle = makePuzzle(ctx.level, ctx.rng);
    this.board = this.puzzle.board.slice();
    for (const part of [this.field, this.ground, this.balls, this.glow, this.title, this.status]) part.eventMode = 'none';
    this.field.addChild(this.ground, this.balls);
    ctx.stage.addChild(this.field, this.title, this.status);
    for (const d of DIRECTIONS) {
      const node = this.arrows[d];
      node.addChild(tile(100, 100, 'blue'), label(ARROWS[d], 50));
      node.hitArea = new Rectangle(-50, -50, 100, 100);
      onTap(node, () => { this.feedback(node); void this.move(d); });
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
      onTap(node, () => { this.feedback(node); act(); });
      ctx.stage.addChild(node);
    }
    ctx.stage.addChild(this.glow);
    this.resize(ctx.view);
    this.refresh();
  }

  start() { void this.ctx.instruct('snowball.go', { target: this.puzzle.target }); }
  private feedback(node: Container) { if (!this.dead && !this.finished) { this.pressed = node; this.flash = 0.18; } }
  private center(i: number) { return { x: (i % SIZE + 0.5) * this.cell, y: (Math.floor(i / SIZE) + 0.5) * this.cell }; }

  resize(v: View) {
    this.cell = Math.min(128, (v.h - 430) / SIZE);
    const top = 155 + (v.h - 768) * 0.3, w = this.cell * SIZE;
    this.field.position.set((v.w - w) / 2, top);
    this.title.position.set(v.w / 2, top - 70);
    this.status.position.set(v.w / 2, top - 40);
    this.ground.clear().roundRect(-14, -14, w + 28, w + 28, 24).fill(swatch.blue.light).stroke({ width: 5, color: swatch.blue.line });
    for (let i = 0; i < SIZE * SIZE; i++) {
      const p = this.center(i);
      this.ground.roundRect(p.x - this.cell / 2 + 5, p.y - this.cell / 2 + 5, this.cell - 10, this.cell - 10, 14).fill(swatch.white.light);
    }
    // A horizontal arrow row keeps every button apart and clear of the corner pet, in both orientations.
    (['left', 'up', 'down', 'right'] as Direction[]).forEach((d, i) => this.arrows[d].position.set(v.w / 2 + (i - 1.5) * 120, top + w + 78));
    [this.undoButton, this.hintButton, this.restartButton].forEach((b, i) => b.position.set(v.w / 2 + (i - 1) * 180, top + w + 190));
    // Nodes remain the same during a tween; scale and its final position follow the new view.
    for (const node of this.nodes.values()) node.scale.set(this.cell / 108);
    if (!this.busy) this.drawBalls();
  }

  private drawBalls() {
    for (const node of this.balls.removeChildren()) node.destroy({ children: true });
    this.nodes.clear();
    this.board.forEach((value, i) => {
      if (!value) return;
      const node = snowball(value, 42), p = this.center(i);
      node.scale.set(this.cell / 108); node.position.set(p.x, p.y);
      this.balls.addChild(node); this.nodes.set(i, node);
    });
  }
  private refresh() {
    this.route = solve(this.board, this.puzzle.target);
    this.title.text = `Merge to ${this.puzzle.target}`;
    this.status.text = this.route === null ? 'Try Undo or Start over to find a new route.' : `${this.board.filter(v => v > 0).length} snowballs · ${this.slides} slides`;
    this.undoButton.alpha = this.history.length ? 1 : 0.55;
    this.drawBalls();
  }

  private async move(direction: Direction) {
    if (this.dead || this.busy || this.finished) return;
    const next = slide(this.board, direction);
    if (!next.changed) {
      // An inert arrow is exploration, never evidence of a wrong answer.
      sfx.boing(); void this.ctx.say('snowball.still'); return;
    }
    this.busy = true; this.hinted = null;
    this.history.push(this.board.slice());
    if (this.history.length > 100) this.history.shift();
    this.slides++;
    if (next.merges) sfx.bell(2 + next.merges); else sfx.marimba(1);
    await Promise.all(next.motions.map(m => {
      const node = this.nodes.get(m.from)!;
      return this.ctx.tw.to(node, this.center(m.to), { duration: 0.18 });
    }));
    if (this.dead) return;
    this.board = next.board;
    this.busy = false;
    this.refresh();
    if (complete(this.board, this.puzzle.target)) {
      this.finished = true;
      await this.ctx.say('snowball.done', { target: this.puzzle.target });
      if (!this.dead) this.ctx.finish({ misses: this.misses, hints: this.hints });
    } else if (this.route === null) void this.ctx.say('snowball.stuck');
  }

  undo() {
    if (this.dead || this.busy || this.finished || !this.history.length) return;
    this.board = this.history.pop()!; this.hinted = null; this.refresh();
  }
  restart() {
    if (this.dead || this.busy || this.finished || this.board.every((v, i) => v === this.puzzle.board[i])) return;
    this.board = this.puzzle.board.slice(); this.history = []; this.hinted = null;
    // Restart is support, so a supported completion cannot appear as independent mastery.
    this.hints++; this.refresh(); void this.ctx.say('snowball.restart');
  }
  askForHint() {
    if (this.dead || this.busy || this.finished || this.hinted) return;
    this.hinted = this.route?.[0] ?? 'undo'; this.hints++;
    if (this.hinted === 'undo') void this.ctx.say('snowball.stuck');
    else void this.ctx.say(`snowball.${this.hinted}`);
  }
  autotouch(_dt: number): TouchIntent | null {
    if (this.dead || this.busy || this.finished) return null;
    const direction = this.route?.[0];
    return direction ? { tap: { on: this.arrows[direction] }, pause: 0.22 } : null;
  }
  update(dt: number) {
    this.clock += dt; this.flash -= dt;
    const g = this.glow.clear();
    if (this.dead || this.finished) return;
    const ring = (node: Container, w: number, color: number) => g.roundRect(node.x - w / 2 - 3, node.y - 53, w + 6, 106, 20).stroke({ width: 5, color });
    if (this.flash > 0 && this.pressed) ring(this.pressed, this.pressed === this.undoButton || this.pressed === this.hintButton || this.pressed === this.restartButton ? 160 : 100, swatch.white.fill);
    if (this.hinted && !this.busy) {
      const node = this.hinted === 'undo' ? this.undoButton : this.arrows[this.hinted];
      ring(node, this.hinted === 'undo' ? 160 : 100, swatch.yellow.fill);
      g.alpha = 0.85 + Math.sin(this.clock * 5) * 0.15;
    } else g.alpha = 1;
  }
  destroy() { this.dead = true; }
}

function sticker(seed: number) {
  const c = new Container(), rng = new Rng(seed);
  const value = rng.pick([16, 32, 64]);
  c.addChild(snowball(value, 68));
  const sparkles = new Graphics();
  for (let i = 0; i < 7; i++) {
    const angle = rng.range(0, Math.PI * 2), r = rng.range(80, 100), x = Math.cos(angle) * r, y = Math.sin(angle) * r;
    sparkles.moveTo(x - 5, y).lineTo(x + 5, y).moveTo(x, y - 5).lineTo(x, y + 5).stroke({ width: 3, color: swatch.blue.line });
  }
  c.addChild(sparkles); return c;
}
export const snowballMerge: GameModule = {
  id: 'snowball-merge', name: 'Snowball Merge', titleLine: 'game.snowball-merge', region: 'puzzle-peaks',
  skills: ['spatial-planning', 'doubling', 'revision'], bands: ['grownup'], inputs: ['touch'], touchDemo: true,
  levels: band => rangeFor(LEVELS, band), describeLevel: level => planFor(level).name, music: STYLES.lullaby,
  coplayHint: 'Predict which pair will join before pressing an arrow. Compare two possible slide orders.',
  offScreen: 'Put numbered counters in a three-by-three grid. Slide a row toward an edge and replace equal neighbours with their doubled number.',
  hubIcon: () => { const c = sticker(143); c.y = -90; return new WigglyIcon(c); }, sticker,
  create: ctx => new SnowballMerge(ctx),
};
