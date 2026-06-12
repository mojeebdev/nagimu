/* NAGIMU — Web Audio API synthesized sounds */

let audioCtx = null;
let audioEnabled = true;

const ELEMENT_FREQ = {
  fire: 440,
  earth: 220,
  air: 528,
  water: 396,
};

export function isAudioEnabled() {
  return audioEnabled;
}

export function setAudioEnabled(enabled) {
  audioEnabled = Boolean(enabled);
}

function canPlay() {
  return audioEnabled && audioCtx?.state === 'running';
}

export async function initAudio() {
  if (!audioEnabled) return null;

  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      audioCtx = null;
      return null;
    }
  }

  if (audioCtx.state === 'suspended') {
    try {
      await audioCtx.resume();
    } catch {
      return null;
    }
  }

  return audioCtx;
}

function playTone({ frequency, duration, volume = 0.15, attack = 0.02, sustain = 0.3, release = 0.28 }) {
  if (!canPlay()) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, now);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + attack);
  gain.gain.setValueAtTime(volume, now + attack + sustain);
  gain.gain.linearRampToValueAtTime(0, now + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

export function playConvergence(element, clusterSize) {
  if (!canPlay()) return;

  const baseFreq = ELEMENT_FREQ[element] ?? 396;
  playTone({
    frequency: baseFreq,
    duration: 0.6,
    volume: 0.15,
    attack: 0.02,
    sustain: 0.3,
    release: 0.28,
  });

  if (clusterSize >= 5) {
    playTone({
      frequency: baseFreq * 1.5,
      duration: 0.6,
      volume: 0.3,
      attack: 0.02,
      sustain: 0.3,
      release: 0.28,
    });
  }
}

export function playOrbSpawn() {
  if (!canPlay()) return;
  playTone({
    frequency: 600,
    duration: 0.15,
    volume: 0.08,
    attack: 0.01,
    sustain: 0,
    release: 0.14,
  });
}

export function playBreathGateStart() {
  if (!canPlay()) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(110, now);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 1.5);
  gain.gain.setValueAtTime(0.12, now + 5.5);
  gain.gain.linearRampToValueAtTime(0, now + 7);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 7.1);
}

export function playSessionEnd(score) {
  if (!canPlay()) return;

  if (score > 0) {
    playTone({
      frequency: 330,
      duration: 1.2,
      volume: 0.15,
      attack: 0.05,
      sustain: 0.7,
      release: 0.45,
    });
    playTone({
      frequency: 495,
      duration: 1.2,
      volume: 0.15,
      attack: 0.05,
      sustain: 0.7,
      release: 0.45,
    });
  } else {
    playTone({
      frequency: 165,
      duration: 0.8,
      volume: 0.15,
      attack: 0.05,
      sustain: 0.4,
      release: 0.35,
    });
  }
}