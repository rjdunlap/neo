import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { swatch } from '../../art/palette';
import type { AnimalSound } from '../../audio/sfx';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { symbol, tile } from '../shared';
import type { Game, GameContext, TouchIntent } from '../types';
import { label } from '../../ui/text';
import { ANIMAL_TRIOS, buildMatch, patternPlan, validPieces, MATCH_CARS, type MatchRound, type PatternPlan } from './logic';

const VOICE: Record<string, AnimalSound | undefined> = { cow: 'moo', duck: 'quack', pig: 'oink', cat: 'meow', dog: 'woof', bear: 'growl', bunny: 'hop' };
const CAR = 0.62;
const STEP = 70;

/**
 * The same-pattern levels: a model train of shapes on top, and below it either three rows of animals (pick the one that repeats
 * the model's way, level 15) or an empty train and a tray of three animals (build it, level 16). The pieces are always other
 * things than the model's, so the pattern is the structure, not the look.
 */
export class PatternMatch implements Game {
  readonly plan: PatternPlan;
  readonly round: MatchRound;
  readonly modelCars: Container[] = [];
  readonly rows: Container[] = [];
  readonly slots: Container[] = [];
  readonly tray: Container[] = [];
  private readonly rowCars: Container[][] = [];
  private readonly scene = new Container();
  private readonly background = new Graphics();
  private readonly glow = new Graphics();
  private readonly hintGlow = new Graphics();
  readonly placed: number[] = [];
  private misses = 0;
  private hints = 0;
  private wrong = 0;
  private done = false;
  private hopping = false;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.plan = patternPlan(ctx.level);
    this.round = buildMatch(ctx.rng);
    ctx.stage.addChild(this.background, this.scene);
    this.scene.addChild(this.glow, this.hintGlow);
    this.round.model.forEach((piece) => {
      const car = this.car(symbol('shape', piece, 32));
      this.modelCars.push(car); this.scene.addChild(car);
    });
    if (this.plan.match === 'row') {
      this.round.rows.forEach((row, r) => {
        const holder = new Container();
        holder.addChild(new Graphics().roundRect(-(STEP * MATCH_CARS) / 2 - 12, -56, STEP * MATCH_CARS + 24, 112, 22).fill(swatch.white.fill).stroke({ width: 4, color: swatch.blue.line }));
        const cars = row.map((piece, i) => {
          const car = this.car(this.animal(piece, 32));
          car.position.set((i - (MATCH_CARS - 1) / 2) * STEP, 0);
          holder.addChild(car);
          return car;
        });
        holder.hitArea = new Rectangle(-(STEP * MATCH_CARS) / 2 - 12, -56, STEP * MATCH_CARS + 24, 112);
        holder.interactiveChildren = false;
        onTap(holder, () => this.pickRow(r));
        this.rowCars.push(cars); this.rows.push(holder); this.scene.addChild(holder);
      });
    } else {
      for (let i = 0; i < MATCH_CARS; i++) {
        const slot = this.car(label('?', 60, swatch.purple.line));
        this.slots.push(slot); this.scene.addChild(slot);
      }
      for (let p = 0; p < 3; p++) {
        const choice = new Container();
        choice.addChild(tile(120, 120, 'white'), this.animal(p, 36));
        onTap(choice, () => this.place(p));
        this.tray.push(choice); this.scene.addChild(choice);
      }
    }
  }

  /** A train car at the match levels' small size, holding `art`. */
  private car(art: Container): Container {
    const car = new Container();
    car.addChild(tile(100, 108, 'white'), art);
    car.addChild(new Graphics().circle(-27, 65, 12).circle(27, 65, 12).fill(swatch.brown.line));
    car.scale.set(CAR);
    car.eventMode = 'none';
    return car;
  }

  private animal(piece: number, size: number): Container {
    const c = new Critter(CRITTERS[ANIMAL_TRIOS[this.round.trio][piece]]);
    c.alive = false;
    c.scale.set(size / 150);
    c.y = size * 0.8;
    return c;
  }

  private voice(piece: number) {
    const voice = VOICE[ANIMAL_TRIOS[this.round.trio][piece]];
    if (voice) sfx.animal(voice); else sfx.bell(4 + piece * 3, 0.4);
  }

  start() {
    void this.ctx.instruct(this.plan.match === 'row' ? 'pattern.match' : 'pattern.build');
  }

  /** Level 15: tap the row that makes the model's pattern. */
  private pickRow(r: number) {
    if (this.done) return;
    if (r === this.round.answer) {
      this.done = true;
      this.hintGlow.clear();
      this.round.rows[r].forEach((piece, i) => this.ctx.tw.wait(i * 0.18).then(() => { this.voice(piece); this.rowCars[r][i].scale.set(CAR * 1.12); }));
      void this.ctx.tw.wait(1.3).then(() => this.ctx.finish({ misses: this.misses, hints: this.hints }));
      return;
    }
    this.misses++; this.wrong++;
    sfx.boing();
    void this.ctx.say('pattern.rowWrong');
    if (this.wrong === 2) { this.hints++; void this.ctx.say('pattern.hint'); this.layoutGlow(); void this.hopTogether(this.round.answer); }
  }

  /** Level 16: put an animal in the glowing car. Any animal that keeps the model's structure is right. */
  private place(p: number) {
    if (this.done) return;
    const k = this.placed.length;
    if (!validPieces(this.round.model, this.placed).includes(p)) {
      this.misses++; this.wrong++;
      sfx.boing();
      void this.ctx.say('pattern.buildWrong');
      if (this.wrong === 2) { this.hints++; void this.ctx.say('pattern.buildHint'); this.layoutGlow(); void this.lightPartners(k); }
      return;
    }
    const slot = this.slots[k];
    slot.removeChildAt(1).destroy({ children: true });
    slot.addChildAt(this.animal(p, 32), 1);
    this.voice(p);
    this.placed.push(p); this.wrong = 0;
    void this.lightPartners(k, true);
    if (this.placed.length === MATCH_CARS) {
      this.done = true;
      this.glow.clear(); this.hintGlow.clear();
      void this.ctx.tw.wait(1.2).then(() => this.ctx.finish({ misses: this.misses, hints: this.hints }));
    } else this.layoutGlow();
  }

  /** The model cars that play the same part as car `k` hop (its partners, itself included). */
  private async lightPartners(k: number, quick = false) {
    const partners = this.modelCars.filter((_, i) => this.round.model[i] === this.round.model[k]);
    partners.forEach((c) => c.scale.set(CAR * 1.15));
    await this.ctx.tw.wait(quick ? 0.4 : 0.9);
    partners.forEach((c) => c.scale.set(CAR));
  }

  /** The hint on the row level: the model and the right row hop car by car, side by side. */
  private async hopTogether(r: number) {
    if (this.hopping) return;
    this.hopping = true;
    for (let i = 0; i < MATCH_CARS; i++) {
      if (this.done) break;
      this.modelCars[i].scale.set(CAR * 1.15); this.rowCars[r][i].scale.set(CAR * 1.15);
      await this.ctx.tw.wait(0.35);
      if (this.done) break;
      this.modelCars[i].scale.set(CAR); this.rowCars[r][i].scale.set(CAR);
    }
    this.hopping = false;
  }

  resize(v: View) {
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.blue.light).rect(0, v.h * 0.58, v.w, v.h * 0.42).fill(0xfff1e0);
    const row = this.plan.match === 'row';
    const modelY = v.h * (row ? 0.2 : 0.18);
    this.modelCars.forEach((c, i) => c.position.set(v.w / 2 + (i - (MATCH_CARS - 1) / 2) * STEP, modelY));
    this.rows.forEach((r, i) => r.position.set(v.w / 2, v.h * (0.4 + i * 0.185)));
    this.slots.forEach((c, i) => c.position.set(v.w / 2 + (i - (MATCH_CARS - 1) / 2) * STEP, v.h * 0.42));
    this.tray.forEach((c, i) => c.position.set(v.w / 2 + (i - 1) * 170, v.h * 0.72));
    this.layoutGlow();
  }

  private layoutGlow() {
    this.glow.clear(); this.hintGlow.clear();
    if (this.done) return;
    if (this.plan.match === 'row') {
      if (this.wrong >= 2) { const r = this.rows[this.round.answer]; this.hintGlow.roundRect(r.x - 238, r.y - 62, 476, 124, 26).stroke({ width: 8, color: swatch.green.fill }); }
      return;
    }
    const slot = this.slots[this.placed.length];
    this.glow.roundRect(slot.x - 40, slot.y - 44, 80, 90, 16).stroke({ width: 6, color: swatch.yellow.line });
    if (this.wrong >= 2) for (const p of validPieces(this.round.model, this.placed)) { const c = this.tray[p]; this.hintGlow.roundRect(c.x - 68, c.y - 68, 136, 136, 24).stroke({ width: 8, color: swatch.green.fill }); }
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.65 + 0.35 * Math.sin(this.clock * 3);
  }
  destroy() {}

  /** The ghost finger: tap the row that repeats the model's way, or the tray animal that fits the glowing car. */
  autotouch(): TouchIntent | null {
    if (this.done) return null;
    if (this.plan.match === 'row') return { tap: { on: this.rows[this.round.answer] } };
    return { tap: { on: this.tray[validPieces(this.round.model, this.placed)[0]] } };
  }

  /** The round is over. The couch checks read this name on every game. */
  get finished() {
    return this.done;
  }
}
