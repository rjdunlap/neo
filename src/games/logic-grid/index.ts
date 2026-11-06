import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { cream, ink, swatch } from '../../art/palette';
import { bushArt, treeArt } from '../../art/picnic';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { safeArea, type View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  answerOf, applyStep, brokenClue, contradicts, CROSSED, cycle, EMPTY, emptyMarks, FILLED, fullWrong, makeRound, nextStep, planFor,
  shapeOf, shown, solved, wrongSquares, type Board, type Clue, type Mark, type Place, type Plan, type Step,
} from './logic';

/** Preschool's whole range; pre-K starts at level 2, and levels 3–8 (pre-K's 3, school, grown-up) come in later builds. */
const LEVELS: BandLevels = {
  preschool: { min: 1, max: 2 },
  prek: { min: 2, max: 2 },
};

const SQ = 100;
const PITCH = 104;
const CARD_W = 220;
/** A mark is judged once it rests this long, so the yes on the way to a no is never counted. */
const SETTLE = 2.5;

const nameOf = (f: CritterName) => f[0].toUpperCase() + f.slice(1);

/** A pond: a blue oval with reeds. */
function pondArt(): Graphics {
  const g = new Graphics();
  for (const [x, h] of [[-30, 46], [-20, 58], [26, 50]]) {
    g.moveTo(x, -18).lineTo(x + 3, -18 - h).stroke({ width: 5, color: swatch.green.line, cap: 'round' });
    g.roundRect(x - 2, -18 - h, 9, 22, 4).fill(swatch.brown.fill);
  }
  g.ellipse(0, 0, 44, 20).fill(swatch.blue.fill).stroke({ width: 5, color: swatch.blue.line });
  g.ellipse(-10, -5, 16, 5).fill({ color: 0xffffff, alpha: 0.5 });
  return g;
}

function placeArt(p: Place): Container {
  const c = new Container();
  if (p === 'pond') {
    const g = pondArt();
    g.position.set(0, 26);
    c.addChild(g);
  } else if (p === 'tree') {
    const g = treeArt(52, 34);
    g.scale.set(0.82);
    g.position.set(0, 42);
    c.addChild(g);
  } else {
    const g = bushArt(84);
    g.position.set(0, 30);
    c.addChild(g);
  }
  return c;
}

/** The missing pie: a round crust with a lattice. */
function pieArt(): Graphics {
  const g = new Graphics();
  g.ellipse(0, 8, 40, 18).fill(swatch.brown.line);
  g.ellipse(0, 0, 40, 18).fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.brown.line });
  for (const x of [-18, 0, 18]) g.moveTo(x, -15).lineTo(x, 15).stroke({ width: 5, color: swatch.orange.line });
  for (const y of [-7, 7]) g.moveTo(-34, y).lineTo(34, y).stroke({ width: 5, color: swatch.orange.line });
  return g;
}

function friendArt(f: CritterName, scale: number): Critter {
  const c = new Critter(CRITTERS[f]);
  c.scale.set(scale);
  return c;
}

function card(color: { fill: number; line: number }, w = SQ, h = SQ): Graphics {
  return new Graphics().roundRect(0, 0, w, h, 18).fill(color.fill).stroke({ width: 4, color: color.line });
}

/** A clue's picture card: the friend, a green check or a red cross, and the place. */
class ClueCard extends Container {
  readonly glow = new Graphics();
  constructor(readonly clue: Clue, b: Board) {
    super();
    this.glow.roundRect(-12, -12, CARD_W + 24, SQ + 24, 28).fill({ color: 0xfff3a0, alpha: 0.95 });
    this.glow.visible = false;
    this.addChild(this.glow, card({ fill: cream, line: swatch.purple.line }, CARD_W, SQ));
    const who = friendArt(b.friends[clue.friend], 0.32);
    who.alive = false;
    who.position.set(48, 92);
    const sign = new Graphics();
    if (clue.kind === 'direct') sign.circle(0, 0, 20).fill(swatch.green.fill).moveTo(-9, 0).lineTo(-2, 8).lineTo(10, -8).stroke({ width: 6, color: 0xffffff, cap: 'round', join: 'round' });
    else sign.circle(0, 0, 20).fill(swatch.red.fill).moveTo(-8, -8).lineTo(8, 8).moveTo(8, -8).lineTo(-8, 8).stroke({ width: 6, color: 0xffffff, cap: 'round' });
    sign.position.set(110, 50);
    const where = placeArt(b.places[clue.place]);
    where.scale.set(0.8);
    where.position.set(170, 46);
    for (const x of [who, sign, where]) x.eventMode = 'none';
    this.addChild(who, sign, where);
    this.hitArea = new Rectangle(0, 0, CARD_W, SQ);
  }
}

class MysteryGrid implements Game {
  readonly plan: Plan;
  readonly boards: Board[];
  index = 0;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** 'grid' while she marks; 'answer' once solved, when she taps who has the pie. */
  phase: 'grid' | 'answer' = 'grid';
  marks: Mark[] = [];
  /** A just-tapped square, judged once it rests. */
  pending: { square: number; t: number } | null = null;
  /** The step Help last pointed at: pressing again while it is still next puts its mark down. */
  pointed: Step | null = null;

  private readonly backdrop: Backdrop;
  readonly board = new Container();
  private readonly cells: Container[] = [];
  private readonly markLayer = new Graphics();
  private readonly faces = new Container();
  private readonly glowLayer = new Graphics();
  readonly friendCards: Container[] = [];
  readonly clueCards: ClueCard[] = [];
  private readonly clueRow = new Container();
  readonly help = new Container();
  private readonly pie = new Container();
  private critters: Critter[] = [];
  /** Square:clue pairs already counted this board, and the squares behind them. */
  private counted = new Set<string>();
  private countedSquares = new Set<number>();
  private rings = new Set<number>();
  private boardMisses = 0;
  private pulse: number | null = null;
  private clock = 0;
  private view: View;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.boards = makeRound(this.plan, ctx.rng);
    this.backdrop = new Backdrop({ sky: [0xcfe0ff, 0xfff6e0], hills: [0xb3c7f2, 0xa8dc8f], horizon: 0.72, clouds: 2, seed: 223 }, ctx.view);
    for (const g of [this.markLayer, this.glowLayer]) g.eventMode = 'none';
    this.faces.eventMode = 'none';
    const hb = new Graphics().roundRect(-60, -50, 120, 100, 26).fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.yellow.line });
    const q = label('?', 60, ink);
    q.eventMode = 'none';
    this.help.addChild(hb, q);
    this.help.hitArea = new Rectangle(-60, -50, 120, 100);
    onTap(this.help, () => this.useHelp(), { cooldown: 500 });
    ctx.stage.addChild(this.backdrop, this.board, this.clueRow, this.help);
  }

  get current(): Board | undefined {
    return this.boards[this.index];
  }

  start() {
    this.setBoard();
    void this.intro();
  }

  private async intro() {
    await this.ctx.say('lg.mystery');
    await this.ctx.instruct(this.plan.level === 1 ? 'lg.one' : 'lg.two');
    await this.readClues();
  }

  private async readClues() {
    const b = this.current;
    if (!b) return;
    const at = this.index;
    for (const c of this.clueCards) {
      if (this.index !== at || this.finished) return;
      c.glow.visible = true;
      await this.sayClue(c.clue, b);
      if (this.index !== at || this.finished) return;
      c.glow.visible = false;
    }
  }

  private sayClue(c: Clue, b: Board, id: 'clue' | 'remind' = 'clue') {
    return this.ctx.say(`lg.${id}.${c.kind}`, { friend: nameOf(b.friends[c.friend]), place: b.places[c.place] });
  }

  update(dt: number) {
    this.clock += dt;
    if (this.pending && (this.pending.t -= dt) <= 0) this.settle();
    if (this.pulse !== null || this.boardMisses >= 2) this.drawGlow();
  }

  destroy() {
    this.pending = null;
  }

  // Layout -------------------------------------------------------------------------------

  private get upright() {
    return this.view.h > this.view.w * 1.1;
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const b = this.current;
    if (!b) return;
    const s = shapeOf(b);
    const gw = (s.cols + 1) * PITCH - 4, gh = (s.rows + 1) * PITCH - 4;
    const safe = safeArea(v);
    const n = this.clueCards.length;
    if (this.upright) {
      this.board.position.set((v.w - gw) / 2, 160);
      const y = this.board.y + gh + 40;
      this.clueCards.forEach((c, i) => c.position.set(v.w / 2 - (n * (CARD_W + 16) - 16) / 2 + i * (CARD_W + 16), y));
      this.help.position.set(Math.min(v.w - 110, v.w / 2 + 300), Math.min(v.h - 114, 910));
    } else {
      const left = safe.x + 180;
      const total = gw + 48 + CARD_W;
      this.board.position.set(Math.max(left, left + (v.w - 140 - left - total) / 2), 160);
      const x = this.board.x + gw + 48;
      this.clueCards.forEach((c, i) => c.position.set(x, 160 + i * (SQ + 16)));
      this.help.position.set(v.w - 90, Math.min(v.h - 80, 660));
    }
    if (this.pie.parent) this.placePie();
  }

  private cellAt(square: number) {
    const b = this.current!;
    const s = shapeOf(b);
    return { x: PITCH + (square % s.cols) * PITCH, y: PITCH + Math.floor(square / s.cols) * PITCH };
  }

  // The board ----------------------------------------------------------------------------

  private setBoard() {
    const b = this.current!;
    const s = shapeOf(b);
    for (const c of this.critters) this.ctx.untrack(c);
    this.critters = [];
    const keep = new Set<Container>([this.glowLayer, this.markLayer, this.faces]);
    this.board.removeChildren().forEach((c) => !keep.has(c) && c.destroy({ children: true }));
    this.clueRow.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.cells.length = 0;
    this.friendCards.length = 0;
    this.clueCards.length = 0;
    this.pie.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.marks = emptyMarks(s);
    this.pending = null;
    this.pointed = null;
    this.pulse = null;
    this.counted = new Set();
    this.countedSquares = new Set();
    this.rings = new Set();
    this.boardMisses = 0;
    this.phase = 'grid';

    // The corner: the missing pie with a question mark.
    const corner = new Container();
    corner.addChild(card({ fill: 0xfffbe6, line: swatch.orange.line }));
    const pie = pieArt();
    pie.scale.set(0.8);
    pie.position.set(50, 62);
    const qm = label('?', 40, swatch.orange.line);
    qm.position.set(50, 24);
    corner.addChild(pie, qm);
    this.board.addChild(this.glowLayer, corner);
    b.places.forEach((p, i) => {
      const h = new Container();
      h.addChild(card({ fill: swatch.green.light, line: swatch.green.line }));
      const art = placeArt(p);
      art.position.set(50, 44);
      art.eventMode = 'none';
      h.addChild(art);
      h.position.set(PITCH + i * PITCH, 0);
      h.hitArea = new Rectangle(0, 0, SQ, SQ);
      onTap(h, () => this.tapPlace(i), { cooldown: 300 });
      this.board.addChild(h);
    });
    b.friends.forEach((f, i) => {
      const h = new Container();
      h.addChild(card({ fill: swatch.purple.light, line: swatch.purple.line }));
      const cr = this.ctx.track(friendArt(f, 0.34));
      cr.position.set(50, 94);
      cr.eventMode = 'none';
      this.critters.push(cr);
      h.addChild(cr);
      h.position.set(0, PITCH + i * PITCH);
      h.hitArea = new Rectangle(0, 0, SQ, SQ);
      onTap(h, () => this.tapFriend(i), { cooldown: 300 });
      this.friendCards.push(h);
      this.board.addChild(h);
    });
    for (let i = 0; i < s.rows * s.cols; i++) {
      const cell = new Container();
      cell.addChild(card({ fill: 0xffffff, line: swatch.white.line }));
      cell.position.copyFrom(this.cellAt(i));
      cell.hitArea = new Rectangle(0, 0, SQ, SQ);
      onTap(cell, () => this.tapSquare(i), { cooldown: 150 });
      this.cells.push(cell);
      this.board.addChild(cell);
    }
    this.board.addChild(this.markLayer, this.faces);
    b.clues.forEach((c) => {
      const cc = new ClueCard(c, b);
      onTap(cc, () => this.tapClue(cc), { cooldown: 400 });
      this.clueCards.push(cc);
      this.clueRow.addChild(cc);
    });
    this.drawMarks();
    this.board.alpha = 0;
    this.clueRow.alpha = 0;
    void this.ctx.tw.to(this.clueRow, { alpha: 1 }, { duration: 0.35 });
    void this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.35 }).then(() => (this.busy = false));
    this.resize(this.view);
  }

  private drawMarks() {
    const b = this.current!;
    const s = shapeOf(b);
    const g = this.markLayer.clear();
    this.faces.removeChildren().forEach((c) => c.destroy({ children: true }));
    shown(s, this.marks).forEach((m, i) => {
      const { x, y } = this.cellAt(i);
      if (m.mark === FILLED) {
        g.roundRect(x + 6, y + 6, SQ - 12, SQ - 12, 14).fill(swatch.green.light);
        const face = friendArt(b.friends[Math.floor(i / s.cols)], 0.24);
        face.alive = false;
        face.position.set(x + 42, y + 88);
        this.faces.addChild(face);
        g.circle(x + 76, y + 26, 18).fill(swatch.green.fill).moveTo(x + 68, y + 26).lineTo(x + 74, y + 33).lineTo(x + 85, y + 19).stroke({ width: 5, color: 0xffffff, cap: 'round', join: 'round' });
      } else if (m.mark === CROSSED) {
        const a = m.auto ? 0.3 : 0.85;
        g.moveTo(x + 28, y + 28).lineTo(x + 72, y + 72).moveTo(x + 72, y + 28).lineTo(x + 28, y + 72).stroke({ width: 9, color: swatch.red.line, alpha: a, cap: 'round' });
      }
      if (this.rings.has(i)) g.roundRect(x + 2, y + 2, SQ - 4, SQ - 4, 16).stroke({ width: 6, color: swatch.red.fill, alpha: 0.8 });
    });
    this.drawGlow();
  }

  /** Help's pulse, and after two misses on a board the rule solver's next square, glow softly behind the grid. */
  private drawGlow() {
    const g = this.glowLayer.clear();
    const b = this.current;
    if (!b || this.phase !== 'grid') return;
    const target = this.pulse ?? (this.boardMisses >= 2 ? nextStep(b, this.marks)?.square ?? null : null);
    if (target === null) return;
    const { x, y } = this.cellAt(target);
    const a = 0.55 + 0.35 * Math.sin(this.clock * 5);
    g.roundRect(x - 12, y - 12, SQ + 24, SQ + 24, 26).fill({ color: 0xfff3a0, alpha: a });
  }

  private lightClues(ids: number[]) {
    this.clueCards.forEach((c, i) => (c.glow.visible = ids.includes(i)));
  }

  // Taps ---------------------------------------------------------------------------------

  private tapSquare(i: number) {
    const b = this.current;
    if (!b || this.busy || this.finished || this.phase !== 'grid') return;
    if (this.pending && this.pending.square !== i) this.settle();
    if (this.phase !== 'grid' || this.busy) return;
    const was = this.marks[i];
    const now = cycle(was);
    this.marks[i] = now;
    this.rings.delete(i);
    this.pointed = null;
    this.pulse = null;
    this.lightClues([]);
    const cell = this.cells[i];
    cell.scale.set(0.92);
    void this.ctx.tw.to(cell.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack });
    if (now === FILLED) sfx.marimba(4 + (i % 5));
    else if (now === CROSSED) sfx.brush();
    else sfx.pop(3);
    this.drawMarks();
    this.pending = now === EMPTY ? null : { square: i, t: SETTLE };
    if (solved(b, this.marks)) void this.solvedBoard();
  }

  /** Judges the mark that has rested: one miss when a single shown clue rules it out, counted once per square and clue. */
  private settle() {
    const p = this.pending;
    this.pending = null;
    const b = this.current;
    if (!p || !b || this.phase !== 'grid' || this.finished) return;
    const mark = this.marks[p.square];
    const against = contradicts(b, p.square, mark);
    if (against.length) {
      const fresh = against.filter((c) => !this.counted.has(`${p.square}:${c}`));
      if (fresh.length) this.miss();
      for (const c of against) this.counted.add(`${p.square}:${c}`);
      this.countedSquares.add(p.square);
      sfx.boing();
      this.rings.add(p.square);
      this.lightClues([against[0]]);
      void this.sayClue(b.clues[against[0]], b, 'remind');
      // A full grid's wrong yeses lift too; this mark already counted, so no second miss.
      if (fullWrong(b, this.marks)) for (const s of wrongSquares(b, this.marks)) if (this.marks[s] === FILLED) this.marks[s] = EMPTY;
      this.drawMarks();
      return;
    }
    if (fullWrong(b, this.marks)) {
      const wrong = wrongSquares(b, this.marks).filter((s) => this.marks[s] === FILLED);
      if (!wrong.every((s) => this.countedSquares.has(s))) this.miss();
      sfx.boing();
      const broken = brokenClue(b, this.marks);
      if (broken >= 0) {
        this.lightClues([broken]);
        void this.sayClue(b.clues[broken], b, 'remind');
      } else void this.ctx.say('lg.one-each');
      for (const s of wrong) this.marks[s] = EMPTY;
      this.drawMarks();
    }
  }

  private miss() {
    this.misses++;
    this.boardMisses++;
  }

  private tapClue(c: ClueCard) {
    const b = this.current;
    if (!b || this.finished) return;
    sfx.pop(5);
    c.scale.set(1.06);
    void this.ctx.tw.to(c.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    void this.sayClue(c.clue, b);
  }

  private tapPlace(i: number) {
    const b = this.current;
    if (!b || this.finished) return;
    sfx.pop(6);
    void this.ctx.say('lg.place', { place: b.places[i] });
  }

  private tapFriend(i: number) {
    const b = this.current;
    if (!b || this.finished || this.busy) return;
    this.critters[i]?.poke();
    if (this.phase === 'grid') {
      sfx.pop(7);
      void this.ctx.say('lg.friend', { friend: nameOf(b.friends[i]) });
      return;
    }
    if (i === answerOf(b)) void this.found();
    else {
      this.misses++;
      sfx.boing();
      const card = this.friendCards[i];
      card.alpha = 0.6;
      void this.ctx.tw.to(card, { alpha: 1 }, { duration: 1.2 });
      void this.ctx.say('lg.event', { place: b.places[b.event] });
    }
  }

  // The answer ---------------------------------------------------------------------------

  private placePie() {
    const b = this.current!;
    this.pie.position.set(this.board.x + PITCH + b.event * PITCH + 50, this.board.y - 6);
  }

  private async solvedBoard() {
    const b = this.current!;
    this.busy = true;
    this.pending = null;
    this.phase = 'answer';
    this.lightClues([]);
    this.pulse = null;
    this.drawGlow();
    sfx.sparkle();
    for (const c of this.critters) c.cheer();
    const at = this.index;
    await this.ctx.say('lg.solved');
    if (this.index !== at || this.finished) return;
    // The pie appears by its place.
    const pie = pieArt();
    this.pie.addChild(pie);
    this.ctx.stage.addChild(this.pie);
    this.placePie();
    this.pie.scale.set(0);
    void this.ctx.tw.to(this.pie.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
    await this.ctx.say('lg.event', { place: b.places[b.event] });
    if (this.index !== at || this.finished) return;
    this.busy = false;
    for (const c of this.critters) c.hop();
    void this.ctx.say('lg.who');
  }

  private async found() {
    const b = this.current!;
    this.busy = true;
    sfx.tada();
    const who = answerOf(b);
    this.critters[who]?.cheer();
    const at = this.friendCards[who];
    this.ctx.particles.burst(this.board.x + at.x + 50, this.board.y + at.y + 50, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.orange.light], count: 16, speed: [100, 260], gravity: 0, life: [0.5, 0.9] });
    await this.ctx.say('lg.reveal', { friend: nameOf(b.friends[who]) });
    if (this.finished) return;
    this.index++;
    this.pie.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.pie.parent?.removeChild(this.pie);
    if (!this.current) return void this.end();
    await this.ctx.tw.to(this.board, { alpha: 0 }, { duration: 0.3 });
    this.setBoard();
    await this.ctx.say('lg.next');
    await this.readClues();
  }

  /**
   * Help points at the clue that decides the next square: the card lights and speaks, the square pulses, one hint. Pressing
   * again while that step is still next puts its mark down (clearing wrong marks), with no second hint. Once solved, it speaks
   * where the pie is and lights the friend there; again, it answers.
   */
  useHelp() {
    const b = this.current;
    if (!b || this.busy || this.finished) return;
    if (this.pending) this.settle();
    if (this.busy || this.phase === 'grid' && solved(b, this.marks)) return;
    if (this.phase === 'answer') {
      if (this.pointed) return void this.found();
      this.hints++;
      this.pointed = { square: -1, mark: EMPTY, clues: [], why: 'clue' };
      this.critters[answerOf(b)]?.hop(1.4);
      void this.ctx.say('lg.event', { place: b.places[b.event] });
      return;
    }
    const st = nextStep(b, this.marks);
    if (!st) return;
    if (this.pointed && this.pointed.square === st.square && this.pointed.mark === st.mark) {
      this.marks = applyStep(b, this.marks, st);
      this.rings.clear();
      this.pointed = null;
      this.pulse = null;
      this.lightClues([]);
      if (st.mark === FILLED) sfx.marimba(6);
      else sfx.brush();
      this.drawMarks();
      if (solved(b, this.marks)) void this.solvedBoard();
      return;
    }
    this.hints++;
    this.pointed = st;
    this.pulse = st.square;
    this.lightClues(st.clues);
    this.drawGlow();
    if (st.why === 'last') void this.ctx.say('lg.last', { friend: nameOf(b.friends[Math.floor(st.square / b.places.length)]) });
    else void this.sayClue(b.clues[st.clues[0]], b);
  }

  /**
   * The ghost finger replays the rule solver: one tap for a yes, two for a no (the second soon after, before the first is
   * judged), then taps the friend who has the pie.
   */
  autotouch(): TouchIntent | null {
    const b = this.current;
    if (!b || this.busy || this.finished) return null;
    if (this.phase === 'answer') {
      const c = this.friendCards[answerOf(b)];
      return { tap: { on: c, x: SQ / 2, y: SQ / 2 } };
    }
    const st = nextStep(b, this.marks);
    if (!st) return null;
    const cell = this.cells[st.square];
    const twice = st.mark === CROSSED && this.marks[st.square] !== FILLED;
    return { tap: { on: cell, x: SQ / 2, y: SQ / 2 }, pause: twice ? 0.25 : undefined };
  }

  /** For scripted checks: the square and mark Help would point at next. */
  next() {
    const b = this.current!;
    const st = nextStep(b, this.marks);
    return st && { square: st.square, mark: st.mark };
  }

  /** For scripted checks: a square a single clue rules a yes out of (a wrong yes that counts), or -1. */
  wrongYes() {
    const b = this.current!;
    const s = shapeOf(b);
    for (let i = 0; i < s.rows * s.cols; i++) if (this.marks[i] === EMPTY && contradicts(b, i, FILLED).length) return i;
    return -1;
  }

  private async end() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    this.ctx.pet.cheer();
    await this.ctx.say('lg.done');
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

/** A 2 by 3 grid of checks and crosses with a pie at the corner. */
function miniGrid(): Container {
  const c = new Container();
  const g = new Graphics();
  for (let r = 0; r < 3; r++) {
    for (let col = 0; col < 3; col++) {
      const x = -96 + col * 68, y = -96 + r * 68;
      g.roundRect(x, y, 60, 60, 10).fill(r === 0 && col === 0 ? 0xfffbe6 : 0xffffff).stroke({ width: 4, color: swatch.purple.line });
      if (r === 0 || col === 0) continue;
      if ((r + col) % 3 === 0) g.circle(x + 30, y + 30, 16).fill(swatch.green.fill);
      else g.moveTo(x + 18, y + 18).lineTo(x + 42, y + 42).moveTo(x + 42, y + 18).lineTo(x + 18, y + 42).stroke({ width: 7, color: swatch.red.line, cap: 'round' });
    }
  }
  c.addChild(g);
  const pie = pieArt();
  pie.scale.set(0.6);
  pie.position.set(-66, -62);
  c.addChild(pie);
  return c;
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(new Graphics().roundRect(-80, -80, 160, 160, 24).fill(0xffffff).stroke({ width: 7, color: swatch.purple.line }));
  const f = friendArt(rng.pick<CritterName>(['cat', 'duck', 'bear', 'dog', 'bunny', 'pig']), 0.48);
  f.alive = false;
  f.position.set(-10, 72);
  const pie = pieArt();
  pie.scale.set(0.7);
  pie.position.set(42, 40);
  c.addChild(f, pie);
  return c;
}

export const logicGrid: GameModule = {
  id: 'logic-grid',
  name: 'Mystery Grid',
  titleLine: 'game.logic-grid',
  region: 'puzzle-peaks',
  challenge: 'logic',
  skills: ['deduction', 'reasoning', 'using-evidence'],
  bands: ['preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  touchDemo: true,
  coplayHint: 'Read a clue aloud together while {name} marks the grid, and ask why a square is a no.',
  offScreen: 'Hide a toy and give one clue at a time until someone finds it.',
  hubIcon: () => new WigglyIcon(miniGrid()),
  sticker,
  create: (ctx) => new MysteryGrid(ctx),
};
