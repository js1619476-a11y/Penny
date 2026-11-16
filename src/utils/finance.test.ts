import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAllTimeBalance,
  computeBudgetProgress,
  computeCategoryBreakdown,
  computeGoalProgress,
  computeMonthlySummary,
  computeSixMonthTrend,
  filterTransactions,
  generatePlainInsights,
  transactionsToCsv,
  validateBudgetInput,
  validateGoalInput,
  validateTransactionInput,
} from './finance';
import type { Budget, SavingsGoal, Transaction } from '../types/finance';

const SAMPLE_TXS: Transaction[] = [
  {
    id: 't1',
    description: 'Paycheck',
    amount: 3000,
    type: 'income',
    category: 'salary',
    date: '2026-11-01',
  },
  {
    id: 't2',
    description: 'Trader Market',
    amount: 120.5,
    type: 'expense',
    category: 'groceries',
    date: '2026-11-05',
    note: 'Weekly groceries, apples & bread',
  },
  {
    id: 't3',
    description: 'Corner Cafe',
    amount: 85,
    type: 'expense',
    category: 'dining',
    date: '2026-11-10',
  },
  {
    id: 't4',
    description: 'October Rent',
    amount: 1200,
    type: 'expense',
    category: 'housing',
    date: '2026-10-01',
  },
];

test('computeMonthlySummary aggregates income, expenses, and savings rate accurately', () => {
  const nov = computeMonthlySummary(SAMPLE_TXS, '2026-11');
  assert.equal(nov.totalIncome, 3000);
  assert.equal(nov.totalExpenses, 205.5);
  assert.equal(nov.netSavings, 2794.5);
  assert.equal(nov.savingsRate, 93);
  assert.equal(nov.transactionCount, 3);
});

test('computeMonthlySummary handles zero income without NaN', () => {
  const oct = computeMonthlySummary(SAMPLE_TXS, '2026-10');
  assert.equal(oct.totalIncome, 0);
  assert.equal(oct.totalExpenses, 1200);
  assert.equal(oct.netSavings, -1200);
  assert.equal(oct.savingsRate, 0);
});

test('computeAllTimeBalance sums income minus expenses across all months', () => {
  const balance = computeAllTimeBalance(SAMPLE_TXS);
  assert.equal(balance, 1594.5);
});

test('filterTransactions filters by month, type, category, and search query', () => {
  const bySearch = filterTransactions(SAMPLE_TXS, {
    monthKey: '2026-11',
    search: 'apples',
    type: 'all',
    category: 'all',
  });
  assert.equal(bySearch.length, 1);
  assert.equal(bySearch[0].id, 't2');

  const byType = filterTransactions(SAMPLE_TXS, {
    monthKey: '2026-11',
    search: '',
    type: 'income',
    category: 'all',
  });
  assert.equal(byType.length, 1);
  assert.equal(byType[0].id, 't1');

  const withSameDayPrepended = filterTransactions(
    [
      {
        id: 'a-new-entry',
        description: 'Evening Tea',
        amount: 5,
        type: 'expense',
        category: 'dining',
        date: '2026-11-10',
        createdAtMs: 2000,
      },
      ...SAMPLE_TXS.map((t) => ({ ...t, createdAtMs: 1000 })),
    ],
    {
      monthKey: '2026-11',
      search: '',
      type: 'all',
      category: 'all',
    }
  );
  assert.equal(withSameDayPrepended[0].id, 'a-new-entry');
});

test('computeCategoryBreakdown sorts descending by amount and computes percentages', () => {
  const breakdown = computeCategoryBreakdown(SAMPLE_TXS, '2026-11');
  assert.equal(breakdown.length, 2);
  assert.equal(breakdown[0].category, 'groceries');
  assert.equal(breakdown[0].amount, 120.5);
  assert.equal(breakdown[0].percentage, 59);
  assert.equal(breakdown[1].category, 'dining');
});

test('computeBudgetProgress flags on-track, near-limit, and over-budget statuses', () => {
  const budgets: Budget[] = [
    { id: 'b1', category: 'groceries', limit: 200 },
    { id: 'b2', category: 'dining', limit: 95 },
    { id: 'b3', category: 'shopping', limit: 50 },
  ];
  const txs: Transaction[] = [
    ...SAMPLE_TXS,
    {
      id: 't5',
      description: 'Jacket',
      amount: 75,
      type: 'expense',
      category: 'shopping',
      date: '2026-11-12',
    },
  ];

  const items = computeBudgetProgress(budgets, txs, '2026-11', 16);
  const groceries = items.find((i) => i.budget.id === 'b1')!;
  const dining = items.find((i) => i.budget.id === 'b2')!;
  const shopping = items.find((i) => i.budget.id === 'b3')!;

  assert.equal(groceries.status, 'on-track');
  assert.equal(groceries.remaining, 79.5);
  assert.equal(dining.status, 'near-limit');
  assert.equal(shopping.status, 'over-budget');
  assert.equal(shopping.remaining, -25);
});

test('computeGoalProgress clamps percentComplete at 100 and computes remaining amount', () => {
  const goal: SavingsGoal = {
    id: 'g1',
    name: 'Emergency',
    targetAmount: 1000,
    currentAmount: 1150,
    targetDate: '2027-01-01',
    color: '#0D9488',
  };
  const progress = computeGoalProgress(goal);
  assert.equal(progress.percentComplete, 100);
  assert.equal(progress.remainingAmount, 0);
  assert.equal(progress.isCompleted, true);
});

test('computeSixMonthTrend returns 6 sequential months ending on referenceMonthKey', () => {
  const trend = computeSixMonthTrend(SAMPLE_TXS, '2026-11');
  assert.equal(trend.length, 6);
  assert.equal(trend[0].monthKey, '2026-06');
  assert.equal(trend[5].monthKey, '2026-11');
  assert.equal(trend[5].income, 3000);
  assert.equal(trend[4].expenses, 1200);
});

test('transactionsToCsv escapes commas and quotes properly', () => {
  const csv = transactionsToCsv(SAMPLE_TXS.slice(1, 2));
  const lines = csv.split('\n');
  assert.equal(lines.length, 2);
  assert.ok(lines[1].includes('"Weekly groceries, apples & bread"'));
});

test('generatePlainInsights produces friendly actionable items', () => {
  const budgets: Budget[] = [{ id: 'b1', category: 'groceries', limit: 100 }];
  const goals: SavingsGoal[] = [
    {
      id: 'g1',
      name: 'Trip',
      targetAmount: 500,
      currentAmount: 250,
      targetDate: '2027-02-01',
      color: '#7C3AED',
    },
  ];
  const insights = generatePlainInsights(SAMPLE_TXS, budgets, goals, '2026-11', 'USD');
  assert.ok(insights.length >= 3);
  assert.ok(insights.some((i) => i.id === 'insight-budget-over'));
});

test('validation helpers reject empty or invalid inputs cleanly', () => {
  const txErrors = validateTransactionInput({
    description: '   ',
    amount: '-5',
    type: 'expense',
    category: 'groceries',
    date: 'bad-date',
  });
  assert.ok(txErrors.description);
  assert.ok(txErrors.amount);
  assert.ok(txErrors.date);

  const budgetErrors = validateBudgetInput({ category: '', limit: '0' });
  assert.ok(budgetErrors.category);
  assert.ok(budgetErrors.limit);

  const goalErrors = validateGoalInput({
    name: '',
    targetAmount: '0',
    currentAmount: '-10',
    targetDate: '',
  });
  assert.ok(goalErrors.name);
  assert.ok(goalErrors.targetAmount);
  assert.ok(goalErrors.currentAmount);
  assert.ok(goalErrors.targetDate);
});
