/**
 * Art lab: one porch, two ways to draw it, with a frame-rate and download readout for judging them on a real phone.
 * `?view=3d` (default) is real-time Three.js; `?view=2d` is Blender stills in Pixi. `?dpr=` overrides the pixel-ratio cap.
 * Each view is its own chunk, and switching reloads the page, so the readout counts only what that view fetched.
 * Not linked from the game and kept out of the offline precache (vite.config.ts).
 */
import type { LabView } from './motion';

const $ = <E extends HTMLElement>(id: string) => document.getElementById(id) as E;
const host = $('view'),
  status = $('status'),
  readout = $('readout');
const waveButton = $<HTMLButtonElement>('wave'),
  ballButton = $<HTMLButtonElement>('ball');

const query = new URLSearchParams(location.search);
const mode = query.get('view') === '2d' ? '2d' : '3d';
const cap = Number(query.get('dpr')) || 1.5;
const pixelRatio = Math.min(devicePixelRatio, cap);
$(`tab-${mode}`).setAttribute('aria-current', 'page');
document.body.dataset.view = mode;

const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;
/** Compressed bytes this page load fetched, split into code and art. Same-origin only, which is all the lab uses. */
function downloaded(): string {
  if (import.meta.env.DEV) return 'download: build needed (dev server sizes mean nothing)';
  let code = 0,
    art = 0;
  const entries = [
    ...performance.getEntriesByType('navigation'),
    ...performance.getEntriesByType('resource'),
  ];
  for (const e of entries as PerformanceResourceTiming[]) {
    if (/\.(glb|webp|png|json)(\?|$)/.test(e.name)) art += e.encodedBodySize;
    else code += e.encodedBodySize;
  }
  return `download ${kb(code + art)} (code ${kb(code)}, art ${kb(art)})`;
}

// What went wrong, if anything, kept on screen so a phone playtest can report it.
const notes: string[] = [];
const note = (text: string) => {
  if (!notes.includes(text)) notes.push(text);
  console.warn(text);
};
// A marker that survives only when the page never got to say goodbye: the browser killed or reloaded the tab.
const OPEN = 'artlab-open';
try {
  const before = localStorage.getItem(OPEN);
  if (before) note(`last visit (${before}) ended without closing: the browser may have killed the tab`);
  localStorage.setItem(OPEN, mode);
  window.addEventListener('pagehide', () => localStorage.removeItem(OPEN));
} catch {
  // Private tabs may refuse storage; the marker is only a diagnostic.
}
window.addEventListener('error', (e) => note(`error: ${e.message}`));
window.addEventListener('unhandledrejection', (e) => note(`error: ${String(e.reason)}`));
// The browser can take the graphics context away (memory pressure, a long spell in the background). Neither event
// bubbles, so listen in the capture phase. Both renderers restore themselves; this only counts and says so.
let lost = 0;
host.addEventListener(
  'webglcontextlost',
  () => {
    lost++;
    status.textContent = 'The browser paused the graphics. Restoring…';
  },
  true,
);
host.addEventListener('webglcontextrestored', () => (status.textContent = 'Graphics restored.'), true);
// Leaving frees the renderer; a page brought back from the back-forward cache would be a dead canvas, so start again.
window.addEventListener('pageshow', (e) => {
  if (e.persisted) location.reload();
});

let view: LabView | undefined;
let readyMs = 0;
// Frame pacing as the screen saw it: every animation frame's gap, whichever renderer is running.
const gaps: { at: number; ms: number }[] = [];
let last = 0,
  shown = 0;
function meter(now: number) {
  if (last && !document.hidden) gaps.push({ at: now, ms: now - last });
  last = document.hidden ? 0 : now;
  while (gaps.length && gaps[0].at < now - 5000) gaps.shift();
  if (view && now - shown > 500 && gaps.length) {
    shown = now;
    const recent = gaps.filter((g) => g.at > now - 2000);
    const fps = (1000 * recent.length) / recent.reduce((sum, g) => sum + g.ms, 0);
    const worst = Math.max(...gaps.map((g) => g.ms));
    readout.textContent = [
      `${fps.toFixed(0)} fps · slowest frame ${worst.toFixed(0)} ms (5 s)`,
      `ready in ${(readyMs / 1000).toFixed(2)} s · ${downloaded()}`,
      `${view.detail()} · ${host.clientWidth}×${host.clientHeight} at ${pixelRatio}×`,
      ...(lost ? [`graphics context lost ${lost}×`] : []),
      ...notes,
    ].join('\n');
  }
  requestAnimationFrame(meter);
}
requestAnimationFrame(meter);

try {
  const { mount } = mode === '2d' ? await import('./artlab-2d') : await import('./artlab-3d');
  view = await mount(host, (text) => (status.textContent = text), pixelRatio);
  readyMs = performance.now();
  status.textContent = 'Tap Sprout or try the buttons.';
  waveButton.addEventListener('click', view.hello);
  ballButton.addEventListener('click', view.roll);
  waveButton.disabled = ballButton.disabled = false;
  if (view.eyeStyles && view.setEyes) {
    const bar = $('eyes');
    const pick = (style: string) => {
      view?.setEyes?.(style);
      for (const b of bar.querySelectorAll('button'))
        b.setAttribute('aria-pressed', String(b.textContent === style));
      query.set('eyes', style);
      history.replaceState(null, '', `?${query}`);
    };
    for (const style of view.eyeStyles) {
      const b = document.createElement('button');
      b.textContent = style;
      b.addEventListener('click', () => pick(style));
      bar.append(b);
    }
    const asked = query.get('eyes');
    pick(asked && view.eyeStyles.includes(asked) ? asked : view.eyeStyles[0]);
    bar.hidden = false;
  }
  window.addEventListener('pagehide', view.dispose, { once: true });
  document.body.dataset.ready = 'true';
} catch (error) {
  status.textContent = 'The porch could not load. Refresh to try again.';
  note(`could not load: ${String(error)}`);
  readout.textContent = notes.join('\n');
  console.error(error);
}
