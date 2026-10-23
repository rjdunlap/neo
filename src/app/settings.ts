import { audio } from '../audio/engine';
import { voice } from '../audio/voice';
import { store } from '../progress/store';
import { SPECIES } from '../creatures/species';

/** Pushes saved settings into the audio and voice systems. */
export function applySettings() {
  const s = store.data.settings;
  audio.setVolume(s.volume);
  audio.setMusicOn(s.music);
  voice.enabled = s.speech;
  if (!s.speech) voice.stop();
  voice.name = store.data.profile.name.trim();
  // Every {pet} line speaks the companion's name; before the first friend hatches, the sprout's first name.
  voice.pet = store.companion?.name ?? SPECIES.sprout.names[0];
}
