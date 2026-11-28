import { Container, Graphics, Rectangle, Sprite } from 'pixi.js';
import { CRITTERS, Critter } from '../../art/critter';
import { swatch } from '../../art/palette';
import { gradientTexture } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import type { CompanionRig } from '../../creatures/companion';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  TRAIL_STYLES,
  blanket,
  dotted,
  drawTrail,
  footprintStyle,
  friendBadge,
  homeDoor,
  mapTile,
  ribbon,
  trailFlag,
  turnedMark,
  walkSticker,
  wayPicture,
} from './art';
import {
  LEVELS,
  FRIEND_NAMES,
  LANDMARKS,
  LANDMARK_NAMES,
  FLAG,
  MAP_WALKER,
  STOPS,
  TILE,
  TRAILS,
  askHint,
  askedSlot,
  botSlot,
  callAt,
  calledTrail,
  describeWalk,
  groupOf,
  laneX,
  mapLayout,
  mapSpot,
  mapWalkerScale,
  nextHome,
  onMap,
  onTrails,
  planFor,
  restart,
  startWalk,
  step,
  stepHome,
  stopLayout,
  stopOrder,
  tapFlag,
  trailWays,
  walkedThere,
  waysAt,
  type MapLayout,
  type Plan,
  type Pt,
  type Stop,
  type StopLayout,
  type StepSound,
  type TrailStep,
  type WalkState,
  type Way,
} from './logic';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const SCALE = 0.5;
const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

class AdventureWalk implements Game {
  readonly state: WalkState;
  private view: View;
  private lay: StopLayout;
  private readonly bg = new Sprite(gradientTexture(0xc4ecff, 0xdff3c4));
  private readonly scene = new Container();
  private readonly trail = new Graphics();
  readonly zoneNodes: Container[] = [];
  private readonly pictures: Container[] = [];
  private readonly glows: Graphics[] = [];
  private readonly cards: Graphics[] = [];
  badgeNode: Container | null = null;
  private readonly walker: CompanionRig;
  finished = false;
  private gone = false;
  private busy = false;
  /** The stop on screen (the model's `stop` runs ahead of it while a walk plays). */
  private shown = 0;
  private readonly plan: Plan;
  /** The picnic picture (blanket and friend); on the map it shrinks to the path's end. */
  private picnic: Container | null = null;
  private friend: Critter | null = null;
  /** Level 4's map, built when the walk out reaches the picnic. */
  private map: Container | null = null;
  private mapLay: MapLayout | null = null;
  private readonly mapPath = new Graphics();
  private readonly door = homeDoor();
  private readonly tileGlow = new Graphics();
  tileNodes: Container[] = [];
  /** Where the companion is on the map: `STOPS` at the picnic, a stop's landmark, `-1` at home. */
  private at = STOPS;
  /** After a wrong tile it has taken one step towards the next landmark. */
  private nudged = false;
  /** Level 5: a flag per trail, and each trail's ribbon under the tiles and through its way on them. */
  flagNodes: Container[] = [];
  private readonly flagGlow = new Graphics();
  private readonly under: Graphics[] = [];
  private readonly over: Graphics[] = [];
  /** Bumped by every flag tap and call, so a look's sparkle or a call's pulses stop when something else is tapped. */
  private lookRun = 0;
  /** Level 5: the companion has reached the picnic, so the trail it came by shows footprints. */
  private arrived = false;
  private callRun = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.state = startWalk(ctx.level, ctx.rng);
    this.lay = stopLayout(this.view, ctx.level);
    this.trail.eventMode = 'none';
    this.scene.eventMode = 'passive';
    ctx.stage.addChild(this.bg, this.scene, this.trail);
    for (let slot = 0; slot < 2; slot++) {
      const node = new Container();
      node.eventMode = 'static';
      const glow = new Graphics();
      glow.eventMode = 'none';
      glow.visible = false;
      const pic = new Container();
      pic.eventMode = 'none';
      const card = new Graphics();
      this.cards.push(card);
      node.addChild(card, pic, glow);
      onTap(node, () => this.touchZone(slot as 0 | 1), { cooldown: 120 });
      this.zoneNodes.push(node);
      this.pictures.push(pic);
      this.glows.push(glow);
      this.scene.addChild(node);
    }
    if (this.plan.calls || this.plan.trails) {
      this.badgeNode = friendBadge(this.state.route.friend, BADGE);
      this.badgeNode.eventMode = 'static';
      onTap(this.badgeNode, () => this.replay(), { cooldown: 400 });
      ctx.stage.addChild(this.badgeNode);
    }
    this.walker = ctx.companion();
    this.walker.scale.set(SCALE);
    this.walker.eventMode = 'static';
    this.walker.hitArea = this.walker.touchArea(60);
    onTap(this.walker, () => this.tapWalker(), { cooldown: 400 });
    ctx.track(this.walker);
    ctx.stage.addChild(this.walker);
    this.layout(this.view);
    this.drawStop(0);
    if (this.plan.trails) this.openTrails();
  }

  start() {
    const friend = FRIEND_NAMES[this.state.route.friend];
    if (this.plan.trails) {
      void this.ctx.instruct('walk.instruct-trail', { friend });
      void this.ctx.tw.wait(2.6).then(() => {
        if (!this.gone && !this.busy && !this.finished && this.state.pick === 0) void this.sayTrailCall();
      });
    } else if (!this.plan.calls) void this.ctx.instruct('walk.instruct-pick', { friend });
    else {
      void this.ctx.instruct('walk.instruct-follow', { friend });
      void this.ctx.tw.wait(2.6).then(() => {
        if (!this.gone && !this.busy && !this.finished) void this.sayCall(0);
      });
    }
  }

  resize(v: View) {
    this.view = v;
    this.layout(v);
  }

  destroy() {
    this.gone = true;
    this.ctx.untrack(this.walker);
    if (this.friend) this.ctx.untrack(this.friend);
  }

  // ---- Layout and drawing ---------------------------------------------------------------------------------------

  private layout(v: View) {
    this.lay = stopLayout(v, this.ctx.level);
    this.bg.width = v.w;
    this.bg.height = v.h;
    this.lay.zones.forEach((r, i) => {
      const n = this.zoneNodes[i];
      n.position.set(r.x + r.w / 2, r.y + r.h / 2);
      n.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
      this.pictures[i].scale.set(Math.min(r.w / 290, r.h / 250));
      this.cards[i]
        .clear()
        .roundRect(-r.w / 2, -r.h / 2, r.w, r.h, 30)
        .fill(0xe9f7da)
        .stroke({ width: 6, color: swatch.green.line, join: 'round' })
        .roundRect(-r.w / 2 + 10, -r.h / 2 + 10, r.w - 20, r.h - 20, 22)
        .stroke({ width: 3, color: 0xffffff, alpha: 0.8 });
    });
    const badge = this.lay.badge ?? (this.plan.trails ? mapLayout(v, this.ctx.level, 'sweep').badge : null);
    if (this.badgeNode && badge) this.badgeNode.position.set(badge.x + badge.w / 2, badge.y + badge.h / 2);
    this.trail.position.set(this.lay.trail.x, this.lay.trail.y);
    if (this.map) this.layoutMap();
    else if (!this.busy) this.walker.position.set(this.lay.stand.x, this.lay.stand.y);
    this.drawTrailNow();
  }

  private drawTrailNow() {
    drawTrail(this.trail, this.lay.trail.w, STOPS, this.shown);
  }

  private stopAt(i: number): Stop {
    return this.state.route.stops[Math.min(i, STOPS - 1)];
  }

  /** Put stop `i`'s two ways on the zones. */
  private drawStop(i: number) {
    this.shown = i;
    const stop = this.stopAt(i);
    for (let slot = 0; slot < 2; slot++) {
      const pic = this.pictures[slot];
      pic.removeChildren().forEach((c) => c.destroy({ children: true }));
      const w = waysAt(stop)[slot === 0 ? stop.first : 1 - stop.first];
      pic.addChild(wayPicture(w.key));
      this.glows[slot].visible = false;
    }
    this.drawTrailNow();
  }

  update(_dt: number) {
    if (this.plan.trails) {
      // Glow pulse on the called trail's flag once it is lit.
      const lit = this.state.trailGlow !== null && onTrails(this.state) && !this.finished;
      this.flagGlow.visible = lit;
      if (lit && this.mapLay) {
        const f = this.mapLay.flags[this.state.trailGlow!];
        this.flagGlow
          .clear()
          .roundRect(f.x - 8, f.y - 8, f.w + 16, f.h + 16, 30)
          .stroke({ width: 10, color: 0xfff08a, alpha: 0.6 + 0.3 * Math.sin(performance.now() / 180) });
      }
      return;
    }
    if (this.map) {
      // Glow pulse on the next landmark home once it is lit.
      const lit = this.state.homeGlow && onMap(this.state);
      this.tileGlow.visible = lit;
      if (lit && this.mapLay) {
        const t = this.mapLay.tiles[nextHome(this.state)];
        this.tileGlow
          .clear()
          .roundRect(t.x - 8, t.y - 8, t.w + 16, t.h + 16, 30)
          .stroke({ width: 10, color: 0xfff08a, alpha: 0.6 + 0.3 * Math.sin(performance.now() / 180) });
      }
      return;
    }
    // Glow pulse on the asked way once it is lit.
    if (!this.state.glow || this.finished) return;
    const slot = askedSlot(this.stopAt(this.state.stop));
    const r = this.lay.zones[0];
    for (let i = 0; i < 2; i++) {
      const g = this.glows[i];
      g.visible = i === slot;
      if (g.visible)
        g.clear()
          .roundRect(-r.w / 2 - 8, -r.h / 2 - 8, r.w + 16, r.h + 16, 36)
          .stroke({ width: 10, color: 0xfff08a, alpha: 0.6 + 0.3 * Math.sin(performance.now() / 180) });
    }
  }

  // ---- Voice ------------------------------------------------------------------------------------------------------

  private callWays(group: readonly number[]): string[] {
    return group.map((i) => {
      const s = this.state.route.stops[i];
      return waysAt(s)[s.asked!].phrase;
    });
  }

  private async sayCall(stop: number) {
    const group = callAt(this.state.route, stop);
    if (!group) return;
    await this.speakGroup(group);
  }

  private speakGroup(group: readonly number[]) {
    const ways = this.callWays(group);
    if (ways.length === 2) return this.ctx.say('walk.call.two', { first: ways[0], second: ways[1] });
    return this.ctx.say('walk.call.one', { way: ways[0] });
  }

  /** Say what to do now again: the map's question, the friend's call, or (where nobody calls) the walk's invitation. */
  private replay() {
    if (this.finished) return;
    if (this.plan.trails) {
      // Not during a walk: the pick has already moved on, so the call would be the next one.
      if (onTrails(this.state) && !this.busy) void this.sayTrailCall();
      return;
    }
    if (this.map) {
      if (onMap(this.state)) void this.ctx.say('walk.home-start');
      return;
    }
    if (this.state.stop >= STOPS) return;
    if (!this.plan.calls) {
      void this.ctx.say('walk.instruct-pick', { friend: FRIEND_NAMES[this.state.route.friend] });
      return;
    }
    void this.speakGroup(groupOf(this.state.route, this.state.stop));
  }

  private tapWalker() {
    if (this.finished) return;
    this.walker.poke();
    sfx.pop(7);
    if (this.busy) return;
    this.replay();
  }

  // ---- Touches ----------------------------------------------------------------------------------------------------

  private touchZone(slot: 0 | 1) {
    if (this.busy || this.finished || this.state.stop >= STOPS) return;
    const r = this.lay.zones[slot];
    const node = this.zoneNodes[slot];
    sfx.tick();
    this.ctx.tw.kill(node.scale);
    node.scale.set(0.96);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    const res = step(this.state, slot);
    if (res.kind === 'ignored') return;
    this.busy = true;
    if (res.kind === 'other') void this.turnBack(r, res.took.phrase, res.asked.phrase, res.glow);
    else void this.goPast(r, res.way.phrase, res.way.sound, res.arrived);
  }

  /** The walker takes a step that way, stops, turns back and the friend names both ways. */
  private async turnBack(
    r: { x: number; y: number; w: number; h: number },
    took: string,
    asked: string,
    glow: boolean,
  ) {
    const { tw } = this.ctx;
    const to = { x: r.x + r.w / 2, y: r.y + r.h + 10 };
    sfx.boing();
    await tw.to(
      this.walker,
      { x: (this.lay.stand.x + to.x) / 2, y: (this.lay.stand.y + to.y) / 2 },
      { duration: 0.4, ease: ease.outQuad },
    );
    if (this.gone) return;
    await tw.to(
      this.walker,
      { x: this.lay.stand.x, y: this.lay.stand.y },
      { duration: 0.4, ease: ease.outQuad },
    );
    if (this.gone) return;
    this.busy = false;
    await this.ctx.say('walk.other', { took, asked });
    if (glow && !this.gone) void this.ctx.say('walk.hint-glow');
  }

  /** The walker goes that way with its own sound, then the landscape slides on. */
  private async goPast(
    r: { x: number; y: number; w: number; h: number },
    phrase: string,
    sound: StepSound,
    arrived: boolean,
  ) {
    const { tw } = this.ctx;
    const cx = r.x + r.w / 2;
    const points = [
      { x: cx, y: r.y + r.h - 20 },
      { x: cx, y: r.y + r.h / 2 },
      { x: cx, y: r.y + 30 },
    ];
    for (const p of points) {
      sfx[sound]();
      await tw.to(this.walker, { x: p.x, y: p.y }, { duration: 0.4, ease: ease.inOutSine });
      if (this.gone) return;
    }
    void this.ctx.say('walk.went', { text: cap(phrase) });
    if (arrived) {
      await this.arrive();
      return;
    }
    // Slide to the next landmark.
    const next = this.shown + 1;
    await tw.to(this.scene, { x: -this.view.w }, { duration: 0.3, ease: ease.inQuad });
    if (this.gone) return;
    this.drawStop(next);
    this.walker.position.set(this.lay.stand.x, this.lay.stand.y);
    this.scene.x = this.view.w;
    await tw.to(this.scene, { x: 0 }, { duration: 0.3, ease: ease.outQuad });
    if (this.gone) return;
    this.busy = false;
    void this.sayCall(next);
  }

  /** The picnic picture: the blanket with the friend on it. */
  private makePicnic(): Critter {
    const pic = new Container();
    const cloth = blanket(360);
    const friend = new Critter(CRITTERS[this.state.route.friend]);
    friend.scale.set(0.6);
    friend.position.set(60, -10);
    pic.addChild(cloth, friend);
    pic.eventMode = 'none';
    this.ctx.track(friend);
    this.picnic = pic;
    this.friend = friend;
    this.ctx.stage.addChild(pic);
    return friend;
  }

  private async arrive() {
    const { tw } = this.ctx;
    this.badgeNode?.parent?.removeChild(this.badgeNode);
    await tw.to(this.scene, { x: -this.view.w }, { duration: 0.35, ease: ease.inQuad });
    if (this.gone) return;
    this.zoneNodes.forEach((n) => (n.visible = false));
    this.trail.visible = false;
    const friend = this.makePicnic();
    this.picnic!.position.set(this.view.w / 2, this.view.h * 0.55);
    this.scene.x = 0;
    this.walker.position.set(this.view.w * 0.3, this.view.h * 0.55 + 10);
    await tw.to(this.walker, { x: this.view.w / 2 - 80 }, { duration: 0.8, ease: ease.outQuad });
    if (this.gone) return;
    if (this.plan.home) {
      friend.setMood('happy');
      this.walker.cheer();
      sfx.pluck(6, 0.25);
      await this.ctx.say('walk.arrive', { friend: FRIEND_NAMES[this.state.route.friend] });
      if (this.gone) return;
      await this.openMap();
      return;
    }
    this.finished = true;
    [4, 5, 6, 8, 9].forEach((s, i) => void tw.wait(i * 0.12).then(() => !this.gone && sfx.pluck(s, 0.25)));
    this.ctx.particles.burst(this.view.w / 2, this.view.h * 0.5, {
      kind: 'dot',
      colors: [0xfff3a0, 0xffffff, 0xff9ac1],
      count: 26,
      speed: [120, 300],
      gravity: 200,
      life: [0.6, 1],
    });
    friend.setMood('happy');
    this.walker.cheer();
    await this.ctx.say('walk.arrive', { friend: FRIEND_NAMES[this.state.route.friend] });
    if (this.gone) return;
    sfx.tada();
    await tw.wait(1);
    if (this.gone) return;
    this.ctx.finish({ misses: this.state.misses, hints: this.state.hints });
  }

  // ---- The map (level 4) -------------------------------------------------------------------------------------------

  private mapFeet(): Pt {
    const l = this.mapLay!;
    const here = mapSpot(l, this.at);
    return this.nudged ? lerp(here, mapSpot(l, nextHome(this.state)), 0.2) : here;
  }

  /** Put the path, door, tiles, picnic and companion where this view's map has them. */
  private layoutMap() {
    const l = (this.mapLay = mapLayout(this.view, this.ctx.level, this.state.shape));
    this.mapPath.clear();
    // At level 5 the three ribbons are the path.
    if (!this.plan.trails) dotted(this.mapPath, [...l.path], 0xfff7d6, 7);
    this.door.position.set(l.path[0].x, l.path[0].y);
    this.tileNodes.forEach((n, i) => {
      const t = l.tiles[i];
      n.position.set(t.x + t.w / 2, t.y + t.h / 2);
    });
    this.flagNodes.forEach((n, i) => {
      const f = l.flags[i];
      n.position.set(f.x + f.w / 2, f.y + f.h / 2);
    });
    if (this.plan.trails) this.drawRibbons();
    if (this.busy) return;
    this.sizeMapWalker();
    const end = l.path[STOPS + 1];
    this.picnic?.position.set(end.x, end.y);
    const feet = this.mapFeet();
    this.walker.position.set(feet.x, feet.y);
  }

  /** The companion at this view's map size; its tap area stays at least MAP_WALKER across. */
  private sizeMapWalker() {
    const scale = mapWalkerScale(this.view);
    this.walker.scale.set(scale);
    this.walker.hitArea = this.walker.touchArea(Math.max(0, MAP_WALKER / 2 / scale - this.walker.touch.r));
  }

  /** The map's path, door and tiles, laid out under the companion. At level 4 a tile is a tap target. */
  private buildMap(): Container {
    const map = (this.map = new Container());
    map.eventMode = 'passive';
    this.mapPath.eventMode = 'none';
    this.door.eventMode = 'none';
    this.tileGlow.eventMode = 'none';
    this.tileGlow.visible = false;
    map.addChild(this.mapPath, this.door);
    const trails = !!this.plan.trails;
    if (trails)
      for (let t = 0; t < TRAILS; t++) {
        const u = new Graphics();
        u.eventMode = 'none';
        this.under.push(u);
        map.addChild(u);
      }
    this.tileNodes = this.state.route.stops.map((stop, i) => {
      const ways = waysAt(stop);
      const taken = trails ? null : this.state.taken[i];
      const node = mapTile(
        stop.landmark,
        [ways[stop.first].key, ways[1 - stop.first].key],
        taken === null ? null : taken === stop.first ? 0 : 1,
        TILE.w,
        TILE.h,
      );
      if (trails) node.eventMode = 'none';
      else {
        node.eventMode = 'static';
        node.hitArea = new Rectangle(-TILE.w / 2, -TILE.h / 2, TILE.w, TILE.h);
        onTap(node, () => this.touchTile(i), { cooldown: 120 });
      }
      map.addChild(node);
      return node;
    });
    map.addChild(this.tileGlow);
    if (trails) {
      for (let t = 0; t < TRAILS; t++) {
        const o = new Graphics();
        o.eventMode = 'none';
        this.over.push(o);
        map.addChild(o);
      }
      this.flagGlow.eventMode = 'none';
      this.flagGlow.visible = false;
      this.flagNodes = TRAIL_STYLES.map((style, t) => {
        const node = trailFlag(style, FLAG.w, FLAG.h);
        node.eventMode = 'static';
        node.hitArea = new Rectangle(-FLAG.w / 2, -FLAG.h / 2, FLAG.w, FLAG.h);
        onTap(node, () => this.touchFlag(t), { cooldown: 120 });
        map.addChild(node);
        return node;
      });
      map.addChild(this.flagGlow);
    }
    this.layoutMap();
    this.ctx.stage.addChildAt(map, this.ctx.stage.getChildIndex(this.walker));
    // The companion's tap area stays at least MAP_WALKER across at its smaller size.
    const scale = mapWalkerScale(this.view);
    this.walker.hitArea = this.walker.touchArea(Math.max(0, MAP_WALKER / 2 / scale - this.walker.touch.r));
    return map;
  }

  /** The view zooms out from the picnic to the whole path, with footprints on the three ways she took. */
  private async openMap() {
    const { tw } = this.ctx;
    this.at = STOPS;
    this.nudged = false;
    this.busy = true;
    const map = this.buildMap();
    map.alpha = 0;
    const l = this.mapLay!;
    const end = l.path[STOPS + 1];
    const feet = mapSpot(l, STOPS);
    const zoom = { duration: 0.8, ease: ease.inOutSine };
    void tw.to(map, { alpha: 1 }, zoom);
    if (this.picnic) {
      void tw.to(this.picnic, { x: end.x, y: end.y }, zoom);
      void tw.to(this.picnic.scale, { x: 0.5, y: 0.5 }, zoom);
    }
    const scale = mapWalkerScale(this.view);
    void tw.to(this.walker.scale, { x: scale, y: scale }, zoom);
    await tw.to(this.walker, { x: feet.x, y: feet.y }, zoom);
    if (this.gone) return;
    this.busy = false;
    this.layoutMap();
    void this.ctx.instruct('walk.home-start');
  }

  /** Take the map down and stand at the first stop again (Start again). */
  private closeMap() {
    this.ctx.tw.kill(this.walker);
    this.ctx.tw.kill(this.walker.scale);
    if (this.friend) this.ctx.untrack(this.friend);
    this.picnic?.destroy({ children: true });
    this.picnic = null;
    this.friend = null;
    if (this.map) {
      for (const n of this.tileNodes) {
        this.ctx.tw.kill(n);
        this.ctx.tw.kill(n.scale);
      }
      this.map.removeChild(this.mapPath, this.door, this.tileGlow);
      this.map.destroy({ children: true });
    }
    this.map = null;
    this.mapLay = null;
    this.tileNodes = [];
    this.zoneNodes.forEach((n) => (n.visible = true));
    this.trail.visible = true;
    this.walker.scale.set(SCALE);
    this.walker.hitArea = this.walker.touchArea(60);
  }

  private touchTile(i: number) {
    if (this.busy || this.finished || !this.map) return;
    const node = this.tileNodes[i];
    const res = stepHome(this.state, i);
    if (res.kind === 'ignored') return;
    sfx.tick();
    this.ctx.tw.kill(node.scale);
    node.scale.set(0.95);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    if (res.kind === 'passed') {
      // Already behind us: a wiggle, nothing counted.
      this.ctx.tw.kill(node);
      node.rotation = -0.06;
      void this.ctx.tw.to(node, { rotation: 0 }, { duration: 0.35, ease: ease.outBack });
      return;
    }
    this.busy = true;
    if (res.kind === 'later') void this.notYet(res.next, res.glow);
    else void this.goBack(res.stop, res.way.phrase, res.way.sound, res.home);
  }

  /** A landmark that is not next: one step along the path the right way, and a line that does not name the answer. */
  private async notYet(next: number, glow: boolean) {
    sfx.boing();
    this.nudged = true;
    const feet = this.mapFeet();
    await this.ctx.tw.to(this.walker, { x: feet.x, y: feet.y }, { duration: 0.35, ease: ease.outQuad });
    if (this.gone) return;
    this.busy = false;
    this.layoutMap();
    if (glow)
      void this.ctx.say('walk.first', { place: LANDMARK_NAMES[this.state.route.stops[next].landmark] });
    else void this.ctx.say('walk.not-yet');
  }

  /** The companion follows the path to the landmark and goes back past it the way it came. */
  private async goBack(stop: number, phrase: string, sound: StepSound, home: boolean) {
    const { tw } = this.ctx;
    const l = this.mapLay!;
    this.at = stop;
    this.nudged = false;
    const node = this.tileNodes[stop];
    const feet = mapSpot(l, stop);
    await tw.to(this.walker, { x: feet.x, y: feet.y - 80 }, { duration: 0.6, ease: ease.inOutSine });
    if (this.gone) return;
    sfx[sound]();
    await tw.to(this.walker, { x: feet.x, y: feet.y - 40 }, { duration: 0.3, ease: ease.inOutSine });
    if (this.gone) return;
    sfx[sound]();
    await tw.to(this.walker, { x: feet.x, y: feet.y }, { duration: 0.3, ease: ease.inOutSine });
    if (this.gone) return;
    node.alpha = 0.6;
    const said = this.ctx.say('walk.back', { text: phrase });
    if (!home) {
      this.busy = false;
      this.layoutMap();
      return;
    }
    // The last landmark: it walks on to its door by itself.
    await said;
    if (this.gone) return;
    this.at = -1;
    await tw.to(this.walker, mapSpot(this.mapLay!, -1), { duration: 0.8, ease: ease.inOutSine });
    if (this.gone) return;
    await this.homeAgain('walk.home');
  }

  // ---- Which trail? (level 5) -------------------------------------------------------------------------------------

  /** Level 5 is on the map from the start: the companion at its door, the friend waiting on the blanket. */
  private openTrails() {
    this.zoneNodes.forEach((n) => (n.visible = false));
    this.trail.visible = false;
    this.makePicnic();
    this.picnic!.scale.set(0.5);
    this.at = -1;
    this.walker.scale.set(mapWalkerScale(this.view));
    this.buildMap();
    // The map covers the path's ends; the door and the blanket sit above the ribbons.
    this.ctx.stage.addChildAt(this.picnic!, this.ctx.stage.getChildIndex(this.walker));
  }

  /** Where trail `t` passes stop `i`: the middle of its way's half of the tile, side by side where two share the way. */
  private lane(t: number, i: number): number {
    const { trails, route } = this.state;
    const stop = route.stops[i];
    const way = trails[t][i];
    const x = laneX(this.mapLay!.tiles[i], way === stop.first ? 0 : 1);
    const sharing = [0, 1, 2].filter((o) => trails[o][i] === way);
    return sharing.length < 2 ? x : x + (sharing.indexOf(t) === 0 ? -15 : 15);
  }

  /** Every trail's ribbon: along the path between the tiles, through its way on each tile, footprints once walked. */
  private drawRibbons() {
    const l = this.mapLay;
    if (!l || !this.under.length) return;
    const { state } = this;
    const walked = this.arrived ? walkedThere(state) : null;
    for (let t = 0; t < TRAILS; t++) {
      const style = t === walked ? footprintStyle(TRAIL_STYLES[t]) : TRAIL_STYLES[t];
      const u = this.under[t].clear();
      const o = this.over[t].clear();
      for (let k = 0; k < l.path.length - 1; k++) {
        const a = l.path[k];
        const b = l.path[k + 1];
        const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const off = (t - 1) * 26;
        const nx = (-(b.y - a.y) / d) * off;
        const ny = ((b.x - a.x) / d) * off;
        ribbon(u, style, { x: a.x + nx, y: a.y + ny }, { x: b.x + nx, y: b.y + ny }, 7, 30);
      }
      l.tiles.forEach((tile, i) => {
        const x = this.lane(t, i);
        const cy = tile.y + tile.h / 2;
        // In at the bottom of its way and out at the top, so the way's own picture stays in view between them.
        ribbon(o, style, { x, y: cy + 86 }, { x, y: cy + 54 }, 7, 18);
        ribbon(o, style, { x, y: cy - 54 }, { x, y: cy - 86 }, 7, 18);
        if (state.turned[t] === i) turnedMark(o, TRAIL_STYLES[t], x, cy);
      });
      // Looking at one trail brightens it and dims the others.
      const dim = state.looking !== null && state.looking !== t && onTrails(state);
      u.alpha = o.alpha = dim ? 0.18 : 1;
      const flag = this.flagNodes[t];
      flag.alpha = t === walked ? 0.5 : 1;
      if (state.looking !== t) {
        this.ctx.tw.kill(flag.scale);
        flag.scale.set(1);
      }
    }
  }

  /** The friend's call: the called trail's three ways in the order walked, each landmark's tile pulsing as it is named. */
  private sayTrailCall() {
    const { state, ctx } = this;
    const [first, second, third] = trailWays(state, calledTrail(state)).map((w) => w.phrase);
    const run = ++this.callRun;
    stopOrder(state.pick).forEach((stop, k) => {
      void ctx.tw.wait(0.5 + k * 0.9).then(() => {
        if (this.gone || run !== this.callRun) return;
        const node = this.tileNodes[stop];
        ctx.tw.kill(node.scale);
        node.scale.set(1.1);
        void ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.5, ease: ease.outBack });
      });
    });
    return ctx.say(state.pick === 0 ? 'walk.call.three' : 'walk.home-call', { first, second, third });
  }

  /** A silent sparkle along a trail, stop by stop in the order walked; any other tap cuts it short. */
  private sparkle(t: number) {
    const run = this.lookRun;
    const style = TRAIL_STYLES[t];
    stopOrder(this.state.pick).forEach((stop, k) => {
      void this.ctx.tw.wait(0.1 + k * 0.45).then(() => {
        if (this.gone || run !== this.lookRun || !this.mapLay) return;
        const tile = this.mapLay.tiles[stop];
        this.ctx.particles.burst(this.lane(t, stop), tile.y + tile.h / 2, {
          kind: 'dot',
          colors: [0xffffff, style.fill, 0xfff3a0],
          count: 10,
          speed: [40, 130],
          gravity: 0,
          life: [0.3, 0.6],
        });
      });
    });
  }

  private touchFlag(t: number) {
    if (this.busy || this.finished || !this.map) return;
    const res = tapFlag(this.state, t);
    if (res.kind === 'ignored') return;
    sfx.tick();
    this.lookRun++;
    this.drawRibbons();
    const node = this.flagNodes[t];
    const to = this.state.looking === t ? 1.08 : 1;
    this.ctx.tw.kill(node.scale);
    node.scale.set(0.94);
    void this.ctx.tw.to(node.scale, { x: to, y: to }, { duration: 0.25, ease: ease.outBack });
    if (res.kind === 'look') this.sparkle(t);
    else if (res.kind === 'came') {
      this.sparkle(t);
      void this.ctx.say('walk.came');
    } else if (res.kind === 'reason')
      void this.ctx.say('walk.other', { took: res.took.phrase, asked: res.asked.phrase });
    else {
      this.busy = true;
      this.callRun++;
      if (res.kind === 'other') void this.wrongTrail(res);
      else void this.walkTrail(res);
    }
  }

  /** The companion goes past stop `i` by `way` on the map, up the tile on the way out and down it on the way home. */
  private async passTile(t: number, i: number, way: Way, home: boolean) {
    const { tw } = this.ctx;
    const tile = this.mapLay!.tiles[i];
    const x = this.lane(t, i);
    const ys = [tile.y + tile.h - 10, tile.y + tile.h / 2 + 35, tile.y + 80];
    if (home) ys.reverse();
    await tw.to(this.walker, { x, y: ys[0] }, { duration: 0.5, ease: ease.inOutSine });
    if (this.gone) return;
    for (const y of ys.slice(1)) {
      sfx[way.sound]();
      await tw.to(this.walker, { x, y }, { duration: 0.3, ease: ease.inOutSine });
      if (this.gone) return;
    }
    void this.ctx.say('walk.went', { text: cap(way.phrase) });
    await tw.wait(0.25);
  }

  /** Not the trail the friend described: it walks as far as the first place they differ, starts the other way and turns back. */
  private async wrongTrail(res: Extract<TrailStep, { kind: 'other' }>) {
    const { ctx } = this;
    const { tw } = ctx;
    const { state } = this;
    const home = state.pick === 1;
    for (const i of res.before) {
      await this.passTile(res.trail, i, waysAt(state.route.stops[i])[state.trails[res.trail][i]], home);
      if (this.gone) return;
    }
    const tile = this.mapLay!.tiles[res.stop];
    const x = this.lane(res.trail, res.stop);
    const y0 = home ? tile.y + 80 : tile.y + tile.h - 10;
    await tw.to(this.walker, { x, y: y0 }, { duration: 0.5, ease: ease.inOutSine });
    if (this.gone) return;
    sfx.boing();
    await tw.to(this.walker, { x, y: y0 + (home ? 30 : -30) }, { duration: 0.2, ease: ease.outQuad });
    if (this.gone) return;
    const back = mapSpot(this.mapLay!, this.at);
    await tw.to(this.walker, { x: back.x, y: back.y }, { duration: 0.8, ease: ease.inOutSine });
    if (this.gone) return;
    this.busy = false;
    this.layoutMap();
    await ctx.say('walk.other', { took: res.took.phrase, asked: res.asked.phrase });
    if (res.glow && !this.gone) void ctx.say('walk.hint-glow');
  }

  /** The called trail: past all three landmarks, to the picnic (and the call home) or back to the door (the finish). */
  private async walkTrail(res: Extract<TrailStep, { kind: 'go' }>) {
    const { ctx } = this;
    const { tw } = ctx;
    for (let k = 0; k < res.stops.length; k++) {
      await this.passTile(res.trail, res.stops[k], res.ways[k], res.done);
      if (this.gone) return;
    }
    this.at = res.done ? -1 : STOPS;
    await tw.to(this.walker, mapSpot(this.mapLay!, this.at), { duration: 0.7, ease: ease.inOutSine });
    if (this.gone) return;
    if (res.done) {
      await this.homeAgain('walk.home-other');
      return;
    }
    this.arrived = true;
    this.friend?.setMood('happy');
    this.walker.cheer();
    sfx.pluck(6, 0.25);
    // The trail she came by keeps its footprints and its flag dims.
    this.layoutMap();
    await ctx.say('walk.arrive', { friend: FRIEND_NAMES[this.state.route.friend] });
    if (this.gone) return;
    this.busy = false;
    this.layoutMap();
    void this.sayTrailCall();
  }

  /** At its own door: a rise of notes, a cheer and the round is done. */
  private async homeAgain(line: 'walk.home' | 'walk.home-other') {
    const { tw } = this.ctx;
    this.finished = true;
    this.busy = false;
    // A turn of the screen mid-walk: stand at this view's door.
    this.layoutMap();
    const door = mapSpot(this.mapLay!, -1);
    [4, 5, 6, 8, 9].forEach((s, i) => void tw.wait(i * 0.12).then(() => !this.gone && sfx.pluck(s, 0.25)));
    this.ctx.particles.burst(door.x, door.y - 40, {
      kind: 'dot',
      colors: [0xfff3a0, 0xffffff, 0xff9ac1],
      count: 26,
      speed: [120, 300],
      gravity: 200,
      life: [0.6, 1],
    });
    this.walker.cheer();
    await this.ctx.say(line);
    if (this.gone) return;
    sfx.tada();
    await tw.wait(1);
    if (this.gone) return;
    this.ctx.finish({ misses: this.state.misses, hints: this.state.hints });
  }

  // ---- Help -------------------------------------------------------------------------------------------------------

  /** The pause sheet's Show a hint: light the asked way (a hint, once per stop); asked again, say the request. */
  askForHint() {
    if (this.finished || this.busy) return;
    const next = nextHome(this.state);
    const r = askHint(this.state);
    if (this.plan.trails) {
      // The called trail's flag glows (the pick's one hint); asked again, the friend calls again.
      if (r === 'glow') void this.ctx.say('walk.hint-glow');
      else this.replay();
      return;
    }
    if (this.map) {
      // On the map the hint names the place that comes first; asked again on the same leg, the question is repeated.
      if (r === 'glow')
        void this.ctx.say('walk.first', { place: LANDMARK_NAMES[this.stopAt(next).landmark] });
      else this.replay();
      return;
    }
    if (r === 'glow') void this.ctx.say('walk.hint-glow');
    this.replay();
  }

  /** Start again: the first stop of the same seeded route, keeping misses and hints. */
  restart() {
    if (this.finished || this.busy) return;
    restart(this.state);
    if (this.plan.trails) {
      // Home again with every mark and footprint cleared, the same trails and calls.
      this.lookRun++;
      this.callRun++;
      this.at = -1;
      this.arrived = false;
      this.layoutMap();
      return;
    }
    if (this.map) this.closeMap();
    this.drawStop(0);
    this.walker.position.set(this.lay.stand.x, this.lay.stand.y);
  }

  /** The ghost finger: the asked way at each stop (levels 1 and 4: either, alternating sides); at level 3 one tap on the badge shows the replay; on level 4's map, the landmarks in the order home; at level 5 the badge once, then the called flag twice (look, go) there and again home. */
  /** Guided first play: its demonstration replays the badge once, so the hand shows the next real step. The bot's own flags are put back. */
  showMove(): TouchIntent | null {
    const shownReplay = this.shownReplay;
    this.shownReplay = true;
    const move = this.autotouch();
    this.shownReplay = shownReplay;
    return move;
  }

  autotouch(): TouchIntent | null {
    if (this.finished || this.busy) return null;
    if (this.plan.trails) {
      if (!onTrails(this.state)) return null;
      if (this.badgeNode && !this.shownReplay) {
        this.shownReplay = true;
        return { tap: { on: this.badgeNode } };
      }
      return { tap: { on: this.flagNodes[calledTrail(this.state)] } };
    }
    if (this.map) return onMap(this.state) ? { tap: { on: this.tileNodes[nextHome(this.state)] } } : null;
    if (this.state.stop >= STOPS) return null;
    if (this.ctx.level === 3 && this.state.stop === 1 && this.badgeNode && !this.shownReplay) {
      this.shownReplay = true;
      return { tap: { on: this.badgeNode } };
    }
    return { tap: { on: this.zoneNodes[botSlot(this.state)] } };
  }

  private shownReplay = false;
}

const BADGE = 140;

class WalkIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const b = blanket(200);
    b.position.set(40, 60);
    const pic = wayPicture('brook.over');
    pic.scale.set(0.8);
    pic.position.set(-20, -10);
    c.addChild(b, pic);
    super(c);
  }
}

export const adventureWalk: GameModule = {
  id: 'adventure-walk',
  name: 'Adventure Walk',
  titleLine: 'game.adventure-walk',
  region: 'story-grove',
  challenge: 'words',
  skills: ['spatial-words', 'listening', 'following-directions', 'sequencing', 'map-reading'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: describeWalk,
  music: STYLES.paint,
  coplayHint:
    'One takes the friend’s part and calls the way aloud; the other taps it. At the picnic, ask "which way did we go at the brook?"',
  offScreen:
    'Make a little walk on the table with a book bridge and a cushion boulder, and let a toy go over, under and around.',
  hubIcon: () => new WalkIcon(),
  touchDemo: true,
  upright: true,
  sticker: (seed) => walkSticker(LANDMARKS[new Rng(seed).int(0, LANDMARKS.length - 1)].id),
  create: (ctx) => new AdventureWalk(ctx),
};
