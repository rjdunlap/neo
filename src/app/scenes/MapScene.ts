import { Container, Graphics } from 'pixi.js';
import { landmarkFor } from '../../art/lands';
import { cream, grass, ink, RAINBOW, swatch } from '../../art/palette';
import { makePet } from '../../art/pet';
import { checkBadge, picnicLandmark } from '../../art/picnic';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { LANDS, MAP_RADIUS, mapLayout, visibleIn, type Land, type MapSpotId } from '../../content/lands';
import { placeFor } from '../../content/places';
import { anyNew } from '../../content/shelf';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { GAMES } from '../../games/registry';
import { openParentPanel } from '../../parent/panel';
import { bandRank, type Band } from '../../progress/bands';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { gearButton } from '../../ui/grownups';
import { bookIcon, peopleIcon, treehouseIcon } from '../../ui/icons';
import { Sparkle } from '../../ui/sparkle';
import { label } from '../../ui/text';
import type { App } from '../App';
import { Scene } from '../Scene';
import { lastLand } from './LandScene';

/** Land drawings are a little smaller on the map than the age places were, so twelve spots fit. */
const LANDMARK_SCALE = 0.85;

/**
 * The island: ten themed lands, her home spot (her age place, with every game for her age and younger) and the
 * Windy Picnic. Every land is open; a land twinkles while it holds a game she has not played. The pet waits
 * where she was last, and when she has a birthday the home spot becomes her new age place.
 */
export class MapScene extends Scene {
  private readonly sea = new Graphics();
  private readonly island = new Graphics();
  private readonly glow = new Graphics();
  private readonly map = new Container();
  readonly pip = makePet();
  private readonly title = label('Puddle Island', 42, ink);
  private readonly book = new RoundButton(bookIcon(), swatch.white, 52, () => this.leave(() => this.app.go.stickers()));
  private readonly treehouse = new RoundButton(treehouseIcon(), swatch.white, 52, () => this.leave(() => { void voice.say('map.room'); this.app.go.room(); }));
  /** Back to "Who's playing?", for someone else's turn. It changes nothing and removes nothing, so it needs no hold. */
  readonly players = new RoundButton(peopleIcon(), swatch.white, 52, () => this.leave(() => this.app.go.start()));
  /** Grown-ups' way in: hold the gear (the iPad has no Esc key, so this is the way in once a child is playing). */
  private readonly gear = gearButton({
    onOpen: () => {
      if (this.leaving) return;
      voice.stop();
      openParentPanel(() => (store.data.pet.hatched ? this.app.go.hub() : this.app.go.hatch()), () => this.app.go.start());
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

  constructor(app: App) {
    super(app);
    const { world, profile } = store.data;
    this.birthday = world.band !== null && bandRank(profile.band) > bandRank(world.band);
    this.homeBand = this.birthday ? world.band! : profile.band;
    this.petAt = this.birthday ? 'home' : (lastLand() ?? 'home');
  }

  init() {
    const { world, profile } = store.data;
    this.map.addChild(this.island, this.glow);
    this.content.addChild(this.sea, this.map);
    for (const def of LANDS) {
      const node = new Container();
      const art = landmarkFor(def.id);
      art.scale.set(LANDMARK_SCALE);
      const name = label(def.name, 21, ink);
      name.y = 70;
      node.addChild(new Graphics().ellipse(0, 34, 84, 28).fill(cream), art, name);
      let sparkle: Sparkle | null = null;
      if (anyNew(store.data.games, visibleIn(def, profile.band, GAMES).map((g) => g.id))) {
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
    this.picnic.addChild(new Graphics().ellipse(0, 34, 84, 28).fill(cream), picnicArt, name, note, this.picnicDone);
    onTap(this.picnic, () => void this.visitPicnic(), { radius: MAP_RADIUS });
    this.map.addChild(this.picnic);

    if (world.band === null || bandRank(profile.band) > bandRank(world.band)) world.band = profile.band;
    store.save();
    // The pet only decorates the map: it stands beside a spot, so it must never take a tap meant for one.
    this.pip.scale.set(0.3);
    this.pip.eventMode = 'none';
    this.map.addChild(this.track(this.pip));
    this.ui.addChild(this.title, this.book, this.treehouse, this.players);
    document.body.appendChild(this.gear.el);
  }

  /** The home spot's drawing: an age place's landmark, its name and a note that it holds all her games. */
  private drawHome(band: Band) {
    for (const c of this.home.removeChildren()) c.destroy({ children: true });
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

  private spot(id: MapSpotId): Container {
    if (id === 'home') return this.home;
    if (id === 'picnic') return this.picnic;
    return this.lands.find((l) => l.def.id === id)!.node;
  }

  /** Where the pet stands beside a spot: at the left edge of its drawing, not over it. */
  private petSpot(id: MapSpotId) {
    const n = this.spot(id);
    return { x: n.x - 112, y: n.y + 52 };
  }

  resize(v: View) {
    this.sea.clear().rect(0, 0, v.w, v.h).fill(swatch.blue.light);
    for (let i = 0; i < 12; i++) this.sea.ellipse((i * 193) % v.w, 140 + ((i * 127) % (v.h - 180)), 40, 6).fill({ color: swatch.white.fill, alpha: 0.5 });
    this.island.clear().ellipse(v.w / 2, v.h / 2 + 22, v.w * 0.48, v.h * 0.43).fill(cream).ellipse(v.w / 2, v.h / 2 + 10, v.w * 0.455, v.h * 0.405).fill(grass);
    const at = mapLayout(v);
    for (const { def, node } of this.lands) node.position.set(at[def.id].x, at[def.id].y);
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
    this.particles.burst(this.view.w / 2, this.view.h * 0.55, { kind: 'confetti', colors: RAINBOW.map((c) => swatch[c].fill), count: 70, speed: [200, 500], gravity: 160 });
    await this.tw.wait(1.2);
    await this.tw.to(this.home.scale, { x: 0, y: 0 }, { duration: 0.25 });
    this.drawHome(store.data.profile.band);
    sfx.sparkle();
    this.particles.burst(this.home.x, this.home.y, { kind: 'star', colors: [swatch.yellow.fill, 0xffffff], count: 18, speed: [160, 320], gravity: 0, life: [0.5, 0.9] });
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
    this.clock += dt;
    // A soft glow around her home spot.
    this.glow.clear().circle(this.home.x, this.home.y + 10, 96 + 6 * Math.sin(this.clock * 2.5)).fill({ color: swatch.yellow.light, alpha: 0.75 });
  }

  exit() {
    voice.stop();
  }

  destroy() {
    this.gear.destroy();
    super.destroy();
  }
}
