import { Container, Graphics, Rectangle } from 'pixi.js';
import type { Critter } from '../../art/critter';
import { cream, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import { bellArt, oneUseArt, painterArt, seatArt, stackArt, sunHeaderArt, tubArt, vesselArt } from './art';
import {
  applyPicnicMove,
  centre,
  CUP,
  checkPicnic,
  emptyPicnic,
  heapOf,
  nextPicnicMove,
  PlanTally,
  picnicDayFor,
  picnicLayout,
  picnicSpotAt,
  sameStop,
  stopRect,
  VESSEL_IDS,
  type PicnicCheck,
  type PicnicDay,
  type PicnicLayout,
  type PicnicMove,
  type PicnicPlan,
  type PicnicStop,
  type Plan,
  type Rect,
  type VesselId,
} from './logic';

interface Token {
  node: Container;
  drag: DragHandle;
}
interface OneUseToken extends Token {
  /** Where it serves; null while it sits on top of the stack. */
  stop: PicnicStop | null;
}

const RING: Record<VesselId, number> = {
  red: swatch.red.line,
  blue: swatch.blue.line,
  yellow: swatch.yellow.line,
  mug: ink,
};

/**
 * Levels 7–8, Picnic Loop: the friends' cups planned across two or three picnics on one board, with a two-place wash tub
 * between picnics and the Last Heap's outlines as the day's puzzle. Moving a cup is moving it through the day; only a ring
 * of the bell on a board that fails counts (docs/definitions/second-chance-shed-7-8.md).
 */
export class PicnicShed implements Game {
  readonly day: PicnicDay;
  readonly tally = new PlanTally();
  plan: PicnicPlan = emptyPicnic();
  busy = true;
  finished = false;
  readonly vessels = {} as Record<VesselId, Token>;
  oneUse: OneUseToken[] = [];
  /** The draggable cup on top of the one-use stack; dropping it on the board makes a new one. */
  top: OneUseToken | null = null;
  readonly bell: Container;
  painter: Critter | null = null;
  private readonly bellSwing: Container;
  private readonly backdrop: Backdrop;
  private readonly shelfArt = new Graphics();
  private readonly stack = stackArt();
  private readonly headers: Container[] = [];
  private readonly seats: Container[][] = [];
  private readonly tubs: Container[] = [];
  private readonly heapBox = new Container();
  private readonly heap = new Graphics();
  private readonly rings = new Graphics();
  private readonly glow = new Graphics();
  private readonly cupLayer = new Container();
  private painterNode: Container | null = null;
  private bubble: Container | null = null;
  private alive = true;
  private clock = 0;
  private view: View;
  private layoutNow: PicnicLayout;
  private moveCache: { sig: string; move: PicnicMove | null } | null = null;

  constructor(
    private readonly ctx: GameContext,
    readonly levelPlan: Plan,
  ) {
    this.view = ctx.view;
    this.day = picnicDayFor(levelPlan.level, ctx.rng);
    this.layoutNow = picnicLayout(this.view, this.day);
    this.backdrop = new Backdrop(
      {
        sky: [0xffe2c4, cream],
        hills: [swatch.green.light, 0xbfe39a],
        horizon: 0.5,
        clouds: 2,
        sun: false,
        seed: 141,
      },
      ctx.view,
    );
    for (const n of [this.shelfArt, this.stack, this.heapBox, this.rings, this.glow]) n.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.shelfArt, this.stack);
    for (let p = 0; p < this.day.picnics; p++) {
      const h = sunHeaderArt(p, this.layoutNow.headers[p].w);
      h.eventMode = 'none';
      this.headers.push(h);
      const col: Container[] = [];
      for (let k = 0; k < 4; k++) {
        const s = seatArt(k, this.layoutNow.seats[p][k].w);
        s.eventMode = 'none';
        col.push(s);
      }
      this.seats.push(col);
      ctx.stage.addChild(h, ...col);
    }
    for (let t = 0; t < this.day.picnics - 1; t++) {
      const r = this.layoutNow.tubs[t];
      const tub = tubArt(r.w, r.h);
      tub.eventMode = 'none';
      tub.pivot.set(r.w / 2, r.h / 2);
      this.tubs.push(tub);
      ctx.stage.addChild(tub);
    }
    if (this.day.promise) {
      const { critter, bubble } = painterArt();
      const node = new Container();
      node.addChild(critter, bubble);
      ctx.track(critter);
      onTap(node, () => this.tapPainter());
      ctx.stage.addChild(node);
      this.painter = critter;
      this.painterNode = node;
      this.bubble = bubble;
    }
    this.heapBox.addChild(this.heap);
    ctx.stage.addChild(this.heapBox, this.rings);
    const b = bellArt();
    this.bell = b.node;
    this.bellSwing = b.bell;
    this.bell.hitArea = new Rectangle(-60, -60, 120, 120);
    onTap(this.bell, () => this.ring(), { cooldown: 300 });
    ctx.stage.addChild(this.bell, this.cupLayer, this.glow);
    for (const v of VESSEL_IDS) {
      const node = new Container();
      node.addChild(vesselArt(v));
      node.hitArea = new Rectangle(-CUP / 2, -CUP / 2, CUP, CUP);
      const drag = draggable(node, ctx.tw, {
        onPick: () => this.picked(node),
        onDrop: (x, y) => this.dropVessel(v, x, y),
      });
      drag.enabled = false;
      this.cupLayer.addChild(node);
      this.vessels[v] = { node, drag };
    }
  }

  /** What a scripted play reads. */
  get state() {
    return {
      level: this.day.level,
      picnics: this.day.picnics,
      after: this.day.promise?.after ?? null,
      plan: JSON.parse(JSON.stringify(this.plan)) as PicnicPlan,
      heap: heapOf(this.plan),
      check: checkPicnic(this.day, this.plan).kind,
      misses: this.tally.misses,
      hints: this.tally.hints,
      glowing: this.tally.glowing,
      busy: this.busy,
      finished: this.finished,
    };
  }

  start() {
    this.layout();
    void this.begin();
  }

  destroy() {
    this.alive = false;
    for (const v of VESSEL_IDS) this.vessels[v].drag.destroy();
    for (const t of this.oneUse) t.drag.destroy();
    this.top?.drag.destroy();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.layout();
  }

  private get dragging() {
    return (
      VESSEL_IDS.some((v) => this.vessels[v].drag.dragging) ||
      this.oneUse.some((t) => t.drag.dragging) ||
      !!this.top?.drag.dragging
    );
  }

  private layout() {
    const l = (this.layoutNow = picnicLayout(this.view, this.day));
    this.moveCache = null;
    const back = l.back;
    this.shelfArt
      .clear()
      .roundRect(back.x - 8, back.y + back.h - 14, back.w + 16, 22, 10)
      .fill(wood.fill)
      .stroke({ width: 5, color: wood.line });
    for (const v of VESSEL_IDS) {
      const r = l.shelf[v];
      this.shelfArt.ellipse(r.x + r.w / 2, r.y + r.h - 4, 40, 8).fill({ color: ink, alpha: 0.12 });
    }
    const st = centre(l.stack);
    this.stack.position.set(st.x, st.y);
    l.headers.forEach((r, p) => this.headers[p].position.set(r.x, r.y));
    l.seats.forEach((col, p) => col.forEach((r, k) => this.seats[p][k].position.set(r.x, r.y)));
    l.tubs.forEach((r, t) => this.tubs[t].position.set(r.x + r.w / 2, r.y + r.h / 2));
    if (this.painterNode && l.painter) {
      const r = l.painter;
      this.painterNode.position.set(r.x + r.w / 2, r.y);
      this.painterNode.hitArea = new Rectangle(-r.w / 2, 0, r.w, r.h);
      this.bubble!.position.set(0, 50);
      this.painter!.position.set(-10, r.h - 6);
    }
    this.heapBox.position.set(l.heap.x, l.heap.y);
    const bell = centre(l.bell);
    this.bell.position.set(bell.x, bell.y);
    this.sync(false);
  }

  /** Where a token rests at a stop: a little right of and below a seat's centre (the friend peeks out on the left). */
  private restAt(s: PicnicStop | null, v?: VesselId): { x: number; y: number } {
    const l = this.layoutNow;
    if (s === null) return v ? centre(l.shelf[v]) : centre(l.stack);
    const c = centre(stopRect(l, s));
    if (s.at === 'seat') return { x: c.x + 18, y: c.y + 10 };
    if (s.at === 'painter') return { x: c.x + 40, y: c.y + 62 };
    return c;
  }

  /** Bring every token, ring and the heap in line with the plan (a displaced one-use cup goes back to the stack). */
  private sync(animate: boolean) {
    this.moveCache = null;
    const place = (t: Token, at: { x: number; y: number }) => {
      t.drag.home = at;
      if (t.drag.dragging) return;
      this.ctx.tw.kill(t.node);
      if (animate) void this.ctx.tw.to(t.node, { x: at.x, y: at.y }, { duration: 0.25, ease: ease.outQuad });
      else t.node.position.set(at.x, at.y);
    };
    for (const v of VESSEL_IDS) place(this.vessels[v], this.restAt(this.plan.routes[v].at(-1) ?? null, v));
    this.oneUse = this.oneUse.filter((t) => {
      if (t.stop && this.plan.oneUse.some((s) => sameStop(s, t.stop!))) return true;
      this.dropToken(t);
      return false;
    });
    for (const t of this.oneUse) place(t, this.restAt(t.stop));
    if (!this.top) this.top = this.makeOneUse();
    place(this.top, this.restAt(null));
    this.cupLayer.setChildIndex(this.top.node, this.cupLayer.children.length - 1);
    this.drawRings();
    this.drawHeap();
  }

  private makeOneUse(): OneUseToken {
    const node = new Container();
    node.addChild(oneUseArt());
    node.hitArea = new Rectangle(-CUP / 2, -CUP / 2, CUP, CUP);
    const t: OneUseToken = { node, stop: null } as OneUseToken;
    t.drag = draggable(node, this.ctx.tw, {
      onPick: () => this.picked(node),
      onDrop: (x, y) => this.dropOneUse(t, x, y),
    });
    t.drag.enabled = !this.busy && !this.finished;
    this.cupLayer.addChild(node);
    return t;
  }

  /** A one-use cup going back to the stack: its drag released and its node removed. */
  private dropToken(t: OneUseToken) {
    t.drag.destroy();
    t.node.destroy({ children: true });
  }

  /** Earlier stops of every route keep a ring in the cup's colour: this cup already served or was washed there. */
  private drawRings() {
    this.rings.clear();
    for (const v of VESSEL_IDS) {
      const route = this.plan.routes[v];
      for (const s of route.slice(0, -1)) {
        const at = this.restAt(s);
        if (v === 'mug') this.rings.circle(at.x, at.y, 30).stroke({ width: 10, color: swatch.blue.line });
        this.rings.circle(at.x, at.y, 30).stroke({ width: 6, color: v === 'mug' ? 0xffffff : RING[v] });
      }
    }
  }

  /** The Last Heap: dashed outlines for the cups the target allows, and a cup for every one-use cup on a seat. */
  private drawHeap() {
    const g = this.heap.clear();
    const r = this.layoutNow.heap;
    g.roundRect(0, 0, r.w, r.h, 20)
      .fill({ color: wood.light, alpha: 0.55 })
      .stroke({ width: 4, color: wood.line });
    const cell = (i: number) => ({ x: 26 + (i % 3) * 48, y: 34 + Math.floor(i / 3) * 62 });
    for (let i = 0; i < this.day.target; i++) {
      const c = cell(i);
      const pts: [number, number][] = [
        [-18, -22],
        [18, -22],
        [12, 22],
        [-12, 22],
      ];
      for (let e = 0; e < 4; e++) {
        const [ax, ay] = pts[e],
          [bx, by] = pts[(e + 1) % 4];
        for (let k = 0; k < 4; k++) {
          const f = (k + 0.5) / 4;
          g.circle(c.x + ax + (bx - ax) * f, c.y + ay + (by - ay) * f, 2.5).fill(ink);
        }
      }
    }
    const n = heapOf(this.plan);
    for (let i = 0; i < n; i++) {
      const c = cell(i);
      g.poly([c.x - 16, c.y - 20, c.x + 16, c.y - 20, c.x + 11, c.y + 20, c.x - 11, c.y + 20])
        .fill(0xffffff)
        .stroke({ width: 2, color: 0xb8b8c8 });
      g.rect(c.x - 15, c.y - 10, 30, 5).fill(swatch.teal.fill);
    }
  }

  private async begin() {
    await this.ctx.instruct(`shed.picnic.instruct.${this.day.level}` as 'shed.picnic.instruct.7');
    if (!this.alive) return;
    this.busy = false;
    for (const t of this.tokens()) t.drag.enabled = true;
    if (this.day.promise) {
      this.painter!.hop();
      await this.ctx.say(`shed.picnic.paint.after${this.day.promise.after}` as 'shed.picnic.paint.after0');
    }
  }

  private tokens(): Token[] {
    return [...VESSEL_IDS.map((v) => this.vessels[v]), ...this.oneUse, ...(this.top ? [this.top] : [])];
  }

  private tapPainter() {
    if (this.finished || !this.day.promise) return;
    this.painter!.poke();
    void this.ctx.say(`shed.picnic.paint.after${this.day.promise.after}` as 'shed.picnic.paint.after0');
  }

  private picked(node: Container) {
    sfx.tick();
    this.cupLayer.setChildIndex(node, this.cupLayer.children.length - 1);
  }

  private dropVessel(v: VesselId, x: number, y: number): boolean {
    if (this.busy || this.finished) return false;
    const at = picnicSpotAt(this.layoutNow, x, y);
    if (at === null) return false;
    this.doMove({ kind: 'vessel', vessel: v, to: at === 'back' ? 'shelf' : at });
    return true;
  }

  private dropOneUse(t: OneUseToken, x: number, y: number): boolean {
    if (this.busy || this.finished) return false;
    const at = picnicSpotAt(this.layoutNow, x, y);
    if (at === null || (at === 'back' && t.stop === null)) return false;
    const from = t.stop === null ? 'stack' : this.plan.oneUse.findIndex((s) => sameStop(s, t.stop!));
    this.doMove({ kind: 'oneUse', from, to: at === 'back' ? 'stack' : at });
    return true;
  }

  /** Apply a drag to the plan and the tokens; a drop is never judged, only a soft tick and the place breathing. */
  doMove(m: PicnicMove) {
    const before = this.plan;
    this.plan = applyPicnicMove(this.day, this.plan, m);
    if (m.kind === 'oneUse') {
      const moved =
        m.from === 'stack'
          ? this.top!
          : this.oneUse.find((t) => t.stop && sameStop(t.stop, before.oneUse[m.from as number]))!;
      if (m.from === 'stack') {
        this.top = null;
        this.oneUse.push(moved);
      }
      // A one-use cup the move displaced shares the stop the moved cup now takes: it goes back to the stack first.
      if (m.to !== 'stack') {
        const to = m.to;
        this.oneUse = this.oneUse.filter((t) => {
          if (t === moved || !t.stop || !sameStop(t.stop, to)) return true;
          this.dropToken(t);
          return false;
        });
      }
      moved.stop = m.to === 'stack' ? null : m.to;
    }
    sfx.tick();
    const to = m.to;
    if (to !== 'shelf' && to !== 'stack') {
      if (to.at === 'tub') void this.breathe(this.tubs[to.tub], 1.04);
      else if (to.at === 'seat') void this.breathe(this.seats[to.picnic][to.seat]);
    }
    void this.breathe(this.heapBox, 1.03);
    this.sync(true);
  }

  private async breathe(n: Container, size = 1.06) {
    await this.ctx.tw.to(n.scale, { x: size, y: size }, { duration: 0.15 });
    if (this.alive && !n.destroyed)
      await this.ctx.tw.to(n.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack });
  }

  private async wiggle(n: Container) {
    for (const r of [0.08, -0.08, 0.05, -0.05, 0]) {
      if (!this.alive || n.destroyed) return;
      await this.ctx.tw.to(n, { rotation: r }, { duration: 0.07 });
    }
  }

  private async swing() {
    sfx.bell(9, 0.3);
    for (const r of [0.35, -0.3, 0.18, -0.1, 0]) {
      if (!this.alive) return;
      await this.ctx.tw.to(this.bellSwing, { rotation: r }, { duration: 0.09 });
    }
  }

  /** The bell: always dings; a board that works finishes once, an empty seat is free, a failed board says its first unmet condition. */
  ring() {
    if (this.finished) return;
    void this.swing();
    if (this.busy || this.dragging) return;
    const r = this.tally.ringPicnic(this.day, this.plan);
    if (r.kind === 'ok') {
      void this.finale();
      return;
    }
    if (r.kind === 'seats') {
      for (const s of r.check.seats) void this.wiggle(this.seats[s.picnic][s.seat]);
      void this.ctx.say('shed.picnic.seats');
      return;
    }
    sfx.boing();
    void this.explain(r.check, r.glowed);
  }

  private async explain(c: Exclude<PicnicCheck, { kind: 'ok' } | { kind: 'emptySeat' }>, glowed: boolean) {
    const after = this.day.promise?.after ?? 0;
    if (c.kind === 'unwashed') {
      const route = this.plan.routes[c.vessel];
      const at = route.find((s) => s.at === 'seat' && s.picnic === c.picnic)!;
      if (route.at(-1) === at) void this.wiggle(this.vessels[c.vessel].node);
      else if (at.at === 'seat') void this.wiggle(this.seats[at.picnic][at.seat]);
      await this.ctx.say('shed.picnic.wash');
    } else if (c.kind === 'oneUseInTub') {
      const t = this.oneUse.find(
        (o) => o.stop?.at === 'tub' && o.stop.tub === c.tub && o.stop.slot === c.slot,
      );
      if (t) void this.wiggle(t.node);
      await this.ctx.say('shed.picnic.oneuse');
    } else if (c.kind === 'promise') {
      this.painter?.poke();
      await this.ctx.say(
        (c.why === 'notmug'
          ? 'shed.picnic.paint.notmug'
          : c.why === 'dirty'
            ? 'shed.picnic.paint.dirty'
            : `shed.picnic.paint.later.after${after}`) as 'shed.picnic.paint.notmug',
      );
    } else if (c.kind === 'unmet') {
      this.painter?.hop();
      if (this.bubble) void this.breathe(this.bubble, 1.15);
      await this.ctx.say(`shed.picnic.paint.after${after}` as 'shed.picnic.paint.after0');
    } else {
      void this.breathe(this.heapBox, 1.08);
      await this.ctx.say(`shed.picnic.heap.${this.day.target}` as 'shed.picnic.heap.2');
    }
    if (glowed && this.alive && !this.finished) await this.ctx.say('shed.hint-glow');
  }

  private move() {
    const sig = JSON.stringify(this.plan);
    if (this.moveCache?.sig !== sig) this.moveCache = { sig, move: nextPicnicMove(this.day, this.plan) };
    return this.moveCache.move;
  }

  /** The node a move drags, and the rectangle it goes to. */
  private moveEnds(m: PicnicMove): { node: Container; to: Rect } {
    const l = this.layoutNow;
    if (m.kind === 'vessel')
      return {
        node: this.vessels[m.vessel].node,
        to: m.to === 'shelf' ? l.shelf[m.vessel] : stopRect(l, m.to),
      };
    const node =
      m.from === 'stack'
        ? this.top!.node
        : this.oneUse.find((t) => t.stop && sameStop(t.stop, this.plan.oneUse[m.from as number]))!.node;
    return { node, to: m.to === 'stack' ? l.stack : stopRect(l, m.to) };
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    if (!this.tally.glowing || this.finished) return;
    const m = this.move();
    const w = 7 + 2 * Math.sin(this.clock * 5);
    if (!m) {
      const b = this.layoutNow.bell;
      this.glow
        .roundRect(b.x - 10, b.y - 10, b.w + 20, b.h + 20, 24)
        .stroke({ width: w, color: swatch.yellow.fill });
      return;
    }
    const { node, to } = this.moveEnds(m);
    this.glow
      .roundRect(node.x - CUP / 2 - 6, node.y - CUP / 2 - 6, CUP + 12, CUP + 12, 22)
      .stroke({ width: w, color: swatch.yellow.fill });
    this.glow
      .roundRect(to.x - 10, to.y - 10, to.w + 20, to.h + 20, 22)
      .stroke({ width: w, color: swatch.yellow.fill });
  }

  /** Show a hint: the glow (one hint per round); asked again, Show me one makes one drag toward the nearest working board. */
  askForHint() {
    if (this.busy || this.finished || this.dragging) return;
    const m = nextPicnicMove(this.day, this.plan);
    if (!m) {
      void this.ctx.say('shed.ring-now');
      return;
    }
    if (this.tally.ask() === 'glow') {
      void this.ctx.say('shed.hint-glow');
      return;
    }
    this.doMove(m);
  }

  /** Start again: every cup back on the shelf and the one-use cups to the stack; misses and hints stay. */
  restart() {
    if (this.busy || this.finished) return;
    this.plan = emptyPicnic();
    this.sync(true);
  }

  /** The day plays through: friends sip picnic by picnic, one-use cups hop onto the heap, the tubs splash, the painter takes the mug. */
  private async finale() {
    this.finished = true;
    this.busy = true;
    this.glow.clear();
    for (const t of this.tokens()) t.drag.enabled = false;
    if (this.top) this.top.node.visible = false;
    this.ctx.pet.cheer();
    const steps = [3, 5, 7, 9];
    for (let p = 0; p < this.day.picnics; p++) {
      for (let k = 0; k < 4; k++) {
        if (!this.alive) return;
        sfx.bell(steps[k], 0.25);
        void this.breathe(this.seats[p][k], 1.08);
        await this.ctx.tw.wait(0.18);
      }
      if (!this.alive) return;
      const used = this.oneUse.filter((t) => t.stop?.at === 'seat' && t.stop.picnic === p);
      const heap = centre(this.layoutNow.heap);
      for (const t of used) {
        sfx.pop(5);
        void this.ctx.tw
          .to(t.node, { x: heap.x, y: heap.y, alpha: 0 }, { duration: 0.4, ease: ease.inOutSine })
          .then(() => {
            if (!t.node.destroyed) t.node.visible = false;
          });
      }
      if (used.length) await this.ctx.tw.wait(0.45);
      if (!this.alive) return;
      if (p < this.day.picnics - 1) {
        sfx.splash();
        void this.breathe(this.tubs[p], 1.06);
        await this.ctx.tw.wait(0.4);
        if (!this.alive) return;
        for (const v of VESSEL_IDS)
          if (this.plan.routes[v].some((s) => s.at === 'tub' && s.tub === p))
            void this.breathe(this.vessels[v].node, 1.2);
        sfx.sparkle();
        await this.ctx.tw.wait(0.3);
        if (!this.alive) return;
        if (this.day.promise?.after === p) {
          this.painter!.cheer();
          void this.breathe(this.vessels.mug.node, 1.25);
          await this.ctx.say('shed.picnic.paint.thanks');
          if (!this.alive) return;
        }
      }
    }
    for (const s of [3, 5, 7, 9]) {
      sfx.bell(s);
      await this.ctx.tw.wait(0.16);
      if (!this.alive) return;
    }
    sfx.tada();
    await this.ctx.say('shed.picnic.done');
    if (!this.alive) return;
    this.ctx.finish({ misses: this.tally.misses, hints: this.tally.hints });
  }

  /** The ghost finger: the same next drag as Show me one, then the bell once the board works. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.dragging) return null;
    const m = nextPicnicMove(this.day, this.plan);
    if (!m) return { tap: { on: this.bell } };
    const { node, to } = this.moveEnds(m);
    const c = centre(to);
    return { drag: { on: node }, to: { on: this.ctx.stage, x: c.x, y: c.y } };
  }
}
