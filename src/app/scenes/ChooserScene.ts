import { Graphics } from 'pixi.js';
import { Critter } from '../../art/critter';
import { drawEgg, petSpecFor } from '../../art/pet';
import { Backdrop } from '../../art/scenery';
import { audio } from '../../audio/engine';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { nextSpot } from '../../couch/focus';
import { couchStore } from '../../couch/store';
import { CouchInput } from '../../engine/controller';
import type { View } from '../../engine/view';
import { openParentPanel } from '../../parent/panel';
import { blankToFill, cardName, isBlankProfile, MAX_PROFILES, type ProfileEntry } from '../../progress/profiles';
import { defaults, type SaveData } from '../../progress/save';
import { store } from '../../progress/store';
import { gearButton } from '../../ui/grownups';
import { couchNameFor, modeFor, POINTER_WINDOW_MS, readNewPlayer, skipsEgg, sourceOfClick, type Mode, type NewPlayer } from '../chooser';
import { selectPlayer } from '../players';
import { applySettings } from '../settings';
import { Scene } from '../Scene';
import '../../chooser.css';

interface Item {
  entry: ProfileEntry;
  save: SaveData;
}

/** A small game controller, for the card's own way into couch play. */
const PAD = `<svg viewBox="0 0 46 30" aria-hidden="true"><path fill="#6b6b7b" d="M10 3h26c5 0 8.5 4 9.4 11l1 8c.4 4-2 6-5.2 6-2.2 0-3.5-1.2-4.8-3.2L33.4 20H12.6l-1.4 4.8C9.9 26.8 8.6 28 6.4 28c-3.2 0-5.6-2-5.2-6l1-8C3.1 7 6 3 10 3z"/><path stroke="#fff" stroke-width="2.6" stroke-linecap="round" d="M13 9v8M9 13h8"/><circle cx="32" cy="10.5" r="2.2" fill="#fff"/><circle cx="37" cy="14.5" r="2.2" fill="#fff"/></svg>`;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};

/**
 * "Who's playing?": a card for each person, and Add a player. A tap opens the island as that person; Enter or a controller
 * button opens couch play with them as Player 1, and so does the small controller button on each card, so a mouse user can
 * choose it too. Plain HTML over the island's backdrop. Nothing here can remove anyone: that is behind the gear's hold.
 */
export class ChooserScene extends Scene {
  /** Plain HTML that suits a phone held upright, and a page of its own inputs. */
  upright = true;
  canPause = false;
  private backdrop!: Backdrop;
  private readonly page = el('section', 'chooser');
  private readonly cards = el('div', 'chooser__cards');
  private readonly note = el('p', 'chooser__note');
  private items: Item[] = [];
  private buttons: HTMLButtonElement[] = [];
  private focus = 0;
  /** The ring is for keys and a controller; a finger never sees it. */
  private ring = false;
  private input: CouchInput | null = null;
  private age = 0;
  private busy = false;
  private closed = false;
  /** When a real pointer last went down: the click that follows is that tap, whatever its `detail` says. */
  private pointerAt = -Infinity;
  private form: HTMLElement | null = null;
  private formKey: ((e: KeyboardEvent) => void) | null = null;
  private readonly gear = gearButton({
    onOpen: () => this.openGrownUps(),
    onShort: () => {
      // A press is a user gesture, so this is when speech can first be unlocked.
      audio.unlock();
      voice.unlock();
      void voice.say('parent.ask');
    },
  });

  init() {
    this.backdrop = this.track(
      new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0xaee39a, 0x9edb86], horizon: 0.62, clouds: 3, sun: true, seed: 12 }, this.view),
    );
    this.content.addChild(this.backdrop);

    this.page.setAttribute('aria-label', 'Who is playing?');
    const title = el('h1', 'chooser__title', 'Puddle Island');
    const ask = el('p', 'chooser__ask', 'Who’s playing?');
    this.page.append(title, ask, this.cards, this.note);
    this.note.hidden = true;
    // A key (Tab included) brings the ring; any real pointer takes it away, and makes the click that follows its tap.
    this.page.addEventListener('pointerdown', () => {
      this.pointerAt = performance.now();
      this.showRing(false);
    }, true);
    window.addEventListener('keydown', this.onKeyDown);
    document.body.append(this.page, this.gear.el);
    setTimeout(() => this.page.classList.add('chooser--in'), 16);
    this.startInput();
    void this.build();
  }

  resize(v: View) {
    this.backdrop.resize(v);
  }

  private readonly onKeyDown = (e: KeyboardEvent) => {
    if (!e.metaKey && !e.ctrlKey && !e.altKey) this.showRing(true);
  };

  /** Keys and controllers are only read while nothing else (the add form, the grown-ups' page) wants Enter and the arrows. */
  private startInput() {
    if (this.input || this.closed) return;
    this.input = new CouchInput(() => {
      audio.unlock();
      voice.unlock();
    }, () => {});
  }

  private stopInput() {
    this.input?.destroy();
    this.input = null;
  }

  private async build() {
    const items = await Promise.all(store.profiles.map(async (entry): Promise<Item> => ({ entry, save: (await store.peek(entry.id)) ?? defaults() })));
    if (this.closed) return;
    this.items = items;
    this.cards.replaceChildren();
    this.buttons = [];

    for (const { entry, save } of items.filter((i) => !isBlankProfile(i.save, i.entry))) {
      const name = cardName(save);
      const card = el('div', 'chooser__card');
      card.dataset.id = entry.id;
      const play = el('button', 'chooser__play');
      play.type = 'button';
      play.dataset.id = entry.id;
      play.setAttribute('aria-label', `Play as ${name}`);
      play.append(this.friend(save), el('span', 'chooser__name', name));
      play.addEventListener('click', (e) => this.choose(entry.id, modeFor(sourceOfClick(e.detail, performance.now() - this.pointerAt < POINTER_WINDOW_MS))));
      const couch = el('button', 'chooser__couch');
      couch.type = 'button';
      couch.setAttribute('aria-label', `${name}: couch play, with a controller or keyboard`);
      couch.innerHTML = `${PAD}<span>Couch play</span>`;
      couch.addEventListener('click', () => this.choose(entry.id, 'couch'));
      card.append(play, couch);
      this.cards.append(card);
      this.buttons.push(play);
    }

    // Add fills in the blank profile, or makes a new one if the household has room.
    const canAdd = blankToFill(items) !== null || store.profiles.length < MAX_PROFILES;
    if (canAdd) {
      const add = el('button', 'chooser__add');
      add.type = 'button';
      add.append(el('span', 'chooser__plus', '+'), el('span', '', 'Add a player'));
      add.addEventListener('click', () => this.openAdd());
      this.cards.append(add);
      this.buttons.push(add);
    }
    this.note.hidden = canAdd;
    if (!canAdd) this.note.textContent = 'Everyone has a place. To add someone new, a grown-up can remove a player in the grown-ups’ page (hold the gear).';

    const mine = this.buttons.findIndex((b) => b.dataset.id === store.activeId);
    this.setFocus(mine >= 0 ? mine : 0);
  }

  /** A person's friend, drawn once into a picture for the card. An egg until it has hatched. */
  private friend(save: SaveData): HTMLCanvasElement {
    const art = save.pet.hatched ? new Critter(petSpecFor(save.pet)) : drawEgg(new Graphics());
    const canvas = this.app.renderer.extract.canvas({ target: art, resolution: 1.5 }) as HTMLCanvasElement;
    canvas.setAttribute('aria-hidden', 'true');
    art.destroy({ children: true });
    return canvas;
  }

  private showRing(on: boolean) {
    this.ring = on;
    this.page.classList.toggle('chooser--keys', on);
    this.buttons.forEach((b, i) => b.classList.toggle('is-focus', on && i === this.focus));
  }

  private setFocus(i: number) {
    if (!this.buttons.length) return;
    this.focus = Math.max(0, Math.min(this.buttons.length - 1, i));
    this.buttons[this.focus].focus({ preventScroll: false });
    this.showRing(this.ring);
  }

  /** One push of the stick or an arrow: the nearest card that way. */
  private move(direction: number) {
    const spots = this.buttons.map((b) => {
      const r = b.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (spots.length) this.setFocus(nextSpot(spots, this.focus, direction));
  }

  update(dt: number) {
    super.update(dt);
    this.age += dt;
    // A new screen must see the keys and buttons released before it accepts them.
    if (!this.input || this.busy || this.age < 0.35) return;
    for (const p of this.input.poll().players) {
      if (this.busy) break;
      if (p.direction >= 0) {
        this.showRing(true);
        this.move(p.direction);
      } else if (p.action) {
        this.showRing(true);
        this.activate();
      }
    }
  }

  /** Enter or a controller button: only on a card is it a choice (a focused gear, say, is not). */
  private activate() {
    const at = document.activeElement;
    const id = at instanceof HTMLElement ? at.closest<HTMLElement>('.chooser__card')?.dataset.id : undefined;
    if (id) this.choose(id, modeFor('pad'));
    else if (at instanceof HTMLElement && at.classList.contains('chooser__add')) this.openAdd();
  }

  /**
   * A card was picked. Sound is unlocked first, inside the gesture and before anything is awaited (iOS keeps the game
   * silent otherwise); then the player is switched, and the mode decides where they go.
   */
  private choose(id: string, mode: Mode) {
    if (this.busy || this.closed) return;
    this.busy = true;
    audio.unlock();
    voice.unlock();
    this.stopInput();
    this.gear.hide(true);
    void this.begin(id, mode);
  }

  private async begin(id: string, mode: Mode) {
    const ok = await selectPlayer(id);
    if (this.closed) return;
    if (!ok) {
      // Someone was removed while the card was on screen.
      this.busy = false;
      this.gear.hide(false);
      this.startInput();
      await this.build();
      return;
    }
    if (mode === 'couch') {
      // Their name fills Player 1, as the couch shows names; with none, the couch keeps what it has.
      const name = couchNameFor(store.data.profile.name);
      if (name) {
        couchStore.data.names[0] = name;
        couchStore.save();
      }
      this.app.go.couch();
      return;
    }
    this.page.classList.add('chooser--leaving');
    this.cards.querySelector(`.chooser__card[data-id="${id}"]`)?.classList.add('is-chosen');
    sfx.giggle();
    void voice.say('start.hi');
    await this.tw.wait(1.3);
    if (this.closed) return;
    // Straight to their own place on the trail; the island button leads to the whole map.
    if (store.data.pet.hatched) this.app.go.place(store.data.profile.band);
    else this.app.go.hatch(skipsEgg(store.entry.birth, new Date()));
  }

  private openGrownUps() {
    if (this.busy || this.closed) return;
    voice.stop();
    this.stopInput();
    // The page edits whoever it is pointed at; closing it brings the chooser back, showing any change.
    openParentPanel(() => this.app.go.start(), () => this.app.go.start());
  }

  // ---- Add a player ---------------------------------------------------------------------------------------------

  private openAdd() {
    if (this.busy || this.form) return;
    this.stopInput();
    const year = new Date().getFullYear();
    const wrap = el('div', 'parent');
    wrap.innerHTML = `
      <form class="parent__sheet" role="dialog" aria-modal="true" aria-labelledby="add-title" novalidate>
        <div class="parent__head"><h1 id="add-title">Add a player</h1></div>
        <p class="muted">The birth month and year choose where the island starts, and move them up by themselves as they grow. It stays on this device.</p>
        <div class="parent__row"><label for="add-name">Name</label><input id="add-name" type="text" maxlength="40" autocomplete="off" placeholder="e.g. Mia" /></div>
        <div class="parent__row"><label for="add-month">Birth month</label>
          <select id="add-month"><option value="">Choose…</option>${MONTHS.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select></div>
        <div class="parent__row"><label for="add-year">Birth year</label>
          <input id="add-year" type="number" inputmode="numeric" min="${year - 120}" max="${year}" placeholder="${year - 3}" /></div>
        <p class="chooser-problem" role="alert" data-problem hidden></p>
        <div class="parent__actions"><button type="submit" class="btn btn--primary">Add</button><button type="button" class="btn" data-cancel>Cancel</button></div>
      </form>`;
    this.form = wrap;
    const $ = <T extends Element>(sel: string) => wrap.querySelector(sel) as T;
    const name = $<HTMLInputElement>('#add-name');
    const month = $<HTMLSelectElement>('#add-month');
    const yearBox = $<HTMLInputElement>('#add-year');
    const problem = $<HTMLElement>('[data-problem]');

    this.formKey = (e: KeyboardEvent) => e.key === 'Escape' && !this.busy && this.dismissForm(true);
    window.addEventListener('keydown', this.formKey);
    $('[data-cancel]').addEventListener('click', () => this.dismissForm(true));
    $('form').addEventListener('submit', (e) => {
      e.preventDefault();
      audio.unlock();
      voice.unlock();
      const read: NewPlayer = readNewPlayer(name.value, month.value, yearBox.value, new Date());
      if (!read.ok) {
        problem.hidden = false;
        problem.textContent = read.problem === 'name' ? 'Please type a name.' : 'Please choose the month and the year they were born (not a date that has not happened).';
        (read.problem === 'name' ? name : month.value ? yearBox : month).focus();
        return;
      }
      void this.create(read.name, read.birth);
    });
    document.body.append(wrap);
    name.focus();
  }

  private async create(name: string, birth: { month: number; year: number }) {
    if (this.busy) return;
    this.busy = true;
    // Add fills in the blank profile if there is one, so the first person stays where an older build looks for them.
    let id = blankToFill(this.items);
    if (id === null) id = store.addProfile(birth);
    if (id === null || !(await selectPlayer(id))) {
      this.busy = false;
      const p = this.form?.querySelector<HTMLElement>('[data-problem]');
      if (p) {
        p.hidden = false;
        p.textContent = 'There is no room for another player. A grown-up can remove someone in the grown-ups’ page.';
      }
      return;
    }
    store.setBirth(id, birth);
    store.data.profile.name = name;
    store.save();
    applySettings();
    this.dismissForm(false);
    this.gear.hide(true);
    this.app.go.hatch(skipsEgg(birth, new Date()));
  }

  /** Takes the add form away; when the chooser stays, keys and the ring come back. */
  private dismissForm(restart: boolean) {
    if (!this.form) return;
    if (this.formKey) window.removeEventListener('keydown', this.formKey);
    this.formKey = null;
    this.form.remove();
    this.form = null;
    if (restart) {
      this.startInput();
      this.setFocus(this.focus);
    }
  }

  destroy() {
    this.closed = true;
    window.removeEventListener('keydown', this.onKeyDown);
    this.stopInput();
    this.dismissForm(false);
    this.page.remove();
    this.gear.destroy();
    super.destroy();
  }
}
