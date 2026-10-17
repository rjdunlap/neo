import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Container, type FederatedPointerEvent } from 'pixi.js';
import { DiscoveryTile } from './discovery';
vi.mock('../audio/sfx', () => ({ sfx: { tick: vi.fn() } }));
beforeEach(() => { vi.stubGlobal('window', new EventTarget()); });
afterEach(() => vi.unstubAllGlobals());
const pointer = (id = 1, x = 50, y = 50) => ({ pointerId: id, global: { x, y } }) as FederatedPointerEvent;

describe('pictured result release control', () => {
  it('requires a fresh down/up, does not act while held, and ignores other fingers or a stray release', () => {
    const run = vi.fn(), tile = new DiscoveryTile(288, 112, new Container(), run, () => true);
    tile.emit('pointerup', pointer()); expect(run).not.toHaveBeenCalled();
    tile.emit('pointerdown', pointer()); expect(run).not.toHaveBeenCalled();
    tile.emit('pointerup', pointer(2)); expect(run).not.toHaveBeenCalled();
    tile.destroy({ children: true });
    const second = new DiscoveryTile(288, 112, new Container(), run, () => true);
    second.emit('pointerdown', pointer()); second.emit('pointerup', pointer()); second.emit('pointerup', pointer());
    expect(run).toHaveBeenCalledOnce(); second.destroy({ children: true });
  });
  it.each(['pointercancel', 'pointerupoutside', 'pointerout', 'blur'])('cancels on %s and cannot carry a held touch into another screen', event => {
    const run = vi.fn(), tile = new DiscoveryTile(112, 112, new Container(), run, () => true);
    tile.emit('pointerdown', pointer());
    if (event === 'blur') window.dispatchEvent(new Event('blur')); else tile.emit(event, pointer());
    tile.emit('pointerup', pointer()); expect(run).not.toHaveBeenCalled(); tile.destroy({ children: true });
  });
  it.each(['pointercancel', 'lostpointercapture', 'pointerup'])('clears a native %s even when Pixi does not deliver it', event => {
    const run = vi.fn(), tile = new DiscoveryTile(112, 112, new Container(), run, () => true);
    tile.emit('pointerdown', pointer());
    window.dispatchEvent(Object.assign(new Event(event), { pointerId: 1 }));
    tile.emit('pointerup', pointer()); expect(run).not.toHaveBeenCalled(); tile.destroy({ children: true });
  });
  it('revalidates on release and keeps its whole target over 100 units without scaling', () => {
    let valid = true;
    const run = vi.fn(), tile = new DiscoveryTile(288, 112, new Container(), run, () => valid);
    tile.emit('pointerdown', pointer()); valid = false; tile.emit('pointerup', pointer());
    expect(run).not.toHaveBeenCalled();
    expect(tile.scale.x).toBe(1); expect(tile.hitArea?.contains(287, 111)).toBe(true); tile.destroy({ children: true });
  });
});
