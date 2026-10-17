import type { Origin, Routes } from './App';
import type { Band } from '../progress/bands';

export type DiscoveryToken = { owner: object; epoch: number };

/** Per-profile visit memory. Replacing a save (switch/reset/restore/undo) invalidates its callbacks too. */
export class DiscoveryMemory {
  private owner?: object;
  private epoch = 0;
  last?: string;

  clear() { this.owner = undefined; this.last = undefined; this.epoch++; }
  token(owner: object): DiscoveryToken {
    if (owner !== this.owner) { this.clear(); this.owner = owner; }
    return { owner, epoch: this.epoch };
  }
  current(token: DiscoveryToken, owner: object): boolean {
    return token.owner === owner && token.owner === this.owner && token.epoch === this.epoch;
  }
  displayed(token: DiscoveryToken, owner: object, id: string): void {
    if (this.current(token, owner)) this.last = id;
  }
}
export const discoveryMemory = new DiscoveryMemory();

/** The ordinary route resolves the current band, ordered range and pin; no cached level or Again shortcut. */
export function launchDiscovery(go: Pick<Routes, 'game'>, id: string, band: Band, origin?: Origin) {
  go.game(id, band, undefined, false, origin);
}
