import { Circle, Container, Graphics } from 'pixi.js';
import { cream, ink, shadow, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { HOLES, LEVELS, carry, count, jump, makeBoard, marblesFor, moves, occupied, paint, recovery, solve, type Jump } from './logic';

/** Three seeded tray looks. Orange stays for the hint rings and blue for the selection ring. */
const LOOKS = [
  { name: 'oak', sky: swatch.teal.light, tray: wood.fill, edge: wood.line, rim: wood.light, deep: wood.line, marbles: [swatch.teal, swatch.blue, swatch.purple] },
  { name: 'slate', sky: swatch.blue.light, tray: swatch.white.line, edge: shadow, rim: swatch.white.light, deep: shadow, marbles: [swatch.green, swatch.teal, swatch.white] },
  { name: 'birch', sky: swatch.yellow.light, tray: swatch.white.light, edge: swatch.brown.line, rim: swatch.brown.light, deep: swatch.brown.line, marbles: [swatch.orange, swatch.red, swatch.pink] },
] as const;
type Look = (typeof LOOKS)[number];
function marbleArt(seed = 0, marbles: Look['marbles'] = LOOKS[0].marbles, r = 29): Graphics {
  const color = marbles[Math.abs(seed) % 3];
  return new Graphics().circle(0, 0, r).fill(color.fill).stroke({ color: color.line, width: r / 7 })
    .arc(0, 0, r * 0.62, -2.5, -0.7).stroke({ color: cream, width: r / 6, cap: 'round' });
}
/** The board is laid out from its row count, so a bigger triangle only needs more rows. */
const ROWS = HOLES.at(-1)!.row + 1, DX = 102, DY = 82, HALF = (ROWS - 1) * DX / 2 + 59, BASE = (ROWS - 1) * DY + 53;
const FLY = 0.3, TILT = 0.26, SLOT = 34;
interface Snapshot { board: number; colors: number[]; taken: number[] }
class MarbleJump implements Game {
  readonly initial: number;
  readonly look: Look;
  private readonly initialColors: number[];
  board: number;
  colors: number[];
  taken: number[] = [];
  history: Snapshot[] = [];
  selected: number | null = null;
  hinted: Jump | null = null;
  /** The jump being shown; the board has already changed. */
  flight: { j: Jump; t: number } | null = null;
  queued: number | null = null;
  tilt: { hole: number; toward: number; t: number } | null = null;
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
  private readonly pocket = new Graphics();
  private readonly rings = new Graphics();
  private readonly flyer = new Container();
  private readonly faller = new Container();
  private readonly status = label('', 28, ink);
  private readonly title = label('Leave one marble', 38, ink);
  private marbles: (Graphics | null)[] = [];
  private cx = 0;
  private top = 0;
  private consecutiveMisses = 0;
  constructor(private readonly ctx: GameContext) {
    this.board = this.initial = makeBoard(ctx.level, ctx.rng);
    this.look = ctx.rng.pick(LOOKS);
    this.colors = this.initialColors = paint(this.board, ctx.rng);
    this.root.addChild(this.background, this.tray, this.pocket, this.title, this.status);
    for (const g of [this.background, this.tray, this.pocket, this.title, this.status, this.rings, this.flyer, this.faller]) g.eventMode = 'none';
    HOLES.forEach((_, i) => {
      const node = new Container();
      node.hitArea = new Circle(0, 0, 39);
      onTap(node, () => this.tapHole(i));
      this.nodes.push(node); this.root.addChild(node);
    });
    this.root.addChild(this.rings, this.faller, this.flyer);
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
  destroy() { this.finished = true; }
  tapHole(i: number) {
    if (this.finished || !this.ctx.alive) return;
    if (this.flight) { this.queued ??= i; return; }
    if (occupied(this.board, i)) {
      this.selected = this.selected === i ? null : i; this.tilt = null;
      sfx.bell(2, 0.2); this.draw(); return;
    }
    if (this.selected === null) return;
    const j = moves(this.board).find(m => m.from === this.selected && m.to === i);
    if (!j) {
      this.misses++; this.consecutiveMisses++; sfx.boing();
      void this.ctx.say('marble.miss');
      const hole = this.selected;
      if (this.consecutiveMisses >= 2 && !this.hinted) this.askForHint();
      this.tilt = { hole, toward: i, t: 0 };
      this.draw(); return;
    }
    this.history.push({ board: this.board, colors: this.colors, taken: this.taken });
    const { colors, taken } = carry(this.colors, j);
    this.board = jump(this.board, j); this.colors = colors; this.taken = [...this.taken, taken];
    this.selected = null; this.hinted = null; this.tilt = null; this.consecutiveMisses = 0;
    this.flight = { j, t: 0 };
    sfx.bell(2 + Math.min(this.history.length, 10), 0.3);
    if (count(this.board) === 1) this.finished = true;
    this.draw();
  }
  /** Ends any motion at once, so Undo, Hint and Start over act on the board she sees. */
  private settle() { this.flight = null; this.queued = null; this.tilt = null; }
  private landed(j: Jump) {
    const landing = this.nodes[j.to], color = this.look.marbles[this.colors[j.to]];
    this.ctx.particles.burst(landing.x, landing.y, { colors: [color.fill, cream], count: 6, speed: [35, 75], life: [0.2, 0.4] });
    if (this.finished) {
      void this.ctx.say('marble.done');
      if (this.ctx.alive) this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    if (solve(this.board) === null) void this.ctx.say('marble.revise');
    if (this.queued !== null) { const i = this.queued; this.queued = null; this.tapHole(i); }
  }
  private restore(s: Snapshot) { this.board = s.board; this.colors = s.colors; this.taken = s.taken; }
  undo() {
    if (this.finished || !this.history.length) return;
    this.settle(); this.restore(this.history.pop()!); this.selected = null; this.hinted = null;
    this.consecutiveMisses = 0; sfx.bell(2 + Math.min(this.history.length, 10), 0.2); this.draw();
  }
  restart() {
    if (this.finished) return;
    this.settle(); this.restore({ board: this.initial, colors: this.initialColors, taken: [] });
    this.history = []; this.selected = null; this.hinted = null;
    this.consecutiveMisses = 0; this.draw(); void this.ctx.say('marble.restart');
  }
  askForHint() {
    if (this.finished) return;
    this.settle();
    // A hint already showing is repeated, not counted again.
    if (this.hinted) { void this.ctx.say('marble.hint'); this.draw(); return; }
    this.hints++; this.consecutiveMisses = 0;
    if (solve(this.board) === null) {
      const back = recovery(this.history.map(s => s.board));
      if (back !== null) { this.restore(this.history[back]); this.history = this.history.slice(0, back); }
      void this.ctx.say('marble.recover');
    } else void this.ctx.say('marble.hint');
    this.selected = null; this.hinted = solve(this.board)?.[0] ?? null; this.draw();
  }
  autotouch(_dt: number): TouchIntent | null {
    if (this.finished || this.flight) return null;
    const next = solve(this.board)?.[0];
    if (!next) return { tap: { on: this.hintButton } };
    return { tap: { on: this.nodes[this.selected === next.from ? next.to : next.from] }, pause: 0.25 };
  }
  update(dt: number) {
    if (this.flight) {
      const f = this.flight; f.t += dt;
      if (f.t >= FLY) { this.flight = null; this.draw(); this.landed(f.j); }
      else this.place(f);
    }
    if (this.tilt) {
      this.tilt.t += dt;
      const m = this.marbles[this.tilt.hole];
      if (this.tilt.t >= TILT) { this.tilt = null; if (m) { m.position.set(0, -3); m.rotation = 0; } }
      else if (m) {
        const a = this.nodes[this.tilt.hole], b = this.nodes[this.tilt.toward], d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const k = Math.sin(Math.PI * this.tilt.t / TILT);
        m.position.set((b.x - a.x) / d * 10 * k, -3 + (b.y - a.y) / d * 10 * k); m.rotation = Math.sign(b.x - a.x || 1) * 0.25 * k;
      }
    }
  }
  /** The jumping marble arcs over its neighbour; the jumped one slides down into its pocket slot. */
  private place(f: { j: Jump; t: number }) {
    const k = f.t / FLY, a = this.nodes[f.j.from], b = this.nodes[f.j.to], o = this.nodes[f.j.over];
    const lift = Math.sin(Math.PI * k);
    this.flyer.position.set(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k - 46 * lift);
    this.flyer.scale.set(1 + 0.12 * lift);
    const slot = this.slot(this.taken.length - 1), e = k * k;
    this.faller.position.set(o.x + (slot.x - o.x) * e, o.y + (slot.y - o.y) * e);
    this.faller.scale.set(1 - 0.48 * e);
  }
  private slot(i: number) {
    return { x: this.cx + (i - (ROWS * (ROWS + 1) / 2 - 3) / 2) * SLOT, y: this.top + BASE + 30 };
  }
  private draw() {
    const { look } = this;
    this.marbles = this.nodes.map((node, i) => {
      node.removeChildren().forEach(c => c.destroy());
      const hole = new Graphics().circle(0, 3, 35).fill(look.deep).circle(0, 0, 33).fill(look.rim).circle(0, 0, 26).fill(look.deep);
      hole.eventMode = 'none'; node.addChild(hole);
      if (!occupied(this.board, i) || this.flight?.j.to === i) return null;
      if (this.selected === i) node.addChild(new Graphics().ellipse(4, 12, 30, 14).fill({ color: shadow, alpha: 0.25 }));
      const art = marbleArt(this.colors[i], look.marbles); art.eventMode = 'none'; node.addChild(art);
      art.scale.set(this.selected === i ? 1.08 : 1); art.position.set(0, this.selected === i ? -3 : 0);
      return art;
    });
    for (const [layer, color] of [[this.flyer, this.flight && this.colors[this.flight.j.to]], [this.faller, this.flight && this.taken.at(-1)]] as const) {
      layer.removeChildren().forEach(c => c.destroy());
      if (this.flight && color != null) layer.addChild(marbleArt(color, look.marbles));
    }
    if (this.flight) this.place(this.flight);
    this.pocket.clear();
    const shown = this.flight ? this.taken.length - 1 : this.taken.length;
    for (let i = 0; i < shown; i++) {
      const c = look.marbles[this.taken[i]], p = this.slot(i);
      this.pocket.circle(p.x, p.y, 15).fill(c.fill).stroke({ color: c.line, width: 2 });
    }
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
    const { look } = this;
    this.background.clear().rect(0, 0, view.w, view.h).fill(look.sky);
    const cx = this.cx = view.w / 2 + 35, top = this.top = Math.max(175, (view.h - (ROWS - 1) * DY - 82) / 2);
    this.title.position.set(cx, 82); this.status.position.set(cx, 132);
    const groove = HALF - 34, gy = top + BASE + 30;
    this.tray.clear().poly([cx, top - 57, cx - HALF, top + BASE, cx + HALF, top + BASE])
      .fill(look.tray).stroke({ color: look.edge, width: 7, join: 'round' })
      .roundRect(cx - groove, gy - 22, groove * 2, 44, 22).fill(look.tray).stroke({ color: look.edge, width: 5 })
      .roundRect(cx - groove + 8, gy - 15, groove * 2 - 16, 30, 15).fill(look.deep).stroke({ color: look.rim, width: 3 });
    HOLES.forEach((h, i) => this.nodes[i].position.set(cx + (h.col - h.row / 2) * DX, top + h.row * DY));
    [this.undoButton, this.hintButton, this.restartButton].forEach((n, i) => n.position.set(cx + (i - 1) * 180, view.h - 65));
    this.draw();
  }
}
export const marbleJump: GameModule = {
  id: 'marble-jump', name: 'Marble Jump', titleLine: 'game.marble-jump', region: 'puzzle-peaks', challenge: 'space',
  skills: ['spatial planning', 'revising a route'], bands: ['grownup'], touchDemo: true,
  levels: band => rangeFor(LEVELS, band), describeLevel: level => `${marblesFor(level)} marbles on a triangular board; leave one`,
  music: STYLES.lullaby,
  coplayHint: 'Plan the next two jumps together before trying them.',
  offScreen: 'Make a triangle of fifteen circles on paper and use counters to try the same jumps.',
  hubIcon: () => new WigglyIcon(marbleArt()), sticker: seed => marbleArt(seed),
  create: ctx => new MarbleJump(ctx),
};
