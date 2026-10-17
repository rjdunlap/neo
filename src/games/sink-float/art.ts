import { Container, Graphics } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { prop } from '../../art/props';
import { starPoints } from '../../art/shapes';
import type { ClayColor, ClayShape, Thing } from './logic';

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** One thing to drop in the water, about 90 units across, centered on (0, 0). */
export function thingArt(thing: Thing): Container {
  const c = new Container();
  const g = new Graphics();
  switch (thing) {
    case 'duck': {
      const y = swatch.yellow;
      g.ellipse(0, 12, 40, 26).fill(y.fill).stroke(line(y.line));
      g.circle(22, -18, 20).fill(y.fill).stroke(line(y.line));
      g.poly([38, -20, 58, -14, 38, -8]).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 3));
      g.circle(26, -24, 4).fill(ink);
      g.ellipse(-8, 8, 18, 10).fill(y.light);
      break;
    }
    case 'boat':
      g.moveTo(14, -48).lineTo(14, 8).stroke(line(wood.line, 5));
      g.poly([18, -46, 18, -2, 50, -2]).fill(swatch.white.fill).stroke(line(swatch.white.line, 4));
      g.poly([-48, 6, 48, 6, 34, 34, -34, 34]).fill(swatch.red.fill).stroke(line(swatch.red.line));
      break;
    case 'ball': {
      const colors = [swatch.red.fill, swatch.white.fill, swatch.blue.fill, swatch.white.fill, swatch.yellow.fill, swatch.white.fill];
      for (let i = 0; i < 6; i++) {
        const a0 = (i * Math.PI) / 3;
        g.moveTo(0, 0).arc(0, 0, 40, a0, a0 + Math.PI / 3).closePath().fill(colors[i]);
      }
      g.circle(0, 0, 40).stroke(line(swatch.white.line)).circle(0, 0, 8).fill(swatch.white.fill).stroke(line(swatch.white.line, 3));
      break;
    }
    case 'leaf':
      g.moveTo(-44, 10).quadraticCurveTo(-10, -44, 44, -14).quadraticCurveTo(10, 40, -44, 10).closePath().fill(swatch.green.fill).stroke(line(swatch.green.line));
      g.moveTo(-50, 14).quadraticCurveTo(0, -4, 40, -12).stroke(line(swatch.green.line, 4));
      break;
    case 'apple':
      c.addChild(prop('apple', 'red'));
      c.scale.set(0.85);
      return c;
    case 'rock':
      g.moveTo(-42, 16).quadraticCurveTo(-46, -20, -10, -28).quadraticCurveTo(30, -36, 42, -6).quadraticCurveTo(52, 26, 10, 30).quadraticCurveTo(-30, 34, -42, 16).closePath().fill(swatch.white.line).stroke(line(ink, 4));
      g.ellipse(-12, -12, 12, 6).fill({ color: swatch.white.fill, alpha: 0.35 });
      break;
    case 'key': {
      const k = swatch.yellow;
      g.circle(-26, 0, 22).fill(k.fill).stroke(line(k.line)).circle(-26, 0, 9).fill(swatch.white.light);
      g.roundRect(-6, -7, 54, 14, 5).fill(k.fill).stroke(line(k.line, 4));
      g.rect(30, 6, 8, 14).rect(42, 6, 8, 10).fill(k.fill);
      break;
    }
    case 'coin': {
      const k = swatch.yellow;
      g.circle(0, 0, 34).fill(k.fill).stroke(line(k.line)).circle(0, 0, 25).stroke(line(k.line, 3));
      g.poly(starPoints(13, 6)).fill(k.light);
      break;
    }
    case 'spoon':
      g.roundRect(-4, -6, 52, 12, 6).fill(swatch.white.line).stroke(line(ink, 3));
      g.ellipse(-24, 0, 26, 18).fill(swatch.white.light).stroke(line(swatch.white.line, 5));
      break;
  }
  c.addChild(g);
  return c;
}

/** The picture on the "floats" basket: something bobbing on a wave. */
export function floatIcon(): Graphics {
  const g = new Graphics();
  g.ellipse(0, -6, 26, 16).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 4)).circle(14, -24, 12).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 4));
  g.moveTo(-44, 10).quadraticCurveTo(-30, 0, -16, 10).quadraticCurveTo(-2, 20, 12, 10).quadraticCurveTo(26, 0, 40, 10).stroke(line(swatch.blue.fill, 6));
  return g;
}

/** The picture on the "sinks" basket: a rock resting at the bottom, bubbles rising. */
export function sinkIcon(): Graphics {
  const g = new Graphics();
  g.moveTo(-44, -26).quadraticCurveTo(-30, -36, -16, -26).quadraticCurveTo(-2, -16, 12, -26).quadraticCurveTo(26, -36, 40, -26).stroke(line(swatch.blue.fill, 6));
  g.ellipse(0, 18, 24, 14).fill(swatch.white.line).stroke(line(ink, 3));
  g.circle(-14, -6, 5).circle(-6, -14, 3).stroke(line(swatch.blue.fill, 3));
  g.moveTo(-44, 32).lineTo(44, 32).stroke(line(wood.line, 5));
  return g;
}

/**
 * The clay for Make it float, redrawn in place as she changes its shape: a ball, a flat pancake, a hollow boat, or a boat
 * with a hole and a crack. `water` (0 to 1) fills a leaky boat as it sinks. About 110 units across, centered on (0, 0).
 */
export function drawClay(g: Graphics, shape: ClayShape | 'ball', color: ClayColor, water = 0): Graphics {
  const s = swatch[color];
  g.clear();
  switch (shape) {
    case 'ball':
      g.circle(0, 0, 34).fill(s.fill).stroke(line(s.line));
      g.ellipse(-10, -12, 10, 6).fill({ color: s.light, alpha: 0.7 });
      break;
    case 'flat':
      g.ellipse(0, 14, 60, 13).fill(s.fill).stroke(line(s.line));
      g.ellipse(-16, 10, 18, 4).fill({ color: s.light, alpha: 0.7 });
      break;
    case 'boat':
    case 'leaky':
      // The hull, open at the top: the dark rim shows it is hollow.
      g.moveTo(-58, -6).quadraticCurveTo(-52, 34, 0, 36).quadraticCurveTo(52, 34, 58, -6).closePath().fill(s.fill).stroke(line(s.line));
      g.ellipse(0, -6, 58, 12).fill(s.line).ellipse(0, -4, 50, 8).fill({ color: ink, alpha: 0.25 });
      if (water > 0) g.ellipse(0, -4, 50 * water, 8 * water).fill({ color: swatch.blue.fill, alpha: 0.8 });
      if (shape === 'leaky') {
        g.circle(14, 22, 7).fill(ink);
        g.moveTo(14, 22).lineTo(26, 12).lineTo(32, 16).stroke(line(ink, 3));
      }
      break;
  }
  return g;
}

/** "Same clay, same weight": a level two-pan scale with the ball's outline on one pan and the boat on the other. */
export function sameWeightIcon(color: ClayColor): Container {
  const c = new Container();
  const g = new Graphics();
  g.moveTo(0, 40).lineTo(0, -30).stroke(line(wood.line, 6)).moveTo(-30, 44).lineTo(30, 44).stroke(line(wood.line, 6));
  g.moveTo(-70, -30).lineTo(70, -30).stroke(line(wood.line, 6)).circle(0, -30, 6).fill(wood.fill);
  for (const x of [-56, 56]) g.moveTo(x, -30).lineTo(x - 22, 6).moveTo(x, -30).lineTo(x + 22, 6).stroke(line(wood.line, 3)).moveTo(x - 30, 6).quadraticCurveTo(x, 22, x + 30, 6).stroke(line(wood.line, 5));
  g.circle(-56, -8, 14).stroke({ ...line(swatch[color].line, 4), alpha: 0.8 });
  const boat = drawClay(new Graphics(), 'boat', color);
  boat.scale.set(0.38);
  boat.position.set(56, -6);
  c.addChild(g, boat);
  return c;
}
