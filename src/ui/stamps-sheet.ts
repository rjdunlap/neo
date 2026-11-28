import { voice } from '../audio/voice';
import { goalsFor, stampId, stampLabel } from '../content/stamps';
import { GAMES } from '../games/registry';
import { store } from '../progress/store';

export interface StampsSheet {
  close(): void;
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
export function openStampsSheet(onClose: () => void): StampsSheet {
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
  const root = document.createElement('div');
  root.className = 'playtest stamps';
  root.innerHTML = `
    <div class="playtest__card" role="dialog" aria-modal="true" aria-labelledby="stamps-title">
      <h1 id="stamps-title">Stamps</h1>
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
