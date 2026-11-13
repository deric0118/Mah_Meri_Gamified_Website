/* =========================================================================
   ACT I: The Call of the Mangroves (hidden-object resource gathering)
   Find 3 pandanus leaves + 2 Nyireh Batu wood pieces hidden in the scene.
   ========================================================================= */
window.Games = window.Games || {};
window.Games[1] = (function () {
  // Positions in % of the 16:9 stage (top-left corner), width in % of stage width.
  const ITEMS = [
    { type: 'leaf', idx: 0, left: 4,  top: 52, w: 15, rot: -14 },
    { type: 'leaf', idx: 1, left: 63, top: 30, w: 13, rot: 22 },
    { type: 'leaf', idx: 2, left: 36, top: 50, w: 13, rot: 6 },
    { type: 'wood', idx: 0, left: 12, top: 72, w: 15, rot: -8 },
    { type: 'wood', idx: 1, left: 76, top: 62, w: 15, rot: 12 }
  ];

  let root, opts, timers, slots, counterEl, collected, leafSlot, woodSlot, done;
  let factIdx;

  function mount(host, o) {
    opts = o;
    timers = [];
    collected = 0; leafSlot = 0; woodSlot = 3; done = false;
    factIdx = { leaf: 0, wood: 0 };

    root = UI.el('div', { class: 'stage act1' });

    const video = UI.el('video', {
      class: 'stage-bg', autoplay: true, muted: true, loop: true, playsinline: true,
      poster: ASSETS.act1.bg, src: ASSETS.act1.video
    });
    video.muted = true;
    video.addEventListener('error', () => { video.removeAttribute('src'); video.load(); });
    root.appendChild(video);
    root.appendChild(UI.el('div', { class: 'stage-vignette' }));

    root.appendChild(UI.el('div', { class: 'stage-banner' }, [
      UI.el('strong', { text: 'The Mangrove Swamp' }),
      UI.el('span', { text: 'Find 3 pandanus leaves and 2 pieces of Nyireh Batu wood hidden in the swamp.' })
    ]));

    ITEMS.forEach((it) => {
      const src = it.type === 'leaf' ? ASSETS.act1.leaves[it.idx] : ASSETS.act1.wood[it.idx];
      const node = UI.el('button', {
        class: 'hidden-item ' + it.type,
        'aria-label': it.type === 'leaf' ? 'Pandanus leaf' : 'Nyireh Batu wood',
        style: { left: it.left + '%', top: it.top + '%', width: it.w + '%', transform: 'rotate(' + it.rot + 'deg)' }
      }, [UI.el('img', { src: src, alt: '', draggable: 'false' })]);
      node.addEventListener('click', () => collect(it, node));
      root.appendChild(node);
    });

    // Gathering tray
    slots = [];
    const slotWrap = UI.el('div', { class: 'tray-slots' });
    [0, 1, 2].forEach((i) => slots.push(slotWrap.appendChild(UI.el('div', { class: 'tray-slot' }, [UI.el('img', { src: ASSETS.act1.leaves[i], alt: '' })]))));
    [0, 1].forEach((i) => slots.push(slotWrap.appendChild(UI.el('div', { class: 'tray-slot' }, [UI.el('img', { src: ASSETS.act1.wood[i], alt: '' })]))));
    counterEl = UI.el('div', { class: 'tray-counter', text: '0/5 Resources Collected' });
    const hintBtn = UI.el('button', { class: 'btn-ghost btn-small tray-hint', text: '💡 Hint', onclick: hint });
    root.appendChild(UI.el('div', { class: 'gather-tray straw-panel' }, [counterEl, slotWrap, hintBtn]));

    host.appendChild(root);
  }

  function collect(it, node) {
    if (done || node.dataset.taken || UI.isBlocked()) return;
    node.dataset.taken = '1';
    node.classList.remove('hinted');
    AudioFX.play(it.type === 'leaf' ? 'leaf' : 'wood');

    const slot = slots[it.type === 'leaf' ? leafSlot++ : woodSlot++];
    const c = UI.centerIn(node, root);
    UI.burst(root, c.x, c.y, 10, 'sparkle');
    UI.float(root, c.x, c.y - 20, it.type === 'leaf' ? '+1 Pandanus' : '+1 Nyireh Batu', 'gold');

    // Fly into the tray slot
    const sr = slot.getBoundingClientRect();
    const nr = node.getBoundingClientRect();
    const dx = sr.left + sr.width / 2 - (nr.left + nr.width / 2);
    const dy = sr.top + sr.height / 2 - (nr.top + nr.height / 2);
    const scale = Math.max(0.15, (sr.width * 1.4) / nr.width);
    node.classList.add('flying');
    node.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + scale + ')';

    const facts = CONTENT.act1Facts[it.type];
    UI.toast(facts[factIdx[it.type]++ % facts.length], 3200);

    timers.push(setTimeout(() => {
      node.remove();
      slot.classList.add('filled');
      AudioFX.play('pop');
      collected += 1;
      counterEl.textContent = collected + '/5 Resources Collected';
      if (collected === 5) finish();
    }, 750));
  }

  function hint() {
    if (done) return;
    AudioFX.play('chime');
    const left = Array.from(root.querySelectorAll('.hidden-item')).filter((n) => !n.dataset.taken);
    if (!left.length) return;
    const n = left[Math.floor(Math.random() * left.length)];
    n.classList.add('hinted');
    timers.push(setTimeout(() => n.classList.remove('hinted'), 2600));
  }

  function finish() {
    done = true;
    counterEl.textContent = '5/5 Resources Collected!';
    root.querySelector('.gather-tray').classList.add('complete');
    UI.toast('You took only what nature provides. The forest thanks you.', 2600);
    timers.push(setTimeout(() => opts.onComplete(), 1600));
  }

  function unmount() {
    (timers || []).forEach(clearTimeout);
    timers = [];
    if (root) {
      const v = root.querySelector('video');
      if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
      root.remove();
    }
    root = null;
  }

  return { mount, unmount };
})();
