import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { swatch } from '../../art/palette';
import { anemone, crab, pail, rock, shell, star, wrack as drawWrack } from '../../art/shore';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap, palmOnGlass } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { DUNE, GRASS_GREEN, iconArt, SAND, SEA, SEA_DEEP, WET_SAND } from './art';
import {
  AUTHORED_HIGH,
  BAND,
  BAND_LEVELS,
  clampFeet,
  creatureSpot,
  CREATURES,
  CycleCounter,
  CYCLES,
  drySpot,
  fifthCrossed,
  FIFTH_STEPS,
  hAt,
  highFor,
  PailTurn,
  reach,
  seaGrab,
  shoreLayout,
  tidePlan,
  UP,
  wrack,
  yAt,
  type Creature,
  type Plan,
  type ShoreLayout,
} from './logic';

/** Each level's authored first round leads its first round of a session, and every demonstration. */
const authoredShown = new Set<number>();

/** Seconds the released sea takes to slide back down the sand. */
const BACK = 1.5;
/** Seconds the sea takes to come in to the line at level 2. */
const RISE = 1.7;
const PAILS = 2;
const PAIL_COLORS = [swatch.red, swatch.blue] as const;

interface Critter {
  kind: Creature;
  h: number;
  node: Container;
  art: Graphics;
  /** The anemone's openness, 0 to 1. */
  open: number;
  wet: boolean;
}

interface Pail {
  node: Container;
  handle: DragHandle;
  /** Where its feet stand once placed: x and a height on the sand; null while in the tray or being fetched. */
  at: { x: number; h: number } | null;
  floating: boolean;
}

class TideLine implements Game {
  readonly plan: Plan;
  misses = 0;
  hints = 0;
  busy = false;
  finished = false;
  /** The sea's height on the sand. */
  readonly sea = { h: 0 };

  // Level 1.
  readonly counter = new CycleCounter();
  private grab: { id: number; peak: number; y0: number; moved: boolean } | null = null;
  private target = 0;
  /** After a release, the sea slides back from `from` over `BACK` seconds. */
  private back: { from: number; t: number } | null = null;
  /** The lap band's tap: one whole wave sent up the sand and back. */
  private auto: { t: number } | null = null;
  private gullCalled = false;
  private anemoneSaid = false;
  private saidIn = false;
  readonly seaHit = new Container();
  private readonly critters: Critter[] = [];

  // Level 2.
  readonly high: number;
  readonly turns: PailTurn[] = [];
  index = 0;
  pail: Pail | null = null;
  private readonly placed: Pail[] = [];

  private readonly shore = new Graphics();
  private readonly line = new Graphics();
  private readonly glow = new Graphics();
  private readonly critterLayer = new Container();
  private readonly water = new Graphics();
  private readonly pailLayer = new Container();
  /** At the stage's origin: the ghost finger's drop spots are given in its coordinates. */
  readonly board = new Container();
  private view: View;
  private L: ShoreLayout;
  private clock = 0;
  askForHint?: () => void;
  hintLabel?: string;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.L = shoreLayout(ctx.view);
    this.plan = tidePlan(ctx.level);
    const authored = !!ctx.demo || !authoredShown.has(ctx.level);
    authoredShown.add(ctx.level);
    this.high = authored ? AUTHORED_HIGH : highFor(ctx.rng);
    for (const g of [this.line, this.glow, this.critterLayer, this.water]) g.eventMode = 'none';
    ctx.stage.addChild(this.shore, this.line, this.glow, this.critterLayer, this.water, this.seaHit, this.pailLayer, this.board);
    if (this.plan.mode === 'wave') {
      this.seaHit.eventMode = 'static';
      this.seaHit.cursor = 'grab';
      this.seaHit.on('pointerdown', this.onDown);
      this.seaHit.on('globalpointermove', this.onMove);
      // The ghost finger lets go on the sea itself (it sends no window events); a real release reaches both.
      this.seaHit.on('pointerup', this.release);
      this.seaHit.on('pointerupoutside', this.release);
      window.addEventListener('pointerup', this.release);
      window.addEventListener('pointercancel', this.release, true);
      for (const c of CREATURES) this.addCritter(c.kind, c.h);
    } else {
      this.askForHint = () => this.hint();
      this.hintLabel = 'Show me';
      for (let i = 0; i < PAILS; i++) this.turns.push(new PailTurn());
      this.spawnPail();
    }
    this.layoutAll();
  }

  start() {
    void this.ctx.instruct(this.plan.mode === 'wave' ? 'tl.instruct.1' : 'tl.instruct.2');
  }

  // Level 1: the wave ---------------------------------------------------------------------------

  private addCritter(kind: Creature, h: number) {
    const node = new Container();
    const art = new Graphics();
    node.addChild(art);
    node.hitArea = new Rectangle(-55, -80, 110, 100);
    const c: Critter = { kind, h, node, art, open: 0, wet: false };
    this.drawCritter(c);
    // A poke: the anemone pulls in, the others wobble. Never counted.
    onTap(node, () => {
      sfx.tick();
      if (kind === 'anemone') c.open = 0;
      this.wobble(c);
    });
    this.critters.push(c);
    this.critterLayer.addChild(node);
  }

  private drawCritter(c: Critter) {
    const g = c.art.clear();
    // Each lives on a low rock, drawn at its feet.
    rock(g, 0, 8);
    if (c.kind === 'anemone') anemone(g, 0, -28, 2.2, c.open);
    else if (c.kind === 'star') star(g, 0, -34, 1.8, swatch.orange);
    else if (c.kind === 'shell') shell(g, 0, -26, 1.3);
    else {
      g.save().translateTransform(0, -22).scaleTransform(1.9, 1.9);
      crab(g, 0, 0, -1);
      g.restore();
    }
  }

  private wobble(c: Critter) {
    if (this.ctx.tw.busy(c.node)) return;
    void this.ctx.tw.to(c.node, { rotation: 0.12 }, { duration: 0.1 }).then(() => this.ctx.tw.to(c.node, { rotation: 0 }, { duration: 0.4, ease: ease.outElastic }));
  }

  private readonly onDown = (e: FederatedPointerEvent) => {
    if (this.finished || this.grab || palmOnGlass()) return;
    const p = this.ctx.stage.toLocal(e.global);
    this.grab = { id: e.pointerId, peak: this.sea.h, y0: p.y, moved: false };
    this.auto = null;
    this.back = null;
    this.target = this.sea.h;
    // Touch-down: foam bursts at the crest.
    sfx.whoosh();
    this.ctx.particles.burst(p.x, yAt(this.L, this.sea.h), { colors: [0xffffff, swatch.blue.light], count: 6, speed: [40, 120], gravity: 300, angle: -Math.PI / 2, spread: 1, size: [0.25, 0.45] });
  };

  private readonly onMove = (e: FederatedPointerEvent) => {
    const grab = this.grab;
    if (!grab || e.pointerId !== grab.id) return;
    const p = this.ctx.stage.toLocal(e.global);
    if (Math.abs(p.y - grab.y0) > 12) grab.moved = true;
    this.target = Math.max(0, Math.min(0.95, hAt(this.L, p.y)));
  };

  private readonly release = (e: { pointerId: number }) => {
    const grab = this.grab;
    if (!grab || e.pointerId !== grab.id) return;
    this.grab = null;
    if (this.finished) return;
    // Lap: a tap on the sea sends one whole wave up the sand.
    if (this.ctx.band === 'lap' && !grab.moved && grab.peak < UP) {
      this.auto = { t: 0 };
      sfx.wave(true);
      return;
    }
    this.back = { from: this.sea.h, t: 0 };
    if (this.sea.h > 0.25) sfx.wave(false);
  };

  private waveFrame(dt: number) {
    const before = this.sea.h;
    if (this.grab) {
      this.sea.h += (this.target - this.sea.h) * Math.min(1, dt * 10);
      this.grab.peak = Math.max(this.grab.peak, this.sea.h);
    } else if (this.auto) {
      this.auto.t += dt;
      const T = 3.2;
      this.sea.h = 0.8 * (1 - Math.cos((2 * Math.PI * Math.min(this.auto.t, T)) / T)) / 2;
      if (this.auto.t >= T) this.auto = null;
      else if (this.auto.t > T / 2 && this.auto.t - dt <= T / 2) sfx.wave(false);
    } else if (this.back) {
      this.back.t += dt;
      const k = Math.min(1, this.back.t / BACK);
      this.sea.h = (this.back.from * (1 + Math.cos(Math.PI * k))) / 2;
      if (k >= 1) this.back = null;
    }
    const h = this.sea.h;
    const step = fifthCrossed(before, h);
    if (step !== null) sfx.marimba(FIFTH_STEPS[step], 0.3);
    if (h > UP && !this.saidIn) {
      this.saidIn = true;
      void this.ctx.say('tl.in');
      if (!this.gullCalled) {
        this.gullCalled = true;
        sfx.gull();
      }
    }
    const cycled = this.counter.feed(h);
    // The shore answers: covered creatures wake, uncovered ones close and wait.
    for (const c of this.critters) {
      const wet = h > c.h;
      if (wet !== c.wet) {
        c.wet = wet;
        this.wobble(c);
        if (!wet && c.kind === 'anemone' && !this.anemoneSaid) {
          this.anemoneSaid = true;
          void this.ctx.say('tl.anemone');
        }
      }
      if (c.kind === 'anemone') {
        const want = wet ? 1 : 0;
        const next = c.open + Math.sign(want - c.open) * Math.min(Math.abs(want - c.open), dt * 2);
        if (next !== c.open) {
          c.open = next;
          this.drawCritter(c);
        }
      } else if (c.kind === 'star' && wet) c.art.rotation = Math.sin(this.clock * 3) * 0.05;
    }
    if (cycled) {
      this.saidIn = false;
      if (this.counter.cycles >= CYCLES) void this.end();
      else void this.ctx.say('tl.out');
    }
  }

  // Level 2: the pail ---------------------------------------------------------------------------

  private spawnPail() {
    const node = new Container();
    const g = new Graphics();
    pail(g, 0, 0, PAIL_COLORS[this.index % PAIL_COLORS.length]);
    node.addChild(g);
    node.hitArea = new Rectangle(-62, -128, 124, 132);
    node.position.set(this.L.tray.x, this.L.tray.y);
    this.pailLayer.addChild(node);
    const p: Pail = { node, handle: null as unknown as DragHandle, at: null, floating: false };
    p.handle = draggable(node, this.ctx.tw, {
      onPick: () => sfx.pop(5),
      onDrop: (x, y) => {
        if (this.busy || this.finished) return false;
        const f = clampFeet(this.L, this.view, x, y);
        node.position.set(f.x, f.y);
        p.at = { x: f.x, h: hAt(this.L, f.y) };
        sfx.clunk();
        void this.runSea(p);
        return true;
      },
    });
    p.handle.home = { ...this.L.tray };
    this.pail = p;
    node.scale.set(0);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
  }

  /** The pail is down: only now does the sea come in to the line, and go out again. */
  private async runSea(p: Pail) {
    const turn = this.turns[this.index];
    if (!p.at || !turn) return;
    this.busy = true;
    p.handle.enabled = false;
    const tw = this.ctx.tw;
    await tw.wait(0.35);
    sfx.wave(true);
    await tw.to(this.sea, { h: reach(this.high) }, { duration: RISE, ease: ease.inOutSine });
    const out = turn.wave(p.at.h, this.high);
    this.misses = this.turns.reduce((n, t) => n + t.misses, 0);
    this.hints = this.turns.filter((t) => t.hint).length;
    await tw.wait(0.35);
    if (out.dry) {
      sfx.sparkle();
      this.ctx.pet.cheer();
      void this.ctx.say('tl.dry');
      this.drawGlow();
      sfx.wave(false);
      await tw.to(this.sea, { h: 0 }, { duration: BACK, ease: ease.inOutSine });
      this.placed.push(p);
      this.pail = null;
      this.index++;
      if (this.index >= PAILS) return void this.end();
      await tw.wait(0.4);
      this.spawnPail();
      void this.ctx.say('tl.next');
      this.busy = false;
      return;
    }
    // Wet: it floats on the sea, the sea goes out, and the pet fetches it back to the rocks.
    sfx.boing();
    void this.ctx.say('tl.float');
    sfx.wave(false);
    await tw.to(this.sea, { h: 0 }, { duration: BACK, ease: ease.inOutSine });
    p.floating = false;
    this.ctx.pet.hop();
    sfx.whoosh();
    p.at = null;
    await tw.to(p.node, { x: this.L.tray.x, y: this.L.tray.y, rotation: 0 }, { duration: 0.7, ease: ease.inOutSine });
    if (this.finished) return;
    p.handle.enabled = true;
    if (out.glow) {
      this.drawGlow();
      void this.ctx.say('tl.look');
    }
    this.busy = false;
  }

  /** Show me: the line and the dry sand above it glow; asked again, the pet carries the pail up there. One hint a pail. */
  private hint() {
    const turn = this.turns[this.index];
    const p = this.pail;
    if (this.finished || !turn || !p || this.busy || p.handle.dragging) return;
    const what = turn.ask();
    this.hints = this.turns.filter((t) => t.hint).length;
    this.drawGlow();
    if (what === 'glow') void this.ctx.say('tl.look');
    else if (what === 'carry') {
      const spot = drySpot(this.L, this.view, this.high, this.placed.map((q) => ({ x: q.node.x, y: q.node.y })));
      this.busy = true;
      p.handle.enabled = false;
      sfx.whoosh();
      void this.ctx.tw.to(p.node, { x: spot.x, y: spot.y }, { duration: 0.8, ease: ease.inOutSine }).then(() => {
        if (this.finished) return;
        p.at = { x: spot.x, h: hAt(this.L, spot.y) };
        this.busy = false;
        void this.runSea(p);
      });
    }
  }

  // The ghost finger --------------------------------------------------------------------------------

  autotouch(): TouchIntent | null {
    if (this.finished || this.busy) return null;
    if (this.plan.mode === 'wave') {
      if (this.grab || this.auto || this.sea.h > 0.05) return null;
      const x = this.view.w * 0.6;
      const crest = yAt(this.L, this.sea.h) + 20;
      return { trace: { on: this.seaHit, x, y: crest }, via: [{ on: this.seaHit, x, y: yAt(this.L, 0.75) }, { on: this.seaHit, x, y: yAt(this.L, 0.92) }], receiver: this.seaHit, pause: 0.4 };
    }
    const p = this.pail;
    if (!p || p.handle.dragging || p.at || this.ctx.tw.busy(p.node)) return null;
    const spot = drySpot(this.L, this.view, this.high, this.placed.map((q) => ({ x: q.node.x, y: q.node.y })));
    return { drag: { on: p.node, y: -60 }, to: { on: this.board, x: spot.x, y: spot.y } };
  }

  // Round end -----------------------------------------------------------------------------------------

  private async end() {
    if (this.finished) return;
    this.finished = true;
    this.grab = null;
    this.drawGlow();
    await this.ctx.tw.wait(0.6);
    this.ctx.pet.cheer();
    sfx.tada();
    await this.ctx.say('tl.done');
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  // Layout and drawing --------------------------------------------------------------------------------

  resize(v: View) {
    this.view = v;
    this.L = shoreLayout(v);
    this.layoutAll();
  }

  private layoutAll() {
    const v = this.view;
    const L = this.L;
    const g = this.shore.clear();
    // Sky, dunes and grass at the top; the sand sloping down to the sea.
    g.rect(0, 0, v.w, v.h).fill(SAND);
    g.rect(0, 0, v.w, L.sand.y + 10).fill(0xbfe6f7);
    g.moveTo(0, L.dunes + 6);
    for (let x = 0; x <= v.w; x += 120) g.quadraticCurveTo(x + 60, L.dunes - 26, x + 120, L.dunes + 6);
    g.lineTo(v.w, L.sand.y - 30).lineTo(0, L.sand.y - 30).closePath().fill(DUNE);
    g.rect(0, L.sand.y - 34, v.w, 26).fill(GRASS_GREEN);
    for (let x = 14; x < v.w; x += 34) g.moveTo(x, L.sand.y - 34).lineTo(x + 6, L.sand.y - 54).stroke({ color: 0x6fa548, width: 3, cap: 'round' });
    g.rect(0, yAt(L, 0.12), v.w, L.low - yAt(L, 0.12)).fill({ color: WET_SAND, alpha: 0.6 });
    // The sea-side rocks at the right hold the pail's tray.
    if (this.plan.mode === 'pail') {
      g.ellipse(L.tray.x, L.tray.y + 8, 82, 22).fill(0x9a93b0).stroke({ color: 0x6f6888, width: 3 });
    }
    this.line.clear();
    if (this.plan.mode === 'pail') {
      const w = wrack(this.high);
      const bandPx = BAND * (L.low - L.dunes);
      drawWrack(this.line, 0, v.w, yAt(L, w.mid), bandPx, 11);
    }
    this.critters.forEach((c, i) => {
      const s = creatureSpot(L, v, CREATURES[i]);
      c.node.position.set(s.x, s.y);
    });
    // The sea's grab area follows the crest each frame (see update); the board sits at the origin.
    this.board.position.set(0, 0);
    if (this.pail && !this.pail.at && !this.ctx.tw.busy(this.pail.node)) this.pail.node.position.set(L.tray.x, L.tray.y);
    if (this.pail) this.pail.handle.home = { ...L.tray };
    for (const p of [...this.placed, ...(this.pail?.at ? [this.pail] : [])]) {
      if (p.at && !this.ctx.tw.busy(p.node)) p.node.position.set(Math.min(p.at.x, L.sand.x + L.sand.w), yAt(L, p.at.h));
    }
    this.drawGlow();
    this.drawSea();
  }

  private drawGlow() {
    const g = this.glow.clear();
    const turn = this.turns[this.index];
    if (this.finished || !turn || !turn.glow || turn.done) return;
    const w = wrack(this.high);
    const top = yAt(this.L, w.top);
    g.rect(0, this.L.sand.y - 34, this.view.w, top - (this.L.sand.y - 34)).fill({ color: 0xffffff, alpha: 0.55 });
    g.rect(-10, top - 4, this.view.w + 20, yAt(this.L, w.bottom) - top + 8).stroke({ color: swatch.orange.line, width: 10 });
  }

  private drawSea() {
    const v = this.view;
    const y = yAt(this.L, this.sea.h);
    const g = this.water.clear();
    const swell = (x: number) => Math.sin(x / 90 + this.clock * 1.6) * 6;
    g.moveTo(0, y + swell(0));
    for (let x = 30; x <= v.w + 30; x += 30) g.lineTo(x, y + swell(x));
    g.lineTo(v.w, v.h).lineTo(0, v.h).closePath().fill({ color: SEA, alpha: 0.6 });
    g.rect(0, Math.max(y + 40, this.L.low + 30), v.w, v.h).fill({ color: SEA_DEEP, alpha: 0.5 });
    g.moveTo(0, y + swell(0));
    for (let x = 30; x <= v.w + 30; x += 30) g.lineTo(x, y + swell(x));
    g.stroke({ color: 0xffffff, width: this.grab ? 12 : 7, cap: 'round', alpha: 0.95 });
    if (this.plan.mode === 'wave') {
      const r = seaGrab(v, y);
      this.seaHit.hitArea = new Rectangle(r.x, r.y, r.w, r.h);
    }
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.65 + 0.35 * Math.sin(this.clock * 4);
    if (this.plan.mode === 'wave' && !this.finished) this.waveFrame(dt);
    // A pail on wet sand floats up with the sea and bobs.
    const p = this.pail;
    if (p?.at && (p.floating || this.sea.h > p.at.h) && this.busy) {
      p.floating = true;
      p.node.y = yAt(this.L, this.sea.h) + 8 + Math.sin(this.clock * 5) * 4;
      p.node.rotation = Math.sin(this.clock * 3) * 0.1;
    }
    this.drawSea();
  }

  destroy() {
    window.removeEventListener('pointerup', this.release);
    window.removeEventListener('pointercancel', this.release, true);
    this.pail?.handle.destroy();
    for (const p of this.placed) p.handle.destroy();
  }
}

export const tideLine: GameModule = {
  id: 'tide-line',
  name: 'Tide Line',
  titleLine: 'game.tide-line',
  region: 'tinker-lab',
  skills: ['science', 'patterns', 'prediction'],
  bands: ['lap', 'toddler', 'preschool'],
  levels: (b) => rangeFor(BAND_LEVELS, b),
  describeLevel: (l) => tidePlan(l).name,
  music: STYLES.bubbles,
  coplayHint: 'One of you is the sea and pulls the wave; the other says "in!" and "out!" before it turns.',
  hubIcon: () => new WigglyIcon(iconArt()),
  touchDemo: true,
  sticker: (seed) => iconArt(seed),
  create: (ctx) => new TideLine(ctx),
};
