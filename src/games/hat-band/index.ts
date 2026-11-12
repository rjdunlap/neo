import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { musicNote, starPoints } from '../../art/shapes';
import { Backdrop } from '../../art/scenery';
import { silenced, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { barsArt, checkArt, drumArt, HEAD, hatArt, line, WORN_SCALE } from './art';
import {
  LEVELS,
  advance,
  BEATS,
  botMove,
  canFinish,
  earlyDone,
  HAT,
  HATS,
  hatBandLayout,
  makeRound,
  newBand,
  nextStep,
  PER_BEAT,
  planFor,
  spotlight,
  STAR,
  takeOff,
  voices,
  waitLeft,
  wear,
  type Band,
  type BeatEvent,
  type Friend,
  type HatBandLayout,
  type HatId,
  type Plan,
  type Round,
  HAT_IDS,
} from './logic';
import { SongBand } from './song';

/** A hat she can lift: drag it onto a friend, or tap it and then tap the friend. */
class HatPiece extends Container {
  readonly glow = new Graphics();
  readonly hintGlow = new Graphics();
  handle!: DragHandle;
  constructor(readonly id: HatId) {
    super();
    this.glow
      .roundRect(-HAT / 2 - 6, -HAT / 2 - 6, HAT + 12, HAT + 12, 30)
      .fill({ color: 0xfff3a0, alpha: 0.95 })
      .stroke({ width: 5, color: ink });
    this.glow.visible = false;
    this.hintGlow
      .roundRect(-HAT / 2 - 12, -HAT / 2 - 12, HAT + 24, HAT + 24, 34)
      .fill({ color: 0xffe066, alpha: 0.9 });
    this.hintGlow.visible = false;
    this.addChild(this.hintGlow, this.glow, hatArt(id));
    // 140 local units: still 112 across at the worn hat's scale.
    this.hitArea = new Rectangle(-70, -70, 140, 140);
  }
}

/** A friend on the stage: the critter, its prop while it wears a hat, a flash on each note and the pending ring. */
class Player extends Container {
  readonly critter: Critter;
  readonly flash = new Graphics();
  readonly ring = new Graphics();
  readonly drum = drumArt(1.1);
  readonly bars = barsArt();
  glow = 0;
  constructor(name: keyof typeof CRITTERS) {
    super();
    this.critter = new Critter(CRITTERS[name]);
    this.critter.scale.set(0.62);
    this.flash.circle(0, 0, 92).fill({ color: 0xfff3a0, alpha: 1 });
    this.flash.position.set(0, -80);
    this.flash.alpha = 0;
    this.drum.position.set(0, -20);
    this.bars.position.set(0, -22);
    this.drum.visible = this.bars.visible = false;
    this.addChild(this.flash, this.critter, this.drum, this.bars, this.ring);
    this.eventMode = 'none';
  }
}

function starArt(on: boolean): Graphics {
  return new Graphics()
    .poly(starPoints(30, 13))
    .fill(on ? 0xffffff : swatch.yellow.light)
    .stroke({ width: 4, color: ink, join: 'round' });
}

class HatBand implements Game {
  readonly plan: Plan;
  readonly round: Round;
  band: Band = newBand();
  /** The hat lifted by a tap (the drag engine holds it), waiting for a friend to be tapped or on its way to one. */
  get selected(): HatId | null {
    for (const [id, piece] of this.hats) if (piece.handle.held || piece.handle.placing) return id;
    return null;
  }
  /** True once the instruction has been spoken: until then the hats stay put, so speech never competes with the band. */
  ready = false;
  /** Done was pressed at the gate: the band plays one more bar and bows; nothing else responds. */
  performing = false;
  finished = false;
  readonly hats = new Map<HatId, HatPiece>();
  readonly friends: Player[];
  readonly spots: Container[];
  readonly stars: RoundButton[] = [];
  readonly done: RoundButton;
  private readonly backdrop: Backdrop;
  private readonly stage = new Graphics();
  private readonly rackBoard = new Graphics();
  private layout!: HatBandLayout;
  private stopped = false;
  private encoreFrom = 0;
  private talking = 0;
  private hintFor = 0;
  private hintStar: Friend | null = null;
  private hintHat: HatId | null = null;
  private readonly named = new Set<HatId>();

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.round = makeRound(ctx.rng, ctx.level);
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
    this.rackBoard.eventMode = 'none';
    this.friends = this.round.cast.map((name) => new Player(name));
    for (const f of this.friends) ctx.track(f.critter);
    this.spots = ([0, 1] as Friend[]).map((i) => {
      const spot = new Container();
      // A place: a hat held by a tap goes on the friend tapped.
      onTap(spot, () => this.tapFriend(i), { cooldown: 150, place: true });
      return spot;
    });
    ctx.stage.addChild(this.backdrop, this.stage, this.rackBoard, ...this.friends, ...this.spots);
    if (this.plan.mode !== 'put') {
      for (const i of [0, 1] as Friend[]) {
        const star = new RoundButton(starArt(false), swatch.yellow, STAR, () => this.tapStar(i));
        this.stars.push(star);
        ctx.stage.addChild(star);
      }
    }
    this.done = new RoundButton(checkArt(), swatch.green, 60, () => this.tapDone());
    ctx.stage.addChild(this.done);
    for (const id of this.round.rack) {
      const piece = new HatPiece(id);
      piece.handle = draggable(piece, ctx.tw, {
        // A rack hat is lifted by a tap and put on by the next; a tap on a worn hat takes it off.
        tapToPlace: () => this.open && !this.band.worn.includes(id),
        onPick: () => this.pick(piece),
        onDrop: (x, y) => this.drop(piece, x, y),
      });
      piece.handle.enabled = false;
      this.hats.set(id, piece);
      ctx.stage.addChild(piece);
    }
    this.resize(ctx.view);
    this.draw();
  }

  start() {
    void this.begin();
  }

  private async begin() {
    await this.speak('hat-band.intro', { name: this.ctx.childName });
    await this.ctx.instruct(
      `hat-band.instruct-${this.ctx.level <= 1 ? 1 : this.ctx.level >= 3 ? 3 : 2}` as const,
    );
    if (this.finished) return;
    this.ready = true;
    for (const p of this.hats.values()) p.handle.enabled = true;
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
    const l = (this.layout = hatBandLayout(v, this.ctx.level, this.round.rack.length));
    const s = l.stage;
    // A little stage: a curtain rail and two posts over a wooden floor.
    this.stage
      .clear()
      .rect(s.x + 20, s.y + 30, 16, s.h - 50)
      .fill(wood.fill)
      .stroke(line(wood.line, 4))
      .rect(s.x + s.w - 36, s.y + 30, 16, s.h - 50)
      .fill(wood.fill)
      .stroke(line(wood.line, 4))
      .roundRect(s.x, s.y, s.w, 40, 14)
      .fill(swatch.purple.fill)
      .stroke(line(swatch.purple.line))
      .roundRect(s.x + 10, s.y + s.h - 40, s.w - 20, 40, 14)
      .fill(wood.light)
      .stroke(line(wood.line));
    for (let i = 0; i < 6; i++)
      this.stage
        .circle(s.x + 50 + (i * (s.w - 100)) / 5, s.y + 40, 10)
        .fill(swatch.yellow.fill)
        .stroke(line(swatch.yellow.line, 3));
    // The rack: a shelf under each hat's place.
    this.rackBoard.clear();
    for (const r of l.rack)
      this.rackBoard
        .roundRect(r.x - 4, r.y + r.h - 18, r.w + 8, 18, 8)
        .fill(wood.fill)
        .stroke(line(wood.line, 4));
    this.friends.forEach((f, i) => f.position.set(l.friends[i].x, l.friends[i].y));
    this.spots.forEach((spot, i) => {
      const r = l.spots[i];
      spot.position.set(r.x, r.y);
      spot.hitArea = new Rectangle(0, 0, r.w, r.h);
    });
    this.stars.forEach((star, i) => star.position.set(l.stars![i].x, l.stars![i].y));
    this.done.position.set(l.done.x, l.done.y);
    this.placeHats(false);
  }

  /** Each hat's home: its rack place, or the head of the friend wearing it. */
  private home(id: HatId): { x: number; y: number; scale: number } {
    const f = this.band.worn.indexOf(id);
    if (f >= 0) return { x: this.layout.friends[f].x, y: this.layout.friends[f].y - HEAD, scale: WORN_SCALE };
    const r = this.layout.rack[this.round.rack.indexOf(id)];
    return { x: r.x + r.w / 2, y: r.y + r.h / 2, scale: 1 };
  }

  private placeHats(animate: boolean) {
    for (const [id, piece] of this.hats) {
      const h = this.home(id);
      piece.handle.home = { x: h.x, y: h.y };
      if (piece.handle.dragging) continue;
      if (piece.handle.held) {
        // Held by a tap: it waits at its (new) home and keeps breathing.
        piece.position.set(h.x, h.y);
        continue;
      }
      if (animate) {
        void this.ctx.tw.to(piece, { x: h.x, y: h.y }, { duration: 0.3 });
        void this.ctx.tw.to(piece.scale, { x: h.scale, y: h.scale }, { duration: 0.3 });
      } else {
        piece.position.set(h.x, h.y);
        piece.scale.set(h.scale);
      }
    }
  }

  private get open() {
    return this.ready && !this.performing && !this.finished;
  }

  private pick(piece: HatPiece) {
    sfx.tick();
    this.clearHint();
    // Touch-down feedback: the hat lifts (the drag does that) and glows.
    piece.glow.visible = true;
    // Each hat names its job the first time she lifts it, so handling hats never keeps the band ducked.
    if (this.band.worn.includes(piece.id) || this.named.has(piece.id)) return;
    this.named.add(piece.id);
    void this.speak(HATS[piece.id].role === 'drum' ? 'hat-band.drum' : 'hat-band.tune');
  }

  /** The friend under a point in the stage's coordinates, if any. */
  private friendAt(x: number, y: number): Friend | null {
    const i = this.layout.spots.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
    return i < 0 ? null : (i as Friend);
  }

  private drop(piece: HatPiece, x: number, y: number): boolean {
    const id = piece.id;
    const wornBy = this.band.worn.indexOf(id);
    if (!this.open) {
      this.placeHats(true);
      return true;
    }
    // A drag, a tapped put-down and a cancelled hold all arrive here; only a still tap on a worn hat is its own thing.
    const to = piece.handle.tapped ? null : this.friendAt(x, y);
    if (to !== null) this.put(to, id);
    else if (wornBy >= 0) this.change(takeOff(this.band, wornBy as Friend));
    this.placeHats(true);
    return true;
  }

  private put(friend: Friend, hat: HatId) {
    this.change(wear(this.band, friend, hat));
    const f = this.friends[friend];
    f.critter.cheer();
  }

  private change(next: Band) {
    if (next === this.band) return;
    this.band = next;
    sfx.pop(5);
  }

  tapFriend(i: Friend) {
    if (!this.open) return;
    this.clearHint();
    const f = this.friends[i];
    // Touch-down feedback: the friend hops.
    void this.ctx.tw
      .to(f.critter, { y: -14 }, { duration: 0.08 })
      .then(() => this.ctx.tw.to(f.critter, { y: 0 }, { duration: 0.16 }));
    // This spot is a place: the engine has already sent a held hat gliding here, and it lands through `drop`.
  }

  tapStar(i: Friend) {
    if (!this.open) return;
    this.clearHint();
    if (this.band.worn[i] === null) {
      // Nothing to hear alone yet: the empty friend gives a little shrug.
      void this.ctx.tw
        .to(this.friends[i], { rotation: 0.08 }, { duration: 0.08 })
        .then(() => this.ctx.tw.to(this.friends[i], { rotation: 0 }, { duration: 0.12 }));
      return;
    }
    const was = this.band.solo;
    this.band = spotlight(this.band, i);
    void this.speak(this.band.solo === null ? 'hat-band.solo-off' : 'hat-band.solo-on');
    if (was !== this.band.solo) sfx.tick();
  }

  tapDone() {
    if (!this.open) return;
    if (!canFinish(this.band, this.ctx.level)) {
      // Never counted: the pet says what Done is waiting for and the next thing to try glows.
      const step = nextStep(this.round, this.band, this.ctx.level);
      this.hintHat = step.hat ?? null;
      this.hintStar = step.star ?? null;
      this.hintFor = 3;
      void this.speak(`hat-band.${earlyDone(this.band, this.ctx.level)}` as const);
      return;
    }
    this.clearHint();
    this.performing = true;
    for (const p of this.hats.values()) p.handle.enabled = false;
    this.encoreFrom = this.band.played;
  }

  private clearHint() {
    this.hintFor = 0;
    this.hintHat = null;
    this.hintStar = null;
  }

  update(dt: number) {
    if (this.stopped) return;
    // A frame after the app was in the background can be long; never let it fire a burst of notes.
    const step = Math.min(dt, 0.1);
    if (this.ready && !(this.performing && this.band.played - this.encoreFrom >= BEATS)) {
      const r = advance(this.band, step);
      this.band = r.band;
      for (const e of r.events) this.voice(e);
      if (this.performing && this.band.played - this.encoreFrom >= BEATS) void this.bow(PER_BEAT);
    }
    if (this.hintFor > 0 && (this.hintFor -= step) <= 0) this.clearHint();
    this.sway();
    this.draw();
  }

  private voice(e: BeatEvent) {
    const g = this.talking > 0 ? 0.5 : 1;
    // One fixed gain per voice, the drum below the tune.
    if (e.pitch === null) sfx.drum(0.28 * g);
    else sfx.marimba(e.pitch, 0.45 * g);
    this.friends[e.friend].glow = 1;
  }

  /** Friends wearing a sounding hat bob on its beat; the others stand ready. */
  private sway() {
    const playing = voices(this.band.sounding);
    const bounce = Math.abs(Math.sin(Math.PI * this.band.beat));
    this.friends.forEach((f, i) => {
      f.glow = Math.max(0, f.glow - 0.07);
      f.flash.alpha = f.glow * 0.6;
      const base = this.layout.friends[i];
      const on = playing.includes(i as Friend) && !this.finished;
      f.y = on ? base.y - 10 * bounce : base.y;
      // The worn hat rides along with the bob.
      const hat = this.band.worn[i];
      if (hat) {
        const piece = this.hats.get(hat)!;
        if (!piece.handle.dragging && !this.ctx.tw.busy(piece)) piece.y = f.y - HEAD;
      }
    });
  }

  private draw() {
    const b = this.band;
    const holding = [...this.hats.values()].some((p) => p.handle.held);
    for (const [id, piece] of this.hats) {
      piece.glow.visible = piece.handle.dragging || piece.handle.held;
      // While a hat is held, a tap on a worn hat reaches the friend under it, so the held hat swaps in.
      piece.eventMode = holding && b.worn.includes(id) ? 'none' : 'static';
      piece.hintGlow.visible = this.hintHat === id;
      // A worn hat dims with its friend under the other's spotlight (below); on the rack it is always bright.
      piece.alpha = 1;
    }
    const waiting = waitLeft(b);
    this.friends.forEach((f, i) => {
      const hat = b.worn[i];
      f.drum.visible = !!hat && HATS[hat].role === 'drum';
      f.bars.visible = !!hat && HATS[hat].role === 'tune';
      // The spotlight dims the other friend; the dimmed one stays dressed.
      f.alpha = b.solo !== null && b.solo !== i ? 0.4 : 1;
      if (hat && this.hats.get(hat)) this.hats.get(hat)!.alpha = f.alpha;
      f.ring.clear();
      const joining =
        hat !== b.sounding.worn[i] || (b.solo !== b.sounding.solo && (b.solo === i || b.sounding.solo === i));
      if (joining && waiting > 0) {
        // A ring that empties as the next beat comes, and a little clock face: wait a moment.
        const cx = 70,
          cy = -150,
          a0 = -Math.PI / 2;
        f.ring
          .moveTo(cx + 22 * Math.cos(a0), cy + 22 * Math.sin(a0))
          .arc(cx, cy, 22, a0, a0 + Math.PI * 2 * Math.max(0.02, waiting))
          .stroke({ width: 7, color: ink, cap: 'round' });
        f.ring
          .circle(cx, cy, 10)
          .fill(0xffffff)
          .stroke({ width: 3, color: ink })
          .moveTo(cx, cy)
          .lineTo(cx, cy - 6)
          .stroke({ width: 2, color: ink });
      }
    });
    this.stars.forEach((star, i) => {
      star.alpha = b.worn[i] === null ? 0.45 : 1;
      star.scale.set(
        b.solo === i ? 1.12 : this.hintStar === i ? 1.08 + 0.06 * Math.sin(this.hintFor * 8) : 1,
      );
    });
    this.done.alpha = canFinish(b, this.ctx.level) || this.performing ? 1 : 0.4;
  }

  private async bow(lastBeat: number) {
    if (this.finished) return;
    this.finished = true;
    await this.ctx.tw.wait(lastBeat);
    this.stopped = true;
    sfx.tada();
    this.ctx.pet.cheer();
    for (const f of this.friends) {
      f.critter.cheer();
      void this.ctx.tw
        .to(f.critter, { rotation: 0.25 }, { duration: 0.3 })
        .then(() => this.ctx.tw.to(f.critter, { rotation: 0 }, { duration: 0.3 }));
    }
    const s = this.layout.stage;
    this.ctx.particles.burst(s.x + s.w / 2, s.y + 60, {
      kind: 'confetti',
      colors: [swatch.red.fill, swatch.yellow.fill, swatch.purple.fill, swatch.blue.fill],
      count: 40,
      speed: [200, 520],
      gravity: 600,
      life: [1, 1.6],
    });
    await this.speak('hat-band.bow');
    await this.ctx.tw.wait(0.3);
    this.ctx.finish({ misses: 0, hints: 0 });
  }

  /** The ghost finger: tap a hat, tap a friend, the stars at level 3, then Done once it lights. Never a dim Done. */
  autotouch(): TouchIntent | null {
    if (!this.open) return null;
    const move = botMove(this.round, this.band, this.ctx.level, this.selected);
    if (!move) return null;
    if (move === 'done') return { tap: { on: this.done } };
    if ('hat' in move) return { tap: { on: this.hats.get(move.hat)! } };
    if ('friend' in move)
      return {
        tap: {
          on: this.spots[move.friend],
          x: this.layout.spots[move.friend].w / 2,
          y: this.layout.spots[move.friend].h - 60,
        },
      };
    return { tap: { on: this.stars[move.star] } };
  }

  destroy() {
    this.finished = true;
    this.stopped = true;
    this.ready = false;
    for (const p of this.hats.values()) p.handle.destroy();
  }
}

class HatBandIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    c.addChild(
      new Graphics()
        .rect(-110, -200, 14, 130)
        .fill(wood.fill)
        .stroke(line(wood.line, 4))
        .rect(96, -200, 14, 130)
        .fill(wood.fill)
        .stroke(line(wood.line, 4))
        .roundRect(-125, -215, 250, 30, 10)
        .fill(swatch.purple.fill)
        .stroke(line(swatch.purple.line, 5))
        .roundRect(-120, -80, 240, 30, 10)
        .fill(wood.light)
        .stroke(line(wood.line, 5)),
    );
    const drum = hatArt('steady');
    drum.position.set(-48, -130);
    const tune = hatArt('cuckoo');
    tune.position.set(52, -126);
    c.addChild(drum, tune);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const names = (Object.keys(CRITTERS) as (keyof typeof CRITTERS)[]).filter(
    (n) => n !== 'bear' && n !== 'pip',
  );
  const friend = new Critter(CRITTERS[rng.pick(names)]);
  friend.alive = false;
  friend.scale.set(0.5);
  friend.position.set(-20, 80);
  const id = rng.pick(HAT_IDS);
  const hat = hatArt(id);
  hat.scale.set(0.7);
  hat.position.set(-20, 80 - 145);
  const badge = HATS[id].role === 'drum' ? drumArt(0.9) : musicNote(new Graphics(), 40, ink);
  badge.position.set(70, 40);
  c.addChild(friend, hat, badge);
  return c;
}

export const hatBand: GameModule = {
  id: 'hat-band',
  upright: true,
  name: 'Hat Band',
  titleLine: 'game.hat-band',
  region: 'music-mountain',
  challenge: 'music',
  skills: ['listening', 'musical roles', 'texture', 'cause and effect'],
  bands: ['preschool', 'prek', 'school', 'grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  // The band is the music; the island's loop stays silent so it never competes.
  music: silenced(STYLES.jelly),
  coplayHint:
    'One of you puts a hat on the first friend and the other dresses the second; then swap hats. A grown-up can ask "which friend plays the beat?"',
  offScreen:
    'With a willing grown-up, one hums a steady "boom, boom" and the other hums a little tune over it; then swap. Just listening is fine too.',
  hubIcon: () => new HatBandIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => (planFor(ctx.level).mode === 'arrange' ? new SongBand(ctx) : new HatBand(ctx)),
};
