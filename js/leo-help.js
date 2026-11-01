/**
 * ADHD Budget Planner (Edition 3) - Leo's Mindful Contextual Help & Sanctuary System
 * 4-tier low-cognitive-load mindful guides for each screen, card, and ADHD feature.
 */

(function (global) {
  'use strict';

  const LeoHelp = {
    'allowance.radial': {
      title: 'Mindful Daily Allowance & Dial',
      core: 'Your single concentric sanctuary number. It tells you what is peacefully yours to spend today without jeopardizing shelter, utilities, or debts.',
      action: 'Check the center dial before buying discretionary items. When you make a purchase, tap a mindful chip or record it.',
      brain: 'Neurotypical budgeting with 15 envelopes triggers dopamine depletion and panic. One serene dial provides immediate clarity with zero cognitive friction.',
      wisdom: 'If you spend more today, breathe gently: tomorrow absorbs the difference evenly across your remaining days. No day is ever ruined.'
    },
    'allowance.inflow': {
      title: 'Cash Inflow Stream & Runway',
      core: 'The visual horizon showing the gentle rhythm of your next income arrival and your remaining days.',
      action: 'Tap [Adjust Inflow] to anchor your next paycheck date, frequency cadence, and cash reservoir.',
      brain: 'Time blindness makes paydays feel distant and unreal. The visual runway transforms time into a tangible, grounding bar.',
      wisdom: 'If your paycheck lands on a weekend, turn on [Weekend Early] so funds are safely anchored to Friday.'
    },
    'allowance.intentions': {
      title: 'Three Daily Mindful Intentions',
      core: 'A quiet, bite-sized daily intention list with a strict maximum of 3 small financial actions.',
      action: 'Select one intention for today. When completed, tap it to clear your mind.',
      brain: 'Long to-do lists trigger dopamine freezing and avoidance. Three small intentions is an achievable horizon your mind can embrace.',
      wisdom: 'On quiet days with no pending obligations, intentions encourage a mindful pause and celebrate financial peace.'
    },
    'allowance.quickchip': {
      title: 'Mindful One-Tap Spend Chips',
      core: 'Calming preset chips for high-frequency everyday treats (tea, snacks, fuel, lunch).',
      action: 'Tap a chip immediately after spending to record it in one gentle touch.',
      brain: 'Receipt scanning and detailed category spreadsheets create guilt and procrastination. One-tap chips make awareness effortless.',
      wisdom: 'For unique expenses, tap the floating Terracotta Seed FAB (+) at the bottom anytime.'
    },
    'fog.mode': {
      title: 'Fog Mode (Sensory Sanctuary)',
      core: 'A sensory-friendly, low-stimulus emergency screen designed for migraine, brain fog, or low-spoons days.',
      action: 'Toggle Fog Mode in the top bar when the full planner feels overwhelming. Ask simply: "Can I afford this right now?"',
      brain: 'Sensory overload causes decision paralysis. Fog Mode cuts away 90% of visual stimuli so you stay grounded without stress.',
      wisdom: 'All your bills, runways, and allocations continue operating silently and safely behind the scenes.'
    },
    'living.costs': {
      title: 'Living Commitments (Protected Dues)',
      core: 'Your fixed living dues (shelter, electricity, subscriptions) arranged chronologically by their next due date.',
      action: 'When a bill clears your bank account, tap [Mark Settled]. It will automatically schedule its next cycle.',
      brain: 'Alphabetical lists obscure urgency. Chronological arrangement reflects the natural flow of time and resources.',
      wisdom: 'Bills due after your next payday are hidden from today’s hold pool—they will be funded by that future paycheck.'
    },
    'living.smoothing': {
      title: 'Seasonal Expense Smoothing',
      core: 'A peaceful averaging tool that levels out fluctuating seasonal expenses (like winter heating or summer cooling).',
      action: 'Enter what you paid over high and low seasons. Tap [Apply Average] to establish a calm, predictable monthly reserve.',
      brain: 'Unpredictable bill spikes provoke adrenaline spikes. Budgeting the true average maintains serene cashflow all year.',
      wisdom: 'Adding a small $10–$20 grace padding to seasonal utilities prevents any unpleasant surprises.'
    },
    'cooldown.patience': {
      title: 'Cooldown Garden (48h Desire Pause)',
      core: 'A mindful holding garden for sudden retail impulses and online shopping urges.',
      action: 'Instead of buying immediately, tap [+ Seed Urge]. Plant the item and price, and let the 48-hour timer run.',
      brain: 'Strict denial triggers dopamine deprivation and rebellion. A 48-hour pause satisfies your brain without the regret of impulse spending.',
      wisdom: 'Over 82% of impulsive urges dissolve peacefully once 48 hours pass. If you still desire it afterwards, purchase it with complete peace of mind.'
    },
    'freedom.ladder': {
      title: 'Freedom Ladder (Debt Dissolution)',
      core: 'A calm mathematical progression calculating your debt-free date using Snowball or Avalanche methods.',
      action: 'Toggle between Snowball (smallest balance first) and Avalanche (highest APR first) to discover your ideal rhythm.',
      brain: 'Snowball offers quick, tangible psychological victories, releasing dopamine that keeps your spirit motivated.',
      wisdom: 'For ADHD brains, Snowball is almost always the gentlest path because visible progress nurtures hope.'
    },
    'minddump.zen': {
      title: 'Mindful Thought Stream (Scratchpad)',
      core: 'A serene, distraction-free space to gently release financial anxieties, ideas, or upcoming purchase plans.',
      action: 'Write down any financial thought as it arises so your working memory can rest.',
      brain: 'ADHD brains often replay financial anxieties in loops. Writing them down immediately gives your mind permission to let go.',
      wisdom: 'Your notes auto-save locally to your device with every keystroke—completely private.'
    },
    'sanctuary.grace': {
      title: 'Grace Cushion (Self-Compassion Buffer)',
      core: 'A modest $25–$100 safety pocket safeguarded from your daily spending allowance.',
      action: 'Set your grace cushion in Sanctuary Setup. Minor miscalculations or parking fees are absorbed without stress.',
      brain: 'Rigid financial plans break when a minor error happens. The Grace Cushion provides elasticity and eliminates shame.',
      wisdom: 'Begin with a $50 cushion. Allow yourself to be human; perfection is not required.'
    },
    'sanctuary.offline': {
      title: 'Sovereign Offline Sanctuary & Privacy',
      core: 'Your finances are kept strictly inside your own device. Zero cloud databases, zero telemetry, and zero tracking.',
      action: 'Add this web app to your mobile Home Screen and export a monthly backup with [Download Sanctuary Backup].',
      brain: 'No third-party bank connections, no subscriptions, and complete peace of mind regarding your privacy.',
      wisdom: 'Installing to your mobile Home Screen immunizes your local storage from Safari’s 7-day browser cache purge.'
    }
  };

  global.LeoHelp = LeoHelp;
})(typeof window !== 'undefined' ? window : this);
