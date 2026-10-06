import { Graphics } from 'pixi.js';
import type { StickerPage } from '../content/world';
import { cream, grass, ink, swatch, wood } from './palette';
import { starPoints } from './shapes';

export interface PageArea { x: number; y: number; w: number; h: number }

/** Five reusable play scenes, all drawn within the page area. */
export function drawStickerScene(g: Graphics, page: StickerPage, a: PageArea) {
  const { x, y, w, h } = a;
  g.clear().roundRect(x - 8, y - 8, w + 16, h + 16, 28).fill(swatch.white.fill).stroke({ width: 5, color: swatch.brown.light });
  const sky = page === 'space' ? ink : page === 'sea' ? swatch.blue.fill : swatch.blue.light;
  g.roundRect(x, y, w, h, 22).fill(sky);
  if (page === 'space') {
    for (let i = 0; i < 23; i++) {
      const px = x + 30 + (i * 137) % (w -60), py = y + 20 + (i * 79) % (h - 40);
      g.poly(starPoints(7, 3).map((v, j) => v + (j % 2 ? py : px))).fill(swatch.yellow.light);
    }
    g.ellipse(x + w * 0.7, y + h * 0.37, 110, 28).stroke({ width: 12, color: swatch.pink.light });
    g.circle(x + w * 0.7, y + h * 0.37, 60).fill(swatch.purple.fill).circle(x + w * 0.7 - 15, y + h * 0.37 - 16, 15).fill(swatch.purple.light);
    return;
  }
  const ground = page === 'beach' || page === 'sea' ? swatch.yellow.light : grass;
  g.rect(x, y + h * 0.7, w, h * 0.26).fill(ground).roundRect(x, y + h * 0.8, w, h * 0.2, 22).fill(ground);
  if (page === 'sea') {
    for (let i = 0; i < 6; i++) {
      const sx = x + 35 + i * (w - 70) / 5;
      g.moveTo(sx, y + h - 12).bezierCurveTo(sx - 30, y + h - 70, sx + 30, y + h - 100, sx, y + h - 155).stroke({ width: 15, color: swatch.green.fill, cap: 'round' });
      g.circle(Math.min(x + w - 18, sx + 30), y + h * 0.3 + i * 12, 12).stroke({ width: 3, color: swatch.teal.light });
    }
  } else {
    g.circle(x + w - 95, y + 70, 40).fill(swatch.yellow.fill);
    if (page === 'beach') {
      g.rect(x, y + h * 0.5, w, h * 0.25).fill(swatch.teal.fill);
      for (let i = 0; i < 5; i++) g.ellipse(x + 70 + i * (w - 140) / 4, y + h * 0.68, 45, 6).fill(swatch.white.fill);
    }
    if (page === 'farm') {
      const bx = x + w * 0.25, by = y + h * 0.67;
      g.roundRect(bx - 90, by - 110, 180, 120, 7).fill(swatch.red.fill).stroke({ width: 5, color: swatch.red.line });
      g.poly([bx - 110, by - 110, bx, by - 185, bx + 110, by - 110]).fill(wood.line);
      g.rect(bx - 33, by - 70, 66, 80).fill(wood.light);
      for (let i = 0; i < 7; i++) g.roundRect(x + w * 0.5 + i * w * 0.065, by - 40, 12, 68, 4).fill(cream);
      g.rect(x + w * 0.5, by - 25, w * 0.47, 10).fill(cream);
    }
    if (page === 'meadow') {
      for (let i = 0; i < 7; i++) {
        const px = x + 45 + i * (w - 90) / 6, py = y + h * 0.84 + (i % 2) * 24;
        g.moveTo(px, py + 20).lineTo(px, py - 10).stroke({ width: 6, color: swatch.green.line });
        for (let petal = 0; petal < 5; petal++) {
          const angle = petal * Math.PI * 2 / 5;
          g.circle(px + Math.cos(angle) * 11, py - 12 + Math.sin(angle) * 11, 10).fill(swatch.pink.fill);
        }
        g.circle(px, py - 12, 7).fill(swatch.yellow.fill);
      }
    }
  }
}
