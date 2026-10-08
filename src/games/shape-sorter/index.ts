import { Container, Graphics, Sprite } from 'pixi.js';
import { cheek, ink, RAINBOW, swatch, wood, type ColorName } from '../../art/palette';
import { gradientTexture } from '../../art/scenery';
import { shapePath, SHAPES, type ShapeKind } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { HOLE_R, holeAt, holeFor, holeLayout, pieceKinds, planFor, type SorterPlan } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

/** Each shape's own color, used while colors still help. */
const SHAPE_COLOR: Record<ShapeKind, ColorName> = {
  circle: 'red',
  square: 'blue',
  triangle: 'yellow',
  star: 'orange',
  heart: 'pink',
  hexagon: 'green',
};

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 5 },
  preschool: { min: 3, max: 7 },
  prek: { min: 5, max: 7 },
};

const PIECE_R = 48;
const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

function drawPiece(kind: ShapeKind, color: ColorName): Graphics {
  const sw = swatch[color];
  const g = shapePath(new Graphics(), kind, PIECE_R).fill(sw.fill).stroke(line(sw.line));
  return g.ellipse(-PIECE_R * 0.35, -PIECE_R * 0.4, PIECE_R * 0.14, PIECE_R * 0.22).fill({ color: 0xffffff, alpha: 0.45 });
}

interface Piece {
  view: Container;
  kind: ShapeKind;
  drag: DragHandle;
  wrongs: number;
}

interface Hole {
  kind: ShapeKind;
  x: number;
  y: number;
  glow: Graphics;
}

/** A wooden box with a face. It eats shapes. */
class Box extends Container {
  readonly holes: Hole[] = [];
  private readonly mouth = new Graphics();
  private readonly face = new Container();
  private yum = 0;
  private shake = 0;
  private clock = 0;
  /** Seconds left on a hole's hint glow. */
  private glowFor = 0;
  readonly w: number;
  readonly lidH: number;

  constructor(plan: SorterPlan) {
    super();
    const layout = holeLayout(plan);
    this.w = layout.w;
    this.lidH = layout.lidH;
    const frontH = 120;
    const body = new Graphics()
      .roundRect(-this.w / 2, this.lidH - 10, this.w, frontH, 18)
      .fill(wood.fill)
      .stroke(line(wood.line))
      .roundRect(-this.w / 2 - 12, 0, this.w + 24, this.lidH, 22)
      .fill(wood.light)
      .stroke(line(wood.line));
    this.addChild(body);

    layout.holes.forEach(({ kind, x, y }) => {
      const rim = plan.coded ? swatch[SHAPE_COLOR[kind]].fill : wood.line;
      const glow = shapePath(new Graphics(), kind, HOLE_R + 16).fill({ color: 0xfff3a0, alpha: 0.85 });
      glow.position.set(x, y);
      glow.visible = false;
      const hole = shapePath(new Graphics(), kind, HOLE_R).fill(0x4a3424).stroke(line(rim, plan.coded ? 9 : 6));
      hole.position.set(x, y);
      this.addChild(glow, hole);
      this.holes.push({ kind, x, y, glow });
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

  hint(kind: ShapeKind, seconds: number) {
    for (const h of this.holes) h.glow.visible = h.kind === kind;
    this.glowFor = seconds;
  }

  update(dt: number) {
    this.clock += dt;
    const was = this.yum > 0;
    this.yum = Math.max(0, this.yum - dt * 1.5);
    if (was && this.yum === 0) this.drawMouth();
    this.shake = Math.max(0, this.shake - dt * 2.5);
    this.face.x = 10 * Math.sin(this.shake * 22) * this.shake;
    this.scale.set(1 + 0.04 * Math.sin(this.yum * Math.PI), 1 - 0.04 * Math.sin(this.yum * Math.PI));
    if (this.glowFor > 0) {
      this.glowFor -= dt;
      if (this.glowFor <= 0) for (const h of this.holes) h.glow.visible = false;
    }
    for (const h of this.holes) if (h.glow.visible) h.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 8);
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
  private misses = 0;
  private hints = 0;
  private lastNag = -10;
  private clock = 0;
  private finished = false;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.box = ctx.track(new Box(this.plan));
    this.layer.addChild(this.box);
    ctx.stage.addChild(this.bg, this.floor, this.layer);

    const kinds = pieceKinds(ctx.rng, this.plan);
    const one: ColorName = ctx.rng.pick(['teal', 'purple', 'blue'] as ColorName[]);
    this.pieces = kinds.map((kind) => {
      const view = new Container();
      view.addChild(drawPiece(kind, this.plan.sameColor ? one : SHAPE_COLOR[kind]));
      if (this.plan.tilt) view.rotation = ctx.rng.range(-0.7, 0.7);
      const piece: Piece = { view, kind, wrongs: 0, drag: null! };
      piece.drag = draggable(view, ctx.tw, {
        onPick: () => {
          sfx.tick();
          void ctx.say(`shape.${kind}`);
        },
        onDrop: (x, y) => this.drop(piece, x, y),
      });
      this.layer.addChild(view);
      return piece;
    });
  }

  start() {
    void this.ctx.instruct('shape.start');
  }

  resize(v: View) {
    this.bg.width = v.w;
    this.bg.height = v.h;
    const floorY = v.h * 0.66;
    this.floor
      .clear()
      .rect(0, floorY, v.w, v.h - floorY)
      .fill(0xe3b583);
    for (let y = floorY + 40; y < v.h; y += 46) this.floor.moveTo(0, y).lineTo(v.w, y).stroke({ width: 3, color: 0xcf9f6c });
    const boxTop = Math.max(40, floorY - this.box.lidH - 110);
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
  }

  /** The ghost finger on the how-to card: carry the next waiting piece to the hole of its own shape. */
  autotouch(): TouchIntent | null {
    if (this.finished) return null;
    const piece = this.pieces.find((p) => !p.drag.dragging && !p.view.destroyed);
    const hole = piece && holeFor(this.box.holes, piece.kind);
    return piece && hole ? { drag: { on: piece.view }, to: { on: this.box, x: hole.x, y: hole.y } } : null;
  }

  destroy() {
    for (const p of this.pieces) p.drag.destroy();
  }

  private drop(piece: Piece, x: number, y: number): boolean {
    if (this.finished) return false;
    const near = holeAt(this.box.holes.map((h) => ({ h, x: this.box.x + h.x, y: this.box.y + h.y })), x, y);
    if (!near) return false;

    if (near.h.kind === piece.kind) {
      void this.swallow(piece, near.x, near.y);
      return true;
    }
    this.misses++;
    piece.wrongs++;
    sfx.boing();
    this.box.nope();
    if (this.clock - this.lastNag > 3) {
      this.lastNag = this.clock;
      void this.ctx.say('shape.wrong', { hole: near.h.kind });
    }
    if (piece.wrongs === 2) {
      this.hints++;
      this.box.hint(piece.kind, 4);
    }
    return false;
  }

  /** In it goes: snap to the hole, shrink down out of sight, and the box says thank you. */
  private async swallow(piece: Piece, x: number, y: number) {
    piece.drag.destroy();
    this.pieces = this.pieces.filter((p) => p !== piece);
    const v = piece.view;
    await this.ctx.tw.to(v, { x, y, rotation: 0 }, { duration: 0.12 });
    void this.ctx.tw.to(v, { alpha: 0 }, { duration: 0.25 });
    await this.ctx.tw.to(v.scale, { x: 0.2, y: 0.2 }, { duration: 0.25, ease: ease.inBack });
    v.destroy({ children: true });
    sfx.clunk();
    sfx.bell(5 + (this.placed % 6), 0.22);
    this.box.gulp();
    this.ctx.particles.burst(x, y, { kind: 'star', colors: [0xffd54a, 0xffffff], count: 8, speed: [100, 220], gravity: 0, life: [0.4, 0.7] });
    this.placed++;
    if (this.placed % 3 === 0) this.ctx.pet.cheer();
    if (this.pieces.length === 0) void this.finale();
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
    this.ctx.finish({ misses: this.misses, hints: this.hints });
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
  bands: ['toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => {
    const p = planFor(level);
    const n = p.holes.length;
    const shapes = `${n} shape${n === 1 ? '' : 's'}`;
    if (p.coded) return `${shapes}, color-matched holes`;
    if (!p.sameColor) return `${shapes}, plain holes`;
    return `${shapes}, all one color${p.tilt ? ', tilted' : ''}`;
  },
  music: STYLES.stickers,
  coplayHint: 'Name each shape as {name} picks it up: "circle", "square".',
  offScreen: 'Go on a shape hunt: find something round, something square, a triangle.',
  hubIcon: () => new BoxIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new ShapeSorter(ctx),
};
