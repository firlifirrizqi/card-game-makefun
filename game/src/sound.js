// sound.js — tiny original sounds, synthesized live with WebAudio.
// No audio files, no network. M toggles mute.

let ctx = null;
let muted = false;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type, vol, when) {
  const c = ac();
  if (!c || muted) return;
  const t0 = c.currentTime + (when || 0);
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  play() { tone(520, 0.12, 'triangle', 0.1); tone(780, 0.14, 'triangle', 0.08, 0.06); },
  draw() { tone(660, 0.08, 'sine', 0.06); },
  attack() { tone(180, 0.16, 'sawtooth', 0.09); tone(120, 0.2, 'sawtooth', 0.07, 0.05); },
  damage() { tone(220, 0.12, 'square', 0.06); },
  heal() { tone(880, 0.16, 'sine', 0.07); tone(1174, 0.2, 'sine', 0.05, 0.08); },
  turn() { tone(440, 0.1, 'triangle', 0.07); tone(660, 0.12, 'triangle', 0.07, 0.07); },
  resonance() { tone(784, 0.12, 'sine', 0.08); tone(1046, 0.12, 'sine', 0.08, 0.07); tone(1318, 0.2, 'sine', 0.08, 0.14); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.28, 'triangle', 0.1, i * 0.13)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'sine', 0.09, i * 0.15)); },
  click() { tone(700, 0.05, 'sine', 0.05); },
};

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}
