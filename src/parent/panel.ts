import { applySettings } from '../app/settings';
import { session } from '../app/session';
import { voice } from '../audio/voice';
import { GAMES } from '../games/registry';
import { BANDS, type Band } from '../progress/bands';
import { store } from '../progress/store';

const SESSION_CHOICES = [5, 10, 15, 20, 30, 0];
const DAY = 24 * 60 * 60 * 1000;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * The grown-up zone: plain HTML over the game, reached through the parent gate.
 * Settings apply when it closes, and the session timer restarts.
 */
export function openParentPanel(onClose: () => void) {
  const d = store.data;
  const root = document.createElement('div');
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
      <div class="parent__bands" data-bands>
        ${BANDS.map((b) => `<button type="button" data-band="${b.id}">${b.label}<small>${b.ages}</small></button>`).join('')}
      </div>

      <h2>Play time</h2>
      <div class="parent__row">
        <label for="p-session">Session length (then a goodnight scene)</label>
        <select id="p-session">
          ${SESSION_CHOICES.map((m) => `<option value="${m}">${m ? `${m} minutes` : 'No limit'}</option>`).join('')}
        </select>
      </div>
      <div class="parent__row">
        <label for="p-tips">Show grown-up tips during games</label>
        <input id="p-tips" type="checkbox" />
      </div>

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
    </div>`;

  const $ = <T extends Element>(sel: string) => root.querySelector(sel) as T;
  const name = $<HTMLInputElement>('#p-name');
  const sessionSel = $<HTMLSelectElement>('#p-session');
  const tips = $<HTMLInputElement>('#p-tips');
  const volume = $<HTMLInputElement>('#p-volume');
  const musicBox = $<HTMLInputElement>('#p-music');

  const render = () => {
    name.value = d.profile.name;
    sessionSel.value = String(d.settings.sessionMinutes);
    if (!sessionSel.value) sessionSel.value = '0';
    tips.checked = d.settings.coplayHints;
    volume.value = String(d.settings.volume);
    musicBox.checked = d.settings.music;
    root.querySelectorAll<HTMLButtonElement>('[data-band]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.band === store.data.profile.band)));
    $('[data-week]').innerHTML = weekSummary();
  };
  render();

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
  sessionSel.addEventListener('change', () => {
    store.data.settings.sessionMinutes = Number(sessionSel.value);
    store.save();
  });
  tips.addEventListener('change', () => {
    store.data.settings.coplayHints = tips.checked;
    store.save();
  });
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
    alert(ok ? 'Backup restored.' : "That file doesn't look like a Puddle Island backup.");
    applySettings();
    render();
  });
  $('[data-reset]').addEventListener('click', () => {
    if (!confirm('Clear all game progress and stickers? Name and settings are kept.')) return;
    store.reset();
    render();
  });

  const close = () => {
    root.remove();
    window.removeEventListener('keydown', onKey);
    applySettings();
    session.start(store.data.settings.sessionMinutes);
    onClose();
  };
  const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
  $('[data-done]').addEventListener('click', close);
  window.addEventListener('keydown', onKey);
  document.body.appendChild(root);
}

function weekSummary(): string {
  const since = Date.now() - 7 * DAY;
  const rows = GAMES.map((g) => {
    const stats = store.data.games[g.id];
    const recent = stats?.history.filter((r) => r.at >= since) ?? [];
    const seconds = recent.reduce((t, r) => t + r.seconds, 0);
    const minutes = seconds > 0 ? Math.max(1, Math.round(seconds / 60)) : 0;
    return { g, rounds: recent.length, minutes, level: stats?.level ?? 1, total: stats?.plays ?? 0 };
  });
  const played = rows.filter((r) => r.rounds > 0);
  const stickers = store.data.stickers.filter((s) => s.at >= since).length;
  const ideas = (played.length ? played : rows).filter((r) => r.g.offScreen).slice(0, 2);
  return `
    <table>
      <tr><th>Game</th><th>Rounds</th><th>Minutes</th><th>Level</th></tr>
      ${rows.map((r) => `<tr><td>${esc(r.g.name)}</td><td>${r.rounds}</td><td>${r.minutes}</td><td>${r.level}</td></tr>`).join('')}
    </table>
    <p class="muted" style="margin-top:8px">${stickers} sticker${stickers === 1 ? '' : 's'} this week, ${store.data.stickers.length} in all. Rounds counts only the most recent ten per game.</p>
    ${ideas.map((r) => `<p><strong>Off-screen idea:</strong> ${esc(r.g.offScreen!)}</p>`).join('')}`;
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
