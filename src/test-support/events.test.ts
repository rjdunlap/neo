import { expect, it, vi } from 'vitest';
import { BrowserEventTarget } from './events';

it('removes capture listeners with the boolean syntax accepted by browsers', () => {
  const target = new BrowserEventTarget();
  const capture = vi.fn(), bubble = vi.fn();
  target.addEventListener('pointercancel', capture, true);
  target.addEventListener('pointercancel', bubble);
  target.removeEventListener('pointercancel', capture, true);
  target.dispatchEvent(new Event('pointercancel'));
  expect(capture).not.toHaveBeenCalled();
  expect(bubble).toHaveBeenCalledOnce();
});
