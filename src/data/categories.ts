import type { CategoryId, CategoryMeta } from '../types/finance';

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  groceries: {
    id: 'groceries',
    label: 'Groceries',
    type: 'expense',
    color: '#0D9488',
    softBg: '#CCFBF1',
    description: 'Supermarkets, fresh produce, household staples',
  },
  dining: {
    id: 'dining',
    label: 'Dining & Coffee',
    type: 'expense',
    color: '#F59E0B',
    softBg: '#FEF3C7',
    description: 'Cafes, lunches out, takeout, dinners',
  },
  housing: {
    id: 'housing',
    label: 'Housing & Rent',
    type: 'expense',
    color: '#4F46E5',
    softBg: '#E0E7FF',
    description: 'Monthly rent, mortgage, home upkeep',
  },
  utilities: {
    id: 'utilities',
    label: 'Bills & Utilities',
    type: 'expense',
    color: '#0284C7',
    softBg: '#E0F2FE',
    description: 'Electricity, internet, phone, water',
  },
  transport: {
    id: 'transport',
    label: 'Transport',
    type: 'expense',
    color: '#7C3AED',
    softBg: '#EDE9FE',
    description: 'Transit passes, fuel, rideshares, parking',
  },
  shopping: {
    id: 'shopping',
    label: 'Everyday Shopping',
    type: 'expense',
    color: '#EC4899',
    softBg: '#FCE7F3',
    description: 'Clothes, home items, personal care',
  },
  health: {
    id: 'health',
    label: 'Health & Wellness',
    type: 'expense',
    color: '#10B981',
    softBg: '#D1FAE5',
    description: 'Pharmacy, clinic visits, fitness',
  },
  leisure: {
    id: 'leisure',
    label: 'Fun & Leisure',
    type: 'expense',
    color: '#EA580C',
    softBg: '#FFEDD5',
    description: 'Movies, books, streaming, weekend outings',
  },
  savings: {
    id: 'savings',
    label: 'Savings Transfer',
    type: 'expense',
    color: '#0F766E',
    softBg: '#CCFBF1',
    description: 'Money set aside into your savings goals',
  },
  salary: {
    id: 'salary',
    label: 'Salary & Paycheck',
    type: 'income',
    color: '#059669',
    softBg: '#D1FAE5',
    description: 'Regular paycheck or wages',
  },
  freelance: {
    id: 'freelance',
    label: 'Side & Freelance',
    type: 'income',
    color: '#0D9488',
    softBg: '#CCFBF1',
    description: 'Extra projects, tutoring, weekend work',
  },
  gifts: {
    id: 'gifts',
    label: 'Gifts & Refunds',
    type: 'income',
    color: '#6366F1',
    softBg: '#E0E7FF',
    description: 'Cash gifts, rebates, reimbursements',
  },
};

export const EXPENSE_CATEGORIES: CategoryMeta[] = Object.values(CATEGORIES).filter(
  (c) => c.type === 'expense' || c.type === 'both'
);

export const INCOME_CATEGORIES: CategoryMeta[] = Object.values(CATEGORIES).filter(
  (c) => c.type === 'income' || c.type === 'both'
);
