/* =========================================================================
   UI helpers shared by the shell and the mini-games.
   ========================================================================= */
(function () {
  let toastTimer = null;

  const UI = {
    /** Create an element: UI.el('div', {class:'x', text:'hi', onclick: fn}, [children]) */
    el(tag, attrs, children) {
      const n = document.createElement(tag);
      if (attrs) {
        Object.keys(attrs).forEach((k) => {
          const v = attrs[k];
          if (v == null || v === false) return;
          if (k === 'class') n.className = v;
          else if (k === 'text') n.textContent = v;
          else if (k === 'html') n.innerHTML = v;
          else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
          else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2), v);
          else n.setAttribute(k, v === true ? '' : v);
        });
      }
      (children || []).forEach((c) => {
        if (c == null) return;
        n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
      return n;
    },

    toast(msg, ms) {
      const t = document.getElementById('toast');
      if (!t) return;
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => t.classList.remove('show'), ms || 2800);
    },

    /** Floating "+10 Harmony" style text at (x, y) px inside container. */
    float(container, x, y, text, cls) {
      if (!container) return;
      const f = UI.el('div', { class: 'float-text ' + (cls || ''), text: text });
      f.style.left = x + 'px';
      f.style.top = y + 'px';
      container.appendChild(f);
      setTimeout(() => f.remove(), 1300);
    },

    /** Centre of `el` relative to `container`, in px. */
    centerIn(el, container) {
      const a = el.getBoundingClientRect();
      const b = container.getBoundingClientRect();
      return { x: a.left - b.left + a.width / 2, y: a.top - b.top + a.height / 2 };
    },

    /** Burst of small particles (wood chips, sparkles, embers). */
    burst(container, x, y, count, cls) {
      for (let i = 0; i < count; i++) {
        const p = UI.el('span', { class: 'particle ' + (cls || '') });
        const ang = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 60;
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        p.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
        p.style.setProperty('--dy', Math.sin(ang) * dist - 20 + 'px');
        p.style.setProperty('--rot', Math.random() * 360 + 'deg');
        container.appendChild(p);
        setTimeout(() => p.remove(), 800);
      }
    },

    /** Act result panel. */
    result(opts) {
      const ov = document.getElementById('result-overlay');
      document.getElementById('result-kicker').textContent = opts.kicker || 'Act complete';
      document.getElementById('result-title').textContent = opts.title || '';
      document.getElementById('result-text').textContent = opts.text || '';
      const imgs = document.getElementById('result-images');
      imgs.innerHTML = '';
      (opts.images || []).forEach((src) => imgs.appendChild(UI.el('img', { src: src, alt: '' })));
      const btn = document.getElementById('result-btn');
      btn.textContent = opts.button || 'Continue';
      btn.onclick = () => {
        if (window.AudioFX) AudioFX.play('click');
        ov.classList.add('hidden');
        if (opts.onClose) opts.onClose();
      };
      ov.classList.remove('hidden');
      setTimeout(() => btn.focus(), 50);
    },

    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    },

    /** True while a modal, result panel or dialogue is covering the game. */
    isBlocked() {
      return !!document.querySelector('.modal:not(.hidden), #result-overlay:not(.hidden), #dialogue-overlay:not(.hidden)');
    }
  };

  window.UI = UI;
})();
