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

  window.setZenScreen = setScreen;
  window.reloadZenState = function (newState) {
    if (newState) {
      state = newState;
      StateManager.saveState(state);
    } else {
      state = StateManager.loadState();
    }
    document.body.dataset.theme = (state.profile && state.profile.theme) || 'sage-harmony';
    renderCurrentScreen();
  };
  window.getZenState = function () {
    return state;
  };

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

    // Render Today's Logged Spends (with Undo / Remove button)
    const todayBox = document.getElementById('zen-today-spends-container');
    if (todayBox) {
      const todayISO = new Date().toISOString().slice(0, 10);
      const todayTxs = (state.transactions || []).filter(tx => tx.date === todayISO);
      if (todayTxs.length === 0) {
        todayBox.innerHTML = '';
      } else {
        todayBox.innerHTML = `
          <div style="font-size:11px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin:4px 0 8px;">
            🍵 Mindful Spends Today (${todayTxs.length})
          </div>
          ${todayTxs.map(tx => `
            <div class="harmony-card" style="padding:10px 14px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
              <div class="card-name" style="font-size:13.5px;margin:0;">${tx.title}</div>
              <div class="card-actions-row">
                <div class="card-val" style="font-size:13.5px;">-${CoreCalculator.formatCents(tx.amountCents, state.profile.currency)}</div>
                <button type="button" class="btn-zen-card-delete" data-del-tx="${tx.id}" title="Undo / Remove Spend">&times;</button>
              </div>
            </div>
          `).join('')}
        `;
        todayBox.querySelectorAll('[data-del-tx]').forEach(btn => {
          btn.onclick = () => {
            state.transactions = state.transactions.filter(t => t.id !== btn.dataset.delTx);
            StateManager.saveState(state);
            playGentleClick();
            renderAllowance();
          };
        });
      }
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
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <span style="font-size:12px;color:var(--text-muted);">Due: ${b.dueDate} ${b.paid ? '• <span style="color:var(--accent-mint);font-weight:700;">✓ PAID</span>' : '• <span style="color:var(--accent-gold);">Reserved</span>'}</span>
          <div class="card-actions-row">
            <button type="button" class="btn-harmony-action ${b.paid ? 'cleared' : ''}" data-pay-id="${b.id}" title="Mark Paid or Unpaid">
              ${b.paid ? '✓ Paid' : 'Mark Paid'}
            </button>
            <button type="button" class="btn-zen-card-edit" data-edit-living="${b.id}" title="Edit Cost">✏️ Edit</button>
            <button type="button" class="btn-zen-card-delete" data-del-living="${b.id}" title="Remove Living Cost">&times;</button>
          </div>
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

    list.querySelectorAll('[data-edit-living]').forEach(btn => {
      btn.onclick = () => {
        const cost = state.livingCosts.find(c => c.id === btn.dataset.editLiving);
        if (cost) {
          const heading = document.getElementById('modal-living-heading');
          if (heading) heading.textContent = '✏️ Edit Living Cost';
          document.getElementById('living-edit-id').value = cost.id;
          document.getElementById('living-name-field').value = cost.name;
          document.getElementById('living-amt-field').value = (cost.amountCents / 100).toFixed(2);
          document.getElementById('living-date-field').value = cost.dueDate;
          document.getElementById('modal-add-living').classList.add('open');
        }
      };
    });

    list.querySelectorAll('[data-del-living]').forEach(btn => {
      btn.onclick = () => {
        state.livingCosts = state.livingCosts.filter(c => c.id !== btn.dataset.delLiving);
        StateManager.saveState(state);
        playGentleClick();
        renderLivingCosts();
        renderAllowance();
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
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <span style="font-size:12px;color:var(--accent-mint);">
              ${cd.isUnlocked ? '🔓 48h Passed — Urge resolved?' : `⏳ ${cd.remainingHours}h remaining`}
            </span>
            <div class="card-actions-row">
              <button type="button" class="btn-harmony-action cleared" data-del-cooldown="${item.id}" title="Let It Go (Save Money!)">🎉 Let It Go</button>
              <button type="button" class="btn-zen-card-edit" data-buy-cooldown="${item.id}" title="Buy & Record Spend">🍵 Buy</button>
              <button type="button" class="btn-zen-card-edit" data-edit-cooldown="${item.id}" title="Edit Item">✏️</button>
            </div>
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

    list.querySelectorAll('[data-buy-cooldown]').forEach(btn => {
      btn.onclick = () => {
        const item = state.cooldownHoldItems.find(i => i.id === btn.dataset.buyCooldown);
        if (item) {
          state.transactions.unshift({
            id: 'tx-' + Date.now(),
            timestamp: Date.now(),
            date: new Date().toISOString().slice(0, 10),
            title: item.name,
            amountCents: item.amountCents
          });
          state.cooldownHoldItems = state.cooldownHoldItems.filter(i => i.id !== item.id);
          StateManager.saveState(state);
          playGentleClick();
          renderCooldownHold();
          renderAllowance();
        }
      };
    });

    list.querySelectorAll('[data-edit-cooldown]').forEach(btn => {
      btn.onclick = () => {
        const item = state.cooldownHoldItems.find(i => i.id === btn.dataset.editCooldown);
        if (item) {
          const heading = document.getElementById('modal-cooldown-heading');
          if (heading) heading.textContent = '✏️ Edit Cooldown Urge';
          document.getElementById('cooldown-edit-id').value = item.id;
          document.getElementById('cooldown-name-field').value = item.name;
          document.getElementById('cooldown-amt-field').value = (item.amountCents / 100).toFixed(2);
          document.getElementById('modal-add-cooldown').classList.add('open');
        }
      };
    });
  }

  function renderDebtFreedom() {
    const summary = document.getElementById('debt-freedom-plan');
    const list = document.getElementById('debt-list');
    if (!state.debts || state.debts.length === 0) {
      if (summary) summary.textContent = '🕊️ Zero liabilities. Peace achieved!';
      if (list) list.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:24px;">No debt obligations on your path. Tap + Add Debt above to add accounts.</p>`;
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
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div style="font-size:12px;color:var(--text-muted);">
              Min Payment: ${CoreCalculator.formatCents(d.minPaymentCents, state.profile.currency)}/mo (${d.interestRate}% APR)
            </div>
            <div class="card-actions-row">
              <button type="button" class="btn-zen-card-edit" data-edit-debt="${d.id}" title="Edit Debt">✏️ Edit</button>
              <button type="button" class="btn-zen-card-delete" data-del-debt="${d.id}" title="Remove Debt">&times;</button>
            </div>
          </div>
        </div>
      `).join('');

      list.querySelectorAll('[data-edit-debt]').forEach(btn => {
        btn.onclick = () => {
          const d = state.debts.find(item => item.id === btn.dataset.editDebt);
          if (d) {
            const heading = document.getElementById('modal-zen-debt-heading');
            if (heading) heading.textContent = '✏️ Edit Debt Obligation';
            document.getElementById('debt-zen-edit-id').value = d.id;
            document.getElementById('debt-zen-name-field').value = d.name;
            document.getElementById('debt-zen-balance-field').value = (d.balanceCents / 100).toFixed(2);
            document.getElementById('debt-zen-min-field').value = (d.minPaymentCents / 100).toFixed(2);
            document.getElementById('debt-zen-apr-field').value = d.interestRate;
            document.getElementById('modal-add-zen-debt').classList.add('open');
          }
        };
      });

      list.querySelectorAll('[data-del-debt]').forEach(btn => {
        btn.onclick = () => {
          state.debts = state.debts.filter(item => item.id !== btn.dataset.delDebt);
          StateManager.saveState(state);
          playGentleClick();
          renderDebtFreedom();
        };
      });
    }
  }

  function renderMindDump() {
    const textarea = document.getElementById('minddump-textarea-input');
    if (textarea && state) {
      textarea.value = state.notes || '';
    }
  }

  function renderConfig() {
    const chkInput = document.getElementById('settings-checking-field');
    if (chkInput && state) {
      chkInput.value = (state.checkingCents / 100).toFixed(2);
    }
    const cycSelect = document.getElementById('settings-cycle-field');
    if (cycSelect && state) {
      cycSelect.value = state.incomeCycle || 'biweekly';
    }
    const themeSelect = document.getElementById('settings-theme-field');
    if (themeSelect && state && state.profile) {
      themeSelect.value = state.profile.theme || 'sage-harmony';
    }
  }

  function renderCurrentScreen() {
    renderHeader();
    if (currentScreen === 'allowance') renderAllowance();
    if (currentScreen === 'living') renderLivingCosts();
    if (currentScreen === 'cooldown') renderCooldownHold();
    if (currentScreen === 'freedom') renderDebtFreedom();
    if (currentScreen === 'minddump') renderMindDump();
    if (currentScreen === 'config') renderConfig();
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
      renderConfig();
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

    // Add / Edit Living Cost Modal
    document.getElementById('btn-add-living-open').onclick = () => {
      const heading = document.getElementById('modal-living-heading');
      if (heading) heading.textContent = '📅 Add Living Cost';
      document.getElementById('living-edit-id').value = '';
      document.getElementById('living-name-field').value = '';
      document.getElementById('living-amt-field').value = '';
      document.getElementById('living-date-field').value = new Date().toISOString().slice(0, 10);
      document.getElementById('modal-add-living').classList.add('open');
    };
    document.getElementById('btn-add-living-close').onclick = () => {
      document.getElementById('modal-add-living').classList.remove('open');
    };
    document.getElementById('form-add-living').onsubmit = (e) => {
      e.preventDefault();
      const editId = document.getElementById('living-edit-id').value;
      const name = document.getElementById('living-name-field').value.trim();
      const amt = CoreCalculator.parseToCents(document.getElementById('living-amt-field').value);
      const date = document.getElementById('living-date-field').value;
      if (name && amt > 0 && date) {
        if (editId) {
          const cost = state.livingCosts.find(c => c.id === editId);
          if (cost) {
            cost.name = name;
            cost.amountCents = amt;
            cost.dueDate = date;
          }
        } else {
          state.livingCosts.push({
            id: 'lc-' + Date.now(),
            name: name,
            amountCents: amt,
            dueDate: date,
            paid: false
          });
        }
        StateManager.saveState(state);
        document.getElementById('modal-add-living').classList.remove('open');
        playGentleClick();
        renderLivingCosts();
        renderAllowance();
      }
    };

    // Add / Edit Cooldown Modal
    document.getElementById('btn-add-cooldown-open').onclick = () => {
      const heading = document.getElementById('modal-cooldown-heading');
      if (heading) heading.textContent = '⏳ Park in 48-Hour Cooldown Hold';
      document.getElementById('cooldown-edit-id').value = '';
      document.getElementById('cooldown-name-field').value = '';
      document.getElementById('cooldown-amt-field').value = '';
      document.getElementById('modal-add-cooldown').classList.add('open');
    };
    document.getElementById('btn-add-cooldown-close').onclick = () => {
      document.getElementById('modal-add-cooldown').classList.remove('open');
    };
    document.getElementById('form-add-cooldown').onsubmit = (e) => {
      e.preventDefault();
      const editId = document.getElementById('cooldown-edit-id').value;
      const name = document.getElementById('cooldown-name-field').value.trim();
      const amt = CoreCalculator.parseToCents(document.getElementById('cooldown-amt-field').value);
      if (name && amt > 0) {
        if (editId) {
          const item = state.cooldownHoldItems.find(i => i.id === editId);
          if (item) {
            item.name = name;
            item.amountCents = amt;
          }
        } else {
          state.cooldownHoldItems.push({
            id: 'ch-' + Date.now(),
            name: name,
            amountCents: amt,
            parkedAt: Date.now()
          });
        }
        StateManager.saveState(state);
        document.getElementById('modal-add-cooldown').classList.remove('open');
        playGentleClick();
        renderCooldownHold();
      }
    };

    // Add / Edit Debt Modal
    const modalZenDebt = document.getElementById('modal-add-zen-debt');
    const btnOpenAddDebt = document.getElementById('btn-add-debt-open');
    if (btnOpenAddDebt && modalZenDebt) {
      btnOpenAddDebt.onclick = () => {
        const heading = document.getElementById('modal-zen-debt-heading');
        if (heading) heading.textContent = '📉 Add Debt Obligation';
        document.getElementById('debt-zen-edit-id').value = '';
        document.getElementById('debt-zen-name-field').value = '';
        document.getElementById('debt-zen-balance-field').value = '';
        document.getElementById('debt-zen-min-field').value = '';
        document.getElementById('debt-zen-apr-field').value = '';
        modalZenDebt.classList.add('open');
      };
    }
    const btnCloseAddDebt = document.getElementById('btn-add-debt-close');
    if (btnCloseAddDebt && modalZenDebt) {
      btnCloseAddDebt.onclick = () => {
        modalZenDebt.classList.remove('open');
      };
    }
    const formAddDebt = document.getElementById('form-add-zen-debt');
    if (formAddDebt && modalZenDebt) {
      formAddDebt.onsubmit = (e) => {
        e.preventDefault();
        const editId = document.getElementById('debt-zen-edit-id').value;
        const name = document.getElementById('debt-zen-name-field').value.trim();
        const bal = CoreCalculator.parseToCents(document.getElementById('debt-zen-balance-field').value);
        const min = CoreCalculator.parseToCents(document.getElementById('debt-zen-min-field').value);
        const apr = parseFloat(document.getElementById('debt-zen-apr-field').value) || 0;
        if (name && bal > 0) {
          if (!state.debts) state.debts = [];
          if (editId) {
            const d = state.debts.find(item => item.id === editId);
            if (d) {
              d.name = name;
              d.balanceCents = bal;
              d.minPaymentCents = min;
              d.interestRate = apr;
            }
          } else {
            state.debts.push({
              id: 'debt-' + Date.now(),
              name: name,
              balanceCents: bal,
              minPaymentCents: min,
              interestRate: apr
            });
          }
          StateManager.saveState(state);
          modalZenDebt.classList.remove('open');
          playGentleClick();
          renderDebtFreedom();
        }
      };
    }

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
      renderConfig();
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

    // Automatic First-Time Mindful Onboarding Tour (Only marked done when user exits/completes tour)
    const hasAutoGuided = localStorage.getItem('adhd_leo_tour_v3_done') === 'true';
    if (!hasAutoGuided) {
      setTimeout(() => {
        if (window.LeoTour && typeof window.LeoTour.startTour === 'function') {
          window.LeoTour.startTour();
        }
      }, 450);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then(reg => {
        if (reg && typeof reg.update === 'function') reg.update();
      }).catch(() => {});
    }
  }

  window.addEventListener('DOMContentLoaded', init);
})();
