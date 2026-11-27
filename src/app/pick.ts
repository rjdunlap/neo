import { Container, Graphics } from 'pixi.js';
import { swatch } from '../art/palette';
import { sfx } from '../audio/sfx';
import { voice } from '../audio/voice';
import {
  againPick,
  anotherPick,
  canAnother,
  openPick,
  pickAtEnd,
  pickShown,
  sameScope,
  scopeKey,
  scopePool,
  scopesFor,
  type PickScope,
  type PickSource,
  type PickState,
} from '../content/pick';
import { LANDS } from '../content/lands';
import { Rng } from '../engine/random';
import type { View } from '../engine/view';
import { GAMES } from '../games/registry';
import type { GameModule } from '../games/types';
import type { Band } from '../progress/bands';
import { store } from '../progress/store';
import { RoundButton } from '../ui/buttons';
import { PickSheet, type PickChip } from '../ui/pick-sheet';
import type { App } from './App';
import { launchDiscovery, pickMemory } from './discovery';
import { titleOf } from './mix';

/** The Pick spot's picture: a fan of three cards, no text needed. */
export function pickIcon(): Container {
  const g = new Graphics();
  for (const [rot, x, color] of [
    [-0.35, -14, swatch.blue],
    [0.35, 14, swatch.pink],
    [0, 0, swatch.yellow],
  ] as const) {
    const card = new Graphics()
      .roundRect(-14, -22, 28, 40, 6)
      .fill(color.fill)
      .stroke({ width: 3, color: color.line });
    card.rotation = rot;
    card.position.set(x, 0);
    g.addChild(card);
  }
  return g;
}

const NAMES: Record<PickScope['kind'], string> = {
  everything: 'Anything',
  hearts: 'Hearts',
  lately: 'Lately',
  land: '',
  challenge: '',
};

const keyToScope = (key: string): PickScope => {
  if (key.startsWith('land:')) return { kind: 'land', id: key.slice(5) as never };
  if (key.startsWith('challenge:')) return { kind: 'challenge', challenge: key.slice(10) as never };
  return { kind: key as 'everything' | 'hearts' | 'lately' };
};

/**
 * Pick for me (D7a) on a home spot: the Pick button, the chooser sheet and the pick card over the place. It reads the save and
 * writes nothing; the scope she chose and the game last opened from a pick live in `pickMemory`. Play opens the game exactly as
 * the Next game tile does (`launchDiscovery`), so its own card is the introduction and Back there returns here.
 */
export class PickHost {
  readonly button: RoundButton;
  sheet: PickSheet | null = null;
  private pick: PickState | null = null;
  private launching = false;
  private page = 0;

  constructor(
    private readonly app: App,
    private readonly band: Band,
    private readonly ui: Container,
    private readonly view: () => View,
    /** Her scene's own leave, so the home spot's music, scroll and cheer behave as they do for a game. */
    private readonly leave: (go: () => void) => void,
  ) {
    this.button = new RoundButton(pickIcon(), swatch.white, 50, () => this.open());
    this.button.visible = this.sources().length > 0;
  }

  private source(): PickSource {
    return { band: this.band, catalog: GAMES, favorites: store.data.favorites, stats: store.data.games };
  }
  private sources(): PickScope[] {
    return scopesFor(this.source());
  }

  /** The game on the card, for scripted checks. */
  shownId(): string | undefined {
    return this.mod()?.id;
  }

  get covering(): boolean {
    return !!this.sheet;
  }

  private chips(): PickChip[] {
    const src = this.source();
    return this.sources().map((scope) => {
      const first = scopePool(scope, src)[0];
      const mod = scope.kind === 'hearts' ? null : (GAMES.find((g) => g.id === first) ?? null);
      const name =
        scope.kind === 'land'
          ? LANDS.find((l) => l.id === scope.id)!.name
          : scope.kind === 'challenge'
            ? scope.challenge[0].toUpperCase() + scope.challenge.slice(1)
            : NAMES[scope.kind];
      return { key: scopeKey(scope), mod, name };
    });
  }

  private held(): PickScope {
    const scopes = this.sources();
    const chosen = pickMemory.scope(store.data);
    return chosen && scopes.some((s) => sameScope(s, chosen)) ? chosen : { kind: 'everything' };
  }

  open() {
    if (this.sheet || this.launching || !this.button.visible) return;
    sfx.whoosh();
    this.sheet = new PickSheet({
      choose: (key) => this.choose(key),
      onePick: () => this.onePick(),
      another: () => this.another(),
      again: () => this.again(),
      play: () => this.play(),
      page: (d) => this.turn(d),
      back: () => (this.pick ? this.chooser() : this.close()),
    });
    this.ui.addChild(this.sheet);
    this.pick = null;
    this.chooser();
    void voice.say('pick.offer');
  }

  close() {
    this.sheet?.destroy({ children: true });
    this.sheet = null;
    this.pick = null;
  }

  private chooser() {
    this.pick = null;
    this.sheet?.showChooser(this.chips(), scopeKey(this.held()), this.page, this.view());
  }

  private choose(key: string) {
    pickMemory.choose(store.data, keyToScope(key));
    this.chooser();
  }

  private turn(delta: number) {
    this.page = Math.max(0, this.page + delta);
    this.chooser();
  }

  private onePick() {
    const scope = this.held();
    this.pick = openPick(scope, scopePool(scope, this.source()), new Rng(), pickMemory.last(store.data));
    this.show(false);
  }

  private another() {
    if (this.pick && canAnother(this.pick)) {
      this.pick = anotherPick(this.pick);
      this.show(true);
    }
  }

  private again() {
    if (!this.pick) return;
    this.pick = againPick(this.pick, scopePool(this.pick.scope, this.source()), new Rng());
    this.show(false);
  }

  private mod(): GameModule | null {
    const id = this.pick && pickShown(this.pick);
    return GAMES.find((g) => g.id === id) ?? null;
  }

  private show(another: boolean, speak = true) {
    const pick = this.pick;
    if (!pick || !this.sheet) return this.chooser();
    const end = pickAtEnd(pick);
    const mod = this.mod();
    this.sheet.showCard(
      {
        mod,
        title: end ? 'That was all of them' : mod ? titleOf(mod) : '',
        end,
        another: canAnother(pick),
      },
      this.view(),
    );
    if (!speak) return;
    if (end) void voice.say('pick.all');
    else if (mod) void voice.say(another ? 'pick.another' : 'mix.stop', { title: titleOf(mod) });
  }

  private play() {
    const mod = this.mod();
    if (!mod || this.launching) return;
    this.launching = true;
    pickMemory.played(store.data, mod.id);
    voice.stop();
    this.leave(() => launchDiscovery(this.app.go, mod.id, this.band, { place: this.band }));
  }

  resize(v: View) {
    if (!this.sheet) return;
    if (this.pick) this.show(false, false);
    else this.sheet.showChooser(this.chips(), scopeKey(this.held()), this.page, v);
  }

  update(dt: number) {
    this.sheet?.update(dt);
  }
}
