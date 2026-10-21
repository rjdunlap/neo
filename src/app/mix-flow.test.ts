import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaults } from '../progress/save';
import { store } from '../progress/store';
import { gameById } from '../games/registry';
import { GameScene } from './scenes/GameScene';
import { discoveryMemory, mixMemory } from './discovery';
import { MixHost } from './mix';
import { Container } from 'pixi.js';
import { Tweener } from '../engine/tween';
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
    syncMix: vi.fn(), stopRow: null,
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

describe('Little surprises stop cards (D3)', () => {
  const states = () => mixMemory.at(store.data, 'lap')!.items.map(i => i.state);
  it('the result\'s Home opens the next-up stop\'s card with cards on, and the sheet\'s home spot with them off', () => {
    store.data.settings.howToCards = true;
    const on = mixResult(0);
    mixMemory.finish(on.round, store.data, 5);
    on.scene.leave();
    expect(on.launched).toEqual([['sing-along-barn', 'lap', undefined, false, { place: 'lap' }]]);
    expect(on.places).toEqual([]);
    mixMemory.start(store.data, 'lap');
    store.data.settings.howToCards = false;
    const off = mixResult(0);
    mixMemory.finish(off.round, store.data, 5);
    off.scene.leave();
    expect([off.launched, off.places]).toEqual([[], ['lap']]);
  });
  it('the corner Home mid-round returns to the same stop\'s card while it is upcoming, and the ending once none remain', () => {
    store.data.settings.howToCards = true;
    mixMemory.apply(store.data, { type: 'skip', p: 0 });
    const mid = mixResult(1);
    mid.scene.finished = false;
    mid.scene.leave();
    expect(mid.launched.map(a => a[0])).toEqual(['sing-along-barn']);
    expect(mixMemory.claim(store.data)?.p).toBe(1);
    mixMemory.apply(store.data, { type: 'skip', p: 1 });
    const last = mixResult(2);
    mixMemory.finish(last.round, store.data, 5);
    last.scene.leave();
    expect([last.launched, last.places]).toEqual([[], ['lap']]);
  });
  it('Back on an upcoming stop\'s card ends the mix at the home spot, never the same card again', () => {
    store.data.settings.howToCards = true;
    const { scene, launched, places } = mixResult(0);
    scene.finished = false; scene.resultReady = false;
    scene.backFromIntro();
    expect([launched, places, mixMemory.live(store.data)]).toEqual([[], ['lap'], undefined]);
  });
  it('Skip on a card hops the shown stop once and opens the next stop\'s card, saying the hop first; on the last, the ending', () => {
    store.data.settings.howToCards = true;
    const first = mixResult(0);
    first.scene.finished = false;
    first.scene.skipFromCard(); first.scene.skipFromCard();
    expect(states()).toEqual(['skipped', 'upcoming', 'upcoming']);
    expect(first.launched).toEqual([['sing-along-barn', 'lap', undefined, false, { place: 'lap' }]]);
    expect(mixMemory.claim(store.data)).toMatchObject({ p: 1, lead: 'mix.skip' });
    mixMemory.apply(store.data, { type: 'skip', p: 1 });
    const last = mixResult(2);
    last.scene.finished = false;
    last.scene.skipFromCard();
    expect([last.launched, last.places, states()]).toEqual([[], ['lap'], ['skipped', 'skipped', 'skipped']]);
  });
  it('a played stop\'s card (Again from a result) has no Skip to give', () => {
    store.data.settings.howToCards = true;
    const first = mixResult(0);
    mixMemory.finish(first.round, store.data, 5);
    const again = mixResult(0);
    again.scene.finished = false;
    again.scene.skipFromCard();
    expect([again.launched, states()]).toEqual([[], ['played', 'upcoming', 'upcoming']]);
  });
  it('the mix spot launches stop 0\'s card with cards on, and the home spot opens only the ending', () => {
    store.data.settings.howToCards = true;
    mixMemory.end();
    const launched: unknown[][] = [];
    const app = { go: { game: (...args: unknown[]) => launched.push(args) } };
    const view = () => ({ w: 1024, h: 768, scale: 1 });
    const host = new MixHost(app as never, 'lap', new Container(), view as never, new Tweener(), []);
    host.start();
    expect(launched).toEqual([['bubble-pop', 'lap', undefined, false, { place: 'lap' }]]);
    expect([host.sheet, mixMemory.claim(store.data)?.p]).toEqual([null, 0]);
    const back = new MixHost(app as never, 'lap', new Container(), view as never, new Tweener(), []);
    back.resume();
    expect(back.sheet).toBeNull();
  });
});
