/* =========================================================================
   ACT IV: The Spirits Dance (Tarian Jo'oh rhythm finale)
   Tuntung (bamboo stampers) fall down 3 lanes. Hit A / S / D (or J K L,
   arrow keys, or tap the lane) when one reaches the glowing ring.
   Fill Spirit Harmony to 100% before the 45-second song ends.
   ========================================================================= */
window.Games = window.Games || {};
window.Games[4] = (function () {
  const BPM = 96;
  const BEAT = 60 / BPM;
  const SONG_BEATS = 72;                 // 72 beats at 96 BPM = 45 s
  const SONG_LEN = SONG_BEATS * BEAT;
  const TRAVEL = 1.7;                    // seconds a note takes to fall to the ring
  const HIT_Y = 0.82;                    // ring position (fraction of lane height)
  const START_Y = -0.12;
  const PERFECT = 0.075, GOOD = 0.15, STRAY = 0.3;
  const COUNTDOWN = 3 * BEAT;
  const KEYMAP = { a: 0, s: 1, d: 2, j: 0, k: 1, l: 2, arrowleft: 0, arrowdown: 1, arrowright: 2, '1': 0, '2': 1, '3': 2 };
  const KEY_LABELS = ['A', 'S', 'D'];

  let root, opts, timers, keyHandler, visHandler, raf;
  let lanes, laneNotes, rings, harmonyFill, harmonyText, comboEl, timeEl, startPanel, fireGlow;
  let chart, harmony, combo, bestCombo, running, won, t0, usingAudio, nextBeat, gainGood, gainPerfect, lastPulseBeat;

  function mount(host, o) {
    opts = o;
    timers = [];
    root = UI.el('div', { class: 'stage act4', style: { backgroundImage: 'url("' + ASSETS.act4.bg + '")' } });
    fireGlow = UI.el('div', { class: 'fire-glow' });
    root.appendChild(fireGlow);
    root.appendChild(UI.el('div', { class: 'lane-shade' }));

    // Top: harmony bar + combo + time
    harmonyFill = UI.el('span');
    harmonyText = UI.el('b', { text: '0%' });
    comboEl = UI.el('div', { class: 'rhythm-combo' });
    timeEl = UI.el('div', { class: 'rhythm-time' });
    root.appendChild(UI.el('div', { class: 'rhythm-top' }, [
      UI.el('div', { class: 'harmony' }, [
        UI.el('div', { class: 'harmony-label' }, [UI.el('span', { text: 'Spirit Harmony' }), harmonyText]),
        UI.el('div', { class: 'harmony-bar' }, [harmonyFill])
      ]),
      comboEl, timeEl
    ]));

    // Lanes
    const laneWrap = UI.el('div', { class: 'lanes' });
    lanes = []; rings = []; laneNotes = [];
    for (let i = 0; i < 3; i++) {
      const notesBox = UI.el('div', { class: 'lane-notes' });
      const ring = UI.el('div', { class: 'hit-ring', style: { top: HIT_Y * 100 + '%' } }, [UI.el('span', { text: KEY_LABELS[i] })]);
      const lane = UI.el('div', { class: 'lane', 'data-lane': i }, [notesBox, ring]);
      lane.addEventListener('pointerdown', (e) => { e.preventDefault(); press(i); });
      laneWrap.appendChild(lane);
      lanes.push(lane); rings.push(ring); laneNotes.push(notesBox);
    }
    root.appendChild(laneWrap);

    // Start / retry panel
    startPanel = UI.el('div', { class: 'rhythm-panel straw-panel' });
    root.appendChild(startPanel);
    showStartPanel('intro');

    keyHandler = (e) => {
      const k = (e.key || '').toLowerCase();
      if (KEYMAP[k] === undefined) return;
      if (UI.isBlocked()) return;
      e.preventDefault();
      if (e.repeat) return;
      press(KEYMAP[k]);
    };
    window.addEventListener('keydown', keyHandler);

    visHandler = () => { if (document.hidden && running) abort(); };
    document.addEventListener('visibilitychange', visHandler);

    host.appendChild(root);
    resetRun();
    render(0);
  }

  function showStartPanel(kind, pct) {
    startPanel.innerHTML = '';
    if (kind === 'intro') {
      startPanel.appendChild(UI.el('div', { class: 'panel-title', text: "Tarian Jo'oh" }));
      startPanel.appendChild(UI.el('p', { text: 'When a tuntung (bamboo stamper) reaches its glowing ring, press its key or tap the lane.' }));
      startPanel.appendChild(UI.el('div', { class: 'key-row' }, KEY_LABELS.map((k) => UI.el('kbd', { text: k }))));
      startPanel.appendChild(UI.el('p', { class: 'small', text: 'Perfect and Good hits fill the Spirit Harmony. Reach 100% before the 45-second song ends.' }));
    } else if (kind === 'fail') {
      startPanel.appendChild(UI.el('div', { class: 'panel-title', text: 'The spirits want more!' }));
      startPanel.appendChild(UI.el('p', { text: 'You reached ' + pct + '% Spirit Harmony. Listen to the drum and gong, and try again.' }));
    } else if (kind === 'paused') {
      startPanel.appendChild(UI.el('div', { class: 'panel-title', text: 'The dance paused' }));
      startPanel.appendChild(UI.el('p', { text: 'The song stopped while you were away. Start again when you are ready.' }));
    }
    startPanel.appendChild(UI.el('button', { class: 'btn-wood', text: kind === 'intro' ? 'Start the Dance' : 'Dance Again', onclick: begin }));
    startPanel.classList.remove('hidden');
  }

  function buildChart() {
    const pats = [[0, 1, 2, 1], [2, 1, 0, 1], [0, 2, 0, 2], [1, 0, 1, 2], [0, 1, 2, 2], [2, 0, 1, 0]];
    const notes = [];
    for (let b = 4; b < SONG_BEATS - 2; b++) {
      const section = b < 16 ? 0 : b < 44 ? 1 : 2;
      if (section === 0 && b % 2) continue;
      const lane = pats[Math.floor(b / 4) % pats.length][b % 4];
      notes.push({ t: b * BEAT, lane: lane });
      if (section === 2 && b % 4 === 3) notes.push({ t: (b + 0.5) * BEAT, lane: (lane + 1) % 3 });
    }
    notes.sort((a, b) => a.t - b.t);
    return notes.map((n) => ({ t: n.t, lane: n.lane, state: 'pending', el: null }));
  }

  function resetRun() {
    laneNotes.forEach((b) => { b.innerHTML = ''; });
    chart = buildChart();
    harmony = 0; combo = 0; bestCombo = 0; running = false; won = false;
    nextBeat = -3; lastPulseBeat = -99;
    gainGood = 100 / (chart.length * 0.7);
    gainPerfect = gainGood * 1.25;
    updateHud(SONG_LEN);
  }

  function clock() {
    return usingAudio ? AudioFX.now() - t0 : performance.now() / 1000 - t0;
  }

  function begin() {
    AudioFX.unlock();
    AudioFX.play('click');
    startPanel.classList.add('hidden');
    resetRun();
    usingAudio = AudioFX.ready();
    t0 = (usingAudio ? AudioFX.now() : performance.now() / 1000) + COUNTDOWN + 0.1;
    running = true;
    root.classList.remove('celebrate');
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function abort() {
    running = false;
    cancelAnimationFrame(raf);
    showStartPanel('paused');
  }

  /* ---------- audio guide: soft drum on every beat, gong on every bar ---------- */
  function scheduleAudio(st) {
    if (!usingAudio) return;
    while (nextBeat * BEAT < st + 0.25 && nextBeat < SONG_BEATS) {
      const at = t0 + nextBeat * BEAT;
      if (nextBeat < 0) AudioFX.schedule('gong', at, 0.16);          // countdown
      else if (nextBeat % 4 === 0) AudioFX.schedule('gong', at, 0.12);
      else AudioFX.schedule('drum', at, 0.22);
      nextBeat += 1;
    }
  }

  function loop() {
    if (!running) return;
    const st = clock();
    scheduleAudio(st);
    render(st);
    raf = requestAnimationFrame(loop);
  }

  function render(st) {
    // Countdown
    if (running && st < 0) {
      const n = Math.ceil(-st / BEAT);
      comboEl.textContent = n > 0 ? String(n) : '';
      comboEl.classList.add('countdown');
    } else {
      comboEl.classList.remove('countdown');
      comboEl.textContent = combo >= 2 ? combo + ' combo' : '';
    }

    // Beat pulse on rings + fire
    const beatNo = Math.floor(st / BEAT);
    if (running && st >= 0 && beatNo !== lastPulseBeat) {
      lastPulseBeat = beatNo;
      rings.forEach((r) => { r.classList.remove('pulse'); void r.offsetWidth; r.classList.add('pulse'); });
      fireGlow.classList.remove('pulse'); void fireGlow.offsetWidth; fireGlow.classList.add('pulse');
    }

    // Notes
    const laneH = lanes[0].clientHeight;
    for (let i = 0; i < chart.length; i++) {
      const n = chart[i];
      if (n.state !== 'pending') continue;
      const dt = n.t - st;
      if (dt > TRAVEL + 0.1) break;
      if (!n.el) {
        n.el = UI.el('div', { class: 'note' }, [UI.el('img', { src: ASSETS.act4.tuntung[n.lane], alt: '', draggable: 'false' })]);
        laneNotes[n.lane].appendChild(n.el);
      }
      const frac = HIT_Y - (dt / TRAVEL) * (HIT_Y - START_Y);
      n.el.style.transform = 'translate3d(-50%,' + (frac * laneH) + 'px,0) translateY(-50%)';
      if (dt < -GOOD) miss(n);
    }

    if (running) updateHud(SONG_LEN - Math.max(0, st));
    if (running && st > SONG_LEN + 0.8 && !won) fail();
  }

  function press(lane) {
    if (!running) return;
    const st = clock();
    AudioFX.play('tuntung', lane, 0.45);
    lanes[lane].classList.remove('flash'); void lanes[lane].offsetWidth; lanes[lane].classList.add('flash');
    if (st < -0.2) return;

    let best = null, bestDt = Infinity;
    for (let i = 0; i < chart.length; i++) {
      const n = chart[i];
      if (n.state !== 'pending' || n.lane !== lane) continue;
      const d = Math.abs(n.t - st);
      if (d < bestDt) { bestDt = d; best = n; }
      if (n.t - st > STRAY) break;
    }

    if (best && bestDt <= GOOD) {
      const perfect = bestDt <= PERFECT;
      best.state = 'hit';
      combo += 1; bestCombo = Math.max(bestCombo, combo);
      const bonus = combo >= 8 ? 1.25 : 1;
      const gain = (perfect ? gainPerfect : gainGood) * bonus;
      harmony = Math.min(100, harmony + gain);
      if (best.el) { const el = best.el; el.classList.add('hit'); setTimeout(() => el.remove(), 300); }
      rings[lane].classList.remove('hit'); void rings[lane].offsetWidth; rings[lane].classList.add('hit');
      judge(lane, perfect ? 'Perfect!' : 'Good', perfect ? 'gold' : 'teal');
      const c = UI.centerIn(rings[lane], root);
      UI.float(root, c.x, c.y - 50, '+' + Math.round(gain * 4) + ' Harmony', 'teal small');
      UI.burst(root, c.x, c.y, perfect ? 8 : 4, 'ember');
      if (harmony >= 100) win();
    } else if (!best || bestDt > STRAY) {
      // Stray press: small penalty so button-mashing does not work
      harmony = Math.max(0, harmony - 0.6);
      combo = 0;
    }
  }

  function miss(n) {
    n.state = 'miss';
    combo = 0;
    harmony = Math.max(0, harmony - 2);
    if (n.el) { const el = n.el; el.classList.add('missed'); setTimeout(() => el.remove(), 400); }
    judge(n.lane, 'Miss', 'red');
  }

  function judge(lane, text, cls) {
    const c = UI.centerIn(rings[lane], root);
    UI.float(root, c.x, c.y - 20, text, cls);
  }

  function updateHud(remaining) {
    const pct = Math.floor(harmony);
    harmonyFill.style.width = harmony + '%';
    harmonyText.textContent = pct + '%';
    timeEl.textContent = '⏳ ' + Math.max(0, Math.ceil(remaining)) + 's';
  }

  function win() {
    won = true;
    running = false;
    cancelAnimationFrame(raf);
    updateHud(SONG_LEN - Math.max(0, clock()));
    harmonyText.textContent = '100%';
    chart.forEach((n) => { if (n.el && n.state === 'pending') n.el.classList.add('missed'); });
    State.data.stats.act4BestCombo = Math.max(State.data.stats.act4BestCombo || 0, bestCombo);
    State.save();
    root.classList.add('celebrate');
    for (let i = 0; i < 4; i++) {
      timers.push(setTimeout(() => {
        if (!root) return;
        const r = root.getBoundingClientRect();
        UI.burst(root, r.width * (0.3 + Math.random() * 0.4), r.height * (0.4 + Math.random() * 0.3), 16, 'ember');
      }, i * 250));
    }
    AudioFX.play('gong', 0.3);
    UI.toast('The ancestors join the dance! Best combo: ' + bestCombo, 2800);
    timers.push(setTimeout(() => opts.onComplete(), 2600));
  }

  function fail() {
    running = false;
    cancelAnimationFrame(raf);
    AudioFX.play('wrong');
    showStartPanel('fail', Math.floor(harmony));
  }

  function unmount() {
    running = false;
    cancelAnimationFrame(raf);
    (timers || []).forEach(clearTimeout);
    timers = [];
    if (keyHandler) window.removeEventListener('keydown', keyHandler);
    if (visHandler) document.removeEventListener('visibilitychange', visHandler);
    keyHandler = null; visHandler = null;
    if (root) root.remove();
    root = null;
  }

  return { mount, unmount };
})();
