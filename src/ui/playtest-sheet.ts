import { voice } from '../audio/voice';
import type { DailyPick } from '../content/daily';
import { noteFor, notesText, RATING_LABEL, RATINGS, type Rating } from '../content/playtest';
import { gameById } from '../games/registry';
import { store } from '../progress/store';

export interface PlaytestSheetOptions {
  day: string;
  picks: readonly DailyPick[];
  played: (id: string) => boolean;
  /** Open on this game alone (a round's result); otherwise all six. */
  only?: string;
  onClose: () => void;
}

export interface PlaytestSheet {
  close(): void;
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/**
 * A grown-up's playtest notes on today's six: for each game a reaction (Good, Fine, Needs work) and a line of text, saved
 * as they are entered, plus "Copy all notes" for pasting into the observations doc. Plain HTML, as grown-up UI is; opened
 * from the six page's pencil or a daily round's result, for a grown-up profile only.
 */
export function openPlaytestSheet({
  day,
  picks,
  played,
  only,
  onClose,
}: PlaytestSheetOptions): PlaytestSheet {
  const root = document.createElement('div');
  root.className = 'playtest';
  const shown = only ? picks.filter((p) => p.mod.id === only) : picks;
  const rows = shown
    .map((p) => {
      const n = noteFor(store.data.playtest, day, p.mod.id);
      const buttons = RATINGS.map(
        (r) =>
          `<button type="button" class="playtest__rate" data-rate="${r}" aria-pressed="${n?.rating === r}">${RATING_LABEL[r]}</button>`,
      ).join('');
      return `
      <section class="playtest__game" data-game="${p.mod.id}" data-level="${p.level}">
        <h2>${esc(p.mod.name)} <small>level ${p.level}${played(p.mod.id) ? '' : ', not played today'}</small></h2>
        <div class="playtest__rates">${buttons}</div>
        <textarea rows="2" maxlength="280" placeholder="What worked, what got in the way?" aria-label="Note on ${esc(p.mod.name)}">${esc(n?.note ?? '')}</textarea>
      </section>`;
    })
    .join('');
  root.innerHTML = `
    <div class="playtest__card" role="dialog" aria-modal="true" aria-labelledby="playtest-title">
      <h1 id="playtest-title">Playtest notes</h1>
      <p class="playtest__lead">Saved on this device for ${esc(store.data.profile.name || 'this player')} as you go.</p>
      ${rows}
      <div class="playtest__actions">
        <button type="button" class="btn" data-copy>Copy all notes</button>
        <button type="button" class="btn btn--primary" data-done>Done</button>
      </div>
      <p class="playtest__status" role="status" aria-live="polite"></p>
    </div>`;

  const save = (section: HTMLElement) => {
    const pressed = section.querySelector<HTMLElement>('[aria-pressed="true"]');
    store.notePlaytest({
      day,
      game: section.dataset.game!,
      level: Number(section.dataset.level),
      rating: (pressed?.dataset.rate as Rating | undefined) ?? null,
      note: section.querySelector('textarea')!.value,
      at: Date.now(),
    });
  };
  for (const section of root.querySelectorAll<HTMLElement>('.playtest__game')) {
    for (const button of section.querySelectorAll<HTMLButtonElement>('.playtest__rate'))
      button.addEventListener('click', () => {
        // A second press takes the reaction back.
        const on = button.getAttribute('aria-pressed') !== 'true';
        for (const b of section.querySelectorAll('.playtest__rate')) b.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-pressed', String(on));
        save(section);
      });
    section.querySelector('textarea')!.addEventListener('change', () => save(section));
  }

  const status = root.querySelector<HTMLElement>('.playtest__status')!;
  root.querySelector('[data-copy]')!.addEventListener('click', () => {
    for (const section of root.querySelectorAll<HTMLElement>('.playtest__game')) save(section);
    const text = notesText(store.data.playtest, store.data.profile.name, (id) => gameById(id)?.name ?? id);
    if (!text) {
      status.textContent = 'No notes yet.';
      return;
    }
    copyText(text).then(
      () => (status.textContent = 'Copied. Paste it into a message or the observations doc.'),
      () => (status.textContent = 'Could not copy on this device.'),
    );
  });

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    for (const section of root.querySelectorAll<HTMLElement>('.playtest__game')) save(section);
    window.removeEventListener('keydown', onKey, true);
    root.remove();
    onClose();
  };
  const onKey = (e: KeyboardEvent) => {
    // The sheet takes the keyboard while it is open: typing must not reach the scene, and Esc closes it.
    e.stopPropagation();
    if (e.key === 'Escape') close();
  };
  window.addEventListener('keydown', onKey, true);
  root.querySelector('[data-done]')!.addEventListener('click', close);
  // The scene underneath may listen on the window; none of this should reach it.
  for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'] as const)
    root.addEventListener(type, (e) => e.stopPropagation());
  voice.stop();
  document.body.appendChild(root);
  return { close };
}

/** The notes onto the clipboard: the async API where the page may use it, else a hidden field and the copy command. */
export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const field = document.createElement('textarea');
    field.value = text;
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand('copy');
    field.remove();
    if (!ok) throw new Error('copy failed');
  }
}
