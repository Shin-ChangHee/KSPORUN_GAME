/**
 * audio.js — 사운드 (효과음 + BGM)
 * CC0 음원 확보 전까지 Web Audio API로 효과음을 합성해 사용.
 * 추후 assets/sounds/ 에 음원을 넣고 loadFile()로 교체 가능하게 설계.
 * 모바일 자동재생 제한 대응: 첫 사용자 입력 시 resume().
 */
class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem(CONFIG.STORAGE_MUTE) === '1';
    this.bgmTimer = null;
    this.bgmStep = 0;
  }

  // 첫 사용자 입력 시 호출
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem(CONFIG.STORAGE_MUTE, this.muted ? '1' : '0');
    if (this.muted) this.stopBgm();
    else this.startBgm();
    return this.muted;
  }

  _tone(freq, dur, type = 'square', gain = 0.12, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  }

  play(name) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'jump':     this._tone(420, 0.16, 'square', 0.10, 720); break;
      case 'coin':     this._tone(880, 0.08, 'triangle', 0.12);
                       setTimeout(() => this._tone(1320, 0.12, 'triangle', 0.12), 70); break;
      case 'hit':      this._tone(180, 0.4, 'sawtooth', 0.18, 60); break;
      case 'stage':    this._tone(660, 0.12, 'triangle', 0.12);
                       setTimeout(() => this._tone(990, 0.18, 'triangle', 0.12), 110); break;
      case 'clear':    [523, 659, 784, 1047].forEach((f, i) =>
                         setTimeout(() => this._tone(f, 0.25, 'triangle', 0.13), i * 130)); break;
    }
  }

  // 간단한 루프 BGM (경쾌한 아르페지오)
  startBgm() {
    if (!this.ctx || this.muted || this.bgmTimer) return;
    const notes = [262, 330, 392, 330, 294, 349, 440, 349];
    this.bgmStep = 0;
    this.bgmTimer = setInterval(() => {
      if (this.muted) return;
      const f = notes[this.bgmStep % notes.length];
      this._tone(f, 0.18, 'sine', 0.05);
      this.bgmStep++;
    }, 230);
  }

  stopBgm() {
    if (this.bgmTimer) { clearInterval(this.bgmTimer); this.bgmTimer = null; }
  }
}
