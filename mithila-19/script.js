/* ════════════════════════════════════════════════════════════════════════════
   script.js — Mithila's 19th Birthday Site
   Plain ES2020 — no build step, no frameworks.
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

// ── State ─────────────────────────────────────────────────────────────────────
const State = {
  currentScene: 0,
  totalScenes: 7,
  giftOpenedSession: false,  // guard double-tap
  musicPending: false,
  musicStarted: false,
  ytPlayer: null,
  audioEl: null,
  candlesBlown: 0,
  wishSent: false,
  photoIndex: 0,
  touchStartX: 0,
  touchStartY: 0,
  letterOpen: false,
  letterDone: false,
  letterLineIdx: 0,
  letterCharIdx: 0,
  letterTimeout: null,
  quizIndex: 0,
  quizDone: false,
  treatData: { treat: null, date: null, time: null, backupDate: null, backupTime: null, place: '', note: '' },
  treatSentCount: 0,
  treatIsUpdate: false,
  calYear: null,
  calMonth: null,
  bcalYear: null,
  bcalMonth: null,
};

// ── Storage helpers (try/catch + in-memory fallback) ─────────────────────────
const _fallback = {};
const store = {
  get(k)    { try { return localStorage.getItem(k); }  catch { return _fallback[k] ?? null; } },
  set(k, v) { try { localStorage.setItem(k, v); }      catch { _fallback[k] = v; } },
  del(k)    { try { localStorage.removeItem(k); }      catch { delete _fallback[k]; } },
};

// ── URL params ────────────────────────────────────────────────────────────────
const IS_TEST  = new URLSearchParams(location.search).has('test');
const IS_RESET = new URLSearchParams(location.search).has('reset');

if (IS_RESET) { store.del('gift_sent'); store.del('treat_count'); }

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', boot);

function boot() {
  // Test mode banner
  if (IS_TEST) document.getElementById('test-tag').removeAttribute('hidden');

  // Persist OG image if set
  if (CONFIG.ogImage) {
    const og = document.createElement('meta');
    og.setAttribute('property', 'og:image');
    og.content = CONFIG.ogImage;
    document.head.appendChild(og);
  }

  // Load persisted data
  State.treatSentCount = parseInt(store.get('treat_count') || '0', 10);

  // Setup music player (loads in background)
  setupMusic();

  // Render each scene's content
  renderScene0();
  renderScene1();
  renderScene2();
  renderScene3();
  renderScene4();
  renderScene5();
  renderScene6();

  // Ambient birthday animation layers
  createBokeh();
  createPetals();
  createSparkles();
  initTapSparkles();

  // Show scene 0
  goToScene(0, true);
}

// ── Navigation ────────────────────────────────────────────────────────────────
function goToScene(n, instant) {
  const prev = document.getElementById(`scene-${State.currentScene}`);
  const next = document.getElementById(`scene-${n}`);
  if (!next) return;

  // Deactivate previous
  if (prev && prev !== next) {
    prev.classList.remove('scene--active');
    prev.setAttribute('aria-hidden', 'true');
  }

  State.currentScene = n;
  next.classList.add('scene--active');
  next.removeAttribute('aria-hidden');
  next.scrollTop = 0;

  // Back button
  const backBtn = document.getElementById('back-btn');
  if (n === 0) {
    backBtn.setAttribute('hidden', '');
  } else {
    backBtn.removeAttribute('hidden');
  }

  // Keep romantic birthday animations active on all scenes
  const bokeh = document.getElementById('bokeh-layer');
  const petals = document.getElementById('petals-layer');
  const sparkles = document.getElementById('sparkles-layer');
  if (bokeh) bokeh.style.display = 'block';
  if (petals) petals.style.display = 'block';
  if (sparkles) sparkles.style.display = 'block';

  // Scene-specific on-enter hooks
  if (n === 2) onEnterPhotos();
  if (n === 3) onEnterFlipCards();
  if (n === 4) {
    State.quizIndex = 0;
    State.quizDone = false;
    document.getElementById('quiz-question').removeAttribute('hidden');
    document.getElementById('quiz-counter').removeAttribute('hidden');
    document.getElementById('quiz-btn-row').removeAttribute('hidden');
    document.getElementById('quiz-verdict-wrap').setAttribute('hidden', '');
    document.getElementById('quiz-reaction').setAttribute('hidden', '');
    showQuizQuestion();
  }
  if (n === 5) onEnterLetter();
}

document.getElementById('back-btn').addEventListener('click', () => {
  if (State.currentScene > 0) goToScene(State.currentScene - 1, false);
});

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 0: THE GIFT
// ══════════════════════════════════════════════════════════════════════════════
function renderScene0() {
  document.getElementById('open-gift-cta').addEventListener('click', handleGiftCTA);
  document.getElementById('gift-box-btn').addEventListener('click', handleGiftCTA);

  // Check unlock time
  checkUnlockTime();
}

function checkUnlockTime() {
  if (!CONFIG.unlockTime || IS_TEST) return; // open immediately (bypassed in test mode)

  const unlockMs = new Date(CONFIG.unlockTime).getTime();

  function tick() {
    const now = Date.now();
    const diff = unlockMs - now;

    if (diff <= 0) {
      clearInterval(timerId);
      document.getElementById('countdown-wrap').setAttribute('hidden', '');
      document.getElementById('gift-box-btn').classList.remove('gift--locked');
      return;
    }

    document.getElementById('countdown-wrap').removeAttribute('hidden');
    document.getElementById('gift-box-btn').classList.add('gift--locked');

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.getElementById('cd-h').textContent = String(h).padStart(2, '0');
    document.getElementById('cd-m').textContent = String(m).padStart(2, '0');
    document.getElementById('cd-s').textContent = String(s).padStart(2, '0');
  }

  const timerId = setInterval(tick, 1000);
  tick();
}

let giftOpenGuard = false;

function handleGiftCTA() {
  // If locked (countdown not reached)
  if (document.getElementById('gift-box-btn').classList.contains('gift--locked')) {
    const box = document.getElementById('gift-box-btn');
    box.classList.add('gift--shake');
    box.addEventListener('animationend', () => box.classList.remove('gift--shake'), { once: true });
    return;
  }

  if (giftOpenGuard || State.giftOpenedSession) return;
  giftOpenGuard = true;
  State.giftOpenedSession = true;

  // 1. Start music (this call is inside a user gesture)
  startMusic();

  // 2. Animate lid lift
  document.getElementById('gift-lid').classList.add('lid--open');
  document.getElementById('gift-light-spill').classList.add('spill--on');

  // 3. Vibrate (where supported)
  try { navigator.vibrate([60, 40, 80]); } catch (_) {}

  // 4. Confetti burst
  setTimeout(() => {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#FF6B8B', '#FFB3C6', '#FA5277', '#FFD166', '#FFFFFF', '#FFE5EC'],
        startVelocity: 32,
      });
    }
  }, 350);

  // 5. Fire gift-opened email (guarded by localStorage, only after success)
  if (!IS_TEST) {
    const alreadySent = store.get('gift_sent') === '1';
    if (!alreadySent) {
      sendGiftEmail();
    }
  }

  // 6. Advance to scene 1
  setTimeout(() => {
    goToScene(1, false);
    giftOpenGuard = false;
  }, 1800);
}

async function sendGiftEmail() {
  const now = new Date();
  const sentAt = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const payload = {
    _subject: '🎁 Mithila just opened your gift!',
    opened_at: sentAt,
    note: 'She tapped the gift! The adventure begins. 🎉',
  };

  const ok = await postFormspree(CONFIG.formspreeGiftEndpoint, payload);
  if (ok) {
    store.set('gift_sent', '1');
    return;
  }
  // Retry once
  const ok2 = await postFormspree(CONFIG.formspreeGiftEndpoint, payload);
  if (ok2) store.set('gift_sent', '1');
}

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 1: BIRTHDAY
// ══════════════════════════════════════════════════════════════════════════════
function renderScene1() {
  document.getElementById('bday-line-1').textContent = CONFIG.birthdayMessage[0] || '';
  document.getElementById('bday-line-2').textContent = CONFIG.birthdayMessage[1] || '';

  // Candle tap handlers
  document.getElementById('flame-1').addEventListener('click', () => blowCandle('candle-1', 'flame-1'));
  document.getElementById('flame-9').addEventListener('click', () => blowCandle('candle-9', 'flame-9'));

  // Swipe-to-blow across cake
  const cake = document.getElementById('cake');
  let swipeActive = false;

  cake.addEventListener('touchstart', e => {
    swipeActive = true;
    checkSwipeOverFlames(e.touches[0]);
  }, { passive: true });

  cake.addEventListener('touchmove', e => {
    if (!swipeActive) return;
    checkSwipeOverFlames(e.touches[0]);
  }, { passive: true });

  cake.addEventListener('touchend', () => { swipeActive = false; }, { passive: true });

  // Wish
  document.getElementById('wish-send-btn').addEventListener('click', sendWish);
  document.getElementById('wish-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') sendWish();
  });

  // Next
  document.getElementById('birthday-next-btn').addEventListener('click', () => goToScene(2, false));
}

function checkSwipeOverFlames(touch) {
  ['flame-1', 'flame-9'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const expanded = 20; // extra tap area
    if (touch.clientX >= r.left - expanded && touch.clientX <= r.right + expanded &&
        touch.clientY >= r.top  - expanded && touch.clientY <= r.bottom + expanded) {
      const candleId = id === 'flame-1' ? 'candle-1' : 'candle-9';
      blowCandle(candleId, id);
    }
  });
}

function blowCandle(candleId, flameId) {
  const candle = document.getElementById(candleId);
  const flame  = document.getElementById(flameId);
  if (!candle || !flame) return;
  if (candle.dataset.blown === 'true') return;

  candle.dataset.blown = 'true';
  flame.classList.add('blown-out');

  try { navigator.vibrate(30); } catch (_) {}

  State.candlesBlown++;

  if (State.candlesBlown >= 2) {
    // Both blown — show wish input
    document.getElementById('candle-hint').setAttribute('hidden', '');
    setTimeout(() => {
      document.getElementById('wish-wrap').removeAttribute('hidden');
    }, 600);
  }
}

function sendWish() {
  if (State.wishSent) return;
  const input = document.getElementById('wish-input');
  const text  = input.value.trim();
  if (!text) return;

  State.wishSent = true;

  // Show floating lantern
  const lantern = document.getElementById('wish-lantern');
  lantern.textContent = text;
  lantern.classList.add('rising');

  // Clear input
  input.value = '';
  input.disabled = true;
  document.getElementById('wish-send-btn').disabled = true;

  // After lantern disappears, show Next button
  setTimeout(() => {
    lantern.classList.remove('rising');
    lantern.textContent = '';
    document.getElementById('wish-wrap').setAttribute('hidden', '');
    document.getElementById('birthday-next-btn').removeAttribute('hidden');
  }, 2600);
}

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 2: MOMENTS (Aesthetic Single-Deck Polaroid Carousel)
// ══════════════════════════════════════════════════════════════════════════════
let isPhotoTransitioning = false;

function renderScene2() {
  const card = document.getElementById('polaroid-card');
  const prevBtn = document.getElementById('photo-prev-btn');
  const nextBtn = document.getElementById('photo-next-btn');
  const flipBtn = document.getElementById('photo-flip-btn');
  const zoomBtn = document.getElementById('photo-zoom-btn');

  // Initial display
  updatePolaroidDisplay(false);

  // Clicking the card advances to next photo!
  if (card) {
    card.addEventListener('click', () => nextPhoto());
  }

  // Buttons
  if (prevBtn) prevBtn.addEventListener('click', () => prevPhoto());
  if (nextBtn) nextBtn.addEventListener('click', () => nextPhoto());
  if (flipBtn) flipBtn.addEventListener('click', () => nextPhoto());
  if (zoomBtn) zoomBtn.addEventListener('click', () => openLightbox(State.photoIndex));

  document.getElementById('moments-next-btn').addEventListener('click', () => goToScene(3, false));

  // Lightbox close
  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('photo-lightbox').addEventListener('click', e => {
    if (e.target === document.getElementById('photo-lightbox')) closeLightbox();
  });

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (!document.getElementById('scene-2').classList.contains('scene--active')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') nextPhoto();
    if (e.key === 'ArrowLeft') prevPhoto();
    if (e.key === 'Escape' && !document.getElementById('photo-lightbox').hasAttribute('hidden')) closeLightbox();
  });

  setupPolaroidSwipe();
}

function onEnterPhotos() {
  State.photoIndex = 0;
  updatePolaroidDisplay(false);
}

function nextPhoto() {
  if (isPhotoTransitioning) return;
  const total = CONFIG.photos.length;

  if (State.photoIndex >= total - 1) {
    // Loop back to beginning so she can view again
    State.photoIndex = 0;
    updatePolaroidDisplay(true, 'right');
    return;
  }

  State.photoIndex++;
  updatePolaroidDisplay(true, 'right');
  triggerMiniConfetti();
}

function prevPhoto() {
  if (isPhotoTransitioning) return;
  if (State.photoIndex <= 0) return;

  State.photoIndex--;
  updatePolaroidDisplay(true, 'left');
}

function updatePolaroidDisplay(animate, direction = 'right') {
  const total = CONFIG.photos.length;
  const current = State.photoIndex;
  const photo = CONFIG.photos[current];
  const caption = CONFIG.photoCaptions[current] || '';

  const card = document.getElementById('polaroid-card');
  const img  = document.getElementById('polaroid-img');
  const cap  = document.getElementById('polaroid-caption');
  const prevBtn = document.getElementById('photo-prev-btn');
  const nextBtn = document.getElementById('photo-next-btn');
  const flipBtn = document.getElementById('photo-flip-btn');
  const advanceBtn = document.getElementById('moments-next-btn');

  if (!card || !img || !cap) return;

  if (animate) {
    isPhotoTransitioning = true;
    card.classList.remove('polaroid-anim-in', 'polaroid-anim-out');
    card.classList.add('polaroid-anim-out');

    setTimeout(() => {
      img.src = `assets/photos/${photo.file}`;
      img.alt = photo.alt;
      cap.textContent = caption;

      card.classList.remove('polaroid-anim-out');
      card.classList.add('polaroid-anim-in');

      setTimeout(() => {
        card.classList.remove('polaroid-anim-in');
        isPhotoTransitioning = false;
      }, 350);
    }, 240);
  } else {
    img.src = `assets/photos/${photo.file}`;
    img.alt = photo.alt;
    cap.textContent = caption;
  }

  if (prevBtn) prevBtn.disabled = current <= 0;
  if (nextBtn) nextBtn.disabled = false;

  if (current >= total - 1) {
    if (advanceBtn) advanceBtn.removeAttribute('hidden');
    if (flipBtn) flipBtn.textContent = 'View again 🌸';
  } else {
    if (flipBtn) flipBtn.textContent = 'Next photo 🌸';
  }
}

function setupPolaroidSwipe() {
  const card = document.getElementById('polaroid-card');
  if (!card || card.dataset.swipeInit) return;
  card.dataset.swipeInit = 'true';

  let startX = 0;
  let startY = 0;

  card.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  card.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;

    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        nextPhoto();
      } else {
        prevPhoto();
      }
    }
  }, { passive: true });
}

function triggerMiniConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 18,
      spread: 45,
      origin: { y: 0.65 },
      colors: ['#FF6B8B', '#FFB3C6', '#FA5277', '#FFD166', '#FFFFFF'],
      disableForReducedMotion: true,
      ticks: 70,
      gravity: 1.1,
      scalar: 0.8
    });
  }
}

function openLightbox(index) {
  const photo = CONFIG.photos[index];
  const img   = document.getElementById('lightbox-img');
  const cap   = document.getElementById('lightbox-caption');
  img.src = `assets/photos/${photo.file}`;
  img.alt = photo.alt;
  cap.textContent = CONFIG.photoCaptions[index] || '';
  document.getElementById('photo-lightbox').removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('photo-lightbox').setAttribute('hidden', '');
  document.body.style.overflow = '';
}

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 3: TEN THINGS (flip cards)
// ══════════════════════════════════════════════════════════════════════════════
function renderScene3() {
  const grid = document.getElementById('flip-cards-grid');
  grid.innerHTML = '';

  CONFIG.compliments.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'flip-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', `Card ${i + 1}: ${item.front}. Tap to flip.`);
    card.tabIndex = 0;

    const inner = document.createElement('div');
    inner.className = 'flip-card-inner';

    const front = document.createElement('div');
    front.className = 'flip-front';
    front.setAttribute('aria-hidden', 'true');
    front.textContent = item.front;

    const back = document.createElement('div');
    back.className = 'flip-back';
    back.setAttribute('aria-hidden', 'true');
    back.textContent = item.back;

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);
    grid.appendChild(card);

    function flip() {
      card.classList.toggle('flipped');
      const flipped = card.classList.contains('flipped');
      card.setAttribute('aria-label', flipped
        ? `Card ${i + 1}: ${item.back}`
        : `Card ${i + 1}: ${item.front}. Tap to flip.`);
    }

    card.addEventListener('click', flip);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
  });

  document.getElementById('tenthings-next-btn').addEventListener('click', () => goToScene(4, false));
}

function onEnterFlipCards() {
  // Reset any flipped cards
  document.querySelectorAll('.flip-card.flipped').forEach(c => c.classList.remove('flipped'));
}

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 4: QUIZ
// ══════════════════════════════════════════════════════════════════════════════
function renderScene4() {
  document.getElementById('quiz-me-btn').addEventListener('click', () => handleQuizAnswer('me'));
  document.getElementById('quiz-you-btn').addEventListener('click', () => handleQuizAnswer('you'));
  document.getElementById('quiz-next-btn').addEventListener('click', () => goToScene(5, false));
}

function showQuizQuestion() {
  const q = CONFIG.quizQuestions[State.quizIndex];
  document.getElementById('quiz-question').textContent = q.q;
  document.getElementById('quiz-counter').textContent = `${State.quizIndex + 1} / ${CONFIG.quizQuestions.length}`;
  document.getElementById('quiz-reaction').setAttribute('hidden', '');
  document.getElementById('quiz-btn-row').removeAttribute('hidden');
  document.getElementById('quiz-verdict-wrap').setAttribute('hidden', '');
  document.getElementById('quiz-question-wrap').removeAttribute('hidden');
}

function handleQuizAnswer(choice) {
  if (State.quizDone) return;

  const q = CONFIG.quizQuestions[State.quizIndex];
  const reaction = choice === 'me' ? q.meReact : q.youReact;

  // Show reaction
  const reactionEl = document.getElementById('quiz-reaction');
  reactionEl.textContent = reaction;
  reactionEl.removeAttribute('hidden');

  // Disable buttons briefly
  document.getElementById('quiz-me-btn').disabled  = true;
  document.getElementById('quiz-you-btn').disabled = true;

  setTimeout(() => {
    State.quizIndex++;
    document.getElementById('quiz-me-btn').disabled  = false;
    document.getElementById('quiz-you-btn').disabled = false;

    if (State.quizIndex >= CONFIG.quizQuestions.length) {
      showQuizVerdict();
    } else {
      showQuizQuestion();
    }
  }, 1600);
}

function showQuizVerdict() {
  State.quizDone = true;
  document.getElementById('quiz-btn-row').setAttribute('hidden', '');
  document.getElementById('quiz-reaction').setAttribute('hidden', '');
  document.getElementById('quiz-question').setAttribute('hidden', '');
  document.getElementById('quiz-counter').setAttribute('hidden', '');

  const verdicts = CONFIG.quizVerdicts;
  const text = verdicts[Math.floor(Math.random() * verdicts.length)];
  document.getElementById('quiz-verdict-text').textContent = text;
  document.getElementById('quiz-verdict-wrap').removeAttribute('hidden');
}

// goToScene scene-entry hooks are called at the bottom of the original function.
// The quiz entry is handled there via onEnterQuiz().

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 5: LETTER
// ══════════════════════════════════════════════════════════════════════════════
function renderScene5() {
  document.getElementById('envelope-btn').addEventListener('click', openLetter);
  document.getElementById('letter-next-btn').addEventListener('click', () => goToScene(6, false));
  document.getElementById('letter-skip-btn').addEventListener('click', skipLetterTyping);
}

function onEnterLetter() {
  // Reset if re-entering
  if (State.letterOpen) return;
  document.getElementById('letter-paper').setAttribute('hidden', '');
  document.getElementById('letter-next-btn').setAttribute('hidden', '');
  document.getElementById('env-flap').classList.remove('flap--open');
  document.getElementById('env-hint').removeAttribute('hidden');
  document.getElementById('letter-lines').textContent = '';
  State.letterOpen = false;
  State.letterDone = false;
  const s5 = document.getElementById('scene-5');
  if (s5) s5.scrollTop = 0;
}

function openLetter() {
  if (State.letterOpen) return;
  State.letterOpen = true;

  document.getElementById('env-flap').classList.add('flap--open');
  document.getElementById('env-hint').setAttribute('hidden', '');

  setTimeout(() => {
    document.getElementById('envelope-wrap').setAttribute('hidden', '');
    const paper = document.getElementById('letter-paper');
    paper.removeAttribute('hidden');
    const s5 = document.getElementById('scene-5');
    if (s5) s5.scrollTop = 0;
    State.letterLineIdx = 0;
    State.letterCharIdx = 0;
    typeLetter();
  }, 700);
}

function typeLetter() {
  if (State.letterDone) return;
  const lines = CONFIG.letter;

  if (State.letterLineIdx >= lines.length) {
    finishLetter();
    return;
  }

  const linesContainer = document.getElementById('letter-lines');

  // Ensure line element exists
  let lineEl = linesContainer.querySelector(`.letter-line[data-line="${State.letterLineIdx}"]`);
  if (!lineEl) {
    lineEl = document.createElement('span');
    lineEl.className = 'letter-line';
    lineEl.dataset.line = String(State.letterLineIdx);
    linesContainer.appendChild(lineEl);
  }

  const fullLine = lines[State.letterLineIdx];

  if (fullLine === '') {
    // Blank line — just add it immediately and move on
    lineEl.innerHTML = '&nbsp;';
    State.letterLineIdx++;
    State.letterCharIdx = 0;
    clearTimeout(State.letterTimeout);
    State.letterTimeout = setTimeout(typeLetter, 100);
    return;
  }

  if (State.letterCharIdx < fullLine.length) {
    lineEl.textContent = fullLine.slice(0, State.letterCharIdx + 1);
    State.letterCharIdx++;
    State.letterTimeout = setTimeout(typeLetter, 28);
  } else {
    // Line done
    State.letterLineIdx++;
    State.letterCharIdx = 0;
    State.letterTimeout = setTimeout(typeLetter, 120);
  }
}

function skipLetterTyping() {
  clearTimeout(State.letterTimeout);
  const linesContainer = document.getElementById('letter-lines');
  linesContainer.innerHTML = '';

  CONFIG.letter.forEach((line, i) => {
    const lineEl = document.createElement('span');
    lineEl.className = 'letter-line';
    lineEl.dataset.line = String(i);
    lineEl.textContent = line === '' ? '\u00A0' : line;
    linesContainer.appendChild(lineEl);
  });

  finishLetter();
}

function finishLetter() {
  State.letterDone = true;
  document.getElementById('letter-skip-btn').setAttribute('hidden', '');
  setTimeout(() => {
    const nextBtn = document.getElementById('letter-next-btn');
    if (nextBtn) {
      nextBtn.removeAttribute('hidden');
      nextBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 400);
}

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 6: TREAT
// ══════════════════════════════════════════════════════════════════════════════
function renderScene6() {
  renderTreatOptions();
  initCalendars();
  renderTimeChips('time-chips', false);
  renderTimeChips('backup-time-chips', true);

  document.getElementById('cal-prev').addEventListener('click', () => { moveCalMonth(-1, false); });
  document.getElementById('cal-next').addEventListener('click', () => { moveCalMonth(1, false); });
  document.getElementById('bcal-prev').addEventListener('click', () => { moveCalMonth(-1, true); });
  document.getElementById('bcal-next').addEventListener('click', () => { moveCalMonth(1, true); });

  document.getElementById('treat-place').addEventListener('input', e => {
    State.treatData.place = e.target.value;
    updateTreatSummary();
  });

  document.getElementById('treat-note').addEventListener('input', e => {
    State.treatData.note = e.target.value;
  });

  document.getElementById('treat-submit-btn').addEventListener('click', () => {
    submitTreat(State.treatIsUpdate);
  });

  document.getElementById('ics-btn').addEventListener('click', () => {
    downloadICS();
  });

  document.getElementById('change-pick-btn').addEventListener('click', () => {
    // Hide success, show form again
    document.getElementById('treat-success').setAttribute('hidden', '');
    State.treatIsUpdate = true;
    // Reset selections
    State.treatData = { treat: null, date: null, time: null, backupDate: null, backupTime: null, place: '', note: '' };
    document.querySelectorAll('.treat-card').forEach(c => c.classList.remove('treat-card--selected'));
    document.getElementById('treat-date-wrap').setAttribute('hidden', '');
    document.getElementById('treat-time-wrap').setAttribute('hidden', '');
    document.getElementById('treat-optional-wrap').setAttribute('hidden', '');
    document.getElementById('treat-summary-wrap').setAttribute('hidden', '');
    document.getElementById('treat-submit-btn').disabled = true;
    document.getElementById('treat-error').setAttribute('hidden', '');
    document.getElementById('treat-place').value = '';
    document.getElementById('treat-note').value = '';
  });
}

function renderTreatOptions() {
  const container = document.getElementById('treat-options');
  container.innerHTML = '';

  CONFIG.treatOptions.forEach((opt, i) => {
    const card = document.createElement('button');
    card.className = 'treat-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', `${opt.label}`);
    card.setAttribute('aria-pressed', 'false');

    const emoji = document.createElement('span');
    emoji.className = 'treat-card-emoji';
    emoji.textContent = opt.emoji;
    emoji.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.className = 'treat-card-label';
    label.textContent = opt.label;

    card.appendChild(emoji);
    card.appendChild(label);
    container.appendChild(card);

    card.addEventListener('click', () => {
      document.querySelectorAll('.treat-card').forEach(c => {
        c.classList.remove('treat-card--selected');
        c.setAttribute('aria-pressed', 'false');
      });
      card.classList.add('treat-card--selected');
      card.setAttribute('aria-pressed', 'true');
      State.treatData.treat = opt;
      document.getElementById('treat-date-wrap').removeAttribute('hidden');
      updateTreatSummary();
      validateTreat();
    });
  });
}

function initCalendars() {
  const today = new Date();
  State.calYear  = today.getFullYear();
  State.calMonth = today.getMonth();
  State.bcalYear  = today.getFullYear();
  State.bcalMonth = today.getMonth();
  renderCalendar('cal-grid', 'cal-month-label', 'cal-prev', 'cal-next', false);
  renderCalendar('bcal-grid', 'bcal-month-label', 'bcal-prev', 'bcal-next', true);
}

function moveCalMonth(dir, isBackup) {
  if (isBackup) {
    State.bcalMonth += dir;
    if (State.bcalMonth < 0)  { State.bcalMonth = 11; State.bcalYear--; }
    if (State.bcalMonth > 11) { State.bcalMonth = 0;  State.bcalYear++; }
    renderCalendar('bcal-grid', 'bcal-month-label', 'bcal-prev', 'bcal-next', true);
  } else {
    State.calMonth += dir;
    if (State.calMonth < 0)  { State.calMonth = 11; State.calYear--; }
    if (State.calMonth > 11) { State.calMonth = 0;  State.calYear++; }
    renderCalendar('cal-grid', 'cal-month-label', 'cal-prev', 'cal-next', false);
  }
}

function renderCalendar(gridId, labelId, prevId, nextId, isBackup) {
  const year  = isBackup ? State.bcalYear  : State.calYear;
  const month = isBackup ? State.bcalMonth : State.calMonth;

  document.getElementById(labelId).textContent =
    new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const grid = document.getElementById(gridId);
  grid.innerHTML = '';

  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const winStart = new Date(CONFIG.treatWindowStart + 'T00:00:00+05:30');
  const winEnd   = new Date(CONFIG.treatWindowEnd   + 'T00:00:00+05:30');

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth     = new Date(year, month + 1, 0).getDate();

  const selectedDate = isBackup ? State.treatData.backupDate : State.treatData.date;

  // Prev nav arrow: disable if current display month is before or at the first possible month
  const prevBtn = document.getElementById(prevId);
  const monthStart = new Date(year, month, 1);
  const winStartMonth = new Date(winStart.getFullYear(), winStart.getMonth(), 1);
  prevBtn.disabled = monthStart <= winStartMonth;

  // Next nav arrow: disable if past winEnd
  const nextBtn = document.getElementById(nextId);
  const monthEnd = new Date(year, month + 1, 0);
  nextBtn.disabled = monthEnd >= winEnd;

  // Blank leading cells
  for (let i = 0; i < firstDayOfMonth; i++) {
    grid.appendChild(document.createElement('div'));
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const btn = document.createElement('button');
    btn.className = 'cal-day';
    btn.textContent = String(d);

    const cellDate = new Date(year, month, d);
    cellDate.setHours(0, 0, 0, 0);

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    if (cellDate < today || cellDate < winStart || cellDate > winEnd) {
      btn.disabled = true;
      btn.classList.add('cal-day--disabled');
      btn.setAttribute('aria-disabled', 'true');
    } else {
      btn.setAttribute('aria-label', new Date(year, month, d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }));

      if (selectedDate === dateStr) {
        btn.classList.add('cal-day--selected');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.setAttribute('aria-pressed', 'false');
      }

      btn.addEventListener('click', () => {
        if (isBackup) {
          State.treatData.backupDate = dateStr;
          document.getElementById('backup-time-chips').style.display = '';
        } else {
          State.treatData.date = dateStr;
          document.getElementById('treat-time-wrap').removeAttribute('hidden');
        }
        renderCalendar(gridId, labelId, prevId, nextId, isBackup);
        renderTimeChips(isBackup ? 'backup-time-chips' : 'time-chips', isBackup);
        updateTreatSummary();
        validateTreat();
      });
    }

    grid.appendChild(btn);
  }
}

function renderTimeChips(containerId, isBackup) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const slots = generateTimeSlots(CONFIG.timeSlotStart, CONFIG.timeSlotEnd);
  const selected = isBackup ? State.treatData.backupTime : State.treatData.time;

  slots.forEach(slot => {
    const btn = document.createElement('button');
    btn.className = 'time-chip' + (slot === selected ? ' time-chip--selected' : '');
    btn.textContent = formatTime12h(slot);
    btn.setAttribute('role', 'listitem');
    btn.setAttribute('aria-pressed', slot === selected ? 'true' : 'false');
    btn.setAttribute('aria-label', `${formatTime12h(slot)} IST`);

    btn.addEventListener('click', () => {
      if (isBackup) {
        State.treatData.backupTime = slot;
      } else {
        State.treatData.time = slot;
        // Show optional section once time is picked
        document.getElementById('treat-optional-wrap').removeAttribute('hidden');
      }
      renderTimeChips(containerId, isBackup);
      updateTreatSummary();
      validateTreat();
    });

    container.appendChild(btn);
  });
}

function generateTimeSlots(start, end) {
  const slots = [];
  let [h, m] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);

  while (h < eh || (h === eh && m <= em)) {
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += 30;
    if (m >= 60) { h++; m -= 60; }
  }
  return slots;
}

function formatTime12h(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function formatDateLong(dateStr) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function updateTreatSummary() {
  const { treat, date, time } = State.treatData;
  const wrap = document.getElementById('treat-summary-wrap');

  if (!treat && !date && !time) {
    wrap.setAttribute('hidden', '');
    return;
  }

  wrap.removeAttribute('hidden');
  const parts = [];
  if (treat) parts.push(treat.emoji + ' ' + treat.label);
  if (date) {
    const [y, mo, d] = date.split('-').map(Number);
    const dayLabel = new Date(y, mo - 1, d).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'long',
    });
    parts.push('on ' + dayLabel);
  }
  if (time) parts.push('at ' + formatTime12h(time));

  document.getElementById('treat-summary-text').textContent = parts.join(' ') + '.';
}

function validateTreat() {
  const { treat, date, time } = State.treatData;
  document.getElementById('treat-submit-btn').disabled = !(treat && date && time);
}

// ── Treat submission ──────────────────────────────────────────────────────────
async function submitTreat(isUpdate) {
  if (State.treatSentCount >= 5) {
    showTreatError('You\'ve reached the maximum number of submissions. Use WhatsApp to send your pick.');
    return;
  }

  const { treat, date, time, backupDate, backupTime, place, note } = State.treatData;
  if (!treat || !date || !time) return;

  const dateLabel   = formatDateLong(date);
  const timeLabel   = formatTime12h(time);
  const sentAt      = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const gcalLink    = generateGCalLink(treat, date, time);

  let backupStr = '';
  if (backupDate && backupTime) {
    const [by, bmo, bd] = backupDate.split('-').map(Number);
    const bLabel = new Date(by, bmo - 1, bd).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    backupStr = `${bLabel} at ${formatTime12h(backupTime)}`;
  }

  const subject = (isUpdate ? 'UPDATED: ' : '') + `🍰 Mithila picked her treat: ${dateLabel}, ${timeLabel}`;

  const payload = {
    _subject: subject,
    treat: `${treat.emoji} ${treat.label}`,
    date: dateLabel,
    time: `${timeLabel} IST`,
    backup_option: backupStr || 'Not specified',
    place_in_mind: place || 'Not specified',
    her_note: note || 'None',
    sent_at: sentAt,
    add_to_calendar_link: gcalLink,
  };

  // Never lose her choice: keep in memory and in localStorage
  store.set('saved_treat_choice', JSON.stringify(State.treatData));

  const btn = document.getElementById('treat-submit-btn');
  btn.disabled = true;
  btn.textContent = 'Sending…';

  let ok = false;
  if (IS_TEST) {
    console.log('[Test mode] Treat payload (not sent):', payload);
    await new Promise(r => setTimeout(r, 600)); // simulate smooth UI feedback
    ok = true;
  } else {
    ok = await postFormspree(CONFIG.formspreetreatEndpoint, payload);
    if (!ok) {
      // Retry once
      await new Promise(r => setTimeout(r, 1200));
      ok = await postFormspree(CONFIG.formspreetreatEndpoint, payload);
    }
  }

  if (ok) {
    State.treatSentCount++;
    State.treatIsUpdate = true;
    store.set('treat_count', String(State.treatSentCount));
    showTreatSuccess(treat, date, time, gcalLink);
  } else {
    btn.disabled = false;
    btn.textContent = 'Lock in my treat';
    showTreatError('Something went wrong sending the email. Try once more, or use WhatsApp below.');
  }
}

function showTreatSuccess(treat, date, time, gcalLink) {
  // Confetti
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#FF6B8B', '#FFB3C6', '#FA5277', '#FFD166', '#FFFFFF', '#FFE5EC'],
    });
  }

  // Heading
  const [y, mo, d] = date.split('-').map(Number);
  const dayLabel = new Date(y, mo - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  document.getElementById('treat-success-heading').textContent =
    `${treat.emoji} ${treat.label} it is.`;
  document.getElementById('treat-success-detail').textContent =
    `${dayLabel} at ${formatTime12h(time)} IST. I'll be there. 🎉`;

  // Google Calendar link
  document.getElementById('gcal-link').href = gcalLink;

  // Show success panel
  document.getElementById('treat-success').removeAttribute('hidden');

  // Vibrate
  try { navigator.vibrate([50, 30, 50, 30, 100]); } catch (_) {}
}

function showTreatError(msg) {
  const errorEl  = document.getElementById('treat-error');
  const errorTxt = document.getElementById('treat-error-text');
  const waLink   = document.getElementById('whatsapp-fallback');

  errorTxt.textContent = msg;
  errorEl.removeAttribute('hidden');

  if (CONFIG.whatsappNumber) {
    const { treat, date, time } = State.treatData;
    const summary = [
      treat ? `${treat.emoji} ${treat.label}` : '',
      date  ? `on ${formatDateLong(date)}` : '',
      time  ? `at ${formatTime12h(time)} IST` : '',
    ].filter(Boolean).join(' ');

    const text = encodeURIComponent(`Hey Pranay! Here's my birthday treat pick: ${summary}`);
    waLink.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${text}`;
    waLink.removeAttribute('hidden');
  }
}

// ── Calendar / ICS / GCal helpers ────────────────────────────────────────────
function generateGCalLink(treat, date, time) {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, m]     = time.split(':').map(Number);

  const pad = n => String(n).padStart(2, '0');

  const startStr = `${y}${pad(mo)}${pad(d)}T${pad(h)}${pad(m)}00`;

  // End: 90 minutes later
  const startMs = new Date(y, mo - 1, d, h, m).getTime();
  const endMs   = startMs + 90 * 60 * 1000;
  const endDate = new Date(endMs);
  const endStr  = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;

  const params = new URLSearchParams({
    action:  'TEMPLATE',
    text:    `Birthday treat with ${CONFIG.senderName}`,
    dates:   `${startStr}/${endStr}`,
    details: `${treat.emoji} ${treat.label} — booked on the birthday site. 🎉`,
    ctz:     'Asia/Kolkata',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadICS() {
  const { treat, date, time } = State.treatData;
  if (!treat || !date || !time) return;

  const [y, mo, d] = date.split('-').map(Number);
  const [h, m]     = time.split(':').map(Number);
  const pad = n => String(n).padStart(2, '0');

  const startMs = new Date(y, mo - 1, d, h, m).getTime();
  const endMs   = startMs + 90 * 60 * 1000;
  const endDate = new Date(endMs);

  const dtStart = `${y}${pad(mo)}${pad(d)}T${pad(h)}${pad(m)}00`;
  const dtEnd   = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mithila Birthday//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `DTSTART;TZID=Asia/Kolkata:${dtStart}`,
    `DTEND;TZID=Asia/Kolkata:${dtEnd}`,
    `SUMMARY:Birthday treat with ${CONFIG.senderName}`,
    `DESCRIPTION:${treat.emoji} ${treat.label}`,
    `UID:mithila-bday-treat-${Date.now()}@birthday`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'birthday-treat.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════════════════════════════════════
// MUSIC
// ══════════════════════════════════════════════════════════════════════════════
function setupMusic() {
  if (!CONFIG.music) return;

  if (CONFIG.music.includes('youtu.be') || CONFIG.music.includes('youtube.com')) {
    // Extract YouTube video ID
    const match = CONFIG.music.match(/(?:youtu\.be\/|[?&]v=)([A-Za-z0-9_-]{11})/);
    if (!match) return;
    const videoId = match[1];

    // Load YouTube Iframe API
    window.onYouTubeIframeAPIReady = function() {
      State.ytPlayer = new YT.Player('yt-player-div', {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          loop: 1,
          playlist: videoId,
          origin: location.origin,
          rel: 0,
        },
        events: {
          onReady() {
            if (State.musicPending) {
              State.ytPlayer.playVideo();
              State.musicPending = false;
              State.musicStarted = true;
            }
          },
        },
      });
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);

  } else {
    // Local file
    State.audioEl = new Audio(CONFIG.music);
    State.audioEl.loop = true;
    State.audioEl.volume = 0.6;
  }
}

function startMusic() {
  if (State.musicStarted) return;
  if (!CONFIG.music) return;

  if (State.ytPlayer) {
    try {
      State.ytPlayer.playVideo();
      State.musicStarted = true;
    } catch (_) {}
  } else if (State.audioEl) {
    State.audioEl.play().then(() => {
      State.musicStarted = true;
    }).catch(() => {});
  } else {
    // Player not ready yet — set pending flag
    State.musicPending = true;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// AMBIENT: CUTE BOKEH & SPARKLES
// ══════════════════════════════════════════════════════════════════════════════
function createBokeh() {
  const layer = document.getElementById('bokeh-layer');
  layer.innerHTML = '';
  const count = 22;
  const colors = ['#FFCCD5', '#FFB3C6', '#FFE5EC', '#FF85A1', '#FFE380'];

  for (let i = 0; i < count; i++) {
    const dot = document.createElement('div');
    dot.className = 'bokeh-dot';

    const size = 25 + Math.random() * 65;
    const x    = Math.random() * 100;
    const y    = Math.random() * 100;
    const dur  = 3.5 + Math.random() * 4;
    const del  = Math.random() * 5;
    const peak = 0.2 + Math.random() * 0.3;
    const color = colors[Math.floor(Math.random() * colors.length)];

    dot.style.cssText = `
      width:${size}px;height:${size}px;
      left:${x}%;top:${y}%;
      background:radial-gradient(circle,${color}99 0%,transparent 70%);
      filter:blur(${size * 0.32}px);
      --dur:${dur}s;--delay:${del}s;--peak:${peak};
    `;

    layer.appendChild(dot);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// AMBIENT: SAKURA PETALS
// ══════════════════════════════════════════════════════════════════════════════
function createPetals() {
  const layer = document.getElementById('petals-layer');
  layer.innerHTML = '';
  const count = 12;

  for (let i = 0; i < count; i++) {
    const petal = document.createElement('div');
    petal.className = 'petal';

    const x     = Math.random() * 100;
    const dur   = 9 + Math.random() * 7;
    const del   = Math.random() * 10;
    const rot   = Math.random() * 360;
    const drift = (Math.random() - 0.5) * 60;
    const size  = 9 + Math.random() * 6;

    petal.style.cssText = `
      left:${x}%;
      width:${size}px;height:${size * 1.6}px;
      --dur:${dur}s;--delay:-${del}s;
      --rot:${rot}deg;--drift:${drift}px;
    `;

    layer.appendChild(petal);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// AMBIENT: FLOATING BIRTHDAY SPARKLES & STARS
// ══════════════════════════════════════════════════════════════════════════════
function createSparkles() {
  const layer = document.getElementById('sparkles-layer');
  if (!layer) return;
  layer.innerHTML = '';
  const symbols = ['✦', '✧', '⋆', '✨', '🌸', '💖', '★'];
  const count = 18;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'sparkle-particle';
    el.textContent = symbols[i % symbols.length];

    const left = Math.random() * 96 + 2;
    const sz = 12 + Math.random() * 12;
    const dur = 7 + Math.random() * 7;
    const delay = -(Math.random() * 10);
    const op = 0.45 + Math.random() * 0.45;

    el.style.left = `${left}%`;
    el.style.setProperty('--sz', `${sz}px`);
    el.style.setProperty('--dur', `${dur}s`);
    el.style.setProperty('--delay', `${delay}s`);
    el.style.setProperty('--op', op);

    layer.appendChild(el);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// INTERACTIVE: TAP SPARKLES BURST
// ══════════════════════════════════════════════════════════════════════════════
function initTapSparkles() {
  const icons = ['✨', '🌸', '✦', '💖', '⭐', '💫'];

  function spawnSparklesAt(x, y) {
    const num = 5;
    for (let i = 0; i < num; i++) {
      const spark = document.createElement('span');
      spark.className = 'tap-sparkle';
      spark.textContent = icons[Math.floor(Math.random() * icons.length)];
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;

      const angle = (Math.PI * 2 * i) / num + (Math.random() - 0.5) * 0.5;
      const dist = 32 + Math.random() * 32;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      const rot = Math.floor((Math.random() - 0.5) * 180);

      spark.style.setProperty('--tx', `${tx}px`);
      spark.style.setProperty('--ty', `${ty}px`);
      spark.style.setProperty('--rot', `${rot}deg`);

      document.body.appendChild(spark);
      setTimeout(() => spark.remove(), 700);
    }
  }

  window.addEventListener('pointerdown', e => {
    if (e.clientX !== undefined && e.clientY !== undefined) {
      spawnSparklesAt(e.clientX, e.clientY);
    }
  }, { passive: true });
}

// ══════════════════════════════════════════════════════════════════════════════
// FORMSPREE HELPER
// ══════════════════════════════════════════════════════════════════════════════
async function postFormspree(endpoint, data) {
  if (!endpoint || endpoint.includes('EDIT_ME')) return false; // not configured yet
  try {
    const res = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body:    JSON.stringify(data),
    });
    return res.ok;
  } catch (_) {
    return false;
  }
}
