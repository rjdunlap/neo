import { describe, expect, it } from 'vitest';
import { chooseVoice, voiceLabel, voiceQuality, type VoiceInfo } from './voice-choice';

const v = (name: string, voiceURI = name, lang = 'en-US', localService = true): VoiceInfo => ({ name, voiceURI, lang, localService });

describe('voice choice', () => {
  it('ranks Premium over Enhanced over a compact voice', () => {
    const compact = v('Samantha', 'com.apple.voice.compact.en-US.Samantha');
    const enhanced = v('Evan (Enhanced)', 'com.apple.voice.enhanced.en-US.Evan');
    const premium = v('Zoe (Premium)', 'com.apple.voice.premium.en-US.Zoe');
    expect(chooseVoice([compact, enhanced, premium])).toBe(premium);
    expect(chooseVoice([compact, enhanced])).toBe(enhanced);
  });

  it('tells two voices with the same name apart by the URI alone', () => {
    const compact = v('Samantha', 'com.apple.voice.compact.en-US.Samantha');
    const enhanced = v('Samantha', 'com.apple.voice.enhanced.en-US.Samantha');
    expect(chooseVoice([compact, enhanced])).toBe(enhanced);
    expect(chooseVoice([enhanced, compact])).toBe(enhanced);
    expect(voiceQuality(enhanced)).toBe('enhanced');
    expect(voiceQuality(compact)).toBe('standard');
  });

  it('a downloaded voice beats a friendlier name and the US accent', () => {
    const daniel = v('Daniel (Enhanced)', 'com.apple.voice.enhanced.en-GB.Daniel', 'en-GB');
    expect(chooseVoice([v('Samantha'), daniel])).toBe(daniel);
  });

  it('prefers a voice on the device to an online one, so speech works offline', () => {
    const online = v('Microsoft Aria Online (Natural) - English (United States)', 'aria', 'en-US', false);
    const local = v('Samantha');
    expect(chooseVoice([online, local])).toBe(local);
  });

  it('never picks a novelty or Eloquence voice while a plain English voice exists', () => {
    const odd = ['Bells', 'Bad News', 'Zarvox', 'Whisper', 'Jester', 'Eddy (English (US))', 'Grandma (English (US))', 'Rocko (English (UK))', 'Fred'].map((n) => v(n));
    const plain = v('Moira', 'Moira', 'en-IE');
    expect(chooseVoice([...odd, plain])).toBe(plain);
    expect(chooseVoice([v('Bells'), v('Zarvox')])).toBeNull();
  });

  it('only English voices, with either separator', () => {
    expect(chooseVoice([v('Amélie (Premium)', 'x', 'fr-CA'), v('Thomas', 'y', 'fr-FR')])).toBeNull();
    const underscore = v('Karen', 'Karen', 'en_AU');
    expect(chooseVoice([v('Anna', 'a', 'de-DE'), underscore])).toBe(underscore);
  });

  it('returns null for no voices, leaving the device default', () => {
    expect(chooseVoice([])).toBeNull();
  });

  it('names the voice without its quality suffix', () => {
    expect(voiceLabel(v('Ava (Premium)'))).toBe('Ava');
    expect(voiceLabel(v('Samantha (Enhanced)'))).toBe('Samantha');
    expect(voiceLabel(v('Samantha'))).toBe('Samantha');
  });
});
