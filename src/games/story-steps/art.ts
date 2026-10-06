import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { flower } from '../../art/shapes';
import { tile } from '../shared';
import type { StoryCard } from './logic';

/** The same camera and palette at every step make the change itself easy to see. */
export function storyPicture(card: StoryCard): Container {
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
