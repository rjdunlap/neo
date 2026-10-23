import { Circle, Container, Graphics, Rectangle, Sprite, Text } from 'pixi.js';
import { cheek, ink, RAINBOW, swatch, wood, type ColorName } from '../../art/palette';
import { gradientTexture } from '../../art/scenery';
import { shapePath, SHAPES, type ShapeKind } from '../../art/shapes';
import type { LineId } from '../../content/voice-script';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  BOX_FRONT,
  CORNERS,
  cornerClass,
  FLOOR_AT,
  boxTopFor,
  clueKinds,
  dealHoles,
  factDue,
  fits,
  holeAt,
  holeFor,
  holeLayout,
  nearest,
  pieceKinds,
  planFor,
  sizeMiss,
  startHelp,
  tapsIn,
  wrongDrop,
  wrongTurn,
  turnFits,
  turnNext,
  turnOffset,
  turnStart,
  TAP_HOLD,
  type TurnKind,
  type HoleSpec,
  type Size,
  type SorterPlan,
} from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

/** Each shape's own color, used while colors still help. */
const SHAPE_COLOR: Record<ShapeKind, ColorName> = {
  circle: 'red',
  square: 'blue',
  triangle: 'yellow',
  star: 'orange',
  heart: 'pink',
  hexagon: 'green',
  oval: 'teal',
  rectangle: 'purple',
  diamond: 'red',
  pentagon: 'blue',
  trapezoid: 'yellow',
};

/** The one colour of a round where colour no longer helps: the rainbow, less the floor's orange. */
const ONE_COLOR: ColorName[] = ['red', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink'];

const LEVELS: BandLevels = {
  lap: { min: 9, max: 9, order: [9] },
  toddler: { min: 1, max: 10, order: [9, 1, 2, 10, 3, 4, 5] },
  preschool: { min: 3, max: 11, order: [3, 4, 5, 6, 7, 11] },
  prek: { min: 5, max: 14, order: [5, 6, 7, 11, 8, 12, 13, 14] },
};

const PIECE_R = 48;
const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

function drawPiece(kind: ShapeKind, color: ColorName, scale = 1): Graphics {
  const sw = swatch[color];
  const r = PIECE_R * scale;
  const g = shapePath(new Graphics(), kind, r).fill(sw.fill).stroke(line(sw.line));
  return g.ellipse(-r * 0.35, -r * 0.4, r * 0.14, r * 0.22).fill({ color: 0xffffff, alpha: 0.45 });
}

interface Piece {
  view: Container;
  kind: ShapeKind;
  size?: Size;
  scale: number;
  drag: DragHandle;
  /** Seconds left on a "here I am" wiggle after a floor tap. */
  wiggle: number;
  /** The game clock when the finger went down on it, to tell a tap from a drag. */
  pickedAt: number;
  turnMisses: number;
  tapStart: { x: number; y: number; pointerId: number; localX: number; localY: number } | null;
  tapMoved: boolean;
}

interface Hole extends HoleSpec {
  x: number;
  y: number;
  glow: Graphics;
  dots: Graphics[];
}

/** A wooden box with a face. It eats shapes. */
class Box extends Container {
  readonly holes: Hole[] = [];
  private readonly mouth = new Graphics();
  private readonly face = new Container();
  private yum = 0;
  private shake = 0;
  /** A lean toward a far drop: its side (-1 or 1) and how much is left. */
  private leanDir = 0;
  private leanLeft = 0;
  private clock = 0;
  /** Seconds left on a hole's hint glow. */
  private glowFor = 0;
  readonly w: number;
  readonly lidH: number;

  constructor(plan: SorterPlan, specs: readonly HoleSpec[]) {
    super();
    const layout = holeLayout(plan, specs);
    this.w = layout.w;
    this.lidH = layout.lidH;
    const frontH = BOX_FRONT + 10;
    const body = new Graphics()
      .roundRect(-this.w / 2, this.lidH - 10, this.w, frontH, 18)
      .fill(wood.fill)
      .stroke(line(wood.line))
      .roundRect(-this.w / 2 - 12, 0, this.w + 24, this.lidH, 22)
      .fill(wood.light)
      .stroke(line(wood.line));
    this.addChild(body);

    layout.holes.forEach(({ kind, size, attribute, r, x, y }) => {
      const rim = plan.coded ? swatch[SHAPE_COLOR[kind]].fill : wood.line;
      const outline: ShapeKind = attribute !== undefined ? 'circle' : kind;
      const glow = shapePath(new Graphics(), outline, r + 16).fill({ color: 0xfff3a0, alpha: 0.85 });
      glow.position.set(x, y);
      glow.visible = false;
      const hole = (attribute === 'corners'
        ? new Graphics().poly([-r, -r * 0.6, -r * 0.6, -r, 0, -r * 0.6, r * 0.6, -r, r, -r * 0.6, r, r * 0.6, r * 0.6, r, 0, r * 0.6, -r * 0.6, r, -r, r * 0.6]).closePath()
        : shapePath(new Graphics(), outline, r)).fill(0x4a3424).stroke(line(rim, plan.coded ? 9 : 6));
      hole.position.set(x, y);
      this.addChild(glow, hole);
      const dots: Graphics[] = [];
      if (attribute !== undefined) {
        const sign = typeof attribute === 'number'
          ? new Text({ text: String(attribute), style: { fontFamily: 'sans-serif', fontSize: 38, fontWeight: 'bold', fill: 0xffffff } })
          : shapePath(new Graphics(), kind, 24).fill(wood.light);
        if (sign instanceof Text) sign.anchor.set(0.5);
        sign.position.set(x, y);
        this.addChild(sign);
        if (typeof attribute === 'number') for (let i = 0; i < attribute; i++) {
          const a = -Math.PI / 2 + i * Math.PI * 2 / attribute;
          const dot = new Graphics().circle(0, 0, 6).fill(0xfff3a0);
          dot.position.set(x + Math.cos(a) * 40, y + Math.sin(a) * 40);
          this.addChild(dot);
          dots.push(dot);
        }
      }
      this.holes.push({ kind, size, attribute, x, y, glow, dots });
    });

    // A friendly face on the front.
    const eyes = new Graphics()
      .circle(-40, 0, 13)
      .circle(40, 0, 13)
      .fill(0xffffff)
      .circle(-37, 3, 7)
      .circle(43, 3, 7)
      .fill(ink)
      .ellipse(-72, 22, 14, 8)
      .ellipse(72, 22, 14, 8)
      .fill({ color: cheek, alpha: 0.55 });
    this.face.addChild(eyes, this.mouth);
    this.face.position.set(0, this.lidH + 40);
    this.addChild(this.face);
    this.drawMouth();
    this.hitArea = new Rectangle(-this.w / 2 - 12, 0, this.w + 24, this.lidH + BOX_FRONT);
  }

  /** A happy gulp. */
  gulp() {
    this.yum = 1;
    this.drawMouth();
  }

  /** "Not that one" head shake. */
  nope() {
    this.shake = 1;
  }

  /** Lean toward a piece let go out of reach, as if to look at it. */
  lean(dir: number) {
    this.leanDir = Math.sign(dir) || 1;
    this.leanLeft = 1;
  }

  /** Light the hole that takes this piece (its kind, and its size where holes have sizes). */
  hint(piece: { kind: ShapeKind; size?: Size }, seconds: number) {
    for (const h of this.holes) h.glow.visible = fits(h, piece);
    this.glowFor = seconds;
  }

  update(dt: number) {
    this.clock += dt;
    const was = this.yum > 0;
    this.yum = Math.max(0, this.yum - dt * 1.5);
    if (was && this.yum === 0) this.drawMouth();
    this.shake = Math.max(0, this.shake - dt * 2.5);
    this.face.x = 10 * Math.sin(this.shake * 22) * this.shake + 16 * this.leanDir * Math.sin(this.leanLeft * Math.PI);
    this.leanLeft = Math.max(0, this.leanLeft - dt * 1.6);
    this.rotation = 0.05 * this.leanDir * Math.sin(this.leanLeft * Math.PI);
    this.scale.set(1 + 0.04 * Math.sin(this.yum * Math.PI), 1 - 0.04 * Math.sin(this.yum * Math.PI));
    if (this.glowFor > 0) {
      this.glowFor -= dt;
      if (this.glowFor <= 0) for (const h of this.holes) h.glow.visible = false;
    }
    for (const h of this.holes) {
      if (h.glow.visible) h.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 8);
      // Count the sign's dots one at a time, repeating while help is lit. Zero has no dots.
      h.dots.forEach((dot, i) => { dot.alpha = !h.glow.visible || i <= Math.floor((4 - this.glowFor) / 0.45) % (h.dots.length + 1) ? 1 : 0.18; });
    }
  }

  private drawMouth() {
    const m = this.mouth.clear();
    if (this.yum > 0) m.ellipse(0, 26, 22, 16).fill(0x7a2e3e);
    else m.moveTo(-22, 22).quadraticCurveTo(0, 40, 22, 22).stroke(line(ink, 5));
  }
}

class ShapeSorter implements Game {
  private readonly plan: SorterPlan;
  private readonly bg = new Sprite(gradientTexture(0xfff1d6, 0xffe2b8));
  private readonly floor = new Graphics();
  private readonly layer = new Container();
  private readonly box: Box;
  private pieces: Piece[] = [];
  private placed = 0;
  private readonly help = startHelp();
  private lastNag = -10;
  private clock = 0;
  private finished = false;
  private clueQueue: ShapeKind[] = [];
  private asked: ShapeKind | null = null;
  private clueReady = false;
  /** At the sizes levels, which kinds have gone in little and big, and whether the box has said so. */
  private readonly wentIn = new Map<ShapeKind, Set<boolean>>();
  private saidSizes = false;
  /** Cancellation must never turn a piece or submit a drop. Capture runs before draggable's release handler. */
  private readonly cancelTurn = (e: PointerEvent) => {
    if (!this.plan.turning) return;
    for (const p of this.pieces) if (p.tapStart?.pointerId === e.pointerId) p.tapStart = null;
  };

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    const holes = dealHoles(ctx.rng, this.plan);
    this.box = ctx.track(new Box(this.plan, holes));
    this.layer.addChild(this.box);
    ctx.stage.addChild(this.bg, this.floor, this.layer);
    // Level 1 answers every touch: the box giggles, and the floor or the wall wiggles the nearest piece and names it.
    if (this.plan.everyTouch) {
      onTap(this.box, () => this.tickle(), { cooldown: 250 });
      for (const ground of [this.bg, this.floor]) onTap(ground, (e) => this.nudge(this.ctx.stage.toLocal(e.global)), { cooldown: 200 });
    }

    if (this.plan.turning) window.addEventListener('pointercancel', this.cancelTurn, true);
    const specs = pieceKinds(ctx.rng, this.plan, holes);
    if (this.plan.clue) this.clueQueue = clueKinds(ctx.rng, holes);
    const one = ctx.rng.pick(ONE_COLOR);
    this.pieces = specs.map(({ kind, size, scale }) => {
      const view = new Container();
      view.addChild(drawPiece(kind, this.plan.sameColor ? one : SHAPE_COLOR[kind], scale));
      // However small it is drawn, the piece is at least 112 units to touch.
      view.hitArea = new Circle(0, 0, Math.max(56, PIECE_R * scale + 8));
      if (this.plan.tilt) view.rotation = ctx.rng.range(-0.7, 0.7);
      if (this.plan.turning) view.rotation = turnStart(ctx.rng, kind as TurnKind);
      const piece: Piece = { view, kind, size, scale, wiggle: 0, pickedAt: 0, turnMisses: 0, tapStart: null, tapMoved: false, drag: null! };
      piece.drag = draggable(view, ctx.tw, {
        onPick: () => {
          piece.pickedAt = this.clock;
          sfx.tick();
          void ctx.say(`shape.${kind}`);
        },
        onDrop: (x, y) => this.drop(piece, x, y),
      });
      if (this.plan.turning) {
        // onTap starts a candidate after draggable has accepted this pointer; the release distinguishes a turn from a carry.
        onTap(view, (e) => {
          if (!piece.drag.dragging || piece.tapStart) return;
          piece.tapStart = { x: e.global.x, y: e.global.y, pointerId: e.pointerId, localX: view.x, localY: view.y };
          piece.tapMoved = false;
        }, { cooldown: 0 });
        view.on('globalpointermove', (e) => {
          if (piece.tapStart?.pointerId === e.pointerId && Math.hypot(e.global.x - piece.tapStart.x, e.global.y - piece.tapStart.y) > 24) piece.tapMoved = true;
        });
      }
      this.layer.addChild(view);
      return piece;
    });
  }

  start() {
    const first = this.plan.attribute === 'curves' ? 'shape.attr.start' : this.plan.attribute === 'count' ? 'shape.count.start' : this.plan.clue ? 'shape.find.start' : this.plan.tapIn ? 'shape.tap.start' : this.plan.sized ? 'shape.size.start' : this.plan.turning ? 'shape.turn.start' : 'shape.start';
    void this.ctx.instruct(first).then(() => {
      if (this.plan.clue) void this.askNextClue();
    });
  }

  resize(v: View) {
    this.bg.width = v.w;
    this.bg.height = v.h;
    const floorY = v.h * FLOOR_AT;
    this.floor
      .clear()
      .rect(0, floorY, v.w, v.h - floorY)
      .fill(0xe3b583);
    for (let y = floorY + 40; y < v.h; y += 46) this.floor.moveTo(0, y).lineTo(v.w, y).stroke({ width: 3, color: 0xcf9f6c });
    const boxTop = boxTopFor(v.h, this.box.lidH);
    this.box.position.set(v.w / 2, boxTop);

    // Waiting pieces sit on the floor, in one row or two.
    const waiting = this.pieces.filter((p) => !p.drag.dragging);
    const rows = waiting.length > 6 ? 2 : 1;
    const perRow = Math.ceil(waiting.length / rows);
    waiting.forEach((p, i) => {
      const row = Math.floor(i / perRow);
      const xs = spread(Math.min(perRow, waiting.length - row * perRow), 150, v.w - 40, 130);
      p.drag.home = { x: xs[i % perRow], y: rows === 1 ? v.h - 100 : v.h - 170 + row * 108 };
      p.view.position.set(p.drag.home.x, p.drag.home.y);
    });
  }

  update(dt: number) {
    this.clock += dt;
    for (const p of this.pieces) {
      if (p.wiggle <= 0 || p.drag.dragging) continue;
      p.wiggle = Math.max(0, p.wiggle - dt);
      p.view.rotation = 0.25 * Math.sin(p.wiggle * Math.PI * 6) * (p.wiggle / 0.6);
    }
  }

  /** For the browser check: misses and hints, as the shell will be told. */
  get misses() {
    return this.help.misses;
  }
  get hints() {
    return this.help.hints;
  }

  /** The ghost finger on the how-to card: carry the next waiting piece to its matching hole (tap it, where a tap puts it in). */
  autotouch(): TouchIntent | null {
    if (this.finished) return null;
    if (this.plan.tapIn) {
      const next = this.pieces.find((p) => !p.drag.dragging && !p.view.destroyed);
      return next ? { tap: { on: next.view } } : null;
    }
    if (this.plan.clue && (!this.asked || !this.clueReady)) return null;
    const kind = this.plan.clue ? this.asked ?? undefined : undefined;
    const piece = this.pieces.find((p) => !p.drag.dragging && !p.view.destroyed && (!kind || p.kind === kind));
    const hole = piece && holeFor(this.box.holes, piece);
    if (piece && this.plan.turning && !turnFits(piece.kind as TurnKind, piece.view.rotation)) return { tap: { on: piece.view } };
    return piece && hole ? { drag: { on: piece.view }, to: { on: this.box, x: hole.x, y: hole.y } } : null;
  }

  destroy() {
    window.removeEventListener('pointercancel', this.cancelTurn, true);
    for (const p of this.pieces) p.drag.destroy();
  }

  private drop(piece: Piece, x: number, y: number): boolean {
    if (this.finished) return false;
    if (this.plan.clue && !this.clueReady) return false;
    if (this.plan.turning) {
      if (!piece.tapStart) return false; // cancelled contact
      const start = piece.tapStart;
      piece.tapStart = null;
      if (!piece.tapMoved && this.clock - piece.pickedAt < TAP_HOLD) {
        piece.view.position.set(start.localX, start.localY);
        piece.view.rotation = turnNext(piece.view.rotation);
        sfx.tick();
        void this.ctx.say('shape.turn.tap');
        return true; // stay where she tapped it, including when it waits on a hole
      }
    }
    const near = holeAt(this.box.holes.map((h) => ({ h, x: this.box.x + h.x, y: this.box.y + h.y })), x, y);
    if (!near && tapsIn(this.plan, this.clock - piece.pickedAt, Math.hypot(x - piece.drag.home.x, y - piece.drag.home.y))) {
      // A tap: the piece hops into its own hole by itself.
      const hole = holeFor(this.box.holes, piece);
      if (hole) {
        void this.swallow(piece, this.box.x + hole.x, this.box.y + hole.y, true);
        return true;
      }
    }
    if (!near) {
      // Out of reach: the piece floats home. At level 1 that is answered too, with a plop and the box leaning to look.
      if (this.plan.everyTouch) {
        sfx.pop(5);
        this.box.lean(x - this.box.x);
      }
      return false;
    }

    if (fits(near.h, piece) && (!this.plan.clue || (this.clueReady && this.asked === piece.kind))) {
      if (this.plan.turning && !turnFits(piece.kind as TurnKind, piece.view.rotation)) {
        const support = wrongTurn(this.help, piece);
        piece.view.position.set(near.x, near.y);
        sfx.boing();
        this.box.nope();
        void this.ctx.say(support.align ? 'shape.turn.help' : 'shape.turn.wrong');
        if (support.glow) this.box.hint(piece, 4);
        if (support.align) {
          // Keep the equivalent orientation rather than turning every shape all the way back to zero.
          void this.ctx.tw.to(piece.view, { rotation: piece.view.rotation - turnOffset(piece.kind as TurnKind, piece.view.rotation) }, { duration: 0.3 });
        }
        void this.jiggle(piece, near.x);
        return true;
      }
      if (this.plan.clue) this.clueReady = false;
      void this.swallow(piece, near.x, near.y);
      return true;
    }
    const glow = wrongDrop(this.help);
    sfx.boing();
    this.box.nope();
    // At the clue level a shape in its own hole fits but is not the one asked for: say what she did right, every time.
    const asked = this.plan.clue ? this.asked : null;
    const fitted = asked !== null && near.h.kind === piece.kind;
    const size = sizeMiss(near.h, piece);
    if (fitted || this.clock - this.lastNag > 3) {
      this.lastNag = this.clock;
      if (asked && fitted) void this.ctx.say(`shape.find.notyet.${asked}`, { shape: piece.kind });
      else if (this.plan.attribute) void this.ctx.say(this.plan.attribute === 'curves' ? `shape.attr.${cornerClass(piece.kind)}` : `shape.count.${CORNERS[piece.kind]}` as LineId, { shape: piece.kind });
      else if (size) void this.ctx.say(`shape.size.${size}`);
      else void this.ctx.say(this.plan.clue && this.asked ? `shape.find.hint.${this.asked}` : 'shape.wrong', { hole: near.h.kind });
    }
    if (glow) this.box.hint(this.plan.clue && this.asked ? { kind: this.asked } : piece, 4);
    return false;
  }

  /** A misaligned shape waits at the hole, with a sideways jiggle that preserves its angle. */
  private async jiggle(piece: Piece, x: number) {
    await this.ctx.tw.to(piece.view, { x: x + 8 }, { duration: 0.08 });
    await this.ctx.tw.to(piece.view, { x: x - 8 }, { duration: 0.12 });
    await this.ctx.tw.to(piece.view, { x }, { duration: 0.08 });
  }

  /** A tap on the box at level 1: a gulp and a giggle. */
  private tickle() {
    if (this.finished) return;
    this.box.gulp();
    sfx.giggle();
  }

  /** A tap on the floor or the wall at level 1: the nearest waiting piece wiggles and says its name. */
  private nudge(at: { x: number; y: number }) {
    if (this.finished) return;
    const near = nearest(this.pieces.filter((p) => !p.drag.dragging).map((p) => ({ p, x: p.view.x, y: p.view.y })), at.x, at.y);
    if (!near) return;
    near.p.wiggle = 0.6;
    sfx.tick();
    void this.ctx.say(`shape.${near.p.kind}`);
  }

  /** In it goes: snap to the hole (hopping up and over first after a tap), shrink down out of sight, and the box says thank you. */
  private async swallow(piece: Piece, x: number, y: number, hop = false) {
    piece.drag.destroy();
    this.pieces = this.pieces.filter((p) => p !== piece);
    const v = piece.view;
    if (hop) await this.ctx.tw.to(v, { x: (v.x + x) / 2, y: Math.min(v.y, y) - 90 }, { duration: 0.28, ease: ease.outQuad });
    await this.ctx.tw.to(v, { x, y, rotation: this.plan.turning ? v.rotation : 0 }, { duration: 0.12 });
    void this.ctx.tw.to(v, { alpha: 0 }, { duration: 0.25 });
    await this.ctx.tw.to(v.scale, { x: 0.2, y: 0.2 }, { duration: 0.25, ease: ease.inBack });
    v.destroy({ children: true });
    sfx.clunk();
    // Sized pieces ring by size: the little one high, the big one low.
    sfx.bell(piece.size !== undefined ? 9 - 2 * piece.size : 5 + (this.placed % 6), 0.22);
    this.box.gulp();
    this.ctx.particles.burst(x, y, { kind: 'star', colors: [0xffd54a, 0xffffff], count: 8, speed: [100, 220], gravity: 0, life: [0.4, 0.7] });
    this.placed++;
    if (this.placed % 3 === 0) this.ctx.pet.cheer();
    if (!this.sizeSaid(piece) && factDue(this.plan, this.placed)) void this.ctx.say(`shape.fact.${piece.kind}`);
    if (this.pieces.length === 0) void this.finale();
    else if (this.plan.clue) void this.askNextClue();
  }

  /** Once a round, when one kind has gone in both little and big: "Big or little, a star is a star!" True when it spoke. */
  private sizeSaid(piece: Piece): boolean {
    if (!this.plan.sizes || this.saidSizes) return false;
    const seen = this.wentIn.get(piece.kind) ?? new Set<boolean>();
    seen.add(piece.scale > 1);
    this.wentIn.set(piece.kind, seen);
    if (seen.size < 2) return false;
    this.saidSizes = true;
    void this.ctx.say('shape.size.same', { shape: piece.kind });
    return true;
  }

  private async askNextClue() {
    const next = this.clueQueue.shift();
    if (!next || this.finished) return;
    this.asked = next;
    this.clueReady = true;
    await this.ctx.say(`shape.find.clue.${next}`);
    if (this.finished) this.clueReady = false;
  }

  private async finale() {
    this.finished = true;
    await this.ctx.say('shape.done');
    const b = this.box;
    await this.ctx.tw.to(b, { y: b.y - 40 }, { duration: 0.2, ease: ease.outQuad });
    await this.ctx.tw.to(b, { y: b.y + 40 }, { duration: 0.25, ease: ease.inQuad });
    b.gulp();
    const colors = RAINBOW.map((c) => swatch[c].fill);
    this.ctx.particles.burst(b.x, b.y + 40, { kind: 'confetti', colors, count: 60, speed: [300, 700], angle: -Math.PI / 2, spread: 1.6, gravity: 700, life: [1.2, 2] });
    sfx.tada();
    this.ctx.pet.cheer();
    await this.ctx.tw.wait(1.6);
    this.ctx.finish({ misses: this.help.misses, hints: this.help.hints });
  }
}

/** The hub's toy box, with a triangle waiting on top and a star leaning on the side. */
class BoxIcon extends Container {
  private clock = 0;
  private readonly tri: Graphics;

  constructor() {
    super();
    const body = new Graphics()
      .roundRect(-110, -110, 220, 110, 16)
      .fill(wood.fill)
      .stroke(line(wood.line))
      .roundRect(-122, -190, 244, 86, 18)
      .fill(wood.light)
      .stroke(line(wood.line));
    const circle = shapePath(new Graphics(), 'circle', 26).fill(0x4a3424).stroke(line(swatch.red.fill, 6));
    circle.position.set(-60, -148);
    const square = shapePath(new Graphics(), 'square', 26).fill(0x4a3424).stroke(line(swatch.blue.fill, 6));
    square.position.set(10, -148);
    const face = new Graphics()
      .circle(-30, -64, 9)
      .circle(30, -64, 9)
      .fill(0xffffff)
      .circle(-28, -62, 5)
      .circle(32, -62, 5)
      .fill(ink)
      .moveTo(-14, -42)
      .quadraticCurveTo(0, -32, 14, -42)
      .stroke(line(ink, 4));
    this.tri = drawPiece('triangle', 'yellow');
    this.tri.scale.set(0.6);
    this.tri.position.set(76, -214);
    const star = drawPiece('star', 'orange');
    star.scale.set(0.7);
    star.position.set(-140, -36);
    star.rotation = -0.3;
    this.addChild(body, circle, square, face, this.tri, star);
  }

  update(dt: number) {
    this.clock += dt;
    this.tri.y = -214 - Math.abs(Math.sin(this.clock * 2.2)) * 16;
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const kinds = rng.shuffle([...SHAPES]).slice(0, 3);
  kinds.forEach((k, i) => {
    const p = drawPiece(k, SHAPE_COLOR[k]);
    p.position.set([-50, 50, 0][i], [30, 30, -50][i]);
    c.addChild(p);
  });
  return c;
}

export const shapeSorter: GameModule = {
  id: 'shape-sorter',
  name: 'Shape Sorter',
  titleLine: 'game.shape-sorter',
  region: 'rainbow-meadow',
  skills: ['shapes', 'fine-motor', 'spatial'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  entryLevels: [9],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => {
    const p = planFor(level);
    const n = p.deal?.count ?? p.holes.length;
    const shapes = `${n} shape${n === 1 ? '' : 's'}`;
    if (p.attribute === 'curves') return 'sort shapes into curves or corners';
    if (p.attribute === 'count') return 'count corners: 0, 3, 4, 5 or 6; different shapes share a hole';
    if (p.tapIn) return 'tap a shape and it hops in';
    if (p.turning) return 'tap to turn each shape, then carry it to its upright hole';
    if (p.sized) return 'one shape in three sizes: big, middle, little';
    if (p.coded) return `${shapes}, color-matched holes`;
    if (p.clue) return 'hear a shape clue, then find it';
    if (!p.sameColor) return `${shapes}, plain holes`;
    return `${shapes}, all one color${p.sizes ? ', big and little' : ''}${p.tilt ? ', tilted' : ''}`;
  },
  music: STYLES.stickers,
  coplayHint: 'Name each shape as {name} picks it up: "circle", "square".',
  offScreen: 'Go on a shape hunt: find something round, something square, a triangle.',
  hubIcon: () => new BoxIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new ShapeSorter(ctx),
};
