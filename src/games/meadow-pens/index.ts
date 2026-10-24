import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { RAINBOW, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { CompanionRig } from '../../creatures/companion';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  bellArt, bubbleFrame, Card, drawGate, edgeLine, fencePiece, fieldPicture, flowerCell, loosePiece, meadowCell, penArt, pondCell,
  requestPicture, turfCell,
} from './art';
import {
  CELLS, cellAt, cellRect, centre, check, drawnRows, FenceHeap, fenceEdges, fieldCells, flowersOf, GAP, holes, makeTasks,
  meadowLayout, nextCell, PenTally, penOf, planFor, targetFor, type Cell, type FieldTask, type MeadowLayout, type PenTask,
  type Plan, type Task,
} from './logic';

const LEVELS: BandLevels = {
  school: { min: 1, max: 3 },
};

const FRIENDS = ['bunny', 'duck', 'pig', 'cat', 'dog', 'cow', 'bear'] as const;

class MeadowPens implements Game {
  readonly plan: Plan;
  readonly tasks: Task[];
  readonly tally = new PenTally();
  readonly heap = new FenceHeap();
  index = -1;
  busy = true;
  finished = false;
  /** Painted cells in paint order. */
  painted: Cell[] = [];
  private alive = true;
  private clock = 0;
  private view: View;
  private lay: MeadowLayout;
  private told = false;
  private fence = 0;
  /** The pen the hint glows while help is on. */
  private hintPen: Set<Cell> | null = null;
  /** The ghost finger's target for this pen, fixed once chosen so it never chases a moving goal. */
  private botPen: Set<Cell> | null = null;
  private pointer: number | null = null;
  private stroke: 'paint' | 'lift' = 'paint';
  private lastCell: Cell | null = null;
  private lastFlowerLine = -Infinity;
  /** Level 2: the field's cells are painted only by her taps and the fills, and the cards are live once the first row and column show. */
  private cardsLive = false;
  gateOpen = 0;
  private readonly friends: Critter[] = [];

  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly cellsArt = new Graphics();
  private readonly fenceArt = new Graphics();
  private readonly glow = new Graphics();
  private readonly flash = new Graphics();
  private readonly stackArt = new Graphics();
  private readonly gate = new Graphics();
  private readonly bell = bellArt();
  private readonly bubble = new Container();
  private bubbleArt: Container | null = null;
  private cards: Card[] = [];
  private friend: Critter | null = null;
  private readonly companion: CompanionRig;
  private readonly onCancel = () => this.endStroke();

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.tasks = makeTasks(this.plan, ctx.rng, ctx.demo ? 1 : this.plan.count);
    this.lay = meadowLayout(ctx.view, this.plan.level)!;
    this.backdrop = ctx.track(new Backdrop({ sky: [0xc4ecff, 0xfff6e0], hills: [0xf5d0e6, 0xbfe39a, 0x9ad77e], horizon: 0.22, clouds: 3, sun: true, seed: 131 }, ctx.view));
    for (const n of [this.cellsArt, this.fenceArt, this.glow, this.flash, this.stackArt, this.gate]) n.eventMode = 'none';
    this.board.addChild(this.cellsArt, this.glow, this.fenceArt, this.flash);
    this.board.eventMode = 'static';
    this.board.on('pointerdown', (e: FederatedPointerEvent) => this.down(e));
    this.board.on('globalpointermove', (e: FederatedPointerEvent) => { if (e.pointerId === this.pointer) this.move(e); });
    this.board.on('pointerup', (e: FederatedPointerEvent) => { if (e.pointerId === this.pointer) this.endStroke(); });
    this.board.on('pointerupoutside', (e: FederatedPointerEvent) => { if (e.pointerId === this.pointer) this.endStroke(); });
    window.addEventListener('pointercancel', this.onCancel, { capture: true });
    onTap(this.bell, () => void this.ring(), { cooldown: 500 });
    onTap(this.bubble, () => this.replay(), { cooldown: 800 });
    this.bell.visible = this.plan.level !== 2;
    this.companion = ctx.track(ctx.companion());
    this.companion.scale.set(0.42);
    this.companion.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.board, this.stackArt, this.gate, this.bell, this.bubble, this.companion);
  }

  start() {
    this.layout();
    void this.nextTask();
  }

  destroy() {
    this.alive = false;
    window.removeEventListener('pointercancel', this.onCancel, { capture: true });
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.endStroke();
    this.layout();
  }

  get task(): Task {
    return this.tasks[this.index];
  }

  private get request() {
    return (this.task as PenTask).request;
  }

  private get field() {
    return (this.task as FieldTask).field;
  }

  private layout() {
    this.lay = meadowLayout(this.view, this.plan.level) ?? this.lay;
    const l = this.lay;
    const g = l.grid;
    this.board.hitArea = new Rectangle(g.x - GAP, g.y - GAP, g.cols * g.pitch + GAP, g.rows * g.pitch + GAP);
    const bell = centre(l.bell);
    this.bell.position.set(bell.x, bell.y);
    this.bell.hitArea = new Rectangle(-l.bell.w / 2, -l.bell.h / 2, l.bell.w, l.bell.h);
    const b = centre(l.bubble);
    this.bubble.position.set(b.x, b.y);
    this.bubble.hitArea = new Rectangle(-l.bubble.w / 2, -l.bubble.h / 2, l.bubble.w, l.bubble.h);
    this.companion.position.set(l.companion.x, l.companion.y);
    this.placeFriend();
    this.cards.forEach((c, i) => {
      const r = centre(l.cards![i]);
      c.position.set(r.x, r.y);
    });
    this.redraw();
  }

  private placeFriend() {
    if (!this.friend || this.busy) return;
    const r = this.lay.friend;
    this.friend.position.set(r.x + r.w / 2, r.y + r.h - 6);
  }

  update(dt: number) {
    this.clock += dt;
    if (this.index >= 0) drawGate(this.gate, this.lay.gate, this.gateOpen);
    for (const c of this.cards) c.glow(this.tally.glowing && c.value === this.field?.right && !this.finished, this.clock);
    const g = this.glow.clear();
    if (this.hintPen && !this.finished) {
      const a = 0.45 + 0.3 * Math.sin(this.clock * 6);
      for (const c of this.hintPen) {
        const r = cellRect(this.lay, c);
        g.roundRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8, 16).stroke({ width: 7, color: 0xffe14a, alpha: a });
      }
    }
  }

  // ----- tasks -----

  private async nextTask() {
    this.busy = true;
    this.index++;
    if (this.index >= this.tasks.length) return this.finale();
    this.tally.next();
    this.painted = [];
    this.hintPen = null;
    this.botPen = null;
    this.cardsLive = false;
    this.gateOpen = 0;
    this.fence = 0;
    this.setBubble();
    this.makeCards();
    this.redraw();
    await this.bringFriend();
    if (!this.alive) return;
    if (!this.told) {
      this.told = true;
      await this.ctx.instruct(`meadow.instruct.${this.plan.level}` as 'meadow.instruct.1');
      if (!this.alive) return;
    }
    if (this.task.kind === 'field') {
      await this.ctx.say('meadow.field-ask');
      if (!this.alive) return;
      await this.startField();
      return;
    }
    this.busy = false;
    void this.askAloud();
  }

  private askAloud() {
    if (this.task.kind === 'field') return this.ctx.say('meadow.field-ask');
    const r = this.request;
    return r.fence === undefined ? this.ctx.say('meadow.ask', { n: r.squares }) : this.ctx.say('meadow.ask3', { n: r.fence });
  }

  /** A tap on the friend or the bubble: the request again, free. */
  private replay() {
    if (this.finished || this.index < 0) return;
    this.friend?.poke();
    void this.askAloud();
  }

  private setBubble() {
    this.bubbleArt?.destroy({ children: true });
    const l = this.lay.bubble;
    const c = new Container();
    c.addChild(bubbleFrame(l.w, l.h));
    c.addChild(this.task.kind === 'field' ? fieldPicture() : requestPicture(this.request.squares, this.request.fence));
    c.eventMode = 'none';
    this.bubbleArt = c;
    this.bubble.addChild(c);
  }

  private makeCards() {
    for (const c of this.cards) c.destroy({ children: true });
    this.cards = [];
    if (this.task.kind !== 'field') return;
    this.task.cards.forEach((value, i) => {
      const card = new Card(value);
      const r = centre(this.lay.cards![i]);
      card.position.set(r.x, r.y);
      card.hitArea = new Rectangle(-65, -65, 130, 130);
      card.alpha = 0.5;
      onTap(card, () => void this.pickCard(card), { cooldown: 400 });
      this.cards.push(card);
      this.ctx.stage.addChild(card);
    });
  }

  private async bringFriend() {
    const old = this.friend;
    if (old) {
      void this.ctx.tw.to(old, { alpha: 0 }, { duration: 0.3 }).then(() => { if (!old.destroyed) { this.ctx.untrack(old); old.destroy({ children: true }); } });
    }
    const rng = new Rng(this.index * 7919 + this.plan.level * 31 + (this.tasks.length > 1 ? 3 : 0));
    const kind = this.index === 0 ? 'bunny' : rng.pick([...FRIENDS]);
    const f = this.ctx.track(new Critter(CRITTERS[kind]));
    f.scale.set(0.42);
    const r = this.lay.friend;
    f.position.set(this.view.w + 120, r.y + r.h - 6);
    const hit = new Rectangle(-150, -320, 300, 330);
    f.hitArea = hit;
    onTap(f, () => this.replay(), { cooldown: 800 });
    this.friend = f;
    this.friends.push(f);
    this.ctx.stage.addChild(f);
    sfx.whoosh();
    await this.ctx.tw.to(f, { x: r.x + r.w / 2 }, { duration: 0.6, ease: ease.outBack });
  }

  // ----- the paint gesture -----

  private local(e: FederatedPointerEvent) {
    return this.ctx.stage.toLocal(e.global);
  }

  private down(e: FederatedPointerEvent) {
    if (this.busy || this.finished || this.pointer !== null || palmOnGlass()) return;
    const p = this.local(e);
    const cell = cellAt(this.lay, p.x, p.y);
    if (cell === null) return;
    if (this.task.kind === 'field') return this.tapField(cell);
    this.pointer = e.pointerId;
    this.stroke = this.painted.includes(cell) ? 'lift' : 'paint';
    this.lastCell = cell;
    this.apply(cell);
  }

  private move(e: FederatedPointerEvent) {
    if (this.busy || this.finished) return this.endStroke();
    const p = this.local(e);
    const cell = cellAt(this.lay, p.x, p.y);
    if (cell === null || cell === this.lastCell) return;
    this.lastCell = cell;
    this.apply(cell);
  }

  private endStroke() {
    this.pointer = null;
    this.lastCell = null;
  }

  /** Paint or lift one cell, as the stroke began. */
  private apply(cell: Cell) {
    const on = this.painted.includes(cell);
    if (this.stroke === 'paint' && !on) {
      this.painted.push(cell);
      const pen = penOf(this.painted);
      if (pen.has(cell)) {
        sfx.bell(Math.min(12, 2 + pen.size));
        const r = centre(cellRect(this.lay, cell));
        this.ctx.particles.burst(r.x, r.y, { kind: 'dot', colors: [0x7fcf5f, 0xbfe39a], count: 8, speed: [60, 160], gravity: 200, life: [0.3, 0.5] });
      } else if (this.clock - this.lastFlowerLine > 3) {
        this.lastFlowerLine = this.clock;
        sfx.pop(9);
        void this.ctx.say('meadow.flower');
      }
    } else if (this.stroke === 'lift' && on) {
      this.painted = this.painted.filter((c) => c !== cell);
      sfx.pluck(3);
    } else return;
    this.changed();
  }

  private changed() {
    const pen = penOf(this.painted);
    const fence = fenceEdges(pen).length;
    if (fence > this.fence) sfx.tick();
    this.fence = fence;
    if (this.plan.level === 1 && this.heap.use(fence)) sfx.whoosh();
    if (this.tally.glowing && this.task.kind === 'pen') this.hintPen = targetFor(pen, this.request);
    this.redraw();
  }

  // ----- drawing -----

  private redraw() {
    if (this.index < 0 || !this.task) return;
    const g = this.cellsArt.clear();
    const f = this.fenceArt.clear();
    const l = this.lay;
    const field = this.task.kind === 'field';
    const pen = field ? new Set(this.painted) : penOf(this.painted);
    const flowers = new Set(field ? [] : flowersOf(this.painted, pen));
    const ponds = new Set(field ? [] : holes(pen));
    for (let c = 0; c < CELLS; c++) {
      const r = cellRect(l, c);
      if (pen.has(c)) turfCell(g, r, c);
      else if (flowers.has(c)) flowerCell(g, r, c);
      else if (ponds.has(c)) pondCell(g, r);
      else meadowCell(g, r);
    }
    // The fence: around the pen; at level 2, around the whole field from the start.
    const edges = fenceEdges(field ? new Set(fieldCells(this.field)) : pen);
    const want = !field ? this.request.fence : undefined;
    edges.forEach((e, i) => fencePiece(f, edgeLine(cellRect(l, e.cell), e.side, GAP), want !== undefined && i >= want));
    this.drawStack(edges.length);
    drawGate(this.gate, l.gate, this.gateOpen);
  }

  /** Levels 1: a free heap with no number; level 3: the counted stack, a dot per piece, empty when the pen needs more. */
  private drawStack(used: number) {
    const g = this.stackArt.clear();
    const r = this.lay.stack;
    if (!r || this.task.kind !== 'pen') return;
    g.roundRect(r.x, r.y, r.w, r.h, 22).fill({ color: 0xffffff, alpha: 0.55 }).stroke({ width: 4, color: 0xbfe0a8 });
    const want = this.request.fence;
    if (want === undefined) {
      const left = Math.min(40, this.heap.left(used));
      for (let i = 0; i < left; i++) {
        const row = Math.floor(i / 10);
        loosePiece(g, r.x + 40 + (i % 10) * ((r.w - 80) / 9) + (row % 2) * 8, r.y + r.h - 26 - row * 22, 40, (((i * 37) % 9) - 4) * 0.05);
      }
      return;
    }
    const step = Math.min(34, (r.w - 40) / want);
    const x0 = r.x + r.w / 2 - ((want - 1) * step) / 2;
    const left = Math.max(0, want - used);
    for (let i = 0; i < want; i++) {
      const x = x0 + i * step;
      if (i < left) loosePiece(g, x, r.y + r.h / 2 - 10, 60, Math.PI / 2);
      g.circle(x, r.y + r.h - 18, 6).fill(i < left ? 0x2b2b3a : 0xcfd8c4);
    }
  }

  private async flashCell(c: Cell) {
    const r = cellRect(this.lay, c);
    const g = this.flash.clear();
    g.roundRect(r.x, r.y, r.w, r.h, 14).fill({ color: 0xffffff, alpha: 0.6 });
    await this.ctx.tw.wait(0.18);
    if (this.alive) this.flash.clear();
  }

  // ----- the bell -----

  private async ring() {
    if (this.busy || this.finished || this.task?.kind !== 'pen') return;
    this.endStroke();
    sfx.bell(10, 0.35);
    void this.ctx.tw.to(this.bell, { rotation: 0.25 }, { duration: 0.08 }).then(() => { if (this.alive) void this.ctx.tw.to(this.bell, { rotation: 0 }, { duration: 0.2, ease: ease.outBack }); });
    const pen = penOf(this.painted);
    const verdict = check(pen, this.request);
    if (verdict.kind !== 'ok' && this.tally.glowing && this.hintPen) return this.supported();
    const result = this.tally.ring(verdict);
    if (result === 'invite') { void this.ctx.say('meadow.empty'); return; }
    if (result === 'ok') return this.complete();
    this.busy = true;
    sfx.boing();
    this.companion.wiggle();
    if (verdict.kind === 'squares') {
      const cells = [...pen].sort((a, b) => a - b);
      for (let k = 0; k < cells.length; k++) {
        void this.flashCell(cells[k]);
        await this.ctx.say('count', { n: k + 1 });
        if (!this.alive) return;
      }
      await this.ctx.say('meadow.count', { have: verdict.have, want: verdict.want });
    } else if (verdict.kind === 'fence') {
      await this.countFence(verdict.have);
      if (!this.alive) return;
      const k = Math.abs(verdict.want - verdict.have);
      await this.ctx.say(verdict.have < verdict.want ? 'meadow.fence-left' : 'meadow.fence-more', { have: verdict.have, k });
    }
    if (!this.alive) return;
    if (result === 'glow') {
      this.hintPen = targetFor(penOf(this.painted), this.request);
      await this.ctx.say('meadow.hint');
    }
    if (this.alive) this.busy = false;
  }

  /** The fence counts itself: each piece lights in turn with a wooden tick. */
  private async countFence(n: number) {
    const edges = fenceEdges(penOf(this.painted));
    for (let i = 0; i < Math.min(n, edges.length); i++) {
      const [x1, y1, x2, y2] = edgeLine(cellRect(this.lay, edges[i].cell), edges[i].side, GAP);
      this.flash.clear().moveTo(x1, y1).lineTo(x2, y2).stroke({ width: 16, color: 0xffffff, alpha: 0.8, cap: 'round' });
      sfx.tick();
      await this.ctx.tw.wait(0.16);
      if (!this.alive) return;
    }
    this.flash.clear();
  }

  /** Help is on and the bell rang: the glowing pen paints itself, lifting extra cells, then the pen completes. */
  private async supported() {
    this.busy = true;
    const target = this.hintPen!;
    for (let next = nextCell(this.painted, target); next !== null; next = nextCell(this.painted, target)) {
      if (this.painted.includes(next)) { this.painted = this.painted.filter((c) => c !== next); sfx.pluck(3); }
      else { this.painted.push(next); sfx.bell(Math.min(12, 2 + this.painted.length)); }
      this.changed();
      await this.ctx.tw.wait(0.22);
      if (!this.alive) return;
    }
    return this.complete();
  }

  /** The gate opens, the friend hops into the pen and the flowers bloom. */
  private async complete() {
    this.busy = true;
    this.hintPen = null;
    const f = this.friend!;
    await this.ctx.tw.to(this as { gateOpen: number }, { gateOpen: 1 }, { duration: 0.3 });
    if (!this.alive) return;
    const cells = this.task.kind === 'field' ? fieldCells(this.field) : [...penOf(this.painted)];
    const spot = cells.map((c) => centre(cellRect(this.lay, c))).reduce((a, b) => ({ x: a.x + b.x / cells.length, y: a.y + b.y / cells.length }), { x: 0, y: 0 });
    const startY = f.y;
    await this.ctx.tw.to(f, { x: (f.x + spot.x) / 2, y: Math.min(startY, spot.y) - 120 }, { duration: 0.3, ease: ease.outQuad });
    if (!this.alive) return;
    await this.ctx.tw.to(f, { x: spot.x, y: spot.y + 40 }, { duration: 0.3, ease: ease.inQuad });
    if (!this.alive) return;
    f.cheer();
    this.companion.cheer();
    this.ctx.pet.cheer();
    sfx.sparkle();
    this.ctx.particles.burst(spot.x, spot.y, { kind: 'star', colors: [0xffd54a, 0xffffff], count: 14, speed: [120, 300], gravity: 0, life: [0.5, 0.9] });
    await this.ctx.say(this.task.kind === 'field' ? 'meadow.field-in' : 'meadow.in');
    if (!this.alive) return;
    await this.ctx.tw.wait(0.6);
    if (!this.alive) return;
    void this.nextTask();
  }

  // ----- level 2: fields and cards -----

  /** The field's first row, then the rest of its first column, paint themselves with a count; then the cards wake. */
  private async startField() {
    const rows = drawnRows(this.field, this.lay.tall);
    const first = [...rows[0], ...rows.slice(1).map((r) => r[0])];
    for (const c of first) {
      if (!this.painted.includes(c)) this.painted.push(c);
      sfx.bell(Math.min(12, 2 + this.painted.length));
      this.redraw();
      void this.flashCell(c);
      await this.ctx.say('count', { n: this.painted.length });
      if (!this.alive) return;
    }
    this.cardsLive = true;
    for (const c of this.cards) c.alpha = 1;
    this.busy = false;
  }

  /** A tap on a field square paints it and says the running number: a free counting aid. */
  private tapField(c: Cell) {
    if (!fieldCells(this.field).includes(c) || this.painted.includes(c)) return;
    this.painted.push(c);
    sfx.bell(Math.min(12, 2 + this.painted.length));
    this.redraw();
    void this.ctx.say('count', { n: this.painted.length });
  }

  private async pickCard(card: Card) {
    if (this.busy || this.finished || !this.cardsLive) return;
    this.busy = true;
    const right = card.value === this.field.right;
    const result = this.tally.card(right);
    if (result === 'ok') {
      sfx.bell(8, 0.3);
      await this.fill(false);
      if (!this.alive) return;
      return this.complete();
    }
    sfx.boing();
    this.companion.wiggle();
    void this.ctx.tw.to(card, { rotation: 0.1 }, { duration: 0.08 }).then(() => { if (this.alive) void this.ctx.tw.to(card, { rotation: 0 }, { duration: 0.2 }); });
    await this.fill(true);
    if (!this.alive) return;
    if (result === 'glow') await this.ctx.say('meadow.hint-card');
    if (this.alive) this.busy = false;
  }

  /** The field fills row by row; `aloud` counts each row's running total ("three, six"). */
  private async fill(aloud: boolean) {
    const rows = drawnRows(this.field, this.lay.tall);
    let total = 0;
    for (const row of rows) {
      for (const c of row) if (!this.painted.includes(c)) this.painted.push(c);
      total += row.length;
      this.redraw();
      sfx.bell(Math.min(12, 2 + rows.indexOf(row) * 2));
      if (aloud) await this.ctx.say('count', { n: total });
      else await this.ctx.tw.wait(0.18);
      if (!this.alive) return;
    }
  }

  // ----- finishing -----

  private async finale() {
    this.finished = true;
    this.busy = true;
    this.hintPen = null;
    for (const c of this.cards) c.visible = false;
    this.painted = [];
    this.redraw();
    const colors = RAINBOW.map((c) => swatch[c].fill);
    this.ctx.particles.burst(this.view.w / 2, this.view.h * 0.3, { kind: 'confetti', colors, count: 60, speed: [200, 600], gravity: 600, life: [1.2, 2] });
    // Every friend of the round comes out to play on the meadow, with a little bell tune.
    const g = this.lay.grid;
    const live = this.friends.filter((f) => !f.destroyed);
    this.friends.forEach((f, i) => {
      if (f.destroyed) {
        const kind = i === 0 ? 'bunny' : FRIENDS[(i * 3) % FRIENDS.length];
        const again = this.ctx.track(new Critter(CRITTERS[kind]));
        again.scale.set(0.42);
        this.ctx.stage.addChild(again);
        live.push(again);
      }
    });
    live.forEach((f, i) => {
      f.alpha = 1;
      f.position.set(g.x + ((i + 1) * (g.cols * g.pitch)) / (live.length + 1), g.y + g.rows * g.pitch * 0.7);
      f.cheer();
    });
    for (const s of [5, 7, 9, 10, 12]) {
      sfx.bell(s);
      await this.ctx.tw.wait(0.22);
      if (!this.alive) return;
    }
    sfx.tada();
    await this.ctx.say('meadow.all');
    if (!this.alive) return;
    await this.ctx.tw.wait(0.6);
    if (this.alive) this.ctx.finish({ misses: this.tally.misses, hints: this.tally.hints });
  }

  // ----- pause sheet and ghost finger -----

  /** Show a hint: the glowing pen (level 2: the right card), counting a hint once for this pen. */
  askForHint() {
    if (this.busy || this.finished || !this.task) return;
    this.tally.glow();
    if (this.task.kind === 'field') { void this.ctx.say('meadow.hint-card'); return; }
    this.hintPen = targetFor(penOf(this.painted), this.request);
    void this.ctx.say('meadow.hint');
  }

  /** Start again: this pen's grass and flowers clear (level 2: back to the first row and column); misses and hints stay. */
  restart() {
    if (this.busy || this.finished || !this.task) return;
    this.endStroke();
    if (this.task.kind === 'field') {
      const rows = drawnRows(this.field, this.lay.tall);
      this.painted = [...rows[0], ...rows.slice(1).map((r) => r[0])];
    } else this.painted = [];
    this.botPen = null;
    this.changed();
  }

  /** The ghost finger: paint the pen a square at a time and ring; at level 2, tap the right card. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.task || this.pointer !== null) return null;
    if (this.task.kind === 'field') {
      const card = this.cards.find((c) => c.value === this.field.right);
      return this.cardsLive && card ? { tap: { on: card } } : null;
    }
    this.botPen ??= targetFor(penOf(this.painted), this.request);
    const next = nextCell(this.painted, this.botPen);
    if (next === null) return { tap: { on: this.bell } };
    const c = centre(cellRect(this.lay, next));
    return { tap: { on: this.board, x: c.x, y: c.y }, pause: 0.25 };
  }
}

class MeadowIcon extends WigglyIcon {
  constructor() {
    const art = penArt([[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]], 50);
    super(art);
  }
}

const SHAPES: [number, number][][] = [
  [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]],
  [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1]],
  [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
];

/** A seeded pen with its fence and a flower. */
function sticker(seed: number): Container {
  const c = penArt(new Rng(seed).pick(SHAPES), 52);
  c.scale.set(1.1);
  return c;
}

export const meadowPens: GameModule = {
  id: 'meadow-pens',
  name: 'Meadow Pens',
  titleLine: 'game.meadow-pens',
  region: 'rainbow-meadow',
  skills: ['area', 'perimeter', 'arrays', 'spatial-reasoning'],
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.stickers,
  touchDemo: true,
  coplayHint: 'Take turns: one of you names a number and the other paints a pen that size with {name}; then swap, and count the fence together.',
  offScreen: 'Cover a placemat with sticky notes and count them, then run a finger round the edge and count the sides you pass.',
  hubIcon: () => new MeadowIcon(),
  sticker,
  create: (ctx) => new MeadowPens(ctx),
};
