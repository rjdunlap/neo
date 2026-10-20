import { Assets, Container, Sprite, type Texture } from 'pixi.js';
import type { SpeciesId } from './creature';
import type { IllustratedCreature, Point } from './illustrated';

/**
 * RW06 prep (docs/rework/WORK-ITEMS.md#rw06-playable-home-and-customization): the nine generated
 * wearables (R04–R05) as prepared sprites, and how each sits on an illustrated species. An item is
 * one sprite (`wearables/<file>.png`, cut by `scripts/creature-art/prepare-sprite.mjs`; the commands
 * are in `wearables/README.md`); boots and mittens are one picture used twice. Each species records
 * per item either where it goes (`fits`) or why it does not (`misfit`); a misfit `redraw` means the
 * item was drawn at the wrong angle for that species and is asked for again (queue R19), otherwise
 * the species has no place for it. Separate from the Graphics `Accessory` kinds the RW02 rigs share.
 */
export const WEARABLES = ['crown', 'scarf', 'sunhat', 'sunglasses', 'raincoat', 'umbrella', 'beanie', 'boots', 'mittens'] as const;
export type WearableId = (typeof WEARABLES)[number];
type File = 'crown' | 'scarf' | 'sunhat' | 'sunglasses' | 'raincoat' | 'umbrella' | 'beanie' | 'boot' | 'mitten';

/** A prepared item sprite, in its own pixels: its size and the point that goes on the creature. */
export interface ItemArt {
  file: File;
  width: number;
  height: number;
  /** The item's own point placed on the fit's `at`: a ring's middle, a hat's band, a handle, a sole. */
  anchor: Point;
}

/** Sizes as `prepare-sprite.mjs --shrink 3` wrote them (a third of the 1254 px originals). */
export const ITEM_ART: Record<WearableId, ItemArt> = {
  crown: { file: 'crown', width: 412, height: 252, anchor: { x: 204, y: 118 } },
  scarf: { file: 'scarf', width: 369, height: 325, anchor: { x: 183, y: 88 } },
  sunhat: { file: 'sunhat', width: 422, height: 239, anchor: { x: 205, y: 145 } },
  sunglasses: { file: 'sunglasses', width: 416, height: 208, anchor: { x: 272, y: 118 } },
  raincoat: { file: 'raincoat', width: 380, height: 319, anchor: { x: 190, y: 38 } },
  umbrella: { file: 'umbrella', width: 408, height: 332, anchor: { x: 255, y: 255 } },
  beanie: { file: 'beanie', width: 358, height: 358, anchor: { x: 179, y: 300 } },
  boots: { file: 'boot', width: 192, height: 220, anchor: { x: 90, y: 205 } },
  mittens: { file: 'mitten', width: 205, height: 264, anchor: { x: 100, y: 150 } },
};

/** One placement: a sprite point on the creature, the item's width there in creature units, a turn, a mirror, and whether it goes behind the art. */
export interface Fit {
  at: Point;
  width: number;
  rotation?: number;
  flip?: boolean;
  behind?: boolean;
  /** The picture point whose mesh vertex it moves with, when not `at` (a crown above the head rides the head, not the leaves). */
  ride?: Point;
}
export type Fitting = { fits: readonly Fit[]; note?: string } | { misfit: string; redraw?: boolean };
export type WearTable = Readonly<Record<WearableId, Fitting>>;

export const fits = (f: Fitting): f is Extract<Fitting, { fits: readonly Fit[] }> => 'fits' in f;

const files = import.meta.glob<string>('./wearables/*.png', { query: '?url', import: 'default' });
let loading: Promise<Record<File, Texture>> | null = null;

/** Loads the nine item sprites once, mipmapped (they are drawn far below their size). */
export function loadWearables(): Promise<Record<File, Texture>> {
  loading ??= (async () => {
    const names = [...new Set(WEARABLES.map((w) => ITEM_ART[w].file))];
    const entries = await Promise.all(
      names.map(async (n) => {
        const load = files[`./wearables/${n}.png`];
        if (!load) throw new Error(`no prepared wearable ${n}`);
        const t = await Assets.load<Texture>(await load());
        t.source.autoGenerateMipmaps = true;
        t.source.updateMipmaps();
        return [n, t] as const;
      }),
    );
    return Object.fromEntries(entries) as Record<File, Texture>;
  })();
  return loading;
}

/** The item drawn for one placement: the sprite on its anchor, sized, turned and mirrored inside a node the rig moves. */
export function itemNode(id: WearableId, texture: Texture, fit: Fit): Container {
  const a = ITEM_ART[id];
  const node = new Container();
  const s = new Sprite(texture);
  s.anchor.set(a.anchor.x / a.width, a.anchor.y / a.height);
  const k = fit.width / a.width;
  s.scale.set(fit.flip ? -k : k, k);
  s.rotation = fit.rotation ?? 0;
  node.addChild(s);
  node.eventMode = 'none';
  return node;
}

/** Keeps what each creature wears, so a scene can dress and undress it by item. */
const worn = new WeakMap<IllustratedCreature, Map<WearableId, Container[]>>();

/** Puts an item on (or takes it off). False when the species does not wear it. */
export function wearItem(c: IllustratedCreature, table: WearTable, id: WearableId, texture: Texture | null): boolean {
  const mine = worn.get(c) ?? new Map<WearableId, Container[]>();
  worn.set(c, mine);
  for (const n of mine.get(id) ?? []) {
    c.unpin(n);
    n.destroy({ children: true });
  }
  mine.delete(id);
  if (!texture) return true;
  const f = table[id];
  if (!fits(f)) return false;
  const nodes = f.fits.map((fit) => {
    const n = itemNode(id, texture, fit);
    c.pin(n, fit.at, fit.behind, fit.ride);
    return n;
  });
  mine.set(id, nodes);
  return true;
}

export const wearingItem = (c: IllustratedCreature, id: WearableId) => !!worn.get(c)?.has(id);

/** Looks shown together in the preview, as Weather Wardrobe dresses for the weather. */
export const OUTFITS: { name: string; items: WearableId[] }[] = [
  { name: 'sunny', items: ['sunhat', 'sunglasses'] },
  { name: 'rainy', items: ['raincoat', 'umbrella', 'boots'] },
  { name: 'snowy', items: ['beanie', 'scarf', 'mittens'] },
];

export type WearTables = Record<SpeciesId, WearTable>;
