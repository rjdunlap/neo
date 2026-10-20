import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { LineId } from '../../content/voice-script';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { againIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { BOARDS } from './puzzles';
import {
  FRUITS, hintMove, jarHeight, jarLayout, JAR_W, legal, move, moves, PIECE, planFor, present, refusal, render, RIM, search, solve, solved,
  UNDO_INSET, uniformFull, type Board, type JarPlan, type JarSpot, type Labels, type Move,
} from './logic';

const LEVELS: BandLevels = {
  preschool: { min: 1, max: 3 },
  prek: { min: 2, max: 5 },
  school: { min: 4, max: 8 },
};

/** How far a lifted piece rises above where it sat. */
const LIFT = 30;
/** A move's hop from jar to jar; taps during it are ignored. */
const HOP = 0.35;
/** A press that travels this far is a drag, not a tap. */
const DRAG_START = 20;
/** The search that looks for a dead end after each move stays small; a bigger one only runs for a hint. */
const DEAD_END_LIMIT = 20_000;
/** Each fruit's marimba step when it lands (pentatonic, from `src/audio/notes.ts` through `sfx`). */
const NOTES = [5, 7, 8, 9, 11];

/** A fruit drawn about 44 units across, centred on (0, 0). Each kind has its own outline so colour is never the only cue. */
export function fruitArt(kind: number, size = 1): Container {
  const g = new Graphics();
  switch (kind) {
    case 0: // strawberry: a rounded heart point-down, seeds, a green cap
      g.moveTo(0, 22).bezierCurveTo(-26, 4, -24, -18, -8, -17).bezierCurveTo(-3, -17, 0, -14, 0, -14).bezierCurveTo(0, -14, 3, -17, 8, -17).bezierCurveTo(24, -18, 26, 4, 0, 22)
        .fill(swatch.red.fill).stroke({ width: 3, color: swatch.red.line, join: 'round' });
      for (const [x, y] of [[-8, -5], [7, -6], [0, 3], [-6, 9], [6, 9], [0, -9]]) g.ellipse(x, y, 1.8, 2.6).fill(swatch.yellow.light);
      g.poly([-12, -17, -4, -13, 0, -21, 4, -13, 12, -17, 6, -9, -6, -9]).fill(swatch.green.fill).stroke({ width: 2, color: swatch.green.line, join: 'round' });
      break;
    case 1: // blueberry: a round berry with a star-shaped crown
      g.circle(0, 2, 20).fill(swatch.blue.fill).stroke({ width: 3, color: swatch.blue.line });
      g.circle(-7, -5, 5).fill({ color: 0xffffff, alpha: 0.35 });
      g.star(0, -8, 5, 7, 3).fill(swatch.blue.line);
      break;
    case 2: // orange: a big round fruit with dimples and a leaf
      g.circle(0, 2, 21).fill(swatch.orange.fill).stroke({ width: 3, color: swatch.orange.line });
      for (const [x, y] of [[-9, 0], [6, 7], [-2, 11], [9, -6]]) g.circle(x, y, 1.6).fill(swatch.orange.line);
      g.ellipse(7, -20, 8, 4).fill(swatch.green.fill).stroke({ width: 2, color: swatch.green.line });
      break;
    case 3: // pear: a small top on a wide bottom, with a stem
      g.circle(0, -6, 11).fill(swatch.green.fill);
      g.circle(0, 8, 16).fill(swatch.green.fill);
      g.moveTo(-11, -6).bezierCurveTo(-11, 0, -16, 2, -16, 8).arc(0, 8, 16, Math.PI, 0, true).bezierCurveTo(16, 2, 11, 0, 11, -6).arc(0, -6, 11, 0, Math.PI, true)
        .stroke({ width: 3, color: swatch.green.line, join: 'round' });
      g.moveTo(0, -17).lineTo(3, -24).stroke({ width: 3, color: swatch.brown.line, cap: 'round' });
      break;
    default: // plum: an oval with a crease and a stem
      g.ellipse(0, 2, 17, 21).fill(swatch.purple.fill).stroke({ width: 3, color: swatch.purple.line });
      g.moveTo(-2, -16).bezierCurveTo(-8, -4, -8, 10, -2, 21).stroke({ width: 2, color: swatch.purple.line, alpha: 0.7 });
      g.moveTo(0, -18).lineTo(-3, -25).stroke({ width: 3, color: swatch.brown.line, cap: 'round' });
      g.ellipse(7, -8, 4, 6).fill({ color: 0xffffff, alpha: 0.3 });
  }
  const c = new Container();
  c.addChild(g);
  c.scale.set(size);
  return c;
}

const JAM = [swatch.red.fill, swatch.blue.fill, swatch.orange.fill, swatch.green.fill, swatch.purple.fill];

/** An empty glass jar of a capacity, its base at (0, 0). */
function jarArt(cap: number): Graphics {
  const h = jarHeight(cap);
  const w = JAR_W;
  return new Graphics()
    .roundRect(-w / 2, -h + RIM - 8, w, h - RIM + 8, 22).fill({ color: swatch.teal.light, alpha: 0.45 }).stroke({ width: 5, color: swatch.teal.line })
    .roundRect(-w / 2 - 6, -h + RIM - 18, w + 12, 18, 8).fill({ color: swatch.teal.light, alpha: 0.7 }).stroke({ width: 4, color: swatch.teal.line })
    .roundRect(-w / 2 + 12, -h + RIM + 6, 10, h - RIM - 30, 5).fill({ color: 0xffffff, alpha: 0.45 });
}

function lidArt(): Graphics {
  return new Graphics()
    .roundRect(-JAR_W / 2 - 10, -26, JAR_W + 20, 26, 10).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line })
    .circle(-30, -13, 4).fill(0xffffff).circle(0, -13, 4).fill(0xffffff).circle(30, -13, 4).fill(0xffffff);
}

/** Where a jar's `i`-th piece (0 at the bottom) sits, relative to the jar's base. */
const slotY = (i: number) => -(i * PIECE + PIECE / 2) - 6;

interface JarNode {
  root: Container;
  carrier: Container;
  handle: DragHandle;
  lid: Graphics;
  mat: Container | null;
  spot: JarSpot;
}

class JarSort implements Game {
  readonly plan: JarPlan;
  readonly puzzles: string[];
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  board: Board = [];
  labels: Labels | undefined;
  /** The jar whose top piece is lifted, if any. */
  lifted: number | null = null;
  /** The two jars of the move the glow suggests, until she moves. */
  hinted: Move | null = null;

  private readonly back = new Graphics();
  private readonly jarLayer = new Container();
  private readonly pieceLayer = new Container();
  private readonly glow = new Graphics();
  private readonly undoButton: RoundButton;
  private jars: JarNode[] = [];
  private pieces: Container[][] = [];
  private history: Board[] = [];
  private boardMisses = 0;
  private sinceHint = 0;
  private par = 0;
  private clock = 0;
  private undoPulse = 0;
  private told = false;
  /** The press that lifted the piece, so a drag can carry it and a release on the same jar keeps it up. */
  private press: { jar: number; lifted: boolean; x: number; y: number } | null = null;
  private botPlan: { key: string; path: Move[] | null } | null = null;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    const list = BOARDS[this.plan.id];
    this.puzzles = this.plan.id === 1 ? list.slice(0, this.plan.boards) : ctx.rng.shuffle([...list]).slice(0, this.plan.boards);
    onTap(this.back, () => this.setDown());
    this.glow.eventMode = 'none';
    this.undoButton = new RoundButton(againIcon(), swatch.white, 54, () => this.undo());
    this.undoButton.alpha = 0.35;
    ctx.stage.addChild(this.back, this.jarLayer, this.pieceLayer, this.glow, this.undoButton);
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    this.back.clear().rect(0, 0, v.w, v.h).fill({ color: 0xffffff, alpha: 0.001 });
    this.back.hitArea = new Rectangle(0, 0, v.w, v.h);
    this.undoButton.position.set(v.w - UNDO_INSET, v.h - UNDO_INSET);
    if (!this.jars.length) return;
    this.setDown();
    const spots = jarLayout(this.plan.jars, this.plan.cap, v);
    this.jars.forEach((j, i) => this.placeJar(j, spots[i]));
    this.placePieces();
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    this.undoButton.scale.set(this.undoPulse > 0 ? 1 + 0.08 * Math.sin(this.clock * 8) : 1);
    if (this.undoPulse > 0) {
      this.undoPulse -= dt;
      g.circle(this.undoButton.x, this.undoButton.y, 62 + 3 * Math.sin(this.clock * 6)).stroke({ width: 6, color: swatch.yellow.fill });
    }
    if (this.busy || this.finished) return;
    const box = (i: number, pad = 0) => {
      const h = this.jars[i].spot.hit;
      return [h.x - pad, h.y - pad - 8, h.w + pad * 2, h.h + pad * 2 + 8] as const;
    };
    if (this.lifted !== null && this.plan.lit) {
      for (let i = 0; i < this.board.length; i++) {
        if (!legal(this.board, this.plan.cap, this.lifted, i)) continue;
        g.roundRect(...box(i, 4), 24).fill({ color: swatch.yellow.light, alpha: 0.35 }).stroke({ width: 5, color: swatch.yellow.fill });
      }
    }
    if (this.hinted) {
      const pulse = 6 + 2 * Math.sin(this.clock * 6);
      g.roundRect(...box(this.hinted.from, 8), 26).stroke({ width: pulse, color: swatch.yellow.fill });
      g.roundRect(...box(this.hinted.to, 8), 26).stroke({ width: 4, color: swatch.yellow.fill, alpha: 0.7 });
    }
  }

  destroy() {
    for (const j of this.jars) j.handle.destroy();
  }

  /** The ghost finger: tap the jar the solver moves from, then the jar it moves to. It never shows a refused move. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.jars.length) return null;
    const key = render(this.board);
    if (this.botPlan?.key !== key) this.botPlan = { key, path: solve(this.board, this.plan.cap, this.labels) };
    const next = this.botPlan.path?.[0];
    if (!next) return null;
    const tapJar = (i: number, pause?: number): TouchIntent => {
      const { spot } = this.jars[i];
      return { tap: { on: this.jars[i].carrier, x: 0, y: -spot.hit.h / 2 }, pause };
    };
    if (this.lifted === null) return tapJar(next.from, 0.35);
    if (this.lifted === next.from) return tapJar(next.to);
    return tapJar(this.lifted);
  }

  /* -------------------------------------------------------------------------------------------- */

  private async next() {
    this.busy = true;
    this.index++;
    this.hinted = null;
    this.lifted = null;
    this.history = [];
    this.boardMisses = 0;
    this.sinceHint = 0;
    this.undoButton.alpha = 0.35;
    if (this.index >= this.puzzles.length) return void this.finale();
    const shown = present(this.puzzles[this.index], this.plan, this.ctx.rng);
    this.board = shown.board;
    this.labels = shown.labels;
    this.par = solve(this.board, this.plan.cap, this.labels)?.length ?? this.plan.par[1];
    this.build();
    this.jarLayer.alpha = this.pieceLayer.alpha = 0;
    await Promise.all([this.ctx.tw.to(this.jarLayer, { alpha: 1 }, { duration: 0.3 }), this.ctx.tw.to(this.pieceLayer, { alpha: 1 }, { duration: 0.3 })]);
    this.busy = false;
    if (this.told) return;
    this.told = true;
    await this.ctx.instruct(this.plan.labels ? 'jar.instruct-labels' : 'jar.instruct');
  }

  private build() {
    for (const j of this.jars) j.handle.destroy();
    this.jarLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.pieceLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    const spots = jarLayout(this.plan.jars, this.plan.cap, this.ctx.view);
    this.jars = this.board.map((_, i) => this.makeJar(i, spots[i]));
    this.pieces = this.board.map((jar) => jar.map((k) => {
      const p = fruitArt(k);
      p.eventMode = 'none';
      this.pieceLayer.addChild(p);
      return p;
    }));
    this.placePieces();
    this.jars.forEach((_, i) => this.drawLid(i, false));
  }

  private makeJar(i: number, spot: JarSpot): JarNode {
    const root = new Container();
    root.eventMode = 'none';
    root.addChild(jarArt(this.plan.cap));
    const lid = lidArt();
    lid.visible = false;
    root.addChild(lid);
    let mat: Container | null = null;
    const want = this.labels?.[i];
    if (want !== undefined && want !== null) {
      mat = new Container();
      mat.addChild(new Graphics().roundRect(-JAR_W / 2 - 8, 2, JAR_W + 16, 28, 12).fill(wood.fill).stroke({ width: 4, color: wood.line }));
      const pic = fruitArt(want, 0.5);
      pic.position.set(0, 16);
      mat.addChild(pic);
      root.addChildAt(mat, 0);
    }
    this.jarLayer.addChild(root);
    const carrier = new Container();
    const h = jarHeight(this.plan.cap);
    carrier.hitArea = new Rectangle(-spot.hit.w / 2, -h, spot.hit.w, h);
    this.jarLayer.addChild(carrier);
    const handle = draggable(carrier, this.ctx.tw, {
      lift: 0,
      keepGrab: true,
      onPick: () => this.pressJar(i),
      onMove: () => this.dragMove(i),
      onDrop: () => this.release(i),
    });
    carrier.on('pointerdown', (e) => {
      // Where the finger went down, in the stage's units: the carrier moves with it from there.
      if (this.press?.jar === i) Object.assign(this.press, this.ctx.stage.toLocal(e.global));
    });
    const node: JarNode = { root, carrier, handle, lid, mat, spot };
    this.placeJar(node, spot);
    return node;
  }

  private placeJar(j: JarNode, spot: JarSpot) {
    j.spot = spot;
    j.root.position.set(spot.x, spot.y);
    j.carrier.position.set(spot.x, spot.y);
    j.carrier.scale.set(1);
    j.handle.home = { x: spot.x, y: spot.y };
  }

  private slot(jar: number, i: number) {
    const s = this.jars[jar].spot;
    return { x: s.x, y: s.y + slotY(i) };
  }

  private placePieces() {
    this.pieces.forEach((col, j) => col.forEach((p, i) => {
      this.ctx.tw.kill(p);
      const at = this.slot(j, i);
      p.position.set(at.x, at.y - (this.lifted === j && i === col.length - 1 ? LIFT : 0));
    }));
  }

  private drawLid(i: number, chime: boolean) {
    const j = this.jars[i], jar = this.board[i];
    const want = this.labels?.[i];
    const full = uniformFull(jar, this.plan.cap);
    // On a labelled board a jar full of the wrong fruit waits for its lid, and so does a full spare jar.
    const lid = full && (!this.labels || want === jar[0]);
    j.lid.position.set(0, -jarHeight(this.plan.cap) + RIM - 14);
    if (lid && !j.lid.visible && chime) {
      sfx.bell(10, 0.3);
      void this.ctx.say('jar.lid');
    } else if (full && !lid && chime && this.labels) {
      void this.ctx.say(`jar.wrong-jar.${FRUITS[jar[0]]}` as LineId);
    }
    j.lid.visible = lid;
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Touch                                                                                          */
  /* -------------------------------------------------------------------------------------------- */

  /** Touch-down on a jar: lift its top piece, drop the lifted piece on it, or set its own lifted piece back down. */
  private pressJar(i: number) {
    this.press = null;
    if (this.busy || this.finished) return;
    if (this.lifted === null) {
      if (!this.board[i].length) return void sfx.tick();
      this.lift(i);
      this.press = { jar: i, lifted: true, x: NaN, y: NaN };
      return;
    }
    if (this.lifted === i) return this.setDown();
    this.tryMove(this.lifted, i);
  }

  private lift(i: number) {
    this.lifted = i;
    const p = this.pieces[i][this.pieces[i].length - 1];
    const at = this.slot(i, this.pieces[i].length - 1);
    this.ctx.tw.kill(p);
    void this.ctx.tw.to(p, { y: at.y - LIFT }, { duration: 0.1, ease: ease.outQuad });
    sfx.pop(4);
  }

  /** The finger carries the lifted piece once it has travelled far enough to be a drag. */
  private dragMove(i: number) {
    const press = this.press;
    if (!press || press.jar !== i || this.lifted !== i) return;
    const j = this.jars[i];
    const dx = j.carrier.x - j.spot.x, dy = j.carrier.y - j.spot.y;
    if (Math.hypot(dx, dy) < DRAG_START) return;
    const p = this.pieces[i][this.pieces[i].length - 1];
    this.ctx.tw.kill(p);
    // It rides 40 units above the finger, as every carried thing does.
    const f = this.finger(press, dx, dy, i);
    p.position.set(f.x, f.y - 40);
  }

  /** Let go of a jar: a drag ends on the jar under the finger; a tap leaves the piece lifted. The invisible carrier always goes home. */
  private release(i: number): boolean {
    const j = this.jars[i];
    if (!j || j.carrier.destroyed) return true;
    const dx = j.carrier.x - j.spot.x, dy = j.carrier.y - j.spot.y;
    const press = this.press;
    this.press = null;
    this.placeJar(j, j.spot);
    if (!press || this.busy || this.finished || this.lifted !== i || Math.hypot(dx, dy) < DRAG_START) return true;
    const finger = this.finger(press, dx, dy, i);
    const target = this.jarAt(finger.x, finger.y - 40);
    if (target === null || target === i) this.setDown();
    else this.tryMove(i, target);
    return true;
  }

  /** The finger now: where it went down plus how far the carrier has followed it (the jar's middle if the press was not seen). */
  private finger(press: { x: number; y: number }, dx: number, dy: number, i: number) {
    const s = this.jars[i].spot;
    return Number.isNaN(press.x) ? { x: s.x + dx, y: s.y - s.hit.h / 2 + dy } : { x: press.x + dx, y: press.y + dy };
  }

  /** The jar whose hit box holds the point, or the nearest within a little slack. */
  private jarAt(x: number, y: number): number | null {
    let best: number | null = null, bestD = Infinity;
    this.jars.forEach((j, i) => {
      const h = j.spot.hit;
      const dx = Math.max(h.x - x, 0, x - (h.x + h.w)), dy = Math.max(h.y - 60 - y, 0, y - (h.y + h.h));
      const d = Math.hypot(dx, dy);
      if (d < 30 && d < bestD) { best = i; bestD = d; }
    });
    return best;
  }

  /** Put a lifted piece back where it was, for free. */
  private setDown() {
    if (this.lifted === null) return;
    const i = this.lifted;
    this.lifted = null;
    const p = this.pieces[i][this.pieces[i].length - 1];
    if (!p) return;
    const at = this.slot(i, this.pieces[i].length - 1);
    this.ctx.tw.kill(p);
    void this.ctx.tw.to(p, at, { duration: 0.15, ease: ease.outQuad });
    sfx.pop(2);
  }

  private tryMove(from: number, to: number) {
    const why = refusal(this.board, this.plan.cap, from, to);
    if (why) return this.refuse(from, to, why);
    void this.doMove(from, to);
  }

  /** The piece springs back with a boing and the reason; from level 3 it counts, and every second one lights the hint. */
  private refuse(from: number, to: number, why: 'full' | 'kind') {
    const kind = this.board[from][this.board[from].length - 1];
    this.setDown();
    sfx.boing();
    const t = this.jars[to].root;
    void this.ctx.tw.to(t, { x: t.x + 8 }, { duration: 0.06 }).then(() => this.ctx.tw.to(t, { x: this.jars[to].spot.x }, { duration: 0.1 }));
    void this.ctx.say(why === 'full' ? 'jar.refuse-full' : (`jar.refuse-kind.${FRUITS[kind]}` as LineId));
    if (this.plan.lit) return;
    this.misses++;
    this.boardMisses++;
    if (this.boardMisses % 2 === 0) this.showHint();
  }

  private async doMove(from: number, to: number) {
    this.busy = true;
    this.lifted = null;
    this.hinted = null;
    this.undoPulse = 0;
    this.history.push(this.board);
    this.undoButton.alpha = 1;
    const kind = this.board[from][this.board[from].length - 1];
    this.board = move(this.board, from, to);
    const p = this.pieces[from].pop()!;
    this.pieces[to].push(p);
    const at = this.slot(to, this.pieces[to].length - 1);
    const over = Math.min(p.y, this.jars[to].spot.y - jarHeight(this.plan.cap)) - 30;
    this.ctx.tw.kill(p);
    // A short arc: up over the target's rim, then down into place.
    await this.ctx.tw.to(p, { x: at.x, y: over }, { duration: HOP * 0.55, ease: ease.outQuad });
    await this.ctx.tw.to(p, { y: at.y }, { duration: HOP * 0.45, ease: ease.inQuad });
    sfx.marimba(NOTES[kind], 0.35);
    this.drawLid(from, false);
    this.drawLid(to, true);
    this.sinceHint++;
    this.busy = false;
    if (solved(this.board, this.plan.cap, this.labels)) return void this.boardDone();
    this.checkStuck();
    if (this.sinceHint >= Math.max(8, 2 * this.par)) this.showHint();
  }

  private undo() {
    if (this.busy || this.finished) return;
    const before = this.history.pop();
    if (!before) return;
    this.lifted = null;
    this.hinted = null;
    this.undoPulse = 0;
    this.board = before;
    this.undoButton.alpha = this.history.length ? 1 : 0.35;
    this.build();
    sfx.pop(2);
  }

  /** Stuck: no move is left, or a small search proves there is no way out from here. Never a miss or a hint. */
  private checkStuck() {
    const dead = !moves(this.board, this.plan.cap).length || search(this.board, this.plan.cap, this.labels, DEAD_END_LIMIT) === 'none';
    if (!dead) return;
    this.undoPulse = 4;
    void this.ctx.say('jar.stuck');
  }

  /** The hint move's two jars glow until she moves; past the search's room, the round arrow glows instead. Counts once. */
  private showHint() {
    if (this.hinted || this.finished) return;
    const hint = hintMove(this.board, this.plan.cap, this.labels, this.history);
    this.sinceHint = 0;
    if (hint.kind === 'stuck') {
      this.undoPulse = 4;
      void this.ctx.say('jar.stuck');
      return;
    }
    this.hints++;
    if (hint.kind === 'back') this.undoPulse = 6;
    else this.hinted = hint.move;
    void this.ctx.say('jar.hint');
  }

  /** Every jar is one kind: the fruit turns to jam, the jars hop away, and the next board comes. */
  private async boardDone() {
    this.busy = true;
    this.hinted = null;
    this.undoButton.alpha = 0.35;
    sfx.sparkle();
    this.ctx.pet.cheer();
    this.board.forEach((jar, i) => {
      if (!jar.length) return;
      const s = this.jars[i].spot;
      const jam = new Graphics().roundRect(-JAR_W / 2 + 6, -jar.length * PIECE - 10, JAR_W - 12, jar.length * PIECE + 2, 16).fill({ color: JAM[jar[0]], alpha: 0.85 });
      jam.alpha = 0;
      this.jars[i].root.addChildAt(jam, this.jars[i].mat ? 2 : 1);
      void this.ctx.tw.to(jam, { alpha: 1 }, { duration: 0.4 });
      for (const p of this.pieces[i]) void this.ctx.tw.to(p, { alpha: 0 }, { duration: 0.4 });
      this.ctx.particles.burst(s.x, s.y - jarHeight(this.plan.cap) / 2, { kind: 'dot', colors: [JAM[jar[0]], 0xffffff], count: 10, speed: [60, 180], gravity: 0, life: [0.4, 0.8] });
    });
    await this.ctx.say('jar.done');
    const away = this.ctx.view.w + 200;
    await Promise.all([this.ctx.tw.to(this.jarLayer, { x: away }, { duration: 0.7, ease: ease.inOutSine }), this.ctx.tw.to(this.pieceLayer, { x: away }, { duration: 0.7, ease: ease.inOutSine })]);
    this.jarLayer.x = this.pieceLayer.x = 0;
    await this.next();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.tw.wait(0.3);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class JarIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const jar = jarArt(3);
    jar.position.set(0, -6);
    c.addChild(jar);
    [0, 0, 1].forEach((k, i) => {
      const f = fruitArt(k);
      f.position.set(0, -6 + slotY(i));
      c.addChild(f);
    });
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const kind = rng.int(0, 4);
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, 80).fill(swatch.yellow.light).stroke({ width: 6, color: swatch.yellow.line }));
  const jar = new Graphics()
    .roundRect(-36, -34, 72, 86, 18).fill(JAM[kind]).stroke({ width: 5, color: ink })
    .roundRect(-42, -48, 84, 20, 8).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line })
    .roundRect(-26, -6, 52, 30, 8).fill(0xffffff).stroke({ width: 3, color: ink });
  c.addChild(jar);
  const f = fruitArt(kind, 0.55);
  f.position.set(0, 9);
  c.addChild(f);
  return c;
}

export const jarSort: GameModule = {
  id: 'jar-sort',
  name: 'Jar Sort',
  titleLine: 'game.jar-sort',
  region: 'puzzle-peaks',
  skills: ['planning', 'sorting', 'spatial-reasoning'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'One of you says which fruit to move, and the other moves it.',
  offScreen: 'Stack two colors of blocks or pom-poms in cups or a cardboard tube and sort them so only the top one can move.',
  hubIcon: () => new JarIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new JarSort(ctx),
};
