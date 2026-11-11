import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { cream, ink, swatch, wood, type ColorName } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { checkIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import type { PixelPictureCreation } from '../../content/creations';
import type { LineId } from '../../content/voice-script';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { BitsRound } from './bits';
import {
  LEVELS,
  canFinish,
  clues,
  colorClues,
  colorLogicCell,
  colorsOf,
  deduce,
  FREE_COLORS,
  freeTap,
  freeTouch,
  given,
  helpCells,
  LETTERS,
  makePictures,
  PICTURES,
  pixelsOf,
  pixelTouch,
  planFor,
  scaleDown,
  toGrid,
  type Grid,
  type Knowledge,
  type Picture,
  type PixelPlan,
} from './logic';

const CELL = 100;
/** Logic levels draw every filled square in one color, since only filled-or-empty matters. */
const LOGIC_COLOR = 'b';

const colorOf = (letter: string): ColorName => LETTERS[letter] ?? 'blue';

/** What she hears after a square that stays empty (a wrong color has its own line). */
const MISS_LINE: Record<PixelPlan['mode'], LineId> = {
  copy: 'pixel.notthere',
  mirror: 'pixel.notmirror',
  clues: 'pixel.notclue',
  colorClues: 'pixel.notclue',
  mirror2: 'pixel.notmirror2',
  big: 'pixel.notbig',
  free: 'pixel.notthere',
  bitsRow: 'pixel.bits.differ.fill',
  bitsPicture: 'pixel.bits.differ.fill',
};

class PixelPictures implements Game {
  readonly plan: PixelPlan;
  readonly pictures: Picture[];
  picture!: Picture;
  target: Grid = [];
  /** What the child has filled: a color letter, 'x' for a crossed-out square, or null. */
  filled: (string | null)[][] = [];
  /** The color chosen on two-color levels. */
  color = 'r';
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  readonly board = new Container();
  readonly palette: { letter: string; node: Container }[] = [];

  private readonly cells = new Graphics();
  private readonly marks = new Graphics();
  private readonly clueLayer = new Container();
  private readonly model = new Container();
  private readonly glow = new Graphics();
  private readonly paletteLayer = new Container();
  private view: View;
  private wrongs = 0;
  /** Squares glowing as help: one, or on level 8 the open squares of one block. */
  hinted: { x: number; y: number }[] = [];
  /** Her last tap on the board, so a level 7–8 glow lands near where she is working. */
  private lastTap: { x: number; y: number } | undefined;
  private lastCreation: PixelPictureCreation | null = null;
  /** The square the ghost finger touched last, so its next one is near it. */
  private ghostAt: { x: number; y: number } | undefined;
  private clock = 0;
  /** Level 10: Done, shown once her design has enough squares. */
  done: RoundButton | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.pictures = makePictures(this.plan, ctx.rng);
    this.glow.eventMode = 'none';
    this.marks.eventMode = 'none';
    this.board.addChild(this.cells, this.marks, this.glow);
    this.board.eventMode = 'static';
    onTap(this.board, (e) => this.tapBoard(e), { cooldown: 80 });
    ctx.stage.addChild(this.clueLayer, this.board, this.model, this.paletteLayer);
  }

  get n() {
    return this.plan.size;
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    this.view = v;
    const w = this.n * CELL;
    const clueSpace = this.plan.mode === 'clues' || this.plan.mode === 'colorClues' ? 90 : 0;
    const modelSpace = this.plan.mode === 'copy' || this.plan.mode === 'big' ? 230 : 0;
    const paletteSpace = this.plan.mode === 'colorClues' ? 130 : this.plan.mode === 'free' ? 280 : 0;
    const x = Math.max(160, (v.w - w - clueSpace - modelSpace - paletteSpace) / 2 + clueSpace);
    const y = Math.max(clueSpace ? 90 + 60 : 110, (v.h - w) / 2 + (clueSpace ? 30 : 0));
    this.board.position.set(x, y);
    this.board.hitArea = new Rectangle(0, 0, w, w);
    this.model.position.set(x + w + 60, y);
    this.clueLayer.position.set(x, y);
    const free = this.plan.mode === 'free';
    const narrow = v.w < 920;
    // Level 10 on a narrow view: the row's first paint keeps its left edge at 150, clear of the pet.
    const rowX = Math.max(206, v.w / 2 - 232);
    const rowY = Math.min(v.h - 70, y + w + 70);
    this.palette.forEach((p, i) => {
      // Level 10: four paints in a row below the board (portrait) or a column beside it, with Done past them.
      if (free && narrow) p.node.position.set(rowX + i * 116, rowY);
      else if (free) p.node.position.set(x + w + 100, y + 60 + i * 126);
      else if (narrow) p.node.position.set(v.w / 2 + (i ? 72 : -72), Math.min(v.h - 60, y + w + 64));
      else p.node.position.set(x + w + 150, y + w - 60 - i * 120);
    });
    if (this.done) {
      if (narrow) this.done.position.set(rowX + 4 * 116 + 10, rowY);
      else this.done.position.set(x + w + 240, y + w - 60);
    }
    this.draw();
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (!this.busy)
      for (const h of this.hinted)
        g.roundRect(h.x * CELL + 4, h.y * CELL + 4, CELL - 8, CELL - 8, 14).stroke({
          width: 7 + 2 * Math.sin(this.clock * 6),
          color: swatch.yellow.fill,
        });
  }

  /** The ghost finger: choose a color where there is a palette, then tap the squares the picture (or, on logic levels, its numbers) settles. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    if (this.plan.mode === 'free') {
      // Level 10: the hand draws a heart, then presses Done.
      const move = freeTouch(this.filled, this.color);
      if (!move) return null;
      if (move === 'done') return this.done?.visible ? { tap: { on: this.done } } : null;
      if ('color' in move) {
        const swatchNode = this.palette.find((p) => p.letter === move.color)?.node;
        return swatchNode ? { tap: { on: swatchNode } } : null;
      }
      return {
        tap: { on: this.board, x: move.cell.x * CELL + CELL / 2, y: move.cell.y * CELL + CELL / 2 },
        pause: 0.1,
      };
    }
    const move = pixelTouch(this.plan, this.picture, this.filled, this.color, this.ghostAt);
    if (!move) return null;
    if ('color' in move) {
      const swatchNode = this.palette.find((p) => p.letter === move.color)?.node;
      return swatchNode ? { tap: { on: swatchNode } } : null;
    }
    this.ghostAt = move.cell;
    return {
      tap: { on: this.board, x: move.cell.x * CELL + CELL / 2, y: move.cell.y * CELL + CELL / 2 },
      pause: 0.1,
    };
  }

  destroy() {}

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hinted = [];
    this.lastTap = undefined;
    if (this.index >= this.pictures.length) return void this.finale();
    this.picture = this.pictures[this.index];
    this.target = toGrid(this.picture);
    this.filled = this.target.map((row) => row.map(() => null));
    // Mirror levels start with the left half (level 7: the top-left quarter) drawn.
    this.target.forEach((row, y) =>
      row.forEach((c, x) => (this.filled[y][x] = given(this.plan, x, y) ? c : null)),
    );
    this.buildModel();
    this.buildClues();
    this.buildPalette();
    this.resize(this.view);
    this.board.alpha = 0;
    await this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.3 });
    this.busy = false;
    if (this.index > 0) return;
    if (this.plan.mode === 'free') return this.ctx.instruct('pixel.free');
    if (this.plan.mode === 'mirror') return this.ctx.instruct('pixel.mirror');
    if (this.plan.mode === 'mirror2') return this.ctx.instruct('pixel.mirror2');
    if (this.plan.mode === 'big') return this.ctx.instruct('pixel.big');
    if (this.plan.mode === 'clues') return this.ctx.instruct('pixel.clues');
    if (this.plan.mode === 'colorClues') return this.ctx.instruct('pixel.colorClues');
    return this.ctx.instruct(this.plan.colors === 2 ? 'pixel.copy2' : 'pixel.copy');
  }

  /** Copy levels: the little picture to copy, beside the grid (level 8: the 3×3 model to make twice as big). */
  private buildModel() {
    this.model.removeChildren().forEach((c) => c.destroy({ children: true }));
    if (this.plan.mode !== 'copy' && this.plan.mode !== 'big') return;
    const small = this.plan.mode === 'big' ? toGrid(scaleDown(this.picture, 2)) : this.target;
    const s = this.plan.mode === 'big' ? 40 : 30;
    const g = new Graphics()
      .roundRect(-12, -12, small.length * s + 24, small.length * s + 24, 14)
      .fill(0xffffff)
      .stroke({ width: 5, color: wood.line });
    small.forEach((row, y) =>
      row.forEach((c, x) => {
        g.rect(x * s, y * s, s - 2, s - 2).fill(c ? swatch[colorOf(c)].fill : 0xf2f2f6);
      }),
    );
    this.model.addChild(g);
  }

  /** Logic levels: run numbers to the left of each row and above each column. */
  private buildClues() {
    this.clueLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    if (this.plan.mode === 'colorClues') {
      const { rows, cols } = colorClues(this.picture);
      rows.forEach((runs, y) =>
        runs.forEach((run, i) => {
          const t = label(String(run.count), 26, run.count === 0 ? ink : swatch[colorOf(run.color)].line);
          t.anchor.set(1, 0.5);
          t.position.set(-16 - i * 42, y * CELL + CELL / 2);
          this.clueLayer.addChild(t);
        }),
      );
      cols.forEach((runs, x) =>
        runs.forEach((run, i) => {
          const t = label(String(run.count), 26, run.count === 0 ? ink : swatch[colorOf(run.color)].line);
          t.anchor.set(0.5, 1);
          t.position.set(x * CELL + CELL / 2, -12 - i * 32);
          this.clueLayer.addChild(t);
        }),
      );
      return;
    }
    if (this.plan.mode !== 'clues') return;
    const { rows, cols } = clues(this.picture);
    rows.forEach((r, y) => {
      const t = label(r.join(' '), 30, ink);
      t.anchor.set(1, 0.5);
      t.position.set(-16, y * CELL + CELL / 2);
      this.clueLayer.addChild(t);
    });
    cols.forEach((c, x) => {
      const t = label(c.join('\n'), 28, ink);
      t.anchor.set(0.5, 1);
      t.position.set(x * CELL + CELL / 2, -12);
      this.clueLayer.addChild(t);
    });
  }

  private buildPalette() {
    for (const p of this.palette.splice(0)) p.node.destroy({ children: true });
    if (this.plan.mode === 'free') return this.buildFreePalette();
    if (this.plan.mode !== 'colorClues' && (this.plan.mode !== 'copy' || this.plan.colors !== 2)) {
      this.color = this.plan.mode === 'clues' ? LOGIC_COLOR : colorsOf(this.picture)[0];
      return;
    }
    const letters = colorsOf(this.picture);
    this.color = letters[0];
    for (const letter of letters) {
      const node = new Container();
      const sw = swatch[colorOf(letter)];
      node.addChild(new Graphics().circle(0, 0, 48).fill(sw.fill).stroke({ width: 6, color: sw.line }));
      node.hitArea = new Circle(0, 0, 56);
      onTap(node, () => {
        this.color = letter;
        sfx.tick();
        this.draw();
      });
      this.palette.push({ letter, node });
      this.paletteLayer.addChild(node);
    }
  }

  /** Level 10: four paints to choose freely, and a Done button that waits until there is a picture. */
  private buildFreePalette() {
    this.color = FREE_COLORS[0];
    for (const letter of FREE_COLORS) {
      const node = new Container();
      const sw = swatch[colorOf(letter)];
      node.addChild(new Graphics().circle(0, 0, 50).fill(sw.fill).stroke({ width: 6, color: sw.line }));
      node.hitArea = new Circle(0, 0, 56);
      onTap(node, () => {
        this.color = letter;
        sfx.tick();
        this.draw();
      });
      this.palette.push({ letter, node });
      this.paletteLayer.addChild(node);
    }
    if (!this.done) {
      this.done = new RoundButton(checkIcon(), swatch.green, 60, () => void this.finishFree());
      this.paletteLayer.addChild(this.done);
    }
    this.done.visible = false;
  }

  private draw() {
    const g = this.cells.clear();
    const m = this.marks.clear();
    const n = this.n;
    g.roundRect(-10, -10, n * CELL + 20, n * CELL + 20, 20)
      .fill(cream)
      .stroke({ width: 6, color: wood.line });
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const f = this.filled[y]?.[x];
        const shade = f && f !== 'x' ? swatch[colorOf(f)].fill : (x + y) % 2 ? 0xffffff : 0xf4f4f8;
        g.roundRect(x * CELL + 4, y * CELL + 4, CELL - 8, CELL - 8, 12)
          .fill(shade)
          .stroke({ width: 2, color: 0xd8d8e2 });
        if (f === 'x')
          m.moveTo(x * CELL + 32, y * CELL + 32)
            .lineTo(x * CELL + 68, y * CELL + 68)
            .moveTo(x * CELL + 68, y * CELL + 32)
            .lineTo(x * CELL + 32, y * CELL + 68)
            .stroke({ width: 6, color: 0xb9bcc8, cap: 'round' });
      }
    // Mirror levels: a dashed line down the middle.
    if (this.plan.mode === 'mirror' || this.plan.mode === 'mirror2')
      for (let y = 0; y < n * CELL; y += 24)
        m.moveTo((n * CELL) / 2, y)
          .lineTo((n * CELL) / 2, y + 12)
          .stroke({ width: 5, color: swatch.purple.line });
    // Level 7: a second dashed line across the middle.
    if (this.plan.mode === 'mirror2')
      for (let x = 0; x < n * CELL; x += 24)
        m.moveTo(x, (n * CELL) / 2)
          .lineTo(x + 12, (n * CELL) / 2)
          .stroke({ width: 5, color: swatch.purple.line });
    // Level 8: faint lines around each 2×2 block, one block for each square of the little picture.
    if (this.plan.mode === 'big')
      for (let k = 2; k < n; k += 2) {
        m.moveTo(k * CELL, 0)
          .lineTo(k * CELL, n * CELL)
          .stroke({ width: 4, color: 0xc9c2dc });
        m.moveTo(0, k * CELL)
          .lineTo(n * CELL, k * CELL)
          .stroke({ width: 4, color: 0xc9c2dc });
      }
    // The chosen color has a ring.
    for (const p of this.palette) {
      const ring = p.node.children[1] as Graphics | undefined;
      if (ring) ring.destroy();
      if (p.letter === this.color)
        p.node.addChild(new Graphics().circle(0, 0, 58).stroke({ width: 6, color: ink }));
    }
  }

  private tapBoard(e: FederatedPointerEvent) {
    if (this.busy || this.finished) return;
    const p = this.board.toLocal(e.global);
    const x = Math.floor(p.x / CELL);
    const y = Math.floor(p.y / CELL);
    if (x < 0 || y < 0 || x >= this.n || y >= this.n) return;
    if (this.plan.mode === 'free') return this.tapFree(x, y);
    const have = this.filled[y][x];
    if (have && have !== 'x') return;
    if (given(this.plan, x, y)) return;
    this.lastTap = { x, y };
    const want = this.target[y][x];
    const colorNeedsMatch =
      (this.plan.mode === 'copy' && this.plan.colors === 2) || this.plan.mode === 'colorClues';
    const fill = this.plan.mode === 'clues' ? (want ? LOGIC_COLOR : null) : want;
    if (want && (!colorNeedsMatch || want === this.color)) {
      this.filled[y][x] = fill;
      this.hinted = this.hinted.filter((h) => h.x !== x || h.y !== y);
      sfx.pop(4 + ((x + y) % 6));
      this.draw();
      if (this.complete()) void this.reveal();
      return;
    }
    // A square that stays empty, or the wrong color: a gentle miss.
    this.misses++;
    this.wrongs++;
    sfx.boing();
    if ((this.plan.mode === 'clues' || this.plan.mode === 'colorClues') && !want) {
      this.filled[y][x] = 'x';
      this.draw();
    }
    if (want && colorNeedsMatch) void this.ctx.say('pixel.notcolor', { color: colorOf(want) });
    else void this.ctx.say(MISS_LINE[this.plan.mode]);
    if (this.wrongs >= 2 && !this.hinted.length) this.hint();
  }

  /** Level 10: paint an empty square, empty a colored one; nothing is a miss. Done appears at four squares. */
  private tapFree(x: number, y: number) {
    const emptying = !!this.filled[y][x];
    this.filled = freeTap(this.filled, x, y, this.color);
    if (emptying) sfx.tick();
    else sfx.pop(4 + ((x + y) % 6));
    this.draw();
    const ready = canFinish(this.filled);
    if (this.done && ready !== this.done.visible) {
      this.done.visible = ready;
      if (ready) {
        this.done.scale.set(0.4);
        void this.ctx.tw.to(this.done.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
      }
    }
  }

  /** Done on level 10: her design is the round's picture, kept on request like any other. */
  private async finishFree() {
    if (this.busy || this.finished || !canFinish(this.filled)) return;
    this.busy = true;
    if (this.done) this.done.visible = false;
    this.lastCreation = { kind: 'picture', size: this.plan.size, pixels: pixelsOf(this.filled) };
    const c = this.ctx.stage.toLocal(this.board.toGlobal({ x: (this.n * CELL) / 2, y: (this.n * CELL) / 2 }));
    this.ctx.particles.burst(c.x, c.y, {
      kind: 'star',
      colors: [0xffffff, 0xfff3a0, swatch.pink.light],
      count: 22,
      speed: [150, 360],
      gravity: 0,
      life: [0.6, 1],
    });
    this.ctx.pet.cheer();
    sfx.tada();
    await this.ctx.tw.to(this.board.scale, { x: 1.04, y: 1.04 }, { duration: 0.15, ease: ease.outQuad });
    await this.ctx.tw.to(this.board.scale, { x: 1, y: 1 }, { duration: 0.15 });
    await this.ctx.say('pixel.mine');
    await this.ctx.tw.wait(0.5);
    this.finished = true;
    this.ctx.finish({ misses: 0, hints: 0, creation: this.lastCreation });
  }

  /** A square worth filling next: on logic levels one the (colored) clues can decide; otherwise from `helpCells` (level 8: a whole block). */
  private hint() {
    let cell: { x: number; y: number } | undefined;
    let cells: { x: number; y: number }[] = [];
    if (this.plan.mode === 'clues') {
      const known: Knowledge = this.filled.map((row) =>
        row.map((c) => (c === 'x' ? false : c ? true : null)),
      );
      cell = deduce(this.picture, known).find((f) => f.fill);
    }
    if (this.plan.mode === 'colorClues')
      cell = colorLogicCell(this.picture, this.filled, this.color) ?? undefined;
    if (cell) cells = [cell];
    else if (this.plan.mode !== 'clues' && this.plan.mode !== 'colorClues')
      cells = helpCells(this.plan, this.picture, this.filled, this.lastTap);
    if (!cells.length) return;
    cell = cells[0];
    // Two-color levels: the glow comes with its color in hand.
    if (this.plan.colors === 2 && this.target[cell.y][cell.x]) {
      this.color = this.target[cell.y][cell.x]!;
      this.draw();
    }
    this.hinted = cells.map(({ x, y }) => ({ x, y }));
    this.hints++;
    this.wrongs = 0;
    void this.ctx.say('pixel.hint');
  }

  private complete() {
    return this.target.every((row, y) =>
      row.every((c, x) => !c || (this.filled[y][x] && this.filled[y][x] !== 'x')),
    );
  }

  /** Done: the real picture shows in its colors, square by square, and gets its name. */
  private async reveal() {
    this.busy = true;
    this.hinted = [];
    for (let y = 0; y < this.n; y++) {
      for (let x = 0; x < this.n; x++)
        if (this.target[y][x]) this.filled[y][x] = this.target[y][x];
        else if (this.filled[y][x] === 'x') this.filled[y][x] = null;
      this.draw();
      sfx.bell(3 + y, 0.2);
      await this.ctx.tw.wait(0.08);
    }
    const c = this.ctx.stage.toLocal(this.board.toGlobal({ x: (this.n * CELL) / 2, y: (this.n * CELL) / 2 }));
    this.ctx.particles.burst(c.x, c.y, {
      kind: 'star',
      colors: [0xffffff, 0xfff3a0, swatch.pink.light],
      count: 22,
      speed: [150, 360],
      gravity: 0,
      life: [0.6, 1],
    });
    this.ctx.pet.cheer();
    await this.ctx.tw.to(this.board.scale, { x: 1.04, y: 1.04 }, { duration: 0.15, ease: ease.outQuad });
    await this.ctx.tw.to(this.board.scale, { x: 1, y: 1 }, { duration: 0.15 });
    await this.ctx.say('pixel.reveal', { name: this.picture.name });
    if (this.plan.mode === 'big') await this.ctx.say('pixel.twice');
    this.lastCreation = {
      kind: 'picture',
      size: this.plan.size,
      pixels: pixelsOf(this.target),
    };
    await this.ctx.tw.to(this.board, { alpha: 0 }, { duration: 0.3 });
    await this.next();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('pixel.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints, creation: this.lastCreation ?? undefined });
  }
}

/** A picture drawn in small squares, for the hub icon and stickers. */
function mini(p: Picture, s: number): Graphics {
  const g = new Graphics();
  const n = p.rows.length;
  toGrid(p).forEach((row, y) =>
    row.forEach((c, x) => {
      if (c) g.rect((x - n / 2) * s, (y - n / 2) * s, s - 2, s - 2).fill(swatch[colorOf(c)].fill);
    }),
  );
  return g;
}

class PixelIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    c.addChild(
      new Graphics().roundRect(-100, -210, 200, 200, 20).fill(cream).stroke({ width: 6, color: wood.line }),
    );
    const heart = mini(PICTURES[6][1], 28);
    heart.position.set(0, -104);
    c.addChild(heart);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(mini(rng.pick([...PICTURES[5], ...PICTURES[6]]), 30));
  return c;
}

export const pixelPictures: GameModule = {
  id: 'pixel-pictures',
  name: 'Pixel Pictures',
  titleLine: 'game.pixel-pictures',
  region: 'treehouse',
  challenge: 'space',
  skills: ['spatial-reasoning', 'symmetry', 'logic', 'art'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: [9],
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint:
    'Guess together what the picture will be before it is finished. On My own picture, take turns: one of you names something to draw and the other colors it. On Ones and zeros, one of you flips the cards and reads the ones and zeros aloud, the other says which squares will fill before the arrow is pressed; then swap.',
  offScreen: 'Color squares on graph paper to copy a simple picture, or make one for her to copy.',
  hubIcon: () => new PixelIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => (planFor(ctx.level).mode.startsWith('bits') ? new BitsRound(ctx) : new PixelPictures(ctx)),
};
