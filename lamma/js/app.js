/* =========================================================
   لَمّة — Game engine & UI
   Vanilla JS, no dependencies. State persists in localStorage.
   Sections:
     1. Utilities           6. Setup flow
     2. Preferences & state 7. Round engine (sequence, events, majlis)
     3. Sound hooks         8. Game modes
     4. Rendering & timers  9. Missions, standings
     5. Shared flows        10. Final round, results & awards
   ========================================================= */
(function () {
  'use strict';

  const C = window.LAMMA_CONTENT;
  const R = C.reactions;

  /* =========================================================
     1. Utilities
     ========================================================= */
  const $ = (s, root = document) => root.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rand = n => Math.floor(Math.random() * n);
  const pick = a => a[rand(a.length)];
  const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = rand(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const clone = o => JSON.parse(JSON.stringify(o));
  const sum = o => Object.values(o).reduce((a, b) => a + b, 0);

  const votesLabel = n => n === 0 ? 'ولا صوت' : n === 1 ? 'صوت واحد' : n === 2 ? 'صوتين' : n <= 10 ? n + ' أصوات' : n + ' صوت';
  const roundsLabel = n => n === 1 ? 'جولة وحدة' : n === 2 ? 'جولتين' : n + ' جولات';
  const pointsLabel = n => n === 1 ? 'نقطة' : n === 2 ? 'نقطتين' : n + ' نقاط';
  const joinNames = ids => ids.map(nm).join(' و ');

  /* =========================================================
     2. Preferences & game state
     ========================================================= */
  const STORE_KEY = 'lamma_session_v1';
  const ROSTER_KEY = 'lamma_roster_v1';
  const PREFS_KEY = 'lamma_prefs_v1';

  const AVATARS = ['😎', '👑', '☕', '🔥', '🦅', '🎮', '🌴', '🫡', '⚽', '🌙', '🐪', '🌶️', '🎤', '🧕', '🧔', '👵', '👴', '🧒', '🦁', '🍉'];

  const STAT_KEYS = ['score', 'votesReceived', 'votesCast', 'correctAnswers', 'wrongAnswers', 'challengesWon', 'challengesLost',
    'infiltratorWins', 'infiltratorLosses', 'tabooWins', 'fastAnswers', 'timesTargeted', 'secretMissionsCompleted',
    'storyRoundsWon', 'suspectVotes', 'kingVotes', 'rulesBroken'];

  const GROUPS = [
    { id: 'family', e: '👨‍👩‍👧‍👦', t: 'أهل' },
    { id: 'friends', e: '🧑‍🤝‍🧑', t: 'ربع' },
    { id: 'kids', e: '👶', t: 'أطفال موجودين' },
    { id: 'elders', e: '👴', t: 'كبار موجودين' },
    { id: 'savage', e: '😈', t: 'ربع بدون حساسيات' }
  ];
  const MOODS = [
    { id: 'laugh', e: '😂', t: 'سوالف وضحك' },
    { id: 'challenge', e: '🧠', t: 'تحدي' },
    { id: 'savage', e: '😈', t: 'بدون رحمة' },
    { id: 'emirati', e: '🇦🇪', t: 'إماراتي' },
    { id: 'acting', e: '🎭', t: 'تمثيل' },
    { id: 'all', e: '🎲', t: 'كل شي' }
  ];
  const DURATIONS = [
    { id: 'quick', e: '⚡', t: 'سريعة', s: 'حوالي ربع ساعة', rounds: 6 },
    { id: 'normal', e: '☕', t: 'عادية', s: 'حوالي نص ساعة', rounds: 12 },
    { id: 'long', e: '🌙', t: 'سهرة', s: 'حوالي ساعة', rounds: 22 },
    { id: 'endless', e: '♾️', t: 'لين نتضارب 😂', s: 'بدون نهاية… أنتوا تقررون', rounds: 0 }
  ];

  // Relative weight of each mode per mood — drives round generation.
  const WEIGHTS = {
    laugh: { who: 3, story: 3, dare: 2, act: 2, intruder: 2, taboo: 1, trivia: 1, fast: 1 },
    challenge: { trivia: 3, fast: 3, taboo: 3, intruder: 2, who: 1, story: 1, act: 1, dare: 1 },
    savage: { who: 4, dare: 3, intruder: 2, story: 2, act: 1, taboo: 1, trivia: 1, fast: 1 },
    emirati: { who: 2, intruder: 2, taboo: 2, trivia: 2, fast: 2, story: 2, act: 1, dare: 1 },
    acting: { act: 4, taboo: 3, dare: 3, intruder: 2, who: 1, story: 1, trivia: 1, fast: 1 },
    all: { who: 2, intruder: 2, taboo: 2, story: 2, trivia: 2, act: 2, dare: 2, fast: 2 }
  };

  const TIMES = { taboo: 30, act: 45, trivia: 20, fast: 5, dare: 30 };

  const defaultPrefs = { sound: true, voteStyle: 'secret', selfVote: false, missions: true };
  let prefs = Object.assign({}, defaultPrefs, readJSON(PREFS_KEY) || {});

  /** gameState — the whole session lives here and is persisted after each step. */
  let S = null;

  function readJSON(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
  function writeJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* storage unavailable */ } }
  function save() { if (S) writeJSON(STORE_KEY, S); }
  function savePrefs() { writeJSON(PREFS_KEY, prefs); }
  function hasSaved() { const s = readJSON(STORE_KEY); return !!(s && s.players && s.phase && s.phase !== 'done'); }
  function clearSaved() { try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ } }

  function newGameState(players, settings) {
    const state = {
      version: 1,
      players,
      settings,
      roundNumber: 0,
      totalRounds: DURATIONS.find(d => d.id === settings.duration).rounds,
      scores: {},
      statistics: {},
      usedCards: [],
      activeEvents: [],
      currentMode: null,
      currentRound: {},
      gameHistory: [],
      phase: 'between',
      pending: [],
      majlis: null,
      missions: {},
      missionIndex: 0,
      leadCounts: {},
      lastMajlisRound: 0,
      lastEventRound: 0,
      lastWhoTop: null,
      lastIntruder: null,
      final: null
    };
    players.forEach(p => {
      state.scores[p.id] = 0;
      state.statistics[p.id] = Object.fromEntries(STAT_KEYS.map(k => [k, 0]));
      state.leadCounts[p.id] = 0;
    });
    return state;
  }

  /* ---------- Player helpers ---------- */
  const ids = () => S.players.map(p => p.id);
  const P = id => S.players.find(p => p.id === id);
  const nm = id => esc(P(id) ? P(id).name : '');
  const av = id => P(id) ? P(id).avatar : '🙂';
  const others = (id, list = ids()) => list.filter(x => x !== id);

  /* ---------- Scoring & statistics ---------- */
  function bump(pid, key, n = 1) { if (S.statistics[pid]) S.statistics[pid][key] += n; }
  function addPoints(pid, n, statKey) {
    if (!S.scores.hasOwnProperty(pid)) return;
    const mult = (S.phase === 'round' && n > 0 && S.currentRound.multiplier) || 1;
    S.scores[pid] += n * mult;
    S.statistics[pid].score = S.scores[pid];
    if (statKey) bump(pid, statKey);
  }
  const ranking = () => [...S.players].sort((a, b) => S.scores[b.id] - S.scores[a.id]);

  /* ---------- Content filtering ---------- */
  function maxIntensity() {
    const a = S.settings.audience;
    if (a.includes('kids')) return 1;
    if (a.includes('savage') || S.settings.mood === 'savage') return a.includes('elders') ? 2 : 3;
    return 2;
  }
  function poolOf(type) {
    const max = maxIntensity();
    const kids = S.settings.audience.includes('kids');
    return C[type].filter(c => c.intensity <= max && (!kids || c.difficulty <= 2));
  }
  /** Picks an unused card; recycles the pool only once it is exhausted. */
  function pickCard(type, exclude = []) {
    const pool = poolOf(type).filter(c => !exclude.includes(c.id));
    let fresh = pool.filter(c => !S.usedCards.includes(c.id));
    if (!fresh.length) {
      S.usedCards = S.usedCards.filter(id => !pool.some(c => c.id === id));
      fresh = pool;
    }
    if (S.settings.mood === 'emirati') {
      const local = fresh.filter(c => c.category === 'emirati' || c.category === 'uae');
      if (local.length && Math.random() < 0.6) fresh = local;
    }
    const card = pick(fresh);
    S.usedCards.push(card.id);
    return card;
  }

  /* =========================================================
     3. Sound hooks — synthesised with WebAudio, no assets needed.
        To use real files later, map names to URLs in SOUND_FILES.
     ========================================================= */
  const SOUND_FILES = {}; // e.g. { reveal: 'sounds/reveal.mp3' }
  const TONES = {
    reveal: [[523, .09], [784, .16]],
    vote: [[660, .06]],
    countdown: [[440, .14]],
    tick: [[880, .05]],
    winner: [[523, .1], [659, .1], [784, .1], [1047, .3]],
    wrong: [[196, .3, 'sawtooth']],
    intruder: [[392, .18], [311, .18], [233, .4, 'triangle']],
    buzz: [[300, .22, 'square']]
  };
  let actx = null;
  function ensureAudio() {
    if (!prefs.sound) return;
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } }
    if (actx && actx.state === 'suspended') actx.resume();
  }
  function sfx(name) {
    if (!prefs.sound) return;
    if (SOUND_FILES[name]) { try { new Audio(SOUND_FILES[name]).play(); } catch (e) { /* ignore */ } return; }
    if (!actx) return;
    let t = actx.currentTime;
    (TONES[name] || []).forEach(([f, d, type]) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(actx.destination);
      o.start(t); o.stop(t + d + 0.03);
      t += d * 0.9;
    });
    if (name === 'buzz' && navigator.vibrate) navigator.vibrate(120);
  }

  /* =========================================================
     4. Rendering, modals, toasts & timers
     ========================================================= */
  const app = $('#app');
  const modalRoot = $('#modalRoot');
  let handlers = {};
  let modalHandlers = {};
  let timers = [];

  function clearTimers() { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; }
  function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }

  /** Replaces the current screen. `h` maps data-act names to handlers. */
  function show(html, h = {}, opts = {}) {
    clearTimers();
    closeModal();
    handlers = h;
    app.innerHTML = `<section class="screen${opts.center ? ' center' : ''}" tabindex="-1">${html}</section>`;
    updateTopbar(opts.bar !== false);
    window.scrollTo(0, 0);
    const focusEl = $('[autofocus]', app);
    if (focusEl) focusEl.focus({ preventScroll: true });
    else { const s = $('.screen', app); if (s) s.focus({ preventScroll: true }); }
  }

  function bindActions(root, getMap) {
    root.addEventListener('click', e => {
      const el = e.target.closest('[data-act]');
      if (!el || el.disabled || !root.contains(el)) return;
      const fn = getMap()[el.dataset.act];
      if (fn) { ensureAudio(); fn(el.dataset.arg, el, e); }
    });
  }
  bindActions(app, () => handlers);
  bindActions(modalRoot, () => modalHandlers);
  app.addEventListener('input', e => handlers.$input && handlers.$input(e));
  app.addEventListener('keydown', e => handlers.$key && handlers.$key(e));

  function openModal(html, h = {}) {
    modalHandlers = Object.assign({ close: closeModal }, h);
    modalRoot.innerHTML = `<div class="modal-back"><div class="modal" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div></div>`;
    const f = $('.modal button', modalRoot); if (f) f.focus({ preventScroll: true });
  }
  modalRoot.addEventListener('click', e => { if (e.target.classList.contains('modal-back')) closeModal(); });
  function closeModal() { modalRoot.innerHTML = ''; modalHandlers = {}; }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modalRoot.innerHTML) closeModal(); });

  let toastT;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('on'), 2400);
  }

  function confetti() {
    const box = document.createElement('div');
    box.className = 'confetti';
    const colors = ['#702D3B', '#C5A46D', '#667058', '#E7D7B8', '#242321'];
    for (let i = 0; i < 70; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.background = pick(colors);
      p.style.animationDuration = 2 + Math.random() * 2.5 + 's';
      p.style.animationDelay = Math.random() * .6 + 's';
      p.style.transform = `rotate(${rand(360)}deg)`;
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 5500);
  }

  /* ---------- Top bar ---------- */
  function updateTopbar(visible) {
    const bar = $('#topbar');
    const inGame = S && ['between', 'round', 'missions', 'final', 'results'].includes(S.phase);
    bar.hidden = !(visible && inGame);
    $('#soundBtn').textContent = prefs.sound ? '🔊' : '🔈';
    $('#soundBtn').setAttribute('aria-label', prefs.sound ? 'اطفي الصوت' : 'شغّل الصوت');
    if (!inGame) return;
    let mid = '';
    if (S.phase === 'round' || S.phase === 'between') {
      mid = S.roundNumber ? `الجولة <b>${S.roundNumber}</b>${S.totalRounds ? ' من ' + S.totalRounds : ''}` : 'لَمّة';
    } else if (S.phase === 'final') mid = '🔥 السؤال الأخير';
    else if (S.phase === 'results') mid = '🏆 النتائج';
    else mid = '🕵️ مهمات سرية';
    $('#topbarMid').innerHTML = mid;
  }
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-global]');
    if (!el) return;
    ensureAudio();
    if (el.dataset.global === 'sound') toggleSound();
    if (el.dataset.global === 'menu') openGameMenu();
  });
  function toggleSound() {
    prefs.sound = !prefs.sound; savePrefs();
    if (prefs.sound) { ensureAudio(); sfx('vote'); }
    updateTopbar(!$('#topbar').hidden);
    toast(prefs.sound ? 'الصوت شغال 🔊' : 'الصوت طافي 🔈');
  }

  /* ---------- Timer component ---------- */
  const RING = 2 * Math.PI * 54;
  function timerHtml(total, small) {
    return `<div class="timer${small ? ' sm' : ''}" id="timer" role="timer" aria-label="الوقت المتبقي">
      <svg viewBox="0 0 120 120" aria-hidden="true"><circle class="track" cx="60" cy="60" r="54"/><circle class="prog" cx="60" cy="60" r="54" stroke-dasharray="${RING}" stroke-dashoffset="0"/></svg>
      <div class="t">${total}</div></div>`;
  }
  /** Runs a countdown bound to #timer. Cleared automatically on screen change. */
  function runTimer(total, onEnd) {
    let left = total;
    const paint = () => {
      const el = $('#timer'); if (!el) return;
      $('.t', el).textContent = left;
      $('.prog', el).style.strokeDashoffset = RING * (1 - left / total);
      el.classList.toggle('low', left <= 5);
    };
    paint();
    const iv = setInterval(() => {
      left--;
      paint();
      if (left > 0 && left <= 5) sfx('tick');
      if (left <= 0) { clearInterval(iv); onEnd(); }
    }, 1000);
    timers.push(iv);
    return { stop: () => clearInterval(iv) };
  }

  /* ---------- Shared markup ---------- */
  function tilesHtml(list, { act, badge, pressed, disabled, big } = {}) {
    return `<div class="tiles${big ? ' big' : ''}">${list.map((id, i) => `
      <button class="tile" data-act="${act}" data-arg="${id}" style="animation-delay:${i * 30}ms"
        ${pressed ? `aria-pressed="${!!pressed(id)}"` : ''} ${disabled && disabled(id) ? 'disabled' : ''}>
        ${badge ? `<span class="badge" data-badge="${id}"${badge(id) ? '' : ' hidden'}>${badge(id) || ''}</span>` : ''}
        <span class="av" aria-hidden="true">${av(id)}</span><span class="nm">${nm(id)}</span>
      </button>`).join('')}</div>`;
  }
  const btn = (act, label, cls = 'btn-primary', extra = '') => `<button class="btn ${cls}" data-act="${act}" ${extra}>${label}</button>`;
  const actions = (...b) => `<div class="actions">${b.join('')}</div>`;

  /* =========================================================
     5. Shared flows: pass-the-phone, voting, countdown, pickers
     ========================================================= */

  /** Step 1–2 of the privacy flow: name the next player and wait for them. */
  function handTo(pid, next, { sub = '', progress = '' } = {}) {
    show(`
      <div class="body">
        ${progress ? `<span class="pill gold" style="margin:0 auto">${progress}</span>` : ''}
        <p class="eyebrow">عطِ الجوال لـ</p>
        <div class="avatar-xl" aria-hidden="true">${av(pid)}</div>
        <div class="who-name">${nm(pid)}</div>
        ${sub ? `<p class="muted">${sub}</p>` : ''}
      </div>
      ${actions(btn('me', 'أنا ' + nm(pid), 'btn-primary btn-xl'))}`,
      { me: next }, { center: true });
  }

  /** Full privacy flow: name → confirm → hide-screen warning → reveal → hide again. */
  function privateReveal(pid, { label, secret, hideLabel = 'خلاص، خبّها ✋', progress, sub }, next) {
    handTo(pid, () => {
      show(`
        <div class="body">
          <div class="big-emoji" aria-hidden="true">👀</div>
          <h2>تأكد محد يطالع</h2>
          <p class="muted">غطّ الشاشة شوي… الموضوع سري 🤫</p>
        </div>
        ${actions(btn('reveal', label, 'btn-primary btn-xl'))}`,
        { reveal: () => { sfx('reveal'); show(`<div class="body">${secret}</div>${actions(btn('hide', hideLabel, 'btn-primary btn-xl'))}`, { hide: next }, { center: true }); } },
        { center: true });
    }, { progress, sub });
  }

  function countdown(then, label = 'استعدوا…') {
    let n = 3;
    const step = () => {
      if (n === 0) return then();
      show(`<div class="body"><p class="eyebrow">${label}</p><div class="count" aria-live="assertive">${n}</div></div>`, {}, { center: true });
      sfx('countdown');
      n--;
      later(step, 850);
    };
    step();
  }

  const tallyOf = ballots => { const t = {}; Object.values(ballots).forEach(p => { t[p] = (t[p] || 0) + 1; }); return t; };
  function topOf(tally) {
    const n = Math.max(0, ...Object.values(tally));
    return { top: n ? Object.keys(tally).filter(k => tally[k] === n) : [], n };
  }

  /**
   * Generic vote. Secret mode passes the phone to each voter;
   * "point" mode counts fingers after a group countdown.
   * done(tally, ballots|null)
   */
  function runVote({ prompt, eyebrow = '🗳️ تصويت', candidatesFor, voters }, done) {
    voters = voters || ids();
    if (prefs.voteStyle === 'point') return pointVote({ prompt, eyebrow, candidatesFor }, done);
    const ballots = {};
    let i = 0;
    const step = () => {
      if (i >= voters.length) return done(tallyOf(ballots), ballots);
      const v = voters[i];
      const progress = `${i + 1} / ${voters.length}`;
      handTo(v, () => {
        show(`
          <div class="body top">
            <div class="row"><span class="pill">${eyebrow}</span><span class="pill gold">${progress}</span></div>
            <p class="qtext">${esc(prompt)}</p>
            <p class="muted small">اختار بالسر… محد بيعرف 🤫</p>
            ${tilesHtml(candidatesFor(v), { act: 'v' })}
          </div>`,
          { v: pid => { ballots[v] = pid; bump(v, 'votesCast'); sfx('vote'); i++; step(); } });
      }, { sub: 'دورك تصوّت 🗳️', progress });
    };
    step();
  }

  function pointVote({ prompt, eyebrow, candidatesFor }, done) {
    const all = [...new Set(ids().flatMap(v => candidatesFor(v)))];
    show(`
      <div class="body">
        <span class="pill" style="margin:0 auto">${eyebrow}</span>
        <p class="qtext">${esc(prompt)}</p>
        <p class="muted">على العد الثلاثة… كل واحد يأشر على شخص 👉</p>
      </div>
      ${actions(btn('go', 'ياللا نأشر', 'btn-primary btn-xl'))}`,
      { go: () => countdown(tally, 'أشّروا على…') }, { center: true });

    function tally() {
      const counts = {};
      const h = {
        t: pid => {
          counts[pid] = (counts[pid] || 0) + 1;
          sfx('vote');
          const b = $(`[data-badge="${pid}"]`); b.hidden = false; b.textContent = counts[pid];
          $('#ok').disabled = false;
        },
        reset: () => { Object.keys(counts).forEach(k => delete counts[k]); app.querySelectorAll('[data-badge]').forEach(b => { b.hidden = true; }); $('#ok').disabled = true; },
        ok: () => done(counts, null)
      };
      show(`
        <div class="body top">
          <h2>كم واحد أشّر على كل شخص؟</h2>
          <p class="muted small">دقّوا على الاسم مرة لكل إصبع 👆</p>
          ${tilesHtml(all, { act: 't', badge: () => '' })}
          <button class="link-btn" data-act="reset">صفّر العد</button>
        </div>
        ${actions(btn('ok', 'اكشف النتيجة', 'btn-primary btn-xl', 'id="ok" disabled'))}`, h);
    }
  }

  /**
   * Player picker. Single: done(id|null). Multi: done([ids]).
   */
  function choosePlayers({ title, sub = '', list, multi = false, exact = 0, confirm = 'تم', none = '', back = null }, done) {
    const picked = new Set();
    const h = {
      p: (pid, el) => {
        if (!multi) { sfx('vote'); return done(pid); }
        if (picked.has(pid)) picked.delete(pid);
        else { if (exact && picked.size >= exact) return; picked.add(pid); }
        el.setAttribute('aria-pressed', picked.has(pid));
        const ok = $('#ok'); if (ok) ok.disabled = exact ? picked.size !== exact : false;
      },
      none: () => done(multi ? [] : null),
      ok: () => done([...picked]),
      back: () => back && back()
    };
    show(`
      <div class="body top">
        <h2>${title}</h2>
        ${sub ? `<p class="muted">${sub}</p>` : ''}
        ${tilesHtml(list, { act: 'p', pressed: multi ? () => false : null })}
      </div>
      ${actions(
        multi ? btn('ok', confirm, 'btn-primary btn-xl', `id="ok" ${exact ? 'disabled' : ''}`) : '',
        none ? btn('none', none, 'btn-secondary') : '',
        back ? btn('back', 'رجوع', 'btn-ghost') : '')}`, h);
  }

  /** Small picker inside a bottom sheet — keeps the current screen intact. */
  function modalPick(title, list, cb) {
    openModal(`<h2>${title}</h2>${tilesHtml(list, { act: 'p' })}${btn('close', 'إلغاء', 'btn-ghost')}`,
      { p: pid => { closeModal(); cb(pid); } });
  }

  function loading(next, ms = 1300) {
    show(`<div class="body">${ringHtml(8, true)}<p class="tagline">${pick(C.loading)}</p></div>`, {}, { center: true, bar: false });
    later(next, ms);
  }

  function ringHtml(n, spin) {
    const seats = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const x = 50 + 41 * Math.cos(a), y = 50 + 41 * Math.sin(a);
      return `<span class="seat${spin && i === 0 ? ' hot' : ''}" style="left:${x}%;top:${y}%;animation-delay:${i * 60}ms"></span>`;
    }).join('');
    return `<div class="ring" aria-hidden="true">${seats}<div class="core"><div class="logo" style="font-size:clamp(56px,16vw,88px)">لَمّة</div></div></div>`;
  }

  /* =========================================================
     6. Home, settings & setup flow
     ========================================================= */
  function home() {
    S = null;
    const saved = hasSaved();
    show(`
      <div class="body">
        <div class="ring" aria-hidden="true">
          ${Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * Math.PI * 2 - Math.PI / 2; return `<span class="seat${i === 0 ? ' hot' : ''}" style="left:${50 + 41 * Math.cos(a)}%;top:${50 + 41 * Math.sin(a)}%;animation-delay:${i * 70}ms"></span>`; }).join('')}
          <div class="core"><h1 class="logo">لَمّة</h1><div class="latin">LAMMA</div></div>
        </div>
        <p class="tagline">كل سالفة لها ضحية.</p>
      </div>
      ${actions(
        btn('start', 'ابدأ لمة جديدة', 'btn-primary btn-xl'),
        saved ? btn('resume', 'كمّل اللمة', 'btn-secondary') : '',
        `<div class="home-foot">
          <button class="icon-btn" data-act="settings" aria-label="الإعدادات"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></button>
          <span class="muted small">٣ لاعبين وأكثر · جوال واحد</span>
          <button class="icon-btn" data-act="sound" aria-label="الصوت">${prefs.sound ? '🔊' : '🔈'}</button>
        </div>`)}`,
      {
        start: () => setup.begin(),
        resume: () => { S = readJSON(STORE_KEY); if (!S) return home(); loading(resumeFlow, 900); },
        settings: openSettings,
        sound: (a, el) => { toggleSound(); el.textContent = prefs.sound ? '🔊' : '🔈'; }
      }, { center: true, bar: false });
  }

  function openSettings() {
    const row = (key, title, sub, on, offLabel, onLabel) => `
      <div class="setting"><div><b>${title}</b><small>${sub}</small></div>
      <button class="switch" data-act="toggle" data-arg="${key}" aria-pressed="${on}">${on ? onLabel : offLabel}</button></div>`;
    const render = () => openModal(`
      <h2>الإعدادات</h2>
      ${row('sound', 'الصوت', 'مؤثرات بسيطة للكشف والعد', prefs.sound, 'طافي', 'شغال')}
      ${row('voteStyle', 'طريقة التصويت', 'سري بالدور، أو الكل يأشر مرة وحدة', prefs.voteStyle === 'point', 'سري بالدور', 'نأشر كلنا')}
      ${row('selfVote', 'التصويت على نفسك', 'في "منو فينا؟" بس', prefs.selfVote, 'ممنوع', 'مسموح')}
      ${row('missions', 'المهمات السرية', 'كل لاعب ياخذ مهمة بالسر (+3)', prefs.missions, 'بدون', 'موجودة')}
      ${hasSaved() ? btn('wipe', 'امسح اللمة المحفوظة', 'btn-bad') : ''}
      ${btn('close', 'تمام', 'btn-primary')}`, {
      toggle: key => {
        if (key === 'voteStyle') prefs.voteStyle = prefs.voteStyle === 'point' ? 'secret' : 'point';
        else prefs[key] = !prefs[key];
        savePrefs(); ensureAudio(); render();
      },
      wipe: () => { clearSaved(); closeModal(); toast('انمسحت اللمة 🧹'); home(); }
    });
    render();
  }

  /* ---------- Setup (5 steps) ---------- */
  const setup = (() => {
    let d;
    const stepsBar = n => `<div class="steps" aria-label="الخطوة ${n} من 5">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`;

    function begin(keepPlayers) {
      const roster = readJSON(ROSTER_KEY) || [];
      d = {
        count: keepPlayers ? keepPlayers.length : Math.max(3, Math.min(roster.length || 4, 20)),
        players: keepPlayers ? keepPlayers.map(p => ({ name: p.name, avatar: p.avatar })) : roster.map(p => ({ name: p.name, avatar: p.avatar })),
        audience: ['family'],
        mood: 'all',
        duration: 'normal'
      };
      syncPlayers();
      keepPlayers ? group() : count();
    }

    function syncPlayers() {
      while (d.players.length < d.count) {
        const used = d.players.map(p => p.avatar);
        d.players.push({ name: '', avatar: AVATARS.find(a => !used.includes(a)) || pick(AVATARS) });
      }
      d.players.length = d.count;
    }

    function count() {
      const paint = () => { $('#num').textContent = d.count; $('#minus').disabled = d.count <= 3; $('#plus').disabled = d.count >= 20; $('#hint').textContent = d.count >= 12 ? 'لمة كبيرة! 🔥' : d.count <= 3 ? 'أقل شي ٣' : ''; };
      show(`
        ${stepsBar(1)}
        <div class="body">
          <h1>منو موجود اليوم؟</h1>
          <p class="muted">كم واحد بيلعب؟</p>
          <div class="stepper">
            <button class="icon-btn" id="plus" data-act="plus" aria-label="زيد">+</button>
            <div class="num" id="num" aria-live="polite">${d.count}</div>
            <button class="icon-btn" id="minus" data-act="minus" aria-label="نقّص">−</button>
          </div>
          <p class="muted small" id="hint"></p>
        </div>
        ${actions(btn('next', 'التالي', 'btn-primary btn-xl'), btn('back', 'رجوع', 'btn-ghost'))}`,
        {
          plus: () => { if (d.count < 20) { d.count++; paint(); } },
          minus: () => { if (d.count > 3) { d.count--; paint(); } },
          next: () => { syncPlayers(); names(); },
          back: home
        }, { center: true, bar: false });
      paint();
    }

    function names() {
      const rowHtml = (p, i) => `
        <div class="name-row">
          <button class="av-btn" data-act="avatar" data-arg="${i}" aria-label="غيّر الرمز">${p.avatar}</button>
          <input type="text" inputmode="text" maxlength="16" placeholder="اسم اللاعب ${i + 1}" value="${esc(p.name)}" data-i="${i}" aria-label="اسم اللاعب ${i + 1}" enterkeyhint="next" autocomplete="off">
          ${d.players.length > 3 ? `<button class="del" data-act="del" data-arg="${i}" aria-label="احذف">✕</button>` : ''}
        </div>`;
      show(`
        ${stepsBar(2)}
        <div class="body top">
          <h1>منو موجود اليوم؟</h1>
          <p class="muted small">اكتبوا الأسامي واختاروا رمز لكل واحد</p>
          <div class="names" id="names">${d.players.map(rowHtml).join('')}</div>
          ${d.players.length < 20 ? btn('add', '+ لاعب', 'btn-secondary') : ''}
          <p class="err-msg" id="err" role="alert"></p>
        </div>
        ${actions(btn('next', 'التالي', 'btn-primary btn-xl'), btn('back', 'رجوع', 'btn-ghost'))}`,
        {
          $input: e => { const i = e.target.dataset.i; if (i !== undefined) { d.players[i].name = e.target.value; e.target.classList.remove('err'); $('#err').textContent = ''; } },
          $key: e => {
            if (e.key !== 'Enter' || e.target.dataset.i === undefined) return;
            e.preventDefault();
            const nextInput = $(`input[data-i="${+e.target.dataset.i + 1}"]`);
            nextInput ? nextInput.focus() : e.target.blur();
          },
          avatar: i => openModal(`<h2>اختار رمز</h2><div class="emoji-grid">${AVATARS.map(a => `<button data-act="pickAv" data-arg="${a}" aria-label="${a}">${a}</button>`).join('')}</div>`,
            { pickAv: a => { d.players[i].avatar = a; closeModal(); $(`[data-act="avatar"][data-arg="${i}"]`).textContent = a; } }),
          add: () => { d.count++; syncPlayers(); names(); later(() => { const inp = $(`input[data-i="${d.count - 1}"]`); inp && inp.focus(); }, 50); },
          del: i => { d.players.splice(+i, 1); d.count = d.players.length; names(); },
          next: () => { if (validateNames()) group(); },
          back: count
        }, { bar: false });
    }

    function validateNames() {
      const err = $('#err');
      const inputs = [...app.querySelectorAll('input[data-i]')];
      d.players.forEach(p => { p.name = p.name.trim().replace(/\s+/g, ' '); });
      const blank = d.players.findIndex(p => !p.name);
      if (blank > -1) { inputs[blank].classList.add('err'); inputs[blank].focus(); err.textContent = 'نسيت اسمه ولا شو؟ 😂'; sfx('wrong'); return false; }
      const seen = {};
      for (let i = 0; i < d.players.length; i++) {
        const key = d.players[i].name.toLowerCase();
        if (seen[key] !== undefined) { inputs[i].classList.add('err'); inputs[i].focus(); err.textContent = 'عندنا اثنين بنفس الاسم… عط واحد لقب.'; sfx('wrong'); return false; }
        seen[key] = i;
      }
      if (d.players.length < 3) { err.textContent = 'اللمة تحتاج ناس أكثر 👀'; return false; }
      writeJSON(ROSTER_KEY, d.players);
      return true;
    }

    function choiceScreen({ step, title, sub, items, multi, key, next, back, cols }) {
      const isOn = id => multi ? d[key].includes(id) : d[key] === id;
      const blocked = id => key === 'audience' && id === 'savage' && d.audience.includes('kids');
      show(`
        ${stepsBar(step)}
        <div class="body top">
          <h1>${title}</h1>
          <p class="muted small">${sub}</p>
          <div class="choices${cols === 1 ? ' one' : ''}">
            ${items.map(it => `<button class="choice" data-act="c" data-arg="${it.id}" aria-pressed="${isOn(it.id)}" ${blocked(it.id) ? 'disabled' : ''}>
              ${it.e ? `<span class="e" aria-hidden="true">${it.e}</span>` : ''}<span>${it.t}${it.s ? `<small>${it.s}</small>` : ''}</span></button>`).join('')}
          </div>
          <p class="err-msg" id="err" role="alert"></p>
        </div>
        ${actions(btn('next', step === 5 ? 'ابدأ اللمة 🎉' : 'التالي', 'btn-primary btn-xl'), btn('back', 'رجوع', 'btn-ghost'))}`,
        {
          c: id => {
            if (multi) {
              d[key] = d[key].includes(id) ? d[key].filter(x => x !== id) : [...d[key], id];
              if (id === 'kids' && d[key].includes('kids')) d[key] = d[key].filter(x => x !== 'savage');
            } else d[key] = id;
            choiceScreen({ step, title, sub, items, multi, key, next, back, cols });
          },
          next: () => {
            if (multi && !d[key].length) { $('#err').textContent = 'اختاروا شي واحد على الأقل 🙏'; return; }
            next();
          },
          back
        }, { bar: false });
    }

    function group() {
      choiceScreen({ step: 3, title: 'منو معانا؟', sub: 'تقدرون تختارون أكثر من شي — عشان نختار الأسئلة المناسبة', items: GROUPS, multi: true, key: 'audience', next: mood, back: names });
    }
    function mood() {
      choiceScreen({ step: 4, title: 'شو المزاج اليوم؟', sub: 'نرتب الجولات على كيفكم', items: MOODS, key: 'mood', next: duration, back: group });
    }
    function duration() {
      choiceScreen({ step: 5, title: 'كم بنطوّل؟', sub: 'تقدرون تنهون اللمة بأي وقت من القائمة', items: DURATIONS, key: 'duration', cols: 1, next: launch, back: mood });
    }

    function launch() {
      const players = d.players.map((p, i) => ({ id: 'p' + (i + 1), name: p.name, avatar: p.avatar }));
      S = newGameState(players, { audience: d.audience, mood: d.mood, duration: d.duration, missions: prefs.missions });
      if (prefs.missions) assignMissions();
      S.phase = prefs.missions ? 'missions' : 'between';
      save();
      loading(resumeFlow);
    }

    return { begin };
  })();

  /** In-game menu (top bar). */
  function openGameMenu() {
    openModal(`
      <h2>القائمة</h2>
      ${btn('board', '🏆 وضع اللمة', 'btn-secondary')}
      ${btn('sound', prefs.sound ? '🔊 الصوت: شغال' : '🔈 الصوت: طافي', 'btn-secondary')}
      ${S.phase === 'round' || S.phase === 'between' ? btn('end', '🏁 خلّصوا اللمة الحين', 'btn-secondary') : ''}
      ${btn('home', '🏠 الرئيسية (اللمة تنحفظ)', 'btn-secondary')}
      ${btn('close', 'رجوع للعبة', 'btn-primary')}`, {
      board: () => openModal(`<h2>وضع اللمة 👀</h2>${boardHtml()}${btn('close', 'تمام', 'btn-primary')}`),
      sound: () => { toggleSound(); openGameMenu(); },
      end: () => openModal(`<h2>أكيد؟</h2><p class="muted">بنروح للسؤال الأخير والنتائج على طول.</p>${btn('yes', 'إيه، خلّصوها', 'btn-primary')}${btn('close', 'لا، نكمل', 'btn-ghost')}`, {
        yes: () => {
          closeModal();
          if (S.phase === 'round' && S.currentRound.snapshot) { S.scores = S.currentRound.snapshot.scores; S.statistics = S.currentRound.snapshot.statistics; S.roundNumber--; }
          startFinal();
        }
      }),
      home: () => { save(); closeModal(); home(); }
    });
  }

  /* =========================================================
     7. Round engine — sequence, events, صاحب المجلس
     ========================================================= */
  function resumeFlow() {
    switch (S.phase) {
      case 'missions': return missionIntro();
      case 'round':
        if (S.currentRound.snapshot) { S.scores = clone(S.currentRound.snapshot.scores); S.statistics = clone(S.currentRound.snapshot.statistics); }
        return roundIntro();
      case 'final': return startFinal();
      case 'results': return resultsFlow();
      default: return between();
    }
  }

  /** Picks the next mode by mood weight, never repeating back-to-back and max 2 in the last 4. */
  function nextMode() {
    if (S.roundNumber === 1) return 'who'; // warm-up: everyone votes, everyone laughs
    const hist = S.gameHistory.map(h => h.mode);
    const last = hist[hist.length - 1];
    const recent = hist.slice(-4);
    const entries = Object.entries(WEIGHTS[S.settings.mood])
      .filter(([m]) => m !== last && recent.filter(x => x === m).length < 2)
      .map(([m, w]) => [m, w * (hist.includes(m) ? 1 : 1.8)]);
    let r = Math.random() * entries.reduce((a, [, w]) => a + w, 0);
    for (const [m, w] of entries) { r -= w; if (r <= 0) return m; }
    return entries[0][0];
  }

  function between() {
    S.phase = 'between';
    if (S.pending.length) {
      const k = S.pending.shift();
      save();
      return INTERSTITIALS[k](between);
    }
    if (S.totalRounds && S.roundNumber >= S.totalRounds) return startFinal();
    startRound();
  }

  function startRound() {
    S.roundNumber++;
    const mode = nextMode();
    S.currentMode = mode;
    S.currentRound = { mode, multiplier: 1, immune: null, forced: null, snapshot: clone({ scores: S.scores, statistics: S.statistics }) };
    MODES[mode].setup(S.currentRound);
    S.phase = 'round';
    save();
    roundIntro();
  }

  function finishRound(summary = '') {
    const r = S.currentRound;
    S.gameHistory.push({ round: S.roundNumber, mode: r.mode, summary });
    const expired = [];
    S.activeEvents.forEach(e => { e.left--; });
    S.activeEvents = S.activeEvents.filter(e => (e.left > 0 ? true : (expired.push(e), false)));
    if (expired.length) setTimeout(() => toast('✅ انتهى القانون: ' + expired[0].text), 500);
    S.currentRound = {};
    S.currentMode = null;

    const n = S.roundNumber;
    const done = S.totalRounds && n >= S.totalRounds;
    const pend = [];
    if (!done) {
      if (n % 4 === 0) pend.push('standings');
      if (n >= 2 && n - S.lastEventRound >= 3 && S.activeEvents.length < 2 && Math.random() < 0.5) pend.push('event');
      if (n >= 2 && n - S.lastMajlisRound >= 3 + rand(2)) pend.push('majlis');
    }
    S.pending = pend;
    S.phase = 'between';
    save();
    between();
  }

  /** Round lead (performer / describer): the forced player, else whoever has had the fewest turns. */
  function pickLead(r) {
    if (r.forced) return r.forced;
    const pool = ids().filter(p => p !== r.immune);
    const min = Math.min(...pool.map(p => S.leadCounts[p] || 0));
    const lead = pick(pool.filter(p => (S.leadCounts[p] || 0) === min));
    S.leadCounts[lead] = (S.leadCounts[lead] || 0) + 1;
    return lead;
  }

  /* ---------- صاحب المجلس powers ---------- */
  const POWERS = {
    swap: { e: '🔄', t: 'بدّلها', d: 'تبدّل سؤال أو تحدي الجولة.', modes: null },
    double: { e: '×2', t: 'دبل', d: 'نقاط جولة وحدة تصير دبل.', modes: null },
    pick: { e: '🫵', t: 'ورّطه', d: 'تختار منو ياخذ الدور في الجولة.', modes: ['act', 'taboo', 'dare'] },
    immune: { e: '🛡️', t: 'حصانة', d: 'محد يقدر يختارك أو يصوّت عليك لجولة وحدة.', modes: ['who', 'dare', 'act', 'taboo'] },
    duel: { e: '🔥', t: 'مواجهة', d: 'تختار اثنين يتواجهون على نقطتين.', modes: null }
  };
  const powerApplies = (key, mode) => !POWERS[key].modes || POWERS[key].modes.includes(mode);

  function roundIntro() {
    const r = S.currentRound, m = MODES[r.mode];
    const mj = S.majlis;
    const canUse = mj && !mj.used && powerApplies(mj.power, r.mode);
    show(`
      <div class="body">
        <div class="big-emoji" aria-hidden="true">${m.emoji}</div>
        <h1>${m.title}</h1>
        <p class="muted">${m.blurb}</p>
        <div class="row center">
          ${r.multiplier > 1 ? '<span class="pill wine">×2 النقاط دبل هالجولة</span>' : ''}
          ${r.immune ? `<span class="pill gold">🛡️ ${nm(r.immune)} عنده حصانة</span>` : ''}
          ${r.forced ? `<span class="pill gold">🫵 الدور على ${nm(r.forced)}</span>` : ''}
        </div>
        ${S.activeEvents.length ? `<div class="rules">${S.activeEvents.map(e => `<div class="rule">🚨 ${esc(e.text)}<span class="left">باقي ${roundsLabel(e.left)}</span></div>`).join('')}
          <button class="link-btn" data-act="broke">أحد كسر القانون؟ خصموا منه نقطة</button></div>` : ''}
      </div>
      ${actions(
        btn('go', 'ياللا 🔥', 'btn-primary btn-xl'),
        canUse ? btn('power', `👑 ${nm(mj.pid)}: استخدم «${POWERS[mj.power].t}» ${POWERS[mj.power].e}`, 'btn-gold') : '')}`,
      {
        go: () => m.play(r),
        power: usePower,
        broke: () => modalPick('منو كسر القانون؟ 🚨', ids(), pid => {
          addPoints(pid, -1, 'rulesBroken'); sfx('wrong'); save(); toast(`−1 لـ ${P(pid).name} 🚨`);
        })
      }, { center: true });
  }

  function usePower() {
    const r = S.currentRound, mj = S.majlis;
    const holder = mj.pid;
    const spend = msg => { mj.used = true; save(); sfx('reveal'); toast(msg); roundIntro(); };
    switch (mj.power) {
      case 'swap': MODES[r.mode].setup(r); return spend('🔄 تبدّلت!');
      case 'double': r.multiplier = 2; return spend('×2 النقاط دبل هالجولة');
      case 'immune': r.immune = holder; return spend('🛡️ محد يقدر يقرب منك هالجولة');
      case 'pick':
        return choosePlayers({ title: '🫵 منو تبا تورّط؟', sub: 'هو اللي بياخذ الدور هالجولة', list: others(holder), back: roundIntro },
          pid => { r.forced = pid; S.leadCounts[pid] = (S.leadCounts[pid] || 0) + 1; spend(`🫵 ${P(pid).name} انورط!`); });
      case 'duel':
        return choosePlayers({ title: '🔥 مواجهة', sub: 'اختار اثنين يتواجهون', list: ids(), multi: true, exact: 2, confirm: 'ياللا المواجهة', back: roundIntro },
          pair => duel(pair, () => { mj.used = true; save(); roundIntro(); }));
    }
  }

  function duel([a, b], next) {
    const card = pickCard('fast');
    show(`
      <div class="body">
        <p class="eyebrow">🔥 مواجهة</p>
        <h2>${nm(a)} <span class="muted">ضد</span> ${nm(b)}</h2>
        <div class="card wine"><p class="eyebrow">أول واحد يقول</p><p class="qtext">${esc(card.text)}</p></div>
        <p class="muted small">الحكم: صاحب المجلس 👑</p>
      </div>
      ${actions(btn('w', `فاز ${nm(a)}`, 'btn-primary', `data-arg="${a}"`), btn('w', `فاز ${nm(b)}`, 'btn-primary', `data-arg="${b}"`))}`,
      {
        w: pid => {
          const loser = pid === a ? b : a;
          addPoints(pid, 2, 'challengesWon'); bump(loser, 'challengesLost');
          sfx('winner'); toast(`🔥 ${P(pid).name} +2`); next();
        }
      }, { center: true });
  }

  /* ---------- Between-round interstitials ---------- */
  const INTERSTITIALS = {
    standings: next => showStandings(next),

    event: next => {
      const activeIds = S.activeEvents.map(e => e.id);
      const ev = pickCard('events', activeIds);
      S.activeEvents.push({ id: ev.id, text: ev.text, left: ev.rounds });
      S.lastEventRound = S.roundNumber;
      save();
      sfx('reveal');
      show(`
        <div class="body">
          <div class="big-emoji" aria-hidden="true">🚨</div>
          <p class="eyebrow">قانون جديد</p>
          <div class="card dark"><p class="qtext">${esc(ev.text)}</p><p class="small" style="opacity:.7">لمدة ${roundsLabel(ev.rounds)}</p></div>
          <p class="muted small">اللي يكسره… تقدرون تخصمون منه نقطة من شاشة الجولة 😏</p>
        </div>
        ${actions(btn('ok', 'فهمنا 🫡', 'btn-primary btn-xl'))}`, { ok: next }, { center: true });
    },

    majlis: next => {
      const prev = S.majlis && S.majlis.pid;
      const pid = pick(ids().filter(p => p !== prev));
      const power = pick(Object.keys(POWERS));
      S.majlis = { pid, power, used: false };
      S.lastMajlisRound = S.roundNumber;
      save();
      sfx('winner');
      const pw = POWERS[power];
      show(`
        <div class="body">
          <p class="eyebrow">👑 صاحب المجلس</p>
          <div class="avatar-xl" aria-hidden="true">${av(pid)}</div>
          <div class="who-name">${nm(pid)}</div>
          <div class="card">
            <div class="row"><span class="pill gold">${pw.e} ${pw.t}</span></div>
            <p>${pw.d}</p>
            <p class="muted small">تقدر تستخدمها مرة وحدة، قبل بداية أي جولة تناسبها.</p>
          </div>
        </div>
        ${actions(btn('ok', 'تمام يا الشيخ 👑', 'btn-primary btn-xl'))}`, { ok: next }, { center: true });
    }
  };

  /* =========================================================
     8. Game modes
     Each mode: setup(round) picks content; play(round) runs it and
     ends with finishRound(). Points go through addPoints().
     ========================================================= */
  const nextBtn = () => btn('next', S.totalRounds && S.roundNumber >= S.totalRounds ? 'السؤال الأخير 🔥' : 'الجولة الياية ←', 'btn-primary btn-xl');

  const MODES = {
    /* ---------- MODE 1 · منو فينا؟ ---------- */
    who: {
      title: 'منو فينا؟', emoji: '🫵', blurb: 'سؤال واحد… وكل واحد يصوّت على ضحية.',
      setup(r) { r.card = pickCard('who'); },
      play(r) {
        show(`
          <div class="body">
            <div class="card wine"><p class="eyebrow">🫵 منو فينا؟</p><p class="qtext">${esc(r.card.text)}</p></div>
            <p class="muted small">فكّروا زين… ${prefs.voteStyle === 'point' ? 'بتأشرون كلكم مرة وحدة' : 'التصويت سري'}</p>
          </div>
          ${actions(btn('vote', 'ياللا نصوّت 🗳️', 'btn-primary btn-xl'))}`,
          {
            vote: () => runVote({
              prompt: r.card.text, eyebrow: '🫵 منو فينا؟',
              candidatesFor: v => ids().filter(p => p !== r.immune && (prefs.selfVote || p !== v))
            }, (tally, ballots) => countdown(() => whoReveal(r, tally, ballots), 'والضحية…'))
          }, { center: true });
      }
    },

    /* ---------- MODE 2 · الدخيل ---------- */
    intruder: {
      title: 'الدخيل', emoji: '🕵️', blurb: 'الكل عنده نفس الكلمة… إلا واحد.',
      setup(r) {
        r.card = pickCard('intruder');
        r.intruder = pick(ids().filter(p => p !== S.lastIntruder)) || pick(ids());
      },
      play(r) { intruderReveal(r, 0); }
    },

    /* ---------- MODE 3 · ممنوع تقول ---------- */
    taboo: {
      title: 'ممنوع تقول', emoji: '🤐', blurb: `وصّف الكلمة بدون الكلمات الممنوعة… عندك ${TIMES.taboo} ثانية.`,
      setup(r) { r.firstCard = pickCard('taboo'); },
      play(r) {
        const lead = pickLead(r);
        r.lead = lead;
        handTo(lead, () => show(`
          <div class="body">
            <div class="big-emoji" aria-hidden="true">🤐</div>
            <h2>أنت اللي بتوصّف</h2>
            <p class="muted">عندك ${TIMES.taboo} ثانية. وصّف بدون ما تقول الكلمات الممنوعة… والباقين يخمنون بصوت عالي.</p>
          </div>
          ${actions(btn('go', 'ابدأ الوقت ⏱️', 'btn-primary btn-xl'))}`, { go: () => tabooRun(r) }, { center: true }),
          { sub: 'الشاشة لك بروحك… لا أحد يطالع 👀' });
      }
    },

    /* ---------- MODE 4 · السالفة ناقصة ---------- */
    story: {
      title: 'السالفة ناقصة', emoji: '✍️', blurb: 'كمّلوا الجملة بالسر… والحكم يختار أضحك جواب.',
      setup(r) {
        r.card = pickCard('story');
        r.text = r.card.text.replace(/\{name\}/g, pick(S.players).name);
        r.judge = pick(ids());
      },
      play(r) { storyPlay(r); }
    },

    /* ---------- MODE 5 · تعرف ولا تتفلسف؟ ---------- */
    trivia: {
      title: 'تعرف ولا تتفلسف؟', emoji: '🧠', blurb: 'ثلاث أسئلة. كل واحد يأشر برقم جوابه… وبعدين نكشف.',
      setup(r) {
        const exclude = [];
        r.qs = [0, 1, 2].map(() => { const c = pickCard('trivia', exclude); exclude.push(c.id); return { card: c, answers: shuffle(c.answers) }; });
        r.qi = 0;
      },
      play(r) { r.qi = 0; triviaQuestion(r); }
    },

    /* ---------- MODE 6 · مثّلها ---------- */
    act: {
      title: 'مثّلها', emoji: '🎭', blurb: `واحد يمثّل بدون كلام… والباقين يخمنون في ${TIMES.act} ثانية.`,
      setup(r) { r.card = pickCard('act'); },
      play(r) {
        const lead = pickLead(r);
        r.lead = lead;
        privateReveal(lead, {
          label: 'اضغط لكشف المشهد',
          sub: 'أنت الممثل هالجولة 🎬',
          secret: `<div class="card wine"><p class="eyebrow">🎭 مثّل بدون كلام</p><p class="qtext">${esc(r.card.text)}</p></div><p class="muted">حركات بس… ولا كلمة 🤐</p>`,
          hideLabel: 'جاهز — شغّل الوقت ⏱️'
        }, () => actRun(r));
      }
    },

    /* ---------- MODE 7 · ورّط غيرك ---------- */
    dare: {
      title: 'ورّط غيرك', emoji: '😈', blurb: 'واحد يختار ضحيته… والتحدي ينكشف بعدين.',
      setup(r) { r.card = pickCard('dare'); r.chooser = pick(ids()); },
      play(r) {
        const reveal = target => {
          r.target = target;
          bump(target, 'timesTargeted');
          sfx('reveal');
          dareRun(r);
        };
        if (r.forced) return reveal(r.forced);
        if (r.chooser === r.immune) r.chooser = pick(others(r.immune));
        choosePlayers({
          title: `${nm(r.chooser)}، ورّط أحد 😈`,
          sub: 'اختار ضحيتك قبل لا تشوف التحدي',
          list: ids().filter(p => p !== r.chooser && p !== r.immune)
        }, reveal);
      }
    },

    /* ---------- MODE 8 · أسرع واحد ---------- */
    fast: {
      title: 'أسرع واحد', emoji: '⚡', blurb: 'حطّوا الجوال في النص. أول واحد يضغط اسمه يجاوب.',
      setup(r) {
        const exclude = [];
        r.qs = [0, 1, 2].map(() => { const c = pickCard('fast', exclude); exclude.push(c.id); return c; });
        r.qi = 0;
      },
      play(r) { r.qi = 0; fastQuestion(r); }
    }
  };

  /* ---------- منو فينا: reveal ---------- */
  function whoReveal(r, tally, ballots) {
    const { top, n } = topOf(tally);
    const total = sum(tally);
    Object.entries(tally).forEach(([p, c]) => bump(p, 'votesReceived', c));
    top.forEach(p => bump(p, 'timesTargeted'));
    const mind = [];
    if (ballots) Object.entries(ballots).forEach(([v, t]) => { if (top.includes(t) && v !== t) { addPoints(v, 1); mind.push(v); } });

    let msg;
    if (!top.length) msg = 'محد صوّت؟ 🤔';
    else if (top.length > 1) msg = pick(R.tie);
    else if (n === total && total >= 3) msg = pick(R.unanimous);
    else if (S.lastWhoTop === top[0] || S.statistics[top[0]].timesTargeted >= 3) msg = pick(R.repeat);
    else msg = pick(R.normal);
    S.lastWhoTop = top.length === 1 ? top[0] : null;
    save();
    sfx('winner');
    if (top.length === 1 && n === total && total >= 3) confetti();

    const rest = Object.entries(tally).filter(([p]) => !top.includes(p)).sort((a, b) => b[1] - a[1]);
    show(`
      <div class="body">
        <p class="eyebrow">${esc(r.card.text)}</p>
        <div class="avatar-xl" aria-hidden="true">${top.map(av).join(' ')}</div>
        <div class="who-name">${joinNames(top)}</div>
        <p class="tagline">${votesLabel(n)} ${top.length ? '😂' : ''}</p>
        <p class="pill gold" style="margin:0 auto">${msg}</p>
        ${rest.length ? `<p class="muted small">${rest.map(([p, c]) => `${nm(p)} (${c})`).join(' · ')}</p>` : ''}
        ${mind.length ? `<p class="small">🧠 قروا أفكار الجماعة (+1): ${joinNames(mind)}</p>` : ''}
      </div>
      ${actions(nextBtn())}`, { next: () => finishRound(`${P(top[0]) ? P(top[0]).name : ''} — ${votesLabel(n)}`) }, { center: true });
  }

  /* ---------- الدخيل ---------- */
  function intruderReveal(r, i) {
    const list = ids();
    if (i >= list.length) return intruderClues(r);
    const pid = list[i];
    const isIn = pid === r.intruder;
    const cat = C.categories.words[r.card.category] || '';
    const secret = isIn
      ? `<div class="card dark"><p class="eyebrow">🕵️ سر خطير</p><p class="word">أنت الدخيل 👀</p><p>الفئة: <b>${cat}</b></p></div><p class="muted">اندمج معاهم… وحاول تعرف الكلمة من تلميحاتهم 😏</p>`
      : `<div class="card wine"><p class="eyebrow">الكلمة السرية · ${cat}</p><p class="word">${esc(r.card.word)}</p></div><p class="muted">لا تفضحها… وفتّح عيونك على الدخيل 🕵️</p>`;
    privateReveal(pid, { label: 'اضغط لكشف الكلمة', secret, hideLabel: 'حفظتها، خبّها ✋', progress: `${i + 1} / ${list.length}` },
      () => intruderReveal(r, i + 1));
  }

  function intruderClues(r) {
    const start = pick(S.players);
    show(`
      <div class="body">
        <div class="big-emoji" aria-hidden="true">🗣️</div>
        <h2>كل واحد يعطي تلميح واحد</h2>
        <p class="muted">بصوت عالي، كلمة أو جملة قصيرة. لا تفضح الكلمة… ولا تبيّن إنك ما تعرفها 😏</p>
        <span class="pill gold" style="margin:0 auto">يبدأ: ${av(start.id)} ${esc(start.name)} — وبعدين على اليمين</span>
      </div>
      ${actions(btn('vote', 'خلصنا التلميحات — نصوّت 🗳️', 'btn-primary btn-xl'), btn('again', 'لفّة تلميحات ثانية 🔁', 'btn-ghost'))}`,
      {
        again: () => toast('لفّة ثانية! نفس الترتيب 🔁'),
        vote: () => runVote({
          prompt: 'منو الدخيل؟ 🕵️', eyebrow: '🕵️ الدخيل',
          candidatesFor: v => others(v)
        }, (tally, ballots) => countdown(() => intruderVerdict(r, tally, ballots), 'المتهم الأول…'))
      }, { center: true });
  }

  function intruderVerdict(r, tally, ballots) {
    const { top, n } = topOf(tally);
    Object.entries(tally).forEach(([p, c]) => bump(p, 'suspectVotes', c));
    const caught = top.length === 1 && top[0] === r.intruder;
    sfx('vote');
    show(`
      <div class="body">
        <p class="eyebrow">الجماعة يتهمون…</p>
        <div class="avatar-xl" aria-hidden="true">${top.map(av).join(' ') || '🤷'}</div>
        <div class="who-name">${top.length ? joinNames(top) : 'محد'}</div>
        <p class="tagline">${votesLabel(n)}</p>
      </div>
      ${actions(btn('reveal', 'اكشف الدخيل 👀', 'btn-primary btn-xl'))}`,
      { reveal: () => countdown(() => intruderTruth(r, tally, ballots, caught), 'الدخيل الحقيقي…') }, { center: true });
  }

  function intruderTruth(r, tally, ballots, caught) {
    const x = r.intruder;
    S.lastIntruder = x;
    sfx('intruder');
    const noVotes = !tally[x];
    const done = extra => show(`
      <div class="body">
        <p class="eyebrow">🕵️ الدخيل كان…</p>
        <div class="avatar-xl" aria-hidden="true">${av(x)}</div>
        <div class="who-name">${nm(x)}</div>
        <p class="pill gold" style="margin:0 auto">${caught ? pick(R.caught) : noVotes ? R.noTrust[0] : pick(R.escaped)}</p>
        <p class="muted">الكلمة: <b>${esc(r.card.word)}</b></p>
        ${extra || ''}
      </div>
      ${actions(nextBtn())}`, { next: () => finishRound(`الدخيل ${P(x).name} ${caught ? 'انكشف' : 'نجا'}`) }, { center: true });

    if (caught) {
      bump(x, 'infiltratorLosses');
      if (ballots) {
        const right = Object.keys(ballots).filter(v => ballots[v] === x);
        right.forEach(v => addPoints(v, 1));
        save();
        return done(right.length ? `<p class="small">🎯 صادوه (+1): ${joinNames(right)}</p>` : '');
      }
      // Point-vote mode: ask who pointed at the intruder.
      return choosePlayers({ title: `منو كان مأشّر على ${nm(x)}؟ 🎯`, sub: 'كل واحد صاده ياخذ نقطة', list: others(x), multi: true, confirm: 'تم' },
        right => { right.forEach(v => addPoints(v, 1)); save(); done(right.length ? `<p class="small">🎯 صادوه (+1): ${joinNames(right)}</p>` : ''); });
    }

    // Survived: +2, then one attempt to guess the word for +3.
    addPoints(x, 2, 'infiltratorWins');
    save();
    show(`
      <div class="body">
        <p class="eyebrow">🕵️ الدخيل كان…</p>
        <div class="avatar-xl" aria-hidden="true">${av(x)}</div>
        <div class="who-name">${nm(x)}</div>
        <p class="pill gold" style="margin:0 auto">${noVotes ? R.noTrust[0] : 'نجا! +2 😏'}</p>
        <div class="card"><p class="qtext">${nm(x)}، عندك محاولة وحدة: شو الكلمة؟ 🤔</p><p class="muted small">قولها بصوت عالي… وبعدين اكشفوا.</p></div>
      </div>
      ${actions(btn('show', 'اكشف الكلمة', 'btn-primary btn-xl'))}`,
      {
        show: () => {
          sfx('reveal');
          show(`
            <div class="body">
              <p class="eyebrow">الكلمة كانت</p>
              <div class="card wine"><p class="word">${esc(r.card.word)}</p></div>
              <h2>${nm(x)} جابها؟</h2>
            </div>
            <div class="actions row">${btn('yes', 'جابها ✅ +3', 'btn-good btn-xl')}${btn('no', 'لا ❌', 'btn-bad btn-xl')}</div>`,
            {
              yes: () => { addPoints(x, 3); sfx('winner'); confetti(); save(); done(`<p class="small">🤥 ملك التصريف: نجا وجاب الكلمة (+5)</p>`); },
              no: () => { sfx('wrong'); done('<p class="small">نجا بس ما جاب الكلمة (+2)</p>'); }
            }, { center: true });
        }
      }, { center: true });
  }

  /* ---------- ممنوع تقول ---------- */
  function tabooRun(r) {
    const lead = r.lead;
    const got = [];
    let fouls = 0;
    let card = r.firstCard;
    const paintCard = () => {
      $('#tcard').innerHTML = `<div class="card dark"><p class="eyebrow">الكلمة</p><p class="word">${esc(card.word)}</p>
        <p class="eyebrow">ممنوع تقول</p><ul class="forbid">${card.forbidden.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>`;
    };
    const nextCard = () => { card = pickCard('taboo', [card.id]); paintCard(); };
    const sheet = open => { $('#tcard').hidden = open; $('#tact').hidden = open; $('#tsheet').hidden = !open; };
    const h = {
      ok: () => sheet(true),
      g: pid => {
        got.push({ word: card.word, by: pid || null });
        addPoints(lead, 1, 'tabooWins');
        if (pid) addPoints(pid, 1);
        sfx('reveal');
        sheet(false);
        nextCard();
      },
      skip: () => { sfx('vote'); nextCard(); },
      foul: () => { fouls++; sfx('wrong'); toast('🚫 كلمة ممنوعة!'); nextCard(); }
    };
    show(`
      <div class="body top">
        <div class="row" style="justify-content:space-between"><span class="pill">🤐 ${nm(lead)} يوصّف</span>${timerHtml(TIMES.taboo, true)}</div>
        <div id="tcard"></div>
        <div id="tsheet" hidden>
          <h2>منو عرفها؟</h2>
          ${tilesHtml(others(lead), { act: 'g' })}
          ${btn('g', 'مب متأكدين — كمّل', 'btn-ghost', 'data-arg=""')}
        </div>
      </div>
      <div class="actions" id="tact">
        <div class="actions row" style="position:static;padding:0;background:none">${btn('ok', 'عرفوها ✅', 'btn-good btn-xl')}${btn('skip', 'تخطي ⏭️', 'btn-secondary btn-xl')}</div>
        ${btn('foul', '🚫 قال كلمة ممنوعة', 'btn-ghost')}
      </div>`, h);
    paintCard();
    runTimer(TIMES.taboo, () => {
      sfx(got.length ? 'winner' : 'wrong');
      const guessers = got.filter(g => g.by).map(g => g.by);
      save();
      show(`
        <div class="body">
          <div class="big-emoji" aria-hidden="true">⏰</div>
          <h2>خلص الوقت!</h2>
          <div class="who-name">${nm(lead)}</div>
          <p class="tagline">${got.length ? `وصّف ${got.length === 1 ? 'كلمة وحدة' : got.length === 2 ? 'كلمتين' : got.length + ' كلمات'} 👏` : 'ولا كلمة… المهم المحاولة 😅'}</p>
          ${got.length ? `<p class="muted small">${got.map(g => esc(g.word)).join(' · ')}</p>` : ''}
          ${guessers.length ? `<p class="small">عرفوها (+1): ${joinNames([...new Set(guessers)])}</p>` : ''}
          ${fouls ? `<p class="small muted">🚫 كلمات ممنوعة: ${fouls}</p>` : ''}
        </div>
        ${actions(nextBtn())}`, { next: () => finishRound(`${P(lead).name} وصّف ${got.length}`) }, { center: true });
    });
  }

  /* ---------- السالفة ناقصة ---------- */
  function storyPlay(r) {
    const writers = others(r.judge);
    const answers = {};
    show(`
      <div class="body">
        <div class="card wine"><p class="eyebrow">✍️ كمّل السالفة</p><p class="qtext">${esc(r.text)}</p></div>
        <p class="muted">👑 الحكم: <b>${nm(r.judge)}</b></p>
        <p class="muted small">الباقين يكتبون أجوبتهم بالسر، والحكم يختار أضحك واحد.</p>
      </div>
      ${actions(btn('go', 'ياللا نكتب ✍️', 'btn-primary btn-xl'))}`, { go: () => write(0) }, { center: true });

    function write(i) {
      if (i >= writers.length) return judge();
      const w = writers[i];
      handTo(w, () => show(`
        <div class="body top">
          <div class="card"><p class="eyebrow">✍️ كمّل السالفة</p><p class="qtext">${esc(r.text)}</p></div>
          <label class="sr-only" for="ans">جوابك</label>
          <textarea class="big-input" id="ans" maxlength="90" placeholder="اكتب جوابك هني…" autofocus></textarea>
          <p class="err-msg" id="err" role="alert"></p>
        </div>
        ${actions(btn('send', 'أرسل جوابي 🤫', 'btn-primary btn-xl'))}`,
        {
          send: () => {
            const v = $('#ans').value.trim();
            if (!v) { $('#err').textContent = 'اكتب شي… ولو كلمة 😅'; sfx('wrong'); return; }
            answers[w] = v; sfx('vote'); write(i + 1);
          }
        }), { sub: 'اكتب جوابك بالسر ✍️', progress: `${i + 1} / ${writers.length}` });
    }

    function judge() {
      const order = shuffle(Object.keys(answers));
      handTo(r.judge, () => show(`
        <div class="body top">
          <p class="eyebrow">👑 أنت الحكم</p>
          <p class="qtext">${esc(r.text)}</p>
          <p class="muted small">اقرا الأجوبة بصوت عالي… وبعدين اختار أضحك واحد</p>
          ${order.map((w, i) => `<button class="answer-card" data-act="pickA" data-arg="${w}" style="animation-delay:${i * 60}ms">${esc(answers[w])}</button>`).join('')}
        </div>`,
        {
          pickA: w => countdown(() => {
            addPoints(w, 2, 'storyRoundsWon');
            save(); sfx('winner'); confetti();
            show(`
              <div class="body">
                <p class="eyebrow">😂 أضحك جواب</p>
                <div class="card"><p class="qtext">${esc(r.text.replace(/_{3,}/, '«' + answers[w] + '»'))}</p></div>
                <div class="avatar-xl" aria-hidden="true">${av(w)}</div>
                <div class="who-name">${nm(w)}</div>
                <p class="tagline">+2 👏</p>
              </div>
              ${actions(nextBtn())}`, { next: () => finishRound(`${P(w).name} فاز بالسالفة`) }, { center: true });
          }, 'صاحب الجواب…')
        }), { sub: 'دورك تحكم 👑' });
    }
  }

  /* ---------- تعرف ولا تتفلسف؟ ---------- */
  const NUMS = ['١', '٢', '٣', '٤'];
  function triviaQuestion(r) {
    const q = r.qs[r.qi];
    const cat = C.categories.trivia[q.card.category] || '';
    const answersHtml = revealed => `<div class="answers">${q.answers.map((a, i) => `
      <div class="answer${revealed ? (a === q.card.correct ? ' right' : ' dim') : ''}" style="animation-delay:${i * 60}ms"><span class="n">${NUMS[i]}</span>${esc(a)}</div>`).join('')}</div>`;
    show(`
      <div class="body top">
        <div class="row" style="justify-content:space-between">
          <div class="row"><span class="pill">${cat}</span><span class="pill gold">سؤال ${r.qi + 1} من ${r.qs.length}</span></div>
          ${timerHtml(TIMES.trivia, true)}
        </div>
        <p class="qtext">${esc(q.card.question)}</p>
        ${answersHtml(false)}
        <p class="muted small">كل واحد يرفع أصابعه برقم جوابه ✋ — وتفلسفوا براحتكم</p>
      </div>
      ${actions(btn('reveal', 'اكشف الجواب', 'btn-primary btn-xl'))}`,
      { reveal: reveal }, {});
    runTimer(TIMES.trivia, () => { sfx('wrong'); toast('خلص الوقت! ⏰'); });

    function reveal() {
      sfx('reveal');
      const picked = new Set();
      show(`
        <div class="body top">
          <p class="qtext">${esc(q.card.question)}</p>
          ${answersHtml(true)}
          <h2>منو جاوب صح؟</h2>
          ${tilesHtml(ids(), { act: 'p', pressed: () => false })}
        </div>
        ${actions(btn('ok', 'تم ✅', 'btn-primary btn-xl'))}`,
        {
          p: (pid, el) => { picked.has(pid) ? picked.delete(pid) : picked.add(pid); el.setAttribute('aria-pressed', picked.has(pid)); sfx('vote'); },
          ok: () => {
            ids().forEach(p => picked.has(p) ? addPoints(p, 1, 'correctAnswers') : bump(p, 'wrongAnswers'));
            r.qi++;
            save();
            if (picked.size === S.players.length) toast('الكل جابها! 🧠');
            else if (!picked.size) toast('ولا واحد؟ 😬');
            if (r.qi < r.qs.length) return triviaQuestion(r);
            triviaSummary(r);
          }
        });
    }
  }
  function triviaSummary(r) {
    const snap = r.snapshot.statistics;
    const gains = ids().map(p => [p, S.statistics[p].correctAnswers - snap[p].correctAnswers]).sort((a, b) => b[1] - a[1]);
    const best = gains[0][1];
    const winners = gains.filter(g => g[1] === best && best > 0).map(g => g[0]);
    sfx('winner');
    show(`
      <div class="body">
        <p class="eyebrow">🧠 نهاية الأسئلة</p>
        ${winners.length ? `<div class="avatar-xl" aria-hidden="true">${winners.map(av).join(' ')}</div><div class="who-name">${joinNames(winners)}</div><p class="tagline">${best} من ${r.qs.length} صح</p>`
          : '<div class="big-emoji">😬</div><h2>محد جاب ولا وحدة… تفلسف وبس</h2>'}
      </div>
      ${actions(nextBtn())}`, { next: () => finishRound('أسئلة') }, { center: true });
  }

  /* ---------- مثّلها ---------- */
  function actRun(r) {
    const lead = r.lead;
    const end = (ok, guesser) => {
      if (ok) { addPoints(lead, 2, 'challengesWon'); if (guesser) addPoints(guesser, 1); sfx('winner'); }
      else { bump(lead, 'challengesLost'); sfx('wrong'); }
      save();
      show(`
        <div class="body">
          <p class="eyebrow">🎭 المشهد كان</p>
          <div class="card"><p class="qtext">${esc(r.card.text)}</p></div>
          <div class="who-name">${ok ? '👏 ' + nm(lead) : '😅'}</div>
          <p class="tagline">${ok ? `+2 للممثل${guesser ? ` · +1 لـ ${nm(guesser)}` : ''}` : 'ما عرفوها… الأوسكار السنة الياية'}</p>
        </div>
        ${actions(nextBtn())}`, { next: () => finishRound(`${P(lead).name} ${ok ? 'نجح' : 'ما نجح'} في التمثيل`) }, { center: true });
    };
    show(`
      <div class="body">
        <p class="eyebrow">🎭 مثّلها</p>
        ${timerHtml(TIMES.act)}
        <h2 id="acth">${nm(lead)} يمثّل… خمّنوا!</h2>
        <p class="muted">اللي يعرفها يصارخ بالجواب 📣</p>
      </div>
      ${actions(btn('ok', 'عرفوها ✅', 'btn-good btn-xl'), btn('fail', 'ما عرفوها 😅', 'btn-secondary'))}`,
      {
        ok: () => choosePlayers({ title: 'منو عرفها أول؟', list: others(lead), none: 'مب متأكدين' }, pid => end(true, pid)),
        fail: () => end(false)
      }, { center: true });
    runTimer(TIMES.act, () => { sfx('wrong'); const h = $('#acth'); if (h) h.textContent = 'خلص الوقت! عرفوها ولا لا؟ ⏰'; });
  }

  /* ---------- ورّط غيرك ---------- */
  function dareRun(r) {
    const { chooser, target } = r;
    const verdict = done => {
      if (done) addPoints(target, 2, 'challengesWon');
      else { bump(target, 'challengesLost'); if (!r.forced) addPoints(chooser, 1); }
      sfx(done ? 'winner' : 'wrong');
      save();
      show(`
        <div class="body">
          <div class="big-emoji" aria-hidden="true">${done ? '👏' : '🏳️'}</div>
          <div class="who-name">${nm(target)}</div>
          <p class="tagline">${done ? 'سوّاها! +2' : `انسحب… ${r.forced ? '' : `+1 لـ ${nm(chooser)} 😈`}`}</p>
          ${S.statistics[target].timesTargeted >= 3 ? `<p class="pill gold" style="margin:0 auto">${pick(R.repeat)}</p>` : ''}
        </div>
        ${actions(nextBtn())}`, { next: () => finishRound(`${P(target).name} ${done ? 'سوّا التحدي' : 'انسحب'}`) }, { center: true });
    };
    const h = {
      timer: (a, el) => { el.disabled = true; $('#dtimer').hidden = false; runTimer(TIMES.dare, () => { sfx('wrong'); toast('خلص الوقت ⏰'); }); },
      yes: () => verdict(true),
      no: () => verdict(false)
    };
    show(`
      <div class="body">
        <p class="eyebrow">😈 ${r.forced ? 'صاحب المجلس' : nm(chooser)} ورّط</p>
        <div class="who-name">${av(target)} ${nm(target)}</div>
        <div class="card wine"><p class="eyebrow">التحدي</p><p class="qtext">${esc(r.card.text)}</p></div>
        <div id="dtimer" hidden>${timerHtml(TIMES.dare, true)}</div>
        <button class="link-btn" data-act="timer">شغّل ${TIMES.dare} ثانية ⏱️</button>
      </div>
      <div class="actions row">${btn('yes', 'سوّاها 👏', 'btn-good btn-xl')}${btn('no', 'انسحب 🏳️', 'btn-bad btn-xl')}</div>`, h, { center: true });
  }

  /* ---------- أسرع واحد ---------- */
  function fastQuestion(r) {
    const card = r.qs[r.qi];
    const locked = new Set();
    const nextQ = () => {
      r.qi++; save();
      if (r.qi < r.qs.length) return fastQuestion(r);
      fastSummary(r);
    };
    show(`
      <div class="body">
        <span class="pill gold" style="margin:0 auto">⚡ ${r.qi + 1} من ${r.qs.length}</span>
        <h2>حطّوا الجوال في النص 📱</h2>
        <p class="muted">أول واحد يدق على اسمه ياخذ الفرصة. عنده ${TIMES.fast} ثواني بس!</p>
      </div>
      ${actions(btn('go', 'ياللا! ⚡', 'btn-primary btn-xl'))}`, { go: () => countdown(buzzer, 'جاهزين؟') }, { center: true });

    function buzzer() {
      show(`
        <div class="body top">
          <div class="card wine"><p class="eyebrow">⚡ اذكر</p><p class="qtext">${esc(card.text)}</p></div>
          <p class="muted small" style="text-align:center">${locked.size ? 'سرقة! 🏃 الباقين يقدرون يجاوبون' : 'أول واحد يدق على اسمه 🔔'}</p>
          ${tilesHtml(ids(), { act: 'b', big: true, disabled: p => locked.has(p) })}
        </div>
        ${actions(btn('skip', 'محد جابها 😅 — التالي', 'btn-ghost'))}`,
        { b: answer, skip: () => { sfx('wrong'); nextQ(); } });
    }
    function answer(pid) {
      sfx('buzz');
      const verdict = ok => {
        if (ok) { addPoints(pid, 1, 'fastAnswers'); sfx('winner'); toast(`⚡ ${P(pid).name} +1`); nextQ(); }
        else {
          locked.add(pid); bump(pid, 'wrongAnswers'); sfx('wrong');
          if (locked.size >= S.players.length) { toast('محد جابها 😅'); nextQ(); } else buzzer();
        }
      };
      show(`
        <div class="body">
          <div class="avatar-xl" aria-hidden="true">${av(pid)}</div>
          <div class="who-name">${nm(pid)}</div>
          <p class="qtext">${esc(card.text)}</p>
          ${timerHtml(TIMES.fast)}
        </div>
        <div class="actions row">${btn('ok', 'صح ✅', 'btn-good btn-xl')}${btn('no', 'غلط ❌', 'btn-bad btn-xl')}</div>`,
        { ok: () => verdict(true), no: () => verdict(false) }, { center: true });
      runTimer(TIMES.fast, () => { toast('خلص الوقت ⏰'); verdict(false); });
    }
  }
  function fastSummary(r) {
    const snap = r.snapshot.statistics;
    const gains = ids().map(p => [p, S.statistics[p].fastAnswers - snap[p].fastAnswers]).sort((a, b) => b[1] - a[1]);
    const best = gains[0][1];
    const winners = gains.filter(g => g[1] === best && best > 0).map(g => g[0]);
    show(`
      <div class="body">
        <p class="eyebrow">⚡ أسرع واحد</p>
        ${winners.length ? `<div class="avatar-xl" aria-hidden="true">${winners.map(av).join(' ')}</div><div class="who-name">${joinNames(winners)}</div><p class="tagline">الصاروخ 🚀</p>`
          : '<div class="big-emoji">🐢</div><h2>الكل كان هادي اليوم</h2>'}
      </div>
      ${actions(nextBtn())}`, { next: () => finishRound('أسرع واحد') }, { center: true });
  }

  /* =========================================================
     9. Secret missions & standings
     ========================================================= */
  function assignMissions() {
    const pool = shuffle(C.missions);
    S.players.forEach((p, i) => { const m = pool[i % pool.length]; S.missions[p.id] = { id: m.id, text: m.text, done: false }; });
    S.missionIndex = 0;
  }

  function missionIntro() {
    if (S.missionIndex > 0) return missionTurn();
    show(`
      <div class="body">
        <div class="big-emoji" aria-hidden="true">🕵️</div>
        <h1>مهمات سرية</h1>
        <p class="muted">كل واحد بياخذ مهمة بالسر. خلّصها قبل نهاية اللمة وخذ <b>+3</b>… بس لا أحد يعرف 🤫</p>
      </div>
      ${actions(btn('go', 'ياللا نوزّع المهمات', 'btn-primary btn-xl'), btn('skip', 'بدون مهمات هالمرة', 'btn-ghost'))}`,
      {
        go: missionTurn,
        skip: () => { S.missions = {}; S.settings.missions = false; S.phase = 'between'; save(); between(); }
      }, { center: true });
  }

  function missionTurn() {
    const list = ids();
    if (S.missionIndex >= list.length) { S.phase = 'between'; save(); return loading(between, 900); }
    const pid = list[S.missionIndex];
    privateReveal(pid, {
      label: 'اضغط لكشف مهمتك',
      progress: `${S.missionIndex + 1} / ${list.length}`,
      secret: `<div class="card dark"><p class="eyebrow">🕵️ مهمتك السرية</p><p class="qtext">${esc(S.missions[pid].text)}</p><p class="small" style="opacity:.75">+3 إذا خلّصتها. خلّها سر!</p></div>`,
      hideLabel: 'حفظتها، خبّها ✋'
    }, () => { S.missionIndex++; save(); missionTurn(); });
  }

  /** Someone claims a mission mid-game: the group confirms and it's revealed. */
  function claimMission(back) {
    const open = ids().filter(p => S.missions[p] && !S.missions[p].done);
    if (!open.length) { toast('كل المهمات خلصت 🕵️'); return back(); }
    choosePlayers({ title: 'منو خلّص مهمته؟ 🕵️', list: open, back }, pid => {
      show(`
        <div class="body">
          <div class="avatar-xl" aria-hidden="true">${av(pid)}</div>
          <div class="who-name">${nm(pid)}</div>
          <div class="card dark"><p class="eyebrow">🕵️ مهمته كانت</p><p class="qtext">${esc(S.missions[pid].text)}</p></div>
          <h2>الجماعة يأكدون؟</h2>
        </div>
        <div class="actions row">${btn('yes', 'إيه خلّصها ✅', 'btn-good btn-xl')}${btn('no', 'لا، يحاول بس 😏', 'btn-secondary btn-xl')}</div>`,
        {
          yes: () => { S.missions[pid].done = true; addPoints(pid, 3, 'secretMissionsCompleted'); save(); sfx('winner'); toast(`🕵️ ${P(pid).name} +3`); back(); },
          no: () => { sfx('wrong'); back(); }
        }, { center: true });
    });
  }

  function boardHtml() {
    const medals = ['🥇', '🥈', '🥉'];
    const rank = ranking();
    return `<ol class="board">${rank.map((p, i) => `
      <li class="${i === 0 && S.scores[p.id] > 0 ? 'first' : ''}" style="animation-delay:${i * 60}ms">
        <span class="pos">${medals[i] || i + 1}</span><span aria-hidden="true">${p.avatar}</span>
        <span class="nm">${esc(p.name)}</span><span class="sc">${S.scores[p.id]}</span></li>`).join('')}</ol>`;
  }

  function showStandings(next) {
    const rank = ranking();
    const last = rank[rank.length - 1];
    const lastAlone = rank.length > 2 && S.scores[last.id] < S.scores[rank[rank.length - 2].id];
    const hasMissions = S.settings.missions && Object.values(S.missions).some(m => !m.done);
    show(`
      <div class="body top">
        <h1>وضع اللمة 👀</h1>
        ${boardHtml()}
        ${lastAlone ? `<p class="muted" style="text-align:center">${nm(last.id)}… ${R.last[0]}</p>` : ''}
      </div>
      ${actions(btn('next', 'كمّل', 'btn-primary btn-xl'), hasMissions ? btn('mission', '🕵️ أحد خلّص مهمته السرية؟', 'btn-secondary') : '')}`,
      { next, mission: () => claimMission(() => showStandings(next)) });
  }

  /* =========================================================
     10. Final round, results & awards
     ========================================================= */
  function startFinal() {
    S.phase = 'final';
    S.pending = [];
    S.currentRound = {};
    save();
    show(`
      <div class="body">
        <div class="big-emoji" aria-hidden="true">🔥</div>
        <p class="eyebrow">السؤال الأخير</p>
        <h1>بعد كل اللي صار اليوم…</h1>
      </div>
      ${actions(btn('go', 'كمّل…', 'btn-primary btn-xl'))}`,
      {
        go: () => show(`
          <div class="body">
            <div class="card wine"><p class="eyebrow">🔥 السؤال الأخير</p><p class="qtext">منو يستحق لقب ملك اللمة؟ 👑</p></div>
            <p class="muted small">مب شرط اللي عنده نقاط أكثر… اللي صنع الجو اليوم.</p>
          </div>
          ${actions(btn('vote', 'صوّتوا 🗳️', 'btn-primary btn-xl'))}`,
          {
            vote: () => runVote({ prompt: 'منو يستحق لقب ملك اللمة؟ 👑', eyebrow: '👑 السؤال الأخير', candidatesFor: v => others(v) },
              tally => countdown(() => kingReveal(tally), 'ملك اللمة…'))
          }, { center: true })
      }, { center: true });
  }

  function kingReveal(tally) {
    const { top, n } = topOf(tally);
    Object.entries(tally).forEach(([p, c]) => bump(p, 'kingVotes', c));
    S.final = { kings: top, votes: n };
    S.phase = 'results';
    save();
    show(`<div class="body"><div class="big-emoji">🥁</div><h1>والملك هو…</h1></div>`, {}, { center: true });
    later(() => {
      sfx('winner'); confetti();
      show(`
        <div class="body">
          <p class="eyebrow">👑 ${top.length > 1 ? 'ملوك اللمة' : 'ملك اللمة'}</p>
          <div class="avatar-xl" aria-hidden="true">${top.map(av).join(' ') || '🤷'}</div>
          <div class="who-name">${top.length ? joinNames(top) : 'محد!'}</div>
          <p class="tagline">${votesLabel(n)}</p>
          <p class="muted small">هذا اللقب غير عن بطل النقاط 😉</p>
        </div>
        ${actions(btn('next', 'النتائج 🏆', 'btn-primary btn-xl'))}`, { next: resultsFlow }, { center: true });
    }, 1600);
  }

  function resultsFlow() {
    const hasMissions = S.settings.missions && Object.keys(S.missions).length;
    hasMissions ? missionsReveal() : champion();
  }

  function missionsReveal() {
    const h = {
      t: (pid, el) => {
        const m = S.missions[pid];
        m.done = !m.done;
        addPoints(pid, m.done ? 3 : -3);
        bump(pid, 'secretMissionsCompleted', m.done ? 1 : -1);
        el.setAttribute('aria-pressed', m.done);
        el.textContent = m.done ? 'خلّصها ✅' : 'ما خلّصها';
        sfx(m.done ? 'vote' : 'wrong');
        save();
      },
      next: champion
    };
    show(`
      <div class="body top">
        <h1>🕵️ المهمات السرية</h1>
        <p class="muted small">كل واحد يقرا مهمته… والجماعة يحكمون</p>
        ${ids().map((pid, i) => `
          <div class="setting" style="animation:rise .4s ${i * 60}ms both">
            <div><b>${av(pid)} ${nm(pid)}</b><small>${esc(S.missions[pid].text)}</small></div>
            <button class="switch" data-act="t" data-arg="${pid}" aria-pressed="${S.missions[pid].done}">${S.missions[pid].done ? 'خلّصها ✅' : 'ما خلّصها'}</button>
          </div>`).join('')}
      </div>
      ${actions(btn('next', 'بطل اللمة 🏆', 'btn-primary btn-xl'))}`, h);
  }

  function champion() {
    const rank = ranking();
    const best = S.scores[rank[0].id];
    const champs = rank.filter(p => S.scores[p.id] === best).map(p => p.id);
    show(`<div class="body"><div class="big-emoji">🏆</div><h1>بطل اللمة…</h1></div>`, {}, { center: true });
    later(() => {
      sfx('winner'); confetti();
      show(`
        <div class="body">
          <p class="eyebrow">🏆 بطل اللمة</p>
          <div class="avatar-xl" aria-hidden="true">${champs.map(av).join(' ')}</div>
          <div class="who-name">${joinNames(champs)}</div>
          <p class="tagline">${pointsLabel(best)}</p>
          ${boardHtml()}
        </div>
        ${actions(btn('next', 'الجوايز 🎖️', 'btn-primary btn-xl'))}`, { next: awards }, { center: true });
    }, 1400);
  }

  /** Awards are computed from real session statistics — no random handouts. */
  const AWARDS = [
    { e: '🎯', t: 'عليه إجماع', d: 'أكثر واحد جته أصوات', k: 'votesReceived' },
    { e: '🤥', t: 'ملك التصريف', d: 'دخيل ونجا منها', k: 'infiltratorWins' },
    { e: '🕵️', t: 'ما نثق فيه', d: 'أكثر واحد اتهموه إنه الدخيل', k: 'suspectVotes' },
    { e: '🧠', t: 'موسوعة اللمة', d: 'أكثر إجابات صح', k: 'correctAnswers' },
    { e: '⚡', t: 'الصاروخ', d: 'أسرع واحد في "أسرع واحد"', k: 'fastAnswers' },
    { e: '😭', t: 'الضحية الرسمية', d: 'أكثر واحد انورط واستهدفوه', k: 'timesTargeted' },
    { e: '😂', t: 'يضحكهم بدون قصد', d: 'أجوبته فازت في "السالفة ناقصة"', k: 'storyRoundsWon' },
    { e: '🎭', t: 'نجم الشاشة', d: 'أكثر تحديات وتمثيل ناجح', k: 'challengesWon' },
    { e: '🗣️', t: 'لسانه يوصّف', d: 'أكثر كلمات وصّفها في "ممنوع تقول"', k: 'tabooWins' },
    { e: '🕶️', t: 'العميل السري', d: 'خلّص مهمات سرية', k: 'secretMissionsCompleted' },
    { e: '🚨', t: 'خارج عن القانون', d: 'أكثر واحد كسر القوانين', k: 'rulesBroken' }
  ];

  function computeAwards() {
    const list = [];
    AWARDS.forEach(a => {
      const max = Math.max(...ids().map(p => S.statistics[p][a.k]));
      if (max <= 0) return;
      const who = ids().filter(p => S.statistics[p][a.k] === max);
      if (who.length > 3) return; // not meaningful if half the room ties
      list.push({ ...a, who, val: max });
    });
    const rank = ranking();
    const last = rank[rank.length - 1];
    if (rank.length > 2 && S.scores[last.id] < S.scores[rank[rank.length - 2].id]) {
      list.push({ e: '🤝', t: 'المهم المشاركة', d: 'آخر واحد في الترتيب… بس أول واحد في قلوبنا', who: [last.id], val: S.scores[last.id] });
    }
    return list;
  }

  function awards() {
    const list = computeAwards();
    show(`
      <div class="body top">
        <h1>جوايز اللمة 🎖️</h1>
        <div class="awards">
          ${list.map((a, i) => `
            <div class="award" style="animation-delay:${i * 120}ms">
              <span class="e" aria-hidden="true">${a.e}</span>
              <div><h3>${a.t}</h3><p>${a.d}</p><div class="who">${a.who.map(p => av(p) + ' ' + nm(p)).join('، ')}</div></div>
            </div>`).join('') || '<p class="muted">لمة هادية… ما في جوايز هالمرة 😅</p>'}
        </div>
      </div>
      ${actions(btn('again', 'لمة ثانية بنفس الربع 🔁', 'btn-primary btn-xl'), btn('home', 'الرئيسية', 'btn-secondary'))}`,
      {
        again: () => { const ps = S.players; S.phase = 'done'; save(); clearSaved(); setup.begin(ps); },
        home: () => { S.phase = 'done'; save(); clearSaved(); home(); }
      });
  }

  /* =========================================================
     Boot
     ========================================================= */
  home();
})();
