import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Circle, Container, Rectangle } from 'pixi.js';
vi.mock('../audio/voice', () => ({ voice: { stop: vi.fn(), say: vi.fn(async () => {}), unlock: vi.fn() } }));
vi.mock('../audio/music', async (real) => ({ ...(await real<object>()), music: { play: vi.fn(), stop: vi.fn() } }));
// Text can't be measured without a canvas; a card's name pill only needs a width.
vi.mock('./text', async (real) => { const { Container } = await import('pixi.js'); return { ...(await real<object>()), label: () => new Container() }; });
vi.mock('../audio/sfx', () => ({ sfx: new Proxy({}, { get: () => () => {} }) }));
import { swatch } from '../art/palette';
import { ExploreScene } from '../app/scenes/ExploreScene';
import { HomeScene } from '../app/scenes/HomeScene';
import { ACTION_RADIUS, CORNER_RADIUS, EXPLORE_CARD, PAGE_ARROW_RADIUS } from '../creatures/home-layout';
import { computeView } from '../engine/view';
import { defaults } from '../progress/save';
import { store } from '../progress/store';
import { HoldButton, RoundButton, SQUASH } from './buttons';

/**
 * RW14 slice 7, buttons and cards with a finish (docs/rework/POLISH.md#slice-7-buttons-and-cards-with-a-finish): the
 * finish changes how a control looks and how it moves, never where it can be touched. These are the hit areas the root's
 * buttons and cards had before the finish, and the squash that answers a finger as it lands.
 */

const fakeApp = () => ({ go: new Proxy({}, { get: () => vi.fn() }), view: computeView(1024, 768), creatureWorld: true, scene: null, paused: false });
const fakeEl = (): unknown => new Proxy(Object.assign(new EventTarget(), { style: {}, classList: { add() {}, remove() {}, toggle() {} } }), {
  get: (t, k) => (k in t ? (t as never)[k] : typeof k === 'string' && /^(set|remove|append|query|get)/.test(k) ? () => fakeEl() : undefined),
  set: (t, k, v) => ((t as unknown as Record<PropertyKey, unknown>)[k] = v, true),
});
const circle = (node: Container) => node.hitArea as Circle;
const touch = (node: Container) => node.emit('pointerdown', { pointerId: 1 } as never);

beforeEach(() => {
  vi.stubGlobal('window', Object.assign(new EventTarget(), { setTimeout, clearTimeout }));
  vi.stubGlobal('document', Object.assign(new EventTarget(), { createElement: fakeEl, body: fakeEl(), querySelector: () => null }));
  store.data = defaults();
  store.data.profile.band = 'preschool';
});

describe('buttons and cards with a finish (RW14 slice 7)', () => {
  it('a round button keeps its touch circle, 14 units past its face, and squashes the moment it is pressed', () => {
    for (const r of [CORNER_RADIUS, ACTION_RADIUS, PAGE_ARROW_RADIUS]) {
      const b = new RoundButton(new Container(), swatch.green, r, () => {});
      expect(circle(b)).toBeInstanceOf(Circle);
      expect([circle(b).x, circle(b).y, circle(b).radius]).toEqual([0, 0, r + 14]);
      b.press();
      expect([b.scale.x, b.scale.y]).toEqual([SQUASH.x, SQUASH.y]);
    }
  });

  it('a hold button keeps its touch circle and squashes on touch-down, before the hold completes', () => {
    const b = new HoldButton(new Container(), swatch.white, CORNER_RADIUS, 1, () => {});
    expect([circle(b).x, circle(b).y, circle(b).radius]).toEqual([0, 0, CORNER_RADIUS + 14]);
    touch(b);
    expect(b.scale.y).toBe(SQUASH.y);
    // The picture stays the button's second child, under the ring, so a scene can swap or scale it.
    const icon = new Container();
    b.setIcon(icon);
    expect(b.children[1]).toBe(icon);
    b.destroy();
  });

  it("Home's exits keep their touch circles at every band", () => {
    for (const band of ['toddler', 'preschool'] as const) {
      store.data.profile.band = band;
      const s = new HomeScene(fakeApp() as never);
      expect(circle(s.who).radius).toBe(CORNER_RADIUS + 14);
      for (const b of [s.play, s.explore]) if (b) expect(circle(b).radius).toBe(ACTION_RADIUS + 14);
      expect(s.explore.children[1]).toBeDefined();
    }
  });

  it("Explore's entries and Places' postcards keep their 150-unit squares and squash on touch-down", () => {
    for (const entry of [null, 'places'] as const) {
      const s = new ExploreScene(fakeApp() as never, entry);
      s.init();
      expect(s.cards.length).toBeGreaterThan(0);
      for (const c of s.cards) {
        const h = c.node.hitArea as Rectangle;
        expect(h).toBeInstanceOf(Rectangle);
        expect([h.x, h.y, h.width, h.height]).toEqual([-EXPLORE_CARD / 2, -EXPLORE_CARD / 2, EXPLORE_CARD, EXPLORE_CARD]);
      }
      expect(EXPLORE_CARD).toBe(150);
      for (const b of [s.back, s.home]) expect(circle(b).radius).toBe(CORNER_RADIUS + 14);
      touch(s.cards[0].node);
      expect([s.cards[0].node.scale.x, s.cards[0].node.scale.y]).toEqual([SQUASH.x, SQUASH.y]);
    }
  });
});
