/** How long the gear is held before the grown-ups' page opens. */
export const GEAR_HOLD_SECONDS = 2;
/** A child who taps it hears the "ask a grown-up" line at most this often. */
const SHORT_REPEAT_MS = 6000;
const HINT_MS = 2600;

export interface GearOptions {
  /** Called once the gear has been held long enough. */
  onOpen: () => void;
  /** A press ended early: say who this is for. Rate limited, so mashing it is not a chorus. */
  onShort?: () => void;
  /** Sits inside a sheet instead of fixed to the top-right corner. */
  inline?: boolean;
}

export interface Gear {
  readonly el: HTMLButtonElement;
  /** Takes it off the screen without removing it, e.g. while the map zooms into a place. */
  hide(on: boolean): void;
  /** Removes it and stops any hold in progress. */
  destroy(): void;
}

/** An eight-toothed gear with a hole, as one even-odd path in a 24-unit box. */
function gearPath(teeth = 8, outer = 11, inner = 8.4, hole = 3.4): string {
  const pitch = (Math.PI * 2) / teeth;
  const pts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const mid = i * pitch;
    for (const [a, r] of [[-0.3, inner], [-0.17, outer], [0.17, outer], [0.3, inner]] as const) {
      const t = mid + a * pitch;
      pts.push(`${(Math.cos(t) * r).toFixed(2)} ${(Math.sin(t) * r).toFixed(2)}`);
    }
  }
  return `M${pts.join('L')}ZM${hole} 0a${hole} ${hole} 0 1 0 ${-hole * 2} 0a${hole} ${hole} 0 1 0 ${hole * 2} 0Z`;
}

/**
 * The way into the grown-ups' page. It is plain HTML so a mouse, a keyboard and a finger all work: press and hold it
 * (or hold Enter or Space) for two seconds while a ring fills. Anything shorter only shows a hint. That is the whole
 * lock: it keeps a small hand from opening settings by accident, and nothing behind it can do lasting harm.
 */
export function gearButton({ onOpen, onShort, inline = false }: GearOptions): Gear {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = inline ? 'gear gear--inline' : 'gear';
  el.setAttribute('aria-label', `Grown-ups: press and hold for ${GEAR_HOLD_SECONDS} seconds to open settings`);
  el.innerHTML = `<span class="gear__ring"></span><svg viewBox="-12 -12 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="${gearPath()}"/></svg><span class="gear__hint" aria-hidden="true">Grown-ups: hold the gear</span>`;

  let timer = 0;
  let frame = 0;
  let hintTimer = 0;
  let startedAt = 0;
  let pointer = -1;
  let lastShort = 0;

  const paint = () => {
    const p = Math.min(1, (performance.now() - startedAt) / (GEAR_HOLD_SECONDS * 1000));
    el.style.setProperty('--p', p.toFixed(3));
    frame = requestAnimationFrame(paint);
  };

  const showHint = () => {
    el.classList.add('gear--hint');
    window.clearTimeout(hintTimer);
    hintTimer = window.setTimeout(() => el.classList.remove('gear--hint'), HINT_MS);
  };

  const begin = () => {
    if (timer) return;
    startedAt = performance.now();
    el.classList.add('gear--held');
    frame = requestAnimationFrame(paint);
    timer = window.setTimeout(() => {
      stop(false);
      onOpen();
    }, GEAR_HOLD_SECONDS * 1000);
  };

  /** Ends a hold. `early` is a release before the time was up, which shows the hint. */
  const stop = (early: boolean) => {
    if (!timer) return;
    window.clearTimeout(timer);
    cancelAnimationFrame(frame);
    timer = 0;
    el.classList.remove('gear--held');
    el.style.setProperty('--p', '0');
    if (!early) return;
    showHint();
    const now = performance.now();
    if (onShort && now - lastShort > SHORT_REPEAT_MS) {
      lastShort = now;
      onShort();
    }
  };

  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || pointer !== -1) return;
    pointer = e.pointerId;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // A pointer that has already gone: the release below never comes, and the hold times out as a short press.
    }
    begin();
  });
  const release = (e: PointerEvent) => {
    if (e.pointerId !== pointer) return;
    pointer = -1;
    stop(true);
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  el.addEventListener('lostpointercapture', release);

  const isActivation = (e: KeyboardEvent) => e.key === 'Enter' || e.key === ' ';
  el.addEventListener('keydown', (e) => {
    if (!isActivation(e)) return;
    e.preventDefault();
    if (!e.repeat) begin();
  });
  el.addEventListener('keyup', (e) => {
    if (!isActivation(e)) return;
    e.preventDefault();
    stop(true);
  });
  el.addEventListener('blur', () => stop(false));
  // A tap is not a hold, whatever sent it (an assistive technology's "activate" arrives as a click).
  el.addEventListener('click', (e) => {
    e.preventDefault();
    if (!timer && pointer === -1 && e.detail === 0) showHint();
  });
  el.addEventListener('contextmenu', (e) => e.preventDefault());

  return {
    el,
    hide: (on) => {
      el.hidden = on;
      if (on) stop(false);
    },
    destroy: () => {
      stop(false);
      window.clearTimeout(hintTimer);
      el.remove();
    },
  };
}
