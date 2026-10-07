import type { PadPart } from './catalog';

const NS = 'http://www.w3.org/2000/svg';

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, ...kids: SVGElement[]): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  el.append(...kids);
  return el;
}

const ring = (cx: number, cy: number, r: number, cls: string) => svg('circle', { cx, cy, r, class: cls });
const plus = (cx: number, cy: number, arm: number, thick: number, cls: string) =>
  svg('g', { class: cls }, svg('rect', { x: cx - arm, y: cy - thick / 2, width: arm * 2, height: thick, rx: thick / 3 }), svg('rect', { x: cx - thick / 2, y: cy - arm, width: thick, height: arm * 2, rx: thick / 3 }));

/** The four face buttons of a diamond, with one of them marked (or none). */
function diamond(cx: number, cy: number, gap: number, r: number, which: 'bottom' | 'left' | null, cls: string): SVGGElement {
  const spots = { top: [cx, cy - gap], bottom: [cx, cy + gap], left: [cx - gap, cy], right: [cx + gap, cy] } as const;
  const g = svg('g', { class: cls });
  for (const [name, [x, y]] of Object.entries(spots)) g.append(ring(x, y, r, name === which ? 'part on-able' : 'part dim'));
  return g;
}

export interface ControllerArt {
  el: SVGSVGElement;
  /** Light up exactly these parts. */
  light(parts: ReadonlySet<PadPart>): void;
}

/** A controller drawn in code, in the layout of a Pro Controller. Parts light up when `light` names them. */
export function controllerArt(): ControllerArt {
  const parts = new Map<PadPart, SVGElement[]>();
  const mark = <T extends SVGElement>(part: PadPart, el: T): T => {
    el.dataset.part = part;
    parts.set(part, [...(parts.get(part) ?? []), el]);
    return el;
  };
  const body = svg('path', {
    class: 'pad-body',
    d: 'M70 40 Q200 8 330 40 Q384 60 388 140 Q392 218 340 218 Q300 218 284 172 L116 172 Q100 218 60 218 Q8 218 12 140 Q16 60 70 40 Z',
  });
  const el = svg(
    'svg',
    { viewBox: '0 0 400 240', class: 'pad', role: 'img', 'aria-label': 'Controller diagram' },
    body,
    mark('stick', svg('g', {}, ring(98, 84, 30, 'part well'), ring(98, 84, 19, 'part cap'))),
    mark('dpad', plus(150, 148, 26, 17, 'part')),
    // The right stick is drawn but never used.
    svg('g', {}, ring(250, 148, 26, 'part dim'), ring(250, 148, 15, 'part dim')),
    mark('bottom', svg('g', {}, ring(302, 112, 15, 'part'))),
    mark('left', svg('g', {}, ring(274, 84, 15, 'part'))),
    ring(302, 56, 15, 'part dim'),
    ring(330, 84, 15, 'part dim'),
    ring(186, 62, 8, 'part dim'),
    mark('start', plus(214, 62, 9, 5, 'part')),
  );
  return {
    el,
    light(on) {
      for (const [part, nodes] of parts) for (const n of nodes) n.classList.toggle('on', on.has(part));
    },
  };
}

/** A small icon naming one part, for a row of instructions. */
export function padGlyph(part: PadPart): SVGSVGElement {
  const g = svg('svg', { viewBox: '0 0 44 44', class: 'glyph', 'aria-hidden': 'true' });
  if (part === 'stick') g.append(ring(22, 22, 17, 'part well'), ring(22, 22, 10, 'part cap'));
  else if (part === 'dpad') g.append(plus(22, 22, 17, 11, 'part'));
  else if (part === 'start') g.append(plus(22, 22, 12, 7, 'part'));
  else g.append(diamond(22, 22, 11, 6, part, 'part-group'));
  g.querySelectorAll('.on-able').forEach((n) => n.classList.add('on'));
  return g;
}

/** Glyphs for a row, joined by a small "or". */
export function glyphs(parts: PadPart[]): HTMLElement {
  const span = document.createElement('span');
  span.className = 'glyphs';
  parts.forEach((p, i) => {
    if (i) span.append(Object.assign(document.createElement('i'), { textContent: 'or' }));
    span.append(padGlyph(p));
  });
  return span;
}
