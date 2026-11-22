import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch, wood } from '../../art/palette';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import type { Goal } from '../../content/goals';
import type { LineId } from '../../content/voice-script';
import { welcomeFriend } from '../../content/welcome';
import { BOOK_ARROW_RADIUS, BOOK_HEADING, bookLayout, bookPages } from '../../creatures/book-layout';
import { makePortrait } from '../../creatures/companion';
import { CARD } from '../../creatures/friends-layout';
import { CORNER_RADIUS } from '../../creatures/home-layout';
import { SPECIES } from '../../creatures/species';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import type { Individual } from '../../progress/save';
import { store } from '../../progress/store';
import { HoldButton, RoundButton, spring, squash } from '../../ui/buttons';
import { arrowIcon, basketIcon, houseIcon } from '../../ui/icons';
import { label, namePill } from '../../ui/text';
import type { App } from '../App';
import { WayOut } from '../leave';
import { Scene } from '../Scene';

function bedArt() {
  return new Graphics()
    .roundRect(-46, -23, 92, 36, 17)
    .fill(swatch.yellow.light)
    .stroke({ color: swatch.yellow.line, width: 4 })
    .roundRect(-55, -6, 110, 40, 15)
    .fill(wood.fill)
    .stroke({ color: wood.line, width: 5 })
    .moveTo(-36, 7)
    .lineTo(36, 7)
    .moveTo(-39, 20)
    .lineTo(39, 20)
    .stroke({ color: wood.line, width: 3 });
}

/** Read-only collection pages, apart from the optional starred goal. */
export class BookScene extends Scene {
  upright = true;
  uprightArea = true;
  readonly pages;
  page = 0;
  readonly back = new RoundButton(arrowIcon(-1), swatch.white, CORNER_RADIUS, () =>
    this.leave(this.back, () => this.app.go.library(), 'nav.back'),
  ).means('back');
  readonly home = new RoundButton(houseIcon(), swatch.white, CORNER_RADIUS, () =>
    this.leave(this.home, () => this.app.go.hub(), 'nav.home'),
  ).means('home');
  readonly previous = this.arrow(-1);
  readonly next = this.arrow(1);
  private readonly paper = new Graphics();
  readonly heading = new Container();
  private readonly dots = new Graphics();
  private readonly selection = new Graphics();
  private readonly spread = new Container();
  readonly cards: Container[] = [];
  private goalArt?: Container;
  star?: RoundButton;
  path?: RoundButton;
  private previewed?: string;
  private speechRequest = 0;
  private readonly out = new WayOut(
    (seconds) => this.tw.wait(seconds),
    () => this.app.scene === this,
    this.root,
  );

  constructor(app: App, at?: { friend: string } | { joined: true }) {
    super(app);
    this.pages = bookPages(store.data, !!at && 'joined' in at);
    if (at && 'friend' in at) {
      const page = this.pages.findIndex(
        (p) => p.kind === 'friends' && p.friends.some((f) => f.id === at.friend),
      );
      if (page >= 0) this.page = page;
    }
  }

  private arrow(dir: -1 | 1) {
    return new HoldButton(arrowIcon(dir), swatch.white, BOOK_ARROW_RADIUS, 0.35, () => this.turn(dir));
  }

  init() {
    this.content.addChild(this.paper);
    this.selection.eventMode = 'none';
    this.ui.addChild(
      this.spread,
      this.selection,
      this.heading,
      this.dots,
      this.back,
      this.home,
      this.track(this.previous),
      this.track(this.next),
    );
    const { w, h } = BOOK_HEADING;
    this.heading.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
    onTap(
      this.heading,
      () => {
        if (this.out.leaving) return;
        squash(this.heading);
        spring(this.heading);
        this.sayPage();
      },
      { cooldown: 300 },
    );
    this.buildPage();
  }

  enter() {
    void music.play(STYLES.hub);
    this.sayPage();
  }

  private turn(dir: -1 | 1) {
    if (this.out.leaving) return;
    this.page = (this.page + dir + this.pages.length) % this.pages.length;
    this.previewed = undefined;
    sfx.pop();
    this.buildPage();
    this.sayPage();
  }

  private sayPage() {
    this.speechRequest++;
    const page = this.pages[this.page];
    void voice.say(
      page.kind === 'friends' && page.species
        ? `species.${page.species}`
        : page.kind === 'things'
          ? 'book.things'
          : 'book.pick',
    );
  }

  private buildPage() {
    this.spread.removeChildren().forEach((node) => node.destroy({ children: true }));
    this.heading.removeChildren().forEach((node) => node.destroy({ children: true }));
    this.cards.length = 0;
    this.selection.clear();
    this.star = this.path = undefined;
    this.goalArt = undefined;
    const page = this.pages[this.page];
    const title = label(
      page.kind === 'goals'
        ? 'Goals'
        : page.kind === 'things'
          ? 'Things'
          : page.species
            ? SPECIES[page.species].name
            : 'Friends',
      34,
    );
    this.heading.addChild(title);
    if (page.kind === 'goals') this.buildGoal(page.goals[0]);
    if (page.kind === 'friends') {
      if (page.species) {
        const portrait = makePortrait(
          { species: page.species, look: { color: SPECIES[page.species].color } },
          78,
        );
        portrait.x = -title.width / 2 - 54;
        this.heading.addChild(portrait);
      }
      for (const who of page.friends) this.cards.push(this.friendCard(who));
    }
    if (page.kind === 'things' && page.bed)
      this.cards.push(
        this.card(bedArt(), 'Basket bed', (node) => this.leave(node, () => this.app.go.room(), 'book.bed')),
      );
    for (const card of this.cards) this.spread.addChild(card);
    this.dots.clear();
    this.pages.forEach((_, i) =>
      this.dots
        .circle((i - (this.pages.length - 1) / 2) * 24, 0, i === this.page ? 8 : 5)
        .fill(i === this.page ? swatch.teal.line : swatch.teal.fill),
    );
    this.resize(this.view);
  }

  private card(art: Container, name: string, tap: (node: Container) => void) {
    const node = new Container();
    const half = CARD / 2;
    const pill = namePill(name, CARD - 12);
    pill.y = half - 10;
    node.addChild(
      new Graphics()
        .roundRect(-half, -half, CARD, CARD, 24)
        .fill(cream)
        .stroke({ color: swatch.teal.line, width: 4 }),
      art,
      pill,
    );
    node.hitArea = new Rectangle(-half, -half, CARD, CARD);
    onTap(
      node,
      () => {
        if (this.out.leaving) return;
        sfx.tick();
        squash(node);
        spring(node);
        tap(node);
      },
      { cooldown: 300 },
    );
    return node;
  }

  private friendCard(who: Individual) {
    const portrait = makePortrait(who, CARD - 10);
    return this.card(portrait, who.name, (node) => {
      if (this.previewed === who.id) {
        this.leave(node, () => this.app.go.friends(who.id, { book: true }));
        return;
      }
      this.previewed = who.id;
      this.selection
        .clear()
        .roundRect(-79, -79, 158, 158, 26)
        .stroke({ color: swatch.orange.line, width: 6 });
      this.selection.position.copyFrom(node.position);
      void voice.say('friends.name', { pet: who.name });
    });
  }

  private buildGoal(goal: Goal) {
    const adopted = welcomeFriend(store.data.creatures.owned);
    if (adopted) {
      this.cards.push(this.friendCard(adopted));
      return;
    }
    const species = goal.species(store.data);
    const portrait = makePortrait({ species, look: { color: SPECIES[species].color } }, CARD, true);
    this.goalArt = this.card(portrait, SPECIES[species].name, () => void this.sayGoal(species));
    const star = new Graphics();
    const drawStar = () => {
      star
        .clear()
        .star(0, 0, 5, 29, 14)
        .fill(store.data.book.goal === goal.id ? swatch.yellow.fill : cream)
        .stroke({ color: swatch.yellow.line, width: 4 });
    };
    drawStar();
    this.star = new RoundButton(star, swatch.white, CORNER_RADIUS, () => {
      if (this.out.leaving) return;
      this.speechRequest++;
      const chosen = store.data.book.goal !== goal.id;
      store.chooseGoal(chosen ? goal.id : null);
      drawStar();
      void voice.say(chosen ? 'book.chosen' : 'book.cleared');
    });
    this.path = new RoundButton(basketIcon(), swatch.orange, CORNER_RADIUS, () =>
      this.leave(this.path!, () => this.app.go.project(undefined, { book: goal.path.project }), 'book.meet'),
    );
    this.spread.addChild(this.goalArt, this.star, this.path);
  }

  private async sayGoal(species: ReturnType<Goal['species']>) {
    const request = ++this.speechRequest;
    await voice.say(`species.${species}`);
    if (this.app.scene === this && request === this.speechRequest && !this.out.leaving)
      void voice.say('book.meet');
  }

  private leave(node: Container, go: () => void, line?: LineId) {
    const choices = [this.back, this.home, this.previous, this.next, ...this.spread.children];
    void this.out.take(node, choices, go, line ? () => voice.say(line) : undefined);
  }

  resize(v: View) {
    const l = bookLayout(v, this.cards.length);
    this.paper.clear().rect(0, 0, v.w, v.h).fill(cream);
    this.back.position.set(l.back.x, l.back.y);
    this.home.position.set(l.home.x, l.home.y);
    this.heading.position.set(l.heading.x, l.heading.y);
    this.previous.position.set(l.previous.x, l.previous.y);
    this.next.position.set(l.next.x, l.next.y);
    this.dots.position.set(l.dots.x, l.dots.y);
    this.goalArt?.position.set(l.goalArt.x, l.goalArt.y);
    this.star?.position.set(l.star.x, l.star.y);
    this.path?.position.set(l.path.x, l.path.y);
    const page = this.pages[this.page];
    const friends = page.kind === 'friends' ? page.friends : [];
    this.cards.forEach((card, i) => {
      card.position.set(l.cards[i].x, l.cards[i].y);
      if (this.previewed && (friends[i]?.id === this.previewed || page.kind === 'goals'))
        this.selection.position.copyFrom(card.position);
    });
  }
}
