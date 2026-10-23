import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { HELPER, type HelperId, type Tool } from './logic';

/** The six tool pictures, drawn about 60 units across around (0, 0): on a mailbox plate, on a letter, or beside a window. */
export function drawTool(tool: Tool, size = 1): Graphics {
  const g = new Graphics();
  switch (tool) {
    case 'wrench':
      g.roundRect(-5, -8, 10, 44, 4).fill(swatch.blue.line).stroke({ width: 3, color: ink });
      g.circle(0, -18, 15).fill(swatch.blue.fill).stroke({ width: 3, color: ink });
      g.rect(-6, -36, 12, 18).fill(0xffffff);
      break;
    case 'bandage':
      g.circle(-6, 0, 24).fill(0xffffff).stroke({ width: 4, color: ink });
      g.circle(-6, 0, 11).fill(swatch.red.light).stroke({ width: 3, color: ink });
      g.rect(-6, 20, 40, 10).fill(0xffffff).stroke({ width: 3, color: ink });
      g.rect(8, 22, 12, 6).fill(swatch.red.fill);
      break;
    case 'can':
      g.poly([-22, -14, 14, -14, 18, 24, -26, 24]).fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line, join: 'round' });
      g.poly([14, 0, 38, -22, 42, -16, 18, 12]).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line, join: 'round' });
      g.moveTo(-20, -14).bezierCurveTo(-20, -40, 10, -40, 10, -14).stroke({ width: 4, color: swatch.green.line });
      for (const [x, y] of [[40, 4], [34, 16], [46, 18]]) g.circle(x, y, 4).fill(swatch.blue.fill);
      break;
    case 'stamp':
      g.roundRect(-24, -4, 48, 28, 6).fill(wood.fill).stroke({ width: 4, color: wood.line });
      g.roundRect(-10, -34, 20, 32, 8).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line });
      g.roundRect(-18, 10, 36, 8, 3).fill(swatch.red.light);
      break;
    case 'buoy':
      g.circle(0, 0, 28).stroke({ width: 16, color: swatch.red.fill });
      for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) g.circle(Math.cos(a) * 28, Math.sin(a) * 28, 9).fill(0xffffff);
      g.circle(0, 0, 36).stroke({ width: 3, color: ink }).circle(0, 0, 20).stroke({ width: 3, color: ink });
      break;
    case 'whisk':
      g.roundRect(-5, 8, 10, 30, 4).fill(wood.fill).stroke({ width: 3, color: wood.line });
      for (const w of [10, 20]) g.ellipse(0, -10, w * 0.8, 24).stroke({ width: 3, color: swatch.yellow.line });
      g.moveTo(0, -34).lineTo(0, 10).stroke({ width: 3, color: swatch.yellow.line });
      break;
  }
  g.scale.set(size);
  return g;
}

/** A problem picture for the letter, about 110 units across around (0, 0): what each helper can fix. */
export function drawProblem(helper: HelperId): Graphics {
  const g = new Graphics();
  switch (helper) {
    case 'plumber': // a dripping tap
      g.roundRect(-42, -34, 62, 18, 6).fill(0x8c9aa8).stroke({ width: 4, color: ink });
      g.roundRect(8, -34, 18, 44, 6).fill(0x8c9aa8).stroke({ width: 4, color: ink });
      g.roundRect(-52, -46, 26, 10, 4).fill(swatch.red.fill).stroke({ width: 3, color: swatch.red.line });
      for (const [x, y, r] of [[17, 22, 6], [17, 40, 7], [17, 58, 8]]) g.poly([x, y - r * 1.6, x - r, y, x, y + r, x + r, y]).fill(swatch.blue.fill);
      break;
    case 'doctor': // a bandaged teddy
      g.circle(-30, -34, 14).circle(30, -34, 14).fill(swatch.brown.fill);
      g.circle(0, -4, 40).fill(swatch.brown.fill).stroke({ width: 4, color: swatch.brown.line });
      g.circle(-14, -10, 5).circle(14, -10, 5).fill(ink).ellipse(0, 8, 14, 10).fill(cream);
      g.rect(-34, -26, 68, 14).fill(0xffffff).stroke({ width: 3, color: ink });
      break;
    case 'gardener': // a drooping flower
      g.moveTo(0, 50).bezierCurveTo(0, 10, 4, -20, 30, -34).stroke({ width: 6, color: swatch.green.line });
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        g.circle(36 + Math.cos(a) * 16, -28 + Math.sin(a) * 16 + 12, 11).fill(swatch.pink.fill).stroke({ width: 3, color: swatch.pink.line });
      }
      g.circle(36, -16, 9).fill(swatch.yellow.fill);
      g.ellipse(-12, 26, 18, 8).fill(swatch.green.fill);
      break;
    case 'postkeeper': // a letter with no stamp
      g.roundRect(-52, -34, 104, 68, 8).fill(0xffffff).stroke({ width: 4, color: 0xb9c6d1 });
      g.roundRect(22, -26, 24, 28, 3).stroke({ width: 4, color: swatch.red.fill });
      g.rect(-36, 4, 50, 5).rect(-36, 16, 36, 5).fill(0xd6dde4);
      break;
    case 'lifeguard': // a toy boat far out on the pond
      g.ellipse(0, 18, 56, 28).fill(swatch.blue.light).stroke({ width: 4, color: swatch.blue.line });
      g.poly([30, -4, 52, 10, 8, 10]).fill(swatch.red.fill);
      g.poly([30, -30, 30, 6, 46, 6]).fill(0xffffff).stroke({ width: 2, color: ink });
      g.moveTo(-40, 24).bezierCurveTo(-30, 14, -20, 34, -10, 24).stroke({ width: 3, color: swatch.blue.line });
      break;
    case 'baker': // a candle with no cake
      g.ellipse(0, 36, 50, 12).fill(0xffffff).stroke({ width: 4, color: 0xb9c6d1 });
      g.roundRect(-8, -16, 16, 50, 4).fill(swatch.pink.fill).stroke({ width: 3, color: swatch.pink.line });
      g.moveTo(0, -48).quadraticCurveTo(14, -30, 0, -18).quadraticCurveTo(-14, -30, 0, -48).fill(swatch.yellow.fill).stroke({ width: 2, color: swatch.orange.line });
      break;
  }
  return g;
}

/** The journal's picture for a helper: the problem they fix, with their tool beside it. */
export function mailJournalPicture(helper: HelperId): Container {
  const c = new Container();
  const problem = drawProblem(helper);
  problem.x = -34;
  const tool = drawTool(HELPER[helper].tool, 0.9);
  tool.position.set(62, 14);
  c.addChild(problem, tool);
  return c;
}
