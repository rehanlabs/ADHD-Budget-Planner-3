/**
 * ADHD Budget Planner (Edition 3) - Wabi-Sabi Sanctuary Demo Guard
 * Isolates demo to temporary sessionStorage, seeds realistic ADHD demo data,
 * and handles Etsy purchase conversion modals.
 */
(function () {
  'use strict';

  // 1. Disable ServiceWorker registration in demo mode
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register = function () {
      return Promise.resolve();
    };
  }

  // 2. Redirect localStorage calls to sessionStorage for store key
  const DEMO_STORE_KEY = 'adhd_budget_store_v3';
  
  if (!sessionStorage.getItem(DEMO_STORE_KEY)) {
    const now = Date.now();
    const inFourDays = new Date(now + 4 * 86400000).toISOString().slice(0, 10);
    const inThreeDays = new Date(now + 3 * 86400000).toISOString().slice(0, 10);
    const todayStr = new Date(now).toISOString().slice(0, 10);

    const seedDemoState = {
      version: 3,
      profile: {
        currency: 'USD',
        theme: 'sage-harmony',
        soundEnabled: true
      },
      checkingCents: 148000, // $1,480.00
      incomeCycle: 'biweekly',
      incomeAnchor: inFourDays, // Inflow in 4 days!
      quickSpends: [
        { id: 'qs-1', title: 'Morning Fuel', icon: '☕', amountCents: 600 },
        { id: 'qs-2', title: 'Online Essentials', icon: '📦', amountCents: 1850 },
        { id: 'qs-3', title: 'Fresh Groceries', icon: '🥦', amountCents: 4500 }
      ],
      livingCosts: [
        { id: 'lc-1', name: 'Housing & Rent', amountCents: 78000, dueDate: inThreeDays, paid: false },
        { id: 'lc-2', name: 'Electricity & Wi-Fi', amountCents: 8200, dueDate: inThreeDays, paid: false }
      ],
      cooldownHoldItems: [
        { id: 'ch-1', name: 'Ergonomic Desk Mat', amountCents: 4800, parkedAt: now - 3600000 * 26 } // 22h remaining!
      ],
      debts: [
        { id: 'd-1', name: 'Credit Card Balance', balanceCents: 175000, minPaymentCents: 6500, interestRate: 19.99 }
      ],
      transactions: [
        { id: 'tx-1', timestamp: now - 3600000 * 2, date: todayStr, title: 'Fresh Groceries', amountCents: 4500 },
        { id: 'tx-2', timestamp: now - 3600000 * 5, date: todayStr, title: 'Online Essentials', amountCents: 1850 }
      ],
      notes: 'Mindful reminder: Take three deep breaths before making impulse purchases.'
    };

    sessionStorage.setItem(DEMO_STORE_KEY, JSON.stringify(seedDemoState));
  }

  // Intercept localStorage methods for DEMO_STORE_KEY
  const originalGetItem = localStorage.getItem.bind(localStorage);
  const originalSetItem = localStorage.setItem.bind(localStorage);
  const originalRemoveItem = localStorage.removeItem.bind(localStorage);

  localStorage.getItem = function (key) {
    if (key === DEMO_STORE_KEY) {
      return sessionStorage.getItem(DEMO_STORE_KEY);
    }
    return originalGetItem(key);
  };

  localStorage.setItem = function (key, value) {
    if (key === DEMO_STORE_KEY) {
      sessionStorage.setItem(DEMO_STORE_KEY, value);
      return;
    }
    originalSetItem(key, value);
  };

  localStorage.removeItem = function (key) {
    if (key === DEMO_STORE_KEY) {
      sessionStorage.removeItem(DEMO_STORE_KEY);
      return;
    }
    originalRemoveItem(key);
  };

  // 3. Conversion Modal Logic for gated features (Backup export/import)
  window.openDemoGate = function (featureName) {
    const modal = document.getElementById('etsy-demo-gate-modal');
    if (modal) {
      const title = document.getElementById('etsy-gate-modal-title');
      if (title && featureName) title.textContent = featureName;
      modal.classList.add('active');
    }
  };

  window.closeDemoGate = function () {
    const modal = document.getElementById('etsy-demo-gate-modal');
    if (modal) modal.classList.remove('active');
  };

  document.addEventListener('DOMContentLoaded', function () {
    const exportBtn = document.getElementById('btn-export-backup');
    if (exportBtn) {
      exportBtn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        window.openDemoGate('Data Export & Personal Backups');
      };
    }

    const restoreInput = document.getElementById('input-restore-backup');
    if (restoreInput) {
      restoreInput.parentElement.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        window.openDemoGate('Cloud/Local Backup Restoration');
      };
    }
  });
})();
