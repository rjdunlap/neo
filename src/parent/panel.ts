import { playerChanged, selectPlayer } from '../app/players';
import { applySettings } from '../app/settings';
import { voice } from '../audio/voice';
import { GAMES } from '../games/registry';
import { BANDS, playBand, type Band } from '../progress/bands';
import { bandForYears, cardName, checkBirthInput, completedYears, isBlankProfile } from '../progress/profiles';
import { store } from '../progress/store';
import { visibleGames } from '../content/lands';
import { placeFor } from '../content/places';
import { PET_COLORS, type PetColor } from '../content/world';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const DAY = 24 * 60 * 60 * 1000;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

let current: HTMLElement | null = null;

/** Whether the grown-ups' page is on screen. It closes itself on Esc, so the app's Esc and keys like C leave it alone. */
export const isParentPanelOpen = () => current !== null;

const clock = (at: number) => new Date(at).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });

/**
 * The grown-up zone: plain HTML over the game, reached by holding the grown-ups gear.
 * Settings apply when it closes.
 *
 * It edits one player at a time, whoever is picked at the top, and closing it puts back whoever was playing when it opened
 * (`onClose`), or, if that player was removed here, goes to `onGone` (the chooser).
 */
export function openParentPanel(onClose: () => void, onGone: () => void = onClose) {
  if (current) return;
  const openedFor = store.activeId;
  const root = document.createElement('div');
  current = root;
  root.className = 'parent';
  root.innerHTML = `
    <div class="parent__sheet" role="dialog" aria-modal="true" aria-labelledby="parent-title">
      <div class="parent__head">
        <h1 id="parent-title">Grown-ups</h1>
        <button class="btn btn--primary" data-done>Done</button>
      </div>
      <p class="muted">Settings for Puddle Island. Nothing here ever leaves this device.</p>

      <h2>Who's playing</h2>
      <div class="parent__row">
        <label for="p-who">Settings for</label>
        <select id="p-who"></select>
      </div>
      <p class="muted">Everything down to Backup is for the player chosen here. New players are added on the "Who's playing?" page.</p>
      <div class="parent__row">
        <label for="p-name">Name, as the voice should say it</label>
        <input id="p-name" type="text" autocomplete="off" maxlength="40" placeholder="e.g. Mia" />
      </div>

      <h2>Age and where they start</h2>
      <div class="parent__row">
        <label for="p-month">Birth month</label>
        <select id="p-month"><option value="">Not set</option>${MONTHS.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select>
      </div>
      <div class="parent__row">
        <label for="p-year">Birth year</label>
        <input id="p-year" type="number" inputmode="numeric" placeholder="e.g. ${new Date().getFullYear() - 3}" />
      </div>
      <p class="muted" data-age></p>
      <p class="muted">With a birth month and year, their age picks the band by itself and moves them up as they grow. Choose a band below to start somewhere else instead. It sets their home spot on the map and the levels games start at. Every land stays open: a land shows the games for their age and younger, each at the levels nearest their age, and its signpost leads to games for bigger kids at their easiest levels. The birth month and year stay on this device, and are in the backup file.</p>
      <div class="parent__bands" data-bands>
        ${BANDS.map((b) => `<button type="button" data-band="${b.id}">${b.label}<small>${b.ages} · ${esc(placeFor(b.id).name)}</small></button>`).join('')}
      </div>
      <div class="parent__actions" style="margin-top:10px"><button class="btn" data-follow hidden>Follow their age again</button></div>

      <h2>Your island friend</h2>
      <div class="parent__row">
        <label for="p-pet-name">Pet name</label>
        <input id="p-pet-name" type="text" autocomplete="off" maxlength="40" />
      </div>
      <div class="parent__row">
        <label for="p-pet-color">Pet color</label>
        <select id="p-pet-color">${PET_COLORS.map((color) => `<option value="${color}">${color}</option>`).join('')}</select>
      </div>
      <h2>Playing</h2>
      <p class="muted">Puddle Island has no timer of its own. To limit how long she plays, use the device's tools: Screen Time app limits, or Guided Access, on an iPad.</p>
      <div class="parent__row">
        <label for="p-tips">Show grown-up tips during games</label>
        <input id="p-tips" type="checkbox" />
      </div>
      <div class="parent__row">
        <label for="p-howto">Show how to play before each game</label>
        <input id="p-howto" type="checkbox" />
      </div>
      <p class="muted">A card with the goal and how to play, a demonstration for some games, and a big Play button. Holding the ? in a game opens it again.</p>

      <h2>Finding games</h2>
      <div class="parent__row">
        <label for="p-layout">Home spot layout</label>
        <select id="p-layout"><option value="path">Swiping path (original)</option><option value="subjects">Subject cards (try on iPad)</option></select>
      </div>
      <p class="muted">The home spot on the map holds every game for their age in one place. Subject cards show four large choices at a time; the swiping path shows them all along one path.</p>

      <h2>Sound</h2>
      <p class="muted">Kept for each player.</p>
      <div class="parent__row">
        <label for="p-volume">Volume</label>
        <input id="p-volume" type="range" min="0" max="1" step="0.05" />
      </div>
      <div class="parent__row">
        <label for="p-music">Background music</label>
        <input id="p-music" type="checkbox" />
      </div>
      <div class="parent__row">
        <span>Hear the voice say the name</span>
        <button class="btn" data-test-voice>Play</button>
      </div>

      <h2>This week</h2>
      <div data-week></div>

      <h2>Backup</h2>
      <p class="muted">Saves everyone's progress, stickers and birth month and year to one file you can keep or move to another iPad or computer. Restoring puts people back and never removes anyone.</p>
      <div class="parent__actions" style="margin-top:10px">
        <button class="btn" data-export>Save a backup of everyone</button>
        <button class="btn" data-import>Restore from a backup</button>
        <input type="file" accept="application/json,.json" data-file hidden />
      </div>

      <h2>This player's progress</h2>
      <div class="parent__actions" style="margin-top:10px">
        <button class="btn btn--danger" data-reset>Reset progress</button>
        <button class="btn btn--danger" data-remove>Remove this player</button>
      </div>
      <p class="muted">Reset starts their progress over and keeps their name and friend. Removing deletes the player, their friend and everything saved for them from this device; a backup file can bring them back.</p>
      <p class="muted" data-undo-note hidden></p>
      <div class="parent__actions" style="margin-top:10px">
        <button class="btn" data-undo hidden>Undo the last reset or restore</button>
      </div>
    </div>`;

  const $ = <T extends Element>(sel: string) => root.querySelector(sel) as T;
  const who = $<HTMLSelectElement>('#p-who');
  const name = $<HTMLInputElement>('#p-name');
  const month = $<HTMLSelectElement>('#p-month');
  const year = $<HTMLInputElement>('#p-year');
  const petName = $<HTMLInputElement>('#p-pet-name');
  const petColor = $<HTMLSelectElement>('#p-pet-color');
  const tips = $<HTMLInputElement>('#p-tips');
  const howto = $<HTMLInputElement>('#p-howto');
  const layout = $<HTMLSelectElement>('#p-layout');
  const volume = $<HTMLInputElement>('#p-volume');
  const musicBox = $<HTMLInputElement>('#p-music');
  let closing = false;
  let gone = false;

  /** Everyone on the device, by the name on their card; the one being edited is selected. */
  const fillWho = async () => {
    const items = await Promise.all(store.profiles.map(async (e) => ({ e, save: await store.peek(e.id) })));
    if (closing) return;
    who.innerHTML = items.map(({ e, save }) => `<option value="${e.id}">${esc(save && !isBlankProfile(save, e) ? cardName(save) : 'New player (not set up)')}</option>`).join('');
    who.value = store.activeId;
  };

  /** One line on where their age (or a chosen start) puts them. */
  const ageNote = () => {
    const { birth, startBand } = store.entry;
    const age = birth ? `Age ${completedYears(birth, new Date())}. ` : '';
    const why = startBand ? 'Starting where you chose' : birth ? 'Starting where their age puts them' : 'No birth month and year yet, so they start in the band chosen below';
    return `${age}${why}: ${placeFor(store.data.profile.band).name}.`;
  };

  const render = () => {
    const d = store.data;
    const { birth, startBand } = store.entry;
    petName.value = d.pet.name;
    petColor.value = d.pet.color;
    name.value = d.profile.name;
    month.value = birth ? String(birth.month) : '';
    year.value = birth ? String(birth.year) : '';
    $('[data-age]').textContent = ageNote();
    $('[data-follow]').toggleAttribute('hidden', startBand === null);
    layout.value = d.settings.placeLayout;
    tips.checked = d.settings.coplayHints;
    howto.checked = d.settings.howToCards;
    volume.value = String(d.settings.volume);
    musicBox.checked = d.settings.music;
    const undoAt = store.undoAt;
    $('[data-undo]').toggleAttribute('hidden', undoAt === null);
    $('[data-undo-note]').toggleAttribute('hidden', undoAt === null);
    if (undoAt !== null) $('[data-undo-note]').textContent = `Their progress from before ${clock(undoAt)} is kept, so a reset or restore can be undone. Undoing twice puts it back the way it is now.`;
    root.querySelectorAll<HTMLButtonElement>('[data-band]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.band === store.data.profile.band)));
    $('[data-week]').innerHTML = weekSummary();
    root.querySelectorAll<HTMLSelectElement>('[data-pin]').forEach((sel) =>
      sel.addEventListener('change', () => {
        store.pin(sel.dataset.pin!, sel.value ? Number(sel.value) : null);
        render();
      }),
    );
  };
  void fillWho();
  render();

  who.addEventListener('change', async () => {
    who.disabled = true;
    await selectPlayer(who.value);
    who.disabled = false;
    render();
  });

  petName.addEventListener('input', () => {
    store.data.pet.name = petName.value.trim().slice(0, 40) || 'Pip';
    applySettings();
    store.save();
  });
  petColor.addEventListener('change', () => { store.data.pet.color = petColor.value as PetColor; store.save(); });

  name.addEventListener('input', () => {
    store.data.profile.name = name.value.slice(0, 40);
    applySettings();
    store.save();
  });
  name.addEventListener('change', () => void fillWho());

  /** A birth month and year typed here is held to the clock; one that is not both, or has not happened, is not kept. */
  const saveBirth = () => {
    if (!month.value && !year.value.trim()) {
      store.setBirth(store.activeId, null);
      render();
      return;
    }
    const birth = checkBirthInput(Number(month.value || NaN), Number(year.value.trim() || NaN), new Date());
    if (!birth) {
      $('[data-age]').textContent = month.value && year.value.trim() ? 'That month and year have not happened yet, or are too long ago, so it was not kept.' : 'Choose both the month and the year.';
      return;
    }
    store.setBirth(store.activeId, birth);
    render();
  };
  month.addEventListener('change', saveBirth);
  year.addEventListener('change', saveBirth);

  root.querySelectorAll<HTMLButtonElement>('[data-band]').forEach((b) =>
    b.addEventListener('click', () => {
      const band = b.dataset.band as Band;
      const { birth } = store.entry;
      // With a birth, a band is a start chosen instead of the age's; the age's own band is no choice at all.
      if (birth) store.setStartBand(store.activeId, band === bandForYears(completedYears(birth, new Date())) ? null : band);
      else store.setBand(band);
      render();
    }),
  );
  $('[data-follow]').addEventListener('click', () => {
    store.setStartBand(store.activeId, null);
    render();
  });
  tips.addEventListener('change', () => {
    store.data.settings.coplayHints = tips.checked;
    store.save();
  });
  howto.addEventListener('change', () => {
    store.data.settings.howToCards = howto.checked;
    store.save();
  });
  layout.addEventListener('change', () => { store.data.settings.placeLayout = layout.value === 'subjects' ? 'subjects' : 'path'; store.save(); });
  volume.addEventListener('input', () => {
    store.data.settings.volume = Number(volume.value);
    applySettings();
    store.save();
  });
  musicBox.addEventListener('change', () => {
    store.data.settings.music = musicBox.checked;
    applySettings();
    store.save();
  });
  $('[data-test-voice]').addEventListener('click', () => void voice.say('start.hi'));

  $('[data-export]').addEventListener('click', () => void exportBackup());
  const file = $<HTMLInputElement>('[data-file]');
  $('[data-import]').addEventListener('click', () => file.click());
  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    if (!f) return;
    const result = await store.restoreAll(await f.text());
    file.value = '';
    if (!result) {
      alert("That file doesn't look like a Puddle Island backup.");
      return;
    }
    const plural = (n: number) => `${n} player${n === 1 ? '' : 's'}`;
    alert(`Backup restored: ${plural(result.replaced)} put back${result.added ? `, ${plural(result.added)} added` : ''}${result.skipped ? `. ${plural(result.skipped)} did not fit and were left out` : ''}. If that was a mistake, choose the player at the top and press "Undo the last reset or restore".`);
    playerChanged();
    await fillWho();
    render();
  });
  $('[data-reset]').addEventListener('click', () => {
    if (!confirm(`Clear all game progress and stickers for ${cardName(store.data)}? Their name and settings are kept. You can undo this from this page.`)) return;
    store.reset();
    render();
  });
  $('[data-remove]').addEventListener('click', async () => {
    const label = cardName(store.data);
    if (!confirm(`Remove ${label} and everything saved for them from this device? A backup file can bring them back; nothing else can.`)) return;
    if (!(await store.removeProfile(store.activeId))) return;
    playerChanged();
    await fillWho();
    render();
  });
  $('[data-undo]').addEventListener('click', () => {
    if (!store.undo()) return;
    applySettings();
    render();
  });

  const close = async () => {
    if (closing) return;
    closing = true;
    current = null;
    root.remove();
    window.removeEventListener('keydown', onKey);
    // Whoever was playing when the page opened is playing when it closes, unless they were removed here.
    if (store.activeId !== openedFor) {
      if (store.profiles.some((p) => p.id === openedFor)) await selectPlayer(openedFor);
      else gone = true;
    }
    applySettings();
    (gone ? onGone : onClose)();
  };
  const onKey = (e: KeyboardEvent) => e.key === 'Escape' && void close();
  $('[data-done]').addEventListener('click', () => void close());
  window.addEventListener('keydown', onKey);
  document.body.appendChild(root);
}

function weekSummary(): string {
  const since = Date.now() - 7 * DAY;
  const band = store.data.profile.band;
  // What the lands show her: every game for her age and younger, each with the levels it plays for her.
  const games = visibleGames(band, GAMES);
  const rows = games.map((g) => {
    const stats = store.stats(g.id);
    const recent = stats.history.filter((r) => r.at >= since);
    const seconds = recent.reduce((t, r) => t + r.seconds, 0);
    const minutes = seconds > 0 ? Math.max(1, Math.round(seconds / 60)) : 0;
    const range = g.levels(playBand(g.bands, band));
    const now = store.levelFor(g.id, range);
    const options = [`<option value="">Automatic</option>`];
    for (let l = range.min; l <= range.max; l++) {
      options.push(`<option value="${l}" ${stats.pinned === l ? 'selected' : ''}>Stay on ${l}: ${esc(g.describeLevel(l))}</option>`);
    }
    const picker =
      range.max > range.min
        ? `<select data-pin="${g.id}" aria-label="Level for ${esc(g.name)}">${options.join('')}</select>`
        : '';
    return `<tr>
        <td><strong>${esc(g.name)}</strong><br><span class="muted">Level ${now}: ${esc(g.describeLevel(now))}</span>${picker ? `<br>${picker}` : ''}</td>
        <td>${recent.length}</td><td>${minutes}</td>
      </tr>`;
  });
  // A land's signpost leads to games for bigger kids, so she may also have played some of those.
  for (const g of GAMES.filter((g) => !games.includes(g))) {
    const recent = store.stats(g.id).history.filter((r) => r.at >= since);
    if (!recent.length) continue;
    const minutes = Math.max(1, Math.round(recent.reduce((t, r) => t + r.seconds, 0) / 60));
    rows.push(`<tr><td><strong>${esc(g.name)}</strong><br><span class="muted">A game for bigger kids, from a signpost</span></td><td>${recent.length}</td><td>${minutes}</td></tr>`);
  }
  const played = games.filter((g) => store.stats(g.id).history.some((r) => r.at >= since));
  const stickers = store.data.stickers.filter((s) => s.at >= since).length;
  const ideas = (played.length ? played : games).filter((g) => g.offScreen).slice(0, 2);
  return `
    <p class="muted">Levels adjust on their own: two easy rounds step up, two hard ones step down. Pick a level to stay on it instead. Every game for her age and younger is shown with the levels it plays for her, plus any game for bigger kids she played this week.</p>
    <table>
      <tr><th>Game and level</th><th>Rounds</th><th>Minutes</th></tr>
      ${rows.join('')}
    </table>
    <p class="muted" style="margin-top:8px">${stickers} sticker${stickers === 1 ? '' : 's'} this week, ${store.data.stickers.length} in all. Rounds counts only the most recent ten per game.</p>
    <p><strong>The Windy Picnic</strong> (a story on the island map): ${picnicSummary()}</p>
    ${ideas.map((g) => `<p><strong>Off-screen idea:</strong> ${esc(g.offScreen!)}</p>`).join('')}`;
}

function picnicSummary(): string {
  const p = store.picnic;
  const words: Record<string, string> = { blanket: 'found the blanket', sandwiches: 'shared the sandwiches', invitation: 'played the invitation' };
  const now = p.ended ? 'finished.' : p.steps.length ? `${p.steps.map((s) => words[s]).join(', ')} (${p.steps.length} of 3).` : 'not started yet.';
  return `${now} ${p.keepsake ? 'Its picnic photo is in the journal.' : ''} Its sandwich and invitation steps are Pet Kitchen and Jelly Drums rounds; they play at the story's level and don't change those games' levels.`;
}

async function exportBackup() {
  const json = await store.exportAll();
  const fileName = `puddle-island-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([json], fileName, { type: 'application/json' });
  // On iPad the share sheet is the friendliest way to put a file in Files.
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Puddle Island backup' });
      return;
    } catch {
      // Cancelled or unsupported: fall back to a download.
    }
  }
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: fileName });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
