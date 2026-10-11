import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { flower, puffs } from '../../art/shapes';
import { tile } from '../shared';
import { isCause, type CauseId, type StoryCard } from './logic';

const cloudGray = { fill: 0xd5d9e6, line: 0x8f95ab };
/** A four-point sparkle. */
const sparkle = (g: Graphics, x: number, y: number, r: number) => g.poly([x, y - r, x + r * 0.28, y - r * 0.28, x + r, y, x + r * 0.28, y + r * 0.28, x, y + r, x - r * 0.28, y + r * 0.28, x - r, y, x - r * 0.28, y - r * 0.28]);

/** The same camera and palette at every step make the change itself easy to see. */
export function storyPicture(card: StoryCard): Container {
  if (isCause(card.story)) return causePicture(card.story, card.stage);
  const c = new Container(), g = new Graphics();
  c.addChild(g);
  const stroke = (color: number) => ({ width: 4, color, cap: 'round' as const, join: 'round' as const });
  const stage = card.stage;
  switch (card.story) {
    case 'tower': {
      g.roundRect(-66, 59, 132, 10, 5).fill(swatch.green.fill);
      const colors = [swatch.blue, swatch.yellow, swatch.pink, swatch.teal];
      for (let i = 0; i <= stage; i++) {
        const w = 105 - i * 18, y = 30 - i * 29, col = colors[i];
        g.roundRect(-w / 2, y, w, 29, 5).fill(col.fill).stroke(stroke(col.line));
        g.roundRect(-w / 2 + 8, y + 6, w * 0.55, 5, 2).fill({ color: swatch.white.fill, alpha: 0.6 });
      }
      break;
    }
    case 'flower': {
      g.roundRect(-58, 35, 116, 35, 8).fill(swatch.brown.fill).stroke(stroke(swatch.brown.line));
      if (stage === 0) g.ellipse(0, 36, 14, 10).fill(swatch.yellow.light).stroke(stroke(swatch.brown.line));
      else {
        const top = stage === 1 ? 6 : -34;
        g.moveTo(0, 35).lineTo(0, top).stroke({ width: 7, color: swatch.green.line });
        g.ellipse(-15, 20, 18, 8).ellipse(15, 8, 18, 8).fill(swatch.green.fill).stroke(stroke(swatch.green.line));
        if (stage === 2) g.ellipse(0, -39, 15, 20).fill(swatch.pink.fill).stroke(stroke(swatch.pink.line));
        if (stage === 3) { const bloom = flower(new Graphics(), 15, swatch.pink.fill, swatch.pink.line); bloom.y = -39; c.addChild(bloom); }
      }
      break;
    }
    case 'snow': {
      g.ellipse(0, 67, 68, 10).fill(swatch.blue.light);
      g.circle(0, 35, 34).fill(swatch.white.fill).stroke(stroke(swatch.blue.line));
      if (stage > 0) g.circle(0, -9, 27).fill(swatch.white.fill).stroke(stroke(swatch.blue.line));
      if (stage > 1) g.circle(0, -47, 22).fill(swatch.white.fill).stroke(stroke(swatch.blue.line));
      if (stage === 3) {
        g.roundRect(-27, -65, 54, 9, 4).rect(-17, -82, 34, 19).fill(swatch.purple.fill).stroke(stroke(swatch.purple.line));
        g.circle(-7, -48, 3).circle(7, -48, 3).circle(0, -10, 3).circle(0, 7, 3).fill(ink);
        g.poly([0, -41, 24, -36, 0, -33]).fill(swatch.orange.fill);
        g.roundRect(-23, -28, 46, 10, 4).roundRect(12, -25, 10, 30, 3).fill(swatch.red.fill);
        g.moveTo(-24, -8).lineTo(-58, -30).moveTo(24, -8).lineTo(58, -30).stroke(stroke(swatch.brown.line));
      }
      break;
    }
    case 'butterfly': {
      if (stage < 2) {
        g.ellipse(0, 35, 64, 24).fill(swatch.green.fill).stroke(stroke(swatch.green.line));
        g.moveTo(-60, 40).lineTo(60, 28).stroke({ width: 3, color: swatch.green.line });
        if (stage === 0) g.ellipse(0, 7, 16, 23).fill(swatch.yellow.light).stroke(stroke(swatch.yellow.line));
        else {
          for (let i = 0; i < 5; i++) g.circle(-38 + i * 18, 10 - i * 3, 16).fill(swatch.teal.fill).stroke(stroke(swatch.teal.line));
          g.circle(40, -7, 3).fill(ink).moveTo(28, -16).lineTo(22, -30).moveTo(40, -17).lineTo(45, -30).stroke(stroke(swatch.teal.line));
        }
      } else if (stage === 2) {
        g.moveTo(-60, -55).lineTo(60, -55).stroke({ width: 8, color: swatch.brown.line });
        g.moveTo(0, -55).lineTo(0, -38).stroke(stroke(swatch.green.line));
        g.moveTo(0, -39).bezierCurveTo(40, -13, 27, 43, 0, 53).bezierCurveTo(-27, 43, -40, -13, 0, -39).fill(swatch.green.fill).stroke(stroke(swatch.green.line));
        g.moveTo(-23, -5).lineTo(20, 22).moveTo(-17, 24).lineTo(15, 41).stroke(stroke(swatch.green.line));
      } else {
        for (const side of [-1, 1]) {
          g.ellipse(side * 31, -22, 31, 40).ellipse(side * 27, 28, 25, 28).fill(swatch.purple.fill).stroke(stroke(swatch.purple.line));
          g.circle(side * 34, -23, 14).fill(swatch.yellow.fill).circle(side * 28, 28, 10).fill(swatch.pink.fill);
        }
        g.ellipse(0, 0, 9, 43).fill(swatch.purple.line).moveTo(-4, -36).lineTo(-14, -58).moveTo(4, -36).lineTo(14, -58).stroke(stroke(swatch.purple.line));
      }
      break;
    }
    case 'sandcastle': {
      g.roundRect(-72, 44, 144, 26, 10).fill(swatch.yellow.light).stroke(stroke(swatch.yellow.line));
      // A sand tower with a notched top: its base rests on the beach at y 50.
      const sandTower = (cx: number, w: number, top: number) => {
        g.poly([cx - w / 2, 50, cx + w / 2, 50, cx + w / 2 - 5, top, cx - w / 2 + 5, top]).fill(wood.light).stroke(stroke(wood.line));
        for (const dx of [-1, 0, 1]) g.roundRect(cx + dx * (w / 3) - 6, top - 12, 12, 14, 3).fill(wood.light).stroke(stroke(wood.line));
      };
      if (stage === 0) {
        g.poly([-31, -6, 31, -6, 24, 50, -24, 50]).fill(swatch.blue.fill).stroke(stroke(swatch.blue.line));
        g.ellipse(0, -6, 31, 9).fill(wood.light).stroke(stroke(wood.line));
        g.moveTo(-26, 12).lineTo(24, 12).stroke({ width: 4, color: swatch.blue.line });
        g.moveTo(52, 46).lineTo(66, 8).stroke({ width: 5, color: swatch.red.line });
        g.roundRect(56, -8, 26, 22, 5).fill(swatch.red.fill).stroke(stroke(swatch.red.line));
      } else if (stage === 1) sandTower(0, 76, -24);
      else {
        g.roundRect(-52, 8, 104, 42, 4).fill(wood.light).stroke(stroke(wood.line));
        sandTower(-50, 44, -2); sandTower(50, 44, -2); sandTower(0, 52, -42);
        if (stage === 3) {
          g.moveTo(0, -54).lineTo(0, -82).stroke({ width: 5, color: swatch.red.line });
          g.poly([0, -82, 34, -72, 0, -62]).fill(swatch.red.fill).stroke(stroke(swatch.red.line));
        }
        g.roundRect(-9, 26, 18, 24, 9).fill(swatch.brown.line);
      }
      break;
    }
    case 'sandwich': {
      g.ellipse(0, 56, 80, 14).fill(swatch.white.fill).stroke(stroke(swatch.blue.line));
      const bread = (y: number, h: number, round: number) => {
        g.roundRect(-52, y, 104, h, round).fill(swatch.orange.light).stroke(stroke(swatch.brown.line));
        g.roundRect(-40, y + 5, 40, 5, 2).fill({ color: swatch.white.fill, alpha: 0.6 });
      };
      bread(26, 24, 9);
      if (stage >= 1) {
        g.roundRect(-48, 16, 96, 12, 6).fill(swatch.red.fill).stroke(stroke(swatch.red.line));
        g.circle(-22, 22, 3).circle(8, 21, 3).circle(30, 22, 3).fill(swatch.red.light);
      }
      if (stage >= 2) {
        g.poly([-62, 2, 62, 2, 54, 16, -54, 16]).fill(swatch.yellow.fill).stroke(stroke(swatch.yellow.line));
        g.circle(-20, 9, 4).circle(24, 8, 3).fill(swatch.yellow.light);
      }
      if (stage === 3) bread(-26, 30, 18);
      break;
    }
    case 'apple': {
      g.roundRect(-58, 35, 116, 35, 8).fill(swatch.brown.fill).stroke(stroke(swatch.brown.line));
      if (stage === 0) { g.moveTo(0, 8).bezierCurveTo(22, 24, 18, 44, 0, 48).bezierCurveTo(-18, 44, -22, 24, 0, 8).fill(swatch.orange.line).stroke(stroke(swatch.brown.line)); g.ellipse(-5, 28, 4, 7).fill(swatch.orange.light); }
      else if (stage === 1) {
        g.moveTo(0, 35).lineTo(0, -4).stroke({ width: 6, color: swatch.green.line });
        g.circle(-13, -6, 12).circle(13, -12, 12).fill(swatch.green.fill).stroke(stroke(swatch.green.line));
      } else {
        g.roundRect(-9, -12, 18, 50, 4).fill(wood.fill).stroke(stroke(wood.line));
        puffs(g, [[-30, -30, 26], [30, -30, 26], [0, -54, 30], [0, -24, 30]], swatch.green.fill, swatch.green.line, 5);
        if (stage === 3) for (const [x, y] of [[-30, -26], [28, -34], [2, -52], [-4, -14]]) g.circle(x, y, 10).fill(swatch.red.fill).stroke(stroke(swatch.red.line));
      }
      break;
    }
    case 'dog': {
      // A white dog sitting up: mud, then soap, then rinse water, then clean and fluffy.
      g.ellipse(0, 33, 40, 38).fill(swatch.white.fill).stroke(stroke(swatch.white.line));
      g.ellipse(-36, -22, 13, 28).ellipse(36, -22, 13, 28).fill(swatch.brown.light).stroke(stroke(swatch.brown.line));
      g.circle(0, -20, 32).fill(swatch.white.fill).stroke(stroke(swatch.white.line));
      g.circle(-12, -26, 4).circle(12, -26, 4).fill(ink);
      g.ellipse(0, -14, 8, 6).fill(ink);
      g.moveTo(0, -8).lineTo(0, -2).moveTo(-9, 0).quadraticCurveTo(0, 8, 9, 0).stroke({ width: 3, color: ink, cap: 'round' });
      if (stage === 0) {
        for (const [x, y, r] of [[-20, 38, 13], [18, 24, 11], [-6, 58, 9], [14, 50, 8], [-22, -42, 8], [20, -44, 7]]) g.circle(x, y, r).fill(swatch.brown.fill).stroke(stroke(swatch.brown.line));
      } else if (stage === 1) {
        for (const [x, y, r] of [[-22, 30, 15], [20, 22, 13], [0, 50, 14], [-24, 62, 9], [26, 52, 10], [-26, -44, 11], [0, -52, 12], [25, -44, 10], [-8, 14, 9]]) g.circle(x, y, r).fill(swatch.blue.light).stroke(stroke(swatch.blue.line));
      } else if (stage === 2) {
        for (const x of [-52, -26, 0, 26, 52]) {
          const y = -70 + (Math.abs(x) % 3) * 6;
          g.poly([x, y, x - 6, y + 12, x + 6, y + 12]).fill(swatch.blue.fill);
          g.circle(x, y + 14, 6).fill(swatch.blue.fill);
          g.circle(x + 13, y + 52, 6).fill(swatch.blue.fill);
        }
        g.circle(-24, 56, 9).circle(24, 52, 8).fill(swatch.blue.light).stroke(stroke(swatch.blue.line));
      } else {
        for (const [x, y, r] of [[-56, -32, 13], [56, -40, 11], [-50, 38, 9], [54, 28, 10]]) { sparkle(g, x, y, r); g.fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line, join: 'round' }); }
        g.ellipse(0, 5, 7, 9).fill(swatch.pink.fill);
      }
      break;
    }
    case 'rain': {
      g.roundRect(-72, 50, 144, 20, 8).fill(swatch.green.fill).stroke(stroke(swatch.green.line));
      if (stage === 0) {
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.moveTo(Math.cos(a) * 44, -10 + Math.sin(a) * 44).lineTo(Math.cos(a) * 62, -10 + Math.sin(a) * 62); }
        g.stroke({ width: 6, color: swatch.yellow.line, cap: 'round' });
        g.circle(0, -10, 34).fill(swatch.yellow.fill).stroke(stroke(swatch.yellow.line));
        g.circle(-12, -16, 3).circle(12, -16, 3).fill(ink);
        g.moveTo(-12, -2).quadraticCurveTo(0, 10, 12, -2).stroke({ width: 3, color: ink, cap: 'round' });
      } else if (stage === 3) {
        const colors = [swatch.red, swatch.orange, swatch.yellow, swatch.green, swatch.blue, swatch.purple];
        colors.forEach((col, i) => { const r = 78 - i * 8; g.moveTo(-r, 46).arc(0, 46, r, Math.PI, 0).stroke({ width: 8, color: col.fill }); });
        g.ellipse(-30, 61, 28, 7).ellipse(34, 60, 22, 6).fill(swatch.blue.fill);
      } else {
        puffs(g, [[-40, -42, 24], [-8, -52, 30], [28, -42, 26], [-10, -32, 28]], cloudGray.fill, cloudGray.line, 5);
        if (stage === 2) {
          for (const [x, y] of [[-46, -2], [-20, 14], [8, -4], [34, 12], [58, -2], [-4, 34], [-38, 36], [26, 38]]) {
            g.moveTo(x, y).lineTo(x - 6, y + 18).stroke({ width: 5, color: swatch.blue.fill, cap: 'round' });
          }
          g.ellipse(0, 61, 30, 7).fill(swatch.blue.fill);
        }
      }
      break;
    }
    case 'bedtime': {
      if (stage === 0) {
        g.roundRect(-76, 52, 152, 16, 8).fill(swatch.pink.light);
        g.circle(-38, 22, 28).fill(swatch.red.fill).stroke(stroke(swatch.red.line));
        g.moveTo(-60, 14).quadraticCurveTo(-38, 30, -16, 14).stroke({ width: 5, color: swatch.white.fill });
        g.roundRect(4, 14, 46, 38, 6).fill(swatch.blue.fill).stroke(stroke(swatch.blue.line));
        g.roundRect(14, -22, 40, 36, 6).fill(swatch.yellow.fill).stroke(stroke(swatch.yellow.line));
        g.roundRect(46, 32, 30, 20, 6).fill(swatch.teal.fill).stroke(stroke(swatch.teal.line));
      } else if (stage === 1) {
        g.roundRect(-72, 4, 144, 60, 20).fill(swatch.white.fill).stroke(stroke(swatch.blue.line));
        g.roundRect(-62, 14, 124, 12, 6).fill(swatch.blue.light);
        puffs(g, [[-46, -8, 18], [-16, -20, 22], [22, -10, 20], [50, -4, 14]], swatch.white.fill, swatch.blue.line, 4);
        g.circle(-8, 12, 14).fill(swatch.yellow.fill).stroke(stroke(swatch.yellow.line));
        g.poly([4, 10, 16, 14, 4, 18]).fill(swatch.orange.fill);
        g.circle(-12, 8, 3).fill(ink);
      } else if (stage === 2) {
        g.poly([-30, -74, -12, -66, 12, -66, 30, -74, 62, -40, 44, -20, 32, -32, 32, 10, -32, 10, -32, -32, -44, -20, -62, -40]).fill(swatch.purple.fill).stroke(stroke(swatch.purple.line));
        g.poly([-32, 20, 32, 20, 38, 74, 6, 74, 0, 44, -6, 74, -38, 74]).fill(swatch.purple.fill).stroke(stroke(swatch.purple.line));
        for (const [x, y] of [[-14, -42], [12, -32], [-4, -8], [18, -54]]) { sparkle(g, x, y, 8); g.fill(swatch.yellow.fill); }
      } else {
        g.roundRect(-76, 24, 152, 40, 8).fill(wood.fill).stroke(stroke(wood.line));
        g.roundRect(-72, -2, 50, 28, 12).fill(swatch.white.fill).stroke(stroke(swatch.white.line));
        g.circle(-48, -12, 21).fill(swatch.pink.light).stroke(stroke(swatch.pink.line));
        g.moveTo(-58, -14).quadraticCurveTo(-54, -9, -50, -14).moveTo(-44, -14).quadraticCurveTo(-40, -9, -36, -14).stroke({ width: 3, color: ink, cap: 'round' });
        g.roundRect(-64, 8, 134, 40, 16).fill(swatch.blue.fill).stroke(stroke(swatch.blue.line));
        for (const x of [-30, 0, 30]) g.circle(x, 28, 5).fill(swatch.blue.light);
        g.circle(44, -52, 18).fill(swatch.yellow.fill).stroke(stroke(swatch.yellow.line));
        g.circle(52, -58, 15).fill(swatch.white.fill);
        sparkle(g, 14, -66, 8); g.fill(swatch.yellow.fill);
      }
      break;
    }
    default: { const never: never = card.story; throw new Error(`Unknown story ${never as string}`); }
  }
  return c;
}
export function storyCard(card: StoryCard, size = 164): Container {
  const c = new Container(); c.addChild(tile(size, size, 'white'));
  const picture = storyPicture(card); picture.scale.set((size - 24) / 170); c.addChild(picture);
  return c;
}
export function storySticker(): Container {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-125, -150, 250, 160, 18).fill(cream).stroke({ width: 6, color: swatch.teal.line }));
  const a = storyPicture({ story: 'flower', stage: 0 }), b = storyPicture({ story: 'flower', stage: 3 });
  a.scale.set(0.75); b.scale.set(0.75); a.position.set(-65, -65); b.position.set(65, -65);
  c.addChild(a, b, new Graphics().moveTo(-9, -77).lineTo(7, -65).lineTo(-9, -53).stroke({ width: 6, color: swatch.teal.line }));
  return c;
}

/** Same objects in both pictures; the action is visible on the cause, its result on the effect. */
function causePicture(id: CauseId, stage: number): Container {
  const c = new Container(), g = new Graphics(); c.addChild(g);
  const effect = stage === 1;
  const outline = (color: number) => ({ width: 4, color, cap: 'round' as const, join: 'round' as const });
  const hand = (x: number, y: number) => {
    g.roundRect(x, y, 46, 20, 8).roundRect(x + 24, y - 17, 18, 28, 7).fill(swatch.orange.light).stroke(outline(swatch.brown.line));
  };
  const motion = (x: number, y: number) => {
    g.moveTo(x - 15, y - 14).lineTo(x, y).lineTo(x - 15, y + 14).moveTo(x - 28, y).lineTo(x, y).stroke(outline(swatch.teal.line));
  };
  switch (id) {
    case 'spill': {
      g.roundRect(-70, 48, 140, 12, 5).fill(wood.fill).stroke(outline(wood.line));
      const cup = new Graphics().poly([-25, -30, 25, -30, 20, 25, -20, 25]).fill(swatch.blue.fill).stroke(outline(swatch.blue.line));
      cup.position.set(-22, effect ? 24 : -12); cup.rotation = effect ? Math.PI / 2 : Math.PI / 4; c.addChild(cup);
      if (!effect) { hand(-72, -38); motion(65, 1); }
      g.ellipse(38, 44, effect ? 28 : 18, 8).fill(swatch.blue.fill);
      if (!effect) g.moveTo(10, -14).quadraticCurveTo(35, 0, 38, 38).stroke({ width: 8, color: swatch.blue.fill });
      break;
    }
    case 'towerFall': {
      const cols = [swatch.blue, swatch.yellow, swatch.pink];
      cols.forEach((col, i) => { const x = effect ? -58 + i * 42 : -20, y = effect ? 28 + (i % 2) * 12 : 28 - i * 38; g.roundRect(x, y, 38, 36, 5).fill(col.fill).stroke(outline(col.line)); });
      if (!effect) { hand(-72, -44); motion(63, -22); }
      break;
    }
    case 'muddyBoot': {
      if (!effect) g.ellipse(0, 52, 70, 16).fill(swatch.brown.fill).stroke(outline(swatch.brown.line));
      g.poly([-24, -50, 18, -50, 18, 20, 48, 20, 56, 42, -24, 42]).fill(swatch.yellow.fill).stroke(outline(swatch.yellow.line));
      if (effect) for (const [x, y, r] of [[-8, 10, 12], [27, 30, 14], [0, -24, 9]]) g.circle(x, y, r).fill(swatch.brown.fill);
      else { g.moveTo(-48, -28).lineTo(-48, 24).lineTo(-58, 10).moveTo(-48, 24).lineTo(-38, 10).stroke(outline(swatch.teal.line)); for (const x of [-48, 44, 62]) g.moveTo(x, 36).lineTo(x + 4, 16).stroke(outline(swatch.brown.line)); }
      break;
    }
    case 'balloonPop': {
      if (!effect) {
        g.ellipse(12, -18, 40, 49).fill(swatch.red.fill).stroke(outline(swatch.red.line));
        g.poly([12, 31, 4, 40, 20, 40]).fill(swatch.red.fill);
        g.moveTo(12, 40).quadraticCurveTo(-4, 54, 10, 72).stroke(outline(swatch.red.line));
        g.moveTo(-62, -18).lineTo(-28, -18).stroke(outline(ink)); g.circle(-62, -18, 8).fill(swatch.yellow.fill).stroke(outline(swatch.yellow.line));
        motion(-36, -45);
      } else {
        g.poly([-40, -35, -10, -22, -28, -8]).poly([22, -40, 48, -26, 35, -2]).poly([-6, 12, 20, 26, 0, 38]).fill(swatch.red.fill).stroke(outline(swatch.red.line));
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.moveTo(Math.cos(a) * 46, Math.sin(a) * 46).lineTo(Math.cos(a) * 64, Math.sin(a) * 64); } g.stroke(outline(swatch.yellow.line));
      }
      break;
    }
    case 'lampOn': {
      g.roundRect(-8, 2, 16, 52, 5).roundRect(-36, 50, 72, 12, 5).fill(swatch.teal.fill).stroke(outline(swatch.teal.line));
      if (effect) { for (const [x, y] of [[-64, -34], [64, -34], [-58, 12], [58, 12], [0, -70]]) g.moveTo(x * 0.8, y * 0.8).lineTo(x, y).stroke({ width: 6, color: swatch.yellow.line, cap: 'round' }); }
      g.poly([-24, -50, 24, -50, 44, 4, -44, 4]).fill(effect ? swatch.yellow.fill : swatch.blue.fill).stroke(outline(effect ? swatch.yellow.line : swatch.blue.line));
      if (!effect) { g.roundRect(38, 28, 28, 36, 5).fill(swatch.white.fill).stroke(outline(ink)); g.roundRect(45, 33, 14, 15, 3).fill(swatch.teal.fill); hand(9, 38); }
      break;
    }
    case 'bellRing': {
      g.moveTo(-34, 24).quadraticCurveTo(-30, -43, 0, -46).quadraticCurveTo(30, -43, 34, 24).closePath().fill(swatch.yellow.fill).stroke(outline(swatch.yellow.line));
      g.ellipse(0, 25, 38, 10).fill(swatch.yellow.light).stroke(outline(swatch.yellow.line)); g.circle(0, 33, 8).fill(swatch.yellow.line);
      g.moveTo(0, -46).lineTo(0, -67).stroke(outline(swatch.brown.line));
      if (!effect) { g.moveTo(-65, 58).lineTo(-31, 5).stroke({ width: 9, color: wood.line }); g.circle(-31, 5, 12).fill(wood.fill).stroke(outline(wood.line)); motion(-42, -27); }
      else for (const side of [-1, 1]) { g.moveTo(side * 48, -32).quadraticCurveTo(side * 65, -5, side * 48, 20).moveTo(side * 62, -42).quadraticCurveTo(side * 82, -5, side * 62, 30).stroke(outline(swatch.teal.line)); }
      break;
    }
    case 'paperCut': {
      if (effect) { g.poly([-60, -45, -12, -45, -12, 48, -60, 48]).poly([12, -45, 60, -45, 60, 48, 12, 48]).fill(swatch.purple.fill).stroke(outline(swatch.purple.line)); }
      else {
        g.roundRect(-55, -52, 110, 112, 5).fill(swatch.purple.fill).stroke(outline(swatch.purple.line));
        g.moveTo(0, 60).lineTo(0, 8).stroke({ width: 4, color: cream });
        g.moveTo(-20, 23).lineTo(16, -34).moveTo(20, 23).lineTo(-16, -34).stroke({ width: 7, color: swatch.white.line });
        g.circle(-22, 34, 13).circle(22, 34, 13).stroke({ width: 8, color: swatch.red.fill });
      }
      break;
    }
    case 'tracks': {
      g.roundRect(-74, -45, 148, 110, 15).fill(swatch.yellow.light).stroke(outline(swatch.yellow.line));
      const end = effect ? 60 : 10;
      for (let x = -60; x < end; x += 14) for (const y of [-3, 34]) g.roundRect(x, y, 8, 6, 2).fill(swatch.brown.line);
      if (!effect) {
        g.roundRect(5, 0, 62, 30, 8).roundRect(19, -17, 30, 30, 7).fill(swatch.blue.fill).stroke(outline(swatch.blue.line));
        g.circle(19, 32, 10).circle(54, 32, 10).fill(ink); motion(-23, -24);
      }
      break;
    }
  }
  return c;
}
