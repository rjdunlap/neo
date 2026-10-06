import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../art/critter';
import { cream, ink, swatch, type ColorName } from '../art/palette';
import { musicNote, shapePath, type ShapeKind } from '../art/shapes';
import type { HubIcon } from './types';

export class WigglyIcon extends Container implements HubIcon {
  private clock = 0;
  constructor(art: Container) { super(); this.addChild(art); }
  update(dt: number) { this.clock += dt; this.rotation = Math.sin(this.clock * 1.6) * 0.025; }
}

export function tile(w: number, h = w, color: ColorName = 'white'): Graphics {
  return new Graphics().roundRect(-w / 2, -h / 2 + 5, w, h, 18).fill(swatch[color].line)
    .roundRect(-w / 2, -h / 2, w, h, 18).fill(swatch[color].fill).stroke({ width: 4, color: swatch[color].line });
}

export function symbol(kind: 'shape' | 'animal' | 'bell', index: number, size: number): Container {
  if (kind === 'animal') {
    const names = ['cat', 'cow', 'duck'] as const;
    const c = new Critter(CRITTERS[names[index % 3]]);
    c.alive = false;
    c.scale.set(size / 150);
    c.y = size * 0.8;
    return c;
  }
  if (kind === 'bell') {
    const g = new Graphics().poly([-size * 0.65, size * 0.35, -size * 0.5, -size * 0.4, 0, -size * 0.7, size * 0.5, -size * 0.4, size * 0.65, size * 0.35]).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line, join: 'round' });
    g.circle(0, size * 0.55, size * 0.16).fill(swatch.orange.fill);
    return g;
  }
  const colors: ColorName[] = ['red', 'blue', 'yellow'];
  const shapes: ShapeKind[] = ['circle', 'triangle', 'square'];
  const sw = swatch[colors[index % 3]];
  return shapePath(new Graphics(), shapes[index % 3], size).fill(sw.fill).stroke({ width: 4, color: sw.line });
}

export function trainArt(): Container {
  const c = new Container();
  const g = new Graphics().roundRect(-100, -90, 100, 65, 12).fill(swatch.teal.fill).stroke({ width: 5, color: swatch.teal.line })
    .roundRect(-60, -140, 60, 55, 10).fill(swatch.teal.fill).stroke({ width: 5, color: swatch.teal.line }).rect(-48, -130, 35, 28).fill(cream)
    .rect(-88, -118, 18, 30).fill(swatch.orange.fill);
  for (let i = 0; i < 3; i++) g.roundRect(10 + i * 67, -84, 58, 58, 9).fill([swatch.red.fill, swatch.blue.fill, swatch.yellow.fill][i]).stroke({ width: 4, color: ink });
  for (const x of [-78, -22, 25, 55, 92, 122, 159, 189]) g.circle(x, -20, 13).fill(ink).circle(x, -20, 5).fill(cream);
  c.addChild(g);
  c.pivot.x = 45;
  return c;
}

export function robotArt(size = 100): Container {
  const c = new Container();
  const g = new Graphics().roundRect(-50, -105, 100, 80, 18).fill(swatch.teal.fill).stroke({ width: 5, color: swatch.teal.line })
    .circle(-20, - 70, 11).circle(20, - 70, 11).fill(cream).circle(-18, - 70, 5).circle(22, - 70, 5).fill(ink)
    .roundRect(-20, -45, 40, 8, 4).fill(swatch.teal.line).moveTo(0, -105).lineTo(0, -125).stroke({ width: 6, color: swatch.teal.line }).circle(0, -130, 8).fill(swatch.yellow.fill)
    .roundRect(-40, -20, 30, 18, 7).roundRect(10, -20, 30, 18, 7).fill(swatch.purple.fill);
  c.addChild(g); c.scale.set(size / 100); return c;
}

export function replayArt(): Graphics { return musicNote(new Graphics(), 42, ink); }
