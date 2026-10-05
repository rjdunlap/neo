import { audio } from '../audio/engine';
import { voice } from '../audio/voice';
import { store } from '../progress/store';

/** Pushes saved settings into the audio and voice systems. */
export function applySettings() {
  const s = store.data.settings;
  audio.setVolume(s.volume);
  audio.setMusicOn(s.music);
  voice.name = store.data.profile.name.trim();
}
