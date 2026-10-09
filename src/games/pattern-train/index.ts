import { Container, Graphics } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { playIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import { replayArt, symbol, tile, trainArt, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { buildTrain, patternPlan, wantedChoice, type PatternPlan } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = { lap: { min: 1, max: 1 }, toddler: { min: 1, max: 1 }, preschool: { min: 1, max: 6 }, prek: { min: 3, max: 9 }, school: { min: 8, max: 9 } };

class PatternTrain implements Game {
  readonly plan: PatternPlan;
  readonly sequence: number[];
  readonly targets: number[];
  private target = 0;
  readonly cars: Container[] = [];
  readonly choices: Container[] = [];
  private readonly scene = new Container();
  private readonly background = new Graphics();
  private readonly tracks = new Graphics();
  private readonly glow = new Graphics();
  private readonly selection = new Graphics();
  private readonly replay: RoundButton;
  private readonly confirm: RoundButton;
  private readonly hintsGlow = new Graphics();
  private selected: number | null = null;
  private misses = 0;
  private hints = 0;
  private wrong = 0;
  private done = false;
  private playing = false;
  /** The bell pattern has been played once, so a listener has something to go on. */
  private played = false;
  private clock = 0;
  // Couch play: a ring over the three choices.
  private focus = 0;
  private couchOn = false;
  private readonly ring = new Graphics();
  private botWait = 1.5;

  constructor(private readonly ctx: GameContext) {
    this.plan = patternPlan(ctx.level);
    ({ sequence: this.sequence, targets: this.targets } = buildTrain(this.plan, ctx.rng));
    ctx.stage.addChild(this.background, this.tracks, this.scene);
    this.scene.addChild(this.glow, this.hintsGlow, this.selection);
    this.sequence.forEach((value, i) => {
      const car = new Container();
      car.addChild(tile(100, 108, 'white'));
      const content = this.targets.includes(i) ? label('?',  60, swatch.purple.line) : symbol(this.plan.kind, value, 32);
      car.addChild(content);
      car.addChild(new Graphics().circle(-27, 65, 12).circle(27, 65, 12).fill(swatch.brown.line));
      onTap(car, () => { if (!this.targets.slice(this.target).includes(i)) sfx.bell(4 + value * 3, 0.35); }, { radius: 55 });
      this.cars.push(car); this.scene.addChild(car);
    });
    for (let i = 0; i < 3; i++) {
      const choice = new Container();
      choice.addChild(tile(120, 120, 'white'), symbol(this.plan.kind, i, 36));
      onTap(choice, () => {
        if (this.done) return;
        if (this.plan.kind === 'bell') { this.selected = i; sfx.bell(4 + i * 3, 0.45); this.layoutGlow(); }
        else this.choose(i);
      });
      this.choices.push(choice); this.scene.addChild(choice);
    }
    this.replay = new RoundButton(replayArt(), swatch.yellow,  50, () => void this.playPattern());
    this.confirm = new RoundButton(playIcon(), swatch.green,  50, () => { if (this.selected !== null) this.choose(this.selected); });
    this.confirm.visible = this.plan.kind === 'bell';
    this.ring.eventMode = 'none';
    this.scene.addChild(this.replay, this.confirm, this.ring);
  }

  start() {
    void this.ctx.instruct(this.plan.kind === 'bell' ? 'pattern.sound' : 'pattern.start');
    if (this.plan.kind === 'bell') void this.ctx.tw.wait(1.5).then(() => this.playPattern());
  }

  private async playPattern() {
    if (this.playing || this.done) return;
    this.playing = true;
    for (let i = 0; i < this.sequence.length; i++) {
      if (this.targets.slice(this.target).includes(i)) continue;
      const c = this.cars[i];
      sfx.bell(4 + this.sequence[i] * 3, 0.32);
      c.scale.set(1.08);
      await this.ctx.tw.wait(0.38);
      c.scale.set(1);
    }
    this.playing = false;
    this.played = true;
  }

  private choose(value: number) {
    if (this.done) return;
    const index = this.targets[this.target];
    if (value !== this.sequence[index]) {
      this.misses++; this.wrong++;
      sfx.boing();
      void this.ctx.say('pattern.wrong');
      if (this.wrong === 2) { this.hints++; void this.ctx.say('pattern.hint'); }
      this.layoutGlow();
      return;
    }
    sfx.bell(4 + value * 3, 0.4);
    const car = this.cars[index];
    car.removeChildAt(1).destroy({ children: true });
    car.addChildAt(symbol(this.plan.kind, value, 32), 1);
    this.target++; this.wrong = 0; this.selected = null;
    if (this.target === this.targets.length) {
      this.done = true;
      this.glow.clear(); this.hintsGlow.clear(); this.selection.clear();
      void this.ctx.tw.wait(0.6).then(() => this.ctx.finish({ misses: this.misses, hints: this.hints }));
    } else { void this.ctx.say('pattern.next'); this.layoutGlow(); }
  }

  resize(v: View) {
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.blue.light).rect(0, v.h * 0.58, v.w, v.h * 0.42).fill(cream);
    const y = v.h * 0.4;
    this.tracks.clear().moveTo(35, y + 80).lineTo(v.w - 35, y + 80).stroke({ width: 8, color: swatch.brown.line });
    for (let x = 35; x < v.w; x += 32) this.tracks.moveTo(x, y + 70).lineTo(x + 8, y + 94).stroke({ width: 5, color: swatch.brown.fill });
    this.cars.forEach((c, i) => c.position.set(55 + (i + 0.5) * (v.w - 110) / this.cars.length, y));
    this.choices.forEach((c, i) => c.position.set(v.w / 2 + (i - 1) * 170, v.h * 0.76));
    this.replay.position.set(v.w -  70,  70);
    this.confirm.position.set(v.w - 90, v.h * 0.76);
    this.layoutGlow();
  }

  private layoutGlow() {
    this.glow.clear(); this.hintsGlow.clear(); this.selection.clear();
    if (this.done) return;
    const car = this.cars[this.targets[this.target]];
    this.glow.roundRect(car.x -  60, car.y -  64, 120, 130, 22).stroke({ width: 7, color: swatch.yellow.line });
    if (this.wrong >= 2) {
      const c = this.choices[this.sequence[this.targets[this.target]]];
      this.hintsGlow.roundRect(c.x - 68, c.y - 68, 136, 136, 24).stroke({ width: 8, color: swatch.green.fill });
    }
    if (this.selected !== null) {
      const c = this.choices[this.selected];
      this.selection.roundRect(c.x - 65, c.y - 65, 130, 130, 22).stroke({ width: 5, color: swatch.purple.fill });
    }
  }
  update(dt: number) {
    this.clock += dt; this.glow.alpha = 0.65 + 0.35 * Math.sin(this.clock * 3);
    const ring = this.ring.clear();
    const choice = this.couchOn && !this.done ? this.choices[this.focus] : undefined;
    if (choice) ring.roundRect(choice.x - 76, choice.y - 76, 152, 152, 28).stroke({ width: 8, color: swatch.teal.line });
  }
  destroy() {}

  /**
   * The ghost finger on the how-to card: tap the choice that fits the empty car, then on the bell levels press the green
   * button to confirm it; on the bell levels it first waits for the notes to be played.
   */
  autotouch(): TouchIntent | null {
    if (this.done) return null;
    const bell = this.plan.kind === 'bell';
    if (bell && (!this.played || this.playing)) return null;
    const want = wantedChoice(this.sequence, this.targets, this.target);
    if (bell && this.selected === want) return { tap: { on: this.confirm } };
    return { tap: { on: this.choices[want] } };
  }

  /** The round is over. The couch checks read this name on every game. */
  get finished() {
    return this.done;
  }

  /** Couch play: left and right move the ring along the choices; the bottom button picks the one it is on. */
  control(input: CouchControls) {
    this.couchOn = true;
    if (this.done) return;
    for (const p of input.players) {
      const was = this.focus;
      if (p.direction === 0) this.focus = Math.min(this.choices.length - 1, this.focus + 1);
      else if (p.direction === 2) this.focus = Math.max(0, this.focus - 1);
      if (this.focus !== was && this.plan.kind === 'bell') sfx.bell(4 + this.focus * 3, 0.45);
      if (p.action) this.choose(this.focus);
    }
  }

  /** The "watch me" demo: look at the glowing car, then move to the choice that fits and press. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    out.players[0].active = true;
    this.botWait -= dt;
    if (this.done || this.botWait > 0) return out;
    const want = wantedChoice(this.sequence, this.targets, this.target);
    if (want === this.focus) {
      out.players[0].action = true;
      this.botWait = 1;
    } else {
      out.players[0].direction = want > this.focus ? 0 : 2;
      this.botWait = 0.45;
    }
    return out;
  }
}

export const patternTrain: GameModule = {
  id: 'pattern-train', name: 'Pattern Train', titleLine: 'game.pattern-train', region: 'puzzle-peaks',
  skills: ['patterns', 'sequencing', 'listening'], bands: ['preschool', 'prek', 'school'], levels: (b) => rangeFor(LEVELS, b),
  describeLevel: (l) => patternPlan(l).name,
  music: STYLES.jelly, offScreen: 'Make a clap–tap pattern together, then leave a beat for your child to fill.',
  hubIcon: () => new WigglyIcon(trainArt()), touchDemo: true, sticker: () => trainArt(), create: (ctx) => new PatternTrain(ctx),
};
