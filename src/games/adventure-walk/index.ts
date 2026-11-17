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
import { blanket, dotted, drawTrail, friendBadge, homeDoor, mapTile, walkSticker, wayPicture } from './art';
import {
  LEVELS,
  FRIEND_NAMES,
  LANDMARKS,
  LANDMARK_NAMES,
  MAP_WALKER,
  STOPS,
  TILE,
  askHint,
  askedSlot,
  botSlot,
  callAt,
  describeWalk,
  groupOf,
  mapLayout,
  mapSpot,
  nextHome,
  onMap,
  planFor,
  restart,
  startWalk,
  step,
  stepHome,
  stopLayout,
  waysAt,
  type MapLayout,
  type Plan,
  type Pt,
  type Stop,
  type StopLayout,
  type StepSound,
  type WalkState,
} from './logic';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const SCALE = 0.5;
/** The companion on the map (level 4). */
const MAP_SCALE = 0.35;
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
    if (this.plan.calls) {
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
  }

  start() {
    const friend = FRIEND_NAMES[this.state.route.friend];
    if (!this.plan.calls) void this.ctx.instruct('walk.instruct-pick', { friend });
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
    if (this.badgeNode && this.lay.badge)
      this.badgeNode.position.set(
        this.lay.badge.x + this.lay.badge.w / 2,
        this.lay.badge.y + this.lay.badge.h / 2,
      );
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

  private async arrive() {
    const { tw } = this.ctx;
    this.badgeNode?.parent?.removeChild(this.badgeNode);
    await tw.to(this.scene, { x: -this.view.w }, { duration: 0.35, ease: ease.inQuad });
    if (this.gone) return;
    this.zoneNodes.forEach((n) => (n.visible = false));
    this.trail.visible = false;
    const pic = new Container();
    const cloth = blanket(360);
    const friend = new Critter(CRITTERS[this.state.route.friend]);
    friend.scale.set(0.6);
    friend.position.set(60, -10);
    pic.addChild(cloth, friend);
    pic.eventMode = 'none';
    pic.position.set(this.view.w / 2, this.view.h * 0.55);
    this.ctx.track(friend);
    this.picnic = pic;
    this.friend = friend;
    this.ctx.stage.addChild(pic);
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
    dotted(this.mapPath, [...l.path], 0xfff7d6, 7);
    this.door.position.set(l.path[0].x, l.path[0].y);
    this.tileNodes.forEach((n, i) => {
      const t = l.tiles[i];
      n.position.set(t.x + t.w / 2, t.y + t.h / 2);
    });
    if (this.busy) return;
    const end = l.path[STOPS + 1];
    this.picnic?.position.set(end.x, end.y);
    const feet = this.mapFeet();
    this.walker.position.set(feet.x, feet.y);
  }

  /** The view zooms out from the picnic to the whole path, with footprints on the three ways she took. */
  private async openMap() {
    const { tw } = this.ctx;
    const map = (this.map = new Container());
    map.eventMode = 'passive';
    this.mapPath.eventMode = 'none';
    this.door.eventMode = 'none';
    this.tileGlow.eventMode = 'none';
    this.tileGlow.visible = false;
    map.addChild(this.mapPath, this.door);
    this.tileNodes = this.state.route.stops.map((stop, i) => {
      const ways = waysAt(stop);
      const taken = this.state.taken[i];
      const node = mapTile(
        stop.landmark,
        [ways[stop.first].key, ways[1 - stop.first].key],
        taken === null ? null : taken === stop.first ? 0 : 1,
        TILE.w,
        TILE.h,
      );
      node.eventMode = 'static';
      node.hitArea = new Rectangle(-TILE.w / 2, -TILE.h / 2, TILE.w, TILE.h);
      onTap(node, () => this.touchTile(i), { cooldown: 120 });
      map.addChild(node);
      return node;
    });
    map.addChild(this.tileGlow);
    this.at = STOPS;
    this.nudged = false;
    this.busy = true;
    this.layoutMap();
    map.alpha = 0;
    this.ctx.stage.addChildAt(map, this.ctx.stage.getChildIndex(this.walker));
    const l = this.mapLay!;
    const end = l.path[STOPS + 1];
    const feet = mapSpot(l, STOPS);
    // The companion's tap area stays at least MAP_WALKER across at its smaller size.
    this.walker.hitArea = this.walker.touchArea(
      Math.max(0, MAP_WALKER / 2 / MAP_SCALE - this.walker.touch.r),
    );
    const zoom = { duration: 0.8, ease: ease.inOutSine };
    void tw.to(map, { alpha: 1 }, zoom);
    if (this.picnic) {
      void tw.to(this.picnic, { x: end.x, y: end.y }, zoom);
      void tw.to(this.picnic.scale, { x: 0.5, y: 0.5 }, zoom);
    }
    void tw.to(this.walker.scale, { x: MAP_SCALE, y: MAP_SCALE }, zoom);
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
    const door = mapSpot(l, -1);
    await tw.to(this.walker, { x: door.x, y: door.y }, { duration: 0.8, ease: ease.inOutSine });
    if (this.gone) return;
    this.finished = true;
    this.busy = false;
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
    await this.ctx.say('walk.home');
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
    if (this.map) this.closeMap();
    this.drawStop(0);
    this.walker.position.set(this.lay.stand.x, this.lay.stand.y);
  }

  /** The ghost finger: the asked way at each stop (levels 1 and 4: either, alternating sides); at level 3 one tap on the badge shows the replay; on level 4's map, the landmarks in the order home. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy) return null;
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
  sticker: (seed) => walkSticker(LANDMARKS[new Rng(seed).int(0, LANDMARKS.length - 1)].id),
  create: (ctx) => new AdventureWalk(ctx),
};
