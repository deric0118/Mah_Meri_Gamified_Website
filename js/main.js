/* =========================================================================
   MAIN: screen router, title, map hub, HUD, act flow, museum, portal.
   Mini-games live in js/games/ and follow this contract:
     window.Games[n] = { mount(container, { onComplete }), unmount() }
   ========================================================================= */
(function () {
  const $ = (id) => document.getElementById(id);
  let currentView = 'title-screen';
  let activeGame = null;
  let museumTab = 'history';
  let museumOpenId = null;

  /* ============================ Router ============================ */
  function showView(id) {
    document.querySelectorAll('.view').forEach((v) => {
      if (v.id !== id) { v.classList.add('hidden'); v.classList.remove('shown'); }
    });
    const v = $(id);
    v.classList.remove('hidden');
    void v.offsetWidth; // restart the fade-in transition
    v.classList.add('shown');
    currentView = id;

    if (id !== 'title-screen') {
      const tv = $('bg-video');
      if (tv && !tv.paused) tv.pause();
      AudioFX.stopMusic();
    } else {
      AudioFX.startMusic('title');
    }
    if (id !== 'cutscene-screen') {
      const cv = $('cutscene-video');
      if (cv && !cv.paused) cv.pause();
    }
    updateHud();
  }

  function updateHud() {
    $('hud').classList.toggle('hidden', currentView === 'title-screen' || currentView === 'cutscene-screen');
    $('btn-map').classList.toggle('hidden', currentView !== 'game-stage-screen');
    const n = State.nextAct();
    $('quest-text').textContent = n ? CONTENT.quests[n] : CONTENT.quests.done;
  }

  /* ============================ Cutscenes ============================ */
  let glUpscaler = null;
  function getCutsceneUpscaler(video, canvas) {
    if (glUpscaler !== null) return glUpscaler;
    if (!canvas) { glUpscaler = false; return false; }
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true });
    if (!gl) { glUpscaler = false; return false; }

    const vsSrc = `
      attribute vec2 aPos;
      varying vec2 vUv;
      uniform vec2 uScale;
      void main() {
        gl_Position = vec4(aPos, 0.0, 1.0);
        vec2 uv = (aPos * 0.5) * uScale + 0.5;
        vUv = vec2(uv.x, 1.0 - uv.y);
      }
    `;
    // Contrast-Adaptive Sharpening (AMD FidelityFX CAS) + local contrast enhancement
    const fsSrc = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTex;
      uniform vec2 uTexel;
      void main() {
        vec3 c = texture2D(uTex, vUv).rgb;
        vec3 n = texture2D(uTex, vUv + vec2(0.0, -uTexel.y)).rgb;
        vec3 s = texture2D(uTex, vUv + vec2(0.0,  uTexel.y)).rgb;
        vec3 w = texture2D(uTex, vUv + vec2(-uTexel.x, 0.0)).rgb;
        vec3 e = texture2D(uTex, vUv + vec2( uTexel.x, 0.0)).rgb;

        vec3 mn = min(min(min(n, s), min(w, e)), c);
        vec3 mx = max(max(max(n, s), max(w, e)), c);
        vec3 amp = clamp(min(mn, 1.0 - mx) / max(mx, vec3(0.0001)), 0.0, 1.0);
        vec3 weight = -sqrt(amp) * 0.16;
        vec3 color = clamp((c + (n + s + w + e) * weight) / (1.0 + 4.0 * weight), 0.0, 1.0);

        // Subtle S-curve contrast and saturation boost for crisp lines
        color = clamp((color - 0.5) * 1.04 + 0.5, 0.0, 1.0);
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    };
    const vs = compile(gl.VERTEX_SHADER, vsSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) { glUpscaler = false; return false; }

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { glUpscaler = false; return false; }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const uScale = gl.getUniformLocation(prog, 'uScale');
    const uTexel = gl.getUniformLocation(prog, 'uTexel');

    glUpscaler = {
      draw() {
        const vw = video.videoWidth || 1280;
        const vh = video.videoHeight || 720;
        if (video.readyState < 2) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const cw = Math.round(window.innerWidth * dpr);
        const ch = Math.round(window.innerHeight * dpr);
        if (canvas.width !== cw || canvas.height !== ch) {
          canvas.width = cw;
          canvas.height = ch;
          gl.viewport(0, 0, cw, ch);
        }
        const vidAspect = vw / vh;
        const canAspect = cw / ch;
        const sx = canAspect > vidAspect ? 1.0 : canAspect / vidAspect;
        const sy = canAspect > vidAspect ? vidAspect / canAspect : 1.0;
        gl.uniform2f(uScale, sx, sy);
        gl.uniform2f(uTexel, 1.0 / vw, 1.0 / vh);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    };
    return glUpscaler;
  }

  // Subtitle timing (seconds). Captions for one video are spread between
  // SUB_LEAD and (duration - SUB_TAIL), weighted by caption length.
  const SUB_LEAD = 0.5;  // first caption appears as the video fades in
  const SUB_TAIL = 0.4;  // last caption stays up through the video's fade-out
  const SUB_GAP = 0.3;   // blank beat between captions so each change reads clearly
  const SUB_MIN_WEIGHT = 24; // short lines ("WHAT!? For me?…") still stay up long enough to read

  function subtitleIndexAt(cues, t, duration) {
    const start = SUB_LEAD;
    const end = duration - SUB_TAIL;
    if (!cues || !cues.length || t < start || t >= end) return -1;
    const weight = (c) => Math.max(c.length, SUB_MIN_WEIGHT);
    const total = cues.reduce((sum, c) => sum + weight(c), 0);
    let slotEnd = start;
    for (let i = 0; i < cues.length; i++) {
      slotEnd += (end - start) * (weight(cues[i]) / total);
      if (t < slotEnd) {
        const isLast = i === cues.length - 1;
        return !isLast && t >= slotEnd - SUB_GAP ? -1 : i;
      }
    }
    return -1;
  }

  function playCutscenes(sources, onDone, opts) {
    // Keep each video paired with its subtitle cues (opts.subtitles[i] belongs to sources[i])
    const subs = (opts && opts.subtitles) || [];
    const list = [];
    const cueList = [];
    (Array.isArray(sources) ? sources : []).forEach((src, i) => {
      if (!src) return;
      list.push(src);
      cueList.push(Array.isArray(subs[i]) ? subs[i] : null);
    });
    if (!list.length) {
      if (onDone) onDone();
      return;
    }

    const video = $('cutscene-video');
    const canvas = $('cutscene-canvas');
    const skipBtn = $('btn-skip-cutscene');
    const subEl = $('cutscene-subtitle');
    if (!video) {
      if (onDone) onDone();
      return;
    }

    let curCue = -1;
    const setCue = (cueIdx) => {
      if (!subEl || cueIdx === curCue) return;
      curCue = cueIdx;
      const cues = cueList[idx];
      if (cueIdx < 0 || !cues) {
        subEl.classList.remove('show'); // keep the text while it fades out
        return;
      }
      subEl.textContent = cues[cueIdx];
      void subEl.offsetWidth; // let the fade-in run even when the element was hidden
      subEl.classList.add('show');
    };
    const clearSubtitle = () => {
      curCue = -1;
      if (!subEl) return;
      subEl.classList.remove('show');
      subEl.textContent = '';
    };
    // Bottom shade behind the subtitles, kept on for the whole video to avoid flicker
    const setSubtitleShade = (on) => {
      const screenEl = $('cutscene-screen');
      if (screenEl) screenEl.classList.toggle('subtitles-on', !!on);
    };

    const upscaler = getCutsceneUpscaler(video, canvas);
    const displayEl = upscaler && canvas ? canvas : video;
    const keepLastFrame = !!(opts && opts.keepLastFrame);
    AudioFX.setAmbience(null);
    showView('cutscene-screen');

    let idx = 0;
    let altIdx = 0;
    let finished = false;
    let rafId = 0;

    const renderLoop = () => {
      if (finished) return;
      if (upscaler && !video.paused && !video.ended) {
        try { upscaler.draw(); } catch (e) { /* ignore */ }
      }
      rafId = requestAnimationFrame(renderLoop);
    };
    if (upscaler) rafId = requestAnimationFrame(renderLoop);

    let currentVoiceover = null;

    const cleanup = () => {
      cancelAnimationFrame(rafId);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      if (skipBtn) skipBtn.onclick = null;
      clearSubtitle();
      setSubtitleShade(false);

      // BULLETPROOF STOP: Kills the audio completely when you click skip      
      if (currentVoiceover) {
        currentVoiceover.pause();
        currentVoiceover.currentTime = 0;
        currentVoiceover.removeAttribute('src');
        currentVoiceover = null;
      }

    };

    const finish = () => {
      if (finished) return;
      finished = true;
      if (upscaler && keepLastFrame) {
        try { upscaler.draw(); } catch (e) { /* ignore */ }
      }
      cleanup();
      if (keepLastFrame) {
        displayEl.classList.remove('fade-out');
        displayEl.classList.add('fade-in');
        video.pause();
        if (skipBtn) skipBtn.classList.add('hidden');
      } else {
        displayEl.classList.remove('fade-in', 'fade-out');
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
      if (onDone) onDone();
    };

    if (skipBtn) skipBtn.classList.remove('hidden');

    const handlePlaying = () => {
      if (finished) return;
      if (upscaler) {
        try { upscaler.draw(); } catch (e) { /* ignore */ }
      }
      requestAnimationFrame(() => {
        displayEl.classList.remove('fade-out');
        displayEl.classList.add('fade-in');
      });
    };

    const handleTimeUpdate = () => {
      if (finished || !video.duration || !isFinite(video.duration)) return;
      setCue(subtitleIndexAt(cueList[idx], video.currentTime, video.duration));
      if (keepLastFrame && idx === list.length - 1) return;
      if (video.duration - video.currentTime <= 1.6) {
        displayEl.classList.add('fade-out');
      }
    };

    const playCurrent = () => {
      if (finished) return;
      if (idx >= list.length) {
        finish();
        return;
      }

      // BULLETPROOF STOP: Kill any orphaned audio from the previous video
      if (currentVoiceover) {
        currentVoiceover.pause();
        currentVoiceover.currentTime = 0;
        currentVoiceover.removeAttribute('src');
        currentVoiceover = null;
      }

      // Reset to transparent immediately before loading the next video so it fades in slowly
      displayEl.style.transition = 'none';
      displayEl.classList.remove('fade-in', 'fade-out');
      void displayEl.offsetWidth;
      displayEl.style.transition = '';
      clearSubtitle();
      setSubtitleShade(cueList[idx]);

      // Always keep cutscenes muted (audio will be added separately later)
      video.muted = true;

      // NEW: DYNAMIC AUDIO CONFIGURATION
      // Pulls the audio config dynamically depending on which video is playing
      const audioConfigs = (opts && opts.audio) ? opts.audio : [];

      // Check if there is an audio configuration for the current video index
      if (audioConfigs[idx]) {
        const config = audioConfigs[idx];
        currentVoiceover = new Audio(config.file);
        
        // Let JavaScript calculate the perfect speed mathematically
        currentVoiceover.playbackRate = config.original / config.target; 
        currentVoiceover.preservesPitch = true; 
        
        if (!State.data.muted) {
          currentVoiceover.play().catch(e => console.log("Voiceover blocked by browser:", e));
        }
      }
      

      const entry = list[idx];
      video.src = Array.isArray(entry) ? entry[altIdx] : entry;
      video.load();
      const p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch(handleError);
      }
    };

    const handleEnded = () => {
      idx += 1;
      altIdx = 0;
      playCurrent();
    };

    const handleError = () => {
      const entry = list[idx];
      if (Array.isArray(entry) && altIdx + 1 < entry.length) {
        altIdx += 1;
        playCurrent();
        return;
      }
      idx += 1;
      altIdx = 0;
      playCurrent();
    };

    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    if (skipBtn) {
      skipBtn.onclick = () => {
        AudioFX.play('click');
        finish();
      };
    }

    playCurrent();
  }

  /* ============================ Title ============================ */
  function initTitle() {
    const video = $('bg-video');
    const src = $('bg-video-src');
    const startBtn = $('btn-start-invisible');
    const skipBtn = $('btn-skip-intro');
    let revealed = false;
    // Title theme: plays right away if the browser allows sound, otherwise from the
    // first click / tap / key press (browser autoplay rule; see AudioFX.startMusic).
    AudioFX.startMusic('title');

    const reveal = () => {
      if (revealed) return;
      revealed = true;
      startBtn.classList.remove('hidden');
      skipBtn.classList.add('hidden');
      startBtn.focus({ preventScroll: true });
    };
    const fallback = () => {
      if (revealed) return;
      revealed = true;
      skipBtn.classList.add('hidden');
      $('title-fallback').classList.remove('hidden');
    };

    video.addEventListener('ended', reveal);
    video.addEventListener('error', fallback);
    src.addEventListener('error', fallback);

    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(fallback);

    setTimeout(() => { if (!revealed) skipBtn.classList.remove('hidden'); }, 1200);
    skipBtn.addEventListener('click', () => {
      if (video.duration && isFinite(video.duration)) {
        video.currentTime = Math.max(0, video.duration - 0.05);
        if (video.paused) video.play().catch(reveal);
      } else {
        reveal();
      }
      setTimeout(reveal, 600); // safety net if 'ended' never fires
    });

    startBtn.addEventListener('click', onStartPressed);
    $('btn-enter').addEventListener('click', onStartPressed);
    $('btn-continue').addEventListener('click', () => { AudioFX.play('click'); continueJourney(); });
    $('btn-newgame').addEventListener('click', () => { AudioFX.play('click'); restartJourney(); });
  }

  function onStartPressed() {
    AudioFX.unlock();
    AudioFX.play('chime');
    beginNewJourney();
  }

  function beginNewJourney() {
    State.reset();
    const openingVideos = (window.ASSETS && ASSETS.cutscenes && ASSETS.cutscenes.opening) || [];
    const openingSubs = (CONTENT.cutsceneSubtitles && CONTENT.cutsceneSubtitles.opening) || [];
    playCutscenes(openingVideos, () => {
      State.data.seenPrologue = true;
      State.save();
      goMap();
      Dialogue.start(CONTENT.dialogues.prologue, () => {
        updateHud();
        UI.toast('Tap the glowing Mangrove Swamp marker to begin.');
      });
    }, { subtitles: openingSubs,
      // ADD THIS: Your opening video audio mapping
      audio: [
        { file: 'assets/audio/opening_video/opening_video1.mp3', original: 16, target: 12 },
        { file: 'assets/audio/opening_video/opening_video2.mp3', original: 11, target: 13 },
        { file: 'assets/audio/opening_video/opening_video3.mp3', original: 12, target: 10 }
      ] 
    });
  }

  function continueJourney() {
    closeModal('pause-modal');
    if (currentView === 'title-screen' || currentView === 'cutscene-screen') {
      goMap();
    }
    UI.toast(State.data.finished ? 'Welcome back! Your journey is complete.' : 'Welcome back, traveller. ' + CONTENT.quests[State.nextAct()] + '.');
  }

  /* ============================ Map ============================ */
  function goMap() {
    unmountGame();
    showView('map-screen');
    updatePins();
    AudioFX.setAmbience(CONTENT.ambience.map);
  }

  function updatePins() {
    for (let n = 1; n <= 4; n++) {
      const pin = $('pin-act' + n);
      const badge = pin.querySelector('.pin-badge');
      pin.classList.remove('locked', 'active', 'completed');
      if (State.isCompleted(n)) {
        pin.classList.add('completed');
        badge.textContent = '✓';
      } else if (State.isUnlocked(n)) {
        pin.classList.add('active');
        badge.textContent = '';
      } else {
        pin.classList.add('locked');
        badge.textContent = '🔒';
      }
    }
    $('map-screen').classList.toggle('festival', !!State.data.finished);
  }

  function tryAct(n) {
    if (Dialogue.isOpen() || UI.isBlocked()) return;
    const pin = $('pin-act' + n);
    if (!State.isUnlocked(n)) {
      AudioFX.play('wrong');
      UI.toast(CONTENT.lockedMessage(n));
      pin.classList.remove('shake'); void pin.offsetWidth; pin.classList.add('shake');
      pin.addEventListener('animationend', () => pin.classList.remove('shake'), { once: true });
      return;
    }
    AudioFX.play('click');
    const intro = CONTENT.dialogues['act' + n];
    if (SCENE_INTRO_ACTS.includes(n)) {
      launchMiniGame(n, intro);
    } else {
      Dialogue.start(intro, () => launchMiniGame(n));
    }
  }

  /* ============================ Acts ============================ */
  // Acts whose intro dialogue plays inside the game scene (Swamp / Hut / Carver / Ceremonial Fire).
  const SCENE_INTRO_ACTS = [1, 2, 3, 4];

  function launchMiniGame(n, intro) {
    const game = window.Games && window.Games[n];
    if (!game) { UI.toast('This act is not available yet.'); return; }
    unmountGame();
    showView('game-stage-screen');
    const host = $('game-container-inner');
    host.innerHTML = '';
    activeGame = game;
    AudioFX.setAmbience(CONTENT.ambience[n]);
    game.mount(host, { onComplete: () => completeAct(n) });
    // Moyang speaks over the scene; the games ignore input while a dialogue is open.
    if (intro) Dialogue.start(intro);
  }

  function unmountGame() {
    if (activeGame) {
      try { activeGame.unmount(); } catch (e) { console.error(e); }
      activeGame = null;
    }
    const host = $('game-container-inner');
    if (host) host.innerHTML = '';
  }

  function completeAct(n) {
    const firstTime = !State.isCompleted(n);
    State.completeAct(n);
    updateHud();
    const r = CONTENT.rewards[n];
    const endCutscene = window.ASSETS && ASSETS.cutscenes && ASSETS.cutscenes.actEnd && ASSETS.cutscenes.actEnd[n];
    const endSubs = CONTENT.cutsceneSubtitles && CONTENT.cutsceneSubtitles.actEnd && CONTENT.cutsceneSubtitles.actEnd[n];

    const actEndAudio = {
      1: [{ file: 'assets/audio/actEnd/actEnd1.mp3', original: 10, target: 10 }],
      2: [{ file: 'assets/audio/actEnd/actEnd2.mp3', original: 10, target: 10 }],
      3: [{ file: 'assets/audio/actEnd/actEnd3.mp3', original: 10, target: 10 }],
      4: [{ file: 'assets/audio/actEnd/actEnd4.mp3', original: 10, target: 10 }]
    };

    const returnToMapAndOutro = () => {
      goMap();
      if (!firstTime && n !== 4) return;
      const outro = n === 4 ? CONTENT.dialogues.ending : CONTENT.dialogues['act' + n + '_outro'];
      Dialogue.start(outro, () => {
        if (n === 4) {
          openPortal();
        } else {
          UI.toast('New location unlocked: ' + CONTENT.actNames[n + 1]);
        }
      });
    };

    const showReward = () => {
      AudioFX.play('victory');
      UI.result({
        kicker: CONTENT.actTitles[n],
        title: r.title,
        text: r.text,
        images: r.images,
        button: n === 4 ? 'Celebrate' : 'Return to Map',
        onClose: () => {
          // For Act IV (final game), play act4_end cutscene after clicking Celebrate, fade out slowly, then go back to the map
          if (n === 4 && endCutscene) {
            unmountGame();
            playCutscenes([endCutscene], returnToMapAndOutro, { keepLastFrame: false, subtitles: [endSubs], audio: actEndAudio[n] });
          } else {
            returnToMapAndOutro();
          }
        }
      });
    };

    if (n !== 4 && endCutscene) {
      unmountGame();
      playCutscenes([endCutscene], showReward, { keepLastFrame: true, subtitles: [endSubs], audio: actEndAudio[n] });    
    } else {
      showReward();
    }
  }

  /* ============================ Museum ============================ */
  function isMuseumUnlocked(item) {
    return item.act === 0 || State.isCompleted(item.act);
  }

  function openArchive() {
    AudioFX.play('click');
    museumOpenId = null;
    renderMuseum();
    showModal('archive-modal');
  }

  function renderMuseum() {
    const grid = $('museum-grid');
    const detail = $('museum-detail');
    const items = CONTENT.museum;
    const unlocked = items.filter(isMuseumUnlocked).length;
    $('archive-progress').textContent = unlocked + ' of ' + items.length + ' treasures restored' +
      (State.data.finished ? ' · 🏅 Complete Collection' : '');

    document.querySelectorAll('.museum-tabs .tab').forEach((b) =>
      b.classList.toggle('active', b.dataset.tab === museumTab));

    if (museumOpenId) {
      grid.classList.add('hidden');
      detail.classList.remove('hidden');
      renderMuseumDetail(items.find((i) => i.id === museumOpenId));
      return;
    }
    detail.classList.add('hidden');
    grid.classList.remove('hidden');
    grid.innerHTML = '';
    items.forEach((item) => {
      const open = isMuseumUnlocked(item);
      const card = UI.el('button', {
        class: 'museum-card' + (open ? '' : ' locked'),
        'aria-label': open ? item.name : 'Locked treasure',
        onclick: () => {
          if (!open) {
            AudioFX.play('wrong');
            UI.toast('Complete ' + CONTENT.actNames[item.act] + ' to restore this treasure.');
            return;
          }
          AudioFX.play('flip');
          museumOpenId = item.id;
          renderMuseum();
        }
      }, [
        UI.el('div', { class: 'museum-thumb' }, [UI.el('img', { src: item.img, alt: '', loading: 'lazy' })]),
        UI.el('div', { class: 'museum-name', text: open ? item.name : '???' }),
        UI.el('div', { class: 'museum-act', text: item.act === 0 ? 'Prologue' : (open ? CONTENT.actNames[item.act] : 'Locked · ' + CONTENT.actNames[item.act]) })
      ]);
      grid.appendChild(card);
    });
  }

  function renderMuseumDetail(item) {
    const detail = $('museum-detail');
    detail.innerHTML = '';
    const text = museumTab === 'history' ? item.history : item.myth;
    const back = UI.el('button', { class: 'btn-ghost btn-small', text: '← All treasures', onclick: () => { AudioFX.play('click'); museumOpenId = null; renderMuseum(); } });
    const wrap = UI.el('div', { class: 'museum-detail-body' }, [
      UI.el('div', { class: 'museum-detail-img' }, [UI.el('img', { src: item.img, alt: item.name })]),
      UI.el('div', { class: 'museum-detail-text' }, [
        UI.el('div', { class: 'museum-tag', text: museumTab === 'history' ? 'Real History' : 'Ancestral Myth' }),
        UI.el('h3', { text: item.name }),
        UI.el('p', { text: text })
      ])
    ]);
    detail.appendChild(back);
    detail.appendChild(wrap);

    if (item.gallery) {
      const g = UI.el('div', { class: 'museum-gallery' });
      Object.keys(CONTENT.cards).forEach((k) => {
        g.appendChild(UI.el('figure', {}, [
          UI.el('img', { src: ASSETS.act3.cards[k], alt: CONTENT.cards[k].name, loading: 'lazy' }),
          UI.el('figcaption', {}, [UI.el('strong', { text: CONTENT.cards[k].name }), UI.el('span', { text: CONTENT.cards[k].note })])
        ]));
      });
      detail.appendChild(g);
    }
    detail.appendChild(UI.el('p', { class: 'museum-footnote', text: 'Photos of real Mah Meri artisans will be added by the content team.' }));
  }

  function switchMuseumTab(tab) {
    if (tab === museumTab) return;
    AudioFX.play('click');
    museumTab = tab;
    renderMuseum();
  }

  /* ============================ Portal ============================ */
  function openPortal() {
    AudioFX.play('click');
    const badge = $('portal-badge');
    if (State.data.finished) {
      badge.className = 'portal-badge earned';
      badge.textContent = '🏅 Complete Collection: Guardian of the Threads. Thank you for restoring the Hari Moyang crafts!';
    } else {
      badge.className = 'portal-badge';
      badge.textContent = '🔒 Finish the Spirit Dance (Act IV) to earn the Complete Collection badge. The links below are open to everyone.';
    }
    const cards = $('portal-cards');
    cards.innerHTML = '';
    CONTENT.portal.forEach((c) => {
      cards.appendChild(UI.el('div', { class: 'cta-card' }, [
        UI.el('div', { class: 'cta-icon', text: c.icon }),
        UI.el('h4', { text: c.title }),
        UI.el('p', { text: c.text }),
        UI.el('a', { class: 'btn-wood btn-small', href: c.url, target: '_blank', rel: 'noopener noreferrer', text: c.cta + ' ↗' })
      ]));
    });
    showModal('portal-modal');
  }

  /* ============================ Modals ============================ */
  function showModal(id) {
    $(id).classList.remove('hidden');
    const close = $(id).querySelector('.modal-close');
    if (close) setTimeout(() => close.focus(), 30);
  }
  function closeModal(id) {
    $(id).classList.add('hidden');
  }

  /* ============================ Pause / Reset ============================ */
  function openPauseMenu() {
    AudioFX.play('click');
    showModal('pause-modal');
    const contBtn = $('btn-continue');
    if (contBtn) setTimeout(() => contBtn.focus(), 30);
  }

  function restartJourney() {
    Dialogue.cancel();
    $('result-overlay').classList.add('hidden');
    document.querySelectorAll('.modal').forEach((m) => m.classList.add('hidden'));
    beginNewJourney();
  }

  /* ============================ Sound toggle ============================ */
  function renderAudioBtn() {
    const muted = State.data.muted;
    $('audio-icon').textContent = muted ? '🔇' : '🔊';
    $('audio-label').textContent = muted ? 'Muted' : 'Sound';
  }

  function toggleAudio() {
    AudioFX.unlock();
    State.data.muted = !State.data.muted;
    State.save();
    AudioFX.setMuted(State.data.muted);
    renderAudioBtn();
    if (!State.data.muted) AudioFX.play('click');
  }

  /* ============================ Dev shortcuts ============================ */
  // ?screen=map | act1..act4 | museum | portal  (handy for testing)
  function devShortcut() {
    const s = new URLSearchParams(location.search).get('screen');
    if (!s) return false;
    const tv = $('bg-video'); if (tv) tv.pause();
    if (s === 'title') { showView('title-screen'); return true; }
    if (s === 'dialogue') { goMap(); Dialogue.start(CONTENT.dialogues.prologue); return true; }
    if (s === 'map') { goMap(); return true; }
    if (s === 'act1_play') {
      launchMiniGame(1);
      setTimeout(() => { if (window.Games && window.Games[1] && window.Games[1].simulatePlay) window.Games[1].simulatePlay(); }, 250);
      return true;
    }
    if (s === 'act2_play') {
      launchMiniGame(2);
      setTimeout(() => { if (window.Games && window.Games[2] && window.Games[2].simulatePlay) window.Games[2].simulatePlay(); }, 250);
      return true;
    }
    if (s === 'act3_cards_play') {
      launchMiniGame(3);
      setTimeout(() => { if (window.Games && window.Games[3] && window.Games[3].simulatePlayCards) window.Games[3].simulatePlayCards(); }, 250);
      return true;
    }
    if (s === 'act3_chisel_play') {
      launchMiniGame(3);
      setTimeout(() => { if (window.Games && window.Games[3] && window.Games[3].simulateCarve) window.Games[3].simulateCarve(); }, 250);
      return true;
    }
    if (s === 'act4_rhythm_play') {
      launchMiniGame(4);
      setTimeout(() => { if (window.Games && window.Games[4] && window.Games[4].simulatePlay) window.Games[4].simulatePlay(); }, 250);
      return true;
    }
    if (s === 'act3_chisel') {
      launchMiniGame(3);
      if (window.Games && window.Games[3] && window.Games[3].startChisel) window.Games[3].startChisel();
      return true;
    }
    const m = /^act([1-4])$/.exec(s);
    if (m) { launchMiniGame(Number(m[1])); return true; }
    if (s === 'museum') { goMap(); openArchive(); return true; }
    if (s === 'museum_myths') { goMap(); openArchive(); switchMuseumTab('myths'); return true; }
    if (s === 'portal') { goMap(); openPortal(); return true; }
    return false;
  }

  /* ============================ Boot ============================ */
  document.addEventListener('DOMContentLoaded', () => {
    State.load();
    AudioFX.setMuted(State.data.muted);
    renderAudioBtn();
    initTitle();

    for (let n = 1; n <= 4; n++) $('pin-act' + n).addEventListener('click', () => tryAct(n));

    $('btn-map').addEventListener('click', () => { AudioFX.play('click'); Dialogue.cancel(); goMap(); });
    $('btn-archive').addEventListener('click', openArchive);
    $('btn-support').addEventListener('click', openPortal);
    $('btn-audio-toggle').addEventListener('click', toggleAudio);
    $('btn-reset').addEventListener('click', openPauseMenu);

    document.querySelectorAll('[data-close]').forEach((b) =>
      b.addEventListener('click', () => { AudioFX.play('click'); closeModal(b.dataset.close); }));
    document.querySelectorAll('.modal').forEach((m) =>
      m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); }));
    document.querySelectorAll('.museum-tabs .tab').forEach((b) =>
      b.addEventListener('click', () => switchMuseumTab(b.dataset.tab)));

    // The first interaction unlocks audio (browser autoplay rules). Touch screens only grant
    // permission on pointerup/touchend (not pointerdown), so keep listening to all of these
    // until sound is actually running, then stop.
    const unlockEvents = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'];
    const unlockAudio = () => {
      AudioFX.unlock();
      if (AudioFX.ready()) unlockEvents.forEach((ev) => window.removeEventListener(ev, unlockAudio, true));
    };
    unlockEvents.forEach((ev) => window.addEventListener(ev, unlockAudio, true));

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const open = Array.from(document.querySelectorAll('.modal')).filter((m) => !m.classList.contains('hidden'));
        if (open.length) { closeModal(open[open.length - 1].id); return; }
        if (currentView !== 'title-screen' && currentView !== 'cutscene-screen') {
          openPauseMenu();
          return;
        }
      }
      if (Dialogue.isOpen() && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        Dialogue.next();
      }
    });

    updatePins();
    devShortcut();
  });

  // Exposed for debugging in the browser console
  window.App = { goMap, launchMiniGame, completeAct, openArchive, openPortal, showView };
})();
