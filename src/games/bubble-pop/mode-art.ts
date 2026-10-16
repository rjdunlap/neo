import { Container, Graphics } from 'pixi.js';
import { ink, RAINBOW, swatch, wood } from '../../art/palette';
import { label } from '../../ui/text';
import { drawBubble } from './bubble';
import { DOT_NUMERAL_Y, DOT_RADIUS, numberDots, type ModePicture } from './logic';

/** A plain or colored bubble at (x, y), with a numeral (and its dots, as the round draws them) when given one. */
function bubble(parent: Container, x: number, y: number, r: number, color: (typeof RAINBOW)[number] | null, n?: number, dots = false) {
  const g = drawBubble(new Graphics(), r, color, color ? undefined : 0.3, n === undefined);
  g.position.set(x, y);
  parent.addChild(g);
  if (n === undefined) return;
  // Drawn as the round draws a numbered bubble, so the picture matches what she will see.
  const numeral = label(String(n), Math.round(r * (n >= 10 ? 0.85 : 1.05)), ink);
  numeral.position.set(x, y + r * (dots ? DOT_NUMERAL_Y : 0.04));
  if (dots) {
    const d = new Graphics();
    for (const p of numberDots(n)) d.circle(x + p.x * r, y + p.y * r, Math.max(1.6, DOT_RADIUS * r)).fill(ink);
    parent.addChild(d);
  }
  parent.addChild(numeral);
}

/** The pill sign the round shows, small: an arrow the way the count goes and the number. */
function sign(parent: Container, y: number, text: string, arrow?: 1 | -1) {
  const w = arrow ? 78 : 58;
  parent.addChild(new Graphics().roundRect(-w / 2, y - 18, w, 36, 18).fill(0xffffff).stroke({ width: 3, color: swatch.blue.line, alpha: 0.6 }));
  const numeral = label(text, 26, ink);
  numeral.position.set(arrow ? 10 : 0, y);
  parent.addChild(numeral);
  if (arrow) {
    const color = arrow === 1 ? swatch.green.fill : swatch.orange.fill;
    parent.addChild(new Graphics().poly([-26 - 7 * arrow, y - 10, -26 + 8 * arrow, y, -26 - 7 * arrow, y + 10]).fill(color).stroke({ width: 3, color, join: 'round' }));
  }
}

/** An open hand, palm toward the screen, its heel at (x, y + 20). */
function palm(parent: Container, x: number, y: number) {
  const g = new Graphics();
  for (const [fx, len] of [[-15, 26], [-5, 31], [5, 30], [15, 25]] as const) g.roundRect(x + fx - 4.5, y - 12 - len, 9, len + 8, 4.5);
  g.roundRect(x - 31, y - 8, 22, 9, 4.5);
  g.roundRect(x - 20, y - 16, 40, 36, 13);
  g.fill(wood.light).stroke({ width: 3, color: wood.line, join: 'round' });
  parent.addChild(g);
}

/** The picture of one Bubble Pop mode on the how-to card, fitting a 112-unit square centered on (0, 0). Fixed example numbers, so drawing it never touches a round's draw. */
export function modePicture(p: ModePicture): Container {
  const c = new Container();
  c.eventMode = 'none';
  switch (p.kind) {
    case 'palm':
      bubble(c, -16, -18, 34, null);
      palm(c, 22, 30);
      break;
    case 'plain': {
      const spots = [[-24, -22], [24, -16], [-2, 22], [-32, 28], [32, 30]].slice(0, p.bubbles);
      const r = [26, 22, 19][p.bubbles - 3] ?? 19;
      for (const [x, y] of spots) bubble(c, x, y, r, null);
      break;
    }
    case 'colors': {
      const colors = RAINBOW.slice(0, p.colors);
      const spots = [[-24, -22], [24, -20], [0, 24], [-32, 26], [32, 28]].slice(0, Math.max(3, p.colors));
      const r = p.colors === 5 ? 18 : 22;
      spots.forEach(([x, y], i) => bubble(c, x, y, r, colors[i % colors.length]));
      // The one color asked for is ringed.
      c.addChild(new Graphics().circle(spots[0][0], spots[0][1], r + 7).stroke({ width: 4, color: ink }));
      break;
    }
    case 'count': {
      const r = p.upTo ? 16 : 18;
      const xs = p.upTo ? [-40, -6, 28] : [-36, 0, 36];
      p.numbers.forEach((n, i) => bubble(c, xs[i], p.upTo ? -12 : 0, r, null, n, p.dots));
      if (p.upTo) {
        const more = label(`… ${p.upTo}`, 26, ink);
        more.position.set(14, 32);
        c.addChild(more);
      }
      break;
    }
    case 'sign':
      sign(c, -32, String(p.sign), p.arrow);
      p.numbers.forEach((n, i) => bubble(c, -36 + i * 36, 22, 17, null, n));
      break;
    case 'bond':
      sign(c, -32, String(p.sum));
      p.numbers.forEach((n, i) => bubble(c, i ? 22 : -22, 22, 22, null, n));
      break;
  }
  return c;
}
