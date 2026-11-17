import { Container, Graphics } from 'pixi.js';
import { ink, swatch, wood, type ColorName } from '../../art/palette';

/** Ribbon Workshop's drawings, shared by the gift levels (index.ts), Whole Switch (switch.ts) and Ribbon Cases (cases.ts). */

export const RIBBON_H = 64;

export function ribbon(len: number, color: ColorName, h = RIBBON_H): Graphics {
  const s = swatch[color],
    g = new Graphics();
  g.roundRect(-len / 2, -h / 2, len, h, 10)
    .fill(s.fill)
    .stroke({ width: 4, color: s.line });
  g.rect(-len / 2 + 8, -h / 2 + 9, len - 16, h * 0.18).fill({ color: 0xffffff, alpha: 0.35 });
  return g;
}

export function giftBox(color: ColorName, bow: boolean): Container {
  const c = new Container(),
    s = swatch[color],
    g = new Graphics();
  g.roundRect(-42, -36, 84, 72, 8).fill(s.light).stroke({ width: 4, color: s.line });
  g.rect(-42, -36, 84, 14).fill(s.fill);
  if (bow) {
    g.rect(-7, -36, 14, 72).fill(s.fill);
    g.ellipse(-20, -44, 18, 11).fill(s.fill).stroke({ width: 3, color: s.line });
    g.ellipse(20, -44, 18, 11).fill(s.fill).stroke({ width: 3, color: s.line });
    g.circle(0, -42, 8).fill(s.line);
  }
  c.addChild(g);
  return c;
}

export function bowIcon(): Graphics {
  const g = new Graphics();
  g.ellipse(-17, 0, 17, 11)
    .fill(0xffffff)
    .ellipse(17, 0, 17, 11)
    .fill(0xffffff)
    .circle(0, 0, 8)
    .fill(0xffffff);
  g.moveTo(-4, 6)
    .lineTo(-14, 26)
    .stroke({ width: 6, color: 0xffffff })
    .moveTo(4, 6)
    .lineTo(14, 26)
    .stroke({ width: 6, color: 0xffffff });
  return g;
}

export function scissorsIcon(): Graphics {
  const g = new Graphics();
  g.circle(-14, 18, 10).stroke({ width: 6, color: ink }).circle(14, 18, 10).stroke({ width: 6, color: ink });
  g.moveTo(-8, 10)
    .lineTo(14, -26)
    .stroke({ width: 6, color: ink })
    .moveTo(8, 10)
    .lineTo(-14, -26)
    .stroke({ width: 6, color: ink });
  return g;
}

/** The spool: one whole as a striped bar from `x` to `x + len`, centred on `y`, with a wooden cap at each end. */
export function spoolBar(g: Graphics, x: number, y: number, len: number, h: number) {
  g.roundRect(x, y - h / 2, len, h, 8)
    .fill(swatch.purple.light)
    .stroke({ width: 4, color: swatch.purple.line });
  for (let at = 35; at < len; at += 35) g.moveTo(x + at, y - h / 2 + 2).lineTo(x + at - 10, y + h / 2 - 2);
  g.stroke({ width: 3, color: swatch.purple.fill });
  for (const end of [x, x + len])
    g.roundRect(end - 7, y - h / 2 - 13, 14, h + 26, 6)
      .fill(wood.fill)
      .stroke({ width: 3, color: wood.line });
}

/** A short dashed line, for the target outline. */
export function dashed(g: Graphics, x1: number, y1: number, x2: number, y2: number, color: number) {
  const len = Math.hypot(x2 - x1, y2 - y1),
    n = Math.max(1, Math.floor(len / 22));
  for (let i = 0; i < n; i += 2) {
    const a = i / n,
      b = Math.min(1, (i + 1) / n);
    g.moveTo(x1 + (x2 - x1) * a, y1 + (y2 - y1) * a).lineTo(x1 + (x2 - x1) * b, y1 + (y2 - y1) * b);
  }
  g.stroke({ width: 4, color });
}
