import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, ink, RAINBOW, swatch, wood } from '../../art/palette';

export const WORDS: Record<string, string> = {
  A: 'apple', B: 'ball', C: 'cat', D: 'duck', E: 'egg', F: 'fish', G: 'grapes', H: 'house', I: 'ice cream', J: 'jelly', K: 'kite', L: 'leaf', M: 'moon', N: 'nest', O: 'orange', P: 'pig', Q: 'queen', R: 'rainbow', S: 'sun', T: 'tree', U: 'umbrella', V: 'violin', W: 'whale', X: 'xylophone', Y: 'yo-yo', Z: 'zebra',
};

/** An illustrated association for every capital, made entirely from vector shapes. */
export function letterPicture(letter: string): Container {
  const c = new Container(), g = new Graphics();
  c.addChild(g);
  const line = (color = ink, width = 6) => ({ color, width, cap: 'round' as const, join: 'round' as const });
  const face = (x: number, y: number) => { g.circle(x - 18, y, 5).circle(x + 18, y, 5).fill(ink).moveTo(x - 12, y + 17).quadraticCurveTo(x, y + 30, x + 12, y + 17).stroke(line()); };
  if (letter === 'C' || letter === 'D' || letter === 'P') {
    const animal = new Critter(CRITTERS[letter === 'C' ? 'cat' : letter === 'D' ? 'duck' : 'pig']);
    animal.alive = false; animal.y = 110; c.addChild(animal); return c;
  }
  switch (letter) {
    case 'A':
      g.moveTo(0, -65).bezierCurveTo(-120, -150, -150, 110, -25, 112).quadraticCurveTo(0, 97, 25, 112).bezierCurveTo(150, 110, 120, -150, 0, -65).fill(swatch.red.fill).stroke(line(swatch.red.line));
      g.moveTo(0, -60).lineTo(8, -115).stroke(line(wood.line, 12)).ellipse(35, -100, 32, 15).fill(swatch.green.fill); face(0, 5); break;
    case 'B':
      g.circle(0, 0, 105).fill(swatch.blue.fill).stroke(line(swatch.blue.line)).moveTo(-105, 0).lineTo(105, 0).moveTo(0, -105).quadraticCurveTo(65, 0, 0, 105).stroke(line(swatch.yellow.fill, 16)); break;
    case 'E':
      g.ellipse(0, 0, 85, 115).fill(cream).stroke(line(swatch.brown.line)).circle(-30, -35, 16).circle(30, 20, 22).fill(swatch.teal.light); face(0, 40); break;
    case 'F':
      g.poly([-75, 0, -145, -70, -145, 70]).fill(swatch.orange.fill).stroke(line(swatch.orange.line)).ellipse(0, 0, 105, 65).fill(swatch.orange.fill).stroke(line(swatch.orange.line)).circle(60, -15, 12).fill(cream).circle(63, -15, 6).fill(ink); break;
    case 'G':
      for (const [x, y] of [[-45, -55], [20, -55], [65, -5], [-45, 10], [10, 10], [-10, 70]]) g.circle(x, y, 35).fill(swatch.purple.fill).stroke(line(swatch.purple.line));
      g.ellipse(12, -110, 40, 15).fill(swatch.green.fill); break;
    case 'H':
      g.roundRect(-90, -20, 180, 140, 12).fill(swatch.yellow.light).stroke(line(wood.line)).poly([-120, -20, 0, -125, 120, -20]).fill(swatch.red.fill).stroke(line(swatch.red.line)).roundRect(-25,  40, 50, 80, 7).fill(swatch.teal.fill).rect(45, 5, 30, 35).fill(swatch.blue.light); break;
    case 'I':
      g.poly([-60, -15, 60, -15, 0, 135]).fill(wood.light).stroke(line(wood.line)).circle(0, -65, 75).fill(swatch.pink.fill).stroke(line(swatch.pink.line)); face(0, -65); break;
    case 'J':
      g.moveTo(-110, 90).bezierCurveTo(-100, -150, 100, -150, 110, 90).closePath().fill(swatch.purple.fill).stroke(line(swatch.purple.line)); face(0, 0); break;
    case 'K':
      g.poly([0, -135, 90, -25, 0, 65, -90, -25]).fill(swatch.yellow.fill).stroke(line(swatch.orange.line)).moveTo(0, -135).lineTo(0, 65).moveTo(-90, -25).lineTo(90, -25).stroke(line(swatch.orange.line, 4)).moveTo(0, 65).bezierCurveTo(-65, 80, 60, 130, -30, 150).stroke(line(swatch.purple.line)); break;
    case 'L':
      g.moveTo(-100, 105).bezierCurveTo(-140, -60, 20, -130, 115, -120).bezierCurveTo(100, 45, 20, 130, -100, 105).fill(swatch.green.fill).stroke(line(swatch.green.line)).moveTo(-105, 115).lineTo(90, -95).stroke(line(swatch.green.line)); break;
    case 'M':
      g.circle(0, 0, 110).fill(swatch.yellow.light).circle(50, -40, 100).fill(cream); g.circle(-55, 5, 5).fill(ink); break;
    case 'N':
      g.ellipse(0, 55, 120, 60).fill(wood.fill).stroke(line(wood.line));
      for (let i = 0; i < 3; i++) g.ellipse(-55 + i * 55, 0,  30, 45).fill(swatch.blue.light).stroke(line(swatch.blue.line, 3));
      for (let i = 0; i < 5; i++) g.moveTo(-100, 40 + i * 12).quadraticCurveTo(0, 110, 100, 40 + i * 12).stroke(line(wood.line, 3)); break;
    case 'O':
      g.circle(0, 10, 100).fill(swatch.orange.fill).stroke(line(swatch.orange.line)).ellipse(30, -100, 40, 18).fill(swatch.green.fill); face(0, 0); break;
    case 'Q':
      g.circle(0, 30, 85).fill(swatch.brown.light).stroke(line(swatch.brown.line)); face(0, 25);
      g.poly([-90, -40, -100, -125, - 40, -80, 0, -140,  40, -80, 100, -125, 90, -40]).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line)).circle(0, -85, 14).fill(swatch.pink.fill); break;
    case 'R':
      RAINBOW.forEach((color, i) => { const radius = 130 - i * 17; g.moveTo(-radius, 55).arc(0, 55, radius, Math.PI, 0).stroke(line(swatch[color].fill, 18)); }); break;
    case 'S':
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.moveTo(Math.cos(a) * 100, Math.sin(a) * 100).lineTo(Math.cos(a) * 128, Math.sin(a) * 128).stroke(line(swatch.yellow.fill, 12)); }
      g.circle(0, 0,  80).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line)); face(0, -5); break;
    case 'T':
      g.roundRect(-22, -15, 44, 140, 8).fill(wood.fill).stroke(line(wood.line)).circle(-60, -30, 70).circle(0, -90, 75).circle(60, -30, 70).fill(swatch.green.fill); break;
    case 'U':
      g.moveTo(-125, 0).quadraticCurveTo(0, -200, 125, 0).closePath().fill(swatch.pink.fill).stroke(line(swatch.pink.line)).moveTo(0, 0).lineTo(0, 100).quadraticCurveTo(0, 140, -35, 120).stroke(line(swatch.purple.line, 12)); break;
    case 'V':
      g.ellipse(0,  50, 65,  70).ellipse(0, -20, 50,  50).fill(wood.fill).stroke(line(wood.line)).roundRect(-14, -150, 28, 150, 8).fill(wood.line);
      g.moveTo(-5, -130).lineTo(-5, 100).moveTo(5, -130).lineTo(5, 100).stroke(line(cream, 3)).moveTo(70, -140).lineTo(95, 120).stroke(line(wood.line, 9)); break;
    case 'W':
      g.ellipse(-15, 20, 110,  70).fill(swatch.blue.fill).stroke(line(swatch.blue.line)).poly([70, 20, 140, -40, 130, 55, 70, 60]).fill(swatch.blue.fill).circle(-75, 0, 7).fill(ink).moveTo(-20, -50).quadraticCurveTo(-20, -145, - 60, -100).moveTo(-20, -50).quadraticCurveTo(-20, -145, 20, -100).stroke(line(swatch.blue.light, 12)); break;
    case 'X':
      RAINBOW.forEach((color, i) => { const x = -110 + i *  40; g.roundRect(x, -85 + i * 10, 34, 170 - i * 20, 8).fill(swatch[color].fill).stroke(line(swatch[color].line, 3)); });
      g.moveTo(-90, 120).lineTo(80, -115).stroke(line(wood.line, 8)).circle(80, -115, 15).fill(swatch.white.fill); break;
    case 'Y':
      g.moveTo(0, -140).lineTo(0, -30).stroke(line(wood.line, 4)).circle(0, 45,  80).fill(swatch.red.fill).stroke(line(swatch.red.line)).circle(0, 45,  30).fill(swatch.yellow.fill).circle(0, 45, 8).fill(swatch.red.line); break;
    case 'Z':
      g.roundRect(-95, -40, 155, 90, 30).fill(swatch.white.fill).stroke(line()).roundRect(45, -115,  50, 120, 20).fill(swatch.white.fill).stroke(line());
      for (let i = 0; i < 4; i++) g.poly([-80 + i * 35, -35, - 60 + i * 35, -35, -75 + i * 35,  40]).fill(ink);
      g.moveTo(-75, 45).lineTo(-75, 110).moveTo(40, 45).lineTo(40, 110).stroke(line(ink, 12)).circle(78, -90, 5).fill(ink); break;
  }
  return c;
}
