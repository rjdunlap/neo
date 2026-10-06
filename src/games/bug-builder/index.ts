import { Circle, Container, Graphics } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { spread, type View } from '../../engine/view';
import { WigglyIcon, tile } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { bugBody, bugSticker, bugToken } from './art';
import { BUG_PLANS, BUG_TOKENS, bugPuzzle, type BugSpot } from './logic';

interface Spot extends BugSpot { node: Container; filled: boolean; wrong: number }
class BugBuilder implements Game {
  readonly plan;
  readonly targets: Spot[] = [];
  readonly choices: { token: number; node: Container; drag: DragHandle }[] = [];
  private readonly background = new Graphics();
  private readonly board = new Container();
  private readonly model = new Container();
  private readonly glow = new Graphics();
  private readonly paletteGlow = new Graphics();
  private readonly decorations = new Graphics();
  private activeHint: Spot | null = null;
  private misses = 0;
  private hints = 0;
  private done = false;
  private clock = 0;
  constructor(private readonly ctx: GameContext) {
    this.plan = BUG_PLANS[Math.max(0, Math.min(BUG_PLANS.length - 1, ctx.level - 1))];
    const puzzle = bugPuzzle(this.plan, ctx.rng);
    ctx.stage.addChild(this.background, this.decorations, this.model, this.board, this.paletteGlow);
    this.board.addChild(bugBody(this.plan.rows, this.plan.columns));
    if (this.plan.mode === 'copy') this.model.addChild(bugBody(this.plan.rows, this.plan.columns));
    if (this.plan.mode !== 'guided') for (const s of puzzle.model) {
      const shape = bugToken(s.token); shape.position.set(s.x, s.y);
      (this.plan.mode === 'mirror' ? this.board : this.model).addChild(shape);
    }
    for (const s of puzzle.targets) {
      const node = new Container(); node.position.set(s.x, s.y);
      node.addChild(new Graphics().circle(0, 0, 50).fill(cream).stroke({ width: 3, color: swatch.orange.line }));
      if (this.plan.mode === 'guided') { const ghost = bugToken(s.token); ghost.alpha = 0.32; node.addChild(ghost); }
      this.board.addChild(node); this.targets.push({ ...s, node, filled: false, wrong: 0 });
    }
    this.board.addChild(this.glow);
    for (let token = 0; token < this.plan.colors; token++) {
      const node = new Container(); node.addChild(tile(102, 102), bugToken(token)); node.hitArea = new Circle(0, 0, 55);
      ctx.stage.addChild(node);
      const drag = draggable(node, ctx.tw, {
        onPick: () => sfx.tick(),
        onDrop: (x, y) => {
          if (this.done) return false;
          // Slots are a little more generous than the outlines, without overlapping neighboring spots.
          const slot = this.targets.find((s) => !s.filled && Math.hypot(x - this.board.x - s.x, y - this.board.y - s.y) < 57);
          if (!slot) return false;
          if (slot.token !== token) {
            this.misses++; slot.wrong++; sfx.boing();
            void ctx.say('bug.wrong');
            if (slot.wrong === 2) { this.hints++; this.activeHint = slot; void ctx.say('bug.hint', { ...BUG_TOKENS[slot.token] }); }
          } else {
            slot.filled = true;
            slot.node.removeChildren().forEach((c) => c.destroy({ children: true }));
            slot.node.addChild(bugToken(token, 38));
            if (this.activeHint === slot) this.activeHint = null;
            sfx.bell(5 + token, 0.3); ctx.pet.cheer();
            if (this.targets.every((s) => s.filled)) {
              this.done = true; this.choices.forEach((c) => c.drag.enabled = false);
              void ctx.say('bug.done');
              void ctx.tw.wait(1.2).then(() => ctx.finish({ misses: this.misses, hints: this.hints }));
            }
          }
          this.drawHint();
          return false; // A reusable stamp: return to the tray after every drop.
        },
      });
      this.choices.push({ token, node, drag });
    }
  }
  start() { void this.ctx.instruct(this.plan.mode === 'guided' ? 'bug.guided' : this.plan.mode === 'copy' ? 'bug.copy' : 'bug.mirror'); }
  resize(v: View) {
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.green.light).roundRect(165, v.h - 155, v.w - 200, 135, 32).fill(cream);
    const cy = Math.max(365, (v.h - 160) / 2);
    this.board.position.set(this.plan.mode === 'copy' ? v.w * 0.68 : v.w / 2, cy);
    this.model.position.set(v.w * 0.24, cy); this.model.scale.set(0.62);
    const d = this.decorations.clear();
    if (this.plan.mode === 'copy') {
      d.roundRect(this.model.x - 155, cy - 200, 310, 395, 32).fill(cream);
      const x = v.w * 0.43;
      d.moveTo(x - 12, cy - 20).lineTo(x + 12, cy).lineTo(x - 12, cy + 20).stroke({ width: 7, color: swatch.teal.line });
    }
    if (this.plan.mode === 'mirror') for (let y = cy - 140; y < cy + 185; y += 28) d.moveTo(this.board.x, y).lineTo(this.board.x, y + 13).stroke({ width: 4, color: swatch.white.fill });
    const xs = spread(this.choices.length, 175, v.w - 45, 130);
    this.choices.forEach((c, i) => {
      c.drag.home = { x: xs[i], y: v.h - 87 };
      if (!c.drag.dragging) { this.ctx.tw.kill(c.node); c.node.position.set(c.drag.home.x, c.drag.home.y); }
    });
    this.drawHint();
  }
  private drawHint() {
    this.glow.clear(); this.paletteGlow.clear();
    if (!this.activeHint || this.done) return;
    const s = this.activeHint, choice = this.choices[s.token];
    this.glow.circle(s.x, s.y, 56).stroke({ width: 7, color: swatch.yellow.line });
    this.paletteGlow.roundRect(choice.drag.home.x - 59, choice.drag.home.y - 59, 118, 118, 24).stroke({ width: 7, color: swatch.yellow.line });
  }
  update(dt: number) { this.clock += dt; this.glow.alpha = this.paletteGlow.alpha = 0.65 + 0.35 * Math.sin(this.clock * 3); if (this.done) this.board.rotation = Math.sin(this.clock * 8) * 0.035; }
  destroy() { this.choices.forEach((c) => c.drag.destroy()); }
}
export const bugBuilder: GameModule = {
  id: 'bug-builder', name: 'Bug Builder', titleLine: 'game.bug-builder', region: 'tinker-lab',
  skills: ['spatial-reasoning', 'symmetry', 'visual-matching'], bands: ['toddler', 'preschool', 'prek'],
  levels: (b) => b === 'prek' ? { min: 4, max: 7 } : b === 'preschool' ? { min: 2, max: 5 } : { min: 1, max: 2 },
  describeLevel: (l) => BUG_PLANS[Math.max(0, Math.min(BUG_PLANS.length - 1, l - 1))].name,
  music: STYLES.paint, coplayHint: 'Help {name} move a shape to a matching spot on the bug.',
  offScreen: 'Fold paper in half, dab paint on one side, and press it closed to make matching butterfly wings.',
  hubIcon: () => new WigglyIcon(bugSticker()), sticker: (seed) => bugSticker(seed), create: (ctx) => new BugBuilder(ctx),
};
