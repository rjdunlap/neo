import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { puffs } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  answer, BADGE_R, BRUSH, CARD, caseOf, cellCenter, check, CHECK_R, COLS, digLayout, digState, edgePoint, FLAG, FLAGS, glowing,
  help, leafOf, leafOutline, MAG_R, makeRound, nextBrush, pat, pickLeaf, planFor, RECORD_H, RECORD_W, returnLeaf, ROWS, SLOT, stepOf,
  stoneAt, STONE_H, STONE_W, tapFlag, type DigLayout, type DigState, type FlagId, type LeafId, type Plan, type Pt, type Round,
} from './logic';

const LEVELS: BandLevels = { prek: { min: 1, max: 2 } };

/** Each level's authored first round leads its first round of a session. */
const authoredShown = new Set<number>();

const STONE = { fill: 0xb9ab98, line: 0x8c7d6a, print: 0x857766, printLine: 0x5e5246 };
const DUST = { fill: 0xe6d3a8, line: 0xc4ab7a };
const CLIFF = 0xe8cc9a;
const PIT = { fill: 0xa98058, line: 0x7d5a3a };
const LEAF = { fill: swatch.green.fill, line: swatch.green.line, vein: swatch.green.light };
const FLAG_COLOR: Record<FlagId, { fill: number; line: number }> = { red: swatch.red, blue: swatch.blue, yellow: swatch.yellow };
/** A finger's reach on screen; the stone is drawn smaller than its own units, so the brush reaches further in them. */
const BRUSH_SCREEN = 55;
const TRACE_TIME = 0.9;
const IDLE_WIGGLE = 7;

/* Art -------------------------------------------------------------------------------------------- */

function polyOf(pts: Pt[]): number[] {
  return pts.flatMap((p) => [p.x, p.y]);
}

/** The leaf's centre and the ends of its veins, in stone units. */
function veins(id: LeafId): { stem: [Pt, Pt]; lines: [Pt, Pt][] } {
  if (leafOf(id).outline === 'lobed') {
    const c = { x: 0, y: 15 };
    const lines: [Pt, Pt][] = [0, 1, 2, 3, 4].map((k) => {
      const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
      return [c, { x: c.x + Math.cos(a) * 128 * 0.85 * 1.25, y: c.y + Math.sin(a) * 128 * 0.85 }];
    });
    return { stem: [{ x: 0, y: 55 }, { x: 0, y: 120 }], lines };
  }
  const tilt = -0.32, at = (t: number): Pt => ({ x: 175 * t * Math.cos(tilt), y: 175 * t * Math.sin(tilt) });
  return { stem: [at(-0.95), at(-1.18)], lines: [[at(-0.95), at(0.92)], ...[-0.5, 0, 0.5].flatMap((t): [Pt, Pt][] => [[at(t), { x: at(t + 0.25).x + 30, y: at(t + 0.25).y - 40 }], [at(t), { x: at(t + 0.25).x - 20, y: at(t + 0.25).y + 45 }]])] };
}

/** A leaf as a green pinned leaf (a reference) or as a print pressed into the stone. */
function leafArt(id: LeafId, kind: 'leaf' | 'print'): Graphics {
  const g = new Graphics();
  const pts = leafOutline(id);
  const v = veins(id);
  const fill = kind === 'leaf' ? LEAF.fill : STONE.print, line = kind === 'leaf' ? LEAF.line : STONE.printLine;
  const vein = kind === 'leaf' ? LEAF.vein : STONE.printLine;
  g.moveTo(v.stem[0].x, v.stem[0].y).lineTo(v.stem[1].x, v.stem[1].y).stroke({ width: 10, color: line, cap: 'round' });
  g.poly(polyOf(pts)).fill(fill).stroke({ width: kind === 'leaf' ? 7 : 6, color: line, join: 'round' });
  for (const [a, b] of v.lines) g.moveTo(a.x, a.y).lineTo(b.x, b.y);
  g.stroke({ width: 5, color: vein, cap: 'round', alpha: kind === 'leaf' ? 1 : 0.7 });
  return g;
}

function flagArt(id: FlagId, size = 1): Graphics {
  const f = FLAGS.find((x) => x.id === id)!, c = FLAG_COLOR[id];
  const g = new Graphics().moveTo(-30 * size, 48 * size).lineTo(-30 * size, -46 * size).stroke({ width: 7 * size, color: wood.line, cap: 'round' });
  const cx = 8 * size, cy = -20 * size, r = 26 * size;
  if (f.shape === 'circle') g.circle(cx, cy, r);
  else if (f.shape === 'triangle') g.poly([cx - r, cy + r * 0.85, cx, cy - r, cx + r, cy + r * 0.85]);
  else g.rect(cx - r * 0.9, cy - r * 0.9, r * 1.8, r * 1.8);
  return g.fill(c.fill).stroke({ width: 5 * size, color: c.line, join: 'round' });
}

function stoneBase(): Graphics {
  const g = new Graphics().roundRect(-STONE_W / 2, -STONE_H / 2, STONE_W, STONE_H, 36).fill(STONE.fill).stroke({ width: 8, color: STONE.line });
  for (const [x, y, r] of [[-150, -110, 6], [130, -100, 5], [160, 95, 7], [-170, 100, 5], [40, 120, 4], [-60, -125, 4]]) g.circle(x, y, r);
  return g.fill({ color: STONE.line, alpha: 0.5 });
}

/** A magnifying glass on a round button. */
function lookArt(r: number): Graphics {
  return new Graphics().circle(0, 0, r).fill(0xffffff).stroke({ width: 5, color: wood.line })
    .moveTo(10, 10).lineTo(30, 30).stroke({ width: 12, color: wood.line, cap: 'round' })
    .circle(-6, -6, 22).fill(swatch.teal.light).stroke({ width: 7, color: ink });
}

/* The game --------------------------------------------------------------------------------------- */

interface CardNode { leaf: LeafId; node: Container; art: Graphics; trace: Graphics; badge: Container }
interface Trace { g: Graphics; pts: Pt[]; color: number; t: number }

class FossilDig implements Game {
  readonly plan: Plan;
  readonly round: Round;
  readonly hintLabel = 'Show a hint';
  state: DigState;
  busy = true;
  finished = false;
  /** What the magnifier shows, if open: the print, or a reference leaf. */
  open: 'print' | LeafId | null = null;
  /** Edges looked at in the magnifier. */
  readonly looked = new Set<'print' | LeafId>();
  banked = { misses: 0, hints: 0 };

  private L: DigLayout;
  private view: View;
  private readonly bg = new Graphics();
  private readonly pits = new Graphics();
  private readonly flagNodes: Container[] = [];
  readonly stoneNode = new Container();
  private readonly print: Graphics;
  private readonly dust = new Graphics();
  private readonly printTrace = new Graphics();
  private readonly stoneGlow = new Graphics();
  private cards: CardNode[] = [];
  readonly record = new Container();
  readonly whereSlot = new Container();
  readonly likeSlot = new Container();
  readonly checkBtn = new Container();
  private readonly ghostFlag = flagArt('red', 0.9);
  private readonly ghostLeaf = leafArt('star', 'leaf');
  private readonly whereArt = new Container();
  private readonly likeArt = new Container();
  private readonly stamp = new Container();
  private readonly book = new Graphics();
  private readonly mag = new Container();
  private readonly magContent = new Container();
  private readonly glow = new Graphics();
  private readonly brushing = new Map<number, Pt>();
  private traces: Trace[] = [];
  private emptyFlash: { site: number; t: number } | null = null;
  private wave = 0;
  private lastBrushSound = 0;
  private idle = 0;
  private wiggled = false;
  private t = 0;
  private destroyed = false;
  /** Bumped by Start again, so a continuation from before it stops. */
  private epoch = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const first = !authoredShown.has(this.plan.id) && !ctx.demo;
    if (first) authoredShown.add(this.plan.id);
    this.round = makeRound(this.plan.id, ctx.rng, first);
    this.state = digState(this.round);
    this.L = digLayout(ctx.view, this.plan.id);

    this.bg.eventMode = 'static';
    this.bg.on('pointerdown', () => { this.touched(); this.closeMag(); });
    this.pits.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.mag.eventMode = 'none';
    this.book.eventMode = 'none';

    // The stone: its print under the dust, brushed by any touch on it.
    const find = caseOf(this.round.caseId).find;
    this.print = leafArt(find, 'print');
    this.dust.eventMode = 'none';
    this.printTrace.eventMode = 'none';
    this.stoneGlow.eventMode = 'none';
    this.stoneNode.addChild(this.stoneGlow, stoneBase(), this.print, this.printTrace, this.dust);
    this.stoneNode.eventMode = 'static';
    this.stoneNode.cursor = 'pointer';
    this.stoneNode.hitArea = new Rectangle(-STONE_W / 2, -STONE_H / 2, STONE_W, STONE_H);
    this.stoneNode.on('pointerdown', (e) => this.brushDown(e));
    this.stoneNode.on('globalpointermove', (e) => this.brushMove(e));
    this.stoneNode.on('pointerup', this.lift);
    this.stoneNode.on('pointerupoutside', this.lift);
    window.addEventListener('pointerup', this.lift, true);
    window.addEventListener('pointercancel', this.lift, true);

    FLAGS.forEach((f, i) => {
      const node = new Container();
      node.addChild(flagArt(f.id));
      node.hitArea = new Rectangle(-FLAG / 2, -FLAG / 2, FLAG, FLAG);
      onTap(node, () => { this.touched(); void this.tapFlagAt(i); }, { cooldown: 300 });
      this.flagNodes.push(node);
    });

    for (const leaf of this.round.order) {
      const node = new Container();
      const art = leafArt(leaf, 'leaf');
      art.scale.set(0.3);
      art.y = -8;
      const trace = new Graphics();
      trace.scale.set(0.3);
      trace.y = -8;
      node.addChild(
        new Graphics().roundRect(-CARD / 2, -CARD / 2, CARD, CARD, 16).fill(0xffffff).stroke({ width: 5, color: wood.line }),
        art, trace,
        new Graphics().circle(0, -CARD / 2 + 12, 8).fill(swatch.red.fill).stroke({ width: 3, color: swatch.red.line }),
      );
      node.hitArea = new Rectangle(-CARD / 2, -CARD / 2, CARD, CARD);
      onTap(node, () => { this.touched(); this.tapLeaf(leaf); }, { cooldown: 300 });
      const badge = new Container();
      badge.addChild(lookArt(BADGE_R));
      badge.hitArea = new Circle(0, 0, BADGE_R + 4);
      onTap(badge, () => { this.touched(); this.openMag(leaf); }, { cooldown: 300 });
      this.cards.push({ leaf, node, art, trace, badge });
    }

    // The record card: Where, Like and Check.
    const paper = new Graphics().roundRect(0, 0, RECORD_W, RECORD_H, 18).fill(cream).stroke({ width: 5, color: wood.line });
    for (let y = 40; y < RECORD_H; y += 34) paper.moveTo(16, y).lineTo(RECORD_W - 16, y).stroke({ width: 2, color: swatch.blue.light });
    paper.eventMode = 'none';
    this.record.addChild(paper);
    const slotArt = (ghost: Graphics) => {
      const c = new Container();
      c.addChild(new Graphics().roundRect(-SLOT / 2, -SLOT / 2, SLOT, SLOT, 16).fill(0xffffff).stroke({ width: 5, color: wood.line }), ghost);
      return c;
    };
    const ghostFlag = this.ghostFlag;
    ghostFlag.tint = 0xdddddd;
    ghostFlag.alpha = 0.35;
    const ghostLeaf = this.ghostLeaf;
    ghostLeaf.scale.set(0.24);
    ghostLeaf.tint = 0xdddddd;
    ghostLeaf.alpha = 0.35;
    this.whereSlot.addChild(slotArt(ghostFlag), this.whereArt);
    this.likeSlot.addChild(slotArt(ghostLeaf), this.likeArt);
    this.whereSlot.eventMode = 'none';
    this.likeSlot.hitArea = new Rectangle(-SLOT / 2, -SLOT / 2, SLOT, SLOT);
    onTap(this.likeSlot, () => { this.touched(); this.tapLikeSlot(); }, { cooldown: 300 });
    this.checkBtn.addChild(
      new Graphics().circle(0, 0, CHECK_R).fill(swatch.green.fill).stroke({ width: 5, color: swatch.green.line }),
      new Graphics().moveTo(-20, 0).lineTo(-6, 16).lineTo(22, -16).stroke({ width: 9, color: 0xffffff, cap: 'round', join: 'round' }),
    );
    onTap(this.checkBtn, () => { this.touched(); void this.pressCheck(); }, { radius: CHECK_R + 4, cooldown: 400 });
    this.stamp.visible = false;
    this.record.addChild(this.whereSlot, this.likeSlot, this.checkBtn, this.stamp);

    // The magnifier: a round window onto an edge, drawn large.
    const mask = new Graphics().circle(0, 0, MAG_R - 10).fill(0xffffff);
    this.magContent.mask = mask;
    this.mag.addChild(
      new Graphics().moveTo(MAG_R * 0.7, MAG_R * 0.7).lineTo(MAG_R * 1.0, MAG_R * 1.0).stroke({ width: 22, color: wood.line, cap: 'round' })
        .circle(0, 0, MAG_R).fill(cream),
      this.magContent, mask,
      new Graphics().circle(0, 0, MAG_R).stroke({ width: 12, color: wood.line }).ellipse(-55, -75, 38, 16).fill({ color: 0xffffff, alpha: 0.35 }),
    );
    this.mag.visible = false;

    ctx.stage.addChild(this.bg, this.pits, this.book, ...this.flagNodes, this.stoneNode, ...this.cards.flatMap((c) => [c.node, c.badge]), this.record, this.mag, this.glow);
    this.drawDust();
    this.drawSlots();
    this.layout();
  }

  get misses() {
    return this.banked.misses + this.state.misses;
  }

  get hints() {
    return this.banked.hints + this.state.hints;
  }

  get find(): LeafId {
    return caseOf(this.round.caseId).find;
  }

  start() {
    void this.ctx.instruct('fossil-dig.instruct-brush');
    this.busy = false;
  }

  /* Drawing --------------------------------------------------------------------------------------- */

  private layout() {
    const v = this.view, L = this.L;
    this.bg.clear().rect(0, 0, v.w, v.h).fill(swatch.blue.light);
    const cliffTop = L.flags[0].y - 40;
    this.bg.rect(0, cliffTop, v.w, v.h - cliffTop).fill(CLIFF);
    for (let y = cliffTop + 30; y < v.h; y += 55) this.bg.moveTo(0, y).bezierCurveTo(v.w * 0.3, y + 14, v.w * 0.6, y - 12, v.w, y + 6);
    this.bg.stroke({ width: 4, color: 0xd4b27c, alpha: 0.7 });
    this.bg.hitArea = new Rectangle(0, 0, v.w, v.h);
    this.pits.clear();
    for (const s of L.squares) {
      this.pits.roundRect(s.x, s.y, s.w, s.h, 14).fill(PIT.fill).stroke({ width: 5, color: PIT.line });
      this.pits.roundRect(s.x + 10, s.y + 10, s.w - 20, 14, 7).fill({ color: PIT.line, alpha: 0.5 });
    }
    const b = L.book;
    this.book.clear().roundRect(b.x, b.y, b.w, b.h, 10).fill(swatch.brown.line).roundRect(b.x + 8, b.y + 6, b.w - 14, b.h - 12, 6).fill(cream)
      .moveTo(b.x + b.w / 2, b.y + 6).lineTo(b.x + b.w / 2, b.y + b.h - 6).stroke({ width: 3, color: swatch.brown.line });
    this.flagNodes.forEach((n, i) => n.position.set(L.flags[i].x, L.flags[i].y));
    const at = stoneAt(L, this.round.site);
    this.stoneNode.position.set(at.x, at.y);
    this.stoneNode.scale.set(L.scale);
    this.cards.forEach((c, i) => {
      c.node.position.set(L.cards[i].x, L.cards[i].y);
      c.badge.position.set(L.badges[i].x, L.badges[i].y);
    });
    if (!this.finished) {
      this.record.position.set(L.record.x, L.record.y);
      this.record.scale.set(1);
    }
    const local = (p: Pt) => ({ x: p.x - L.record.x, y: p.y - L.record.y });
    this.whereSlot.position.copyFrom(local(L.whereSlot));
    this.likeSlot.position.copyFrom(local(L.likeSlot));
    this.checkBtn.position.copyFrom(local(L.check));
    this.stamp.position.set(RECORD_W - 34, 30);
    this.mag.position.copyFrom(L.magnifier[this.round.site]);
  }

  private drawDust() {
    const circles: [number, number, number][] = [];
    for (let i = 0; i < COLS * ROWS; i++) {
      if (this.state.cleared[i]) continue;
      const c = cellCenter(i), j = (i * 37) % 11;
      circles.push([c.x, c.y, 31], [c.x + (j % 3) * 6 - 6, c.y - 10 + (j % 4) * 4, 22]);
    }
    this.dust.clear();
    if (circles.length) puffs(this.dust, circles, DUST.fill, DUST.line, 5);
    for (let i = 0; i < COLS * ROWS; i++) {
      if (this.state.cleared[i]) continue;
      const c = cellCenter(i);
      this.dust.circle(c.x - 12, c.y + 8, 3).circle(c.x + 10, c.y - 6, 2.5);
    }
    this.dust.fill({ color: DUST.line, alpha: 0.6 });
  }

  private drawSlots() {
    this.whereArt.removeChildren().forEach((c) => c.destroy());
    this.likeArt.removeChildren().forEach((c) => c.destroy());
    if (this.state.where) this.whereArt.addChild(flagArt(this.state.where, 0.95));
    if (this.state.like) {
      const g = leafArt(this.state.like, 'leaf');
      g.scale.set(0.24);
      this.likeArt.addChild(g);
    }
    this.ghostFlag.visible = !this.state.where;
    this.ghostLeaf.visible = !this.state.like;
    for (const c of this.cards) c.node.alpha = this.state.like === c.leaf ? 0.4 : 1;
    this.checkBtn.alpha = this.state.where && this.state.like ? 1 : 0.45;
  }

  private drawGlow() {
    this.glow.clear();
    const g = glowing(this.state);
    const pulse = 1 + 0.06 * Math.sin(this.t * 5);
    if (g) {
      const site = FLAGS.findIndex((f) => f.id === g);
      if (site >= 0) {
        const p = this.L.flags[site], h = (FLAG / 2 + 10) * pulse;
        this.glow.roundRect(p.x - h, p.y - h, 2 * h, 2 * h, 20).stroke({ width: 8, color: swatch.yellow.fill });
      } else {
        const card = this.cards.find((c) => c.leaf === g);
        if (card) {
          const h = (CARD / 2 + 10) * pulse;
          this.glow.roundRect(card.node.x - h, card.node.y - h, 2 * h, 2 * h, 22).stroke({ width: 8, color: swatch.yellow.fill });
        }
      }
    }
    if (this.emptyFlash) {
      const s = this.L.squares[this.emptyFlash.site];
      this.glow.roundRect(s.x, s.y, s.w, s.h, 14).fill({ color: 0xffffff, alpha: 0.4 * (1 - this.emptyFlash.t / 0.8) });
    }
  }

  /* Brushing -------------------------------------------------------------------------------------- */

  private readonly lift = (e: { pointerId: number }) => {
    this.brushing.delete(e.pointerId);
  };

  private stoneLocal(e: FederatedPointerEvent): Pt | null {
    const p = this.stoneNode.toLocal(e.global);
    return Number.isFinite(p.x) ? { x: p.x, y: p.y } : null;
  }

  private brushDown(e: FederatedPointerEvent) {
    if (this.finished || palmOnGlass()) return;
    this.touched();
    const p = this.stoneLocal(e);
    if (!p) return;
    const wasShown = this.state.shown;
    this.brushing.set(e.pointerId, p);
    this.brushAt(p);
    // Once the print shows, a touch on the stone also looks at its edge up close.
    if (wasShown && !this.busy) this.openMag('print');
  }

  private brushMove(e: FederatedPointerEvent) {
    const last = this.brushing.get(e.pointerId);
    if (!last || this.finished) return;
    const p = this.stoneLocal(e);
    if (!p) return;
    this.touched();
    const d = Math.hypot(p.x - last.x, p.y - last.y);
    const steps = Math.max(1, Math.ceil(d / 20));
    for (let k = 1; k <= steps; k++) this.brushAt({ x: last.x + ((p.x - last.x) * k) / steps, y: last.y + ((p.y - last.y) * k) / steps });
    this.brushing.set(e.pointerId, p);
  }

  private brushAt(p: Pt) {
    if (Math.abs(p.x) > STONE_W / 2 + 20 || Math.abs(p.y) > STONE_H / 2 + 20) return;
    const reach = Math.max(BRUSH, BRUSH_SCREEN / this.L.scale);
    const r = pat(this.state, p, reach);
    if (r.cells.length) {
      this.drawDust();
      const g = this.stoneNode.toGlobal(p);
      const stage = this.ctx.stage.toLocal(g);
      this.ctx.particles.burst(stage.x, stage.y, { colors: [DUST.fill, DUST.line], count: 4 + r.cells.length * 2, speed: [40, 140], gravity: 160, life: [0.3, 0.7] });
      if (this.t - this.lastBrushSound > 0.1) {
        this.lastBrushSound = this.t;
        sfx.brush();
      }
    }
    if (r.shownNow) void this.onShown();
  }

  private async onShown() {
    this.busy = true;
    sfx.marimba(7);
    sfx.marimba(9, 0.15);
    this.wave = 3;
    this.addTrace(this.printTrace, leafOutline(this.find), swatch.yellow.fill);
    const epoch = this.epoch;
    await this.ctx.say('fossil-dig.found');
    if (this.destroyed || epoch !== this.epoch) return;
    this.busy = false;
    if (stepOf(this.state) === 'where') void this.ctx.instruct('fossil-dig.instruct-where');
  }

  /* Where ------------------------------------------------------------------------------------------ */

  private async tapFlagAt(site: number) {
    if (this.busy || this.finished) return;
    const flag = FLAGS[site];
    const node = this.flagNodes[site];
    const r = tapFlag(this.state, flag.id);
    if (r === 'ignored') return;
    if (r === 'early') {
      this.wiggle(node);
      void this.ctx.say('fossil-dig.brush-first');
      return;
    }
    this.closeMag();
    if (r === 'right') {
      sfx.knock();
      sfx.clunk();
      this.drawSlots();
      this.whereArt.scale.set(1.5);
      void this.ctx.tw.to(this.whereArt.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
      this.busy = true;
      const epoch = this.epoch;
      await this.ctx.say('fossil-dig.where-recorded', { flag: flag.name });
      if (this.destroyed || epoch !== this.epoch) return;
      this.busy = false;
      void this.ctx.instruct(this.plan.id === 1 ? 'fossil-dig.instruct-shape' : 'fossil-dig.instruct-edge');
      return;
    }
    sfx.boing();
    this.wiggle(node);
    this.emptyFlash = { site, t: 0 };
    this.busy = true;
    const epoch = this.epoch;
    await this.ctx.say('fossil-dig.wrong-flag', { flag: flag.name });
    if (this.destroyed || epoch !== this.epoch) return;
    this.busy = false;
    if (glowing(this.state)) void this.ctx.say('fossil-dig.hint-flag');
  }

  /* Like and Check -------------------------------------------------------------------------------- */

  private stepLine() {
    const step = stepOf(this.state);
    return step === 'brush' ? 'fossil-dig.brush-first' : step === 'where' ? 'fossil-dig.instruct-where' : this.plan.id === 1 ? 'fossil-dig.instruct-shape' : 'fossil-dig.instruct-edge';
  }

  private tapLeaf(leaf: LeafId) {
    if (this.busy || this.finished) return;
    const card = this.cards.find((c) => c.leaf === leaf)!;
    const r = pickLeaf(this.state, leaf);
    if (r === 'ignored') return;
    if (r === 'early') {
      this.wiggle(card.node);
      void this.ctx.say(this.stepLine());
      return;
    }
    sfx.pop(r === 'placed' ? 9 : 5);
    this.drawSlots();
    if (r === 'placed') {
      this.likeArt.scale.set(0.6);
      void this.ctx.tw.to(this.likeArt.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    }
  }

  private tapLikeSlot() {
    if (this.busy || this.finished) return;
    if (returnLeaf(this.state)) {
      sfx.pop(5);
      this.drawSlots();
    }
  }

  private async pressCheck() {
    if (this.busy || this.finished) return;
    const chosen = this.state.like;
    const r = check(this.state);
    if (r === 'ignored') return;
    if (r === 'early') {
      this.wiggle(this.checkBtn);
      void this.ctx.say(this.stepLine());
      return;
    }
    if (r === 'empty') {
      sfx.boing();
      this.wiggle(this.likeSlot);
      void this.ctx.say('fossil-dig.empty-slot');
      return;
    }
    this.closeMag();
    const c = caseOf(this.round.caseId);
    const card = this.cards.find((k) => k.leaf === chosen)!;
    this.busy = true;
    this.drawSlots();
    if (r === 'miss') {
      sfx.boing();
      this.wiggle(card.node);
      this.addTrace(card.trace, leafOutline(card.leaf), swatch.red.fill);
      const line = c.feature === 'outline'
        ? (chosen === 'ribbon' ? 'fossil-dig.not-ribbon' : 'fossil-dig.not-star-shape')
        : (chosen === 'star' ? 'fossil-dig.not-star-edge' : 'fossil-dig.not-saw-star');
      const epoch = this.epoch;
      await this.ctx.say(line);
      if (this.destroyed || epoch !== this.epoch) return;
      this.busy = false;
      if (glowing(this.state)) this.showHelp();
      return;
    }
    sfx.bell(9);
    this.addTrace(this.printTrace, leafOutline(this.find), swatch.yellow.fill);
    this.addTrace(card.trace, leafOutline(card.leaf), swatch.yellow.fill);
    const find = leafOf(this.find);
    const line = c.feature === 'outline'
      ? (find.outline === 'lobed' ? 'fossil-dig.match-lobed' : 'fossil-dig.match-unlobed')
      : (find.margin === 'toothed' ? 'fossil-dig.match-toothed' : 'fossil-dig.match-smooth');
    if (this.plan.id === 2) this.showStamp(find.margin === 'toothed');
    await this.ctx.say(line, { leaf: leafOf(answer(c)).name });
    if (this.destroyed) return;
    await this.file();
  }

  /** The level-2 edge stamp: the feature that decided it. */
  private showStamp(toothed: boolean) {
    const g = new Graphics().circle(0, 0, 26).fill(swatch.green.light).stroke({ width: 4, color: swatch.green.line });
    const pts: number[] = [];
    for (let k = 0; k <= 8; k++) pts.push(-18 + k * 4.5, toothed ? (k % 2 ? -6 : 4) : 0);
    g.poly(pts, false).stroke({ width: 4, color: swatch.green.line, join: 'miter' });
    this.stamp.removeChildren().forEach((c) => c.destroy());
    this.stamp.addChild(g);
    this.stamp.visible = true;
    this.stamp.scale.set(1.8);
    void this.ctx.tw.to(this.stamp.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
  }

  /** The record card slides into the field notebook, and the round is done. */
  private async file() {
    this.finished = true;
    this.glow.clear();
    void this.ctx.say('fossil-dig.recorded');
    const b = this.L.book, k = b.w / RECORD_W;
    await this.ctx.tw.wait(0.5);
    if (this.destroyed) return;
    void this.ctx.tw.to(this.record.scale, { x: k, y: k }, { duration: 0.7, ease: ease.inOutSine });
    await this.ctx.tw.to(this.record, { x: b.x, y: b.y + 10 }, { duration: 0.7, ease: ease.inOutSine });
    if (this.destroyed) return;
    this.record.visible = false;
    sfx.bell(7);
    sfx.bell(11, 0.2);
    this.ctx.particles.burst(b.x + b.w / 2, b.y + b.h / 2, { kind: 'star', colors: [swatch.yellow.fill, 0xffffff], count: 14, speed: [80, 220], gravity: 0, life: [0.5, 0.9] });
    this.ctx.pet.cheer();
    sfx.tada();
    await this.ctx.say('fossil-dig.done');
    if (this.destroyed) return;
    await this.ctx.tw.wait(0.3);
    if (this.destroyed) return;
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /* Magnifier ------------------------------------------------------------------------------------- */

  openMag(which: 'print' | LeafId) {
    if (this.finished) return;
    const leaf = which === 'print' ? this.find : which;
    if (which === 'print' && !this.state.shown) return;
    const fresh = this.open !== which;
    this.open = which;
    this.looked.add(which);
    this.magContent.removeChildren().forEach((c) => c.destroy());
    const art = leafArt(leaf, which === 'print' ? 'print' : 'leaf');
    const bgArt = which === 'print' ? new Graphics().rect(-MAG_R, -MAG_R, 2 * MAG_R, 2 * MAG_R).fill(STONE.fill) : null;
    const k = 2.2, e = edgePoint(leaf);
    art.scale.set(k);
    art.position.set(-e.x * k, -e.y * k);
    if (bgArt) this.magContent.addChild(bgArt);
    this.magContent.addChild(art);
    this.mag.visible = true;
    if (fresh) {
      this.mag.scale.set(0.6);
      void this.ctx.tw.to(this.mag.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
      sfx.pop(8);
      // Level 1 asks about the shape, so the edge is only said where it decides.
      if (this.plan.id === 2) void this.ctx.say(leafOf(leaf).margin === 'toothed' ? 'fossil-dig.edge-toothed' : 'fossil-dig.edge-smooth');
    }
  }

  private closeMag() {
    if (!this.open) return;
    this.open = null;
    this.mag.visible = false;
  }

  /* Help ------------------------------------------------------------------------------------------ */

  private showHelp() {
    const step = stepOf(this.state);
    if (step === 'where') void this.ctx.say('fossil-dig.hint-flag');
    else if (step === 'like') {
      if (this.plan.id === 2) this.openMag('print');
      void this.ctx.say('fossil-dig.hint-leaf');
    }
  }

  askForHint() {
    if (this.finished) return;
    if (stepOf(this.state) === 'brush') {
      void this.ctx.say('fossil-dig.instruct-brush');
      return;
    }
    help(this.state);
    if (!this.busy) this.showHelp();
  }

  restart() {
    if (this.finished) return;
    this.banked.misses += this.state.misses;
    this.banked.hints += this.state.hints;
    this.epoch++;
    this.state = digState(this.round);
    this.brushing.clear();
    this.wave = 0;
    this.flagNodes.forEach((n) => (n.rotation = 0));
    this.emptyFlash = null;
    this.wiggled = false;
    this.looked.clear();
    this.closeMag();
    this.traces = [];
    this.printTrace.clear();
    for (const c of this.cards) c.trace.clear();
    this.stamp.visible = false;
    this.drawDust();
    this.drawSlots();
    this.busy = false;
    void this.ctx.instruct('fossil-dig.instruct-brush');
  }

  /* Frame ----------------------------------------------------------------------------------------- */

  private touched() {
    this.idle = 0;
  }

  private wiggle(node: Container) {
    void this.ctx.tw.to(node, { rotation: 0.1 }, { duration: 0.08 }).then(() => this.ctx.tw.to(node, { rotation: 0 }, { duration: 0.3, ease: ease.outBack }));
  }

  private addTrace(g: Graphics, pts: Pt[], color: number) {
    this.traces = this.traces.filter((t) => t.g !== g);
    this.traces.push({ g, pts, color, t: 0 });
  }

  update(dt: number) {
    this.t += dt;
    for (const tr of this.traces) {
      tr.t += dt;
      const k = Math.min(1, tr.t / TRACE_TIME);
      const n = Math.max(2, Math.floor(tr.pts.length * k));
      const fade = tr.t > TRACE_TIME + 0.8 ? Math.max(0, 1 - (tr.t - TRACE_TIME - 0.8) / 0.5) : 1;
      tr.g.clear();
      if (fade <= 0) continue;
      tr.g.moveTo(tr.pts[0].x, tr.pts[0].y);
      for (let i = 1; i < n; i++) tr.g.lineTo(tr.pts[i].x, tr.pts[i].y);
      if (k >= 1) tr.g.closePath();
      tr.g.stroke({ width: 12, color: tr.color, alpha: 0.9 * fade, join: 'round', cap: 'round' });
    }
    this.traces = this.traces.filter((tr) => tr.t < TRACE_TIME + 1.3 || (tr.g.clear(), false));
    if (this.emptyFlash && (this.emptyFlash.t += dt) > 0.8) this.emptyFlash = null;
    // The stone's flag waves once the print shows, until Where is stamped.
    const waving = this.flagNodes[this.round.site];
    if (this.wave > 0) {
      this.wave -= dt;
      waving.rotation = Math.sin(this.t * 9) * 0.12 * Math.min(1, this.wave);
      if (this.wave <= 0) waving.rotation = 0;
    }
    this.stoneGlow.clear();
    if (this.wave > 0) this.stoneGlow.roundRect(-STONE_W / 2 - 14, -STONE_H / 2 - 14, STONE_W + 28, STONE_H + 28, 44).fill({ color: swatch.yellow.light, alpha: 0.8 * Math.min(1, this.wave) });
    if (!this.busy && !this.finished) {
      this.idle += dt;
      if (this.idle > IDLE_WIGGLE && !this.wiggled && stepOf(this.state) === 'brush') {
        // An invitation, never a hint: the dust puffs once.
        this.wiggled = true;
        const g = this.stoneNode.toGlobal({ x: 0, y: 0 });
        const p = this.ctx.stage.toLocal(g);
        this.ctx.particles.burst(p.x, p.y, { colors: [DUST.fill], count: 8, speed: [30, 90], gravity: -20, life: [0.5, 0.9] });
      }
    }
    this.drawGlow();
  }

  resize(view: View) {
    this.view = view;
    this.L = digLayout(view, this.plan.id);
    this.layout();
  }

  /* Bot ------------------------------------------------------------------------------------------- */

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.brushing.size) return null;
    const s = this.state, step = stepOf(s);
    if (step === 'brush') {
      const p = nextBrush(s.cleared, this.find);
      return p ? { tap: { on: this.stoneNode, x: p.x, y: p.y }, pause: 0.35 } : null;
    }
    if (step === 'where') return { tap: { on: this.flagNodes[this.round.site] }, pause: 1.0 };
    if (step !== 'like') return null;
    const right = answer(caseOf(this.round.caseId));
    const card = this.cards.find((c) => c.leaf === right)!;
    if (this.plan.id === 2 && !this.looked.has('print')) return { tap: { on: this.stoneNode, x: 0, y: 0 }, pause: 1.4 };
    if (this.plan.id === 2 && !this.looked.has(right)) return { tap: { on: card.badge }, pause: 1.4 };
    if (s.like !== right) return { tap: { on: card.node }, pause: 0.7 };
    return { tap: { on: this.checkBtn } };
  }

  destroy() {
    this.destroyed = true;
    window.removeEventListener('pointerup', this.lift, true);
    window.removeEventListener('pointercancel', this.lift, true);
    this.stoneNode.removeAllListeners();
    this.bg.removeAllListeners();
  }
}

/* Icon and sticker ------------------------------------------------------------------------------ */

function stoneWithPrint(leaf: LeafId, dusty: boolean): Container {
  const c = new Container();
  c.addChild(stoneBase(), leafArt(leaf, 'print'));
  if (dusty) {
    const d = new Graphics();
    puffs(d, [[-150, -100, 40], [-110, -125, 34], [150, 100, 44], [110, 125, 30], [175, 60, 30]], DUST.fill, DUST.line, 5);
    c.addChild(d);
  }
  return c;
}

class FossilIcon extends WigglyIcon {
  private readonly brush: Graphics;
  private t = 0;
  constructor() {
    const c = new Container();
    super(c);
    const s = stoneWithPrint('star', true);
    s.scale.set(0.42);
    s.y = -70;
    this.brush = new Graphics()
      .roundRect(-10, -70, 20, 70, 8).fill(wood.fill).stroke({ width: 4, color: wood.line })
      .roundRect(-22, 0, 44, 30, 6).fill(swatch.yellow.light).stroke({ width: 4, color: swatch.yellow.line });
    this.brush.position.set(60, -80);
    this.brush.rotation = 0.5;
    c.addChild(s, this.brush);
  }
  update(dt: number) {
    super.update(dt);
    this.t += dt;
    this.brush.x = 60 + Math.sin(this.t * 3) * 18;
  }
}

function sticker(seed: number): Container {
  const c = new Container();
  const leaf: LeafId = Math.abs(seed) % 2 === 0 ? 'star' : 'ribbon';
  const s = stoneWithPrint(leaf, false);
  s.scale.set(0.5);
  const f = flagArt(FLAGS[Math.abs(seed) % 3].id, 0.9);
  f.position.set(95, -60);
  c.addChild(s, f);
  return c;
}

export const fossilDig: GameModule = {
  id: 'fossil-dig',
  name: 'Fossil Dig',
  titleLine: 'game.fossil-dig',
  region: 'tinker-lab',
  skills: ['observation', 'comparing', 'evidence', 'recording'],
  bands: ['prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'One of you brushes, the other picks the flag and the leaf, then swap. When the leaves look alike, both say which edge you see before Check.',
  offScreen: 'With a grown-up, pick up one fallen leaf outside, look at its edge and say "smooth" or "teeth". Then put it back where it was.',
  touchDemo: true,
  hubIcon: () => new FossilIcon(),
  sticker,
  create: (ctx) => new FossilDig(ctx),
};
