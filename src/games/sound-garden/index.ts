import { Circle, Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { flower, puffs } from '../../art/shapes';
import { audio } from '../../audio/engine';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { LineId } from '../../content/voice-script';
import type { Band } from '../../progress/bands';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { CHOICES, GAP_SECONDS, judgeEcho, makeQuestions, makeRhythms, planFor, tune, type Answer, type Gap, type GardenPlan, type Question } from './logic';

const LEVELS: Record<Band, { min: number; max: number }> = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 6 },
};

type Kind = 'bird' | 'frog' | 'bunny' | 'turtle' | 'up' | 'down' | 'bell' | 'woodpecker' | 'drum';

const line = (color: number, width = 6) => ({ width, color, cap: 'round' as const, join: 'round' as const });

/** The garden's singers and the answer pictures, all code-drawn. */
function art(kind: Kind): Container {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  switch (kind) {
    case 'bird':
    case 'woodpecker': {
      const body = kind === 'bird' ? swatch.blue : swatch.brown;
      g.ellipse(0, 0, 58, 50).fill(body.fill).stroke(line(body.line));
      g.ellipse(-14, 8, 30, 20).fill(body.light).stroke(line(body.line, 4));
      g.poly([50, -6, 84, 4, 50, 14]).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 4));
      g.circle(26, -14, 9).fill(0xffffff).circle(28, -14, 5).fill(ink);
      if (kind === 'woodpecker') g.moveTo(-10, -48).quadraticCurveTo(10, -76, 30, -44).fill(swatch.red.fill).stroke(line(swatch.red.line, 4));
      g.moveTo(-10, 48).lineTo(-14, 66).moveTo(10, 48).lineTo(12, 66).stroke(line(swatch.orange.line, 5));
      break;
    }
    case 'frog':
      g.ellipse(0, 20, 78, 52).fill(swatch.green.fill).stroke(line(swatch.green.line));
      for (const s of [-1, 1]) g.circle(s * 34, -26, 24).fill(swatch.green.fill).stroke(line(swatch.green.line)).circle(s * 34, -26, 12).fill(0xffffff).circle(s * 34, -24, 7).fill(ink);
      g.moveTo(-36, 26).quadraticCurveTo(0, 50, 36, 26).stroke(line(swatch.green.line, 5));
      break;
    case 'bunny': {
      const b = new Critter(CRITTERS.bunny);
      b.scale.set(0.46);
      b.y = 60;
      c.addChild(b);
      break;
    }
    case 'turtle':
      for (const x of [-46, 46]) g.ellipse(x, 40, 16, 12).fill(swatch.green.light).stroke(line(swatch.green.line, 4));
      g.ellipse(70, 10, 24, 20).fill(swatch.green.light).stroke(line(swatch.green.line, 4)).circle(78, 4, 5).fill(ink);
      g.moveTo(-70, 34).bezierCurveTo(-70, -60, 70, -60, 70, 34).closePath().fill(swatch.brown.fill).stroke(line(swatch.brown.line));
      for (const [x, y] of [[-30, 0], [0, -24], [30, 0], [0, 18]]) g.circle(x, y, 14).fill(swatch.brown.light);
      break;
    case 'up':
    case 'down': {
      const up = kind === 'up';
      const pts: number[] = [];
      for (let i = 0; i < 4; i++) {
        const x = -80 + i * 40;
        const y = up ? 50 - i * 30 : -40 + i * 30;
        pts.push(x, y, x + 40, y);
      }
      g.moveTo(-80, 60).lineTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
      g.lineTo(80, 60).closePath().fill(up ? swatch.yellow.light : swatch.pink.light).stroke(line(up ? swatch.yellow.line : swatch.pink.line));
      // A big arrow says which way.
      const ay = up ? -70 : -70;
      const dir = up ? -1 : 1;
      g.moveTo(-40, ay - dir * 20).lineTo(40, ay + dir * 20).stroke(line(ink, 8));
      g.poly(up ? [40, ay - 22, 52, ay - 18, 42, ay - 6] : [40, ay + 22, 52, ay + 18, 42, ay + 6]).fill(ink).stroke(line(ink, 6));
      break;
    }
    case 'bell':
      g.moveTo(0, 40).lineTo(0, 80).stroke(line(swatch.green.line, 8));
      g.moveTo(-50, 40).bezierCurveTo(-50, -60, 50, -60, 50, 40).quadraticCurveTo(0, 20, -50, 40).closePath().fill(swatch.purple.fill).stroke(line(swatch.purple.line));
      g.circle(0, 44, 10).fill(swatch.yellow.fill);
      break;
    case 'drum':
      g.roundRect(-34, 0, 68, 90, 20).fill(0xfff4e3).stroke(line(wood.line));
      g.moveTo(-110, 10).bezierCurveTo(-110, -100, 110, -100, 110, 10).quadraticCurveTo(0, 30, -110, 10).closePath().fill(swatch.red.fill).stroke(line(swatch.red.line));
      for (const [x, y, r] of [[-50, -30, 14], [10, -50, 12], [55, -22, 16], [-10, -10, 9]]) g.circle(x, y, r).fill(0xffffff);
      break;
  }
  return c;
}

/** A big answer tile with a picture on it. */
class Tile extends Container {
  readonly glow = new Graphics();
  readonly picture = new Container();
  answer: Answer = 'high';
  constructor(onPick: () => void) {
    super();
    this.glow.circle(0, 0, 150).fill({ color: 0xfff3a0, alpha: 0.85 });
    this.glow.visible = false;
    const card = new Graphics().circle(0, 0, 124).fill({ color: 0xffffff, alpha: 0.9 }).stroke({ width: 6, color: 0xb9c6d1 });
    this.addChild(this.glow, card, this.picture);
    onTap(this, onPick, { radius: 130, cooldown: 400 });
  }
  show(answer: Answer, kind: Kind) {
    this.answer = answer;
    this.picture.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.picture.addChild(art(kind));
  }
}

const PICTURE: Record<Answer, Kind> = { high: 'bird', low: 'frog', fast: 'bunny', slow: 'turtle', up: 'up', down: 'down' };

class SoundGarden implements Game {
  readonly plan: GardenPlan;
  readonly questions: Question[];
  readonly rhythms: Gap[][];
  readonly tiles: Tile[];
  readonly singers: { kind: Kind; node: Container; taps: number }[] = [];
  readonly bush = new Container();
  readonly drum: Container;
  readonly woodpecker: Container;
  index = -1;
  taps: number[] = [];
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  played = 0;

  private readonly backdrop: Backdrop;
  private readonly rhythmHint = new Graphics();
  private view: View;
  private wrongs = 0;
  private clock = 0;
  private wiggle = 0;
  private echoTimer = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.questions = makeQuestions(this.plan, ctx.rng);
    this.rhythms = this.plan.mode === 'echo' ? makeRhythms(this.plan.rounds, ctx.rng) : [];
    this.backdrop = new Backdrop({ sky: [0xbfe6fb, 0xf2fbff], hills: [0xc8ecb0, 0xa6de8e], horizon: 0.55, clouds: 3, sun: true, seed: 17 }, ctx.view);
    ctx.stage.addChild(this.backdrop);

    // The singing bush: tap it to hear the sound again.
    const bushArt = puffs(new Graphics(), [[-70, 10, 60], [0, -20, 75], [70, 10, 60], [-30, 40, 55], [40, 40, 55]], 0x7cc463, 0x4a9a35, 6);
    this.bush.addChild(bushArt);
    for (const [x, y, c] of [[-60, -10, 'pink'], [20, -50, 'yellow'], [60, 20, 'purple'], [-10, 30, 'blue']] as const) {
      const f = flower(new Graphics(), 16, swatch[c].fill, swatch[c].line);
      f.position.set(x, y);
      this.bush.addChild(f);
    }
    onTap(this.bush, () => void this.replay(), { radius: 130, cooldown: 600 });
    this.bush.visible = this.plan.mode !== 'play' && this.plan.mode !== 'echo';
    ctx.stage.addChild(this.bush);

    this.tiles = [0, 1].map((i) => new Tile(() => void this.pick(i)));
    for (const t of this.tiles) {
      t.visible = this.questions.length > 0;
      ctx.stage.addChild(t);
    }

    this.woodpecker = new Container();
    const trunk = new Graphics().roundRect(-40, -260, 80, 360, 20).fill(wood.fill).stroke({ width: 6, color: wood.line });
    const bird = art('woodpecker');
    bird.position.set(70, -120);
    bird.scale.set(-0.8, 0.8);
    this.woodpecker.addChild(trunk, bird);
    onTap(this.woodpecker, () => void this.replay(), { radius: 140, cooldown: 600 });
    this.drum = art('drum');
    this.drum.hitArea = new Circle(0, -10, 150);
    this.drum.eventMode = 'static';
    this.drum.on('pointerdown', () => this.drumTap());
    const echo = this.plan.mode === 'echo';
    this.woodpecker.visible = echo;
    this.drum.visible = echo;
    ctx.stage.addChild(this.woodpecker, this.drum, this.rhythmHint);

    if (this.plan.mode === 'play') {
      for (const kind of ['bird', 'frog', 'bunny', 'bell', 'woodpecker'] as Kind[]) {
        const node = art(kind);
        const s = { kind, node, taps: 0 };
        node.hitArea = new Circle(0, 0, 100);
        onTap(node, () => this.sing(s), { cooldown: 250 });
        this.singers.push(s);
        ctx.stage.addChild(node);
      }
    }
  }

  get question(): Question | undefined {
    return this.questions[this.index];
  }

  start() {
    if (this.plan.mode === 'play') {
      this.busy = false;
      void this.ctx.instruct('sg.play');
      return;
    }
    void this.next();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.bush.position.set(v.w / 2, v.h * 0.27);
    this.placeTiles();
    this.woodpecker.position.set(v.w * 0.3, v.h - 90);
    this.drum.position.set(v.w * 0.64, v.h - 200);
    this.singers.forEach((s, i) => s.node.position.set(200 + ((v.w - 300) * i) / (this.singers.length - 1), v.h * (i % 2 ? 0.72 : 0.5)));
  }

  private placeTiles() {
    const v = this.view;
    const high = this.question?.ask === 'highlow';
    // High things sit higher and low things lower, so place matches pitch.
    this.tiles[0].position.set(v.w * 0.33, v.h * 0.68 - (high ? 40 : 0));
    this.tiles[1].position.set(v.w * 0.67, v.h * 0.68 + (high ? 40 : 0));
  }

  update(dt: number) {
    this.clock += dt;
    this.wiggle = Math.max(0, this.wiggle - dt);
    this.bush.rotation = this.wiggle > 0 ? 0.06 * Math.sin(this.clock * 30) : 0;
    for (const t of this.tiles) if (t.glow.visible) t.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 7);
    // Echo: once the taps stop, see if they matched.
    if (this.plan.mode === 'echo' && this.taps.length && !this.busy) {
      this.echoTimer += dt;
      const want = this.rhythms[this.index]?.length + 1;
      if (this.echoTimer > (this.taps.length >= want ? 0.9 : 2.2)) void this.judge();
    }
  }

  destroy() {
    this.drum.removeAllListeners();
  }

  // Free play -----------------------------------------------------------------------------

  private sing(s: { kind: Kind; node: Container; taps: number }) {
    if (this.finished) return;
    s.taps++;
    this.played++;
    const steps = [5, 7, 9, 7, 10];
    switch (s.kind) {
      case 'bird':
        sfx.chirp(10 + (s.taps % 4));
        break;
      case 'frog':
        sfx.croak();
        break;
      case 'bunny':
        sfx.drum();
        break;
      case 'bell':
        sfx.bell(steps[s.taps % steps.length], 0.35);
        break;
      default:
        sfx.knock();
    }
    void this.ctx.tw.to(s.node.scale, { x: 1.15, y: 0.88 }, { duration: 0.08 }).then(() => this.ctx.tw.to(s.node.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack }));
    this.ctx.particles.burst(s.node.x, s.node.y - 60, { kind: 'star', colors: [0xffffff, 0xfff3a0], count: 4, speed: [40, 120], gravity: -40, size: [0.3, 0.45] });
    if (this.played >= this.plan.rounds) void this.finale();
  }

  // Listening questions -------------------------------------------------------------------

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    for (const t of this.tiles) t.glow.visible = false;
    this.rhythmHint.clear();
    if (this.plan.mode === 'echo') {
      if (!this.rhythms[this.index]) return void this.finale();
      if (this.index === 0) await this.ctx.instruct('sg.echo');
      await this.ctx.tw.wait(0.3);
      await this.playSound();
      this.taps = [];
      this.busy = false;
      return;
    }
    const q = this.question;
    if (!q) return void this.finale();
    const [a, b] = CHOICES[q.ask];
    this.tiles[0].show(a, PICTURE[a]);
    this.tiles[1].show(b, PICTURE[b]);
    this.placeTiles();
    for (const t of this.tiles) {
      t.scale.set(0);
      void this.ctx.tw.to(t.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
    }
    await this.ctx.instruct(`sg.${q.ask}` as LineId);
    await this.playSound();
    this.busy = false;
  }

  /** The bush (or woodpecker) plays the sound for this question, with the music turned down. */
  private async playSound() {
    audio.duck(true);
    await this.sound();
    audio.duck(false);
  }

  private async sound() {
    const tw = this.ctx.tw;
    if (this.plan.mode === 'echo') {
      const r = this.rhythms[this.index];
      this.wiggle = 0;
      const bird = this.woodpecker.children[1];
      for (let i = 0; i <= r.length; i++) {
        sfx.knock();
        void tw.to(bird, { rotation: -0.3 }, { duration: 0.05 }).then(() => tw.to(bird, { rotation: 0 }, { duration: 0.1 }));
        if (i < r.length) await tw.wait(GAP_SECONDS[r[i]]);
      }
      return;
    }
    const q = this.question!;
    this.wiggle = 1.4;
    if (q.ask === 'highlow') {
      const step = q.answer === 'high' ? 12 : -4;
      for (let i = 0; i < 3; i++) {
        sfx.marimba(step, 0.5);
        await tw.wait(0.38);
      }
    } else if (q.ask === 'fastslow') {
      const fast = q.answer === 'fast';
      for (let i = 0; i < (fast ? 8 : 3); i++) {
        sfx.drum();
        await tw.wait(fast ? 0.16 : 0.62);
      }
    } else {
      for (const step of tune(q.answer as 'up' | 'down')) {
        sfx.marimba(step, 0.5);
        await tw.wait(0.34);
      }
    }
  }

  private async replay() {
    if (this.busy || this.finished || this.index < 0) return;
    this.busy = true;
    await this.playSound();
    this.taps = [];
    this.busy = false;
  }

  private async pick(i: number) {
    const q = this.question;
    if (!q || this.busy || this.finished) return;
    const tile = this.tiles[i];
    if (tile.answer === q.answer) {
      this.busy = true;
      void this.ctx.tw.to(tile.scale, { x: 1.15, y: 1.15 }, { duration: 0.12 }).then(() => this.ctx.tw.to(tile.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack }));
      sfx.sparkle();
      this.ctx.particles.burst(tile.x, tile.y - 40, { kind: 'star', colors: [0xffffff, 0xfff3a0], count: 14, speed: [100, 260], gravity: 0, life: [0.5, 0.9] });
      await this.ctx.say(`sg.${q.answer}` as LineId);
      await this.ctx.say('praise');
      await this.next();
      return;
    }
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    if (this.wrongs >= 2) this.hint();
    await this.ctx.say('sg.again');
    await this.playSound();
    this.busy = false;
  }

  private hint() {
    if (this.plan.mode === 'echo') {
      // Dots spaced like the rhythm, over the drum.
      const r = this.rhythms[this.index];
      const g = this.rhythmHint.clear();
      let x = 0;
      const xs = [0, ...r.map((gap) => (x += gap === 'L' ? 90 : 45))];
      const left = this.drum.x - x / 2;
      for (const dx of xs) g.circle(left + dx, this.drum.y - 150, 16).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line });
    } else {
      const right = this.tiles.find((t) => t.answer === this.question?.answer);
      if (right) right.glow.visible = true;
    }
    this.hints++;
    this.wrongs = 0;
  }

  // Echo ----------------------------------------------------------------------------------

  private drumTap() {
    if (this.plan.mode !== 'echo' || this.busy || this.finished) return;
    this.taps.push(this.clock);
    this.echoTimer = 0;
    sfx.drum();
    void this.ctx.tw.to(this.drum.scale, { x: 1.08, y: 0.92 }, { duration: 0.06 }).then(() => this.ctx.tw.to(this.drum.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack }));
  }

  private async judge() {
    const r = this.rhythms[this.index];
    const taps = this.taps;
    this.taps = [];
    this.busy = true;
    if (judgeEcho(r, taps)) {
      sfx.sparkle();
      this.ctx.particles.burst(this.drum.x, this.drum.y - 120, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.red.light], count: 16, speed: [100, 260], gravity: 0, life: [0.5, 0.9] });
      await this.ctx.say('sg.echoyes');
      await this.next();
      return;
    }
    this.misses++;
    this.wrongs++;
    sfx.boing();
    if (this.wrongs >= 2) this.hint();
    await this.ctx.say('sg.again');
    await this.playSound();
    this.busy = false;
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    sfx.tada();
    this.ctx.pet.cheer();
    await this.ctx.say('sg.done');
    await this.ctx.tw.wait(0.6);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class GardenIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const bird = art('bird');
    bird.scale.set(0.6);
    bird.position.set(-50, -170);
    const frog = art('frog');
    frog.scale.set(0.6);
    frog.position.set(40, -60);
    const bell = art('bell');
    bell.scale.set(0.6);
    bell.position.set(60, -170);
    c.addChild(bell, bird, frog);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const kinds: Kind[] = rng.shuffle(['bird', 'frog', 'bell', 'turtle'] as Kind[]).slice(0, 2);
  kinds.forEach((k, i) => {
    const a = art(k);
    a.scale.set(0.7);
    a.position.set(i ? 55 : -55, i ? 10 : -20);
    c.addChild(a);
  });
  return c;
}

export const soundGarden: GameModule = {
  id: 'sound-garden',
  name: 'Sound Garden',
  titleLine: 'game.sound-garden',
  region: 'music-mountain',
  skills: ['listening', 'pitch', 'tempo', 'rhythm'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => LEVELS[band],
  describeLevel: (level) => planFor(level).name,
  // Quiet music, so the listening questions are easy to hear.
  music: STYLES.lullaby,
  coplayHint: 'Sing along: a high "tweet" with your hand up high, a low "ribbit" with your hand down low.',
  offScreen: 'Play a pot-and-spoon drum: copy each other\'s taps, fast and slow.',
  hubIcon: () => new GardenIcon(),
  sticker,
  create: (ctx) => new SoundGarden(ctx),
};
