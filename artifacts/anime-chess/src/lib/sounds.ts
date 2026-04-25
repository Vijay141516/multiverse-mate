/**
 * Minimalist sound manager using Web Audio API to generate chess sounds
 * without needing external assets.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private volume: number = Number(localStorage.getItem('anime_chess_volume') || '0.5');

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  setVolume(v: number) {
    this.volume = v;
    localStorage.setItem('anime_chess_volume', String(v));
  }

  private playTone(freq: number, duration: number, volume: number, type: OscillatorType = 'sine') {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const finalVol = volume * this.volume;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq / 2, this.ctx.currentTime + duration);

    gain.gain.setValueAtTime(finalVol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playMove() {
    this.playTone(400, 0.1, 0.1, 'triangle');
  }

  playCapture() {
    this.playTone(300, 0.15, 0.15, 'square');
  }

  playCheck() {
    this.playTone(600, 0.2, 0.1, 'sine');
    setTimeout(() => this.playTone(800, 0.2, 0.1, 'sine'), 100);
  }

  playGameOver() {
    this.playTone(200, 0.5, 0.2, 'sine');
    this.playTone(150, 0.6, 0.2, 'sine');
  }

  playImpact() {
    this.playTone(150, 0.3, 0.3, 'square');
  }

  playSpecial() {
    this.playTone(400, 0.1, 0.1, 'sine');
    setTimeout(() => this.playTone(600, 0.1, 0.1, 'sine'), 50);
    setTimeout(() => this.playTone(800, 0.2, 0.1, 'sine'), 100);
  }
}

export const sounds = new SoundManager();
