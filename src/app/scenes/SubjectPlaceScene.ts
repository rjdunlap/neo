import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { swatch } from '../../art/palette';
import { makePet } from '../../art/pet';
import { Backdrop } from '../../art/scenery';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { placeFor } from '../../content/places';
import { SUBJECTS, type RegionId } from '../../content/world';
import { onTap, palmOnGlass } from '../../engine/input';
import type { View } from '../../engine/view';
import type { GameModule } from '../../games/types';
import type { Band } from '../../progress/bands';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon, bookIcon, islandIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import type { App } from '../App';
import { Scene } from '../Scene';
import { session } from '../session';
import { gamesFor } from './PlaceScene';

interface Card { node: Container; id: string; mod?: GameModule }
interface Position { subject: RegionId | null; subjectsPage: number; gamesPage: number }
const positions = new Map<Band, Position>();
const gridIcon = () => {
  const g = new Graphics();
  for (const x of [-23, 5]) for (const y of [-23, 5]) g.roundRect(x, y, 18, 18, 4).fill(swatch.teal.line);
  return g;
};

/** Optional subject browser. Four large choices per page, with separate session memory from the path. */
export class SubjectPlaceScene extends Scene {
  readonly place;
  readonly games: GameModule[];
  readonly subjects;
  readonly cards: Card[] = [];
  readonly state: Position;
  private backdrop!: Backdrop;
  private readonly choices = new Container();
  private readonly pip = makePet();
  private readonly heading = label('', 32);
  private readonly dots = new Graphics();
  readonly home = new RoundButton(islandIcon(), swatch.white, 50, () => this.leave(() => this.app.go.hub()));
  readonly book = new RoundButton(bookIcon(), swatch.white, 50, () => this.leave(() => this.app.go.stickers()));
  readonly back = new RoundButton(gridIcon(), swatch.white, 50, () => {
    this.state.subject = null;
    this.rebuild();
    void voice.say('place.subjects');
  });
  readonly previous = new RoundButton(arrowIcon(-1), swatch.white, 50, () => this.page(-1));
  readonly next = new RoundButton(arrowIcon(1), swatch.white, 50, () => this.page(1));
  private touch: { id: number; x: number; y: number; moved: boolean; card?: Card } | null = null;
  private leaving = false;
  private icons: ReturnType<GameModule['hubIcon']>[] = [];
  private readonly lost = () => this.cancel();
  private readonly release = (e: PointerEvent) => { if (this.touch?.id === e.pointerId) this.cancel(); };

  constructor(app: App, readonly band: Band) {
    super(app);
    this.place = placeFor(band);
    this.games = gamesFor(band);
    this.subjects = SUBJECTS.filter(s => this.games.some(g => g.region === s.id));
    this.state = { ...(positions.get(band) ?? { subject: null, subjectsPage: 0, gamesPage: 0 }) };
  }

  get pageIndex() { return this.state.subject ? this.state.gamesPage : this.state.subjectsPage; }
  get pageCount() { return Math.ceil((this.state.subject ? this.games.filter(g => g.region === this.state.subject).length : this.subjects.length) / 4); }

  init() {
    this.backdrop = this.track(new Backdrop(this.place.backdrop, this.view));
    this.content.addChild(this.backdrop, this.choices);
    this.choices.eventMode = 'static';
    this.choices.on('pointerdown', (e: FederatedPointerEvent) => {
      if (this.leaving || this.touch || palmOnGlass()) return;
      const p = this.choices.toLocal(e.global);
      const card = this.cards.find(c => c.node.visible && (c.node.hitArea as Rectangle).contains(p.x - c.node.x, p.y - c.node.y));
      this.touch = { id: e.pointerId, x: p.x, y: p.y, moved: false, card };
      if (card) { card.node.scale.set(0.96); sfx.tick(); }
    });
    this.choices.on('globalpointermove', (e: FederatedPointerEvent) => {
      const t = this.touch;
      if (!t || t.id !== e.pointerId) return;
      const p = this.choices.toLocal(e.global);
      if (Math.hypot(p.x - t.x, p.y - t.y) > 24) {
        t.moved = true;
        t.card?.node.scale.set(1);
      }
    });
    this.choices.on('pointerup', (e: FederatedPointerEvent) => {
      const t = this.touch;
      if (!t || t.id !== e.pointerId) return;
      const p = this.choices.toLocal(e.global);
      this.cancel();
      if (t.moved) {
        if (Math.abs(p.x - t.x) > 70 && Math.abs(p.x - t.x) > Math.abs(p.y - t.y)) this.page(p.x < t.x ? 1 : -1);
      } else if (t.card) this.pick(t.card);
    });
    this.choices.on('pointerupoutside', () => this.cancel());
    this.choices.on('pointercancel', () => this.cancel());
    window.addEventListener('blur', this.lost);
    window.addEventListener('pointercancel', this.release);
    window.addEventListener('pointerup', this.release);
    document.addEventListener('visibilitychange', this.lost);
    this.pip.scale.set(0.55);
    this.pip.hitArea = new Circle(0, -120, 110);
    onTap(this.pip, () => { this.pip.poke(); this.speak(); });
    this.ui.addChild(this.track(this.pip), this.home, this.book, this.back, this.heading, this.previous, this.next, this.dots);
    this.rebuild();
  }

  private cancel() { this.touch?.card?.node.scale.set(1); this.touch = null; }
  private remember() { positions.set(this.band, { ...this.state }); }
  private speak() {
    const subject = this.subjects.find(s => s.id === this.state.subject);
    void voice.say(subject?.line ?? 'place.subjects');
  }
  private rebuild() {
    this.cancel();
    for (const icon of this.icons) this.untrack(icon);
    this.icons = [];
    for (const c of this.choices.removeChildren()) c.destroy({ children: true });
    this.cards.length = 0;
    const subject = this.subjects.find(s => s.id === this.state.subject);
    this.heading.text = subject ? subject.name : this.place.name;
    const items = subject
      ? this.games.filter(g => g.region === subject.id).map(mod => ({ id: mod.id, name: mod.name, mod, example: mod }))
      : this.subjects.map(s => ({ id: s.id, name: s.name, mod: undefined, example: this.games.find(g => g.region === s.id)! }));
    items.forEach(item => {
      const node = new Container();
      const bg = new Graphics().roundRect(-150, -115, 300, 230, 30).fill({ color: swatch.white.fill, alpha: 0.94 }).stroke({ width: 5, color: swatch.teal.line });
      bg.eventMode = 'none';
      const icon = this.track(item.example.hubIcon());
      this.icons.push(icon);
      const b = icon.getLocalBounds();
      const scale = Math.min(1, 210 / b.width, 145 / b.height);
      icon.scale.set(scale);
      icon.position.set(-(b.x + b.width / 2) * scale, -20 - (b.y + b.height / 2) * scale);
      icon.eventMode = 'none';
      const name = label(item.name, 25);
      name.position.set(0, 87);
      node.addChild(bg, icon, name);
      node.eventMode = 'static';
      node.cursor = 'pointer';
      node.hitArea = new Rectangle(-150, -115, 300, 230);
      this.choices.addChild(node);
      this.cards.push({ node, id: item.id, mod: item.mod });
    });
    this.resize(this.view);
    this.remember();
  }

  private pick(card: Card) {
    if (card.mod) {
      this.leaving = true;
      this.remember();
      void voice.say(card.mod.titleLine);
      this.app.go.game(card.mod.id, this.band);
    } else {
      this.state.subject = card.id as RegionId;
      this.state.gamesPage = 0;
      this.rebuild();
      this.speak();
    }
  }
  private page(direction: number) {
    if (this.leaving) return;
    this.cancel();
    const index = Math.max(0, Math.min(this.pageCount - 1, this.pageIndex + direction));
    if (this.state.subject) this.state.gamesPage = index;
    else this.state.subjectsPage = index;
    this.resize(this.view);
    this.remember();
  }
  private leave(go: () => void) { if (!this.leaving) { this.leaving = true; this.remember(); go(); } }

  resize(v: View) {
    this.cancel();
    this.backdrop.resize(v);
    this.home.position.set(65, 65);
    this.book.position.set(v.w - 65, 65);
    this.back.position.set(185, 65);
    this.back.visible = this.state.subject !== null;
    this.heading.position.set(v.w / 2 + 35, 65);
    this.pip.position.set(92, v.h - 12);
    this.previous.position.set(65, v.h / 2);
    this.next.position.set(v.w - 65, v.h / 2);
    this.previous.visible = this.pageIndex > 0;
    this.next.visible = this.pageIndex < this.pageCount - 1;
    this.choices.hitArea = new Rectangle(130, 155, v.w - 260, v.h - 210);
    this.cards.forEach(({ node }, i) => {
      node.visible = Math.floor(i / 4) === this.pageIndex;
      node.position.set(v.w / 2 + (i % 2 ? 170 : -170), 290 + Math.floor((i % 4) / 2) * (v.h - 430));
    });
    this.dots.clear();
    for (let i = 0; i < this.pageCount; i++) this.dots.circle(v.w / 2 + (i - (this.pageCount - 1) / 2) * 28, v.h - 28, i === this.pageIndex ? 8 : 5).fill(swatch.teal.line);
    this.dots.eventMode = 'none';
  }
  enter() { music.play(STYLES.hub); this.speak(); }
  update(dt: number) { super.update(dt); if (session.over && !this.leaving) this.leave(() => this.app.go.goodnight()); }
  exit() { voice.stop(); this.cancel(); window.removeEventListener('blur', this.lost); window.removeEventListener('pointercancel', this.release); window.removeEventListener('pointerup', this.release); document.removeEventListener('visibilitychange', this.lost); }
}
