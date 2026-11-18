import { CATEGORIES } from '../data/categories';
import type {
  Budget,
  CategoryId,
  CurrencyCode,
  SavingsGoal,
  Transaction,
} from '../types/finance';
import { roundMoney } from './finance';

export const LOCAL_FINANCE_STORAGE_KEY = 'penny_public_device_v1';
export const GUEST_MODE_FLAG_KEY = 'penny_guest_active';

export interface LocalFinanceState {
  currency: CurrencyCode;
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
}

export function createEmptyLocalState(): LocalFinanceState {
  return {
    currency: 'USD',
    transactions: [],
    budgets: [],
    goals: [],
  };
}

function generateLocalId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`;
}

function isCurrencyCode(val: unknown): val is CurrencyCode {
  return val === 'USD' || val === 'GBP' || val === 'EUR';
}

function isValidCategoryId(val: unknown): val is CategoryId {
  return typeof val === 'string' && val in CATEGORIES;
}

export function parseLocalFinanceState(raw: string | null): LocalFinanceState {
  if (!raw) return createEmptyLocalState();
  try {
    const parsed = JSON.parse(raw) as Partial<LocalFinanceState>;
    const currency: CurrencyCode = isCurrencyCode(parsed?.currency)
      ? parsed.currency
      : 'USD';

    const transactions: Transaction[] = Array.isArray(parsed?.transactions)
      ? parsed.transactions
          .filter(
            (tx): tx is Transaction =>
              Boolean(tx) &&
              typeof tx.id === 'string' &&
              typeof tx.description === 'string' &&
              tx.description.trim().length > 0 &&
              typeof tx.amount === 'number' &&
              Number.isFinite(tx.amount) &&
              tx.amount > 0 &&
              (tx.type === 'income' || tx.type === 'expense') &&
              isValidCategoryId(tx.category) &&
              typeof tx.date === 'string' &&
              /^\d{4}-\d{2}-\d{2}$/.test(tx.date)
          )
          .map((tx) => ({
            id: tx.id,
            description: tx.description.trim().slice(0, 120),
            amount: roundMoney(tx.amount),
            type: tx.type,
            category: tx.category,
            date: tx.date,
            note: typeof tx.note === 'string' && tx.note.trim() ? tx.note.trim().slice(0, 240) : undefined,
            createdAtMs: typeof tx.createdAtMs === 'number' ? tx.createdAtMs : 0,
          }))
      : [];

    const budgets: Budget[] = Array.isArray(parsed?.budgets)
      ? parsed.budgets
          .filter(
            (b): b is Budget =>
              Boolean(b) &&
              typeof b.id === 'string' &&
              isValidCategoryId(b.category) &&
              typeof b.limit === 'number' &&
              Number.isFinite(b.limit) &&
              b.limit > 0
          )
          .map((b) => ({
            id: b.id,
            category: b.category,
            limit: roundMoney(b.limit),
          }))
      : [];

    const goals: SavingsGoal[] = Array.isArray(parsed?.goals)
      ? parsed.goals
          .filter(
            (g): g is SavingsGoal =>
              Boolean(g) &&
              typeof g.id === 'string' &&
              typeof g.name === 'string' &&
              g.name.trim().length > 0 &&
              typeof g.targetAmount === 'number' &&
              Number.isFinite(g.targetAmount) &&
              g.targetAmount > 0 &&
              typeof g.currentAmount === 'number' &&
              Number.isFinite(g.currentAmount) &&
              g.currentAmount >= 0 &&
              typeof g.targetDate === 'string' &&
              /^\d{4}-\d{2}-\d{2}$/.test(g.targetDate)
          )
          .map((g) => ({
            id: g.id,
            name: g.name.trim().slice(0, 100),
            targetAmount: roundMoney(g.targetAmount),
            currentAmount: roundMoney(g.currentAmount),
            targetDate: g.targetDate,
            note: typeof g.note === 'string' && g.note.trim() ? g.note.trim().slice(0, 240) : undefined,
            color: typeof g.color === 'string' && g.color ? g.color : '#0D9488',
          }))
      : [];

    return { currency, transactions, budgets, goals };
  } catch {
    return createEmptyLocalState();
  }
}

export function upsertLocalTransaction(
  state: LocalFinanceState,
  payload: Omit<Transaction, 'id' | 'createdAtMs'>,
  existingId?: string,
  nowMs: number = Date.now()
): LocalFinanceState {
  const sanitizedDesc = payload.description.trim().slice(0, 120);
  const sanitizedNote = payload.note ? payload.note.trim().slice(0, 240) : '';
  const normalized: Transaction = {
    id: existingId || generateLocalId('tx'),
    description: sanitizedDesc,
    amount: roundMoney(payload.amount),
    type: payload.type,
    category: payload.category,
    date: payload.date,
    note: sanitizedNote || undefined,
    createdAtMs: nowMs,
  };

  const nextTransactions = existingId
    ? state.transactions.map((tx) =>
        tx.id === existingId
          ? { ...normalized, createdAtMs: tx.createdAtMs ?? nowMs }
          : tx
      )
    : [normalized, ...state.transactions];

  return {
    ...state,
    transactions: nextTransactions,
  };
}

export function removeLocalTransaction(
  state: LocalFinanceState,
  transactionId: string
): LocalFinanceState {
  return {
    ...state,
    transactions: state.transactions.filter((tx) => tx.id !== transactionId),
  };
}

export function upsertLocalBudget(
  state: LocalFinanceState,
  category: CategoryId,
  limit: number,
  existingId?: string
): LocalFinanceState {
  const normalizedLimit = roundMoney(limit);
  if (existingId) {
    return {
      ...state,
      budgets: state.budgets.map((b) =>
        b.id === existingId ? { ...b, category, limit: normalizedLimit } : b
      ),
    };
  }
  const nextBudget: Budget = {
    id: generateLocalId('b'),
    category,
    limit: normalizedLimit,
  };
  return {
    ...state,
    budgets: [...state.budgets, nextBudget],
  };
}

export function removeLocalBudget(
  state: LocalFinanceState,
  budgetId: string
): LocalFinanceState {
  return {
    ...state,
    budgets: state.budgets.filter((b) => b.id !== budgetId),
  };
}

export function upsertLocalGoal(
  state: LocalFinanceState,
  payload: Omit<SavingsGoal, 'id'>,
  existingId?: string
): LocalFinanceState {
  const normalized: SavingsGoal = {
    id: existingId || generateLocalId('g'),
    name: payload.name.trim().slice(0, 100),
    targetAmount: roundMoney(payload.targetAmount),
    currentAmount: roundMoney(payload.currentAmount),
    targetDate: payload.targetDate,
    note: payload.note?.trim() ? payload.note.trim().slice(0, 240) : undefined,
    color: payload.color || '#0D9488',
  };

  return {
    ...state,
    goals: existingId
      ? state.goals.map((g) => (g.id === existingId ? normalized : g))
      : [...state.goals, normalized],
  };
}

export function removeLocalGoal(
  state: LocalFinanceState,
  goalId: string
): LocalFinanceState {
  return {
    ...state,
    goals: state.goals.filter((g) => g.id !== goalId),
  };
}

export function contributeLocalGoal(
  state: LocalFinanceState,
  goalId: string,
  amount: number,
  alsoLogTransaction: boolean,
  todayDate: string,
  nowMs: number = Date.now()
): LocalFinanceState {
  const target = state.goals.find((g) => g.id === goalId);
  if (!target) return state;

  const updatedGoals = state.goals.map((g) =>
    g.id === goalId
      ? { ...g, currentAmount: roundMoney(g.currentAmount + amount) }
      : g
  );

  if (!alsoLogTransaction) {
    return { ...state, goals: updatedGoals };
  }

  const tx: Transaction = {
    id: generateLocalId('tx_goal'),
    description: `Saved for ${target.name}`.slice(0, 120),
    amount: roundMoney(amount),
    type: 'expense',
    category: 'savings',
    date: todayDate,
    note: 'Goal contribution',
    createdAtMs: nowMs,
  };

  return {
    ...state,
    goals: updatedGoals,
    transactions: [tx, ...state.transactions],
  };
}

export function loadLocalFinanceState(): LocalFinanceState {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return createEmptyLocalState();
    }
    return parseLocalFinanceState(window.localStorage.getItem(LOCAL_FINANCE_STORAGE_KEY));
  } catch {
    return createEmptyLocalState();
  }
}

export function saveLocalFinanceState(state: LocalFinanceState): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(LOCAL_FINANCE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota or private-mode restriction errors cleanly
  }
}

export function readGuestModeFlag(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    return window.localStorage.getItem(GUEST_MODE_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeGuestModeFlag(active: boolean): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (active) {
      window.localStorage.setItem(GUEST_MODE_FLAG_KEY, '1');
    } else {
      window.localStorage.removeItem(GUEST_MODE_FLAG_KEY);
    }
  } catch {
    // Ignore restricted storage errors cleanly
  }
}
