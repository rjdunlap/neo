import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import type { Game, GameContext, TouchIntent } from '../types';
import { shoreFriendArt, shorePlaceArt, tideIcon } from './art';
import {
  hasRoom,
  makeShoreRounds,
  shoreAccepted,
  shoreHint,
  shoreTouch,
  unmet,
  type Arrangement,
  type Place,
  type ShoreFriend,
  type ShoreRound,
} from './logic';

const FRIEND_WORDS: Record<ShoreFriend, string> = { anemone: 'anemone', crab: 'crab', barnacle: 'barnacle' };

interface FriendNode {
  kind: ShoreFriend;
  node: Container;
  art: Graphics;
}

interface PlaceNode {
  place: Place;
  node: Container;
}

/**
 * Each place holds at most two friends, side by side, 124 apart so their touch areas never overlap. The first takes the
 * left slot, so a place with room always shows its open right half to tap.
 */
const SLOT_X = [-62, 62];

/**
 * Levels 8–9, the rocky shore: tap a friend, then a place; the wave button lets the sea go out, which is the test. A test
 * that leaves a friend without what it needs is a free experiment (the sea comes back in); two such tests glow a friend
 * and a good place for it (one hint). Nothing here counts a miss.
 */
export class RockyShore implements Game {
  readonly rounds: ShoreRound[];
  readonly tideButton: RoundButton;
  readonly friends: FriendNode[] = [];
  readonly places: PlaceNode[] = [];
  arrangement: Arrangement = [];
  held: number | null = null;
  roundIndex = -1;
  attempts = 0;
  hints = 0;
  hinting = false;
  busy = true;
  finished = false;
  /** How far in the sea is: 1 covers the shore, 0 has gone out. */
  readonly sea = { in: 1 };

  private readonly backdrop: Backdrop;
  private readonly sand = new Container();
  private readonly placeLayer = new Container();
  private readonly water = new Graphics();
  private readonly friendLayer = new Container();
  private readonly glow = new Graphics();
  private view: View;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.rounds = makeShoreRounds(ctx.level, ctx.rng);
    this.backdrop = new Backdrop(
      {
        sky: [0x91d8f4, 0xeaf9ff],
        hills: [0xf3dc9c, 0xe2c27a],
        horizon: 0.3,
        clouds: 2,
        sun: true,
        seed: 81,
      },
      ctx.view,
    );
    this.water.eventMode = 'none';
    this.glow.eventMode = 'none';
    // The sand along the bottom takes a held friend back off the shore.
    this.sand.eventMode = 'static';
    onTap(this.sand, () => this.toSand(), { cooldown: 220 });
    this.tideButton = new RoundButton(tideIcon(), swatch.blue, 58, () => void this.tide());
    // The sea lies under the places: at high tide they stand in it, and it slides away to show the sand.
    ctx.stage.addChild(
      this.backdrop,
      this.sand,
      this.water,
      this.placeLayer,
      this.friendLayer,
      this.glow,
      this.tideButton,
    );
  }

  get round() {
    return this.rounds[Math.min(this.roundIndex, this.rounds.length - 1)];
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.tideButton.position.set(v.w - 86, v.h - 92);
    this.sand.hitArea = new Rectangle(150, v.h - 170, v.w - 330, 160);
    // Places 260 wide, 300 apart: three fit across the 1024-unit design width with the pet and buttons clear below.
    const placeXs = spread(this.places.length, 40, v.w - 40, 300);
    this.places.forEach((p, i) => p.node.position.set(placeXs[i], this.placeY));
    // Friends on the sand sit in a row between the pet and the wave button.
    const loose = this.friends.map((_, i) => i).filter((i) => this.arrangement[i] === null);
    const trayXs = spread(loose.length, 200, v.w - 190, 130);
    loose.forEach((i, k) => this.friends[i].node.position.set(trayXs[k], v.h - 95));
    for (const p of this.places) {
      const here = this.friends.map((_, i) => i).filter((i) => this.arrangement[i] === p.place);
      here.forEach((i, k) => this.friends[i].node.position.set(p.node.x + SLOT_X[k], p.node.y + 6));
    }
    for (const [i, f] of this.friends.entries()) f.node.scale.set(i === this.held ? 1.12 : 1);
  }

  private get placeY() {
    return this.view.h * 0.5;
  }

  update(dt: number) {
    this.clock += dt;
    this.drawSea();
    const g = this.glow.clear();
    if (this.busy || this.finished) return;
    const pulse = 6 + 2 * Math.sin(this.clock * 6);
    if (this.held !== null) {
      const f = this.friends[this.held].node;
      g.roundRect(f.x - 60, f.y - 60, 120, 120, 26).stroke({ width: pulse, color: swatch.green.fill });
    }
    if (this.hinting) {
      const move = shoreHint(this.round, this.arrangement);
      if (move) {
        const f = this.friends[move.friend].node;
        g.roundRect(f.x - 64, f.y - 64, 128, 128, 26).stroke({ width: pulse, color: swatch.yellow.fill });
        const p = this.places.find((pl) => pl.place === move.place);
        if (p)
          g.roundRect(p.node.x - 136, p.node.y - 96, 272, 192, 34).stroke({
            width: pulse,
            color: swatch.yellow.fill,
          });
        // A friend blocking a full place goes back to the sand first, so the sand glows.
        else if (move.place === 'sand')
          g.roundRect(160, this.view.h - 165, this.view.w - 350, 150, 34).stroke({
            width: pulse,
            color: swatch.yellow.fill,
          });
      }
    }
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.roundIndex < 0 || this.roundIndex >= this.rounds.length)
      return null;
    const touch = shoreTouch(this.round, this.arrangement, this.held);
    if (!touch) return null;
    if (touch === 'tide') return { tap: { on: this.tideButton }, pause: 1 };
    if ('friend' in touch) return { tap: { on: this.friends[touch.friend].node }, pause: 0.35 };
    if (touch.place === 'sand') return { tap: { on: this.sand, x: this.view.w / 2, y: this.view.h - 30 } };
    const p = this.places.find((pl) => pl.place === touch.place);
    // A place the hint points at has room, so its right-hand slot is open.
    return p ? { tap: { on: p.node, x: SLOT_X[1] } } : null;
  }

  destroy() {}

  /** The sea: a band of water round the places at high tide that draws back toward the horizon as it goes out. */
  private drawSea() {
    const v = this.view;
    const top = v.h * 0.3;
    const low = top + 40;
    const high = this.placeY + 110;
    const edge = low + (high - low) * this.sea.in;
    const wave = 8 * Math.sin(this.clock * 2);
    this.water
      .clear()
      .rect(0, top, v.w, edge - top)
      .fill({ color: 0x58b8e0, alpha: 0.85 })
      .moveTo(0, edge + wave)
      .quadraticCurveTo(v.w / 4, edge - 10 - wave, v.w / 2, edge + wave)
      .quadraticCurveTo((3 * v.w) / 4, edge + 10 - wave, v.w, edge + wave)
      .stroke({ width: 6, color: 0xffffff, alpha: 0.85, cap: 'round' });
  }

  private clearRound() {
    for (const f of this.friends.splice(0)) f.node.destroy({ children: true });
    for (const p of this.places.splice(0)) p.node.destroy({ children: true });
    this.arrangement = [];
    this.held = null;
    this.hinting = false;
    this.attempts = 0;
  }

  private async next() {
    this.busy = true;
    this.clearRound();
    this.roundIndex++;
    if (this.roundIndex >= this.rounds.length) return void this.finale();
    const round = this.round;
    for (const place of round.places) {
      const node = new Container();
      node.addChild(shorePlaceArt(place));
      node.hitArea = new Rectangle(-130, -90, 260, 180);
      onTap(node, () => this.tapPlace(place), { cooldown: 250 });
      this.places.push({ place, node });
      this.placeLayer.addChild(node);
    }
    for (const kind of round.friends) {
      const node = new Container();
      const art = shoreFriendArt(kind);
      node.addChild(art);
      node.hitArea = new Rectangle(-56, -56, 112, 112);
      const index = this.friends.length;
      onTap(node, () => this.tapFriend(index), { cooldown: 220 });
      this.friends.push({ kind, node, art });
      this.friendLayer.addChild(node);
    }
    this.arrangement = round.friends.map(() => null);
    this.sea.in = 1;
    this.resize(this.view);
    this.tideButton.visible = true;
    this.busy = false;
    return this.ctx.instruct(round.places.length > 2 ? 'habitat.shore-three' : 'habitat.shore');
  }

  private tapFriend(index: number) {
    if (this.busy || this.finished) return;
    this.held = this.held === index ? null : index;
    sfx.pop(this.held === null ? 3 : 7);
    if (this.held !== null)
      void this.ctx.say('habitat.shore-pick', { friend: FRIEND_WORDS[this.friends[index].kind] });
    this.resize(this.view);
  }

  private tapPlace(place: Place) {
    if (this.busy || this.finished) return;
    const held = this.held;
    if (held === null || this.arrangement[held] === place)
      return void this.ctx.say(`habitat.shore-place.${place}`);
    if (!hasRoom(this.round, this.arrangement, place)) {
      sfx.boing();
      return void this.ctx.say('habitat.shore-full');
    }
    this.arrangement[held] = place;
    this.held = null;
    sfx.pop(6);
    this.resize(this.view);
  }

  private toSand() {
    if (this.busy || this.finished || this.held === null || this.arrangement[this.held] === null) return;
    this.arrangement[this.held] = null;
    this.held = null;
    sfx.pop(3);
    this.resize(this.view);
  }

  private redraw(index: number, open: number) {
    const f = this.friends[index];
    f.art.destroy();
    f.art = shoreFriendArt(f.kind, open);
    f.node.addChild(f.art);
  }

  /** Letting the sea go out is the test, and it is always free. */
  private async tide() {
    if (this.busy || this.finished) return;
    if (this.arrangement.some((p) => p === null)) return void this.ctx.say('habitat.shore-sand');
    this.busy = true;
    this.held = null;
    this.tideButton.visible = false;
    this.resize(this.view);
    sfx.wave(false);
    void this.ctx.say('habitat.shore-tide');
    await this.ctx.tw.to(this.sea, { in: 0 }, { duration: 1.6, ease: ease.inOutSine });

    if (shoreAccepted(this.round, this.arrangement)) {
      this.hinting = false;
      sfx.sparkle();
      for (const f of this.friends) {
        const y = f.node.y;
        void this.ctx.tw
          .to(f.node, { y: y - 24 }, { duration: 0.22, ease: ease.outBack })
          .then(() => this.ctx.tw.to(f.node, { y }, { duration: 0.2 }));
      }
      this.ctx.particles.burst(this.view.w / 2, this.placeY - 40, {
        kind: 'star',
        colors: [swatch.yellow.fill, swatch.blue.fill, swatch.pink.fill],
        count: 18,
        speed: [80, 260],
        gravity: 260,
        life: [0.6, 1.1],
      });
      await this.ctx.say('habitat.shore-ok');
      await this.ctx.tw.wait(0.5);
      return void this.next();
    }

    // Each friend left without its need shows it: an anemone pulls in tight, a crab tucks itself away to wait.
    const wrong = unmet(this.round, this.arrangement);
    this.attempts++;
    for (const i of wrong) {
      if (this.friends[i].kind === 'anemone') this.redraw(i, 0);
      else
        void this.ctx.tw.to(
          this.friends[i].node,
          { alpha: 0.45, x: this.friends[i].node.x + 30 },
          { duration: 0.4 },
        );
    }
    sfx.boing();
    const first = wrong[0];
    const line =
      this.friends[first].kind === 'crab'
        ? 'habitat.shore-crab'
        : this.arrangement[first] === 'high-rock'
          ? 'habitat.shore-anemone-high'
          : 'habitat.shore-anemone-dry';
    await this.ctx.say(line);
    if (this.attempts >= 2 && !this.hinting) {
      this.hinting = true;
      this.hints++;
    }
    sfx.wave(true);
    await this.ctx.tw.to(this.sea, { in: 1 }, { duration: 1.1, ease: ease.inOutSine });
    for (const i of wrong) {
      if (this.friends[i].kind === 'anemone') this.redraw(i, 1);
      this.friends[i].node.alpha = 1;
    }
    this.resize(this.view);
    this.tideButton.visible = true;
    this.busy = false;
    await this.ctx.say(this.hinting && this.attempts === 2 ? 'habitat.shore-glow' : 'habitat.shore-back');
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.tideButton.visible = false;
    sfx.tada();
    this.ctx.pet.cheer();
    await this.ctx.say('habitat.shore-done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: 0, hints: this.hints });
  }
}
