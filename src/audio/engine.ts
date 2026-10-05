type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

/**
 * One AudioContext with three buses: effects, music and a master with a limiter.
 * iOS only lets audio start inside a tap, so `unlock()` runs from the start screen.
 */
class AudioEngine {
  ctx: AudioContext | null = null;
  sfxOut!: GainNode;
  musicOut!: GainNode;
  private master!: GainNode;
  private volume = 0.8;
  private musicOn = true;
  private ducked = false;

  unlock() {
    if (!this.ctx) {
      // Play through the iPad's silent mode: a kids' game with no sound just looks broken.
      const nav = navigator as AudioSessionNavigator;
      if (nav.audioSession) nav.audioSession.type = 'playback';

      const ctx = new AudioContext({ latencyHint: 'interactive' });
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -10;
      limiter.ratio.value = 6;
      this.master = ctx.createGain();
      this.master.gain.value = this.volume;
      this.sfxOut = ctx.createGain();
      this.musicOut = ctx.createGain();
      this.sfxOut.connect(this.master);
      this.musicOut.connect(this.master);
      this.master.connect(limiter).connect(ctx.destination);
      this.ctx = ctx;
      this.applyMusic();
    }
    if (this.ctx.state !== 'running') void this.ctx.resume();
    // A silent blip inside the gesture fully wakes older iOS versions.
    const blip = this.ctx.createBufferSource();
    blip.buffer = this.ctx.createBuffer(1, 1, 22050);
    blip.connect(this.ctx.destination);
    blip.start();
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  getVolume() {
    return this.volume;
  }

  setMusicOn(on: boolean) {
    this.musicOn = on;
    this.applyMusic();
  }

  /** Lowers the music while the voice is talking. */
  duck(on: boolean) {
    this.ducked = on;
    this.applyMusic();
  }

  /** Silence everything while the app is in the background. */
  sleep(hidden: boolean) {
    if (!this.ctx) return;
    void (hidden ? this.ctx.suspend() : this.ctx.resume());
  }

  private applyMusic() {
    if (!this.ctx) return;
    const v = this.musicOn ? (this.ducked ? 0.35 : 1) : 0;
    this.musicOut.gain.setTargetAtTime(v, this.ctx.currentTime, 0.15);
  }
}

export const audio = new AudioEngine();
