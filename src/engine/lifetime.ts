/** Round-owned resources. Releasing early unregisters the cleanup; destroying runs the rest once, last owned first. */
export interface LifetimeContext {
  /** False before cleanup starts. Check after callbacks or awaits that the game schedules itself. */
  readonly alive: boolean;
  /** Register cleanup (for example, () => drag.destroy()). Returns an idempotent early release. */
  own(cleanup: () => void): () => void;
  /** Listen until release or round destruction. Native capture/passive/once options are preserved. */
  listen<K extends keyof WindowEventMap>(target: Window, type: K, listener: (event: WindowEventMap[K]) => void, options?: boolean | AddEventListenerOptions): () => void;
  listen(target: EventTarget, type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): () => void;
}

/** One per actual game instance, including each replay of a demonstration. */
export class Lifetime implements LifetimeContext {
  private live = true;
  private readonly cleanups = new Set<() => void>();

  get alive() { return this.live; }

  readonly own = (cleanup: () => void): (() => void) => {
    let pending = true;
    const release = () => {
      if (!pending) return;
      pending = false;
      this.cleanups.delete(release);
      cleanup();
    };
    if (this.live) this.cleanups.add(release);
    else release();
    return release;
  };

  listen<K extends keyof WindowEventMap>(target: Window, type: K, listener: (event: WindowEventMap[K]) => void, options?: boolean | AddEventListenerOptions): () => void;
  listen(target: EventTarget, type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): () => void;
  listen(target: EventTarget, type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): () => void {
    if (!this.live) return () => {};
    // Snapshot capture: mutating the caller's options later must not prevent removal.
    const capture = typeof options === 'boolean' ? options : options?.capture ?? false;
    target.addEventListener(type, listener, options);
    return this.own(() => target.removeEventListener(type, listener, { capture }));
  }

  destroy() {
    if (!this.live) return;
    this.live = false;
    const errors: unknown[] = [];
    for (const release of [...this.cleanups].reverse()) {
      try { release(); } catch (error) { errors.push(error); }
    }
    if (errors.length) throw new AggregateError(errors, 'Round cleanup failed');
  }
}
