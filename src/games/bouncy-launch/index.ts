import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { prop } from '../../art/props';
import { puffs, starPoints } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { entryId } from '../../content/journal';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { idle, type CouchControls } from '../../engine/controller';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { CLOUDS } from './course';
import { airtimeFor, gravityFor, planetPairs, planetSide, planetBotLanding, type PlanetPair, friendSpots, judge, judgeFriend, MAX_PULL, MIN_PULL, nextAsk, padAt, PADS, planFor, pullFor, pullToTake, reach, revealsPullRule, targets, type LaunchPlan } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 3 },
  preschool: { min: 2, max: 4 },
  // Level 7, Feed the friend, comes after the numbered clouds and before comparing.
  prek: { min: 3, max: 7, order: [3, 4, 7, 5] },
  school: { min: 4, max: 12, order: [4, 5, 7, 6, 12] },
};

const PET_SCALE = 0.5;
/** The friend is smaller than the pet, so it reads as someone to feed rather than something to land on. */
const FRIEND_SCALE = 0.42;
/** Couch play: how far the spring squashes straight down at full power, in logical units. */
const SQUASH = 90;
const SPRING = { fill: 0xc9d3dc, line: 0x8c9aa8 };

/** A soft landing cloud resting on the grass. */
function padArt(w: number): Graphics {
  const r = w / 4;
  return puffs(new Graphics(), [[-r * 1.4, 0, r], [-r * 0.5, -r * 0.5, r * 1.2], [r * 0.5, -r * 0.4, r * 1.15], [r * 1.4, 0, r]], 0xffffff, 0xbfe0f4, 6);
}

function starArt(r: number): Graphics {
  return new Graphics().poly(starPoints(r, r * 0.45, 5)).fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.yellow.line, join: 'round' });
}

class BouncyLaunch implements Game {
  readonly plan: LaunchPlan;
  readonly targets: number[];
  /** Feed the friend: where the friend stands for each shot, as a fraction along the strip. */
  readonly spots: number[] = [];
  readonly pairs: PlanetPair[] = [];
  askForHint?: () => void;
  hintLabel?: string;
  private view: View;
  planetPhase: 'home' | 'choose' | 'flight' = 'home';
  private planetRingSide: 'before' | 'past' | undefined;
  private readonly planetInput = new Container();
  private readonly planetArt = new Graphics();
  private readonly planetBackdrops: Backdrop[] = [];
  readonly pet: Critter;
  readonly pads: Container[] = [];
  shot = 0;
  misses = 0;
  hints = 0;
  /** How far every launch landed from the middle of its cloud, as a fraction of the strip, added up. */
  off = 0;
  /** Where the last landing was (0..1 along the strip), for compare levels. */
  last: number | undefined;
  ask: 'farther' | 'nearer' | undefined;
  flying = false;
  finished = false;
  hinting = false;
  /** Landing distances produced by deliberate pulls (the tap-only level has none). */
  readonly observedPulls: number[] = [];

  private readonly backdrop: Backdrop;
  private readonly spring = new Graphics();
  private readonly preview = new Graphics();
  /** The pet itself launches, so the fixed spring base is the safe instruction-replay target. */
  private readonly replay = new Container();
  private readonly star = starArt(30);
  private readonly flag = new Graphics();
  private readonly flagNumbers = new Container();
  private readonly lastArc = new Graphics();
  private readonly compareRing = new Graphics();
  private lastFlight: number | undefined;
  private arcAge = 0;
  private readonly predictionFlights: number[] = [];
  /** A ring around the cloud the child predicted; it stays there while the flight proves the answer. */
  private readonly predictionRing = new Graphics();
  private readonly pullArrow = new Graphics();
  private friend: Critter | null = null;
  private friendName = '';
  private snack: Container | null = null;
  private emptyPulls = 0;
  private wobble = 0;
  private rawPull = 0;
  /** The finger pulling the spring, and where it first touched. */
  private grab: { id: number; from: { x: number; y: number } } | null = null;
  private readonly release = (e: { pointerId: number }) => {
    if (!this.grab || e.pointerId !== this.grab.id) return;
    this.grab = null;
    if (!this.letGo()) {
      this.emptyPulls++;
      void this.ctx.say(this.rawPull >= MIN_PULL ? 'launch.wrong-way' : 'launch.too-short');
      this.returnToSeat();
    } else {
      this.emptyPulls = 0;
      this.pullArrow.clear();
    }
  };
  private readonly cancel = (e: { pointerId: number }) => {
    if (!this.grab || e.pointerId !== this.grab.id) return;
    this.grab = null;
    this.preview.clear();
    this.returnToSeat();
  };
  private returnToSeat() {
    void this.ctx.tw.to(this.pet, { x: this.seat.x, y: this.seat.y }, { duration: 0.3, ease: ease.outBack }).then(() => this.drawSpring());
  }
  private wrongs = 0;
  private clock = 0;
  private seat = { x: 0, y: 0 };
  private flight: { pts: { x: number; y: number }[]; t: number; duration: number; done: () => void } | null = null;
  private strip = { x0: 0, x1: 0, y: 0 };
  private controllerPower = 0.5;
  /** Driven by a stick or keys (couch play, or a key pressed on the island) instead of a finger: the spring squashes straight down by the power. */
  private stick = false;
  private botWait = 1;
  /** Couch challenge: a fixed run of small clouds, scored by launches. Null in ordinary play. */
  private readonly course: { padWidth: number } | null;
  /** Launches taken at each cloud finished so far. */
  private done: number[] = [];
  /** Launches at the cloud in play, carried across a reload so leaving cannot erase them. */
  private tries = 0;
  private assisted = false;
  private told = false;
  private instruction: { id: LineId; vars?: LineVars } | null = null;
  /** The cloud chosen before this shown pull is released. Predictions are never misses. */
  prediction: number | undefined;

  /** The "watch me" demo: hold toward the next cloud's power, then press the launch button. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    this.botWait -= dt;
    const target = this.targets[this.shot];
    if (this.flying || this.finished || this.grab || this.botWait > 0 || target === undefined) return out;
    const gap = padAt(target) - this.controllerPower;
    out.players[0].active = true;
    if (Math.abs(gap) > 0.015) out.players[0].x = Math.max(-1, Math.min(1, gap / (Math.max(dt, 1e-3) * 0.5)));
    else {
      out.players[0].action = true;
      this.botWait = 1.4;
    }
    return out;
  }

  /**
   * The ghost finger on the how-to card: tap the spring on the first level, and after that put a finger on the pet, pull it
   * back and down by the pull that lands where it should (on the cloud, or nearer or farther than last time), and let go.
   */
  autotouch(): TouchIntent | null {
    if (this.flying || this.finished || this.grab) return null;
    if (this.plan.mode === 'planet') {
      const pair = this.pairs[this.shot];
      return this.planetPhase === 'choose' && pair ? { tap: { on: this.planetInput, x: this.landX(planetBotLanding(pair)), y: this.strip.y - 160 } } : null;
    }
    if (this.plan.mode === 'tap') return { tap: { on: this.pet, y: -125 } };
    if (this.plan.mode === 'predict') {
      const target = this.targets[this.shot];
      return target === undefined ? null : { tap: { on: this.pads[target] } };
    }
    const pull = pullToTake(this.plan, this.shot, this.targets, this.last, this.spots);
    // Back and down, the way the leash allows; the finger travels as far as the pet is to be pulled.
    const from = { x: this.seat.x, y: this.seat.y - 125 * PET_SCALE };
    const d = { x: -0.35, y: 0.94 };
    const len = Math.hypot(d.x, d.y);
    return {
      trace: { on: this.ctx.stage, ...from },
      via: [{ on: this.ctx.stage, x: from.x + (d.x / len) * pull, y: from.y + (d.y / len) * pull }],
      receiver: this.pet,
    };
  }

  control(input: CouchControls, dt: number) {
    if (this.plan.mode === 'planet') return;
    if (this.flying || this.finished || this.grab) return;
    const p = input.players.find(p => p.x || p.y || p.action);
    if (!p) {
      // The first key on the island (GameScene passes control() only after a real press) shows the spring at once.
      if (!this.stick) { this.stick = true; this.squash(); }
      return;
    }
    // Down (or right) squashes the spring for more power; up (or left) lets it back up.
    const push = Math.max(-1, Math.min(1, p.x + p.y));
    this.stick = true;
    this.controllerPower = Math.max(0, Math.min(1, this.controllerPower + push * dt * 0.5));
    this.squash();
    if (p.action) this.fire();
  }

  /** The spring squashed straight down by the current power, the pet riding on top of it. */
  private squash() {
    this.pet.position.set(this.seat.x, this.seat.y + this.controllerPower * SQUASH);
    this.drawPreview();
    this.drawSpring();
  }

  /** A finger came back after keys on the island: the spring springs back up and the pet waits on it to be pulled. */
  touchReturned() {
    if (!this.stick || this.ctx.couch || this.finished) return;
    this.stick = false;
    // In the air the hop back lands it on the unsquashed seat.
    if (this.flying) return;
    this.ctx.tw.kill(this.pet);
    this.pet.position.set(this.seat.x, this.restingY());
    this.drawPreview();
    this.drawSpring();
  }

  /** Let the squashed spring go. The power is already the landing spot, so no pull has to be measured. */
  private fire() {
    if (this.flying || this.finished) return;
    this.preview.clear();
    void this.launch(this.controllerPower);
  }

  /** Where the pet sits on the spring between launches. */
  private restingY() {
    return this.seat.y + (this.stick ? this.controllerPower * SQUASH : 0);
  }

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    const run = ctx.couch?.course;
    if (run?.id === 'clouds') {
      // A star over each cloud, as in the "land on the cloud with the star" level, but on the course's own clouds.
      this.plan = planFor(3);
      this.targets = [...CLOUDS.targets];
      this.course = { padWidth: CLOUDS.padWidth };
      this.shot = run.resume.board;
      this.done = run.resume.done.slice();
      this.tries = run.resume.attempts;
      this.assisted = run.resume.assisted;
    } else {
      this.plan = planFor(ctx.level);
      this.course = null;
      if (this.plan.mode === 'planet') {
        this.targets = [];
        this.pairs = planetPairs(ctx.rng);
      } else if (this.plan.mode === 'friend') {
        this.targets = [];
        this.spots = friendSpots(this.plan, ctx.rng);
      } else this.targets = targets(this.plan, ctx.rng);
    }
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.78, clouds: 4, sun: true, seed: 88 }, ctx.view);
    if (this.plan.mode === 'planet') {
      for (const light of [true, false]) {
        const backdrop = new Backdrop({ sky: light ? [swatch.purple.light, swatch.blue.light] : [swatch.orange.light, swatch.yellow.light], hills: light ? [swatch.purple.fill, swatch.purple.light] : [swatch.orange.line, swatch.orange.fill], horizon: 0.78, clouds: 0, seed: 88 }, ctx.view);
        backdrop.visible = false;
        this.planetBackdrops.push(backdrop);
      }
      this.planetArt.eventMode = 'none';
    }
    this.flag.eventMode = this.flagNumbers.eventMode = this.lastArc.eventMode = this.compareRing.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, ...this.planetBackdrops, this.planetArt, this.lastArc, this.flag, this.flagNumbers, this.compareRing, this.predictionRing, this.pullArrow);
    this.pullArrow.eventMode = 'none';
    const padW = this.course?.padWidth ?? 0.85;
    for (let i = 0; i < PADS; i++) {
      const pad = new Container();
      pad.addChild(padArt(120 * padW));
      if (this.plan.mode === 'number' || this.plan.mode === 'predict') {
        const n = label(String(i + 1), 46, ink);
        n.anchor.set(0.5);
        n.y = -22;
        pad.addChild(n);
      }
      this.pads.push(pad);
      pad.visible = this.plan.mode !== 'friend' && this.plan.mode !== 'planet';
      ctx.stage.addChild(pad);
      if (this.plan.mode === 'predict') onTap(pad, () => void this.predict(i), { cooldown: 500 });
    }
    this.star.visible = this.plan.mode === 'star';
    this.stick = !!ctx.couch;
    // The pet is the one flying, so the corner guide steps out (as in Splish Splash).
    ctx.pet.visible = false;
    this.pet = new Critter(ctx.petSpec);
    this.pet.scale.set(PET_SCALE);
    this.pet.hitArea = new Circle(0, -125, 190);
    this.replay.hitArea = new Circle(0, 0, 68);
    onTap(this.replay, () => this.repeatInstruction(), { cooldown: 500 });
    ctx.track(this.pet);
    if (this.plan.mode === 'friend') {
      // A friend waits on the grass, not on a cloud, with a snack at its feet.
      const kind: CritterName = ctx.rng.pick(['bunny', 'duck'] as const);
      this.friendName = kind === 'bunny' ? 'Bunny' : 'Duck';
      this.friend = new Critter(CRITTERS[kind]);
      this.friend.scale.set(FRIEND_SCALE);
      this.friend.eventMode = 'none';
      this.snack = prop('apple', 'red');
      this.snack.scale.set(0.45);
      this.snack.eventMode = 'none';
      ctx.track(this.friend);
      ctx.stage.addChild(this.friend, this.snack);
    }
    ctx.stage.addChild(this.star, this.spring, this.preview, this.replay, this.pet);
    if (this.plan.mode === 'tap') {
      onTap(this.pet, () => void this.launch(this.ctx.rng.range(0.15, 0.95)), { cooldown: 500 });
    } else if (this.plan.mode !== 'predict' && this.plan.mode !== 'planet') {
      // A slingshot pull, not a drag-and-drop: the pet moves by however far the finger moves,
      // wherever on the pet it was grabbed (drag.ts would snap the pet onto the fingertip).
      this.pet.eventMode = 'static';
      this.pet.on('pointerdown', (e: FederatedPointerEvent) => {
        if (this.flying || this.finished || this.grab || palmOnGlass()) return;
        this.grab = { id: e.pointerId, from: this.ctx.stage.toLocal(e.global) };
        this.rawPull = 0;
        this.wobble = 0.35;
        this.pet.rotation = 0.07;
        sfx.squeak(6);
      });
      this.pet.on('globalpointermove', (e: FederatedPointerEvent) => {
        if (!this.grab || e.pointerId !== this.grab.id) return;
        const p = this.ctx.stage.toLocal(e.global);
        this.pull(this.seat.x + p.x - this.grab.from.x, this.seat.y + p.y - this.grab.from.y);
      });
      window.addEventListener('pointerup', this.release);
      window.addEventListener('pointercancel', this.cancel);
      this.pet.on('pointercancel', this.cancel);
      // The ghost finger on the how-to card lets go on the pet itself (it sends no window events); a real release reaches both, and the second finds the pull already gone.
      this.pet.on('pointerup', this.release);
      this.pet.on('pointerupoutside', this.release);
    }
  }

  /** Requested support explains the world's rule; predictions themselves never count as misses. */
  private showPlanetHint() {
    if (this.plan.mode !== 'planet' || this.planetPhase !== 'choose' || this.flying || this.finished) return;
    this.hints++;
    const pair = this.pairs[this.shot];
    this.ringPlanet(planetSide(this.landX(planetBotLanding(pair)), this.landX(pair.base)));
    void this.ctx.say(pair.planet === 'light' ? 'launch.planet-why-light' : 'launch.planet-why-heavy');
  }

  private drawPlanet(v: View) {
    this.planetBackdrops.forEach(b => b.resize(v));
    this.planetInput.hitArea = new Rectangle(0, 0, v.w, v.h);
    const g = this.planetArt.clear();
    const pair = this.pairs[this.shot];
    const onPlanet = this.planetPhase !== 'home' && !!pair;
    this.backdrop.visible = !onPlanet;
    this.planetBackdrops.forEach((b, i) => { b.visible = onPlanet && i === (pair.planet === 'light' ? 0 : 1); });
    if (!onPlanet) return;
    if (pair.planet === 'light') {
      for (const f of [0.15, 0.5, 0.85]) g.ellipse(v.w * f, this.strip.y + 75, 40, 12).fill(swatch.purple.fill).stroke({ width: 3, color: swatch.purple.line });
      const x = v.w * 0.75;
      g.ellipse(x, 130, 60, 17).fill(swatch.green.fill);
      g.poly([x - 58, 135, x, 170, x + 58, 135]).fill(wood.fill);
    } else {
      const x = v.w * 0.78, y = v.h * 0.56;
      g.circle(x, y, 52).fill(swatch.purple.light).stroke({ width: 4, color: swatch.purple.line });
      g.ellipse(x, y + 8, 90, 18).stroke({ width: 8, color: swatch.purple.fill });
    }
    if (this.planetRingSide) this.ringPlanet(this.planetRingSide);
    const flagX = this.landX(pair.base);
    g.moveTo(flagX, 0).lineTo(flagX, v.h).stroke({ width: 3, color: ink, alpha: 0.18 });
  }

  private ringPlanet(side: 'before' | 'past') {
    this.planetRingSide = side;
    const flagX = this.landX(this.pairs[this.shot].base);
    const x = side === 'before' ? (this.strip.x0 + flagX) / 2 : (flagX + this.strip.x1) / 2;
    this.predictionRing.clear().ellipse(x, this.strip.y - 80, 48, 48).stroke({ width: 6, color: swatch.yellow.fill });
  }

  private async predictPlanet(x: number) {
    if (this.planetPhase !== 'choose' || this.flying || this.finished) return;
    this.planetPhase = 'flight';
    const pair = this.pairs[this.shot];
    this.ringPlanet(planetSide(x, this.landX(pair.base)));
    sfx.pop(5);
    await this.ctx.say('launch.lets-see');
    void this.launch(planetBotLanding(pair));
  }

  private async homePlanet() {
    this.planetPhase = 'home';
    this.planetRingSide = undefined;
    this.lastFlight = undefined;
    this.drawHistory();
    this.drawFlag();
    this.drawPlanet(this.view);
    this.showPredictionPull();
    // Leave time to see the fixed pull before its home flight.
    this.flying = true;
    await this.ctx.tw.wait(1);
    this.flying = false;
    void this.launch(this.pairs[this.shot].base);
  }

  private async planetLanded() {
    if (this.planetPhase === 'home') {
      this.last = this.pairs[this.shot].base;
      this.planetPhase = 'choose';
      this.drawFlag();
      await this.ctx.tw.to(this.pet, { x: this.seat.x, y: this.seat.y }, { duration: 0.7, ease: ease.outBack });
      this.flying = false;
      this.drawPlanet(this.view);
      this.showPredictionPull();
      await this.instruct(this.pairs[this.shot].planet === 'light' ? 'launch.planet-light' : 'launch.planet-heavy');
      return;
    }
    await this.ctx.say(this.pairs[this.shot].planet === 'light' ? 'launch.planet-why-light' : 'launch.planet-why-heavy');
    this.shot++;
    this.predictionRing.clear();
    if (this.shot >= this.pairs.length) return void this.finale();
    await this.ctx.tw.to(this.pet, { x: this.seat.x, y: this.seat.y }, { duration: 0.7, ease: ease.outBack });
    this.flying = false;
    await this.homePlanet();
  }

  start() {
    // A challenge run left after its last cloud was landed on has nothing more to play: settle it.
    if (this.course && this.shot >= this.targets.length) return void this.finale();
    if (this.plan.mode === 'planet') {
      this.askForHint = () => this.showPlanetHint();
      this.hintLabel = 'Show a hint';
      this.ctx.stage.addChildAt(this.planetInput, this.ctx.stage.getChildIndex(this.replay));
      onTap(this.pet, () => this.repeatInstruction(), { cooldown: 500 });
      onTap(this.planetInput, e => void this.predictPlanet(this.ctx.stage.toLocal(e.global).x), { cooldown: 500 });
      return void this.homePlanet();
    }
    void this.askShot();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const ground = this.backdrop.groundY + 30;
    this.seat = { x: 210, y: ground - 150 };
    this.strip = { x0: 380, x1: v.w - 80, y: ground + 10 };
    this.replay.position.set(this.seat.x, this.strip.y - 8);
    this.pads.forEach((pad, i) => pad.position.set(this.landX(padAt(i)), this.strip.y));
    if (!this.flying && !this.grab) {
      if (this.plan.mode === 'predict' || this.plan.mode === 'planet') this.showPredictionPull();
      else this.pet.position.set(this.seat.x, this.restingY());
    }
    if (this.stick && !this.flying) this.squash();
    else this.drawSpring();
    this.placeStar();
    this.placeFriend();
    this.drawHistory();
    this.drawFlag();
    if (this.plan.mode === 'planet') this.drawPlanet(v);
  }

  private placeFriend() {
    const spot = this.spots[this.shot];
    if (!this.friend || !this.snack || spot === undefined) return;
    this.ctx.tw.kill(this.friend);
    this.friend.position.set(this.landX(spot), this.strip.y);
    this.snack.position.set(this.landX(spot) + 52, this.strip.y - 22);
  }

  /** The next friend hops over to its spot, with the snack, once the last one has been fed. */
  private moveFriend() {
    const spot = this.spots[this.shot];
    if (!this.friend || !this.snack || spot === undefined) return;
    const x = this.landX(spot);
    this.snack.scale.set(0.45);
    this.snack.visible = true;
    this.snack.position.set(x + 52, this.strip.y - 22);
    this.friend.position.set(x, this.strip.y);
    this.friend.poke();
  }

  /** The friend eats the snack the pet brought: a cheer, a few sparkles and a thank you. */
  private async feed() {
    this.pet.cheer();
    this.friend?.cheer();
    sfx.sparkle();
    if (this.friend) this.ctx.particles.burst(this.friend.x, this.friend.y - 100, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.yellow.fill], count: 18, speed: [120, 300], gravity: 0, life: [0.6, 1] });
    if (this.snack) void this.ctx.tw.to(this.snack.scale, { x: 0, y: 0 }, { duration: 0.4, ease: ease.outBack });
    await this.ctx.say('launch.fed', { friend: this.friendName });
    this.lastFlight = undefined;
    this.drawHistory();
  }

  private landX(f: number) {
    return this.strip.x0 + f * (this.strip.x1 - this.strip.x0);
  }

  update(dt: number) {
    this.clock += dt;
    this.arcAge += dt;
    this.lastArc.alpha = Math.max(0, 1 - this.arcAge / 16);
    if (!this.flying && this.wobble > 0) {
      this.wobble = Math.max(0, this.wobble - dt);
      this.pet.rotation = 0.09 * Math.sin(this.clock * 35) * this.wobble / 0.35;
    }
    const arrow = this.pullArrow.clear();
    if (this.emptyPulls >= 2 && !this.flying) {
      const x = this.seat.x - 65, y = this.seat.y + 55;
      arrow.moveTo(x + 30, y - 30).lineTo(x, y).lineTo(x + 28, y + 3)
        .moveTo(x, y).lineTo(x + 3, y - 28)
        .stroke({ width: 9, color: swatch.yellow.fill, alpha: 0.65 + 0.3 * Math.sin(this.clock * 4), cap: 'round', join: 'round' });
    }
    this.star.rotation = 0.2 * Math.sin(this.clock * 2);
    this.star.scale.set(1 + 0.08 * Math.sin(this.clock * 5));
    if (this.grab) this.drawSpring();
    const fl = this.flight;
    if (fl) {
      fl.t = Math.min(1, fl.t + dt / fl.duration);
      const { pts } = fl;
      const i = Math.min(pts.length - 2, Math.floor(fl.t * (pts.length - 1)));
      const k = fl.t * (pts.length - 1) - i;
      this.pet.position.set(pts[i].x + (pts[i + 1].x - pts[i].x) * k, pts[i].y + (pts[i + 1].y - pts[i].y) * k);
      this.pet.rotation = fl.t * Math.PI * 2;
      if (fl.t >= 1) {
        this.flight = null;
        fl.done();
      }
    }
  }

  destroy() {
    window.removeEventListener('pointerup', this.release);
    window.removeEventListener('pointercancel', this.cancel);
    this.grab = null;
    this.flight = null;
  }

  private placeStar() {
    const t = this.targets[this.shot];
    if (t === undefined) return;
    this.star.position.set(this.landX(padAt(t)), this.strip.y - 110);
  }

  private instruct(id: LineId, vars?: LineVars) {
    this.instruction = { id, vars };
    return this.ctx.instruct(id, vars);
  }

  private repeatInstruction() {
    if (!this.instruction || this.flying || this.finished || this.grab) return;
    this.pet.poke();
    sfx.giggle();
    void this.ctx.say(this.instruction.id, this.instruction.vars);
  }

  private async askShot() {
    this.wrongs = 0;
    this.drawHistory();
    this.hinting = this.plan.mode === 'free';
    this.placeStar();
    if (this.plan.mode === 'friend' && this.shot > 0) this.moveFriend();
    if (this.plan.mode === 'predict') this.showPredictionPull();
    if (this.course) {
      // The misses already made at this cloud (after a reload) count towards the hint.
      this.wrongs = this.tries;
      this.hinting = this.wrongs >= 2;
      this.report();
      if (this.told) return;
      this.told = true;
      return this.instruct('launch.star');
    }
    switch (this.plan.mode) {
      case 'tap':
        if (this.shot === 0) await this.instruct('launch.tap');
        return;
      case 'free':
        if (this.shot === 0) await this.instruct('launch.pull');
        return;
      case 'star':
        return this.instruct('launch.star');
      case 'number':
        return this.instruct('launch.number', { n: this.targets[this.shot] + 1 });
      case 'compare':
        if (this.last === undefined) return this.instruct('launch.pull');
        this.ask = nextAsk(this.last);
        return this.instruct(this.ask === 'farther' ? 'launch.farther' : 'launch.nearer');
      case 'predict':
        return this.instruct('launch.predict');
      case 'friend':
        return this.instruct('launch.feed', { friend: this.friendName });
    }
  }

  /** Keep the pull on a short leash behind and below the seat. */
  private pull(x: number, y: number) {
    this.rawPull = Math.hypot(x - this.seat.x, y - this.seat.y);
    let dx = Math.min(0, x - this.seat.x);
    let dy = Math.max(0, y - this.seat.y);
    const d = Math.hypot(dx, dy);
    if (d > MAX_PULL) {
      dx *= MAX_PULL / d;
      dy *= MAX_PULL / d;
    }
    this.pet.position.set(this.seat.x + dx, this.seat.y + dy);
    this.drawPreview();
  }

  private pullNow() {
    return Math.hypot(this.pet.x - this.seat.x, this.pet.y - this.seat.y);
  }

  /** Set the pet at a fixed, visible pull. The pure pull/landing mapping makes this repeatable on every device. */
  private showPredictionPull() {
    const target = this.targets[this.shot];
    const base = this.plan.mode === 'planet' ? this.pairs[this.shot]?.base : target === undefined ? undefined : padAt(target);
    if (base === undefined) return;
    const pull = pullFor(base);
    const d = { x: -0.35, y: 0.94 };
    const len = Math.hypot(d.x, d.y);
    this.pet.position.set(this.seat.x + (d.x / len) * pull, this.seat.y + (d.y / len) * pull);
    this.drawSpring();
  }

  /** Pick first, then watch the same fixed pull fly. A different guess teaches by showing, never by marking a miss. */
  private async predict(pad: number) {
    if (this.plan.mode !== 'predict' || this.flying || this.finished || this.prediction !== undefined) return;
    this.prediction = pad;
    const x = this.landX(padAt(pad));
    this.predictionRing.clear().ellipse(x, this.strip.y - 4, 67, 30).stroke({ width: 6, color: swatch.yellow.fill, alpha: 0.95 });
    sfx.pop(5);
    await this.ctx.say('launch.lets-see');
    if (!this.finished) void this.launch(padAt(this.targets[this.shot]));
  }

  private letGo(): boolean {
    this.preview.clear();
    const p = this.pullNow();
    if (p < MIN_PULL || this.flying || this.finished) return false;
    void this.launch(reach(p));
    return true;
  }

  /** While pulling: where this pull would land (always on easy levels, after a hint on target levels). */
  private drawPreview() {
    const g = this.preview.clear();
    if (!this.hinting) return;
    const f = this.stick ? this.controllerPower : reach(this.pullNow());
    const x1 = this.landX(f);
    const pts = this.arc(f);
    for (let i = 2; i < pts.length; i += 3) g.circle(pts[i].x, pts[i].y, 6).fill({ color: 0xffffff, alpha: 0.85 });
    g.ellipse(x1, this.strip.y - 4, 46, 14).stroke({ width: 5, color: 0xffffff, alpha: 0.9 });
    // A ring shows how far the right pull is: a circle around the seat for a pulled pet, and for a squashed
    // spring an outline where the red plate should be pushed down to.
    const t = this.targets[this.shot];
    const spot = this.spots[this.shot];
    if (spot !== undefined && !this.stick) g.circle(this.seat.x, this.seat.y, pullFor(spot)).stroke({ width: 4, color: swatch.yellow.fill, alpha: 0.7 });
    if (t !== undefined && (this.plan.mode === 'star' || this.plan.mode === 'number')) {
      if (this.stick) g.roundRect(this.seat.x - 68, this.seat.y + padAt(t) * SQUASH - 8, 136, 36, 14).stroke({ width: 5, color: swatch.yellow.fill, alpha: 0.85 });
      else g.circle(this.seat.x, this.seat.y, pullFor(padAt(t))).stroke({ width: 4, color: swatch.yellow.fill, alpha: 0.7 });
    }
  }

  /** The flight path for a landing at `f`, as points. */
  private arc(f: number) {
    const from = { ...this.seat };
    const to = { x: this.landX(f), y: this.strip.y - 20 };
    const h = 140 + 260 * f;
    return Array.from({ length: 31 }, (_, i) => {
      const t = i / 30;
      return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t - h * 4 * t * (1 - t) };
    });
  }

  private drawSpring() {
    const g = this.spring.clear();
    const base = { x: this.seat.x, y: this.strip.y + 4 };
    const top = this.flying ? this.seat : { x: this.pet.x, y: this.pet.y };
    g.roundRect(base.x - 70, base.y - 22, 140, 30, 12).fill(wood.fill).stroke({ width: 5, color: wood.line });
    const coils = 7;
    g.moveTo(base.x, base.y - 20);
    for (let i = 1; i <= coils; i++) {
      const t = i / coils;
      const x = base.x + (top.x - base.x) * t + (i % 2 ? -34 : 34);
      const y = base.y - 20 + (top.y + 10 - (base.y - 20)) * t;
      g.lineTo(x, y);
    }
    g.lineTo(top.x, top.y + 10);
    g.stroke({ width: 10, color: SPRING.line, join: 'round', cap: 'round' });
    g.roundRect(top.x - 60, top.y - 2, 120, 22, 10).fill(swatch.red.fill).stroke({ width: 5, color: swatch.red.line });
  }

  /** Wheee: up, over and down onto the grass or a cloud. */
  private async launch(f: number) {
    if (this.flying || this.finished) return;
    this.flying = true;
    // A squashed spring is not a pull: only a finger's pulls count toward the "bigger pull" journal entry.
    if (this.plan.mode !== 'tap' && this.plan.mode !== 'planet' && !this.stick) this.observedPulls.push(f);
    if (this.course) {
      this.tries++;
      this.report();
    }
    sfx.boing();
    // A challenge run goes launch after launch, so it stays quiet between them.
    if (!this.course) void this.ctx.say('launch.wee');
    const pts = this.arc(f);
    // Fly from where the pull let go.
    pts[0] = { x: this.pet.x, y: this.pet.y };
    this.drawSpring();
    await new Promise<void>((done) => (this.flight = { pts, t: 0, duration: (0.7 + 0.6 * f) * (this.plan.mode === 'planet' && this.planetPhase !== 'home' ? airtimeFor(this.pairs[this.shot].planet) : 1), done }));
    this.lastFlight = f;
    this.arcAge = 0;
    this.lastArc.alpha = 1;
    this.drawHistory();
    this.pet.rotation = 0;
    this.pet.y = this.strip.y - 20;
    const planet = this.plan.mode === 'planet' && this.planetPhase !== 'home' ? this.pairs[this.shot].planet : undefined;
    sfx.pop(planet === 'light' ? 5 : planet === 'heavy' ? 3 : 4);
    this.ctx.particles.burst(this.pet.x, this.pet.y, { colors: [0xffffff, 0xd6eefa], count: 14, speed: [80, 220], gravity: 300 * (planet ? gravityFor(planet) : 1), angle: -Math.PI / 2, spread: 1.6, size: [0.3, 0.6] });
    this.pet.poke();
    await this.landed(f);
  }

  private async landed(f: number) {
    if (this.plan.mode === 'planet') return this.planetLanded();
    const tw = this.ctx.tw;
    const verdict = this.plan.mode === 'friend' ? judgeFriend(f, this.spots[this.shot]) : judge(this.plan, f, this.targets[this.shot] ?? 0, this.ask, this.last, this.course?.padWidth);
    if (this.plan.mode === 'star' || this.plan.mode === 'number') this.off += Math.abs(f - padAt(this.targets[this.shot]));
    const firstCompare = this.plan.mode === 'compare' && this.last === undefined;
    const predicted = this.plan.mode === 'predict' ? this.prediction === this.targets[this.shot] : undefined;
    if (verdict === 'yes') {
      if (this.plan.mode === 'friend') {
        await this.feed();
      } else if (this.plan.mode === 'predict') {
        await this.ctx.say(predicted ? 'launch.predicted' : 'launch.revealed', { n: (this.targets[this.shot] ?? 0) + 1 });
      } else if (!firstCompare && this.plan.mode !== 'tap' && this.plan.mode !== 'free') {
        this.pet.cheer();
        sfx.sparkle();
        this.ctx.particles.burst(this.pet.x, this.pet.y - 100, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.yellow.fill], count: 18, speed: [120, 300], gravity: 0, life: [0.6, 1] });
        if (!this.course) await this.ctx.say('praise');
      } else {
        this.pet.cheer();
      }
      this.last = f;
      if (this.plan.mode === 'predict') this.predictionFlights.push(this.targets[this.shot]);
      this.drawFlag();
      this.shot++;
      this.prediction = undefined;
      this.predictionRing.clear();
      if (this.course) {
        this.done.push(this.tries);
        this.tries = 0;
        this.report(true);
      }
    } else {
      this.misses++;
      this.wrongs++;
      if (!this.course) await this.ctx.say(verdict === 'short' ? 'launch.short' : 'launch.long');
      if (this.wrongs >= 2 && !this.hinting) {
        this.hinting = true;
        this.hints++;
        this.assisted = true;
        this.report();
      }
    }
    this.drawHistory();
    // Hop back onto the spring (still squashed to the last power on a stick, so a retry is a nudge away).
    await tw.to(this.pet, { x: this.seat.x, y: this.restingY() }, { duration: 0.7, ease: ease.outBack });
    // A finger may have come back during the hop.
    this.pet.position.set(this.seat.x, this.restingY());
    this.flying = false;
    if (this.stick) this.squash();
    else this.drawSpring();
    const goal = this.course ? this.targets.length : this.plan.mode === 'compare' ? this.plan.shots + 1 : this.plan.shots;
    if (this.shot >= goal) return void this.finale();
    if (verdict === 'yes') await this.askShot();
  }

  /** Hand a course's numbers to the shell. `finished` means the cloud was just landed on, so none of its launches are "in progress". */
  private report(finished = false) {
    const run = this.ctx.couch?.course;
    if (!run || !this.course) return;
    run.progress({ board: this.shot, boards: this.targets.length, done: this.done.slice(), attempts: finished ? 0 : this.tries, par: 1, minimum: this.targets.length, assisted: this.assisted });
  }

  /** Previous flight in normalized strip coordinates, so a resize preserves the evidence. */
  private drawHistory() {
    const g = this.lastArc.clear();
    if (this.lastFlight !== undefined && this.plan.mode !== 'tap' && !this.ctx.couch) {
      const pts = this.arc(this.lastFlight);
      for (let i = 2; i < pts.length; i += 3) g.circle(pts[i].x, pts[i].y, 4).fill({ color: ink, alpha: 0.25 });
      // Feed the friend: a puff where the pet came down, so the next pull can be judged against it.
      if (this.plan.mode === 'friend') g.ellipse(this.landX(this.lastFlight), this.strip.y - 4, 40, 12).stroke({ width: 5, color: ink, alpha: 0.3 });
    }
    const ring = this.compareRing.clear();
    if (this.plan.mode === 'compare' && this.wrongs > 0 && this.last !== undefined && !this.ctx.couch) {
      ring.circle(this.seat.x, this.seat.y, pullFor(this.last)).stroke({ width: 4, color: swatch.red.fill, alpha: 0.5 });
    }
  }

  /** Compare keeps its reference flag; predictions keep a numbered flag for every watched cloud. */
  private drawFlag() {
    const g = this.flag.clear();
    this.flagNumbers.removeChildren().forEach((child) => child.destroy());
    const flights = this.plan.mode === 'compare' && this.last !== undefined ? [this.last]
      : this.plan.mode === 'predict' ? [...new Set(this.predictionFlights)].map(padAt)
      : this.plan.mode === 'planet' && this.planetPhase !== 'home' && this.pairs[this.shot] ? [this.pairs[this.shot].base] : [];
    for (const f of flights) {
      const x = this.landX(f), y = this.strip.y + 10;
      g.moveTo(x, y).lineTo(x, y - 90).stroke({ width: 6, color: wood.line, cap: 'round' });
      g.poly([x, y - 90, x + 50, y - 74, x, y - 58]).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line, join: 'round' });
      if (this.plan.mode === 'predict' || this.plan.mode === 'planet') {
        const n = label(String(this.plan.mode === 'planet' ? this.shot + 1 : Math.round(f * PADS + 0.5)), 24, 0xffffff);
        n.position.set(x + 17, y - 75);
        this.flagNumbers.addChild(n);
      }
    }
  }

  private async finale() {
    this.finished = true;
    sfx.tada();
    this.pet.cheer();
    await this.ctx.say('launch.done');
    await this.ctx.tw.wait(0.8);
    this.ctx.finish({
      misses: this.misses,
      hints: this.hints,
      score: Math.round(this.off * 100),
      discoveries: revealsPullRule(this.observedPulls, 0.15, !!this.ctx.couch, !!this.course) ? [entryId('bouncy-launch', 'bigger-pull')] : [],
    });
  }
}

class LaunchIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const g = new Graphics();
    g.roundRect(-70, -20, 140, 26, 10).fill(wood.fill).stroke({ width: 5, color: wood.line });
    g.moveTo(0, -18);
    for (let i = 1; i <= 6; i++) g.lineTo(i % 2 ? -26 : 26, -18 - i * 18);
    g.lineTo(0, -130).stroke({ width: 9, color: SPRING.line, join: 'round' });
    g.roundRect(-50, -140, 100, 20, 9).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line });
    const s = starArt(26);
    s.position.set(70, -190);
    const cloud = padArt(90);
    cloud.position.set(-60, -200);
    c.addChild(g, cloud, s);
    super(c);
  }
}

/** A spring, flight and far cloud for the discovery journal's pull-distance card. */
export function launchJournalPicture(): Container {
  const picture = new LaunchIcon();
  picture.rotation = -0.03;
  return picture;
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const cloud = padArt(160);
  cloud.y = 30;
  c.addChild(cloud);
  for (let i = 0; i < 3; i++) {
    const s = starArt(rng.range(14, 24));
    s.position.set(rng.range(-80, 80), rng.range(-120, -50));
    c.addChild(s);
  }
  return c;
}

export const bouncyLaunch: GameModule = {
  id: 'bouncy-launch',
  liveController: true,
  name: 'Bouncy Launch',
  titleLine: 'game.bouncy-launch',
  region: 'tinker-lab',
  skills: ['cause-and-effect', 'measurement', 'numbers'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.bubbles,
  coplayHint: 'Say "pull... and let go!" together, then guess where {name}\'s pet will land.',
  offScreen: 'Roll a ball down a ramp: tilt it more or less and see how far it goes.',
  hubIcon: () => new LaunchIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new BouncyLaunch(ctx),
};
