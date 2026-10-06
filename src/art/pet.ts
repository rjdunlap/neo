import { Graphics } from 'pixi.js';
import { store } from '../progress/store';
import { Critter, CRITTERS, type CritterSpec } from './critter';
import { swatch } from './palette';

export function petSpec(): CritterSpec {
  return { ...CRITTERS.pip, color: store.data.pet.color };
}

export function makePet(): Critter {
  return new Critter(petSpec());
}

/** Shared egg for the start screen and the four-tap hatching scene. */
export function drawEgg(g: Graphics, cracks = 0): Graphics {
  g.clear().ellipse(0, 0, 100, 130).fill(swatch.white.fill).stroke({ width: 7, color: swatch.teal.line });
  for (const [x, y, r] of [[-35, -60, 18], [38, -20, 22], [-40, 55, 20], [30, 75, 14]]) {
    g.circle(x, y, r).fill(swatch.teal.light);
  }
  if (cracks) {
    g.moveTo(-82, -30);
    for (let i = 0; i <= Math.min(8, cracks * 2); i++) g.lineTo(-80 + i * 20, i % 2 ? 8 : -25);
    g.stroke({ width: 6, color: swatch.teal.line, join: 'round', cap: 'round' });
  }
  return g;
}
