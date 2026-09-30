/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private sfxEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private sfxVolume: number = 0.6;
  private musicVolume: number = 0.35;
  private bgmInterval: number | null = null;
  private bgmStep: number = 0;
  private isThrustPlaying: boolean = false;
  private thrustOsc: OscillatorNode | null = null;
  private thrustGain: GainNode | null = null;

  constructor() {
    // Load preferences
    try {
      const savedSfx = localStorage.getItem('crush_asteroid_sfx');
      const savedMusic = localStorage.getItem('crush_asteroid_music');
      if (savedSfx !== null) this.sfxEnabled = savedSfx === 'true';
      if (savedMusic !== null) this.musicEnabled = savedMusic === 'true';
    } catch {
      // ignore localStorage errors
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public userInteraction() {
    this.initCtx();
    if (this.musicEnabled && !this.bgmInterval) {
      this.startMusic();
    }
  }

  public isSfxMuted(): boolean {
    return !this.sfxEnabled;
  }

  public isMusicMuted(): boolean {
    return !this.musicEnabled;
  }

  public toggleSfx(): boolean {
    this.sfxEnabled = !this.sfxEnabled;
    try {
      localStorage.setItem('crush_asteroid_sfx', String(this.sfxEnabled));
    } catch {
      // ignore
    }
    if (!this.sfxEnabled) {
      this.stopThrust();
    }
    return this.sfxEnabled;
  }

  public toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    try {
      localStorage.setItem('crush_asteroid_music', String(this.musicEnabled));
    } catch {
      // ignore
    }
    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  // --- SFX GENERATION USING WEB AUDIO ---

  public playLaser(spread: boolean = false) {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = spread ? 'triangle' : 'sawtooth';
    osc.frequency.setValueAtTime(spread ? 900 : 750, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.12);

    gain.gain.setValueAtTime(this.sfxVolume * (spread ? 0.35 : 0.25), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playMachineGun() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420 + Math.random() * 80, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.045);

    gain.gain.setValueAtTime(this.sfxVolume * 0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  public playLaserLauncher() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.22);

    gain.gain.setValueAtTime(this.sfxVolume * 0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.23);
  }

  public playPlasmaShot() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);

    gain.gain.setValueAtTime(this.sfxVolume * 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.19);
  }

  public playEnemyLaser() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.16);

    gain.gain.setValueAtTime(this.sfxVolume * 0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.17);
  }

  public playEnemyAlarm() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.setValueAtTime(480, t + 0.08);
    osc.frequency.setValueAtTime(320, t + 0.16);

    gain.gain.setValueAtTime(this.sfxVolume * 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playAsteroidHit() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

    gain.gain.setValueAtTime(this.sfxVolume * 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playAsteroidExplosion(sizeTier: 'large' | 'medium' | 'small') {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const duration = sizeTier === 'large' ? 0.45 : sizeTier === 'medium' ? 0.3 : 0.18;
    const startFreq = sizeTier === 'large' ? 140 : sizeTier === 'medium' ? 220 : 350;

    // Filtered noise
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(startFreq, t);
    filter.frequency.exponentialRampToValueAtTime(30, t + duration);

    const gain = this.ctx.createGain();
    const vol = sizeTier === 'large' ? 0.6 : sizeTier === 'medium' ? 0.45 : 0.3;
    gain.gain.setValueAtTime(this.sfxVolume * vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start(t);
  }

  public playShipExplosion() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const duration = 0.8;

    // Sub rumble oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + duration);

    oscGain.gain.setValueAtTime(this.sfxVolume * 0.7, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration);

    // Crackle noise
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.linearRampToValueAtTime(80, t + duration);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(this.sfxVolume * 0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(t);
  }

  public playPowerUpCollect() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(this.sfxVolume * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  public playShieldHit() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.linearRampToValueAtTime(300, t + 0.15);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playWaveClear() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [392, 523.25, 659.25, 783.99, 1046.5]; // C major fanfare
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(this.sfxVolume * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (idx === notes.length - 1 ? 0.6 : 0.2));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.7);
    });
  }

  public startThrust() {
    if (!this.sfxEnabled || this.isThrustPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      this.thrustOsc = this.ctx.createOscillator();
      this.thrustGain = this.ctx.createGain();

      this.thrustOsc.type = 'triangle';
      this.thrustOsc.frequency.setValueAtTime(65, this.ctx.currentTime);

      this.thrustGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.thrustGain.gain.linearRampToValueAtTime(this.sfxVolume * 0.15, this.ctx.currentTime + 0.05);

      this.thrustOsc.connect(this.thrustGain);
      this.thrustGain.connect(this.ctx.destination);

      this.thrustOsc.start();
      this.isThrustPlaying = true;
    } catch {
      // ignore
    }
  }

  public stopThrust() {
    if (!this.isThrustPlaying || !this.thrustGain || !this.ctx) return;
    try {
      this.thrustGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      const oscToStop = this.thrustOsc;
      setTimeout(() => {
        try {
          oscToStop?.stop();
          oscToStop?.disconnect();
        } catch {
          // ignore
        }
      }, 60);
    } catch {
      // ignore
    }
    this.isThrustPlaying = false;
    this.thrustOsc = null;
    this.thrustGain = null;
  }

  // --- PROCEDURAL BACKGROUND ARCADE MUSIC ---

  public startMusic() {
    if (this.bgmInterval || !this.musicEnabled) return;
    this.initCtx();

    // Bassline and arpeggio notes in D minor space scale (D, F, G, A, C)
    const bassline = [146.83, 146.83, 174.61, 164.81, 130.81, 130.81, 146.83, 164.81]; // D3, F3, E3, C3, D3
    const arpNotes = [293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 523.25, 440.00];

    const stepDuration = 180; // ms per 16th note

    this.bgmInterval = window.setInterval(() => {
      if (!this.musicEnabled || !this.ctx || this.ctx.state !== 'running') return;
      const t = this.ctx.currentTime;
      const step = this.bgmStep % 16;

      // Play bass on quarter notes (0, 4, 8, 12)
      if (step % 4 === 0) {
        const bassFreq = bassline[(step / 4) % bassline.length];
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq / 2, t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, t);

        bassGain.gain.setValueAtTime(this.musicVolume * 0.22, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        bassOsc.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(this.ctx.destination);

        bassOsc.start(t);
        bassOsc.stop(t + 0.36);
      }

      // Play atmospheric arpeggio tick
      if (step % 2 === 0) {
        const arpIndex = (this.bgmStep / 2) % arpNotes.length;
        const noteFreq = arpNotes[arpIndex];

        const arpOsc = this.ctx.createOscillator();
        const arpGain = this.ctx.createGain();

        arpOsc.type = 'sine';
        arpOsc.frequency.setValueAtTime(noteFreq, t);

        arpGain.gain.setValueAtTime(this.musicVolume * 0.12, t);
        arpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        arpOsc.connect(arpGain);
        arpGain.connect(this.ctx.destination);

        arpOsc.start(t);
        arpOsc.stop(t + 0.16);
      }

      this.bgmStep++;
    }, stepDuration);
  }

  public stopMusic() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  public destroy() {
    this.stopMusic();
    this.stopThrust();
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch {
        // ignore
      }
    }
  }
}

export const soundManager = new SoundManager();
