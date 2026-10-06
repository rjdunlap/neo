import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, RAINBOW, swatch, wood } from '../../art/palette';
import { petSpec } from '../../art/pet';
import { prop } from '../../art/props';
import { puffs } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { drawSpring, faceCard, feelingBubble, feelingCritter, feelingsSticker, FRIENDS, helperArt, helperCard, jackBox, moonAndStars, present } from './art';
import { FEELINGS, feelingPlan, feelingRound, type Feeling, type FeelingEvent, type FeelingPlan, type Helper, type Need, type Question } from './logic';

const PET_SCALE = 0.85;

interface Option {
  value: string;
  node: Container;
  critter?: Critter;
}

/** How each feeling sounds when a face shows it. */
function feelingSound(feeling: Feeling) {
  if (feeling === 'happy') sfx.giggle();
  else if (feeling === 'sad') sfx.sigh();
  else if (feeling === 'sleepy') sfx.yawn();
  else sfx.squeak(12);
}

class FeelingsFaces implements Game {
  readonly plan: FeelingPlan;
  readonly questions: Question<string, string>[];
  /** The big pet in the middle; the friends level has a row of friends instead. */
  readonly pet: Critter | null;
  readonly options: Option[] = [];
  readonly friends: { critter: Critter; feeling: Feeling }[] = [];
  /** Free play: which feelings have been shown, and how many taps. */
  readonly tried = new Set<Feeling>();
  taps = 0;
  q = 0;
  wrong = 0;
  misses = 0;
  hints = 0;
  busy = false;
  done = false;

  private readonly background = new Graphics();
  /** Props for events and needs: a balloon, a bowl, snow and so on. */
  private readonly props = new Container();
  private readonly glow = new Graphics();
  private readonly night = new Graphics();
  private view: View;
  private clock = 0;
  private shiver = 0;
  private snowIn = 0;
  private instruction: { id: LineId; vars?: LineVars } | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = feelingPlan(ctx.level);
    this.questions = feelingRound(this.plan, ctx.rng);
    this.night.alpha = 0;
    ctx.stage.addChild(this.background, this.night, this.props);
    if (this.plan.mode === 'friends') {
      for (const name of ctx.rng.shuffle([...FRIENDS]).slice(0, 4)) {
        const critter = feelingCritter(CRITTERS[name], 'happy', 0.62);
        critter.hitArea = new Rectangle(-150, -310, 300, 330);
        const friend = { critter, feeling: 'happy' as Feeling };
        onTap(critter, () => this.choose(friend.feeling, critter));
        this.friends.push(friend);
        ctx.stage.addChild(critter);
      }
      this.pet = null;
    } else {
      // The pet is the star here, so the corner guide steps out; tapping the big pet repeats instead.
      ctx.pet.visible = false;
      this.pet = feelingCritter(ctx.petSpec, this.plan.mode === 'why' ? 'calm' : 'happy', PET_SCALE);
      this.pet.hitArea = new Circle(0, -125, 150);
      onTap(this.pet, () => this.tapPet());
      ctx.stage.addChild(this.pet);
    }
    ctx.stage.addChild(this.glow);
    if (this.plan.mode === 'play') {
      for (const feeling of FEELINGS) {
        const { node, critter } = feelingBubble(ctx.petSpec, feeling);
        onTap(node, () => this.showFeeling(feeling, node), { radius: 85 });
        this.options.push({ value: feeling, node, critter });
        ctx.stage.addChild(node);
      }
    }
  }

  start() {
    if (this.plan.mode === 'play') this.instruct('feel.play');
    else void this.ask();
  }

  private instruct(id: LineId, vars?: LineVars) {
    this.instruction = { id, vars };
    return this.ctx.instruct(id, vars);
  }

  // Free play -------------------------------------------------------------

  private showFeeling(feeling: Feeling, node: Container) {
    if (this.done || !this.pet) return;
    this.taps++;
    this.tried.add(feeling);
    this.clearProps();
    this.pet.setMood(feeling);
    this.pet.hop(0.5);
    feelingSound(feeling);
    void this.ctx.say(`feel.${feeling}`);
    this.ctx.tw.kill(node.scale);
    node.scale.set(0.88);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
    this.feelingBurst(feeling);
    this.checkPlayDone();
  }

  private tapPet() {
    const pet = this.pet!;
    if (this.plan.mode !== 'play') {
      pet.poke();
      if (this.instruction && !this.busy) void this.ctx.say(this.instruction.id, this.instruction.vars);
      return;
    }
    if (this.done) return;
    this.taps++;
    const sad = pet.currentMood === 'sad';
    pet.poke();
    if (sad) {
      // A hug makes it better, and the rain cloud goes away.
      this.clearProps();
      pet.setMood('happy');
      sfx.giggle();
      this.hearts(pet.x, pet.y - 130);
      void this.ctx.say('feel.hug');
    } else {
      sfx.giggle();
      void this.ctx.say('poke.pip');
    }
    this.checkPlayDone();
  }

  private checkPlayDone() {
    // Every feeling seen, or plenty of happy tapping on favorites: either way the round ends with a sticker.
    if (((this.tried.size === FEELINGS.length && this.taps >= 6) || this.taps >= 12) && !this.done) {
      this.done = true;
      void this.ctx.tw.wait(2).then(() => {
        this.pet?.setMood('happy');
        this.pet?.cheer();
        void this.ctx.say('feel.done');
        return this.ctx.tw.wait(1.4);
      }).then(() => this.ctx.finish({ misses: 0, hints: 0 }));
    }
  }

  // Questions -------------------------------------------------------------

  private get question() {
    return this.questions[this.q];
  }

  private async ask() {
    const q = this.question;
    this.wrong = 0;
    this.busy = true;
    this.clearOptions();
    this.drawGlow();
    const pet = this.pet;
    switch (this.plan.mode) {
      case 'mirror':
        pet!.setMood(q.answer as Feeling);
        feelingSound(q.answer as Feeling);
        this.dealFaces(q.options as Feeling[]);
        this.instruct('feel.mirror');
        break;
      case 'name':
        pet!.setMood('happy');
        this.dealFaces(q.options as Feeling[]);
        this.instruct('feel.find', { feeling: q.answer });
        break;
      case 'help':
        this.showNeed(q.prompt as Need);
        this.dealHelpers(q.options as Helper[]);
        this.instruct(`feel.need-${q.prompt as Need}`);
        break;
      case 'why':
        pet!.setMood('calm');
        await this.playEvent(q.prompt as FeelingEvent);
        if (this.done) return;
        this.dealFaces(q.options as Feeling[]);
        this.instruct('feel.how');
        break;
      case 'friends':
        q.options.forEach((f, i) => {
          this.friends[i].feeling = f as Feeling;
          this.friends[i].critter.setMood(f as Feeling);
        });
        this.instruct('feel.friend', { feeling: q.answer });
        break;
    }
    this.resize(this.view);
    this.busy = false;
  }

  private dealFaces(feelings: Feeling[]) {
    for (const feeling of feelings) {
      const { node, critter } = faceCard(this.ctx.petSpec, feeling);
      this.addOption({ value: feeling, node, critter });
    }
  }

  private dealHelpers(helpers: Helper[]) {
    for (const helper of helpers) this.addOption({ value: helper, node: helperCard(helper) });
  }

  private addOption(option: Option) {
    option.node.hitArea = new Rectangle(-90, -100, 180, 200);
    onTap(option.node, () => this.choose(option.value, option.node));
    option.node.scale.set(0);
    void this.ctx.tw.to(option.node.scale, { x: 1, y: 1 }, { duration: 0.35, delay: this.options.length * 0.08, ease: ease.outBack });
    this.options.push(option);
    this.ctx.stage.addChild(option.node);
  }

  private clearOptions() {
    for (const o of this.options) {
      this.ctx.tw.kill(o.node.scale);
      o.node.destroy({ children: true });
    }
    this.options.length = 0;
  }

  private choose(value: string, node: Container) {
    if (this.busy || this.done) return;
    const q = this.question;
    if (value !== q.answer) {
      this.misses++;
      this.wrong++;
      sfx.boing();
      this.ctx.tw.kill(node);
      const x = node.x;
      void this.ctx.tw.to(node, { x: x + 12 }, { duration: 0.06 }).then(() => this.ctx.tw.to(node, { x }, { duration: 0.25, ease: ease.outElastic }));
      if (this.wrong === 2) {
        this.hints++;
        void this.ctx.say('feel.hint');
      } else if (this.plan.mode === 'help') void this.ctx.say('feel.not-that');
      else if (this.plan.mode === 'friends') void this.ctx.say('feel.friend-that', { feeling: value });
      else void this.ctx.say('feel.that', { feeling: value });
      this.drawGlow();
      return;
    }
    this.busy = true;
    this.wrong = 0;
    this.drawGlow();
    sfx.bell(5 + this.q, 0.3);
    void this.right(value, node).then(() => this.next());
  }

  private async right(value: string, node: Container) {
    const pet = this.pet;
    switch (this.plan.mode) {
      case 'mirror':
      case 'name':
      case 'why':
        pet!.setMood(value as Feeling, 2.5);
        pet!.hop(0.6);
        feelingSound(value as Feeling);
        this.feelingBurst(value as Feeling);
        await this.ctx.say(`feel.${value as Feeling}`);
        break;
      case 'help': {
        // The helper floats over to the pet, and the need goes away.
        void this.ctx.tw.to(node, { x: pet!.x, y: pet!.y - 110 }, { duration: 0.5, ease: ease.inOutSine });
        await this.ctx.tw.to(node.scale, { x: 0.5, y: 0.5 }, { duration: 0.5 });
        node.visible = false;
        this.endNeed();
        pet!.setMood('happy');
        pet!.cheer();
        if (value === 'hug') this.hearts(pet!.x, pet!.y - 130);
        else this.ctx.particles.burst(pet!.x, pet!.y - 130, { kind: 'star', colors: [swatch.yellow.fill], count: 18, speed: [120, 300] });
        await this.ctx.say('feel.helped');
        break;
      }
      case 'friends': {
        const friend = this.friends.find((f) => f.critter === node)!;
        friend.critter.hop(0.7);
        if (friend.feeling === 'sad') {
          // Sad friends get a hug and cheer up.
          this.hearts(friend.critter.x, friend.critter.y - 110);
          friend.critter.setMood('happy');
        }
        await this.ctx.say('feel.friend-yes', { feeling: value });
        break;
      }
    }
    await this.ctx.tw.wait(0.5);
  }

  private next() {
    this.clearProps();
    this.q++;
    if (this.q < this.questions.length) {
      void this.ask();
      return;
    }
    this.done = true;
    this.clearOptions();
    this.pet?.setMood('happy');
    this.pet?.cheer();
    this.friends.forEach((f) => { f.critter.setMood('happy'); f.critter.hop(0.6); });
    void this.ctx.say('feel.done');
    void this.ctx.tw.wait(1.5).then(() => this.ctx.finish({ misses: this.misses, hints: this.hints }));
  }

  // Needs and events --------------------------------------------------------

  private showNeed(need: Need) {
    const pet = this.pet!;
    pet.setMood(need === 'sleepy' ? 'sleepy' : 'sad');
    if (need === 'sad') sfx.sigh();
    if (need === 'sleepy') sfx.yawn();
    if (need === 'hungry') {
      sfx.rumble();
      const bowl = new Graphics()
        .moveTo(-60, -40)
        .quadraticCurveTo(0, 30, 60, -40)
        .closePath()
        .fill(swatch.white.fill)
        .stroke({ width: 6, color: swatch.blue.line, join: 'round' });
      bowl.position.set(pet.x + 190, pet.y);
      this.props.addChild(bowl);
    }
    if (need === 'cold') {
      this.shiver = 1;
      sfx.whoosh();
    }
  }

  private endNeed() {
    this.shiver = 0;
    if (this.pet) this.pet.x = this.view.w / 2;
  }

  private async playEvent(event: FeelingEvent) {
    const pet = this.pet!;
    const tw = this.ctx.tw;
    const x = pet.x + 200;
    const y = pet.y;
    void this.ctx.say(`feel.event-${event}`);
    switch (event) {
      case 'balloon': {
        const balloon = new Container();
        const string = new Graphics().moveTo(0, 46).quadraticCurveTo(-14, 110, 6, 170).stroke({ width: 3, color: swatch.white.line });
        balloon.addChild(string, prop('balloon', 'red'));
        balloon.position.set(pet.x + 150, y - 300);
        this.props.addChild(balloon);
        await tw.wait(1.2);
        sfx.whoosh();
        await tw.to(balloon, { x: balloon.x + 160, y: -260 }, { duration: 2.2, ease: ease.inQuad });
        break;
      }
      case 'present': {
        const { node, lid } = present();
        node.position.set(x, y);
        node.scale.set(0);
        this.props.addChild(node);
        await tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.5, ease: ease.outBack });
        await tw.wait(0.8);
        sfx.pop(9);
        void tw.to(lid, { y: -190, rotation: 0.5, alpha: 0 }, { duration: 0.6 });
        this.ctx.particles.burst(x, y - 100, { kind: 'star', colors: RAINBOW.map((c) => swatch[c].fill), count: 24, speed: [150, 380] });
        await tw.wait(1.2);
        break;
      }
      case 'jack': {
        const { node, head, spring } = jackBox();
        node.position.set(x, y);
        this.props.addChild(node);
        await tw.wait(1.2);
        head.visible = true;
        sfx.boing();
        const s = { top: -80 };
        const draw = () => { drawSpring(spring, s.top); head.y = s.top + 20; };
        const ticker = { update: draw };
        this.ctx.track(ticker);
        await tw.to(s, { top: -200 }, { duration: 0.35, ease: ease.outElastic });
        await tw.wait(1.2);
        this.ctx.untrack(ticker);
        break;
      }
      case 'moon': {
        const moon = moonAndStars();
        moon.position.set(this.view.w * 0.78, 150);
        moon.alpha = 0;
        this.props.addChild(moon);
        void tw.to(this.night, { alpha: 0.45 }, { duration: 1.5 });
        await tw.to(moon, { alpha: 1, y: 130 }, { duration: 1.5 });
        sfx.yawn();
        await tw.wait(1);
        break;
      }
    }
  }

  private clearProps() {
    this.endNeed();
    this.props.removeChildren().forEach((c) => c.destroy({ children: true }));
    if (this.night.alpha > 0) void this.ctx.tw.to(this.night, { alpha: 0 }, { duration: 0.6 });
  }

  // Effects -----------------------------------------------------------------

  private hearts(x: number, y: number) {
    this.ctx.particles.burst(x, y, { kind: 'heart', colors: [swatch.pink.fill, swatch.red.fill], count: 16, speed: [120, 300], gravity: -60, size: [0.8, 1.3] });
  }

  private feelingBurst(feeling: Feeling) {
    const pet = this.pet;
    if (!pet) return;
    const x = pet.x;
    const y = pet.y - 150;
    if (feeling === 'happy') this.ctx.particles.burst(x, y, { kind: 'confetti', colors: RAINBOW.map((c) => swatch[c].fill), count: 30, speed: [200, 420], gravity: 300 });
    if (feeling === 'sad') void this.rainCloud(x, y - 150);
    if (feeling === 'sleepy') this.ctx.particles.burst(x + 60, y - 40, { kind: 'ring', colors: [swatch.purple.light], count: 5, speed: [30, 70], gravity: -40, angle: -Math.PI / 3, spread: 0.6, life: [1.2, 1.8] });
    if (feeling === 'surprised') this.ctx.particles.burst(x, y, { kind: 'star', colors: [swatch.yellow.fill, swatch.orange.fill], count: 16, speed: [250, 450] });
  }

  /** A little cloud drizzles beside the pet's head for a moment, then drifts away. */
  private async rainCloud(x: number, y: number) {
    const cloud = puffs(new Graphics(), [[-38, 6, 30], [0, -12, 40], [38, 6, 30]], swatch.white.light, swatch.blue.line, 5);
    cloud.position.set(x + 70, y);
    cloud.alpha = 0;
    this.props.addChild(cloud);
    const tw = this.ctx.tw;
    await tw.to(cloud, { alpha: 1 }, { duration: 0.25 });
    for (let i = 0; i < 10 && !cloud.destroyed; i++) {
      this.ctx.particles.burst(cloud.x + this.ctx.rng.range(-40, 40), cloud.y + 30, { colors: [swatch.blue.fill], count: 1, speed: [60, 90], gravity: 500, angle: Math.PI / 2, spread: 0.1, size: [0.25, 0.35], life: [0.5, 0.6] });
      await tw.wait(0.14);
    }
    if (!cloud.destroyed) await tw.to(cloud, { alpha: 0, x: cloud.x + 60 }, { duration: 0.6 });
    if (!cloud.destroyed) cloud.destroy();
  }

  // Layout ------------------------------------------------------------------

  resize(v: View) {
    this.view = v;
    const floor = v.h * 0.6;
    // A rug in a color the pet isn't, so any pet stands out.
    const rug = swatch[this.ctx.petSpec.color === 'blue' ? 'green' : 'blue'];
    const g = this.background.clear().rect(0, 0, v.w, v.h).fill(cream);
    // A window, a floor, and a round rug for the pet to stand on.
    const wx = v.w * 0.12;
    const wy = Math.min(140, floor - 280);
    g.roundRect(wx, wy, 190, 150, 16).fill(swatch.blue.light).stroke({ width: 10, color: wood.fill });
    g.moveTo(wx + 95, wy).lineTo(wx + 95, wy + 150).moveTo(wx, wy + 75).lineTo(wx + 190, wy + 75).stroke({ width: 8, color: wood.fill });
    g.rect(0, floor - 40, v.w, v.h - floor + 40).fill(wood.light).rect(0, floor - 44, v.w, 8).fill(wood.fill);
    g.ellipse(v.w / 2, floor + 5, 190, 38).fill(rug.light).stroke({ width: 6, color: rug.fill });
    this.night.clear().rect(0, 0, v.w, v.h).fill(swatch.purple.line);
    this.pet?.position.set(v.w / 2, floor);

    if (this.plan.mode === 'play') {
      const xs = spread(this.options.length, 160, v.w - 40, 200);
      this.options.forEach((o, i) => o.node.position.set(xs[i], v.h - 105));
    } else {
      const xs = spread(this.options.length, 160, v.w - 40, 215);
      this.options.forEach((o, i) => {
        this.ctx.tw.kill(o.node);
        o.node.position.set(xs[i], v.h - 125);
      });
    }
    const fx = spread(this.friends.length, 160, v.w - 40, 215);
    this.friends.forEach((f, i) => f.critter.position.set(fx[i], v.h * 0.68));
    this.drawGlow();
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (this.wrong < 2 || this.done || !this.question) return;
    const answer = this.question.answer;
    if (this.plan.mode === 'friends') {
      const f = this.friends.find((f) => f.feeling === answer);
      if (f) g.roundRect(f.critter.x - 100, f.critter.y - 215, 200, 235, 30).stroke({ width: 8, color: swatch.yellow.line });
      return;
    }
    const o = this.options.find((o) => o.value === answer);
    if (o) g.roundRect(o.node.x - 98, o.node.y - 108, 196, 216, 28).stroke({ width: 8, color: swatch.yellow.line });
  }

  update(dt: number) {
    this.clock += dt;
    this.pet?.update(dt);
    this.options.forEach((o) => o.critter?.update(dt));
    this.friends.forEach((f) => f.critter.update(dt));
    this.glow.alpha = 0.65 + 0.35 * Math.sin(this.clock * 4);
    if (this.shiver && this.pet) {
      this.pet.x = this.view.w / 2 + Math.sin(this.clock * 40) * 4;
      this.snowIn -= dt;
      if (this.snowIn <= 0) {
        this.snowIn = 0.12;
        this.ctx.particles.burst(this.ctx.rng.range(this.view.w * 0.3, this.view.w * 0.7), 40, { colors: [swatch.white.fill], count: 1, speed: [30, 60], gravity: 60, angle: Math.PI / 2, spread: 0.4, life: [4, 5] });
      }
    }
  }

  destroy() {
    this.ctx.pet.visible = true;
  }
}

export const feelingsFaces: GameModule = {
  id: 'feelings-faces',
  name: 'Feelings Faces',
  titleLine: 'game.feelings-faces',
  region: 'cozy-village',
  skills: ['emotions', 'empathy', 'vocabulary'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (b) => (b === 'prek' ? { min: 5, max: 7 } : b === 'preschool' ? { min: 3, max: 6 } : b === 'toddler' ? { min: 2, max: 4 } : { min: 1, max: 2 }),
  describeLevel: (l) => feelingPlan(l).name,
  music: STYLES.paint,
  coplayHint: 'Make the same face as the pet with {name}, and name the feeling together.',
  offScreen: 'Make happy, sad, sleepy and surprised faces in a mirror together, and talk about what makes each one happen.',
  hubIcon: () => {
    const c = new Container();
    const pet = feelingCritter(petSpec(), 'happy', 0.5);
    pet.alive = false;
    const heart = helperArt('hug');
    heart.scale.set(0.5);
    heart.position.set(70, -150);
    c.addChild(pet, heart);
    return new WigglyIcon(c);
  },
  sticker: (seed) => feelingsSticker(seed),
  create: (ctx) => new FeelingsFaces(ctx),
};
