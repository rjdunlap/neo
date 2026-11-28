import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { HeldDirection, idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { beeLayout } from './bee-layout';
import { BeeGardenView, drawHeight } from './bee-view';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  HEIGHTS,
  beeHint,
  beeHintValid,
  checkBeeBed,
  inspectGate,
  type BeeHint,
  type BeePuzzle,
  boxSide,
  clash,
  copyBed,
  deadEnds,
  CELL,
  FLOWER_NAMES,
  gardenLayout,
  gateLine,
  hintFor,
  isFull,
  isSolved,
  makeBeds,
  mendTarget,
  nextMove,
  PACKET,
  PACKET_REACH,
  planFor,
  rowsOf,
  type Bed,
  type Hint,
  type Puzzle,
  type RowsPlan,
} from './logic';

/** One flower, drawn so that no two share a silhouette or a color: it fills about `size` units around (0, 0). */
export function flowerArt(kind: number, size: number): Container {
  const r = size / 2;
  const g = new Graphics();
  const stem = (x0: number, y0: number, x1: number, y1: number) =>
    g
      .moveTo(x0, y0)
      .lineTo(x1, y1)
      .stroke({ width: r * 0.14, color: swatch.green.line, cap: 'round' });
  switch (kind % 5) {
    case 0: {
      // Daisy: white petals around a yellow middle.
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        g.circle(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.27);
      }
      g.fill(0xffffff).stroke({ width: r * 0.07, color: swatch.white.line, join: 'round' });
      g.circle(0, 0, r * 0.32)
        .fill(swatch.yellow.fill)
        .stroke({ width: r * 0.07, color: swatch.yellow.line });
      break;
    }
    case 1: {
      // Tulip: a red cup with three points, on a short stem with a leaf.
      stem(0, r * 0.2, 0, r * 0.9);
      g.ellipse(r * 0.3, r * 0.62, r * 0.28, r * 0.12)
        .fill(swatch.green.fill)
        .stroke({ width: r * 0.06, color: swatch.green.line });
      g.poly(
        [-0.5, -0.78, -0.22, -0.46, 0, -0.9, 0.22, -0.46, 0.5, -0.78, 0.46, -0.1, 0, 0.3, -0.46, -0.1].map(
          (v) => v * r,
        ),
      )
        .fill(swatch.red.fill)
        .stroke({ width: r * 0.08, color: swatch.red.line, join: 'round' });
      break;
    }
    case 2: {
      // Rose: a pink bloom curled into a spiral, with two leaves.
      g.ellipse(-r * 0.5, r * 0.55, r * 0.3, r * 0.13)
        .ellipse(r * 0.5, r * 0.55, r * 0.3, r * 0.13)
        .fill(swatch.green.fill)
        .stroke({ width: r * 0.06, color: swatch.green.line });
      g.circle(0, -r * 0.05, r * 0.62)
        .fill(swatch.pink.fill)
        .stroke({ width: r * 0.08, color: swatch.pink.line });
      g.arc(0, -r * 0.05, r * 0.4, Math.PI * 0.1, Math.PI * 1.7).stroke({
        width: r * 0.08,
        color: swatch.pink.line,
        cap: 'round',
      });
      g.moveTo(r * 0.12, -r * 0.05 - r * 0.26)
        .arc(0, -r * 0.05, r * 0.2, Math.PI * 1.5, Math.PI * 3)
        .stroke({ width: r * 0.08, color: swatch.pink.line, cap: 'round' });
      break;
    }
    case 3: {
      // Bluebell: a curved stem with three little hanging bells.
      g.moveTo(-r * 0.05, r * 0.95)
        .bezierCurveTo(-r * 0.05, r * 0.2, r * 0.1, -r * 0.5, -r * 0.35, -r * 0.7)
        .stroke({ width: r * 0.12, color: swatch.green.line, cap: 'round' });
      for (const [x, y] of [
        [-r * 0.38, -r * 0.55],
        [r * 0.12, -r * 0.1],
        [-r * 0.3, r * 0.25],
      ]) {
        g.ellipse(x, y, r * 0.26, r * 0.32)
          .fill(swatch.blue.fill)
          .stroke({ width: r * 0.07, color: swatch.blue.line });
        g.ellipse(x, y + r * 0.3, r * 0.34, r * 0.1)
          .fill(swatch.blue.light)
          .stroke({ width: r * 0.06, color: swatch.blue.line });
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
      g.circle(0, 0, r * 0.44)
        .fill(swatch.brown.line)
        .stroke({ width: r * 0.06, color: 0x6b4630 });
      for (const [x, y] of [
        [-0.15, -0.1],
        [0.12, -0.18],
        [0.18, 0.1],
        [-0.08, 0.17],
        [0.0, 0.0],
      ])
        g.circle(x * r, y * r, r * 0.05).fill(swatch.brown.fill);
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

  readonly askForHint?: () => void;
  readonly hintLabel?: string;
  private readonly bee: BeeGardenView | null;
  private readonly rejected = new Set<string>();
  private readonly sight = new Graphics();
  private activeGate: number | null = null;
  private beeFeedback = 0;
  private heightHint: BeeHint | null = null;
  private sampleSide: number | null = null;
  private sampleVisits = new Set<number>();
  private demoOpened = false;
  private flight: number | null = null;
  private view: View;

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
  // Couch play: a teal ring over a spot in the bed, moved one spot at a time; pressing an empty spot opens the seed packets.
  private cursor = { r: 0, c: 0 };
  private couchOn = false;
  private choosing = false;
  private readonly ring = new Graphics();
  private readonly held = new HeldDirection();
  private botWait = 1.5;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.view = ctx.view;
    this.puzzles = makeBeds(this.plan, ctx.rng);
    const puzzle = this.puzzles[0];
    this.bee =
      'gates' in puzzle
        ? new BeeGardenView(
            puzzle as BeePuzzle,
            (id) => this.openGate(id),
            () => this.askBee(),
            (side) => this.showSample(side),
          )
        : null;
    if (this.bee) {
      this.sampleSide = ctx.demo ? 0 : null;
      this.askForHint = () => this.showBeeHint();
      this.hintLabel = 'Show a hint';
    }
    this.sight.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.plants.eventMode = 'none';
    this.packetRing.eventMode = 'none';
    this.ring.eventMode = 'none';
    // The ring last, so it sits over the flowers and the hint glow.
    this.board.addChild(this.soil, this.sight, this.plants, this.glow, this.ring);
    this.board.eventMode = 'static';
    onTap(this.board, (e) => this.tapBoard(e), { cooldown: 80 });
    for (let f = 0; f < this.plan.size; f++) {
      const packet = new Container();
      // The flower on the packet is drawn per bed, from that bed's kinds (see `next`).
      packet.addChild(
        new Graphics()
          .circle(0, 5, PACKET)
          .fill(wood.line)
          .circle(0, 0, PACKET)
          .fill(cream)
          .stroke({ width: 5, color: wood.line }),
      );
      packet.hitArea = new Circle(0, 0, PACKET + PACKET_REACH);
      onTap(packet, () => this.select(f), { cooldown: 150 });
      this.packets.addChild(packet);
    }
    this.packets.addChild(this.packetRing);
    ctx.stage.addChild(this.board, this.packets);
    if (this.bee) ctx.stage.addChild(this.bee);
  }

  get n() {
    return this.plan.size;
  }

  /** Rows in the bed: as many as columns, except One row's one. */
  get rows() {
    return rowsOf(this.plan);
  }

  /** Which of the five flowers this bed's flower `f` is. */
  private kind(f: number): number {
    return this.puzzles[this.index]?.kinds[f] ?? f;
  }

  /** Where the help and the ghost finger lead: the one way to finish, or for Mend the bed the repair she has begun. */
  private target(): Bed {
    const { solution } = this.puzzles[this.index];
    return this.plan.mend ? mendTarget(this.bed, this.plan.rule, solution) : solution;
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    this.view = v;
    const L = this.bee ? beeLayout(v) : gardenLayout(v, this.plan);
    this.bee?.place(v, this.sampleSide);
    this.board.position.set(L.board.x, L.board.y);
    this.packets.children.slice(0, this.n).forEach((p, i) => p.position.set(L.packets[i].x, L.packets[i].y));
    this.board.hitArea = new Rectangle(0, 0, L.board.w, L.board.h);
    this.drawSoil();
  }

  update(dt: number) {
    this.clock += dt;
    if (this.flight !== null) this.bee?.celebrate(Math.min(1, (this.clock - this.flight) / 0.8));
    const g = this.glow.clear();
    if (this.finished) return;
    if (this.flash && this.clock < this.flash.until) {
      for (const { r, c } of this.flash.cells)
        g.roundRect(c * CELL + 3, r * CELL + 3, CELL - 6, CELL - 6, 14).stroke({
          width: 7,
          color: this.flash.color,
        });
    } else this.flash = null;
    if (this.hinted && !this.busy) {
      g.roundRect(this.hinted.c * CELL + 3, this.hinted.r * CELL + 3, CELL - 6, CELL - 6, 14).stroke({
        width: 7 + 2 * Math.sin(this.clock * 6),
        color: swatch.yellow.fill,
      });
    }
    const ring = this.packetRing.clear();
    const picked = this.packets.children[this.selected];
    // On the couch, while the packets are open, the chosen packet's ring turns teal: the ring has moved out to them.
    const open = this.couchOn && this.choosing && !this.busy;
    if (picked && picked !== this.packetRing)
      ring
        .circle(picked.x, picked.y, PACKET + 9)
        .stroke({ width: open ? 9 : 7, color: open ? swatch.teal.line : ink });
    const spot = this.ring.clear();
    if (this.couchOn && !this.busy) {
      const { r, c } = this.cursor;
      spot
        .roundRect(c * CELL + 8, r * CELL + 8, CELL - 16, CELL - 16, 14)
        .stroke({ width: 8, color: swatch.teal.line, alpha: this.choosing ? 0.5 : 1 });
    }
    if (this.hinted?.kind === 'plant' && !this.busy) {
      const p = this.packets.children[this.hinted.flower];
      if (p)
        ring
          .circle(p.x, p.y, PACKET + 9 + 3 * Math.sin(this.clock * 6))
          .stroke({ width: 6, color: swatch.yellow.fill });
    }
  }

  /** The ghost finger: pick up the seeds for the tightest spot, then plant it. */
  /** Guided first play points at the bot's next move: `autotouch` here only reads the board. */
  showMove(): TouchIntent | null {
    return this.autotouch();
  }

  autotouch(): TouchIntent | null {
    const puzzle = this.puzzles[this.index];
    if (this.busy || this.finished || !puzzle) return null;
    if (this.bee) {
      if (this.sampleSide !== null) {
        const end = this.bee.sampleEnds.findIndex((_, side) => !this.sampleVisits.has(side));
        return { tap: { on: end < 0 ? this.bee.check.node : this.bee.sampleEnds[end].node }, pause: 1.1 };
      }
      if (!this.demoOpened)
        return { tap: { on: this.bee.gates[this.bee.puzzle.teachingGate].node }, pause: 1.1 };
      const step = beeHint(this.bed, this.bee.puzzle);
      if (!step) return { tap: { on: this.bee.check.node } };
      if (step.kind === 'plant' && step.flower !== this.selected)
        return { tap: { on: this.packets.children[step.flower] }, pause: 0.3 };
      return { tap: { on: this.board, x: (step.c + 0.5) * CELL, y: (step.r + 0.5) * CELL } };
    }
    const step = nextMove(this.bed, this.given, this.target(), this.plan.rule, this.selected);
    if (!step) return null;
    if (!step.lift && step.flower !== this.selected)
      return { tap: { on: this.packets.children[step.flower] }, pause: 0.3 };
    return {
      tap: { on: this.board, x: step.c * CELL + CELL / 2, y: step.r * CELL + CELL / 2 },
      pause: step.lift ? 0.3 : undefined,
    };
  }

  /**
   * Couch play: the stick or the arrows move the ring over the bed; the bottom button on an empty spot opens the packets,
   * where the stick picks a flower and the bottom button plants it (the left button closes them). The bottom button on a
   * flower she planted takes it out again, as a tap does.
   */
  control(input: CouchControls, dt: number) {
    this.couchOn = true;
    if (this.busy || this.finished || this.bee) return;
    for (const dir of this.held.poll(input, dt)) this.move(dir);
    if (input.players.some((p) => p.action)) this.press();
    else if (input.players.some((p) => p.undo) && this.choosing) {
      this.choosing = false;
      sfx.tick();
    }
  }

  private move(dir: number) {
    if (this.choosing) {
      // The packets stand in a column or a row depending on the screen: right and down are the next one, left and up the one before.
      const step = dir === 0 || dir === 1 ? 1 : -1;
      return this.select((this.selected + step + this.n) % this.n);
    }
    const r = Math.min(this.rows - 1, Math.max(0, this.cursor.r + [0, 1, 0, -1][dir]));
    const c = Math.min(this.n - 1, Math.max(0, this.cursor.c + [1, 0, -1, 0][dir]));
    if (r === this.cursor.r && c === this.cursor.c) return;
    this.cursor = { r, c };
    sfx.tick();
  }

  private press() {
    const { r, c } = this.cursor;
    if (this.choosing) {
      this.choosing = false;
      return this.act(r, c);
    }
    if (this.given[r][c]) return void sfx.tick();
    if (this.bed[r][c] !== null) return this.takeOut(r, c);
    this.choosing = true;
    sfx.bell(3 + this.selected * 2, 0.3);
  }

  /** The "watch me" demo: walk the ring to the tightest spot, open the packets, step to its flower and plant it. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    const p = out.players[0];
    p.active = true;
    this.botWait -= dt;
    const puzzle = this.puzzles[this.index];
    if (this.busy || this.finished || this.bee || !puzzle || this.botWait > 0) return out;
    this.botWait = 0.3;
    if (this.choosing) {
      const want = puzzle.solution[this.cursor.r][this.cursor.c]!;
      if (want === this.selected) p.action = true;
      else p.direction = (want - this.selected + this.n) % this.n <= this.n / 2 ? 0 : 2;
      return out;
    }
    const step = nextMove(this.bed, this.given, this.target(), this.plan.rule, this.selected);
    if (!step) return out;
    const { r, c } = this.cursor;
    if (step.c !== c) p.direction = step.c > c ? 0 : 2;
    else if (step.r !== r) p.direction = step.r > r ? 1 : 3;
    else p.action = true;
    if (!p.action) this.botWait = 0.2;
    return out;
  }

  destroy() {}

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hinted = null;
    this.flash = null;
    this.choosing = false;
    if (this.index >= this.puzzles.length) return void this.finale();
    const puzzle = this.puzzles[this.index];
    this.bed = copyBed(puzzle.start);
    // In Mend the bed every flower is hers to lift.
    this.given = puzzle.start.map((row) => row.map((v) => v !== null && !this.plan.mend));
    this.packets.children.slice(0, this.n).forEach((p, f) => {
      if (p.children.length > 1) p.removeChildren(1).forEach((old) => old.destroy({ children: true }));
      if (this.bee) {
        const stem = new Graphics();
        drawHeight(stem, 0, 35, f, 1, 0.92);
        p.addChild(stem);
      } else p.addChild(flowerArt(puzzle.kinds[f], PACKET * 1.25));
    });
    this.plants.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.nodes = this.bed.map((row, r) =>
      row.map((v, c) => (v === null ? null : this.addPlant(r, c, v, false))),
    );
    this.drawSoil();
    this.drawBeeView();
    this.board.alpha = 0;
    await this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.3 });
    this.busy = false;
    if (this.index > 0) return;
    if (this.bee) {
      if (this.sampleSide !== null) return this.ctx.instruct('rows.bee-sample');
      return this.ctx.instruct('rows.bee');
    }
    return this.ctx.instruct(
      this.plan.mend
        ? 'rows.mend'
        : this.rows === 1
          ? 'rows.one'
          : this.plan.rule === 'rows'
            ? 'rows.rows'
            : this.plan.rule === 'boxes'
              ? 'rows.boxes'
              : 'rows.both',
    );
  }

  private select(f: number) {
    if (this.busy || this.finished) return;
    this.selected = f;
    sfx.bell(3 + f * 2, 0.3);
  }

  private addPlant(r: number, c: number, flower: number, pop: boolean): Container {
    const node = this.bee ? new Container() : flowerArt(this.kind(flower), CELL * 0.82);
    if (this.bee) {
      const stem = new Graphics();
      drawHeight(stem, 0, 38, flower, 1, 0.93);
      node.addChild(stem);
    }
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
    g.roundRect(-14, -14, w + 28, this.rows * CELL + 28, 24)
      .fill(wood.light)
      .stroke({ width: 7, color: wood.line });
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.n; c++) {
        const planted = this.given[r]?.[c];
        g.roundRect(c * CELL + 5, r * CELL + 5, CELL - 10, CELL - 10, 16)
          .fill(planted ? swatch.brown.fill : swatch.brown.light)
          .stroke({ width: 3, color: swatch.brown.line });
        if (!planted)
          g.ellipse(c * CELL + CELL / 2, r * CELL + CELL / 2 + 6, 16, 8).fill({
            color: swatch.brown.line,
            alpha: 0.25,
          });
      }
    if (this.plan.rule !== 'boxes') return;
    // Hedge boxes: a low leafy hedge in the gaps between the boxes, bumpy so it reads as a hedge rather than a line.
    const b = boxSide(this.n);
    for (let k = b; k < this.n; k += b) {
      const at = k * CELL;
      g.roundRect(at - 9, -6, 18, w + 12, 9)
        .roundRect(-6, at - 9, w + 12, 18, 9)
        .fill(swatch.green.fill)
        .stroke({ width: 3, color: swatch.green.line });
      for (let t = 12; t < w; t += 24) g.circle(at, t, 7).circle(t, at, 7);
      g.fill(swatch.green.light);
    }
  }

  private tapBoard(e: FederatedPointerEvent) {
    if (this.busy || this.finished) return;
    const p = this.board.toLocal(e.global);
    const c = Math.floor(p.x / CELL);
    const r = Math.floor(p.y / CELL);
    if (r < 0 || c < 0 || r >= this.rows || c >= this.n) return;
    this.act(r, c);
  }

  /** A tap on a spot, or a planting from the couch's ring: a planted-to-start flower stays, hers comes out, an empty spot takes the chosen seeds. */
  private act(r: number, c: number) {
    if (this.given[r][c]) return void sfx.tick();
    if (this.bed[r][c] !== null) return this.takeOut(r, c);
    this.plant(r, c, this.selected);
  }

  /** Tapping a flower the child planted lifts it out again: taking back a guess is always allowed. */
  private takeOut(r: number, c: number) {
    this.bed[r][c] = null;
    const node = this.nodes[r][c];
    if (node) {
      this.ctx.tw.kill(node.scale);
      node.destroy({ children: true });
    }
    this.nodes[r][c] = null;
    if (this.hinted?.kind === 'fix' && this.hinted.r === r && this.hinted.c === c) this.hinted = null;
    sfx.pop(2);
    if (this.bee) this.reviseBee();
    const at = this.ctx.stage.toLocal(
      this.board.toGlobal({ x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 }),
    );
    this.ctx.particles.burst(at.x, at.y, {
      kind: 'dot',
      colors: [swatch.brown.light, 0xffffff],
      count: 6,
      speed: [40, 120],
      gravity: 0,
      life: [0.3, 0.5],
    });
  }

  private plant(r: number, c: number, flower: number) {
    const hit = clash(this.bed, this.plan.rule, r, c, flower);
    if (hit) {
      this.miss();
      this.flash = {
        cells: [
          { r, c },
          { r: hit.r, c: hit.c },
        ],
        color: swatch.red.fill,
        until: this.clock + 1.4,
      };
      const feedback = this.ctx.say(
        hit.by === 'row' ? 'rows.clash-row' : hit.by === 'column' ? 'rows.clash-col' : 'rows.clash-box',
        { flower: this.bee ? HEIGHTS[flower] + ' flower' : FLOWER_NAMES[this.kind(flower)] },
      );
      return this.maybeHint(feedback);
    }
    // Mend the bed starts with repeats, so a lifted swapped flower can leave a spot nothing fits: only a spot this planting closes counts.
    const before = this.plan.mend ? deadEnds(this.bed, this.plan.rule) : [];
    this.bed[r][c] = flower;
    this.nodes[r][c] = this.addPlant(r, c, flower, true);
    if (this.hinted && this.hinted.r === r && this.hinted.c === c) this.hinted = null;
    sfx.pop(4 + ((r + c) % 6));
    if (this.bee) return this.reviseBee();
    if (isFull(this.bed)) return void this.bloom();
    const stuck = deadEnds(this.bed, this.plan.rule).filter(
      (d) => !before.some((b) => b.r === d.r && b.c === d.c),
    );
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

  private maybeHint(feedback?: Promise<void>) {
    if (this.bee) {
      const turn = ++this.beeFeedback;
      if (this.wrongs >= 2 && !this.hinted && feedback)
        void feedback.then(() => {
          if (this.ctx.alive && turn === this.beeFeedback) this.showBeeHint();
        });
      return;
    }
    if (this.wrongs < 2 || this.hinted) return;
    const hint = hintFor(this.bed, this.given, this.target(), this.plan.rule);
    if (!hint) return;
    this.hinted = hint;
    this.hints++;
    this.wrongs = 0;
    void this.ctx.say(
      hint.kind === 'fix' ? (this.plan.mend ? 'rows.mend-hint' : 'rows.hint-fix') : 'rows.hint-plant',
    );
  }

  private drawBeeView() {
    if (!this.bee) return;
    const opened =
      this.activeGate === null ? null : inspectGate(this.bed, this.bee.puzzle.gates[this.activeGate]);
    const hint = this.heightHint;
    const gates = hint ? (hint.reason === 'cross' ? [hint.gate, hint.otherGate] : [hint.gate]) : [];
    const highlight = this.sight.clear();
    if (hint?.reason === 'cross' && this.activeGate !== null && gates.includes(this.activeGate)) {
      const other = this.activeGate === hint.gate ? hint.otherGate : hint.gate;
      for (const { r, c } of gateLine(this.bee.puzzle.gates[other]))
        highlight
          .roundRect(c * CELL + 16, r * CELL + 16, CELL - 32, CELL - 32, 12)
          .stroke({ color: swatch.orange.line, width: 4 });
    }
    opened?.line.forEach(({ r, c }, i) => {
      highlight
        .roundRect(c * CELL + 7, r * CELL + 7, CELL - 14, CELL - 14, 15)
        .fill({ color: swatch.teal.light, alpha: 0.35 })
        .stroke({ color: swatch.teal.line, width: i === 0 ? 6 : 3 });
    });
    const sample = this.sampleSide;
    this.board.visible = this.packets.visible = sample === null;
    this.bee.draw(
      sample === null ? (opened?.flowers ?? []) : this.bee.sampleLine(sample),
      this.activeGate,
      gates,
      !this.busy && isFull(this.bed),
      sample,
    );
  }

  private showSample(side: number) {
    if (!this.bee || this.sampleSide === null || this.busy) return;
    this.sampleSide = side;
    this.sampleVisits.add(side);
    this.drawBeeView();
    sfx.tick();
    void this.ctx.say(side === 0 ? 'rows.bee-sample-left' : 'rows.bee-sample-right');
  }

  private openGate(id: number) {
    if (!this.bee || this.busy || this.finished) return;
    this.beeFeedback++;
    this.activeGate = id;
    this.demoOpened = true;
    this.drawBeeView();
    sfx.tick();
    // Replaying a highlighted deduction never adds a second hint.
    const hint = this.heightHint;
    if (hint && (hint.gate === id || (hint.reason === 'cross' && hint.otherGate === id))) {
      this.sayBeeHint(hint);
      return;
    }
    const goal = this.bee.puzzle.gates[id].goal;
    void this.ctx.say('rows.bee-goal', { goal, flowers: goal === 1 ? 'flower' : 'flowers' });
  }

  private askBee() {
    if (!this.bee || this.busy || this.finished) return;
    if (this.sampleSide !== null) {
      this.sampleSide = null;
      this.resize(this.view);
      this.drawBeeView();
      void this.ctx.instruct('rows.bee');
      return;
    }
    const result = checkBeeBed(this.bed, this.bee.puzzle, this.rejected);
    if (result.kind === 'incomplete') return;
    if (result.kind === 'solved') return void this.bloom();
    if (result.fresh) this.miss();
    else sfx.tick();
    this.activeGate = result.gate;
    this.drawBeeView();
    const feedback = this.ctx.say('rows.bee-revise', {
      seen: result.count,
      goal: this.bee.puzzle.gates[result.gate].goal,
    });
    this.maybeHint(feedback);
  }

  private reviseBee() {
    this.beeFeedback++;
    if (this.bee && this.heightHint && !beeHintValid(this.bed, this.bee.puzzle, this.heightHint)) {
      this.heightHint = null;
      this.hinted = null;
    }
    this.drawBeeView();
  }

  sayWaitingAsk() {
    return this.showBeeHint();
  }

  private showBeeHint(): boolean {
    if (!this.bee || this.busy || this.finished || this.sampleSide !== null) return false;
    const hint = this.heightHint ?? beeHint(this.bed, this.bee.puzzle);
    if (!hint) return false;
    this.beeFeedback++;
    if (!this.heightHint) {
      this.hints++;
      this.wrongs = 0;
    }
    this.heightHint = this.hinted = hint;
    this.activeGate = hint.gate;
    this.drawBeeView();
    this.sayBeeHint(hint);
    return true;
  }

  private sayBeeHint(hint: BeeHint) {
    if (hint.kind === 'fix') {
      void this.ctx.say('rows.bee-lift');
      return;
    }
    const flower = HEIGHTS[hint.flower];
    switch (hint.reason) {
      case 'three':
        void this.ctx.say('rows.bee-three', { flower });
        break;
      case 'one':
        void this.ctx.say('rows.bee-one');
        break;
      case 'missing-row':
      case 'missing-column':
        void this.ctx.say('rows.bee-missing', {
          line: hint.reason === 'missing-row' ? 'row' : 'column',
          flower,
        });
        break;
      case 'line':
      case 'cross':
        void this.ctx.say(hint.reason === 'line' ? 'rows.bee-line' : 'rows.bee-cross', { flower });
        break;
    }
  }

  /** The bed is full and right: every flower blooms in turn. */
  private async bloom() {
    // The same check the rules use. Only Mend the bed can be full and still hold a repeat: the help on show stays, and the
    // pet repeats what to look for (no miss).
    if (!isSolved(this.bed, this.plan.rule)) return void this.ctx.say('rows.mend');
    this.busy = true;
    this.hinted = null;
    this.heightHint = null;
    this.flash = null;
    if (this.bee) {
      this.flight = this.clock;
      this.drawBeeView();
    }
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.n; c++) {
        const node = this.nodes[r][c];
        if (node)
          void this.ctx.tw
            .to(node.scale, { x: 1.18, y: 1.18 }, { duration: 0.12 })
            .then(() => this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.12 }));
        sfx.bell(3 + ((r + c) % 7), 0.2);
      }
      await this.ctx.tw.wait(0.12);
    }
    const mid = this.ctx.stage.toLocal(
      this.board.toGlobal({ x: (this.n * CELL) / 2, y: (this.rows * CELL) / 2 }),
    );
    this.ctx.particles.burst(mid.x, mid.y, {
      kind: 'star',
      colors: [0xffffff, 0xfff3a0, swatch.pink.light],
      count: 24,
      speed: [160, 380],
      gravity: 0,
      life: [0.6, 1],
    });
    this.ctx.pet.cheer();
    if (this.bee) await this.ctx.tw.wait(0.5);
    await this.ctx.say(this.bee ? 'rows.bee-solved' : 'rows.bloom');
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
    // On the couch, wrong plantings are the face-off score (lower is better).
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.misses });
  }
}

/** A little bed of nine flowers, no kind repeated in any row or column. */
function miniBed(size: number, cell: number): Container {
  const c = new Container();
  const n = 3;
  const w = n * cell;
  c.addChild(
    new Graphics()
      .roundRect(-w / 2 - 10, -w / 2 - 10, w + 20, w + 20, 18)
      .fill(wood.light)
      .stroke({ width: 6, color: wood.line }),
  );
  for (let r = 0; r < n; r++)
    for (let col = 0; col < n; col++) {
      c.addChild(
        new Graphics()
          .roundRect(-w / 2 + col * cell + 3, -w / 2 + r * cell + 3, cell - 6, cell - 6, 10)
          .fill(swatch.brown.light),
      );
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
  c.addChild(
    new Graphics().circle(0, 0, 78).fill(swatch.green.light).stroke({ width: 6, color: swatch.green.line }),
  );
  c.addChild(flowerArt(kind, 120));
  return c;
}

export const gardenRows: GameModule = {
  id: 'garden-rows',
  name: 'Garden Rows',
  titleLine: 'game.garden-rows',
  region: 'puzzle-peaks',
  challenge: 'logic',
  upright: true,
  skills: ['logic', 'deduction', 'patterns', 'spatial-reasoning'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'Point at a row and ask together: which flower is missing here?',
  offScreen: {
    all: 'Lay out three or four different toys in a grid so no kind repeats in any row or column, then take a few away for her to put back.',
    school:
      'Make a line of three block towers at different heights. Look along the line from each end and compare how many tops you can see.',
  },
  hubIcon: () => new RowsIcon(),
  touchDemo: true,
  sticker,
  entryLevels: [10],
  create: (ctx) => new GardenRows(ctx),
};
