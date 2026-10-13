import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, RAINBOW, swatch } from '../../art/palette';
import { shapePath, SHAPES } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { nextSpot, routeStep } from '../../couch/focus';
import { HeldDirection, idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { free, freeTiles, fullMask, makeBoard, planFor, present, removePair, reshuffle, solve, type Pair, type Tile } from './logic';

const LEVELS: BandLevels = { grownup: { min: 1, max: 6 } };

/** Pictures differ by shape as well as color. The raised edge makes a covered tile read as a stack. */
function tileArt(kind: number): Container {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-50, -48, 108, 108, 14).fill(swatch.brown.line));
  c.addChild(new Graphics().roundRect(-54, -54, 108, 108, 14).fill(cream).stroke({ width: 3, color: swatch.brown.fill }));
  const picture = new Graphics();
  shapePath(picture, SHAPES[kind], 30).fill(swatch[RAINBOW[kind]].fill).stroke({ width: 4, color: swatch[RAINBOW[kind]].line });
  c.addChild(picture);
  return c;
}
interface Snapshot { tiles: Tile[]; mask: number }

class TilePairs implements Game {
  tiles: Tile[];
  mask: number;
  selected: number | null = null;
  hinted: Pair | null = null;
  cursor = 0;
  misses = 0;
  hints = 0;
  undos = 0;
  shuffles = 0;
  busy = false;
  finished = false;
  readonly board = new Container();
  readonly undoButton = new Container();
  readonly hintButton = new Container();
  readonly shuffleButton = new Container();
  nodes: Container[] = [];
  private history: Snapshot[] = [];
  private readonly ring = new Graphics();
  private readonly tally = label('', 30);
  private readonly help = label('Clear the top · open a left or right side', 23, ink, '500');
  private readonly held = new HeldDirection();
  private readonly touch: boolean;
  private view: View;
  private botWait = 0.6;
  private dead = false;
  private route: Pair[] | null = null;
  private sinceMatch = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.touch = !ctx.couch;
    this.tiles = makeBoard(ctx.level, ctx.rng);
    this.mask = fullMask(this.tiles);
    this.ring.eventMode = this.tally.eventMode = this.help.eventMode = 'none';
    ctx.stage.addChild(this.board, this.ring, this.tally, this.help);
    if (this.touch) {
      for (const [node, text, act] of [
        [this.undoButton, 'Undo ↶', () => this.undo()],
        [this.hintButton, 'Hint ◇', () => this.askForHint()],
        [this.shuffleButton, 'Shuffle ↺', () => this.restart()],
      ] as const) {
        node.addChild(tile(160, 100, 'purple'), label(text, 24));
        node.hitArea = new Rectangle(-80, -50, 160, 100);
        onTap(node, act);
        ctx.stage.addChild(node);
      }
    }
    this.rebuild();
  }
  start() { void this.ctx.instruct(this.touch ? 'tile-pairs.go' : 'couch.how.tile-pairs'); }

  private snapshot(): Snapshot { return { tiles: this.tiles.map(t => ({ ...t })), mask: this.mask }; }
  private rebuild() {
    for (const node of this.nodes) node.destroy({ children: true });
    this.nodes = this.tiles.map((t, i) => {
      const c = tileArt(t.kind);
      c.hitArea = new Rectangle(-54, -54, 108, 108);
      if (this.touch) onTap(c, () => this.choose(i), { cooldown: 80 });
      else c.eventMode = 'none';
      this.board.addChild(c);
      return c;
    });
    this.route = solve(this.tiles, this.mask);
    this.cursor = freeTiles(this.tiles, this.mask)[0] ?? 0;
    this.resize(this.view);
    this.draw();
  }
  resize(v: View) {
    this.view = v;
    const cols = Math.max(...this.tiles.map(t => t.x)) + 1;
    const rows = Math.max(...this.tiles.map(t => t.y)) + 1;
    this.board.position.set(v.w / 2 - (cols - 1) * 60, (v.h - 110) / 2 - (rows - 1) * 58);
    this.nodes.forEach((n, i) => n.position.set(this.tiles[i].x * 120 + this.tiles[i].z * 6, this.tiles[i].y * 116 - this.tiles[i].z * 6));
    this.tally.position.set(v.w / 2, 66);
    this.help.position.set(v.w / 2, 104);
    [this.undoButton, this.hintButton, this.shuffleButton].forEach((n, i) => n.position.set(v.w / 2 + (i - 1) * 180, v.h - 70));
    this.draw();
  }
  private draw() {
    this.nodes.forEach((n, i) => {
      n.visible = present(this.mask, i);
      n.alpha = free(this.tiles, this.mask, i) ? 1 : 0.58;
    });
    const remaining = this.tiles.filter((_, i) => present(this.mask, i)).length;
    this.tally.text = `${remaining} tiles · ${this.undos} undos · ${this.shuffles} shuffles`;
    this.help.text = this.route === null ? 'No clearing route · Undo or Shuffle keeps you playing' : 'Clear the top · open a left or right side';
    const g = this.ring.clear();
    const outline = (i: number, color: number, width: number) => {
      if (!present(this.mask, i)) return;
      const n = this.nodes[i];
      g.roundRect(this.board.x + n.x - 51, this.board.y + n.y - 51, 102, 102, 12).stroke({ width, color });
    };
    if (!this.touch && !this.finished) outline(this.cursor, ink, 4);
    if (this.selected !== null) outline(this.selected, swatch.blue.line, 7);
    for (const i of this.hinted ?? []) outline(i, swatch.orange.line, 7);
  }
  private choose(i: number) {
    if (this.busy || this.finished || this.dead || !present(this.mask, i)) return;
    if (!free(this.tiles, this.mask, i)) {
      sfx.squeak();
      void this.ctx.say('tile-pairs.blocked');
      return;
    }
    this.cursor = i;
    if (this.selected === i) { this.selected = null; this.draw(); return; }
    if (this.selected === null) { this.selected = i; sfx.tick(); this.draw(); return; }
    const a = this.selected;
    this.selected = null;
    if (this.tiles[a].kind !== this.tiles[i].kind) {
      this.misses++;
      this.sinceMatch++;
      sfx.boing();
      void this.ctx.say('tile-pairs.mismatch');
      if (this.sinceMatch >= 2) this.askForHint();
      this.draw();
      return;
    }
    this.history.push(this.snapshot());
    this.mask = removePair(this.mask, [a, i]);
    this.hinted = null;
    this.sinceMatch = 0;
    this.route = solve(this.tiles, this.mask);
    this.cursor = freeTiles(this.tiles, this.mask)[0] ?? 0;
    sfx.pop(3);
    this.draw();
    if (!this.mask) void this.complete();
    else if (!this.route) void this.ctx.say('tile-pairs.stuck');
  }
  private undo() {
    if (this.busy || this.finished || this.dead) return;
    const last = this.history.pop();
    if (!last) { this.selected = null; this.hinted = null; this.draw(); return; }
    this.undos++;
    this.tiles = last.tiles;
    this.mask = last.mask;
    this.selected = this.hinted = null;
    this.sinceMatch = 0;
    this.rebuild();
    sfx.tick();
  }
  askForHint() {
    if (this.busy || this.finished || this.dead) return;
    // Recovery itself is counted once; the hint then identifies a genuinely useful pair.
    if (!this.route) this.restart();
    const pair = this.route?.[0];
    if (!pair || this.hinted) return;
    this.hints++;
    this.hinted = pair;
    this.selected = null;
    this.cursor = pair[0];
    this.draw();
    void this.ctx.say('tile-pairs.hint');
  }
  /** Shuffle is the couch pause menu's restart action. Removed tiles stay removed; each rearrangement counts. */
  restart() {
    if (this.busy || this.finished || this.dead) return;
    this.history.push(this.snapshot());
    this.tiles = reshuffle(this.tiles, this.mask, this.ctx.rng);
    this.mask = fullMask(this.tiles);
    this.shuffles++;
    this.hints++;
    this.selected = this.hinted = null;
    this.rebuild();
    void this.ctx.say('tile-pairs.shuffle');
  }
  private async complete() {
    this.busy = this.finished = true;
    this.ring.clear();
    this.ctx.pet.cheer();
    sfx.tada();
    this.ctx.particles.burst(this.view.w / 2, this.view.h / 2, { kind: 'star', colors: [swatch.yellow.fill, swatch.teal.fill], count: 20 });
    await this.ctx.say('tile-pairs.done');
    if (this.dead) return;
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.undos + this.shuffles });
  }
  update(_dt: number) {}
  destroy() { this.dead = true; }

  control(input: CouchControls, dt: number) {
    if (this.busy || this.finished || this.dead) return;
    const open = freeTiles(this.tiles, this.mask), spots = open.map(i => this.nodes[i].position);
    for (const dir of this.held.poll(input, dt)) {
      this.cursor = open[nextSpot(spots, Math.max(0, open.indexOf(this.cursor)), dir)] ?? this.cursor;
      this.draw();
    }
    if (input.players.some(p => p.action)) this.choose(this.cursor);
    else if (input.players.some(p => p.undo)) this.undo();
  }
  private botTarget(): number | null {
    const pair = this.route?.[0];
    if (!pair) return null;
    if (this.selected === pair[0]) return pair[1];
    if (this.selected === pair[1]) return pair[0];
    // Cancel a player's unfinished selection before demonstrating a different pair.
    return this.selected ?? pair[0];
  }
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.dead) return null;
    const to = this.botTarget();
    if (to === null) return { tap: { on: this.shuffleButton } };
    return { tap: { on: this.nodes[to] }, pause: 0.32 };
  }
  autoplay(dt: number): CouchControls {
    const out = idle();
    this.botWait -= dt;
    if (this.busy || this.finished || this.dead || this.botWait > 0) return out;
    const to = this.botTarget();
    if (to === null) return out;
    const p = out.players[0];
    p.active = true;
    if (to === this.cursor) { p.action = true; this.botWait = 0.3; return out; }
    const open = freeTiles(this.tiles, this.mask);
    const dir = routeStep(open.map(i => this.nodes[i].position), open.indexOf(this.cursor), open.indexOf(to));
    p.direction = dir;
    this.botWait = 0.12;
    return out;
  }
}

function sticker(seed: number) {
  const rng = new Rng(seed), c = new Container(), kind = rng.int(0, 5);
  for (const x of [-40, 40]) { const t = tileArt(kind); t.scale.set(0.75); t.position.set(x, x / 5); t.rotation = x / 400; c.addChild(t); }
  return c;
}
export const tilePairs: GameModule = {
  id: 'tile-pairs', name: 'Tile Pairs', titleLine: 'game.tile-pairs', region: 'puzzle-peaks',
  skills: ['spatial-planning', 'matching'], bands: ['grownup'], inputs: ['touch', 'controller'], touchDemo: true,
  levels: band => rangeFor(LEVELS, band), describeLevel: level => planFor(level).name,
  music: STYLES.lullaby,
  coplayHint: 'Look together for a matching pair whose tops and one side are open. Notice what removing it uncovers.',
  offScreen: 'Lay matching playing cards face up in short rows. Remove matching end cards and notice which choices open the middle.',
  hubIcon: () => { const c = sticker(5); c.position.y = -100; return new WigglyIcon(c); },
  sticker, create: ctx => new TilePairs(ctx),
};
