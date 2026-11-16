import {
  ArrowRight,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import type {
  BudgetProgressItem,
  CategoryBreakdownItem,
  CurrencyCode,
  GoalProgressItem,
  InsightItem,
  MonthlySummary,
  Transaction,
  ViewId,
} from '../types/finance';
import {
  formatCurrency,
  formatDisplayDate,
  formatMonthLabel,
  formatWholeCurrency,
} from '../utils/finance';
import { ResilientImage } from './ResilientImage';

interface OverviewViewProps {
  monthKey: string;
  currency: CurrencyCode;
  userFirstName: string;
  allTimeBalance: number;
  summary: MonthlySummary;
  recentTransactions: Transaction[];
  categoryBreakdown: CategoryBreakdownItem[];
  budgetProgress: BudgetProgressItem[];
  goalProgress: GoalProgressItem[];
  insights: InsightItem[];
  onNavigate: (view: ViewId) => void;
  onAddTransaction: () => void;
  onContributeGoal: (goalId: string) => void;
}

export function OverviewView({
  monthKey,
  currency,
  userFirstName,
  allTimeBalance,
  summary,
  recentTransactions,
  categoryBreakdown,
  budgetProgress,
  goalProgress,
  insights,
  onNavigate,
  onAddTransaction,
  onContributeGoal,
}: OverviewViewProps) {
  const topCategories = categoryBreakdown.slice(0, 6);
  const topBudgets = budgetProgress.slice(0, 4);
  const topGoals = goalProgress.slice(0, 3);
  const monthLabel = formatMonthLabel(monthKey);

  return (
    <div className="space-y-6">
      {/* Welcome Companion Banner */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-5">
            <div>
              <p className="text-xs font-semibold text-teal-700 mb-2">
                {monthLabel} Snapshot · {userFirstName}&rsquo;s Profile
              </p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight text-balance">
                Your money, clear and calm at a glance
              </h2>
              <p className="mt-2.5 text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
                {summary.transactionCount === 0
                  ? 'Your profile is fresh and ready. Start by recording your paycheck or an everyday expense to build a clear picture of your money.'
                  : summary.netSavings >= 0
                  ? `You have ${formatCurrency(
                      summary.netSavings,
                      currency
                    )} more coming in than going out for ${monthLabel} — keeping ${
                      summary.savingsRate
                    }% of your income.`
                  : `Spending is ${formatCurrency(
                      Math.abs(summary.netSavings),
                      currency
                    )} above income in ${monthLabel}. Review your categories below to spot easy adjustments.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onAddTransaction}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Record Transaction</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('budgets')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                <span>Check Budgets</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-100 min-h-[190px]">
            <ResilientImage
              src={`${import.meta.env.BASE_URL}src/assets/images/penny_companion_banner_1794848538247.jpg`}
              alt="Friendly desk illustration with an open finance notebook, potted plant, coffee mug, and simple geometric shapes"
              className="w-full h-full object-cover"
              fallbackTitle="Penny Everyday Money Companion"
            />
          </div>
        </div>
      </section>

      {/* 4-Column KPI Strip */}
      <section aria-label="Monthly financial summary" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">Overall Balance</p>
          <p className="mt-2 text-2xl font-display font-bold text-slate-900 tabular-nums">
            {formatCurrency(allTimeBalance, currency)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            All recorded income minus spending
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Money In</p>
            <ArrowDownLeft className="w-4 h-4 text-teal-600" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-display font-bold text-teal-700 tabular-nums">
            {formatCurrency(summary.totalIncome, currency)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            Paychecks, side work &amp; gifts
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Money Out</p>
            <ArrowUpRight className="w-4 h-4 text-slate-700" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-display font-bold text-slate-900 tabular-nums">
            {formatCurrency(summary.totalExpenses, currency)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            Across {summary.transactionCount} recorded{' '}
            {summary.transactionCount === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">Left Over ({monthLabel})</p>
          <p
            className={`mt-2 text-2xl font-display font-bold tabular-nums ${
              summary.netSavings >= 0 ? 'text-teal-700' : 'text-rose-600'
            }`}
          >
            {summary.netSavings >= 0 ? '+' : ''}
            {formatCurrency(summary.netSavings, currency)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {summary.totalIncome > 0
              ? `${summary.savingsRate}% of income saved`
              : 'Add income to see savings rate'}
          </p>
        </div>
      </section>

      {/* Plain-English Insights + Spending Categories (No Charts) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-7 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-display font-bold text-slate-900">
                In Plain English
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Helpful takeaways based on your real numbers
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('insights')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 whitespace-nowrap"
            >
              All insights
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {insights.map((insight) => {
              const Icon =
                insight.tone === 'positive'
                  ? CheckCircle2
                  : insight.tone === 'caution'
                  ? AlertTriangle
                  : Info;
              const iconColor =
                insight.tone === 'positive'
                  ? 'text-teal-600'
                  : insight.tone === 'caution'
                  ? 'text-amber-600'
                  : 'text-slate-500';

              return (
                <div key={insight.id} className="py-4 first:pt-1 last:pb-1 flex items-start gap-3">
                  <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-slate-900">
                      {insight.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {insight.summary}
                    </p>
                    {insight.actionLabel && insight.targetView && (
                      <button
                        type="button"
                        onClick={() => onNavigate(insight.targetView!)}
                        className="mt-2 text-xs font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1"
                      >
                        <span>{insight.actionLabel}</span>
                        <ArrowRight className="w-3 h-3" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-display font-bold text-slate-900">
                Where Your Money Went
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{monthLabel} spending summary</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('insights')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 whitespace-nowrap"
            >
              Full breakdown
            </button>
          </div>

          {topCategories.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <p className="text-sm text-slate-500">
                No expenses recorded for {monthLabel} yet.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {topCategories.map((item) => (
                <li
                  key={item.category}
                  className="py-3 flex items-center justify-between gap-4 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                      {item.count} {item.count === 1 ? 'entry' : 'entries'} · {item.percentage}% of spending
                    </p>
                  </div>
                  <span className="font-semibold text-slate-900 tabular-nums whitespace-nowrap shrink-0">
                    {formatCurrency(item.amount, currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Recent Transactions + Budgets & Goals Snapshot */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-7 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-display font-bold text-slate-900">
                Recent Activity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest entries in {monthLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('transactions')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 whitespace-nowrap"
            >
              See all
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500 mb-3">
                No transactions logged for this period yet.
              </p>
              <button
                type="button"
                onClick={onAddTransaction}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700"
              >
                Log First Entry
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentTransactions.slice(0, 6).map((tx) => {
                const cat = CATEGORIES[tx.category];
                return (
                  <li
                    key={tx.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {tx.description}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {cat?.label ?? tx.category} · {formatDisplayDate(tx.date)}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold tabular-nums whitespace-nowrap shrink-0 ${
                        tx.type === 'income' ? 'text-teal-700' : 'text-slate-900'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, currency)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-display font-bold text-slate-900">
                Budget Check-In
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('budgets')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 whitespace-nowrap"
              >
                Manage
              </button>
            </div>

            {topBudgets.length === 0 ? (
              <p className="text-xs text-slate-500">
                No monthly limits set yet. Set gentle limits to stay aware.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {topBudgets.map((item) => (
                  <div key={item.budget.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-slate-800 truncate">
                      {item.label}
                    </span>
                    <span className="text-slate-600 tabular-nums shrink-0">
                      {formatWholeCurrency(item.spent, currency)} /{' '}
                      {formatWholeCurrency(item.budget.limit, currency)} ·{' '}
                      <span
                        className={
                          item.status === 'over-budget'
                            ? 'text-rose-600 font-semibold'
                            : item.status === 'near-limit'
                            ? 'text-amber-700 font-semibold'
                            : 'text-teal-700 font-medium'
                        }
                      >
                        {item.statusLabel}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-display font-bold text-slate-900">
                Savings Goals
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('goals')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 whitespace-nowrap"
              >
                All goals
              </button>
            </div>

            {topGoals.length === 0 ? (
              <p className="text-xs text-slate-500">
                No savings goals yet. Create one to start building momentum.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {topGoals.map(({ goal, percentComplete }) => (
                  <div key={goal.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-800 truncate">
                        {goal.name}
                      </p>
                      <p className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                        {formatCurrency(goal.currentAmount, currency)} of{' '}
                        {formatCurrency(goal.targetAmount, currency)} · {percentComplete}%
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onContributeGoal(goal.id)}
                      aria-label={`Add money to ${goal.name}`}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition-colors whitespace-nowrap shrink-0"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
