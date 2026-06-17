/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  // BGM Sequencer States
  private bgmIntervalId: any = null;
  private currentBgmType: string = 'none'; // 'none' | 'ambient' | 'orgel' | 'jazz'
  private bgmStep: number = 0;

  constructor() {
    // Lazy initialization on first play to conform with browser autoplay policies
  }

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    } catch (e) {
      console.warn('Web Audio API not supported in this browser:', e);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.isMuted) {
      this.ctx.suspend();
    } else if (this.ctx && !this.isMuted) {
      this.ctx.resume();
      // Ensure BGM plays if it was suspended
      if (this.currentBgmType !== 'none') {
        this.startBGM(this.currentBgmType);
      }
    }
    return this.isMuted;
  }

  getMuteStatus() {
    return this.isMuted;
  }

  // BGM Loop Sequencer Implementation
  startBGM(type: string) {
    this.initContext();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended' && !this.isMuted) {
      this.ctx.resume();
    }

    // If switching to 'none' or same BGM is already running, avoid restarting
    if (type === 'none') {
      this.stopBGM();
      return;
    }
    if (this.currentBgmType === type && this.bgmIntervalId) {
      return;
    }

    this.stopBGM();
    this.currentBgmType = type;
    this.bgmStep = 0;

    const tempo = type === 'jazz' ? 350 : type === 'orgel' ? 320 : 400; // Step duration in ms

    this.bgmIntervalId = setInterval(() => {
      if (this.isMuted) return;
      this.playBgmStep();
    }, tempo);
  }

  stopBGM() {
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    this.currentBgmType = 'none';
  }

  private playBgmStep() {
    if (!this.ctx || this.isMuted) return;
    
    const t = this.ctx.currentTime;
    const step = this.bgmStep;
    this.bgmStep = (this.bgmStep + 1) % 16;

    if (this.currentBgmType === 'orgel') {
      // Elegant crystal-music melody (Orgel synth)
      const notes = [
        659.25, 0, 783.99, 1046.50, 0, 987.77, 783.99, 880.00,
        987.77, 0, 659.25, 523.25, 0, 587.33, 659.25, 523.25
      ];
      const freq = notes[step];
      if (freq > 0) {
        this.triggerSynthNote(freq, 'orgel', t, 0.4);
      }
      // Accompanying quiet bass note every 4 steps
      if (step % 4 === 0) {
        const bassFreq = [261.63, 196.00, 220.00, 130.81][step / 4];
        this.triggerSynthNote(bassFreq, 'ambient', t, 0.8, 0.02);
      }
    } else if (this.currentBgmType === 'ambient') {
      // Calming vanilla ambient ripples (Sine arpeggios)
      const notes = [
        261.63, 329.63, 392.00, 523.25, 349.23, 440.00, 523.25, 698.46,
        329.63, 392.00, 493.88, 659.25, 293.66, 349.23, 440.00, 587.33
      ];
      const freq = notes[step];
      this.triggerSynthNote(freq, 'ambient', t, 0.6, 0.02);
    } else if (this.currentBgmType === 'jazz') {
      // Mellow chocolate jazz chords and walk notes (Triangle & low pass filter)
      const chordNotes = [
        [130.81, 261.63, 329.63, 392.00], // C Maj7 (steps 0-3)
        [138.59, 277.18, 349.23, 415.30], // Db Maj7 (steps 4-7)
        [146.83, 293.66, 349.23, 440.00], // D min7 (steps 8-11)
        [196.00, 293.66, 392.00, 493.88]  // G 7 (steps 12-15)
      ];
      
      const chordIdx = Math.floor(step / 4);
      const noteInChord = step % 4;
      const freq = chordNotes[chordIdx][noteInChord];
      
      this.triggerSynthNote(freq, 'jazz', t, 0.5, 0.025);

      // Soft syncopated drum brush tick
      if (step % 2 === 1) {
        this.triggerBrushNoise(t);
      }
    }
  }

  private triggerSynthNote(freq: number, style: 'orgel' | 'ambient' | 'jazz', time: number, duration: number, gainVal: number = 0.03) {
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.frequency.setValueAtTime(freq, time);

    if (style === 'orgel') {
      osc.type = 'sine';
      // Add quick bright attack and exponential decay for "plucking" vibe
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, time);
      
      gainNode.gain.setValueAtTime(gainVal * 1.5, time);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      // Create high-pitched sparkling bell overtone
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq * 3, time); // 3rd harmonic
      subGain.gain.setValueAtTime(gainVal * 0.3, time);
      subGain.gain.exponentialRampToValueAtTime(0.0001, time + duration * 0.5);
      
      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(time);
      subOsc.stop(time + duration);
    } else if (style === 'ambient') {
      osc.type = 'sine';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, time);
      
      gainNode.gain.setValueAtTime(0.015, time); // soft volume
      gainNode.gain.linearRampToValueAtTime(gainVal, time + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    } else if (style === 'jazz') {
      osc.type = 'triangle';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, time); // very warm low-pass Filtered
      
      gainNode.gain.setValueAtTime(gainVal, time);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    }

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + duration + 0.1);
  }

  private triggerBrushNoise(time: number) {
    if (!this.ctx) return;
    
    // Create soft brown pseudo-noise source using very short tiny square wave sweeps
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(8000, time);
    osc.frequency.exponentialRampToValueAtTime(1000, time + 0.05);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(5000, time);

    gainNode.gain.setValueAtTime(0.008, time);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.08);
  }

  playCrunch() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // Direct browser interaction safety check
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    
    // Low crunch sound
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(140, t);
    osc1.frequency.exponentialRampToValueAtTime(40, t + 0.12);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(110, t);
    osc2.frequency.setValueAtTime(50, t + 0.08);

    gainNode.gain.setValueAtTime(0.15, t);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    // Apply lowpass filtering for chocolatey soft crunch
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + 0.15);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    
    osc1.stop(t + 0.16);
    osc2.stop(t + 0.16);
  }

  playSwipe() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);

    gainNode.gain.setValueAtTime(0.06, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  playError() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(110, t + 0.2);

    gainNode.gain.setValueAtTime(0.08, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, t);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.23);
  }

  playChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Sweet high dome chimes)

    chords.forEach((freq, index) => {
      const playTime = t + index * 0.06;
      const osc = this.ctx!.createOscillator();
      const gainNode = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, playTime);

      // Add a higher-pitched subtle overtone for metallic sparkle
      const overtone = this.ctx!.createOscillator();
      const overtoneGain = this.ctx!.createGain();
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(freq * 2, playTime);

      gainNode.gain.setValueAtTime(0.05, playTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, playTime + 0.5);

      overtoneGain.gain.setValueAtTime(0.015, playTime);
      overtoneGain.gain.exponentialRampToValueAtTime(0.001, playTime + 0.3);

      osc.connect(gainNode);
      overtone.connect(overtoneGain);
      
      gainNode.connect(this.ctx!.destination);
      overtoneGain.connect(this.ctx!.destination);

      osc.start(playTime);
      overtone.start(playTime);
      
      osc.stop(playTime + 0.6);
      overtone.stop(playTime + 0.6);
    });
  }

  playLevelUp() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // Sweet full major arpeggio
    
    notes.forEach((freq, index) => {
      const playTime = t + index * 0.08;
      const osc = this.ctx!.createOscillator();
      const gainNode = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, playTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, playTime);

      gainNode.gain.setValueAtTime(0.05, playTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, playTime + 0.6);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx!.destination);

      osc.start(playTime);
      osc.stop(playTime + 0.8);
    });
  }

  playSpatula() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(80, t + 0.25);

    gainNode.gain.setValueAtTime(0.12, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, t);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.35);
  }
}

export const audio = new AudioEngine();
