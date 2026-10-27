/**
 * Caravan Days: pat a camel so it kneels, load it and walk it to the next water, a day at a time. Level 1 loads the camel
 * and walks it to the oasis (nothing counted); level 2 shows a fork with suns on each branch and a two-day waterskin, so
 * one oasis of two is within reach; level 3 plans a road of stops to the city so that no leg is longer than the skin.
 * Rules: ./logic.ts; definition: docs/definitions/caravan-days.md.
 */
import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
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
import { baleArt, Camel, cityArt, flagArt, goArt, homeArt, iconArt, oasisArt, SAND, skinArt, stickerArt, sunArt } from './art';
import {
  afterTooLong, BALE_COLORS, camelAt, centre, choose, go, goLive, hintFor, LANDMARKS, legSuns, legsOf, loadPlan, loadStart, nextLoad, nextPlanMove, planFor, planPlan, planStart, reachable, reachPlan, roadLayout, SKIN, sunPoints, Tally, tapBale, tapCamel, tapStop,
  type CaravanMap, type LoadPlan, type LoadState, type PlanPlan, type PlanState, type Pt, type ReachPlan, type RoadLayout, type RoadLine,
} from './logic';

const LEVELS: BandLevels = {
  toddler: { min: 1, max: 1 },
  preschool: { min: 1, max: 2 },
  prek: { min: 2, max: 3 },
  school: { min: 3, max: 3 },
};

/** The next useful thing glows when nothing has been tapped for this long at level 1 (uncounted). */
const IDLE_GLOW = 8;
/** A spoken count comes from a bounded slot. */
const countLine = (prefix: string, n: number, max: number) => `${prefix}.${Math.max(1, Math.min(n, max))}` as LineId;

class CaravanDays implements Game {
  readonly plan: LoadPlan | ReachPlan | PlanPlan;
  readonly level: number;
  /** Level 1. */
  load: LoadState | null = null;
  /** Level 2's road or level 3's map in play. */
  roadIndex = 0;
  /** Level 3. */
  state: PlanState | null = null;
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

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.level = planFor(ctx.level).level;
    this.plan = this.level === 1 ? loadPlan(ctx.band, ctx.rng) : this.level === 2 ? reachPlan(ctx.rng) : planPlan(ctx.rng);
    if (this.plan.level === 1) this.load = loadStart(this.plan);
    if (this.plan.level === 3) this.state = planStart();
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

  /** Round totals so far, for a check or the finish. */
  get tally() {
    return { misses: this.tallies.misses, hints: this.tallies.hints };
  }

  start() {
    this.build();
    void this.ctx.instruct(`cd.instruct.${this.level}` as LineId);
    if (this.level >= 2) void this.ctx.say(`cd.history.${this.level}` as LineId);
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
    else this.buildPlan(l);
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
        if (this.level >= 2) {
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
      g.stroke({ width: 12, color: swatch.yellow.fill, cap: 'round', join: 'round', alpha: 0.85 });
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
      for (const b of this.baleNodes) if (b.parent === this.board) void this.ctx.tw.to(b.position, { x: b.x - 16 }, { duration: 0.4, ease: ease.outQuad });
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
    const count = this.plan.level === 2 ? (this.plan as ReachPlan).roads.length : (this.plan as PlanPlan).maps.length;
    if (this.roadIndex >= count) { this.celebrate(); return; }
    this.skinFull = SKIN;
    this.cityOpen = false;
    if (this.plan.level === 3) this.state = planStart();
    this.busy = false;
    this.build();
    void this.ctx.say(this.plan.level === 2 ? 'cd.next-road' : 'cd.next-map');
  }

  // ——— Level 3: day by day across the map ———

  tapStop(stop: number) {
    const node = this.stopNodes[stop];
    const s = this.state;
    if (!node || !s || this.finished || this.plan.level !== 3) return;
    this.bob(node);
    if (this.busy) return;
    const { state, event } = tapStop(this.map, s, stop);
    this.state = state;
    if (event === 'flag') { sfx.pop(8); this.redrawPlan(); }
    else if (event === 'take-out') { sfx.tick(); this.redrawPlan(); }
    else if (event === 'not-adjacent') { this.wobble(node); void this.ctx.say('cd.not-straight'); }
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
    if (this.busy) return;
    this.tallies.help();
    if (this.plan.level === 2) { this.redrawOases(); void this.ctx.say('cd.help.reach'); return; }
    void this.ctx.say('cd.help.plan');
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
    }
  }

  /** The ghost finger: kneel, each bale, the camel; the reachable water; the safe plan to the city, then Go. Never a far oasis. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy || !this.layoutNow) return null;
    if (this.plan.level === 1) {
      const next = nextLoad(this.plan, this.load!);
      if (!next) return null;
      if ('camel' in next) return this.camelNode ? { tap: { on: this.camelNode }, pause: 0.6 } : null;
      return { tap: { on: this.baleNodes[next.bale] }, pause: 0.45 };
    }
    if (this.plan.level === 2) return { tap: { on: this.stopNodes[reachable(this.road)] }, pause: 0.8 };
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
