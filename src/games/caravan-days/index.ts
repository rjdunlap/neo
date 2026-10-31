/**
 * Caravan Days: pat a camel so it kneels, load it and walk it to the next water, a day at a time. Level 1 loads the camel
 * and walks it to the oasis (nothing counted); level 2 shows a fork with suns on each branch and a two-day waterskin, so
 * one oasis of two is within reach; level 3 plans a road of stops to the city so that no leg is longer than the skin;
 * level 4 gives the camel, at each oasis, the good the next stop wants; level 5 sends the three-bale load that brings more
 * shells at the named stop.
 * Rules: ./logic.ts; definition: docs/definitions/caravan-days.md.
 */
import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import type { LineId } from '../../content/voice-script';
import { baleArt, boardArt, bubbleArt, Camel, cityArt, flagArt, goArt, goodArt, homeArt, iconArt, loadArt, oasisArt, offerArt, SAND, shellRow, skinArt, stickerArt, sunArt } from './art';
import {
  afterTooLong, BALE_COLORS, better, camelAt, centre, choose, go, goLive, goSwap, hintFor, LANDMARKS, legSuns, legsOf, loadPlan, nextWant, loadStart, nextLoad, nextPlanMove, nextWorthMove, offersAt, pickOffer, planFor, planPlan, planStart, price, reachable, reachPlan, roadLayout, sell, SKIN, sunPoints, swapHint, swapPlan, swapStart, Tally, tapBale, tapCamel, tapStop, total, worthPlan, worthStart,
  type CaravanMap, type Good, type LoadPlan, type LoadState, type PlanPlan, type PlanState, type Pt, type ReachPlan, type RoadLayout, type RoadLine, type SwapPlan, type SwapRoad, type SwapState, type WorthPlan, type WorthState, type WorthStop,
} from './logic';

const LEVELS: BandLevels = {
  toddler: { min: 1, max: 1 },
  preschool: { min: 1, max: 2 },
  prek: { min: 2, max: 3 },
  school: { min: 3, max: 5 },
};

/** The next useful thing glows when nothing has been tapped for this long at level 1 (uncounted). */
const IDLE_GLOW = 8;
/** A spoken count comes from a bounded slot. */
const countLine = (prefix: string, n: number, max: number) => `${prefix}.${Math.max(1, Math.min(n, max))}` as LineId;

class CaravanDays implements Game {
  readonly plan: LoadPlan | ReachPlan | PlanPlan | SwapPlan | WorthPlan;
  readonly level: number;
  /** Level 1. */
  load: LoadState | null = null;
  /** Level 2's road or level 3's map in play. */
  roadIndex = 0;
  /** Level 3. */
  state: PlanState | null = null;
  /** Level 4: where the camel stands and what it carries; false until the camel has walked in to oasis 1. */
  swap: SwapState | null = null;
  walkedIn = false;
  /** Level 5: the load last looked at, and every load looked at in this case (they keep their shells showing). */
  worth: WorthState | null = null;
  seen = new Set<number>();
  readonly tallies = new Tally();
  /** An animation is running; inputs wait. */
  busy = false;
  finished = false;
  private alive = true;
  private epoch = 0;
  private clock = 0;
  private idle = 0;
  /** A short glow on the thing a rejected tap pointed at (level 1). */
  private nudge: { node: Container; until: number } | null = null;
  private walking = false;
  private view: View;
  private relayout = false;
  layoutNow: RoadLayout | null = null;
  /** Drops left in the skin. */
  skinFull = SKIN;
  private cityOpen = false;
  private readonly stepSeconds: number;

  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly roadLayer = new Container();
  private readonly flagLayer = new Container();
  /** The numbered flags, above the camel so none hides behind it. */
  private readonly markLayer = new Container();
  private readonly glow = new Graphics();
  camel: Camel | null = null;
  camelNode: Container | null = null;
  baleNodes: Container[] = [];
  stopNodes: Container[] = [];
  goNode: Container | null = null;
  private skinNode: Container | null = null;
  private cityNode: Container | null = null;
  private sunNodes: Container[][] = [];
  offerNodes: Container[] = [];
  private bubbleNodes: Container[] = [];
  loadNodes: Container[] = [];
  private friendNodes: Critter[] = [];
  /** Shells poured out beside the camel at level 5 (decoration, cleared at the next case or the walk home). */
  private poured: Container | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.level = planFor(ctx.level).level;
    this.plan = this.level === 1 ? loadPlan(ctx.band, ctx.rng) : this.level === 2 ? reachPlan(ctx.rng) : this.level === 3 ? planPlan(ctx.rng)
      : this.level === 4 ? swapPlan(ctx.rng) : worthPlan(ctx.rng);
    if (this.plan.level === 1) this.load = loadStart(this.plan);
    if (this.plan.level === 3) this.state = planStart();
    if (this.plan.level === 4) this.swap = swapStart();
    if (this.plan.level === 5) this.worth = worthStart();
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.stepSeconds = ctx.demo || reduce ? 0.22 : 0.7;
    this.backdrop = new Backdrop({ sky: [0xbfe3f7, 0xfff1d6], hills: [0xf2d9a4, 0xe6c48a, 0xd9b472], horizon: 0.44, clouds: 1, sun: true, seed: 233 }, ctx.view);
    this.glow.eventMode = 'none';
    this.roadLayer.eventMode = 'none';
    this.flagLayer.eventMode = 'none';
    this.markLayer.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.board);
  }

  get road() {
    return (this.plan as ReachPlan).roads[this.roadIndex];
  }

  get map(): CaravanMap {
    return (this.plan as PlanPlan).maps[this.roadIndex];
  }

  /** Level 4's road in play. */
  get swapRoad(): SwapRoad {
    return (this.plan as SwapPlan).roads[this.roadIndex];
  }

  /** Level 5: the stop named in this case. */
  get named(): WorthStop {
    return (this.plan as WorthPlan).named[this.roadIndex];
  }

  /** Round totals so far, for a check or the finish. */
  get tally() {
    return { misses: this.tallies.misses, hints: this.tallies.hints };
  }

  start() {
    this.build();
    const ask = this.ctx.instruct(`cd.instruct.${this.level}` as LineId);
    if (this.level >= 2) void ask.then(() => { if (this.alive) void this.ctx.say(`cd.history.${this.level}` as LineId); });
    if (this.level === 4) void this.walkIn();
  }

  destroy() {
    this.alive = false;
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    if (!this.layoutNow) return;
    if (this.busy || this.finished) { this.relayout = true; return; }
    this.build();
  }

  /** A guard after every await: the scene is alive and nothing rebuilt the board meanwhile. */
  private live(epoch: number) {
    return this.alive && epoch === this.epoch && !this.finished;
  }

  // ——— Building ———

  private build() {
    this.epoch++;
    this.relayout = false;
    this.camel = this.camelNode = this.goNode = this.skinNode = this.cityNode = null;
    this.baleNodes = [];
    this.stopNodes = [];
    this.sunNodes = [];
    this.offerNodes = [];
    this.bubbleNodes = [];
    this.loadNodes = [];
    this.friendNodes = [];
    this.poured = null;
    this.nudge = null;
    this.glow.removeFromParent();
    this.roadLayer.removeFromParent();
    this.flagLayer.removeFromParent();
    this.markLayer.removeFromParent();
    for (const c of this.roadLayer.removeChildren()) c.destroy({ children: true });
    for (const c of this.flagLayer.removeChildren()) c.destroy({ children: true });
    for (const c of this.markLayer.removeChildren()) c.destroy({ children: true });
    for (const c of this.board.removeChildren()) c.destroy({ children: true });
    if (this.finished) return;
    const l = roadLayout(this.level, this.plan, this.view, this.roadIndex);
    this.layoutNow = l;
    if (!l) return;
    this.board.addChild(this.roadLayer);
    this.drawRoads(l);
    this.board.addChild(this.flagLayer);
    if (this.plan.level === 1) this.buildLoad(l, this.plan);
    else if (this.plan.level === 2) this.buildReach(l);
    else if (this.plan.level === 3) this.buildPlan(l);
    else if (this.plan.level === 4) this.buildSwap(l);
    else this.buildWorth(l);
    this.board.addChild(this.markLayer, this.glow);
  }

  /** The sand roads with their suns; a sun or a road is a free look that counts its suns aloud. */
  private drawRoads(l: RoadLayout) {
    l.roads.forEach((r, i) => {
      const g = new Graphics();
      g.moveTo(r.from.x, r.from.y).lineTo(r.to.x, r.to.y).stroke({ width: 34, color: SAND.line, cap: 'round' });
      g.moveTo(r.from.x, r.from.y).lineTo(r.to.x, r.to.y).stroke({ width: 24, color: SAND.fill, cap: 'round' });
      g.eventMode = 'none';
      this.roadLayer.addChild(g);
      const suns = sunPoints(r).map((p) => {
        const s = new Container();
        s.position.copyFrom(p);
        s.addChild(sunArt());
        // Levels 2–3 count a road's suns on a tap; at 4–5 every leg is within the skin and the suns are scenery.
        if (this.level === 2 || this.level === 3) {
          s.hitArea = new Circle(0, 0, 46);
          onTap(s, () => this.lookAt(r.suns), { cooldown: 300 });
        } else s.eventMode = 'none';
        this.board.addChild(s);
        return s;
      });
      this.sunNodes[i] = suns;
    });
  }

  private placeCamel(at: Pt, scale: number): Camel {
    const camel = new Camel();
    camel.scale.set(scale);
    camel.position.copyFrom(at);
    this.board.addChild(camel);
    this.camel = camel;
    return camel;
  }

  private placeSkin(l: RoadLayout) {
    const skin = new Container();
    skin.position.copyFrom(l.skin);
    skin.addChild(skinArt(this.skinFull));
    skin.hitArea = new Rectangle(-90, -40, 180, 80);
    onTap(skin, () => { void this.ctx.say('cd.skin'); }, { cooldown: 400 });
    this.board.addChild(skin);
    this.skinNode = skin;
  }

  private redrawSkin() {
    const s = this.skinNode;
    if (!s) return;
    for (const c of s.removeChildren()) c.destroy({ children: true });
    s.addChild(skinArt(this.skinFull));
  }

  private stopNode(r: { x: number; y: number; w: number; h: number }, art: Container, onTapFn: (() => void) | null): Container {
    const node = new Container();
    node.position.copyFrom(centre(r));
    node.addChild(art);
    if (onTapFn) {
      node.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
      onTap(node, onTapFn, { cooldown: 200 });
    } else node.eventMode = 'none';
    this.board.addChild(node);
    return node;
  }

  private buildLoad(l: RoadLayout, plan: LoadPlan) {
    const s = this.load!;
    this.stopNodes = [this.stopNode(l.stops[0], oasisArt(plan.oasis), null)];
    // The camel's tap area sits under the camel, so a bale on its back takes its own tap first.
    const tap = new Container();
    tap.position.copyFrom(l.start);
    tap.hitArea = new Rectangle(-l.camel.w / 2, -l.camel.h / 2, l.camel.w, l.camel.h);
    onTap(tap, () => this.tapCamel(), { cooldown: 250 });
    this.board.addChild(tap);
    this.camelNode = tap;
    const camel = this.placeCamel(s.phase === 'walking' || s.phase === 'drinking' ? centre(l.stops[0]) : l.start, 1);
    camel.fold = s.phase === 'kneeling' ? 1 : 0;
    camel.pose();
    this.baleNodes = plan.colors.map((color, i) => {
      const node = new Container();
      node.addChild(baleArt(color));
      const r = l.bales[i];
      if (s.on[i]) {
        node.position.copyFrom(this.loadSlot(i));
        camel.load.addChild(node);
      } else {
        node.position.copyFrom(centre(r));
        this.board.addChild(node);
      }
      node.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
      onTap(node, () => this.tapBale(i), { cooldown: 250 });
      return node;
    });
  }

  private buildReach(l: RoadLayout) {
    const road = this.road;
    this.stopNodes = [0, 1].map((b) => this.stopNode(l.stops[b], oasisArt(road.landmarks[b], 120, this.tallies.glowing && reachable(road) === b), () => this.tapOasis(b as 0 | 1)));
    const camel = this.placeCamel(l.start, 0.75);
    this.loadBales(camel, 2);
    this.placeSkin(l);
  }

  private buildPlan(l: RoadLayout) {
    const map = this.map;
    const s = this.state!;
    this.stopNodes = map.stops.map((stop) => {
      const art = stop.kind === 'home' ? homeArt() : stop.kind === 'city' ? cityArt(120, this.cityOpen) : oasisArt(stop.landmark!);
      const node = this.stopNode(l.stops[stop.id], art, () => this.tapStop(stop.id));
      if (stop.kind === 'city') this.cityNode = node;
      return node;
    });
    const camel = this.placeCamel(this.standAt(camelAt(map, s)), 0.55);
    this.loadBales(camel, 2);
    this.placeSkin(l);
    const g = l.go!;
    const node = new Container();
    node.position.copyFrom(centre(g));
    node.addChild(goArt(g.w, g.h, goLive(map, s)));
    node.hitArea = new Rectangle(-g.w / 2, -g.h / 2, g.w, g.h);
    onTap(node, () => this.tapGo(), { cooldown: 300 });
    this.board.addChild(node);
    this.goNode = node;
    this.redrawPlan();
  }

  /** Where the camel stands at a level-3 stop: a little below the water. */
  private standAt(stop: number): Pt {
    const c = centre(this.layoutNow!.stops[stop]);
    return { x: c.x, y: c.y + 48 };
  }

  private loadBales(camel: Camel, n: number) {
    for (let i = 0; i < n; i++) {
      const b = baleArt(BALE_COLORS[(i + this.roadIndex) % BALE_COLORS.length]);
      b.position.copyFrom(this.loadSlot(i));
      camel.load.addChild(b);
    }
  }

  /** A bale's place on the camel's back. */
  private loadSlot(i: number): Pt {
    return { x: -56 + i * 44, y: (i % 2) * -14 - 6 };
  }

  /** Level 3: the flags on the planned stops, the planned roads lit, Go live only with the city flagged. */
  private redrawPlan() {
    const l = this.layoutNow;
    const s = this.state;
    if (!l || !s || this.plan.level !== 3) return;
    for (const c of this.flagLayer.removeChildren()) c.destroy({ children: true });
    for (const c of this.markLayer.removeChildren()) c.destroy({ children: true });
    const map = this.map;
    let at = map.home;
    s.plan.forEach((stop, i) => {
      const from = centre(l.stops[at]);
      const to = centre(l.stops[stop]);
      // The lit road: the direct road, or the two roads through a skipped oasis.
      const via = legSuns(map, at, stop) !== null && !map.legs.some((lg) => lg.a === at && lg.b === stop)
        ? map.legs.find((lg) => lg.a === at && map.legs.some((n) => n.a === lg.b && n.b === stop))?.b
        : undefined;
      const g = new Graphics();
      const pts = via === undefined ? [from, to] : [from, centre(l.stops[via]), to];
      g.moveTo(pts[0].x, pts[0].y);
      for (const p of pts.slice(1)) g.lineTo(p.x, p.y);
      g.stroke({ width: 18, color: swatch.yellow.fill, cap: 'round', join: 'round' });
      this.flagLayer.addChild(g);
      const f = flagArt(i + 1);
      f.position.set(to.x - 50, to.y - 24);
      this.markLayer.addChild(f);
      at = stop;
    });
    if (this.goNode) {
      const g = l.go!;
      for (const c of this.goNode.removeChildren()) c.destroy({ children: true });
      this.goNode.addChild(goArt(g.w, g.h, goLive(map, s)));
    }
  }

  private redrawCity() {
    const n = this.cityNode;
    if (!n) return;
    for (const c of n.removeChildren()) c.destroy({ children: true });
    n.addChild(cityArt(120, this.cityOpen));
  }

  // ——— Shared motion ———

  private bob(node: Container) {
    node.scale.set(1.08, 0.92);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
  }

  private wobble(node: Container) {
    const x = node.x;
    void this.ctx.tw.to(node.position, { x: x + 10 }, { duration: 0.08 }).then(() => this.ctx.tw.to(node.position, { x: x - 10 }, { duration: 0.08 })).then(() => this.ctx.tw.to(node.position, { x }, { duration: 0.08 }));
  }

  /** The camel sways along to a point; it faces the way it goes. */
  private async walkTo(p: Pt, seconds: number) {
    const camel = this.camel;
    if (!camel) return;
    const s = Math.abs(camel.scale.x);
    camel.scale.x = p.x < camel.x - 4 ? -s : s;
    this.walking = true;
    await this.ctx.tw.to(camel.position, { x: p.x, y: p.y }, { duration: seconds, ease: ease.inOutSine });
    this.walking = false;
    camel.sway = 0;
    camel.pose();
  }

  /** One day's walk to the next sun: a note, dust, and a drop out of the skin. */
  private async walkDay(p: Pt, day: number) {
    await this.walkTo(p, this.stepSeconds);
    if (!this.alive) return;
    sfx.marimba(4 + day, 0.35);
    this.ctx.particles.burst(this.camel!.x, this.camel!.y + 4, { colors: [SAND.fill, SAND.dark], count: 5, speed: [20, 70] });
    this.skinFull = Math.max(0, this.skinFull - 1);
    this.redrawSkin();
  }

  /** The long drink: the neck dips, a slow slide, the skin refills. */
  private async drink(epoch: number) {
    const camel = this.camel;
    if (!camel) return;
    sfx.splash();
    await this.ctx.tw.to(camel, { dip: 1 }, { duration: this.stepSeconds, ease: ease.inOutSine });
    if (!this.live(epoch)) return;
    void this.ctx.say('cd.drink');
    sfx.sigh();
    await this.ctx.tw.wait(this.stepSeconds * 1.5);
    if (!this.live(epoch)) return;
    this.skinFull = SKIN;
    this.redrawSkin();
    await this.ctx.tw.to(camel, { dip: 0 }, { duration: this.stepSeconds * 0.6, ease: ease.inOutSine });
  }

  private async emptySkin(epoch: number) {
    const camel = this.camel;
    if (!camel) return;
    sfx.marimba(-3, 0.4);
    camel.sway = 0;
    await this.ctx.tw.to(camel, { sway: 0.6 }, { duration: 0.12 });
    if (!this.live(epoch)) return;
    await this.ctx.tw.to(camel, { sway: -0.6 }, { duration: 0.16 });
    if (!this.live(epoch)) return;
    await this.ctx.tw.to(camel, { sway: 0 }, { duration: 0.12 });
  }

  // ——— Level 1: kneel and load ———

  tapCamel() {
    const s = this.load;
    const camel = this.camel;
    if (!s || !camel || this.finished || this.plan.level !== 1) return;
    this.idle = 0;
    this.bob(camel);
    if (this.busy) return;
    const { state, event } = tapCamel(this.plan, s);
    this.load = state;
    if (event === 'kneel') {
      sfx.sigh();
      void this.ctx.say('cd.kneel');
      void this.ctx.tw.to(camel, { fold: 1 }, { duration: 0.5, ease: ease.outQuad });
    } else if (event === 'one-more') {
      void this.ctx.say('cd.one-more');
      const next = nextLoad(this.plan, state);
      if (next && 'bale' in next) this.nudge = { node: this.baleNodes[next.bale], until: this.clock + 2 };
    } else if (event === 'walk') void this.walkLoad();
  }

  tapBale(i: number) {
    const s = this.load;
    const node = this.baleNodes[i];
    const camel = this.camel;
    if (!s || !node || !camel || this.finished || this.plan.level !== 1) return;
    this.idle = 0;
    this.bob(node);
    if (this.busy) return;
    const { state, event } = tapBale(s, i);
    this.load = state;
    if (event === 'tap-camel') {
      this.wobble(node);
      void this.ctx.say('cd.tap-camel');
      this.nudge = { node: this.camelNode!, until: this.clock + 2 };
    } else if (event === 'on') {
      const n = state.on.filter(Boolean).length;
      sfx.marimba(2 + n, 0.4);
      void this.ctx.say(countLine('cd.count', n, 4));
      this.hop(node, camel.load, this.loadSlot(i));
    } else if (event === 'off') {
      sfx.pop(5);
      this.hop(node, this.board, centre(this.layoutNow!.bales[i]));
    }
  }

  /** A bale hops from where it is into `parent` at `to`, in a little arc. */
  private hop(node: Container, parent: Container, to: Pt) {
    const from = parent.toLocal(node.getGlobalPosition());
    parent.addChild(node);
    node.position.copyFrom(from);
    void this.ctx.tw.to(node.position, { x: to.x, y: to.y - 60 }, { duration: 0.18, ease: ease.outQuad }).then(() => this.ctx.tw.to(node.position, { y: to.y }, { duration: 0.16, ease: ease.inQuad }));
  }

  /** The loaded camel stands, bells, walks to the oasis and drinks: the ending. */
  private async walkLoad() {
    const epoch = this.epoch;
    const camel = this.camel;
    const l = this.layoutNow;
    const plan = this.plan as LoadPlan;
    if (!camel || !l) return;
    this.busy = true;
    for (const b of this.baleNodes) b.eventMode = 'none';
    if (this.camelNode) this.camelNode.eventMode = 'none';
    sfx.bell(5, 0.25);
    sfx.bell(9, 0.25);
    void this.ctx.say('cd.off-we-go');
    await this.ctx.tw.to(camel, { fold: 0 }, { duration: 0.45, ease: ease.outBack });
    if (!this.live(epoch)) return;
    const road = l.roads[0];
    const to = { x: road.to.x - 60, y: road.to.y + 56 };
    const steps = 3;
    for (let i = 1; i <= steps; i++) {
      await this.walkTo({ x: camel.x + (to.x - camel.x) / (steps - i + 1), y: camel.y + (to.y - camel.y) / (steps - i + 1) }, this.stepSeconds);
      if (!this.live(epoch)) return;
      sfx.marimba(4 + i, 0.3);
      this.ctx.particles.burst(camel.x, camel.y + 4, { colors: [SAND.fill, SAND.dark], count: 5, speed: [20, 70] });
    }
    void this.ctx.say(`cd.arrive.${plan.oasis}` as LineId);
    await this.drink(epoch);
    if (!this.live(epoch)) return;
    this.load = { ...this.load!, phase: 'drinking' };
    this.celebrate();
  }

  // ——— Level 2: can we reach it? ———

  /** A free look: the pet counts a road's suns. */
  private lookAt(suns: number) {
    if (this.finished) return;
    void this.ctx.say(countLine('cd.suns', suns, 5));
  }

  tapOasis(b: 0 | 1) {
    const node = this.stopNodes[b];
    if (!node || this.finished || this.plan.level !== 2) return;
    this.bob(node);
    if (this.busy) return;
    const result = choose(this.road, b);
    if (result.reachable) void this.walkBranch(b);
    else void this.tooFar(b, this.road.suns[b]);
  }

  private async walkBranch(b: 0 | 1) {
    const epoch = this.epoch;
    const l = this.layoutNow;
    const camel = this.camel;
    if (!l || !camel) return;
    this.busy = true;
    const road = l.roads[b];
    const pts = sunPoints(road);
    for (let i = 0; i < pts.length; i++) {
      await this.walkDay({ x: pts[i].x, y: pts[i].y + 50 }, i);
      if (!this.live(epoch)) return;
    }
    await this.walkTo({ x: road.to.x - 50, y: road.to.y + 56 }, this.stepSeconds);
    if (!this.live(epoch)) return;
    void this.ctx.say(`cd.arrive.${this.road.landmarks[b]}` as LineId);
    await this.drink(epoch);
    if (!this.live(epoch)) return;
    this.nextRoad();
  }

  /** The far oasis: the camel walks the skin's days, runs dry, shakes its head and comes back. One miss. */
  private async tooFar(b: 0 | 1, suns: number) {
    const epoch = this.epoch;
    const l = this.layoutNow;
    const camel = this.camel;
    if (!l || !camel) return;
    this.busy = true;
    const road = l.roads[b];
    const pts = sunPoints(road);
    for (let i = 0; i < SKIN; i++) {
      await this.walkDay({ x: pts[i].x, y: pts[i].y + 50 }, i);
      if (!this.live(epoch)) return;
    }
    void this.ctx.say(countLine('cd.too-far', suns, 4));
    await this.emptySkin(epoch);
    if (!this.live(epoch)) return;
    await this.walkTo(l.start, this.stepSeconds * 1.4);
    if (!this.live(epoch)) return;
    camel.scale.x = Math.abs(camel.scale.x);
    this.skinFull = SKIN;
    this.redrawSkin();
    this.tallies.miss();
    if (this.tallies.glowing) {
      void this.ctx.say('cd.glow');
      this.redrawOases();
    }
    this.busy = false;
    if (this.relayout) this.build();
  }

  private redrawOases() {
    if (this.plan.level !== 2) return;
    const road = this.road;
    this.stopNodes.forEach((node, b) => {
      for (const c of node.removeChildren()) c.destroy({ children: true });
      node.addChild(oasisArt(road.landmarks[b], 120, this.tallies.glowing && reachable(road) === b));
    });
  }

  /** The second road or map starts with its own counts; after the last, the celebration. */
  private nextRoad() {
    this.tallies.next();
    this.roadIndex++;
    const p = this.plan;
    const count = p.level === 2 || p.level === 4 ? p.roads.length : p.level === 3 ? p.maps.length : p.level === 5 ? p.named.length : 1;
    if (this.roadIndex >= count) { this.celebrate(); return; }
    this.skinFull = SKIN;
    this.cityOpen = false;
    if (p.level === 3) this.state = planStart();
    if (p.level === 4) { this.swap = swapStart(); this.walkedIn = false; }
    if (p.level === 5) { this.worth = worthStart(); this.seen.clear(); }
    this.busy = false;
    this.build();
    const line: LineId = p.level === 2 ? 'cd.next-road' : p.level === 3 ? 'cd.next-map' : p.level === 4 ? 'cd.next-swap' : 'cd.next-case';
    void this.ctx.say(line);
    if (p.level === 4) void this.walkIn();
  }

  // ——— Level 3: day by day across the map ———

  tapStop(stop: number) {
    const node = this.stopNodes[stop];
    const s = this.state;
    if (!node || !s || this.finished || this.plan.level !== 3) return;
    this.bob(node);
    if (this.busy) return;
    const { state, event } = tapStop(this.map, s, stop);
    const stood = camelAt(this.map, s);
    this.state = state;
    if (event === 'flag') { sfx.pop(8); this.redrawPlan(); }
    else if (event === 'take-out') {
      sfx.tick();
      this.redrawPlan();
      // Taking out a flag the camel has reached: it ambles back to the last flag that stays (or home).
      const now = camelAt(this.map, state);
      if (now !== stood && this.camel) void this.amble(this.standAt(now));
    }
    else if (event === 'not-adjacent') { this.wobble(node); void this.ctx.say('cd.not-straight'); }
  }

  /** The camel ambles back to the last flag that stays; inputs wait for it, as for every walk. */
  private async amble(to: Pt) {
    const epoch = this.epoch;
    this.busy = true;
    await this.walkTo(to, this.stepSeconds);
    if (!this.live(epoch)) return;
    if (this.camel) this.camel.scale.x = Math.abs(this.camel.scale.x);
    this.busy = false;
    if (this.relayout) this.build();
  }

  tapGo() {
    const node = this.goNode;
    const s = this.state;
    if (!node || !s || this.finished || this.plan.level !== 3) return;
    this.bob(node);
    if (this.busy) return;
    if (!goLive(this.map, s)) { void this.ctx.say('cd.plan-to-city'); return; }
    void this.walkPlan();
  }

  /** The roads a leg is made of: one, or two through a skipped oasis. */
  private legRoads(a: number, b: number): RoadLine[] {
    const l = this.layoutNow!;
    const road = (x: number, y: number) => l.roads.find((r) => r.a === x && r.b === y);
    const direct = road(a, b);
    if (direct) return [direct];
    for (const mid of this.map.legs.filter((lg) => lg.a === a).map((lg) => lg.b)) {
      const first = road(a, mid);
      const second = road(mid, b);
      if (first && second) return [first, second];
    }
    return [];
  }

  /** On Go: the camel walks the plan leg by leg, refilling at each flag; an over-long leg runs the skin dry and the camel comes back. */
  private async walkPlan() {
    const epoch = this.epoch;
    const l = this.layoutNow;
    const camel = this.camel;
    const s = this.state;
    if (!l || !camel || !s) return;
    this.busy = true;
    const map = this.map;
    const verdict = go(map, s);
    const legs = legsOf(map, s);
    for (let i = s.walked; i < s.plan.length; i++) {
      const from = i === 0 ? map.home : s.plan[i - 1];
      const to = s.plan[i];
      const roads = this.legRoads(from, to);
      const days = roads.flatMap((r) => sunPoints(r).map((p) => ({ x: p.x, y: p.y + 50 })));
      if (!verdict.arrived && verdict.leg === i) {
        for (let d = 0; d < SKIN && d < days.length; d++) {
          await this.walkDay(days[d], d);
          if (!this.live(epoch)) return;
        }
        void this.ctx.say(countLine('cd.too-long', legs[i], 5));
        await this.emptySkin(epoch);
        if (!this.live(epoch)) return;
        await this.walkTo(this.standAt(from), this.stepSeconds * 1.4);
        if (!this.live(epoch)) return;
        camel.scale.x = Math.abs(camel.scale.x);
        this.skinFull = SKIN;
        this.redrawSkin();
        this.state = afterTooLong(s, i);
        this.tallies.miss();
        this.redrawPlan();
        if (this.tallies.glowing) void this.ctx.say('cd.glow');
        this.busy = false;
        if (this.relayout) this.build();
        return;
      }
      for (let d = 0; d < days.length; d++) {
        await this.walkDay(days[d], d);
        if (!this.live(epoch)) return;
      }
      await this.walkTo(this.standAt(to), this.stepSeconds);
      if (!this.live(epoch)) return;
      s.walked = i + 1;
      const stop = map.stops[to];
      if (stop.kind === 'city') break;
      sfx.splash();
      void this.ctx.say(`cd.arrive.${stop.landmark}` as LineId);
      this.skinFull = SKIN;
      this.redrawSkin();
    }
    // The city: the gate opens, bells, and the long drink at its well.
    this.cityOpen = true;
    this.redrawCity();
    sfx.bell(5, 0.25);
    sfx.bell(9, 0.25);
    void this.ctx.say('cd.arrive.city');
    this.ctx.particles.burst(camel.x, camel.y - 60, { colors: [swatch.yellow.fill, 0x9fd3f2, 0xffffff], count: 12 });
    await this.drink(epoch);
    if (!this.live(epoch)) return;
    this.nextRoad();
  }

  // ——— Levels 4–5: the road of stops ———

  /** Where the camel stands at a level 4–5 stop: on the road, a little below the water. */
  private groundAt(stop: number): Pt {
    const c = centre(this.layoutNow!.stops[stop]);
    return { x: c.x, y: c.y + 48 };
  }

  /** Speak a line built from slots, one after another; stops if the scene goes. */
  private async sayAll(ids: LineId[]) {
    for (const id of ids) {
      if (!this.alive) return;
      await this.ctx.say(id);
    }
  }

  /** Home, the oases and the city, as scenery: at levels 4–5 the offers, bubbles, boards and loads are the inputs. */
  private buildRow(l: RoadLayout, marks: [string, string], open: boolean) {
    this.stopNodes = [0, 1, 2, 3].map((i) => {
      const art = i === 0 ? homeArt() : i === 3 ? cityArt(120, open) : oasisArt(marks[i - 1] as never);
      const node = this.stopNode(l.stops[i], art, null);
      if (i === 3) this.cityNode = node;
      return node;
    });
  }

  /** A good's spoken name. */
  private goodLine(g: Good): LineId {
    return `cd.good.${g}` as LineId;
  }

  // Level 4: swap at the stop.

  private buildSwap(l: RoadLayout) {
    const road = this.swapRoad;
    const s = this.swap!;
    this.buildRow(l, road.landmarks, this.cityOpen);
    // A friend at each oasis and at the city gate: scenery, frozen, never a target.
    this.friendNodes = road.friends.map((name, i) => {
      const c = centre(l.stops[i + 1]);
      const f = new Critter(CRITTERS[name]);
      f.alive = false;
      f.eventMode = 'none';
      f.scale.set(0.3);
      f.position.set(c.x + 74, c.y + 62);
      this.board.addChild(f);
      return f;
    });
    // The want bubbles: a free look that names the good.
    this.bubbleNodes = (l.bubbles ?? []).map((r, i) => this.stopNode(r, bubbleArt(road.wants[i]), () => this.tapBubble(i)));
    const camel = this.placeCamel(this.groundAt(this.walkedIn ? s.at : 0), 0.55);
    this.dressCamel(camel);
    this.offerNodes = (l.offers ?? []).map((r, side) => {
      const node = new Container();
      node.position.copyFrom(centre(r));
      node.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
      onTap(node, () => this.tapOffer(side as 0 | 1), { cooldown: 200 });
      this.board.addChild(node);
      return node;
    });
    this.placeGo(l, false);
    this.redrawSwap();
  }

  /** The good the camel carries rides on its back: `carry0` before the walk in, then the picked offer. */
  private dressCamel(camel: Camel) {
    for (const c of camel.load.removeChildren()) c.destroy({ children: true });
    const good = this.plan.level === 4 ? (this.walkedIn ? this.swap!.carried : this.swapRoad.carry0) : null;
    if (good) {
      const art = goodArt(good, 120);
      art.position.set(-6, -30);
      camel.load.addChild(art);
    } else if (this.plan.level === 5) this.loadBales(camel, 2);
  }

  private placeGo(l: RoadLayout, live: boolean) {
    const g = l.go!;
    const node = new Container();
    node.position.copyFrom(centre(g));
    node.addChild(goArt(g.w, g.h, live));
    node.hitArea = new Rectangle(-g.w / 2, -g.h / 2, g.w, g.h);
    onTap(node, () => this.tapGoRoad(), { cooldown: 300 });
    this.board.addChild(node);
    this.goNode = node;
  }

  private redrawGo(live: boolean) {
    const g = this.layoutNow?.go;
    if (!this.goNode || !g) return;
    for (const c of this.goNode.removeChildren()) c.destroy({ children: true });
    this.goNode.addChild(goArt(g.w, g.h, live));
  }

  /** The offers where the camel stands (hidden on the walk in and at the city), the carried good, Go live once one is picked. */
  private redrawSwap() {
    const s = this.swap;
    if (!s || this.plan.level !== 4) return;
    const offers = this.walkedIn ? offersAt(this.swapRoad, s) : null;
    // A stop the camel has reached already took its good: its bubble fades.
    this.bubbleNodes.forEach((node, i) => { node.alpha = this.walkedIn && i + 1 <= s.at ? 0.55 : 1; });
    this.offerNodes.forEach((node, side) => {
      for (const c of node.removeChildren()) c.destroy({ children: true });
      node.visible = !!offers;
      if (offers) node.addChild(offerArt(offers[side], 120, s.carried === offers[side]));
    });
    if (this.camel) this.dressCamel(this.camel);
    this.redrawGo(this.walkedIn && !!s.carried && s.at < 3);
  }

  /** A free look: the stop's want, named. */
  private tapBubble(i: number) {
    if (this.finished) return;
    void this.sayAll(['cd.wants', this.goodLine(this.swapRoad.wants[i])]);
  }

  /** Pick an offer (the other one swaps back): free, never counted. */
  tapOffer(side: 0 | 1) {
    const node = this.offerNodes[side];
    const s = this.swap;
    if (!node || !s || this.finished || this.plan.level !== 4 || !node.visible) return;
    this.bob(node);
    if (this.busy || !this.walkedIn) return;
    this.swap = pickOffer(this.swapRoad, s, side);
    sfx.pop(6 + side);
    if (this.swap.carried) void this.ctx.say(this.goodLine(this.swap.carried));
    this.redrawSwap();
  }

  /** Go, at level 4 or 5. */
  tapGoRoad() {
    const node = this.goNode;
    if (!node || this.finished || (this.plan.level !== 4 && this.plan.level !== 5)) return;
    this.bob(node);
    if (this.busy) return;
    if (this.plan.level === 4) {
      if (!this.walkedIn || !this.swap) return;
      const r = goSwap(this.swapRoad, this.swap);
      if (r.event === 'pick-first') { void this.ctx.say('cd.pick-first'); return; }
      void this.walkSwap(r.event === 'wanted');
      return;
    }
    const w = this.worth!;
    if (w.looked === null) { void this.ctx.say('cd.look-first'); return; }
    void this.walkSell(w.looked);
  }

  /** The camel walks the leg after `stop`, a sun a day, then up to the next stop. */
  private async walkLeg(stop: number, epoch: number) {
    const l = this.layoutNow!;
    const pts = sunPoints(l.roads[stop]);
    for (let d = 0; d < pts.length; d++) {
      await this.walkDay({ x: pts[d].x, y: pts[d].y + 48 }, d);
      if (!this.live(epoch)) return;
    }
    await this.walkTo(this.groundAt(stop + 1), this.stepSeconds);
  }

  /** On entry (and each new road): the camel walks home → oasis 1, whose friend takes `carry0`; the offers appear. */
  private async walkIn() {
    const epoch = this.epoch;
    if (!this.camel || this.walkedIn) return;
    this.busy = true;
    await this.walkLeg(0, epoch);
    if (!this.live(epoch)) return;
    this.camel.scale.x = Math.abs(this.camel.scale.x);
    sfx.splash();
    this.skinFull = SKIN;
    const friend = this.friendNodes[0];
    if (friend) this.bob(friend);
    sfx.pop(9);
    this.walkedIn = true;
    this.swap = swapStart();
    this.busy = false;
    if (this.relayout) this.build();
    else this.redrawSwap();
  }

  /** Go at level 4: the next stop takes the good gladly, or shrugs and the camel walks back (one miss). */
  private async walkSwap(wanted: boolean) {
    const epoch = this.epoch;
    const s = this.swap!;
    const road = this.swapRoad;
    const camel = this.camel;
    if (!camel || !this.layoutNow) return;
    this.busy = true;
    this.offerNodes.forEach((n) => { n.visible = false; });
    await this.walkLeg(s.at, epoch);
    if (!this.live(epoch)) return;
    const friend = this.friendNodes[s.at];
    if (wanted) {
      const r = goSwap(road, s);
      if (r.event !== 'wanted') return;
      if (friend) this.bob(friend);
      sfx.marimba(7, 0.4);
      this.swap = r.state;
      if (r.city) {
        this.cityOpen = true;
        this.redrawCity();
        this.dressCamel(camel);
        sfx.bell(5, 0.25);
        sfx.bell(9, 0.25);
        void this.ctx.say('cd.arrive.city');
        this.ctx.particles.burst(camel.x, camel.y - 60, { colors: [swatch.yellow.fill, 0x9fd3f2, 0xffffff], count: 12 });
        await this.drink(epoch);
        if (!this.live(epoch)) return;
        this.nextRoad();
        return;
      }
      void this.ctx.say('cd.took-it');
      sfx.splash();
      this.skinFull = SKIN;
      this.redrawSkin();
      this.busy = false;
      if (this.relayout) this.build();
      else this.redrawSwap();
      return;
    }
    // Not wanted: the friend shrugs, the pet names both goods, the camel goes back to the stop it came from.
    if (friend) this.wobble(friend);
    void this.sayAll(['cd.wants', this.goodLine(nextWant(road, s)!), 'cd.not', this.goodLine(s.carried!)]);
    await this.emptySkin(epoch);
    if (!this.live(epoch)) return;
    await this.walkTo(this.groundAt(s.at), this.stepSeconds * 1.4);
    if (!this.live(epoch)) return;
    camel.scale.x = Math.abs(camel.scale.x);
    this.skinFull = SKIN;
    this.tallies.miss();
    if (this.tallies.glowing) void this.ctx.say('cd.glow');
    this.busy = false;
    if (this.relayout) this.build();
    else this.redrawSwap();
  }

  // Level 5: worth more far away.

  /** The goods of a load's three bales, up goods first. */
  private loadGoods(load: 0 | 1): Good[] {
    const p = this.plan as WorthPlan;
    const [u, d] = p.loads[load];
    return [...Array<Good>(u).fill(p.goods[0]), ...Array<Good>(d).fill(p.goods[1])];
  }

  /** Each bale's price at the named stop. */
  private loadPrices(load: 0 | 1): number[] {
    const p = this.plan as WorthPlan;
    const [u, d] = p.loads[load];
    return [...Array<number>(u).fill(price(p, 0, this.named)), ...Array<number>(d).fill(price(p, 1, this.named))];
  }

  private buildWorth(l: RoadLayout) {
    const p = this.plan as WorthPlan;
    this.buildRow(l, p.landmarks, false);
    // The named stop: a glowing ring and a shell bubble above it (scenery).
    const named = centre(l.stops[this.named]);
    const mark = new Container();
    mark.eventMode = 'none';
    const g = new Graphics();
    g.ellipse(0, 20, 78, 40).fill({ color: swatch.yellow.fill, alpha: 0.45 });
    g.roundRect(-34, -128, 68, 58, 20).fill(0xffffff).stroke({ width: 4, color: SAND.line });
    g.moveTo(-8, -72).lineTo(0, -58).lineTo(10, -72).closePath().fill(0xffffff);
    mark.addChild(g);
    const shell = shellRow(1, 38);
    shell.position.set(0, -100);
    mark.addChild(shell);
    mark.position.copyFrom(named);
    this.board.addChildAt(mark, this.board.getChildIndex(this.stopNodes[0]));
    // The price boards: a free look that names each good's price there.
    (l.boards ?? []).forEach((r, i) => {
      const stop = (i + 1) as WorthStop;
      this.stopNode(r, boardArt(p.goods, [price(p, 0, stop), price(p, 1, stop)], r.w, r.h, stop === this.named), () => this.tapBoard(stop));
    });
    const camel = this.placeCamel(this.groundAt(0), 0.55);
    this.dressCamel(camel);
    this.loadNodes = (l.loads ?? []).map((r, i) => {
      const node = new Container();
      node.position.copyFrom(centre(r));
      node.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
      onTap(node, () => this.tapLoad(i as 0 | 1), { cooldown: 250 });
      this.board.addChild(node);
      return node;
    });
    this.placeGo(l, this.worth!.looked !== null);
    this.redrawLoads();
  }

  private redrawLoads() {
    const w = this.worth;
    const r = this.layoutNow?.loads;
    if (!w || !r) return;
    this.loadNodes.forEach((node, i) => {
      for (const c of node.removeChildren()) c.destroy({ children: true });
      const load = i as 0 | 1;
      node.addChild(loadArt(this.loadGoods(load), r[i].w, r[i].h, this.seen.has(i) ? this.loadPrices(load) : null, w.looked === i));
    });
    this.redrawGo(w.looked !== null);
  }

  /** A free look at a price board: each good's price there. */
  private tapBoard(stop: WorthStop) {
    if (this.finished) return;
    const p = this.plan as WorthPlan;
    void this.sayAll(['cd.price-here', this.goodLine(p.goods[0]), countLine('cd.shells', price(p, 0, stop), 20), this.goodLine(p.goods[1]), countLine('cd.shells', price(p, 1, stop), 20)]);
  }

  /** Look at a load: it lifts, its shells at the named stop show under its bales and the pet counts them. Free. */
  tapLoad(load: 0 | 1) {
    const node = this.loadNodes[load];
    const w = this.worth;
    if (!node || !w || this.finished || this.plan.level !== 5) return;
    this.bob(node);
    if (this.busy) return;
    this.worth = { looked: load };
    this.seen.add(load);
    sfx.marimba(3 + load * 2, 0.35);
    void this.ctx.say(countLine('cd.shells', total(this.plan, load, this.named), 20));
    this.redrawLoads();
  }

  /** Go at level 5: the camel carries the load to the named stop and the friend pours out its shells. */
  private async walkSell(load: 0 | 1) {
    const epoch = this.epoch;
    const camel = this.camel;
    const l = this.layoutNow;
    if (!camel || !l) return;
    this.busy = true;
    const p = this.plan as WorthPlan;
    const caseIndex = this.roadIndex;
    // The sent load rides on the camel.
    for (const c of camel.load.removeChildren()) c.destroy({ children: true });
    this.loadGoods(load).forEach((good, i) => {
      const art = goodArt(good, 70);
      art.position.set(-60 + i * 56, -20 - (i % 2) * 14);
      camel.load.addChild(art);
    });
    for (let stop = 0; stop < this.named; stop++) {
      await this.walkLeg(stop, epoch);
      if (!this.live(epoch)) return;
      if (stop + 1 < this.named) { sfx.splash(); this.skinFull = SKIN; }
    }
    camel.scale.x = Math.abs(camel.scale.x);
    const result = sell(p, caseIndex, load);
    for (const c of camel.load.removeChildren()) c.destroy({ children: true });
    const poured = shellRow(result.got, 22, 5);
    poured.position.set(camel.x + (this.named === 3 ? -150 : 150), camel.y - 40);
    this.board.addChild(poured);
    this.poured = poured;
    sfx.marimba(5, 0.3);
    if (result.better) {
      sfx.bell(5, 0.25);
      sfx.bell(9, 0.25);
      if (this.named === 3) { this.cityOpen = true; this.redrawCity(); }
      await this.sayAll([countLine('cd.shells', result.got, 20), 'cd.more-shells']);
      if (!this.live(epoch)) return;
      await this.drink(epoch);
      if (!this.live(epoch)) return;
      this.nextRoad();
      return;
    }
    void this.sayAll([countLine('cd.shells', result.got, 20), 'cd.other-brings', countLine('cd.shells', result.other, 20)]);
    await this.emptySkin(epoch);
    if (!this.live(epoch)) return;
    await this.ctx.tw.wait(this.stepSeconds * 2);
    if (!this.live(epoch)) return;
    this.poured?.destroy({ children: true });
    this.poured = null;
    await this.walkTo(this.groundAt(0), this.stepSeconds * 2);
    if (!this.live(epoch)) return;
    camel.scale.x = Math.abs(camel.scale.x);
    this.dressCamel(camel);
    this.skinFull = SKIN;
    this.worth = worthStart();
    this.tallies.miss();
    if (this.tallies.glowing) void this.ctx.say('cd.glow');
    this.busy = false;
    if (this.relayout) this.build();
    else this.redrawLoads();
  }

  // ——— Finishing and help ———

  private celebrate() {
    if (this.finished) return;
    this.busy = true;
    sfx.tada();
    this.ctx.pet.cheer();
    const camel = this.camel;
    if (camel) this.ctx.particles.burst(camel.x, camel.y - 80, { colors: [swatch.yellow.fill, swatch.orange.fill, 0xffffff], count: 14 });
    const result = this.tally;
    void this.ctx.say('cd.done').then(() => {
      if (!this.alive || this.finished) return;
      this.finished = true;
      this.ctx.finish(result);
    });
  }

  hintLabel = 'Help';

  /** The pet's Help: at level 1 the ask again (free); at levels 2–3 the glow, the road's or map's one hint if not yet spent. */
  askForHint() {
    if (this.finished) return;
    if (this.plan.level === 1) { void this.ctx.instruct('cd.instruct.1'); return; }
    const line: LineId = this.plan.level === 2 ? 'cd.help.reach' : this.plan.level === 3 ? 'cd.help.plan' : this.plan.level === 4 ? 'cd.help.swap' : 'cd.help.worth';
    // During a walk the answer is spoken but the glow (and its one hint) waits for the road to be hers again.
    if (this.busy || (this.plan.level === 4 && !this.walkedIn)) { void this.ctx.say(line); return; }
    this.tallies.help();
    if (this.plan.level === 2) this.redrawOases();
    void this.ctx.say(line);
  }

  update(dt: number) {
    this.clock += dt;
    if (this.relayout && !this.busy && !this.finished) this.build();
    const camel = this.camel;
    if (camel && this.walking) { camel.sway = Math.sin(this.clock * 11); camel.pose(); }
    else if (camel && camel.dip > 0) camel.pose();
    else if (camel && this.ctx.tw.busy(camel)) camel.pose();
    if (this.plan.level === 1 && !this.busy && !this.finished) this.idle += dt;
    this.glow.clear();
    if (this.finished || !this.layoutNow || this.busy) return;
    const r = 1 + 0.05 * Math.sin(this.clock * 5);
    const ring = (node: Container, w: number, h: number) => {
      this.glow.roundRect(node.x - w / 2 - 10 * r, node.y - h / 2 - 10 * r, w + 20 * r, h + 20 * r, 30).stroke({ width: 8, color: swatch.yellow.fill });
    };
    if (this.plan.level === 1) {
      const l = this.layoutNow;
      let target = this.nudge && this.nudge.until > this.clock ? this.nudge.node : null;
      if (!target && this.idle >= IDLE_GLOW) {
        const next = nextLoad(this.plan, this.load!);
        target = next ? ('camel' in next ? this.camelNode : this.baleNodes[next.bale]) : null;
      }
      if (target === this.camelNode && this.camelNode) ring(this.camelNode, l.camel.w, l.camel.h);
      else if (target) ring(target, 110, 110);
    } else if (this.plan.level === 3 && this.tallies.glowing && this.state) {
      const h = hintFor(this.map, this.state);
      if ('go' in h) { if (this.goNode) ring(this.goNode, 140, 110); }
      else ring(this.stopNodes['flag' in h ? h.flag : h.takeOut], 120, 120);
    } else if (this.plan.level === 4 && this.tallies.glowing && this.swap && this.walkedIn) {
      const h = swapHint(this.swapRoad, this.swap);
      if (h && 'go' in h) { if (this.goNode) ring(this.goNode, 140, 110); }
      else if (h && this.offerNodes[h.side]) ring(this.offerNodes[h.side], 120, 120);
    } else if (this.plan.level === 5 && this.tallies.glowing) {
      const node = this.loadNodes[better(this.plan, this.roadIndex)];
      if (node) ring(node, 230, 150);
    }
  }

  /**
   * The ghost finger: kneel, each bale, the camel; the reachable water; the safe plan to the city, then Go; the good the next
   * stop wants, then Go; both loads, the better last, then Go. Never a far oasis, a decoy or the smaller load.
   */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy || !this.layoutNow) return null;
    if (this.plan.level === 1) {
      const next = nextLoad(this.plan, this.load!);
      if (!next) return null;
      if ('camel' in next) return this.camelNode ? { tap: { on: this.camelNode }, pause: 0.6 } : null;
      return { tap: { on: this.baleNodes[next.bale] }, pause: 0.45 };
    }
    if (this.plan.level === 2) return { tap: { on: this.stopNodes[reachable(this.road)] }, pause: 0.8 };
    if (this.plan.level === 4) {
      if (!this.walkedIn || !this.swap) return null;
      const h = swapHint(this.swapRoad, this.swap);
      if (!h) return null;
      if ('go' in h) return this.goNode ? { tap: { on: this.goNode }, pause: 0.8 } : null;
      return { tap: { on: this.offerNodes[h.side] }, pause: 0.6 };
    }
    if (this.plan.level === 5) {
      const move = nextWorthMove(this.plan, this.roadIndex, this.worth!, this.seen);
      if ('go' in move) return this.goNode ? { tap: { on: this.goNode }, pause: 0.8 } : null;
      return { tap: { on: this.loadNodes[move.load] }, pause: 1.2 };
    }
    const move = nextPlanMove(this.map, this.state!);
    if ('go' in move) return this.goNode ? { tap: { on: this.goNode }, pause: 0.8 } : null;
    return { tap: { on: this.stopNodes[move.stop] }, pause: 0.5 };
  }
}

class CamelIcon extends WigglyIcon {
  constructor() {
    super(iconArt());
  }
}

/** A seeded sticker: the camel with its bales at a landmark oasis. */
function sticker(seed: number): Container {
  const rng = new Rng(seed);
  return stickerArt(rng.pick(LANDMARKS), rng.shuffle(BALE_COLORS.slice()).slice(0, rng.int(2, 3)));
}

export const caravanDays: GameModule = {
  id: 'caravan-days',
  name: 'Caravan Days',
  titleLine: 'game.caravan-days',
  region: 'cozy-village',
  skills: ['counting', 'comparing', 'planning', 'cause-and-effect'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'Crier and driver: one of you counts each road\'s suns aloud, the other taps the water or the stops; swap after each road.',
  offScreen: 'Play "I packed my camel": take turns adding one thing to the load and saying the whole list from the start.',
  hubIcon: () => new CamelIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new CaravanDays(ctx),
};
