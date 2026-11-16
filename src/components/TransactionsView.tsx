import { Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import type {
  CategoryId,
  CurrencyCode,
  Transaction,
  TransactionFilters,
  TransactionType,
} from '../types/finance';
import {
  computeMonthlySummary,
  formatCurrency,
  formatDisplayDate,
  formatMonthLabel,
  transactionsToCsv,
} from '../utils/finance';
import { ResilientImage } from './ResilientImage';

interface TransactionsViewProps {
  transactions: Transaction[];
  allTransactionsCount: number;
  filters: TransactionFilters;
  currency: CurrencyCode;
  onFiltersChange: (next: TransactionFilters) => void;
  onAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
}

export function TransactionsView({
  transactions,
  allTransactionsCount,
  filters,
  currency,
  onFiltersChange,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: TransactionsViewProps) {
  const summary = computeMonthlySummary(transactions, 'all');

  const handleExportCsv = () => {
    const csv = transactionsToCsv(transactions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `penny-transactions-${filters.monthKey}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filter & Search Toolbar */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Search transactions"
                value={filters.search}
                onChange={(e) =>
                  onFiltersChange({ ...filters, search: e.target.value })
                }
                placeholder="Search groceries, rent, coffee..."
                className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              />
            </div>

            <div
              role="group"
              aria-label="Filter by transaction type"
              className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl"
            >
              {(['all', 'expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      type: t as 'all' | TransactionType,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    filters.type === t
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t === 'all' ? 'All' : t === 'expense' ? 'Expenses' : 'Income'}
                </button>
              ))}
            </div>

            <select
              aria-label="Filter by category"
              value={filters.category}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  category: e.target.value as 'all' | CategoryId,
                })
              }
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              <option value="all">All Categories</option>
              {Object.values(CATEGORIES).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={transactions.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{transactions.length}</strong>{' '}
            {transactions.length === 1 ? 'entry' : 'entries'} in{' '}
            <strong className="text-slate-800">
              {formatMonthLabel(filters.monthKey)}
            </strong>
          </span>
          <div className="flex flex-wrap items-center gap-4 tabular-nums">
            <span>
              In:{' '}
              <strong className="text-teal-700">
                {formatCurrency(summary.totalIncome, currency)}
              </strong>
            </span>
            <span>
              Out:{' '}
              <strong className="text-slate-900">
                {formatCurrency(summary.totalExpenses, currency)}
              </strong>
            </span>
          </div>
        </div>
      </section>

      {/* Transactions List or Empty State */}
      {transactions.length === 0 ? (
        <section className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <div className="w-36 h-36 mx-auto mb-4 rounded-2xl overflow-hidden bg-slate-50">
            <ResilientImage
              src={`${import.meta.env.BASE_URL}src/assets/images/penny_fresh_start_1794848540223.jpg`}
              alt="Open clean financial notebook and pen illustration"
              className="w-full h-full object-cover"
              fallbackTitle="Fresh Financial Ledger"
            />
          </div>
          <h3 className="text-lg font-display font-bold text-slate-900">
            {allTransactionsCount === 0
              ? 'Your ledger is clean and ready'
              : 'No matching transactions found'}
          </h3>
          <p className="text-sm text-slate-600 mt-1.5 max-w-md mx-auto">
            {allTransactionsCount === 0
              ? 'Log your first paycheck or everyday expense to start building a clear picture of your money.'
              : 'Try clearing your search or switching months to see other recorded entries.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onAddTransaction}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Log a Transaction</span>
            </button>
            {(filters.search || filters.type !== 'all' || filters.category !== 'all') && (
              <button
                type="button"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    search: '',
                    type: 'all',
                    category: 'all',
                  })
                }
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
        </section>
      ) : (
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50/70">
                  <th className="py-3.5 px-5">Description</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {transactions.map((tx) => {
                  const cat = CATEGORIES[tx.category];
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-slate-900">
                          {tx.description}
                        </div>
                        {tx.note && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            {tx.note}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {cat?.label ?? tx.category}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                        {formatDisplayDate(tx.date)}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-semibold tabular-nums whitespace-nowrap ${
                          tx.type === 'income' ? 'text-teal-700' : 'text-slate-900'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrency(tx.amount, currency)}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditTransaction(tx)}
                            aria-label={`Edit "${tx.description}"`}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          >
                            <Pencil className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTransaction(tx)}
                            aria-label={`Delete "${tx.description}"`}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
