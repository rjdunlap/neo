import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, RAINBOW, swatch, wood } from '../../art/palette';
import { makeStar, type CompanionRig } from '../../creatures/companion';
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
import { rangeFor } from '../../progress/difficulty';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { bouncyBall, butterfly, drawSpring, emptyBasket, eventPicture, leftoverClue, faceCard, feelingBubble, feelingCritter, feelingsSticker, FRIENDS, helperCard, iceCream, jackBox, moonAndStars, musicNote, present, windowCloud } from './art';
import { bubbleToTap, EVENTS, REACTIONS, type ClueEvent, CARE_SCENARIOS, LEVELS, pokeAfter, pokeDone, type PokeStep, FACE_PARTS, choiceToTap, FEELINGS, feelingPlan, feelingRound, playDone, type CareEvent, type Feeling, type FeelingEvent, type FeelingPlan, type Happening, type Helper, type Need, type Question } from './logic';

const PET_SCALE = 0.85;

interface Option {
  value: string;
  node: Container;
  critter?: CompanionRig;
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
  readonly pet: CompanionRig | null;
  readonly options: Option[] = [];
  readonly friends: { critter: Critter; feeling: Feeling }[] = [];
  /** Free play: which feelings have been shown, and how many taps. */
  readonly tried = new Set<Feeling>();
  taps = 0;
  /** Level 9: the last thing a poke showed, null before the first. */
  poked: PokeStep | null = null;
  q = 0;
  wrong = 0;
  misses = 0;
  hints = 0;
  busy = false;
  done = false;

  private readonly background = new Graphics();
  /** Props for events and needs: a balloon, a bowl, snow and so on. */
  private readonly props = new Container();
  /** Happening props, in front of the big pet so a tap reaches them (the butterfly lands on its nose). */
  private readonly front = new Container();
  /** Happening props wobbling from a tap, and for how long they have. */
  private readonly wobbles = new Map<Container, number>();
  private readonly glow = new Graphics();
  private readonly subject = new Graphics();
  private readonly night = new Graphics();
  private view: View;
  /** The window's middle, where the rain cloud gathers. */
  private window = { x: 0, y: 0 };
  private clock = 0;
  private shiver = 0;
  private snowIn = 0;
  private instruction: { id: LineId; vars?: LineVars } | null = null;
  /** The big pet's growth over the pip's scale, so a long, low friend fills the pip's space (as in Pet Says). */
  private grow = 1;
  /** The big pet's middle, and its right edge, in its own units: the river and glider stand off its origin. */
  private middle = 0;
  private edge = 0;
  /** Where the big pet stands: its feet at the rug's centre. */
  private petX = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = feelingPlan(ctx.level);
    this.questions = feelingRound(this.plan, ctx.rng);
    this.night.alpha = 0;
    ctx.stage.addChild(this.background, this.night, this.props);
    if (this.plan.mode === 'friends' || this.plan.mode === 'perspective') {
      for (const name of (this.plan.mode === 'perspective' ? ['cat', 'bunny'] as const : ctx.rng.shuffle([...FRIENDS]).slice(0, 4))) {
        const critter = feelingCritter(CRITTERS[name], 'happy', 0.62);
        critter.hitArea = new Rectangle(-150, -310, 300, 330);
        const friend = { critter, feeling: 'happy' as Feeling };
        onTap(critter, () => {
          if (this.plan.mode === 'perspective') {
            critter.hop(0.3);
            if (!this.busy && this.instruction) void ctx.say(this.instruction.id, this.instruction.vars);
          } else this.choose(friend.feeling, critter);
        });
        this.friends.push(friend);
        ctx.stage.addChild(critter);
      }
      this.pet = null;
      if (this.plan.mode === 'perspective') ctx.pet.visible = false;
    } else {
      // The pet is the star here, so the corner guide steps out; tapping the big pet repeats instead.
      ctx.pet.visible = false;
      const pet = ctx.companion();
      // Level 9's pet waits calm, so the first poke's happy face is a change she sees.
      pet.setMood(this.plan.mode === 'why' || this.plan.mode === 'poke' ? 'calm' : 'happy');
      const b = pet.getLocalBounds();
      this.grow = Math.max(1, Math.min(2.2, 270 / b.height, 440 / b.width));
      this.middle = b.x + b.width / 2;
      this.edge = b.x + b.width;
      // Body-centred, and never smaller than the pip's 150-unit circle.
      const t = pet.touch;
      pet.hitArea = new Circle(t.x, t.y, Math.max(150 / this.grow, t.r + 30));
      this.pet = pet;
      onTap(pet, () => this.tapPet());
      ctx.stage.addChild(this.pet);
    }
    this.subject.eventMode = this.glow.eventMode = 'none';
    ctx.stage.addChild(this.front, this.subject, this.glow);
    if (this.plan.mode === 'play') {
      for (const feeling of FEELINGS) {
        const { node, critter } = feelingBubble(ctx.companion(), feeling);
        onTap(node, () => this.showFeeling(feeling, node), { radius: 85 });
        this.options.push({ value: feeling, node, critter });
        ctx.stage.addChild(node);
      }
    }
  }

  start() {
    if (this.plan.mode === 'play') this.instruct('feel.play');
    else if (this.plan.mode === 'poke') this.instruct('feel.poke');
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
    if (this.plan.mode === 'poke') return this.poke(pet);
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
      const at = this.headAt();
      this.hearts(at.x, at.y);
      void this.ctx.say('feel.hug');
    } else {
      sfx.giggle();
      void this.ctx.say('poke.pip');
    }
    this.checkPlayDone();
  }

  /** Level 9: each tap anywhere on the pet shows the next feeling in the cycle, and a sad pet's next tap is a hug. */
  private poke(pet: CompanionRig) {
    if (this.done) return;
    this.taps++;
    const step = pokeAfter(this.poked);
    this.poked = step;
    this.clearProps();
    if (step === 'hug') {
      // The same hug as free play: the rain cloud goes, hearts rise and the pet is happy again.
      pet.poke();
      pet.setMood('happy');
      sfx.giggle();
      const at = this.headAt();
      this.hearts(at.x, at.y);
      void this.ctx.say('feel.hug');
    } else {
      pet.setMood(step);
      pet.hop(0.5);
      feelingSound(step);
      void this.ctx.say(`feel.${step}`);
      this.feelingBurst(step);
    }
    this.checkPlayDone();
  }

  private checkPlayDone() {
    // Every feeling seen, or plenty of happy tapping on favorites: either way the round ends with a sticker.
    const over = this.plan.mode === 'poke' ? pokeDone(this.taps) : playDone(this.tried, this.taps);
    if (over && !this.done) {
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
      case 'perspective': {
        const event = q.event!;
        if (q.friend === 0) {
          this.friends.forEach((f) => f.critter.setMood('calm'));
          if (event === 'rain') await this.ctx.say('feel.two-rain');
          await this.playEvent(event);
          await this.ctx.say('feel.two');
        }
        this.friends.forEach((f, i) => {
          f.feeling = REACTIONS[event][i];
          f.critter.setMood(f.feeling);
          f.critter.hop(0.5);
        });
        if (event === 'rain') {
          const bunny = this.friends[1].critter;
          this.ctx.particles.burst(bunny.x, bunny.y, { colors: [swatch.blue.fill], count: 12, speed: [50, 130], gravity: 300 });
        } else if (event === 'drum' && q.friend === 0) {
          const cat = this.friends[0].critter;
          const note = musicNote(swatch.purple.fill);
          note.eventMode = 'none';
          note.position.set(cat.x + 85, cat.y - 180);
          this.front.addChild(note);
        }
        this.dealFaces(q.options as Feeling[]);
        this.instruct('feel.how-friend', { friend: q.friend === 0 ? 'Cat' : 'Bunny' });
        break;
      }
      case 'clue': {
        const event = q.prompt as ClueEvent;
        pet!.setMood(EVENTS[event]);
        feelingSound(EVENTS[event]);
        const clue = leftoverClue(event);
        this.front.addChild(clue);
        for (const option of q.options as ClueEvent[]) {
          const node = new Container();
          const tile = new Graphics().roundRect(-85, -95, 170, 190, 18).fill(swatch.white.light).stroke({ width: 5, color: wood.line });
          node.addChild(tile, eventPicture(option));
          this.addOption({ value: option, node });
        }
        this.instruct('feel.what');
        break;
      }
      case 'care': {
        const event = q.prompt as CareEvent;
        const scenario = CARE_SCENARIOS[event];
        pet!.setMood('calm');
        await this.playEvent(event);
        if (this.done) return;
        this.showNeed(scenario.need, event !== 'basket');
        this.dealHelpers(q.options as Helper[]);
        this.instruct('feel.care');
        break;
      }
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
      const { node, critter } = faceCard(this.ctx.companion(), feeling);
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
      if (this.plan.mode === 'perspective') {
        const friend = this.friends[q.friend!];
        friend.critter.hop(0.5);
        feelingSound(friend.feeling);
        void this.ctx.say('feel.look-friend', { feeling: value, friend: q.friend === 0 ? 'Cat' : 'Bunny' });
      } else if (this.plan.mode === 'clue') {
        void this.ctx.say('feel.not-happened');
        if (value === 'balloon') sfx.whoosh();
        else if (value === 'present') sfx.pop(9);
        else if (value === 'moon') sfx.yawn();
        else sfx.tick();
        const preview = eventPicture(value as ClueEvent);
        preview.position.set(this.view.w / 2, this.view.h * 0.29);
        this.front.addChild(preview);
        // A brief replay of the chosen happening, leaving the pet and actual clue unchanged.
        preview.scale.set(0.7);
        void this.ctx.tw.to(preview.scale, { x: 1, y: 1 }, { duration: 0.45, ease: ease.outBack });
        void this.ctx.tw.to(preview, { alpha: 0 }, { duration: 0.4, delay: 0.6 }).then(() => { if (!preview.destroyed) preview.destroy({ children: true }); });
      }
      if (this.wrong === 2) {
        this.hints++;
        void this.ctx.say('feel.hint');
      } else if (this.plan.mode !== 'perspective' && this.plan.mode !== 'clue') {
        if (this.plan.mode === 'help' || this.plan.mode === 'care') void this.ctx.say('feel.not-that');
        else if (this.plan.mode === 'friends') void this.ctx.say('feel.friend-that', { feeling: value });
        else void this.ctx.say('feel.that', { feeling: value });
      }
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
      case 'perspective': {
        const f = this.friends[this.question.friend!];
        f.critter.hop(0.6);
        feelingSound(f.feeling);
        await this.ctx.say('feel.friend-yes', { feeling: value });
        break;
      }
      case 'clue':
        this.clearProps();
        await this.playEvent(value as ClueEvent);
        await this.ctx.say(`feel.${EVENTS[value as ClueEvent]}`);
        break;
      case 'mirror':
      case 'name':
      case 'why':
        pet!.setMood(value as Feeling, 2.5);
        pet!.hop(0.6);
        feelingSound(value as Feeling);
        this.feelingBurst(value as Feeling);
        await this.ctx.say(`feel.${value as Feeling}`);
        break;
      case 'help':
      case 'care': {
        // The helper floats over to the pet, and the need goes away.
        const at = this.headAt();
        void this.ctx.tw.to(node, { x: at.x, y: at.y + 20 }, { duration: 0.5, ease: ease.inOutSine });
        await this.ctx.tw.to(node.scale, { x: 0.5, y: 0.5 }, { duration: 0.5 });
        node.visible = false;
        this.endNeed();
        pet!.setMood('happy');
        pet!.cheer();
        if (value === 'hug') this.hearts(at.x, at.y);
        else this.ctx.particles.burst(at.x, at.y, { kind: 'star', colors: [swatch.yellow.fill], count: 18, speed: [120, 300] });
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
    if (this.plan.mode !== 'perspective' || this.question.friend === 1) this.clearProps();
    this.q++;
    if (this.q < this.questions.length) {
      void this.ask();
      return;
    }
    this.done = true;
    this.subject.clear();
    this.clearOptions();
    this.pet?.setMood('happy');
    this.pet?.cheer();
    this.friends.forEach((f) => { f.critter.setMood('happy'); f.critter.hop(0.6); });
    void this.ctx.say('feel.done');
    void this.ctx.tw.wait(1.5).then(() => this.ctx.finish({ misses: this.misses, hints: this.hints }));
  }

  // Needs and events --------------------------------------------------------

  private showNeed(need: Need, bowl = true) {
    const pet = this.pet!;
    pet.setMood(need === 'sleepy' ? 'sleepy' : 'sad');
    if (need === 'sad') sfx.sigh();
    if (need === 'sleepy') sfx.yawn();
    if (need === 'hungry') sfx.rumble();
    if (need === 'hungry' && bowl) {
      const bowl = new Graphics()
        .moveTo(-60, -40)
        .quadraticCurveTo(0, 30, 60, -40)
        .closePath()
        .fill(swatch.white.fill)
        .stroke({ width: 6, color: swatch.blue.line, join: 'round' });
      bowl.position.set(this.besidePet(100), pet.y);
      this.props.addChild(bowl);
    }
    if (need === 'cold') {
      this.shiver = 1;
      sfx.whoosh();
    }
  }

  private endNeed() {
    this.shiver = 0;
    if (this.pet) this.pet.x = this.petX;
  }

  /** A tap on a happening's prop wobbles it and plays its sound again; it is never an answer and never a miss. */
  private answers(node: Container, sound: () => void, radius = 70) {
    node.hitArea = new Circle(0, 0, radius);
    onTap(node, () => {
      if (node.destroyed) return;
      sound();
      this.wobbles.set(node, 0);
    });
  }

  private async playEvent(event: Happening) {
    const tw = this.ctx.tw;
    const x = this.plan.mode === 'perspective' ? this.view.w / 2 : this.besidePet(110);
    const y = this.pet?.y ?? this.view.h * 0.6;
    if (this.plan.mode !== 'perspective' || event !== 'rain') void this.ctx.say(`feel.event-${event}`);
    switch (event) {
      case 'drum': {
        const drum = eventPicture('drum');
        drum.position.set(this.view.w / 2, y - 80);
        this.front.addChild(drum);
        for (let i = 0; i < 3; i++) { sfx.knock(); drum.rotation = i % 2 ? -0.12 : 0.12; await tw.wait(0.35); }
        drum.rotation = 0;
        break;
      }
      case 'balloon': {
        const balloon = new Container();
        const string = new Graphics().moveTo(0, 46).quadraticCurveTo(-14, 110, 6, 170).stroke({ width: 3, color: swatch.white.line });
        balloon.addChild(string, prop('balloon', 'red'));
        balloon.position.set(this.besidePet(60), y - 300);
        this.answers(balloon, () => sfx.whoosh());
        this.front.addChild(balloon);
        await tw.wait(1.2);
        sfx.whoosh();
        await tw.to(balloon, { x: balloon.x + 160, y: -260 }, { duration: 2.2, ease: ease.inQuad });
        break;
      }
      case 'present': {
        const { node, lid } = present();
        node.position.set(x, y);
        node.scale.set(0);
        this.answers(node, () => sfx.pop(9));
        node.hitArea = new Circle(0, -60, 75);
        this.front.addChild(node);
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
        this.answers(node, () => sfx.boing());
        node.hitArea = new Circle(0, -60, 75);
        this.front.addChild(node);
        await tw.wait(1.2);
        head.visible = true;
        sfx.boing();
        const s = { top: -80 };
        const draw = () => { if (spring.destroyed) return; drawSpring(spring, s.top); head.y = s.top + 20; };
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
        this.answers(moon, () => sfx.bell(3, 0.25));
        this.front.addChild(moon);
        void tw.to(this.night, { alpha: 0.45 }, { duration: 1.5 });
        await tw.to(moon, { alpha: 1, y: 130 }, { duration: 1.5 });
        sfx.yawn();
        await tw.wait(1);
        break;
      }
      case 'rain': {
        // A cloud gathers over the window and drops patter on the glass.
        const cloud = windowCloud();
        cloud.position.set(this.window.x, this.window.y - 40);
        cloud.alpha = 0;
        const patter = () => sfx.tick();
        this.answers(cloud, patter);
        this.front.addChild(cloud);
        sfx.whoosh();
        await tw.to(cloud, { alpha: 1 }, { duration: 0.6 });
        for (let i = 0; i < 4 && !cloud.destroyed; i++) {
          patter();
          for (let d = 0; d < 3; d++) {
            this.ctx.particles.burst(cloud.x + this.ctx.rng.range(-70, 70), cloud.y + 40, { colors: [swatch.blue.fill], count: 1, speed: [80, 110], gravity: 500, angle: Math.PI / 2, spread: 0.1, size: [0.25, 0.35], life: [0.4, 0.5] });
          }
          await tw.wait(0.35);
        }
        await tw.wait(0.6);
        break;
      }
      case 'butterfly': {
        // A butterfly flutters in and lands on top of the pet's head, clear of the face she will read.
        const { node, wings } = butterfly();
        const land = this.headTop();
        node.position.set(this.view.w + 60, land.y - 160);
        const flap = { update: () => { wings.scale.x = 0.55 + 0.45 * Math.abs(Math.sin(this.clock * 14)); } };
        this.ctx.track(flap);
        this.answers(node, () => sfx.squeak(12), 60);
        this.front.addChild(node);
        await tw.to(node, { x: land.x, y: land.y - 10 }, { duration: 2, ease: ease.inOutSine });
        this.ctx.untrack(flap);
        if (!wings.destroyed) wings.scale.x = 1;
        sfx.squeak(12);
        await tw.wait(1);
        break;
      }
      case 'lullaby': {
        // Three soft notes fall down the scale and drift up beside the pet: one group, so a tap sings all three again.
        const at = this.headAt();
        const tune = new Container();
        tune.position.set(at.x + 170, at.y - 110);
        const sing = async () => {
          for (const step of [7, 5, 3]) {
            if (tune.destroyed) return;
            sfx.bell(step, 0.25);
            await tw.wait(0.3);
          }
        };
        this.answers(tune, () => void sing(), 0);
        tune.hitArea = new Rectangle(-90, -80, 180, 120);
        this.front.addChild(tune);
        for (const [i, step] of [7, 5, 3].entries()) {
          const note = musicNote(swatch.purple.fill);
          note.position.set((i - 1) * 50, 40);
          note.alpha = 0;
          tune.addChild(note);
          sfx.bell(step, 0.25);
          void tw.to(note, { alpha: 1, y: -30 }, { duration: 0.9, ease: ease.outQuad });
          await tw.wait(0.7);
        }
        await tw.wait(1);
        break;
      }
      case 'ball': {
        // A ball bounces in from the side and stops beside the pet.
        const ball = bouncyBall();
        ball.position.set(this.view.w + 50, y - 34);
        this.answers(ball, () => sfx.pop(10), 60);
        this.front.addChild(ball);
        const from = ball.x;
        const span = (from - x) / 3;
        for (let hop = 0; hop < 3; hop++) {
          const land = from - span * (hop + 1);
          void tw.to(ball, { x: land }, { duration: 0.5, ease: ease.linear });
          await tw.to(ball, { y: y - 34 - (120 - hop * 35) }, { duration: 0.25, ease: ease.outQuad });
          await tw.to(ball, { y: y - 34 }, { duration: 0.25, ease: ease.inQuad });
          sfx.pop(10 - hop);
        }
        await tw.wait(0.6);
        break;
      }
      case 'icecream': {
        // The scoop topples off the cone and lands on the floor.
        const { node, scoop } = iceCream();
        node.position.set(x, y);
        this.answers(node, () => sfx.squish());
        node.hitArea = new Circle(0, -150, 75);
        this.front.addChild(node);
        await tw.wait(1);
        void tw.to(scoop, { x: 60 }, { duration: 0.5 });
        await tw.to(scoop, { y: 190 }, { duration: 0.5, ease: ease.inQuad });
        sfx.squish();
        await tw.wait(0.8);
        break;
      }
      case 'snow': {
        // Snow starts at the window; the pet's shiver and the falling flakes come with the need.
        sfx.whoosh();
        for (let i = 0; i < 8; i++) {
          this.ctx.particles.burst(this.window.x + this.ctx.rng.range(-80, 80), this.window.y - 60, { colors: [swatch.white.fill], count: 1, speed: [20, 40], gravity: 40, angle: Math.PI / 2, spread: 0.4, life: [2, 3] });
        }
        await tw.wait(1.4);
        break;
      }
      case 'basket': {
        // The picnic basket opens, and there is nothing inside.
        const basket = emptyBasket();
        basket.position.set(x, y);
        basket.scale.set(0);
        this.answers(basket, () => sfx.knock());
        basket.hitArea = new Circle(0, -50, 75);
        this.front.addChild(basket);
        await tw.to(basket.scale, { x: 1, y: 1 }, { duration: 0.5, ease: ease.outBack });
        await tw.wait(0.4);
        sfx.knock();
        this.wobbles.set(basket, 0);
        await tw.wait(1);
        break;
      }
    }
  }

  private clearProps() {
    this.endNeed();
    this.wobbles.clear();
    for (const layer of [this.props, this.front]) {
      // A drifting rain cloud may still be fading; its tweens stop with it.
      layer.removeChildren().forEach((c) => {
        this.ctx.tw.kill(c);
        this.ctx.tw.kill(c.scale);
        c.destroy({ children: true });
      });
    }
    if (this.night.alpha > 0) void this.ctx.tw.to(this.night, { alpha: 0 }, { duration: 0.6 });
  }

  // Effects -----------------------------------------------------------------

  /** The big pet's head on the stage, for hearts and bursts. */
  private headAt(): { x: number; y: number } {
    const at = this.partAt('head');
    return { x: at.x, y: at.y + 20 * this.pet!.scale.y };
  }

  /** A face part of the big pet on the stage. */
  private partAt(part: 'head'): { x: number; y: number } {
    const pet = this.pet!;
    const p = pet.partPoints(part)[0] ?? { x: this.middle, y: -150 };
    return { x: pet.x + p.x * pet.scale.x, y: pet.y + p.y * pet.scale.y };
  }

  /** The highest of the big pet's face parts on the stage (an ear or the top of the head), above its nose. */
  private headTop(): { x: number; y: number } {
    const pet = this.pet!;
    const points = FACE_PARTS.flatMap((p) => pet.partPoints(p));
    const nose = pet.partPoints('nose')[0] ?? pet.partPoints('head')[0] ?? { x: this.middle, y: 0 };
    if (!points.length) return this.partAt('head');
    const top = Math.min(...points.map((p) => p.y));
    return { x: pet.x + nose.x * pet.scale.x, y: pet.y + top * pet.scale.y };
  }

  /** A stage x `gap` units right of the big pet, for props. */
  private besidePet(gap: number): number {
    const pet = this.pet!;
    return Math.min(this.view.w - 90, pet.x + this.edge * pet.scale.x + gap);
  }

  private hearts(x: number, y: number) {
    this.ctx.particles.burst(x, y, { kind: 'heart', colors: [swatch.pink.fill, swatch.red.fill], count: 16, speed: [120, 300], gravity: -60, size: [0.8, 1.3] });
  }

  private feelingBurst(feeling: Feeling) {
    if (!this.pet) return;
    const { x, y } = this.headAt();
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
    const rug = swatch[this.pet?.color === 'blue' ? 'green' : 'blue'];
    const g = this.background.clear().rect(0, 0, v.w, v.h).fill(cream);
    // A window, a floor, and a round rug for the pet to stand on.
    const wx = v.w * 0.12;
    const wy = Math.min(140, floor - 280);
    this.window = { x: wx + 95, y: wy + 75 };
    g.roundRect(wx, wy, 190, 150, 16).fill(swatch.blue.light).stroke({ width: 10, color: wood.fill });
    g.moveTo(wx + 95, wy).lineTo(wx + 95, wy + 150).moveTo(wx, wy + 75).lineTo(wx + 190, wy + 75).stroke({ width: 8, color: wood.fill });
    g.rect(0, floor - 40, v.w, v.h - floor + 40).fill(wood.light).rect(0, floor - 44, v.w, 8).fill(wood.fill);
    g.ellipse(v.w / 2, floor + 5, 190, 38).fill(rug.light).stroke({ width: 6, color: rug.fill });
    this.night.clear().rect(0, 0, v.w, v.h).fill(swatch.purple.line);
    if (this.pet) {
      const s = PET_SCALE * this.grow;
      this.pet.scale.set(s);
      this.petX = v.w / 2 - this.middle * s;
      this.pet.position.set(this.petX, floor);
    }

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
    const fx = this.plan.mode === 'perspective' ? [v.w / 2 - 215, v.w / 2 + 215] : spread(this.friends.length, 160, v.w - 40, 215);
    this.friends.forEach((f, i) => f.critter.position.set(fx[i], this.plan.mode === 'perspective' ? floor : v.h * 0.68));
    this.subject.clear();
    if (this.plan.mode === 'perspective' && !this.done && this.question) {
      const f = this.friends[this.question.friend!].critter;
      this.subject.ellipse(f.x, f.y + 12, 105, 20).stroke({ width: 7, color: swatch.blue.line });
    }
    if (this.plan.mode === 'clue' && this.front.children[0]) this.front.children[0].position.set(this.besidePet(100), floor);
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
    for (const [node, t] of this.wobbles) {
      const left = 0.5 - t - dt;
      if (node.destroyed || left <= 0) {
        if (!node.destroyed) node.rotation = 0;
        this.wobbles.delete(node);
      } else {
        node.rotation = Math.sin((t + dt) * 30) * 0.22 * (left / 0.5);
        this.wobbles.set(node, t + dt);
      }
    }
    if (this.shiver && this.pet) {
      this.pet.x = this.petX + Math.sin(this.clock * 40) * 4;
      this.snowIn -= dt;
      if (this.snowIn <= 0) {
        this.snowIn = 0.12;
        this.ctx.particles.burst(this.ctx.rng.range(this.view.w * 0.3, this.view.w * 0.7), 40, { colors: [swatch.white.fill], count: 1, speed: [30, 60], gravity: 60, angle: Math.PI / 2, spread: 0.4, life: [4, 5] });
      }
    }
  }

  /**
   * The ghost finger: in free play a feeling bubble the pet has not shown yet; in a question the face, helper or friend
   * that answers it, once the options are dealt.
   */
  autotouch(): TouchIntent | null {
    if (this.done) return null;
    if (this.plan.mode === 'poke') {
      const t = this.pet?.touch;
      return this.pet && t ? { tap: { on: this.pet, x: t.x, y: t.y } } : null;
    }
    if (this.plan.mode === 'play') {
      const bubble = this.options.find((o) => o.value === bubbleToTap(this.tried, this.taps));
      return bubble ? { tap: { on: bubble.node } } : null;
    }
    if (this.busy || !this.question) return null;
    const at = choiceToTap(this.question);
    if (this.plan.mode === 'friends') {
      const friend = this.friends[at];
      return friend ? { tap: { on: friend.critter, x: 0, y: -150 } } : null;
    }
    const option = this.options[at];
    return option ? { tap: { on: option.node } } : null;
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
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: [9],
  describeLevel: (l) => feelingPlan(l).name,
  music: STYLES.paint,
  coplayHint: 'Make the same face as the pet with {name}, and name the feeling together.',
  offScreen: 'Make happy, sad, sleepy and surprised faces in a mirror together, and talk about what makes each one happen.',
  hubIcon: () => {
    // Two feeling balloons tied to a little post: happy and sad.
    const c = new Container();
    const stand = new Graphics().roundRect(-8, -50, 16, 50, 5).fill(wood.fill).stroke({ width: 4, color: wood.line }).ellipse(0, 0, 50, 10).fill(wood.line);
    const strings = new Graphics();
    c.addChild(strings, stand);
    for (const [feeling, x, y] of [['happy', -46, -128], ['sad', 48, -112]] as const) {
      strings.moveTo(0, -48).quadraticCurveTo(x * 0.3, (y - 48) / 2, x, y + 46).stroke({ width: 3, color: swatch.white.line });
      const { node, critter } = feelingBubble(makeStar(), feeling);
      critter.update(0);
      critter.alive = false;
      node.scale.set(0.62);
      node.position.set(x, y);
      c.addChild(node);
    }
    return new WigglyIcon(c);
  },
  touchDemo: true,
  sticker: (seed) => feelingsSticker(seed),
  create: (ctx) => new FeelingsFaces(ctx),
};
