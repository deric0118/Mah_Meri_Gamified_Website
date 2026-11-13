/* =========================================================================
   ACT II: Weaving the Welcome (kelarai pattern-sequence puzzle)
   Pick strips in the order shown by the kelarai pattern. Each finished
   pattern reveals one more stage (0 / 33 / 66 / 100 %) of the craft.
   Item 1: Tempok weave, Item 2: Sungu basket.
   ========================================================================= */
window.Games = window.Games || {};
window.Games[2] = (function () {
  const STRIPS = {
    N: { label: 'Natural', cls: 'strip-n', key: '1' },
    D: { label: 'Red-dyed', cls: 'strip-d', key: '2' },
    K: { label: 'Dark-dyed', cls: 'strip-k', key: '3' }
  };

  const CRAFTS = [
    {
      key: 'tempok', name: 'Tempok', sub: 'kelarai headgear weave',
      img: () => ASSETS.act2.tempok, colors: ['N', 'D'],
      patterns: [['N', 'D', 'N'], ['D', 'N', 'D', 'N'], ['N', 'D', 'D', 'N', 'D']]
    },
    {
      key: 'sungu', name: 'Sungu', sub: 'thorned seed basket',
      img: () => ASSETS.act2.sungu, colors: ['N', 'D', 'K'],
      patterns: [['N', 'K', 'N', 'D'], ['D', 'N', 'K', 'N', 'D'], ['K', 'D', 'N', 'D', 'K', 'N']]
    }
  ];

  const LOOM_COLS = 7;
  const LOOM_ROWS = 6;

  let root, opts, timers, craftIdx, patIdx, pick, busy, keyHandler;
  let patternEl, patternTitle, loomEl, revealImg, ghostImg, craftTitle, stageLabel, stripBar, progressFill;

  function mount(host, o) {
    opts = o;
    timers = [];
    craftIdx = 0; patIdx = 0; pick = 0; busy = false;

    root = UI.el('div', { class: 'stage act2' });
    const video = UI.el('video', {
      class: 'stage-bg', autoplay: true, muted: true, loop: true, playsinline: true,
      poster: ASSETS.act2.bg, src: ASSETS.act2.video
    });
    video.muted = true;
    video.addEventListener('error', () => { video.removeAttribute('src'); video.load(); });
    root.appendChild(video);
    root.appendChild(UI.el('div', { class: 'stage-vignette warm' }));

    root.appendChild(UI.el('div', { class: 'stage-banner' }, [
      UI.el('strong', { text: "The Weaver's Hut" }),
      UI.el('span', { text: 'Pick the strips in the order of the kelarai pattern, from top to bottom.' })
    ]));

    // Left: target pattern
    patternTitle = UI.el('div', { class: 'panel-title' });
    patternEl = UI.el('ol', { class: 'pattern-list' });
    const left = UI.el('div', { class: 'weave-col weave-pattern straw-panel' }, [patternTitle, patternEl]);

    // Centre: loom
    loomEl = UI.el('div', { class: 'loom' });
    const center = UI.el('div', { class: 'weave-col weave-loom' }, [UI.el('div', { class: 'panel-title light', text: 'Your weave' }), loomEl]);

    // Right: craft reveal
    craftTitle = UI.el('div', { class: 'panel-title' });
    ghostImg = UI.el('img', { class: 'craft-ghost', alt: '' });
    revealImg = UI.el('img', { class: 'craft-reveal', alt: '' });
    progressFill = UI.el('span');
    stageLabel = UI.el('div', { class: 'craft-stage' });
    const right = UI.el('div', { class: 'weave-col weave-craft straw-panel' }, [
      craftTitle,
      UI.el('div', { class: 'craft-frame' }, [ghostImg, revealImg]),
      UI.el('div', { class: 'progress-bar' }, [progressFill]),
      stageLabel
    ]);

    root.appendChild(UI.el('div', { class: 'weave-layout' }, [left, center, right]));

    stripBar = UI.el('div', { class: 'strip-bar' });
    root.appendChild(stripBar);

    keyHandler = (e) => {
      if (UI.isBlocked()) return;
      const k = Object.keys(STRIPS).find((s) => STRIPS[s].key === e.key);
      if (k && CRAFTS[craftIdx].colors.includes(k)) choose(k);
    };
    window.addEventListener('keydown', keyHandler);

    host.appendChild(root);
    loadCraft();
  }

  function loadCraft() {
    const craft = CRAFTS[craftIdx];
    patIdx = 0; pick = 0;
    craftTitle.innerHTML = '';
    craftTitle.appendChild(document.createTextNode(craft.name + ' '));
    craftTitle.appendChild(UI.el('small', { text: '(' + craft.sub + ')' }));
    ghostImg.src = craft.img();
    revealImg.src = craft.img();

    stripBar.innerHTML = '';
    craft.colors.forEach((c) => {
      const s = STRIPS[c];
      stripBar.appendChild(UI.el('button', {
        class: 'strip-btn ' + s.cls, 'data-strip': c,
        onclick: () => choose(c)
      }, [UI.el('span', { class: 'strip-swatch' }), UI.el('span', { text: s.label }), UI.el('kbd', { text: s.key })]));
    });
    renderPattern();
    renderLoom();
    renderReveal();
  }

  function renderPattern() {
    const craft = CRAFTS[craftIdx];
    const pat = craft.patterns[patIdx];
    patternTitle.textContent = 'Kelarai pattern ' + (patIdx + 1) + '/' + craft.patterns.length;
    patternEl.innerHTML = '';
    pat.forEach((c, i) => {
      patternEl.appendChild(UI.el('li', { class: 'pattern-chip ' + STRIPS[c].cls + (i < pick ? ' done' : '') + (i === pick ? ' current' : '') }, [
        UI.el('span', { class: 'strip-swatch' }), UI.el('span', { text: STRIPS[c].label })
      ]));
    });
  }

  function renderLoom() {
    const pat = CRAFTS[craftIdx].patterns[patIdx];
    loomEl.innerHTML = '';
    for (let r = 0; r < LOOM_ROWS; r++) {
      const weft = r < pick ? pat[r] : null;
      for (let c = 0; c < LOOM_COLS; c++) {
        let cls = 'loom-cell';
        if (weft) cls += ((r + c) % 2 === 0 ? ' weft-over ' : ' warp-over ') + STRIPS[weft].cls;
        if (weft && r === pick - 1) cls += ' fresh';
        loomEl.appendChild(UI.el('div', { class: cls }));
      }
    }
  }

  function renderReveal() {
    const craft = CRAFTS[craftIdx];
    const pct = Math.round((patIdx / craft.patterns.length) * 100);
    revealImg.style.clipPath = 'inset(' + (100 - pct) + '% 0 0 0)';
    progressFill.style.width = pct + '%';
    stageLabel.textContent = 'Stage ' + (patIdx + 1) + '/4 · ' + pct + '% woven';
  }

  function choose(c) {
    if (busy || !root) return;
    const craft = CRAFTS[craftIdx];
    const pat = craft.patterns[patIdx];
    const btn = stripBar.querySelector('[data-strip="' + c + '"]');

    if (pat[pick] !== c) {
      AudioFX.play('wrong');
      loomEl.classList.remove('shake'); void loomEl.offsetWidth; loomEl.classList.add('shake');
      UI.toast('That strip breaks the kelarai. Start this pattern again from the top.', 2200);
      pick = 0;
      renderPattern(); renderLoom();
      return;
    }

    AudioFX.play('weave');
    pick += 1;
    renderPattern(); renderLoom();
    if (btn) {
      const p = UI.centerIn(btn, root);
      UI.float(root, p.x, p.y - 30, '+10 Harmony', 'teal');
    }

    if (pick >= pat.length) {
      busy = true;
      timers.push(setTimeout(patternComplete, 450));
    }
  }

  function patternComplete() {
    const craft = CRAFTS[craftIdx];
    patIdx += 1;
    pick = 0;
    AudioFX.play('chime');
    loomEl.classList.add('packed');
    renderReveal();
    const fr = root.querySelector('.craft-frame');
    const c = UI.centerIn(fr, root);
    UI.burst(root, c.x, c.y, 14, 'sparkle');

    if (patIdx >= craft.patterns.length) {
      stageLabel.textContent = 'Stage 4/4 · 100% woven';
      timers.push(setTimeout(craftComplete, 900));
      return;
    }
    timers.push(setTimeout(() => {
      loomEl.classList.remove('packed');
      renderPattern(); renderLoom();
      busy = false;
    }, 650));
  }

  function craftComplete() {
    const craft = CRAFTS[craftIdx];
    root.querySelector('.weave-craft').classList.add('complete');
    UI.toast(craft.name + ' complete!', 2200);
    if (craftIdx === CRAFTS.length - 1) {
      timers.push(setTimeout(() => opts.onComplete(), 1300));
      return;
    }
    timers.push(setTimeout(() => {
      Dialogue.start(CONTENT.dialogues.act2_switch, () => {
        if (!root) return;
        craftIdx += 1;
        root.querySelector('.weave-craft').classList.remove('complete');
        loomEl.classList.remove('packed');
        busy = false;
        loadCraft();
      });
    }, 1100));
  }

  function unmount() {
    (timers || []).forEach(clearTimeout);
    timers = [];
    if (keyHandler) window.removeEventListener('keydown', keyHandler);
    keyHandler = null;
    if (root) {
      const v = root.querySelector('video');
      if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
      root.remove();
    }
    root = null;
  }

  return { mount, unmount };
})();
