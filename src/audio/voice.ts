import { SCRIPT, type LineId } from '../content/voice-script';
import { audio } from './engine';
import { clipUrl } from './voice-clips';
import { chooseVoice, voiceLabel, voiceQuality, type VoiceQuality } from './voice-choice';

export type LineVars = Record<string, string | number>;

/**
 * A device-speech voice other than the pet's: a puppet's, say. `pitch` and `rate` are the Web Speech ranges the
 * islands' voices stay intelligible in (about 0.5–2 and 0.6–1.3); `volume` scales the app's voice volume (1 by default).
 */
export interface VoicePreset { pitch: number; rate: number; volume?: number }

/** The pet's own device voice, so a preset can keep clear of it (`src/games/puppet-stage/logic.ts` tests the margin). */
export const PET_VOICE: VoicePreset = { pitch: 1.15, rate: 0.95 };

/** Set `VITE_SPEECH=off` in an untracked `.env.local` to silence speech on that machine whatever the setting says; deployed builds never see it. */
const envMuted = import.meta.env.VITE_SPEECH === 'off';
const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

/** How many decoded clips stay in memory; they are small and replayed lines come back often. */
const KEEP_DECODED = 40;
/** How long a clip may take to load before the line falls back to device speech. */
const CLIP_WAIT_MS = 2500;

/**
 * Speaks script lines: a rendered clip (`voice-clips.ts`) when one exists for the exact text,
 * otherwise, or if it fails to load or decode, the device's built-in speech.
 */
class Voice {
  /** The child's name, as it should be spoken. */
  name = '';
  pet = 'Pip';
  /** The grown-ups' "Spoken voice" setting; off keeps the lines' timing but says nothing. */
  enabled = true;
  private chosen: SpeechSynthesisVoice | null = null;
  private talking = 0;
  /** Bumped by every new line and by `stop()`, so a clip still loading knows it was interrupted. */
  private turn = 0;
  private source: AudioBufferSourceNode | null = null;
  private decoded = new Map<string, Promise<AudioBuffer>>();
  /** Clips that would not load or decode (a missing codec, say); those lines use device speech from then on. */
  private failed = new Set<string>();

  constructor() {
    if (!hasSpeech) return;
    this.pickVoice();
    speechSynthesis.addEventListener('voiceschanged', () => this.pickVoice());
  }

  /** iOS only allows speech after a tap; call this from the first one. */
  unlock() {
    if (!hasSpeech || envMuted) return;
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  }

  line(id: LineId, vars: LineVars = {}): string {
    const options: string[] = SCRIPT[id];
    const text = options[Math.floor(Math.random() * options.length)];
    const all: LineVars = { name: this.name || 'friend', pet: this.pet || 'Pip', ...vars };
    return text.replace(/\{(\w+)\}/g, (_, key: string) => String(all[key] ?? ''));
  }

  say(id: LineId, vars?: LineVars): Promise<void> {
    return this.speak(this.line(id, vars));
  }

  /**
   * Speaks a line in another voice: always the device's speech with the preset, never a rendered clip (the clips are the
   * pet's single voice). Keeps the muted-environment pacing, the turn counter, ducking and the no-`end` timeout of `say`.
   */
  sayIn(id: LineId, preset: VoicePreset, vars?: LineVars): Promise<void> {
    const text = this.line(id, vars);
    if (envMuted || !this.enabled) return new Promise((resolve) => window.setTimeout(resolve, 600 + text.length * 45));
    this.cutClip();
    this.turn++;
    return this.device(text, preset);
  }

  speak(text: string): Promise<void> {
    // Silenced: stay quiet but keep a spoken line's pacing so games that await it don't rush.
    if (envMuted || !this.enabled) return new Promise((resolve) => window.setTimeout(resolve, 600 + text.length * 45));
    this.cutClip();
    const turn = ++this.turn;
    const url = clipUrl(text);
    const ctx = audio.ctx;
    if (url && !this.failed.has(url) && ctx && ctx.state === 'running') {
      if (hasSpeech) speechSynthesis.cancel();
      return this.playClip(text, url, ctx, turn);
    }
    return this.device(text);
  }

  /** Plays a clip; any failure to load or decode speaks the line with device speech instead. */
  private playClip(text: string, url: string, ctx: AudioContext, turn: number): Promise<void> {
    return new Promise((resolve) => {
      let done = false;
      let timer = 0;
      const finish = () => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        this.talking--;
        if (this.talking <= 0) audio.duck(false);
        resolve();
      };
      const fallBack = () => {
        if (done) return;
        if (turn !== this.turn) return finish();
        done = true;
        window.clearTimeout(timer);
        const spoken = this.device(text);
        this.talking--;
        void spoken.then(resolve);
      };
      this.talking++;
      audio.duck(true);
      timer = window.setTimeout(fallBack, CLIP_WAIT_MS);
      this.load(url, ctx).then((buffer) => {
        if (done) return;
        if (turn !== this.turn) return finish();
        window.clearTimeout(timer);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.connect(audio.voiceOut);
        src.onended = () => {
          if (this.source === src) this.source = null;
          finish();
        };
        this.source = src;
        src.start();
        // A suspended context (the app in the background) never ends the clip; don't let a game wait forever.
        timer = window.setTimeout(finish, buffer.duration * 1000 + 1000);
      }, fallBack);
    });
  }

  private load(url: string, ctx: AudioContext): Promise<AudioBuffer> {
    let p = this.decoded.get(url);
    if (p) {
      this.decoded.delete(url);
    } else {
      p = fetch(url)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`clip ${r.status}`))))
        .then((bytes) => ctx.decodeAudioData(bytes));
      p.catch(() => {
        this.decoded.delete(url);
        this.failed.add(url);
      });
    }
    this.decoded.set(url, p);
    while (this.decoded.size > KEEP_DECODED) this.decoded.delete(this.decoded.keys().next().value as string);
    return p;
  }

  private cutClip() {
    const src = this.source;
    this.source = null;
    if (!src) return;
    try {
      src.stop();
    } catch {
      // Already stopped.
    }
  }

  /** The device's built-in speech, in the pet's voice unless a preset says otherwise. */
  private device(text: string, preset: VoicePreset = PET_VOICE): Promise<void> {
    if (!hasSpeech) return Promise.resolve();
    speechSynthesis.cancel();
    if (!this.chosen) this.pickVoice();
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      if (this.chosen) u.voice = this.chosen;
      u.rate = preset.rate;
      u.pitch = preset.pitch;
      u.volume = Math.min(1, audio.getVolume() * 1.1 * (preset.volume ?? 1));
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
    this.turn++;
    this.cutClip();
    if (hasSpeech) speechSynthesis.cancel();
  }

  /** The voice in use, for the grown-ups' page; null when the device's default speaks or there is no speech. */
  current(): { name: string; quality: VoiceQuality } | null {
    if (!hasSpeech) return null;
    if (!this.chosen) this.pickVoice();
    return this.chosen ? { name: voiceLabel(this.chosen), quality: voiceQuality(this.chosen) } : null;
  }

  private pickVoice() {
    this.chosen = chooseVoice(speechSynthesis.getVoices());
  }
}

export const voice = new Voice();
