import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { spread, type View } from '../../engine/view';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { SIZE_PLANS, sizeOrder, sizeScale } from './logic';

type Animal = 'duck' | 'bunny' | 'cat';
function friend(rank: number, count: number, animal: Animal): Container {
  const c = new Container(), pet = new Critter(CRITTERS[animal]);
  pet.alive = false;
  pet.scale.set(sizeScale(rank, count) * 0.59);
  c.addChild(pet);
  return c;
}
function paradeArt(): Container {
  const c = new Container();
  for (let i = 0; i < 3; i++) { const f = friend(i, 3, 'duck'); f.x = (i - 1) * 95; c.addChild(f); }
  return c;
}
interface Choice { rank: number; node: Container; drag?: DragHandle; placed: boolean }
class SizeParade implements Game {
  readonly plan;
  readonly order: number[];
  readonly choices: Choice[] = [];
  readonly slots: Container[] = [];
  private readonly background = new Graphics();
  private readonly ground = new Graphics();
  private readonly glow = new Graphics();
  private readonly hintsGlow = new Graphics();
  private readonly shelf = new Container();
  private readonly progress = new Graphics();
  private view: View;
  private animal: Animal = 'duck';
  private step = 0;
  private rounds = 0;
  private wrong = 0;
  private misses = 0;
  private hints = 0;
  private busy = false;
  private done = false;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = SIZE_PLANS[Math.max(0, Math.min(SIZE_PLANS.length - 1, ctx.level - 1))];
    this.order = sizeOrder(this.plan.count, this.plan.order);
    ctx.stage.addChild(this.background, this.ground, this.shelf, this.glow, this.hintsGlow, this.progress);
    if (this.plan.mode === 'line') for (let i = 0; i < this.plan.count; i++) {
      const slot = new Container();
      slot.addChild(new Graphics().ellipse(0, 0, 66, 24).fill(swatch.white.fill).stroke({ width: 4, color: swatch.teal.line }));
      this.slots.push(slot); this.shelf.addChild(slot);
    }
    this.deal();
  }
  start() { this.instruction(); }
  private instruction() {
    void this.ctx.instruct(this.plan.mode === 'pick' ? 'size.pick' : 'size.line', { size: this.plan.order === 'small' ? 'smallest' : 'biggest' });
  }
  private deal() {
    for (const c of this.choices) { c.drag?.destroy(); this.ctx.tw.kill(c.node); this.ctx.tw.kill(c.node.scale); c.node.destroy({ children: true }); }
    this.choices.length = 0;
    this.animal = this.ctx.rng.pick(['duck', 'bunny', 'cat'] as Animal[]);
    for (const rank of this.ctx.rng.shuffle([...this.order])) {
      const node = friend(rank, this.plan.count, this.animal);
      node.hitArea = new Rectangle(-77, -175, 154, 190);
      const choice: Choice = { rank, node, placed: false };
      this.ctx.stage.addChild(node);
      if (this.plan.mode === 'pick') onTap(node, () => this.choose(choice));
      else choice.drag = draggable(node, this.ctx.tw, {
        onPick: () => sfx.tick(),
        onDrop: (x, y) => {
          const slot = this.slots[this.step];
          if (!slot || Math.abs(x - slot.x) > 82 || Math.abs(y - slot.y) > 95) return false;
          return this.choose(choice);
        },
      });
      this.choices.push(choice);
    }
    this.resize(this.view);
  }
  private choose(choice: Choice): boolean {
    if (this.busy || this.done || choice.placed) return false;
    if (choice.rank !== this.order[this.step]) {
      this.misses++; this.wrong++; sfx.boing();
      void this.ctx.say('size.wrong', { size: this.plan.order === 'small' ? 'smallest' : 'biggest' });
      if (this.wrong === 2) { this.hints++; void this.ctx.say('size.hint'); }
      this.drawGlow(); return false;
    }
    sfx.bell(5 + choice.rank, 0.3); this.ctx.pet.cheer();
    this.wrong = 0;
    if (this.plan.mode === 'line') {
      choice.placed = true; choice.drag!.enabled = false; choice.node.visible = false;
      const copy = friend(choice.rank, this.plan.count, this.animal); copy.scale.set(0.8);
      this.slots[this.step].addChild(copy);
      this.step++;
      if (this.step === this.order.length) this.finish();
      else void this.ctx.say('size.next');
    } else {
      this.rounds++; this.busy = true;
      choice.node.alpha = 0.5;
      if (this.rounds === 4) this.finish();
      else void this.ctx.tw.wait(0.8).then(() => { this.deal(); this.busy = false; this.instruction(); });
    }
    this.drawGlow(); return true;
  }
  private finish() {
    this.done = true;
    void this.ctx.say('size.done');
    void this.ctx.tw.wait(1).then(() => this.ctx.finish({ misses: this.misses, hints: this.hints }));
  }
  resize(v: View) {
    this.view = v;
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.blue.light).rect(0, v.h * 0.5, v.w, v.h * 0.5).fill(swatch.green.light);
    this.ground.clear().roundRect(165, v.h - 265, v.w - 210, 230, 45).fill(cream);
    const xs = spread(this.choices.length, 165, v.w - 40, 175);
    this.choices.forEach((c, i) => {
      const p = { x: xs[i], y: v.h - 90 };
      if (c.drag) c.drag.home = p;
      if (!c.drag?.dragging) { this.ctx.tw.kill(c.node); c.node.position.set(p.x, p.y); }
    });
    const spots = spread(this.slots.length, 130, v.w - 70, 165);
    this.slots.forEach((s, i) => s.position.set(spots[i], v.h * 0.44));
    const g = this.progress.clear();
    if (this.plan.mode === 'pick') {
      // A visual size cue reinforces the spoken comparison without identifying an answer's position.
      for (let i = 0; i < 4; i++) g.circle(v.w / 2 + (i - 1.5) * 40, 125, 11).fill(i < this.rounds ? swatch.teal.fill : swatch.white.fill);
      const big = this.plan.order === 'big';
      g.circle(v.w / 2 - 65, 290, big ? 24 : 50).circle(v.w / 2 + 65, 290, big ? 50 : 24).fill(swatch.teal.fill).stroke({ width: 4, color: swatch.teal.line });
      g.moveTo(v.w / 2 - 10, 290).lineTo(v.w / 2 + 15, 290).lineTo(v.w / 2 + 4, 278).moveTo(v.w / 2 + 15, 290).lineTo(v.w / 2 + 4, 302).stroke({ width: 6, color: swatch.teal.line });
    } else {
      for (let i = 0; i < this.slots.length - 1; i++) {
        const x = (spots[i] + spots[i + 1]) / 2, y = v.h * 0.44;
        g.moveTo(x - 8, y - 10).lineTo(x + 4, y).lineTo(x - 8, y + 10).stroke({ width: 4, color: swatch.teal.line });
      }
    }
    this.drawGlow();
  }
  private drawGlow() {
    this.glow.clear(); this.hintsGlow.clear();
    if (this.done) return;
    if (this.plan.mode === 'line') { const p = this.slots[this.step]; this.glow.ellipse(p.x, p.y, 74, 34).stroke({ width: 7, color: swatch.yellow.line }); }
    if (this.wrong >= 2) { const c = this.choices.find((c) => c.rank === this.order[this.step])!; this.hintsGlow.roundRect((c.drag?.home.x ?? c.node.x) - 80, (c.drag?.home.y ?? c.node.y) - 180, 160, 200, 24).stroke({ width: 7, color: swatch.yellow.line }); }
  }
  update(dt: number) { this.clock += dt; this.glow.alpha = this.hintsGlow.alpha = 0.7 + 0.3 * Math.sin(this.clock * 3); }
  destroy() { this.choices.forEach((c) => c.drag?.destroy()); }
}
export const sizeParade: GameModule = {
  id: 'size-parade', name: 'Size Parade', titleLine: 'game.size-parade', region: 'puzzle-peaks',
  skills: ['comparison', 'measurement', 'ordering'], bands: ['toddler', 'preschool', 'prek'],
  levels: (b) => b === 'prek' ? { min: 5, max: 8 } : b === 'preschool' ? { min: 3, max: 6 } : { min: 1, max: 4 },
  describeLevel: (l) => SIZE_PLANS[Math.max(0, Math.min(SIZE_PLANS.length - 1, l - 1))].name,
  music: STYLES.hub, coplayHint: 'Use your hands to show {name} small and big, then compare the friends.',
  offScreen: 'Line up three spoons or shoes from smallest to biggest, then reverse the line.',
  hubIcon: () => new WigglyIcon(paradeArt()), sticker: () => paradeArt(), create: (ctx) => new SizeParade(ctx),
};
