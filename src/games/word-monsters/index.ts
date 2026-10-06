import { Circle, Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, ink, swatch, wood, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { puffs } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import type { LineId } from '../../content/voice-script';
import type { Band } from '../../progress/bands';
import { label } from '../../ui/text';
import { letterPicture } from '../letter-trails/pictures';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { fits, FIRST_WORDS, makeQuestions, planFor, sounded, SOUNDS, type MonsterPlan, type Question } from './logic';

const LEVELS: Record<Band, { min: number; max: number }> = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 5 },
  prek: { min: 3, max: 6 },
};

const FURS: ColorName[] = ['purple', 'teal', 'orange', 'pink', 'blue', 'green', 'red', 'yellow'];
const BODY_R = 62;

const soundLine = (letter: string) => `sound.${letter}` as LineId;

/** A round furry monster wearing its letter on its tummy. */
class Monster extends Container {
  readonly body = new Container();
  readonly glow = new Graphics();
  private readonly mouth = new Graphics();
  private clock = Math.random() * 6;
  private talk = 0;
  drag: DragHandle | null = null;
  placed = false;
  slot = -1;

  constructor(
    readonly letter: string,
    both: boolean,
    color: ColorName = FURS[letter.charCodeAt(0) % FURS.length],
  ) {
    super();
    const fur = swatch[color];
    const tufts: [number, number, number][] = [[0, 0, BODY_R]];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      tufts.push([Math.cos(a) * BODY_R * 0.82, Math.sin(a) * BODY_R * 0.82, BODY_R * 0.3]);
    }
    const g = puffs(new Graphics(), tufts, fur.fill, fur.line, 6);
    for (const side of [-1, 1]) g.ellipse(side * 26, BODY_R + 4, 16, 9).fill(fur.line);
    g.circle(0, 12, 40).fill(cream);
    for (const side of [-1, 1]) {
      g.circle(side * 22, -42, 15).fill(0xffffff).stroke({ width: 3, color: fur.line });
      g.circle(side * 22 + 3, -40, 7).fill(ink);
    }
    const text = label(both ? letter.toUpperCase() + letter : letter, both ? 46 : 62, ink);
    text.position.set(0, 10);
    this.glow.circle(0, 0, BODY_R + 26).fill({ color: 0xfff3a0, alpha: 0.85 });
    this.glow.visible = false;
    this.body.addChild(g, this.mouth, text);
    this.addChild(this.glow, this.body);
    this.hitArea = new Circle(0, 0, BODY_R + 24);
    this.drawMouth();
  }

  speak() {
    this.talk = 0.6;
    this.body.scale.set(1.12, 0.9);
  }

  update(dt: number) {
    this.clock += dt;
    this.talk = Math.max(0, this.talk - dt);
    const k = Math.min(1, dt * 10);
    this.body.scale.x += (1 - this.body.scale.x) * k;
    this.body.scale.y += (1 - this.body.scale.y) * k;
    this.body.rotation = 0.05 * Math.sin(this.clock * 2) + (this.talk > 0 ? 0.12 * Math.sin(this.clock * 30) : 0);
    if (this.glow.visible) this.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 7);
    this.drawMouth();
  }

  private drawMouth() {
    const m = this.mouth.clear();
    if (this.talk > 0) m.ellipse(0, -18, 12, 8 + 5 * Math.abs(Math.sin(this.clock * 18))).fill(0x7a2e3e);
    else m.moveTo(-10, -20).quadraticCurveTo(0, -12, 10, -20).stroke({ width: 4, color: ink, cap: 'round' });
  }
}

/** Pictures for the build-a-word words. */
function wordPicture(word: string): Container {
  const c = new Container();
  const line = (color: number, width = 6) => ({ width, color, cap: 'round' as const, join: 'round' as const });
  if (word === 'cat' || word === 'dog' || word === 'pig') {
    const critter = new Critter(CRITTERS[word]);
    critter.y = 110;
    c.addChild(critter);
    return c;
  }
  if (word === 'sun') return letterPicture('S');
  const g = new Graphics();
  if (word === 'cup') {
    g.moveTo(-70, -60).lineTo(70, -60).lineTo(55, 70).lineTo(-55, 70).closePath().fill(swatch.blue.fill).stroke(line(swatch.blue.line));
    g.moveTo(70, -30).bezierCurveTo(125, -30, 125, 40, 62, 40).stroke(line(swatch.blue.line, 12));
    for (const x of [-25, 5, 35]) g.moveTo(x, -80).quadraticCurveTo(x + 14, -100, x, -120).stroke(line(0xb9c6d1, 5));
  } else if (word === 'hat') {
    g.ellipse(0, 50, 130, 30).fill(swatch.purple.fill).stroke(line(swatch.purple.line));
    g.roundRect(-70, -80, 140, 130, 18).fill(swatch.purple.fill).stroke(line(swatch.purple.line));
    g.rect(-70, 10, 140, 26).fill(swatch.yellow.fill);
  } else {
    g.roundRect(-100, -60, 200, 130, 10).fill(wood.light).stroke(line(wood.line));
    g.poly([-100, -60, -60, -110, 140, -110, 100, -60]).fill(wood.fill).stroke(line(wood.line));
    g.moveTo(-100, 5).lineTo(100, 5).stroke(line(wood.line, 4));
  }
  c.addChild(g);
  return c;
}

class WordMonsters implements Game {
  readonly plan: MonsterPlan;
  readonly questions: Question[];
  monsters: Monster[] = [];
  index = -1;
  filled = 0;
  taps = 0;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly top = new Container();
  private readonly slots = new Graphics();
  private readonly slotLetters = new Container();
  private readonly crowd = new Container();
  private picture: Container | null = null;
  private view: View;
  private wrongs = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.questions = makeQuestions(this.plan, ctx.rng);
    this.backdrop = new Backdrop({ sky: [0xc9b8f0, 0xf3ecff], hills: [0xc8ecb0, 0xa6de8e], horizon: 0.66, clouds: 3, seed: 26 }, ctx.view);
    this.top.addChild(this.slots, this.slotLetters);
    ctx.stage.addChild(this.backdrop, this.top, this.crowd);
  }

  get question(): Question | undefined {
    return this.questions[this.index];
  }

  private get building() {
    return this.plan.mode === 'build' || this.plan.mode === 'spell';
  }

  start() {
    if (this.plan.mode === 'play') {
      this.setMonsters(this.questions[0].monsters, true);
      this.busy = false;
      void this.ctx.instruct('monster.play');
      return;
    }
    void this.next();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.top.position.set(v.w / 2, v.h * 0.3);
    this.layoutMonsters();
  }

  private layoutMonsters() {
    const v = this.view;
    for (const m of this.monsters) if (m.placed) m.position.copyFrom(this.slotAt(m.slot));
    const loose = this.monsters.filter((m) => !m.placed);
    const xs = spread(loose.length, 150, v.w - 40, 190);
    loose.forEach((m, i) => {
      m.position.set(xs[i], v.h - 130 + (i % 2 ? 18 : -10));
      if (m.drag) m.drag.home = { x: m.x, y: m.y };
    });
  }

  update() {}

  destroy() {
    for (const m of this.monsters) m.drag?.destroy();
  }

  private setMonsters(letters: string[], both: boolean) {
    for (const m of this.monsters) {
      m.drag?.destroy();
      this.ctx.untrack(m);
      m.destroy({ children: true });
    }
    // Neighbors always wear different colors, so color never gives away (or confuses) a letter.
    const shift = this.ctx.rng.int(0, FURS.length - 1);
    this.monsters = letters.map((letter, i) => {
      const m = new Monster(letter, both, FURS[(i + shift) % FURS.length]);
      this.ctx.track(m);
      this.crowd.addChild(m);
      if (this.building) {
        m.drag = draggable(m, this.ctx.tw, { onPick: () => this.pick(m), onDrop: (x, y) => this.drop(m, x, y) });
      } else {
        onTap(m, () => void this.tap(m), { cooldown: 400 });
      }
      return m;
    });
    this.layoutMonsters();
    this.monsters.forEach((m, i) => {
      m.scale.set(0);
      void this.ctx.tw.to(m.scale, { x: 1, y: 1 }, { duration: 0.35, delay: i * 0.08, ease: ease.outBack });
    });
  }

  private showPicture(p: Container | null, scale = 0.62, y = -10) {
    if (this.picture) {
      const old = this.picture;
      void this.ctx.tw.to(old.scale, { x: 0, y: 0 }, { duration: 0.2 }).then(() => old.destroy({ children: true }));
    }
    this.picture = p;
    if (!p) return;
    p.y = y;
    p.scale.set(0);
    this.top.addChild(p);
    void this.ctx.tw.to(p.scale, { x: scale, y: scale }, { duration: 0.4, ease: ease.outBack });
  }

  // Questions ----------------------------------------------------------------------------

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.filled = 0;
    const q = this.question;
    if (!q) return void this.end();
    this.slots.clear();
    this.slotLetters.removeChildren().forEach((c) => c.destroy());
    if (this.building) {
      this.showPicture(wordPicture(q.answer), 0.5, -110);
      this.drawSlots(q.answer);
    } else if (this.plan.mode === 'first') {
      this.showPicture(letterPicture(q.answer.toUpperCase()), 0.62);
    } else {
      this.showPicture(null);
    }
    this.setMonsters(q.monsters, this.plan.mode === 'find');
    await this.ctx.tw.wait(0.4);
    this.busy = false;
    await this.ask(q);
  }

  private ask(q: Question) {
    const sound = SOUNDS[q.answer];
    switch (this.plan.mode) {
      case 'find':
        return this.ctx.instruct('monster.find', { letter: q.answer.toUpperCase() });
      case 'who':
        return this.ctx.instruct('monster.who', { sound });
      case 'first':
        return this.ctx.instruct('monster.first', { word: FIRST_WORDS[q.answer], sound });
      default:
        return this.ctx.instruct('monster.build', { word: q.answer, sounds: sounded(q.answer) });
    }
  }

  private async tap(m: Monster) {
    if (this.busy || this.finished) return;
    m.speak();
    sfx.pop(4 + (m.letter.charCodeAt(0) % 6));
    if (this.plan.mode === 'play') {
      this.taps++;
      this.showPicture(FIRST_WORDS[m.letter] ? letterPicture(m.letter.toUpperCase()) : null, 0.55);
      await this.ctx.say(soundLine(m.letter));
      if (this.taps >= this.plan.rounds && !this.finished) void this.end();
      return;
    }
    const q = this.question!;
    if (m.letter === q.answer) {
      this.busy = true;
      m.glow.visible = false;
      sfx.sparkle();
      this.ctx.particles.burst(m.x, m.y - 40, { kind: 'star', colors: [0xffffff, 0xfff3a0], count: 14, speed: [100, 260], gravity: 0, life: [0.5, 0.9] });
      await this.ctx.say(soundLine(m.letter));
      await this.ctx.say('praise');
      await this.next();
      return;
    }
    this.wrong(m);
  }

  private wrong(m: Monster) {
    this.misses++;
    this.wrongs++;
    sfx.boing();
    void this.ctx.say('monster.iam', { letter: m.letter.toUpperCase(), sound: SOUNDS[m.letter] });
    if (this.wrongs >= 2) this.hint();
  }

  private hint() {
    const q = this.question;
    if (!q) return;
    const want = this.building ? q.answer[this.filled] : q.answer;
    const right = this.monsters.find((x) => !x.placed && x.letter === want);
    if (right && !right.glow.visible) {
      right.glow.visible = true;
      this.hints++;
    }
    this.wrongs = 0;
  }

  // Building words ---------------------------------------------------------------------

  private slotX(i: number) {
    return (i - 1) * 150;
  }

  /** Slot `i`'s middle, in stage units. */
  private slotAt(i: number) {
    return { x: this.top.x + this.slotX(i), y: this.top.y + 106 };
  }

  private drawSlots(word: string) {
    const g = this.slots.clear();
    for (let i = 0; i < word.length; i++) {
      g.roundRect(this.slotX(i) - 66, 40, 132, 132, 26).fill({ color: 0xffffff, alpha: 0.7 }).stroke({ width: 5, color: swatch.purple.line });
      if (this.plan.mode === 'build') {
        const t = label(word[i], 70, swatch.purple.light);
        t.position.set(this.slotX(i), 106);
        this.slotLetters.addChild(t);
      }
    }
  }

  private pick(m: Monster) {
    m.speak();
    void this.ctx.say(soundLine(m.letter));
  }

  private drop(m: Monster, x: number, y: number): boolean {
    const q = this.question;
    if (!q || this.busy) return false;
    // The crowd layer sits on the stage untransformed, so (x, y) are stage units.
    const slot = this.slotAt(this.filled);
    // Generous: anywhere over the slot row counts as trying the next slot.
    if (Math.abs(y - slot.y) > 140 || Math.abs(x - this.top.x) > 280) return false;
    if (!fits(q.answer, this.filled, m.letter)) {
      this.misses++;
      this.wrongs++;
      sfx.boing();
      void this.ctx.say('monster.next', { sound: SOUNDS[q.answer[this.filled]] });
      if (this.wrongs >= 2) this.hint();
      return false;
    }
    m.placed = true;
    m.slot = this.filled;
    m.glow.visible = false;
    if (m.drag) m.drag.enabled = false;
    void this.ctx.tw.to(m, { x: slot.x, y: slot.y }, { duration: 0.25, ease: ease.outBack });
    m.scale.set(1);
    sfx.squish();
    this.filled++;
    if (this.filled >= q.answer.length) void this.wordDone(q);
    return true;
  }

  private async wordDone(q: Question) {
    this.busy = true;
    const placed = q.answer.split('').map((l) => this.monsters.find((m) => m.placed && m.letter === l)!);
    for (const m of placed) {
      m.speak();
      await this.ctx.say(soundLine(m.letter));
    }
    await this.ctx.say('monster.blend', { word: q.answer });
    // The word comes alive.
    const p = this.picture;
    if (p) {
      const s = p.scale.x;
      for (let i = 0; i < 2; i++) {
        await this.ctx.tw.to(p, { y: p.y - 40 }, { duration: 0.18, ease: ease.outQuad });
        await this.ctx.tw.to(p, { y: p.y + 40 }, { duration: 0.18, ease: ease.inQuad });
      }
      p.scale.set(s);
      for (const c of p.children) if (c instanceof Critter) c.cheer();
    }
    sfx.tada();
    this.ctx.particles.burst(this.view.w / 2, this.view.h * 0.3, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.purple.light], count: 24, speed: [150, 360], gravity: 0, life: [0.7, 1.1] });
    await this.ctx.tw.wait(0.6);
    await this.next();
  }

  private async end() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    this.ctx.pet.cheer();
    await this.ctx.say('monster.done');
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class MonstersIcon extends WigglyIcon {
  private readonly pair: Monster[];
  constructor() {
    const c = new Container();
    const a = new Monster('a', false);
    const b = new Monster('b', false);
    a.position.set(-60, -80);
    b.position.set(60, -70);
    b.scale.set(0.85);
    c.addChild(a, b);
    super(c);
    this.pair = [a, b];
  }
  update(dt: number) {
    super.update(dt);
    for (const m of this.pair) m.update(dt);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const m = new Monster(rng.pick('abcdefghjkmnoprstuwz'.split('')), false);
  m.y = -10;
  c.addChild(m);
  return c;
}

export const wordMonsters: GameModule = {
  id: 'word-monsters',
  name: 'Word Monsters',
  titleLine: 'game.word-monsters',
  region: 'story-grove',
  skills: ['letter-sounds', 'phonics', 'vocabulary'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => LEVELS[band],
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'Make each monster\'s sound together, slowly: "mmm", "sss", then blend them into a word.',
  offScreen: 'Play I-spy with sounds: "I spy something that starts with sss."',
  hubIcon: () => new MonstersIcon(),
  sticker,
  create: (ctx) => new WordMonsters(ctx),
};
