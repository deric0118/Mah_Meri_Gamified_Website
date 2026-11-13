/* =========================================================================
   ACT III: Awakening the Wood
   Phase A: memory card match of the 8 carving motifs (16 cards).
   Phase B: canvas chisel. Scratch away a Nyireh Batu block to reveal
            Moyang Harimau Berantai, with folklore at 25 / 50 / 75 / 100 %.
   ========================================================================= */
window.Games = window.Games || {};
window.Games[3] = (function () {
  const KEYS = ['fish', 'frogs', 'lintah', 'man', 'mask', 'skeleton', 'snake', 'shell'];
  const CANVAS_W = 373, CANVAS_H = 669;   // natural size of game_carving.PNG
  const BRUSH = 24;
  const SAMPLE_STEP = 5;
  const WIN_PCT = 0.93;

  let root, opts, timers, phase;
  // phase A
  let first, lock, pairs, moves, statusEl, noteEl;
  // phase B
  let canvas, cctx, maskIdx, drawing, last, dirty, folkStage, pctEl, fillEl, folkEl, chiselTimer, raf, lastSound, strokes, wrap, finished;

  function mount(host, o) {
    opts = o;
    timers = [];
    root = UI.el('div', { class: 'stage act3', style: { backgroundImage: 'url("' + ASSETS.act3.table + '")' } });
    host.appendChild(root);
    startMatch();
  }

  /* ------------------------------ Phase A ------------------------------ */
  function startMatch() {
    phase = 'match';
    first = null; lock = false; pairs = 0; moves = 0;

    root.appendChild(UI.el('div', { class: 'stage-banner' }, [
      UI.el('strong', { text: "The Carver's Bench" }),
      UI.el('span', { text: 'Flip two cards at a time and find all 8 pairs of carvings.' })
    ]));
    statusEl = UI.el('div', { class: 'match-status' });
    root.appendChild(statusEl);
    updateStatus();

    const board = UI.el('div', { class: 'card-board' });
    UI.shuffle(KEYS.concat(KEYS)).forEach((k) => {
      const card = UI.el('button', { class: 'mem-card', 'data-key': k, 'aria-label': 'Hidden carving card' }, [
        UI.el('div', { class: 'mem-inner' }, [
          UI.el('div', { class: 'mem-face mem-back' }, [UI.el('img', { src: ASSETS.act3.cardBack, alt: '', draggable: 'false' })]),
          UI.el('div', { class: 'mem-face mem-front' }, [UI.el('img', { src: ASSETS.act3.cards[k], alt: CONTENT.cards[k].name, draggable: 'false' })])
        ])
      ]);
      card.addEventListener('click', () => flip(card));
      board.appendChild(card);
    });
    root.appendChild(board);

    noteEl = UI.el('div', { class: 'carve-note straw-panel hidden' });
    root.appendChild(noteEl);
  }

  function updateStatus() {
    statusEl.textContent = 'Pairs ' + pairs + '/8 · Moves ' + moves;
  }

  function flip(card) {
    if (lock || phase !== 'match' || UI.isBlocked()) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    AudioFX.play('flip');
    card.classList.add('flipped');

    if (!first) { first = card; return; }

    moves += 1;
    const a = first, b = card;
    first = null;
    if (a.dataset.key === b.dataset.key) {
      pairs += 1;
      updateStatus();
      timers.push(setTimeout(() => {
        a.classList.add('matched'); b.classList.add('matched');
        AudioFX.play('match');
        const c = UI.centerIn(b, root);
        UI.burst(root, c.x, c.y, 10, 'sparkle');
        showNote(a.dataset.key);
        if (pairs === KEYS.length) matchComplete();
      }, 380));
    } else {
      updateStatus();
      lock = true;
      timers.push(setTimeout(() => {
        a.classList.remove('flipped'); b.classList.remove('flipped');
        lock = false;
      }, 950));
    }
  }

  function showNote(key) {
    const info = CONTENT.cards[key];
    noteEl.innerHTML = '';
    noteEl.appendChild(UI.el('img', { src: ASSETS.act3.cards[key], alt: '' }));
    noteEl.appendChild(UI.el('div', {}, [UI.el('strong', { text: info.name }), UI.el('p', { text: info.note })]));
    noteEl.classList.remove('hidden');
    noteEl.classList.remove('pop'); void noteEl.offsetWidth; noteEl.classList.add('pop');
  }

  function matchComplete() {
    phase = 'between';
    State.data.stats.act3Moves = moves;
    State.save();
    UI.toast('All 8 carvings matched in ' + moves + ' moves!', 2600);
    timers.push(setTimeout(() => {
      Dialogue.start(CONTENT.dialogues.act3_chisel, () => { if (root) startChisel(); });
    }, 1500));
  }

  /* ------------------------------ Phase B ------------------------------ */
  function startChisel() {
    phase = 'chisel';
    root.innerHTML = '';
    drawing = false; last = null; dirty = false; folkStage = -1; lastSound = 0; strokes = 0; finished = false;

    root.appendChild(UI.el('div', { class: 'stage-banner' }, [
      UI.el('strong', { text: 'Release the spirit' }),
      UI.el('span', { text: 'Drag across the wood block to chisel it away.' })
    ]));

    const img = UI.el('img', { class: 'carving-img', src: ASSETS.act3.carving, alt: 'Moyang Harimau Berantai carving', draggable: 'false' });
    canvas = UI.el('canvas', { class: 'carving-canvas', width: CANVAS_W, height: CANVAS_H });
    wrap = UI.el('div', { class: 'carving-wrap' }, [img, canvas]);

    pctEl = UI.el('div', { class: 'folk-pct', text: 'Carving 0%' });
    fillEl = UI.el('span');
    folkEl = UI.el('p', { class: 'folk-text' });
    const panel = UI.el('div', { class: 'folklore-panel straw-panel' }, [
      UI.el('div', { class: 'panel-title', text: 'Folklore of the Moyang' }),
      pctEl,
      UI.el('div', { class: 'progress-bar' }, [fillEl]),
      folkEl,
      UI.el('small', { class: 'folk-hint', text: 'Tip: carve over the whole figure to reveal it.' })
    ]);
    root.appendChild(UI.el('div', { class: 'chisel-layout' }, [wrap, panel]));

    cctx = canvas.getContext('2d');
    paintWood();
    buildMask(img);
    setFolk(0);

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onUp);

    chiselTimer = setInterval(measure, 160);
  }

  function paintWood() {
    const w = CANVAS_W, h = CANVAS_H;
    const g = cctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#4f2416'); g.addColorStop(0.35, '#86402a'); g.addColorStop(0.65, '#7b3a24'); g.addColorStop(1, '#4a2215');
    cctx.fillStyle = g;
    cctx.fillRect(0, 0, w, h);
    // grain
    for (let i = 0; i < 80; i++) {
      cctx.strokeStyle = 'rgba(' + (35 + Math.random() * 40 | 0) + ',' + (12 + Math.random() * 14 | 0) + ',8,' + (0.18 + Math.random() * 0.3).toFixed(2) + ')';
      cctx.lineWidth = 0.6 + Math.random() * 1.8;
      cctx.beginPath();
      const x0 = Math.random() * w;
      const f1 = 30 + Math.random() * 30, ph = Math.random() * 6;
      for (let y = 0; y <= h; y += 8) {
        const x = x0 + Math.sin(y / f1 + ph) * 4 + Math.sin(y / 140 + i) * 9;
        if (y === 0) cctx.moveTo(x, y); else cctx.lineTo(x, y);
      }
      cctx.stroke();
    }
    // knots
    for (let k = 0; k < 5; k++) {
      const x = 30 + Math.random() * (w - 60), y = 40 + Math.random() * (h - 80);
      for (let r = 4; r < 22; r += 4) {
        cctx.strokeStyle = 'rgba(40,15,8,' + (0.5 - r / 60).toFixed(2) + ')';
        cctx.lineWidth = 1.4;
        cctx.beginPath(); cctx.ellipse(x, y, r * 0.6, r * 1.4, 0, 0, Math.PI * 2); cctx.stroke();
      }
    }
    // bevelled edge
    cctx.strokeStyle = 'rgba(255,200,150,0.18)'; cctx.lineWidth = 6; cctx.strokeRect(3, 3, w - 6, h - 6);
    cctx.strokeStyle = 'rgba(0,0,0,0.35)'; cctx.lineWidth = 3; cctx.strokeRect(1.5, 1.5, w - 3, h - 3);
  }

  /** Sample points that lie inside the statue (alpha > 0). Falls back to an ellipse on file://. */
  function buildMask(img) {
    const build = () => {
      maskIdx = [];
      let data = null;
      try {
        const off = document.createElement('canvas');
        off.width = CANVAS_W; off.height = CANVAS_H;
        const o = off.getContext('2d');
        o.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
        data = o.getImageData(0, 0, CANVAS_W, CANVAS_H).data;
      } catch (e) { data = null; }
      for (let y = 0; y < CANVAS_H; y += SAMPLE_STEP) {
        for (let x = 0; x < CANVAS_W; x += SAMPLE_STEP) {
          const i = (y * CANVAS_W + x) * 4;
          let inside;
          if (data) inside = data[i + 3] > 60;
          else {
            const nx = (x - CANVAS_W / 2) / (CANVAS_W * 0.42), ny = (y - CANVAS_H / 2) / (CANVAS_H * 0.46);
            inside = nx * nx + ny * ny < 1;
          }
          if (inside) maskIdx.push(i);
        }
      }
    };
    if (img.complete && img.naturalWidth) build();
    else { maskIdx = []; img.addEventListener('load', build, { once: true }); }
  }

  function toCanvas(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (CANVAS_W / r.width), y: (e.clientY - r.top) * (CANVAS_H / r.height) };
  }

  function carveAt(x, y) {
    cctx.globalCompositeOperation = 'destination-out';
    const g = cctx.createRadialGradient(x, y, BRUSH * 0.35, x, y, BRUSH);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    cctx.fillStyle = g;
    cctx.beginPath(); cctx.arc(x, y, BRUSH, 0, Math.PI * 2); cctx.fill();
    cctx.globalCompositeOperation = 'source-over';
    dirty = true;
  }

  function stroke(p) {
    if (last) {
      const dx = p.x - last.x, dy = p.y - last.y;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.ceil(dist / (BRUSH / 3)));
      for (let i = 1; i <= steps; i++) carveAt(last.x + (dx * i) / steps, last.y + (dy * i) / steps);
    } else {
      carveAt(p.x, p.y);
    }
    last = p;
  }

  function juice(e) {
    const t = performance.now();
    if (t - lastSound > 75) {
      lastSound = t;
      AudioFX.play('chisel');
      const r = root.getBoundingClientRect();
      UI.burst(root, e.clientX - r.left, e.clientY - r.top, 3, 'chip');
      strokes += 1;
      if (strokes % 9 === 0) { wrap.classList.remove('shake'); void wrap.offsetWidth; wrap.classList.add('shake'); }
    }
  }

  function onDown(e) {
    if (finished || UI.isBlocked()) return;
    e.preventDefault();
    drawing = true;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    last = null;
    stroke(toCanvas(e));
    juice(e);
  }
  function onMove(e) {
    if (!drawing || finished) return;
    e.preventDefault();
    stroke(toCanvas(e));
    juice(e);
  }
  function onUp() { drawing = false; last = null; }

  function measure() {
    if (!dirty || finished || !maskIdx || !maskIdx.length) return;
    dirty = false;
    const data = cctx.getImageData(0, 0, CANVAS_W, CANVAS_H).data;
    let cleared = 0;
    for (let k = 0; k < maskIdx.length; k++) if (data[maskIdx[k] + 3] < 70) cleared++;
    const pct = cleared / maskIdx.length;
    const shown = Math.min(100, Math.floor((pct / WIN_PCT) * 100));
    pctEl.textContent = 'Carving ' + shown + '%';
    fillEl.style.width = shown + '%';
    const stage = shown >= 75 ? 3 : shown >= 50 ? 2 : shown >= 25 ? 1 : 0;
    if (stage > folkStage) setFolk(stage);
    if (pct >= WIN_PCT) reveal();
  }

  function setFolk(i) {
    folkStage = i;
    folkEl.classList.remove('fade-in'); void folkEl.offsetWidth; folkEl.classList.add('fade-in');
    folkEl.textContent = CONTENT.folklore[i];
    if (i > 0) AudioFX.play('chime');
  }

  function reveal() {
    finished = true;
    drawing = false;
    clearInterval(chiselTimer);
    pctEl.textContent = 'Carving 100%';
    fillEl.style.width = '100%';
    canvas.classList.add('cleared');
    wrap.classList.add('revealed');
    setFolk(4);
    const c = UI.centerIn(wrap, root);
    UI.burst(root, c.x, c.y, 26, 'sparkle');
    AudioFX.play('victory');
    timers.push(setTimeout(() => opts.onComplete(), 3200));
  }

  function unmount() {
    (timers || []).forEach(clearTimeout);
    timers = [];
    clearInterval(chiselTimer);
    if (raf) cancelAnimationFrame(raf);
    if (root) root.remove();
    root = null;
  }

  return { mount, unmount };
})();
