import test from 'node:test';
import assert from 'node:assert/strict';
import {
  contributeLocalGoal,
  createEmptyLocalState,
  parseLocalFinanceState,
  removeLocalBudget,
  removeLocalGoal,
  removeLocalTransaction,
  upsertLocalBudget,
  upsertLocalGoal,
  upsertLocalTransaction,
} from './localStore';

test('parseLocalFinanceState handles null, invalid JSON, and malformed items cleanly', () => {
  const empty = parseLocalFinanceState(null);
  assert.deepEqual(empty, createEmptyLocalState());

  const corrupt = parseLocalFinanceState('{not-valid-json');
  assert.deepEqual(corrupt, createEmptyLocalState());

  const filtered = parseLocalFinanceState(
    JSON.stringify({
      currency: 'GBP',
      transactions: [
        {
          id: 'tx1',
          description: 'Groceries',
          amount: 42.5,
          type: 'expense',
          category: 'groceries',
          date: '2026-11-17',
        },
        {
          id: 'tx_bad',
          description: '',
          amount: -10,
          type: 'expense',
          category: 'groceries',
          date: 'bad-date',
        },
      ],
      budgets: [
        { id: 'b1', category: 'groceries', limit: 300 },
        { id: 'b_bad', category: 'unknown', limit: 100 },
      ],
      goals: [
        {
          id: 'g1',
          name: 'Rainy Day',
          targetAmount: 1000,
          currentAmount: 250,
          targetDate: '2027-01-01',
          color: '#0D9488',
        },
      ],
    })
  );

  assert.equal(filtered.currency, 'GBP');
  assert.equal(filtered.transactions.length, 1);
  assert.equal(filtered.transactions[0].description, 'Groceries');
  assert.equal(filtered.budgets.length, 1);
  assert.equal(filtered.goals.length, 1);
});

test('local transactions, budgets, and goals support full CRUD and goal contributions', () => {
  let state = createEmptyLocalState();

  state = upsertLocalTransaction(
    state,
    {
      description: 'Coffee',
      amount: 4.75,
      type: 'expense',
      category: 'dining',
      date: '2026-11-17',
    },
    undefined,
    1000
  );
  assert.equal(state.transactions.length, 1);
  const txId = state.transactions[0].id;

  state = upsertLocalTransaction(
    state,
    {
      description: 'Morning Coffee',
      amount: 5.25,
      type: 'expense',
      category: 'dining',
      date: '2026-11-17',
    },
    txId,
    2000
  );
  assert.equal(state.transactions[0].description, 'Morning Coffee');
  assert.equal(state.transactions[0].amount, 5.25);

  state = upsertLocalBudget(state, 'dining', 150);
  assert.equal(state.budgets.length, 1);
  const budgetId = state.budgets[0].id;

  state = upsertLocalGoal(state, {
    name: 'Laptop Fund',
    targetAmount: 1200,
    currentAmount: 200,
    targetDate: '2027-06-01',
    color: '#0D9488',
  });
  assert.equal(state.goals.length, 1);
  const goalId = state.goals[0].id;

  state = contributeLocalGoal(state, goalId, 100, true, '2026-11-17', 3000);
  assert.equal(state.goals[0].currentAmount, 300);
  assert.equal(state.transactions.length, 2);
  assert.equal(state.transactions[0].category, 'savings');

  state = removeLocalTransaction(state, txId);
  assert.equal(state.transactions.length, 1);
  state = removeLocalBudget(state, budgetId);
  assert.equal(state.budgets.length, 0);
  state = removeLocalGoal(state, goalId);
  assert.equal(state.goals.length, 0);
});
