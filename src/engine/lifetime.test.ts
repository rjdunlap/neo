import { describe, expect, it, vi } from 'vitest';
import { Lifetime } from './lifetime';

describe('round lifetime', () => {
  it('marks the round dead before releasing resources, in reverse order, exactly once', () => {
    const lifetime = new Lifetime();
    const calls: string[] = [];
    lifetime.own(() => { expect(lifetime.alive).toBe(false); calls.push('texture'); });
    lifetime.own(() => calls.push('drag'));
    expect(lifetime.alive).toBe(true);
    lifetime.destroy();
    lifetime.destroy();
    expect(calls).toEqual(['drag', 'texture']);
  });

  it('releases early without retaining or repeating the cleanup', () => {
    const lifetime = new Lifetime();
    const cleanup = vi.fn();
    const release = lifetime.own(cleanup);
    release(); release(); lifetime.destroy();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('releases resources registered by a late continuation immediately', () => {
    const lifetime = new Lifetime();
    lifetime.destroy();
    const cleanup = vi.fn();
    lifetime.own(cleanup)();
    expect(cleanup).toHaveBeenCalledTimes(1);
    const target = new EventTarget();
    const listener = vi.fn();
    lifetime.listen(target, 'late', listener);
    target.dispatchEvent(new Event('late'));
    expect(listener).not.toHaveBeenCalled();
  });

  it('removes listeners on release and destruction, preserving capture and listener objects', () => {
    const lifetime = new Lifetime();
    const target = new EventTarget();
    const remove = vi.spyOn(target, 'removeEventListener');
    const first = vi.fn();
    const second = { handleEvent: vi.fn() };
    const options = { capture: true };
    const release = lifetime.listen(target, 'touch', first, options);
    lifetime.listen(target, 'touch', second);
    target.dispatchEvent(new Event('touch'));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second.handleEvent).toHaveBeenCalledTimes(1);
    options.capture = false;
    release(); lifetime.destroy();
    expect(remove).toHaveBeenCalledWith('touch', first, { capture: true });
    expect(remove).toHaveBeenCalledWith('touch', second, { capture: false });
    target.dispatchEvent(new Event('touch'));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second.handleEvent).toHaveBeenCalledTimes(1);
  });

  it('keeps simultaneous games and successive demo rounds independent', () => {
    const round = new Lifetime();
    const demo = new Lifetime();
    const target = new EventTarget();
    const actual = vi.fn(), pretend = vi.fn(), replay = vi.fn();
    round.listen(target, 'touch', actual);
    demo.listen(target, 'touch', pretend);
    demo.destroy();
    const nextDemo = new Lifetime();
    nextDemo.listen(target, 'touch', replay);
    target.dispatchEvent(new Event('touch'));
    expect(actual).toHaveBeenCalledTimes(1);
    expect(pretend).not.toHaveBeenCalled();
    expect(replay).toHaveBeenCalledTimes(1);
    round.destroy(); nextDemo.destroy();
    target.dispatchEvent(new Event('touch'));
    expect(actual).toHaveBeenCalledTimes(1);
    expect(replay).toHaveBeenCalledTimes(1);
  });

  it('finishes all cleanups even if one fails', () => {
    const lifetime = new Lifetime();
    const cleanup = vi.fn();
    lifetime.own(cleanup);
    lifetime.own(() => { throw new Error('failed resource'); });
    expect(() => lifetime.destroy()).toThrow(AggregateError);
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(lifetime.alive).toBe(false);
    lifetime.destroy();
  });
});
