/** Browser-like capture removal and inspectable listeners for DOM-free lifecycle tests. */
export class BrowserEventTarget extends EventTarget {
  private readonly listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  private key(type: string, options?: EventListenerOptions | boolean) {
    return `${type}:${typeof options === 'boolean' ? options : !!options?.capture}`;
  }
  override addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean) {
    super.addEventListener(type, callback, options);
    if (callback) {
      const key = this.key(type, options);
      const list = this.listeners.get(key) ?? new Set();
      list.add(callback);
      this.listeners.set(key, list);
    }
  }
  override removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean) {
    // Some Node versions do not normalize boolean capture on removal as browsers do.
    super.removeEventListener(type, callback, typeof options === 'boolean' ? { capture: options } : options);
    if (callback) this.listeners.get(this.key(type, options))?.delete(callback);
  }
  listenerCount(type: string) {
    return (this.listeners.get(`${type}:true`)?.size ?? 0) + (this.listeners.get(`${type}:false`)?.size ?? 0);
  }
}
