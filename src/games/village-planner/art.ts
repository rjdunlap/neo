import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch, wood, type Swatch } from '../../art/palette';
import type { Place } from './logic';

/** Bench jobs are warm yellow, Baker's Hill green and Creek Mill blue, and each place also has its own emblem. */
export const PLACE_SWATCH: Record<Place, Swatch> = {
  bench: swatch.yellow,
  hill: swatch.green,
  mill: swatch.blue,
};

/** The place's corner emblem: a bench with a hammer, a peak with a roof, a waterwheel. About 30 units across, centered. */
export function placeBadge(place: Place): Graphics {
  const g = new Graphics();
  const sw = PLACE_SWATCH[place];
  if (place === 'bench') {
    g.roundRect(-13, 1, 26, 8, 2).fill(wood.fill).stroke({ width: 2, color: wood.line });
    g.moveTo(-9, 9)
      .lineTo(-9, 15)
      .moveTo(9, 9)
      .lineTo(9, 15)
      .stroke({ width: 3, color: wood.line, cap: 'round' });
    g.moveTo(-3, -2).lineTo(6, -12).stroke({ width: 3, color: wood.line, cap: 'round' });
    g.roundRect(-1, -17, 11, 6, 2).fill(ink);
  } else if (place === 'hill') {
    g.poly([-15, 13, -3, -12, 15, 13]).fill(sw.fill).stroke({ width: 2.5, color: sw.line, join: 'round' });
    g.poly([-1, 2, 7, 2, 7, 13, -1, 13]).fill(cream);
    g.poly([-3, 2, 3, -5, 9, 2]).fill(swatch.red.fill);
  } else {
    g.circle(0, 0, 12).fill(cream).stroke({ width: 3, color: sw.line });
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 4;
      g.moveTo(-Math.cos(a) * 12, -Math.sin(a) * 12)
        .lineTo(Math.cos(a) * 12, Math.sin(a) * 12)
        .stroke({ width: 2.5, color: sw.line });
    }
    g.circle(0, 0, 3).fill(sw.line);
  }
  return g;
}

/** A job's own picture, about 56 units across and centered: it is what a player recognizes, never a colour alone. */
export function jobGlyph(id: string): Graphics {
  const g = new Graphics();
  const plank = () => g.roundRect(-24, -9, 48, 18, 3).fill(wood.light).stroke({ width: 3, color: wood.line });
  switch (id) {
    case 'mill':
    case 'grain':
    case 'grind': {
      // A sheaf of grain ears.
      for (const dx of [-12, 0, 12]) {
        g.moveTo(dx, 22).lineTo(dx, -8).stroke({ width: 3, color: swatch.orange.line, cap: 'round' });
        for (const dy of [-8, -18, -28])
          g.ellipse(dx, dy, 5, 8).fill(swatch.yellow.fill).stroke({ width: 2, color: swatch.yellow.line });
      }
      break;
    }
    case 'dough':
    case 'mix':
      g.ellipse(0, 6, 26, 15).fill(cream).stroke({ width: 3, color: wood.line });
      g.ellipse(-2, -8, 20, 14).fill(0xf6e3bd).stroke({ width: 3, color: wood.line });
      g.circle(-7, -9, 3).fill(0xe3c68e);
      g.circle(5, -6, 3).fill(0xe3c68e);
      break;
    case 'bake':
    case 'loaf':
      g.ellipse(0, 6, 28, 17).fill(swatch.orange.fill).stroke({ width: 3, color: swatch.orange.line });
      for (const dx of [-12, 0, 12])
        g.moveTo(dx - 4, -4)
          .lineTo(dx + 4, 10)
          .stroke({ width: 3, color: swatch.orange.line, cap: 'round' });
      break;
    case 'crates':
      g.roundRect(-22, -20, 44, 40, 4).fill(wood.light).stroke({ width: 3, color: wood.line });
      g.moveTo(-18, -16)
        .lineTo(18, 16)
        .moveTo(-18, 16)
        .lineTo(18, -16)
        .stroke({ width: 3, color: wood.line });
      break;
    case 'cut':
    case 'wood':
      plank();
      g.moveTo(-24, 0).lineTo(24, 0).stroke({ width: 2, color: wood.line });
      g.poly([-8, -22, 8, -22, 0, -10]).fill(0xb9bfca).stroke({ width: 2, color: 0x7d8493, join: 'round' });
      break;
    case 'wheel':
      g.circle(0, 0, 25).fill(wood.light).stroke({ width: 4, color: wood.line });
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI) / 3;
        g.moveTo(-Math.cos(a) * 24, -Math.sin(a) * 24)
          .lineTo(Math.cos(a) * 24, Math.sin(a) * 24)
          .stroke({ width: 4, color: wood.line });
      }
      g.circle(0, 0, 5).fill(wood.line);
      break;
    case 'frame':
      g.roundRect(-24, -22, 48, 44, 3).stroke({ width: 8, color: wood.line, join: 'round' });
      g.roundRect(-24, -22, 48, 44, 3).stroke({ width: 3, color: wood.light });
      break;
    case 'flour':
      g.moveTo(-18, -22)
        .quadraticCurveTo(0, -30, 18, -22)
        .lineTo(24, 22)
        .lineTo(-24, 22)
        .closePath()
        .fill(cream)
        .stroke({ width: 3, color: wood.line, join: 'round' });
      g.moveTo(-14, -18).lineTo(14, -18).stroke({ width: 4, color: swatch.red.fill, cap: 'round' });
      g.circle(0, 4, 9).stroke({ width: 3, color: swatch.yellow.line });
      break;
    case 'oil':
      g.moveTo(0, -26)
        .quadraticCurveTo(26, 4, 0, 24)
        .quadraticCurveTo(-26, 4, 0, -26)
        .fill(swatch.yellow.fill)
        .stroke({ width: 3, color: swatch.yellow.line, join: 'round' });
      g.ellipse(-6, 4, 4, 7).fill(swatch.yellow.light);
      break;
    case 'oven':
      g.roundRect(-26, -4, 52, 28, 4).fill(0xd9a49a).stroke({ width: 3, color: 0x9c6459 });
      g.roundRect(-26, -4, 52, 28, 4).fill(0xd9a49a);
      g.moveTo(-14, 22).lineTo(-14, 6).quadraticCurveTo(0, -10, 14, 6).lineTo(14, 22).closePath().fill(ink);
      g.moveTo(0, 20)
        .quadraticCurveTo(-8, 14, -2, 6)
        .quadraticCurveTo(0, 12, 4, 9)
        .quadraticCurveTo(8, 16, 0, 20)
        .fill(swatch.orange.fill);
      g.roundRect(-8, -24, 16, 20, 3).fill(0x9c6459);
      break;
    default:
      g.circle(0, 0, 20).fill(swatch.teal.fill);
  }
  return g;
}

/** A job tile: its picture and name's place color, the place emblem top-left and its prerequisites' little pictures top-right. */
export function jobTile(
  id: string,
  place: Place,
  needs: readonly string[],
  size: number,
  dim = false,
): Container {
  const sw = PLACE_SWATCH[place];
  const node = new Container();
  const body = new Graphics();
  const corner = place === 'bench' ? 8 : place === 'hill' ? 22 : 40;
  body
    .roundRect(-size / 2, -size / 2, size, size, corner)
    .fill(dim ? sw.light : sw.fill)
    .stroke({ width: 5, color: sw.line });
  body.roundRect(-size / 2 + 8, -size / 2 + 8, size - 16, size - 16, Math.max(4, corner - 6)).fill(cream);
  node.addChild(body);
  const glyph = jobGlyph(id);
  glyph.scale.set(size / 112);
  glyph.y = size * 0.06;
  node.addChild(glyph);
  const badge = placeBadge(place);
  badge.scale.set(0.82);
  badge.position.set(-size / 2 + 25, -size / 2 + 25);
  node.addChild(badge);
  needs.slice(0, 2).forEach((n, i) => {
    const chip = new Container();
    const back = new Graphics().circle(0, 0, 14).fill(0xfff8e6).stroke({ width: 2, color: ink });
    const mini = jobGlyph(n);
    mini.scale.set(0.34);
    chip.addChild(back, mini);
    chip.position.set(size / 2 - 22 - i * 30, -size / 2 + 24);
    node.addChild(chip);
  });
  if (needs.length) {
    const arrow = new Graphics().poly([-6, -6, 3, 0, -6, 6]).fill(ink);
    arrow.position.set(size / 2 - 22 - Math.min(2, needs.length) * 30 + 8, -size / 2 + 24);
    node.addChild(arrow);
  }
  return node;
}

/** An empty slot: a pale, tinted square with a dashed look. */
export function slotArt(place: 'bench' | 'cart', size: number): Graphics {
  const sw = place === 'bench' ? swatch.yellow : swatch.teal;
  return new Graphics()
    .roundRect(-size / 2, -size / 2, size, size, 14)
    .fill({ color: sw.light, alpha: 0.55 })
    .stroke({ width: 4, color: sw.line, alpha: 0.5 });
}

/** The row name sign's picture: a workbench or a handcart. */
export function rowIcon(row: 'bench' | 'cart'): Container {
  const node = new Container();
  node.addChild(row === 'bench' ? placeBadge('bench') : handcart());
  node.scale.set(1.6);
  return node;
}

export function handcart(): Graphics {
  const g = new Graphics();
  g.roundRect(-22, -12, 40, 18, 4).fill(wood.light).stroke({ width: 3, color: wood.line });
  g.moveTo(18, -8).lineTo(28, -16).stroke({ width: 3, color: wood.line, cap: 'round' });
  g.circle(-6, 10, 9).fill(cream).stroke({ width: 3, color: wood.line });
  g.circle(-6, 10, 2.5).fill(wood.line);
  return g;
}

const stroke = { width: 8, color: ink, cap: 'round' as const, join: 'round' as const };
export const undoIcon = () =>
  new Graphics()
    .arc(2, 2, 22, Math.PI * 1.1, Math.PI * 2.1)
    .stroke(stroke)
    .poly([-24, -8, -8, -20, -6, 0])
    .fill(ink);
export const clearIcon = () =>
  new Graphics().moveTo(-18, -18).lineTo(18, 18).moveTo(18, -18).lineTo(-18, 18).stroke(stroke);
export const hintIcon = () =>
  new Graphics()
    .circle(0, -8, 20)
    .fill(swatch.yellow.fill)
    .stroke({ width: 4, color: swatch.yellow.line })
    .roundRect(-11, 12, 22, 14, 4)
    .fill(0xc9ccd6)
    .stroke({ width: 3, color: 0x8c8c9c });
export const runIcon = () => new Graphics().poly([-14, -24, 24, 0, -14, 24]).fill(ink);
export const doneIcon = () => new Graphics().moveTo(-26, 2).lineTo(-10, 20).lineTo(28, -22).stroke(stroke);

/** The hub icon: a handcart beside a tiny workbench. */
export function plannerPicture(): Container {
  const node = new Container();
  const cart = handcart();
  cart.scale.set(1.9);
  cart.position.set(-26, -4);
  const bench = placeBadge('bench');
  bench.scale.set(1.5);
  bench.position.set(38, 8);
  node.addChild(cart, bench);
  return node;
}

/** The sticker: a woven village map ribbon with a cart wheel. */
export function plannerSticker(): Container {
  const node = new Container();
  const g = new Graphics();
  g.roundRect(-56, -26, 112, 52, 10).fill(cream).stroke({ width: 5, color: wood.line });
  g.moveTo(-40, 10)
    .quadraticCurveTo(-20, -18, 0, 4)
    .quadraticCurveTo(22, 20, 40, -10)
    .stroke({ width: 4, color: swatch.teal.line, cap: 'round' });
  g.circle(-40, 10, 5).fill(swatch.green.fill);
  g.circle(40, -10, 5).fill(swatch.blue.fill);
  node.addChild(g);
  const wheel = new Graphics().circle(0, 0, 18).fill(wood.light).stroke({ width: 4, color: wood.line });
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI) / 3;
    wheel
      .moveTo(-Math.cos(a) * 17, -Math.sin(a) * 17)
      .lineTo(Math.cos(a) * 17, Math.sin(a) * 17)
      .stroke({ width: 3, color: wood.line });
  }
  wheel.position.set(34, 22);
  node.addChild(wheel);
  return node;
}
