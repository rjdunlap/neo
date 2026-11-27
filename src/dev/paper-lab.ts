import { Graphics } from 'pixi.js';
import type { App } from '../app/App';
import { Scene } from '../app/Scene';
import { swatch, type ColorName } from '../art/palette';
import { paperCircle, paperEllipse, paperGround, paperLine, paperRect, paperShape, U } from '../art/paper';
import { SHAPES, MORE_SHAPES } from '../art/shapes';
import type { View } from '../engine/view';
import { label } from '../ui/text';
import { Sprite } from 'pixi.js';
import { PAPER_ART } from '../art/creatures/paper';
import { EXPRESSIONS } from '../art/creatures/illustrated';
import { EGG_STAGES, paperEgg } from '../creatures/companion';
import { paperItems } from '../art/creatures/paper-items';
import { ITEM_ART, WEARABLES } from '../art/creatures/wearables';

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
    const want = new URLSearchParams(location.search).get('lab') ?? 'sprout';
    if (want === 'items') return this.items(view);
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

    // The paper creatures, every expression (?lab=species picks one).
    const draw = PAPER_ART[want as keyof typeof PAPER_ART];
    if (draw) {
      const set = draw();
      EXPRESSIONS.forEach((ex, i) => {
        const s = new Sprite(set[ex]);
        s.anchor.set(0.5, 1);
        const k = Math.min(160 / s.texture.width, 150 / s.texture.height);
        s.scale.set(k);
        s.position.set(view.w * 0.58 + (i % 3) * 170, 210 + Math.floor(i / 3) * 160);
        this.content.addChild(s);
      });
    }

    // The egg at each stage (?lab=egg).
    if (want === 'egg')
      EGG_STAGES.forEach((stage, i) => {
        const e = paperEgg(stage);
        e.scale.set(0.5);
        e.position.set(view.w * 0.6 + i * 150, 330);
        this.content.addChild(e);
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

  /** The nine wearables in a grid (?lab=items), each with a red dot on its anchor (the point the wear tables place). */
  private items(view: View) {
    const items = paperItems();
    const cw = Math.min(view.w / 3, 280),
      ch = (view.h - 20) / 3;
    WEARABLES.forEach((id, i) => {
      const a = ITEM_ART[id];
      const s = new Sprite(items[a.file]);
      s.anchor.set(a.anchor.x / a.width, a.anchor.y / a.height);
      const k = Math.min((cw * 0.8) / a.width, (ch * 0.85) / a.height);
      s.scale.set(k);
      const cx = (view.w - cw * 3) / 2 + cw * ((i % 3) + 0.5),
        cy = 10 + ch * (Math.floor(i / 3) + 0.5);
      s.position.set(cx - (a.width / 2 - a.anchor.x) * k, cy - (a.height / 2 - a.anchor.y) * k);
      const dot = new Graphics().circle(s.position.x, s.position.y, 3).fill(0xff0044);
      this.content.addChild(s, dot);
    });
  }
}

export async function showPaperLab(app: App) {
  await app.show(new PaperLab(app));
}
