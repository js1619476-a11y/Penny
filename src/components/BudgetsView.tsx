import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { Budget, BudgetProgressItem, CurrencyCode } from '../types/finance';
import { formatCurrency, formatMonthLabel, roundMoney } from '../utils/finance';

interface BudgetsViewProps {
  monthKey: string;
  currency: CurrencyCode;
  items: BudgetProgressItem[];
  onAddBudget: () => void;
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: (budget: Budget) => void;
}

export function BudgetsView({
  monthKey,
  currency,
  items,
  onAddBudget,
  onEditBudget,
  onDeleteBudget,
}: BudgetsViewProps) {
  const totalBudgeted = roundMoney(
    items.reduce((sum, item) => sum + item.budget.limit, 0)
  );
  const totalSpent = roundMoney(items.reduce((sum, item) => sum + item.spent, 0));
  const totalRemaining = roundMoney(totalBudgeted - totalSpent);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-900">
            Monthly Spending Plan ({formatMonthLabel(monthKey)})
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Friendly limits help you spend confidently without guilt or surprises.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddBudget}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Set Category Limit</span>
        </button>
      </div>

      {/* Summary KPI Row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">Total Monthly Plan</p>
          <p className="mt-2 text-2xl font-display font-bold text-slate-900 tabular-nums">
            {formatCurrency(totalBudgeted, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Across {items.length} {items.length === 1 ? 'category' : 'categories'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">Spent Against Plan</p>
          <p className="mt-2 text-2xl font-display font-bold text-slate-900 tabular-nums">
            {formatCurrency(totalSpent, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {totalBudgeted > 0
              ? `${Math.round((totalSpent / totalBudgeted) * 100)}% of total plan used`
              : 'Set a limit to track progress'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">Left in Plan</p>
          <p
            className={`mt-2 text-2xl font-display font-bold tabular-nums ${
              totalRemaining >= 0 ? 'text-teal-700' : 'text-rose-600'
            }`}
          >
            {formatCurrency(totalRemaining, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {totalRemaining >= 0
              ? 'Comfortable room remaining'
              : 'Slightly over your planned limits'}
          </p>
        </div>
      </section>

      {items.length === 0 ? (
        <section className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <h3 className="text-lg font-display font-bold text-slate-900">
            No monthly budgets set yet
          </h3>
          <p className="text-sm text-slate-600 mt-1.5 max-w-md mx-auto">
            Pick one or two everyday categories like Groceries or Dining &amp; Coffee to
            start pacing your monthly spending.
          </p>
          <button
            type="button"
            onClick={onAddBudget}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Create First Budget</span>
          </button>
        </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const barColor =
              item.status === 'over-budget'
                ? '#DC2626'
                : item.status === 'near-limit'
                ? '#D97706'
                : '#0D9488';

            return (
              <article
                key={item.budget.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-display font-bold text-slate-900">
                        {item.label}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        {formatCurrency(item.spent, currency)} spent of{' '}
                        {formatCurrency(item.budget.limit, currency)} ·{' '}
                        <span
                          className={
                            item.status === 'over-budget'
                              ? 'text-rose-600 font-semibold'
                              : item.status === 'near-limit'
                              ? 'text-amber-700 font-semibold'
                              : 'text-teal-700 font-semibold'
                          }
                        >
                          {item.statusLabel}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditBudget(item.budget)}
                        aria-label={`Edit ${item.label} budget`}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                      >
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteBudget(item.budget)}
                        aria-label={`Remove ${item.label} budget`}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, item.percentUsed)}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100 tabular-nums">
                  {item.remaining >= 0 ? (
                    <>
                      <span>
                        <strong className="text-slate-900">
                          {formatCurrency(item.remaining, currency)}
                        </strong>{' '}
                        left to spend
                      </span>
                      <span className="text-slate-500">
                        ~{formatCurrency(item.dailySafeSpend, currency)} / day
                      </span>
                    </>
                  ) : (
                    <span className="text-rose-600 font-medium">
                      Over by {formatCurrency(Math.abs(item.remaining), currency)}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
