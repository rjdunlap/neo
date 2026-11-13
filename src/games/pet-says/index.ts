import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS, type CritterSpec } from '../../art/critter';
import type { CompanionRig } from '../../creatures/companion';
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
import { rangeFor } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  danceSeconds,
  saysFrame,
  type SaysFrame,
  makeTurns,
  beatsFor,
  cueWord,
  MOVE_CUES,
  MOVE_WORDS,
  shouldNudge,
  stickerRecipe,
  planFor,
  type Move,
  type SaysPlan,
  type Turn,
} from './logic';

/** The freeze dance's tune, in pentatonic steps. */
const DANCE = [5, 7, 9, 7, 5, 4, 5, 7, 9, 10, 9, 7];
/** The pip's mittens at rest, for the hub icon and the stickers, which keep the original drawing. */
const PIP_REST = { left: { x: -128, y: -95 }, right: { x: 128, y: -95 } };

const mitten = (sw: { fill: number; line: number }) =>
  new Graphics()
    .circle(0, 0, 27)
    .fill(sw.fill)
    .stroke({ width: 6, color: sw.line })
    .circle(-9, -10, 7)
    .fill({ color: 0xffffff, alpha: 0.35 });

/** The big pet with two mitten hands riding on its body, so they hop and squash with it. */
class Mover<P extends Container & { attach(child: Container): void }> extends Container {
  readonly left: Graphics;
  readonly right: Graphics;

  constructor(
    readonly pet: P,
    sw: { fill: number; line: number },
    rest: { left: { x: number; y: number }; right: { x: number; y: number } },
  ) {
    super();
    this.left = mitten(sw);
    this.right = mitten(sw);
    this.left.position.copyFrom(rest.left);
    this.right.position.copyFrom(rest.right);
    this.pet.attach(this.left);
    this.pet.attach(this.right);
    this.addChild(this.pet);
  }
}

const pipMover = (spec: CritterSpec) => {
  const pet = new Critter(spec);
  return new Mover(pet, pet.sw, PIP_REST);
};

class PetSays implements Game {
  readonly plan: SaysPlan;
  readonly turns: Turn[];
  readonly mover: Mover<CompanionRig>;
  /** Where the mittens go on this friend. */
  readonly frame: SaysFrame;
  /** How much larger than pip-size this friend stands: a long, low river or glider is grown to fill the room the pip took. */
  private readonly grow: number;
  /** The middle of the friend's picture, in its own units, so a long friend stands centred. */
  private readonly middle: number;
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
  private idle = 0;
  private nudged = false;
  /** Pat the pet: moves she has brought out so far. */
  patted = 0;
  private lastDance = 0;
  private beat = 0;
  private beatIn = 0;
  private danceLeft = 0;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.turns = makeTurns(this.plan, ctx.rng);
    this.backdrop = ctx.track(
      new Backdrop(
        {
          sky: [swatch.blue.light, 0xfff4e3],
          hills: [swatch.green.light, 0xc8ecb0, 0xddf2cf],
          horizon: 0.62,
          clouds: 3,
          sun: true,
          seed: 33,
        },
        ctx.view,
      ),
    );
    const star = ctx.companion();
    const b = star.getLocalBounds();
    this.grow = Math.max(1, Math.min(2.2, 270 / b.height, 520 / b.width));
    this.middle = b.x + b.width / 2;
    this.frame = saysFrame((p) => star.partPoints(p), star.bodyBounds());
    this.mover = new Mover(star, swatch[star.color as ColorName], this.frame.rest);
    // The mittens stay the pip's size however large the friend stands.
    for (const m of [this.mover.left, this.mover.right]) m.scale.set(1 / this.grow);
    ctx.track(star);
    star.hitArea = star.touchArea(40);
    // A pat brings the next move, so a pat just after a move ends must not be swallowed.
    onTap(this.mover.pet, () => void this.again(), { cooldown: this.plan.mode === 'pat' ? 250 : 500 });
    // Level 13 (lap only): a touch anywhere in the meadow is the pat, as a touch on the pet is.
    if (this.plan.mode === 'pat') onTap(this.backdrop, () => void this.again(), { cooldown: 250 });
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
    const s = Math.min(1.15, (v.h - 200) / 330) * this.grow;
    this.mover.scale.set(Math.sign(this.mover.scale.x || 1) * s, s);
    this.mover.position.set(v.w / 2 - this.middle * s, v.h - 50);
    this.next.position.set(v.w - 110, v.h - 110);
  }

  update(dt: number) {
    if (!this.busy && !this.finished) this.idle += dt;
    if (!this.nudged && shouldNudge(this.idle, this.busy, this.finished)) {
      this.nudged = true;
      if (this.plan.mode === 'pat') {
        // No arrow here: the pet itself asks for a pat.
        this.mover.pet.poke(true);
        void this.ctx.say('says.pat-again');
        return;
      }
      void this.ctx.say('says.next');
      void this.ctx.tw
        .to(this.next, { rotation: 0.12 }, { duration: 0.3 })
        .then(() => this.ctx.tw.to(this.next, { rotation: 0 }, { duration: 0.3 }));
    }
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

  /** The ghost finger on the how-to card: the grown-up's green arrow, tapped once the pet has finished its move (or its dance and freeze). */
  autotouch(): TouchIntent | null {
    if (this.plan.mode === 'pat')
      return this.busy || this.finished
        ? null
        : { tap: { on: this.mover.pet, x: this.mover.pet.touch.x, y: this.mover.pet.touch.y } };
    return this.busy || this.finished || this.dancing || !this.next.visible
      ? null
      : { tap: { on: this.next } };
  }

  destroy() {
    this.dancing = false;
    this.ctx.pet.visible = true;
  }

  private async intro() {
    const lines: Record<SaysPlan['mode'], LineId> = {
      copy: 'says.copy',
      body: 'says.body',
      pairs: 'says.pairs',
      says: 'says.rule',
      freeze: 'says.freeze',
      pat: 'says.pat',
    };
    if (this.plan.mode === 'pat') {
      // The pet waits to be patted; the first move comes with her first touch.
      this.busy = false;
      this.idle = 0;
      await this.ctx.instruct(lines.pat);
      return;
    }
    await this.ctx.say(lines[this.plan.mode]);
    await this.advance(true);
  }

  /** The grown-up's arrow: on to the next move, or the end of the round. */
  private async advance(first = false) {
    if (!first && (this.busy || this.finished)) return;
    this.busy = true;
    this.idle = 0;
    this.next.rotation = 0;
    this.ctx.tw.kill(this.next);
    this.next.visible = false;
    this.index++;
    if (!this.turn) return this.finale();
    await this.show(this.turn);
  }

  /** Tapping the pet shows the move again (not during the freeze dance, where the arrow restarts the music). */
  private async again() {
    if (this.plan.mode === 'pat') {
      // A pat brings the next move; a pat during a move only squishes the pet, and is not saved up for later.
      if (this.busy || this.finished) this.mover.pet.poke(true);
      else await this.advance();
      return;
    }
    if (this.busy || this.finished || !this.turn || this.plan.mode === 'freeze') {
      this.mover.pet.poke(true);
      return;
    }
    this.busy = true;
    this.idle = 0;
    this.next.rotation = 0;
    this.ctx.tw.kill(this.next);
    this.next.visible = false;
    await this.show(this.turn);
  }

  private async show(turn: Turn) {
    const [first, second] = turn.moves;
    switch (this.plan.mode) {
      case 'copy':
      case 'body':
        void this.ctx.instruct(MOVE_CUES[first].line);
        await this.perform(first);
        break;
      case 'pairs': {
        const [c1, c2] = turn.counts ?? [];
        await this.ctx.instruct('says.pair', { first: cueWord(first, c1), second: cueWord(second, c2) });
        await this.perform(first, c1);
        await this.ctx.tw.wait(0.3);
        await this.perform(second, c2);
        break;
      }
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
      case 'pat':
        void this.ctx.say(MOVE_CUES[first].line);
        await this.perform(first);
        this.patted++;
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
    this.idle = 0;
    this.nudged = false;
    if (this.plan.mode === 'pat') {
      // Five moves and the pet cheers by itself; otherwise it waits for the next pat, with no arrow.
      if (this.patted >= this.plan.turns) void this.finale();
      return;
    }
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
    left.position.copyFrom(this.frame.freeze.left);
    right.position.copyFrom(this.frame.freeze.right);
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
    return Promise.all([
      this.ctx.tw.to(this.mover.left, l, { duration, ease: ease.inOutSine }),
      this.ctx.tw.to(this.mover.right, r, { duration, ease: ease.inOutSine }),
    ]);
  }

  private rest() {
    return Promise.all([
      this.hands(this.frame.rest.left, this.frame.rest.right, 0.22),
      this.ctx.tw.to(this.mover.scale, { y: Math.abs(this.mover.scale.x) }, { duration: 0.2 }),
    ]);
  }

  private stretch(k: number) {
    return this.ctx.tw.to(
      this.mover.scale,
      { y: Math.abs(this.mover.scale.x) * k },
      { duration: 0.25, ease: ease.outBack },
    );
  }

  /** The pet does a move. With a count (level 3) it does exactly that many beats and counts each one aloud. */
  async perform(move: Move, count?: number) {
    const tw = this.ctx.tw;
    const pet = this.mover.pet;
    const f = this.frame;
    const { left, right } = this.mover;
    const beat = (k: number) => {
      if (count) void this.ctx.say('count', { n: k + 1 });
    };
    pet.setMood('happy', 2);
    switch (move) {
      case 'clap':
        for (let k = 0; k < beatsFor(move, count); k++) {
          await this.hands(f.clap.left, f.clap.right, 0.13);
          sfx.knock();
          beat(k);
          await this.hands(this.frame.rest.left, this.frame.rest.right, count ? 0.3 : 0.13);
        }
        break;
      case 'wave':
        await this.hands(f.rest.left, f.wave);
        for (let k = 0; k < 3; k++) {
          sfx.chirp(10 + k);
          await tw.to(this.mover.right, { x: f.wave.x + 30 }, { duration: 0.15 });
          await tw.to(this.mover.right, { x: f.wave.x - 20 }, { duration: 0.15 });
        }
        break;
      case 'stomp':
        for (let k = 0; k < beatsFor(move, count); k++) {
          pet.hop(0.3);
          await tw.wait(0.26);
          sfx.drum();
          beat(k);
          await tw.wait(count ? 0.3 : 0.12);
        }
        break;
      case 'jump':
        for (let k = 0; k < beatsFor(move, count); k++) {
          pet.hop(1.15);
          sfx.animal('hop');
          beat(k);
          await tw.wait(0.6);
        }
        break;
      case 'march':
        // Knees up in turn: one mitten lifts with each low hop and a drum.
        for (let k = 0; k < beatsFor(move, count); k++) {
          const up = k % 2 ? right : left;
          const to = k % 2 ? f.rest.right : f.rest.left;
          pet.hop(0.22);
          sfx.drum(0.45);
          beat(k);
          await tw.to(up, { y: to.y - 40 }, { duration: 0.16 });
          await tw.to(up, { y: to.y }, { duration: count ? 0.3 : 0.16 });
        }
        break;
      case 'peekaboo':
        await this.hands(f.eyes.left, f.eyes.right, 0.25);
        sfx.squeak(7);
        await tw.wait(0.8);
        await this.hands(
          { x: f.rest.left.x - 30, y: f.eyes.left.y - 20 },
          { x: f.rest.right.x + 30, y: f.eyes.right.y - 20 },
          0.16,
        );
        sfx.giggle();
        await tw.wait(0.6);
        break;
      case 'patacake':
        // The mittens meet, then cross over each other, three times.
        for (let k = 0; k < 3; k++) {
          await this.hands(f.clap.left, f.clap.right, 0.13);
          sfx.clap();
          await this.hands(
            { x: f.clap.left.x + 24, y: f.clap.left.y + 22 },
            { x: f.clap.right.x - 24, y: f.clap.right.y - 22 },
            0.13,
          );
          sfx.knock();
          await this.hands(f.rest.left, f.rest.right, 0.13);
        }
        break;
      case 'tiptoe':
        await this.stretch(1.08);
        for (let k = 0; k < 4; k++) {
          pet.hop(0.18);
          sfx.pluck(12 + (k % 2), 0.12);
          await tw.wait(0.32);
        }
        break;
      case 'frog':
        for (let k = 0; k < 2; k++) {
          await Promise.all([this.hands(f.down.left, f.down.right, 0.2), this.stretch(0.75)]);
          await tw.wait(0.15);
          pet.hop(1.25);
          sfx.croak();
          await Promise.all([this.hands(f.up.left, f.up.right, 0.2), this.stretch(1.1)]);
          await tw.wait(0.4);
        }
        break;
      case 'cat':
        sfx.yawn();
        await Promise.all([this.hands(f.up.left, f.up.right, 0.5), this.stretch(1.15)]);
        await tw.wait(0.9);
        break;
      case 'duck':
        for (let k = 0; k < 4; k++) {
          if (k % 2 === 0) sfx.animal('quack');
          pet.hop(0.15);
          await tw.to(this.mover, { rotation: k % 2 ? -0.1 : 0.1 }, { duration: 0.22 });
        }
        await tw.to(this.mover, { rotation: 0 }, { duration: 0.15 });
        break;
      case 'bird':
        for (let k = 0; k < 4; k++) {
          sfx.chirp(12 + (k % 2) * 2);
          await this.hands(
            { x: f.up.left.x - 40, y: f.up.left.y + 40 },
            { x: f.up.right.x + 40, y: f.up.right.y + 40 },
            0.12,
          );
          await this.hands(f.rest.left, f.rest.right, 0.12);
        }
        break;
      case 'tree':
        await this.hands(f.up.left, f.up.right, 0.3);
        sfx.wave(true);
        for (let k = 0; k < 2; k++) {
          await tw.to(this.mover, { rotation: 0.1 }, { duration: 0.6, ease: ease.inOutSine });
          await tw.to(this.mover, { rotation: -0.1 }, { duration: 0.6, ease: ease.inOutSine });
        }
        await tw.to(this.mover, { rotation: 0 }, { duration: 0.3, ease: ease.inOutSine });
        break;
      case 'shake':
        sfx.shake();
        for (let k = 0; k < 6; k++) {
          const d = k % 2 ? -1 : 1;
          await Promise.all([
            tw.to(this.mover, { rotation: d * 0.06 }, { duration: 0.07 }),
            this.hands(
              { x: f.rest.left.x, y: f.rest.left.y + d * 14 },
              { x: f.rest.right.x, y: f.rest.right.y - d * 14 },
              0.07,
            ),
          ]);
        }
        await tw.to(this.mover, { rotation: 0 }, { duration: 0.1 });
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
        for (let k = 0; k < 4; k++)
          await tw.to(this.mover, { rotation: k % 2 ? -0.14 : 0.14 }, { duration: 0.12 });
        await tw.to(this.mover, { rotation: 0 }, { duration: 0.12 });
        break;
      case 'up':
        sfx.sparkle();
        await Promise.all([this.hands(f.up.left, f.up.right, 0.25), this.stretch(1.12)]);
        await tw.wait(0.7);
        break;
      case 'down':
        sfx.sigh();
        await Promise.all([this.hands(f.down.left, f.down.right, 0.25), this.stretch(0.78)]);
        await tw.wait(0.7);
        break;
      case 'nose':
        await this.hands(f.targets.nose.left, f.targets.nose.right, 0.25);
        sfx.squeak(10);
        await tw.wait(0.8);
        break;
      case 'tummy':
        await this.hands(f.targets.tummy.left, f.targets.tummy.right, 0.22);
        for (let k = 0; k < 3; k++) {
          sfx.drum();
          const { left: l, right: r } = f.targets.tummy;
          await this.hands(l, r, 0.1);
          await this.hands({ x: l.x, y: l.y + 15 }, { x: r.x, y: r.y + 15 }, 0.1);
        }
        break;
      case 'ears':
        await this.hands(f.targets.ears.left, f.targets.ears.right, 0.25);
        sfx.squeak(8);
        await tw.wait(0.8);
        break;
      case 'head':
        await this.hands(f.targets.head.left, f.targets.head.right, 0.25);
        for (let k = 0; k < 2; k++) {
          sfx.knock();
          await tw.to(this.mover.right, { y: f.targets.head.right.y }, { duration: 0.1 });
          await tw.to(this.mover.right, { y: f.targets.head.right.y - f.knock }, { duration: 0.1 });
        }
        break;
      case 'toes':
        await Promise.all([this.hands(f.targets.toes.left, f.targets.toes.right, 0.3), this.stretch(0.8)]);
        sfx.squeak(6);
        await tw.wait(0.7);
        break;
      default: {
        const never: never = move;
        throw new Error(`no performance for ${String(never)}`);
      }
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
    const m = pipMover(CRITTERS.pip);
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
  const { color, pose } = stickerRecipe(rng);
  const m = pipMover({ ...CRITTERS.pip, color });
  m.pet.alive = false;

  if (pose === 0) {
    m.left.position.set(-70, -300);
    m.right.position.set(70, -300);
  } else if (pose === 1) {
    m.left.position.set(-20, -112);
    m.right.position.set(20, -112);
  } else m.right.position.set(150, -210);
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
  challenge: 'words',
  skills: ['copying actions', 'body words', 'following directions', 'self-control'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: [13],
  describeLevel: (level) => planFor(level).name,
  music: STYLES.quiet,
  coplayHint: 'Stand up and copy the pet with {name}, then tap the green arrow for the next move.',
  // Lap opens on level 13, where her touch anywhere is the pat and there is no arrow; levels 1 and 2 keep the grown-up's arrow.
  coplayHintLap: "Copy the pet's moves with {name}. When a green arrow shows, you tap it for the next move.",
  offScreen: 'Play Simon Says with family names: "Mama says touch your toes!" Freeze dance to any song.',
  hubIcon: () => new SaysIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new PetSays(ctx),
};
