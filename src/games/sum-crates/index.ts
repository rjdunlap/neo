import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { hinted, missEvery, newTally } from '../../progress/coach';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { fruit } from '../fruit-sums';
import { WigglyIcon, tile } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { BADGE, BADGE_SHIFT, BUTTON, crateLayout } from './layout';
import {
  LEVELS,
  countsMiss,
  describeLevel,
  fillKey,
  hintFor,
  isCrate,
  isFull,
  isSolved,
  lineStatus,
  makeBoard,
  wrongLines,
  type Board,
  type Hint,
} from './logic';

/** One colour per number, so two fruit never differ by the numeral alone. */
const COLORS: ColorName[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'teal', 'brown'];
const fruitArt = (v: number, size: number) => {
  const f = fruit(v, COLORS[(v - 1) % COLORS.length], 'round', true);
  f.scale.set(size / 100);
  return f;
};

/** An arrow head at the badge's far edge: right for across, down for down, so a sign says which way its line runs. */
function paintArrow(g: Graphics, dir: 'across' | 'down', color: number) {
  g.clear();
  if (dir === 'across') g.poly([BADGE / 2 - 2, -8, BADGE / 2 + 8, 0, BADGE / 2 - 2, 8]).fill(color);
  else g.poly([-8, BADGE / 2 - 2, 0, BADGE / 2 + 8, 8, BADGE / 2 - 2]).fill(color);
}

class Round implements Game {
  private readonly root = new Container();
  readonly board: Board;
  private readonly ground = new Graphics();
  private readonly over = new Graphics();
  private readonly fruitLayer = new Container();
  private readonly badgeLayer = new Container();
  private readonly trayLayer = new Container();
  private readonly heading = label('Make every line add up', 30, ink);
  readonly hintButton = new Container();
  /** Tap targets by crate index (undefined where the stack has a gap) and tray fruit by number minus one. */
  readonly crates: (Container | undefined)[] = [];
  readonly tray: Container[] = [];
  private readonly handles: DragHandle[] = [];
  private readonly fruitNodes = new Map<number, Container>();
  private readonly badges: {
    bg: Graphics;
    made: ReturnType<typeof label>;
    num: ReturnType<typeof label>;
    arrow: Graphics;
  }[] = [];
  /** What is in each crate (0 empty), and the crate chosen to receive the next fruit. */
  fill: number[];
  selected: number | null = null;
  private glow: Hint | null = null;
  private lastJudged: string | null = null;
  private readonly told = new Map<number, string>();
  private finishIn = -1;
  private time = 0;
  cell = 100;
  /** The view last laid out in: `resize` hands over the live one, and `ctx.view` is only the one the round was made in. */
  private view: View;
  private readonly tallyCount = newTally();
  finished = false;
  get misses() {
    return this.tallyCount.misses;
  }
  get hints() {
    return this.tallyCount.hints;
  }

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.board = makeBoard(ctx.level, ctx.rng);
    const b = this.board;
    this.fill = new Array<number>(b.rows * b.cols).fill(0);
    for (const e of [this.ground, this.over, this.fruitLayer, this.badgeLayer, this.heading])
      e.eventMode = 'none';
    this.root.addChild(this.ground);
    for (let at = 0; at < b.rows * b.cols; at++) {
      if (!isCrate(b, at)) {
        this.crates.push(undefined);
        continue;
      }
      const node = new Container();
      onTap(node, () => this.tapCrate(at));
      this.crates.push(node);
      this.root.addChild(node);
    }
    this.root.addChild(this.fruitLayer, this.over, this.badgeLayer, this.trayLayer);
    b.lines.forEach(() => {
      const bg = new Graphics();
      const num = label('', 30, ink);
      const made = label('', 22, swatch.red.line);
      const a = new Graphics();
      this.badgeLayer.addChild(bg, num, made, a);
      this.badges.push({ bg, num, made, arrow: a });
    });
    for (let v = 1; v <= b.maxFruit; v++) {
      const node = new Container();
      node.addChild(fruitArt(v, 100));
      this.tray.push(node);
      this.trayLayer.addChild(node);
      const handle = draggable(node, ctx.tw, {
        lift: 30,
        onDrop: (x, y) => {
          if (this.finished || !ctx.alive) return false;
          if (handle.tapped) this.tapTray(v);
          else {
            const at = this.crateAt(x, y);
            if (at !== null) this.place(at, v);
            else this.tick();
          }
          // The tray never runs out: the dragged fruit always glides home.
          return false;
        },
      });
      this.handles.push(handle);
    }
    for (const [node, text, action] of [[this.hintButton, 'Hint ◇', () => this.askForHint()]] as const) {
      node.addChild(tile(BUTTON.w, BUTTON.h, 'purple'));
      node.hitArea = new Rectangle(-BUTTON.w / 2, -BUTTON.h / 2, BUTTON.w, BUTTON.h);
      node.addChild(label(text, 26, ink));
      onTap(node, action);
    }
    ctx.stage.addChild(this.root, this.heading, this.hintButton);
    this.resize(ctx.view);
  }

  start() {
    void this.ctx.instruct('sum-crates.start');
  }

  private tick() {
    sfx.tick();
  }

  private crateAt(x: number, y: number): number | null {
    const b = this.board;
    const { first } = this.lay();
    const c = Math.round((x - first.x) / this.cell);
    const r = Math.round((y - first.y) / this.cell);
    if (c < 0 || r < 0 || c >= b.cols || r >= b.rows) return null;
    const at = r * b.cols + c;
    return isCrate(b, at) &&
      Math.abs(x - (first.x + c * this.cell)) <= this.cell / 2 &&
      Math.abs(y - (first.y + r * this.cell)) <= this.cell / 2
      ? at
      : null;
  }

  private lay() {
    return crateLayout(this.view, this.board.rows, this.board.cols, this.board.maxFruit);
  }

  private crateCenter(at: number) {
    const { first } = this.lay();
    return {
      x: first.x + (at % this.board.cols) * this.cell,
      y: first.y + Math.floor(at / this.board.cols) * this.cell,
    };
  }

  /** A crate is chosen, or a filled one gives its fruit back and is chosen in its place. */
  private tapCrate(at: number) {
    if (this.finished || !this.ctx.alive) return;
    this.glow = null;
    if (this.fill[at] > 0) {
      this.fill[at] = 0;
      this.removeFruit(at);
      this.selected = at;
      this.tick();
      this.afterChange();
      return;
    }
    this.selected = this.selected === at ? null : at;
    this.tick();
    this.draw();
  }

  private tapTray(v: number) {
    if (this.finished) return;
    if (this.selected === null) {
      // Nothing chosen: choose the first empty crate, so the next tap puts this fruit there.
      const first = this.fill.findIndex((f, at) => isCrate(this.board, at) && f === 0);
      if (first >= 0) this.selected = first;
      this.tick();
      this.draw();
      return;
    }
    this.place(this.selected, v);
  }

  private place(at: number, v: number) {
    if (this.finished || !this.ctx.alive) return;
    this.glow = null;
    if (this.fill[at] > 0) this.removeFruit(at);
    this.fill[at] = v;
    this.selected = null;
    this.addFruit(at, true);
    sfx.pop(v % 5);
    this.afterChange();
  }

  private addFruit(at: number, hop: boolean) {
    const node = fruitArt(this.fill[at], this.cell * 0.8);
    const p = this.crateCenter(at);
    node.position.set(p.x, p.y);
    this.fruitLayer.addChild(node);
    this.fruitNodes.set(at, node);
    if (hop) {
      const rest = node.scale.x;
      node.scale.set(rest * 0.4);
      void this.ctx.tw.to(
        node.scale,
        { x: rest, y: rest },
        { duration: 0.22, ease: (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2) },
      );
    }
  }

  private removeFruit(at: number) {
    const node = this.fruitNodes.get(at);
    if (node) this.ctx.tw.kill(node.scale);
    node?.destroy({ children: true });
    this.fruitNodes.delete(at);
  }

  /** A line that is full says what it made, free; the full board is judged. */
  private afterChange() {
    this.draw();
    const b = this.board;
    if (isFull(b, this.fill)) this.judge();
    else this.readBack();
  }

  private readBack() {
    this.board.lines.forEach((l, li) => {
      const st = lineStatus(l, this.fill);
      const key =
        st.repeat.size > 0 ? `r${[...st.repeat].join('')}` : st.full && !st.right ? `m${st.made}` : '';
      if (key === (this.told.get(li) ?? '')) return;
      this.told.set(li, key);
      if (!key) return;
      if (key[0] === 'r') void this.ctx.say('sum-crates.repeat');
      else void this.ctx.say('sum-crates.makes', { m: st.made, n: l.sum });
    });
  }

  private judge() {
    const b = this.board;
    if (isSolved(b, this.fill)) {
      this.finished = true;
      this.selected = null;
      this.draw();
      sfx.tada();
      sfx.clap();
      this.ctx.particles.burst(this.ctx.view.w / 2, this.ctx.view.h / 2, {
        colors: [swatch.red.fill, swatch.yellow.fill, swatch.green.fill, swatch.orange.fill],
        count: 40,
        kind: 'dot',
      });
      void this.ctx.say('sum-crates.done');
      this.finishIn = 1.8;
      return;
    }
    if (!countsMiss(b, this.fill, this.lastJudged)) {
      // The same wrong stack again costs nothing, but still answers with a boing.
      sfx.boing();
      return;
    }
    this.lastJudged = fillKey(this.fill);
    const due = missEvery(this.tallyCount);
    sfx.boing();
    const wrong = wrongLines(b, this.fill)[0];
    if (wrong) {
      const st = lineStatus(wrong, this.fill);
      if (st.repeat.size > 0) void this.ctx.say('sum-crates.miss-repeat');
      else void this.ctx.say('sum-crates.miss', { n: wrong.sum, dir: wrong.dir });
    }
    if (due) this.showHint();
  }

  private showHint() {
    const h = hintFor(this.board, this.fill);
    if (!h) return;
    hinted(this.tallyCount);
    this.glow = h;
    this.draw();
    if (h.kind === 'remove') void this.ctx.say('sum-crates.hint-remove');
    else {
      const l = this.board.lines[h.line];
      void this.ctx.say('sum-crates.hint', { n: l.sum, dir: l.dir });
    }
  }

  askForHint() {
    if (!this.finished) this.showHint();
  }

  /** The rings, badges and glow, redrawn from the fill. */
  private draw() {
    const b = this.board;
    const c = this.cell;
    const o = this.over.clear();
    const bad = new Set<number>();
    const lineBad = new Set<number>();
    b.lines.forEach((l, li) => {
      const st = lineStatus(l, this.fill);
      if (st.repeat.size > 0) {
        for (const at of l.cells) if (st.repeat.has(this.fill[at])) bad.add(at);
      }
      if (st.wrong) lineBad.add(li);
    });
    for (let at = 0; at < b.rows * b.cols; at++) {
      if (!isCrate(b, at)) continue;
      const p = this.crateCenter(at);
      if (bad.has(at))
        o.roundRect(p.x - c / 2 + 2, p.y - c / 2 + 2, c - 4, c - 4, 14).stroke({
          width: 6,
          color: swatch.red.line,
        });
    }
    if (this.selected !== null) {
      const p = this.crateCenter(this.selected);
      o.roundRect(p.x - c / 2 - 2, p.y - c / 2 - 2, c + 4, c + 4, 16).stroke({
        width: 7,
        color: swatch.blue.line,
      });
    }
    if (this.glow) {
      const p = this.crateCenter(this.glow.cell);
      o.roundRect(p.x - c / 2 + 3, p.y - c / 2 + 3, c - 6, c - 6, 14).stroke({
        width: 8,
        color: this.glow.kind === 'remove' ? swatch.red.fill : swatch.yellow.line,
      });
    }
    b.lines.forEach((l, li) => {
      const st = lineStatus(l, this.fill);
      const w = this.badges[li];
      const first = this.crateCenter(l.cells[0]);
      const x = l.dir === 'across' ? first.x - c / 2 - BADGE / 2 : first.x - BADGE_SHIFT;
      const y = l.dir === 'across' ? first.y - BADGE_SHIFT : first.y - c / 2 - BADGE / 2;
      const stroke = st.right ? swatch.green.line : lineBad.has(li) ? swatch.red.line : ink;
      w.bg
        .clear()
        .roundRect(x - BADGE / 2, y - BADGE / 2, BADGE, BADGE, 12)
        .fill(st.right ? swatch.green.light : 0xffffff)
        .stroke({ width: st.right || lineBad.has(li) ? 6 : 3, color: stroke });
      w.num.text = `${l.sum}`;
      w.num.position.set(x, y);
      w.arrow.position.set(x, y);
      paintArrow(w.arrow, l.dir, stroke);
      // A full line that made a different sum shows what it made, under the sign.
      w.made.text = st.full && !st.right && st.repeat.size === 0 ? `${st.made}` : '';
      w.made.position.set(x, y + BADGE / 2 + 12);
    });
  }

  private drawGround() {
    const b = this.board;
    const c = this.cell;
    const g = this.ground.clear();
    for (let at = 0; at < b.rows * b.cols; at++) {
      if (!isCrate(b, at)) continue;
      const p = this.crateCenter(at);
      const s = c - 8;
      g.roundRect(p.x - s / 2, p.y - s / 2 + 5, s, s, 14)
        .fill(wood.line)
        .roundRect(p.x - s / 2, p.y - s / 2, s, s, 14)
        .fill(wood.light)
        .stroke({ width: 4, color: wood.line });
      for (const dy of [-s / 4, s / 4])
        g.moveTo(p.x - s / 2 + 8, p.y + dy)
          .lineTo(p.x + s / 2 - 8, p.y + dy)
          .stroke({ width: 3, color: wood.fill, alpha: 0.8 });
    }
  }

  update(dt: number) {
    this.time += dt;
    if (this.finishIn >= 0) {
      // The loaded crates hop in a wave before the round ends.
      for (const [at, node] of this.fruitNodes)
        node.y = this.crateCenter(at).y - Math.abs(Math.sin(this.time * 9 + at)) * 22;
      this.finishIn -= dt;
      if (this.finishIn < 0 && this.ctx.alive) {
        this.finishIn = -1;
        this.ctx.finish({ misses: this.tallyCount.misses, hints: this.tallyCount.hints });
      }
      return;
    }
    // A repeated fruit wobbles.
    if (!this.finished) {
      const wob = new Set<number>();
      for (const l of this.board.lines) {
        const st = lineStatus(l, this.fill);
        for (const at of l.cells) if (st.repeat.has(this.fill[at])) wob.add(at);
      }
      for (const [at, node] of this.fruitNodes)
        node.rotation = wob.has(at) ? Math.sin(this.time * 18) * 0.12 : 0;
    }
  }

  resize(view: View) {
    this.view = view;
    const b = this.board;
    const lay = crateLayout(view, b.rows, b.cols, b.maxFruit);
    this.cell = lay.cell;
    this.heading.position.set(lay.heading.x, lay.heading.y);
    this.heading.style.fontSize = view.upright ? 28 : 30;
    this.hintButton.position.set(lay.hint.x, lay.hint.y);
    this.crates.forEach((node, at) => {
      if (!node) return;
      const p = this.crateCenter(at);
      node.position.set(p.x, p.y);
      node.hitArea = new Rectangle(-this.cell / 2, -this.cell / 2, this.cell, this.cell);
    });
    this.tray.forEach((node, i) => {
      const p = lay.tray.at[i];
      node.scale.set(lay.tray.size / 100);
      node.position.set(p.x, p.y);
      this.handles[i].home = { x: p.x, y: p.y };
      node.hitArea = new Rectangle(-50, -50, 100, 100);
    });
    for (const [at, node] of this.fruitNodes) {
      this.ctx.tw.kill(node.scale);
      node.destroy({ children: true });
      this.fruitNodes.delete(at);
    }
    this.drawGround();
    this.fill.forEach((v, at) => v > 0 && this.addFruit(at, false));
    this.draw();
  }

  autotouch(): TouchIntent | null {
    if (this.finished || this.finishIn >= 0) return null;
    const h = hintFor(this.board, this.fill);
    if (!h) return null;
    const crate = this.crates[h.cell];
    if (!crate) return null;
    if (h.kind === 'remove' || this.selected !== h.cell) return { tap: { on: crate }, pause: 0.5 };
    return { tap: { on: this.tray[this.board.solution[h.cell] - 1] }, pause: 0.6 };
  }

  destroy() {
    for (const h of this.handles) h.destroy();
    this.root.destroy({ children: true });
    this.heading.destroy();
    this.hintButton.destroy({ children: true });
  }
}

function picture() {
  const c = new Container();
  c.addChild(
    new Graphics()
      .roundRect(-42, -34, 84, 84, 12)
      .fill(wood.light)
      .stroke({ width: 4, color: wood.line })
      .moveTo(-34, -6)
      .lineTo(34, -6)
      .moveTo(-34, 22)
      .lineTo(34, 22)
      .stroke({ width: 3, color: wood.fill }),
  );
  const f = fruit(7, 'orange', 'round', true);
  f.scale.set(0.8);
  f.y = 0;
  c.addChild(f);
  return c;
}

export const game: GameModule = {
  id: 'sum-crates',
  name: 'Sum Crates',
  titleLine: 'game.sum-crates',
  region: 'counting-cove',
  challenge: 'numbers',
  skills: [
    'Partitions of a number: which fruit pairs and triples make a sign, and using a crossing line to decide between them',
  ],
  bands: ['school', 'grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  upright: true,
  coplayHint:
    'One of you reads a sign and the other finds the fruit; or each takes a direction, across or down, and calls out what the other needs.',
  offScreen:
    'Draw a small grid on paper with the signs in the margins: fill each line with different numbers that add up to its sign.',
  music: STYLES.quiet,
  touchDemo: true,
  hubIcon: () => new WigglyIcon(picture()),
  sticker: (_seed) => picture(),
  create: (ctx) => new Round(ctx),
};
