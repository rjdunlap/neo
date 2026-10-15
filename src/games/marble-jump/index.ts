import { Circle, Container, Graphics } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { HOLES, LEVELS, count, jump, makeBoard, marblesFor, moves, occupied, recovery, solve, type Jump } from './logic';

function marbleArt(seed = 0): Graphics {
  const color = [swatch.teal, swatch.blue, swatch.purple][Math.abs(seed) % 3];
  return new Graphics().circle(0, 0, 29).fill(color.fill).stroke({ color: color.line, width: 4 })
    .arc(0, 0, 18, -2.5, -0.7).stroke({ color: cream, width: 5, cap: 'round' });
}
class MarbleJump implements Game {
  readonly initial: number;
  board: number;
  history: number[] = [];
  selected: number | null = null;
  hinted: Jump | null = null;
  misses = 0;
  hints = 0;
  finished = false;
  readonly nodes: Container[] = [];
  readonly undoButton = new Container();
  readonly hintButton = new Container();
  readonly restartButton = new Container();
  private readonly root = new Container();
  private readonly background = new Graphics();
  private readonly tray = new Graphics();
  private readonly rings = new Graphics();
  private readonly status = label('', 28, ink);
  private readonly title = label('Leave one marble', 38, ink);
  private consecutiveMisses = 0;
  constructor(private readonly ctx: GameContext) {
    this.board = this.initial = makeBoard(ctx.level, ctx.rng);
    this.root.addChild(this.background, this.tray, this.title, this.status);
    this.background.eventMode = this.tray.eventMode = this.title.eventMode = this.status.eventMode = this.rings.eventMode = 'none';
    HOLES.forEach((_, i) => {
      const node = new Container();
      node.hitArea = new Circle(0, 0, 39);
      onTap(node, () => this.tapHole(i));
      this.nodes.push(node); this.root.addChild(node);
    });
    this.root.addChild(this.rings);
    for (const [node, text, action] of [
      [this.undoButton, 'Undo', () => this.undo()],
      [this.hintButton, 'Hint', () => this.askForHint()],
      [this.restartButton, 'Start over', () => this.restart()],
    ] as const) {
      node.addChild(tile(160, 78, 'white'), label(text, 25, ink));
      onTap(node, action);
      this.root.addChild(node);
    }
    ctx.stage.addChild(this.root); this.resize(ctx.view);
  }
  start() { void this.ctx.instruct('marble.go'); }
  update(_dt: number) {}
  destroy() { this.finished = true; }
  tapHole(i: number) {
    if (this.finished) return;
    if (occupied(this.board, i)) {
      this.selected = this.selected === i ? null : i;
      sfx.bell(2, 0.2); this.draw(); return;
    }
    if (this.selected === null) return;
    const j = moves(this.board).find(m => m.from === this.selected && m.to === i);
    if (!j) {
      this.misses++; this.consecutiveMisses++; sfx.boing();
      void this.ctx.say('marble.miss');
      if (this.consecutiveMisses >= 2) this.askForHint();
      this.draw(); return;
    }
    this.history.push(this.board); this.board = jump(this.board, j);
    this.selected = null; this.hinted = null; this.consecutiveMisses = 0;
    const landing = this.nodes[j.to];
    this.ctx.particles.burst(landing.x, landing.y, { colors: [swatch.teal.fill, cream], count: 6, speed: [35, 75], life: [0.2, 0.4] });
    sfx.bell(5, 0.3); this.draw();
    if (count(this.board) === 1) {
      this.finished = true; void this.ctx.say('marble.done');
      this.ctx.finish({ misses: this.misses, hints: this.hints });
    } else if (solve(this.board) === null) void this.ctx.say('marble.revise');
  }
  undo() {
    if (this.finished || !this.history.length) return;
    this.board = this.history.pop()!; this.selected = null; this.hinted = null;
    this.consecutiveMisses = 0; sfx.bell(1, 0.2); this.draw();
  }
  restart() {
    if (this.finished) return;
    this.board = this.initial; this.history = []; this.selected = null; this.hinted = null;
    this.consecutiveMisses = 0; this.draw(); void this.ctx.say('marble.restart');
  }
  askForHint() {
    if (this.finished || this.hinted) return;
    this.hints++; this.consecutiveMisses = 0;
    const route = solve(this.board);
    if (route === null) {
      const back = recovery(this.history);
      if (back !== null) {
        this.board = this.history[back]; this.history = this.history.slice(0, back);
      }
      void this.ctx.say('marble.recover');
    } else void this.ctx.say('marble.hint');
    this.selected = null; this.hinted = solve(this.board)?.[0] ?? null; this.draw();
  }
  autotouch(_dt: number): TouchIntent | null {
    if (this.finished) return null;
    const next = solve(this.board)?.[0];
    if (!next) return { tap: { on: this.hintButton } };
    return { tap: { on: this.nodes[this.selected === next.from ? next.to : next.from] }, pause: 0.25 };
  }
  private draw() {
    this.nodes.forEach((node, i) => {
      node.removeChildren().forEach(c => c.destroy());
      const hole = new Graphics().circle(0, 3, 35).fill(wood.line).circle(0, 0, 33).fill(wood.light)
        .circle(0, 0, 26).fill(wood.line);
      hole.eventMode = 'none'; node.addChild(hole);
      if (occupied(this.board, i)) { const art = marbleArt(i); art.eventMode = 'none'; node.addChild(art); }
    });
    this.rings.clear();
    for (const [i, color] of [[this.selected, swatch.blue.line], [this.hinted?.from, swatch.orange.line], [this.hinted?.to, swatch.orange.line]] as const) {
      if (i != null) { const n = this.nodes[i]; this.rings.circle(n.x, n.y, 37).stroke({ color, width: 5 }); }
    }
    if (this.hinted) {
      const a = this.nodes[this.hinted.from], b = this.nodes[this.hinted.to];
      this.rings.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ color: swatch.orange.line, width: 4, alpha: 0.6 });
    }
    const stuck = solve(this.board) === null;
    this.status.text = stuck ? 'Try Undo, or Hint to return to a clearing route' : `${count(this.board)} marbles · jump over one into an empty hole`;
    this.undoButton.alpha = this.history.length ? 1 : 0.45;
  }
  resize(view: View) {
    this.background.clear().rect(0, 0, view.w, view.h).fill(swatch.teal.light);
    const cx = view.w / 2 + 35, top = Math.max(175, (view.h - 410) / 2);
    this.title.position.set(cx, 82); this.status.position.set(cx, 132);
    this.tray.clear().poly([cx, top - 57, cx - 263, top + 381, cx + 263, top + 381])
      .fill(wood.fill).stroke({ color: wood.line, width: 7, join: 'round' });
    HOLES.forEach((h, i) => this.nodes[i].position.set(cx + (h.col - h.row / 2) * 102, top + h.row * 82));
    [this.undoButton, this.hintButton, this.restartButton].forEach((n, i) => n.position.set(cx + (i - 1) * 180, view.h - 65));
    this.draw();
  }
}
export const marbleJump: GameModule = {
  id: 'marble-jump', name: 'Marble Jump', titleLine: 'game.marble-jump', region: 'puzzle-peaks',
  skills: ['spatial planning', 'revising a route'], bands: ['grownup'], touchDemo: true,
  levels: band => rangeFor(LEVELS, band), describeLevel: level => `${marblesFor(level)} marbles on a triangular board; leave one`,
  music: STYLES.lullaby,
  coplayHint: 'Plan the next two jumps together before trying them.',
  offScreen: 'Make a triangle of fifteen circles on paper and use counters to try the same jumps.',
  hubIcon: () => new WigglyIcon(marbleArt()), sticker: seed => marbleArt(seed),
  create: ctx => new MarbleJump(ctx),
};
