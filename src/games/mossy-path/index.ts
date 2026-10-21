import { Container, Graphics, Rectangle } from 'pixi.js';
import { turtleArt } from '../../art/animals';
import { ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { completion, helpFor, makeBoard, moveError, planFor, solved, step } from './logic';

function flower(g: Graphics, x: number, y: number, size: number, color: number) {
  for (let p = 0; p < 5; p++) { const a = p * Math.PI * 2 / 5; g.circle(x + Math.cos(a) * size * 0.65, y + Math.sin(a) * size * 0.65, size * 0.5).fill(color); }
  g.circle(x, y, size * 0.35).fill(swatch.yellow.fill);
}
class MossyPath implements Game {
  readonly board;
  path: number[];
  readonly nodes: Container[] = [];
  readonly undoButton = new Container();
  readonly hintButton = new Container();
  readonly againButton = new Container();
  private readonly grid = new Container();
  private readonly trail = new Graphics();
  private readonly heading = label('Bloom a trail to the pond', 32, ink);
  private readonly status = label('', 24, ink);
  private readonly buttonGlow = new Graphics();
  private readonly helped = new Set<string>();
  private hintActive = false;
  private consecutive = 0;
  private cell = 110;
  private alive = true;
  finished = false;
  misses = 0;
  hints = 0;
  hinted = -1;
  constructor(private readonly ctx: GameContext) {
    this.board = makeBoard(ctx.level, ctx.rng); this.path = [this.board.start];
    this.trail.eventMode = 'none'; this.buttonGlow.eventMode = 'none';
    for (let i = 0; i < this.board.rows * this.board.cols; i++) {
      const node = new Container();
      if (this.board.tiles.includes(i)) onTap(node, () => this.choose(i));
      else node.eventMode = 'none';
      this.nodes.push(node); this.grid.addChild(node);
    }
    this.grid.addChild(this.trail);
    for (const [node, text, action] of [
      [this.undoButton, 'Undo ↶', () => this.undo()],
      [this.hintButton, 'Hint ◇', () => this.askForHint()],
      [this.againButton, 'Start over ↺', () => this.restart()],
    ] as const) { node.addChild(tile(168, 100, 'purple'), label(text, 24, ink)); onTap(node, action); }
    this.heading.eventMode = 'none'; this.status.eventMode = 'none';
    ctx.stage.addChild(this.heading, this.status, this.grid, this.undoButton, this.hintButton, this.againButton, this.buttonGlow);
    this.resize(ctx.view);
  }
  start() { void this.ctx.instruct('moss.go'); }
  choose(at: number) {
    if (!this.alive || this.finished || at === this.path.at(-1)) return;
    const error = moveError(this.board, this.path, at);
    if (error) {
      this.misses++; this.consecutive++; sfx.boing(); void this.ctx.say(`moss.${error}`);
      if (this.consecutive >= 2) this.showHint(false);
      return;
    }
    this.path = step(this.board, this.path, at)!; this.consecutive = 0; this.hintActive = false; this.hinted = -1;
    sfx.pop(this.path.length % 5); this.draw();
    if (solved(this.board, this.path)) {
      this.finished = true;
      void this.ctx.say('moss.done').then(() => { if (this.alive) this.ctx.finish({ misses: this.misses, hints: this.hints }); });
    } else if (!completion(this.board, this.path)) void this.ctx.say('moss.blocked');
  }
  private showHint(spoken: boolean) {
    if (!this.alive || this.finished) return;
    const help = helpFor(this.board, this.path); if (!help || help.next < 0) return;
    const key = this.path.join(',');
    if (!this.helped.has(key)) { this.helped.add(key); this.hints++; }
    this.hintActive = true; this.hinted = help.undo ? -1 : help.next; this.draw();
    if (spoken) void this.ctx.say(help.undo ? 'moss.recover' : 'moss.hint');
  }
  askForHint() { this.showHint(true); }
  private undo() {
    if (!this.alive || this.finished || this.path.length <= 1) return;
    this.path = this.path.slice(0, -1); this.consecutive = 0; this.hinted = -1;
    if (this.hintActive) { const help = helpFor(this.board, this.path); this.hinted = help && !help.undo ? help.next : -1; }
    sfx.tick(); this.draw();
  }
  restart() {
    if (!this.alive || this.finished) return;
    this.path = [this.board.start]; this.consecutive = 0; this.hintActive = false; this.hinted = -1;
    this.draw(); void this.ctx.say('moss.restart');
  }
  private draw() {
    const last = this.path.at(-1)!;
    this.nodes.forEach((node, at) => {
      node.removeChildren().forEach(c => c.destroy({ children: true }));
      const g = new Graphics(), half = this.cell / 2 - 5;
      g.eventMode = 'none';
      if (!this.board.tiles.includes(at)) {
        g.ellipse(0, 8, half * 0.65, half * 0.48).fill(swatch.white.line).stroke({ width: 3, color: ink });
        g.ellipse(-8, -1, half * 0.38, half * 0.15).fill(swatch.white.light); node.addChild(g); return;
      }
      const visited = this.path.includes(at), pond = at === this.board.pond;
      g.roundRect(-half, -half, half * 2, half * 2, 20).fill(pond ? swatch.blue.light : visited ? swatch.green.light : swatch.green.fill).stroke({ width: 3, color: pond ? swatch.blue.line : swatch.green.line });
      if (pond) {
        g.ellipse(0, 0, half * 0.8, half * 0.65).fill(swatch.blue.fill);
        g.ellipse(0, 4, half * 0.5, half * 0.32).stroke({ width: 3, color: swatch.blue.light });
        g.circle(half * 0.48, -half * 0.32, half * 0.23).fill(swatch.green.fill);
      } else if (visited) {
        flower(g, -half * 0.6, half * 0.55, 9, swatch.pink.fill);
        flower(g, half * 0.55, -half * 0.5, 8, swatch.white.fill);
      } else {
        for (const x of [-half * 0.5, half * 0.45]) g.moveTo(x - 7, 12).lineTo(x, 0).lineTo(x + 7, 12).stroke({ width: 3, color: swatch.green.line });
      }
      if (at === this.hinted) g.roundRect(-half - 2, -half - 2, half * 2 + 4, half * 2 + 4, 20).stroke({ width: 6, color: swatch.yellow.fill });
      node.addChild(g); if (at === last) node.addChild(turtleArt(this.cell * 0.72));
    });
    this.trail.clear();
    for (let i = 1; i < this.path.length; i++) {
      const a = this.nodes[this.path[i - 1]], b = this.nodes[this.path[i]];
      this.trail.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 6, color: swatch.yellow.line, alpha: 0.55 });
    }
    // Keep the route behind the turtle and flowers, and decorative art outside hit testing.
    this.grid.setChildIndex(this.trail, 0);
    const blocked = !solved(this.board, this.path) && !completion(this.board, this.path);
    this.status.text = `${this.path.length} / ${this.board.tiles.length} bloomed · ${blocked ? 'Try Undo to change the trail' : 'Visit each tile once; pond last'}`;
    this.buttonGlow.clear();
    if (this.hintActive && this.hinted < 0) this.buttonGlow.roundRect(this.undoButton.x - 88, this.undoButton.y - 54, 176, 108, 20).stroke({ width: 6, color: swatch.yellow.fill });
  }
  resize(v: View) {
    this.cell = Math.min(132, (v.h - 330) / this.board.rows, (v.w - 320) / this.board.cols);
    this.grid.position.set(v.w / 2 - (this.board.cols - 1) * this.cell / 2, v.h / 2 + 12 - (this.board.rows - 1) * this.cell / 2);
    this.nodes.forEach((node, at) => {
      node.position.set(at % this.board.cols * this.cell, Math.floor(at / this.board.cols) * this.cell);
      node.hitArea = new Rectangle(-this.cell / 2, -this.cell / 2, this.cell, this.cell);
    });
    this.heading.position.set(v.w / 2, 110); this.status.position.set(v.w / 2, 154);
    [this.undoButton, this.hintButton, this.againButton].forEach((node, i) => node.position.set(v.w / 2 + (i - 1) * 192, v.h - 80));
    this.draw();
  }
  autotouch(): TouchIntent | null {
    if (!this.alive || this.finished) return null;
    const help = helpFor(this.board, this.path);
    return help && help.next >= 0 ? { tap: { on: help.undo ? this.undoButton : this.nodes[help.next] }, pause: 0.4 } : null;
  }
  update(_dt: number) {}
  destroy() { this.alive = false; }
}
function iconArt(seed = 0): Container {
  const c = new Container(), g = new Graphics(); g.eventMode = 'none';
  g.roundRect(-90, -170, 180, 170, 24).fill(swatch.green.light).stroke({ width: 5, color: swatch.green.line });
  flower(g, -58, -42, 16, seed % 2 ? swatch.purple.fill : swatch.pink.fill);
  flower(g, 60, -132, 14, swatch.white.fill); c.addChild(g);
  const t = turtleArt(140); t.position.set(0, -80); c.addChild(t); return c;
}
export const mossyPath: GameModule = {
  id: 'mossy-path', name: 'Mossy Path', titleLine: 'game.mossy-path', region: 'puzzle-peaks',
  skills: ['spatial-reasoning', 'planning', 'path-coverage'], bands: ['school'], touchDemo: true,
  levels: band => rangeFor({ school: { min: 1, max: 3 } }, band),
  describeLevel: level => planFor(level).name, music: STYLES.lullaby,
  coplayHint: 'One person points out a tile that might be cut off; the other chooses the next step. Swap jobs after Undo.',
  offScreen: 'Draw a small grid on paper. Walk a toy turtle through every square once, ending at a blue pond. Cross out two squares as rocks.',
  hubIcon: () => new WigglyIcon(iconArt()),
  sticker: seed => { const c = iconArt(seed); c.pivot.set(0, -85); c.scale.set(0.7); return c; },
  create: ctx => new MossyPath(ctx),
};
