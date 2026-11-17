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
  window.addEventListener('pagehide', view.dispose, { once: true });
  document.body.dataset.ready = 'true';
} catch (error) {
  status.textContent = 'The porch could not load. Refresh to try again.';
  console.error(error);
}
