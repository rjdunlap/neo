import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { RAINBOW, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { musicNote } from '../../art/shapes';
import { silenced, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { ANIMALS, VOICES, farmAnimals, makeSong, nextInvite, pickTune, planFor, tunesFor, type Animal, type Note, type SingPlan, type Tune } from './logic';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  toddler: { min: 1, max: 3 },
  preschool: { min: 2, max: 3 },
  prek: { min: 3, max: 6 },
};

const GRASS = 0x9edb86;
const BARN_RED = 0xd9534f;
const BARN_DARK = 0x9e2f2c;
const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** How big a friend is on the bottom row, at the barn door while it sings, and when it is a choice. */
const SCALE = { rest: 0.45, door: 0.78, choice: 0.55 };
/** A friend's body is about this far above its feet, in its own units; taps aim at the body, not the feet. */
const BODY_Y = -120;

/** `wait`: a verse has just ended and the next friend is not yet offered; nothing takes a touch. */
type Phase = 'tune' | 'invite' | 'sing' | 'wait' | 'done';

class SingAlongBarn implements Game {
  private readonly plan: SingPlan;
  /** The song this round sings, drawn from the seed before the friends are. */
  private tune: Tune;
  private readonly backdrop: Backdrop;
  private readonly barn = new Graphics();
  private readonly barnWrap = new Container();
  private readonly beads = new Graphics();
  private readonly windows = new Graphics();
  private readonly friends = new Map<Animal, Critter>();
  private readonly tapLayer = new Graphics();
  /** With `chooseTune`: one big card for each song, in `TUNES` order. */
  private readonly tuneCards: Container[] = [];
  private order: Animal[];
  private song: Note[] = [];
  private view: View;
  private phase: Phase;
  private idx = 0;
  private singer: Animal | null = null;
  private invited: Animal[] = [];
  /** Friends already on the bottom row, in the order they sang. */
  private placed: Animal[] = [];
  private clock = 0;
  private bounce = 0;

  constructor(private readonly ctx: GameContext) {
    // The card's demonstration of choosing a friend for each verse sings two of them: three Old MacDonald verses
    // would not finish inside its 75 seconds at the hand's pace; nor would the whole Old MacDonald verse (59 notes for
    // one friend), so the demonstration sings the short form with one friend.
    const plan = planFor(ctx.level);
    this.plan = ctx.demo && plan.each ? { ...plan, verses: plan.full ? 1 : 2, full: false } : plan;
    this.tune = this.plan.chooseTune ? tunesFor(this.plan)[0] : pickTune(ctx.rng);
    this.view = ctx.view;
    this.phase = this.plan.chooseTune ? 'tune' : this.plan.invite && !this.plan.each ? 'invite' : 'sing';
    this.order = this.plan.invite ? [] : farmAnimals(this.plan, ctx.rng);
    this.backdrop = ctx.track(
      new Backdrop({ sky: [0xa9dcff, 0xfff4d6], hills: [0xcdeeb6, GRASS], horizon: 0.56, clouds: 3, sun: true, seed: 33 }, ctx.view),
    );
    this.barnWrap.addChild(this.barn);
    // Everything that could ever be asked for exists from the start, so a round never builds a critter mid-song.
    for (const a of this.plan.invite ? ANIMALS : this.order) {
      const c = ctx.track(new Critter(CRITTERS[a]));
      c.visible = false;
      this.friends.set(a, c);
    }
    ctx.stage.addChild(this.backdrop, this.barnWrap, this.windows, this.beads, ...this.friends.values(), this.tapLayer);
    // Sound and movement answer in the same frame: nothing here waits on speech.
    this.tapLayer.eventMode = 'none';
    onTap(this.tapLayer, (e) => this.tapScene(e.global.x, e.global.y), { cooldown: 90 });
    this.tapLayer.eventMode = this.phase === 'sing' ? 'static' : 'none';
    this.tapLayer.cursor = 'pointer';
    if (this.plan.chooseTune) {
      tunesFor(this.plan).forEach((t) => {
        const card = new Container();
        card.visible = false;
        card.addChild(drawTuneCard(t));
        onTap(card, () => this.chooseTune(t), { cooldown: 250 });
        // A card is 220 across by 200 tall: far over the smallest target, and two never touch.
        card.hitArea = new Rectangle(-110, -100, 220, 200);
        this.tuneCards.push(card);
      });
      ctx.stage.addChild(...this.tuneCards);
    }
    if (this.plan.invite) {
      ANIMALS.forEach((a) => {
        const c = this.friends.get(a)!;
        onTap(c, () => this.invite(a), { cooldown: 250 });
        // The body, not the feet: about 110 screen units across at the size of a choice, so neighbors never share a touch.
        c.hitArea = new Circle(0, BODY_Y, 100);
      });
    }
    // A round that chooses all its friends first builds the song once the barn is full; the others start singing now
    // (choosing one at a time starts with the opening, which nobody answers).
    if (!this.plan.invite || this.plan.each) this.song = makeSong(this.order, this.tune);
  }

  start() {
    if (this.phase === 'tune') {
      this.tuneCards.forEach((card, k) => {
        card.visible = true;
        card.scale.set(0);
        void this.ctx.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.4, delay: k * 0.1, ease: ease.outBack });
      });
      this.layoutCards();
      void this.ctx.instruct('barn.tune');
    } else if (this.plan.invite && !this.plan.each) {
      ANIMALS.forEach((a, k) => {
        const c = this.friends.get(a)!;
        c.visible = true;
        const p = this.choiceSpot(k);
        c.position.set(p.x, p.y);
        c.scale.set(0);
        void this.ctx.tw.to(c.scale, { x: SCALE.choice, y: SCALE.choice }, { duration: 0.4, delay: k * 0.08, ease: ease.outBack });
      });
      void this.ctx.instruct('barn.invite', { count: this.plan.verses });
    } else {
      this.beginSong();
    }
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.tapLayer.clear().rect(0, 0, v.w, v.h).fill({ color: 0xffffff, alpha: 0.001 });
    this.tapLayer.hitArea = new Rectangle(0, 0, v.w, v.h);
    this.barnWrap.position.set(v.w / 2, this.backdrop.groundY + 24);
    this.drawBarn();
    this.drawWindows();
    this.drawBeads();
    this.layoutCards();
    // Re-seat friends that are standing still.
    ANIMALS.forEach((a, k) => {
      const c = this.friends.get(a);
      if (!c || !c.visible || this.ctx.tw.busy(c)) return;
      if (this.phase === 'invite') {
        const p = this.choiceSpot(k);
        c.position.set(p.x, p.y);
      } else if (a === this.singer && this.idx < this.song.length) {
        const p = this.doorSpot();
        c.position.set(p.x, p.y);
      } else if (this.placed.includes(a)) {
        const p = this.restSpotOf(a);
        c.position.set(p.x, p.y);
      }
    });
  }

  update(dt: number) {
    this.clock += dt;
    if (this.bounce > 0) {
      this.bounce = Math.max(0, this.bounce - dt * 4);
      this.barnWrap.scale.set(1 + Math.sin(this.bounce * Math.PI) * 0.04, 1 - Math.sin(this.bounce * Math.PI) * 0.05);
    }
    // The next bead breathes, so the eye knows where the song is.
    if (this.phase === 'sing') this.drawBeads();
  }

  /** The ghost finger on the how-to card: invite the friends one by one, then tap anywhere for each note of the song. */
  autotouch(): TouchIntent | null {
    if (this.phase === 'invite') {
      const a = nextInvite(this.invited, this.plan);
      const c = a && this.friends.get(a);
      return c ? { tap: { on: c, y: BODY_Y }, pause: 0.7 } : null;
    }
    if (this.phase === 'tune') return { tap: { on: this.tuneCards[0] }, pause: 0.7 };
    if (this.phase !== 'sing') return null;
    return { tap: { on: this.tapLayer, x: this.view.w / 2, y: this.view.h * 0.4 }, pause: 0.25 };
  }

  destroy() {}

  // ----- Places -----

  private doorSpot() {
    return { x: this.view.w / 2, y: this.backdrop.groundY + 74 };
  }

  private restSpot(i: number) {
    const xs = spread(this.plan.verses, 150, this.view.w - 40, 190);
    return { x: xs[i], y: this.view.h - 36 };
  }

  /** Where a friend who has sung waits: when she chooses each verse, in its own place in the row, so the ones still to choose never crowd it. */
  private restSpotOf(a: Animal) {
    return this.plan.each ? this.choiceSpot(ANIMALS.indexOf(a)) : this.restSpot(this.order.indexOf(a));
  }

  private choiceSpot(k: number) {
    const xs = spread(ANIMALS.length, 150, this.view.w - 40, 190);
    return { x: xs[k], y: this.view.h - 36 };
  }

  // ----- Choosing the song -----

  private layoutCards() {
    // 250 apart: 30 clear between two 220-wide cards, and both fit a 768-wide upright view.
    const y = this.view.h * 0.42;
    this.tuneCards.forEach((card, k) => card.position.set(this.view.w / 2 + (k - (this.tuneCards.length - 1) / 2) * 250, y));
  }

  /** She picks the song: any song is a good one. It sounds its first notes, the cards go, and the song's opening begins. */
  private chooseTune(t: Tune) {
    if (this.phase !== 'tune') return;
    this.phase = 'wait';
    this.tune = t;
    tunesFor(this.plan).forEach((x, k) => {
      const card = this.tuneCards[k];
      this.ctx.tw.kill(card.scale);
      if (x === t) {
        void this.ctx.tw.to(card.scale, { x: 1.15, y: 1.15 }, { duration: 0.2, ease: ease.outBack });
        this.ctx.particles.burst(card.x, card.y, { kind: 'star', colors: RAINBOW.map((n) => swatch[n].fill), count: 10, speed: [120, 260], gravity: 200, life: [0.6, 1] });
      }
    });
    sfx.sparkle();
    t.opening[0].steps.forEach((s, i) => void this.ctx.tw.wait(i * 0.28).then(() => sfx.marimba(s, 0.4)));
    void this.ctx.tw.wait(1.2).then(() => {
      for (const card of this.tuneCards) {
        card.eventMode = 'none';
        void this.ctx.tw.to(card.scale, { x: 0, y: 0 }, { duration: 0.3, ease: ease.inBack }).then(() => (card.visible = false));
      }
      this.song = makeSong(this.order, this.tune);
      this.beginSong();
    });
  }

  // ----- Choosing who comes -----

  /** She picks a friend for the farm. Any friend is a good one; nothing here is a mistake. */
  private invite(a: Animal) {
    const c = this.friends.get(a)!;
    // A friend who has already sung only says hello again.
    if (this.plan.each && this.phase === 'invite' && this.invited.includes(a)) {
      c.hop(0.4);
      sfx.animal(VOICES[a].sound);
      return;
    }
    if (this.phase !== 'invite' || this.invited.includes(a)) return;
    this.invited.push(a);
    c.cheer();
    sfx.animal(VOICES[a].sound);
    sfx.sparkle();
    this.ctx.particles.burst(c.x, c.y - 100, { kind: 'star', colors: RAINBOW.map((n) => swatch[n].fill), count: 8, speed: [120, 260], gravity: 200, life: [0.6, 1] });
    this.drawWindows();
    void this.ctx.say('barn.invited', { animal: VOICES[a].word });
    if (this.plan.each) {
      this.singNext(a);
      return;
    }
    if (this.invited.length >= this.plan.verses) {
      this.phase = 'sing';
      this.tapLayer.eventMode = 'none';
      for (const x of ANIMALS) this.friends.get(x)!.eventMode = 'none';
      void this.gather();
    }
  }

  /** The friends who were not chosen wave and leave; the chosen ones settle on the bottom row, in the order she picked them. */
  private async gather() {
    await this.ctx.tw.wait(1.1);
    this.order = [...this.invited];
    this.song = makeSong(this.order, this.tune);
    for (const a of ANIMALS) {
      const c = this.friends.get(a)!;
      const i = this.order.indexOf(a);
      if (i < 0) {
        void this.ctx.tw.to(c.scale, { x: 0, y: 0 }, { duration: 0.35, ease: ease.inBack }).then(() => (c.visible = false));
      } else {
        const p = this.restSpot(i);
        void this.ctx.tw.to(c, { x: p.x, y: p.y }, { duration: 0.5, ease: ease.outCubic });
        void this.ctx.tw.to(c.scale, { x: SCALE.rest, y: SCALE.rest }, { duration: 0.5, ease: ease.outCubic });
      }
    }
    await this.ctx.tw.wait(0.6);
    this.placed = [...this.order];
    this.beginSong();
  }

  /** One friend at a time: the song grows by that friend's verse, the others step back, and the friend trots to the door. */
  private singNext(a: Animal) {
    this.order = [...this.invited];
    this.song = makeSong(this.order, this.tune);
    this.phase = 'sing';
    this.tapLayer.eventMode = 'static';
    for (const x of ANIMALS) {
      const c = this.friends.get(x)!;
      if (x === a || this.placed.includes(x)) continue;
      this.ctx.tw.kill(c.scale);
      void this.ctx.tw.to(c.scale, { x: 0, y: 0 }, { duration: 0.3, ease: ease.inBack }).then(() => (c.visible = false));
    }
    this.bringOut(a);
    this.drawBeads();
    void this.ctx.instruct(this.tune.id === 'buns' ? 'barn.sing.buns' : 'barn.sing');
  }

  /** A line has ended and more friends are still to come: the one who sang settles, and the others come out to be chosen. */
  private async offerNext(from: Animal | null) {
    this.phase = 'wait';
    this.tapLayer.eventMode = 'none';
    if (from) this.sendHome(from);
    await this.ctx.tw.wait(0.6);
    ANIMALS.forEach((a, k) => {
      if (this.invited.includes(a)) return;
      const c = this.friends.get(a)!;
      const p = this.choiceSpot(k);
      this.ctx.tw.kill(c);
      this.ctx.tw.kill(c.scale);
      c.visible = true;
      c.position.set(p.x, p.y);
      c.scale.set(0);
      void this.ctx.tw.to(c.scale, { x: SCALE.choice, y: SCALE.choice }, { duration: 0.4, delay: k * 0.06, ease: ease.outBack });
    });
    this.phase = 'invite';
    this.drawBeads();
    void this.ctx.instruct('barn.next');
  }

  // ----- Singing -----

  private beginSong() {
    this.phase = 'sing';
    this.tapLayer.eventMode = 'static';
    this.drawBeads();
    void this.ctx.instruct(this.tune.id === 'buns' ? 'barn.sing.buns' : 'barn.sing');
  }

  /** Any touch anywhere moves the tune on one note. Always music, never a mistake. */
  private tapScene(gx: number, gy: number) {
    if (this.phase !== 'sing' || this.idx >= this.song.length) return;
    const note = this.song[this.idx];
    this.idx++;
    sfx.marimba(note.step, 0.5);
    this.bounce = 1;
    const p = this.ctx.stage.toLocal({ x: gx, y: gy });
    const at = Number.isFinite(p.x) && Number.isFinite(p.y) ? p : { x: this.view.w / 2, y: this.view.h * 0.4 };
    this.ctx.particles.burst(at.x, at.y, {
      kind: 'note',
      colors: [swatch[RAINBOW[note.at % RAINBOW.length]].line],
      count: 1,
      speed: [90, 150],
      spread: 0.7,
      gravity: -40,
      size: [0.8, 1.05],
      life: [1, 1.4],
      spin: 1,
    });
    // The friend whose verse it is sings along; in the opening, the barn does.
    const singer = note.animal ? this.friends.get(note.animal) : null;
    singer?.hop(0.4);
    singer?.setMood('sing', 0.4);
    if (note.answers && note.animal) {
      const a = note.animal;
      void this.ctx.tw.wait(0.28).then(() => {
        sfx.animal(VOICES[a].sound);
        this.friends.get(a)?.cheer();
      });
    }
    if (this.idx >= this.song.length) {
      // Choosing one at a time, the song is only as long as the verses chosen so far: the end of the opening or of a
      // verse is a pause to choose, and only the last friend's verse ends the round.
      if (this.plan.each && this.order.length < this.plan.verses) {
        // A friend who answers on the very last note (Hot Cross Buns) gets that moment before the others come out.
        if (note.answers) void this.ctx.tw.wait(0.7).then(() => this.offerNext(note.animal));
        else void this.offerNext(note.animal);
        this.drawBeads();
        return;
      }
      void this.finale();
      return;
    }
    const next = this.song[this.idx];
    if (note.verseEnd) {
      const change = () => {
        if (note.animal) this.sendHome(note.animal);
        if (next.animal) this.bringOut(next.animal);
      };
      // When the friend answers on the verse's very last note (Hot Cross Buns), it gets its moment at the door first.
      if (note.answers) void this.ctx.tw.wait(0.7).then(change);
      else change();
    }
    this.drawBeads();
  }

  /** A friend trots out of the barn to the door for its verse (or hops up there from the bottom row). */
  private bringOut(a: Animal) {
    if (this.singer === a) return;
    const c = this.friends.get(a)!;
    this.singer = a;
    const d = this.doorSpot();
    this.ctx.tw.kill(c);
    this.ctx.tw.kill(c.scale);
    if (!c.visible) {
      c.visible = true;
      c.position.set(d.x, d.y);
      c.scale.set(0);
    }
    void this.ctx.tw.to(c, { x: d.x, y: d.y }, { duration: 0.45, ease: ease.outCubic });
    void this.ctx.tw.to(c.scale, { x: SCALE.door, y: SCALE.door }, { duration: 0.45, ease: ease.outBack });
  }

  /** The verse is over; the friend settles on the bottom row and waits there. */
  private sendHome(a: Animal) {
    const c = this.friends.get(a)!;
    if (!this.placed.includes(a)) this.placed.push(a);
    const p = this.restSpotOf(a);
    this.ctx.tw.kill(c);
    this.ctx.tw.kill(c.scale);
    void this.ctx.tw.to(c, { x: p.x, y: p.y }, { duration: 0.5, ease: ease.outCubic });
    void this.ctx.tw.to(c.scale, { x: SCALE.rest, y: SCALE.rest }, { duration: 0.5, ease: ease.outCubic });
    if (this.singer === a) this.singer = null;
  }

  /** The last "O": everybody cheers, and the round ends with one sticker. */
  private async finale() {
    this.phase = 'done';
    this.tapLayer.eventMode = 'none';
    const last = this.order[this.order.length - 1];
    if (last) this.sendHome(last);
    await this.ctx.tw.wait(0.5);
    for (const a of this.order) {
      this.friends.get(a)!.cheer();
      sfx.animal(VOICES[a].sound);
      await this.ctx.tw.wait(0.3);
    }
    [0, 2, 3, 4].forEach((s) => sfx.marimba(s, 0.3));
    this.ctx.pet.cheer();
    const colors = RAINBOW.map((c) => swatch[c].fill);
    this.ctx.particles.burst(this.view.w / 2, 140, { kind: 'confetti', colors, count: 60, speed: [200, 600], gravity: 600, life: [1.2, 2] });
    sfx.tada();
    void this.ctx.say(this.tune.id === 'buns' ? 'barn.done.buns' : 'barn.done');
    await this.ctx.tw.wait(1.8);
    // Nobody made a mistake and nobody asked for help: singing is always right.
    this.ctx.finish({ misses: 0, hints: 0 });
  }

  // ----- Drawing -----

  /** A big red barn with its doors open, standing on (0, 0). */
  private drawBarn() {
    const g = this.barn.clear();
    g.poly([-190, -170, 0, -290, 190, -170]).fill(BARN_DARK).stroke(line(0x7a2422));
    g.roundRect(-176, -178, 352, 178, 8).fill(BARN_RED).stroke(line(BARN_DARK));
    g.roundRect(-70, -128, 140, 128, 8).fill(0x6b2b2a).stroke(line(0xffffff, 6));
    g.moveTo(-70, -128).lineTo(70, 0).moveTo(70, -128).lineTo(-70, 0).stroke(line(0xffffff, 4));
    g.circle(0, -214, 30).fill(0xfff4d6).stroke(line(0xffffff, 5));
    g.moveTo(-8, -226).lineTo(-8, -202).moveTo(8, -226).lineTo(8, -202).stroke(line(BARN_DARK, 4));
  }

  /** In the choosing level, a barn window lights for every friend she has asked in. */
  private drawWindows() {
    const g = this.windows.clear();
    if (!this.plan.invite) return;
    const cx = this.view.w / 2;
    const y = this.backdrop.groundY - 132;
    const xs = spread(this.plan.verses, cx - 110, cx + 110, 84);
    xs.forEach((x, k) => {
      const on = k < this.invited.length;
      if (on) g.circle(x, y, 38).fill({ color: 0xffe07a, alpha: 0.3 });
      g.roundRect(x - 22, y - 22, 44, 44, 8).fill(on ? 0xffe07a : 0x6b2b2a).stroke(line(on ? 0xf2b22e : 0xffffff, 4));
    });
  }

  /** A row of beads, one for each note of the line being sung: the ones sung are lit, the next one breathes. */
  private drawBeads() {
    const g = this.beads.clear();
    if (this.phase !== 'sing') return;
    const note = this.song[Math.min(this.idx, this.song.length - 1)];
    if (!note) return;
    const xs = spread(note.of, this.view.w / 2 - 300, this.view.w / 2 + 300, 62);
    const y = 120;
    const sung = this.idx >= this.song.length ? note.of : note.at;
    for (let k = 0; k < note.of; k++) {
      const c = swatch[RAINBOW[k % RAINBOW.length]];
      const next = k === sung;
      const r = 24 + (next ? 5 + Math.sin(this.clock * 6) * 4 : 0);
      if (next) g.circle(xs[k], y, r + 12).fill({ color: c.fill, alpha: 0.25 });
      g.circle(xs[k], y, r).fill(k < sung || next ? c.fill : 0xffffff).stroke({ width: 5, color: k <= sung ? c.line : 0xcfd8e6 });
    }
  }
}

/** A song's card: a barn-red tab with its picture (a cow, or a hot cross bun) and the first beads of its tune. */
function drawTuneCard(t: Tune): Container {
  const c = new Container();
  const g = new Graphics().roundRect(-110, -100, 220, 200, 28).fill(0xfff4d6).stroke(line(BARN_DARK, 8));
  c.addChild(g);
  if (t.id === 'macdonald') {
    const cow = new Critter(CRITTERS.cow);
    cow.alive = false;
    cow.scale.set(0.36);
    cow.position.set(0, 80);
    c.addChild(cow);
  } else {
    const bun = new Graphics()
      .ellipse(0, 10, 84, 52)
      .fill(0xe0a458)
      .stroke(line(0xa86a2a))
      .moveTo(-40, 10)
      .lineTo(40, 10)
      .moveTo(0, -22)
      .lineTo(0, 42)
      .stroke(line(0xfff4d6, 10));
    c.addChild(bun);
  }
  const notes = t.opening[0].steps.slice(0, 4);
  notes.forEach((_, i) => c.addChild(new Graphics().circle(-(notes.length - 1) * 18 + i * 36, -66, 12).fill(swatch[RAINBOW[i % RAINBOW.length]].fill)));
  return c;
}

class BarnIcon extends Container {
  private readonly note = new Graphics();
  private readonly critter: Critter;
  private clock = 0;

  constructor() {
    super();
    const barn = new Graphics()
      .poly([-100, -120, 0, -190, 100, -120])
      .fill(BARN_DARK)
      .stroke(line(0x7a2422))
      .roundRect(-92, -126, 184, 126, 6)
      .fill(BARN_RED)
      .stroke(line(BARN_DARK))
      .roundRect(-34, -86, 68, 86, 6)
      .fill(0x6b2b2a)
      .stroke(line(0xffffff, 5));
    this.critter = new Critter(CRITTERS.cow);
    this.critter.scale.set(0.3);
    this.critter.position.set(-96, 40);
    musicNote(this.note, 40, swatch.purple.line);
    this.note.position.set(64, -150);
    this.addChild(barn, this.critter, this.note);
  }

  update(dt: number) {
    this.clock += dt;
    this.critter.update(dt);
    if (Math.sin(this.clock * 1.3) > 0.97) this.critter.hop(0.4);
    this.note.y = -150 - Math.abs(Math.sin(this.clock * 2)) * 18;
    this.note.rotation = Math.sin(this.clock * 2) * 0.2;
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const barn = new Graphics()
    .poly([-110, -110, 0, -190, 110, -110])
    .fill(BARN_DARK)
    .stroke(line(0x7a2422))
    .roundRect(-100, -116, 200, 116, 6)
    .fill(BARN_RED)
    .stroke(line(BARN_DARK))
    .roundRect(-36, -80, 72, 80, 6)
    .fill(0x6b2b2a)
    .stroke(line(0xffffff, 5));
  const who = new Critter(CRITTERS[rng.pick([...ANIMALS])]);
  who.alive = false;
  who.scale.set(0.42);
  who.position.set(rng.pick([-1, 1]) * 104, 24);
  const note = musicNote(new Graphics(), 54, swatch[rng.pick(RAINBOW)].line);
  note.position.set(-who.x * 0.6, -200);
  c.addChild(barn, who, note);
  return c;
}

export const singAlongBarn: GameModule = {
  id: 'sing-along-barn',
  name: 'Sing-Along Barn',
  titleLine: 'game.sing-along-barn',
  region: 'music-mountain',
  skills: ['song-order', 'animal-words', 'cause-effect', 'choice'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => {
    const p = planFor(level);
    const friends = p.verses === 1 ? '1 friend' : `${p.verses} friends`;
    if (p.full) return `Choose the whole Old MacDonald verse (with the moo-moo lines) or Hot Cross Buns, then choose who sings next after each verse (${friends})`;
    if (p.chooseTune) return `Choose Old MacDonald or Hot Cross Buns, then choose who sings next after each verse (${friends})`;
    if (p.each) return `Old MacDonald or Hot Cross Buns; after each verse, choose who sings next (${friends})`;
    return p.invite ? `Old MacDonald or Hot Cross Buns; choose ${friends} to join the song` : `Old MacDonald or Hot Cross Buns; tap to sing, ${friends} visit`;
  },
  music: silenced(STYLES.quiet),
  coplayHint: 'Sing along while {name} taps the next note: one syllable for each tap, and each animal sounds on its verse. At the top level, sing the whole Old MacDonald verse, with the moo-moo lines.',
  offScreen: 'Sing Old MacDonald or Hot Cross Buns with stuffed animals: bring out one for each verse and make its sound together.',
  hubIcon: () => new BarnIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new SingAlongBarn(ctx),
};
