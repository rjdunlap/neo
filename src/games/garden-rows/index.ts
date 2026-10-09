import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { spread } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  clash, copyBed, deadEnds, FLOWER_NAMES, hintFor, isFull, isSolved, makeBeds, nextPlanting, planFor, type Bed, type Hint, type Puzzle, type RowsPlan,
} from './logic';

const LEVELS: BandLevels = {
  prek: { min: 1, max: 3 },
  school: { min: 3, max: 6 },
};

const CELL = 100;
const PACKET = 52;

/** One flower, drawn so that no two share a silhouette or a color: it fills about `size` units around (0, 0). */
export function flowerArt(kind: number, size: number): Container {
  const r = size / 2;
  const g = new Graphics();
  const stem = (x0: number, y0: number, x1: number, y1: number) => g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: r * 0.14, color: swatch.green.line, cap: 'round' });
  switch (kind % 5) {
    case 0: {
      // Daisy: white petals around a yellow middle.
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        g.circle(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.27);
      }
      g.fill(0xffffff).stroke({ width: r * 0.07, color: swatch.white.line, join: 'round' });
      g.circle(0, 0, r * 0.32).fill(swatch.yellow.fill).stroke({ width: r * 0.07, color: swatch.yellow.line });
      break;
    }
    case 1: {
      // Tulip: a red cup with three points, on a short stem with a leaf.
      stem(0, r * 0.2, 0, r * 0.9);
      g.ellipse(r * 0.3, r * 0.62, r * 0.28, r * 0.12).fill(swatch.green.fill).stroke({ width: r * 0.06, color: swatch.green.line });
      g.poly([-0.5, -0.78, -0.22, -0.46, 0, -0.9, 0.22, -0.46, 0.5, -0.78, 0.46, -0.1, 0, 0.3, -0.46, -0.1].map((v) => v * r))
        .fill(swatch.red.fill).stroke({ width: r * 0.08, color: swatch.red.line, join: 'round' });
      break;
    }
    case 2: {
      // Rose: a pink bloom curled into a spiral, with two leaves.
      g.ellipse(-r * 0.5, r * 0.55, r * 0.3, r * 0.13).ellipse(r * 0.5, r * 0.55, r * 0.3, r * 0.13).fill(swatch.green.fill).stroke({ width: r * 0.06, color: swatch.green.line });
      g.circle(0, -r * 0.05, r * 0.62).fill(swatch.pink.fill).stroke({ width: r * 0.08, color: swatch.pink.line });
      g.arc(0, -r * 0.05, r * 0.4, Math.PI * 0.1, Math.PI * 1.7).stroke({ width: r * 0.08, color: swatch.pink.line, cap: 'round' });
      g.moveTo(r * 0.12, -r * 0.05 - r * 0.26).arc(0, -r * 0.05, r * 0.2, Math.PI * 1.5, Math.PI * 3).stroke({ width: r * 0.08, color: swatch.pink.line, cap: 'round' });
      break;
    }
    case 3: {
      // Bluebell: a curved stem with three little hanging bells.
      g.moveTo(-r * 0.05, r * 0.95).bezierCurveTo(-r * 0.05, r * 0.2, r * 0.1, -r * 0.5, -r * 0.35, -r * 0.7).stroke({ width: r * 0.12, color: swatch.green.line, cap: 'round' });
      for (const [x, y] of [[-r * 0.38, -r * 0.55], [r * 0.12, -r * 0.1], [-r * 0.3, r * 0.25]]) {
        g.ellipse(x, y, r * 0.26, r * 0.32).fill(swatch.blue.fill).stroke({ width: r * 0.07, color: swatch.blue.line });
        g.ellipse(x, y + r * 0.3, r * 0.34, r * 0.1).fill(swatch.blue.light).stroke({ width: r * 0.06, color: swatch.blue.line });
      }
      break;
    }
    default: {
      // Sunflower: a ring of yellow petals around a big brown middle.
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        g.circle(Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66, r * 0.2);
      }
      g.fill(swatch.yellow.fill).stroke({ width: r * 0.06, color: swatch.yellow.line, join: 'round' });
      g.circle(0, 0, r * 0.44).fill(swatch.brown.line).stroke({ width: r * 0.06, color: 0x6b4630 });
      for (const [x, y] of [[-0.15, -0.1], [0.12, -0.18], [0.18, 0.1], [-0.08, 0.17], [0.0, 0.0]]) g.circle(x * r, y * r, r * 0.05).fill(swatch.brown.fill);
      break;
    }
  }
  const c = new Container();
  c.addChild(g);
  return c;
}

class GardenRows implements Game {
  readonly plan: RowsPlan;
  readonly puzzles: Puzzle[];
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** What is in the bed now, and which spots came planted. */
  bed: Bed = [];
  given: boolean[][] = [];
  selected = 0;

  private readonly board = new Container();
  private readonly soil = new Graphics();
  private readonly glow = new Graphics();
  private readonly plants = new Container();
  private readonly packets = new Container();
  private readonly packetRing = new Graphics();
  private nodes: (Container | null)[][] = [];
  private wrongs = 0;
  private hinted: Hint | null = null;
  private flash: { cells: { r: number; c: number }[]; color: number; until: number } | null = null;
  private clock = 0;
  private settled = false;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.puzzles = makeBeds(this.plan, ctx.rng);
    this.glow.eventMode = 'none';
    this.plants.eventMode = 'none';
    this.packetRing.eventMode = 'none';
    this.board.addChild(this.soil, this.plants, this.glow);
    this.board.eventMode = 'static';
    onTap(this.board, (e) => this.tapBoard(e), { cooldown: 80 });
    for (let f = 0; f < this.plan.size; f++) {
      const packet = new Container();
      packet.addChild(
        new Graphics().circle(0, 5, PACKET).fill(wood.line).circle(0, 0, PACKET).fill(cream).stroke({ width: 5, color: wood.line }),
        flowerArt(f, PACKET * 1.25),
      );
      packet.hitArea = new Circle(0, 0, PACKET + 12);
      onTap(packet, () => this.select(f), { cooldown: 150 });
      this.packets.addChild(packet);
    }
    this.packets.addChild(this.packetRing);
    ctx.stage.addChild(this.board, this.packets);
  }

  get n() {
    return this.plan.size;
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    const w = this.n * CELL;
    // The seed packets sit beside the bed when there is room, and under it on a tall screen.
    const side = v.w - (w + 40) >= 300;
    if (side) {
      const total = w + 70 + PACKET * 2 + 20;
      const x = Math.max(160, (v.w - total) / 2);
      const y = Math.max(100, (v.h - w) / 2);
      this.board.position.set(x, y);
      // A fixed gap, so the round packets never overlap however few flowers there are.
      const gap = PACKET * 2 + 10;
      this.packets.children.slice(0, this.n).forEach((p, i) => p.position.set(x + w + 70 + PACKET, y + w / 2 + (i - (this.n - 1) / 2) * gap));
    } else {
      const total = w + PACKET * 2 + 150;
      const y = Math.max(100, (v.h - total) / 2);
      this.board.position.set((v.w - w) / 2, y);
      const xs = spread(this.n, 150, v.w - 40, PACKET * 2 + 14);
      this.packets.children.slice(0, this.n).forEach((p, i) => p.position.set(xs[i], y + w + 60 + PACKET));
    }
    this.board.hitArea = new Rectangle(0, 0, w, w);
    this.drawSoil();
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.finished) return;
    if (this.flash && this.clock < this.flash.until) {
      for (const { r, c } of this.flash.cells) g.roundRect(c * CELL + 3, r * CELL + 3, CELL - 6, CELL - 6, 14).stroke({ width: 7, color: this.flash.color });
    } else this.flash = null;
    if (this.hinted && !this.busy) {
      g.roundRect(this.hinted.c * CELL + 3, this.hinted.r * CELL + 3, CELL - 6, CELL - 6, 14).stroke({ width: 7 + 2 * Math.sin(this.clock * 6), color: swatch.yellow.fill });
    }
    const ring = this.packetRing.clear();
    const picked = this.packets.children[this.selected];
    if (picked && picked !== this.packetRing) ring.circle(picked.x, picked.y, PACKET + 9).stroke({ width: 7, color: ink });
    if (this.hinted?.kind === 'plant' && !this.busy) {
      const p = this.packets.children[this.hinted.flower];
      if (p) ring.circle(p.x, p.y, PACKET + 9 + 3 * Math.sin(this.clock * 6)).stroke({ width: 6, color: swatch.yellow.fill });
    }
  }

  /** The ghost finger: pick up the seeds for the tightest spot, then plant it. */
  autotouch(): TouchIntent | null {
    const puzzle = this.puzzles[this.index];
    if (this.busy || this.finished || !puzzle) return null;
    const step = nextPlanting(this.bed, puzzle.solution, this.plan.rule, this.selected);
    if (!step) return null;
    if (step.flower !== this.selected) return { tap: { on: this.packets.children[step.flower] }, pause: 0.3 };
    return { tap: { on: this.board, x: step.c * CELL + CELL / 2, y: step.r * CELL + CELL / 2 } };
  }

  destroy() {}

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hinted = null;
    this.flash = null;
    if (this.index >= this.puzzles.length) return void this.finale();
    const puzzle = this.puzzles[this.index];
    this.bed = copyBed(puzzle.start);
    this.given = puzzle.start.map((row) => row.map((v) => v !== null));
    this.plants.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.nodes = this.bed.map((row, r) => row.map((v, c) => (v === null ? null : this.addPlant(r, c, v, false))));
    this.drawSoil();
    this.board.alpha = 0;
    await this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.3 });
    this.busy = false;
    if (this.index > 0) return;
    return this.ctx.instruct(this.plan.rule === 'rows' ? 'rows.rows' : 'rows.both');
  }

  private select(f: number) {
    if (this.busy || this.finished) return;
    this.selected = f;
    sfx.bell(3 + f * 2, 0.3);
  }

  private addPlant(r: number, c: number, flower: number, pop: boolean): Container {
    const node = flowerArt(flower, CELL * 0.82);
    node.position.set(c * CELL + CELL / 2, r * CELL + CELL / 2);
    if (pop) {
      node.scale.set(0.2);
      void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.28, ease: ease.outBack });
    }
    this.plants.addChild(node);
    return node;
  }

  private drawSoil() {
    const g = this.soil.clear();
    const w = this.n * CELL;
    g.roundRect(-14, -14, w + 28, w + 28, 24).fill(wood.light).stroke({ width: 7, color: wood.line });
    for (let r = 0; r < this.n; r++)
      for (let c = 0; c < this.n; c++) {
        const planted = this.given[r]?.[c];
        g.roundRect(c * CELL + 5, r * CELL + 5, CELL - 10, CELL - 10, 16)
          .fill(planted ? swatch.brown.fill : swatch.brown.light)
          .stroke({ width: 3, color: swatch.brown.line });
        if (!planted) g.ellipse(c * CELL + CELL / 2, r * CELL + CELL / 2 + 6, 16, 8).fill({ color: swatch.brown.line, alpha: 0.25 });
      }
  }

  private tapBoard(e: FederatedPointerEvent) {
    if (this.busy || this.finished) return;
    const p = this.board.toLocal(e.global);
    const c = Math.floor(p.x / CELL);
    const r = Math.floor(p.y / CELL);
    if (r < 0 || c < 0 || r >= this.n || c >= this.n) return;
    if (this.given[r][c]) return void sfx.tick();
    if (this.bed[r][c] !== null) return this.takeOut(r, c);
    this.plant(r, c, this.selected);
  }

  /** Tapping a flower the child planted lifts it out again: taking back a guess is always allowed. */
  private takeOut(r: number, c: number) {
    this.bed[r][c] = null;
    this.nodes[r][c]?.destroy({ children: true });
    this.nodes[r][c] = null;
    if (this.hinted?.kind === 'fix' && this.hinted.r === r && this.hinted.c === c) this.hinted = null;
    sfx.pop(2);
    const at = this.ctx.stage.toLocal(this.board.toGlobal({ x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 }));
    this.ctx.particles.burst(at.x, at.y, { kind: 'dot', colors: [swatch.brown.light, 0xffffff], count: 6, speed: [40, 120], gravity: 0, life: [0.3, 0.5] });
  }

  private plant(r: number, c: number, flower: number) {
    const hit = clash(this.bed, this.plan.rule, r, c, flower);
    if (hit) {
      this.miss();
      this.flash = { cells: [{ r, c }, { r: hit.r, c: hit.c }], color: swatch.red.fill, until: this.clock + 1.4 };
      void this.ctx.say(hit.by === 'row' ? 'rows.clash-row' : 'rows.clash-col', { flower: FLOWER_NAMES[flower] });
      return this.maybeHint();
    }
    this.bed[r][c] = flower;
    this.nodes[r][c] = this.addPlant(r, c, flower, true);
    if (this.hinted && this.hinted.r === r && this.hinted.c === c) this.hinted = null;
    sfx.pop(4 + ((r + c) % 6));
    if (isFull(this.bed)) return void this.bloom();
    const stuck = deadEnds(this.bed, this.plan.rule);
    if (stuck.length) {
      // Each flower fits where it is, but a spot has nothing left to take: something planted earlier has to come out.
      this.miss();
      this.flash = { cells: stuck, color: swatch.orange.fill, until: this.clock + 2.2 };
      void this.ctx.say('rows.stuck');
      this.maybeHint();
    }
  }

  private miss() {
    this.misses++;
    this.wrongs++;
    sfx.boing();
  }

  private maybeHint() {
    if (this.wrongs < 2 || this.hinted) return;
    const hint = hintFor(this.bed, this.given, this.puzzles[this.index].solution, this.plan.rule);
    if (!hint) return;
    this.hinted = hint;
    this.hints++;
    this.wrongs = 0;
    void this.ctx.say(hint.kind === 'fix' ? 'rows.hint-fix' : 'rows.hint-plant');
  }

  /** The bed is full and right: every flower blooms in turn. */
  private async bloom() {
    this.busy = true;
    this.hinted = null;
    this.flash = null;
    // The same check the rules use; a full bed that passes it is the one way to finish this bed.
    if (!isSolved(this.bed, this.plan.rule)) return void (this.busy = false);
    for (let r = 0; r < this.n; r++) {
      for (let c = 0; c < this.n; c++) {
        const node = this.nodes[r][c];
        if (node) void this.ctx.tw.to(node.scale, { x: 1.18, y: 1.18 }, { duration: 0.12 }).then(() => this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.12 }));
        sfx.bell(3 + ((r + c) % 7), 0.2);
      }
      await this.ctx.tw.wait(0.12);
    }
    const mid = this.ctx.stage.toLocal(this.board.toGlobal({ x: (this.n * CELL) / 2, y: (this.n * CELL) / 2 }));
    this.ctx.particles.burst(mid.x, mid.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.pink.light], count: 24, speed: [160, 380], gravity: 0, life: [0.6, 1] });
    this.ctx.pet.cheer();
    await this.ctx.say('rows.bloom');
    await this.ctx.tw.to(this.board, { alpha: 0 }, { duration: 0.3 });
    await this.next();
  }

  private async finale() {
    if (this.settled) return;
    this.settled = true;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('rows.done');
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

/** A little bed of nine flowers, no kind repeated in any row or column. */
function miniBed(size: number, cell: number): Container {
  const c = new Container();
  const n = 3;
  const w = n * cell;
  c.addChild(new Graphics().roundRect(-w / 2 - 10, -w / 2 - 10, w + 20, w + 20, 18).fill(wood.light).stroke({ width: 6, color: wood.line }));
  for (let r = 0; r < n; r++)
    for (let col = 0; col < n; col++) {
      c.addChild(new Graphics().roundRect(-w / 2 + col * cell + 3, -w / 2 + r * cell + 3, cell - 6, cell - 6, 10).fill(swatch.brown.light));
      const f = flowerArt((r + col) % n, size);
      f.position.set(-w / 2 + col * cell + cell / 2, -w / 2 + r * cell + cell / 2);
      c.addChild(f);
    }
  return c;
}

class RowsIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const bed = miniBed(48, 62);
    bed.position.set(0, -108);
    c.addChild(bed);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const kind = rng.int(0, 4);
  c.addChild(new Graphics().circle(0, 0, 78).fill(swatch.green.light).stroke({ width: 6, color: swatch.green.line }));
  c.addChild(flowerArt(kind, 120));
  return c;
}

export const gardenRows: GameModule = {
  id: 'garden-rows',
  name: 'Garden Rows',
  titleLine: 'game.garden-rows',
  region: 'puzzle-peaks',
  skills: ['logic', 'deduction', 'patterns', 'spatial-reasoning'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'Point at a row and ask together: which flower is missing here?',
  offScreen: 'Lay out three or four different toys in a grid so no kind repeats in any row or column, then take a few away for her to put back.',
  hubIcon: () => new RowsIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new GardenRows(ctx),
};
