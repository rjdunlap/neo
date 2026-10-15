import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { DIRECTIONS, footprint, makePuzzle, planFor, roll, solutionStep, solved, type Direction, type State } from './logic';

/** Code-drawn wood: rings distinguish the standing end from a log lying across two stones. */
function logArt(w: number, h: number, upright: boolean) {
  const g = new Graphics().roundRect(-w / 2, -h / 2, w, h, 12).fill(wood.fill).stroke({ width: 4, color: wood.line });
  if (upright) {
    g.circle(0, 0, Math.min(w, h) * 0.31).stroke({ width: 3, color: wood.line });
    g.circle(0, 0, Math.min(w, h) * 0.14).stroke({ width: 2, color: wood.line });
  } else if (w > h) {
    for (const y of [-h * 0.22, h * 0.22]) g.moveTo(-w * 0.35, y).lineTo(w * 0.35, y).stroke({ width: 3, color: wood.line });
  } else {
    for (const x of [-w * 0.22, w * 0.22]) g.moveTo(x, -h * 0.35).lineTo(x, h * 0.35).stroke({ width: 3, color: wood.line });
  }
  g.eventMode = 'none'; return g;
}
class LogRoll implements Game {
  readonly puzzle;
  state: State;
  readonly directions = {} as Record<Direction, Container>;
  readonly undoButton = new Container();
  readonly hintButton = new Container();
  readonly againButton = new Container();
  private readonly board = new Graphics();
  private readonly log = new Container();
  private readonly heading = label('Stand the log in the hollow', 32, ink);
  private readonly status = label('', 23, ink);
  private history: State[] = [];
  private alive = true;
  private cell = 64;
  private bx = 0;
  private by = 180;
  private failed = 0;
  hinted: Direction | null = null;
  finished = false;
  misses = 0;
  hints = 0;
  moves = 0;
  constructor(private readonly ctx: GameContext) {
    this.puzzle = makePuzzle(ctx.level, ctx.rng); this.state = { ...this.puzzle.start };
    this.board.eventMode = this.log.eventMode = this.heading.eventMode = this.status.eventMode = 'none';
    ctx.stage.addChild(this.board, this.log, this.heading, this.status);
    const names = { up: '↑ Up', down: '↓ Down', left: '← Left', right: 'Right →' };
    for (const d of DIRECTIONS) {
      const node = new Container();
      node.addChild(tile(116, 100, 'teal'), label(names[d], 25, ink));
      node.hitArea = new Rectangle(-58, -50, 116, 100);
      onTap(node, () => this.choose(d)); this.directions[d] = node; ctx.stage.addChild(node);
    }
    for (const [node, text, action] of [
      [this.undoButton, 'Undo ↶', () => this.undo()],
      [this.hintButton, 'Hint ◇', () => this.askForHint()],
      [this.againButton, 'Start over ↺', () => this.restart()],
    ] as const) {
      node.addChild(tile(160, 100, 'purple'), label(text, 24, ink));
      node.hitArea = new Rectangle(-80, -50, 160, 100);
      onTap(node, action); ctx.stage.addChild(node);
    }
    this.resize(ctx.view);
  }
  start() { void this.ctx.instruct('log.go'); }
  choose(d: Direction) {
    if (this.finished || !this.alive) return;
    const next = roll(this.state, d, this.puzzle.plan.floor);
    if (!next) {
      this.failed++; sfx.boing(); void this.ctx.say('log.edge');
      if (this.failed % 2 === 0) this.showHint(false);
      this.status.text = 'Both ends need stones. Try another direction.';
      return;
    }
    this.history.push({ ...this.state }); this.state = next; this.moves++; this.hinted = null; this.failed = 0;
    sfx.pop(3); this.draw();
    if (solved(this.state, this.puzzle.plan.floor)) {
      this.finished = true;
      void this.ctx.say('log.done').then(() => { if (this.alive) this.ctx.finish({ misses: 0, hints: this.hints }); });
    }
  }
  private draw() {
    const c = this.cell;
    this.board.clear().roundRect(this.bx - 14, this.by - 14, c * this.puzzle.plan.floor[0].length + 28, c * 5 + 28, 24).fill(swatch.blue.light);
    this.puzzle.plan.floor.forEach((row, y) => [...row].forEach((v, x) => {
      if (v !== '.') return;
      this.board.roundRect(this.bx + x * c + 3, this.by + y * c + 3, c - 6, c - 6, 10).fill(cream).stroke({ width: 2, color: swatch.teal.line });
    }));
    this.board.circle(this.bx + (this.puzzle.plan.floor[0].length - 0.5) * c, this.by + 4.5 * c, c * 0.32).fill(ink).stroke({ width: 4, color: swatch.yellow.fill });
    this.log.removeChildren().forEach(v => v.destroy({ children: true }));
    const cells = footprint(this.state), w = (this.state.pose === 'across' ? 2 : 1) * c - 16, h = (this.state.pose === 'along' ? 2 : 1) * c - 16;
    const art = logArt(w, h, this.state.pose === 'up'); this.log.addChild(art);
    this.log.position.set(this.bx + (cells[0][0] + cells.at(-1)![0] + 1) * c / 2, this.by + (cells[0][1] + cells.at(-1)![1] + 1) * c / 2);
    this.status.text = `${this.moves} ${this.moves === 1 ? 'roll' : 'rolls'} · ${this.state.pose === 'up' ? 'standing on one stone' : 'lying across two stones'}`;
    for (const d of DIRECTIONS) {
      const node = this.directions[d];
      const old = node.getChildByLabel('hint');
      if (old) { node.removeChild(old); old.destroy(); }
      if (this.hinted === d) {
        const glow = new Graphics().roundRect(-61, -53, 122, 106, 20).stroke({ width: 6, color: swatch.yellow.fill });
        glow.label = 'hint'; glow.eventMode = 'none'; node.addChild(glow);
      }
    }
  }
  private showHint(spoken: boolean) {
    const next = solutionStep(this.state, this.puzzle.plan.floor)?.next;
    if (!next) return;
    this.hinted = next; this.hints++; this.draw();
    if (spoken) void this.ctx.say('log.hint');
  }
  askForHint() { if (!this.finished) this.showHint(true); }
  undo() {
    if (this.finished) return;
    const before = this.history.pop();
    if (before) { this.state = before; this.hinted = null; this.failed = 0; sfx.tick(); this.draw(); }
  }
  restart() {
    if (this.finished) return;
    this.state = { ...this.puzzle.start }; this.history = []; this.hinted = null; this.failed = 0; this.draw();
    void this.ctx.say('log.restart');
  }
  resize(v: View) {
    this.cell = Math.min(96, (v.h - 440) / 5, (v.w - 160) / this.puzzle.plan.floor[0].length);
    this.bx = (v.w - this.cell * this.puzzle.plan.floor[0].length) / 2;
    this.heading.position.set(v.w / 2, 112); this.status.position.set(v.w / 2, 155);
    const bottom = this.by + this.cell * 5;
    (['left', 'up', 'down', 'right'] as const).forEach((d, i) => this.directions[d].position.set(v.w / 2 + (i - 1.5) * 132, bottom + 76));
    [this.undoButton, this.hintButton, this.againButton].forEach((node, i) => node.position.set(v.w / 2 + (i - 1) * 184, bottom + 192));
    this.draw();
  }
  autotouch(): TouchIntent | null {
    const next = solutionStep(this.state, this.puzzle.plan.floor)?.next;
    return !this.finished && next ? { tap: { on: this.directions[next] }, pause: 0.5 } : null;
  }
  update(_dt: number) {}
  destroy() { this.alive = false; }
}
function iconArt(seed = 0) {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-105, -195, 210, 180, 24).fill(swatch.teal.light).stroke({ width: 4, color: swatch.teal.line }));
  const log = logArt(148, 70, false); log.position.set(-10, -125); log.rotation = (seed % 3 - 1) * 0.08; c.addChild(log);
  c.addChild(new Graphics().circle(60, -50, 24).fill(ink).stroke({ width: 5, color: swatch.yellow.fill })); return c;
}
export const logRoll: GameModule = {
  id: 'log-roll', name: 'Log Roll', titleLine: 'game.log-roll', region: 'puzzle-peaks',
  skills: ['spatial-reasoning', 'planning', 'mental-rotation'], bands: ['grownup'], touchDemo: true,
  levels: band => rangeFor({ grownup: { min: 1, max: 3 } }, band),
  describeLevel: level => planFor(level).name, music: STYLES.lullaby,
  coplayHint: 'Predict which stones the log will cover before each roll. Take turns planning and tipping.',
  offScreen: 'Tip a small rectangular box across a paper grid. Mark a space where it must finish standing.',
  hubIcon: () => new WigglyIcon(iconArt()),
  sticker: seed => { const c = iconArt(seed); c.pivot.set(0, -100); c.scale.set(0.65); return c; },
  create: ctx => new LogRoll(ctx),
};
