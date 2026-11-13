/* =========================================================================
   AUDIO: Web Audio synthesizer for SFX + ambient soundscapes.
   No audio files are needed. When Member 3 delivers real recordings, map
   them in AudioFX.files, e.g.:
       AudioFX.files.chime = 'assets/audio/spirit_chime.mp3';
   and AudioFX.play('chime') will use the file instead of the synth.
   ========================================================================= */
(function () {
  let ctx = null, master = null, sfxBus = null, ambBus = null, noiseBuf = null;
  let muted = false;
  const amb = { name: null, nodes: [], timers: [] };
  const files = {};

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.8; sfxBus.connect(master);
    ambBus = ctx.createGain(); ambBus.gain.value = 0.32; ambBus.connect(master);
    noiseBuf = makeNoise();
    return ctx;
  }

  function makeNoise() {
    const len = ctx.sampleRate * 2;
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  /** Must be called from a user gesture (click / key) to allow sound. */
  function unlock() {
    const c = ensure();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    if (amb.name && amb.nodes.length === 0) buildAmbience(amb.name);
  }

  const now = () => (ctx ? ctx.currentTime : 0);
  const ready = () => !!ctx && ctx.state === 'running';

  /* ---------- primitive voices ---------- */
  function tone(o) {
    const start = o.start != null ? o.start : now();
    const dur = o.dur || 0.2, vol = o.vol || 0.3, attack = o.attack || 0.005;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.freq || 440, start);
    if (o.endFreq) osc.frequency.exponentialRampToValueAtTime(o.endFreq, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g); g.connect(o.dest || sfxBus);
    osc.start(start); osc.stop(start + dur + 0.05);
  }

  function noise(o) {
    const start = o.start != null ? o.start : now();
    const dur = o.dur || 0.2, vol = o.vol || 0.3, attack = o.attack || 0.003;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = o.type || 'bandpass';
    f.frequency.value = o.freq || 2000; f.Q.value = o.q || 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    s.connect(f); f.connect(g); g.connect(o.dest || sfxBus);
    s.start(start, Math.random() * 1.2); s.stop(start + dur + 0.05);
  }

  /* ---------- sound recipes (t = AudioContext time) ---------- */
  const synth = {
    click(t) { tone({ freq: 660, type: 'triangle', dur: 0.07, vol: 0.12, start: t }); },
    pop(t) { tone({ freq: 520, endFreq: 1040, dur: 0.12, vol: 0.16, start: t }); },
    flip(t) { noise({ start: t, dur: 0.09, vol: 0.12, freq: 1800, q: 0.6 }); },
    chime(t) { [880, 1108.7, 1318.5, 1760].forEach((f, i) => tone({ freq: f, dur: 1.4, vol: 0.1, start: t + i * 0.07 })); },
    leaf(t) {
      noise({ start: t, dur: 0.3, vol: 0.22, freq: 3500, q: 0.8 });
      noise({ start: t + 0.08, dur: 0.25, vol: 0.14, freq: 5200, q: 1 });
    },
    wood(t) {
      tone({ freq: 200, endFreq: 90, type: 'triangle', dur: 0.18, vol: 0.4, start: t });
      noise({ start: t, dur: 0.08, vol: 0.2, freq: 900, q: 2 });
    },
    chisel(t) {
      noise({ start: t, dur: 0.06, vol: 0.2, type: 'highpass', freq: 2500 + Math.random() * 1500, q: 0.7 });
      tone({ freq: 1700 + Math.random() * 500, type: 'square', dur: 0.03, vol: 0.025, start: t });
    },
    weave(t) {
      noise({ start: t, dur: 0.16, vol: 0.16, freq: 2400, q: 1.4 });
      tone({ freq: 420, endFreq: 520, type: 'triangle', dur: 0.12, vol: 0.08, start: t });
    },
    wrong(t) { tone({ freq: 150, endFreq: 105, type: 'sawtooth', dur: 0.25, vol: 0.09, start: t }); },
    match(t) { [660, 990].forEach((f, i) => tone({ freq: f, dur: 0.5, vol: 0.13, start: t + i * 0.09 })); },
    victory(t) {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
        tone({ freq: f, type: 'triangle', dur: 0.9, vol: 0.14, start: t + i * 0.11 }));
      synth.gong(t + 0.55, 0.22);
    },
    // Bamboo stamper: hollow "tok". lane 0 = low, 1 = mid, 2 = high
    tuntung(t, lane, vol) {
      const base = [150, 200, 265][lane == null ? 1 : lane] || 200;
      const v = vol || 0.5;
      tone({ freq: base * 1.6, endFreq: base, dur: 0.22, vol: v, start: t, attack: 0.002 });
      noise({ start: t, dur: 0.05, vol: v * 0.45, freq: base * 6, q: 3 });
    },
    drum(t, vol) { tone({ freq: 110, endFreq: 55, dur: 0.3, vol: vol || 0.3, start: t, attack: 0.002 }); },
    gong(t, vol) {
      const v = vol || 0.28;
      [110, 165.5, 220.6, 293.7, 371].forEach((f, i) =>
        tone({ freq: f, dur: 2.8 - i * 0.3, vol: v / (i + 1.3), start: t, attack: 0.01 }));
    }
  };

  function playFile(url, volume) {
    if (muted) return;
    try {
      const a = new Audio(url);
      a.volume = volume == null ? 0.8 : volume;
      a.play().catch(() => {});
    } catch (e) { /* ignore */ }
  }

  /** Play a named sound now. Extra args are passed to the recipe. */
  function play(name) {
    const args = Array.prototype.slice.call(arguments, 1);
    if (files[name]) return playFile(files[name]);
    if (muted) return;
    const c = ensure();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    const fn = synth[name];
    if (fn) { try { fn.apply(null, [now() + 0.01].concat(args)); } catch (e) { /* ignore */ } }
  }

  /** Schedule a sound at an exact AudioContext time (used by the rhythm game). */
  function schedule(name, time) {
    if (!ctx || !synth[name]) return;
    const args = Array.prototype.slice.call(arguments, 2);
    try { synth[name].apply(null, [time].concat(args)); } catch (e) { /* ignore */ }
  }

  /* ---------- ambient soundscapes ---------- */
  function loopNoise(freq, vol, type) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq;
    const g = ctx.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(ambBus); s.start();
    amb.nodes.push(s);
    return g;
  }

  function lfo(param, rate, depth) {
    const o = ctx.createOscillator(); o.frequency.value = rate;
    const g = ctx.createGain(); g.gain.value = depth;
    o.connect(g); g.connect(param); o.start();
    amb.nodes.push(o);
  }

  function pad(freqs, vol) {
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      o.detune.value = (i % 2 ? 6 : -6);
      const g = ctx.createGain(); g.gain.value = vol;
      o.connect(g); g.connect(ambBus); o.start();
      amb.nodes.push(o);
      lfo(g.gain, 0.05 + i * 0.03, vol * 0.6);
    });
  }

  function every(minMs, maxMs, fn) {
    const loop = () => {
      const id = setTimeout(() => { if (!muted && ready()) fn(now()); loop(); }, minMs + Math.random() * (maxMs - minMs));
      amb.timers.push(id);
    };
    loop();
  }

  const bird = (t) => {
    const f = 2400 + Math.random() * 1400;
    for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
      tone({ freq: f, endFreq: f * 1.35, dur: 0.09, vol: 0.035, start: t + i * 0.13, dest: ambBus });
    }
  };

  function buildAmbience(name) {
    if (!ensure()) return;
    if (name === 'map') {
      const waves = loopNoise(450, 0.12); lfo(waves.gain, 0.08, 0.1);
      pad([98, 147, 196], 0.025);
      every(4000, 9000, bird);
    } else if (name === 'mangrove') {
      const waves = loopNoise(600, 0.14); lfo(waves.gain, 0.11, 0.12);
      loopNoise(5000, 0.012, 'highpass');
      every(1800, 5000, bird);
    } else if (name === 'hut') {
      loopNoise(300, 0.06);
      pad([110, 165], 0.03);
      every(5000, 11000, bird);
    } else if (name === 'bench') {
      loopNoise(800, 0.05);
      pad([82.4, 123.5], 0.02);
      every(3500, 8000, bird);
    } else if (name === 'fire') {
      const roar = loopNoise(900, 0.1); lfo(roar.gain, 0.3, 0.04);
      every(60, 380, (t) => noise({ start: t, dur: 0.03 + Math.random() * 0.04, vol: 0.05 + Math.random() * 0.08, type: 'highpass', freq: 2500, dest: ambBus }));
    }
  }

  function stopAmbience() {
    amb.nodes.forEach((n) => { try { n.stop(); } catch (e) { /* already stopped */ } try { n.disconnect(); } catch (e) { /* ignore */ } });
    amb.timers.forEach(clearTimeout);
    amb.nodes = []; amb.timers = [];
  }

  function setAmbience(name) {
    if (amb.name === name && amb.nodes.length) return;
    stopAmbience();
    amb.name = name || null;
    if (name && ctx) buildAmbience(name);
  }

  function setMuted(b) {
    muted = !!b;
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, now(), 0.05);
  }

  window.AudioFX = {
    files, unlock, play, schedule, playFile, setAmbience, setMuted, now, ready,
    get muted() { return muted; }
  };
})();
