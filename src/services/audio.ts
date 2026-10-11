import { AmbientSound, BellTone } from './storage';

// Web Audio API Synthesizer for Bell Chimes & Procedural Nature Soundscapes

let audioCtx: AudioContext | null = null;

// Soundscape audio nodes
let activeSoundscapeType: AmbientSound = 'silence';
let soundscapeSources: AudioNode[] = [];
let soundscapeMasterGain: GainNode | null = null;
let soundscapeIntervals: number[] = [];

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Synthesizes a soft, harmonic bell chime with gentle exponential decay.
 */
export function playBellChime(tone: BellTone = 'singing-bowl') {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    let frequencies: number[] = [528, 1056, 1584, 2112];
    let gains: number[] = [0.45, 0.18, 0.08, 0.03];
    let decayDuration = 3.6;

    if (tone === 'temple-bell') {
      frequencies = [216, 432, 864, 1296];
      gains = [0.55, 0.22, 0.10, 0.04];
      decayDuration = 4.5;
    } else if (tone === 'wood-clapper') {
      frequencies = [640, 1280];
      gains = [0.4, 0.15];
      decayDuration = 1.1;
    }

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.998, now + decayDuration);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(gains[idx], now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decayDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decayDuration);
    });

    // Gentle tactile haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch {
        // Ignored
      }
    }
  } catch (err) {
    console.warn('Audio chime error:', err);
  }
}

/**
 * Helper to generate pink noise buffer
 */
function createNoiseBuffer(ctx: AudioContext, seconds = 3): AudioBuffer {
  const bufferSize = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    data[i] = (b0 + b1 + b2) * 0.25;
  }
  return buffer;
}

/**
 * Starts continuous natural soundscape synthesized directly in code.
 */
export function startSoundscape(type: AmbientSound, volume = 0.08) {
  if (type === 'silence') {
    stopSoundscape();
    return;
  }

  try {
    stopSoundscape();
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    activeSoundscapeType = type;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.linearRampToValueAtTime(volume, now + 1.8);
    masterGain.connect(ctx.destination);
    soundscapeMasterGain = masterGain;

    if (type === 'wind') {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 3);
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, now);
      filter.Q.setValueAtTime(1.1, now);

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, now); // 8-second slow swell
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(80, now);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start(now);

      noise.connect(filter);
      filter.connect(masterGain);
      noise.start(now);

      soundscapeSources.push(noise, lfo);
    } else if (type === 'rain') {
      // Soft gentle raindrops on leaves
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 2.5);
      noise.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(850, now);
      bandpass.Q.setValueAtTime(0.6, now);

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(1800, now);

      noise.connect(bandpass);
      bandpass.connect(lowpass);
      lowpass.connect(masterGain);
      noise.start(now);

      soundscapeSources.push(noise);
    } else if (type === 'crickets') {
      // Warm twilight evening crickets chirp
      const chirpGain = ctx.createGain();
      chirpGain.gain.setValueAtTime(0.0001, now);
      chirpGain.connect(masterGain);

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(4600, now);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(4950, now);

      osc1.connect(chirpGain);
      osc2.connect(chirpGain);
      osc1.start(now);
      osc2.start(now);
      soundscapeSources.push(osc1, osc2);

      // Periodic chirp bursts every ~1.5 - 2.5 seconds
      const intervalId = window.setInterval(() => {
        try {
          const t = ctx.currentTime;
          chirpGain.gain.cancelScheduledValues(t);
          chirpGain.gain.setValueAtTime(0.0001, t);
          // Rhythmic burst
          chirpGain.gain.linearRampToValueAtTime(0.25, t + 0.04);
          chirpGain.gain.linearRampToValueAtTime(0.03, t + 0.08);
          chirpGain.gain.linearRampToValueAtTime(0.25, t + 0.12);
          chirpGain.gain.linearRampToValueAtTime(0.03, t + 0.16);
          chirpGain.gain.linearRampToValueAtTime(0.22, t + 0.20);
          chirpGain.gain.linearRampToValueAtTime(0.0001, t + 0.26);
        } catch {
          // ignore
        }
      }, 1600);
      soundscapeIntervals.push(intervalId);
    } else if (type === 'stream') {
      // Flowing water stream
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 3);
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(540, now);
      filter.Q.setValueAtTime(1.8, now);

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.38, now); // water ripple rate
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(180, now);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start(now);

      noise.connect(filter);
      filter.connect(masterGain);
      noise.start(now);
      soundscapeSources.push(noise, lfo);
    }
  } catch (err) {
    console.warn('Soundscape audio error:', err);
  }
}

/**
 * Stops any playing soundscape with a gentle fade.
 */
export function stopSoundscape() {
  soundscapeIntervals.forEach((id) => clearInterval(id));
  soundscapeIntervals = [];

  if (soundscapeMasterGain && audioCtx) {
    try {
      const now = audioCtx.currentTime;
      soundscapeMasterGain.gain.cancelScheduledValues(now);
      soundscapeMasterGain.gain.setValueAtTime(soundscapeMasterGain.gain.value, now);
      soundscapeMasterGain.gain.linearRampToValueAtTime(0.0001, now + 0.6);
      setTimeout(() => {
        soundscapeSources.forEach((node) => {
          try {
            if ('stop' in node) (node as AudioScheduledSourceNode).stop();
          } catch {
            // Already stopped
          }
        });
        soundscapeSources = [];
        soundscapeMasterGain = null;
      }, 700);
    } catch {
      soundscapeSources = [];
      soundscapeMasterGain = null;
    }
  } else {
    soundscapeSources = [];
    soundscapeMasterGain = null;
  }
  activeSoundscapeType = 'silence';
}

// Aliases for backwards compatibility
export const startWind = () => startSoundscape('wind');
export const stopWind = () => stopSoundscape();
