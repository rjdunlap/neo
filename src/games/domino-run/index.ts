import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { swatch, wood, type Swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  DOMINO_H, DOMINO_W, dominoLayout, emptyPlacement, hintPlacement, makeRound, PITCH, planFor, remaining, run, sizeAt, slotBox, solutions,
  SLOT_H, TRAY_H, TRAY_W, type DominoLayout, type Hint, type Line, type Placement, type Plan, type Size,
} from './logic';

const LEVELS: BandLevels = {
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 5 },
  school: { min: 4, max: 8 },
};

/** Seconds between one domino falling and the next. */
const CLACK = 0.18;
/** A press that travels this far is a drag, not a tap. */
const DRAG_START = 20;
/** A dropped domino snaps to the nearest empty socket within this far, sideways. */
const SNAP = 0.6 * PITCH;
/** The starter's paw pulses this long after her last placement. */
const PAW_WAIT = 3;
const PINNED: Swatch = { fill: 0x9c6b3c, line: 0x5e3d28, light: 0xd9a066 };
const ink2 = 0x5e3d28;
const LINE_COLORS: Swatch[] = [swatch.blue, swatch.red, swatch.purple, swatch.orange, swatch.teal, swatch.pink];

/** A domino standing on (0, 0), its bottom middle: dots show its size (1, 2 or 3), so height is never the only cue. */
export function dominoArt(size: number, color: Swatch, paw = false): Graphics {
  const h = DOMINO_H[size], w = DOMINO_W + (size - 1) * 6;
  const g = new Graphics().roundRect(-w / 2, -h, w, h, 9).fill(color.fill).stroke({ width: 4, color: color.line });
  g.roundRect(-w / 2 + 6, -h + 6, 6, h - 12, 3).fill({ color: 0xffffff, alpha: 0.3 });
  if (paw) {
    g.circle(0, -h / 2 + 6, 8).fill(0xffffff);
    for (const [x, y] of [[-8, -10], [0, -14], [8, -10]]) g.circle(x, -h / 2 + y, 3.5).fill(0xffffff);
  } else {
    for (let k = 0; k < size; k++) g.circle(0, -h + (h * (k + 1)) / (size + 1), 5.5).fill(0xffffff).stroke({ width: 2, color: color.line });
  }
  return g;
}

/** The bell on its post, or the big gong in its frame, standing on (0, 0); the part that swings is the first child. */
function endArt(end: 'bell' | 'gong'): Container {
  const c = new Container();
  const swing = new Container();
  if (end === 'bell') {
    const post = new Graphics().rect(-5, -150, 10, 150).fill(wood.fill).stroke({ width: 3, color: wood.line })
      .roundRect(-30, -156, 60, 12, 5).fill(wood.fill).stroke({ width: 3, color: wood.line });
    const bell = new Graphics()
      .moveTo(-28, 0).bezierCurveTo(-26, -14, -22, -44, 0, -46).bezierCurveTo(22, -44, 26, -14, 28, 0).closePath()
      .fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line, join: 'round' })
      .circle(0, 4, 7).fill(swatch.yellow.line);
    bell.position.set(0, 46);
    swing.addChild(bell);
    swing.position.set(0, -144);
    c.addChild(post, swing);
  } else {
    const frame = new Graphics().rect(-62, -168, 10, 168).rect(52, -168, 10, 168).fill(wood.fill)
      .roundRect(-66, -176, 132, 14, 6).fill(wood.fill).stroke({ width: 3, color: wood.line });
    const gong = new Graphics()
      .moveTo(-20, 0).lineTo(-10, 22).moveTo(20, 0).lineTo(10, 22).stroke({ width: 3, color: ink2 })
      .circle(0, 72, 50).fill(swatch.orange.fill).stroke({ width: 5, color: swatch.orange.line })
      .circle(0, 72, 18).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.orange.line });
    for (const [x, y] of [[-30, 50], [30, 50], [-30, 94], [30, 94]]) gong.circle(x, y, 5).fill(0xffffff);
    swing.addChild(gong);
    swing.position.set(0, -164);
    c.addChild(frame, swing);
  }
  return c;
}
interface Piece {
  size: Size;
  /** Its own place in the tray, where it goes back to. */
  home: number;
  /** The socket it stands in, or null in the tray. */
  at: { lane: number; slot: number } | null;
  node: Container;
  handle: DragHandle;
  /** Where the finger went down and where it is now, in stage units, so a drop knows a tap from a drag. */
  down: { x: number; y: number; id: number } | null;
  far: boolean;
}

class DominoRun implements Game {
  readonly plan: Plan;
  readonly lines: Line[];
  index = -1;
  line: Line | null = null;
  placed: Placement = [];
  misses = 0;
  hints = 0;
  /** Stalled runs on this line. */
  stalls = 0;
  busy = true;
  finished = false;
  /** The glowing next step, until she places something. */
  hinted: Hint | null = null;

  private readonly laneLayer = new Container();
  private readonly pieceLayer = new Container();
  private readonly glow = new Graphics();
  private readonly ring = new Graphics();
  private lay: DominoLayout;
  private pieces: Piece[] = [];
  /** Every standing thing by lane and slot (starter, pinned, placed), for the fall. */
  private nodes: (Container | null)[][] = [];
  private ends: Container[] = [];
  private starters: Container[] = [];
  private color: Swatch = swatch.blue;
  private clock = 0;
  private idle = 0;
  private ringAt: { x: number; y: number; t: number } | null = null;
  private relayout = false;
  private pendingHint = false;
  private told = false;
  private sols: Placement[] = [];

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    // The how-to card's demonstration plays one line, so it fits the card's time.
    this.lines = makeRound(this.plan, ctx.rng, ctx.demo ? 1 : this.plan.lines);
    this.lay = dominoLayout(this.plan.fork ? 2 : 1, ctx.view);
    this.glow.eventMode = 'none';
    this.ring.eventMode = 'none';
    ctx.stage.addChild(this.laneLayer, this.ring, this.glow, this.pieceLayer);
  }

  readonly hintLabel = 'Show a hint';

  start() {
    void this.next();
  }

  resize(v: View) {
    this.lay = dominoLayout(this.plan.fork ? 2 : 1, v, this.line?.tray.length);
    if (!this.line) return;
    if (this.busy || this.pieces.some((p) => p.handle.dragging)) this.relayout = true;
    else this.build();
  }

  update(dt: number) {
    this.clock += dt;
    this.idle += dt;
    const r = this.ring.clear();
    if (this.ringAt) {
      this.ringAt.t -= dt;
      if (this.ringAt.t <= 0) this.ringAt = null;
      else r.circle(this.ringAt.x, this.ringAt.y, 52 + 5 * Math.sin(this.clock * 7)).stroke({ width: 6, color: swatch.orange.fill, alpha: Math.min(1, this.ringAt.t) });
    }
    const g = this.glow.clear();
    for (const s of this.starters) s.scale.set(1);
    if (!this.line || this.busy || this.finished) return;
    const pulse = 1 + 0.08 * Math.sin(this.clock * 7);
    // The paw pulses whatever she built, so it never says whether the line is right.
    const left = remaining(this.line, this.placed).length;
    const paw = this.plan.tapAny || (this.plan.id === 2 ? left === 0 : left === 0 || this.idle >= PAW_WAIT);
    if (paw) for (const s of this.starters) s.scale.set(pulse);
    // Level 2's gap glows from the start.
    if (this.plan.id === 2) {
      const lane = this.line.lanes[0];
      const slot = lane.sockets[0];
      if (!this.placed[0][slot]) this.shadow(g, 0, slot, 1);
    }
    const h = this.hinted;
    if (h?.kind === 'place') {
      const p = this.trayPiece(h.size);
      if (p) {
        const t = this.lay.tray[p.home];
        g.roundRect(t.hit.x - 4, t.hit.y - 4, t.hit.w + 8, t.hit.h + 8, 18).stroke({ width: 5 + 2 * Math.sin(this.clock * 6), color: swatch.yellow.fill });
      }
      this.shadow(g, h.lane, h.slot, h.size);
    } else if (h?.kind === 'remove') {
      const b = slotBox(this.lay.lanes[h.lane], h.slot);
      g.roundRect(b.x + 4, b.y, b.w - 8, b.h, 18).stroke({ width: 5 + 2 * Math.sin(this.clock * 6), color: swatch.yellow.fill });
    } else if (h?.kind === 'run') {
      for (const s of this.starters) s.scale.set(1 + 0.14 * Math.sin(this.clock * 7));
    }
  }

  destroy() {
    for (const p of this.pieces) p.handle.destroy();
  }

  /** Show a hint, from the pause sheet: the same glow the second stall brings. */
  askForHint() {
    if (this.finished || !this.line) return;
    if (this.busy) {
      this.pendingHint = true;
      return;
    }
    this.showHint();
  }

  /** The ghost finger: drag the hint's domino into its socket until the line would ring, then tap the starter. It never shows a stall. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.line || this.pieces.some((p) => p.handle.dragging)) return null;
    if (this.plan.tapAny) return { tap: { on: this.nodes[0][1] ?? this.starters[0], x: 0, y: -40 } };
    const h = hintPlacement(this.line, this.placed, this.sols);
    if (h.kind === 'run') return { tap: { on: this.starters[0], x: 0, y: -40 } };
    if (h.kind === 'remove') {
      const p = this.pieces.find((q) => q.at?.lane === h.lane && q.at.slot === h.slot);
      return p ? { tap: { on: p.node, x: 0, y: -60 } } : null;
    }
    if (h.kind !== 'place') return null;
    const p = this.trayPiece(h.size);
    if (!p) return null;
    const l = this.lay.lanes[h.lane];
    return { drag: { on: p.node, x: 0, y: -60 }, to: { on: this.ctx.stage, x: l.x0 + h.slot * PITCH, y: l.base }, pause: 0.3 };
  }

  /* -------------------------------------------------------------------------------------------- */

  private async next() {
    this.busy = true;
    this.index++;
    this.hinted = null;
    this.stalls = 0;
    this.ringAt = null;
    if (this.index >= this.lines.length) return void this.finale();
    for (const p of this.pieces) p.handle.destroy();
    this.pieces = [];
    this.line = this.lines[this.index];
    this.placed = emptyPlacement(this.line);
    this.sols = solutions(this.line);
    this.color = LINE_COLORS[(this.index + this.ctx.rng.int(0, LINE_COLORS.length - 1)) % LINE_COLORS.length];
    this.build();
    this.laneLayer.x = this.pieceLayer.x = this.ctx.view.w;
    await Promise.all([
      this.ctx.tw.to(this.laneLayer, { x: 0 }, { duration: 0.5, ease: ease.outQuad }),
      this.ctx.tw.to(this.pieceLayer, { x: 0 }, { duration: 0.5, ease: ease.outQuad }),
    ]);
    this.busy = false;
    this.idle = 0;
    this.afterBusy();
    if (this.told) return;
    this.told = true;
    const id = this.plan.tapAny ? 'domino-run.instruct-tap' : this.plan.id === 2 ? 'domino-run.instruct-gap' : this.plan.fork ? 'domino-run.instruct-fork' : 'domino-run.instruct';
    await this.ctx.instruct(id);
    if (this.plan.id === 4) await this.ctx.say('domino-run.tall');
    if (this.plan.id === 6) await this.ctx.say('domino-run.grow');
  }

  /** Draw the line as it stands: lanes, pinned dominoes, starters, ends, and her dominoes in their sockets or the tray. */
  private build() {
    const line = this.line!;
    for (const p of this.pieces) p.handle.destroy();
    this.laneLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.pieceLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.lay = dominoLayout(line.lanes.length, this.ctx.view, line.tray.length);
    for (const t of this.lay.tray.slice(0, line.tray.length)) {
      const mat = new Graphics().roundRect(t.hit.x + 6, t.hit.y + 6, t.hit.w - 12, t.hit.h - 6, 16).fill({ color: wood.light, alpha: 0.45 });
      mat.eventMode = 'none';
      this.laneLayer.addChild(mat);
    }
    this.nodes = [];
    this.ends = [];
    this.starters = [];
    line.lanes.forEach((lane, k) => {
      const l = this.lay.lanes[k];
      const x = (s: number) => l.x0 + s * PITCH;
      const sand = new Graphics().roundRect(x(0) - 46, l.base - 4, lane.n * PITCH + 92, 22, 10).fill(swatch.yellow.light).stroke({ width: 3, color: wood.light });
      this.laneLayer.addChild(sand);
      const row: (Container | null)[] = new Array(lane.n + 1).fill(null);
      for (const s of lane.sockets) {
        const socket = new Graphics().roundRect(-24, -84, 48, 84, 10).stroke({ width: 3, color: wood.line, alpha: 0.45 })
          .roundRect(-28, -6, 56, 8, 4).fill({ color: wood.line, alpha: 0.35 });
        socket.position.set(x(s), l.base);
        socket.eventMode = 'none';
        this.laneLayer.addChild(socket);
      }
      for (let s = 1; s < lane.n; s++) {
        if (!lane.fixed[s]) continue;
        const d = new Container();
        d.addChild(dominoArt(lane.fixed[s], this.plan.tapAny ? this.color : PINNED));
        d.position.set(x(s), l.base);
        if (this.plan.tapAny) {
          d.hitArea = new Rectangle(-PITCH / 2, -SLOT_H, PITCH, SLOT_H);
          onTap(d, () => void this.run(s), { cooldown: 400 });
        } else d.eventMode = 'none';
        this.laneLayer.addChild(d);
        row[s] = d;
      }
      const starter = new Container();
      starter.addChild(dominoArt(1, swatch.green, true));
      starter.position.set(x(0), l.base);
      starter.hitArea = new Rectangle(-PITCH / 2, -SLOT_H, PITCH, SLOT_H);
      onTap(starter, () => void this.run(0), { cooldown: 400 });
      this.laneLayer.addChild(starter);
      this.starters.push(starter);
      row[0] = starter;
      const end = endArt(lane.end);
      end.position.set(x(lane.n), l.base);
      end.eventMode = 'none';
      this.laneLayer.addChild(end);
      this.ends.push(end);
      this.nodes.push(row);
    });
    if (line.lanes.length === 2) {
      // The split block: one wooden piece joining the two starters, so one tap starts both lanes.
      const [a, b] = this.lay.lanes;
      const block = new Graphics().roundRect(a.x0 - 40, a.base + 18, 18, b.base - a.base - 18, 8).fill(wood.fill).stroke({ width: 3, color: wood.line });
      block.eventMode = 'none';
      this.laneLayer.addChildAt(block, 0);
    }
    const old = this.pieces;
    this.pieces = line.tray.map((size, i) => this.makePiece(size, i, old[i]?.at ?? null));
  }

  private makePiece(size: Size, home: number, at: Piece['at']): Piece {
    const node = new Container();
    node.addChild(dominoArt(size, this.color));
    this.pieceLayer.addChild(node);
    const piece: Piece = { size, home, at, node, handle: null as unknown as DragHandle, down: null, far: false };
    piece.handle = draggable(node, this.ctx.tw, {
      onPick: () => sfx.pop(5),
      onDrop: (x, y) => this.drop(piece, x, y),
    });
    node.on('pointerdown', (e: FederatedPointerEvent) => {
      const p = this.ctx.stage.toLocal(e.global);
      piece.down = { x: p.x, y: p.y, id: e.pointerId };
      piece.far = false;
    });
    node.on('globalpointermove', (e: FederatedPointerEvent) => {
      if (!piece.down || e.pointerId !== piece.down.id) return;
      const p = this.ctx.stage.toLocal(e.global);
      if (Math.hypot(p.x - piece.down.x, p.y - piece.down.y) >= DRAG_START) piece.far = true;
    });
    this.settle(piece, false);
    return piece;
  }

  /** Put a piece where it belongs now (its socket or its tray place), with its hit area. */
  private settle(p: Piece, animate = true) {
    let x: number, y: number;
    if (p.at) {
      const l = this.lay.lanes[p.at.lane];
      x = l.x0 + p.at.slot * PITCH;
      y = l.base;
      p.node.hitArea = new Rectangle(-PITCH / 2, -SLOT_H, PITCH, SLOT_H);
    } else {
      const t = this.lay.tray[p.home];
      x = t.x;
      y = t.y - 6;
      p.node.hitArea = new Rectangle(-TRAY_W / 2, -TRAY_H + 6, TRAY_W, TRAY_H);
    }
    p.handle.home = { x, y };
    this.ctx.tw.kill(p.node);
    p.node.rotation = 0;
    if (animate) void this.ctx.tw.to(p.node, { x, y }, { duration: 0.2, ease: ease.outQuad });
    else p.node.position.set(x, y);
    if (p.at) this.nodes[p.at.lane][p.at.slot] = p.node;
  }

  private trayPiece(size: number): Piece | undefined {
    return this.pieces.find((p) => !p.at && p.size === size);
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Touch                                                                                          */
  /* -------------------------------------------------------------------------------------------- */

  private drop(p: Piece, x: number, y: number): boolean {
    const tap = !p.far;
    p.down = null;
    p.far = false;
    if (this.busy || this.finished || !this.line) return false;
    if (tap) {
      if (p.at) return this.moveTo(p, null), true;
      if (!this.plan.hop) return false;
      // Levels 1–2: a tapped tray domino hops into the glowing gap.
      const lane = 0, slot = this.line.lanes[0].sockets.find((s) => !this.placed[0][s]);
      if (slot === undefined) return false;
      this.moveTo(p, { lane, slot });
      return true;
    }
    const target = this.socketNear(x, y, p);
    if (!target) {
      sfx.tick();
      return false;
    }
    const other = this.pieces.find((q) => q !== p && q.at?.lane === target.lane && q.at.slot === target.slot);
    const from = p.at;
    if (other) this.moveTo(other, from, false);
    this.moveTo(p, target);
    return true;
  }

  /** The nearest socket to a carried domino's foot, empty or holding another of her dominoes, within 0.6 of a slot sideways. */
  private socketNear(x: number, y: number, p: Piece): { lane: number; slot: number } | null {
    let best: { lane: number; slot: number } | null = null, bestD = Infinity;
    this.line!.lanes.forEach((lane, k) => {
      const l = this.lay.lanes[k];
      for (const s of lane.sockets) {
        if (p.at?.lane === k && p.at.slot === s) continue;
        const dx = Math.abs(x - (l.x0 + s * PITCH)), dy = y - l.base;
        if (dx > SNAP || dy < -SLOT_H + 20 || dy > 110) continue;
        const d = Math.hypot(dx, dy / 2);
        if (d < bestD) { best = { lane: k, slot: s }; bestD = d; }
      }
    });
    return best;
  }

  /** Stand a domino in a socket, or send it back to the tray (null). Any placement clears the glow. */
  private moveTo(p: Piece, to: Piece['at'], sound = true) {
    if (p.at) {
      this.placed[p.at.lane][p.at.slot] = 0;
      if (this.nodes[p.at.lane][p.at.slot] === p.node) this.nodes[p.at.lane][p.at.slot] = null;
    }
    p.at = to;
    if (to) this.placed[to.lane][to.slot] = p.size;
    this.settle(p);
    this.hinted = null;
    this.idle = 0;
    if (sound) to ? sfx.clunk() : sfx.pop(3);
  }

  /* -------------------------------------------------------------------------------------------- */
  /* The run                                                                                        */
  /* -------------------------------------------------------------------------------------------- */

  private async run(from: number) {
    if (this.busy || this.finished || !this.line || this.pieces.some((p) => p.handle.dragging)) return;
    this.busy = true;
    this.hinted = null;
    this.ringAt = null;
    for (const p of this.pieces) p.handle.enabled = false;
    const line = this.line;
    const results = run(line, this.placed, from);
    const fell: Container[] = [];
    await Promise.all(results.map(async (r, k) => {
      const lane = line.lanes[k];
      for (const [i, slot] of r.fallen.entries()) {
        const node = this.nodes[k][slot];
        if (node) {
          fell.push(node);
          void this.ctx.tw.to(node, { rotation: 1.15 }, { duration: 0.22, ease: ease.inQuad });
        }
        sfx.marimba(3 + i + k * 2, 0.35);
        await this.ctx.tw.wait(CLACK);
      }
      if (r.rung) {
        const swing = this.ends[k].children[1];
        if (lane.end === 'gong') {
          sfx.bell(0, 0.5);
          sfx.rumble();
        } else sfx.bell(10 + k * 2, 0.45);
        await this.ctx.tw.to(swing, { rotation: 0.35 }, { duration: 0.12 });
        await this.ctx.tw.to(swing, { rotation: -0.2 }, { duration: 0.2 });
        await this.ctx.tw.to(swing, { rotation: 0 }, { duration: 0.25, ease: ease.outBack });
      } else if (r.stall) {
        const l = this.lay.lanes[k];
        const last = this.nodes[k][r.stall.from];
        if (last) {
          // The last one to fall wobbles where it leans.
          await this.ctx.tw.to(last, { rotation: 0.9 }, { duration: 0.1 });
          await this.ctx.tw.to(last, { rotation: 1.15 }, { duration: 0.15, ease: ease.outBack });
        }
        this.ringAt = { x: l.x0 + r.stall.at * PITCH, y: l.base - 60, t: 2.2 };
      }
    }));
    if (results.every((r) => r.rung)) return void this.lineDone(results.some((r, k) => r.rung && line.lanes[k].end === 'gong'));
    const stall = results.find((r) => r.stall)!.stall!;
    sfx.boing();
    await this.ctx.say(stall.reason === 'too-far' ? 'domino-run.too-far' : (this.plan.id === 6 && sizeAt(line.lanes[0], this.placed[0], stall.at) === 3 ? 'domino-run.too-heavy-giant' : 'domino-run.too-heavy'));
    await this.standUp(fell);
    this.stalls++;
    this.busy = false;
    this.idle = 0;
    for (const p of this.pieces) p.handle.enabled = true;
    // Every second stall lights the next useful placement (never at levels 1–2, where the gap already glows).
    if (!this.plan.hop && this.stalls % 2 === 0) this.showHint();
    this.afterBusy();
  }

  private async standUp(fell: Container[]) {
    await Promise.all(fell.map((n) => this.ctx.tw.to(n, { rotation: 0 }, { duration: 0.6, ease: ease.outBack })));
  }

  /** Things put off while the chain ran: a hint asked for, a new screen size. */
  private afterBusy() {
    if (this.relayout) {
      this.relayout = false;
      this.build();
    }
    if (this.pendingHint) {
      this.pendingHint = false;
      this.showHint();
    }
  }

  private showHint() {
    if (this.finished || !this.line || this.busy) return;
    const h = hintPlacement(this.line, this.placed, this.sols);
    if (h.kind === 'run') return void this.ctx.say('domino-run.start');
    if (h.kind === 'none') return;
    if (this.hinted) return;
    this.hinted = h;
    this.hints++;
    void this.ctx.say('domino-run.hint');
  }

  private async lineDone(gong: boolean) {
    sfx.sparkle();
    this.ctx.pet.cheer();
    for (const end of this.ends) {
      const b = end.getBounds();
      this.ctx.particles.burst(b.x + b.width / 2, b.y + 30, { kind: 'dot', colors: [swatch.yellow.fill, 0xffffff], count: 10, speed: [60, 180], gravity: 0, life: [0.4, 0.8] });
    }
    await this.ctx.say(gong ? 'domino-run.gong' : 'domino-run.ring');
    const last = this.index === this.lines.length - 1;
    if (!last) {
      await this.standUp(this.nodes.flat().filter((n): n is Container => !!n));
      const away = -this.ctx.view.w;
      await Promise.all([
        this.ctx.tw.to(this.laneLayer, { x: away }, { duration: 0.5, ease: ease.inQuad }),
        this.ctx.tw.to(this.pieceLayer, { x: away }, { duration: 0.5, ease: ease.inQuad }),
      ]);
    }
    await this.next();
  }

  /** Every line rang: the last line's dominoes stand up and fall once more, a parade, then the sticker. */
  private async finale() {
    if (this.finished) return;
    this.finished = true;
    const all = this.nodes.flat().filter((n): n is Container => !!n);
    await this.standUp(all);
    for (const [i, n] of all.entries()) {
      void this.ctx.tw.to(n, { rotation: 1.15 }, { duration: 0.2, ease: ease.inQuad });
      sfx.marimba(3 + (i % 8), 0.3);
      await this.ctx.tw.wait(0.09);
    }
    sfx.tada();
    await this.ctx.say('domino-run.done');
    this.ctx.finish({ misses: 0, hints: this.hints });
  }

  /** A soft domino shadow in a socket: where the hint's domino goes. */
  private shadow(g: Graphics, lane: number, slot: number, size: number) {
    const l = this.lay.lanes[lane];
    const h = DOMINO_H[size], w = DOMINO_W + (size - 1) * 6;
    const a = 0.35 + 0.15 * Math.sin(this.clock * 6);
    g.roundRect(l.x0 + slot * PITCH - w / 2, l.base - h, w, h, 9).fill({ color: swatch.yellow.fill, alpha: a }).stroke({ width: 4, color: swatch.yellow.line, alpha: a + 0.2 });
  }
}

class DominoIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const end = endArt('bell');
    end.scale.set(0.55);
    end.position.set(58, 0);
    c.addChild(end);
    [[-62, 0.15], [-30, 0.45], [2, 0.8]].forEach(([x, r], i) => {
      const d = dominoArt(i === 2 ? 2 : 1, i === 0 ? swatch.green : swatch.blue, i === 0);
      d.position.set(x, 0);
      d.rotation = r;
      c.addChild(d);
    });
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const color = rng.pick(LINE_COLORS);
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, 80).fill(swatch.yellow.light).stroke({ width: 6, color: swatch.yellow.line }));
  c.addChild(new Graphics().roundRect(-62, 34, 124, 10, 5).fill(wood.fill));
  const n = rng.int(3, 4);
  for (let i = 0; i < n; i++) {
    const d = dominoArt(i === 0 ? 1 : rng.int(1, 2), i === 0 ? swatch.green : color, i === 0);
    d.scale.set(0.55);
    d.position.set(-52 + i * 22, 36);
    d.rotation = 0.25 + i * 0.12;
    c.addChild(d);
  }
  const bell = endArt('bell');
  bell.scale.set(0.42);
  bell.position.set(46, 38);
  c.addChild(bell);
  return c;
}

export const dominoRun: GameModule = {
  id: 'domino-run',
  name: 'Domino Run',
  titleLine: 'game.domino-run',
  region: 'tinker-lab',
  skills: ['cause-and-effect', 'spacing', 'planning', 'revision'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'One of you stands the dominoes; the other says where the chain will stop before the tap.',
  offScreen: 'Stand books or wooden blocks in a row. Try a wide gap and a narrow one, then a small block pushing a big one.',
  hubIcon: () => new DominoIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new DominoRun(ctx),
};

