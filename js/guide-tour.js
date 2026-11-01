/**
 * ADHD Budget Planner - Guided Tour Engine (Edition 3)
 * Gentle step-by-step introduction designed to eliminate financial anxiety.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GuideTour = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TOUR_PAGES = [
    {
      title: 'Welcome to Financial Calm 🌿',
      text: 'You don’t have to force your brain to fit into complex spreadsheets. ADHD Budget Planner automates the hard math so you always know where you stand.'
    },
    {
      title: '1. Safe to Spend Today',
      text: 'Look at the central progress dial. This is your safe daily spending allowance. All upcoming rent and bills are already set aside.'
    },
    {
      title: '2. 1-Tap Quick Spends',
      text: 'Log routine coffee, takeout, or groceries with a single tap. Zero friction, zero manual typing.'
    },
    {
      title: '3. 48-Hour Impulse Vault',
      text: 'Whenever an impulsive purchase urge strikes, park it in the Vault. In 48 hours, the dopamine wave fades and you can decide calmly.'
    },
    {
      title: '4. Zombie Mode',
      text: 'On overwhelmed or burnout days, tap Zombie Mode in the top bar. Everything disappears except one comforting answer: "Can I afford this right now?"'
    }
  ];

  function startTour(onComplete) {
    let current = 0;

    const overlay = document.createElement('div');
    overlay.className = 'harmony-tour-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:999;display:flex;align-items:center;justify-content:center;padding:16px;';

    const modal = document.createElement('div');
    modal.style.cssText = 'background:#182a24;border:1px solid #14b8a6;border-radius:22px;max-width:440px;width:100%;padding:26px;color:#f2fbf7;box-shadow:0 10px 40px rgba(0,0,0,0.5);font-family:sans-serif;text-align:left;';

    function render() {
      const page = TOUR_PAGES[current];
      modal.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
          <div style="width:42px;height:42px;border-radius:50%;background:#213a32;border:1px solid #14b8a6;display:flex;align-items:center;justify-content:center;font-size:20px;">👩‍💼</div>
          <div>
            <div style="font-size:11px;font-weight:700;color:#14b8a6;text-transform:uppercase;letter-spacing:0.08em;">ADHD Budget Assistant</div>
            <div style="font-size:17px;font-weight:800;color:#fde047;">${page.title}</div>
          </div>
        </div>
        <p style="font-size:14px;line-height:1.6;color:#a7f3d0;margin-bottom:24px;">${page.text}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;color:#6ee7b7;">Step ${current + 1} of ${TOUR_PAGES.length}</span>
          <div style="display:flex;gap:8px;">
            <button id="tour-skip-btn" style="background:none;border:none;color:#6ee7b7;font-size:12px;cursor:pointer;padding:6px 10px;">Skip</button>
            <button id="tour-next-btn" style="background:#14b8a6;color:#fff;border:none;font-weight:700;font-size:12px;padding:8px 16px;border-radius:99px;cursor:pointer;">${current === TOUR_PAGES.length - 1 ? 'Start Budgeting 🌿' : 'Next ➔'}</button>
          </div>
        </div>
      `;

      modal.querySelector('#tour-skip-btn').onclick = () => {
        document.body.removeChild(overlay);
        if (typeof onComplete === 'function') onComplete();
      };

      modal.querySelector('#tour-next-btn').onclick = () => {
        current++;
        if (current < TOUR_PAGES.length) {
          render();
        } else {
          document.body.removeChild(overlay);
          if (typeof onComplete === 'function') onComplete();
        }
      };
    }

    render();
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  return {
    startTour
  };
});
