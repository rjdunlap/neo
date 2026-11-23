import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import type { Fix, Option } from './logic';
/** Three different silhouettes; voting never depends on a color name. */
export function toy(option: Option): Container {
  if (option === 'tall-slide') return tallSlide(false);
  const c = new Container(),
    g = new Graphics(),
    line = { width: 5, color: ink, cap: 'round' as const, join: 'round' as const };
  c.addChild(g);
  c.eventMode = 'none';
  if (option === 'slide')
    g.moveTo(-50, 38)
      .lineTo(-50, -38)
      .lineTo(-15, -38)
      .lineTo(45, 35)
      .lineTo(62, 35)
      .stroke({ width: 12, color: swatch.blue.fill, join: 'round' })
      .moveTo(-50, -36)
      .lineTo(-50, 40)
      .moveTo(-50, -8)
      .lineTo(-20, -8)
      .moveTo(-50, 15)
      .lineTo(-2, 15)
      .stroke({ width: 6, color: wood.line });
  if (option === 'swing')
    g.moveTo(-60, 42)
      .lineTo(-32, -42)
      .lineTo(34, -42)
      .lineTo(60, 42)
      .stroke({ width: 8, color: wood.line })
      .moveTo(-18, -38)
      .lineTo(-18, 17)
      .moveTo(18, -38)
      .lineTo(18, 17)
      .stroke(line)
      .roundRect(-28, 17, 56, 15, 6)
      .fill(swatch.red.fill)
      .stroke(line);
  if (option === 'sandpit')
    g.poly([-61, 10, -30, -28, 48, -28, 65, 25, 30, 42, -60, 32])
      .fill(swatch.yellow.light)
      .stroke({ width: 7, color: wood.line })
      .moveTo(-10, -15)
      .lineTo(-10, 19)
      .lineTo(20, 19)
      .lineTo(20, 0)
      .lineTo(4, 0)
      .lineTo(4, -15)
      .closePath()
      .fill(swatch.orange.fill)
      .stroke({ width: 3, color: swatch.orange.line });
  return c;
}
/**
 * Level 5's tall slide: a high deck whose ladder's first rung is well above the ground, so a small friend cannot reach it.
 * With `step`, a wooden step box stands under the ladder.
 */
export function tallSlide(step: boolean): Container {
  const c = new Container(),
    g = new Graphics();
  c.addChild(g);
  c.eventMode = 'none';
  g.moveTo(-50, 42)
    .lineTo(-50, -62)
    .lineTo(-15, -62)
    .lineTo(48, 38)
    .lineTo(64, 38)
    .stroke({ width: 12, color: swatch.purple.fill, join: 'round' })
    .moveTo(-62, -60)
    .lineTo(-62, 42)
    .moveTo(-50, -60)
    .lineTo(-50, 42)
    .stroke({ width: 6, color: wood.line });
  // The rungs stop high: nothing between the ground (42) and the first rung (2).
  for (const y of [-42, -20, 2]) g.moveTo(-62, y).lineTo(-50, y).stroke({ width: 5, color: wood.line });
  if (step)
    g.rect(-78, 18, 34, 24)
      .fill(wood.light)
      .stroke({ width: 4, color: wood.line })
      .moveTo(-74, 26)
      .lineTo(-48, 26)
      .stroke({ width: 2, color: wood.line });
  return c;
}
/** The toy everyone plays on after the fix: the tall slide with a step, or a lower slide built again. */
export const fixedToy = (fix: Fix | null) => (fix === 'lower' ? toy('slide') : tallSlide(fix === 'step'));
export function paw(): Graphics {
  const g = new Graphics()
    .ellipse(0, 10, 14, 12)
    .circle(-16, -8, 7)
    .circle(0, -15, 7)
    .circle(16, -8, 7)
    .fill(cream)
    .stroke({ width: 3, color: ink });
  g.eventMode = 'none';
  return g;
}
