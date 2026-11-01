/**
 * ADHD Budget Planner (Edition 3) - Leo's Step-by-Step Guided Tour System
 * Mindful hand-holding: step-by-step DOM spotlight, HUD banner, typing simulation,
 * and zero-blur crystal clarity.
 */
(function (global) {
  'use strict';

  const Leo = {};
  let currentStepIndex = 0;
  let isTourActive = false;
  let currentTargetEl = null;

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  function highlightTarget(target, badgeText = '🧘 Tap here') {
    clearHighlight();
    if (!target) return null;
    const el = (typeof target === 'string') ? document.querySelector(target) : target;
    if (!el) return null;

    currentTargetEl = el;
    if (typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    el.classList.add('tutorial-target-active');

    const badge = document.createElement('span');
    badge.className = 'leo-target-badge';
    badge.id = 'leo-target-badge';
    badge.innerHTML = `<span>${badgeText}</span>`;

    const isVoid = ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);
    const host = isVoid ? el.parentElement : el;
    if (host) {
      const pos = window.getComputedStyle(host).position;
      if (pos === 'static') {
        host.dataset.origPos = 'static';
        host.style.position = 'relative';
      }
      host.appendChild(badge);
    }
    return el;
  }

  function clearHighlight() {
    if (currentTargetEl) {
      currentTargetEl.classList.remove('tutorial-target-active');
      if (currentTargetEl.dataset.origPos === 'static') {
        currentTargetEl.style.position = '';
        delete currentTargetEl.dataset.origPos;
      }
      const b = document.getElementById('leo-target-badge');
      if (b) b.remove();
      currentTargetEl = null;
    }
    document.querySelectorAll('.tutorial-target-active').forEach(el => {
      el.classList.remove('tutorial-target-active');
      if (el.dataset.origPos === 'static') {
        el.style.position = '';
        delete el.dataset.origPos;
      }
    });
    const b = document.getElementById('leo-target-badge');
    if (b) b.remove();
  }

  const TOUR_STEPS = [
    {
      title: 'Greetings, I’m Leo 🌿',
      body: 'Traditional spreadsheets trigger ADHD dopamine depletion and anxiety. In our Wabi-Sabi Sanctuary, math flows peacefully behind the scenes so you only focus on <strong>one serene number</strong>.',
      target: null,
      badge: '',
      actionText: 'Begin Mindful Tour ➔',
      action: async (controller) => {
        controller.next();
      }
    },
    {
      title: 'Mindful Daily Allowance & Dial',
      body: 'Look at your center radial dial. This is your safe daily spending guide. It automatically protects upcoming rent, living costs, and debt before giving you today’s allowance.',
      target: '.radial-hero-card',
      badge: '☀️ Daily Dial',
      actionText: 'Next: Inflow Runway ➔',
      action: async (controller) => {
        controller.next();
      }
    },
    {
      title: 'Cash Inflow Stream & Runway',
      body: 'Your income runway visualizes the gentle rhythm until your next paycheck arrives. Tap <strong>Adjust Inflow</strong> anytime to update your payday date and cash reserve.',
      target: '.zen-inflow-card',
      badge: '🌊 Inflow Stream',
      actionText: 'Next: Spend Chips ➔',
      action: async (controller) => {
        controller.next();
      }
    },
    {
      title: 'Mindful 1-Tap Spend Chips',
      body: 'No tedious receipt tracking or multi-tiered category menus. Grabbing tea, a snack, or fuel? One gentle tap records it and adjusts today’s dial instantly.',
      target: '#zen-quick-spends',
      badge: '🍵 Tap to Record',
      actionText: 'Next: Living Costs ➔',
      action: async (controller) => {
        controller.next();
      }
    },
    {
      title: 'Living Commitments (Fixed Bills)',
      body: 'Switch to <strong>Living Costs</strong>. Essential obligations (rent, heat, subscriptions) are arranged chronologically. Only bills due before your next payday are held.',
      target: '.island-tab[data-nav="living"]',
      badge: '🌾 View Living Costs',
      actionText: 'Switch to Living ➔',
      action: async (controller) => {
        const tab = document.querySelector('.island-tab[data-nav="living"]');
        if (tab) tab.click();
        await wait(250);
        controller.next();
      }
    },
    {
      title: 'Cooldown Garden (48h Desire Pause)',
      body: 'Sudden urge to buy something online? Plant it in the <strong>Cooldown Garden</strong>. In 48 hours, the dopamine wave fades and 82% of impulses vanish peacefully!',
      target: '.island-tab[data-nav="cooldown"]',
      badge: '⏳ Cooldown Garden',
      actionText: 'Switch to Cooldown ➔',
      action: async (controller) => {
        const tab = document.querySelector('.island-tab[data-nav="cooldown"]');
        if (tab) tab.click();
        await wait(250);
        controller.next();
      }
    },
    {
      title: 'Fog Mode (Low Sensory Sanctuary)',
      body: 'Having an executive overload or migraine day? Tap <strong>Fog Mode</strong> in the top bar. All visual clutter melts away, showing only your safe spending number.',
      target: '#btn-fog-trigger',
      badge: '🌫️ Sensory Calm',
      actionText: 'Next: Tab Guides ➔',
      action: async (controller) => {
        const tab = document.querySelector('.island-tab[data-nav="allowance"]');
        if (tab) tab.click();
        await wait(250);
        controller.next();
      }
    },
    {
      title: 'Instant Tab & Feature Guides ❓',
      body: 'Notice the serene <strong>?</strong> badges on every screen and tab. Tap any <strong>?</strong> anytime to open a mindful guide explaining concepts and ADHD wisdom!',
      target: '.zen-help-badge',
      badge: '❓ Tap for Tab Info',
      actionText: 'Complete Walkthrough 🧘',
      action: async (controller) => {
        controller.finish();
      }
    }
  ];

  function updateHudBar() {
    let hud = document.getElementById('tutorial-hud-bar');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'tutorial-hud-bar';
      hud.className = 'tutorial-hud-bar';
      document.body.appendChild(hud);
    }
    hud.innerHTML = `
      <div class="tutorial-hud-title">
        <span>🧘</span>
        <span>Leo Mindful Guide</span>
        <span class="tutorial-hud-step-pill">Step ${currentStepIndex + 1} of ${TOUR_STEPS.length}</span>
      </div>
      <button type="button" class="tutorial-hud-exit" id="btn-hud-exit">Exit Tour ✕</button>
    `;
    const exitBtn = document.getElementById('btn-hud-exit');
    if (exitBtn) {
      exitBtn.onclick = () => endTour();
    }
  }

  function showTourCard(step, controller) {
    let card = document.getElementById('leo-guide-card');
    if (!card) {
      card = document.createElement('div');
      card.id = 'leo-guide-card';
      card.className = 'leo-guide-card';
      document.body.appendChild(card);
    }

    card.innerHTML = `
      <div class="leo-guide-header">
        <div class="leo-guide-identity">
          <span class="leo-avatar">🧘</span>
          <span class="leo-name">Leo’s Mindful Tour</span>
        </div>
        <span class="leo-step-counter">Step ${currentStepIndex + 1} / ${TOUR_STEPS.length}</span>
      </div>
      <div class="leo-guide-body">
        <strong>${step.title}</strong><br>
        ${step.body}
      </div>
      <div class="leo-guide-actions">
        <button type="button" class="leo-btn-secondary" id="btn-leo-skip">Exit Tour</button>
        <button type="button" class="leo-btn-primary" id="btn-leo-act">${step.actionText}</button>
      </div>
    `;

    document.getElementById('btn-leo-skip').onclick = () => controller.finish();
    document.getElementById('btn-leo-act').onclick = () => step.action(controller);
  }

  function renderStep() {
    if (currentStepIndex >= TOUR_STEPS.length) {
      endTour();
      return;
    }
    const step = TOUR_STEPS[currentStepIndex];
    updateHudBar();

    if (step.target) {
      highlightTarget(step.target, step.badge);
    } else {
      clearHighlight();
    }

    const controller = {
      next: () => {
        currentStepIndex++;
        renderStep();
      },
      finish: () => {
        endTour();
      }
    };

    showTourCard(step, controller);
  }

  function startTour() {
    if (isTourActive) return;
    isTourActive = true;
    currentStepIndex = 0;
    document.body.classList.add('tutorial-active');

    let mask = document.getElementById('leo-tour-mask');
    if (!mask) {
      mask = document.createElement('div');
      mask.id = 'leo-tour-mask';
      mask.className = 'tutorial-mask-overlay';
      document.body.appendChild(mask);
    }
    mask.classList.add('active');

    renderStep();
  }

  function endTour() {
    isTourActive = false;
    document.body.classList.remove('tutorial-active');
    clearHighlight();

    const hud = document.getElementById('tutorial-hud-bar');
    if (hud) hud.remove();

    const card = document.getElementById('leo-guide-card');
    if (card) card.remove();

    const mask = document.getElementById('leo-tour-mask');
    if (mask) mask.classList.remove('active');

    try {
      localStorage.setItem('adhd_leo_tour_v2_done', 'true');
    } catch (e) {}

    // Return to allowance screen smoothly
    const allowTab = document.querySelector('.island-tab[data-nav="allowance"]');
    if (allowTab) allowTab.click();
  }

  Leo.startTour = startTour;
  Leo.endTour = endTour;

  global.LeoTour = Leo;
})(typeof window !== 'undefined' ? window : this);
