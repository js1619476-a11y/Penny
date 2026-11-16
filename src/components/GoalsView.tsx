import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { CurrencyCode, GoalProgressItem, SavingsGoal } from '../types/finance';
import { formatCurrency, formatDisplayDate, roundMoney } from '../utils/finance';
import { ResilientImage } from './ResilientImage';

interface GoalsViewProps {
  currency: CurrencyCode;
  items: GoalProgressItem[];
  onCreateGoal: () => void;
  onEditGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (goal: SavingsGoal) => void;
  onContribute: (goal: SavingsGoal) => void;
}

export function GoalsView({
  currency,
  items,
  onCreateGoal,
  onEditGoal,
  onDeleteGoal,
  onContribute,
}: GoalsViewProps) {
  const totalSaved = roundMoney(
    items.reduce((sum, item) => sum + item.goal.currentAmount, 0)
  );
  const totalTarget = roundMoney(
    items.reduce((sum, item) => sum + item.goal.targetAmount, 0)
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white shrink-0">
            <ResilientImage
              src={`${import.meta.env.BASE_URL}src/assets/images/penny_savings_sprout_1794848540404.jpg`}
              alt="Glass savings jar with coins and a green sprout illustration"
              className="w-full h-full object-cover"
              fallbackTitle="Savings Goals"
            />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-slate-900">
              Your Savings Goals
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-lg">
              Every small deposit adds up. Set aside money for peace of mind, upcoming
              trips, or things you are excited to buy without debt.
            </p>
            <p className="text-xs font-medium text-slate-500 mt-2.5 tabular-nums">
              Total saved:{' '}
              <strong className="text-teal-700">
                {formatCurrency(totalSaved, currency)}
              </strong>{' '}
              toward {formatCurrency(totalTarget, currency)} across {items.length}{' '}
              {items.length === 1 ? 'goal' : 'goals'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCreateGoal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>New Savings Goal</span>
        </button>
      </section>

      {items.length === 0 ? (
        <section className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <h3 className="text-lg font-display font-bold text-slate-900">
            No savings goals created yet
          </h3>
          <p className="text-sm text-slate-600 mt-1.5 max-w-md mx-auto">
            Start small — even a $500 rainy-day cushion makes everyday life feel calmer.
          </p>
          <button
            type="button"
            onClick={onCreateGoal}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Create Your First Goal</span>
          </button>
        </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {items.map(({ goal, percentComplete, remainingAmount, isCompleted }) => (
            <article
              key={goal.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-5"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-display font-bold text-slate-900 truncate">
                      {goal.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                      Target by {formatDisplayDate(goal.targetDate)} ·{' '}
                      <span
                        className={
                          isCompleted
                            ? 'text-teal-700 font-semibold'
                            : 'text-slate-600 font-medium'
                        }
                      >
                        {isCompleted ? 'Goal reached' : `${percentComplete}% funded`}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditGoal(goal)}
                      aria-label={`Edit "${goal.name}"`}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteGoal(goal)}
                      aria-label={`Delete "${goal.name}"`}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {goal.note && (
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {goal.note}
                  </p>
                )}

                <div className="mt-4">
                  <div className="flex items-baseline justify-between mb-1.5 tabular-nums">
                    <span className="text-xl font-display font-bold text-slate-900">
                      {formatCurrency(goal.currentAmount, currency)}
                    </span>
                    <span className="text-xs text-slate-500">
                      of {formatCurrency(goal.targetAmount, currency)}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentComplete}%`,
                        backgroundColor: goal.color,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-500 tabular-nums">
                  {isCompleted
                    ? 'Ready when you need it'
                    : `${formatCurrency(remainingAmount, currency)} to go`}
                </span>
                <button
                  type="button"
                  onClick={() => onContribute(goal)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors whitespace-nowrap shrink-0"
                >
                  Add Money
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
