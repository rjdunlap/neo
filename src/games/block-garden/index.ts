import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch, type Swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { againIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { GARDENS } from './puzzles';
import {
  apply, decode, FIRST_GARDEN, fits, gardenLayout, goalMet, has, hintPlacement, makeGarden, nearestAnchor, place, placements,
  planFor, RIDE, search, SHAPES, startState, transformGarden, trayIndex, trayNow, TRAY_CELL, type Anchor, type Family, type Garden,
  type GardenLayout, type GardenPlan, type Placement, type State,
} from './logic';

const LEVELS: BandLevels = {
  prek: { min: 1, max: 3 },
  school: { min: 2, max: 6 },
  grownup: { min: 5, max: 8 },
};

/** The bloom: taps are ignored while the flowers open. */
const BLOOM = 0.5;
/** The search that looks for a dead end after each planting stays small; the hint's is bigger. */
const DEAD_END_CAP = 4_000;
/** Each line's flowers ring up a pentatonic run (marimba steps through `sfx`, from `src/audio/notes.ts`). */
const RUN = [5, 7, 8, 9, 11, 12, 14, 15];

/** Each family's colour and pattern, so pieces in a tray differ by shape and pattern, never by colour alone. */
const LOOK: Record<Family, { sw: Swatch; pattern: 'dots' | 'stripes' | 'rings' | 'plain' | 'cross' | 'leaf' }> = {
  mono: { sw: swatch.pink, pattern: 'dots' },
  domino: { sw: swatch.blue, pattern: 'stripes' },
  I3: { sw: swatch.orange, pattern: 'rings' },
  corner3: { sw: swatch.purple, pattern: 'dots' },
  square2: { sw: swatch.yellow, pattern: 'cross' },
  I4: { sw: swatch.teal, pattern: 'stripes' },
  L4: { sw: swatch.red, pattern: 'leaf' },
  J4: { sw: swatch.pink, pattern: 'leaf' },
  T4: { sw: swatch.green, pattern: 'rings' },
  S4: { sw: swatch.blue, pattern: 'dots' },
  Z4: { sw: swatch.orange, pattern: 'cross' },
  I5: { sw: swatch.purple, pattern: 'stripes' },
  corner5: { sw: swatch.teal, pattern: 'plain' },
  square3: { sw: swatch.red, pattern: 'rings' },
};

const SOIL = { fill: 0x9a6b47, line: 0x6e4a30, light: 0xb8865e };
const STONE = { fill: 0xb9b6ad, line: 0x7d7a72 };

/** One seed-tray square of a piece, `s` units across, its top-left at (x, y). */
function seedSquare(g: Graphics, x: number, y: number, s: number, family: Family) {
  const { sw, pattern } = LOOK[family];
  const pad = s * 0.05;
  g.roundRect(x + pad, y + pad, s - 2 * pad, s - 2 * pad, s * 0.16).fill(sw.fill).stroke({ width: Math.max(2, s * 0.05), color: sw.line });
  const cx = x + s / 2, cy = y + s / 2, k = s / 100;
  switch (pattern) {
    case 'dots':
      for (const [dx, dy] of [[-18, -18], [18, -18], [-18, 18], [18, 18]]) g.circle(cx + dx * k, cy + dy * k, 7 * k).fill(sw.light);
      break;
    case 'stripes':
      for (const d of [-20, 0, 20]) g.roundRect(cx - 28 * k, cy + d * k - 4 * k, 56 * k, 8 * k, 4 * k).fill(sw.light);
      break;
    case 'rings':
      g.circle(cx, cy, 22 * k).stroke({ width: 7 * k, color: sw.light });
      break;
    case 'cross':
      g.roundRect(cx - 5 * k, cy - 26 * k, 10 * k, 52 * k, 5 * k).fill(sw.light).roundRect(cx - 26 * k, cy - 5 * k, 52 * k, 10 * k, 5 * k).fill(sw.light);
      break;
    case 'leaf':
      g.ellipse(cx, cy, 12 * k, 24 * k).fill(sw.light);
      break;
    default:
      g.circle(cx, cy, 9 * k).fill(sw.light);
  }
}

/** A piece drawn centred on (0, 0) at `cell` units per square. */
function pieceArt(shapeId: string, cell: number): Graphics {
  const s = SHAPES[shapeId];
  const g = new Graphics();
  for (const [r, c] of s.cells) seedSquare(g, c * cell - (s.w * cell) / 2, r * cell - (s.h * cell) / 2, cell, s.family);
  return g;
}

function flowerArt(g: Graphics, x: number, y: number, size: number, color: number) {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.circle(x + Math.cos(a) * size * 0.45, y + Math.sin(a) * size * 0.45, size * 0.32).fill(color);
  }
  g.circle(x, y, size * 0.28).fill(swatch.yellow.fill).stroke({ width: 2, color: swatch.yellow.line });
}

const PETALS = [swatch.pink.fill, swatch.red.fill, swatch.purple.fill, swatch.orange.fill, swatch.blue.fill];

interface Slot {
  carrier: Container;
  art: Container;
  handle: DragHandle;
  /** The piece in this slot now, or null when it is empty. */
  piece: number | null;
}

class BlockGarden implements Game {
  readonly plan: GardenPlan;
  gardens: Garden[] = [];
  index = -1;
  garden!: Garden;
  state!: State;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** The placement the glow suggests, until she plants. */
  hinted: Placement | null = null;
  /** Where a carried piece would land, if anywhere. */
  shadow: { piece: number; at: Anchor } | null = null;

  private lay!: GardenLayout;
  private readonly root = new Container();
  private readonly bedArt = new Graphics();
  private readonly shadowArt = new Graphics();
  private readonly glow = new Graphics();
  private readonly packets = new Graphics();
  private readonly basket = new Graphics();
  private readonly undoButton: RoundButton;
  private slots: Slot[] = [];
  private history: State[] = [];
  private gardenMisses = 0;
  private sinceHint = 0;
  private clock = 0;
  private undoPulse = 0;
  private told = false;
  private carrying: number | null = null;
  /** The system took the touch away, or the screen changed size mid-carry: the drag that ends puts the piece back. */
  private cancelled = false;
  private readonly onCancel = () => { this.cancelled = true; };
  private botPlan: { key: string; path: Placement[] | null } | null = null;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    const count = ctx.demo ? 1 : this.plan.gardens;
    for (let i = 0; i < count; i++) this.gardens.push(this.pickGarden(i));
    this.glow.eventMode = 'none';
    this.shadowArt.eventMode = 'none';
    this.packets.eventMode = 'none';
    this.basket.eventMode = 'none';
    this.bedArt.eventMode = 'none';
    this.undoButton = new RoundButton(againIcon(), swatch.white, 54, () => this.undo());
    this.undoButton.alpha = 0.35;
    this.root.addChild(this.bedArt, this.shadowArt, this.packets, this.basket, this.glow, this.undoButton);
    ctx.stage.addChild(this.root);
    for (let i = 0; i < 3; i++) this.slots.push(this.makeSlot(i));
    window.addEventListener('pointercancel', this.onCancel, { capture: true });
  }

  private pickGarden(i: number): Garden {
    const { plan, ctx } = this;
    if (plan.id === 1 && i === 0) return decode(FIRST_GARDEN, plan);
    if (plan.id <= 4) return makeGarden(plan, ctx.rng).garden;
    const list = GARDENS[plan.id];
    return transformGarden(decode(ctx.rng.pick(list), plan), ctx.rng.int(0, 7));
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    this.lay = gardenLayout(this.plan, v);
    this.undoButton.position.set(this.lay.undo.x, this.lay.undo.y);
    if (this.carrying !== null) this.cancelled = true;
    this.slots.forEach((s, i) => this.placeSlot(s, i));
    this.drawBasket(v);
    if (this.garden) this.drawBed();
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    this.undoButton.scale.set(this.undoPulse > 0 ? 1 + 0.08 * Math.sin(this.clock * 8) : 1);
    if (this.undoPulse > 0) {
      this.undoPulse -= dt;
      g.circle(this.undoButton.x, this.undoButton.y, 62 + 3 * Math.sin(this.clock * 6)).stroke({ width: 6, color: swatch.yellow.fill });
    }
    this.drawShadow();
    if (this.busy || this.finished || !this.hinted) return;
    // The hint: its piece glows in its slot and its shadow waits on the bed.
    const slot = this.slots.find((s) => s.piece === this.hinted!.piece);
    if (slot) {
      const r = this.lay.slots[this.slots.indexOf(slot)];
      g.roundRect(r.x + 6, r.y + 6, r.w - 12, r.h - 12, 26).stroke({ width: 6 + 2 * Math.sin(this.clock * 6), color: swatch.yellow.fill });
    }
  }

  destroy() {
    window.removeEventListener('pointercancel', this.onCancel, { capture: true });
    for (const s of this.slots) s.handle.destroy();
  }

  restart() {
    if (this.finished || !this.garden) return;
    this.state = startState(this.garden);
    this.history = [];
    this.hinted = null;
    this.undoPulse = 0;
    this.undoButton.alpha = 0.35;
    this.refresh();
  }

  /** The ghost finger: carry the piece of the next placement in a shortest way from here and land its shadow on that spot. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.garden || this.carrying !== null) return null;
    const key = this.key();
    if (this.botPlan?.key !== key) {
      const hint = hintPlacement(this.garden, this.state, this.history);
      this.botPlan = { key, path: hint.kind === 'plan' ? [hint.placement] : null };
    }
    const next = this.botPlan.path?.[0];
    if (!next) return null;
    const slot = this.slots.find((s) => s.piece === next.piece);
    if (!slot) return null;
    const s = SHAPES[this.garden.pieces[next.piece]];
    const { x, y, cell } = this.lay;
    return {
      drag: { on: slot.carrier },
      to: { on: this.root, x: x + (next.c + s.w / 2) * cell, y: y + (next.r + s.h / 2) * cell },
      lift: this.liftFor(next.piece),
      pause: 0.3,
    };
  }

  /* -------------------------------------------------------------------------------------------- */

  private key() {
    return `${this.index}:${this.state.bed.filled.join(',')}:${this.state.used}`;
  }

  private async next() {
    this.busy = true;
    this.index++;
    if (this.index >= this.gardens.length) return void this.finale();
    this.garden = this.gardens[this.index];
    this.state = startState(this.garden);
    this.history = [];
    this.hinted = null;
    this.gardenMisses = 0;
    this.sinceHint = 0;
    this.undoButton.alpha = 0.35;
    this.refresh();
    this.root.alpha = 0;
    await this.ctx.tw.to(this.root, { alpha: 1 }, { duration: 0.3 });
    this.busy = false;
    if (this.told) return;
    this.told = true;
    await this.ctx.instruct(this.plan.goal === 'clear' ? 'block-garden.instruct-clear' : 'block-garden.instruct');
    if (this.plan.id === 3) await this.ctx.say('block-garden.two-lines');
  }

  /** Redraw the bed and fill the slots from the tray in front of her. */
  private refresh() {
    this.drawBed();
    const tray = trayNow(this.garden, this.state.used);
    const start = trayIndex(this.garden, this.state.used) * this.garden.traySize;
    this.slots.forEach((slot, i) => {
      const piece = start + i;
      slot.piece = piece < this.garden.pieces.length && tray.includes(piece) ? piece : null;
      slot.art.removeChildren().forEach((c) => c.destroy());
      if (slot.piece !== null) slot.art.addChild(pieceArt(this.garden.pieces[slot.piece], this.lay.cell));
      slot.art.scale.set(TRAY_CELL / this.lay.cell);
      slot.carrier.visible = slot.piece !== null;
      slot.handle.enabled = slot.piece !== null;
    });
    this.drawPackets();
  }

  private makeSlot(i: number): Slot {
    const carrier = new Container();
    const art = new Container();
    art.eventMode = 'none';
    carrier.addChild(art);
    carrier.hitArea = new Rectangle(-90, -90, 180, 180);
    this.root.addChild(carrier);
    const handle = draggable(carrier, this.ctx.tw, {
      lift: 0,
      onPick: () => this.pick(i),
      onMove: () => this.carry(i),
      onDrop: () => this.drop(i),
    });
    return { carrier, art, handle, piece: null };
  }

  private placeSlot(s: Slot, i: number) {
    const r = this.lay.slots[i];
    this.ctx.tw.kill(s.carrier);
    s.carrier.position.set(r.x + r.w / 2, r.y + r.h / 2);
    s.handle.home = { x: s.carrier.x, y: s.carrier.y };
    s.art.scale.set(TRAY_CELL / this.lay.cell);
    // A tray piece is drawn at the tray's size; the art is re-made at the bed's size when the layout's square size changes.
    if (s.piece !== null && this.garden) {
      s.art.removeChildren().forEach((c) => c.destroy());
      s.art.addChild(pieceArt(this.garden.pieces[s.piece], this.lay.cell));
    }
  }

  /** How far above the finger a piece's middle rides, so its bottom edge rides 40 above it (with the pick-up's pop). */
  private liftFor(piece: number) {
    return RIDE + (1.12 * SHAPES[this.garden.pieces[piece]].h * this.lay.cell) / 2;
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Touch                                                                                          */
  /* -------------------------------------------------------------------------------------------- */

  private pick(i: number) {
    const slot = this.slots[i];
    this.cancelled = false;
    if (this.busy || this.finished || slot.piece === null) return;
    this.carrying = i;
    sfx.pop(6);
    this.ctx.tw.kill(slot.art.scale);
    void this.ctx.tw.to(slot.art.scale, { x: 1, y: 1 }, { duration: 0.12, ease: ease.outQuad });
    // Ride above the finger by the piece's own height, so its bottom edge stays 40 above it.
    const lift = this.liftFor(slot.piece);
    slot.carrier.y -= lift;
    this.grab(slot, lift);
  }

  /** The drag helper centres a grabbed thing on the finger plus its grab offset; nudge that offset up by the piece's lift. */
  private grab(slot: Slot, lift: number) {
    const c = slot.carrier;
    const onMove = (e: { global: { x: number; y: number } }) => {
      if (this.carrying === null || this.slots[this.carrying] !== slot) return void c.off('globalpointermove', onMove);
      const p = this.root.toLocal(e.global);
      c.position.set(p.x, p.y - lift);
    };
    c.on('globalpointermove', onMove);
  }

  /** Where the carried piece's top-left corner is now. */
  private carriedCorner(i: number) {
    const slot = this.slots[i];
    const s = SHAPES[this.garden.pieces[slot.piece!]];
    return { x: slot.carrier.x - (s.w * this.lay.cell) / 2, y: slot.carrier.y - (s.h * this.lay.cell) / 2 };
  }

  private carry(i: number) {
    if (this.carrying !== i) return;
    const slot = this.slots[i];
    if (slot.piece === null) return;
    const p = this.carriedCorner(i);
    const at = nearestAnchor(this.state.bed, this.garden.pieces[slot.piece], p.x, p.y, this.lay);
    this.shadow = at ? { piece: slot.piece, at } : null;
  }

  private drop(i: number): boolean {
    const slot = this.slots[i];
    const cancelled = this.cancelled;
    this.cancelled = false;
    if (this.carrying !== i || slot.piece === null) return this.home(slot), true;
    this.carrying = null;
    this.carry(i);
    const shadow = this.shadow;
    this.shadow = null;
    const over = this.overBed(slot.carrier.x, slot.carrier.y);
    if (cancelled || this.busy || this.finished) return this.home(slot), true;
    if (shadow) {
      void this.plant({ piece: shadow.piece, ...shadow.at });
      return true;
    }
    this.home(slot);
    if (over) this.refuse();
    return true;
  }

  private home(slot: Slot) {
    this.carrying = null;
    this.shadow = null;
    const i = this.slots.indexOf(slot);
    const r = this.lay.slots[i];
    this.ctx.tw.kill(slot.carrier);
    this.ctx.tw.kill(slot.art.scale);
    void this.ctx.tw.to(slot.carrier, { x: r.x + r.w / 2, y: r.y + r.h / 2 }, { duration: 0.3, ease: ease.outBack });
    void this.ctx.tw.to(slot.art.scale, { x: TRAY_CELL / this.lay.cell, y: TRAY_CELL / this.lay.cell }, { duration: 0.2 });
  }

  private overBed(x: number, y: number) {
    const size = this.plan.n * this.lay.cell;
    return x >= this.lay.x && x <= this.lay.x + size && y >= this.lay.y && y <= this.lay.y + size;
  }

  /** A piece let go over the bed with no shadow: a boing and the reason. From level 3 it counts, and every second one lights the hint. */
  private refuse() {
    sfx.boing();
    void this.ctx.say('block-garden.refuse');
    if (!this.plan.refusalCounts) return;
    this.misses++;
    this.gardenMisses++;
    if (this.gardenMisses % 2 === 0) this.showHint();
  }

  private async plant(p: Placement) {
    this.busy = true;
    this.hinted = null;
    this.undoPulse = 0;
    this.botPlan = null;
    const shape = this.garden.pieces[p.piece];
    const out = place(this.state.bed, shape, p);
    this.history.push(this.state);
    const before = this.state;
    this.state = apply(this.garden, this.state, p);
    this.undoButton.alpha = 1;
    // The piece goes into the soil: show the bed with it planted, then bloom.
    const planted = { ...before.bed, filled: before.bed.filled.map((m, r) => m | (SHAPES[shape].rows[r - p.r] ?? 0) << p.c) };
    this.drawBed(planted);
    this.hideCarried(p.piece);
    sfx.pop(9);
    const lines = out.rows.length + out.cols.length;
    if (lines) {
      const { x, y, cell } = this.lay;
      const n = this.plan.n;
      let k = 0;
      const ring = (cells: [number, number][]) => {
        sfx.marimba(RUN[Math.min(RUN.length - 1, k++)], 0.4);
        for (const [r, c] of cells) {
          const bud = has(before.bed.buds, r, c);
          this.ctx.particles.burst(x + (c + 0.5) * cell, y + (r + 0.5) * cell, { kind: 'dot', colors: [bud ? swatch.yellow.fill : PETALS[(r + c) % PETALS.length], 0xffffff], count: bud ? 10 : 3, speed: [40, 140], gravity: 0, life: [0.3, 0.7] });
        }
      };
      for (const r of out.rows) ring(Array.from({ length: n }, (_, c) => [r, c] as [number, number]));
      for (const c of out.cols) ring(Array.from({ length: n }, (_, r) => [r, c] as [number, number]));
      if (out.bloomed.length) void this.ctx.say('block-garden.bloom');
      this.flyToBasket(out.bloomed.length + lines);
      await this.ctx.tw.wait(BLOOM);
    } else await this.ctx.tw.wait(0.15);
    this.sinceHint++;
    const trayBefore = trayIndex(this.garden, before.used);
    this.refresh();
    this.busy = false;
    if (goalMet(this.state.bed, this.garden.goal)) return void this.gardenDone();
    if (trayIndex(this.garden, this.state.used) !== trayBefore && trayNow(this.garden, this.state.used).length) {
      sfx.whoosh();
      void this.ctx.say('block-garden.next-tray');
    }
    if (this.checkStuck()) return;
    if (this.sinceHint >= Math.max(4, 2 * this.garden.solution.length) && !this.ctx.couch) this.showHint();
  }

  private hideCarried(piece: number) {
    const slot = this.slots.find((s) => s.piece === piece);
    if (!slot) return;
    slot.carrier.visible = false;
    const i = this.slots.indexOf(slot);
    const r = this.lay.slots[i];
    slot.carrier.position.set(r.x + r.w / 2, r.y + r.h / 2);
  }

  private flyToBasket(count: number) {
    const b = this.basketAt();
    const { x, y, cell } = this.lay;
    const size = this.plan.n * cell;
    for (let i = 0; i < Math.min(6, count); i++) {
      const f = new Graphics();
      flowerArt(f, 0, 0, 22, PETALS[i % PETALS.length]);
      f.eventMode = 'none';
      f.position.set(x + size * (0.2 + 0.6 * Math.random()), y + size * (0.2 + 0.6 * Math.random()));
      this.root.addChild(f);
      void this.ctx.tw.to(f, { x: b.x, y: b.y, alpha: 0.2 }, { duration: 0.7 + i * 0.08, ease: ease.inOutSine }).then(() => f.destroy());
    }
  }

  private undo() {
    if (this.busy || this.finished) return;
    const before = this.history.pop();
    if (!before) return;
    this.state = before;
    this.hinted = null;
    this.undoPulse = 0;
    this.botPlan = null;
    this.undoButton.alpha = this.history.length ? 1 : 0.35;
    this.refresh();
    sfx.pop(2);
  }

  /** Stuck: no tray piece fits, the pieces are used up, or a small search proves there is no way left. Never a miss or a hint. */
  private checkStuck(): boolean {
    const none = !placements(this.garden, this.state).length || search(this.garden, this.state, DEAD_END_CAP) === 'none';
    if (!none) return false;
    this.undoPulse = 5;
    void this.ctx.say('block-garden.stuck');
    return true;
  }

  /** The hint's piece glows in its slot and its shadow shows where it goes; past the search's room, the round arrow glows instead. Counts once. */
  private showHint() {
    if (this.hinted || this.finished) return;
    const hint = hintPlacement(this.garden, this.state, this.history);
    this.sinceHint = 0;
    if (hint.kind === 'stuck') {
      this.undoPulse = 5;
      void this.ctx.say('block-garden.stuck');
      return;
    }
    this.hints++;
    if (hint.kind === 'back') this.undoPulse = 6;
    else this.hinted = hint.placement;
    void this.ctx.say('block-garden.hint');
  }

  private async gardenDone() {
    this.busy = true;
    this.hinted = null;
    sfx.sparkle();
    this.ctx.pet.cheer();
    await this.ctx.say('block-garden.done');
    await this.ctx.tw.to(this.root, { alpha: 0 }, { duration: 0.4 });
    await this.next();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.root.alpha = 1;
    sfx.tada();
    await this.ctx.tw.wait(0.3);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Drawing                                                                                        */
  /* -------------------------------------------------------------------------------------------- */

  private drawBed(bed = this.state.bed) {
    const { x, y, cell, n } = this.lay;
    const g = this.bedArt.clear();
    const size = n * cell;
    g.roundRect(x - 14, y - 14, size + 28, size + 28, 24).fill(SOIL.line);
    // Striped lines that still hold a sleeping bud (levels 1–2).
    const budRows = new Set<number>(), budCols = new Set<number>();
    if (this.plan.tinted) for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (has(bed.buds, r, c)) { budRows.add(r); budCols.add(c); }
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const px = x + c * cell, py = y + r * cell;
      g.roundRect(px + 2, py + 2, cell - 4, cell - 4, cell * 0.12).fill(SOIL.fill);
      if (budRows.has(r) || budCols.has(c)) g.roundRect(px + 2, py + 2, cell - 4, cell - 4, cell * 0.12).fill({ color: swatch.yellow.light, alpha: 0.45 });
      else g.circle(px + cell / 2, py + cell / 2, cell * 0.06).fill(SOIL.light);
      if (!has(bed.filled, r, c)) continue;
      if (has(bed.stones, r, c)) {
        g.roundRect(px + cell * 0.1, py + cell * 0.12, cell * 0.8, cell * 0.76, cell * 0.3).fill(STONE.fill).stroke({ width: 3, color: STONE.line });
        if (has(bed.buds, r, c)) {
          // A sleeping bud: a closed green bud on a stem.
          g.moveTo(px + cell / 2, py + cell * 0.72).lineTo(px + cell / 2, py + cell * 0.46).stroke({ width: cell * 0.06, color: swatch.green.line, cap: 'round' });
          g.ellipse(px + cell / 2, py + cell * 0.38, cell * 0.14, cell * 0.2).fill(swatch.pink.fill).stroke({ width: 3, color: swatch.pink.line });
          g.ellipse(px + cell * 0.4, py + cell * 0.52, cell * 0.1, cell * 0.05).fill(swatch.green.fill);
        }
      } else {
        // Planted: a seedling in turned soil.
        g.roundRect(px + cell * 0.08, py + cell * 0.08, cell * 0.84, cell * 0.84, cell * 0.2).fill(swatch.green.light).stroke({ width: 3, color: swatch.green.line });
        g.moveTo(px + cell / 2, py + cell * 0.72).lineTo(px + cell / 2, py + cell * 0.42).stroke({ width: cell * 0.05, color: swatch.green.line, cap: 'round' });
        g.ellipse(px + cell * 0.38, py + cell * 0.42, cell * 0.12, cell * 0.06).fill(swatch.green.fill);
        g.ellipse(px + cell * 0.62, py + cell * 0.36, cell * 0.12, cell * 0.06).fill(swatch.green.fill);
      }
    }
  }

  /** The shadow under a carried or hinted piece, and the lines it would fill shimmering. */
  private drawShadow() {
    const g = this.shadowArt.clear();
    if (!this.garden || this.finished) return;
    const show = this.shadow ?? (this.hinted && !this.busy ? { piece: this.hinted.piece, at: this.hinted } : null);
    if (!show) return;
    const shape = this.garden.pieces[show.piece];
    if (!fits(this.state.bed, shape, show.at)) return;
    const { x, y, cell, n } = this.lay;
    const out = place(this.state.bed, shape, show.at);
    const a = 0.25 + 0.15 * Math.sin(this.clock * 7);
    for (const r of out.rows) g.roundRect(x, y + r * cell, n * cell, cell, 12).fill({ color: swatch.yellow.light, alpha: a });
    for (const c of out.cols) g.roundRect(x + c * cell, y, cell, n * cell, 12).fill({ color: swatch.yellow.light, alpha: a });
    for (const [r, c] of SHAPES[shape].cells) {
      g.roundRect(x + (show.at.c + c) * cell + 6, y + (show.at.r + r) * cell + 6, cell - 12, cell - 12, cell * 0.16).fill({ color: ink, alpha: 0.22 });
    }
  }

  /** Small seed packets under the tray, one for each piece still to come. */
  private drawPackets() {
    const g = this.packets.clear();
    if (!this.garden) return;
    const later = this.garden.pieces.length - (trayIndex(this.garden, this.state.used) + 1) * this.garden.traySize;
    if (later <= 0) return;
    const last = this.lay.slots[2];
    const first = this.lay.slots[0];
    const px = this.lay.portrait ? first.x : last.x + last.w / 2 - (later * 26) / 2;
    const py = this.lay.portrait ? last.y + last.h + 4 : last.y + last.h + 6;
    for (let i = 0; i < later; i++) g.roundRect(px + i * 26, py, 20, 28, 4).fill(swatch.brown.light).stroke({ width: 2, color: swatch.brown.line });
  }

  private basketAt() {
    const v = this.ctx.view;
    return v.h > v.w ? { x: v.w / 2, y: 60 } : { x: v.w - 46, y: 46 };
  }

  private drawBasket(_v: View) {
    const b = this.basketAt();
    this.basket.clear()
      .roundRect(b.x - 30, b.y - 6, 60, 34, 10).fill(swatch.brown.fill).stroke({ width: 3, color: swatch.brown.line })
      .moveTo(b.x - 24, b.y - 4).arc(b.x, b.y - 4, 24, Math.PI, 0).stroke({ width: 4, color: swatch.brown.line });
  }
}

class GardenIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const g = new Graphics();
    g.roundRect(-58, -126, 116, 116, 18).fill(SOIL.line);
    for (const [r, cc] of [[0, 0], [0, 1], [1, 0], [1, 1]]) {
      g.roundRect(-52 + cc * 54, -120 + r * 54, 50, 50, 8).fill(SOIL.fill);
    }
    seedSquare(g, -52, -66, 50, 'domino');
    seedSquare(g, -2, -66, 50, 'domino');
    g.roundRect(-46, -114, 40, 38, 14).fill(STONE.fill).stroke({ width: 3, color: STONE.line });
    flowerArt(g, 25, -95, 24, swatch.pink.fill);
    c.addChild(g);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const g = new Graphics();
  g.circle(0, 0, 80).fill(swatch.green.light).stroke({ width: 6, color: swatch.green.line });
  g.roundRect(-46, 4, 92, 46, 14).fill(swatch.brown.fill).stroke({ width: 4, color: swatch.brown.line });
  g.moveTo(-38, 8).arc(0, 8, 38, Math.PI, 0).stroke({ width: 6, color: swatch.brown.line });
  const n = rng.int(3, 5);
  for (let i = 0; i < n; i++) flowerArt(g, -30 + (60 * i) / (n - 1), -2 - rng.int(0, 16), rng.int(16, 22), rng.pick(PETALS));
  c.addChild(g);
  return c;
}

export const blockGarden: GameModule = {
  id: 'block-garden',
  name: 'Block Garden',
  titleLine: 'game.block-garden',
  region: 'puzzle-peaks',
  skills: ['spatial-planning', 'shape-composition', 'planning'],
  bands: ['prek', 'school', 'grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'One of you points at a gap, and the other finds the shape that fills it. Say "row" and "column" out loud.',
  offScreen: 'Cut shapes from squared paper and fill a 5 × 5 grid drawn on paper, without turning them.',
  hubIcon: () => new GardenIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new BlockGarden(ctx),
};
