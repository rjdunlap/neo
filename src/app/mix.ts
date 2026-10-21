import { Graphics, type Container } from 'pixi.js';
import { sfx } from '../audio/sfx';
import { voice } from '../audio/voice';
import { SCRIPT } from '../content/voice-script';
import { endingLine, lineup, MIX_IDS, mixGames, mixPool, mixStop, nextUp, repairLineup } from '../content/mix';
import type { Tweener } from '../engine/tween';
import type { View } from '../engine/view';
import { GAMES } from '../games/registry';
import type { GameModule } from '../games/types';
import type { Band } from '../progress/bands';
import { store } from '../progress/store';
import { MixSheet } from '../ui/mix';
import { MixTable } from '../ui/mix-table';
import type { App } from './App';
import { mixMemory } from './discovery';

export const titleOf = (mod: GameModule) => SCRIPT[mod.titleLine][0].replace(/!$/, '');
const modsOf = (ids: readonly string[]) => ids.map(id => GAMES.find(m => m.id === id)).filter((m): m is GameModule => !!m);

/** How long a grown-up holds the mix spot to open the mix table (D5a): a small hand's tap or rest does nothing. */
export const MIX_HOLD = 0.6;

/**
 * Little surprises on a home spot (either layout): the entry's eligibility, the preview/ending sheet over the place, and
 * (held on the spot) the mix table where a grown-up chooses its games. The sheet reopens whenever she comes back to this
 * home spot while the mix is live.
 */
export class MixHost {
  /** The default stops (the spot's pictures), or null: no entry is drawn on this home spot. */
  readonly mods: GameModule[] | null;
  sheet: MixSheet | null = null;
  table: MixTable | null = null;
  private launching = false;
  private hold: { node: Container; ring: Graphics; t: number; r: number } | null = null;
  private held = false;

  constructor(
    private readonly app: App, private readonly band: Band, private readonly ui: Container, private readonly view: () => View,
    private readonly tw: Tweener,
    /** The home spot's games, in its order: what the table may add. */
    private readonly placeIds: readonly string[],
  ) {
    this.mods = mixGames(store.data.profile.band, band, GAMES);
  }

  /** The mix is live for her at this home spot. */
  get live(): boolean {
    return !!this.mods && !!mixMemory.at(store.data, this.band);
  }

  /** The sheet or the table is over the home spot: nothing under it takes a touch. */
  get covering(): boolean {
    return !!this.sheet || !!this.table;
  }

  /** The live session's stops, from its frozen lineup. */
  private sessionMods(): GameModule[] {
    const s = mixMemory.live(store.data);
    return s ? modsOf(s.ids) : [];
  }

  private pool(): string[] {
    return mixPool(store.data.profile.band, this.placeIds, GAMES);
  }

  /** The held lineup, repaired against today's pool, or Little surprises. A dropped game is never spoken: she never chose it. */
  private lineupIds(): readonly string[] {
    const held = mixMemory.lineup(store.data, this.band);
    if (!held) return MIX_IDS;
    const ids = repairLineup(held, this.pool());
    if (ids.length !== held.length || ids.some((id, i) => id !== held[i])) mixMemory.hold(store.data, this.band, ids);
    return ids;
  }

  /** The mix spot was tapped: a new session with the held lineup, every stop still to come. */
  start() {
    if (!this.mods || this.launching) return;
    mixMemory.start(store.data, this.band, this.lineupIds());
    // With how-to cards on, the first stop's own card is the preview (D3): it offers the mix and carries the stops and Skip.
    if (store.data.settings.howToCards) return this.launch(0);
    this.open();
    void voice.say('mix.offer').then(() => this.sayNext('mix.stop'));
  }

  /** Back from a stop (its corner Home, the card's Back, the result's Home): the sheet again, at the next stop or the ending (only the ending with cards on). */
  resume() {
    if (!this.live) return;
    const state = mixMemory.at(store.data, this.band)!;
    // With cards on, a stop still to come is shown on its own card, so the home spot only ever opens the ending.
    if (store.data.settings.howToCards && nextUp(state) !== null) return;
    this.open();
    if (nextUp(state) === null) void voice.say(endingLine(state));
    else this.sayNext('mix.next');
  }

  private open() {
    const state = mixMemory.at(store.data, this.band);
    if (!this.mods || !state) return;
    if (!this.sheet) {
      this.sheet = new MixSheet({
        tile: (p) => this.hear(p),
        play: () => this.play(),
        skip: () => this.skip(),
        back: () => this.end(),
        againMix: () => this.againMix(),
        home: () => this.end(),
      });
      this.ui.addChild(this.sheet);
    }
    this.sheet.show(state, this.sessionMods(), this.view());
  }

  private refresh() {
    const state = mixMemory.at(store.data, this.band);
    if (state && this.sheet) this.sheet.show(state, this.sessionMods(), this.view());
    return state;
  }

  private sayNext(line: 'mix.stop' | 'mix.next') {
    const state = mixMemory.at(store.data, this.band);
    const p = state ? nextUp(state) : null;
    const mod = p === null ? undefined : this.sessionMods()[p];
    if (!mod || !this.sheet) return;
    void voice.say(line, { title: titleOf(mod) });
  }

  private hear(p: number) {
    const mod = this.live ? this.sessionMods()[p] : undefined;
    if (!mod) return;
    voice.stop();
    void voice.say('mix.stop', { title: titleOf(mod) });
  }

  /** Play the next stop, checked again now: never a different game behind its picture. */
  private play() {
    const state = this.live ? mixMemory.at(store.data, this.band) : undefined;
    const p = state ? nextUp(state) : null;
    if (!state || p === null || this.launching) return;
    this.launch(p);
  }

  /** Each stop is checked on its own: one that cannot come today is hopped over, and the others still play. */
  private launch(p: number) {
    const mod = mixStop(store.data.profile.band, this.band, GAMES, mixMemory.live(store.data)?.ids[p]);
    if (!mod) {
      mixMemory.apply(store.data, { type: 'unavailable', p });
      const state = this.refresh();
      voice.stop();
      void voice.say('mix.changed').then(() => { if (state && nextUp(state) === null) void voice.say(endingLine(state)); });
      return;
    }
    if (!mixMemory.launch(store.data, p)) return;
    this.launching = true;
    voice.stop();
    // With cards on, the stop's card speaks its own opening.
    if (!store.data.settings.howToCards) void voice.say(mod.titleLine);
    this.app.go.game(mod.id, store.data.profile.band, undefined, false, { place: this.band });
  }

  private skip() {
    const state = this.live ? mixMemory.at(store.data, this.band) : undefined;
    const p = state ? nextUp(state) : null;
    if (!state || p === null || this.launching) return;
    const after = mixMemory.apply(store.data, { type: 'skip', p })!;
    this.refresh();
    voice.stop();
    void voice.say('mix.skip').then(() => {
      if (!this.sheet || !this.live) return;
      if (nextUp(after) === null) void voice.say(endingLine(after));
      else this.sayNext('mix.next');
    });
  }

  /** The ending's Again mix: the same lineup from its first stop. */
  private againMix() {
    if (this.launching || !this.mods) return;
    const ids = mixMemory.live(store.data)?.ids ?? this.lineupIds();
    mixMemory.start(store.data, this.band, ids);
    this.launch(0);
  }

  /** Back on the preview (Explore) or Home on the ending: the mix ends and she stays on the home spot. */
  private end() {
    if (this.launching) return;
    mixMemory.end();
    voice.stop();
    this.close();
  }

  close() {
    this.sheet?.destroy({ children: true });
    this.sheet = null;
  }

  // Make my mix (D5a) -----------------------------------------------------------------------

  /** A finger went down on the mix spot: a ring fills at (x, y) on `node` while it stays down. */
  holdStart(node: Container, x: number, y: number, r: number) {
    this.holdCancel();
    if (!this.mods || this.live || this.launching) return;
    const ring = new Graphics();
    ring.position.set(x, y);
    ring.eventMode = 'none';
    node.addChild(ring);
    this.hold = { node, ring, t: 0, r };
  }

  /** The finger moved away (a swipe), was cancelled or lifted: no table. */
  holdCancel() {
    this.hold?.ring.destroy();
    this.hold = null;
    this.held = false;
  }

  /** The lift after a hold that opened the table: the scene must not also start the mix. */
  consumeHold(): boolean {
    const held = this.held;
    this.holdCancel();
    return held;
  }

  /** Opens the table on the held lineup (repaired), with no session; nothing is saved. */
  openTable() {
    if (!this.mods || this.table || this.live) return;
    mixMemory.hold(store.data, this.band, this.lineupIds());
    this.table = new MixTable(this.tw, {
      hear: (p) => this.tableHear(p),
      add: (id) => this.edit(lineup.add(this.tableIds(), id), 'mix.in', id),
      move: (from, to) => this.edit(lineup.move(this.tableIds(), from, to)),
      remove: (p) => {
        const ids = this.tableIds();
        if (ids.length <= 1) { voice.stop(); void voice.say('mix.one'); return false; }
        this.edit(lineup.remove(ids, p), 'mix.out', ids[p]);
        return true;
      },
      reset: () => this.edit(lineup.reset(), 'mix.reset'),
      play: () => { this.closeTable(); this.start(); },
      back: () => this.closeTable(),
    });
    this.ui.addChild(this.table);
    this.showTable();
    sfx.whoosh();
  }

  private tableIds(): readonly string[] {
    return mixMemory.lineup(store.data, this.band) ?? MIX_IDS;
  }

  private showTable() {
    this.table?.show(modsOf(this.tableIds()), modsOf(this.pool()), this.view());
  }

  private tableHear(p: number) {
    const mod = modsOf(this.tableIds())[p];
    if (!mod) return;
    voice.stop();
    void voice.say('mix.stop', { title: titleOf(mod) });
  }

  /** Any edit changes the held lineup at once; there is no separate save or cancel. A full lineup takes nothing more. */
  private edit(ids: readonly string[], line?: 'mix.in' | 'mix.out' | 'mix.reset', id?: string) {
    if (!this.table) return;
    const was = this.tableIds();
    if (line === 'mix.in' && ids.length === was.length) {
      this.table.wiggle();
      voice.stop();
      void voice.say('mix.full');
      return;
    }
    mixMemory.hold(store.data, this.band, ids);
    this.showTable();
    if (!line) return;
    const mod = id ? GAMES.find(m => m.id === id) : undefined;
    voice.stop();
    void voice.say(line, mod ? { title: titleOf(mod) } : undefined);
  }

  closeTable() {
    this.table?.destroy({ children: true });
    this.table = null;
    voice.stop();
  }

  update(dt: number) {
    this.sheet?.update(dt);
    this.table?.update(dt);
    const h = this.hold;
    if (!h || this.held) return;
    h.t += dt;
    const start = -Math.PI / 2;
    h.ring.clear().arc(0, 0, h.r, start, start + Math.min(1, h.t / MIX_HOLD) * Math.PI * 2).stroke({ width: 8, color: 0xffffff, cap: 'round' });
    if (h.t < MIX_HOLD) return;
    h.ring.destroy();
    this.hold = null;
    this.held = true;
    this.tw.kill(h.node.scale);
    h.node.scale.set(1);
    this.openTable();
  }

  resize(view: View) {
    this.sheet?.layout(view);
    this.table?.layout(view);
  }
}
