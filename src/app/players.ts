import { store } from '../progress/store';
import { forgetJournalPage } from './scenes/JournalScene';
import { forgetPlaces } from './scenes/PlaceScene';
import { forgetSubjects } from './scenes/SubjectPlaceScene';
import { applySettings } from './settings';

/**
 * The one place a different player becomes the active one. The save is swapped by the store (which first writes the pending
 * save of the player it leaves); this pushes the new player's sound and names into the audio and voice systems and forgets
 * what the screens remembered for the last one. The caller then shows a fresh scene, since scenes read the pet and band
 * when they are built.
 */
export async function selectPlayer(id: string): Promise<boolean> {
  const was = store.activeId;
  if (!(await store.switchTo(id))) return false;
  if (store.activeId !== was) playerChanged();
  else applySettings();
  return true;
}

/** Whoever is active just changed (a switch, or the active player was removed or restored): forget the last one's place. */
export function playerChanged() {
  forgetPlaces();
  forgetSubjects();
  forgetJournalPage();
  applySettings();
}
