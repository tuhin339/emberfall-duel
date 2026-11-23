// Emberfall Duel's whole orchestra is a handful of WebAudio blips synthesised on the
// spot — no audio files, nothing fetched. The context is created lazily on the first
// sound (browsers insist a person has interacted first), and every failure is silent:
// a duel must never break because a speaker stayed asleep.

let ctx = null;

function context() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, seconds, { type = 'square', vol = 0.07, delay = 0, slide = 0 } = {}) {
  const ac = context();
  if (!ac) return;
  try {
    const at = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(28, freq + slide), at + seconds);
    gain.gain.setValueAtTime(vol, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
    osc.connect(gain).connect(ac.destination);
    osc.start(at);
    osc.stop(at + seconds + 0.03);
  } catch {
    /* a missed blip is not an error worth surfacing */
  }
}

export const sfx = {
  play() { tone(520, 0.09, { type: 'triangle', vol: 0.09 }); tone(784, 0.13, { type: 'triangle', vol: 0.09, delay: 0.07 }); },
  hit() { tone(150, 0.16, { type: 'sawtooth', vol: 0.12, slide: -80 }); },
  death() { tone(330, 0.32, { type: 'square', vol: 0.08, slide: -270 }); },
  heal() { tone(440, 0.1, { type: 'sine', vol: 0.09 }); tone(660, 0.16, { type: 'sine', vol: 0.09, delay: 0.08 }); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.17, { type: 'triangle', vol: 0.1, delay: i * 0.1 })); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.21, { type: 'triangle', vol: 0.1, delay: i * 0.11 })); },
};

/** Play and clear the sound cues the engine queued on the state. */
export function drainFx(state) {
  const queued = state.fx.splice(0, state.fx.length);
  for (const name of queued) {
    if (sfx[name]) sfx[name]();
  }
}
