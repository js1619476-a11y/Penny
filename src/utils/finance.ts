import { CATEGORIES } from '../data/categories';
import type {
  Budget,
  BudgetProgressItem,
  CategoryBreakdownItem,
  CategoryId,
  CurrencyCode,
  GoalProgressItem,
  InsightItem,
  MonthlySummary,
  SavingsGoal,
  SixMonthTrendPoint,
  Transaction,
  TransactionFilters,
  TransactionType,
} from '../types/finance';

const CURRENCY_LOCALES: Record<CurrencyCode, { locale: string; symbol: string }> = {
  USD: { locale: 'en-US', symbol: '$' },
  GBP: { locale: 'en-GB', symbol: '£' },
  EUR: { locale: 'en-IE', symbol: '€' },
};

export function getCurrentDateString(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthKey(now: Date = new Date()): string {
  return getCurrentDateString(now).slice(0, 7);
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'USD'): string {
  const { locale } = CURRENCY_LOCALES[currency];
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatWholeCurrency(amount: number, currency: CurrencyCode = 'USD'): string {
  const { locale } = CURRENCY_LOCALES[currency];
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function formatMonthLabel(monthKey: string): string {
  if (monthKey === 'all') return 'All Time';
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return monthKey;
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatShortMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return monthKey;
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatDisplayDate(dateStr: string): string {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day) return dateStr;
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function getAvailableMonths(
  transactions: Transaction[],
  defaultMonthKey = getCurrentMonthKey()
): string[] {
  const set = new Set<string>([defaultMonthKey]);
  for (const tx of transactions) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(tx.date)) {
      set.add(getMonthKey(tx.date));
    }
  }
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters
): Transaction[] {
  const query = filters.search.trim().toLowerCase();
  return transactions
    .filter((tx) => {
      if (filters.monthKey !== 'all' && getMonthKey(tx.date) !== filters.monthKey) {
        return false;
      }
      if (filters.type !== 'all' && tx.type !== filters.type) {
        return false;
      }
      if (filters.category !== 'all' && tx.category !== filters.category) {
        return false;
      }
      if (query) {
        const catLabel = CATEGORIES[tx.category]?.label.toLowerCase() ?? '';
        const matchesDesc = tx.description.toLowerCase().includes(query);
        const matchesNote = (tx.note ?? '').toLowerCase().includes(query);
        const matchesCat = catLabel.includes(query);
        if (!matchesDesc && !matchesNote && !matchesCat) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0);
    });
}

export function computeMonthlySummary(
  transactions: Transaction[],
  monthKey: string
): MonthlySummary {
  const scoped =
    monthKey === 'all'
      ? transactions
      : transactions.filter((tx) => getMonthKey(tx.date) === monthKey);

  let totalIncome = 0;
  let totalExpenses = 0;

  for (const tx of scoped) {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else {
      totalExpenses += tx.amount;
    }
  }

  const netSavings = roundMoney(totalIncome - totalExpenses);
  const savingsRate =
    totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  return {
    totalIncome: roundMoney(totalIncome),
    totalExpenses: roundMoney(totalExpenses),
    netSavings,
    savingsRate,
    transactionCount: scoped.length,
  };
}

export function computeAllTimeBalance(transactions: Transaction[]): number {
  let balance = 0;
  for (const tx of transactions) {
    balance += tx.type === 'income' ? tx.amount : -tx.amount;
  }
  return roundMoney(balance);
}

export function computeCategoryBreakdown(
  transactions: Transaction[],
  monthKey: string
): CategoryBreakdownItem[] {
  const expenses = transactions.filter(
    (tx) =>
      tx.type === 'expense' &&
      (monthKey === 'all' || getMonthKey(tx.date) === monthKey)
  );

  const totals = new Map<CategoryId, { amount: number; count: number }>();
  let grandTotal = 0;

  for (const tx of expenses) {
    grandTotal += tx.amount;
    const prev = totals.get(tx.category) ?? { amount: 0, count: 0 };
    totals.set(tx.category, {
      amount: roundMoney(prev.amount + tx.amount),
      count: prev.count + 1,
    });
  }

  const items: CategoryBreakdownItem[] = [];
  for (const [category, info] of totals.entries()) {
    const meta = CATEGORIES[category];
    items.push({
      category,
      label: meta?.label ?? category,
      color: meta?.color ?? '#64748B',
      amount: info.amount,
      percentage: grandTotal > 0 ? Math.round((info.amount / grandTotal) * 100) : 0,
      count: info.count,
    });
  }

  return items.sort((a, b) => b.amount - a.amount);
}

export function getDaysInMonth(monthKey: string): number {
  if (monthKey === 'all') return 30;
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return 30;
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function computeBudgetProgress(
  budgets: Budget[],
  transactions: Transaction[],
  monthKey: string,
  currentDayOfMonth: number = new Date().getDate()
): BudgetProgressItem[] {
  const effectiveMonth = monthKey === 'all' ? getCurrentMonthKey() : monthKey;
  const daysInMonth = getDaysInMonth(effectiveMonth);
  const daysRemaining = Math.max(1, daysInMonth - Math.min(currentDayOfMonth, daysInMonth) + 1);

  const spentByCategory = new Map<CategoryId, number>();
  for (const tx of transactions) {
    if (tx.type === 'expense' && getMonthKey(tx.date) === effectiveMonth) {
      spentByCategory.set(
        tx.category,
        roundMoney((spentByCategory.get(tx.category) ?? 0) + tx.amount)
      );
    }
  }

  return budgets
    .map((budget) => {
      const meta = CATEGORIES[budget.category];
      const spent = spentByCategory.get(budget.category) ?? 0;
      const remaining = roundMoney(budget.limit - spent);
      const percentUsed = budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0;

      let status: BudgetProgressItem['status'] = 'on-track';
      let statusLabel = 'On track';
      if (spent > budget.limit) {
        status = 'over-budget';
        statusLabel = 'Over budget';
      } else if (percentUsed >= 85) {
        status = 'near-limit';
        statusLabel = 'Almost at limit';
      }

      const dailySafeSpend = remaining > 0 ? roundMoney(remaining / daysRemaining) : 0;

      return {
        budget,
        label: meta?.label ?? budget.category,
        color: meta?.color ?? '#0D9488',
        spent,
        remaining,
        percentUsed,
        status,
        statusLabel,
        dailySafeSpend,
      };
    })
    .sort((a, b) => b.percentUsed - a.percentUsed);
}

export function computeGoalProgress(goal: SavingsGoal): GoalProgressItem {
  const remainingAmount = roundMoney(Math.max(0, goal.targetAmount - goal.currentAmount));
  const rawPct =
    goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
  const percentComplete = Math.max(0, Math.min(100, rawPct));
  const isCompleted = goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount;

  return {
    goal,
    percentComplete,
    remainingAmount,
    isCompleted,
  };
}

export function computeSixMonthTrend(
  transactions: Transaction[],
  referenceMonthKey: string = getCurrentMonthKey()
): SixMonthTrendPoint[] {
  const baseKey = referenceMonthKey === 'all' ? getCurrentMonthKey() : referenceMonthKey;
  const [yearStr, monthStr] = baseKey.split('-');
  const baseYear = Number(yearStr) || new Date().getFullYear();
  const baseMonth = Number(monthStr) || new Date().getMonth() + 1;

  const points: SixMonthTrendPoint[] = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const d = new Date(Date.UTC(baseYear, baseMonth - 1 - offset, 1));
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const key = `${y}-${m}`;
    const summary = computeMonthlySummary(transactions, key);
    points.push({
      monthKey: key,
      label: formatShortMonthLabel(key),
      income: summary.totalIncome,
      expenses: summary.totalExpenses,
      net: summary.netSavings,
    });
  }
  return points;
}

export function generatePlainInsights(
  transactions: Transaction[],
  budgets: Budget[],
  goals: SavingsGoal[],
  monthKey: string,
  currency: CurrencyCode = 'USD'
): InsightItem[] {
  const insights: InsightItem[] = [];
  const summary = computeMonthlySummary(transactions, monthKey);
  const breakdown = computeCategoryBreakdown(transactions, monthKey);
  const budgetItems = computeBudgetProgress(budgets, transactions, monthKey);

  if (summary.transactionCount === 0) {
    insights.push({
      id: 'insight-empty',
      title: 'Ready when you are',
      summary:
        'Add your first paycheck or everyday expense to see clear, plain-English patterns about where your money goes.',
      tone: 'neutral',
      actionLabel: 'Log a transaction',
      targetView: 'transactions',
    });
    return insights;
  }

  if (summary.totalIncome > 0) {
    if (summary.netSavings >= 0) {
      insights.push({
        id: 'insight-savings-rate',
        title: `You kept ${summary.savingsRate}% of your income`,
        summary: `So far in ${formatMonthLabel(monthKey)}, you brought in ${formatCurrency(
          summary.totalIncome,
          currency
        )} and spent ${formatCurrency(
          summary.totalExpenses,
          currency
        )}, leaving ${formatCurrency(summary.netSavings, currency)} unspent.`,
        tone: summary.savingsRate >= 20 ? 'positive' : 'neutral',
        actionLabel: 'Put toward a goal',
        targetView: 'goals',
      });
    } else {
      insights.push({
        id: 'insight-overspent',
        title: 'Spending is ahead of income this period',
        summary: `You spent ${formatCurrency(
          Math.abs(summary.netSavings),
          currency
        )} more than came in during ${formatMonthLabel(
          monthKey
        )}. Checking your top categories below can help spot quick wins.`,
        tone: 'caution',
        actionLabel: 'Review budgets',
        targetView: 'budgets',
      });
    }
  }

  if (breakdown.length > 0) {
    const top = breakdown[0];
    insights.push({
      id: 'insight-top-category',
      title: `${top.label} is your biggest expense`,
      summary: `${top.label} makes up ${top.percentage}% (${formatCurrency(
        top.amount,
        currency
      )}) of your spending across ${top.count} ${
        top.count === 1 ? 'entry' : 'entries'
      }.`,
      tone: 'neutral',
      actionLabel: 'See transactions',
      targetView: 'transactions',
    });
  }

  const overBudgets = budgetItems.filter((b) => b.status === 'over-budget');
  const nearBudgets = budgetItems.filter((b) => b.status === 'near-limit');

  if (overBudgets.length > 0) {
    const first = overBudgets[0];
    insights.push({
      id: 'insight-budget-over',
      title: `${first.label} went over its monthly plan`,
      summary: `You are ${formatCurrency(
        Math.abs(first.remaining),
        currency
      )} past your ${formatCurrency(
        first.budget.limit,
        currency
      )} ${first.label.toLowerCase()} limit. You can adjust the plan anytime if your needs changed.`,
      tone: 'caution',
      actionLabel: 'Adjust budgets',
      targetView: 'budgets',
    });
  } else if (nearBudgets.length > 0) {
    const first = nearBudgets[0];
    insights.push({
      id: 'insight-budget-near',
      title: `${first.label} is getting close to its limit`,
      summary: `You have ${formatCurrency(
        first.remaining,
        currency
      )} left for ${first.label.toLowerCase()} (${first.percentUsed}% used).`,
      tone: 'caution',
      actionLabel: 'Check budgets',
      targetView: 'budgets',
    });
  } else if (budgetItems.length > 0) {
    insights.push({
      id: 'insight-budget-healthy',
      title: 'Every spending limit is on track',
      summary: `All ${budgetItems.length} of your monthly budgets have comfortable room left.`,
      tone: 'positive',
      actionLabel: 'View budgets',
      targetView: 'budgets',
    });
  }

  if (goals.length > 0) {
    const closest = goals
      .map(computeGoalProgress)
      .filter((g) => !g.isCompleted)
      .sort((a, b) => b.percentComplete - a.percentComplete)[0];

    if (closest) {
      insights.push({
        id: 'insight-goal-closest',
        title: `${closest.goal.name} is ${closest.percentComplete}% funded`,
        summary: `Only ${formatCurrency(
          closest.remainingAmount,
          currency
        )} to go to reach your ${formatCurrency(
          closest.goal.targetAmount,
          currency
        )} target.`,
        tone: 'positive',
        actionLabel: 'Add savings',
        targetView: 'goals',
      });
    }
  }

  return insights.slice(0, 4);
}

export function transactionsToCsv(transactions: Transaction[]): string {
  const header = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Note'];
  const escape = (val: string) => {
    if (/[",\n\r]/.test(val)) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const rows = transactions.map((tx) => {
    const label = CATEGORIES[tx.category]?.label ?? tx.category;
    return [
      escape(tx.date),
      escape(tx.description),
      escape(label),
      escape(tx.type),
      tx.amount.toFixed(2),
      escape(tx.note ?? ''),
    ].join(',');
  });

  return [header.join(','), ...rows].join('\n');
}

export interface ValidationErrors {
  [field: string]: string;
}

export function validateTransactionInput(input: {
  description: string;
  amount: string;
  type: TransactionType;
  category: CategoryId;
  date: string;
  note?: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  const trimmedDesc = input.description.trim();
  if (!trimmedDesc) {
    errors.description = 'Please enter a short description (like "Groceries" or "Paycheck").';
  } else if (trimmedDesc.length > 120) {
    errors.description = 'Description must be 120 characters or fewer.';
  }
  const parsed = Number(input.amount);
  if (!input.amount.trim() || Number.isNaN(parsed) || parsed <= 0 || parsed > 100000000) {
    errors.amount = 'Please enter an amount between 0.01 and 100,000,000.';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    errors.date = 'Please pick a valid date.';
  }
  if (!CATEGORIES[input.category]) {
    errors.category = 'Please choose a category.';
  }
  if (input.note && input.note.trim().length > 240) {
    errors.note = 'Note must be 240 characters or fewer.';
  }
  return errors;
}

export function validateBudgetInput(input: {
  category: string;
  limit: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!input.category || !CATEGORIES[input.category as CategoryId]) {
    errors.category = 'Please choose a spending category.';
  }
  const parsed = Number(input.limit);
  if (!input.limit.trim() || Number.isNaN(parsed) || parsed <= 0 || parsed > 100000000) {
    errors.limit = 'Please enter a monthly limit between 1 and 100,000,000.';
  }
  return errors;
}

export function validateGoalInput(input: {
  name: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string;
  note?: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    errors.name = 'Give your savings goal a friendly name.';
  } else if (trimmedName.length > 100) {
    errors.name = 'Goal name must be 100 characters or fewer.';
  }
  const target = Number(input.targetAmount);
  if (!input.targetAmount.trim() || Number.isNaN(target) || target <= 0 || target > 100000000) {
    errors.targetAmount = 'Target amount must be between 1 and 100,000,000.';
  }
  const current = Number(input.currentAmount || '0');
  if (Number.isNaN(current) || current < 0 || current > 100000000) {
    errors.currentAmount = 'Starting saved amount must be between 0 and 100,000,000.';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.targetDate)) {
    errors.targetDate = 'Please select a target date.';
  }
  if (input.note && input.note.trim().length > 240) {
    errors.note = 'Note must be 240 characters or fewer.';
  }
  return errors;
}

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
