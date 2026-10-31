import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { arrow, boatArt, cardArt, friendArt, iconArt, SAND, SAND_LINE, SEA, SEA_DARK, WALL, WALL_LINE } from './art';
import {
  BAND_LEVELS,
  BEACH_NAME,
  beachesFor,
  boatsFor,
  CARDS,
  cellAt,
  cellCentre,
  dcPlan,
  DIR_WORD,
  drift,
  driftLayout,
  FRIEND,
  predict,
  predictRound,
  sendRound,
  tally,
  traceAhead,
  Turn,
  type Beach,
  type Cell,
  type DriftLayout,
  type Plan,
  type Request,
  type Sea,
} from './logic';

/** Each level's authored first round leads its first round of a session, and every demonstration. */
const authoredShown = new Set<number>();
/** The real-science line is said once a session, after the first finish. */
let realSaid = false;

/** Seconds a card takes to cross one cell. */
const STEP = 0.35;
/** Seconds a free trace stays before it fades. */
const TRACE_HOLD = 2;
const BOAT_COLORS = [swatch.red, swatch.blue, swatch.green] as const;

interface Boat {
  col: number;
  node: Container;
}

interface Friend {
  beach: Beach;
  node: Container;
  art: Container;
  /** The empty-hand bubble of the friend asking at level 2. */
  ask: Graphics;
  found: number;
}

class DriftCards implements Game {
  readonly plan: Plan;
  readonly level: number;
  finished = false;
  busy = false;
  index = 0;
  turns: Turn[] = [];
  /** Misses and hints from before a Start again. */
  private banked = { misses: 0, hints: 0 };
  /** Level 1: has she seen a card drift on this sea yet? The first card of a round is a free guess. */
  seenDrift = false;
  sea: Sea;
  readonly requests: Request[] = [];

  private readonly bg = new Graphics();
  private readonly seaG = new Graphics();
  private readonly shimmer = new Graphics();
  private readonly traceG = new Graphics();
  private readonly glowG = new Graphics();
  readonly seaHit = new Container();
  readonly boats: Boat[] = [];
  readonly plates = new Map<Beach, Container>();
  readonly friends = new Map<Beach, Friend>();
  private readonly cardLayer = new Container();
  private held: Container | null = null;
  private trace: { cells: Cell[]; t: number; hold: boolean } | null = null;
  private tracing: { id: number; key: string } | null = null;
  private view: View;
  L: DriftLayout;
  private clock = 0;
  private demoStep = -1;
  private demoTraced = new Set<number>();
  askForHint?: () => void;
  hintLabel = 'Show me';

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.level = Math.max(1, Math.min(2, Math.round(ctx.level)));
    this.plan = dcPlan(this.level);
    this.L = this.layoutFor(ctx.view);
    const authored = !!ctx.demo || !authoredShown.has(this.level);
    authoredShown.add(this.level);
    if (this.plan.mode === 'predict') {
      this.sea = predictRound(ctx.rng, authored);
      for (let i = 0; i < CARDS; i++) this.turns.push(new Turn());
    } else {
      this.requests.push(...sendRound(ctx.rng, authored));
      this.sea = this.requests[0].sea;
      for (let i = 0; i < this.requests.length; i++) this.turns.push(new Turn());
    }
    this.askForHint = () => this.hint();
    for (const g of [this.bg, this.seaG, this.shimmer, this.traceG, this.glowG]) g.eventMode = 'none';
    this.cardLayer.eventMode = 'none';
    ctx.stage.addChild(this.bg, this.seaG, this.shimmer, this.seaHit);

    // The sea traces two cells ahead wherever she touches it; never counted.
    this.seaHit.eventMode = 'static';
    this.seaHit.on('pointerdown', this.onSeaDown);
    this.seaHit.on('globalpointermove', this.onSeaMove);
    this.seaHit.on('pointerup', this.onSeaUp);
    this.seaHit.on('pointerupoutside', this.onSeaUp);
    window.addEventListener('pointerup', this.onSeaUp);
    window.addEventListener('pointercancel', this.onSeaUp, true);

    for (const beach of beachesFor(this.plan.split)) {
      const plate = new Container();
      this.plates.set(beach, plate);
      ctx.stage.addChild(plate);
      if (this.plan.mode === 'predict') onTap(plate, () => this.pickBeach(beach));
      const node = new Container();
      const art = friendArt(beach);
      const ask = new Graphics();
      ask.visible = false;
      node.addChild(ask, art);
      node.eventMode = 'none';
      this.friends.set(beach, { beach, node, art, ask, found: 0 });
    }
    this.plan.boats.forEach((col, i) => {
      const node = new Container();
      node.addChild(boatArt(BOAT_COLORS[i % BOAT_COLORS.length]));
      ctx.stage.addChild(node);
      if (this.plan.mode === 'send') onTap(node, () => this.pickBoat(col));
      this.boats.push({ col, node });
    });
    for (const f of this.friends.values()) ctx.stage.addChild(f.node);
    ctx.stage.addChild(this.traceG, this.glowG, this.cardLayer);
    this.layoutAll();
  }

  get misses() {
    return this.banked.misses + tally(this.turns).misses;
  }

  get hints() {
    return this.banked.hints + tally(this.turns).hints;
  }

  get turn(): Turn | undefined {
    return this.turns[this.index];
  }

  get request(): Request | undefined {
    return this.requests[this.index];
  }

  private layoutFor(v: View): DriftLayout {
    // The layout fits every view the island has; at an untried shape, the iPad's layout is the fallback.
    return driftLayout(v, this.level) ?? driftLayout({ w: 1024, h: 768, scale: 1 }, this.level)!;
  }

  start() {
    if (this.plan.mode === 'predict') {
      void this.ctx.instruct('drift.instruct.1');
      this.holdCard();
    } else this.askFriend();
  }

  // The free trace ----------------------------------------------------------------------------------

  private readonly onSeaDown = (e: FederatedPointerEvent) => {
    if (this.finished || this.tracing || palmOnGlass()) return;
    const p = this.ctx.stage.toLocal(e.global);
    const cell = cellAt(this.L, this.plan, p.x, p.y);
    this.tracing = { id: e.pointerId, key: `${cell.r},${cell.c}` };
    this.showTrace(traceAhead(this.sea, cell));
    sfx.tick();
  };

  private readonly onSeaMove = (e: FederatedPointerEvent) => {
    const t = this.tracing;
    if (!t || e.pointerId !== t.id) return;
    const p = this.ctx.stage.toLocal(e.global);
    const g = this.L.grid;
    if (p.x < g.x || p.y < g.y || p.x > g.x + g.w || p.y > g.y + g.h) return;
    const cell = cellAt(this.L, this.plan, p.x, p.y);
    const key = `${cell.r},${cell.c}`;
    if (key === t.key) return;
    t.key = key;
    this.showTrace(traceAhead(this.sea, cell));
  };

  private readonly onSeaUp = (e: { pointerId: number }) => {
    if (this.tracing && e.pointerId === this.tracing.id) this.tracing = null;
  };

  private showTrace(cells: Cell[], hold = false) {
    // A held trace (the hint's whole drift) stays until the card moves; a free one does not replace it.
    if (this.trace?.hold && !hold) return;
    this.trace = { cells, t: 0, hold };
    this.drawTrace();
  }

  private clearTrace() {
    this.trace = null;
    this.traceG.clear();
  }

  private drawTrace() {
    const g = this.traceG.clear();
    const tr = this.trace;
    if (!tr) return;
    const pts = tr.cells.map((c) => cellCentre(this.L, c));
    const last = tr.cells[tr.cells.length - 1];
    const end = this.exitPoint(last);
    if (end && tr.hold) pts.push(end);
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1];
      const n = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 16));
      for (let k = 0; k < n; k++) g.circle(a.x + ((b.x - a.x) * k) / n, a.y + ((b.y - a.y) * k) / n, 6);
    }
    g.fill({ color: swatch.orange.fill });
    g.circle(pts[0].x, pts[0].y, 12).fill(swatch.orange.fill).stroke({ color: swatch.orange.line, width: 3 });
    const tip = pts[pts.length - 1];
    g.circle(tip.x, tip.y, 9).fill(swatch.orange.line);
  }

  /** Where a drift ending at `cell` leaves the sea, if that cell's current leaves it. */
  private exitPoint(cell: Cell): { x: number; y: number } | null {
    const d = this.sea.cells[cell.r][cell.c];
    const c = cellCentre(this.L, cell);
    const h = this.L.cell * 0.75;
    if (d === 'e' && cell.c === this.plan.cols - 1) return { x: c.x + h, y: c.y };
    if (d === 'w' && cell.c === 0) return { x: c.x - h, y: c.y };
    if (d === 's' && cell.r === this.plan.rows - 1) return { x: c.x, y: c.y + h };
    return null;
  }

  // Level 1: where will it wash up? -------------------------------------------------------------------

  private boatOf(col: number): Boat {
    return this.boats.find((b) => b.col === col)!;
  }

  private holdCard() {
    if (this.finished) return;
    const boat = this.plan.mode === 'predict' ? this.boats[this.index] : null;
    if (!boat) return;
    const card = cardArt(this.index + 1);
    card.position.set(boat.node.x - 40, boat.node.y - 66);
    card.scale.set(0);
    this.cardLayer.addChild(card);
    this.held = card;
    void this.ctx.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
  }

  private pickBeach(beach: Beach) {
    const turn = this.turn;
    if (this.finished || this.busy || !turn) return;
    const plate = this.plates.get(beach)!;
    this.press(plate);
    const col = this.plan.boats[this.index];
    const right = predict(this.sea, col, beach);
    const free = !this.seenDrift;
    const out = turn.choose(right, free);
    if (right || free) {
      void this.dropAndDrift(col, right ? 'right' : 'first');
      return;
    }
    // A counted wrong: the card stays; the first two cells from the boat light up.
    sfx.boing();
    this.wobble(this.friends.get(beach)!.art);
    const cells = traceAhead(this.sea, { r: 0, c: col }, 1);
    const dirs = cells.map((c) => DIR_WORD[this.sea.cells[c.r][c.c]]);
    this.showTrace(traceAhead(this.sea, { r: 0, c: col }));
    void this.ctx.say('drift.wrong.1', { dir: dirs[0], dir2: dirs[1] ?? dirs[0] });
    if (out.glow) this.drawGlow();
  }

  /** The card drops from its boat and rides the currents to whoever finds it. */
  private async dropAndDrift(col: number, why: 'right' | 'first' | 'wrong') {
    this.busy = true;
    this.clearTrace();
    this.drawGlow();
    const d = drift(this.sea, col);
    const boat = this.boatOf(col);
    const tw = this.ctx.tw;
    let card = this.held;
    this.held = null;
    if (!card) {
      card = cardArt(this.index + 1);
      card.position.set(boat.node.x - 40, boat.node.y - 66);
      this.cardLayer.addChild(card);
    }
    const first = cellCentre(this.L, d.path[0]);
    await tw.to(card, { x: first.x, y: first.y }, { duration: 0.4, ease: ease.inOutSine });
    sfx.splash();
    for (let i = 1; i < d.path.length; i++) {
      const p = cellCentre(this.L, d.path[i]);
      sfx.marimba(2 + (i % 8), 0.25);
      await tw.to(card, { x: p.x, y: p.y }, { duration: STEP, ease: ease.inOutSine });
    }
    sfx.wave(false);
    const f = this.friends.get(d.beach)!;
    const hand = { x: f.node.x + (f.found % 3) * 16 - 16, y: f.node.y - 70 - Math.floor(f.found / 3) * 10 };
    await tw.to(card, { x: hand.x, y: hand.y, rotation: -0.15 }, { duration: 0.5, ease: ease.inOutSine });
    if (this.finished) return;
    sfx.sparkle();
    this.wobble(f.art);
    this.seenDrift = true;
    if (why === 'wrong') {
      // Whoever found it waves it back to the boat; the request stays.
      const req = this.request!;
      await this.ctx.say('drift.wrong.2', { friend2: FRIEND[d.beach], friend: FRIEND[req.ask] });
      await tw.to(card, { x: boat.node.x - 40, y: boat.node.y - 66, alpha: 0 }, { duration: 0.6, ease: ease.inOutSine });
      if (this.finished) return;
      card.destroy();
      this.busy = false;
      this.drawGlow();
      return;
    }
    f.found++;
    if (why === 'first') await this.ctx.say('drift.first');
    else await this.ctx.say('drift.landed', { friend: FRIEND[d.beach], beach: BEACH_NAME[d.beach] });
    if (this.finished) return;
    this.index++;
    if (this.index >= this.turns.length) return void this.end();
    if (this.plan.mode === 'predict') this.holdCard();
    else this.nextSea();
    this.busy = false;
    this.drawGlow();
  }

  // Level 2: send it to a friend ----------------------------------------------------------------------

  private askFriend() {
    const req = this.request;
    if (!req || this.finished) return;
    for (const f of this.friends.values()) f.ask.visible = f.beach === req.ask;
    this.drawAsk();
    void this.ctx.instruct('drift.instruct.2', { friend: FRIEND[req.ask] });
  }

  private nextSea() {
    const req = this.request;
    if (!req) return;
    this.sea = req.sea;
    this.demoStep = -1;
    this.clearTrace();
    this.drawSea();
    this.askFriend();
  }

  private pickBoat(col: number) {
    const turn = this.turn;
    const req = this.request;
    if (this.finished || this.busy || !turn || !req) return;
    this.press(this.boatOf(col).node);
    const right = boatsFor(this.sea, this.plan.boats, req.ask).includes(col);
    turn.choose(right);
    if (!right) sfx.boing();
    else sfx.pop(6);
    void this.dropAndDrift(col, right ? 'right' : 'wrong');
  }

  // Help --------------------------------------------------------------------------------------------

  /** Show me: level 1 traces the whole drift from the boat; level 2 glows a right boat. One hint per card or request. */
  private hint() {
    const turn = this.turn;
    if (this.finished || this.busy || !turn) return;
    turn.ask();
    if (this.plan.mode === 'predict') {
      const d = drift(this.sea, this.plan.boats[this.index]);
      this.showTrace(d.path, true);
      void this.ctx.say('drift.hint.1');
    } else {
      this.drawGlow(true);
      void this.ctx.say('drift.hint.2');
    }
  }

  /** The glow: the right beach (level 1) or a right boat (level 2), after two misses or on Show me. */
  private drawGlow(asked = false) {
    const g = this.glowG.clear();
    const turn = this.turn;
    if (this.finished || !turn || turn.done) return;
    if (this.plan.mode === 'predict') {
      // An asked hint at level 1 is the traced drift, not a glow.
      if (!turn.glow) return;
      const beach = drift(this.sea, this.plan.boats[this.index]).beach;
      const b = this.L.beaches[beach]!;
      g.roundRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8, 18).stroke({ color: swatch.orange.line, width: 10 });
    } else {
      if (!turn.glow && !turn.hinted && !asked) return;
      const col = boatsFor(this.sea, this.plan.boats, this.request!.ask)[0];
      const b = this.L.boats[this.plan.boats.indexOf(col)];
      g.roundRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8, 22).stroke({ color: swatch.orange.line, width: 10 });
    }
  }

  restart() {
    if (this.finished || this.busy) return;
    this.clearTrace();
    if (this.plan.mode === 'predict') {
      // The same sea from its first card; tries already made keep counting.
      this.banked = { misses: this.misses, hints: this.hints };
      this.turns = this.turns.map(() => new Turn());
      this.index = 0;
      this.cardLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
      this.held = null;
      for (const f of this.friends.values()) f.found = 0;
      this.holdCard();
      void this.ctx.instruct('drift.instruct.1');
    } else this.askFriend();
    this.drawGlow();
  }

  // The ghost finger ----------------------------------------------------------------------------------

  autotouch(): TouchIntent | null {
    if (this.finished || this.busy) return null;
    if (this.plan.mode === 'predict') {
      if (!this.held || this.ctx.tw.busy(this.held.scale)) return null;
      const col = this.plan.boats[this.index];
      const d = drift(this.sea, col);
      if (!this.demoTraced.has(this.index)) {
        this.demoTraced.add(this.index);
        return this.traceIntent(d.path);
      }
      return { tap: { on: this.plates.get(d.beach)! } };
    }
    const req = this.request;
    if (!req) return null;
    const right = boatsFor(this.sea, this.plan.boats, req.ask);
    // Trace from each boat in turn until one reaches the friend, then tap that boat.
    const order = this.plan.boats.slice(0, this.plan.boats.indexOf(right[0]) + 1);
    if (this.demoStep < order.length - 1) {
      this.demoStep++;
      return this.traceIntent(drift(this.sea, order[this.demoStep]).path);
    }
    return { tap: { on: this.boatOf(right[0]).node } };
  }

  private traceIntent(path: Cell[]): TouchIntent {
    const pts = path.map((c) => cellCentre(this.L, c));
    return { trace: { on: this.seaHit, x: pts[0].x, y: pts[0].y }, via: pts.slice(1).map((p) => ({ on: this.seaHit, x: p.x, y: p.y })), receiver: this.seaHit, pause: 0.3 };
  }

  // Round end -------------------------------------------------------------------------------------------

  private async end() {
    if (this.finished) return;
    this.finished = true;
    this.clearTrace();
    this.glowG.clear();
    for (const f of this.friends.values()) f.ask.visible = false;
    this.ctx.pet.cheer();
    sfx.tada();
    if (!realSaid) {
      realSaid = true;
      await this.ctx.say('drift.real');
    } else await this.ctx.say('drift.done');
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  // Layout and drawing ----------------------------------------------------------------------------------

  private press(node: Container) {
    if (this.ctx.tw.busy(node.scale)) return;
    void this.ctx.tw.to(node.scale, { x: 0.92, y: 0.92 }, { duration: 0.08 }).then(() => this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack }));
  }

  private wobble(node: Container) {
    if (this.ctx.tw.busy(node)) return;
    void this.ctx.tw.to(node, { rotation: 0.14 }, { duration: 0.1 }).then(() => this.ctx.tw.to(node, { rotation: 0 }, { duration: 0.5, ease: ease.outElastic }));
  }

  resize(v: View) {
    this.view = v;
    this.L = this.layoutFor(v);
    this.layoutAll();
  }

  private layoutAll() {
    const v = this.view;
    const L = this.L;
    const g = this.bg.clear();
    g.rect(0, 0, v.w, v.h).fill(0xcdeefb);
    // The harbour wall along the top of the sea.
    g.roundRect(L.wall.x, L.wall.y, L.wall.w, L.wall.h, 6).fill(WALL).stroke({ color: WALL_LINE, width: 3 });
    for (const [beach, b] of Object.entries(L.beaches) as [Beach, (typeof L.beaches)[Beach] & object][]) {
      g.roundRect(b.x + 3, b.y + 3, b.w - 6, b.h - 6, 16).fill(SAND).stroke({ color: SAND_LINE, width: 3 });
      const plate = this.plates.get(beach)!;
      plate.position.set(b.x + b.w / 2, b.y + b.h / 2);
      plate.hitArea = new Rectangle(-b.w / 2, -b.h / 2, b.w, b.h);
      plate.pivot.set(0, 0);
      const f = this.friends.get(beach)!;
      f.node.position.set(b.x + b.w / 2, b.y + b.h / 2 + 34);
    }
    this.plan.boats.forEach((_, i) => {
      const b = L.boats[i];
      const node = this.boats[i].node;
      node.position.set(b.x + b.w / 2, b.y + b.h - 8);
      node.hitArea = new Rectangle(-b.w / 2, -b.h + 8, b.w, b.h);
    });
    this.seaHit.hitArea = new Rectangle(L.grid.x, L.grid.y, L.grid.w, L.grid.h);
    if (this.held && this.plan.mode === 'predict') {
      const boat = this.boats[this.index];
      if (boat && !this.ctx.tw.busy(this.held)) this.held.position.set(boat.node.x - 40, boat.node.y - 66);
    }
    this.drawSea();
    this.drawAsk();
    this.drawTrace();
    this.drawGlow();
  }

  private drawSea() {
    const L = this.L;
    const g = this.seaG.clear();
    g.roundRect(L.grid.x - 6, L.grid.y, L.grid.w + 12, L.grid.h + 6, 10).fill(SEA);
    for (let r = 0; r < this.plan.rows; r++) {
      for (let c = 0; c < this.plan.cols; c++) {
        const x = L.grid.x + c * L.cell, y = L.grid.y + r * L.cell;
        g.rect(x + 2, y + 2, L.cell - 4, L.cell - 4).stroke({ color: SEA_DARK, width: 1.5, alpha: 0.35 });
        arrow(g, x + L.cell / 2, y + L.cell / 2, L.cell * 0.9, this.sea.cells[r][c]);
      }
    }
  }

  private drawAsk() {
    for (const f of this.friends.values()) {
      const g = f.ask.clear();
      if (!f.ask.visible) continue;
      // An empty hand held up: a bubble with a dotted card outline in it.
      // Beside the friend, so it never covers the sea's arrows.
      const side = f.beach === 'E' ? -1 : 1;
      g.roundRect(side > 0 ? 44 : -132, -92, 88, 60, 16).fill(0xffffff).stroke({ color: SAND_LINE, width: 3 });
      g.poly([side * 44, -70, side * 44, -54, side * 34, -50]).fill(0xffffff);
      g.roundRect(side > 0 ? 62 : -114, -80, 52, 36, 6).stroke({ color: SAND_LINE, width: 3, alpha: 0.8 });
    }
  }

  update(dt: number) {
    this.clock += dt;
    this.glowG.alpha = 0.6 + 0.4 * Math.sin(this.clock * 4);
    if (this.held) this.held.rotation = Math.sin(this.clock * 3) * 0.08;
    const tr = this.trace;
    if (tr && !tr.hold) {
      tr.t += dt;
      this.traceG.alpha = tr.t < TRACE_HOLD ? 1 : Math.max(0, 1 - (tr.t - TRACE_HOLD) * 2);
      if (tr.t > TRACE_HOLD + 0.5 && !this.tracing) this.clearTrace();
    } else this.traceG.alpha = 1;
    for (const f of this.friends.values()) if (f.ask.visible) f.ask.y = Math.sin(this.clock * 3) * 4;
    // A soft shimmer runs along every arrow so the currents look like moving water.
    const L = this.L;
    const g = this.shimmer.clear();
    for (let r = 0; r < this.plan.rows; r++) {
      for (let c = 0; c < this.plan.cols; c++) {
        const d = this.sea.cells[r][c];
        const k = ((this.clock * 0.5 + (r * 0.37 + c * 0.23)) % 1) - 0.5;
        const ctr = { x: L.grid.x + (c + 0.5) * L.cell, y: L.grid.y + (r + 0.5) * L.cell };
        const dx = d === 'e' ? 1 : d === 'w' ? -1 : 0, dy = d === 's' ? 1 : 0;
        const x = ctr.x + dx * k * L.cell * 0.8 + dy * L.cell * 0.32;
        const y = ctr.y + dy * k * L.cell * 0.8 + (dx ? L.cell * 0.32 : 0);
        g.moveTo(x - dx * 8, y - dy * 8).lineTo(x + dx * 8, y + dy * 8);
      }
    }
    g.stroke({ color: 0xffffff, width: 3, cap: 'round', alpha: 0.6 });
  }

  destroy() {
    window.removeEventListener('pointerup', this.onSeaUp);
    window.removeEventListener('pointercancel', this.onSeaUp, true);
  }
}

export const driftCards: GameModule = {
  id: 'drift-cards',
  name: 'Drift Cards',
  titleLine: 'game.drift-cards',
  region: 'tinker-lab',
  skills: ['ocean', 'currents', 'maps', 'evidence'],
  bands: ['school'],
  levels: (b) => rangeFor(BAND_LEVELS, b),
  describeLevel: (l) => dcPlan(l).name,
  music: STYLES.quiet,
  coplayHint: 'One of you is the sea and traces the arrows aloud ("down, down, across"); the other predicts or picks the boat. Swap each card.',
  offScreen: 'Draw a sea on paper with an arrow in every square. Put a button at the top and take turns moving it along the arrows. Where does it wash up?',
  hubIcon: () => new WigglyIcon(iconArt()),
  touchDemo: true,
  sticker: (seed) => iconArt(seed),
  create: (ctx) => new DriftCards(ctx),
};
