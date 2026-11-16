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

  // NEW: Audio tracker for Moyang's voice
  let currentVoiceover = null;
  let startTimer = null; // Tracks the opening delay

  function els() {
    overlay = overlay || document.getElementById('dialogue-overlay');
    textEl = textEl || document.getElementById('dialogue-textbox');
    speakerEl = speakerEl || document.getElementById('dialogue-speaker');
    avatarEl = avatarEl || document.getElementById('dialogue-avatar-img');
    counterEl = counterEl || document.getElementById('dialogue-counter');
  }

  // BULLETPROOF AUDIO STOPPER
  function stopAudio() {
    if (currentVoiceover) {
      currentVoiceover.muted = true; // Silence it instantly
      currentVoiceover.pause();
      currentVoiceover.removeAttribute('src'); // Completely sever the file link
      currentVoiceover.load(); // Force the browser to flush the audio buffer!
      currentVoiceover = null;
    }
  }

  function start(seq, done) {
    els();
    lines = Array.isArray(seq) ? seq : [];
    idx = 0;
    onDone = done || null;

    clearTimeout(startTimer); // Clear any pending delays from previous skips

    if (!lines.length) { finish(); return; }

    // Clear the text box so it is safely blank while loading
    textEl.textContent = '';

    overlay.classList.remove('hidden');
    // Lets game scenes hide their interactive bits (items, hint button) while Moyang talks.
    document.body.classList.add('dialogue-open');

    startTimer = setTimeout(() => {
      if (isOpen()) render();
    }, 800);
  }

  function render() {
    if (idx >= lines.length) { finish(); return; }
    const line = lines[idx];
    speakerEl.textContent = line.speaker || 'Moyang Tok Naning';
    avatarEl.src = window.ASSETS.moyang.speak;
    avatarEl.classList.add('talking');
    counterEl.textContent = lines.length > 1 ? (idx + 1) + ' / ' + lines.length : '';

    // NEW: Stop any previously playing dialogue audio
    stopAudio();

    if (line.audio && window.State && !window.State.data.muted) {
      // 1. Create the new audio and make it the active one
      const audioObj = new Audio(line.audio);
      currentVoiceover = audioObj; 

      // 2. Ask the browser to play it (this creates a "Promise")
      const playPromise = audioObj.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          // THE FIX: The browser just successfully started playing the audio.
          // If the user clicked "Skip" while the browser was thinking, currentVoiceover 
          // was set to null. If they don't match, we kill it instantly!
          if (currentVoiceover !== audioObj) {
            audioObj.muted = true;
            audioObj.pause();
            audioObj.removeAttribute('src');
            audioObj.load();
          }
        }).catch(e => console.log("Dialogue audio skipped or blocked:", e));
      }
    }

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

    if (typing) { 
      endTyping(lines[idx]); 
      stopAudio(); // Stop the audio if the user skips to the end of the line
      return; 
    }

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
    clearTimeout(startTimer); // Prevents the audio from starting if you skip during the delay
    typing = false;

    stopAudio(); // Stop any audio that is still playing when the dialogue ends

    overlay.classList.add('hidden');
    document.body.classList.remove('dialogue-open');
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
    clearTimeout(startTimer);
    typing = false;

    stopAudio(); // Stop any audio that is still playing when the dialogue is cancelled
    
    overlay.classList.add('hidden');
    document.body.classList.remove('dialogue-open');
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
