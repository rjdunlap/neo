import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS, FIRST_CAST } from '../../art/critter';
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
import { rangeFor } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  advance,
  BEATS,
  botMove,
  CELL_H,
  CELL_W,
  COMBO_IDS,
  comboOf,
  DIAL_PAD,
  dialsBot,
  castPending,
  castSize,
  friendsBot,
  PART_IDS,
  SPOT,
  toggleFriend,
  type PartId,
  canFinish,
  choose,
  conductorLayout,
  earlyDone,
  glowTarget,
  hint,
  listenAgain,
  makeRound,
  marksLit,
  newRequests,
  newScore,
  PACE_IDS,
  STRENGTH_IDS,
  STRENGTH_OF,
  PAD,
  planFor,
  select,
  selectStrength,
  SIGN,
  signBot,
  submit,
  type BeatEvent,
  type ConductorLayout,
  type PaceId,
  type Plan,
  type StrengthId,
  type Requests,
  type Round,
  type Score,
} from './logic';

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
  for (const x of [-46, 46])
    g.ellipse(x, 40, 16, 12).fill(swatch.green.light).stroke(line(swatch.green.line, 4));
  g.ellipse(70, 10, 24, 20)
    .fill(swatch.green.light)
    .stroke(line(swatch.green.line, 4))
    .circle(78, 4, 5)
    .fill(ink);
  g.moveTo(-70, 34)
    .bezierCurveTo(-70, -60, 70, -60, 70, 34)
    .closePath()
    .fill(swatch.brown.fill)
    .stroke(line(swatch.brown.line));
  for (const [x, y] of [
    [-30, 0],
    [0, -24],
    [30, 0],
    [0, 18],
  ])
    g.circle(x, y, 14).fill(swatch.brown.light);
  g.scale.set(0.8);
  g.y = -6;
  c.addChild(g);
  return c;
}

/** Level 4's pictures: the same drum, small for gentle and big for strong, so the size says the strength. */
function drumArt(pace: PaceId): Container {
  return drumPicture(STRENGTH_OF[pace] === 'strong');
}
function drumPicture(big: boolean): Container {
  const c = new Container();
  const g = prop('drum');
  g.scale.set(big ? 1.5 : 0.75);
  g.y = big ? -22 : 4;
  c.addChild(g);
  return c;
}

/** A pad's picture and word: the turtle or rabbit with the paces, a small or big drum at level 4. */
const padArt = (pace: PaceId, mode: Plan['mode']): Container =>
  mode === 'strength' ? drumArt(pace) : paceArt(pace);
const padWord = (pace: PaceId, mode: Plan['mode']): string =>
  mode === 'strength' ? (pace === 'turtle' ? 'soft' : 'loud') : pace === 'turtle' ? 'slow' : 'fast';

type Voice = 'marimba' | 'pluck' | 'drum';
const VOICES: Voice[] = ['marimba', 'pluck', 'drum'];

/** A friend's instrument, held in front of them: it flashes on the beats it plays. */
function prop(voice: Voice): Graphics {
  const g = new Graphics();
  if (voice === 'marimba') {
    g.roundRect(-70, 10, 140, 18, 6).fill(wood.fill).stroke(line(wood.line, 4));
    const bars = [swatch.red, swatch.orange, swatch.yellow, swatch.green, swatch.blue];
    bars.forEach((b, i) =>
      g
        .roundRect(-64 + i * 26, -26 + i * 4, 22, 40 - i * 4, 5)
        .fill(b.fill)
        .stroke(line(b.line, 3)),
    );
  } else if (voice === 'pluck') {
    g.ellipse(-14, 8, 34, 28)
      .fill(swatch.orange.fill)
      .stroke(line(swatch.orange.line, 4))
      .circle(-14, 8, 9)
      .fill(swatch.orange.line);
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
  constructor(
    name: keyof typeof CRITTERS,
    readonly voice: Voice,
  ) {
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
  /** Level 5's strength pads: the pad's slot (`pace`) says which drum, and its colours and word follow the strength. */
  readonly strength: boolean;
  /** The four beat marks under the pad; level 5 turns them off. */
  marksOn = true;
  constructor(
    readonly pace: PaceId,
    mode: Plan['mode'],
    onPress: () => void,
    strength = false,
  ) {
    super();
    this.strength = strength;
    this.glow
      .roundRect(-PAD / 2 - 18, -PAD / 2 - 18, PAD + 36, PAD + 36, 40)
      .fill({ color: 0xfff3a0, alpha: 0.9 });
    this.glow.visible = false;
    this.hintGlow
      .roundRect(-PAD / 2 - 22, -PAD / 2 - 22, PAD + 44, PAD + 44, 44)
      .fill({ color: 0xffe066, alpha: 0.95 });
    this.hintGlow.visible = false;
    this.picture = strength ? drumArt(pace) : padArt(pace, mode);
    const word = label(strength ? padWord(pace, 'strength') : padWord(pace, mode), 24, ink, '500');
    word.y = PAD / 2 - 24;
    this.lift.addChild(this.frame, this.picture, word, this.ring);
    this.addChild(this.hintGlow, this.glow, this.lift, this.marks);
    onTap(this, onPress, { cooldown: 150 });
    this.hitArea = new Rectangle(-PAD / 2, -PAD / 2, PAD, PAD);
  }

  draw(
    active: boolean,
    pending: boolean,
    waitLeft: number,
    lit: number,
    blink: boolean,
    heardEver: boolean,
    showEver: boolean,
  ) {
    const sw = this.strength
      ? this.pace === 'turtle'
        ? swatch.blue
        : swatch.red
      : this.pace === 'turtle'
        ? swatch.green
        : swatch.orange;
    // The playing pad has a thick dark frame and the other dims, so the difference never rests on colour alone.
    this.frame
      .clear()
      .roundRect(-PAD / 2, -PAD / 2, PAD, PAD, 32)
      .fill(active ? sw.light : 0xffffff)
      .stroke({ width: active ? 12 : 5, color: active ? ink : sw.line });
    this.lift.alpha = active || pending ? 1 : 0.82;
    this.ring.clear();
    if (pending) {
      // A ring that empties as the next beat comes, and a little clock face.
      const a0 = -Math.PI / 2;
      this.ring
        .moveTo(PAD / 2 - 28 + 20 * Math.cos(a0), -PAD / 2 + 28 + 20 * Math.sin(a0))
        .arc(PAD / 2 - 28, -PAD / 2 + 28, 20, a0, a0 + Math.PI * 2 * Math.max(0.02, waitLeft))
        .stroke({ width: 7, color: ink, cap: 'round' });
      this.ring
        .circle(PAD / 2 - 28, -PAD / 2 + 28, 9)
        .fill(0xffffff)
        .stroke({ width: 3, color: ink })
        .moveTo(PAD / 2 - 28, -PAD / 2 + 28)
        .lineTo(PAD / 2 - 28, -PAD / 2 + 22)
        .stroke({ width: 2, color: ink });
    }
    this.marks.clear();
    // Level 5 shows its hearing in the four-cell mark instead, one cell for each way to play.
    for (let i = 0; i < (this.marksOn ? BEATS : 0); i++) {
      const on = i < lit;
      const x = -54 + i * 36;
      if (on)
        this.marks
          .circle(x, PAD / 2 + 32, 13)
          .fill(sw.fill)
          .stroke({ width: 4, color: ink });
      else
        this.marks
          .circle(x, PAD / 2 + 32, 11)
          .fill(blink && active ? 0xfff3a0 : 0xffffff)
          .stroke({ width: 3, color: blink && active ? ink : 0xb9c6d1 });
    }
    if (showEver && heardEver)
      this.marks
        .moveTo(PAD / 2 + 10, PAD / 2 + 28)
        .lineTo(PAD / 2 + 20, PAD / 2 + 40)
        .lineTo(PAD / 2 + 38, PAD / 2 + 16)
        .stroke({ width: 7, color: swatch.green.line, cap: 'round', join: 'round' });
  }
}

/** What each friend's spotlight shows and says at level 6: the instrument they hold and the part it plays. */
const SPOT_VOICE: Record<PartId, { voice: Voice; word: string }> = {
  tune: { voice: 'marimba', word: 'tune' },
  bass: { voice: 'pluck', word: 'bass' },
  beat: { voice: 'drum', word: 'beat' },
};

/**
 * Level 6's spotlight under a friend: tap it to ask that friend in or out. It shows the friend's instrument and part,
 * a thick frame and a check while they are in, the clock ring while the change waits for the beat, and four dots for the beats heard.
 */
class Spot extends Container {
  readonly glow = new Graphics();
  readonly frame = new Graphics();
  readonly ring = new Graphics();
  readonly marks = new Graphics();
  readonly picture: Container;
  readonly lift = new Container();
  constructor(
    readonly part: PartId,
    onPress: () => void,
  ) {
    super();
    this.glow
      .roundRect(-SPOT / 2 - 16, -SPOT / 2 - 16, SPOT + 32, SPOT + 32, 38)
      .fill({ color: 0xfff3a0, alpha: 0.9 });
    this.glow.visible = false;
    this.picture = new Container();
    const held = prop(SPOT_VOICE[part].voice);
    held.scale.set(0.8);
    held.y = -6;
    this.picture.addChild(held);
    const word = label(SPOT_VOICE[part].word, 24, ink, '500');
    word.y = SPOT / 2 - 24;
    this.lift.addChild(this.frame, this.picture, word, this.ring);
    this.addChild(this.glow, this.lift, this.marks);
    onTap(this, onPress, { cooldown: 150 });
    this.hitArea = new Rectangle(-SPOT / 2, -SPOT / 2, SPOT, SPOT);
  }

  /** `playing`: the friend is in now. `waiting`: a change is queued, with `waitLeft` of a beat to go. */
  draw(playing: boolean, waiting: boolean, waitLeft: number, lit: number) {
    const sw = swatch.green;
    this.frame
      .clear()
      .roundRect(-SPOT / 2, -SPOT / 2, SPOT, SPOT, 32)
      .fill(playing ? sw.light : 0xffffff)
      .stroke({ width: playing ? 12 : 5, color: playing ? ink : sw.line });
    this.lift.alpha = playing || waiting ? 1 : 0.82;
    this.ring.clear();
    const cx = SPOT / 2 - 28;
    const cy = -SPOT / 2 + 28;
    if (waiting) {
      const a0 = -Math.PI / 2;
      this.ring
        .moveTo(cx + 20 * Math.cos(a0), cy + 20 * Math.sin(a0))
        .arc(cx, cy, 20, a0, a0 + Math.PI * 2 * Math.max(0.02, waitLeft))
        .stroke({ width: 7, color: ink, cap: 'round' });
      this.ring
        .circle(cx, cy, 9)
        .fill(0xffffff)
        .stroke({ width: 3, color: ink })
        .moveTo(cx, cy)
        .lineTo(cx, cy - 6)
        .stroke({ width: 2, color: ink });
    } else if (playing) {
      this.ring
        .moveTo(cx - 14, cy)
        .lineTo(cx - 4, cy + 11)
        .lineTo(cx + 14, cy - 12)
        .stroke({ width: 8, color: swatch.green.line, cap: 'round', join: 'round' });
    }
    this.marks.clear();
    for (let i = 0; i < BEATS; i++) {
      const on = playing && i < lit;
      this.marks
        .circle(-54 + i * 36, SPOT / 2 + 32, on ? 13 : 11)
        .fill(on ? sw.fill : 0xffffff)
        .stroke({ width: on ? 4 : 3, color: on ? ink : 0xb9c6d1 });
    }
  }
}

/** Level 5's four-cell hearing mark: a cell for each way to play, named by its animal and drum. */
class HearingMarks extends Container {
  private readonly cells: Graphics[] = [];
  constructor() {
    super();
    this.eventMode = 'none';
    for (const combo of COMBO_IDS) {
      const [pace, strength] = combo.split('-') as [PaceId, StrengthId];
      const cell = new Container();
      const frame = new Graphics();
      const animal = paceArt(pace);
      animal.scale.set(0.3);
      animal.position.set(-24, 2);
      const drum = drumPicture(strength === 'strong');
      drum.scale.set(0.42);
      drum.position.set(26, 4);
      cell.addChild(frame, animal, drum);
      this.cells.push(frame);
      this.addChild(cell);
    }
  }

  /** Puts each cell where the layout says (its centre). */
  place(rects: { x: number; y: number; w: number; h: number }[]) {
    rects.forEach((r, i) => this.children[i].position.set(r.x + r.w / 2, r.y + r.h / 2));
  }

  /** A check on each way heard whole; a thick frame and four dots on the way playing now. */
  draw(s: Score) {
    COMBO_IDS.forEach((combo, i) => {
      const g = this.cells[i];
      const current = s.pace !== null && comboOf(s.pace, s.strength) === combo;
      const ever = s.comboEver[combo];
      g.clear()
        .roundRect(-CELL_W / 2, -CELL_H / 2, CELL_W, CELL_H, 16)
        .fill(ever ? swatch.green.light : 0xffffff)
        .stroke({ width: current ? 8 : 3, color: current ? ink : 0xb9c6d1 });
      if (ever)
        g.moveTo(CELL_W / 2 - 30, -CELL_H / 2 + 14)
          .lineTo(CELL_W / 2 - 22, -CELL_H / 2 + 22)
          .lineTo(CELL_W / 2 - 8, -CELL_H / 2 + 6)
          .stroke({ width: 5, color: swatch.green.line, cap: 'round', join: 'round' });
      if (current)
        for (let b = 0; b < BEATS; b++)
          g.circle(-27 + b * 18, CELL_H / 2 - 14, 5.5)
            .fill(b < s.comboHeard[combo] ? swatch.green.fill : 0xffffff)
            .stroke({ width: 2, color: ink });
    });
  }
}

/** The listener's sign: a card with the same picture and word as the pad it asks for. */
class Sign extends Container {
  private readonly card = new Graphics();
  private picture?: Container;
  private word?: Container;
  constructor() {
    super();
    this.card
      .roundRect(-SIGN / 2, -SIGN / 2, SIGN, SIGN, 28)
      .fill(0xfffdf6)
      .stroke({ width: 8, color: ink });
    // The listener holds it up on two sticks.
    this.card
      .rect(-50, SIGN / 2, 10, 60)
      .fill(wood.fill)
      .rect(40, SIGN / 2, 10, 60)
      .fill(wood.fill);
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
  return new Graphics()
    .moveTo(-22, 0)
    .lineTo(-6, 18)
    .lineTo(24, -18)
    .stroke({ width: 11, color: 0xffffff, cap: 'round', join: 'round' });
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
  /** Level 5's strength pads, drawn beside the pace pads. */
  readonly strengthPads?: Record<StrengthId, Pad>;
  private readonly hearing?: HearingMarks;
  /** Level 6's spotlights, one under each friend, in `PART_IDS` order. */
  readonly spots?: Spot[];
  /** Level 5 draws its four pads at 150 units; the others at the full 180. */
  private readonly padScale: number;
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
    this.backdrop = new Backdrop(
      {
        sky: [0xd9c8f2, 0xfff6e0],
        hills: [0xc9b5ec, 0xb7e3d4, 0xa8dc8f],
        horizon: 0.62,
        clouds: 2,
        seed: 131,
      },
      ctx.view,
    );
    this.players = this.round.cast.map((name, i) => new Player(name, VOICES[i]));
    for (const p of this.players) ctx.track(p.critter);
    this.band.addChild(...this.players);
    this.band.eventMode = 'none';
    this.stand.eventMode = 'none';
    this.pads = {
      turtle: new Pad('turtle', this.plan.mode, () => this.tapPad('turtle')),
      rabbit: new Pad('rabbit', this.plan.mode, () => this.tapPad('rabbit')),
    };
    this.padScale = this.plan.mode === 'dials' ? DIAL_PAD / PAD : 1;
    if (this.plan.mode === 'dials') {
      this.strengthPads = {
        gentle: new Pad('turtle', this.plan.mode, () => this.tapStrength('gentle'), true),
        strong: new Pad('rabbit', this.plan.mode, () => this.tapStrength('strong'), true),
      };
      this.hearing = new HearingMarks();
      for (const pad of [...Object.values(this.pads), ...Object.values(this.strengthPads)]) {
        pad.marksOn = false;
        pad.scale.set(this.padScale);
      }
    }
    if (this.plan.mode === 'friends') {
      this.spots = PART_IDS.map((part) => new Spot(part, () => this.tapSpot(part)));
      for (const pad of Object.values(this.pads)) pad.visible = false;
    }
    this.listen = new RoundButton(musicNote(new Graphics(), 40, ink), swatch.white, 60, () =>
      this.tapListen(),
    );
    this.done = new RoundButton(checkArt(), swatch.green, 60, () => this.tapDone());
    ctx.stage.addChild(
      this.backdrop,
      this.stand,
      this.band,
      this.pads.turtle,
      this.pads.rabbit,
      this.listen,
      this.done,
    );
    if (this.spots) ctx.stage.addChild(...this.spots);
    if (this.strengthPads && this.hearing)
      ctx.stage.addChild(this.strengthPads.gentle, this.strengthPads.strong, this.hearing);
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

  start() {
    void this.begin();
  }

  private async begin() {
    await this.speak('little-conductor.intro', { name: this.ctx.childName });
    await this.ctx.instruct(
      this.plan.mode === 'lead'
        ? 'little-conductor.instruct-tap'
        : this.plan.mode === 'both'
          ? 'little-conductor.instruct-both'
          : this.plan.mode === 'strength'
            ? 'little-conductor.instruct-strength'
            : this.plan.mode === 'dials'
              ? 'little-conductor.instruct-dials'
              : this.plan.mode === 'friends'
                ? 'little-conductor.instruct-friends'
                : 'little-conductor.instruct-sign',
      { name: this.ctx.childName },
    );
    if (this.finished) return;
    this.ready = true;
    if (this.sign) void this.speak(`little-conductor.request-${this.round.requests[0]}` as const);
  }

  /** Feedback during play lowers the band to half while the pet talks; the clock keeps going. */
  private async speak(id: LineId, vars?: LineVars) {
    this.talking++;
    try {
      await this.ctx.say(id, vars);
    } finally {
      this.talking--;
    }
  }

  resize(v: View) {
    this.backdrop.resize(v);
    const l = (this.layout = conductorLayout(v, this.ctx.level));
    const s = l.stand;
    // The bandstand: a little roof on two posts over a wooden floor.
    this.stand
      .clear()
      .rect(s.x + 30, s.y + 40, 18, s.h - 60)
      .fill(wood.fill)
      .stroke(line(wood.line, 4))
      .rect(s.x + s.w - 48, s.y + 40, 18, s.h - 60)
      .fill(wood.fill)
      .stroke(line(wood.line, 4))
      .poly([s.x, s.y + 50, s.x + s.w / 2, s.y, s.x + s.w, s.y + 50])
      .fill(swatch.red.fill)
      .stroke(line(swatch.red.line))
      .roundRect(s.x + 10, s.y + s.h - 44, s.w - 20, 44, 14)
      .fill(wood.light)
      .stroke(line(wood.line));
    this.players.forEach((p, i) => p.position.set(l.friends[i].x, l.friends[i].y));
    for (const pace of PACE_IDS) {
      const r = l.pads[pace];
      this.pads[pace].position.set(r.x + r.w / 2, r.y + r.h / 2);
    }
    if (this.strengthPads && l.strengths)
      for (const id of STRENGTH_IDS) {
        const r = l.strengths[id];
        this.strengthPads[id].position.set(r.x + r.w / 2, r.y + r.h / 2);
      }
    if (l.cells) this.hearing?.place(l.cells);
    if (this.spots && l.spots)
      this.spots.forEach((sp, i) => sp.position.set(l.spots![i].x + SPOT / 2, l.spots![i].y + SPOT / 2));
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
      const r = advance(this.score, step, this.round.motif, this.plan.mode);
      this.score = r.score;
      for (const e of r.events) this.voice(e);
    }
    // Not at level 3: a turtle pulse there would point at an answer the sign may not ask for.
    const waitingForPlayer = this.spots
      ? castSize(this.score.cast) === 0 && !castPending(this.score) && !this.performing
      : this.score.pace === null && !this.invited;
    if (this.ready && !this.sign && waitingForPlayer) {
      this.idle += step;
      // An invitation, never a hint: the turtle pad pulses once after six quiet seconds.
      if (this.idle > 6) {
        // An empty stage is invited again and again; the other levels invite only once.
        if (this.spots) this.idle = 0;
        else this.invited = true;
        const target = this.spots?.[0] ?? this.pads.turtle;
        const base = this.spots ? 1 : this.padScale;
        void this.ctx.tw
          .to(target.scale, { x: 1.08 * base, y: 1.08 * base }, { duration: 0.25 })
          .then(() => this.ctx.tw.to(target.scale, { x: base, y: base }, { duration: 0.3 }));
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
      if (!pace || this.stopped || (this.sign && !this.playing)) {
        p.critter.rotation = 0;
        p.y = base.y;
        return;
      }
      if (this.spots) {
        // Level 6: only the friends who are in sway, to the one steady pace; the others stand still.
        const here = this.score.cast[PART_IDS[i]];
        p.critter.rotation = here ? Math.sin(Math.PI * t) * 0.06 : 0;
        p.y = base.y - (here ? 10 * bounce : 0);
      } else if (this.plan.mode === 'dials') {
        // Both dials at once: the pace sets how long the sway is and the strength how big it is.
        const k = this.score.strength === 'strong' ? 1 : 0.4;
        const slow = pace === 'turtle';
        p.critter.rotation = Math.sin(Math.PI * t) * (slow ? 0.1 : 0.05) * k;
        p.y = base.y - (slow ? 6 : 16) * k * bounce;
      } else if (this.plan.mode === 'strength') {
        // One steady pace: only the size of the sway says how strongly they play.
        const strong = STRENGTH_OF[pace] === 'strong';
        p.critter.rotation = Math.sin(Math.PI * t) * (strong ? 0.08 : 0.03);
        p.y = base.y - (strong ? 16 : 4) * bounce;
      } else if (pace === 'turtle') {
        p.critter.rotation = Math.sin(Math.PI * t) * 0.1;
        p.y = base.y - 4 * bounce;
      } else {
        p.critter.rotation = Math.sin(Math.PI * t) * 0.04;
        p.y = base.y - 14 * bounce;
      }
    });
  }

  private voice(e: BeatEvent) {
    const g = (this.talking > 0 ? 0.5 : 1) * e.gain;
    if (e.lead) {
      sfx.marimba(e.melody, 0.45 * g);
      this.players[0].glow = 1;
    }
    if (e.bass) {
      sfx.pluck(e.step === 0 ? 0 : 3, 0.3 * g);
      this.players[1].glow = 1;
    }
    if (e.drum) {
      sfx.drum(0.3 * g);
      this.players[2].glow = Math.max(this.players[2].glow, 0.8);
    }
    if (this.sign) {
      if (this.answering) {
        // The listener nods on every beat of a matched half.
        void this.ctx.tw
          .to(this.listener!, { rotation: 0.12 }, { duration: 0.1 })
          .then(() => this.ctx.tw.to(this.listener!, { rotation: 0 }, { duration: 0.15 }));
      }
      if (--this.budget <= 0) {
        const token = this.playToken;
        void this.ctx.tw.wait(60 / e.bpm).then(() => {
          if (token === this.playToken) this.phraseEnded();
        });
      }
      return;
    }
    if (this.performing) {
      sfx.clap();
      this.encore++;
      if (this.encore >= BEATS) void this.bow(60 / e.bpm);
    }
  }

  private draw() {
    const s = this.score;
    if (this.sign) {
      for (const pace of PACE_IDS) {
        const pad = this.pads[pace];
        pad.hintGlow.visible = this.hintPad === pace;
        pad.draw(
          this.requests.choice === pace,
          false,
          0,
          this.playing || s.pace === pace ? marksLit(s, pace) : 0,
          false,
          false,
          false,
        );
      }
      this.done.alpha = this.requests.choice && !this.busy && !this.answering ? 1 : 0.4;
      return;
    }
    if (this.spots) {
      this.spots.forEach((sp, i) => {
        const part = PART_IDS[i];
        const waiting = s.pendingCast[part] !== null;
        sp.draw(s.cast[part], waiting, waiting ? Math.max(0, s.played - s.beat) : 0, s.castHeard);
      });
      this.done.alpha = canFinish(s, this.ctx.level) || this.performing ? 1 : 0.4;
      return;
    }
    if (this.strengthPads && this.hearing) {
      for (const pace of PACE_IDS) {
        const pad = this.pads[pace];
        const pending = s.pending === pace;
        pad.draw(
          s.pace === pace,
          pending,
          pending ? Math.max(0, s.played - s.beat) : 0,
          0,
          false,
          false,
          false,
        );
      }
      for (const id of STRENGTH_IDS) {
        const pad = this.strengthPads[id];
        const pending = s.pendingStrength === id;
        pad.draw(
          s.pace !== null && s.strength === id,
          pending,
          pending ? Math.max(0, s.played - s.beat) : 0,
          0,
          false,
          false,
          false,
        );
      }
      this.hearing.draw(s);
      this.done.alpha = canFinish(s, this.ctx.level) || this.performing ? 1 : 0.4;
      return;
    }
    for (const pace of PACE_IDS) {
      const pad = this.pads[pace];
      const pending = s.pending === pace;
      pad.draw(
        s.pace === pace,
        pending,
        pending ? Math.max(0, s.played - s.beat) : 0,
        marksLit(s, pace),
        this.blink > 0 && Math.floor(this.blink * 5) % 2 === 0,
        s.heardEver[pace],
        this.plan.mode === 'both' || this.plan.mode === 'strength',
      );
    }
    this.done.alpha = canFinish(s, this.ctx.level) || this.performing ? 1 : 0.4;
  }

  tapPad(pace: PaceId) {
    if (!this.ready || this.performing || this.finished || this.answering) return;
    this.pressed(this.pads[pace]);
    if (this.sign) {
      // Level 3: the tap is her pick, and the band auditions the phrase at that pace once. Never counted.
      this.requests = choose(this.requests, pace);
      this.play(pace, false);
      return;
    }
    this.score = select(this.score, pace);
  }

  /** Level 5: a tap on the strength dial. */
  tapStrength(strength: StrengthId) {
    if (!this.ready || this.performing || this.finished) return;
    this.pressed(this.strengthPads![strength]);
    this.score = selectStrength(this.score, strength);
  }

  /** Level 6: a tap on a friend's spotlight asks them in or out, on the next beat (the first tap starts the band at once). */
  tapSpot(part: PartId) {
    if (!this.ready || this.performing || this.finished) return;
    this.pressed(this.spots![PART_IDS.indexOf(part)]);
    this.score = toggleFriend(this.score, part);
  }

  /** Touch-down feedback and the end of the invitation: the pad lifts and glows and its picture hops. */
  private pressed(pad: Pad | Spot) {
    pad.glow.visible = true;
    void this.ctx.tw
      .to(pad.lift, { y: -10 }, { duration: 0.08 })
      .then(() => this.ctx.tw.to(pad.lift, { y: 0 }, { duration: 0.18 }))
      .then(() => {
        pad.glow.visible = false;
      });
    void this.ctx.tw
      .to(pad.picture, { y: -18 }, { duration: 0.1 })
      .then(() => this.ctx.tw.to(pad.picture, { y: 0 }, { duration: 0.2 }));
    sfx.tick();
    this.idle = 0;
    this.invited = true;
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
      void this.ctx.tw
        .to(p, { rotation: 0.08 }, { duration: 0.08 })
        .then(() => this.ctx.tw.to(p, { rotation: -0.08 }, { duration: 0.12 }))
        .then(() => this.ctx.tw.to(p, { rotation: 0 }, { duration: 0.08 }));
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
      void this.ctx.tw
        .to(sign, { y: sign.y - 24 }, { duration: 0.12 })
        .then(() => this.ctx.tw.to(sign, { y: sign.y + 24 }, { duration: 0.2 }));
      this.busy = true;
      try {
        await this.speak(`little-conductor.wrong-${want}` as const);
      } finally {
        this.busy = false;
      }
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
      const why = earlyDone(this.score, this.ctx.level);
      void this.speak(
        (this.spots && why === 'hear-other'
          ? 'little-conductor.hear-other-friends'
          : `little-conductor.${why}`) as LineId,
      );
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
      void this.ctx.tw
        .to(p.critter, { rotation: 0.25 }, { duration: 0.3 })
        .then(() => this.ctx.tw.to(p.critter, { rotation: 0 }, { duration: 0.3 }));
    }
    this.ctx.particles.burst(this.layout.stand.x + this.layout.stand.w / 2, this.layout.stand.y + 60, {
      kind: 'confetti',
      colors: [swatch.red.fill, swatch.yellow.fill, swatch.green.fill, swatch.blue.fill],
      count: 40,
      speed: [200, 520],
      gravity: 600,
      life: [1, 1.6],
    });
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
    if (this.spots) {
      const move = friendsBot(this.score, this.ctx.level);
      if (!move) return null;
      if (move === 'done') return { tap: { on: this.done } };
      return { tap: { on: this.spots[PART_IDS.indexOf(move.friend)] } };
    }
    if (this.strengthPads) {
      const dial = dialsBot(this.score, this.ctx.level);
      if (!dial) return null;
      if (dial === 'done') return { tap: { on: this.done } };
      return { tap: { on: dial.dial === 'pace' ? this.pads[dial.id] : this.strengthPads[dial.id] } };
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
      .rect(-100, -190, 14, 120)
      .fill(wood.fill)
      .stroke(line(wood.line, 4))
      .rect(86, -190, 14, 120)
      .fill(wood.fill)
      .stroke(line(wood.line, 4))
      .poly([-120, -180, 0, -230, 120, -180])
      .fill(swatch.red.fill)
      .stroke(line(swatch.red.line, 5))
      .roundRect(-115, -80, 230, 30, 10)
      .fill(wood.light)
      .stroke(line(wood.line, 5));
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
  const names = FIRST_CAST.filter((n) => n !== 'bear' && n !== 'pip');
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
  upright: true,
  challenge: 'music',
  skills: ['listening', 'tempo', 'cause and effect', 'following a picture'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  // The band is the music; the island's loop stays silent so it never competes.
  music: silenced(STYLES.jelly),
  coplayHint:
    'One of you is the conductor and the other asks for "slow" or "fast"; then swap. With the sign, the grown-up can be the listener and say what it shows.',
  offScreen:
    'Hum a family song together: one of you holds up a hand for turtle or rabbit, and the other hums it slow or fast. Then swap.',
  hubIcon: () => new ConductorIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new LittleConductor(ctx),
};
