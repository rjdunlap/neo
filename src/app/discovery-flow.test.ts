import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaults } from '../progress/save';
import { store } from '../progress/store';
import { gameById } from '../games/registry';
import { playBand } from '../progress/bands';
import { GameScene } from './scenes/GameScene';
import { discoveryMemory } from './discovery';
import { voice } from '../audio/voice';
vi.mock('../audio/voice', () => ({ voice: { stop: vi.fn(), say: vi.fn(async () => {}) } }));

// Exercise the real scene callbacks without constructing a renderer or celebrating a synthetic round.
function result() {
  const launched: { id: string; band: string; level: number; args: unknown[] }[] = [];
  const scene = Object.assign(Object.create(GameScene.prototype), {
    mod: gameById('bubble-pop'), band: 'lap', gone: false, navigating: false, resultReady: true,
    returningTouch: false, inputInUse: { kind: 'touch' }, discoveryToken: discoveryMemory.token(store.data),
    discovery: { id: 'sing-along-barn' }, speechSerial: 0, origin: { land: 'bubble-beach' },
  });
  scene.app = { scene, paused: false, go: { game: (...args: [string, Parameters<typeof playBand>[1]]) => {
    const mod = gameById(args[0])!, band = playBand(mod.bands, args[1]);
    launched.push({ id: mod.id, band, level: store.levelFor(mod.id, mod.levels(band), mod.entryLevels), args });
  } } };
  return { scene, launched };
}
beforeEach(() => { store.data = defaults(); store.data.profile.band = 'lap'; discoveryMemory.clear(); });

describe('direct-next result callbacks', () => {
  it('resolves a changed target pin at press, preserves origin, and latches double presses', () => {
    const { scene, launched } = result();
    store.stats('sing-along-barn').pinned = 2;
    const before = JSON.stringify(store.data);
    scene.chooseDiscovery('sing-along-barn'); scene.chooseDiscovery('sing-along-barn');
    expect(launched).toEqual([{ id: 'sing-along-barn', band: 'lap', level: 2, args: ['sing-along-barn', 'lap', undefined, false, scene.origin] }]);
    expect(JSON.stringify(store.data)).toBe(before);
  });
  it('keeps Bubble Pop lap 15 and resolves toddler pins through the current route', () => {
    const { scene, launched } = result();
    scene.mod = gameById('sing-along-barn'); scene.discovery.id = 'bubble-pop';
    scene.chooseDiscovery('bubble-pop'); expect(launched[0].level).toBe(15);
    const second = result(); second.scene.mod = gameById('sing-along-barn'); second.scene.discovery.id = 'bubble-pop';
    second.scene.band = 'toddler'; store.data.profile.band = 'toddler'; store.stats('bubble-pop').pinned = 5;
    second.scene.chooseDiscovery('bubble-pop'); expect(second.launched[0]).toMatchObject({ band: 'toddler', level: 5 });
  });
  it('recovers without launching a different target when the band or picture becomes invalid', () => {
    const { scene, launched } = result();
    scene.replaceDiscovery = vi.fn(); store.data.profile.band = 'toddler';
    scene.chooseDiscovery('sing-along-barn');
    expect(scene.replaceDiscovery).toHaveBeenCalledOnce(); expect(launched).toEqual([]); expect(scene.navigating).toBe(false);
    scene.chooseDiscovery('fill-dump'); expect(launched).toEqual([]);
  });
  it.each(['controller', 'returning', 'paused', 'gone', 'left', 'replaced', 'epoch'])('ignores %s callbacks, including a late finish', condition => {
    const { scene, launched } = result();
    if (condition === 'controller') scene.inputInUse.kind = 'controller';
    if (condition === 'returning') scene.returningTouch = true;
    if (condition === 'paused') scene.app.paused = true;
    if (condition === 'gone') scene.gone = true;
    if (condition === 'left') scene.app.scene = {};
    if (condition === 'replaced') store.data = defaults();
    if (condition === 'epoch') { discoveryMemory.clear(); discoveryMemory.token(store.data); }
    scene.chooseDiscovery('sing-along-barn'); expect(launched).toEqual([]);
    if (['gone', 'left', 'replaced', 'epoch'].includes(condition)) {
      const before = JSON.stringify(store.data); scene.finish({ misses: 0, hints: 0 }); expect(JSON.stringify(store.data)).toBe(before);
    }
  });
});

describe('discovery speech after ordinary result speech', () => {
  it('waits for result/Keep speech before naming a restored or changed offer', async () => {
    const { scene } = result(); let finish!: () => void;
    scene.resultSpeech = new Promise<void>(resolve => { finish = resolve; });
    vi.mocked(voice.say).mockClear();
    const pending = scene.queueDiscovery('discovery.offer', 'Barn', 'sing-along-barn');
    expect(voice.say).not.toHaveBeenCalled(); finish(); await pending;
    expect(voice.say).toHaveBeenCalledExactlyOnceWith('discovery.offer', { title: 'Barn' });
  });
  it('drops an obsolete announcement after another choice or a profile reset', async () => {
    for (const change of ['choice', 'reset']) {
      const { scene } = result(); let finish!: () => void;
      scene.resultSpeech = new Promise<void>(resolve => { finish = resolve; });
      vi.mocked(voice.say).mockClear();
      const pending = scene.queueDiscovery('discovery.offer', 'Barn', 'sing-along-barn');
      if (change === 'choice') scene.speechSerial++; else store.data = defaults();
      finish(); await pending; expect(voice.say).not.toHaveBeenCalled();
    }
  });
});
