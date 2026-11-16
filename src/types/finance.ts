export type TransactionType = 'income' | 'expense';

export type CurrencyCode = 'USD' | 'GBP' | 'EUR';

export type ViewId = 'overview' | 'transactions' | 'budgets' | 'goals' | 'insights';

export type CategoryId =
  | 'groceries'
  | 'dining'
  | 'housing'
  | 'utilities'
  | 'transport'
  | 'shopping'
  | 'health'
  | 'leisure'
  | 'savings'
  | 'salary'
  | 'freelance'
  | 'gifts';

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  type: TransactionType | 'both';
  color: string;
  softBg: string;
  description: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  currency: CurrencyCode;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: CategoryId;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAtMs?: number;
}

export interface Budget {
  id: string;
  category: CategoryId;
  limit: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  note?: string;
  color: string;
}

export interface TransactionFilters {
  monthKey: string; // 'YYYY-MM' or 'all'
  search: string;
  type: 'all' | TransactionType;
  category: 'all' | CategoryId;
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  transactionCount: number;
}

export interface CategoryBreakdownItem {
  category: CategoryId;
  label: string;
  color: string;
  amount: number;
  percentage: number;
  count: number;
}

export type BudgetStatus = 'on-track' | 'near-limit' | 'over-budget';

export interface BudgetProgressItem {
  budget: Budget;
  label: string;
  color: string;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: BudgetStatus;
  statusLabel: string;
  dailySafeSpend: number;
}

export interface GoalProgressItem {
  goal: SavingsGoal;
  percentComplete: number;
  remainingAmount: number;
  isCompleted: boolean;
}

export interface SixMonthTrendPoint {
  monthKey: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
}

export interface InsightItem {
  id: string;
  title: string;
  summary: string;
  tone: 'positive' | 'caution' | 'neutral';
  actionLabel?: string;
  targetView?: ViewId;
}
