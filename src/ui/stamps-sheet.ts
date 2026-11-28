import { voice } from '../audio/voice';
import { ALL_SIX_BONUS, keyOf, monthGrid, shareLine, type SixResult } from '../content/sixes';
import { goalsFor, stampId, stampLabel } from '../content/stamps';
import { GAMES } from '../games/registry';
import { store } from '../progress/store';

export interface StampsSheet {
  close(): void;
}

/** Today's six as the page has it, for the share line and the calendar's today. */
export interface SixToday {
  day: string;
  dateWords: string;
  results: SixResult[];
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** A month's calendar: a lit lantern on each day all six were done; other days are only their number. */
function calendarHtml(year: number, month: number, lit: ReadonlySet<string>, today: string): string {
  const title = new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const head = WEEKDAYS.map((d) => `<span class="sixes__wd">${d}</span>`).join('');
  const cells = monthGrid(year, month)
    .flat()
    .map((d) => {
      if (d === null) return '<span></span>';
      const key = keyOf(year, month, d);
      const on = lit.has(key);
      return `<span class="sixes__day${on ? ' is-lit' : ''}${key === today ? ' is-today' : ''}"${
        on ? ' aria-label="all six done"' : ''
      }>${on ? lanternSvg(true) : ''}<b>${d}</b></span>`;
    })
    .join('');
  return `<div class="sixes__month"><button type="button" class="btn" data-month="-1" aria-label="Previous month">‹</button><h2>${esc(
    title,
  )}</h2><button type="button" class="btn" data-month="1" aria-label="Next month">›</button></div><div class="sixes__grid">${head}${cells}</div>`;
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** A small paper lantern: lit (yellow, glowing) for a stamp held, pale for one still to earn. */
const lanternSvg = (lit: boolean) =>
  `<svg class="stamps__lantern${lit ? ' is-lit' : ''}" viewBox="0 0 32 40" aria-hidden="true">` +
  (lit ? '<circle cx="16" cy="20" r="16" class="stamps__glow"/>' : '') +
  '<rect x="11" y="4" width="10" height="4" rx="2" class="stamps__cap"/>' +
  '<ellipse cx="16" cy="20" rx="12" ry="13" class="stamps__body"/>' +
  '<path d="M11 8 Q8 20 11 32 M16 8 V32 M21 8 Q24 20 21 32" class="stamps__rib"/>' +
  '<rect x="11" y="32" width="10" height="4" rx="2" class="stamps__cap"/></svg>';

/**
 * A grown-up's stamps (the progression loop, docs/definitions/progression-loop.md, slice 3): every grown-up game with its
 * goals as a row of paper lanterns, lit when held, each saying what it asks before it is earned, and the shell balance.
 * Plain HTML, as grown-up UI is; opened from Today's six for a band that earns.
 */
export function openStampsSheet(onClose: () => void, today?: SixToday): StampsSheet {
  const held = new Map(store.data.stamps.map((s) => [s.id, s.at]));
  const games = GAMES.filter((g) => g.bands.includes('grownup'))
    .map((g) => ({ g, goals: goalsFor(g.levels('grownup')) }))
    .map((x) => ({ ...x, got: x.goals.filter((goal) => held.has(stampId(x.g.id, goal.kind))).length }))
    // Games with stamps under way first, then by name.
    .sort((a, b) => Number(b.got > 0) - Number(a.got > 0) || a.g.name.localeCompare(b.g.name));
  const total = games.reduce((n, x) => n + x.goals.length, 0);
  const got = games.reduce((n, x) => n + x.got, 0);
  const rows = games
    .map(({ g, goals, got }) => {
      const items = goals
        .map((goal) => {
          const has = held.has(stampId(g.id, goal.kind));
          const at = held.get(stampId(g.id, goal.kind)) ?? 0;
          const when = at
            ? new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            : '';
          return `<li class="stamps__goal${has ? ' is-held' : ''}">${lanternSvg(has)}<span>${esc(
            stampLabel(goal, (l) => g.describeLevel(l)),
          )}${when ? ` <small>${esc(when)}</small>` : ''}</span></li>`;
        })
        .join('');
      return `<section class="stamps__game"><h2>${esc(g.name)} <small>${got} of ${goals.length}</small></h2><ul>${items}</ul></section>`;
    })
    .join('');
  const line = today ? shareLine(today.dateWords, today.results) : '';
  const todayHtml = today
    ? `<section class="sixes__today"><h2>Today</h2><pre class="sixes__line">${esc(line)}</pre><p class="playtest__lead">Finish all six for ${ALL_SIX_BONUS} shells, once a day, and a lantern on the calendar.</p><div class="playtest__actions"><button type="button" class="btn" data-copy>Copy</button></div></section>`
    : '';
  const root = document.createElement('div');
  root.className = 'playtest stamps';
  root.innerHTML = `
    <div class="playtest__card" role="dialog" aria-modal="true" aria-labelledby="stamps-title">
      <h1 id="stamps-title">${today ? 'Lanterns' : 'Stamps'}</h1>
      ${today ? todayHtml : ''}
      ${today ? '<section class="sixes__cal" data-cal></section>' : ''}
      <h2 class="stamps__head">Stamps</h2>
      <p class="playtest__lead">${got} of ${total} lanterns lit · ${store.data.shells.balance} shells. Each stamp pays shells once; help counts for all but the clean round.</p>
      ${rows}
      <div class="playtest__actions"><button type="button" class="btn btn--primary" data-done>Done</button></div>
    </div>`;
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    window.removeEventListener('keydown', onKey, true);
    root.remove();
    onClose();
  };
  const onKey = (e: KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Escape') close();
  };
  window.addEventListener('keydown', onKey, true);
  root.querySelector('[data-done]')!.addEventListener('click', close);
  // The calendar opens on this month; the arrows turn it. Nothing is counted across days.
  const cal = root.querySelector<HTMLElement>('[data-cal]');
  if (cal && today) {
    const lit = new Set(store.data.sixes.days);
    const now = new Date();
    let y = now.getFullYear();
    let m = now.getMonth();
    const draw = () => {
      cal.innerHTML = calendarHtml(y, m, lit, today.day);
      for (const b of cal.querySelectorAll<HTMLButtonElement>('[data-month]'))
        b.addEventListener('click', () => {
          m += Number(b.dataset.month);
          if (m < 0) [y, m] = [y - 1, 11];
          if (m > 11) [y, m] = [y + 1, 0];
          draw();
        });
    };
    draw();
  }
  const copy = root.querySelector<HTMLButtonElement>('[data-copy]');
  copy?.addEventListener('click', () => {
    const done = () => (copy.textContent = 'Copied');
    // A phone's share sheet when there is one, else the clipboard.
    if (navigator.share) void navigator.share({ text: line }).catch(() => undefined);
    else void navigator.clipboard?.writeText(line).then(done, () => undefined);
  });
  // A tap on the dimmed space around the card closes it too.
  root.addEventListener('click', (e) => {
    if (e.target === root) close();
  });
  for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'] as const)
    root.addEventListener(type, (e) => e.stopPropagation());
  voice.stop();
  document.body.appendChild(root);
  return { close };
}
