/* =========================================================================
   STATE: progress + localStorage save system.
   ========================================================================= */
(function () {
  const KEY = 'mahmeri_save_v1';

  const defaults = () => ({
    completedActs: [],
    seenPrologue: false,
    finished: false,
    muted: false,
    stats: { act3Moves: null, act4BestCombo: 0 }
  });

  let data = defaults();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        data = Object.assign(defaults(), parsed);
        data.stats = Object.assign(defaults().stats, parsed.stats || {});
        if (!Array.isArray(data.completedActs)) data.completedActs = [];
      }
    } catch (e) {
      data = defaults();
    }
    return data;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* private mode */ }
  }

  function reset() {
    const muted = data.muted;
    data = defaults();
    data.muted = muted;
    save();
  }

  function completeAct(n) {
    if (!data.completedActs.includes(n)) data.completedActs.push(n);
    data.completedActs.sort((a, b) => a - b);
    if (n === 4) data.finished = true;
    save();
  }

  const isCompleted = (n) => data.completedActs.includes(n);
  const isUnlocked = (n) => n === 1 || isCompleted(n - 1);

  function nextAct() {
    for (let i = 1; i <= 4; i++) if (!isCompleted(i)) return i;
    return null;
  }

  const hasProgress = () => data.seenPrologue || data.completedActs.length > 0;

  window.State = {
    get data() { return data; },
    load, save, reset, completeAct, isCompleted, isUnlocked, nextAct, hasProgress
  };
})();
