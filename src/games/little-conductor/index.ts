import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { musicNote } from '../../art/shapes';
import { Backdrop } from '../../art/scenery';
import { silenced, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { advance, BEATS, botMove, canFinish, choose, conductorLayout, earlyDone, glowTarget, hint, listenAgain, makeRound, marksLit, newRequests, newScore, PACE_IDS, PACES, PAD, planFor, select, SIGN, signBot, submit, type BeatEvent, type ConductorLayout, type PaceId, type Plan, type Requests, type Round, type Score } from './logic';

// Level 3's pictured requests (music M3) are for preschool and pre-K; toddlers stay with free play.
const LEVELS: BandLevels = {
  toddler: { min: 1, max: 2 },
  preschool: { min: 1, max: 3 },
  prek: { min: 2, max: 3 },
};

const line = (color: number, width = 6) => ({ width, color, cap: 'round' as const, join: 'round' as const });

/** The pace pictures: the same turtle and bunny Sound Garden uses for slow and fast. */
function paceArt(pace: PaceId): Container {
  const c = new Container();
  if (pace === 'rabbit') {
    const b = new Critter(CRITTERS.bunny);
    b.scale.set(0.42);
    b.y = 50;
    c.addChild(b);
    return c;
  }
  const g = new Graphics();
  for (const x of [-46, 46]) g.ellipse(x, 40, 16, 12).fill(swatch.green.light).stroke(line(swatch.green.line, 4));
  g.ellipse(70, 10, 24, 20).fill(swatch.green.light).stroke(line(swatch.green.line, 4)).circle(78, 4, 5).fill(ink);
  g.moveTo(-70, 34).bezierCurveTo(-70, -60, 70, -60, 70, 34).closePath().fill(swatch.brown.fill).stroke(line(swatch.brown.line));
  for (const [x, y] of [[-30, 0], [0, -24], [30, 0], [0, 18]]) g.circle(x, y, 14).fill(swatch.brown.light);
  g.scale.set(0.8);
  g.y = -6;
  c.addChild(g);
  return c;
}

type Voice = 'marimba' | 'pluck' | 'drum';
const VOICES: Voice[] = ['marimba', 'pluck', 'drum'];

/** A friend's instrument, held in front of them: it flashes on the beats it plays. */
function prop(voice: Voice): Graphics {
  const g = new Graphics();
  if (voice === 'marimba') {
    g.roundRect(-70, 10, 140, 18, 6).fill(wood.fill).stroke(line(wood.line, 4));
    const bars = [swatch.red, swatch.orange, swatch.yellow, swatch.green, swatch.blue];
    bars.forEach((b, i) => g.roundRect(-64 + i * 26, -26 + i * 4, 22, 40 - i * 4, 5).fill(b.fill).stroke(line(b.line, 3)));
  } else if (voice === 'pluck') {
    g.ellipse(-14, 8, 34, 28).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 4)).circle(-14, 8, 9).fill(swatch.orange.line);
    g.roundRect(16, -6, 64, 12, 4).fill(wood.fill).stroke(line(wood.line, 3));
    g.moveTo(-40, 8).lineTo(78, 0).stroke({ width: 2, color: ink });
  } else {
    g.roundRect(-40, -10, 80, 50, 12).fill(swatch.red.fill).stroke(line(swatch.red.line, 4));
    g.ellipse(0, -10, 40, 12).fill(0xfff4e3).stroke(line(swatch.red.line, 4));
  }
  return g;
}

/** A friend on the bandstand, with its instrument and a glow that flashes when it plays. */
class Player extends Container {
  readonly critter: Critter;
  readonly flash = new Graphics();
  readonly instrument: Graphics;
  glow = 0;
  constructor(name: keyof typeof CRITTERS, readonly voice: Voice) {
    super();
    this.critter = new Critter(CRITTERS[name]);
    this.critter.scale.set(0.62);
    this.flash.circle(0, 0, 90).fill({ color: 0xfff3a0, alpha: 1 });
    this.flash.position.set(0, -70);
    this.flash.alpha = 0;
    this.instrument = prop(voice);
    this.instrument.position.set(0, -40);
    this.addChild(this.flash, this.critter, this.instrument);
    this.eventMode = 'none';
  }
}

/** A pace pad: the animal, its word, the marks beneath it and the ring that counts down a change. */
class Pad extends Container {
  readonly glow = new Graphics();
  /** Level 3's hint: the pad the sign asks for glows until that half is matched. */
  readonly hintGlow = new Graphics();
  readonly frame = new Graphics();
  readonly ring = new Graphics();
  readonly marks = new Graphics();
  readonly picture: Container;
  readonly lift = new Container();
  constructor(readonly pace: PaceId, onPress: () => void) {
    super();
    this.glow.roundRect(-PAD / 2 - 18, -PAD / 2 - 18, PAD + 36, PAD + 36, 40).fill({ color: 0xfff3a0, alpha: 0.9 });
    this.glow.visible = false;
    this.hintGlow.roundRect(-PAD / 2 - 22, -PAD / 2 - 22, PAD + 44, PAD + 44, 44).fill({ color: 0xffe066, alpha: 0.95 });
    this.hintGlow.visible = false;
    this.picture = paceArt(pace);
    const word = label(pace === 'turtle' ? 'slow' : 'fast', 24, ink, '500');
    word.y = PAD / 2 - 24;
    this.lift.addChild(this.frame, this.picture, word, this.ring);
    this.addChild(this.hintGlow, this.glow, this.lift, this.marks);
    onTap(this, onPress, { cooldown: 150 });
    this.hitArea = new Rectangle(-PAD / 2, -PAD / 2, PAD, PAD);
  }

  draw(active: boolean, pending: boolean, waitLeft: number, lit: number, blink: boolean, heardEver: boolean, showEver: boolean) {
    const sw = this.pace === 'turtle' ? swatch.green : swatch.orange;
    // The playing pad has a thick dark frame and the other dims, so the difference never rests on colour alone.
    this.frame.clear().roundRect(-PAD / 2, -PAD / 2, PAD, PAD, 32).fill(active ? sw.light : 0xffffff).stroke({ width: active ? 12 : 5, color: active ? ink : sw.line });
    this.lift.alpha = active || pending ? 1 : 0.82;
    this.ring.clear();
    if (pending) {
      // A ring that empties as the next beat comes, and a little clock face.
      const a0 = -Math.PI / 2;
      this.ring.moveTo(PAD / 2 - 28 + 20 * Math.cos(a0), -PAD / 2 + 28 + 20 * Math.sin(a0))
        .arc(PAD / 2 - 28, -PAD / 2 + 28, 20, a0, a0 + Math.PI * 2 * Math.max(0.02, waitLeft)).stroke({ width: 7, color: ink, cap: 'round' });
      this.ring.circle(PAD / 2 - 28, -PAD / 2 + 28, 9).fill(0xffffff).stroke({ width: 3, color: ink })
        .moveTo(PAD / 2 - 28, -PAD / 2 + 28).lineTo(PAD / 2 - 28, -PAD / 2 + 22).stroke({ width: 2, color: ink });
    }
    this.marks.clear();
    for (let i = 0; i < BEATS; i++) {
      const on = i < lit;
      const x = -54 + i * 36;
      if (on) this.marks.circle(x, PAD / 2 + 32, 13).fill(sw.fill).stroke({ width: 4, color: ink });
      else this.marks.circle(x, PAD / 2 + 32, 11).fill(blink && active ? 0xfff3a0 : 0xffffff).stroke({ width: 3, color: blink && active ? ink : 0xb9c6d1 });
    }
    if (showEver && heardEver) this.marks.moveTo(PAD / 2 + 10, PAD / 2 + 28).lineTo(PAD / 2 + 20, PAD / 2 + 40).lineTo(PAD / 2 + 38, PAD / 2 + 16).stroke({ width: 7, color: swatch.green.line, cap: 'round', join: 'round' });
  }
}

/** The listener's sign: a card with the same picture and word as the pad it asks for. */
class Sign extends Container {
  private readonly card = new Graphics();
  private picture?: Container;
  private word?: Container;
  constructor() {
    super();
    this.card.roundRect(-SIGN / 2, -SIGN / 2, SIGN, SIGN, 28).fill(0xfffdf6).stroke({ width: 8, color: ink });
    // The listener holds it up on two sticks.
    this.card.rect(-50, SIGN / 2, 10, 60).fill(wood.fill).rect(40, SIGN / 2, 10, 60).fill(wood.fill);
    this.addChild(this.card);
    this.eventMode = 'none';
  }

  show(pace: PaceId) {
    this.picture?.destroy({ children: true });
    this.word?.destroy();
    this.picture = paceArt(pace);
    this.picture.scale.set(1.05);
    this.picture.y = -10;
    this.word = label(pace === 'turtle' ? 'slow' : 'fast', 26, ink, '600');
    this.word.y = SIGN / 2 - 28;
    this.addChild(this.picture, this.word);
  }
}

function checkArt(): Graphics {
  return new Graphics().moveTo(-22, 0).lineTo(-6, 18).lineTo(24, -18).stroke({ width: 11, color: 0xffffff, cap: 'round', join: 'round' });
}

class LittleConductor implements Game {
  readonly plan: Plan;
  readonly round: Round;
  score: Score = newScore();
  misses = 0;
  hints = 0;
  /** True once the instruction has been spoken: until then the pads do nothing, so speech never competes with the band. */
  ready = false;
  /** Done was pressed at the gate: the band plays the tune once more and bows; pads do nothing. */
  performing = false;
  finished = false;
  readonly pads: Record<PaceId, Pad>;
  readonly listen: RoundButton;
  readonly done: RoundButton;
  readonly players: Player[];
  private readonly backdrop: Backdrop;
  private readonly stand = new Graphics();
  private readonly band = new Container();
  private layout!: ConductorLayout;
  private stopped = false;
  private encore = 0;
  private idle = 0;
  private invited = false;
  private blink = 0;
  private talking = 0;
  /** Level 3: the sign's requests and what its Checks have counted. */
  requests: Requests = newRequests();
  /** Level 3: a phrase is sounding (an audition, a hint's preview or a matched half); the band holds between them. */
  playing = false;
  /** Level 3: the phrase sounding is a matched half, so the listener nods and the sign turns after it. */
  private answering = false;
  /** Level 3: a wrong Check's words are still being said, so another Check waits. */
  private busy = false;
  private budget = 0;
  private playToken = 0;
  private hintPad: PaceId | null = null;
  private readonly sign?: Sign;
  private readonly listener?: Critter;
  readonly hintLabel?: string;
  askForHint?: () => void;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.round = makeRound(ctx.rng);
    this.backdrop = new Backdrop({ sky: [0xd9c8f2, 0xfff6e0], hills: [0xc9b5ec, 0xb7e3d4, 0xa8dc8f], horizon: 0.62, clouds: 2, seed: 131 }, ctx.view);
    this.players = this.round.cast.map((name, i) => new Player(name, VOICES[i]));
    for (const p of this.players) ctx.track(p.critter);
    this.band.addChild(...this.players);
    this.band.eventMode = 'none';
    this.stand.eventMode = 'none';
    this.pads = { turtle: new Pad('turtle', () => this.tapPad('turtle')), rabbit: new Pad('rabbit', () => this.tapPad('rabbit')) };
    this.listen = new RoundButton(musicNote(new Graphics(), 40, ink), swatch.white, 60, () => this.tapListen());
    this.done = new RoundButton(checkArt(), swatch.green, 60, () => this.tapDone());
    ctx.stage.addChild(this.backdrop, this.stand, this.band, this.pads.turtle, this.pads.rabbit, this.listen, this.done);
    if (this.plan.mode === 'sign') {
      this.listener = new Critter(CRITTERS[this.round.listener]);
      this.listener.scale.set(0.5);
      this.listener.eventMode = 'none';
      ctx.track(this.listener);
      this.sign = new Sign();
      this.sign.show(this.round.requests[0]);
      ctx.stage.addChild(this.listener, this.sign);
      this.hintLabel = 'Show a hint';
      this.askForHint = () => this.showHint();
    }
    this.resize(ctx.view);
    this.draw();
  }

  start() { void this.begin(); }

  private async begin() {
    await this.speak('little-conductor.intro', { name: this.ctx.childName });
    await this.ctx.instruct(this.plan.mode === 'lead' ? 'little-conductor.instruct-tap' : this.plan.mode === 'both' ? 'little-conductor.instruct-both' : 'little-conductor.instruct-sign');
    if (this.finished) return;
    this.ready = true;
    if (this.sign) void this.speak(`little-conductor.request-${this.round.requests[0]}` as const);
  }

  /** Feedback during play lowers the band to half while the pet talks; the clock keeps going. */
  private async speak(id: LineId, vars?: LineVars) {
    this.talking++;
    try { await this.ctx.say(id, vars); } finally { this.talking--; }
  }

  resize(v: View) {
    this.backdrop.resize(v);
    const l = (this.layout = conductorLayout(v, this.ctx.level));
    const s = l.stand;
    // The bandstand: a little roof on two posts over a wooden floor.
    this.stand.clear()
      .rect(s.x + 30, s.y + 40, 18, s.h - 60).fill(wood.fill).stroke(line(wood.line, 4))
      .rect(s.x + s.w - 48, s.y + 40, 18, s.h - 60).fill(wood.fill).stroke(line(wood.line, 4))
      .poly([s.x, s.y + 50, s.x + s.w / 2, s.y, s.x + s.w, s.y + 50]).fill(swatch.red.fill).stroke(line(swatch.red.line))
      .roundRect(s.x + 10, s.y + s.h - 44, s.w - 20, 44, 14).fill(wood.light).stroke(line(wood.line));
    this.players.forEach((p, i) => p.position.set(l.friends[i].x, l.friends[i].y));
    for (const pace of PACE_IDS) {
      const r = l.pads[pace];
      this.pads[pace].position.set(r.x + r.w / 2, r.y + r.h / 2);
    }
    this.listen.position.set(l.listen.x, l.listen.y);
    this.done.position.set(l.done.x, l.done.y);
    if (this.sign && l.sign && l.listener) {
      this.sign.position.set(l.sign.x + l.sign.w / 2, l.sign.y + l.sign.h / 2);
      this.listener!.position.set(l.listener.x, l.listener.y);
    }
  }

  update(dt: number) {
    if (this.finished && this.stopped) return;
    // A frame after the app was in the background can be long; never let it fire a burst of notes.
    const step = Math.min(dt, 0.1);
    // After the encore's last beat the clock stops, so no fifth note sounds while the band bows.
    const holding = this.plan.mode === 'sign' && this.budget <= 0;
    if (this.ready && !this.stopped && !holding && !(this.performing && this.encore >= BEATS)) {
      const r = advance(this.score, step, this.round.motif);
      this.score = r.score;
      for (const e of r.events) this.voice(e);
    }
    // Not at level 3: a turtle pulse there would point at an answer the sign may not ask for.
    if (this.ready && !this.sign && this.score.pace === null && !this.invited) {
      this.idle += step;
      // An invitation, never a hint: the turtle pad pulses once after six quiet seconds.
      if (this.idle > 6) {
        this.invited = true;
        void this.ctx.tw.to(this.pads.turtle.scale, { x: 1.08, y: 1.08 }, { duration: 0.25 }).then(() => this.ctx.tw.to(this.pads.turtle.scale, { x: 1, y: 1 }, { duration: 0.3 }));
      }
    }
    if (this.blink > 0) this.blink = Math.max(0, this.blink - step);
    this.sway();
    this.draw();
  }

  /** The friends bob in time: long slow sways for the turtle, quick little bounces for the rabbit. */
  private sway() {
    const pace = this.score.pace;
    const t = this.score.beat;
    const bounce = Math.abs(Math.sin(Math.PI * t));
    this.players.forEach((p, i) => {
      p.glow = Math.max(0, p.glow - 0.06);
      p.flash.alpha = p.glow * 0.7;
      const base = this.layout.friends[i];
      if (!pace || this.stopped || (this.sign && !this.playing)) { p.critter.rotation = 0; p.y = base.y; return; }
      if (pace === 'turtle') { p.critter.rotation = Math.sin(Math.PI * t) * 0.1; p.y = base.y - 4 * bounce; }
      else { p.critter.rotation = Math.sin(Math.PI * t) * 0.04; p.y = base.y - 14 * bounce; }
    });
  }

  private voice(e: BeatEvent) {
    const g = this.talking > 0 ? 0.5 : 1;
    sfx.marimba(e.melody, 0.45 * g);
    this.players[0].glow = 1;
    if (e.bass) { sfx.pluck(e.step === 0 ? 0 : 3, 0.3 * g); this.players[1].glow = 1; }
    if (e.drum) { sfx.drum(0.3 * g); this.players[2].glow = Math.max(this.players[2].glow, 0.8); }
    if (this.sign) {
      if (this.answering) {
        // The listener nods on every beat of a matched half.
        void this.ctx.tw.to(this.listener!, { rotation: 0.12 }, { duration: 0.1 }).then(() => this.ctx.tw.to(this.listener!, { rotation: 0 }, { duration: 0.15 }));
      }
      if (--this.budget <= 0) {
        const token = this.playToken;
        void this.ctx.tw.wait(60 / PACES[e.pace]).then(() => { if (token === this.playToken) this.phraseEnded(); });
      }
      return;
    }
    if (this.performing) {
      sfx.clap();
      this.encore++;
      if (this.encore >= BEATS) void this.bow(60 / PACES[e.pace]);
    }
  }

  private draw() {
    const s = this.score;
    if (this.sign) {
      for (const pace of PACE_IDS) {
        const pad = this.pads[pace];
        pad.hintGlow.visible = this.hintPad === pace;
        pad.draw(this.requests.choice === pace, false, 0, this.playing || s.pace === pace ? marksLit(s, pace) : 0, false, false, false);
      }
      this.done.alpha = this.requests.choice && !this.busy && !this.answering ? 1 : 0.4;
      return;
    }
    for (const pace of PACE_IDS) {
      const pad = this.pads[pace];
      const pending = s.pending === pace;
      pad.draw(s.pace === pace, pending, pending ? Math.max(0, s.played - s.beat) : 0, marksLit(s, pace), this.blink > 0 && Math.floor(this.blink * 5) % 2 === 0, s.heardEver[pace], this.plan.mode === 'both');
    }
    this.done.alpha = canFinish(s, this.ctx.level) || this.performing ? 1 : 0.4;
  }

  tapPad(pace: PaceId) {
    if (!this.ready || this.performing || this.finished || this.answering) return;
    const pad = this.pads[pace];
    // Touch-down feedback: the pad lifts and glows and its animal hops.
    pad.glow.visible = true;
    void this.ctx.tw.to(pad.lift, { y: -10 }, { duration: 0.08 }).then(() => this.ctx.tw.to(pad.lift, { y: 0 }, { duration: 0.18 })).then(() => { pad.glow.visible = false; });
    void this.ctx.tw.to(pad.picture, { y: -18 }, { duration: 0.1 }).then(() => this.ctx.tw.to(pad.picture, { y: 0 }, { duration: 0.2 }));
    sfx.tick();
    this.idle = 0;
    this.invited = true;
    if (this.sign) {
      // Level 3: the tap is her pick, and the band auditions the phrase at that pace once. Never counted.
      this.requests = choose(this.requests, pace);
      this.play(pace, false);
      return;
    }
    this.score = select(this.score, pace);
  }

  tapListen() {
    if (!this.ready || this.performing || this.finished || this.answering) return;
    if (this.sign) {
      if (this.requests.choice) this.play(this.requests.choice, false);
      else this.wigglePads();
      return;
    }
    this.score = listenAgain(this.score);
  }

  /** Level 3: the band plays the current phrase once from its first note, then holds. */
  private play(pace: PaceId, answer: boolean) {
    this.playToken++;
    this.answering = answer;
    this.playing = true;
    this.score = select(newScore(), pace);
    this.budget = BEATS;
  }

  /** Level 3: stop a phrase where it is, so the band holds while the pet talks about a Check. */
  private hold() {
    this.playToken++;
    this.budget = 0;
    this.playing = false;
  }

  private phraseEnded() {
    this.playing = false;
    if (!this.answering || this.stopped) return;
    this.answering = false;
    if (this.requests.done) {
      void this.bow(0);
      return;
    }
    // The sign turns to the second half's request.
    this.hintPad = null;
    this.score = newScore();
    const next = this.round.requests[this.requests.phrase];
    const sign = this.sign!;
    void this.ctx.tw.to(sign.scale, { x: 0 }, { duration: 0.15 }).then(() => {
      sign.show(next);
      return this.ctx.tw.to(sign.scale, { x: 1 }, { duration: 0.15 });
    });
    void this.speak(`little-conductor.request-${next}` as const);
  }

  private wigglePads() {
    for (const pace of PACE_IDS) {
      const p = this.pads[pace];
      void this.ctx.tw.to(p, { rotation: 0.08 }, { duration: 0.08 }).then(() => this.ctx.tw.to(p, { rotation: -0.08 }, { duration: 0.12 })).then(() => this.ctx.tw.to(p, { rotation: 0 }, { duration: 0.08 }));
    }
  }

  /** Level 3's Check. A wrong pick is a gentle boing, the sign bounces and the pet names the pace it asks for. */
  private async checkSign() {
    if (this.busy || this.answering) return;
    const picked = this.requests.choice;
    const { state, result, glow } = submit(this.requests, this.round);
    this.requests = state;
    this.misses = state.misses;
    this.hints = state.hints;
    if (result === 'pick-first') {
      this.wigglePads();
      void this.speak('little-conductor.pick-first');
      return;
    }
    this.hold();
    if (result === 'wrong') {
      const want = this.round.requests[state.phrase];
      sfx.boing();
      const sign = this.sign!;
      void this.ctx.tw.to(sign, { y: sign.y - 24 }, { duration: 0.12 }).then(() => this.ctx.tw.to(sign, { y: sign.y + 24 }, { duration: 0.2 }));
      this.busy = true;
      try {
        await this.speak(`little-conductor.wrong-${want}` as const);
      } finally { this.busy = false; }
      if (glow && !this.finished) this.giveHint(want);
      return;
    }
    // A match: the half plays at that pace while the listener nods, then the sign turns or the band bows.
    void this.speak('little-conductor.match');
    this.play(picked!, true);
  }

  /** The requested pad glows and the band previews that pace once. */
  private giveHint(want: PaceId) {
    this.hintPad = want;
    void this.speak(`little-conductor.hint-${want}` as const);
    this.play(want, false);
  }

  /** The pause sheet's Show a hint: counted once per half, the words and glow again if asked twice. */
  private showHint() {
    if (!this.ready || this.finished || this.answering || this.requests.done) return;
    const h = hint(this.requests);
    this.requests = h.state;
    this.hints = h.state.hints;
    this.giveHint(glowTarget(this.round, this.requests));
  }

  tapDone() {
    if (!this.ready || this.performing || this.finished) return;
    if (this.sign) {
      void this.checkSign();
      return;
    }
    if (!canFinish(this.score, this.ctx.level)) {
      // Never counted: the dots still to hear blink and the pet says what Done is waiting for.
      this.blink = 1.2;
      void this.speak(`little-conductor.${earlyDone(this.score, this.ctx.level)}` as const);
      return;
    }
    this.performing = true;
    this.encore = 0;
    this.score = listenAgain(this.score);
  }

  private async bow(lastBeat: number) {
    if (this.finished) return;
    this.finished = true;
    await this.ctx.tw.wait(lastBeat);
    this.stopped = true;
    sfx.tada();
    this.ctx.pet.cheer();
    this.listener?.cheer();
    for (const p of this.players) {
      p.critter.cheer();
      void this.ctx.tw.to(p.critter, { rotation: 0.25 }, { duration: 0.3 }).then(() => this.ctx.tw.to(p.critter, { rotation: 0 }, { duration: 0.3 }));
    }
    this.ctx.particles.burst(this.layout.stand.x + this.layout.stand.w / 2, this.layout.stand.y + 60, { kind: 'confetti', colors: [swatch.red.fill, swatch.yellow.fill, swatch.green.fill, swatch.blue.fill], count: 40, speed: [200, 520], gravity: 600, life: [1, 1.6] });
    await this.speak('little-conductor.bow');
    await this.ctx.tw.wait(0.3);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /** The ghost finger: the turtle, the rabbit once the turtle was heard whole, then Done when it lights. */
  autotouch(): TouchIntent | null {
    if (!this.ready || this.performing || this.finished) return null;
    if (this.sign) {
      // Read the sign, tap that pad, let its audition finish, then Check.
      if (this.playing || this.busy || this.answering) return null;
      const move = signBot(this.round, this.requests);
      if (!move) return null;
      return { tap: { on: move === 'check' ? this.done : this.pads[move] } };
    }
    const move = botMove(this.score, this.ctx.level);
    if (!move) return null;
    if (move === 'done') return { tap: { on: this.done } };
    return { tap: { on: this.pads[move] } };
  }

  destroy() {
    this.finished = true;
    this.stopped = true;
    this.playToken++;
    this.budget = 0;
    this.ready = false;
    this.score = { ...this.score, pending: null };
  }
}

class ConductorIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const g = new Graphics()
      .rect(-100, -190, 14, 120).fill(wood.fill).stroke(line(wood.line, 4))
      .rect(86, -190, 14, 120).fill(wood.fill).stroke(line(wood.line, 4))
      .poly([-120, -180, 0, -230, 120, -180]).fill(swatch.red.fill).stroke(line(swatch.red.line, 5))
      .roundRect(-115, -80, 230, 30, 10).fill(wood.light).stroke(line(wood.line, 5));
    c.addChild(g);
    const note = musicNote(new Graphics(), 46, ink);
    note.position.set(0, -140);
    c.addChild(note);
    const turtle = paceArt('turtle');
    turtle.scale.set(0.42);
    turtle.position.set(-56, -24);
    const rabbit = paceArt('rabbit');
    rabbit.scale.set(0.42);
    rabbit.position.set(56, -24);
    c.addChild(turtle, rabbit);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const names = (Object.keys(CRITTERS) as (keyof typeof CRITTERS)[]).filter((n) => n !== 'bear' && n !== 'pip');
  const friend = new Critter(CRITTERS[rng.pick(names)]);
  friend.scale.set(0.5);
  friend.position.set(-20, 70);
  const held = prop(rng.pick(VOICES));
  held.scale.set(0.7);
  held.position.set(-20, 40);
  const pace = paceArt(rng.chance(0.5) ? 'turtle' : 'rabbit');
  pace.scale.set(0.42);
  pace.position.set(70, 50);
  c.addChild(friend, held, pace);
  return c;
}

export const littleConductor: GameModule = {
  id: 'little-conductor',
  name: 'Little Conductor',
  titleLine: 'game.little-conductor',
  region: 'music-mountain',
  skills: ['listening', 'tempo', 'cause and effect', 'following a picture'],
  bands: ['toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  // The band is the music; the island's loop stays silent so it never competes.
  music: silenced(STYLES.jelly),
  coplayHint: 'One of you is the conductor and the other asks for "slow" or "fast"; then swap. With the sign, the grown-up can be the listener and say what it shows.',
  offScreen: 'Hum a family song together: one of you holds up a hand for turtle or rabbit, and the other hums it slow or fast. Then swap.',
  hubIcon: () => new ConductorIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new LittleConductor(ctx),
};
