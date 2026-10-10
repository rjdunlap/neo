import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { cream, ink, swatch, wood, type ColorName } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import type { PixelPictureCreation } from '../../content/creations';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { clues, colorClues, colorsOf, deduce, givenInMirror, LETTERS, makePictures, PICTURES, pixelTouch, planFor, toGrid, type Grid, type Knowledge, type Picture, type PixelPlan } from './logic';

const LEVELS: BandLevels = {
  preschool: { min: 1, max: 2 },
  prek: { min: 1, max: 3 },
  school: { min: 3, max: 6 },
};

const CELL = 100;
/** Logic levels draw every filled square in one color, since only filled-or-empty matters. */
const LOGIC_COLOR = 'b';

const colorOf = (letter: string): ColorName => LETTERS[letter] ?? 'blue';

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
  private hinted: { x: number; y: number } | null = null;
  private lastCreation: PixelPictureCreation | null = null;
  /** The square the ghost finger touched last, so its next one is near it. */
  private ghostAt: { x: number; y: number } | undefined;
  private clock = 0;

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
    const modelSpace = this.plan.mode === 'copy' ? 230 : 0;
    const paletteSpace = this.plan.mode === 'colorClues' ? 130 : 0;
    const x = Math.max(160, (v.w - w - clueSpace - modelSpace - paletteSpace) / 2 + clueSpace);
    const y = Math.max(clueSpace ? 90 + 60 : 110, (v.h - w) / 2 + (clueSpace ? 30 : 0));
    this.board.position.set(x, y);
    this.board.hitArea = new Rectangle(0, 0, w, w);
    this.model.position.set(x + w + 60, y);
    this.clueLayer.position.set(x, y);
    this.palette.forEach((p, i) => {
      if (v.w < 920) p.node.position.set(v.w / 2 + (i ? 72 : -72), Math.min(v.h - 60, y + w + 64));
      else p.node.position.set(x + w + 150, y + w - 60 - i * 120);
    });
    this.draw();
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.hinted && !this.busy) g.roundRect(this.hinted.x * CELL + 4, this.hinted.y * CELL + 4, CELL - 8, CELL - 8, 14).stroke({ width: 7 + 2 * Math.sin(this.clock * 6), color: swatch.yellow.fill });
  }

  /** The ghost finger: choose a color where there is a palette, then tap the squares the picture (or, on logic levels, its numbers) settles. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const move = pixelTouch(this.plan, this.picture, this.filled, this.color, this.ghostAt);
    if (!move) return null;
    if ('color' in move) {
      const swatchNode = this.palette.find((p) => p.letter === move.color)?.node;
      return swatchNode ? { tap: { on: swatchNode } } : null;
    }
    this.ghostAt = move.cell;
    return { tap: { on: this.board, x: move.cell.x * CELL + CELL / 2, y: move.cell.y * CELL + CELL / 2 }, pause: 0.1 };
  }

  destroy() {}

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hinted = null;
    if (this.index >= this.pictures.length) return void this.finale();
    this.picture = this.pictures[this.index];
    this.target = toGrid(this.picture);
    this.filled = this.target.map((row) => row.map(() => null));
    // Mirror levels start with the left half drawn.
    if (this.plan.mode === 'mirror') this.target.forEach((row, y) => row.forEach((c, x) => (this.filled[y][x] = givenInMirror(this.n, x) ? c : null)));
    this.buildModel();
    this.buildClues();
    this.buildPalette();
    this.resize(this.view);
    this.board.alpha = 0;
    await this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.3 });
    this.busy = false;
    if (this.index > 0) return;
    if (this.plan.mode === 'mirror') return this.ctx.instruct('pixel.mirror');
    if (this.plan.mode === 'clues') return this.ctx.instruct('pixel.clues');
    if (this.plan.mode === 'colorClues') return this.ctx.instruct('pixel.colorClues');
    return this.ctx.instruct(this.plan.colors === 2 ? 'pixel.copy2' : 'pixel.copy');
  }

  /** Copy levels: the little picture to copy, beside the grid. */
  private buildModel() {
    this.model.removeChildren().forEach((c) => c.destroy({ children: true }));
    if (this.plan.mode !== 'copy') return;
    const s = 30;
    const g = new Graphics().roundRect(-12, -12, this.n * s + 24, this.n * s + 24, 14).fill(0xffffff).stroke({ width: 5, color: wood.line });
    this.target.forEach((row, y) => row.forEach((c, x) => {
      g.rect(x * s, y * s, s - 2, s - 2).fill(c ? swatch[colorOf(c)].fill : 0xf2f2f6);
    }));
    this.model.addChild(g);
  }

  /** Logic levels: run numbers to the left of each row and above each column. */
  private buildClues() {
    this.clueLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    if (this.plan.mode === 'colorClues') {
      const { rows, cols } = colorClues(this.picture);
      rows.forEach((runs, y) => runs.forEach((run, i) => {
        const t = label(String(run.count), 26, run.count === 0 ? ink : swatch[colorOf(run.color)].line);
        t.anchor.set(1, 0.5);
        t.position.set(-16 - i * 42, y * CELL + CELL / 2);
        this.clueLayer.addChild(t);
      }));
      cols.forEach((runs, x) => runs.forEach((run, i) => {
        const t = label(String(run.count), 26, run.count === 0 ? ink : swatch[colorOf(run.color)].line);
        t.anchor.set(0.5, 1);
        t.position.set(x * CELL + CELL / 2, -12 - i * 32);
        this.clueLayer.addChild(t);
      }));
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

  private draw() {
    const g = this.cells.clear();
    const m = this.marks.clear();
    const n = this.n;
    g.roundRect(-10, -10, n * CELL + 20, n * CELL + 20, 20).fill(cream).stroke({ width: 6, color: wood.line });
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const f = this.filled[y]?.[x];
        const shade = f && f !== 'x' ? swatch[colorOf(f)].fill : (x + y) % 2 ? 0xffffff : 0xf4f4f8;
        g.roundRect(x * CELL + 4, y * CELL + 4, CELL - 8, CELL - 8, 12).fill(shade).stroke({ width: 2, color: 0xd8d8e2 });
        if (f === 'x') m.moveTo(x * CELL + 32, y * CELL + 32).lineTo(x * CELL + 68, y * CELL + 68).moveTo(x * CELL + 68, y * CELL + 32).lineTo(x * CELL + 32, y * CELL + 68).stroke({ width: 6, color: 0xb9bcc8, cap: 'round' });
      }
    // Mirror levels: a dashed line down the middle.
    if (this.plan.mode === 'mirror') for (let y = 0; y < n * CELL; y += 24) m.moveTo((n * CELL) / 2, y).lineTo((n * CELL) / 2, y + 12).stroke({ width: 5, color: swatch.purple.line });
    // The chosen color has a ring.
    for (const p of this.palette) {
      const ring = p.node.children[1] as Graphics | undefined;
      if (ring) ring.destroy();
      if (p.letter === this.color) p.node.addChild(new Graphics().circle(0, 0, 58).stroke({ width: 6, color: ink }));
    }
  }

  private tapBoard(e: FederatedPointerEvent) {
    if (this.busy || this.finished) return;
    const p = this.board.toLocal(e.global);
    const x = Math.floor(p.x / CELL);
    const y = Math.floor(p.y / CELL);
    if (x < 0 || y < 0 || x >= this.n || y >= this.n) return;
    const have = this.filled[y][x];
    if (have && have !== 'x') return;
    if (this.plan.mode === 'mirror' && givenInMirror(this.n, x)) return;
    const want = this.target[y][x];
    const colorNeedsMatch = (this.plan.mode === 'copy' && this.plan.colors === 2) || this.plan.mode === 'colorClues';
    const fill = this.plan.mode === 'clues' ? (want ? LOGIC_COLOR : null) : want;
    if (want && (!colorNeedsMatch || want === this.color)) {
      this.filled[y][x] = fill;
      if (this.hinted?.x === x && this.hinted?.y === y) this.hinted = null;
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
    else void this.ctx.say(this.plan.mode === 'mirror' ? 'pixel.notmirror' : this.plan.mode === 'clues' || this.plan.mode === 'colorClues' ? 'pixel.notclue' : 'pixel.notthere');
    if (this.wrongs >= 2 && !this.hinted) this.hint();
  }

  /** A square worth filling next: on logic levels one the clues can decide; otherwise the next square of the picture. */
  private hint() {
    let cell: { x: number; y: number } | undefined;
    if (this.plan.mode === 'clues') {
      const known: Knowledge = this.filled.map((row) => row.map((c) => (c === 'x' ? false : c ? true : null)));
      cell = deduce(this.picture, known).find((f) => f.fill);
    }
    cell ??= this.target.flatMap((row, y) => row.map((c, x) => ({ x, y, c }))).find(({ x, y, c }) => c && !(this.filled[y][x] && this.filled[y][x] !== 'x'));
    if (!cell) return;
    if (this.plan.mode === 'colorClues' && this.target[cell.y][cell.x]) {
      this.color = this.target[cell.y][cell.x]!;
      this.draw();
    }
    this.hinted = { x: cell.x, y: cell.y };
    this.hints++;
    this.wrongs = 0;
    void this.ctx.say('pixel.hint');
  }

  private complete() {
    return this.target.every((row, y) => row.every((c, x) => !c || (this.filled[y][x] && this.filled[y][x] !== 'x')));
  }

  /** Done: the real picture shows in its colors, square by square, and gets its name. */
  private async reveal() {
    this.busy = true;
    this.hinted = null;
    for (let y = 0; y < this.n; y++) {
      for (let x = 0; x < this.n; x++) if (this.target[y][x]) this.filled[y][x] = this.target[y][x];
        else if (this.filled[y][x] === 'x') this.filled[y][x] = null;
      this.draw();
      sfx.bell(3 + y, 0.2);
      await this.ctx.tw.wait(0.08);
    }
    const c = this.ctx.stage.toLocal(this.board.toGlobal({ x: (this.n * CELL) / 2, y: (this.n * CELL) / 2 }));
    this.ctx.particles.burst(c.x, c.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.pink.light], count: 22, speed: [150, 360], gravity: 0, life: [0.6, 1] });
    this.ctx.pet.cheer();
    await this.ctx.tw.to(this.board.scale, { x: 1.04, y: 1.04 }, { duration: 0.15, ease: ease.outQuad });
    await this.ctx.tw.to(this.board.scale, { x: 1, y: 1 }, { duration: 0.15 });
    await this.ctx.say('pixel.reveal', { name: this.picture.name });
    this.lastCreation = {
      kind: 'picture',
      size: this.plan.size,
      pixels: this.target.flatMap((row, y) => row.flatMap((letter, x) => letter ? [{ x, y, color: colorOf(letter) }] : [])),
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
  toGrid(p).forEach((row, y) => row.forEach((c, x) => {
    if (c) g.rect((x - n / 2) * s, (y - n / 2) * s, s - 2, s - 2).fill(swatch[colorOf(c)].fill);
  }));
  return g;
}

class PixelIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    c.addChild(new Graphics().roundRect(-100, -210, 200, 200, 20).fill(cream).stroke({ width: 6, color: wood.line }));
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
  skills: ['spatial-reasoning', 'symmetry', 'logic', 'art'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'Guess together what the picture will be before it is finished.',
  offScreen: 'Color squares on graph paper to copy a simple picture, or make one for her to copy.',
  hubIcon: () => new PixelIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new PixelPictures(ctx),
};
