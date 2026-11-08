import { Container, Graphics } from 'pixi.js';
import { cream, grass, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import { tile } from '../shared';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  basketLayout,
  basketOf,
  botStep,
  cellSize,
  deal,
  framesFor,
  frameKey,
  hintTarget,
  makeRound,
  shapeOf,
  startPlay,
  step,
  type Action,
  type BasketLayout,
  type Box,
  type Deal,
  type PlayState,
  type Round,
  type Sapling,
} from './logic';

/** Trees are pictures; at levels 1–3 the whole row is the touch control, at 4–6 the arrows and Plant are. */
export function tree(color: number): Graphics {
  return new Graphics()
    .ellipse(0, 35, 25, 7)
    .fill({ color: swatch.green.line, alpha: 0.2 })
    .roundRect(-6, 0, 12, 34, 4)
    .fill(wood.fill)
    .stroke({ width: 2, color: wood.line })
    .circle(0, -10, 29)
    .fill(swatch.green.fill)
    .stroke({ width: 3, color: swatch.green.line })
    .circle(-12, -12, 6)
    .circle(12, -7, 6)
    .circle(0, 5, 6)
    .fill(color);
}
function sapling(): Graphics {
  return new Graphics()
    .ellipse(0, 20, 22, 9)
    .fill(wood.line)
    .moveTo(0, 12)
    .lineTo(0, -10)
    .stroke({ width: 5, color: swatch.green.line })
    .ellipse(-10, -10, 11, 6)
    .ellipse(10, -16, 11, 6)
    .fill(swatch.green.fill);
}
/** An arrow tile sized to its box; upright, fewer rows is left and more is right. */
export function drawArrow(node: Container, b: Box, dir: 'up' | 'down' | 'left' | 'right') {
  for (const c of node.removeChildren()) c.destroy({ children: true });
  const pts = {
    up: [0, -30, 32, 16, -32, 16],
    down: [0, 30, 32, -16, -32, -16],
    left: [-30, 0, 16, -32, 16, 32],
    right: [30, 0, -16, -32, -16, 32],
  }[dir];
  node.addChild(tile(b.w, b.h, 'teal'), new Graphics().poly(pts).fill(ink));
}
export const FRUIT: Record<Sapling, number> = {
  apple: swatch.red.fill,
  pear: swatch.yellow.fill,
  plum: swatch.purple.fill,
};

/** Seconds the count rests before its deal line is spoken, so rapid taps speak only the last count. */
const REST = 0.5;
/** The whole deal takes at most this long; a tap during it finishes it at once. */
const DEAL_TIME = 0.55;

interface Piece {
  node: Graphics;
  from: { x: number; y: number };
  to: { x: number; y: number };
  delay: number;
  row: number;
}

/** Levels 4–6: a basket of saplings, a row-count control and Plant (or One long row at level 6). */
export class BasketOrchard implements Game {
  readonly round: Round;
  state: PlayState;
  layout: BasketLayout | null = null;
  /** True through a Plant or claim sequence, and the instructions; arrows and baskets wait. */
  busy = true;
  finished = false;
  /** A spoken line is playing that the ghost finger should let finish. */
  speaking = 0;
  /** What the bed shows: the dealt saplings, grown trees, or a shape the pet planted. */
  shown: (Deal & { grown: boolean }) | null = null;
  readonly up = new Container();
  readonly down = new Container();
  readonly card = new Container();
  readonly act = new Container();
  readonly baskets: Container[] = [];
  private readonly backdrop: Backdrop;
  private readonly bed = new Container();
  private readonly leftover = new Container();
  private readonly frames = new Container();
  private readonly glow = new Graphics();
  private readonly heading = label('', 30);
  private view: View;
  private clock = 0;
  private pieces: Piece[] = [];
  private dealStart = -Infinity;
  private growStart = -Infinity;
  private wobbleStart = -Infinity;
  /** The range-end press: the arrow wobbles, a soft tick, nothing counted. */
  private arrowWobble: { node: Container; at: number } | null = null;
  private lineAt = Infinity;
  private pressed: { node: Container; at: number } | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.round = makeRound(ctx.level, ctx.rng);
    this.state = startPlay(this.round);
    this.backdrop = new Backdrop(
      {
        sky: [swatch.blue.light, cream],
        hills: [grass, swatch.green.light],
        horizon: 0.3,
        clouds: 2,
        sun: true,
        seed: 46,
      },
      ctx.view,
    );
    this.glow.eventMode = this.heading.eventMode = 'none';
    this.bed.eventMode = this.leftover.eventMode = this.frames.eventMode = 'none';
    this.buildControls();
    ctx.stage.addChild(
      this.backdrop,
      this.bed,
      this.leftover,
      this.frames,
      this.heading,
      this.up,
      this.card,
      this.down,
      this.act,
      ...this.baskets,
      this.glow,
    );
  }

  get level() {
    return this.state.level;
  }
  get n() {
    return basketOf(this.state);
  }

  start() {
    void this.begin();
  }
  destroy() {
    this.finished = true;
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.speaking > 0 || this.dealing() || this.lineAt !== Infinity)
      return null;
    const a = botStep(this.state);
    if (!a) return null;
    const node =
      a.kind === 'load'
        ? this.baskets[a.basket]
        : a.kind === 'plant' || a.kind === 'claim'
          ? this.act
          : this[a.kind];
    return { tap: { on: node } };
  }

  resize(view: View) {
    this.view = view;
    this.backdrop.resize(view);
    this.heading.position.set(view.w / 2, 62);
    this.layout = basketLayout(view, this.level, this.level === 5 ? this.frameList().length : 0);
    const l = this.layout;
    if (!l) return;
    const at = (node: Container, b: Box) => node.position.set(b.x + b.w / 2, b.y + b.h / 2);
    at(this.up, l.up);
    at(this.down, l.down);
    at(this.card, l.card);
    at(this.act, l.act);
    this.baskets.forEach((b, i) => at(b, l.baskets[i]));
    drawArrow(this.up, l.up, l.portrait ? 'right' : 'up');
    drawArrow(this.down, l.down, l.portrait ? 'left' : 'down');
    this.drawBaskets();
    this.drawFrames();
    // Re-laying out mid-deal or mid-growth moves the pieces; nothing awaited is killed.
    this.drawBed(false);
  }

  update(dt: number) {
    this.clock += dt;
    this.animate();
    if (this.lineAt <= this.clock && this.speaking === 0 && !this.busy) {
      this.lineAt = Infinity;
      this.dealLine();
    }
    for (const c of [this.up, this.down, this.act, ...this.baskets]) c.alpha = 1;
    if (this.pressed && this.clock - this.pressed.at < 0.15) this.pressed.node.alpha = 0.7;
    this.drawGlow();
  }

  // ---- flow ----

  private async begin() {
    this.resize(this.view);
    const line = this.level === 4 ? 'orchard.equal' : this.level === 5 ? 'orchard.every' : 'orchard.onerow';
    await this.talk(this.ctx.instruct(line, { n: this.n ?? 0 }));
    this.busy = false;
    if (this.level !== 6) this.redeal();
  }

  private async talk(p: Promise<void>) {
    this.speaking++;
    try {
      await p;
    } finally {
      this.speaking--;
    }
  }

  private press(a: Action, node: Container) {
    if (this.finished) return;
    // Touch-down feedback even while a line is playing.
    this.pressed = { node, at: this.clock };
    if (this.busy) return;
    if (a.kind === 'plant' || a.kind === 'claim') {
      void this.commit(a);
      return;
    }
    const before = this.state;
    const { state, outcome } = step(this.state, a);
    this.state = state;
    if (outcome === 'end') {
      this.arrowWobble = { node, at: this.clock };
      sfx.pluck(1, 0.15);
      return;
    }
    if (outcome === 'loaded') {
      sfx.pop(5 + (a.kind === 'load' ? a.basket : 0));
      this.drawBaskets();
      void this.talk(this.ctx.say('orchard.basket', { n: this.n ?? 0 }));
      this.redeal();
      return;
    }
    if (outcome === 'moved' && state.rows !== before.rows) this.redeal();
  }

  /** Deal the loaded basket into the current row count, from the basket, and speak it once the count rests. */
  private redeal() {
    const n = this.n;
    if (n === null) {
      this.shown = null;
      this.drawBed(false);
      return;
    }
    this.shown = { ...deal(n, this.state.rows), grown: false };
    // A tap during a deal finishes it at once and applies the new count.
    this.drawBed(!this.dealing());
    // After a spoken basket line the deal line waits its turn (see `update`).
    this.lineAt = this.clock + REST;
  }

  private dealLine() {
    const s = this.shown;
    if (!s || s.grown || this.finished) return;
    const id = s.left ? 'orchard.deal' : s.rows === 1 ? 'orchard.dealone' : 'orchard.dealeven';
    void this.talk(this.ctx.say(id, { rows: s.rows, each: s.each, left: s.left }));
  }

  private async commit(a: Action) {
    this.busy = true;
    this.lineAt = Infinity;
    this.snapDeal();
    const n = this.n ?? 0;
    const before = this.state;
    const { state, outcome } = step(this.state, a);
    this.state = state;
    const glowed = state.glowing && !before.glowing;
    switch (outcome) {
      case 'leftover': {
        sfx.boing();
        this.wobbleStart = this.clock;
        // The reason plays while the arrows stay live, so following the glow at once works.
        this.busy = false;
        void this.talk(
          this.ctx
            .say('orchard.leftover', { left: before.rows ? n % before.rows : 0 })
            .then(() => (glowed && !this.finished ? this.ctx.say('orchard.followglow') : undefined)),
        );
        return;
      }
      case 'planted':
      case 'newshape':
      case 'everydone': {
        await this.grow(before.rows, n);
        if (outcome === 'newshape') await this.talk(this.ctx.say('orchard.newshape'));
        this.drawFrames();
        if (outcome === 'everydone') {
          await this.talk(this.ctx.say('orchard.everydone', { n }));
          return this.end();
        }
        if (state.done) return this.end();
        if (outcome === 'planted') {
          // The second basket.
          this.drawBaskets();
          await this.talk(this.ctx.say('orchard.basket', { n: this.n ?? 0 }));
          this.redeal();
        }
        break;
      }
      case 'turnedsame':
      case 'already':
        sfx.marimba(7);
        await this.talk(this.ctx.say(outcome === 'already' ? 'orchard.already' : 'orchard.turnedsame'));
        break;
      case 'claimwrong':
      case 'claimagain': {
        sfx.boing();
        const shape = shapeOf(n)!;
        this.shown = { ...shape, grown: true };
        this.drawBed(false, true);
        await this.talk(this.ctx.say('orchard.makes', { n, rows: shape.rows, each: shape.each }));
        if (glowed) await this.talk(this.ctx.say('orchard.followglow'));
        break;
      }
      case 'claimright': {
        sfx.sparkle();
        this.shown = { rows: 1, each: n, left: 0, grown: true };
        this.drawBed(false, true);
        await this.talk(this.ctx.say('orchard.prime', { n }));
        if (state.done) return this.end();
        this.shown = null;
        this.drawBed(false);
        this.drawBaskets();
        await this.talk(this.ctx.say('orchard.nextset'));
        break;
      }
      default:
        break;
    }
    if (!this.finished) this.busy = false;
  }

  /** The trees grow row by row while the pet counts. */
  private async grow(rows: number, n: number) {
    sfx.sparkle();
    this.shown = { ...deal(n, rows), grown: true };
    this.drawBed(false, true);
    this.heading.text = `${rows} × ${n / rows} = ${n}`;
    await this.talk(
      this.ctx.say(rows === 1 ? 'orchard.yesone' : 'orchard.yes', { rows, each: n / rows, total: n }),
    );
  }

  private async end() {
    this.finished = true;
    if (this.level !== 5)
      await this.talk(this.ctx.say(this.level === 4 ? 'orchard.done.equal' : 'orchard.done.prime'));
    this.ctx.finish({ misses: this.state.misses, hints: this.state.hints });
  }

  // ---- drawing ----

  private buildControls() {
    onTap(this.up, () => this.press({ kind: 'up' }, this.up));
    onTap(this.down, () => this.press({ kind: 'down' }, this.down));
    this.card.eventMode = 'none';
    onTap(this.act, () => this.press({ kind: this.level === 6 ? 'claim' : 'plant' }, this.act));
    this.act.addChild(tile(130, 110, 'yellow'));
    if (this.level === 6) {
      // One long row: a single row of dots.
      const g = new Graphics();
      for (let i = 0; i < 9; i++) g.circle(-48 + i * 12, 0, 5);
      this.act.addChild(g.fill(ink));
    } else {
      // Plant: a sapling going into the ground.
      const g = sapling();
      g.scale.set(1.4);
      this.act.addChild(g);
    }
    if (this.level === 6)
      for (let i = 0; i < 3; i++) {
        const b = new Container();
        onTap(b, () => this.press({ kind: 'load', basket: i }, b));
        this.baskets.push(b);
      }
  }

  private frameList() {
    const n = this.round.tasks[0].baskets[0];
    return this.level === 5 ? framesFor(n) : [];
  }

  private drawBaskets() {
    const l = this.layout;
    if (!l) return;
    const task = this.state.tasks[this.state.index];
    this.baskets.forEach((b, i) => {
      for (const c of b.removeChildren()) c.destroy({ children: true });
      const n = task.baskets[i],
        loaded = this.state.loaded === i;
      b.addChild(tile(140, 110, loaded ? 'yellow' : 'brown'));
      b.addChild(heap(n, 120, 64, -8));
      const t = label(String(n), 24);
      t.position.set(0, 38);
      b.addChild(t);
      b.pivot.y = loaded ? 8 : 0;
    });
    this.drawCard();
  }

  /** The row-count card: one short bar per row, a picture only. */
  private drawCard() {
    for (const c of this.card.removeChildren()) c.destroy({ children: true });
    this.card.addChild(tile(this.layout?.portrait ? 120 : 130, 120, 'white'));
    const s = this.shown;
    const rows = this.n === null ? 0 : s?.grown && this.level === 6 ? s.rows : this.state.rows;
    const g = new Graphics();
    const gap = Math.min(16, 96 / Math.max(1, rows));
    for (let r = 0; r < rows; r++)
      g.roundRect(-40, -48 + r * gap + (96 - rows * gap) / 2, 80, Math.max(3, gap - 3), 2);
    this.card.addChild(g.fill(swatch.green.line));
  }

  private drawFrames() {
    for (const c of this.frames.removeChildren()) c.destroy({ children: true });
    const l = this.layout;
    if (!l) return;
    this.frameList().forEach(([a, b], i) => {
      const box = l.frames[i];
      const found = this.state.found.includes(frameKey([a, b])) || (this.state.done && this.level === 5);
      const g = new Graphics()
        .roundRect(box.x, box.y, box.w, box.h, 12)
        .fill(found ? swatch.green.light : cream)
        .stroke({ width: 3, color: found ? swatch.green.line : wood.line });
      const sp = Math.min(84 / b, 74 / a),
        r = Math.max(1.5, Math.min(6, sp * 0.35));
      const ox = box.x + box.w / 2 - ((b - 1) * sp) / 2,
        oy = box.y + box.h / 2 - ((a - 1) * sp) / 2;
      for (let y = 0; y < a; y++) for (let x = 0; x < b; x++) g.circle(ox + x * sp, oy + y * sp, r);
      if (found) g.fill(swatch.green.line);
      else g.stroke({ width: 1.5, color: wood.line });
      this.frames.addChild(g);
    });
  }

  /** Lay out the bed's saplings (or trees) and the basket's leftover; `fresh` deals them in from the basket. */
  private drawBed(fresh: boolean, growNow = false) {
    const l = this.layout;
    const s = this.shown;
    for (const c of this.bed.removeChildren()) c.destroy({ children: true });
    for (const c of this.leftover.removeChildren()) c.destroy({ children: true });
    this.pieces = [];
    this.drawCard();
    if (!l || !s) {
      this.heading.text = '';
      return;
    }
    const box = l.baskets[this.level === 6 ? (this.state.loaded ?? 0) : 0];
    if (this.level !== 6) {
      const bg = new Graphics()
        .roundRect(box.x, box.y, box.w, box.h, 16)
        .fill(wood.light)
        .stroke({ width: 4, color: wood.line });
      this.leftover.addChild(bg);
    }
    const bed = l.bed;
    const cell = cellSize(bed, s);
    const ox = bed.x + bed.w / 2 - ((s.each - 1) * cell) / 2,
      oy = bed.y + bed.h / 2 - ((s.rows - 1) * cell) / 2;
    const scale = cell / 80;
    const fruit = FRUIT[this.round.sapling];
    const origin = { x: box.x + box.w / 2, y: box.y + box.h / 2 };
    let k = 0;
    for (let r = 0; r < s.rows; r++)
      for (let c = 0; c < s.each; c++, k++) {
        const node = s.grown ? tree(fruit) : sapling();
        node.scale.set(scale);
        const to = { x: ox + c * cell, y: oy + r * cell };
        node.position.set(to.x, to.y);
        this.bed.addChild(node);
        this.pieces.push({
          node,
          from: origin,
          to,
          delay: (k * (DEAL_TIME - 0.15)) / Math.max(1, s.rows * s.each),
          row: r,
        });
      }
    // The leftover waits in the basket (at level 6 the bed shows planted shapes, never a leftover).
    if (this.level !== 6) {
      const cols = Math.max(1, Math.ceil(s.left / 2)),
        sp = Math.min(32, (box.w - 30) / cols);
      for (let i = 0; i < s.left; i++) {
        const g = sapling();
        g.scale.set(0.5);
        g.position.set(
          box.x + box.w / 2 - ((cols - 1) * sp) / 2 + (i % cols) * sp,
          box.y + (s.left > cols ? 30 : 45) + Math.floor(i / cols) * 32,
        );
        this.leftover.addChild(g);
      }
    }
    if (fresh) {
      this.dealStart = this.clock;
      sfx.marimba(3);
    } else this.dealStart = -Infinity;
    if (growNow) this.growStart = this.clock;
    if (!s.grown) this.heading.text = `${s.rows} × ${s.each}${s.left ? ` + ${s.left}` : ''}`;
    else this.heading.text = `${s.rows} × ${s.each} = ${s.rows * s.each}`;
    this.animate();
  }

  dealing() {
    return this.clock - this.dealStart < DEAL_TIME;
  }
  private snapDeal() {
    this.dealStart = -Infinity;
    this.animate();
  }

  private animate() {
    const t = this.clock - this.dealStart;
    const g = this.clock - this.growStart;
    let lastRow = -1;
    for (const p of this.pieces) {
      const u = Math.max(0, Math.min(1, (t - p.delay) / 0.15));
      const hop = Math.sin(u * Math.PI) * 30;
      p.node.position.set(p.from.x + (p.to.x - p.from.x) * u, p.from.y + (p.to.y - p.from.y) * u - hop);
      p.node.visible = u > 0;
      const grow = Math.max(0.05, Math.min(1, (g - p.row * 0.18) / 0.3));
      p.node.scale.y = p.node.scale.x * (this.shown?.grown ? grow : 1);
      if (u === 1 && this.dealing() && p.row !== lastRow && t - p.delay < 0.17) {
        sfx.pluck(5 + p.row, 0.12);
        lastRow = p.row;
      }
    }
    const w = this.clock - this.wobbleStart;
    const wob = w < 0.5 ? Math.sin(w * 40) * 0.15 * (1 - w / 0.5) : 0;
    for (const c of this.leftover.children.slice(1)) c.rotation = wob;
    for (const c of [this.up, this.down]) c.rotation = 0;
    const aw = this.arrowWobble ? this.clock - this.arrowWobble.at : 1;
    if (this.arrowWobble && aw < 0.4)
      this.arrowWobble.node.rotation = Math.sin(aw * 40) * 0.1 * (1 - aw / 0.4);
  }

  private drawGlow() {
    this.glow.clear();
    const l = this.layout;
    if (!this.state.glowing || this.busy || !l || this.finished) return;
    const h = hintTarget(this.state);
    if (!h) return;
    const b = typeof h === 'object' ? l.baskets[h.basket] : h === 'up' ? l.up : h === 'down' ? l.down : l.act;
    this.glow
      .roundRect(b.x - 8, b.y - 8, b.w + 16, b.h + 16, 22)
      .stroke({ width: 6 + 2 * Math.sin(this.clock * 5), color: swatch.yellow.fill });
  }
}

/** A heap of n saplings as dots, a picture of the basket's amount. */
function heap(n: number, w: number, h: number, y: number): Graphics {
  const cols = Math.ceil(Math.sqrt((n * w) / h)),
    rows = Math.ceil(n / cols);
  const sp = Math.min(w / cols, h / rows),
    g = new Graphics();
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols),
      c = i % cols,
      inRow = r === rows - 1 ? n - r * cols : cols;
    g.circle((c - (inRow - 1) / 2) * sp, y + (r - (rows - 1) / 2) * sp, sp * 0.36);
  }
  return g.fill(swatch.green.fill).stroke({ width: 2, color: swatch.green.line });
}
