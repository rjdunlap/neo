import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaults } from '../progress/save';
import { store } from '../progress/store';
import { gameById } from '../games/registry';
import { GameScene } from './scenes/GameScene';
import { discoveryMemory, mixMemory } from './discovery';
vi.mock('../audio/voice', () => ({ voice: { stop: vi.fn(), say: vi.fn(async () => {}) } }));

// The real result callbacks of a mix round, without a renderer: a scene that has claimed stop `p`'s round.
function mixResult(p = 0) {
  const round = mixMemory.launch(store.data, p)!;
  const launched: unknown[][] = [];
  const places: unknown[] = [];
  const scene = Object.assign(Object.create(GameScene.prototype), {
    mod: gameById(['bubble-pop', 'sing-along-barn', 'fill-dump'][p]), band: 'lap', gone: false, navigating: false, resultReady: true,
    returningTouch: false, inputInUse: { kind: 'touch' }, discoveryToken: discoveryMemory.token(store.data), speechSerial: 0,
    origin: { place: 'lap' }, mixRound: mixMemory.claim(store.data), finished: true, resultSpeech: Promise.resolve(),
    syncMix: vi.fn(),
  });
  scene.app = { scene, paused: false, go: { game: (...args: unknown[]) => launched.push(args), place: (band: unknown) => places.push(band) } };
  return { scene, launched, places, round };
}
beforeEach(() => {
  store.data = defaults(); store.data.profile.band = 'lap';
  discoveryMemory.clear(); mixMemory.end(); mixMemory.start(store.data, 'lap');
});

describe('Little surprises result callbacks', () => {
  it('suppresses D1b inside a mix and holds the mix only for the current round', () => {
    const { scene } = mixResult(0);
    expect(scene.candidates()).toEqual([]);
    expect(scene.holdsMix()).toBe(true);
    mixMemory.launch(store.data, 0); // Again made a newer round
    expect(scene.holdsMix()).toBe(false);
  });
  it('Next stop launches the next upcoming stop once at the home spot, resolving the band at the press', () => {
    const { scene, launched, round } = mixResult(0);
    mixMemory.finish(round, store.data, 5);
    scene.chooseMixNext(); scene.chooseMixNext();
    expect(launched).toEqual([['sing-along-barn', 'lap', undefined, false, { place: 'lap' }]]);
    expect(mixMemory.claim(store.data)?.p).toBe(1);
  });
  it('Skip on the result hops over the shown next stop; All done goes to the ending on the home spot', () => {
    const { scene, places, round } = mixResult(0);
    mixMemory.finish(round, store.data, 5);
    scene.skipMixNext();
    expect(mixMemory.at(store.data, 'lap')!.items.map(i => i.state)).toEqual(['played', 'skipped', 'upcoming']);
    scene.skipMixNext();
    scene.chooseMixNext();
    expect(places).toEqual(['lap']);
  });
  it('the pause sheet skip keeps a played stop played and opens the next stop', () => {
    const first = mixResult(0);
    mixMemory.finish(first.round, store.data, 5);
    const replay = mixResult(0); // Again, abandoned through the pause sheet
    replay.scene.finished = false;
    replay.scene.skipFromPause();
    expect(mixMemory.at(store.data, 'lap')!.items[0]).toEqual({ state: 'played', seed: 5 });
    expect(replay.launched[0][0]).toBe('sing-along-barn');
  });
  it('ignores late presses after the save is replaced or the mix has ended', () => {
    const { scene, launched } = mixResult(0);
    mixMemory.end();
    scene.chooseMixNext(); scene.skipMixNext();
    store.data = defaults();
    scene.skipFromPause();
    expect(launched).toEqual([]);
  });
});
