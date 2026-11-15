import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, shadow, swatch, wood } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { HINT_AFTER, hinted, newTally, tally } from '../../progress/coach';
import { RoundButton, spring, squash } from '../../ui/buttons';
import { checkIcon } from '../../ui/icons';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  addMatchDrop,
  MATCH_CAPACITY,
  matchDegrees,
  matchHint,
  matchesSample,
  morePaint,
  PAPER,
  pickSamples,
  POT_RADIUS,
  wheelColor,
  type MatchBowl,
  type MatchPot,
} from './logic';
import { paintPot } from './pot';

const EMPTY: MatchBowl = [0, 0];
const POT_INDEXES = [0, 1] as const;
const BOWL_Y = 16;
const CARD_Y = -166;
const POUR_TIME = 0.44;
const SHINE_TIME = 0.6;
const NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'];

function dish() {
  return new Graphics()
    .moveTo(-92, -12)
    .quadraticCurveTo(-82, 50, 0, 50)
    .quadraticCurveTo(82, 50, 92, -12)
    .closePath()
    .fill(swatch.white.light)
    .stroke({ width: 5, color: swatch.white.line });
}

function tipIcon() {
  const icon = new Container();
  const bowl = dish();
  bowl.scale.set(0.25);
  bowl.rotation = -0.68;
  bowl.position.set(4, -15);
  const drops = new Graphics().circle(-20, 0, 5).circle(-24, 12, 3.5).fill(swatch.blue.line);
  icon.addChild(bowl, drops);
  return icon;
}

export class MatchPaint implements Game {
  private readonly board = new Container();
  private readonly paper = new Graphics();
  private readonly progress = new Graphics();
  private readonly card = new Graphics();
  private readonly bowl = new Container();
  private readonly paint = new Graphics();
  private readonly dropDots = new Graphics();
  private readonly glow = new Graphics();
  private readonly pour = new Graphics();
  private readonly potNodes = [new Container(), new Container()] as const;
  private readonly checkButton = new RoundButton(checkIcon(ink), swatch.green, 58, () => this.check()).named(
    'Does it match?',
    158,
  );
  private readonly resetButton = new RoundButton(tipIcon(), swatch.white, 58, () => this.reset()).named(
    'Start again',
    145,
  );
  private readonly samples;
  private readonly score = newTally();
  private counts: MatchBowl = EMPTY;
  private current = 0;
  private farChecks = 0;
  private showedHint = false;
  private glowTarget: Container | null = null;
  private clock = 0;
  private wobble = 0;
  private matchTime: number | null = null;
  private spokenMatch = Promise.resolve();
  private done = false;

  constructor(private readonly ctx: GameContext) {
    this.samples = pickSamples(ctx.rng);
    this.paper
      .roundRect(-313, -283, 626, 516, 36)
      .fill({ color: shadow, alpha: 0.1 })
      .roundRect(-316, -290, 632, 516, 36)
      .fill(PAPER)
      .stroke({ color: wood.light, width: 4 });
    const plate = new Graphics().ellipse(0, 53, 90, 12).fill({ color: shadow, alpha: 0.12 });
    this.bowl.addChild(plate, dish(), this.paint, this.dropDots);
    for (const index of POT_INDEXES) {
      const pot = this.potNodes[index];
      pot.position.set(index === 0 ? -77 : 77, 155);
      onTap(pot, () => this.addDrop(index), { radius: POT_RADIUS });
    }
    this.checkButton.position.set(219, BOWL_Y);
    this.resetButton.position.set(-219, BOWL_Y);
    // The whole name pill is part of each control, including its corners outside the round face.
    this.checkButton.hitArea = new Rectangle(-79, -66, 158, 144);
    this.resetButton.hitArea = new Rectangle(-73, -66, 146, 144);
    this.bowl.position.set(0, BOWL_Y);
    this.board.addChild(
      this.paper,
      this.progress,
      this.glow,
      this.card,
      this.bowl,
      this.pour,
      ...this.potNodes,
      this.resetButton,
      this.checkButton,
    );
    this.board.eventMode = 'passive';
    for (const art of [this.paper, this.progress, this.glow, this.card, this.bowl, this.pour])
      art.eventMode = 'none';
    ctx.stage.addChild(this.board);
    this.resize(ctx.view);
    this.showSample();
  }

  private get sample() {
    return this.samples[this.current];
  }

  get misses() {
    return this.score.misses;
  }

  get hints() {
    return this.score.hints;
  }

  start() {
    void this.ctx.instruct('paint.match.start');
  }

  resize(view: View) {
    this.board.position.set(view.w / 2, view.h / 2 + 36);
  }

  private showSample() {
    for (const index of POT_INDEXES) {
      const pot = this.potNodes[index];
      for (const art of pot.removeChildren()) art.destroy({ children: true });
      const art = paintPot(this.sample.pair[index]);
      art.eventMode = 'none';
      art.scale.set(1.4);
      pot.addChild(art);
    }
    this.drawCard();
    this.progress.clear();
    for (let i = 0; i < this.samples.length; i++) {
      const x = (i - 1) * 34;
      this.progress
        .circle(x, -260, 8)
        .fill(i <= this.current ? swatch.green.fill : swatch.white.light)
        .stroke({ color: i === this.current ? swatch.green.line : swatch.white.line, width: 2 });
    }
    this.drawBowl();
  }

  private drawCard(shining = 0) {
    const { share } = this.sample;
    const color = wheelColor(matchDegrees(this.sample, [3 - share, share])!);
    this.card
      .clear()
      .roundRect(-109, CARD_Y - 61, 218, 132, 19)
      .fill({ color: shadow, alpha: 0.15 })
      .roundRect(-112, CARD_Y - 69, 224, 132, 19)
      .fill(cream)
      .stroke({ width: 3, color: wood.light })
      .roundRect(-93, CARD_Y - 51, 186, 96, 13)
      .fill(color);
    if (shining > 0) {
      this.card
        .roundRect(-112, CARD_Y - 69, 224, 132, 19)
        .stroke({ width: 9, color: swatch.yellow.light, alpha: shining });
    }
  }

  private drawBowl() {
    const degrees = matchDegrees(this.sample, this.counts);
    this.paint.clear().ellipse(0, -12, 91, 29).fill(swatch.white.line);
    this.paint.ellipse(0, -12, 84, 23).fill(degrees === null ? swatch.white.light : wheelColor(degrees));
    this.dropDots.clear();
    let slot = 0;
    for (const index of POT_INDEXES) {
      const paint = swatch[this.sample.pair[index]];
      for (let i = 0; i < this.counts[index]; i++, slot++) {
        this.dropDots
          .circle((slot - (MATCH_CAPACITY - 1) / 2) * 24, 67, 9)
          .fill(paint.fill)
          .stroke({ color: paint.line, width: 2 });
      }
    }
  }

  private addDrop(index: MatchPot) {
    if (this.done || this.matchTime !== null) return;
    // Squash the paint pot art while leaving its 104-unit hit area steady for repeated drops.
    const art = this.potNodes[index].children[0];
    squash(art);
    spring(art);
    const next = addMatchDrop(this.counts, index);
    if (next === this.counts) {
      this.wobble = 0.4;
      this.showHint(this.resetButton);
      void this.ctx.say('paint.match.full');
      return;
    }
    this.counts = next;
    this.glowTarget = null;
    sfx.pop(5 + this.counts[index]);
    this.drawBowl();
  }

  private reset() {
    if (this.done || this.matchTime !== null) return;
    this.counts = EMPTY;
    this.glowTarget = null;
    this.wobble = 0;
    this.bowl.rotation = -0.25;
    void this.ctx.tw.to(this.bowl, { rotation: 0 }, { duration: 0.28 });
    sfx.whoosh();
    this.drawBowl();
  }

  private showHint(target: Container) {
    this.glowTarget = target;
    if (this.showedHint) return;
    this.showedHint = true;
    hinted(this.score);
  }

  private check() {
    if (this.done || this.matchTime !== null) return;
    if (matchesSample(this.sample, this.counts)) {
      this.matchTime = 0;
      this.glowTarget = null;
      sfx.sparkle();
      this.ctx.pet.cheer();
      this.spokenMatch = this.ctx.say('paint.match.made', {
        first: NUMBERS[this.counts[0]],
        second: NUMBERS[this.counts[1]],
        a: this.sample.pair[0],
        b: this.sample.pair[1],
        color: this.sample.name,
      });
      return;
    }
    const hint = matchHint(this.sample, this.counts);
    this.farChecks++;
    if (hint === 'start-again') {
      void this.ctx.say('paint.match.reset');
      if (this.farChecks >= HINT_AFTER) this.showHint(this.resetButton);
    } else {
      void this.ctx.say('paint.match.more', { color: this.sample.pair[morePaint(this.sample, this.counts)] });
      if (hint !== null && this.farChecks >= HINT_AFTER) this.showHint(this.potNodes[hint]);
    }
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    if (this.glowTarget) {
      const { x, y } = this.glowTarget;
      this.glow
        .circle(x, y, 67 + 4 * Math.sin(this.clock * 8))
        .fill({ color: swatch.yellow.light, alpha: 0.9 })
        .stroke({ color: swatch.yellow.fill, width: 4 });
    }
    if (this.wobble > 0) {
      this.wobble = Math.max(0, this.wobble - dt);
      this.bowl.rotation = this.wobble * 0.4 * Math.sin(this.wobble * 48);
    }
    if (this.matchTime === null || this.done) return;
    this.matchTime += dt;
    this.pour.clear();
    if (this.matchTime < POUR_TIME) {
      const t = this.matchTime / POUR_TIME;
      const y = BOWL_Y - 14 + (CARD_Y - BOWL_Y + 14) * t;
      const degrees = matchDegrees(this.sample, this.counts)!;
      this.pour.ellipse(Math.sin(Math.PI * t) * 44, y, 16, 24).fill(wheelColor(degrees));
    } else {
      const t = (this.matchTime - POUR_TIME) / SHINE_TIME;
      this.drawCard(Math.max(0, 1 - t));
      if (t >= 1) this.advance();
    }
  }

  private advance() {
    if (this.current === this.samples.length - 1) {
      this.done = true;
      // The result scene speaks its own praise, so let the player hear the final blend first.
      void this.spokenMatch.then(() => {
        if (this.ctx.alive) this.ctx.finish(tally(this.score));
      });
      return;
    }
    this.current++;
    this.counts = EMPTY;
    this.farChecks = 0;
    this.showedHint = false;
    this.matchTime = null;
    this.showSample();
  }

  autotouch(): TouchIntent | null {
    if (this.done || this.matchTime !== null) return null;
    const { share } = this.sample;
    if (this.counts[0] > 3 - share || this.counts[1] > share) return { tap: { on: this.resetButton } };
    if (this.counts[0] < 3 - share) return { tap: { on: this.potNodes[0] } };
    if (this.counts[1] < share) return { tap: { on: this.potNodes[1] } };
    return { tap: { on: this.checkButton } };
  }

  destroy() {
    this.board.destroy({ children: true });
  }
}
