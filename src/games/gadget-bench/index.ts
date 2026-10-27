/**
 * Gadget Bench: a neighbor shows what its cart must get through; she tries two finished gadgets and gives the one that works
 * (level 1), changes one part of the pet's cart for a new friend (level 2), or builds one from parts into the sockets where
 * they work (level 3). A Try is free and shows where the cart stops; a Give that fails is a miss. Rules: ./logic.ts;
 * definition: docs/definitions/gadget-bench.md.
 */
import { Container, Graphics, Rectangle } from 'pixi.js';
import type { Critter } from '../../art/critter';
import { swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import type { LineId } from '../../content/voice-script';
import { boardArt, gadgetArt, handArt, iconArt, miniCart, partInSocket, requestArt, socketArt, standingCritter, stickerArt, stripPicture, conditionTile, tryArt } from './art';
import {
  applyHelp, benchLayout, briefFor, centre, helpFor, NEIGHBORS, need, nextMove, PARTS, planFor, runPath, sameGadget, socketAt, SOCKET, SOCKET_WORDS, SOCKETS, STRIP, Tally,
  type BenchLayout, type Brief, type Condition, type Gadget, type PartId, type Pt, type Round, type Socket,
} from './logic';

const LEVELS: BandLevels = {
  preschool: { min: 1, max: 1 },
  prek: { min: 1, max: 3 },
  school: { min: 2, max: 3 },
};

/** Seconds the runner takes between two tiles. */
const STEP = 0.45;
/** A drop snaps to a socket within this many socket radii of its centre. */
const SNAP = 1.2;

interface PartNode {
  id: PartId;
  node: Container;
  drag: DragHandle;
  /** The socket it sits in, or null in the tray. */
  at: Socket | null;
  /** Its tray slot. */
  slot: number;
}

interface StripEntry {
  gadget: Gadget;
  failedAt: Condition | null;
}

class GadgetBench implements Game {
  readonly brief: Brief;
  readonly tally = new Tally();
  roundIndex = 0;
  /** Levels 2–3: the cart on the bench. */
  gadget: Gadget = {};
  /** Level 1: each gadget tried; levels 2–3: [0] once Try has run. */
  tried: boolean[] = [false, false];
  /** The gadget whose last Try passed, if it is still the one on the bench. */
  private okGadget: Gadget | null = null;
  strip: StripEntry[] = [];
  busy = false;
  finished = false;
  /** Level 2's opening: the pet builds the first neighbor's cart. */
  showing = false;
  private alive = true;
  private started = false;
  /** Show a hint or Start again pressed while a run or its speech was busy: taken as soon as the game is free. */
  private pending: 'hint' | 'restart' | null = null;
  /** The round's unmet conditions at its start: how many Show a hint presses can count. */
  private startUnmet = 0;
  private epoch = 0;
  private clock = 0;
  private view: View;
  private relayout = false;
  layoutNow: BenchLayout | null = null;

  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly glow = new Graphics();
  boardNodes: Container[] = [];
  handNodes: RoundButton[] = [];
  socketNodes = new Map<Socket, Container>();
  parts: PartNode[] = [];
  tileNodes: Container[] = [];
  private stripNode: Container | null = null;
  private requestCritter: Critter | null = null;
  tryButton: RoundButton | null = null;
  giveButton: RoundButton | null = null;
  private runnerLayer = new Container();
  private celebrationLayer = new Container();

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.brief = briefFor(ctx.level, ctx.rng);
    this.backdrop = new Backdrop({ sky: [0xffd6e3, 0xfff6e0], hills: [0xb8e1f7, 0xf3dcb0], horizon: 0.5, clouds: 2, sun: true, seed: 193 }, ctx.view);
    this.glow.eventMode = 'none';
    this.runnerLayer.eventMode = 'none';
    this.celebrationLayer.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.board);
    this.beginRound();
  }

  private get level() {
    return this.brief.level;
  }

  get round(): Round {
    return this.brief.rounds[this.roundIndex];
  }

  /** The neighbor shown on the request card now (level 2's first neighbor while the pet builds). */
  private get shownNeighbor() {
    return this.showing && this.round.shown ? this.round.shown.neighbor : this.round.neighbor;
  }

  private get shownPath(): Condition[] {
    return this.showing && this.round.shown ? this.round.shown.path : this.round.path;
  }

  /** Is the shown cart the one whose last Try passed? */
  get triedOk(): boolean {
    return !!this.okGadget && sameGadget(this.okGadget, this.gadget);
  }

  private instruction(): LineId {
    return this.level === 1 ? 'bench.instruct.pick' : this.level === 2 ? 'bench.instruct.change' : 'bench.instruct.build';
  }

  /** The model for a round's start (the demo's cart stays as the pet built it at level 2). */
  private beginRound() {
    this.gadget = {};
    this.tried = [false, false];
    this.okGadget = null;
    this.strip = [];
    this.showing = this.level === 2 && !!this.round.shown;
    if (this.showing) this.gadget = { ...this.round.shown!.gadget };
    this.pending = null;
    this.startUnmet = this.round.pair ? 1 : this.unmet();
  }

  /** How many of the round's conditions the bench's cart does not meet yet. */
  private unmet(): number {
    return this.round.path.filter((c) => { const n = need(c); return n && this.gadget[n.socket] !== n.part; }).length;
  }

  start() {
    this.started = true;
    this.build();
    if (this.showing) void this.showFirst();
    else void this.ctx.instruct(this.instruction(), { neighbor: this.round.neighbor.name });
  }

  destroy() {
    this.alive = false;
    for (const p of this.parts) p.drag.destroy();
    if (this.requestCritter) this.ctx.untrack(this.requestCritter);
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    if (!this.started) return;
    if (this.busy || this.finished) { this.relayout = true; return; }
    this.build();
  }

  // ——— Building the scene from the model ———

  private build() {
    this.epoch++;
    this.relayout = false;
    for (const p of this.parts) p.drag.destroy();
    if (this.requestCritter) this.ctx.untrack(this.requestCritter);
    this.parts = [];
    this.boardNodes = [];
    this.handNodes = [];
    this.tileNodes = [];
    this.socketNodes.clear();
    this.stripNode = this.requestCritter = null;
    this.tryButton = this.giveButton = null;
    this.glow.removeFromParent();
    this.runnerLayer.removeFromParent();
    this.celebrationLayer.removeFromParent();
    for (const c of this.runnerLayer.removeChildren()) c.destroy({ children: true });
    for (const c of this.celebrationLayer.removeChildren()) c.destroy({ children: true });
    for (const c of this.board.removeChildren()) c.destroy({ children: true });
    if (this.finished) return;
    const round = this.round;
    const trayCount = this.level === 1 ? 0 : round.tray.length + (round.shown ? 1 : 0);
    const l = benchLayout(this.level, this.shownPath.length, trayCount, this.view);
    this.layoutNow = l;
    if (!l) return;

    // The request card, with a living neighbor on it.
    const req = requestArt(this.shownNeighbor, this.shownPath, l.request.w, l.request.h);
    req.position.copyFrom(centre(l.request));
    this.board.addChild(req);
    req.critter.alive = true;
    this.requestCritter = this.ctx.track(req.critter);

    // The path.
    this.shownPath.forEach((c, i) => {
      const t = new Container();
      t.addChild(conditionTile(c, l.tiles[i].w));
      t.position.copyFrom(centre(l.tiles[i]));
      t.eventMode = 'none';
      this.board.addChild(t);
      this.tileNodes.push(t);
    });

    // The bench: two finished gadgets (level 1) or one cart with sockets.
    if (round.pair) {
      round.pair.gadgets.forEach((g, i) => {
        const r = l.boards[i];
        const b = new Container();
        b.addChild(boardArt(r.w, r.h), gadgetArt(g, round.open, r.w, r.h, round.neighbor.cargo));
        b.position.copyFrom(centre(r));
        b.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
        onTap(b, () => this.tryGadget(i as 0 | 1), { cooldown: 300 });
        this.board.addChild(b);
        this.boardNodes.push(b);
        const hand = new RoundButton(handArt(), swatch.green, l.hands[i].w / 2, () => this.give(i as 0 | 1));
        hand.position.copyFrom(centre(l.hands[i]));
        this.board.addChild(hand);
        this.handNodes.push(hand);
      });
    } else {
      const r = l.boards[0];
      const b = new Container();
      b.addChild(boardArt(r.w, r.h), gadgetArt({}, [], r.w, r.h, round.neighbor.cargo));
      b.position.copyFrom(centre(r));
      b.eventMode = 'none';
      this.board.addChild(b);
      this.boardNodes.push(b);
      for (const s of SOCKETS) {
        const p = socketAt(s, r.w, r.h);
        const sock = new Container();
        sock.addChild(socketArt(round.open.includes(s)));
        sock.position.set(b.x + p.x, b.y + p.y);
        sock.eventMode = 'none';
        this.board.addChild(sock);
        this.socketNodes.set(s, sock);
      }
    }

    // The version strip.
    const strip = new Container();
    strip.eventMode = 'none';
    strip.position.set(l.strip.x, l.strip.y + l.strip.h / 2);
    this.board.addChild(strip);
    this.stripNode = strip;
    this.drawStrip();

    // The tray and its parts (a part the model places sits in its socket).
    if (!round.pair) {
      const ids: PartId[] = [...round.tray, ...(round.shown ? [round.shown.gadget[SOCKETS.find((s) => round.shown!.gadget[s])!]!] : [])];
      ids.forEach((id, slot) => {
        const node = new Container();
        node.addChild(partInSocket(id));
        node.hitArea = new Rectangle(-SOCKET / 2, -SOCKET / 2, SOCKET, SOCKET);
        const at = SOCKETS.find((s) => this.gadget[s] === id) ?? null;
        const home = at ? this.socketCentre(at) : centre(l.tray[slot]);
        node.position.set(home.x, home.y);
        this.board.addChild(node);
        const part: PartNode = { id, node, at, slot, drag: null as unknown as DragHandle };
        part.drag = draggable(node, this.ctx.tw, {
          onPick: () => this.pick(part),
          onDrop: (x, y) => this.drop(part, x, y),
        });
        part.drag.enabled = !this.busy && !this.showing;
        this.parts.push(part);
      });
      // The tray's empty slots, drawn under the parts.
      const slots = new Graphics();
      slots.eventMode = 'none';
      for (const t of l.tray) slots.roundRect(t.x, t.y, t.w, t.h, 20).fill({ color: 0xffffff, alpha: 0.35 }).stroke({ width: 3, color: 0x9c6b3c, alpha: 0.4 });
      this.board.addChildAt(slots, this.board.children.indexOf(strip));
    }

    if (l.tryButton) {
      this.tryButton = new RoundButton(tryArt(), swatch.blue, l.tryButton.w / 2, () => this.tryCart());
      this.tryButton.position.copyFrom(centre(l.tryButton));
      this.board.addChild(this.tryButton);
    }
    if (l.giveButton) {
      this.giveButton = new RoundButton(handArt(), swatch.green, l.giveButton.w / 2, () => this.giveCart());
      this.giveButton.position.copyFrom(centre(l.giveButton));
      this.board.addChild(this.giveButton);
    }
    this.board.addChild(this.glow, this.runnerLayer, this.celebrationLayer);
  }

  /** A socket's centre on the bench's cart, in stage coordinates. */
  private socketCentre(s: Socket): Pt {
    const r = this.layoutNow!.boards[0];
    const p = socketAt(s, r.w, r.h);
    const c = centre(r);
    return { x: c.x + p.x, y: c.y + p.y };
  }

  private partNode(id: PartId): PartNode | undefined {
    return this.parts.find((p) => p.id === id);
  }

  private drawStrip() {
    const s = this.stripNode;
    const l = this.layoutNow;
    if (!s || !l) return;
    for (const c of s.removeChildren()) c.destroy({ children: true });
    this.strip.slice(-6).forEach((e, i) => {
      const pic = stripPicture(e.gadget, e.failedAt, STRIP);
      pic.position.set(i * (STRIP + 8) + STRIP / 2, 0);
      s.addChild(pic);
    });
  }

  // ——— Dragging parts ———

  private pick(part: PartNode) {
    sfx.tick();
    part.node.parent?.addChild(part.node);
    void this.ctx.tw.to(part.node, { rotation: 0.08 }, { duration: 0.12 }).then(() => {
      if (part.drag.dragging && this.alive) void this.ctx.tw.to(part.node, { rotation: -0.06 }, { duration: 0.16 });
    });
  }

  /** A drop snaps to the nearest open socket within reach (swapping out what was there); anything else returns to the tray. */
  private drop(part: PartNode, x: number, y: number): boolean {
    this.ctx.tw.kill(part.node);
    part.node.rotation = 0;
    const l = this.layoutNow;
    if (!l || this.busy || this.finished) return false;
    let best: { s: Socket; d: number } | null = null;
    for (const s of this.round.open) {
      const c = this.socketCentre(s);
      const d = Math.hypot(c.x - x, c.y - y);
      if (d <= (SOCKET / 2) * SNAP && (!best || d < best.d)) best = { s, d };
    }
    if (part.at) { delete this.gadget[part.at]; part.at = null; }
    part.drag.home = centre(l.tray[part.slot]);
    if (!best) { sfx.whoosh(); return false; }
    const was = this.gadget[best.s];
    if (was && was !== part.id) {
      const other = this.partNode(was);
      if (other) {
        other.at = null;
        other.drag.home = centre(l.tray[other.slot]);
        void other.drag.floatHome();
      }
    }
    this.gadget[best.s] = part.id;
    part.at = best.s;
    const c = this.socketCentre(best.s);
    part.drag.home = c;
    sfx.marimba(2 + SOCKETS.indexOf(best.s) * 2, 0.4);
    void this.ctx.tw.to(part.node, { x: c.x, y: c.y }, { duration: 0.15, ease: ease.outBack });
    return true;
  }

  private setDrags(on: boolean) {
    for (const p of this.parts) p.drag.enabled = on;
  }

  // ——— Try and Give ———

  /** Level 1: tap a gadget to Try it (free). */
  tryGadget(i: 0 | 1) {
    const pair = this.round.pair;
    if (!pair || this.busy || this.finished) return;
    void this.run(pair.gadgets[i], 'try', i);
  }

  /** Level 1: the Give hand under a gadget. */
  give(i: 0 | 1) {
    const pair = this.round.pair;
    if (!pair || this.busy || this.finished) return;
    void this.run(pair.gadgets[i], 'give', i);
  }

  private get dragging() {
    return this.parts.some((p) => p.drag.dragging);
  }

  tryCart() {
    if (this.round.pair || this.busy || this.finished || this.showing || this.dragging) return;
    void this.run(this.gadget, 'try', null);
  }

  giveCart() {
    if (this.round.pair || this.busy || this.finished || this.showing || this.dragging) return;
    void this.run(this.gadget, 'give', null);
  }

  /** The cart rolls along the path tile by tile and stops at the first condition it cannot handle. */
  private async run(gadget: Gadget, mode: 'try' | 'give', which: 0 | 1 | null): Promise<void> {
    const l = this.layoutNow;
    if (!l) return;
    this.busy = true;
    this.setDrags(false);
    const epoch = this.epoch;
    const live = () => this.alive && epoch === this.epoch;
    const path = this.shownPath;
    const snapshot: Gadget = { ...gadget };
    const result = runPath(snapshot, path);
    const runner = miniCart(snapshot, l.tiles[0].w * 0.9, this.shownNeighbor.cargo);
    const tileAt = (i: number) => centre(l.tiles[i]);
    runner.position.set(tileAt(0).x, tileAt(0).y + 10);
    this.runnerLayer.addChild(runner);
    if (which !== null) this.boardNodes[which].scale.set(1.04);
    let failedAt: Condition | null = null;
    for (let i = 1; i < path.length; i++) {
      const to = tileAt(i);
      await this.ctx.tw.to(runner, { x: to.x, y: to.y + 10 }, { duration: STEP, ease: ease.inOutSine });
      if (!live()) return;
      if (!result.ok && result.at === path[i]) {
        failedAt = path[i];
        sfx.clunk();
        await this.stopAt(runner, this.tileNodes[i], result.socket, which);
        if (!live()) return;
        await this.ctx.say(`bench.fail.${failedAt}` as LineId);
        if (!live()) return;
        if (snapshot[result.socket]) {
          await this.ctx.say('bench.place.wrong');
          if (!live()) return;
        }
        break;
      }
      sfx.pluck(2 + i * 2, 0.3);
    }
    if (which !== null && !this.boardNodes[which].destroyed) this.boardNodes[which].scale.set(1);
    this.strip.push({ gadget: snapshot, failedAt });
    this.drawStrip();
    if (!failedAt) sfx.bell(9, 0.35);
    await this.ctx.tw.wait(0.3);
    if (!live()) return;
    if (!runner.destroyed) runner.destroy({ children: true });
    if (mode === 'try') await this.afterTry(result, snapshot);
    else await this.afterGive(result, which);
    // A new round (or the finish) took over and reset `busy` itself.
    if (!live()) return;
    this.busy = false;
    this.setDrags(!this.showing);
    // Level 2's opening rebuilds for itself once the new friend arrives.
    if (this.relayout && !this.showing) this.build();
    this.takePending();
  }

  /** A Show a hint or Start again pressed while busy happens now. */
  private takePending() {
    const p = this.pending;
    this.pending = null;
    if (!p || this.busy || this.finished || this.showing) return;
    if (p === 'restart') this.restart();
    else this.askForHint();
  }

  /** The stop: the runner wobbles, the tile shakes and the responsible socket (level 1: the gadget) pulses once. */
  private async stopAt(runner: Container, tile: Container, socket: Socket, which: 0 | 1 | null) {
    const epoch = this.epoch;
    const live = () => this.alive && epoch === this.epoch && !runner.destroyed;
    const shake = async (node: Container, amount: number) => {
      const x0 = node.x;
      for (const dx of [amount, -amount, amount * 0.6, -amount * 0.6, 0]) {
        await this.ctx.tw.to(node, { x: x0 + dx }, { duration: 0.06 });
        if (!live()) return;
      }
    };
    const pulse = which === null ? this.socketNodes.get(socket) : this.boardNodes[which];
    const pulsing = pulse && !pulse.destroyed
      ? this.ctx.tw.to(pulse.scale, { x: 1.14, y: 1.14 }, { duration: 0.2, ease: ease.outBack }).then(() => (live() && !pulse.destroyed ? this.ctx.tw.to(pulse.scale, { x: 1, y: 1 }, { duration: 0.25 }) : undefined))
      : Promise.resolve();
    await Promise.all([
      this.ctx.tw.to(runner, { rotation: -0.25 }, { duration: 0.12 }).then(() => (live() ? this.ctx.tw.to(runner, { rotation: 0.15 }, { duration: 0.14 }) : undefined)).then(() => (live() ? this.ctx.tw.to(runner, { rotation: 0 }, { duration: 0.14 }) : undefined)),
      shake(tile, 7),
      pulsing,
    ]);
  }

  private async afterTry(result: ReturnType<typeof runPath>, snapshot: Gadget) {
    const epoch = this.epoch;
    const which = this.round.pair ? this.round.pair.gadgets.findIndex((g) => sameGadget(g, snapshot)) : 0;
    this.tried[which] = true;
    if (result.ok) {
      this.okGadget = snapshot;
      this.tally.tryOk();
      await this.ctx.say('bench.ok');
      return;
    }
    const lit = this.tally.tryFail(result.at, snapshot[result.socket]);
    if (lit && this.alive && epoch === this.epoch) await this.sayGlow();
  }

  private async afterGive(result: ReturnType<typeof runPath>, which: 0 | 1 | null) {
    const epoch = this.epoch;
    const live = () => this.alive && epoch === this.epoch;
    if (result.ok) {
      await this.celebrate();
      return;
    }
    sfx.boing();
    const outcome = this.tally.miss();
    if (outcome === 'glow') await this.sayGlow();
    else if (outcome === 'install') await this.supportedFinish(which);
    else await this.ctx.say('bench.give.miss');
    if (!live()) return;
  }

  /** The glow: the responsible socket (level 1: the passing gadget) lights and the pet names the part. */
  private async sayGlow() {
    if (this.round.pair) { await this.ctx.say('bench.hint.give'); return; }
    const h = helpFor(this.gadget, this.round.path);
    if (h.kind !== 'install') return;
    await this.ctx.say('bench.glow', { part: PARTS[h.part].name });
  }

  /** After the glow, one more miss installs the part itself (level 1: the passing gadget is given), so every round can end. */
  private async supportedFinish(which: 0 | 1 | null) {
    const epoch = this.epoch;
    if (this.round.pair) {
      await this.ctx.say('bench.hint.give');
      if (!this.alive || epoch !== this.epoch) return;
      const hand = this.handNodes[this.round.pair.passing];
      if (hand && !hand.destroyed) await this.wiggle(hand);
      return;
    }
    void which;
    const h = helpFor(this.gadget, this.round.path);
    if (h.kind !== 'install') return;
    await this.install(h.part, h.socket);
    if (!this.alive || epoch !== this.epoch) return;
    await this.ctx.say('bench.installed', { part: PARTS[h.part].name });
  }

  /** The part flies from wherever it is into the socket; whatever was there returns to the tray. */
  private async install(id: PartId, socket: Socket) {
    const l = this.layoutNow;
    const part = this.partNode(id);
    if (!l || !part) return;
    this.gadget = applyHelp(this.gadget, { kind: 'install', part: id, socket, replaces: this.gadget[socket] ?? null, at: 'smooth' });
    for (const p of this.parts) {
      const at = SOCKETS.find((s) => this.gadget[s] === p.id) ?? null;
      if (at === p.at) continue;
      p.at = at;
      p.drag.home = at ? this.socketCentre(at) : centre(l.tray[p.slot]);
      if (p !== part) void p.drag.floatHome();
    }
    part.node.parent?.addChild(part.node);
    part.node.rotation = 0;
    sfx.whoosh();
    const c = this.socketCentre(socket);
    await this.ctx.tw.to(part.node, { x: c.x, y: c.y }, { duration: 0.5, ease: ease.outBack });
    sfx.marimba(2 + SOCKETS.indexOf(socket) * 2, 0.4);
  }

  private async wiggle(node: Container) {
    const epoch = this.epoch;
    for (const r of [0.18, -0.18, 0.12, -0.12, 0]) {
      await this.ctx.tw.to(node, { rotation: r }, { duration: 0.09 });
      if (!this.alive || epoch !== this.epoch || node.destroyed) return;
    }
  }

  /** A passing Give: the neighbor hops, then two more friends roll in with their own copies. */
  private async celebrate() {
    const epoch = this.epoch;
    const live = () => this.alive && epoch === this.epoch;
    const l = this.layoutNow!;
    sfx.tada();
    this.ctx.pet.cheer();
    this.requestCritter?.cheer();
    this.ctx.particles.burst(this.boardNodes[0].x, this.boardNodes[0].y, { colors: [swatch.yellow.fill, swatch.green.fill, 0xffffff], count: 14 });
    await this.ctx.say('bench.give.ok', { neighbor: this.round.neighbor.name });
    if (!live()) return;
    const gadget = this.round.pair ? this.round.pair.gadgets[this.round.pair.passing] : this.gadget;
    const others = NEIGHBORS.filter((n) => n !== this.round.neighbor).slice(0, 2);
    const y = l.strip.y - 10;
    const size = 70;
    const slides = others.map((n, i) => {
      const c = new Container();
      const critter = standingCritter(n, 90);
      critter.position.set(-size * 0.6, 0);
      const cart = miniCart(gadget, size, n.cargo);
      cart.position.set(size * 0.3, -size * 0.3);
      c.addChild(critter, cart);
      c.position.set(-200 - i * 160, y);
      this.celebrationLayer.addChild(c);
      const x = l.strip.x + i * 200 + size;
      return this.ctx.tw.to(c, { x }, { duration: 0.9, ease: ease.outQuad, delay: i * 0.15 });
    });
    sfx.sparkle();
    await Promise.all(slides);
    if (!live()) return;
    await this.ctx.say('bench.spread');
    if (!live()) return;
    await this.ctx.tw.wait(0.6);
    if (!live()) return;
    this.nextRound();
  }

  private nextRound() {
    this.roundIndex++;
    if (this.roundIndex >= this.brief.rounds.length) {
      this.finished = true;
      void this.ctx.say('bench.done');
      this.ctx.finish({ misses: this.tally.misses, hints: this.tally.hints });
      return;
    }
    this.tally.nextRound();
    this.beginRound();
    this.busy = false;
    this.build();
    if (this.showing) void this.showFirst();
    else void this.ctx.instruct(this.instruction(), { neighbor: this.round.neighbor.name });
  }

  /** Level 2's opening: the pet's part slides into its socket, the cart crosses the first neighbor's path, then the new friend arrives. */
  private async showFirst() {
    const shown = this.round.shown;
    const l = this.layoutNow;
    if (!shown || !l) { this.showing = false; return; }
    this.busy = true;
    this.setDrags(false);
    const epoch = this.epoch;
    const live = () => this.alive && epoch === this.epoch;
    const socket = SOCKETS.find((s) => shown.gadget[s])!;
    const part = this.partNode(shown.gadget[socket]!);
    const c = this.socketCentre(socket);
    if (part) part.node.position.set(c.x, c.y - 160);
    void this.ctx.say('bench.watch', { neighbor: shown.neighbor.name });
    await this.ctx.tw.wait(0.6);
    if (!live()) return;
    if (part) {
      await this.ctx.tw.to(part.node, { y: c.y }, { duration: 0.5, ease: ease.outBack });
      if (!live()) return;
      sfx.marimba(2 + SOCKETS.indexOf(socket) * 2, 0.4);
    }
    this.busy = false;
    await this.run(this.gadget, 'try', null);
    if (!live()) return;
    this.busy = true;
    this.requestCritter?.hop(0.9);
    await this.ctx.tw.wait(0.4);
    if (!live()) return;
    this.showing = false;
    this.tried = [false, false];
    this.okGadget = null;
    this.strip = [];
    this.startUnmet = this.unmet();
    this.build();
    this.busy = false;
    this.setDrags(true);
    this.takePending();
    void this.ctx.say('bench.newfriend', { neighbor: this.round.neighbor.name }).then(() => {
      if (live()) void this.ctx.instruct(this.instruction(), { neighbor: this.round.neighbor.name });
    });
  }

  restart() {
    if (this.finished) return;
    if (this.busy || this.showing) { this.pending = 'restart'; return; }
    this.epoch++;
    this.beginRound();
    this.build();
    if (this.showing) void this.showFirst();
  }

  // ——— Help ———

  /** What help would do next on the bench's cart (a scripted check reads it). */
  nextHelp() {
    return helpFor(this.gadget, this.round.path);
  }

  hintLabel = 'Show a hint';

  /** Show a hint: level 1 wiggles the passing gadget's Give hand; levels 2–3 install the part the first unmet condition needs. */
  askForHint() {
    if (this.finished) return;
    if (this.busy || this.showing) { this.pending = 'hint'; return; }
    if (this.round.pair) {
      this.tally.help(1);
      void this.ctx.say('bench.hint.give');
      const hand = this.handNodes[this.round.pair.passing];
      if (hand) void this.wiggle(hand);
      return;
    }
    const h = helpFor(this.gadget, this.round.path);
    if (h.kind !== 'install') { void this.ctx.say('bench.hint.done'); return; }
    this.tally.help(this.startUnmet);
    void this.ctx.say('bench.hint.part', { part: PARTS[h.part].name, where: SOCKET_WORDS[h.socket] });
    this.busy = true;
    this.setDrags(false);
    const epoch = this.epoch;
    void this.install(h.part, h.socket).then(() => {
      if (!this.alive || epoch !== this.epoch) return;
      this.busy = false;
      this.setDrags(true);
      if (this.relayout) this.build();
      this.takePending();
    });
  }

  update(dt: number) {
    this.clock += dt;
    if (this.relayout && !this.busy && !this.finished) this.build();
    this.glow.clear();
    if (!this.tally.glowing || this.finished || !this.layoutNow) return;
    const r = 1 + 0.05 * Math.sin(this.clock * 5);
    if (this.round.pair) {
      const b = this.boardNodes[this.round.pair.passing];
      const rect = this.layoutNow.boards[this.round.pair.passing];
      if (b) this.glow.roundRect(b.x - rect.w / 2 - 8 * r, b.y - rect.h / 2 - 8 * r, rect.w + 16 * r, rect.h + 16 * r, 30).stroke({ width: 8, color: swatch.yellow.fill });
      return;
    }
    const h = helpFor(this.gadget, this.round.path);
    if (h.kind !== 'install') return;
    const c = this.socketCentre(h.socket);
    this.glow.circle(c.x, c.y, (SOCKET / 2 + 10) * r).stroke({ width: 8, color: swatch.yellow.fill });
    const part = this.partNode(h.part);
    if (part && !part.drag.dragging && !this.busy && part.at !== h.socket) part.node.rotation = Math.sin(this.clock * 9) * 0.12;
  }

  /** The ghost finger: level 1 tries the failing gadget, the passing one, then gives it; levels 2–3 drag what help names, Try, Give. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy || this.showing || !this.layoutNow) return null;
    const m = nextMove(this.round, this.gadget, this.tried, this.triedOk, this.level);
    if ('tryGadget' in m) return this.boardNodes[m.tryGadget] ? { tap: { on: this.boardNodes[m.tryGadget] }, pause: 0.6 } : null;
    if ('give' in m) return this.handNodes[m.give] ? { tap: { on: this.handNodes[m.give] } } : null;
    if ('drag' in m) {
      const part = this.partNode(m.drag);
      if (!part || part.drag.dragging) return null;
      const c = this.socketCentre(m.to);
      return { drag: { on: part.node }, to: { on: this.board, x: c.x, y: c.y } };
    }
    if ('tryCart' in m) return this.tryButton ? { tap: { on: this.tryButton } } : null;
    return this.giveButton ? { tap: { on: this.giveButton } } : null;
  }
}

class BenchIcon extends WigglyIcon {
  constructor() {
    super(iconArt());
  }
}

/** A seeded sticker: a cart with one working part in place and a tick. */
function sticker(seed: number): Container {
  const rng = new Rng(seed);
  return stickerArt(rng.pick(['wheels', 'float', 'umbrella', 'lantern'] as PartId[]), rng.pick(NEIGHBORS).cargo);
}

export const gadgetBench: GameModule = {
  id: 'gadget-bench',
  name: 'Gadget Bench',
  titleLine: 'game.gadget-bench',
  region: 'tinker-lab',
  skills: ['design', 'testing', 'problem-solving', 'cause-and-effect'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).describe,
  music: STYLES.stickers,
  coplayHint: 'One of you is the neighbor and says what the cart must get through; the other builds it. Then swap.',
  offScreen: 'Find something with wheels at home and ask {name} what the wheels are for.',
  hubIcon: () => new BenchIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new GadgetBench(ctx),
};
