import { Container, Graphics } from 'pixi.js';
import { ink, swatch } from '../../art/palette';

/** Level 6's pictures (docs/definitions/cue-studio-p4.md): the leaf that is sent, the shell that never is, the bird and its fan. */

/** A leaf: a pointed oval with a midrib and a stalk, tip up and to the right. */
export function leafIcon(color = swatch.green.line): Graphics {
  const g = new Graphics()
    .moveTo(-20, 22)
    .bezierCurveTo(-34, -8, -8, -34, 24, -26)
    .bezierCurveTo(32, 6, 8, 32, -20, 22)
    .closePath()
    .fill(color)
    .moveTo(-20, 22)
    .lineTo(-30, 32)
    .stroke({ width: 6, color, cap: 'round' });
  // The midrib is cut out in white, so the leaf reads as a leaf in one colour.
  return g
    .moveTo(-14, 16)
    .lineTo(14, -16)
    .stroke({ width: 4, color: 0xffffff, alpha: color === 0xffffff ? 0 : 0.8, cap: 'round' });
}

/** A scallop shell: a ribbed fan-shaped shell on a little hinge. Told from the leaf by shape, not colour. */
export function shellIcon(color = swatch.pink.line): Graphics {
  const g = new Graphics()
    .moveTo(-9, 24)
    .lineTo(-30, -4)
    .quadraticCurveTo(0, -42, 30, -4)
    .lineTo(9, 24)
    .closePath()
    .fill(color)
    .roundRect(-13, 20, 26, 10, 4)
    .fill(color);
  for (const x of [-16, -8, 0, 8, 16])
    g.moveTo(x * 0.35, 20)
      .lineTo(x * 1.2, -12 - (16 - Math.abs(x)) * 0.8)
      .stroke({ width: 3, color: 0xffffff, alpha: color === 0xffffff ? 0 : 0.8, cap: 'round' });
  return g;
}

/** The Send card: a leaf on its way, with an arrow under it. */
export function sendIcon(color = 0xffffff): Container {
  const c = new Container();
  const leaf = leafIcon(color);
  leaf.scale.set(0.85);
  leaf.position.set(-2, -14);
  const arrow = new Graphics()
    .moveTo(-30, 30)
    .lineTo(14, 30)
    .stroke({ width: 8, color, cap: 'round' })
    .poly([12, 16, 34, 30, 12, 44])
    .fill(color);
  c.addChild(leaf, arrow);
  return c;
}

/** The receiver tile's picture: the thing the bird listens for, arriving (an arrow coming down onto it). */
export function listenIcon(receiver: 'leaf' | 'shell'): Container {
  const c = new Container();
  const thing = receiver === 'leaf' ? leafIcon() : shellIcon();
  thing.scale.set(0.9);
  thing.position.set(0, 14);
  const arrow = new Graphics()
    .moveTo(0, -46)
    .lineTo(0, -30)
    .stroke({ width: 7, color: ink, cap: 'round' })
    .poly([-13, -32, 13, -32, 0, -16])
    .fill(ink);
  c.addChild(thing, arrow);
  return c;
}

/** An open paper fan, hinge at the origin, opening upward: pleated ribs in two colours. */
export function fanIcon(radius = 44): Graphics {
  const g = new Graphics();
  const ribs = 7;
  const [from, to] = [-Math.PI * 0.92, -Math.PI * 0.08];
  for (let i = 0; i < ribs; i++) {
    const a0 = from + ((to - from) * i) / ribs;
    const a1 = from + ((to - from) * (i + 1)) / ribs;
    g.moveTo(0, 0)
      .lineTo(Math.cos(a0) * radius, Math.sin(a0) * radius)
      .lineTo(Math.cos(a1) * radius, Math.sin(a1) * radius)
      .closePath()
      .fill(i % 2 ? swatch.yellow.fill : swatch.red.fill)
      .stroke({ width: 3, color: swatch.red.line, join: 'round' });
  }
  return g.circle(0, 0, 5).fill(swatch.red.line);
}

/** How wide the fan is drawn when folded: one narrow blade. */
export const FAN_FOLDED = 0.14;

/**
 * The second actor: a round bird about 120 units tall, origin at its feet, holding a paper fan. `fan` is the fan itself
 * (hinge at its origin): its x scale runs from `FAN_FOLDED` to 1 as it opens. `body` hops when the bird answers.
 */
export function birdArt(): { root: Container; body: Container; fan: Container } {
  const root = new Container();
  const body = new Container();
  const sw = swatch.teal;
  const legs = new Graphics()
    .moveTo(-12, -14)
    .lineTo(-12, 0)
    .moveTo(12, -14)
    .lineTo(12, 0)
    .moveTo(-20, 0)
    .lineTo(-4, 0)
    .moveTo(4, 0)
    .lineTo(20, 0)
    .stroke({ width: 5, color: swatch.orange.line, cap: 'round' });
  const shape = new Graphics()
    // Tail.
    .poly([30, -44, 58, -62, 52, -34])
    .fill(sw.fill)
    .stroke({ width: 5, color: sw.line, join: 'round' })
    // Body and belly.
    .ellipse(0, -52, 40, 42)
    .fill(sw.fill)
    .stroke({ width: 5, color: sw.line })
    .ellipse(-6, -40, 22, 24)
    .fill(sw.light)
    // Head tuft.
    .moveTo(-4, -94)
    .quadraticCurveTo(0, -112, 12, -110)
    .stroke({ width: 5, color: sw.line, cap: 'round' })
    // Beak.
    .poly([-36, -70, -56, -62, -36, -56])
    .fill(swatch.orange.fill)
    .stroke({ width: 4, color: swatch.orange.line, join: 'round' })
    // Eye.
    .circle(-16, -70, 6)
    .fill(ink)
    .circle(-18, -72, 2)
    .fill(0xffffff)
    // Wing.
    .ellipse(14, -46, 16, 22)
    .fill(sw.line);
  const fan = new Container();
  fan.addChild(fanIcon());
  fan.position.set(20, -58);
  fan.rotation = 0.35;
  fan.scale.x = FAN_FOLDED;
  body.addChild(shape, fan);
  root.addChild(legs, body);
  return { root, body, fan };
}
