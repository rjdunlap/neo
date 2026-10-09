import { applySettings } from '../app/settings';
import { voice } from '../audio/voice';
import { GAMES } from '../games/registry';
import { BANDS, type Band } from '../progress/bands';
import { store } from '../progress/store';
import { placeFor } from '../content/places';
import { PET_COLORS, type PetColor } from '../content/world';

const DAY = 24 * 60 * 60 * 1000;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

let current: HTMLElement | null = null;

/** Whether the grown-ups' page is on screen. It closes itself on Esc, so the app's Esc and keys like C leave it alone. */
export const isParentPanelOpen = () => current !== null;

const clock = (at: number) => new Date(at).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });

/**
 * The grown-up zone: plain HTML over the game, reached by holding the grown-ups gear.
 * Settings apply when it closes.
 */
export function openParentPanel(onClose: () => void) {
  if (current) return;
  const root = document.createElement('div');
  current = root;
  root.className = 'parent';
  root.innerHTML = `
    <div class="parent__sheet" role="dialog" aria-modal="true" aria-labelledby="parent-title">
      <div class="parent__head">
        <h1 id="parent-title">Grown-ups</h1>
        <button class="btn btn--primary" data-done>Done</button>
      </div>
      <p class="muted">Settings for Puddle Island. Nothing here ever leaves this iPad.</p>

      <h2>Who's playing</h2>
      <div class="parent__row">
        <label for="p-name">Child's name, as the voice should say it</label>
        <input id="p-name" type="text" autocomplete="off" maxlength="40" placeholder="e.g. Mia" />
      </div>
      <p class="muted">Her age band is her pet's home on the island trail, and where play starts. Every place stays open to explore; each plays its games at that age's levels.</p>
      <div class="parent__bands" data-bands>
        ${BANDS.map((b) => `<button type="button" data-band="${b.id}">${b.label}<small>${b.ages} · ${esc(placeFor(b.id).name)}</small></button>`).join('')}
      </div>

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
        <label for="p-layout">Place layout</label>
        <select id="p-layout"><option value="path">Swiping path (original)</option><option value="subjects">Subject cards (try on iPad)</option></select>
      </div>
      <p class="muted">Subject cards show four large choices at a time. Try both layouts when finding and returning from a favorite game.</p>

      <h2>Sound</h2>
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
      <p class="muted">Saves progress and stickers to a file you can keep or move to another iPad.</p>
      <div class="parent__actions" style="margin-top:10px">
        <button class="btn" data-export>Save a backup</button>
        <button class="btn" data-import>Restore from a backup</button>
        <button class="btn btn--danger" data-reset>Reset progress</button>
        <input type="file" accept="application/json,.json" data-file hidden />
      </div>
      <p class="muted" data-undo-note hidden></p>
      <div class="parent__actions" style="margin-top:10px">
        <button class="btn" data-undo hidden>Undo the last reset or restore</button>
      </div>
    </div>`;

  const $ = <T extends Element>(sel: string) => root.querySelector(sel) as T;
  const name = $<HTMLInputElement>('#p-name');
  const petName = $<HTMLInputElement>('#p-pet-name');
  const petColor = $<HTMLSelectElement>('#p-pet-color');
  const tips = $<HTMLInputElement>('#p-tips');
  const howto = $<HTMLInputElement>('#p-howto');
  const layout = $<HTMLSelectElement>('#p-layout');
  const volume = $<HTMLInputElement>('#p-volume');
  const musicBox = $<HTMLInputElement>('#p-music');

  const render = () => {
    const d = store.data;
    petName.value = d.pet.name;
    petColor.value = d.pet.color;
    name.value = d.profile.name;
    layout.value = d.settings.placeLayout;
    tips.checked = d.settings.coplayHints;
    howto.checked = d.settings.howToCards;
    volume.value = String(d.settings.volume);
    musicBox.checked = d.settings.music;
    const undoAt = store.undoAt;
    $('[data-undo]').toggleAttribute('hidden', undoAt === null);
    $('[data-undo-note]').toggleAttribute('hidden', undoAt === null);
    if (undoAt !== null) $('[data-undo-note]').textContent = `Her progress from before ${clock(undoAt)} is kept, so a reset or restore can be undone. Undoing twice puts it back the way it is now.`;
    root.querySelectorAll<HTMLButtonElement>('[data-band]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.band === store.data.profile.band)));
    $('[data-week]').innerHTML = weekSummary();
    root.querySelectorAll<HTMLSelectElement>('[data-pin]').forEach((sel) =>
      sel.addEventListener('change', () => {
        store.pin(sel.dataset.pin!, sel.value ? Number(sel.value) : null);
        render();
      }),
    );
  };
  render();

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
  root.querySelectorAll<HTMLButtonElement>('[data-band]').forEach((b) =>
    b.addEventListener('click', () => {
      store.setBand(b.dataset.band as Band);
      render();
    }),
  );
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
    const ok = store.importJson(await f.text());
    file.value = '';
    alert(ok ? 'Backup restored. If that was a mistake, "Undo the last reset or restore" brings back what was here.' : "That file doesn't look like a Puddle Island backup.");
    applySettings();
    render();
  });
  $('[data-reset]').addEventListener('click', () => {
    if (!confirm('Clear all game progress and stickers? Name and settings are kept. You can undo this from this page.')) return;
    store.reset();
    render();
  });
  $('[data-undo]').addEventListener('click', () => {
    if (!store.undo()) return;
    applySettings();
    render();
  });

  const close = () => {
    current = null;
    root.remove();
    window.removeEventListener('keydown', onKey);
    applySettings();
    onClose();
  };
  const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
  $('[data-done]').addEventListener('click', close);
  window.addEventListener('keydown', onKey);
  document.body.appendChild(root);
}

function weekSummary(): string {
  const since = Date.now() - 7 * DAY;
  const band = store.data.profile.band;
  const games = GAMES.filter((g) => g.bands.includes(band));
  const rows = games.map((g) => {
    const stats = store.stats(g.id);
    const recent = stats.history.filter((r) => r.at >= since);
    const seconds = recent.reduce((t, r) => t + r.seconds, 0);
    const minutes = seconds > 0 ? Math.max(1, Math.round(seconds / 60)) : 0;
    const range = g.levels(band);
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
  // Every place is open, so she may also have played games meant for other ages.
  for (const g of GAMES.filter((g) => !g.bands.includes(band))) {
    const recent = store.stats(g.id).history.filter((r) => r.at >= since);
    if (!recent.length) continue;
    const minutes = Math.max(1, Math.round(recent.reduce((t, r) => t + r.seconds, 0) / 60));
    rows.push(`<tr><td><strong>${esc(g.name)}</strong><br><span class="muted">Played in another place on the trail</span></td><td>${recent.length}</td><td>${minutes}</td></tr>`);
  }
  const played = games.filter((g) => store.stats(g.id).history.some((r) => r.at >= since));
  const stickers = store.data.stickers.filter((s) => s.at >= since).length;
  const ideas = (played.length ? played : games).filter((g) => g.offScreen).slice(0, 2);
  return `
    <p class="muted">Levels adjust on their own: two easy rounds step up, two hard ones step down. Pick a level to stay on it instead. Games for her age band are shown with levels for that band, plus anything she played elsewhere on the trail this week.</p>
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
  const json = store.exportJson();
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
