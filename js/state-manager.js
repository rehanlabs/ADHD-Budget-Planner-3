/**
 * ADHD Budget Planner - State Manager & Persistence (Edition 3)
 * Manages local browser storage, schema hydration, and backup imports/exports.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StateManager = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STORAGE_KEY = 'adhd_budget_store_v3';

  function createInitialState() {
    const inNineDays = new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 10);
    const inFourteenDays = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

    return {
      version: 3,
      profile: {
        currency: 'USD',
        theme: 'sage-harmony',
        soundEnabled: true
      },
      checkingCents: 160000, // $1,600.00
      incomeCycle: 'biweekly',
      incomeAnchor: inFourteenDays,
      quickSpends: [
        { id: 'qs-1', title: 'Morning Fuel', icon: '☕', amountCents: 600 },
        { id: 'qs-2', title: 'Online Essentials', icon: '📦', amountCents: 1850 },
        { id: 'qs-3', title: 'Fresh Groceries', icon: '🥦', amountCents: 4500 }
      ],
      livingCosts: [
        { id: 'lc-1', name: 'Housing & Rent', amountCents: 78000, dueDate: inNineDays, paid: false },
        { id: 'lc-2', name: 'Electricity & Wi-Fi', amountCents: 8200, dueDate: inNineDays, paid: false }
      ],
      cooldownHoldItems: [
        { id: 'ch-1', name: 'Ergonomic Desk Mat', amountCents: 4800, parkedAt: Date.now() - 3600000 * 20 }
      ],
      debts: [
        { id: 'd-1', name: 'Credit Card Balance', balanceCents: 195000, minPaymentCents: 7000, interestRate: 19.99 }
      ],
      transactions: [],
      notes: ''
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const fresh = createInitialState();
        saveState(fresh);
        return fresh;
      }
      const data = JSON.parse(raw);
      if (!data.profile) data.profile = { currency: 'USD', theme: 'sage-harmony', soundEnabled: true };
      if (!Array.isArray(data.livingCosts)) data.livingCosts = [];
      if (!Array.isArray(data.cooldownHoldItems)) data.cooldownHoldItems = [];
      if (!Array.isArray(data.debts)) data.debts = [];
      if (!Array.isArray(data.quickSpends)) data.quickSpends = [];
      if (!Array.isArray(data.transactions)) data.transactions = [];
      return data;
    } catch {
      return createInitialState();
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  function exportStateJSON(state) {
    return JSON.stringify(state, null, 2);
  }

  function importStateJSON(jsonStr) {
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed !== 'object' || parsed === null) throw new Error('Invalid backup data.');
    saveState(parsed);
    return parsed;
  }

  return {
    STORAGE_KEY,
    createInitialState,
    loadState,
    saveState,
    exportStateJSON,
    importStateJSON
  };
});
