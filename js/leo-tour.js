/**
 * ADHD Budget Planner (Edition 3) - Leo's Step-by-Step Tour System
 * Serene hand-holding: DOM spotlights, typing simulation, and safe demo mode.
 */
(function (global) {
  'use strict';

  const Leo = {};
  let currentStepIndex = 0;
  let isTourActive = false;
  let currentTargetEl = null;

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  function highlightTarget(target, badgeText = '🧑‍💼 Leo says: Tap here') {
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
    });
    const b = document.getElementById('leo-target-badge');
    if (b) b.remove();
  }

  const TOUR_STEPS = [
    {
      title: 'Welcome to Financial Serenity 🌿',
      body: 'Hello, I’m Leo! You don’t need to force your brain to enjoy spreadsheets. ADHD Budget Planner keeps your finances peaceful by distilling everything down to <strong>one daily dial</strong>.',
      target: null,
      badge: '',
      actionText: 'Begin Tour ➔',
      action: async (controller) => {
        controller.next();
      }
    },
    {
      title: 'Your Daily Allowance Dial',
      body: 'Look at the central dial. This is your safe allowance for today. Your upcoming rent, utilities, and debt commitments are already guarded behind the scenes.',
      target: '.radial-hero-card',
      badge: '✨ The Safe Dial',
      actionText: 'Next: Quick Spends ➔',
      action: async (controller) => {
        controller.next();
      }
    },
    {
      title: 'Vertical Quick Spends',
      body: 'Routine daily spending doesn’t need tedious category selection. Tap Morning Fuel, Online Essentials, or Groceries with a single tap. Let’s do a demo tap on <strong>Morning Fuel</strong>!',
      target: '.zen-quick-spends',
      badge: '☕ Tap to Log',
      actionText: 'Demo Tap $6.00 ☕',
      action: async (controller) => {
        const btn = document.querySelector('.zen-chip-btn');
        if (btn) btn.click();
        await wait(300);
        controller.next();
      }
    },
    {
      title: 'Living Costs (Fixed Bills)',
      body: 'Tap <strong>Living Costs</strong>. This is where your shelter, heat, and phone commitments stay protected. When you get paid, money is automatically reserved for them first.',
      target: '.zen-tab[data-nav="living"]',
      badge: '📅 View Living Costs',
      actionText: 'Check Living Costs ➔',
      action: async (controller) => {
        const tab = document.querySelector('.zen-tab[data-nav="living"]');
        if (tab) tab.click();
        await wait(300);
        controller.next();
      }
    },
    {
      title: 'Cooldown Hold (48h Vault)',
      body: 'Suddenly tempted by an online shopping impulse? Park it in <strong>Cooldown Hold</strong>. In 48 hours, the dopamine wave passes and 82% of impulses fade on their own!',
      target: '.zen-tab[data-nav="cooldown"]',
      badge: '⏳ View Cooldown Hold',
      actionText: 'Check Cooldown Hold ➔',
      action: async (controller) => {
        const tab = document.querySelector('.zen-tab[data-nav="cooldown"]');
        if (tab) tab.click();
        await wait(300);
        controller.next();
      }
    },
    {
      title: 'Fog Mode (Emergency Screen)',
      body: 'Having a high-fog, burnout, or migraine day? Tap <strong>Fog Mode</strong> in the top bar. All complexity vanishes, showing only your safe spending number.',
      target: '#btn-zombie-trigger',
      badge: '🌫️ Low Bandwidth Mode',
      actionText: 'Finish Tour 🎉',
      action: async (controller) => {
        const tab = document.querySelector('.zen-tab[data-nav="allowance"]');
        if (tab) tab.click();
        controller.finish();
      }
    }
  ];

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
          <span class="leo-avatar">🧑‍💼</span>
          <span class="leo-name">Leo’s Step-by-Step Tour</span>
        </div>
        <span class="leo-step-counter">Step ${currentStepIndex + 1} of ${TOUR_STEPS.length}</span>
      </div>
      <div class="leo-guide-body">
        <strong>${step.title}</strong><br>
        ${step.body}
      </div>
      <div class="leo-guide-actions">
        <button type="button" class="leo-btn-secondary" id="btn-leo-skip">End Tour</button>
        <button type="button" class="leo-btn-primary pulse" id="btn-leo-act">${step.actionText}</button>
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
    clearHighlight();
    const card = document.getElementById('leo-guide-card');
    if (card) card.remove();
    const mask = document.getElementById('leo-tour-mask');
    if (mask) mask.classList.remove('active');
  }

  Leo.startTour = startTour;
  Leo.endTour = endTour;

  global.LeoTour = Leo;
})(typeof window !== 'undefined' ? window : this);
