/**
 * River Tablets: make a clay record of real things, then open it up and see it match them one to one. Level 1 drops a token
 * in the jar for each sheep and tips the jar; level 2 presses one mark per token on a clay envelope and cracks it open;
 * level 3 presses each mark in the row with its picture and reads the tablet back; level 4 writes a cart's crates and
 * baskets with big marks for tens and small marks for ones; level 5 checks a cart against the farm's tablet: short, right or
 * extra, and by how many. Rules: ./logic.ts; definition:
 * docs/definitions/river-tablets.md.
 */
import { Container, Ellipse, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import type { LineId } from '../../content/voice-script';
import {
  ballArt, basketArt, cartArt, cellArt, crackArt, crateArt, goodArt, handInArt, iconArt, jarArt, numberArt, penArt, riverArt, rowArt, sheepArt, signArt, stampArt, stickerArt, storeArt, stripArt,
  tabletArt, tenWedgeArt, tokenArt, verdictArt, wedgeArt, yardArt,
} from './art';
import {
  arrive, askCheck, askEnvelope, askTablet, askTens, briefFor, CART_VERDICTS, cartOf, CELL, centre, checkTally, chooseNumber, chooseVerdict, crackEnvelope, envelopeTally, handIn, hintFor, KINDS, lift, lineUp,
  markCount, planFor, press, pressRow, readBack, readyToTip, ROW_CELLS, SCATTER_COLS, SCATTER_ROWS, scatterFor, shortest, SIGN, stamp, startCheck, startEnvelope, startPen, startTablet, startTens, tabletLayout,
  tabletTally, tapJar, tensHint, tensTally, value, verdictFor, waiting,
  type Brief, type Cart, type CartVerdict, type CheckState, type EnvelopeState, type Kind, type Mark, type PenState, type Pt, type Reading, type Rect, type TabletLayout, type TabletState, type TensState,
} from './logic';

const LEVELS: BandLevels = {
  preschool: { min: 1, max: 2 },
  prek: { min: 2, max: 3 },
  school: { min: 3, max: 5 },
};

/** Spoken counts come from bounded slots, never free text. */
const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
const word = (n: number) => WORDS[Math.min(n, WORDS.length - 1)];
/** The jar glows when a sheep has waited this long for its token. */
const IDLE_GLOW = 8;
const PEEK_SECONDS = 2;

class RiverTablets implements Game {
  readonly brief: Brief;
  pen: PenState | null = null;
  envelopes: EnvelopeState[] = [];
  envelopeIndex = 0;
  tablets: TabletState[] = [];
  tabletIndex = 0;
  /** Level 4: one tablet per cart; level 5: one check per cart. `cartIndex` is the cart in the yard. */
  tens: TensState[] = [];
  checks: CheckState[] = [];
  cartIndex = 0;
  /** Level 4: the pet has counted the yard for this cart (the ghost finger asks once). */
  yardCounted = false;
  /** An animation is running; inputs wait. */
  busy = false;
  finished = false;
  private alive = true;
  private epoch = 0;
  private clock = 0;
  private idle = 0;
  peekLeft = 0;
  private peeked = false;
  /** The envelope's tokens are inside (the fill has ended). */
  private filled = false;
  /** The ball is shown open (filling or cracked). */
  private opened = false;
  private firstToken = true;
  private view: View;
  private relayout = false;
  layoutNow: TabletLayout | null = null;
  private readonly walkSeconds: number;

  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly glow = new Graphics();
  jarNode: Container | null = null;
  ballNode: Container | null = null;
  cellNodes: Container[] = [];
  crackNode: Container | null = null;
  rowNodes: Container[] = [];
  private signNodes: Container[] = [];
  private storeNode: Container | null = null;
  private cartNode: Container | null = null;
  private goodNode: Container | null = null;
  private sheepNodes: Container[] = [];
  private tokenNodes: Container[] = [];
  private insideNodes: Container[] = [];
  private readonly lineupLayer = new Container();
  yardNode: Container | null = null;
  tabletNode: Container | null = null;
  stripNodes: Container[] = [];
  stampNodes: Container[] = [];
  handInNode: Container | null = null;
  verdictNodes: Container[] = [];
  numberNodes: Container[] = [];
  crateNodes: Container[] = [];
  private basketNodes: Container[] = [];
  private openCrate = -1;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.brief = briefFor(ctx.level, ctx.rng);
    this.walkSeconds = ctx.demo ? 0.5 : 1.2;
    this.backdrop = new Backdrop({ sky: [0xcfe9f7, 0xfff6e0], hills: [0xd9c58f, 0xcfe0a3], horizon: 0.42, clouds: 2, sun: true, seed: 211 }, ctx.view);
    this.glow.eventMode = 'none';
    this.lineupLayer.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.board);
    if (this.brief.id === 'tokens') this.pen = startPen(this.brief.sheep);
    if (this.brief.id === 'envelope') this.envelopes = this.brief.envelopes.map((n) => startEnvelope(n));
    if (this.brief.id === 'rows') this.tablets = this.brief.deliveries.map((d) => startTablet(d));
    if (this.brief.id === 'tens') this.tens = this.brief.carts.map((c) => startTens(10 * c.crates + c.loose));
    if (this.brief.id === 'check') this.checks = this.brief.deliveries.map((d) => startCheck(d));
  }

  get level() {
    return this.brief.level;
  }

  get envelope(): EnvelopeState {
    return this.envelopes[this.envelopeIndex];
  }

  get tablet(): TabletState {
    return this.tablets[this.tabletIndex];
  }

  /** Round totals so far, for a check or the finish. */
  get tally() {
    if (this.brief.id === 'envelope') return envelopeTally(this.envelopes);
    if (this.brief.id === 'rows') return tabletTally(this.tablets);
    if (this.brief.id === 'tens') return tensTally(this.tens);
    if (this.brief.id === 'check') return checkTally(this.checks);
    return { misses: 0, hints: 0 };
  }

  start() {
    this.build();
    void this.ctx.instruct(`rt.instruct.${this.level}` as LineId);
    if (this.level === 4) void this.ctx.say('rt.history.tens');
    else if (this.level >= 2) void this.ctx.say('rt.history');
    void this.begin();
  }

  destroy() {
    this.alive = false;
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    if (!this.layoutNow) return;
    if (this.busy || this.finished) { this.relayout = true; return; }
    this.build();
  }

  /** A guard after every await: the scene is alive and nothing rebuilt the board meanwhile. */
  private live(epoch: number) {
    return this.alive && epoch === this.epoch && !this.finished;
  }

  // ——— Building ———

  private build() {
    this.epoch++;
    this.relayout = false;
    this.jarNode = this.ballNode = this.crackNode = this.storeNode = this.cartNode = this.goodNode = null;
    this.yardNode = this.tabletNode = this.handInNode = null;
    this.stripNodes = [];
    this.stampNodes = [];
    this.verdictNodes = [];
    this.numberNodes = [];
    this.crateNodes = [];
    this.basketNodes = [];
    this.cellNodes = [];
    this.rowNodes = [];
    this.signNodes = [];
    this.sheepNodes = [];
    this.tokenNodes = [];
    this.insideNodes = [];
    this.glow.removeFromParent();
    this.lineupLayer.removeFromParent();
    for (const c of this.lineupLayer.removeChildren()) c.destroy({ children: true });
    for (const c of this.board.removeChildren()) c.destroy({ children: true });
    if (this.finished) return;
    const l = tabletLayout(this.level, this.view);
    this.layoutNow = l;
    if (!l) return;
    if (this.brief.id === 'tens' || this.brief.id === 'check') {
      this.buildYard(l);
      this.buildTablet(l);
      this.board.addChild(this.lineupLayer, this.glow);
      if (this.brief.id === 'check' && this.check.lined) this.drawLineup(shortest(this.check.t), cartOf(this.check.c), true);
      return;
    }
    const river = riverArt(l.lane.w, l.lane.h * 0.5);
    river.position.set(l.lane.x, l.lane.y);
    this.board.addChild(river);
    if (this.brief.id === 'tokens') this.buildPen(l);
    else if (this.brief.id === 'envelope') this.buildEnvelope(l);
    else this.buildRows(l);
    this.board.addChild(this.lineupLayer, this.glow);
  }

  private buildPen(l: TabletLayout) {
    const b = this.brief;
    if (b.id !== 'tokens' || !this.pen) return;
    const pen = penArt(l.lane.w, l.lane.h, b.gate);
    pen.position.set(l.lane.x, l.lane.y);
    this.board.addChild(pen);
    // Sheep already in the pen stand at their slots; the walking one is placed by the walk.
    for (let i = 0; i < this.pen.arrived; i++) {
      const s = sheepArt(b.colors[i], 110);
      s.position.copyFrom(this.sheepSlot(i));
      this.board.addChild(s);
      this.sheepNodes.push(s);
    }
    const jar = new Container();
    const r = l.jar!;
    jar.position.set(r.x + r.w / 2, r.y + r.h);
    jar.addChild(jarArt(r.w, r.h));
    jar.hitArea = new Rectangle(-r.w / 2 - 10, -r.h - 10, r.w + 20, r.h + 20);
    onTap(jar, () => this.tapJar(), { cooldown: 200 });
    this.board.addChild(jar);
    this.jarNode = jar;
    for (let i = 0; i < this.pen.tokens; i++) this.tokenNodes.push(this.tokenInJar(i));
    this.redrawJar();
  }

  private buildEnvelope(l: TabletLayout) {
    // A small jar of tokens waits in the lane.
    const jar = new Container();
    jar.position.set(l.lane.x + 120, l.lane.y + l.lane.h - 10);
    jar.addChild(jarArt(120, 130));
    jar.eventMode = 'none';
    this.board.addChild(jar);
    this.jarNode = jar;
    const r = l.ball!;
    const ball = new Container();
    ball.position.copyFrom(centre(r));
    ball.hitArea = new Ellipse(0, 0, r.w / 2, r.h / 2);
    onTap(ball, () => this.peek(), { cooldown: 200 });
    this.board.addChild(ball);
    this.ballNode = ball;
    this.cellNodes = l.cells!.map((c, i) => {
      const node = new Container();
      node.position.set(centre(c).x - ball.x, centre(c).y - ball.y);
      node.hitArea = new Rectangle(-c.w / 2, -c.h / 2, c.w, c.h);
      onTap(node, (e) => { e.stopPropagation(); this.pressCell(i); }, { cooldown: 150 });
      ball.addChild(node);
      return node;
    });
    const cr = l.crack!;
    const crack = new Container();
    crack.position.copyFrom(centre(cr));
    crack.addChild(crackArt(cr.w, cr.h));
    crack.hitArea = new Rectangle(-cr.w / 2 - 8, -cr.h / 2 - 8, cr.w + 16, cr.h + 16);
    onTap(crack, () => this.crack(), { cooldown: 400 });
    this.board.addChild(crack);
    this.crackNode = crack;
    // A rebuilt (rotated) envelope that was already filled keeps its tokens inside, hidden until a peek or the crack.
    if (this.filled) {
      for (let i = 0; i < this.envelope.tokens; i++) {
        const t = tokenArt(24);
        const at = this.insideAt(i);
        t.position.set(at.x, at.y);
        t.visible = false;
        this.board.addChildAt(t, this.board.getChildIndex(ball));
        this.insideNodes.push(t);
      }
    }
    this.redrawBall();
  }

  private buildRows(l: TabletLayout) {
    const store = new Container();
    const sr = l.store!;
    store.position.set(sr.x, sr.y);
    store.eventMode = 'none';
    this.board.addChild(store);
    this.storeNode = store;
    this.rowNodes = KINDS.map((kind, i) => {
      const r = l.rows![i];
      const node = new Container();
      node.position.copyFrom(centre(r));
      node.hitArea = new Rectangle(-r.w / 2 - 6, -r.h / 2 - 6, r.w + 12, r.h + 12);
      onTap(node, () => this.pressRowFor(kind), { cooldown: 250 });
      this.board.addChild(node);
      return node;
    });
    const cart = cartArt(150);
    cart.position.set(l.lane.x + l.lane.w * 0.5, l.lane.y + l.lane.h - 12);
    this.board.addChild(cart);
    this.cartNode = cart;
    this.redrawRows();
    this.redrawStore(false);
    // The waiting good is on the cart (its arrival already shown, or shown when the walk ends).
    const good = waiting(this.tablet);
    if (good && !this.busy) this.placeGood(good);
  }

  // ——— Redrawing from the model ———

  private sheepSlot(i: number): Pt {
    const lane = this.layoutNow!.lane;
    const b = this.brief as { sheep: number; gate: 'left' | 'right' };
    const spacing = Math.min(150, (lane.w - 160) / Math.max(1, b.sheep - 1));
    const start = b.gate === 'left' ? lane.x + lane.w - 90 : lane.x + 90;
    const dir = b.gate === 'left' ? -1 : 1;
    return { x: start + dir * spacing * i, y: lane.y + lane.h - 18 };
  }

  private redrawJar() {
    const j = this.jarNode;
    const l = this.layoutNow;
    if (!j || !l?.jar || !this.pen) return;
    const art = j.children[0] as Graphics;
    const glowing = this.idle >= IDLE_GLOW && this.pen.tokens < this.pen.arrived && !this.pen.walking;
    const ready = readyToTip(this.pen);
    art.destroy();
    j.addChildAt(jarArt(l.jar.w, l.jar.h, glowing || ready), 0);
  }

  private tokenInJar(i: number): Container {
    const t = tokenArt(26);
    const r = this.layoutNow!.jar!;
    const j = this.jarNode!;
    t.position.set(j.x + ((i % 3) - 1) * 36, j.y - r.h * 0.35 - Math.floor(i / 3) * 22);
    this.board.addChild(t);
    return t;
  }

  private redrawBall() {
    const ball = this.ballNode;
    const l = this.layoutNow;
    if (!ball || !l?.ball) return;
    const e = this.envelope;
    const open = this.opened || this.peekLeft > 0;
    if (ball.children[0] && !this.cellNodes.includes(ball.children[0] as Container)) ball.children[0].destroy();
    ball.addChildAt(ballArt(l.ball.w, l.ball.h, open), 0);
    const h = e.glowing ? hintFor(e) : null;
    this.cellNodes.forEach((node, i) => {
      for (const c of node.removeChildren()) c.destroy({ children: true });
      node.addChild(cellArt(CELL, e.marks[i], h?.cell === i));
      node.alpha = this.peekLeft > 0 ? 0.3 : 1;
    });
    for (const t of this.insideNodes) t.visible = open;
  }

  private redrawRows() {
    const l = this.layoutNow;
    if (!l?.rows) return;
    const t = this.tablet;
    KINDS.forEach((kind, i) => {
      const node = this.rowNodes[i];
      const r = l.rows![i];
      for (const c of node.removeChildren()) c.destroy({ children: true });
      node.addChild(rowArt(r.w, r.h, SIGN, t.rows[kind], ROW_CELLS, CELL * 0.8));
      const sign = signArt(kind, SIGN - 10, this.glowRow() === kind);
      sign.position.set(-r.w / 2 + SIGN / 2 + 4, 0);
      node.addChild(sign);
      this.signNodes[i] = sign;
    });
  }

  /** The row whose heading glows: the waiting good's, for the rest of a tablet that has had its hint. */
  private glowRow(): Kind | null {
    const t = this.tablet;
    return t && t.hinted ? waiting(t) : null;
  }

  private redrawStore(open: boolean) {
    const s = this.storeNode;
    const r = this.layoutNow?.store;
    if (!s || !r) return;
    for (const c of s.removeChildren()) c.destroy();
    s.addChild(storeArt(r.w, r.h, open));
  }

  /** The good waits on the cart, shown large. */
  private placeGood(kind: Kind) {
    this.goodNode?.destroy({ children: true });
    const g = goodArt(kind, 110);
    const cart = this.cartNode!;
    g.position.set(cart.x, cart.y - 150);
    this.board.addChild(g);
    this.goodNode = g;
  }

  /** The centre of a row's next empty cell. */
  private cellAt(kind: Kind, index: number): Pt {
    const i = KINDS.indexOf(kind);
    const r = this.layoutNow!.rows![i];
    const x0 = r.x + SIGN + 6;
    const step = (r.w - SIGN - 12) / ROW_CELLS;
    return { x: x0 + step * (Math.min(index, ROW_CELLS - 1) + 0.5), y: r.y + r.h / 2 };
  }

  // ——— The round's beginning ———

  private async begin() {
    if (this.brief.id === 'tokens') { void this.walkNext(); return; }
    if (this.brief.id === 'envelope') { void this.fillEnvelope(); return; }
    if (this.brief.id === 'tens' || this.brief.id === 'check') return;
    void this.arrival();
  }

  // ——— Level 1: one token each ———

  /** The walking sheep comes along the path into its slot. */
  private async walkNext() {
    const p = this.pen;
    const l = this.layoutNow;
    const b = this.brief;
    if (!p || !p.walking || !l || b.id !== 'tokens') return;
    const epoch = this.epoch;
    this.busy = true;
    const i = p.arrived;
    const s = sheepArt(b.colors[i], 110);
    const slot = this.sheepSlot(i);
    const from = b.gate === 'left' ? l.lane.x - 80 : l.lane.x + l.lane.w + 80;
    s.position.set(from, slot.y);
    s.scale.x = b.gate === 'left' ? 1 : -1;
    this.board.addChild(s);
    this.sheepNodes[i] = s;
    await this.ctx.tw.to(s.position, { x: slot.x }, { duration: this.walkSeconds, ease: ease.inOutSine });
    if (!this.live(epoch)) return;
    s.scale.x = 1;
    sfx.pop(9);
    this.pen = arrive(this.pen!);
    this.busy = false;
    this.idle = 0;
    if (this.relayout) this.build();
  }

  tapJar() {
    const p = this.pen;
    const j = this.jarNode;
    if (!p || !j || this.finished) return;
    this.idle = 0;
    // Touch-down feedback before any rule.
    j.scale.set(1.06, 0.92);
    void this.ctx.tw.to(j.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    if (this.busy) { sfx.pop(5); return; }
    const { state, result } = tapJar(p);
    this.pen = state;
    if (result === 'token') {
      const n = state.tokens;
      sfx.marimba(2 + n, 0.4);
      const t = this.tokenInJar(n - 1);
      this.tokenNodes.push(t);
      const y = t.y;
      t.y = y - 120;
      void this.ctx.tw.to(t.position, { y }, { duration: 0.3, ease: ease.inQuad });
      if (this.firstToken) { this.firstToken = false; void this.ctx.say('rt.token-in'); }
      this.redrawJar();
      if (state.walking) void this.walkNext();
      else if (readyToTip(state)) void this.ctx.say('rt.tip');
      return;
    }
    if (result === 'tip') { void this.tip(); return; }
    // A wobble: nothing changes.
    sfx.pop(4);
    void this.ctx.tw.to(j, { rotation: 0.08 }, { duration: 0.1 }).then(() => this.ctx.tw.to(j, { rotation: 0 }, { duration: 0.2, ease: ease.outElastic }));
    const last = this.tokenNodes.at(-1);
    if (last) {
      const y = last.y;
      void this.ctx.tw.to(last.position, { y: y - 40 }, { duration: 0.12 }).then(() => this.ctx.tw.to(last.position, { y }, { duration: 0.2, ease: ease.inQuad }));
    }
    void this.ctx.say(readyToTip(state) ? 'rt.tip' : 'rt.already');
  }

  /** The jar tips: the tokens roll out and line up under the sheep, one to one, and the pet counts both. */
  private async tip() {
    const j = this.jarNode;
    const p = this.pen;
    if (!j || !p) return;
    const epoch = this.epoch;
    this.busy = true;
    this.redrawJar();
    sfx.whoosh();
    await this.ctx.tw.to(j, { rotation: -0.9 }, { duration: 0.5, ease: ease.outBack });
    if (!this.live(epoch)) return;
    const l = this.layoutNow!;
    for (let i = 0; i < p.sheep; i++) {
      const t = this.tokenNodes[i];
      const slot = this.sheepSlot(i);
      void this.ctx.tw.to(t.position, { x: slot.x, y: l.lineup.y + 40 }, { duration: 0.5, delay: i * 0.12, ease: ease.outQuad });
    }
    await this.ctx.tw.wait(0.6 + p.sheep * 0.12);
    if (!this.live(epoch)) return;
    for (let i = 0; i < p.sheep; i++) {
      const t = this.tokenNodes[i];
      const s = this.sheepNodes[i];
      t.scale.set(1.3);
      void this.ctx.tw.to(t.scale, { x: 1, y: 1 }, { duration: 0.3 });
      s.scale.set(1.1);
      void this.ctx.tw.to(s.scale, { x: 1, y: 1 }, { duration: 0.3 });
      sfx.marimba(4 + i, 0.4);
      await this.ctx.say(`rt.count.${i + 1}` as LineId);
      if (!this.live(epoch)) return;
    }
    await this.ctx.say('rt.tip-count', { count: word(p.sheep), lower: word(p.sheep).toLowerCase() });
    if (!this.live(epoch)) return;
    this.celebrate();
  }

  // ——— Level 2: marks on the envelope ———

  /** The tokens drop into the open ball one by one, then it closes. */
  private async fillEnvelope() {
    const ball = this.ballNode;
    const l = this.layoutNow;
    if (!ball || !l?.ball) return;
    const epoch = this.epoch;
    this.busy = true;
    this.peeked = false;
    this.filled = false;
    this.opened = true;
    this.redrawBall();
    const e = this.envelope;
    for (let i = 0; i < e.tokens; i++) {
      const t = tokenArt(24);
      const to = this.insideAt(i);
      t.position.set(this.jarNode!.x, this.jarNode!.y - 110);
      this.board.addChildAt(t, this.board.getChildIndex(ball));
      this.insideNodes.push(t);
      sfx.marimba(2 + i, 0.35);
      await this.ctx.tw.to(t.position, { x: to.x, y: to.y }, { duration: this.ctx.demo ? 0.25 : 0.45, ease: ease.inOutSine });
      if (!this.live(epoch)) return;
    }
    await this.ctx.tw.wait(this.ctx.demo ? 0.3 : 0.7);
    if (!this.live(epoch)) return;
    this.opened = false;
    this.filled = true;
    this.busy = false;
    for (const t of this.insideNodes) t.visible = false;
    this.redrawBall();
    sfx.squish();
    if (this.relayout) this.build();
  }

  /** Where a token sits inside the ball (a loose heap, so counting them is the point of the marks). */
  private insideAt(i: number): Pt {
    const b = this.ballNode!;
    return { x: b.x - 90 + (i % 3) * 70 + (Math.floor(i / 3) % 2) * 20, y: b.y + 40 - Math.floor(i / 3) * 44 };
  }

  pressCell(i: number) {
    if (this.finished || this.busy) return;
    const node = this.cellNodes[i];
    node.scale.set(0.92);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack });
    const before = markCount(this.envelope);
    this.envelopes[this.envelopeIndex] = press(this.envelope, i);
    const after = markCount(this.envelope);
    if (after > before) sfx.marimba(1 + after, 0.35); else sfx.pop(5);
    this.redrawBall();
  }

  /** Tapping the ball shows the tokens inside for a moment; never counted. */
  peek() {
    if (this.finished || this.busy) return;
    this.peekLeft = this.ctx.demo ? 1 : PEEK_SECONDS;
    if (!this.peeked) { this.peeked = true; void this.ctx.say('rt.peek'); }
    sfx.pop(8);
    this.redrawBall();
  }

  /** Crack is the one commit: the ball splits and the tokens line up under the marks. */
  private async crack() {
    if (this.finished || this.busy || !this.crackNode) return;
    const epoch = this.epoch;
    this.busy = true;
    this.peekLeft = 0;
    const c = this.crackNode;
    c.scale.set(0.9);
    void this.ctx.tw.to(c.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    const { state, crack } = crackEnvelope(this.envelope);
    this.envelopes[this.envelopeIndex] = state;
    sfx.clunk();
    this.opened = true;
    this.redrawBall();
    for (const t of this.insideNodes) t.visible = true;
    // The marks in reading order along the lineup, the tokens under them.
    const l = this.layoutNow!;
    const n = Math.max(crack.marks, crack.tokens);
    const spacing = Math.min(100, (l.lineup.w - 60) / Math.max(1, n - 1));
    const x0 = l.lineup.x + l.lineup.w / 2 - spacing * (n - 1) / 2;
    for (let i = 0; i < crack.marks; i++) {
      const m = wedgeArt(40);
      m.position.set(x0 + i * spacing, l.lineup.y + 26);
      this.lineupLayer.addChild(m);
    }
    this.insideNodes.forEach((t, i) => {
      void this.ctx.tw.to(t.position, { x: x0 + i * spacing, y: l.lineup.y + 80 }, { duration: 0.45, delay: i * 0.1, ease: ease.outQuad });
    });
    await this.ctx.tw.wait(0.6 + crack.tokens * 0.1);
    if (!this.live(epoch)) return;
    if (crack.verdict === 'match') {
      sfx.sparkle();
      await this.ctx.say('rt.match', { count: word(crack.marks), lower: word(crack.marks).toLowerCase() });
      if (!this.live(epoch)) return;
      if (this.envelopeIndex + 1 >= this.envelopes.length) { this.celebrate(); return; }
      this.envelopeIndex++;
      this.clearLineup();
      this.build();
      void this.ctx.say('rt.next-envelope');
      void this.fillEnvelope();
      return;
    }
    // The unmatched ones wiggle alone.
    sfx.boing();
    const loners = crack.verdict === 'fewer' ? this.insideNodes.slice(crack.paired) : this.lineupLayer.children.slice(crack.paired);
    for (const t of loners) {
      void this.ctx.tw.to(t, { rotation: 0.3 }, { duration: 0.15 }).then(() => this.ctx.tw.to(t, { rotation: -0.3 }, { duration: 0.3 })).then(() => this.ctx.tw.to(t, { rotation: 0 }, { duration: 0.15 }));
    }
    const vars = { marks: word(crack.marks), tokens: word(crack.tokens).toLowerCase(), diff: word(crack.diff) };
    await this.ctx.say(`rt.${crack.verdict}.${crack.diff === 1 ? 'one' : 'many'}` as LineId, vars);
    if (!this.live(epoch)) return;
    // The ball closes again with her marks kept.
    this.clearLineup();
    this.insideNodes.forEach((t, i) => { const to = this.insideAt(i); t.position.set(to.x, to.y); t.visible = false; });
    this.opened = false;
    this.busy = false;
    this.redrawBall();
    if (state.glowing) void this.ctx.say('rt.glow');
    if (this.relayout) this.build();
  }

  private clearLineup() {
    for (const c of this.lineupLayer.removeChildren()) c.destroy({ children: true });
  }

  // ——— Level 3: which row? ———

  /** The next good arrives on the cart. */
  private async arrival() {
    const cart = this.cartNode;
    const l = this.layoutNow;
    const good = waiting(this.tablet);
    if (!cart || !l || good === null) return;
    const epoch = this.epoch;
    this.busy = true;
    this.placeGood(good);
    const g = this.goodNode!;
    const toX = l.lane.x + l.lane.w * 0.5;
    cart.x = l.lane.x + 60;
    g.x = cart.x;
    sfx.ratchet(3);
    void this.ctx.tw.to(cart.position, { x: toX }, { duration: this.ctx.demo ? 0.4 : 0.9, ease: ease.inOutSine });
    await this.ctx.tw.to(g.position, { x: toX }, { duration: this.ctx.demo ? 0.4 : 0.9, ease: ease.inOutSine });
    if (!this.live(epoch)) return;
    this.busy = false;
    if (this.relayout) this.build();
  }

  pressRowFor(kind: Kind) {
    if (this.finished) return;
    const i = KINDS.indexOf(kind);
    const node = this.rowNodes[i];
    // The row lifts on touch-down, before any rule.
    node.y -= 8;
    void this.ctx.tw.to(node.position, { y: node.y + 8 }, { duration: 0.2, ease: ease.outQuad });
    if (this.busy || waiting(this.tablet) === null) { sfx.pop(5); return; }
    const good = waiting(this.tablet)!;
    const r = pressRow(this.tablet, kind);
    this.tablets[this.tabletIndex] = r.state;
    if (r.accepted) { void this.landMark(kind, false); return; }
    if (r.moved) { void this.landMark(good, true); return; }
    void this.bounceMark(kind, good);
  }

  /** A wrong row: the mark bounces back out and the good stays waiting. */
  private async bounceMark(row: Kind, good: Kind) {
    const epoch = this.epoch;
    this.busy = true;
    sfx.boing();
    const at = this.cellAt(row, this.tablet.rows[row]);
    const m = wedgeArt(44);
    m.position.set(at.x, at.y);
    this.board.addChild(m);
    void this.ctx.say(`rt.wrong-row.${good}` as LineId);
    await this.ctx.tw.to(m.position, { y: at.y - 90 }, { duration: 0.25, ease: ease.outQuad });
    if (!this.live(epoch)) { m.destroy(); return; }
    await this.ctx.tw.to(m, { alpha: 0 }, { duration: 0.2 });
    m.destroy();
    if (!this.live(epoch)) return;
    this.busy = false;
    if (this.relayout) this.build();
  }

  /** The mark lands in the right row's next cell and the good rolls into the storehouse; `moved` when the pet did it. */
  private async landMark(row: Kind, moved: boolean) {
    const epoch = this.epoch;
    this.busy = true;
    const l = this.layoutNow!;
    const index = this.tablet.rows[row] - 1;
    const to = this.cellAt(row, index);
    const m = wedgeArt(44);
    const g = this.goodNode;
    m.position.set(g ? g.x : to.x, g ? g.y - 40 : to.y - 100);
    this.board.addChild(m);
    if (moved) { void this.ctx.say('rt.moved'); this.redrawRows(); }
    await this.ctx.tw.to(m.position, { x: to.x, y: to.y }, { duration: moved ? 0.7 : 0.35, ease: ease.inOutSine });
    if (!this.live(epoch)) { m.destroy(); return; }
    m.destroy();
    sfx.squish();
    this.redrawRows();
    if (g) {
      const s = l.store!;
      await this.ctx.tw.to(g.position, { x: s.x + s.w / 2, y: s.y + s.h - 100 }, { duration: 0.45, ease: ease.inQuad });
      if (!this.live(epoch)) return;
      g.destroy({ children: true });
      this.goodNode = null;
      sfx.tick();
    }
    if (waiting(this.tablet) !== null) {
      this.busy = false;
      void this.arrival();
      return;
    }
    void this.readBackTablet();
  }

  /** The storehouse opens and the goods line up under their rows while the pet reads the tablet. */
  private async readBackTablet() {
    const epoch = this.epoch;
    this.busy = true;
    const l = this.layoutNow!;
    this.redrawStore(true);
    const counts = readBack(this.tablet.delivery);
    const s = l.store!;
    sfx.whoosh();
    let shown = 0;
    for (const kind of KINDS) {
      for (let i = 0; i < counts[kind]; i++) {
        const g = goodArt(kind, 70);
        g.position.set(s.x + s.w / 2, s.y + s.h - 70);
        const cell = this.cellAt(kind, i);
        this.lineupLayer.addChild(g);
        void this.ctx.tw.to(g.position, { x: cell.x, y: l.lineup.y + (kind === 'sheep' ? 0 : 50) }, { duration: 0.5, delay: shown * 0.1, ease: ease.outQuad });
        shown++;
      }
    }
    await this.ctx.tw.wait(0.6 + shown * 0.1);
    if (!this.live(epoch)) return;
    await this.ctx.say('rt.read-back', { sheep: word(counts.sheep), sheepLower: word(counts.sheep).toLowerCase(), jars: word(counts.jar), jarsLower: word(counts.jar).toLowerCase() });
    if (!this.live(epoch)) return;
    if (this.tabletIndex + 1 >= this.tablets.length) { this.celebrate(); return; }
    this.tabletIndex++;
    this.clearLineup();
    this.build();
    void this.ctx.say('rt.next-tablet');
    void this.arrival();
  }

  // ——— Levels 4–5: the yard and the tablet ———

  get tensNow(): TensState {
    return this.tens[this.cartIndex];
  }

  get check(): CheckState {
    return this.checks[this.cartIndex];
  }

  /** The cart in the yard: level 4's brief, or the cart that came at level 5. */
  private get cart(): Cart {
    if (this.brief.id === 'tens') return this.brief.carts[this.cartIndex];
    return cartOf(this.check.c);
  }

  /** Where each loose basket stands: level 4's seeded scatter, or one seeded by the delivery at level 5. */
  private get scatter(): number[] {
    if (this.brief.id === 'tens') return this.brief.scatter[this.cartIndex];
    const c = this.check;
    return scatterFor(this.cart.loose, new Rng(c.t * 41 + c.c));
  }

  /** What the tablet says now: her marks at level 4, the farm's at level 5. */
  private get reading(): Reading {
    return this.brief.id === 'tens' ? this.tensNow : shortest(this.check.t);
  }

  private buildYard(l: TabletLayout) {
    const yard = new Container();
    yard.position.set(l.lane.x, l.lane.y);
    yard.addChild(yardArt(l.lane.w, l.lane.h));
    yard.hitArea = new Rectangle(0, 0, l.lane.w, l.lane.h);
    onTap(yard, () => this.countYard(), { cooldown: 300 });
    this.board.addChild(yard);
    this.yardNode = yard;
    const cart = this.cart;
    this.crateNodes = l.crates!.slice(0, cart.crates).map((r, i) => {
      const node = new Container();
      // The crate stands on the yard's ground; opened, its ten baskets show above it.
      node.position.set(r.x + r.w / 2 - l.lane.x, r.y + r.h - l.lane.y);
      node.addChild(crateArt(r.w - 10, r.h - 40, this.openCrate === i));
      node.hitArea = new Rectangle(-r.w / 2, -r.h, r.w, r.h);
      onTap(node, (e) => { e.stopPropagation(); void this.openCrateAt(i); }, { cooldown: 300 });
      yard.addChild(node);
      return node;
    });
    const b = l.baskets!;
    this.basketNodes = this.scatter.map((slot) => {
      const col = slot % SCATTER_COLS;
      const row = Math.floor(slot / SCATTER_COLS);
      const jitter = ((slot * 37) % 9) - 4;
      const g = basketArt(Math.min(40, b.w / SCATTER_COLS - 4));
      g.position.set(b.x - l.lane.x + (col + 0.5) * (b.w / SCATTER_COLS) + jitter, b.y - l.lane.y + (row + 1) * (b.h / SCATTER_ROWS) - 6 + jitter / 2);
      yard.addChild(g);
      return g;
    });
  }

  private buildTablet(l: TabletLayout) {
    const t = l.tablet!;
    const tablet = new Container();
    tablet.position.set(t.x, t.y);
    tablet.addChild(tabletArt(t.w, t.h, l.strips![0].y - t.y - 8));
    tablet.hitArea = new Rectangle(0, 0, t.w, t.h);
    onTap(tablet, () => this.readTablet(), { cooldown: 400 });
    this.board.addChild(tablet);
    this.tabletNode = tablet;
    const tens = this.brief.id === 'tens';
    this.stripNodes = (['ten', 'one'] as Mark[]).map((mark, i) => {
      const r = l.strips![i];
      const node = new Container();
      node.position.set(r.x - t.x, r.y - t.y);
      if (tens) {
        node.hitArea = new Rectangle(0, 0, r.w, r.h);
        onTap(node, (e) => { e.stopPropagation(); this.liftMark(mark); }, { cooldown: 150 });
      } else node.eventMode = 'none';
      tablet.addChild(node);
      return node;
    });
    if (tens) {
      this.stampNodes = (['ten', 'one'] as Mark[]).map((mark, i) => {
        const r = l.stamps![i];
        const node = new Container();
        node.position.copyFrom(centre(r));
        node.addChild(stampArt(r.w, r.h, mark));
        node.hitArea = new Rectangle(-r.w / 2 - 6, -r.h / 2 - 6, r.w + 12, r.h + 12);
        onTap(node, () => this.pressStamp(mark), { cooldown: 150 });
        this.board.addChild(node);
        return node;
      });
      const h = l.handIn!;
      const hand = new Container();
      hand.position.copyFrom(centre(h));
      hand.addChild(handInArt(h.w, h.h));
      hand.hitArea = new Rectangle(-h.w / 2 - 8, -h.h / 2 - 8, h.w + 16, h.h + 16);
      onTap(hand, () => void this.handInTablet(), { cooldown: 400 });
      this.board.addChild(hand);
      this.handInNode = hand;
    } else {
      this.verdictNodes = CART_VERDICTS.map((v, i) => {
        const r = l.verdicts![i];
        const node = new Container();
        node.position.copyFrom(centre(r));
        node.hitArea = new Rectangle(-r.w / 2 - 6, -r.h / 2 - 6, r.w + 12, r.h + 12);
        onTap(node, () => void this.pickVerdict(v), { cooldown: 300 });
        this.board.addChild(node);
        return node;
      });
      this.numberNodes = [1, 2, 3].map((n, i) => {
        const r = l.numbers![i];
        const node = new Container();
        node.position.copyFrom(centre(r));
        node.addChild(numberArt(n, r.w));
        node.hitArea = new Rectangle(-r.w / 2 - 4, -r.h / 2 - 4, r.w + 8, r.h + 8);
        onTap(node, () => void this.pickNumber(n), { cooldown: 300 });
        this.board.addChild(node);
        return node;
      });
    }
    this.redrawTablet();
  }

  /** The strips from the model; at level 5 the verdicts show which is chosen and the numbers only while short or extra is open. */
  private redrawTablet() {
    const l = this.layoutNow;
    if (!l?.strips) return;
    const r = this.reading;
    (['ten', 'one'] as Mark[]).forEach((mark, i) => {
      const node = this.stripNodes[i];
      if (!node) return;
      for (const c of node.removeChildren()) c.destroy({ children: true });
      node.addChild(stripArt(l.strips![i].w, l.strips![i].h, mark, mark === 'ten' ? r.tens : r.ones));
    });
    if (this.brief.id !== 'check') return;
    const c = this.check;
    this.verdictNodes.forEach((node, i) => {
      for (const ch of node.removeChildren()) ch.destroy({ children: true });
      node.addChild(verdictArt(CART_VERDICTS[i], l.verdicts![i].w, c.open === CART_VERDICTS[i]));
    });
    // The numbers stand beside the open verdict.
    const open = c.open ? CART_VERDICTS.indexOf(c.open) : -1;
    this.numberNodes.forEach((node, i) => {
      node.visible = open >= 0;
      node.eventMode = open >= 0 ? 'static' : 'none';
      const at = l.numbers![i];
      node.position.set(at.x + at.w / 2, at.y + at.h / 2);
      if (open >= 0) node.alpha = 1;
    });
  }

  /** The rect the level-4 glow rings: the next step toward the fewest marks. */
  private tensGlowRect(): Rect | null {
    const l = this.layoutNow;
    if (!l?.strips) return null;
    const h = tensHint(this.tensNow);
    if (h === 'handIn') return l.handIn!;
    if (h === 'liftTen') return l.strips[0];
    if (h === 'liftOne') return l.strips[1];
    return l.stamps![h === 'stampTen' ? 0 : 1];
  }

  private tensTarget(h: ReturnType<typeof tensHint>): Container {
    if (h === 'handIn') return this.handInNode!;
    if (h === 'liftTen') return this.stripNodes[0];
    if (h === 'liftOne') return this.stripNodes[1];
    return this.stampNodes[h === 'stampTen' ? 0 : 1];
  }

  /** The ghost finger's spot for a step: strips are drawn from their top-left, so it aims at their middle. */
  private tensSpot(h: ReturnType<typeof tensHint>) {
    const on = this.tensTarget(h);
    const strip = h === 'liftTen' ? this.layoutNow!.strips![0] : h === 'liftOne' ? this.layoutNow!.strips![1] : null;
    return strip ? { on, x: strip.w / 2, y: strip.h / 2 } : { on };
  }

  /** Tapping the tablet's face reads it aloud; never counted. */
  readTablet() {
    if (this.finished || this.busy || !this.tabletNode) return;
    const r = this.reading;
    sfx.pop(7);
    void this.ctx.say('rt.read-tablet', { tens: r.tens, ones: r.ones, n: value(r) });
  }

  /** Tapping a crate opens it for a moment and counts its ten; never counted. */
  private async openCrateAt(i: number) {
    if (this.finished || this.busy) return;
    // Only this crate's art changes, so nothing else on the board (and no running commit) is rebuilt.
    const node = this.crateNodes[i];
    this.openCrate = i;
    this.redrawCrate(node, true);
    sfx.pop(8);
    await this.ctx.say('rt.crate-ten');
    await this.ctx.tw.wait(this.ctx.demo ? 0.3 : 0.8);
    if (!this.alive || this.openCrate !== i) return;
    this.openCrate = -1;
    // A rebuild meanwhile made a new node for this crate; close whichever stands there now.
    const now = this.crateNodes[i];
    if (now) this.redrawCrate(now, false);
  }

  private redrawCrate(node: Container, open: boolean) {
    const r = this.layoutNow?.crates?.[0];
    if (!r || node.destroyed) return;
    for (const c of node.removeChildren()) c.destroy({ children: true });
    node.addChild(crateArt(r.w - 10, r.h - 40, open));
  }

  /** Level 4: tapping the yard makes the pet count it, crates by tens then each loose basket with a bounce; never counted. */
  private async countYard() {
    if (this.finished || this.busy || this.brief.id !== 'tens') return;
    const epoch = this.epoch;
    this.busy = true;
    this.yardCounted = true;
    let n = 0;
    const bounce = (node: Container) => {
      const y = node.y;
      void this.ctx.tw.to(node.position, { y: y - 16 }, { duration: 0.12 }).then(() => this.ctx.tw.to(node.position, { y }, { duration: 0.18, ease: ease.inQuad }));
    };
    for (const crate of this.crateNodes) {
      n += 10;
      bounce(crate);
      sfx.marimba(2, 0.4);
      await this.ctx.say('rt.number', { n });
      if (!this.live(epoch)) return;
    }
    for (const basket of this.basketNodes) {
      n += 1;
      bounce(basket);
      sfx.marimba(4 + (n % 5), 0.3);
      await this.ctx.say('rt.number', { n });
      if (!this.live(epoch)) return;
    }
    await this.ctx.say('rt.yard-count', { n });
    if (!this.live(epoch)) return;
    this.busy = false;
    if (this.relayout) this.build();
  }

  pressStamp(mark: Mark) {
    if (this.finished || this.busy || this.brief.id !== 'tens') return;
    const node = this.stampNodes[mark === 'ten' ? 0 : 1];
    node.scale.set(0.9);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack });
    const { state, capped } = stamp(this.tensNow, mark);
    if (capped) {
      sfx.pop(3);
      void this.ctx.tw.to(node, { rotation: 0.12 }, { duration: 0.08 }).then(() => this.ctx.tw.to(node, { rotation: 0 }, { duration: 0.25, ease: ease.outElastic }));
      return;
    }
    this.tens[this.cartIndex] = state;
    // A low thup for a ten, a high one for a one.
    sfx.marimba(mark === 'ten' ? 0 : 7, 0.4);
    this.redrawTablet();
  }

  liftMark(mark: Mark) {
    if (this.finished || this.busy || this.brief.id !== 'tens') return;
    const before = this.tensNow;
    this.tens[this.cartIndex] = lift(before, mark);
    sfx.pop(5);
    this.redrawTablet();
  }

  /** Hand in is level 4's one commit: the goods line up under the marks while the pet reads both. */
  private async handInTablet() {
    if (this.finished || this.busy || this.brief.id !== 'tens' || !this.handInNode) return;
    const epoch = this.epoch;
    this.busy = true;
    const node = this.handInNode;
    node.scale.set(0.9);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    const hers: Reading = { tens: this.tensNow.tens, ones: this.tensNow.ones };
    const { state, result } = handIn(this.tensNow);
    this.tens[this.cartIndex] = state;
    sfx.clunk();
    const n = state.n;
    if (result === 'longer') {
      // Right as it is; then ten small marks slide together into one big mark.
      sfx.sparkle();
      await this.ctx.say('rt.tens.longer', { n });
      if (!this.live(epoch)) return;
      this.redrawTablet();
      sfx.whoosh();
      await this.ctx.say('rt.tens.shorter-way');
      if (!this.live(epoch)) return;
    }
    const mismatched = this.drawLineup(result === 'wrong' ? hers : state, this.cart, false);
    await this.ctx.tw.wait(0.7);
    if (!this.live(epoch)) return;
    if (result !== 'wrong') {
      sfx.sparkle();
      await this.ctx.say('rt.tens.match', { tens: state.tens, ones: state.ones, n });
      if (!this.live(epoch)) return;
      void this.nextCart(this.tens.length);
      return;
    }
    sfx.boing();
    for (const t of mismatched) {
      void this.ctx.tw.to(t, { rotation: 0.3 }, { duration: 0.15 }).then(() => this.ctx.tw.to(t, { rotation: -0.3 }, { duration: 0.3 })).then(() => this.ctx.tw.to(t, { rotation: 0 }, { duration: 0.15 }));
    }
    await this.ctx.say('rt.tens.wrong', { says: value(hers), n });
    if (!this.live(epoch)) return;
    // The tablet comes back with her marks kept.
    this.clearLineup();
    this.busy = false;
    if (state.glowing) void this.ctx.say('rt.tens.help');
    if (this.relayout) this.build();
  }

  /** Level 5: a verdict button says its name; Right commits, short and extra open the numbers. */
  private async pickVerdict(v: CartVerdict) {
    if (this.finished || this.busy || this.brief.id !== 'check') return;
    const node = this.verdictNodes[CART_VERDICTS.indexOf(v)];
    node.scale.set(0.9);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack });
    void this.ctx.say(`rt.verdict.${v}` as LineId);
    const r = chooseVerdict(this.check, v);
    this.checks[this.cartIndex] = r.state;
    if (r.result === 'none') { sfx.pop(7); this.redrawTablet(); return; }
    await this.settleCheck(r.result === 'right');
  }

  private async pickNumber(n: number) {
    if (this.finished || this.busy || this.brief.id !== 'check' || !this.check.open) return;
    const node = this.numberNodes[n - 1];
    node.scale.set(0.9);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack });
    const r = chooseNumber(this.check, n);
    this.checks[this.cartIndex] = r.state;
    await this.settleCheck(r.result === 'right');
  }

  private async settleCheck(right: boolean) {
    const epoch = this.epoch;
    this.busy = true;
    this.redrawTablet();
    const c = this.check;
    if (right) {
      this.drawLineup(shortest(c.t), cartOf(c.c), false);
      await this.ctx.tw.wait(0.7);
      if (!this.live(epoch)) return;
      sfx.sparkle();
      const want = verdictFor(c.t, c.c);
      await this.ctx.say(want.verdict === 'right' ? 'rt.check.right.same' : `rt.check.right.${want.verdict}` as LineId, { t: c.t, c: c.c, by: want.by });
      if (!this.live(epoch)) return;
      void this.nextCart(this.checks.length);
      return;
    }
    sfx.boing();
    await this.ctx.say('rt.check.wrong', { t: c.t });
    if (!this.live(epoch)) return;
    if (c.lined) {
      // The lineup plays and holds while she answers again.
      this.drawLineup(shortest(c.t), cartOf(c.c), true);
      await this.ctx.say('rt.check.help');
      if (!this.live(epoch)) return;
    }
    this.busy = false;
    if (this.relayout) this.build();
  }

  /** The next cart rolls into the yard, or the round is done. */
  private async nextCart(count: number) {
    if (this.cartIndex + 1 >= count) { this.celebrate(); return; }
    this.cartIndex++;
    this.yardCounted = false;
    this.openCrate = -1;
    this.clearLineup();
    this.busy = false;
    this.build();
    sfx.ratchet(3);
    void this.ctx.say('rt.next-cart');
  }

  /**
   * The goods under the marks: each ten-mark over a crate (or its loose baskets, with empty places), each small mark over a
   * basket or an empty place, then any extra baskets. `glow` lights what does not match. Returns the mismatched pieces.
   */
  private drawLineup(r: Reading, cart: Cart, glow: boolean): Container[] {
    this.clearLineup();
    const l = this.layoutNow;
    if (!l) return [];
    const area = l.lineup;
    const lu = lineUp(r, cart);
    const TEN = 2.4;
    const units = lu.tens.length * TEN + lu.ones.length + (lu.extra > 0 ? lu.extra + 0.6 : 0);
    const step = Math.min(46, (area.w - 20) / Math.max(1, units));
    const odd: Container[] = [];
    const lit = (c: Container) => {
      if (glow) {
        const g = new Graphics().circle(0, -step * 0.35, step * 0.55).fill({ color: swatch.yellow.fill, alpha: 0.6 });
        c.addChildAt(g, 0);
      }
      odd.push(c);
    };
    let x = area.x + 10;
    const markY = area.y + 22;
    const goodsY = area.y + area.h - 8;
    for (const t of lu.tens) {
      const w = step * TEN;
      const m = tenWedgeArt(Math.min(44, w * 0.7));
      m.position.set(x + w / 2, markY);
      this.lineupLayer.addChild(m);
      if (t.crate) {
        const crate = crateArt(w - 6, Math.min(50, step * 1.2));
        crate.position.set(x + w / 2, goodsY);
        this.lineupLayer.addChild(crate);
      } else {
        // Ten places in a 5 × 2 block, filled with what loose baskets there are.
        for (let i = 0; i < 10; i++) {
          const px = x + (i % 5 + 0.5) * (w / 5);
          const py = goodsY - (i < 5 ? 0 : step * 0.5);
          const c = new Container();
          c.position.set(px, py);
          if (i < t.filled) c.addChild(basketArt(w / 5 - 2));
          else { c.addChild(new Graphics().circle(0, -w / 14, w / 14).stroke({ width: 3, color: ink })); lit(c); }
          this.lineupLayer.addChild(c);
        }
      }
      x += w;
    }
    for (const filled of lu.ones) {
      const m = wedgeArt(Math.min(28, step * 0.7));
      m.position.set(x + step / 2, markY);
      this.lineupLayer.addChild(m);
      const c = new Container();
      c.position.set(x + step / 2, goodsY);
      if (filled) c.addChild(basketArt(step * 0.85));
      else { c.addChild(new Graphics().circle(0, -step * 0.3, step * 0.3).stroke({ width: 3, color: ink })); lit(c); }
      this.lineupLayer.addChild(c);
      x += step;
    }
    x += step * 0.6;
    for (let i = 0; i < lu.extra; i++) {
      const c = new Container();
      c.position.set(x + step / 2, goodsY);
      c.addChild(basketArt(step * 0.85));
      lit(c);
      this.lineupLayer.addChild(c);
      x += step;
    }
    for (const c of this.lineupLayer.children) {
      c.scale.set(0.4);
      void this.ctx.tw.to(c.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
    }
    return odd;
  }

  // ——— Finishing and help ———

  private celebrate() {
    if (this.finished) return;
    this.busy = true;
    sfx.tada();
    this.ctx.pet.cheer();
    const l = this.layoutNow;
    if (l) this.ctx.particles.burst(l.lineup.x + l.lineup.w / 2, l.lineup.y + 40, { colors: [swatch.yellow.fill, swatch.orange.fill, 0xffffff], count: 14 });
    const result = this.tally;
    void this.ctx.say('rt.done').then(() => {
      if (!this.alive || this.finished) return;
      this.finished = true;
      this.ctx.finish(result);
    });
  }

  hintLabel = 'Help';

  /** The pet's Help: at level 1 the ask again (free); at levels 2–3 the glow, the part's one hint if not yet spent. */
  askForHint() {
    if (this.finished) return;
    if (this.brief.id === 'tokens') { void this.ctx.instruct('rt.instruct.1'); return; }
    if (this.busy) return;
    if (this.brief.id === 'envelope') {
      this.envelopes[this.envelopeIndex] = askEnvelope(this.envelope);
      this.redrawBall();
      void this.ctx.say(markCount(this.envelope) === this.envelope.tokens ? 'rt.help.crack' : 'rt.help.cell');
      return;
    }
    if (this.brief.id === 'tens') {
      if (this.tensNow.done) return;
      this.tens[this.cartIndex] = askTens(this.tensNow);
      void this.ctx.say('rt.tens.help');
      return;
    }
    if (this.brief.id === 'check') {
      if (this.check.done) return;
      this.checks[this.cartIndex] = askCheck(this.check);
      this.drawLineup(shortest(this.check.t), cartOf(this.check.c), true);
      void this.ctx.say('rt.check.help');
      return;
    }
    this.tablets[this.tabletIndex] = askTablet(this.tablet);
    this.redrawRows();
    const good = waiting(this.tablet);
    if (good) void this.ctx.say(`rt.help.${good}` as LineId);
  }

  update(dt: number) {
    this.clock += dt;
    if (this.relayout && !this.busy && !this.finished) this.build();
    if (this.brief.id === 'tokens' && this.pen && !this.busy && !this.finished) {
      const was = this.idle >= IDLE_GLOW;
      this.idle += dt;
      if (!was && this.idle >= IDLE_GLOW) this.redrawJar();
    }
    if (this.peekLeft > 0) {
      this.peekLeft -= dt;
      if (this.peekLeft <= 0) { this.peekLeft = 0; this.redrawBall(); }
    }
    this.glow.clear();
    if (this.finished || !this.layoutNow) return;
    const r = 1 + 0.05 * Math.sin(this.clock * 5);
    if (this.brief.id === 'envelope' && this.envelope.glowing && !this.busy) {
      const h = hintFor(this.envelope);
      if (h) {
        const c = this.layoutNow.cells![h.cell];
        this.glow.roundRect(c.x - 8 * r, c.y - 8 * r, c.w + 16 * r, c.h + 16 * r, 24).stroke({ width: 8, color: swatch.yellow.fill });
      } else if (this.crackNode) {
        const c = this.layoutNow.crack!;
        this.glow.roundRect(c.x - 10 * r, c.y - 10 * r, c.w + 20 * r, c.h + 20 * r, 30).stroke({ width: 8, color: swatch.yellow.fill });
      }
    }
    if (this.brief.id === 'tens' && this.tensNow.glowing && !this.busy) {
      const c = this.tensGlowRect();
      if (c) this.glow.roundRect(c.x - 10 * r, c.y - 10 * r, c.w + 20 * r, c.h + 20 * r, 28).stroke({ width: 8, color: swatch.yellow.fill });
    }
    const glowRow = this.brief.id === 'rows' ? this.glowRow() : null;
    if (glowRow && !this.busy) {
      const i = KINDS.indexOf(glowRow);
      const row = this.layoutNow.rows![i];
      this.glow.roundRect(row.x - 8 * r, row.y - 8 * r, SIGN + 16 * r, row.h + 16 * r, 24).stroke({ width: 8, color: swatch.yellow.fill });
    }
  }

  /**
   * The ghost finger: the jar for each sheep then the tip; peek, one mark per token, Crack; each good's row; the yard, the
   * stamps toward the fewest marks, Hand in; the cart's verdict, then its number. Never a wrong answer.
   */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy || !this.layoutNow) return null;
    if (this.brief.id === 'tokens') {
      if (!this.pen || this.pen.walking || this.pen.tipped) return null;
      return this.jarNode ? { tap: { on: this.jarNode, y: -this.layoutNow.jar!.h / 2 }, pause: 0.5 } : null;
    }
    if (this.brief.id === 'envelope') {
      const e = this.envelope;
      if (!this.peeked && this.ballNode) return { tap: { on: this.ballNode, y: -this.layoutNow.ball!.h / 2 + 36 }, pause: 1.1 };
      const h = hintFor(e);
      if (h) return { tap: { on: this.cellNodes[h.cell] }, pause: 0.4 };
      return this.crackNode ? { tap: { on: this.crackNode }, pause: 0.5 } : null;
    }
    if (this.brief.id === 'tens') {
      const s = this.tensNow;
      if (s.done) return null;
      if (!this.yardCounted && this.yardNode) return { tap: { on: this.yardNode, x: this.layoutNow.baskets!.x + this.layoutNow.baskets!.w / 2 - this.yardNode.x, y: this.layoutNow.lane.h / 2 }, pause: 0.6 };
      return { tap: this.tensSpot(tensHint(s)), pause: 0.4 };
    }
    if (this.brief.id === 'check') {
      const c = this.check;
      if (c.done) return null;
      const want = verdictFor(c.t, c.c);
      if (want.verdict !== 'right' && c.open === want.verdict) return { tap: { on: this.numberNodes[want.by - 1] }, pause: 0.6 };
      return { tap: { on: this.verdictNodes[CART_VERDICTS.indexOf(want.verdict)] }, pause: 0.9 };
    }
    const good = waiting(this.tablet);
    if (good === null) return null;
    return { tap: { on: this.rowNodes[KINDS.indexOf(good)] }, pause: 0.5 };
  }
}

class TabletIcon extends WigglyIcon {
  constructor() {
    super(iconArt());
  }
}

/** A seeded sticker: a tablet with a sheep row and a jar row filled. */
function sticker(seed: number): Container {
  const rng = new Rng(seed);
  return stickerArt(rng.int(1, 4), rng.int(1, 4), rng.pick(['white', 'brown', 'pink'] as const));
}

export const riverTablets: GameModule = {
  id: 'river-tablets',
  name: 'River Tablets',
  titleLine: 'game.river-tablets',
  region: 'story-grove',
  skills: ['counting', 'one-to-one', 'symbols', 'checking'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'Counter and scribe: one of you counts the goods aloud as they pass, the other presses the marks; swap after each tablet.',
  hubIcon: () => new TabletIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new RiverTablets(ctx),
};
