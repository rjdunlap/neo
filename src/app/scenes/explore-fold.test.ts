import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Container } from 'pixi.js';
vi.mock('../../audio/voice', () => ({
  voice: { stop: vi.fn(), say: vi.fn(async () => {}), unlock: vi.fn() },
}));
vi.mock('../../audio/music', async (real) => ({
  ...(await real<object>()),
  music: { play: vi.fn(), stop: vi.fn() },
}));
// Text can't be measured without a canvas; a card's name pill only needs a place.
vi.mock('../../ui/text', async (real) => {
  const { Container } = await import('pixi.js');
  return { ...(await real<object>()), label: () => new Container(), namePill: () => new Container() };
});
vi.mock('../../audio/sfx', () => ({ sfx: new Proxy({}, { get: () => () => {} }) }));
import { voice } from '../../audio/voice';
import { computeView } from '../../engine/view';
import { defaults } from '../../progress/save';
import { store } from '../../progress/store';
import { sceneFixture } from '../../test-support/scenes';
import { ExploreScene } from './ExploreScene';

/**
 * U6b, the fold (docs/definitions/one-way-to-browse.md): Explore's entries lose All games, Little surprises stands first
 * at lap and toddler, Family play goes straight to couch play, and an empty Favorites shows the heart beside the Arcade.
 */

const keep = sceneFixture();

function fakeApp() {
  const go: Record<string, ReturnType<typeof vi.fn>> = {};
  return {
    go: new Proxy(go, { get: (t, k: string) => (t[k] ??= vi.fn()) }),
    calls: () => Object.entries(go).filter(([, f]) => f.mock.calls.length),
    view: computeView(1024, 768),
    creatureWorld: true,
    scene: null as unknown,
    paused: false,
  };
}
const fakeEl = (): unknown =>
  new Proxy(
    Object.assign(new EventTarget(), { style: {}, classList: { add() {}, remove() {}, toggle() {} } }),
    {
      get: (t, k) =>
        k in t
          ? (t as never)[k]
          : typeof k === 'string' && /^(set|remove|append|query|get)/.test(k)
            ? () => fakeEl()
            : undefined,
      set: (t, k, v) => (((t as unknown as Record<PropertyKey, unknown>)[k] = v), true),
    },
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('window', Object.assign(new EventTarget(), { setTimeout, clearTimeout }));
  vi.stubGlobal(
    'document',
    Object.assign(new EventTarget(), { createElement: fakeEl, body: fakeEl(), querySelector: () => null }),
  );
  store.data = defaults();
  store.data.profile.band = 'preschool';
});

afterEach(async () => {
  await keep.cleanup();
  vi.unstubAllGlobals();
});

/** Builds the scene, taps the card `pick` finds (taps act on touch-down), and returns the one route it called. */
async function tapCard(entry: 'favorites' | null, pick: (s: ExploreScene) => Container | undefined) {
  const app = fakeApp();
  const scene = keep(new ExploreScene(app as never, entry));
  app.scene = scene;
  scene.init();
  pick(scene)!.emit('pointerdown', { pointerId: 1 } as never);
  for (let t = 0; t < 12 && !app.calls().length; t++) {
    await new Promise((r) => setTimeout(r, 0));
    scene.tw.update(0.2);
  }
  expect(app.calls()).toHaveLength(1);
  const [route, f] = app.calls()[0];
  return { route, args: f.mock.calls[0] };
}

const kinds = (s: ExploreScene) => s.cards.map((c) => (c.kind === 'entry' ? c.entry : c.kind));

describe('the fold (U6b)', () => {
  it('Explore holds Places, Favorites, Arcade and Family play, with Little surprises first only at lap and toddler', () => {
    const older = keep(new ExploreScene(fakeApp() as never));
    older.init();
    expect(kinds(older)).toEqual(['places', 'favorites', 'arcade', 'family']);
    expect(older.upright).toBe(true);
    for (const band of ['lap', 'toddler'] as const) {
      store.data.profile.band = band;
      const s = keep(new ExploreScene(fakeApp() as never));
      s.init();
      expect(kinds(s), band).toEqual(['mix', 'places', 'favorites', 'arcade', 'family']);
      // The mix's sheet and Make my mix's table are drawn on the 1024 width: this page keeps the turn prompt.
      expect(s.upright, band).toBe(false);
    }
  });

  it('Family play goes straight to couch play, whose Back returns to the entries', async () => {
    const r = await tapCard(
      null,
      (s) => s.cards.find((c) => c.kind === 'entry' && c.entry === 'family')?.node,
    );
    expect(r).toEqual({ route: 'couch', args: [false, { explore: 'family', page: 0 }] });
  });

  it('an empty Favorites shows the heart beside the Arcade, which opens on For me', async () => {
    store.data.favorites = [];
    const probe = keep(new ExploreScene(fakeApp() as never, 'favorites'));
    probe.init();
    expect(kinds(probe)).toEqual(['heart', 'arcade']);
    const r = await tapCard('favorites', (s) => s.cards[1].node);
    expect(r).toEqual({ route: 'explore', args: ['arcade', 0, 'mine'] });
  });

  it('the heart is a picture: a tap says the line again and goes nowhere', async () => {
    store.data.favorites = [];
    const app = fakeApp();
    const s = keep(new ExploreScene(app as never, 'favorites'));
    s.init();
    vi.mocked(voice.say).mockClear();
    s.cards[0].node.emit('pointerdown', { pointerId: 1 } as never);
    for (let t = 0; t < 4; t++) {
      await new Promise((r) => setTimeout(r, 0));
      s.tw.update(0.2);
    }
    expect(voice.say).toHaveBeenCalledWith('explore.no-favorites');
    expect(app.calls()).toEqual([]);
  });
});
