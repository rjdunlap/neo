import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { againIcon, checkIcon, turnIcon, undoIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { drawerArt, drawerIcon, toyBody } from './art';
import { BUTTON_R, CELL, CLOSE_R, drawerLayout, packTray, type DrawerLayout } from './layout';
import {
  blockedCells,
  cellsAt,
  complete,
  copyState,
  describeLevel,
  LEVELS,
  makePuzzle,
  nearestAnchor,
  nextHint,
  sizeAt,
  solve,
  startState,
  turnToy,
  type Cell,
  type Hint,
  type Puzzle,
  type State,
} from './logic';

/** Bounced drops of one toy before the ghost shows by itself: level 1 gently, later levels only after a third. */
const AUTO_GHOST = { first: 2, later: 3 };

interface Piece {
  id: string;
  node: Container;
  body: Container;
  drag: DragHandle;
  bounces: number;
  saidFull: boolean;
}

class ToyDrawer implements Game {
  private readonly puzzle: Puzzle;
  private state: State;
  private readonly history: State[] = [];
  private readonly pieces: Piece[] = [];
  private layout!: DrawerLayout;
  private readonly bg = new Graphics();
  private readonly tray = new Graphics();
  private readonly drawer: Container;
  private readonly overlay = new Graphics();
  private readonly ring = new Graphics();
  private readonly lid = new Graphics();
  private readonly undo: RoundButton;
  private readonly again: RoundButton;
  private readonly hint: RoundButton;
  private readonly turn: RoundButton;
  private readonly close: RoundButton;
  private selected: string | null = null;
  private lifted: string | null = null;
  private preview: { cells: Cell[]; ok: boolean } | null = null;
  private ghost: Cell[] | null = null;
  private pulse: string | null = null;
  private flash: { cells: Cell[]; at: number } | null = null;
  private hinted = false;
  private sawReady = false;
  private done = false;
  private clock = 0;
  private lidH = { h: 0 };

  constructor(private readonly ctx: GameContext) {
    this.puzzle = makePuzzle(ctx.level, ctx.rng);
    this.state = startState(this.puzzle);
    this.layout = drawerLayout(ctx.view, this.puzzle.rows, this.puzzle.cols);
    this.drawer = drawerArt(this.puzzle.rows, this.puzzle.cols, CELL);
    ctx.stage.addChild(this.bg, this.tray, this.drawer);
    for (const toy of this.puzzle.toys) {
      const node = new Container();
      const piece: Piece = {
        id: toy.id,
        node,
        body: new Container(),
        drag: null!,
        bounces: 0,
        saidFull: false,
      };
      piece.drag = draggable(node, ctx.tw, {
        tapToPlace: () => !this.done,
        onPick: () => this.pick(piece),
        onMove: (x, y) => this.moveOver(piece, x, y),
        onCancel: () => {
          this.lifted = null;
          this.preview = null;
          this.settle(piece, 0.2);
        },
        onDrop: (x, y) => this.drop(piece, x, y),
      });
      ctx.own(() => piece.drag.destroy());
      node.addChild(piece.body);
      ctx.stage.addChild(node);
      this.pieces.push(piece);
      this.rebuild(piece);
    }
    ctx.stage.addChild(this.overlay, this.ring, this.lid);
    this.overlay.eventMode = this.ring.eventMode = this.lid.eventMode = 'none';
    this.undo = new RoundButton(undoIcon(), swatch.blue, BUTTON_R, () => this.undoMove());
    this.again = new RoundButton(againIcon(), swatch.teal, BUTTON_R, () => this.startOver());
    const hand = new Graphics()
      .circle(0, 0, 20)
      .fill(swatch.yellow.fill)
      .moveTo(0, -35)
      .lineTo(0, 35)
      .stroke({ width: 5, color: swatch.orange.line });
    this.hint = new RoundButton(hand, swatch.yellow, BUTTON_R, () => this.showHint());
    this.turn = new RoundButton(turnIcon(), swatch.purple, BUTTON_R, () => this.turnSelected());
    this.close = new RoundButton(checkIcon(), swatch.green, CLOSE_R, () => this.closeDrawer());
    ctx.stage.addChild(this.undo, this.again, this.hint, this.turn, this.close);
    this.turn.visible = this.puzzle.canTurn;
    this.resize(ctx.view);
  }

  // ---- drawing ----

  /** The toy's body, drawn for its current turn at drawer size, sat at (0, 0)-centred in its node. */
  private rebuild(p: Piece) {
    const toy = this.toy(p.id);
    const turns = this.state.turns[p.id] ?? 0;
    p.body.destroy({ children: true });
    p.body = toyBody(toy.kind, turns, CELL);
    const s = sizeAt(toy.kind, turns);
    p.body.pivot.set((s.w * CELL) / 2, (s.h * CELL) / 2);
    p.node.addChild(p.body);
    this.settle(p, 0);
  }

  private toy(id: string) {
    return this.puzzle.toys.find((t) => t.id === id)!;
  }

  private placed(p: Piece) {
    return this.state.at[p.id] !== undefined;
  }

  /** Full size in the drawer or while carried, tray size on the shelf. */
  private settle(p: Piece, secs: number) {
    const to = this.placed(p) || this.lifted === p.id ? 1 : this.layout.trayCell / CELL;
    this.ctx.tw.kill(p.body.scale);
    if (secs <= 0) p.body.scale.set(to);
    else void this.ctx.tw.to(p.body.scale, { x: to, y: to }, { duration: secs });
    const s = sizeAt(this.toy(p.id).kind, this.state.turns[p.id] ?? 0);
    const size = to * CELL;
    const hw = Math.max(s.w * size, 100) / 2;
    const hh = Math.max(s.h * size, 100) / 2;
    p.node.hitArea = new Rectangle(-hw, -hh, hw * 2, hh * 2);
  }

  /** Puts every toy where the state says: placed ones on their cells, the rest in rows on the tray. */
  private refresh(animate: boolean) {
    const loose = this.pieces.filter((p) => !this.placed(p));
    const slots = packTray(
      loose.map((p) => ({ kind: this.toy(p.id).kind, turns: this.state.turns[p.id] ?? 0 })),
      this.layout.tray,
      this.layout.trayCell,
    );
    const goTo = (p: Piece, x: number, y: number) => {
      p.drag.home = { x, y };
      if (p.drag.dragging) return;
      this.ctx.tw.kill(p.node);
      if (animate) void this.ctx.tw.to(p.node, { x, y }, { duration: 0.3 });
      else p.node.position.set(x, y);
    };
    for (const p of this.pieces) {
      const a = this.state.at[p.id];
      if (!a) continue;
      const s = sizeAt(this.toy(p.id).kind, this.state.turns[p.id] ?? 0);
      goTo(p, this.layout.drawer.x + (a[1] + s.w / 2) * CELL, this.layout.drawer.y + (a[0] + s.h / 2) * CELL);
    }
    loose.forEach((p, i) => {
      const slot = slots?.[i];
      if (slot) goTo(p, slot.x + slot.w / 2, slot.y + slot.h / 2);
    });
    for (const p of this.pieces) this.settle(p, 0);
    const ready = complete(this.puzzle, this.state);
    this.close.alpha = ready ? 1 : 0.55;
    if (ready && !this.sawReady && !this.done) {
      this.sawReady = true;
      void this.ctx.say('toy-drawer.ready');
    }
    if (!ready) this.sawReady = false;
  }

  private cellPoint(cell: Cell) {
    return { x: this.layout.drawer.x + cell[1] * CELL, y: this.layout.drawer.y + cell[0] * CELL };
  }

  private paintCells(cells: Cell[], fill: number, alpha: number, stroke: number) {
    for (const cell of cells) {
      const { x, y } = this.cellPoint(cell);
      this.overlay
        .roundRect(x + 6, y + 6, CELL - 12, CELL - 12, 12)
        .fill({ color: fill, alpha })
        .stroke({ width: 6, color: stroke, alpha: 0.9 });
    }
  }

  private redraw() {
    this.overlay.clear();
    if (this.ghost) this.paintCells(this.ghost, swatch.yellow.fill, 0.28, swatch.yellow.line);
    if (this.preview) {
      const c = this.preview.ok ? swatch.green : swatch.red;
      this.paintCells(this.preview.cells, c.fill, 0.3, c.line);
    }
    if (this.flash)
      this.paintCells(
        this.flash.cells,
        swatch.red.fill,
        0.5 * Math.max(0, 1 - (this.clock - this.flash.at) / 0.7),
        swatch.red.line,
      );
    this.ring.clear();
    const sel = this.pieces.find((p) => p.id === this.selected);
    if (sel && !this.done) {
      const s = sizeAt(this.toy(sel.id).kind, this.state.turns[sel.id] ?? 0);
      const k = sel.body.scale.x * CELL;
      this.ring
        .roundRect(
          sel.node.x - (s.w * k) / 2 - 8,
          sel.node.y - (s.h * k) / 2 - 8,
          s.w * k + 16,
          s.h * k + 16,
          18,
        )
        .stroke({ width: 6, color: swatch.blue.line });
    }
    const pulse = this.pieces.find((p) => p.id === this.pulse);
    if (pulse) {
      const s = sizeAt(this.toy(pulse.id).kind, this.state.turns[pulse.id] ?? 0);
      const k = pulse.body.scale.x * CELL;
      const grow = 8 + 5 * Math.sin(this.clock * 6);
      this.ring
        .roundRect(
          pulse.node.x - (s.w * k) / 2 - grow,
          pulse.node.y - (s.h * k) / 2 - grow,
          s.w * k + grow * 2,
          s.h * k + grow * 2,
          20,
        )
        .stroke({ width: 8, color: swatch.yellow.line });
    }
    if (this.lidH.h > 0) {
      const d = this.layout.drawer;
      this.lid
        .clear()
        .roundRect(d.x - 22, d.y - 22, d.w + 44, this.lidH.h + 22, 24)
        .fill(wood.fill)
        .stroke({ width: 6, color: wood.line });
      this.lid.roundRect(d.x + d.w / 2 - 40, d.y + this.lidH.h - 40, 80, 16, 8).fill(wood.line);
    }
  }

  // ---- moves ----

  private commit(before: State) {
    this.history.push(before);
    if (this.history.length > 60) this.history.shift();
    this.ghost = null;
    this.pulse = null;
  }

  private pick(p: Piece) {
    if (this.done) return;
    this.selected = p.id;
    this.lifted = p.id;
    this.ghost = null;
    this.settle(p, 0.12);
    sfx.tick();
  }

  /** The anchor cell the piece's top-left would take with its centre at (x, y), as a fractional cell. */
  private wantAt(p: Piece, x: number, y: number) {
    const s = sizeAt(this.toy(p.id).kind, this.state.turns[p.id] ?? 0);
    return {
      r: (y - this.layout.drawer.y) / CELL - s.h / 2,
      c: (x - this.layout.drawer.x) / CELL - s.w / 2,
    };
  }

  private overDrawer(x: number, y: number) {
    const d = this.layout.drawer;
    return x > d.x - CELL / 2 && x < d.x + d.w + CELL / 2 && y > d.y - CELL / 2 && y < d.y + d.h + CELL / 2;
  }

  private moveOver(p: Piece, x: number, y: number) {
    const turns = this.state.turns[p.id] ?? 0;
    const a = this.overDrawer(x, y)
      ? nearestAnchor(this.puzzle, this.state, p.id, turns, this.wantAt(p, x, y))
      : null;
    this.preview = a ? { cells: cellsAt(this.toy(p.id).kind, turns, a), ok: true } : null;
  }

  private drop(p: Piece, x: number, y: number): boolean {
    this.lifted = null;
    this.preview = null;
    if (this.done) return false;
    const turns = this.state.turns[p.id] ?? 0;
    if (this.overDrawer(x, y)) {
      const want = this.wantAt(p, x, y);
      const a = nearestAnchor(this.puzzle, this.state, p.id, turns, want);
      if (a) {
        const before = copyState(this.state);
        this.commit(before);
        this.state.at[p.id] = a;
        sfx.knock();
        sfx.bell(2 + this.placedCount() * 2, 0.25);
        this.refresh(false);
        return true;
      }
      this.bounce(p, want, turns);
    } else if (this.inTray(x, y) && this.placed(p)) {
      this.commit(copyState(this.state));
      this.state.at[p.id] = undefined;
      sfx.pop();
      this.refresh(true);
      return true;
    }
    this.settle(p, 0.2);
    return false;
  }

  private inTray(x: number, y: number) {
    const t = this.layout.tray;
    return x > t.x && x < t.x + t.w && y > t.y && y < t.y + t.h;
  }

  private placedCount() {
    return this.pieces.filter((p) => this.placed(p)).length;
  }

  /** A drop that found no place: a gentle boing, the full cells flash, and a toy that keeps bouncing gets a ghost. Never a miss. */
  private bounce(p: Piece, want: { r: number; c: number }, turns: number) {
    sfx.boing();
    const at: Cell = [Math.round(want.r), Math.round(want.c)];
    const full = blockedCells(this.puzzle, this.state, p.id, turns, at);
    if (full.length) this.flash = { cells: full, at: this.clock };
    p.bounces++;
    if (!p.saidFull) {
      p.saidFull = true;
      void this.ctx.say('toy-drawer.full');
    }
    const limit = this.ctx.level === 1 ? AUTO_GHOST.first : AUTO_GHOST.later;
    if (p.bounces >= limit && !this.ghost && !this.pulse) this.showHint();
  }

  private turnSelected() {
    if (this.done || !this.selected) return;
    const p = this.pieces.find((q) => q.id === this.selected);
    if (!p) return;
    const next = turnToy(this.puzzle, this.state, p.id);
    if (!next) {
      sfx.boing();
      void this.ctx.say('toy-drawer.no-room');
      return;
    }
    this.commit(copyState(this.state));
    this.state = next;
    sfx.tick();
    this.rebuild(p);
    this.refresh(true);
  }

  private undoMove() {
    const prev = this.history.pop();
    if (!prev || this.done) return;
    this.restoreState(prev);
  }

  private startOver() {
    if (this.done) return;
    this.commit(copyState(this.state));
    this.restoreState(startState(this.puzzle));
  }

  private restoreState(s: State) {
    this.state = s;
    this.ghost = null;
    this.pulse = null;
    for (const p of this.pieces) this.rebuild(p);
    sfx.pop();
    this.refresh(true);
  }

  // ---- help and finishing ----

  /** The yellow hand: a ghost where a toy fits, or the toy to move. Asking again in a round is still one hint. */
  private showHint() {
    if (this.done) return;
    const h: Hint | null = nextHint(this.puzzle, this.state);
    if (!h) {
      void this.ctx.say('toy-drawer.ready');
      return;
    }
    this.hinted = true;
    this.ghost = null;
    this.pulse = null;
    if (h.kind === 'place') {
      this.ghost = cellsAt(this.toy(h.toy).kind, h.turns, h.anchor);
      void this.ctx.say('toy-drawer.hint-place');
    } else {
      this.pulse = h.toy;
      void this.ctx.say('toy-drawer.move-one');
    }
  }

  askForHint() {
    this.showHint();
  }

  private closeDrawer() {
    if (this.done) return;
    if (!complete(this.puzzle, this.state)) {
      void this.ctx.say('toy-drawer.not-yet');
      this.tray.alpha = 0.4;
      void this.ctx.tw.to(this.tray, { alpha: 1 }, { duration: 0.6 });
      return;
    }
    this.done = true;
    this.ghost = null;
    this.pulse = null;
    sfx.whoosh();
    void this.ctx.tw.to(this.lidH, { h: this.layout.drawer.h }, { duration: 0.9 }).then(() => {
      if (!this.ctx.alive) return;
      sfx.tada();
      void this.ctx.say('toy-drawer.closed');
      void this.ctx.tw
        .wait(1.2)
        .then(() => this.ctx.alive && this.ctx.finish({ misses: 0, hints: this.hinted ? 1 : 0 }));
    });
  }

  // ---- shell ----

  start() {
    void this.ctx.instruct(
      this.puzzle.start ? 'toy-drawer.make-room' : this.puzzle.canTurn ? 'toy-drawer.turn' : 'toy-drawer.fit',
    );
  }

  resize(v: View) {
    this.layout = drawerLayout(v, this.puzzle.rows, this.puzzle.cols);
    const l = this.layout;
    this.bg.clear().rect(0, 0, v.w, v.h).fill(swatch.orange.light);
    this.tray
      .clear()
      .roundRect(l.tray.x, l.tray.y, l.tray.w, l.tray.h, 24)
      .fill({ color: cream, alpha: 0.9 });
    this.drawer.position.set(l.drawer.x, l.drawer.y);
    this.undo.position.set(l.undo.x, l.undo.y);
    this.again.position.set(l.again.x, l.again.y);
    this.hint.position.set(l.hint.x, l.hint.y);
    this.turn.position.set(l.turn.x, l.turn.y);
    this.close.position.set(l.close.x, l.close.y);
    this.lidH.h = this.done ? l.drawer.h : 0;
    this.refresh(false);
    this.redraw();
  }

  update(dt: number) {
    this.clock += dt;
    this.redraw();
    const ready = complete(this.puzzle, this.state) && !this.done;
    const k = ready ? 1 + 0.06 * Math.sin(this.clock * 5) : 1;
    this.close.scale.set(k);
  }

  /** The ghost finger: turn each toy that needs it (tap it, tap Turn), carry it to its place in a finished packing, then close. */
  /** Guided first play points at the bot's next move: `autotouch` here only reads the board. */
  showMove(): TouchIntent | null {
    return this.autotouch();
  }

  autotouch(): TouchIntent | null {
    if (this.done) return null;
    if (this.pieces.some((p) => p.drag.dragging)) return null;
    if (complete(this.puzzle, this.state)) return { tap: { on: this.close } };
    const sol = solve(this.puzzle, this.state);
    if (!sol) return null;
    // Level 4: a toy already in the drawer that the finished packing moves comes out to the tray first.
    const stuck = this.pieces.find((q) => {
      const a = this.state.at[q.id];
      const b = sol.at[q.id];
      return a && b && (a[0] !== b[0] || a[1] !== b[1] || (this.state.turns[q.id] ?? 0) !== sol.turns[q.id]);
    });
    if (stuck) {
      const t = this.layout.tray;
      return { drag: { on: stuck.node }, to: { on: this.tray, x: t.x + t.w / 2, y: t.y + t.h / 2 } };
    }
    const p = this.pieces.find((q) => !this.placed(q));
    if (!p) return null;
    const want = sol.turns[p.id] ?? 0;
    if ((this.state.turns[p.id] ?? 0) !== want) {
      if (this.selected !== p.id) return { tap: { on: p.node } };
      return { tap: { on: this.turn } };
    }
    const a = sol.at[p.id]!;
    const s = sizeAt(this.toy(p.id).kind, want);
    return {
      drag: { on: p.node },
      to: { on: this.drawer, x: (a[1] + s.w / 2) * CELL, y: (a[0] + s.h / 2) * CELL },
    };
  }

  destroy() {}
}

export const toyDrawer: GameModule = {
  id: 'toy-drawer',
  name: 'Toy Drawer',
  titleLine: 'game.toy-drawer',
  region: 'cozy-village',
  challenge: 'space',
  skills: ['spatial-reasoning', 'area'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.quiet,
  touchDemo: true,
  upright: true,
  coplayHint:
    'Fit the toys in together. Let {name} choose where each one goes, and move one if another will not fit.',
  offScreen:
    'Pack a real shoebox or lunch box together and talk about what goes where. Tidy a toy basket and let her choose the layout.',
  hubIcon: () => new WigglyIcon(drawerIcon()),
  sticker: () => drawerIcon(),
  create: (ctx) => new ToyDrawer(ctx),
};
