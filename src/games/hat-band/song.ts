import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { starPoints } from '../../art/shapes';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import type { LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  barsArt,
  checkArt,
  drumArt,
  HEAD,
  hatArt,
  line,
  lowArt,
  lowBadge,
  tuneBadge,
  WORN_SCALE,
} from './art';
import {
  advanceSong,
  check,
  CLAUSES,
  friendFor,
  has,
  HATS,
  makeSongRound,
  newArrange,
  PARTS,
  playSong,
  repair,
  ROLE_ORDER,
  select,
  songBotMove,
  songLayout,
  toggleRole,
  undoStep,
  PER_BEAT,
  type Arrange,
  type Clause,
  type Part,
  type Role,
  type SongEvent,
  type SongLayout,
  type SongRound,
} from './logic';

/** A role's small badge for the cards: a drum, a note, or the bigger low note under a staff line. */
function badge(role: Role): Container {
  if (role === 'drum') return drumArt(0.5);
  if (role === 'tune') return tuneBadge(0.85);
  return lowBadge(0.7);
}

const BADGE_X = [-44, 0, 44];

/** A card showing a part: dots for its number and a badge slot per role. Used for the brief and the part strip. */
class PartCard extends Container {
  readonly back = new Graphics();
  readonly badges: Container[];
  private readonly dots = new Graphics();
  constructor(
    readonly w: number,
    readonly h: number,
    number: number,
  ) {
    super();
    this.badges = ROLE_ORDER.map((r, i) => {
      const b = badge(r);
      b.position.set(BADGE_X[i], h * 0.18);
      return b;
    });
    // The part's number as dots, so nothing needs reading.
    for (let i = 0; i < number; i++) this.dots.circle(-w / 2 + 18 + i * 16, -h / 2 + 16, 6).fill(ink);
    this.addChild(this.back, this.dots, ...this.badges);
    this.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
  }
  paint(fill: number, edge: number, width: number, glow: boolean) {
    const { w, h } = this;
    this.back.clear();
    if (glow)
      this.back.roundRect(-w / 2 - 12, -h / 2 - 12, w + 24, h + 24, 28).fill({ color: 0xffe066, alpha: 0.9 });
    this.back
      .roundRect(-w / 2, -h / 2, w, h, 20)
      .fill(fill)
      .stroke({ width, color: edge });
    // An empty slot under each badge, so a missing part reads as a gap rather than nothing.
    for (const x of BADGE_X) this.back.circle(x, h * 0.18, 18).stroke({ width: 3, color: 0xd6cbb8 });
  }
}

/** A friend on the stage with their prop; their hat sits on their head when they play in the shown part. */
class Singer extends Container {
  readonly critter: Critter;
  readonly flash = new Graphics();
  readonly hintGlow = new Graphics();
  readonly hat: Container;
  glow = 0;
  constructor(
    name: keyof typeof CRITTERS,
    readonly role: Role,
    hatId: SongRound['hats'][number],
  ) {
    super();
    this.critter = new Critter(CRITTERS[name]);
    this.critter.scale.set(0.6);
    this.flash.circle(0, -80, 88).fill({ color: 0xfff3a0, alpha: 1 });
    this.flash.alpha = 0;
    this.hintGlow.roundRect(-80, -200, 160, 220, 30).fill({ color: 0xffe066, alpha: 0.75 });
    this.hintGlow.visible = false;
    const prop = role === 'drum' ? drumArt(1) : role === 'tune' ? barsArt() : lowArt();
    if (role === 'bass') prop.position.set(56, -50);
    else prop.position.set(0, -20);
    this.hat = hatArt(hatId);
    this.addChild(this.hintGlow, this.flash, this.critter, prop, this.hat);
    this.eventMode = 'none';
  }
}

const sparkleArt = (): Graphics =>
  new Graphics()
    .poly(starPoints(26, 11))
    .fill(swatch.yellow.fill)
    .stroke({ width: 4, color: swatch.yellow.line, join: 'round' });
const undoArt = (): Graphics =>
  new Graphics()
    .moveTo(-14, -6)
    .lineTo(-26, 6)
    .lineTo(-8, 14)
    .stroke({ width: 8, color: 0xffffff, cap: 'round', join: 'round' })
    .moveTo(-24, 6)
    .quadraticCurveTo(12, -26, 24, 6)
    .stroke({ width: 8, color: 0xffffff, cap: 'round' });
const playArt = (): Graphics =>
  new Graphics()
    .poly([-14, -22, 24, 0, -14, 22])
    .fill(0xffffff)
    .stroke({ width: 4, color: 0xffffff, join: 'round' });

const ROLE_LINE: Record<Role, LineId> = {
  drum: 'hat-band.drum',
  tune: 'hat-band.tune',
  bass: 'hat-band.low',
};
const CLAUSE_LINE: Record<Clause, LineId> = { first: 'hat-band.clause-first', last: 'hat-band.clause-last' };

/**
 * Hat Band level 4, *Build a song*: three friends, three parts. She picks a part card and taps friends to put their hats
 * on or take them off in it, hearing the part loop; Play plays the song through, Undo steps back, Check plays and judges
 * it against the brief (the tune alone first, everybody last). Rules in `logic.ts`.
 */
export class SongBand implements Game {
  readonly round: SongRound;
  arrange: Arrange = newArrange();
  misses = 0;
  hints = 0;
  /** A played song reached its end since the last edit: the ghost finger listens once before it checks. */
  heardSong = false;
  ready = false;
  /** An accepted Check: the band plays the song once more and bows; nothing else responds. */
  performing = false;
  finished = false;
  readonly singers: Singer[];
  readonly spots: Container[];
  readonly brief: PartCard[];
  readonly parts: PartCard[];
  readonly undo: RoundButton;
  readonly play: RoundButton;
  readonly checkBtn: RoundButton;
  private readonly backdrop: Backdrop;
  private readonly stage = new Graphics();
  private layout!: SongLayout;
  private stopped = false;
  private talking = 0;
  private readonly hinted = new Set<Clause>();
  private hintPart: Part | null = null;
  private hintFriend: number | null = null;
  private readonly named = new Set<Role>();

  constructor(private readonly ctx: GameContext) {
    this.round = makeSongRound(ctx.rng);
    this.backdrop = new Backdrop(
      {
        sky: [0xd9c8f2, 0xfff6e0],
        hills: [0xc9b5ec, 0xb7e3d4, 0xa8dc8f],
        horizon: 0.64,
        clouds: 2,
        seed: 157,
      },
      ctx.view,
    );
    this.stage.eventMode = 'none';
    this.singers = this.round.cast.map(
      (name, i) => new Singer(name, HATS[this.round.hats[i]].role, this.round.hats[i]),
    );
    for (const s of this.singers) ctx.track(s.critter);
    this.spots = this.singers.map((_, i) => {
      const spot = new Container();
      onTap(spot, () => this.tapFriend(i), { cooldown: 150 });
      return spot;
    });
    this.brief = PARTS.map((p) => {
      const card = new PartCard(120, 100, p + 1);
      onTap(card, () => this.tapBrief(p), { cooldown: 300 });
      return card;
    });
    // The brief's pictures: the tune alone first, an open middle, everybody last.
    this.brief[0].badges.forEach((b, i) => (b.visible = ROLE_ORDER[i] === 'tune'));
    this.brief[1].badges.forEach((b) => (b.visible = false));
    const sparkle = sparkleArt();
    sparkle.y = 14;
    this.brief[1].addChild(sparkle);
    this.brief.forEach((c) => c.paint(0xfffaf0, ink, 4, false));
    this.parts = PARTS.map((p) => {
      const card = new PartCard(150, 120, p + 1);
      onTap(card, () => this.tapPart(p), { cooldown: 150 });
      return card;
    });
    this.undo = new RoundButton(undoArt(), swatch.teal, 50, () => this.tapUndo());
    this.play = new RoundButton(playArt(), swatch.blue, 60, () => this.tapPlay());
    this.checkBtn = new RoundButton(checkArt(), swatch.green, 60, () => this.tapCheck());
    ctx.stage.addChild(
      this.backdrop,
      this.stage,
      ...this.brief,
      ...this.singers,
      ...this.spots,
      ...this.parts,
      this.undo,
      this.play,
      this.checkBtn,
    );
    this.resize(ctx.view);
    this.draw();
  }

  start() {
    void this.begin();
  }

  private async begin() {
    await this.ctx.instruct('hat-band.instruct-4');
    if (this.finished) return;
    this.ready = true;
  }

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
    const l = (this.layout = songLayout(v));
    const s = l.stage;
    this.stage
      .clear()
      .rect(s.x + 20, s.y + 30, 16, s.h - 50)
      .fill(wood.fill)
      .stroke(line(wood.line, 4))
      .rect(s.x + s.w - 36, s.y + 30, 16, s.h - 50)
      .fill(wood.fill)
      .stroke(line(wood.line, 4))
      .roundRect(s.x, s.y, s.w, 34, 14)
      .fill(swatch.purple.fill)
      .stroke(line(swatch.purple.line))
      .roundRect(s.x + 10, s.y + s.h - 40, s.w - 20, 40, 14)
      .fill(wood.light)
      .stroke(line(wood.line));
    this.brief.forEach((c, i) =>
      c.position.set(l.brief[i].x + l.brief[i].w / 2, l.brief[i].y + l.brief[i].h / 2),
    );
    this.parts.forEach((c, i) =>
      c.position.set(l.parts[i].x + l.parts[i].w / 2, l.parts[i].y + l.parts[i].h / 2),
    );
    this.singers.forEach((f, i) => f.position.set(l.friends[i].x, l.friends[i].y));
    this.spots.forEach((spot, i) => {
      const r = l.spots[i];
      spot.position.set(r.x, r.y);
      spot.hitArea = new Rectangle(0, 0, r.w, r.h);
    });
    this.undo.position.set(l.undo.x, l.undo.y);
    this.play.position.set(l.play.x, l.play.y);
    this.checkBtn.position.set(l.check.x, l.check.y);
  }

  private get open() {
    return this.ready && !this.performing && !this.finished;
  }
  private get editing() {
    return this.open && this.arrange.playing !== 'check';
  }

  tapFriend(i: number) {
    if (!this.editing) return;
    const s = this.singers[i];
    void this.ctx.tw
      .to(s.critter, { y: -14 }, { duration: 0.08 })
      .then(() => this.ctx.tw.to(s.critter, { y: 0 }, { duration: 0.16 }));
    this.arrange = toggleRole(this.arrange, s.role);
    this.changed();
    if (!this.named.has(s.role)) {
      this.named.add(s.role);
      void this.speak(ROLE_LINE[s.role]);
    }
  }

  tapPart(p: Part) {
    if (!this.editing) return;
    sfx.tick();
    const was = this.arrange.selected;
    this.arrange = select(this.arrange, p);
    if (was !== p) void this.speak(`hat-band.part-${(p + 1) as 1 | 2 | 3}`);
  }

  tapBrief(p: Part) {
    if (!this.ready || this.finished) return;
    sfx.tick();
    this.bounce(this.brief[p]);
    void this.speak(p === 0 ? CLAUSE_LINE.first : p === 2 ? CLAUSE_LINE.last : 'hat-band.clause-middle');
  }

  tapUndo() {
    if (!this.editing || this.arrange.undo.length === 0) return;
    this.arrange = undoStep(this.arrange);
    this.changed();
  }

  tapPlay() {
    if (!this.editing) return;
    this.arrange = playSong(this.arrange, 'song');
    void this.speak('hat-band.play');
  }

  tapCheck() {
    if (!this.editing) return;
    const v = check(this.arrange.song);
    if (v === 'empty') {
      // Never counted: the pet says a part needs somebody and that card glows.
      const r = repair(this.arrange.song)!;
      this.arrange = select(this.arrange, r.part);
      this.hintPart = r.part;
      this.hintFriend = null;
      void this.speak('hat-band.empty-part');
      return;
    }
    this.arrange = playSong(this.arrange, 'check');
  }

  /** Any change to the song ends the glow and means the whole song has to be heard again. */
  private changed() {
    sfx.pop(5);
    this.heardSong = false;
    this.hintPart = null;
    this.hintFriend = null;
  }

  private verdict() {
    const v = check(this.arrange.song);
    if (v === 'ok') {
      void this.speak('hat-band.check-ok');
      this.performing = true;
      this.hintPart = this.hintFriend = null;
      this.arrange = playSong(this.arrange, 'check');
      return;
    }
    if (v === 'empty') return;
    this.misses++;
    sfx.boing();
    const c = CLAUSES.find((x) => x.clause === v)!;
    this.arrange = select(this.arrange, c.part);
    this.bounce(this.brief[c.part]);
    if (this.misses >= 2) this.showHint();
    else void this.speak(CLAUSE_LINE[v]);
  }

  /** The repair's part card and friend glow, and the clause is said again; counted once per clause. */
  private showHint() {
    const r = repair(this.arrange.song);
    if (!r) {
      void this.speak('hat-band.fits');
      return;
    }
    this.hintPart = r.part;
    this.hintFriend = r.clause === 'empty' ? null : friendFor(this.round, r.role);
    if (r.clause === 'empty') {
      void this.speak('hat-band.empty-part');
      return;
    }
    if (!this.hinted.has(r.clause)) {
      this.hinted.add(r.clause);
      this.hints++;
    }
    void this.speak(CLAUSE_LINE[r.clause]);
  }

  askForHint() {
    if (!this.editing) return;
    this.showHint();
  }

  private bounce(c: Container) {
    void this.ctx.tw
      .to(c.scale, { x: 1.12, y: 1.12 }, { duration: 0.12 })
      .then(() => this.ctx.tw.to(c.scale, { x: 1, y: 1 }, { duration: 0.2 }));
  }

  update(dt: number) {
    if (this.stopped) return;
    const step = Math.min(dt, 0.1);
    if (this.ready) {
      const r = advanceSong(this.round, this.arrange, step);
      this.arrange = r.arrange;
      for (const e of r.events) this.voice(e);
      if (r.ended === 'song') this.heardSong = true;
      if (r.ended === 'check') {
        if (this.performing) void this.bow();
        else this.verdict();
      }
    }
    this.draw();
  }

  private voice(e: SongEvent) {
    const g = this.talking > 0 ? 0.5 : 1;
    if (e.role === 'drum') sfx.drum(0.28 * g);
    else if (e.role === 'tune') sfx.marimba(e.pitch!, 0.45 * g);
    else sfx.pluck(e.pitch!, 0.42 * g);
    this.singers[e.friend].glow = 1;
  }

  private draw() {
    const a = this.arrange;
    const through = a.playing !== 'loop';
    // During Play and Check the stage shows the part being heard; otherwise the part she is shaping.
    const shown = through && a.now !== null ? a.now : a.selected;
    const bounce = Math.abs(Math.sin(Math.PI * a.beat));
    this.singers.forEach((s, i) => {
      const on = has(a.song[shown], s.role);
      const sounding = a.now !== null && has(a.mask, s.role) && !this.finished;
      s.glow = Math.max(0, s.glow - 0.07);
      s.flash.alpha = s.glow * 0.55;
      s.critter.y = sounding ? -10 * bounce : 0;
      if (on) {
        s.hat.position.set(0, s.critter.y - HEAD);
        s.hat.scale.set(WORN_SCALE);
      } else {
        // Off: the hat waits at the friend's feet.
        s.hat.position.set(-60, -30);
        s.hat.scale.set(0.45);
      }
      s.hintGlow.visible = this.hintFriend === i && this.hintPart === a.selected;
    });
    this.parts.forEach((c, p) => {
      const mask = a.song[p];
      c.badges.forEach((b, i) => (b.visible = has(mask, ROLE_ORDER[i])));
      const head = through && a.now === p;
      const picked = !through && a.selected === p;
      c.paint(head ? 0xfff3a0 : mask === 0 ? 0xf3ece0 : 0xfffaf0, ink, picked ? 8 : 4, this.hintPart === p);
      c.pivot.y = picked ? 10 : 0;
    });
    this.undo.alpha = a.undo.length > 0 && this.editing ? 1 : 0.4;
    this.play.alpha = this.editing ? 1 : 0.4;
    this.checkBtn.alpha = this.editing || this.performing ? 1 : 0.4;
  }

  private async bow() {
    if (this.finished) return;
    this.finished = true;
    await this.ctx.tw.wait(PER_BEAT);
    this.stopped = true;
    sfx.tada();
    this.ctx.pet.cheer();
    for (const s of this.singers) {
      s.critter.cheer();
      void this.ctx.tw
        .to(s.critter, { rotation: 0.25 }, { duration: 0.3 })
        .then(() => this.ctx.tw.to(s.critter, { rotation: 0 }, { duration: 0.3 }));
    }
    const st = this.layout.stage;
    this.ctx.particles.burst(st.x + st.w / 2, st.y + 60, {
      kind: 'confetti',
      colors: [swatch.red.fill, swatch.yellow.fill, swatch.green.fill, swatch.blue.fill],
      count: 40,
      speed: [200, 520],
      gravity: 600,
      life: [1, 1.6],
    });
    await this.speak('hat-band.bow');
    await this.ctx.tw.wait(0.3);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /** The ghost finger: the repair's card, then its friend, Play to hear it whole, then Check. */
  autotouch(): TouchIntent | null {
    if (!this.editing) return null;
    const move = songBotMove(this.round, this.arrange, this.heardSong);
    if (!move) return null;
    if (move === 'play') return { tap: { on: this.play } };
    if (move === 'check') return { tap: { on: this.checkBtn } };
    if ('part' in move) return { tap: { on: this.parts[move.part] } };
    const r = this.layout.spots[move.friend];
    return { tap: { on: this.spots[move.friend], x: r.w / 2, y: r.h - 60 } };
  }

  destroy() {
    this.finished = true;
    this.stopped = true;
    this.ready = false;
  }
}
