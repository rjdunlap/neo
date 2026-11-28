import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch, type ColorName } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { hinted, missEvery, newTally } from '../../progress/coach';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { BUTTON, bunnyLayout } from './layout';
import {
  LEVELS,
  boardKey,
  clashes,
  countsMiss,
  describeLevel,
  firstClash,
  hintFor,
  isSolved,
  makeBoard,
  reachOf,
  type Board,
  type ClashKind,
  type Hint,
} from './logic';

/** Six patch looks: a colour and a pattern together, so no patch rests on hue alone. */
const LOOKS: { color: ColorName; pattern: 'dots' | 'stripes' | 'checks' | 'clover' | 'slants' | 'rings' }[] =
  [
    { color: 'green', pattern: 'dots' },
    { color: 'yellow', pattern: 'stripes' },
    { color: 'pink', pattern: 'checks' },
    { color: 'blue', pattern: 'clover' },
    { color: 'orange', pattern: 'slants' },
    { color: 'purple', pattern: 'rings' },
  ];

const CLASH_LINE: Record<
  ClashKind,
  'bunny.clash-row' | 'bunny.clash-column' | 'bunny.clash-patch' | 'bunny.clash-touch'
> = {
  row: 'bunny.clash-row',
  column: 'bunny.clash-column',
  patch: 'bunny.clash-patch',
  touch: 'bunny.clash-touch',
};

function bunnyShape(size: number, given: boolean): Container {
  const c = new Container();
  const g = new Graphics();
  const s = size / 100;
  g.ellipse(-14 * s, -38 * s, 9 * s, 26 * s)
    .fill(0xffffff)
    .stroke({ width: 3, color: swatch.white.line });
  g.ellipse(14 * s, -38 * s, 9 * s, 26 * s)
    .fill(0xffffff)
    .stroke({ width: 3, color: swatch.white.line });
  g.ellipse(-14 * s, -36 * s, 4 * s, 18 * s).fill(0xffb6c8);
  g.ellipse(14 * s, -36 * s, 4 * s, 18 * s).fill(0xffb6c8);
  g.ellipse(0, 10 * s, 30 * s, 26 * s)
    .fill(0xffffff)
    .stroke({ width: 3, color: swatch.white.line });
  g.circle(-10 * s, 4 * s, 3.5 * s).fill(ink);
  g.circle(10 * s, 4 * s, 3.5 * s).fill(ink);
  g.ellipse(0, 13 * s, 5 * s, 3.5 * s).fill(0xff8fa3);
  c.addChild(g);
  if (given) {
    const f = new Graphics()
      .moveTo(24 * s, -2 * s)
      .lineTo(24 * s, -44 * s)
      .stroke({ width: 4, color: ink })
      .poly([24 * s, -44 * s, 48 * s, -36 * s, 24 * s, -28 * s])
      .fill(swatch.red.fill);
    c.addChild(f);
  }
  return c;
}

function paw(g: Graphics, x: number, y: number, s: number) {
  g.ellipse(x, y + 5 * s, 9 * s, 7 * s).fill(swatch.brown.line);
  for (const dx of [-11, -4, 4, 11])
    g.circle(x + dx * s, y - 6 * s + Math.abs(dx) * 0.3 * s, 3.8 * s).fill(swatch.brown.line);
}

function leaf(g: Graphics, x: number, y: number, s: number) {
  g.ellipse(x, y, 7 * s, 3.5 * s).fill({ color: swatch.green.line, alpha: 0.55 });
}

function pattern(g: Graphics, kind: (typeof LOOKS)[number]['pattern'], size: number, color: number) {
  const a = 0.5;
  const lo = -size / 2 + 12;
  const hi = size / 2 - 12;
  const step = (hi - lo) / 3;
  if (kind === 'dots') {
    for (let i = 0; i <= 3; i++)
      for (let j = 0; j <= 3; j++)
        if ((i + j) % 2 === 0) g.circle(lo + i * step, lo + j * step, 5).fill({ color, alpha: a });
  } else if (kind === 'stripes') {
    for (let i = 0; i <= 3; i++) g.rect(lo, lo + i * step - 3, hi - lo, 6).fill({ color, alpha: a });
  } else if (kind === 'checks') {
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        if ((i + j) % 2 === 0) g.rect(lo + i * step, lo + j * step, step, step).fill({ color, alpha: a });
  } else if (kind === 'clover') {
    for (const [x, y] of [
      [-14, 0],
      [14, 0],
      [0, -14],
      [0, 14],
    ])
      g.circle(x, y, 10).fill({ color, alpha: a });
  } else if (kind === 'slants') {
    for (let i = 0; i <= 3; i++)
      g.moveTo(lo + i * step, hi)
        .lineTo(Math.min(hi, lo + i * step + 24), hi - 24)
        .stroke({ width: 6, color, alpha: a });
  } else {
    g.circle(0, 0, size / 3).stroke({ width: 6, color, alpha: a });
    g.circle(0, 0, size / 6).stroke({ width: 6, color, alpha: a });
  }
}

const LAMP_KEY = 'bunny-patches.lamp';
const readLamp = (level: number) => {
  try {
    return localStorage.getItem(`${LAMP_KEY}.${level}`) === '1';
  } catch {
    return false;
  }
};
const writeLamp = (level: number, on: boolean) => {
  try {
    localStorage.setItem(`${LAMP_KEY}.${level}`, on ? '1' : '0');
  } catch {
    /* private window: the lamp simply starts off */
  }
};

class Round implements Game {
  private readonly root = new Container();
  readonly board: Board;
  private readonly looks: (typeof LOOKS)[number][];
  private readonly ground = new Graphics();
  private readonly over = new Graphics();
  private readonly bunnyLayer = new Container();
  private readonly markLayer = new Graphics();
  readonly cells: Container[] = [];
  private readonly bunnyNodes = new Map<number, Container>();
  private readonly heading = label('One bunny in every row, column and patch', 30, ink);
  readonly hintButton = new Container();
  private readonly lampButton = new Container();
  private readonly lampText = label('Lamp', 26, ink);
  bunnies: number[] = [];
  private readonly marks = new Set<number>();
  private lamp = false;
  private glow: Hint | null = null;
  private lastJudged: string | null = null;
  private finishIn = -1;
  private time = 0;
  cell = 110;
  private readonly tallyCount = newTally();
  get misses() {
    return this.tallyCount.misses;
  }
  get hints() {
    return this.tallyCount.hints;
  }
  finished = false;

  constructor(private readonly ctx: GameContext) {
    this.board = makeBoard(ctx.level, ctx.rng);
    this.looks = ctx.rng.shuffle([...LOOKS]);
    if (this.board.given !== undefined) this.bunnies.push(this.board.given);
    this.lamp = ctx.level >= 3 && readLamp(ctx.level);
    const n = this.board.n;
    for (let at = 0; at < n * n; at++) {
      const node = new Container();
      onTap(node, () => this.tapSquare(at));
      this.cells.push(node);
      this.root.addChild(node);
    }
    this.markLayer.eventMode = 'none';
    this.over.eventMode = 'none';
    this.ground.eventMode = 'none';
    this.bunnyLayer.eventMode = 'none';
    this.heading.eventMode = 'none';
    this.root.addChildAt(this.ground, 0);
    this.root.addChild(this.markLayer, this.over, this.bunnyLayer);
    for (const [node, text, action] of [
      [this.hintButton, 'Hint ◇', () => this.askForHint()],
      [this.lampButton, '', () => this.toggleLamp()],
    ] as const) {
      node.addChild(tile(BUTTON.w, BUTTON.h, 'purple'));
      node.hitArea = new Rectangle(-BUTTON.w / 2, -BUTTON.h / 2, BUTTON.w, BUTTON.h);
      if (text) node.addChild(label(text, 26, ink));
      onTap(node, action);
    }
    this.lampButton.addChild(this.lampText);
    this.lampButton.visible = ctx.level >= 3;
    ctx.stage.addChild(this.root, this.heading, this.hintButton, this.lampButton);
    if (this.board.given !== undefined) this.addBunny(this.board.given, false);
    this.resize(ctx.view);
  }

  start() {
    void this.ctx.instruct(this.board.given !== undefined ? 'bunny.start-given' : 'bunny.start');
  }

  private tapSquare(at: number) {
    if (this.finished || !this.ctx.alive || at === this.board.given) return;
    const had = this.bunnies.includes(at);
    const marked = this.marks.has(at);
    this.glow = null;
    if (this.ctx.level >= 3 && !had && !marked) {
      this.marks.add(at);
      sfx.tick();
    } else if (this.ctx.level >= 3 && marked) {
      this.marks.delete(at);
      this.bunnies.push(at);
      this.addBunny(at, true);
      sfx.pop(this.bunnies.length % 5);
    } else if (had) {
      this.bunnies = this.bunnies.filter((b) => b !== at);
      this.removeBunny(at);
      sfx.tick();
    } else {
      this.bunnies.push(at);
      this.addBunny(at, true);
      sfx.pop(this.bunnies.length % 5);
    }
    this.draw();
    this.judge();
  }

  private addBunny(at: number, hop: boolean) {
    const node = bunnyShape(this.cell * 0.82, at === this.board.given);
    node.position.copyFrom(this.cellCenter(at));
    this.bunnyLayer.addChild(node);
    this.bunnyNodes.set(at, node);
    if (hop) {
      node.scale.set(0.4);
      void this.ctx.tw.to(
        node.scale,
        { x: 1, y: 1 },
        { duration: 0.22, ease: (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2) },
      );
    }
  }

  private removeBunny(at: number) {
    this.bunnyNodes.get(at)?.destroy({ children: true });
    this.bunnyNodes.delete(at);
  }

  /** A full board is judged; a clash on a part-full board costs nothing. */
  private judge() {
    const b = this.board;
    if (this.bunnies.length !== b.n) return;
    if (isSolved(b, this.bunnies)) {
      this.finished = true;
      sfx.tada();
      sfx.clap();
      this.ctx.particles.burst(this.ctx.view.w / 2, this.ctx.view.h / 2, {
        colors: [swatch.pink.fill, swatch.yellow.fill, swatch.green.fill, swatch.blue.fill],
        count: 40,
        kind: 'dot',
      });
      this.draw();
      void this.ctx.say('bunny.done');
      this.finishIn = 1.6;
      return;
    }
    if (!countsMiss(b, this.bunnies, this.lastJudged)) return;
    this.lastJudged = boardKey(this.bunnies);
    const due = missEvery(this.tallyCount);
    sfx.boing();
    const clash = firstClash(b, this.bunnies);
    if (clash) void this.ctx.say(CLASH_LINE[clash.kind]);
    if (due) this.showHint();
  }

  private showHint() {
    const h = hintFor(this.board, this.bunnies);
    if (!h) return;
    hinted(this.tallyCount);
    this.glow = h;
    this.draw();
    void this.ctx.say(
      h.kind === 'remove'
        ? 'bunny.hint-remove'
        : h.why === 'patch'
          ? 'bunny.hint-patch'
          : h.why === 'row'
            ? 'bunny.hint-row'
            : 'bunny.hint-column',
    );
  }

  askForHint() {
    if (!this.finished) this.showHint();
  }

  private toggleLamp() {
    if (this.ctx.level < 3) return;
    this.lamp = !this.lamp;
    writeLamp(this.ctx.level, this.lamp);
    sfx.tick();
    this.draw();
  }

  private cellCenter(at: number) {
    const n = this.board.n;
    const { first } = bunnyLayout(this.ctx.view, n);
    return { x: first.x + (at % n) * this.cell, y: first.y + Math.floor(at / n) * this.cell };
  }

  private draw() {
    const { n, patch } = this.board;
    const c = this.cell;
    const showReach = this.ctx.level <= 2 || this.lamp;
    const reach = showReach ? reachOf(n, patch, this.bunnies) : new Set<number>();
    const bad = new Set<number>();
    for (const k of clashes(n, patch, this.bunnies)) {
      bad.add(k.a);
      bad.add(k.b);
    }
    const o = this.over.clear();
    const m = this.markLayer.clear();
    for (let at = 0; at < n * n; at++) {
      const p = this.cellCenter(at);
      if (reach.has(at) && !this.bunnies.includes(at)) {
        o.rect(p.x - c / 2, p.y - c / 2, c, c).fill({ color: 0x2b2b3a, alpha: 0.12 });
        leaf(o, p.x, p.y, c / 100);
      }
      if (this.marks.has(at)) paw(m, p.x, p.y, c / 100 + 0.2);
      if (bad.has(at)) o.circle(p.x, p.y, c * 0.46).stroke({ width: 6, color: swatch.red.line });
    }
    if (this.glow) {
      const p = this.cellCenter(this.glow.cell);
      o.roundRect(p.x - c / 2 + 3, p.y - c / 2 + 3, c - 6, c - 6, 14).stroke({
        width: 8,
        color: this.glow.kind === 'remove' ? swatch.red.fill : swatch.yellow.line,
      });
    }
    this.lampText.text = this.lamp ? 'Lamp on' : 'Lamp off';
  }

  private drawGround() {
    const { n, patch } = this.board;
    const c = this.cell;
    const g = this.ground.clear();
    for (let at = 0; at < n * n; at++) {
      const p = this.cellCenter(at);
      const look = this.looks[patch[at]];
      g.rect(p.x - c / 2, p.y - c / 2, c, c).fill(swatch[look.color].light);
    }
    for (let at = 0; at < n * n; at++) {
      const p = this.cellCenter(at);
      const look = this.looks[patch[at]];
      const sub = new Graphics();
      pattern(sub, look.pattern, c, swatch[look.color].line);
      sub.position.set(p.x, p.y);
      this.patternLayer.addChild(sub);
    }
    for (let at = 0; at < n * n; at++) {
      const p = this.cellCenter(at);
      const r = Math.floor(at / n);
      const col = at % n;
      const edge = (dx: number, dy: number, w: number) => {
        const k = this.cellOf(r + dy, col + dx);
        if (k === null || patch[k] !== patch[at]) {
          const x = p.x + (dx * c) / 2;
          const y = p.y + (dy * c) / 2;
          g.moveTo(dx ? x : p.x - c / 2, dy ? y : p.y - c / 2)
            .lineTo(dx ? x : p.x + c / 2, dy ? y : p.y + c / 2)
            .stroke({ width: w, color: ink });
        }
      };
      edge(1, 0, 6);
      edge(0, 1, 6);
      if (col === 0) edge(-1, 0, 6);
      if (r === 0) edge(0, -1, 6);
    }
  }

  private readonly patternLayer = new Container();

  private cellOf(r: number, c: number) {
    const n = this.board.n;
    return r < 0 || c < 0 || r >= n || c >= n ? null : r * n + c;
  }

  update(dt: number) {
    this.time += dt;
    if (this.finishIn >= 0) {
      this.finishIn -= dt;
      for (const [, node] of this.bunnyNodes) node.y -= Math.sin(this.time * 12) * 40 * dt;
      if (this.finishIn < 0 && this.ctx.alive) {
        this.finishIn = -1;
        this.ctx.finish({ misses: this.tallyCount.misses, hints: this.tallyCount.hints });
      }
    }
    // Bunnies in a clash wobble.
    if (!this.finished) {
      const bad = new Set<number>();
      for (const k of clashes(this.board.n, this.board.patch, this.bunnies)) {
        bad.add(k.a);
        bad.add(k.b);
      }
      for (const [at, node] of this.bunnyNodes)
        node.rotation = bad.has(at) ? Math.sin(this.time * 18) * 0.12 : 0;
    }
  }

  resize(view: View) {
    const n = this.board.n;
    const lay = bunnyLayout(view, n);
    this.cell = lay.cell;
    this.heading.position.set(lay.heading.x, lay.heading.y);
    this.heading.style.fontSize = view.upright ? 28 : 30;
    this.hintButton.position.set(lay.hint.x, lay.hint.y);
    this.lampButton.position.set(lay.lamp.x, lay.lamp.y);
    this.cells.forEach((node, at) => {
      const p = this.cellCenter(at);
      node.position.set(p.x, p.y);
      node.hitArea = new Rectangle(-this.cell / 2, -this.cell / 2, this.cell, this.cell);
    });
    this.patternLayer.removeChildren().forEach((c) => c.destroy());
    if (!this.patternLayer.parent) this.root.addChildAt(this.patternLayer, 1);
    this.drawGround();
    for (const [at, node] of this.bunnyNodes) {
      node.destroy({ children: true });
      this.bunnyNodes.delete(at);
    }
    for (const at of this.bunnies) this.addBunny(at, false);
    this.draw();
  }

  /** Guided first play points at the bot's next move: `autotouch` here only reads the board. */
  showMove(): TouchIntent | null {
    return this.autotouch();
  }

  autotouch(): TouchIntent | null {
    if (this.finished || this.finishIn >= 0) return null;
    const h = hintFor(this.board, this.bunnies);
    if (!h) return null;
    return { tap: { on: this.cells[h.cell] }, pause: 0.55 };
  }

  destroy() {
    this.root.destroy({ children: true });
    this.heading.destroy();
    this.hintButton.destroy({ children: true });
    this.lampButton.destroy({ children: true });
  }
}

function picture() {
  const c = new Container();
  c.addChild(
    new Graphics().roundRect(-45, -45, 90, 90, 16).fill(swatch.green.light).stroke({ width: 4, color: ink }),
  );
  const b = bunnyShape(80, false);
  b.y = 8;
  c.addChild(b);
  return c;
}

export const game: GameModule = {
  id: 'bunny-patches',
  name: 'Bunny Patches',
  titleLine: 'game.bunny-patches',
  region: 'puzzle-peaks',
  challenge: 'logic',
  skills: [
    'Ruling squares out: a bunny covers its row, column, patch and neighbours, so what is left shows where the next one goes',
  ],
  bands: ['prek', 'school', 'grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  upright: true,
  coplayHint: 'One of you names a patch by its colour or pattern and the other finds where its bunny can go.',
  offScreen:
    'Draw a four-by-four grid on paper and colour in four patches; place one counter in every row, column and patch with none touching.',
  music: STYLES.quiet,
  touchDemo: true,
  hubIcon: () => new WigglyIcon(picture()),
  sticker: (_seed) => picture(),
  create: (ctx) => new Round(ctx),
};
