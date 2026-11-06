import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { leafArt } from '../drops-journey/art';
import { WigglyIcon, tile } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  arrowArt, bookmarkArt, cloudArt, dropArt, friendArt, motionArt, patchArt, pondArt, rewindArt, rippleArt, tileArt,
} from './art';
import {
  LEAF, LEVELS, canFinish, compare, enough, flip, freshState, makeRound, nextAction, planFor, rain, rainLayout, restartState,
  setSurface, stickerPick, type Action, type Layout, type Plan, type Round, type RoundState, type Step, type Surface, type Trial,
} from './logic';
import { RainRoute } from './route';

/** Each level's authored first round leads its first round of a session. */
const authoredShown = new Set<number>();

const actionKey = (a: Action) => (a.kind === 'tile' ? `tile:${a.patch}:${a.surface}` : a.kind);

/** A drop that has settled: in a patch's pocket or a pond's slot. */
interface Settled { node: Container; board: number; where: 'pocket' | 'slot'; index: number }

class RainGarden implements Game {
  readonly plan: Plan;
  readonly round: Round;
  s: RoundState;
  hints = 0;
  busy = false;
  finished = false;
  /** The leaf stays once the round has been finishable, even if she changes the ground again. */
  ever = false;
  pointing: Action | null = null;
  /** Level 3: the tiles light after the bookmark until she picks one. */
  tilesLit = false;
  readonly cloud: Container;
  readonly leaf: Container;
  readonly tiles: Container[] = [];
  bookmark: Container | null = null;
  private layout: Layout;
  private clock = 0;
  private saidEnough = false;
  private readonly backdrop: Backdrop;
  private readonly boardLayer = new Container();
  private readonly patchLayer = new Container();
  private readonly dropLayer = new Container();
  private readonly glow = new Graphics();
  private readonly rewind = rewindArt();
  private readonly patches: Graphics[] = [];
  private readonly friends: Container[] = [];
  private settled: Settled[] = [];
  private readonly flying = new Set<Container>();
  /** A resize that came while something moved; applied when it stops. */
  private stale = false;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    const first = ctx.demo || !authoredShown.has(this.plan.level);
    if (first && !ctx.demo) authoredShown.add(this.plan.level);
    this.round = makeRound(this.plan.level, ctx.rng, first);
    this.s = freshState(this.round);
    this.backdrop = new Backdrop({ sky: [0xcfe4f5, 0xfff6e0], hills: [0xd6efc8, 0xc5e7a8], horizon: 0.86, clouds: 0, sun: false, seed: 157 }, ctx.view);
    this.layout = rainLayout(ctx.view, this.plan.level, this.round.mirror)!;
    const c = this.layout.cloud;
    this.cloud = cloudArt(c.w, c.h);
    this.cloud.hitArea = new Rectangle(-c.w / 2, -c.h / 2, c.w, c.h);
    onTap(this.cloud, () => this.tapCloud());
    this.rewind.visible = false;
    this.rewind.position.set(0, -c.h / 2 + 10);
    this.cloud.addChild(this.rewind);
    this.leaf = leafArt(LEAF);
    this.leaf.hitArea = new Rectangle(-LEAF / 2, -LEAF / 2, LEAF, LEAF);
    this.leaf.visible = false;
    onTap(this.leaf, () => this.tapLeaf());
    for (const n of [this.boardLayer, this.patchLayer, this.dropLayer, this.glow]) n.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.boardLayer, this.patchLayer, this.dropLayer, this.glow);
    for (let i = 0; i < this.layout.tiles.length; i++) {
      const t = new Container();
      const size = this.layout.tiles[i].w;
      t.hitArea = new Rectangle(-size / 2, -size / 2, size, size);
      onTap(t, () => this.tapTile(i));
      this.tiles.push(t);
      ctx.stage.addChild(t);
    }
    ctx.stage.addChild(this.cloud, this.leaf);
    this.drawTiles();
    this.resize(ctx.view);
  }

  /** What a scripted play reads. */
  get state() {
    const cur = this.s.current;
    return {
      level: this.plan.level, surfaces: this.s.surfaces.slice(), trials: this.s.trials, compared: this.s.compared,
      current: cur ? cur.map((t) => [t.stored, t.pond]) : null, bookmark: this.s.bookmark ? [this.s.bookmark.surface, this.s.bookmark.stored, this.s.bookmark.pond] : null,
      friend: this.round.friend, mirror: this.round.mirror, canFinish: this.canFinish, leaf: this.leaf.visible, misses: 0, hints: this.hints,
      pointing: this.pointing ? actionKey(this.pointing) : null, busy: this.busy, finished: this.finished, drops: this.settled.length,
    };
  }

  get canFinish() { return this.ever || canFinish(this.s); }

  start() { void this.ctx.instruct(`rain.instruct.${this.plan.level}` as LineId); }

  destroy() {
    this.finished = true;
    this.ctx.tw.kill(this.cloud.scale);
    for (const t of this.tiles) this.ctx.tw.kill(t.scale);
    for (const n of this.flying) this.ctx.tw.kill(n);
    for (const s of this.settled) this.ctx.tw.kill(s.node);
  }

  // ---- drawing ----

  private dir(): 1 | -1 { return this.round.mirror ? -1 : 1; }

  private drawBoards() {
    const l = this.layout;
    this.boardLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.patchLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.patches.length = 0;
    this.friends.length = 0;
    l.boards.forEach((b, i) => {
      this.boardLayer.addChild(arrowArt(b.arrow), pondArt(b.pond, b.slots));
      const f = friendArt(this.round.friend);
      f.position.set(b.friend.x, b.friend.y);
      this.boardLayer.addChild(f);
      this.friends.push(f);
      this.patches.push(this.patchGraphic(i));
    });
  }

  private patchGraphic(i: number): Graphics {
    const b = this.layout.boards[i];
    const g = patchArt(this.s.surfaces[i], b.patch.w, b.patch.h, b.pockets.map((p) => ({ x: p.x - b.patch.x, y: p.y - b.patch.y, w: p.w, h: p.h })), this.dir());
    g.position.set(b.patch.x, b.patch.y);
    this.patchLayer.addChild(g);
    return g;
  }

  private drawTiles() {
    this.tiles.forEach((t, i) => {
      t.removeChildren().forEach((c) => c.destroy({ children: true }));
      const surface: Surface = this.plan.level === 2 ? this.s.surfaces[i] : i === 0 ? 'stone' : 'soil';
      t.addChild(tileArt(surface, this.layout.tiles[i].w));
    });
  }

  private placeSettled() {
    for (const d of this.settled) {
      const b = this.layout.boards[d.board];
      const at = d.where === 'pocket' ? b.pockets[d.index] : b.slots[d.index];
      d.node.position.set(at.x, at.y);
    }
  }

  // ---- rain ----

  private squash(n: Container) {
    this.ctx.tw.kill(n.scale);
    n.scale.set(1.08, 0.88);
    void this.ctx.tw.to(n.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
  }

  private tapCloud() {
    if (this.busy || this.finished) return;
    this.squash(this.cloud);
    this.tilesLit = false;
    void this.shower();
  }

  private async shower() {
    this.busy = true;
    this.pointing = null;
    if (this.settled.length) { await this.freshen(); if (this.finished) return; }
    const { state, trials } = rain(this.s);
    const counts = trials.map(() => ({ pocket: 0, slot: 0 }));
    for (let u = 0; u < trials[0].steps.length; u++) {
      await Promise.all(trials.map((t, b) => this.fall(b, t.steps[u], counts[b], u)));
      if (this.finished) return;
    }
    const firstBookmark = this.plan.level === 3 && !this.s.bookmark;
    this.s = state;
    if (firstBookmark) { await this.keepBookmark(trials[0]); return; }
    if (canFinish(this.s)) this.ever = true;
    this.leaf.visible = this.canFinish;
    this.idle();
    await this.ctx.say(this.resultLine(trials));
    if (this.finished) return;
    if (!this.saidEnough && enough(this.s)) { this.saidEnough = true; await this.ctx.say('rain.done'); }
  }

  private resultLine(trials: Trial[]): LineId {
    if (this.plan.level === 2) return trials[0].surface === trials[1].surface ? 'rain.pair.same' : 'rain.pair';
    const t = trials[0];
    if (this.plan.level === 3 && this.s.bookmark) {
      const c = compare(this.s.bookmark, t);
      if (c.sameSurface) return 'rain.compare.same';
      return this.s.bookmark.surface === 'stone' ? 'rain.compare' : 'rain.compare.back';
    }
    return t.surface === 'soil' ? 'rain.soil' : 'rain.stone';
  }

  /** One drop: from the cloud into a pocket, or onto the ground, down the arrow and into a pond slot. */
  private async fall(board: number, step: Step, count: { pocket: number; slot: number }, unit: number) {
    const b = this.layout.boards[board];
    const node = new Container();
    node.addChild(dropArt(44));
    const dir = this.dir();
    const cloudY = this.layout.cloud.y + this.layout.cloud.h / 2 - 20;
    const toPocket = step.to === 'patch';
    const index = toPocket ? count.pocket++ : count.slot++;
    const startX = toPocket ? b.pockets[index].x : b.patch.x + dir * (b.patch.w / 2 - 50 - 30 * (unit % 2));
    node.position.set(startX, cloudY);
    this.dropLayer.addChild(node);
    this.flying.add(node);
    const done = () => { this.flying.delete(node); this.settled.push({ node, board, where: toPocket ? 'pocket' : 'slot', index }); };
    if (toPocket) {
      const p = b.pockets[index];
      await this.ctx.tw.to(node, { y: p.y }, { duration: 0.6, ease: ease.inQuad });
      if (this.finished) return;
      sfx.marimba(5 + index * 2, 0.4);
      this.ctx.particles.burst(p.x, p.y, { kind: 'dot', colors: [swatch.blue.light, 0xffffff], count: 6, speed: [40, 100], gravity: 200, life: [0.2, 0.4] });
      done();
      await this.ctx.tw.wait(0.25);
      return;
    }
    // Onto the ground at the low edge, then down the arrow with motion lines, then into its slot with a ripple.
    const groundY = b.patch.y - b.patch.h / 2 + 10;
    await this.ctx.tw.to(node, { y: groundY }, { duration: 0.5, ease: ease.inQuad });
    if (this.finished) return;
    sfx.pluck(3, 0.2);
    const lines = motionArt();
    lines.scale.x = dir;
    node.addChildAt(lines, 0);
    await this.ctx.tw.to(node, { x: b.arrow.x1, y: b.arrow.y1 }, { duration: 0.25, ease: ease.inOutSine });
    if (this.finished) return;
    await this.ctx.tw.to(node, { x: b.arrow.x2, y: b.arrow.y2 }, { duration: 0.45, ease: ease.inQuad });
    if (this.finished) return;
    lines.destroy();
    const slot = b.slots[index];
    await this.ctx.tw.to(node, { x: slot.x, y: slot.y }, { duration: 0.3, ease: ease.outQuad });
    if (this.finished) return;
    sfx.marimba(index, 0.4);
    sfx.splash();
    const ripple = rippleArt(slot.w / 2);
    ripple.y = 14;
    node.addChildAt(ripple, 0);
    if (index === 0) this.cheer(board);
    done();
  }

  private cheer(board: number) {
    const f = this.friends[board];
    if (!f) return;
    if (this.round.friend === 'frog') sfx.ribbit(); else if (this.round.friend === 'duck') sfx.animal('quack'); else sfx.squeak(6);
    this.ctx.tw.kill(f);
    const y = this.layout.boards[board].friend.y;
    void this.ctx.tw.to(f, { y: y - 24 }, { duration: 0.18, ease: ease.outQuad }).then(() => (this.finished ? undefined : this.ctx.tw.to(f, { y }, { duration: 0.25, ease: ease.outBack })));
  }

  /**
   * Back to fresh ground: the pond tips into its drain, and a fresh, dry patch slides in over the old one under the
   * rewind badge. Nothing rises back into the cloud.
   */
  private async freshen() {
    sfx.whoosh();
    this.rewind.visible = true;
    const old = this.settled;
    this.settled = [];
    for (const d of old) {
      void this.ctx.tw.to(d.node, { alpha: 0, y: d.node.y + (d.where === 'slot' ? 40 : 0) }, { duration: 0.4, ease: ease.inQuad });
    }
    const dx = -this.dir() * 80;
    const olds = this.patches.splice(0);
    olds.forEach((g, i) => {
      void this.ctx.tw.to(g, { alpha: 0 }, { duration: 0.4 });
      const n = this.patchGraphic(i);
      n.x += dx; n.alpha = 0;
      this.patches.push(n);
      void this.ctx.tw.to(n, { x: n.x - dx, alpha: 1 }, { duration: 0.45, ease: ease.outQuad });
    });
    await this.ctx.tw.wait(0.5);
    if (this.finished) return;
    for (const d of old) d.node.destroy({ children: true });
    for (const g of olds) g.destroy();
    this.rewind.visible = false;
  }

  /** Level 3's first rain: a card keeps it beside the board, then the garden is fresh and the tiles light. */
  private async keepBookmark(t: Trial) {
    const bx = this.layout.bookmark!;
    const card = bookmarkArt(t, bx.w, bx.h);
    const p = this.layout.boards[0].patch;
    card.position.set(p.x, p.y);
    card.scale.set(0.3);
    card.eventMode = 'none';
    this.ctx.stage.addChildAt(card, this.ctx.stage.getChildIndex(this.dropLayer) + 1);
    this.bookmark = card;
    const said = this.ctx.say(t.surface === 'soil' ? 'rain.soil' : 'rain.stone');
    void this.ctx.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.6, ease: ease.outQuad });
    await this.ctx.tw.to(card, { x: bx.x, y: bx.y }, { duration: 0.6, ease: ease.outQuad });
    if (this.finished) return;
    await said;
    if (this.finished) return;
    await this.freshen();
    if (this.finished) return;
    this.tilesLit = true;
    this.idle();
    await this.ctx.say('rain.again');
  }

  // ---- ground ----

  private tapTile(i: number) {
    if (this.busy || this.finished) return;
    this.squash(this.tiles[i]);
    const level = this.plan.level;
    const patch = level === 2 ? i : 0;
    const surface: Surface = level === 2 ? flip(this.s.surfaces[i]) : i === 0 ? 'stone' : 'soil';
    if (surface === 'stone') sfx.clunk(); else sfx.squish();
    this.tilesLit = false;
    this.pointing = null;
    const changed = this.s.surfaces[patch] !== surface;
    this.s = setSurface(this.s, patch, surface);
    this.drawTiles();
    if (this.settled.length) {
      this.busy = true;
      void this.freshen().then(() => { if (!this.finished) this.idle(); });
    } else if (changed) {
      const old = this.patches[patch];
      this.patches[patch] = this.patchGraphic(patch);
      old.destroy();
      this.squash(this.patches[patch]);
    }
  }

  // ---- finishing and help ----

  private tapLeaf() {
    if (this.finished || this.busy || !this.canFinish) return;
    this.finished = true;
    sfx.tada();
    this.ctx.finish({ misses: 0, hints: this.hints });
  }

  readonly hintLabel = 'Show me';

  askForHint() {
    if (this.busy || this.finished) return;
    const a = nextAction(this.s);
    if (!this.pointing || actionKey(this.pointing) !== actionKey(a)) this.hints++;
    this.pointing = a;
    void this.ctx.say(a.kind === 'cloud' ? 'rain.hint.cloud' : a.kind === 'tile' ? 'rain.hint.tile' : 'rain.done');
  }

  restart() {
    if (this.finished) return;
    const go = () => {
      if (this.finished) return;
      if (this.busy) { void this.ctx.tw.wait(0.2).then(go); return; }
      this.s = restartState(this.round);
      this.ever = false;
      this.saidEnough = false;
      this.tilesLit = false;
      this.pointing = null;
      this.leaf.visible = false;
      this.bookmark?.destroy({ children: true });
      this.bookmark = null;
      for (const d of this.settled) d.node.destroy({ children: true });
      this.settled = [];
      this.drawBoards();
      this.drawTiles();
      void this.ctx.say('rain.again');
    };
    go();
  }

  private targetOf(a: Action): Container {
    if (a.kind === 'cloud') return this.cloud;
    if (a.kind === 'leaf') return this.leaf;
    return this.tiles[this.plan.level === 2 ? a.patch : a.surface === 'stone' ? 0 : 1];
  }

  // ---- shell hooks ----

  private idle() {
    this.busy = false;
    if (this.stale) { this.stale = false; this.resize(this.ctx.view); }
  }

  resize(view: View) {
    this.layout = rainLayout(view, this.plan.level, this.round.mirror) ?? this.layout;
    const l = this.layout;
    this.backdrop.resize(view);
    // Boards and drops are redrawn only while nothing moves; a resize mid-shower is applied when it settles.
    if (this.busy) this.stale = true;
    else { this.drawBoards(); this.placeSettled(); }
    this.cloud.position.set(l.cloud.x, l.cloud.y);
    this.leaf.position.set(l.leaf.x, l.leaf.y);
    this.tiles.forEach((t, i) => t.position.set(l.tiles[i].x, l.tiles[i].y));
    if (this.bookmark && l.bookmark && !this.busy) this.bookmark.position.set(l.bookmark.x, l.bookmark.y);
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    if (this.finished) return;
    const pulse = 6 + 4 * Math.sin(this.clock * 5);
    const ring = (n: Container, w: number, h: number, color: number) =>
      this.glow.roundRect(n.x - w / 2 - pulse, n.y - h / 2 - pulse, w + 2 * pulse, h + 2 * pulse, 26).stroke({ width: 7, color });
    // Level 3: the patch's own ground tile is marked; both light after the bookmark.
    if (this.plan.level === 3) {
      const sel = this.tiles[this.s.surfaces[0] === 'stone' ? 0 : 1];
      this.glow.roundRect(sel.x - sel.width / 2 - 8, sel.y - sel.height / 2 - 8, sel.width + 16, sel.height + 16, 26).stroke({ width: 6, color: swatch.green.line });
      if (this.tilesLit && !this.busy) for (const t of this.tiles) ring(t, this.layout.tiles[0].w, this.layout.tiles[0].h, swatch.yellow.fill);
    }
    if (this.busy) return;
    if (this.pointing) {
      const n = this.targetOf(this.pointing);
      const sz = n === this.cloud ? this.layout.cloud : n === this.leaf ? this.layout.leaf : this.layout.tiles[0];
      ring(n, sz.w, sz.h, swatch.yellow.fill);
    } else if (this.leaf.visible && this.saidEnough) ring(this.leaf, LEAF, LEAF, swatch.yellow.fill);
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const s = this.s;
    let a: Action;
    if (this.plan.level === 1) a = s.trials === 0 ? { kind: 'cloud' } : { kind: 'leaf' };
    else if (this.plan.level === 2) {
      // Rain, flip the left ground, rain again, then the leaf.
      if (!s.current) a = { kind: 'cloud' };
      else a = s.trials === 1 ? { kind: 'tile', patch: 0, surface: flip(s.surfaces[0]) } : { kind: 'leaf' };
    } else a = nextAction(s);
    return { tap: { on: this.targetOf(a) }, pause: 0.8 };
  }
}

function icon(): Container {
  const c = new Container();
  const cl = cloudArt(200, 100); cl.y = -110;
  const pockets = [{ x: -40, y: 10, w: 56, h: 40 }, { x: 40, y: 10, w: 56, h: 40 }];
  const p = patchArt('soil', 210, 110, pockets, 1); p.position.set(-30, 20);
  const a = arrowArt({ x1: 70, y1: 60, x2: 110, y2: 110 });
  const pond = new Graphics().roundRect(40, 105, 120, 44, 22).fill(0xbfe3ff).stroke({ width: 4, color: swatch.blue.line });
  c.addChild(cl, a, pond, p);
  for (const q of pockets) { const d = dropArt(36); d.position.set(p.x + q.x, p.y + q.y); c.addChild(d); }
  const d = dropArt(36); d.position.set(100, 126); c.addChild(d);
  return c;
}

function sticker(seed: number): Container {
  const c = new Container();
  const { friend, drops } = stickerPick(seed);
  c.addChild(tile(260, 260, 'white'));
  const pond = new Graphics().ellipse(0, 80, 100, 34).fill(0xbfe3ff).stroke({ width: 4, color: swatch.blue.line });
  const cl = cloudArt(170, 90); cl.y = -80;
  const f = friendArt(friend); f.position.set(0, 70);
  c.addChild(pond, cl, f);
  for (let i = 0; i < drops; i++) { const d = dropArt(34); d.position.set(drops === 1 ? 0 : -30 + i * 60, -10 + i * 14); c.addChild(d); }
  return c;
}

export const rainGarden: GameModule = {
  id: 'rain-garden', name: 'Rain Garden', titleLine: 'game.rain-garden', region: 'tinker-lab', challenge: 'noticing',
  skills: ['observation', 'comparing', 'fair-test', 'water'], bands: ['toddler', 'preschool', 'prek', 'school'], levels: (b) => rangeFor(LEVELS, b),
  describeLevel: (l) => planFor(l).name,
  music: STYLES.bubbles,
  coplayHint: 'One of you chooses the ground; the other taps the cloud and says what happened. Then swap.',
  offScreen: 'Next time it rains, look out the window together: where does the water go on the path, and where on the grass?',
  hubIcon: () => new WigglyIcon(icon()), sticker, create: (ctx) => (planFor(ctx.level).level === 4 ? new RainRoute(ctx) : new RainGarden(ctx)),
  touchDemo: true,
};
