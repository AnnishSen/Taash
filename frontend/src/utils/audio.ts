// Synthesized Web Audio API sound effects for realistic card gaming
// Strictly dedicated to "TRAAT" card slam sounds (Halki & Full) with all other table sounds silenced

export type TraatMode = 'chaal' | 'traat' | 'halki' | 'full';

class SoundController {
  private ctx: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        // Master compressor and gain for maximum loudness without harsh distortion
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.12, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(1.4, this.ctx.currentTime);

        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getDestinationNode(): AudioNode {
    if (this.compressor) return this.compressor;
    if (this.ctx) return this.ctx.destination;
    throw new Error('AudioContext not ready');
  }

  toggleSound(enabled?: boolean) {
    this.enabled = enabled !== undefined ? enabled : !this.enabled;
    return this.enabled;
  }

  isSoundEnabled() {
    return this.enabled;
  }

  // All other table sounds removed as requested
  playCardDeal() {}
  playTrickWon() {}
  playTrumpOpened() {}
  playVictory() {}
  playMindiCapture() {}
  playCardPlay() {
    this.playTraatCardPlay('traat');
  }

  // Desi Card Play Sounds: "chaal" (clean distinct card play) & "traat" (maximum thunderous table slam 💥)
  playTraatCardPlay(modeOrPercent: TraatMode | number = 'traat') {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const isTraat =
      modeOrPercent === 'traat' ||
      modeOrPercent === 'full' ||
      (typeof modeOrPercent === 'number' && modeOrPercent > 40);

    const dest = this.getDestinationNode();
    const now = ctx.currentTime;

    if (!isTraat) {
      // ==========================================
      // "CHAAL" (Clear, Loud & Punchy Standard Card Drop)
      // ==========================================
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(800, now);
      snapOsc.frequency.exponentialRampToValueAtTime(160, now + 0.045);
      snapGain.gain.setValueAtTime(0.45, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      snapOsc.connect(snapGain);
      snapGain.connect(dest);
      snapOsc.start(now);
      snapOsc.stop(now + 0.05);

      const thumpOsc = ctx.createOscillator();
      const thumpGain = ctx.createGain();
      thumpOsc.type = 'sine';
      thumpOsc.frequency.setValueAtTime(220, now);
      thumpOsc.frequency.exponentialRampToValueAtTime(65, now + 0.07);
      thumpGain.gain.setValueAtTime(0.55, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      thumpOsc.connect(thumpGain);
      thumpGain.connect(dest);
      thumpOsc.start(now);
      thumpOsc.stop(now + 0.07);
      return;
    }

    // ==========================================
    // "TRAAT" (3-Second Thunderous Desi Table Slam! 💥)
    // ==========================================

    // 1. Friction Noise Transient (Air & Card Crack)
    try {
      const bufferSize = Math.floor(ctx.sampleRate * 0.12);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3000, now);
      filter.Q.setValueAtTime(1.8, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(2.6, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(dest);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.09);
    } catch {}

    // 2. High Sharp Plastic Card Crack Transient
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(2600, now);
    snapOsc.frequency.exponentialRampToValueAtTime(160, now + 0.08);
    snapGain.gain.setValueAtTime(2.0, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    snapOsc.connect(snapGain);
    snapGain.connect(dest);
    snapOsc.start(now);
    snapOsc.stop(now + 0.09);

    // 3. Heavy Punchy Wooden Table Impact Body
    const thumpOsc = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thumpOsc.type = 'sine';
    thumpOsc.frequency.setValueAtTime(480, now);
    thumpOsc.frequency.exponentialRampToValueAtTime(50, now + 0.35);
    thumpGain.gain.setValueAtTime(2.8, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    thumpOsc.connect(thumpGain);
    thumpGain.connect(dest);
    thumpOsc.start(now);
    thumpOsc.stop(now + 0.45);

    // 4. Lingering Table Wood Resonance (0.0s -> 3.0s)
    const resOsc = ctx.createOscillator();
    const resGain = ctx.createGain();
    resOsc.type = 'sine';
    resOsc.frequency.setValueAtTime(120, now);
    resOsc.frequency.exponentialRampToValueAtTime(36, now + 3.0);
    resGain.gain.setValueAtTime(1.8, now);
    resGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
    resOsc.connect(resGain);
    resGain.connect(dest);
    resOsc.start(now);
    resOsc.stop(now + 3.0);

    // 5. Deep Sub-Bass Desk Shaker & Room Rumble (0.0s -> 3.0s)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(88, now);
    subOsc.frequency.exponentialRampToValueAtTime(20, now + 3.0);
    subGain.gain.setValueAtTime(2.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
    subOsc.connect(subGain);
    subGain.connect(dest);
    subOsc.start(now);
    subOsc.stop(now + 3.0);

    // 6. Long Table Reverb / Air Decay Wash (0.0s -> 3.0s)
    try {
      const revBufferSize = Math.floor(ctx.sampleRate * 3.0);
      const revBuffer = ctx.createBuffer(1, revBufferSize, ctx.sampleRate);
      const revData = revBuffer.getChannelData(0);
      for (let i = 0; i < revBufferSize; i++) {
        revData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.65));
      }
      const revNoise = ctx.createBufferSource();
      revNoise.buffer = revBuffer;

      const revFilter = ctx.createBiquadFilter();
      revFilter.type = 'lowpass';
      revFilter.frequency.setValueAtTime(680, now);
      revFilter.frequency.exponentialRampToValueAtTime(100, now + 3.0);

      const revGain = ctx.createGain();
      revGain.gain.setValueAtTime(1.1, now);
      revGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

      revNoise.connect(revFilter);
      revFilter.connect(revGain);
      revGain.connect(dest);

      revNoise.start(now);
      revNoise.stop(now + 3.0);
    } catch {}
  }
}

export const sound = new SoundController();
