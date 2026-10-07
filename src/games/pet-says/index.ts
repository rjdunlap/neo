import { Circle, Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS, type CritterSpec } from '../../art/critter';
import { RAINBOW, swatch, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { musicNote } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { danceSeconds, makeTurns, MOVE_WORDS, planFor, type Move, type SaysPlan, type Turn } from './logic';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  toddler: { min: 1, max: 3 },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 5 },
};

/** The freeze dance's tune, in pentatonic steps. */
const DANCE = [5, 7, 9, 7, 5, 4, 5, 7, 9, 10, 9, 7];
const REST = { left: { x: -128, y: -95 }, right: { x: 128, y: -95 } };

/** The big pet with two mitten hands riding on its body, so they hop and squash with it. */
class Mover extends Container {
  readonly pet: Critter;
  readonly left: Graphics;
  readonly right: Graphics;

  constructor(spec: CritterSpec) {
    super();
    this.pet = new Critter(spec);
    const sw = this.pet.sw;
    const hand = () => new Graphics().circle(0, 0, 27).fill(sw.fill).stroke({ width: 6, color: sw.line }).circle(-9, -10, 7).fill({ color: 0xffffff, alpha: 0.35 });
    this.left = hand();
    this.right = hand();
    this.left.position.copyFrom(REST.left);
    this.right.position.copyFrom(REST.right);
    this.pet.attach(this.left);
    this.pet.attach(this.right);
    this.addChild(this.pet);
  }
}

class PetSays implements Game {
  readonly plan: SaysPlan;
  readonly turns: Turn[];
  readonly mover: Mover;
  readonly next = new RoundButton(arrowIcon(1, 0xffffff), swatch.green, 62, () => void this.advance());
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** Freeze dance: the music is playing. */
  dancing = false;

  private readonly backdrop: Backdrop;
  private readonly notes = new Container();
  private lastDance = 0;
  private beat = 0;
  private beatIn = 0;
  private danceLeft = 0;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.turns = makeTurns(this.plan, ctx.rng);
    this.backdrop = ctx.track(new Backdrop({ sky: [swatch.blue.light, 0xfff4e3], hills: [swatch.green.light, 0xc8ecb0, 0xddf2cf], horizon: 0.62, clouds: 3, sun: true, seed: 33 }, ctx.view));
    this.mover = new Mover(ctx.petSpec);
    ctx.track(this.mover.pet);
    this.mover.pet.hitArea = new Circle(0, -130, 170);
    onTap(this.mover.pet, () => void this.again(), { cooldown: 500 });
    this.next.visible = false;
    this.notes.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.notes, this.mover, this.next);
    // The big pet is the star, so the corner guide steps out; tapping the big pet shows the move again.
    ctx.pet.visible = false;
  }

  get turn(): Turn | undefined {
    return this.turns[this.index];
  }

  start() {
    void this.intro();
  }

  resize(v: View) {
    this.backdrop.resize(v);
    const s = Math.min(1.15, (v.h - 200) / 330);
    this.mover.scale.set(Math.sign(this.mover.scale.x || 1) * s, s);
    this.mover.position.set(v.w / 2, v.h - 50);
    this.next.position.set(v.w - 110, v.h - 110);
  }

  update(dt: number) {
    if (!this.dancing) return;
    this.danceLeft -= dt;
    this.beatIn -= dt;
    if (this.beatIn <= 0) {
      this.beatIn = 0.32;
      const step = DANCE[this.beat % DANCE.length];
      sfx.marimba(step, 0.4);
      if (this.beat % 2 === 0) this.mover.pet.hop(0.45);
      this.mover.rotation = (this.beat % 2 ? 1 : -1) * 0.12;
      this.floatNote(step);
      this.beat++;
    }
    if (this.danceLeft <= 0) void this.freeze();
  }

  destroy() {
    this.dancing = false;
    this.ctx.pet.visible = true;
  }

  private async intro() {
    const lines: Record<SaysPlan['mode'], LineId> = { copy: 'says.copy', body: 'says.body', pairs: 'says.pairs', says: 'says.rule', freeze: 'says.freeze' };
    await this.ctx.say(lines[this.plan.mode]);
    await this.advance(true);
  }

  /** The grown-up's arrow: on to the next move, or the end of the round. */
  private async advance(first = false) {
    if (!first && (this.busy || this.finished)) return;
    this.busy = true;
    this.next.visible = false;
    this.index++;
    if (!this.turn) return this.finale();
    await this.show(this.turn);
  }

  /** Tapping the pet shows the move again (not during the freeze dance, where the arrow restarts the music). */
  private async again() {
    if (this.busy || this.finished || !this.turn || this.plan.mode === 'freeze') {
      this.mover.pet.poke();
      return;
    }
    this.busy = true;
    this.next.visible = false;
    await this.show(this.turn);
  }

  private async show(turn: Turn) {
    const [first, second] = turn.moves;
    switch (this.plan.mode) {
      case 'copy':
      case 'body':
        void this.ctx.instruct(`says.${first}` as LineId);
        await this.perform(first);
        break;
      case 'pairs':
        await this.ctx.instruct('says.pair', { first: MOVE_WORDS[first], second: MOVE_WORDS[second] });
        await this.perform(first);
        await this.ctx.tw.wait(0.3);
        await this.perform(second);
        break;
      case 'says':
        // The pet moves either way, to tempt; the words decide whether we move too.
        await this.ctx.instruct(turn.says ? 'says.says' : 'says.trick', { move: MOVE_WORDS[first] });
        await this.perform(first);
        if (!turn.says) {
          this.mover.pet.setMood('surprised', 1.5);
          sfx.giggle();
          await this.ctx.say('says.tricked');
        }
        break;
      case 'freeze':
        this.mover.pet.alive = true;
        void this.ctx.instruct('says.dance');
        this.lastDance = danceSeconds(this.ctx.rng, this.lastDance);
        this.danceLeft = this.lastDance;
        this.beatIn = 0;
        this.dancing = true;
        return;
    }
    this.ready();
  }

  private ready() {
    this.busy = false;
    this.next.visible = true;
    this.next.scale.set(0);
    void this.ctx.tw.to(this.next.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
  }

  /** The music stops: everyone freezes in a funny pose, the pet too, until the arrow starts it again. */
  private async freeze() {
    this.dancing = false;
    this.mover.rotation = 0;
    const { left, right } = this.mover;
    this.ctx.tw.kill(left);
    this.ctx.tw.kill(right);
    left.position.set(-150, -200);
    right.position.set(140, -60);
    this.mover.pet.setMood('surprised');
    this.mover.pet.alive = false;
    sfx.squeak(9);
    await this.ctx.instruct('says.freeze-now');
    await this.ctx.tw.wait(0.6);
    this.mover.pet.alive = true;
    this.mover.pet.setMood('happy');
    void this.rest();
    this.ready();
  }

  private floatNote(step: number) {
    const n = musicNote(new Graphics(), 26, swatch[RAINBOW[step % RAINBOW.length]].fill);
    n.position.set(this.mover.x + this.ctx.rng.range(-160, 160), this.mover.y - 300);
    this.notes.addChild(n);
    void this.ctx.tw.to(n, { y: n.y - 140, alpha: 0 }, { duration: 1.4 }).then(() => n.destroy());
  }

  // The moves ---------------------------------------------------------------------------------------

  private hands(l: { x: number; y: number }, r: { x: number; y: number }, duration = 0.18) {
    return Promise.all([this.ctx.tw.to(this.mover.left, l, { duration, ease: ease.inOutSine }), this.ctx.tw.to(this.mover.right, r, { duration, ease: ease.inOutSine })]);
  }

  private rest() {
    return Promise.all([this.hands(REST.left, REST.right, 0.22), this.ctx.tw.to(this.mover.scale, { y: Math.abs(this.mover.scale.x) }, { duration: 0.2 })]);
  }

  private stretch(k: number) {
    return this.ctx.tw.to(this.mover.scale, { y: Math.abs(this.mover.scale.x) * k }, { duration: 0.25, ease: ease.outBack });
  }

  async perform(move: Move) {
    const tw = this.ctx.tw;
    const pet = this.mover.pet;
    pet.setMood('happy', 2);
    switch (move) {
      case 'clap':
        for (let k = 0; k < 3; k++) {
          await this.hands({ x: -20, y: -112 }, { x: 20, y: -112 }, 0.13);
          sfx.knock();
          await this.hands(REST.left, REST.right, 0.13);
        }
        break;
      case 'wave':
        await this.hands(REST.left, { x: 150, y: -210 });
        for (let k = 0; k < 3; k++) {
          sfx.chirp(10 + k);
          await tw.to(this.mover.right, { x: 180 }, { duration: 0.15 });
          await tw.to(this.mover.right, { x: 130 }, { duration: 0.15 });
        }
        break;
      case 'stomp':
        for (let k = 0; k < 3; k++) {
          pet.hop(0.3);
          await tw.wait(0.26);
          sfx.drum();
          await tw.wait(0.12);
        }
        break;
      case 'jump':
        for (let k = 0; k < 2; k++) {
          pet.hop(1.15);
          sfx.animal('hop');
          await tw.wait(0.6);
        }
        break;
      case 'spin': {
        sfx.whoosh();
        const s = Math.abs(this.mover.scale.x);
        await tw.to(this.mover.scale, { x: -s }, { duration: 0.35, ease: ease.inOutSine });
        await tw.to(this.mover.scale, { x: s }, { duration: 0.35, ease: ease.inOutSine });
        break;
      }
      case 'wiggle':
        sfx.giggle();
        for (let k = 0; k < 4; k++) await tw.to(this.mover, { rotation: k % 2 ? -0.14 : 0.14 }, { duration: 0.12 });
        await tw.to(this.mover, { rotation: 0 }, { duration: 0.12 });
        break;
      case 'up':
        sfx.sparkle();
        await Promise.all([this.hands({ x: -70, y: -300 }, { x: 70, y: -300 }, 0.25), this.stretch(1.12)]);
        await tw.wait(0.7);
        break;
      case 'down':
        sfx.sigh();
        await Promise.all([this.hands({ x: -140, y: -30 }, { x: 140, y: -30 }, 0.25), this.stretch(0.78)]);
        await tw.wait(0.7);
        break;
      case 'nose':
        await this.hands(REST.left, { x: 4, y: -112 }, 0.25);
        sfx.squeak(10);
        await tw.wait(0.8);
        break;
      case 'tummy':
        await this.hands({ x: -38, y: -55 }, { x: 38, y: -55 }, 0.22);
        for (let k = 0; k < 3; k++) {
          sfx.drum();
          await this.hands({ x: -38, y: -65 }, { x: 38, y: -65 }, 0.1);
          await this.hands({ x: -38, y: -50 }, { x: 38, y: -50 }, 0.1);
        }
        break;
      case 'ears':
        await this.hands({ x: -96, y: -228 }, { x: 96, y: -228 }, 0.25);
        sfx.squeak(8);
        await tw.wait(0.8);
        break;
      case 'head':
        await this.hands(REST.left, { x: 0, y: -262 }, 0.25);
        for (let k = 0; k < 2; k++) {
          sfx.knock();
          await tw.to(this.mover.right, { y: -250 }, { duration: 0.1 });
          await tw.to(this.mover.right, { y: -264 }, { duration: 0.1 });
        }
        break;
      case 'toes':
        await Promise.all([this.hands({ x: -56, y: -10 }, { x: 56, y: -10 }, 0.3), this.stretch(0.8)]);
        sfx.squeak(6);
        await tw.wait(0.7);
        break;
    }
    await this.rest();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.dancing = false;
    this.mover.pet.cheer();
    sfx.tada();
    await this.ctx.say('says.done');
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class SaysIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const m = new Mover(CRITTERS.pip);
    m.pet.alive = false;
    m.left.position.set(-70, -300);
    m.right.position.set(150, -210);
    m.scale.set(0.7);
    c.addChild(m);
    const n = musicNote(new Graphics(), 30, swatch.purple.fill);
    n.position.set(120, -230);
    c.addChild(n);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const color = rng.pick(['teal', 'pink', 'purple', 'orange'] as ColorName[]);
  const m = new Mover({ ...CRITTERS.pip, color });
  m.pet.alive = false;
  const pose = rng.int(0, 2);
  if (pose === 0) { m.left.position.set(-70, -300); m.right.position.set(70, -300); }
  else if (pose === 1) { m.left.position.set(-20, -112); m.right.position.set(20, -112); }
  else m.right.position.set(150, -210);
  m.scale.set(0.62);
  m.y = 90;
  c.addChild(m);
  return c;
}

export const petSays: GameModule = {
  id: 'pet-says',
  name: 'Pet Says',
  titleLine: 'game.pet-says',
  region: 'cozy-village',
  skills: ['copying actions', 'body words', 'following directions', 'self-control'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.quiet,
  coplayHint: 'Stand up and copy the pet with {name}, then tap the green arrow for the next move.',
  offScreen: 'Play Simon Says with family names: "Mama says touch your toes!" Freeze dance to any song.',
  hubIcon: () => new SaysIcon(),
  sticker,
  create: (ctx) => new PetSays(ctx),
};
