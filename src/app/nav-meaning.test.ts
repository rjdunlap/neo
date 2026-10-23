import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Container } from 'pixi.js';
vi.mock('../audio/voice', () => ({ voice: { stop: vi.fn(), say: vi.fn(async () => {}), unlock: vi.fn() } }));
vi.mock('../audio/music', async (real) => ({ ...(await real<object>()), music: { play: vi.fn(), stop: vi.fn() } }));
import { voice } from '../audio/voice';
import { computeView } from '../engine/view';
import { gameById } from '../games/registry';
import { defaults } from '../progress/save';
import { store } from '../progress/store';
import type { Meaning } from '../ui/origin-art';
import type { Origin } from './App';
import { ExploreScene } from './scenes/ExploreScene';
import { GameScene } from './scenes/GameScene';
import { HOUSE_X } from './scenes/LandScene';
import { LibraryScene } from './scenes/LibraryScene';
import { LocationScene } from './scenes/LocationScene';
import { PlayScene } from './scenes/PlayScene';

/**
 * RW14 slice 3, one meaning per button: at the root every house goes Home (`go.hub()`) and every back arrow goes to
 * whatever opened the screen, as the RW03 route table (docs/rework/HOME-NAVIGATION.md#routes-and-meaning) says. Each
 * screen is built fresh for each of its marked buttons, which is pressed as a tap or a completed hold would.
 */

type Pressable = Container & { meaning?: Meaning | null; press(): void };
const ROUTES = ['hub', 'explore', 'land', 'place', 'journal', 'library', 'room', 'project', 'picnic', 'woodland', 'stickers', 'game', 'start'] as const;
type App = ReturnType<typeof fakeApp>;

function fakeApp() {
  const go = Object.fromEntries(ROUTES.map((r) => [r, vi.fn()])) as Record<(typeof ROUTES)[number], ReturnType<typeof vi.fn>>;
  return { go, view: computeView(1024, 768), creatureWorld: true, scene: null as unknown, paused: false };
}

/** The scene's marked Home and Back buttons, in field order. */
const marked = (scene: object): Pressable[] => Object.values(scene).filter((v): v is Pressable => !!v && typeof v === 'object' && !!(v as Pressable).meaning);

async function walk(make: (app: App) => object & { tw?: { update(dt: number): void } }, buttons: (scene: object) => Pressable[] = marked) {
  const count = buttons(make(fakeApp())).length;
  const calls: { meaning: Meaning; route: string; args: unknown[] }[] = [];
  for (let i = 0; i < count; i++) {
    const app = fakeApp();
    const scene = make(app);
    app.scene = scene;
    const b = buttons(scene)[i];
    b.press();
    for (let t = 0; t < 12 && !ROUTES.some((r) => app.go[r].mock.calls.length); t++) {
      await new Promise((r) => setTimeout(r, 0));
      scene.tw?.update(0.2);
    }
    const called = ROUTES.filter((r) => app.go[r].mock.calls.length);
    expect(called, `${b.meaning} calls one route`).toHaveLength(1);
    calls.push({ meaning: b.meaning!, route: called[0], args: app.go[called[0]].mock.calls[0] });
  }
  return calls;
}

const expectOneMeaning = (calls: Awaited<ReturnType<typeof walk>>, back: { route: string; args?: unknown[] }) => {
  expect(calls.map((c) => c.meaning).filter((m) => m === 'back')).toHaveLength(1);
  for (const c of calls) {
    if (c.meaning === 'home') expect(c).toMatchObject({ route: 'hub', args: [] });
    else expect(c).toMatchObject(back);
  }
};

beforeEach(() => {
  vi.stubGlobal('window', Object.assign(new EventTarget(), { setTimeout, clearTimeout }));
  vi.stubGlobal('document', new EventTarget());
  store.data = defaults();
  store.data.profile.band = 'preschool';
});

describe('one meaning per button at the root (RW14 slice 3)', () => {
  it('creature play: Back and the house both go Home, which opened it', async () => {
    expectOneMeaning(await walk((app) => new PlayScene(app as never)), { route: 'hub' });
  });

  it('Explore and each of its pages: the house goes Home, Back goes up one level', async () => {
    expectOneMeaning(await walk((app) => new ExploreScene(app as never)), { route: 'hub' });
    for (const entry of ['places', 'favorites', 'all', 'family'] as const) {
      const calls = await walk((app) => new ExploreScene(app as never, entry));
      expect(calls.map((c) => c.meaning).sort()).toEqual(['back', 'home']);
      expectOneMeaning(calls, { route: 'explore', args: [] });
    }
  });

  it('the library: Back goes to creature play, the house goes Home', async () => {
    expectOneMeaning(await walk((app) => new LibraryScene(app as never)), { route: 'room' });
  });

  it('a location: Back goes to Places and says so, the house beside it goes Home', async () => {
    const calls = await walk((app) => new LocationScene(app as never, 'rainbow-meadow', () => (app.go.explore as (e: string) => void)('places')));
    expect(calls).toEqual([
      { meaning: 'back', route: 'explore', args: ['places'] },
      { meaning: 'home', route: 'hub', args: [] },
    ]);
    expect(voice.say).toHaveBeenCalledWith('result.back', { place: 'Places' });
    expect(voice.say).toHaveBeenCalledWith('nav.home');
  });

  it('a location\'s house stands beside Back, at least 100 units across, clear of Back and the heading', () => {
    const s = new LocationScene(fakeApp() as never, 'counting-cove', () => undefined);
    const r = s.house!.radius;
    expect(r * 2).toBeGreaterThanOrEqual(100);
    // Every view is at least 1024 wide, so the heading's 380 keeps clear of the house's hit circle.
    expect(HOUSE_X + r + 14).toBeLessThanOrEqual(1024 / 2 - 190);
    expect(HOUSE_X - r - 14).toBeGreaterThanOrEqual(65 + s.home.radius);
    for (const v of [computeView(1024, 768), computeView(768, 1024), computeView(844, 390), computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 })]) expect(v.w).toBeGreaterThanOrEqual(1024);
  });

  it('a round: its hold-to-leave is a back arrow to its origin, never a house', async () => {
    const mod = gameById('bubble-pop')!;
    for (const [origin, route, args] of [
      [{ land: 'bubble-beach' }, 'land', ['bubble-beach']],
      [{ explore: 'all', page: 1, others: false }, 'explore', ['all', 1, false]],
      [{ library: true }, 'library', []],
    ] as [Origin, string, unknown[]][]) {
      const calls = await walk((app) => new GameScene(app as never, mod, 'lap', undefined, false, origin), (s) => [(s as unknown as { home: Pressable }).home]);
      expect(calls).toEqual([{ meaning: 'back', route, args }]);
    }
  });

  it('a result: Back to the origin, the house Home; with no named origin a plain Back, and a story\'s basket to its page', async () => {
    const mod = gameById('bubble-pop')!;
    const result = (origin?: Origin, story?: unknown) => (app: App) => new GameScene(app as never, mod, 'lap', story as never, false, origin);
    const ways = (s: object) => {
      const { home, house } = (s as GameScene).resultWayOut();
      return [home, ...(house ? [house] : [])] as Pressable[];
    };
    expectOneMeaning(await walk(result({ land: 'counting-cove' }), ways), { route: 'land', args: ['counting-cove'] });
    expect(voice.say).toHaveBeenCalledWith('result.back', { place: 'Counting Cove' });
    expectOneMeaning(await walk(result({ explore: 'favorites', page: 0 }), ways), { route: 'explore', args: ['favorites', 0, undefined] });
    // No origin: Back to All games (`placeAtRoot` through `go.place`), and no house that would mean anything else.
    expect(await walk(result(), ways)).toEqual([{ meaning: 'back', route: 'place', args: ['preschool'] }]);
    expect(await walk(result(undefined, { project: 'welcome', step: 'meet', level: 1 }), ways)).toEqual([expect.objectContaining({ meaning: 'back', route: 'project' })]);
  });

  it('a game\'s how-to card: Back goes to the origin and says its name', async () => {
    const app = fakeApp();
    const s = new GameScene(app as never, gameById('bubble-pop')!, 'lap', undefined, false, { land: 'counting-cove' });
    app.scene = s;
    (s as unknown as { backFromIntro(): void }).backFromIntro();
    await new Promise((r) => setTimeout(r, 0));
    expect(app.go.land).toHaveBeenCalledWith('counting-cove');
    expect(app.go.hub).not.toHaveBeenCalled();
    expect(voice.say).toHaveBeenCalledWith('result.back', { place: 'Counting Cove' });
  });

  it('on the island nothing is marked: classic keeps its buttons', () => {
    const app = { ...fakeApp(), creatureWorld: false };
    const s = new GameScene(app as never, gameById('bubble-pop')!, 'lap', undefined, false, { land: 'counting-cove' });
    expect(s.resultWayOut().home.meaning).toBeNull();
    expect(s.resultWayOut().house).toBeNull();
    expect((s as unknown as { home: Pressable }).home.meaning).toBeNull();
  });
});
