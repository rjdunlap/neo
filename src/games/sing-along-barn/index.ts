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
import { rangeFor } from '../../progress/difficulty';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  ANIMALS,
  GAP_HOLD,
  GAPS,
  RHYMES,
  VOICES,
  farmAnimals,
  makeSong,
  nextInvite,
  phraseMidi,
  pickGapTune,
  pickRhymeTune,
  pickTune,
  planFor,
  rhymeSides,
  rowXs,
  cardSpots,
  tunesFor,
  type Animal,
  type Note,
  type Picture,
  type Rhyme,
  type SingPlan,
  type Tune,
} from './logic';

const GRASS = 0x9edb86;
const BARN_RED = 0xd9534f;
const BARN_DARK = 0x9e2f2c;
const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** How big the two pictures at *Which one finishes it?* stand. */
const PAIR_SCALE = 0.7;

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
  /** *Finish the line*: the word's picture beside the door, when the pause began (null when the song is not paused), and its wobble. */
  private readonly picture = new Container();
  private pausedAt: number | null = null;
  private wobble = 0;
  /** Counts the pauses, so a finished word's leftover hide never touches the next pause's picture. */
  private pauses = 0;
  /** *Which one finishes it?*: the tune's rhyme, its two pictures (the rhyming one first) and the glow behind the rhyming one. */
  private readonly rhyme: Rhyme | undefined;
  private readonly pair: [Container, Container] = [new Container(), new Container()];
  private readonly glow = new Graphics();
  /** The rhyming picture's side at each pause (0 left, 1 right), from the seed; wrong picks at this pause and in the round; glows shown. */
  private sides: (0 | 1)[] = [];
  private wrongHere = 0;
  /** When the last wrong pick and the last spoken line were, so a mashed picture or sky does not pile them up. */
  private wrongAt = -Infinity;
  private lineAt = -Infinity;
  private misses = 0;
  private hints = 0;

  constructor(private readonly ctx: GameContext) {
    // The card's demonstration of choosing a friend for each verse sings two of them: three Old MacDonald verses
    // would not finish inside its 75 seconds at the hand's pace; nor would the whole Old MacDonald verse (59 notes for
    // one friend), so the demonstration sings the short form with one friend.
    const plan = planFor(ctx.level);
    this.plan = ctx.demo && plan.each ? { ...plan, verses: plan.full ? 1 : 2, full: false } : plan;
    this.tune = this.plan.chooseTune
      ? tunesFor(this.plan)[0]
      : this.plan.rhyme
        ? pickRhymeTune(ctx.rng)
        : this.plan.gap
          ? pickGapTune(ctx.rng)
          : pickTune(ctx.rng);
    this.view = ctx.view;
    this.phase = this.plan.chooseTune ? 'tune' : this.plan.invite && !this.plan.each ? 'invite' : 'sing';
    this.order = this.plan.invite ? [] : farmAnimals(this.plan, ctx.rng);
    this.backdrop = ctx.track(
      new Backdrop(
        {
          sky: [0xa9dcff, 0xfff4d6],
          hills: [0xcdeeb6, GRASS],
          horizon: 0.56,
          clouds: 3,
          sun: true,
          seed: 33,
        },
        ctx.view,
      ),
    );
    this.barnWrap.addChild(this.barn);
    // Everything that could ever be asked for exists from the start, so a round never builds a critter mid-song.
    for (const a of this.plan.invite ? ANIMALS : this.order) {
      const c = ctx.track(new Critter(CRITTERS[a]));
      c.visible = false;
      this.friends.set(a, c);
    }
    const gap = this.plan.gap ? GAPS[this.tune.id] : undefined;
    if (gap) this.picture.addChild(drawPicture(gap.picture));
    this.picture.visible = false;
    this.picture.eventMode = 'none';
    this.rhyme = this.plan.rhyme ? RHYMES[this.tune.id] : undefined;
    if (this.rhyme) {
      // After two non-rhyming picks the rhyming picture glows: a warm halo just outside its card.
      this.glow.roundRect(-136, -126, 272, 252, 44).fill({ color: 0xffe07a, alpha: 0.9 });
      this.glow.visible = false;
      this.pair[0].addChild(this.glow, drawPicture(this.rhyme.picture));
      this.pair[1].addChild(drawPicture(this.rhyme.decoy.picture));
    }
    // The pictures take no touches themselves: the full-screen tap layer above them finds which one she touched.
    for (const card of this.pair) {
      card.visible = false;
      card.eventMode = 'none';
    }
    ctx.stage.addChild(
      this.backdrop,
      this.barnWrap,
      this.windows,
      this.beads,
      this.picture,
      ...this.pair,
      ...this.friends.values(),
      this.tapLayer,
    );
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
    if (!this.plan.invite || this.plan.each)
      this.song = makeSong(this.order, this.tune, this.plan.rhyme ? 'rhyme' : this.plan.gap);
    // Drawn after the tune and the friends, so the other levels' seeds sing what they always did.
    if (this.rhyme) this.sides = rhymeSides(ctx.rng, this.song.filter((n) => n.gap).length);
  }

  start() {
    if (this.phase === 'tune') {
      this.tuneCards.forEach((card, k) => {
        card.visible = true;
        card.scale.set(0);
        void this.ctx.tw.to(
          card.scale,
          { x: this.cardScale(), y: this.cardScale() },
          { duration: 0.4, delay: k * 0.1, ease: ease.outBack },
        );
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
        void this.ctx.tw.to(
          c.scale,
          { x: SCALE.choice, y: SCALE.choice },
          { duration: 0.4, delay: k * 0.08, ease: ease.outBack },
        );
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
    const pic = this.pictureSpot();
    this.picture.position.set(pic.x, pic.y);
    if (this.rhyme) this.placePair();
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
      this.barnWrap.scale.set(
        1 + Math.sin(this.bounce * Math.PI) * 0.04,
        1 - Math.sin(this.bounce * Math.PI) * 0.05,
      );
    }
    // The next bead breathes, so the eye knows where the song is.
    if (this.phase === 'sing') this.drawBeads();
    // While the song waits for the word, its picture sways; a touch too soon shakes it harder.
    this.wobble = Math.max(0, this.wobble - dt * 2.5);
    this.picture.rotation =
      this.pausedAt === null
        ? 0
        : Math.sin(this.clock * 3) * 0.06 + Math.sin(this.clock * 16) * 0.16 * this.wobble;
    this.pair.forEach(
      (card, k) =>
        (card.rotation =
          this.pausedAt === null
            ? 0
            : Math.sin(this.clock * 3 + k * 1.6) * 0.06 + Math.sin(this.clock * 16) * 0.16 * this.wobble),
    );
    if (this.glow.visible) this.glow.alpha = 0.75 + Math.sin(this.clock * 5) * 0.25;
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
    const tap = { tap: { on: this.tapLayer, x: this.view.w / 2, y: this.view.h * 0.4 }, pause: 0.25 };
    // At the pause the hand waits a moment with the picture (the time a grown-up leaves for the word), then sings it.
    const ready = () => this.pausedAt === null || this.clock - this.pausedAt >= GAP_HOLD + 1.2;
    if (this.pausedAt !== null && this.rhyme) {
      // It picks the rhyming picture: demonstrations play cleanly (the card's note tells what a wrong pick does).
      return { tap: { on: this.pair[0] }, pause: 0.6, receiver: this.tapLayer, when: ready };
    }
    if (this.pausedAt !== null) return { ...tap, when: ready };
    return tap;
  }

  destroy() {}

  // ----- Places -----

  private doorSpot() {
    return { x: this.view.w / 2, y: this.backdrop.groundY + 74 };
  }

  private restSpot(i: number) {
    const xs = rowXs(this.plan.verses, this.view.w);
    return { x: xs[i], y: this.view.h - 36 };
  }

  /** Where a friend who has sung waits: when she chooses each verse, in its own place in the row, so the ones still to choose never crowd it. */
  private restSpotOf(a: Animal) {
    return this.plan.each ? this.choiceSpot(ANIMALS.indexOf(a)) : this.restSpot(this.order.indexOf(a));
  }

  /** The picture of the word waits beside the barn, under the eave of its roof: clear of the wall and the friend at the door. */
  private pictureSpot() {
    return { x: this.view.w / 2 + 262, y: this.backdrop.groundY - 200 };
  }

  /** *Which one finishes it?*: the two pictures stand either side of the barn, the rhyming one on this pause's seeded side. */
  private placePair() {
    const side = this.sides[Math.max(0, this.pauses - 1)] ?? 0;
    const p = this.pictureSpot();
    this.pair.forEach((card, k) =>
      card.position.set(
        this.view.w / 2 + (k === 0 ? 1 : -1) * (side === 1 ? 1 : -1) * (p.x - this.view.w / 2),
        p.y,
      ),
    );
  }

  private choiceSpot(k: number) {
    const xs = rowXs(ANIMALS.length, this.view.w);
    return { x: xs[k], y: this.view.h - 36 };
  }

  // ----- Choosing the song -----

  private cardScale = () => cardSpots(this.tuneCards.length, this.view.w, this.view.h).scale;

  private layoutCards() {
    const spots = cardSpots(this.tuneCards.length, this.view.w, this.view.h);
    this.tuneCards.forEach((card, k) => {
      card.scale.set(spots.scale);
      card.position.set(spots.at[k].x, spots.at[k].y);
    });
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
        void this.ctx.tw.to(
          card.scale,
          { x: this.cardScale() * 1.15, y: this.cardScale() * 1.15 },
          { duration: 0.2, ease: ease.outBack },
        );
        this.ctx.particles.burst(card.x, card.y, {
          kind: 'star',
          colors: RAINBOW.map((n) => swatch[n].fill),
          count: 10,
          speed: [120, 260],
          gravity: 200,
          life: [0.6, 1],
        });
      }
    });
    sfx.sparkle();
    t.opening[0].steps.forEach(
      (_, i) => void this.ctx.tw.wait(i * 0.28).then(() => sfx.marimbaMidi(phraseMidi(t.opening[0], i), 0.4)),
    );
    void this.ctx.tw.wait(1.2).then(() => {
      for (const card of this.tuneCards) {
        card.eventMode = 'none';
        void this.ctx.tw
          .to(card.scale, { x: 0, y: 0 }, { duration: 0.3, ease: ease.inBack })
          .then(() => (card.visible = false));
      }
      this.song = makeSong(this.order, this.tune, this.plan.gap);
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
    this.ctx.particles.burst(c.x, c.y - 100, {
      kind: 'star',
      colors: RAINBOW.map((n) => swatch[n].fill),
      count: 8,
      speed: [120, 260],
      gravity: 200,
      life: [0.6, 1],
    });
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
    this.song = makeSong(this.order, this.tune, this.plan.gap);
    for (const a of ANIMALS) {
      const c = this.friends.get(a)!;
      const i = this.order.indexOf(a);
      if (i < 0) {
        void this.ctx.tw
          .to(c.scale, { x: 0, y: 0 }, { duration: 0.35, ease: ease.inBack })
          .then(() => (c.visible = false));
      } else {
        const p = this.restSpot(i);
        void this.ctx.tw.to(c, { x: p.x, y: p.y }, { duration: 0.5, ease: ease.outCubic });
        void this.ctx.tw.to(
          c.scale,
          { x: SCALE.rest, y: SCALE.rest },
          { duration: 0.5, ease: ease.outCubic },
        );
      }
    }
    await this.ctx.tw.wait(0.6);
    this.placed = [...this.order];
    this.beginSong();
  }

  /** One friend at a time: the song grows by that friend's verse, the others step back, and the friend trots to the door. */
  private singNext(a: Animal) {
    this.order = [...this.invited];
    this.song = makeSong(this.order, this.tune, this.plan.gap);
    this.phase = 'sing';
    this.tapLayer.eventMode = 'static';
    for (const x of ANIMALS) {
      const c = this.friends.get(x)!;
      if (x === a || this.placed.includes(x)) continue;
      this.ctx.tw.kill(c.scale);
      void this.ctx.tw
        .to(c.scale, { x: 0, y: 0 }, { duration: 0.3, ease: ease.inBack })
        .then(() => (c.visible = false));
    }
    this.bringOut(a);
    this.drawBeads();
    void this.ctx.instruct(
      this.tune.id === 'macdonald' ? 'barn.sing' : (`barn.sing.${this.tune.id}` as const),
    );
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
      void this.ctx.tw.to(
        c.scale,
        { x: SCALE.choice, y: SCALE.choice },
        { duration: 0.4, delay: k * 0.06, ease: ease.outBack },
      );
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
    if (this.plan.rhyme) void this.ctx.instruct('barn.rhyme.how', { song: SONG_NAMES[this.tune.id] });
    else if (this.plan.gap) void this.ctx.instruct('barn.finish.how', { song: SONG_NAMES[this.tune.id] });
    else
      void this.ctx.instruct(
        this.tune.id === 'macdonald' ? 'barn.sing' : (`barn.sing.${this.tune.id}` as const),
      );
  }

  /** Any touch anywhere moves the tune on one note. Always music, never a mistake. */
  private tapScene(gx: number, gy: number) {
    if (this.phase !== 'sing' || this.idx >= this.song.length) return;
    const note = this.song[this.idx];
    if (this.pausedAt !== null && this.rhyme) {
      this.pickAt(gx, gy, note);
      return;
    }
    if (this.pausedAt !== null) {
      // The song is waiting for the word. A touch the moment it stopped (a fast tapper) meets the picture: it wobbles
      // and hums the word's note softly. After that, any touch sings the word.
      if (this.clock - this.pausedAt < GAP_HOLD) {
        this.wobble = 1;
        sfx.marimbaMidi(note.midi, 0.15);
        return;
      }
      this.finishLine(note);
    }
    this.singNote(gx, gy);
  }

  /** The song moves on one note: it sounds, a note floats up from the finger, and the friend whose verse it is sings along. */
  private singNote(gx: number, gy: number) {
    const note = this.song[this.idx];
    this.idx++;
    sfx.marimbaMidi(note.midi, 0.5);
    this.bounce = 1;
    const p = this.ctx.stage.toLocal({ x: gx, y: gy });
    const at =
      Number.isFinite(p.x) && Number.isFinite(p.y) ? p : { x: this.view.w / 2, y: this.view.h * 0.4 };
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
    if (next.gap) this.pauseForWord();
    this.drawBeads();
  }

  /** *Finish the line*: the song stops before the verse's last word, and the word's picture pops up beside the door. */
  private pauseForWord() {
    this.pausedAt = this.clock;
    this.pauses++;
    if (this.rhyme) {
      this.showPair();
      return;
    }
    const pic = this.picture;
    const p = this.pictureSpot();
    this.ctx.tw.kill(pic.scale);
    pic.position.set(p.x, p.y);
    pic.visible = true;
    pic.scale.set(0);
    void this.ctx.tw.to(pic.scale, { x: 0.7, y: 0.7 }, { duration: 0.35, ease: ease.outBack });
  }

  /** Her touch after the pause sings the word: the picture jumps, the pet says the word, and the picture goes until the next verse. */
  private finishLine(note: Note) {
    this.pausedAt = null;
    const pic = this.picture;
    this.ctx.particles.burst(pic.x, pic.y, {
      kind: 'star',
      colors: RAINBOW.map((n) => swatch[n].fill),
      count: 8,
      speed: [120, 240],
      gravity: 200,
      life: [0.5, 0.9],
    });
    void this.ctx.say('barn.finish', { word: GAPS[this.tune.id]?.word ?? note.syllable });
    this.ctx.tw.kill(pic.scale);
    const pause = this.pauses;
    const current = () => pause === this.pauses;
    void this.ctx.tw
      .to(pic.scale, { x: 0.85, y: 0.85 }, { duration: 0.18, ease: ease.outBack })
      .then(() => this.ctx.tw.wait(0.7))
      .then(() =>
        current()
          ? this.ctx.tw.to(pic.scale, { x: 0, y: 0 }, { duration: 0.3, ease: ease.inBack })
          : undefined,
      )
      .then(() => {
        if (current()) pic.visible = false;
      });
  }

  /** *Which one finishes it?*: both pictures pop up either side of the barn, and the pet says the line up to the missing word. */
  private showPair() {
    this.wrongHere = 0;
    this.glow.visible = false;
    this.placePair();
    for (const card of this.pair) {
      this.ctx.tw.kill(card.scale);
      card.visible = true;
      card.scale.set(0);
      void this.ctx.tw.to(
        card.scale,
        { x: PAIR_SCALE, y: PAIR_SCALE },
        { duration: 0.35, ease: ease.outBack },
      );
    }
    this.sayLine();
  }

  /**
   * Her touch at a rhyme pause. Too soon after it stopped, it only wobbles the pictures. On the rhyming picture it sings
   * the word and the song goes on; on the other, that picture bounces back with a boing and the pet says the rhyme (a
   * miss; the second at this pause glows the rhyming picture). Anywhere else, the pet says the line again: never a miss.
   */
  private pickAt(gx: number, gy: number, note: Note) {
    const r = this.rhyme!;
    if (this.clock - this.pausedAt! < GAP_HOLD) {
      this.wobble = 1;
      sfx.marimbaMidi(note.midi, 0.15);
      return;
    }
    const p = this.ctx.stage.toLocal({ x: gx, y: gy });
    // Each card is 220 by 200 in its own units; at `PAIR_SCALE` that is 154 by 140 on screen, far apart on either side of the barn.
    const hit = this.pair.findIndex(
      (c) => Math.abs(p.x - c.x) <= 110 * PAIR_SCALE && Math.abs(p.y - c.y) <= 100 * PAIR_SCALE,
    );
    if (hit === 0) {
      this.pausedAt = null;
      this.glow.visible = false;
      const right = this.pair[0];
      this.ctx.particles.burst(right.x, right.y, {
        kind: 'star',
        colors: RAINBOW.map((n) => swatch[n].fill),
        count: 10,
        speed: [120, 260],
        gravity: 200,
        life: [0.5, 0.9],
      });
      sfx.sparkle();
      void this.ctx.say('barn.finish', { word: r.word });
      const pause = this.pauses;
      for (const card of this.pair) {
        this.ctx.tw.kill(card.scale);
        const grow = card === right ? 1.2 : 1;
        void this.ctx.tw
          .to(
            card.scale,
            { x: PAIR_SCALE * grow, y: PAIR_SCALE * grow },
            { duration: 0.18, ease: ease.outBack },
          )
          .then(() => this.ctx.tw.wait(card === right ? 0.7 : 0))
          .then(() =>
            pause === this.pauses
              ? this.ctx.tw.to(card.scale, { x: 0, y: 0 }, { duration: 0.3, ease: ease.inBack })
              : undefined,
          )
          .then(() => {
            if (pause === this.pauses) card.visible = false;
          });
      }
      // The touch sings the whole word: "po-sies" is two notes, the second a moment after the first.
      const start = this.idx;
      this.singNote(gx, gy);
      for (let k = 1; k < r.syllables.length; k++) {
        void this.ctx.tw.wait(0.3 * k).then(() => {
          if (this.phase === 'sing' && this.idx === start + k) this.singNote(gx, gy);
        });
      }
      return;
    }
    if (hit === 1) {
      const wrong = this.pair[1];
      // A second touch on it while it is still bouncing is the same pick, not another miss.
      if (this.clock - this.wrongAt < 0.6) return;
      this.wrongAt = this.clock;
      this.misses++;
      this.wrongHere++;
      sfx.boing();
      this.ctx.tw.kill(wrong.scale);
      void this.ctx.tw
        .to(wrong.scale, { x: PAIR_SCALE * 0.82, y: PAIR_SCALE * 1.1 }, { duration: 0.12 })
        .then(() =>
          this.ctx.tw.to(
            wrong.scale,
            { x: PAIR_SCALE, y: PAIR_SCALE },
            { duration: 0.35, ease: ease.outBack },
          ),
        );
      if (this.wrongHere === 2) {
        this.hints++;
        this.glow.visible = true;
      }
      void this.ctx.say(`barn.rhyme.miss.${this.tune.id as 'rain' | 'twinkle' | 'ring'}`);
      return;
    }
    this.wobble = 1;
    if (this.clock - this.lineAt > 2.5) this.sayLine();
  }

  private sayLine() {
    this.lineAt = this.clock;
    void this.ctx.say(`barn.rhyme.line.${this.tune.id as 'rain' | 'twinkle' | 'ring'}`);
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
    this.ctx.particles.burst(this.view.w / 2, 140, {
      kind: 'confetti',
      colors,
      count: 60,
      speed: [200, 600],
      gravity: 600,
      life: [1.2, 2],
    });
    sfx.tada();
    void this.ctx.say(this.tune.id === 'macdonald' ? 'barn.done' : (`barn.done.${this.tune.id}` as const));
    await this.ctx.tw.wait(1.8);
    // Singing is always right; only a non-rhyming picture at *Which one finishes it?* counts, and its glow is the hint.
    this.ctx.finish({ misses: this.misses, hints: this.hints });
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
      g.roundRect(x - 22, y - 22, 44, 44, 8)
        .fill(on ? 0xffe07a : 0x6b2b2a)
        .stroke(line(on ? 0xf2b22e : 0xffffff, 4));
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
      // At the pause the beads stop: the next one is big and still.
      const r = 24 + (next ? 5 + (this.pausedAt === null ? Math.sin(this.clock * 6) * 4 : 0) : 0);
      if (next) g.circle(xs[k], y, r + 12).fill({ color: c.fill, alpha: 0.25 });
      g.circle(xs[k], y, r)
        .fill(k < sung || next ? c.fill : 0xffffff)
        .stroke({ width: 5, color: k <= sung ? c.line : 0xcfd8e6 });
    }
  }
}

/** A song's card: a barn-red tab with its picture (a cow, a bun, a lamb, a moon, a rain cloud, a spider, a ball, a ring of roses, a star or a bus) and the first beads of its tune. */
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
  } else if (t.id === 'clair') {
    const moon = new Graphics()
      .circle(0, 30, 52)
      .fill(0xffe9a0)
      .stroke(line(0xd9b85a))
      .circle(20, 18, 44)
      .fill(0xfff4d6);
    c.addChild(moon);
  } else if (t.id === 'rain') {
    const cloud = new Graphics()
      .circle(-36, 0, 32)
      .circle(4, -16, 42)
      .circle(46, 0, 30)
      .rect(-36, 0, 82, 30)
      .fill(0xc9d6e6)
      .stroke(line(0x8a9db5, 5));
    const drops = new Graphics();
    for (const x of [-34, 4, 42]) drops.ellipse(x, 62, 7, 11).fill(0x6ab0e8);
    c.addChild(cloud, drops);
  } else if (t.id === 'itsy') {
    const web = new Graphics().moveTo(0, -90).lineTo(0, 0).stroke(line(0x8a9db5, 4));
    const spider = new Graphics().circle(0, 22, 26).fill(0x4a3a5c);
    for (const d of [-1, 1])
      for (const dy of [-8, 8, 24, 40])
        spider
          .moveTo(d * 20, 22 + dy / 2)
          .lineTo(d * 48, 22 + dy)
          .stroke(line(0x4a3a5c, 5));
    spider.circle(-9, 14, 5).circle(9, 14, 5).fill(0xffffff);
    c.addChild(web, spider);
  } else if (t.id === 'bounce') {
    c.addChild(ballArt());
  } else if (t.id === 'ring') {
    // A ring of pink roses, a puff for each friend holding hands.
    const ring = new Graphics();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      ring.circle(Math.cos(a) * 52, 24 + Math.sin(a) * 52, 17);
    }
    ring.fill(0xf4a6c8).stroke(line(0xc0577f, 5));
    const centres = new Graphics();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      centres.circle(Math.cos(a) * 52, 24 + Math.sin(a) * 52, 6);
    }
    centres.fill(0xffe9a0);
    c.addChild(ring, centres);
  } else if (t.id === 'twinkle') {
    // A five-point star with a smile of sparkles under it.
    const pts: number[] = [];
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k / 10) * Math.PI * 2;
      const r = k % 2 === 0 ? 62 : 26;
      pts.push(Math.cos(a) * r, 26 + Math.sin(a) * r);
    }
    const star = new Graphics().poly(pts).fill(0xffd54a).stroke(line(0xd9a020, 5));
    star.circle(-12, 22, 5).circle(12, 22, 5).fill(0x4a3a30);
    const sparkles = new Graphics();
    for (const [x, y] of [
      [-80, -20],
      [80, -10],
      [-70, 76],
      [74, 72],
    ])
      sparkles.circle(x, y, 6).fill(0xffe9a0);
    c.addChild(sparkles, star);
  } else if (t.id === 'wheels') {
    // A yellow school bus from the side: windows, a door, two black wheels.
    const bus = new Graphics().roundRect(-90, -16, 180, 82, 16).fill(0xffc83a).stroke(line(0xc08a1a, 5));
    for (const x of [-70, -30, 10]) bus.roundRect(x, -4, 32, 28, 6).fill(0xbfe4ff);
    bus.roundRect(52, -4, 26, 54, 5).fill(0xbfe4ff).stroke(line(0xc08a1a, 4));
    const wheels = new Graphics();
    for (const x of [-50, 50]) wheels.circle(x, 68, 20).fill(0x3a3a3a).circle(x, 68, 8).fill(0xc9c9c9);
    c.addChild(bus, wheels);
  } else if (t.id === 'mary') {
    const lamb = new Graphics()
      .circle(-40, 30, 26)
      .circle(0, 14, 34)
      .circle(40, 30, 26)
      .circle(0, 46, 30)
      .fill(0xffffff)
      .stroke(line(0xb8b0a0, 5))
      .circle(0, 40, 22)
      .fill(0x4a3a30);
    c.addChild(lamb);
  } else {
    c.addChild(bunArt());
  }
  const notes = t.opening[0].steps.slice(0, 4);
  notes.forEach((_, i) =>
    c.addChild(
      new Graphics()
        .circle(-(notes.length - 1) * 18 + i * 36, -66, 12)
        .fill(swatch[RAINBOW[i % RAINBOW.length]].fill),
    ),
  );
  return c;
}

/** A hot cross bun. */
const bunArt = () =>
  new Graphics()
    .ellipse(0, 10, 84, 52)
    .fill(0xe0a458)
    .stroke(line(0xa86a2a))
    .moveTo(-40, 10)
    .lineTo(40, 10)
    .moveTo(0, -22)
    .lineTo(0, 42)
    .stroke(line(0xfff4d6, 10));

/** A red ball over its shadow, with two lines for the bounce. */
function ballArt(): Container {
  const c = new Container();
  const shadow = new Graphics().ellipse(0, 74, 50, 10).fill(0xd9c9a8);
  const ball = new Graphics()
    .circle(0, 12, 44)
    .fill(0xe8604c)
    .stroke(line(0xa83a2a, 5))
    .moveTo(-42, 12)
    .lineTo(42, 12)
    .stroke(line(0xfff4d6, 7));
  const lines = new Graphics()
    .moveTo(-78, 30)
    .lineTo(-60, 52)
    .moveTo(78, 30)
    .lineTo(60, 52)
    .stroke(line(0x8a9db5, 5));
  c.addChild(shadow, ball, lines);
  return c;
}

/** The picture of the word at *Finish the line*, on a card like a song's: the bun, the ball, a night sky, a water spout. */
function drawPicture(kind: Picture): Container {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-110, -100, 220, 200, 28).fill(0xfff4d6).stroke(line(BARN_DARK, 8)));
  if (kind === 'bun') c.addChild(bunArt());
  else if (kind === 'ball') c.addChild(ballArt());
  else if (kind === 'posies') {
    // A posy: five pink flowers on green stems, tied with a ribbon.
    const stems = new Graphics();
    for (const x of [-36, -18, 0, 18, 36]) stems.moveTo(x, -20).lineTo(0, 62);
    stems.stroke(line(0x5aa04a, 6));
    const flowers = new Graphics();
    for (const [x, y] of [
      [-40, -30],
      [-20, -54],
      [0, -30],
      [20, -54],
      [40, -30],
    ])
      flowers.circle(x, y, 20);
    flowers.fill(0xf4a6c8).stroke(line(0xc0577f, 5));
    for (const [x, y] of [
      [-40, -30],
      [-20, -54],
      [0, -30],
      [20, -54],
      [40, -30],
    ])
      flowers.circle(x, y, 7).fill(0xffe9a0);
    const bow = new Graphics()
      .poly([0, 36, -28, 22, -28, 50])
      .poly([0, 36, 28, 22, 28, 50])
      .fill(0x8fc8ff)
      .stroke(line(0x4a8ac0, 4));
    c.addChild(stems, flowers, bow);
  } else if (kind === 'apple') {
    const apple = new Graphics()
      .ellipse(0, 14, 66, 56)
      .fill(0xe8604c)
      .stroke(line(0xa83a2a, 5))
      .moveTo(0, -30)
      .lineTo(6, -58)
      .stroke(line(0x7a5230, 7));
    const leaf = new Graphics().ellipse(28, -48, 20, 10).fill(0x7cc46a).stroke(line(0x4a8a3a, 4));
    c.addChild(apple, leaf);
  } else if (kind === 'moon') {
    c.addChild(
      new Graphics()
        .circle(0, 0, 62)
        .fill(0xffe9a0)
        .stroke(line(0xd9b85a))
        .circle(26, -14, 54)
        .fill(0xfff4d6),
    );
  } else if (kind === 'sky') {
    // A round of night sky with a moon and four twinkles.
    const sky = new Graphics().circle(0, 0, 78).fill(0x3b4a8c).stroke(line(0x26305e, 5));
    sky.circle(-30, -26, 22).fill(0xffe9a0).circle(-20, -34, 20).fill(0x3b4a8c);
    for (const [x, y, r] of [
      [30, -36, 9],
      [44, 18, 7],
      [-8, 40, 8],
      [-50, 22, 6],
    ])
      sky.star(x, y, 4, r, r * 0.45).fill(0xffd54a);
    c.addChild(sky);
  } else {
    // A grey drainpipe down a wall, its elbow at the foot, and three drops of water coming out.
    const pipe = new Graphics()
      .roundRect(-30, -84, 44, 120, 10)
      .fill(0xb9c4d0)
      .stroke(line(0x6f7f91, 5))
      .roundRect(-30, 22, 92, 40, 14)
      .fill(0xb9c4d0)
      .stroke(line(0x6f7f91, 5));
    const drops = new Graphics();
    for (const [x, y] of [
      [78, 50],
      [88, 72],
      [74, 84],
    ])
      drops.ellipse(x, y, 6, 9).fill(0x6ab0e8);
    c.addChild(pipe, drops);
  }
  return c;
}

/** The song as a grown-up would name it, for the spoken instruction. */
const SONG_NAMES: Record<Tune['id'], string> = {
  macdonald: 'Old MacDonald',
  buns: 'Hot Cross Buns',
  mary: 'Mary Had a Little Lamb',
  clair: 'Au Clair de la Lune',
  rain: 'Rain, Rain, Go Away',
  itsy: 'The Itsy Bitsy Spider',
  bounce: 'Bounce High, Bounce Low',
  ring: 'Ring Around the Rosie',
  twinkle: 'Twinkle, Twinkle, Little Star',
  wheels: 'The Wheels on the Bus',
};

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
  challenge: 'music',
  skills: ['song-order', 'animal-words', 'cause-effect', 'choice'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  upright: true,
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => {
    const p = planFor(level);
    const friends = p.verses === 1 ? '1 friend' : `${p.verses} friends`;
    if (p.rhyme)
      return `Rain, Rain, Go Away, Twinkle, Twinkle, Little Star or Ring Around the Rosie; before a rhyming word, tap the picture that rhymes (${friends})`;
    if (p.gap)
      return `Hot Cross Buns, Rain, Rain, Go Away, The Itsy Bitsy Spider or Twinkle, Twinkle; the song stops before the last word of each verse and a tap sings it (${friends})`;
    if (p.full)
      return `Choose the whole Old MacDonald verse (with the moo-moo lines), Hot Cross Buns, Mary Had a Little Lamb, Au Clair de la Lune, Rain, Rain, Go Away, The Itsy Bitsy Spider, Bounce High, Bounce Low or Ring Around the Rosie, then choose who sings next after each verse (${friends})`;
    if (p.chooseTune)
      return `Choose Old MacDonald, Hot Cross Buns, Mary Had a Little Lamb, Au Clair de la Lune, Rain, Rain, Go Away, The Itsy Bitsy Spider, Bounce High, Bounce Low or Ring Around the Rosie, then choose who sings next after each verse (${friends})`;
    if (p.each)
      return `Old MacDonald, Hot Cross Buns, Mary Had a Little Lamb, Au Clair de la Lune, Rain, Rain, Go Away, The Itsy Bitsy Spider, Bounce High, Bounce Low or Ring Around the Rosie; after each verse, choose who sings next (${friends})`;
    return p.invite
      ? `Old MacDonald, Hot Cross Buns, Mary Had a Little Lamb, Au Clair de la Lune, Rain, Rain, Go Away, The Itsy Bitsy Spider, Bounce High, Bounce Low or Ring Around the Rosie; choose ${friends} to join the song`
      : `Old MacDonald, Hot Cross Buns, Mary Had a Little Lamb, Au Clair de la Lune, Rain, Rain, Go Away, The Itsy Bitsy Spider, Bounce High, Bounce Low or Ring Around the Rosie; tap to sing, ${friends} visit`;
  },
  music: silenced(STYLES.quiet),
  coplayHint:
    'Sing along while {name} taps the next note: one syllable for each tap, and each animal sounds on its verse. At the top level, sing the whole Old MacDonald verse, with the moo-moo lines. When the song stops before a word, wait for {name} to say it, then sing it together. When two pictures wait, say the end of the line slowly ("go away … we want to …") and let {name} choose.',
  offScreen:
    'Sing Old MacDonald, Hot Cross Buns, Mary Had a Little Lamb, Au Clair de la Lune, Rain, Rain, Go Away, The Itsy Bitsy Spider, Bounce High, Bounce Low or Ring Around the Rosie with stuffed animals: bring out one for each verse and make its sound together.',
  hubIcon: () => new BarnIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new SingAlongBarn(ctx),
};
