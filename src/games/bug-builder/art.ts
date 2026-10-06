import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { shapePath } from '../../art/shapes';
import { BUG_TOKENS } from './logic';

export function bugToken(token: number, size = 32): Graphics {
  const t = BUG_TOKENS[token], color = swatch[t.color];
  return shapePath(new Graphics(), t.shape, size).fill(color.fill).stroke({ width: 4, color: color.line });
}
export function bugBody(rows = 3, columns = 1): Container {
  const c = new Container(), g = new Graphics();
  const ry = rows === 1 ? 105 : rows === 2 ? 156 : 207;
  const rx = columns === 1 ? 108 : 155, cx = columns === 1 ? 94 : 135;
  for (const side of [-1, 1]) {
    for (let row = -1; row <= 1; row++) g.moveTo(side * (cx + rx - 25), row * 65).lineTo(side * (cx + rx + 18), row * 90 + 20).stroke({ width: 9, color: swatch.purple.line, cap: 'round' });
    g.ellipse(side * cx, 0, rx, ry).fill(swatch.orange.light).stroke({ width: 7, color: swatch.orange.line });
  }
  g.ellipse(0, 0, 26, ry + 4).fill(swatch.purple.fill).stroke({ width: 5, color: swatch.purple.line });
  const headY = -ry + 12;
  g.moveTo(-22, headY - 26).quadraticCurveTo(-65, headY - 90, -74, headY - 46).moveTo(22, headY - 26).quadraticCurveTo(65, headY - 90, 74, headY - 46).stroke({ width: 6, color: swatch.purple.line, cap: 'round' });
  g.ellipse(0, headY, 52, 43).fill(swatch.purple.fill).stroke({ width: 5, color: swatch.purple.line });
  for (const x of [-20, 20]) g.circle(x, headY - 6, 12).fill(cream).circle(x + 2, headY - 5, 5).fill(ink);
  g.moveTo(-12, headY + 17).quadraticCurveTo(0, headY + 29, 12, headY + 17).stroke({ width: 4, color: cream, cap: 'round' });
  c.addChild(g); return c;
}
export function bugSticker(seed = 0): Container {
  const c = bugBody(2);
  for (const x of [-94, 94]) for (const y of [-58, 58]) { const p = bugToken((seed % 4 + (y > 0 ? 1 : 0)) % 4); p.position.set(x, y); c.addChild(p); }
  c.scale.set(0.52); c.y = -92; return c;
}
