/** Sound recipes built from oscillators and noise. Pure functions: they play into whatever node you give them. */

export function env(param: AudioParam, t: number, peak: number, attack: number, decay: number) {
  param.setValueAtTime(0.0001, t);
  param.exponentialRampToValueAtTime(peak, t + attack);
  param.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

export function tone(
  ctx: BaseAudioContext,
  dest: AudioNode,
  type: OscillatorType,
  hz: number,
  t: number,
  peak: number,
  attack: number,
  decay: number,
  glideTo?: number,
) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(hz, t);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + attack + decay);
  const g = ctx.createGain();
  env(g.gain, t, peak, attack, decay);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + attack + decay + 0.05);
  o.onended = () => g.disconnect();
  return o;
}

/** A bell: a few partials that ring out. Gentle and bright. */
export function bell(ctx: BaseAudioContext, dest: AudioNode, t: number, hz: number, gain = 0.3, decay = 1.2) {
  const partials: [number, number, number][] = [
    [1, 1, 1],
    [2, 0.35, 0.6],
    [3.01, 0.16, 0.4],
    [4.2, 0.07, 0.25],
  ];
  for (const [ratio, g, d] of partials) tone(ctx, dest, 'sine', hz * ratio, t, gain * g, 0.004, decay * d);
}

/** A soft wooden mallet. */
export function marimba(ctx: BaseAudioContext, dest: AudioNode, t: number, hz: number, gain = 0.4) {
  tone(ctx, dest, 'sine', hz, t, gain, 0.003, 0.75);
  tone(ctx, dest, 'triangle', hz * 2, t, gain * 0.12, 0.002, 0.18);
  tone(ctx, dest, 'sine', hz * 4, t, gain * 0.22, 0.002, 0.06);
}

/** A plucked string, filtered down as it decays. */
export function pluck(ctx: BaseAudioContext, dest: AudioNode, t: number, hz: number, gain = 0.25) {
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(hz * 6, t);
  f.frequency.exponentialRampToValueAtTime(hz * 1.2, t + 0.4);
  f.connect(dest);
  tone(ctx, f, 'triangle', hz, t, gain, 0.003, 0.5);
  setTimeout(() => f.disconnect(), 1200);
}

let noiseBuffer: AudioBuffer | null = null;

/** A burst of filtered noise: splashes, shakers, whooshes. */
export function noise(
  ctx: BaseAudioContext,
  dest: AudioNode,
  t: number,
  duration: number,
  peak: number,
  filter: { type: BiquadFilterType; hz: number; q?: number; sweepTo?: number },
) {
  if (!noiseBuffer || noiseBuffer.sampleRate !== ctx.sampleRate) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const f = ctx.createBiquadFilter();
  f.type = filter.type;
  f.frequency.setValueAtTime(filter.hz, t);
  if (filter.sweepTo) f.frequency.exponentialRampToValueAtTime(filter.sweepTo, t + duration);
  f.Q.value = filter.q ?? 1;
  const g = ctx.createGain();
  env(g.gain, t, peak, Math.min(0.02, duration / 4), duration);
  src.connect(f).connect(g).connect(dest);
  src.start(t, Math.random() * 0.5);
  src.stop(t + duration + 0.05);
  src.onended = () => g.disconnect();
}
