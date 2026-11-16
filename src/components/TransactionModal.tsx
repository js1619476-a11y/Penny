import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/categories';
import type { CategoryId, Transaction, TransactionType } from '../types/finance';
import { validateTransactionInput, type ValidationErrors } from '../utils/finance';

interface TransactionModalProps {
  isOpen: boolean;
  initialTransaction?: Transaction | null;
  defaultDate: string;
  onClose: () => void;
  onSave: (data: Omit<Transaction, 'id'>, existingId?: string) => void;
}

export function TransactionModal({
  isOpen,
  initialTransaction,
  defaultDate,
  onClose,
  onSave,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryId>('groceries');
  const [date, setDate] = useState(defaultDate);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (!isOpen) return;
    if (initialTransaction) {
      setType(initialTransaction.type);
      setDescription(initialTransaction.description);
      setAmount(String(initialTransaction.amount));
      setCategory(initialTransaction.category);
      setDate(initialTransaction.date);
      setNote(initialTransaction.note ?? '');
    } else {
      setType('expense');
      setDescription('');
      setAmount('');
      setCategory('groceries');
      setDate(defaultDate);
      setNote('');
    }
    setErrors({});
  }, [isOpen, initialTransaction, defaultDate]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const availableCategories =
    type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTypeSwitch = (nextType: TransactionType) => {
    setType(nextType);
    const nextCats = nextType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!nextCats.some((c) => c.id === category)) {
      setCategory(nextCats[0].id);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateTransactionInput({
      description,
      amount,
      type,
      category,
      date,
      note,
    });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSave(
      {
        description: description.trim(),
        amount: Math.round(Number(amount) * 100) / 100,
        type,
        category,
        date,
        note: note.trim() || undefined,
      },
      initialTransaction?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 id="tx-modal-title" className="text-lg font-display font-bold text-slate-900">
            {initialTransaction ? 'Edit Transaction' : 'Log a Transaction'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close transaction dialog"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          <div>
            <span className="block text-xs font-medium text-slate-600 mb-1.5">
              Transaction Type
            </span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleTypeSwitch('expense')}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  type === 'expense'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Money Out (Expense)
              </button>
              <button
                type="button"
                onClick={() => handleTypeSwitch('income')}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  type === 'income'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Money In (Income)
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="tx-description"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              What was this for?
            </label>
            <input
              id="tx-description"
              type="text"
              maxLength={120}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
              }}
              placeholder={
                type === 'income' ? 'e.g., Monthly Paycheck' : 'e.g., Neighborhood Groceries'
              }
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            />
            {errors.description && (
              <p role="alert" className="text-xs text-rose-600 mt-1">
                {errors.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="tx-amount"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Amount
              </label>
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                }}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              />
              {errors.amount && (
                <p role="alert" className="text-xs text-rose-600 mt-1">
                  {errors.amount}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="tx-date"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Date
              </label>
              <input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                }}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              />
              {errors.date && (
                <p role="alert" className="text-xs text-rose-600 mt-1">
                  {errors.date}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="tx-category"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Category
            </label>
            <select
              id="tx-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryId)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="tx-note"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Short Note (optional)
            </label>
            <input
              id="tx-note"
              type="text"
              maxLength={240}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (errors.note) setErrors((prev) => ({ ...prev, note: '' }));
              }}
              placeholder="Any helpful detail to remember later"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            />
            {errors.note && (
              <p role="alert" className="text-xs text-rose-600 mt-1">
                {errors.note}
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
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors whitespace-nowrap"
            >
              {initialTransaction ? 'Save Changes' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
