/* =========================================================================
   DISPLAY: phone orientation + full screen.
   - Portrait on a touch screen: CSS shows the #rotate-overlay notice over the
     game. Anything time-based listens for 'display:blocked' and pauses:
         window.addEventListener('display:blocked', (e) => e.detail.blocked)
   - Landscape on a touch screen: the first tap enters full screen (hides the
     browser bars) and locks landscape. If the player leaves full screen it
     stays off until they rotate the phone again or come back to the tab.
   - #btn-fullscreen (HUD) toggles full screen wherever the browser allows it.
   iPhone Safari has no full screen API for pages; there the notice suggests
   Add to Home Screen instead (see the apple-mobile-web-app meta tags).
   ========================================================================= */
(function () {
  // Keep in sync with the #rotate-overlay media query in css/styles.css
  const TOUCH = '(hover: none) and (pointer: coarse)';
  const portraitMq = window.matchMedia('(orientation: portrait) and ' + TOUCH);
  const landscapeMq = window.matchMedia('(orientation: landscape) and ' + TOUCH);
  const docEl = document.documentElement;

  const supported = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  const isIOS = /iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;

  let autoArmed = true; // enter full screen on the next landscape tap
  let pending = false;  // a request is in flight (one tap can reach two handlers)

  const isFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const isBlocked = () => portraitMq.matches;

  function onChange(mq, fn) {
    if (mq.addEventListener) mq.addEventListener('change', fn);
    else if (mq.addListener) mq.addListener(fn); // Safari < 14
  }

  function lockLandscape() {
    const o = screen.orientation;
    if (!o || typeof o.lock !== 'function') return;
    try { o.lock('landscape').catch(() => {}); } catch (e) { /* not supported here */ }
  }

  /** Must run inside a tap / click / key handler (browser rule). */
  function enter() {
    if (!supported || pending || isFullscreen()) return;
    pending = true;
    let p;
    try {
      p = docEl.requestFullscreen
        ? docEl.requestFullscreen({ navigationUI: 'hide' })
        : docEl.webkitRequestFullscreen();
    } catch (e) { p = Promise.reject(e); }
    Promise.resolve(p).catch(() => {}).then(() => { pending = false; });
  }

  function exit() {
    if (!isFullscreen()) return;
    try { screen.orientation.unlock(); } catch (e) { /* nothing locked */ }
    const fn = document.exitFullscreen || document.webkitExitFullscreen;
    try {
      const p = fn.call(document);
      if (p && p.catch) p.catch(() => {});
    } catch (e) { /* already out */ }
  }

  function toggle() {
    if (isFullscreen()) exit(); else enter();
  }

  function renderButton() {
    const btn = document.getElementById('btn-fullscreen');
    if (!btn) return;
    const on = isFullscreen();
    const name = on ? 'Exit full screen' : 'Full screen';
    btn.classList.toggle('is-on', on);
    btn.title = name;
    btn.setAttribute('aria-label', name);
    const label = btn.querySelector('.hud-label');
    if (label) label.textContent = on ? 'Exit' : 'Full screen';
  }

  function onFullscreenChange() {
    if (isFullscreen()) lockLandscape();
    else autoArmed = false; // the player left full screen: don't force it straight back
    renderButton();
  }
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);

  // Landscape phone: any tap goes full screen (capture phase, so it runs before game handlers)
  window.addEventListener('pointerup', (e) => {
    if (autoArmed && e.pointerType !== 'mouse' && landscapeMq.matches) enter();
  }, true);

  // Re-arm when the phone is turned sideways again or the player returns to the tab
  onChange(landscapeMq, () => { if (landscapeMq.matches) autoArmed = true; });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) autoArmed = true; });

  onChange(portraitMq, () => {
    window.dispatchEvent(new CustomEvent('display:blocked', { detail: { blocked: isBlocked() } }));
  });

  document.addEventListener('DOMContentLoaded', () => {
    const hudBtn = document.getElementById('btn-fullscreen');
    if (hudBtn) {
      hudBtn.classList.toggle('hidden', !supported);
      hudBtn.addEventListener('click', () => {
        if (window.AudioFX) AudioFX.play('click');
        toggle();
      });
    }
    // On Android this also turns the screen sideways, even with auto-rotate off
    const rotateBtn = document.getElementById('btn-rotate-fullscreen');
    if (rotateBtn) {
      rotateBtn.classList.toggle('hidden', !supported);
      rotateBtn.addEventListener('click', () => { autoArmed = true; enter(); });
    }
    const tip = document.getElementById('rotate-tip');
    if (tip) tip.classList.toggle('hidden', supported || !isIOS || isStandalone);
    renderButton();
  });

  window.Display = { supported, isBlocked, isFullscreen, enter, exit, toggle };
})();
