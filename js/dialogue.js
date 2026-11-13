/* =========================================================================
   DIALOGUE: reusable Moyang overlay with typewriter text.
   Dialogue.start(lines, onDone)
     - Next: finishes the current line instantly, or advances.
     - Skip: closes and STILL calls onDone (so game flow continues).
   ========================================================================= */
(function () {
  const SPEED_MS = 22;
  let lines = [], idx = 0, onDone = null, timer = null, typing = false;
  let overlay, textEl, speakerEl, avatarEl, counterEl;

  function els() {
    overlay = overlay || document.getElementById('dialogue-overlay');
    textEl = textEl || document.getElementById('dialogue-textbox');
    speakerEl = speakerEl || document.getElementById('dialogue-speaker');
    avatarEl = avatarEl || document.getElementById('dialogue-avatar-img');
    counterEl = counterEl || document.getElementById('dialogue-counter');
  }

  function start(seq, done) {
    els();
    lines = Array.isArray(seq) ? seq : [];
    idx = 0;
    onDone = done || null;
    if (!lines.length) { finish(); return; }
    overlay.classList.remove('hidden');
    render();
  }

  function render() {
    if (idx >= lines.length) { finish(); return; }
    const line = lines[idx];
    speakerEl.textContent = line.speaker || 'Moyang Tok Naning';
    avatarEl.src = window.ASSETS.moyang.speak;
    avatarEl.classList.add('talking');
    counterEl.textContent = lines.length > 1 ? (idx + 1) + ' / ' + lines.length : '';

    clearInterval(timer);
    textEl.textContent = '';
    typing = true;
    let i = 0;
    const full = line.text;
    timer = setInterval(() => {
      i += 1;
      textEl.textContent = full.slice(0, i);
      if (i >= full.length) endTyping(line);
    }, SPEED_MS);
  }

  function endTyping(line) {
    clearInterval(timer);
    typing = false;
    textEl.textContent = line.text;
    avatarEl.classList.remove('talking');
    avatarEl.src = line.pose === 'speak' ? window.ASSETS.moyang.speak : window.ASSETS.moyang.stand;
  }

  function next() {
    if (!isOpen()) return;
    if (window.AudioFX) AudioFX.play('click');
    if (typing) { endTyping(lines[idx]); return; }
    idx += 1;
    render();
  }

  function skip() {
    if (!isOpen()) return;
    if (window.AudioFX) AudioFX.play('click');
    finish();
  }

  function finish() {
    els();
    clearInterval(timer);
    typing = false;
    overlay.classList.add('hidden');
    const cb = onDone;
    onDone = null;
    lines = [];
    if (cb) cb();
  }

  /** Close without running the callback (used by Reset). */
  function cancel() {
    els();
    onDone = null;
    clearInterval(timer);
    typing = false;
    overlay.classList.add('hidden');
  }

  function isOpen() {
    els();
    return !overlay.classList.contains('hidden');
  }

  document.addEventListener('DOMContentLoaded', () => {
    els();
    document.getElementById('dialogue-next').addEventListener('click', (e) => { e.stopPropagation(); next(); });
    document.getElementById('dialogue-skip').addEventListener('click', (e) => { e.stopPropagation(); skip(); });
    // Clicking anywhere on the text box also advances
    document.querySelector('#dialogue-overlay .dialogue-body').addEventListener('click', next);
  });

  window.Dialogue = { start, next, skip, cancel, isOpen };
})();
