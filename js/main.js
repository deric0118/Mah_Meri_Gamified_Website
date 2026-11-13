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
    }
    updateHud();
  }

  function updateHud() {
    $('hud').classList.toggle('hidden', currentView === 'title-screen');
    $('btn-map').classList.toggle('hidden', currentView !== 'game-stage-screen');
    const n = State.nextAct();
    $('quest-text').textContent = n ? CONTENT.quests[n] : CONTENT.quests.done;
  }

  /* ============================ Title ============================ */
  function initTitle() {
    const video = $('bg-video');
    const src = $('bg-video-src');
    const startBtn = $('btn-start-invisible');
    const skipBtn = $('btn-skip-intro');
    let revealed = false;

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
    $('btn-newgame').addEventListener('click', () => { AudioFX.play('click'); beginNewJourney(); });
  }

  function onStartPressed() {
    AudioFX.unlock();
    AudioFX.play('chime');
    if (State.hasProgress()) {
      $('btn-start-invisible').classList.add('hidden');
      $('title-fallback').classList.add('hidden');
      $('title-menu').classList.remove('hidden');
      $('btn-continue').focus();
    } else {
      beginNewJourney();
    }
  }

  function beginNewJourney() {
    State.reset();
    goMap();
    Dialogue.start(CONTENT.dialogues.prologue, () => {
      State.data.seenPrologue = true;
      State.save();
      updateHud();
      UI.toast('Tap the glowing Mangrove Swamp marker to begin.');
    });
  }

  function continueJourney() {
    goMap();
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
    Dialogue.start(CONTENT.dialogues['act' + n], () => launchMiniGame(n));
  }

  /* ============================ Acts ============================ */
  function launchMiniGame(n) {
    const game = window.Games && window.Games[n];
    if (!game) { UI.toast('This act is not available yet.'); return; }
    unmountGame();
    showView('game-stage-screen');
    const host = $('game-container-inner');
    host.innerHTML = '';
    activeGame = game;
    AudioFX.setAmbience(CONTENT.ambience[n]);
    game.mount(host, { onComplete: () => completeAct(n) });
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
    AudioFX.play('victory');
    updateHud();
    const r = CONTENT.rewards[n];
    UI.result({
      kicker: CONTENT.actTitles[n],
      title: r.title,
      text: r.text,
      images: r.images,
      button: n === 4 ? 'Celebrate' : 'Return to Map',
      onClose: () => {
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
      }
    });
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

  /* ============================ Reset ============================ */
  function resetProgress() {
    AudioFX.play('click');
    if (!window.confirm('Reset all progress and start a new journey?')) return;
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
    if (s === 'map') { goMap(); return true; }
    const m = /^act([1-4])$/.exec(s);
    if (m) { launchMiniGame(Number(m[1])); return true; }
    if (s === 'museum') { goMap(); openArchive(); return true; }
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
    $('btn-reset').addEventListener('click', resetProgress);

    document.querySelectorAll('[data-close]').forEach((b) =>
      b.addEventListener('click', () => { AudioFX.play('click'); closeModal(b.dataset.close); }));
    document.querySelectorAll('.modal').forEach((m) =>
      m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); }));
    document.querySelectorAll('.museum-tabs .tab').forEach((b) =>
      b.addEventListener('click', () => switchMuseumTab(b.dataset.tab)));

    // Any first interaction unlocks audio (browser autoplay rules)
    window.addEventListener('pointerdown', () => AudioFX.unlock(), { once: true });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const open = Array.from(document.querySelectorAll('.modal')).filter((m) => !m.classList.contains('hidden'));
        if (open.length) { closeModal(open[open.length - 1].id); return; }
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
