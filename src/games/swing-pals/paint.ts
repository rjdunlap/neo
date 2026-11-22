import { swatch } from '../../art/palette';
import { PAINTING_MAX_MARKS, type PaintingCreation } from '../../content/creations';
import type { View } from '../../engine/view';
import { angleAt, BELL_ONE, HOOKS, period, seatAt, SETTLE, swingLayout, type Hook } from './logic';

export const PAPER_SPEED = 60;
export const ROLL_SECONDS = 24;
export const DRIP_MIN = 2;
export const HOOK_MOVE = 0.4;
const DRIPS_PER_SECOND = 12;
const PAPER_HALF = 180;
export const PAINT_COLOR: Record<Hook, number> = {
  short: swatch.purple.line,
  middle: swatch.red.line,
  long: swatch.blue.line,
};

export interface PaintSwing {
  hook: Hook;
  height: number;
  /** The last back point at which the height changed. */
  start: number;
}

export function paintHeight(swing: PaintSwing, t: number): number {
  return swing.height * SETTLE ** ((t - swing.start) / period(swing.hook));
}

export function paintPush(swing: PaintSwing, t: number): PaintSwing {
  const height = paintHeight(swing, t);
  return {
    hook: swing.hook,
    start: t,
    height: Math.min(BELL_ONE, (height >= DRIP_MIN ? height : 0) + BELL_ONE / 4),
  };
}

export function paintBack(swing: PaintSwing, t: number): number {
  if (paintHeight(swing, t) < DRIP_MIN) return t;
  const beat = period(swing.hook);
  return swing.start + Math.ceil((t - swing.start) / beat - 1e-9) * beat;
}

export function changeHook(swing: PaintSwing, hook: Hook, t: number): PaintSwing {
  if (swing.hook === hook) return swing;
  const height = paintHeight(swing, t);
  return { hook, height: height >= DRIP_MIN ? height : 0, start: t + HOOK_MOVE };
}

export function dripAt(layout: ReturnType<typeof paintLayout>, swing: PaintSwing, t: number): number {
  return seatAt(
    layout,
    layout.columns[0],
    swing.hook,
    angleAt(swing.hook, paintHeight(swing, t), swing.start, t),
  ).x;
}

interface Section {
  hook: Hook;
  start: number;
  seconds: number;
  dots: { time: number; across: number }[];
}

export interface Trace {
  seconds: number;
  sections: Section[];
  current: Section | null;
}

export const blankTrace = (): Trace => ({ seconds: 0, sections: [], current: null });

export function endSection(trace: Trace) {
  trace.current = null;
}

/** Sample along the paper at fixed distances, independent of frame rate. The roll doesn't advance during a move. */
export function paperStep(
  trace: Trace,
  layout: ReturnType<typeof paintLayout>,
  swing: PaintSwing,
  from: number,
  to: number,
) {
  if (trace.seconds >= ROLL_SECONDS || swing.height < DRIP_MIN) return;
  const start = Math.max(from, swing.start);
  const stop = swing.start + (Math.log(DRIP_MIN / swing.height) / Math.log(SETTLE)) * period(swing.hook);
  const dt = Math.min(to - start, stop - start, ROLL_SECONDS - trace.seconds);
  if (dt <= 0) return;
  const section = (trace.current ??= { hook: swing.hook, start: trace.seconds, seconds: 0, dots: [] });
  const advanced = trace.seconds + dt;
  const next = advanced > ROLL_SECONDS - 1e-8 ? ROLL_SECONDS : advanced;
  const first = Math.floor(trace.seconds * DRIPS_PER_SECOND + 1e-8) + 1;
  const last = Math.floor(next * DRIPS_PER_SECOND + 1e-8);
  for (let i = first; i <= last; i++) {
    const time = i / DRIPS_PER_SECOND;
    const across = (dripAt(layout, swing, start + time - trace.seconds) - layout.paper.x) / layout.paper.w;
    if (!section.dots.length) trace.sections.push(section);
    section.dots.push({ time, across });
  }
  section.seconds += dt;
  trace.seconds = next;
}

export function sections(trace: Trace) {
  return trace.sections.map(({ hook, seconds }) => ({
    hook,
    wiggles: Math.floor(seconds / period(hook) + 1e-8),
  }));
}

export function comparedHooks(trace: Trace): Hook[] {
  const painted = sections(trace);
  return HOOKS.filter((hook) => painted.some((s) => s.hook === hook && s.wiggles >= 2));
}

export const paintRows = (seconds: number) => (seconds * PAPER_SPEED > PAPER_HALF * 4 ? 2 : 1);

export function keptPainting(trace: Trace): PaintingCreation {
  const length = trace.seconds * PAPER_SPEED;
  const rows = paintRows(trace.seconds);
  const paperLength = Math.max(PAPER_HALF, length / rows);
  const paperWidth = PAPER_HALF * 2;
  const marks: PaintingCreation['marks'] = [];
  for (const section of trace.sections) {
    for (const dot of section.dots) {
      const distance = dot.time * PAPER_SPEED;
      const row = Math.min(rows - 1, Math.floor(distance / paperLength));
      marks.push({
        shape: 'dab',
        x: 0.02 + 0.96 * ((distance - row * paperLength) / paperLength),
        y: (row + 0.04 + 0.92 * (1 - dot.across)) / rows,
        r: 0.007,
        color: PAINT_COLOR[section.hook],
      });
    }
  }
  return {
    kind: 'picture',
    aspect: paperLength / (paperWidth * rows),
    marks: marks.slice(0, PAINTING_MAX_MARKS),
  };
}

export function paintLayout(v: View) {
  const seatY = v.h - 235;
  const layout = swingLayout(1, v, {
    seatY,
    left: 210,
    right: v.w - 150,
    maxScale: 440,
    shortShiftRatio: 0.22,
  });
  const col = layout.columns[0];
  const margin = layout.scale * 0.045;
  const left = seatAt(layout, col, 'long', -BELL_ONE).x - margin;
  const right = seatAt(layout, col, 'long', BELL_ONE).x + margin;
  return {
    ...layout,
    paper: { x: left, y: seatY + 38, w: right - left, h: 185 },
    tick: { x: v.w - 75, y: v.h - 75 },
  };
}
