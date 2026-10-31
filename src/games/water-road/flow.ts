/**
 * Water Road levels 4–5: water arrives at last. Level 4 sets the road between the spring and the town's fountain (pre-K
 * picks one of two whole channels; school sets two piers with up and down arrows), then Open the spring: the water runs
 * stretch by stretch and pools where a stretch does not go down (one miss). Level 5 carries the falling channel over a
 * valley: drag arches across the spans and a block to each earth end, then open the spring; every arch unheld on a side
 * slides back to the tray (one miss). Rules: ./logic.ts; definition: docs/definitions/water-road.md (levels 4–5, AM3).
 */
import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import type { LineId } from '../../content/voice-script';
import {
  abutmentArt, archPieceArt, arrowArt, arrowButtonArt, cardArt, channelArt, groundArt, hillArt, openButtonArt, pierArt, pierPlaceArt, placeArt, SKY, townArt, valleyArt, WATER,
} from './art';
import {
  abutmentsFor, ARROW, CARD, centre, chooseChannel, downhillPlan, downhillStart, END_SLOT, ENDS, firstUnsupported, heights, heightY, heldSides, moveAbutment, moveArch,
  nextRoad, openSpring, openValley, pierHint, planFor, pressArrow, roadNow, SPAN, Tally, TRAY_ABUT, valleyHint, valleyPlan, waterBotMove, waterLayout,
  type DownhillPlan, type DownhillState, type End, type Problem, type Pt, type Rect, type Valley, type ValleyPlan, type ValleyState, type WaterLayout,
} from './logic';

interface Piece {
  kind: 'arch' | 'abutment';
  node: Container;
  handle: DragHandle;
  /** A span index (arch), an end (abutment), or the tray. */
  where: number | End | 'tray';
  /** Its own place in the tray. */
  spot: number;
}

export class WaterFlow implements Game {
  readonly plan: DownhillPlan | ValleyPlan;
  readonly level: 4 | 5;
  ds: DownhillState | null = null;
  vs: ValleyState | null = null;
  readonly tallies = new Tally();
  /** An animation is running; inputs wait. */
  busy = false;
  finished = false;
  private alive = true;
  private epoch = 0;
  private clock = 0;
  private view: View;
  private relayout = false;
  layoutNow: WaterLayout | null = null;
  private readonly stepSeconds: number;
  private readonly reduce: boolean;

  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly roadLayer = new Container();
  private readonly water = new Graphics();
  private readonly glow = new Graphics();
  private readonly push = new Container();
  /** Level 4: how far the water has run (stretches, fractional), and the stretch where it pooled. */
  private readonly flow = { reach: 0, pool: 0 };
  private stuckAt: number | null = null;
  /** Level 5: the water's front over the valley, and where it spilled. */
  private readonly front = { x: -1, spill: 0 };
  private problem: { rect: Rect; until: number } | null = null;

  cardNodes: Container[] = [];
  arrowNodes: { up: Container; down: Container }[] = [];
  openNode: Container | null = null;
  pieces: Piece[] = [];
  private placeNodes: { spans: Container[]; ends: Record<End, Container> } | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.level = planFor(ctx.level).level === 5 ? 5 : 4;
    if (this.level === 4) {
      const plan = downhillPlan(ctx.band, ctx.rng);
      this.plan = plan;
      this.ds = downhillStart(plan);
    } else {
      const plan = valleyPlan(ctx.rng);
      this.plan = plan;
      this.vs = { valley: 0, arcade: { arches: Array.from({ length: plan.valleys[0].spans }, () => false), abut: { near: false, far: false } }, done: false };
    }
    this.reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.stepSeconds = ctx.demo || this.reduce ? 0.2 : 0.55;
    this.backdrop = new Backdrop({ sky: [SKY.top, SKY.bottom], hills: [0xe9d3b0, 0xdcc097, 0xcfae84], horizon: 0.5, clouds: 2, sun: false, seed: 313 }, ctx.view);
    for (const g of [this.water, this.glow, this.push]) g.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.board);
  }

  get tally() {
    return { misses: this.tallies.misses, hints: this.tallies.hints };
  }

  /** The valley in play at level 5. */
  get valley(): Valley | null {
    return this.plan.level === 5 && this.vs ? this.plan.valleys[this.vs.valley] : null;
  }

  private get instructLine(): LineId {
    if (this.level === 5) return 'wr.instruct.5';
    return (this.plan as DownhillPlan).kind === 'cards' ? 'wr.instruct.4p' : 'wr.instruct.4';
  }

  start() {
    this.build();
    void this.ctx.instruct(this.instructLine)
      .then(() => this.ctx.say('wr.history.water'))
      .then(() => { if (this.alive && !this.finished) void this.ctx.say(this.level === 4 ? 'wr.rule.fall' : 'wr.rule.arcade'); });
  }

  destroy() {
    this.alive = false;
    for (const p of this.pieces) p.handle.destroy();
    this.pieces = [];
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    if (!this.layoutNow) return;
    if (this.busy || this.finished || this.pieces.some((p) => p.handle.dragging)) { this.relayout = true; return; }
    this.build();
  }

  private live(epoch: number) {
    return this.alive && epoch === this.epoch && !this.finished;
  }

  // ——— Building ———

  private build() {
    this.epoch++;
    this.relayout = false;
    this.problem = null;
    for (const p of this.pieces) p.handle.destroy();
    this.pieces = [];
    this.cardNodes = [];
    this.arrowNodes = [];
    this.openNode = null;
    this.placeNodes = null;
    for (const g of [this.roadLayer, this.water, this.glow, this.push]) g.removeFromParent();
    for (const c of this.roadLayer.removeChildren()) c.destroy({ children: true });
    for (const c of this.push.removeChildren()) c.destroy({ children: true });
    for (const c of this.board.removeChildren()) c.destroy({ children: true });
    this.water.clear();
    if (this.finished) return;
    const valley = this.valley;
    const l = waterLayout(this.level, this.ctx.band, this.view, valley?.spans ?? 4);
    this.layoutNow = l;
    if (!l) return;
    if (this.plan.level === 4) this.buildRoad(l, this.plan);
    else this.buildValley(l, valley!);
    this.board.addChild(this.glow, this.push);
  }

  private button(r: Rect, art: Container, fn: () => void): Container {
    const node = new Container();
    node.position.copyFrom(centre(r));
    node.addChild(art);
    node.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
    onTap(node, () => { this.dip(node); fn(); }, { cooldown: 200 });
    this.board.addChild(node);
    return node;
  }

  /** Touch-down feedback: the button presses in for a moment. */
  private dip(node: Container) {
    if (this.ctx.tw.busy(node.scale)) return;
    void this.ctx.tw.to(node.scale, { x: 0.92, y: 0.92 }, { duration: 0.06 }).then(() => this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.16, ease: ease.outBack }));
  }

  private buildRoad(l: WaterLayout, plan: DownhillPlan) {
    const s = this.ds!;
    const r = plan.roads[s.road];
    const v = this.view;
    this.board.addChild(groundArt(v.w, l.ground, v.h));
    this.board.addChild(hillArt(l.xs[0], heightY(l, r.spring), l.ground));
    this.board.addChild(townArt(l.xs[3], heightY(l, r.fountain), l.ground));
    this.board.addChild(this.roadLayer, this.water);
    this.redrawRoad();
    if (plan.kind === 'cards') {
      l.cards.forEach((rect, i) => {
        const node = this.button(rect, cardArt(CARD.w, CARD.h, [r.spring, ...r.cards![i], r.fountain], s.chosen === i ? 'chosen' : 'idle'), () => this.tapCard(i as 0 | 1));
        this.cardNodes.push(node);
      });
    } else {
      l.arrows.forEach((a, pier) => {
        const up = this.button(a.up, arrowButtonArt(ARROW.w, ARROW.h, 1), () => this.tapArrow(pier, 1));
        const down = this.button(a.down, arrowButtonArt(ARROW.w, ARROW.h, -1), () => this.tapArrow(pier, -1));
        this.arrowNodes.push({ up, down });
      });
    }
    this.openNode = this.button(l.open, openButtonArt(l.open.w, l.open.h), () => this.open());
  }

  /** The piers and the channel as they stand now. */
  private redrawRoad() {
    const l = this.layoutNow;
    if (!l || this.plan.level !== 4 || !this.ds) return;
    for (const c of this.roadLayer.removeChildren()) c.destroy({ children: true });
    const road = roadNow(this.plan, this.ds);
    const r = this.plan.roads[this.ds.road];
    if (!road) {
      for (const x of l.xs.slice(1, 3)) { const p = pierPlaceArt(l.ground); p.x = x; this.roadLayer.addChild(p); }
      // Stubs at the spring and the fountain, waiting for a channel.
      this.roadLayer.addChild(channelArt([{ x: l.xs[0], y: heightY(l, r.spring) }, { x: l.xs[0] + 40, y: heightY(l, r.spring) + 4 }]));
      this.roadLayer.addChild(channelArt([{ x: l.xs[3] - 40, y: heightY(l, r.fountain) - 4 }, { x: l.xs[3], y: heightY(l, r.fountain) }]));
      return;
    }
    road.piers.forEach((h, i) => { const p = pierArt(l.ground, heightY(l, h) + 10); p.x = l.xs[i + 1]; this.roadLayer.addChild(p); });
    this.roadLayer.addChild(channelArt(this.points()));
  }

  /** The road's points: the spring, each pier top and the fountain. */
  private points(): Pt[] {
    const l = this.layoutNow!;
    const road = this.plan.level === 4 && this.ds ? roadNow(this.plan, this.ds) : null;
    return road ? heights(road).map((h, i) => ({ x: l.xs[i], y: heightY(l, h) })) : [];
  }

  private buildValley(l: WaterLayout, valley: Valley) {
    const s = this.vs!;
    const v = this.view;
    const ends = l.ends!;
    this.board.addChild(valleyArt(v, l.deck, l.ground, ends.near, ends.far, valley.ends, SPAN.h));
    // The piers the arches stand on, at every span boundary.
    for (let i = 0; i <= valley.spans; i++) {
      const p = pierArt(l.ground, l.deck + SPAN.h - 6, 30);
      p.x = l.spans[0].x + i * SPAN.w;
      this.board.addChild(p);
    }
    // The channel comes off the hill on the near bank and carries on to the town on the far bank.
    const springAt = { x: ends.near.x + 30, y: l.deck - 46 };
    this.board.addChild(channelArt([springAt, { x: ends.near.x + END_SLOT.w, y: l.deck - 14 }]));
    const fountainAt = { x: ends.far.x + END_SLOT.w / 2 + 10, y: l.deck - 40 };
    this.board.addChild(channelArt([{ x: ends.far.x, y: l.deck - 12 }, { x: fountainAt.x - 24, y: l.deck - 10 }]));
    this.board.addChild(townArt(fountainAt.x, fountainAt.y, l.deck - 14));
    const spring = new Graphics();
    spring.roundRect(springAt.x - 30, springAt.y - 18, 52, 30, 10).fill(0xdfd3bd).stroke({ width: 4, color: 0xa89a82 });
    spring.ellipse(springAt.x - 4, springAt.y - 10, 18, 6).fill(WATER.fill);
    spring.eventMode = 'none';
    this.board.addChild(spring);
    this.board.addChild(this.water);
    // The places pieces go, and the tray's spots.
    const place = (r: Rect) => { const n = new Container(); n.position.copyFrom(centre(r)); n.eventMode = 'none'; this.board.addChild(n); return n; };
    this.placeNodes = { spans: l.spans.map(place), ends: { near: place(ends.near), far: place(ends.far) } };
    for (const r of [...l.trayArches.slice(0, valley.spans), ...l.trayAbutments.slice(0, abutmentsFor(valley))]) {
      const n = place(r);
      n.addChild(placeArt(r.w, r.h, 'idle'));
      n.alpha = 0.6;
    }
    this.redrawPlaces();
    // The pieces, where the state has them.
    const placedSpans = s.arcade.arches.map((on, i) => (on ? i : -1)).filter((i) => i >= 0);
    for (let k = 0; k < valley.spans; k++) this.addPiece('arch', k < placedSpans.length ? placedSpans[k] : 'tray', k);
    const placedEnds = ENDS.filter((e) => s.arcade.abut[e]);
    for (let k = 0; k < abutmentsFor(valley); k++) this.addPiece('abutment', k < placedEnds.length ? placedEnds[k] : 'tray', k);
    this.openNode = this.button(l.open, openButtonArt(l.open.w, l.open.h), () => this.open());
  }

  private addPiece(kind: Piece['kind'], where: Piece['where'], spot: number) {
    const node = new Container();
    const size = kind === 'arch' ? SPAN : TRAY_ABUT;
    node.addChild(kind === 'arch' ? archPieceArt(SPAN.w, SPAN.h) : abutmentArt(TRAY_ABUT.w, TRAY_ABUT.h));
    node.hitArea = new Rectangle(-size.w / 2, -size.h / 2, size.w, size.h);
    const piece = { kind, node, where, spot } as Piece;
    node.position.copyFrom(this.homeOf(piece));
    this.board.addChild(node);
    piece.handle = draggable(node, this.ctx.tw, {
      onPick: () => { sfx.pop(4); this.showPush(piece); },
      onMove: (x, y) => this.redrawPlaces(this.targetFor(piece, x, y)),
      onDrop: (x, y) => this.drop(piece, x, y),
    });
    if (this.busy) piece.handle.enabled = false;
    this.pieces.push(piece);
  }

  private homeOf(p: Piece): Pt {
    const l = this.layoutNow!;
    if (p.where === 'tray') return centre(p.kind === 'arch' ? l.trayArches[p.spot] : l.trayAbutments[p.spot]);
    return typeof p.where === 'number' ? centre(l.spans[p.where]) : centre(l.ends![p.where]);
  }

  /** The place under a carried piece, by the nearest centre within reach; the tray anywhere near its spots. */
  private targetFor(p: Piece, x: number, y: number): number | End | 'tray' | null {
    const l = this.layoutNow;
    if (!l?.ends) return null;
    let best: number | End | null = null;
    let d = p.kind === 'arch' ? SPAN.w * 0.75 : END_SLOT.w * 0.9;
    const places: [number | End, Rect][] = p.kind === 'arch' ? l.spans.map((r, i) => [i, r] as [number, Rect]) : ENDS.map((e) => [e, l.ends![e]] as [End, Rect]);
    for (const [key, r] of places) {
      const c = centre(r);
      const dd = Math.hypot(c.x - x, c.y - y);
      if (dd < d) { d = dd; best = key; }
    }
    if (best !== null) return best;
    const tray = [...l.trayArches, ...l.trayAbutments];
    const top = Math.min(...tray.map((r) => r.y)) - 40;
    return y >= top ? 'tray' : null;
  }

  private drop(p: Piece, x: number, y: number): boolean {
    this.clearPush();
    this.redrawPlaces();
    const valley = this.valley;
    const s = this.vs;
    if (!valley || !s || this.busy || this.finished) return false;
    const to = this.targetFor(p, x, y);
    if (to === null) return false;
    const next = p.kind === 'arch'
      ? moveArch(valley, s.arcade, p.where as number | 'tray', to as number | 'tray')
      : moveAbutment(valley, s.arcade, p.where as End | 'tray', to as End | 'tray');
    if (!next) return false;
    this.vs = { ...s, arcade: next };
    p.where = to;
    const home = this.homeOf(p);
    p.handle.home = home;
    sfx.clunk();
    void this.ctx.tw.to(p.node.position, { x: home.x, y: home.y }, { duration: 0.2, ease: ease.outQuad });
    this.redrawPlaces();
    return true;
  }

  private redrawPlaces(hover: number | End | 'tray' | null = null) {
    const n = this.placeNodes;
    const l = this.layoutNow;
    if (!n || !l?.ends) return;
    const draw = (node: Container, r: Rect, key: number | End) => {
      for (const c of node.removeChildren()) c.destroy({ children: true });
      node.addChild(placeArt(r.w, r.h, hover === key ? 'bright' : 'idle'));
    };
    n.spans.forEach((node, i) => draw(node, l.spans[i], i));
    for (const e of ENDS) draw(n.ends[e], l.ends[e], e);
  }

  /** Faint push arrows at an unheld side of a placed arch while a finger is on it. */
  private showPush(p: Piece) {
    this.clearPush();
    const valley = this.valley;
    const l = this.layoutNow;
    if (!valley || !l || !this.vs || p.kind !== 'arch' || typeof p.where !== 'number') return;
    const held = heldSides(valley, this.vs.arcade, p.where);
    const r = l.spans[p.where];
    for (const [side, ok] of [['left', held.near], ['right', held.far]] as const) {
      if (ok) continue;
      const a = arrowArt(side);
      a.alpha = 0.55;
      a.scale.set(0.7);
      a.position.set(side === 'left' ? r.x + 10 : r.x + r.w - 10, r.y + r.h * 0.55);
      this.push.addChild(a);
    }
  }

  private clearPush() {
    for (const c of this.push.removeChildren()) c.destroy({ children: true });
  }

  // ——— Level 4: Downhill all the way ———

  tapCard(card: 0 | 1) {
    const s = this.ds;
    if (!s || this.finished || this.plan.level !== 4 || this.busy) return;
    this.ds = chooseChannel(this.plan, s, card);
    this.stuckAt = null;
    sfx.pop(5 + card);
    this.redrawCards();
    this.redrawRoad();
  }

  private redrawCards() {
    const s = this.ds;
    if (!s || this.plan.level !== 4) return;
    const r = this.plan.roads[s.road];
    this.cardNodes.forEach((node, i) => {
      for (const c of node.removeChildren()) c.destroy({ children: true });
      node.addChild(cardArt(CARD.w, CARD.h, [r.spring, ...r.cards![i], r.fountain], s.chosen === i ? 'chosen' : 'idle'));
    });
  }

  tapArrow(pier: number, dir: 1 | -1) {
    const s = this.ds;
    if (!s || this.finished || this.plan.level !== 4 || this.busy) return;
    const { state, bumped } = pressArrow(this.plan, s, pier, dir);
    if (bumped) { sfx.knock(); return; }
    this.ds = state;
    this.stuckAt = null;
    sfx.pluck(dir === 1 ? 6 : 3, 0.25);
    this.redrawRoad();
  }

  /** Open the spring: the commit at both levels. */
  open() {
    if (this.finished || this.busy || this.pieces.some((p) => p.handle.dragging)) return;
    if (this.plan.level === 4) void this.openRoad();
    else void this.openArcade();
  }

  private async openRoad() {
    const plan = this.plan as DownhillPlan;
    const s = this.ds!;
    const o = openSpring(plan, s);
    if (o.event === 'none') { void this.ctx.say('wr.pick'); return; }
    const epoch = this.epoch;
    this.busy = true;
    this.stuckAt = null;
    this.ds = o.state;
    sfx.splash();
    const to = o.event === 'falls' ? 3 : o.at!;
    this.flow.reach = 0;
    this.flow.pool = 0;
    for (let k = 0; k < to; k++) {
      sfx.marimba(8 - k * 2, 0.35);
      if (this.reduce) this.flow.reach = k + 1;
      else await this.ctx.tw.to(this.flow, { reach: k + 1 }, { duration: this.stepSeconds, ease: ease.inQuad });
      if (!this.live(epoch)) return;
    }
    if (o.event === 'falls') {
      const f = this.points()[3];
      sfx.splash();
      this.ctx.particles.burst(f.x, f.y - 40, { colors: [WATER.fill, WATER.light, 0xffffff], count: 16, speed: [40, 120] });
      void this.ctx.say('wr.downhill');
      await this.ctx.tw.wait(this.stepSeconds * 2);
      if (!this.live(epoch)) return;
      if (s.road + 1 < plan.roads.length) {
        this.tallies.next();
        this.ds = nextRoad(plan, this.ds!);
        this.flow.reach = 0;
        this.busy = false;
        this.build();
        void this.ctx.say('wr.next-road');
        return;
      }
      this.celebrate(f);
      return;
    }
    // It pools in the stuck stretch: one miss; the water drains back and nothing she set moves.
    this.stuckAt = o.at;
    sfx.boing();
    if (this.reduce) this.flow.pool = 1;
    else await this.ctx.tw.to(this.flow, { pool: 1 }, { duration: this.stepSeconds * 0.8, ease: ease.outQuad });
    if (!this.live(epoch)) return;
    this.tallies.miss();
    await this.ctx.say(o.why === 'flat' ? 'wr.stood-still' : 'wr.went-up');
    if (!this.live(epoch)) return;
    if (this.reduce) { this.flow.reach = 0; this.flow.pool = 0; }
    else await this.ctx.tw.to(this.flow, { reach: 0, pool: 0 }, { duration: this.stepSeconds, ease: ease.inQuad });
    if (!this.live(epoch)) return;
    this.busy = false;
    if (this.tallies.glowing) void this.ctx.say(plan.kind === 'cards' ? 'wr.glow-channel' : 'wr.glow-pier');
    if (this.relayout) this.build();
  }

  // ——— Level 5: Over the valley ———

  private problemRect(p: Problem): Rect {
    const l = this.layoutNow!;
    return p.kind === 'gap' ? l.spans[p.span] : l.ends![p.end];
  }

  private async openArcade() {
    const plan = this.plan as ValleyPlan;
    const valley = this.valley!;
    const s = this.vs!;
    const l = this.layoutNow!;
    const epoch = this.epoch;
    const r = openValley(valley, s.arcade);
    this.busy = true;
    for (const p of this.pieces) p.handle.enabled = false;
    sfx.splash();
    const startX = l.ends!.near.x + 30;
    const endX = r.stands ? l.ends!.far.x + END_SLOT.w / 2 : centre(this.problemRect(r.problem!)).x;
    this.front.x = startX;
    this.front.spill = 0;
    const span = Math.max(1, Math.round((endX - startX) / SPAN.w));
    if (this.reduce) this.front.x = endX;
    else {
      for (let k = 1; k <= span; k++) {
        sfx.marimba(8 - k, 0.3);
        await this.ctx.tw.to(this.front, { x: startX + ((endX - startX) * k) / span }, { duration: this.stepSeconds * 0.6 });
        if (!this.live(epoch)) return;
      }
    }
    if (r.stands) {
      sfx.splash();
      this.ctx.particles.burst(endX + 10, l.deck - 70, { colors: [WATER.fill, WATER.light, 0xffffff], count: 16, speed: [40, 120] });
      void this.ctx.say('wr.across');
      this.vs = { ...s, done: true };
      await this.ctx.tw.wait(this.stepSeconds * 2.2);
      if (!this.live(epoch)) return;
      if (s.valley + 1 < plan.valleys.length) {
        this.tallies.next();
        const next = plan.valleys[s.valley + 1];
        this.vs = { valley: s.valley + 1, arcade: { arches: Array.from({ length: next.spans }, () => false), abut: { near: false, far: false } }, done: false };
        this.front.x = -1;
        this.busy = false;
        this.build();
        void this.ctx.say('wr.next-valley');
        return;
      }
      this.celebrate({ x: endX + 10, y: l.deck - 70 });
      return;
    }
    // It spills at the first problem; every arch unheld on a side slides down and back to the tray. One miss.
    this.problem = { rect: this.problemRect(r.problem!), until: this.clock + 2.4 };
    sfx.boing();
    if (!this.reduce) await this.ctx.tw.to(this.front, { spill: 1 }, { duration: this.stepSeconds });
    else this.front.spill = 1;
    if (!this.live(epoch)) return;
    const slid = this.pieces.filter((p) => p.kind === 'arch' && typeof p.where === 'number' && r.slid.includes(p.where));
    if (slid.length) sfx.rumble();
    this.vs = { ...s, arcade: r.arcade };
    this.tallies.miss();
    void this.ctx.say(r.problem!.kind === 'end' ? 'wr.slid.end' : 'wr.slid.gap');
    await Promise.all(slid.map(async (p) => {
      p.where = 'tray';
      if (this.reduce) { p.node.position.copyFrom(this.homeOf(p)); return; }
      await this.ctx.tw.to(p.node.position, { y: p.node.y + 80 }, { duration: this.stepSeconds * 0.8, ease: ease.inQuad });
      await this.ctx.tw.to(p.node.position, this.homeOf(p), { duration: this.stepSeconds, ease: ease.outQuad });
    }));
    if (!this.live(epoch)) return;
    for (const p of this.pieces) p.handle.home = this.homeOf(p);
    await this.ctx.tw.wait(this.stepSeconds);
    if (!this.live(epoch)) return;
    this.front.x = -1;
    this.front.spill = 0;
    for (const p of this.pieces) p.handle.enabled = true;
    this.busy = false;
    if (this.tallies.glowing) this.sayGlow();
    if (this.relayout) this.build();
  }

  private sayGlow() {
    if (this.plan.level === 4) { void this.ctx.say(this.plan.kind === 'cards' ? 'wr.glow-channel' : 'wr.glow-pier'); return; }
    const h = this.valley && this.vs ? valleyHint(this.valley, this.vs.arcade) : null;
    if (!h) { void this.ctx.say('wr.open'); return; }
    void this.ctx.say(h.kind === 'span' ? 'wr.glow-arch' : h.kind === 'end' ? 'wr.glow-end' : 'wr.glow-move');
  }

  // ——— Finishing and help ———

  private celebrate(at: Pt) {
    if (this.finished) return;
    this.busy = true;
    sfx.tada();
    this.ctx.pet.cheer();
    this.ctx.particles.burst(at.x, at.y, { colors: [swatch.yellow.fill, WATER.fill, 0xffffff], count: 18 });
    const result = this.tally;
    void this.ctx.say('wr.fountain').then(() => {
      if (!this.alive || this.finished) return;
      this.finished = true;
      this.ctx.finish(result);
    });
  }

  hintLabel = 'Help';

  /** The pet's Help: the glow, counted once per road or valley; free when there is nothing left to fix. */
  askForHint() {
    if (this.finished) return;
    const nothing = this.plan.level === 4
      ? !!this.ds && this.plan.kind === 'piers' && !pierHint(roadNow(this.plan, this.ds)!)
      : !!this.valley && !!this.vs && !firstUnsupported(this.valley, this.vs.arcade);
    if (nothing || (this.plan.level === 4 && !!this.ds && this.ds.chosen === this.plan.roads[this.ds.road].good)) { void this.ctx.say('wr.open'); return; }
    if (!this.busy) this.tallies.help();
    this.sayGlow();
  }

  update(dt: number) {
    this.clock += dt;
    if (this.relayout && !this.busy && !this.finished && !this.pieces.some((p) => p.handle.dragging)) this.build();
    this.drawWater();
    this.glow.clear();
    const l = this.layoutNow;
    if (this.finished || !l) return;
    const r = 1 + 0.05 * Math.sin(this.clock * 5);
    const ring = (rect: Rect, color: number = swatch.yellow.fill) => {
      this.glow.roundRect(rect.x - 10 * r, rect.y - 10 * r, rect.w + 20 * r, rect.h + 20 * r, 26).stroke({ width: 8, color });
    };
    if (this.problem && this.problem.until > this.clock && Math.floor(this.clock * 5) % 2 === 0) ring(this.problem.rect, swatch.red.fill);
    if (this.busy || !this.tallies.glowing) return;
    if (this.plan.level === 4 && this.ds && !this.ds.done) {
      if (this.plan.kind === 'cards') { const c = l.cards[this.plan.roads[this.ds.road].good]; if (c && this.ds.chosen !== this.plan.roads[this.ds.road].good) ring(c); else ring(l.open); return; }
      const h = pierHint(roadNow(this.plan, this.ds)!);
      if (!h) { ring(l.open); return; }
      const a = l.arrows[h.pier];
      if (a) ring(h.dir === 1 ? a.up : a.down);
      return;
    }
    if (this.plan.level === 5 && this.valley && this.vs && l.ends) {
      const h = valleyHint(this.valley, this.vs.arcade);
      if (!h) { ring(l.open); return; }
      ring(h.kind === 'span' ? l.spans[h.span] : h.kind === 'end' ? l.ends[h.end] : l.ends[h.from]);
    }
  }

  /** The water: along the road up to its reach and pooled in the stuck stretch (level 4), or across the deck (level 5). */
  private drawWater() {
    const g = this.water;
    g.clear();
    const l = this.layoutNow;
    if (!l) return;
    const stroke = (width: number, color: number, alpha = 1) => g.stroke({ width, color, alpha, cap: 'round', join: 'round' });
    if (this.plan.level === 4) {
      const pts = this.points();
      if (this.stuckAt !== null && pts[this.stuckAt + 1]) {
        g.moveTo(pts[this.stuckAt].x, pts[this.stuckAt].y).lineTo(pts[this.stuckAt + 1].x, pts[this.stuckAt + 1].y);
        stroke(44, WATER.fill, 0.35 + 0.15 * Math.sin(this.clock * 5));
      }
      if (this.flow.reach <= 0 || pts.length < 2) return;
      const full = Math.floor(this.flow.reach);
      g.moveTo(pts[0].x, pts[0].y);
      for (let k = 1; k <= Math.min(full, pts.length - 1); k++) g.lineTo(pts[k].x, pts[k].y);
      const frac = this.flow.reach - full;
      if (frac > 0 && pts[full + 1]) g.lineTo(pts[full].x + (pts[full + 1].x - pts[full].x) * frac, pts[full].y + (pts[full + 1].y - pts[full].y) * frac);
      stroke(10, WATER.deep);
      if (this.flow.pool > 0 && this.stuckAt !== null && pts[this.stuckAt + 1]) {
        const a = pts[this.stuckAt];
        const b = pts[this.stuckAt + 1];
        const flat = Math.abs(a.y - b.y) < 1;
        const t = (flat ? 1 : 0.3) * this.flow.pool;
        g.moveTo(a.x, a.y).lineTo(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
        stroke(18, WATER.fill);
        g.ellipse(a.x + 10, a.y - 4, 26 * this.flow.pool, 10 * this.flow.pool).fill(WATER.fill);
      }
      return;
    }
    if (this.front.x < 0 || !l.ends) return;
    const y = l.deck - 14;
    g.moveTo(l.ends.near.x + 30, l.deck - 46).lineTo(l.ends.near.x + END_SLOT.w, y).lineTo(Math.max(l.ends.near.x + END_SLOT.w, this.front.x), y);
    stroke(10, WATER.deep);
    if (this.front.spill > 0) {
      g.moveTo(this.front.x, y).lineTo(this.front.x, y + (l.ground - y) * this.front.spill);
      stroke(14, WATER.fill, 0.85);
      g.ellipse(this.front.x, l.ground, 50 * this.front.spill, 12 * this.front.spill).fill({ color: WATER.fill, alpha: 0.8 });
    }
  }

  /** The ghost finger: the falling card or the arrows along the hint, then Open; the arches from the spring side, a block to each earth end, then Open. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy || !this.layoutNow) return null;
    const move = waterBotMove(this.plan, this.plan.level === 4 ? this.ds! : this.vs!);
    if (!move) return null;
    if ('drag' in move) {
      const l = this.layoutNow;
      const piece = this.pieces.find((p) => (move.drag === 'arch' ? p.kind === 'arch' : p.kind === 'abutment') && p.where === move.from);
      const to = typeof move.to === 'number' ? centre(l.spans[move.to]) : centre(l.ends![move.to]);
      return piece ? { drag: { on: piece.node }, to: { on: this.ctx.stage, x: to.x, y: to.y }, pause: 0.4 } : null;
    }
    if (move.tap === 'open') return this.openNode ? { tap: { on: this.openNode }, pause: 1 } : null;
    if (move.tap === 'card') { const n = this.cardNodes[move.card]; return n ? { tap: { on: n }, pause: 0.6 } : null; }
    const a = this.arrowNodes[move.pier];
    return a ? { tap: { on: move.dir === 1 ? a.up : a.down }, pause: 0.45 } : null;
  }
}

