import { Container, Graphics } from 'pixi.js';
import { owlArt, henArt } from '../../art/animals';
import { cream, ink, swatch, wood } from '../../art/palette';
import { drawFarBarn, type BackdropStyle } from '../../art/scenery';
import { gull, shell } from '../../art/shore';
import type { View } from '../../engine/view';
import { SCENES, walkLandmark, type WalkPlace, type WalkStop } from './logic';

export const WALK_BACKDROPS = {
  woods: {
    sky: [swatch.teal.light, cream],
    hills: [swatch.teal.fill, swatch.green.line, swatch.green.light],
    horizon: 0.61,
    clouds: 2,
    seed: 17,
  },
  beach: SCENES.beach,
  farm: {
    sky: [swatch.blue.light, swatch.yellow.light],
    hills: [swatch.green.light, swatch.green.fill, swatch.yellow.light],
    horizon: 0.63,
    sun: true,
    clouds: 2,
    seed: 7,
  },
} satisfies Record<WalkPlace, BackdropStyle>;

function pine(g: Graphics, x: number, y: number, size: number, color: number) {
  g.roundRect(x - size * 0.05, y - size * 0.42, size * 0.1, size * 0.42, 3).fill(wood.line);
  for (const row of [0, 1, 2]) {
    const tip = y - size + row * size * 0.19;
    const half = size * (0.19 + row * 0.045);
    g.poly([x, tip, x - half, tip + size * 0.42, x + half, tip + size * 0.42]).fill(color);
  }
}

/** Each stop swaps the scenery behind the pet. Reuse the graphics and the owl throughout the round. */
export class WalkScenery extends Container {
  private readonly setting = new Graphics();
  private readonly landmark = new Graphics();
  private readonly owl;

  constructor(
    private stop: WalkStop,
    private view: View,
  ) {
    super();
    this.eventMode = 'none';
    this.addChild(this.setting, this.landmark);
    this.owl = stop.place === 'woods' ? owlArt('brown') : null;
    if (this.owl) {
      this.owl.alive = false;
      this.owl.visible = false;
      this.owl.scale.set(0.39);
      this.landmark.addChild(this.owl);
    }
    this.resize(view);
  }

  show(stop: WalkStop) {
    this.stop = stop;
    this.resize(this.view);
  }

  resize(view: View) {
    this.view = view;
    const { place, landmark } = this.stop;
    const { x, y, scale } = walkLandmark(view);
    const base = view.h * WALK_BACKDROPS[place].horizon;
    const g = this.setting.clear();
    const p = this.landmark.clear();
    p.position.set(x, y);
    p.scale.set(scale);
    if (this.owl) this.owl.visible = landmark === 'owl';

    if (place === 'woods') {
      const offset = landmark === 'bear' ? 0 : landmark === 'stream' ? 0.07 : -0.06;
      for (const [i, at] of [0.06, 0.18, 0.31, 0.86, 0.96].entries()) {
        const tx = view.w * (at + offset);
        pine(g, tx, base + (i % 2) * 24, (145 + (i % 3) * 28) * scale, swatch.green.line);
      }
    }
    const pathColor = place === 'beach' ? cream : wood.light;
    g.moveTo(x - 24 * scale, y)
      .quadraticCurveTo(x - 83 * scale, y + 80 * scale, view.w * 0.26, view.h)
      .lineTo(view.w * 0.55, view.h)
      .quadraticCurveTo(x - 72 * scale, y + 105 * scale, x + 38 * scale, y)
      .closePath()
      .fill({ color: pathColor, alpha: 0.66 });

    switch (landmark) {
      case 'bear':
        pine(p, 78, 4, 190, swatch.green.fill);
        p.ellipse(0, -4, 99, 17).fill(swatch.green.fill);
        p.ellipse(-20, -34, 73, 42).fill(wood.line);
        p.ellipse(27, -17, 32, 16).fill(swatch.brown.fill);
        p.circle(41, -84, 16).circle(94, -72, 16).fill(wood.line);
        p.circle(64, -55, 41).fill(swatch.brown.fill);
        p.ellipse(78, -35, 29, 19).fill(wood.light);
        p.ellipse(96, -42, 9, 6).fill(ink);
        p.moveTo(71, -59).quadraticCurveTo(78, -54, 84, -59).stroke({ color: ink, width: 4, cap: 'round' });
        break;
      case 'stream':
        g.moveTo(x + 66, base - 20)
          .bezierCurveTo(x - 130, y + 8, x + 74, y + 170, view.w * 0.05, view.h)
          .lineTo(view.w * 0.24, view.h)
          .bezierCurveTo(x + 193, y + 175, x - 48, y + 16, x + 106, base - 20)
          .closePath()
          .fill(swatch.blue.fill);
        for (const [dx, dy] of [
          [-20, 12],
          [32, 56],
          [-12, 124],
        ]) {
          p.moveTo(dx - 17, dy)
            .lineTo(dx + 17, dy)
            .stroke({ color: swatch.blue.light, width: 4, cap: 'round' });
        }
        break;
      case 'hill':
        p.moveTo(-162, 6)
          .quadraticCurveTo(-38, -203, 87, -114)
          .quadraticCurveTo(124, -87, 171, 6)
          .closePath()
          .fill(swatch.green.fill);
        p.moveTo(-60, 0)
          .quadraticCurveTo(89, -23, 24, -58)
          .quadraticCurveTo(-10, -78, 43, -119)
          .stroke({ color: wood.light, width: 19, cap: 'round' });
        break;
      case 'owl':
        p.roundRect(-14, -156, 28, 162, 9).fill(wood.line);
        p.roundRect(-21, -47, 118, 15, 7).fill(wood.fill);
        p.circle(-22, -144, 50).circle(30, -154, 47).fill(swatch.green.line);
        this.owl?.position.set(57, -45);
        break;
      case 'gulls':
        gull(p, -77, -117);
        gull(p, -4, -151);
        gull(p, 72, -109);
        p.moveTo(-91, -41)
          .quadraticCurveTo(-47, -53, -6, -41)
          .quadraticCurveTo(34, -29, 78, -41)
          .stroke({ color: swatch.white.fill, width: 5, cap: 'round' });
        break;
      case 'pools':
        for (const [dx, dy, r] of [
          [-72, 4, 55],
          [41, -39, 77],
          [70, 42, 43],
        ]) {
          p.ellipse(dx, dy, r, r * 0.38)
            .fill(swatch.blue.fill)
            .stroke({ color: swatch.blue.light, width: 6 });
          p.moveTo(dx - 19, dy - 4)
            .lineTo(dx + 13, dy - 4)
            .stroke({ color: swatch.white.light, width: 4, cap: 'round' });
        }
        break;
      case 'shells':
        shell(p, -62, -7, 2.8);
        shell(p, 41, -41, 2.4, swatch.purple);
        shell(p, 54, 41, 2.9, swatch.orange);
        break;
      case 'castle':
        p.roundRect(-88, -70, 176, 73, 8).fill(wood.fill);
        for (const dx of [-65, 65]) {
          p.roundRect(dx - 28, -103, 56, 106, 6).fill(wood.light);
          for (const notch of [-21, 0, 21]) p.rect(dx + notch - 7, -116, 14, 18).fill(wood.light);
        }
        p.roundRect(-24, -40, 48, 44, 18).fill(wood.line);
        p.roundRect(-3, -137, 6, 70, 3).fill(wood.line);
        p.poly([2, -137, 54, -124, 2, -108]).fill(swatch.pink.fill);
        break;
      case 'barn':
        drawFarBarn(p, 0, 0, 173, swatch.red.line);
        p.roundRect(-42, -75, 84, 75, 5).stroke({ color: swatch.white.light, width: 4 });
        break;
      case 'hen':
        p.ellipse(2, -4, 91, 40).fill(wood.fill);
        p.ellipse(2, -9, 79, 23).fill(wood.light);
        henArt(p, 13, -18, swatch.orange.light);
        for (const dx of [-58, -27, 42]) p.ellipse(dx, -12, 15, 19).fill(cream);
        break;
      case 'pond':
        p.ellipse(1, -6, 147, 44).fill(swatch.teal.fill).stroke({ color: swatch.blue.light, width: 6 });
        for (const [dx, dy] of [
          [-59, -25],
          [29, -14],
          [81, 0],
        ]) {
          p.ellipse(dx, dy, 29, 16).fill(swatch.yellow.light);
          p.circle(dx + 19, dy - 17, 14).fill(swatch.yellow.light);
          p.poly([dx + 30, dy - 19, dx + 42, dy - 15, dx + 30, dy - 11]).fill(swatch.orange.fill);
          p.circle(dx + 21, dy - 20, 2.8).fill(ink);
        }
        break;
      case 'gate':
        for (const dx of [-102, 102]) p.roundRect(dx - 10, -120, 20, 120, 6).fill(wood.line);
        for (const dy of [-90, -37]) p.roundRect(-103, dy, 206, 15, 6).fill(wood.fill);
        p.moveTo(-86, -35).lineTo(86, -84).stroke({ color: wood.fill, width: 13, cap: 'round' });
        break;
    }
  }
}
