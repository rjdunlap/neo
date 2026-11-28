import { makeEgg, makePortrait, STAND_IN } from '../../creatures/companion';
import { companionOf } from '../../progress/save';
import { Backdrop } from '../../art/scenery';
import { audio } from '../../audio/engine';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { nextSpot } from '../../couch/focus';
import { couchStore } from '../../couch/store';
import { CouchInput } from '../../engine/controller';
import type { View } from '../../engine/view';
import { openParentPanel } from '../../parent/panel';
import {
  blankToFill,
  cardName,
  everyoneHidden,
  isHiddenProfile,
  MAX_PROFILES,
  type ProfileEntry,
} from '../../progress/profiles';
import { defaults, type SaveData } from '../../progress/save';
import { store } from '../../progress/store';
import { gearButton } from '../../ui/grownups';
import {
  AGE_CHIPS,
  birthForChip,
  chipForBirth,
  couchNameFor,
  FIRST_VISIT_PLACES,
  exitFor,
  modeFor,
  POINTER_WINDOW_MS,
  readNewPlayer,
  skipsEgg,
  sourceOfClick,
  type Mode,
  type NewPlayer,
} from '../chooser';
import { selectPlayer } from '../players';
import { firstDemoPick, todaysSix } from '../daily-six';
import { dayKey } from '../../content/daily';
import type { App } from '../App';
import type { Band } from '../../progress/bands';
import { applySettings } from '../settings';
import { Scene } from '../Scene';
import { markTiming } from '../../engine/timing';
import { LEAVE_BEAT } from '../leave';
import '../../chooser.css';

interface Item {
  entry: ProfileEntry;
  save: SaveData;
}

/** A small game controller, for the card's own way into couch play. */
const PAD = `<svg viewBox="0 0 46 30" aria-hidden="true"><path fill="#6b6b7b" d="M10 3h26c5 0 8.5 4 9.4 11l1 8c.4 4-2 6-5.2 6-2.2 0-3.5-1.2-4.8-3.2L33.4 20H12.6l-1.4 4.8C9.9 26.8 8.6 28 6.4 28c-3.2 0-5.6-2-5.2-6l1-8C3.1 7 6 3 10 3z"/><path stroke="#fff" stroke-width="2.6" stroke-linecap="round" d="M13 9v8M9 13h8"/><circle cx="32" cy="10.5" r="2.2" fill="#fff"/><circle cx="37" cy="14.5" r="2.2" fill="#fff"/></svg>`;

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};

/** The stand-in friend's picture on a first-visit age place, in units of the card's paper: small to large. */
const PLACE_PICTURE = { small: 150, medium: 190, large: 230 } as const;

/**
 * "Who's playing?": a card for each person, and Add a player. A tap opens the island as that person; Enter or a controller
 * button opens couch play with them as Player 1, and so does the small controller button on each card, so a mouse user can
 * choose it too. Plain HTML over the island's backdrop. Nothing here can remove anyone: that is behind the gear's hold.
 *
 * At the root, while every profile is hidden (blank or a guest), it is the first-visit screen instead (play-first slice 2):
 * three age places that play one round as a guest before anything is set up, and a smaller Add a player below them.
 */
export class ChooserScene extends Scene {
  /** Takes keys itself. */
  override padPointer = false;
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
  /** Showing the three age places rather than people's cards (`everyoneHidden` at the root). */
  private firstVisit = false;
  /** Add me on a guest's result opens the add form at once; its Cancel brings back the first-visit screen. */
  private openFormOnBuild: boolean;
  private readonly gear = gearButton({
    onOpen: () => this.openGrownUps(),
    onShort: () => {
      // A press is a user gesture, so this is when speech can first be unlocked.
      audio.unlock();
      voice.unlock();
      void voice.say('parent.ask');
    },
  });

  constructor(app: App, openForm = false) {
    super(app);
    this.openFormOnBuild = openForm;
  }

  init() {
    this.backdrop = this.track(
      new Backdrop(
        {
          sky: [0x8fd3f7, 0xe9f7ff],
          hills: [0xc8ecb0, 0xaee39a, 0x9edb86],
          horizon: 0.62,
          clouds: 3,
          sun: true,
          seed: 12,
        },
        this.view,
      ),
    );
    this.content.addChild(this.backdrop);

    this.page.setAttribute('aria-label', 'Who is playing?');
    const title = el('h1', 'chooser__title', 'Puddle Island');
    const ask = el('p', 'chooser__ask', 'Who’s playing?');
    this.page.append(title, ask, this.cards, this.note);
    this.note.hidden = true;
    // A key (Tab included) brings the ring; any real pointer takes it away, and makes the click that follows its tap.
    this.page.addEventListener(
      'pointerdown',
      () => {
        this.pointerAt = performance.now();
        this.showRing(false);
      },
      true,
    );
    window.addEventListener('keydown', this.onKeyDown);
    document.body.append(this.page, this.gear.el);
    setTimeout(() => this.page.classList.add('chooser--in'), 16);
    this.startInput();
    void this.build();
  }

  resize(v: View) {
    this.backdrop.resize(v);
    // A phone on its side has a short heading (`chooser.css`): the sun sits smaller beside it, clear of the cards.
    const sun = this.backdrop.sun;
    const short = v.w > v.h && v.h * v.scale < 600;
    sun?.scale.set(short ? 0.8 : 1);
    if (short) sun?.position.set(v.w / 2 - 170 / v.scale, 50 / v.scale);
  }

  private readonly onKeyDown = (e: KeyboardEvent) => {
    if (!e.metaKey && !e.ctrlKey && !e.altKey) this.showRing(true);
  };

  /** Keys and controllers are only read while nothing else (the add form, the grown-ups' page) wants Enter and the arrows. */
  private startInput() {
    if (this.input || this.closed) return;
    this.input = new CouchInput(
      () => {
        audio.unlock();
        voice.unlock();
      },
      () => {},
    );
  }

  private stopInput() {
    this.input?.destroy();
    this.input = null;
  }

  private async build() {
    const items = await Promise.all(
      store.profiles.map(async (entry): Promise<Item> => ({
        entry,
        save: (await store.peek(entry.id)) ?? defaults(),
      })),
    );
    if (this.closed) return;
    this.items = items;
    this.cards.replaceChildren();
    this.buttons = [];
    const opening = this.openFormOnBuild;
    this.openFormOnBuild = false;
    // `classic/` keeps the plain chooser; so does the root once anyone shows a card, and while Add me's form is open.
    const firstVisit = this.app.creatureWorld && !opening && everyoneHidden(items);
    const wasFirst = this.firstVisit;
    this.firstVisit = firstVisit;
    this.page.classList.toggle('chooser--first', firstVisit);
    this.cards.classList.toggle('chooser__cards--places', firstVisit);
    if (firstVisit) {
      for (const place of FIRST_VISIT_PLACES) {
        const button = el('button', `chooser__place chooser__place--${place.size}`);
        button.type = 'button';
        button.dataset.band = place.band;
        button.setAttribute('aria-label', place.spoken);
        button.append(this.standIn(PLACE_PICTURE[place.size]), el('span', 'chooser__name', place.label));
        button.addEventListener('click', () => this.playAsGuest(place.band));
        this.cards.append(button);
        this.buttons.push(button);
      }
      if (!wasFirst) void voice.say('chooser.first');
    }

    const shown = firstVisit ? [] : items.filter((i) => !isHiddenProfile(i.save, i.entry));
    // Two or more players stand two across on an upright phone (`chooser.css`); one keeps the large card.
    this.cards.classList.toggle('chooser__cards--many', shown.length > 1);
    for (const { entry, save } of shown) {
      const name = cardName(save);
      const card = el('div', 'chooser__card');
      card.dataset.id = entry.id;
      const play = el('button', 'chooser__play');
      play.type = 'button';
      play.dataset.id = entry.id;
      play.setAttribute('aria-label', `Play as ${name}`);
      play.append(this.friend(save), el('span', 'chooser__name', name));
      play.addEventListener('click', (e) =>
        this.choose(
          entry.id,
          modeFor(sourceOfClick(e.detail, performance.now() - this.pointerAt < POINTER_WINDOW_MS)),
        ),
      );
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
    if (!canAdd)
      this.note.textContent =
        'Everyone has a place. To add someone new, a grown-up can remove a player in the grown-ups’ page (hold the gear).';

    const mine = this.buttons.findIndex((b) => b.dataset.id === store.activeId);
    this.setFocus(mine >= 0 ? mine : 0);
    markTiming('cards');
    if (opening && canAdd) this.openAdd();
  }

  /** The stand-in friend on card paper, for a first-visit age place: nobody has a friend yet. */
  private standIn(size: number): HTMLCanvasElement {
    const art = makePortrait(STAND_IN, size);
    const canvas = this.app.renderer.extract.canvas({ target: art, resolution: 1.5 }) as HTMLCanvasElement;
    canvas.setAttribute('aria-hidden', 'true');
    art.destroy({ children: true });
    return canvas;
  }

  /**
   * An age place was tapped: the hidden profile (the guest if there is one, else the blank `legacy` one) becomes a guest at
   * that band and plays the first of its six that has a ghost finger, as a daily round, so the rest of the six follows.
   */
  private playAsGuest(band: Band) {
    if (this.busy || this.closed) return;
    const id = blankToFill(this.items);
    if (id === null) return;
    markTiming('tap');
    this.busy = true;
    audio.unlock();
    voice.unlock();
    this.stopInput();
    this.gear.hide(true);
    void this.beginGuest(id, band);
  }

  private async beginGuest(id: string, band: Band) {
    const ok = await selectPlayer(id);
    if (this.closed) return;
    if (!ok) {
      this.busy = false;
      this.gear.hide(false);
      this.startInput();
      await this.build();
      return;
    }
    store.setGuest(id, true);
    store.setBand(band);
    this.page.classList.add('chooser--leaving');
    this.cards.querySelector(`.chooser__place[data-band="${band}"]`)?.classList.add('is-chosen');
    sfx.giggle();
    await this.tw.wait(LEAVE_BEAT);
    if (this.closed) return;
    const pick = firstDemoPick(todaysSix(dayKey(new Date()), this.app.uprightPhone(), this.app.phoneOnly));
    if (pick) this.app.go.game(pick.mod.id, pick.band, undefined, false, { daily: true }, pick.level);
    else this.app.go.daily();
  }

  /** A person's companion, drawn once into a picture for the card: its portrait on card paper, or an egg before the first friend. */
  private friend(save: SaveData): HTMLCanvasElement {
    const friend = companionOf(save.creatures);
    const art = friend ? makePortrait(friend, 230) : makeEgg('whole');
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
    const band = at instanceof HTMLElement ? (at.dataset.band as Band | undefined) : undefined;
    if (band) this.playAsGuest(band);
    else if (id) this.choose(id, modeFor('pad'));
    else if (at instanceof HTMLElement && at.classList.contains('chooser__add')) this.openAdd();
  }

  /**
   * A card was picked. Sound is unlocked first, inside the gesture and before anything is awaited (iOS keeps the game
   * silent otherwise); then the player is switched, and the mode decides where they go.
   */
  private choose(id: string, mode: Mode) {
    if (this.busy || this.closed) return;
    markTiming('tap');
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
    // The chosen card pops and the rest fade, with a giggle; the screen changes after the squash's beat (U7 R3). No spoken
    // greeting: the next screen's own first line would cut it after a syllable.
    sfx.giggle();
    await this.tw.wait(LEAVE_BEAT);
    if (this.closed) return;
    // To Home (the island map at classic/), or Today's six for a player whose grown-up chose it (D8); someone with no
    // friend yet hatches one first, and the hatch ends at Home.
    const exit = exitFor(store.data.creatures.owned.length > 0, store.data.settings.startView);
    if (exit === 'six') this.app.go.daily();
    else if (exit === 'hub') this.app.go.hub();
    else this.app.go.hatch(skipsEgg(store.entry.birth, new Date()));
  }

  private openGrownUps() {
    if (this.busy || this.closed) return;
    voice.stop();
    this.stopInput();
    // The page edits whoever it is pointed at; closing it brings the chooser back, showing any change.
    openParentPanel(
      () => this.app.go.start(),
      () => this.app.go.start(),
      { app: this.app.creatureWorld ? 'root' : 'classic' },
    );
  }

  // ---- Add a player ---------------------------------------------------------------------------------------------

  private openAdd() {
    if (this.busy || this.form) return;
    this.stopInput();
    const today = new Date();
    const year = today.getFullYear();
    const thisMonth = today.getMonth() + 1;
    const wrap = el('div', 'parent');
    // Taps first: an age chip fills the year and the month starts at this one, so a phone needs no keyboard. The typed
    // fields stay below for a grown-up who wants the exact month, and the name can wait for the grown-ups' page.
    wrap.innerHTML = `
      <form class="parent__sheet" role="dialog" aria-modal="true" aria-labelledby="add-title" novalidate>
        <div class="parent__head"><h1 id="add-title">Add a player</h1></div>
        <p class="muted">Their age chooses where the island starts, and the birth month moves them up by themselves as they grow. It stays on this device.</p>
        <div class="chooser-ages" role="group" aria-labelledby="add-age">
          <span id="add-age" class="chooser-ages__ask">How old?</span>
          <div class="chooser-ages__chips">${AGE_CHIPS.map((c) => `<button type="button" class="chooser-ages__chip" data-age="${c.years}" aria-pressed="false" aria-label="${c.spoken}">${c.label}</button>`).join('')}</div>
        </div>
        <div class="parent__row"><label for="add-month">Birth month</label>
          <select id="add-month">${MONTHS.map((m, i) => `<option value="${i + 1}"${i + 1 === thisMonth ? ' selected' : ''}>${m}</option>`).join('')}</select></div>
        <div class="parent__row"><label for="add-year">Birth year</label>
          <input id="add-year" type="number" inputmode="numeric" min="${year - 120}" max="${year}" placeholder="${year - 3}" /></div>
        <div class="parent__row"><label for="add-name">Name <small class="muted">(optional; a nickname is fine)</small></label><input id="add-name" type="text" maxlength="40" autocomplete="off" placeholder="e.g. Mia" /></div>
        <p class="chooser-problem" role="alert" data-problem hidden></p>
        <div class="parent__actions"><button type="submit" class="btn btn--primary">Add</button><button type="button" class="btn" data-cancel>Cancel</button></div>
      </form>`;
    this.form = wrap;
    const $ = <T extends Element>(sel: string) => wrap.querySelector(sel) as T;
    const name = $<HTMLInputElement>('#add-name');
    const month = $<HTMLSelectElement>('#add-month');
    const yearBox = $<HTMLInputElement>('#add-year');
    const problem = $<HTMLElement>('[data-problem]');
    const chips = [...wrap.querySelectorAll<HTMLButtonElement>('.chooser-ages__chip')];

    // The chip that is lit always says what the two fields hold, whether a tap or typing put it there.
    const light = () => {
      const on = chipForBirth(month.value, yearBox.value, new Date());
      for (const c of chips) c.setAttribute('aria-pressed', String(Number(c.dataset.age) === on?.years));
    };
    chips.forEach((button, i) =>
      button.addEventListener('click', () => {
        const birth = birthForChip(AGE_CHIPS[i], new Date());
        month.value = String(birth.month);
        yearBox.value = String(birth.year);
        problem.hidden = true;
        light();
      }),
    );
    month.addEventListener('change', light);
    yearBox.addEventListener('input', light);

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
        problem.textContent = yearBox.value.trim()
          ? 'Please choose the month and the year they were born (not a date that has not happened).'
          : 'Please tap an age, or type the year they were born.';
        // No focus on the year box when it is only empty: on a phone that would raise the keyboard over the chips.
        if (yearBox.value.trim()) yearBox.focus();
        else chips[0].focus();
        return;
      }
      void this.create(read.name, read.birth);
    });
    document.body.append(wrap);
    // The first chip takes focus, not a text field: a focused field raises a phone's keyboard, which the chips are there to avoid.
    chips[0].focus();
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
        p.textContent =
          'There is no room for another player. A grown-up can remove someone in the grown-ups’ page.';
      }
      return;
    }
    store.setBirth(id, birth);
    // Adoption is a rename: a guest's profile keeps its id, save, round and sticker, and is simply no longer a guest.
    store.setGuest(id, false);
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
      // Cancel on the form Add me opened: the chooser was plain only for the form, so the first-visit screen comes back.
      if (this.app.creatureWorld && !this.firstVisit && everyoneHidden(this.items)) void this.build();
      else this.setFocus(this.focus);
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
