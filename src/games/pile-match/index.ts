import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { grass, ink, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { LineId } from '../../content/voice-script';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  ENTRY_LEVELS,
  accepted,
  askedKind,
  colourOf,
  covers,
  DROP_FALL,
  dropDelay,
  free,
  fullMask,
  HEADER,
  HIT,
  hintFor,
  KINDS,
  lookFor,
  makeBoard,
  pieceAt,
  pileLayout,
  silhouetteOf,
  planFor,
  present,
  putBack,
  RADIUS,
  slotAt,
  take,
  tray,
  type Board,
  type Hint,
  type Look,
  type PileLayout,
  type PilePlan,
} from './logic';

/** Each base kind's marimba step as it lands, rising one step for the second and third; a look-alike uses its silhouette's. */
const NOTES = [3, 4, 5, 6, 7, 8, 9, 10, 2, 1];
const noteOf = (kind: number) => NOTES[silhouetteOf(kind)];
/** Stickers roll among the first eight kinds, so a saved sticker's seed keeps drawing the same kind. */
const STICKER_KINDS = 8;
/** A piece's hop from the heap into the tray; taps during it are ignored. */
const FLIGHT = 0.3;
/** Pieces in the tray are drawn a little smaller, to sit inside a 104-unit slot. */
const IN_TRAY = 0.85;
/** How far each piece falls in the windy drop-in. */
const DROP_HEIGHT = 80;
const SHADOW_Y = RADIUS - 6;

/** Each look's ground, its rim and the sky band behind the header. Edge things are small and faint, never like a piece. */
const LOOK_ART: Record<Look, { ground: number; rim: number; sky: number }> = {
  meadow: { ground: grass, rim: swatch.green.light, sky: swatch.blue.light },
  sand: { ground: swatch.yellow.light, rim: swatch.yellow.fill, sky: swatch.teal.light },
  autumn: { ground: swatch.brown.light, rim: swatch.brown.fill, sky: swatch.orange.light },
};
/** Fallen leaves in the autumn look: brown, orange and red, never the green of the leaf kind. */
const AUTUMN_LEAVES = [swatch.brown.fill, swatch.orange.fill, swatch.red.fill];

/** A kind's picture, about 70 units across, centred on (0, 0): its silhouette in its colour. */
function kindArt(kind: number): Graphics {
  const c = swatch[colourOf(kind)];
  const g = new Graphics();
  const line = { width: 4, color: c.line, join: 'round' as const, cap: 'round' as const };
  switch (silhouetteOf(kind)) {
    case 0: // shell: a ridged fan on a little hinge
      g.moveTo(-32, 4)
        .bezierCurveTo(-34, -36, 34, -36, 32, 4)
        .lineTo(10, 22)
        .lineTo(-10, 22)
        .closePath()
        .fill(c.fill)
        .stroke(line);
      for (const x of [-20, -8, 4, 16])
        g.moveTo(0, 20)
          .lineTo(x * 1.3 + 2, -20)
          .stroke({ width: 3, color: c.line, alpha: 0.7 });
      g.roundRect(-12, 20, 24, 10, 4).fill(c.fill).stroke(line);
      break;
    case 1: // acorn: a nut under a bumpy cap, with a stem
      g.ellipse(0, 10, 22, 24).fill(c.light).stroke(line);
      g.moveTo(-28, -6).bezierCurveTo(-28, -30, 28, -30, 28, -6).closePath().fill(c.fill).stroke(line);
      for (const x of [-16, -4, 8, 18]) g.circle(x, -14, 3).fill(c.line);
      g.moveTo(0, -24).lineTo(4, -34).stroke({ width: 5, color: c.line, cap: 'round' });
      break;
    case 2: // apple: two lobes, a stem and a leaf
      g.moveTo(0, -16)
        .bezierCurveTo(-30, -32, -40, 12, -14, 28)
        .bezierCurveTo(-6, 32, 6, 32, 14, 28)
        .bezierCurveTo(40, 12, 30, -32, 0, -16)
        .fill(c.fill)
        .stroke(line);
      g.moveTo(0, -16).lineTo(2, -30).stroke({ width: 5, color: swatch.brown.line, cap: 'round' });
      g.ellipse(12, -28, 10, 5).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
      g.ellipse(-12, -6, 5, 8).fill({ color: 0xffffff, alpha: 0.4 });
      break;
    case 3: // star: a sea star with five arms
      g.star(0, 2, 5, 34, 15).fill(c.fill).stroke(line);
      for (const [x, y] of [
        [0, -14],
        [-12, 0],
        [12, 0],
        [-7, 14],
        [7, 14],
        [0, 2],
      ])
        g.circle(x, y, 2.5).fill(c.line);
      break;
    case 4: // leaf: a pointed leaf with a midrib and a stalk
      g.moveTo(0, -34)
        .bezierCurveTo(30, -18, 26, 18, 0, 30)
        .bezierCurveTo(-26, 18, -30, -18, 0, -34)
        .fill(c.fill)
        .stroke(line);
      g.moveTo(0, -28).lineTo(0, 36).stroke({ width: 3, color: c.line, cap: 'round' });
      for (const y of [-12, 2, 16])
        g.moveTo(0, y)
          .lineTo(12, y - 8)
          .moveTo(0, y)
          .lineTo(-12, y - 8)
          .stroke({ width: 2, color: c.line });
      break;
    case 5: // toy duck: a round body, a head and a beak
      g.ellipse(4, 12, 30, 18).fill(c.fill).stroke(line);
      g.circle(-12, -12, 15).fill(c.fill).stroke(line);
      g.poly([-26, -12, -40, -6, -26, -4])
        .fill(swatch.orange.fill)
        .stroke({ width: 3, color: swatch.orange.line, join: 'round' });
      g.circle(-14, -16, 3).fill(ink);
      g.moveTo(4, 8).bezierCurveTo(14, 2, 24, 6, 28, 14).stroke({ width: 3, color: c.line });
      break;
    case 6: // flower: five petals round a yellow middle
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
        g.circle(Math.cos(a) * 18, Math.sin(a) * 18, 14)
          .fill(c.fill)
          .stroke({ width: 3, color: c.line });
      }
      g.circle(0, 0, 11).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
      break;
    case 7: // mushroom: a spotted cap on a pale stem
      g.roundRect(-10, -2, 20, 32, 8).fill(0xfff6e8).stroke({ width: 4, color: swatch.brown.line });
      g.moveTo(-34, 2).bezierCurveTo(-34, -40, 34, -40, 34, 2).closePath().fill(c.fill).stroke(line);
      for (const [x, y, r] of [
        [-16, -12, 5],
        [6, -20, 6],
        [18, -6, 4],
      ])
        g.circle(x, y, r).fill(0xffffff);
      break;
    case 8: // feather: a curved quill with barbs either side
      g.moveTo(-6, 36)
        .bezierCurveTo(-30, 10, -22, -24, 14, -36)
        .bezierCurveTo(26, -14, 18, 18, -6, 36)
        .closePath()
        .fill(c.fill)
        .stroke(line);
      g.moveTo(-10, 40)
        .bezierCurveTo(-4, 10, 2, -14, 12, -32)
        .stroke({ width: 3, color: c.line, cap: 'round' });
      for (const [x, y] of [
        [-4, 16],
        [0, 2],
        [4, -12],
      ])
        g.moveTo(x, y)
          .lineTo(x - 14, y - 4)
          .moveTo(x, y)
          .lineTo(x + 12, y - 10)
          .stroke({ width: 2, color: c.line });
      break;
    case 9: {
      // sock: a leg with a ribbed top, bent at the ankle into a foot, with a heel and toe in another colour
      const patch = c.fill === swatch.white.fill ? swatch.blue : swatch.white;
      g.moveTo(-14, -34)
        .lineTo(10, -34)
        .lineTo(10, 6)
        .lineTo(30, 18)
        .bezierCurveTo(40, 24, 34, 38, 22, 36)
        .lineTo(-6, 26)
        .bezierCurveTo(-18, 22, -16, 12, -14, 6)
        .closePath()
        .fill(c.fill)
        .stroke(line);
      g.moveTo(-14, 6).bezierCurveTo(-18, 20, -10, 26, -2, 26).lineTo(-2, 14).closePath().fill(patch.fill);
      g.moveTo(24, 20).bezierCurveTo(36, 24, 36, 36, 22, 36).lineTo(20, 22).closePath().fill(patch.fill);
      for (const y of [-28, -22])
        g.moveTo(-14, y).lineTo(10, y).stroke({ width: 3, color: c.line, alpha: 0.7 });
      g.moveTo(-14, -34)
        .lineTo(10, -34)
        .lineTo(10, 6)
        .lineTo(30, 18)
        .bezierCurveTo(40, 24, 34, 38, 22, 36)
        .lineTo(-6, 26)
        .bezierCurveTo(-18, 22, -16, 12, -14, 6)
        .closePath()
        .stroke(line);
      break;
    }
  }
  return g;
}

/** A piece: the picture on a round tile, with a shade drawn over it while something lies on top. */
class Piece extends Container {
  readonly shade = new Graphics();
  readonly shadow = new Graphics().ellipse(0, 0, RADIUS - 6, 10).fill({ color: ink, alpha: 0.15 });
  constructor(readonly kind: number) {
    super();
    const c = swatch[colourOf(kind)];
    this.shadow.y = SHADOW_Y;
    this.addChild(
      this.shadow,
      new Graphics()
        .circle(0, 0, RADIUS - 4)
        .fill(0xffffff)
        .stroke({ width: 4, color: c.line })
        .circle(0, 0, RADIUS - 12)
        .fill(c.light),
      kindArt(kind),
      this.shade.circle(0, 0, RADIUS - 2).fill({ color: ink, alpha: 0.3 }),
    );
    this.eventMode = 'none';
  }
}

function basketArt(w: number, h: number): Graphics {
  const g = new Graphics()
    .roundRect(-w / 2, -h / 2 + 18, w, h - 18, 22)
    .fill(wood.fill)
    .stroke({ width: 5, color: wood.line });
  for (let y = -h / 2 + 34; y < h / 2 - 8; y += 18)
    g.moveTo(-w / 2 + 8, y)
      .lineTo(w / 2 - 8, y)
      .stroke({ width: 3, color: wood.line, alpha: 0.6 });
  g.moveTo(-w / 2 + 20, -h / 2 + 20)
    .bezierCurveTo(-w / 2 + 20, -h / 2 - 22, w / 2 - 20, -h / 2 - 22, w / 2 - 20, -h / 2 + 20)
    .stroke({ width: 7, color: wood.line, cap: 'round' });
  return g;
}

type Press = { piece: number } | { slot: number };

class PileMatch implements Game {
  readonly plan: PilePlan;
  /** Where the heap blew down this round, from the seed. */
  readonly look: Look;
  board: Board;
  mask: number;
  /** The tray's pieces, left to right, kept together by kind. */
  trayOrder: number[] = [];
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** What the hint glow shows until she taps something. */
  hinted: Hint | null = null;
  /** The route fallback holds while she follows it. */
  private fallback = false;
  /** The first refusal of a full tray counts once until something leaves the tray. */
  private fullCounted = false;
  private putBacks = 0;
  private press: Press | null = null;
  private layout!: PileLayout;
  private clock = 0;
  private fullGlow = 0;
  private lastCovered = -Infinity;
  private botCache: { key: string; hint: Hint | null } | null = null;
  private botFallback = false;
  private popped = 0;
  /** The screen changed size during a flight: everything is placed again when it lands (killing its tween would leave the round busy). */
  private relayout = false;
  /** Start again was asked for during a flight: it runs when the flight lands. */
  private pendingRestart = false;

  private readonly hitLayer = new Graphics();
  private readonly trayLayer = new Container();
  private readonly pieceLayer = new Container();
  private readonly glow = new Graphics();
  private readonly basket = new Container();
  private readonly basketFill = new Container();
  private readonly tag = new Container();
  private readonly gust = new Graphics();
  /** The look's edge things, chosen once: a place round the rim (0–1) or under the heap (0–1 each way), a size and a turn. */
  private readonly decor: { t: number; u: number; v: number; s: number; a: number; under: boolean }[] = [];
  private tagArt: Container | null = null;
  private pieces: Piece[] = [];
  private readonly onCancel = () => this.letGo();

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.board = makeBoard(this.plan.id, ctx.rng);
    this.mask = fullMask(this.board.cells.length);
    this.look = lookFor(this.plan.id, ctx.rng);
    const things = this.look === 'autumn' ? 9 : this.look === 'sand' ? 2 : 10;
    for (let n = 0; n < things; n++) {
      this.decor.push({
        t: (n + ctx.rng.next()) / things,
        u: ctx.rng.next(),
        v: ctx.rng.next(),
        s: 0.8 + 0.4 * ctx.rng.next(),
        a: ctx.rng.next() * Math.PI * 2,
        under: this.look === 'autumn' && n % 3 === 0,
      });
    }
    this.pieceLayer.sortableChildren = true;
    this.gust.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.trayLayer.eventMode = 'none';
    this.basket.eventMode = 'none';
    this.tag.eventMode = 'none';
    this.basket.addChild(basketArt(150, 120), this.basketFill);
    this.hitLayer.on('pointerdown', (e) => this.down(e));
    this.hitLayer.on('pointerup', (e) => this.up(e));
    this.hitLayer.on('pointerupoutside', () => this.letGo());
    this.hitLayer.eventMode = 'static';
    ctx.stage.addChild(
      this.trayLayer,
      this.basket,
      this.tag,
      this.pieceLayer,
      this.gust,
      this.glow,
      this.hitLayer,
    );
    this.ctx.listen(window, 'pointercancel', this.onCancel);
    this.pieces = this.board.kinds.map((k) => this.pieceLayer.addChild(new Piece(k)));
  }

  start() {
    this.resize(this.ctx.view);
    void this.dropIn().then(() => this.settle());
    void this.ctx.instruct(this.instruction());
  }

  /**
   * The windy drop-in: a gust sweeps the header and the heap falls in, bottom layer first, each piece squashing as its
   * shadow grows under it, so she has seen what landed on top. Taps wait (busy) until the last has landed.
   */
  private async dropIn() {
    this.relayout = false;
    this.placeAll();
    this.blow();
    const cells = this.board.cells,
      tw = this.ctx.tw,
      s = this.layout.scale;
    await Promise.all(
      this.pieces.map(async (p, i) => {
        const home = this.layout.pieces[i],
          delay = dropDelay(cells, i);
        p.alpha = 0;
        p.y = home.y - DROP_HEIGHT;
        p.shadow.y = SHADOW_Y + DROP_HEIGHT;
        p.shadow.scale.set(0.4);
        void tw.to(p, { alpha: 1 }, { duration: 0.08, delay });
        void tw.to(p.shadow, { y: SHADOW_Y }, { duration: DROP_FALL, delay, ease: ease.inQuad });
        void tw.to(p.shadow.scale, { x: 1, y: 1 }, { duration: DROP_FALL, delay, ease: ease.inQuad });
        await tw.to(p, { y: home.y }, { duration: DROP_FALL, delay, ease: ease.inQuad });
        await tw.to(p.scale, { x: s * 1.1, y: s * 0.9 }, { duration: 0.05 });
        await tw.to(p.scale, { x: s, y: s }, { duration: 0.06 });
      }),
    );
  }

  /** Three curling strokes of wind sweep across the header. */
  private blow() {
    const g = this.gust.clear(),
      w = this.ctx.view.w;
    for (const [y, r] of [
      [40, 22],
      [68, 16],
      [96, 20],
    ] as const) {
      g.moveTo(-180, y)
        .bezierCurveTo(-120, y - 14, -60, y + 14, 0, y)
        .arc(0, y - r, r, Math.PI / 2, -Math.PI, true)
        .stroke({ width: 6, color: 0xffffff, cap: 'round', alpha: 0.9 });
    }
    g.position.set(-40, 0);
    g.alpha = 0;
    void this.ctx.tw.to(g, { alpha: 1 }, { duration: 0.15 });
    void this.ctx.tw.to(g, { x: w + 200 }, { duration: 0.7, ease: ease.inOutSine }).then(() => g.clear());
  }

  resize(v: View) {
    this.layout = pileLayout(this.board.cells, this.plan.tray, this.plan.asked, v);
    const L = this.layout;
    this.hitLayer.clear().rect(0, 0, v.w, v.h).fill({ color: 0xffffff, alpha: 0.001 });
    this.hitLayer.hitArea = new Rectangle(0, 0, v.w, v.h);
    const t = this.trayLayer.removeChildren();
    t.forEach((c) => c.destroy());
    const back = new Graphics();
    const look = LOOK_ART[this.look];
    back.rect(0, 0, v.w, HEADER).fill({ color: look.sky, alpha: 0.6 });
    // The ground the heap lies on.
    const xs = L.pieces.map((p) => p.x),
      ys = L.pieces.map((p) => p.y),
      pad = RADIUS + 26;
    const ground = {
      x: Math.min(...xs) - pad,
      y: Math.min(...ys) - pad,
      w: Math.max(...xs) - Math.min(...xs) + 2 * pad,
      h: Math.max(...ys) - Math.min(...ys) + 2 * pad,
    };
    back
      .roundRect(ground.x, ground.y, ground.w, ground.h, 60)
      .fill({ color: look.ground })
      .stroke({ width: 4, color: look.rim });
    this.drawEdge(back, ground);
    for (const s of L.slots)
      back
        .roundRect(s.x, s.y, s.w, s.h, 20)
        .fill({ color: this.plan.asked ? wood.light : 0xffffff, alpha: 0.75 })
        .stroke({ width: 4, color: wood.line });
    this.trayLayer.addChild(back);
    this.basket.position.set(L.basket.x + L.basket.w / 2, L.basket.y + L.basket.h / 2);
    this.tag.visible = !!L.tag;
    if (L.tag) {
      this.tag.removeChildren().forEach((c) => c.destroy({ children: true }));
      this.tag.position.set(L.tag.x + L.tag.w / 2, L.tag.y + L.tag.h / 2);
      this.tag.addChild(
        new Graphics()
          .roundRect(-L.tag.w / 2, -L.tag.h / 2, L.tag.w, L.tag.h, 22)
          .fill(swatch.yellow.light)
          .stroke({ width: 5, color: swatch.yellow.line }),
      );
      this.tagArt = null;
      this.drawTag();
    }
    if (this.busy) this.relayout = true;
    else this.placeAll();
  }

  /** The look's edge: grass tufts round the meadow, a wet line and two little shells on the sand, fallen leaves in autumn. */
  private drawEdge(g: Graphics, r: { x: number; y: number; w: number; h: number }) {
    const inset = 14;
    const rim = (t: number) => {
      const w = r.w - 2 * inset,
        h = r.h - 2 * inset;
      let d = t * 2 * (w + h);
      if (d < w) return { x: r.x + inset + d, y: r.y + inset };
      if ((d -= w) < h) return { x: r.x + r.w - inset, y: r.y + inset + d };
      if ((d -= h) < w) return { x: r.x + r.w - inset - d, y: r.y + r.h - inset };
      return { x: r.x + inset, y: r.y + r.h - inset - (d - w) };
    };
    if (this.look === 'sand') {
      g.moveTo(r.x + 50, r.y + r.h - 12)
        .bezierCurveTo(
          r.x + r.w * 0.35,
          r.y + r.h - 24,
          r.x + r.w * 0.65,
          r.y + r.h - 2,
          r.x + r.w - 50,
          r.y + r.h - 14,
        )
        .stroke({ width: 8, color: swatch.teal.light, cap: 'round' });
      this.decor.forEach((d, n) => {
        const x = r.x + r.w * (n ? 0.82 : 0.14),
          y = r.y + r.h - 10,
          k = 9 * d.s;
        g.moveTo(x - k, y)
          .bezierCurveTo(x - k, y - 1.6 * k, x + k, y - 1.6 * k, x + k, y)
          .closePath()
          .fill({ color: 0xffffff, alpha: 0.85 })
          .stroke({ width: 2, color: swatch.white.line, alpha: 0.6 });
      });
      return;
    }
    for (const d of this.decor) {
      const p = d.under ? { x: r.x + 40 + d.u * (r.w - 80), y: r.y + 40 + d.v * (r.h - 80) } : rim(d.t);
      if (this.look === 'meadow') {
        const k = 8 * d.s;
        g.moveTo(p.x - k, p.y + k)
          .lineTo(p.x - k / 2, p.y - k)
          .moveTo(p.x, p.y + k)
          .lineTo(p.x, p.y - 1.4 * k)
          .moveTo(p.x + k, p.y + k)
          .lineTo(p.x + k / 2, p.y - k)
          .stroke({ width: 3, color: swatch.green.fill, alpha: 0.55, cap: 'round' });
      } else {
        const k = 15 * d.s,
          c = Math.cos(d.a),
          s = Math.sin(d.a);
        const at = (u: number, w: number) => [p.x + u * c - w * s, p.y + u * s + w * c] as const;
        g.moveTo(...at(-k, 0))
          .quadraticCurveTo(...at(0, k * 0.7), ...at(k, 0))
          .quadraticCurveTo(...at(0, -k * 0.7), ...at(-k, 0))
          .fill({ color: AUTUMN_LEAVES[Math.floor(d.u * 3) % 3], alpha: 0.9 });
      }
    }
  }

  /** A flight or put-back has landed: catch up on a resize or a Start again that came during it. */
  private settle() {
    this.busy = false;
    if (this.relayout) {
      this.relayout = false;
      this.placeAll();
    }
    if (this.pendingRestart) {
      this.pendingRestart = false;
      this.restart();
    }
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.fullGlow > 0) {
      this.fullGlow -= dt;
      const s = this.layout.slots,
        a = s[0],
        b = s[s.length - 1];
      g.roundRect(a.x - 8, a.y - 8, b.x + b.w - a.x + 16, a.h + 16, 26).stroke({
        width: 6,
        color: swatch.yellow.fill,
        alpha: Math.min(1, this.fullGlow * 2),
      });
    }
    if (!this.hinted || this.finished) return;
    const pulse = 6 + 2 * Math.sin(this.clock * 6);
    if ('take' in this.hinted) {
      const p = this.layout.pieces[this.hinted.take];
      g.circle(p.x, p.y, HIT + 6 + pulse).stroke({ width: pulse, color: swatch.yellow.fill });
    } else {
      const k = this.trayOrder.indexOf(this.hinted.back),
        s = this.layout.slots[k];
      if (s)
        g.roundRect(s.x - 6, s.y - 6, s.w + 12, s.h + 12, 24).stroke({
          width: pulse,
          color: swatch.yellow.fill,
        });
    }
  }

  destroy() {}

  /** Start again: every piece back on the heap. Misses and hints already made still count. */
  restart() {
    if (this.finished) return;
    if (this.busy) {
      this.pendingRestart = true;
      return;
    }
    for (const p of this.pieces) this.ctx.tw.kill(p);
    this.mask = fullMask(this.board.cells.length) & ~this.poppedMask();
    this.trayOrder = [];
    this.hinted = null;
    this.fallback = false;
    this.fullCounted = false;
    this.press = null;
    this.busy = false;
    this.placeAll();
    this.drawTag();
  }

  /** The ghost finger: tap the hint's target each step, a piece or a tray piece to put back. It never shows a refused tap. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const key = `${this.mask}:${this.trayOrder.join(',')}`;
    if (this.botCache?.key !== key) {
      this.botCache = {
        key,
        hint: hintFor(this.board, this.mask, this.plan.tray, {
          asked: this.asked(),
          fallback: this.botFallback,
        }),
      };
      this.botFallback = !!this.botCache.hint?.fallback;
    }
    const h = this.botCache.hint;
    if (!h) return null;
    if ('take' in h) {
      const p = this.layout.pieces[h.take];
      return { tap: { on: this.hitLayer, x: p.x, y: p.y }, pause: 0.25 };
    }
    const s = this.layout.slots[this.trayOrder.indexOf(h.back)];
    return { tap: { on: this.hitLayer, x: s.x + s.w / 2, y: s.y + s.h / 2 }, pause: 0.25 };
  }

  /* -------------------------------------------------------------------------------------------- */

  private asked(): number | undefined {
    return this.plan.asked ? askedKind(this.board, this.mask) : undefined;
  }

  private instruction(): LineId {
    const a = this.asked();
    return a === undefined ? 'pile.instruct-free' : (`pile.find.${KINDS[a]}` as LineId);
  }

  /** Pieces whose kind has popped: gone for good. */
  private poppedMask(): number {
    const counts = new Array<number>(KINDS.length).fill(0);
    this.board.kinds.forEach((k, i) => {
      if (!present(this.mask, i)) counts[k]++;
    });
    const inTray = tray(this.board, this.mask);
    let m = 0;
    this.board.kinds.forEach((k, i) => {
      if (!present(this.mask, i) && inTray[k] === 0 && counts[k] === 3) m |= 1 << i;
    });
    return m;
  }

  private drawTag() {
    if (!this.plan.asked) return;
    const a = this.asked();
    this.tagArt?.destroy({ children: true });
    this.tagArt = null;
    if (a === undefined) return;
    this.tagArt = this.tag.addChild(new Piece(a));
    this.tagArt.scale.set(0.8);
  }

  /** A slot's middle. The third of a kind can land one past a full tray for the moment before the three pop. */
  private slotPos(k: number) {
    const s = this.layout.slots[0],
      step = this.layout.slots.length > 1 ? this.layout.slots[1].x - s.x : s.w;
    return { x: s.x + s.w / 2 + k * step, y: s.y + s.h / 2 };
  }

  /** Every piece where the state puts it: on the heap (shaded while covered), in its tray slot, or gone. */
  private placeAll() {
    const cells = this.board.cells;
    this.pieces.forEach((p, i) => {
      this.ctx.tw.kill(p);
      p.alpha = 1;
      p.shadow.y = SHADOW_Y;
      p.shadow.scale.set(1);
      if (present(this.mask, i)) {
        p.visible = true;
        p.position.set(this.layout.pieces[i].x, this.layout.pieces[i].y);
        p.scale.set(this.layout.scale);
        p.zIndex = cells[i].z * 10;
      } else {
        const k = this.trayOrder.indexOf(i);
        p.visible = k >= 0;
        if (k >= 0) {
          p.position.copyFrom(this.slotPos(k));
          p.scale.set(IN_TRAY);
          p.zIndex = 100;
        }
      }
    });
    this.shade();
  }

  private shade() {
    this.pieces.forEach((p, i) => {
      p.shade.visible = present(this.mask, i) && !free(this.board.cells, this.mask, i);
    });
  }

  /** Close up the tray: each piece slides to its slot. */
  private slideTray() {
    this.trayOrder.forEach((i, k) => {
      const p = this.pieces[i];
      void this.ctx.tw.to(p, this.slotPos(k), { duration: 0.15, ease: ease.outQuad });
    });
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Touch                                                                                          */
  /* -------------------------------------------------------------------------------------------- */

  private local(e: FederatedPointerEvent) {
    return this.ctx.stage.toLocal(e.global);
  }

  /** Touch-down: a free piece lifts at once, a tray piece bobs, a covered piece wiggles with the one on it. */
  private down(e: FederatedPointerEvent) {
    this.letGo();
    if (this.busy || this.finished || palmOnGlass()) return;
    const at = this.local(e);
    if (!Number.isFinite(at.x)) return;
    const k = slotAt(this.layout, at.x, at.y);
    if (k >= 0 && k < this.trayOrder.length) {
      this.press = { slot: k };
      const p = this.pieces[this.trayOrder[k]];
      p.scale.set(IN_TRAY * 1.08);
      sfx.pop(4);
      return;
    }
    const hit = pieceAt(this.board, this.mask, this.layout, at.x, at.y);
    if (!hit) return;
    if (!hit.free) return this.covered(hit.i);
    this.press = { piece: hit.i };
    const p = this.pieces[hit.i];
    p.scale.set(this.layout.scale * 1.08);
    p.y = this.layout.pieces[hit.i].y - 8;
    sfx.pop(6);
  }

  /** Release on what was pressed acts; elsewhere it settles back and nothing is taken. */
  private up(e: FederatedPointerEvent) {
    const press = this.press;
    if (!press) return;
    const at = this.local(e);
    this.letGo();
    if (this.busy || this.finished || !Number.isFinite(at.x)) return;
    if ('slot' in press) {
      if (slotAt(this.layout, at.x, at.y) === press.slot) this.putBackSlot(press.slot);
      return;
    }
    const p = this.layout.pieces[press.piece];
    if (Math.hypot(p.x - at.x, p.y - at.y) <= HIT + 20) this.tryTake(press.piece);
  }

  /** The pressed thing settles back where it lies. */
  private letGo() {
    const press = this.press;
    this.press = null;
    if (!press) return;
    if ('slot' in press) {
      const i = this.trayOrder[press.slot];
      if (i !== undefined) this.pieces[i].scale.set(IN_TRAY);
    } else if (present(this.mask, press.piece)) {
      const p = this.pieces[press.piece];
      p.scale.set(this.layout.scale);
      p.y = this.layout.pieces[press.piece].y;
    }
  }

  /** Never a miss: the covered piece and whatever lies on it wiggle, and the pet says why. */
  private covered(i: number) {
    const cells = this.board.cells;
    const on = cells.map((_, j) => j).filter((j) => present(this.mask, j) && covers(cells[j], cells[i]));
    for (const j of [i, ...on]) {
      const p = this.pieces[j],
        x = this.layout.pieces[j].x;
      this.ctx.tw.kill(p);
      void this.ctx.tw
        .to(p, { x: x + 6 }, { duration: 0.06 })
        .then(() => this.ctx.tw.to(p, { x: x - 6 }, { duration: 0.08 }))
        .then(() => this.ctx.tw.to(p, { x }, { duration: 0.06 }));
    }
    sfx.tick();
    if (this.clock - this.lastCovered > 3) {
      this.lastCovered = this.clock;
      void this.ctx.say('pile.covered');
    }
  }

  private tryTake(i: number) {
    const asked = this.asked();
    const r = take(this.board, this.mask, i, this.plan.tray, asked);
    const hinted = this.hinted;
    this.hinted = null;
    if (!accepted(r)) {
      if (r.refused === 'wrong-kind') return this.wrongKind(i, asked!);
      if (r.refused === 'full') return this.full(i);
      return;
    }
    this.fallback = !!hinted && 'take' in hinted && hinted.take === i && hinted.fallback;
    void this.fly(i, r.mask, r.pop);
  }

  private async fly(i: number, mask: number, pop: number | null) {
    this.busy = true;
    const kind = this.board.kinds[i];
    const before = tray(this.board, this.mask)[kind];
    this.mask = mask;
    // In the tray next to the others of its kind.
    const last = this.trayOrder.map((j) => this.board.kinds[j]).lastIndexOf(kind);
    this.trayOrder.splice(last >= 0 ? last + 1 : this.trayOrder.length, 0, i);
    this.shade();
    const p = this.pieces[i];
    p.zIndex = 200;
    this.trayOrder.forEach((j, k) => {
      if (j !== i) void this.ctx.tw.to(this.pieces[j], this.slotPos(k), { duration: FLIGHT * 0.6 });
    });
    const to = this.slotPos(this.trayOrder.indexOf(i));
    const over = Math.min(p.y, to.y) - 60;
    void this.ctx.tw.to(p.scale, { x: IN_TRAY, y: IN_TRAY }, { duration: FLIGHT });
    await this.ctx.tw.to(p, { x: (p.x + to.x) / 2, y: over }, { duration: FLIGHT * 0.5, ease: ease.outQuad });
    await this.ctx.tw.to(p, to, { duration: FLIGHT * 0.5, ease: ease.inQuad });
    p.zIndex = 100;
    sfx.marimba(noteOf(kind) + before, 0.4);
    if (pop !== null) await this.pop(pop);
    this.settle();
    this.botCache = null;
    if (this.finished) return;
    if (!this.mask) return void this.done();
    if (pop !== null && this.plan.asked) {
      this.drawTag();
      void this.ctx.instruct(this.instruction());
    }
  }

  /** Three of a kind bounce, chime and fly into the basket; the tray closes up. */
  private async pop(kind: number) {
    this.fullCounted = false;
    const three = this.trayOrder.filter((j) => this.board.kinds[j] === kind);
    this.trayOrder = this.trayOrder.filter((j) => this.board.kinds[j] !== kind);
    sfx.bell(noteOf(kind) + 3, 0.3);
    void this.ctx.say('pile.pop');
    await Promise.all(
      three.map((j) =>
        this.ctx.tw.to(this.pieces[j], { y: this.pieces[j].y - 24 }, { duration: 0.12, ease: ease.outQuad }),
      ),
    );
    const b = this.basket.position;
    await Promise.all(
      three.map((j, n) =>
        this.ctx.tw.to(
          this.pieces[j],
          { x: b.x - 20 + n * 20, y: b.y - 10, alpha: 0 },
          { duration: 0.3, ease: ease.inQuad },
        ),
      ),
    );
    for (const j of three) {
      this.pieces[j].visible = false;
      this.pieces[j].alpha = 1;
    }
    this.ctx.particles.burst(b.x, b.y - 30, {
      kind: 'dot',
      colors: [swatch[colourOf(kind)].fill, 0xffffff],
      count: 10,
      speed: [60, 180],
      gravity: 0,
      life: [0.4, 0.8],
    });
    // A little one of that kind peeks out of the basket for each three gathered.
    const mark = this.basketFill.addChild(new Piece(kind));
    mark.scale.set(0.32);
    mark.position.set(-48 + (this.popped % 4) * 32, -6 + Math.floor(this.popped / 4) * 30);
    this.popped++;
    this.slideTray();
  }

  /** Tap a tray piece: it goes back to its own place on the heap, for free. */
  private putBackSlot(k: number) {
    const i = this.trayOrder[k];
    const m = putBack(this.board, this.mask, i);
    if (m === null) return;
    const hinted = this.hinted;
    this.hinted = null;
    this.fallback = !!hinted && 'back' in hinted && hinted.back === i;
    this.mask = m;
    this.fullCounted = false;
    this.trayOrder.splice(k, 1);
    this.botCache = null;
    const p = this.pieces[i],
      home = this.layout.pieces[i];
    p.zIndex = 200;
    this.busy = true;
    void this.ctx.tw.to(p.scale, { x: this.layout.scale, y: this.layout.scale }, { duration: 0.25 });
    void this.ctx.tw.to(p, home, { duration: 0.25, ease: ease.outQuad }).then(() => {
      p.zIndex = this.board.cells[i].z * 10;
      this.settle();
      this.shade();
      if (!this.plan.asked && !this.plan.freePlay && ++this.putBacks >= 3) this.showHint();
    });
    this.shade();
    this.slideTray();
    sfx.pop(2);
  }

  /** Levels 1–2: another kind hops back with a boing, and the pet names both. One miss. */
  private wrongKind(i: number, asked: number) {
    const p = this.pieces[i],
      y = this.layout.pieces[i].y;
    this.ctx.tw.kill(p);
    p.scale.set(this.layout.scale);
    void this.ctx.tw
      .to(p, { y: y - 24 }, { duration: 0.1, ease: ease.outQuad })
      .then(() => this.ctx.tw.to(p, { y }, { duration: 0.16, ease: ease.inQuad }));
    sfx.boing();
    void this.ctx
      .say(`pile.this-is.${KINDS[this.board.kinds[i]]}` as LineId)
      .then(() => this.ctx.say(`pile.find.${KINDS[asked]}` as LineId));
    this.miss();
  }

  /**
   * A full tray turns the piece away; from level 4 (never in free play) the first refusal counts until something leaves
   * the tray. At level 10 the pet first names the piece fully ("That is a blue sea star"), colour and shape.
   */
  private full(i: number) {
    sfx.boing();
    this.fullGlow = 1.5;
    if (this.plan.lookAlike)
      void this.ctx
        .say(`pile.this-is.${KINDS[this.board.kinds[i]]}` as LineId)
        .then(() => this.ctx.say('pile.full'));
    else void this.ctx.say('pile.full');
    if (this.plan.asked || this.plan.freePlay || this.fullCounted) return;
    this.fullCounted = true;
    this.miss();
  }

  private miss() {
    this.misses++;
    if (this.misses % 2 === 0) this.showHint();
  }

  /** The hint target glows until she taps something; each glow counts once. */
  private showHint() {
    if (this.finished || this.hinted || !this.mask) return;
    const h = hintFor(this.board, this.mask, this.plan.tray, {
      asked: this.asked(),
      fallback: this.fallback,
    });
    if (!h) return;
    this.hinted = h;
    this.fallback = h.fallback;
    this.putBacks = 0;
    this.hints++;
    void this.ctx.say('pile.hint');
  }

  /** The grass is clear: the basket is carried off and the pet thanks her. */
  private async done() {
    if (this.finished) return;
    this.finished = true;
    this.hinted = null;
    sfx.sparkle();
    this.ctx.pet.cheer();
    if (this.plan.count) await this.ctx.say(`pile.count-threes.${this.board.cells.length}` as LineId);
    await this.ctx.say('pile.done');
    await this.ctx.tw.to(this.basket, { x: this.ctx.view.w + 200 }, { duration: 0.8, ease: ease.inOutSine });
    sfx.tada();
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class PileIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const at: [number, number, number][] = [
      [-34, 18, 4],
      [34, 18, 2],
      [0, 22, 1],
      [-18, -8, 0],
      [18, -8, 0],
      [0, -30, 0],
    ];
    for (const [x, y, k] of at) {
      const p = new Piece(k);
      p.shade.visible = false;
      p.scale.set(0.42);
      p.position.set(x, y);
      c.addChild(p);
    }
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const kind = rng.int(0, STICKER_KINDS - 1);
  const c = new Container();
  c.addChild(
    new Graphics().circle(0, 0, 80).fill(swatch.yellow.light).stroke({ width: 6, color: swatch.yellow.line }),
  );
  const b = basketArt(120, 90);
  b.position.set(0, 22);
  for (let n = 0; n < 3; n++) {
    const p = new Piece(kind);
    p.shade.visible = false;
    p.scale.set(0.38);
    p.position.set(-30 + n * 30, -14 + (n === 1 ? -12 : 0));
    c.addChild(p);
  }
  c.addChild(b);
  return c;
}

export const pileMatch: GameModule = {
  id: 'pile-match',
  name: 'Pile Match',
  titleLine: 'game.pile-match',
  region: 'counting-cove',
  challenge: 'noticing',
  skills: ['matching', 'visual-search', 'counting', 'planning'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: ENTRY_LEVELS,
  describeLevel: (level) => planFor(level).name,
  music: STYLES.stickers,
  coplayHint: 'One of you names a kind, and the other finds three.',
  offScreen:
    'Tip a box of mixed toys onto the floor and gather them back in threes, saying "one, two, three" for each set.',
  hubIcon: () => new PileIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new PileMatch(ctx),
};
