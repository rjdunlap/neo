import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon, tile } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { miniBoard, pebblePiece, pile, sandBoard, shellPiece } from './art';
import {
  BORDER, GROOVE, LEVELS, SHELL_COLORS, Score, decidingLine, layout, makeRound, petReply, place, planFor, replyKind, stickerBoard, wonLine,
  type Board, type Layout, type Plan, type Round,
} from './logic';

type Phase = 'turn' | 'replay' | 'between' | 'done';

const REASON = { 'took-spot': 'sr.took-spot', 'got-three': 'sr.got-three', 'could-have': 'sr.could-have' } as const;

class ShellRows implements Game {
  readonly plan: Plan;
  readonly round: Round;
  readonly score = new Score();
  index = 0;
  phase: Phase = 'turn';
  /** The board on screen: the position, plus her wrong shell and the pet's reply while a replay runs. */
  board: Board;
  /** The square she set and the pet's reply, during a replay. */
  reply: { wrong: number; pebble: number } | null = null;
  finished = false;
  private saidFull = false;
  /** Bumped on every rewind or new position, so an awaited line from an older one stops short. */
  private gen = 0;
  private readonly reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  private L: Layout;
  private clock = 0;
  private readonly backdrop: Backdrop;
  private readonly boardLayer = new Container();
  private readonly squareLayer = new Container();
  private readonly pieceLayer = new Container();
  private readonly glow = new Graphics();
  private readonly shellPile: Container;
  private readonly pebblePile: Container;
  squares: Container[] = [];
  private pieces: (Container | null)[] = [];
  /** A row lit while the pet speaks (its three, or the row it stopped), or her finished row. */
  private lit: { line: readonly number[]; color: number } | null = null;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.round = makeRound(ctx.level, ctx.rng);
    this.board = this.position.board;
    this.backdrop = new Backdrop({ sky: [0xc4ecff, 0xfff6e0], hills: [0xbfe6ef, 0xf6e2b3, 0xeed39a], horizon: 0.32, clouds: 2, sun: true, seed: 251 }, ctx.view);
    this.L = layout(ctx.view) ?? layout({ w: 1024, h: 768 })!;
    this.glow.eventMode = 'none';
    this.pieceLayer.eventMode = 'none';
    this.boardLayer.eventMode = 'none';
    this.shellPile = pile('shell', this.round.colors[0]);
    this.pebblePile = pile('pebble');
    for (let i = 0; i < 9; i++) {
      const sq = new Container();
      const press = new Graphics();
      press.alpha = 0;
      sq.addChild(press);
      onTap(sq, () => this.tapSquare(i));
      this.squares.push(sq);
      this.squareLayer.addChild(sq);
    }
    ctx.stage.addChild(this.backdrop, this.boardLayer, this.squareLayer, this.glow, this.pieceLayer, this.shellPile, this.pebblePile);
    this.resize(ctx.view);
  }

  get position() { return this.round.positions[this.index]; }
  get right(): number { return this.position.right; }

  /** What a scripted play reads. */
  get state() {
    return {
      level: this.plan.level, index: this.index, phase: this.phase, board: this.board.slice(), right: this.right,
      reply: this.reply, misses: this.score.misses, hints: this.score.hints, glowing: this.score.glowing, finished: this.finished,
    };
  }

  start() { void this.ctx.say('sr.intro').then(() => { if (!this.finished) void this.instruct(); }); }

  destroy() {
    this.finished = true;
    this.gen++;
    for (const p of this.pieceLayer.children) { this.ctx.tw.kill(p); this.ctx.tw.kill(p.scale); }
    for (const s of this.squares) this.ctx.tw.kill(s.children[0]);
  }

  private instruct() { return this.ctx.instruct(`sr.instruct.${this.plan.level}` as 'sr.instruct.1'); }

  // ---- pieces ----

  private pieceFor(v: 'shell' | 'pebble'): Container {
    return v === 'shell' ? shellPiece(this.L.cell, this.round.colors[0]) : pebblePiece(this.L.cell);
  }

  /** Redraw every piece of `board` in its square. */
  private drawPieces() {
    for (const p of this.pieceLayer.removeChildren()) { this.ctx.tw.kill(p); this.ctx.tw.kill(p.scale); p.destroy({ children: true }); }
    this.pieces = this.board.map((v, i) => {
      if (!v) return null;
      const p = this.pieceFor(v);
      const b = this.L.squares[i];
      p.position.set(b.x, b.y);
      this.pieceLayer.addChild(p);
      return p;
    });
  }

  /** A shell set in square `i`, settling in. */
  private async setShell(i: number) {
    this.board = place(this.board, i, 'shell');
    const p = this.pieceFor('shell');
    const b = this.L.squares[i];
    p.position.set(b.x, b.y);
    p.scale.set(1.25);
    p.alpha = 0.6;
    this.pieceLayer.addChild(p);
    this.pieces[i] = p;
    sfx.pluck(5, 0.3);
    await this.ctx.tw.to(p.scale, { x: 1, y: 1 }, { duration: this.reduce ? 0.15 : 0.3, ease: ease.outBack });
    if (!p.destroyed) p.alpha = 1;
  }

  /** The pet's pebble slides in from its pile to square `i`. */
  private async slidePebble(i: number) {
    this.board = place(this.board, i, 'pebble');
    const p = this.pieceFor('pebble');
    const from = this.L.pebblePile, b = this.L.squares[i];
    p.position.set(from.x, from.y);
    this.pieceLayer.addChild(p);
    this.pieces[i] = p;
    await this.ctx.tw.to(p, { x: b.x, y: b.y }, { duration: this.reduce ? 0.3 : 0.6, ease: ease.outQuad });
    // A resize during the slide moved the squares; land on the square's current place.
    if (!p.destroyed) p.position.set(this.L.squares[i].x, this.L.squares[i].y);
    sfx.pluck(1, 0.3);
  }

  // ---- input ----

  private press(i: number) {
    const g = this.squares[i].children[0] as Graphics;
    this.ctx.tw.kill(g);
    g.alpha = 1;
    void this.ctx.tw.to(g, { alpha: 0 }, { duration: 0.35 });
  }

  private tapSquare(i: number) {
    if (this.finished || this.phase !== 'turn') return;
    this.press(i);
    if (this.board[i]) {
      // A full square wobbles; nothing is set and nothing counts.
      const p = this.pieces[i];
      if (p) { this.ctx.tw.kill(p); p.rotation = 0.15; void this.ctx.tw.to(p, { rotation: 0 }, { duration: 0.3, ease: ease.outBack }); }
      sfx.tick();
      if (!this.saidFull) { this.saidFull = true; void this.ctx.say('sr.full'); }
      return;
    }
    const outcome = this.score.answer(i === this.right);
    if (outcome === 'right') { void this.solve(i); return; }
    void this.replay(i, outcome === 'glow');
  }

  readonly hintLabel = 'Show me';

  /** *Show me*: the right square glows (one hint per position); asked again, the ghost sets the shell there. */
  askForHint() {
    if (this.finished || this.phase !== 'turn') return;
    if (this.score.showMe()) { void this.ctx.say('sr.look-again'); return; }
    this.tapSquare(this.right);
  }

  // ---- show me why ----

  private async replay(wrong: number, glow: boolean) {
    this.phase = 'replay';
    const g = ++this.gen;
    const before = this.position.board;
    const pebble = petReply(place(before, wrong, 'shell'), this.right);
    this.reply = { wrong, pebble };
    await this.setShell(wrong);
    if (g !== this.gen) return;
    await this.ctx.tw.wait(0.4);
    if (g !== this.gen) return;
    await this.slidePebble(pebble);
    if (g !== this.gen) return;
    const kind = replyKind(this.plan.level, before, wrong);
    this.lit = { line: decidingLine(before, wrong, pebble), color: kind === 'got-three' ? swatch.purple.light : swatch.yellow.light };
    if (kind === 'could-have') this.ctx.particles.burst(this.L.squares[this.right].x, this.L.squares[this.right].y, { kind: 'dot', colors: [swatch.yellow.fill, 0xffffff], count: 10, speed: [40, 120], gravity: 0, life: [0.3, 0.6] });
    sfx.boing();
    await Promise.all([this.ctx.say(REASON[kind]), this.ctx.tw.wait(0.8)]);
    if (g !== this.gen) return;
    // Both lift away and the board goes back to her turn.
    this.lit = null;
    const lifting = [this.pieces[wrong], this.pieces[pebble]].filter((p): p is Container => !!p);
    await Promise.all(lifting.map((p) => this.ctx.tw.to(p, { y: p.y - 40, alpha: 0 }, { duration: this.reduce ? 0.25 : 0.5 })));
    if (g !== this.gen) return;
    this.board = before;
    this.reply = null;
    this.drawPieces();
    this.phase = 'turn';
    if (glow) await this.ctx.say('sr.look-again');
    if (g !== this.gen || this.phase !== 'turn') return;
    void this.instruct();
  }

  // ---- the right square ----

  private async solve(i: number) {
    this.phase = 'between';
    const g = ++this.gen;
    await this.setShell(i);
    if (g !== this.gen) return;
    if (this.plan.id === 'stop') {
      sfx.bell(4, 0.3);
      this.ctx.pet.hop();
      await this.ctx.say('sr.saw-it');
    } else {
      const line = wonLine(this.board, 'shell')!;
      this.lit = { line, color: swatch.yellow.light };
      void this.rising(g);
      this.ctx.pet.cheer();
      await this.ctx.say('sr.three-in-a-row');
    }
    if (g !== this.gen) return;
    await this.ctx.tw.wait(0.4);
    if (g !== this.gen) return;
    this.lit = null;
    if (this.index + 1 >= this.round.positions.length) {
      this.phase = 'done';
      this.finished = true;
      sfx.tada();
      await this.ctx.say('sr.done');
      await this.ctx.tw.wait(0.3);
      this.ctx.finish({ misses: this.score.misses, hints: this.score.hints });
      return;
    }
    this.index++;
    this.gen++;
    this.score.newPosition();
    this.saidFull = false;
    this.board = this.position.board;
    sfx.whoosh();
    this.drawPieces();
    this.phase = 'turn';
    void this.instruct();
  }

  /** Her finished row shines with a rising three-note step. */
  private async rising(g: number) {
    for (const step of [5, 7, 9]) {
      if (g !== this.gen) return;
      sfx.bell(step, 0.3);
      await this.ctx.tw.wait(0.15);
    }
  }

  // ---- shell hooks ----

  resize(view: View) {
    this.L = layout(view) ?? this.L;
    const L = this.L;
    this.backdrop.resize(view);
    this.boardLayer.removeChildren().forEach((c) => c.destroy());
    const sand = sandBoard(L.board.w, L.cell, GROOVE, BORDER);
    sand.position.set(L.board.x, L.board.y);
    this.boardLayer.addChild(sand);
    this.squares.forEach((sq, i) => {
      const b = L.squares[i];
      sq.position.set(b.x, b.y);
      sq.hitArea = new Rectangle(-b.w / 2, -b.h / 2, b.w, b.h);
      (sq.children[0] as Graphics).clear().roundRect(-b.w / 2, -b.h / 2, b.w, b.h, 18).fill({ color: ink, alpha: 0.14 });
    });
    this.shellPile.position.set(L.shellPile.x, L.shellPile.y);
    this.pebblePile.position.set(L.pebblePile.x, L.pebblePile.y);
    // On her turn nothing is awaited on the pieces, so they are redrawn; mid-replay or mid-settle a piece's tween is
    // awaited (a killed tween never resolves), so the pieces only move to their new squares.
    if (this.phase === 'turn') this.drawPieces();
    else this.pieces.forEach((p, i) => { if (p && !p.destroyed) p.position.set(L.squares[i].x, L.squares[i].y); });
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    if (this.lit) {
      for (const i of this.lit.line) {
        const b = this.L.squares[i];
        this.glow.roundRect(b.x - b.w / 2 + 6, b.y - b.h / 2 + 6, b.w - 12, b.h - 12, 18).fill({ color: this.lit.color, alpha: 0.85 });
      }
    }
    if (!this.score.glowing || this.phase !== 'turn') return;
    const b = this.L.squares[this.right];
    const pulse = 4 + 3 * Math.sin(this.clock * 5);
    this.glow.roundRect(b.x - b.w / 2 + 8 - pulse, b.y - b.h / 2 + 8 - pulse, b.w - 16 + 2 * pulse, b.h - 16 + 2 * pulse, 20).stroke({ width: 7, color: swatch.yellow.fill });
  }

  autotouch(): TouchIntent | null {
    if (this.finished || this.phase !== 'turn') return null;
    return { tap: { on: this.squares[this.right] } };
  }
}

function icon(): Container {
  const c = new Container();
  const b: Board = ['shell', null, 'pebble', null, 'shell', null, null, null, null];
  const m = miniBoard(b, 62, 'pink');
  m.position.set(0, -110);
  c.addChild(m);
  return c;
}

function sticker(seed: number): Container {
  const c = new Container();
  c.addChild(tile(260, 260, 'white'));
  const { board, line } = stickerBoard(seed);
  c.addChild(miniBoard(board, 62, SHELL_COLORS[seed % SHELL_COLORS.length], line));
  return c;
}

export const shellRows: GameModule = {
  id: 'shell-rows', name: 'Shell Rows', titleLine: 'game.shell-rows', region: 'puzzle-peaks',
  skills: ['planning', 'prediction', 'logic'], bands: ['prek', 'school'], levels: (b) => rangeFor(LEVELS, b),
  describeLevel: (l) => planFor(l).name,
  music: STYLES.hub,
  coplayHint: 'Before she taps, ask "What will the pet do if you go there?" and let the replay answer.',
  offScreen: 'Noughts and crosses on paper or a steamy window; each of you says out loud which square you are watching.',
  hubIcon: () => new WigglyIcon(icon()), sticker, create: (ctx) => new ShellRows(ctx),
  touchDemo: true,
};
