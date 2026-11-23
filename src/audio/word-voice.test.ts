import { describe, expect, it } from 'vitest';
import { exactLocalVoice } from './word-voice';

const v = (name: string, lang: string, localService = true, voiceURI = `uri.${name}`) => ({
  name,
  lang,
  localService,
  voiceURI,
});

describe('exactLocalVoice (WL2)', () => {
  it('takes only a local voice whose language is exactly pt-PT', () => {
    const voices = [
      v('Luciana', 'pt-BR'),
      v('Pt', 'pt'),
      v('Remote', 'pt-PT', false),
      v('Samantha', 'en-US'),
    ];
    expect(exactLocalVoice(voices, 'pt-PT')).toBeNull();
    expect(exactLocalVoice([...voices, v('Joana', 'pt-PT')], 'pt-PT')?.name).toBe('Joana');
  });

  it('compares the tag case-insensitively and reads Android underscores as the same tag', () => {
    expect(exactLocalVoice([v('A', 'PT-pt')], 'pt-PT')?.name).toBe('A');
    expect(exactLocalVoice([v('B', 'pt_PT')], 'pt-PT')?.name).toBe('B');
    for (const lang of ['pt-PT-x-lisbon', 'pt-PTx', 'ptPT', 'pt-BR', 'pt', ''])
      expect(exactLocalVoice([v('C', lang)], 'pt-PT')).toBeNull();
  });

  it('chooses the same voice whatever order the device lists them in: by name, then URI', () => {
    const list = [v('Joana', 'pt-PT', true, 'z'), v('Catarina', 'pt-PT'), v('Joana', 'pt-PT', true, 'a')];
    expect(exactLocalVoice(list, 'pt-PT')?.name).toBe('Catarina');
    const joanas = [list[0], list[2]];
    expect(exactLocalVoice(joanas, 'pt-PT')?.voiceURI).toBe('a');
    expect(exactLocalVoice([...joanas].reverse(), 'pt-PT')?.voiceURI).toBe('a');
  });
});
