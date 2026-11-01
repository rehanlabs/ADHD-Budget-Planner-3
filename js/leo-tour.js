/**
 * ADHD Budget Planner (Edition 3) - Leo's Step-by-Step Guided Tour System
 * Strict capture-phase UX guardrails (blocks non-tour clicks & nudges user),
 * interactive modal hand-holding, auto-typing simulation, and safe state snapshot.
 */
(function (global) {
  'use strict';

  const Leo = {};
  let currentStepIndex = 0;
  let isTourActive = false;
  let currentTargetEl = null;
  let currentStepActionHandler = null;
  let isActionRunning = false;
  let userStateSnapshot = null;

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // ========================================================
  // 1. SPOTLIGHT, TYPING SIMULATION & MODAL BANNER HELPERS
  // ========================================================
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

    if (badgeText) {
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

  async function typeIntoField(inputEl, text, speed = 22) {
    if (!inputEl) return;
    inputEl.focus();
    inputEl.value = '';
    inputEl.classList.add('typing-active');
    const str = String(text);
    for (let i = 0; i < str.length; i++) {
      inputEl.value += str[i];
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      await wait(speed);
    }
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    await wait(120);
    inputEl.classList.remove('typing-active');
  }

  function closeAllModalsAndOverlays() {
    document.querySelectorAll('.zen-modal-overlay').forEach(m => {
      m.classList.remove('open');
    });
    const drawer = document.getElementById('sanctuary-drawer-sheet');
    if (drawer) drawer.classList.remove('active');
    const fog = document.getElementById('fog-mode-overlay');
    if (fog) fog.classList.remove('active');
    removeModalBanner();
  }

  function removeModalBanner() {
    const banner = document.getElementById('leo-modal-banner');
    if (banner) banner.remove();
    const card = document.getElementById('leo-guide-card');
    if (card) card.style.display = '';
  }

  function showModalBanner(modalSelector, opts) {
    const modal = document.querySelector(modalSelector);
    if (!modal) return;
    const box = modal.querySelector('.zen-modal-box') || modal;

    // Hide bottom card while inside modal so mobile portrait viewports are 100% clear
    const card = document.getElementById('leo-guide-card');
    if (card) card.style.display = 'none';

    let banner = document.getElementById('leo-modal-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'leo-modal-banner';
      banner.className = 'leo-modal-banner';
      box.prepend(banner);
    }

    currentStepActionHandler = opts.actionHandler || null;

    banner.innerHTML = `
      <div class="leo-guide-header" style="padding-bottom:6px;">
        <div class="leo-guide-identity">
          <span class="leo-avatar">🧘</span>
          <span class="leo-name">Leo’s Mindful Setup</span>
        </div>
        <span class="leo-step-counter">Step ${currentStepIndex + 1} / ${TOUR_STEPS.length}</span>
      </div>
      <div class="leo-guide-body" id="leo-modal-msg">${opts.message}</div>
      <div style="display:flex;justify-content:flex-end;margin-top:4px;">
        <button type="button" class="leo-btn-primary pulse" id="btn-leo-modal-act">${opts.actionText}</button>
      </div>
    `;

    const btn = document.getElementById('btn-leo-modal-act');
    if (btn) {
      btn.onclick = () => triggerCurrentStepAction();
    }
  }

  async function triggerCurrentStepAction() {
    if (isActionRunning || typeof currentStepActionHandler !== 'function') return;
    isActionRunning = true;
    const fn = currentStepActionHandler;
    try {
      await fn();
    } finally {
      isActionRunning = false;
    }
  }

  // ========================================================
  // 2. STRICT CAPTURE-PHASE UX GUARDRAILS (LOCK NON-TOUR UI)
  // ========================================================
  function handleTourClickGuard(e) {
    if (!isTourActive) return;
    if (!e.isTrusted) return; // Always allow programmatic clicks from tour scripts

    const isGuideCard = e.target.closest('#leo-guide-card');
    const isModalBanner = e.target.closest('#leo-modal-banner');
    const isHudBar = e.target.closest('#tutorial-hud-bar');

    if (isGuideCard || isModalBanner || isHudBar) {
      return; // Allowed tour controls
    }

    const isTarget = currentTargetEl && (currentTargetEl === e.target || currentTargetEl.contains(e.target));
    if (isTarget && typeof currentStepActionHandler === 'function') {
      // User tapped the highlighted target directly! Run the controlled step action cleanly.
      e.preventDefault();
      e.stopPropagation();
      triggerCurrentStepAction();
      return;
    }

    // Block all other clicks across the app (tabs, buttons, inputs, backdrops, ? badges)
    e.preventDefault();
    e.stopPropagation();
    triggerEncouragementNudge();
  }

  function handleTourKeyGuard(e) {
    if (!isTourActive || !e.isTrusted) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      triggerEncouragementNudge();
    }
  }

  function triggerEncouragementNudge() {
    const banner = document.getElementById('leo-modal-banner');
    const card = document.getElementById('leo-guide-card');
    const activeContainer = banner || (card && card.style.display !== 'none' ? card : null);
    if (!activeContainer) return;

    activeContainer.classList.remove('nudge');
    void activeContainer.offsetWidth; // Reflow
    activeContainer.classList.add('nudge');

    let toast = activeContainer.querySelector('.leo-nudge-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'leo-nudge-toast';
      toast.textContent = "🔒 Tour Lock Active: Tap Leo's highlighted step (or Exit Tour at top) to continue!";
      const bodyEl = activeContainer.querySelector('.leo-guide-body');
      if (bodyEl && bodyEl.parentNode) {
        bodyEl.parentNode.insertBefore(toast, bodyEl.nextSibling);
      } else {
        activeContainer.appendChild(toast);
      }
      setTimeout(() => {
        if (toast && toast.parentNode) toast.remove();
      }, 3000);
    }

    const primaryBtn = activeContainer.querySelector('.leo-btn-primary');
    if (primaryBtn) primaryBtn.classList.add('pulse');
  }

  // ========================================================
  // 3. INTERACTIVE HAND-HOLDING TOUR STEPS
  // ========================================================
  const TOUR_STEPS = [
    // STEP 1: Inflow & Payday Runway Setup
    {
      title: 'Step 1: Configure Your Inflow 🌱',
      init: async () => {
        closeAllModalsAndOverlays();
        if (window.setZenScreen) window.setZenScreen('allowance');
        await wait(100);

        highlightTarget('#btn-configure-zen-inflow', '👉 1. Tap Configure Inflow');

        showTourCard({
          title: 'Greetings, I’m Leo! Let’s Anchor Your Inflow 🌿',
          body: 'Spreadsheets overwhelm ADHD minds. In our Wabi-Sabi Sanctuary, we start with your <strong>Next Payday & Checking Cash</strong>.<br><br>👉 Tap <strong>Configure Inflow</strong> (or the button below) to open the scheduler:',
          actionText: '👉 Open Inflow Scheduler 🌱',
          actionHandler: async () => {
            const btn = document.getElementById('btn-configure-zen-inflow');
            if (btn) btn.click();
            await wait(220);

            // Sub-step 1B: Inside Inflow Modal
            highlightTarget('#input-zen-inflow-amount', '👉 Paycheck ($)');
            showModalBanner('#modal-set-zen-payday', {
              message: '<strong>Inside Sanctuary Inflow:</strong> Watch me enter a <strong>$2,500.00</strong> bi-weekly paycheck and <strong>$1,700.00</strong> checking reserve:',
              actionText: '✨ Auto-Fill Inflow & Reserve',
              actionHandler: async () => {
                const amtInput = document.getElementById('input-zen-inflow-amount');
                const chkInput = document.getElementById('input-zen-inflow-checking');
                const cycSelect = document.getElementById('select-zen-inflow-cycle');
                if (amtInput) await typeIntoField(amtInput, '2500.00', 20);
                if (cycSelect) {
                  cycSelect.value = 'biweekly';
                  cycSelect.dispatchEvent(new Event('change', { bubbles: true }));
                }
                highlightTarget('#input-zen-inflow-checking', '👉 Checking ($)');
                if (chkInput) await typeIntoField(chkInput, '1700.00', 20);

                const saveBtn = document.querySelector('#form-set-zen-inflow button[type="submit"]');
                highlightTarget(saveBtn, '👉 Tap Save');

                showModalBanner('#modal-set-zen-payday', {
                  message: 'Your inflow stream is ready! Tap <strong>Save Sanctuary Inflow 🌿</strong> to calculate your daily allowance dial:',
                  actionText: '🌿 Save Sanctuary Inflow',
                  actionHandler: async () => {
                    const form = document.getElementById('form-set-zen-inflow');
                    if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    removeModalBanner();
                    clearHighlight();
                    await wait(250);
                    nextStep();
                  }
                });
              }
            });
          }
        });
      }
    },

    // STEP 2: Mindful Daily Allowance & Sunburst Dial
    {
      title: 'Step 2: Your Daily Allowance Dial ☀️',
      init: async () => {
        closeAllModalsAndOverlays();
        if (window.setZenScreen) window.setZenScreen('allowance');
        await wait(100);

        highlightTarget('.radial-hero-card', '☀️ Your Serene Number');
        const dialText = (document.getElementById('dial-hero-amount') || {}).textContent || '$70.00';

        showTourCard({
          title: 'Your Mindful Allowance Dial ☀️',
          body: `Look at your sunburst dial: <strong>${dialText} Safe to Spend Today</strong>.<br>` +
                `We automatically reserve upcoming living costs from your checking cash and pace the rest gently across your runway days—so your shelter is always safe!`,
          actionText: 'Next: Test Mindful Spend Chip ➔',
          actionHandler: async () => {
            nextStep();
          }
        });
      }
    },

    // STEP 3: 1-Tap Mindful Spend Chip
    {
      title: 'Step 3: 1-Tap Spend Chips 🍵',
      init: async () => {
        closeAllModalsAndOverlays();
        if (window.setZenScreen) window.setZenScreen('allowance');
        await wait(100);

        const firstChip = document.querySelector('#zen-quick-spends .zen-chip-btn') || document.querySelector('#zen-quick-spends');
        highlightTarget(firstChip, '🍵 Tap to Log Spend');

        showTourCard({
          title: '1-Tap Mindful Spend Chips 🍵',
          body: 'No tedious receipt logging! Grabbing tea or a quick bite? Tap the highlighted <strong>mindful spend chip</strong> (or the button below) and watch your sunburst dial recalibrate live:',
          actionText: '🍵 Log 1-Tap Mindful Spend',
          actionHandler: async () => {
            const chip = document.querySelector('#zen-quick-spends .zen-chip-btn');
            if (chip) chip.click();
            await wait(220);

            highlightTarget('#dial-hero-amount', '✨ Recalibrated!');
            const updatedDial = (document.getElementById('dial-hero-amount') || {}).textContent || '';

            showTourCard({
              title: 'Effortless Recalibration! 🌱',
              body: `Notice how your Safe to Spend dial peacefully updated to <strong>${updatedDial}</strong> in a single tap. Now let’s see where living costs are protected!`,
              actionText: 'Next: Living Commitments ➔',
              actionHandler: async () => {
                nextStep();
              }
            });
          }
        });
      }
    },

    // STEP 4: Living Commitments (Tab Switch + Interactive Modal)
    {
      title: 'Step 4: Living Commitments 🌾',
      init: async () => {
        closeAllModalsAndOverlays();
        if (window.setZenScreen) window.setZenScreen('allowance');
        await wait(100);

        const livTab = document.querySelector('.island-tab[data-nav="living"]');
        highlightTarget(livTab, '👉 1. Tap Living Tab');

        showTourCard({
          title: 'Protecting Shelter & Living Costs 🌾',
          body: 'Fixed commitments (rent, heat, Wi-Fi) live in <strong>🌾 Living</strong> on the floating island dock. Tap the highlighted <strong>Living</strong> tab:',
          actionText: '👉 Open Living Costs Tab 🌾',
          actionHandler: async () => {
            if (window.setZenScreen) window.setZenScreen('living');
            await wait(200);

            highlightTarget('#btn-add-living-open', '👉 2. Tap + Add Cost');
            showTourCard({
              title: 'Reserve a Living Commitment 🛡️',
              body: 'Every living cost due before your next inflow is automatically held back from your daily allowance. Tap <strong>+ Add Cost</strong> to test adding one:',
              actionText: '👉 Open + Add Cost',
              actionHandler: async () => {
                const addBtn = document.getElementById('btn-add-living-open');
                if (addBtn) addBtn.click();
                await wait(200);

                highlightTarget('#living-name-field', '👉 Cost Name');
                showModalBanner('#modal-add-living', {
                  message: 'Watch me enter <strong>Sanctuary Fiber Internet ($60.00)</strong> due in 5 days:',
                  actionText: '✨ Auto-Fill Living Cost',
                  actionHandler: async () => {
                    const nameIn = document.getElementById('living-name-field');
                    const amtIn = document.getElementById('living-amt-field');
                    const dateIn = document.getElementById('living-date-field');
                    if (nameIn) await typeIntoField(nameIn, 'Sanctuary Fiber Internet', 18);
                    highlightTarget('#living-amt-field', '👉 Amount ($)');
                    if (amtIn) await typeIntoField(amtIn, '60.00', 20);
                    if (dateIn) {
                      const d = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
                      dateIn.value = d;
                      dateIn.dispatchEvent(new Event('change', { bubbles: true }));
                    }

                    const saveBtn = document.querySelector('#form-add-living button[type="submit"]');
                    highlightTarget(saveBtn, '👉 Tap Add');

                    showModalBanner('#modal-add-living', {
                      message: 'Now tap <strong>Add Living Cost 🌿</strong> to protect this commitment from your daily spending pool:',
                      actionText: '🌿 Save Living Cost Now',
                      actionHandler: async () => {
                        const form = document.getElementById('form-add-living');
                        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                        removeModalBanner();
                        clearHighlight();
                        await wait(250);
                        nextStep();
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    },

    // STEP 5: Cooldown Garden (48h Impulse Vault)
    {
      title: 'Step 5: 48h Cooldown Garden ⏳',
      init: async () => {
        closeAllModalsAndOverlays();
        const coolTab = document.querySelector('.island-tab[data-nav="cooldown"]');
        highlightTarget(coolTab, '👉 Tap Cooldown Tab');

        showTourCard({
          title: '48-Hour Cooldown Garden ⏳',
          body: 'Sudden urge to impulse-shop online? Tap the highlighted <strong>⏳ Cooldown</strong> tab on the floating island dock:',
          actionText: '👉 Open Cooldown Garden ⏳',
          actionHandler: async () => {
            if (window.setZenScreen) window.setZenScreen('cooldown');
            await wait(200);

            highlightTarget('#btn-add-cooldown-open', '⏳ Hold Urge 48h');
            showTourCard({
              title: 'Let Dopamine Waves Pass Peacefully 🎋',
              body: 'When you plant a shopping urge here for 48 hours, the dopamine spike settles—and <strong>82% of ADHD impulse urges fade away naturally</strong>!',
              actionText: 'Next: Fog Mode & Mindful Guides ➔',
              actionHandler: async () => {
                nextStep();
              }
            });
          }
        });
      }
    },

    // STEP 6: Fog Mode & Contextual ? Help Badges
    {
      title: 'Step 6: Fog Mode & ? Guides 🌫️',
      init: async () => {
        closeAllModalsAndOverlays();
        if (window.setZenScreen) window.setZenScreen('allowance');
        await wait(150);

        highlightTarget('#btn-fog-trigger', '🌫️ Try Fog Mode');

        showTourCard({
          title: 'Low-Sensory Fog Mode 🌫️',
          body: 'Having an executive overload or sensory fatigue day? Tap <strong>🌫️ Fog Mode</strong> in the header to melt away all visual clutter:',
          actionText: '🌫️ Turn Fog Mode ON',
          actionHandler: async () => {
            const fogBtn = document.getElementById('btn-fog-trigger');
            if (fogBtn) fogBtn.click();
            await wait(220);

            highlightTarget('#btn-fog-close', '🌿 Exit Fog Mode');
            showTourCard({
              title: 'Pure Cognitive Sanctuary 🌙',
              body: 'Everything disappears except your single safe spending answer. Now tap <strong>Exit Fog Mode 🌿</strong> to return:',
              actionText: '🌿 Turn Fog Mode OFF',
              actionHandler: async () => {
                const exitBtn = document.getElementById('btn-fog-close');
                if (exitBtn) exitBtn.click();
                await wait(200);

                const helpBadge = document.querySelector('.zen-help-badge');
                highlightTarget(helpBadge, '❓ Tap Any ? Anytime');

                showTourCard({
                  title: 'Your Sanctuary Awaits! 🧘',
                  body: 'Notice the warm <strong>?</strong> badges on every screen and tab—tap any <strong>?</strong> anytime for a 4-tier mindful guide.<br><br>Tap Finish below to return to your personal sanctuary!',
                  actionText: 'Complete Walkthrough 🧘',
                  actionHandler: async () => {
                    endTour();
                  }
                });
              }
            });
          }
        });
      }
    }
  ];

  // ========================================================
  // 4. HUD & GUIDE CARD RENDERING
  // ========================================================
  function updateHudBar() {
    let hud = document.getElementById('tutorial-hud-bar');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'tutorial-hud-bar';
      hud.className = 'tutorial-hud-bar';
      document.body.prepend(hud);
    }
    hud.innerHTML = `
      <div class="tutorial-hud-title">
        <span>🧘</span>
        <span>Leo’s Mindful Tour</span>
        <span class="tutorial-hud-step-pill">Step ${currentStepIndex + 1} of ${TOUR_STEPS.length}</span>
        <span class="tutorial-hud-sub">(Personal sanctuary safely paused)</span>
      </div>
      <button type="button" class="tutorial-hud-exit" id="btn-hud-exit">Exit Tour ✕</button>
    `;
    const exitBtn = document.getElementById('btn-hud-exit');
    if (exitBtn) {
      exitBtn.onclick = () => endTour();
    }
  }

  function showTourCard(opts) {
    removeModalBanner();
    let card = document.getElementById('leo-guide-card');
    if (!card) {
      card = document.createElement('div');
      card.id = 'leo-guide-card';
      card.className = 'leo-guide-card';
      document.body.appendChild(card);
    }
    card.style.display = '';

    currentStepActionHandler = opts.actionHandler || null;

    card.innerHTML = `
      <div class="leo-guide-header">
        <div class="leo-guide-identity">
          <span class="leo-avatar">🧘</span>
          <span class="leo-name">Leo’s Mindful Tour</span>
        </div>
        <span class="leo-step-counter">Step ${currentStepIndex + 1} / ${TOUR_STEPS.length}</span>
      </div>
      <div class="leo-guide-body">
        <strong>${opts.title}</strong><br>
        ${opts.body}
      </div>
      <div class="leo-guide-actions">
        <div class="leo-nav-group">
          <button type="button" class="leo-btn-secondary" id="btn-leo-prev" ${currentStepIndex === 0 ? 'disabled' : ''}>← Back</button>
          <button type="button" class="leo-btn-secondary" id="btn-leo-skip">Skip</button>
        </div>
        <button type="button" class="leo-btn-primary pulse" id="btn-leo-act">${opts.actionText}</button>
      </div>
    `;

    const prevBtn = document.getElementById('btn-leo-prev');
    if (prevBtn) prevBtn.onclick = () => prevStep();

    const skipBtn = document.getElementById('btn-leo-skip');
    if (skipBtn) skipBtn.onclick = () => endTour();

    const actBtn = document.getElementById('btn-leo-act');
    if (actBtn) actBtn.onclick = () => triggerCurrentStepAction();
  }

  function renderStep() {
    if (currentStepIndex >= TOUR_STEPS.length) {
      endTour();
      return;
    }
    updateHudBar();
    const step = TOUR_STEPS[currentStepIndex];
    if (step && typeof step.init === 'function') {
      step.init();
    }
  }

  function nextStep() {
    currentStepIndex++;
    if (currentStepIndex >= TOUR_STEPS.length) {
      endTour();
    } else {
      renderStep();
    }
  }

  function prevStep() {
    if (currentStepIndex > 0) {
      currentStepIndex--;
      renderStep();
    }
  }

  function startTour() {
    if (isTourActive) return;

    // Snapshot user's real state so tutorial actions never overwrite personal data
    if (window.getZenState) {
      try {
        userStateSnapshot = JSON.parse(JSON.stringify(window.getZenState()));
      } catch (_) {}
    }

    isTourActive = true;
    currentStepIndex = 0;
    document.body.classList.add('tutorial-active');

    // Register strict capture-phase click and key guardrails
    document.addEventListener('click', handleTourClickGuard, true);
    document.addEventListener('keydown', handleTourKeyGuard, true);

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
    if (!isTourActive) return;
    isTourActive = false;
    currentStepActionHandler = null;
    document.body.classList.remove('tutorial-active');

    document.removeEventListener('click', handleTourClickGuard, true);
    document.removeEventListener('keydown', handleTourKeyGuard, true);

    closeAllModalsAndOverlays();
    clearHighlight();

    const hud = document.getElementById('tutorial-hud-bar');
    if (hud) hud.remove();

    const card = document.getElementById('leo-guide-card');
    if (card) card.remove();

    const mask = document.getElementById('leo-tour-mask');
    if (mask) mask.classList.remove('active');

    // Restore user's real state snapshot cleanly
    if (userStateSnapshot && window.reloadZenState) {
      window.reloadZenState(userStateSnapshot);
      userStateSnapshot = null;
    }

    try {
      localStorage.setItem('adhd_leo_tour_v3_done', 'true');
    } catch (_) {}

    if (window.setZenScreen) {
      window.setZenScreen('allowance');
    }
  }

  Leo.startTour = startTour;
  Leo.endTour = endTour;
  Leo.isActive = () => isTourActive;

  global.LeoTour = Leo;
})(typeof window !== 'undefined' ? window : this);
