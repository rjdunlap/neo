import { Container, Graphics, Rectangle } from 'pixi.js';
import { landmarkFor } from '../../art/lands';
import { cream, grass, ink, RAINBOW, swatch } from '../../art/palette';
import { makeCompanion } from '../../creatures/companion';
import { checkBadge, picnicLandmark } from '../../art/picnic';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import {
  LANDS,
  MAP_RADIUS,
  mapLayout,
  mapSpotScale,
  visibleIn,
  type Land,
  type MapSpotId,
} from '../../content/lands';
import { placeFor } from '../../content/places';
import { anyNew } from '../../content/shelf';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { GAMES } from '../../games/registry';
import { openParentPanel } from '../../parent/panel';
import { birthdayDue, settleWorldBand, type Band } from '../../progress/bands';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { gearButton } from '../../ui/grownups';
import { bookIcon, houseIcon, peopleIcon, treehouseIcon } from '../../ui/icons';
import { Sparkle } from '../../ui/sparkle';
import { label } from '../../ui/text';
import type { App } from '../App';
import { Scene } from '../Scene';
import { lastLand } from './LandScene';
import { ScreenKeys, type FocusSpot } from '../screen-keys';

/** Land drawings are a little smaller on the map than the age places were, so twelve spots fit. */
const LANDMARK_SCALE = 0.85;

/**
 * The island: ten themed lands, her home spot (her age place, with every game for her age and younger) and the
 * Windy Picnic. Every land is open; a land twinkles while it holds a game she has not played. The pet waits
 * where she was last, and when she has a birthday the home spot becomes her new age place.
 */
export class MapScene extends Scene {
  /** Takes keys itself. */
  override padPointer = false;
  private readonly sea = new Graphics();
  private readonly island = new Graphics();
  private readonly glow = new Graphics();
  private readonly map = new Container();
  /** At the root, a little boat bobs in the corner's sea; tap it and it toots and bobs. */
  readonly boat = new Container();
  private boatT = 0;
  /** At the root, a gull circles the island over the sea's edge; tap it and it calls and loops. */
  readonly gull = new Container();
  private readonly wings = new Graphics();
  private gullT = 0.15;
  private gullLoop = false;
  /** Seconds to the next whale spout somewhere in the sea (on its own, nothing to tap). */
  private spoutIn = 4;
  readonly pip = makeCompanion();
  private readonly title = label('Puddle Island', 42, ink);
  private readonly book = new RoundButton(bookIcon(), swatch.white, 52, () =>
    this.leave(() => this.app.go.stickers()),
  );
  private readonly treehouse = new RoundButton(treehouseIcon(), swatch.white, 52, () =>
    this.leave(() => {
      void voice.say('map.room');
      this.app.go.room();
    }),
  );
  /**
   * Back to "Who's playing?", for someone else's turn. It changes nothing and removes nothing, so it needs no hold. At the
   * root it is a house instead, back to Home's yard, which has Who's playing itself.
   */
  readonly players = new RoundButton(peopleIcon(), swatch.white, 52, () =>
    this.leave(() => {
      if (!this.atRoot) return this.app.go.start();
      void voice.say('nav.home');
      this.app.go.hub();
    }),
  );
  /** Grown-ups' way in: hold the gear (the iPad has no Esc key, so this is the way in once a child is playing). */
  private readonly gear = gearButton({
    onOpen: () => {
      if (this.leaving) return;
      voice.stop();
      openParentPanel(
        () => (store.data.creatures.owned.length > 0 ? this.app.go.hub() : this.app.go.hatch()),
        () => this.app.go.start(),
        { app: 'classic' },
      );
    },
    onShort: () => void voice.say('parent.ask'),
  });
  /** The lands, each with its drawing and, while it holds a game she has not played, a twinkle. */
  readonly lands: { def: Land; node: Container; sparkle: Sparkle | null }[] = [];
  /** Her home spot: her age place. */
  readonly home = new Container();
  /** The age place the home spot shows (the old one until a birthday's swap). */
  homeBand: Band;
  /** The Windy Picnic: a story, open to every age. */
  readonly picnic = new Container();
  private readonly picnicDone = checkBadge(20);
  private leaving = false;
  walking = false;
  /** Her band went up since the last visit: the home spot changes, with a party. */
  readonly birthday: boolean;
  /** Where the pet waits: the last land she was in this session, or home. */
  petAt: MapSpotId;
  private clock = 0;
  /** Keys and a pad: a ring over the lands, home, the picnic and the three buttons. No Back here: the map is the middle of the island. */
  private readonly keys = new ScreenKeys(this.app, {
    spots: () => this.focusSpots(),
    active: () => !this.leaving && !this.walking,
  });

  /**
   * `atRoot`: the island map in the main app (2026-11-28), reached from the yard's signpost and every location's Back.
   * There it lays out upright too, its home spot is Home's yard (the treehouse), the corner button is a house back to
   * the yard, the treehouse button is not drawn (the yard has the treehouse), and Home throws the birthday, not the map.
   */
  constructor(
    app: App,
    readonly atRoot = false,
  ) {
    super(app);
    this.upright = atRoot;
    this.uprightArea = atRoot;
    const { world, profile } = store.data;
    this.birthday = !atRoot && birthdayDue(world, profile.band);
    this.homeBand = this.birthday ? world.band! : profile.band;
    this.petAt = this.birthday ? 'home' : (lastLand() ?? 'home');
  }

  init() {
    const { world, profile } = store.data;
    if (this.atRoot) {
      // The corner button is a house to the yard; the yard has the treehouse, so its button here is not drawn.
      this.players.children[1].destroy();
      this.players.addChildAt(houseIcon(), 1);
      this.players.means('home');
      this.treehouse.visible = false;
    }
    this.map.addChild(this.island, this.glow);
    this.content.addChild(this.sea, this.map);
    if (this.atRoot) this.alive();
    for (const def of LANDS) {
      const node = new Container();
      const art = landmarkFor(def.id);
      art.scale.set(LANDMARK_SCALE);
      const name = label(def.name, 21, ink);
      name.y = 70;
      node.addChild(new Graphics().ellipse(0, 34, 84, 28).fill(cream), art, name);
      let sparkle: Sparkle | null = null;
      if (
        anyNew(
          store.data.games,
          visibleIn(def, profile.band, GAMES).map((g) => g.id),
        )
      ) {
        sparkle = this.track(new Sparkle(24));
        sparkle.position.set(70, -70);
        node.addChild(sparkle);
      }
      onTap(node, () => void this.visit(def), { radius: MAP_RADIUS });
      this.lands.push({ def, node, sparkle });
      this.map.addChild(node);
    }
    this.drawHome(this.homeBand);
    onTap(this.home, () => void this.visitHome(), { radius: MAP_RADIUS });
    this.map.addChild(this.home);

    const name = label('Windy Picnic', 21, ink);
    name.y = 70;
    const note = label('a story · 4–8 years', 14, swatch.white.line, '500');
    note.y = 90;
    this.picnicDone.position.set(70, -40);
    this.picnicDone.visible = store.picnic.keepsake;
    const picnicArt = picnicLandmark();
    picnicArt.scale.set(LANDMARK_SCALE);
    this.picnic.addChild(
      new Graphics().ellipse(0, 34, 84, 28).fill(cream),
      picnicArt,
      name,
      note,
      this.picnicDone,
    );
    onTap(this.picnic, () => void this.visitPicnic(), { radius: MAP_RADIUS });
    this.map.addChild(this.picnic);

    settleWorldBand(world, profile.band);
    store.save();
    // The pet only decorates the map: it stands beside a spot, so it must never take a tap meant for one.
    this.pip.scale.set(0.3);
    this.pip.eventMode = 'none';
    this.map.addChild(this.track(this.pip));
    this.ui.addChild(this.title, this.book, this.treehouse, this.players);
    this.ui.addChild(this.keys.ring);
    this.keys.focus.focusOn(this.petAt);
    document.body.appendChild(this.gear.el);
  }

  /**
   * The main app's island does things between its places (2026-11-28, "things happening"): the sea splashes and a fish
   * jumps where it is tapped, the grass sprouts a flower, a boat bobs in the corner and toots when tapped, a gull circles
   * the island and loops when tapped, and now and then a whale spouts somewhere at sea. None is a way
   * out, none is a round, and the places on top keep their own taps.
   */
  private alive() {
    this.sea.eventMode = 'static';
    onTap(
      this.sea,
      (e) => {
        if (this.leaving) return;
        const p = this.content.toLocal(e.global);
        const v = this.view;
        const dx = (p.x - v.w / 2) / (v.w * 0.48),
          dy = (p.y - (v.h / 2 + 22)) / (v.h * 0.43);
        if (dx * dx + dy * dy < 1) {
          sfx.pop(9);
          this.particles.burst(p.x, p.y, {
            kind: 'heart',
            colors: [swatch.pink.fill, swatch.yellow.fill, swatch.purple.fill],
            count: 6,
            speed: [60, 160],
            gravity: 120,
          });
        } else {
          sfx.splash();
          this.particles.burst(p.x, p.y, {
            kind: 'dot',
            colors: [swatch.blue.fill, 0xffffff],
            count: 14,
            speed: [140, 300],
            gravity: 600,
            angle: -Math.PI / 2,
            spread: 1.2,
          });
          void this.fish(p.x, p.y);
        }
      },
      { cooldown: 250 },
    );
    const hull = new Graphics().poly([-46, 0, 46, 0, 32, 22, -32, 22]).fill(swatch.red.fill);
    const sail = new Graphics().poly([-4, -6, -4, -70, 34, -10]).fill(0xffffff);
    const flag = new Graphics().poly([-4, -70, -4, -88, 14, -79]).fill(swatch.yellow.fill);
    const mast = new Graphics().rect(-7, -70, 6, 70).fill(0x8f5a37);
    this.boat.addChild(mast, sail, flag, hull);
    this.boat.hitArea = new Rectangle(-60, -95, 120, 125);
    onTap(this.boat, () => void this.toot(), { cooldown: 600 });
    this.content.addChild(this.boat);
    const line = { width: 3, color: swatch.white.line, join: 'round' as const };
    this.wings
      .poly([-4, 0, -30, -22, -10, -2])
      .fill(0xffffff)
      .stroke(line)
      .poly([4, 0, 30, -22, 10, -2])
      .fill(0xffffff)
      .stroke(line);
    const body = new Graphics()
      .ellipse(0, 0, 16, 9)
      .fill(0xffffff)
      .stroke(line)
      .circle(13, -5, 7)
      .fill(0xffffff)
      .stroke(line)
      .circle(15, -6, 1.6)
      .fill(ink);
    const beak = new Graphics().poly([19, -6, 29, -3, 19, -1]).fill(swatch.orange.fill);
    this.gull.addChild(this.wings, body, beak);
    this.gull.scale.set(1.3);
    this.gull.hitArea = new Rectangle(-50, -40, 100, 70);
    onTap(this.gull, () => void this.gullCall(), { cooldown: 900 });
    this.content.addChild(this.gull);
  }

  /** Where the gull is on its loop round the island, a little out over the sea. */
  private gullAt(t: number) {
    const v = this.view;
    const a = t * Math.PI * 2;
    return { x: v.w / 2 + Math.cos(a) * v.w * 0.5, y: v.h / 2 + 22 + Math.sin(a) * v.h * 0.47 };
  }

  private async gullCall() {
    if (this.gullLoop) return;
    this.gullLoop = true;
    sfx.gull();
    this.particles.burst(this.gull.x, this.gull.y, {
      kind: 'dot',
      colors: [0xffffff, swatch.white.light],
      count: 6,
      speed: [40, 120],
      gravity: 160,
    });
    await this.tw.to(this.gull, { rotation: this.gull.rotation - Math.PI * 2 }, { duration: 0.6 });
    this.gullLoop = false;
  }

  /** A whale breathes somewhere in the open sea: a spout of drops, now and then, on its own. */
  private spout() {
    const v = this.view;
    for (let i = 0; i < 8; i++) {
      const x = 40 + Math.random() * (v.w - 80);
      const y = 120 + Math.random() * (v.h - 200);
      const dx = (x - v.w / 2) / (v.w * 0.5),
        dy = (y - (v.h / 2 + 22)) / (v.h * 0.45);
      if (dx * dx + dy * dy < 1) continue;
      this.particles.burst(x, y, {
        kind: 'dot',
        colors: [swatch.blue.fill, 0xffffff],
        count: 10,
        speed: [160, 260],
        gravity: 500,
        angle: -Math.PI / 2,
        spread: 0.5,
      });
      return;
    }
  }

  /** A fish leaps out where the sea was tapped and dives back in. */
  private async fish(x: number, y: number) {
    const f = new Graphics()
      .ellipse(0, 0, 22, 12)
      .fill(swatch.orange.fill)
      .poly([18, 0, 34, -12, 34, 12])
      .fill(swatch.orange.fill);
    f.position.set(x, y);
    this.content.addChild(f);
    await this.tw.to(f, { y: y - 70, rotation: -0.6 }, { duration: 0.3 });
    await this.tw.to(f, { x: x - 40, y: y, rotation: 0.8 }, { duration: 0.35 });
    f.destroy();
  }

  private async toot() {
    sfx.bell(4);
    this.boat.scale.set(1.15, 0.9);
    await this.tw.to(this.boat.scale, { x: 1, y: 1 }, { duration: 0.35 });
    sfx.bell(7);
  }

  /** The home spot's drawing: an age place's landmark, its name and a note that it holds all her games. */
  private drawHome(band: Band) {
    for (const c of this.home.removeChildren()) c.destroy({ children: true });
    if (this.atRoot) {
      // At the root the home spot is Home's yard: the treehouse, where her friend lives.
      const art = treehouseIcon();
      art.scale.set(1.5);
      art.y = -8;
      const name = label('Home', 21, ink);
      name.y = 70;
      this.home.addChild(new Graphics().ellipse(0, 34, 84, 28).fill(cream), art, name);
      this.homeBand = band;
      return;
    }
    const place = placeFor(band);
    const art = place.landmark();
    art.scale.set(LANDMARK_SCALE);
    const name = label(place.name, 21, ink);
    name.y = 70;
    const note = label('all your games', 14, swatch.white.line, '500');
    note.y = 90;
    this.home.addChild(new Graphics().ellipse(0, 34, 84, 28).fill(cream), art, name, note);
    this.homeBand = band;
  }

  /** What a key can press, with the ring's centre and size: a drawing's ring is round its picture, not its name. */
  private focusSpots(): FocusSpot[] {
    const at = (id: MapSpotId, press: () => void): FocusSpot => {
      const n = this.spot(id);
      return { id, x: n.x, y: n.y + 20, r: MAP_RADIUS, press };
    };
    const button = (id: string, b: RoundButton): FocusSpot => ({
      id,
      x: b.x,
      y: b.y,
      r: b.radius,
      press: () => b.press(),
    });
    return [
      ...this.lands.map(({ def }) => at(def.id, () => void this.visit(def))),
      at('home', () => void this.visitHome()),
      at('picnic', () => void this.visitPicnic()),
      button('players', this.players),
      button('book', this.book),
      ...(this.atRoot ? [] : [button('treehouse', this.treehouse)]),
    ];
  }

  private spot(id: MapSpotId): Container {
    if (id === 'home') return this.home;
    if (id === 'picnic') return this.picnic;
    return this.lands.find((l) => l.def.id === id)!.node;
  }

  /** Where the pet stands beside a spot: at the left edge of its drawing, not over it. */
  private petSpot(id: MapSpotId) {
    const n = this.spot(id);
    return { x: n.x - 112 * n.scale.x, y: n.y + 52 * n.scale.y };
  }

  resize(v: View) {
    this.sea.clear().rect(0, 0, v.w, v.h).fill(swatch.blue.light);
    for (let i = 0; i < 12; i++)
      this.sea
        .ellipse((i * 193) % v.w, 140 + ((i * 127) % (v.h - 180)), 40, 6)
        .fill({ color: swatch.white.fill, alpha: 0.5 });
    this.island
      .clear()
      .ellipse(v.w / 2, v.h / 2 + 22, v.w * 0.48, v.h * 0.43)
      .fill(cream)
      .ellipse(v.w / 2, v.h / 2 + 10, v.w * 0.455, v.h * 0.405)
      .fill(grass);
    const at = mapLayout(v, this.atRoot);
    const k = mapSpotScale(v, this.atRoot);
    for (const { def, node } of this.lands) node.position.set(at[def.id].x, at[def.id].y);
    for (const node of [...this.lands.map((l) => l.node), this.home, this.picnic]) node.scale.set(k);
    this.home.position.set(at.home.x, at.home.y);
    this.picnic.position.set(at.picnic.x, at.picnic.y);
    if (!this.walking) this.pip.position.copyFrom(this.petSpot(this.petAt));
    this.title.position.set(v.w / 2, 50);
    this.book.position.set(v.w - 75, v.h - 70);
    this.treehouse.position.set(75, v.h - 70);
    this.players.position.set(75, 70);
  }

  enter() {
    music.play(STYLES.hub);
    if (this.birthday) void this.party();
    else void voice.say('map.pick');
  }

  /** The pet's birthday: confetti, then the home spot becomes her new age place. */
  private async party() {
    await this.tw.wait(0.7);
    void voice.say('map.birthday');
    sfx.tada();
    this.pip.cheer();
    this.particles.burst(this.view.w / 2, this.view.h * 0.55, {
      kind: 'confetti',
      colors: RAINBOW.map((c) => swatch[c].fill),
      count: 70,
      speed: [200, 500],
      gravity: 160,
    });
    await this.tw.wait(1.2);
    await this.tw.to(this.home.scale, { x: 0, y: 0 }, { duration: 0.25 });
    this.drawHome(store.data.profile.band);
    sfx.sparkle();
    this.particles.burst(this.home.x, this.home.y, {
      kind: 'star',
      colors: [swatch.yellow.fill, 0xffffff],
      count: 18,
      speed: [160, 320],
      gravity: 0,
      life: [0.5, 0.9],
    });
    await this.tw.to(this.home.scale, { x: 1, y: 1 }, { duration: 0.35 });
  }

  /** The pet hops over to a spot. */
  private async hopTo(id: MapSpotId) {
    if (id === this.petAt) return;
    const p = this.petSpot(id);
    this.walking = true;
    this.pip.hop(1.2);
    sfx.animal('hop');
    await this.tw.to(this.pip, { x: p.x, y: p.y }, { duration: 0.5 });
    this.walking = false;
    this.petAt = id;
  }

  /** Into a spot: the pet hops over, the map zooms in, and `go` opens the scene. */
  private async enterSpot(id: MapSpotId, line: Parameters<typeof voice.say>[0], go: () => void) {
    if (this.leaving || this.walking) return;
    this.leaving = true;
    this.ui.eventMode = 'none';
    this.gear.hide(true);
    void voice.say(line);
    await this.hopTo(id);
    const node = this.spot(id);
    sfx.whoosh();
    this.map.pivot.set(node.x, node.y);
    this.map.position.set(node.x, node.y);
    await this.tw.to(this.map.scale, { x: 1.5, y: 1.5 }, { duration: 0.4 });
    go();
  }

  private visit(def: Land) {
    return this.enterSpot(def.id, def.line, () => this.app.go.land(def.id));
  }

  private visitHome() {
    if (this.atRoot) return this.enterSpot('home', 'nav.home', () => this.app.go.hub());
    return this.enterSpot('home', 'island.home', () => this.app.go.place(store.data.profile.band));
  }

  /** The picnic is open to every age, like the lands. */
  private visitPicnic() {
    return this.enterSpot('picnic', 'map.picnic', () => this.app.go.picnic());
  }

  private leave(go: () => void) {
    if (this.leaving) return;
    this.leaving = true;
    go();
  }

  update(dt: number) {
    super.update(dt);
    this.keys.update(dt);
    this.clock += dt;
    if (this.atRoot) {
      // The boat bobs in the bottom-left corner's sea (the root has no treehouse button there), drifting a little.
      const v = this.view;
      this.boatT += dt * 0.15;
      this.boat.x = 80 + Math.sin(this.boatT * Math.PI * 2) * 22;
      this.boat.y = v.h - 40 + Math.sin(this.clock * 2) * 4;
      // The gull goes round once in about forty seconds, flapping, and faces the way it flies.
      this.gullT += dt / 40;
      const at = this.gullAt(this.gullT);
      const next = this.gullAt(this.gullT + 0.002);
      this.gull.position.set(at.x, at.y);
      this.gull.scale.x = next.x < at.x ? -1.3 : 1.3;
      this.wings.scale.y = Math.sin(this.clock * 9);
      this.spoutIn -= dt;
      if (this.spoutIn <= 0) {
        this.spoutIn = 7 + Math.random() * 6;
        this.spout();
      }
    }
    // A soft glow around her home spot.
    this.glow
      .clear()
      .circle(this.home.x, this.home.y + 10, (96 + 6 * Math.sin(this.clock * 2.5)) * this.home.scale.x)
      .fill({ color: swatch.yellow.light, alpha: 0.75 });
  }

  exit() {
    voice.stop();
  }

  destroy() {
    this.keys.destroy();
    this.gear.destroy();
    super.destroy();
  }
}
