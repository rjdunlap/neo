import { Graphics } from 'pixi.js';
import type { App } from '../app/App';
import { Scene } from '../app/Scene';
import { swatch, type ColorName } from '../art/palette';
import { paperCircle, paperEllipse, paperGround, paperLine, paperRect, paperShape, U } from '../art/paper';
import { SHAPES, MORE_SHAPES } from '../art/shapes';
import type { View } from '../engine/view';
import { label } from '../ui/text';
import { makeCreature, SPECIES } from '../art/creatures';

/**
 * The paper cut-out style's swatch book (docs/ART-STYLE.md), at `/?paper` on the dev server only: every named shape
 * in the colours a child learns by name, a pond with pads, ducklings' corn, a button and a card. Upright on a phone,
 * so it can be held beside the art test's screenshots.
 */
export class PaperLab extends Scene {
  canPause = false;
  uprightArea = true;
  private readonly g = new Graphics();

  constructor(app: App) {
    super(app);
    this.content.addChild(this.g);
  }

  resize(view: View) {
    const g = this.g.clear();
    paperGround(g, 0, 0, view.w, view.h);
    for (const c of [...this.content.children]) if (c !== g) c.destroy();
    const colors: ColorName[] = [
      'red',
      'orange',
      'yellow',
      'green',
      'teal',
      'blue',
      'purple',
      'pink',
      'brown',
      'white',
    ];
    const kinds = [...SHAPES, ...MORE_SHAPES];
    const cols = 4;
    const cell = Math.min(view.w / cols, 150);
    const x0 = (view.w - cell * cols) / 2 + cell / 2;
    kinds.forEach((kind, i) => {
      const x = x0 + (i % cols) * cell,
        y = 90 + Math.floor(i / cols) * cell;
      const sub = new Graphics();
      paperShape(sub, kind, cell * 0.32, swatch[colors[i % colors.length]], { seed: kind });
      sub.position.set(x, y);
      this.content.addChild(sub);
    });

    // A pond strip: bank, water, pads, a ripple, a corn pile with its shadow.
    const top = 90 + Math.ceil(kinds.length / cols) * cell - 20;
    const pond = new Graphics();
    const w = view.w - 60;
    paperRect(pond, 30, top, w, 280, 46, 0x7dbe5a, { seed: 'bank' });
    paperRect(pond, 54, top + 22, w - 48, 236, 34, 0x5fb3d9, { seed: 'water' });
    for (let k = 0; k < 4; k++) {
      const rx = 100 + k * 120;
      paperLine(
        pond,
        [
          [rx, top + 200],
          [rx + 18, top + 194],
          [rx + 36, top + 200],
        ],
        0xb6e3f3,
        2 * U,
        { noShadow: true },
      );
    }
    paperEllipse(pond, 140, top + 110, 42, 38, 0x3fa05a, { seed: 'pad1' });
    paperLine(
      pond,
      [
        [140, top + 110],
        [170, top + 96],
      ],
      0x7ccb7a,
      1.4 * U,
      { noShadow: true },
    );
    paperCircle(pond, 300, top + 150, 30, 0x3fa05a, { seed: 'pad2' });
    paperCircle(pond, 300, top + 150, 11, 0xff6f91, { seed: 'flower' });
    // Corn: bigger kernels, a darker outline and a soft pool of shade under the pile, so it reads on the water.
    paperEllipse(pond, 470, top + 140, 50, 26, 0x2e6f99, { flat: true, alpha: 0.35 });
    for (const [kx, ky] of [
      [-14, 0],
      [0, -6],
      [14, 0],
      [-7, 10],
      [7, 10],
    ])
      paperEllipse(pond, 470 + kx, top + 130 + ky, 7 * U, 8.2 * U, 0xffb81c, {
        seed: `corn${kx}${ky}`,
        line: 0x8a6118,
        small: true,
      });
    this.content.addChild(pond);

    // The code-drawn pets, which the paper pass turns into paper.
    SPECIES.forEach((id, i) => {
      const pet = makeCreature(id);
      pet.scale.set(0.55);
      pet.position.set(view.w * (0.62 + i * 0.13), 330);
      this.content.addChild(pet);
    });

    // Chrome: two buttons and a card.
    const ui = new Graphics();
    const by = top + 320;
    const bw = (view.w - 90) / 2;
    paperRect(ui, 30, by, bw, 90, 16, 0xffc43d, { seed: 'hint' });
    paperRect(ui, 60 + bw, by, bw, 90, 16, 0x8ecae6, { seed: 'over' });
    paperRect(ui, 30, by + 120, view.w - 60, 110, 18, 0xfffdf6, { seed: 'card', line: 0x8c8478 });
    this.content.addChild(ui);
    for (const [text, x, y] of [
      ['Hint', 30 + bw / 2, by + 45],
      ['Start over', 60 + bw * 1.5, by + 45],
      ['Paper cut-out, crayon outline', view.w / 2, by + 175],
    ] as const) {
      const t = label(text, 34);
      t.position.set(x, y);
      this.content.addChild(t);
    }
  }
}

export async function showPaperLab(app: App) {
  await app.show(new PaperLab(app));
}
