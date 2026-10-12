import { Container, Graphics } from 'pixi.js';
import { swatch, wood } from '../../art/palette';
import { storyCard } from './art';
import { predictionCard, type Prediction } from './predictions';

export function predictionPicture(p: Prediction, step: number, ending?: number): Container {
  if (ending !== undefined) return storyCard(predictionCard(p, ending));
  const c = storyCard({ story: p.story, stage: p.stages[step] });
  if (step === 1 && p.id === 'clouds') {
    c.addChild(new Graphics().ellipse(33, -20, 30, 16).circle(22, -32, 17).fill(swatch.blue.light).stroke({ width: 3, color: swatch.blue.line }));
  }
  if (step !== 2) return c;
  const g = new Graphics(); g.scale.set(140 / 170); c.addChild(g);
  const line = { width: 4, color: swatch.brown.line };
  switch (p.id) {
    case 'push':
      g.roundRect(-78, -36, 50, 20, 8).roundRect(-46, -51, 18, 32, 6).fill(swatch.orange.light).stroke(line);
      g.moveTo(45, -35).lineTo(67, -25).lineTo(49, -13).stroke({ width: 5, color: swatch.teal.line }); break;
    case 'bucket': {
      c.children[1].visible = false;
      g.roundRect(-75, 50, 150, 20, 8).fill(swatch.yellow.light).stroke({ width: 3, color: swatch.yellow.line });
      g.poly([-65, 50, -16, 50, -21, -6, -60, -6]).fill(wood.light).stroke({ width: 4, color: wood.line });
      for (const x of [-59, -44, -29]) g.rect(x, -14, 10, 12).fill(wood.light).stroke({ width: 3, color: wood.line });
      const bucket = new Graphics().poly([-23, -20, 23, -20, 18, 23, -18, 23]).fill(swatch.blue.fill).stroke({ width: 4, color: swatch.blue.line });
      bucket.ellipse(0, -20, 23, 7).fill(wood.light).stroke({ width: 3, color: wood.line });
      bucket.scale.set(140 / 170); bucket.position.set(42 * 140 / 170, -20 * 140 / 170); bucket.rotation = -0.7; c.addChild(bucket);
      g.moveTo(14, -34).quadraticCurveTo(7, 0, 28, 47).stroke({ width: 8, color: wood.light });
      g.ellipse(31, 48, 23, 7).fill(wood.light);
      break;
    }
    case 'bread':
      g.roundRect(-52, -65, 104, 24, 12).fill(swatch.orange.light).stroke(line);
      g.moveTo(65, -51).lineTo(65, -5).lineTo(56, -17).moveTo(65, -5).lineTo(74, -17).stroke({ width: 4, color: swatch.teal.line }); break;
    case 'bud':
      g.ellipse(-15, -41, 14, 9).ellipse(15, -41, 14, 9).fill(swatch.pink.fill).stroke({ width: 3, color: swatch.pink.line }); break;
    case 'apple':
      g.circle(28, -34, 12).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line });
      g.moveTo(28, -46).lineTo(31, -54).stroke({ width: 4, color: swatch.green.line }); break;
    case 'wings':
      g.moveTo(-10, -31).lineTo(7, -15).lineTo(-4, 1).lineTo(10, 19).stroke({ width: 4, color: wood.line });
      g.ellipse(21, -25, 22, 28).fill(swatch.purple.fill).stroke({ width: 4, color: swatch.purple.line });
      g.circle(25, -24, 9).fill(swatch.yellow.fill); break;
    case 'sleep':
      g.roundRect(-78, 35, 54, 25, 10).fill(swatch.white.fill).stroke({ width: 3, color: swatch.blue.line });
      g.roundRect(25, 28, 53, 43, 7).fill(swatch.blue.fill).stroke({ width: 3, color: swatch.blue.line }); break;
    case 'clouds': break;
  }
  return c;
}
