import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch, type ColorName } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { spread, type View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { againIcon, arrowIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { stampArt } from './art';
import { LIMIT, pixel, place, planFor, type Stamp, type StampKind } from './logic';

interface Mark { data: Stamp; node: Container; drag?: DragHandle }
class StampStudio implements Game {
  readonly plan;
  readonly stamps: Mark[] = [];
  readonly choices: RoundButton[] = [];
  readonly colors: RoundButton[] = [];
  readonly paper = new Container();
  private readonly background = new Graphics();
  private readonly sheet = new Graphics();
  private readonly selection = new Graphics();
  readonly finish: RoundButton;
  readonly undo: RoundButton;
  readonly turn: RoundButton;
  readonly grow: RoundButton;
  private selected: Mark | null = null;
  private kind: StampKind;
  private color: ColorName = 'purple';
  private width = 600;
  private height = 400;
  done = false;
  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level); this.kind = this.plan.kinds[0];
    this.paper.addChild(this.sheet, this.selection);
    this.selection.eventMode = 'none';
    ctx.stage.addChild(this.background, this.paper);
    onTap(this.sheet, e => {
      if (this.done) return;
      const p = this.paper.toLocal(e.global);
      if (this.stamps.length >= LIMIT) { void ctx.say('stamp.full'); return; }
      this.add(p.x, p.y);
    });
    this.plan.kinds.forEach(kind => {
      const b = new RoundButton(stampArt(kind, 'orange', 33), swatch.white, 48, () => { this.kind = kind; void ctx.say('stamp.kind', { kind }); this.drawSelection(); });
      ctx.stage.addChild(b); this.choices.push(b);
    });
    if (this.plan.color) for (const color of ['purple', 'blue', 'green', 'pink'] as ColorName[]) {
      const b = new RoundButton(new Graphics().circle(0, 0, 22).fill(swatch[color].fill), swatch.white, 43, () => { this.color = color; void ctx.say('color.' + color as 'color.blue'); this.drawSelection(); });
      ctx.stage.addChild(b); this.colors.push(b);
    }
    this.finish = new RoundButton(arrowIcon(1), swatch.green, 48, () => {
      if (this.done || !this.stamps.length) return;
      this.done = true; this.stamps.forEach(s => { if (s.drag) s.drag.enabled = false; });
      void ctx.say('stamp.done'); sfx.sparkle();
      void ctx.tw.wait(0.9).then(() => ctx.finish({ misses: 0, hints: 0 }));
    });
    this.undo = new RoundButton(arrowIcon(-1), swatch.white, 48, () => {
      const s = this.stamps.pop(); if (!s || this.done) return;
      s.drag?.destroy(); s.node.destroy({ children: true }); this.selected = this.stamps.at(-1) ?? null; this.drawSelection();
    });
    this.turn = new RoundButton(againIcon(), swatch.white, 48, () => { if (this.selected) { this.selected.data.turns = (this.selected.data.turns + 1) % 4; this.layoutStamp(this.selected); this.drawSelection(); } });
    this.grow = new RoundButton(new Graphics().circle(-13, 4, 12).circle(14, -4, 23).fill(swatch.purple.fill), swatch.white, 48, () => { if (this.selected) { this.selected.data.size = this.selected.data.size === 1 ? 1.3 : 1; this.layoutStamp(this.selected); this.drawSelection(); } });
    ctx.stage.addChild(this.finish, this.undo, this.turn, this.grow);
  }
  private add(x: number, y: number) {
    const data: Stamp = { kind: this.kind, color: this.color, ...place(x, y, this.width, this.height), size: 1, turns: 0 };
    const node = new Container(); node.addChild(stampArt(data.kind, data.color)); node.hitArea = new Circle(0, 0, 55);
    this.paper.addChild(node);
    const mark: Mark = { data, node };
    if (this.plan.move) mark.drag = draggable(node, this.ctx.tw, {
      onPick: () => { this.selected = mark; this.drawSelection(); sfx.tick(); },
      onDrop: (x, y) => {
        Object.assign(data, place(x, y, this.width, this.height));
        this.layoutStamp(mark); this.drawSelection(); return true;
      },
    });
    else node.eventMode = 'none';
    this.stamps.push(mark); this.selected = mark; this.layoutStamp(mark); this.drawSelection(); sfx.pop(5 + this.stamps.length % 5);
  }
  private layoutStamp(s: Mark) {
    const p = pixel(s.data, this.width, this.height);
    this.ctx.tw.kill(s.node); s.node.position.set(p.x, p.y); s.node.rotation = s.data.turns * Math.PI / 2;
    // Transform only the drawing; drag hit areas remain at least 110 units.
    s.node.children[0].scale.set(s.data.size);
    if (s.drag) s.drag.home = p;
  }
  private drawSelection() {
    this.selection.clear();
    if (this.selected && this.plan.move) this.selection.circle(this.selected.node.x, this.selected.node.y, 70).stroke({ width: 5, color: swatch.yellow.line });
    this.finish.visible = this.stamps.length > 0; this.undo.visible = this.stamps.length > 0;
    this.turn.visible = this.grow.visible = this.plan.transform && !!this.selected;
    this.choices.forEach((b, i) => b.alpha = this.plan.kinds[i] === this.kind ? 1 : 0.68);
    this.colors.forEach((b, i) => b.alpha = ['purple', 'blue', 'green', 'pink'][i] === this.color ? 1 : 0.65);
  }
  start() { void this.ctx.instruct(`stamp.${this.plan.prompt}`); }
  resize(v: View) {
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.teal.light);
    this.width = v.w - 350; this.height = v.h - 290;
    this.paper.position.set(180, 135);
    this.sheet.clear().roundRect(0, 0, this.width, this.height, 24).fill(cream).stroke({ width: 7, color: swatch.brown.line });
    this.sheet.hitArea = new Rectangle(0, 0, this.width, this.height);
    const xs = spread(this.choices.length, 185, v.w - 180, 135);
    this.choices.forEach((b,i) => b.position.set(xs[i], v.h - 77));
    this.colors.forEach((b,i) => b.position.set(220 + i * 125, 65));
    this.finish.position.set(v.w - 77, 65); this.undo.position.set(v.w - 77, v.h - 77);
    this.turn.position.set(v.w - 77, v.h / 2 - 65); this.grow.position.set(v.w - 77, v.h / 2 + 65);
    for (const s of this.stamps) this.layoutStamp(s);
    this.drawSelection();
  }
  update() {}
  destroy() { this.stamps.forEach(s => s.drag?.destroy()); }
}
export const stampStudio: GameModule = {
  id: 'stamp-studio', name: 'Stamp Studio', titleLine: 'game.stamp-studio', region: 'treehouse',
  skills: ['composition', 'creative-expression', 'spatial-reasoning'], bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: b => b === 'lap' ? { min: 1, max: 2 } : b === 'toddler' ? { min: 2, max: 3 } : b === 'preschool' ? { min: 3, max: 5 } : { min: 4, max: 6 },
  describeLevel: l => planFor(l).name, music: STYLES.paint,
  coplayHint: 'Let {name} choose where the picture goes. The green arrow finishes any creation.',
  offScreen: 'Stamp with a sponge or potato on scrap paper, then tell a story about the picture.',
  hubIcon: () => { const c = new Container(); c.addChild(new Graphics().roundRect(-90,-140,180,140,15).fill(cream).stroke({width:7,color:swatch.brown.line})); const a=stampArt('flower','pink');a.y=-70;c.addChild(a);return new WigglyIcon(c); },
  sticker: seed => stampArt(new Rng(seed).pick(['star','flower','fish','cat'] as const),new Rng(seed+3).pick(['purple','pink','blue','green'] as const),70),
  create: ctx => new StampStudio(ctx),
};
