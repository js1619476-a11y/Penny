import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { CurrencyCode, SavingsGoal } from '../types/finance';
import { formatCurrency } from '../utils/finance';

interface ContributeGoalModalProps {
  goal: SavingsGoal | null;
  currency: CurrencyCode;
  onClose: () => void;
  onContribute: (goalId: string, amount: number, alsoLogTransaction: boolean) => void;
}

export function ContributeGoalModal({
  goal,
  currency,
  onClose,
  onContribute,
}: ContributeGoalModalProps) {
  const [amount, setAmount] = useState('50');
  const [alsoLogTransaction, setAlsoLogTransaction] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (goal) {
      setAmount('50');
      setAlsoLogTransaction(true);
      setError('');
    }
  }, [goal]);

  if (!goal) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (!amount.trim() || Number.isNaN(val) || val <= 0) {
      setError('Please enter an amount greater than 0.');
      return;
    }
    onContribute(goal.id, Math.round(val * 100) / 100, alsoLogTransaction);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contribute-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 id="contribute-modal-title" className="text-lg font-display font-bold text-slate-900">
            Add Money to {goal.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add money dialog"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          <p className="text-sm text-slate-600 tabular-nums">
            Currently saved:{' '}
            <strong className="text-slate-900">
              {formatCurrency(goal.currentAmount, currency)}
            </strong>{' '}
            of {formatCurrency(goal.targetAmount, currency)}
          </p>

          <div>
            <label
              htmlFor="contribute-amount"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Amount to Add
            </label>
            <input
              id="contribute-amount"
              type="number"
              step="1"
              min="1"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError('');
              }}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            />
            {error && (
              <p role="alert" className="text-xs text-rose-600 mt-1">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {[25, 50, 100].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAmount(String(preset));
                  setError('');
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 tabular-nums whitespace-nowrap"
              >
                +{formatCurrency(preset, currency).replace('.00', '')}
              </button>
            ))}
          </div>

          <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={alsoLogTransaction}
              onChange={(e) => setAlsoLogTransaction(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
            />
            <span>Also record this as a Savings Transfer in my transaction history</span>
          </label>

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
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors whitespace-nowrap"
            >
              Add Money
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
