import { Graphics } from 'pixi.js';
import { ink, swatch } from './palette';
import { isPlantRule, type Rule } from '../learning/sorting/rules';
import { plantRuleIcon } from './sort-plants';

/** A little picture of a rule, for the sign above a hoop. */
export function ruleIcon(rule: Rule): Graphics {
  if (isPlantRule(rule)) return plantRuleIcon(rule);
  const g = new Graphics();
  const head = (color: number) => g.circle(0, 6, 26).fill(color).stroke({ width: 4, color: ink, alpha: 0.5 });
  switch (rule) {
    case 'hat':
      g.ellipse(0, 22, 40, 9)
        .fill(ink)
        .roundRect(-24, -28, 48, 50, 6)
        .fill(ink)
        .rect(-24, 6, 48, 8)
        .fill(swatch.red.fill);
      break;
    case 'brown':
    case 'white': {
      const sw = rule === 'brown' ? swatch.brown : swatch.white;
      g.moveTo(-30, 0)
        .bezierCurveTo(-34, -30, 20, -34, 30, -10)
        .bezierCurveTo(40, 20, -10, 34, -24, 22)
        .closePath()
        .fill(sw.fill)
        .stroke({ width: 4, color: sw.line });
      break;
    }
    case 'floppy':
      head(swatch.white.light);
      g.ellipse(-28, 10, 10, 24)
        .ellipse(28, 10, 10, 24)
        .fill(swatch.brown.fill)
        .stroke({ width: 3, color: swatch.brown.line });
      break;
    case 'pointy':
      g.poly([-26, -6, -18, -34, -4, -14])
        .poly([26, -6, 18, -34, 4, -14])
        .fill(swatch.orange.fill)
        .stroke({ width: 3, color: swatch.orange.line, join: 'round' });
      head(swatch.white.light);
      break;
    case 'whiskers':
      head(swatch.white.light);
      for (const s of [-1, 1])
        for (const dy of [-4, 6])
          g.moveTo(s * 12, 10)
            .lineTo(s * 42, 10 + dy * 1.5)
            .stroke({ width: 3, color: ink, cap: 'round' });
      break;
  }
  return g;
}
