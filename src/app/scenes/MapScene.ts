import { Container, Graphics } from 'pixi.js';
import { cream, grass, ink, RAINBOW, swatch } from '../../art/palette';
import { makePet } from '../../art/pet';
import { checkBadge, picnicLandmark } from '../../art/picnic';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { PLACES, type Place } from '../../content/places';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { openParentPanel } from '../../parent/panel';
import { bandInfo, BANDS, type Band } from '../../progress/bands';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { bookIcon, treehouseIcon } from '../../ui/icons';
import { ParentGate } from '../../ui/ParentGate';
import { label } from '../../ui/text';
import type { App } from '../App';
import { Scene } from '../Scene';

const rank = (band: Band | null) => BANDS.findIndex((b) => b.id === band);

/**
 * The island as an age trail: Puddle Lagoon on the shore, past Starry Peak, up to Wonder Woods. Every place is open;
 * the pet waits at her own place, and walks up the trail (with a birthday) when she grows.
 */
export class MapScene extends Scene {
  private readonly sea = new Graphics();
  private readonly island = new Graphics();
  private readonly trail = new Graphics();
  private readonly glow = new Graphics();
  private readonly map = new Container();
  readonly pip = makePet();
  private readonly title = label('Puddle Island', 42, ink);
  private readonly book = new RoundButton(bookIcon(), swatch.white, 52, () => this.app.go.stickers());
  private readonly treehouse = new RoundButton(treehouseIcon(), swatch.white, 52, () => { void voice.say('map.room'); this.app.go.room(); });
  private readonly gate = new ParentGate(() => {
    voice.stop();
    openParentPanel(() => (store.data.pet.hatched ? this.app.go.hub() : this.app.go.hatch()));
  });
  readonly places: { def: Place; node: Container }[] = [];
  /** The Windy Picnic, on the open grass beside Daisy Meadow: a story, not an age place. */
  readonly picnic = new Container();
  private readonly picnicDone = checkBadge(20);
  private leaving = false;
  private walking = false;
  /** A grown-up moved her up a band since the last visit: the pet starts at the old place. */
  readonly birthday: boolean;
  /** The place the pet is standing at. */
  private petAt: Band;
  private clock = 0;

  constructor(app: App) {
    super(app);
    const { world, profile } = store.data;
    this.birthday = world.band !== null && rank(profile.band) > rank(world.band);
    this.petAt = this.birthday ? world.band! : profile.band;
  }

  init() {
    const { world, profile } = store.data;
    this.map.addChild(this.island, this.trail, this.glow);
    this.content.addChild(this.sea, this.map);
    for (const def of PLACES) {
      const node = new Container();
      const name = label(def.name, 21, ink);
      name.y = 78;
      // Small print for grown-ups; nothing here needs reading to play.
      const ages = label(bandInfo(def.band).ages, 14, swatch.white.line, '500');
      ages.y = 100;
      node.addChild(new Graphics().ellipse(0, 40, 92, 34).fill(cream), def.landmark(), name, ages);
      onTap(node, () => void this.visit(def), { radius: 100 });
      this.places.push({ def, node });
      this.map.addChild(node);
    }
    const name = label('Windy Picnic', 21, ink);
    name.y = 78;
    const note = label('a story · 4–8 years', 14, swatch.white.line, '500');
    note.y = 100;
    this.picnicDone.position.set(70, -40);
    this.picnicDone.visible = store.picnic.keepsake;
    this.picnic.addChild(new Graphics().ellipse(0, 40, 92, 34).fill(cream), picnicLandmark(), name, note, this.picnicDone);
    onTap(this.picnic, () => void this.visitPicnic(), { radius: 100 });
    this.map.addChild(this.picnic);
    if (rank(profile.band) > rank(world.band)) world.band = profile.band;
    store.save();
    this.pip.scale.set(0.4);
    onTap(this.pip, () => { this.pip.hop(); void voice.say('map.pick'); }, { radius: 70 });
    this.map.addChild(this.track(this.pip));
    this.ui.addChild(this.title, this.book, this.treehouse, this.track(this.gate));
  }

  private spot(band: Band) {
    return this.places.find((p) => p.def.band === band)!.node;
  }

  /** Where the pet stands beside a place. */
  private petSpot(band: Band) {
    const n = this.spot(band);
    // Toward the middle of the island, where the switchback leaves room.
    const side = n.x < this.view.w / 2 ? 1 : -1;
    return { x: n.x + side * 150, y: n.y + 46 };
  }

  resize(v: View) {
    this.sea.clear().rect(0, 0, v.w, v.h).fill(swatch.blue.light);
    for (let i = 0; i < 12; i++) this.sea.ellipse((i * 193) % v.w, 140 + ((i * 127) % (v.h - 180)), 40, 6).fill({ color: swatch.white.fill, alpha: 0.5 });
    this.island.clear().ellipse(v.w / 2, v.h / 2 + 22, v.w * 0.48, v.h * 0.4).fill(cream).ellipse(v.w / 2, v.h / 2 + 10, v.w * 0.455, v.h * 0.375).fill(grass);
    this.places.forEach(({ def, node }) => node.position.set(130 + def.x * (v.w - 290), 150 + def.y * (v.h - 360)));
    this.picnic.position.set(130 + 0.97 * (v.w - 290), 150 + 0.98 * (v.h - 360));

    // The trail climbs from the lagoon to the peak through every place.
    const pts = this.places.map((p) => ({ x: p.node.x, y: p.node.y + 30 }));
    const t = this.trail.clear().moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      t.quadraticCurveTo(b.x, a.y, b.x, b.y);
    }
    t.stroke({ width: 26, color: cream, cap: 'round', join: 'round' });
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      for (let k = 1; k < 6; k++) {
        const u = k / 6;
        const x = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * b.x + u * u * b.x;
        const y = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * a.y + u * u * b.y;
        t.circle(x, y, 4).fill(swatch.yellow.fill);
      }
    }
    if (!this.walking) this.pip.position.copyFrom(this.petSpot(this.petAt));
    this.title.position.set(v.w / 2, 50);
    this.book.position.set(v.w - 75, v.h - 70);
    this.treehouse.position.set(75, v.h - 70);
    this.gate.layout(v);
  }

  enter() {
    music.play(STYLES.hub);
    if (this.birthday) void this.party();
    else void voice.say('map.pick');
  }

  /** The pet's birthday: confetti, then a walk up the trail to her new place. */
  private async party() {
    await this.tw.wait(0.7);
    void voice.say('map.birthday');
    sfx.tada();
    this.pip.cheer();
    this.particles.burst(this.view.w / 2, this.view.h * 0.55, { kind: 'confetti', colors: RAINBOW.map((c) => swatch[c].fill), count: 70, speed: [200, 500], gravity: 160 });
    await this.tw.wait(1.2);
    await this.walk(this.petAt, store.data.profile.band);
  }

  /** Hops along the trail from one place to another, stopping at each place on the way. */
  private async walk(from: Band, to: Band) {
    const step = rank(to) > rank(from) ? 1 : -1;
    this.walking = true;
    for (let r = rank(from); r !== rank(to); r += step) {
      const p = this.petSpot(BANDS[r + step].id);
      this.pip.hop(1.2);
      sfx.animal('hop');
      await this.tw.to(this.pip, { x: p.x, y: p.y }, { duration: 0.55, ease: ease.inOutSine });
    }
    this.walking = false;
    this.petAt = to;
  }

  private async visit(def: Place) {
    if (this.leaving) return;
    this.leaving = true;
    this.ui.eventMode = 'none';
    void voice.say(def.line);
    await this.walk(this.petAt, def.band);
    const node = this.spot(def.band);
    sfx.whoosh();
    this.map.pivot.set(node.x, node.y);
    this.map.position.set(node.x, node.y);
    await this.tw.to(this.map.scale, { x: 1.5, y: 1.5 }, { duration: 0.4 });
    this.app.go.place(def.band);
  }

  /** The pet hops over, and in we go. The picnic is open to every age, like the places. */
  private async visitPicnic() {
    if (this.leaving || this.walking) return;
    this.leaving = true;
    this.ui.eventMode = 'none';
    void voice.say('map.picnic');
    this.pip.hop(1.2);
    sfx.whoosh();
    const n = this.picnic;
    this.map.pivot.set(n.x, n.y);
    this.map.position.set(n.x, n.y);
    await this.tw.to(this.map.scale, { x: 1.5, y: 1.5 }, { duration: 0.4 });
    this.app.go.picnic();
  }

  update(dt: number) {
    super.update(dt);
    this.clock += dt;
    // A soft glow around her own place.
    const home = this.spot(store.data.profile.band);
    this.glow.clear().circle(home.x, home.y + 10, 104 + 6 * Math.sin(this.clock * 2.5)).fill({ color: swatch.yellow.light, alpha: 0.75 });
  }

  exit() {
    voice.stop();
  }
}
