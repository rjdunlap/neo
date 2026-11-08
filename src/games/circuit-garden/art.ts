/** Circuit Garden's code-drawn pieces: a toy flower lantern (a made lamp, never a living flower), a battery and connectors. */
import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch, type ColorName } from '../../art/palette';
import { stickerize } from '../../art/sticker';
import { flower } from '../../art/shapes';

export const WIRE = 0x5a6b7d;
export const WIRE_LIT = swatch.yellow.line;
export const COPPER = 0xd98c4a;

/** The lantern: a glass bulb with a flower cap on a little stand. Rays and a halo only when lit. Centered on (0, 0). */
export function lanternArt(on: boolean, petals: ColorName = 'pink'): Container {
  const c = new Container();
  const g = new Graphics();
  if (on) {
    g.circle(0, -6, 86).fill({ color: swatch.yellow.light, alpha: 0.75 });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      g.moveTo(Math.cos(a) * 62, -6 + Math.sin(a) * 62).lineTo(Math.cos(a) * 82, -6 + Math.sin(a) * 82);
    }
    g.stroke({ width: 7, color: swatch.yellow.line, cap: 'round' });
  }
  // Stand and base: plainly a made thing.
  g.roundRect(-34, 34, 68, 22, 8).fill(swatch.brown.fill).stroke({ width: 4, color: swatch.brown.line });
  g.rect(-12, 18, 24, 18).fill(0x9aa4ae).stroke({ width: 3, color: 0x5a6b7d });
  g.circle(0, -6, 34)
    .fill(on ? 0xfff3a0 : 0xe8eef2)
    .stroke({ width: 5, color: on ? swatch.yellow.line : 0x8c9aa6 });
  // The filament.
  g.moveTo(-10, 14)
    .lineTo(-8, -4)
    .lineTo(-3, -12)
    .lineTo(3, -4)
    .lineTo(8, -12)
    .lineTo(10, 14)
    .stroke({ width: 3, color: on ? swatch.orange.fill : 0x8c9aa6 });
  c.addChild(g);
  const cap = flower(new Graphics(), 18, swatch[petals].fill, swatch[petals].line);
  cap.position.set(0, -44);
  c.addChild(cap);
  return c;
}

/** The battery: a block with a plus end and a minus end, drawn upright or lying along `vertical`. Centered on (0, 0). */
export function batteryArt(vertical: boolean, plusFirst: boolean): Graphics {
  const g = new Graphics();
  const [w, h] = vertical ? [86, 120] : [120, 86];
  g.roundRect(-w / 2, -h / 2, w, h, 16)
    .fill(swatch.teal.fill)
    .stroke({ width: 5, color: swatch.teal.line });
  // The plus end has a band; marks sit near each end.
  const along = (t: number): [number, number] => (vertical ? [0, t] : [t, 0]);
  const plus = plusFirst ? -1 : 1;
  const [bx, by] = along(plus * (vertical ? h : w) * 0.32);
  g.roundRect(
    bx - (vertical ? w / 2 : 10),
    by - (vertical ? 10 : h / 2),
    vertical ? w : 20,
    vertical ? 20 : h,
    6,
  ).fill(swatch.teal.line);
  const mark = (t: number, isPlus: boolean) => {
    const [x, y] = along(t);
    g.moveTo(x - 12, y).lineTo(x + 12, y);
    if (isPlus) g.moveTo(x, y - 12).lineTo(x, y + 12);
    g.stroke({ width: 6, color: 0xffffff, cap: 'round' });
  };
  mark(plus * (vertical ? h : w) * 0.08, true);
  mark(-plus * (vertical ? h : w) * 0.25, false);
  return g;
}

/** A socket end: the round clip a connector snaps into. */
export function socketArt(g: Graphics, x: number, y: number) {
  g.circle(x, y, 13).fill(cream).stroke({ width: 5, color: ink });
}

/** A connector: a thick wire with a clip at each end, `length` long, lying along x. */
export function connectorArt(length = 110): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-length / 2, -11, length, 22, 11)
    .fill(COPPER)
    .stroke({ width: 4, color: swatch.brown.line });
  for (const s of [-1, 1])
    g.circle((s * length) / 2, 0, 15)
      .fill(swatch.yellow.fill)
      .stroke({ width: 4, color: swatch.yellow.line });
  c.addChild(g);
  return c;
}

/** Help: a pointing hand. */
export function handIcon(): Graphics {
  const g = new Graphics();
  g.roundRect(-14, -26, 12, 34, 6).fill(0xffffff);
  g.roundRect(-18, -2, 36, 30, 10).fill(0xffffff);
  return g;
}

/** Put it back: an arrow dropping into the tray. */
export function backIcon(): Graphics {
  const g = new Graphics();
  g.moveTo(0, -24).lineTo(0, 10).stroke({ width: 8, color: ink, cap: 'round' });
  g.moveTo(-14, -2)
    .lineTo(0, 12)
    .lineTo(14, -2)
    .stroke({ width: 8, color: ink, cap: 'round', join: 'round' });
  g.moveTo(-22, 24).lineTo(22, 24).stroke({ width: 8, color: ink, cap: 'round' });
  return g;
}

/** A tiny lantern picture for the observation marks and the hub. */
export function lanternMini(on: boolean, scale = 0.5): Container {
  const c = lanternArt(on);
  c.scale.set(scale);
  return c;
}

export function stickerArt(seed = 0): Container {
  const c = new Container();
  const g = new Graphics();
  g.moveTo(-50, 20)
    .lineTo(-50, 50)
    .lineTo(50, 50)
    .lineTo(50, 20)
    .stroke({ width: 7, color: WIRE_LIT, cap: 'round' });
  c.addChild(g);
  const lamp = lanternArt(true, (['pink', 'purple', 'orange'] as const)[Math.abs(seed) % 3]);
  lamp.scale.set(0.7);
  lamp.y = -8;
  c.addChild(lamp);
  return stickerize(c);
}
