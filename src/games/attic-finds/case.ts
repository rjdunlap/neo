import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  answerFor,
  CASE_CARD_H,
  CASE_CARD_W,
  CASE_CHECK_R,
  CASE_SLOT,
  caseState,
  checkCase,
  CLAIM_TABLE,
  glowFor,
  helpCase,
  makeCaseRound,
  PAPER_H,
  PAPER_W,
  PAPERS,
  placeCase,
  placePaper,
  readPaper,
  stampClaim,
  STAMP_R,
  supportingPaper,
  type CaseClaimId,
  type CaseLayout,
  type CaseRound,
  type CaseState,
  type PaperId,
  type Stamp,
} from './cases';
import { planFor, type Plan } from './logic';

/*
 * Attic Finds levels 7-8: three papers from the attic trunk lie on the table. She taps one to hear it (free), then at
 * level 7 drags a copy of the paper that shows each claim into its slot, and at level 8 stamps each claim "the papers
 * show it" or "can't tell". Check lights what a paper shows; anything wrong hops back with the pet's reason.
 */

export const WALL = 0xecd9b8;
export const BEAM = 0x9c6b3c;
export const PAPER = 0xfffaf0;
/** A copy in a slot is drawn small enough to sit inside it (200 × 0.55 = 110 units). */
const IN_SLOT = 0.55;
/** Below this many units of finger travel a touch on a paper is a tap (a read), not a drag. */
const TAP_TRAVEL = 18;

/** Each level's authored first round leads its first round of a session. */
const authoredShown = new Set<number>();

/* Art -------------------------------------------------------------------------------------------- */

export function birdBox(g: Graphics, x: number, y: number, k: number, up = true) {
  const s = (n: number) => n * k;
  g.roundRect(x - s(30), y - s(22), s(60), s(48), s(6))
    .fill(swatch.orange.fill)
    .stroke({ width: Math.max(2, s(4)), color: swatch.orange.line });
  g.poly([x - s(36), y - s(20), x, y - s(42), x + s(36), y - s(20)])
    .fill(swatch.red.fill)
    .stroke({ width: Math.max(2, s(3)), color: swatch.red.line, join: 'round' });
  g.circle(x, y + s(2), s(9)).fill(ink);
  // The bird, up on its rod, and the crank on the side.
  const by = up ? y - s(58) : y - s(44);
  g.moveTo(x, y - s(38))
    .lineTo(x, by)
    .stroke({ width: Math.max(2, s(3)), color: wood.line });
  g.circle(x, by, s(11))
    .fill(swatch.blue.fill)
    .stroke({ width: Math.max(2, s(3)), color: swatch.blue.line });
  g.poly([x + s(10), by - s(2), x + s(20), by + s(2), x + s(10), by + s(5)]).fill(swatch.yellow.fill);
  g.moveTo(x + s(30), y + s(4))
    .lineTo(x + s(46), y + s(4))
    .lineTo(x + s(46), y + s(20))
    .stroke({ width: Math.max(2, s(4)), color: 0xb8862b, cap: 'round' });
  g.circle(x + s(46), y + s(22), s(5)).fill(0xf2c14e);
}

export function tick(g: Graphics, x: number, y: number) {
  g.moveTo(x - 8, y)
    .lineTo(x - 2, y + 7)
    .lineTo(x + 10, y - 8)
    .stroke({ width: 4, color: swatch.green.line, cap: 'round', join: 'round' });
}

export function hilltopHouse(g: Graphics, x: number, y: number, k = 1) {
  const s = (n: number) => n * k;
  g.ellipse(x, y + s(30), s(56), s(16)).fill(swatch.green.fill);
  g.circle(x, y + s(6), s(26))
    .fill(cream)
    .stroke({ width: 3, color: wood.line });
  g.poly([x - s(34), y - s(6), x, y - s(42), x + s(34), y - s(6)])
    .fill(swatch.red.fill)
    .stroke({ width: 3, color: swatch.red.line, join: 'round' });
  g.roundRect(x - s(7), y + s(10), s(14), s(20), s(4)).fill(wood.fill);
}

export function seasideHouse(g: Graphics, x: number, y: number, k = 1) {
  const s = (n: number) => n * k;
  for (const dx of [-20, 20])
    g.moveTo(x + s(dx), y + s(14))
      .lineTo(x + s(dx), y + s(38))
      .stroke({ width: 4, color: wood.line });
  g.roundRect(x - s(30), y - s(16), s(60), s(32), s(4))
    .fill(swatch.blue.fill)
    .stroke({ width: 3, color: swatch.blue.line });
  g.poly([x - s(36), y - s(14), x, y - s(38), x + s(36), y - s(14)])
    .fill(swatch.blue.light)
    .stroke({ width: 3, color: swatch.blue.line, join: 'round' });
  for (let i = -2; i <= 2; i++)
    g.moveTo(x + s(i * 18 - 9), y + s(40)).quadraticCurveTo(
      x + s(i * 18),
      y + s(32),
      x + s(i * 18 + 9),
      y + s(40),
    );
  g.stroke({ width: 3, color: swatch.blue.line });
}

export function shop(g: Graphics, x: number, y: number, k = 1) {
  const s = (n: number) => n * k;
  g.rect(x - s(40), y - s(10), s(80), s(44))
    .fill(cream)
    .stroke({ width: 3, color: wood.line });
  for (let i = 0; i < 5; i++)
    g.rect(x - s(44) + i * s(17.6), y - s(30), s(17.6), s(20)).fill(i % 2 ? 0xffffff : swatch.red.fill);
  g.rect(x - s(44), y - s(30), s(88), s(20)).stroke({ width: 3, color: swatch.red.line });
}

export function shells(g: Graphics, x: number, y: number) {
  for (let i = 0; i < 3; i++) {
    const sx = x + i * 18;
    g.poly([sx - 8, y + 6, sx, y - 8, sx + 8, y + 6])
      .fill(swatch.pink.fill)
      .stroke({ width: 2, color: wood.line, join: 'round' });
  }
}

export function heart(g: Graphics, x: number, y: number, r = 6) {
  g.circle(x - r / 2, y, r / 2 + 1)
    .circle(x + r / 2, y, r / 2 + 1)
    .poly([x - r - 1, y + 1, x + r + 1, y + 1, x, y + r + 3])
    .fill(swatch.red.fill);
}

export function crowd(g: Graphics, x: number, y: number, n: number) {
  const cols = [swatch.yellow, swatch.green, swatch.purple, swatch.orange, swatch.blue];
  for (let i = 0; i < n; i++) {
    const cx = x + (i - (n - 1) / 2) * 24;
    g.circle(cx, y, 10)
      .fill(cols[i % cols.length].fill)
      .stroke({ width: 2, color: cols[i % cols.length].line });
    heart(g, cx, y - 22, 5);
  }
}

export function paw(g: Graphics, x: number, y: number) {
  g.ellipse(x, y, 13, 10).fill(0xd9a066).stroke({ width: 3, color: 0x8a5a2b });
  for (const dx of [-8, 0, 8])
    g.circle(x + dx, y - 9, 4)
      .fill(0xd9a066)
      .stroke({ width: 2, color: 0x8a5a2b });
}

export function bunting(g: Graphics, x0: number, x1: number, y: number) {
  const cols = [swatch.red.fill, swatch.yellow.fill, swatch.blue.fill, swatch.green.fill];
  g.moveTo(x0, y).lineTo(x1, y).stroke({ width: 2, color: wood.line });
  let i = 0;
  for (let x = x0 + 4; x + 14 <= x1; x += 18)
    g.poly([x, y, x + 14, y, x + 7, y + 14]).fill(cols[i++ % cols.length]);
}

/** One of the case's three papers, 200 × 150, centred. */
export function paperArt(id: PaperId): Container {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  const w = PAPER_W,
    h = PAPER_H;
  const fill = id === 'poster' ? swatch.yellow.light : id === 'drawing' ? 0xfff3dc : PAPER;
  g.roundRect(-w / 2, -h / 2, w, h, 10)
    .fill(fill)
    .stroke({ width: 4, color: wood.line });
  if (id === 'list') {
    // Hilltop House's roof at the top, then three ticked pictures.
    g.poly([-30, -48, 0, -66, 30, -48])
      .fill(swatch.red.fill)
      .stroke({ width: 3, color: swatch.red.line, join: 'round' });
    g.circle(0, -40, 10).fill(cream).stroke({ width: 2, color: wood.line });
    for (const y of [-12, 22, 52])
      g.moveTo(-80, y + 14)
        .lineTo(80, y + 14)
        .stroke({ width: 2, color: swatch.blue.light });
    birdBox(g, -40, 6, 0.38);
    // A lantern and a pail.
    g.roundRect(-12, -14, 24, 30, 6)
      .fill(swatch.yellow.fill)
      .stroke({ width: 3, color: wood.line })
      .moveTo(-6, -14)
      .quadraticCurveTo(0, -26, 6, -14)
      .stroke({ width: 3, color: wood.line });
    g.poly([26, 30, 54, 30, 50, 56, 30, 56]).fill(0x8c8c9c).stroke({ width: 3, color: ink, join: 'round' });
    tick(g, -62, -2);
    tick(g, -30, 30);
    tick(g, 10, 44);
  } else if (id === 'drawing') {
    bunting(g, -88, 88, -60);
    g.rect(30, -30, 56, 60).fill(cream).stroke({ width: 3, color: wood.line });
    for (let i = 0; i < 4; i++) g.rect(28 + i * 15, -40, 15, 12).fill(i % 2 ? 0xffffff : swatch.blue.fill);
    birdBox(g, -10, 22, 0.55);
    // A friend turning the crank.
    g.circle(-62, 2, 14).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
    g.roundRect(-74, 16, 24, 40, 10).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
    g.moveTo(-52, 28).lineTo(16, 34).stroke({ width: 4, color: swatch.green.line, cap: 'round' });
  } else {
    g.rect(-w / 2 + 4, -h / 2 + 4, w - 8, 22).fill(swatch.red.fill);
    for (let x = -w / 2 + 24; x < w / 2; x += 40) g.rect(x, -h / 2 + 4, 20, 22).fill(0xffffff);
    birdBox(g, -46, 10, 0.55);
    shells(g, 22, -6);
    crowd(g, 34, 50, 4);
  }
  return c;
}

/** A claim card's picture, about 230 × 110 around its centre. */
export function claimPicture(id: CaseClaimId): Container {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  switch (id) {
    case 'hilltop-had':
      hilltopHouse(g, -50, 0, 1.2);
      birdBox(g, 50, 16, 0.6);
      break;
    case 'fair-cranked':
      bunting(g, -110, 110, -46);
      birdBox(g, -10, 18, 0.65);
      paw(g, 30, 34);
      break;
    case 'shop-sold':
      shop(g, -50, 4, 1.1);
      birdBox(g, 40, 16, 0.55);
      shells(g, 70, 36);
      break;
    case 'hilltop-cranked':
      hilltopHouse(g, -60, 0, 1.1);
      birdBox(g, 30, 16, 0.6);
      paw(g, 66, 32);
      break;
    case 'seaside-had':
      seasideHouse(g, -50, -4, 1.1);
      birdBox(g, 50, 16, 0.6);
      break;
    case 'seaside-none':
      seasideHouse(g, -50, -4, 1.1);
      birdBox(g, 50, 16, 0.6);
      g.moveTo(22, -22)
        .lineTo(82, 42)
        .moveTo(82, -22)
        .lineTo(22, 42)
        .stroke({ width: 8, color: swatch.red.line, cap: 'round' });
      break;
    case 'all-loved':
      crowd(g, -40, 26, 5);
      birdBox(g, 70, 16, 0.6);
      break;
  }
  return c;
}

/** A stamp's face: a tick on a paper ("the papers show it") or a question mark on a paper ("can't tell"). */
function stampFace(g: Graphics, stamp: Stamp, r: number, x = 0, y = 0) {
  const color = stamp === 'shown' ? swatch.green : swatch.purple;
  g.circle(x, y, r).fill(color.fill).stroke({ width: 5, color: color.line });
  g.roundRect(x - r * 0.42, y - r * 0.5, r * 0.84, r, 6)
    .fill(0xffffff)
    .stroke({ width: 3, color: color.line });
  if (stamp === 'shown')
    g.moveTo(x - r * 0.24, y)
      .lineTo(x - r * 0.06, y + r * 0.2)
      .lineTo(x + r * 0.26, y - r * 0.22)
      .stroke({ width: 5, color: color.line, cap: 'round', join: 'round' });
  else {
    g.arc(x, y - r * 0.14, r * 0.16, Math.PI, Math.PI * 2.4).stroke({
      width: 5,
      color: color.line,
      cap: 'round',
    });
    g.moveTo(x + r * 0.02, y + r * 0.06)
      .lineTo(x, y + r * 0.14)
      .stroke({ width: 5, color: color.line, cap: 'round' });
    g.circle(x, y + r * 0.3, 3.5).fill(color.line);
  }
}

/* The game --------------------------------------------------------------------------------------- */

interface PaperNode {
  id: PaperId;
  node: Container;
  drag: DragHandle | null;
  travel: number;
  down: { x: number; y: number; id: number } | null;
}
interface CopyNode extends PaperNode {
  slot: number;
}
interface RowNode {
  card: Container;
  mark: Graphics;
  stamps: [Container, Container] | null;
}

export class AtticCase implements Game {
  readonly plan: Plan;
  readonly round: CaseRound;
  readonly hintLabel = 'Show a hint';
  index = 0;
  state!: CaseState;
  busy = true;
  finished = false;
  /** Misses and hints from finished boards (and from before a Start again). */
  banked = { misses: 0, hints: 0 };

  private L: CaseLayout;
  private view: View;
  private readonly bg = new Graphics();
  private readonly shelfArt = new Graphics();
  private readonly shelfLayer = new Container();
  private readonly rowLayer = new Container();
  private readonly slotMarks = new Graphics();
  private readonly checkBtn = new Container();
  private readonly glow = new Graphics();
  private readonly paperLayer = new Container();
  private readonly copyLayer = new Container();
  private papers: PaperNode[] = [];
  private copies: CopyNode[] = [];
  private rows: RowNode[] = [];
  private shelved: Container[] = [];
  /** Papers being read or lit, with the seconds left. */
  private lit = new Map<PaperId, number>();
  private copiesDirty = false;
  private t = 0;
  private destroyed = false;
  /** Bumped by Start again, so animations from before it stop at their next step. */
  private gen = 0;
  /** A resize arrived mid-animation: lay out again once it ends. */
  private relayout = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const first = !authoredShown.has(this.plan.id) && !ctx.demo;
    if (first) authoredShown.add(this.plan.id);
    this.round = makeCaseRound(this.plan, ctx.rng, first);
    this.L = placeCase(ctx.view, this.plan.id);

    this.checkBtn.addChild(
      new Graphics()
        .circle(0, 0, CASE_CHECK_R)
        .fill(swatch.green.fill)
        .stroke({ width: 5, color: swatch.green.line })
        .moveTo(-20, 0)
        .lineTo(-6, 16)
        .lineTo(22, -16)
        .stroke({ width: 9, color: 0xffffff, cap: 'round', join: 'round' }),
    );
    onTap(this.checkBtn, () => void this.pressCheck(), { radius: CASE_CHECK_R + 4, cooldown: 400 });

    for (const n of [this.bg, this.shelfArt, this.shelfLayer, this.slotMarks, this.glow])
      n.eventMode = 'none';
    this.ctx.stage.addChild(
      this.bg,
      this.shelfArt,
      this.shelfLayer,
      this.rowLayer,
      this.slotMarks,
      this.checkBtn,
      this.glow,
      this.paperLayer,
      this.copyLayer,
    );
    this.buildBoard();
    this.layout();
  }

  get mode(): 'sources' | 'tell' {
    return this.plan.mode === 'sources' ? 'sources' : 'tell';
  }

  get board() {
    return this.round.boards[this.index];
  }

  get misses() {
    return this.banked.misses + (this.state?.misses ?? 0);
  }

  get hints() {
    return this.banked.hints + (this.state?.hints ?? 0);
  }

  get layoutNow(): CaseLayout {
    return this.L;
  }

  start() {
    void this.ctx.instruct(
      this.mode === 'sources' ? 'attic-finds.instruct-sources' : 'attic-finds.instruct-tell',
    );
    this.setBusy(false);
  }

  /* Building -------------------------------------------------------------------------------------- */

  private layout() {
    const v = this.view,
      L = this.L;
    this.bg.clear().rect(0, 0, v.w, v.h).fill(WALL);
    this.bg.rect(0, v.h - 120, v.w, 120).fill(wood.light);
    this.bg.poly([0, 0, v.w * 0.32, 0, 0, v.h * 0.42]).fill({ color: BEAM, alpha: 0.35 });
    this.bg.poly([v.w, 0, v.w * 0.68, 0, v.w, v.h * 0.42]).fill({ color: BEAM, alpha: 0.35 });
    this.bg
      .moveTo(v.w * 0.32, 0)
      .lineTo(0, v.h * 0.42)
      .moveTo(v.w * 0.68, 0)
      .lineTo(v.w, v.h * 0.42)
      .stroke({ width: 14, color: BEAM });
    // The table the papers lie on.
    const t0 = L.papers[0].x - PAPER_W / 2 - 24,
      t1 = L.papers[2].x + PAPER_W / 2 + 24,
      ty = L.papers[0].y;
    this.bg
      .roundRect(t0, ty - PAPER_H / 2 - 14, t1 - t0, PAPER_H + 28, 16)
      .fill({ color: wood.fill, alpha: 0.85 })
      .stroke({ width: 5, color: wood.line });
    const sx0 = L.shelf[0].x - 90,
      sx1 = L.shelf[1].x + 90,
      sy = L.shelf[0].y + 34;
    this.shelfArt
      .clear()
      .roundRect(sx0, sy, sx1 - sx0, 14, 5)
      .fill(wood.fill)
      .stroke({ width: 4, color: wood.line });
    this.shelved.forEach((n, i) => n.position.set(L.shelf[i].x, L.shelf[i].y));
    this.checkBtn.position.set(L.check.x, L.check.y);
    this.slotMarks.clear();
    for (const p of L.slots)
      this.slotMarks
        .roundRect(p.x - CASE_SLOT / 2, p.y - CASE_SLOT / 2, CASE_SLOT, CASE_SLOT, 16)
        .fill({ color: cream, alpha: 0.7 })
        .stroke({ width: 4, color: wood.line, alpha: 0.6 });
    this.rows.forEach((r, i) => {
      r.card.position.set(L.cards[i].x, L.cards[i].y);
      r.stamps?.forEach((s, k) => s.position.set(L.stamps[i][k].x, L.stamps[i][k].y));
    });
    if (this.busy && this.state) {
      // Moving papers mid-animation would strand its tweens; they follow when it ends.
      this.relayout = true;
      this.drawCheck();
      return;
    }
    for (const [i, pn] of this.papers.entries()) {
      this.ctx.tw.kill(pn.node);
      pn.node.position.set(L.papers[i].x, L.papers[i].y);
      if (pn.drag) pn.drag.home = { ...L.papers[i] };
    }
    // Rebuilding copies mid-drag would drop the held one; update() syncs them once it is let go.
    if (this.copies.some((c) => c.drag?.dragging)) this.copiesDirty = true;
    else this.syncCopies();
    this.drawCheck();
  }

  private clearPapers() {
    for (const pn of [...this.papers, ...this.copies]) this.dropNode(pn);
    this.papers = [];
    this.copies = [];
  }

  private dropNode(pn: PaperNode) {
    pn.drag?.destroy();
    this.ctx.tw.kill(pn.node);
    this.ctx.tw.kill(pn.node.scale);
    pn.node.destroy({ children: true });
  }

  private buildBoard() {
    const b = this.board;
    this.state = caseState(this.mode, b);
    this.lit.clear();
    this.clearPapers();
    for (const r of this.rows) {
      this.ctx.tw.kill(r.card);
      this.ctx.tw.kill(r.card.scale);
      r.card.destroy({ children: true });
      r.stamps?.forEach((s) => s.destroy({ children: true }));
    }
    this.rows = [];
    b.papers.forEach((id, i) => {
      const pn = this.makePaper(id, this.paperLayer, 1);
      pn.node.position.set(this.L.papers[i].x, this.L.papers[i].y);
      if (pn.drag) pn.drag.home = { ...this.L.papers[i] };
      this.papers.push(pn);
    });
    b.claims.forEach((claim, i) => {
      const card = new Container();
      const w = CASE_CARD_W,
        h = CASE_CARD_H;
      card.addChild(
        new Graphics()
          .roundRect(-w / 2, -h / 2, w, h, 16)
          .fill(0xffffff)
          .stroke({ width: 5, color: wood.line }),
      );
      const pic = claimPicture(claim);
      pic.position.set(-40, 0);
      card.addChild(pic);
      // The speaker corner: a tap anywhere on the card says it.
      card.addChild(
        new Graphics()
          .poly([
            w / 2 - 44,
            -h / 2 + 18,
            w / 2 - 36,
            -h / 2 + 18,
            w / 2 - 26,
            -h / 2 + 10,
            w / 2 - 26,
            -h / 2 + 38,
            w / 2 - 36,
            -h / 2 + 30,
            w / 2 - 44,
            -h / 2 + 30,
          ])
          .fill(ink)
          .moveTo(w / 2 - 22 + 8 * Math.cos(-0.8), -h / 2 + 24 + 8 * Math.sin(-0.8))
          .arc(w / 2 - 22, -h / 2 + 24, 8, -0.8, 0.8)
          .stroke({ width: 3, color: ink }),
      );
      const mark = new Graphics();
      mark.position.set(w / 2 - 48, 16);
      card.addChild(mark);
      card.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
      onTap(card, () => this.tapClaim(i));
      this.rowLayer.addChild(card);
      let stamps: [Container, Container] | null = null;
      if (this.mode === 'tell') {
        stamps = (['shown', 'unknown'] as const).map((kind) => {
          const s = new Container();
          const face = new Graphics();
          stampFace(face, kind, STAMP_R - 6);
          s.addChild(new Graphics(), face);
          onTap(s, () => this.tapStamp(i, kind), { radius: STAMP_R });
          this.rowLayer.addChild(s);
          return s;
        }) as [Container, Container];
      }
      this.rows.push({ card, mark, stamps });
    });
    this.drawStamps();
    this.syncDrags();
  }

  private makePaper(id: PaperId, layer: Container, scale: number, slot = -1): PaperNode {
    const node = new Container();
    node.addChild(paperArt(id));
    // A slotted copy is drawn small; its hit area stays at least 100 units tall on screen.
    const hitH = Math.max(PAPER_H, 100 / scale);
    node.hitArea = new Rectangle(-PAPER_W / 2, -hitH / 2, PAPER_W, hitH);
    node.scale.set(scale);
    layer.addChild(node);
    const pn: PaperNode =
      slot >= 0
        ? ({ id, node, drag: null, travel: 0, down: null, slot } as CopyNode)
        : { id, node, drag: null, travel: 0, down: null };
    if (this.mode === 'tell') {
      onTap(node, () => this.read(pn));
      return pn;
    }
    pn.drag = draggable(node, this.ctx.tw, { onDrop: (x, y) => this.dropPaper(pn, x, y) });
    // Told apart from a drag by how far the finger went, since a held paper rides above the finger.
    node.on('pointerdown', (e: FederatedPointerEvent) => {
      if (this.busy || this.finished) return;
      pn.down = { x: e.global.x, y: e.global.y, id: e.pointerId };
      pn.travel = 0;
      sfx.pop(6);
    });
    node.on('globalpointermove', (e: FederatedPointerEvent) => {
      if (pn.down && pn.down.id === e.pointerId && pn.drag?.dragging)
        pn.travel = Math.max(
          pn.travel,
          Math.hypot(e.global.x - pn.down.x, e.global.y - pn.down.y) / this.view.scale,
        );
    });
    return pn;
  }

  /** The copies in the slots follow the board's state. */
  private syncCopies() {
    this.copiesDirty = false;
    for (const cn of this.copies) this.dropNode(cn);
    this.copies = [];
    if (this.mode !== 'sources') return;
    this.state.slots.forEach((id, slot) => {
      if (!id) return;
      const cn = this.makePaper(id, this.copyLayer, IN_SLOT, slot) as CopyNode;
      const p = this.L.slots[slot];
      cn.node.position.set(p.x, p.y);
      cn.drag!.home = { ...p };
      this.copies.push(cn);
    });
    this.syncDrags();
  }

  private syncDrags() {
    for (const pn of [...this.papers, ...this.copies])
      if (pn.drag) pn.drag.enabled = !this.busy && !this.finished;
  }

  private drawCheck() {
    const s = this.state;
    const full = s && (s.mode === 'sources' ? s.slots.every(Boolean) : s.stamps.every(Boolean));
    this.checkBtn.alpha = full ? 1 : 0.5;
  }

  private drawStamps(stamps: readonly (Stamp | null)[] = this.state.stamps) {
    this.rows.forEach((r, i) => {
      const pressed = stamps[i];
      r.mark.clear();
      if (pressed) stampFace(r.mark, pressed, 34);
      r.stamps?.forEach((s, k) => {
        const ring = s.children[0] as Graphics;
        const on = pressed === (k === 0 ? 'shown' : 'unknown');
        ring.clear();
        if (on) ring.circle(0, 0, STAMP_R).stroke({ width: 6, color: ink });
        s.children[1].alpha = on ? 0.55 : 1;
      });
    });
    this.drawCheck();
  }

  /* Touches --------------------------------------------------------------------------------------- */

  private read(pn: PaperNode) {
    if (this.busy || this.finished) return;
    readPaper(this.state, pn.id);
    sfx.brush();
    this.lit.set(pn.id, 1.6);
    const n = pn.node,
      k = n.scale.x;
    this.ctx.tw.kill(n.scale);
    void this.ctx.tw
      .to(n.scale, { x: k * 1.08, y: k * 1.08 }, { duration: 0.12 })
      .then(() => this.ctx.tw.to(n.scale, { x: k, y: k }, { duration: 0.25, ease: ease.outBack }));
    void this.ctx.say(PAPERS[pn.id].line);
  }

  private tapClaim(row: number) {
    if (this.busy || this.finished) return;
    const card = this.rows[row].card;
    this.ctx.tw.kill(card.scale);
    sfx.pop(5);
    void this.ctx.tw
      .to(card.scale, { x: 1.04, y: 1.04 }, { duration: 0.1 })
      .then(() => this.ctx.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.2 }));
    void this.ctx.say(CLAIM_TABLE[this.state.claims[row]].line);
  }

  private tapStamp(row: number, kind: Stamp) {
    if (this.busy || this.finished || this.state.done) return;
    stampClaim(this.state, row, this.state.stamps[row] === kind ? null : kind);
    sfx.knock();
    const m = this.rows[row].mark;
    m.scale.set(1.3);
    void this.ctx.tw.to(m.scale, { x: 1, y: 1 }, { duration: 0.18, ease: ease.outBack });
    this.drawStamps();
  }

  /** The slot a dropped paper lands in: the nearest one it is over (or over that slot's card), else -1. */
  private slotAt(x: number, y: number): number {
    const L = this.L;
    const near = L.slots
      .map((p, i) => ({ i, d: Math.hypot(p.x - x, p.y - y) }))
      .filter(({ i }) => {
        const p = L.slots[i],
          c = L.cards[i];
        const overSlot = Math.abs(x - p.x) <= CASE_SLOT / 2 + 50 && Math.abs(y - p.y) <= CASE_SLOT / 2 + 40;
        const overCard = Math.abs(x - c.x) <= CASE_CARD_W / 2 && Math.abs(y - c.y) <= CASE_CARD_H / 2;
        return overSlot || overCard;
      })
      .sort((a, b) => a.d - b.d);
    return near.length ? near[0].i : -1;
  }

  private dropPaper(pn: PaperNode, x: number, y: number): boolean {
    const tapped = pn.travel < TAP_TRAVEL;
    pn.down = null;
    if (this.busy || this.finished) return false;
    const from = 'slot' in pn ? (pn as CopyNode).slot : -1;
    if (tapped) {
      this.ctx.tw.kill(pn.node);
      pn.node.position.set(pn.drag!.home.x, pn.drag!.home.y);
      this.read(pn);
      return true;
    }
    const slot = this.slotAt(x, y);
    if (slot >= 0) {
      // A copy drops in; the original never leaves the table.
      if (from >= 0 && from !== slot) placePaper(this.state, from, null);
      placePaper(this.state, slot, pn.id);
      sfx.knock();
      this.copiesDirty = true;
      this.drawCheck();
      return from >= 0;
    }
    if (from >= 0) {
      // A copy dragged off its slot is put away.
      placePaper(this.state, from, null);
      sfx.pop(4);
      this.copiesDirty = true;
      this.drawCheck();
      return true;
    }
    return false;
  }

  private setBusy(b: boolean) {
    this.busy = b;
    this.syncDrags();
    if (!b && this.relayout) {
      this.relayout = false;
      this.layout();
    }
  }

  private gone(run: number) {
    return this.destroyed || run !== this.gen;
  }

  /* Check ----------------------------------------------------------------------------------------- */

  private async pressCheck() {
    const run = this.gen;
    if (this.busy || this.finished || this.state.done) return;
    const s = this.state;
    const glowBefore = s.glow;
    const shown = [...s.stamps];
    const res = checkCase(s);
    if (res.result === 'empty') {
      sfx.knock();
      for (const i of res.empty) for (const n of this.rows[i].stamps ?? [this.rows[i].card]) this.wiggle(n);
      void this.ctx.say(this.mode === 'sources' ? 'attic-finds.fill-slots' : 'attic-finds.stamp-all');
      return;
    }
    this.setBusy(true);
    const wrong = res.result === 'miss' ? res.wrong : [];
    for (let i = 0; i < s.claims.length; i++) {
      const w = wrong.find((x) => x.row === i);
      if (!w) {
        await this.lightRow(i);
        if (this.gone(run)) return;
        continue;
      }
      sfx.pluck(9);
      sfx.pluck(5);
      this.wiggle(this.rows[i].card);
      if (this.mode === 'sources') {
        const cn = this.copies.find((c) => c.slot === i);
        if (cn) void this.ctx.tw.to(cn.node, { y: cn.node.y - 30, alpha: 0 }, { duration: 0.35 });
      } else {
        // The wrong stamp pops off; the others stay until their turn.
        shown[i] = null;
        this.drawStamps(shown);
      }
      await this.ctx.say(w.reason);
      if (this.gone(run)) return;
    }
    if (res.result === 'miss') {
      sfx.boing();
      this.syncCopies();
      this.drawStamps();
      if (s.glow && !glowBefore) void this.ctx.say('attic-finds.hint-case');
      this.setBusy(false);
      return;
    }
    await this.boardDone();
  }

  /** A right row: the paper that shows it lights, or at "can't tell" every paper gently shakes. */
  private async lightRow(i: number) {
    const s = this.state;
    const answer = answerFor(s, i);
    sfx.pluck(8);
    sfx.pluck(11);
    const card = this.rows[i].card;
    void this.ctx.tw
      .to(card.scale, { x: 1.05, y: 1.05 }, { duration: 0.15 })
      .then(() => this.ctx.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.2 }));
    if (answer === 'unknown') {
      for (const pn of this.papers) this.wiggle(pn.node);
    } else {
      const p = this.mode === 'sources' ? (answer as PaperId) : supportingPaper(s.claims[i])!;
      this.lit.set(p, 0.9);
    }
    if (this.mode === 'tell')
      await this.ctx.say(answer === 'unknown' ? 'attic-finds.none-shows' : 'attic-finds.shows-it');
    else await this.ctx.tw.wait(0.75);
  }

  private wiggle(n: Container) {
    void this.ctx.tw
      .to(n, { rotation: 0.05 }, { duration: 0.08 })
      .then(() => this.ctx.tw.to(n, { rotation: -0.05 }, { duration: 0.1 }))
      .then(() => this.ctx.tw.to(n, { rotation: 0 }, { duration: 0.08 }));
  }

  private async boardDone() {
    const run = this.gen;
    sfx.bell(9);
    sfx.bell(12);
    this.ctx.pet.cheer();
    // A small picture of the board's papers goes up on the shelf.
    const mini = new Container();
    const g = new Graphics();
    for (let k = 0; k < 3; k++)
      g.roundRect(-34 + k * 8, -26 - k * 4, 60, 44, 6)
        .fill(PAPER)
        .stroke({ width: 3, color: wood.line });
    tick(g, 4, -30);
    mini.addChild(g);
    const spot = this.L.shelf[this.index];
    mini.position.set(this.L.cards[0].x, this.L.cards[0].y);
    this.shelfLayer.addChild(mini);
    this.shelved.push(mini);
    void this.ctx.tw.to(mini, { x: spot.x, y: spot.y }, { duration: 0.6, ease: ease.inOutSine });
    await this.ctx.say('attic-finds.board-done');
    if (this.gone(run)) return;
    this.banked.misses += this.state.misses;
    this.banked.hints += this.state.hints;
    this.state.misses = 0;
    this.state.hints = 0;
    if (this.index + 1 >= this.round.boards.length) {
      await this.finale();
      return;
    }
    this.index++;
    this.buildBoard();
    this.layout();
    this.setBusy(false);
  }

  private async finale() {
    const run = this.gen;
    this.finished = true;
    this.syncDrags();
    sfx.tada();
    void this.ctx.say('attic-finds.case-done');
    await this.ctx.tw.wait(1.4);
    if (this.gone(run)) return;
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /* Help ------------------------------------------------------------------------------------------ */

  askForHint() {
    if (this.finished || this.busy || this.state.done) return;
    helpCase(this.state);
    void this.ctx.say('attic-finds.hint-case');
  }

  restart() {
    if (this.finished || this.state.done) return;
    this.gen++;
    this.relayout = false;
    this.banked.misses += this.state.misses;
    this.banked.hints += this.state.hints;
    for (const n of this.shelved) {
      this.ctx.tw.kill(n);
      n.destroy({ children: true });
    }
    this.shelved = [];
    this.index = 0;
    this.busy = false;
    this.buildBoard();
    this.layout();
    this.setBusy(false);
  }

  /* Frame ----------------------------------------------------------------------------------------- */

  update(dt: number) {
    this.t += dt;
    if (this.copiesDirty && !this.copies.some((c) => c.drag?.dragging)) this.syncCopies();
    this.glow.clear();
    for (const [id, left] of this.lit) {
      if (left - dt <= 0) this.lit.delete(id);
      else this.lit.set(id, left - dt);
      const n = this.papers.find((p) => p.id === id)?.node;
      if (n)
        this.glow
          .roundRect(n.x - PAPER_W / 2 - 8, n.y - PAPER_H / 2 - 8, PAPER_W + 16, PAPER_H + 16, 16)
          .fill({ color: swatch.yellow.light, alpha: 0.5 * Math.min(1, left * 2) });
    }
    const hint = this.finished || !this.state ? null : glowFor(this.state);
    if (hint) {
      const pulse = 0.5 + 0.5 * Math.sin(this.t * 5);
      const ring = (x: number, y: number, w: number, h: number, r: number) =>
        this.glow
          .roundRect(x - w / 2 - 8, y - h / 2 - 8, w + 16, h + 16, r)
          .fill({ color: swatch.yellow.light, alpha: 0.3 + 0.25 * pulse })
          .stroke({ width: 6, color: swatch.yellow.fill, alpha: 0.6 + 0.4 * pulse });
      const paper =
        this.mode === 'sources' ? (hint.answer as PaperId) : supportingPaper(this.state.claims[hint.row]);
      const pn = paper ? this.papers.find((p) => p.id === paper) : null;
      if (pn) ring(pn.node.x, pn.node.y, PAPER_W, PAPER_H, 18);
      if (this.mode === 'sources') {
        const p = this.L.slots[hint.row];
        ring(p.x, p.y, CASE_SLOT, CASE_SLOT, 18);
      } else {
        const p = this.L.stamps[hint.row][hint.answer === 'shown' ? 0 : 1];
        ring(p.x, p.y, 2 * STAMP_R, 2 * STAMP_R, STAMP_R + 8);
      }
    }
  }

  resize(view: View) {
    this.view = view;
    this.L = placeCase(view, this.plan.id);
    this.layout();
  }

  /* Bot ------------------------------------------------------------------------------------------- */

  autotouch(): TouchIntent | null {
    if (
      this.busy ||
      this.finished ||
      this.copiesDirty ||
      [...this.papers, ...this.copies].some((p) => p.drag?.dragging)
    )
      return null;
    const s = this.state;
    // One free read first, so the demonstration shows reading costs nothing.
    if (s.read.size === 0) return { tap: { on: this.papers[0].node }, pause: 1.6 };
    for (let i = 0; i < s.claims.length; i++) {
      const answer = answerFor(s, i);
      if (s.mode === 'sources') {
        if (s.slots[i] === answer) continue;
        const pn = this.papers.find((p) => p.id === answer)!;
        const to = this.L.slots[i];
        return { drag: { on: pn.node }, to: { on: this.ctx.stage, x: to.x, y: to.y }, pause: 0.6 };
      }
      if (s.stamps[i] === answer) continue;
      return { tap: { on: this.rows[i].stamps![answer === 'shown' ? 0 : 1] }, pause: 0.5 };
    }
    return { tap: { on: this.checkBtn } };
  }

  destroy() {
    this.destroyed = true;
    for (const pn of [...this.papers, ...this.copies]) pn.drag?.destroy();
  }
}
