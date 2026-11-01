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
console.log(' ADHD BUDGET PLANNER (EDITION 3) — INTEGRATED QA TEST RUNNER');
console.log('================================================================\n');

// 1. CoreCalculator
const calcPath = path.join(__dirname, '../js/core-calculator.js');
const calcCode = fs.readFileSync(calcPath, 'utf8');
const context = { console, Math, Date, setTimeout, clearTimeout };
vm.createContext(context);
vm.runInContext(calcCode + '; this.CoreCalculator = CoreCalculator || this.CoreCalculator;', context);
const Calculator = context.CoreCalculator;

console.log('--- SUITE 1: Financial Math & Currency Edge Cases ---');
assert(Calculator.parseToCents('950.00') === 95000, 'parseToCents decimal string');
assert(Calculator.parseToCents('$2,150.00') === 215000, 'parseToCents formatted currency');
assert(Calculator.parseToCents(null) === 0, 'parseToCents handles null');
assert(Calculator.parseToCents(undefined) === 0, 'parseToCents handles undefined');
assert(Calculator.parseToCents('') === 0, 'parseToCents handles empty string');
assert(Calculator.parseToCents('-75.50') === -7550, 'parseToCents handles negative value');
assert(Calculator.formatCents(215000, 'USD') === '$2,150.00', 'formatCents USD formatted');
assert(Calculator.formatCents(8200, 'GBP') === '£82.00', 'formatCents GBP symbol');
assert(Calculator.formatCents(12400, 'EUR') === '€124.00', 'formatCents EUR symbol');
assert(Calculator.formatCents(-3500, 'USD') === '-$35.00', 'formatCents negative amount');

console.log('\n--- SUITE 2: Safe-to-Spend Runway & Living Costs ---');
const testState = {
  checkingCents: 120000, // $1,200.00
  incomeCycle: 'biweekly',
  incomeAnchor: '2026-11-13', // Friday
  livingCosts: [
    { id: 'b1', amountCents: 40000, dueDate: '2026-11-05', paid: false },
    { id: 'b2', amountCents: 20000, dueDate: '2026-11-20', paid: false } // After payday
  ],
  transactions: []
};

const safe = Calculator.calculateSafeToSpend(testState, '2026-10-30');
assert(safe.daysRunway === 14, 'Runway correctly computed as 14 days');
assert(safe.pendingBillsCents === 40000, 'Only pending bills before payday ($400) are reserved');
assert(safe.spendablePoolCents === 80000, 'Spendable pool is $1,200 - $400 = $800');
assert(safe.dailyQuotaCents === Math.floor(80000 / 14), 'Daily safe quota calculated');

// Add transaction today
testState.transactions.push({ id: 't1', date: '2026-10-30', amountCents: 1400 });
const safeAfterSpend = Calculator.calculateSafeToSpend(testState, '2026-10-30');
assert(safeAfterSpend.safeToSpendTodayCents === Math.floor(80000 / 14) - 1400, 'Safe to spend deducts today spend');

console.log('\n--- SUITE 3: Anti-Double-Counting on Same-Day Balance Update ---');
const T0 = 1700000000000;
const T1 = T0 + 1000 * 60 * 30; // 30 min later spend
const T2 = T0 + 1000 * 60 * 60; // 1 hour later balance update

const stateSync = {
  checkingCents: 120000,
  balanceUpdatedAt: T0,
  incomeCycle: 'biweekly',
  incomeAnchor: '2026-11-13',
  livingCosts: [],
  transactions: []
};

// 1. Initial pool is $1,200
const s0 = Calculator.calculateSafeToSpend(stateSync, '2026-10-30');
assert(s0.spendablePoolCents === 120000, 'Initial spendable pool is $1,200');

// 2. User spends $50 at T1
stateSync.transactions.push({ id: 'tx-1', timestamp: T1, date: '2026-10-30', amountCents: 5000 });
const s1 = Calculator.calculateSafeToSpend(stateSync, '2026-10-30');
assert(s1.safeToSpendTodayCents === s0.dailyQuotaCents - 5000, 'Today safe drops by $50 after transaction');

// 3. User checks bank, sees $1,150, and updates checking balance at T2
stateSync.checkingCents = 115000;
stateSync.balanceUpdatedAt = T2;
const s2 = Calculator.calculateSafeToSpend(stateSync, '2026-10-30');
assert(s2.spendablePoolCents === 115000, 'Spendable pool remains $1,150 (NO double deduction)');

console.log('\n--- SUITE 4: Payday Shift (Weekend Adjust & Leap Year) ---');
assert(Calculator.adjustWeekendEarly('2026-11-14') === '2026-11-13', 'Saturday payday shifts to Friday');
assert(Calculator.adjustWeekendEarly('2026-11-15') === '2026-11-13', 'Sunday payday shifts to Friday');
assert(Calculator.adjustWeekendEarly('2026-11-16') === '2026-11-16', 'Monday payday remains Monday');
assert(Calculator.addDays('2028-02-28', 1) === '2028-02-29', 'Leap year handles Feb 28 -> Feb 29');
assert(Calculator.addDays('2028-02-29', 1) === '2028-03-01', 'Leap year handles Feb 29 -> Mar 01');

console.log('\n--- SUITE 5: Debt Payoff Snowball & Avalanche ---');
const debts = [
  { balanceCents: 160000, minPaymentCents: 6000, interestRate: 19 },
  { balanceCents: 45000, minPaymentCents: 2500, interestRate: 25 }
];
const snowball = Calculator.calculateDebtPlan(debts, 5000, 'snowball');
const avalanche = Calculator.calculateDebtPlan(debts, 5000, 'avalanche');
assert(snowball.isDebtFree === true, 'Snowball simulation completes to zero debt');
assert(avalanche.isDebtFree === true, 'Avalanche simulation completes to zero debt');
assert(avalanche.totalInterestPaidCents <= snowball.totalInterestPaidCents, 'Avalanche pays less or equal interest');

console.log('\n--- SUITE 6: Cooldown Hold 48-Hour Timer ---');
const now = Date.now();
const itemFresh = { parkedAt: now };
const itemCool = { parkedAt: now - 3600000 * 49 };
assert(Calculator.getVaultRemaining(itemFresh, now).isUnlocked === false, 'Fresh cooldown item is locked');
assert(Calculator.getVaultRemaining(itemFresh, now).remainingHours === 48, 'Fresh cooldown item has 48h left');
assert(Calculator.getVaultRemaining(itemCool, now).isUnlocked === true, 'Old cooldown item is unlocked after 48h');

console.log('\n--- SUITE 7: DOM & Text Hygiene ---');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert(html.includes('id="screen-allowance"'), 'HTML contains #screen-allowance');
assert(html.includes('id="screen-living"'), 'HTML contains #screen-living');
assert(html.includes('id="screen-cooldown"'), 'HTML contains #screen-cooldown');
assert(html.includes('id="screen-freedom"'), 'HTML contains #screen-freedom');
assert(html.includes('id="screen-minddump"'), 'HTML contains #screen-minddump');
assert(html.includes('id="screen-config"'), 'HTML contains #screen-config');
assert(html.includes('id="fog-mode-overlay"'), 'HTML contains #fog-mode-overlay');
assert(html.includes('id="modal-add-living"'), 'HTML contains modal #modal-add-living');
assert(html.includes('id="modal-add-cooldown"'), 'HTML contains modal #modal-add-cooldown');
assert(html.includes('id="modal-leo-help"'), 'HTML contains modal #modal-leo-help');
assert(html.includes('class="zen-help-badge"'), 'HTML contains .zen-help-badge buttons');
assert(html.includes('src="./js/leo-help.js"'), 'HTML references leo-help.js');

// Hygiene check
assert(!html.includes('NaN'), 'HTML contains no literal NaN text');
assert(!html.includes('undefined'), 'HTML contains no literal undefined text');
assert(!html.includes('[object Object]'), 'HTML contains no literal [object Object] text');
assert(!html.includes('Lorem ipsum'), 'HTML contains no Lorem ipsum text');
assert(!html.includes('TODO'), 'HTML contains no TODO comments in client markup');

console.log('\n--- SUITE 8: Service Worker Cache Asset Integrity ---');
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
  console.log('🎉 ALL ADHD BUDGET PLANNER (EDITION 3) QA TESTS PASSED!');
  process.exit(0);
}
