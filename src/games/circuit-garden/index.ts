/**
 * Circuit Garden: a toy flower lantern lights only when the wires make a complete loop through it and back to the battery.
 * Level 1 fits a connector into the return gap and watches it light; level 2 flips a switch and sees the lantern on and
 * off; level 3 mends two gaps and then Checks that the lantern lights. Done waits until she has seen what the level shows
 * (or, at 3, on a correct Check); only a wrong Check at 3 is a miss. Rules: ./logic.ts;
 * definition: docs/definitions/circuit-garden.md.
 */
import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { againIcon, checkIcon, magnifierIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { backIcon, batteryArt, connectorArt, handIcon, lanternArt, lanternMini, socketArt, stickerArt, WIRE, WIRE_LIT } from './art';
import {
  checkBoard, doneReady, dressingFor, gaps, GLOW_AFTER, HelpTally, initialState, lit, nextHelp, nextMove, planFor,
  type BoardState, type Dressing, type LevelPlan, type Seen, type SlotId,
} from './logic';

const LEVELS: BandLevels = {
  prek: { min: 1, max: 3 },
  school: { min: 1, max: 3 },
};

/** Half a bridge's length along its route, in logical units. */
const HALF = 55;
/** A drop lands in a bridge whose centre is within this many units. */
const SNAP = 110;

interface Pt { x: number; y: number }

interface Piece {
  node: Container;
  drag: DragHandle;
  /** The bridge it fills, or null in the tray. */
  at: SlotId | null;
  slot: number;
  moved: boolean;
}

interface Layout {
  landscape: boolean;
  /** A point on the board: `u` runs battery (0) to lamp (1), `v` across from the supply side (-1) to the return side (+1). */
  map(u: number, v: number): Pt;
  /** Bridge half-length in `u`, and the battery/lamp terminal offset in `v`. */
  du: number;
  dv: number;
  tray: Pt[];
  undo: Pt;
  back: Pt;
  help: Pt;
  check: Pt;
  done: Pt;
}

/** `pieces` loose connectors (one at level 1, two at 3); `checking` puts a Check button between Help and Done. */
function layoutFor(v: View, mirror: boolean, pieces: number, checking: boolean): Layout {
  const landscape = v.w >= v.h;
  const flip = (u: number) => (mirror ? 1 - u : u);
  if (landscape) {
    const sx = v.w / 1024;
    const x0 = 260 * sx, x1 = 850 * sx, cy = Math.max(325, (v.h - 768) / 2 + 325);
    const bottom = v.h;
    return {
      landscape,
      map: (u, w) => ({ x: x0 + (x1 - x0) * flip(u), y: cy + w * 85 }),
      du: HALF / (x1 - x0), dv: 64 / 85,
      tray: (pieces > 1 ? [345, 540] : [380]).map((x) => ({ x: x * sx, y: bottom - 198 })),
      undo: { x: 720 * sx, y: bottom - 198 }, back: { x: 860 * sx, y: bottom - 198 },
      ...(checking
        ? { help: { x: 420 * sx, y: bottom - 68 }, check: { x: 620 * sx, y: bottom - 68 }, done: { x: 820 * sx, y: bottom - 68 } }
        : { help: { x: 520 * sx, y: bottom - 68 }, check: { x: 640 * sx, y: bottom - 68 }, done: { x: 760 * sx, y: bottom - 68 } }),
    };
  }
  const sx = v.w / 768;
  const y0 = 235, y1 = 545, cx = 445 * sx;
  return {
    landscape,
    map: (u, w) => ({ x: cx + w * 160 * sx, y: y0 + (y1 - y0) * flip(u) }),
    du: HALF / (y1 - y0), dv: 64 / (160 * sx),
    tray: (pieces > 1 ? [300, 470] : [300]).map((x) => ({ x: x * sx, y: v.h - 364 })),
    undo: { x: 300 * sx, y: v.h - 224 }, back: { x: 470 * sx, y: v.h - 224 },
    ...(checking
      ? { help: { x: Math.max(250 * sx, 220), y: v.h - 84 }, check: { x: 420 * sx, y: v.h - 84 }, done: { x: 600 * sx, y: v.h - 84 } }
      : { help: { x: 300 * sx, y: v.h - 84 }, check: { x: 430 * sx, y: v.h - 84 }, done: { x: 560 * sx, y: v.h - 84 } }),
  };
}

const SIDE: Record<SlotId, -1 | 1> = { supply: -1, return: 1 };

class CircuitGarden implements Game {
  readonly plan: LevelPlan;
  readonly dressing: Dressing;
  state: BoardState = initialState();
  seen: Seen = { on: false, off: false };
  readonly tally = new HelpTally();
  /** The board before the last committed edit, for Undo (one step). */
  undoState: BoardState | null = null;
  selected: Piece | null = null;
  finished = false;
  /** Level 3: the board as it is now passed a Check. Any real edit clears it. */
  checked = false;
  /** Wrong Checks this round (kept across a restart): the only misses in the game. */
  misses = 0;
  /** A wrong Check's break, flashed on its bridge for a moment. */
  private breakAt: SlotId | null = null;
  private breakTime = 0;
  /** A committed change waits for the next frame to count as seen. */
  private pendingLook = false;
  private started = false;
  private alive = true;
  private wasLit = false;
  private clock = 0;
  private glowAt: Pt | null = null;
  layout!: Layout;

  private readonly background = new Graphics();
  private readonly wires = new Graphics();
  private readonly marks = new Container();
  private readonly glow = new Graphics();
  private readonly selection = new Graphics();
  private readonly battery = new Container();
  private readonly lamp = new Container();
  readonly targets = new Map<SlotId, Container>();
  readonly switchNode = new Container();
  readonly pieces: Piece[] = [];
  readonly helpButton: RoundButton;
  readonly doneButton: RoundButton;
  readonly checkButton: RoundButton | null = null;
  readonly undoButton: RoundButton | null = null;
  readonly backButton: RoundButton | null = null;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.dressing = dressingFor(ctx.rng);
    for (const g of [this.wires, this.marks, this.glow, this.selection, this.battery, this.lamp]) g.eventMode = 'none';
    // A tap on the open board clears a selection.
    this.background.eventMode = 'static';
    onTap(this.background, () => { this.selected = null; this.drawSelection(); });
    ctx.stage.addChild(this.background, this.wires, this.battery, this.lamp, this.marks);
    for (const slot of this.plan.slots) {
      const t = new Container();
      t.hitArea = new Rectangle(-70, -55, 140, 110);
      onTap(t, () => this.tapBridge(slot));
      this.targets.set(slot, t);
      ctx.stage.addChild(t);
    }
    if (this.plan.switch) {
      this.switchNode.hitArea = new Rectangle(-75, -60, 150, 120);
      onTap(this.switchNode, () => this.flip(), { cooldown: 300 });
      ctx.stage.addChild(this.switchNode);
    }
    this.helpButton = new RoundButton(handIcon(), swatch.orange, 50, () => this.help());
    this.doneButton = new RoundButton(checkIcon(), swatch.green, 50, () => this.done());
    ctx.stage.addChild(this.helpButton, this.doneButton);
    if (this.plan.check) {
      this.checkButton = new RoundButton(magnifierIcon(), swatch.yellow, 50, () => this.check());
      ctx.stage.addChild(this.checkButton);
    }
    if (this.plan.slots.length) {
      this.undoButton = new RoundButton(againIcon(), swatch.white, 50, () => this.undo());
      this.backButton = new RoundButton(backIcon(), swatch.white, 50, () => this.putBack());
      ctx.stage.addChild(this.undoButton, this.backButton);
      this.plan.slots.forEach((_, i) => this.pieces.push(this.makePiece(i)));
    }
    ctx.stage.addChild(this.selection, this.glow);
    this.layout = this.layoutNow(ctx.view);
  }

  private layoutNow(v: View) {
    return layoutFor(v, this.dressing.mirror, this.plan.slots.length, this.plan.check);
  }

  /** Hints given this round (each help identity once). */
  get hints() {
    return this.tally.count;
  }

  get isLit() {
    return lit(this.plan, this.state);
  }

  private makePiece(slot: number): Piece {
    const node = connectorArt(2 * HALF);
    node.hitArea = new Rectangle(-62, -50, 124, 100);
    const piece: Piece = { node, at: null, slot, moved: false, drag: null as unknown as DragHandle };
    piece.drag = draggable(node, this.ctx.tw, {
      onPick: () => { sfx.tick(); piece.moved = false; },
      onMove: (x, y) => {
        const home = piece.drag.home;
        if (Math.hypot(x - home.x, y - home.y + 40) > 24) piece.moved = true;
      },
      onDrop: (x, y) => this.drop(piece, x, y),
    });
    this.ctx.stage.addChild(node);
    return piece;
  }

  // ---- Edits ----

  private snapshot() {
    this.undoState = { filled: { ...this.state.filled }, closed: this.state.closed };
  }

  /** A drop: a still finger selects the piece; a carried one fills the nearest empty bridge, or goes back to the tray. */
  private drop(piece: Piece, x: number, y: number): boolean {
    if (this.finished) return false;
    if (!piece.moved) {
      this.selected = this.selected === piece ? null : piece;
      this.drawSelection();
      this.placePieces();
      return true;
    }
    const slot = this.nearestGap(x, y);
    if (slot) { this.fill(piece, slot); return true; }
    if (piece.at && y > this.layout.tray[0].y - 90) { this.remove(piece); return true; }
    // Not a place it fits: a soft float home, never a miss.
    return false;
  }

  private nearestGap(x: number, y: number): SlotId | null {
    let best: SlotId | null = null, bestD = SNAP;
    for (const slot of gaps(this.plan, this.state)) {
      const c = this.bridgeCentre(slot);
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < bestD) { best = slot; bestD = d; }
    }
    return best;
  }

  private tapBridge(slot: SlotId) {
    if (this.finished || this.state.filled[slot]) return; // an occupied bridge is inert
    const piece = this.selected;
    if (!piece || piece.at) return;
    this.fill(piece, slot);
  }

  fill(piece: Piece, slot: SlotId) {
    this.snapshot();
    if (piece.at) this.state.filled[piece.at] = false;
    this.state.filled[slot] = true;
    piece.at = slot;
    this.selected = null;
    sfx.pop(7);
    this.changed();
  }

  remove(piece: Piece) {
    if (!piece.at) return;
    this.snapshot();
    this.state.filled[piece.at] = false;
    piece.at = null;
    this.selected = null;
    sfx.tick();
    this.changed();
  }

  private putBack() {
    if (this.finished) return;
    const fitted = this.pieces.filter((p) => p.at);
    const piece = this.selected?.at ? this.selected : fitted.length === 1 ? fitted[0] : null;
    if (piece) this.remove(piece);
  }

  private undo() {
    if (this.finished || !this.undoState) return;
    this.state = this.undoState;
    this.undoState = null;
    // Keep pieces that still have their bridge; pieces in emptied bridges go home; filled bridges take a tray piece.
    for (const p of this.pieces) if (p.at && !this.state.filled[p.at]) p.at = null;
    for (const slot of this.plan.slots) {
      if (this.state.filled[slot] && !this.pieces.some((p) => p.at === slot)) {
        const free = this.pieces.find((p) => !p.at);
        if (free) free.at = slot;
      }
    }
    this.selected = null;
    this.changed();
  }

  private flip() {
    if (this.finished || !this.plan.switch) return;
    this.state.closed = !this.state.closed;
    sfx.clunk();
    this.changed();
  }

  /** Every committed change: redraw the whole circuit at once, then mark it seen on the next frame. */
  private changed() {
    const on = this.isLit;
    if (on !== this.wasLit && this.started) {
      if (on) { sfx.bell(9, 0.3); this.ctx.pet.cheer(); }
      void this.ctx.say(on ? 'circuit.closed' : 'circuit.open');
    }
    this.wasLit = on;
    this.pendingLook = true;
    this.glowAt = null;
    // A real edit means the board she checked is gone: a new Check is needed.
    this.checked = false;
    this.breakAt = null;
    this.draw();
    this.placePieces();
    this.drawSelection();
  }

  // ---- Help and finishing ----

  help() {
    if (this.finished) return;
    const id = nextHelp(this.plan, this.state, this.seen);
    if (!id) {
      // Nothing left to show: point at Check (level 3, not yet checked) or Done. No new hint.
      const toCheck = this.plan.check && !this.checked;
      this.glowAt = { ...(toCheck ? this.layout.check : this.layout.done) };
      void this.ctx.say(toCheck ? 'circuit.check-first' : this.plan.check ? 'circuit.checked' : 'circuit.can-finish');
      return;
    }
    if ((id === 'return' || id === 'supply') && !this.pieces.some((p) => !p.at && !p.drag.dragging)) return;
    this.tally.give(id);
    if (id === 'show-on' || id === 'show-off') {
      // Flip only if the lantern is not already in the state to be seen (a change waiting for its frame).
      if (this.isLit !== (id === 'show-on')) this.flip();
      void this.ctx.say(id === 'show-on' ? 'circuit.unseen-on' : 'circuit.unseen-off');
      return;
    }
    const piece = this.pieces.find((p) => !p.at && !p.drag.dragging);
    void this.ctx.say(id === 'return' ? 'circuit.return-break' : 'circuit.supply-break');
    if (piece) this.fill(piece, id);
  }

  askForHint() {
    this.help();
  }

  /** Level 3's deliberate Check: does the lantern light now? A wrong Check is a miss with the break named and flashed. */
  check() {
    if (this.finished || !this.plan.check) return;
    if (this.checked) { this.glowAt = { ...this.layout.done }; void this.ctx.say('circuit.checked'); return; }
    const result = checkBoard(this.plan, this.state);
    if (result.right) {
      this.checked = true;
      this.glowAt = { ...this.layout.done };
      sfx.bell(11, 0.3);
      this.ctx.pet.cheer();
      this.drawMarks();
      void this.ctx.say('circuit.checked');
      return;
    }
    this.misses++;
    sfx.boing();
    this.breakAt = result.brk;
    this.breakTime = 1.6;
    // After two wrong Checks the next empty bridge glows by itself: that bridge's one hint.
    if (this.misses >= GLOW_AFTER) {
      this.tally.give(result.brk);
      this.glowAt = this.bridgeCentre(result.brk);
    }
    const brk = result.brk;
    void this.ctx.say('circuit.open').then(() => {
      if (this.alive && !this.finished && this.breakAt === brk) void this.ctx.say(brk === 'supply' ? 'circuit.supply-break' : 'circuit.return-break');
    });
  }

  private done() {
    if (this.finished) return;
    if (this.plan.check && !this.checked) {
      // Not checked yet: point at Check. Never a miss.
      this.glowAt = { ...this.layout.check };
      void this.ctx.say('circuit.check-first');
      return;
    }
    if (!doneReady(this.plan, this.seen, this.checked)) {
      // Not yet: say what is left to see and point at Help. Never a miss.
      const line: LineId = this.plan.switch ? (this.seen.on ? 'circuit.unseen-off' : 'circuit.unseen-on') : 'circuit.return-break';
      this.glowAt = { ...this.layout.help };
      void this.ctx.say(line);
      return;
    }
    this.finished = true;
    this.selected = null;
    this.glowAt = null;
    for (const p of this.pieces) p.drag.enabled = false;
    this.drawSelection();
    sfx.sparkle();
    this.ctx.pet.cheer();
    void this.ctx.tw.wait(0.6).then(() => this.alive && this.ctx.finish({ misses: this.misses, hints: this.tally.count }));
  }

  restart() {
    if (this.finished) return;
    this.state = initialState();
    this.seen = { on: false, off: false };
    this.undoState = null;
    this.checked = false;
    for (const p of this.pieces) p.at = null;
    this.selected = null;
    this.changed();
  }

  // ---- Drawing ----

  private bridgeCentre(slot: SlotId): Pt {
    return this.layout.map(0.5, SIDE[slot]);
  }

  private draw() {
    const L = this.layout, on = this.isLit, plan = this.plan;
    const w = this.wires.clear();
    const color = on ? WIRE_LIT : WIRE;
    const line = (pts: Pt[]) => {
      w.moveTo(pts[0].x, pts[0].y);
      for (const p of pts.slice(1)) w.lineTo(p.x, p.y);
    };
    const routes: Record<SlotId, Pt[][]> = {
      supply: [[L.map(0, -L.dv), L.map(0, -1), L.map(0.5 - L.du, -1)], [L.map(0.5 + L.du, -1), L.map(1, -1), L.map(1, -L.dv)]],
      return: [[L.map(1, L.dv), L.map(1, 1), L.map(0.5 + L.du, 1)], [L.map(0.5 - L.du, 1), L.map(0, 1), L.map(0, L.dv)]],
    };
    const fixedBridge = (slot: SlotId) => !plan.slots.includes(slot) && !(plan.switch && slot === 'supply');
    // A lit loop gets a soft outline all the way round.
    if (on) {
      for (const slot of ['supply', 'return'] as const) for (const r of routes[slot]) line(r);
      for (const slot of ['supply', 'return'] as const) line([L.map(0.5 - L.du, SIDE[slot]), L.map(0.5 + L.du, SIDE[slot])]);
      w.stroke({ width: 26, color: swatch.yellow.light, cap: 'round', join: 'round' });
    }
    for (const slot of ['supply', 'return'] as const) {
      for (const r of routes[slot]) line(r);
      if (fixedBridge(slot)) line([L.map(0.5 - L.du, SIDE[slot]), L.map(0.5 + L.du, SIDE[slot])]);
    }
    w.stroke({ width: 10, color, cap: 'round', join: 'round' });
    // The open bridges: clips at both ends, and a dashed break outline while empty.
    for (const slot of plan.slots) {
      const a = L.map(0.5 - L.du, SIDE[slot]), b = L.map(0.5 + L.du, SIDE[slot]);
      if (!this.state.filled[slot]) this.dashedBox(w, this.bridgeCentre(slot), L.landscape);
      socketArt(w, a.x, a.y);
      socketArt(w, b.x, b.y);
    }
    if (plan.switch) this.drawSwitch(w);
    // Terminals at the battery and the lamp, each its own knob.
    for (const [u, s] of [[0, -1], [0, 1], [1, -1], [1, 1]] as const) {
      const p = L.map(u, s * L.dv);
      w.circle(p.x, p.y, 11).fill(0x8c9aa6).stroke({ width: 4, color: 0x5a6b7d });
    }
    this.battery.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.battery.addChild(batteryArt(L.landscape, true));
    this.battery.position.copyFrom(L.map(0, 0));
    this.lamp.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.lamp.addChild(lanternArt(on, this.dressing.petals));
    this.lamp.position.copyFrom(L.map(1, 0));
    this.drawMarks();
  }

  private dashedBox(g: Graphics, c: Pt, landscape: boolean) {
    const [hw, hh] = landscape ? [70, 46] : [46, 70];
    const corners = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh], [-hw, -hh]];
    for (let i = 0; i < 4; i++) {
      const [x0, y0] = corners[i], [x1, y1] = corners[i + 1];
      const len = Math.hypot(x1 - x0, y1 - y0), n = Math.floor(len / 18);
      for (let k = 0; k < n; k += 2) {
        const t0 = k / n, t1 = Math.min(1, (k + 1) / n);
        g.moveTo(c.x + x0 + (x1 - x0) * t0, c.y + y0 + (y1 - y0) * t0).lineTo(c.x + x0 + (x1 - x0) * t1, c.y + y0 + (y1 - y0) * t1);
      }
    }
    g.stroke({ width: 5, color: swatch.orange.line, cap: 'round' });
  }

  private drawSwitch(g: Graphics) {
    const L = this.layout;
    const a = L.map(0.5 - L.du, -1), b = L.map(0.5 + L.du, -1);
    g.roundRect(Math.min(a.x, b.x) - 30, Math.min(a.y, b.y) - 30, Math.abs(b.x - a.x) + 60, Math.abs(b.y - a.y) + 60, 20)
      .fill(cream).stroke({ width: 4, color: swatch.brown.line });
    socketArt(g, a.x, a.y);
    socketArt(g, b.x, b.y);
    // Closed lies flat onto the far clip; open tilts away from the board's middle.
    const len = 2 * HALF;
    const along = { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
    const away = L.landscape ? { x: 0, y: -1 } : { x: -1, y: 0 };
    const tilt = this.state.closed ? 0 : 0.6;
    const end = { x: a.x + (along.x * Math.cos(tilt) + away.x * Math.sin(tilt)) * len, y: a.y + (along.y * Math.cos(tilt) + away.y * Math.sin(tilt)) * len };
    g.moveTo(a.x, a.y).lineTo(end.x, end.y).stroke({ width: 14, color: this.isLit ? WIRE_LIT : swatch.red.fill, cap: 'round' });
    g.circle(end.x, end.y, 14).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line });
    g.circle(a.x, a.y, 9).fill(0x5a6b7d);
  }

  /** The pictured marks in the middle of the loop: a lit lantern (and, with a switch, an unlit one) ticked once seen. */
  private drawMarks() {
    this.marks.removeChildren().forEach((c) => c.destroy({ children: true }));
    const kinds: ('on' | 'off')[] = this.plan.switch ? ['on', 'off'] : ['on'];
    const mid = this.layout.map(0.5, 0);
    kinds.forEach((k, i) => {
      const m = new Container();
      const card = new Graphics().roundRect(-40, -44, 80, 88, 16).fill({ color: 0xffffff, alpha: 0.85 }).stroke({ width: 3, color: swatch.white.line });
      m.addChild(card, lanternMini(k === 'on', 0.42));
      // At level 3 the lit lantern is the request, ticked by a correct Check rather than by seeing it.
      if (this.plan.check ? this.checked : this.seen[k]) {
        const tick = new Graphics().circle(26, 30, 17).fill(swatch.green.fill);
        tick.addChild(checkIcon());
        tick.children[0].scale.set(0.45);
        tick.children[0].position.set(26, 30);
        m.addChild(tick);
      }
      m.position.set(mid.x + (i - (kinds.length - 1) / 2) * 100, mid.y);
      this.marks.addChild(m);
    });
  }

  private placePieces() {
    const L = this.layout;
    this.pieces.forEach((p, i) => {
      if (p.drag.dragging) return;
      const home = p.at ? this.bridgeCentre(p.at) : L.tray[Math.min(i, L.tray.length - 1)];
      p.drag.home = { x: home.x, y: home.y };
      this.ctx.tw.kill(p.node);
      p.node.position.set(home.x, home.y);
      p.node.rotation = p.at && !L.landscape ? Math.PI / 2 : 0;
    });
  }

  private drawSelection() {
    const g = this.selection.clear();
    const p = this.selected;
    if (!p || this.finished) return;
    const vertical = p.at && !this.layout.landscape;
    const [hw, hh] = vertical ? [52, 72] : [72, 52];
    g.roundRect(p.node.x - hw, p.node.y - hh, hw * 2, hh * 2, 22).stroke({ width: 7, color: swatch.blue.line });
    g.circle(p.node.x + hw - 4, p.node.y - hh + 4, 12).fill(swatch.blue.fill);
  }

  // ---- Game ----

  start() {
    this.started = true;
    this.changed();
    void this.ctx.instruct(this.plan.check ? 'circuit.instruct.3' : this.plan.switch ? 'circuit.instruct.2' : 'circuit.instruct.1');
  }

  update(dt: number) {
    this.clock += dt;
    if (this.started && this.pendingLook) {
      // The state has now been on screen for a frame: it counts as seen.
      this.pendingLook = false;
      const k = this.isLit ? 'on' : 'off';
      if (!this.seen[k]) { this.seen[k] = true; this.drawMarks(); }
    }
    this.doneButton.alpha = doneReady(this.plan, this.seen, this.checked) ? 1 : 0.55;
    const g = this.glow.clear();
    if (this.breakAt && this.breakTime > 0) {
      // A wrong Check's break: a pulsing outline round the empty bridge, shape as well as colour.
      this.breakTime -= dt;
      const c = this.bridgeCentre(this.breakAt);
      const [hw, hh] = this.layout.landscape ? [80, 56] : [56, 80];
      g.roundRect(c.x - hw, c.y - hh, hw * 2, hh * 2, 20).stroke({ width: 7, color: swatch.red.line, alpha: 0.5 + 0.5 * Math.abs(Math.sin(this.clock * 6)) });
    }
    const at = this.glowAt;
    if (at) g.circle(at.x, at.y, 66).stroke({ width: 8, color: swatch.yellow.line, alpha: 0.6 + 0.4 * Math.sin(this.clock * 4) });
  }

  resize(v: View) {
    this.layout = this.layoutNow(v);
    const L = this.layout;
    this.background.clear().rect(0, 0, v.w, v.h).fill(0xe6f6ef);
    const tl = L.map(0, -1), br = L.map(1, 1);
    const x0 = Math.min(tl.x, br.x) - 90, y0 = Math.min(tl.y, br.y) - 80, x1 = Math.max(tl.x, br.x) + 90, y1 = Math.max(tl.y, br.y) + 80;
    this.background.roundRect(x0, y0, x1 - x0, y1 - y0, 36).fill(0xfbfdf6).stroke({ width: 4, color: swatch.green.light });
    // The tray: a plate where loose pieces rest.
    if (this.pieces.length) for (const t of L.tray) this.background.roundRect(t.x - 80, t.y - 55, 160, 110, 28).fill(cream).stroke({ width: 4, color: swatch.brown.light });
    // A resize drops a selection and returns a piece in a drag; it never completes or checks anything.
    for (const p of this.pieces) if (p.drag.dragging) { p.drag.destroy(); this.rebuildDrag(p); p.drag.enabled = !this.finished; }
    this.selected = null;
    for (const [slot, t] of this.targets) {
      t.position.copyFrom(this.bridgeCentre(slot));
      t.rotation = L.landscape ? 0 : Math.PI / 2;
    }
    if (this.plan.switch) this.switchNode.position.copyFrom(this.bridgeCentre('supply'));
    this.helpButton.position.copyFrom(L.help);
    this.doneButton.position.copyFrom(L.done);
    this.checkButton?.position.copyFrom(L.check);
    this.undoButton?.position.copyFrom(L.undo);
    this.backButton?.position.copyFrom(L.back);
    this.glowAt = null;
    this.draw();
    this.placePieces();
    this.drawSelection();
  }

  private rebuildDrag(p: Piece) {
    p.drag = draggable(p.node, this.ctx.tw, {
      onPick: () => { sfx.tick(); p.moved = false; },
      onMove: (x, y) => { if (Math.hypot(x - p.drag.home.x, y - p.drag.home.y + 40) > 24) p.moved = true; },
      onDrop: (x, y) => this.drop(p, x, y),
    });
  }

  /** The ghost finger: carry a connector to the next gap, or flip the switch to what she has not seen, Check, then Done. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.pendingLook || !this.started) return null;
    const move = nextMove(this.plan, this.state, this.seen, this.checked);
    if ('done' in move) return { tap: { on: this.doneButton } };
    if ('check' in move) return this.checkButton ? { tap: { on: this.checkButton } } : null;
    if ('flip' in move) return { tap: { on: this.switchNode } };
    const piece = this.pieces.find((p) => !p.at);
    if (!piece || piece.drag.dragging) return null;
    const c = this.bridgeCentre(move.fill);
    return { drag: { on: piece.node }, to: { on: this.ctx.stage, x: c.x, y: c.y } };
  }

  destroy() {
    this.alive = false;
    for (const p of this.pieces) p.drag.destroy();
  }
}

export const circuitGarden: GameModule = {
  id: 'circuit-garden',
  name: 'Circuit Garden',
  titleLine: 'game.circuit-garden',
  region: 'tinker-lab',
  challenge: 'noticing',
  skills: ['complete-circuit', 'cause-and-effect', 'observation'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  touchDemo: true,
  coplayHint: 'Take turns: one of you joins a wire or flips the switch, the other watches the lantern (or presses Check), then swap.',
  hubIcon: () => new WigglyIcon(lanternArt(true)),
  sticker: (seed) => stickerArt(seed),
  create: (ctx) => new CircuitGarden(ctx),
};

