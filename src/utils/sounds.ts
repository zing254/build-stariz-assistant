/**
 * STARIZ Sound Effects System
 * Provides audio feedback for UI interactions
 * All sounds are generated programmatically (no external files needed)
 */

interface SoundOptions {
  volume?: number;
  playbackRate?: number;
}

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.3;

  constructor() {
    // Load saved preference
    try {
      const saved = localStorage.getItem('stariz-sound-enabled');
      if (saved !== null) this.enabled = JSON.parse(saved);
      
      const vol = localStorage.getItem('stariz-sound-volume');
      if (vol !== null) this.volume = parseFloat(vol);
    } catch {}
  }

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('stariz-sound-enabled', JSON.stringify(enabled));
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('stariz-sound-volume', this.volume.toString());
  }

  isEnabled() {
    return this.enabled;
  }

  getVolume() {
    return this.volume;
  }

  // Generate a beep sound
  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume?: number
  ) {
    if (!this.enabled) return;

    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.value = frequency;
      
      const vol = (volume !== undefined ? volume : this.volume) * 0.3;
      gainNode.gain.setValueAtTime(vol, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  }

  // Generate a click sound
  private playClick(frequency: number = 800, duration: number = 0.05) {
    this.playTone(frequency, duration, 'square');
  }

  // Sound effects
  click() {
    this.playClick(1000, 0.03);
  }

  hover() {
    if (!this.enabled) return;
    this.playTone(600, 0.02, 'sine');
  }

  success() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine'), i * 80);
    });
  }

  error() {
    if (!this.enabled) return;
    this.playTone(220, 0.3, 'sawtooth');
  }

  notification() {
    if (!this.enabled) return;
    this.playTone(880, 0.1, 'sine');
    setTimeout(() => this.playTone(1108, 0.15, 'sine'), 100);
  }

  messageSent() {
    this.playTone(1200, 0.08, 'sine');
  }

  messageReceived() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const notes = [783.99, 987.77, 1174.66]; // G5, B5, D6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.1, 'sine'), i * 60);
    });
  }

  widgetOpen() {
    this.playTone(440, 0.1, 'sine');
    setTimeout(() => this.playTone(550, 0.1, 'sine'), 50);
  }

  widgetClose() {
    this.playTone(550, 0.1, 'sine');
    setTimeout(() => this.playTone(440, 0.1, 'sine'), 50);
  }

  startup() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const melody = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    melody.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine'), i * 120);
    });
  }

  shutdown() {
    if (!this.enabled) return;
    const melody = [523.25, 392.00, 329.63, 261.63]; // C5, G4, E4, C4
    melody.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine'), i * 120);
    });
  }

  typing() {
    // Soft tick sound while typing
    if (!this.enabled) return;
    this.playTone(300 + Math.random() * 200, 0.01, 'square');
  }

  alarm() {
    if (!this.enabled) return;
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playTone(880, 0.2, 'square');
        setTimeout(() => this.playTone(660, 0.2, 'square'), 200);
      }, i * 500);
    }
  }

  // Voice feedback sounds
  voiceStart() {
    this.playTone(660, 0.1, 'sine');
    setTimeout(() => this.playTone(990, 0.15, 'sine'), 100);
  }

  voiceStop() {
    this.playTone(990, 0.1, 'sine');
    setTimeout(() => this.playTone(660, 0.15, 'sine'), 100);
  }

  voiceProcessing() {
    this.playTone(440, 0.3, 'triangle');
  }

  // Navigation sounds
  navigate() {
    this.playTone(550, 0.05, 'sine');
  }

  select() {
    this.playTone(800, 0.08, 'sine');
  }

  // Warning/alert
  warning() {
    this.playTone(440, 0.4, 'sawtooth');
    setTimeout(() => this.playTone(349.23, 0.4, 'sawtooth'), 200);
  }
}

// Export singleton instance
export const soundManager = new SoundManager();

// Convenience hooks
export function useSound() {
  return soundManager;
}

export default soundManager;
