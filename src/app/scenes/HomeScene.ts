import { Container, Ellipse, Rectangle } from 'pixi.js';
import { RAINBOW, swatch } from '../../art/palette';
import { homeBackdrop } from '../../art/home/backdrop';
import {
  arcadeCabinet,
  familyBlanket,
  flowerPatch,
  yardKite,
  noticeBoard,
  projectBasket,
  signpost,
  yardBush,
  yardLodge,
  yardSun,
  yardTreehouse,
} from '../../art/home/yard';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { makeCompanion, type Companion } from '../../creatures/companion';
import { HOME_NAMES, playName, YARD_NAMES } from '../../content/button-names';
import {
  BACKDROP,
  CORNER_RADIUS,
  HOME_NAME_W,
  YARD_SIZE,
  yardLayout,
  type YardSpot,
} from '../../creatures/home-layout';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { openParentPanel } from '../../parent/panel';
import { birthdayDue, settleWorldBand } from '../../progress/bands';
import { store } from '../../progress/store';
import { showsContinue } from '../../content/welcome';
import { earnsShells } from '../../content/shells';
import { RoundButton, squash, spring } from '../../ui/buttons';
import { gearButton } from '../../ui/grownups';
import { peopleIcon } from '../../ui/icons';
import { namePill } from '../../ui/text';
import type { App } from '../App';
import { Scene } from '../Scene';
import { WayOut } from '../leave';
import { PickHost } from '../pick';
import { BallPlay } from './ball-play';

/** Lap and toddler get the ball right here; preschool and older get Play with {pet}, which opens creature play. */
export const youngHome = () => store.data.profile.band === 'lap' || store.data.profile.band === 'toddler';

type YardThing = 'treehouse' | 'board' | 'arcade' | 'signpost' | 'blanket' | 'basket' | 'lodge';

/** A way out of the yard: the thing, the line it says, where it goes. */
interface Way {
  id: YardThing;
  thing: Thing;
  line: LineId;
  go: () => void;
}

/** A thing in the yard: its picture (foot at 0, 0), a name pill under it for grown-ups, and the box a finger can hit. */
class Thing extends Container {
  constructor(
    readonly art: Container,
    size: { w: number; h: number },
    name: string | null,
  ) {
    super();
    this.addChild(art);
    if (name) {
      const pill = namePill(name, 220);
      pill.y = 26;
      this.addChild(pill);
    }
    this.hitArea = new Rectangle(-size.w / 2, -size.h, size.w, size.h + 44);
  }
}

/**
 * The root's Home as a yard to tap around (the developer, 2026-11-28; docs/rework/HOME.md#the-yard): her companion on
 * the paper day backdrop, and every way out is a thing in the picture rather than a button. The treehouse is creature
 * play (Play with {pet}, preschool and older; for the youngest its window lights up), the notice board of six cards is
 * Today's six, the arcade cabinet is every game, the signpost is the way out to the island and the picnic blanket is
 * family play. Welcome a New Friend's basket stands on the grass while that project is open (RW07). A bush, a patch of
 * flowers, the sun, the clouds and the pond only do something. Who's playing sits top left and the grown-ups' gear top
 * right; Home has no Back. The companion only idles and never asks for anything; lap and toddler have the ball. Nothing
 * here is a round: no sticker, no stats. Her birthday (her band went up) is thrown here once, as the island's map throws it.
 */
export class HomeScene extends Scene {
  /** Laid out for a phone held upright as well (chunk 31). */
  upright = true;
  uprightArea = true;
  private readonly backdrop = homeBackdrop(false);
  /** Invisible tap zones over the backdrop's sun, clouds and pond, in the backdrop's own units (it moves with it). */
  private readonly zones = new Container();
  readonly young = youngHome();
  readonly pet: Companion = this.track(makeCompanion());
  readonly who = new RoundButton(peopleIcon(), swatch.white, CORNER_RADIUS, () =>
    this.leave(this.who, 'home.who', () => this.app.go.start()),
  ).named(HOME_NAMES.who, HOME_NAME_W.who);
  readonly treehouse = new Thing(
    yardTreehouse(),
    YARD_SIZE.treehouse,
    this.young ? null : playName(voice.pet),
  );
  readonly board = new Thing(noticeBoard(), YARD_SIZE.board, YARD_NAMES.board);
  readonly arcade = new Thing(arcadeCabinet(), YARD_SIZE.arcade, YARD_NAMES.arcade);
  readonly signpost = new Thing(signpost(), YARD_SIZE.signpost, YARD_NAMES.signpost);
  /** Family play: grown-up couch play, so not for lap and toddler. */
  readonly blanket: Thing | null = this.young
    ? null
    : new Thing(familyBlanket(), YARD_SIZE.blanket, YARD_NAMES.blanket);
  /** Welcome a New Friend (RW07): drawn while the project is open and hers, never empty. */
  readonly basket: Thing | null =
    !this.young && showsContinue(store.welcome, store.data.profile.band)
      ? new Thing(projectBasket(), YARD_SIZE.basket, YARD_NAMES.basket)
      : null;
  /** Lantern Lodge (progression slice 7) on the hill, for the bands that earn shells (grown-ups). */
  readonly lodge: Thing | null = earnsShells(store.data.profile.band)
    ? new Thing(yardLodge(), YARD_SIZE.lodge, YARD_NAMES.lodge)
    : null;
  /** Pick for me (D7a): a kite in the sky that opens the chooser sheet over the yard, every band. */
  private kiteT = 0;
  readonly kite = new Thing(yardKite(), YARD_SIZE.kite, YARD_NAMES.kite);
  readonly pick: PickHost = new PickHost(
    this.app,
    store.data.profile.band,
    this.ui,
    () => this.view,
    (go) => {
      if (this.out.leaving) return;
      this.out.leaving = true;
      this.gear.hide(true);
      go();
    },
  );
  readonly bush = new Thing(yardBush(), YARD_SIZE.bush, null);
  readonly flowers = new Thing(flowerPatch(), YARD_SIZE.flowers, null);
  /** The upright yard's own sun (the backdrop's is out of view there). */
  readonly sun = new Thing(yardSun(), { w: 160, h: 160 }, null);
  /** The ways out under the names the browser suites and older checks use: Play with {pet}, Continue and Today's six. */
  get play(): Thing | null {
    return this.young ? null : this.treehouse;
  }
  get cont(): Thing | null {
    return this.basket;
  }
  get daily(): Thing {
    return this.board;
  }
  /** The signpost, out to the island's places. */
  get explore(): Thing {
    return this.signpost;
  }
  readonly toy: BallPlay | null = this.young
    ? this.track(new BallPlay(this.pet, new Rng(), () => void voice.say('play.fetch')))
    : null;
  /** Grown-ups' way in: hold the gear (the iPad has no Esc key, so this is the way in once a child is playing). */
  private readonly gear = gearButton({
    onOpen: () => {
      if (this.out.leaving) return;
      voice.stop();
      openParentPanel(
        () => (store.data.creatures.owned.length > 0 ? this.app.go.hub() : this.app.go.hatch()),
        () => this.app.go.start(),
        { app: 'root' },
      );
    },
    onShort: () => {
      if (!this.out.leaving) void voice.say('parent.ask');
    },
  });
  /** Her band went up since the world last saw her: a party, once. */
  readonly birthday = birthdayDue(store.data.world, store.data.profile.band);
  private readonly out = new WayOut(
    (seconds) => this.tw.wait(seconds),
    () => this.app.scene === this,
    this.root,
  );

  constructor(app: App) {
    super(app);
  }

  /** Where each way out leads, and what it says on touch-down. */
  private ways(): Way[] {
    const go = this.app.go;
    const all: (Way | null)[] = [
      this.young ? null : { id: 'treehouse', thing: this.treehouse, line: 'home.play', go: () => go.room() },
      { id: 'board', thing: this.board, line: 'daily.go', go: () => go.daily() },
      { id: 'arcade', thing: this.arcade, line: 'explore.all', go: () => go.explore('arcade') },
      { id: 'signpost', thing: this.signpost, line: 'yard.island', go: () => go.explore('places') },
      this.blanket
        ? {
            id: 'blanket',
            thing: this.blanket,
            line: 'explore.family',
            go: () => go.couch(false, { home: true }),
          }
        : null,
      this.basket
        ? { id: 'basket', thing: this.basket, line: 'home.continue', go: () => go.project() }
        : null,
      this.lodge
        ? { id: 'lodge', thing: this.lodge, line: 'yard.lodge', go: () => go.lodge({ home: true }) }
        : null,
    ];
    return all.filter((w): w is Way => !!w);
  }

  init() {
    this.content.sortableChildren = true;
    this.backdrop.zIndex = -1e6;
    this.zones.zIndex = -1e6 + 1;
    const things = [
      this.treehouse,
      this.board,
      this.arcade,
      this.signpost,
      this.blanket,
      this.basket,
      this.lodge,
      this.kite,
      this.bush,
      this.flowers,
      this.sun,
    ];
    this.content.addChild(this.backdrop, this.zones, this.pet, ...things.filter((t): t is Thing => !!t));
    if (this.toy) this.content.addChild(this.toy.shadow, this.toy.ball);
    this.pet.hitArea = this.pet.touchArea(20);
    onTap(this.pet, () => this.pet.poke(), { cooldown: 300 });
    for (const way of this.ways()) {
      onTap(way.thing, () => this.leave(way.thing, way.line, way.go, way.id), { cooldown: 400 });
    }
    if (this.young) onTap(this.treehouse, () => this.lightUp(), { cooldown: 500 });
    // A player with no game Pick could choose from has no dip.
    this.kite.visible = this.pick.button.visible;
    onTap(this.kite, () => this.kiteTug(), { cooldown: 500 });
    onTap(this.bush, () => this.rustle(), { cooldown: 900 });
    onTap(this.flowers, () => this.bloom(), { cooldown: 700 });
    this.sun.hitArea = new Rectangle(-80, -80, 160, 160);
    onTap(this.sun, () => this.shine(), { cooldown: 700 });
    this.buildZones();
    this.ui.addChild(this.who);
    settleWorldBand(store.data.world, store.data.profile.band);
    store.save();
    document.body.appendChild(this.gear.el);
  }

  private get choices(): Container[] {
    return [this.who, ...this.ways().map((w) => w.thing)];
  }

  private leave(node: Container, line: LineId, go: () => void, id?: YardThing) {
    if (this.out.leaving) return;
    sfx.tick();
    if (id) this.wiggle(id, node);
    void this.out.take(node, this.choices, go, () => {
      this.gear.hide(true);
      this.pet.cheer();
      return voice.say(line);
    });
  }

  /** The kite: it swoops, then Pick for me's chooser opens over the yard (D7a; nothing leaves until Play). */
  private kiteTug() {
    if (this.out.leaving || this.pick.covering) return;
    const kite = this.kite.art.getChildByLabel('kite');
    if (kite) {
      kite.rotation = -0.5;
      void this.tw.to(kite, { rotation: 0 }, { duration: 0.5, ease: ease.outBack });
    }
    sfx.whoosh();
    this.pick.open();
  }

  /** The chosen thing does its own little move before the scene leaves: the cards flutter, the screen flashes. */
  private wiggle(id: YardThing, node: Container) {
    const part = (name: string) => (node as Thing).art.getChildByLabel(name, true);
    if (id === 'board') {
      const cards = part('cards');
      cards?.children.forEach(
        (c, i) =>
          void this.tw.to(
            c,
            { rotation: c.rotation + (i % 2 ? 0.25 : -0.25) },
            { duration: 0.15, ease: ease.outBack },
          ),
      );
    } else if (id === 'arcade') {
      const screen = part('screen');
      if (screen) void this.blink(screen);
    } else if (id === 'signpost') {
      const boards = part('boards');
      if (boards) void this.tw.to(boards, { x: 14 }, { duration: 0.2, ease: ease.outBack });
    } else {
      squash(node);
      spring(node, 90);
    }
  }

  private async blink(node: Container) {
    for (let i = 0; i < 3; i++) {
      node.alpha = 0.3;
      await this.tw.wait(0.06);
      node.alpha = 1;
      await this.tw.wait(0.06);
    }
  }

  /** The youngest's treehouse: the window lights up (or goes dark) with a pop. */
  private lightUp() {
    const light = this.treehouse.art.getChildByLabel('light', true);
    if (!light) return;
    sfx.pop(light.alpha > 0.5 ? 5 : 9);
    void this.tw.to(light, { alpha: light.alpha > 0.5 ? 0 : 1 }, { duration: 0.25 });
  }

  /** The bush shakes and a bird pops out of it and flies off. */
  private async rustle() {
    const leaves = this.bush.art.getChildByLabel('leaves', true);
    const bird = this.bush.art.getChildByLabel('bird', true);
    if (!leaves || !bird || bird.visible) return;
    sfx.brush();
    for (const r of [0.08, -0.08, 0.05, 0]) await this.tw.to(leaves, { rotation: r }, { duration: 0.07 });
    bird.visible = true;
    bird.position.set(10, -60);
    bird.alpha = 1;
    sfx.chirp();
    await this.tw.to(bird, { y: -120 }, { duration: 0.25, ease: ease.outBack });
    await this.tw.wait(0.3);
    sfx.chirp(14);
    await this.tw.to(bird, { x: 260, y: -320, alpha: 0 }, { duration: 0.9, ease: ease.inQuad });
    bird.visible = false;
  }

  /** The flowers spin and throw a few petals. */
  private bloom() {
    const heads = this.flowers.art.getChildByLabel('heads', true);
    if (!heads) return;
    sfx.bell(7);
    heads.children.forEach((h, i) => {
      void this.tw.to(
        h,
        { rotation: h.rotation + Math.PI * 2 },
        { duration: 0.6 + i * 0.1, ease: ease.outCubic },
      );
    });
    this.particles.burst(this.flowers.x, this.flowers.y - 80 * this.flowers.scale.y, {
      kind: 'heart',
      colors: [0xff6f91, 0xffd54a, 0x9a6cf0],
      count: 8,
      speed: [80, 200],
      gravity: 120,
    });
  }

  /** The sun spins its rays and sparkles. */
  private shine() {
    const rays = this.sun.art.getChildByLabel('rays', true);
    sfx.sparkle();
    if (rays)
      void this.tw.to(rays, { rotation: rays.rotation + Math.PI / 5 }, { duration: 0.5, ease: ease.outBack });
    this.particles.burst(this.sun.x, this.sun.y, {
      kind: 'star',
      colors: [0xffd54a, 0xffffff],
      count: 14,
      speed: [120, 300],
    });
  }

  /** The backdrop's sun, clouds and pond take taps too: sparkles, a puff, a splash. */
  private buildZones() {
    const ground = -BACKDROP.h + BACKDROP.floor;
    const zone = (shape: Ellipse, act: (x: number, y: number) => void) => {
      const z = new Container();
      z.hitArea = shape;
      onTap(z, () => act(shape.x, shape.y), { cooldown: 500 });
      this.zones.addChild(z);
    };
    const at = (bx: number, by: number) => ({
      x: this.zones.x + bx * this.zones.scale.x,
      y: this.zones.y + by * this.zones.scale.y,
    });
    zone(new Ellipse(560, ground - 330, 80, 80), (x, y) => {
      sfx.sparkle();
      const p = at(x, y);
      this.particles.burst(p.x, p.y, {
        kind: 'star',
        colors: [0xffd54a, 0xffffff],
        count: 14,
        speed: [120, 300],
      });
    });
    for (const [x, y, s] of [
      [-120, ground - 360, 1.1],
      [250, ground - 420, 0.8],
      [700, ground - 250, 0.7],
    ])
      zone(new Ellipse(x, y, 110 * s, 60 * s), (cx, cy) => {
        sfx.whoosh();
        const p = at(cx, cy);
        this.particles.burst(p.x, p.y, {
          kind: 'dot',
          colors: [0xffffff, 0xe6f4fb],
          count: 16,
          speed: [60, 180],
          gravity: 0,
        });
      });
    zone(new Ellipse(470, ground + 108, 270, 80), (cx, cy) => {
      sfx.splash();
      const p = at(cx, cy);
      this.particles.burst(p.x, p.y, {
        kind: 'dot',
        colors: [0x5fb3d9, 0xb6e3f3, 0xffffff],
        count: 18,
        speed: [150, 320],
        gravity: 600,
        angle: -Math.PI / 2,
        spread: 1.2,
      });
    });
  }

  resize(v: View) {
    const l = yardLayout(v, this.young, !!this.basket);
    this.backdrop.position.set(l.backdrop.x, l.backdrop.y);
    this.backdrop.scale.set(l.backdrop.scale);
    this.zones.position.set(l.backdrop.x, l.backdrop.y);
    this.zones.scale.set(l.backdrop.scale);
    this.who.position.set(l.who.x, l.who.y);
    const put = (t: Thing | null, at: YardSpot | null) => {
      if (!t || !at) return;
      t.position.set(at.x, at.y);
      t.scale.set(at.scale);
      t.zIndex = at.y;
    };
    put(this.treehouse, l.treehouse);
    put(this.board, l.board);
    put(this.arcade, l.arcade);
    put(this.signpost, l.signpost);
    put(this.blanket, l.blanket);
    put(this.basket, l.basket);
    put(this.lodge, l.lodge);
    put(this.kite, l.kite);
    put(this.bush, l.bush);
    put(this.flowers, l.flowers);
    this.sun.visible = !!l.sun;
    put(this.sun, l.sun);
    // A name pill stays its own size, whatever the thing's scale.
    for (const t of [
      this.treehouse,
      this.board,
      this.arcade,
      this.signpost,
      this.blanket,
      this.basket,
      this.lodge,
      this.kite,
    ])
      t?.children[1]?.scale.set(1 / t.scale.x);
    if (!this.toy?.chasing) this.pet.position.set(l.stage.x, l.stage.y);
    this.pet.scale.set(l.stage.scale * Math.sign(this.pet.scale.x || 1), l.stage.scale);
    if (this.toy && l.ball) this.toy.place(l.floor, l.ball);
    this.pick.resize(v);
  }

  update(dt: number) {
    super.update(dt);
    this.pick.update(dt);
    // The kite bobs and leans on the breeze.
    this.kiteT += dt;
    const kite = this.kite.art.getChildByLabel('kite');
    if (kite) {
      kite.x = Math.sin(this.kiteT * 0.9) * 10;
      kite.y = -150 + Math.sin(this.kiteT * 1.3) * 6;
    }
    this.pet.zIndex = this.pet.y;
    if (this.toy) {
      // The ball always draws (and takes touches) over her friend, who stops beside it.
      this.toy.ball.zIndex = 1e6;
      this.toy.shadow.zIndex = -1e5;
    }
  }

  enter() {
    music.play(STYLES.hub);
    if (this.birthday) void this.party();
    else void voice.say('home.hello');
  }

  /** Her birthday, with the island's line: confetti and a cheer. */
  private async party() {
    await this.tw.wait(0.7);
    void voice.say('map.birthday');
    sfx.tada();
    this.pet.cheer();
    this.particles.burst(this.view.w / 2, this.view.h * 0.5, {
      kind: 'confetti',
      colors: RAINBOW.map((c) => swatch[c].fill),
      count: 70,
      speed: [200, 500],
      gravity: 160,
    });
  }

  destroy() {
    this.gear.destroy();
    super.destroy();
  }
}
