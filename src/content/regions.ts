import { Graphics } from 'pixi.js';
import { cream, grass, swatch, wood } from '../art/palette';
import type { BackdropStyle } from '../art/scenery';
import { flower, musicNote, puffs } from '../art/shapes';
import type { LineId } from './voice-script';
import type { RegionId } from './world';

export interface Region {
  id: RegionId;
  name: string;
  line: LineId;
  /** Fractions of the map's usable rectangle, independent of screen size. */
  x: number;
  y: number;
  backdrop: BackdropStyle;
  decor: 'farm' | 'garden' | 'plain';
  landmark(): Graphics;
}

function landmark(id: RegionId): Graphics {
  const g = new Graphics();
  const line = { width: 5, color: wood.line, join: 'round' as const, cap: 'round' as const };
  switch (id) {
    case 'bubble-beach':
      g.ellipse(0, 25, 63, 25).fill(swatch.yellow.light);
      for (const [x, y, r] of [[-30, -12, 23], [22, -35, 30], [34, 20, 18]]) g.circle(x, y, r).fill(swatch.blue.light).stroke({ ...line, color: swatch.blue.line }).circle(x - 7, y - 8, 6).fill(swatch.white.fill);
      break;
    case 'music-mountain':
      g.poly([-65, 45, -12, -64, 58, 45]).fill(swatch.purple.fill).stroke({ ...line, color: swatch.purple.line });
      musicNote(g, 55, swatch.yellow.fill);
      break;
    case 'treehouse':
      g.roundRect(-13, -15, 26, 80, 5).fill(wood.fill).stroke(line);
      puffs(g, [[-33, -25, 35], [0, -55, 39], [37, -25, 34]], swatch.green.fill, swatch.green.line);
      g.roundRect(-29, -25, 58, 46, 6).fill(wood.light).stroke(line).rect(-9, -10, 18, 30).fill(wood.line);
      break;
    case 'barnyard':
      g.roundRect(-52, -15, 104, 70, 8).fill(swatch.red.fill).stroke({ ...line, color: swatch.red.line });
      g.poly([-64, -15, 0, -63, 64, -15]).fill(swatch.red.line).stroke(line);
      g.rect(-23, 5, 46, 50).fill(wood.light).stroke(line).moveTo(-23, 5).lineTo(23, 55).moveTo(23, 5).lineTo(-23, 55).stroke(line);
      break;
    case 'counting-cove':
      g.ellipse(0, 18, 65, 40).fill(swatch.blue.fill).stroke({ ...line, color: swatch.blue.line });
      for (let i = 0; i < 3; i++) g.circle(-34 + i * 34, 12 - (i % 2) * 12, 15).fill(swatch.yellow.fill).circle(-30 + i * 34, -2 - (i % 2) * 12, 10).fill(swatch.yellow.fill);
      break;
    case 'cozy-village':
      g.roundRect(-44, -15, 88, 72, 9).fill(swatch.orange.light).stroke(line).poly([-58, -15, 0, -65, 58, -15]).fill(swatch.pink.fill).stroke(line).roundRect(-14, 15, 28, 42, 5).fill(swatch.teal.fill).stroke(line);
      break;
    case 'rainbow-meadow':
      flower(g, 60, swatch.pink.fill, swatch.pink.line, swatch.yellow.fill);
      break;
    case 'puzzle-peaks':
      g.poly([-67, 50, -28, -49, 16, 50]).fill(swatch.teal.fill).stroke({ ...line, color: swatch.teal.line }).poly([-4, 50, 37, -64, 70, 50]).fill(swatch.blue.fill).stroke({ ...line, color: swatch.blue.line });
      g.circle(32, 0, 13).fill(swatch.yellow.fill);
      break;
    case 'story-grove':
      g.roundRect(-60, -35, 120, 86, 10).fill(cream).stroke({ ...line, color: swatch.purple.line }).moveTo(0, -35).lineTo(0, 50).stroke({ ...line, color: swatch.purple.line });
      g.poly([-42, 25, -27, -13, -12, 25]).stroke({ ...line, color: swatch.purple.fill }).moveTo(-36, 11).lineTo(-18, 11).stroke({ ...line, color: swatch.purple.fill });
      g.circle(31, 0, 16).fill(swatch.yellow.fill);
      break;
    case 'tinker-lab':
      g.roundRect(-48, -38, 96, 80, 18).fill(swatch.teal.fill).stroke({ ...line, color: swatch.teal.line }).moveTo(0, -38).lineTo(0, -60).stroke(line).circle(0, -65, 9).fill(swatch.yellow.fill);
      g.circle(-20, -4, 12).circle(20, -4, 12).fill(swatch.white.fill).roundRect(-22, 22, 44, 7, 3).fill(swatch.teal.line);
      break;
  }
  return g;
}

function region(id: RegionId, name: string, x: number, y: number, color: keyof typeof swatch, decor: Region['decor'] = 'plain'): Region {
  return { id, name, x, y, line: `region.${id}` as LineId, decor, landmark: () => landmark(id), backdrop: { sky: [swatch[color].light, cream], hills: [swatch[color].light, swatch.green.light, grass], horizon: 0.6, clouds: 3, sun: true, seed: id.length * 17 } };
}

export const REGIONS: Region[] = [
  region('music-mountain', 'Music Mountain', 0.18, 0.08, 'purple'),
  region('puzzle-peaks', 'Puzzle Peaks', 0.50, 0, 'blue'),
  region('tinker-lab', 'Tinker Lab', 0.82, 0.08, 'teal'),
  region('barnyard', 'Barnyard', 0.04, 0.50, 'yellow', 'farm'),
  region('rainbow-meadow', 'Rainbow Meadow', 0.35, 0.47, 'green', 'garden'),
  region('story-grove', 'Story Grove', 0.65, 0.47, 'purple', 'garden'),
  region('treehouse', 'Treehouse', 0.96, 0.50, 'green'),
  region('bubble-beach', 'Bubble Beach', 0.18, 0.95, 'yellow'),
  region('counting-cove', 'Counting Cove', 0.50, 1, 'blue'),
  region('cozy-village', 'Cozy Village', 0.82, 0.95, 'pink'),
];

export const regionById = (id: RegionId) => REGIONS.find((r) => r.id === id)!;
