export class Soundscape {
  constructor() { this.context = null; this.master = null; this.muted = false; }
  ensure() {
    if (this.muted) return null;
    if (!this.context) { const AudioContext = window.AudioContext || window.webkitAudioContext; if (!AudioContext) return null; this.context = new AudioContext(); this.master = this.context.createGain(); this.master.gain.value = .14; this.master.connect(this.context.destination); }
    if (this.context.state === "suspended") this.context.resume(); return this.context;
  }
  note(frequency, duration = .2, delay = 0, volume = .18) { const ctx = this.ensure(); if (!ctx) return; const osc = ctx.createOscillator(); const gain = ctx.createGain(); const start = ctx.currentTime + delay; osc.type = "sine"; osc.frequency.value = frequency; gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(volume, start + .03); gain.gain.exponentialRampToValueAtTime(.0001, start + duration); osc.connect(gain); gain.connect(this.master); osc.start(start); osc.stop(start + duration + .05); }
  page() { this.note(440, .13, 0, .1); }
  encounter() { this.note(587, .18, 0, .12); this.note(784, .24, .07, .08); }
  invoke() { [294, 392, 494, 587].forEach((f, i) => this.note(f, .6, i * .11, .15)); }
  toggle() { this.muted = !this.muted; if (this.master) this.master.gain.value = this.muted ? 0 : .14; return this.muted; }
}
