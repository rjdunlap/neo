import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { FONT } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  BTN_H, BTN_W, CARD_H, CARD_W, claim, COL_W, commitLook, cove, CREATURE, currentStep, fits, glowing, gull, help, layersLayout,
  LENS_R, LOOK_H, LOOK_W, lostRow, makeCase, move, nearestRow, planFor, ROW_H, ROWS, roundState, rowY, SLOT_H, SLOT_W, story, ties,
  type Case, type Claim, type LayersLayout, type Layer, type LookId, type Picture, type Placement, type Reason, type RoundState, type Story,
} from './logic';

const LEVELS: BandLevels = { school: { min: 1, max: 2 } };

/** Each level's authored first round leads its first round of a session. */
const authoredShown = new Set<number>();

const MUD = 0xa89a86;
const MUD_LINE = 0x7d705f;
const SEA = 0x7cc7ec;
const STRIPE = 0x3b3440;
/** The rock colour of a pictured layer: a twin pair shares it, plain mud never tells. */
const ROCK: Record<Picture, number> = { curl: 0xe2b77a, fan: 0xc9d48f, ribbon: 0xe8c9a6, dot: 0xd4a58a };
const ROCK_LINE = 0x9c7a4f;
const PULSE = 0.9;

/* Art -------------------------------------------------------------------------------------------- */

/** One invented creature as a flat dark-ink symbol about 60 units across, centred on (x, y). */
function drawPicture(g: Graphics, p: Picture, x: number, y: number, s = 1, alpha = 1) {
  const st = { width: 5 * s, color: ink, alpha, cap: 'round' as const, join: 'round' as const };
  if (p === 'curl') {
    const pts: number[] = [];
    for (let i = 0; i <= 40; i++) {
      const a = i * 0.42, r = (4 + i * 0.62) * s;
      pts.push(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.stroke(st);
  } else if (p === 'fan') {
    const bx = x, by = y + 24 * s;
    for (let i = -3; i <= 3; i++) {
      const a = -Math.PI / 2 + i * 0.32;
      g.moveTo(bx, by).lineTo(bx + Math.cos(a) * 46 * s, by + Math.sin(a) * 46 * s);
    }
    g.stroke(st);
    g.moveTo(bx, by).lineTo(bx, by + 8 * s).stroke(st);
  } else if (p === 'ribbon') {
    g.ellipse(x - 6 * s, y, 22 * s, 11 * s).stroke(st);
    g.moveTo(x + 16 * s, y).quadraticCurveTo(x + 26 * s, y - 14 * s, x + 34 * s, y).quadraticCurveTo(x + 42 * s, y + 14 * s, x + 50 * s, y - 2 * s).stroke(st);
    g.circle(x - 18 * s, y - 2 * s, 2.5 * s).fill({ color: ink, alpha });
  } else {
    g.circle(x + 4 * s, y - 4 * s, 18 * s).stroke(st);
    for (const [dx, dy] of [[-4, -10], [10, -8], [2, 4], [14, 4]]) g.circle(x + (4 + dx) * s, y + (-4 + dy) * s, 3 * s).fill({ color: ink, alpha });
    g.moveTo(x - 26 * s, y + 16 * s).lineTo(x + 26 * s, y + 16 * s).stroke(st);
    g.moveTo(x - 20 * s, y + 16 * s).lineTo(x - 28 * s, y + 2 * s).stroke(st);
  }
}

/** A wavy line across a width: the sea-worn edge where rock was taken. */
function wavy(g: Graphics, x0: number, x1: number, y: number, amp = 7, color = 0x3d6f8f, width = 5) {
  const n = 6, w = (x1 - x0) / n;
  g.moveTo(x0, y);
  for (let i = 0; i < n; i++) g.quadraticCurveTo(x0 + w * (i + 0.5), y + (i % 2 ? amp : -amp) * 1.6, x0 + w * (i + 1), y);
  g.stroke({ width, color, cap: 'round' });
}

/** A layer of rock, `w`×`h` centred at (x, y): its rock (pictured layers coloured, plain ones mud), its picture and its stripe. */
function drawLayer(g: Graphics, layer: Layer, x: number, y: number, w: number, h: number, showStripe: boolean) {
  const fill = layer.picture ? ROCK[layer.picture] : MUD;
  g.rect(x - w / 2, y - h / 2, w, h).fill(fill).stroke({ width: 3, color: layer.picture ? ROCK_LINE : MUD_LINE });
  for (let i = 1; i < 4; i++) g.moveTo(x - w / 2 + 8, y - h / 2 + (h * i) / 4).lineTo(x + w / 2 - 8, y - h / 2 + (h * i) / 4).stroke({ width: 1.5, color: 0xffffff, alpha: 0.25 });
  if (showStripe && layer.stripe) g.rect(x - w / 2 + 2, y + h * 0.18, w - 4, h * 0.14).fill({ color: STRIPE, alpha: 0.85 });
  if (layer.picture) drawPicture(g, layer.picture, x, y, Math.min(1, h / 100));
}

/** A rounded white card. */
function card(w: number, h: number, line: number = wood.line): Graphics {
  return new Graphics().roundRect(-w / 2, -h / 2, w, h, 18).fill(0xffffff).stroke({ width: 5, color: line });
}

/** A magnifying glass, centred. */
function lensIcon(g: Graphics, x: number, y: number, r = 22) {
  g.circle(x, y, r).fill({ color: 0xdff4ff, alpha: 0.9 }).stroke({ width: 6, color: wood.line });
  g.moveTo(x + r * 0.72, y + r * 0.72).lineTo(x + r * 1.6, y + r * 1.6).stroke({ width: 9, color: wood.line, cap: 'round' });
}

/** A story card's picture: a small Shell Cove on its rows, with the lost creature's ghost in the mud or in the sea's gap. */
function storyArt(c: Case, rows: Placement): Container {
  const box = new Container();
  const g = new Graphics();
  const rh = 14, w = 44, x = -50, bottom = (ROWS * rh) / 2;
  const ry = (r: number) => bottom - (r - 0.5) * rh;
  g.rect(x - w / 2, -bottom, w, ROWS * rh).fill({ color: SEA, alpha: 0.35 });
  const pieces = cove(c);
  pieces.forEach((p, i) => {
    const y = ry(rows[i]);
    g.rect(x - w / 2, y - rh / 2, w, rh).fill(p.picture ? ROCK[p.picture] : MUD).stroke({ width: 2, color: MUD_LINE });
  });
  const lost = c.pictures[1];
  const mud = story(c, rows) === 'in-the-mud';
  const gy = ry(lostRow(c));
  g.circle(x, gy, 6).fill({ color: ink, alpha: 0.55 });
  // The big ghost: the lost creature, faint, inside a mud blob or over a wave.
  if (mud) g.roundRect(8, -32, 80, 64, 18).fill(MUD).stroke({ width: 3, color: MUD_LINE });
  else {
    g.roundRect(8, -32, 80, 64, 18).fill({ color: SEA, alpha: 0.6 });
    wavy(g, 14, 82, 22, 5, 0x3d6f8f, 4);
  }
  drawPicture(g, lost, 44, -4, 0.7, 0.45);
  g.moveTo(x + w / 2 + 4, gy).lineTo(8, 0).stroke({ width: 3, color: ink, alpha: 0.5 });
  box.addChild(g);
  return box;
}

/** What a look card shows: the lens over the mud, over a wavy line, or over the bottom shell. */
function lookArt(c: Case, look: LookId): Graphics {
  const g = new Graphics();
  if (look === 'lens-mud') g.rect(-46, -26, 70, 44).fill(MUD).stroke({ width: 3, color: MUD_LINE });
  else if (look === 'lens-wavy') {
    g.rect(-46, -26, 70, 20).fill(MUD).rect(-46, 4, 70, 18).fill(ROCK[c.pictures[0]]);
    wavy(g, -46, 24, -4, 4, 0x3d6f8f, 4);
  } else {
    g.rect(-46, -26, 70, 44).fill(ROCK[c.pictures[0]]).stroke({ width: 3, color: ROCK_LINE });
    drawPicture(g, c.pictures[0], -11, -4, 0.5);
  }
  lensIcon(g, 12, 6, 20);
  return g;
}

/* The game --------------------------------------------------------------------------------------- */

interface Piece { index: number; node: Container; art: Graphics; drag: DragHandle; layer: Layer }
interface LookCard { look: LookId; node: Container; drag: DragHandle }
interface StoryCard { story: Story; node: Container; placement: Placement }

class LostLayers implements Game {
  readonly hintLabel = 'Show a hint';
  readonly c: Case;
  state: RoundState;
  busy = true;
  finished = false;
  /** The look in the lens, if it is open. */
  open: LookId | null = null;
  /** The look card in the slot. */
  slot: LookId | null = null;
  /** The stripe the look found on Shell Cove's mud, once seen. */
  stripeSeen = false;

  private L: LayersLayout;
  private view: View;
  private readonly bg = new Graphics();
  private readonly cliffs = new Graphics();
  private readonly labels = new Container();
  private readonly marks = new Graphics();
  private readonly glow = new Graphics();
  private readonly controls = new Container();
  private readonly pieceLayer = new Container();
  pieces: Piece[] = [];
  looks: LookCard[] = [];
  cards: StoryCard[] = [];
  readonly actionBtn = new Container();
  readonly cantTellBtn = new Container();
  readonly slotNode = new Container();
  private readonly cardSlots = new Graphics();
  private readonly lens = new Container();
  private readonly lensArt = new Graphics();
  /** A piece being carried, and the row it would land on. */
  private carried: { piece: number; row: number } | null = null;
  /** A red thing pulsing after It fits or a wrong claim. */
  private pulse: { reason: Reason | 'claim'; t: number } | null = null;
  private readonly greenBefore = new Set<number>();
  private t = 0;
  private destroyed = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    const level = planFor(ctx.level).id;
    const first = !authoredShown.has(level) && !ctx.demo;
    if (first) authoredShown.add(level);
    this.c = makeCase(level, ctx.rng, first);
    this.state = roundState(this.c);
    this.L = layersLayout(ctx.view, level);

    const s = ctx.stage;
    this.bg.eventMode = 'static';
    this.bg.on('pointerdown', () => this.closeLens());
    for (const g of [this.cliffs, this.marks, this.glow, this.cardSlots]) g.eventMode = 'none';
    this.labels.eventMode = 'none';
    this.lens.addChild(this.lensArt);
    this.lens.visible = false;
    this.lens.hitArea = new Rectangle(-4000, -4000, 8000, 8000);
    onTap(this.lens, () => this.closeLens(), { cooldown: 300 });
    s.addChild(this.bg, this.cliffs, this.labels, this.cardSlots, this.marks, this.controls, this.pieceLayer, this.glow, this.lens);

    this.buildButtons();
    this.buildPieces();
    if (level >= 2) this.buildLooks();
    for (const p of this.state.stamped) this.addCard(p, false);
    this.drawBackdrop();
    this.layout();
  }

  get misses() { return this.state.misses; }
  get hints() { return this.state.hints; }
  get level() { return this.state.level; }

  start() {
    if (this.level >= 2) void this.ctx.instruct('lost-layers.look-intro');
    else void this.ctx.instruct('lost-layers.intro', { first: CREATURE[this.c.pictures[0]], top: CREATURE[this.c.pictures[2]] });
    this.busy = false;
  }

  /* Building -------------------------------------------------------------------------------------- */

  private buildButtons() {
    const a = this.actionBtn;
    a.addChild(new Graphics().roundRect(-BTN_W / 2, -BTN_H / 2, BTN_W, BTN_H, 22).fill(swatch.green.fill).stroke({ width: 5, color: swatch.green.line }));
    const icon = new Graphics();
    if (this.level >= 2) lensIcon(icon, -52, -6, 20);
    else icon.moveTo(-72, 0).lineTo(-58, 16).lineTo(-34, -16).stroke({ width: 9, color: 0xffffff, cap: 'round', join: 'round' });
    const label = new Text({ text: this.level >= 2 ? 'Look' : 'It fits', style: { fontFamily: FONT, fontSize: 34, fontWeight: '700', fill: 0xffffff } });
    label.anchor.set(0.5);
    label.x = 22;
    a.addChild(icon, label);
    a.hitArea = new Rectangle(-BTN_W / 2, -BTN_H / 2, BTN_W, BTN_H);
    onTap(a, () => void (this.level >= 2 ? this.pressLook() : this.pressFits()), { cooldown: 400 });

    const b = this.cantTellBtn;
    b.addChild(new Graphics().roundRect(-BTN_W / 2, -BTN_H / 2, BTN_W, BTN_H, 22).fill(swatch.purple.fill).stroke({ width: 5, color: swatch.purple.line }));
    const q = new Text({ text: "?  Can't tell", style: { fontFamily: FONT, fontSize: 30, fontWeight: '700', fill: 0xffffff } });
    q.anchor.set(0.5);
    b.addChild(q);
    b.hitArea = new Rectangle(-BTN_W / 2, -BTN_H / 2, BTN_W, BTN_H);
    onTap(b, () => void this.pressClaim('cant-tell'), { cooldown: 400 });
    this.controls.addChild(a, b);

    if (this.level >= 2) {
      this.slotNode.addChild(new Graphics().roundRect(-SLOT_W / 2, -SLOT_H / 2, SLOT_W, SLOT_H, 20).fill(cream).stroke({ width: 5, color: wood.line }));
      const g = new Graphics();
      lensIcon(g, 0, -6, 26);
      g.alpha = 0.25;
      this.slotNode.addChild(g);
      this.slotNode.eventMode = 'none';
      this.controls.addChildAt(this.slotNode, 0);
    }
  }

  private buildPieces() {
    cove(this.c).forEach((layer, index) => {
      const node = new Container();
      const art = new Graphics();
      node.addChild(art);
      node.hitArea = new Rectangle(-COL_W / 2, -ROW_H / 2, COL_W, ROW_H);
      this.pieceLayer.addChild(node);
      const piece: Piece = { index, node, art, layer, drag: null as unknown as DragHandle };
      piece.drag = draggable(node, this.ctx.tw, {
        onPick: () => { sfx.brush(); this.closeLens(); this.carried = { piece: index, row: this.state.rows[index] }; },
        onMove: (_x, y) => { if (this.carried) { this.carried.row = this.freeRow(index, nearestRow(this.L, y)); this.drawMarks(); } },
        onDrop: (x, y) => this.dropPiece(piece, x, y),
      });
      this.pieces.push(piece);
      this.drawPiece(piece);
    });
  }

  private drawPiece(p: Piece) {
    const g = p.art.clear();
    drawLayer(g, p.layer, 0, 0, COL_W, ROW_H, this.stripeSeen);
    const x0 = -COL_W / 2, x1 = COL_W / 2;
    if (p.index === 0 || p.index === 1) wavy(g, x0, x1, -ROW_H / 2);
    if (p.index === 1 || p.index === 2) wavy(g, x0, x1, ROW_H / 2);
  }

  private buildLooks() {
    for (const look of this.c.looks) {
      const node = new Container();
      node.addChild(card(LOOK_W, LOOK_H), lookArt(this.c, look));
      node.hitArea = new Rectangle(-LOOK_W / 2, -LOOK_H / 2, LOOK_W, LOOK_H);
      this.controls.addChild(node);
      const lc: LookCard = { look, node, drag: null as unknown as DragHandle };
      lc.drag = draggable(node, this.ctx.tw, { onPick: () => this.closeLens(), onDrop: (x, y) => this.dropLook(lc, x, y) });
      this.looks.push(lc);
    }
  }

  private addCard(placement: Placement, animate: boolean) {
    const st = story(this.c, placement);
    const node = new Container();
    node.addChild(card(CARD_W, CARD_H, swatch.yellow.line), storyArt(this.c, placement));
    node.hitArea = new Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);
    onTap(node, () => void this.pressClaim(st), { cooldown: 400 });
    this.controls.addChild(node);
    const sc: StoryCard = { story: st, node, placement };
    this.cards.push(sc);
    const at = this.L.cards[this.cards.length - 1];
    node.position.set(at.x, at.y);
    if (animate) {
      node.scale.set(0.2);
      void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
      this.ctx.particles.burst(at.x, at.y, { kind: 'star', colors: [swatch.yellow.fill, 0xffffff], count: 10, speed: [80, 200], gravity: 0, life: [0.4, 0.8] });
    }
    this.cantTellBtn.visible = true;
  }

  private drawBackdrop() {
    const v = this.view, L = this.L;
    this.bg.clear().rect(0, 0, v.w, v.h).fill(0xcdeaf7);
    this.bg.rect(0, v.h * 0.55, v.w, v.h * 0.45).fill({ color: SEA, alpha: 0.7 });
    this.bg.rect(0, v.h - 90, v.w, 90).fill(0xf6e3b4);
    this.bg.hitArea = new Rectangle(0, 0, v.w, v.h);
    const top = L.bottom - ROWS * ROW_H;
    const g = this.cliffs.clear();
    // Gull Cliff: the whole record. Shell Cove: an outline of its rows, and the sea's gaps fill in as the pieces move.
    gull(this.c).forEach((layer, i) => drawLayer(g, layer, L.gullX + COL_W / 2, rowY(L, i + 1), COL_W, ROW_H, true));
    g.rect(L.gullX, top, COL_W, ROWS * ROW_H).stroke({ width: 5, color: ROCK_LINE });
    g.rect(L.coveX, top, COL_W, ROWS * ROW_H).fill({ color: 0xffffff, alpha: 0.25 });
    for (let r = 0; r <= ROWS; r++) g.moveTo(L.coveX, top + r * ROW_H).lineTo(L.coveX + COL_W, top + r * ROW_H).stroke({ width: 2, color: 0xffffff, alpha: 0.6 });
    // "Lower is older": a small arrow down beside row 1.
    const ax = L.gullX - 22, ay = rowY(L, 2);
    g.moveTo(ax, ay - 50).lineTo(ax, ay + 80).stroke({ width: 5, color: ink, alpha: 0.5, cap: 'round' });
    g.poly([ax - 10, ay + 70, ax, ay + 90, ax + 10, ay + 70]).fill({ color: ink, alpha: 0.5 });
    this.labels.removeChildren().forEach((c) => c.destroy());
    const sign = (text: string, x: number) => {
      const t = new Text({ text, style: { fontFamily: FONT, fontSize: 26, fontWeight: '700', fill: ink } });
      t.anchor.set(0.5, 1);
      t.position.set(x, top - 8);
      this.labels.addChild(t);
    };
    sign('Gull Cliff', L.gullX + COL_W / 2);
    sign('Shell Cove', L.coveX + COL_W / 2);
    const older = new Text({ text: 'older', style: { fontFamily: FONT, fontSize: 18, fill: ink } });
    older.alpha = 0.6;
    older.anchor.set(0.5);
    older.rotation = -Math.PI / 2;
    older.position.set(ax - 16, ay + 30);
    this.labels.addChild(older);
    const cs = this.cardSlots.clear();
    for (const p of L.cards) cs.roundRect(p.x - CARD_W / 2, p.y - CARD_H / 2, CARD_W, CARD_H, 18).stroke({ width: 4, color: wood.line, alpha: 0.35 });
  }

  private layout() {
    const L = this.L;
    this.actionBtn.position.set(L.action.x, L.action.y);
    this.cantTellBtn.position.set(L.cantTell.x, L.cantTell.y);
    this.cantTellBtn.visible = this.cards.length > 0;
    this.slotNode.position.set(L.slot.x, L.slot.y);
    this.cards.forEach((c, i) => c.node.position.set(L.cards[i].x, L.cards[i].y));
    for (const p of this.pieces) this.placePiece(p, false);
    this.looks.forEach((lc, i) => {
      lc.drag.home = this.slot === lc.look ? { ...L.slot } : { ...L.looks[i] };
      lc.node.position.set(lc.drag.home.x, lc.drag.home.y);
    });
    this.lens.position.set(L.lens.x, L.lens.y);
    this.drawMarks();
  }

  private placePiece(p: Piece, animate: boolean) {
    const home = { x: this.L.coveX + COL_W / 2, y: rowY(this.L, this.state.rows[p.index]) };
    p.drag.home = home;
    if (animate) return p.drag.floatHome();
    p.node.position.set(home.x, home.y);
    return Promise.resolve();
  }

  /** The row nearest `want` that no other piece is on. */
  private freeRow(piece: number, want: number): number {
    const taken = new Set(this.state.rows.filter((_, i) => i !== piece));
    for (let d = 0; d < ROWS; d++) {
      for (const r of [want - d, want + d]) if (r >= 1 && r <= ROWS && !taken.has(r)) return r;
    }
    return this.state.rows[piece];
  }

  private dropPiece(p: Piece, x: number, y: number): boolean {
    this.carried = null;
    const L = this.L;
    const over = x > L.coveX - 60 && x < L.coveX + COL_W + 60 && y > L.bottom - ROWS * ROW_H - 60 && y < L.bottom + 60;
    if (!over || this.finished) {
      this.drawMarks();
      return false;
    }
    move(this.state, p.index, this.freeRow(p.index, nearestRow(L, y)));
    sfx.tick();
    void this.placePiece(p, true);
    this.drawMarks();
    return true;
  }

  /* Marks ------------------------------------------------------------------------------------------ */

  /** The rows as they would be with the carried piece where it would land. */
  private shownRows(): Placement {
    const r = [...this.state.rows] as [number, number, number];
    if (this.carried) r[this.carried.piece] = this.carried.row;
    return r;
  }

  private drawMarks() {
    const L = this.L, g = this.marks.clear();
    const rows = this.shownRows();
    const t = ties(this.c, rows, this.state.looked);
    const pulsing = this.pulse ? 1 + 0.6 * Math.abs(Math.sin(this.pulse.t * 10)) : 1;
    const gx = L.gullX + COL_W, cx = L.coveX;
    // The sea's gaps: rows of Shell Cove between two pieces are rock the sea took.
    for (let i = 0; i < 2; i++) {
      for (let r = rows[i] + 1; r < rows[i + 1]; r++) g.rect(cx, rowY(L, r) - ROW_H / 2, COL_W, ROW_H).fill({ color: SEA, alpha: 0.55 });
    }
    for (const b of t.bands) {
      if (!b.red) continue;
      const y = (rowY(L, rows[b.gap]) + rowY(L, rows[b.gap + 1])) / 2;
      const w = (this.pulse?.reason === 'wavy-squeezed' || this.pulse?.reason === 'out-of-order' ? 12 : 9) * pulsing;
      g.roundRect(cx - 8, y - 12, COL_W + 16, 24, 10).fill({ color: swatch.red.fill, alpha: 0.35 });
      wavy(g, cx - 6, cx + COL_W + 6, y, 7, swatch.red.line, w);
    }
    for (const tie of t.ties) {
      const y0 = rowY(L, tie.to), y1 = rowY(L, tie.from);
      const red = !tie.green;
      const w = (red && this.pulse?.reason === 'picture-off-twin' ? 10 : 7) * (red ? pulsing : 1);
      g.moveTo(gx + 4, y0).lineTo(cx - 4, y1).stroke({ width: w, color: red ? swatch.red.line : swatch.green.line, cap: 'round' });
      g.circle(gx + 4, y0, 7).circle(cx - 4, y1, 7).fill(red ? swatch.red.fill : swatch.green.fill);
    }
    if (t.stripe) {
      const s = t.stripe;
      g.moveTo(gx + 4, rowY(L, s.to) + 25).lineTo(cx - 4, rowY(L, s.from) + 25).stroke({ width: 7 * (s.green ? 1 : pulsing), color: s.green ? STRIPE : swatch.red.line, cap: 'round' });
    }
    // A short pentatonic pair when a tie turns green.
    const greenNow = new Set(t.ties.filter((x) => x.green).map((x) => x.piece));
    for (const p of greenNow) if (!this.greenBefore.has(p) && this.t > 0.5) { sfx.pluck(7); sfx.pluck(9, 0.2); }
    this.greenBefore.clear();
    for (const p of greenNow) this.greenBefore.add(p);
  }

  private drawGlow() {
    const g = this.glow.clear();
    const target = glowing(this.state);
    if (!target || this.finished) return;
    const a = 0.45 + 0.35 * Math.sin(this.t * 5);
    const L = this.L;
    const ring = (x: number, y: number, w: number, h: number) => g.roundRect(x - w / 2 - 10, y - h / 2 - 10, w + 20, h + 20, 24).stroke({ width: 10, color: swatch.yellow.fill, alpha: a });
    if (target.kind === 'fit') {
      // The plain piece's outline on the row of a fit not yet stamped (the pictured pieces too, if moved off).
      target.placement.forEach((row, i) => {
        if (this.state.rows[i] !== row || i === 1) ring(L.coveX + COL_W / 2, rowY(L, row), COL_W - 20, ROW_H - 20);
      });
    } else if (target.kind === 'look') {
      const lc = this.looks.find((x) => x.look === target.look);
      if (lc) ring(lc.node.x, lc.node.y, LOOK_W, LOOK_H);
    } else if (target.claim === 'cant-tell') ring(L.cantTell.x, L.cantTell.y, BTN_W, BTN_H);
    else {
      const sc = this.cards.find((x) => x.story === target.claim);
      if (sc) ring(sc.node.x, sc.node.y, CARD_W, CARD_H);
    }
  }

  /* Actions ---------------------------------------------------------------------------------------- */

  private say(id: Parameters<GameContext['say']>[0], vars?: Parameters<GameContext['say']>[1]) {
    return this.ctx.say(id, vars);
  }

  private get creature() { return CREATURE[this.c.pictures[1]]; }

  private async pressFits() {
    if (this.busy || this.finished) return;
    const r = fits(this.state);
    if (r.kind === 'ignored') return;
    if (r.kind === 'red') {
      sfx.boing();
      this.pulse = { reason: r.reason, t: 0 };
      this.busy = true;
      await this.say(`lost-layers.${r.reason === 'stripe' ? 'wavy-squeezed' : r.reason}`);
      if (this.destroyed) return;
      if (r.glow) void this.say('lost-layers.hint-slide');
      this.busy = false;
      return;
    }
    if (r.kind === 'already') {
      const sc = this.cards[r.index];
      void this.ctx.tw.to(sc.node, { rotation: 0.08 }, { duration: 0.08 }).then(() => this.ctx.tw.to(sc.node, { rotation: 0 }, { duration: 0.3, ease: ease.outBack }));
      void this.say('lost-layers.already-stamped');
      return;
    }
    sfx.bell(9);
    sfx.bell(12, 0.2);
    const firstCard = this.cards.length === 0;
    this.addCard(this.state.stamped[r.index], true);
    this.busy = true;
    await this.say(r.story === 'in-the-mud' ? 'lost-layers.fits-mud' : 'lost-layers.fits-gap', { creature: this.creature });
    if (this.destroyed) return;
    if (firstCard) void this.say('lost-layers.instruct-tell');
    else if (this.state.stamped.length === 2) void this.ctx.instruct('lost-layers.both-still-fit');
    this.busy = false;
  }

  private async pressClaim(what: Claim) {
    if (this.busy || this.finished) return;
    this.closeLens();
    const r = claim(this.state, what);
    if (r.kind === 'ignored') return;
    if (r.kind === 'maybe') { void this.say('lost-layers.maybe-another'); return; }
    if (r.kind === 'not-yet') { void this.say('lost-layers.not-yet-look'); return; }
    if (r.kind === 'right') { await this.win(what); return; }
    sfx.boing();
    this.busy = true;
    if (r.kind === 'other-fits') {
      await Promise.all(this.pieces.map((p) => this.placePiece(p, true)));
      if (this.destroyed) return;
      this.drawMarks();
      sfx.bell(9);
      this.addCard(r.placement, true);
      await this.say('lost-layers.other-fits-too', { creature: this.creature });
    } else if (r.kind === 'both-fit') {
      await this.say('lost-layers.other-fits-too', { creature: this.creature });
    } else {
      await Promise.all(this.pieces.map((p) => this.placePiece(p, true)));
      if (this.destroyed) return;
      this.pulse = { reason: 'claim', t: 0 };
      this.drawMarks();
      await this.say('lost-layers.claim-wrong', { creature: this.creature });
    }
    if (this.destroyed) return;
    if (r.glow) void this.say('lost-layers.hint-claim');
    this.busy = false;
  }

  private async win(what: Claim) {
    this.finished = true;
    this.busy = true;
    sfx.tada();
    this.ctx.pet.cheer();
    await this.say(what === 'cant-tell' ? 'lost-layers.cant-tell-right' : what === 'in-the-mud' ? 'lost-layers.claim-right-mud' : 'lost-layers.claim-right-gap', { creature: this.creature });
    if (this.destroyed) return;
    await this.say('lost-layers.done');
    if (this.destroyed) return;
    await this.ctx.tw.wait(0.3);
    if (this.destroyed) return;
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /* Looks (level 2) -------------------------------------------------------------------------------- */

  private dropLook(lc: LookCard, x: number, y: number): boolean {
    if (this.busy || this.finished) return false;
    const L = this.L;
    const tapped = Math.hypot(x - lc.drag.home.x, y - lc.drag.home.y) < 25;
    if (tapped) {
      // A tap previews: the pet says what that look can see. Free.
      const line = lc.look === 'lens-mud' ? 'lost-layers.preview-mud' : lc.look === 'lens-wavy' ? 'lost-layers.preview-wavy' : 'lost-layers.preview-shell';
      void this.say(line, { creature: CREATURE[this.c.pictures[0]] });
      return false;
    }
    const toSlot = Math.abs(x - L.slot.x) < SLOT_W * 0.8 && Math.abs(y - L.slot.y) < SLOT_H * 0.8;
    if (!toSlot || this.state.looked) return false;
    const prev = this.looks.find((c) => c.look === this.slot && c !== lc);
    if (prev) {
      prev.drag.home = { ...L.looks[this.looks.indexOf(prev)] };
      void prev.drag.floatHome();
    }
    this.slot = lc.look;
    lc.drag.home = { ...L.slot };
    sfx.pop(9);
    return false;
  }

  private async pressLook() {
    if (this.busy || this.finished || this.state.looked) return;
    if (!this.slot) {
      sfx.boing();
      void this.say('lost-layers.hint-look');
      return;
    }
    const look = this.slot;
    const r = commitLook(this.state, look);
    if (r.kind === 'ignored') return;
    this.busy = true;
    this.openLens(look);
    if (r.kind === 'informative') {
      sfx.bell(12);
      this.stripeSeen = true;
      for (const p of this.pieces) this.drawPiece(p);
      this.drawMarks();
      await this.say(r.stripe ? 'lost-layers.stripe-found' : 'lost-layers.stripe-missing', { creature: this.creature });
    } else {
      sfx.boing();
      await this.say(look === 'lens-wavy' ? 'lost-layers.look-wavy-nothing' : 'lost-layers.look-shell-known', { creature: CREATURE[this.c.pictures[0]] });
      if (this.destroyed) return;
      const lc = this.looks.find((c) => c.look === look)!;
      this.slot = null;
      lc.drag.home = { ...this.L.looks[this.looks.indexOf(lc)] };
      void lc.drag.floatHome();
      if (r.glow) void this.say('lost-layers.hint-look');
    }
    if (this.destroyed) return;
    this.busy = false;
  }

  private openLens(look: LookId) {
    this.open = look;
    sfx.bell(14, 0.15);
    const g = this.lensArt.clear();
    const R = LENS_R;
    g.circle(0, 0, R + 12).fill(wood.light).stroke({ width: 8, color: wood.line });
    g.circle(0, 0, R).fill(MUD);
    if (look === 'lens-mud') {
      for (let i = 0; i < 26; i++) g.circle(Math.cos(i * 2.4) * R * 0.75 * ((i % 5) / 5 + 0.2), Math.sin(i * 2.4) * R * 0.75 * ((i % 4) / 4 + 0.2), 4).fill({ color: MUD_LINE, alpha: 0.6 });
      if (this.c.stripe) g.rect(-R * 0.98, 10, R * 1.96, 34).fill({ color: STRIPE, alpha: 0.9 });
    } else if (look === 'lens-wavy') {
      g.rect(-R, 0, 2 * R, R).fill(ROCK[this.c.pictures[0]]);
      g.rect(-R, -R, 2 * R, R - 20).fill({ color: SEA, alpha: 0.8 });
      wavy(g, -R, R, -10, 14, 0x3d6f8f, 8);
    } else {
      g.circle(0, 0, R).fill(ROCK[this.c.pictures[0]]);
      drawPicture(g, this.c.pictures[0], -40, -30, 1.1);
      drawPicture(g, this.c.pictures[0], 40, 40, 1.1);
    }
    g.circle(0, 0, R).stroke({ width: 6, color: 0xffffff, alpha: 0.5 });
    this.lens.visible = true;
    this.lens.scale.set(0.3);
    void this.ctx.tw.to(this.lens.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
  }

  private closeLens() {
    if (!this.open) return;
    this.open = null;
    this.lens.visible = false;
  }

  /* Help ------------------------------------------------------------------------------------------- */

  askForHint() {
    if (this.finished) return;
    help(this.state);
    const step = currentStep(this.state);
    void this.say(step === 'arrange' ? 'lost-layers.hint-slide' : step === 'look' ? 'lost-layers.hint-look' : 'lost-layers.hint-claim');
  }

  restart() {
    if (this.finished) return;
    const keep = { misses: this.state.misses, hints: this.state.hints };
    this.state = roundState(this.c);
    Object.assign(this.state, keep);
    for (const c of this.cards) c.node.destroy({ children: true });
    this.cards = [];
    for (const p of this.state.stamped) this.addCard(p, false);
    this.slot = null;
    this.stripeSeen = false;
    for (const p of this.pieces) this.drawPiece(p);
    this.closeLens();
    this.layout();
    this.busy = false;
  }

  /* Frame ------------------------------------------------------------------------------------------ */

  update(dt: number) {
    this.t += dt;
    if (this.pulse) {
      this.pulse.t += dt;
      if (this.pulse.t > PULSE) this.pulse = null;
      this.drawMarks();
    }
    this.drawGlow();
  }

  resize(view: View) {
    this.view = view;
    this.L = layersLayout(view, this.level);
    this.drawBackdrop();
    this.layout();
  }

  /* Bot -------------------------------------------------------------------------------------------- */

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.pieces.some((p) => p.drag.dragging) || this.looks.some((l) => l.drag.dragging)) return null;
    const s = this.state, L = this.L;
    if (this.open) return { tap: { on: this.lens }, pause: 0.6 };
    const dragTo = (rows: Placement): TouchIntent | null => {
      const i = rows.findIndex((r, j) => s.rows[j] !== r);
      if (i < 0) return null;
      return { drag: { on: this.pieces[i].node }, to: { on: this.ctx.stage, x: L.coveX + COL_W / 2, y: rowY(L, rows[i]) }, pause: 0.8 };
    };
    if (s.level < 2) {
      if (s.stamped.length < 2) {
        const target = [[1, 3, 6], [1, 4, 6]].find((p) => !s.stamped.some((x) => x[1] === p[1])) as unknown as Placement;
        return dragTo(target) ?? { tap: { on: this.actionBtn }, pause: 1.6 };
      }
      return { tap: { on: this.cantTellBtn } };
    }
    if (!s.looked) {
      if (this.slot !== 'lens-mud') {
        const lc = this.looks.find((x) => x.look === 'lens-mud')!;
        return { drag: { on: lc.node }, to: { on: this.ctx.stage, x: L.slot.x, y: L.slot.y }, pause: 0.6 };
      }
      return { tap: { on: this.actionBtn }, pause: 1.6 };
    }
    const survivor = this.c.stripe ? 'in-the-mud' : 'washed-away';
    const sc = this.cards.find((x) => x.story === survivor)!;
    return dragTo(sc.placement) ?? { tap: { on: sc.node } };
  }

  destroy() {
    this.destroyed = true;
    for (const p of this.pieces) p.drag.destroy();
    for (const l of this.looks) l.drag.destroy();
    this.bg.removeAllListeners();
    this.lens.removeAllListeners();
  }
}

/* Icon and sticker ------------------------------------------------------------------------------- */

/** Two striped cliffs, one with a wavy bite out of it. */
function cliffPair(p: Picture): Container {
  const c = new Container();
  const g = new Graphics();
  const h = 34;
  const colsA: (Picture | null)[] = [p, null, 'fan', null];
  colsA.forEach((pic, i) => g.rect(-95, -h * (i + 1), 80, h).fill(pic ? ROCK[pic] : MUD).stroke({ width: 3, color: MUD_LINE }));
  [0, 2, 3].forEach((i) => g.rect(15, -h * (i + 1), 80, h).fill(i === 0 ? ROCK[p] : i === 3 ? MUD : ROCK.fan).stroke({ width: 3, color: MUD_LINE }));
  g.rect(15, -h * 2, 80, h).fill({ color: SEA, alpha: 0.6 });
  wavy(g, 15, 95, -h * 2 + 2, 4, 0x3d6f8f, 4);
  wavy(g, 15, 95, -h, 4, 0x3d6f8f, 4);
  g.moveTo(-15, -h / 2).lineTo(15, -h / 2).stroke({ width: 5, color: swatch.green.line, cap: 'round' });
  drawPicture(g, p, -55, -h / 2, 0.42);
  drawPicture(g, p, 55, -h / 2, 0.42);
  c.addChild(g);
  return c;
}

function sticker(seed: number): Container {
  const c = new Container();
  const p = (['curl', 'fan', 'ribbon', 'dot'] as const)[Math.abs(seed) % 4];
  const art = cliffPair(p === 'fan' ? 'dot' : p);
  art.scale.set(1.1);
  art.y = 70;
  c.addChild(new Graphics().roundRect(-130, 70, 260, 20, 8).fill(0xf6e3b4).stroke({ width: 4, color: wood.line }), art);
  return c;
}

export const lostLayers: GameModule = {
  id: 'lost-layers',
  name: 'Lost Layers',
  titleLine: 'game.lost-layers',
  region: 'tinker-lab',
  skills: ['evidence', 'relative order', 'uncertainty', 'reasoning'],
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.bubbles,
  coplayHint: 'One of you slides a piece while the other says "fits" or "doesn\'t" before It fits, then swap. At the look, each say which look you would choose before either drags one.',
  offScreen: 'Draw two paper cliffs with the same three pictures, cut one and cover a strip of it, then ask what the covered cliff can still show.',
  touchDemo: true,
  hubIcon: () => new WigglyIcon(cliffPair('curl')),
  sticker,
  create: (ctx) => new LostLayers(ctx),
};
