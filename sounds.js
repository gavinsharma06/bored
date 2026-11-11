// Every sound is synthesized with Web Audio, so there are no files to load.
const sounds = (() => {
  const DRUM_GAP_SECONDS = 0.045;
  const SCHEDULE_AHEAD_SECONDS = 0.1;

  let context = null;
  let master = null;
  let noise = null;
  let drumrollTimer = null;

  // Browsers only allow audio after a user gesture, so the context is created lazily.
  function audio() {
    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.6;
      master.connect(context.destination);
    }

    if (context.state === "suspended") {
      context.resume();
    }

    return context;
  }

  function noiseBuffer() {
    if (!noise) {
      const ctx = audio();
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const samples = noise.getChannelData(0);

      for (let index = 0; index < samples.length; index++) {
        samples[index] = Math.random() * 2 - 1;
      }
    }

    return noise;
  }

  function tone({ frequency, type = "square", start = 0, duration = 0.15, volume = 0.2, slideTo = null }) {
    const ctx = audio();
    const at = ctx.currentTime + start;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);

    if (slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(slideTo, at + duration);
    }

    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain).connect(master);
    oscillator.start(at);
    oscillator.stop(at + duration);
  }

  function burst({ at, duration, volume, filterType, frequency }) {
    const ctx = audio();
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    source.buffer = noiseBuffer();
    filter.type = filterType;
    filter.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(filter).connect(gain).connect(master);
    source.start(at);
    source.stop(at + duration);
  }

  function tick() {
    tone({ frequency: 1900, duration: 0.03, volume: 0.06 });
  }

  function startDrumroll() {
    const ctx = audio();
    const startedAt = ctx.currentTime;
    let nextHit = startedAt;

    stopDrumroll();

    // Schedule snare hits slightly ahead of time so timer jitter never makes the roll stutter.
    drumrollTimer = setInterval(() => {
      while (nextHit < ctx.currentTime + SCHEDULE_AHEAD_SECONDS) {
        const swell = Math.min((nextHit - startedAt) / 4, 1);
        const volume = 0.08 + swell * 0.14 + Math.random() * 0.04;
        burst({ at: nextHit, duration: 0.06, volume, filterType: "bandpass", frequency: 1800 });
        nextHit += DRUM_GAP_SECONDS;
      }
    }, 25);
  }

  function stopDrumroll() {
    clearInterval(drumrollTimer);
    drumrollTimer = null;
  }

  function crash() {
    burst({ at: audio().currentTime, duration: 1.4, volume: 0.35, filterType: "highpass", frequency: 5000 });
  }

  function fanfare() {
    const notes = [523, 659, 784, 1047];

    notes.forEach((frequency, index) => {
      tone({ frequency, type: "sawtooth", start: index * 0.11, duration: 0.18, volume: 0.12 });
    });

    tone({ frequency: 1047, type: "sawtooth", start: 0.44, duration: 0.7, volume: 0.14 });
    tone({ frequency: 784, type: "square", start: 0.44, duration: 0.7, volume: 0.06 });
  }

  function sadTrombone() {
    const notes = [[392, 370], [370, 349], [349, 330]];

    notes.forEach(([from, to], index) => {
      tone({ frequency: from, slideTo: to, type: "sawtooth", start: index * 0.45, duration: 0.42, volume: 0.13 });
    });

    tone({ frequency: 330, slideTo: 262, type: "sawtooth", start: 1.35, duration: 1.2, volume: 0.13 });
  }

  function brass({ frequency, start, duration, volume = 0.1 }) {
    const ctx = audio();
    const at = ctx.currentTime + start;
    const oscillator = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    oscillator.type = "sawtooth";
    oscillator.frequency.value = frequency;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(500, at);
    filter.frequency.exponentialRampToValueAtTime(3200, at + 0.08);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.04);
    gain.gain.setValueAtTime(volume, at + duration - 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(filter).connect(gain).connect(master);
    oscillator.start(at);
    oscillator.stop(at + duration);
  }

  function horn() {
    const chord = [523, 659, 784];
    const pickups = [0, 0.16, 0.32];

    pickups.forEach((start) => {
      chord.forEach((frequency) => brass({ frequency: frequency / 2, start, duration: 0.13, volume: 0.07 }));
    });

    chord.forEach((frequency) => brass({ frequency, start: 0.5, duration: 1.8, volume: 0.08 }));
    brass({ frequency: 1047, start: 0.5, duration: 1.8, volume: 0.05 });
  }

  function soClose() {
    tone({ frequency: 520, slideTo: 300, type: "triangle", duration: 0.9, volume: 0.18 });
    tone({ frequency: 390, slideTo: 225, type: "triangle", duration: 0.9, volume: 0.14 });
    burst({ at: audio().currentTime, duration: 0.9, volume: 0.08, filterType: "bandpass", frequency: 700 });
  }

  return { tick, startDrumroll, stopDrumroll, crash, fanfare, sadTrombone, horn, soClose };
})();
