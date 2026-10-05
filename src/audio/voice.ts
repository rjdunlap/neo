import { SCRIPT, type LineId } from '../content/voice-script';
import { audio } from './engine';

export type LineVars = Record<string, string | number>;

const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * Speaks script lines. For now the voice is the device's built-in speech;
 * recorded parent voices will slot in here, keyed by the same line ids.
 */
class Voice {
  /** The child's name, as it should be spoken. */
  name = '';
  private chosen: SpeechSynthesisVoice | null = null;
  private talking = 0;

  constructor() {
    if (!hasSpeech) return;
    this.pickVoice();
    speechSynthesis.addEventListener('voiceschanged', () => this.pickVoice());
  }

  /** iOS only allows speech after a tap; call this from the first one. */
  unlock() {
    if (!hasSpeech) return;
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  }

  line(id: LineId, vars: LineVars = {}): string {
    const options: string[] = SCRIPT[id];
    const text = options[Math.floor(Math.random() * options.length)];
    const all: LineVars = { name: this.name || 'friend', ...vars };
    return text.replace(/\{(\w+)\}/g, (_, key: string) => String(all[key] ?? ''));
  }

  say(id: LineId, vars?: LineVars): Promise<void> {
    return this.speak(this.line(id, vars));
  }

  speak(text: string): Promise<void> {
    if (!hasSpeech) return Promise.resolve();
    speechSynthesis.cancel();
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      if (this.chosen) u.voice = this.chosen;
      u.rate = 0.95;
      u.pitch = 1.15;
      u.volume = Math.min(1, audio.getVolume() * 1.1);
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        this.talking--;
        if (this.talking <= 0) audio.duck(false);
        resolve();
      };
      u.onend = finish;
      u.onerror = finish;
      // Some engines never fire `end`; don't let a game wait forever.
      window.setTimeout(finish, 1500 + text.length * 90);
      this.talking++;
      audio.duck(true);
      speechSynthesis.speak(u);
    });
  }

  stop() {
    if (hasSpeech) speechSynthesis.cancel();
  }

  private pickVoice() {
    const score = (v: SpeechSynthesisVoice) =>
      (/premium|enhanced|neural|natural/i.test(v.name) ? 4 : 0) +
      (/samantha|ava|allison|susan|zoe|karen|tessa|serena/i.test(v.name) ? 2 : 0) +
      (v.lang === 'en-US' ? 1 : 0) +
      (v.localService ? 1 : 0);
    const english = speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'));
    this.chosen = english.sort((a, b) => score(b) - score(a))[0] ?? null;
  }
}

export const voice = new Voice();
