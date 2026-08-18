export class Soundscape {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
    this.ambienceStarted = false;
  }

  ensureContext() {
    if (this.muted) return null;
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.18;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === "suspended") this.context.resume();
    return this.context;
  }

  note(frequency, duration = 0.18, type = "sine", volume = 0.28, delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  start() {
    if (this.ambienceStarted) return;
    this.ambienceStarted = true;
    this.note(146.83, 2.8, "sine", 0.07);
    this.note(220, 3.2, "sine", 0.045, 0.18);
  }

  collect() {
    [523.25, 659.25, 783.99].forEach((frequency, index) => this.note(frequency, 0.34, "sine", 0.2, index * 0.07));
  }

  wrong() {
    this.note(164.81, 0.22, "triangle", 0.22);
    this.note(138.59, 0.32, "triangle", 0.16, 0.1);
  }

  dash() { this.note(392, 0.12, "sine", 0.08); }
  win() { [261.63, 329.63, 392, 523.25].forEach((frequency, index) => this.note(frequency, 0.8, "sine", 0.19, index * 0.16)); }

  toggle() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.18;
    return this.muted;
  }
}
