import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch, wood } from '../../art/palette';
import { Rng } from '../../engine/random';
import { outcomeOf, type Cup, type Discovery, type Material, type Outcome } from './logic';

/** Each material's own colours: what the heap on the spoon is drawn in, and the shimmer a vanished one leaves. */
export const COLORS: Record<Material, { fill: number; line: number; light: number }> = {
  sugar: { fill: 0xffffff, line: 0xa9a9bb, light: 0xffffff },
  salt: { fill: 0xd2deea, line: 0x7f93ab, light: 0xeef4fa },
  sand: { fill: 0xe8c872, line: 0xb08c34, light: 0xf6e3ad },
  pebble: { fill: 0xa3a3b0, line: 0x6d6d7a, light: 0xcfcfd8 },
  leaf: swatch.green,
  oil: { fill: 0xf2c23a, line: 0xc0901a, light: 0xffe58f },
};

const WATER = 0xa8dcf5;
const GLASS = 0x7fa7c0;

/** A material as it sits on a spoon or a card, about 70 units across with its base on (0, 0). */
export function heapArt(m: Material, size = 70): Graphics {
  const g = new Graphics();
  const c = COLORS[m];
  const k = size / 70;
  switch (m) {
    case 'sugar':
    case 'salt':
    case 'sand': {
      g.moveTo(-35 * k, 0)
        .quadraticCurveTo(-20 * k, -34 * k, 0, -36 * k)
        .quadraticCurveTo(20 * k, -34 * k, 35 * k, 0)
        .closePath()
        .fill(c.fill)
        .stroke({ width: 4 * k, color: c.line });
      // Grains: a few dots on the heap, so it reads as a powder and not a lump.
      const rng = new Rng(m.length * 7);
      for (let i = 0; i < 7; i++)
        g.circle(rng.range(-22, 22) * k, rng.range(-26, -6) * k, 2.4 * k).fill(c.line);
      break;
    }
    case 'pebble':
      g.ellipse(0, -18 * k, 30 * k, 18 * k)
        .fill(c.fill)
        .stroke({ width: 4 * k, color: c.line });
      g.ellipse(-9 * k, -25 * k, 9 * k, 4 * k).fill(c.light);
      break;
    case 'leaf':
      leaf(g, 0, -14 * k, 34 * k);
      break;
    case 'oil':
      g.moveTo(0, -46 * k)
        .quadraticCurveTo(24 * k, -14 * k, 18 * k, -6 * k)
        .quadraticCurveTo(0, 10 * k, -18 * k, -6 * k)
        .quadraticCurveTo(-24 * k, -14 * k, 0, -46 * k)
        .closePath()
        .fill(c.fill)
        .stroke({ width: 4 * k, color: c.line });
      g.ellipse(-6 * k, -16 * k, 5 * k, 8 * k).fill(c.light);
      break;
  }
  return g;
}

/** A leaf lying flat, about `r` units long either side of (x, y). */
function leaf(g: Graphics, x: number, y: number, r: number, tilt = -0.15) {
  const c = swatch.green;
  const ca = Math.cos(tilt);
  const sa = Math.sin(tilt);
  const p = (dx: number, dy: number): [number, number] => [x + dx * ca - dy * sa, y + dx * sa + dy * ca];
  g.moveTo(...p(-r, 0))
    .quadraticCurveTo(...p(0, -r * 0.62), ...p(r, 0))
    .quadraticCurveTo(...p(0, r * 0.62), ...p(-r, 0))
    .closePath()
    .fill(c.fill)
    .stroke({ width: 4, color: c.line });
  g.moveTo(...p(-r * 0.8, 0))
    .lineTo(...p(r * 0.85, 0))
    .stroke({ width: 2.5, color: c.line, cap: 'round' });
}

/** The big spoon, about 130 units long, bowl up and to the right of (0, 0), carrying `m` (or nothing). */
export function spoonArt(m: Material | null): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-58, -8, 70, 16, 8).fill(wood.fill).stroke({ width: 4, color: wood.line });
  g.ellipse(36, 0, 30, 20).fill(wood.fill).stroke({ width: 4, color: wood.line });
  g.ellipse(36, -2, 22, 13).fill(wood.light);
  c.addChild(g);
  if (m) {
    const heap = heapArt(m, m === 'leaf' || m === 'oil' || m === 'pebble' ? 44 : 46);
    heap.position.set(36, 4);
    c.addChild(heap);
  }
  c.rotation = -0.35;
  return c;
}

/**
 * A clear cup of water and what is in it, centred on (0, 0) and `w` by `h` units. The water never changes height; the
 * shimmer, the heap and what floats are separate drawings so the scene can bring each one in on its own.
 */
export class CupView extends Container {
  readonly water = new Graphics();
  /** A vanished material's evidence: its own colour, faint, with a few sparkles. Kept flat (under the paper pass's alpha). */
  readonly shimmer = new Container();
  readonly heap = new Graphics();
  readonly floating = new Graphics();
  /** Level 5: the cup is still swirling from the stir, so what it holds cannot be seen yet. */
  readonly swirl = new Graphics();
  readonly glass = new Graphics();
  private readonly sparkles: Graphics[] = [];
  private clock = 0;
  /** Set briefly when she taps the cup: the shimmer and the heap glow. */
  pulse = 0;

  constructor(
    public cw: number,
    public ch: number,
  ) {
    super();
    this.addChild(this.water, this.heap, this.shimmer, this.floating, this.swirl, this.glass);
    this.resizeTo(cw, ch);
    this.swirl.visible = false;
  }

  /** A new size: the glass and water are redrawn; call `show` again for the contents. */
  resizeTo(w: number, h: number) {
    this.cw = w;
    this.ch = h;
    this.hitArea = new Rectangle(-w / 2, -h / 2 - 20, w, h + 30);
    this.drawGlass();
    if (this.swirl.visible) this.setSwirling(true);
  }

  /** Contents are drawn for a 240-unit cup and scaled with it. */
  private get k() {
    return this.cw / 240;
  }

  /** The water's surface, in the cup's own units. */
  get surface() {
    return -this.ch / 2 + this.ch * 0.2;
  }

  get bottom() {
    return this.ch / 2 - 14;
  }

  private drawGlass() {
    const { cw: w, ch: h } = this;
    const top = -h / 2;
    const inset = w * 0.08;
    // The water: one flat sheet the paper pass makes paper.
    this.water
      .clear()
      .moveTo(-w / 2 + 8, this.surface)
      .lineTo(w / 2 - 8, this.surface)
      .lineTo(w / 2 - inset - 4, h / 2 - 8)
      .lineTo(-w / 2 + inset + 4, h / 2 - 8)
      .closePath()
      .fill({ color: WATER, alpha: 0.8 });
    // The glass is an open outline and a highlight: it stays a plain line.
    this.glass
      .clear()
      .moveTo(-w / 2, top)
      .lineTo(-w / 2 + inset, h / 2)
      .lineTo(w / 2 - inset, h / 2)
      .lineTo(w / 2, top)
      .stroke({ width: 6, color: GLASS, cap: 'round', join: 'round' });
    this.glass
      .moveTo(-w / 2 + 18, top + 20)
      .lineTo(-w / 2 + 18 + inset * 0.5, h / 2 - 30)
      .stroke({ width: 5, color: 0xffffff, alpha: 0.6, cap: 'round' });
    this.glass
      .moveTo(-w / 2 + 10, this.surface)
      .quadraticCurveTo(0, this.surface + 8, w / 2 - 10, this.surface)
      .stroke({ width: 3, color: GLASS, alpha: 0.5 });
  }

  /** Draws the cup's contents as they are now, with no animation. */
  show(cup: Cup) {
    this.drawShimmer(cup.shimmer);
    this.drawHeap(cup);
    this.drawFloating(cup.floating);
  }

  private drawShimmer(ms: Material[]) {
    for (const s of this.sparkles) s.destroy();
    this.sparkles.length = 0;
    this.shimmer.removeChildren();
    if (!ms.length) return;
    const { cw: w } = this;
    const tint = new Graphics();
    // The whole of the water takes a faint wash of what vanished into it, so a clear cup and a stirred one look different.
    const inset = w * 0.08;
    for (const m of ms)
      tint
        .moveTo(-w / 2 + 10, this.surface + 4)
        .lineTo(w / 2 - 10, this.surface + 4)
        .lineTo(w / 2 - inset - 6, this.ch / 2 - 10)
        .lineTo(-w / 2 + inset + 6, this.ch / 2 - 10)
        .closePath()
        .fill({ color: COLORS[m].light, alpha: 0.3 });
    this.shimmer.addChild(tint);
    const rng = new Rng(ms.join('').length * 13);
    for (let i = 0; i < 11; i++) {
      const s = new Graphics();
      const r = rng.range(6, 11) * this.k;
      s.moveTo(0, -r)
        .lineTo(r * 0.3, -r * 0.3)
        .lineTo(r, 0)
        .lineTo(r * 0.3, r * 0.3)
        .lineTo(0, r);
      s.lineTo(-r * 0.3, r * 0.3)
        .lineTo(-r, 0)
        .lineTo(-r * 0.3, -r * 0.3)
        .closePath();
      s.fill({ color: 0xffffff, alpha: 0.6 });
      s.position.set(rng.range(-w * 0.3, w * 0.3), rng.range(this.surface + 24, this.bottom - 24));
      (s as Graphics & { phase?: number }).phase = rng.range(0, Math.PI * 2);
      this.sparkles.push(s);
      this.shimmer.addChild(s);
    }
  }

  private drawHeap(cup: Cup) {
    const g = this.heap.clear();
    const base = this.bottom;
    const k = this.k;
    let x = -this.cw * 0.12;
    for (const { material, spoons } of cup.heap) {
      const c = COLORS[material];
      if (material === 'pebble') {
        for (let i = 0; i < spoons; i++) {
          const px = x + ((i % 3) * 26 - 10) * k;
          const py = base - (14 + Math.floor(i / 3) * 18) * k;
          g.ellipse(px, py, 22 * k, 14 * k)
            .fill(c.fill)
            .stroke({ width: 4, color: c.line });
        }
      } else {
        const r = Math.min(this.cw * 0.36, (34 + spoons * 10) * k);
        const top = Math.min(this.ch * 0.34, (16 + spoons * 9) * k);
        g.moveTo(x - r, base)
          .quadraticCurveTo(x, base - top * 2, x + r, base)
          .closePath()
          .fill(c.fill)
          .stroke({ width: 4, color: c.line });
      }
      x += this.cw * 0.26;
    }
  }

  private drawFloating(ms: Material[]) {
    const g = this.floating.clear();
    const y = this.surface;
    ms.forEach((m, i) => {
      const x = (i === 0 ? 0.08 : -0.16) * this.cw;
      if (m === 'leaf') leaf(g, x, y - 4, Math.min(44, this.cw * 0.2));
      else {
        // The oil: one thin gold disc on the water, all in one piece.
        g.ellipse(x, y, this.cw * 0.24, 9 * this.k)
          .fill(COLORS.oil.fill)
          .stroke({ width: 4, color: COLORS.oil.line });
      }
    });
  }

  /** Swirl lines over a just-stirred cup (level 5); its contents stay hidden until it settles. */
  setSwirling(on: boolean) {
    this.swirl.visible = on;
    this.heap.visible = this.shimmer.visible = this.floating.visible = !on;
    if (!on) return;
    const g = this.swirl.clear();
    const mid = (this.surface + this.bottom) / 2;
    const ry = (this.bottom - this.surface) * 0.32;
    g.ellipse(0, mid, this.cw * 0.3, ry)
      .stroke({ width: 5, color: 0xffffff, alpha: 0.85 })
      .ellipse(0, mid, this.cw * 0.18, ry * 0.55)
      .stroke({ width: 4, color: 0xffffff, alpha: 0.7 });
    g.rect(-this.cw * 0.34, this.surface + 6, this.cw * 0.68, this.bottom - this.surface - 12).fill({
      color: 0xe6f3fa,
      alpha: 0.5,
    });
  }

  update(dt: number) {
    this.clock += dt;
    if (this.swirl.visible) this.swirl.scale.x = 1 + 0.06 * Math.sin(this.clock * 6);
    if (this.pulse > 0) this.pulse = Math.max(0, this.pulse - dt * 1.2);
    for (const s of this.sparkles) {
      const phase = (s as Graphics & { phase?: number }).phase ?? 0;
      // Fades slowly in and out but never to nothing: it is still in there.
      s.alpha = 0.45 + 0.35 * Math.sin(this.clock * 1.6 + phase) + this.pulse * 0.6;
      s.scale.set(1 + this.pulse * 0.8);
    }
  }
}

/** A little cup picture for an outcome: a shimmer, a heap on the bottom, a leaf on top. About 110 units tall. */
export function outcomeArt(o: Outcome): Container {
  const cup = new CupView(96, 116);
  cup.show(
    o === 'vanish'
      ? { shimmer: ['sugar'], heap: [], floating: [] }
      : o === 'settle'
        ? { shimmer: [], heap: [{ material: 'sand', spoons: 2 }], floating: [] }
        : { shimmer: [], heap: [], floating: ['leaf'] },
  );
  // A still picture: the sparkles hold their brightest.
  cup.update(0.4);
  return cup;
}

/** The hub icon and sticker: a cup with sand on the bottom, a leaf on top and a shimmer, the spoon at its side. */
export function iconArt(seed = 1): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const cup = new CupView(100, 120);
  const float = rng.pick(['leaf', 'oil'] as const);
  cup.show({
    shimmer: ['sugar'],
    heap: [{ material: rng.pick(['sand', 'pebble'] as const), spoons: 2 }],
    floating: [float],
  });
  cup.update(0.4);
  const spoon = spoonArt(null);
  spoon.scale.set(0.55);
  spoon.position.set(40, -70);
  spoon.rotation = 0.9;
  c.addChild(cup, spoon);
  return c;
}

/** The journal card: the outcome's little cup with its two materials beside it, or a shimmer for "still in there". */
export function stirJournalPicture(key: Discovery): Container {
  const c = new Container();
  const o: Outcome = key === 'settles' ? 'settle' : key === 'floats' ? 'float' : 'vanish';
  const cup = outcomeArt(o);
  c.addChild(cup);
  if (key !== 'still-there') {
    const ms = (['sugar', 'salt', 'sand', 'pebble', 'leaf', 'oil'] as Material[]).filter(
      (m) => outcomeOf(m) === o,
    );
    ms.forEach((m, i) => {
      const h = heapArt(m, 40);
      h.position.set(i === 0 ? -78 : 78, 50);
      c.addChild(h);
    });
  } else {
    (cup as CupView).pulse = 1;
    (cup as CupView).update(0);
  }
  return c;
}
