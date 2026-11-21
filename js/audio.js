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
    if (c.state === 'suspended') {
      const r = c.resume();
      if (r && r.catch) r.catch(() => {}); // still blocked: the next interaction retries
    }
    if (amb.name && amb.nodes.length === 0) buildAmbience(amb.name);
    if (music.el && music.el.paused) music.el.play().catch(() => {});
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

  /* ---------- background music ----------
     startMusic('title') plays a looping game theme composed in code below.
     To use a real recording instead, set e.g.
         AudioFX.files.music_title = 'assets/audio/title_music.mp3';
     Browsers keep sound off until the first click/tap/key, so the music starts then. */
  const MUSIC_VOL = 0.55;
  const FILE_MUSIC_VOL = 0.5;
  const music = { name: null, timer: null, bus: null, el: null, step: 0, next: 0, fadedIn: false };

  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12); // MIDI note number -> Hz

  // Theme in D major pentatonic, 100 BPM, 8 eighth-note steps per bar.
  const M_STEP = 60 / 100 / 2;
  const M_INTRO_BARS = 2;
  // One chord per 2 bars: D, Bm, G, A  (bass root + pad/arp tones)
  const M_CHORDS = [
    { bass: 50, tones: [62, 66, 69] }, // D
    { bass: 47, tones: [59, 62, 66] }, // Bm
    { bass: 43, tones: [59, 62, 67] }, // G
    { bass: 45, tones: [61, 64, 69] }  // A
  ];
  // Melodies: per bar, a list of [step, midi note, length in steps]
  const M_MELODY_A = [
    [[0, 69, 2], [2, 71, 1], [3, 69, 1], [4, 66, 2], [6, 64, 2]],
    [[0, 62, 3], [3, 64, 1], [4, 66, 2], [6, 69, 2]],
    [[0, 71, 2], [2, 74, 2], [4, 71, 1], [5, 69, 1], [6, 66, 2]],
    [[0, 66, 4], [4, 64, 2], [6, 62, 2]],
    [[0, 62, 2], [2, 64, 1], [3, 62, 1], [4, 59, 2], [6, 62, 2]],
    [[0, 64, 2], [2, 66, 2], [4, 69, 4]],
    [[0, 69, 2], [2, 71, 1], [3, 69, 1], [4, 64, 2], [6, 66, 1], [7, 64, 1]],
    [[0, 64, 4], [4, 62, 1], [5, 64, 1], [6, 66, 2]]
  ];
  const M_MELODY_B = [
    [[0, 74, 1], [1, 76, 1], [2, 78, 2], [4, 76, 1], [5, 74, 1], [6, 69, 2]],
    [[0, 71, 1], [1, 69, 1], [2, 66, 2], [4, 69, 4]],
    [[0, 74, 1], [1, 76, 1], [2, 78, 2], [4, 81, 2], [6, 78, 2]],
    [[0, 76, 2], [2, 74, 2], [4, 71, 4]],
    [[0, 71, 1], [1, 74, 1], [2, 76, 2], [4, 74, 1], [5, 71, 1], [6, 69, 2]],
    [[0, 71, 2], [2, 74, 2], [4, 76, 4]],
    [[0, 76, 1], [1, 78, 1], [2, 76, 1], [3, 74, 1], [4, 71, 2], [6, 69, 2]],
    [[0, 69, 3], [3, 71, 1], [4, 69, 2], [6, 64, 2]]
  ];

  /** Sustained voice with attack/release and optional vibrato (flute, pad, bass). */
  function mNote(o) {
    const t = o.start, dur = o.dur, vol = o.vol;
    const attack = o.attack || 0.02, release = o.release || 0.15;
    const osc = ctx.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.freq, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.setTargetAtTime(vol * 0.7, t + attack, dur * 0.6);
    g.gain.setTargetAtTime(0.0001, t + dur, release / 3);
    let out = g;
    if (o.lowpass) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lowpass;
      g.connect(f); out = f;
    }
    osc.connect(g); out.connect(music.bus);
    const end = t + dur + release * 2 + 0.05;
    osc.start(t); osc.stop(end);
    if (o.vibrato) {
      const l = ctx.createOscillator(); l.frequency.value = 5.2;
      const lg = ctx.createGain();
      lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(o.freq * 0.012, t + Math.min(0.35, dur));
      l.connect(lg); lg.connect(osc.frequency);
      l.start(t); l.stop(end);
    }
  }

  /** Schedule everything that sounds on one eighth-note step of the theme. */
  function musicStep(step, t) {
    const bus = music.bus;
    const bar = Math.floor(step / 8), s = step % 8;
    const intro = bar < M_INTRO_BARS;
    const loopBar = intro ? -1 : (bar - M_INTRO_BARS) % 16;
    const chord = M_CHORDS[intro ? 0 : Math.floor((loopBar % 8) / 2)];
    const beat = (n) => t + n * M_STEP;

    // Pad: a soft sustained chord every 2 bars
    if (s === 0 && (intro ? bar === 0 : loopBar % 2 === 0)) {
      const len = (intro ? M_INTRO_BARS : 2) * 8 * M_STEP;
      chord.tones.forEach((m) => mNote({ freq: hz(m - 12), start: t, dur: len - 0.1, vol: 0.028, attack: 0.6, release: 0.8 }));
    }
    // Gong: marks the start of the piece and every 4 bars (gamelan-style cycle)
    if (s === 0 && (bar === 0 || (!intro && loopBar % 4 === 0))) {
      [110, 165.5, 220.6, 293.7].forEach((f, i) => tone({ freq: f, dur: 3 - i * 0.4, vol: 0.13 / (i + 1.3), start: t, attack: 0.01, dest: bus }));
    }
    // Shaker on every eighth, accented off-beats
    noise({ start: t, dur: 0.05, vol: s % 2 ? 0.03 : 0.016, type: 'highpass', freq: 6000, q: 0.7, dest: bus });
    // Bamboo tuntung pattern (low / mid / high)
    const tun = { 0: 1, 2: 2, 4: 0, 5: 2, 6: 1 };
    if (tun[s] !== undefined) {
      const base = [150, 200, 265][tun[s]];
      const v = intro ? 0.09 : 0.15;
      tone({ freq: base * 1.6, endFreq: base, dur: 0.2, vol: v, start: t, attack: 0.002, dest: bus });
      noise({ start: t, dur: 0.04, vol: v * 0.4, freq: base * 6, q: 3, dest: bus });
    }
    if (intro) return;

    // Frame drum: tresillo groove, with a fill at the end of each 16-bar loop
    const drumSteps = loopBar === 15 ? [0, 3, 6, 7] : [0, 3, 6];
    if (drumSteps.includes(s)) tone({ freq: 110, endFreq: 55, dur: 0.28, vol: s === 0 ? 0.26 : 0.18, start: t, attack: 0.002, dest: bus });
    // Bass on beats 1 and 3
    if (s === 0 || s === 4) mNote({ freq: hz(chord.bass), start: t, dur: 3.5 * M_STEP, vol: 0.12, type: 'triangle', attack: 0.01, release: 0.1, lowpass: 600 });
    // Plucked ostinato: off-beats in section A, every eighth in section B
    if (loopBar >= 8 || s % 2) {
      const m = chord.tones[[0, 1, 2, 1, 0, 1, 2, 1][s]] + 12;
      tone({ freq: hz(m), dur: 0.22, vol: 0.045, type: 'triangle', start: t, attack: 0.003, dest: bus });
    }
    // Spirit sparkle at the top of each 8-bar section
    if (s === 0 && loopBar % 8 === 0) {
      [86, 83, 81, 78, 74].forEach((m, i) => tone({ freq: hz(m), dur: 0.8, vol: 0.035, start: beat(i * 0.25), dest: bus }));
    }
    // Flute melody
    const mel = (loopBar < 8 ? M_MELODY_A : M_MELODY_B)[loopBar % 8];
    mel.forEach(([st, m, len]) => {
      if (st === s) mNote({ freq: hz(m), start: t, dur: len * M_STEP * 0.95, vol: 0.085, attack: 0.04, release: 0.2, vibrato: len >= 2 });
    });
  }

  function musicTick() {
    // Wait for the first gesture to unlock audio; rest while the tab is hidden
    if (!ctx || ctx.state !== 'running' || !music.bus || document.hidden) { music.next = 0; return; }
    const t = ctx.currentTime;
    if (!music.fadedIn) {
      music.fadedIn = true;
      music.bus.gain.setValueAtTime(0.0001, t);
      music.bus.gain.exponentialRampToValueAtTime(MUSIC_VOL, t + 1.5);
    }
    // First tick, or the tab was in the background: skip ahead instead of bursting notes
    if (!music.next || music.next < t - 0.1) music.next = t + 0.08;
    while (music.next < t + 0.3) {
      try { musicStep(music.step, music.next); } catch (e) { /* ignore */ }
      music.step += 1;
      music.next += M_STEP;
    }
  }

  function startMusic(name) {
    if (!name) { stopMusic(); return; }
    if (music.name === name) return;
    stopMusic(0.3);
    music.name = name;

    const src = files['music_' + name];
    if (src) {
      try {
        const a = new Audio(src);
        a.loop = true;
        a.volume = muted ? 0 : FILE_MUSIC_VOL;
        music.el = a;
        a.play().catch(() => {}); // retried in unlock() after the first gesture
      } catch (e) { /* ignore */ }
      return;
    }

    const c = ensure();
    if (!c) return;
    music.bus = c.createGain();
    music.bus.gain.value = 0.0001;
    music.bus.connect(master);
    music.step = 0; music.next = 0; music.fadedIn = false;
    if (c.state === 'suspended') c.resume().catch(() => {}); // works only if the browser allows it
    music.timer = setInterval(musicTick, 50);
    musicTick();
  }

  function stopMusic(fade) {
    const f = fade == null ? 1.2 : fade;
    clearInterval(music.timer);
    music.timer = null;
    music.name = null;
    if (music.el) {
      const a = music.el;
      music.el = null;
      const v0 = a.volume, t0 = performance.now();
      const id = setInterval(() => {
        const k = f > 0 ? Math.min(1, (performance.now() - t0) / (f * 1000)) : 1;
        a.volume = v0 * (1 - k);
        if (k >= 1) { clearInterval(id); a.pause(); }
      }, 40);
    }
    if (music.bus && ctx) {
      const b = music.bus;
      const t = now();
      b.gain.cancelScheduledValues(t);
      b.gain.setValueAtTime(Math.max(0.0001, b.gain.value), t);
      b.gain.linearRampToValueAtTime(0, t + Math.max(0.02, f));
      setTimeout(() => { try { b.disconnect(); } catch (e) { /* ignore */ } }, (f + 4) * 1000);
    }
    music.bus = null;
  }

  function setMuted(b) {
    muted = !!b;
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, now(), 0.05);
    if (music.el) music.el.volume = muted ? 0 : FILE_MUSIC_VOL;
  }

  window.AudioFX = {
    files, unlock, play, schedule, playFile, setAmbience, setMuted, startMusic, stopMusic, now, ready,
    get muted() { return muted; }
  };
})();
