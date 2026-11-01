/**
 * ADHD Budget Planner - Application Controller (Edition 3)
 * Manages responsive state, radial progress dial, and offline storage.
 */
(function () {
  'use strict';

  let state = null;
  let currentScreen = 'today';

  function playGentleClick() {
    if (!state || !state.profile || !state.profile.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch {
      // AudioContext unavailable
    }
  }

  function setScreen(screenId) {
    currentScreen = screenId;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.zen-tab').forEach(t => t.classList.remove('active'));

    const targetScreen = document.getElementById(`screen-${screenId}`);
    if (targetScreen) targetScreen.classList.add('active');

    const targetTab = document.querySelector(`.zen-tab[data-nav="${screenId}"]`);
    if (targetTab) targetTab.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'instant' });
    renderCurrentScreen();
  }

  function renderHeader() {
    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) {
      soundBtn.innerHTML = state.profile.soundEnabled ? '🔔' : '🔕';
    }
  }

  function renderToday() {
    const safe = CoreCalculator.calculateSafeToSpend(state);
    const dialNumber = document.getElementById('dial-hero-amount');
    if (dialNumber) {
      dialNumber.textContent = CoreCalculator.formatCents(safe.safeToSpendTodayCents, state.profile.currency);
    }

    const runwayPill = document.getElementById('dial-runway-pill');
    if (runwayPill) {
      runwayPill.textContent = `${safe.daysRunway} days until payday (${safe.nextPaydayISO})`;
    }

    const subtext = document.getElementById('dial-subtext');
    if (subtext) {
      subtext.innerHTML = `Spendable pool: <strong>${CoreCalculator.formatCents(safe.spendablePoolCents, state.profile.currency)}</strong> • Fixed bills set aside: <strong>${CoreCalculator.formatCents(safe.pendingBillsCents, state.profile.currency)}</strong>`;
    }

    // Render Quick Spends
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
              date: new Date().toISOString().slice(0, 10),
              title: qs.title,
              amountCents: qs.amountCents
            });
            StateManager.saveState(state);
            playGentleClick();
            renderToday();
          }
        };
      });
    }

    // Update Zombie Screen Hero
    const zombieAmt = document.getElementById('zombie-screen-amount');
    if (zombieAmt) {
      zombieAmt.textContent = CoreCalculator.formatCents(safe.safeToSpendTodayCents, state.profile.currency);
    }
  }

  function renderBills() {
    const list = document.getElementById('bill-list');
    if (!list) return;
    if (!state.bills || state.bills.length === 0) {
      list.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:24px;">No recurring bills recorded. Tap "+ Add Bill" to reserve rent or utilities.</p>`;
      return;
    }

    list.innerHTML = state.bills.map(b => `
      <div class="harmony-card">
        <div class="card-top">
          <div class="card-name"><span>📅</span> <span>${b.name}</span></div>
          <div class="card-val">${CoreCalculator.formatCents(b.amountCents, state.profile.currency)}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--text-muted);">
          <span>Due date: ${b.dueDate}</span>
          <button type="button" class="btn-harmony-action ${b.paid ? 'cleared' : ''}" data-bill-id="${b.id}">
            ${b.paid ? '✓ Paid' : 'Mark as Paid'}
          </button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.btn-harmony-action').forEach(btn => {
      btn.onclick = () => {
        const bill = state.bills.find(b => b.id === btn.dataset.billId);
        if (bill) {
          bill.paid = !bill.paid;
          playGentleClick();
          StateManager.saveState(state);
          renderBills();
          renderToday();
        }
      };
    });
  }

  function renderVault() {
    const list = document.getElementById('vault-list');
    if (!list) return;
    if (!state.vaultItems || state.vaultItems.length === 0) {
      list.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:24px;">Your Impulse Vault is clear. When shopping urges hit, park them here for 48 hours to cool down!</p>`;
      return;
    }

    const now = Date.now();
    list.innerHTML = state.vaultItems.map(item => {
      const cd = CoreCalculator.getVaultRemaining(item, now);
      return `
        <div class="harmony-card">
          <div class="card-top">
            <div class="card-name"><span>⏳</span> <span>${item.name}</span></div>
            <div class="card-val">${CoreCalculator.formatCents(item.amountCents, state.profile.currency)}</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--text-muted);">
            <span>${cd.isUnlocked ? '✨ 48 hours passed! Do you still want this?' : `Cooldown: ${cd.remainingHours}h remaining`}</span>
            <button type="button" class="btn-harmony-action" data-vault-id="${item.id}">Release Urge</button>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.btn-harmony-action').forEach(btn => {
      btn.onclick = () => {
        const idx = state.vaultItems.findIndex(i => i.id === btn.dataset.vaultId);
        if (idx !== -1) {
          state.vaultItems.splice(idx, 1);
          playGentleClick();
          StateManager.saveState(state);
          renderVault();
        }
      };
    });
  }

  function renderDebt() {
    const list = document.getElementById('debt-list');
    if (!list) return;
    const plan = CoreCalculator.calculateDebtPlan(state.debts, 5000);
    document.getElementById('debt-freedom-plan').textContent = plan.isDebtFree ? `Projected Debt Free in ~${plan.monthsToDebtFree} months` : 'Enter debts to calculate freedom plan';

    if (!state.debts || state.debts.length === 0) {
      list.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:20px;">No debts listed. You are debt free! 🎉</p>`;
      return;
    }

    list.innerHTML = state.debts.map(d => `
      <div class="harmony-card">
        <div class="card-top">
          <div class="card-name"><span>💳</span> <span>${d.name}</span></div>
          <div class="card-val">${CoreCalculator.formatCents(d.balanceCents, state.profile.currency)}</div>
        </div>
        <div style="font-size:12px;color:var(--text-muted);">
          Min Payment: ${CoreCalculator.formatCents(d.minPaymentCents, state.profile.currency)}/mo (${d.interestRate}% APR)
        </div>
      </div>
    `).join('');
  }

  function renderNotes() {
    const textarea = document.getElementById('notes-scratchpad-input');
    if (textarea && state.notes !== undefined) {
      textarea.value = state.notes;
    }
  }

  function renderCurrentScreen() {
    renderHeader();
    if (currentScreen === 'today') renderToday();
    if (currentScreen === 'bills') renderBills();
    if (currentScreen === 'vault') renderVault();
    if (currentScreen === 'debt') renderDebt();
    if (currentScreen === 'notes') renderNotes();
  }

  function bindUI() {
    // Nav tabs
    document.querySelectorAll('.zen-tab').forEach(tab => {
      tab.onclick = () => setScreen(tab.dataset.nav);
    });

    // Top Actions
    document.getElementById('btn-sound-toggle').onclick = () => {
      state.profile.soundEnabled = !state.profile.soundEnabled;
      StateManager.saveState(state);
      renderHeader();
    };

    document.getElementById('btn-maya-tour').onclick = () => {
      GuideTour.startTour();
    };

    // Zombie Screen
    const zombie = document.getElementById('zombie-screen-overlay');
    document.getElementById('btn-zombie-trigger').onclick = () => {
      zombie.classList.add('active');
    };
    document.getElementById('btn-zombie-close').onclick = () => {
      zombie.classList.remove('active');
    };

    // Notes auto-save
    const textarea = document.getElementById('notes-scratchpad-input');
    if (textarea) {
      textarea.oninput = () => {
        state.notes = textarea.value;
        StateManager.saveState(state);
      };
    }

    // Add Bill Modal
    document.getElementById('btn-add-bill-open').onclick = () => {
      document.getElementById('modal-add-bill').classList.add('open');
    };
    document.getElementById('btn-add-bill-close').onclick = () => {
      document.getElementById('modal-add-bill').classList.remove('open');
    };
    document.getElementById('form-add-bill').onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById('bill-name-field').value;
      const amt = CoreCalculator.parseToCents(document.getElementById('bill-amt-field').value);
      const date = document.getElementById('bill-date-field').value;
      if (name && amt > 0 && date) {
        state.bills.push({
          id: 'b-' + Date.now(),
          name: name,
          amountCents: amt,
          dueDate: date,
          paid: false
        });
        StateManager.saveState(state);
        document.getElementById('modal-add-bill').classList.remove('open');
        playGentleClick();
        renderBills();
        renderToday();
      }
    };

    // Add Vault Modal
    document.getElementById('btn-add-vault-open').onclick = () => {
      document.getElementById('modal-add-vault').classList.add('open');
    };
    document.getElementById('btn-add-vault-close').onclick = () => {
      document.getElementById('modal-add-vault').classList.remove('open');
    };
    document.getElementById('form-add-vault').onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById('vault-name-field').value;
      const amt = CoreCalculator.parseToCents(document.getElementById('vault-amt-field').value);
      if (name && amt > 0) {
        state.vaultItems.push({
          id: 'v-' + Date.now(),
          name: name,
          amountCents: amt,
          parkedAt: Date.now()
        });
        StateManager.saveState(state);
        document.getElementById('modal-add-vault').classList.remove('open');
        playGentleClick();
        renderVault();
      }
    };

    // Settings Form
    document.getElementById('settings-checking-field').value = (state.checkingCents / 100).toFixed(2);
    document.getElementById('settings-cycle-field').value = state.incomeCycle || 'biweekly';
    document.getElementById('settings-theme-field').value = state.profile.theme || 'sage-harmony';

    document.getElementById('form-settings').onsubmit = (e) => {
      e.preventDefault();
      state.checkingCents = CoreCalculator.parseToCents(document.getElementById('settings-checking-field').value);
      state.incomeCycle = document.getElementById('settings-cycle-field').value;
      state.profile.theme = document.getElementById('settings-theme-field').value;
      document.body.dataset.theme = state.profile.theme;
      StateManager.saveState(state);
      playGentleClick();
      renderToday();
      alert('Settings saved successfully.');
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
          alert('Backup restored successfully!');
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
    setScreen('today');

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  window.addEventListener('DOMContentLoaded', init);
})();
