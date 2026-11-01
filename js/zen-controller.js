/**
 * ADHD Budget Planner - Sanctuary Controller (Edition 3: Wabi-Sabi Terracotta)
 * Concentric radial dial, floating zen island navigation, slide-up drawer, and mindful auto-onboarding.
 */
(function () {
  'use strict';

  let state = null;
  let currentScreen = 'allowance';

  function playGentleClick() {
    if (!state || !state.profile || !state.profile.soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (_) {}
  }

  function setScreen(screenId) {
    currentScreen = screenId;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.island-tab, .zen-tab').forEach(t => t.classList.remove('active'));

    const targetScreen = document.getElementById(`screen-${screenId}`);
    if (targetScreen) targetScreen.classList.add('active');

    const targetTab = document.querySelector(`.island-tab[data-nav="${screenId}"], .zen-tab[data-nav="${screenId}"]`);
    if (targetTab) targetTab.classList.add('active');

    // Close drawer if open
    const drawer = document.getElementById('sanctuary-drawer-sheet');
    if (drawer) drawer.classList.remove('active');

    window.scrollTo({ top: 0, behavior: 'instant' });
    renderCurrentScreen();
  }

  function renderHeader() {
    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) {
      soundBtn.innerHTML = state.profile.soundEnabled ? '🔔' : '🔕';
    }
  }

  function renderAllowance() {
    const adapterState = {
      checkingCents: state.checkingCents,
      incomeAnchor: state.incomeAnchor,
      incomeCycle: state.incomeCycle,
      balanceUpdatedAt: state.balanceUpdatedAt,
      bills: state.livingCosts,
      transactions: state.transactions
    };
    const safe = CoreCalculator.calculateSafeToSpend(adapterState);
    const dialNumber = document.getElementById('dial-hero-amount');
    if (dialNumber) {
      dialNumber.textContent = CoreCalculator.formatCents(safe.safeToSpendTodayCents, state.profile.currency);
    }

    const runwayPill = document.getElementById('dial-runway-pill');
    if (runwayPill) {
      runwayPill.textContent = `${safe.daysRunway} days peace until inflow (${safe.nextPaydayISO})`;
    }

    const subtext = document.getElementById('dial-subtext');
    if (subtext) {
      subtext.innerHTML = `Spendable pool: <strong>${CoreCalculator.formatCents(safe.spendablePoolCents, state.profile.currency)}</strong> • Fixed commitments: <strong>${CoreCalculator.formatCents(safe.pendingBillsCents, state.profile.currency)}</strong>`;
    }

    // Inflow Sanctuary Widget
    const inflowHeading = document.getElementById('zen-inflow-status-text');
    const inflowPeace = document.getElementById('zen-inflow-peace-runway');
    if (inflowHeading) {
      const payAmtFormatted = CoreCalculator.formatCents(state.paycheckCents || 250000, state.profile.currency);
      const cycleName = (state.incomeCycle || 'biweekly').replace(/^\w/, c => c.toUpperCase());
      inflowHeading.textContent = `${safe.nextPaydayISO} • Inflow: ${payAmtFormatted} (${cycleName})`;
    }
    if (inflowPeace) {
      const pendingFormatted = CoreCalculator.formatCents(safe.pendingBillsCents, state.profile.currency);
      inflowPeace.textContent = `🌱 ${safe.daysRunway} days of financial runway • Reserved for living: ${pendingFormatted}`;
    }

    // Render Quick Spends (Vertical 3-item stack)
    const grid = document.getElementById('zen-quick-spends');
    if (grid) {
      grid.innerHTML = (state.quickSpends || []).map(qs => `
        <button type="button" class="zen-chip-btn" data-spend-id="${qs.id}">
          <span class="chip-icon">${qs.icon}</span>
          <span class="chip-title">${qs.title}</span>
          <span class="chip-price">${CoreCalculator.formatCents(qs.amountCents, state.profile.currency)}</span>
        </button>
      `).join('');

      grid.querySelectorAll('.zen-chip-btn').forEach(btn => {
        btn.onclick = () => {
          const qs = state.quickSpends.find(q => q.id === btn.dataset.spendId);
          if (qs) {
            state.transactions.unshift({
              id: 'tx-' + Date.now(),
              timestamp: Date.now(),
              date: new Date().toISOString().slice(0, 10),
              title: qs.title,
              amountCents: qs.amountCents
            });
            StateManager.saveState(state);
            playGentleClick();
            renderAllowance();
          }
        };
      });
    }

    // Update Fog Mode Screen Hero
    const fogAmt = document.getElementById('fog-screen-amount');
    if (fogAmt) {
      fogAmt.textContent = CoreCalculator.formatCents(safe.safeToSpendTodayCents, state.profile.currency);
    }
  }

  function renderLivingCosts() {
    const list = document.getElementById('living-list');
    if (!list) return;
    if (!state.livingCosts || state.livingCosts.length === 0) {
      list.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:24px;">No living costs recorded. Tap "+ Add Cost" to reserve shelter or utilities.</p>`;
      return;
    }

    list.innerHTML = state.livingCosts.map(b => `
      <div class="harmony-card">
        <div class="card-top">
          <div class="card-name">${b.name}</div>
          <div class="card-val">${CoreCalculator.formatCents(b.amountCents, state.profile.currency)}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;color:var(--text-muted);">Due: ${b.dueDate}</span>
          <button type="button" class="btn-harmony-action ${b.paid ? 'cleared' : ''}" data-pay-id="${b.id}">
            ${b.paid ? 'Paid ✓' : 'Mark Paid'}
          </button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('[data-pay-id]').forEach(btn => {
      btn.onclick = () => {
        const cost = state.livingCosts.find(c => c.id === btn.dataset.payId);
        if (cost) {
          cost.paid = !cost.paid;
          StateManager.saveState(state);
          playGentleClick();
          renderLivingCosts();
          renderAllowance();
        }
      };
    });
  }

  function renderCooldownHold() {
    const list = document.getElementById('cooldown-list');
    if (!list) return;
    if (!state.cooldownHoldItems || state.cooldownHoldItems.length === 0) {
      list.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:24px;">Cooldown Hold is empty. Park impulse urges here for 48 hours.</p>`;
      return;
    }

    const now = Date.now();
    list.innerHTML = state.cooldownHoldItems.map(item => {
      const cd = CoreCalculator.getVaultRemaining(item, now);
      return `
        <div class="harmony-card">
          <div class="card-top">
            <div class="card-name">${item.name}</div>
            <div class="card-val">${CoreCalculator.formatCents(item.amountCents, state.profile.currency)}</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:12px;color:var(--accent-mint);">
              ${cd.isUnlocked ? '🔓 48h Passed — Urge resolved?' : `⏳ ${cd.remainingHours}h remaining`}
            </span>
            <button type="button" class="btn-harmony-action" data-del-cooldown="${item.id}" style="background:#dc2626;">Dismiss</button>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('[data-del-cooldown]').forEach(btn => {
      btn.onclick = () => {
        state.cooldownHoldItems = state.cooldownHoldItems.filter(i => i.id !== btn.dataset.delCooldown);
        StateManager.saveState(state);
        playGentleClick();
        renderCooldownHold();
      };
    });
  }

  function renderDebtFreedom() {
    const summary = document.getElementById('debt-freedom-plan');
    const list = document.getElementById('debt-list');
    if (!state.debts || state.debts.length === 0) {
      if (summary) summary.textContent = '🕊️ Zero liabilities. Peace achieved!';
      if (list) list.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:24px;">No debt obligations on your path.</p>`;
      return;
    }

    const plan = CoreCalculator.calculateDebtPlan(state.debts, 5000);
    if (summary) {
      summary.innerHTML = `Debt Free in <strong>${plan.monthsToDebtFree} months</strong> (Saving $${(plan.totalInterestPaidCents/100).toFixed(0)} in interest)`;
    }

    if (list) {
      list.innerHTML = state.debts.map(d => `
        <div class="harmony-card">
          <div class="card-top">
            <div class="card-name">${d.name}</div>
            <div class="card-val">${CoreCalculator.formatCents(d.balanceCents, state.profile.currency)}</div>
          </div>
          <div style="font-size:12px;color:var(--text-muted);">
            Min Payment: ${CoreCalculator.formatCents(d.minPaymentCents, state.profile.currency)}/mo (${d.interestRate}% APR)
          </div>
        </div>
      `).join('');
    }
  }

  function renderMindDump() {
    const textarea = document.getElementById('minddump-textarea-input');
    if (textarea && state) {
      textarea.value = state.notes || '';
    }
  }

  function renderCurrentScreen() {
    renderHeader();
    if (currentScreen === 'allowance') renderAllowance();
    if (currentScreen === 'living') renderLivingCosts();
    if (currentScreen === 'cooldown') renderCooldownHold();
    if (currentScreen === 'freedom') renderDebtFreedom();
    if (currentScreen === 'minddump') renderMindDump();
  }

  function bindUI() {
    // Nav tabs (Floating Zen Island & Drawer links)
    document.querySelectorAll('.island-tab[data-nav], .zen-tab').forEach(tab => {
      tab.onclick = () => setScreen(tab.dataset.nav);
    });

    document.querySelectorAll('[data-drawer-nav]').forEach(btn => {
      btn.onclick = () => {
        setScreen(btn.dataset.drawerNav);
      };
    });

    // Top Header Actions
    document.getElementById('btn-sound-toggle').onclick = () => {
      state.profile.soundEnabled = !state.profile.soundEnabled;
      StateManager.saveState(state);
      renderHeader();
    };

    document.getElementById('btn-leo-tour').onclick = () => {
      LeoTour.startTour();
    };

    // Fog Mode Screen Overlay
    const fog = document.getElementById('fog-mode-overlay');
    document.getElementById('btn-fog-trigger').onclick = () => {
      fog.classList.add('active');
    };
    document.getElementById('btn-fog-close').onclick = () => {
      fog.classList.remove('active');
    };

    // Sanctuary Slide-Up Drawer
    const drawer = document.getElementById('sanctuary-drawer-sheet');
    document.getElementById('btn-open-sanctuary-drawer').onclick = () => {
      drawer.classList.add('active');
    };
    document.getElementById('btn-close-sanctuary-drawer').onclick = () => {
      drawer.classList.remove('active');
    };
    drawer.onclick = (e) => {
      if (e.target === drawer) drawer.classList.remove('active');
    };

    // Inflow Modal
    const modalInflow = document.getElementById('modal-set-zen-payday');
    document.getElementById('btn-configure-zen-inflow').onclick = () => {
      document.getElementById('input-zen-inflow-date').value = state.incomeAnchor || new Date().toISOString().slice(0, 10);
      document.getElementById('input-zen-inflow-amount').value = ((state.paycheckCents || 250000) / 100).toFixed(2);
      document.getElementById('select-zen-inflow-cycle').value = state.incomeCycle || 'biweekly';
      document.getElementById('input-zen-inflow-checking').value = (state.checkingCents / 100).toFixed(2);
      modalInflow.classList.add('open');
    };
    document.getElementById('btn-close-set-inflow').onclick = () => {
      modalInflow.classList.remove('open');
    };
    document.getElementById('form-set-zen-inflow').onsubmit = (e) => {
      e.preventDefault();
      state.incomeAnchor = document.getElementById('input-zen-inflow-date').value;
      state.paycheckCents = CoreCalculator.parseToCents(document.getElementById('input-zen-inflow-amount').value);
      state.incomeCycle = document.getElementById('select-zen-inflow-cycle').value;
      state.checkingCents = CoreCalculator.parseToCents(document.getElementById('input-zen-inflow-checking').value);
      state.balanceUpdatedAt = Date.now();
      StateManager.saveState(state);
      modalInflow.classList.remove('open');
      playGentleClick();
      renderAllowance();
    };

    // Center Raised Seed FAB (Quick Custom Spend)
    const modalSpend = document.getElementById('modal-zen-spend');
    document.getElementById('island-btn-seed-action').onclick = () => {
      document.getElementById('input-zen-spend-title').value = '';
      document.getElementById('input-zen-spend-amt').value = '';
      modalSpend.classList.add('open');
    };
    document.getElementById('btn-close-zen-spend').onclick = () => {
      modalSpend.classList.remove('open');
    };
    document.getElementById('form-zen-spend').onsubmit = (e) => {
      e.preventDefault();
      const title = document.getElementById('input-zen-spend-title').value.trim() || 'Mindful Spend';
      const amt = CoreCalculator.parseToCents(document.getElementById('input-zen-spend-amt').value);
      if (amt > 0) {
        state.transactions.unshift({
          id: 'tx-' + Date.now(),
          timestamp: Date.now(),
          date: new Date().toISOString().slice(0, 10),
          title: title,
          amountCents: amt
        });
        StateManager.saveState(state);
        modalSpend.classList.remove('open');
        playGentleClick();
        renderAllowance();
      }
    };

    // Mind dump auto-save
    const textarea = document.getElementById('minddump-textarea-input');
    if (textarea) {
      textarea.oninput = () => {
        state.notes = textarea.value;
        StateManager.saveState(state);
      };
    }

    // Add Living Cost Modal
    document.getElementById('btn-add-living-open').onclick = () => {
      document.getElementById('modal-add-living').classList.add('open');
    };
    document.getElementById('btn-add-living-close').onclick = () => {
      document.getElementById('modal-add-living').classList.remove('open');
    };
    document.getElementById('form-add-living').onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById('living-name-field').value;
      const amt = CoreCalculator.parseToCents(document.getElementById('living-amt-field').value);
      const date = document.getElementById('living-date-field').value;
      if (name && amt > 0 && date) {
        state.livingCosts.push({
          id: 'lc-' + Date.now(),
          name: name,
          amountCents: amt,
          dueDate: date,
          paid: false
        });
        StateManager.saveState(state);
        document.getElementById('modal-add-living').classList.remove('open');
        playGentleClick();
        renderLivingCosts();
        renderAllowance();
      }
    };

    // Add Cooldown Modal
    document.getElementById('btn-add-cooldown-open').onclick = () => {
      document.getElementById('modal-add-cooldown').classList.add('open');
    };
    document.getElementById('btn-add-cooldown-close').onclick = () => {
      document.getElementById('modal-add-cooldown').classList.remove('open');
    };
    document.getElementById('form-add-cooldown').onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById('cooldown-name-field').value;
      const amt = CoreCalculator.parseToCents(document.getElementById('cooldown-amt-field').value);
      if (name && amt > 0) {
        state.cooldownHoldItems.push({
          id: 'ch-' + Date.now(),
          name: name,
          amountCents: amt,
          parkedAt: Date.now()
        });
        StateManager.saveState(state);
        document.getElementById('modal-add-cooldown').classList.remove('open');
        playGentleClick();
        renderCooldownHold();
      }
    };

    // Leo Contextual Help Badges Modal
    const modalLeoHelp = document.getElementById('modal-leo-help');
    document.addEventListener('click', (e) => {
      const badge = e.target.closest('[data-leo-help]');
      if (badge && modalLeoHelp && window.LeoHelp) {
        const key = badge.dataset.leoHelp;
        const item = window.LeoHelp[key];
        if (item) {
          document.getElementById('leo-help-title').textContent = '🧘 ' + item.title;
          document.getElementById('leo-help-core').textContent = item.core;
          document.getElementById('leo-help-action').textContent = item.action;
          document.getElementById('leo-help-brain').textContent = item.brain;
          document.getElementById('leo-help-wisdom').textContent = item.wisdom;
          modalLeoHelp.classList.add('open');
          playGentleClick();
        }
      }
    });

    const btnCloseHelp = document.getElementById('btn-close-leo-help');
    if (btnCloseHelp && modalLeoHelp) {
      btnCloseHelp.onclick = () => {
        modalLeoHelp.classList.remove('open');
      };
    }

    // Close modals on backdrop click or Escape
    document.querySelectorAll('.zen-modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('open');
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.zen-modal-overlay').forEach(m => m.classList.remove('open'));
        const drawer = document.getElementById('sanctuary-drawer-sheet');
        if (drawer) drawer.classList.remove('active');
      }
    });

    // Settings Form
    document.getElementById('settings-checking-field').value = (state.checkingCents / 100).toFixed(2);
    document.getElementById('settings-cycle-field').value = state.incomeCycle || 'biweekly';
    document.getElementById('settings-theme-field').value = state.profile.theme || 'sage-harmony';

    document.getElementById('form-settings').onsubmit = (e) => {
      e.preventDefault();
      state.checkingCents = CoreCalculator.parseToCents(document.getElementById('settings-checking-field').value);
      state.balanceUpdatedAt = Date.now();
      state.incomeCycle = document.getElementById('settings-cycle-field').value;
      state.profile.theme = document.getElementById('settings-theme-field').value;
      document.body.dataset.theme = state.profile.theme;
      StateManager.saveState(state);
      playGentleClick();
      renderAllowance();
      alert('Sanctuary config saved successfully.');
    };

    // Backup & Restore
    document.getElementById('btn-export-backup').onclick = () => {
      const jsonStr = StateManager.exportStateJSON(state);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ADHD-Budget-Planner-Backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };

    document.getElementById('input-restore-backup').onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          state = StateManager.importStateJSON(evt.target.result);
          document.body.dataset.theme = state.profile.theme || 'sage-harmony';
          renderCurrentScreen();
          alert('Sanctuary backup restored!');
        } catch {
          alert('Failed to parse backup file.');
        }
      };
      reader.readAsText(file);
    };
  }

  function init() {
    state = StateManager.loadState();
    document.body.dataset.theme = state.profile.theme || 'sage-harmony';
    bindUI();
    setScreen('allowance');

    // Automatic First-Time Mindful Onboarding Tour
    const hasAutoGuided = localStorage.getItem('adhd_leo_auto_guided') === 'true';
    if (!hasAutoGuided) {
      setTimeout(() => {
        if (window.LeoTour && typeof window.LeoTour.startTour === 'function') {
          window.LeoTour.startTour();
          localStorage.setItem('adhd_leo_auto_guided', 'true');
        }
      }, 500);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  window.addEventListener('DOMContentLoaded', init);
})();
