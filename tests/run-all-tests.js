const fs = require('fs');
const path = require('path');
const vm = require('vm');

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    totalPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    totalFailed++;
  }
}

console.log('================================================================');
console.log(' ADHD BUDGET PLANNER (EDITION 3) — INTEGRATED TEST RUNNER');
console.log('================================================================\n');

// 1. CoreCalculator
const enginePath = path.join(__dirname, '../js/core-calculator.js');
const engineCode = fs.readFileSync(enginePath, 'utf8');
const context = { console, Math, Date, setTimeout, clearTimeout };
vm.createContext(context);
vm.runInContext(engineCode + '; this.CoreCalculator = CoreCalculator || this.CoreCalculator;', context);
const Calculator = context.CoreCalculator;

console.log('--- SUITE 1: Financial Math & Currency ---');
assert(Calculator.parseToCents('780.00') === 78000, 'parseToCents decimal string');
assert(Calculator.parseToCents('$1,600.00') === 160000, 'parseToCents formatted currency');
assert(Calculator.parseToCents(null) === 0, 'parseToCents handles null');
assert(Calculator.formatCents(160000, 'USD') === '$1,600.00', 'formatCents USD formatted');
assert(Calculator.formatCents(8200, 'GBP') === '£82.00', 'formatCents GBP symbol');

console.log('\n--- SUITE 2: Safe-to-Spend Runway & Bills ---');
const testState = {
  checkingCents: 120000, // $1,200.00
  incomeCycle: 'biweekly',
  incomeAnchor: '2026-11-15',
  bills: [
    { id: 'b1', amountCents: 40000, dueDate: '2026-11-09', paid: false },
    { id: 'b2', amountCents: 20000, dueDate: '2026-11-20', paid: false } // After payday!
  ],
  transactions: [
    { id: 't1', date: '2026-11-01', amountCents: 1400 }
  ]
};

const safe = Calculator.calculateSafeToSpend(testState, '2026-11-01');
assert(safe.daysRunway === 14, 'Runway correctly computed as 14 days');
assert(safe.pendingBillsCents === 40000, 'Only pending bills before payday ($400) are reserved');
assert(safe.spendablePoolCents === 80000, 'Spendable pool is $1,200 - $400 = $800');
assert(safe.dailyQuotaCents === Math.floor(80000 / 14), 'Daily safe quota calculated');
assert(safe.safeToSpendTodayCents === Math.floor(80000 / 14) - 1400, 'Safe to spend deducts today spend');

console.log('\n--- SUITE 3: Debt Crusher Snowball & Avalanche ---');
const debts = [
  { balanceCents: 160000, minPaymentCents: 6000, interestRate: 19 },
  { balanceCents: 45000, minPaymentCents: 2500, interestRate: 25 }
];
const snowball = Calculator.calculateDebtPlan(debts, 5000, 'snowball');
const avalanche = Calculator.calculateDebtPlan(debts, 5000, 'avalanche');
assert(snowball.isDebtFree === true, 'Snowball simulation completes to zero debt');
assert(avalanche.isDebtFree === true, 'Avalanche simulation completes to zero debt');
assert(avalanche.totalInterestPaidCents <= snowball.totalInterestPaidCents, 'Avalanche pays less or equal interest');

console.log('\n--- SUITE 4: Impulse Vault 48-Hour Timer ---');
const now = Date.now();
const itemFresh = { parkedAt: now };
const itemCool = { parkedAt: now - 3600000 * 49 };
assert(Calculator.getVaultRemaining(itemFresh, now).isUnlocked === false, 'Fresh vault item is locked');
assert(Calculator.getVaultRemaining(itemFresh, now).remainingHours === 48, 'Fresh vault item has 48h left');
assert(Calculator.getVaultRemaining(itemCool, now).isUnlocked === true, 'Old vault item is unlocked after 48h');

console.log('\n--- SUITE 5: DOM & File Integrity ---');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert(html.includes('id="screen-today"'), 'HTML contains #screen-today');
assert(html.includes('id="screen-bills"'), 'HTML contains #screen-bills');
assert(html.includes('id="screen-vault"'), 'HTML contains #screen-vault');
assert(html.includes('id="screen-debt"'), 'HTML contains #screen-debt');
assert(html.includes('id="screen-notes"'), 'HTML contains #screen-notes');
assert(html.includes('id="screen-settings"'), 'HTML contains #screen-settings');
assert(html.includes('id="zombie-screen-overlay"'), 'HTML contains #zombie-screen-overlay');
assert(html.includes('id="modal-add-bill"'), 'HTML contains modal #modal-add-bill');
assert(html.includes('id="modal-add-vault"'), 'HTML contains modal #modal-add-vault');

// Verify service worker cached assets exist on disk
const swCode = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
const assetMatches = swCode.match(/'\.\/[^']+'/g);
if (assetMatches) {
  assetMatches.forEach(m => {
    const rel = m.replace(/^'\.\//, '').replace(/'$/, '');
    if (rel) {
      const assetPath = path.join(__dirname, '..', rel);
      assert(fs.existsSync(assetPath), `Cached asset exists on disk: ${rel}`);
    }
  });
}

console.log('\n================================================================');
console.log(` SUMMARY: ${totalPassed} Passed, ${totalFailed} Failed`);
console.log('================================================================\n');

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL ADHD BUDGET PLANNER (EDITION 3) TESTS PASSED!');
  process.exit(0);
}
