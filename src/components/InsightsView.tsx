import { CATEGORIES } from '../data/categories';
import type {
  CategoryBreakdownItem,
  CurrencyCode,
  MonthlySummary,
  SixMonthTrendPoint,
  Transaction,
} from '../types/finance';
import {
  formatCurrency,
  formatDisplayDate,
  formatMonthLabel,
  getCurrentMonthKey,
  getDaysInMonth,
} from '../utils/finance';

interface InsightsViewProps {
  monthKey: string;
  currency: CurrencyCode;
  summary: MonthlySummary;
  categoryBreakdown: CategoryBreakdownItem[];
  sixMonthTrend: SixMonthTrendPoint[];
  monthTransactions: Transaction[];
}

export function InsightsView({
  monthKey,
  currency,
  summary,
  categoryBreakdown,
  sixMonthTrend,
  monthTransactions,
}: InsightsViewProps) {
  const monthLabel = formatMonthLabel(monthKey);
  const fullMonthDays = getDaysInMonth(monthKey);
  const isCurrentActiveMonth = monthKey === getCurrentMonthKey();
  const daysCount = isCurrentActiveMonth ? new Date().getDate() : fullMonthDays;
  const dailyAverage = summary.totalExpenses / Math.max(1, daysCount);

  const biggestExpenses = monthTransactions
    .filter((tx) => tx.type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold text-slate-900">
          Financial Insights ({monthLabel})
        </h2>
        <p className="text-sm text-slate-600 mt-0.5">
          Clear, chart-free numbers to help you understand your everyday habits.
        </p>
      </div>

      {/* Highlight Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">Average Daily Spending</p>
          <p className="mt-2 text-2xl font-display font-bold text-slate-900 tabular-nums">
            {formatCurrency(dailyAverage, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {isCurrentActiveMonth
              ? `Averaged across ${daysCount} days so far`
              : `Averaged across ${daysCount} days`}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">Savings Rate</p>
          <p className="mt-2 text-2xl font-display font-bold text-teal-700 tabular-nums">
            {summary.savingsRate}%
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Share of income kept unspent
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">Top Spending Area</p>
          <p className="mt-2 text-2xl font-display font-bold text-slate-900 truncate">
            {categoryBreakdown[0]?.label ?? 'None yet'}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {categoryBreakdown[0]
              ? `${categoryBreakdown[0].percentage}% of all spending`
              : 'Log an expense to see'}
          </p>
        </div>
      </section>

      {/* Clean Tabular Breakdown Grid (No Charts) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-base font-display font-bold text-slate-900 mb-1">
            Spending by Category
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            Total spent in {monthLabel}:{' '}
            <strong className="text-slate-900 tabular-nums">
              {formatCurrency(summary.totalExpenses, currency)}
            </strong>
          </p>

          {categoryBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500 py-10 text-center">
              No expense data recorded for {monthLabel} yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {categoryBreakdown.map((item) => (
                <li
                  key={item.category}
                  className="py-3 flex items-center justify-between gap-4 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-500 tabular-nums mt-0.5">
                      {item.count} {item.count === 1 ? 'entry' : 'entries'} · {item.percentage}%
                    </p>
                  </div>
                  <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                    {formatCurrency(item.amount, currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="xl:col-span-7 space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="text-base font-display font-bold text-slate-900 mb-1">
              Six-Month Cash Flow Summary
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Compare monthly income, spending, and what stayed unspent
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                    <th className="py-2.5 pr-4">Month</th>
                    <th className="py-2.5 px-3 text-right">Money In</th>
                    <th className="py-2.5 px-3 text-right">Money Out</th>
                    <th className="py-2.5 pl-3 text-right">Left Over</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {sixMonthTrend.map((row) => (
                    <tr key={row.monthKey}>
                      <td className="py-3 pr-4 font-medium text-slate-800">
                        {row.label}
                      </td>
                      <td className="py-3 px-3 text-right text-teal-700 font-medium">
                        {formatCurrency(row.income, currency)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-900">
                        {formatCurrency(row.expenses, currency)}
                      </td>
                      <td
                        className={`py-3 pl-3 text-right font-semibold ${
                          row.net >= 0 ? 'text-teal-700' : 'text-rose-600'
                        }`}
                      >
                        {row.net >= 0 ? '+' : ''}
                        {formatCurrency(row.net, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="text-base font-display font-bold text-slate-900 mb-1">
              Largest Expenses ({monthLabel})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              The five biggest items that shaped your spending
            </p>

            {biggestExpenses.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">
                No expenses logged in {monthLabel} yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {biggestExpenses.map((tx) => (
                  <li
                    key={tx.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {tx.description}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {CATEGORIES[tx.category]?.label ?? tx.category} ·{' '}
                        {formatDisplayDate(tx.date)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 tabular-nums shrink-0">
                      {formatCurrency(tx.amount, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
