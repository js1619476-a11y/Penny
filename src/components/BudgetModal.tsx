import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../data/categories';
import type { Budget, CategoryId } from '../types/finance';
import { validateBudgetInput, type ValidationErrors } from '../utils/finance';

interface BudgetModalProps {
  isOpen: boolean;
  initialBudget?: Budget | null;
  existingCategories: CategoryId[];
  onClose: () => void;
  onSave: (category: CategoryId, limit: number, existingId?: string) => void;
}

export function BudgetModal({
  isOpen,
  initialBudget,
  existingCategories,
  onClose,
  onSave,
}: BudgetModalProps) {
  const availableCategories = EXPENSE_CATEGORIES.filter(
    (c) =>
      initialBudget?.category === c.id || !existingCategories.includes(c.id)
  );

  const [category, setCategory] = useState<string>('groceries');
  const [limit, setLimit] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (!isOpen) return;
    if (initialBudget) {
      setCategory(initialBudget.category);
      setLimit(String(initialBudget.limit));
    } else {
      setCategory(availableCategories[0]?.id ?? '');
      setLimit('');
    }
    setErrors({});
  }, [isOpen, initialBudget]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateBudgetInput({ category, limit });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave(
      category as CategoryId,
      Math.round(Number(limit) * 100) / 100,
      initialBudget?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 id="budget-modal-title" className="text-lg font-display font-bold text-slate-900">
            {initialBudget ? 'Adjust Monthly Budget' : 'Set a Monthly Budget'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close budget dialog"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          <div>
            <label
              htmlFor="budget-category"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Spending Category
            </label>
            <select
              id="budget-category"
              value={category}
              disabled={Boolean(initialBudget)}
              onChange={(e) => {
                setCategory(e.target.value);
                if (errors.category) setErrors((p) => ({ ...p, category: '' }));
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              {availableCategories.length === 0 && (
                <option value="">All categories already have a budget</option>
              )}
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p role="alert" className="text-xs text-rose-600 mt-1">
                {errors.category}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="budget-limit"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Monthly Spending Limit
            </label>
            <input
              id="budget-limit"
              type="number"
              step="1"
              min="1"
              value={limit}
              onChange={(e) => {
                setLimit(e.target.value);
                if (errors.limit) setErrors((p) => ({ ...p, limit: '' }));
              }}
              placeholder="e.g., 350"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            />
            {errors.limit && (
              <p role="alert" className="text-xs text-rose-600 mt-1">
                {errors.limit}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={availableCategories.length === 0 && !initialBudget}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {initialBudget ? 'Update Limit' : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
